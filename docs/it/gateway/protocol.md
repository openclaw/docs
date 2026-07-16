---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema e dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame e versionamento'
title: Protocollo del Gateway
x-i18n:
    generated_at: "2026-07-16T14:23:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è l'unico piano di controllo e trasporto dei nodi per
OpenClaw. I client operatore e nodo (CLI, interfaccia web, app macOS, nodi iOS/Android,
nodi headless) si connettono tramite WebSocket e dichiarano un **ruolo** e un **ambito** al
momento dell'handshake.

## Trasporto e framing

- WebSocket, frame di testo, payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame precedenti alla connessione sono limitati a 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Dopo
  l'handshake, vengono applicati `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata, i frame
  in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large` prima
  che il Gateway chiuda la connessione o scarti il frame. Questi eventi includono `surface`, dimensioni
  in byte, limiti e un codice motivo sicuro, mai corpi dei messaggi, contenuti
  degli allegati, byte grezzi dei frame, token, cookie o segreti.

Formati dei frame:

- Richiesta: `{type:"req", id, method, params}`
- Risposta: `{type:"res", id, ok, payload|error}`
- Evento: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono chiavi di idempotenza (vedere lo schema).

## Handshake

Il Gateway invia una richiesta di verifica precedente alla connessione:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Il client risponde con `connect`:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Il Gateway risponde con `hello-ok`:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, `policy` e `auth` sono tutti richiesti da
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
riporta il ruolo e gli ambiti negoziati anche quando non viene emesso alcun token del dispositivo (formato
illustrato sopra). `pluginSurfaceUrls` è facoltativo e associa i nomi delle superfici dei Plugin (ad esempio
`canvas`) a URL ospitati con ambito; può scadere, quindi i nodi chiamano
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ottenere una nuova voce.
Il percorso deprecato `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
non è supportato; utilizzare le superfici dei Plugin.
Il campo facoltativo `appliedConfigHash` dello snapshot è la revisione risolta della configurazione sorgente
accettata dal runtime Gateway attivo. I client possono confrontarla con
`config.get.configRevisionHash` per determinare se una configurazione salvata più recente richieda ancora
un riavvio. `config.get.hash` rimane la revisione non elaborata del file radice utilizzata dalle
protezioni contro i conflitti di scrittura della configurazione.

Mentre il Gateway sta ancora completando l'avvio dei processi ausiliari, `connect` può restituire un
errore ripetibile `UNAVAILABLE` con `details.reason: "startup-sidecars"` e
`retryAfterMs`. Riprovare entro il budget temporale della connessione anziché considerarlo
un errore terminale dell'handshake.

Quando viene emesso un token del dispositivo, `hello-ok.auth` lo aggiunge:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Il bootstrap integrato tramite codice QR/codice di configurazione è un percorso di passaggio ai dispositivi mobili. Una connessione
di base riuscita mediante codice di configurazione restituisce un token del nodo principale e un token
operatore con ambito limitato:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Questo passaggio all'operatore è intenzionalmente limitato: è sufficiente per avviare il ciclo
dell'operatore mobile e la configurazione nativa, incluso `operator.talk.secrets` per le letture della
configurazione Talk, ma non include ambiti per modificare l'associazione né `operator.admin`. Un accesso
più ampio all'associazione/amministrazione richiede un flusso separato di associazione approvata o di token. Rendere persistente
`hello-ok.auth.deviceTokens` solo quando l'autenticazione bootstrap è stata eseguita tramite un trasporto
attendibile (`wss://` o associazione loopback/locale).

I client backend attendibili nello stesso processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) possono omettere `device` nelle connessioni loopback dirette quando
si autenticano con il token/la password condivisi del Gateway. Questo percorso è riservato
alle RPC interne del piano di controllo (ad esempio gli aggiornamenti delle sessioni dei sottoagenti) ed evita
che le baseline obsolete di associazione CLI/dispositivo blocchino il lavoro del backend locale. I client remoti,
con origine nel browser, nodo e quelli che usano esplicitamente token del dispositivo/identità del dispositivo continuano
a essere sottoposti ai normali controlli di associazione e aggiornamento degli ambiti.

### Ruolo worker e protocollo chiuso

I worker cloud utilizzano un ingresso loopback dedicato tramite il tunnel SSH di proprietà del Gateway
con chiave host fissata. Accetta solo l'identità del worker e non inoltra mai
autenticazione generale, eventi dei nodi, RPC degli operatori o metodi dei Plugin. Un rigoroso `connect`
verifica una credenziale di breve durata, memorizzata sotto forma di hash e vincolata all'ambiente, all'hash
del bundle, all'epoca del proprietario, alla versione dell'insieme RPC, alla scadenza e a un'unica sessione nullable; inoltre
verifica separatamente la versione corrente e l'insieme di funzionalità. In caso di successo restituisce un
`worker-hello-ok` minimo; la negoziazione delle funzionalità è indipendente dalla versione generale del
protocollo. I frame rimangono al di sotto di 64 KiB, tranne un frame `worker.inference.start`
negoziato che può raggiungere 25 MiB. L'elenco consentito chiuso contiene `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` e
`worker.inference.cancel`.

I commit delle trascrizioni utilizzano il fencing dell'epoca del proprietario, un'associazione della sessione di proprietà del Gateway,
un compare-and-swap della foglia di base e la riproduzione durevole della sequenza; il Gateway genera
gli ID delle voci e dei genitori della trascrizione tramite il normale writer di sessione. La proprietà e
la scadenza vengono verificate nuovamente a ogni RPC.

### Funzionalità dei client

I client operatore possono dichiarare funzionalità facoltative in `connect.params.caps`:

- `tool-events`: accetta eventi strutturati del ciclo di vita degli strumenti.
- `inline-widgets`: può visualizzare i risultati degli strumenti dei widget inline ospitati.

Le funzionalità del client descrivono il client connesso, non l'autorizzazione. Gli strumenti degli agenti possono dichiarare le funzionalità richieste; il Gateway omette tali strumenti a meno che ogni requisito non sia presente in `caps` del client di origine. Le esecuzioni originate dai canali non hanno funzionalità del client Gateway, quindi gli strumenti vincolati alle funzionalità non sono disponibili anche quando la policy degli strumenti li consente esplicitamente.

### Esempio di connessione di un nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

I nodi dichiarano le attestazioni delle funzionalità al momento della connessione:

- `caps`: categorie di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: elenco consentito dei comandi per l'invocazione.
- `permissions`: opzioni granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway le considera attestazioni e applica elenchi consentiti lato server.

## Ruoli e ambiti

Per il modello completo degli ambiti dell'operatore, i controlli al momento dell'approvazione e la semantica
dei segreti condivisi, vedere [Ambiti dell'operatore](/it/gateway/operator-scopes).

Ruoli:

- `operator`: client del piano di controllo (CLI/interfaccia utente/automazione).
- `node`: host delle funzionalità (camera/schermo/canvas/system.run).
- `worker`: host di esecuzione cloud sul protocollo worker dedicato e chiuso.

Ambiti dell'operatore (`src/gateway/operator-scopes.ts`), l'insieme chiuso completo:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets` (oppure
`operator.admin`). Quando sono inclusi i segreti, leggere la credenziale attiva del provider Talk
da `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
mantiene il formato della sorgente e può essere un oggetto SecretRef oppure una stringa oscurata.

I metodi RPC del Gateway registrati dai Plugin possono richiedere un proprio ambito operatore,
ma questi prefissi riservati del core vengono sempre risolti in `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando: le scritture persistenti `/config set` e
`/config unset` richiedono `operator.admin` anche per i client del Gateway che
dispongono già di un ambito operatore inferiore.

`node.pair.approve` prevede un ulteriore controllo dell'ambito al momento dell'approvazione, oltre all'ambito
di base del metodo (`operator.pairing`), in funzione del valore `commands` dichiarato
dalla richiesta in sospeso (`src/infra/node-pairing-authz.ts`):

| Comandi dichiarati                                                                                                            | Ambiti richiesti                      |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| nessuno                                                                                                                       | `operator.pairing`                    |
| comandi ordinari                                                                                                              | `operator.pairing` + `operator.write` |
| include `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` oppure `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Funzionalità/comandi/autorizzazioni (nodo)

I nodi dichiarano le attestazioni delle funzionalità al momento della connessione:

- `caps`: categorie di funzionalità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: elenco consentito dei comandi per l'invocazione.
- `permissions`: opzioni granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **dichiarazioni** e applica allowlist lato server.
I nodi connessi possono pubblicare descrittori facoltativi, visibili all'agente, di Plugin o strumenti MCP
con `node.pluginTools.update` dopo una connessione o
riconnessione riuscita. Gli host dei nodi headless vengono riavviati per applicare le modifiche
dichiarative all'inventario MCP. Questo metodo di aggiornamento è l'unico percorso di pubblicazione; i descrittori degli strumenti dei Plugin non sono accettati nei
parametri `connect`. Ogni descrittore deve usare un `name` dello strumento sicuro per il provider e indicare
un `command` presente nell'allowlist dei comandi corrente del nodo. Il Gateway considera attendibili i metadati dei descrittori
provenienti dal nodo associato, filtra i descrittori esterni alla superficie dei comandi
approvata, li rimuove quando il nodo si disconnette e rifiuta i tentativi dell'operatore
di modificare il catalogo di un altro nodo. Impostare `gateway.nodes.pluginTools.enabled: false`
per ignorare i descrittori pubblicati dai nodi.

Gli host dei nodi connessi pubblicano il proprio catalogo completo di sostituzione delle skill con
`node.skills.update`. Questo metodo del ruolo nodo è l'unico percorso di pubblicazione
delle skill del nodo; le skill non sono accettate nei parametri `connect`. Ogni descrittore contiene
un nome sicuro, una descrizione e contenuto `SKILL.md` limitato. Il Gateway analizza tale
contenuto con il normale caricatore delle skill, lo include nelle istantanee delle skill dell'agente
mentre il nodo è connesso e lo rimuove alla disconnessione. Impostare
`gateway.nodes.skills.enabled: false` per ignorare le skill pubblicate dai nodi.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo, inclusi
  `deviceId`, `roles` e `scopes`, affinché le UI possano mostrare una riga per dispositivo anche
  quando si connette sia come operatore sia come nodo.
- `node.list` include `lastSeenAtMs` e `lastSeenReason` facoltativi. I nodi
  connessi segnalano l'ora della connessione corrente con il motivo `connect`; i nodi associati possono
  inoltre segnalare una presenza persistente in background tramite un evento attendibile del nodo.

I nodi macOS nativi possono inoltre inviare eventi `node.presence.activity` autenticati
con un tempo di inattività dell'input limitato. Il Gateway ricava i timestamp dell'attività usando il
proprio orologio, espone il Mac connesso più recente tramite `node.list` e
`node.describe` e trasmette gli aggiornamenti `node.presence` ai client con ambito di lettura.
Consultare [Presenza del computer attivo](/nodes/presence) per il comportamento relativo a selezione, privacy, contesto del modello
e instradamento delle notifiche.

### Evento di attività in background del nodo

I nodi chiamano `node.event` con `event: "node.presence.alive"` per registrare che un
nodo associato era attivo durante una riattivazione in background, senza contrassegnarlo come connesso:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un'enumerazione chiusa: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. I valori sconosciuti vengono normalizzati in
`background` (`src/shared/node-presence.ts`). L'evento viene reso persistente solo per
sessioni autenticate di dispositivi nodo; le sessioni senza dispositivo o non associate restituiscono
`handled: false`.

I Gateway che completano correttamente l'operazione restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I Gateway meno recenti possono restituire solo `{ "ok": true }` per `node.event`; considerarlo
un RPC confermato, non una persistenza durevole della presenza.

## Definizione dell'ambito degli eventi broadcast

Gli eventi broadcast inviati dal server sono vincolati all'ambito, affinché le sessioni
limitate all'associazione o riservate ai nodi non ricevano passivamente il contenuto delle sessioni
(`src/gateway/server-broadcast.ts`):

- I frame di chat, agente e risultati degli strumenti (eventi `agent` trasmessi in streaming, eventi dei risultati degli strumenti)
  richiedono almeno `operator.read`. Le sessioni che ne sono prive ignorano completamente questi
  frame.
- I broadcast `plugin.*` definiti dai Plugin sono limitati per impostazione predefinita a `operator.write` o
  `operator.admin`; le voci esplicite come
  `plugin.approval.requested` / `plugin.approval.resolved` usano invece
  `operator.approvals`.
- Gli eventi di stato/trasporto (`heartbeat`, `presence`, `tick`, ciclo di vita di connessione/disconnessione)
  rimangono senza restrizioni, affinché l'integrità del trasporto sia osservabile da ogni
  sessione autenticata.
- Le famiglie sconosciute di eventi broadcast sono vincolate all'ambito per impostazione predefinita (chiusura in caso di errore),
  salvo che un gestore registrato non le renda esplicitamente meno restrittive.

Ogni connessione client mantiene il proprio numero di sequenza per client, quindi i broadcast
rimangono ordinati in modo monotono su quel socket anche quando client diversi vedono
sottoinsiemi differenti del flusso di eventi filtrati per ambito.

## Famiglie di metodi RPC

`hello-ok.features.methods` è un elenco di rilevamento prudenziale costruito da
`src/gateway/server-methods-list.ts` più le esportazioni dei metodi dei Plugin/canali
caricati: non è un dump generato di ogni metodo e alcuni metodi (ad
esempio `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sono intenzionalmente esclusi dal rilevamento, sebbene siano metodi reali e
richiamabili. Va considerato come rilevamento delle funzionalità, non come enumerazione completa di
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce l'istantanea dello stato del Gateway memorizzata nella cache o appena verificata.
    - `diagnostics.stability` restituisce il recente registro diagnostico limitato della stabilità: nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di code/sessioni, nomi di canali/Plugin e ID delle sessioni. Non include testo delle chat, corpi dei Webhook, output degli strumenti, corpi non elaborati di richieste/risposte, token, cookie o segreti. Richiede `operator.read`.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono disponibili solo per i client operatore con ambito amministrativo.
    - `gateway.identity.get` restituisce l'identità del dispositivo Gateway usata dai flussi di inoltro e associazione.
    - `system-presence` restituisce l'istantanea della presenza corrente per i dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto della presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat reso persistente.
    - `set-heartbeats` attiva o disattiva l'elaborazione degli Heartbeat sul Gateway.
    - `gateway.suspend.prepare` crea una breve concessione di sospensione cooperativa solo quando il lavoro del Gateway monitorato è inattivo. `gateway.suspend.status` verifica tale concessione e `gateway.suspend.resume` la rilascia dopo la riattivazione o l'interruzione di un'operazione dell'host.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti in fase di runtime. Consultare le viste "`models.list`" di seguito.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo e della quota rimanente dei provider.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date. Passare `agentId` per un agente oppure `agentScope: "all"` per aggregare gli agenti configurati.
    - `doctor.memory.status` restituisce lo stato di preparazione della memoria vettoriale / degli embedding memorizzati nella cache per lo spazio di lavoro dell'agente predefinito attivo. Passare `{ "probe": true }` o `{ "deep": true }` solo per un ping esplicito in tempo reale del provider di embedding. Passare `{ "agentId": "agent-id" }` per limitare le statistiche dell'archivio Dreaming allo spazio di lavoro di un agente; omettendolo, vengono aggregati gli spazi di lavoro Dreaming configurati.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` accettano `{ "agentId": "agent-id" }` facoltativo; se omesso, operano sullo spazio di lavoro dell'agente predefinito configurato.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per i client remoti del piano di controllo, inclusi percorsi degli spazi di lavoro, frammenti di memoria, Markdown renderizzato e fondato e candidati alla promozione approfondita. Richiede `operator.read`.
    - `sessions.usage` restituisce riepiloghi dell'utilizzo per sessione. Passare `agentId` per un agente oppure `agentScope: "all"` per elencare insieme gli agenti configurati.
      Entrambi i metodi di utilizzo accettano `mode: "specific"` con un `timeZone` IANA per limiti e intervalli dei giorni di calendario che tengono conto dell'ora legale. `utcOffset` rimane supportato per i client meno recenti e come fallback quando il runtime del Gateway non riconosce il fuso orario richiesto.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del registro di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e strumenti di accesso">
    - `channels.status` restituisce i riepiloghi dello stato dei canali/Plugin integrati e inclusi nel bundle.
    - `channels.logout` disconnette un canale/account specifico, se il canale lo supporta.
    - `web.login.start` avvia un flusso di accesso tramite QR/Web per il provider corrente del canale Web compatibile con QR.
    - `web.login.wait` attende il completamento di tale flusso e, in caso di esito positivo, avvia il canale.
    - `push.test` invia una notifica push APNs di prova a un nodo iOS registrato.
    - `voicewake.get` restituisce le parole di attivazione memorizzate.
    - `voicewake.set` aggiorna le parole di attivazione e trasmette la modifica.

  </Accordion>

  <Accordion title="Gestione dei Plugin">
    - `plugins.list` (`operator.read`) restituisce l'inventario dei Plugin installati, oltre a una selezione locale curata di opzioni ufficiali, la diagnostica e l'indicazione se la modalità di installazione corrente consente modifiche.
    - `plugins.search` (`operator.read`) cerca famiglie installabili di Plugin di codice e Plugin bundle di ClawHub. Passare un `query` non vuoto e un `limit` facoltativo da 1 a 100.
    - `plugins.install` (`operator.admin`) installa una voce del catalogo ufficiale con `{ source: "official", pluginId }` oppure un pacchetto ClawHub con `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. Le installazioni ClawHub mantengono i controlli del Gateway relativi ad attendibilità, integrità e criteri di installazione. Le installazioni riuscite richiedono il riavvio del Gateway.
    - `plugins.setEnabled` (`operator.admin`) modifica i criteri di abilitazione di un Plugin installato tramite `{ pluginId, enabled }`. La risposta include la voce di catalogo aggiornata, i metadati del riavvio e gli eventuali avvisi relativi alla selezione degli slot.
    - `plugins.uninstall` (`operator.admin`) rimuove un Plugin installato esternamente tramite `{ pluginId }`: riferimenti di configurazione, record di installazione e file gestiti. I Plugin inclusi nel bundle non possono essere disinstallati, ma solo disabilitati. La risposta elenca le azioni di rimozione e richiede sempre il riavvio del Gateway.

  </Accordion>

  <Accordion title="Messaggistica e registri">
    - `send` è l'RPC di consegna diretta in uscita per invii destinati a canali/account/thread al di fuori dell'esecutore della chat.
    - `logs.tail` restituisce la coda del registro su file configurato del Gateway, con controlli su cursore/limite e numero massimo di byte.

  </Accordion>

  <Accordion title="Terminale dell'operatore">
    - `terminal.open` avvia una PTY host per un `agentId` esplicito o per l'agente predefinito e restituisce l'agente risolto, la directory di lavoro, la shell e lo stato di confinamento.
    - `terminal.input`, `terminal.resize` e `terminal.close` operano solo sulle sessioni appartenenti alla connessione chiamante.
    - `terminal.upload` accetta un file in base64 fino a 16 MiB, lo deposita in una directory temporanea privata con durata di 24 ore sull'host del Gateway della sessione o del nodo associato e restituisce il percorso assoluto. Il chiamante deve comunque incollare o utilizzare in altro modo tale percorso; l'RPC non scrive mai input nel terminale né esegue un comando.
    - Gli eventi `terminal.data` e `terminal.exit` vengono trasmessi solo alla connessione proprietaria della sessione.
    - Le sessioni la cui connessione si interrompe vengono disconnesse, non terminate: rimangono ricollegabili per `gateway.terminal.detachedSessionTimeoutSeconds` (valore predefinito 300; `0` ripristina la terminazione alla disconnessione), mentre l'output recente si accumula in un buffer limitato lato server.
    - `terminal.list` restituisce le sessioni collegabili; `terminal.attach` riassegna una sessione attiva o disconnessa alla connessione chiamante e restituisce il buffer di riproduzione (subentro in stile tmux: un precedente proprietario attivo riceve `terminal.exit` con motivo `detached`); `terminal.text` legge il buffer come testo normale senza collegarsi.
    - Ogni metodo del terminale richiede `operator.admin`; `gateway.terminal.enabled` deve essere esplicitamente impostato su true. Gli agenti completamente isolati vengono rifiutati e una modifica dei criteri dell'agente chiude le PTY esistenti e in corso, incluse quelle disconnesse.

  </Accordion>

  <Accordion title="Conversazione e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider di conversazione per sintesi vocale, trascrizione in streaming e voce in tempo reale: ID canonici dei provider, alias del registro, etichette, stato di configurazione, un risultato facoltativo `ready` a livello di gruppo, ID esposti di modelli e voci, modalità canoniche, trasporti, strategie del motore e indicatori delle funzionalità e dell'audio in tempo reale, senza restituire i segreti dei provider né modificare la configurazione globale. I Gateway attuali impostano `ready` dopo aver applicato la selezione del provider in fase di esecuzione; sui Gateway meno recenti, la sua assenza va considerata come non verificata.
    - `talk.config` restituisce il payload effettivo della configurazione di conversazione; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione di conversazione gestita dal Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Per `stt-tts/managed-room`, i chiamanti `operator.write` che passano `sessionKey` devono passare anche `spawnedBy` per la visibilità con ambito della chiave di sessione; la creazione di `sessionKey` senza ambito e `brain: "direct-tools"` richiedono `operator.admin`.
    - `talk.session.join` convalida un token di sessione di una stanza gestita, emette `session.ready` o `session.replaced` secondo necessità e restituisce i metadati della stanza e della sessione insieme agli eventi di conversazione recenti, senza mai restituire il token in testo normale né il relativo hash.
    - `talk.session.appendAudio` aggiunge audio di ingresso PCM in base64 alle sessioni di inoltro in tempo reale e di trascrizione gestite dal Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` gestiscono il ciclo di vita dei turni delle stanze gestite, rifiutando i turni obsoleti prima dell'azzeramento dello stato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione tramite voce regolata da VAD nelle sessioni di inoltro del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a uno strumento del provider emessa da una sessione di inoltro in tempo reale gestita dal Gateway. La richiesta attende qualsiasi segnale di completamento asincrono esposto dal bridge del provider; gli invii non riusciti mantengono attiva l'esecuzione collegata e non emettono un evento di risultato dello strumento riuscito. Passare `options: { willContinue: true }` per l'output intermedio dello strumento oppure `options: { suppressResponse: true }` quando il bridge del provider dichiara il supporto alla soppressione e il risultato non deve avviare un'altra risposta.
    - `talk.session.steer` invia il controllo vocale dell'esecuzione attiva a una sessione di conversazione basata su agente e gestita dal Gateway: `{ sessionId, text, mode? }`, dove `mode` è `status`, `steer`, `cancel` o `followup`; se la modalità viene omessa, viene classificata in base al testo pronunciato.
    - `talk.session.close` chiude una sessione di inoltro, trascrizione o stanza gestita appartenente al Gateway ed emette gli eventi terminali di conversazione.
    - `talk.mode` imposta e trasmette lo stato corrente della modalità di conversazione ai client WebChat/Control UI.
    - `talk.client.create` crea una sessione del provider in tempo reale appartenente al client tramite `webrtc` o `provider-websocket`, mentre il Gateway gestisce configurazione, credenziali, istruzioni e criteri degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale appartenenti al client di inoltrare le chiamate agli strumenti del provider ai criteri del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID di esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.client.steer` invia il controllo vocale dell'esecuzione attiva per i trasporti in tempo reale appartenenti al client. Il Gateway risolve l'esecuzione incorporata attiva da `sessionKey` e restituisce un risultato strutturato di accettazione o rifiuto invece di ignorare silenziosamente il controllo.
    - `talk.event` è l'unico canale degli eventi di conversazione per gli adattatori in tempo reale, trascrizione, STT/TTS, stanze gestite, telefonia e riunioni.
    - `talk.speak` sintetizza la voce tramite il provider vocale di conversazione attivo.
    - `tts.status` restituisce lo stato di abilitazione del TTS, il provider attivo, i provider di ripiego e lo stato di configurazione dei provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano o disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione una tantum da testo a voce.
    - `tts.speak` (`operator.write`) elabora un `text` non vuoto tramite la catena configurata dei provider TTS generali e restituisce un intero clip inline come `audioBase64`, oltre a `provider` e ai metadati facoltativi `outputFormat`, `mimeType` e `fileExtension`. A differenza di `tts.convert`, non restituisce un percorso locale al Gateway; a differenza di `talk.speak`, non richiede un provider di conversazione. Il testo oltre `messages.tts.maxTextLength` restituisce `INVALID_REQUEST`; gli errori di sintesi restituiscono `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve nuovamente i SecretRef attivi e sostituisce lo stato dei segreti in fase di esecuzione solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni dei segreti delle destinazioni dei comandi per uno specifico insieme di comandi e destinazioni.
    - `config.get` restituisce l'istantanea corrente della configurazione su disco, il `hash` grezzo del file radice, il `configRevisionHash` risolto e il `appliedConfigHash` facoltativo per la revisione risolta accettata dal runtime del Gateway attivo.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione. La sostituzione distruttiva di un array richiede il percorso interessato in `replacePaths`; gli array annidati nelle voci di un array usano percorsi `[]`, come `agents.list[].skills`.
    - `config.apply` convalida e sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione attivo utilizzato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione, metadati di generazione e, quando caricabili, metadati degli schemi dei Plugin e dei canali. Include i metadati `title` / `description` provenienti dalle stesse etichette e dallo stesso testo della guida dell'interfaccia utente, incluse le diramazioni di composizione per oggetti annidati, caratteri jolly, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione corrispondente per i campi.
    - `config.schema.lookup` restituisce un payload di ricerca con ambito limitato a un percorso per un singolo percorso di configurazione: percorso normalizzato, nodo dello schema superficiale, suggerimento corrispondente e `hintPath`, `reloadKind` facoltativo e riepiloghi dei figli immediati per l'esplorazione dettagliata tramite interfaccia utente/CLI. `reloadKind` è uno tra `restart`, `hot` o `none` (`src/config/schema.ts`) e rispecchia il pianificatore di ricaricamento della configurazione del Gateway per il percorso richiesto. I nodi dello schema di ricerca mantengono la documentazione rivolta all'utente e i comuni campi di convalida (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici, di stringa, array e oggetti, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, `reloadKind` facoltativo, oltre ai corrispondenti `hint` / `hintPath`.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo se l'aggiornamento riesce; i chiamanti con una sessione possono includere `continuationMessage` affinché, all'avvio, venga ripreso un turno successivo dell'agente tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore dei pacchetti e gli aggiornamenti supervisionati di un checkout Git dal piano di controllo utilizzano un passaggio di consegne a un servizio gestito separato, anziché sostituire l'albero dei pacchetti o modificare il checkout o l'output di compilazione all'interno del Gateway attivo. Un passaggio di consegne avviato restituisce `ok: true` con `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; i passaggi di consegne non disponibili o non riusciti restituiscono `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, oltre a `handoff.command` quando è necessario un aggiornamento manuale dalla shell. Non disponibile significa che OpenClaw non dispone di un confine di supervisione sicuro o di un'identità di servizio persistente, ad esempio `OPENCLAW_SYSTEMD_UNIT` per systemd. Durante un passaggio di consegne avviato, la sentinella di riavvio può segnalare brevemente `stats.reason: "restart-health-pending"`; la continuazione viene ritardata finché la CLI non verifica il Gateway riavviato e scrive la sentinella finale `ok`.
    - `update.status` aggiorna e restituisce la sentinella più recente del riavvio per aggiornamento, inclusa la versione in esecuzione dopo il riavvio, quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agent e workspace">
    - `agents.list` restituisce le voci degli agent configurati, inclusi il modello effettivo e i metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agent e il collegamento dei workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file del workspace di bootstrap esposti a un agent.
    - `audit.activity.list` restituisce il registro delle attività con versione e contenente solo metadati; `audit.list` rimane l'RPC di esecuzione/strumento compatibile in modo sicuro.
    - `agents.workspace.list` e `agents.workspace.get` (`operator.read`) consentono ai client nel dominio dell'operatore attendibile descritto in [Ambiti dell'operatore](/it/gateway/operator-scopes) di esplorare in sola lettura e con paginazione la directory del workspace di un agent. Le richieste accettano solo percorsi relativi al workspace; le letture restano confinate alla radice del workspace risolta nel percorso reale (i tentativi di evasione tramite collegamenti simbolici e hard link vengono rifiutati), sono soggette a un limite di dimensione e sono limitate al testo UTF-8 e ai tipi di immagine comuni (base64). Le risposte non espongono il percorso del workspace sull'host. In questo namespace non sono presenti operazioni di scrittura.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro delle attività del Gateway ai client SDK e operatore. Consultare [RPC del registro delle attività](#task-ledger-rpcs) di seguito.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo i contenuti multimediali della trascrizione con provenienza corrispondente; le origini URL non sicure o locali restituiscono download non supportati anziché essere recuperate lato server.
    - `environments.list` e `environments.status` preservano il rilevamento dell'ambiente locale del Gateway e del Node. I worker cloud configurati e i record durevoli lasciati da profili precedenti aggiungono metadati `worker` con `providerId`, `leaseId` facoltativo, `state`, `ageMs`, `idleMs` facoltativo e `attachedSessionIds`. Gli stati del ciclo di vita dei worker sono `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` e `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) effettua il provisioning di un worker da un profilo configurato del provider del plugin; i nuovi tentativi con la stessa chiave riutilizzano l'operazione durevole. `environments.destroy` (`{ environmentId }`) richiede la dismissione idempotente di un ambiente worker durevole. Entrambe richiedono `operator.admin`, sono scritture del piano di controllo e restituiscono la stessa struttura di riepilogo dell'ambiente utilizzata dalle risposte di stato.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agent o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce l'istantanea terminale, quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice corrente delle sessioni, inclusi i metadati `agentRuntime` per ogni riga quando è configurato un backend di runtime per agent. Quando è abilitato il posizionamento sui worker cloud o esiste uno stato di ripristino durevole, le righe delle sessioni includono anche uno stato chiuso `placement` (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` o `failed`) oltre a campi specifici dello stato relativi ad ambiente, epoca del proprietario, workspace, bundle, cursore ACK o ripristino.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione. Passare `includeApprovals: true` per ricevere anche eventi del ciclo di vita `session.approval` sanificati relativi alle approvazioni il cui pubblico persistente include esattamente tale sessione e il cui vincolo del revisore autorizza il client sottoscritto. La risposta alla sottoscrizione include quindi un elemento in sospeso `approvalReplay` con dimensione limitata; è autorevole quando `truncated` è false. L'adesione si applica alla singola chiamata di sottoscrizione e non è persistente: una nuova sottoscrizione alla stessa sessione senza `includeApprovals: true` rimuove una sottoscrizione alle approvazioni esistente. Oltre alla normale autorità di lettura della sessione, questa adesione richiede `operator.admin`, oppure `operator.approvals` su un dispositivo associato.
    - `sessions.preview` restituisce anteprime limitate delle trascrizioni per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione del Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o rende canonica una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione. I valori facoltativi `model` e `thinkingLevel` rendono persistenti in modo atomico le impostazioni iniziali sostitutive del modello e del ragionamento. `worktree: true` effettua il provisioning di un worktree gestito; i valori facoltativi `worktreeBaseRef`/`worktreeName` selezionano il riferimento di base e il nome del branch, mentre `execNode` (`operator.admin`) associa l'esecuzione della sessione a un host Node. Il worktree creato viene riportato nel risultato e reso persistente nella riga della sessione (`worktree: { id, branch, repoRoot }`). Quando la voce viene creata ma il relativo `chat.send` iniziale annidato viene rifiutato, il risultato positivo include `runStarted: false` e `runError`; i client possono conservare il prompt e riprovare usando la chiave di sessione restituita.
    - `sessions.dispatch` (`operator.admin`) sposta una sessione OpenClaw locale esistente, dotata di un worktree gestito di proprietà della sessione, in un profilo worker cloud configurato. Passare `{ key, profileId, agentId? }`. Il metodo non è disponibile quando non è configurato alcun profilo worker, interrompe l'ammissione locale dei turni prima di attendere il completamento del lavoro attivo e restituisce il risultato solo dopo che il posizionamento ha raggiunto la proprietà del worker `active`. L'invio è unidirezionale; il trasferimento di ritorno dal worker all'ambiente locale non fa parte di questa RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` e `sessions.groups.delete` gestiscono il catalogo personalizzato dei gruppi di sessioni di proprietà del Gateway (nomi + ordine di visualizzazione). L'appartenenza rimane nel campo `category` di ciascuna sessione; la ridenominazione e l'eliminazione aggiornano lato server le sessioni appartenenti al gruppo.
    - `sessions.send` invia un messaggio a una sessione esistente.
    - `sessions.steer` è la variante che interrompe e reindirizza una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo di una sessione. Passare `key` con `runId` facoltativo, oppure soltanto `runId` per le esecuzioni attive che il Gateway può ricondurre a una sessione.
    - `sessions.patch` aggiorna i metadati e le impostazioni sostitutive della sessione e restituisce il modello canonico risolto insieme al valore effettivo di `agentRuntime`.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione delle sessioni.
    - `sessions.get` restituisce l'intera riga di sessione archiviata.
    - L'esecuzione della chat continua a usare `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` viene normalizzato per la visualizzazione nei client UI: i tag delle direttive inline vengono rimossi dal testo visibile; vengono rimossi i payload XML delle chiamate agli strumenti in testo normale (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati) e i token di controllo del modello ASCII/a larghezza intera fuoriusciti; le righe dell'assistente contenenti esclusivamente token silenziosi (`NO_REPLY` / `no_reply` esatti) vengono omesse e le righe di dimensioni eccessive possono essere sostituite da segnaposto.
    - `chat.message.get` è il lettore aggiuntivo e limitato dei messaggi completi per una singola voce visibile della trascrizione. Passare `sessionKey`, `agentId` facoltativo quando la selezione della sessione è limitata all'agent e un `messageId` della trascrizione precedentemente esposto tramite `chat.history`; il Gateway restituisce la stessa proiezione normalizzata per la visualizzazione senza il limite di troncamento della cronologia leggera, purché la voce archiviata sia ancora disponibile e non abbia dimensioni eccessive.
    - `chat.toolTitles` restituisce brevi titoli descrittivi per le chiamate agli strumenti visualizzate nella Control UI (in batch, massimo 24 elementi con input limitati). La funzionalità richiede l'adesione tramite `gateway.controlUi.toolTitles` (disattivata per impostazione predefinita); i Gateway in cui è disabilitata rispondono a `{ titles: {}, disabled: true }` senza effettuare chiamate al modello, in modo che i client smettano di inviare richieste. Quando è abilitata, i titoli utilizzano l'instradamento standard del modello di utilità: un `utilityModel` configurato esplicitamente (una decisione dell'operatore che, come per tutte le attività di utilità, può inviare contenuti limitati dell'attività al provider selezionato), altrimenti il modello piccolo predefinito dichiarato dal provider della sessione, affinché non venga introdotta implicitamente una nuova destinazione di uscita; un `utilityModel` vuoto li disabilita completamente. I titoli non ricorrono mai al modello principale. I risultati vengono memorizzati nella cache del database di stato per agent, indicizzati per nome dello strumento + input, quindi le visualizzazioni ripetute non addebitano mai nuovamente le stesse chiamate.
    - `chat.send` accetta `fastMode: "auto"` per un singolo turno per utilizzare la modalità rapida nelle chiamate al modello avviate prima del limite automatico, quindi avviare senza modalità rapida i tentativi successivi, i fallback, i risultati degli strumenti o le chiamate di continuazione. Il limite predefinito è 60 secondi (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) e può essere configurato per ogni modello con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un chiamante `chat.send` può passare `fastAutoOnSeconds` per un singolo turno per sostituire il limite per tale richiesta. Passare `queueMode` (`steer`, `followup`, `collect` o `interrupt`) per sostituire la modalità della coda archiviata soltanto per questa richiesta; le azioni di reindirizzamento esplicite della Control UI utilizzano `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Associazione dei dispositivi e token dei dispositivi">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.setupCode` crea un codice di configurazione per dispositivi mobili e, per impostazione predefinita, un URL dati di un codice QR PNG. Richiede `operator.admin` ed è intenzionalmente omesso dal rilevamento pubblicizzato. Il risultato include `setupCode`, `qrDataUrl` facoltativo, `gatewayUrl`, l'etichetta non segreta `auth` e `urlSource`.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.pair.rename` assegna un'etichetta dell'operatore (`{ deviceId, label }`) che ha la precedenza sul nome visualizzato comunicato dal client e viene mantenuta dopo la riparazione o la nuova approvazione del dispositivo.
    - `device.token.rotate` ruota il token di un dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca il token di un dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.

    Il codice di configurazione incorpora una credenziale di bootstrap di breve durata. I client non devono
    registrarla né renderla persistente oltre il flusso di associazione.

  </Accordion>

  <Accordion title="Associazione dei Node, invocazione e lavoro in sospeso">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.remove` gestiscono le approvazioni delle funzionalità dei Node. `node.pair.request` e `node.pair.verify` sono stati rimossi nella versione 2026.7 insieme all'archivio autonomo per l'associazione dei Node; le richieste in sospeso vengono create dal Gateway durante le connessioni dei Node.
    - `node.list` e `node.describe` restituiscono lo stato dei Node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un Node associato.
    - `node.invoke` inoltra un comando a un Node connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta di invocazione.
    - `mcp.tools.call.v1` è il comando dell'host Node headless per chiamare uno strumento MCP locale del Node configurato. Viene trasmesso tramite `node.invoke`, richiede che il Node dichiari il comando e rimane soggetto all'approvazione dell'associazione e a `gateway.nodes.denyCommands`.
    - `node.event` riporta nel Gateway gli eventi originati dai Node.
    - `node.pluginTools.update` è l'unico percorso di pubblicazione per sostituire i descrittori degli strumenti Plugin/MCP del Node connesso visibili all'agente; i parametri `connect` non li includono.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei Node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per i Node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazioni">
    - `approval.get` e `approval.resolve` sono i metodi di approvazione durevole indipendenti dal tipo (ambito `operator.approvals`). `approval.get` restituisce una proiezione sanificata, in sospeso o terminale conservata, con un valore `urlPath` stabile; `approval.resolve` accetta l'ID di approvazione canonico, un valore `kind` esplicito e una decisione, applica la risoluzione in cui prevale la prima risposta e restituisce sempre il risultato canonico registrato.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` gestiscono le richieste di approvazione una tantum per l'esecuzione, oltre alla ricerca e alla riproduzione delle approvazioni in sospeso. Sono adattatori al confine del protocollo basati sullo stesso registro durevole delle approvazioni.
    - `exec.approval.waitDecision` attende una singola approvazione di esecuzione in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono le istantanee dei criteri di approvazione dell'esecuzione del Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono i criteri di approvazione dell'esecuzione locali del Node tramite comandi di inoltro del Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` gestiscono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica l'inserimento immediato o al prossimo Heartbeat di un testo di riattivazione; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - `cron.run` rimane una RPC di tipo accodamento per le esecuzioni manuali. I client che richiedono una semantica di completamento devono leggere il valore `runId` restituito ed eseguire il polling di `cron.runs`.
    - `cron.runs` accetta un filtro `runId` facoltativo e non vuoto, così i client possono seguire una singola esecuzione manuale accodata senza condizioni di competizione con altre voci della cronologia relative allo stesso processo.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Vedere [Metodi ausiliari per gli operatori](#operator-helper-methods) più avanti.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat dell'interfaccia utente, come `chat.inject`, e altri eventi di chat
  limitati alla trascrizione. Nel protocollo v4, i payload delta includono `deltaText`; `message` rimane
  l'istantanea cumulativa dell'assistente. Le sostituzioni che non sono prefissi impostano
  `replace=true` e utilizzano `deltaText` come testo sostitutivo.
- `session.message`, `session.operation`, `session.tool`: aggiornamenti della trascrizione, delle operazioni di sessione
  in corso e del flusso di eventi per una sessione sottoscritta.
- `session.approval`: stato effettivo sanificato delle approvazioni in sospeso e terminali per un
  sottoscrittore di sessione esatta che ha aderito esplicitamente. Le approvazioni figlie utilizzano il
  pubblico dell'antenato persistito; gli eventi non modificano mai le trascrizioni né riattivano gli agenti.
- `sessions.changed`: indice o metadati della sessione modificati.
- `presence`: aggiornamenti dell'istantanea della presenza di sistema.
- `tick`: evento periodico di keepalive/verifica dell'attività.
- `health`: aggiornamento dell'istantanea dello stato del Gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di un'esecuzione/processo Cron.
- `shutdown`: notifica di arresto del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'associazione dei Node.
- `node.invoke.request`: trasmissione della richiesta di invocazione del Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita dei dispositivi associati.
- `voicewake.changed`: configurazione dell'attivazione tramite parola chiave modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione dell'esecuzione.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione dei Plugin.

### Metodi ausiliari dei Node

I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle Skills
per i controlli di autorizzazione automatica.

## RPC del registro di audit

`audit.activity.list` offre ai client degli operatori una vista stabile, dal più recente al meno recente, dei metadati del ciclo di vita
delle esecuzioni degli agenti, delle azioni degli strumenti e dei messaggi soggetti ad adesione esplicita. Richiede
`operator.read`. Le query escludono i record più vecchi di 30 giorni e il registro
SQLite condiviso è limitato a 100,000 record. Le righe scadute vengono eliminate durante
l'avvio del Gateway, la manutenzione oraria e le scritture successive. Vedere
[Cronologia di audit](/gateway/audit) per il modello dati e la semantica della privacy.

- Parametri: valori esatti facoltativi `agentId`, `sessionKey` o `runId`; valore facoltativo `kind`
  (`"agent_run"`, `"tool_action"` o `"message"`); valore facoltativo `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` o `"unknown"`); valore facoltativo del messaggio `direction` (`"inbound"` o
  `"outbound"`) e valore esatto `channel`; limiti inclusivi facoltativi `after` / `before`
  in millisecondi Unix; valore facoltativo `limit` da `1` a `500`; e stringa facoltativa
  `cursor` della pagina precedente.
- Risultato: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

L'unione dei risultati V1 denominata dispone di schemi distinti per le esecuzioni degli agenti, le azioni degli strumenti, i messaggi in entrata
e i messaggi in uscita. Il discriminatore `eventType` è rispettivamente
`agent_run`, `tool_action`, `inbound_message` o `outbound_message`; `kind` e
il valore `direction` del messaggio rimangono disponibili per il filtraggio e la visualizzazione. Ogni evento dispone di
un valore intero `schemaVersion: 1`. I riferimenti all'identità del messaggio utilizzano il formato esatto
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; l'ID dell'attore mittente del canale
utilizza lo stesso formato.

Tutte le varianti richiedono `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` e
`redaction`. I campi delle varianti sono:

| `eventType`        | Campi obbligatori                                                | Campi facoltativi                                                                                                               |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, riferimenti all'identità, `reasonCode`, `errorCode`                        |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, riferimenti all'identità, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Le enumerazioni chiuse dei messaggi sono:

- `conversationKind`: `direct`, `group`, `channel` o `unknown`.
- `outcome` in entrata: `completed`, `skipped` o `failed`; valore facoltativo
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` o `acp_dispatch_aborted`.
- `outcome` in uscita: `sent`, `suppressed`, `failed` o `unknown`; valore facoltativo
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  o `no_visible_payload`. Un adattatore che non restituisce alcuna identità della piattaforma è
  `unknown`, poiché l'effetto collaterale esterno non può essere escluso.
- `deliveryKind`: `text`, `media` o `other`; `failureStage`:
  `platform_send`, `queue` o `unknown`.

I campi terminali sono correlati, non facoltativi in modo indipendente:

| Variante         | Mappatura terminale                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Esecuzione agente | `started` non dispone di `errorCode`; ogni stato concluso diverso da quello di successo richiede il codice `run_*` corrispondente.                              |
| Azione strumento  | `started` e lo stato riuscito non dispongono di `errorCode`; ogni altro stato concluso richiede il codice `tool_*` corrispondente.                              |
| Messaggio in entrata | riuscito = `completed`; bloccato = `skipped`; non riuscito = `failed` più `message_processing_failed`. `reasonCode`, se presente, deve appartenere a tale famiglia terminale. |
| Messaggio in uscita | riuscito = `sent`; bloccato = `suppressed` più `reasonCode`; non riuscito = `failed` più `errorCode` e `failureStage`; sconosciuto = `unknown` più `failureStage`. |

Ogni evento di attività include un id evento stabile, una sequenza monotona del registro,
una sequenza dell'evento di origine, un timestamp, un attore, un'azione, uno stato, un valore intero
`schemaVersion: 1` e `redaction: "metadata_only"`. I record di esecuzione e degli strumenti
richiedono la provenienza dell'agente e dell'esecuzione e possono includere la provenienza della sessione. I record dei
messaggi possono includere gli id dell'agente e dell'esecuzione, ma intenzionalmente non includono mai
`sessionKey` o `sessionId`; il filtro di query `sessionKey` si applica pertanto
solo alle righe delle esecuzioni e degli strumenti. Gli eventi degli strumenti possono includere l'id della chiamata dello strumento e il nome dello strumento.

I record dei messaggi usano `message.inbound.processed` o
`message.outbound.finished` e aggiungono direzione, canale, tipo di conversazione,
esito normalizzato e, facoltativamente, tipo di consegna, fase dell'errore, durata,
numero di risultati, codice del motivo e pseudonimi basati su chiave e locali all'installazione
per account/conversazione/messaggio/destinazione. Questi pseudonimi agevolano
la correlazione, ma non costituiscono anonimizzazione: il database di stato contiene la relativa chiave,
mentre le esportazioni RPC e CLI non la contengono. Il registro non memorizza prompt, corpi dei messaggi,
argomenti degli strumenti, risultati degli strumenti, output dei comandi o testo grezzo degli errori.
I valori `sessionKey` di esecuzioni/strumenti restano metadati grezzi di correlazione e possono incorporare
id di account o peer della piattaforma; i record dei messaggi omettono le chiavi di sessione.

Per le righe in entrata, `durationMs` misura il dispatch del core fino al relativo stato terminale e
`resultCount` conta i payload finalizzati di strumenti, blocchi e risposte in coda. Per
le righe in uscita, `durationMs` copre la responsabilità della consegna fino alla conferma,
alla dead letter o alla riconciliazione (incluso il tempo di attesa in coda), mentre `resultCount`
conta gli invii fisici identificati sulla piattaforma. `deliveryKind`, quando presente,
descrive il payload effettivo dopo gli hook e il rendering; le righe soppresse o
ambigue a causa di un arresto anomalo lo omettono.

L'attuale copertura dei messaggi include i messaggi in entrata accettati che raggiungono il
dispatch del core, inclusi gli esiti di duplicazione/terminali del core. La copertura in uscita scrive
una riga terminale per ogni payload di risposta logico originale che raggiunge la consegna durevole
condivisa; la suddivisione in blocchi e il fan-out dell'adattatore sono aggregati in `resultCount`. Gli invii
in coda ritentabili o ambigui vengono registrati solo dopo la conferma, la dead
letter o la riconciliazione. I percorsi locali ai Plugin e di invio diretto che eludono tali
confini condivisi non sono ancora coperti. La coda limitata del worker opera secondo il principio del massimo sforzo
e può perdere record in caso di errore o saturazione, pertanto questa superficie non è un
archivio di conformità senza perdite.

La registrazione è attiva per impostazione predefinita ed è controllata da
[`audit.enabled`](/it/gateway/configuration-reference#audit). La registrazione dei messaggi è
controllata separatamente da `audit.messages` e il valore predefinito è `"off"`. Quando
la registrazione è disabilitata, `audit.activity.list` continua a fornire i record scritti
in precedenza fino alla loro scadenza.

Gli schemi distribuiti di richiesta, risultato e `AuditEvent` di `audit.list` restano
invariati e restituiscono solo record delle esecuzioni dell'agente e delle azioni degli strumenti. I nuovi client
operatore devono chiamare `audit.activity.list` quando il Gateway ne segnala la disponibilità. I Gateway meno recenti
possono restituire `unknown method: audit.activity.list` oppure, poiché
nelle versioni distribuite l'autorizzazione precedeva la ricerca del metodo, `missing scope:
operator.admin` a una richiesta con ambito di lettura. Quest'ultimo va considerato come assenza del metodo
solo quando il metodo non era segnalato. Un client può quindi ritentare `audit.list`
solo quando i suoi filtri non richiedono il supporto per tipo di messaggio, direzione o canale.

Usare [`openclaw audit`](/it/cli/audit) per query testuali ed esportazioni JSON limitate.

## RPC del registro delle attività

I client operatore esaminano e annullano i record delle attività in background del Gateway tramite
gli RPC del registro delle attività (`packages/gateway-protocol/src/schema/tasks.ts`). Questi
restituiscono riepiloghi sanificati delle attività, non lo stato grezzo del runtime.

- `tasks.list` richiede `operator.read`.
  - Parametri: `status` facoltativo (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) oppure un array di tali stati,
    `agentId` facoltativo, `sessionKey` facoltativo, `limit` facoltativo da `1` a
    `500` e la stringa facoltativa `cursor`.
  - Risultato: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` richiede `operator.read`.
  - Parametri: `{ "taskId": string }`.
  - Risultato: `{ "task": TaskSummary }`.
  - Gli id attività mancanti restituiscono il formato dell'errore «non trovato» del Gateway.
- `tasks.cancel` richiede `operator.write`.
  - Parametri: `{ "taskId": string, "reason"?: string }`.
  - Risultato: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica se il registro conteneva un'attività corrispondente. `cancelled`
    indica se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati facoltativi: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento,
riepilogo terminale e testo sanificato dell'errore. `agentId` identifica l'agente
che esegue l'attività; `sessionKey` e `ownerKey` conservano il contesto del richiedente e di controllo.

## Metodi di supporto per gli operatori

- `commands.list` (`operator.read`) recupera l'inventario dei comandi del runtime per
  un agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla a quale superficie è destinato il valore primario `name`: `text` restituisce
    il token primario del comando testuale senza il carattere iniziale `/`; `native` e il
    percorso predefinito `both` restituiscono nomi nativi che tengono conto del provider, quando disponibili.
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo che tiene conto del provider, quando
    esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi
    nativi dei Plugin.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- `tools.catalog` (`operator.read`) recupera il catalogo degli strumenti del runtime per un
  agente. La risposta include strumenti raggruppati e metadati sulla provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: Plugin proprietario quando `source="plugin"`
  - `optional`: indica se uno strumento del Plugin è facoltativo
- `tools.effective` (`operator.read`) recupera l'inventario degli strumenti effettivo nel runtime
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto attendibile del runtime dalla sessione lato server
    anziché accettare dal chiamante un contesto di autenticazione o consegna.
  - La risposta è una proiezione derivata dal server e circoscritta alla sessione dell'inventario
    attivo, inclusi gli strumenti del core, dei Plugin, dei canali e dei server MCP già individuati.
  - `tools.effective` è di sola lettura per MCP: può proiettare un catalogo MCP di una sessione attiva
    attraverso la policy finale degli strumenti, ma non crea runtime MCP,
    non connette trasporti e non emette `tools/list`. Se non esiste un catalogo attivo
    corrispondente, la risposta può includere un avviso come `mcp-not-yet-connected`,
    `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Le voci degli strumenti effettivi usano `source="core"`, `source="plugin"`,
    `source="channel"` o `source="mcp"`.
- `tools.invoke` (`operator.write`) richiama uno strumento disponibile attraverso lo
  stesso percorso di policy del Gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolto
    deve corrispondere a `agentId`.
  - I wrapper del core riservati al proprietario, come `cron`, `gateway` e `nodes`, richiedono
    un'identità del proprietario/amministratore (`operator.admin`), anche se `tools.invoke`
    è `operator.write`.
  - La risposta è un envelope destinato all'SDK con `ok`, `toolName`, il valore facoltativo
    `output` e i campi tipizzati `error`. I rifiuti dovuti all'approvazione o alla policy restituiscono
    `ok:false` nel payload anziché eludere la pipeline delle policy degli strumenti del Gateway.
- `skills.status` (`operator.read`) recupera l'inventario delle skill visibili per un
  agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, verifiche della configurazione
    e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- `skills.search` e `skills.detail` (`operator.read`) restituiscono i metadati di
  individuazione di ClawHub.
- `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`
  (`operator.admin`) preparano un archivio privato di skill prima di installarlo. Questo
  è un percorso di caricamento amministrativo separato per client attendibili, non il normale flusso di
  installazione delle skill di ClawHub, ed è disabilitato per impostazione predefinita a meno che
  `skills.install.allowUploadedArchives` non sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea un caricamento associato a tale slug e al valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte
    all'offset decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e
    SHA-256. Il commit finalizza soltanto il caricamento; non installa la skill.
  - Gli archivi di skill caricati sono archivi zip contenenti una radice `SKILL.md`. Il
    nome della directory interna dell'archivio non seleziona mai la destinazione dell'installazione.
- `skills.install` (`operator.admin`) dispone di tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella di skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità di caricamento: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installa un caricamento sottoposto a commit nella directory
    `skills/<slug>` dello spazio di lavoro dell'agente predefinito. Lo slug e il valore force devono corrispondere alla
    richiesta `skills.upload.begin` originale. La richiesta viene rifiutata a meno che
    `skills.install.allowUploadedArchives` non sia abilitato; l'impostazione non
    influisce sulle installazioni da ClawHub.
  - Modalità programma di installazione del Gateway: `{ name, installId, timeoutMs? }` esegue un'azione
    `metadata.openclaw.install` dichiarata sull'host del Gateway. I client meno recenti possono
    continuare a inviare `dangerouslyForceUnsafeInstall`; questo campo è deprecato,
    accettato solo per compatibilità del protocollo e ignorato. Usare
    `security.installPolicy` per le decisioni di installazione di competenza dell'operatore.
- `skills.update` (`operator.admin`) dispone di due modalità:
  - La modalità ClawHub aggiorna uno slug monitorato o tutte le installazioni ClawHub monitorate nello
    spazio di lavoro dell'agente predefinito.
  - La modalità di configurazione modifica i valori `skills.entries.<skillKey>`, come `enabled`,
    `apiKey` e `env`.

### Viste di `models.list`

`models.list` accetta un parametro facoltativo `view`
(`src/agents/model-catalog-visibility.ts`):

- Omesso oppure `"default"`: se `agents.defaults.models` è configurato, la
  risposta è il catalogo consentito, inclusi i modelli rilevati dinamicamente
  per le voci `provider/*`. Altrimenti, la risposta è il catalogo completo
  del gateway.
- `"configured"`: comportamento adatto a un selettore. Se `agents.defaults.models` è
  configurato, continua ad avere la precedenza, incluso il rilevamento specifico del provider per
  le voci `provider/*`. Senza un elenco di elementi consentiti, la risposta usa le voci
  `models.providers.<provider>.models` esplicite, ricorrendo al catalogo completo
  solo quando non esistono righe di modelli configurate.
- `"provider-config"`: inventario `models.providers.*.models` definito nell'origine,
  indipendente dagli elenchi consentiti del selettore. Le righe includono le funzionalità pubbliche dei modelli e
  la disponibilità in base alla route, ma omettono gli endpoint dei provider, il materiale di
  autenticazione e la configurazione delle richieste di runtime.
- `"all"`: catalogo completo del gateway, ignorando `agents.defaults.models`. Da usare per
  le interfacce di diagnostica/rilevamento, non per i normali selettori di modelli.

## Approvazioni di esecuzione

- Quando una richiesta di esecuzione necessita di approvazione, il gateway trasmette
  `exec.approval.requested`.
- I client dell'operatore risolvono la richiesta chiamando `exec.approval.resolve` (richiede
  `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan`
  (metadati canonici di `argv`/`cwd`/`rawCommand`/sessione). Le richieste prive di
  `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riutilizzano tale
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`,
  il gateway rifiuta l'esecuzione anziché considerare attendibile il payload modificato.

## Fallback per la consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` (valore predefinito) mantiene un comportamento rigoroso: le destinazioni di consegna
  non risolte o esclusivamente interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione limitata alla sessione quando non è possibile
  risolvere alcuna route esterna utilizzabile per la consegna (ad esempio, sessioni interne/webchat
  o configurazioni multicanale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando è stata richiesta la consegna,
  usando gli stessi stati `sent`, `suppressed`, `partial_failed` e
  `failed` documentati per
  [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Controllo delle versioni

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` e `MIN_PROBE_PROTOCOL_VERSION` si trovano in
  `packages/gateway-protocol/src/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`. I client operatore e dell'interfaccia utente devono
  includere il protocollo corrente in tale intervallo; i client e i server correnti usano
  il protocollo v4.
- I client autenticati con entrambi `role: "node"` e `client.mode: "node"`
  possono usare il protocollo Node N-1 (attualmente v3). Le sonde leggere di riavvio usano
  la stessa finestra N-1. L'autenticazione del dispositivo, l'associazione, gli ambiti, i criteri dei comandi e le approvazioni
  di esecuzione non sono modificati da questa finestra di compatibilità. Le funzionalità e i comandi
  Node di proprietà dei Plugin non sono resi disponibili finché il Node non viene aggiornato al protocollo
  corrente, perché le superfici che li ospitano non fanno parte del contratto N-1.
- Gli schemi e i modelli vengono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

L'implementazione client di riferimento si trova in `packages/gateway-client/src/`
(OpenClaw la racchiude tramite la sottile facciata `src/gateway/client.ts`). Questi
valori predefiniti sono stabili nel protocollo v4 e costituiscono la base di riferimento prevista per
i client di terze parti.

| Costante                                  | Valore predefinito                                    | Origine                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Timeout della richiesta (per RPC)         | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Timeout di preautenticazione/challenge di connessione | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (la variabile di ambiente `OPENCLAW_HANDSHAKE_TIMEOUT_MS` può aumentare il budget associato di server/client) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Limite per il nuovo tentativo rapido dopo la chiusura dovuta al token del dispositivo | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Periodo di tolleranza dell'arresto forzato prima di `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Timeout predefinito di `stopAndWait()` | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Intervallo di tick predefinito (prima di `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Chiusura per timeout del tick             | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Il server comunica i valori effettivi di `policy.tickIntervalMs`,
`policy.maxPayload` e `policy.maxBufferedBytes` in `hello-ok`; i client
devono rispettare tali valori anziché i valori predefiniti precedenti all'handshake.

Il client di riferimento consente alle richieste finite di gestire la propria scadenza configurata quando
ogni richiesta in sospeso ne ha una. Una richiesta `expectFinal` senza un valore finito di
`timeoutMs`, qualsiasi richiesta con `timeoutMs: null` o una combinazione di richieste finite e
senza limite mantiene attivo il watchdog del tick. Se gli eventi e le
risposte in ingresso rimangono assenti oltre la soglia di timeout del tick, il client chiude il
socket con il codice `4000`, rifiuta ogni richiesta in sospeso e si riconnette. Non
riesegue le richieste rifiutate dopo la riconnessione.

## Autenticazione

- L'autenticazione del Gateway tramite segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda del valore configurato per
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`).
- Le modalità che includono l'identità, come Tailscale Serve (`gateway.auth.allowTailscale: true`)
  o `gateway.auth.mode: "trusted-proxy"` non loopback, soddisfano il controllo di autenticazione
  della connessione tramite le intestazioni della richiesta anziché `connect.params.auth.*`.
- Il `gateway.auth.mode: "none"` con ingresso privato ignora completamente
  l'autenticazione della connessione tramite segreto condiviso; non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo l'associazione, il Gateway emette un token del dispositivo limitato al ruolo
  e agli ambiti della connessione, restituito in `hello-ok.auth.deviceToken`. I client devono
  conservarlo dopo ogni connessione riuscita.
- Quando ci si riconnette con il token del dispositivo memorizzato, deve essere riutilizzato anche
  l'insieme di ambiti approvato e memorizzato per tale token. Ciò mantiene l'accesso
  già concesso a lettura/verifica/stato ed evita che le riconnessioni vengano
  silenziosamente ridotte a un ambito implicito più ristretto riservato ai soli amministratori.
- Composizione dell'autenticazione della connessione lato client (`selectConnectAuth` in
  `packages/gateway-client/src/client.ts`):
  - `auth.password` è indipendente e viene sempre inoltrato quando impostato.
  - `auth.token` viene valorizzato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token memorizzato per dispositivo (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuna delle opzioni precedenti ha determinato
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo determinato ne impedisce l'invio.
  - La promozione automatica di un token del dispositivo memorizzato nel singolo
    nuovo tentativo `AUTH_TOKEN_MISMATCH` è limitata ai soli endpoint attendibili: loopback
    oppure `wss://` con un `tlsFingerprint` bloccato. Un `wss://` pubblico senza pinning
    non è idoneo.
- Il bootstrap integrato tramite codice di configurazione restituisce il
  `hello-ok.auth.deviceToken` del Node primario e un token operatore limitato in
  `hello-ok.auth.deviceTokens` per il trasferimento attendibile a dispositivi mobili. Il token operatore
  include `operator.talk.secrets` per le letture della configurazione nativa di Talk, ma
  esclude gli ambiti di modifica dell'associazione e `operator.admin`.
- Mentre un bootstrap tramite codice di configurazione non di base attende l'approvazione,
  i dettagli di `PAIRING_REQUIRED` includono `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` e `pauseReconnect: false`. Continuare a riconnettersi con lo
  stesso token di bootstrap finché la richiesta non viene approvata o il token
  non diventa non valido.
- Conservare `hello-ok.auth.deviceTokens` solo quando la connessione ha usato
  l'autenticazione bootstrap su un trasporto attendibile, come `wss://`, oppure tramite associazione loopback/locale.
- Se un client fornisce un `deviceToken` esplicito o un `scopes` esplicito, tale
  insieme di ambiti richiesto dal chiamante rimane autorevole; gli ambiti memorizzati nella cache vengono
  riutilizzati solo quando il client riutilizza il token memorizzato per dispositivo.
- I token dei dispositivi possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede `operator.pairing`). La rotazione o la revoca di un
  Node o di un altro ruolo non operatore richiede anche `operator.admin`.
- `device.token.rotate` restituisce i metadati di rotazione. Ripete il token
  bearer sostitutivo solo per le chiamate dello stesso dispositivo già autenticate con tale
  token del dispositivo, affinché i client che usano solo token possano conservarne il sostituto prima
  di riconnettersi. Le rotazioni condivise/amministrative non ripetono il token bearer.
- L'emissione, la rotazione e la revoca dei token restano limitate all'insieme di ruoli
  approvato e registrato nella voce di associazione del dispositivo; la modifica dei token non può ampliare né
  prendere di mira un ruolo del dispositivo mai concesso dall'approvazione dell'associazione.
- Per le sessioni con token di dispositivi associati, la gestione dei dispositivi è limitata al proprio dispositivo, salvo
  che il chiamante disponga anche di `operator.admin`: i chiamanti non amministratori possono gestire solo il
  token operatore della propria voce dispositivo. La gestione dei token di Node e di altri ruoli non operatore
  è riservata agli amministratori, anche per il dispositivo del chiamante.
- `device.token.rotate` e `device.token.revoke` verificano inoltre l'insieme di ambiti
  del token operatore di destinazione rispetto agli ambiti della sessione corrente del chiamante.
  I chiamanti non amministratori non possono ruotare o revocare un token operatore con ambiti più ampi di quelli
  già posseduti.
- Gli errori di autenticazione includono `error.details.code` e indicazioni per il ripristino:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep`: uno tra `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare una sola volta con un token memorizzato nella cache per dispositivo.
  - Se tale nuovo tentativo non riesce, interrompere i cicli di riconnessione automatica e mostrare
    le indicazioni sulle azioni richieste all'operatore.
- `AUTH_SCOPE_MISMATCH` indica che il token del dispositivo è stato riconosciuto, ma non
  copre il ruolo o gli ambiti richiesti. Non presentarlo come token errato; richiedere
  all'operatore di ripetere l'associazione o approvare il contratto di ambiti più ristretto/ampio.

## Identità e associazione dei dispositivi

- I Node devono includere un'identità stabile del dispositivo (`device.id`) derivata
  dall'impronta digitale di una coppia di chiavi.
- I Gateway emettono token per dispositivo e ruolo.
- Le approvazioni dell'associazione sono necessarie per i nuovi ID dispositivo, salvo che sia
  abilitata l'approvazione automatica locale.
- L'approvazione automatica dell'associazione è incentrata sulle connessioni loopback locali dirette.
- OpenClaw dispone inoltre di un percorso ristretto di connessione automatica locale al backend/contenitore per
  flussi helper attendibili tramite segreto condiviso.
- Le connessioni tailnet o LAN dello stesso host sono comunque considerate remote ai fini dell'associazione
  e richiedono l'approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni per operatori senza dispositivo sono percorsi di attendibilità espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per la compatibilità HTTP non sicura
    limitata a localhost.
  - autenticazione riuscita dell'operatore nella Control UI tramite `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (misura di emergenza, grave
    riduzione della sicurezza).
  - RPC del backend `gateway-client` tramite loopback diretto nel percorso helper interno
    riservato.
- L'omissione dell'identità del dispositivo ha conseguenze sugli ambiti. Quando una connessione
  operatore senza dispositivo è consentita tramite un percorso di attendibilità esplicito, OpenClaw
  azzera comunque gli ambiti autodichiarati impostandoli su un insieme vuoto, salvo che tale percorso disponga di
  un'eccezione denominata per la conservazione degli ambiti. I metodi vincolati agli ambiti hanno quindi esito negativo con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` è un percorso di
  emergenza della Control UI che conserva gli ambiti. Non concede ambiti a client WebSocket
  arbitrari con backend personalizzati o strutturati come CLI.
- Il percorso helper riservato del backend `gateway-client` tramite loopback diretto conserva
  gli ambiti solo per le RPC interne del piano di controllo locale; gli ID backend personalizzati non
  ricevono questa eccezione.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell'autenticazione dei dispositivi

Per i client legacy che usano ancora il comportamento di firma precedente alla challenge, `connect`
restituisce codici di dettaglio `DEVICE_AUTH_*` in `error.details.code` con un
`error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato non rientra nello scarto consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde all'impronta digitale della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato o la canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo della migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`
  (`buildDeviceAuthPayloadV3` in `packages/gateway-client/src/device-auth.ts`),
  che vincola `platform` e `deviceFamily`, oltre ai campi
  dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning
  dei metadati dei dispositivi associati continua a controllare i criteri dei comandi alla riconnessione.

## TLS e pinning

- TLS è supportato per le connessioni WS (configurazione `gateway.tls`).
- I client possono facoltativamente applicare il pinning dell'impronta digitale del certificato del Gateway tramite
  `gateway.remote.tlsFingerprint` o l'opzione CLI `--tls-fingerprint`.

## Ambito

Questo protocollo espone l'intera API del Gateway: stato, canali, modelli, chat,
agente, sessioni, Node, approvazioni e altro ancora. La superficie esatta è definita dagli
schemi TypeBox riesportati da `packages/gateway-protocol/src/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

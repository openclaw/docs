---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-05-01T08:30:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b80ee7d9a36f78b05b8ca83d70baf6ec53fc907ca25e8b4c2ab39350ff95c54
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **piano di controllo unico + trasporto Node** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android, nodi
senza interfaccia) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento della negoziazione iniziale.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame precedenti alla connessione sono limitati a 64 KiB. Dopo una negoziazione iniziale riuscita, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il Gateway chiuda o scarti il frame interessato. Questi eventi conservano
  dimensioni, limiti, superfici e codici motivo sicuri. Non conservano il corpo del messaggio,
  i contenuti degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

## Negoziazione iniziale (connect)

Gateway → Client (sfida pre-connessione):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
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

Mentre il Gateway sta ancora completando i sidecar di avvio, la richiesta `connect` può
restituire un errore ritentabile `UNAVAILABLE` con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero riprovare quella risposta
entro il proprio budget complessivo di connessione invece di presentarla come un errore
terminale di negoziazione iniziale.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `canvasHostUrl` è facoltativo.

Quando non viene emesso alcun token dispositivo, `hello-ok.auth` riporta le autorizzazioni
negoziate senza campi token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

I client backend attendibili nello stesso processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) possono omettere `device` sulle connessioni local loopback dirette quando
si autenticano con il token/password Gateway condiviso. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce a baseline di abbinamento CLI/dispositivo
obsolete di bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni dei subagent. I client remoti,
i client con origine browser, i client Node e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di abbinamento e aggiornamento degli ambiti.

Quando viene emesso un token dispositivo, `hello-ok` include anche:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante il passaggio di bootstrap attendibile, `hello-ok.auth` può includere anche voci di ruolo
aggiuntive e limitate in `deviceTokens`:

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

Per il flusso di bootstrap Node/operatore integrato, il token Node primario rimane
`scopes: []` e qualsiasi token operatore passato resta limitato alla allowlist
dell’operatore di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap restano
prefissati per ruolo: le voci operatore soddisfano solo le richieste operatore, e i ruoli
non operatore hanno comunque bisogno di ambiti sotto il proprio prefisso di ruolo.

### Esempio Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

## Incapsulamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedere lo schema).

## Ruoli + ambiti

### Ruoli

- `operator` = client del piano di controllo (CLI/UI/automazione).
- `node` = host di capacità (camera/screen/canvas/system.run).

### Ambiti (operatore)

Ambiti comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).

I metodi RPC del Gateway registrati dai Plugin possono richiedere il proprio ambito operatore, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L’ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando in aggiunta. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell’ambito al momento dell’approvazione oltre
all’ambito di metodo di base:

- richieste senza comandi: `operator.pairing`
- richieste con comandi Node non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (Node)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per l’invocazione.
- `permissions`: controlli granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta queste come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **Node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l’ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi abbinati possono anche riportare
  presenza in background durevole quando un evento Node attendibile aggiorna i metadati di abbinamento.

### Evento Node attivo in background

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un Node abbinato era
attivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal Gateway prima della persistenza. L’evento è durevole solo per sessioni dispositivo Node
autenticate; le sessioni senza dispositivo o non abbinate restituiscono `handled: false`.

I Gateway riusciti restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I Gateway meno recenti possono ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come un
RPC confermato, non come persistenza durevole della presenza.

## Definizione dell’ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono soggetti a controlli di ambito, così le sessioni con ambito di abbinamento o solo Node non ricevono passivamente contenuti di sessione.

- **Frame di chat, agent e risultati degli strumenti** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` ignorano completamente questi frame.
- **Broadcast `plugin.*` definiti da Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così la salute del trasporto rimane osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono soggette a controllo di ambito per impostazione predefinita (chiusura in caso di errore) salvo che un gestore registrato le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l’ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso di eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di negoziazione iniziale/autenticazione sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco conservativo
di discovery creato da `src/gateway/server-methods-list.ts` più gli export dei metodi
Plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` restituisce lo snapshot della salute del gateway memorizzato nella cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e limitato. Conserva metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e id di sessione. Non conserva testo chat, corpi Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l’ambito di lettura operatore.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono inclusi solo per client operatore con ambito admin.
    - `gateway.identity.get` restituisce l’identità dispositivo del Gateway usata dai flussi relay e di abbinamento.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operatore/Node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l’ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l’elaborazione degli Heartbeat sul Gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati in formato adatto al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce le finestre di utilizzo dei provider e i riepiloghi della quota residua.
    - `usage.cost` restituisce i riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce la preparazione della memoria vettoriale / degli embedding in cache per lo spazio di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live al provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per i client remoti del piano di controllo. Può includere percorsi dello spazio di lavoro, frammenti di memoria, Markdown contestualizzato renderizzato e candidati per la promozione profonda, quindi i chiamanti richiedono `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato per canali/Plugin integrati e inclusi nel bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per l'attuale provider di canale web compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un Node iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii mirati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda configurata del log su file del Gateway con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client WebChat/Control UI.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` commutano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione testo-voce una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve nuovamente le SecretRef attive e sostituisce lo stato dei segreti del runtime solo in caso di pieno successo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate a comandi per un set specifico di comando/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida e sostituisce il payload di configurazione completo.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati dello schema di Plugin + canale quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, inclusi oggetti annidati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste la documentazione del campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup limitato a un percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, suggerimento corrispondente + `hintPath` e riepiloghi dei figli immediati per l'esplorazione UI/CLI. I nodi dello schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, oltre a `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito.
    - `update.status` restituisce l'ultimo sentinel di riavvio aggiornamento memorizzato in cache, inclusa la versione in esecuzione post-riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agente e spazio di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi il modello effettivo e i metadati del runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio dello spazio di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file di bootstrap dello spazio di lavoro esposti per un agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi di artefatti derivati dalla trascrizione e download per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query su run e task risolvono lato server la sessione proprietaria e restituiscono solo contenuti multimediali della trascrizione con provenienza corrispondente; sorgenti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di una run e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice delle sessioni corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime agente.
    - `sessions.subscribe` e `sessions.unsubscribe` commutano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` commutano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate delle trascrizioni per chiavi di sessione specifiche.
    - `sessions.resolve` risolve o canonicalizza un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e indirizzamento per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` opzionale, oppure passare solo `runId` per le run attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga completa della sessione memorizzata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/full-width trapelati vengono rimossi, le righe dell'assistente composte da puri token silenziosi come esattamente `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con segnaposto.

  </Accordion>

  <Accordion title="Abbinamento dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi abbinati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di abbinamento dispositivi.
    - `device.token.rotate` ruota un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Abbinamento Node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'abbinamento dei Node e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei Node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un Node abbinato.
    - `node.invoke` inoltra un comando a un Node connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta invoke.
    - `node.event` riporta nel Gateway gli eventi originati dal Node.
    - `node.canvas.capability.refresh` aggiorna i token con ambito per la capacità canvas.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei Node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per Node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del Node tramite comandi relay del Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dal Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat di testo wake; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi di chat
  solo trascrizione.
- `session.message` e `session.tool`: aggiornamenti di trascrizione/stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice sessioni o metadati modificati.
- `presence`: aggiornamenti dello snapshot della presenza di sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di salute del Gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica run/job Cron.
- `shutdown`: notifica di arresto del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento Node.
- `node.invoke.request`: broadcast della richiesta invoke Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger wake-word modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione Plugin.

### Metodi helper Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili skill
  per i controlli di autorizzazione automatica.

### Metodi helper operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere l'area di lavoro predefinita dell'agente.
  - `scope` controlla quale superficie viene indirizzata dal `name` principale:
    - `text` restituisce il token del comando testuale principale senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare il contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è circoscritta alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, Plugin e di canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile attraverso lo stesso percorso di policy del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente risolto della sessione deve corrispondere a `agentId`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. Le approvazioni o i rifiuti di policy restituiscono `ok:false` nel payload invece di aggirare la pipeline di policy degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile delle skill per un agente.
  - `agentId` è facoltativo; omettilo per leggere l'area di lavoro predefinita dell'agente.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` dell'area di lavoro predefinita dell'agente.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nell'area di lavoro predefinita dell'agente.
  - La modalità Config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per un selettore. Se `agents.defaults.models` è configurato, continua ad avere la precedenza. Altrimenti la risposta usa le voci esplicite `models.providers.*.models`, ricadendo sul catalogo completo solo quando non esistono righe modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usalo per diagnostica e interfacce di scoperta, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede lo scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand` canonici/metadati sessione). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di considerare attendibile il payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: target di consegna non risolti o solo interni restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo sessione quando non può essere risolta alcuna rotta consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le mancate corrispondenze.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v3 e costituiscono la baseline attesa per i client di terze parti.

| Costante                                  | Predefinito                                           | Fonte                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client associato) |
| Backoff di riconnessione iniziale         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Grace force-stop prima di `terminate()`   | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (pre `hello-ok`) | `30_000` ms                                        | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare quei valori invece dei predefiniti pre-handshake.

## Autenticazione

- L'autenticazione del Gateway a segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalita di autenticazione configurata.
- Le modalita che includono identita, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"`
  non local loopback, soddisfano il controllo di autenticazione della connessione
  dagli header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingresso privato salta completamente
  l'autenticazione della connessione a segreto condiviso; non esporre questa
  modalita su ingressi pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **token del dispositivo** limitato al
  ruolo + ambiti della connessione. Viene restituito in
  `hello-ok.auth.deviceToken` e deve essere persistito dal client per le
  connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel token del dispositivo **memorizzato** deve anche
  riutilizzare l'insieme di ambiti approvati memorizzato per quel token. Questo
  preserva l'accesso in lettura/probe/stato gia concesso ed evita di ridurre
  silenziosamente le riconnessioni a un ambito implicito piu ristretto di sola
  amministrazione.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` e ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorita: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo risolto lo sopprime.
  - La promozione automatica di un token del dispositivo memorizzato nel retry una tantum
    `AUTH_TOKEN_MISMATCH` e limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con `tlsFingerprint` vincolato. `wss://` pubblico
    senza pinning non e idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff bootstrap.
  Persistile solo quando la connessione ha usato autenticazione bootstrap su un
  trasporto attendibile come `wss://` o pairing loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti,
  l'insieme di ambiti richiesto dal chiamante resta autoritativo; gli ambiti in
  cache vengono riutilizzati solo quando il client riusa il token per dispositivo memorizzato.
- I token dei dispositivi possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Restituisce in eco il token
  bearer sostitutivo solo per chiamate dallo stesso dispositivo gia autenticate con
  quel token del dispositivo, cosi i client basati solo su token possono persistere
  il sostituto prima di riconnettersi. Le rotazioni condivise/amministrative non
  restituiscono in eco il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli
  approvato registrato nella voce di pairing di quel dispositivo; la mutazione dei
  token non puo espandere o indirizzare un ruolo del dispositivo mai concesso
  dall'approvazione del pairing.
- Per le sessioni con token di dispositivo abbinato, la gestione del dispositivo
  e auto-limitata a meno che il chiamante abbia anche `operator.admin`: i chiamanti
  non amministratori possono rimuovere/revocare/ruotare solo la voce del dispositivo
  **propria**.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti
  del token operatore di destinazione rispetto agli ambiti di sessione correnti del
  chiamante. I chiamanti non amministratori non possono ruotare o revocare un token
  operatore piu ampio di quello che gia possiedono.
- Gli errori di autenticazione includono `error.details.code` piu suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i cicli di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.

## Identita del dispositivo + pairing

- I nodi devono includere un'identita del dispositivo stabile (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per i nuovi ID dispositivo a meno che
  l'approvazione automatica locale sia abilitata.
- L'approvazione automatica del pairing e centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container locale per
  flussi helper attendibili a segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- I client WS normalmente includono l'identita `device` durante `connect` (operatore +
  node). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilita HTTP insicura solo localhost.
  - autenticazione operatore Control UI riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticati con il token/password
    condiviso del gateway.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato e fuori dallo scostamento consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito e `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilita, ma il pinning dei
  metadati del dispositivo abbinato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS e supportato per le connessioni WS.
- I client possono facoltativamente vincolare la fingerprint del certificato del gateway (vedi la configurazione
  `gateway.tls` piu `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API gateway completa** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta e definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

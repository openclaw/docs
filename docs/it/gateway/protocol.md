---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug dei disallineamenti di protocollo o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-07-03T09:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android, nodi
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito**
al momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il gateway chiuda o scarti il frame interessato. Questi eventi conservano
  dimensioni, limiti, superfici e codici di motivo sicuri. Non conservano il corpo del messaggio,
  i contenuti degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

## Handshake (connect)

Gateway → Client (challenge pre-connect):

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

Gateway → Client:

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

Mentre il Gateway sta ancora completando l'avvio dei sidecar, la richiesta `connect` può
restituire un errore `UNAVAILABLE` riprovabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero riprovare quella risposta
entro il budget complessivo di connessione invece di mostrarla come errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti obbligatori secondo lo schema
(`packages/gateway-protocol/src/schema/frames.ts`). Anche `auth` è obbligatorio e segnala
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e mappa i nomi delle superfici
dei plugin, come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactor sperimentale del plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway attuali devono usare le superfici dei plugin.

Quando non viene emesso alcun token dispositivo, `hello-ok.auth` segnala le autorizzazioni
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
`client.mode: "backend"`) possono omettere `device` sulle connessioni loopback dirette quando
si autenticano con il token/password condiviso del gateway. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce alle baseline obsolete di associazione CLI/dispositivo di
bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni dei subagent. I client remoti,
i client di origine browser, i client nodo e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di associazione e upgrade degli ambiti.

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

Il bootstrap integrato con QR/codice di configurazione è un nuovo percorso di handoff mobile. Una connessione
riuscita con codice di configurazione baseline restituisce un token nodo primario più un token
operatore limitato:

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

L'handoff operatore è intenzionalmente limitato, così l'onboarding QR può avviare il
loop operatore mobile senza concedere `operator.admin` o `operator.pairing`.
Include `operator.talk.secrets` affinché il client nativo possa leggere la configurazione Talk
di cui ha bisogno dopo il bootstrap. Ambiti di amministrazione e associazione più ampi richiedono
un'associazione operatore approvata separata o un flusso token. I client dovrebbero persistere
`hello-ok.auth.deviceTokens` solo
quando la connessione ha usato l'autenticazione bootstrap su un trasporto attendibile come `wss://` o
l'associazione loopback/locale.

### Esempio nodo

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## Framing

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedere lo schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione e la
semantica dei segreti condivisi, vedere [Ambiti operatore](/it/gateway/operator-scopes).

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
Quando i segreti sono inclusi, i client dovrebbero leggere la credenziale attiva del provider Talk
da `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
rimane nella forma sorgente e può essere un oggetto SecretRef o una stringa redatta.

I metodi RPC del gateway registrati dal plugin possono richiedere il proprio ambito operatore, ma
i prefissi di amministrazione core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo filtro. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigidi a livello di comando. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (nodo)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità ad alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist di comandi per l'invocazione.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi valori come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **nodo**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l'ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi associati possono anche segnalare
  presenza durevole in background quando un evento nodo attendibile aggiorna i loro metadati di associazione.

### Evento di attività in background del nodo

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo associato era
attivo durante un risveglio in background senza marcarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L'evento è durevole solo per sessioni dispositivo nodo
autenticate; le sessioni senza dispositivo o non associate restituiscono `handled: false`.

I gateway riusciti restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I gateway meno recenti possono ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come un
RPC riconosciuto, non come persistenza durevole della presenza.

## Definizione degli ambiti degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono filtrati per ambito, così le sessioni limitate all'associazione o solo nodo non ricevono passivamente contenuti di sessione.

- **Frame di chat, agente e risultati dei tool** (inclusi eventi `agent` in streaming e risultati delle chiamate tool) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano interamente questi frame.
- **Broadcast `plugin.*` definiti dai plugin** sono limitati a `operator.write` o `operator.admin`, in base a come il plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni, così lo stato del trasporto rimane osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono filtrate per ambito per impostazione predefinita (fail-closed) a meno che un handler registrato non le renda esplicitamente meno restrittive.

Ogni connessione client mantiene il proprio numero di sequenza per-client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/autenticazione sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco di discovery
conservativo costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi di
plugin/canali caricati. Trattarlo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di stato del Gateway memorizzato nella cache o appena rilevato.
    - `diagnostics.stability` restituisce il registratore diagnostico recente e limitato della stabilità. Mantiene metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi di canali/plugin e ID di sessione. Non conserva testo delle chat, corpi dei webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito amministratore.
    - `gateway.identity.get` restituisce l'identità del dispositivo Gateway usata dai flussi di relay e associazione.
    - `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'evento Heartbeat persistito più recente.
    - `set-heartbeats` abilita o disabilita l'elaborazione Heartbeat sul Gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati adatti a un selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce finestre di utilizzo dei provider/riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dei costi per un intervallo di date.
      Passa `agentId` per un agente, oppure `agentScope: "all"` per aggregare gli agenti configurati.
    - `doctor.memory.status` restituisce lo stato di preparazione della memoria vettoriale / degli embedding memorizzati nella cache per il workspace dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding. I client consapevoli di Dreaming possono anche passare `{ "agentId": "agent-id" }` per circoscrivere le statistiche dello store Dreaming a un workspace agente selezionato; omettere `agentId` mantiene il fallback all'agente predefinito e aggrega i workspace Dreaming configurati.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` accettano parametri opzionali `{ "agentId": "agent-id" }` per viste/azioni Dreaming sull'agente selezionato. Quando `agentId` è omesso, operano sul workspace dell'agente predefinito configurato.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per client remoti del piano di controllo. Può includere percorsi del workspace, frammenti di memoria, markdown grounded renderizzato e candidati di promozione profonda, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione. Passa `agentId` per un
      agente, oppure `agentScope: "all"` per elencare insieme gli agenti configurati.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web corrente con supporto QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una notifica push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word archiviati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii mirati a canale/account/thread al di fuori del runner di chat.
    - `logs.tail` restituisce la coda del log su file configurato del Gateway con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider Talk per voce, trascrizione in streaming e voce realtime. Include ID canonici dei provider, alias del registro, etichette, stato configurato, un risultato opzionale `ready` a livello di gruppo, ID di modelli/voci esposti, modalità canoniche, trasporti, strategie brain e flag realtime audio/capability senza restituire segreti del provider né modificare la configurazione globale. I Gateway correnti impostano `ready` dopo aver applicato la selezione del provider a runtime; i client devono trattarne l'assenza come non verificata per compatibilità con Gateway più vecchi.
    - `talk.config` restituisce il payload della configurazione Talk effettiva; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Per `stt-tts/managed-room`, i chiamanti `operator.write` che passano `sessionKey` devono passare anche `spawnedBy` per la visibilità con ambito della chiave di sessione; la creazione di `sessionKey` senza ambito e `brain: "direct-tools"` richiedono `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token archiviato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni realtime relay e trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` guidano il ciclo di vita dei turni managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per il barge-in protetto da VAD nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione realtime relay di proprietà del Gateway. Passa `options: { willContinue: true }` per l'output intermedio dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta realtime dell'assistente.
    - `talk.session.steer` invia il controllo vocale dell'esecuzione attiva a una sessione Talk di proprietà del Gateway e supportata da agente. Accetta `{ sessionId, text, mode? }`, dove `mode` è `status`, `steer`, `cancel` o `followup`; la modalità omessa viene classificata dal testo parlato.
    - `talk.session.close` chiude una sessione relay, trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider realtime di proprietà del client usando `webrtc` o `provider-websocket` mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti realtime di proprietà del client di inoltrare chiamate agli strumenti del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID di esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato specifico del provider per lo strumento.
    - `talk.client.steer` invia il controllo vocale dell'esecuzione attiva per i trasporti realtime di proprietà del client. Il Gateway risolve l'esecuzione incorporata attiva da `sessionKey` e restituisce un risultato strutturato accettato/rifiutato invece di scartare silenziosamente lo steering.
    - `talk.event` è il singolo canale eventi Talk per adattatori realtime, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza la voce tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione dei provider.
    - `tts.providers` restituisce l'inventario dei provider TTS visibili.
    - `tts.enable` e `tts.disable` abilitano o disabilitano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech singola.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e wizard">
    - `secrets.reload` risolve nuovamente i SecretRef attivi e sostituisce lo stato dei segreti a runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni dei segreti mirate a un comando per uno specifico insieme comando/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione. La sostituzione distruttiva degli array
      richiede il percorso interessato in `replacePaths`; gli array annidati
      sotto voci di array usano percorsi `[]` come `agents.list[].skills`.
    - `config.apply` convalida + sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi metadati dello schema di plugin + canali quando il runtime può caricarli. Lo schema include metadati di campo `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia, incluse ramificazioni di composizione per oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito su un percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, suggerimento corrispondente + `hintPath`, `reloadKind` opzionale e riepiloghi dei figli immediati per il drill-down UI/CLI. `reloadKind` è uno tra `restart`, `hot` o `none` e rispecchia il pianificatore di ricaricamento della configurazione del Gateway per il percorso richiesto. I nodi dello schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, `reloadKind` opzionale, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno agente di follow-up tramite la coda di continuazione del riavvio. Gli aggiornamenti tramite package manager e gli aggiornamenti supervisionati di git-checkout dal piano di controllo usano un handoff a un servizio gestito distaccato invece di sostituire l'albero del pacchetto o modificare output di checkout/build all'interno del Gateway live. Un handoff avviato restituisce `ok: true` con `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; handoff non disponibili o non riusciti restituiscono `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, più `handoff.command` quando è richiesto un aggiornamento manuale da shell. Un handoff non disponibile significa che OpenClaw non dispone di un confine di supervisione sicuro o di un'identità di servizio durevole, come `OPENCLAW_SYSTEMD_UNIT` per systemd. Durante un handoff avviato, il sentinel di riavvio può segnalare brevemente `stats.reason: "restart-health-pending"`; la continuazione viene ritardata finché la CLI non verifica il Gateway riavviato e scrive il sentinel finale `ok`.
    - `update.status` aggiorna e restituisce l'ultimo sentinel di riavvio dell'aggiornamento, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono il wizard di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agent e workspace">
    - `agents.list` restituisce le voci degli agent configurati, inclusi il modello effettivo e i metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agent e il cablaggio del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file del workspace di bootstrap esposti per un agent.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro delle attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di run e attività risolvono la sessione proprietaria lato server e restituiscono solo media della trascrizione con provenienza corrispondente; le origini URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono ai client SDK il rilevamento in sola lettura degli ambienti locali del Gateway e dei nodi.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agent o una sessione.
    - `agent.wait` attende il completamento di un run e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice corrente delle sessioni, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime agent.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione del Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più un `runId` opzionale, oppure passare solo `runId` per i run attivi che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna i metadati/override della sessione e riporta il modello canonico risolto più l'`agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione archiviata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono rimossi dal testo visibile, i payload XML in testo semplice delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamate agli strumenti troncati) e i token di controllo del modello ASCII/a larghezza piena fuoriusciti vengono rimossi, le righe dell'assistente composte da soli token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con segnaposto.
    - `chat.message.get` è il lettore additivo limitato del messaggio completo per una singola voce visibile della trascrizione. I client passano `sessionKey`, `agentId` opzionale quando la selezione della sessione è circoscritta all'agent, più un `messageId` della trascrizione precedentemente esposto tramite `chat.history`, e il Gateway restituisce la stessa proiezione normalizzata per la visualizzazione senza il limite di troncamento della cronologia leggera quando la voce archiviata è ancora disponibile e non è sovradimensionata.
    - `chat.send` accetta `fastMode: "auto"` per un singolo turno per usare la modalità veloce per le chiamate al modello avviate prima del cutoff automatico, quindi avviare chiamate successive di nuovo tentativo, fallback, risultato dello strumento o continuazione senza modalità veloce. Il cutoff predefinito è 60 secondi e può essere configurato per modello con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un chiamante di `chat.send` può passare `fastAutoOnSeconds` per un singolo turno per sovrascrivere il cutoff per quella richiesta.

  </Accordion>

  <Accordion title="Associazione dei dispositivi e token dei dispositivi">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.token.rotate` ruota il token di un dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca il token di un dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione dei nodi, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei nodi e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta invoke.
    - `node.event` riporta nel gateway gli eventi originati dal nodo.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro persistente in sospeso per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più la ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende un'approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot dei criteri di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono i criteri di approvazione exec locali del nodo tramite comandi relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai plugin.

  </Accordion>

  <Accordion title="Automazione, skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat del testo di risveglio; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - `cron.run` rimane una RPC in stile accodamento per i run manuali. I client che necessitano di semantiche di completamento devono leggere il `runId` restituito ed eseguire il polling di `cron.runs`.
    - `cron.runs` accetta un filtro `runId` opzionale non vuoto, così i client possono seguire un singolo run manuale accodato senza competere con altre voci della cronologia per lo stesso job.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi di chat
  solo di trascrizione. Nel protocollo v4, i payload delta contengono `deltaText`;
  `message` rimane lo snapshot cumulativo dell'assistente. Le sostituzioni non di prefisso impostano `replace=true`
  e usano `deltaText` come testo sostitutivo.
- `session.message`, `session.operation` e `session.tool`: aggiornamenti della trascrizione,
  dell'operazione di sessione in corso e dello stream di eventi per una sessione
  sottoscritta.
- `sessions.changed`: indice delle sessioni o metadati modificati.
- `presence`: aggiornamenti dello snapshot della presenza di sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot dello stato del gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica di run/job cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'associazione dei nodi.
- `node.invoke.request`: broadcast della richiesta invoke del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: configurazione del trigger della parola di risveglio modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione plugin.

### Metodi helper dei nodi

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle skill
  per i controlli di auto-consenso.

### RPC del registro delle attività

I client operatore possono ispezionare e annullare i record delle attività in background del Gateway tramite
le RPC del registro delle attività. Questi metodi restituiscono riepiloghi sanitizzati delle attività, non lo stato
runtime grezzo.

- `tasks.list` richiede `operator.read`.
  - Parametri: `status` opzionale (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o un array di questi stati,
    `agentId` opzionale, `sessionKey` opzionale, `limit` opzionale da `1` a
    `500` e stringa `cursor` opzionale.
  - Risultato: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` richiede `operator.read`.
  - Parametri: `{ "taskId": string }`.
  - Risultato: `{ "task": TaskSummary }`.
  - Gli ID attività mancanti restituiscono la forma di errore not-found del Gateway.
- `tasks.cancel` richiede `operator.write`.
  - Parametri: `{ "taskId": string, "reason"?: string }`.
  - Risultato:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica se il registro aveva un'attività corrispondente. `cancelled`
    indica se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati opzionali come `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento,
riepilogo terminale e testo di errore sanitizzato. `agentId` identifica l'agent
che esegue l'attività; `sessionKey` e `ownerKey` preservano il contesto del richiedente e di controllo.

### Metodi helper per operatori

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi di runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie viene indirizzata dal `name` primario:
    - `text` restituisce il token del comando di testo primario senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti di runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto di runtime attendibile dalla sessione lato server invece di accettare il contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è una proiezione con ambito sessione derivata dal server dell'inventario attivo, inclusi strumenti core, plugin, canale e strumenti dei server MCP già scoperti.
  - `tools.effective` è di sola lettura per MCP: può proiettare un catalogo MCP di sessione già preparato attraverso la policy finale degli strumenti, ma non crea runtime MCP, non connette trasporti e non emette `tools/list`. Se non esiste un catalogo preparato corrispondente, la risposta può includere un avviso come `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Le voci degli strumenti effettivi usano `source="core"`, `source="plugin"`, `source="channel"` o `source="mcp"`.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo stesso percorso di policy del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - I wrapper core riservati al proprietario come `cron`, `gateway` e `nodes` richiedono identità proprietario/admin (`operator.admin`) anche se il metodo `tools.invoke` stesso è `operator.write`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. Rifiuti di approvazione o policy restituiscono `ok:false` nel payload invece di bypassare la pipeline di policy degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile delle skill per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit` (`operator.admin`) per predisporre un archivio skill privato prima di installarlo. Questo è un percorso di upload admin separato per client attendibili, non il normale flusso di installazione delle skill ClawHub, ed è disabilitato per impostazione predefinita a meno che `skills.install.allowUploadedArchives` non sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` crea un upload associato a quello slug e valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` accoda byte all'offset decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e SHA-256. Il commit finalizza solo l'upload; non installa la skill.
  - Gli archivi skill caricati sono archivi zip contenenti una radice `SKILL.md`. Il nome della directory interna dell'archivio non seleziona mai la destinazione di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` del workspace dell'agente predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` installa un upload confermato nella directory `skills/<slug>` del workspace dell'agente predefinito. Lo slug e il valore force devono corrispondere alla richiesta originale `skills.upload.begin`. Questa modalità viene rifiutata a meno che `skills.install.allowUploadedArchives` non sia abilitato. L'impostazione non influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway. I client meno recenti possono ancora inviare `dangerouslyForceUnsafeInstall`; questo campo è deprecato, accettato solo per compatibilità di protocollo e ignorato. Usa `security.installPolicy` per decisioni di installazione di proprietà dell'operatore.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel workspace dell'agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento corrente di runtime. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per picker. Se `agents.defaults.models` è configurato, ha comunque la precedenza, inclusa la scoperta con ambito provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, ripiegando sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usalo per diagnostica e UI di scoperta, non per i normali picker di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand` canonici/metadati di sessione). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riutilizzano quel `systemRunPlan` canonico come contesto autorevole per comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di considerare attendibile il payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo sessione quando non è possibile risolvere alcuna route esterna consegnabile (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando è stata richiesta la consegna, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed` documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` si trova in `packages/gateway-protocol/src/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta intervalli che non includono il suo protocollo corrente. I client e server correnti richiedono il protocollo v4.
- Schemi + modelli sono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v4 e sono la baseline prevista per client di terze parti.

| Costante                                  | Valore predefinito                                   | Origine                                                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout richiesta (per RPC)               | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client accoppiato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                          | `src/gateway/client.ts`                                                                    |
| Periodo di grazia force-stop prima di `terminate()` | `250` ms                                   | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` effettivi in `hello-ok`; i client devono rispettare questi valori invece dei valori predefiniti pre-handshake.

## Auth

- L'autenticazione del Gateway a segreto condiviso usa `connect.params.auth.token` o
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano un'identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione connect dagli
  header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` con ingresso privato salta completamente
  l'autenticazione connect a segreto condiviso; non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo l'abbinamento, il Gateway emette un **token dispositivo** con ambito limitato al ruolo
  di connessione + agli ambiti. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  persistito dal client per le connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo ogni
  connect riuscito.
- La riconnessione con quel token dispositivo **memorizzato** deve anche riutilizzare l'insieme
  di ambiti approvato memorizzato per quel token. Questo conserva l'accesso di lettura/probe/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo admin.
- Assemblaggio dell'autenticazione connect lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualunque token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel retry una tantum
    `AUTH_TOKEN_MISMATCH` è consentita **solo per endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Il bootstrap con setup-code integrato restituisce il
  `hello-ok.auth.deviceToken` del nodo primario più un token operatore limitato in
  `hello-ok.auth.deviceTokens` per un handoff mobile attendibile. Il token operatore
  include `operator.talk.secrets` per le letture della configurazione nativa di Talk ed
  esclude `operator.admin` e `operator.pairing`.
- Mentre un bootstrap con setup-code non baseline è in attesa di approvazione, i dettagli
  `PAIRING_REQUIRED` includono `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  e `pauseReconnect: false`. I client devono continuare a riconnettersi con lo stesso
  token bootstrap finché la richiesta non viene approvata o il token diventa non valido.
- Persisti `hello-ok.auth.deviceTokens` solo quando il connect ha usato l'autenticazione bootstrap
  su un trasporto attendibile come `wss://` o abbinamento loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante resta autorevole; gli ambiti nella cache vengono
  riutilizzati solo quando il client riutilizza il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`). Ruotare o
  revocare un nodo o un altro ruolo non operatore richiede anche `operator.admin`.
- `device.token.rotate` restituisce metadati di rotazione. Fa eco al token bearer sostitutivo
  solo per chiamate dallo stesso dispositivo già autenticate con
  quel token dispositivo, così i client solo token possono persistere il sostituto prima di
  riconnettersi. Le rotazioni condivise/admin non fanno eco al token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato
  registrato nella voce di abbinamento di quel dispositivo; la mutazione dei token non può espandere né
  prendere di mira un ruolo dispositivo che l'approvazione dell'abbinamento non ha mai concesso.
- Per le sessioni con token dispositivo abbinato, la gestione dei dispositivi è auto-limitata a meno che il
  chiamante abbia anche `operator.admin`: i chiamanti non admin possono gestire solo il
  token operatore per la voce del **proprio** dispositivo. La gestione dei token di nodo e di altri
  non operatori è solo admin, anche per il dispositivo del chiamante.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token
  operatore target rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non admin
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo nella cache.
  - Se quel retry fallisce, i client devono interrompere i cicli di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.
- `AUTH_SCOPE_MISMATCH` significa che il token dispositivo è stato riconosciuto ma non copre
  il ruolo/gli ambiti richiesti. I client non devono presentarlo come token errato;
  chiedi all'operatore di riabbinare o approvare il contratto di ambito più ristretto/più ampio.

## Identità dispositivo + abbinamento

- I nodi devono includere un'identità dispositivo stabile (`device.id`) derivata da un
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di abbinamento sono richieste per i nuovi ID dispositivo, a meno che
  l'approvazione automatica locale sia abilitata.
- L'approvazione automatica dell'abbinamento è centrata sui connect diretti local loopback.
- OpenClaw ha anche un percorso stretto di self-connect backend/container-locale per
  flussi helper a segreto condiviso attendibili.
- I connect tailnet o LAN sullo stesso host sono ancora trattati come remoti per l'abbinamento e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  nodo). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione Control UI operatore `gateway.auth.mode: "trusted-proxy"` riuscita.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback sul percorso helper interno
    riservato.
- Omettere l'identità dispositivo ha conseguenze sugli ambiti. Quando una connessione operatore
  senza dispositivo è consentita tramite un percorso di fiducia esplicito, OpenClaw azzera comunque
  gli ambiti auto-dichiarati a un insieme vuoto, a meno che quel percorso abbia un'eccezione nominata
  di conservazione degli ambiti. I metodi protetti da ambito quindi falliscono con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` è un percorso Control UI
  break-glass di conservazione degli ambiti. Non concede ambiti a client WebSocket
  backend personalizzati arbitrari o con forma CLI.
- Il percorso helper backend `gateway-client` direct-loopback riservato conserva
  gli ambiti solo per RPC interne del control-plane locale; gli ID backend personalizzati non
  ricevono questa eccezione.
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
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde al fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Target di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo abbinato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono opzionalmente fissare il fingerprint del certificato del gateway (vedi la configurazione
  `gateway.tls` più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**API completa del Gateway** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `packages/gateway-protocol/src/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)

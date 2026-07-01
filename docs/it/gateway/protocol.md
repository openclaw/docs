---
read_when:
    - Implementare o aggiornare i client WS del Gateway
    - Debug di discrepanze di protocollo o errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-07-01T08:06:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, UI web, app macOS, nodi iOS/Android, nodi
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
  dimensioni, limiti, superfici e codici motivo sicuri. Non conservano il corpo del messaggio,
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

Mentre il Gateway sta ancora completando le sidecar di avvio, la richiesta `connect` può
restituire un errore riprovabile `UNAVAILABLE` con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero riprovare quella risposta
entro il budget complessivo di connessione invece di mostrarla come errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`packages/gateway-protocol/src/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è opzionale e associa i nomi delle superfici
dei plugin, come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactor sperimentale del plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway attuali devono usare le superfici dei plugin.

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
`client.mode: "backend"`) possono omettere `device` sulle connessioni loopback dirette quando
si autenticano con il token/password gateway condiviso. Questo percorso è riservato
alle RPC interne del piano di controllo e impedisce a baseline obsolete di associazione CLI/dispositivo di
bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni dei subagent. I client remoti,
i client con origine browser, i client nodo e i client con token dispositivo/identità dispositivo espliciti
usano ancora le normali verifiche di associazione e upgrade degli ambiti.

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

Il bootstrap integrato con codice QR/setup è un nuovo percorso di handoff mobile. Una connessione
con codice di setup baseline riuscita restituisce un token nodo primario più un token
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

L'handoff operatore è intenzionalmente limitato affinché l'onboarding QR possa avviare il
loop operatore mobile senza concedere `operator.admin` o `operator.pairing`.
Include `operator.talk.secrets` così il client nativo può leggere la configurazione Talk
di cui ha bisogno dopo il bootstrap. Ambiti admin e di associazione più ampi richiedono
un flusso separato approvato di associazione operatore o token. I client dovrebbero conservare
`hello-ok.auth.deviceTokens` solo
quando la connessione ha usato l'autenticazione bootstrap su un trasporto attendibile come `wss://` o
associazione loopback/locale.

### Esempio di nodo

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

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, le verifiche al momento dell'approvazione e la semantica
dei segreti condivisi, vedi [Ambiti operatore](/it/gateway/operator-scopes).

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
mantiene la forma della sorgente e può essere un oggetto SecretRef o una stringa redatta.

I metodi RPC gateway registrati dai plugin possono richiedere il proprio ambito operatore, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo gate. Alcuni slash command raggiunti tramite
`chat.send` applicano verifiche più rigide a livello di comando. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche una verifica aggiuntiva dell'ambito al momento dell'approvazione oltre
all'ambito di base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (nodo)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (es. `screen.record`, `camera.capture`).

Il Gateway tratta questi valori come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.
- `node.list` include i campi opzionali `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l'ora della loro connessione attuale come `lastSeenAtMs` con motivo `connect`; i nodi associati possono anche riportare
  presenza in background durevole quando un evento nodo attendibile aggiorna i metadati di associazione.

### Evento node background alive

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo associato era
alive durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate in
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

I gateway più vecchi possono ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come una
RPC confermata, non come persistenza durevole della presenza.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono filtrati per ambito in modo che le sessioni con ambito di associazione o solo nodo non ricevano passivamente contenuti di sessione.

- **Frame chat, agent e risultati tool** (inclusi eventi `agent` in streaming e risultati delle chiamate tool) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai plugin** sono filtrati su `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così la salute del trasporto rimane osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono filtrate per ambito per impostazione predefinita (fail-closed), a meno che un gestore registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per-client così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco di discovery
conservativo costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi
plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di integrità del Gateway memorizzato nella cache o sondato di recente.
    - `diagnostics.stability` restituisce il registratore recente e limitato della stabilità diagnostica. Mantiene metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di code/sessioni, nomi di canali/Plugin e ID sessione. Non conserva testo delle chat, corpi Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito amministratore.
    - `gateway.identity.get` restituisce l'identità del dispositivo Gateway usata dai flussi di relay e abbinamento.
    - `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi operatore/Node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione degli Heartbeat sul Gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti a runtime. Passa `{ "view": "configured" }` per i modelli configurati di dimensione adatta al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce le finestre di utilizzo dei provider e i riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
      Passa `agentId` per un agente, oppure `agentScope: "all"` per aggregare gli agenti configurati.
    - `doctor.memory.status` restituisce lo stato di prontezza della memoria vettoriale / embedding memorizzati nella cache per il workspace dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante richiede esplicitamente un ping live al provider di embedding. I client compatibili con Dreaming possono anche passare `{ "agentId": "agent-id" }` per limitare le statistiche dello store Dreaming a un workspace agente selezionato; omettere `agentId` mantiene il fallback all'agente predefinito e aggrega i workspace Dreaming configurati.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` accettano parametri opzionali `{ "agentId": "agent-id" }` per viste/azioni Dreaming dell'agente selezionato. Quando `agentId` viene omesso, operano sul workspace dell'agente predefinito configurato.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per i client remoti del piano di controllo. Può includere percorsi dei workspace, frammenti di memoria, markdown grounded renderizzato e candidati di promozione deep, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione. Passa `agentId` per un
      agente, oppure `agentScope: "all"` per elencare insieme gli agenti configurati.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi dello stato dei canali/Plugin integrati + inclusi.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta la disconnessione.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider del canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce gli attivatori di parola di attivazione memorizzati.
    - `voicewake.set` aggiorna gli attivatori di parola di attivazione e diffonde la modifica.

  </Accordion>

  <Accordion title="Messaggi e log">
    - `send` è l'RPC di recapito in uscita diretto per invii mirati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda configurata del log su file del Gateway con controlli per cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce in tempo reale. Include ID provider, etichette, stato configurato, ID di modelli/voci esposti, modalità canoniche, trasporti, strategie del cervello e flag audio/capacità in tempo reale, senza restituire segreti del provider o modificare la configurazione globale.
    - `talk.config` restituisce il payload di configurazione Talk effettivo; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Per `stt-tts/managed-room`, i chiamanti `operator.write` che passano `sessionKey` devono passare anche `spawnedBy` per una visibilità della chiave di sessione con ambito; la creazione di `sessionKey` senza ambito e `brain: "direct-tools"` richiedono `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` quando necessario e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token archiviato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay in tempo reale e di trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` gestiscono il ciclo di vita del turno managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione VAD-gated nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione relay in tempo reale di proprietà del Gateway. Passa `options: { willContinue: true }` per l'output intermedio dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta dell'assistente in tempo reale.
    - `talk.session.steer` invia il controllo vocale dell'esecuzione attiva a una sessione Talk con agente di supporto di proprietà del Gateway. Accetta `{ sessionId, text, mode? }`, dove `mode` è `status`, `steer`, `cancel` o `followup`; la modalità omessa viene classificata dal testo parlato.
    - `talk.session.close` chiude una sessione relay, trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato della modalità Talk corrente per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider in tempo reale di proprietà del client usando `webrtc` o `provider-websocket`, mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale di proprietà del client di inoltrare le chiamate a strumenti del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.client.steer` invia il controllo vocale dell'esecuzione attiva per i trasporti in tempo reale di proprietà del client. Il Gateway risolve l'esecuzione incorporata attiva da `sessionKey` e restituisce un risultato strutturato accettato/rifiutato invece di scartare silenziosamente il controllo.
    - `talk.event` è il singolo canale eventi Talk per adattatori in tempo reale, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario dei provider TTS visibili.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione testo-voce una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei segreti runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate a comandi per uno specifico insieme comando/destinazione.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione. La sostituzione distruttiva degli array
      richiede il percorso interessato in `replacePaths`; gli array annidati
      sotto voci di array usano percorsi `[]` come `agents.list[].skills`.
    - `config.apply` convalida e sostituisce il payload di configurazione completo.
    - `config.schema` restituisce il payload dello schema di configurazione live usato dagli strumenti Control UI e CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di Plugin e canali quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dalla UI, inclusi rami di composizione per oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione dei campi corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath`, `reloadKind` facoltativo e riepiloghi immediati dei figli per l'approfondimento UI/CLI. `reloadKind` è uno tra `restart`, `hot` o `none` e rispecchia il pianificatore di ricaricamento della configurazione del Gateway per il percorso richiesto. I nodi dello schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, `reloadKind` facoltativo, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` in modo che l'avvio riprenda un turno agente di follow-up tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore pacchetti e gli aggiornamenti git-checkout supervisionati dal piano di controllo usano un passaggio di consegne a servizio gestito distaccato invece di sostituire l'albero dei pacchetti o modificare l'output di checkout/build all'interno del Gateway live. Un passaggio di consegne avviato restituisce `ok: true` con `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; i passaggi di consegne non disponibili o non riusciti restituiscono `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, più `handoff.command` quando è richiesto un aggiornamento manuale da shell. Un passaggio di consegne non disponibile significa che OpenClaw non dispone di un confine di supervisione sicuro o di un'identità di servizio durevole, come `OPENCLAW_SYSTEMD_UNIT` per systemd. Durante un passaggio di consegne avviato, il sentinel di riavvio può segnalare brevemente `stats.reason: "restart-health-pending"`; la continuazione viene ritardata finché la CLI non verifica il Gateway riavviato e scrive il sentinel `ok` finale.
    - `update.status` aggiorna e restituisce il sentinel di riavvio dell'aggiornamento più recente, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agente e area di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi il modello effettivo e i metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio dell'area di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file dell'area di lavoro di bootstrap esposti per un agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro delle attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalle trascrizioni per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono la sessione proprietaria lato server e restituiscono solo i media della trascrizione con provenienza corrispondente; le sorgenti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono ai client SDK il rilevamento in sola lettura degli ambienti locali al Gateway e dei nodi.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice della sessione corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica della sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione del Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più un `runId` opzionale, oppure passare solo `runId` per le esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna i metadati/override della sessione e riporta il modello canonico risolto più l'`agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione archiviata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi, le righe dell'assistente composte solo da token silenziosi come `NO_REPLY` / `no_reply` esatti vengono omesse, e le righe sovradimensionate possono essere sostituite con placeholder.
    - `chat.message.get` è il lettore additivo, limitato, del messaggio completo per una singola voce visibile della trascrizione. I client passano `sessionKey`, un `agentId` opzionale quando la selezione della sessione è limitata all'agente, più un `messageId` della trascrizione precedentemente esposto tramite `chat.history`, e il Gateway restituisce la stessa proiezione normalizzata per la visualizzazione senza il limite leggero di troncamento della cronologia quando la voce archiviata è ancora disponibile e non è sovradimensionata.
    - `chat.send` accetta `fastMode: "auto"` per un singolo turno per usare la modalità rapida per le chiamate al modello avviate prima del limite automatico, quindi avviare successivamente chiamate di nuovo tentativo, fallback, risultato dello strumento o continuazione senza modalità rapida. Il limite predefinito è 60 secondi e può essere configurato per modello con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un chiamante `chat.send` può passare `fastAutoOnSeconds` per un singolo turno per sovrascrivere il limite per quella richiesta.

  </Accordion>

  <Accordion title="Abbinamento dispositivi e token dei dispositivi">
    - `device.pair.list` restituisce i dispositivi abbinati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di abbinamento dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo abbinato entro i limiti del ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo abbinato entro i limiti del ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Abbinamento nodi, invocazione e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'abbinamento dei nodi e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo abbinato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta di invocazione.
    - `node.event` trasporta gli eventi originati dal nodo verso il gateway.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per i nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più la ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` al timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot delle policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al nodo tramite comandi di relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat del testo di risveglio; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - `cron.run` rimane una RPC in stile accodamento per le esecuzioni manuali. I client che richiedono semantica di completamento devono leggere il `runId` restituito ed eseguire il polling di `cron.runs`.
    - `cron.runs` accetta un filtro opzionale non vuoto `runId` così i client possono seguire una singola esecuzione manuale in coda senza entrare in competizione con altre voci della cronologia per lo stesso job.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat dell'interfaccia utente come `chat.inject` e altri eventi di chat
  solo di trascrizione. Nel protocollo v4, i payload delta contengono `deltaText`; `message` rimane
  lo snapshot cumulativo dell'assistente. Le sostituzioni non di prefisso impostano `replace=true`
  e usano `deltaText` come testo sostitutivo.
- `session.message`, `session.operation` e `session.tool`: aggiornamenti di trascrizione,
  operazione di sessione in corso e flusso di eventi per una sessione
  sottoscritta.
- `sessions.changed`: indice della sessione o metadati modificati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / vitalità.
- `health`: aggiornamento dello snapshot di salute del Gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento del Node.
- `node.invoke.request`: broadcast della richiesta di invocazione del Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger della parola di attivazione modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione
  exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione
  Plugin.

### Metodi helper del Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle Skill
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
  - Gli id attività mancanti restituiscono la forma di errore not-found del Gateway.
- `tasks.cancel` richiede `operator.write`.
  - Parametri: `{ "taskId": string, "reason"?: string }`.
  - Risultato:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica se il registro conteneva un'attività corrispondente. `cancelled`
    indica se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati opzionali come `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento,
riepilogo terminale e testo di errore sanitizzato. `agentId` identifica l'agente
che esegue l'attività; `sessionKey` e `ownerKey` preservano il contesto del richiedente e di controllo.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi di runtime per un agente.
  - `agentId` è facoltativo; ometterlo per leggere il workspace agente predefinito.
  - `scope` controlla quale superficie è destinazione del `name` primario:
    - `text` restituisce il token del comando testuale primario senza il `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti di runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: indica se uno strumento Plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto di runtime attendibile dalla sessione lato server invece di accettare contesto di autenticazione o recapito fornito dal chiamante.
  - La risposta è una proiezione derivata dal server e limitata alla sessione dell'inventario attivo, inclusi strumenti core, Plugin, canale e strumenti server MCP già scoperti.
  - `tools.effective` è di sola lettura per MCP: può proiettare un catalogo MCP di sessione già caldo attraverso la policy finale degli strumenti, ma non crea runtime MCP, non connette trasporti né emette `tools/list`. Se non esiste un catalogo caldo corrispondente, la risposta può includere un avviso come `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Le voci degli strumenti effettivi usano `source="core"`, `source="plugin"`, `source="channel"` o `source="mcp"`.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo stesso percorso di policy del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - I wrapper core solo per proprietari come `cron`, `gateway` e `nodes` richiedono identità proprietario/admin (`operator.admin`) anche se il metodo `tools.invoke` stesso è `operator.write`.
  - La risposta è un envelope rivolto all'SDK con campi `ok`, `toolName`, `output` facoltativo ed `error` tipizzato. Le approvazioni o i rifiuti di policy restituiscono `ok:false` nel payload invece di bypassare la pipeline della policy degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario delle skill visibile per un agente.
  - `agentId` è facoltativo; ometterlo per leggere il workspace agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di discovery di ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit` (`operator.admin`) per predisporre un archivio di skill privato prima di installarlo. Questo è un percorso di caricamento admin separato per client attendibili, non il normale flusso di installazione delle skill di ClawHub, ed è disabilitato per impostazione predefinita a meno che `skills.install.allowUploadedArchives` non sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })` crea un caricamento associato a quello slug e a quel valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte all'offset decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e SHA-256. Il commit finalizza solo il caricamento; non installa la skill.
  - Gli archivi di skill caricati sono archivi zip che contengono una radice `SKILL.md`. Il nome della directory interna dell'archivio non seleziona mai la destinazione di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` del workspace agente predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }` installa un caricamento sottoposto a commit nella directory `skills/<slug>` del workspace agente predefinito. Lo slug e il valore force devono corrispondere alla richiesta originale `skills.upload.begin`. Questa modalità viene rifiutata a meno che `skills.install.allowUploadedArchives` non sia abilitato. L'impostazione non influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host gateway. I client meno recenti possono ancora inviare `dangerouslyForceUnsafeInstall`; questo campo è deprecato, accettato solo per compatibilità di protocollo e ignorato. Usare `security.installPolicy` per le decisioni di installazione di proprietà dell'operatore.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel workspace agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento di runtime attuale. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per picker. Se `agents.defaults.models` è configurato, ha comunque la precedenza, inclusa la discovery con ambito provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, ripiegando sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usarlo per diagnostica e UI di discovery, non per i normali picker di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand` canonici/metadati di sessione). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di recapito agente

- Le richieste `agent` possono includere `deliver=true` per richiedere il recapito in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: destinazioni di recapito non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo di sessione quando non è possibile risolvere alcuna route recapitatile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando il recapito è stato richiesto, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed` documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` risiede in `packages/gateway-protocol/src/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta intervalli che non includono il suo protocollo corrente. I client e server attuali richiedono il protocollo v4.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v4 e rappresentano la baseline attesa per i client di terze parti.

| Costante                                  | Predefinito                                          | Sorgente                                                                                   |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout richiesta (per RPC)               | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget accoppiato server/client) |
| Backoff iniziale di riconnessione         | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Grazia force-stop prima di `terminate()`  | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                           |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi di `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare quei valori invece dei valori predefiniti precedenti all'handshake.

## Auth

- L'autenticazione del Gateway con segreto condiviso usa `connect.params.auth.token` o
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non-loopback, soddisfano il controllo di autenticazione
  della connessione tramite gli header della richiesta invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingresso privato salta completamente
  l'autenticazione della connessione con segreto condiviso; non esporre quella modalità
  su ingressi pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **token del dispositivo** limitato al ruolo
  della connessione + ambiti. Viene restituito in `hello-ok.auth.deviceToken` e deve
  essere persistito dal client per le connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token del dispositivo **memorizzato** deve anche riutilizzare
  l'insieme di ambiti approvati memorizzato per quel token. Questo preserva l'accesso
  in lettura/probe/stato già concesso ed evita di ridurre silenziosamente le riconnessioni
  a un ambito implicito più ristretto solo amministratore.
- Assemblaggio dell'autenticazione della connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per dispositivo memorizzato (indicizzato
    da `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo risolto lo sopprime.
  - La promozione automatica di un token del dispositivo memorizzato nel retry unico
    `AUTH_TOKEN_MISMATCH` è consentita **solo per endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Il bootstrap con codice di configurazione integrato restituisce il
  `hello-ok.auth.deviceToken` del Node primario più un token operatore limitato in
  `hello-ok.auth.deviceTokens` per il passaggio mobile attendibile. Il token operatore
  include `operator.talk.secrets` per le letture della configurazione nativa di Talk ed
  esclude `operator.admin` e `operator.pairing`.
- Mentre un bootstrap con codice di configurazione non baseline attende approvazione, i
  dettagli `PAIRING_REQUIRED` includono `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` e `pauseReconnect: false`. I client devono continuare a riconnettersi
  con lo stesso token di bootstrap finché la richiesta non viene approvata o il token
  diventa non valido.
- Persisti `hello-ok.auth.deviceTokens` solo quando la connessione ha usato autenticazione
  bootstrap su un trasporto attendibile come `wss://` o pairing loopback/local.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono
  riutilizzati solo quando il client riutilizza il token per dispositivo memorizzato.
- I token del dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`). Ruotare o revocare un
  Node o un altro ruolo non operatore richiede anche `operator.admin`.
- `device.token.rotate` restituisce metadati di rotazione. Replica il token bearer
  sostitutivo solo per chiamate dallo stesso dispositivo già autenticate con quel token
  del dispositivo, così i client basati solo su token possono persistere il sostituto
  prima di riconnettersi. Le rotazioni condivise/amministrative non replicano il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvati
  registrato nella voce di pairing di quel dispositivo; la mutazione dei token non può
  espandere o indirizzare un ruolo del dispositivo che l'approvazione del pairing non
  ha mai concesso.
- Per le sessioni con token di dispositivo associato, la gestione dei dispositivi è
  limitata a sé stessa a meno che il chiamante non abbia anche `operator.admin`: i
  chiamanti non amministratori possono gestire solo il token operatore per la voce del
  **proprio** dispositivo. La gestione dei token Node e di altri token non operatore è
  solo amministrativa, anche per il dispositivo del chiamante.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti
  del token operatore di destinazione rispetto agli ambiti della sessione corrente del
  chiamante. I chiamanti non amministratori non possono ruotare o revocare un token
  operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i loop di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.
- `AUTH_SCOPE_MISMATCH` significa che il token del dispositivo è stato riconosciuto ma non
  copre il ruolo/gli ambiti richiesti. I client non devono presentarlo come token errato;
  chiedi all'operatore di ripetere il pairing o approvare il contratto di ambito più
  ristretto/più ampio.

## Identità del dispositivo + pairing

- I Node devono includere un'identità del dispositivo stabile (`device.id`) derivata da
  un fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo, a meno che
  l'approvazione automatica locale non sia abilitata.
- L'approvazione automatica del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN dallo stesso host sono comunque trattate come remote per il
  pairing e richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni operatore senza dispositivo sono percorsi di attendibilità espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione riuscita della Control UI operatore con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergenza, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback sul percorso helper interno riservato.
- Omettere l'identità del dispositivo ha conseguenze sugli ambiti. Quando una connessione
  operatore senza dispositivo è consentita tramite un percorso di attendibilità esplicito,
  OpenClaw azzera comunque gli ambiti autodichiarati a un insieme vuoto, a meno che quel
  percorso non abbia un'eccezione nominata di preservazione degli ambiti. I metodi protetti
  da ambito falliscono quindi con `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` è un percorso di preservazione
  degli ambiti di emergenza della Control UI. Non concede ambiti a client WebSocket
  backend personalizzati o con forma da CLI arbitrari.
- Il percorso helper backend riservato direct-loopback `gateway-client` preserva gli
  ambiti solo per RPC interne del piano di controllo locale; gli ID backend personalizzati
  non ricevono questa eccezione.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell'autenticazione del dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo scostamento consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde al fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo della migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei
  metadati dei dispositivi associati controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono opzionalmente fissare il fingerprint del certificato del gateway (vedi la
  configurazione `gateway.tls` più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API completa del gateway** (stato, canali, modelli, chat,
agente, sessioni, Node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `packages/gateway-protocol/src/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

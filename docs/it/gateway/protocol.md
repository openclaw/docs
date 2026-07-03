---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug di mismatch di protocollo o errori di connessione
    - Rigenerazione dello schema e dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-07-03T13:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android, nodi
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito**
durante l'handshake.

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

Gateway → Client (sfida pre-connect):

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

Mentre il Gateway sta ancora completando i sidecar di avvio, la richiesta `connect` può
restituire un errore `UNAVAILABLE` ritentabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero ritentare quella risposta
entro il budget complessivo di connessione invece di presentarla come errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`packages/gateway-protocol/src/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e mappa i nomi delle superfici
dei plugin, come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una voce fresca
in `pluginSurfaceUrls`. Il refactor sperimentale del plugin Canvas non supporta
il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway correnti devono usare
le superfici dei plugin.

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
si autenticano con il token/la password Gateway condivisi. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce a baseline obsolete di associazione CLI/dispositivo
di bloccare il lavoro del backend locale, come gli aggiornamenti delle sessioni subagent. I client remoti,
i client di origine browser, i client node e i client espliciti con token dispositivo/identità dispositivo
usano ancora i normali controlli di associazione e upgrade degli ambiti.

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

Il bootstrap integrato con QR/codice di setup è un percorso fresco di passaggio mobile. Una connessione
riuscita con codice di setup baseline restituisce un token node primario più un token
operator limitato:

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

Il passaggio operator è intenzionalmente limitato, così l'onboarding QR può avviare il
ciclo operator mobile e completare il setup nativo senza concedere ambiti di mutazione
dell'associazione o `operator.admin`. Include `operator.talk.secrets` affinché il
client nativo possa leggere la configurazione Talk necessaria dopo il bootstrap. Un accesso più ampio
ad associazione e amministrazione richiede un flusso separato approvato di associazione operator o token.
I client dovrebbero persistere
`hello-ok.auth.deviceTokens` solo
quando la connessione ha usato l'autenticazione bootstrap su un trasporto attendibile come `wss://` o
associazione loopback/locale.

### Esempio Node

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

Per il modello completo degli ambiti operator, i controlli al momento dell'approvazione e la semantica
del segreto condiviso, consulta [Ambiti operator](/it/gateway/operator-scopes).

### Ruoli

- `operator` = client del piano di controllo (CLI/UI/automazione).
- `node` = host di capacità (camera/screen/canvas/system.run).

### Ambiti (operator)

Ambiti comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).
Quando i segreti sono inclusi, i client dovrebbero leggere la credenziale del provider Talk attivo
da `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
resta nella forma sorgente e può essere un oggetto SecretRef o una stringa oscurata.

I metodi RPC del gateway registrati dai plugin possono richiedere il proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più restrittivi a livello di comando. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/comandi/autorizzazioni (node)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per l'invocazione.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi valori come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l'ora della loro connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi associati possono anche riportare
  presenza in background durevole quando un evento node attendibile aggiorna i metadati della loro associazione.

### Evento node vivo in background

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo associato era
vivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L'evento è durevole solo per sessioni dispositivo node
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

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti da ambiti, così le sessioni con ambito di associazione o solo node non ricevono passivamente contenuti di sessione.

- **Frame di chat, agente e risultati degli strumenti** (inclusi eventi `agent` in streaming e risultati di chiamate strumento) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai plugin** sono protetti da `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni, così lo stato del trasporto rimane osservabile per ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono protette da ambito per impostazione predefinita (fail-closed) a meno che un handler registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per-client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso di eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth riportati sopra. Questo
non è un dump generato: `hello-ok.features.methods` è una lista di discovery
conservativa costruita da `src/gateway/server-methods-list.ts` più gli export dei metodi
di plugin/canali caricati. Trattala come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce l'istantanea di integrità del Gateway memorizzata nella cache o appena sondata.
    - `diagnostics.stability` restituisce il registratore limitato della stabilità diagnostica recente. Conserva metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi di canali/Plugin e ID sessione. Non conserva testo delle chat, corpi dei Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura dell'operatore.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito amministratore.
    - `gateway.identity.get` restituisce l'identità del dispositivo Gateway usata dai flussi di relay e abbinamento.
    - `system-presence` restituisce l'istantanea di presenza corrente per i dispositivi operatore/Node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione degli Heartbeat sul Gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati di dimensioni adatte al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce finestre di utilizzo del provider/riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
      Passa `agentId` per un agente, oppure `agentScope: "all"` per aggregare gli agenti configurati.
    - `doctor.memory.status` restituisce lo stato di prontezza della memoria vettoriale / degli embedding memorizzati nella cache per l'area di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding. I client consapevoli di Dreaming possono anche passare `{ "agentId": "agent-id" }` per limitare le statistiche dello store Dreaming a un'area di lavoro agente selezionata; omettere `agentId` mantiene il fallback dell'agente predefinito e aggrega le aree di lavoro Dreaming configurate.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` accettano parametri opzionali `{ "agentId": "agent-id" }` per viste/azioni Dreaming sull'agente selezionato. Quando `agentId` viene omesso, operano sull'area di lavoro dell'agente predefinito configurato.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per i client remoti del piano di controllo. Può includere percorsi dell'area di lavoro, frammenti di memoria, markdown grounded renderizzato e candidati alla promozione profonda, quindi i chiamanti hanno bisogno di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione. Passa `agentId` per un
      agente, oppure `agentScope: "all"` per elencare insieme gli agenti configurati.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del registro di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e strumenti di supporto per l'accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider del canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un Node iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word archiviati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC di consegna in uscita diretta per invii mirati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda configurata del file di log del Gateway con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo in sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce in tempo reale. Include ID provider canonici, alias del registro, etichette, stato configurato, un risultato opzionale `ready` a livello di gruppo, ID modello/voce esposti, modalità canoniche, trasporti, strategie del cervello e flag audio/capacità in tempo reale senza restituire segreti del provider né modificare la configurazione globale. I Gateway attuali impostano `ready` dopo aver applicato la selezione del provider a runtime; per compatibilità con Gateway più vecchi, i client devono trattarne l'assenza come non verificata.
    - `talk.config` restituisce il payload della configurazione Talk effettiva; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Per `stt-tts/managed-room`, i chiamanti `operator.write` che passano `sessionKey` devono passare anche `spawnedBy` per la visibilità della chiave di sessione con ambito; la creazione di `sessionKey` senza ambito e `brain: "direct-tools"` richiedono `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token memorizzato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay in tempo reale e trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` gestiscono il ciclo di vita dei turni managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione VAD-gated nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione relay in tempo reale di proprietà del Gateway. Passa `options: { willContinue: true }` per output temporaneo dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta dell'assistente in tempo reale.
    - `talk.session.steer` invia il controllo vocale dell'esecuzione attiva a una sessione Talk di proprietà del Gateway e basata su agent. Accetta `{ sessionId, text, mode? }`, dove `mode` è `status`, `steer`, `cancel` o `followup`; la modalità omessa viene classificata dal testo pronunciato.
    - `talk.session.close` chiude una sessione relay, trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato della modalità Talk corrente per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider in tempo reale di proprietà del client usando `webrtc` o `provider-websocket`, mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale di proprietà del client di inoltrare le chiamate a strumento del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID di esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.client.steer` invia il controllo vocale dell'esecuzione attiva per trasporti in tempo reale di proprietà del client. Il Gateway risolve l'esecuzione incorporata attiva da `sessionKey` e restituisce un risultato strutturato accettato/rifiutato invece di scartare silenziosamente lo steering.
    - `talk.event` è il singolo canale di eventi Talk per adattatori in tempo reale, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza il parlato tramite il provider Talk di sintesi vocale attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato di configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` commutano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo le SecretRef attive e sostituisce lo stato dei segreti a runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti mirate a comandi per uno specifico insieme comando/destinazione.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione. La sostituzione distruttiva degli array
      richiede il percorso interessato in `replacePaths`; gli array annidati
      sotto voci di array usano percorsi `[]` come `agents.list[].skills`.
    - `config.apply` convalida e sostituisce il payload di configurazione completo.
    - `config.schema` restituisce il payload dello schema di configurazione live usato dagli strumenti Control UI e CLI: schema, `uiHints`, versione e metadati di generazione, inclusi metadati degli schemi di plugin e canali quando il runtime riesce a caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia, inclusi rami di composizione per oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione dei campi corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito per percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath`, `reloadKind` opzionale e riepiloghi dei figli immediati per il drill-down UI/CLI. `reloadKind` è uno tra `restart`, `hot` o `none` e rispecchia il pianificatore di ricaricamento della configurazione del Gateway per il percorso richiesto. I nodi schema di lookup mantengono la documentazione rivolta all'utente e i campi di validazione comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, `reloadKind` opzionale, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno agent di follow-up tramite la coda di continuazione del riavvio. Gli aggiornamenti tramite package manager e gli aggiornamenti supervisionati di checkout git dal piano di controllo usano un passaggio di consegne managed-service distaccato invece di sostituire l'albero dei pacchetti o modificare output di checkout/build all'interno del Gateway live. Un passaggio di consegne avviato restituisce `ok: true` con `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; passaggi di consegne non disponibili o non riusciti restituiscono `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, più `handoff.command` quando è richiesto un aggiornamento manuale da shell. Un passaggio di consegne non disponibile significa che OpenClaw non dispone di un confine di supervisione sicuro o di un'identità di servizio durevole, come `OPENCLAW_SYSTEMD_UNIT` per systemd. Durante un passaggio di consegne avviato, il sentinel di riavvio può segnalare brevemente `stats.reason: "restart-health-pending"`; la continuazione viene ritardata finché la CLI non verifica il Gateway riavviato e scrive il sentinel finale `ok`.
    - `update.status` aggiorna e restituisce l'ultimo sentinel di riavvio dell'aggiornamento, inclusa la versione in esecuzione post-riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agenti e area di lavoro">
    - `agents.list` restituisce le voci agente configurate, inclusi modello effettivo e metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio dell'area di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file bootstrap dell'area di lavoro esposti per un agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo media della trascrizione con provenienza corrispondente; le origini URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono ai client SDK il rilevamento in sola lettura degli ambienti locali del Gateway e del Node.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessioni">
    - `sessions.list` restituisce l'indice delle sessioni corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più un `runId` facoltativo, oppure passare solo `runId` per le esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più l'`agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione archiviata.
    - L'esecuzione chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/a larghezza intera trapelati vengono rimossi, le righe assistente composte solo da token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse, e le righe sovradimensionate possono essere sostituite con segnaposto.
    - `chat.message.get` è il lettore additivo, limitato e a messaggio completo per una singola voce visibile della trascrizione. I client passano `sessionKey`, `agentId` facoltativo quando la selezione della sessione è circoscritta all'agente, più un `messageId` della trascrizione precedentemente esposto tramite `chat.history`, e il Gateway restituisce la stessa proiezione normalizzata per la visualizzazione senza il limite leggero di troncamento della cronologia quando la voce archiviata è ancora disponibile e non sovradimensionata.
    - `chat.send` accetta `fastMode: "auto"` per un turno per usare la modalità veloce per le chiamate modello avviate prima del limite automatico, quindi avviare chiamate successive di ritentativo, fallback, risultato strumento o continuazione senza modalità veloce. Il limite predefinito è 60 secondi e può essere configurato per modello con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un chiamante `chat.send` può passare `fastAutoOnSeconds` per un turno per sovrascrivere il limite per quella richiesta.

  </Accordion>

  <Accordion title="Abbinamento dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi abbinati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di abbinamento dispositivi.
    - `device.token.rotate` ruota un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Abbinamento Node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'abbinamento Node e la verifica bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei Node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un Node abbinato.
    - `node.invoke` inoltra un comando a un Node connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta di invoke.
    - `node.event` riporta nel gateway gli eventi originati dal Node.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei Node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per Node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono richieste di approvazione exec una tantum più ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` al timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al Node tramite comandi relay del Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat del testo di risveglio; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - `cron.run` rimane una RPC in stile accodamento per esecuzioni manuali. I client che necessitano di semantica di completamento devono leggere il `runId` restituito ed eseguire il polling di `cron.runs`.
    - `cron.runs` accetta un filtro `runId` facoltativo non vuoto, così i client possono seguire una singola esecuzione manuale accodata senza competere con altre voci della cronologia per lo stesso job.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti chat UI come `chat.inject` e altri eventi chat solo di trascrizione. Nel protocollo v4, i payload delta trasportano `deltaText`; `message` rimane lo snapshot cumulativo dell'assistente. Le sostituzioni non prefisso impostano `replace=true` e usano `deltaText` come testo sostitutivo.
- `session.message`, `session.operation` e `session.tool`: aggiornamenti di trascrizione, operazione di sessione in corso e flusso eventi per una sessione sottoscritta.
- `sessions.changed`: indice sessioni o metadati modificati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di integrità del gateway.
- `heartbeat`: aggiornamento del flusso eventi Heartbeat.
- `cron`: evento di modifica esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento Node.
- `node.invoke.request`: broadcast della richiesta di invoke Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita dei dispositivi abbinati.
- `voicewake.changed`: configurazione del trigger parola di risveglio modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione Plugin.

### Metodi helper Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili Skills per i controlli di auto-allow.

### RPC del registro attività

I client operatore possono ispezionare e annullare i record delle attività in background del Gateway tramite le RPC del registro attività. Questi metodi restituiscono riepiloghi attività sanitizzati, non stato runtime grezzo.

- `tasks.list` richiede `operator.read`.
  - Parametri: `status` facoltativo (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` o `"timed_out"`) o un array di tali stati, `agentId` facoltativo, `sessionKey` facoltativo, `limit` facoltativo da `1` a `500` e `cursor` stringa facoltativo.
  - Risultato: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` richiede `operator.read`.
  - Parametri: `{ "taskId": string }`.
  - Risultato: `{ "task": TaskSummary }`.
  - Gli ID attività mancanti restituiscono la forma di errore not-found del Gateway.
- `tasks.cancel` richiede `operator.write`.
  - Parametri: `{ "taskId": string, "reason"?: string }`.
  - Risultato:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` segnala se il registro conteneva un'attività corrispondente. `cancelled` segnala se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati facoltativi come `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento, riepilogo terminale e testo di errore sanitizzato. `agentId` identifica l'agente che esegue l'attività; `sessionKey` e `ownerKey` preservano il contesto del richiedente e di controllo.

### Metodi helper operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi a runtime per un agente.
  - `agentId` è facoltativo; ometterlo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie prende di mira il `name` primario:
    - `text` restituisce il token del comando testuale primario senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più la disponibilità dei comandi
    plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti a runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento del plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti
  effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare
    autenticazione o contesto di consegna forniti dal chiamante.
  - La risposta è una proiezione con ambito sessione derivata dal server dell'inventario attivo,
    inclusi strumenti core, plugin, canale e strumenti server MCP già scoperti.
  - `tools.effective` è di sola lettura per MCP: può proiettare un catalogo MCP di sessione caldo attraverso la
    policy finale degli strumenti, ma non crea runtime MCP, non connette trasporti né emette
    `tools/list`. Se non esiste un catalogo caldo corrispondente, la risposta può includere un avviso come
    `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Le voci degli strumenti effettivi usano `source="core"`, `source="plugin"`, `source="channel"` o
    `source="mcp"`.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo
  stesso percorso di policy del Gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a
    `agentId`.
  - Wrapper core riservati ai proprietari come `cron`, `gateway` e `nodes` richiedono
    identità proprietario/admin (`operator.admin`) anche se il metodo
    `tools.invoke` stesso è `operator.write`.
  - La risposta è un envelope rivolto all'SDK con campi `ok`, `toolName`, `output` facoltativo e
    `error` tipizzati. I rifiuti di approvazione o policy restituiscono `ok:false` nel payload invece di
    bypassare la pipeline della policy degli strumenti del Gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario
  delle skill visibile per un agente.
  - `agentId` è facoltativo; ometterlo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di scoperta di ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e
  `skills.upload.commit` (`operator.admin`) per preparare un archivio skill privato
  prima di installarlo. Questo è un percorso di caricamento admin separato per client attendibili,
  non il normale flusso di installazione skill di ClawHub, ed è disabilitato per impostazione predefinita a meno che
  `skills.install.allowUploadedArchives` sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea un caricamento associato a quello slug e a quel valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte
    all'offset decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e
    SHA-256. Il commit finalizza solo il caricamento; non installa la skill.
  - Gli archivi skill caricati sono archivi zip che contengono una radice `SKILL.md`. Il
    nome della directory interna dell'archivio non seleziona mai la destinazione di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` del workspace dell'agente predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installa un caricamento confermato nella directory `skills/<slug>`
    del workspace dell'agente predefinito. Lo slug e il valore force devono corrispondere alla richiesta
    `skills.upload.begin` originale. Questa modalità viene rifiutata a meno che
    `skills.install.allowUploadedArchives` sia abilitato. L'impostazione non
    influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host Gateway.
    I client più vecchi possono ancora inviare `dangerouslyForceUnsafeInstall`; questo campo è
    deprecato, accettato solo per compatibilità di protocollo e ignorato. Usare
    `security.installPolicy` per le decisioni di installazione di proprietà dell'operatore.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel
    workspace dell'agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per picker. Se `agents.defaults.models` è configurato, continua ad avere la precedenza, inclusa la scoperta con ambito provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, ripiegando sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usarlo per diagnostica e interfacce di scoperta, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il Gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il
  Gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: target di consegna non risolti o solo interni restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo in sessione quando non è possibile risolvere alcuna rotta consegnabile esterna (ad esempio sessioni interne/webchat o configurazioni multicanale ambigue).
- I risultati finali `agent` possono includere `result.deliveryStatus` quando è stata
  richiesta la consegna, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed`
  documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` risiede in `packages/gateway-protocol/src/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta intervalli che
  non includono il suo protocollo corrente. I client e server correnti richiedono
  il protocollo v4.
- Schemi e modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili nel protocollo v4 e rappresentano la baseline prevista per client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client associato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp fast-retry dopo chiusura device-token | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Grazia force-stop prima di `terminate()`  | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client devono rispettare quei valori
invece dei valori predefiniti pre-handshake.

## Autenticazione

- L'autenticazione Gateway con segreto condiviso usa `connect.params.auth.token` o
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione dagli
  header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingresso privato salta completamente l'autenticazione
  della connessione con segreto condiviso; non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **token dispositivo** limitato al ruolo di connessione
  + agli ambiti. Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  reso persistente dal client per connessioni future.
- I client dovrebbero rendere persistente il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** dovrebbe riutilizzare anche l'insieme
  di ambiti approvato memorizzato per quel token. Questo preserva l'accesso a lettura/probe/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo admin.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel retry una tantum
    `AUTH_TOKEN_MISMATCH` è limitata **solo agli endpoint attendibili** —
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Il bootstrap con codice di configurazione integrato restituisce il
  `hello-ok.auth.deviceToken` del nodo primario più un token operatore limitato in
  `hello-ok.auth.deviceTokens` per handoff mobile attendibile. Il token operatore
  include `operator.talk.secrets` per le letture native della configurazione Talk, ma
  esclude gli ambiti di mutazione del pairing e `operator.admin`.
- Mentre un bootstrap con codice di configurazione non baseline è in attesa di approvazione, i dettagli `PAIRING_REQUIRED`
  includono `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  e `pauseReconnect: false`. I client dovrebbero continuare a riconnettersi con lo stesso
  token di bootstrap finché la richiesta non viene approvata o il token diventa non valido.
- Rendere persistente `hello-ok.auth.deviceTokens` solo quando la connessione ha usato autenticazione di bootstrap
  su un trasporto attendibile come `wss://` o pairing loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante rimane autorevole; gli ambiti in cache vengono
  riutilizzati solo quando il client riusa il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`). Ruotare o
  revocare un nodo o un altro ruolo non operatore richiede anche `operator.admin`.
- `device.token.rotate` restituisce metadati di rotazione. Riecheggia il token bearer
  sostitutivo solo per chiamate dello stesso dispositivo già autenticate con
  quel token dispositivo, così i client solo token possono rendere persistente il sostituto prima
  di riconnettersi. Le rotazioni condivise/admin non riecheggiano il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato
  registrato nella voce di pairing di quel dispositivo; la mutazione dei token non può espandere o
  indirizzare un ruolo dispositivo che l'approvazione del pairing non ha mai concesso.
- Per sessioni con token di dispositivo associato, la gestione dei dispositivi è limitata a sé stessa salvo che il
  chiamante abbia anche `operator.admin`: i chiamanti non admin possono gestire solo il
  token operatore per la voce del **proprio** dispositivo. La gestione dei token nodo e di altri
  token non operatore è solo admin, anche per il dispositivo del chiamante.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token operatore
  di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non admin
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i cicli di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.
- `AUTH_SCOPE_MISMATCH` significa che il token dispositivo è stato riconosciuto ma non copre
  il ruolo/gli ambiti richiesti. I client non dovrebbero presentarlo come token errato;
  chiedere all'operatore di ripetere il pairing o approvare il contratto di ambito più ristretto/più ampio.

## Identità dispositivo + pairing

- I nodi dovrebbero includere un'identità dispositivo stabile (`device.id`) derivata da un
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo salvo che l'approvazione automatica locale
  sia abilitata.
- L'approvazione automatica del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso stretto di self-connect backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  nodo). Le uniche eccezioni operatore senza dispositivo sono percorsi di attendibilità espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione operatore Control UI riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback sul percorso helper interno
    riservato.
- Omettere l'identità dispositivo ha conseguenze sugli ambiti. Quando una connessione operatore
  senza dispositivo è consentita tramite un percorso di attendibilità esplicito, OpenClaw cancella comunque
  gli ambiti autodichiarati a un insieme vuoto salvo che quel percorso abbia un'eccezione nominata
  di preservazione degli ambiti. I metodi vincolati dagli ambiti poi falliscono con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` è un percorso Control UI
  break-glass di preservazione degli ambiti. Non concede ambiti a client WebSocket backend personalizzati
  arbitrari o conformati come CLI.
- Il percorso helper backend `gateway-client` direct-loopback riservato preserva
  gli ambiti solo per RPC control-plane locali interne; gli ID backend personalizzati non
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
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo scostamento consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde al fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo di migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che associa `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo associato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare il fingerprint del certificato Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API Gateway completa** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `packages/gateway-protocol/src/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)

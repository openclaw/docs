---
read_when:
    - Implementare o aggiornare i client WS del Gateway
    - Debug di discrepanze del protocollo o errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-06-27T17:34:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
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
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso troppo grandi e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il Gateway chiuda o scarti il frame interessato. Questi eventi conservano
  dimensioni, limiti, superfici e codici motivo sicuri. Non conservano il corpo del messaggio,
  i contenuti degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

## Handshake (connect)

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
`"startup-sidecars"` e `retryAfterMs`. I client devono ritentare quella risposta
entro il proprio budget complessivo di connessione invece di mostrarla come errore
terminale di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`packages/gateway-protocol/src/schema/frames.ts`). Anche `auth` è richiesto e segnala
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e mappa i nomi delle
superfici dei Plugin, come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei Plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactor sperimentale del Plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i Gateway attuali devono usare
le superfici dei Plugin.

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

I client backend affidabili nello stesso processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) possono omettere `device` su connessioni dirette local loopback quando
si autenticano con il token/password condiviso del Gateway. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce alle baseline obsolete di abbinamento
CLI/dispositivo di bloccare il lavoro del backend locale, come gli aggiornamenti delle sessioni
dei subagenti. I client remoti, i client con origine browser, i client nodo e i client espliciti
con token dispositivo/identità dispositivo usano ancora i normali controlli di abbinamento e
upgrade degli ambiti.

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

Il bootstrap integrato con QR/codice di configurazione è un percorso nuovo di passaggio
mobile. Una connessione baseline riuscita con codice di configurazione restituisce un token
nodo primario più un token operatore limitato:

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

Il passaggio all'operatore è intenzionalmente limitato, così l'onboarding QR può avviare il
ciclo operatore mobile senza concedere `operator.admin` o `operator.pairing`.
Include invece `operator.talk.secrets`, così il client nativo può leggere la configurazione
Talk necessaria dopo il bootstrap. Ambiti amministrativi e di abbinamento più ampi richiedono
un flusso separato di abbinamento operatore approvato o di token. I client devono persistere
`hello-ok.auth.deviceTokens` solo
quando la connessione ha usato l'autenticazione bootstrap su un trasporto affidabile come `wss://` o
abbinamento loopback/locale.

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

## Incapsulamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione e
la semantica dei segreti condivisi, vedi [Ambiti operatore](/it/gateway/operator-scopes).

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

I metodi RPC del Gateway registrati dai Plugin possono richiedere un proprio ambito operatore, ma
i prefissi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando. Per esempio, le scritture
persistenti `/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione
oltre all'ambito di base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (nodo)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità ad alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi valori come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes`, così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **nodo**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi segnalano
  l'ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi abbinati possono anche segnalare
  una presenza in background duratura quando un evento nodo affidabile aggiorna i relativi metadati di abbinamento.

### Evento di nodo attivo in background

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo abbinato era
attivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal Gateway prima della persistenza. L'evento è duraturo solo per sessioni dispositivo
nodo autenticate; le sessioni senza dispositivo o non abbinate restituiscono `handled: false`.

I Gateway riusciti restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I Gateway meno recenti possono ancora restituire `{ "ok": true }` per `node.event`; i client devono trattarlo come
un RPC riconosciuto, non come persistenza duratura della presenza.

## Definizione degli ambiti degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti per ambito, così le sessioni con ambito di abbinamento o solo nodo non ricevono passivamente il contenuto della sessione.

- **Frame chat, agent e risultati tool** (inclusi eventi `agent` in streaming e risultati di chiamate tool) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai Plugin** sono vincolati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni, così lo stato del trasporto rimane osservabile per ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono protette per ambito per impostazione predefinita (fail-closed), a meno che un handler registrato le allenti esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco di discovery conservativo
costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi Plugin/canale
caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa di
`src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot dello stato del gateway memorizzato nella cache o appena verificato.
    - `diagnostics.stability` restituisce il registratore recente e limitato della stabilità diagnostica. Conserva metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture di memoria, stato di coda/sessione, nomi di canali/plugin e ID di sessione. Non conserva testo delle chat, corpi dei webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito admin.
    - `gateway.identity.get` restituisce l'identità del dispositivo gateway usata dai flussi di relay e associazione.
    - `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
    - `set-heartbeats` abilita o disabilita l'elaborazione degli heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati di dimensione adatta al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo e della quota residua dei provider.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
      Passa `agentId` per un agente, oppure `agentScope: "all"` per aggregare gli agenti configurati.
    - `doctor.memory.status` restituisce la prontezza della memoria vettoriale / degli embedding memorizzati nella cache per l'area di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding. I client consapevoli di Dreaming possono anche passare `{ "agentId": "agent-id" }` per limitare le statistiche dello store Dreaming a un'area di lavoro agente selezionata; omettere `agentId` mantiene il fallback dell'agente predefinito e aggrega le aree di lavoro Dreaming configurate.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` e `doctor.memory.dedupeDreamDiary` accettano parametri opzionali `{ "agentId": "agent-id" }` per viste/azioni Dreaming dell'agente selezionato. Quando `agentId` viene omesso, operano sull'area di lavoro dell'agente predefinito configurato.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per i client remoti del piano di controllo. Può includere percorsi dell'area di lavoro, frammenti di memoria, markdown grounded renderizzato e candidati di promozione profonda, quindi i chiamanti richiedono `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione. Passa `agentId` per un
      agente, oppure `agentScope: "all"` per elencare insieme gli agenti configurati.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del registro di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi dello stato dei canali/plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii indirizzati a canale/account/thread al di fuori del runner chat.
    - `logs.tail` restituisce la coda del file di log del gateway configurato con controlli per cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider Talk per voce, trascrizione in streaming e voce in tempo reale. Include ID provider, etichette, stato configurato, ID modello/voce esposti, modalità canoniche, trasporti, strategie brain e flag audio/capacità in tempo reale senza restituire segreti dei provider o modificare la configurazione globale.
    - `talk.config` restituisce il payload di configurazione Talk effettivo; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. Per `stt-tts/managed-room`, i chiamanti `operator.write` che passano `sessionKey` devono anche passare `spawnedBy` per la visibilità della chiave di sessione con ambito; la creazione di `sessionKey` senza ambito e `brain: "direct-tools"` richiedono `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token memorizzato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay in tempo reale e trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` guidano il ciclo di vita del turno managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione VAD-gated nelle sessioni di relay Gateway.
    - `talk.session.submitToolResult` completa una chiamata strumento del provider emessa da una sessione di relay in tempo reale di proprietà del Gateway. Passa `options: { willContinue: true }` per l'output intermedio dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta dell'assistente in tempo reale.
    - `talk.session.steer` invia il controllo vocale dell'esecuzione attiva in una sessione Talk supportata da agente e di proprietà del Gateway. Accetta `{ sessionId, text, mode? }`, dove `mode` è `status`, `steer`, `cancel` o `followup`; la modalità omessa viene classificata dal testo parlato.
    - `talk.session.close` chiude una sessione di relay, trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider in tempo reale di proprietà del client usando `webrtc` o `provider-websocket`, mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale di proprietà del client di inoltrare le chiamate strumento del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.client.steer` invia il controllo vocale dell'esecuzione attiva per trasporti in tempo reale di proprietà del client. Il Gateway risolve l'esecuzione incorporata attiva da `sessionKey` e restituisce un risultato strutturato accettato/rifiutato invece di ignorare silenziosamente il comando di guida.
    - `talk.event` è il singolo canale eventi Talk per adattatori in tempo reale, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` abilitano o disabilitano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo le SecretRefs attive e sostituisce lo stato dei segreti del runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti indirizzate a comandi per un set specifico di comandi/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione. La sostituzione distruttiva degli array
      richiede il percorso interessato in `replacePaths`; gli array annidati
      sotto voci di array usano percorsi `[]` come `agents.list[].skills`.
    - `config.apply` convalida + sostituisce il payload di configurazione completo.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di plugin + canale quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, inclusi oggetti annidati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath`, `reloadKind` opzionale e riepiloghi dei figli immediati per l'esplorazione UI/CLI. `reloadKind` è uno tra `restart`, `hot` o `none` e rispecchia il pianificatore di ricaricamento della configurazione del Gateway per il percorso richiesto. I nodi schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, `reloadKind` opzionale, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` in modo che l'avvio riprenda un turno agente di follow-up tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore pacchetti e gli aggiornamenti git-checkout supervisionati dal piano di controllo usano un passaggio di consegne a servizio gestito separato invece di sostituire l'albero dei pacchetti o modificare l'output di checkout/build all'interno del Gateway live. Un passaggio di consegne avviato restituisce `ok: true` con `result.reason: "managed-service-handoff-started"` e `handoff.status: "started"`; i passaggi di consegne non disponibili o non riusciti restituiscono `ok: false` con `managed-service-handoff-unavailable` o `managed-service-handoff-failed`, più `handoff.command` quando è richiesto un aggiornamento manuale da shell. Un passaggio di consegne non disponibile significa che OpenClaw non dispone di un confine supervisore sicuro o di un'identità di servizio durevole, come `OPENCLAW_SYSTEMD_UNIT` per systemd. Durante un passaggio di consegne avviato, il sentinel di riavvio può riportare brevemente `stats.reason: "restart-health-pending"`; la continuazione viene ritardata finché la CLI verifica il Gateway riavviato e scrive il sentinel finale `ok`.
    - `update.status` aggiorna e restituisce l'ultimo sentinel di riavvio dell'aggiornamento, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agenti e workspace">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi il modello effettivo e i metadati del runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file del workspace di bootstrap esposti per un agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro delle attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi degli artefatti derivati dalle trascrizioni e download per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query su esecuzione e attività risolvono la sessione proprietaria lato server e restituiscono solo i media della trascrizione con provenienza corrispondente; le sorgenti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono ai client SDK il rilevamento in sola lettura degli ambienti locali del Gateway e dei nodi.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice delle sessioni corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime delimitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione del Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più un `runId` opzionale, oppure passare solo `runId` per le esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna i metadati/override della sessione e riporta il modello canonico risolto più l'`agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga di sessione completa archiviata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/a larghezza piena trapelati vengono rimossi, le righe assistente composte solo da token silenziosi come esattamente `NO_REPLY` / `no_reply` vengono omesse, e le righe sovradimensionate possono essere sostituite con segnaposto.
    - `chat.message.get` è il lettore additivo delimitato del messaggio completo per una singola voce visibile della trascrizione. I client passano `sessionKey`, `agentId` opzionale quando la selezione della sessione è limitata all'agente, più un `messageId` della trascrizione precedentemente esposto tramite `chat.history`, e il Gateway restituisce la stessa proiezione normalizzata per la visualizzazione senza il limite di troncamento della cronologia leggera quando la voce archiviata è ancora disponibile e non sovradimensionata.
    - `chat.send` accetta `fastMode: "auto"` su un singolo turno per usare la modalità veloce per le chiamate al modello avviate prima del limite automatico, quindi avviare successive chiamate di riprova, fallback, risultato strumento o continuazione senza modalità veloce. Il limite predefinito è 60 secondi e può essere configurato per modello con `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Un chiamante `chat.send` può passare `fastAutoOnSeconds` su un singolo turno per sovrascrivere il limite per quella richiesta.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dispositivo.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione nodi, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei nodi e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta invoke.
    - `node.event` riporta nel Gateway gli eventi originati dal nodo.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec monouso più la ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` al timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot delle policy di approvazione exec del Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al nodo tramite comandi relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat di testo di risveglio; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - `cron.run` rimane una RPC in stile accodamento per le esecuzioni manuali. I client che necessitano di semantica di completamento devono leggere il `runId` restituito ed eseguire il polling di `cron.runs`.
    - `cron.runs` accetta un filtro `runId` opzionale non vuoto, così i client possono seguire una singola esecuzione manuale accodata senza conflitti con altre voci della cronologia per lo stesso job.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi chat
  solo di trascrizione. Nel protocollo v4, i payload delta trasportano `deltaText`;
  `message` rimane lo snapshot cumulativo dell'assistente. Le sostituzioni non
  prefisso impostano `replace=true` e usano `deltaText` come testo sostitutivo.
- `session.message`, `session.operation` e `session.tool`: aggiornamenti di
  trascrizione, operazione di sessione in corso e stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice delle sessioni o metadati modificati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / vitalità.
- `health`: aggiornamento dello snapshot di integrità del Gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'associazione nodi.
- `node.invoke.request`: broadcast della richiesta invoke del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita dei dispositivi associati.
- `voicewake.changed`: configurazione del trigger della parola di attivazione modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione Plugin.

### Metodi helper per nodi

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili Skills
  per i controlli di autorizzazione automatica.

### RPC del registro attività

I client operatore possono ispezionare e annullare i record delle attività in background del Gateway tramite
le RPC del registro attività. Questi metodi restituiscono riepiloghi sanificati delle attività, non lo
stato runtime grezzo.

- `tasks.list` richiede `operator.read`.
  - Parametri: `status` opzionale (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` o `"timed_out"`) o un array di tali stati,
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
riepilogo terminale e testo di errore sanificato. `agentId` identifica l'agente
che esegue l'attività; `sessionKey` e `ownerKey` preservano il contesto del richiedente e di controllo.

### Metodi helper per operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie viene indirizzata dal `name` primario:
    - `text` restituisce il token del comando di testo primario senza il `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo runtime degli strumenti per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: se uno strumento Plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare un contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è una proiezione con ambito di sessione derivata dal server dell'inventario attivo, inclusi strumenti core, Plugin, canale e strumenti server MCP già scoperti.
  - `tools.effective` è di sola lettura per MCP: può proiettare un catalogo MCP di sessione già caldo attraverso la policy finale degli strumenti, ma non crea runtime MCP, non connette trasporti né emette `tools/list`. Se non esiste alcun catalogo caldo corrispondente, la risposta può includere un avviso come `mcp-not-yet-connected`, `mcp-not-yet-listed` o `mcp-stale-catalog`.
  - Le voci degli strumenti effettivi usano `source="core"`, `source="plugin"`, `source="channel"` o `source="mcp"`.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile attraverso lo stesso percorso di policy del Gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - I wrapper core riservati al proprietario, come `cron`, `gateway` e `nodes`, richiedono un'identità proprietario/amministratore (`operator.admin`) anche se il metodo `tools.invoke` stesso è `operator.write`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. Le approvazioni o i rifiuti di policy restituiscono `ok:false` nel payload invece di aggirare la pipeline di policy degli strumenti del Gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario delle skill visibile per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta di ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit` (`operator.admin`) per preparare un archivio di skill privato prima di installarlo. Questo è un percorso di caricamento amministrativo separato per client attendibili, non il normale flusso di installazione delle skill di ClawHub, ed è disabilitato per impostazione predefinita a meno che `skills.install.allowUploadedArchives` non sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea un caricamento associato a quello slug e a quel valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte all'offset decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e SHA-256. Il commit finalizza solo il caricamento; non installa la skill.
  - Gli archivi di skill caricati sono archivi zip contenenti una root `SKILL.md`. Il nome della directory interna dell'archivio non seleziona mai la destinazione di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella di skill nella directory `skills/` del workspace dell'agente predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installa un upload sottoposto a commit nella directory `skills/<slug>` del workspace dell'agente predefinito. Lo slug e il valore force devono corrispondere alla richiesta `skills.upload.begin` originale. Questa modalità viene rifiutata a meno che `skills.install.allowUploadedArchives` non sia abilitato. L'impostazione non influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host del Gateway. I client più vecchi possono ancora inviare `dangerouslyForceUnsafeInstall`; questo campo è deprecato, accettato solo per compatibilità del protocollo e ignorato. Usa `security.installPolicy` per le decisioni di installazione di proprietà dell'operatore.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel workspace dell'agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento con dimensione da selettore. Se `agents.defaults.models` è configurato, continua a prevalere, inclusa la scoperta con ambito provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, ricadendo sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo Gateway completo, ignorando `agents.defaults.models`. Usalo per diagnostica e UI di scoperta, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il Gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il Gateway rifiuta l'esecuzione invece di considerare attendibile il payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: le destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo sessione quando non è possibile risolvere alcuna route consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando è stata richiesta la consegna, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed` documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` si trova in `packages/gateway-protocol/src/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta intervalli che non includono il suo protocollo corrente. I client e server correnti richiedono il protocollo v4.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v4 e sono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget accoppiato server/client) |
| Backoff di riconnessione iniziale         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Grazia force-stop prima di `terminate()`  | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server annuncia `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` effettivi in `hello-ok`; i client dovrebbero rispettare quei valori invece dei valori predefiniti pre-handshake.

## Auth

- L'autenticazione del Gateway con segreto condiviso usa `connect.params.auth.token` o
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione tramite
  gli header della richiesta invece di `connect.params.auth.*`.
- L'ingresso privato `gateway.auth.mode: "none"` salta completamente l'autenticazione
  della connessione con segreto condiviso; non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo l'associazione, il Gateway emette un **token del dispositivo** con ambito limitato al ruolo
  della connessione + ambiti. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  persistito dal client per le connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel token del dispositivo **memorizzato** deve anche riutilizzare l'insieme di
  ambiti approvati memorizzato per quel token. Questo preserva l'accesso di lettura/probe/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo amministratore.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuna delle opzioni precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo risolto lo sopprime.
  - La promozione automatica di un token del dispositivo memorizzato nel retry singolo
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Il bootstrap con codice di configurazione integrato restituisce il
  `hello-ok.auth.deviceToken` del Node primario più un token operatore limitato in
  `hello-ok.auth.deviceTokens` per il trasferimento mobile attendibile. Il token operatore
  include `operator.talk.secrets` per le letture della configurazione Talk nativa ed
  esclude `operator.admin` e `operator.pairing`.
- Mentre un bootstrap con codice di configurazione non baseline è in attesa di approvazione, i dettagli `PAIRING_REQUIRED`
  includono `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  e `pauseReconnect: false`. I client devono continuare a riconnettersi con lo stesso
  token di bootstrap finché la richiesta non viene approvata o il token diventa non valido.
- Persisti `hello-ok.auth.deviceTokens` solo quando la connessione ha usato l'autenticazione bootstrap
  su un trasporto attendibile come `wss://` o associazione loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme di
  ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono
  riutilizzati solo quando il client riutilizza il token per dispositivo memorizzato.
- I token del dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`). Ruotare o
  revocare un Node o un altro ruolo non operatore richiede anche `operator.admin`.
- `device.token.rotate` restituisce metadati di rotazione. Ripete il token bearer sostitutivo
  solo per chiamate dallo stesso dispositivo già autenticate con
  quel token del dispositivo, così i client solo token possono persistere la sostituzione prima
  di riconnettersi. Le rotazioni condivise/amministrative non ripetono il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato
  registrato nella voce di associazione di quel dispositivo; la modifica dei token non può espandere né
  indirizzare un ruolo del dispositivo mai concesso dall'approvazione dell'associazione.
- Per le sessioni con token di dispositivi associati, la gestione dei dispositivi è auto-limitata salvo che il
  chiamante abbia anche `operator.admin`: i chiamanti non amministratori possono gestire solo il
  token operatore per la voce del **proprio** dispositivo. La gestione dei token di Node e di altri
  non operatori è riservata agli amministratori, anche per il dispositivo del chiamante.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token operatore
  di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non amministratori
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i cicli di riconnessione automatica e mostrare indicazioni di azione per l'operatore.
- `AUTH_SCOPE_MISMATCH` significa che il token del dispositivo è stato riconosciuto ma non copre
  il ruolo/gli ambiti richiesti. I client non devono presentarlo come un token errato;
  chiedi all'operatore di riassociare o approvare il contratto di ambito più ristretto/più ampio.

## Identità del dispositivo + associazione

- I Node devono includere un'identità stabile del dispositivo (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di associazione sono richieste per i nuovi ID dispositivo, salvo che
  l'approvazione automatica locale sia abilitata.
- L'approvazione automatica dell'associazione è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche uno stretto percorso di auto-connessione backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN dallo stesso host sono comunque trattate come remote per l'associazione e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione Control UI operatore riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
  - RPC backend `gateway-client` direct-loopback sul percorso helper interno
    riservato.
- Omettere l'identità del dispositivo ha conseguenze sugli ambiti. Quando una connessione operatore
  senza dispositivo è consentita tramite un percorso di fiducia esplicito, OpenClaw azzera comunque
  gli ambiti auto-dichiarati a un insieme vuoto, salvo che quel percorso abbia un'eccezione nominata
  di preservazione degli ambiti. I metodi vincolati dagli ambiti falliscono quindi con
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` è un percorso Control UI
  break-glass di preservazione degli ambiti. Non concede ambiti a client WebSocket backend
  personalizzati arbitrari o modellati sulla CLI.
- Il percorso helper backend `gateway-client` direct-loopback riservato preserva
  gli ambiti solo per RPC control-plane locali interne; gli ID backend personalizzati non
  ricevono questa eccezione.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell'autenticazione del dispositivo

Per i client legacy che usano ancora il comportamento di firma precedente alla challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Target di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  dei dispositivi associati controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono opzionalmente fissare la fingerprint del certificato del Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API completa del Gateway** (stato, canali, modelli, chat,
agente, sessioni, Node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `packages/gateway-protocol/src/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

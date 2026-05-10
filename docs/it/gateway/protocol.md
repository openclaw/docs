---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema e dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-05-10T19:36:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android, nodi
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono seguire i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi
  `payload.large` prima che il gateway chiuda o scarti il frame interessato. Questi eventi conservano
  dimensioni, limiti, superfici e codici motivo sicuri. Non conservano il corpo del messaggio,
  i contenuti degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

## Handshake (connect)

Gateway → Client (challenge pre-connessione):

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
`"startup-sidecars"` e `retryAfterMs`. I client devono riprovare quella risposta
entro il budget complessivo di connessione invece di mostrarla come errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e mappa i nomi delle superfici dei Plugin,
come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei Plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactor sperimentale del Plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway attuali devono usare le superfici dei Plugin.

Quando non viene emesso alcun token dispositivo, `hello-ok.auth` riporta i permessi
negoziati senza campi token:

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
si autenticano con il token/password gateway condiviso. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce che baseline obsolete di associazione CLI/dispositivo
blocchino il lavoro backend locale, come gli aggiornamenti delle sessioni dei subagenti. Client remoti,
client con origine browser, client nodo e client espliciti con token dispositivo/identità dispositivo
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

Durante l'handoff di bootstrap attendibile, `hello-ok.auth` può includere anche voci di ruolo
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

Per il flusso di bootstrap nodo/operatore integrato, il token nodo primario resta
`scopes: []` e qualsiasi token operatore trasferito rimane limitato all'allowlist
dell'operatore di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap restano
prefissati dal ruolo: le voci operatore soddisfano solo le richieste operatore, e i ruoli
non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.

### Esempio di nodo

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

## Incapsulamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione
e la semantica dei segreti condivisi, consulta [Ambiti operatore](/it/gateway/operator-scopes).

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

I metodi RPC del gateway registrati dai Plugin possono richiedere il proprio ambito operatore, ma
i prefissi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

L'ambito del metodo è solo il primo gate. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli a livello di comando più rigorosi in aggiunta. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/permessi (nodo)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (per esempio `screen.record`, `camera.capture`).

Il Gateway tratta queste come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes`, così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **nodo**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  il proprio orario di connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi associati possono anche riportare
  presenza in background durabile quando un evento nodo attendibile aggiorna i loro metadati di associazione.

### Evento di nodo attivo in background

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
`background` dal gateway prima della persistenza. L'evento è durabile solo per sessioni dispositivo nodo
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

I gateway più vecchi possono ancora restituire `{ "ok": true }` per `node.event`; i client devono trattarlo come un
RPC confermato, non come persistenza durabile della presenza.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti per ambito, così le sessioni con ambito di associazione o solo nodo non ricevono passivamente contenuti di sessione.

- **Frame chat, agente e risultati degli strumenti** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) rimangono senza restrizioni, così l'integrità del trasporto resta osservabile per ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono protette per ambito per impostazione predefinita (fail-closed), a meno che un handler registrato non le allenti esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/autenticazione sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco conservativo
di discovery costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi di
Plugin/canali caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di integrità del gateway memorizzato nella cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e limitato. Conserva metadati operativi come nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di coda/sessione, nomi di canali/Plugin e ID sessione. Non conserva testo chat, corpi webhook, output degli strumenti, corpi grezzi di richiesta o risposta, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito admin.
    - `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi relay e di associazione.
    - `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione degli Heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per modelli configurati delle dimensioni di un selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo/dei limiti di quota rimanenti del provider.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di prontezza della memoria vettoriale / degli embedding memorizzati nella cache per l'area di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per client del piano di controllo remoto. Può includere percorsi dell'area di lavoro, frammenti di memoria, markdown contestualizzato renderizzato e candidati alla promozione approfondita, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce voci di log dell'utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi dello stato dei canali/Plugin integrati + inclusi.
    - `channels.logout` disconnette un canale/account specifico dove il canale supporta la disconnessione.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web attuale compatibile con QR.
    - `web.login.wait` attende il completamento di tale flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una notifica push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC di consegna in uscita diretta per invii mirati a canale/account/thread al di fuori del runner chat.
    - `logs.tail` restituisce la coda del log su file del Gateway configurata con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce in tempo reale. Include ID provider, etichette, stato configurato, ID modello/voce esposti, modalità canoniche, trasporti, strategie brain e flag audio/capacità realtime senza restituire segreti del provider né modificare la configurazione globale.
    - `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk posseduta dal Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. `brain: "direct-tools"` richiede `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token memorizzato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 a sessioni di relay realtime e trascrizione possedute dal Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` guidano il ciclo di vita dei turni managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per barge-in regolato da VAD nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione relay realtime posseduta dal Gateway. Passa `options: { willContinue: true }` per output provvisorio dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta realtime dell'assistente.
    - `talk.session.close` chiude una sessione relay, trascrizione o managed-room posseduta dal Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato attuale della modalità Talk per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider realtime posseduta dal client usando `webrtc` o `provider-websocket` mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti realtime posseduti dal client di inoltrare le chiamate a strumento del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.event` è il singolo canale di eventi Talk per realtime, trascrizione, STT/TTS, managed-room, telefonia e adattatori di riunione.
    - `talk.speak` sintetizza il parlato tramite il provider di sintesi vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato di configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione testo-voce una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei segreti del runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti mirate a comandi per un set specifico di comandi/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione attuale.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida + sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi metadati di schema di Plugin + canale quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, incluse diramazioni di composizione di oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup circoscritto al percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath` e riepiloghi immediati dei figli per il drill-down UI/CLI. I nodi schema di lookup conservano la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno agente successivo tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore pacchetti forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, così il vecchio processo Gateway non continua a caricare pigramente da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinel di riavvio dell'aggiornamento memorizzato nella cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.

  </Accordion>

  <Accordion title="Helper agente e area di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi il modello effettivo e i metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio dell'area di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file dell'area di lavoro bootstrap esposti per un agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro delle attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo media della trascrizione con provenienza corrispondente; fonti URL non sicure o locali restituiscono download non supportati invece di eseguire fetch lato server.
    - `environments.list` e `environments.status` espongono il rilevamento di sola lettura degli ambienti locali al Gateway e dei nodi per i client SDK.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende la conclusione di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice delle sessioni attuale, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS attuale.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate delle trascrizioni per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più un `runId` facoltativo, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono manutenzione della sessione.
    - `sessions.get` restituisce la riga di sessione memorizzata completa.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML in testo semplice delle chiamate a strumento (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumento troncati) e i token di controllo del modello ASCII/full-width trapelati vengono rimossi, le righe assistente con soli token silenziosi come esatti `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione nodi, invocazione e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono associazione dei nodi e verifica bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta di invocazione.
    - `node.event` riporta nel gateway gli eventi originati dal nodo.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` ed `exec.approval.resolve` coprono richieste di approvazione exec una tantum più ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` ed `exec.approvals.set` gestiscono gli snapshot delle policy di approvazione exec del gateway.
    - `exec.approvals.node.get` ed `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del nodo tramite comandi di relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dal Plugin.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Automazione: `wake` pianifica un'iniezione di testo di risveglio immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti chat dell'interfaccia utente come `chat.inject` e altri eventi chat
  solo transcript.
- `session.message` e `session.tool`: aggiornamenti transcript/flusso di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice o metadati della sessione modificati.
- `presence`: aggiornamenti dello snapshot della presenza di sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di integrità del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento del nodo.
- `node.invoke.request`: broadcast della richiesta di invocazione del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger della parola di risveglio modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione del plugin.

### Metodi helper del nodo

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili skill
  per i controlli di auto-consenso.

### RPC del registro delle attività

I client operatore possono ispezionare e annullare i record delle attività in background del Gateway tramite
gli RPC del registro attività. Questi metodi restituiscono riepiloghi attività sanificati, non lo
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
  - `found` segnala se il registro conteneva un'attività corrispondente. `cancelled`
    segnala se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati opzionali come `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento,
riepilogo terminale e testo di errore sanificato.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi
  runtime per un agent.
  - `agentId` è opzionale; ometterlo per leggere l'area di lavoro dell'agent predefinito.
  - `scope` controlla quale superficie è destinata dal `name` primario:
    - `text` restituisce il token del comando testuale primario senza il `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` trasporta alias slash esatti come `/model` e `/m`.
  - `nativeName` trasporta il nome del comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è opzionale e influisce solo sulla denominazione nativa più la disponibilità
    dei comandi plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo strumenti runtime per un
  agent. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento plugin è opzionale
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario strumenti
  effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva dal server della sessione il contesto runtime attendibile invece di accettare
    il contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare adesso,
    inclusi strumenti core, plugin e canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo
  stesso percorso di policy del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` sono opzionali.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agent della sessione risolta deve corrispondere a
    `agentId`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` opzionale e campi
    `error` tipizzati. I rifiuti di approvazione o policy restituiscono `ok:false` nel payload anziché
    aggirare la pipeline di policy degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario
  skill visibile per un agent.
  - `agentId` è opzionale; ometterlo per leggere l'area di lavoro dell'agent predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di scoperta di ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e
  `skills.upload.commit` (`operator.admin`) per preparare un archivio skill privato
  prima di installarlo. Questo è un percorso di upload admin separato per client attendibili,
  non il normale flusso di installazione skill di ClawHub, ed è disabilitato per impostazione predefinita a meno che
  `skills.install.allowUploadedArchives` non sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea un upload associato a tale slug e valore force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte all'offset
    decodificato esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e
    SHA-256. Il commit finalizza solo l'upload; non installa la skill.
  - Gli archivi skill caricati sono archivi zip contenenti una radice `SKILL.md`. Il
    nome della directory interna dell'archivio non seleziona mai il target di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` dell'area di lavoro dell'agent predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installa un upload impegnato nella directory `skills/<slug>`
    dell'area di lavoro dell'agent predefinito. Lo slug e il valore force devono corrispondere alla richiesta
    originale `skills.upload.begin`. Questa modalità viene rifiutata a meno che
    `skills.install.allowUploadedArchives` non sia abilitato. L'impostazione non
    influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate
    nell'area di lavoro dell'agent predefinito.
  - La modalità Config applica patch ai valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` opzionale:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per il selettore. Se `agents.defaults.models` è configurato, prevale comunque, inclusa la scoperta limitata al provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, con fallback al catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usarlo per interfacce di diagnostica e scoperta, non per i normali selettori di modello.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede lo scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel
  `systemRunPlan` canonico come contesto comando/cwd/sessione autorevole.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback della consegna agent

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: i target di consegna non risolti o solo interni restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo sessione quando non è possibile risolvere alcuna route consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando la consegna è stata
  richiesta, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed`
  documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` vive in `src/gateway/protocol/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili nel protocollo v4 e costituiscono la baseline attesa per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Timeout della richiesta (per RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client abbinato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite del retry rapido dopo chiusura device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Periodo di tolleranza force-stop prima di `terminate()` | `250` ms                                   | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout del tick             | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server annuncia i valori effettivi di `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare tali valori
anziché i predefiniti precedenti all'handshake.

## Autenticazione

- L'autenticazione Gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che trasportano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione dai
  header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato salta completamente l'autenticazione
  della connessione con segreto condiviso; non esporre questa modalità su ingress pubblici/non attendibili.
- Dopo l'associazione, il Gateway emette un **token dispositivo** limitato al ruolo +
  agli ambiti della connessione. Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  mantenuto dal client per connessioni future.
- I client dovrebbero mantenere il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** dovrebbe anche riutilizzare
  l'insieme di ambiti approvati memorizzato per quel token. Questo conserva l'accesso
  a lettura/probe/stato già concesso ed evita di restringere silenziosamente le riconnessioni a un
  ambito implicito più limitato solo admin.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei casi precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel retry singolo
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non si qualifica.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di passaggio bootstrap.
  Mantienili solo quando la connessione ha usato autenticazione bootstrap su un trasporto attendibile
  come `wss://` o pairing locale/loopback.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante resta autoritativo; gli ambiti in cache vengono
  riutilizzati solo quando il client sta riutilizzando il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Riporta il token bearer
  sostitutivo solo per chiamate dallo stesso dispositivo già autenticate con
  quel token dispositivo, così i client solo-token possono mantenere il sostituto prima di
  riconnettersi. Le rotazioni shared/admin non riportano il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato
  registrato nella voce di pairing di quel dispositivo; la mutazione del token non può espandere né
  puntare a un ruolo dispositivo che l'approvazione del pairing non ha mai concesso.
- Per le sessioni con token di dispositivo associato, la gestione dei dispositivi è auto-limitata salvo che
  il chiamante abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token
  operatore di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non admin
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i cicli di riconnessione automatica e mostrare indicazioni operative.

## Identità dispositivo + pairing

- I nodi dovrebbero includere un'identità dispositivo stabile (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo salvo che l'auto-approvazione locale
  sia abilitata.
- L'auto-approvazione del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di autoconessione backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP insicura solo localhost.
  - autenticazione riuscita della Control UI operatore con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend dirette-loopback `gateway-client` autenticate con il token/password
    Gateway condiviso.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma precedente alla challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo scarto consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo associato continua a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API Gateway completa** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)

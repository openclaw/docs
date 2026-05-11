---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo del Gateway
x-i18n:
    generated_at: "2026-05-11T20:29:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS Gateway è il **singolo piano di controllo + trasporto del nodo** per
OpenClaw. Tutti i client (CLI, UI web, app macOS, nodi iOS/Android, nodi
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito**
al momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono rispettare i limiti `hello-ok.policy.maxPayload` e
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
restituire un errore `UNAVAILABLE` ritentabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client devono ritentare quella risposta
entro il proprio budget complessivo di connessione invece di mostrarla come un errore
terminale di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e associa i nomi delle superfici
dei plugin, come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei plugin con ambito possono scadere. I nodi possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactor sperimentale del plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway correnti devono usare le superfici dei plugin.

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
si autenticano con il token/la password condivisi del gateway. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce che baseline obsolete di pairing CLI/dispositivo
blocchino il lavoro backend locale, come gli aggiornamenti delle sessioni dei sottoagenti. I client remoti,
i client con origine browser, i client nodo e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di pairing e upgrade degli ambiti.

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

Durante l'handoff bootstrap attendibile, `hello-ok.auth` può includere anche ulteriori
voci di ruolo limitate in `deviceTokens`:

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

Per il flusso bootstrap integrato nodo/operatore, il token nodo primario rimane
`scopes: []` e qualsiasi token operatore trasferito resta limitato all'allowlist
dell'operatore bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti bootstrap restano
prefissati per ruolo: le voci operatore soddisfano solo le richieste operatore, e i ruoli
non operatore necessitano comunque di ambiti sotto il proprio prefisso di ruolo.

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

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedere lo schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione e la semantica
dei segreti condivisi, vedere [Ambiti operatore](/it/gateway/operator-scopes).

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

I metodi RPC gateway registrati dai plugin possono richiedere il proprio ambito operatore, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo gate. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli aggiuntivi più restrittivi a livello di comando. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo degli ambiti al momento dell'approvazione oltre
all'ambito di base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (nodo)

I nodi dichiarano le attestazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **attestazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **nodo**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l'ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi associati possono anche riportare
  una presenza in background persistente quando un evento nodo attendibile aggiorna i metadati di pairing.

### Evento alive in background del nodo

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo associato era
alive durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L'evento è persistente solo per sessioni dispositivo nodo
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

I gateway meno recenti possono ancora restituire `{ "ok": true }` per `node.event`; i client devono trattarlo come un
RPC confermato, non come persistenza della presenza durevole.

## Scoping degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono vincolati agli ambiti, così le sessioni con ambito di pairing o solo nodo non ricevono passivamente contenuti di sessione.

- I **frame chat, agente e risultato strumento** (inclusi gli eventi `agent` in streaming e i risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dai plugin** sono vincolati a `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così la salute del trasporto rimane osservabile da ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono vincolate agli ambiti per impostazione predefinita (fail-closed) a meno che un handler registrato non le renda esplicitamente meno restrittive.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth qui sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco di discovery
conservativo creato da `src/gateway/server-methods-list.ts` più gli export dei metodi
plugin/canale caricati. Trattarlo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot della salute del gateway memorizzato nella cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e limitato. Conserva metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di code/sessioni, nomi di canali/plugin e ID di sessione. Non conserva testo chat, corpi webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operatore con ambito admin.
    - `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi relay e pairing.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione degli heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati in formato adatto al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo dei provider e della quota residua.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
    - `doctor.memory.status` restituisce la disponibilità della memoria vettoriale / embedding in cache per l'area di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e in sola lettura dell'harness REM per client remoti del piano di controllo. Può includere percorsi dell'area di lavoro, frammenti di memoria, markdown fondato renderizzato e candidati alla promozione profonda, quindi i chiamanti hanno bisogno di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporali per una sessione.
    - `sessions.usage.logs` restituisce le voci del registro di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati + in bundle.
    - `channels.logout` disconnette uno specifico canale/account quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di prova a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word archiviati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii indirizzati a canale/account/thread al di fuori del runner di chat.
    - `logs.tail` restituisce la coda del log su file configurata del Gateway con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo in sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce realtime. Include ID provider, etichette, stato configurato, ID modello/voce esposti, modalità canoniche, trasporti, strategie cerebrali e flag audio/capacità realtime senza restituire segreti dei provider né modificare la configurazione globale.
    - `talk.config` restituisce il payload di configurazione Talk effettivo; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. `brain: "direct-tools"` richiede `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità, e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token archiviato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay realtime e trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` gestiscono il ciclo di vita del turno managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per il barge-in regolato da VAD nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione relay realtime di proprietà del Gateway. Passa `options: { willContinue: true }` per l'output intermedio dello strumento quando seguirà un risultato finale, oppure `options: { suppressResponse: true }` quando il risultato dello strumento deve soddisfare la chiamata del provider senza avviare un'altra risposta realtime dell'assistente.
    - `talk.session.close` chiude una sessione relay, trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato della modalità Talk corrente per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider realtime di proprietà del client usando `webrtc` o `provider-websocket` mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti realtime di proprietà del client di inoltrare le chiamate a strumento del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.event` è il singolo canale eventi Talk per adattatori realtime, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza la voce tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` commutano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRefs attivi e sostituisce lo stato dei segreti runtime solo in caso di pieno successo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate ai comandi per uno specifico insieme comando/destinazione.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida + sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di Plugin + canale quando il runtime può caricarli. Lo schema include i metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, inclusi rami di composizione di oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup circoscritto al percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath` e riepiloghi dei figli immediati per l'esplorazione UI/CLI. I nodi schema del lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` affinché l'avvio riprenda un turno agente di follow-up tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore pacchetti forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, così il vecchio processo Gateway non continua a caricare pigramente da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinella di riavvio aggiornamento in cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper agente e area di lavoro">
    - `agents.list` restituisce le voci agente configurate, inclusi modello effettivo e metadati runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record agente e il cablaggio dell'area di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file dell'area di lavoro bootstrap esposti per un agente.
    - `tasks.list`, `tasks.get` e `tasks.cancel` espongono il registro attività del Gateway ai client SDK e operatore.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query su esecuzioni e attività risolvono lato server la sessione proprietaria e restituiscono solo media di trascrizione con provenienza corrispondente; sorgenti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono il rilevamento in sola lettura di ambienti locali al Gateway e di nodo per i client SDK.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice delle sessioni corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime agente.
    - `sessions.subscribe` e `sessions.unsubscribe` commutano le iscrizioni agli eventi di modifica sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` commutano le iscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate delle trascrizioni per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` opzionale, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere a una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga completa della sessione archiviata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata a strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata a strumento troncati) e i token di controllo modello ASCII/a larghezza piena trapelati vengono rimossi, le righe assistente composte solo da token silenziosi come `NO_REPLY` / `no_reply` esatti vengono omesse, e le righe sovradimensionate possono essere sostituite con segnaposto.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dispositivo.
    - `device.token.rotate` ruota il token di un dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca il token di un dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione nodi, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei nodi e la verifica bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta invoke.
    - `node.event` trasporta gli eventi originati dal nodo di nuovo nel gateway.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più la ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot dei criteri di approvazione exec del Gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono i criteri di approvazione exec locali al nodo tramite comandi di relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat di testo di attivazione; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat della UI, come `chat.inject` e altri eventi di chat
  solo di trascrizione.
- `session.message` e `session.tool`: aggiornamenti di trascrizione/flusso di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice della sessione o metadati modificati.
- `presence`: aggiornamenti degli snapshot della presenza di sistema.
- `tick`: evento periodico keepalive / liveness.
- `health`: aggiornamento dello snapshot di stato del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento del nodo.
- `node.invoke.request`: broadcast della richiesta di invocazione del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger della parola di attivazione modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione
  exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione
  del Plugin.

### Metodi helper del nodo

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle skill
  per i controlli di auto-consenso.

### RPC del registro delle attività

I client operatore possono ispezionare e annullare i record delle attività in background del Gateway tramite
le RPC del registro delle attività. Questi metodi restituiscono riepiloghi sanitizzati delle attività, non lo
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
  - Gli ID attività mancanti restituiscono la forma di errore not-found del Gateway.
- `tasks.cancel` richiede `operator.write`.
  - Parametri: `{ "taskId": string, "reason"?: string }`.
  - Risultato:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` indica se il registro conteneva un'attività corrispondente. `cancelled`
    indica se il runtime ha accettato o registrato l'annullamento.

`TaskSummary` include `id`, `status` e metadati opzionali come `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, avanzamento,
riepilogo terminale e testo di errore sanitizzato.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi runtime
  per un agente.
  - `agentId` è opzionale; omettilo per leggere l'area di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie viene indirizzata dal `name` primario:
    - `text` restituisce il token del comando di testo primario senza il `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è opzionale e influisce solo sulla denominazione nativa più sulla disponibilità dei comandi Plugin
    nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: se uno strumento Plugin è opzionale
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti
  effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare
    contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta ha ambito di sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, Plugin e di canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo
  stesso percorso dei criteri del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e
    `idempotencyKey` sono opzionali.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a
    `agentId`.
  - La risposta è un envelope orientato all'SDK con `ok`, `toolName`, `output` opzionale e campi
    `error` tipizzati. Rifiuti di approvazione o di policy restituiscono `ok:false` nel payload invece di
    aggirare la pipeline dei criteri degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile
  delle skill per un agente.
  - `agentId` è opzionale; omettilo per leggere l'area di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanitizzate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta
  di ClawHub.
- Gli operatori possono chiamare `skills.upload.begin`, `skills.upload.chunk` e
  `skills.upload.commit` (`operator.admin`) per preparare un archivio skill privato
  prima di installarlo. Questo è un percorso di upload amministrativo separato per client attendibili,
  non il normale flusso di installazione delle skill ClawHub, ed è disabilitato per impostazione predefinita salvo che
  `skills.install.allowUploadedArchives` sia abilitato.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    crea un upload associato a quel valore slug e force.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` aggiunge byte all'offset decodificato
    esatto.
  - `skills.upload.commit({ uploadId, sha256? })` verifica la dimensione finale e
    SHA-256. Il commit finalizza solo l'upload; non installa la skill.
  - Gli archivi skill caricati sono archivi zip contenenti una root `SKILL.md`. Il
    nome della directory interna dell'archivio non seleziona mai la destinazione di installazione.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in tre modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` dell'area di lavoro dell'agente predefinito.
  - Modalità upload: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installa un upload sottoposto a commit nella directory `skills/<slug>`
    dell'area di lavoro dell'agente predefinito. Lo slug e il valore force devono corrispondere alla richiesta
    `skills.upload.begin` originale. Questa modalità viene rifiutata salvo che
    `skills.install.allowUploadedArchives` sia abilitato. L'impostazione non
    influisce sulle installazioni ClawHub.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate
    nell'area di lavoro dell'agente predefinito.
  - La modalità configurazione applica patch ai valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` opzionale:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito, inclusi i modelli scoperti dinamicamente per le voci `provider/*`. Altrimenti la risposta è il catalogo completo del Gateway.
- `"configured"`: comportamento dimensionato per picker. Se `agents.defaults.models` è configurato, prevale comunque, inclusa la scoperta con ambito provider per le voci `provider/*`. Senza una allowlist, la risposta usa le voci esplicite `models.providers.*.models`, ripiegando sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo completo del Gateway, bypassando `agents.defaults.models`. Usalo per diagnostica e UI di scoperta, non per i normali picker di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riutilizzano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback della consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: destinazioni di consegna irrisolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo su sessione quando non può essere risolta alcuna rotta consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multi-canale ambigue).
- I risultati finali di `agent` possono includere `result.deliveryStatus` quando la consegna è stata
  richiesta, usando gli stessi stati `sent`, `suppressed`, `partial_failed` e `failed`
  documentati per [`openclaw agent --json --deliver`](/it/cli/agent#json-delivery-status).

## Versionamento

- `PROTOCOL_VERSION` risiede in `src/gateway/protocol/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta gli intervalli che
  non includono il suo protocollo corrente. I client nativi usano un limite inferiore v3 così
  i client v4 additivi possono ancora raggiungere i gateway v3.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili nel protocollo v4 e costituiscono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Timeout della richiesta (per RPC)         | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout di preauth / connect-challenge    | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget accoppiato server/client) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite di retry rapido dopo chiusura per device-token | `250` ms                                     | `src/gateway/client.ts`                                                                    |
| Tolleranza force-stop prima di `terminate()` | `250` ms                                           | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout del tick             | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi di `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare quei valori
invece dei valori predefiniti prima dell’handshake.

## Auth

- L’autenticazione Gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non-local loopback, soddisfano il controllo di autenticazione della connessione dai
  header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per private-ingress salta completamente l’autenticazione di connessione con segreto condiviso;
  non esporre questa modalità su ingress pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **device token** con ambito limitato al ruolo +
  scopes della connessione. Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  persistito dal client per connessioni future.
- I client dovrebbero persistere il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel device token **memorizzato** dovrebbe riutilizzare anche il set di scope approvati
  memorizzato per quel token. Questo preserva l’accesso di lettura/probe/status
  già concesso ed evita di ridurre silenziosamente le riconnessioni a uno
  scope implicito più ristretto solo admin.
- Assemblaggio dell’autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei valori precedenti ha risolto un
    `auth.token`. Un token condiviso o qualunque device token risolto lo sopprime.
  - La promozione automatica di un device token memorizzato nel retry una tantum
    `AUTH_TOKEN_MISMATCH` è consentita solo per **endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff bootstrap.
  Persistile solo quando la connessione ha usato autenticazione bootstrap su un trasporto attendibile
  come `wss://` o pairing loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quel
  set di scope richiesto dal chiamante rimane autoritativo; gli scope in cache vengono riutilizzati solo
  quando il client riutilizza il token per dispositivo memorizzato.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede scope `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Ripete il bearer token sostitutivo
  solo per chiamate dello stesso dispositivo già autenticate con
  quel device token, così i client solo token possono persistere il sostituto prima
  della riconnessione. Le rotazioni shared/admin non ripetono il bearer token.
- Emissione, rotazione e revoca dei token restano limitate al set di ruoli approvato
  registrato nella voce di pairing di quel dispositivo; la mutazione dei token non può espandere né
  indirizzare un ruolo dispositivo che l’approvazione del pairing non ha mai concesso.
- Per le sessioni con token di dispositivo accoppiato, la gestione dei dispositivi è auto-limitata salvo che il
  chiamante abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche il set di scope del token operatore
  di destinazione rispetto agli scope della sessione corrente del chiamante. I chiamanti non admin
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se il retry fallisce, i client dovrebbero interrompere i loop automatici di riconnessione e mostrare indicazioni di azione per l’operatore.
- `AUTH_SCOPE_MISMATCH` significa che il device token è stato riconosciuto ma non copre
  il ruolo/gli scope richiesti. I client non dovrebbero presentarlo come token errato;
  chiedi all’operatore di rifare il pairing o approvare il contratto di scope più stretto/più ampio.

## Identità dispositivo + pairing

- I nodi dovrebbero includere un’identità dispositivo stabile (`device.id`) derivata da un
  fingerprint della keypair.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo a meno che l’auto-approvazione locale
  sia abilitata.
- L’auto-approvazione del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche uno stretto percorso di self-connect backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni stessa-host tailnet o LAN sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- I client WS normalmente includono l’identità `device` durante `connect` (operatore +
  nodo). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione Control UI operatore riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticate con token/password Gateway
    condivisi.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell’autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde al fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo accoppiato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare il fingerprint del certificato Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Scope

Questo protocollo espone la **API Gateway completa** (status, channels, models, chat,
agent, sessions, nodes, approvals, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)

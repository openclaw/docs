---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema e dei modelli del protocollo
summary: 'Protocollo WebSocket Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-05-07T13:18:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto Node** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, Node iOS/Android, Node
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito**
al momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il gateway chiuda o scarti il frame interessato. Questi eventi mantengono
  dimensioni, limiti, superfici e codici motivo sicuri. Non mantengono il corpo del messaggio,
  i contenuti degli allegati, il corpo del frame grezzo, token, cookie o valori segreti.

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

Mentre il Gateway sta ancora completando i sidecar di avvio, la richiesta `connect` può
restituire un errore `UNAVAILABLE` riprovabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client devono riprovare quella risposta
entro il budget complessivo di connessione invece di esporla come un errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `pluginSurfaceUrls` è facoltativo e mappa i nomi delle superfici dei plugin,
come `canvas`, a URL ospitati con ambito.

Gli URL delle superfici dei Plugin con ambito possono scadere. I Node possono chiamare
`node.pluginSurface.refresh` con `{ "surface": "canvas" }` per ricevere una nuova
voce in `pluginSurfaceUrls`. Il refactoring sperimentale del Plugin Canvas non
supporta il percorso di compatibilità deprecato `canvasHostUrl`, `canvasCapability` o
`node.canvas.capability.refresh`; i client nativi e i gateway attuali devono usare le superfici dei plugin.

Quando non viene emesso alcun token del dispositivo, `hello-ok.auth` riporta le autorizzazioni
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
si autenticano con il token/password condiviso del gateway. Questo percorso è riservato
alle RPC interne del piano di controllo e impedisce alle baseline obsolete di associazione CLI/dispositivo
di bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni dei sottoagenti. I client remoti,
i client di origine browser, i client Node e i client espliciti con token dispositivo/identità dispositivo
usano ancora i normali controlli di associazione e aggiornamento degli ambiti.

Quando viene emesso un token del dispositivo, `hello-ok` include anche:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante il passaggio di bootstrap attendibile, `hello-ok.auth` può includere anche ulteriori
voci di ruolo delimitate in `deviceTokens`:

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
`scopes: []` e qualsiasi token operatore trasferito rimane limitato all'allowlist
dell'operatore di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap rimangono
prefissati per ruolo: le voci operatore soddisfano solo le richieste operatore, e i ruoli non operatore
necessitano comunque di ambiti sotto il proprio prefisso di ruolo.

### Esempio Node

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

## Incorniciamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione
e la semantica dei segreti condivisi, vedi [Ambiti operatore](/it/gateway/operator-scopes).

### Ruoli

- `operator` = client del piano di controllo (CLI/UI/automazione).
- `node` = host di capacità (fotocamera/schermo/canvas/system.run).

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

I metodi RPC Gateway registrati dai Plugin possono richiedere un proprio ambito operatore, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando in aggiunta. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo degli ambiti al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi Node non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (Node)

I Node dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per l'invocazione.
- `permissions`: interruttori granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway tratta queste come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes`, così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **Node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I Node connessi riportano
  l'ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i Node associati possono anche riportare
  una presenza in background duratura quando un evento Node attendibile aggiorna i metadati di associazione.

### Evento Node attivo in background

I Node possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un Node associato era
attivo durante un risveglio in background senza marcarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L'evento è duraturo solo per sessioni dispositivo Node
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

I gateway più vecchi possono ancora restituire `{ "ok": true }` per `node.event`; i client devono trattarlo come una
RPC riconosciuta, non come persistenza duratura della presenza.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono controllati per ambito, così le sessioni limitate all'associazione o solo Node non ricevono passivamente contenuti di sessione.

- **Frame chat, agente e risultati strumenti** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita di connessione/disconnessione, ecc.) rimangono senza restrizioni, così lo stato del trasporto resta osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono limitate per ambito per impostazione predefinita (fail-closed), a meno che un gestore registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l'ordinamento monotonico su quel socket anche quando client diversi vedono sottoinsiemi dell'event stream filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth sopra. Questo
non è un dump generato: `hello-ok.features.methods` è una lista di discovery
conservativa costruita da `src/gateway/server-methods-list.ts` più gli export dei metodi
Plugin/canale caricati. Trattala come discovery delle funzionalità, non come
enumerazione completa di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` restituisce lo snapshot di salute del gateway memorizzato nella cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e delimitato. Mantiene metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato di coda/sessione, nomi di canali/plugin e ID sessione. Non mantiene testo chat, corpi webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per client operatore con ambito admin.
    - `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi relay e di associazione.
    - `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi operatore/Node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` abilita o disabilita l'elaborazione Heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati in formato adatto al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce le finestre di utilizzo dei provider e i riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di prontezza della memoria vettoriale / degli embedding in cache per lo spazio di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live al provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e in sola lettura dell'harness REM per client remoti del piano di controllo. Può includere percorsi dello spazio di lavoro, frammenti di memoria, markdown fondato renderizzato e candidati alla promozione profonda, quindi i chiamanti richiedono `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporali per una sessione.
    - `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web attuale compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di prova a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger di wake word memorizzati.
    - `voicewake.set` aggiorna i trigger di wake word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii mirati a canale/account/thread al di fuori del runner di chat.
    - `logs.tail` restituisce la coda del log su file del Gateway configurata con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo in sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce in tempo reale. Include id dei provider, etichette, stato configurato, id di modelli/voci esposti, modalità canoniche, trasporti, strategie del cervello e flag audio/capacità in tempo reale senza restituire segreti dei provider né modificare la configurazione globale.
    - `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk posseduta dal Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. `brain: "direct-tools"` richiede `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce metadati di stanza/sessione più eventi Talk recenti senza il token in chiaro o l'hash del token memorizzato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay in tempo reale e trascrizione possedute dal Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` guidano il ciclo di vita dei turni managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione VAD-gated nelle sessioni relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione relay in tempo reale posseduta dal Gateway.
    - `talk.session.close` chiude una sessione relay, di trascrizione o managed-room posseduta dal Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato attuale della modalità Talk per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider in tempo reale posseduta dal client usando `webrtc` o `provider-websocket` mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale posseduti dal client di inoltrare le chiamate a strumenti del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un id di esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.event` è il singolo canale di eventi Talk per adattatori in tempo reale, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza il parlato tramite il provider di sintesi vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` commutano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech one-shot.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo le SecretRef attive e scambia lo stato dei segreti del runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni dei segreti mirate a comando per un insieme specifico di comandi/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida + sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato dagli strumenti Control UI e CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati di schema di Plugin + canale quando il runtime può caricarli. Lo schema include metadati di campo `title` / `description` derivati dalle stesse etichette e dal testo di aiuto usati dall'interfaccia utente, inclusi oggetti annidati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione di campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup circoscritto a un percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, suggerimento corrispondente + `hintPath` e riepiloghi immediati dei figli per drill-down UI/CLI. I nodi schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno successivo dell'agente tramite la coda di continuazione del riavvio. Gli aggiornamenti tramite package manager forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, così il vecchio processo Gateway non continua a caricare pigramente da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinel di riavvio aggiornamento in cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.

  </Accordion>

  <Accordion title="Helper di agente e spazio di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi modello effettivo e metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono record degli agenti e cablaggio degli spazi di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file bootstrap dello spazio di lavoro esposti per un agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo media della trascrizione con provenienza corrispondente; le origini URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono il rilevamento in sola lettura degli ambienti locali al Gateway e dei nodi per client SDK.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice delle sessioni correnti, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga sessione del Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` opzionale, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga completa della sessione memorizzata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono rimossi dal testo visibile, i payload XML in testo semplice delle chiamate a strumento (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumento troncati) e i token di controllo modello ASCII/full-width trapelati vengono rimossi, le righe assistente composte solo da token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse, e le righe troppo grandi possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dispositivo.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione nodi, invocazione e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei nodi e la verifica bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta di invocazione.
    - `node.event` trasporta eventi originati dal nodo verso il gateway.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono lavoro in sospeso durevole per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più la ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` al timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot dei criteri di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono i criteri di approvazione exec locali del nodo tramite comandi di inoltro del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo heartbeat del testo di risveglio; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti chat dell'interfaccia utente come `chat.inject` e altri eventi chat solo di trascrizione.
- `session.message` e `session.tool`: aggiornamenti di trascrizione/flusso eventi per una sessione sottoscritta.
- `sessions.changed`: indice di sessione o metadati modificati.
- `presence`: aggiornamenti degli snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / attività.
- `health`: aggiornamento dello snapshot di integrità del gateway.
- `heartbeat`: aggiornamento del flusso eventi heartbeat.
- `cron`: evento di modifica di esecuzione/job cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento del nodo.
- `node.invoke.request`: broadcast della richiesta di invocazione del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger della parola di attivazione modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione Plugin.

### Metodi helper del nodo

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle skill per i controlli di autorizzazione automatica.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi di runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie viene presa di mira dal `name` primario:
    - `text` restituisce il token del comando di testo primario senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi sensibili al provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo sensibile al provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti di runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: indica se uno strumento Plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto di runtime attendibile dalla sessione lato server invece di accettare il contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, Plugin e canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile attraverso lo stesso percorso dei criteri del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. I rifiuti per approvazione o criteri restituiscono `ok:false` nel payload invece di bypassare la pipeline dei criteri degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile delle skill per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello spazio di lavoro dell'agente predefinito.
  - La modalità configurazione applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento corrente di runtime. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per il selettore. Se `agents.defaults.models` è configurato, prevale comunque. Altrimenti la risposta usa le voci esplicite `models.providers.*.models`, ricadendo sul catalogo completo solo quando non esistono righe di modelli configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usalo per diagnostica e interfacce utente di scoperta, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand` canonici/metadati di sessione). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback della consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo in sessione quando non è possibile risolvere una route consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/version.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v4 e costituiscono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                          | Fonte                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client abbinato) |
| Backoff riconnessione iniziale            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff riconnessione massimo             | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Periodo di grazia force-stop prima di `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` effettivi in `hello-ok`; i client devono rispettare questi valori invece dei predefiniti precedenti all'handshake.

## Autenticazione

- L'autenticazione del Gateway con segreto condiviso usa `connect.params.auth.token` o
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che includono identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione di connect
  dalle intestazioni della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato salta interamente l'autenticazione
  connect con segreto condiviso; non esporre questa modalità su ingress pubblico/non attendibile.
- Dopo l'associazione, il Gateway emette un **token del dispositivo** limitato a ruolo
  + ambiti della connessione. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  mantenuto dal client per le connessioni future.
- I client devono mantenere il `hello-ok.auth.deviceToken` principale dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token del dispositivo **memorizzato** deve anche riutilizzare
  l'insieme di ambiti approvati memorizzato per quel token. Questo preserva l'accesso
  a lettura/sondaggio/stato già concesso ed evita di restringere silenziosamente le
  riconnessioni a un ambito implicito più limitato solo amministratore.
- Assemblaggio dell'autenticazione connect lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo risolto lo sopprime.
  - La promozione automatica di un token del dispositivo memorizzato al nuovo tentativo una tantum
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con `tlsFingerprint` fissata. Il `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di passaggio bootstrap.
  Mantienile solo quando connect ha usato l'autenticazione bootstrap su un trasporto attendibile
  come `wss://` o loopback/associazione locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante resta autorevole; gli ambiti nella cache vengono riutilizzati
  solo quando il client riusa il token per dispositivo memorizzato.
- I token del dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Restituisce in eco il token bearer
  sostitutivo solo per chiamate dallo stesso dispositivo che sono già autenticate con
  quel token del dispositivo, così i client solo token possono mantenere il loro sostituto prima
  di riconnettersi. Le rotazioni condivise/amministratore non restituiscono in eco il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvati
  registrato nella voce di associazione di quel dispositivo; la mutazione dei token non può
  espandere o puntare a un ruolo del dispositivo che l'approvazione dell'associazione non ha mai concesso.
- Per le sessioni token di dispositivi associati, la gestione del dispositivo è auto-limitata salvo che
  il chiamante abbia anche `operator.admin`: i chiamanti non amministratori possono rimuovere/revocare/ruotare
  solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token
  operatore di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non amministratori
  non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti per il recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un solo nuovo tentativo limitato con un token per dispositivo in cache.
  - Se quel nuovo tentativo fallisce, i client devono interrompere i cicli automatici di riconnessione e mostrare indicazioni per l'intervento dell'operatore.

## Identità del dispositivo + associazione

- I nodi devono includere un'identità stabile del dispositivo (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di associazione sono richieste per i nuovi ID dispositivo salvo che
  l'approvazione automatica locale sia abilitata.
- L'approvazione automatica dell'associazione è incentrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN dallo stesso host sono comunque trattate come remote per l'associazione e
  richiedono approvazione.
- I client WS includono normalmente l'identità `device` durante `connect` (operatore +
  nodo). Le uniche eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per la compatibilità HTTP non sicura solo localhost.
  - autenticazione riuscita della Control UI operatore con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergenza, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticate con il token/password
    condiviso del Gateway.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo scostamento consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  dei dispositivi associati controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato del Gateway (vedi configurazione
  `gateway.tls` più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**API completa del Gateway** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

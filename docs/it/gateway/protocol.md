---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-05-06T08:52:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, UI web, app macOS, nodi iOS/Android, nodi senza
interfaccia) si connettono tramite WebSocket e dichiarano il loro **ruolo** + **ambito**
al momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
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
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero ritentare quella risposta
entro il loro budget complessivo di connessione invece di mostrarla come un errore
terminale di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti obbligatori secondo lo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è obbligatorio e riporta
il ruolo/gli ambiti negoziati. `canvasHostUrl` è opzionale.

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

I client backend affidabili nello stesso processo (`client.id: "gateway-client"`,
`client.mode: "backend"`) possono omettere `device` sulle connessioni dirette local loopback quando
si autenticano con il token/password condiviso del gateway. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce che baseline CLI/dispositivo obsolete
blocchino il lavoro backend locale, come gli aggiornamenti delle sessioni dei subagent. I client remoti,
i client con origine browser, i client nodo e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di abbinamento e upgrade degli ambiti.

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

Durante il passaggio di bootstrap affidabile, `hello-ok.auth` può includere anche ulteriori
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

Per il flusso di bootstrap nodo/operatore integrato, il token nodo primario resta
`scopes: []` e qualsiasi token operatore passato resta limitato all'allowlist
dell'operatore di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap restano
prefissati per ruolo: le voci operatore soddisfano solo le richieste operatore e i ruoli
non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.

### Esempio di nodo

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

## Framing

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operatore, i controlli al momento dell'approvazione e la semantica
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

I metodi RPC del gateway registrati dai Plugin possono richiedere il proprio ambito operatore, ma
i prefissi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli aggiuntivi più severi a livello di comando. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione oltre
all'ambito di metodo di base:

- richieste senza comando: `operator.pairing`
- richieste con comandi nodo non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/permessi (nodo)

I nodi dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello come `camera`, `canvas`, `screen`,
  `location`, `voice` e `talk`.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` affinché le UI possano mostrare una singola riga per dispositivo
  anche quando si connette sia come **operatore** sia come **nodo**.
- `node.list` include i campi opzionali `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  l'ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi abbinati possono anche riportare
  una presenza in background duratura quando un evento nodo affidabile aggiorna i loro metadati di abbinamento.

### Evento di attività in background del nodo

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un nodo abbinato era
attivo durante un risveglio in background senza marcarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L'evento è duraturo solo per sessioni dispositivo nodo
autenticate; le sessioni senza dispositivo o non abbinate restituiscono `handled: false`.

I gateway riusciti restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I gateway più vecchi possono ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come un
RPC riconosciuto, non come persistenza duratura della presenza.

## Definizione degli ambiti degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti da ambito, in modo che le sessioni con ambito di abbinamento o solo nodo non ricevano passivamente contenuti di sessione.

- I **frame di chat, agente e risultato strumento** (inclusi eventi `agent` in streaming e risultati delle chiamate strumento) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dai Plugin** sono protetti da `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connessione/disconnessione, ecc.) restano senza restrizioni affinché lo stato del trasporto resti osservabile da ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono protette da ambito per impostazione predefinita (fail-closed) a meno che un handler registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per-client, così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso di eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/autenticazione sopra. Questo
non è un dump generato — `hello-ok.features.methods` è un elenco di discovery
conservativo costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi
Plugin/canale caricati. Trattalo come discovery delle funzionalità, non come un'enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di stato del gateway memorizzato in cache o appena verificato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e limitato. Conserva metadati operativi come nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e ID sessione. Non conserva testo chat, corpi webhook, output strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per client operatore con ambito admin.
    - `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi di relay e abbinamento.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operatore/nodo connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati di dimensioni adatte al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo/dei limiti residui del provider.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di preparazione della memoria vettoriale / degli embedding memorizzati nella cache per il workspace dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e di sola lettura dell'harness REM per client remoti del control plane. Può includere percorsi del workspace, frammenti di memoria, markdown grounded renderizzato e candidati alla promozione approfondita, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci di log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider di canale web attuale compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger di wake word memorizzati.
    - `voicewake.set` aggiorna i trigger di wake word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii destinati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda configurata del file di log del Gateway con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.catalog` restituisce il catalogo di sola lettura dei provider Talk per sintesi vocale, trascrizione in streaming e voce in tempo reale. Include ID dei provider, etichette, stato configurato, ID di modelli/voci esposti, modalità canoniche, trasporti, strategie del brain e flag audio/capacità in tempo reale senza restituire segreti dei provider né modificare la configurazione globale.
    - `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.session.create` crea una sessione Talk di proprietà del Gateway per `realtime/gateway-relay`, `transcription/gateway-relay` o `stt-tts/managed-room`. `brain: "direct-tools"` richiede `operator.admin`.
    - `talk.session.join` convalida un token di sessione managed-room, emette eventi `session.ready` o `session.replaced` secondo necessità e restituisce i metadati di stanza/sessione più gli eventi Talk recenti senza il token in chiaro o l'hash del token memorizzato.
    - `talk.session.appendAudio` aggiunge audio di input PCM base64 alle sessioni di relay in tempo reale e di trascrizione di proprietà del Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` e `talk.session.cancelTurn` gestiscono il ciclo di vita del turno managed-room con rifiuto dei turni obsoleti prima che lo stato venga cancellato.
    - `talk.session.cancelOutput` interrompe l'output audio dell'assistente, principalmente per l'interruzione VAD-gated nelle sessioni di relay del Gateway.
    - `talk.session.submitToolResult` completa una chiamata a strumento del provider emessa da una sessione di relay in tempo reale di proprietà del Gateway.
    - `talk.session.close` chiude una sessione relay, di trascrizione o managed-room di proprietà del Gateway ed emette eventi Talk terminali.
    - `talk.mode` imposta/trasmette lo stato della modalità Talk attuale per i client WebChat/Control UI.
    - `talk.client.create` crea una sessione provider in tempo reale di proprietà del client usando `webrtc` o `provider-websocket`, mentre il Gateway possiede configurazione, credenziali, istruzioni e policy degli strumenti.
    - `talk.client.toolCall` consente ai trasporti in tempo reale di proprietà del client di inoltrare le chiamate a strumento del provider alla policy del Gateway. Il primo strumento supportato è `openclaw_agent_consult`; i client ricevono un ID di esecuzione e attendono i normali eventi del ciclo di vita della chat prima di inviare il risultato dello strumento specifico del provider.
    - `talk.event` è il singolo canale di eventi Talk per adattatori in tempo reale, trascrizione, STT/TTS, managed-room, telefonia e riunioni.
    - `talk.speak` sintetizza la voce tramite il provider di sintesi vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato di configurazione dei provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo le SecretRefs attive e sostituisce lo stato dei segreti del runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate a comandi per uno specifico insieme di comandi/target.
    - `config.get` restituisce lo snapshot e l'hash della configurazione attuale.
    - `config.set` scrive un payload di configurazione convalidato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` convalida + sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di Plugin + canali quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, inclusi oggetti annidati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione dei campi corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath` e riepiloghi immediati dei figli per il drill-down UI/CLI. I nodi schema di lookup mantengono la documentazione rivolta all'utente e i campi di convalida comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno successivo dell'agente tramite la coda di continuazione del riavvio. Gli aggiornamenti del package manager forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, in modo che il vecchio processo Gateway non continui a caricare pigramente da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinella di riavvio dell'aggiornamento memorizzato nella cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.

  </Accordion>

  <Accordion title="Helper per agente e workspace">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi modello effettivo e metadati runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono record degli agenti e collegamenti del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file del workspace di bootstrap esposti per un agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download degli artefatti derivati dalle trascrizioni per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo media della trascrizione con provenienza corrispondente; fonti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `environments.list` e `environments.status` espongono la discovery di sola lettura degli ambienti locali del Gateway e dei nodi per i client SDK.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice delle sessioni attuali, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS attuale.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di trascrizione/messaggi per una sessione.
    - `sessions.preview` restituisce anteprime limitate delle trascrizioni per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza un target di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` opzionale, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e riporta il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione delle sessioni.
    - `sessions.get` restituisce la riga completa della sessione memorizzata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamate a strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumento troncati) e i token di controllo del modello ASCII/full-width trapelati vengono rimossi, le righe dell'assistente costituite da soli token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse e le righe troppo grandi possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione Node, invocazione e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei nodi e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo associato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta di invocazione.
    - `node.event` riporta gli eventi originati dal nodo nel gateway.
    - `node.canvas.capability.refresh` aggiorna i token di capacità canvas con ambito.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso persistente per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum, oltre alla ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot delle policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al nodo tramite comandi di relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dal plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat di testo di risveglio; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie comuni di eventi

- `chat`: aggiornamenti della chat dell'interfaccia utente, come `chat.inject` e altri eventi di chat solo transcript.
- `session.message` e `session.tool`: aggiornamenti di transcript/flusso eventi per una sessione sottoscritta.
- `sessions.changed`: indice della sessione o metadati modificati.
- `presence`: aggiornamenti dello snapshot della presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di integrità del Gateway.
- `heartbeat`: aggiornamento del flusso eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento del nodo.
- `node.invoke.request`: broadcast della richiesta di invocazione del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione del trigger della parola di risveglio modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione plugin.

### Metodi helper dei Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle skill per i controlli di consenso automatico.

### Metodi helper per gli operatori

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi di runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie è destinata dal `name` principale:
    - `text` restituisce il token del comando testuale principale senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono i nomi nativi sensibili al provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo sensibile al provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti di runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: se uno strumento plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto di runtime attendibile dalla sessione lato server invece di accettare un contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, plugin e di canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo stesso percorso di policy del gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - La risposta è un envelope rivolto all'SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. I rifiuti di approvazione o policy restituiscono `ok:false` nel payload invece di aggirare la pipeline di policy degli strumenti del gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile delle skill per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di discovery di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello spazio di lavoro dell'agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>`, come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro facoltativo `view`:

- Omesso o `"default"`: comportamento corrente a runtime. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento delle dimensioni di un selettore. Se `agents.defaults.models` è configurato, ha comunque la precedenza. Altrimenti la risposta usa le voci esplicite `models.providers.*.models`, con fallback al catalogo completo solo quando non esistono righe di modelli configurate.
- `"all"`: catalogo Gateway completo, ignorando `agents.defaults.models`. Usalo per diagnostica e interfacce utente di discovery, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede lo scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati della sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate `node.invoke system.run` inoltrate riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback della consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo nella sessione quando non è possibile risolvere alcuna route consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le mancate corrispondenze.
- Schemi e modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v3 e costituiscono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                          | Fonte                                                                                      |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout della richiesta (per RPC)         | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client abbinato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Clamp di retry rapido dopo chiusura device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Periodo di grazia force-stop prima di `terminate()` | `250` ms                                    | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                  | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` in `hello-ok`; i client devono rispettare tali valori anziché i valori predefiniti precedenti all'handshake.

## Auth

- L’autenticazione del Gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione tramite
  le intestazioni della richiesta invece di `connect.params.auth.*`.
- L’ingresso privato `gateway.auth.mode: "none"` salta interamente l’autenticazione della connessione con segreto condiviso;
  non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo l’associazione, il Gateway emette un **token del dispositivo** limitato al
  ruolo + ambiti della connessione. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  persistito dal client per connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token del dispositivo **memorizzato** deve anche riusare l’insieme di
  ambiti approvato memorizzato per quel token. Questo preserva l’accesso in lettura/sonda/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo amministratore.
- Assemblaggio dell’autenticazione della connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei valori precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token del dispositivo risolto lo sopprime.
  - La promozione automatica di un token del dispositivo memorizzato nel nuovo tentativo una tantum
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di passaggio bootstrap.
  Persistile solo quando la connessione ha usato l’autenticazione bootstrap su un trasporto attendibile
  come `wss://` o l’associazione loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell’insieme di
  ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono
  riusati solo quando il client riusa il token per dispositivo memorizzato.
- I token dei dispositivi possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l’ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Include in risposta il token portatore
  sostitutivo solo per chiamate dallo stesso dispositivo già autenticate con
  quel token del dispositivo, così i client solo token possono persistere la sostituzione prima di
  riconnettersi. Le rotazioni condivise/amministrative non includono in risposta il token portatore.
- Emissione, rotazione e revoca dei token restano limitate all’insieme di ruoli approvato
  registrato nella voce di associazione di quel dispositivo; la mutazione del token non può espandere né
  prendere di mira un ruolo del dispositivo che l’approvazione di associazione non ha mai concesso.
- Per le sessioni con token di dispositivi associati, la gestione dei dispositivi è auto-limitata, a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non amministratori possono rimuovere/revocare/ruotare
  solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l’insieme di ambiti del token operatore
  di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non amministratori
  non possono ruotare o revocare un token operatore più ampio di quello che possiedono già.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un nuovo tentativo limitato con un token per dispositivo in cache.
  - Se quel nuovo tentativo fallisce, i client devono interrompere i cicli di riconnessione automatica e mostrare indicazioni di azione per l’operatore.

## Identità del dispositivo + associazione

- I nodi devono includere un’identità stabile del dispositivo (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di associazione sono richieste per i nuovi ID dispositivo, a meno che l’approvazione automatica locale
  non sia abilitata.
- L’approvazione automatica dell’associazione è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di autoconnesione backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per l’associazione e
  richiedono approvazione.
- I client WS includono normalmente l’identità `device` durante `connect` (operatore +
  nodo). Le sole eccezioni operatore senza dispositivo sono percorsi di fiducia espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione riuscita dell’operatore Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticate con il token/password
    condiviso del Gateway.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell’autenticazione del dispositivo

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
  del dispositivo associato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono opzionalmente fissare la fingerprint del certificato del Gateway (vedi la configurazione
  `gateway.tls` più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l’**API completa del Gateway** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

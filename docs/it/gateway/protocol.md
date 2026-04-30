---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Risoluzione dei problemi relativi a incompatibilità di protocollo o errori di connessione
    - Rigenerazione dello schema e dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-30T08:53:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, nodi iOS/Android, nodi
headless) si connettono tramite WebSocket e dichiarano il loro **ruolo** + **ambito** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero seguire i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  frame in ingresso sovradimensionati e buffer in uscita lenti emettono eventi `payload.large`
  prima che il gateway chiuda o scarti il frame interessato. Questi eventi mantengono
  dimensioni, limiti, superfici e codici motivo sicuri. Non mantengono il corpo del messaggio,
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
restituire un errore `UNAVAILABLE` riprovabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero riprovare quella risposta
entro il budget complessivo di connessione invece di presentarla come un errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `canvasHostUrl` è facoltativo.

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
agli RPC interni del control plane e impedisce che baseline di pairing CLI/dispositivo obsolete
blocchino il lavoro backend locale, come gli aggiornamenti delle sessioni subagent. I client remoti,
i client con origine browser, i client node e i client espliciti device-token/device-identity
continuano a usare i normali controlli di pairing e aggiornamento degli ambiti.

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

Durante l'handoff bootstrap attendibile, `hello-ok.auth` può anche includere voci di ruolo
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

Per il flusso bootstrap node/operator integrato, il token node primario resta
`scopes: []` e qualsiasi token operator passato resta limitato all'allowlist operator
di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti bootstrap restano
prefissati per ruolo: le voci operator soddisfano solo richieste operator, e i ruoli non operator
richiedono comunque ambiti sotto il proprio prefisso di ruolo.

### Esempio node

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

### Ruoli

- `operator` = client control plane (CLI/UI/automazione).
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

I metodi RPC gateway registrati dal Plugin possono richiedere il proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più severi a livello di comando. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell'ambito al momento dell'approvazione oltre
all'ambito del metodo di base:

- richieste senza comando: `operator.pairing`
- richieste con comandi node non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/comandi/permessi (node)

I nodi dichiarano le attestazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta queste come **attestazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I nodi connessi riportano
  il loro orario di connessione corrente come `lastSeenAtMs` con motivo `connect`; i nodi abbinati possono anche riportare
  presenza in background durevole quando un evento node attendibile aggiorna i loro metadati di pairing.

### Evento node background alive

I nodi possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un node abbinato era
attivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute sono normalizzate a
`background` dal gateway prima della persistenza. L'evento è durevole solo per sessioni dispositivo node
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
RPC riconosciuto, non come persistenza durevole della presenza.

## Scoping degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono controllati per ambito, in modo che sessioni con ambito pairing o solo node non ricevano passivamente contenuti di sessione.

- I **frame chat, agent e tool-result** (inclusi eventi `agent` in streaming e risultati delle chiamate tool) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dal Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così la salute del trasporto rimane osservabile da ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono controllate per ambito per impostazione predefinita (fail-closed), a meno che un handler registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l'ordinamento monotonico su quel socket anche quando client diversi vedono sottoinsiemi filtrati per ambito diversi dello stream di eventi.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco di discovery
conservativo costruito da `src/gateway/server-methods-list.ts` più export dei metodi
plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di salute del gateway dalla cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore di stabilità diagnostica recente e limitato. Mantiene metadati operativi come nomi evento, conteggi, dimensioni in byte, letture della memoria, stato di code/sessioni, nomi canale/plugin e ID sessione. Non mantiene testo chat, corpi webhook, output degli strumenti, corpi grezzi di richiesta o risposta, token, cookie o valori segreti. È richiesto l'ambito operator read.
    - `status` restituisce il riepilogo gateway in stile `/status`; i campi sensibili sono inclusi solo per client operator con ambito admin.
    - `gateway.identity.get` restituisce l'identità dispositivo del gateway usata dai flussi relay e pairing.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operator/node connessi.
    - `system-event` accoda un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
    - `set-heartbeats` abilita o disabilita l'elaborazione heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti a runtime. Passa `{ "view": "configured" }` per i modelli configurati in formato selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce le finestre di utilizzo dei provider e i riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di preparazione della memoria vettoriale / degli embedding in cache per lo spazio di lavoro dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e in sola lettura dell'harness REM per client remoti del piano di controllo. Può includere percorsi dello spazio di lavoro, frammenti di memoria, markdown contestualizzato renderizzato e candidati per la promozione profonda, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati e inclusi nel bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta il logout.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider del canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un Node iOS registrato.
    - `voicewake.get` restituisce i trigger di wake-word archiviati.
    - `voicewake.set` aggiorna i trigger di wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC di consegna in uscita diretta per invii mirati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda del file di log del Gateway configurato con controlli per cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload di configurazione Talk effettivo; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato attuale della modalità Talk per i client WebChat/Control UI.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano o disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve nuovamente i SecretRef attivi e sostituisce lo stato dei segreti a runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti mirate al comando per uno specifico insieme di comandi/destinazioni.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione validato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` valida e sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di Plugin e canali quando il runtime può caricarli. Lo schema include i metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'UI, inclusi oggetti nidificati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione del campo corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup limitato a un percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath` e riepiloghi dei figli immediati per l'approfondimento UI/CLI. I nodi schema di lookup mantengono la documentazione rivolta all'utente e i campi di validazione comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito.
    - `update.status` restituisce l'ultimo sentinel di riavvio dell'aggiornamento memorizzato in cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite RPC WS.

  </Accordion>

  <Accordion title="Helper per agente e spazio di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi il modello effettivo e i metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio dello spazio di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file di bootstrap dello spazio di lavoro esposti per un agente.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice corrente delle sessioni, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante di interruzione e guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` opzionale, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna i metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga completa della sessione archiviata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumenti in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati) e i token di controllo del modello ASCII/a larghezza intera trapelati vengono rimossi, le righe dell'assistente composte solo da token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione Node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei Node e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei Node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un Node associato.
    - `node.invoke` inoltra un comando a un Node connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta di invoke.
    - `node.event` riporta nel gateway gli eventi originati dal Node.
    - `node.canvas.capability.refresh` aggiorna i token di capacità canvas con ambito.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei Node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per Node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazioni">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più il lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` al timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del Node tramite comandi relay del Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione di testo immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi di chat
  solo di trascrizione.
- `session.message` e `session.tool`: aggiornamenti della trascrizione/flusso di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice della sessione o metadati modificati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di salute del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'associazione Node.
- `node.invoke.request`: broadcast della richiesta di invoke del Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: configurazione del trigger di wake-word modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione
  exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione
  plugin.

### Metodi helper del Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili Skill
  per i controlli di auto-allow.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi runtime per un agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie è destinata dal `name` principale:
    - `text` restituisce il token del comando testuale principale senza la `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono i nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento Plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivo a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, Plugin e di canale.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile delle skill per un agente.
  - `agentId` è facoltativo; ometterlo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di scoperta ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host Gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello spazio di lavoro dell'agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` e `env`.

### Viste `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è il catalogo Gateway completo.
- `"configured"`: comportamento dimensionato per il selettore. Se `agents.defaults.models` è configurato, ha comunque precedenza. Altrimenti la risposta usa le voci esplicite `models.providers.*.models`, con fallback al catalogo completo solo quando non esistono righe modello configurate.
- `"all"`: catalogo Gateway completo, bypassando `agents.defaults.models`. Usarlo per diagnostica e UI di scoperta, non per i normali selettori di modelli.

## Approvazioni exec

- Quando una richiesta exec necessita di approvazione, il gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand` canonici/metadati di sessione). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante muta `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il gateway rifiuta l'esecuzione invece di fidarsi del payload mutato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo di sessione quando non è possibile risolvere alcuna rotta consegnabile esterna (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi e modelli sono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v3 e costituiscono la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                           | Fonte                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client accoppiato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite retry rapido dopo chiusura device-token | `250` ms                                         | `src/gateway/client.ts`                                                                    |
| Periodo di grazia force-stop prima di `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` effettivi in `hello-ok`; i client devono rispettare quei valori anziché i valori predefiniti pre-handshake.

## Auth

- L'autenticazione Gateway con segreto condiviso usa `connect.params.auth.token` o `connect.params.auth.password`, a seconda della modalità auth configurata.
- Le modalità con identità, come Tailscale Serve (`gateway.auth.allowTailscale: true`) o `gateway.auth.mode: "trusted-proxy"` non-loopback, soddisfano il controllo auth di connessione tramite gli header della richiesta invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato salta completamente l'autenticazione di connessione con segreto condiviso; non esporre questa modalità su ingress pubblico/non attendibile.
- Dopo il pairing, il Gateway emette un **token dispositivo** limitato a ruolo di connessione + ambiti. Viene restituito in `hello-ok.auth.deviceToken` e deve essere conservato dal client per connessioni future.
- I client devono conservare il `hello-ok.auth.deviceToken` principale dopo qualsiasi connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** deve riutilizzare anche l'insieme di ambiti approvato memorizzato per quel token. Questo preserva l'accesso read/probe/status già concesso ed evita di ridurre silenziosamente le riconnessioni a un ambito implicito più ristretto solo admin.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` è popolato in ordine di priorità: prima token condiviso esplicito, poi un `deviceToken` esplicito, poi un token per dispositivo memorizzato (indicizzato da `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel retry una tantum `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**: loopback oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico senza pinning non si qualifica.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff bootstrap. Conservale solo quando la connessione ha usato auth bootstrap su un trasporto attendibile come `wss://` o pairing loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme di ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono riutilizzati solo quando il client riutilizza il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e `device.token.revoke` (richiede l'ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Fa echo del token bearer sostitutivo solo per chiamate dallo stesso dispositivo già autenticate con quel token dispositivo, così i client solo token possono conservare il sostituto prima di riconnettersi. Le rotazioni shared/admin non fanno echo del token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato registrato nella voce di pairing di quel dispositivo; la mutazione del token non può espandere o prendere di mira un ruolo dispositivo che l'approvazione di pairing non ha mai concesso.
- Per le sessioni token di dispositivi associati, la gestione dispositivi è auto-limitata salvo che il chiamante abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token operatore di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non admin non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori auth includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i cicli di riconnessione automatica e mostrare indicazioni di azione per l'operatore.

## Identità dispositivo + pairing

- I Node devono includere un'identità dispositivo stabile (`device.id`) derivata da un
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di abbinamento sono richieste per i nuovi ID dispositivo, a meno che
  l'approvazione automatica locale non sia abilitata.
- L'approvazione automatica dell'abbinamento è incentrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per l'abbinamento e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  node). Le uniche eccezioni operatore senza dispositivo sono percorsi di attendibilità espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione operatore Control UI `gateway.auth.mode: "trusted-proxy"` riuscita.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticate con il token/password
    Gateway condiviso.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma precedente alla challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` in `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde al fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo della migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  dei dispositivi abbinati controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare il fingerprint del certificato del Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API completa del Gateway** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Risoluzione dei problemi relativi a disallineamenti del protocollo o errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versionamento'
title: Protocollo del Gateway
x-i18n:
    generated_at: "2026-05-03T21:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Il protocollo WS del Gateway è il **singolo piano di controllo + trasporto node** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, node iOS/Android, node
headless) si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell’handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connessione sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  frame in ingresso sovradimensionati e buffer in uscita lenti emettono eventi
  `payload.large` prima che il gateway chiuda o scarti il frame interessato. Questi eventi conservano
  dimensioni, limiti, superfici e codici motivo sicuri. Non conservano il corpo del messaggio,
  il contenuto degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

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
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero riprovare tale risposta
entro il proprio budget complessivo di connessione invece di mostrarla come un errore terminale
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
`client.mode: "backend"`) possono omettere `device` nelle connessioni loopback dirette quando
si autenticano con il token/la password gateway condivisi. Questo percorso è riservato
agli RPC interni del piano di controllo e impedisce a baseline obsolete di associazione CLI/dispositivo di
bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni subagent. I client remoti,
i client di origine browser, i client node e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di associazione e aggiornamento degli ambiti.

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

Durante il passaggio di consegne di bootstrap attendibile, `hello-ok.auth` può anche includere ulteriori
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

Per il flusso di bootstrap node/operator integrato, il token node primario resta
`scopes: []` e qualsiasi token operator passato resta limitato all’allowlist dell’operatore
di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap restano
prefissati per ruolo: le voci operator soddisfano solo le richieste operator, e i ruoli
non operator richiedono comunque ambiti sotto il proprio prefisso di ruolo.

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

## Incorniciamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

Per il modello completo degli ambiti operator, i controlli al momento dell’approvazione e la semantica
dei segreti condivisi, consulta [Ambiti operator](/it/gateway/operator-scopes).

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

I metodi RPC gateway registrati dai Plugin possono richiedere il proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L’ambito del metodo è solo il primo gate. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell’ambito al momento dell’approvazione oltre
all’ambito del metodo di base:

- richieste senza comandi: `operator.pairing`
- richieste con comandi node non exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/comandi/permessi (node)

I node dichiarano attestazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **attestazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I node connessi riportano
  il proprio orario di connessione corrente come `lastSeenAtMs` con motivo `connect`; i node associati possono anche riportare
  una presenza in background durevole quando un evento node attendibile aggiorna i metadati della loro associazione.

### Evento alive in background del node

I node possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un node associato era
attivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal gateway prima della persistenza. L’evento è durevole solo per sessioni dispositivo node
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

I gateway meno recenti potrebbero ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come un
RPC riconosciuto, non come persistenza durevole della presenza.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti da ambiti, così le sessioni limitate all’associazione o solo node non ricevono passivamente contenuti di sessione.

- I **frame di chat, agente e risultato strumento** (inclusi gli eventi `agent` in streaming e i risultati delle chiamate strumento) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dai Plugin** sono protetti con `operator.write` o `operator.admin`, a seconda di come li ha registrati il plugin.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così lo stato del trasporto rimane osservabile per ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono protette da ambiti per impostazione predefinita (fail-closed), a meno che un handler registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l’ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/autenticazione sopra. Questo
non è un dump generato — `hello-ok.features.methods` è un elenco di discovery conservativo
costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi di plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot della salute del gateway memorizzato nella cache o appena sondato.
    - `diagnostics.stability` restituisce il registratore diagnostico di stabilità recente e limitato. Conserva metadati operativi come nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/plugin e id sessione. Non conserva testo di chat, corpi Webhook, output strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l’ambito di lettura operator.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per i client operator con ambito admin.
    - `gateway.identity.get` restituisce l’identità dispositivo del gateway usata dai flussi relay e associazione.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operator/node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l’ultimo evento Heartbeat persistito.
    - `set-heartbeats` abilita/disabilita l’elaborazione degli Heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti dal runtime. Passa `{ "view": "configured" }` per i modelli configurati di dimensioni adatte al selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo/dei limiti rimanenti del provider.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di prontezza della vector memory / degli embedding memorizzati nella cache per il workspace dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live del provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e in sola lettura dell'harness REM per i client remoti del piano di controllo. Può includere percorsi del workspace, frammenti di memoria, markdown fondato renderizzato e candidati di promozione profonda, quindi i chiamanti necessitano di `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del registro di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato dei canali/Plugin integrati + inclusi.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta la disconnessione.
    - `web.login.start` avvia un flusso di accesso QR/web per il provider del canale web corrente compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di successo.
    - `push.test` invia una notifica push APNs di test a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger della parola di attivazione salvati.
    - `voicewake.set` aggiorna i trigger della parola di attivazione e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii mirati a canale/account/thread al di fuori del runner della chat.
    - `logs.tail` restituisce la coda del file di log Gateway configurato con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato della modalità Talk corrente per i client WebChat/Control UI.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve nuovamente le SecretRef attive e sostituisce lo stato dei segreti del runtime solo in caso di pieno successo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate ai comandi per uno specifico insieme comando/destinazione.
    - `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
    - `config.set` scrive un payload di configurazione validato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` valida + sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati degli schemi di Plugin + canale quando il runtime può caricarli. Lo schema include i metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, inclusi oggetti annidati, wildcard, elementi di array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione del campo corrispondente.
    - `config.schema.lookup` restituisce un payload di ricerca limitato al percorso per un percorso di configurazione: percorso normalizzato, un nodo schema superficiale, hint corrispondente + `hintPath` e riepiloghi immediati dei figli per l'approfondimento UI/CLI. I nodi dello schema di ricerca mantengono la documentazione rivolta all'utente e i campi di validazione comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito; i chiamanti con una sessione possono includere `continuationMessage` così l'avvio riprende un turno di follow-up dell'agente tramite la coda di continuazione del riavvio. Gli aggiornamenti del gestore di pacchetti forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, così il vecchio processo Gateway non continua a caricare in modo lazy da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinel di riavvio aggiornamento memorizzato nella cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.

  </Accordion>

  <Accordion title="Helper di agente e workspace">
    - `agents.list` restituisce le voci agente configurate, inclusi modello effettivo e metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file di bootstrap del workspace esposti per un agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi di artefatti derivati dalla trascrizione e download per uno scope esplicito `sessionKey`, `runId` o `taskId`. Le query di run e attività risolvono la sessione proprietaria lato server e restituiscono solo i media della trascrizione con provenienza corrispondente; le fonti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un run e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo sessione">
    - `sessions.list` restituisce l'indice delle sessioni corrente, inclusi i metadati `agentRuntime` per riga quando è configurato un backend runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrupt-and-steer per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` facoltativo, oppure passare solo `runId` per i run attivi che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione memorizzata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML delle chiamate strumento in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata strumento troncati) e i token di controllo modello ASCII/full-width trapelati vengono rimossi, le righe dell'assistente composte solo da token silenziosi come gli esatti `NO_REPLY` / `no_reply` vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Abbinamento dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi abbinati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di abbinamento dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dello scope del chiamante.
    - `device.token.revoke` revoca un token di dispositivo abbinato entro i limiti del suo ruolo approvato e dello scope del chiamante.

  </Accordion>

  <Accordion title="Abbinamento nodi, invocazione e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'abbinamento dei nodi e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
    - `node.rename` aggiorna l'etichetta di un nodo abbinato.
    - `node.invoke` inoltra un comando a un nodo connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta di invocazione.
    - `node.event` trasporta gli eventi originati dal nodo di nuovo nel gateway.
    - `node.canvas.capability.refresh` aggiorna i token di capacità canvas limitati allo scope.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei nodi connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per nodi offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono le richieste di approvazione exec una tantum più ricerca/riproduzione delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al nodo tramite comandi relay del nodo.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione immediata o al prossimo Heartbeat di testo di attivazione; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi chat
  solo della trascrizione.
- `session.message` e `session.tool`: aggiornamenti della trascrizione/dello stream eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice delle sessioni o metadati modificati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di salute del gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica run/job Cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento nodi.
- `node.invoke.request`: broadcast della richiesta di invocazione nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo abbinato.
- `voicewake.changed`: configurazione dei trigger della parola di attivazione modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita dell'approvazione Plugin.

### Metodi helper dei nodi

- I nodi possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili skill
  per i controlli di auto-consenso.

### Metodi helper operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario dei comandi di runtime per un agente.
  - `agentId` è opzionale; ometterlo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie viene presa di mira dal `name` primario:
    - `text` restituisce il token del comando testuale primario senza il prefisso `/`
    - `native` e il percorso predefinito `both` restituiscono i nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando ne esiste uno.
  - `provider` è opzionale e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi Plugin nativi.
  - `includeArgs=false` omette dalla risposta i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti di runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento Plugin è opzionale
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto di runtime attendibile dalla sessione lato server invece di accettare contesto di autenticazione o consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, Plugin e di canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo stesso percorso di policy del Gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono opzionali.
  - Se sono presenti sia `sessionKey` sia `agentId`, l'agente della sessione risolta deve corrispondere a `agentId`.
  - La risposta è un envelope orientato all'SDK con `ok`, `toolName`, `output` opzionale e campi `error` tipizzati. Le approvazioni o i rifiuti di policy restituiscono `ok:false` nel payload anziché aggirare la pipeline di policy degli strumenti del Gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario Skills visibile per un agente.
  - `agentId` è opzionale; ometterlo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di individuazione di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella Skills nella directory `skills/` del workspace dell'agente predefinito.
  - Modalità installer del Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un'azione `metadata.openclaw.install` dichiarata sull'host del Gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel workspace dell'agente predefinito.
  - La modalità di configurazione applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` opzionale:

- Omesso o `"default"`: comportamento di runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è il catalogo completo del Gateway.
- `"configured"`: comportamento dimensionato per i picker. Se `agents.defaults.models` è configurato, continua ad avere la precedenza. Altrimenti la risposta usa le voci esplicite `models.providers.*.models`, ricadendo sul catalogo completo solo quando non esistono righe di modello configurate.
- `"all"`: catalogo completo del Gateway, ignorando `agents.defaults.models`. Usarlo per diagnostica e UI di individuazione, non per i normali picker di modelli.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il Gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l'inoltro finale approvato di `system.run`, il Gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo in sessione quando non è possibile risolvere alcuna route esterna consegnabile (ad esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le mancate corrispondenze.
- Schemi + modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v3 e rappresentano la baseline attesa per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client abbinato) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Periodo di tolleranza force-stop prima di `terminate()` | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` in `hello-ok`; i client devono rispettare quei valori anziché i valori predefiniti precedenti all'handshake.

## Autenticazione

- L'autenticazione Gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione tramite
  gli header della richiesta invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato salta completamente l'autenticazione
  della connessione con segreto condiviso; non esporre questa modalità su ingress pubblici/non attendibili.
- Dopo l'associazione, il Gateway emette un **token dispositivo** limitato al ruolo
  di connessione + scope. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  persistito dal client per le connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** deve anche riutilizzare
  l'insieme di scope approvati memorizzato per quel token. Questo conserva l'accesso
  read/probe/status già concesso ed evita di ridurre silenziosamente le riconnessioni
  a uno scope implicito più ristretto, solo admin.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token per-dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel tentativo singolo
    di retry `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff bootstrap.
  Persistili solo quando la connessione ha usato autenticazione bootstrap su un trasporto
  attendibile come `wss://` o associazione loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di scope richiesto dal chiamante resta autoritativo; gli scope in cache vengono riutilizzati
  solo quando il client riusa il token per-dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede lo scope `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Ripete il token bearer sostitutivo
  solo per chiamate dallo stesso dispositivo già autenticate con quel token dispositivo,
  così i client solo-token possono persistere il sostituto prima di riconnettersi.
  Le rotazioni shared/admin non ripetono il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvati
  registrato nella voce di associazione di quel dispositivo; la mutazione dei token non può
  espandere o scegliere come target un ruolo dispositivo che l'approvazione di associazione
  non ha mai concesso.
- Per le sessioni token di dispositivi associati, la gestione dei dispositivi è auto-limitata
  a meno che il chiamante non abbia anche `operator.admin`: i chiamanti non-admin possono
  rimuovere/revocare/ruotare solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di scope del token
  operatore target rispetto agli scope della sessione corrente del chiamante. I chiamanti
  non-admin non possono ruotare o revocare un token operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per-dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i loop di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.

## Identità dispositivo + associazione

- I Node devono includere un'identità dispositivo stabile (`device.id`) derivata da un
  fingerprint della keypair.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di associazione sono richieste per i nuovi ID dispositivo, a meno che
  l'approvazione automatica locale non sia abilitata.
- L'approvazione automatica dell'associazione è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per l'associazione e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni operatore senza dispositivo sono percorsi di trust espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione operatore Control UI riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend direct-loopback `gateway-client` autenticate con il token/password
    Gateway condiviso.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione dell'autenticazione dispositivo

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
  del dispositivo associato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare il fingerprint del certificato Gateway (vedi la configurazione
  `gateway.tls` più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Scope

Questo protocollo espone la **API Gateway completa** (stato, canali, modelli, chat,
agente, sessioni, Node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook Gateway](/it/gateway)

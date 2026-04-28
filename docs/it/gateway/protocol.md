---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug di incompatibilità del protocollo o errori di connessione
    - Rigenerazione di schema/modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versioning'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Il protocollo WS del Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, web UI, app macOS, node iOS/Android, node headless)
si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono seguire i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` e `policy` sono tutti obbligatori nello schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` è facoltativo. `auth`
riporta il ruolo/gli scope negoziati quando disponibili e include `deviceToken`
quando il gateway ne emette uno.

Quando non viene emesso alcun device token, `hello-ok.auth` può comunque riportare i permessi negoziati:

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
alle RPC interne del control plane ed evita che le baseline obsolete di abbinamento CLI/device
blocchino il lavoro backend locale come gli aggiornamenti di sessione dei subagent. I client remoti,
i client di origine browser, i client node e i client espliciti con device-token/device-identity
continuano a usare i normali controlli di abbinamento e aggiornamento degli scope.

Quando viene emesso un device token, `hello-ok` include anche:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Durante il passaggio di bootstrap attendibile, `hello-ok.auth` può includere anche ulteriori voci di ruolo limitate in `deviceTokens`:

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
`scopes: []` e qualsiasi token operator passato resta limitato alla allowlist
operator di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli di scope del bootstrap restano
prefissati dal ruolo: le voci operator soddisfano solo richieste operator e i ruoli non operator
continuano ad aver bisogno di scope sotto il proprio prefisso di ruolo.

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + scope

### Ruoli

- `operator` = client del control plane (CLI/UI/automazione).
- `node` = host di capacità (camera/screen/canvas/system.run).

### Scope (operator)

Scope comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).

I metodi RPC gateway registrati dai Plugin possono richiedere il proprio scope operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

Lo scope del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli a livello comando ancora più rigidi. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di scope aggiuntivo al momento dell'approvazione oltre allo
scope base del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

I node dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del device.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per device
  anche quando si connette sia come **operator** sia come **node**.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono limitati dagli scope così le sessioni limitate all'ambito pairing o solo-node non ricevono passivamente contenuto di sessione.

- **Frame chat, agente e risultato strumento** (inclusi gli eventi `agent` in streaming e i risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **I broadcast `plugin.*` definiti dai Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Gli eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così l'integrità del trasporto resta osservabile per ogni sessione autenticata.
- **Le famiglie di eventi broadcast sconosciute** sono limitate dagli scope per impostazione predefinita (fail-closed) a meno che un handler registrato non le allenti esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client così i broadcast preservano l'ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso di eventi filtrati per scope.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi handshake/auth sopra. Questo
non è un dump generato — `hello-ok.features.methods` è un elenco conservativo di
discovery costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi di Plugin/canale caricati. Trattalo come feature discovery, non come enumerazione completa di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di integrità del gateway memorizzato in cache o appena verificato.
    - `diagnostics.stability` restituisce il registratore limitato recente della stabilità diagnostica. Mantiene metadati operativi come nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di coda/sessione, nomi di canali/Plugin e id di sessione. Non mantiene testo chat, corpi Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto lo scope operator read.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per client operator con scope admin.
    - `gateway.identity.get` restituisce l'identità del device gateway usata dai flussi relay e pairing.
    - `system-presence` restituisce lo snapshot corrente di presenza per i device operator/node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l'elaborazione Heartbeat sul gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti in runtime.
    - `usage.status` restituisce riepiloghi delle finestre di utilizzo del provider e della quota residua.
    - `usage.cost` restituisce riepiloghi aggregati dei costi di utilizzo per un intervallo di date.
    - `doctor.memory.status` restituisce la disponibilità della memoria vettoriale / embedding per il workspace dell'agente predefinito attivo.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce serie temporali di utilizzo per una sessione.
    - `sessions.usage.logs` restituisce voci di log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di login">
    - `channels.status` restituisce riepiloghi di stato di canali/Plugin integrati + inclusi.
    - `channels.logout` esegue il logout di un canale/account specifico dove il canale supporta il logout.
    - `web.login.start` avvia un flusso di login QR/web per l'attuale provider del canale web compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il canale in caso di successo.
    - `push.test` invia un push APNs di test a un node iOS registrato.
    - `voicewake.get` restituisce i trigger di wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger di wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è la RPC di consegna diretta in uscita per invii mirati a canale/account/thread al di fuori del runner chat.
    - `logs.tail` restituisce la coda del file di log del gateway configurato con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato attuale della modalità Talk per i client WebChat/Control UI.
    - `talk.speak` sintetizza la voce tramite il provider di parlato Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano e disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei segreti runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti mirate al comando per un insieme specifico di comandi/destinazioni.
    - `config.get` restituisce lo snapshot della configurazione corrente e l'hash.
    - `config.set` scrive un payload di configurazione validato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` valida + sostituisce l'intero payload di configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati di schema di Plugin + canale quando il runtime può caricarli. Lo schema include i metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dalla UI, inclusi oggetto annidato, wildcard, elemento array e rami di composizione `anyOf` / `oneOf` / `allOf` quando esiste documentazione corrispondente del campo.
    - `config.schema.lookup` restituisce un payload di lookup limitato a un percorso per un percorso di configurazione: percorso normalizzato, un nodo di schema superficiale, hint corrispondente + `hintPath` e riepiloghi immediati dei figli per approfondimento UI/CLI. I nodi di schema di lookup mantengono la documentazione rivolta all'utente e i campi di validazione comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.

  </Accordion>

  <Accordion title="Helper per agente e workspace">
    - `agents.list` restituisce le voci degli agenti configurati.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il collegamento del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file bootstrap del workspace esposti per un agente.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende che un'esecuzione termini e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice corrente delle sessioni.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica della sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi transcript/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate del transcript per chiavi di sessione specifiche.
    - `sessions.resolve` risolve o canonizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrupt-and-steer per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce l'intera riga di sessione memorizzata.
    - L'esecuzione della chat continua a usare `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di chiamata strumento in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamata strumento troncati) e i token di controllo del modello trapelati ASCII/a larghezza piena vengono rimossi, le righe dell'assistente composte solo dal token silenzioso come `NO_REPLY` / `no_reply` esatto vengono omesse e le righe sovradimensionate possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Abbinamento device e device token">
    - `device.pair.list` restituisce i device abbinati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di abbinamento dei device.
    - `device.token.rotate` ruota un token di device abbinato entro i limiti del ruolo approvato e dello scope del chiamante.
    - `device.token.revoke` revoca un token di device abbinato entro i limiti del ruolo approvato e dello scope del chiamante.

  </Accordion>

  <Accordion title="Abbinamento node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` coprono l'abbinamento node e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei node noti/connessi.
    - `node.rename` aggiorna un'etichetta di node abbinato.
    - `node.invoke` inoltra un comando a un node connesso.
    - `node.invoke.result` restituisce il risultato di una richiesta invoke.
    - `node.event` trasporta nel gateway eventi originati dal node.
    - `node.canvas.capability.refresh` aggiorna i token di capacità canvas limitati all'ambito.
    - `node.pending.pull` e `node.pending.ack` sono le API di coda per node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono richieste di approvazione exec una tantum più lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale del node tramite comandi relay del node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione di testo di riattivazione immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Famiglie comuni di eventi

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi chat
  solo transcript.
- `session.message` e `session.tool`: aggiornamenti del transcript/stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: l'indice o i metadati delle sessioni sono cambiati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di integrità del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/processo cron.
- `shutdown`: notifica di spegnimento del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'abbinamento node.
- `node.invoke.request`: broadcast di richiesta invoke del node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del device abbinato.
- `voicewake.changed`: la configurazione del trigger della wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione del Plugin.

### Metodi helper del node

- I node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili
  delle Skills per i controlli di auto-allow.

### Metodi helper dell'operator

- Gli operator possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario
  dei comandi runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - `scope` controlla quale superficie punta il `name` primario:
    - `text` restituisce il token primario del comando di testo senza `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più sulla disponibilità dei comandi
    nativi del Plugin.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operator possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: se uno strumento del Plugin è facoltativo
- Gli operator possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario effettivo runtime degli strumenti
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime attendibile dal server della sessione invece di accettare
    contesto auth o di consegna fornito dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, Plugin e canale.
- Gli operator possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario
  visibile delle Skills per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operator possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di discovery di ClawHub.
- Gli operator possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` del workspace dell'agente predefinito.
  - Modalità installer del gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione dichiarata `metadata.openclaw.install` sull'host gateway.
- Gli operator possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel
    workspace dell'agente predefinito.
  - La modalità Config aggiorna i valori di `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec ha bisogno di approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati della sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico
  come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra prepare e l'inoltro finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: le destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo-sessione quando non è possibile risolvere alcun percorso esterno consegnabile (per esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versioning

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli vengono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili in tutto il protocollo v3 e rappresentano la baseline prevista per i client di terze parti.

| Costante                                  | Predefinito                                          | Sorgente                                                   |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout richiesta (per RPC)               | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                          | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff iniziale di riconnessione         | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff massimo di riconnessione          | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp di retry rapido dopo chiusura device-token | `250` ms                                     | `src/gateway/client.ts`                                    |
| Grace di arresto forzato prima di `terminate()` | `250` ms                                       | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Il server annuncia i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client devono rispettare tali valori
anziché i valori predefiniti pre-handshake.

## Autenticazione

- L'autenticazione del gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non-loopback, soddisfano il controllo di autenticazione connect a partire dagli
  header della richiesta invece che da `connect.params.auth.*`.
- L'ingresso privato con `gateway.auth.mode: "none"` salta completamente l'autenticazione connect con segreto condiviso; non esporre questa modalità su ingressi pubblici/non attendibili.
- Dopo l'abbinamento, il Gateway emette un **device token** limitato al ruolo + agli scope
  della connessione. Viene restituito in `hello-ok.auth.deviceToken` e il client dovrebbe
  mantenerlo persistente per le connessioni future.
- I client dovrebbero mantenere persistente il `hello-ok.auth.deviceToken` primario dopo ogni
  connessione riuscita.
- La riconnessione con quel **device token** memorizzato dovrebbe anche riutilizzare l'insieme di scope approvato
  memorizzato per quel token. Questo preserva l'accesso a lettura/probe/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  scope implicito solo admin più ristretto.
- L'assemblaggio dell'autenticazione connect lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi un `deviceToken` esplicito, poi un token memorizzato per device (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi device token risolto lo sopprime.
  - L'auto-promozione di un device token memorizzato nel retry una tantum
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili** —
    loopback, oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff di bootstrap.
  Mantienile persistenti solo quando la connessione ha usato autenticazione di bootstrap su un trasporto attendibile
  come `wss://` o loopback/abbinamento locale.
- Se un client fornisce un **deviceToken** esplicito o `scopes` espliciti, quell'insieme di scope richiesto dal chiamante
  resta autorevole; gli scope in cache vengono riutilizzati solo quando il client riutilizza il token memorizzato per device.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede scope `operator.pairing`).
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvati
  registrato nella voce di abbinamento di quel device; la modifica del token non può espandere né
  puntare a un ruolo del device che l'approvazione di abbinamento non ha mai concesso.
- Per le sessioni con token di device abbinato, la gestione del device è limitata a sé stessi a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo la **propria** voce di device.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di scope del token operator di destinazione rispetto agli scope della sessione corrente del chiamante. I chiamanti non admin
  non possono ruotare o revocare un token operator più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (booleano)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per device in cache.
  - Se quel retry fallisce, i client devono interrompere i cicli automatici di riconnessione e mostrare indicazioni per l'intervento dell'operator.

## Identità del device + abbinamento

- I node devono includere un'identità di device stabile (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I gateway emettono token per device + ruolo.
- Le approvazioni di abbinamento sono richieste per nuovi ID device a meno che
  non sia abilitata l'auto-approvazione locale.
- L'auto-approvazione dell'abbinamento è centrata sulle connessioni dirette loopback locali.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per l'abbinamento e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operator +
  node). Le uniche eccezioni operator senza device sono percorsi di trust espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione riuscita dell'operator Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (emergenza, grave downgrade di sicurezza).
  - RPC backend `gateway-client` in loopback diretto autenticate con il
    token/password condiviso del gateway.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione del device

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica non è riuscito. |

Obiettivo della migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che collega `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati del device abbinato continua a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato del gateway (vedi la configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o la CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **completa API del gateway** (stato, canali, modelli, chat,
agente, sessioni, node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo Bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

---
read_when:
    - Implementazione o aggiornamento di client WS del Gateway
    - Debug di mismatch del protocollo o errori di connessione
    - Rigenerazione di schema/modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versioning'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-23T08:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocollo Gateway (WebSocket)

Il protocollo WS del Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, web UI, app macOS, node iOS/Android, node headless)
si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell’handshake.

## Trasporto

- WebSocket, frame testuali con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  frame in ingresso sovradimensionati e buffer in uscita lenti emettono eventi
  `payload.large` prima che il Gateway chiuda o scarti il frame interessato. Questi eventi mantengono
  dimensioni, limiti, superfici e codici motivo sicuri. Non mantengono il corpo del messaggio,
  il contenuto degli allegati, il corpo raw del frame, token, cookie o valori segreti.

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

`server`, `features`, `snapshot` e `policy` sono tutti obbligatori secondo lo schema
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` è facoltativo. `auth`
riporta il ruolo/gli ambiti negoziati quando disponibili e include `deviceToken`
quando il Gateway ne emette uno.

Quando non viene emesso alcun token dispositivo, `hello-ok.auth` può comunque riportare i
permessi negoziati:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Durante un trusted bootstrap handoff, `hello-ok.auth` può anche includere voci di ruolo
aggiuntive delimitate in `deviceTokens`:

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

Per il flusso di bootstrap integrato node/operator, il token node principale resta
`scopes: []` e ogni token operator passato resta delimitato all’allowlist operator del bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli di ambito bootstrap restano
con prefisso di ruolo: le voci operator soddisfano solo richieste operator e i ruoli non-operator
continuano a richiedere ambiti con il proprio prefisso di ruolo.

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
- `node` = host di capability (camera/screen/canvas/system.run).

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

I metodi RPC Gateway registrati dai plugin possono richiedere un proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

L’ambito del metodo è solo la prima barriera. Alcuni slash command raggiunti tramite
`chat.send` applicano controlli a livello di comando più restrittivi in aggiunta. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di ambito aggiuntivo in fase di approvazione oltre al
normale ambito del metodo:

- richieste senza comandi: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

I node dichiarano le capability claim al momento della connessione:

- `caps`: categorie di capability di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad es. `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **claim** e applica allowlist lato server.

## Presence

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presence includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una singola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.

## Ambito degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti dagli ambiti così le sessioni con solo ambito pairing o solo node non ricevono passivamente contenuto di sessione.

- **Frame chat, agent e tool-result** (inclusi eventi `agent` in streaming e risultati di tool call) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- I **broadcast `plugin.*` definiti dal plugin** sono protetti da `operator.write` o `operator.admin`, a seconda di come il plugin li ha registrati.
- Gli **eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni così lo stato di salute del trasporto resta osservabile da ogni sessione autenticata.
- Le **famiglie di eventi broadcast sconosciute** sono protette dagli ambiti per impostazione predefinita (fail-closed) a meno che un handler registrato non le renda esplicitamente meno restrittive.

Ogni connessione client mantiene il proprio numero di sequenza per-client così i broadcast preservano l’ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi del flusso eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

Questa pagina non è un dump completo generato, ma la superficie WS pubblica è più ampia
dei soli esempi di handshake/autenticazione sopra. Queste sono oggi le principali famiglie di metodi che il
Gateway espone.

`hello-ok.features.methods` è un elenco conservativo di discovery costruito da
`src/gateway/server-methods-list.ts` più gli export di metodi caricati da plugin/canali.
Trattalo come discovery di funzionalità, non come dump generato di ogni helper invocabile
implementato in `src/gateway/server-methods/*.ts`.

### Sistema e identità

- `health` restituisce lo snapshot dello stato di salute del Gateway in cache o appena verificato.
- `diagnostics.stability` restituisce il recorder limitato recente della stabilità diagnostica.
  Mantiene metadati operativi come nomi evento, conteggi, dimensioni in byte,
  letture di memoria, stato di code/sessioni, nomi canali/plugin e ID sessione.
  Non mantiene testo chat, corpi webhook, output dei tool, corpi raw di richieste o
  risposte, token, cookie o valori segreti. È richiesto l’ambito operator read.
- `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono
  inclusi solo per client operator con ambito admin.
- `gateway.identity.get` restituisce l’identità dispositivo del Gateway usata dai flussi di relay e
  pairing.
- `system-presence` restituisce lo snapshot di presence corrente per i dispositivi
  operator/node connessi.
- `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto
  di presence.
- `last-heartbeat` restituisce l’ultimo evento Heartbeat persistito.
- `set-heartbeats` attiva/disattiva l’elaborazione Heartbeat sul Gateway.

### Modelli e utilizzo

- `models.list` restituisce il catalogo dei modelli consentiti a runtime.
- `usage.status` restituisce riepiloghi delle finestre di utilizzo del provider/quota residua.
- `usage.cost` restituisce riepiloghi aggregati dei costi per un intervallo di date.
- `doctor.memory.status` restituisce la disponibilità vector-memory / embedding per il
  workspace agente predefinito attivo.
- `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
- `sessions.usage.timeseries` restituisce una serie temporale di utilizzo per una sessione.
- `sessions.usage.logs` restituisce voci del log di utilizzo per una sessione.

### Canali e helper di login

- `channels.status` restituisce riepiloghi di stato di canali/plugin integrati + bundled.
- `channels.logout` esegue il logout da uno specifico canale/account dove il canale
  supporta il logout.
- `web.login.start` avvia un flusso di login QR/web per l’attuale provider di
  canale web con supporto QR.
- `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il
  canale in caso di successo.
- `push.test` invia una push APNs di test a un node iOS registrato.
- `voicewake.get` restituisce i trigger wake-word memorizzati.
- `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

### Messaggistica e log

- `send` è l’RPC diretto di consegna in uscita per invii indirizzati a canale/account/thread
  al di fuori del runner chat.
- `logs.tail` restituisce la coda del file di log del Gateway configurato con controlli di cursore/limite e
  massimo byte.

### Talk e TTS

- `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets`
  richiede `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per client
  WebChat/Control UI.
- `talk.speak` sintetizza voce tramite il provider speech Talk attivo.
- `tts.status` restituisce stato abilitato TTS, provider attivo, provider di fallback
  e stato della configurazione provider.
- `tts.providers` restituisce l’inventario visibile dei provider TTS.
- `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
- `tts.setProvider` aggiorna il provider TTS preferito.
- `tts.convert` esegue una conversione text-to-speech one-shot.

### Secret, configurazione, aggiornamento e wizard

- `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei secret a runtime
  solo in caso di successo completo.
- `secrets.resolve` risolve le assegnazioni di secret destinate ai comandi per uno specifico
  insieme comando/target.
- `config.get` restituisce lo snapshot della configurazione corrente e il relativo hash.
- `config.set` scrive un payload di configurazione validato.
- `config.patch` unisce un aggiornamento parziale della configurazione.
- `config.apply` valida + sostituisce l’intero payload di configurazione.
- `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e
  dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi
  i metadati dello schema di plugin + canale quando il runtime può caricarli. Lo schema
  include metadati dei campi `title` / `description` derivati dalle stesse etichette
  e dallo stesso testo di aiuto usati dalla UI, incluse diramazioni annidate di oggetti,
  wildcard, elementi di array e composizioni `anyOf` / `oneOf` / `allOf` quando esiste
  documentazione corrispondente del campo.
- `config.schema.lookup` restituisce un payload di lookup limitato a un percorso per un singolo
  percorso di configurazione: percorso normalizzato, nodo schema superficiale, hint corrispondente + `hintPath` e
  riepiloghi immediati dei figli per drill-down UI/CLI.
  - I nodi schema del lookup mantengono la documentazione visibile all’utente e i comuni campi di validazione:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limiti numerici/stringa/array/oggetto e flag booleani come
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`,
    `hasChildren`, più `hint` / `hintPath` corrispondenti.
- `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando
  l’aggiornamento stesso è riuscito.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la
  procedura guidata di onboarding tramite WS RPC.

### Famiglie principali esistenti

#### Helper per agenti e workspace

- `agents.list` restituisce le voci degli agenti configurati.
- `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e
  il wiring del workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i
  file del workspace bootstrap esposti per un agente.
- `agent.identity.get` restituisce l’identità effettiva dell’assistente per un agente o
  una sessione.
- `agent.wait` attende il completamento di un run e restituisce lo snapshot finale quando
  disponibile.

#### Controllo sessione

- `sessions.list` restituisce l’indice delle sessioni correnti.
- `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano
  le sottoscrizioni agli eventi di modifica delle sessioni per il client WS corrente.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano
  le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
- `sessions.preview` restituisce anteprime limitate della trascrizione per specifiche
  chiavi di sessione.
- `sessions.resolve` risolve o canonizza un target di sessione.
- `sessions.create` crea una nuova voce di sessione.
- `sessions.send` invia un messaggio in una sessione esistente.
- `sessions.steer` è la variante interrupt-and-steer per una sessione attiva.
- `sessions.abort` interrompe il lavoro attivo per una sessione.
- `sessions.patch` aggiorna metadati/override della sessione.
- `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono
  manutenzione della sessione.
- `sessions.get` restituisce la riga completa della sessione memorizzata.
- l’esecuzione della chat continua a usare `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono
  rimossi dal testo visibile, i payload XML di tool-call in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi di tool-call troncati) e i token di controllo del modello leaked ASCII/full-width
  vengono rimossi, le righe assistant composte solo da silent-token come `NO_REPLY` /
  `no_reply` esatti vengono omesse e le righe sovradimensionate possono essere sostituite con segnaposto.

#### Pairing dei dispositivi e token dispositivo

- `device.pair.list` restituisce dispositivi associati in attesa e approvati.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono
  i record di pairing dei dispositivi.
- `device.token.rotate` ruota un token di dispositivo associato entro i limiti approvati di ruolo
  e ambito.
- `device.token.revoke` revoca un token di dispositivo associato.

#### Pairing node, invoke e lavoro in attesa

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` coprono il pairing node e la verifica
  bootstrap.
- `node.list` e `node.describe` restituiscono lo stato noto/connesso dei node.
- `node.rename` aggiorna un’etichetta di node associato.
- `node.invoke` inoltra un comando a un node connesso.
- `node.invoke.result` restituisce il risultato di una richiesta invoke.
- `node.event` trasporta nel Gateway eventi originati dal node.
- `node.canvas.capability.refresh` aggiorna token di capability canvas con ambito limitato.
- `node.pending.pull` e `node.pending.ack` sono le API di coda del node connesso.
- `node.pending.enqueue` e `node.pending.drain` gestiscono lavoro durevole in attesa
  per node offline/disconnessi.

#### Famiglie di approvazione

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e
  `exec.approval.resolve` coprono richieste di approvazione exec one-shot più
  lookup/replay delle approvazioni in attesa.
- `exec.approval.waitDecision` attende una decisione su una singola approvazione exec in attesa e restituisce
  la decisione finale (o `null` in caso di timeout).
- `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec
  del Gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy exec
  di approvazione locale del node tramite comandi relay del node.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono
  i flussi di approvazione definiti dai plugin.

#### Altre famiglie principali

- automazione:
  - `wake` pianifica un’iniezione di testo wake immediata o al prossimo Heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Famiglie comuni di eventi

- `chat`: aggiornamenti chat UI come `chat.inject` e altri
  eventi chat solo-trascrizione.
- `session.message` e `session.tool`: aggiornamenti di trascrizione/event-stream per una
  sessione sottoscritta.
- `sessions.changed`: l’indice delle sessioni o i metadati sono cambiati.
- `presence`: aggiornamenti dello snapshot di presence del sistema.
- `tick`: evento periodico keepalive / liveness.
- `health`: aggiornamento dello snapshot dello stato di salute del Gateway.
- `heartbeat`: aggiornamento del flusso eventi Heartbeat.
- `cron`: evento di modifica di run/job Cron.
- `shutdown`: notifica di spegnimento del Gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita del pairing node.
- `node.invoke.request`: broadcast di richiesta invoke del node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: la configurazione del trigger wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell’approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell’approvazione del plugin.

### Metodi helper node

- I node possono chiamare `skills.bins` per recuperare l’elenco corrente degli eseguibili delle Skills
  per i controlli auto-allow.

### Metodi helper operator

- Gli operator possono chiamare `commands.list` (`operator.read`) per recuperare l’inventario dei comandi a runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell’agente predefinito.
  - `scope` controlla quale superficie il `name` primario usa come target:
    - `text` restituisce il token del comando testuale primario senza lo `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influenza solo la denominazione nativa più la disponibilità dei
    comandi plugin nativi.
  - `includeArgs=false` omette i metadati degli argomenti serializzati dalla risposta.
- Gli operator possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo strumenti a runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: se uno strumento del plugin è facoltativo
- Gli operator possono chiamare `tools.effective` (`operator.read`) per recuperare l’inventario degli strumenti effettivi a runtime
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto runtime attendibile lato server dalla sessione invece di accettare
    autenticazione o contesto di consegna forniti dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, plugin e canale.
- Gli operator possono chiamare `skills.status` (`operator.read`) per recuperare l’inventario visibile delle
  Skills per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell’agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanitizzate senza esporre valori secret raw.
- Gli operator possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  metadati di discovery di ClawHub.
- Gli operator possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella Skill nella directory `skills/` del workspace dell’agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un’azione dichiarata `metadata.openclaw.install` sull’host Gateway.
- Gli operator possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel
    workspace dell’agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il Gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede l’ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l’approvazione, le chiamate inoltrate `node.invoke system.run` riusano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra la preparazione e l’inoltro finale approvato di `system.run`, il
  Gateway rifiuta l’esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna agent

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene un comportamento rigoroso: target di consegna non risolti o solo interni restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback a esecuzione solo di sessione quando non è possibile risolvere alcuna route esterna consegnabile (per esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versioning

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta i mismatch.
- Schema + modelli sono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili nel protocollo v3 e costituiscono la baseline attesa per client di terze parti.

| Costante                                  | Predefinito                                           | Sorgente                                                   |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout preauth / connect-challenge       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff iniziale di riconnessione         | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Clamp fast-retry dopo chiusura device-token | `250` ms                                            | `src/gateway/client.ts`                                    |
| Grace di arresto forzato prima di `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                    |
| Chiusura per tick-timeout                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Il server pubblicizza i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes` in `hello-ok`; i client dovrebbero rispettare questi valori
piuttosto che i valori predefiniti pre-handshake.

## Autenticazione

- L’autenticazione Gateway con secret condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Modalità con identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non-loopback, soddisfano il controllo di autenticazione connect dai
  request header invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` su ingress privato salta completamente l’autenticazione connect con secret condiviso; non esporre questa modalità su ingress pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **device token** limitato al ruolo + agli ambiti della connessione.
  Viene restituito in `hello-ok.auth.deviceToken` e il client dovrebbe
  persisterlo per connessioni future.
- I client dovrebbero persistere il `hello-ok.auth.deviceToken` principale dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel **device token memorizzato** dovrebbe anche riusare l’insieme di
  ambiti approvati memorizzato per quel token. Questo preserva l’accesso di lettura/probe/stato
  già concesso ed evita che le riconnessioni collassino silenziosamente in un
  ambito implicito più ristretto riservato agli admin.
- Assemblaggio lato client dell’autenticazione connect (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi `deviceToken` esplicito, poi token per-dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuna delle opzioni sopra ha risolto un
    `auth.token`. Un token condiviso o qualsiasi device token risolto lo sopprime.
  - La promozione automatica di un device token memorizzato nel retry one-shot di
    `AUTH_TOKEN_MISMATCH` è limitata **solo agli endpoint attendibili** —
    loopback, oppure `wss://` con `tlsFingerprint` fissato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di bootstrap handoff.
  Persistile solo quando la connessione ha usato autenticazione bootstrap su un trasporto attendibile
  come `wss://` o loopback/local pairing.
- Se un client fornisce un `deviceToken` **esplicito** o ambiti `scopes` espliciti, quell’insieme di ambiti
  richiesto dal chiamante resta autorevole; gli ambiti in cache vengono riusati solo
  quando il client sta riusando il token per-dispositivo memorizzato.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede ambito `operator.pairing`).
- L’emissione/rotazione dei token resta limitata all’insieme di ruoli approvati registrato
  nella voce di pairing di quel dispositivo; ruotare un token non può espandere il dispositivo a un
  ruolo che l’approvazione di pairing non ha mai concesso.
- Per le sessioni con token di dispositivo associato, la gestione del dispositivo è limitata a sé stessi a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo **la propria** voce dispositivo.
- `device.token.rotate` controlla anche l’insieme di ambiti operator richiesto rispetto agli
  ambiti della sessione corrente del chiamante. I chiamanti non admin non possono ruotare un token in
  un insieme di ambiti operator più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry delimitato con un token per-dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero fermare i loop di riconnessione automatica e mostrare istruzioni di intervento all’operator.

## Identità dispositivo + pairing

- I node dovrebbero includere un’identità dispositivo stabile (`device.id`) derivata da una
  fingerprint della coppia di chiavi.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi `device.id`, a meno che l’auto-approvazione locale
  non sia abilitata.
- L’auto-approvazione del pairing è centrata su connessioni loopback locali dirette.
- OpenClaw ha anche uno stretto percorso self-connect backend/container-local per flussi helper con secret condiviso attendibili.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l’identità `device` durante `connect` (operator + node).
  Control UI può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP insicura solo localhost.
  - autenticazione operator Control UI riuscita con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade di sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell’autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori comuni di migrazione:

| Messaggio                   | details.code                     | details.reason           | Significato                                         |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o l’ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dal skew consentito.   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione della chiave pubblica è fallito. |

Target di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che lega `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` continuano a essere accettate per compatibilità, ma il pinning dei
  metadati del dispositivo associato continua a controllare la policy dei comandi in riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato Gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API completa del Gateway** (stato, canali, modelli, chat,
agent, sessioni, node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

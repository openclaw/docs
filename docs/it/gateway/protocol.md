---
read_when:
    - Implementazione o aggiornamento di client WS del gateway
    - Debug di incompatibilità del protocollo o errori di connessione
    - Rigenerazione di schemi/modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versioning'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-05T13:53:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c37f5b686562dda3ba3516ac6982ad87b2f01d8148233284e9917099c6e96d87
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocollo Gateway (WebSocket)

Il protocollo WS del Gateway è l'**unico control plane + trasporto dei nodi** per
OpenClaw. Tutti i client (CLI, UI web, app macOS, nodi iOS/Android, nodi headless)
si connettono tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.

## Handshake (`connect`)

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
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

Durante il passaggio trusted bootstrap, `hello-ok.auth` può includere anche
voci di ruolo aggiuntive limitate in `deviceTokens`:

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

Per il flusso bootstrap integrato node/operator, il token del nodo primario resta
`scopes: []` e qualsiasi token operatore trasferito resta limitato alla
allowlist bootstrap dell'operatore (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli di ambito bootstrap restano
con prefisso di ruolo: le voci operatore soddisfano solo richieste operatore, e i ruoli non operatore
continuano a richiedere ambiti sotto il proprio prefisso di ruolo.

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

### Ruoli

- `operator` = client del control plane (CLI/UI/automazione).
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

I metodi RPC del gateway registrati dai plugin possono richiedere il proprio ambito operatore, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti come `operator.admin`.

L'ambito del metodo è solo il primo controllo. Alcuni slash command raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di ambito aggiuntivo al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi del nodo diversi da exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

I nodi dichiarano le richieste di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: interruttori granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway tratta questi come **dichiarazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una sola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.

## Famiglie di metodi RPC comuni

Questa pagina non è un dump completo generato, ma la superficie WS pubblica è più ampia
rispetto agli esempi di handshake/auth sopra. Queste sono le principali famiglie di metodi che
il Gateway espone oggi.

`hello-ok.features.methods` è un elenco di rilevamento conservativo costruito da
`src/gateway/server-methods-list.ts` più le esportazioni dei metodi di plugin/canali caricati.
Trattalo come rilevamento di funzionalità, non come un dump generato di ogni helper richiamabile
implementato in `src/gateway/server-methods/*.ts`.

### Sistema e identità

- `health` restituisce lo snapshot di salute del gateway memorizzato nella cache o appena sondato.
- `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono
  inclusi solo per client operator con ambito admin.
- `gateway.identity.get` restituisce l'identità del dispositivo gateway usata dai flussi di relay e
  pairing.
- `system-presence` restituisce lo snapshot di presenza corrente per i dispositivi
  operator/node connessi.
- `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto
  di presenza.
- `last-heartbeat` restituisce l'ultimo evento heartbeat persistito.
- `set-heartbeats` abilita/disabilita l'elaborazione heartbeat sul gateway.

### Modelli e utilizzo

- `models.list` restituisce il catalogo dei modelli consentiti in runtime.
- `usage.status` restituisce riepiloghi delle finestre di utilizzo dei provider/quota residua.
- `usage.cost` restituisce riepiloghi aggregati dei costi per un intervallo di date.
- `doctor.memory.status` restituisce lo stato di prontezza di vector-memory / embedding per il
  workspace dell'agente predefinito attivo.
- `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
- `sessions.usage.timeseries` restituisce serie temporali di utilizzo per una sessione.
- `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

### Canali e helper di login

- `channels.status` restituisce riepiloghi di stato di canali/plugin integrati + inclusi.
- `channels.logout` esegue il logout di uno specifico canale/account dove il canale
  supporta il logout.
- `web.login.start` avvia un flusso di login QR/web per l'attuale provider
  di canale web con supporto QR.
- `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il
  canale in caso di successo.
- `push.test` invia un push APNs di test a un nodo iOS registrato.
- `voicewake.get` restituisce i trigger wake-word memorizzati.
- `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

### Messaggistica e log

- `send` è l'RPC diretto di consegna in uscita per invii mirati a
  canale/account/thread al di fuori del chat runner.
- `logs.tail` restituisce la coda del file di log del gateway configurato con controlli di cursore/limite e
  byte massimi.

### Talk e TTS

- `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets`
  richiede `operator.talk.secrets` (o `operator.admin`).
- `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client
  WebChat/Control UI.
- `talk.speak` sintetizza voce tramite il provider speech Talk attivo.
- `tts.status` restituisce lo stato abilitato TTS, il provider attivo, i provider di fallback
  e lo stato della configurazione del provider.
- `tts.providers` restituisce l'inventario visibile dei provider TTS.
- `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
- `tts.setProvider` aggiorna il provider TTS preferito.
- `tts.convert` esegue una conversione text-to-speech una tantum.

### Secrets, config, update e wizard

- `secrets.reload` ririsolve i SecretRef attivi e sostituisce lo stato dei segreti in runtime
  solo in caso di successo completo.
- `secrets.resolve` risolve le assegnazioni dei segreti destinati ai comandi per uno specifico
  insieme di comando/destinazione.
- `config.get` restituisce lo snapshot e l'hash della configurazione corrente.
- `config.set` scrive un payload di configurazione convalidato.
- `config.patch` unisce un aggiornamento parziale della configurazione.
- `config.apply` convalida + sostituisce l'intero payload della configurazione.
- `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e
  dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi
  i metadati di schema di plugin + canali quando il runtime può caricarli. Lo schema
  include metadati dei campi `title` / `description` derivati dalle stesse etichette
  e dallo stesso testo di aiuto usati dalla UI, incluse ramificazioni di composizione per oggetti annidati, wildcard, elementi di array
  e `anyOf` / `oneOf` / `allOf` quando esiste documentazione dei campi corrispondente.
- `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione:
  percorso normalizzato, un nodo di schema superficiale, hint corrispondente + `hintPath`, e
  riepiloghi dei figli immediati per il drill-down UI/CLI.
  - I nodi di schema di lookup mantengono la documentazione rivolta all'utente e i campi di validazione comuni:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    limiti numerici/stringa/array/oggetto e flag booleani come
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - I riepiloghi figli espongono `key`, `path` normalizzato, `type`, `required`,
    `hasChildren`, più `hint` / `hintPath` corrispondenti.
- `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando
  l'aggiornamento stesso è riuscito.
- `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono il
  wizard di onboarding tramite WS RPC.

### Famiglie principali esistenti

#### Helper di agente e workspace

- `agents.list` restituisce le voci agente configurate.
- `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e
  il wiring del workspace.
- `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i
  file bootstrap del workspace esposti per un agente.
- `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o
  una sessione.
- `agent.wait` attende il termine di un'esecuzione e restituisce lo snapshot terminale quando
  disponibile.

#### Controllo delle sessioni

- `sessions.list` restituisce l'indice corrente delle sessioni.
- `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano
  le sottoscrizioni agli eventi di modifica delle sessioni per l'attuale client WS.
- `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano
  le sottoscrizioni agli eventi di trascrizione/messaggi per una sessione.
- `sessions.preview` restituisce anteprime limitate della trascrizione per specifiche chiavi di sessione.
- `sessions.resolve` risolve o canonizza una destinazione di sessione.
- `sessions.create` crea una nuova voce di sessione.
- `sessions.send` invia un messaggio in una sessione esistente.
- `sessions.steer` è la variante interrupt-and-steer per una sessione attiva.
- `sessions.abort` interrompe il lavoro attivo per una sessione.
- `sessions.patch` aggiorna metadati/override di sessione.
- `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono
  manutenzione della sessione.
- `sessions.get` restituisce l'intera riga di sessione memorizzata.
- l'esecuzione chat continua a usare `chat.history`, `chat.send`, `chat.abort` e
  `chat.inject`.
- `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono
  rimossi dal testo visibile, i payload XML delle chiamate agli strumenti in testo semplice (inclusi
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocchi di chiamata agli strumenti troncati) e i token di controllo del modello ASCII/a larghezza piena trapelati
  vengono rimossi, le righe assistant costituite solo da token silenziosi come `NO_REPLY` /
  `no_reply` esatti vengono omesse e le righe sovradimensionate possono essere sostituite con segnaposto.

#### Pairing dei dispositivi e token dispositivo

- `device.pair.list` restituisce i dispositivi associati in attesa e approvati.
- `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono
  i record di associazione dei dispositivi.
- `device.token.rotate` ruota un token dispositivo associato entro i limiti di ruolo
  e ambiti approvati.
- `device.token.revoke` revoca un token dispositivo associato.

#### Pairing dei nodi, invoke e lavoro in sospeso

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` e `node.pair.verify` coprono pairing dei nodi e verifica
  bootstrap.
- `node.list` e `node.describe` restituiscono lo stato dei nodi noti/connessi.
- `node.rename` aggiorna un'etichetta di nodo associato.
- `node.invoke` inoltra un comando a un nodo connesso.
- `node.invoke.result` restituisce il risultato di una richiesta invoke.
- `node.event` trasporta gli eventi originati dal nodo nel gateway.
- `node.canvas.capability.refresh` aggiorna i token di capacità canvas con ambito definito.
- `node.pending.pull` e `node.pending.ack` sono le API di coda del nodo connesso.
- `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole
  per nodi offline/disconnessi.

#### Famiglie di approvazione

- `exec.approval.request` e `exec.approval.resolve` coprono richieste
  di approvazione exec una tantum.
- `exec.approval.waitDecision` attende una decisione su un'approvazione exec in sospeso e restituisce
  la decisione finale (o `null` in caso di timeout).
- `exec.approvals.get` e `exec.approvals.set` gestiscono gli snapshot della policy di approvazione exec del gateway.
- `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy locale exec del nodo
  tramite comandi relay del nodo.
- `plugin.approval.request`, `plugin.approval.waitDecision` e
  `plugin.approval.resolve` coprono i flussi di approvazione definiti dai plugin.

#### Altre famiglie principali

- automazione:
  - `wake` pianifica un'iniezione di testo wake immediata o al prossimo heartbeat
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- skills/tools: `skills.*`, `tools.catalog`, `tools.effective`

### Famiglie di eventi comuni

- `chat`: aggiornamenti chat UI come `chat.inject` e altri eventi chat
  solo trascrizione.
- `session.message` e `session.tool`: aggiornamenti di trascrizione/stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: l'indice sessione o i metadati sono cambiati.
- `presence`: aggiornamenti dello snapshot di presenza del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di salute del gateway.
- `heartbeat`: aggiornamento dello stream di eventi heartbeat.
- `cron`: evento di modifica di esecuzione/job cron.
- `shutdown`: notifica di arresto del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita del pairing del nodo.
- `node.invoke.request`: trasmissione di una richiesta invoke del nodo.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: la configurazione dei trigger wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione del plugin.

### Metodi helper del nodo

- I nodi possono chiamare `skills.bins` per ottenere l'elenco corrente degli eseguibili
  delle skill per i controlli di auto-allow.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per ottenere il catalogo degli strumenti in runtime per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per ottenere l'inventario effettivo degli strumenti in runtime
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway ricava lato server il contesto runtime attendibile dalla sessione invece di accettare
    autenticazione o contesto di consegna forniti dal chiamante.
  - La risposta ha ambito di sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, plugin e canali.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per ottenere l'inventario visibile
  delle skill per un agente.
  - `agentId` è facoltativo; omettendolo si legge il workspace dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di discovery di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella skill nella directory `skills/` del workspace dell'agente predefinito.
  - modalità installer del gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione `metadata.openclaw.install` dichiarata sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - la modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel
    workspace dell'agente predefinito.
  - la modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel
  `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra prepare e l'inoltro finale approvato `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: destinazioni di consegna irrisolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo sessione quando non è possibile risolvere alcuna route consegnabile esterna (ad esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versioning

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi + modelli sono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- L'autenticazione gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità auth configurata.
- Le modalità con identità come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non loopback soddisfano il controllo auth di connect dagli
  header della richiesta invece che da `connect.params.auth.*`.
- La modalità private-ingress `gateway.auth.mode: "none"` salta completamente l'autenticazione connect con segreto condiviso; non esporre tale modalità su ingress pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **token dispositivo** con ambito definito per ruolo + ambiti della connessione. Viene restituito in `hello-ok.auth.deviceToken` e deve essere
  persistito dal client per le connessioni future.
- I client devono persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** dovrebbe anche riutilizzare l'insieme di ambiti approvati memorizzato per quel token. Questo preserva l'accesso read/probe/status
  già concesso ed evita di restringere silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo admin.
- La normale precedenza auth di connect è prima token/password condivisi espliciti, poi
  `deviceToken` esplicito, poi token per dispositivo memorizzato, poi token bootstrap.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di handoff bootstrap.
  Persistile solo quando la connessione ha usato auth bootstrap su un trasporto attendibile
  come `wss://` o loopback/pairing locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme di ambiti richiesto dal chiamante rimane autorevole; gli ambiti memorizzati vengono riutilizzati solo quando il client riusa il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- L'emissione/rotazione dei token resta limitata all'insieme di ruoli approvati registrato nella
  voce di pairing di quel dispositivo; la rotazione di un token non può espandere il dispositivo in un
  ruolo che l'approvazione del pairing non ha mai concesso.
- Per le sessioni di token dei dispositivi associati, la gestione del dispositivo ha ambito autonomo a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non admin possono rimuovere/revocare/ruotare
  solo la **propria** voce del dispositivo.
- `device.token.rotate` controlla anche l'insieme di ambiti operatore richiesto rispetto agli
  ambiti della sessione corrente del chiamante. I chiamanti non admin non possono ruotare un token verso
  un insieme di ambiti operatore più ampio di quello che già possiedono.
- Gli errori auth includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client devono interrompere i loop automatici di riconnessione e mostrare indicazioni di azione all'operatore.

## Identità del dispositivo + pairing

- I nodi devono includere un'identità di dispositivo stabile (`device.id`) derivata dall'impronta digitale
  di una coppia di chiavi.
- I gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo, a meno che l'approvazione automatica locale
  non sia abilitata.
- L'approvazione automatica del pairing è centrata sulle connessioni dirette loopback locali.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-local per flussi helper con segreto condiviso attendibili.
- Le connessioni tailnet o LAN sullo stesso host sono comunque trattate come remote per il pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l'identità `device` durante `connect` (operator + node).
  La Control UI può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità con HTTP insicuro solo localhost.
  - autenticazione riuscita della Control UI operator con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave downgrade della sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica della migrazione auth del dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                    | details.code                     | details.reason           | Significato                                         |
| ---------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde all'impronta del public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Il formato/canonicalizzazione del public key non è riuscito. |

Obiettivo della migrazione:

- Attendere sempre `connect.challenge`.
- Firmare il payload v2 che include il nonce del server.
- Inviare lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi device/client/role/scopes/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo associato continua a controllare la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente eseguire il pinning dell'impronta del certificato del gateway (vedi configurazione `gateway.tls` più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**intera API gateway** (status, canali, modelli, chat,
agent, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

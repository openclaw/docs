---
read_when:
    - Implementazione o aggiornamento di client WS del gateway
    - Debug di mismatch del protocollo o errori di connessione
    - Rigenerazione di schema/modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: handshake, frame, versioning'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-04-24T08:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf6710cb1c620dc03b75421cab7953c412cb85e68c52fa9b504ea89b7302efb8
    source_path: gateway/protocol.md
    workflow: 15
---

# Protocollo Gateway (WebSocket)

Il protocollo WS del Gateway è il **singolo control plane + trasporto node** per
OpenClaw. Tutti i client (CLI, interfaccia web, app macOS, node iOS/Android, node
headless) si collegano tramite WebSocket e dichiarano il proprio **ruolo** + **ambito** al
momento dell'handshake.

## Trasporto

- WebSocket, frame di testo con payload JSON.
- Il primo frame **deve** essere una richiesta `connect`.
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  devono seguire i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer lenti in uscita emettono eventi `payload.large`
  prima che il gateway chiuda o scarti il frame interessato. Questi eventi mantengono
  dimensioni, limiti, superfici e codici di motivo sicuri. Non mantengono il corpo del messaggio,
  il contenuto degli allegati, il corpo grezzo del frame, token, cookie o valori segreti.

## Handshake (`connect`)

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
riporta ruolo/ambiti negoziati quando disponibili e include `deviceToken`
quando il gateway ne emette uno.

Quando non viene emesso alcun device token, `hello-ok.auth` può comunque riportare i permessi
negoziati:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Durante il trasferimento bootstrap trusted, `hello-ok.auth` può anche includere ulteriori
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

Per il flusso bootstrap node/operator integrato, il token principale del Node resta
`scopes: []` e qualsiasi token operatore trasferito resta limitato alla allowlist
bootstrap dell'operatore (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti bootstrap restano
con prefisso di ruolo: le voci operatore soddisfano solo richieste operatore, e i ruoli non operatore
richiedono comunque ambiti sotto il proprio prefisso di ruolo.

### Esempio Node

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
- `node` = host delle capacità (camera/schermo/canvas/system.run).

### Ambiti (`operator`)

Ambiti comuni:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` con `includeSecrets: true` richiede `operator.talk.secrets`
(o `operator.admin`).

I metodi RPC Gateway registrati da Plugin possono richiedere un proprio ambito operatore, ma
i prefissi amministrativi core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) vengono sempre risolti in `operator.admin`.

L'ambito del metodo è solo il primo gate. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli a livello di comando più severi. Ad esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo di ambito aggiuntivo al momento dell'approvazione oltre
all'ambito base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi Node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

I Node dichiarano claim di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: toggle granulari (ad esempio `screen.record`, `camera.capture`).

Il Gateway tratta questi elementi come **claim** e applica allowlist lato server.

## Presence

- `system-presence` restituisce voci indicizzate per identità del dispositivo.
- Le voci di presence includono `deviceId`, `roles` e `scopes`, così le UI possono mostrare una singola riga per dispositivo
  anche quando si collega sia come **operator** sia come **node**.

## Scoping degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono protetti da ambito, in modo che le sessioni con ambito pairing o solo-node non ricevano passivamente contenuto di sessione.

- **Frame chat, agent e tool-result** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti da Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni in modo che lo stato del trasporto resti osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono limitate per ambito per impostazione predefinita (fail-closed), a meno che un gestore registrato non le rilassi esplicitamente.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano un ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi dello stream di eventi filtrati per ambito.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/auth qui sopra. Questo
non è un dump generato — `hello-ok.features.methods` è un elenco di
discovery conservativo costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi di Plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce l'istantanea di stato del gateway memorizzata in cache o appena verificata.
    - `diagnostics.stability` restituisce il recorder limitato recente di stabilità diagnostica. Mantiene metadati operativi come nomi degli eventi, conteggi, dimensioni in byte, letture della memoria, stato della coda/sessione, nomi del canale/Plugin e id sessione. Non mantiene testo della chat, corpi di Webhook, output degli strumenti, corpi grezzi di richiesta o risposta, token, cookie o valori segreti. È richiesto l'ambito di lettura operatore.
    - `status` restituisce il riepilogo del gateway in stile `/status`; i campi sensibili sono inclusi solo per client operator con ambito admin.
    - `gateway.identity.get` restituisce l'identità del dispositivo gateway usata dai flussi di relay e pairing.
    - `system-presence` restituisce l'istantanea corrente di presence per dispositivi operator/node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presence.
    - `last-heartbeat` restituisce l'ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva/disattiva l'elaborazione Heartbeat sul gateway.
  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti a runtime.
    - `usage.status` restituisce finestre di utilizzo del provider/riepiloghi della quota residua.
    - `usage.cost` restituisce riepiloghi aggregati del costo per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di prontezza di memoria vettoriale / embedding per lo spazio di lavoro attivo dell'agente predefinito.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce una serie temporale di utilizzo per una sessione.
    - `sessions.usage.logs` restituisce voci di log di utilizzo per una sessione.
  </Accordion>

  <Accordion title="Canali e helper di login">
    - `channels.status` restituisce riepiloghi di stato di canali/Plugin integrati e inclusi.
    - `channels.logout` esegue il logout di uno specifico canale/account dove il canale supporta il logout.
    - `web.login.start` avvia un flusso di login QR/web per l'attuale provider di canale web capace di QR.
    - `web.login.wait` attende il completamento di quel flusso di login QR/web e avvia il canale in caso di successo.
    - `push.test` invia una push APNs di test a un Node iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.
  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC di consegna diretta in uscita per invii mirati a canale/account/thread al di fuori del runner chat.
    - `logs.tail` restituisce la coda del file di log configurato del gateway con controlli di cursore/limite e massimo byte.
  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload effettivo di configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato corrente della modalità Talk per i client WebChat/Control UI.
    - `talk.speak` sintetizza il parlato tramite il provider di speech Talk attivo.
    - `tts.status` restituisce stato di abilitazione TTS, provider attivo, provider fallback e stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano/disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech one-shot.
  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei segreti runtime solo in caso di pieno successo.
    - `secrets.resolve` risolve le assegnazioni di segreti target del comando per uno specifico insieme comando/target.
    - `config.get` restituisce l'istantanea della configurazione corrente e il relativo hash.
    - `config.set` scrive un payload di configurazione validato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` valida + sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema della configurazione live usato da interfaccia Control e tooling CLI: schema, `uiHints`, versione e metadati di generazione, inclusi metadati di schema di Plugin + canale quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dalla UI, incluse diramazioni composte di oggetti annidati, wildcard, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione corrispondente del campo.
    - `config.schema.lookup` restituisce un payload di lookup con ambito percorso per un singolo percorso di configurazione: percorso normalizzato, nodo di schema superficiale, hint corrispondente + `hintPath` e riepiloghi dei figli immediati per drill-down UI/CLI. I nodi di schema del lookup mantengono la documentazione orientata all'utente e i campi comuni di validazione (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, più `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding tramite WS RPC.
  </Accordion>

  <Accordion title="Helper di agente e spazio di lavoro">
    - `agents.list` restituisce le voci degli agenti configurati.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il collegamento dello spazio di lavoro.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file bootstrap dello spazio di lavoro esposti per un agente.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende la fine di un'esecuzione e restituisce l'istantanea terminale quando disponibile.
  </Accordion>

  <Accordion title="Controllo delle sessioni">
    - `sessions.list` restituisce l'indice corrente delle sessioni.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di modifica della sessione per il client WS corrente.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano/disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.resolve` risolve o canonizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-dirigi per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono manutenzione della sessione.
    - `sessions.get` restituisce la riga completa della sessione memorizzata.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag di direttiva inline vengono rimossi dal testo visibile, i payload XML di testo semplice delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamata agli strumenti troncati) e i token di controllo del modello ASCII/full-width trapelati vengono rimossi, le righe assistant composte solo da token silenziosi come `NO_REPLY` / `no_reply` esatti vengono omesse e le righe sovradimensionate possono essere sostituite con segnaposto.
  </Accordion>

  <Accordion title="Pairing dei dispositivi e token dei dispositivi">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di pairing dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti di ruolo e ambito approvati.
    - `device.token.revoke` revoca un token di dispositivo associato.
  </Accordion>

  <Accordion title="Pairing dei Node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` e `node.pair.verify` coprono pairing dei Node e verifica del bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei Node noti/connessi.
    - `node.rename` aggiorna un'etichetta di Node associato.
    - `node.invoke` inoltra un comando a un Node connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta invoke.
    - `node.event` trasporta eventi originati dal Node di nuovo nel gateway.
    - `node.canvas.capability.refresh` aggiorna i token delle capacità canvas con ambito.
    - `node.pending.pull` e `node.pending.ack` sono le API della coda dei Node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro in sospeso durevole per Node offline/disconnessi.
  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono richieste una tantum di approvazione exec più lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una singola approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono le istantanee del criterio di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono il criterio di approvazione exec locale del Node tramite comandi relay Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai Plugin.
  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione di testo wake immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti chat UI come `chat.inject` e altri eventi chat
  solo-trascrizione.
- `session.message` e `session.tool`: aggiornamenti della trascrizione/dello stream di eventi per una
  sessione sottoscritta.
- `sessions.changed`: l'indice delle sessioni o i metadati sono cambiati.
- `presence`: aggiornamenti dell'istantanea di presence del sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dell'istantanea di stato del gateway.
- `heartbeat`: aggiornamento dello stream di eventi Heartbeat.
- `cron`: evento di modifica esecuzione/job Cron.
- `shutdown`: notifica di spegnimento del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita del pairing dei Node.
- `node.invoke.request`: broadcast della richiesta invoke del Node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: la configurazione del trigger della wake-word è cambiata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione del Plugin.

### Metodi helper del Node

- I Node possono chiamare `skills.bins` per recuperare l'elenco corrente degli eseguibili delle skill
  per i controlli di auto-allow.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l'inventario runtime
  dei comandi per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - `scope` controlla quale superficie usa il `name` primario:
    - `text` restituisce il token del comando testuale primario senza lo `/` iniziale
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider
      quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa più sulla disponibilità dei comandi nativi del Plugin.
  - `includeArgs=false` omette dal response i metadati serializzati degli argomenti.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo runtime degli strumenti per un
  agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del Plugin quando `source="plugin"`
  - `optional`: indica se uno strumento del Plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l'inventario runtime effettivo degli strumenti
  per una sessione.
  - `sessionKey` è obbligatorio.
  - Il gateway deriva il contesto runtime attendibile dal lato server della sessione invece di accettare
    contesto auth o di consegna fornito dal chiamante.
  - La risposta ha ambito sessione e riflette ciò che la conversazione attiva può usare in questo momento,
    inclusi strumenti core, Plugin e canale.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l'inventario visibile
  delle Skills per un agente.
  - `agentId` è facoltativo; omettilo per leggere lo spazio di lavoro dell'agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e
    opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per
  i metadati di discovery di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una
    cartella di skill nella directory `skills/` dello spazio di lavoro dell'agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    esegue un'azione dichiarata `metadata.openclaw.install` sull'host del gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nello
    spazio di lavoro dell'agente predefinito.
  - La modalità config esegue patch dei valori `skills.entries.<skillKey>` come `enabled`,
    `apiKey` ed `env`.

## Approvazioni exec

- Quando una richiesta exec necessita di approvazione, il gateway trasmette `exec.approval.requested`.
- I client operator la risolvono chiamando `exec.approval.resolve` (richiede l'ambito `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste senza `systemRunPlan` vengono rifiutate.
- Dopo l'approvazione, le chiamate inoltrate `node.invoke system.run` riusano quel `systemRunPlan`
  canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` tra prepare e il forward finale approvato di `system.run`, il
  gateway rifiuta l'esecuzione invece di fidarsi del payload modificato.

## Fallback di consegna dell'agente

- Le richieste `agent` possono includere `deliver=true` per richiedere una consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: destinazioni di consegna non risolte o solo interne restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all'esecuzione solo-sessione quando non è possibile risolvere alcuna route esterna consegnabile (ad esempio sessioni interne/webchat o configurazioni multi-canale ambigue).

## Versioning

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta mismatch.
- Schemi + modelli vengono generati da definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti del client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono
stabili in tutto il protocollo v3 e rappresentano la baseline attesa per i client di terze parti.

| Costante | Predefinito | Sorgente |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION` | `3` | `src/gateway/protocol/schema/protocol-schemas.ts` |
| Timeout della richiesta (per RPC) | `30_000` ms | `src/gateway/client.ts` (`requestTimeoutMs`) |
| Timeout preauth / connect-challenge | `10_000` ms | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Backoff iniziale di riconnessione | `1_000` ms | `src/gateway/client.ts` (`backoffMs`) |
| Backoff massimo di riconnessione | `30_000` ms | `src/gateway/client.ts` (`scheduleReconnect`) |
| Clamp di fast-retry dopo chiusura device-token | `250` ms | `src/gateway/client.ts` |
| Grace di arresto forzato prima di `terminate()` | `250` ms | `FORCE_STOP_TERMINATE_GRACE_MS` |
| Timeout predefinito di `stopAndWait()` | `1_000` ms | `STOP_AND_WAIT_TIMEOUT_MS` |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms | `src/gateway/client.ts` |
| Chiusura per timeout tick | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts` |
| `MAX_PAYLOAD_BYTES` | `25 * 1024 * 1024` (25 MB) | `src/gateway/server-constants.ts` |

Il server pubblicizza in `hello-ok` i valori effettivi `policy.tickIntervalMs`, `policy.maxPayload`
e `policy.maxBufferedBytes`; i client dovrebbero rispettare quei valori
piuttosto che i valori predefiniti pre-handshake.

## Autenticazione

- L'autenticazione del gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità auth configurata.
- Le modalità che portano identità come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o
  `gateway.auth.mode: "trusted-proxy"` non-loopback soddisfano il controllo auth di connect tramite
  gli header della richiesta invece di `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingressi privati salta completamente l'autenticazione connect con segreto condiviso;
  non esporre quella modalità su ingressi pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **device token** con ambito ruolo + ambiti della connessione.
  Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  persistito dal client per le future connessioni.
- I client dovrebbero persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel **device token memorizzato** dovrebbe anche riutilizzare l'insieme degli ambiti approvati memorizzati per quel token. Questo preserva l'accesso read/probe/status
  già concesso ed evita che le riconnessioni si riducano silenziosamente a un
  ambito implicito più ristretto solo-admin.
- Assemblaggio auth connect lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato da
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuna delle soluzioni precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi device token risolto lo sopprime.
  - L'auto-promozione di un device token memorizzato nel retry one-shot
    `AUTH_TOKEN_MISMATCH` è limitata **solo agli endpoint attendibili** —
    loopback, oppure `wss://` con `tlsFingerprint` pinned. `wss://` pubblico
    senza pinning non è qualificato.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di trasferimento bootstrap.
  Persistili solo quando la connessione ha usato autenticazione bootstrap su un trasporto attendibile
  come `wss://` o loopback/local pairing.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme di ambiti richiesto dal chiamante resta autorevole; gli ambiti in cache vengono
  riutilizzati solo quando il client sta riusando il token per dispositivo memorizzato.
- I device token possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- L'emissione/rotazione del token resta limitata all'insieme di ruoli approvato registrato
  nella voce di pairing di quel dispositivo; la rotazione di un token non può espandere il dispositivo in un
  ruolo che l'approvazione del pairing non ha mai concesso.
- Per le sessioni con token di dispositivo associato, la gestione del dispositivo ha ambito self a meno che il
  chiamante non abbia anche `operator.admin`: i chiamanti non-admin possono rimuovere/revocare/ruotare
  solo la **propria** voce di dispositivo.
- `device.token.rotate` controlla anche l'insieme degli ambiti operatore richiesti rispetto agli
  ambiti della sessione corrente del chiamante. I chiamanti non-admin non possono ruotare un token verso
  un insieme di ambiti operatore più ampio di quello che già possiedono.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un retry limitato con un token per dispositivo in cache.
  - Se quel retry fallisce, i client dovrebbero interrompere i loop automatici di riconnessione e mostrare indicazioni per l'intervento dell'operatore.

## Identità del dispositivo + pairing

- I Node dovrebbero includere un'identità stabile del dispositivo (`device.id`) derivata da una
  fingerprint di keypair.
- I gateway emettono token per dispositivo + ruolo.
- Per nuovi id dispositivo sono richieste approvazioni di pairing, a meno che non sia abilitata l'auto-approvazione locale.
- L'auto-approvazione del pairing è centrata sulle connessioni dirette locali loopback.
- OpenClaw ha anche un percorso ristretto di self-connect backend/container-local per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host vengono comunque trattate come remote ai fini del pairing e
  richiedono approvazione.
- Tutti i client WS devono includere l'identità `device` durante `connect` (operator + node).
  L'interfaccia Control può ometterla solo in queste modalità:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione riuscita dell'operatore Control UI con `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (misura straordinaria, grave degrado della sicurezza).
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione del dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` in `error.details.code` con un valore stabile in `error.details.reason`.

Errori comuni di migrazione:

| Messaggio | details.code | details.reason | Significato |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | Il client ha omesso `device.nonce` (o l'ha inviato vuoto). |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | Il client ha firmato con un nonce stale/errato. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | Il payload della firma non corrisponde al payload v2. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | Il formato/canonicalizzazione della chiave pubblica è fallito. |

Obiettivo della migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che vincola `platform` e `deviceFamily`
  oltre ai campi di dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati del dispositivo associato continua a controllare il criterio dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fare pinning della fingerprint del certificato del gateway (vedi configurazione `gateway.tls`
  più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone l'**API completa del gateway** (stato, canali, modelli, chat,
agent, sessioni, Node, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Bridge protocol](/it/gateway/bridge-protocol)
- [Gateway runbook](/it/gateway)

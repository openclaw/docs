---
read_when:
    - Implementazione o aggiornamento dei client WS del Gateway
    - Debug delle incompatibilità di protocollo o degli errori di connessione
    - Rigenerazione dello schema/dei modelli del protocollo
summary: 'Protocollo WebSocket del Gateway: negoziazione iniziale, frame, versionamento'
title: Protocollo Gateway
x-i18n:
    generated_at: "2026-05-02T20:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
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
- I frame pre-connect sono limitati a 64 KiB. Dopo un handshake riuscito, i client
  dovrebbero rispettare i limiti `hello-ok.policy.maxPayload` e
  `hello-ok.policy.maxBufferedBytes`. Con la diagnostica abilitata,
  i frame in ingresso sovradimensionati e i buffer in uscita lenti emettono eventi `payload.large`
  prima che il Gateway chiuda o scarti il frame interessato. Questi eventi mantengono
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

Mentre il Gateway sta ancora completando l’avvio dei sidecar, la richiesta `connect` può
restituire un errore `UNAVAILABLE` ritentabile con `details.reason` impostato su
`"startup-sidecars"` e `retryAfterMs`. I client dovrebbero ritentare quella risposta
entro il budget complessivo di connessione invece di presentarla come un errore terminale
di handshake.

`server`, `features`, `snapshot` e `policy` sono tutti richiesti dallo schema
(`src/gateway/protocol/schema/frames.ts`). Anche `auth` è richiesto e riporta
il ruolo/gli ambiti negoziati. `canvasHostUrl` è facoltativo.

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
`client.mode: "backend"`) possono omettere `device` sulle connessioni loopback dirette quando
si autenticano con il token/password condiviso del Gateway. Questo percorso è riservato
alle RPC interne del piano di controllo e impedisce a baseline obsolete di pairing CLI/dispositivo di
bloccare il lavoro backend locale, come gli aggiornamenti delle sessioni subagent. I client remoti,
i client con origine browser, i client node e i client espliciti con token dispositivo/identità dispositivo
continuano a usare i normali controlli di pairing e aumento degli ambiti.

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

Durante l’handoff di bootstrap attendibile, `hello-ok.auth` può includere anche voci di ruolo
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

Per il flusso di bootstrap node/operator integrato, il token node principale mantiene
`scopes: []` e qualsiasi token operator trasferito resta limitato alla allowlist
operator di bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). I controlli degli ambiti di bootstrap restano
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

## Incapsulamento

- **Richiesta**: `{type:"req", id, method, params}`
- **Risposta**: `{type:"res", id, ok, payload|error}`
- **Evento**: `{type:"event", event, payload, seq?, stateVersion?}`

I metodi con effetti collaterali richiedono **chiavi di idempotenza** (vedi schema).

## Ruoli + ambiti

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

I metodi RPC Gateway registrati dai Plugin possono richiedere il proprio ambito operator, ma
i prefissi admin core riservati (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) si risolvono sempre in `operator.admin`.

L’ambito del metodo è solo il primo controllo. Alcuni comandi slash raggiunti tramite
`chat.send` applicano controlli più rigorosi a livello di comando. Per esempio, le scritture persistenti
`/config set` e `/config unset` richiedono `operator.admin`.

`node.pair.approve` ha anche un controllo aggiuntivo dell’ambito al momento dell’approvazione oltre
all’ambito base del metodo:

- richieste senza comando: `operator.pairing`
- richieste con comandi node non-exec: `operator.pairing` + `operator.write`
- richieste che includono `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

### Capacità/comandi/autorizzazioni (node)

I node dichiarano le rivendicazioni di capacità al momento della connessione:

- `caps`: categorie di capacità di alto livello.
- `commands`: allowlist dei comandi per invoke.
- `permissions`: interruttori granulari (es. `screen.record`, `camera.capture`).

Il Gateway tratta queste come **rivendicazioni** e applica allowlist lato server.

## Presenza

- `system-presence` restituisce voci indicizzate per identità dispositivo.
- Le voci di presenza includono `deviceId`, `roles` e `scopes` così le UI possono mostrare una sola riga per dispositivo
  anche quando si connette sia come **operator** sia come **node**.
- `node.list` include i campi facoltativi `lastSeenAtMs` e `lastSeenReason`. I node connessi riportano
  l’ora della connessione corrente come `lastSeenAtMs` con motivo `connect`; i node associati possono anche riportare
  una presenza in background durevole quando un evento node attendibile aggiorna i metadati di pairing.

### Evento node vivo in background

I node possono chiamare `node.event` con `event: "node.presence.alive"` per registrare che un node associato era
vivo durante un risveglio in background senza contrassegnarlo come connesso.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` è un enum chiuso: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` o `connect`. Le stringhe trigger sconosciute vengono normalizzate a
`background` dal Gateway prima della persistenza. L’evento è durevole solo per sessioni dispositivo node
autenticate; le sessioni senza dispositivo o non associate restituiscono `handled: false`.

I Gateway riusciti restituiscono un risultato strutturato:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

I Gateway più vecchi possono ancora restituire `{ "ok": true }` per `node.event`; i client dovrebbero trattarlo come una
RPC confermata, non come persistenza durevole della presenza.

## Definizione degli ambiti degli eventi broadcast

Gli eventi broadcast WebSocket inviati dal server sono soggetti a controllo di ambito, così le sessioni con ambito pairing o solo node non ricevono passivamente contenuti di sessione.

- **Frame chat, agent e risultati degli strumenti** (inclusi eventi `agent` in streaming e risultati delle chiamate agli strumenti) richiedono almeno `operator.read`. Le sessioni senza `operator.read` saltano completamente questi frame.
- **Broadcast `plugin.*` definiti dai Plugin** sono limitati a `operator.write` o `operator.admin`, a seconda di come il Plugin li ha registrati.
- **Eventi di stato e trasporto** (`heartbeat`, `presence`, `tick`, ciclo di vita connect/disconnect, ecc.) restano senza restrizioni, così lo stato del trasporto rimane osservabile da ogni sessione autenticata.
- **Famiglie di eventi broadcast sconosciute** sono soggette a controllo di ambito per impostazione predefinita (fail-closed), a meno che un handler registrato non le renda esplicitamente meno restrittive.

Ogni connessione client mantiene il proprio numero di sequenza per client, così i broadcast preservano l’ordinamento monotono su quel socket anche quando client diversi vedono sottoinsiemi diversi e filtrati per ambito del flusso di eventi.

## Famiglie comuni di metodi RPC

La superficie WS pubblica è più ampia degli esempi di handshake/autenticazione sopra. Questo
non è un dump generato: `hello-ok.features.methods` è un elenco conservativo
di discovery costruito da `src/gateway/server-methods-list.ts` più gli export dei metodi
Plugin/canale caricati. Trattalo come discovery delle funzionalità, non come enumerazione completa
di `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Sistema e identità">
    - `health` restituisce lo snapshot di salute del Gateway memorizzato nella cache o appena verificato.
    - `diagnostics.stability` restituisce il registratore diagnostico di stabilità recente e limitato. Mantiene metadati operativi come nomi evento, conteggi, dimensioni in byte, letture di memoria, stato di code/sessioni, nomi di canali/Plugin e ID di sessione. Non mantiene testo chat, corpi Webhook, output degli strumenti, corpi grezzi di richieste o risposte, token, cookie o valori segreti. È richiesto l’ambito di lettura operator.
    - `status` restituisce il riepilogo del Gateway in stile `/status`; i campi sensibili sono inclusi solo per client operator con ambito admin.
    - `gateway.identity.get` restituisce l’identità dispositivo del Gateway usata dai flussi relay e pairing.
    - `system-presence` restituisce lo snapshot di presenza corrente per dispositivi operator/node connessi.
    - `system-event` aggiunge un evento di sistema e può aggiornare/trasmettere il contesto di presenza.
    - `last-heartbeat` restituisce l’ultimo evento Heartbeat persistito.
    - `set-heartbeats` attiva o disattiva l’elaborazione Heartbeat sul Gateway.

  </Accordion>

  <Accordion title="Modelli e utilizzo">
    - `models.list` restituisce il catalogo dei modelli consentiti a runtime. Passa `{ "view": "configured" }` per i modelli configurati delle dimensioni del selettore (`agents.defaults.models` prima, poi `models.providers.*.models`), oppure `{ "view": "all" }` per il catalogo completo.
    - `usage.status` restituisce finestre di utilizzo dei provider/riepiloghi della quota rimanente.
    - `usage.cost` restituisce riepiloghi aggregati dell'utilizzo dei costi per un intervallo di date.
    - `doctor.memory.status` restituisce lo stato di preparazione della memoria vettoriale / embedding memorizzati nella cache per il workspace dell'agente predefinito attivo. Passa `{ "probe": true }` o `{ "deep": true }` solo quando il chiamante vuole esplicitamente un ping live al provider di embedding.
    - `doctor.memory.remHarness` restituisce un'anteprima limitata e in sola lettura dell'harness REM per client remoti del piano di controllo. Può includere percorsi del workspace, frammenti di memoria, markdown fondato renderizzato e candidati alla promozione profonda, quindi i chiamanti richiedono `operator.read`.
    - `sessions.usage` restituisce riepiloghi di utilizzo per sessione.
    - `sessions.usage.timeseries` restituisce l'utilizzo in serie temporale per una sessione.
    - `sessions.usage.logs` restituisce le voci del log di utilizzo per una sessione.

  </Accordion>

  <Accordion title="Canali e helper di accesso">
    - `channels.status` restituisce riepiloghi di stato per canali/plugin integrati + in bundle.
    - `channels.logout` disconnette un canale/account specifico quando il canale supporta la disconnessione.
    - `web.login.start` avvia un flusso di accesso QR/web per l'attuale provider di canale web compatibile con QR.
    - `web.login.wait` attende il completamento di quel flusso di accesso QR/web e avvia il canale in caso di esito positivo.
    - `push.test` invia una notifica push APNs di prova a un nodo iOS registrato.
    - `voicewake.get` restituisce i trigger wake-word memorizzati.
    - `voicewake.set` aggiorna i trigger wake-word e trasmette la modifica.

  </Accordion>

  <Accordion title="Messaggistica e log">
    - `send` è l'RPC diretto di consegna in uscita per invii mirati a canale/account/thread al di fuori del runner di chat.
    - `logs.tail` restituisce la coda del file di log del gateway configurato con controlli di cursore/limite e byte massimi.

  </Accordion>

  <Accordion title="Talk e TTS">
    - `talk.config` restituisce il payload effettivo della configurazione Talk; `includeSecrets` richiede `operator.talk.secrets` (o `operator.admin`).
    - `talk.mode` imposta/trasmette lo stato attuale della modalità Talk per client WebChat/Control UI.
    - `talk.speak` sintetizza il parlato tramite il provider vocale Talk attivo.
    - `tts.status` restituisce lo stato di abilitazione TTS, il provider attivo, i provider di fallback e lo stato della configurazione del provider.
    - `tts.providers` restituisce l'inventario visibile dei provider TTS.
    - `tts.enable` e `tts.disable` attivano o disattivano lo stato delle preferenze TTS.
    - `tts.setProvider` aggiorna il provider TTS preferito.
    - `tts.convert` esegue una conversione text-to-speech una tantum.

  </Accordion>

  <Accordion title="Segreti, configurazione, aggiornamento e procedura guidata">
    - `secrets.reload` risolve di nuovo i SecretRef attivi e sostituisce lo stato dei segreti a runtime solo in caso di successo completo.
    - `secrets.resolve` risolve le assegnazioni di segreti destinate ai comandi per uno specifico insieme di comando/destinazione.
    - `config.get` restituisce lo snapshot e l'hash della configurazione attuale.
    - `config.set` scrive un payload di configurazione validato.
    - `config.patch` unisce un aggiornamento parziale della configurazione.
    - `config.apply` valida + sostituisce il payload completo della configurazione.
    - `config.schema` restituisce il payload dello schema di configurazione live usato da Control UI e dagli strumenti CLI: schema, `uiHints`, versione e metadati di generazione, inclusi i metadati dello schema di plugin + canale quando il runtime può caricarli. Lo schema include metadati dei campi `title` / `description` derivati dalle stesse etichette e dallo stesso testo di aiuto usati dall'interfaccia utente, incluse diramazioni di composizione per oggetti annidati, caratteri jolly, elementi di array e `anyOf` / `oneOf` / `allOf` quando esiste documentazione dei campi corrispondente.
    - `config.schema.lookup` restituisce un payload di lookup con ambito di percorso per un percorso di configurazione: percorso normalizzato, un nodo di schema superficiale, hint corrispondente + `hintPath` e riepiloghi dei figli immediati per il drill-down UI/CLI. I nodi dello schema di lookup mantengono la documentazione rivolta all'utente e i campi di validazione comuni (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, limiti numerici/stringa/array/oggetto e flag come `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). I riepiloghi dei figli espongono `key`, `path` normalizzato, `type`, `required`, `hasChildren`, oltre a `hint` / `hintPath` corrispondenti.
    - `update.run` esegue il flusso di aggiornamento del Gateway e pianifica un riavvio solo quando l'aggiornamento stesso è riuscito. Gli aggiornamenti del gestore pacchetti forzano un riavvio di aggiornamento non differito e senza cooldown dopo la sostituzione del pacchetto, così il vecchio processo Gateway non continua a caricare pigramente da un albero `dist` sostituito.
    - `update.status` restituisce l'ultimo sentinella di riavvio dell'aggiornamento memorizzato nella cache, inclusa la versione in esecuzione dopo il riavvio quando disponibile.
    - `wizard.start`, `wizard.next`, `wizard.status` e `wizard.cancel` espongono la procedura guidata di onboarding su WS RPC.

  </Accordion>

  <Accordion title="Helper per agente e workspace">
    - `agents.list` restituisce le voci degli agenti configurati, inclusi modello effettivo e metadati di runtime.
    - `agents.create`, `agents.update` e `agents.delete` gestiscono i record degli agenti e il cablaggio del workspace.
    - `agents.files.list`, `agents.files.get` e `agents.files.set` gestiscono i file del workspace di bootstrap esposti per un agente.
    - `artifacts.list`, `artifacts.get` e `artifacts.download` espongono riepiloghi e download di artefatti derivati dalla trascrizione per un ambito esplicito `sessionKey`, `runId` o `taskId`. Le query di esecuzione e attività risolvono lato server la sessione proprietaria e restituiscono solo media della trascrizione con provenienza corrispondente; le fonti URL non sicure o locali restituiscono download non supportati invece di essere recuperate lato server.
    - `agent.identity.get` restituisce l'identità effettiva dell'assistente per un agente o una sessione.
    - `agent.wait` attende il completamento di un'esecuzione e restituisce lo snapshot terminale quando disponibile.

  </Accordion>

  <Accordion title="Controllo della sessione">
    - `sessions.list` restituisce l'indice della sessione attuale, inclusi i metadati `agentRuntime` per riga quando è configurato un backend di runtime dell'agente.
    - `sessions.subscribe` e `sessions.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di modifica delle sessioni per il client WS attuale.
    - `sessions.messages.subscribe` e `sessions.messages.unsubscribe` attivano o disattivano le sottoscrizioni agli eventi di trascrizione/messaggio per una sessione.
    - `sessions.preview` restituisce anteprime limitate della trascrizione per chiavi di sessione specifiche.
    - `sessions.describe` restituisce una riga di sessione Gateway per una chiave di sessione esatta.
    - `sessions.resolve` risolve o canonicalizza una destinazione di sessione.
    - `sessions.create` crea una nuova voce di sessione.
    - `sessions.send` invia un messaggio in una sessione esistente.
    - `sessions.steer` è la variante interrompi-e-guida per una sessione attiva.
    - `sessions.abort` interrompe il lavoro attivo per una sessione. Un chiamante può passare `key` più `runId` facoltativo, oppure passare solo `runId` per esecuzioni attive che il Gateway può risolvere in una sessione.
    - `sessions.patch` aggiorna metadati/override della sessione e segnala il modello canonico risolto più `agentRuntime` effettivo.
    - `sessions.reset`, `sessions.delete` e `sessions.compact` eseguono la manutenzione della sessione.
    - `sessions.get` restituisce la riga di sessione memorizzata completa.
    - L'esecuzione della chat usa ancora `chat.history`, `chat.send`, `chat.abort` e `chat.inject`. `chat.history` è normalizzato per la visualizzazione per i client UI: i tag direttiva inline vengono rimossi dal testo visibile, i payload XML delle chiamate agli strumenti in testo normale (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate agli strumenti troncati) e i token di controllo del modello ASCII/a larghezza piena trapelati vengono rimossi, le righe dell'assistente composte solo da token silenziosi come `NO_REPLY` / `no_reply` esatti vengono omesse e le righe troppo grandi possono essere sostituite con placeholder.

  </Accordion>

  <Accordion title="Associazione dispositivi e token dispositivo">
    - `device.pair.list` restituisce i dispositivi associati in sospeso e approvati.
    - `device.pair.approve`, `device.pair.reject` e `device.pair.remove` gestiscono i record di associazione dei dispositivi.
    - `device.token.rotate` ruota un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.
    - `device.token.revoke` revoca un token di dispositivo associato entro i limiti del suo ruolo approvato e dell'ambito del chiamante.

  </Accordion>

  <Accordion title="Associazione dei Node, invoke e lavoro in sospeso">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` e `node.pair.verify` coprono l'associazione dei node e la verifica di bootstrap.
    - `node.list` e `node.describe` restituiscono lo stato dei node noti/connessi.
    - `node.rename` aggiorna l'etichetta di un node associato.
    - `node.invoke` inoltra un comando a un node connesso.
    - `node.invoke.result` restituisce il risultato per una richiesta invoke.
    - `node.event` riporta gli eventi originati dal node nel gateway.
    - `node.canvas.capability.refresh` aggiorna i token di capability canvas con ambito.
    - `node.pending.pull` e `node.pending.ack` sono le API di coda dei node connessi.
    - `node.pending.enqueue` e `node.pending.drain` gestiscono il lavoro durevole in sospeso per node offline/disconnessi.

  </Accordion>

  <Accordion title="Famiglie di approvazione">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` e `exec.approval.resolve` coprono richieste di approvazione exec una tantum più lookup/replay delle approvazioni in sospeso.
    - `exec.approval.waitDecision` attende una approvazione exec in sospeso e restituisce la decisione finale (o `null` in caso di timeout).
    - `exec.approvals.get` e `exec.approvals.set` gestiscono snapshot delle policy di approvazione exec del gateway.
    - `exec.approvals.node.get` e `exec.approvals.node.set` gestiscono la policy di approvazione exec locale al node tramite comandi relay del node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` e `plugin.approval.resolve` coprono i flussi di approvazione definiti dai plugin.

  </Accordion>

  <Accordion title="Automazione, Skills e strumenti">
    - Automazione: `wake` pianifica un'iniezione di testo wake immediata o al prossimo Heartbeat; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` gestiscono il lavoro pianificato.
    - Skills e strumenti: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Famiglie di eventi comuni

- `chat`: aggiornamenti della chat UI come `chat.inject` e altri eventi chat
  solo di trascrizione.
- `session.message` e `session.tool`: aggiornamenti della trascrizione/del flusso di eventi per una
  sessione sottoscritta.
- `sessions.changed`: indice della sessione o metadati modificati.
- `presence`: aggiornamenti dello snapshot della presenza di sistema.
- `tick`: evento periodico di keepalive / liveness.
- `health`: aggiornamento dello snapshot di salute del gateway.
- `heartbeat`: aggiornamento del flusso di eventi Heartbeat.
- `cron`: evento di modifica di esecuzione/job cron.
- `shutdown`: notifica di spegnimento del gateway.
- `node.pair.requested` / `node.pair.resolved`: ciclo di vita dell'associazione dei node.
- `node.invoke.request`: broadcast della richiesta invoke del node.
- `device.pair.requested` / `device.pair.resolved`: ciclo di vita del dispositivo associato.
- `voicewake.changed`: configurazione dei trigger wake-word modificata.
- `exec.approval.requested` / `exec.approval.resolved`: ciclo di vita
  dell'approvazione exec.
- `plugin.approval.requested` / `plugin.approval.resolved`: ciclo di vita
  dell'approvazione dei plugin.

### Metodi helper dei Node

- I node possono chiamare `skills.bins` per recuperare l'elenco attuale degli eseguibili skill
  per i controlli auto-allow.

### Metodi helper dell'operatore

- Gli operatori possono chiamare `commands.list` (`operator.read`) per recuperare l’inventario dei comandi runtime per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell’agente predefinito.
  - `scope` controlla quale superficie viene presa di mira dal `name` primario:
    - `text` restituisce il token del comando di testo primario senza il prefisso `/`
    - `native` e il percorso predefinito `both` restituiscono nomi nativi consapevoli del provider quando disponibili
  - `textAliases` contiene alias slash esatti come `/model` e `/m`.
  - `nativeName` contiene il nome del comando nativo consapevole del provider quando esiste.
  - `provider` è facoltativo e influisce solo sulla denominazione nativa e sulla disponibilità dei comandi nativi del plugin.
  - `includeArgs=false` omette dalla risposta i metadati degli argomenti serializzati.
- Gli operatori possono chiamare `tools.catalog` (`operator.read`) per recuperare il catalogo degli strumenti runtime per un agente. La risposta include strumenti raggruppati e metadati di provenienza:
  - `source`: `core` o `plugin`
  - `pluginId`: proprietario del plugin quando `source="plugin"`
  - `optional`: indica se uno strumento del plugin è facoltativo
- Gli operatori possono chiamare `tools.effective` (`operator.read`) per recuperare l’inventario degli strumenti effettivi a runtime per una sessione.
  - `sessionKey` è obbligatorio.
  - Il Gateway deriva il contesto runtime attendibile dalla sessione lato server invece di accettare auth o contesto di consegna forniti dal chiamante.
  - La risposta è limitata alla sessione e riflette ciò che la conversazione attiva può usare in questo momento, inclusi strumenti core, plugin e di canale.
- Gli operatori possono chiamare `tools.invoke` (`operator.write`) per invocare uno strumento disponibile tramite lo stesso percorso di policy del Gateway di `/tools/invoke`.
  - `name` è obbligatorio. `args`, `sessionKey`, `agentId`, `confirm` e `idempotencyKey` sono facoltativi.
  - Se sono presenti sia `sessionKey` sia `agentId`, l’agente risolto della sessione deve corrispondere a `agentId`.
  - La risposta è un envelope rivolto all’SDK con `ok`, `toolName`, `output` facoltativo e campi `error` tipizzati. Le approvazioni o i rifiuti di policy restituiscono `ok:false` nel payload invece di aggirare la pipeline di policy degli strumenti del Gateway.
- Gli operatori possono chiamare `skills.status` (`operator.read`) per recuperare l’inventario delle skill visibili per un agente.
  - `agentId` è facoltativo; omettilo per leggere il workspace dell’agente predefinito.
  - La risposta include idoneità, requisiti mancanti, controlli di configurazione e opzioni di installazione sanificate senza esporre valori segreti grezzi.
- Gli operatori possono chiamare `skills.search` e `skills.detail` (`operator.read`) per i metadati di discovery di ClawHub.
- Gli operatori possono chiamare `skills.install` (`operator.admin`) in due modalità:
  - Modalità ClawHub: `{ source: "clawhub", slug, version?, force? }` installa una cartella skill nella directory `skills/` del workspace dell’agente predefinito.
  - Modalità installer Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` esegue un’azione `metadata.openclaw.install` dichiarata sull’host del Gateway.
- Gli operatori possono chiamare `skills.update` (`operator.admin`) in due modalità:
  - La modalità ClawHub aggiorna uno slug tracciato o tutte le installazioni ClawHub tracciate nel workspace dell’agente predefinito.
  - La modalità config applica patch ai valori `skills.entries.<skillKey>` come `enabled`, `apiKey` ed `env`.

### Viste di `models.list`

`models.list` accetta un parametro `view` facoltativo:

- Omesso o `"default"`: comportamento runtime corrente. Se `agents.defaults.models` è configurato, la risposta è il catalogo consentito; altrimenti la risposta è l’intero catalogo del Gateway.
- `"configured"`: comportamento dimensionato per il selettore. Se `agents.defaults.models` è configurato, ha comunque la precedenza. Altrimenti la risposta usa voci esplicite `models.providers.*.models`, ripiegando sull’intero catalogo solo quando non esistono righe di modello configurate.
- `"all"`: intero catalogo del Gateway, aggirando `agents.defaults.models`. Usalo per diagnostica e UI di discovery, non per i normali selettori di modello.

## Approvazioni exec

- Quando una richiesta exec richiede approvazione, il Gateway trasmette `exec.approval.requested`.
- I client operatore risolvono chiamando `exec.approval.resolve` (richiede lo scope `operator.approvals`).
- Per `host=node`, `exec.approval.request` deve includere `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadati di sessione canonici). Le richieste prive di `systemRunPlan` vengono rifiutate.
- Dopo l’approvazione, le chiamate inoltrate `node.invoke system.run` riutilizzano quel `systemRunPlan` canonico come contesto autorevole di comando/cwd/sessione.
- Se un chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o `sessionKey` tra la preparazione e l’inoltro finale approvato di `system.run`, il Gateway rifiuta l’esecuzione invece di fidarsi del payload modificato.

## Fallback della consegna agente

- Le richieste `agent` possono includere `deliver=true` per richiedere la consegna in uscita.
- `bestEffortDeliver=false` mantiene il comportamento rigoroso: target di consegna non risolti o solo interni restituiscono `INVALID_REQUEST`.
- `bestEffortDeliver=true` consente il fallback all’esecuzione solo in sessione quando non è possibile risolvere alcun percorso consegnabile esterno (per esempio sessioni interne/webchat o configurazioni multicanale ambigue).

## Versionamento

- `PROTOCOL_VERSION` si trova in `src/gateway/protocol/schema/protocol-schemas.ts`.
- I client inviano `minProtocol` + `maxProtocol`; il server rifiuta le incompatibilità.
- Schemi e modelli sono generati dalle definizioni TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Costanti client

Il client di riferimento in `src/gateway/client.ts` usa questi valori predefiniti. I valori sono stabili nel protocollo v3 e costituiscono la baseline attesa per i client di terze parti.

| Costante                                  | Predefinito                                           | Origine                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Timeout richiesta (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Timeout preauth / challenge di connessione | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env può aumentare il budget server/client abbinato) |
| Backoff riconnessione iniziale            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Backoff massimo di riconnessione          | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Limite fast-retry dopo chiusura device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Periodo di grazia force-stop prima di `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Timeout predefinito di `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Intervallo tick predefinito (prima di `hello-ok`) | `30_000` ms                                    | `src/gateway/client.ts`                                                                    |
| Chiusura per timeout tick                 | codice `4000` quando il silenzio supera `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Il server pubblicizza `policy.tickIntervalMs`, `policy.maxPayload` e `policy.maxBufferedBytes` effettivi in `hello-ok`; i client devono rispettare quei valori invece dei valori predefiniti precedenti all’handshake.

## Auth

- L'autenticazione del Gateway con segreto condiviso usa `connect.params.auth.token` oppure
  `connect.params.auth.password`, a seconda della modalità di autenticazione configurata.
- Le modalità che portano identità, come Tailscale Serve
  (`gateway.auth.allowTailscale: true`) o non-loopback
  `gateway.auth.mode: "trusted-proxy"`, soddisfano il controllo di autenticazione della connessione dai
  header della richiesta invece che da `connect.params.auth.*`.
- `gateway.auth.mode: "none"` per ingress privato salta interamente
  l'autenticazione della connessione con segreto condiviso; non esporre questa modalità su ingress pubblici/non attendibili.
- Dopo il pairing, il Gateway emette un **token dispositivo** limitato al ruolo
  di connessione + ambiti. Viene restituito in `hello-ok.auth.deviceToken` e dovrebbe essere
  persistito dal client per connessioni future.
- I client dovrebbero persistere il `hello-ok.auth.deviceToken` primario dopo qualsiasi
  connessione riuscita.
- La riconnessione con quel token dispositivo **memorizzato** dovrebbe anche riutilizzare l'insieme di ambiti
  approvato e memorizzato per quel token. Questo preserva l'accesso di lettura/sonda/stato
  già concesso ed evita di ridurre silenziosamente le riconnessioni a un
  ambito implicito più ristretto solo amministratore.
- Assemblaggio dell'autenticazione di connessione lato client (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` è ortogonale e viene sempre inoltrato quando impostato.
  - `auth.token` viene popolato in ordine di priorità: prima il token condiviso esplicito,
    poi un `deviceToken` esplicito, quindi un token per dispositivo memorizzato (indicizzato per
    `deviceId` + `role`).
  - `auth.bootstrapToken` viene inviato solo quando nessuno dei precedenti ha risolto un
    `auth.token`. Un token condiviso o qualsiasi token dispositivo risolto lo sopprime.
  - La promozione automatica di un token dispositivo memorizzato nel nuovo tentativo singolo
    `AUTH_TOKEN_MISMATCH` è limitata ai **soli endpoint attendibili**:
    loopback, oppure `wss://` con un `tlsFingerprint` bloccato. `wss://` pubblico
    senza pinning non è idoneo.
- Le voci aggiuntive `hello-ok.auth.deviceTokens` sono token di passaggio bootstrap.
  Persistile solo quando la connessione ha usato autenticazione bootstrap su un trasporto attendibile
  come `wss://` o pairing loopback/locale.
- Se un client fornisce un `deviceToken` **esplicito** o `scopes` espliciti, quell'insieme
  di ambiti richiesto dal chiamante rimane autoritativo; gli ambiti in cache vengono riutilizzati solo
  quando il client riutilizza il token per dispositivo memorizzato.
- I token dispositivo possono essere ruotati/revocati tramite `device.token.rotate` e
  `device.token.revoke` (richiede l'ambito `operator.pairing`).
- `device.token.rotate` restituisce metadati di rotazione. Replica il token bearer
  sostitutivo solo per chiamate dallo stesso dispositivo già autenticate con
  quel token dispositivo, così i client solo token possono persistere il sostituto prima
  di riconnettersi. Le rotazioni condivise/amministrative non replicano il token bearer.
- Emissione, rotazione e revoca dei token restano limitate all'insieme di ruoli approvato
  registrato nella voce di pairing di quel dispositivo; la mutazione dei token non può espandere né
  puntare a un ruolo dispositivo che l'approvazione di pairing non ha mai concesso.
- Per sessioni con token di dispositivo associato, la gestione dei dispositivi è auto-limitata salvo che il
  chiamante abbia anche `operator.admin`: i chiamanti non amministratori possono rimuovere/revocare/ruotare
  solo la voce del **proprio** dispositivo.
- `device.token.rotate` e `device.token.revoke` controllano anche l'insieme di ambiti del token
  operatore di destinazione rispetto agli ambiti della sessione corrente del chiamante. I chiamanti non amministratori
  non possono ruotare o revocare un token operatore più ampio di quello già posseduto.
- Gli errori di autenticazione includono `error.details.code` più suggerimenti di recupero:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Comportamento del client per `AUTH_TOKEN_MISMATCH`:
  - I client attendibili possono tentare un solo nuovo tentativo limitato con un token per dispositivo in cache.
  - Se quel nuovo tentativo fallisce, i client dovrebbero interrompere i cicli di riconnessione automatica e mostrare indicazioni per l'azione dell'operatore.

## Identità dispositivo + pairing

- I Node dovrebbero includere un'identità dispositivo stabile (`device.id`) derivata da una
  fingerprint di keypair.
- I Gateway emettono token per dispositivo + ruolo.
- Le approvazioni di pairing sono richieste per nuovi ID dispositivo salvo che l'auto-approvazione locale
  sia abilitata.
- L'auto-approvazione del pairing è centrata sulle connessioni dirette local loopback.
- OpenClaw ha anche un percorso ristretto di auto-connessione backend/container-locale per
  flussi helper attendibili con segreto condiviso.
- Le connessioni tailnet o LAN sullo stesso host sono ancora trattate come remote per il pairing e
  richiedono approvazione.
- I client WS normalmente includono l'identità `device` durante `connect` (operatore +
  Node). Le uniche eccezioni operatore senza dispositivo sono percorsi di attendibilità espliciti:
  - `gateway.controlUi.allowInsecureAuth=true` per compatibilità HTTP non sicura solo localhost.
  - autenticazione operatore della Control UI `gateway.auth.mode: "trusted-proxy"` riuscita.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, grave riduzione della sicurezza).
  - RPC backend `gateway-client` direct-loopback autenticate con il token/password
    del Gateway condiviso.
- Tutte le connessioni devono firmare il nonce `connect.challenge` fornito dal server.

### Diagnostica di migrazione dell'autenticazione dispositivo

Per i client legacy che usano ancora il comportamento di firma pre-challenge, `connect` ora restituisce
codici di dettaglio `DEVICE_AUTH_*` sotto `error.details.code` con un `error.details.reason` stabile.

Errori di migrazione comuni:

| Messaggio                   | details.code                     | details.reason           | Significato                                        |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Il client ha omesso `device.nonce` (o lo ha inviato vuoto). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Il client ha firmato con un nonce obsoleto/errato. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Il payload della firma non corrisponde al payload v2. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Il timestamp firmato è fuori dallo skew consentito. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` non corrisponde alla fingerprint della chiave pubblica. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Formato/canonicalizzazione della chiave pubblica non riusciti. |

Obiettivo di migrazione:

- Attendi sempre `connect.challenge`.
- Firma il payload v2 che include il nonce del server.
- Invia lo stesso nonce in `connect.params.device.nonce`.
- Il payload di firma preferito è `v3`, che associa `platform` e `deviceFamily`
  oltre ai campi dispositivo/client/ruolo/ambiti/token/nonce.
- Le firme legacy `v2` restano accettate per compatibilità, ma il pinning dei metadati
  del dispositivo associato controlla comunque la policy dei comandi alla riconnessione.

## TLS + pinning

- TLS è supportato per le connessioni WS.
- I client possono facoltativamente fissare la fingerprint del certificato del Gateway (vedi configurazione
  `gateway.tls` più `gateway.remote.tlsFingerprint` o CLI `--tls-fingerprint`).

## Ambito

Questo protocollo espone la **API Gateway completa** (stato, canali, modelli, chat,
agente, sessioni, nodi, approvazioni, ecc.). La superficie esatta è definita dagli
schemi TypeBox in `src/gateway/protocol/schema.ts`.

## Correlati

- [Protocollo bridge](/it/gateway/bridge-protocol)
- [Runbook del Gateway](/it/gateway)

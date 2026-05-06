---
read_when:
    - Associazione dei nodi iOS/Android a un Gateway
    - Uso del canvas/della fotocamera di Node per il contesto dell'agente
    - Aggiungere nuovi comandi Node o helper CLI
summary: 'Nodi: abbinamento, capabilities, autorizzazioni e helper CLI per canvas/fotocamera/schermo/dispositivo/notifiche/sistema'
title: Nodi
x-i18n:
    generated_at: "2026-05-06T08:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ca35ddfb3efe374c0494e3883b0cb47b2e31511d4f7115a88f7c644b80d704f
    source_path: nodes/index.md
    workflow: 16
---

Un **Node** è un dispositivo companion (macOS/iOS/Android/headless) che si connette al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [protocollo del Gateway](/it/gateway/protocol).

Trasporto legacy: [protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL;
solo storico per i Node correnti).

macOS può anche essere eseguito in **modalità Node**: l'app della barra dei menu si connette al server
WS del Gateway ed espone i suoi comandi locali di canvas/camera come Node (quindi
`openclaw nodes …` funziona su questo Mac). In modalità gateway remoto, l'automazione
del browser è gestita dall'host Node della CLI (`openclaw node run` o dal
servizio Node installato), non dal Node dell'app nativa.

Note:

- I Node sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano sul **gateway**, non sui Node.
- Runbook di risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Associazione + stato

**I Node WS usano l'associazione del dispositivo.** I Node presentano un'identità del dispositivo durante `connect`; il Gateway
crea una richiesta di associazione del dispositivo per `role: node`. Approva tramite la CLI dei dispositivi (o l'UI).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un Node ritenta con dettagli di autenticazione modificati (ruolo/scope/chiave pubblica), la precedente
richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un Node come **associato** quando il suo ruolo di associazione del dispositivo include `node`.
- Il record di associazione del dispositivo è il contratto durevole dei ruoli approvati. La rotazione dei token
  resta all'interno di quel contratto; non può promuovere un Node associato a un
  ruolo diverso che l'approvazione dell'associazione non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) è un archivio separato di
  associazione dei Node posseduto dal gateway; **non** controlla l'handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` elimina le voci obsolete da quell'
  archivio separato di associazione dei Node posseduto dal gateway.
- L'ambito di approvazione segue i comandi dichiarati della richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi Node non exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host Node remoto (system.run)

Usa un **host Node** quando il Gateway viene eseguito su una macchina e vuoi che i comandi
vengano eseguiti su un'altra. Il modello parla comunque con il **gateway**; il gateway
inoltra le chiamate `exec` all'**host Node** quando viene selezionato `host=node`.

### Cosa viene eseguito dove

- **Host del Gateway**: riceve messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host Node**: esegue `system.run`/`system.which` sulla macchina del Node.
- **Approvazioni**: applicate sull'host Node tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni Node supportate da approvazione vincolano il contesto esatto della richiesta.
- Per esecuzioni dirette di file shell/runtime, OpenClaw prova anche, per quanto possibile, a vincolare un unico operando di file locale
  concreto e rifiuta l'esecuzione se quel file cambia prima dell'esecuzione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interpreter/runtime,
  l'esecuzione supportata da approvazione viene rifiutata invece di fingere una copertura runtime completa. Usa sandboxing,
  host separati o una allowlist/workflow completo esplicitamente attendibile per semantiche di interpreter più ampie.

### Avviare un host Node (foreground)

Sulla macchina del Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (bind loopback)

Se il Gateway esegue il bind al loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host Node remoti non possono connettersi direttamente. Crea un tunnel SSH e punta l'
host Node all'estremità locale del tunnel.

Esempio (host Node -> host gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta autenticazione con token o password.
- Le variabili d'ambiente sono preferite: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei secondo le regole di precedenza remota.
- Se sono configurati SecretRef `gateway.auth.*` locali attivi ma non risolti, l'autenticazione dell'host Node fallisce in modo chiuso.
- La risoluzione dell'autenticazione dell'host Node considera solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

### Avviare un host Node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Associare + nominare

Sull'host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il Node ritenta con dettagli di autenticazione modificati, esegui di nuovo `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persistito in `~/.openclaw/node.json` sul Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del gateway).

### Inserire i comandi nella allowlist

Le approvazioni exec sono **per host Node**. Aggiungi voci alla allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni risiedono sull'host Node in `~/.openclaw/exec-approvals.json`.

### Puntare exec al Node

Configura i valori predefiniti (configurazione del gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oppure per sessione:

```
/exec host=node security=allowlist node=<id-or-name>
```

Una volta impostato, qualsiasi chiamata `exec` con `host=node` viene eseguita sull'host Node (soggetta alla
allowlist/approvazioni del Node).

`host=auto` non sceglierà implicitamente il Node da solo, ma una richiesta esplicita per chiamata `host=node` è consentita da `auto`. Se vuoi che exec sul Node sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI host Node](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

## Invocare comandi

Basso livello (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello superiore per i workflow comuni "fornisci all'agente un allegato MEDIA".

## Policy dei comandi

I comandi Node devono superare due controlli prima di poter essere invocati:

1. Il Node deve dichiarare il comando nel suo elenco WebSocket `connect.commands`.
2. La policy di piattaforma del gateway deve consentire il comando dichiarato.

I Node companion Windows e macOS consentono per impostazione predefinita comandi dichiarati sicuri come
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot`.
I Node attendibili che pubblicizzano la capacità `talk` o dichiarano comandi `talk.*`
consentono anche per impostazione predefinita i comandi push-to-talk dichiarati (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), indipendentemente dall'etichetta della piattaforma.
Comandi pericolosi o fortemente sensibili alla privacy come `camera.snap`, `camera.clip` e
`screen.record` richiedono comunque un opt-in esplicito con
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` prevale sempre sui
valori predefiniti e sulle voci aggiuntive della allowlist.

I comandi Node posseduti da Plugin possono aggiungere una policy Gateway node-invoke. Tale policy
viene eseguita dopo il controllo della allowlist e prima dell'inoltro al Node, quindi RPC grezzo
`node.invoke`, helper CLI e strumenti agente dedicati condividono lo stesso confine di permessi del Plugin.
I comandi Node pericolosi del Plugin richiedono comunque l'opt-in esplicito
`gateway.nodes.allowCommands`.

Dopo che un Node modifica il suo elenco di comandi dichiarati, rifiuta la vecchia associazione del dispositivo
e approva la nuova richiesta in modo che il gateway memorizzi lo snapshot dei comandi aggiornato.

## Screenshot (snapshot canvas)

Se il Node mostra il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

Helper CLI (scrive in un file temporaneo e stampa `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controlli Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Note:

- `canvas present` accetta URL o percorsi di file locali (`--target`), più `--x/--y/--width/--height` opzionali per il posizionamento.
- `canvas eval` accetta JS inline (`--js`) o un argomento posizionale.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Note:

- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).

## Foto + video (camera del Node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il Node deve essere **in foreground** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata della clip è limitata (attualmente `<= 60s`) per evitare payload base64 eccessivamente grandi.
- Android richiederà i permessi `CAMERA`/`RECORD_AUDIO` quando possibile; i permessi negati falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni dello schermo (Node)

I Node supportati espongono `screen.record` (mp4). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del Node.
- Le registrazioni dello schermo sono limitate a `<= 60s`.
- `--no-audio` disabilita la cattura del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare un display quando sono disponibili più schermi.

## Posizione (Node)

I Node espongono `location.get` quando la Posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La Posizione è **disattivata per impostazione predefinita**.
- "Sempre" richiede il permesso di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, accuratezza (metri) e timestamp.

## SMS (Node Android)

I Node Android possono esporre `sms.send` quando l'utente concede il permesso **SMS** e il dispositivo supporta la telefonia.

Invocazione di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- La richiesta di permesso deve essere accettata sul dispositivo Android prima che la capacità venga pubblicizzata.
- I dispositivi solo Wi-Fi senza telefonia non pubblicizzeranno `sms.send`.

## Comandi dispositivo Android + dati personali

I Node Android possono pubblicizzare famiglie di comandi aggiuntive quando le capacità corrispondenti sono abilitate.

Famiglie disponibili:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Esempi di invocazione:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Note:

- I comandi di movimento sono vincolati dalle capacità dei sensori disponibili.

## Comandi di sistema (host Node / Node Mac)

Il Node macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host Node headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione della shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` rimane la superficie RPC diretta per i comandi Node espliciti.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi restano solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta concessa
  un'approvazione, il Gateway inoltra quel piano archiviato, non eventuali campi
  command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dell'autorizzazione alle notifiche nell'app macOS.
- I metadati Node `platform` / `deviceFamily` non riconosciuti usano una allowlist predefinita conservativa che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di questi comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper di shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito richiesta vengono ridotti a una allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mantengono i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene salvata automaticamente.
- Sugli host Node Windows in modalità allowlist, le esecuzioni dei wrapper di shell tramite `cmd.exe /c` richiedono l'approvazione (la sola voce allowlist non consente automaticamente il modulo wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host Node ignorano gli override di `PATH` e rimuovono chiavi di avvio/shell pericolose (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se servono voci PATH aggiuntive, configura l'ambiente del servizio host Node (o installa gli strumenti in posizioni standard) invece di passare `PATH` tramite `--env`.
- In modalità Node macOS, `system.run` è regolato dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come nell'host Node headless; le richieste negate restituiscono `SYSTEM_RUN_DENIED`.
- Sull'host Node headless, `system.run` è regolato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Associazione exec Node

Quando sono disponibili più Node, puoi associare exec a un Node specifico.
Questo imposta il Node predefinito per `exec host=node` (e può essere sovrascritto per singolo agente).

Predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Annulla l'impostazione per consentire qualsiasi Node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mappa delle autorizzazioni

I Node possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome dell'autorizzazione (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concessa).

## Host Node headless (multipiattaforma)

OpenClaw può eseguire un **host Node headless** (senza UI) che si connette al WebSocket
del Gateway ed espone `system.run` / `system.which`. È utile su Linux/Windows
o per eseguire un Node minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- L'associazione è comunque richiesta (il Gateway mostrerà una richiesta di associazione dispositivo).
- L'host Node archivia il suo id Node, token, nome visualizzato e informazioni di connessione al Gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l'host Node headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` attraverso l'host exec dell'app complementare; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host app e fallire in modo chiuso se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità Node Mac

- L'app della barra dei menu macOS si connette al server WS del Gateway come Node (quindi `openclaw nodes …` funziona con questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si connette a `localhost`.

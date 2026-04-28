---
read_when:
    - Associare node iOS/Android a un gateway
    - Usare canvas/camera del node per il contesto dell'agente
    - Aggiungere nuovi comandi node o helper CLI
summary: 'Nodes: pairing, capacità, permessi e helper CLI per canvas/camera/schermo/dispositivo/notifiche/sistema'
title: Nodes
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:33:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

Un **node** è un dispositivo companion (macOS/iOS/Android/headless) che si collega al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [Protocollo del Gateway](/it/gateway/protocol).

Trasporto legacy: [Protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL;
solo storico per i node attuali).

Anche macOS può funzionare in **modalità node**: l'app menubar si collega al server
WS del Gateway ed espone i suoi comandi locali canvas/camera come node (quindi
`openclaw nodes …` funziona contro questo Mac). In modalità gateway remoto, l'automazione
del browser è gestita dal CLI node host (`openclaw node run` o dal servizio node
installato), non dal node dell'app nativa.

Note:

- I node sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano al **gateway**, non ai node.
- Runbook di risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Pairing + stato

**I node WS usano il pairing dei dispositivi.** I node presentano un'identità dispositivo durante `connect`; il Gateway
crea una richiesta di pairing del dispositivo per `role: node`. Approva tramite la CLI devices (o UI).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un node ritenta con dettagli auth cambiati (ruolo/scope/chiave pubblica), la richiesta
in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Riesegui
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un node come **paired** quando il ruolo di pairing del dispositivo include `node`.
- Il record di pairing del dispositivo è il contratto durevole di ruolo approvato. La
  rotazione del token resta all'interno di quel contratto; non può aggiornare un node associato a un
  ruolo diverso che l'approvazione del pairing non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) è uno store di pairing node separato, di proprietà del gateway;
  **non** regola l'handshake `connect` del WS.
- Lo scope di approvazione segue i comandi dichiarati dalla richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node remoto (system.run)

Usa un **host node** quando il tuo Gateway gira su una macchina e vuoi che i comandi
vengano eseguiti su un'altra. Il modello parla comunque con il **gateway**; il gateway
inoltra le chiamate `exec` all'**host node** quando è selezionato `host=node`.

### Cosa viene eseguito e dove

- **Host Gateway**: riceve i messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host node**: esegue `system.run`/`system.which` sulla macchina node.
- **Approvazioni**: applicate sull'host node tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni node supportate da approvazione vincolano l'esatto contesto della richiesta.
- Per esecuzioni dirette di shell/runtime su file, OpenClaw vincola anche in best-effort un concreto
  operando file locale e nega l'esecuzione se quel file cambia prima dell'esecuzione.
- Se OpenClaw non riesce a identificare esattamente un solo file locale concreto per un comando di interpreter/runtime,
  l'esecuzione supportata da approvazione viene negata invece di fingere una copertura runtime completa. Usa sandboxing,
  host separati o un workflow esplicito con allowlist/trusted completo per semantiche di interpreter più ampie.

### Avvia un host node (foreground)

Sulla macchina node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (bind loopback)

Se il Gateway fa bind su loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host node remoti non possono collegarsi direttamente. Crea un tunnel SSH e punta
l'host node all'estremità locale del tunnel.

Esempio (host node -> host gateway):

```bash
# Terminale A (lascia in esecuzione): inoltra la porta locale 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminale B: esporta il token del gateway e collegati attraverso il tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta auth con token o password.
- Sono preferite le variabili d'ambiente: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, node host ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei secondo le regole di precedenza remota.
- Se sono configurati SecretRef `gateway.auth.*` locali attivi ma non risolti, l'auth node-host fallisce in fail closed.
- La risoluzione auth node-host onora solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

### Avvia un host node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Pair + nome

Sull'host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il node ritenta con dettagli auth cambiati, riesegui `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di naming:

- `--display-name` su `openclaw node run` / `openclaw node install` (persistito in `~/.openclaw/node.json` sul node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override lato gateway).

### Inserisci i comandi in allowlist

Le approvazioni exec sono **per host node**. Aggiungi voci all'allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni si trovano sull'host node in `~/.openclaw/exec-approvals.json`.

### Punta exec al node

Configura i valori predefiniti (configurazione gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oppure per sessione:

```
/exec host=node security=allowlist node=<id-or-name>
```

Una volta impostato, qualunque chiamata `exec` con `host=node` viene eseguita sull'host node (soggetta a
allowlist/approvazioni del node).

`host=auto` non sceglierà implicitamente il node da solo, ma una richiesta esplicita `host=node` per chiamata è consentita da `auto`. Se vuoi che exec sul node sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI node host](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

## Invocazione dei comandi

Livello basso (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello più alto per i comuni workflow “fornire all'agente un allegato MEDIA”.

## Screenshot (snapshot canvas)

Se il node mostra il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

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

- `canvas present` accetta URL o percorsi di file locali (`--target`), più `--x/--y/--width/--height` facoltativi per il posizionamento.
- `canvas eval` accetta JS inline (`--js`) o un argomento posizionale.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Note:

- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).

## Foto + video (camera node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # predefinito: entrambe le direzioni (2 righe MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il node deve essere **in foreground** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata del clip è limitata (attualmente `<= 60s`) per evitare payload base64 troppo grandi.
- Android richiede i permessi `CAMERA`/`RECORD_AUDIO` quando possibile; i permessi negati falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni schermo (nodes)

I node supportati espongono `screen.record` (mp4). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del node.
- Le registrazioni schermo sono limitate a `<= 60s`.
- `--no-audio` disabilita la cattura del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare un display quando sono disponibili più schermi.

## Posizione (nodes)

I node espongono `location.get` quando la posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- “Always” richiede il permesso di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, accuratezza (metri) e timestamp.

## SMS (nodes Android)

I node Android possono esporre `sms.send` quando l'utente concede il permesso **SMS** e il dispositivo supporta la telefonia.

Invocazione di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- Il prompt del permesso deve essere accettato sul dispositivo Android prima che la capacità venga pubblicizzata.
- I dispositivi solo Wi‑Fi senza telefonia non pubblicizzeranno `sms.send`.

## Comandi Android device + dati personali

I node Android possono pubblicizzare famiglie di comandi aggiuntive quando le capacità corrispondenti sono abilitate.

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

- I comandi motion sono protetti dalle capacità in base ai sensori disponibili.

## Comandi di sistema (host node / mac node)

Il node macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host node headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` resta la superficie RPC diretta per comandi node espliciti.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi restano solo sul percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta
  concessa un'approvazione, il gateway inoltra quel piano memorizzato, non eventuali campi command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato del permesso di notifica nell'app macOS.
- Metadati node `platform` / `deviceFamily` non riconosciuti usano un'allowlist predefinita prudente che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di quei comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per wrapper shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito richiesta vengono ridotti a un'allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei percorsi del wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.
- Sugli host node Windows in modalità allowlist, le esecuzioni tramite wrapper shell con `cmd.exe /c` richiedono approvazione (la sola voce allowlist non consente automaticamente la forma wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host node ignorano gli override di `PATH` e rimuovono chiavi pericolose di avvio/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se hai bisogno di voci PATH aggiuntive, configura invece l'ambiente del servizio host node (o installa gli strumenti in posizioni standard) invece di passare `PATH` tramite `--env`.
- In modalità node macOS, `system.run` è protetto dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come l'host node headless; i prompt negati restituiscono `SYSTEM_RUN_DENIED`.
- Sull'host node headless, `system.run` è protetto dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Binding exec del node

Quando sono disponibili più node, puoi associare exec a un node specifico.
Questo imposta il node predefinito per `exec host=node` (e può essere sovrascritto per agente).

Predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Rimuovi l'impostazione per consentire qualunque node:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mappa dei permessi

I node possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome del permesso (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concesso).

## Host node headless (cross-platform)

OpenClaw può eseguire un **host node headless** (senza UI) che si collega al WebSocket del Gateway
ed espone `system.run` / `system.which`. Questo è utile su Linux/Windows
o per eseguire un node minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- Il pairing è comunque richiesto (il Gateway mostrerà un prompt di pairing del dispositivo).
- L'host node memorizza il proprio id node, token, nome visualizzato e informazioni di connessione al gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l'host node headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` tramite l'host exec dell'app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host app e fallire in fail closed se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità node Mac

- L'app menubar macOS si collega al server WS del Gateway come node (quindi `openclaw nodes …` funziona contro questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si collega a `localhost`.

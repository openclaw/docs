---
read_when:
    - Pairing di Node iOS/Android con un gateway
    - Uso di canvas/camera del Node per il contesto dell'agente
    - Aggiunta di nuovi comandi Node o helper CLI
summary: 'Node: pairing, capacità, permessi e helper CLI per canvas/camera/schermo/dispositivo/notifiche/sistema'
title: Node
x-i18n:
    generated_at: "2026-04-24T08:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a210a5b90d78870dd6d17c0f0a81181a8897dc41149618c4359d7c03ef342fd
    source_path: nodes/index.md
    workflow: 15
---

Un **Node** è un dispositivo companion (macOS/iOS/Android/headless) che si collega al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [Gateway protocol](/it/gateway/protocol).

Trasporto legacy: [Bridge protocol](/it/gateway/bridge-protocol) (TCP JSONL;
ormai solo storico per i Node attuali).

Anche macOS può eseguire in **modalità node**: l'app menubar si collega al server WS del Gateway ed espone i suoi comandi locali canvas/camera come Node (così `openclaw nodes …` funziona contro questo Mac).

Note:

- I Node sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano al **gateway**, non ai Node.
- Runbook di risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Pairing + stato

**I Node WS usano il pairing del dispositivo.** I Node presentano un'identità del dispositivo durante `connect`; il Gateway
crea una richiesta di pairing del dispositivo per `role: node`. Approva tramite la CLI dei dispositivi (o UI).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un Node ritenta con dettagli auth modificati (ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente
viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un Node come **paired** quando il ruolo di pairing del suo dispositivo include `node`.
- Il record di pairing del dispositivo è il contratto durevole di ruolo approvato. La
  rotazione del token resta all'interno di quel contratto; non può aggiornare un Node associato a un
  ruolo diverso che l'approvazione del pairing non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) è un archivio separato di pairing dei Node posseduto dal gateway;
  **non** controlla l'handshake WS `connect`.
- L'ambito di approvazione segue i comandi dichiarati dalla richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi Node non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host Node remoto (`system.run`)

Usa un **host Node** quando il tuo Gateway è in esecuzione su una macchina e vuoi che i comandi
vengano eseguiti su un'altra. Il modello continua a parlare al **gateway**; il gateway
inoltra le chiamate `exec` all'**host Node** quando viene selezionato `host=node`.

### Cosa viene eseguito dove

- **Host Gateway**: riceve i messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host Node**: esegue `system.run`/`system.which` sulla macchina del Node.
- **Approvazioni**: applicate sull'host Node tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni del Node supportate da approvazione vincolano il contesto esatto della richiesta.
- Per esecuzioni dirette di file shell/runtime, OpenClaw vincola inoltre in best-effort un operando di file locale concreto
  e nega l'esecuzione se quel file cambia prima dell'esecuzione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interprete/runtime,
  l'esecuzione supportata da approvazione viene negata invece di fingere una copertura completa del runtime. Usa sandboxing,
  host separati oppure un'allowlist/full workflow attendibile esplicito per una semantica dell'interprete più ampia.

### Avvia un host Node (foreground)

Sulla macchina Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (bind loopback)

Se il Gateway si collega al loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host Node remoti non possono connettersi direttamente. Crea un tunnel SSH e punta l'host
Node all'estremità locale del tunnel.

Esempio (host Node -> host gateway):

```bash
# Terminale A (lascialo in esecuzione): inoltra la 18790 locale -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminale B: esporta il token del gateway e connettiti attraverso il tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta autenticazione con token o password.
- Le variabili env sono preferite: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback della configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono validi secondo le regole di precedenza remote.
- Se i SecretRef attivi `gateway.auth.*` locali sono configurati ma non risolti, l'autenticazione dell'host Node fallisce in modalità fail-closed.
- La risoluzione dell'autenticazione dell'host Node onora solo le variabili env `OPENCLAW_GATEWAY_*`.

### Avvia un host Node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Pair + nome

Sull'host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il Node ritenta con dettagli auth modificati, esegui di nuovo `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persistente in `~/.openclaw/node.json` sul Node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del gateway).

### Inserisci i comandi nella allowlist

Le approvazioni exec sono **per host Node**. Aggiungi voci allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni vivono sull'host Node in `~/.openclaw/exec-approvals.json`.

### Punta exec al Node

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

Una volta impostato, qualsiasi chiamata `exec` con `host=node` viene eseguita sull'host Node (soggetta a
allowlist/approvazioni del Node).

`host=auto` non sceglierà implicitamente il Node da solo, ma una richiesta esplicita per chiamata `host=node` è consentita da `auto`. Se vuoi che exec sul Node sia il valore predefinito della sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI dell'host Node](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

## Invocazione dei comandi

Di basso livello (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello superiore per i comuni flussi di lavoro “fornire all'agente un allegato MEDIA”.

## Screenshot (istantanee canvas)

Se il Node sta mostrando il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

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

- `canvas present` accetta URL o percorsi di file locali (`--target`), più facoltativamente `--x/--y/--width/--height` per il posizionamento.
- `canvas eval` accetta JS inline (`--js`) oppure un argomento posizionale.

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
openclaw nodes camera snap --node <idOrNameOrIp>            # predefinito: entrambi gli orientamenti (2 righe MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il Node deve essere **in foreground** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata delle clip è limitata (attualmente `<= 60s`) per evitare payload base64 troppo grandi.
- Android richiederà i permessi `CAMERA`/`RECORD_AUDIO` quando possibile; i permessi negati falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni schermo (Node)

I Node supportati espongono `screen.record` (`mp4`). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del Node.
- Le registrazioni schermo sono limitate a `<= 60s`.
- `--no-audio` disabilita la cattura del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare uno schermo quando sono disponibili più display.

## Posizione (Node)

I Node espongono `location.get` quando la posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- “Always” richiede il permesso di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, accuratezza (metri) e timestamp.

## SMS (Node Android)

I Node Android possono esporre `sms.send` quando l'utente concede il permesso **SMS** e il dispositivo supporta la telefonia.

Invoke di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- Il prompt dei permessi deve essere accettato sul dispositivo Android prima che la capacità venga pubblicizzata.
- I dispositivi solo Wi‑Fi senza telefonia non pubblicizzeranno `sms.send`.

## Comandi del dispositivo Android + dati personali

I Node Android possono pubblicizzare famiglie di comandi aggiuntive quando sono abilitate le capacità corrispondenti.

Famiglie disponibili:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Esempi di invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Note:

- I comandi Motion sono limitati dalle capacità dei sensori disponibili.

## Comandi di sistema (host Node / Node mac)

Il Node macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host Node headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` resta la superficie diretta RPC per i comandi Node espliciti.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi restano solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta concessa un'approvazione, il gateway inoltra quel piano memorizzato, non eventuali campi command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dei permessi delle notifiche nell'app macOS.
- I metadati `platform` / `deviceFamily` del Node non riconosciuti usano un'allowlist predefinita conservativa che esclude `system.run` e `system.which`. Se intenzionalmente ti servono questi comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito richiesta vengono ridotti a un'allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi dell'eseguibile interno invece dei percorsi del wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.
- Sugli host Node Windows in modalità allowlist, le esecuzioni di wrapper shell tramite `cmd.exe /c` richiedono approvazione (la sola voce allowlist non consente automaticamente il form del wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host Node ignorano gli override di `PATH` e rimuovono chiavi pericolose di startup/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se ti servono voci PATH aggiuntive, configura l'ambiente del servizio dell'host Node (oppure installa gli strumenti in posizioni standard) invece di passare `PATH` tramite `--env`.
- In modalità node su macOS, `system.run` è limitato dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come sull'host Node headless; i prompt negati restituiscono `SYSTEM_RUN_DENIED`.
- Sull'host Node headless, `system.run` è limitato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Binding exec del Node

Quando sono disponibili più Node, puoi vincolare exec a un Node specifico.
Questo imposta il Node predefinito per `exec host=node` (e può essere sovrascritto per agente).

Valore predefinito globale:

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

## Mappa dei permessi

I Node possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome del permesso (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concesso).

## Host Node headless (cross-platform)

OpenClaw può eseguire un **host Node headless** (senza UI) che si collega al WebSocket del Gateway
ed espone `system.run` / `system.which`. Questo è utile su Linux/Windows
oppure per eseguire un Node minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- Il pairing è comunque richiesto (il Gateway mostrerà un prompt di pairing del dispositivo).
- L'host Node memorizza id Node, token, nome visualizzato e informazioni di connessione al gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Exec approvals](/it/tools/exec-approvals)).
- Su macOS, l'host Node headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` attraverso l'host exec dell'app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host app e fallire in modalità fail-closed se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità node su Mac

- L'app menubar macOS si collega al server WS del Gateway come Node (così `openclaw nodes …` funziona contro questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si collega a `localhost`.

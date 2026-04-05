---
read_when:
    - Associazione di nodi iOS/Android a un gateway
    - Uso di canvas/fotocamera del nodo per il contesto dell'agente
    - Aggiunta di nuovi comandi per nodi o helper CLI
summary: 'Nodi: pairing, capability, permessi e helper CLI per canvas/fotocamera/schermo/dispositivo/notifiche/sistema'
title: Nodi
x-i18n:
    generated_at: "2026-04-05T13:58:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 201be0e13cb6d39608f0bbd40fd02333f68bd44f588538d1016fe864db7e038e
    source_path: nodes/index.md
    workflow: 15
---

# Nodi

Un **nodo** è un dispositivo companion (macOS/iOS/Android/headless) che si connette al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad esempio `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [Protocollo del Gateway](/gateway/protocol).

Transport legacy: [Protocollo bridge](/gateway/bridge-protocol) (TCP JSONL;
solo storico per i nodi attuali).

Anche macOS può funzionare in **modalità nodo**: l'app nella barra dei menu si connette al server WS del Gateway ed espone i suoi comandi locali canvas/fotocamera come nodo (quindi `openclaw nodes …` funziona su questo Mac).

Note:

- I nodi sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano al **gateway**, non ai nodi.
- Runbook di risoluzione dei problemi: [/nodes/troubleshooting](/nodes/troubleshooting)

## Pairing + stato

**I nodi WS usano il pairing del dispositivo.** I nodi presentano un'identità del dispositivo durante `connect`; il Gateway
crea una richiesta di pairing del dispositivo per `role: node`. Approvala tramite la CLI devices (o UI).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un nodo ritenta con dettagli di autenticazione modificati (role/scopes/public key), la precedente
richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un nodo come **paired** quando il ruolo di pairing del dispositivo include `node`.
- Il record di pairing del dispositivo è il contratto durevole dei ruoli approvati. La rotazione del
  token resta all'interno di quel contratto; non può elevare un nodo associato a un
  ruolo diverso che l'approvazione del pairing non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/rename`) è uno store separato di pairing dei nodi gestito dal gateway; **non** controlla l'handshake WS `connect`.
- L'ambito di approvazione segue i comandi dichiarati nella richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi nodo non-exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host nodo remoto (`system.run`)

Usa un **host nodo** quando il tuo Gateway gira su una macchina e vuoi che i comandi
vengano eseguiti su un'altra. Il modello continua a parlare con il **gateway**; il gateway
inoltra le chiamate `exec` all'**host nodo** quando viene selezionato `host=node`.

### Cosa gira dove

- **Host gateway**: riceve i messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host nodo**: esegue `system.run`/`system.which` sulla macchina del nodo.
- **Approvazioni**: applicate sull'host nodo tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni del nodo supportate da approvazione legano l'esatto contesto della richiesta.
- Per esecuzioni dirette di shell/file runtime, OpenClaw lega anche nel miglior modo possibile un singolo
  operando file locale concreto e nega l'esecuzione se quel file cambia prima dell'esecuzione.
- Se OpenClaw non riesce a identificare esattamente un solo file locale concreto per un comando interprete/runtime,
  l'esecuzione supportata da approvazione viene negata invece di fingere una copertura completa del runtime. Usa sandboxing,
  host separati o una allowlist/workflow esplicito attendibile per semantiche interprete più ampie.

### Avvia un host nodo (foreground)

Sulla macchina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto via tunnel SSH (bind loopback)

Se il Gateway effettua il bind al loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host nodo remoti non possono connettersi direttamente. Crea un tunnel SSH e punta l'host
nodo all'estremità locale del tunnel.

Esempio (host nodo -> host gateway):

```bash
# Terminale A (lascialo in esecuzione): inoltra la porta locale 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminale B: esporta il token gateway e connettiti tramite il tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta autenticazione con token o password.
- Le env var sono preferite: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host nodo ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono validi secondo le regole di precedenza remota.
- Se sono configurati SecretRef attivi `gateway.auth.*` locali ma non risolti, l'autenticazione dell'host nodo fallisce in modalità chiusa.
- La risoluzione auth dell'host nodo considera solo le env var `OPENCLAW_GATEWAY_*`.

### Avvia un host nodo (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### Associa + assegna nome

Sull'host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il nodo ritenta con dettagli auth modificati, esegui di nuovo `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persistente in `~/.openclaw/node.json` sul nodo).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del gateway).

### Inserisci i comandi nella allowlist

Le approvazioni exec sono **per host nodo**. Aggiungi voci allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni si trovano sull'host nodo in `~/.openclaw/exec-approvals.json`.

### Punta exec al nodo

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

Una volta impostato, qualsiasi chiamata `exec` con `host=node` verrà eseguita sull'host nodo (soggetta alla
allowlist/approvazioni del nodo).

`host=auto` non sceglierà implicitamente il nodo da solo, ma una richiesta esplicita per chiamata `host=node` è consentita da `auto`. Se vuoi che exec su nodo sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI host nodo](/cli/node)
- [Strumento exec](/tools/exec)
- [Approvazioni exec](/tools/exec-approvals)

## Invocazione dei comandi

Livello basso (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello più alto per i comuni workflow “fornisci all'agente un allegato MEDIA”.

## Screenshot (snapshot canvas)

Se il nodo sta mostrando il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

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

- `canvas present` accetta URL o percorsi file locali (`--target`), più opzionalmente `--x/--y/--width/--height` per il posizionamento.
- `canvas eval` accetta JS inline (`--js`) o un argomento posizionale.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Note:

- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).

## Foto + video (fotocamera del nodo)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # predefinito: entrambe le inquadrature (2 righe MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il nodo deve essere **in foreground** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata delle clip viene limitata (attualmente `<= 60s`) per evitare payload base64 troppo grandi.
- Android richiede i permessi `CAMERA`/`RECORD_AUDIO` quando possibile; i permessi negati falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni schermo (nodi)

I nodi supportati espongono `screen.record` (`mp4`). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del nodo.
- Le registrazioni schermo vengono limitate a `<= 60s`.
- `--no-audio` disabilita la cattura del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare uno schermo quando sono disponibili più display.

## Posizione (nodi)

I nodi espongono `location.get` quando la posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- “Always” richiede il permesso di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, accuratezza (metri) e timestamp.

## SMS (nodi Android)

I nodi Android possono esporre `sms.send` quando l'utente concede il permesso **SMS** e il dispositivo supporta la telefonia.

Invocazione di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- Il prompt dei permessi deve essere accettato sul dispositivo Android prima che la capability venga pubblicizzata.
- I dispositivi solo Wi‑Fi senza telefonia non pubblicizzeranno `sms.send`.

## Comandi dispositivo Android + dati personali

I nodi Android possono pubblicizzare famiglie di comandi aggiuntive quando le capability corrispondenti sono abilitate.

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

- I comandi motion sono soggetti alle capability dei sensori disponibili.

## Comandi di sistema (host nodo / nodo mac)

Il nodo macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host nodo headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` resta la superficie RPC diretta per i comandi nodo espliciti.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi restano solo sul percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta che un'approvazione è concessa, il gateway inoltra quel piano memorizzato, non eventuali campi command/cwd/session modificati in seguito dal chiamante.
- `system.notify` rispetta lo stato dei permessi di notifica nell'app macOS.
- I metadati nodo `platform` / `deviceFamily` non riconosciuti usano una allowlist predefinita conservativa che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di quei comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito richiesta vengono ridotti a una allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) mantengono i percorsi degli eseguibili interni invece dei percorsi del wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene mantenuta automaticamente.
- Sugli host nodo Windows in modalità allowlist, le esecuzioni wrapper shell tramite `cmd.exe /c` richiedono approvazione (la sola voce allowlist non consente automaticamente la forma wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host nodo ignorano gli override di `PATH` e rimuovono chiavi pericolose di avvio/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se hai bisogno di voci PATH aggiuntive, configura l'ambiente del servizio host nodo (o installa gli strumenti in percorsi standard) invece di passare `PATH` tramite `--env`.
- In modalità nodo macOS, `system.run` è controllato dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come per l'host nodo headless; i prompt negati restituiscono `SYSTEM_RUN_DENIED`.
- Sull'host nodo headless, `system.run` è controllato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Associazione exec al nodo

Quando sono disponibili più nodi, puoi associare exec a un nodo specifico.
Questo imposta il nodo predefinito per `exec host=node` (e può essere sovrascritto per agente).

Valore predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Annulla per consentire qualsiasi nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mappa dei permessi

I nodi possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome permesso (ad esempio `screenRecording`, `accessibility`) con valori booleani (`true` = concesso).

## Host nodo headless (cross-platform)

OpenClaw può eseguire un **host nodo headless** (senza UI) che si connette al
WebSocket del Gateway ed espone `system.run` / `system.which`. Questo è utile su Linux/Windows
o per eseguire un nodo minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- Il pairing è comunque richiesto (il Gateway mostrerà un prompt di pairing del dispositivo).
- L'host nodo memorizza il suo id nodo, token, display name e le informazioni di connessione al gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/tools/exec-approvals)).
- Su macOS, l'host nodo headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` tramite l'host exec dell'app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host app e fallire in modalità chiusa se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità nodo Mac

- L'app macOS nella barra dei menu si connette al server WS del Gateway come nodo (quindi `openclaw nodes …` funziona su questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta Gateway e si connette a `localhost`.

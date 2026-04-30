---
read_when:
    - Abbinamento dei nodi iOS/Android a un Gateway
    - Uso di canvas/camera del nodo per il contesto dell'agente
    - Aggiunta di nuovi comandi Node o helper CLI
summary: 'Node: associazione, capacità, autorizzazioni e helper CLI per canvas/camera/screen/device/notifications/system'
title: Nodi
x-i18n:
    generated_at: "2026-04-30T09:00:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

Un **node** è un dispositivo companion (macOS/iOS/Android/headless) che si connette al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [Protocollo Gateway](/it/gateway/protocol).

Trasporto legacy: [Protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL;
solo storico per i node attuali).

macOS può anche funzionare in **modalità node**: l’app nella barra dei menu si connette al server
WS del Gateway ed espone i propri comandi locali canvas/camera come node (quindi
`openclaw nodes …` funziona su questo Mac). In modalità Gateway remoto, l’automazione
del browser è gestita dall’host node della CLI (`openclaw node run` o dal
servizio node installato), non dal node dell’app nativa.

Note:

- I node sono **periferiche**, non Gateway. Non eseguono il servizio Gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano sul **Gateway**, non sui node.
- Runbook di risoluzione problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Associazione + stato

**I node WS usano l’associazione dei dispositivi.** I node presentano un’identità dispositivo durante `connect`; il Gateway
crea una richiesta di associazione dispositivo per `role: node`. Approva tramite la CLI dei dispositivi (o l’UI).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un node ritenta con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta
in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Riesegui
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un node come **associato** quando il relativo ruolo di associazione dispositivo include `node`.
- Il record di associazione dispositivo è il contratto durevole dei ruoli approvati. La rotazione
  dei token resta dentro quel contratto; non può promuovere un node associato a un
  ruolo diverso che l’approvazione dell’associazione non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) è un archivio separato di associazione
  dei node di proprietà del Gateway; **non** controlla l’handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` elimina voci obsolete da tale
  archivio separato di associazione dei node di proprietà del Gateway.
- L’ambito di approvazione segue i comandi dichiarati dalla richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi node non exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node remoto (system.run)

Usa un **host node** quando il tuo Gateway è in esecuzione su una macchina e vuoi che i comandi
vengano eseguiti su un’altra. Il modello parla comunque con il **Gateway**; il Gateway
inoltra le chiamate `exec` all’**host node** quando è selezionato `host=node`.

### Cosa viene eseguito dove

- **Host Gateway**: riceve messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host node**: esegue `system.run`/`system.which` sulla macchina del node.
- **Approvazioni**: applicate sull’host node tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni node basate su approvazione vincolano il contesto esatto della richiesta.
- Per esecuzioni dirette di file shell/runtime, OpenClaw fa anche il possibile per vincolare un operando file locale
  concreto e nega l’esecuzione se quel file cambia prima dell’esecuzione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interprete/runtime,
  l’esecuzione basata su approvazione viene negata invece di simulare una copertura runtime completa. Usa sandboxing,
  host separati o una allowlist esplicita e attendibile/un flusso di lavoro completo per semantiche di interprete più ampie.

### Avviare un host node (foreground)

Sulla macchina del node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (bind loopback)

Se il Gateway esegue il bind al loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host node remoti non possono connettersi direttamente. Crea un tunnel SSH e punta
l’host node all’estremità locale del tunnel.

Esempio (host node -> host Gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta autenticazione tramite token o password.
- Sono preferite le variabili d’ambiente: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l’host node ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei secondo le regole di precedenza remota.
- Se sono configurati SecretRefs `gateway.auth.*` locali attivi ma non risolti, l’autenticazione dell’host node fallisce in modo chiuso.
- La risoluzione dell’autenticazione dell’host node rispetta solo le variabili d’ambiente `OPENCLAW_GATEWAY_*`.

### Avviare un host node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Associare + nominare

Sull’host Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il node ritenta con dettagli di autenticazione modificati, riesegui `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persiste in `~/.openclaw/node.json` sul node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del Gateway).

### Inserire i comandi nella allowlist

Le approvazioni Exec sono **per host node**. Aggiungi voci allowlist dal Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni risiedono sull’host node in `~/.openclaw/exec-approvals.json`.

### Puntare exec al node

Configura i valori predefiniti (configurazione Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oppure per sessione:

```
/exec host=node security=allowlist node=<id-or-name>
```

Una volta impostato, ogni chiamata `exec` con `host=node` viene eseguita sull’host node (soggetta alla
allowlist/alle approvazioni del node).

`host=auto` non sceglierà implicitamente il node da solo, ma una richiesta esplicita per chiamata `host=node` è consentita da `auto`. Se vuoi che exec su node sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI host node](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

## Invocare comandi

Basso livello (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello superiore per i comuni flussi di lavoro “dai all’agente un allegato MEDIA”.

## Criterio dei comandi

I comandi node devono superare due controlli prima di poter essere invocati:

1. Il node deve dichiarare il comando nel proprio elenco WebSocket `connect.commands`.
2. Il criterio di piattaforma del Gateway deve consentire il comando dichiarato.

I node companion Windows e macOS consentono per impostazione predefinita comandi dichiarati sicuri come
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot`.
Comandi pericolosi o ad alto impatto sulla privacy come `camera.snap`, `camera.clip` e
`screen.record` richiedono comunque l’opt-in esplicito con
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` prevale sempre su
valori predefiniti e voci allowlist aggiuntive.

I comandi node di proprietà dei Plugin possono aggiungere un criterio Gateway node-invoke. Quel criterio
viene eseguito dopo il controllo allowlist e prima dell’inoltro al node, quindi `node.invoke` grezzo,
gli helper CLI e gli strumenti agente dedicati condividono lo stesso perimetro di autorizzazioni del Plugin.
I comandi node Plugin pericolosi richiedono comunque l’opt-in esplicito
`gateway.nodes.allowCommands`.

Dopo che un node modifica l’elenco dei comandi dichiarati, rifiuta la vecchia associazione dispositivo
e approva la nuova richiesta affinché il Gateway memorizzi lo snapshot aggiornato dei comandi.

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

## Foto + video (fotocamera node)

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

- Il node deve essere **in foreground** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata della clip viene limitata (attualmente `<= 60s`) per evitare payload base64 eccessivi.
- Android richiederà le autorizzazioni `CAMERA`/`RECORD_AUDIO` quando possibile; le autorizzazioni negate falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni dello schermo (node)

I node supportati espongono `screen.record` (mp4). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del node.
- Le registrazioni dello schermo sono limitate a `<= 60s`.
- `--no-audio` disabilita l’acquisizione del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare un display quando sono disponibili più schermi.

## Posizione (node)

I node espongono `location.get` quando la posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- “Sempre” richiede l’autorizzazione di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, accuratezza (metri) e timestamp.

## SMS (node Android)

I node Android possono esporre `sms.send` quando l’utente concede l’autorizzazione **SMS** e il dispositivo supporta la telefonia.

Invoke di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- La richiesta di autorizzazione deve essere accettata sul dispositivo Android prima che la capability venga annunciata.
- I dispositivi solo Wi-Fi senza telefonia non annunceranno `sms.send`.

## Comandi dispositivo Android + dati personali

I node Android possono annunciare ulteriori famiglie di comandi quando le capability corrispondenti sono abilitate.

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

- I comandi di movimento sono controllati dalle capability in base ai sensori disponibili.

## Comandi di sistema (host nodo / nodo Mac)

Il nodo macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host nodo headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione della shell ora passa tramite lo strumento `exec` con `host=node`; `nodes` rimane la superficie RPC diretta per i comandi espliciti del nodo.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi restano solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta concessa un'approvazione, il Gateway inoltra quel piano memorizzato, non eventuali campi command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dei permessi di notifica nell'app macOS.
- I metadati `platform` / `deviceFamily` del nodo non riconosciuti usano una allowlist predefinita conservativa che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di quei comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper di shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito richiesta vengono ridotti a una allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce allowlist viene persistita automaticamente.
- Sugli host nodo Windows in modalità allowlist, le esecuzioni wrapper shell tramite `cmd.exe /c` richiedono approvazione (la sola voce allowlist non consente automaticamente la forma wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host nodo ignorano gli override di `PATH` e rimuovono le chiavi pericolose di avvio/shell (`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`). Se ti servono voci PATH aggiuntive, configura l'ambiente del servizio host nodo (o installa gli strumenti in posizioni standard) invece di passare `PATH` tramite `--env`.
- In modalità nodo macOS, `system.run` è controllato dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano allo stesso modo dell'host nodo headless; i prompt negati restituiscono `SYSTEM_RUN_DENIED`.
- Nell'host nodo headless, `system.run` è controllato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Binding del nodo exec

Quando sono disponibili più nodi, puoi associare exec a un nodo specifico.
Questo imposta il nodo predefinito per `exec host=node` (e può essere sovrascritto per agente).

Predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agente:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Rimuovi l'impostazione per consentire qualsiasi nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## Mappa dei permessi

I nodi possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome del permesso (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concesso).

## Host nodo headless (multipiattaforma)

OpenClaw può eseguire un **host nodo headless** (senza UI) che si connette al WebSocket del Gateway
ed espone `system.run` / `system.which`. Questo è utile su Linux/Windows
o per eseguire un nodo minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- Il pairing è comunque richiesto (il Gateway mostrerà un prompt di pairing del dispositivo).
- L'host nodo memorizza il proprio id nodo, token, nome visualizzato e informazioni di connessione al Gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l'host nodo headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` tramite l'host exec dell'app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host app e fallire in modo chiuso se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità nodo Mac

- L'app della barra dei menu macOS si connette al server WS del Gateway come nodo (quindi `openclaw nodes …` funziona con questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si connette a `localhost`.

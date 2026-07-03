---
read_when:
    - Associazione dei nodi iOS/Android a un gateway
    - Utilizzo di node canvas/camera per il contesto dell'agente
    - Aggiunta di nuovi comandi Node o helper CLI
summary: 'Nodi: associazione, funzionalità, autorizzazioni e helper CLI per canvas/fotocamera/schermo/dispositivo/notifiche/sistema'
title: Nodi
x-i18n:
    generated_at: "2026-07-03T09:40:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

Un **node** è un dispositivo companion (macOS/iOS/Android/headless) che si connette al **WebSocket** del Gateway (stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [Protocollo Gateway](/it/gateway/protocol).

Trasporto legacy: [Protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL;
solo storico per i node attuali).

macOS può anche funzionare in **modalità node**: l'app nella barra dei menu si connette al server WS del Gateway ed espone i suoi comandi locali canvas/camera come node (così `openclaw nodes …` funziona contro questo Mac). In modalità gateway remoto, l'automazione del browser è gestita dall'host node della CLI (`openclaw node run` o il servizio node installato), non dal node dell'app nativa.

Note:

- I node sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano sul **gateway**, non sui node.
- Runbook per la risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Associazione + stato

**I node WS usano l'associazione del dispositivo.** I node presentano un'identità dispositivo durante `connect`; il Gateway crea una richiesta di associazione dispositivo per `role: node`. Approva tramite la CLI dei dispositivi (o l'interfaccia utente).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un node ritenta con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`. Riesegui `openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un node come **associato** quando il suo ruolo di associazione dispositivo include `node`.
- Il record di associazione dispositivo è il contratto durevole dei ruoli approvati. La rotazione del token resta dentro quel contratto; non può promuovere un node associato a un ruolo diverso che l'approvazione dell'associazione non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) è un archivio separato di associazioni node di proprietà del gateway; **non** controlla l'handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` rimuove un'associazione node. Per un node supportato da dispositivo, revoca il ruolo `node` del dispositivo in `devices/paired.json` e disconnette le sessioni con ruolo node di quel dispositivo: un dispositivo con ruoli misti mantiene la sua riga e perde solo il ruolo `node`, mentre una riga di dispositivo solo node viene eliminata. Cancella anche eventuali voci corrispondenti dall'archivio separato di associazioni node di proprietà del gateway. `operator.pairing` può rimuovere righe node non operatore; un chiamante con token dispositivo che revoca il proprio ruolo node su un dispositivo con ruoli misti richiede inoltre `operator.admin`.
- L'ambito di approvazione segue i comandi dichiarati dalla richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi node non exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host node remoto (system.run)

Usa un **host node** quando il Gateway gira su una macchina e vuoi eseguire i comandi su un'altra. Il modello parla comunque con il **gateway**; il gateway inoltra le chiamate `exec` all'**host node** quando è selezionato `host=node`.

### Cosa gira dove

- **Host Gateway**: riceve messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host node**: esegue `system.run`/`system.which` sulla macchina node.
- **Approvazioni**: applicate sull'host node tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni node supportate da approvazione vincolano l'esatto contesto della richiesta.
- Per esecuzioni dirette di file shell/runtime, OpenClaw prova anche a vincolare al meglio un operando file locale concreto e nega l'esecuzione se quel file cambia prima dell'esecuzione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando di interprete/runtime, l'esecuzione supportata da approvazione viene negata invece di fingere una copertura completa del runtime. Usa sandboxing, host separati o una allowlist/un workflow completo esplicitamente attendibile per semantiche di interprete più ampie.

### Avviare un host node (foreground)

Sulla macchina node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (bind loopback)

Se il Gateway si lega al loopback (`gateway.bind=loopback`, predefinito in modalità locale), gli host node remoti non possono connettersi direttamente. Crea un tunnel SSH e punta l'host node all'estremità locale del tunnel.

Esempio (host node -> host gateway):

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
- In modalità locale, l'host node ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei secondo le regole di precedenza remota.
- Se sono configurati SecretRefs `gateway.auth.*` locali attivi ma non risolti, l'autenticazione dell'host node fallisce chiusa.
- La risoluzione dell'autenticazione dell'host node onora solo le variabili d'ambiente `OPENCLAW_GATEWAY_*`.

### Avviare un host node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Associazione + nome

Sull'host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il node ritenta con dettagli di autenticazione modificati, riesegui `openclaw devices list` e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persiste in `~/.openclaw/node.json` sul node).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del gateway).

### Inserire i comandi nella allowlist

Le approvazioni exec sono **per host node**. Aggiungi voci di allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni risiedono sull'host node in `~/.openclaw/exec-approvals.json`.

### Puntare exec al node

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

Una volta impostato, qualsiasi chiamata `exec` con `host=node` viene eseguita sull'host node (soggetta alla allowlist/approvazioni del node).

`host=auto` non sceglierà implicitamente il node da solo, ma una richiesta esplicita per chiamata `host=node` è consentita da `auto`. Se vuoi che exec su node sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI dell'host node](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

### Inferenza modello locale

Un node desktop o server può esporre modelli compatibili con chat da un server Ollama in esecuzione su quel node. Gli agenti usano lo strumento `node_inference` del Plugin Ollama per scoprire i modelli installati ed eseguire un prompt limitato da remoto; il Gateway non richiede accesso di rete diretto a Ollama. Vedi [Inferenza Ollama locale al node](/it/providers/ollama#node-local-inference) per configurazione, filtro dei modelli e comandi di verifica diretta.

## Invocare comandi

Basso livello (RPC raw):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello più alto per i workflow comuni "dare all'agente un allegato MEDIA".

## Policy dei comandi

I comandi node devono superare due controlli prima di poter essere invocati:

1. Il node deve dichiarare il comando nel suo elenco WebSocket `connect.commands`.
2. La policy di piattaforma del gateway deve consentire il comando dichiarato.

I node companion Windows e macOS consentono per impostazione predefinita comandi dichiarati sicuri come `canvas.*`, `camera.list`, `location.get` e `screen.snapshot`. I node attendibili che pubblicizzano la capacità `talk` o dichiarano comandi `talk.*` consentono inoltre per impostazione predefinita i comandi push-to-talk dichiarati (`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`), indipendentemente dall'etichetta della piattaforma. Comandi pericolosi o ad alta sensibilità per la privacy come `camera.snap`, `camera.clip` e `screen.record` richiedono comunque un opt-in esplicito con `gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` prevale sempre sui valori predefiniti e sulle voci aggiuntive della allowlist.

I comandi node di proprietà dei Plugin possono aggiungere una policy Gateway node-invoke. Questa policy viene eseguita dopo il controllo della allowlist e prima dell'inoltro al node, quindi `node.invoke` raw, gli helper CLI e gli strumenti agent dedicati condividono lo stesso confine di autorizzazione del Plugin. I comandi node pericolosi dei Plugin richiedono comunque opt-in esplicito con `gateway.nodes.allowCommands`.

Dopo che un node modifica il suo elenco di comandi dichiarati, rifiuta la vecchia associazione dispositivo e approva la nuova richiesta, così il gateway memorizza lo snapshot aggiornato dei comandi.

## Configurazione (`openclaw.json`)

Le impostazioni relative ai node si trovano sotto `gateway.nodes` e `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

Usa nomi esatti dei comandi node. `denyCommands` rimuove un comando anche quando un valore predefinito di piattaforma o una voce `allowCommands` lo consentirebbe altrimenti. Vedi il [Riferimento di configurazione Gateway](/it/gateway/configuration-reference#gateway-field-details) per i dettagli dei campi di associazione node del gateway e policy dei comandi.

Override node exec per agente:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## Screenshot (snapshot canvas)

Se il node mostra il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

Helper CLI (scrive in un file temporaneo e stampa il percorso salvato):

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

- I nodi mobili usano una pagina A2UI integrata e di proprietà dell'app per il rendering con azioni.
- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).
- iOS e Android renderizzano pagine Gateway Canvas remote, ma le azioni dei pulsanti A2UI vengono inviate solo dalla pagina A2UI integrata e di proprietà dell'app. Le pagine A2UI HTTP/HTTPS ospitate dal Gateway sono di sola visualizzazione su quei client mobili.

## Foto + video (fotocamera del nodo)

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

- Il nodo deve essere **in primo piano** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata della clip viene limitata (attualmente `<= 60s`) per evitare payload base64 troppo grandi.
- Android richiederà le autorizzazioni `CAMERA`/`RECORD_AUDIO` quando possibile; le autorizzazioni negate falliscono con `*_PERMISSION_REQUIRED`.

## Registrazioni dello schermo (nodi)

I nodi supportati espongono `screen.record` (mp4). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- La disponibilità di `screen.record` dipende dalla piattaforma del nodo.
- Le registrazioni dello schermo sono limitate a `<= 60s`.
- `--no-audio` disabilita la cattura del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare un display quando sono disponibili più schermi.

## Posizione (nodi)

I nodi espongono `location.get` quando Posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- "Sempre" richiede l'autorizzazione di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, precisione (metri) e timestamp.

## SMS (nodi Android)

I nodi Android possono esporre `sms.send` quando l'utente concede l'autorizzazione **SMS** e il dispositivo supporta la telefonia.

Invocazione di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- La richiesta di autorizzazione deve essere accettata sul dispositivo Android prima che la capacità venga annunciata.
- I dispositivi solo Wi-Fi senza telefonia non annunceranno `sms.send`.

## Comandi dispositivo Android + dati personali

I nodi Android possono annunciare famiglie di comandi aggiuntive quando le capacità corrispondenti sono abilitate.

Famiglie disponibili:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` quando la condivisione delle app installate è abilitata nelle impostazioni Android
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

Esempi di invocazioni:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Note:

- `device.apps` è opt-in e restituisce per impostazione predefinita le app visibili nel launcher.
- I comandi di movimento sono vincolati alle capacità dei sensori disponibili.

## Comandi di sistema (host del nodo / nodo Mac)

Il nodo macOS espone `system.run`, `system.notify` e `system.execApprovals.get/set`.
L'host del nodo headless espone `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` rimane la superficie RPC diretta per comandi espliciti del nodo.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi rimangono solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta concessa un'approvazione, il gateway inoltra quel piano memorizzato, non eventuali campi command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dell'autorizzazione alle notifiche nell'app macOS.
- I metadati `platform` / `deviceFamily` del nodo non riconosciuti usano una allowlist predefinita conservativa che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di quei comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito di richiesta sono ridotti a una allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce della allowlist viene persistita automaticamente.
- Sugli host di nodi Windows in modalità allowlist, le esecuzioni di wrapper shell tramite `cmd.exe /c` richiedono approvazione (la sola voce della allowlist non autorizza automaticamente la forma wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host dei nodi ignorano gli override di `PATH` e rimuovono chiavi di avvio/shell pericolose (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Se ti servono voci PATH aggiuntive, configura l'ambiente del servizio dell'host del nodo (o installa gli strumenti in percorsi standard) invece di passare `PATH` tramite `--env`.
- In modalità nodo macOS, `system.run` è vincolato alle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come l'host del nodo headless; le richieste negate restituiscono `SYSTEM_RUN_DENIED`.
- Sull'host del nodo headless, `system.run` è vincolato alle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Binding nodo exec

Quando sono disponibili più nodi, puoi associare exec a un nodo specifico.
Questo imposta il nodo predefinito per `exec host=node` (e può essere sovrascritto per agente).

Predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Override per agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Annulla l'impostazione per consentire qualsiasi nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mappa delle autorizzazioni

I nodi possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome dell'autorizzazione (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concessa).

## Host del nodo headless (cross-platform)

OpenClaw può eseguire un **host del nodo headless** (senza UI) che si connette al WebSocket del Gateway ed espone `system.run` / `system.which`. Questo è utile su Linux/Windows o per eseguire un nodo minimo accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- Il pairing è ancora richiesto (il Gateway mostrerà una richiesta di pairing del dispositivo).
- L'host del nodo archivia il proprio ID nodo, token, nome visualizzato e informazioni di connessione al gateway in `~/.openclaw/node.json`.
- Le approvazioni exec sono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l'host del nodo headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` attraverso l'host exec dell'app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host dell'app e fallire in modo chiuso se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità nodo Mac

- L'app della barra dei menu macOS si connette al server WS del Gateway come nodo (quindi `openclaw nodes …` funziona con questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si connette a `localhost`.

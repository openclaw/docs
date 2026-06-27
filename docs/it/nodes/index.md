---
read_when:
    - Associazione di nodi iOS/Android a un Gateway
    - Uso di node canvas/fotocamera per il contesto dell'agente
    - Aggiungere nuovi comandi Node o helper CLI
summary: 'Nodi: associazione, capacità, permessi e helper CLI per canvas/fotocamera/schermo/dispositivo/notifiche/sistema'
title: Nodi
x-i18n:
    generated_at: "2026-06-27T17:42:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e860f051faeeea2d7461d07d2119a7f11f80812aa87896882f11edee36667e4a
    source_path: nodes/index.md
    workflow: 16
---

Un **nodo** è un dispositivo companion (macOS/iOS/Android/headless) che si connette al **WebSocket** del Gateway (la stessa porta degli operatori) con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. Dettagli del protocollo: [protocollo Gateway](/it/gateway/protocol).

Trasporto legacy: [protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL;
solo storico per i nodi attuali).

macOS può anche funzionare in **modalità nodo**: l’app nella barra dei menu si connette al server WS del Gateway ed espone i suoi comandi locali di canvas/camera come nodo (quindi `openclaw nodes …` funziona contro questo Mac). In modalità gateway remoto, l’automazione del browser è gestita dall’host nodo della CLI (`openclaw node run` o il servizio nodo installato), non dal nodo dell’app nativa.

Note:

- I nodi sono **periferiche**, non gateway. Non eseguono il servizio gateway.
- I messaggi Telegram/WhatsApp/ecc. arrivano sul **gateway**, non sui nodi.
- Runbook per la risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Abbinamento + stato

**I nodi WS usano l’abbinamento del dispositivo.** I nodi presentano un’identità del dispositivo durante `connect`; il Gateway
crea una richiesta di abbinamento del dispositivo per `role: node`. Approvala tramite la CLI dei dispositivi (o l’interfaccia utente).

CLI rapida:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Se un nodo riprova con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la richiesta
in sospeso precedente viene sostituita e viene creato un nuovo `requestId`. Esegui di nuovo
`openclaw devices list` prima di approvare.

Note:

- `nodes status` contrassegna un nodo come **abbinato** quando il ruolo di abbinamento del dispositivo include `node`.
- Il record di abbinamento del dispositivo è il contratto durevole per il ruolo approvato. La rotazione del token rimane dentro quel contratto; non può promuovere un nodo abbinato a un ruolo diverso che l’approvazione dell’abbinamento non ha mai concesso.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) è un archivio separato di abbinamenti di nodi di proprietà del gateway; **non** controlla l’handshake WS `connect`.
- `openclaw nodes remove --node <id|name|ip>` rimuove un abbinamento di nodo. Per un nodo basato su dispositivo revoca il ruolo `node` del dispositivo in `devices/paired.json` e disconnette le sessioni con ruolo nodo di quel dispositivo: un dispositivo con ruoli misti mantiene la sua riga e perde solo il ruolo `node`, mentre una riga di dispositivo solo nodo viene eliminata. Cancella anche qualsiasi voce corrispondente dall’archivio separato di abbinamenti di nodi di proprietà del gateway. `operator.pairing` può rimuovere righe di nodi non operatori; un chiamante con token dispositivo che revoca il proprio ruolo nodo su un dispositivo con ruoli misti necessita inoltre di `operator.admin`.
- L’ambito di approvazione segue i comandi dichiarati dalla richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi nodo non exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Host nodo remoto (system.run)

Usa un **host nodo** quando il tuo Gateway è in esecuzione su una macchina e vuoi che i comandi
vengano eseguiti su un’altra. Il modello continua a parlare con il **gateway**; il gateway
inoltra le chiamate `exec` all’**host nodo** quando è selezionato `host=node`.

### Cosa viene eseguito dove

- **Host Gateway**: riceve messaggi, esegue il modello, instrada le chiamate agli strumenti.
- **Host nodo**: esegue `system.run`/`system.which` sulla macchina del nodo.
- **Approvazioni**: applicate sull’host nodo tramite `~/.openclaw/exec-approvals.json`.

Nota sulle approvazioni:

- Le esecuzioni del nodo basate su approvazione vincolano l’esatto contesto della richiesta.
- Per esecuzioni dirette di file shell/runtime, OpenClaw prova anche, al meglio, a vincolare un operando di file locale concreto e nega l’esecuzione se quel file cambia prima dell’esecuzione.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando di interprete/runtime, l’esecuzione basata su approvazione viene negata invece di fingere una copertura completa del runtime. Usa sandboxing, host separati o una allowlist/workflow completo esplicitamente attendibile per semantiche di interprete più ampie.

### Avviare un host nodo (foreground)

Sulla macchina del nodo:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### Gateway remoto tramite tunnel SSH (binding loopback)

Se il Gateway si associa a loopback (`gateway.bind=loopback`, predefinito in modalità locale),
gli host nodo remoti non possono connettersi direttamente. Crea un tunnel SSH e punta l’host
nodo all’estremità locale del tunnel.

Esempio (host nodo -> host gateway):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta l’autenticazione tramite token o password.
- Sono preferite le variabili d’ambiente: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l’host nodo ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei secondo le regole di precedenza remota.
- Se sono configurati SecretRefs `gateway.auth.*` locali attivi ma non risolti, l’autenticazione dell’host nodo fallisce in modo chiuso.
- La risoluzione dell’autenticazione dell’host nodo onora solo le variabili d’ambiente `OPENCLAW_GATEWAY_*`.

### Avviare un host nodo (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### Abbinare + assegnare un nome

Sull’host gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il nodo riprova con dettagli di autenticazione modificati, esegui di nuovo `openclaw devices list`
e approva il `requestId` corrente.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (persiste in `~/.openclaw/node.json` sul nodo).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (override del gateway).

### Inserire i comandi nella allowlist

Le approvazioni exec sono **per host nodo**. Aggiungi voci alla allowlist dal gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni risiedono sull’host nodo in `~/.openclaw/exec-approvals.json`.

### Puntare exec al nodo

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

Una volta impostato, qualsiasi chiamata `exec` con `host=node` viene eseguita sull’host nodo (soggetta alla
allowlist/approvazioni del nodo).

`host=auto` non sceglierà implicitamente il nodo da solo, ma da `auto` è consentita una richiesta esplicita per chiamata `host=node`. Se vuoi che l’exec sul nodo sia il valore predefinito per la sessione, imposta esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Correlati:

- [CLI host nodo](/it/cli/node)
- [Strumento exec](/it/tools/exec)
- [Approvazioni exec](/it/tools/exec-approvals)

## Invocazione dei comandi

Basso livello (RPC grezzo):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

Esistono helper di livello più alto per i workflow comuni “dai all’agente un allegato MEDIA”.

## Criterio dei comandi

I comandi nodo devono superare due controlli prima di poter essere invocati:

1. Il nodo deve dichiarare il comando nel suo elenco WebSocket `connect.commands`.
2. Il criterio di piattaforma del gateway deve consentire il comando dichiarato.

I nodi companion Windows e macOS consentono per impostazione predefinita comandi dichiarati sicuri come
`canvas.*`, `camera.list`, `location.get` e `screen.snapshot`.
I nodi attendibili che pubblicizzano la capability `talk` o dichiarano comandi `talk.*`
consentono per impostazione predefinita anche i comandi push-to-talk dichiarati (`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`), indipendentemente dall’etichetta della piattaforma.
Comandi pericolosi o ad alto impatto sulla privacy come `camera.snap`, `camera.clip` e
`screen.record` richiedono comunque l’opt-in esplicito con
`gateway.nodes.allowCommands`. `gateway.nodes.denyCommands` prevale sempre su
valori predefiniti e voci aggiuntive della allowlist.

I comandi nodo di proprietà dei Plugin possono aggiungere un criterio Gateway node-invoke. Quel criterio
viene eseguito dopo il controllo della allowlist e prima dell’inoltro al nodo, quindi `node.invoke`
grezzo, helper CLI e strumenti agente dedicati condividono lo stesso confine di autorizzazione del Plugin. I comandi nodo pericolosi dei Plugin richiedono comunque
l’opt-in esplicito `gateway.nodes.allowCommands`.

Dopo che un nodo modifica il proprio elenco di comandi dichiarati, rifiuta il vecchio abbinamento del dispositivo
e approva la nuova richiesta in modo che il gateway memorizzi lo snapshot aggiornato dei comandi.

## Configurazione (`openclaw.json`)

Le impostazioni relative ai nodi risiedono sotto `gateway.nodes` e `tools.exec`:

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

Usa nomi esatti dei comandi nodo. `denyCommands` rimuove un comando anche quando un
valore predefinito di piattaforma o una voce `allowCommands` lo consentirebbe altrimenti. Vedi
[riferimento alla configurazione del Gateway](/it/gateway/configuration-reference#gateway-field-details)
per i dettagli sui campi di abbinamento dei nodi gateway e del criterio dei comandi.

Override del nodo exec per agente:

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

Se il nodo sta mostrando il Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

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

- I nodi mobili usano una pagina A2UI in bundle e di proprietà dell’app per il rendering con supporto alle azioni.
- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).
- iOS e Android renderizzano pagine Canvas del Gateway remoto, ma le azioni dei pulsanti A2UI vengono inviate solo dalla pagina A2UI in bundle e di proprietà dell’app. Le pagine A2UI HTTP/HTTPS ospitate dal Gateway sono solo renderizzate su quei client mobili.

## Foto + video (fotocamera del nodo)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # predefinito: entrambe le fotocamere (2 righe MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il nodo deve essere **in primo piano** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- La durata del clip è limitata (attualmente `<= 60s`) per evitare payload base64 troppo grandi.
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
- `--no-audio` disabilita l'acquisizione del microfono sulle piattaforme supportate.
- Usa `--screen <index>` per selezionare un display quando sono disponibili più schermi.

## Posizione (nodi)

I nodi espongono `location.get` quando la Posizione è abilitata nelle impostazioni.

Helper CLI:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La Posizione è **disattivata per impostazione predefinita**.
- "Sempre" richiede l'autorizzazione di sistema; il recupero in background è best-effort.
- La risposta include lat/lon, precisione (metri) e timestamp.

## SMS (nodi Android)

I nodi Android possono esporre `sms.send` quando l'utente concede l'autorizzazione **SMS** e il dispositivo supporta la telefonia.

Invoke a basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- La richiesta di autorizzazione deve essere accettata sul dispositivo Android prima che la capability venga pubblicizzata.
- I dispositivi solo Wi-Fi senza telefonia non pubblicizzeranno `sms.send`.

## Comandi Android per dispositivo e dati personali

I nodi Android possono pubblicizzare famiglie di comandi aggiuntive quando le capability corrispondenti sono abilitate.

Famiglie disponibili:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `device.apps` quando la condivisione delle app installate è abilitata nelle Impostazioni Android
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
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

Note:

- `device.apps` è opt-in e restituisce per impostazione predefinita le app visibili nel launcher.
- I comandi di movimento sono vincolati alle capability dai sensori disponibili.

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
- L'esecuzione della shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` resta la superficie RPC diretta per comandi espliciti del nodo.
- `nodes invoke` non espone `system.run` né `system.run.prepare`; questi restano solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Una volta
  concessa un'approvazione, il gateway inoltra quel piano memorizzato, non eventuali campi
  command/cwd/session modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dei permessi di notifica nell'app macOS.
- I metadati `platform` / `deviceFamily` del nodo non riconosciuti usano una allowlist predefinita prudente che esclude `system.run` e `system.which`. Se hai intenzionalmente bisogno di questi comandi per una piattaforma sconosciuta, aggiungili esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` con ambito di richiesta sono ridotti a una allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservano i percorsi degli eseguibili interni invece dei percorsi dei wrapper. Se l'unwrapping non è sicuro, nessuna voce di allowlist viene conservata automaticamente.
- Sugli host di nodi Windows in modalità allowlist, le esecuzioni tramite wrapper shell con `cmd.exe /c` richiedono approvazione (la sola voce di allowlist non consente automaticamente la forma wrapper).
- `system.notify` supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- Gli host Node ignorano gli override di `PATH` e rimuovono le chiavi di avvio/shell pericolose (`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`). Se hai bisogno di voci PATH aggiuntive, configura l'ambiente del servizio host del nodo (o installa gli strumenti in posizioni standard) invece di passare `PATH` tramite `--env`.
- In modalità nodo macOS, `system.run` è vincolato dalle approvazioni exec nell'app macOS (Impostazioni → Approvazioni exec).
  Ask/allowlist/full si comportano come nell'host del nodo headless; le richieste negate restituiscono `SYSTEM_RUN_DENIED`.
- Nell'host del nodo headless, `system.run` è vincolato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`).

## Associazione del nodo exec

Quando sono disponibili più nodi, puoi associare exec a un nodo specifico.
Questo imposta il nodo predefinito per `exec host=node` (e può essere sovrascritto per ogni agente).

Valore predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sostituzione per agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Annulla l’impostazione per consentire qualsiasi nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mappa delle autorizzazioni

I nodi possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome dell’autorizzazione (ad es. `screenRecording`, `accessibility`) con valori booleani (`true` = concessa).

## Host di nodo headless (multipiattaforma)

OpenClaw può eseguire un **host di nodo headless** (senza UI) che si connette al WebSocket del Gateway
ed espone `system.run` / `system.which`. È utile su Linux/Windows
o per eseguire un nodo minimale accanto a un server.

Avvialo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- L’abbinamento è comunque richiesto (il Gateway mostrerà una richiesta di abbinamento del dispositivo).
- L’host di nodo archivia il proprio ID nodo, token, nome visualizzato e informazioni di connessione al gateway in `~/.openclaw/node.json`.
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json`
  (vedi [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l’host di nodo headless esegue `system.run` localmente per impostazione predefinita. Imposta
  `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` tramite l’host exec dell’app companion; aggiungi
  `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l’host app e fallire in modo chiuso se non è disponibile.
- Aggiungi `--tls` / `--tls-fingerprint` quando il WS del Gateway usa TLS.

## Modalità nodo Mac

- L’app nella barra dei menu di macOS si connette al server WS del Gateway come nodo (quindi `openclaw nodes …` funziona con questo Mac).
- In modalità remota, l’app apre un tunnel SSH per la porta del Gateway e si connette a `localhost`.

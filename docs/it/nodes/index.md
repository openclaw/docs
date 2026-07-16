---
read_when:
    - Associazione dei nodi iOS/watchOS/Android a un Gateway
    - Utilizzo del canvas/della fotocamera del Node per il contesto dell'agente
    - Aggiunta di nuovi comandi Node o helper CLI
summary: 'Node: associazione, funzionalità, autorizzazioni e helper CLI per canvas/fotocamera/schermo/dispositivo/notifiche/sistema'
title: Nodi
x-i18n:
    generated_at: "2026-07-16T14:34:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

Un **Node** è un dispositivo complementare (macOS/iOS/watchOS/Android/headless) che si connette al Gateway con `role: "node"` ed espone una superficie di comandi (ad es. `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`) tramite `node.invoke`. La maggior parte dei Node usa il WebSocket del Gateway sulla porta dell'operatore. Il Node Apple Watch diretto opzionale usa il polling HTTPS firmato sulla stessa porta, poiché watchOS blocca le comunicazioni di rete generiche di basso livello per le normali app. Dettagli del protocollo: [Protocollo del Gateway](/it/gateway/protocol).

Trasporto legacy: [Protocollo Bridge](/it/gateway/bridge-protocol) (TCP JSONL; solo storico per i Node attuali).

macOS può essere eseguito anche in **modalità Node**: l'app della barra dei menu si connette al server
WS del Gateway come un singolo Node (quindi `openclaw nodes …` funziona su questo Mac). L'app
aggiunge comandi nativi per Canvas, fotocamera, schermo, notifiche e controllo del computer
alla stessa superficie di comandi dell'host Node usata da `openclaw node run`. Non avviare un
secondo Node CLI su quel Mac; l'app esegue il runtime host del Node CLI corrispondente come
worker interno e rimane l'unica connessione al Gateway e l'unica identità del Node.

I Node sono **periferiche**, non Gateway: non eseguono il servizio Gateway e i messaggi dei canali (Telegram, WhatsApp, ecc.) arrivano al Gateway, non ai Node.

Procedura di risoluzione dei problemi: [/nodes/troubleshooting](/it/nodes/troubleshooting)

## Associazione e stato

I Node usano l'**associazione dei dispositivi**. Durante la connessione, un Node presenta un'identità del dispositivo firmata; il Gateway crea una richiesta di associazione del dispositivo per `role: node`. Approvarla tramite la CLI dei dispositivi (o l'interfaccia utente). La configurazione diretta di Apple Watch usa un codice di configurazione di breve durata, riservato ai Node e generato da un amministratore, per approvare la sua superficie di comandi fissa e a basso rischio; una successiva espansione delle funzionalità richiede comunque l'approvazione normale.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

Le richieste di associazione in sospeso scadono 5 minuti dopo l'ultimo tentativo del dispositivo: un dispositivo che continua a riconnettersi mantiene attiva la propria unica richiesta in sospeso (e `requestId`), anziché generare una nuova richiesta ogni pochi minuti; consultare [Associazione dei Node](/it/gateway/pairing) per il ciclo completo di richiesta e approvazione. Se un Node riprova con dettagli di autenticazione modificati (ruolo/ambiti/chiave pubblica), la precedente richiesta in sospeso viene sostituita e viene creato un nuovo `requestId`: i client ricevono un evento `device.pair.resolved` per la richiesta sostituita ed è necessario eseguire nuovamente `openclaw devices list` prima dell'approvazione.

- `nodes status` contrassegna un Node come **associato** quando il relativo ruolo di associazione del dispositivo include `node`.
- Un Mac nativo connesso e dotato dell'autorizzazione Accessibilità può segnalare l'attività
  aggregata degli input fisici. Il Gateway contrassegna il Mac idoneo con i dati più recenti come
  `active`, fornisce all'agente un'indicazione stabile dell'ID del Node e vi instrada gli avvisi
  di connessione del Node prima di ricorrere a un fallback ritardato. Consultare
  [Presenza del computer attivo](/nodes/presence) per configurazione, privacy, tempistiche e
  risoluzione dei problemi.
- Il record di associazione del dispositivo costituisce il contratto persistente dei ruoli approvati. La rotazione dei token rimane entro tale contratto; non può assegnare a un Node associato un ruolo mai concesso dall'approvazione dell'associazione.
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject/remove/rename`) è un archivio separato delle associazioni dei Node, gestito dal Gateway, che tiene traccia della superficie di comandi/funzionalità approvata del Node tra le riconnessioni. **Non** controlla l'autenticazione del trasporto: questo compito spetta all'associazione del dispositivo.
- `openclaw nodes remove --node <id|name|ip>` rimuove un'associazione del Node. Per un Node basato su dispositivo, revoca il ruolo `node` del dispositivo nell'archivio dei dispositivi associati e disconnette le sessioni del ruolo Node di tale dispositivo: un dispositivo con più ruoli conserva la propria riga e perde solo il ruolo `node`, mentre la riga di un dispositivo riservato ai Node viene eliminata. Rimuove inoltre qualsiasi voce corrispondente dall'archivio separato delle associazioni dei Node. `operator.pairing` può rimuovere righe di Node non operatore su altri dispositivi; un chiamante con token del dispositivo che revoca il proprio ruolo Node su un dispositivo con più ruoli necessita inoltre di `operator.admin`.
- L'ambito dell'approvazione segue i comandi dichiarati nella richiesta in sospeso:
  - richiesta senza comandi: `operator.pairing`
  - comandi del Node diversi da exec: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## Disallineamento delle versioni e ordine di aggiornamento

Il WebSocket del Gateway accetta client Node autenticati entro una finestra di protocollo N-1.
Il Gateway v4 attuale accetta quindi Node v3 quando la connessione dichiara
sia `role: "node"` sia `client.mode: "node"`. Le sessioni dell'operatore e dell'interfaccia utente devono
continuare a usare il protocollo attuale.

Per gli aggiornamenti graduali del parco dispositivi, aggiornare prima il Gateway, quindi ogni Node.
Un Node N-1 rimane visibile e gestibile durante l'aggiornamento; il Gateway
registra `legacy node protocol accepted` con una raccomandazione di aggiornamento. L'associazione,
l'autenticazione del dispositivo, gli elenchi di comandi consentiti e le approvazioni exec continuano ad applicarsi.
Le funzionalità e i comandi gestiti dai Plugin rimangono nascosti finché il Node non viene aggiornato
al protocollo attuale. I Node precedenti a N-1 richiedono un aggiornamento fuori banda prima
di potersi riconnettere.

Il trasporto HTTPS diretto di watchOS richiede la versione attuale del protocollo; aggiornare
l'app dell'orologio insieme al Gateway prima di abilitare la modalità diretta.

## Host Node remoto (system.run)

Usare un **host Node** quando il Gateway viene eseguito su una macchina e si desidera eseguire i comandi su un'altra. Il modello continua a comunicare con il **Gateway**; il Gateway inoltra le chiamate `exec` all'**host Node** quando è selezionato `host=node`.

| Ruolo        | Responsabilità                                                    |
| ------------ | ----------------------------------------------------------------- |
| Host Gateway | Riceve i messaggi, esegue il modello e instrada le chiamate agli strumenti. |
| Host Node    | Esegue `system.run`/`system.which` sulla macchina del Node.       |
| Approvazioni | Applicate sull'host Node tramite `~/.openclaw/exec-approvals.json`. |

Nota sulle approvazioni:

- Le esecuzioni del Node basate sull'approvazione sono vincolate al contesto esatto della richiesta. Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione; una volta concessa, il Gateway inoltra il piano memorizzato, non eventuali campi di comando/cwd/sessione modificati successivamente dal chiamante, e convalida nuovamente la directory di lavoro prima dell'esecuzione.
- Per le esecuzioni dirette di file tramite shell/runtime, OpenClaw tenta inoltre di vincolare un singolo operando file locale concreto e nega l'esecuzione se tale file cambia prima dell'avvio.
- Se OpenClaw non riesce a identificare esattamente un singolo file locale concreto per un comando di interprete/runtime, l'esecuzione basata sull'approvazione viene negata anziché simulare una copertura completa del runtime. Per una semantica più ampia dell'interprete, usare il sandboxing, host separati oppure un elenco esplicito di elementi attendibili o un flusso di lavoro completo.

### Avviare un host Node (in primo piano)

Sulla macchina del Node:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` accetta anche `--context-path` (percorso di contesto WS del Gateway), `--tls`, `--tls-fingerprint <sha256>` e `--node-id` (sostituisce l'ID legacy dell'istanza client; non reimposta l'associazione).

### Gateway remoto tramite tunnel SSH (binding di loopback)

Se il Gateway esegue il binding al loopback (`gateway.bind=loopback`, impostazione predefinita in modalità locale), gli host Node remoti non possono connettersi direttamente. Creare un tunnel SSH e indirizzare l'host Node verso l'estremità locale del tunnel.

Esempio (host Node -> host Gateway):

```bash
# Terminale A (lasciare in esecuzione): inoltra la porta locale 18790 -> Gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminale B: esporta il token del Gateway e si connette tramite il tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

Note:

- `openclaw node run` supporta l'autenticazione tramite token o password.
- È preferibile usare le variabili di ambiente: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- Il fallback di configurazione è `gateway.auth.token` / `gateway.auth.password`.
- In modalità locale, l'host Node ignora intenzionalmente `gateway.remote.token` / `gateway.remote.password`.
- In modalità remota, `gateway.remote.token` / `gateway.remote.password` sono idonei in base alle regole di precedenza remota.
- Se sono configurati `gateway.auth.*` SecretRef locali attivi ma non risolti, l'autenticazione dell'host Node viene negata in modo sicuro.
- La risoluzione dell'autenticazione dell'host Node considera solo le variabili di ambiente `OPENCLAW_GATEWAY_*`.

### Avviare un host Node (servizio)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` accetta anche `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id` (solo ID legacy dell'istanza client), `--runtime <node>` (valore predefinito: Node) e `--force` per reinstallare. Sono disponibili anche `node status`, `node stop` e `node uninstall`.

### Associare e assegnare un nome

Sull'host del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Se il Node riprova con dettagli di autenticazione modificati, eseguire nuovamente `openclaw devices list` e approvare il `requestId` attuale.

Opzioni di denominazione:

- `--display-name` su `openclaw node run` / `openclaw node install` (viene mantenuto nella riga SQLite condivisa `node_host_config` insieme all'ID dell'istanza client e ai metadati di connessione del Gateway).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (sostituzione del Gateway).

### Server MCP ospitati sul Node

Configurare i server MCP in `openclaw.json` sulla macchina del Node, non sul
Gateway:

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

L'host Node headless avvia questi server, elenca i relativi strumenti e pubblica
i descrittori dopo la connessione. Le chiamate agli strumenti ritornano a quel Node tramite
`mcp.tools.call.v1`; il Gateway non necessita di una configurazione MCP corrispondente né di un
Plugin JS. I server MCP OAuth non sono supportati da questo percorso v1 ospitato sul Node.

Gli host Node attuali dichiarano la famiglia di comandi integrata `mcp.tools.call.v1` durante
l'associazione iniziale, anche quando non è configurato alcun server MCP. Un Node associato con una
versione precedente di OpenClaw può richiedere un aggiornamento una tantum della superficie di comandi dopo
l'aggiornamento dell'host Node. L'aggiunta, la rimozione o il filtraggio dei server in seguito non
richiede una nuova associazione, perché la famiglia di comandi approvata non cambia. Riavviare
`openclaw node run` o `openclaw node restart` per applicare le modifiche alla configurazione MCP del Node;
l'host Node non monitora questa configurazione.

Gli operatori del Gateway possono ignorare tutti gli strumenti visibili agli agenti pubblicati dai Node associati,
inclusi gli strumenti MCP ospitati sul Node, con
`gateway.nodes.pluginTools.enabled: false`. Anche i divieti di comandi esatti, come
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`, ne bloccano l'esecuzione.

### Skills ospitate sul Node

Installare le Skills nella directory Skills attiva di OpenClaw sulla macchina del Node,
`~/.openclaw/skills` per impostazione predefinita. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` e
`OPENCLAW_CONFIG_PATH` spostano tale profilo attivo. `OPENCLAW_STATE_DIR` ha la
precedenza per le Skills; in caso contrario, `skills/` si trova accanto al percorso stampato da
`openclaw config file`. L'host Node headless pubblica i file `SKILL.md` validi
dopo la connessione e il Gateway li aggiunge alle istantanee delle Skills dell'agente solo finché
quel Node rimane connesso. Il nome di ogni directory delle Skills deve corrispondere al campo
frontmatter `name`, in modo che il localizzatore astratto del Node venga associato a una singola voce senza aggiungere
un altro campo del protocollo.

L'associazione iniziale del ruolo del nodo approva la pubblicazione delle skill. L'aggiunta, la rimozione o
la modifica delle skill non richiede un'altra associazione né una modifica della configurazione del
Gateway. Riavviare `openclaw node run` o `openclaw node restart` dopo aver modificato
i file delle skill del nodo; l'host del nodo non monitora la directory delle skill.

Le voci delle skill ospitate sul nodo identificano il relativo nodo e includono la posizione
di esecuzione. I file delle skill, i percorsi relativi referenziati e i binari rimangono su tale
nodo. L'agente legge la posizione `node://.../SKILL.md` pubblicizzata con il normale
strumento `read`. `file_fetch` accetta percorsi assoluti del nodo approvati dall'operatore,
non localizzatori delle skill del nodo; i runtime privi del normale strumento di lettura possono invece eseguire
`cat SKILL.md` tramite `exec host=node node=<node-id>` usando la directory
`node://.../skills/<name>` pubblicizzata come `workdir`. I file e i binari referenziati
usano la stessa destinazione di esecuzione e la stessa directory di lavoro. L'host del nodo risolve tale localizzatore rispetto
alla propria directory di stato OpenClaw attiva, quindi i percorsi relativi vengono risolti sul nodo anziché
sulla macchina del Gateway. Il nodo che pubblica deve aver approvato `system.run`
e la politica di esecuzione dell'agente deve consentire `host=node`; in caso contrario, la skill resta
esclusa dall'istantanea dell'agente.

Impostare `nodeHost.skills.enabled: false` sul nodo per interrompere la pubblicazione. Gli operatori del Gateway
possono ignorare le skill provenienti da tutti i nodi associati tramite
`gateway.nodes.skills.enabled: false`.

### Stato dell'identità headless

Il nodo headless conserva tre record di stato distinti:

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): l'ID dell'istanza client, il nome visualizzato e i metadati della connessione al Gateway.
- `~/.openclaw/identity/device.json`: la coppia di chiavi firmata del dispositivo e l'ID crittografico del dispositivo derivato.
- `~/.openclaw/identity/device-auth.json`: i token di autenticazione dei dispositivi associati, indicizzati per ID crittografico del dispositivo e ruolo.

Per un nodo firmato, il Gateway usa l'ID crittografico del dispositivo per l'associazione e
l'instradamento del nodo. L'ID dell'istanza client è costituito esclusivamente da metadati della connessione. La modifica di
`--node-id` o la migrazione di un `node.json` ritirato non reimposta quindi l'associazione. Consultare
[Stato dell'identità e dell'associazione](/it/cli/node#identity-and-pairing-state) per il
flusso supportato di revoca e nuova associazione e per le note sull'aggiornamento.

### Inserire i comandi nell'elenco consentito

Le approvazioni dell'esecuzione sono **specifiche per ciascun host del nodo**. Aggiungere le voci all'elenco consentito dal Gateway:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

Le approvazioni risiedono sull'host del nodo in `~/.openclaw/exec-approvals.json`.

### Indirizzare l'esecuzione al nodo

Configurare i valori predefiniti (configurazione del Gateway):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

Oppure, per singola sessione:

```text
/exec host=node security=allowlist node=<id-or-name>
```

Dopo la configurazione, qualsiasi chiamata `exec` con `host=node` viene eseguita sull'host del nodo (nel rispetto dell'elenco consentito e delle approvazioni del nodo).

`host=auto` non seleziona implicitamente il nodo in autonomia, ma da `auto` è consentita una richiesta esplicita `host=node` per singola chiamata. Per rendere l'esecuzione sul nodo l'impostazione predefinita della sessione, impostare esplicitamente `tools.exec.host=node` o `/exec host=node ...`.

Argomenti correlati:

- [CLI dell'host del nodo](/it/cli/node)
- [Strumento di esecuzione](/it/tools/exec)
- [Approvazioni dell'esecuzione](/it/tools/exec-approvals)

### Inferenza del modello locale

Un nodo desktop o server può esporre modelli con funzionalità di chat da un server Ollama in esecuzione su tale nodo. Gli agenti usano lo strumento `node_inference` del plugin Ollama per rilevare i modelli installati ed eseguire da remoto un prompt con limiti definiti; il Gateway non necessita di accesso diretto alla rete verso Ollama. Consultare [Inferenza Ollama locale al nodo](/it/providers/ollama#node-local-inference) per la configurazione, il filtraggio dei modelli e i comandi di verifica diretta.

### Sessioni e trascrizioni Codex

Il plugin ufficiale `codex` può esporre le sessioni Codex non archiviate su un
host del nodo headless o su un nodo macOS nativo. La registrazione del catalogo non dipende più
da `supervision.enabled`; tale opzione controlla gli strumenti di supervisione accessibili all'agente.
Impostare `sessionCatalog.enabled: false` nella configurazione del plugin Codex per disabilitare i
comandi del catalogo dell'operatore e del catalogo dei nodi associati senza disabilitare il
provider o l'harness.
Il plugin deve comunque essere attivo su entrambi i computer e l'impostazione del nodo resta
un consenso locale: l'attivazione sul solo Gateway non consente di leggere lo stato Codex
di un altro computer.

Il nodo pubblicizza i comandi di sola lettura con versione
`codex.appServer.threads.list.v1` e
`codex.appServer.thread.turns.list.v1`. Un host del nodo nativo con la
CLI Codex disponibile pubblicizza anche `codex.terminal.resume.v1`. Approvare l'aggiornamento dell'associazione del nodo
quando tali comandi compaiono per la prima volta. Il Gateway li richiama tramite la
normale politica del nodo del plugin e isola gli errori per host.

Le righe dei nodi associati vengono visualizzate come gruppo **Codex** nella normale barra laterale delle sessioni.
Per impostazione predefinita, selezionando una riga si apre il normale riquadro Chat e la relativa trascrizione persistente viene letta
tramite chiamate `thread/turns/list` con limiti definiti, paginazione tramite cursore
e proiezione completa degli elementi. Usare il menu della riga, l'intestazione del visualizzatore o la preferenza **Open Codex/Claude sessions in** per avviare `codex resume <thread-id>` nel terminale dell'operatore sul computer proprietario della sessione. Il percorso del terminale del nodo associato è un relay PTY inserito nell'elenco consentito e gestito dal plugin Codex, non un'esecuzione arbitraria di comandi sul nodo.

Il relay non fornisce tutti i contratti dell'harness OpenClaw relativi alla continuazione e alla proprietà dell'archivio. **Continue** e **Archive** non sono pertanto disponibili per le righe remote. Sul computer del Gateway, le righe memorizzate e inattive
possono avviare un ramo Chat distinto vincolato al modello. Entrambe possono essere archiviate solo
dopo che l'operatore ha confermato che nessun altro client Codex le sta usando; l'attività in tempo reale di una riga
memorizzata resta sconosciuta. Le righe attive non possono creare rami né essere archiviate.

Consultare [Supervisionare le sessioni Codex](/it/plugins/codex-supervision) per la configurazione,
la paginazione, la continuazione locale e il limite di sicurezza dei metadati.

### Sessioni e trascrizioni Claude

Il plugin incluso `anthropic` rileva per impostazione predefinita le sessioni non archiviate di Claude CLI e Claude
Desktop sul Gateway e sui nodi associati. Impostare
`plugins.entries.anthropic.config.sessionCatalog.enabled: false` per disabilitare i
comandi del catalogo dell'operatore e del catalogo dei nodi associati senza disabilitare i modelli
Anthropic o il backend Claude CLI.
Un nodo remoto dell'app macOS pubblicizza
`anthropic.claude.sessions.list.v1` e `anthropic.claude.sessions.read.v1`
quando il plugin Anthropic è abilitato ed esiste `~/.claude/projects/`. Approvare
l'aggiornamento dell'associazione del nodo quando tali comandi compaiono per la prima volta.

Un host del nodo nativo con Claude CLI disponibile pubblicizza anche
`anthropic.claude.terminal.resume.v1`. Le righe CLI e Desktop idonee possono aprire
`claude --resume <session-id>` nel terminale dell'operatore sul rispettivo host proprietario.
Si tratta dell'acquisizione della sessione nativa; diversamente dall'adozione OpenClaw, non
crea prima un fork della sessione Claude.

Il catalogo combina i record validi dell'indice dei progetti di Claude CLI con un prefisso
di metadati con limiti definiti proveniente dai file JSONL `sdk-cli` correnti. I metadati locali di Claude Desktop
forniscono i titoli Desktop e lo stato di archiviazione. I metadati Desktop hanno la precedenza quando
entrambe le origini fanno riferimento allo stesso ID di sessione Claude Code; le trascrizioni disponibili
solo tramite CLI restano visibili perché la CLI non dispone di un indicatore di archiviazione. La lettura delle trascrizioni usa cursori opachi
basati sull'offset in byte e letture all'indietro dei file con limiti definiti, quindi la selezione di una sessione
di grandi dimensioni o il caricamento di una pagina precedente non legge l'intera cronologia JSONL in un'unica
risposta del Gateway.

I comandi di elenco e lettura sono di sola lettura. Espongono i metadati del catalogo e il contenuto
delle trascrizioni esclusivamente tramite i metodi generici `sessions.catalog.list` e
`sessions.catalog.read` a una connessione operatore autenticata con
`operator.write`. Una riga Claude CLI locale al Gateway può essere adottata dal normale
compositore Chat: OpenClaw importa la cronologia visibile con limiti definiti, riprende con
`--fork-session` al primo turno e lascia invariata la trascrizione di origine.

Un host del nodo headless può aderire allo stesso flusso di continuazione:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Il nodo pubblicizza `agent.cli.claude.run.v1` solo quando questa impostazione locale al nodo
è abilitata e l'eseguibile `claude` viene risolto su tale nodo. Il Gateway non può
abilitarla da remoto. Il comando è inoltre soggetto alla politica di approvazione dell'esecuzione
già esistente del nodo. Quando tutti e tre i comandi Claude sono pubblicizzati e consentiti dalla
politica dei comandi del nodo del Gateway, una riga Claude CLI
su tale nodo può essere continuata: OpenClaw importa la cronologia con limiti definiti, associa
la sessione adottata al nodo e alla directory di lavoro indicata dal catalogo ed
esegue lì ogni turno monouso `claude -p`. Il primo turno usa comunque
`--fork-session`, preservando la trascrizione di origine.

I turni eseguiti sul nodo usano le impostazioni predefinite Claude del nodo. Nella v1 non ricevono la
configurazione MCP di loopback del Gateway né il plugin delle skill del Gateway, non possono essere reinizializzati da una
trascrizione del Gateway e rifiutano allegati e immagini. Le righe Claude Desktop e
i nodi che non pubblicizzano il comando di esecuzione restano di sola visualizzazione. Il nodo
dell'app macOS non pubblicizza ancora questo comando, quindi le relative righe restano di sola visualizzazione.

Consultare [Anthropic: sessioni Claude tra computer](/it/providers/anthropic#claude-sessions-across-computers)
per il comportamento della Control UI e le origini di archiviazione.

### Sessioni OpenCode e Pi

Anche i plugin OpenCode e ACPX inclusi rilevano cataloghi di sessioni native
di sola lettura sul Gateway e sui nodi associati. Un nodo pubblicizza
`opencode.sessions.list.v1` / `opencode.sessions.read.v1` quando la CLI `opencode`
è installata e `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`
quando esiste la directory delle sessioni di Pi. Approvare l'aggiornamento dell'associazione del nodo quando nuovi
comandi compaiono per la prima volta. Quando è disponibile anche la CLI corrispondente, il nodo aggiunge
`opencode.terminal.resume.v1` o `acpx.pi.terminal.resume.v1`; il menu della riga
e l'intestazione del visualizzatore esistenti possono quindi riaprire la sessione selezionata nel relativo
terminale proprietario tramite `opencode --session <id>` o `pi --session <id>`.

OpenCode esegue la lettura tramite la propria interfaccia JSON/esportazione ufficiale della CLI. Pi legge il proprio
archivio documentato delle sessioni JSONL, incluse le directory delle sessioni `settings.json`
di progetto e globali, oltre alle sostituzioni `PI_CODING_AGENT_DIR` e
`PI_CODING_AGENT_SESSION_DIR`. Entrambi i cataloghi sono abilitati per impostazione predefinita;
disabilitarli nella Web UI in **Config > Plugins**.

La ripresa nel terminale usa la directory di lavoro memorizzata della sessione e lo stesso
relay PTY duplex inserito nell'elenco consentito usato da Codex e Claude. Non espone l'esecuzione arbitraria
di comandi sul nodo.

### Caricamenti di file nel terminale

La Control UI consente di trascinare file in un terminale aperto di un nodo associato. L'host del nodo nativo pubblicizza il comando riservato agli amministratori `terminal.upload`; approvare l'aggiornamento dell'associazione quando compare per la prima volta. Ogni file è limitato a 16 MiB, viene depositato in una directory temporanea privata su tale nodo e restituito al terminale come percorso con quoting per la shell, senza eseguirlo.

L'inserimento dei percorsi supporta PowerShell, `cmd.exe` e le shell POSIX riconosciute (`sh`, Bash, Dash, Ash, Ksh, Zsh e Fish), incluso Git Bash su Windows. Le sostituzioni con altre shell vengono rifiutate perché non è possibile dedurne in modo sicuro le regole di quoting; eseguire l'host del nodo all'interno di WSL per ottenere percorsi WSL nativi. Anche i percorsi `cmd.exe` contenenti `%` o `!` vengono rifiutati perché tale shell espande questi caratteri anche all'interno delle virgolette doppie.

## Invocazione dei comandi

A basso livello (RPC non elaborato):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` blocca `system.run` e `system.run.prepare`; tali comandi vengono eseguiti esclusivamente tramite lo strumento `exec` con `host=node` (vedere sopra). Sono disponibili helper di livello superiore per i comuni flussi di lavoro «fornire all'agente un allegato MEDIA» (canvas, fotocamera, schermo, posizione, più avanti).

I comandi Node in streaming di lunga durata utilizzano eventi `node.invoke.progress`
additivi. Ogni evento contiene l'ID di invocazione, un numero di sequenza con base zero e un
blocco di testo UTF-8 di dimensioni limitate; il Gateway ordina i blocchi prima di consegnarli
al chiamante. La risposta `node.invoke.result` esistente rimane l'unica risposta
terminale. I chiamanti in streaming possono impostare una scadenza per inattività che inizia con il
primo evento di avanzamento e si reimposta dopo gli eventi di avanzamento successivi, mantenendo al contempo
il timeout rigido separato dell'invocazione durante l'approvazione e l'esecuzione. Risultato, timeout
rigido, timeout per inattività e disconnessione del Node eliminano tutti lo stato dello stream
in sospeso. L'annullamento da parte del chiamante emette `node.invoke.cancel`; l'host del Node quindi
termina l'albero dei processi corrispondente. I comandi richiesta/risposta esistenti rimangono invariati.

## Criteri dei comandi

I comandi Node devono superare due controlli prima di poter essere invocati:

1. Il Node deve dichiarare il comando nei propri metadati di connessione autenticati (`connect.commands`).
2. La lista consentita del Gateway, derivata dalla piattaforma e dall'approvazione, deve includere il comando dichiarato.

Liste consentite predefinite per piattaforma (prima dei valori predefiniti dei Plugin e delle sostituzioni `allowCommands`/`denyCommands`):

| Piattaforma | Comandi consentiti per impostazione predefinita                                                                                                                                                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (i comandi dell'host del Node come `system.run` sono soggetti ad approvazione, vedere di seguito)                                                                                                                                                                                              |

Queste righe descrivono il limite massimo imposto dai criteri del Gateway, non i comandi implementati da ogni app Node. Un comando è utilizzabile solo quando anche il Node connesso lo dichiara. In particolare, l'app macOS attuale non dichiara le famiglie relative al dispositivo e ai dati personali elencate nella riga dei criteri di macOS.

I comandi `canvas.*` (`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`) sono un valore predefinito del Plugin su iOS, Android, macOS, Windows, Linux e piattaforme sconosciute. I Node Linux li dichiarano solo quando è presente il socket Canvas locale dell'app desktop. Tutti i comandi Canvas sono limitati al primo piano su iOS.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once` sono consentiti per impostazione predefinita per qualsiasi Node che pubblicizzi la funzionalità `talk` o dichiari comandi `talk.*`, indipendentemente dall'etichetta della piattaforma.

I comandi dell'host desktop (`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` e `screen.snapshot` su macOS/Windows) non fanno parte della tabella statica dei valori predefiniti per piattaforma riportata sopra. Diventano disponibili quando l'operatore approva una richiesta di associazione che li dichiara; da quel momento, l'insieme dei comandi approvati del Node li mantiene nelle riconnessioni successive.

I comandi pericolosi o con un forte impatto sulla privacy richiedono comunque l'abilitazione esplicita tramite `gateway.nodes.allowCommands`, anche se un Node li dichiara: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands` prevale sempre sui valori predefiniti e sulle voci aggiuntive della lista consentita. Consultare [Riepiloghi di HealthKit](/platforms/ios-healthkit) per il controllo del consenso su iPhone e [Uso del computer](/it/nodes/computer-use) per gli ulteriori controlli relativi a macOS, ai criteri degli strumenti e all'abilitazione dell'input desktop.

I comandi Node di proprietà dei Plugin possono aggiungere criteri di invocazione del Node del Gateway. Tali criteri vengono applicati dopo il controllo della lista consentita e prima dell'inoltro al Node, in modo che `node.invoke` non elaborato, gli strumenti ausiliari della CLI e gli strumenti dedicati dell'agente condividano lo stesso limite di autorizzazione del Plugin. I comandi Node pericolosi dei Plugin richiedono comunque l'abilitazione esplicita tramite `gateway.nodes.allowCommands`.

Dopo che un Node modifica il proprio elenco di comandi dichiarati, rifiutare la precedente associazione del dispositivo e approvare la nuova richiesta affinché il Gateway memorizzi l'istantanea aggiornata dei comandi.

## Configurazione (`openclaw.json`)

Le impostazioni relative ai Node si trovano in `gateway.nodes` e `tools.exec`:

```json5
{
  gateway: {
    nodes: {
      // Approva automaticamente la prima associazione del Node da reti attendibili (elenco CIDR).
      // Disabilitato se non impostato. Si applica solo alle prime richieste role:node
      // senza ambiti richiesti; non approva automaticamente gli aggiornamenti.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // Approvazione automatica verificata tramite SSH (impostazione predefinita: abilitata). Approva la prima
        // associazione del Node quando la chiave del dispositivo riletta tramite SSH corrisponde esattamente.
        sshVerify: true,
      },
      // Considera attendibili gli strumenti dei Plugin visibili agli agenti pubblicati dai Node associati (impostazione predefinita: true).
      pluginTools: {
        enabled: true,
      },
      // Abilita i comandi Node pericolosi o con un forte impatto sulla privacy (camera.snap e così via).
      allowCommands: ["camera.snap", "screen.record"],
      // Blocca i nomi esatti dei comandi anche se inclusi nei valori predefiniti o in allowCommands.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Host exec predefinito: "node" instrada tutte le chiamate exec a un Node associato.
      host: "node",
      // Modalità di sicurezza per exec sul Node: consente solo comandi approvati o inclusi nella lista consentita.
      security: "allowlist",
      // Vincola exec a un Node specifico (ID o nome). Omettere per consentire qualsiasi Node.
      node: "build-node",
    },
  },
}
```

Utilizzare i nomi esatti dei comandi Node. `denyCommands` rimuove un comando anche quando un valore predefinito della piattaforma o una voce `allowCommands` altrimenti lo consentirebbe. Per impostazione predefinita, i Node associati possono pubblicare descrittori di strumenti dei Plugin visibili agli agenti, ma il comando di ciascun descrittore deve comunque rientrare nella superficie di comandi approvata del Node. Impostare `gateway.nodes.pluginTools.enabled: false` per ignorare tutti questi descrittori. Consultare il [riferimento per la configurazione del Gateway](/it/gateway/configuration-reference#gateway) per i dettagli sui campi relativi all'associazione dei Node e ai criteri dei comandi del Gateway.

Sostituzione del Node exec per singolo agente:

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

## Schermate (istantanee di Canvas)

Se il Node mostra Canvas (WebView), `canvas.snapshot` restituisce `{ format, base64 }`.

Strumento ausiliario della CLI (scrive in un file temporaneo e stampa il percorso salvato):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Controlli di Canvas

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

Note:

- `canvas present` accetta URL o percorsi di file locali (`--target`) sui Node che supportano i percorsi locali, oltre a `--x/--y/--width/--height` facoltativo per il posizionamento. Canvas su Linux accetta URL HTTP(S) o il relativo renderer A2UI incluso.
- `canvas eval` accetta JavaScript inline (`--js`) o un argomento posizionale.

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

Note:

- I Node mobili e desktop Linux utilizzano una pagina A2UI inclusa e di proprietà dell'app per il rendering con supporto delle azioni.
- È supportato solo A2UI v0.8 JSONL (v0.9/createSurface viene rifiutato).
- iOS e Android eseguono il rendering delle pagine Canvas remote del Gateway, ma le azioni dei pulsanti A2UI vengono inviate solo dalla pagina A2UI inclusa e di proprietà dell'app. Le pagine A2UI HTTP/HTTPS ospitate dal Gateway supportano solo il rendering su questi client mobili.
- macOS può inviare azioni dall'esatta pagina A2UI del Gateway con ambito di funzionalità selezionata dall'app. Le altre pagine HTTP/HTTPS supportano solo il rendering.
- Linux invia azioni solo dalla pagina A2UI inclusa. Le altre pagine HTTP/HTTPS supportano solo il rendering e un Node Linux headless senza l'app desktop non pubblicizza Canvas.

## Foto e video (fotocamera del Node)

Foto (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # impostazione predefinita: entrambe le fotocamere (2 righe MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

Clip video (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

Note:

- Il Node deve essere **in primo piano** per `canvas.*` e `camera.*` (le chiamate in background restituiscono `NODE_BACKGROUND_UNAVAILABLE`).
- I Node limitano la durata delle clip per mantenere gestibili i payload base64 (consultare [Acquisizione dalla fotocamera](/it/nodes/camera) per i limiti esatti di ogni piattaforma). Lo strumento dell'agente `nodes` limita inoltre il valore `durationMs` richiesto a 300000 (5 minuti) prima di inoltrare la chiamata; il Node stesso applica il limite più restrittivo.
- Android richiede le autorizzazioni `CAMERA`/`RECORD_AUDIO` quando possibile; le autorizzazioni negate causano un errore con `*_PERMISSION_REQUIRED`.

## Registrazioni dello schermo (Node)

I Node supportati espongono `screen.record` (mp4). Esempio:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

Note:

- `screen.record` la disponibilità dipende dalla piattaforma del nodo.
- Lo strumento agente `nodes` limita il valore richiesto di `durationMs` a 300000 (5 minuti); il nodo può applicare un limite più restrittivo per contenere il payload restituito.
- `--no-audio` disabilita l'acquisizione dal microfono sulle piattaforme supportate.
- Usare `--screen <index>` per selezionare uno schermo quando sono disponibili più display (0 = principale).

## Posizione (nodi)

I nodi espongono `location.get` quando la posizione è abilitata nelle impostazioni.

Comando CLI di supporto:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

Note:

- La posizione è **disattivata per impostazione predefinita**.
- "Sempre" richiede l'autorizzazione del sistema; il recupero in background viene eseguito con il massimo impegno possibile.
- La risposta include latitudine/longitudine, precisione (metri) e timestamp.
- Struttura completa dei parametri e della risposta e codici di errore: [Comando per la posizione](/it/nodes/location-command).

## SMS (nodi Android)

I nodi Android possono esporre `sms.send` e `sms.search` quando l'utente concede l'autorizzazione **SMS** e il dispositivo supporta la telefonia. Entrambi i comandi sono pericolosi per impostazione predefinita: per poterli richiamare, l'operatore del Gateway deve anche aggiungerli a `gateway.nodes.allowCommands` (vedere [Criteri dei comandi](#command-policy)).

Per la ricerca di SMS in sola lettura, abilitarla esplicitamente in `openclaw.json`:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Aggiungere `sms.send` separatamente solo se il nodo deve anche poter inviare messaggi. L'autorizzazione Android e l'autorizzazione dei comandi del Gateway sono indipendenti; concedere l'autorizzazione sul telefono non modifica i criteri del Gateway.

Richiamo di basso livello:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

Note:

- `sms.search` può essere dichiarato prima che venga concessa l'autorizzazione `READ_SMS`, in modo che un richiamo possa restituire una diagnostica relativa all'autorizzazione; la lettura dei messaggi richiede comunque tale autorizzazione Android.
- I dispositivi solo Wi-Fi privi di telefonia non pubblicizzano `sms.send`.
- Un errore `requires explicit gateway.nodes.allowCommands opt-in` indica che il telefono ha dichiarato il comando, ma l'operatore del Gateway non lo ha autorizzato.

## Comandi per il dispositivo e i dati personali

I nodi iOS e Android pubblicizzano per impostazione predefinita diversi comandi di dati in sola lettura (vedere la tabella [Criteri dei comandi](#command-policy)); Android espone inoltre una famiglia più ampia, vincolata dalle proprie impostazioni nell'app.

Famiglie disponibili:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — solo Android; `device.apps` richiede che la condivisione delle app installate sia abilitata nelle impostazioni di Android e restituisce per impostazione predefinita le app visibili nel programma di avvio.
- `notifications.list`, `notifications.actions` — solo Android.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android (sola lettura per impostazione predefinita); `contacts.add` è pericoloso e richiede `gateway.nodes.allowCommands`.
- `calendar.events` — iOS, Android (sola lettura per impostazione predefinita); `calendar.add` è pericoloso e richiede `gateway.nodes.allowCommands`.
- `reminders.list` — iOS, Android (sola lettura per impostazione predefinita); `reminders.add` è pericoloso e richiede `gateway.nodes.allowCommands`.
- `callLog.search` — solo Android.
- `motion.activity`, `motion.pedometer` — iOS, Android; vincolati alle funzionalità dei sensori disponibili.

Esempi di richiamo:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## Comandi di sistema (host del nodo / nodo Mac)

Il nodo macOS espone `system.run`, `system.which`, `system.notify` e `system.execApprovals.get/set`. L'host del nodo senza interfaccia grafica espone `system.run.prepare`, `system.run`, `system.which` e `system.execApprovals.get/set`.

Esempi:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

Note:

- `system.run` restituisce stdout/stderr/codice di uscita nel payload.
- L'esecuzione della shell ora passa attraverso lo strumento `exec` con `host=node`; `nodes` rimane l'interfaccia RPC diretta per i comandi espliciti del nodo.
- `nodes invoke` non espone `system.run` o `system.run.prepare`; questi rimangono disponibili solo nel percorso exec.
- Il percorso exec prepara un `systemRunPlan` canonico prima dell'approvazione. Dopo la concessione dell'approvazione, il Gateway inoltra il piano memorizzato, non eventuali campi di comando/cwd/sessione modificati successivamente dal chiamante.
- `system.notify` rispetta lo stato dell'autorizzazione per le notifiche nell'app macOS; supporta `--priority <passive|active|timeSensitive>` e `--delivery <system|overlay|auto>`.
- I metadati `platform` / `deviceFamily` del nodo non riconosciuti usano un elenco di elementi consentiti predefinito conservativo che esclude `system.run` e `system.which`. Se tali comandi sono intenzionalmente necessari per una piattaforma sconosciuta, aggiungerli esplicitamente tramite `gateway.nodes.allowCommands`.
- `system.run` supporta `--cwd`, `--env KEY=VAL`, `--command-timeout` e `--needs-screen-recording`.
- Per i wrapper della shell (`bash|sh|zsh ... -c/-lc`), i valori `--env` limitati alla richiesta vengono ridotti a un elenco esplicito di elementi consentiti (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Per le decisioni di autorizzazione permanente in modalità elenco di elementi consentiti, i wrapper di invio noti (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) memorizzano i percorsi degli eseguibili interni anziché quelli dei wrapper. Se non è possibile rimuovere il wrapper in modo sicuro, non viene memorizzata automaticamente alcuna voce nell'elenco degli elementi consentiti.
- Sugli host dei nodi Windows in modalità elenco di elementi consentiti, le esecuzioni del wrapper della shell tramite `cmd.exe /c` richiedono l'approvazione (la sola voce nell'elenco degli elementi consentiti non autorizza automaticamente la forma con wrapper).
- Gli host dei nodi ignorano le sostituzioni di `PATH` in `--env` e rimuovono un insieme ampio e mantenuto di variabili di avvio dell'interprete/della shell (ad esempio `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`) prima di eseguire un comando. Se sono necessarie ulteriori voci PATH, configurare l'ambiente del servizio host del nodo (oppure installare gli strumenti nelle posizioni standard) anziché passare `PATH` tramite `--env`.
- Nella modalità nodo macOS, `system.run` è vincolato dalle approvazioni exec nell'app macOS (Settings → Exec approvals). Le modalità Ask/allowlist/full si comportano come nell'host del nodo senza interfaccia grafica; le richieste negate restituiscono `SYSTEM_RUN_DENIED`.
- Nell'host del nodo senza interfaccia grafica, `system.run` è vincolato dalle approvazioni exec (`~/.openclaw/exec-approvals.json`); specificamente su macOS, vedere le variabili di ambiente per l'instradamento dell'host exec nella sezione [Host del nodo senza interfaccia grafica](#headless-node-host-cross-platform) seguente.

## Associazione del nodo exec

Quando sono disponibili più nodi, è possibile associare exec a un nodo specifico. Questo imposta il nodo predefinito per `exec host=node` (e può essere sostituito per ogni agente).

Valore predefinito globale:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

Sostituzione per agente:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Rimuovere l'impostazione per consentire qualsiasi nodo:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## Mappa delle autorizzazioni

I nodi possono includere una mappa `permissions` in `node.list` / `node.describe`, indicizzata per nome dell'autorizzazione (ad esempio `screenRecording`, `accessibility`, `location`) con valori booleani (`true` = concessa).

## Host del nodo senza interfaccia grafica (multipiattaforma)

OpenClaw può eseguire un **host del nodo senza interfaccia grafica** (senza UI) che si connette al WebSocket del Gateway ed espone `system.run` / `system.which`. È utile su Linux/Windows o per eseguire un nodo minimale insieme a un server.

Avviarlo:

```bash
openclaw node run --host <gateway-host> --port 18789
```

Note:

- L'associazione è comunque necessaria (il Gateway mostrerà una richiesta di associazione del dispositivo).
- I metadati dell'istanza client, l'identità firmata del dispositivo e l'autenticazione dell'associazione usano file separati; vedere [Stato dell'identità senza interfaccia grafica](#headless-identity-state).
- Le approvazioni exec vengono applicate localmente tramite `~/.openclaw/exec-approvals.json` (vedere [Approvazioni exec](/it/tools/exec-approvals)).
- Su macOS, l'host del nodo senza interfaccia grafica esegue `system.run` localmente per impostazione predefinita. Impostare `OPENCLAW_NODE_EXEC_HOST=app` per instradare `system.run` attraverso l'host exec dell'app complementare; aggiungere `OPENCLAW_NODE_EXEC_FALLBACK=0` per richiedere l'host dell'app e interrompere in modo sicuro se non è disponibile.
- Aggiungere `--tls` / `--tls-fingerprint` quando il WebSocket del Gateway usa TLS.

## Modalità nodo Mac

- L'app della barra dei menu di macOS si connette al server WebSocket del Gateway come nodo (quindi `openclaw nodes …` funziona su questo Mac).
- In modalità remota, l'app apre un tunnel SSH per la porta del Gateway e si connette a `localhost`.

---
read_when:
    - Individuare il sottocomando `openclaw` corretto
    - Ricerca dei flag globali o delle regole di formattazione dell'output
summary: 'Indice della CLI di OpenClaw: elenco dei comandi, flag globali e link alle pagine dei singoli comandi'
title: Riferimento della CLI
x-i18n:
    generated_at: "2026-07-12T06:56:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` è il punto di ingresso principale della CLI. Ogni comando principale dispone di una
pagina di riferimento dedicata oppure è documentato insieme al comando di cui è alias; questo indice elenca
i comandi, i flag globali e le regole di formattazione dell'output applicabili all'intera CLI.

Comandi di configurazione in base allo scopo:

- `openclaw setup` e `openclaw onboard` verificano prima l'inferenza, quindi avviano Crestodian per configurare Gateway, spazio di lavoro, canali, Skills e stato di integrità.
- `openclaw setup --baseline` crea la configurazione di base e lo spazio di lavoro senza eseguire il flusso guidato di configurazione iniziale.
- `openclaw configure` modifica parti specifiche di una configurazione esistente: autenticazione del modello, Gateway, canali, Plugin o Skills.
- `openclaw channels add` configura gli account dei canali dopo la creazione della configurazione di base; eseguilo senza flag per la configurazione guidata oppure con flag specifici del canale per gli script.

## Pagine dei comandi

| Area                         | Comandi                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configurazione e avvio guidato | [`crestodian`](/it/cli/crestodian) · [`setup`](/it/cli/setup) · [`onboard`](/it/cli/onboard) · [`configure`](/it/cli/configure) · [`config`](/it/cli/config) · [`completion`](/it/cli/completion) · [`doctor`](/it/cli/doctor) · [`dashboard`](/it/cli/dashboard) |
| Ripristino, backup e migrazione | [`backup`](/it/cli/backup) · [`migrate`](/it/cli/migrate) · [`reset`](/it/cli/reset) · [`uninstall`](/it/cli/uninstall) · [`update`](/it/cli/update)                                                                                                     |
| Messaggistica e agenti         | [`message`](/it/cli/message) · [`agent`](/it/cli/agent) · [`agents`](/it/cli/agents) · [`attach`](/it/cli/attach) · [`acp`](/it/cli/acp) · [`mcp`](/it/cli/mcp)                                                                                             |
| Integrità e sessioni           | [`status`](/it/cli/status) · [`health`](/it/cli/health) · [`sessions`](/it/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway e registri             | [`gateway`](/it/cli/gateway) · [`logs`](/it/cli/logs) · [`system`](/it/cli/system)                                                                                                                                                                 |
| Modelli e inferenza            | [`models`](/it/cli/models) · [`promos`](/it/cli/promos) · [`infer`](/it/cli/infer) · `capability` (alias di [`infer`](/it/cli/infer)) · [`memory`](/it/cli/memory) · [`commitments`](/it/cli/commitments) · [`wiki`](/it/cli/wiki)                            |
| Rete e nodi                    | [`directory`](/it/cli/directory) · [`nodes`](/it/cli/nodes) · [`devices`](/it/cli/devices) · [`node`](/it/cli/node)                                                                                                                                   |
| Runtime e sandbox              | [`approvals`](/it/cli/approvals) · `exec-policy` (vedi [`approvals`](/it/cli/approvals)) · [`sandbox`](/it/cli/sandbox) · [`tui`](/it/cli/tui) · `chat`/`terminal` (alias di [`tui --local`](/it/cli/tui)) · [`browser`](/it/cli/browser)                 |
| Automazione                    | [`cron`](/it/cli/cron) · [`tasks`](/it/cli/tasks) · [`hooks`](/it/cli/hooks) · [`webhooks`](/it/cli/webhooks) · [`transcripts`](/it/cli/transcripts)                                                                                                     |
| Individuazione e documentazione | [`dns`](/it/cli/dns) · [`docs`](/it/cli/docs)                                                                                                                                                                                                   |
| Associazione e canali          | [`pairing`](/it/cli/pairing) · [`qr`](/it/cli/qr) · [`channels`](/it/cli/channels)                                                                                                                                                                 |
| Sicurezza e Plugin             | [`security`](/it/cli/security) · [`secrets`](/it/cli/secrets) · [`skills`](/it/cli/skills) · [`plugins`](/it/cli/plugins) · [`proxy`](/it/cli/proxy)                                                                                                     |
| Alias precedenti               | [`daemon`](/it/cli/daemon) (servizio Gateway) · [`clawbot`](/it/cli/clawbot) (spazio dei nomi)                                                                                                                                                         |
| Plugin (facoltativi)           | [`path`](/it/cli/path) · [`policy`](/it/cli/policy) · [`voicecall`](/it/cli/voicecall) · [`workboard`](/it/cli/workboard) (se installato)                                                                                                              |

## Flag globali

| Flag                    | Scopo                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Isola lo stato in `~/.openclaw-dev`, imposta la porta predefinita del Gateway su 19001 e trasla le porte derivate              |
| `--profile <name>`      | Isola lo stato in `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Esegue la CLI all'interno di un container Podman/Docker in esecuzione denominato `<name>` (predefinito: variabile di ambiente `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Sostituisce il livello di registrazione globale per l'output su file e console                                                 |
| `--no-color`            | Disabilita i colori ANSI (viene rispettato anche `NO_COLOR=1`)                                                    |
| `--update`              | Forma abbreviata di [`openclaw update`](/it/cli/update); funziona sia per i checkout del codice sorgente sia per le installazioni dei pacchetti    |
| `-V`, `--version`, `-v` | Stampa la versione ed esce                                                                                  |

## Modalità di output

- I colori ANSI e gli indicatori di avanzamento vengono visualizzati solo nelle sessioni TTY.
- I collegamenti ipertestuali OSC-8 vengono visualizzati come collegamenti selezionabili dove supportati; altrimenti la
  CLI utilizza URL in testo semplice.
- `--json` (e `--plain`, dove supportato) disabilita la formattazione per produrre un output pulito.
- I comandi di lunga durata mostrano un indicatore di avanzamento (OSC 9;4, se supportato).

## Tavolozza dei colori

OpenClaw utilizza una tavolozza ispirata all'aragosta per l'output della CLI:

| Token          | Esadecimale | Utilizzato per                       |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Titoli, etichette, evidenziazioni principali |
| `accentBright` | `#FF7A3D` | Nomi dei comandi, enfasi              |
| `accentDim`    | `#D14A22` | Testo di evidenziazione secondario             |
| `info`         | `#FF8A5B` | Valori informativi                 |
| `success`      | `#2FBF71` | Stati di riuscita                       |
| `warn`         | `#FFB020` | Avvisi, flag delle opzioni, ripieghi    |
| `error`        | `#E23D2D` | Errori, operazioni non riuscite                     |
| `muted`        | `#8B7F77` | Attenuazione, metadati                |

Fonte autorevole della tavolozza: `packages/terminal-core/src/palette.ts`.

## Albero dei comandi

<Accordion title="Albero completo dei comandi">

Questa mappa comprende i comandi principali e i relativi sottocomandi principali. I sottocomandi
aggiunti dai Plugin (ad esempio in `skills`, `plugins` e `wiki`) evolvono
in modo indipendente; esegui `<command> --help` per ottenere l'elenco autorevole e aggiornato.

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  migrate
    list
    plan <provider>
    apply <provider>
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
    repair
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    verify
    workshop list|inspect|propose-create|propose-update|revise|apply|reject|quarantine
    list
    info
    check
  plugins
    list
    search
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    build
    validate
    init
    registry
    marketplace list|entries|refresh
  workboard
    list
    create
    show
    dispatch
  memory
    status
    index
    search
  transcripts
    list
    show
    path
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    compile
    lint
    ingest
    okf import
    search
    get
    apply synthesis|metadata
    bridge import
    unsafe-local import
    chatgpt import|rollback
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  attach
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  audit
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    stability
    diagnostics export
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
    auth list|add|login|setup-token|paste-token|paste-api-key|login-github-copilot
    auth order get|set|clear
  promos
    list
    claim <slug>
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|personas|providers|status|enable|disable|set-provider|set-persona
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    get
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

I Plugin possono aggiungere ulteriori comandi di primo livello, come
[`openclaw workboard`](/it/cli/workboard) o `openclaw voicecall`.

</Accordion>

## Comandi slash della chat

I messaggi della chat supportano i comandi `/...`. Consulta [comandi slash](/it/tools/slash-commands).

In evidenza:

- `/status` - diagnostica rapida.
- `/trace` - righe di tracciamento e debug dei Plugin limitate alla sessione.
- `/config` - modifiche persistenti alla configurazione.
- `/debug` - sostituzioni della configurazione valide solo durante l'esecuzione (in memoria, non su disco; richiede `commands.debug: true`).

## Monitoraggio dell'utilizzo

`openclaw status --usage` e l'interfaccia di controllo mostrano l'utilizzo e la quota del provider quando
sono disponibili le credenziali OAuth/API. I dati provengono direttamente dagli endpoint di utilizzo
dei provider e vengono normalizzati nel formato `X% left`. Provider con finestre di utilizzo
correnti: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi e z.ai.

Per maggiori dettagli, consulta [Monitoraggio dell'utilizzo](/it/concepts/usage-tracking).

## Contenuti correlati

- [Comandi slash](/it/tools/slash-commands)
- [Configurazione](/it/gateway/configuration)
- [Ambiente](/it/help/environment)

---
read_when:
    - Trovare il sottocomando giusto di `openclaw`
    - Consultare i flag globali o le regole di stile dell'output
summary: 'Indice della CLI di OpenClaw: elenco dei comandi, flag globali e link alle pagine dei singoli comandi'
title: Riferimento CLI
x-i18n:
    generated_at: "2026-04-24T08:34:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw` è il punto di ingresso principale della CLI. Ogni comando core ha una
pagina di riferimento dedicata oppure è documentato insieme al comando di cui è alias; questo
indice elenca i comandi, i flag globali e le regole di stile dell'output che
si applicano in tutta la CLI.

## Pagine dei comandi

| Area | Comandi |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configurazione e onboarding | [`setup`](/it/cli/setup) · [`onboard`](/it/cli/onboard) · [`configure`](/it/cli/configure) · [`config`](/it/cli/config) · [`completion`](/it/cli/completion) · [`doctor`](/it/cli/doctor) · [`dashboard`](/it/cli/dashboard) |
| Reimpostazione e disinstallazione | [`backup`](/it/cli/backup) · [`reset`](/it/cli/reset) · [`uninstall`](/it/cli/uninstall) · [`update`](/it/cli/update) |
| Messaggistica e agenti | [`message`](/it/cli/message) · [`agent`](/it/cli/agent) · [`agents`](/it/cli/agents) · [`acp`](/it/cli/acp) · [`mcp`](/it/cli/mcp) |
| Stato e sessioni | [`status`](/it/cli/status) · [`health`](/it/cli/health) · [`sessions`](/it/cli/sessions) |
| Gateway e log | [`gateway`](/it/cli/gateway) · [`logs`](/it/cli/logs) · [`system`](/it/cli/system) |
| Modelli e inferenza | [`models`](/it/cli/models) · [`infer`](/it/cli/infer) · `capability` (alias di [`infer`](/it/cli/infer)) · [`memory`](/it/cli/memory) · [`wiki`](/it/cli/wiki) |
| Rete e Node | [`directory`](/it/cli/directory) · [`nodes`](/it/cli/nodes) · [`devices`](/it/cli/devices) · [`node`](/it/cli/node) |
| Runtime e sandbox | [`approvals`](/it/cli/approvals) · `exec-policy` (vedi [`approvals`](/it/cli/approvals)) · [`sandbox`](/it/cli/sandbox) · [`tui`](/it/cli/tui) · `chat`/`terminal` (alias di [`tui --local`](/it/cli/tui)) · [`browser`](/it/cli/browser) |
| Automazione | [`cron`](/it/cli/cron) · [`tasks`](/it/cli/tasks) · [`hooks`](/it/cli/hooks) · [`webhooks`](/it/cli/webhooks) |
| Discovery e documentazione | [`dns`](/it/cli/dns) · [`docs`](/it/cli/docs) |
| Pairing e canali | [`pairing`](/it/cli/pairing) · [`qr`](/it/cli/qr) · [`channels`](/it/cli/channels) |
| Sicurezza e Plugin | [`security`](/it/cli/security) · [`secrets`](/it/cli/secrets) · [`skills`](/it/cli/skills) · [`plugins`](/it/cli/plugins) · [`proxy`](/it/cli/proxy) |
| Alias legacy | [`daemon`](/it/cli/daemon) (servizio gateway) · [`clawbot`](/it/cli/clawbot) (namespace) |
| Plugin (facoltativi) | [`voicecall`](/it/cli/voicecall) (se installato) |

## Flag globali

| Flag | Scopo |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev` | Isola lo stato sotto `~/.openclaw-dev` e sposta le porte predefinite |
| `--profile <name>` | Isola lo stato sotto `~/.openclaw-<name>` |
| `--container <name>` | Punta a un container con nome per l'esecuzione |
| `--no-color` | Disattiva i colori ANSI (`NO_COLOR=1` viene anch'esso rispettato) |
| `--update` | Abbreviazione di [`openclaw update`](/it/cli/update) (solo installazioni da sorgente) |
| `-V`, `--version`, `-v` | Stampa la versione ed esce |

## Modalità di output

- I colori ANSI e gli indicatori di avanzamento vengono visualizzati solo nelle sessioni TTY.
- I collegamenti ipertestuali OSC-8 vengono mostrati come link cliccabili dove supportato; altrimenti la
  CLI usa URL in testo semplice.
- `--json` (e `--plain` dove supportato) disattiva lo stile per un output pulito.
- I comandi di lunga durata mostrano un indicatore di avanzamento (OSC 9;4 dove supportato).

Fonte di verità della palette: `src/terminal/palette.ts`.

## Albero dei comandi

<Accordion title="Albero completo dei comandi">

```
openclaw [--dev] [--profile <name>] <command>
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
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  memory
    status
    index
    search
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
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
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
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

I Plugin possono aggiungere comandi aggiuntivi di primo livello (ad esempio `openclaw voicecall`).

</Accordion>

## Comandi slash della chat

I messaggi di chat supportano comandi `/...`. Vedi [comandi slash](/it/tools/slash-commands).

Elementi principali:

- `/status` — diagnostica rapida.
- `/trace` — righe di trace/debug del Plugin con ambito sessione.
- `/config` — modifiche di configurazione persistenti.
- `/debug` — override di configurazione solo runtime (memoria, non disco; richiede `commands.debug: true`).

## Tracciamento dell'utilizzo

`openclaw status --usage` e l'interfaccia Control mostrano utilizzo/quota del provider quando
sono disponibili credenziali OAuth/API. I dati provengono direttamente dagli endpoint di utilizzo del provider
e sono normalizzati come `X% left`. Provider con attuali finestre
di utilizzo: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi e z.ai.

Vedi [Tracciamento dell'utilizzo](/it/concepts/usage-tracking) per i dettagli.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [Configurazione](/it/gateway/configuration)
- [Ambiente](/it/help/environment)

---
read_when:
    - Het juiste `openclaw`-subcommando vinden
    - Globale vlaggen of regels voor uitvoeropmaak opzoeken
summary: 'OpenClaw CLI-index: opdrachtenlijst, globale vlaggen en links naar opdrachtspecifieke pagina''s'
title: CLI-referentie
x-i18n:
    generated_at: "2026-05-11T20:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7003579c741d193ba77bf0b672fa16446b5e4fb3a9a9dc4a0a838eaf758fb196
    source_path: cli/index.md
    workflow: 16
---

`openclaw` is het belangrijkste CLI-toegangspunt. Elke kernopdracht heeft een
eigen referentiepagina of is gedocumenteerd bij de opdracht waarvoor deze een alias is; deze
index vermeldt de opdrachten, de globale flags en de regels voor uitvoerstyling die
voor de hele CLI gelden.

Gebruik de setup-opdrachten naar intentie:

- `openclaw setup` maakt de basisconfiguratie en werkruimte aan zonder de volledige begeleide onboarding-flow te doorlopen.
- `openclaw onboard` is het volledige begeleide pad voor de eerste uitvoering voor Gateway, modelauthenticatie, werkruimte, kanalen, Skills en gezondheid.
- `openclaw configure` wijzigt gerichte onderdelen van een bestaande setup, zoals modelauthenticatie, Gateway, kanalen, plugins of Skills.
- `openclaw channels add` configureert kanaalaccounts nadat de basis bestaat; voer dit zonder flags uit voor begeleide kanaalsetup of met kanaalspecifieke flags voor scripts.

## Opdrachtpagina's

| Gebied               | Opdrachten                                                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup en onboarding  | [`crestodian`](/nl/cli/crestodian) · [`setup`](/nl/cli/setup) · [`onboard`](/nl/cli/onboard) · [`configure`](/nl/cli/configure) · [`config`](/nl/cli/config) · [`completion`](/nl/cli/completion) · [`doctor`](/nl/cli/doctor) · [`dashboard`](/nl/cli/dashboard) |
| Reset en verwijderen | [`backup`](/nl/cli/backup) · [`reset`](/nl/cli/reset) · [`uninstall`](/nl/cli/uninstall) · [`update`](/nl/cli/update)                                                                                                                                 |
| Berichten en agents  | [`message`](/nl/cli/message) · [`agent`](/nl/cli/agent) · [`agents`](/nl/cli/agents) · [`acp`](/nl/cli/acp) · [`mcp`](/nl/cli/mcp)                                                                                                                       |
| Gezondheid en sessies | [`status`](/nl/cli/status) · [`health`](/nl/cli/health) · [`sessions`](/nl/cli/sessions)                                                                                                                                                           |
| Gateway en logs      | [`gateway`](/nl/cli/gateway) · [`logs`](/nl/cli/logs) · [`system`](/nl/cli/system)                                                                                                                                                                 |
| Modellen en inferentie | [`models`](/nl/cli/models) · [`infer`](/nl/cli/infer) · `capability` (alias voor [`infer`](/nl/cli/infer)) · [`memory`](/nl/cli/memory) · [`commitments`](/nl/cli/commitments) · [`wiki`](/nl/cli/wiki)                                                     |
| Netwerk en nodes     | [`directory`](/nl/cli/directory) · [`nodes`](/nl/cli/nodes) · [`devices`](/nl/cli/devices) · [`node`](/nl/cli/node)                                                                                                                                   |
| Runtime en sandbox   | [`approvals`](/nl/cli/approvals) · `exec-policy` (zie [`approvals`](/nl/cli/approvals)) · [`sandbox`](/nl/cli/sandbox) · [`tui`](/nl/cli/tui) · `chat`/`terminal` (aliassen voor [`tui --local`](/nl/cli/tui)) · [`browser`](/nl/cli/browser)               |
| Automatisering       | [`cron`](/nl/cli/cron) · [`tasks`](/nl/cli/tasks) · [`hooks`](/nl/cli/hooks) · [`webhooks`](/nl/cli/webhooks)                                                                                                                                         |
| Detectie en docs     | [`dns`](/nl/cli/dns) · [`docs`](/nl/cli/docs)                                                                                                                                                                                                   |
| Koppelen en kanalen  | [`pairing`](/nl/cli/pairing) · [`qr`](/nl/cli/qr) · [`channels`](/nl/cli/channels)                                                                                                                                                                 |
| Beveiliging en plugins | [`security`](/nl/cli/security) · [`secrets`](/nl/cli/secrets) · [`skills`](/nl/cli/skills) · [`plugins`](/nl/cli/plugins) · [`proxy`](/nl/cli/proxy)                                                                                                    |
| Verouderde aliassen  | [`daemon`](/nl/cli/daemon) (Gateway-service) · [`clawbot`](/nl/cli/clawbot) (naamruimte)                                                                                                                                                        |
| Plugins (optioneel)  | [`path`](/nl/cli/path) · [`voicecall`](/nl/cli/voicecall) (indien geïnstalleerd)                                                                                                                                                                |

## Globale flags

| Flag                    | Doel                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Isoleer status onder `~/.openclaw-dev` en verschuif standaardpoorten  |
| `--profile <name>`      | Isoleer status onder `~/.openclaw-<name>`                             |
| `--container <name>`    | Richt uitvoering op een benoemde container                            |
| `--no-color`            | Schakel ANSI-kleuren uit (`NO_COLOR=1` wordt ook gerespecteerd)       |
| `--update`              | Afkorting voor [`openclaw update`](/nl/cli/update) (alleen broninstallaties) |
| `-V`, `--version`, `-v` | Druk de versie af en sluit af                                         |

## Uitvoermodi

- ANSI-kleuren en voortgangsindicatoren worden alleen in TTY-sessies weergegeven.
- OSC-8-hyperlinks worden waar ondersteund als klikbare links weergegeven; anders valt de
  CLI terug op platte URL's.
- `--json` (en `--plain` waar ondersteund) schakelt styling uit voor schone uitvoer.
- Langlopende opdrachten tonen een voortgangsindicator (OSC 9;4 waar ondersteund).

Bron van waarheid voor het palet: `src/terminal/palette.ts`.

## Opdrachtboom

<Accordion title="Volledige opdrachtboom">

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

Plugins kunnen extra opdrachten op topniveau toevoegen (bijvoorbeeld `openclaw voicecall`).

</Accordion>

## Slash-opdrachten voor chat

Chatberichten ondersteunen `/...`-opdrachten. Zie [slash-opdrachten](/nl/tools/slash-commands).

Hoogtepunten:

- `/status` — snelle diagnostiek.
- `/trace` — plugin-trace/debugregels binnen het sessiebereik.
- `/config` — blijvende configuratiewijzigingen.
- `/debug` — configuratie-overschrijvingen alleen voor runtime (geheugen, niet schijf; vereist `commands.debug: true`).

## Gebruiksregistratie

`openclaw status --usage` en de Control UI tonen providergebruik/quota wanneer
OAuth/API-referenties beschikbaar zijn. Gegevens komen rechtstreeks van provider-endpoints
voor gebruik en worden genormaliseerd naar `X% left`. Providers met huidige gebruiksvensters:
Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi en z.ai.

Zie [Gebruiksregistratie](/nl/concepts/usage-tracking) voor details.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Configuratie](/nl/gateway/configuration)
- [Omgeving](/nl/help/environment)

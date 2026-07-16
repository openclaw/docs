---
read_when:
    - De juiste `openclaw`-subopdracht vinden
    - Globale vlaggen of regels voor uitvoeropmaak opzoeken
summary: 'OpenClaw CLI-index: opdrachtenlijst, globale vlaggen en links naar pagina''s per opdracht'
title: CLI-referentie
x-i18n:
    generated_at: "2026-07-16T15:22:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` is het belangrijkste CLI-toegangspunt. Elke kernopdracht heeft een eigen
referentiepagina of wordt gedocumenteerd bij de opdracht waarvoor deze een alias is; deze index bevat
de opdrachten, globale vlaggen en regels voor uitvoeropmaak die voor de hele CLI gelden.

Installatieopdrachten per doel:

- `openclaw setup` en `openclaw onboard` verifiëren eerst inferentie en starten daarna OpenClaw voor de configuratie van Gateway, werkruimte, kanalen, skills en statuscontroles.
- `openclaw setup --baseline` maakt de basisconfiguratie en werkruimte zonder de begeleide onboardingflow te doorlopen.
- `openclaw configure` wijzigt specifieke onderdelen van een bestaande installatie: modelauthenticatie, Gateway, kanalen, plugins of skills.
- `openclaw channels add` configureert kanaalaccounts nadat de basis bestaat; voer uit zonder vlaggen voor begeleide configuratie of met kanaalspecifieke vlaggen voor scripts.

## Opdrachtpagina's

| Gebied                       | Opdrachten                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installatie en onboarding    | [`openclaw`](/cli/openclaw) · [`setup`](/nl/cli/setup) · [`onboard`](/nl/cli/onboard) · [`configure`](/nl/cli/configure) · [`config`](/nl/cli/config) · [`completion`](/nl/cli/completion) · [`doctor`](/nl/cli/doctor) · [`dashboard`](/nl/cli/dashboard) |
| Herstellen, back-up en migratie | [`backup`](/nl/cli/backup) · [`migrate`](/nl/cli/migrate) · [`reset`](/nl/cli/reset) · [`uninstall`](/nl/cli/uninstall) · [`update`](/nl/cli/update)                                                                                                 |
| Berichten en agents          | [`message`](/nl/cli/message) · [`agent`](/nl/cli/agent) · [`agents`](/nl/cli/agents) · [`attach`](/nl/cli/attach) · [`acp`](/nl/cli/acp) · [`mcp`](/nl/cli/mcp)                                                                                         |
| Status en sessies            | [`status`](/nl/cli/status) · [`health`](/nl/cli/health) · [`sessions`](/nl/cli/sessions) · [`audit`](/nl/cli/audit)                                                                                                                               |
| Gateway en logboeken         | [`gateway`](/nl/cli/gateway) · [`logs`](/nl/cli/logs) · [`system`](/nl/cli/system)                                                                                                                                                             |
| Modellen en inferentie       | [`models`](/nl/cli/models) · [`promos`](/nl/cli/promos) · [`infer`](/nl/cli/infer) · `capability` (alias voor [`infer`](/nl/cli/infer)) · [`memory`](/nl/cli/memory) · [`commitments`](/nl/cli/commitments) · [`wiki`](/nl/cli/wiki)                        |
| Netwerk en Nodes             | [`directory`](/nl/cli/directory) · [`nodes`](/nl/cli/nodes) · [`devices`](/nl/cli/devices) · [`node`](/nl/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| Runtime en sandbox           | [`approvals`](/nl/cli/approvals) · `exec-policy` (zie [`approvals`](/nl/cli/approvals)) · [`sandbox`](/nl/cli/sandbox) · [`tui`](/nl/cli/tui) · `chat`/`terminal` (aliassen voor [`tui --local`](/nl/cli/tui)) · [`browser`](/nl/cli/browser)             |
| Automatisering               | [`cron`](/nl/cli/cron) · [`tasks`](/nl/cli/tasks) · [`hooks`](/nl/cli/hooks) · [`webhooks`](/nl/cli/webhooks) · [`transcripts`](/nl/cli/transcripts)                                                                                                 |
| Detectie en documentatie     | [`dns`](/nl/cli/dns) · [`docs`](/nl/cli/docs)                                                                                                                                                                                               |
| Koppeling en kanalen         | [`pairing`](/nl/cli/pairing) · [`qr`](/nl/cli/qr) · [`channels`](/nl/cli/channels)                                                                                                                                                             |
| Beveiliging en plugins       | [`security`](/nl/cli/security) · [`secrets`](/nl/cli/secrets) · [`skills`](/nl/cli/skills) · [`plugins`](/nl/cli/plugins) · [`proxy`](/nl/cli/proxy)                                                                                                 |
| Verouderde aliassen          | [`daemon`](/nl/cli/daemon) (Gateway-service) · [`clawbot`](/nl/cli/clawbot) (naamruimte)                                                                                                                                                     |
| Plugins (optioneel)          | [`path`](/nl/cli/path) · [`policy`](/nl/cli/policy) · [`voicecall`](/nl/cli/voicecall) · [`workboard`](/nl/cli/workboard) (indien geïnstalleerd)                                                                                                          |

## Globale vlaggen

| Vlag                    | Doel                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Isoleer status onder `~/.openclaw-dev`, gebruik standaard Gateway-poort 19001 en verschuif afgeleide poorten              |
| `--profile <name>`      | Isoleer status onder `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Voer de CLI uit in een actieve Podman-/Docker-container met de naam `<name>` (standaard: omgevingsvariabele `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Overschrijf het globale logniveau voor bestands- en console-uitvoer                                                 |
| `--no-color`            | Schakel ANSI-kleuren uit (`NO_COLOR=1` wordt ook gerespecteerd)                                                    |
| `--update`              | Verkorte vorm voor [`openclaw update`](/nl/cli/update); werkt voor zowel broncodecheck-outs als pakketinstallaties    |
| `-V`, `--version`, `-v` | Toon de versie en sluit af                                                                                  |

## Uitvoermodi

- ANSI-kleuren en voortgangsindicatoren worden alleen in TTY-sessies weergegeven.
- OSC-8-hyperlinks worden waar ondersteund als klikbare links weergegeven; anders
  valt de CLI terug op gewone URL's.
- `--json` (en `--plain` waar ondersteund) schakelt opmaak uit voor schone uitvoer.
- Langlopende opdrachten tonen een voortgangsindicator (OSC 9;4 waar ondersteund).

## Kleurenpalet

OpenClaw gebruikt een kreeftenpalet voor CLI-uitvoer:

| Token          | Hex       | Gebruikt voor                         |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Koppen, labels, primaire accenten |
| `accentBright` | `#FF7A3D` | Opdrachtnamen, nadruk              |
| `accentDim`    | `#D14A22` | Secundaire accenttekst             |
| `info`         | `#FF8A5B` | Informatieve waarden               |
| `success`      | `#2FBF71` | Geslaagde statussen                |
| `warn`         | `#FFB020` | Waarschuwingen, optievlaggen, terugvalopties |
| `error`        | `#E23D2D` | Fouten, mislukkingen               |
| `muted`        | `#8B7F77` | Minder nadruk, metagegevens        |

Gezaghebbende bron voor het palet: `packages/terminal-core/src/palette.ts`.

## Opdrachtstructuur

<Accordion title="Volledige opdrachtstructuur">

Dit overzicht omvat kernopdrachten en hun belangrijkste subopdrachten. Door plugins toegevoegde
subopdrachten (bijvoorbeeld onder `skills`, `plugins` en `wiki`) ontwikkelen zich
onafhankelijk; voer `<command> --help` uit voor de gezaghebbende, actuele lijst.

```
openclaw [--dev] [--profile <name>] <command>
  openclaw
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
  worker
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

Plugins kunnen aanvullende opdrachten op het hoogste niveau toevoegen, zoals
[`openclaw workboard`](/nl/cli/workboard) of `openclaw voicecall`.

</Accordion>

## Slash-opdrachten in chats

Chatberichten ondersteunen `/...`-opdrachten. Zie [slash-opdrachten](/nl/tools/slash-commands).

Hoogtepunten:

- `/status` - snelle diagnostiek.
- `/trace` - sessiegebonden traceer-/debugregels voor Plugins.
- `/config` - blijvende configuratiewijzigingen.
- `/debug` - configuratieoverschrijvingen die alleen tijdens runtime gelden (geheugen, niet schijf; vereist `commands.debug: true`).

## Gebruiksregistratie

`openclaw status --usage` en de Control UI tonen het providergebruik en quotum wanneer
OAuth-/API-referenties beschikbaar zijn. Gegevens komen rechtstreeks van de gebruikseindpunten
van providers en worden genormaliseerd naar `X% left`. Providers met actuele
gebruiksvensters: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi en z.ai.

Zie [Gebruiksregistratie](/nl/concepts/usage-tracking) voor meer informatie.

## Gerelateerd

- [Slash-opdrachten](/nl/tools/slash-commands)
- [Configuratie](/nl/gateway/configuration)
- [Omgeving](/nl/help/environment)

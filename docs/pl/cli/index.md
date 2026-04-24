---
read_when:
    - Znajdowanie właściwego podpolecenia `openclaw`
    - Wyszukiwanie globalnych flag lub zasad stylizacji danych wyjściowych
summary: 'Indeks CLI OpenClaw: lista poleceń, globalne flagi i linki do stron poszczególnych poleceń'
title: Dokumentacja referencyjna CLI
x-i18n:
    generated_at: "2026-04-24T09:02:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw` jest głównym punktem wejścia CLI. Każde główne polecenie ma albo
dedykowaną stronę dokumentacji referencyjnej, albo jest udokumentowane razem z poleceniem, którego jest aliasem; ten
indeks zawiera listę poleceń, globalne flagi oraz zasady stylizacji danych wyjściowych,
które obowiązują w całym CLI.

## Strony poleceń

| Obszar               | Polecenia                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfiguracja i wdrożenie | [`setup`](/pl/cli/setup) · [`onboard`](/pl/cli/onboard) · [`configure`](/pl/cli/configure) · [`config`](/pl/cli/config) · [`completion`](/pl/cli/completion) · [`doctor`](/pl/cli/doctor) · [`dashboard`](/pl/cli/dashboard)               |
| Reset i odinstalowanie | [`backup`](/pl/cli/backup) · [`reset`](/pl/cli/reset) · [`uninstall`](/pl/cli/uninstall) · [`update`](/pl/cli/update)                                                                                                            |
| Wiadomości i agenci  | [`message`](/pl/cli/message) · [`agent`](/pl/cli/agent) · [`agents`](/pl/cli/agents) · [`acp`](/pl/cli/acp) · [`mcp`](/pl/cli/mcp)                                                                                                   |
| Stan i sesje         | [`status`](/pl/cli/status) · [`health`](/pl/cli/health) · [`sessions`](/pl/cli/sessions)                                                                                                                                          |
| Gateway i logi       | [`gateway`](/pl/cli/gateway) · [`logs`](/pl/cli/logs) · [`system`](/pl/cli/system)                                                                                                                                                |
| Modele i inferencja  | [`models`](/pl/cli/models) · [`infer`](/pl/cli/infer) · `capability` (alias dla [`infer`](/pl/cli/infer)) · [`memory`](/pl/cli/memory) · [`wiki`](/pl/cli/wiki)                                                                     |
| Sieć i Node          | [`directory`](/pl/cli/directory) · [`nodes`](/pl/cli/nodes) · [`devices`](/pl/cli/devices) · [`node`](/pl/cli/node)                                                                                                                |
| Runtime i sandbox    | [`approvals`](/pl/cli/approvals) · `exec-policy` (zobacz [`approvals`](/pl/cli/approvals)) · [`sandbox`](/pl/cli/sandbox) · [`tui`](/pl/cli/tui) · `chat`/`terminal` (aliasy dla [`tui --local`](/pl/cli/tui)) · [`browser`](/pl/cli/browser) |
| Automatyzacja        | [`cron`](/pl/cli/cron) · [`tasks`](/pl/cli/tasks) · [`hooks`](/pl/cli/hooks) · [`webhooks`](/pl/cli/webhooks)                                                                                                                       |
| Wykrywanie i dokumentacja | [`dns`](/pl/cli/dns) · [`docs`](/pl/cli/docs)                                                                                                                                                                              |
| Parowanie i kanały   | [`pairing`](/pl/cli/pairing) · [`qr`](/pl/cli/qr) · [`channels`](/pl/cli/channels)                                                                                                                                                |
| Bezpieczeństwo i Pluginy | [`security`](/pl/cli/security) · [`secrets`](/pl/cli/secrets) · [`skills`](/pl/cli/skills) · [`plugins`](/pl/cli/plugins) · [`proxy`](/pl/cli/proxy)                                                                            |
| Starsze aliasy       | [`daemon`](/pl/cli/daemon) (usługa gateway) · [`clawbot`](/pl/cli/clawbot) (przestrzeń nazw)                                                                                                                                  |
| Pluginy (opcjonalne) | [`voicecall`](/pl/cli/voicecall) (jeśli zainstalowane)                                                                                                                                                                      |

## Globalne flagi

| Flaga                   | Cel                                                                   |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Izoluje stan w `~/.openclaw-dev` i przesuwa domyślne porty            |
| `--profile <name>`      | Izoluje stan w `~/.openclaw-<name>`                                   |
| `--container <name>`    | Kieruje wykonanie do nazwanego kontenera                              |
| `--no-color`            | Wyłącza kolory ANSI (`NO_COLOR=1` również jest respektowane)          |
| `--update`              | Skrót dla [`openclaw update`](/pl/cli/update) (tylko instalacje źródłowe) |
| `-V`, `--version`, `-v` | Wypisuje wersję i kończy działanie                                    |

## Tryby danych wyjściowych

- Kolory ANSI i wskaźniki postępu są renderowane tylko w sesjach TTY.
- Hiperłącza OSC-8 są renderowane jako klikalne linki tam, gdzie są obsługiwane; w przeciwnym razie
  CLI wraca do zwykłych URL-i.
- `--json` (oraz `--plain`, gdzie jest obsługiwane) wyłącza stylizację, aby zapewnić czyste dane wyjściowe.
- Polecenia długotrwałe pokazują wskaźnik postępu (OSC 9;4, jeśli jest obsługiwane).

Źródło prawdy dla palety: `src/terminal/palette.ts`.

## Drzewo poleceń

<Accordion title="Pełne drzewo poleceń">

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

Pluginy mogą dodawać dodatkowe polecenia najwyższego poziomu (na przykład `openclaw voicecall`).

</Accordion>

## Polecenia slash czatu

Wiadomości czatu obsługują polecenia `/...`. Zobacz [polecenia slash](/pl/tools/slash-commands).

Najważniejsze:

- `/status` — szybka diagnostyka.
- `/trace` — linie śledzenia/debugowania Pluginów ograniczone do sesji.
- `/config` — utrwalone zmiany konfiguracji.
- `/debug` — nadpisania konfiguracji tylko w runtime (pamięć, nie dysk; wymaga `commands.debug: true`).

## Śledzenie użycia

`openclaw status --usage` oraz interfejs Control UI pokazują użycie/limity dostawców, gdy
dostępne są poświadczenia OAuth/API. Dane pochodzą bezpośrednio z endpointów użycia dostawców
i są normalizowane do postaci `X% left`. Dostawcy z bieżącymi
oknami użycia: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi oraz z.ai.

Zobacz [Śledzenie użycia](/pl/concepts/usage-tracking), aby poznać szczegóły.

## Powiązane

- [Polecenia slash](/pl/tools/slash-commands)
- [Konfiguracja](/pl/gateway/configuration)
- [Środowisko](/pl/help/environment)

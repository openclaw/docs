---
read_when:
    - Znajdowanie właściwego podpolecenia `openclaw`
    - Wyszukiwanie globalnych flag lub reguł stylizacji danych wyjściowych
summary: 'Indeks CLI OpenClaw: lista poleceń, flagi globalne i łącza do stron poszczególnych poleceń'
title: Dokumentacja CLI
x-i18n:
    generated_at: "2026-07-16T18:12:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` jest głównym punktem wejścia CLI. Każde podstawowe polecenie ma osobną
stronę referencyjną lub jest udokumentowane wraz z poleceniem, dla którego stanowi alias; ten indeks zawiera
polecenia, flagi globalne i reguły stylizacji danych wyjściowych obowiązujące w całym CLI.

Polecenia konfiguracji według przeznaczenia:

- `openclaw setup` i `openclaw onboard` najpierw weryfikują wnioskowanie, a następnie uruchamiają OpenClaw w celu skonfigurowania Gateway, przestrzeni roboczej, kanałów, umiejętności i kontroli kondycji.
- `openclaw setup --baseline` tworzy konfigurację bazową i przestrzeń roboczą bez przechodzenia przez prowadzony proces wdrażania.
- `openclaw configure` zmienia wybrane części istniejącej konfiguracji: uwierzytelnianie modelu, Gateway, kanały, pluginy lub umiejętności.
- `openclaw channels add` konfiguruje konta kanałów po utworzeniu konfiguracji bazowej; uruchom bez flag, aby przejść przez konfigurację z przewodnikiem, lub z flagami specyficznymi dla kanału na potrzeby skryptów.

## Strony poleceń

| Obszar                         | Polecenia                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Konfiguracja i wdrażanie         | [`openclaw`](/cli/openclaw) · [`setup`](/pl/cli/setup) · [`onboard`](/pl/cli/onboard) · [`configure`](/pl/cli/configure) · [`config`](/pl/cli/config) · [`completion`](/pl/cli/completion) · [`doctor`](/pl/cli/doctor) · [`dashboard`](/pl/cli/dashboard) |
| Resetowanie, kopie zapasowe i migracja | [`backup`](/pl/cli/backup) · [`migrate`](/pl/cli/migrate) · [`reset`](/pl/cli/reset) · [`uninstall`](/pl/cli/uninstall) · [`update`](/pl/cli/update)                                                                                                 |
| Wiadomości i agenci         | [`message`](/pl/cli/message) · [`agent`](/pl/cli/agent) · [`agents`](/pl/cli/agents) · [`attach`](/pl/cli/attach) · [`acp`](/pl/cli/acp) · [`mcp`](/pl/cli/mcp)                                                                                         |
| Kondycja i sesje          | [`status`](/pl/cli/status) · [`health`](/pl/cli/health) · [`sessions`](/pl/cli/sessions) · [`audit`](/pl/cli/audit)                                                                                                                               |
| Gateway i dzienniki             | [`gateway`](/pl/cli/gateway) · [`logs`](/pl/cli/logs) · [`system`](/pl/cli/system)                                                                                                                                                             |
| Modele i wnioskowanie         | [`models`](/pl/cli/models) · [`promos`](/pl/cli/promos) · [`infer`](/pl/cli/infer) · `capability` (alias polecenia [`infer`](/pl/cli/infer)) · [`memory`](/pl/cli/memory) · [`commitments`](/pl/cli/commitments) · [`wiki`](/pl/cli/wiki)                        |
| Sieć i węzły            | [`directory`](/pl/cli/directory) · [`nodes`](/pl/cli/nodes) · [`devices`](/pl/cli/devices) · [`node`](/pl/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| Środowisko uruchomieniowe i piaskownica          | [`approvals`](/pl/cli/approvals) · `exec-policy` (zobacz [`approvals`](/pl/cli/approvals)) · [`sandbox`](/pl/cli/sandbox) · [`tui`](/pl/cli/tui) · `chat`/`terminal` (aliasy polecenia [`tui --local`](/pl/cli/tui)) · [`browser`](/pl/cli/browser)             |
| Automatyzacja                   | [`cron`](/pl/cli/cron) · [`tasks`](/pl/cli/tasks) · [`hooks`](/pl/cli/hooks) · [`webhooks`](/pl/cli/webhooks) · [`transcripts`](/pl/cli/transcripts)                                                                                                 |
| Wykrywanie i dokumentacja           | [`dns`](/pl/cli/dns) · [`docs`](/pl/cli/docs)                                                                                                                                                                                               |
| Parowanie i kanały         | [`pairing`](/pl/cli/pairing) · [`qr`](/pl/cli/qr) · [`channels`](/pl/cli/channels)                                                                                                                                                             |
| Bezpieczeństwo i pluginy         | [`security`](/pl/cli/security) · [`secrets`](/pl/cli/secrets) · [`skills`](/pl/cli/skills) · [`plugins`](/pl/cli/plugins) · [`proxy`](/pl/cli/proxy)                                                                                                 |
| Starsze aliasy               | [`daemon`](/pl/cli/daemon) (usługa Gateway) · [`clawbot`](/pl/cli/clawbot) (przestrzeń nazw)                                                                                                                                                     |
| Pluginy (opcjonalne)           | [`path`](/pl/cli/path) · [`policy`](/pl/cli/policy) · [`voicecall`](/pl/cli/voicecall) · [`workboard`](/pl/cli/workboard) (jeśli zainstalowano)                                                                                                          |

## Flagi globalne

| Flaga                    | Przeznaczenie                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Izoluje stan w `~/.openclaw-dev`, ustawia domyślny port Gateway na 19001 i przesuwa porty pochodne              |
| `--profile <name>`      | Izoluje stan w `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Uruchamia CLI wewnątrz działającego kontenera Podman/Docker o nazwie `<name>` (domyślnie: zmienna środowiskowa `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Zastępuje globalny poziom rejestrowania dla danych wyjściowych zapisywanych w pliku i wyświetlanych w konsoli                                                 |
| `--no-color`            | Wyłącza kolory ANSI (uwzględniana jest również zmienna `NO_COLOR=1`)                                                    |
| `--update`              | Skrót polecenia [`openclaw update`](/pl/cli/update); działa zarówno dla kopii roboczych kodu źródłowego, jak i instalacji pakietów    |
| `-V`, `--version`, `-v` | Wyświetla wersję i kończy działanie                                                                                  |

## Tryby wyjściowe

- Kolory ANSI i wskaźniki postępu są wyświetlane tylko w sesjach TTY.
- Hiperłącza OSC-8 są wyświetlane jako klikalne linki tam, gdzie jest to obsługiwane; w przeciwnym razie
  CLI używa zwykłych adresów URL.
- `--json` (oraz `--plain`, jeśli jest obsługiwana) wyłącza stylizację, zapewniając czyste dane wyjściowe.
- Długotrwałe polecenia wyświetlają wskaźnik postępu (OSC 9;4, jeśli jest obsługiwany).

## Paleta kolorów

OpenClaw używa palety homarowej w danych wyjściowych CLI:

| Token          | Hex       | Zastosowanie                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Nagłówki, etykiety, główne wyróżnienia |
| `accentBright` | `#FF7A3D` | Nazwy poleceń, akcentowanie              |
| `accentDim`    | `#D14A22` | Tekst dodatkowego wyróżnienia             |
| `info`         | `#FF8A5B` | Wartości informacyjne                 |
| `success`      | `#2FBF71` | Stany powodzenia                       |
| `warn`         | `#FFB020` | Ostrzeżenia, flagi opcji, mechanizmy rezerwowe    |
| `error`        | `#E23D2D` | Błędy, niepowodzenia                     |
| `muted`        | `#8B7F77` | Elementy mniej wyeksponowane, metadane                |

Źródło prawdy dla palety: `packages/terminal-core/src/palette.ts`.

## Drzewo poleceń

<Accordion title="Pełne drzewo poleceń">

Ta mapa obejmuje podstawowe polecenia i ich główne podpolecenia. Podpolecenia dodawane przez pluginy
(na przykład w `skills`, `plugins` i `wiki`) rozwijają się
niezależnie; uruchom `<command> --help`, aby uzyskać miarodajną, aktualną listę.

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

Pluginy mogą dodawać dodatkowe polecenia najwyższego poziomu, takie jak
[`openclaw workboard`](/pl/cli/workboard) lub `openclaw voicecall`.

</Accordion>

## Polecenia ukośnikowe czatu

Wiadomości czatu obsługują polecenia `/...`. Zobacz [polecenia ukośnikowe](/pl/tools/slash-commands).

Najważniejsze funkcje:

- `/status` — szybka diagnostyka.
- `/trace` — wiersze śledzenia/debugowania pluginu ograniczone do sesji.
- `/config` — utrwalone zmiany konfiguracji.
- `/debug` — nadpisania konfiguracji wyłącznie w czasie działania (w pamięci, nie na dysku; wymaga `commands.debug: true`).

## Śledzenie użycia

`openclaw status --usage` oraz interfejs Control UI przedstawiają użycie i limity dostawcy, gdy
dostępne są dane uwierzytelniające OAuth/API. Dane pochodzą bezpośrednio z punktów
końcowych użycia dostawców i są normalizowane do `X% left`. Dostawcy z bieżącymi
oknami użycia: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi oraz z.ai.

Szczegółowe informacje zawiera sekcja [Śledzenie użycia](/pl/concepts/usage-tracking).

## Powiązane

- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [Konfiguracja](/pl/gateway/configuration)
- [Środowisko](/pl/help/environment)

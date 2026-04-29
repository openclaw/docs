---
read_when:
    - Пошук відповідної `openclaw` підкоманди
    - Пошук глобальних прапорців або правил стилізації виводу
summary: 'Індекс OpenClaw CLI: список команд, глобальні прапорці та посилання на сторінки окремих команд'
title: Довідник CLI
x-i18n:
    generated_at: "2026-04-29T21:45:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` — основна точка входу CLI. Кожна основна команда має або
окрему довідкову сторінку, або задокументована разом із командою, псевдонімом
якої вона є; цей індекс перелічує команди, глобальні прапорці та правила
стилізації виводу, що застосовуються в усьому CLI.

## Сторінки команд

| Область              | Команди                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Налаштування та початок роботи | [`crestodian`](/uk/cli/crestodian) · [`setup`](/uk/cli/setup) · [`onboard`](/uk/cli/onboard) · [`configure`](/uk/cli/configure) · [`config`](/uk/cli/config) · [`completion`](/uk/cli/completion) · [`doctor`](/uk/cli/doctor) · [`dashboard`](/uk/cli/dashboard) |
| Скидання та видалення | [`backup`](/uk/cli/backup) · [`reset`](/uk/cli/reset) · [`uninstall`](/uk/cli/uninstall) · [`update`](/uk/cli/update)                                                                                                                                 |
| Повідомлення та агенти | [`message`](/uk/cli/message) · [`agent`](/uk/cli/agent) · [`agents`](/uk/cli/agents) · [`acp`](/uk/cli/acp) · [`mcp`](/uk/cli/mcp)                                                                                                                       |
| Стан і сесії         | [`status`](/uk/cli/status) · [`health`](/uk/cli/health) · [`sessions`](/uk/cli/sessions)                                                                                                                                                           |
| Gateway і журнали    | [`gateway`](/uk/cli/gateway) · [`logs`](/uk/cli/logs) · [`system`](/uk/cli/system)                                                                                                                                                                 |
| Моделі та інференс   | [`models`](/uk/cli/models) · [`infer`](/uk/cli/infer) · `capability` (псевдонім для [`infer`](/uk/cli/infer)) · [`memory`](/uk/cli/memory) · [`commitments`](/uk/cli/commitments) · [`wiki`](/uk/cli/wiki)                                                      |
| Мережа та вузли      | [`directory`](/uk/cli/directory) · [`nodes`](/uk/cli/nodes) · [`devices`](/uk/cli/devices) · [`node`](/uk/cli/node)                                                                                                                                   |
| Runtime і пісочниця  | [`approvals`](/uk/cli/approvals) · `exec-policy` (див. [`approvals`](/uk/cli/approvals)) · [`sandbox`](/uk/cli/sandbox) · [`tui`](/uk/cli/tui) · `chat`/`terminal` (псевдоніми для [`tui --local`](/uk/cli/tui)) · [`browser`](/uk/cli/browser)                 |
| Автоматизація        | [`cron`](/uk/cli/cron) · [`tasks`](/uk/cli/tasks) · [`hooks`](/uk/cli/hooks) · [`webhooks`](/uk/cli/webhooks)                                                                                                                                         |
| Виявлення та документація | [`dns`](/uk/cli/dns) · [`docs`](/uk/cli/docs)                                                                                                                                                                                                   |
| Сполучення та канали | [`pairing`](/uk/cli/pairing) · [`qr`](/uk/cli/qr) · [`channels`](/uk/cli/channels)                                                                                                                                                                 |
| Безпека та Plugin    | [`security`](/uk/cli/security) · [`secrets`](/uk/cli/secrets) · [`skills`](/uk/cli/skills) · [`plugins`](/uk/cli/plugins) · [`proxy`](/uk/cli/proxy)                                                                                                     |
| Застарілі псевдоніми | [`daemon`](/uk/cli/daemon) (служба Gateway) · [`clawbot`](/uk/cli/clawbot) (простір імен)                                                                                                                                                         |
| Plugin (необов'язково) | [`voicecall`](/uk/cli/voicecall) (якщо встановлено)                                                                                                                                                                                              |

## Глобальні прапорці

| Прапорець              | Призначення                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Ізолює стан у `~/.openclaw-dev` і зміщує стандартні порти            |
| `--profile <name>`      | Ізолює стан у `~/.openclaw-<name>`                                   |
| `--container <name>`    | Націлює виконання на іменований контейнер                            |
| `--no-color`            | Вимикає кольори ANSI (`NO_COLOR=1` також враховується)               |
| `--update`              | Скорочення для [`openclaw update`](/uk/cli/update) (лише встановлення з вихідного коду) |
| `-V`, `--version`, `-v` | Друкує версію та завершує роботу                                     |

## Режими виводу

- Кольори ANSI та індикатори прогресу відображаються лише в TTY-сесіях.
- Гіперпосилання OSC-8 відображаються як клікабельні посилання там, де це підтримується; інакше
  CLI повертається до звичайних URL.
- `--json` (і `--plain`, де підтримується) вимикає стилізацію для чистого виводу.
- Довготривалі команди показують індикатор прогресу (OSC 9;4, якщо підтримується).

Джерело істини для палітри: `src/terminal/palette.ts`.

## Дерево команд

<Accordion title="Повне дерево команд">

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

Plugin можуть додавати додаткові команди верхнього рівня (наприклад, `openclaw voicecall`).

</Accordion>

## Slash-команди чату

Повідомлення чату підтримують команди `/...`. Див. [slash-команди](/uk/tools/slash-commands).

Основне:

- `/status` — швидка діагностика.
- `/trace` — рядки трасування/налагодження Plugin у межах сесії.
- `/config` — збережені зміни конфігурації.
- `/debug` — перевизначення конфігурації лише під час виконання (у пам'яті, не на диску; потребує `commands.debug: true`).

## Відстеження використання

`openclaw status --usage` і Control UI показують використання/квоту провайдера, коли
доступні облікові дані OAuth/API. Дані надходять безпосередньо з кінцевих точок
використання провайдерів і нормалізуються до `X% left`. Провайдери з поточними
вікнами використання: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi та z.ai.

Докладніше див. [Відстеження використання](/uk/concepts/usage-tracking).

## Пов'язане

- [Slash-команди](/uk/tools/slash-commands)
- [Конфігурація](/uk/gateway/configuration)
- [Середовище](/uk/help/environment)

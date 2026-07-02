---
read_when:
    - Поиск подходящей подкоманды `openclaw`
    - Поиск глобальных флагов или правил оформления вывода
summary: 'Индекс OpenClaw CLI: список команд, глобальные флаги и ссылки на страницы отдельных команд'
title: Справочник CLI
x-i18n:
    generated_at: "2026-07-02T01:06:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw` — основная точка входа CLI. Каждая основная команда имеет либо
отдельную справочную страницу, либо документирована вместе с командой, для которой она является псевдонимом; этот
индекс перечисляет команды, глобальные флаги и правила оформления вывода, которые
применяются во всем CLI.

Используйте команды настройки по назначению:

- `openclaw setup` и `openclaw onboard` запускают полный управляемый путь первого запуска для gateway, аутентификации модели, рабочей области, каналов, skills и проверки состояния.
- `openclaw setup --baseline` создает базовую конфигурацию и рабочую область без прохождения управляемого потока онбординга.
- `openclaw configure` изменяет целевые части существующей настройки, такие как аутентификация модели, gateway, каналы, plugins или skills.
- `openclaw channels add` настраивает учетные записи каналов после создания базовой конфигурации; запускайте ее без флагов для управляемой настройки канала или с флагами, специфичными для канала, для скриптов.

## Страницы команд

| Область              | Команды                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Настройка и онбординг | [`crestodian`](/ru/cli/crestodian) · [`setup`](/ru/cli/setup) · [`onboard`](/ru/cli/onboard) · [`configure`](/ru/cli/configure) · [`config`](/ru/cli/config) · [`completion`](/ru/cli/completion) · [`doctor`](/ru/cli/doctor) · [`dashboard`](/ru/cli/dashboard) |
| Сброс и удаление     | [`backup`](/ru/cli/backup) · [`reset`](/ru/cli/reset) · [`uninstall`](/ru/cli/uninstall) · [`update`](/ru/cli/update)                                                                                                                                 |
| Сообщения и агенты   | [`message`](/ru/cli/message) · [`agent`](/ru/cli/agent) · [`agents`](/ru/cli/agents) · [`attach`](/cli/attach) · [`acp`](/ru/cli/acp) · [`mcp`](/ru/cli/mcp)                                                                                             |
| Состояние и сессии   | [`status`](/ru/cli/status) · [`health`](/ru/cli/health) · [`sessions`](/ru/cli/sessions)                                                                                                                                                           |
| Gateway и журналы    | [`gateway`](/ru/cli/gateway) · [`logs`](/ru/cli/logs) · [`system`](/ru/cli/system)                                                                                                                                                                 |
| Модели и инференс    | [`models`](/ru/cli/models) · [`infer`](/ru/cli/infer) · `capability` (псевдоним для [`infer`](/ru/cli/infer)) · [`memory`](/ru/cli/memory) · [`commitments`](/ru/cli/commitments) · [`wiki`](/ru/cli/wiki)                                                      |
| Сеть и узлы          | [`directory`](/ru/cli/directory) · [`nodes`](/ru/cli/nodes) · [`devices`](/ru/cli/devices) · [`node`](/ru/cli/node)                                                                                                                                   |
| Среда выполнения и песочница | [`approvals`](/ru/cli/approvals) · `exec-policy` (см. [`approvals`](/ru/cli/approvals)) · [`sandbox`](/ru/cli/sandbox) · [`tui`](/ru/cli/tui) · `chat`/`terminal` (псевдонимы для [`tui --local`](/ru/cli/tui)) · [`browser`](/ru/cli/browser)                 |
| Автоматизация        | [`cron`](/ru/cli/cron) · [`tasks`](/ru/cli/tasks) · [`hooks`](/ru/cli/hooks) · [`webhooks`](/ru/cli/webhooks) · [`transcripts`](/ru/cli/transcripts)                                                                                                     |
| Обнаружение и документация | [`dns`](/ru/cli/dns) · [`docs`](/ru/cli/docs)                                                                                                                                                                                                   |
| Сопряжение и каналы  | [`pairing`](/ru/cli/pairing) · [`qr`](/ru/cli/qr) · [`channels`](/ru/cli/channels)                                                                                                                                                                 |
| Безопасность и plugins | [`security`](/ru/cli/security) · [`secrets`](/ru/cli/secrets) · [`skills`](/ru/cli/skills) · [`plugins`](/ru/cli/plugins) · [`proxy`](/ru/cli/proxy)                                                                                                     |
| Устаревшие псевдонимы | [`daemon`](/ru/cli/daemon) (служба gateway) · [`clawbot`](/ru/cli/clawbot) (пространство имен)                                                                                                                                                         |
| Plugins (необязательно) | [`path`](/ru/cli/path) · [`policy`](/ru/cli/policy) · [`voicecall`](/ru/cli/voicecall) · [`workboard`](/ru/cli/workboard) (если установлен)                                                                                                              |

## Глобальные флаги

| Флаг                    | Назначение                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Изолировать состояние в `~/.openclaw-dev` и сместить порты по умолчанию |
| `--profile <name>`      | Изолировать состояние в `~/.openclaw-<name>`                          |
| `--container <name>`    | Нацелить выполнение на именованный контейнер                          |
| `--no-color`            | Отключить цвета ANSI (`NO_COLOR=1` также учитывается)                 |
| `--update`              | Сокращение для [`openclaw update`](/ru/cli/update) (только установки из исходников) |
| `-V`, `--version`, `-v` | Вывести версию и завершить работу                                     |

## Режимы вывода

- Цвета ANSI и индикаторы прогресса отображаются только в сеансах TTY.
- Гиперссылки OSC-8 отображаются как кликабельные ссылки там, где это поддерживается; иначе
  CLI возвращается к обычным URL.
- `--json` (и `--plain`, где поддерживается) отключает оформление для чистого вывода.
- Долговыполняющиеся команды показывают индикатор прогресса (OSC 9;4, если поддерживается).

Источник истины для палитры: `src/terminal/palette.ts`.

## Дерево команд

<Accordion title="Полное дерево команд">

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

Plugins могут добавлять дополнительные команды верхнего уровня, такие как
[`openclaw workboard`](/ru/cli/workboard) или `openclaw voicecall`.

</Accordion>

## Слэш-команды чата

Сообщения чата поддерживают команды `/...`. См. [слэш-команды](/ru/tools/slash-commands).

Основное:

- `/status` — быстрая диагностика.
- `/trace` — строки трассировки/отладки plugin в рамках сессии.
- `/config` — сохраненные изменения конфигурации.
- `/debug` — переопределения конфигурации только для среды выполнения (в памяти, не на диске; требуется `commands.debug: true`).

## Отслеживание использования

`openclaw status --usage` и Control UI показывают использование/квоту провайдера, когда
доступны учетные данные OAuth/API. Данные поступают напрямую из конечных точек использования
провайдера и нормализуются в формат `X% left`. Провайдеры с текущими окнами использования:
Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi и z.ai.

Подробнее см. [Отслеживание использования](/ru/concepts/usage-tracking).

## Связанные материалы

- [Слэш-команды](/ru/tools/slash-commands)
- [Конфигурация](/ru/gateway/configuration)
- [Окружение](/ru/help/environment)

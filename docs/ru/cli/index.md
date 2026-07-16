---
read_when:
    - Поиск подходящей подкоманды `openclaw`
    - Поиск глобальных флагов или правил оформления вывода
summary: 'Индекс CLI OpenClaw: список команд, глобальные флаги и ссылки на страницы отдельных команд'
title: Справочник по CLI
x-i18n:
    generated_at: "2026-07-16T16:18:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` — основная точка входа CLI. Для каждой основной команды предусмотрена отдельная
справочная страница либо документация вместе с командой, псевдонимом которой она является; в этом указателе перечислены
команды, глобальные флаги и правила оформления вывода, применяемые во всём CLI.

Команды настройки по назначению:

- `openclaw setup` и `openclaw onboard` сначала проверяют логический вывод, а затем запускают OpenClaw для настройки Gateway, рабочего пространства, каналов, навыков и проверки работоспособности.
- `openclaw setup --baseline` создаёт базовую конфигурацию и рабочее пространство без прохождения пошагового процесса первоначальной настройки.
- `openclaw configure` изменяет отдельные части существующей настройки: аутентификацию модели, Gateway, каналы, плагины или навыки.
- `openclaw channels add` настраивает учётные записи каналов после создания базовой конфигурации; запустите без флагов для пошаговой настройки или с флагами конкретных каналов для сценариев.

## Страницы команд

| Область                      | Команды                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Настройка и начало работы    | [`openclaw`](/cli/openclaw) · [`setup`](/ru/cli/setup) · [`onboard`](/ru/cli/onboard) · [`configure`](/ru/cli/configure) · [`config`](/ru/cli/config) · [`completion`](/ru/cli/completion) · [`doctor`](/ru/cli/doctor) · [`dashboard`](/ru/cli/dashboard) |
| Сброс, резервное копирование и миграция | [`backup`](/ru/cli/backup) · [`migrate`](/ru/cli/migrate) · [`reset`](/ru/cli/reset) · [`uninstall`](/ru/cli/uninstall) · [`update`](/ru/cli/update)                                                                                                 |
| Обмен сообщениями и агенты   | [`message`](/ru/cli/message) · [`agent`](/ru/cli/agent) · [`agents`](/ru/cli/agents) · [`attach`](/ru/cli/attach) · [`acp`](/ru/cli/acp) · [`mcp`](/ru/cli/mcp)                                                                                         |
| Состояние и сеансы           | [`status`](/ru/cli/status) · [`health`](/ru/cli/health) · [`sessions`](/ru/cli/sessions) · [`audit`](/ru/cli/audit)                                                                                                                               |
| Gateway и журналы            | [`gateway`](/ru/cli/gateway) · [`logs`](/ru/cli/logs) · [`system`](/ru/cli/system)                                                                                                                                                             |
| Модели и логический вывод    | [`models`](/ru/cli/models) · [`promos`](/ru/cli/promos) · [`infer`](/ru/cli/infer) · `capability` (псевдоним для [`infer`](/ru/cli/infer)) · [`memory`](/ru/cli/memory) · [`commitments`](/ru/cli/commitments) · [`wiki`](/ru/cli/wiki)                        |
| Сеть и узлы                  | [`directory`](/ru/cli/directory) · [`nodes`](/ru/cli/nodes) · [`devices`](/ru/cli/devices) · [`node`](/ru/cli/node) · [`worker`](/ru/cli/worker)                                                                                                     |
| Среда выполнения и песочница | [`approvals`](/ru/cli/approvals) · `exec-policy` (см. [`approvals`](/ru/cli/approvals)) · [`sandbox`](/ru/cli/sandbox) · [`tui`](/ru/cli/tui) · `chat`/`terminal` (псевдонимы для [`tui --local`](/ru/cli/tui)) · [`browser`](/ru/cli/browser)             |
| Автоматизация                | [`cron`](/ru/cli/cron) · [`tasks`](/ru/cli/tasks) · [`hooks`](/ru/cli/hooks) · [`webhooks`](/ru/cli/webhooks) · [`transcripts`](/ru/cli/transcripts)                                                                                                 |
| Обнаружение и документация   | [`dns`](/ru/cli/dns) · [`docs`](/ru/cli/docs)                                                                                                                                                                                               |
| Сопряжение и каналы          | [`pairing`](/ru/cli/pairing) · [`qr`](/ru/cli/qr) · [`channels`](/ru/cli/channels)                                                                                                                                                             |
| Безопасность и плагины       | [`security`](/ru/cli/security) · [`secrets`](/ru/cli/secrets) · [`skills`](/ru/cli/skills) · [`plugins`](/ru/cli/plugins) · [`proxy`](/ru/cli/proxy)                                                                                                 |
| Устаревшие псевдонимы        | [`daemon`](/ru/cli/daemon) (служба Gateway) · [`clawbot`](/ru/cli/clawbot) (пространство имён)                                                                                                                                                     |
| Плагины (необязательно)      | [`path`](/ru/cli/path) · [`policy`](/ru/cli/policy) · [`voicecall`](/ru/cli/voicecall) · [`workboard`](/ru/cli/workboard) (если установлен)                                                                                                          |

## Глобальные флаги

| Флаг                    | Назначение                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Изолирует состояние в `~/.openclaw-dev`, задаёт порт Gateway по умолчанию 19001 и смещает производные порты              |
| `--profile <name>`      | Изолирует состояние в `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Запускает CLI внутри работающего контейнера Podman/Docker с именем `<name>` (по умолчанию: переменная среды `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Переопределяет глобальный уровень журналирования для вывода в файл и консоль                                                 |
| `--no-color`            | Отключает цвета ANSI (также учитывается `NO_COLOR=1`)                                                    |
| `--update`              | Сокращённая форма [`openclaw update`](/ru/cli/update); работает как для исходных рабочих копий, так и для установленных пакетов    |
| `-V`, `--version`, `-v` | Выводят версию и завершают работу                                                                                  |

## Режимы вывода

- Цвета ANSI и индикаторы выполнения отображаются только в сеансах TTY.
- Гиперссылки OSC-8 отображаются как активные ссылки там, где это поддерживается; в противном случае
  CLI использует обычные URL-адреса.
- `--json` (и `--plain`, где поддерживается) отключает оформление для чистого вывода.
- Длительно выполняющиеся команды отображают индикатор выполнения (OSC 9;4, если поддерживается).

## Цветовая палитра

OpenClaw использует палитру в стиле омара для вывода CLI:

| Токен          | Hex       | Использование                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Заголовки, метки, основные выделения |
| `accentBright` | `#FF7A3D` | Имена команд, акценты              |
| `accentDim`    | `#D14A22` | Текст вторичного выделения             |
| `info`         | `#FF8A5B` | Информационные значения                 |
| `success`      | `#2FBF71` | Состояния успешного выполнения                       |
| `warn`         | `#FFB020` | Предупреждения, флаги параметров, резервные варианты    |
| `error`        | `#E23D2D` | Ошибки, сбои                     |
| `muted`        | `#8B7F77` | Второстепенный текст, метаданные                |

Единственный достоверный источник палитры: `packages/terminal-core/src/palette.ts`.

## Дерево команд

<Accordion title="Полное дерево команд">

Эта схема охватывает основные команды и их главные подкоманды. Добавляемые плагинами
подкоманды (например, в `skills`, `plugins` и `wiki`) развиваются
независимо; выполните `<command> --help`, чтобы получить актуальный и авторитетный список.

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

Плагины могут добавлять дополнительные команды верхнего уровня, например
[`openclaw workboard`](/ru/cli/workboard) или `openclaw voicecall`.

</Accordion>

## Команды с косой чертой в чате

Сообщения чата поддерживают команды `/...`. См. [команды с косой чертой](/ru/tools/slash-commands).

Основные возможности:

- `/status` — быстрая диагностика.
- `/trace` — строки трассировки и отладки плагина в рамках сеанса.
- `/config` — сохраняемые изменения конфигурации.
- `/debug` — переопределения конфигурации только для среды выполнения (в памяти, не на диске; требуется `commands.debug: true`).

## Отслеживание использования

`openclaw status --usage` и интерфейс управления отображают использование и квоту провайдера, когда
доступны учётные данные OAuth/API. Данные поступают непосредственно из конечных точек
использования провайдеров и нормализуются в `X% left`. Провайдеры с текущими окнами
использования: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi и z.ai.

Подробности см. в разделе [Отслеживание использования](/ru/concepts/usage-tracking).

## Связанные материалы

- [Команды с косой чертой](/ru/tools/slash-commands)
- [Конфигурация](/ru/gateway/configuration)
- [Окружение](/ru/help/environment)

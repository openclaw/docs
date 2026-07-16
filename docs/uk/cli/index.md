---
read_when:
    - Пошук відповідної підкоманди `openclaw`
    - Пошук глобальних прапорців або правил оформлення виводу
summary: 'Індекс CLI OpenClaw: список команд, глобальні прапорці та посилання на сторінки окремих команд'
title: Довідник CLI
x-i18n:
    generated_at: "2026-07-16T17:47:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` — головна точка входу CLI. Кожна основна команда має окрему
довідкову сторінку або документується разом із командою, псевдонімом якої вона є; у цьому покажчику наведено
команди, глобальні прапорці та правила оформлення виводу, що діють у всьому CLI.

Команди налаштування за призначенням:

- `openclaw setup` і `openclaw onboard` спочатку перевіряють інференс, а потім запускають налаштування OpenClaw для Gateway, робочого простору, каналів, Skills і перевірки працездатності.
- `openclaw setup --baseline` створює базову конфігурацію та робочий простір без проходження покрокового процесу початкового налаштування.
- `openclaw configure` змінює окремі частини наявного налаштування: автентифікацію моделі, Gateway, канали, плагіни або Skills.
- `openclaw channels add` налаштовує облікові записи каналів після створення базової конфігурації; запустіть без прапорців для покрокового налаштування або з прапорцями певного каналу для сценаріїв.

## Сторінки команд

| Область                      | Команди                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Налаштування та початкова конфігурація | [`openclaw`](/cli/openclaw) · [`setup`](/uk/cli/setup) · [`onboard`](/uk/cli/onboard) · [`configure`](/uk/cli/configure) · [`config`](/uk/cli/config) · [`completion`](/uk/cli/completion) · [`doctor`](/uk/cli/doctor) · [`dashboard`](/uk/cli/dashboard) |
| Скидання, резервне копіювання та міграція | [`backup`](/uk/cli/backup) · [`migrate`](/uk/cli/migrate) · [`reset`](/uk/cli/reset) · [`uninstall`](/uk/cli/uninstall) · [`update`](/uk/cli/update)                                                                                                 |
| Обмін повідомленнями та агенти | [`message`](/uk/cli/message) · [`agent`](/uk/cli/agent) · [`agents`](/uk/cli/agents) · [`attach`](/uk/cli/attach) · [`acp`](/uk/cli/acp) · [`mcp`](/uk/cli/mcp)                                                                                         |
| Працездатність і сеанси      | [`status`](/uk/cli/status) · [`health`](/uk/cli/health) · [`sessions`](/uk/cli/sessions) · [`audit`](/uk/cli/audit)                                                                                                                               |
| Gateway і журнали            | [`gateway`](/uk/cli/gateway) · [`logs`](/uk/cli/logs) · [`system`](/uk/cli/system)                                                                                                                                                             |
| Моделі та інференс           | [`models`](/uk/cli/models) · [`promos`](/uk/cli/promos) · [`infer`](/uk/cli/infer) · `capability` (псевдонім для [`infer`](/uk/cli/infer)) · [`memory`](/uk/cli/memory) · [`commitments`](/uk/cli/commitments) · [`wiki`](/uk/cli/wiki)                        |
| Мережа та вузли              | [`directory`](/uk/cli/directory) · [`nodes`](/uk/cli/nodes) · [`devices`](/uk/cli/devices) · [`node`](/uk/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| Середовище виконання та пісочниця | [`approvals`](/uk/cli/approvals) · `exec-policy` (див. [`approvals`](/uk/cli/approvals)) · [`sandbox`](/uk/cli/sandbox) · [`tui`](/uk/cli/tui) · `chat`/`terminal` (псевдоніми для [`tui --local`](/uk/cli/tui)) · [`browser`](/uk/cli/browser)             |
| Автоматизація                | [`cron`](/uk/cli/cron) · [`tasks`](/uk/cli/tasks) · [`hooks`](/uk/cli/hooks) · [`webhooks`](/uk/cli/webhooks) · [`transcripts`](/uk/cli/transcripts)                                                                                                 |
| Виявлення та документація    | [`dns`](/uk/cli/dns) · [`docs`](/uk/cli/docs)                                                                                                                                                                                               |
| Сполучення та канали         | [`pairing`](/uk/cli/pairing) · [`qr`](/uk/cli/qr) · [`channels`](/uk/cli/channels)                                                                                                                                                             |
| Безпека та плагіни           | [`security`](/uk/cli/security) · [`secrets`](/uk/cli/secrets) · [`skills`](/uk/cli/skills) · [`plugins`](/uk/cli/plugins) · [`proxy`](/uk/cli/proxy)                                                                                                 |
| Застарілі псевдоніми         | [`daemon`](/uk/cli/daemon) (служба Gateway) · [`clawbot`](/uk/cli/clawbot) (простір імен)                                                                                                                                                     |
| Плагіни (необов’язково)      | [`path`](/uk/cli/path) · [`policy`](/uk/cli/policy) · [`voicecall`](/uk/cli/voicecall) · [`workboard`](/uk/cli/workboard) (якщо встановлено)                                                                                                          |

## Глобальні прапорці

| Прапорець               | Призначення                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Ізолювати стан у `~/.openclaw-dev`, установити типовий порт Gateway 19001 і змістити похідні порти              |
| `--profile <name>`      | Ізолювати стан у `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Запустити CLI всередині активного контейнера Podman/Docker з назвою `<name>` (типово: змінна середовища `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Перевизначити глобальний рівень журналювання для виводу у файл і консоль                                                 |
| `--no-color`            | Вимкнути кольори ANSI (`NO_COLOR=1` також враховується)                                                    |
| `--update`              | Скорочення для [`openclaw update`](/uk/cli/update); працює як для вихідних робочих копій, так і для встановлень пакетів    |
| `-V`, `--version`, `-v` | Вивести версію та завершити роботу                                                                                  |

## Режими виводу

- Кольори ANSI та індикатори перебігу відображаються лише в сеансах TTY.
- Гіперпосилання OSC-8 відображаються як активні посилання там, де це підтримується; в інших випадках
  CLI використовує звичайні URL-адреси.
- `--json` (і `--plain`, де підтримується) вимикає оформлення для чистого виводу.
- Тривалі команди показують індикатор перебігу (OSC 9;4, якщо підтримується).

## Колірна палітра

OpenClaw використовує омарову палітру для виводу CLI:

| Токен          | Hex       | Використовується для                   |
| -------------- | --------- | -------------------------------------- |
| `accent`       | `#FF5A2D` | Заголовків, міток, основних виділень   |
| `accentBright` | `#FF7A3D` | Назв команд, акцентування               |
| `accentDim`    | `#D14A22` | Другорядного виділеного тексту          |
| `info`         | `#FF8A5B` | Інформаційних значень                   |
| `success`      | `#2FBF71` | Станів успішного виконання              |
| `warn`         | `#FFB020` | Попереджень, прапорців параметрів, резервних варіантів |
| `error`        | `#E23D2D` | Помилок, невдалих виконань              |
| `muted`        | `#8B7F77` | Зниження акценту, метаданих             |

Єдине достовірне джерело палітри: `packages/terminal-core/src/palette.ts`.

## Дерево команд

<Accordion title="Повне дерево команд">

Ця схема охоплює основні команди та їхні головні підкоманди. Додані плагінами
підкоманди (наприклад, у `skills`, `plugins` і `wiki`) розвиваються
незалежно; виконайте `<command> --help`, щоб отримати авторитетний актуальний список.

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

Plugins можуть додавати додаткові команди верхнього рівня, як-от
[`openclaw workboard`](/uk/cli/workboard) або `openclaw voicecall`.

</Accordion>

## Команди з косою рискою в чаті

Повідомлення чату підтримують команди `/...`. Див. [команди з косою рискою](/uk/tools/slash-commands).

Основні можливості:

- `/status` — швидка діагностика.
- `/trace` — рядки трасування й налагодження Plugin у межах сеансу.
- `/config` — збережені зміни конфігурації.
- `/debug` — перевизначення конфігурації лише для середовища виконання (у пам’яті, а не на диску; потребує `commands.debug: true`).

## Відстеження використання

`openclaw status --usage` та інтерфейс керування показують використання й квоту провайдера, коли
доступні облікові дані OAuth/API. Дані надходять безпосередньо з кінцевих точок
використання провайдера й нормалізуються до `X% left`. Провайдери з поточними
вікнами використання: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi та z.ai.

Докладніше див. у розділі [Відстеження використання](/uk/concepts/usage-tracking).

## Пов’язані матеріали

- [Команди з косою рискою](/uk/tools/slash-commands)
- [Конфігурація](/uk/gateway/configuration)
- [Середовище](/uk/help/environment)

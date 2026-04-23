---
read_when:
    - Додавання або змінення команд чи параметрів CLI
    - Документування нових поверхонь команд
summary: Довідка CLI OpenClaw для команд, підкоманд і параметрів `openclaw`
title: Довідка CLI
x-i18n:
    generated_at: "2026-04-23T06:18:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff7d448e8f9f32936cdd286db09bcf0e746795176b2f3863ab378e0d1b61a5d
    source_path: cli/index.md
    workflow: 15
---

# Довідка CLI

Ця сторінка описує поточну поведінку CLI. Якщо команди змінюються, оновіть цю документацію.

## Сторінки команд

- [`setup`](/uk/cli/setup)
- [`onboard`](/uk/cli/onboard)
- [`configure`](/uk/cli/configure)
- [`config`](/uk/cli/config)
- [`completion`](/uk/cli/completion)
- [`doctor`](/uk/cli/doctor)
- [`dashboard`](/uk/cli/dashboard)
- [`backup`](/uk/cli/backup)
- [`reset`](/uk/cli/reset)
- [`uninstall`](/uk/cli/uninstall)
- [`update`](/uk/cli/update)
- [`message`](/uk/cli/message)
- [`agent`](/uk/cli/agent)
- [`agents`](/uk/cli/agents)
- [`acp`](/uk/cli/acp)
- [`mcp`](/uk/cli/mcp)
- [`status`](/uk/cli/status)
- [`health`](/uk/cli/health)
- [`sessions`](/uk/cli/sessions)
- [`gateway`](/uk/cli/gateway)
- [`logs`](/uk/cli/logs)
- [`system`](/uk/cli/system)
- [`models`](/uk/cli/models)
- [`infer`](/uk/cli/infer)
- [`memory`](/uk/cli/memory)
- [`wiki`](/uk/cli/wiki)
- [`directory`](/uk/cli/directory)
- [`nodes`](/uk/cli/nodes)
- [`devices`](/uk/cli/devices)
- [`node`](/uk/cli/node)
- [`approvals`](/uk/cli/approvals)
- [`sandbox`](/uk/cli/sandbox)
- [`tui`](/uk/cli/tui)
- [`browser`](/uk/cli/browser)
- [`cron`](/uk/cli/cron)
- [`tasks`](/uk/cli/tasks)
- [`flows`](/uk/cli/flows)
- [`dns`](/uk/cli/dns)
- [`docs`](/uk/cli/docs)
- [`hooks`](/uk/cli/hooks)
- [`webhooks`](/uk/cli/webhooks)
- [`pairing`](/uk/cli/pairing)
- [`qr`](/uk/cli/qr)
- [`plugins`](/uk/cli/plugins) (команди plugin)
- [`channels`](/uk/cli/channels)
- [`security`](/uk/cli/security)
- [`secrets`](/uk/cli/secrets)
- [`skills`](/uk/cli/skills)
- [`daemon`](/uk/cli/daemon) (застарілий псевдонім для команд сервісу gateway)
- [`clawbot`](/uk/cli/clawbot) (простір імен застарілих псевдонімів)
- [`voicecall`](/uk/cli/voicecall) (plugin; якщо встановлено)

## Глобальні прапорці

- `--dev`: ізолює стан у `~/.openclaw-dev` і змінює типові порти.
- `--profile <name>`: ізолює стан у `~/.openclaw-<name>`.
- `--container <name>`: націлює виконання на іменований контейнер.
- `--no-color`: вимикає кольори ANSI.
- `--update`: скорочення для `openclaw update` (лише для встановлень із джерела).
- `-V`, `--version`, `-v`: виводить версію та завершує роботу.

## Стилізація виводу

- Кольори ANSI та індикатори поступу відображаються лише в сеансах TTY.
- Гіперпосилання OSC-8 відображаються як клікабельні посилання в підтримуваних терміналах; інакше використовується звичайний URL.
- `--json` (і `--plain`, де підтримується) вимикає стилізацію для чистого виводу.
- `--no-color` вимикає стилізацію ANSI; також враховується `NO_COLOR=1`.
- Довготривалі команди показують індикатор поступу (OSC 9;4, якщо підтримується).

## Кольорова палітра

OpenClaw використовує палітру lobster для виводу CLI.

- `accent` (#FF5A2D): заголовки, мітки, основні акценти.
- `accentBright` (#FF7A3D): назви команд, виділення.
- `accentDim` (#D14A22): вторинний акцентний текст.
- `info` (#FF8A5B): інформаційні значення.
- `success` (#2FBF71): стани успіху.
- `warn` (#FFB020): попередження, резервні варіанти, привернення уваги.
- `error` (#E23D2D): помилки, збої.
- `muted` (#8B7F77): приглушення, метадані.

Джерело істини для палітри: `src/terminal/palette.ts` (палітра «lobster»).

## Дерево команд

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
  infer (псевдонім: capability)
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
```

Примітка: plugins можуть додавати додаткові команди верхнього рівня (наприклад, `openclaw voicecall`).

## Безпека

- `openclaw security audit` — перевіряє конфігурацію та локальний стан на поширені критичні помилки безпеки.
- `openclaw security audit --deep` — найкраща спроба live-перевірки Gateway.
- `openclaw security audit --fix` — посилює безпечні типові налаштування та дозволи стану/конфігурації.

## Secrets

### `secrets`

Керує SecretRefs і пов’язаною гігієною runtime/config.

Підкоманди:

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

Параметри `secrets reload`:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

Параметри `secrets audit`:

- `--check`
- `--allow-exec`
- `--json`

Параметри `secrets configure`:

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

Параметри `secrets apply --from <path>`:

- `--dry-run`
- `--allow-exec`
- `--json`

Примітки:

- `reload` — це Gateway RPC, який зберігає останній відомий справний знімок runtime, якщо розв’язання не вдається.
- `audit --check` повертає ненульовий код за наявності результатів перевірки; нерозв’язані посилання використовують ненульовий код завершення з вищим пріоритетом.
- Перевірки exec у режимі dry-run типово пропускаються; використовуйте `--allow-exec`, щоб явно їх увімкнути.

## Plugins

Керуйте plugins та їхньою конфігурацією:

- `openclaw plugins list` — виявляє plugins (використовуйте `--json` для машинного виводу).
- `openclaw plugins inspect <id>` — показує подробиці про plugin (`info` є псевдонімом).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — установлює plugin (або додає шлях plugin до `plugins.load.paths`; використовуйте `--force`, щоб перезаписати наявну ціль встановлення).
- `openclaw plugins marketplace list <marketplace>` — показує записи marketplace перед установленням.
- `openclaw plugins enable <id>` / `disable <id>` — перемикає `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — повідомляє про помилки завантаження plugin.

Більшість змін plugin потребують перезапуску gateway. Див. [/plugin](/uk/tools/plugin).

## Memory

Векторний пошук у `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — показує статистику індексу; використовуйте `--deep` для перевірок готовності vector + embedding або `--fix` для відновлення застарілих артефактів recall/promotion.
- `openclaw memory index` — повторно індексує файли пам’яті.
- `openclaw memory search "<query>"` (або `--query "<query>"`) — семантичний пошук у пам’яті.
- `openclaw memory promote` — ранжує короткочасні recalls і, за потреби, додає найкращі записи до `MEMORY.md`.

## Sandbox

Керує середовищами sandbox для ізольованого виконання агента. Див. [/cli/sandbox](/uk/cli/sandbox).

Підкоманди:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Примітки:

- `sandbox recreate` видаляє наявні середовища runtime, щоб під час наступного використання вони знову були ініціалізовані з поточною конфігурацією.
- Для бекендів `ssh` і OpenShell `remote` recreate видаляє канонічний віддалений робочий простір для вибраної області.

## Slash-команди чату

Повідомлення чату підтримують команди `/...` (текстові та нативні). Див. [/tools/slash-commands](/uk/tools/slash-commands).

Основне:

- `/status` для швидкої діагностики.
- `/trace` для рядків trace/debug plugins у межах сесії.
- `/config` для постійних змін конфігурації.
- `/debug` для перевизначень конфігурації лише на час runtime (пам’ять, не диск; потребує `commands.debug: true`).

## Налаштування + онбординг

### `completion`

Створює скрипти автодоповнення оболонки та, за потреби, встановлює їх у профіль вашої оболонки.

Параметри:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Примітки:

- Без `--install` або `--write-state` `completion` виводить скрипт у stdout.
- `--install` записує блок `OpenClaw Completion` до профілю вашої оболонки та спрямовує його на кешований скрипт у каталозі стану OpenClaw.

### `setup`

Ініціалізує конфігурацію та робочий простір.

Параметри:

- `--workspace <dir>`: шлях до робочого простору агента (типово `~/.openclaw/workspace`).
- `--wizard`: запустити онбординг.
- `--non-interactive`: запустити онбординг без запитів.
- `--mode <local|remote>`: режим онбордингу.
- `--remote-url <url>`: URL віддаленого Gateway.
- `--remote-token <token>`: токен віддаленого Gateway.

Онбординг запускається автоматично, коли присутні будь-які прапорці онбордингу (`--non-interactive`, `--mode`, `--remote-url`, `--remote-token`).

### `onboard`

Інтерактивний онбординг для gateway, робочого простору та Skills.

Параметри:

- `--workspace <dir>`
- `--reset` (скидання config + credentials + sessions перед онбордингом)
- `--reset-scope <config|config+creds+sessions|full>` (типово `config+creds+sessions`; використовуйте `full`, щоб також видалити робочий простір)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` є псевдонімом для `advanced`)
- `--auth-choice <choice>`, де `<choice>` — одне з:
  `chutes`, `deepseek-api-key`, `openai-codex`, `openai-api-key`,
  `openrouter-api-key`, `kilocode-api-key`, `litellm-api-key`, `ai-gateway-api-key`,
  `cloudflare-ai-gateway-api-key`, `moonshot-api-key`, `moonshot-api-key-cn`,
  `kimi-code-api-key`, `synthetic-api-key`, `venice-api-key`, `together-api-key`,
  `huggingface-api-key`, `apiKey`, `gemini-api-key`, `google-gemini-cli`, `zai-api-key`,
  `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`, `xiaomi-api-key`,
  `minimax-global-oauth`, `minimax-global-api`, `minimax-cn-oauth`, `minimax-cn-api`,
  `opencode-zen`, `opencode-go`, `github-copilot`, `copilot-proxy`, `xai-api-key`,
  `mistral-api-key`, `volcengine-api-key`, `byteplus-api-key`, `qianfan-api-key`,
  `qwen-standard-api-key-cn`, `qwen-standard-api-key`, `qwen-api-key-cn`, `qwen-api-key`,
  `modelstudio-standard-api-key-cn`, `modelstudio-standard-api-key`,
  `modelstudio-api-key-cn`, `modelstudio-api-key`, `custom-api-key`, `skip`
- Примітка щодо Qwen: `qwen-*` — це канонічне сімейство `auth-choice`. Ідентифікатори `modelstudio-*`
  і далі приймаються лише як застарілі псевдоніми сумісності.
- `--secret-input-mode <plaintext|ref>` (типово `plaintext`; використовуйте `ref`, щоб зберігати типові env-посилання провайдера замість ключів у відкритому вигляді)
- `--anthropic-api-key <key>`
- `--openai-api-key <key>`
- `--mistral-api-key <key>`
- `--openrouter-api-key <key>`
- `--ai-gateway-api-key <key>`
- `--moonshot-api-key <key>`
- `--kimi-code-api-key <key>`
- `--gemini-api-key <key>`
- `--zai-api-key <key>`
- `--minimax-api-key <key>`
- `--opencode-zen-api-key <key>`
- `--opencode-go-api-key <key>`
- `--custom-base-url <url>` (неінтерактивно; використовується з `--auth-choice custom-api-key`)
- `--custom-model-id <id>` (неінтерактивно; використовується з `--auth-choice custom-api-key`)
- `--custom-api-key <key>` (неінтерактивно; необов’язково; використовується з `--auth-choice custom-api-key`; якщо не вказано, використовується `CUSTOM_API_KEY`)
- `--custom-provider-id <id>` (неінтерактивно; необов’язковий власний ідентифікатор провайдера)
- `--custom-compatibility <openai|anthropic>` (неінтерактивно; необов’язково; типово `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (неінтерактивно; зберігає `gateway.auth.token` як env SecretRef; вимагає, щоб цю змінну середовища було встановлено; не можна поєднувати з `--gateway-token`)
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon` (псевдонім: `--skip-daemon`)
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>` (менеджер Node для setup/onboarding для Skills; рекомендовано pnpm, також підтримується bun)
- `--json`

### `configure`

Інтерактивний майстер конфігурації (моделі, канали, Skills, gateway).

Параметри:

- `--section <section>` (можна повторювати; обмежує майстер певними розділами)

### `config`

Неінтерактивні допоміжні засоби config (`get`/`set`/`unset`/`file`/`schema`/`validate`). Виконання `openclaw config` без
підкоманди запускає майстер.

Підкоманди:

- `config get <path>`: виводить значення config (шлях через крапку/квадратні дужки).
- `config set`: підтримує чотири режими присвоєння:
  - режим значення: `config set <path> <value>` (розбір як JSON5 або рядок)
  - режим побудови SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - режим побудови провайдера: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - пакетний режим: `config set --batch-json '<json>'` або `config set --batch-file <path>`
- `config set --dry-run`: перевіряє присвоєння без запису в `openclaw.json` (перевірки exec SecretRef типово пропускаються).
- `config set --allow-exec --dry-run`: явно вмикає перевірки dry-run для exec SecretRef (може виконувати команди провайдера).
- `config set --dry-run --json`: виводить машинозчитуваний dry-run-вивід (перевірки + сигнал повноти, операції, перевірені/пропущені refs, помилки).
- `config set --strict-json`: вимагає розбору JSON5 для введення path/value. `--json` лишається застарілим псевдонімом для строгого розбору поза режимом dry-run output.
- `config unset <path>`: видаляє значення.
- `config file`: виводить шлях до активного файлу config.
- `config schema`: виводить згенеровану JSON schema для `openclaw.json`, включно з поширеними полями метаданих документації `title` / `description` у вкладених об’єктах, wildcard, елементах масиву та гілках композиції, а також найкращу можливу live-метаінформацію schema plugin/channel.
- `config validate`: перевіряє поточну config за schema без запуску gateway.
- `config validate --json`: виводить машинозчитуваний JSON.

### `doctor`

Перевірки стану + швидкі виправлення (config + gateway + застарілі сервіси).

Параметри:

- `--no-workspace-suggestions`: вимикає підказки щодо пам’яті робочого простору.
- `--yes`: приймає типові значення без запитів (headless).
- `--non-interactive`: пропускає запити; застосовує лише безпечні міграції.
- `--deep`: сканує системні сервіси на наявність додаткових встановлень gateway.
- `--repair` (псевдонім: `--fix`): намагається автоматично виправити виявлені проблеми.
- `--force`: примусово виконує виправлення, навіть коли це не є строго необхідним.
- `--generate-gateway-token`: генерує новий токен автентифікації gateway.

### `dashboard`

Відкриває Control UI з вашим поточним токеном.

Параметри:

- `--no-open`: виводить URL, але не запускає браузер

Примітки:

- Для токенів gateway, якими керує SecretRef, `dashboard` виводить або відкриває URL без токена замість розкриття секрету у виводі термінала або аргументах запуску браузера.

### `update`

Оновлює встановлений CLI.

Кореневі параметри:

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

Підкоманди:

- `update status`
- `update wizard`

Параметри `update status`:

- `--json`
- `--timeout <seconds>`

Параметри `update wizard`:

- `--timeout <seconds>`

Примітки:

- `openclaw --update` переписується на `openclaw update`.

### `backup`

Створює та перевіряє локальні резервні архіви стану OpenClaw.

Підкоманди:

- `backup create`
- `backup verify <archive>`

Параметри `backup create`:

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

Параметри `backup verify <archive>`:

- `--json`

## Допоміжні засоби для каналів

### `channels`

Керування обліковими записами чат-каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Microsoft Teams).

Підкоманди:

- `channels list`: показує налаштовані канали та профілі автентифікації.
- `channels status`: перевіряє доступність gateway і стан каналів (`--probe` запускає live-перевірки/аудит для кожного облікового запису, коли gateway доступний; якщо ні, повертається до зведень каналів лише за config. Використовуйте `openclaw health` або `openclaw status --deep` для ширших перевірок стану gateway).
- Порада: `channels status` виводить попередження з рекомендованими виправленнями, коли може виявити поширені помилки конфігурації (а потім спрямовує вас до `openclaw doctor`).
- `channels logs`: показує нещодавні журнали каналів із файлу журналу gateway.
- `channels add`: налаштування у стилі майстра, якщо не передано жодних прапорців; прапорці перемикають у неінтерактивний режим.
  - Під час додавання не типового облікового запису до каналу, який досі використовує однокористувацьку config верхнього рівня, OpenClaw переносить значення в області облікового запису до мапи облікових записів каналу перед записом нового облікового запису. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/default-ціль.
  - Неінтерактивний `channels add` не створює й не оновлює bindings автоматично; bindings лише для каналу й далі відповідатимуть типовому обліковому запису.
- `channels remove`: типово вимикає; передайте `--delete`, щоб видалити записи config без запитів.
- `channels login`: інтерактивний вхід у канал (лише WhatsApp Web).
- `channels logout`: вихід із сесії каналу (якщо підтримується).

Поширені параметри:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: ідентифікатор облікового запису каналу (типово `default`)
- `--name <label>`: відображувана назва облікового запису

Параметри `channels login`:

- `--channel <channel>` (типово `whatsapp`; підтримує `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Параметри `channels logout`:

- `--channel <channel>` (типово `whatsapp`)
- `--account <id>`

Параметри `channels list`:

- `--no-usage`: пропускає знімки використання/квот провайдера моделей (лише для OAuth/API-backed).
- `--json`: виводить JSON (включає usage, якщо не задано `--no-usage`).

Параметри `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Параметри `channels capabilities`:

- `--channel <name>`
- `--account <id>` (лише з `--channel`)
- `--target <dest>`
- `--timeout <ms>`
- `--json`

Параметри `channels resolve`:

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

Параметри `channels logs`:

- `--channel <name|all>` (типово `all`)
- `--lines <n>` (типово `200`)
- `--json`

Примітки:

- `channels login` підтримує `--verbose`.
- `channels capabilities --account` застосовується лише коли задано `--channel`.
- `channels status --probe` може показувати стан транспорту разом із результатами probe/audit, як-от `works`, `probe failed`, `audit ok` або `audit failed`, залежно від підтримки каналу.

Докладніше: [/concepts/oauth](/uk/concepts/oauth)

Приклади:

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

Пошук ідентифікаторів self, peer і group для каналів, які мають surface каталогу. Див. [`openclaw directory`](/uk/cli/directory).

Поширені параметри:

- `--channel <name>`
- `--account <id>`
- `--json`

Підкоманди:

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

Виводить список і дає змогу переглядати доступні Skills разом з інформацією про готовність.

Підкоманди:

- `skills search [query...]`: шукає Skills у ClawHub.
- `skills search --limit <n> --json`: обмежує результати пошуку або виводить машинозчитуваний результат.
- `skills install <slug>`: встановлює Skill із ClawHub в активний робочий простір.
- `skills install <slug> --version <version>`: встановлює конкретну версію ClawHub.
- `skills install <slug> --force`: перезаписує наявну теку Skill у робочому просторі.
- `skills update <slug|--all>`: оновлює відстежувані Skills із ClawHub.
- `skills list`: показує список Skills (типово, якщо підкоманду не вказано).
- `skills list --json`: виводить машинозчитуваний інвентар Skills у stdout.
- `skills list --verbose`: включає в таблицю відсутні вимоги.
- `skills info <name>`: показує подробиці про один Skill.
- `skills info <name> --json`: виводить машинозчитувані подробиці у stdout.
- `skills check`: зведення готових і відсутніх вимог.
- `skills check --json`: виводить машинозчитуваний результат перевірки готовності у stdout.

Параметри:

- `--eligible`: показувати лише готові Skills.
- `--json`: вивід у JSON (без стилізації).
- `-v`, `--verbose`: включати подробиці про відсутні вимоги.

Порада: використовуйте `openclaw skills search`, `openclaw skills install` і `openclaw skills update` для Skills із підтримкою ClawHub.

### `pairing`

Підтвердження запитів на сполучення DM у різних каналах.

Підкоманди:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Примітки:

- Якщо налаштовано рівно один канал із підтримкою pairing, також дозволено `pairing approve <code>`.
- І `list`, і `approve` підтримують `--account <id>` для багатокористувацьких каналів.

### `devices`

Керування записами pairing пристроїв gateway та токенами пристроїв для окремих ролей.

Підкоманди:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Примітки:

- `devices list` і `devices approve` можуть повертатися до локальних файлів pairing на local loopback, коли прямий scope pairing недоступний.
- `devices approve` вимагає явного ID запиту перед випуском токенів; якщо не вказати `requestId` або передати `--latest`, буде лише попередній перегляд найновішого запиту, що очікує.
- Повторні підключення зі збереженими токенами повторно використовують кешований дозволений scope токена; явний
  `devices rotate --scope ...` оновлює цей збережений набір scope для майбутніх
  повторних підключень із кешованим токеном.
- `devices rotate` і `devices revoke` повертають JSON payloads.

### `qr`

Створює QR для pairing мобільного пристрою та код налаштування з поточної config Gateway. Див. [`openclaw qr`](/uk/cli/qr).

Параметри:

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

Примітки:

- `--token` і `--password` взаємовиключні.
- Код налаштування містить короткоживучий bootstrap-токен, а не спільний токен/пароль gateway.
- Вбудований bootstrap-handoff зберігає токен основного Node з `scopes: []`.
- Будь-який переданий токен bootstrap оператора залишається обмеженим `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`.
- Перевірки scope bootstrap мають префікс ролі, тому цей allowlist оператора задовольняє лише запити оператора; ролям, що не є оператором, усе ще потрібні scopes під префіксом власної ролі.
- `--remote` може використовувати `gateway.remote.url` або активний URL Tailscale Serve/Funnel.
- Після сканування підтвердьте запит через `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Простір імен застарілих псевдонімів. Наразі підтримує `openclaw clawbot qr`, що відповідає [`openclaw qr`](/uk/cli/qr).

### `hooks`

Керування внутрішніми hooks агента.

Підкоманди:

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>` (застарілий псевдонім для `openclaw plugins install`)
- `hooks update [id]` (застарілий псевдонім для `openclaw plugins update`)

Поширені параметри:

- `--json`
- `--eligible`
- `-v`, `--verbose`

Примітки:

- Hooks, якими керує plugin, не можна вмикати чи вимикати через `openclaw hooks`; натомість увімкніть або вимкніть plugin-власник.
- `hooks install` і `hooks update` досі працюють як псевдоніми сумісності, але виводять попередження про застарілість і перенаправляють до команд plugin.

### `webhooks`

Допоміжні засоби Webhook. Поточна вбудована surface — це налаштування Gmail Pub/Sub + runner:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Налаштування Gmail Pub/Sub hook + runner. Див. [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration).

Підкоманди:

- `webhooks gmail setup` (вимагає `--account <email>`; підтримує `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (перевизначення runtime для тих самих прапорців)

Примітки:

- `setup` налаштовує Gmail watch і push-шлях до OpenClaw.
- `run` запускає локальний цикл watcher/renew для Gmail з необов’язковими перевизначеннями runtime.

### `dns`

Допоміжні засоби DNS для широкозонного виявлення (CoreDNS + Tailscale). Поточна вбудована surface:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Допоміжний засіб DNS для широкозонного виявлення (CoreDNS + Tailscale). Див. [/gateway/discovery](/uk/gateway/discovery).

Параметри:

- `--domain <domain>`
- `--apply`: встановлює/оновлює config CoreDNS (потребує sudo; лише macOS).

Примітки:

- Без `--apply` це допоміжний засіб планування, який виводить рекомендовану config DNS для OpenClaw + Tailscale.
- `--apply` наразі підтримує лише macOS із Homebrew CoreDNS.

## Повідомлення + агент

### `message`

Уніфіковане вихідне надсилання повідомлень + дії каналів.

Див.: [/cli/message](/uk/cli/message)

Підкоманди:

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

Приклади:

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

Запускає один хід агента через Gateway (або вбудовано з `--local`).

Передайте принаймні один селектор сесії: `--to`, `--session-id` або `--agent`.

Обов’язково:

- `-m, --message <text>`

Параметри:

- `-t, --to <dest>` (для ключа сесії та необов’язкової доставки)
- `--session-id <id>`
- `--agent <id>` (ідентифікатор агента; перевизначає bindings маршрутизації)
- `--thinking <level>` (перевіряється щодо профілю провайдера вибраної моделі)
- `--verbose <on|off>`
- `--channel <channel>` (канал доставки; не вказуйте, щоб використати канал основної сесії)
- `--reply-to <target>` (перевизначення цілі доставки, окремо від маршрутизації сесії)
- `--reply-channel <channel>` (перевизначення каналу доставки)
- `--reply-account <id>` (перевизначення ID облікового запису доставки)
- `--local` (вбудований запуск; реєстр plugin усе одно попередньо завантажується)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Примітки:

- Режим Gateway повертається до вбудованого агента, якщо запит до Gateway не вдається.
- `--local` усе одно попередньо завантажує реєстр plugin, тож провайдери, інструменти та канали, надані plugin, залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію.

### `agents`

Керування ізольованими агентами (робочі простори + auth + маршрутизація).

Виконання `openclaw agents` без підкоманди еквівалентне `openclaw agents list`.

#### `agents list`

Показує налаштованих агентів.

Параметри:

- `--json`
- `--bindings`

#### `agents add [name]`

Додає нового ізольованого агента. Запускає керований майстер, якщо не передано прапорців (або `--non-interactive`); `--workspace` є обов’язковим у неінтерактивному режимі.

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Специфікації binding використовують `channel[:accountId]`. Якщо `accountId` не вказано, OpenClaw може розв’язати область облікового запису через типові значення каналу/hooks plugin; інакше це binding каналу без явної області облікового запису.
Передавання будь-яких явних прапорців add перемикає команду в неінтерактивний режим. `main` зарезервовано й не може використовуватися як ID нового агента.

#### `agents bindings`

Показує bindings маршрутизації.

Параметри:

- `--agent <id>`
- `--json`

#### `agents bind`

Додає bindings маршрутизації для агента.

Параметри:

- `--agent <id>` (типово поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

#### `agents unbind`

Видаляє bindings маршрутизації для агента.

Параметри:

- `--agent <id>` (типово поточний типовий агент)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--all`
- `--json`

Використовуйте або `--all`, або `--bind`, але не обидва.

#### `agents delete <id>`

Видаляє агента й очищає його робочий простір + стан.

Параметри:

- `--force`
- `--json`

Примітки:

- `main` не можна видалити.
- Без `--force` потрібне інтерактивне підтвердження.

#### `agents set-identity`

Оновлює ідентичність агента (ім’я/тема/емодзі/аватар).

Параметри:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Примітки:

- Для вибору цільового агента можна використовувати `--agent` або `--workspace`.
- Якщо явні поля ідентичності не вказано, команда читає `IDENTITY.md`.

### `acp`

Запускає міст ACP, який з’єднує IDE з Gateway.

Кореневі параметри:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--session <key>`
- `--session-label <label>`
- `--require-existing`
- `--reset-session`
- `--no-prefix-cwd`
- `--provenance <off|meta|meta+receipt>`
- `--verbose`

#### `acp client`

Інтерактивний ACP-клієнт для налагодження моста.

Параметри:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Див. [`acp`](/uk/cli/acp) для повної поведінки, приміток щодо безпеки та прикладів.

### `mcp`

Керування збереженими визначеннями MCP-серверів і надання каналів OpenClaw через MCP stdio.

#### `mcp serve`

Надає маршрутизовані розмови каналів OpenClaw через MCP stdio.

Параметри:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Показує список збережених визначень MCP-серверів.

Параметри:

- `--json`

#### `mcp show [name]`

Показує одне збережене визначення MCP-сервера або весь об’єкт збереженого MCP-сервера.

Параметри:

- `--json`

#### `mcp set <name> <value>`

Зберігає одне визначення MCP-сервера з JSON-об’єкта.

#### `mcp unset <name>`

Видаляє одне збережене визначення MCP-сервера.

### `approvals`

Керування approvals для exec. Псевдонім: `exec-approvals`.

#### `approvals get`

Отримує знімок approvals для exec та ефективну політику.

Параметри:

- `--node <node>`
- `--gateway`
- `--json`
- параметри node RPC з `openclaw nodes`

#### `approvals set`

Замінює approvals для exec JSON-даними з файла або stdin.

Параметри:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- параметри node RPC з `openclaw nodes`

#### `approvals allowlist add|remove`

Редагує allowlist exec для окремого агента.

Параметри:

- `--node <node>`
- `--gateway`
- `--agent <id>` (типово `*`)
- `--json`
- параметри node RPC з `openclaw nodes`

### `status`

Показує стан пов’язаних сесій і нещодавніх одержувачів.

Параметри:

- `--json`
- `--all` (повна діагностика; лише читання, придатне для вставки)
- `--deep` (запитує в gateway live-перевірку стану, включно з перевірками каналів, де це підтримується)
- `--usage` (показує usage/квоту провайдера моделей)
- `--timeout <ms>`
- `--verbose`
- `--debug` (псевдонім для `--verbose`)

Примітки:

- Огляд включає статус Gateway + сервісу хоста node, якщо доступний.
- `--usage` виводить нормалізовані вікна використання провайдера як `X% left`.

### Відстеження використання

OpenClaw може показувати usage/квоту провайдера, коли доступні облікові дані OAuth/API.

Поверхні:

- `/status` (додає короткий рядок usage провайдера, якщо доступно)
- `openclaw status --usage` (виводить повний розподіл за провайдерами)
- рядок меню macOS (розділ Usage у Context)

Примітки:

- Дані надходять безпосередньо з endpoint usage провайдера (без оцінок).
- Людинозрозумілий вивід нормалізовано до `X% left` для всіх провайдерів.
- Провайдери з поточними вікнами usage: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: сирі `usage_percent` / `usagePercent` означають залишок квоти, тому OpenClaw інвертує їх перед показом; поля на основі лічильників усе одно мають пріоритет, якщо присутні. Відповіді `model_remains` віддають перевагу запису chat-model, за потреби виводять мітку вікна з часових позначок і включають назву моделі в мітку плану.
- Автентифікація для usage походить із hook провайдера, коли доступна; інакше OpenClaw повертається до відповідних облікових даних OAuth/API-key з auth-профілів, env або config. Якщо нічого не розв’язується, usage приховується.
- Докладніше: див. [Відстеження використання](/uk/concepts/usage-tracking).

### `health`

Отримує стан health від запущеного Gateway.

Параметри:

- `--json`
- `--timeout <ms>`
- `--verbose` (примусово виконує live-probe і виводить подробиці з’єднання gateway)
- `--debug` (псевдонім для `--verbose`)

Примітки:

- Типовий `health` може повертати свіжий кешований знімок gateway.
- `health --verbose` примусово виконує live-probe і розгортає людиночитаний вивід для всіх налаштованих облікових записів і агентів.

### `sessions`

Показує список збережених сесій розмов.

Параметри:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (фільтрує сесії за агентом)
- `--all-agents` (показує сесії всіх агентів)

Підкоманди:

- `sessions cleanup` — видаляє прострочені або осиротілі сесії

Примітки:

- `sessions cleanup` також підтримує `--fix-missing` для очищення записів, у яких відсутні файли транскриптів.

## Скидання / Видалення

### `reset`

Скидає локальну config/стан (CLI залишається встановленим).

Параметри:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Примітки:

- `--non-interactive` вимагає `--scope` і `--yes`.

### `uninstall`

Видаляє сервіс gateway + локальні дані (CLI залишається).

Параметри:

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

Примітки:

- `--non-interactive` вимагає `--yes` і явних scopes (або `--all`).
- `--all` разом видаляє service, state, workspace і app.

### `tasks`

Показує список і дає змогу керувати запусками [фонових завдань](/uk/automation/tasks) між агентами.

- `tasks list` — показує активні та нещодавні запуски завдань
- `tasks show <id>` — показує подробиці для конкретного запуску завдання
- `tasks notify <id>` — змінює політику сповіщень для запуску завдання
- `tasks cancel <id>` — скасовує запущене завдання
- `tasks audit` — показує операційні проблеми (застарілі, втрачені, збої доставки)
- `tasks maintenance [--apply] [--json]` — показує попередній перегляд або застосовує очищення/узгодження tasks і TaskFlow (дочірні сесії ACP/subagent, активні завдання Cron, live-запуски CLI)
- `tasks flow list` — показує активні та нещодавні потоки Task Flow
- `tasks flow show <lookup>` — перевіряє потік за id або ключем lookup
- `tasks flow cancel <lookup>` — скасовує запущений потік і його активні завдання

### `flows`

Застарілий ярлик документації. Команди Flow розташовані в `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Запускає WebSocket Gateway.

Параметри:

- `--port <port>`
- `--bind <loopback|tailnet|lan|auto|custom>`
- `--token <token>`
- `--auth <token|password>`
- `--password <password>`
- `--password-file <path>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--allow-unconfigured`
- `--dev`
- `--reset` (скидає dev config + credentials + sessions + workspace)
- `--force` (завершує наявний listener на порту)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (псевдонім для `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Керує сервісом Gateway (launchd/systemd/schtasks).

Підкоманди:

- `gateway status` (типово виконує probe Gateway RPC)
- `gateway install` (установлення service)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Примітки:

- `gateway status` типово виконує probe Gateway RPC, використовуючи розв’язаний порт/config сервісу (перевизначте через `--url/--token/--password`).
- `gateway status` підтримує `--no-probe`, `--deep`, `--require-rpc` і `--json` для скриптів.
- `gateway status` також показує застарілі або додаткові сервіси gateway, коли може їх виявити (`--deep` додає системне сканування). Іменовані за профілем сервіси OpenClaw вважаються повноцінними й не позначаються як "extra".
- `gateway status` залишається доступним для діагностики, навіть коли локальна config CLI відсутня або недійсна.
- `gateway status` виводить розв’язаний шлях до файлу журналу, знімок шляхів/чинності config CLI проти service і розв’язаний URL цілі probe.
- Якщо auth SecretRefs gateway не розв’язуються в поточному шляху команди, `gateway status --json` повідомляє `rpc.authWarning` лише тоді, коли з’єднання/auth probe не вдається (попередження пригнічуються, якщо probe успішний).
- У встановленнях Linux systemd перевірки розбіжності токенів стану включають обидва джерела unit: `Environment=` і `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` підтримують `--json` для скриптів (типовий вивід лишається дружнім до людини).
- `gateway install` типово використовує runtime Node; bun **не рекомендується** (помилки WhatsApp/Telegram).
- Параметри `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Застарілий псевдонім для команд керування сервісом Gateway. Див. [/cli/daemon](/uk/cli/daemon).

Підкоманди:

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

Поширені параметри:

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`: `--json`

### `logs`

Читає журнали файлів Gateway через RPC.

Параметри:

- `--limit <n>`: максимальна кількість рядків журналу для повернення
- `--max-bytes <n>`: максимальна кількість байтів для читання з файлу журналу
- `--follow`: стежить за файлом журналу (у стилі tail -f)
- `--interval <ms>`: інтервал опитування в мс під час стеження
- `--local-time`: показує часові позначки в локальному часі
- `--json`: виводить JSON із розділенням за рядками
- `--plain`: вимикає структуроване форматування
- `--no-color`: вимикає кольори ANSI
- `--url <url>`: явний URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: тайм-аут Gateway RPC
- `--expect-final`: чекати фінальну відповідь, коли це потрібно

Приклади:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Примітки:

- Якщо ви передаєте `--url`, CLI не застосовує автоматично облікові дані config або середовища.
- Збої pairing на local loopback повертаються до налаштованого локального файлу журналу; явні цілі `--url` — ні.

### `gateway <subcommand>`

Допоміжні засоби CLI Gateway (використовуйте `--url`, `--token`, `--password`, `--timeout`, `--expect-final` для RPC-підкоманд).
Якщо ви передаєте `--url`, CLI не застосовує автоматично облікові дані config або середовища.
Явно передайте `--token` або `--password`. Відсутність явно заданих облікових даних є помилкою.

Підкоманди:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Примітки:

- `gateway status --deep` додає системне сканування service. Використовуйте `gateway probe`,
  `health --verbose` або `status --deep` верхнього рівня для глибших подробиць runtime-probe.

Поширені RPC:

- `config.schema.lookup` (перевіряє одне піддерево config з неглибоким вузлом schema, узгодженими метаданими підказок і зведеннями безпосередніх дочірніх елементів)
- `config.get` (читає поточний знімок config + hash)
- `config.set` (перевіряє + записує повну config; використовуйте `baseHash` для оптимістичної конкуренції)
- `config.apply` (перевіряє + записує config + restart + wake)
- `config.patch` (об’єднує часткове оновлення + restart + wake)
- `update.run` (запускає update + restart + wake)

Порада: під час прямого виклику `config.set`/`config.apply`/`config.patch` передавайте `baseHash` з
`config.get`, якщо config уже існує.
Порада: для часткових змін спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`.
Порада: ці RPC запису config виконують попередню перевірку активного розв’язання SecretRef для refs у переданому payload config і відхиляють запис, якщо ефективно активний переданий ref не розв’язується.
Порада: runtime-інструмент `gateway`, доступний лише власнику, як і раніше відмовляється переписувати `tools.exec.ask` або `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec.

## Моделі

Див. [/concepts/models](/uk/concepts/models) щодо поведінки резервних варіантів і стратегії сканування.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw вважає повторне використання Claude CLI і використання `claude -p`
дозволеними для цієї інтеграції, якщо Anthropic не опублікує нову політику. Для
робочого середовища надавайте перевагу API-ключу Anthropic або іншому підтримуваному
провайдеру стилю підписки, такому як OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan або Z.AI / GLM Coding Plan.

Anthropic setup-token і далі доступний як підтримуваний шлях автентифікації токеном, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

### `models` (корінь)

`openclaw models` — це псевдонім для `models status`.

Кореневі параметри:

- `--status-json` (псевдонім для `models status --json`)
- `--status-plain` (псевдонім для `models status --plain`)

### `models list`

Параметри:

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

`--all` включає статичні рядки каталогу вбудованих провайдерів ще до
налаштування auth. Рядки залишаються недоступними, доки не з’являться відповідні облікові дані провайдера.

### `models status`

Параметри:

- `--json`
- `--plain`
- `--check` (exit 1=прострочено/відсутнє, 2=скоро сплине)
- `--probe` (live-probe налаштованих auth-профілів)
- `--probe-provider <name>`
- `--probe-profile <id>` (можна повторювати або перелічувати через кому)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Завжди включає огляд auth і статус завершення OAuth для профілів у сховищі auth.
`--probe` виконує live-запити (може витрачати токени й спричиняти rate limits).
Рядки probe можуть надходити з auth-профілів, облікових даних env або `models.json`.
Очікуйте статуси probe на кшталт `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` і `no_model`.
Коли явний `auth.order.<provider>` пропускає збережений профіль, probe повідомляє
`excluded_by_auth_order` замість того, щоб мовчки пробувати цей профіль.

### `models set <model>`

Установлює `agents.defaults.model.primary`.

### `models set-image <model>`

Установлює `agents.defaults.imageModel.primary`.

### `models aliases list|add|remove`

Параметри:

- `list`: `--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

Параметри:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

Параметри:

- `list`: `--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

Параметри:

- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>`
- `--concurrency <n>`
- `--no-probe`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

### `models auth add|login|login-github-copilot|setup-token|paste-token`

Параметри:

- `add`: інтерактивний допоміжний засіб auth (потік auth провайдера або вставлення токена)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: потік входу GitHub Copilot OAuth (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Примітки:

- `setup-token` і `paste-token` — це універсальні команди токенів для провайдерів, які надають методи auth на основі токена.
- `setup-token` вимагає інтерактивного TTY і запускає метод auth токена провайдера.
- `paste-token` запитує значення токена й типово використовує ID auth-профілю `<provider>:manual`, якщо `--profile-id` не вказано.
- `setup-token` / `paste-token` Anthropic і далі доступні як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

### `models auth order get|set|clear`

Параметри:

- `get`: `--provider <name>`, `--agent <id>`, `--json`
- `set`: `--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`: `--provider <name>`, `--agent <id>`

## System

### `system event`

Ставить системну подію в чергу й, за потреби, запускає Heartbeat (Gateway RPC).

Обов’язково:

- `--text <text>`

Параметри:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Heartbeat controls (Gateway RPC).

Параметри:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Показує записи присутності системи (Gateway RPC).

Параметри:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Керування запланованими завданнями (Gateway RPC). Див. [/automation/cron-jobs](/uk/automation/cron-jobs).

Підкоманди:

- `cron status [--json]`
- `cron list [--all] [--json]` (типово вивід таблицею; використовуйте `--json` для сирого виводу)
- `cron add` (псевдонім: `create`; вимагає `--name` і рівно один із `--at` | `--every` | `--cron`, а також рівно один payload із `--system-event` | `--message`)
- `cron edit <id>` (оновлює поля частково)
- `cron rm <id>` (псевдоніми: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Усі команди `cron` приймають `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` використовує цю вибрану дозволену модель для завдання. Якщо
модель не дозволена, Cron попереджає та повертається до вибору моделі
агента/типової моделі для завдання. Налаштовані ланцюжки резервних варіантів і далі застосовуються, але звичайне
перевизначення моделі без явного списку резервних варіантів для завдання більше не додає
основну модель агента як приховану додаткову ціль для повторної спроби.

## Хост Node

### `node`

`node` запускає **безголовий хост Node** або керує ним як фоновим service. Див.
[`openclaw node`](/uk/cli/node).

Підкоманди:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Примітки щодо auth:

- `node` розв’язує auth gateway з env/config (без прапорців `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`. У локальному режимі хост node навмисно ігнорує `gateway.remote.*`; у `gateway.mode=remote` `gateway.remote.*` бере участь відповідно до правил пріоритету remote.
- Розв’язання auth хоста node враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` взаємодіє з Gateway і націлюється на сполучені nodes. Див. [/nodes](/uk/nodes).

Поширені параметри:

- `--url`, `--token`, `--timeout`, `--json`

Підкоманди:

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]` (лише mac)

Камера:

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + screen:

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

Розташування:

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## Browser

CLI керування браузером (виділений Chrome/Brave/Edge/Chromium). Див. [`openclaw browser`](/uk/cli/browser) і [інструмент Browser](/uk/tools/browser).

Поширені параметри:

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

Керування:

- `browser status`
- `browser start`
- `browser stop`
- `browser reset-profile`
- `browser tabs`
- `browser open <url>`
- `browser focus <targetId>`
- `browser close [targetId]`
- `browser profiles`
- `browser create-profile --name <name> [--color <hex>] [--cdp-url <url>] [--driver existing-session] [--user-data-dir <path>]`
- `browser delete-profile --name <name>`

Перевірка:

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

Дії:

- `browser navigate <url> [--target-id <id>]`
- `browser resize <width> <height> [--target-id <id>]`
- `browser click <ref> [--double] [--button <left|right|middle>] [--modifiers <csv>] [--target-id <id>]`
- `browser type <ref> <text> [--submit] [--slowly] [--target-id <id>]`
- `browser press <key> [--target-id <id>]`
- `browser hover <ref> [--target-id <id>]`
- `browser drag <startRef> <endRef> [--target-id <id>]`
- `browser select <ref> <values...> [--target-id <id>]`
- `browser upload <paths...> [--ref <ref>] [--input-ref <ref>] [--element <selector>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser fill [--fields <json>] [--fields-file <path>] [--target-id <id>]`
- `browser dialog --accept|--dismiss [--prompt <text>] [--target-id <id>] [--timeout-ms <ms>]`
- `browser wait [--time <ms>] [--text <value>] [--text-gone <value>] [--target-id <id>]`
- `browser evaluate --fn <code> [--ref <ref>] [--target-id <id>]`
- `browser console [--level <error|warn|info>] [--target-id <id>]`
- `browser pdf [--target-id <id>]`

## Voice call

### `voicecall`

Утиліти voice-call, надані plugin. З’являється лише тоді, коли plugin voice-call встановлено та ввімкнено. Див. [`openclaw voicecall`](/uk/cli/voicecall).

Поширені команди:

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## Пошук у документації

### `docs`

Шукає в live-індексі документації OpenClaw.

### `docs [query...]`

Шукає в live-індексі документації.

## TUI

### `tui`

Відкриває термінальний UI, підключений до Gateway.

Параметри:

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>` (типово `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`

---
read_when:
    - Додавання або змінення команд CLI чи параметрів
    - Документування нових поверхонь команд
summary: Довідник CLI OpenClaw для команд, підкоманд і параметрів `openclaw`
title: Довідник CLI
x-i18n:
    generated_at: "2026-04-23T06:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e5d3de831331307203ac6f67a3f4b4c969c4ccc10e813ebab1e052b87f0426b
    source_path: cli/index.md
    workflow: 15
---

# Довідник CLI

Ця сторінка описує поточну поведінку CLI. Якщо команди змінюються, оновіть цей документ.

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
- [`plugins`](/uk/cli/plugins) (команди Plugin)
- [`channels`](/uk/cli/channels)
- [`security`](/uk/cli/security)
- [`secrets`](/uk/cli/secrets)
- [`skills`](/uk/cli/skills)
- [`daemon`](/uk/cli/daemon) (застарілий псевдонім для команд служби Gateway)
- [`clawbot`](/uk/cli/clawbot) (простір імен застарілого псевдоніма)
- [`voicecall`](/uk/cli/voicecall) (Plugin; якщо встановлено)

## Глобальні прапорці

- `--dev`: ізолювати стан у `~/.openclaw-dev` і змістити типові порти.
- `--profile <name>`: ізолювати стан у `~/.openclaw-<name>`.
- `--container <name>`: націлити виконання на іменований контейнер.
- `--no-color`: вимкнути кольори ANSI.
- `--update`: скорочення для `openclaw update` (лише для встановлень із джерела).
- `-V`, `--version`, `-v`: вивести версію й завершити роботу.

## Оформлення виводу

- Кольори ANSI та індикатори поступу відображаються лише в сеансах TTY.
- Гіперпосилання OSC-8 відображаються як клікабельні посилання в терміналах із підтримкою; інакше використовується звичайний URL.
- `--json` (і `--plain`, де підтримується) вимикає оформлення для чистого виводу.
- `--no-color` вимикає оформлення ANSI; також враховується `NO_COLOR=1`.
- Довготривалі команди показують індикатор поступу (OSC 9;4, якщо підтримується).

## Колірна палітра

OpenClaw використовує палітру lobster для виводу CLI.

- `accent` (#FF5A2D): заголовки, мітки, основні акценти.
- `accentBright` (#FF7A3D): назви команд, виділення.
- `accentDim` (#D14A22): вторинний акцентний текст.
- `info` (#FF8A5B): інформаційні значення.
- `success` (#2FBF71): стани успіху.
- `warn` (#FFB020): попередження, резервні варіанти, привернення уваги.
- `error` (#E23D2D): помилки, збої.
- `muted` (#8B7F77): приглушення, метадані.

Джерело істини для палітри: `src/terminal/palette.ts` (“палітра lobster”).

## Дерево команд

```text
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

- `openclaw security audit` — перевірити конфігурацію та локальний стан на поширені небезпечні помилки.
- `openclaw security audit --deep` — найкраща можлива жива перевірка Gateway.
- `openclaw security audit --fix` — посилити безпечні типові налаштування та права доступу до стану/конфігурації.

## Secrets

### `secrets`

Керуйте SecretRefs і пов’язаною гігієною runtime/конфігурації.

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

- `reload` — це RPC Gateway і він зберігає останній відомий коректний знімок runtime, якщо розв’язання не вдається.
- `audit --check` повертає ненульовий код за наявності знахідок; нерозв’язані посилання використовують ненульовий код вищого пріоритету.
- Перевірки виконання в dry-run типово пропускаються; використайте `--allow-exec`, щоб явно їх увімкнути.

## Plugins

Керуйте plugins та їхньою конфігурацією:

- `openclaw plugins list` — виявити plugins (використайте `--json` для машинного виводу).
- `openclaw plugins inspect <id>` — показати деталі Plugin (`info` — псевдонім).
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — встановити Plugin (або додати шлях до Plugin у `plugins.load.paths`; використайте `--force`, щоб перезаписати наявну ціль встановлення).
- `openclaw plugins marketplace list <marketplace>` — вивести записи marketplace перед встановленням.
- `openclaw plugins enable <id>` / `disable <id>` — перемкнути `plugins.entries.<id>.enabled`.
- `openclaw plugins doctor` — повідомити про помилки завантаження Plugin.

Більшість змін Plugin потребують перезапуску gateway. Див. [/plugin](/uk/tools/plugin).

## Memory

Векторний пошук у `MEMORY.md` + `memory/*.md`:

- `openclaw memory status` — показати статистику індексу; використайте `--deep` для перевірок готовності векторів і embedding або `--fix` для відновлення застарілих артефактів recall/promotion.
- `openclaw memory index` — переіндексувати файли memory.
- `openclaw memory search "<query>"` (або `--query "<query>"`) — семантичний пошук у memory.
- `openclaw memory promote` — ранжувати короткострокові recall-записи та, за потреби, додавати найкращі записи до `MEMORY.md`.

## Sandbox

Керуйте sandbox runtime для ізольованого виконання agent. Див. [/cli/sandbox](/uk/cli/sandbox).

Підкоманди:

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

Примітки:

- `sandbox recreate` видаляє наявні runtime, щоб під час наступного використання вони знову ініціалізувалися з поточною конфігурацією.
- Для бекендів `ssh` і OpenShell `remote`, recreate видаляє канонічний віддалений робочий простір для вибраної області.

## Команди зі слешем у чаті

Повідомлення чату підтримують команди `/...` (текстові й нативні). Див. [/tools/slash-commands](/uk/tools/slash-commands).

Основне:

- `/status` для швидкої діагностики.
- `/trace` для налагоджувальних/трасувальних рядків Plugin в межах сеансу.
- `/config` для збережених змін конфігурації.
- `/debug` для перевизначень конфігурації лише для runtime (пам’ять, не диск; потребує `commands.debug: true`).

## Налаштування + онбординг

### `completion`

Згенеруйте скрипти автодоповнення оболонки та, за потреби, встановіть їх у профіль вашої оболонки.

Параметри:

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

Примітки:

- Без `--install` або `--write-state` команда `completion` виводить скрипт у stdout.
- `--install` записує блок `OpenClaw Completion` у профіль вашої оболонки та спрямовує його на кешований скрипт у каталозі стану OpenClaw.

### `setup`

Ініціалізуйте конфігурацію й робочий простір.

Параметри:

- `--workspace <dir>`: шлях до робочого простору agent (типово `~/.openclaw/workspace`).
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
- `--reset` (скинути конфігурацію + облікові дані + сеанси перед онбордингом)
- `--reset-scope <config|config+creds+sessions|full>` (типово `config+creds+sessions`; використайте `full`, щоб також видалити робочий простір)
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>` (`manual` — псевдонім для `advanced`)
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
- Примітка щодо Qwen: `qwen-*` — канонічне сімейство `auth-choice`. Ідентифікатори `modelstudio-*`
  і далі приймаються лише як застарілі псевдоніми для зворотної сумісності.
- `--secret-input-mode <plaintext|ref>` (типово `plaintext`; використайте `ref`, щоб зберігати стандартні env-посилання провайдера замість відкритих ключів)
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
- `--custom-provider-id <id>` (неінтерактивно; необов’язковий ідентифікатор користувацького провайдера)
- `--custom-compatibility <openai|anthropic>` (неінтерактивно; необов’язково; типово `openai`)
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>` (неінтерактивно; зберегти `gateway.auth.token` як env SecretRef; вимагає, щоб цю змінну середовища було встановлено; не можна поєднувати з `--gateway-token`)
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
- `--node-manager <npm|pnpm|bun>` (менеджер Node для setup/онбордингу Skills; рекомендовано pnpm, bun також підтримується)
- `--json`

### `configure`

Інтерактивний майстер конфігурації (моделі, канали, Skills, gateway).

Параметри:

- `--section <section>` (можна повторювати; обмежує майстер конкретними розділами)

### `config`

Неінтерактивні допоміжні команди конфігурації (`get`/`set`/`unset`/`file`/`schema`/`validate`). Виконання `openclaw config` без
підкоманди запускає майстер.

Підкоманди:

- `config get <path>`: вивести значення конфігурації (шлях через крапку/дужки).
- `config set`: підтримує чотири режими призначення:
  - режим значення: `config set <path> <value>` (розбір як JSON5 або рядок)
  - режим побудови SecretRef: `config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - режим побудови провайдера: `config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - пакетний режим: `config set --batch-json '<json>'` або `config set --batch-file <path>`
- `config set --dry-run`: перевірити призначення без запису в `openclaw.json` (перевірки exec SecretRef типово пропускаються).
- `config set --allow-exec --dry-run`: явно дозволити dry-run перевірки exec SecretRef (може виконувати команди провайдера).
- `config set --dry-run --json`: вивести машиночитний dry-run результат (перевірки + сигнал повноти, операції, перевірені/пропущені посилання, помилки).
- `config set --strict-json`: вимагати розбору JSON5 для введення path/value. `--json` залишається застарілим псевдонімом для суворого розбору поза режимом dry-run виводу.
- `config unset <path>`: видалити значення.
- `config file`: вивести шлях до активного файла конфігурації.
- `config schema`: вивести згенеровану JSON schema для `openclaw.json`, включно з поширеними метаданими документації полів `title` / `description` через вкладені об’єкти, wildcard, елементи масиву та гілки композиції, а також метаданими schema plugin/channel із найкращою можливою живою вибіркою.
- `config validate`: перевірити поточну конфігурацію за schema без запуску gateway.
- `config validate --json`: вивести машиночитний JSON.

### `doctor`

Перевірки працездатності + швидкі виправлення (конфігурація + gateway + застарілі служби).

Параметри:

- `--no-workspace-suggestions`: вимкнути підказки щодо memory робочого простору.
- `--yes`: приймати типові значення без запитів (headless).
- `--non-interactive`: пропустити запити; застосовувати лише безпечні міграції.
- `--deep`: сканувати системні служби на наявність додаткових встановлень gateway.
- `--repair` (псевдонім: `--fix`): спробувати автоматично виправити виявлені проблеми.
- `--force`: примусово виконати виправлення, навіть якщо вони не є строго необхідними.
- `--generate-gateway-token`: згенерувати новий токен автентифікації gateway.

### `dashboard`

Відкрити Control UI з вашим поточним токеном.

Параметри:

- `--no-open`: вивести URL, але не запускати браузер

Примітки:

- Для токенів gateway, якими керує SecretRef, `dashboard` виводить або відкриває URL без токена замість розкриття секрету у виводі термінала або в аргументах запуску браузера.

### `update`

Оновити встановлений CLI.

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

Створити й перевірити локальні резервні архіви стану OpenClaw.

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

## Допоміжні команди каналів

### `channels`

Керуйте обліковими записами чат-каналів (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Microsoft Teams).

Підкоманди:

- `channels list`: показати налаштовані канали й профілі автентифікації.
- `channels status`: перевірити доступність gateway і стан каналів (`--probe` запускає живі перевірки probe/audit для кожного облікового запису, коли gateway доступний; якщо ні, команда повертається до зведень каналів лише за конфігурацією. Використовуйте `openclaw health` або `openclaw status --deep` для ширших перевірок стану gateway).
- Порада: `channels status` виводить попередження з рекомендованими виправленнями, коли може виявити типові неправильні конфігурації (а потім спрямовує вас до `openclaw doctor`).
- `channels logs`: показати нещодавні журнали каналів із файла журналу gateway.
- `channels add`: налаштування у стилі майстра, якщо прапорці не передано; прапорці перемикають у неінтерактивний режим.
  - Під час додавання нетипового облікового запису до каналу, який іще використовує однорівневу конфігурацію одного облікового запису, OpenClaw переносить значення з області каналу до мапи облікових записів каналу перед записом нового облікового запису. Більшість каналів використовують `accounts.default`; Matrix натомість може зберегти наявну відповідну іменовану/типову ціль.
  - Неінтерактивний `channels add` не створює й не оновлює bindings автоматично; bindings лише каналу й надалі відповідатимуть типовому обліковому запису.
- `channels remove`: типово вимикає; передайте `--delete`, щоб видалити записи конфігурації без запитів.
- `channels login`: інтерактивний вхід у канал (лише WhatsApp Web).
- `channels logout`: вийти із сеансу каналу (якщо підтримується).

Поширені параметри:

- `--channel <name>`: `whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`: ідентифікатор облікового запису каналу (типово `default`)
- `--name <label>`: відображуване ім’я облікового запису

Параметри `channels login`:

- `--channel <channel>` (типово `whatsapp`; підтримує `whatsapp`/`web`)
- `--account <id>`
- `--verbose`

Параметри `channels logout`:

- `--channel <channel>` (типово `whatsapp`)
- `--account <id>`

Параметри `channels list`:

- `--no-usage`: пропустити знімки використання/квот провайдера моделей (лише для OAuth/API).
- `--json`: вивести JSON (включає використання, якщо не задано `--no-usage`).

Параметри `channels status`:

- `--probe`
- `--timeout <ms>`
- `--json`

Параметри `channels capabilities`:

- `--channel <name>`
- `--account <id>` (лише разом із `--channel`)
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
- `channels capabilities --account` застосовується лише тоді, коли задано `--channel`.
- `channels status --probe` може показувати стан транспорту, а також результати probe/audit, як-от `works`, `probe failed`, `audit ok` або `audit failed`, залежно від підтримки каналу.

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

Шукайте власні, peer- і group-ідентифікатори для каналів, які надають surface каталогу. Див. [`openclaw directory`](/uk/cli/directory).

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

Перелічіть і перегляньте доступні Skills, а також інформацію про готовність.

Підкоманди:

- `skills search [query...]`: шукати Skills у ClawHub.
- `skills search --limit <n> --json`: обмежити результати пошуку або вивести машиночитний результат.
- `skills install <slug>`: установити Skill із ClawHub до активного робочого простору.
- `skills install <slug> --version <version>`: установити конкретну версію з ClawHub.
- `skills install <slug> --force`: перезаписати наявну теку Skill у робочому просторі.
- `skills update <slug|--all>`: оновити відстежувані Skills із ClawHub.
- `skills list`: перелічити Skills (типова дія, якщо підкоманду не вказано).
- `skills list --json`: вивести машиночитний інвентар Skills у stdout.
- `skills list --verbose`: включити до таблиці відсутні вимоги.
- `skills info <name>`: показати відомості про один Skill.
- `skills info <name> --json`: вивести машиночитні відомості у stdout.
- `skills check`: зведення готових і відсутніх вимог.
- `skills check --json`: вивести машиночитний результат готовності у stdout.

Параметри:

- `--eligible`: показувати лише готові Skills.
- `--json`: вивести JSON (без оформлення).
- `-v`, `--verbose`: включити подробиці про відсутні вимоги.

Порада: використовуйте `openclaw skills search`, `openclaw skills install` і `openclaw skills update` для Skills на основі ClawHub.

### `pairing`

Схвалюйте запити на pairинг у DM між каналами.

Підкоманди:

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

Примітки:

- Якщо налаштовано рівно один канал із підтримкою pairинг, також дозволено `pairing approve <code>`.
- І `list`, і `approve` підтримують `--account <id>` для каналів із кількома обліковими записами.

### `devices`

Керуйте записами pairинг пристроїв gateway і токенами пристроїв для окремих ролей.

Підкоманди:

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

Примітки:

- `devices list` і `devices approve` можуть повертатися до локальних файлів pairинг у local loopback, коли прямий pairинг scope недоступний.
- `devices approve` вимагає явного ідентифікатора запиту перед випуском токенів; якщо не вказати `requestId` або передати `--latest`, буде лише попередньо показано найновіший запит, що очікує.
- Повторні підключення зі збереженим токеном повторно використовують кешовані схвалені scope цього токена; явний
  `devices rotate --scope ...` оновлює цей збережений набір scope для майбутніх
  повторних підключень із кешованим токеном.
- `devices rotate` і `devices revoke` повертають JSON payload.

### `qr`

Згенеруйте QR-код для mobile pairинг і код налаштування з поточної конфігурації Gateway. Див. [`openclaw qr`](/uk/cli/qr).

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
- Вбудована передача bootstrap зберігає токен primary node на `scopes: []`.
- Будь-який переданий operator bootstrap-токен залишається обмеженим до `operator.approvals`, `operator.read`, `operator.talk.secrets` і `operator.write`.
- Перевірки bootstrap scope мають префікс ролі, тому цей allowlist для operator задовольняє лише запити operator; ролям, відмінним від operator, усе одно потрібні scope під префіксом їхньої власної ролі.
- `--remote` може використовувати `gateway.remote.url` або активний URL Tailscale Serve/Funnel.
- Після сканування схваліть запит за допомогою `openclaw devices list` / `openclaw devices approve <requestId>`.

### `clawbot`

Простір імен застарілого псевдоніма. Наразі підтримує `openclaw clawbot qr`, що відповідає [`openclaw qr`](/uk/cli/qr).

### `hooks`

Керуйте внутрішніми hooks agent.

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

- Hooks, якими керує Plugin, не можна вмикати чи вимикати через `openclaw hooks`; натомість увімкніть або вимкніть Plugin-власник.
- `hooks install` і `hooks update` все ще працюють як псевдоніми сумісності, але виводять попередження про застарілість і перенаправляють на команди plugin.

### `webhooks`

Допоміжні команди Webhook. Поточна вбудована surface — налаштування й запуск Gmail Pub/Sub:

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Налаштування й запуск hooks Gmail Pub/Sub. Див. [Gmail Pub/Sub](/uk/automation/cron-jobs#gmail-pubsub-integration).

Підкоманди:

- `webhooks gmail setup` (вимагає `--account <email>`; підтримує `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`)
- `webhooks gmail run` (перевизначення runtime для тих самих прапорців)

Примітки:

- `setup` налаштовує Gmail watch, а також шлях push до OpenClaw.
- `run` запускає локальний watcher/цикл renew для Gmail з необов’язковими перевизначеннями runtime.

### `dns`

Допоміжні команди DNS для wide-area discovery (CoreDNS + Tailscale). Поточна вбудована surface:

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

Допоміжна команда DNS для wide-area discovery (CoreDNS + Tailscale). Див. [/gateway/discovery](/uk/gateway/discovery).

Параметри:

- `--domain <domain>`
- `--apply`: установити/оновити конфігурацію CoreDNS (потребує sudo; лише macOS).

Примітки:

- Без `--apply` це допоміжна команда планування, яка виводить рекомендовану конфігурацію DNS для OpenClaw + Tailscale.
- `--apply` наразі підтримується лише на macOS із CoreDNS через Homebrew.

## Повідомлення + agent

### `message`

Уніфіковані вихідні повідомлення + дії з каналами.

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

Запустити один хід agent через Gateway (або вбудовано через `--local`).

Передайте принаймні один селектор сеансу: `--to`, `--session-id` або `--agent`.

Обов’язково:

- `-m, --message <text>`

Параметри:

- `-t, --to <dest>` (для ключа сеансу й необов’язкової доставки)
- `--session-id <id>`
- `--agent <id>` (ідентифікатор agent; перевизначає bindings маршрутизації)
- `--thinking <level>` (перевіряється щодо профілю провайдера вибраної моделі)
- `--verbose <on|off>`
- `--channel <channel>` (канал доставки; не вказуйте, щоб використати основний канал сеансу)
- `--reply-to <target>` (перевизначення цілі доставки відповіді, окремо від маршрутизації сеансу)
- `--reply-channel <channel>` (перевизначення каналу доставки)
- `--reply-account <id>` (перевизначення ідентифікатора облікового запису доставки)
- `--local` (вбудований запуск; реєстр plugins однаково попередньо завантажується)
- `--deliver`
- `--json`
- `--timeout <seconds>`

Примітки:

- У режимі Gateway виконується повернення до вбудованого agent, якщо запит до Gateway завершується невдачею.
- `--local` однаково попередньо завантажує реєстр plugins, тому providers, tools і channels, надані plugin, залишаються доступними під час вбудованих запусків.
- `--channel`, `--reply-channel` і `--reply-account` впливають на доставку відповіді, а не на маршрутизацію.

### `agents`

Керуйте ізольованими agents (робочі простори + auth + маршрутизація).

Виконання `openclaw agents` без підкоманди еквівалентне `openclaw agents list`.

#### `agents list`

Перелічити налаштовані agents.

Параметри:

- `--json`
- `--bindings`

#### `agents add [name]`

Додати нового ізольованого agent. Запускає майстер із підказками, якщо не передано прапорці (або `--non-interactive`); у неінтерактивному режимі обов’язковий `--workspace`.

Параметри:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (можна повторювати)
- `--non-interactive`
- `--json`

Специфікації binding використовують `channel[:accountId]`. Якщо `accountId` не вказано, OpenClaw може визначити область облікового запису через типові значення каналу/hooks plugin; інакше це binding каналу без явної області облікового запису.
Передавання будь-яких явних прапорців add перемикає команду в неінтерактивний режим. `main` зарезервовано й не може використовуватися як новий ідентифікатор agent.

#### `agents bindings`

Перелічити bindings маршрутизації.

Параметри:

- `--agent <id>`
- `--json`

#### `agents bind`

Додати bindings маршрутизації для agent.

Параметри:

- `--agent <id>` (типово використовується поточний agent за замовчуванням)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--json`

#### `agents unbind`

Видалити bindings маршрутизації для agent.

Параметри:

- `--agent <id>` (типово використовується поточний agent за замовчуванням)
- `--bind <channel[:accountId]>` (можна повторювати)
- `--all`
- `--json`

Використовуйте або `--all`, або `--bind`, але не обидва одночасно.

#### `agents delete <id>`

Видалити agent і очистити його робочий простір та стан.

Параметри:

- `--force`
- `--json`

Примітки:

- `main` не можна видалити.
- Без `--force` потрібне інтерактивне підтвердження.

#### `agents set-identity`

Оновити identity agent (`name`/`theme`/`emoji`/`avatar`).

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

- Для вибору цільового agent можна використовувати `--agent` або `--workspace`.
- Якщо явні поля identity не задано, команда читає `IDENTITY.md`.

### `acp`

Запустити міст ACP, що з’єднує IDE із Gateway.

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

Інтерактивний клієнт ACP для налагодження моста.

Параметри:

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

Див. [`acp`](/uk/cli/acp), щоб ознайомитися з повною поведінкою, примітками щодо безпеки та прикладами.

### `mcp`

Керуйте збереженими визначеннями серверів MCP і надавайте канали OpenClaw через MCP stdio.

#### `mcp serve`

Надавати маршрутизовані розмови каналів OpenClaw через MCP stdio.

Параметри:

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

Перелічити збережені визначення серверів MCP.

Параметри:

- `--json`

#### `mcp show [name]`

Показати одне збережене визначення сервера MCP або весь збережений об’єкт сервера MCP.

Параметри:

- `--json`

#### `mcp set <name> <value>`

Зберегти одне визначення сервера MCP із JSON-об’єкта.

#### `mcp unset <name>`

Видалити одне збережене визначення сервера MCP.

### `approvals`

Керуйте approvals для exec. Псевдонім: `exec-approvals`.

#### `approvals get`

Отримати знімок approvals для exec і ефективну політику.

Параметри:

- `--node <node>`
- `--gateway`
- `--json`
- параметри node RPC з `openclaw nodes`

#### `approvals set`

Замінити approvals для exec на JSON із файла або stdin.

Параметри:

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- параметри node RPC з `openclaw nodes`

#### `approvals allowlist add|remove`

Редагувати allowlist exec для кожного agent окремо.

Параметри:

- `--node <node>`
- `--gateway`
- `--agent <id>` (типово `*`)
- `--json`
- параметри node RPC з `openclaw nodes`

### `status`

Показати стан пов’язаних сеансів і нещодавніх отримувачів.

Параметри:

- `--json`
- `--all` (повна діагностика; лише читання, придатне для вставлення)
- `--deep` (запитати у gateway живу перевірку стану, включно з probe каналів, де це підтримується)
- `--usage` (показати використання/квоту провайдера моделей)
- `--timeout <ms>`
- `--verbose`
- `--debug` (псевдонім для `--verbose`)

Примітки:

- Огляд включає стан Gateway і служби хоста node, коли вони доступні.
- `--usage` виводить нормалізовані вікна використання провайдера як `X% left`.

### Відстеження використання

OpenClaw може показувати використання/квоту провайдера, коли доступні облікові дані OAuth/API.

Поверхні:

- `/status` (додає короткий рядок використання провайдера, коли він доступний)
- `openclaw status --usage` (виводить повний розподіл за провайдерами)
- рядок меню macOS (розділ Usage у Context)

Примітки:

- Дані надходять безпосередньо з ендпойнтів використання провайдерів (без оцінок).
- Людинозрозумілий вивід нормалізується до `X% left` для всіх провайдерів.
- Провайдери з поточними вікнами використання: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi і z.ai.
- Примітка щодо MiniMax: сирі `usage_percent` / `usagePercent` означають залишок квоти, тому OpenClaw інвертує їх перед показом; поля на основі лічильників усе одно мають пріоритет, якщо вони наявні. Відповіді `model_remains` віддають перевагу запису chat-model, за потреби виводять мітку вікна з часових позначок і включають назву моделі до мітки плану.
- Автентифікація для використання береться зі специфічних hooks провайдера, коли вони доступні; інакше OpenClaw повертається до відповідних облікових даних OAuth/API-key із профілів автентифікації, env або конфігурації. Якщо не вдається нічого знайти, використання приховується.
- Докладніше: див. [Відстеження використання](/uk/concepts/usage-tracking).

### `health`

Отримати стан здоров’я від запущеного Gateway.

Параметри:

- `--json`
- `--timeout <ms>`
- `--verbose` (примусово виконати живу probe-перевірку й вивести подробиці підключення до gateway)
- `--debug` (псевдонім для `--verbose`)

Примітки:

- Типовий `health` може повертати свіжий кешований знімок gateway.
- `health --verbose` примусово виконує живу probe-перевірку та розгортає людиночитний вивід для всіх налаштованих облікових записів і agents.

### `sessions`

Перелічити збережені сеанси розмов.

Параметри:

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>` (фільтрувати сеанси за agent)
- `--all-agents` (показувати сеанси для всіх agents)

Підкоманди:

- `sessions cleanup` — видалити прострочені або осиротілі сеанси

Примітки:

- `sessions cleanup` також підтримує `--fix-missing` для очищення записів, чиї файли transcript відсутні.

## Скидання / Видалення

### `reset`

Скинути локальну конфігурацію/стан (CLI залишається встановленим).

Параметри:

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

Примітки:

- `--non-interactive` вимагає `--scope` і `--yes`.

### `uninstall`

Видалити службу gateway і локальні дані (CLI залишається).

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

- `--non-interactive` вимагає `--yes` і явних scope (або `--all`).
- `--all` разом видаляє службу, стан, робочий простір і застосунок.

### `tasks`

Перелічити й керувати запусками [фонових завдань](/uk/automation/tasks) для різних agents.

- `tasks list` — показати активні й нещодавні запуски завдань
- `tasks show <id>` — показати подробиці конкретного запуску завдання
- `tasks notify <id>` — змінити політику сповіщень для запуску завдання
- `tasks cancel <id>` — скасувати запущене завдання
- `tasks audit` — виявити операційні проблеми (застарілі, втрачені, збої доставки)
- `tasks maintenance [--apply] [--json]` — попередньо переглянути або застосувати очищення/узгодження завдань і TaskFlow (дочірні сеанси ACP/subagent, активні Cron-завдання, живі запуски CLI)
- `tasks flow list` — перелічити активні й нещодавні потоки Task Flow
- `tasks flow show <lookup>` — перевірити потік за id або lookup key
- `tasks flow cancel <lookup>` — скасувати запущений потік і його активні завдання

### `flows`

Застарілий скорочений запис у документації. Команди Flow розміщені під `openclaw tasks flow`:

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway

### `gateway`

Запустити WebSocket Gateway.

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
- `--reset` (скинути dev-конфігурацію + облікові дані + сеанси + робочий простір)
- `--force` (завершити наявний listener на порту)
- `--verbose`
- `--cli-backend-logs`
- `--ws-log <auto|full|compact>`
- `--compact` (псевдонім для `--ws-log compact`)
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

Керуйте службою Gateway (`launchd`/`systemd`/`schtasks`).

Підкоманди:

- `gateway status` (типово виконує probe Gateway RPC)
- `gateway install` (установлення служби)
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

Примітки:

- `gateway status` типово виконує probe Gateway RPC, використовуючи розв’язаний порт/конфігурацію служби (перевизначте через `--url`/`--token`/`--password`).
- `gateway status` підтримує `--no-probe`, `--deep`, `--require-rpc` і `--json` для сценаріїв автоматизації.
- `gateway status` також показує застарілі або додаткові служби gateway, коли може їх виявити (`--deep` додає сканування на рівні системи). Іменовані профілем служби OpenClaw вважаються повноцінними й не позначаються як “extra”.
- `gateway status` лишається доступним для діагностики, навіть коли локальна конфігурація CLI відсутня або невалідна.
- `gateway status` виводить розв’язаний шлях до файла журналу, знімок шляхів/валідності конфігурації CLI-порівняно-зі-службою та розв’язаний URL probe-цілі.
- Якщо auth SecretRefs для gateway не розв’язуються в поточному шляху команди, `gateway status --json` повідомляє `rpc.authWarning` лише тоді, коли probe підключення/автентифікація завершуються невдачею (попередження пригнічуються, якщо probe успішний).
- У встановленнях Linux systemd перевірки розходження токенів у status включають обидва джерела unit: `Environment=` і `EnvironmentFile=`.
- `gateway install|uninstall|start|stop|restart` підтримують `--json` для сценаріїв автоматизації (типовий вивід лишається дружнім для людини).
- `gateway install` типово використовує runtime Node; bun **не рекомендовано** (помилки WhatsApp/Telegram).
- Параметри `gateway install`: `--port`, `--runtime`, `--token`, `--force`, `--json`.

### `daemon`

Застарілий псевдонім для команд керування службою Gateway. Див. [/cli/daemon](/uk/cli/daemon).

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

Переглядати file-журнали Gateway через RPC.

Параметри:

- `--limit <n>`: максимальна кількість рядків журналу для повернення
- `--max-bytes <n>`: максимальна кількість байтів для читання з файла журналу
- `--follow`: стежити за файлом журналу (у стилі `tail -f`)
- `--interval <ms>`: інтервал опитування в мс під час стеження
- `--local-time`: відображати часові позначки в місцевому часі
- `--json`: виводити JSON із розділенням по рядках
- `--plain`: вимкнути структуроване форматування
- `--no-color`: вимкнути кольори ANSI
- `--url <url>`: явний URL WebSocket Gateway
- `--token <token>`: токен Gateway
- `--timeout <ms>`: таймаут Gateway RPC
- `--expect-final`: за потреби чекати на фінальну відповідь

Приклади:

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

Примітки:

- Якщо передано `--url`, CLI не застосовує автоматично облікові дані з конфігурації чи середовища.
- Помилки local loopback pairинг повертаються до налаштованого локального файла журналу; явні цілі `--url` — ні.

### `gateway <subcommand>`

Допоміжні CLI-команди Gateway (використовуйте `--url`, `--token`, `--password`, `--timeout`, `--expect-final` для RPC-підкоманд).
Коли ви передаєте `--url`, CLI не застосовує автоматично облікові дані з конфігурації чи середовища.
Явно вкажіть `--token` або `--password`. Відсутність явних облікових даних є помилкою.

Підкоманди:

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

Примітки:

- `gateway status --deep` додає сканування служб на рівні системи. Використовуйте `gateway probe`,
  `health --verbose` або `status --deep` верхнього рівня для докладніших runtime probe-даних.

Поширені RPC:

- `config.schema.lookup` (переглянути одне піддерево конфігурації з поверхневим вузлом schema, зіставленими метаданими hint і зведеннями безпосередніх дочірніх елементів)
- `config.get` (прочитати поточний знімок конфігурації + hash)
- `config.set` (перевірити + записати повну конфігурацію; використовуйте `baseHash` для оптимістичної конкуренції)
- `config.apply` (перевірити + записати конфігурацію + перезапустити + пробудити)
- `config.patch` (об’єднати часткове оновлення + перезапустити + пробудити)
- `update.run` (запустити оновлення + перезапустити + пробудити)

Порада: коли викликаєте `config.set`/`config.apply`/`config.patch` напряму, передавайте `baseHash` із
`config.get`, якщо конфігурація вже існує.
Порада: для часткових змін спочатку виконайте перевірку через `config.schema.lookup` і надавайте перевагу `config.patch`.
Порада: ці RPC запису конфігурації попередньо перевіряють активне розв’язання SecretRef для посилань у надісланому payload конфігурації й відхиляють запис, якщо фактично активне надіслане посилання не розв’язується.
Порада: інструмент runtime `gateway`, доступний лише власнику, як і раніше відмовляється переписувати `tools.exec.ask` або `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec.

## Models

Див. [/concepts/models](/uk/concepts/models) щодо поведінки fallback і стратегії сканування.

Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw
знову дозволене, тому OpenClaw розглядає повторне використання Claude CLI і використання `claude -p` як
санкціоновані для цієї інтеграції, доки Anthropic не опублікує нову політику. Для
продакшну надавайте перевагу ключу Anthropic API або іншому підтримуваному
провайдеру у стилі підписки, такому як OpenAI Codex, Alibaba Cloud Model Studio
Coding Plan, MiniMax Coding Plan або Z.AI / GLM Coding Plan.

Anthropic setup-token і далі доступний як підтримуваний шлях автентифікації токеном, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

### `models` (корінь)

`openclaw models` — це псевдонім для `models status`.

Кореневі параметри:

- `--status-json` (псевдонім для `models status --json`)
- `--status-plain` (псевдонім для `models status --plain`)

### `models list`

Параметри:

- `--all`
- `--local`
- `--provider <id>`
- `--json`
- `--plain`

`--all` включає рядки статичного каталогу, що належать вбудованим провайдерам, ще до
налаштування автентифікації. Рядки залишаються недоступними, доки не з’являться
відповідні облікові дані провайдера.

### `models status`

Параметри:

- `--json`
- `--plain`
- `--check` (вихід 1=прострочено/відсутнє, 2=скоро спливає)
- `--probe` (жива probe-перевірка налаштованих профілів автентифікації)
- `--probe-provider <name>`
- `--probe-profile <id>` (можна повторювати або передавати через кому)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

Завжди включає огляд автентифікації та стан спливання OAuth для профілів у сховищі auth.
`--probe` запускає живі запити (може витрачати токени й викликати rate limits).
Рядки probe можуть надходити з профілів auth, облікових даних env або `models.json`.
Очікуйте такі стани probe, як `ok`, `auth`, `rate_limit`, `billing`, `timeout`,
`format`, `unknown` і `no_model`.
Коли явний `auth.order.<provider>` пропускає збережений профіль, probe повідомляє
`excluded_by_auth_order` замість мовчазної спроби використати цей профіль.

### `models set <model>`

Установити `agents.defaults.model.primary`.

### `models set-image <model>`

Установити `agents.defaults.imageModel.primary`.

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

- `add`: інтерактивна допоміжна команда автентифікації (потік автентифікації провайдера або вставлення токена)
- `login`: `--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`: потік входу OAuth GitHub Copilot (`--yes`)
- `setup-token`: `--provider <name>`, `--yes`
- `paste-token`: `--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

Примітки:

- `setup-token` і `paste-token` — це узагальнені команди токенів для провайдерів, які надають методи автентифікації токеном.
- `setup-token` вимагає інтерактивний TTY і запускає метод автентифікації токеном відповідного провайдера.
- `paste-token` запитує значення токена й типово використовує ідентифікатор профілю auth `<provider>:manual`, якщо `--profile-id` не вказано.
- Anthropic `setup-token` / `paste-token` і далі доступні як підтримуваний шлях токенів OpenClaw, але OpenClaw тепер надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

## System

### `system event`

Поставити системну подію в чергу й, за потреби, запустити Heartbeat (Gateway RPC).

Обов’язково:

- `--text <text>`

Параметри:

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Керування Heartbeat (Gateway RPC).

Параметри:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

Перелічити записи system presence (Gateway RPC).

Параметри:

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

Керуйте запланованими завданнями (Gateway RPC). Див. [/automation/cron-jobs](/uk/automation/cron-jobs).

Підкоманди:

- `cron status [--json]`
- `cron list [--all] [--json]` (типово табличний вивід; використовуйте `--json` для сирого виводу)
- `cron add` (псевдонім: `create`; вимагає `--name` і рівно один із `--at` | `--every` | `--cron`, а також рівно один payload із `--system-event` | `--message`)
- `cron edit <id>` (оновити поля частково)
- `cron rm <id>` (псевдоніми: `remove`, `delete`)
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

Усі команди `cron` приймають `--url`, `--token`, `--timeout`, `--expect-final`.

`cron add|edit --model ...` використовує цей вибраний дозволений model для завдання. Якщо
model не дозволений, cron попереджає й повертається до вибору
model agent/типового model самого завдання. Налаштовані ланцюжки fallback і далі застосовуються, але звичайне
перевизначення model без явного списку fallback для завдання більше не додає
основний model agent як приховану додаткову ціль повторної спроби.

## Хост Node

### `node`

`node` запускає **headless node host** або керує ним як фоновою службою. Див.
[`openclaw node`](/uk/cli/node).

Підкоманди:

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

Примітки щодо auth:

- `node` розв’язує auth gateway із env/config (без прапорців `--token`/`--password`): `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, потім `gateway.auth.*`. У локальному режимі node host навмисно ігнорує `gateway.remote.*`; у `gateway.mode=remote` `gateway.remote.*` бере участь відповідно до правил пріоритету remote.
- Розв’язання auth для node host враховує лише змінні середовища `OPENCLAW_GATEWAY_*`.

## Nodes

`nodes` взаємодіє з Gateway і націлюється на спарені Nodes. Див. [/nodes](/uk/nodes).

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

Canvas + екран:

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

CLI для керування браузером (виділений Chrome/Brave/Edge/Chromium). Див. [`openclaw browser`](/uk/cli/browser) і [інструмент Browser](/uk/tools/browser).

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

Утиліти для voice-call, надані Plugin. З’являється лише тоді, коли Plugin voice-call установлено та ввімкнено. Див. [`openclaw voicecall`](/uk/cli/voicecall).

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

Шукати в живому індексі документації OpenClaw.

### `docs [query...]`

Шукати в живому індексі документації.

## TUI

### `tui`

Відкрити terminal UI, підключений до Gateway.

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

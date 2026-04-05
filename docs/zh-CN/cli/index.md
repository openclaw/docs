---
read_when:
    - 添加或修改 CLI 命令或选项
    - 为新的命令界面编写文档
summary: OpenClaw CLI 中 `openclaw` 命令、子命令和选项的参考
title: CLI 参考
x-i18n:
    generated_at: "2026-04-05T08:22:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57398636c2e625d4e12e465871f2ef560d958afe6ae83ef3040c1f4819f5e0
    source_path: cli/index.md
    workflow: 15
---

# CLI 参考

本页描述当前的 CLI 行为。如果命令发生变化，请更新此文档。

## 命令页面

- [`setup`](/cli/setup)
- [`onboard`](/cli/onboard)
- [`configure`](/cli/configure)
- [`config`](/cli/config)
- [`completion`](/cli/completion)
- [`doctor`](/cli/doctor)
- [`dashboard`](/cli/dashboard)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)
- [`uninstall`](/cli/uninstall)
- [`update`](/cli/update)
- [`message`](/cli/message)
- [`agent`](/cli/agent)
- [`agents`](/cli/agents)
- [`acp`](/cli/acp)
- [`mcp`](/cli/mcp)
- [`status`](/cli/status)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`gateway`](/cli/gateway)
- [`logs`](/cli/logs)
- [`system`](/cli/system)
- [`models`](/cli/models)
- [`memory`](/cli/memory)
- [`directory`](/cli/directory)
- [`nodes`](/cli/nodes)
- [`devices`](/cli/devices)
- [`node`](/cli/node)
- [`approvals`](/cli/approvals)
- [`sandbox`](/cli/sandbox)
- [`tui`](/cli/tui)
- [`browser`](/cli/browser)
- [`cron`](/cli/cron)
- [`tasks`](/cli/index#tasks)
- [`flows`](/cli/flows)
- [`dns`](/cli/dns)
- [`docs`](/cli/docs)
- [`hooks`](/cli/hooks)
- [`webhooks`](/cli/webhooks)
- [`pairing`](/cli/pairing)
- [`qr`](/cli/qr)
- [`plugins`](/cli/plugins)（插件命令）
- [`channels`](/cli/channels)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`skills`](/cli/skills)
- [`daemon`](/cli/daemon)（Gateway 网关服务命令的旧别名）
- [`clawbot`](/cli/clawbot)（旧别名命名空间）
- [`voicecall`](/cli/voicecall)（插件；如已安装）

## 全局标志

- `--dev`：将状态隔离到 `~/.openclaw-dev` 下，并调整默认端口。
- `--profile <name>`：将状态隔离到 `~/.openclaw-<name>` 下。
- `--container <name>`：将命名容器作为执行目标。
- `--no-color`：禁用 ANSI 颜色。
- `--update`：`openclaw update` 的简写形式（仅适用于源码安装）。
- `-V`, `--version`, `-v`：打印版本并退出。

## 输出样式

- ANSI 颜色和进度指示器仅在 TTY 会话中渲染。
- OSC-8 超链接会在支持的终端中显示为可点击链接；否则会回退为普通 URL。
- `--json`（以及支持时的 `--plain`）会禁用样式以获得干净输出。
- `--no-color` 会禁用 ANSI 样式；同时也支持 `NO_COLOR=1`。
- 长时间运行的命令会显示进度指示器（支持时使用 OSC 9;4）。

## 调色板

OpenClaw 在 CLI 输出中使用 lobster 调色板。

- `accent` (#FF5A2D)：标题、标签、主要高亮。
- `accentBright` (#FF7A3D)：命令名称、强调内容。
- `accentDim` (#D14A22)：次级高亮文本。
- `info` (#FF8A5B)：信息性值。
- `success` (#2FBF71)：成功状态。
- `warn` (#FFB020)：警告、回退、需要注意的内容。
- `error` (#E23D2D)：错误、失败。
- `muted` (#8B7F77)：弱化显示、元数据。

调色板的权威来源：`src/terminal/palette.ts`（“lobster palette”）。

## 命令树

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

说明：插件可以添加额外的顶层命令（例如 `openclaw voicecall`）。

## 安全

- `openclaw security audit` — 审计配置和本地状态中的常见安全陷阱。
- `openclaw security audit --deep` — 尽力执行实时 Gateway 网关探测。
- `openclaw security audit --fix` — 收紧安全默认值以及状态/配置权限。

## Secrets

### `secrets`

管理 SecretRef 以及相关的运行时/配置卫生。

子命令：

- `secrets reload`
- `secrets audit`
- `secrets configure`
- `secrets apply --from <path>`

`secrets reload` 选项：

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`

`secrets audit` 选项：

- `--check`
- `--allow-exec`
- `--json`

`secrets configure` 选项：

- `--apply`
- `--yes`
- `--providers-only`
- `--skip-provider-setup`
- `--agent <id>`
- `--allow-exec`
- `--plan-out <path>`
- `--json`

`secrets apply --from <path>` 选项：

- `--dry-run`
- `--allow-exec`
- `--json`

说明：

- `reload` 是一个 Gateway 网关 RPC，当解析失败时会保留最后一次已知可用的运行时快照。
- `audit --check` 在发现问题时返回非零值；未解析的引用会使用更高优先级的非零退出码。
- 默认会跳过 dry-run exec 检查；使用 `--allow-exec` 可选择启用。

## 插件

管理扩展及其配置：

- `openclaw plugins list` — 发现插件（机器输出请使用 `--json`）。
- `openclaw plugins inspect <id>` — 显示插件详情（`info` 是别名）。
- `openclaw plugins install <path|.tgz|npm-spec|plugin@marketplace>` — 安装插件（或将插件路径添加到 `plugins.load.paths`；使用 `--force` 覆盖现有安装目标）。
- `openclaw plugins marketplace list <marketplace>` — 在安装前列出 marketplace 条目。
- `openclaw plugins enable <id>` / `disable <id>` — 切换 `plugins.entries.<id>.enabled`。
- `openclaw plugins doctor` — 报告插件加载错误。

大多数插件变更都需要重启 Gateway 网关。参见 [/plugin](/tools/plugin)。

## 内存

对 `MEMORY.md` + `memory/*.md` 执行向量搜索：

- `openclaw memory status` — 显示索引统计；使用 `--deep` 可检查向量和 embedding 就绪状态，或使用 `--fix` 修复过期的 recall/promotion 产物。
- `openclaw memory index` — 重新索引内存文件。
- `openclaw memory search "<query>"`（或 `--query "<query>"`）— 对内存执行语义搜索。
- `openclaw memory promote` — 对短期 recall 进行排序，并可选择将排名靠前的条目追加到 `MEMORY.md` 中。

## 沙箱

管理用于隔离智能体执行的沙箱运行时。参见 [/cli/sandbox](/cli/sandbox)。

子命令：

- `sandbox list [--browser] [--json]`
- `sandbox recreate [--all] [--session <key>] [--agent <id>] [--browser] [--force]`
- `sandbox explain [--session <key>] [--agent <id>] [--json]`

说明：

- `sandbox recreate` 会删除现有运行时，以便下次使用时根据当前配置重新初始化。
- 对于 `ssh` 和 OpenShell `remote` 后端，recreate 会删除所选范围的规范远程工作区。

## 聊天斜杠命令

聊天消息支持 `/...` 命令（文本和原生命令）。参见 [/tools/slash-commands](/tools/slash-commands)。

重点：

- `/status` 用于快速诊断。
- `/config` 用于持久化配置变更。
- `/debug` 用于仅运行时的配置覆盖（保存在内存中，不写磁盘；需要 `commands.debug: true`）。

## 设置与新手引导

### `completion`

生成 shell 补全脚本，并可选择将其安装到你的 shell 配置文件中。

选项：

- `-s, --shell <zsh|bash|powershell|fish>`
- `-i, --install`
- `--write-state`
- `-y, --yes`

说明：

- 如果不传 `--install` 或 `--write-state`，`completion` 会将脚本打印到 stdout。
- `--install` 会向你的 shell 配置文件中写入一个 `OpenClaw Completion` 块，并将其指向 OpenClaw 状态目录下缓存的脚本。

### `setup`

初始化配置和工作区。

选项：

- `--workspace <dir>`：智能体工作区路径（默认 `~/.openclaw/workspace`）。
- `--wizard`：运行新手引导。
- `--non-interactive`：无提示运行新手引导。
- `--mode <local|remote>`：新手引导模式。
- `--remote-url <url>`：远程 Gateway 网关 URL。
- `--remote-token <token>`：远程 Gateway 网关令牌。

只要存在任意新手引导标志（`--non-interactive`、`--mode`、`--remote-url`、`--remote-token`），就会自动运行新手引导。

### `onboard`

用于 Gateway 网关、工作区和 Skills 的交互式新手引导。

选项：

- `--workspace <dir>`
- `--reset`（在新手引导前重置配置 + 凭证 + 会话）
- `--reset-scope <config|config+creds+sessions|full>`（默认 `config+creds+sessions`；使用 `full` 时还会删除工作区）
- `--non-interactive`
- `--mode <local|remote>`
- `--flow <quickstart|advanced|manual>`（`manual` 是 `advanced` 的别名）
- `--auth-choice <choice>`，其中 `<choice>` 可以是：
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
- Qwen 说明：`qwen-*` 是规范的 auth-choice 系列。`modelstudio-*`
  id 仅作为旧版兼容别名继续接受。
- `--secret-input-mode <plaintext|ref>`（默认 `plaintext`；使用 `ref` 可将提供商默认环境变量引用存为引用，而不是明文密钥）
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
- `--custom-base-url <url>`（非交互式；与 `--auth-choice custom-api-key` 一起使用）
- `--custom-model-id <id>`（非交互式；与 `--auth-choice custom-api-key` 一起使用）
- `--custom-api-key <key>`（非交互式；可选；与 `--auth-choice custom-api-key` 一起使用；省略时回退到 `CUSTOM_API_KEY`）
- `--custom-provider-id <id>`（非交互式；可选的自定义 provider id）
- `--custom-compatibility <openai|anthropic>`（非交互式；可选；默认 `openai`）
- `--gateway-port <port>`
- `--gateway-bind <loopback|lan|tailnet|auto|custom>`
- `--gateway-auth <token|password>`
- `--gateway-token <token>`
- `--gateway-token-ref-env <name>`（非交互式；将 `gateway.auth.token` 存储为环境变量 SecretRef；要求该环境变量已设置；不能与 `--gateway-token` 同时使用）
- `--gateway-password <password>`
- `--remote-url <url>`
- `--remote-token <token>`
- `--tailscale <off|serve|funnel>`
- `--tailscale-reset-on-exit`
- `--install-daemon`
- `--no-install-daemon`（别名：`--skip-daemon`）
- `--daemon-runtime <node|bun>`
- `--skip-channels`
- `--skip-skills`
- `--skip-search`
- `--skip-health`
- `--skip-ui`
- `--cloudflare-ai-gateway-account-id <id>`
- `--cloudflare-ai-gateway-gateway-id <id>`
- `--node-manager <npm|pnpm|bun>`（用于 Skills 的 setup/onboarding 节点管理器；推荐 pnpm，也支持 bun）
- `--json`

### `configure`

交互式配置向导（模型、渠道、Skills、Gateway 网关）。

选项：

- `--section <section>`（可重复；将向导限制在特定部分）

### `config`

非交互式配置辅助工具（get/set/unset/file/schema/validate）。在没有
子命令的情况下运行 `openclaw config` 会启动向导。

子命令：

- `config get <path>`：打印配置值（点/方括号路径）。
- `config set`：支持四种赋值模式：
  - 值模式：`config set <path> <value>`（JSON5 或字符串解析）
  - SecretRef 构建器模式：`config set <path> --ref-provider <provider> --ref-source <source> --ref-id <id>`
  - provider 构建器模式：`config set secrets.providers.<alias> --provider-source <env|file|exec> ...`
  - 批量模式：`config set --batch-json '<json>'` 或 `config set --batch-file <path>`
- `config set --dry-run`：验证赋值但不写入 `openclaw.json`（默认跳过 exec SecretRef 检查）。
- `config set --allow-exec --dry-run`：选择启用 exec SecretRef 的 dry-run 检查（可能会执行 provider 命令）。
- `config set --dry-run --json`：输出机器可读的 dry-run 结果（检查 + 完整性信号、操作、已检查/已跳过的引用、错误）。
- `config set --strict-json`：要求对路径/值输入执行 JSON5 解析。`--json` 在 dry-run 输出模式之外仍保留为严格解析的旧别名。
- `config unset <path>`：删除一个值。
- `config file`：打印当前活动配置文件路径。
- `config schema`：打印为 `openclaw.json` 生成的 JSON schema，其中包括在嵌套对象、通配符、数组项和组合分支中传播的字段 `title` / `description` 文档元数据，以及尽力提供的实时插件/渠道 schema 元数据。
- `config validate`：在不启动 Gateway 网关的情况下，根据 schema 验证当前配置。
- `config validate --json`：输出机器可读的 JSON 结果。

### `doctor`

健康检查和快速修复（配置 + Gateway 网关 + 旧版服务）。

选项：

- `--no-workspace-suggestions`：禁用工作区内存提示。
- `--yes`：无需提示即接受默认值（无头模式）。
- `--non-interactive`：跳过提示；仅应用安全迁移。
- `--deep`：扫描系统服务以查找额外的 Gateway 网关安装。
- `--repair`（别名：`--fix`）：尝试自动修复检测到的问题。
- `--force`：即使并非严格必要也强制修复。
- `--generate-gateway-token`：生成新的 Gateway 网关认证令牌。

### `dashboard`

使用当前令牌打开控制 UI。

选项：

- `--no-open`：打印 URL，但不启动浏览器

说明：

- 对于由 SecretRef 管理的 Gateway 网关令牌，`dashboard` 会打印或打开不带令牌的 URL，而不是在终端输出或浏览器启动参数中暴露该秘密。

### `update`

更新已安装的 CLI。

根选项：

- `--json`
- `--no-restart`
- `--dry-run`
- `--channel <stable|beta|dev>`
- `--tag <dist-tag|version|spec>`
- `--timeout <seconds>`
- `--yes`

子命令：

- `update status`
- `update wizard`

`update status` 选项：

- `--json`
- `--timeout <seconds>`

`update wizard` 选项：

- `--timeout <seconds>`

说明：

- `openclaw --update` 会重写为 `openclaw update`。

### `backup`

为 OpenClaw 状态创建并验证本地备份归档。

子命令：

- `backup create`
- `backup verify <archive>`

`backup create` 选项：

- `--output <path>`
- `--json`
- `--dry-run`
- `--verify`
- `--only-config`
- `--no-include-workspace`

`backup verify <archive>` 选项：

- `--json`

## 渠道辅助工具

### `channels`

管理聊天渠道账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Microsoft Teams）。

子命令：

- `channels list`：显示已配置的渠道和认证配置文件。
- `channels status`：检查 Gateway 网关可达性和渠道健康状态（`--probe` 会在 Gateway 网关可达时执行每账户实时 probe/audit 检查；如果不可达，则回退到仅配置的渠道摘要。更广泛的 Gateway 网关健康探测请使用 `openclaw health` 或 `openclaw status --deep`）。
- 提示：`channels status` 在能够检测到常见配置错误时会打印带有修复建议的警告（然后指向 `openclaw doctor`）。
- `channels logs`：显示 Gateway 网关日志文件中的最近渠道日志。
- `channels add`：不传标志时为向导式设置；传入标志后切换为非交互模式。
  - 当向仍使用单账户顶层配置的渠道添加非默认账户时，OpenClaw 会先将按账户作用域的值提升到该渠道的账户映射中，再写入新账户。大多数渠道使用 `accounts.default`；Matrix 则可能保留现有匹配的具名/默认目标。
  - 非交互式 `channels add` 不会自动创建/升级绑定；仅渠道级绑定会继续匹配默认账户。
- `channels remove`：默认只是禁用；传入 `--delete` 才会在不提示的情况下删除配置条目。
- `channels login`：交互式渠道登录（仅 WhatsApp Web）。
- `channels logout`：退出某个渠道会话（如果支持）。

常用选项：

- `--channel <name>`：`whatsapp|telegram|discord|googlechat|slack|mattermost|signal|imessage|msteams`
- `--account <id>`：渠道账户 id（默认 `default`）
- `--name <label>`：账户显示名

`channels login` 选项：

- `--channel <channel>`（默认 `whatsapp`；支持 `whatsapp`/`web`）
- `--account <id>`
- `--verbose`

`channels logout` 选项：

- `--channel <channel>`（默认 `whatsapp`）
- `--account <id>`

`channels list` 选项：

- `--no-usage`：跳过模型 provider 使用量/配额快照（仅 OAuth/API 支持的场景）。
- `--json`：输出 JSON（除非设置了 `--no-usage`，否则会包含使用量）。

`channels status` 选项：

- `--probe`
- `--timeout <ms>`
- `--json`

`channels capabilities` 选项：

- `--channel <name>`
- `--account <id>`（仅在设置 `--channel` 时可用）
- `--target <dest>`
- `--timeout <ms>`
- `--json`

`channels resolve` 选项：

- `<entries...>`
- `--channel <name>`
- `--account <id>`
- `--kind <auto|user|group>`
- `--json`

`channels logs` 选项：

- `--channel <name|all>`（默认 `all`）
- `--lines <n>`（默认 `200`）
- `--json`

说明：

- `channels login` 支持 `--verbose`。
- `channels capabilities --account` 仅在设置了 `--channel` 时适用。
- `channels status --probe` 可显示传输状态以及 probe/audit 结果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`，具体取决于渠道支持情况。

更多细节：[/concepts/oauth](/concepts/oauth)

示例：

```bash
openclaw channels add --channel telegram --account alerts --name "Alerts Bot" --token $TELEGRAM_BOT_TOKEN
openclaw channels add --channel discord --account work --name "Work Bot" --token $DISCORD_BOT_TOKEN
openclaw channels remove --channel discord --account work --delete
openclaw channels status --probe
openclaw status --deep
```

### `directory`

查询暴露目录界面的渠道中的 self、peer 和群组 id。参见 [`openclaw directory`](/cli/directory)。

常用选项：

- `--channel <name>`
- `--account <id>`
- `--json`

子命令：

- `directory self`
- `directory peers list [--query <text>] [--limit <n>]`
- `directory groups list [--query <text>] [--limit <n>]`
- `directory groups members --group-id <id> [--limit <n>]`

### `skills`

列出并检查可用 Skills 以及就绪信息。

子命令：

- `skills search [query...]`：搜索 ClawHub Skills。
- `skills search --limit <n> --json`：限制搜索结果数量或输出机器可读结果。
- `skills install <slug>`：将一个来自 ClawHub 的 Skill 安装到当前工作区。
- `skills install <slug> --version <version>`：安装指定的 ClawHub 版本。
- `skills install <slug> --force`：覆盖现有工作区 Skill 文件夹。
- `skills update <slug|--all>`：更新已跟踪的 ClawHub Skills。
- `skills list`：列出 Skills（未指定子命令时的默认行为）。
- `skills list --json`：将机器可读的 Skill 清单输出到 stdout。
- `skills list --verbose`：在表格中包含缺失要求。
- `skills info <name>`：显示单个 Skill 的详情。
- `skills info <name> --json`：将机器可读详情输出到 stdout。
- `skills check`：汇总已就绪与缺失要求。
- `skills check --json`：将机器可读的就绪状态输出到 stdout。

选项：

- `--eligible`：仅显示已就绪的 Skills。
- `--json`：输出 JSON（无样式）。
- `-v`, `--verbose`：包含缺失要求的详细信息。

提示：对于由 ClawHub 支持的 Skills，请使用 `openclaw skills search`、`openclaw skills install` 和 `openclaw skills update`。

### `pairing`

跨渠道批准私信配对请求。

子命令：

- `pairing list [channel] [--channel <channel>] [--account <id>] [--json]`
- `pairing approve <channel> <code> [--account <id>] [--notify]`
- `pairing approve --channel <channel> [--account <id>] <code> [--notify]`

说明：

- 如果恰好只配置了一个支持配对的渠道，也允许使用 `pairing approve <code>`。
- `list` 和 `approve` 都支持针对多账户渠道使用 `--account <id>`。

### `devices`

管理 Gateway 网关设备配对条目和按角色划分的设备令牌。

子命令：

- `devices list [--json]`
- `devices approve [requestId] [--latest]`
- `devices reject <requestId>`
- `devices remove <deviceId>`
- `devices clear --yes [--pending]`
- `devices rotate --device <id> --role <role> [--scope <scope...>]`
- `devices revoke --device <id> --role <role>`

说明：

- 当直接配对范围不可用时，`devices list` 和 `devices approve` 可以在 local loopback 上回退到本地配对文件。
- 当未传入 `requestId` 或设置了 `--latest` 时，`devices approve` 会自动选择最新的待处理请求。
- 已存储令牌的重连会复用该令牌缓存的已批准 scopes；显式执行
  `devices rotate --scope ...` 会更新这组已存储 scope，以供未来
  的缓存令牌重连使用。
- `devices rotate` 和 `devices revoke` 会返回 JSON 负载。

### `qr`

根据当前 Gateway 网关配置生成移动端配对 QR 码和设置代码。参见 [`openclaw qr`](/cli/qr)。

选项：

- `--remote`
- `--url <url>`
- `--public-url <url>`
- `--token <token>`
- `--password <password>`
- `--setup-code-only`
- `--no-ascii`
- `--json`

说明：

- `--token` 和 `--password` 互斥。
- 设置代码携带的是短期 bootstrap 令牌，而不是共享的 Gateway 网关令牌/密码。
- 内置 bootstrap 交接会将主节点令牌保持为 `scopes: []`。
- 任何交接出去的 operator bootstrap 令牌都仅限于 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。
- Bootstrap scope 检查带有角色前缀，因此该 operator allowlist 只满足 operator 请求；非 operator 角色仍然需要其各自角色前缀下的 scopes。
- `--remote` 可以使用 `gateway.remote.url` 或当前启用的 Tailscale Serve/Funnel URL。
- 扫描后，请使用 `openclaw devices list` / `openclaw devices approve <requestId>` 批准请求。

### `clawbot`

旧别名命名空间。目前支持 `openclaw clawbot qr`，其映射到 [`openclaw qr`](/cli/qr)。

### `hooks`

管理内部智能体 hooks。

子命令：

- `hooks list`
- `hooks info <name>`
- `hooks check`
- `hooks enable <name>`
- `hooks disable <name>`
- `hooks install <path-or-spec>`（`openclaw plugins install` 的已弃用别名）
- `hooks update [id]`（`openclaw plugins update` 的已弃用别名）

常用选项：

- `--json`
- `--eligible`
- `-v`, `--verbose`

说明：

- 由插件管理的 hooks 不能通过 `openclaw hooks` 启用或禁用；请改为启用或禁用其所属插件。
- `hooks install` 和 `hooks update` 仍可作为兼容别名使用，但会打印弃用警告并转发到插件命令。

### `webhooks`

Webhook 辅助工具。当前内置界面是 Gmail Pub/Sub 设置与运行器：

- `webhooks gmail setup`
- `webhooks gmail run`

### `webhooks gmail`

Gmail Pub/Sub hook 设置与运行器。参见 [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)。

子命令：

- `webhooks gmail setup`（要求 `--account <email>`；支持 `--project`, `--topic`, `--subscription`, `--label`, `--hook-url`, `--hook-token`, `--push-token`, `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes`, `--tailscale`, `--tailscale-path`, `--tailscale-target`, `--push-endpoint`, `--json`）
- `webhooks gmail run`（针对相同标志的运行时覆盖）

说明：

- `setup` 会配置 Gmail watch 以及面向 OpenClaw 的 push 路径。
- `run` 会启动本地 Gmail watcher/续期循环，并支持可选的运行时覆盖。

### `dns`

广域设备发现 DNS 辅助工具（CoreDNS + Tailscale）。当前内置界面：

- `dns setup [--domain <domain>] [--apply]`

### `dns setup`

广域设备发现 DNS 辅助工具（CoreDNS + Tailscale）。参见 [/gateway/discovery](/gateway/discovery)。

选项：

- `--domain <domain>`
- `--apply`：安装/更新 CoreDNS 配置（需要 sudo；仅 macOS）。

说明：

- 不传 `--apply` 时，这是一个规划辅助工具，会打印推荐的 OpenClaw + Tailscale DNS 配置。
- `--apply` 当前仅支持使用 Homebrew CoreDNS 的 macOS。

## 消息与智能体

### `message`

统一的出站消息与渠道操作。

参见：[/cli/message](/cli/message)

子命令：

- `message send|poll|react|reactions|read|edit|delete|pin|unpin|pins|permissions|search|timeout|kick|ban`
- `message thread <create|list|reply>`
- `message emoji <list|upload>`
- `message sticker <send|upload>`
- `message role <info|add|remove>`
- `message channel <info|list>`
- `message member info`
- `message voice status`
- `message event <list|create>`

示例：

- `openclaw message send --target +15555550123 --message "Hi"`
- `openclaw message poll --channel discord --target channel:123 --poll-question "Snack?" --poll-option Pizza --poll-option Sushi`

### `agent`

通过 Gateway 网关运行一次智能体回合（或使用 `--local` 进行嵌入式运行）。

至少传入一个会话选择器：`--to`、`--session-id` 或 `--agent`。

必需：

- `-m, --message <text>`

选项：

- `-t, --to <dest>`（用于会话键和可选投递）
- `--session-id <id>`
- `--agent <id>`（智能体 id；会覆盖路由绑定）
- `--thinking <off|minimal|low|medium|high|xhigh>`（provider 支持情况不同；CLI 层面不按模型做限制）
- `--verbose <on|off>`
- `--channel <channel>`（投递渠道；省略时使用会话主渠道）
- `--reply-to <target>`（回复目标覆盖，独立于会话路由）
- `--reply-channel <channel>`（回复渠道覆盖）
- `--reply-account <id>`（回复账户 id 覆盖）
- `--local`（嵌入式运行；插件注册表仍会先预加载）
- `--deliver`
- `--json`
- `--timeout <seconds>`

说明：

- 当 Gateway 网关请求失败时，Gateway 网关模式会回退到嵌入式智能体。
- `--local` 仍会预加载插件注册表，因此插件提供的 provider、工具和渠道在嵌入式运行期间仍然可用。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响的是回复投递，而不是路由。

### `agents`

管理隔离的智能体（工作区 + 认证 + 路由）。

在没有子命令的情况下运行 `openclaw agents` 等同于 `openclaw agents list`。

#### `agents list`

列出已配置的智能体。

选项：

- `--json`
- `--bindings`

#### `agents add [name]`

添加一个新的隔离智能体。除非传入标志（或 `--non-interactive`），否则会运行引导式向导；在非交互模式下必须提供 `--workspace`。

选项：

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>`（可重复）
- `--non-interactive`
- `--json`

绑定规范使用 `channel[:accountId]`。省略 `accountId` 时，OpenClaw 可能通过渠道默认值/插件 hook 解析账户作用域；否则它将是一个不带显式账户作用域的渠道绑定。
传入任意显式 add 标志都会使该命令切换到非交互路径。`main` 是保留值，不能用作新智能体 id。

#### `agents bindings`

列出路由绑定。

选项：

- `--agent <id>`
- `--json`

#### `agents bind`

为智能体添加路由绑定。

选项：

- `--agent <id>`（默认是当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--json`

#### `agents unbind`

移除智能体的路由绑定。

选项：

- `--agent <id>`（默认是当前默认智能体）
- `--bind <channel[:accountId]>`（可重复）
- `--all`
- `--json`

使用 `--all` 或 `--bind` 其一，不要同时使用。

#### `agents delete <id>`

删除一个智能体，并清理其工作区和状态。

选项：

- `--force`
- `--json`

说明：

- `main` 不能删除。
- 如果没有 `--force`，则需要交互式确认。

#### `agents set-identity`

更新智能体身份信息（名称/主题/emoji/avatar）。

选项：

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

说明：

- 可使用 `--agent` 或 `--workspace` 选择目标智能体。
- 当未提供显式身份字段时，该命令会读取 `IDENTITY.md`。

### `acp`

运行将 IDE 连接到 Gateway 网关的 ACP bridge。

根选项：

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

用于 bridge 调试的交互式 ACP client。

选项：

- `--cwd <dir>`
- `--server <command>`
- `--server-args <args...>`
- `--server-verbose`
- `--verbose`

完整行为、安全说明和示例请参见 [`acp`](/cli/acp)。

### `mcp`

管理已保存的 MCP 服务器定义，并通过 MCP stdio 暴露 OpenClaw 渠道。

#### `mcp serve`

通过 MCP stdio 暴露经过路由的 OpenClaw 渠道会话。

选项：

- `--url <url>`
- `--token <token>`
- `--token-file <path>`
- `--password <password>`
- `--password-file <path>`
- `--claude-channel-mode <auto|on|off>`
- `--verbose`

#### `mcp list`

列出已保存的 MCP 服务器定义。

选项：

- `--json`

#### `mcp show [name]`

显示一个已保存的 MCP 服务器定义，或完整的已保存 MCP 服务器对象。

选项：

- `--json`

#### `mcp set <name> <value>`

从一个 JSON 对象保存单个 MCP 服务器定义。

#### `mcp unset <name>`

删除单个已保存的 MCP 服务器定义。

### `approvals`

管理 exec 批准。别名：`exec-approvals`。

#### `approvals get`

获取 exec 批准快照和生效策略。

选项：

- `--node <node>`
- `--gateway`
- `--json`
- 来自 `openclaw nodes` 的 node RPC 选项

#### `approvals set`

用文件或 stdin 中的 JSON 替换 exec 批准配置。

选项：

- `--node <node>`
- `--gateway`
- `--file <path>`
- `--stdin`
- `--json`
- 来自 `openclaw nodes` 的 node RPC 选项

#### `approvals allowlist add|remove`

编辑按智能体划分的 exec allowlist。

选项：

- `--node <node>`
- `--gateway`
- `--agent <id>`（默认 `*`）
- `--json`
- 来自 `openclaw nodes` 的 node RPC 选项

### `status`

显示已关联会话的健康状态和最近的收件人。

选项：

- `--json`
- `--all`（完整诊断；只读、适合粘贴）
- `--deep`（向 Gateway 网关请求实时健康探测，包括支持时的渠道探测）
- `--usage`（显示模型 provider 使用量/配额）
- `--timeout <ms>`
- `--verbose`
- `--debug`（`--verbose` 的别名）

说明：

- 概览会在可用时包含 Gateway 网关和节点主机服务状态。
- `--usage` 会以 `X% left` 的形式打印标准化后的 provider 使用量时间窗口。

### 使用量跟踪

当 OAuth/API 凭证可用时，OpenClaw 可以显示 provider 的使用量/配额。

显示位置：

- `/status`（可用时会增加一行简短的 provider 使用量信息）
- `openclaw status --usage`（打印完整的 provider 细分）
- macOS 菜单栏（Context 下的 Usage 部分）

说明：

- 数据直接来自 provider 的使用量端点（非估算值）。
- 人类可读输出统一标准化为 `X% left`。
- 当前支持使用量时间窗口的 provider：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：原始 `usage_percent` / `usagePercent` 表示剩余额度，因此 OpenClaw 在显示前会对其取反；如果存在按计数字段，则仍优先使用。`model_remains` 响应会优先选择 chat-model 条目，必要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 使用量认证会在可用时优先来自 provider 特定 hook；否则 OpenClaw 会回退到来自 auth 配置文件、环境或配置的匹配 OAuth/API-key 凭证。若都无法解析，则会隐藏使用量。
- 详情：参见 [Usage tracking](/concepts/usage-tracking)。

### `health`

从正在运行的 Gateway 网关获取健康状态。

选项：

- `--json`
- `--timeout <ms>`
- `--verbose`（强制实时探测并打印 Gateway 网关连接详情）
- `--debug`（`--verbose` 的别名）

说明：

- 默认的 `health` 可以返回新的缓存 Gateway 网关快照。
- `health --verbose` 会强制实时探测，并以人类可读形式展开所有已配置账户和智能体的信息。

### `sessions`

列出已存储的会话。

选项：

- `--json`
- `--verbose`
- `--store <path>`
- `--active <minutes>`
- `--agent <id>`（按智能体筛选会话）
- `--all-agents`（显示所有智能体的会话）

子命令：

- `sessions cleanup` — 删除已过期或孤立的会话

说明：

- `sessions cleanup` 还支持 `--fix-missing`，用于清理其 transcript 文件已不存在的条目。

## 重置 / 卸载

### `reset`

重置本地配置/状态（保留 CLI 安装）。

选项：

- `--scope <config|config+creds+sessions|full>`
- `--yes`
- `--non-interactive`
- `--dry-run`

说明：

- `--non-interactive` 需要同时传入 `--scope` 和 `--yes`。

### `uninstall`

卸载 Gateway 网关服务和本地数据（CLI 保留）。

选项：

- `--service`
- `--state`
- `--workspace`
- `--app`
- `--all`
- `--yes`
- `--non-interactive`
- `--dry-run`

说明：

- `--non-interactive` 需要 `--yes` 和显式范围（或 `--all`）。
- `--all` 会同时删除服务、状态、工作区和应用。

### `tasks`

列出并管理跨智能体的[后台任务](/automation/tasks)运行。

- `tasks list` — 显示活动和最近的任务运行
- `tasks show <id>` — 显示指定任务运行的详情
- `tasks notify <id>` — 更改任务运行的通知策略
- `tasks cancel <id>` — 取消正在运行的任务
- `tasks audit` — 显示运行问题（陈旧、丢失、投递失败）
- `tasks maintenance` — 预览或应用任务和 Task Flow 清理/对账（ACP/子智能体子会话、活动 cron 任务、实时 CLI 运行）
- `tasks flow list` — 列出活动和最近的 Task Flow 流程
- `tasks flow show <lookup>` — 按 id 或查找键检查某个 flow
- `tasks flow cancel <lookup>` — 取消一个正在运行的 flow 及其活动任务

### `flows`

旧版文档快捷入口。Flow 命令位于 `openclaw tasks flow` 下：

- `tasks flow list [--json]`
- `tasks flow show <lookup>`
- `tasks flow cancel <lookup>`

## Gateway 网关

### `gateway`

运行 WebSocket Gateway 网关。

选项：

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
- `--reset`（重置开发配置 + 凭证 + 会话 + 工作区）
- `--force`（杀掉端口上的现有监听器）
- `--verbose`
- `--cli-backend-logs`
- `--claude-cli-logs`（已弃用别名）
- `--ws-log <auto|full|compact>`
- `--compact`（`--ws-log compact` 的别名）
- `--raw-stream`
- `--raw-stream-path <path>`

### `gateway service`

管理 Gateway 网关服务（launchd/systemd/schtasks）。

子命令：

- `gateway status`（默认探测 Gateway 网关 RPC）
- `gateway install`（安装服务）
- `gateway uninstall`
- `gateway start`
- `gateway stop`
- `gateway restart`

说明：

- `gateway status` 默认使用服务解析出的端口/配置探测 Gateway 网关 RPC（可通过 `--url/--token/--password` 覆盖）。
- `gateway status` 支持 `--no-probe`、`--deep`、`--require-rpc` 和 `--json`，适合脚本使用。
- `gateway status` 在能够检测到时，也会显示旧版或额外的 Gateway 网关服务（`--deep` 会增加系统级扫描）。按 profile 命名的 OpenClaw 服务被视为一等公民，不会标记为“extra”。
- 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
- `gateway status` 会打印解析得到的文件日志路径、CLI 与服务配置路径/有效性的快照，以及解析后的 probe 目标 URL。
- 如果在当前命令路径中 Gateway 网关 auth SecretRef 未解析，`gateway status --json` 仅在 probe 连接/认证失败时报告 `rpc.authWarning`（当 probe 成功时会抑制该警告）。
- 在 Linux systemd 安装中，状态令牌漂移检查会同时包含 `Environment=` 和 `EnvironmentFile=` 单元来源。
- `gateway install|uninstall|start|stop|restart` 支持用于脚本的 `--json`（默认输出仍保持适合人类阅读）。
- `gateway install` 默认使用 Node 运行时；**不推荐**使用 bun（WhatsApp/Telegram 存在问题）。
- `gateway install` 选项：`--port`, `--runtime`, `--token`, `--force`, `--json`。

### `daemon`

Gateway 网关服务管理命令的旧别名。参见 [/cli/daemon](/cli/daemon)。

子命令：

- `daemon status`
- `daemon install`
- `daemon uninstall`
- `daemon start`
- `daemon stop`
- `daemon restart`

常用选项：

- `status`：`--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
- `install`：`--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- `uninstall|start|stop|restart`：`--json`

### `logs`

通过 RPC tail Gateway 网关文件日志。

选项：

- `--limit <n>`：返回的最大日志行数
- `--max-bytes <n>`：从日志文件读取的最大字节数
- `--follow`：跟随日志文件（类似 tail -f）
- `--interval <ms>`：跟随时的轮询间隔（毫秒）
- `--local-time`：以本地时间显示时间戳
- `--json`：输出按行分隔的 JSON
- `--plain`：禁用结构化格式
- `--no-color`：禁用 ANSI 颜色
- `--url <url>`：显式指定 Gateway 网关 WebSocket URL
- `--token <token>`：Gateway 网关令牌
- `--timeout <ms>`：Gateway 网关 RPC 超时
- `--expect-final`：在需要时等待最终响应

示例：

```bash
openclaw logs --follow
openclaw logs --limit 200
openclaw logs --plain
openclaw logs --json
openclaw logs --no-color
```

说明：

- 如果传入 `--url`，CLI 不会自动应用配置或环境中的凭证。
- local loopback 配对失败时会回退到已配置的本地日志文件；显式 `--url` 目标不会这样做。

### `gateway <subcommand>`

Gateway 网关 CLI 辅助工具（RPC 子命令可使用 `--url`、`--token`、`--password`、`--timeout`、`--expect-final`）。
当你传入 `--url` 时，CLI 不会自动应用配置或环境凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

子命令：

- `gateway call <method> [--params <json>] [--url <url>] [--token <token>] [--password <password>] [--timeout <ms>] [--expect-final] [--json]`
- `gateway health`
- `gateway status`
- `gateway probe`
- `gateway discover`
- `gateway install|uninstall|start|stop|restart`
- `gateway run`

说明：

- `gateway status --deep` 会增加系统级服务扫描。若需要更深入的运行时探测细节，请使用 `gateway probe`、
  `health --verbose` 或顶层 `status --deep`。

常见 RPC：

- `config.schema.lookup`（检查一个配置子树，包含浅层 schema 节点、匹配到的提示元数据以及直接子项摘要）
- `config.get`（读取当前配置快照 + hash）
- `config.set`（验证并写入完整配置；使用 `baseHash` 可实现乐观并发控制）
- `config.apply`（验证 + 写入配置 + 重启 + 唤醒）
- `config.patch`（合并部分更新 + 重启 + 唤醒）
- `update.run`（执行更新 + 重启 + 唤醒）

提示：当直接调用 `config.set`/`config.apply`/`config.patch` 时，如果配置已存在，请传入来自
`config.get` 的 `baseHash`。
提示：对于部分编辑，请先用 `config.schema.lookup` 检查，并优先使用 `config.patch`。
提示：这些配置写入 RPC 会对提交配置负载中的活跃 SecretRef 解析进行预检，并在有效活跃的已提交引用未解析时拒绝写入。
提示：仅 owner 可用的 `gateway` 运行时工具仍拒绝重写 `tools.exec.ask` 或 `tools.exec.security`；旧版 `tools.bash.*` 别名会标准化到相同的受保护 exec 路径。

## 模型

有关回退行为和扫描策略，请参见 [/concepts/models](/concepts/models)。

计费说明：Anthropic 的公开 Claude Code 文档仍将直接在终端中使用 Claude
Code 计入 Claude 套餐限额。另据 Anthropic 于 **2026 年 4 月 4 日太平洋时间中午 12:00 / 英国夏令时晚上 8:00**
通知 OpenClaw 用户，**OpenClaw**
Claude 登录路径会被计为第三方 harness 使用，并且需要单独于订阅之外计费的 **Extra Usage**。对于
生产用途，优先选择 Anthropic API key 或其他受支持的
订阅式 provider，例如 OpenAI Codex、Alibaba Cloud Model Studio
Coding Plan、MiniMax Coding Plan，或 Z.AI / GLM Coding Plan。

Anthropic Claude CLI 迁移：

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

新手引导快捷方式：`openclaw onboard --auth-choice anthropic-cli`

Anthropic setup-token 也再次可作为旧版/手动认证路径使用。
仅在你了解 Anthropic 已告知 OpenClaw 用户该
OpenClaw Claude 登录路径需要 **Extra Usage** 的前提下使用它。

旧别名说明：`claude-cli` 是已弃用的新手引导 auth-choice 别名。
新手引导请使用 `anthropic-cli`，或直接使用 `models auth login`。

### `models`（根）

`openclaw models` 是 `models status` 的别名。

根选项：

- `--status-json`（`models status --json` 的别名）
- `--status-plain`（`models status --plain` 的别名）

### `models list`

选项：

- `--all`
- `--local`
- `--provider <name>`
- `--json`
- `--plain`

### `models status`

选项：

- `--json`
- `--plain`
- `--check`（退出码：1=已过期/缺失，2=即将过期）
- `--probe`（对已配置 auth 配置文件执行实时探测）
- `--probe-provider <name>`
- `--probe-profile <id>`（可重复或逗号分隔）
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>`

始终包含 auth 概览以及 auth 存储中配置文件的 OAuth 到期状态。
`--probe` 会运行实时请求（可能消耗令牌并触发速率限制）。
Probe 行可以来自 auth 配置文件、环境凭证或 `models.json`。
预期 probe 状态包括 `ok`、`auth`、`rate_limit`、`billing`、`timeout`、
`format`、`unknown` 和 `no_model`。
当显式 `auth.order.<provider>` 省略了某个已存储配置文件时，probe 会报告
`excluded_by_auth_order`，而不是静默尝试该配置文件。

### `models set <model>`

设置 `agents.defaults.model.primary`。

### `models set-image <model>`

设置 `agents.defaults.imageModel.primary`。

### `models aliases list|add|remove`

选项：

- `list`：`--json`, `--plain`
- `add <alias> <model>`
- `remove <alias>`

### `models fallbacks list|add|remove|clear`

选项：

- `list`：`--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models image-fallbacks list|add|remove|clear`

选项：

- `list`：`--json`, `--plain`
- `add <model>`
- `remove <model>`
- `clear`

### `models scan`

选项：

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

选项：

- `add`：交互式认证辅助工具（provider 认证流程或粘贴令牌）
- `login`：`--provider <name>`, `--method <method>`, `--set-default`
- `login-github-copilot`：GitHub Copilot OAuth 登录流程（`--yes`）
- `setup-token`：`--provider <name>`, `--yes`
- `paste-token`：`--provider <name>`, `--profile-id <id>`, `--expires-in <duration>`

说明：

- `setup-token` 和 `paste-token` 是面向提供令牌认证方法的 provider 的通用令牌命令。
- `setup-token` 需要交互式 TTY，并运行该 provider 的令牌认证方法。
- `paste-token` 会提示输入令牌值；当省略 `--profile-id` 时，默认 auth 配置文件 id 为 `<provider>:manual`。
- Anthropic `setup-token` / `paste-token` 再次作为 OpenClaw 的旧版/手动路径提供。Anthropic 已告知 OpenClaw 用户，这一路径需要 Claude 账户的 **Extra Usage**。

### `models auth order get|set|clear`

选项：

- `get`：`--provider <name>`, `--agent <id>`, `--json`
- `set`：`--provider <name>`, `--agent <id>`, `<profileIds...>`
- `clear`：`--provider <name>`, `--agent <id>`

## 系统

### `system event`

将一个系统事件加入队列，并可选择触发 heartbeat（Gateway 网关 RPC）。

必需：

- `--text <text>`

选项：

- `--mode <now|next-heartbeat>`
- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system heartbeat last|enable|disable`

Heartbeat 控制（Gateway 网关 RPC）。

选项：

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

### `system presence`

列出系统 presence 条目（Gateway 网关 RPC）。

选项：

- `--json`
- `--url`, `--token`, `--timeout`, `--expect-final`

## Cron

管理定时任务（Gateway 网关 RPC）。参见 [/automation/cron-jobs](/automation/cron-jobs)。

子命令：

- `cron status [--json]`
- `cron list [--all] [--json]`（默认输出表格；原始输出请使用 `--json`）
- `cron add`（别名：`create`；要求 `--name`，且 `--at` | `--every` | `--cron` 中恰好一个，以及 `--system-event` | `--message` 中恰好一个负载）
- `cron edit <id>`（修补字段）
- `cron rm <id>`（别名：`remove`, `delete`）
- `cron enable <id>`
- `cron disable <id>`
- `cron runs --id <id> [--limit <n>]`
- `cron run <id> [--due]`

所有 `cron` 命令都接受 `--url`、`--token`、`--timeout`、`--expect-final`。

`cron add|edit --model ...` 会为该任务使用所选且被允许的模型。如果
该模型不被允许，cron 会发出警告，并回退到任务的智能体/默认
模型选择。已配置的回退链仍然适用，但仅使用普通
模型覆盖且没有显式的每任务回退列表时，不会再把
智能体主模型作为隐藏的额外重试目标附加进去。

## 节点主机

### `node`

`node` 运行一个**无头节点主机**，或将其作为后台服务进行管理。参见
[`openclaw node`](/cli/node)。

子命令：

- `node run --host <gateway-host> --port 18789`
- `node status`
- `node install [--host <gateway-host>] [--port <port>] [--tls] [--tls-fingerprint <sha256>] [--node-id <id>] [--display-name <name>] [--runtime <node|bun>] [--force]`
- `node uninstall`
- `node stop`
- `node restart`

认证说明：

- `node` 从环境/配置解析 gateway 认证（无 `--token`/`--password` 标志）：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`，然后是 `gateway.auth.*`。在本地模式下，节点主机会有意忽略 `gateway.remote.*`；在 `gateway.mode=remote` 时，`gateway.remote.*` 会按远程优先级规则参与解析。
- 节点主机认证解析仅识别 `OPENCLAW_GATEWAY_*` 环境变量。

## 节点

`nodes` 与 Gateway 网关通信，并以已配对节点为目标。参见 [/nodes](/nodes)。

常用选项：

- `--url`, `--token`, `--timeout`, `--json`

子命令：

- `nodes status [--connected] [--last-connected <duration>]`
- `nodes describe --node <id|name|ip>`
- `nodes list [--connected] [--last-connected <duration>]`
- `nodes pending`
- `nodes approve <requestId>`
- `nodes reject <requestId>`
- `nodes rename --node <id|name|ip> --name <displayName>`
- `nodes invoke --node <id|name|ip> --command <command> [--params <json>] [--invoke-timeout <ms>] [--idempotency-key <key>]`
- `nodes notify --node <id|name|ip> [--title <text>] [--body <text>] [--sound <name>] [--priority <passive|active|timeSensitive>] [--delivery <system|overlay|auto>] [--invoke-timeout <ms>]`（仅 mac）

相机：

- `nodes camera list --node <id|name|ip>`
- `nodes camera snap --node <id|name|ip> [--facing front|back|both] [--device-id <id>] [--max-width <px>] [--quality <0-1>] [--delay-ms <ms>] [--invoke-timeout <ms>]`
- `nodes camera clip --node <id|name|ip> [--facing front|back] [--device-id <id>] [--duration <ms|10s|1m>] [--no-audio] [--invoke-timeout <ms>]`

Canvas + 屏幕：

- `nodes canvas snapshot --node <id|name|ip> [--format png|jpg|jpeg] [--max-width <px>] [--quality <0-1>] [--invoke-timeout <ms>]`
- `nodes canvas present --node <id|name|ip> [--target <urlOrPath>] [--x <px>] [--y <px>] [--width <px>] [--height <px>] [--invoke-timeout <ms>]`
- `nodes canvas hide --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas navigate <url> --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes canvas eval [<js>] --node <id|name|ip> [--js <code>] [--invoke-timeout <ms>]`
- `nodes canvas a2ui push --node <id|name|ip> (--jsonl <path> | --text <text>) [--invoke-timeout <ms>]`
- `nodes canvas a2ui reset --node <id|name|ip> [--invoke-timeout <ms>]`
- `nodes screen record --node <id|name|ip> [--screen <index>] [--duration <ms|10s>] [--fps <n>] [--no-audio] [--out <path>] [--invoke-timeout <ms>]`

位置：

- `nodes location get --node <id|name|ip> [--max-age <ms>] [--accuracy <coarse|balanced|precise>] [--location-timeout <ms>] [--invoke-timeout <ms>]`

## 浏览器

浏览器控制 CLI（专用 Chrome/Brave/Edge/Chromium）。参见 [`openclaw browser`](/cli/browser) 和 [Browser tool](/tools/browser)。

常用选项：

- `--url`, `--token`, `--timeout`, `--expect-final`, `--json`
- `--browser-profile <name>`

管理：

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

检查：

- `browser screenshot [targetId] [--full-page] [--ref <ref>] [--element <selector>] [--type png|jpeg]`
- `browser snapshot [--format aria|ai] [--target-id <id>] [--limit <n>] [--interactive] [--compact] [--depth <n>] [--selector <sel>] [--out <path>]`

操作：

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

## 语音通话

### `voicecall`

由插件提供的语音通话辅助工具。仅当语音通话插件已安装并启用时才会出现。参见 [`openclaw voicecall`](/cli/voicecall)。

常用命令：

- `voicecall call --to <phone> --message <text> [--mode notify|conversation]`
- `voicecall start --to <phone> [--message <text>] [--mode notify|conversation]`
- `voicecall continue --call-id <id> --message <text>`
- `voicecall speak --call-id <id> --message <text>`
- `voicecall end --call-id <id>`
- `voicecall status --call-id <id>`
- `voicecall tail [--file <path>] [--since <n>] [--poll <ms>]`
- `voicecall latency [--file <path>] [--last <n>]`
- `voicecall expose [--mode off|serve|funnel] [--path <path>] [--port <port>] [--serve-path <path>]`

## 文档搜索

### `docs`

搜索实时 OpenClaw 文档索引。

### `docs [query...]`

搜索实时文档索引。

## TUI

### `tui`

打开连接到 Gateway 网关的终端 UI。

选项：

- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--session <key>`
- `--deliver`
- `--thinking <level>`
- `--message <text>`
- `--timeout-ms <ms>`（默认 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`

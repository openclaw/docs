---
read_when:
    - 找到合适的 `openclaw` 子命令
    - 查找全局标志或输出样式规则
summary: OpenClaw CLI 索引：命令列表、全局标志，以及各命令页面链接
title: CLI 参考
x-i18n:
    generated_at: "2026-07-06T21:47:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2854be61e3a0823792690ffdd1b147afe5b7cd89d9dc6e262e2c1ad7a86b455
    source_path: cli/index.md
    workflow: 16
---

`openclaw` 是主要的 CLI 入口点。每个核心命令都有专门的
参考页面，或与其别名命令一起记录；此索引列出
适用于整个 CLI 的命令、全局标志和输出样式规则。

按意图划分的设置命令：

- `openclaw setup` 和 `openclaw onboard` 运行完整的首次引导流程，涵盖 Gateway 网关、模型凭证、工作区、渠道、Skills 和健康检查。
- `openclaw setup --baseline` 会创建基线配置和工作区，而不进入引导式新手引导流程。
- `openclaw configure` 会更改现有设置中的目标部分：模型凭证、Gateway 网关、渠道、插件或 Skills。
- `openclaw channels add` 会在基线存在后配置渠道账号；不带标志运行可进入引导式设置，或带上渠道专用标志用于脚本。

## 命令页面

| 领域                         | 命令                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 设置和新手引导         | [`crestodian`](/zh-CN/cli/crestodian) · [`setup`](/zh-CN/cli/setup) · [`onboard`](/zh-CN/cli/onboard) · [`configure`](/zh-CN/cli/configure) · [`config`](/zh-CN/cli/config) · [`completion`](/zh-CN/cli/completion) · [`doctor`](/zh-CN/cli/doctor) · [`dashboard`](/zh-CN/cli/dashboard) |
| 重置、备份和迁移 | [`backup`](/zh-CN/cli/backup) · [`migrate`](/zh-CN/cli/migrate) · [`reset`](/zh-CN/cli/reset) · [`uninstall`](/zh-CN/cli/uninstall) · [`update`](/zh-CN/cli/update)                                                                                                     |
| 消息和智能体         | [`message`](/zh-CN/cli/message) · [`agent`](/zh-CN/cli/agent) · [`agents`](/zh-CN/cli/agents) · [`attach`](/zh-CN/cli/attach) · [`acp`](/zh-CN/cli/acp) · [`mcp`](/zh-CN/cli/mcp)                                                                                             |
| 健康和会话          | [`status`](/zh-CN/cli/status) · [`health`](/zh-CN/cli/health) · [`sessions`](/zh-CN/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway 网关和日志             | [`gateway`](/zh-CN/cli/gateway) · [`logs`](/zh-CN/cli/logs) · [`system`](/zh-CN/cli/system)                                                                                                                                                                 |
| 模型和推理         | [`models`](/zh-CN/cli/models) · [`infer`](/zh-CN/cli/infer) · `capability`（[`infer`](/zh-CN/cli/infer) 的别名）· [`memory`](/zh-CN/cli/memory) · [`commitments`](/zh-CN/cli/commitments) · [`wiki`](/zh-CN/cli/wiki)                                                      |
| 网络和节点            | [`directory`](/zh-CN/cli/directory) · [`nodes`](/zh-CN/cli/nodes) · [`devices`](/zh-CN/cli/devices) · [`node`](/zh-CN/cli/node)                                                                                                                                   |
| 运行时和沙箱          | [`approvals`](/zh-CN/cli/approvals) · `exec-policy`（参见 [`approvals`](/zh-CN/cli/approvals)）· [`sandbox`](/zh-CN/cli/sandbox) · [`tui`](/zh-CN/cli/tui) · `chat`/`terminal`（[`tui --local`](/zh-CN/cli/tui) 的别名）· [`browser`](/zh-CN/cli/browser)                 |
| 自动化                   | [`cron`](/zh-CN/cli/cron) · [`tasks`](/zh-CN/cli/tasks) · [`hooks`](/zh-CN/cli/hooks) · [`webhooks`](/zh-CN/cli/webhooks) · [`transcripts`](/zh-CN/cli/transcripts)                                                                                                     |
| 设备发现和文档           | [`dns`](/zh-CN/cli/dns) · [`docs`](/zh-CN/cli/docs)                                                                                                                                                                                                   |
| 配对和渠道         | [`pairing`](/zh-CN/cli/pairing) · [`qr`](/zh-CN/cli/qr) · [`channels`](/zh-CN/cli/channels)                                                                                                                                                                 |
| 安全和插件         | [`security`](/zh-CN/cli/security) · [`secrets`](/zh-CN/cli/secrets) · [`skills`](/zh-CN/cli/skills) · [`plugins`](/zh-CN/cli/plugins) · [`proxy`](/zh-CN/cli/proxy)                                                                                                     |
| 旧版别名               | [`daemon`](/zh-CN/cli/daemon)（Gateway 网关服务）· [`clawbot`](/zh-CN/cli/clawbot)（命名空间）                                                                                                                                                         |
| 插件（可选）           | [`path`](/zh-CN/cli/path) · [`policy`](/zh-CN/cli/policy) · [`voicecall`](/zh-CN/cli/voicecall) · [`workboard`](/zh-CN/cli/workboard)（如果已安装）                                                                                                              |

## 全局标志

| 标志                    | 用途                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | 将状态隔离在 `~/.openclaw-dev` 下，默认 Gateway 网关端口为 19001，并偏移派生端口              |
| `--profile <name>`      | 将状态隔离在 `~/.openclaw-<name>` 下（`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`）                  |
| `--container <name>`    | 在名为 `<name>` 的正在运行的 Podman/Docker 容器内运行 CLI（默认值：环境变量 `OPENCLAW_CONTAINER`） |
| `--log-level <level>`   | 覆盖文件和控制台输出的全局日志级别                                                 |
| `--no-color`            | 禁用 ANSI 颜色（也会遵循 `NO_COLOR=1`）                                                    |
| `--update`              | [`openclaw update`](/zh-CN/cli/update) 的简写；同时适用于源码检出和软件包安装    |
| `-V`, `--version`, `-v` | 打印版本并退出                                                                                  |

## 输出模式

- ANSI 颜色和进度指示器只会在 TTY 会话中渲染。
- OSC-8 超链接会在支持的位置渲染为可点击链接；否则
  CLI 会回退为纯 URL。
- `--json`（以及支持位置的 `--plain`）会禁用样式，以便输出干净内容。
- 长时间运行的命令会显示进度指示器（在支持时使用 OSC 9;4）。

## 颜色色板

OpenClaw 对 CLI 输出使用龙虾色板：

| 标记          | 十六进制       | 用于                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | 标题、标签、主要高亮 |
| `accentBright` | `#FF7A3D` | 命令名称、强调              |
| `accentDim`    | `#D14A22` | 次要高亮文本             |
| `info`         | `#FF8A5B` | 信息值                 |
| `success`      | `#2FBF71` | 成功状态                       |
| `warn`         | `#FFB020` | 警告、选项标志、回退    |
| `error`        | `#E23D2D` | 错误、失败                     |
| `muted`        | `#8B7F77` | 弱化显示、元数据                |

色板事实来源：`packages/terminal-core/src/palette.ts`。

## 命令树

<Accordion title="完整命令树">

此映射涵盖核心命令及其主要子命令。插件添加的
子命令（例如 `skills`、`plugins` 和 `wiki` 下的子命令）会独立演进；
运行 `<command> --help` 可查看权威的当前列表。

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

插件可以添加其他顶级命令，例如
[`openclaw workboard`](/zh-CN/cli/workboard) 或 `openclaw voicecall`。

</Accordion>

## 聊天斜杠命令

聊天消息支持 `/...` 命令。参见[斜杠命令](/zh-CN/tools/slash-commands)。

重点：

- `/status` - 快速诊断。
- `/trace` - 会话范围的插件跟踪/调试行。
- `/config` - 持久化配置更改。
- `/debug` - 仅运行时配置覆盖（内存中，不写入磁盘；需要 `commands.debug: true`）。

## 使用量跟踪

当 OAuth/API 凭证可用时，`openclaw status --usage` 和 Control UI 会显示提供商使用量/配额。数据直接来自提供商使用量端点，并标准化为 `X% left`。具有当前使用量窗口的提供商：Anthropic、Gemini CLI、GitHub Copilot、MiniMax、OpenAI Codex、Xiaomi 和 z.ai。

详见[使用量跟踪](/zh-CN/concepts/usage-tracking)。

## 相关

- [斜杠命令](/zh-CN/tools/slash-commands)
- [配置](/zh-CN/gateway/configuration)
- [环境](/zh-CN/help/environment)

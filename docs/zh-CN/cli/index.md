---
read_when:
    - 找到合适的 `openclaw` 子命令
    - 查找全局标志或输出样式规则
summary: OpenClaw CLI 索引：命令列表、全局标志，以及指向各命令页面的链接
title: CLI 参考
x-i18n:
    generated_at: "2026-04-29T21:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` 是主要的 CLI 入口点。每个核心命令都有专门的参考页面，或与其别名对应的命令一起记录；此索引列出命令、全局标志，以及适用于整个 CLI 的输出样式规则。

## 命令页面

| 区域                 | 命令                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 设置和新手引导 | [`crestodian`](/zh-CN/cli/crestodian) · [`setup`](/zh-CN/cli/setup) · [`onboard`](/zh-CN/cli/onboard) · [`configure`](/zh-CN/cli/configure) · [`config`](/zh-CN/cli/config) · [`completion`](/zh-CN/cli/completion) · [`doctor`](/zh-CN/cli/doctor) · [`dashboard`](/zh-CN/cli/dashboard) |
| 重置和卸载  | [`backup`](/zh-CN/cli/backup) · [`reset`](/zh-CN/cli/reset) · [`uninstall`](/zh-CN/cli/uninstall) · [`update`](/zh-CN/cli/update)                                                                                                                                 |
| 消息和智能体 | [`message`](/zh-CN/cli/message) · [`agent`](/zh-CN/cli/agent) · [`agents`](/zh-CN/cli/agents) · [`acp`](/zh-CN/cli/acp) · [`mcp`](/zh-CN/cli/mcp)                                                                                                                       |
| 健康状态和会话  | [`status`](/zh-CN/cli/status) · [`health`](/zh-CN/cli/health) · [`sessions`](/zh-CN/cli/sessions)                                                                                                                                                           |
| Gateway 网关和日志     | [`gateway`](/zh-CN/cli/gateway) · [`logs`](/zh-CN/cli/logs) · [`system`](/zh-CN/cli/system)                                                                                                                                                                 |
| 模型和推理 | [`models`](/zh-CN/cli/models) · [`infer`](/zh-CN/cli/infer) · `capability`（[`infer`](/zh-CN/cli/infer) 的别名） · [`memory`](/zh-CN/cli/memory) · [`commitments`](/zh-CN/cli/commitments) · [`wiki`](/zh-CN/cli/wiki)                                                      |
| 网络和节点    | [`directory`](/zh-CN/cli/directory) · [`nodes`](/zh-CN/cli/nodes) · [`devices`](/zh-CN/cli/devices) · [`node`](/zh-CN/cli/node)                                                                                                                                   |
| 运行时和沙箱  | [`approvals`](/zh-CN/cli/approvals) · `exec-policy`（见 [`approvals`](/zh-CN/cli/approvals)） · [`sandbox`](/zh-CN/cli/sandbox) · [`tui`](/zh-CN/cli/tui) · `chat`/`terminal`（[`tui --local`](/zh-CN/cli/tui) 的别名） · [`browser`](/zh-CN/cli/browser)                 |
| 自动化           | [`cron`](/zh-CN/cli/cron) · [`tasks`](/zh-CN/cli/tasks) · [`hooks`](/zh-CN/cli/hooks) · [`webhooks`](/zh-CN/cli/webhooks)                                                                                                                                         |
| 设备发现和文档   | [`dns`](/zh-CN/cli/dns) · [`docs`](/zh-CN/cli/docs)                                                                                                                                                                                                   |
| 配对和渠道 | [`pairing`](/zh-CN/cli/pairing) · [`qr`](/zh-CN/cli/qr) · [`channels`](/zh-CN/cli/channels)                                                                                                                                                                 |
| 安全和插件 | [`security`](/zh-CN/cli/security) · [`secrets`](/zh-CN/cli/secrets) · [`skills`](/zh-CN/cli/skills) · [`plugins`](/zh-CN/cli/plugins) · [`proxy`](/zh-CN/cli/proxy)                                                                                                     |
| 旧版别名       | [`daemon`](/zh-CN/cli/daemon)（Gateway 网关服务） · [`clawbot`](/zh-CN/cli/clawbot)（命名空间）                                                                                                                                                         |
| 插件（可选）   | [`voicecall`](/zh-CN/cli/voicecall)（如果已安装）                                                                                                                                                                                              |

## 全局标志

| 标志                    | 用途                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | 将状态隔离在 `~/.openclaw-dev` 下并偏移默认端口         |
| `--profile <name>`      | 将状态隔离在 `~/.openclaw-<name>` 下                              |
| `--container <name>`    | 指定用于执行的命名容器                                |
| `--no-color`            | 禁用 ANSI 颜色（也会遵循 `NO_COLOR=1`）                  |
| `--update`              | [`openclaw update`](/zh-CN/cli/update) 的简写（仅适用于源码安装） |
| `-V`, `--version`, `-v` | 打印版本并退出                                                |

## 输出模式

- ANSI 颜色和进度指示器仅在 TTY 会话中渲染。
- 在受支持的位置，OSC-8 超链接会渲染为可点击链接；否则 CLI 会回退为纯 URL。
- `--json`（以及受支持位置的 `--plain`）会禁用样式，以便输出干净内容。
- 长时间运行的命令会显示进度指示器（受支持时使用 OSC 9;4）。

调色板事实来源：`src/terminal/palette.ts`。

## 命令树

<Accordion title="Full command tree">

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

插件可以添加额外的顶层命令（例如 `openclaw voicecall`）。

</Accordion>

## 聊天斜杠命令

聊天消息支持 `/...` 命令。参见[斜杠命令](/zh-CN/tools/slash-commands)。

要点：

- `/status` — 快速诊断。
- `/trace` — 会话范围的插件跟踪/调试行。
- `/config` — 持久化的配置更改。
- `/debug` — 仅运行时的配置覆盖（内存中，不写入磁盘；需要 `commands.debug: true`）。

## 用量跟踪

当 OAuth/API 凭证可用时，`openclaw status --usage` 和 Control UI 会显示提供商用量/配额。数据直接来自提供商用量端点，并归一化为 `X% left`。当前具有用量窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

详情参见[用量跟踪](/zh-CN/concepts/usage-tracking)。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [配置](/zh-CN/gateway/configuration)
- [环境](/zh-CN/help/environment)

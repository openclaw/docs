---
read_when:
    - 尋找合適的 `openclaw` 子命令
    - 查閱全域旗標或輸出樣式規則
summary: OpenClaw CLI 索引：命令清單、全域旗標，以及各命令頁面的連結
title: CLI 參考
x-i18n:
    generated_at: "2026-04-30T02:53:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` 是主要的 CLI 進入點。每個核心命令都有專屬的參考頁面，或與其別名對應的命令一併記錄；此索引列出命令、全域旗標，以及套用於整個 CLI 的輸出樣式規則。

## 命令頁面

| 區域                 | 命令                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定與入門           | [`crestodian`](/zh-TW/cli/crestodian) · [`setup`](/zh-TW/cli/setup) · [`onboard`](/zh-TW/cli/onboard) · [`configure`](/zh-TW/cli/configure) · [`config`](/zh-TW/cli/config) · [`completion`](/zh-TW/cli/completion) · [`doctor`](/zh-TW/cli/doctor) · [`dashboard`](/zh-TW/cli/dashboard) |
| 重設與解除安裝       | [`backup`](/zh-TW/cli/backup) · [`reset`](/zh-TW/cli/reset) · [`uninstall`](/zh-TW/cli/uninstall) · [`update`](/zh-TW/cli/update)                                                                                                                                 |
| 訊息與代理           | [`message`](/zh-TW/cli/message) · [`agent`](/zh-TW/cli/agent) · [`agents`](/zh-TW/cli/agents) · [`acp`](/zh-TW/cli/acp) · [`mcp`](/zh-TW/cli/mcp)                                                                                                                       |
| 健康狀態與工作階段   | [`status`](/zh-TW/cli/status) · [`health`](/zh-TW/cli/health) · [`sessions`](/zh-TW/cli/sessions)                                                                                                                                                           |
| Gateway 與日誌       | [`gateway`](/zh-TW/cli/gateway) · [`logs`](/zh-TW/cli/logs) · [`system`](/zh-TW/cli/system)                                                                                                                                                                 |
| 模型與推論           | [`models`](/zh-TW/cli/models) · [`infer`](/zh-TW/cli/infer) · `capability`（[`infer`](/zh-TW/cli/infer) 的別名）· [`memory`](/zh-TW/cli/memory) · [`commitments`](/zh-TW/cli/commitments) · [`wiki`](/zh-TW/cli/wiki)                                                        |
| 網路與節點           | [`directory`](/zh-TW/cli/directory) · [`nodes`](/zh-TW/cli/nodes) · [`devices`](/zh-TW/cli/devices) · [`node`](/zh-TW/cli/node)                                                                                                                                   |
| 執行階段與沙箱       | [`approvals`](/zh-TW/cli/approvals) · `exec-policy`（請參閱 [`approvals`](/zh-TW/cli/approvals)）· [`sandbox`](/zh-TW/cli/sandbox) · [`tui`](/zh-TW/cli/tui) · `chat`/`terminal`（[`tui --local`](/zh-TW/cli/tui) 的別名）· [`browser`](/zh-TW/cli/browser)                  |
| 自動化               | [`cron`](/zh-TW/cli/cron) · [`tasks`](/zh-TW/cli/tasks) · [`hooks`](/zh-TW/cli/hooks) · [`webhooks`](/zh-TW/cli/webhooks)                                                                                                                                         |
| 探索與文件           | [`dns`](/zh-TW/cli/dns) · [`docs`](/zh-TW/cli/docs)                                                                                                                                                                                                   |
| 配對與通道           | [`pairing`](/zh-TW/cli/pairing) · [`qr`](/zh-TW/cli/qr) · [`channels`](/zh-TW/cli/channels)                                                                                                                                                                 |
| 安全性與 Plugin      | [`security`](/zh-TW/cli/security) · [`secrets`](/zh-TW/cli/secrets) · [`skills`](/zh-TW/cli/skills) · [`plugins`](/zh-TW/cli/plugins) · [`proxy`](/zh-TW/cli/proxy)                                                                                                     |
| 舊版別名             | [`daemon`](/zh-TW/cli/daemon)（Gateway 服務）· [`clawbot`](/zh-TW/cli/clawbot)（命名空間）                                                                                                                                                            |
| Plugin（選用）       | [`voicecall`](/zh-TW/cli/voicecall)（若已安裝）                                                                                                                                                                                                 |

## 全域旗標

| 旗標                    | 用途                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | 將狀態隔離在 `~/.openclaw-dev` 下，並轉移預設連接埠                 |
| `--profile <name>`      | 將狀態隔離在 `~/.openclaw-<name>` 下                                 |
| `--container <name>`    | 以具名容器作為執行目標                                                |
| `--no-color`            | 停用 ANSI 色彩（也會遵循 `NO_COLOR=1`）                               |
| `--update`              | [`openclaw update`](/zh-TW/cli/update) 的簡寫（僅限原始碼安裝）             |
| `-V`, `--version`, `-v` | 列印版本並結束                                                        |

## 輸出模式

- ANSI 色彩與進度指示器只會在 TTY 工作階段中呈現。
- 支援時，OSC-8 超連結會呈現為可點擊連結；否則 CLI 會退回純文字 URL。
- `--json`（以及支援處的 `--plain`）會停用樣式，以產生乾淨輸出。
- 長時間執行的命令會顯示進度指示器（支援時使用 OSC 9;4）。

調色盤的唯一真實來源：`src/terminal/palette.ts`。

## 命令樹

<Accordion title="完整命令樹">

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

Plugin 可以新增其他頂層命令（例如 `openclaw voicecall`）。

</Accordion>

## 聊天斜線命令

聊天訊息支援 `/...` 命令。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

重點：

- `/status` — 快速診斷。
- `/trace` — 工作階段範圍的 Plugin 追蹤/偵錯列。
- `/config` — 持久化的設定變更。
- `/debug` — 僅限執行階段的設定覆寫（記憶體，而非磁碟；需要 `commands.debug: true`）。

## 使用量追蹤

當 OAuth/API 憑證可用時，`openclaw status --usage` 與 Control UI 會顯示供應商使用量/配額。資料直接來自供應商使用量端點，並正規化為 `X% left`。目前有使用量視窗的供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 與 z.ai。

詳情請參閱[使用量追蹤](/zh-TW/concepts/usage-tracking)。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [設定](/zh-TW/gateway/configuration)
- [環境](/zh-TW/help/environment)

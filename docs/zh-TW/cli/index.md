---
read_when:
    - 尋找正確的 `openclaw` 子命令
    - 查詢全域旗標或輸出樣式規則
summary: OpenClaw 命令列介面索引：命令清單、全域旗標，以及各命令頁面的連結
title: 命令列介面參考
x-i18n:
    generated_at: "2026-07-02T00:43:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw` 是主要的命令列介面進入點。每個核心命令都有專用的參考頁面，或與其別名所指向的命令一起記錄；此索引列出命令、全域旗標，以及適用於整個命令列介面的輸出樣式規則。

依照意圖使用設定命令：

- `openclaw setup` 和 `openclaw onboard` 會執行完整的引導式首次啟動流程，涵蓋閘道、模型驗證、工作區、頻道、Skills 和健康狀態。
- `openclaw setup --baseline` 會建立基準設定與工作區，而不進入引導式初始設定流程。
- `openclaw configure` 會變更既有設定中的特定部分，例如模型驗證、閘道、頻道、外掛或 Skills。
- `openclaw channels add` 會在基準設定存在後設定頻道帳號；不帶旗標執行可進入引導式頻道設定，或搭配頻道專用旗標供指令碼使用。

## 命令頁面

| 領域                 | 命令                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定與初始設定 | [`crestodian`](/zh-TW/cli/crestodian) · [`setup`](/zh-TW/cli/setup) · [`onboard`](/zh-TW/cli/onboard) · [`configure`](/zh-TW/cli/configure) · [`config`](/zh-TW/cli/config) · [`completion`](/zh-TW/cli/completion) · [`doctor`](/zh-TW/cli/doctor) · [`dashboard`](/zh-TW/cli/dashboard) |
| 重設與解除安裝  | [`backup`](/zh-TW/cli/backup) · [`reset`](/zh-TW/cli/reset) · [`uninstall`](/zh-TW/cli/uninstall) · [`update`](/zh-TW/cli/update)                                                                                                                                 |
| 訊息與代理 | [`message`](/zh-TW/cli/message) · [`agent`](/zh-TW/cli/agent) · [`agents`](/zh-TW/cli/agents) · [`attach`](/cli/attach) · [`acp`](/zh-TW/cli/acp) · [`mcp`](/zh-TW/cli/mcp)                                                                                             |
| 健康狀態與工作階段  | [`status`](/zh-TW/cli/status) · [`health`](/zh-TW/cli/health) · [`sessions`](/zh-TW/cli/sessions)                                                                                                                                                           |
| 閘道與日誌     | [`gateway`](/zh-TW/cli/gateway) · [`logs`](/zh-TW/cli/logs) · [`system`](/zh-TW/cli/system)                                                                                                                                                                 |
| 模型與推論 | [`models`](/zh-TW/cli/models) · [`infer`](/zh-TW/cli/infer) · `capability`（[`infer`](/zh-TW/cli/infer) 的別名） · [`memory`](/zh-TW/cli/memory) · [`commitments`](/zh-TW/cli/commitments) · [`wiki`](/zh-TW/cli/wiki)                                                      |
| 網路與節點    | [`directory`](/zh-TW/cli/directory) · [`nodes`](/zh-TW/cli/nodes) · [`devices`](/zh-TW/cli/devices) · [`node`](/zh-TW/cli/node)                                                                                                                                   |
| 執行階段與沙箱  | [`approvals`](/zh-TW/cli/approvals) · `exec-policy`（參見 [`approvals`](/zh-TW/cli/approvals)） · [`sandbox`](/zh-TW/cli/sandbox) · [`tui`](/zh-TW/cli/tui) · `chat`/`terminal`（[`tui --local`](/zh-TW/cli/tui) 的別名） · [`browser`](/zh-TW/cli/browser)                 |
| 自動化           | [`cron`](/zh-TW/cli/cron) · [`tasks`](/zh-TW/cli/tasks) · [`hooks`](/zh-TW/cli/hooks) · [`webhooks`](/zh-TW/cli/webhooks) · [`transcripts`](/zh-TW/cli/transcripts)                                                                                                     |
| 探索與文件   | [`dns`](/zh-TW/cli/dns) · [`docs`](/zh-TW/cli/docs)                                                                                                                                                                                                   |
| 配對與頻道 | [`pairing`](/zh-TW/cli/pairing) · [`qr`](/zh-TW/cli/qr) · [`channels`](/zh-TW/cli/channels)                                                                                                                                                                 |
| 安全性與外掛 | [`security`](/zh-TW/cli/security) · [`secrets`](/zh-TW/cli/secrets) · [`skills`](/zh-TW/cli/skills) · [`plugins`](/zh-TW/cli/plugins) · [`proxy`](/zh-TW/cli/proxy)                                                                                                     |
| 舊版別名       | [`daemon`](/zh-TW/cli/daemon)（閘道服務） · [`clawbot`](/zh-TW/cli/clawbot)（命名空間）                                                                                                                                                         |
| 外掛（選用）   | [`path`](/zh-TW/cli/path) · [`policy`](/zh-TW/cli/policy) · [`voicecall`](/zh-TW/cli/voicecall) · [`workboard`](/zh-TW/cli/workboard)（若已安裝）                                                                                                              |

## 全域旗標

| 旗標                    | 用途                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | 將狀態隔離在 `~/.openclaw-dev` 下，並偏移預設連接埠         |
| `--profile <name>`      | 將狀態隔離在 `~/.openclaw-<name>` 下                              |
| `--container <name>`    | 指定要用於執行的具名容器                                |
| `--no-color`            | 停用 ANSI 色彩（也會遵循 `NO_COLOR=1`）                  |
| `--update`              | [`openclaw update`](/zh-TW/cli/update) 的簡寫（僅限原始碼安裝） |
| `-V`, `--version`, `-v` | 列印版本並結束                                                |

## 輸出模式

- ANSI 色彩與進度指示器只會在 TTY 工作階段中呈現。
- OSC-8 超連結會在支援處呈現為可點擊連結；否則命令列介面會退回純文字 URL。
- `--json`（以及支援處的 `--plain`）會停用樣式，以產生乾淨輸出。
- 長時間執行的命令會顯示進度指示器（支援時使用 OSC 9;4）。

調色盤的唯一事實來源：`src/terminal/palette.ts`。

## 命令樹

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

外掛可以新增其他頂層命令，例如 [`openclaw workboard`](/zh-TW/cli/workboard) 或 `openclaw voicecall`。

</Accordion>

## 聊天斜線命令

聊天訊息支援 `/...` 命令。參見[斜線命令](/zh-TW/tools/slash-commands)。

重點：

- `/status` — 快速診斷。
- `/trace` — 工作階段範圍的外掛追蹤/除錯行。
- `/config` — 持久化的設定變更。
- `/debug` — 僅限執行階段的設定覆寫（記憶體，而非磁碟；需要 `commands.debug: true`）。

## 使用量追蹤

當 OAuth/API 憑證可用時，`openclaw status --usage` 和 Control UI 會顯示供應商使用量/配額。資料直接來自供應商使用量端點，並正規化為 `X% left`。目前具備使用量視窗的供應商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。

詳情請參見[使用量追蹤](/zh-TW/concepts/usage-tracking)。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [設定](/zh-TW/gateway/configuration)
- [環境](/zh-TW/help/environment)

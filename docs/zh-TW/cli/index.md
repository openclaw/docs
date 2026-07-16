---
read_when:
    - 尋找正確的 `openclaw` 子命令
    - 查詢全域旗標或輸出樣式規則
summary: OpenClaw 命令列介面索引：命令清單、全域旗標，以及各命令頁面的連結
title: 命令列介面參考資料
x-i18n:
    generated_at: "2026-07-16T11:33:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` 是主要的命令列介面進入點。每個核心命令都有專屬的
參考頁面，或與其別名所對應的命令一併記錄；本索引列出適用於整個命令列介面的
命令、全域旗標與輸出樣式規則。

依用途分類的設定命令：

- `openclaw setup` 和 `openclaw onboard` 會先驗證推論，接著啟動 OpenClaw，以設定閘道、工作區、頻道、Skills 與健康狀態。
- `openclaw setup --baseline` 會建立基準設定與工作區，而不執行引導式上線流程。
- `openclaw configure` 會變更現有設定的特定部分：模型驗證、閘道、頻道、外掛或 Skills。
- `openclaw channels add` 會在基準設定已存在後設定頻道帳號；不加旗標即可進行引導式設定，或搭配頻道專屬旗標用於指令碼。

## 命令頁面

| 區域                         | 命令                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 設定與上線         | [`openclaw`](/zh-TW/cli/openclaw) · [`setup`](/zh-TW/cli/setup) · [`onboard`](/zh-TW/cli/onboard) · [`configure`](/zh-TW/cli/configure) · [`config`](/zh-TW/cli/config) · [`completion`](/zh-TW/cli/completion) · [`doctor`](/zh-TW/cli/doctor) · [`dashboard`](/zh-TW/cli/dashboard) |
| 重設、備份與移轉 | [`backup`](/zh-TW/cli/backup) · [`migrate`](/zh-TW/cli/migrate) · [`reset`](/zh-TW/cli/reset) · [`uninstall`](/zh-TW/cli/uninstall) · [`update`](/zh-TW/cli/update)                                                                                                 |
| 訊息與代理程式         | [`message`](/zh-TW/cli/message) · [`agent`](/zh-TW/cli/agent) · [`agents`](/zh-TW/cli/agents) · [`attach`](/zh-TW/cli/attach) · [`acp`](/zh-TW/cli/acp) · [`mcp`](/zh-TW/cli/mcp)                                                                                         |
| 健康狀態與工作階段          | [`status`](/zh-TW/cli/status) · [`health`](/zh-TW/cli/health) · [`sessions`](/zh-TW/cli/sessions) · [`audit`](/zh-TW/cli/audit)                                                                                                                               |
| 閘道與記錄             | [`gateway`](/zh-TW/cli/gateway) · [`logs`](/zh-TW/cli/logs) · [`system`](/zh-TW/cli/system)                                                                                                                                                             |
| 模型與推論         | [`models`](/zh-TW/cli/models) · [`promos`](/zh-TW/cli/promos) · [`infer`](/zh-TW/cli/infer) · `capability`（[`infer`](/zh-TW/cli/infer) 的別名）· [`memory`](/zh-TW/cli/memory) · [`commitments`](/zh-TW/cli/commitments) · [`wiki`](/zh-TW/cli/wiki)                        |
| 網路與節點            | [`directory`](/zh-TW/cli/directory) · [`nodes`](/zh-TW/cli/nodes) · [`devices`](/zh-TW/cli/devices) · [`node`](/zh-TW/cli/node) · [`worker`](/zh-TW/cli/worker)                                                                                                     |
| 執行階段與沙箱          | [`approvals`](/zh-TW/cli/approvals) · `exec-policy`（請參閱 [`approvals`](/zh-TW/cli/approvals)）· [`sandbox`](/zh-TW/cli/sandbox) · [`tui`](/zh-TW/cli/tui) · `chat`/`terminal`（[`tui --local`](/zh-TW/cli/tui) 的別名）· [`browser`](/zh-TW/cli/browser)             |
| 自動化                   | [`cron`](/zh-TW/cli/cron) · [`tasks`](/zh-TW/cli/tasks) · [`hooks`](/zh-TW/cli/hooks) · [`webhooks`](/zh-TW/cli/webhooks) · [`transcripts`](/zh-TW/cli/transcripts)                                                                                                 |
| 探索與文件           | [`dns`](/zh-TW/cli/dns) · [`docs`](/zh-TW/cli/docs)                                                                                                                                                                                               |
| 配對與頻道         | [`pairing`](/zh-TW/cli/pairing) · [`qr`](/zh-TW/cli/qr) · [`channels`](/zh-TW/cli/channels)                                                                                                                                                             |
| 安全性與外掛         | [`security`](/zh-TW/cli/security) · [`secrets`](/zh-TW/cli/secrets) · [`skills`](/zh-TW/cli/skills) · [`plugins`](/zh-TW/cli/plugins) · [`proxy`](/zh-TW/cli/proxy)                                                                                                 |
| 舊版別名               | [`daemon`](/zh-TW/cli/daemon)（閘道服務）· [`clawbot`](/zh-TW/cli/clawbot)（命名空間）                                                                                                                                                     |
| 外掛（選用）           | [`path`](/zh-TW/cli/path) · [`policy`](/zh-TW/cli/policy) · [`voicecall`](/zh-TW/cli/voicecall) · [`workboard`](/zh-TW/cli/workboard)（若已安裝）                                                                                                          |

## 全域旗標

| 旗標                    | 用途                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | 將狀態隔離於 `~/.openclaw-dev` 下、使用預設閘道連接埠 19001，並偏移衍生連接埠              |
| `--profile <name>`      | 將狀態隔離於 `~/.openclaw-<name>`（`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`）下                  |
| `--container <name>`    | 在名為 `<name>` 的執行中 Podman/Docker 容器內執行命令列介面（預設：環境變數 `OPENCLAW_CONTAINER`） |
| `--log-level <level>`   | 覆寫檔案與主控台輸出的全域記錄層級                                                 |
| `--no-color`            | 停用 ANSI 色彩（也會遵循 `NO_COLOR=1`）                                                    |
| `--update`              | [`openclaw update`](/zh-TW/cli/update) 的簡寫；原始碼簽出與套件安裝皆適用    |
| `-V`, `--version`, `-v` | 輸出版本並結束                                                                                  |

## 輸出模式

- ANSI 色彩與進度指示器只會在 TTY 工作階段中呈現。
- OSC-8 超連結會在支援的環境中呈現為可點擊連結；否則
  命令列介面會回退為純文字 URL。
- `--json`（以及支援環境中的 `--plain`）會停用樣式，以產生簡潔輸出。
- 長時間執行的命令會顯示進度指示器（支援時使用 OSC 9;4）。

## 調色盤

OpenClaw 的命令列介面輸出使用龍蝦調色盤：

| 權杖          | 十六進位       | 用途                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | 標題、標籤、主要醒目提示 |
| `accentBright` | `#FF7A3D` | 命令名稱、強調              |
| `accentDim`    | `#D14A22` | 次要醒目提示文字             |
| `info`         | `#FF8A5B` | 資訊值                 |
| `success`      | `#2FBF71` | 成功狀態                       |
| `warn`         | `#FFB020` | 警告、選項旗標、回退    |
| `error`        | `#E23D2D` | 錯誤、失敗                     |
| `muted`        | `#8B7F77` | 弱化顯示、中繼資料                |

調色盤的唯一權威來源：`packages/terminal-core/src/palette.ts`。

## 命令樹

<Accordion title="完整命令樹">

此圖涵蓋核心命令及其主要子命令。外掛新增的
子命令（例如 `skills`、`plugins` 和 `wiki` 下的子命令）會
獨立演進；請執行 `<command> --help` 以取得具權威性且最新的清單。

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
  infer (別名：capability)
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
  chat (別名：tui --local)
  terminal (別名：tui --local)
```

外掛可以新增額外的頂層命令，例如
[`openclaw workboard`](/zh-TW/cli/workboard) 或 `openclaw voicecall`。

</Accordion>

## 聊天斜線命令

聊天訊息支援 `/...` 命令。請參閱[斜線命令](/zh-TW/tools/slash-commands)。

重點功能：

- `/status` - 快速診斷。
- `/trace` - 工作階段範圍的外掛追蹤／偵錯行。
- `/config` - 持久化的設定變更。
- `/debug` - 僅限執行階段的設定覆寫（儲存在記憶體而非磁碟；需要 `commands.debug: true`）。

## 用量追蹤

當 OAuth／API 認證資訊可用時，`openclaw status --usage` 和控制介面會顯示供應商的用量／配額。
資料直接來自供應商的用量端點，並正規化為 `X% left`。目前具有用量
時間窗的供應商包括：Anthropic、Gemini CLI、GitHub Copilot、MiniMax、OpenAI Codex、
Xiaomi 和 z.ai。

詳情請參閱[用量追蹤](/zh-TW/concepts/usage-tracking)。

## 相關內容

- [斜線命令](/zh-TW/tools/slash-commands)
- [設定](/zh-TW/gateway/configuration)
- [環境](/zh-TW/help/environment)

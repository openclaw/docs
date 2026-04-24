---
read_when:
    - 適切な `openclaw` サブコマンドを探している場合
    - グローバルフラグや出力スタイルのルールを調べている場合
summary: 'OpenClaw CLI インデックス: コマンド一覧、グローバルフラグ、およびコマンドごとのページへのリンク'
title: CLI リファレンス
x-i18n:
    generated_at: "2026-04-24T04:50:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw` はメインの CLI エントリポイントです。各コアコマンドには専用の
リファレンスページがあるか、またはそのエイリアス先コマンドとともに文書化されています。
このインデックスでは、コマンド、グローバルフラグ、および CLI 全体に適用される
出力スタイルのルールを一覧します。

## コマンドページ

| 領域                 | コマンド                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| セットアップとオンボーディング | [`setup`](/ja-JP/cli/setup) · [`onboard`](/ja-JP/cli/onboard) · [`configure`](/ja-JP/cli/configure) · [`config`](/ja-JP/cli/config) · [`completion`](/ja-JP/cli/completion) · [`doctor`](/ja-JP/cli/doctor) · [`dashboard`](/ja-JP/cli/dashboard)                   |
| リセットとアンインストール  | [`backup`](/ja-JP/cli/backup) · [`reset`](/ja-JP/cli/reset) · [`uninstall`](/ja-JP/cli/uninstall) · [`update`](/ja-JP/cli/update)                                                                                                                 |
| メッセージングとエージェント | [`message`](/ja-JP/cli/message) · [`agent`](/ja-JP/cli/agent) · [`agents`](/ja-JP/cli/agents) · [`acp`](/ja-JP/cli/acp) · [`mcp`](/ja-JP/cli/mcp)                                                                                                       |
| ヘルスとセッション  | [`status`](/ja-JP/cli/status) · [`health`](/ja-JP/cli/health) · [`sessions`](/ja-JP/cli/sessions)                                                                                                                                           |
| Gateway とログ     | [`gateway`](/ja-JP/cli/gateway) · [`logs`](/ja-JP/cli/logs) · [`system`](/ja-JP/cli/system)                                                                                                                                                 |
| モデルと推論 | [`models`](/ja-JP/cli/models) · [`infer`](/ja-JP/cli/infer) · `capability`（[`infer`](/ja-JP/cli/infer) のエイリアス）· [`memory`](/ja-JP/cli/memory) · [`wiki`](/ja-JP/cli/wiki)                                                                          |
| ネットワークとノード    | [`directory`](/ja-JP/cli/directory) · [`nodes`](/ja-JP/cli/nodes) · [`devices`](/ja-JP/cli/devices) · [`node`](/ja-JP/cli/node)                                                                                                                   |
| ランタイムと sandbox  | [`approvals`](/ja-JP/cli/approvals) · `exec-policy`（[`approvals`](/ja-JP/cli/approvals) を参照）· [`sandbox`](/ja-JP/cli/sandbox) · [`tui`](/ja-JP/cli/tui) · `chat`/`terminal`（[`tui --local`](/ja-JP/cli/tui) のエイリアス）· [`browser`](/ja-JP/cli/browser) |
| 自動化           | [`cron`](/ja-JP/cli/cron) · [`tasks`](/ja-JP/cli/tasks) · [`hooks`](/ja-JP/cli/hooks) · [`webhooks`](/ja-JP/cli/webhooks)                                                                                                                         |
| 検出とドキュメント   | [`dns`](/ja-JP/cli/dns) · [`docs`](/ja-JP/cli/docs)                                                                                                                                                                                   |
| ペアリングとチャネル | [`pairing`](/ja-JP/cli/pairing) · [`qr`](/ja-JP/cli/qr) · [`channels`](/ja-JP/cli/channels)                                                                                                                                                 |
| セキュリティと Plugin | [`security`](/ja-JP/cli/security) · [`secrets`](/ja-JP/cli/secrets) · [`skills`](/ja-JP/cli/skills) · [`plugins`](/ja-JP/cli/plugins) · [`proxy`](/ja-JP/cli/proxy)                                                                                     |
| 旧エイリアス       | [`daemon`](/ja-JP/cli/daemon)（gateway サービス）· [`clawbot`](/ja-JP/cli/clawbot)（名前空間）                                                                                                                                         |
| Plugin（任意）   | [`voicecall`](/ja-JP/cli/voicecall)（インストールされている場合）                                                                                                                                                                              |

## グローバルフラグ

| フラグ                    | 用途                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `--dev`                   | `~/.openclaw-dev` 配下に状態を分離し、デフォルトポートをずらす         |
| `--profile <name>`        | `~/.openclaw-<name>` 配下に状態を分離する                              |
| `--container <name>`      | 実行対象として名前付きコンテナを指定する                                |
| `--no-color`              | ANSI カラーを無効にする（`NO_COLOR=1` も尊重されます）                  |
| `--update`                | [`openclaw update`](/ja-JP/cli/update) の短縮形（ソースインストールのみ） |
| `-V`, `--version`, `-v`   | バージョンを表示して終了する                                                |

## 出力モード

- ANSI カラーと進行インジケーターは TTY セッションでのみ描画されます。
- OSC-8 ハイパーリンクは、対応環境ではクリック可能なリンクとして描画されます。非対応環境では
  CLI は通常の URL にフォールバックします。
- `--json`（およびサポートされている場合の `--plain`）は、クリーンな出力のためにスタイルを無効にします。
- 長時間実行コマンドは進行インジケーターを表示します（対応環境では OSC 9;4）。

パレットのソースオブトゥルース: `src/terminal/palette.ts`。

## コマンドツリー

<Accordion title="完全なコマンドツリー">

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

Plugin は追加のトップレベルコマンドを加えることがあります（たとえば `openclaw voicecall`）。

</Accordion>

## チャットのスラッシュコマンド

チャットメッセージは `/...` コマンドをサポートします。[slash commands](/ja-JP/tools/slash-commands) を参照してください。

ハイライト:

- `/status` — クイック診断。
- `/trace` — セッションスコープの Plugin トレース/デバッグ行。
- `/config` — 永続化される設定変更。
- `/debug` — ランタイム専用の設定オーバーライド（メモリのみ、ディスクには保存しない。`commands.debug: true` が必要）。

## 使用量トラッキング

`openclaw status --usage` と Control UI は、OAuth/API 認証情報が利用可能な場合に
プロバイダの使用量/クォータを表示します。データはプロバイダの使用量エンドポイントから
直接取得され、`X% left` に正規化されます。現在の使用量ウィンドウを持つプロバイダ:
Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、
Xiaomi、z.ai。

詳細は [Usage tracking](/ja-JP/concepts/usage-tracking) を参照してください。

## 関連

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [設定](/ja-JP/gateway/configuration)
- [環境](/ja-JP/help/environment)

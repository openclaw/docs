---
read_when:
    - 適切な `openclaw` サブコマンドを見つける
    - グローバルフラグまたは出力スタイル規則を調べる
summary: 'OpenClaw CLI インデックス: コマンド一覧、グローバルフラグ、コマンド別ページへのリンク'
title: CLI リファレンス
x-i18n:
    generated_at: "2026-07-02T00:44:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw` はメインの CLI エントリーポイントです。各コアコマンドには専用のリファレンスページがあるか、そのコマンドがエイリアスするコマンドとあわせて文書化されています。このインデックスでは、CLI 全体に適用されるコマンド、グローバルフラグ、出力スタイル規則を一覧します。

セットアップコマンドは目的に応じて使います。

- `openclaw setup` と `openclaw onboard` は、Gateway、モデル認証、ワークスペース、チャンネル、Skills、ヘルスのための、初回実行時の完全なガイド付きパスを実行します。
- `openclaw setup --baseline` は、ガイド付きオンボーディングフローを進まずにベースライン設定とワークスペースを作成します。
- `openclaw configure` は、モデル認証、Gateway、チャンネル、plugins、Skills など、既存セットアップの対象部分を変更します。
- `openclaw channels add` は、ベースラインが存在した後にチャンネルアカウントを設定します。ガイド付きチャンネルセットアップにはフラグなしで実行し、スクリプトにはチャンネル固有のフラグを指定して実行します。

## コマンドページ

| 領域                 | コマンド                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| セットアップとオンボーディング | [`crestodian`](/ja-JP/cli/crestodian) · [`setup`](/ja-JP/cli/setup) · [`onboard`](/ja-JP/cli/onboard) · [`configure`](/ja-JP/cli/configure) · [`config`](/ja-JP/cli/config) · [`completion`](/ja-JP/cli/completion) · [`doctor`](/ja-JP/cli/doctor) · [`dashboard`](/ja-JP/cli/dashboard) |
| リセットとアンインストール  | [`backup`](/ja-JP/cli/backup) · [`reset`](/ja-JP/cli/reset) · [`uninstall`](/ja-JP/cli/uninstall) · [`update`](/ja-JP/cli/update)                                                                                                                                 |
| メッセージングとエージェント | [`message`](/ja-JP/cli/message) · [`agent`](/ja-JP/cli/agent) · [`agents`](/ja-JP/cli/agents) · [`attach`](/cli/attach) · [`acp`](/ja-JP/cli/acp) · [`mcp`](/ja-JP/cli/mcp)                                                                                             |
| ヘルスとセッション  | [`status`](/ja-JP/cli/status) · [`health`](/ja-JP/cli/health) · [`sessions`](/ja-JP/cli/sessions)                                                                                                                                                           |
| Gateway とログ     | [`gateway`](/ja-JP/cli/gateway) · [`logs`](/ja-JP/cli/logs) · [`system`](/ja-JP/cli/system)                                                                                                                                                                 |
| モデルと推論 | [`models`](/ja-JP/cli/models) · [`infer`](/ja-JP/cli/infer) · `capability`（[`infer`](/ja-JP/cli/infer) のエイリアス） · [`memory`](/ja-JP/cli/memory) · [`commitments`](/ja-JP/cli/commitments) · [`wiki`](/ja-JP/cli/wiki)                                                      |
| ネットワークとノード    | [`directory`](/ja-JP/cli/directory) · [`nodes`](/ja-JP/cli/nodes) · [`devices`](/ja-JP/cli/devices) · [`node`](/ja-JP/cli/node)                                                                                                                                   |
| ランタイムとサンドボックス  | [`approvals`](/ja-JP/cli/approvals) · `exec-policy`（[`approvals`](/ja-JP/cli/approvals) を参照） · [`sandbox`](/ja-JP/cli/sandbox) · [`tui`](/ja-JP/cli/tui) · `chat`/`terminal`（[`tui --local`](/ja-JP/cli/tui) のエイリアス） · [`browser`](/ja-JP/cli/browser)                 |
| 自動化           | [`cron`](/ja-JP/cli/cron) · [`tasks`](/ja-JP/cli/tasks) · [`hooks`](/ja-JP/cli/hooks) · [`webhooks`](/ja-JP/cli/webhooks) · [`transcripts`](/ja-JP/cli/transcripts)                                                                                                     |
| 検出とドキュメント   | [`dns`](/ja-JP/cli/dns) · [`docs`](/ja-JP/cli/docs)                                                                                                                                                                                                   |
| ペアリングとチャンネル | [`pairing`](/ja-JP/cli/pairing) · [`qr`](/ja-JP/cli/qr) · [`channels`](/ja-JP/cli/channels)                                                                                                                                                                 |
| セキュリティとplugins | [`security`](/ja-JP/cli/security) · [`secrets`](/ja-JP/cli/secrets) · [`skills`](/ja-JP/cli/skills) · [`plugins`](/ja-JP/cli/plugins) · [`proxy`](/ja-JP/cli/proxy)                                                                                                     |
| レガシーエイリアス       | [`daemon`](/ja-JP/cli/daemon)（Gateway サービス） · [`clawbot`](/ja-JP/cli/clawbot)（名前空間）                                                                                                                                                         |
| Plugins（任意）   | [`path`](/ja-JP/cli/path) · [`policy`](/ja-JP/cli/policy) · [`voicecall`](/ja-JP/cli/voicecall) · [`workboard`](/ja-JP/cli/workboard)（インストール済みの場合）                                                                                                              |

## グローバルフラグ

| フラグ                    | 目的                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | 状態を `~/.openclaw-dev` 配下に分離し、デフォルトポートをずらします         |
| `--profile <name>`      | 状態を `~/.openclaw-<name>` 配下に分離します                              |
| `--container <name>`    | 実行対象として名前付きコンテナを指定します                                |
| `--no-color`            | ANSI カラーを無効にします（`NO_COLOR=1` も尊重されます）                  |
| `--update`              | [`openclaw update`](/ja-JP/cli/update) の省略形（ソースインストールのみ） |
| `-V`, `--version`, `-v` | バージョンを表示して終了します                                                |

## 出力モード

- ANSI カラーと進捗インジケーターは TTY セッションでのみ描画されます。
- OSC-8 ハイパーリンクは、対応している場所ではクリック可能なリンクとして描画されます。それ以外の場合、
  CLI はプレーンな URL にフォールバックします。
- `--json`（および対応している場合は `--plain`）は、クリーンな出力のためにスタイルを無効にします。
- 長時間実行されるコマンドは進捗インジケーターを表示します（対応している場合は OSC 9;4）。

パレットの信頼できる情報源: `src/terminal/palette.ts`。

## コマンドツリー

<Accordion title="完全なコマンドツリー">

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

Plugins は、[`openclaw workboard`](/ja-JP/cli/workboard) や `openclaw voicecall` などの追加のトップレベルコマンドを追加できます。

</Accordion>

## チャットスラッシュコマンド

チャットメッセージは `/...` コマンドをサポートします。[スラッシュコマンド](/ja-JP/tools/slash-commands) を参照してください。

ハイライト:

- `/status` — クイック診断。
- `/trace` — セッションスコープの plugin トレース/デバッグ行。
- `/config` — 永続化された設定変更。
- `/debug` — ランタイムのみの設定上書き（メモリ内、ディスクではない。`commands.debug: true` が必要）。

## 使用量トラッキング

`openclaw status --usage` と Control UI は、OAuth/API 認証情報が利用できる場合にプロバイダーの使用量/クォータを表示します。データはプロバイダーの使用量エンドポイントから直接取得され、`X% left` に正規化されます。現在の使用量ウィンドウがあるプロバイダー: Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、
Xiaomi、z.ai。

詳細は [使用量トラッキング](/ja-JP/concepts/usage-tracking) を参照してください。

## 関連

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [設定](/ja-JP/gateway/configuration)
- [環境](/ja-JP/help/environment)

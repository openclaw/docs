---
read_when:
    - 適切な `openclaw` サブコマンドを見つける
    - グローバルフラグまたは出力スタイル規則を確認する
summary: 'OpenClaw CLI インデックス: コマンド一覧、グローバルフラグ、コマンド別ページへのリンク'
title: CLI リファレンス
x-i18n:
    generated_at: "2026-07-05T11:08:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a002cd337c3a7611e0607f2b074681c09aa830e0c4f6e529d2d6397e951775f8
    source_path: cli/index.md
    workflow: 16
---

`openclaw` はメインの CLI エントリポイントです。各コアコマンドには専用の
リファレンスページがあるか、エイリアス先のコマンドとともに文書化されています。このインデックスでは、
CLI 全体に適用されるコマンド、グローバルフラグ、出力スタイル規則を一覧します。

目的別のセットアップコマンド:

- `openclaw setup` と `openclaw onboard` は、Gateway、モデル認証、ワークスペース、チャネル、Skills、ヘルス向けの完全なガイド付き初回実行パスを実行します。
- `openclaw setup --baseline` は、ガイド付きオンボーディングフローを進めずにベースライン設定とワークスペースを作成します。
- `openclaw configure` は、既存セットアップの対象部分を変更します: モデル認証、Gateway、チャネル、plugins、または Skills。
- `openclaw channels add` は、ベースライン作成後にチャネルアカウントを設定します。ガイド付きセットアップにはフラグなしで実行し、スクリプトにはチャネル固有のフラグを指定して実行します。

## コマンドページ

| 領域                         | コマンド                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| セットアップとオンボーディング         | [`crestodian`](/ja-JP/cli/crestodian) · [`setup`](/ja-JP/cli/setup) · [`onboard`](/ja-JP/cli/onboard) · [`configure`](/ja-JP/cli/configure) · [`config`](/ja-JP/cli/config) · [`completion`](/ja-JP/cli/completion) · [`doctor`](/ja-JP/cli/doctor) · [`dashboard`](/ja-JP/cli/dashboard) |
| リセット、バックアップ、移行 | [`backup`](/ja-JP/cli/backup) · [`migrate`](/ja-JP/cli/migrate) · [`reset`](/ja-JP/cli/reset) · [`uninstall`](/ja-JP/cli/uninstall) · [`update`](/ja-JP/cli/update)                                                                                                     |
| メッセージングとエージェント         | [`message`](/ja-JP/cli/message) · [`agent`](/ja-JP/cli/agent) · [`agents`](/ja-JP/cli/agents) · [`attach`](/ja-JP/cli/attach) · [`acp`](/ja-JP/cli/acp) · [`mcp`](/ja-JP/cli/mcp)                                                                                             |
| ヘルスとセッション          | [`status`](/ja-JP/cli/status) · [`health`](/ja-JP/cli/health) · [`sessions`](/ja-JP/cli/sessions)                                                                                                                                                           |
| Gateway とログ             | [`gateway`](/ja-JP/cli/gateway) · [`logs`](/ja-JP/cli/logs) · [`system`](/ja-JP/cli/system)                                                                                                                                                                 |
| モデルと推論         | [`models`](/ja-JP/cli/models) · [`infer`](/ja-JP/cli/infer) · `capability` ([`infer`](/ja-JP/cli/infer) のエイリアス) · [`memory`](/ja-JP/cli/memory) · [`commitments`](/ja-JP/cli/commitments) · [`wiki`](/ja-JP/cli/wiki)                                                      |
| ネットワークとノード            | [`directory`](/ja-JP/cli/directory) · [`nodes`](/ja-JP/cli/nodes) · [`devices`](/ja-JP/cli/devices) · [`node`](/ja-JP/cli/node)                                                                                                                                   |
| ランタイムとサンドボックス          | [`approvals`](/ja-JP/cli/approvals) · `exec-policy` ([`approvals`](/ja-JP/cli/approvals) を参照) · [`sandbox`](/ja-JP/cli/sandbox) · [`tui`](/ja-JP/cli/tui) · `chat`/`terminal` ([`tui --local`](/ja-JP/cli/tui) のエイリアス) · [`browser`](/ja-JP/cli/browser)                 |
| 自動化                   | [`cron`](/ja-JP/cli/cron) · [`tasks`](/ja-JP/cli/tasks) · [`hooks`](/ja-JP/cli/hooks) · [`webhooks`](/ja-JP/cli/webhooks) · [`transcripts`](/ja-JP/cli/transcripts)                                                                                                     |
| 検出とドキュメント           | [`dns`](/ja-JP/cli/dns) · [`docs`](/ja-JP/cli/docs)                                                                                                                                                                                                   |
| ペアリングとチャネル         | [`pairing`](/ja-JP/cli/pairing) · [`qr`](/ja-JP/cli/qr) · [`channels`](/ja-JP/cli/channels)                                                                                                                                                                 |
| セキュリティと plugins         | [`security`](/ja-JP/cli/security) · [`secrets`](/ja-JP/cli/secrets) · [`skills`](/ja-JP/cli/skills) · [`plugins`](/ja-JP/cli/plugins) · [`proxy`](/ja-JP/cli/proxy)                                                                                                     |
| レガシーエイリアス               | [`daemon`](/ja-JP/cli/daemon) (Gateway サービス) · [`clawbot`](/ja-JP/cli/clawbot) (名前空間)                                                                                                                                                         |
| Plugins (任意)           | [`path`](/ja-JP/cli/path) · [`policy`](/ja-JP/cli/policy) · [`voicecall`](/ja-JP/cli/voicecall) · [`workboard`](/ja-JP/cli/workboard) (インストールされている場合)                                                                                                              |

## グローバルフラグ

| フラグ                    | 目的                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | 状態を `~/.openclaw-dev` 配下に分離し、デフォルトの Gateway ポートを 19001 にして、派生ポートをずらします              |
| `--profile <name>`      | 状態を `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`) 配下に分離します                  |
| `--container <name>`    | `<name>` という名前の実行中 Podman/Docker コンテナ内で CLI を実行します (デフォルト: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | ファイル + コンソール出力のグローバルログレベルを上書きします                                                 |
| `--no-color`            | ANSI カラーを無効にします (`NO_COLOR=1` も尊重されます)                                                    |
| `--update`              | [`openclaw update`](/ja-JP/cli/update) の短縮形です。ソースチェックアウトとパッケージインストールの両方で動作します    |
| `-V`, `--version`, `-v` | バージョンを出力して終了します                                                                                  |

## 出力モード

- ANSI カラーと進行状況インジケーターは TTY セッションでのみ描画されます。
- OSC-8 ハイパーリンクは、対応している場所ではクリック可能なリンクとして描画されます。対応していない場合、
  CLI はプレーンな URL にフォールバックします。
- `--json` (および対応している場合は `--plain`) は、クリーンな出力のためにスタイルを無効にします。
- 長時間実行されるコマンドは進行状況インジケーターを表示します (対応している場合は OSC 9;4)。

## カラーパレット

OpenClaw は CLI 出力にロブスターパレットを使用します:

| トークン          | Hex       | 用途                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | 見出し、ラベル、主要なハイライト |
| `accentBright` | `#FF7A3D` | コマンド名、強調              |
| `accentDim`    | `#D14A22` | 二次的なハイライトテキスト             |
| `info`         | `#FF8A5B` | 情報値                 |
| `success`      | `#2FBF71` | 成功状態                       |
| `warn`         | `#FFB020` | 警告、オプションフラグ、フォールバック    |
| `error`        | `#E23D2D` | エラー、失敗                     |
| `muted`        | `#8B7F77` | 弱調、メタデータ                |

パレットの信頼できる情報源: `packages/terminal-core/src/palette.ts`。

## コマンドツリー

<Accordion title="完全なコマンドツリー">

このマップは、コアコマンドとその主要サブコマンドを対象にしています。Plugin によって追加される
サブコマンド (たとえば `skills`、`plugins`、`wiki` 配下) は独立して進化します。
権威ある最新の一覧については `<command> --help` を実行してください。

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

Plugin は、[`openclaw workboard`](/ja-JP/cli/workboard) や `openclaw voicecall` などの追加のトップレベルコマンドを追加できます。

</Accordion>

## チャットのスラッシュコマンド

チャットメッセージは `/...` コマンドをサポートします。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

主な項目:

- `/status` - 簡易診断。
- `/trace` - セッションスコープのPluginトレース/デバッグ行。
- `/config` - 永続化される設定変更。
- `/debug` - ランタイムのみの設定オーバーライド (メモリ内のみ、ディスクには保存しません。`commands.debug: true` が必要です)。

## 使用量の追跡

`openclaw status --usage` とControl UIは、OAuth/API認証情報が利用可能な場合にプロバイダーの使用量/クォータを表示します。データはプロバイダーの使用量エンドポイントから直接取得され、`X% left` に正規化されます。現在の使用量ウィンドウがあるプロバイダー: Anthropic、Gemini CLI、GitHub Copilot、MiniMax、OpenAI Codex、Xiaomi、z.ai。

詳細は[使用量の追跡](/ja-JP/concepts/usage-tracking)を参照してください。

## 関連

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [設定](/ja-JP/gateway/configuration)
- [環境](/ja-JP/help/environment)

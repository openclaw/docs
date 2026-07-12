---
read_when:
    - 適切な `openclaw` サブコマンドを見つける
    - グローバルフラグまたは出力スタイルのルールを調べる
summary: OpenClaw CLI インデックス：コマンド一覧、グローバルフラグ、コマンド別ページへのリンク
title: CLI リファレンス
x-i18n:
    generated_at: "2026-07-12T14:26:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` はメインの CLI エントリーポイントです。各コアコマンドには専用の
リファレンスページがあるか、エイリアス先のコマンドとともに文書化されています。この索引では、
CLI 全体に適用されるコマンド、グローバルフラグ、出力スタイルの規則を一覧にしています。

目的別のセットアップコマンド:

- `openclaw setup` と `openclaw onboard` は最初に推論を検証し、その後 Crestodian を起動して Gateway、ワークスペース、チャンネル、Skills、ヘルスチェックをセットアップします。
- `openclaw setup --baseline` は、ガイド付きオンボーディングフローを実行せずに、ベースライン設定とワークスペースを作成します。
- `openclaw configure` は、既存のセットアップの対象部分（モデル認証、Gateway、チャンネル、Plugin、Skills）を変更します。
- `openclaw channels add` は、ベースラインの作成後にチャンネルアカウントを設定します。ガイド付きセットアップではフラグなしで実行し、スクリプトではチャンネル固有のフラグを指定します。

## コマンドページ

| 分野                         | コマンド                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| セットアップとオンボーディング         | [`crestodian`](/ja-JP/cli/crestodian) · [`setup`](/ja-JP/cli/setup) · [`onboard`](/ja-JP/cli/onboard) · [`configure`](/ja-JP/cli/configure) · [`config`](/ja-JP/cli/config) · [`completion`](/ja-JP/cli/completion) · [`doctor`](/ja-JP/cli/doctor) · [`dashboard`](/ja-JP/cli/dashboard) |
| リセット、バックアップ、移行 | [`backup`](/ja-JP/cli/backup) · [`migrate`](/ja-JP/cli/migrate) · [`reset`](/ja-JP/cli/reset) · [`uninstall`](/ja-JP/cli/uninstall) · [`update`](/ja-JP/cli/update)                                                                                                     |
| メッセージングとエージェント         | [`message`](/ja-JP/cli/message) · [`agent`](/ja-JP/cli/agent) · [`agents`](/ja-JP/cli/agents) · [`attach`](/ja-JP/cli/attach) · [`acp`](/ja-JP/cli/acp) · [`mcp`](/ja-JP/cli/mcp)                                                                                             |
| ヘルスチェックとセッション          | [`status`](/ja-JP/cli/status) · [`health`](/ja-JP/cli/health) · [`sessions`](/ja-JP/cli/sessions) · [`audit`](/ja-JP/cli/audit)                                                                                                                                   |
| Gateway とログ             | [`gateway`](/ja-JP/cli/gateway) · [`logs`](/ja-JP/cli/logs) · [`system`](/ja-JP/cli/system)                                                                                                                                                                 |
| モデルと推論         | [`models`](/ja-JP/cli/models) · [`promos`](/ja-JP/cli/promos) · [`infer`](/ja-JP/cli/infer) · `capability`（[`infer`](/ja-JP/cli/infer) のエイリアス）· [`memory`](/ja-JP/cli/memory) · [`commitments`](/ja-JP/cli/commitments) · [`wiki`](/ja-JP/cli/wiki)                            |
| ネットワークと Node            | [`directory`](/ja-JP/cli/directory) · [`nodes`](/ja-JP/cli/nodes) · [`devices`](/ja-JP/cli/devices) · [`node`](/ja-JP/cli/node)                                                                                                                                   |
| ランタイムとサンドボックス          | [`approvals`](/ja-JP/cli/approvals) · `exec-policy`（[`approvals`](/ja-JP/cli/approvals) を参照）· [`sandbox`](/ja-JP/cli/sandbox) · [`tui`](/ja-JP/cli/tui) · `chat`/`terminal`（[`tui --local`](/ja-JP/cli/tui) のエイリアス）· [`browser`](/ja-JP/cli/browser)                 |
| 自動化                   | [`cron`](/ja-JP/cli/cron) · [`tasks`](/ja-JP/cli/tasks) · [`hooks`](/ja-JP/cli/hooks) · [`webhooks`](/ja-JP/cli/webhooks) · [`transcripts`](/ja-JP/cli/transcripts)                                                                                                     |
| 検出とドキュメント           | [`dns`](/ja-JP/cli/dns) · [`docs`](/ja-JP/cli/docs)                                                                                                                                                                                                   |
| ペアリングとチャンネル         | [`pairing`](/ja-JP/cli/pairing) · [`qr`](/ja-JP/cli/qr) · [`channels`](/ja-JP/cli/channels)                                                                                                                                                                 |
| セキュリティと Plugin         | [`security`](/ja-JP/cli/security) · [`secrets`](/ja-JP/cli/secrets) · [`skills`](/ja-JP/cli/skills) · [`plugins`](/ja-JP/cli/plugins) · [`proxy`](/ja-JP/cli/proxy)                                                                                                     |
| レガシーエイリアス               | [`daemon`](/ja-JP/cli/daemon)（Gateway サービス）· [`clawbot`](/ja-JP/cli/clawbot)（名前空間）                                                                                                                                                         |
| Plugin（任意）           | [`path`](/ja-JP/cli/path) · [`policy`](/ja-JP/cli/policy) · [`voicecall`](/ja-JP/cli/voicecall) · [`workboard`](/ja-JP/cli/workboard)（インストールされている場合）                                                                                                              |

## グローバルフラグ

| フラグ                    | 目的                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | 状態を `~/.openclaw-dev` 配下に分離し、Gateway のデフォルトポートを 19001 に設定して、派生ポートをずらす              |
| `--profile <name>`      | 状態を `~/.openclaw-<name>` 配下に分離する（`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`）                  |
| `--container <name>`    | `<name>` という名前の実行中の Podman/Docker コンテナ内で CLI を実行する（デフォルト: 環境変数 `OPENCLAW_CONTAINER`） |
| `--log-level <level>`   | ファイルとコンソール出力のグローバルログレベルを上書きする                                                 |
| `--no-color`            | ANSI カラーを無効にする（`NO_COLOR=1` も考慮されます）                                                    |
| `--update`              | [`openclaw update`](/ja-JP/cli/update) の短縮形。ソースチェックアウトとパッケージインストールの両方で動作する    |
| `-V`, `--version`, `-v` | バージョンを表示して終了する                                                                                  |

## 出力モード

- ANSI カラーと進捗インジケーターは TTY セッションでのみ表示されます。
- OSC-8 ハイパーリンクは、サポートされている環境ではクリック可能なリンクとして表示されます。それ以外では、
  CLI はプレーン URL にフォールバックします。
- `--json`（およびサポートされている場合は `--plain`）は、簡潔な出力のためにスタイルを無効にします。
- 長時間実行されるコマンドでは進捗インジケーターが表示されます（サポートされている場合は OSC 9;4）。

## カラーパレット

OpenClaw は CLI 出力にロブスターパレットを使用します。

| トークン          | 16 進数       | 用途                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | 見出し、ラベル、主要な強調表示 |
| `accentBright` | `#FF7A3D` | コマンド名、強調              |
| `accentDim`    | `#D14A22` | 補助的な強調テキスト             |
| `info`         | `#FF8A5B` | 情報を示す値                 |
| `success`      | `#2FBF71` | 成功状態                       |
| `warn`         | `#FFB020` | 警告、オプションフラグ、フォールバック    |
| `error`        | `#E23D2D` | エラー、失敗                     |
| `muted`        | `#8B7F77` | 強調を抑えた表示、メタデータ                |

パレットの信頼できる唯一の情報源: `packages/terminal-core/src/palette.ts`。

## コマンドツリー

<Accordion title="完全なコマンドツリー">

このマップは、コアコマンドとその主要なサブコマンドを網羅しています。Plugin によって追加される
サブコマンド（たとえば `skills`、`plugins`、`wiki` 配下）は
独立して進化します。正式な最新リストについては、`<command> --help` を実行してください。

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
  promos
    list
    claim <slug>
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

Pluginは、[`openclaw workboard`](/ja-JP/cli/workboard)や`openclaw voicecall`など、追加のトップレベルコマンドを追加できます。

</Accordion>

## チャットのスラッシュコマンド

チャットメッセージでは`/...`コマンドを使用できます。[スラッシュコマンド](/ja-JP/tools/slash-commands)を参照してください。

主なコマンド：

- `/status` - 簡易診断。
- `/trace` - セッションスコープのPluginトレース／デバッグ行。
- `/config` - 永続化される設定変更。
- `/debug` - ランタイム限定の設定オーバーライド（メモリ上のみ、ディスクには保存されません。`commands.debug: true`が必要です）。

## 使用量の追跡

OAuth/API認証情報が利用可能な場合、`openclaw status --usage`とControl UIにプロバイダーの使用量／クォータが表示されます。データはプロバイダーの使用量エンドポイントから直接取得され、`X% left`形式に正規化されます。現在、使用量ウィンドウに対応しているプロバイダーは、Anthropic、Gemini CLI、GitHub Copilot、MiniMax、OpenAI Codex、Xiaomi、z.aiです。

詳細については、[使用量の追跡](/ja-JP/concepts/usage-tracking)を参照してください。

## 関連項目

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [設定](/ja-JP/gateway/configuration)
- [環境](/ja-JP/help/environment)

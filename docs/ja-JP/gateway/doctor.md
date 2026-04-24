---
read_when:
    - doctor移行を追加または変更する場合
    - 破壊的な設定変更を導入する場合
summary: 'doctorコマンド: ヘルスチェック、設定移行、および修復手順'
title: doctor
x-i18n:
    generated_at: "2026-04-24T04:57:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor`は、OpenClawの修復 + 移行ツールです。古い
設定/状態を修正し、ヘルスを確認し、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトなしでデフォルトを受け入れます（該当する場合、再起動/サービス/サンドボックス修復手順も含む）。

```bash
openclaw doctor --repair
```

推奨される修復をプロンプトなしで適用します（安全な場合は修復 + 再起動）。

```bash
openclaw doctor --repair --force
```

積極的な修復も適用します（カスタムsupervisor設定を上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人の確認が必要な再起動/サービス/サンドボックス操作はスキップします。
レガシー状態移行は、検出されると自動で実行されます。

```bash
openclaw doctor --deep
```

追加のgatewayインストールをシステムサービスからスキャンします（launchd/systemd/schtasks）。

書き込む前に変更内容を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

- gitインストール向けの任意の事前更新（対話型のみ）。
- UIプロトコル鮮度チェック（プロトコルスキーマが新しい場合はControl UIを再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skills状態サマリー（対象/欠落/ブロック済み）およびPlugin状態。
- レガシー値向けの設定正規化。
- レガシーなフラット`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk設定移行。
- レガシーChrome拡張設定とChrome MCP準備状況のブラウザー移行チェック。
- OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth shadowing警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuthプロファイル向けOAuth TLS前提条件チェック。
- レガシーのディスク上状態移行（sessions/agent dir/WhatsApp auth）。
- レガシーPluginマニフェストコントラクトキー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- レガシーCronストア移行（`jobId`、`schedule.cron`、トップレベルdelivery/payloadフィールド、payload `provider`、単純な`notify: true` Webhookフォールバックジョブ）。
- セッションロックファイルの検査と古いロックのクリーンアップ。
- 状態整合性と権限チェック（sessions、transcripts、state dir）。
- ローカル実行時の設定ファイル権限チェック（chmod 600）。
- モデル認証ヘルス: OAuth有効期限を確認し、期限切れ間近のトークンを更新でき、authプロファイルのクールダウン/無効状態を報告します。
- 追加ワークスペースディレクトリの検出（`~/openclaw`）。
- サンドボックスが有効な場合のサンドボックスイメージ修復。
- レガシーサービス移行と追加gateway検出。
- Matrixチャネルのレガシー状態移行（`--fix` / `--repair`モード）。
- Gatewayランタイムチェック（サービスはインストール済みだが未実行、キャッシュされたlaunchdラベル）。
- チャネル状態警告（実行中のgatewayからプローブ）。
- Supervisor設定監査（launchd/systemd/schtasks）と任意の修復。
- Gatewayランタイムのベストプラクティスチェック（Node対Bun、バージョンマネージャーパス）。
- Gatewayポート競合診断（デフォルト`18789`）。
- open DMポリシーに対するセキュリティ警告。
- ローカルトークンモード向けGateway認証チェック（トークンソースがない場合はトークン生成を提案。token SecretRef設定は上書きしません）。
- デバイスペアリング問題の検出（初回ペアリングリクエスト保留、ロール/スコープアップグレード保留、古いローカルdevice-tokenキャッシュドリフト、paired-record authドリフト）。
- Linuxでのsystemd lingerチェック。
- ワークスペースのbootstrapファイルサイズチェック（コンテキストファイルの切り詰め/上限近接警告）。
- シェル補完状態チェックと自動インストール/アップグレード。
- メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモートAPI key、またはQMDバイナリ）。
- ソースインストールチェック（pnpm workspace不一致、欠落したUIアセット、欠落したtsxバイナリ）。
- 更新済み設定 + ウィザードメタデータを書き込み。

## Dreams UIのバックフィルとリセット

Control UIのDreamingシーンには、grounded Dreamingワークフロー向けの**Backfill**、**Reset**、および**Clear Grounded**
アクションがあります。これらのアクションはgatewayの
doctor風RPCメソッドを使いますが、`openclaw doctor` CLIの
修復/移行の一部では**ありません**。

実行内容:

- **Backfill**は、有効ワークスペース内の履歴`memory/YYYY-MM-DD.md`ファイルをスキャンし、
  grounded REM diaryパスを実行し、可逆なバックフィルエントリを`DREAMS.md`へ書き込みます。
- **Reset**は、その印が付いたバックフィルdiaryエントリのみを`DREAMS.md`から削除します。
- **Clear Grounded**は、履歴リプレイ由来であり、まだライブリコールまたは日次
  サポートを蓄積していない、stagedされたgrounded専用短期エントリのみを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md`は編集しません
- 完全なdoctor移行は実行しません
- staged CLIパスを先に明示実行しない限り、grounded候補をライブ短期
  昇格ストアへ自動的にstageしません

groundedな履歴リプレイを通常の深い昇格レーンへ影響させたい場合は、代わりにCLIフローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md`をレビューインターフェースとして維持したまま、
groundedな永続候補が短期Dreamingストアへstageされます。

## 詳細な動作と理由

### 0) 任意の更新（gitインストール）

これがgitチェックアウトであり、doctorが対話型で実行されている場合、
doctor実行前に更新（fetch/rebase/build）を提案します。

### 1) 設定正規化

設定にレガシー値形式（たとえばチャネル固有上書きのない`messages.ackReaction`）
が含まれている場合、doctorはそれらを現在の
スキーマへ正規化します。

これにはレガシーなTalkのフラットフィールドも含まれます。現在の公開Talk設定は
`talk.provider` + `talk.providers.<provider>`です。doctorは古い
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey`形式をプロバイダーマップへ書き換えます。

### 2) レガシー設定キー移行

設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、
`openclaw doctor`を実行するよう求めます。

doctorは次を行います。

- どのレガシーキーが見つかったかを説明する。
- 適用した移行を表示する。
- 更新済みスキーマで`~/.openclaw/openclaw.json`を書き換える。

Gatewayも、起動時にレガシー設定形式を検出すると
doctor移行を自動実行するため、古い設定は手動介入なしで修復されます。
Cronジョブストア移行は`openclaw doctor --fix`で処理されます。

現在の移行:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベル`bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- レガシー`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 名前付き`accounts`を持ちながら単一アカウントのトップレベルチャネル値が残っているチャネルについて、それらのアカウントスコープ値を、そのチャネル用に選ばれた昇格アカウントへ移動する（ほとんどのチャネルでは`accounts.default`、Matrixでは一致する既存の名前付き/デフォルト対象を保持可能）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost`を削除（レガシー拡張relay設定）

doctor警告には、マルチアカウントチャネル向けのアカウントデフォルトガイダンスも含まれます。

- `channels.<channel>.defaultAccount`または`accounts.default`がないまま、2つ以上の`channels.<channel>.accounts`エントリが設定されている場合、doctorはフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
- `channels.<channel>.defaultAccount`が未知のアカウントIDに設定されている場合、doctorは警告し、設定済みアカウントIDを一覧表示します。

### 2b) OpenCodeプロバイダー上書き

`models.providers.opencode`、`opencode-zen`、または`opencode-go`を
手動追加している場合、それは`@mariozechner/pi-ai`の組み込みOpenCodeカタログを上書きします。
これにより、モデルが誤ったAPIへ強制されたり、コストがゼロ化されたりする可能性があります。doctorは、
上書きを削除してモデルごとのAPIルーティング + コストを復元できるように警告します。

### 2c) ブラウザー移行とChrome MCP準備状況

ブラウザー設定がまだ削除済みのChrome拡張パスを指している場合、doctorは
それを現在のホストローカルChrome MCP attachモデルへ正規化します。

- `browser.profiles.*.driver: "extension"`は`"existing-session"`になります
- `browser.relayBindHost`は削除されます

doctorはまた、`defaultProfile:
"user"`または設定済みの`existing-session`プロファイルを使う場合に、ホストローカルChrome MCPパスを監査します。

- デフォルト自動接続プロファイル向けに、同じホストにGoogle Chromeがインストールされているか確認する
- 検出されたChromeバージョンを確認し、Chrome 144未満の場合は警告する
- ブラウザーinspectページでリモートデバッグを有効にするよう促す
  （例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、
  または`edge://inspect/#remote-debugging`）

doctorはChrome側の設定を代わりに有効化することはできません。ホストローカルChrome MCPには引き続き次が必要です。

- gateway/nodeホスト上のChromium系ブラウザー 144+
- ローカルで起動しているブラウザー
- そのブラウザーで有効化されたリモートデバッグ
- ブラウザーでの最初のattach同意プロンプトの承認

ここでの準備状況はローカルattach前提条件に関するものだけです。existing-sessionは
現在のChrome MCPルート制限を維持します。`responsebody`、PDFエクスポート、
ダウンロードインターセプト、バッチアクションのような高度ルートには、引き続き管理対象
ブラウザーまたは生のCDPプロファイルが必要です。

このチェックはDocker、sandbox、remote-browser、その他の
ヘッドレスフローには適用されません。それらは引き続きraw CDPを使用します。

### 2d) OAuth TLS前提条件

OpenAI Codex OAuthプロファイルが設定されている場合、doctorはOpenAI
認可エンドポイントをプローブし、ローカルNode/OpenSSL TLSスタックが
証明書チェーンを検証できることを確認します。プローブが証明書エラーで失敗した場合（たとえば
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）、
doctorはプラットフォーム固有の修正ガイダンスを表示します。Homebrew版Nodeを使っているmacOSでは、
修正は通常`brew postinstall ca-certificates`です。`--deep`では、
gatewayが正常でもこのプローブを実行します。

### 2c) Codex OAuthプロバイダー上書き

以前にレガシーなOpenAIトランスポート設定を
`models.providers.openai-codex`の下に追加していた場合、それらは
新しいリリースで自動的に使われる組み込みのCodex OAuth
プロバイダーパスをシャドウする可能性があります。doctorは、Codex OAuthと一緒に
これらの古いトランスポート設定を検出すると警告を出すため、古いトランスポート上書きを
削除または書き換えて、組み込みのルーティング/フォールバック動作を
復元できます。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされており、
この警告は発生しません。

### 3) レガシー状態移行（ディスクレイアウト）

doctorは、古いディスク上レイアウトを現在の構造へ移行できます。

- Sessionsストア + transcripts:
  - `~/.openclaw/sessions/`から`~/.openclaw/agents/<agentId>/sessions/`へ
- Agent dir:
  - `~/.openclaw/agent/`から`~/.openclaw/agents/<agentId>/agent/`へ
- WhatsApp auth状態（Baileys）:
  - レガシーな`~/.openclaw/credentials/*.json`（`oauth.json`を除く）から
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`へ（デフォルトaccount id: `default`）

これらの移行はベストエフォートかつ冪等です。doctorは、
バックアップとしてレガシーフォルダーが残された場合に警告を出します。Gateway/CLIも、
起動時にレガシーsessions + agent dirを自動移行するため、履歴/auth/modelsは
手動でdoctorを実行しなくてもエージェントごとのパスへ配置されます。WhatsApp authは
意図的に`openclaw doctor`経由でのみ移行されます。Talk provider/provider-mapの正規化は現在、
構造的等価性で比較するため、キー順だけの差分では
no-opの`doctor --fix`変更が繰り返し発生しなくなりました。

### 3a) レガシーPluginマニフェスト移行

doctorは、インストール済みのすべてのPluginマニフェストを走査し、非推奨のトップレベル機能
キー（`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、
`webSearchProviders`）を検出します。見つかった場合、それらを`contracts`
オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。
`contracts`キーがすでに同じ値を持っている場合、データを重複させずに
レガシーキーだけを削除します。

### 3b) レガシーCronストア移行

doctorは、Cronジョブストア（デフォルトでは`~/.openclaw/cron/jobs.json`、
または上書きされている場合は`cron.store`）も確認し、スケジューラーが
互換性のためにまだ受け入れている古いジョブ形式を検出します。

現在のCronクリーンアップには次が含まれます。

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルpayloadフィールド（`message`、`model`、`thinking`、...）→ `payload`
- トップレベルdeliveryフィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider`のdeliveryエイリアス → 明示的な`delivery.channel`
- 単純なレガシー`notify: true` Webhookフォールバックジョブ → 明示的な`delivery.mode="webhook"`と`delivery.to=cron.webhook`

doctorは、挙動を変えずに移行できる場合にのみ、`notify: true`ジョブを自動移行します。
ジョブがレガシーnotifyフォールバックと既存の
非Webhook deliveryモードを組み合わせている場合、doctorは警告を出し、そのジョブは手動レビュー用に残します。

### 3c) セッションロックのクリーンアップ

doctorは、すべてのエージェントセッションディレクトリを走査し、古い書き込みロックファイルを検出します。これは
セッションが異常終了したときに残されるファイルです。見つかった各ロックファイルについて、次を報告します:
パス、PID、そのPIDがまだ生きているか、ロック経過時間、および
古いと見なされるかどうか（PIDが死んでいる、または30分超）。`--fix` / `--repair`
モードでは古いロックファイルを自動削除し、それ以外では注記を表示して
`--fix`付きで再実行するよう指示します。

### 4) 状態整合性チェック（セッション永続化、ルーティング、安全性）

state dirは運用上の脳幹です。これが消えると、
セッション、資格情報、ログ、設定を失います（別の場所にバックアップがない限り）。

doctorは次を確認します。

- **state dirが存在しない**: 重大な状態消失について警告し、
  ディレクトリの再作成を促し、失われたデータは復旧できないことを通知します。
- **state dir権限**: 書き込み可能性を検証し、権限修復を提案します
  （owner/group不一致が検出された場合は`chown`ヒントも表示）。
- **macOSクラウド同期state dir**: stateがiCloud Drive
  （`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または
  `~/Library/CloudStorage/...`配下に解決される場合、同期バックのパスはI/O遅延や
  ロック/同期競合を引き起こす可能性があるため警告します。
- **LinuxのSDまたはeMMC state dir**: stateが`mmcblk*`
  マウントソースに解決される場合、SDまたはeMMCバックのランダムI/Oは
  セッションおよび資格情報書き込みで遅くなりやすく、消耗も早いため警告します。
- **セッションディレクトリが存在しない**: `sessions/`とセッションストアディレクトリは、
  履歴を永続化し`ENOENT`クラッシュを避けるために必要です。
- **transcript不一致**: 最近のセッションエントリにtranscriptファイルが欠けている場合に警告します。
- **メインセッションの「1行JSONL」**: メインtranscriptが1行しかない場合を検出します
  （履歴が蓄積されていない）。
- **複数state dir**: 複数の`~/.openclaw`フォルダーがhome
  ディレクトリをまたいで存在する場合、または`OPENCLAW_STATE_DIR`が別の場所を指している場合に警告します
  （履歴がインストール間で分断される可能性があります）。
- **リモートモードの注意**: `gateway.mode=remote`の場合、doctorは
  リモートホストで実行するよう通知します（stateはそこにあります）。
- **設定ファイル権限**: `~/.openclaw/openclaw.json`が
  group/world readableな場合に警告し、`600`への制限を提案します。

### 5) モデル認証ヘルス（OAuth有効期限）

doctorは認証ストア内のOAuthプロファイルを調べ、トークンの
期限切れ間近/期限切れに警告し、安全な場合は更新できます。Anthropic
OAuth/tokenプロファイルが古い場合は、Anthropic API keyまたは
Anthropic setup-tokenパスを提案します。
更新プロンプトは対話型（TTY）で実行している場合にのみ表示されます。`--non-interactive`
では更新試行をスキップします。

OAuth更新が恒久的に失敗した場合（たとえば`refresh_token_reused`、
`invalid_grant`、またはプロバイダーから再ログインが必要と示された場合）、
doctorは再認証が必要であることを報告し、実行すべき正確な
`openclaw models auth login --provider ...`コマンドを表示します。

doctorはまた、次の理由で一時的に使用不能なauthプロファイルも報告します。

- 短いクールダウン（レート制限/タイムアウト/auth失敗）
- より長い無効化（請求/クレジット失敗）

### 6) Hooksモデル検証

`hooks.gmail.model`が設定されている場合、doctorはモデル参照を
カタログおよび許可リストに対して検証し、解決できない、または許可されていない場合に警告します。

### 7) サンドボックスイメージ修復

サンドボックスが有効な場合、doctorはDockerイメージを確認し、
現在のイメージが欠けている場合は、ビルドまたはレガシー名への切り替えを提案します。

### 7b) バンドルPluginランタイム依存関係

doctorは、現在の設定でアクティブな
またはバンドルマニフェストのデフォルトで有効なバンドルPluginについてのみ、
ランタイム依存関係を検証します。たとえば
`plugins.entries.discord.enabled: true`、レガシーの
`channels.discord.enabled: true`、またはデフォルト有効のバンドルプロバイダーです。いずれかが
不足している場合、doctorはパッケージを報告し、
`openclaw doctor --fix` / `openclaw doctor --repair`モードでそれらをインストールします。外部Pluginは引き続き
`openclaw plugins install` / `openclaw plugins update`を使用します。doctorは
任意のPluginパスに対して依存関係をインストールしません。

### 8) Gatewayサービス移行とクリーンアップヒント

doctorは、レガシーgatewayサービス（launchd/systemd/schtasks）を検出し、
それらを削除して、現在のgateway
ポートを使用するOpenClawサービスをインストールすることを提案します。追加のgateway風サービスを
走査し、クリーンアップヒントを表示することもできます。
プロファイル名付きのOpenClaw gatewayサービスは第一級として扱われ、「extra」とは見なされません。

### 8b) 起動時Matrix移行

Matrixチャネルアカウントに保留中または対処可能なレガシー状態移行がある場合、
doctorは（`--fix` / `--repair`モードで）移行前スナップショットを作成し、その後
ベストエフォートの移行ステップを実行します: レガシーMatrix状態移行とレガシー
暗号化状態準備。どちらのステップも致命的ではなく、エラーは記録され、
起動は継続します。読み取り専用モード（`--fix`なしの`openclaw doctor`）では、このチェックは
完全にスキップされます。

### 8c) デバイスペアリングとauthドリフト

doctorは現在、通常のヘルス確認の一部としてデバイスペアリング状態を検査します。

報告内容:

- 初回ペアリングリクエストの保留
- すでにペアリング済みのデバイスのロールアップグレード保留
- すでにペアリング済みのデバイスのスコープアップグレード保留
- デバイスidは一致するがデバイス
  アイデンティティが承認済み記録と一致しなくなった場合の公開鍵不一致修復
- 承認済みロールに対して有効トークンが欠けているペア済み記録
- スコープが承認済みペアリング基準から逸脱しているpairedトークン
- 現在のマシン向けローカルキャッシュdevice-tokenエントリで、gateway側トークンローテーションより前のもの、
  または古いスコープメタデータを持つもの

doctorはpairリクエストを自動承認せず、device tokenを自動ローテーションしません。代わりに
正確な次手順を表示します。

- `openclaw devices list`で保留中リクエストを確認する
- `openclaw devices approve <requestId>`で対象リクエストを承認する
- `openclaw devices rotate --device <deviceId> --role <role>`で新しいトークンをローテーションする
- `openclaw devices remove <deviceId>`で古い記録を削除して再承認する

これにより、よくある「すでにペア済みなのに依然としてpairing requiredになる」
穴が塞がれます。doctorは現在、初回ペアリング、保留中のロール/スコープ
アップグレード、および古いトークン/デバイスアイデンティティドリフトを区別します。

### 9) セキュリティ警告

doctorは、プロバイダーがallowlistなしでDMに対して開かれている場合、
またはポリシーが危険な方法で設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemdユーザーサービスとして実行している場合、doctorは
ログアウト後もgatewayが生存するよう、lingeringが有効であることを確認します。

### 11) ワークスペース状態（Skills、Plugins、およびレガシーディレクトリ）

doctorは、デフォルトエージェント向けのワークスペース状態サマリーを表示します。

- **Skills状態**: 対象、要件不足、allowlistブロック済みSkillsの件数。
- **レガシーワークスペースディレクトリ**: `~/openclaw`またはその他のレガシーワークスペースディレクトリが、
  現在のワークスペースと並んで存在する場合に警告します。
- **Plugin状態**: 読み込み済み/無効/エラーPluginの件数を表示し、
  エラーがあるPluginのPlugin IDを一覧表示し、bundle Plugin capabilitiesを報告します。
- **Plugin互換性警告**: 現在のランタイムと互換性問題があるPluginを検出します。
- **Plugin診断**: Plugin registryが出した読み込み時警告またはエラーを表示します。

### 11b) Bootstrapファイルサイズ

doctorは、ワークスペースbootstrapファイル（たとえば`AGENTS.md`、
`CLAUDE.md`、またはその他の注入コンテキストファイル）が、設定された
文字予算に近いか超えているかを確認します。ファイルごとの生の文字数と注入後文字数、切り詰め率、
切り詰め原因（`max/file`または`max/total`）、および総予算に対する
注入文字総数の割合を報告します。ファイルが切り詰められているか上限に近い場合、
doctorは`agents.defaults.bootstrapMaxChars`
および`agents.defaults.bootstrapTotalMaxChars`調整のヒントを表示します。

### 11c) シェル補完

doctorは、現在のシェル
（zsh、bash、fish、またはPowerShell）向けにタブ補完がインストールされているかを確認します。

- シェルプロファイルが遅い動的補完パターン
  （`source <(openclaw completion ...)`）を使っている場合、doctorはそれを
  より高速なキャッシュファイル方式へアップグレードします。
- 補完がプロファイルに設定されているがキャッシュファイルが存在しない場合、
  doctorは自動でキャッシュを再生成します。
- 補完がまったく設定されていない場合、doctorはインストールを提案します
  （対話型モードのみ。`--non-interactive`ではスキップ）。

キャッシュを手動再生成するには`openclaw completion --write-state`を実行してください。

### 12) Gateway認証チェック（ローカルトークン）

doctorは、ローカルgatewayのトークン認証準備状況を確認します。

- トークンモードでトークンが必要だがトークンソースが存在しない場合、doctorはトークン生成を提案します。
- `gateway.auth.token`がSecretRef管理されているが利用できない場合、doctorは警告し、プレーンテキストで上書きしません。
- `openclaw doctor --generate-gateway-token`は、token SecretRefが設定されていない場合にのみ生成を強制します。

### 12b) 読み取り専用のSecretRef対応修復

一部の修復フローでは、ランタイムのfail-fast動作を弱めずに設定済み資格情報を検査する必要があります。

- `openclaw doctor --fix`は現在、対象設定修復に対してstatus系コマンドと同じ読み取り専用のSecretRefサマリーモデルを使用します。
- 例: Telegramの`allowFrom` / `groupAllowFrom`の`@username`修復では、利用可能であれば設定済みbot資格情報の使用を試みます。
- Telegram bot tokenがSecretRef経由で設定されているが現在のコマンドパスでは利用できない場合、doctorはその資格情報を「設定済みだが利用不可」として報告し、クラッシュしたり、tokenが欠けていると誤報したりせずに自動解決をスキップします。

### 13) Gatewayヘルスチェック + 再起動

doctorはヘルスチェックを実行し、gatewayが
不健全に見える場合は再起動を提案します。

### 13b) メモリ検索準備状況

doctorは、設定されたメモリ検索埋め込みプロバイダーがデフォルト
エージェント向けに準備できているかを確認します。動作は、設定されたバックエンドとプロバイダーによって異なります。

- **QMDバックエンド**: `qmd`バイナリが利用可能で起動可能かをプローブします。
  利用できない場合は、npmパッケージと手動バイナリパスオプションを含む修正ガイダンスを表示します。
- **明示的ローカルプロバイダー**: ローカルモデルファイルまたは認識可能な
  リモート/ダウンロード可能モデルURLを確認します。欠けている場合は、リモートプロバイダーへの切り替えを提案します。
- **明示的リモートプロバイダー**（`openai`、`voyage`など）: 環境変数または
  authストアにAPI keyが存在することを確認します。欠けている場合は実行可能な修正ヒントを表示します。
- **自動プロバイダー**: 最初にローカルモデルの可用性を確認し、その後
  自動選択順で各リモートプロバイダーを試します。

gatewayプローブ結果が利用可能な場合（確認時点でgatewayが健全だった場合）、
doctorはその結果をCLIから見える設定と照合し、
差異があれば注記します。

実行時の埋め込み準備状況を確認するには`openclaw memory status --deep`を使用してください。

### 14) チャネル状態警告

gatewayが健全な場合、doctorはチャネル状態プローブを実行し、
修正提案付きの警告を報告します。

### 15) Supervisor設定監査 + 修復

doctorは、インストール済みsupervisor設定（launchd/systemd/schtasks）を確認し、
欠けているデフォルトや古いデフォルト（例: systemdのnetwork-online依存関係や
再起動遅延）を検出します。不一致を見つけると、更新を推奨し、
現在のデフォルトにサービスファイル/タスクを書き換えることができます。

注意:

- `openclaw doctor`はsupervisor設定を書き換える前に確認します。
- `openclaw doctor --yes`はデフォルトの修復プロンプトを受け入れます。
- `openclaw doctor --repair`は推奨修復をプロンプトなしで適用します。
- `openclaw doctor --repair --force`はカスタムsupervisor設定を上書きします。
- トークン認証でトークンが必要かつ`gateway.auth.token`がSecretRef管理されている場合、doctorのサービスインストール/修復はSecretRefを検証しますが、解決済みプレーンテキストトークン値をsupervisorサービス環境メタデータに永続化しません。
- トークン認証でトークンが必要かつ設定済みtoken SecretRefが未解決の場合、doctorは実行可能なガイダンス付きでインストール/修復パスをブロックします。
- `gateway.auth.token`と`gateway.auth.password`の両方が設定されていて、`gateway.auth.mode`が未設定の場合、doctorはモードが明示設定されるまでインストール/修復をブロックします。
- Linux user-systemd unitでは、doctorのトークンドリフトチェックは、サービス認証メタデータ比較時に`Environment=`と`EnvironmentFile=`の両方のソースを含めるようになりました。
- `openclaw gateway install --force`でいつでも完全書き換えを強制できます。

### 16) Gatewayランタイム + ポート診断

doctorはサービスランタイム（PID、最終終了ステータス）を検査し、
サービスはインストール済みだが実際には動作していない場合に警告します。
また、gatewayポート（デフォルト`18789`）でのポート競合も確認し、
考えられる原因（すでに動作中のgateway、SSHトンネル）を報告します。

### 17) Gatewayランタイムのベストプラクティス

doctorは、gatewayサービスがBunまたはバージョン管理されたNodeパス
（`nvm`、`fnm`、`volta`、`asdf`など）上で動作している場合に警告します。WhatsApp + TelegramチャネルにはNodeが必要であり、
バージョンマネージャーパスはサービスがシェル初期化を読み込まないため、アップグレード後に壊れることがあります。doctorは、
利用可能な場合、システムNodeインストール（Homebrew/apt/choco）への移行を提案します。

### 18) 設定書き込み + ウィザードメタデータ

doctorは設定変更を永続化し、doctor実行を記録するために
ウィザードメタデータを付与します。

### 19) ワークスペースのヒント（バックアップ + メモリシステム）

doctorは、ワークスペースメモリシステムが欠けている場合に提案し、
ワークスペースがまだgit配下でない場合はバックアップのヒントを表示します。

ワークスペース構造とgitバックアップ（推奨は非公開GitHubまたはGitLab）の完全ガイドについては、
[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace)を参照してください。

## 関連

- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)
- [Gateway runbook](/ja-JP/gateway)

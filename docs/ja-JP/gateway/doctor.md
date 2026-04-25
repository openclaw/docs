---
read_when:
    - doctor の移行を追加または変更すること
    - 互換性のない設定変更を導入すること
summary: 'doctor コマンド: ヘルスチェック、設定の移行、修復手順'
title: doctor
x-i18n:
    generated_at: "2026-04-25T18:17:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13204a57facd19459fc812a8daa0fe629b6725bdabb014f59f871fa64c22e71d
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` は、OpenClaw の修復 + 移行ツールです。古い設定や状態を修正し、ヘルスをチェックし、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレス / 自動化

```bash
openclaw doctor --yes
```

プロンプトなしでデフォルトを受け入れます（該当する場合、再起動/サービス/サンドボックス修復手順を含む）。

```bash
openclaw doctor --repair
```

推奨される修復をプロンプトなしで適用します（安全な場合の修復 + 再起動）。

```bash
openclaw doctor --repair --force
```

積極的な修復も適用します（カスタム supervisor 設定を上書きします）。

```bash
openclaw doctor --non-interactive
```

プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動/サービス/サンドボックス操作はスキップします。  
検出された場合、レガシー状態の移行は自動的に実行されます。

```bash
openclaw doctor --deep
```

追加の Gateway インストールがないかシステムサービスをスキャンします（launchd/systemd/schtasks）。

書き込む前に変更を確認したい場合は、まず設定ファイルを開いてください:

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

- git インストール向けの任意の事前更新（対話時のみ）。
- UI プロトコルの新しさチェック（プロトコルスキーマが新しい場合は Control UI を再ビルド）。
- ヘルスチェック + 再起動プロンプト。
- Skills ステータス概要（対象/不足/ブロック）と plugin ステータス。
- レガシー値の設定正規化。
- レガシーなフラット `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
- レガシーな Chrome 拡張設定と Chrome MCP 準備状況に対する browser 移行チェック。
- OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
- Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
- OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
- レガシーなディスク上の状態移行（sessions/agent dir/WhatsApp auth）。
- レガシー plugin manifest contract キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
- レガシー Cron ストア移行（`jobId`、`schedule.cron`、トップレベル delivery/payload フィールド、payload `provider`、単純な `notify: true` Webhook フォールバックジョブ）。
- セッションロックファイル検査と stale lock のクリーンアップ。
- 状態整合性および権限チェック（sessions、transcripts、state dir）。
- ローカル実行時の設定ファイル権限チェック（chmod 600）。
- モデル認証ヘルス: OAuth 期限切れをチェックし、期限切れが近いトークンを更新でき、auth-profile の cooldown/無効状態を報告します。
- 追加 workspace dir の検出（`~/openclaw`）。
- サンドボックス有効時の sandbox image 修復。
- レガシー service 移行と追加 Gateway 検出。
- Matrix channel のレガシー状態移行（`--fix` / `--repair` モード）。
- Gateway ランタイムチェック（service はインストール済みだが未実行、キャッシュされた launchd ラベル）。
- channel ステータス警告（実行中 Gateway からプローブ）。
- supervisor 設定監査（launchd/systemd/schtasks）と任意の修復。
- Gateway ランタイムのベストプラクティスチェック（Node vs Bun、version-manager パス）。
- Gateway ポート競合診断（デフォルト `18789`）。
- オープン DM ポリシーに対するセキュリティ警告。
- ローカルトークンモード向け Gateway 認証チェック（トークンソースが存在しない場合はトークン生成を提案。token SecretRef 設定は上書きしません）。
- デバイスペアリング問題の検出（初回ペア要求の保留、role/scope アップグレードの保留、古いローカル device-token キャッシュのずれ、paired-record 認証のずれ）。
- Linux 上での systemd linger チェック。
- Workspace bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限近接警告）。
- シェル補完ステータスチェックと自動インストール/アップグレード。
- メモリ検索 embedding provider 準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
- ソースインストールチェック（pnpm workspace の不一致、欠落した UI アセット、欠落した tsx バイナリ）。
- 更新された設定 + ウィザードメタデータを書き込み。

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、および **Clear Grounded** アクションがあります。これらのアクションは Gateway の doctor スタイル RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** は、アクティブな workspace 内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行し、取り消し可能な backfill エントリを `DREAMS.md` に書き込みます。
- **Reset** は、マークされた backfill diary エントリのみを `DREAMS.md` から削除します。
- **Clear Grounded** は、過去の再生から来ており、まだライブの recall や日次サポートが蓄積されていない、ステージ済みの grounded 専用短期エントリのみを削除します。

これらのアクションだけでは実行**しない**こと:

- `MEMORY.md` は編集しません
- 完全な doctor 移行は実行しません
- 先にステージ済み CLI パスを明示的に実行しない限り、grounded 候補をライブ短期昇格ストアへ自動的にステージしません

grounded な過去再生を通常の deep promotion レーンに反映させたい場合は、代わりに CLI フローを使用してください:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded な durable 候補を短期 Dreaming ストアにステージします。

## 詳細な動作と理由

### 0) 任意の更新（git インストール）

これが git checkout で、doctor が対話モードで実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提案します。

### 1) 設定の正規化

設定にレガシーな値の形が含まれている場合（たとえば channel 固有の override がない `messages.ackReaction`）、doctor はそれらを現在のスキーマに正規化します。

これにはレガシーな Talk フラットフィールドも含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形を provider map に書き換えます。

### 2) レガシー設定キーの移行

設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` を実行するよう求めます。

doctor は次を行います:

- 見つかったレガシーキーを説明します。
- 適用した移行を表示します。
- `~/.openclaw/openclaw.json` を更新済みスキーマで書き換えます。

Gateway も、レガシー設定形式を検出すると起動時に doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストア移行は `openclaw doctor --fix` で処理されます。

現在の移行:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → トップレベル `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- 名前付き `accounts` を持つ channel で、単一アカウント向けのトップレベル channel 値が残っている場合、それらのアカウントスコープ値をその channel 用に選ばれた昇格済みアカウントへ移動します（ほとんどの channel では `accounts.default`、Matrix では既存の一致する named/default target を維持できます）
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- `browser.relayBindHost` を削除（レガシー extension relay 設定）

doctor の警告には、複数アカウント channel 向けのデフォルトアカウント案内も含まれます:

- 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
- `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor は警告し、設定済みアカウント ID を一覧表示します。

### 2b) OpenCode プロバイダーの上書き

`models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きします。  
これにより、モデルが誤った API に強制されたり、コストが 0 になったりする可能性があります。doctor は、上書きを削除してモデルごとの API ルーティング + コストを復元できるよう警告します。

### 2c) Browser 移行と Chrome MCP 準備状況

browser 設定がまだ削除済みの Chrome 拡張パスを指している場合、doctor はそれを現在の host-local Chrome MCP attach モデルに正規化します:

- `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
- `browser.relayBindHost` は削除されます

doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、host-local Chrome MCP パスも監査します:

- デフォルト auto-connect プロファイル向けに、同じホストに Google Chrome がインストールされているかを確認します
- 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
- browser inspect ページでリモートデバッグを有効にするよう通知します（たとえば `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

doctor は Chrome 側の設定を自動で有効にはできません。host-local Chrome MCP には引き続き次が必要です:

- Gateway/node ホスト上の Chromium ベース browser 144+
- ローカルで実行中の browser
- その browser で有効化されたリモートデバッグ
- browser で最初の attach 同意プロンプトを承認すること

ここでの準備状況は、ローカル attach の前提条件のみについてです。existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き managed browser または raw CDP プロファイルが必要です。

このチェックは Docker、sandbox、remote-browser、または他の headless フローには**適用されません**。それらは引き続き raw CDP を使用します。

### 2d) OAuth TLS 前提条件

OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI の認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるかを確認します。プローブが証明書エラー（たとえば `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを表示します。Homebrew の Node を使う macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` を付けると、Gateway が正常でもプローブを実行します。

### 2c) Codex OAuth プロバイダーの上書き

以前にレガシーな OpenAI transport 設定を `models.providers.openai-codex` の下に追加している場合、それらは新しいリリースで自動的に使われる組み込み Codex OAuth プロバイダーパスをシャドーイングする可能性があります。doctor は、Codex OAuth と一緒にそれらの古い transport 設定を検出したときに警告を出すため、古い transport override を削除または書き換えて、組み込みの routing/fallback 動作を復元できます。カスタム proxy と header のみの override は引き続きサポートされており、この警告は発生しません。

### 3) レガシー状態移行（ディスクレイアウト）

doctor は古いディスク上のレイアウトを現在の構造に移行できます:

- セッションストア + transcript:
  - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
- agent dir:
  - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
- WhatsApp 認証状態（Baileys）:
  - レガシーな `~/.openclaw/credentials/*.json`（`oauth.json` を除く）
  - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトの account id: `default`）

これらの移行はベストエフォートかつ冪等です。doctor は、バックアップとしてレガシーフォルダーを残した場合に警告を出します。Gateway/CLI も起動時にレガシーな sessions + agent dir を自動移行するため、履歴/認証/モデルは手動で doctor を実行しなくても agent ごとのパスに収まります。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk provider/provider-map の正規化は構造的同値性で比較されるようになったため、キー順だけの差分では no-op の `doctor --fix` 変更が繰り返し発生しなくなりました。

### 3a) レガシー plugin manifest 移行

doctor は、インストール済みのすべての plugin manifest をスキャンして、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトに移し、manifest ファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、レガシーキーはデータを重複させずに削除されます。

### 3b) レガシー Cron ストア移行

doctor は Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、または override されている場合は `cron.store`）もチェックし、scheduler が互換性のためにまだ受け入れている古いジョブ形式を探します。

現在の Cron クリーンアップには次が含まれます:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- トップレベルの payload フィールド（`message`、`model`、`thinking`、...）→ `payload`
- トップレベルの delivery フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
- payload `provider` の delivery alias → 明示的な `delivery.channel`
- 単純なレガシー `notify: true` Webhook フォールバックジョブ → 明示的な `delivery.mode="webhook"` と `delivery.to=cron.webhook`

doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシーな notify フォールバックと既存の非 Webhook delivery モードを組み合わせている場合、doctor は警告を出し、そのジョブは手動レビュー用に残します。

### 3c) セッションロックのクリーンアップ

doctor は各 agent セッションディレクトリをスキャンして、stale な書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、次を報告します: パス、PID、その PID がまだ生きているか、ロックの経過時間、および stale と見なされるかどうか（PID が死んでいる、または 30 分より古い）。`--fix` / `--repair` モードでは stale なロックファイルを自動的に削除します。それ以外ではメモを表示し、`--fix` を付けて再実行するよう案内します。

### 4) 状態整合性チェック（セッション永続化、ルーティング、安全性）

状態ディレクトリは運用上の中枢です。これが失われると、セッション、認証情報、ログ、設定も失います（別の場所にバックアップがない限り）。

doctor は次をチェックします:

- **状態ディレクトリ欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、失われたデータは復元できないことを通知します。
- **状態ディレクトリ権限**: 書き込み可能か検証し、権限修復を提案します（owner/group の不一致が検出された場合は `chown` のヒントも表示します）。
- **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期バックエンドのパスは I/O が遅くなり、lock/sync race の原因になるためです。
- **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` のマウントソースに解決される場合に警告します。SD または eMMC バックのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗も早いためです。
- **セッションディレクトリ欠落**: `sessions/` と session store ディレクトリは、履歴を保持し `ENOENT` クラッシュを避けるために必要です。
- **Transcript 不一致**: 最近のセッションエントリに対応する transcript ファイルがない場合に警告します。
- **メインセッションの「1 行 JSONL」**: メイン transcript が 1 行しかない場合を検出します（履歴が蓄積されていません）。
- **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーが異なる home ディレクトリに存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分断される可能性があります）。
- **リモートモード通知**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
- **設定ファイル権限**: `~/.openclaw/openclaw.json` が group/world 読み取り可能な場合に警告し、`600` への制限を提案します。

### 5) モデル認証ヘルス（OAuth の有効期限）

doctor は auth store 内の OAuth プロファイルを検査し、トークンの期限切れが近い、または期限切れである場合に警告し、安全な場合には更新できます。Anthropic の OAuth/token プロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。  
更新プロンプトは対話実行（TTY）の場合にのみ表示されます。`--non-interactive` では更新試行をスキップします。

OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

doctor は、一時的に利用できない auth プロファイルについても報告します。理由は次のとおりです:

- 短い cooldown（rate limit/timeout/auth failure）
- 長い無効化（billing/credit failure）

### 6) Hooks モデル検証

`hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと allowlist に照らして検証し、解決できない、または許可されていない場合に警告します。

### 7) sandbox image 修復

サンドボックスが有効な場合、doctor は Docker イメージをチェックし、現在のイメージが見つからない場合はビルドまたはレガシー名への切り替えを提案します。

### 7b) bundled plugin ランタイム依存関係

doctor は、現在の設定でアクティブか、bundled manifest のデフォルトで有効な bundled plugin に対してのみランタイム依存関係を検証します。たとえば `plugins.entries.discord.enabled: true`、レガシーな `channels.discord.enabled: true`、またはデフォルト有効の bundled provider です。いずれかが不足している場合、doctor はパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでそれらをインストールします。外部 plugin は引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctor は任意の plugin パスに対して依存関係をインストールしません。

Gateway とローカル CLI も、bundled plugin を import する前に、必要に応じてアクティブな bundled plugin のランタイム依存関係を修復できます。これらのインストールは plugin ランタイム install root に限定され、scripts 無効で実行され、package lock は書き込まず、install-root lock によって保護されます。これにより、CLI や Gateway の同時起動が同じ `node_modules` ツリーを同時に変更することを防ぎます。

### 8) Gateway service の移行とクリーンアップヒント

doctor はレガシーな Gateway service（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートで OpenClaw service をインストールすることを提案します。また、追加の Gateway 風 service をスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きの OpenClaw Gateway service は第一級として扱われ、「追加」とは見なされません。

### 8b) 起動時 Matrix 移行

Matrix channel account に保留中または実行可能なレガシー状態移行がある場合、doctor（`--fix` / `--repair` モード）は移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します: レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。

### 8c) デバイスペアリングと認証ドリフト

doctor は、通常のヘルスパスの一部としてデバイスペアリング状態を検査するようになりました。

報告内容:

- 初回ペアリング要求の保留
- すでにペア済みのデバイスに対する role アップグレードの保留
- すでにペア済みのデバイスに対する scope アップグレードの保留
- デバイス id は一致しているがデバイス identity が承認済みレコードと一致しなくなった場合の公開鍵不一致修復
- 承認済み role に対するアクティブトークンがない paired record
- 承認済みペアリングベースラインの外に scope がずれている paired token
- Gateway 側のトークンローテーションより前の、または古い scope メタデータを持つ、現在のマシン向けローカルキャッシュ済み device-token エントリ

doctor はペア要求を自動承認したり、device token を自動ローテーションしたりはしません。代わりに、正確な次の手順を表示します:

- 保留中の要求を `openclaw devices list` で確認
- 正確な要求を `openclaw devices approve <requestId>` で承認
- 新しいトークンを `openclaw devices rotate --device <deviceId> --role <role>` でローテーション
- 古いレコードを `openclaw devices remove <deviceId>` で削除して再承認

これにより、「すでにペア済みなのに、まだペアリングが必要と表示される」という一般的な問題を解消します。doctor は現在、初回ペアリング、保留中の role/scope アップグレード、および stale な token/device-identity ドリフトを区別します。

### 9) セキュリティ警告

doctor は、プロバイダーが allowlist なしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。

### 10) systemd linger（Linux）

systemd ユーザー service として実行されている場合、doctor は logout 後も Gateway が生き続けるよう lingering が有効であることを確認します。

### 11) Workspace の状態（Skills、plugin、レガシーディレクトリ）

doctor は、デフォルト agent の workspace 状態の概要を表示します:

- **Skills の状態**: eligible、requirements 不足、allowlist-blocked の Skills 数。
- **レガシー workspace ディレクトリ**: `~/openclaw` または他のレガシー workspace ディレクトリが現在の workspace と並存している場合に警告します。
- **plugin の状態**: 有効/無効/エラーの plugin 数を集計し、エラーがある plugin の plugin ID を一覧表示し、bundle plugin capabilities を報告します。
- **plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugin を検出します。
- **plugin 診断**: plugin registry がロード時に出した警告やエラーを表示します。

### 11b) bootstrap ファイルサイズ

doctor は、workspace bootstrap ファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入されるコンテキストファイル）が、設定された文字数予算に近いか、または超えているかをチェックします。ファイルごとの生文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、および総注入文字数の総予算に対する比率を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整に関するヒントを表示します。

### 11c) シェル補完

doctor は、現在のシェル（zsh、bash、fish、または PowerShell）でタブ補完がインストールされているかをチェックします:

- シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、doctor はそれをより高速なキャッシュファイル方式にアップグレードします。
- プロファイルで補完が設定されているのにキャッシュファイルが存在しない場合、doctor は自動的にキャッシュを再生成します。
- 補完がまったく設定されていない場合、doctor はそのインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

### 12) Gateway 認証チェック（ローカルトークン）

doctor はローカル Gateway のトークン認証準備状況をチェックします。

- トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctor は生成を提案します。
- `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告を出し、平文で上書きしません。
- `openclaw doctor --generate-gateway-token` は、token SecretRef が設定されていない場合にのみ生成を強制します。

### 12b) 読み取り専用の SecretRef 対応修復

一部の修復フローでは、ランタイムの fail-fast 挙動を弱めずに、設定済み認証情報を調べる必要があります。

- `openclaw doctor --fix` は現在、対象を絞った設定修復のために、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使用します。
- 例: Telegram の `allowFrom` / `groupAllowFrom` における `@username` 修復では、利用可能な場合に設定済み bot 認証情報の使用を試みます。
- Telegram bot トークンが SecretRef 経由で設定されているが現在のコマンドパスでは利用できない場合、doctor はその認証情報が「設定済みだが利用不可」であると報告し、クラッシュしたりトークンが欠落していると誤報したりせずに自動解決をスキップします。

### 13) Gateway ヘルスチェック + 再起動

doctor はヘルスチェックを実行し、Gateway が不健全に見える場合は再起動を提案します。

### 13b) メモリ検索の準備状況

doctor は、設定されたメモリ検索 embedding provider がデフォルト agent で準備完了かどうかをチェックします。動作は設定された backend と provider に応じて異なります:

- **QMD backend**: `qmd` バイナリが利用可能で起動可能かをプローブします。利用できない場合は、npm パッケージと手動バイナリパス指定を含む修正ガイダンスを表示します。
- **明示的なローカル provider**: ローカルモデルファイルまたは認識可能なリモート/ダウンロード可能モデル URL の存在を確認します。見つからない場合は、リモート provider への切り替えを提案します。
- **明示的なリモート provider**（`openai`、`voyage` など）: 環境または auth store に API キーが存在するか検証します。ない場合は、実行可能な修正ヒントを表示します。
- **自動 provider**: まずローカルモデルの可用性を確認し、その後自動選択順に各リモート provider を試します。

Gateway プローブ結果が利用できる場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と相互参照し、差異があれば指摘します。

ランタイムで embedding の準備状況を確認するには `openclaw memory status --deep` を使用してください。

### 14) channel ステータス警告

Gateway が正常なら、doctor は channel ステータスプローブを実行し、推奨される修正とともに警告を報告します。

### 15) supervisor 設定の監査 + 修復

doctor は、インストール済みの supervisor 設定（launchd/systemd/schtasks）に、欠落または古くなったデフォルト（たとえば systemd の network-online 依存関係や再起動遅延）がないかをチェックします。不一致を見つけると、更新を推奨し、service ファイル/タスクを現在のデフォルトに書き換えることができます。

注意点:

- `openclaw doctor` は supervisor 設定を書き換える前に確認を求めます。
- `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
- `openclaw doctor --repair` は推奨される修正をプロンプトなしで適用します。
- `openclaw doctor --repair --force` はカスタム supervisor 設定を上書きします。
- トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor の service install/repair は SecretRef を検証しますが、解決済みの平文トークン値を supervisor service 環境メタデータに永続化しません。
- トークン認証でトークンが必要で、設定された token SecretRef が未解決の場合、doctor は install/repair パスをブロックし、実行可能なガイダンスを表示します。
- `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて `gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまで install/repair をブロックします。
- Linux の user-systemd unit では、doctor のトークンドリフトチェックに現在 `Environment=` と `EnvironmentFile=` の両方のソースが含まれ、service 認証メタデータとの比較に使われます。
- `openclaw gateway install --force` を使えば、いつでも完全な書き換えを強制できます。

### 16) Gateway ランタイム + ポート診断

doctor は service ランタイム（PID、最後の終了ステータス）を検査し、service はインストール済みだが実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート競合もチェックし、原因として考えられるもの（Gateway がすでに実行中、SSH トンネル）を報告します。

### 17) Gateway ランタイムのベストプラクティス

doctor は、Gateway service が Bun 上で実行されている場合、または version-manager 管理の Node パス（`nvm`、`fnm`、`volta`、`asdf` など）を使っている場合に警告します。WhatsApp と Telegram channel には Node が必要で、version-manager のパスは service がシェル初期化を読み込まないため、アップグレード後に壊れることがあります。利用可能であれば、doctor はシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

### 18) 設定の書き込み + ウィザードメタデータ

doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを記録します。

### 19) Workspace のヒント（バックアップ + メモリシステム）

doctor は、workspace メモリシステムが存在しない場合にそれを提案し、workspace がまだ git 管理下にない場合はバックアップのヒントを表示します。

workspace 構造と git バックアップ（推奨: 非公開 GitHub または GitLab）の完全なガイドについては [/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

## 関連

- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)
- [Gateway ランブック](/ja-JP/gateway)

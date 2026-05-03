---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-03T21:32:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20b2cb3c3cd88e01050cb285a08a020603642439bd35668b7414360801fc03ff
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定や状態を修正し、健全性をチェックし、実行可能な修復手順を提示します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスおよび自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動、サービス、サンドボックスの修復手順も含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトを表示せずに推奨修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    積極的な修復も適用します（カスタムのスーパーバイザー設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動、サービス、サンドボックスの操作はスキップします。レガシー状態の移行は検出時に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（要約）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマのほうが新しい場合は Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills 状態の概要（対象、欠落、ブロック）と Plugin 状態。

  </Accordion>
  <Accordion title="Config and migrations">
    - レガシー値向けの設定正規化。
    - レガシーなフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書きの警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth のシャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向けの OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的だが、ツールポリシーがまだワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーなディスク上状態の移行（セッション、エージェントディレクトリ、WhatsApp 認証）。
    - レガシー Plugin マニフェスト契約キーの移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー Cron ストアの移行（`jobId`, `schedule.cron`, トップレベルの配信/ペイロードフィールド、ペイロード `provider`, 単純な `notify: true` Webhook フォールバックジョブ）。
    - レガシーエージェントランタイムポリシーの `agents.defaults.agentRuntime` および `agents.list[].agentRuntime` への移行。
    - Plugin が有効な場合の古い Plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="State and integrity">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複プロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動回復トゥームストーン検出。`--fix` により古い中止済み回復フラグを消去でき、起動時に子を再起動中止済みとして扱い続けないようにします。
    - 状態の整合性と権限のチェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカルで実行している場合の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth 有効期限をチェックし、期限が近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行中でない、キャッシュされた launchd ラベル）。
    - チャンネル状態の警告（実行中の Gateway からプローブ）。
    - 任意の修復を伴うスーパーバイザー設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新中にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - オープン DM ポリシーに関するセキュリティ警告。
    - local token モード向けの Gateway 認証チェック（トークンソースが存在しない場合はトークン生成を提案します。トークン SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペアリング要求、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのドリフト、ペアリング済みレコードの認証ドリフト）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux での systemd linger チェック。
    - ワークスペースブートストラップファイルのサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - デフォルトエージェント向け Skills 準備状況チェック。bin、env、config、OS 要件が欠落している許可済み Skills を報告し、`--fix` で `skills.entries` 内の利用不可 Skills を無効化できます。
    - シェル補完の状態チェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、UI アセット欠落、tsx バイナリ欠落）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI Dreams シーンには、grounded dreaming ワークフロー向けの **バックフィル**、**リセット**、**Grounded をクリア** アクションがあります。これらのアクションは Gateway の doctor 形式 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **バックフィル** はアクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM 日記パスを実行し、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。
- **リセット** は、マークされたそれらのバックフィル日記エントリだけを `DREAMS.md` から削除します。
- **Grounded をクリア** は、過去のリプレイから来ており、まだライブリコールや日次サポートが蓄積されていない、ステージ済みの grounded 専用短期エントリだけを削除します。

単独では実行**しない**こと:

- `MEMORY.md` は編集しません
- doctor の完全な移行は実行しません
- 先にステージ済み CLI パスを明示的に実行しない限り、grounded 候補をライブ短期プロモーションストアに自動ステージしません

grounded な過去リプレイを通常の深いプロモーションレーンに反映したい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded な永続候補を短期 Dreaming ストアにステージします。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    これが git チェックアウトで、doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. Config normalization">
    設定にレガシー値の形状（たとえばチャンネル固有の上書きなしの `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシー Talk フラットフィールドも含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形状をプロバイダーマップに書き換えます。

    Doctor は、`plugins.allow` が空でなく、ツールポリシーがワイルドカードまたは Plugin 所有ツールエントリを使用している場合にも警告します。`tools.allow: ["*"]` は実際にロードされる Plugin 由来のツールにのみ一致します。排他的な Plugin 許可リストをバイパスするものではありません。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を実行します。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway も起動時にレガシー設定形式を検出した場合、doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストアの移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - 可視返信ポリシーがない設定済みチャネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシーの `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付きの `accounts` がありながら、単一アカウント用のトップレベルチャネル値が残っているチャネルでは、そのアカウントスコープの値を、そのチャネルで選ばれた昇格先アカウントへ移動します（ほとんどのチャネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトのターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除。低速なプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost`（レガシーの拡張リレー設定）を削除
    - レガシーの `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時も、`api` が将来の値または未知の enum 値に設定されたプロバイダーはフェイルクローズせずにスキップします）

    Doctor の警告には、複数アカウントチャネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2 件以上の `channels.<channel>.accounts` エントリが設定されていて、`channels.<channel>.defaultAccount` または `accounts.default` がない場合、Doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、Doctor は警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。その結果、モデルが誤った API に強制されたり、コストがゼロになったりする可能性があります。Doctor は警告を出すため、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. ブラウザ移行と Chrome MCP の準備状況">
    ブラウザ設定が削除済みの Chrome 拡張パスをまだ指している場合、Doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、Doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザの検査ページ（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）でリモートデバッグを有効にするよう通知します

    Doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースブラウザ 144+
    - ブラウザがローカルで実行されていること
    - そのブラウザでリモートデバッグが有効であること
    - ブラウザで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件だけに関するものです。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロード傍受、バッチアクションなどの高度なルートには、引き続き管理対象ブラウザまたは raw CDP プロファイルが必要です。

    このチェックは、Docker、sandbox、remote-browser、その他のヘッドレスフローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、Doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、Doctor はプラットフォーム固有の修正ガイダンスを表示します。Homebrew Node を使用する macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシーの OpenAI トランスポート設定を追加していた場合、新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを隠してしまう可能性があります。Doctor は、Codex OAuth とともに古いトランスポート設定を検出すると警告するため、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされており、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、Doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかどうかも確認します。この組み合わせは PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブ Codex app-server ハーネスと混同しやすいものです。Doctor は警告し、明示的な app-server 形状を示します: `openai/*` と `agentRuntime.id: "codex"`、または `OPENCLAW_AGENT_RUNTIME=codex`。

    Doctor はこれを自動修復しません。どちらのルートも有効だからです。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナーを通じて Codex OAuth/サブスクリプション認証を使用する」ことを意味します。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込みターンをネイティブ Codex app-server 経由で実行する」ことを意味します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集してください。PI Codex OAuth が意図的な場合は、警告をそのままにしてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は古いディスク上レイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシーの `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。Doctor はバックアップとしてレガシーフォルダーを残す場合、警告を出します。Gateway/CLI も起動時にレガシーのセッションとエージェントディレクトリを自動移行するため、履歴/認証/モデルは手動で Doctor を実行しなくてもエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分では no-op の `doctor --fix` 変更が繰り返し発生しなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    Doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを複製せずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    Doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、またはオーバーライド時は `cron.store`）も確認し、スケジューラーが互換性のためにまだ受け入れる古いジョブ形状を検出します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...） → `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...） → `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は、動作を変更せずに移行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシーの notify フォールバックと既存の非 webhook 配信モードを組み合わせている場合、Doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` をまだ呼び出している場合にも Doctor は警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスへ到達できない場合に `~/.openclaw/logs/whatsapp-health.log` へ誤った `Gateway inactive` メッセージを書き込む可能性があります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、各エージェントセッションディレクトリをスキャンして、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（終了した PID、または 30 分超過）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、エージェントセッションの JSONL ファイルをスキャンして、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を探します。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟ブランチです。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブなブランチへ書き換えるため、Gateway 履歴とメモリリーダーに重複ターンが表示されなくなります。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    Doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 壊滅的な状態損失について警告し、ディレクトリを再作成するか確認し、失われたデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` のヒントを出します）。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期バックアップ付きパスは I/O を遅くし、ロック/同期の競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC バックアップのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗が早くなる可能性があるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルがない場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合（履歴が蓄積されていない）にフラグを立てます。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 期限切れ）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンの経路を提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` は更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めている場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

    Doctor は次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジットの失敗）

  </Accordion>
  <Accordion title="6. フックモデルの検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージの修復">
    サンドボックスが有効な場合、doctor は Docker イメージをチェックし、現在のイメージが存在しない場合はビルドするか、レガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードからのパッケージローカルな残骸が含まれます。

    Doctor は、設定がダウンロード可能 Plugin を参照しているものの、ローカル Plugin レジストリで見つからない場合、それらを再インストールすることもできます。2026.5.2 のバンドル Plugin 外部化では、doctor は既存の設定がすでに使用しているダウンロード可能 Plugin を自動的にインストールし、その後 `meta.lastTouchedVersion` に依存して、そのリリース処理を一度だけ実行します。Gateway 起動と設定の再読み込みではパッケージマネージャーは実行されません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使って OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「余分」としてはフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落している一方で、システムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で調査してから、重複を削除するか、システムのスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対処可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常の健全性パスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロール昇格
    - すでにペアリング済みのデバイスに対する保留中のスコープ昇格
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールの有効なトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - Gateway 側のトークンローテーションより前のもの、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    Doctor はペア要求の自動承認やデバイストークンの自動ローテーションを行いません。代わりに、正確な次の手順を表示します。

    - `openclaw devices list` で保留中の要求を調査する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、一般的な「すでにペアリング済みなのにまだペアリング必須になる」抜け穴が解消されます。doctor は、初回ペアリング、保留中のロール/スコープ昇格、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開放されている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が生存し続けるよう linger が有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skills の状態**: 対象、要件不足、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin の状態**: 有効/無効/エラーの Plugin 数を数えます。エラーがある場合は Plugin ID を列挙します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性の問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリによって発行された読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入コンテキストファイル）が、設定された文字数予算に近いか超過しているかをチェックします。ファイルごとの生の文字数と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が総予算に占める割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落しているチャネル Plugin を削除すると、その Plugin を参照していた未解決のチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` のオーバーライドです。これにより、チャネルランタイムがなくなっているのに設定がまだ Gateway にバインドを要求する Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを確認します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状況をチェックします。

    - トークンモードでトークンが必要だが、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象設定修復に対して、status 系コマンドと同じ読み取り専用 SecretRef 要約モデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合は設定済み bot 認証情報を使おうとします。
    - Telegram bot トークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報したりする代わりに、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が正常でないように見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで使用可能かどうかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかどうかを検査します。できない場合は、npm パッケージや手動のバイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識可能なリモート/ダウンロード可能なモデル URL を確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。見つからない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後自動選択順に各リモートプロバイダーを試します。

    キャッシュ済みの Gateway 検査結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用してください。

    実行時の埋め込み準備状況を検証するには、`openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータス検査を実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注意:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` は、デフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は、推奨される修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` は、カスタムのスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスのライフサイクルについて doctor を読み取り専用に保ちます。サービスの健全性は引き続き報告し、サービス以外の修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントのメタデータを書き換えません。また、重複サービスのスキャン中に非アクティブな非レガシーの追加 Gateway 風ユニットを無視するため、補助サービスファイルによるクリーンアップノイズは発生しません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef を解決できない場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定が新しいバージョンで最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使用すれば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされているにもかかわらず実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）でポート競合がないか確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合、doctor は警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーするのではなく、標準的なシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。そのため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリによって、どの Node 子プロセスが解決されるかは変わりません。Linux サービスは、明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを引き続き保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータをスタンプします。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（プライベート GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

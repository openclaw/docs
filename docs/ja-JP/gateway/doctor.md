---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定の移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-04-30T16:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`はOpenClawの修復 + 移行ツールです。古い設定/状態を修正し、健全性をチェックし、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスモードと自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックス修復手順も含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトを表示せずに推奨される修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    強力な修復も適用します（カスタム supervisor 設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加のGatewayインストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - gitインストール向けの任意の事前更新（対話時のみ）。
    - UIプロトコル鮮度チェック（プロトコルスキーマが新しい場合にControl UIを再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skillsステータス概要（対象/欠落/ブロック）とPluginステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな`talk.*`フィールドから`talk.provider` + `talk.providers.<provider>`へのTalk設定移行。
    - レガシーChrome拡張機能設定とChrome MCP準備状況のブラウザー移行チェック。
    - OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuthシャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuthプロファイル向けOAuth TLS前提条件チェック。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp認証）。
    - レガシーPluginマニフェスト契約キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシーCronストア移行（`jobId`、`schedule.cron`、トップレベルの配信/ペイロードフィールド、ペイロード`provider`、単純な`notify: true` webhookフォールバックジョブ）。
    - レガシーエージェントランタイムポリシーを`agents.defaults.agentRuntime`と`agents.list[].agentRuntime`へ移行。
    - Pluginが有効な場合は古いPlugin設定をクリーンアップします。`plugins.enabled=false`の場合、古いPlugin参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた2026.4.24ビルドによって作成された重複プロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動リカバリ墓標検出。古い中断済みリカバリフラグをクリアして、起動時に子を再起動中断として扱い続けないようにする`--fix`サポート付き。
    - 状態整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth期限切れをチェックし、期限が近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加Gateway検出。
    - Matrixチャネルのレガシー状態移行（`--fix` / `--repair`モード）。
    - Gatewayランタイムチェック（サービスはインストール済みだが実行中ではない、キャッシュ済みlaunchdラベル）。
    - チャネルステータス警告（実行中のGatewayからプローブ）。
    - supervisor設定監査（launchd/systemd/schtasks）と任意の修復。
    - インストールまたは更新中にシェルの`HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`値を取り込んだGatewayサービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gatewayランタイムのベストプラクティスチェック（Node vs Bun、バージョンマネージャーパス）。
    - Gatewayポート衝突診断（デフォルト`18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープンDMポリシーに関するセキュリティ警告。
    - ローカルトークンモード向けGateway認証チェック（トークンソースが存在しない場合はトークン生成を提案します。SecretRefトークン設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリクエスト、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのずれ、ペアリング済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linuxでのsystemd lingerチェック。
    - ワークスペースブートストラップファイルサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
    - ソースインストールチェック（pnpmワークスペース不一致、UIアセット欠落、tsxバイナリ欠落）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UIのバックフィルとリセット

Control UIのDreamsシーンには、グラウンデッドDreamingワークフロー向けに**バックフィル**、**リセット**、**グラウンデッドをクリア**アクションが含まれています。これらのアクションはGatewayのdoctor形式RPCメソッドを使用しますが、`openclaw doctor` CLIの修復/移行の一部では**ありません**。

実行内容:

- **バックフィル**は、アクティブワークスペース内の履歴`memory/YYYY-MM-DD.md`ファイルをスキャンし、グラウンデッドREM日記パスを実行し、可逆バックフィルエントリを`DREAMS.md`に書き込みます。
- **リセット**は、`DREAMS.md`からマークされたバックフィル日記エントリのみを削除します。
- **グラウンデッドをクリア**は、履歴リプレイから来ていて、まだライブリコールや日次サポートが蓄積されていない、ステージ済みのグラウンデッド限定短期エントリのみを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md`を編集しません
- 完全なdoctor移行を実行しません
- 先にステージ済みCLIパスを明示的に実行しない限り、グラウンデッド候補をライブ短期昇格ストアへ自動的にステージしません

グラウンデッド履歴リプレイを通常のディープ昇格レーンに反映したい場合は、代わりにCLIフローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md`をレビュー面として維持しながら、グラウンデッドで永続的な候補を短期Dreamingストアにステージします。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（gitインストール）">
    これがgit checkoutでdoctorが対話的に実行されている場合、doctorを実行する前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャネル固有の上書きがない`messages.ackReaction`）が含まれている場合、doctorはそれらを現在のスキーマへ正規化します。

    これにはレガシーTalkフラットフィールドが含まれます。現在の公開Talk設定は`talk.provider` + `talk.providers.<provider>`です。Doctorは古い`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey`の形をプロバイダーマップへ書き換えます。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor`の実行を求めます。

    Doctorは次を行います。

    - 検出されたレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで`~/.openclaw/openclaw.json`を書き換えます。

    Gatewayもレガシー設定形式を検出すると起動時にdoctor移行を自動実行するため、古い設定は手動介入なしで修復されます。Cronジョブストアの移行は`openclaw doctor --fix`で処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの`bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー`talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"`および`messages.tts.providers.edge` → `messages.tts.provider: "microsoft"`および`messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"`および`plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"`および`providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き`accounts`があるものの、単一アカウントのトップレベルチャネル値が残っているチャネルでは、それらのアカウントスコープ値を、そのチャネルに対して選択された昇格先アカウントへ移動します（ほとんどのチャネルでは`accounts.default`。Matrixは既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm`を削除。低速なプロバイダー/モデルのタイムアウトには`models.providers.<id>.timeoutSeconds`を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost`を削除（レガシー拡張機能リレー設定）
    - レガシー`models.providers.*.api: "openai"` → `"openai-completions"`（Gateway起動時も、`api`が将来または未知のenum値に設定されているプロバイダーは、閉じて失敗するのではなくスキップします）

    Doctor警告には、マルチアカウントチャネル向けのアカウントデフォルトガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor は警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。その結果、モデルが誤った API に強制されたり、コストがゼロになったりすることがあります。doctor は警告を出すため、そのオーバーライドを削除して、モデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP の準備状況">
    ブラウザー設定が削除済みの Chrome 拡張機能パスをまだ指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルに正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を有効にすることはできません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースのブラウザー 144 以降
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザー内の最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみに関するものです。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションなどの高度なルートには、引き続きマネージドブラウザーまたは生の CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他のヘッドレスフローには**適用されません**。それらは引き続き生の CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム別の修正ガイダンスを出力します。macOS で Homebrew Node を使用している場合、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスをそれらが覆い隠すことがあります。doctor は Codex OAuth と並んでそれらの古いトランスポート設定を検出すると警告するため、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかどうかも確認します。この組み合わせは、PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブ Codex アプリサーバーハーネスと混同しやすいものです。doctor は警告し、明示的なアプリサーバー形式を示します: `openai/*` と `agentRuntime.id: "codex"`、または `OPENCLAW_AGENT_RUNTIME=codex`。

    doctor はこれを自動修復しません。どちらのルートも有効だからです。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使う」ことを意味します。
    - `openai/*` + `runtime: "codex"` は「埋め込みターンをネイティブ Codex アプリサーバー経由で実行する」ことを意味します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集してください。PI Codex OAuth が意図したものである場合は、警告をそのままにしてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストアとトランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor はレガシーフォルダーをバックアップとして残す場合、警告を出します。Gateway/CLI も起動時にレガシーのセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても、履歴/認証/モデルはエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序のみの差分では `doctor --fix` の無操作変更が繰り返し発生しなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    doctor は、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）がないか、インストール済み Plugin マニフェストをすべてスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをインプレースで書き換えることを提案します。この移行は冪等です。`contracts` キーに同じ値がすでにある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    doctor は Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、またはオーバーライド時は `cron.store`）について、スケジューラーが互換性のためにまだ受け入れる古いジョブ形状も確認します。

    現在の Cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    doctor は、動作を変更せずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    doctor は、各エージェントセッションディレクトリで古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルをスキャンします。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いと見なされるか（死んだ PID または 30 分超）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` で再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッション JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟がある形状です。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元ファイルの隣にバックアップし、Gateway 履歴とメモリーリーダーが重複ターンを見なくなるよう、トランスクリプトをアクティブブランチへ書き換えます。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います（別の場所にバックアップがない限り）。

    doctor は次を確認します。

    - **状態ディレクトリの欠落**: 破滅的な状態喪失について警告し、ディレクトリの再作成を促し、失われたデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントを出します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期バックアップ付きパスは I/O が遅くなり、ロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースへ解決される場合に警告します。SD または eMMC バックのランダム I/O は、セッションと認証情報の書き込み時に遅く、摩耗が早くなる可能性があるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるため、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッション「1 行 JSONL」**: メイントランスクリプトが 1 行だけの場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: ホームディレクトリ間に複数の `~/.openclaw` フォルダーが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 有効期限）">
    doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合、Anthropic API キーまたは Anthropic セットアップトークンパスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` は更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（例: `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    doctor は、次の理由により一時的に利用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックのモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログおよび許可リストと照合して検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックス画像の修復">
    サンドボックスが有効な場合、doctor は Docker イメージを確認し、現在のイメージが見つからない場合は、ビルドするかレガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. バンドル済みPluginのランタイム依存関係">
    Doctor は、現在の設定でアクティブなバンドル済みプラグイン、またはバンドル済みマニフェストのデフォルトで有効になっているバンドル済みプラグインについてのみ、ランタイム依存関係を検証します。例として、`plugins.entries.discord.enabled: true`、レガシーの `channels.discord.enabled: true`、設定済みの `models.providers.*` / エージェントモデル参照、またはプロバイダー所有権のないデフォルト有効のバンドル済みプラグインがあります。不足しているものがある場合、doctor はパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでそれらをインストールします。外部プラグインは引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctor は任意のプラグインパスに対して依存関係をインストールしません。

    doctor の修復中、バンドル済みランタイム依存関係の npm インストールは、TTY セッションではスピナー進捗を、パイプまたはヘッドレス出力では定期的な行単位の進捗を報告します。Gateway とローカル CLI は、バンドル済みプラグインをインポートする前に、必要に応じてアクティブなバンドル済みプラグインのランタイム依存関係も修復できます。これらのインストールはプラグインランタイムのインストールルートにスコープされ、スクリプトを無効化して実行され、パッケージロックを書き込まず、インストールルートのロックで保護されるため、同時実行される CLI または Gateway の起動が同じ `node_modules` ツリーを同時に変更することはありません。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップのヒント">
    Doctor はレガシーの gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。また、追加の gateway 風サービスをスキャンして、クリーンアップのヒントを出力することもできます。プロファイル名付きの OpenClaw gateway サービスは第一級のものとみなされ、「extra」としてフラグされません。

    Linux では、ユーザーレベルの gateway サービスが存在しない一方で、システムレベルの OpenClaw gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認してから、重複を削除するか、システムのスーパーバイザーが gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証のずれ">
    Doctor は通常のヘルスパスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった場合の公開鍵不一致修復
    - 承認済みロールのアクティブなトークンがないペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へずれたペアリング済みトークン
    - gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリング要求を自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を出力します。

    - `openclaw devices list` で保留中の要求を確認する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのに、まだペアリングが必要と表示される」穴が塞がれます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のずれを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開放されている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も gateway が稼働し続けるよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（skills、プラグイン、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 対象、要件不足、許可リストでブロックされた Skills の数。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **プラグイン状態**: 有効/無効/エラーのプラグイン数を数えます。エラーがある場合はプラグイン ID を列挙します。バンドルプラグインの機能を報告します。
    - **プラグイン互換性警告**: 現在のランタイムとの互換性の問題があるプラグインにフラグを付けます。
    - **プラグイン診断**: プラグインレジストリがロード時に出力した警告またはエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（例: `AGENTS.md`、`CLAUDE.md`、またはその他の注入済みコンテキストファイル）が、設定された文字数予算に近い、または超過していないかを確認します。ファイルごとの生の文字数と注入済み文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、および合計注入文字数を合計予算に対する割合として報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャネルプラグインのクリーンアップ">
    `openclaw doctor --fix` が見つからないチャネルプラグインを削除する場合、そのプラグインを参照していたぶら下がったチャネルスコープ設定も削除します。`channels.<id>` エントリ、チャネル名を指定した heartbeat ターゲット、および `agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているのに設定が gateway にそれへのバインドを求め続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかを確認します。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュ済みファイルのバリアントへアップグレードします。
    - 補完がプロファイルに設定されているがキャッシュファイルがない場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（インタラクティブモードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル gateway トークン認証の準備状態を確認します。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、ステータス系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合、設定済みのボット認証情報を使用しようとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているが、現在のコマンドパスで利用できない場合、doctor はその認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンがないと誤報告したりする代わりに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントに対して準備できているかを確認します。動作は設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かをプローブします。そうでない場合は、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。不足している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。不足している場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順に各リモートプロバイダーを試します。

    キャッシュ済み gateway プローブ結果が利用可能な場合（チェック時点で gateway が正常だった場合）、doctor はその結果を CLI から見える設定と相互参照し、差異があれば通知します。doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細なメモリ状態コマンドを使用してください。

    実行時の埋め込み準備状態を検証するには、`openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャネル状態の警告">
    gateway が正常な場合、doctor はチャネル状態プローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）について、欠落または古くなったデフォルト（例: systemd の network-online 依存関係と再起動遅延）を確認します。不一致を見つけた場合、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` はプロンプトなしで推奨修正を適用します。
    - `openclaw doctor --repair --force` はカスタムのスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は Gateway サービスのライフサイクルについて doctor を読み取り専用のままにします。サービスの健全性は引き続き報告し、サービス以外の修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービスのスキャン中に非アクティブで非レガシーの追加 Gateway 風ユニットを無視するため、関連サービスファイルによってクリーンアップのノイズが発生しません。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータには永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` に固定されている場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証にトークンが必要で、設定済みのトークン SecretRef が解決されていない場合、doctor は実行可能なガイダンスを示してインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使えば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルトは `18789`）でポート競合がないか確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャネルには Node が必要であり、バージョンマネージャーのパスは、サービスがシェル初期化を読み込まないため、アップグレード後に壊れる可能性があります。Doctor は、利用可能な場合はシステムの Node インストール（Homebrew/apt/choco）へ移行するよう提案します。

    新規インストールまたは修復されたサービスは、明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、そのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。これにより、生成されたスーパーバイザー PATH が、後で doctor が実行する同じ最小 PATH 監査と整合します。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータをスタンプします。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（プライベート GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

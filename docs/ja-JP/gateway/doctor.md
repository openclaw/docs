---
read_when:
    - Doctorの移行を追加または変更する
    - 破壊的な設定変更を導入する
sidebarTitle: Doctor
summary: 'Doctorコマンド: ヘルスチェック、設定移行、修復手順'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:29:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` は、OpenClawの修復 + 移行ツールです。古い設定/状態を修正し、ヘルスを確認し、実行可能な修復手順を提示します。

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

    プロンプトなしでデフォルトを受け入れます（該当する場合、再起動/サービス/サンドボックス修復手順も含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    推奨される修復をプロンプトなしで適用します（安全な範囲で修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    強力な修復も適用します（カスタムsupervisor設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみ適用します（設定の正規化 + ディスク上の状態移動）。人による確認が必要な再起動/サービス/サンドボックス操作はスキップします。従来の状態移行は、検出されると自動で実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加のgatewayインストールがないかシステムサービスをスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込む前に変更内容を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 何をするか（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、アップデート">
    - gitインストール向けの任意の事前更新（対話モードのみ）。
    - UIプロトコルの新しさチェック（プロトコルスキーマが新しい場合はControl UIを再ビルド）。
    - ヘルスチェック + 再起動プロンプト。
    - Skillsの状態サマリー（対象/不足/ブロック）とPluginの状態。

  </Accordion>
  <Accordion title="設定と移行">
    - 従来値の設定正規化。
    - 従来のフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` へのTalk設定移行。
    - 従来のChrome拡張設定とChrome MCP準備状況に対するBrowser移行チェック。
    - OpenCodeプロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuthシャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuthプロファイル向けのOAuth TLS前提条件チェック。
    - 従来のオンディスク状態移行（sessions/agent dir/WhatsApp auth）。
    - 従来のPluginマニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 従来のCronストア移行（`jobId`, `schedule.cron`, トップレベルのdelivery/payloadフィールド, payload `provider`, 単純な `notify: true` Webhookフォールバックジョブ）。
    - 従来のagent runtime-policyの `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた2026.4.24ビルドで作成された、重複したprompt-rewriteブランチに対するセッショントランスクリプト修復。
    - 状態の整合性と権限チェック（sessions、transcripts、state dir）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth期限切れを確認し、期限切れが近いトークンを更新でき、auth-profileのクールダウン/無効状態を報告します。
    - 追加のworkspaceディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックス有効時のサンドボックスイメージ修復。
    - 従来サービス移行と追加gateway検出。
    - Matrixチャンネルの従来状態移行（`--fix` / `--repair` モード）。
    - Gatewayランタイムチェック（サービスはインストール済みだが未実行、キャッシュされたlaunchd label）。
    - チャンネル状態警告（実行中のgatewayからプローブ）。
    - Supervisor設定監査（launchd/systemd/schtasks）と任意の修復。
    - Gatewayランタイムのベストプラクティスチェック（Node vs Bun、バージョンマネージャーパス）。
    - Gatewayポート競合診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープンDMポリシーに対するセキュリティ警告。
    - ローカルトークンモード向けのGateway認証チェック（トークンソースが存在しない場合はトークン生成を提案。token SecretRef設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリクエスト、保留中のロール/スコープアップグレード、古いローカルdevice-tokenキャッシュのドリフト、paired-record認証ドリフト）。

  </Accordion>
  <Accordion title="Workspaceとシェル">
    - Linuxでのsystemd lingerチェック。
    - Workspaceブートストラップファイルサイズチェック（コンテキストファイルの切り捨て/制限近接警告）。
    - シェル補完状態チェックと自動インストール/アップグレード。
    - memory search embeddingプロバイダー準備状況チェック（ローカルモデル、リモートAPIキー、またはQMDバイナリ）。
    - ソースインストールチェック（pnpm workspace mismatch、UIアセット欠落、tsxバイナリ欠落）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UIのバックフィルとリセット

Control UIのDreamingシーンには、grounded dreamingワークフロー用の **Backfill**、**Reset**、**Clear Grounded** アクションが含まれています。これらのアクションはgateway doctorスタイルのRPCメソッドを使用しますが、`openclaw doctor` CLIの修復/移行の一部では **ありません**。

これらが行うこと:

- **Backfill** は、アクティブなworkspace内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diaryパスを実行し、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は、それらのマーク付きバックフィルdiaryエントリのみを `DREAMS.md` から削除します。
- **Clear Grounded** は、過去のリプレイから来ており、まだライブrecallや日次サポートが蓄積されていない、ステージ済みのgrounded専用短期エントリのみを削除します。

これら単体では行わないこと:

- `MEMORY.md` は編集しません
- 完全なdoctor移行は実行しません
- 先にステージされたCLIパスを明示的に実行しない限り、grounded候補を自動的にライブ短期昇格ストアへステージしません

groundedな過去リプレイを通常のdeep promotionレーンに反映させたい場合は、代わりにCLIフローを使用してください。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー画面として維持しつつ、grounded durable候補を短期Dreamingストアへステージします。

## 詳細な動作と理由

<AccordionGroup>
  <Accordion title="0. 任意のアップデート（gitインストール）">
    これがgit checkoutで、doctorが対話的に実行されている場合、doctor実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定に従来の値形式（たとえば、チャンネル固有の上書きがない `messages.ackReaction`）が含まれている場合、doctorはそれらを現在のスキーマへ正規化します。

    これには従来のTalkフラットフィールドも含まれます。現在の公開Talk設定は `talk.provider` + `talk.providers.<provider>` です。doctorは古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形式をプロバイダーマップへ書き換えます。

  </Accordion>
  <Accordion title="2. 従来設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` を実行するよう求めます。

    Doctorは次を行います:

    - 見つかった従来キーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gatewayも、従来の設定形式を検出すると起動時にdoctor移行を自動実行するため、古い設定は手動介入なしで修復されます。Cronジョブストア移行は `openclaw doctor --fix` で処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベル `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 従来の `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
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
    - 名前付き `accounts` を持つチャンネルで、単一アカウント用のトップレベルチャンネル値が残っている場合は、それらのアカウントスコープ値を、そのチャンネル向けに昇格されたアカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrixは既存の一致する名前付き/defaultターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除（従来の拡張relay設定）

    Doctorの警告には、複数アカウントチャンネル向けのaccount-defaultガイダンスも含まれます。

    - 2つ以上の `channels.<channel>.accounts` エントリが設定されているのに `channels.<channel>.defaultAccount` または `accounts.default` がない場合、doctorはフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウントIDに設定されている場合、doctorは警告し、設定済みのアカウントIDを一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCodeプロバイダー上書き">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加した場合、`@mariozechner/pi-ai` 由来の組み込みOpenCodeカタログを上書きします。その結果、モデルが誤ったAPIへ強制されたり、コストがゼロになったりする可能性があります。doctorはその上書きを削除して、モデルごとのAPIルーティング + コストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. Browser移行とChrome MCP準備状況">
    Browser設定がまだ削除済みのChrome拡張パスを指している場合、doctorはそれを現在のホストローカルChrome MCP接続モデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    Doctorは、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使っている場合に、ホストローカルのChrome MCP経路も監査します。

    - デフォルトの自動接続プロファイル向けに、同じホストにGoogle Chromeがインストールされているか確認します
    - 検出されたChromeのバージョンを確認し、Chrome 144未満の場合は警告します
    - browser inspectページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, `edge://inspect/#remote-debugging`）

    DoctorがChrome側の設定を有効化することはできません。ホストローカルのChrome MCPには、引き続き次が必要です。

    - gateway/nodeホスト上のChromium系Browser 144以降
    - Browserがローカルで実行中であること
    - そのBrowserでリモートデバッグが有効であること
    - Browser内で最初の接続同意プロンプトを承認すること

    ここでの準備状況は、ローカル接続の前提条件だけを対象にしています。existing-sessionは現在のChrome MCP経路の制限を維持しており、`responsebody`、PDFエクスポート、ダウンロードインターセプト、バッチアクションのような高度な経路には、引き続き管理Browserまたは生のCDPプロファイルが必要です。

    このチェックは、Docker、sandbox、remote-browser、その他のヘッドレスフローには適用されません。これらは引き続き生のCDPを使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS前提条件">
    OpenAI Codex OAuthプロファイルが設定されている場合、doctorはOpenAI認可エンドポイントをプローブして、ローカルのNode/OpenSSL TLSスタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（たとえば `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctorはプラットフォーム固有の修正ガイダンスを表示します。macOSでHomebrew版Nodeを使っている場合、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、gatewayが正常でもこのプローブを実行します。
  </Accordion>
  <Accordion title="2e. Codex OAuthプロバイダー上書き">
    以前に `models.providers.openai-codex` 配下へ従来のOpenAI転送設定を追加していた場合、それにより新しいリリースが自動で使用する組み込みのCodex OAuthプロバイダー経路が隠されることがあります。doctorは、Codex OAuthと一緒にその古い転送設定を検出すると警告を出し、古い転送上書きを削除または書き換えて、組み込みのルーティング/フォールバック動作を復元できるようにします。カスタムプロキシやヘッダーのみの上書きは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin経路の警告">
    バンドルされたCodex Pluginが有効な場合、doctorは `openai-codex/*` のプライマリモデル参照がまだデフォルトのPI runner経由で解決されているかも確認します。この組み合わせは、PI経由でCodex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブのCodex app-serverハーネスと混同しやすいです。doctorは警告を出し、明示的なapp-server形式を案内します: `openai/*` と `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex`。

    どちらの経路も有効なため、doctorはこれを自動修復しません。

    - `openai-codex/*` + PI は「通常のOpenClaw runner経由でCodex OAuth/サブスクリプション認証を使用する」を意味します。
    - `openai/*` + `runtime: "codex"` は「ネイティブのCodex app-serverで埋め込みターンを実行する」を意味します。
    - `/codex ...` は「チャットからネイティブのCodex会話を制御またはバインドする」を意味します。
    - `/acp ...` または `runtime: "acp"` は「外部のACP/acpxアダプターを使用する」を意味します。

    警告が表示された場合は、意図した経路を選び、設定を手動で編集してください。PI Codex OAuthが意図的な場合は、そのまま警告を維持してください。

  </Accordion>
  <Accordion title="3. 従来状態の移行（ディスクレイアウト）">
    Doctorは、古いオンディスクレイアウトを現在の構造へ移行できます。

    - Sessionsストア + transcripts:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - Agent dir:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp認証状態（Baileys）:
      - 従来の `~/.openclaw/credentials/*.json`（`oauth.json` を除く）
      - から `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトのaccount id: `default`）

    これらの移行はベストエフォートかつ冪等です。doctorは、バックアップとして従来フォルダーを残した場合に警告を出します。Gateway/CLIも起動時に従来のsessions + agent dirを自動移行するため、手動でdoctorを実行しなくても履歴/認証/モデルはagent単位のパスへ移動します。WhatsApp認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talkのprovider/provider-map正規化は現在、構造的等価性で比較するため、キー順序だけの差分では no-op の `doctor --fix` 変更が繰り返し発生しなくなりました。

  </Accordion>
  <Accordion title="3a. 従来Pluginマニフェストの移行">
    Doctorは、インストール済みのすべてのPluginマニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを複製せずに従来キーだけが削除されます。
  </Accordion>
  <Accordion title="3b. 従来Cronストアの移行">
    Doctorは、schedulerが互換性のためにまだ受け入れている古いジョブ形式がないか、Cronジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、または上書き時は `cron.store`）も確認します。

    現在のCronクリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのpayloadフィールド（`message`, `model`, `thinking`, ...）→ `payload`
    - トップレベルのdeliveryフィールド（`deliver`, `channel`, `to`, `provider`, ...）→ `delivery`
    - payloadの `provider` deliveryエイリアス → 明示的な `delivery.channel`
    - 単純な従来の `notify: true` Webhookフォールバックジョブ → 明示的な `delivery.mode="webhook"` と `delivery.to=cron.webhook`

    Doctorは、動作を変えずに移行できる場合にのみ、`notify: true` ジョブを自動移行します。ジョブが従来のnotifyフォールバックと既存の非Webhook配信モードを組み合わせている場合、doctorは警告を出し、そのジョブは手動確認用に残します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctorは、異常終了時に残されたファイルである、古い書き込みロックファイルがないか各agentセッションディレクトリをスキャンします。見つかった各ロックファイルについて、次を報告します: パス、PID、そのPIDがまだ生きているか、ロックの経過時間、古いと見なされるかどうか（PIDが死んでいる、または30分以上経過）。`--fix` / `--repair` モードでは、古いロックファイルを自動削除します。それ以外では、注記を表示し、`--fix` を付けて再実行するよう案内します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctorは、2026.4.24のprompt transcript rewriteバグで作られた重複ブランチ形式がないか、agentセッションのJSONLファイルをスキャンします。これは、OpenClaw内部ランタイムコンテキストを含む放棄済みのuserターンと、同じ可視userプロンプトを含むアクティブな兄弟ブランチの組み合わせです。`--fix` / `--repair` モードでは、doctorは影響を受けた各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway履歴やmemoryリーダーが重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の脳幹です。これが消えると、セッション、認証情報、ログ、設定を失います（別の場所にバックアップがない限り）。

    Doctorは次を確認します。

    - **状態ディレクトリの欠落**: 壊滅的な状態損失について警告し、ディレクトリ再作成を提案し、失われたデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能か確認し、権限修復を提案します（所有者/グループ不一致を検出した場合は `chown` のヒントも表示）。
    - **macOSのクラウド同期状態ディレクトリ**: 状態がiCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合、同期ベースのパスはI/O低下やロック/同期競合を引き起こす可能性があるため警告します。
    - **LinuxのSDまたはeMMC状態ディレクトリ**: 状態が `mmcblk*` のマウント元に解決される場合、SDまたはeMMCベースのランダムI/Oは、セッションや認証情報の書き込みで遅くなり、摩耗も早くなる可能性があるため警告します。
    - **セッションディレクトリの欠落**: `sessions/` とセッションストアディレクトリは、履歴を永続化し `ENOENT` クラッシュを避けるために必須です。
    - **トランスクリプト不一致**: 最近のセッションエントリに対応するトランスクリプトファイルが欠けている場合に警告します。
    - **メインセッションの「1行JSONL」**: メイントランスクリプトが1行しかない場合を検出します（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数のホームディレクトリに `~/.openclaw` フォルダーが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分断される可能性があります）。
    - **リモートモードの注意喚起**: `gateway.mode=remote` の場合、doctorはリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth期限切れ）">
    Doctorはauthストア内のOAuthプロファイルを検査し、トークンの期限切れが近い/期限切れである場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic APIキーまたはAnthropic setup-token経路を提案します。更新プロンプトは対話モード（TTY）でのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、または再サインインが必要だとプロバイダーが通知した場合）、doctorは再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

    Doctorはまた、以下の理由で一時的に利用できないauthプロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctorはそのモデル参照をカタログとallowlistに対して検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックスが有効な場合、doctorはDockerイメージを確認し、現在のイメージがないときはビルドまたは従来名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. バンドルPluginのランタイム依存関係">
    Doctorは、現在の設定でアクティブなバンドルPlugin、またはバンドルマニフェストのデフォルトで有効なバンドルPluginについてのみ、ランタイム依存関係を検証します。たとえば `plugins.entries.discord.enabled: true`、従来の `channels.discord.enabled: true`、またはデフォルトで有効なバンドルプロバイダーです。不足がある場合、doctorはパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでそれらをインストールします。外部Pluginは引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctorは任意のPluginパスに対して依存関係をインストールしません。

    GatewayとローカルCLIも、バンドルPluginをimportする前に、必要に応じてアクティブなバンドルPluginのランタイム依存関係を修復できます。これらのインストールはPluginランタイムインストールルートに限定され、スクリプト無効で実行され、package lockは書き込まず、さらにインストールルートロックで保護されているため、同時に実行されたCLIやGateway起動が同じ `node_modules` ツリーを同時に変更することはありません。

  </Accordion>
  <Accordion title="8. Gatewayサービスの移行とクリーンアップのヒント">
    Doctorは従来のgatewayサービス（launchd/systemd/schtasks）を検出し、それらを削除して、現在のgatewayポートを使用するOpenClawサービスをインストールすることを提案します。また、追加のgateway類似サービスをスキャンし、クリーンアップのヒントを表示することもできます。プロファイル名付きのOpenClaw gatewayサービスは第一級のものとして扱われ、「extra」とは判定されません。
  </Accordion>
  <Accordion title="8b. 起動時のMatrix移行">
    Matrixチャンネルアカウントに保留中または対応可能な従来状態移行がある場合、doctor（`--fix` / `--repair` モード）は移行前スナップショットを作成し、その後ベストエフォートで移行手順を実行します: 従来のMatrix状態移行と従来の暗号化状態準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctorは、通常のヘルスチェックの一部としてデバイスペアリング状態も検査するようになりました。

    報告される内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みデバイスに対する保留中のスコープアップグレード
    - デバイスIDは一致しているが、デバイスアイデンティティが承認済みレコードと一致しなくなっている場合の公開鍵不一致修復
    - 承認済みロールに対するアクティブトークンがないペアリング済みレコード
    - 承認済みペアリング基準から外れたスコープを持つペアリング済みトークン
    - 現在のマシン向けのローカルにキャッシュされたdevice-tokenエントリで、gateway側のトークンローテーションより前のもの、または古いスコープメタデータを持つもの

    Doctorは、ペアリクエストを自動承認したり、デバイストークンを自動ローテーションしたりはしません。代わりに、正確な次の手順を表示します。

    - `openclaw devices list` で保留中リクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除し、再承認する

    これにより、「すでにペアリング済みなのに、まだpairing requiredが出る」という一般的な問題を解消します。doctorは現在、初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイスアイデンティティドリフトを区別します。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctorは、プロバイダーがallowlistなしでDMに開かれている場合、またはポリシーが危険な形で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemdユーザーサービスとして実行している場合、doctorはログアウト後もgatewayが生き続けるよう、lingerが有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. Workspaceの状態（Skills、Plugin、従来ディレクトリ）">
    Doctorは、デフォルトagentに対するworkspace状態のサマリーを表示します。

    - **Skillsの状態**: 対象、要件不足、allowlistでブロックされたSkillsの件数。
    - **従来workspaceディレクトリ**: `~/openclaw` や他の従来workspaceディレクトリが現在のworkspaceと並存している場合に警告します。
    - **Pluginの状態**: 有効/無効/エラーのPlugin件数、エラーがあるPlugin IDの一覧、bundle Plugin機能の報告。
    - **Plugin互換性警告**: 現在のランタイムと互換性の問題があるPluginを示します。
    - **Plugin診断**: Pluginレジストリが出した読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctorは、workspaceのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入されるコンテキストファイル）が、設定された文字予算に近いか超えているかを確認します。ファイルごとの生文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、および総予算に対する総注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctorは `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整ヒントを表示します。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctorは、現在のシェル（zsh、bash、fish、またはPowerShell）でタブ補完がインストールされているかを確認します。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、doctorはそれをより高速なキャッシュファイル方式へアップグレードします。
    - プロファイルで補完が設定されているがキャッシュファイルが欠けている場合、doctorは自動でキャッシュを再生成します。
    - 補完がまったく設定されていない場合、doctorはインストールするかを確認します（対話モードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway認証チェック（ローカルトークン）">
    Doctorは、ローカルgatewayのトークン認証準備状況を確認します。

    - トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctorは生成を提案します。
    - `gateway.auth.token` がSecretRef管理だが利用できない場合、doctorは警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、token SecretRefが設定されていない場合にのみ、強制的にトークンを生成します。

  </Accordion>
  <Accordion title="12b. 読み取り専用のSecretRef対応修復">
    一部の修復フローでは、ランタイムのfail-fast動作を弱めずに、設定済み認証情報を検査する必要があります。

    - `openclaw doctor --fix` は現在、ターゲット設定修復のために、status系コマンドと同じ読み取り専用のSecretRefサマリーモデルを使用します。
    - 例: Telegramの `allowFrom` / `groupAllowFrom` の `@username` 修復では、利用可能な場合に設定済みのボット認証情報を使おうとします。
    - TelegramボットトークンがSecretRef経由で設定されているが、現在のコマンド経路で利用できない場合、doctorはその認証情報が「設定済みだが利用不可」であると報告し、クラッシュしたり、トークン欠落と誤報したりせずに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gatewayヘルスチェック + 再起動">
    Doctorはヘルスチェックを実行し、gatewayが不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. Memory searchの準備状況">
    Doctorは、デフォルトagent向けに設定されたmemory search embeddingプロバイダーの準備状況を確認します。動作は、設定されたバックエンドとプロバイダーに依存します。

    - **QMDバックエンド**: `qmd` バイナリが利用可能で起動可能かをプローブします。利用不可の場合は、npmパッケージや手動バイナリパスの選択肢を含む修正ガイダンスを表示します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイルまたは認識可能なリモート/ダウンロード可能モデルURLの有無を確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): 環境変数またはauthストアにAPIキーが存在することを確認します。欠けている場合は、実行可能な修正ヒントを表示します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順に各リモートプロバイダーを試します。

    gatewayプローブ結果が利用可能な場合（チェック時点でgatewayが正常だった場合）、doctorはその結果をCLIから見える設定と突き合わせ、不一致があれば指摘します。

    実行時のembedding準備状況を確認するには `openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャンネル状態の警告">
    gatewayが正常な場合、doctorはチャンネル状態プローブを実行し、推奨修正付きの警告を報告します。
  </Accordion>
  <Accordion title="15. Supervisor設定の監査 + 修復">
    Doctorは、インストール済みのsupervisor設定（launchd/systemd/schtasks）に、欠けているデフォルトや古いデフォルト（例: systemdのnetwork-online依存関係や再起動遅延）がないか確認します。不一致が見つかった場合、更新を推奨し、現在のデフォルトに合わせてサービスファイル/タスクを書き換えることができます。

    注意:

    - `openclaw doctor` はsupervisor設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` はプロンプトなしで推奨修復を適用します。
    - `openclaw doctor --repair --force` はカスタムsupervisor設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、gatewayサービスライフサイクルについてdoctorを読み取り専用に保ちます。サービスの健全性を報告し、サービス以外の修復は実行しますが、外部supervisorがそのライフサイクルを管理しているため、サービスのインストール/開始/再起動/ブートストラップ、supervisor設定の書き換え、従来サービスのクリーンアップはスキップします。
    - トークン認証にトークンが必要で、`gateway.auth.token` がSecretRef管理されている場合、doctorのサービスインストール/修復はSecretRefを検証しますが、解決済みの平文トークン値をsupervisorサービスの環境メタデータへ永続化しません。
    - トークン認証にトークンが必要で、設定済みのtoken SecretRefが未解決の場合、doctorは実行可能なガイダンス付きでインストール/修復経路をブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定されていて、`gateway.auth.mode` が未設定の場合、doctorはモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linuxのuser-systemd unitでは、doctorのトークンドリフトチェックは現在、サービス認証メタデータ比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含みます。
    - 設定がより新しいバージョンによって最後に書き込まれている場合、doctorのサービス修復は、古いOpenClawバイナリからのgatewayサービスの書き換え、停止、再起動を拒否します。詳細は [Gateway troubleshooting](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) を参照してください。
    - `openclaw gateway install --force` を使えば、いつでも完全な再書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gatewayランタイム + ポート診断">
    Doctorはサービスランタイム（PID、直近の終了状態）を検査し、サービスがインストール済みなのに実際には実行されていない場合に警告します。また、gatewayポート（デフォルト `18789`）の競合を確認し、考えられる原因（gatewayがすでに実行中、SSHトンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gatewayランタイムのベストプラクティス">
    Doctorは、gatewayサービスがBun上で動作している場合や、バージョンマネージャーのNodeパス（`nvm`, `fnm`, `volta`, `asdf` など）を使っている場合に警告します。WhatsApp + TelegramチャンネルにはNodeが必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーパスはアップグレード後に壊れることがあります。doctorは、利用可能な場合にシステムNodeインストール（Homebrew/apt/choco）への移行を提案します。
  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctorは設定変更を永続化し、doctor実行を記録するためにウィザードメタデータを記録します。
  </Accordion>
  <Accordion title="19. Workspaceのヒント（バックアップ + memory system）">
    Doctorは、workspace memory systemがない場合に提案し、workspaceがまだgit管理下でない場合はバックアップのヒントを表示します。

    workspace構造とgitバックアップ（推奨: 非公開GitHubまたはGitLab）の完全なガイドは [/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)

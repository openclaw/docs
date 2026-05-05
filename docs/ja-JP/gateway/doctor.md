---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctorコマンド: ヘルスチェック、設定の移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`は OpenClaw の修復 + 移行ツールです。古くなった設定/状態を修正し、健全性を確認し、実行可能な修復手順を提供します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含みます）。

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

    積極的な修復も適用します（カスタム supervisor 設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認したい場合は、まず設定ファイルを開いてください。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマの方が新しい場合に Control UI を再ビルドします）。
    - 健全性チェック + 再起動プロンプト。
    - Skills 状態の要約（対象/欠落/ブロック）と plugin 状態。

  </Accordion>
  <Accordion title="Config and migrations">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的である一方、ツールポリシーが依然としてワイルドカードや plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, シンプルな `notify: true` webhook フォールバックジョブ）。
    - レガシーエージェント runtime-policy の `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - plugins が有効な場合の古い plugin 設定クリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="State and integrity">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドで作成された重複プロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - wedged subagent の再起動リカバリ tombstone 検出。古い中断済みリカバリフラグをクリアして、起動時に child を再起動中断済みとして扱い続けないようにするための `--fix` サポート付き。
    - 状態の整合性と権限チェック（sessions、transcripts、state dir）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth の有効期限を確認し、期限切れが近いトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行されていない、キャッシュされた launchd ラベル）。
    - チャンネル状態警告（実行中の Gateway からプローブ）。
    - local TUI クライアントがまだ実行中の状態で Gateway イベントループの健全性が低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みの local TUI クライアントのみを停止します。
    - 任意修復付き supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - オープンな DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースが存在しない場合はトークン生成を提示します。トークン SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペア要求、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのドリフト、ペアリング済みレコードの認証ドリフト）。

  </Accordion>
  <Accordion title="Workspace and shell">
    - Linux での systemd linger チェック。
    - ワークスペースブートストラップファイルサイズチェック（コンテキストファイルの切り捨て/上限接近警告）。
    - デフォルトエージェント向け Skills 準備状況チェック。bin、env、config、OS 要件が欠落している許可済み skills を報告し、`--fix` で `skills.entries` 内の利用不可 skills を無効化できます。
    - シェル補完状態チェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、UI アセット欠落、tsx バイナリ欠落）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションが含まれています。これらのアクションは gateway doctor 形式の RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブなワークスペース内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行し、取り消し可能なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は、`DREAMS.md` からマークされたバックフィル diary エントリのみを削除します。
- **Clear Grounded** は、履歴再生から来て、まだ live recall や daily support を蓄積していない、ステージ済みの grounded-only 短期エントリのみを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md` を編集しません
- 完全な doctor 移行を実行しません
- ステージ済み CLI パスを先に明示的に実行しない限り、grounded 候補を live short-term promotion ストアに自動でステージしません

grounded 履歴再生を通常の deep promotion レーンに影響させたい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー画面として保ちながら、grounded durable 候補を short-term dreaming ストアにステージします。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    これが git checkout で、doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提示します。
  </Accordion>
  <Accordion title="1. Config normalization">
    設定にレガシー値の形（たとえばチャンネル固有の上書きなしの `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマに正規化します。

    これにはレガシー Talk フラットフィールドが含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形をプロバイダーマップに書き換えます。

    Doctor は、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは plugin 所有ツールエントリを使用している場合にも警告します。`tools.allow: ["*"]` は実際に読み込まれる plugins
    からのツールにのみ一致します。排他的な plugin
    許可リストをバイパスするものではありません。Doctor は移行済みの
    レガシー許可リスト設定に `plugins.bundledDiscovery: "compat"` を書き込み、既存のバンドルプロバイダー動作を保持したうえで、
    より厳密な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway も、レガシー設定形式を検出すると起動時に doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストアの移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 表示可能な返信ポリシーが欠けている設定済みチャンネル構成 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
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
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付きの `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、そのアカウントスコープ値を、そのチャンネル用に選ばれた昇格先アカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシー拡張機能リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時は、`api` が将来の enum 値または不明な enum 値に設定されているプロバイダーも、フェイルクローズではなくスキップします）

    Doctor の警告には、マルチアカウントチャンネル向けのアカウントデフォルトガイダンスも含まれます。

    - 2つ以上の `channels.<channel>.accounts` エントリが設定されていて、`channels.<channel>.defaultAccount` または `accounts.default` がない場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があることを doctor が警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きします。これにより、モデルが誤った API に強制されたり、コストがゼロにされたりする可能性があります。Doctor が警告するので、その上書きを削除し、モデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    ブラウザー設定が削除済みの Chrome 拡張機能パスをまだ指している場合、doctor は現在のホストローカルな Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、Doctor はホストローカルな Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor は Chrome 側の設定を代わりに有効化することはできません。ホストローカルな Chrome MCP には、引き続き次が必要です。

    - gateway/node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件だけに関するものです。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、その他のヘッドレスフローには適用されません。これらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    以前に `models.providers.openai-codex` 配下へレガシー OpenAI トランスポート設定を追加していた場合、それらが新しいリリースで自動的に使用される組み込み Codex OAuth プロバイダーパスを覆い隠すことがあります。Doctor は、Codex OAuth と一緒にそれらの古いトランスポート設定を検出すると警告します。これにより、古いトランスポート上書きを削除または書き換え、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかも確認します。この組み合わせは PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブ Codex app-server ハーネスと混同しやすいものです。Doctor は警告し、明示的な app-server 形状を示します: `openai/*` と `agentRuntime.id: "codex"`、または `OPENCLAW_AGENT_RUNTIME=codex`。

    両方のルートが有効なため、Doctor はこれを自動修復しません。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナーを通じて Codex OAuth/サブスクリプション認証を使う」ことを意味します。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込みターンをネイティブ Codex app-server で実行する」ことを意味します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」ことを意味します。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集してください。PI Codex OAuth が意図したものなら、警告はそのままにします。

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor は、Codex などの Plugin 所有ルートから、設定済みのデフォルト/フォールバックモデルまたはランタイムを移動した後に、古い自動作成ルート状態がないかアクティブセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有ルートがもう設定されていない場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、固定されたハーネス ID、CLI セッションバインディング、自動 auth-profile 上書きなど、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、変更されません。そのルートが不要になった場合は、`/model ...`、`/new` で切り替えるか、セッションをリセットしてください。

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor は、古いディスク上レイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。バックアップとしてレガシーフォルダーを残す場合、doctor は警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動で doctor を実行しなくてもエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分では、繰り返しの何もしない `doctor --fix` 変更は発生しなくなりました。

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor はインストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換える提案をします。この移行は冪等です。`contracts` キーに同じ値がすでにある場合、データを重複させずにレガシーキーを削除します。
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、上書きされている場合は `cron.store`）も確認し、スケジューラーが互換性のためにまだ受け付けている古いジョブ形状を探します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー notify フォールバックと既存の非 webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、診断機能は、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも警告します。そのホストローカルスクリプトは現在の OpenClaw では保守されておらず、Cron が systemd ユーザーバスに到達できない場合に、`~/.openclaw/logs/whatsapp-health.log` に誤った `Gateway inactive` メッセージを書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在の健全性チェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    診断機能は、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを、すべてのエージェントセッションディレクトリでスキャンします。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているかどうか、ロックの経過時間、古いと見なされるかどうか (終了済み PID または 30 分超) を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` 付きで再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    診断機能は、2026.4.24 のプロンプトトランスクリプト書き換えバグで作成された重複ブランチ形状を、エージェントセッション JSONL ファイルでスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟が並ぶ形状です。`--fix` / `--repair` モードでは、診断機能は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、Gateway 履歴とメモリリーダーに重複ターンが表示されなくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック (セッション永続化、ルーティング、安全性)">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います (別の場所にバックアップがある場合を除く)。

    診断機能は以下をチェックします。

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落したデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します (所有者/グループの不一致が検出された場合は `chown` のヒントも出力します)。
    - **macOS のクラウド同期状態ディレクトリ**: 状態ディレクトリが iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期ベースのパスは I/O の低速化やロック/同期の競合を引き起こすことがあります。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態ディレクトリが `mmcblk*` のマウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込みで遅くなり、消耗が早くなることがあります。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッション「1 行 JSONL」**: メインのトランスクリプトが 1 行しかない場合にフラグを立てます (履歴が蓄積されていません)。
    - **複数の状態ディレクトリ**: 複数のホームディレクトリにまたがって複数の `~/.openclaw` フォルダーが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します (履歴がインストール間で分裂する可能性があります)。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、診断機能はリモートホスト上で実行するよう通知します (状態はそこにあります)。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` に引き締めることを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性 (OAuth 期限切れ)">
    診断機能は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合 (TTY) のみ表示されます。`--non-interactive` では更新試行をスキップします。

    OAuth 更新が永続的に失敗した場合 (たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合)、診断機能は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    診断機能は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン (レート制限/タイムアウト/認証失敗)
    - より長い無効化状態 (請求/クレジット失敗)

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、診断機能はモデル参照をカタログおよび許可リストと照合して検証し、解決されないか許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、診断機能は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    診断機能は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成の Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストを隠してしまう可能性がある、孤立または復元された管理対象 npm コピーのバンドル `@openclaw/*` Plugin が含まれます。

    診断機能は、設定が参照しているにもかかわらずローカル Plugin レジストリで見つからない、欠落したダウンロード可能 Plugin も再インストールできます。例としては、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムなどがあります。パッケージ更新中は、コアパッケージが差し替えられている間、診断機能はパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定再読み込みではパッケージマネージャーは実行されません。Plugin のインストールは引き続き明示的な診断/インストール/更新作業です。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    診断機能はレガシー Gateway サービス (launchd/systemd/schtasks) を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップのヒントを出力することもできます。プロファイル名付き OpenClaw Gateway サービスは正式なものと見なされ、「余分」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落している一方で、システムレベルの OpenClaw Gateway サービスが存在する場合、診断機能は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャンネルアカウントに、保留中または対応可能なレガシー状態移行がある場合、診断機能は (`--fix` / `--repair` モードで) 移行前スナップショットを作成してから、ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行します。読み取り専用モード (`--fix` なしの `openclaw doctor`) では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証のずれ">
    診断機能は通常の健全性チェックの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - ペアリング済みデバイスの保留中のロールアップグレード
    - ペアリング済みデバイスの保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイスアイデンティティが承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリング基準からずれているペアリング済みトークン
    - Gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    診断機能はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに、正確な次の手順を出力します。

    - 保留中のリクエストを `openclaw devices list` で確認する
    - 正確なリクエストを `openclaw devices approve <requestId>` で承認する
    - 新しいトークンを `openclaw devices rotate --device <deviceId> --role <role>` でローテーションする
    - 古いレコードを `openclaw devices remove <deviceId>` で削除し、再承認する

    これにより、一般的な「すでにペアリング済みなのに、まだペアリングが必要と表示される」穴を塞ぎます。診断機能は、初回ペアリングを、保留中のロール/スコープアップグレードや、古いトークン/デバイスアイデンティティのずれと区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    診断機能は、プロバイダーが許可リストなしでダイレクトメッセージに開放されている場合、またはポリシーが危険な方法で設定されている場合に警告を出力します。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd ユーザーサービスとして実行している場合、診断機能は Gateway がログアウト後も稼働し続けるように lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態 (Skills、Plugin、レガシーディレクトリ)">
    診断機能は、デフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills ステータス**: 対象、要件不足、許可リストでブロックされた Skills を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並存している場合に警告します。
    - **Plugin ステータス**: 有効/無効/エラーのある Plugin を数えます。エラーがある場合は Plugin ID を一覧表示します。バンドル Plugin のケイパビリティを報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが出力した読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    診断機能は、ワークスペースのブートストラップファイル (たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入されたコンテキストファイル) が、設定された文字数上限に近い、または超えているかどうかをチェックします。ファイルごとの生の文字数と注入後文字数、切り詰め率、切り詰め原因 (`max/file` または `max/total`)、総上限に対する合計注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、診断機能は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャンネル Plugin を削除するとき、その Plugin を参照していた残存するチャンネルスコープ設定も削除します。`channels.<id>` エントリ、そのチャンネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムがなくなっているのに、設定がまだ Gateway にそれへバインドするよう求めている場合の Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    診断機能は、現在のシェル (zsh、bash、fish、または PowerShell) にタブ補完がインストールされているかどうかをチェックします。

    - シェルプロファイルが遅い動的補完パターン (`source <(openclaw completion ...)`) を使用している場合、診断機能はそれをより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、診断機能はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、診断機能はインストールを促します (対話モードのみ。`--non-interactive` ではスキップされます)。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック (ローカルトークン)">
    診断機能はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、診断機能は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、診断機能は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合に限り生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの即時失敗動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復で、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合、設定済みのボット認証情報の使用を試みます。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報告したりする代わりに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで準備できているかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを検査します。できない場合は、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): API キーが環境または認証ストアに存在するかを検証します。欠落している場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: 最初にローカルモデルの利用可否を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュ済みの gateway 検査結果が利用可能な場合（確認時に gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダー確認が必要な場合は、deep メモリステータスコマンドを使ってください。

    実行時の埋め込み準備状態を検証するには `openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    gateway が正常な場合、doctor はチャンネルステータス検査を実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトへ書き換えられます。

    注記:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` は、デフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は、推奨修正を確認なしで適用します。
    - `openclaw doctor --repair --force` は、カスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービスの健全性を報告し、サービス以外の修復は引き続き実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップをスキップします。
    - Linux では、一致する systemd gateway unit がアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービスのスキャン中に、非アクティブでレガシーではない追加の gateway 風 unit を無視するため、関連サービスファイルがクリーンアップのノイズを発生させません。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータへ永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートへ書き換えます。
    - トークン認証にトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux の user-systemd unit では、doctor のトークンドリフトチェックは、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定が新しいバージョンで最後に書き込まれている場合、古い OpenClaw バイナリから gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` により、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされているものの実際には実行されていない場合に警告します。また、gateway ポート（デフォルト `18789`）でポート衝突がないか確認し、考えられる原因（gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、gateway サービスが Bun またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合はシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、インタラクティブシェルの PATH をコピーする代わりに、標準のシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使うため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリによって Node 子プロセスの解決先が変わることはありません。Linux サービスは、明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定した user-bin ディレクトリを引き続き保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、ワークスペースメモリシステムがない場合は提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開の GitHub または GitLab を推奨）の完全なガイドは [/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

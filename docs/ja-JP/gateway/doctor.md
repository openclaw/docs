---
read_when:
    - doctorマイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-06T05:04:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cee2793b1a0665a3a816586fcb597de1fd3133819d34480aa420346f4d7a78d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古くなった設定/状態を修正し、健全性をチェックし、実行可能な修復手順を提示します。

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

    プロンプトを表示せずに既定値を受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

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

    プロンプトなしで実行し、安全な移行（設定の正規化 + ディスク上の状態移動）のみを適用します。人による確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出された場合に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）がないかシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認したい場合は、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話型のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合に Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills の状態概要（対象/不足/ブロック）と plugin 状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 対応状況のブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的だがツールポリシーが引き続きワイルドカードまたは plugin 所有ツールを要求している場合の plugin/tool 許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キーの移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーエージェントランタイムポリシーの `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - plugin が有効な場合の古い plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドで作成された重複 prompt-rewrite ブランチのセッショントランスクリプト修復。
    - 詰まった subagent の再起動リカバリ tombstone 検出。古い aborted recovery フラグをクリアして、起動時に子を restart-aborted と扱い続けないようにする `--fix` 対応。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth の有効期限をチェックし、期限切れ間近のトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスがインストール済みだが実行されていない、キャッシュ済み launchd ラベル）。
    - チャンネル状態警告（実行中の Gateway からプローブ）。
    - ローカル TUI クライアントがまだ実行中の状態で、Gateway イベントループの健全性が低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みのローカル TUI クライアントのみを停止します。
    - プライマリモデル、フォールバック、heartbeat/subagent/compaction 上書き、フック、チャンネルモデル上書き、セッション route pin 内のレガシー `openai-codex/*` モデル参照に対する Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、Codex plugin がインストール済み、有効、`codex` ハーネスを提供し、使用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は `agentRuntime.id: "pi"` を選択します。
    - supervisor 設定監査（launchd/systemd/schtasks）と任意の修復。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（既定値 `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに対するセキュリティ警告。
    - ローカルトークンモード向け Gateway 認証チェック（トークンソースが存在しない場合にトークン生成を提示し、トークン SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（保留中の初回ペア要求、保留中のロール/スコープアップグレード、古いローカル device-token キャッシュのドリフト、paired-record 認証ドリフト）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペース bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - 既定エージェント向け Skills 準備状況チェック。不足しているバイナリ、環境、設定、または OS 要件がある許可済み Skills を報告し、`--fix` は `skills.entries` 内の利用不可 Skills を無効化できます。
    - シェル補完状態チェックと自動インストール/アップグレード。
    - Memory 検索埋め込みプロバイダー準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、不足している UI アセット、不足している tsx バイナリ）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway doctor 形式の RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブワークスペース内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行して、取り消し可能な backfill エントリを `DREAMS.md` に書き込みます。
- **Reset** は、それらのマーク付き backfill diary エントリのみを `DREAMS.md` から削除します。
- **Clear Grounded** は、履歴リプレイから来た、まだライブ recall や日次サポートを蓄積していない、ステージ済み grounded-only 短期エントリのみを削除します。

単体では**実行しない**こと:

- `MEMORY.md` は編集しません
- doctor の完全な移行は実行しません
- staged CLI パスを明示的に先に実行しない限り、grounded 候補をライブ短期 promotion ストアへ自動的にステージしません

grounded 履歴リプレイを通常の深い promotion レーンに反映させたい場合は、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded durable 候補が短期 dreaming ストアにステージされます。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout で、doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提示します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャンネル固有の上書きがない `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマへ正規化します。

    これにはレガシー Talk フラットフィールドも含まれます。現在の公開 Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、リアルタイム音声設定は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形を provider マップへ書き換え、レガシーのトップレベルリアルタイムセレクター（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` へ書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは plugin 所有ツールのエントリを使用している場合に警告します。`tools.allow: ["*"]` は実際にロードされる plugin
    からのツールにのみ一致します。排他的な plugin
    許可リストを迂回するものではありません。Doctor は移行された
    レガシー許可リスト設定に `plugins.bundledDiscovery: "compat"` を書き込み、既存のバンドル provider 動作を保持してから、
    より厳格な `"allowlist"` 設定を指し示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は以下を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway もレガシー設定形式を検出した場合、起動時に doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストアの移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 表示可能な返信ポリシーがない設定済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - レガシーなトップレベルのリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、そのアカウントスコープの値を、そのチャンネルで選択された昇格先アカウントに移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用してください
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost`（レガシー拡張リレー設定）を削除します
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時には、`api` が将来の enum 値または未知の enum 値に設定されているプロバイダーも、フェイルクローズするのではなくスキップします）

    Doctor の警告には、マルチアカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選択する可能性があることを doctor が警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を列挙します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。その結果、モデルが誤った API に強制されたり、コストがゼロにされたりする可能性があります。doctor は警告を出すため、そのオーバーライドを削除して、モデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP の準備状況">
    ブラウザー設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor はそれを現在のホストローカル Chrome MCP アタッチモデルに正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザーの inspect ページ（たとえば `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）でリモートデバッグを有効にするよう促します

    doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースのブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効であること
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件に関するものだけです。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他のヘッドレスフローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（たとえば `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを表示します。Homebrew の Node を使う macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシーな OpenAI トランスポート設定を追加していた場合、それらが新しいリリースで自動使用される組み込み Codex OAuth プロバイダーパスを隠す可能性があります。doctor は Codex OAuth と並んで古いトランスポート設定を検出すると警告するため、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    Doctor はレガシーな `openai-codex/*` モデル参照をチェックします。ネイティブ Codex ハーネスのルーティングでは、正規の `openai/*` モデル参照と `agentRuntime.id: "codex"` を使うため、ターンは OpenClaw PI OpenAI パスではなく Codex app-server ハーネスを通ります。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントおよびエージェントごとの参照を書き換えます。対象には、プライマリモデル、フォールバック、Heartbeat/subagent/Compaction オーバーライド、フック、チャンネルモデルオーバーライド、古い永続化セッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - 一致するエージェントランタイムは、Codex がインストール済み、有効、`codex` ハーネスを提供していて、利用可能な OAuth がある場合に限り `agentRuntime.id: "codex"` になります。
    - それ以外の場合、一致するエージェントランタイムは `agentRuntime.id: "pi"` になります。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化されたセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルのピン留め、Codex ハーネスのピン留めは、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex のような Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態についても、検出されたエージェントセッションストアをスキャンします。

    `openclaw doctor --fix` は、所有元ルートがもう設定されていない場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、ピン留めされたハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなどの、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、そのまま残されます。そのルートをもう意図しない場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は、古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor はバックアップとしてレガシーフォルダーを残す場合に警告を出します。Gateway/CLI も起動時にレガシーのセッション + エージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルがエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分で `doctor --fix` の変更が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    Doctor はインストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを複製せずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    Doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライド時は `cron.store`）についても、スケジューラーが互換性のためにまだ受け付ける古いジョブ形状をチェックします。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシーの通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    doctor は、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを、すべてのエージェントセッションディレクトリでスキャンします。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いものと見なされるかどうか（PID が死んでいる、または 30 分より古い）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を表示し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を、エージェントセッションの JSONL ファイルでスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟ターンです。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、Gateway 履歴とメモリリーダーが重複ターンを認識しなくなります。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、資格情報、ログ、設定を失います（別の場所にバックアップがある場合を除く）。

    doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 破滅的な状態損失について警告し、ディレクトリの再作成を促し、失われたデータは復旧できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントを出します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期付きパスは I/O の低速化やロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC バックのランダム I/O は、セッションや資格情報の書き込み下で遅くなり、摩耗が早くなる可能性があるためです。
    - **セッションディレクトリの欠落**: `sessions/` とセッションストアディレクトリは、履歴を永続化し、`ENOENT` クラッシュを避けるために必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルが欠けている場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行だけの場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこに存在します）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` に厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 有効期限）">
    doctor は認証ストア内の OAuth プロファイルを検査し、トークンの期限切れが近い/期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンパスを提案します。更新プロンプトは対話的（TTY）に実行している場合にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めている場合）、doctor は再認証が必要であることを報告し、実行する正確な `openclaw models auth login --provider ...` コマンドを表示します。

    doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログおよび許可リストに照らして検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが見つからない場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーの OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードからのパッケージローカルの残骸、現在のバンドルマニフェストを隠してしまう可能性がある、孤立または復旧済みの管理 npm コピーのバンドル `@openclaw/*` plugins が含まれます。

    doctor は、設定がダウンロード可能な plugins を参照しているがローカル Plugin レジストリで見つからない場合に、不足している plugins を再インストールすることもできます。例として、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、doctor はコアパッケージが入れ替えられている間はパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin にまだ復旧が必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップヒント">
    doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップヒントを表示することもできます。プロファイル名付きの OpenClaw Gateway サービスは一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落している一方でシステムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認してから、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. Startup Matrix 移行">
    Matrix チャンネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor（`--fix` / `--repair` モード）は移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は続行します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    doctor は通常のヘルスパスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリング要求
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致するが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンがないペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - Gateway 側のトークンローテーションより前の、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    doctor はペア要求の自動承認やデバイストークンの自動ローテーションを行いません。代わりに正確な次の手順を表示します。

    - `openclaw devices list` で保留中の要求を確認する
    - `openclaw devices approve <requestId>` で正確な要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、「すでにペアリング済みなのに、まだペアリング必須になる」という一般的な穴がふさがります。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報ドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合、doctor は警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が稼働し続けるように linger が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    doctor はデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skills 状態**: 対象、要件不足、許可リストでブロックされた skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの plugins を数えます。エラーがある場合は Plugin ID を一覧表示します。バンドル Plugin 機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが出した読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    doctor はワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入コンテキストファイル）が、設定された文字数予算に近い、または超えているかどうかをチェックします。ファイルごとの raw と注入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、総予算に対する総注入文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャンネル Plugin を削除すると、その Plugin を参照していた未解決のチャンネルスコープ設定も削除します。`channels.<id>` エントリ、そのチャンネルを指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムがなくなっているのに設定がまだ Gateway にそれへバインドするよう求めることで起きる Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかどうかをチェックします。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はより高速なキャッシュファイル版へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    doctor はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、実行時のフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に対して、status 系コマンドと同じ読み取り専用の SecretRef サマリーモデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合に設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef で設定されているものの、現在のコマンドパスで利用できない場合、doctor はクラッシュしたりトークンが欠落していると誤報したりせず、その認証情報は設定済みだが利用不可であることを報告し、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    doctor はヘルスチェックを実行し、gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで利用可能かどうかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かどうかをプローブします。そうでない場合、npm パッケージや手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL があるかを確認します。欠落している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage` など): API キーが環境または認証ストアに存在することを検証します。欠落している場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: 最初にローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュ済みの gateway プローブ結果が利用可能な場合（チェック時点で gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細なメモリステータスコマンドを使ってください。

    実行時に埋め込みの準備状況を検証するには、`openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャンネルステータスの警告">
    gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古くなったデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致を見つけた場合、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注意:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` は、デフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` は、推奨修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` は、カスタムのスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、gateway サービスライフサイクルについて doctor を読み取り専用に保ちます。サービスヘルスの報告とサービス以外の修復は引き続き実行しますが、そのライフサイクルは外部スーパーバイザーが所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントメタデータを書き換えません。また、重複サービススキャン中は、非アクティブでレガシーではない追加の gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップノイズを生みません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んでいた、管理対象の `.env`/SecretRef 由来のサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータを比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - 設定が最後に新しいバージョンで書き込まれている場合、doctor のサービス修復は、古い OpenClaw バイナリから gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使えば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストールされているものの実際には実行されていない場合に警告します。また、gateway ポート（デフォルト `18789`）のポート衝突を確認し、考えられる原因（gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    doctor は、gateway サービスが Bun またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーするのではなく、正規のシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使います。そのため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリが、どの Node 子プロセスに解決されるかを変えることはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    doctor は設定変更を永続化し、doctor の実行を記録するためにウィザードメタデータを付与します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    doctor は、ワークスペースメモリシステムがない場合にそれを提案し、ワークスペースがまだ git 配下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開 GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

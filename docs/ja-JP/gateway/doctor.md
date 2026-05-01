---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-01T05:01:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52183eaf6024eface20089f9d11143ef1e952d2488eee766dc154512f5d3c6b4
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定/状態を修正し、正常性を確認し、実行可能な修復手順を提示します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックス修復手順を含む）。

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

    積極的な修復も適用します（カスタム supervisor 設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は検出時に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストールについてシステムサービスをスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="正常性、UI、更新">
    - git インストール向けの任意の事前更新（対話モードのみ）。
    - UI プロトコル鮮度チェック（プロトコルスキーマが新しい場合に Control UI を再ビルド）。
    - 正常性チェック + 再起動プロンプト。
    - Skills ステータス概要（対象/不足/ブロック中）と plugin ステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状態のブラウザー移行チェック。
    - OpenCode プロバイダー上書きの警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイングの警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的だが、ツールポリシーがまだワイルドカードまたは plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook フォールバックジョブ）。
    - レガシーエージェントランタイムポリシーを `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` へ移行。
    - plugins が有効な場合の古い plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複プロンプト書き換えブランチのセッショントランスクリプト修復。
    - 行き詰まったサブエージェントの再起動リカバリ tombstone 検出。古い中止済みリカバリフラグをクリアして、起動時に子を再起動中止済みとして扱い続けないようにするための `--fix` サポート付き。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の正常性: OAuth 有効期限を確認し、期限が近いトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加ワークスペースディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスがインストール済みだが実行されていない、キャッシュ済み launchd ラベル）。
    - チャンネルステータス警告（実行中の gateway からプローブ）。
    - 任意修復付き supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ gateway サービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーのセキュリティ警告。
    - ローカルトークンモード向け Gateway 認証チェック（トークンソースがない場合にトークン生成を提示します。トークン SecretRef 設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリングリクエスト、保留中のロール/スコープアップグレード、古いローカルデバイストークンキャッシュのずれ、ペアリング済みレコードの認証ずれ）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペース bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限接近の警告）。
    - シェル補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダー準備状態チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、不足 UI アセット、不足 tsx バイナリ）。
    - 更新済み設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI バックフィルとリセット

Control UI の Dreams シーンには、grounded dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway の doctor 形式の RPC メソッドを使いますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

実行内容:

- **Backfill** はアクティブワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary パスを実行し、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、マークされたバックフィル diary エントリのみを削除します。
- **Clear Grounded** は、履歴リプレイから来て、まだライブ recall や日次サポートを蓄積していない、ステージ済みの grounded-only 短期エントリのみを削除します。

それ自体では実行**しない**こと:

- `MEMORY.md` を編集しません
- 完全な doctor 移行を実行しません
- ステージ済み CLI パスを明示的に先に実行しない限り、grounded 候補をライブ短期プロモーションストアへ自動的にステージしません

grounded 履歴リプレイを通常の deep promotion レーンに影響させたい場合は、代わりに CLI フローを使います。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` をレビュー面として維持しながら、grounded durable 候補を短期 dreaming ストアへステージします。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout であり doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提示します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャンネル固有の上書きがない `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマへ正規化します。

    これにはレガシー Talk フラットフィールドが含まれます。現在の公開 Talk 設定は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形式をプロバイダーマップへ書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは plugin 所有ツールエントリを使う場合に警告します。`tools.allow: ["*"]` は実際にロードされる plugins のツールだけに一致します。
    排他的な plugin 許可リストをバイパスするものではありません。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway も起動時にレガシー設定形式を検出すると doctor 移行を自動実行するため、古い設定は手動介入なしで修復されます。Cron ジョブストア移行は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
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
    - 名前付き `accounts` がありながら、単一アカウント用のトップレベルチャネル値が残っているチャネルでは、そのアカウントスコープの値をそのチャネル用に選ばれた昇格済みアカウントへ移動する（ほとんどのチャネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを維持できる）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除する。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使う
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除する（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時は、`api` が将来の enum 値または不明な enum 値に設定されたプロバイダーについても、フェイルクローズせずにスキップする）

    Doctor の警告には、複数アカウントチャネル向けのアカウントデフォルトのガイダンスも含まれる。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があると doctor が警告する。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示する。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログをオーバーライドします。その結果、モデルが誤った API に割り当てられたり、コストがゼロになったりすることがあります。doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるように警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になる
    - `browser.relayBindHost` は削除される

    doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使う場合、ホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認する
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告する
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知する（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き以下が必要です。

    - gateway/node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行中であること
    - そのブラウザーでリモートデバッグが有効であること
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況はローカルアタッチの前提条件だけを対象とします。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、またはその他のヘッドレスフローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントを検査し、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるかを確認します。検査が証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でも検査が実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前にレガシー OpenAI トランスポート設定を `models.providers.openai-codex` の下に追加していた場合、それらは新しいリリースが自動的に使う組み込み Codex OAuth プロバイダーパスをシャドーすることがあります。doctor は、Codex OAuth と並んでそれらの古いトランスポート設定を検出すると警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルート警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照がまだデフォルトの PI ランナー経由で解決されるかどうかも確認します。この組み合わせは PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブ Codex アプリサーバーハーネスと混同しやすいものです。doctor は警告し、明示的なアプリサーバー形状として `openai/*` と `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex` を示します。

    両方のルートが有効であるため、doctor はこれを自動修復しません。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使う」という意味です。
    - `openai/*` + `runtime: "codex"` は「埋め込みターンをネイティブ Codex アプリサーバー経由で実行する」という意味です。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味です。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」という意味です。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集してください。PI Codex OAuth が意図したものなら、警告はそのままにします。

  </Accordion>
  <Accordion title="3. レガシー状態移行（ディスクレイアウト）">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor は、バックアップとしてレガシーフォルダーを残す場合に警告を出します。Gateway/CLI も起動時にレガシーセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルはエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するようになったため、キー順序だけの差分では、繰り返しの no-op `doctor --fix` 変更が発生しなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェスト移行">
    doctor は、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）について、インストール済みのすべての Plugin マニフェストをスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストア移行">
    doctor は、互換性のためスケジューラーがまだ受け入れる古いジョブ形状について、Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライドされている場合は `cron.store`）も確認します。

    現在の Cron クリーンアップには以下が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    doctor は、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルについて、すべてのエージェントセッションディレクトリをスキャンします。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（終了済み PID または 30 分超）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状について、エージェントセッション JSONL ファイルをスキャンします。その形状は、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟から成ります。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えることで、Gateway 履歴とメモリーリーダーが重複ターンを見ないようにします。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います（ほかにバックアップがある場合を除く）。

    doctor は以下を確認します。

    - **状態ディレクトリがない**: 壊滅的な状態データの喪失について警告し、ディレクトリの再作成を促し、不足しているデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能かを検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` のヒントも出力します）。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期対象のパスでは I/O が遅くなり、ロック/同期の競合が発生する可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、消耗が速くなる可能性があるためです。
    - **セッションディレクトリがない**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリに対応するトランスクリプトファイルがない場合に警告します。
    - **メインセッション「1 行 JSONL」**: メインのトランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分断される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` に厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth の有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンの経路を提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` では更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めている場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデルの検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログおよび許可リストに照らして検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージの修復">
    サンドボックス化が有効な場合、doctor は Docker イメージを確認し、現在のイメージがない場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. バンドル済み Plugin のランタイム依存関係">
    Doctor は、現在の設定でアクティブなバンドル済み Plugin、またはバンドル済みマニフェストのデフォルトで有効化される Plugin についてのみランタイム依存関係を検証します。たとえば、`plugins.entries.discord.enabled: true`、レガシーの `channels.discord.enabled: true`、設定済みの `models.providers.*` / エージェントモデル参照、またはプロバイダー所有権のないデフォルト有効のバンドル済み Plugin です。不足がある場合、doctor はパッケージを報告し、`openclaw doctor --fix` / `openclaw doctor --repair` モードでインストールします。外部 Plugin は引き続き `openclaw plugins install` / `openclaw plugins update` を使用します。doctor は任意の Plugin パスの依存関係をインストールしません。

    doctor の修復中、バンドル済みランタイム依存関係の npm インストールは、TTY セッションではスピナー進捗を、パイプ/ヘッドレス出力では定期的な行進捗を報告します。Gateway とローカル CLI も、バンドル済み Plugin をインポートする前に、アクティブなバンドル済み Plugin のランタイム依存関係を必要に応じて修復できます。これらのインストールは Plugin ランタイムインストールルートに限定され、スクリプトを無効化して実行され、パッケージロックを書き込まず、インストールルートロックで保護されるため、同時に開始された CLI や Gateway が同じ `node_modules` ツリーを同時に変更することはありません。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンしてクリーンアップのヒントを表示することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「余分」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスがない一方でシステムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動ではインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で調査し、重複を削除するか、システム supervisor が Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行と、レガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスのペアリングと認証ドリフト">
    Doctor は通常の健全性チェックの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブなトークンがないペアリング済みレコード
    - 承認済みペアリングベースラインの外へスコープがずれたペアリング済みトークン
    - Gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を表示します。

    - `openclaw devices list` で保留中のリクエストを調査する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのにまだペアリングが必要と表示される」問題が解消されます。doctor は初回ペアリングを、保留中のロール/スコープアップグレードや、古いトークン/デバイス ID 情報のドリフトと区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出力します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が稼働し続けるよう linger が有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skills 状態**: 対象、要件不足、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` または他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの Plugin 数を数えます。エラーがある場合は Plugin ID を一覧表示します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムと互換性の問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリがロード時に出力した警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の挿入済みコンテキストファイル）が、設定済みの文字数予算に近いか超過しているかを確認します。ファイルごとの raw と挿入後の文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、および合計挿入文字数が総予算に占める割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整に関するヒントを表示します。
  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が不足しているチャネル Plugin を削除する場合、その Plugin を参照していたぶら下がりのチャネルスコープ設定も削除します。`channels.<id>` エントリ、そのチャネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているのに設定が Gateway にバインドを求め続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかを確認します。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルがない場合、doctor はキャッシュを自動で再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状態を確認します。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理で利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めずに設定済み認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済み bot 認証情報の使用を試みます。
    - Telegram bot トークンが SecretRef 経由で設定されているが、現在のコマンド経路で利用できない場合、doctor はその認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンがないと誤報告したりする代わりに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway の健全性チェックと再起動">
    Doctor は健全性チェックを実行し、Gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで使用可能かどうかを確認します。動作は、設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かどうかをプローブします。そうでない場合、npm パッケージや手動バイナリパスの選択肢を含む修正ガイダンスを表示します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。不足している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。不足している場合は、実行可能な修正ヒントを表示します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュされた Gateway プローブ結果が利用可能な場合（チェック時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、deep memory status コマンドを使用します。

    実行時の埋め込み準備状態を確認するには `openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨される修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. Supervisor 設定監査 + 修復">
    Doctor はインストール済みの supervisor 設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注記:

    - `openclaw doctor` は supervisor 設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` はプロンプトなしで推奨修正を適用します。
    - `openclaw doctor --repair --force` はカスタム supervisor 設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は Gateway サービスライフサイクルについて doctor を読み取り専用にします。サービスの健全性を引き続き報告し、サービス以外の修復も実行しますが、外部 supervisor がそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/bootstrap、supervisor 設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、対応する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービスのスキャン中は、非アクティブな非レガシーの追加 Gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップのノイズを生みません。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値を supervisor サービス環境メタデータには永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値が supervisor 定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef が解決されていない場合、doctor は実行可能な案内とともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux user-systemd ユニットでは、doctor のトークンドリフトチェックは、サービス認証メタデータの比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使用すれば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート衝突を確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要であり、バージョンマネージャーのパスは、サービスがシェル初期化を読み込まないため、アップグレード後に壊れる可能性があります。Doctor は、利用可能な場合にシステムの Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復されたサービスは、明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。これにより、生成された supervisor PATH は、doctor が後で実行する同じ最小 PATH 監査と整合します。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータをスタンプします。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、不足している場合にワークスペースメモリシステムを提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを表示します。

    ワークスペース構造と git バックアップ（プライベート GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

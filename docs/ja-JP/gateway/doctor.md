---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定マイグレーション、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-05T01:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い config/state を修正し、健全性をチェックし、実行可能な修復手順を提示します。

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

    プロンプトなしで既定値を受け入れます（該当する場合は restart/service/sandbox の修復手順を含む）。

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    プロンプトなしで推奨修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    強力な修復も適用します（カスタム supervisor config を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（config の正規化 + ディスク上の state 移動）。人間の確認が必要な restart/service/sandbox アクションはスキップします。レガシー state 移行は検出時に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）を system services でスキャンします。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に config ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（要約）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合に Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills ステータス要約（eligible/missing/blocked）と Plugin ステータス。

  </Accordion>
  <Accordion title="Config と移行">
    - レガシー値の config 正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk config 移行。
    - レガシー Chrome 拡張機能 config と Chrome MCP 準備状況のブラウザー移行チェック。
    - OpenCode provider override 警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth shadowing 警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` は制限的だが tool policy がまだワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/tool allowlist 警告。
    - レガシーのディスク上 state 移行（sessions/agent dir/WhatsApp auth）。
    - レガシー Plugin manifest contract キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron store 移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook fallback jobs）。
    - レガシー agent runtime-policy の `agents.defaults.agentRuntime` と `agents.list[].agentRuntime` への移行。
    - Plugin が有効な場合の古い Plugin config のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な containment config として扱われ、保持されます。

  </Accordion>
  <Accordion title="State と整合性">
    - Session lock file の検査と古いロックのクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複 prompt-rewrite branch の session transcript 修復。
    - 詰まった subagent restart-recovery tombstone の検出。startup が child を restart-aborted として扱い続けないよう、古い aborted recovery flag を消去する `--fix` をサポート。
    - State の整合性と権限チェック（sessions、transcripts、state dir）。
    - ローカル実行時の config ファイル権限チェック（chmod 600）。
    - Model auth の健全性: OAuth 期限切れをチェックし、期限が近い token を更新でき、auth-profile の cooldown/disabled state を報告します。
    - 余分な workspace dir の検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、services、supervisors">
    - sandboxing が有効な場合の sandbox image 修復。
    - レガシー service 移行と追加 Gateway 検出。
    - Matrix channel のレガシー state 移行（`--fix` / `--repair` モード）。
    - Gateway runtime チェック（service がインストール済みだが実行されていない、cached launchd label）。
    - Channel ステータス警告（実行中の gateway から probe）。
    - 任意修復付き supervisor config audit（launchd/systemd/schtasks）。
    - インストールまたは更新中に shell の `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway services 向けの embedded proxy environment クリーンアップ。
    - Gateway runtime ベストプラクティスチェック（Node と Bun、version-manager paths）。
    - Gateway port collision 診断（既定 `18789`）。

  </Accordion>
  <Accordion title="Auth、セキュリティ、ペアリング">
    - open DM policies のセキュリティ警告。
    - local token mode の Gateway auth チェック（token source が存在しない場合に token 生成を提案。token SecretRef config は上書きしません）。
    - Device pairing トラブル検出（保留中の初回 pair requests、保留中の role/scope upgrades、古い local device-token cache drift、paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace と shell">
    - Linux での systemd linger チェック。
    - Workspace bootstrap file size チェック（context files の切り詰め/上限付近警告）。
    - 既定 agent の Skills 準備状況チェック。bin、env、config、または OS 要件が不足している許可済み Skills を報告し、`--fix` で `skills.entries` 内の利用不能 Skills を無効化できます。
    - Shell completion ステータスチェックと自動インストール/アップグレード。
    - Memory search embedding provider 準備状況チェック（local model、remote API key、または QMD binary）。
    - Source install チェック（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
    - 更新済み config + ウィザード metadata を書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill と reset

Control UI の Dreams scene には、grounded dreaming workflow 向けの **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway doctor 形式の RPC methods を使いますが、`openclaw doctor` CLI repair/migration の一部では**ありません**。

実行内容:

- **Backfill** は active workspace 内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行して、可逆的な backfill entries を `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、それらのマーク済み backfill diary entries のみを削除します。
- **Clear Grounded** は、historical replay から来た staged grounded-only short-term entries のうち、まだ live recall や daily support が蓄積されていないものだけを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md` は編集しません
- full doctor migrations は実行しません
- staged CLI path を先に明示的に実行しない限り、grounded candidates を live short-term promotion store に自動 stage しません

grounded historical replay を通常の deep promotion lane に影響させたい場合は、代わりに CLI フローを使います。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` を review surface として維持しながら、grounded durable candidates を short-term dreaming store に stage します。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout で doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. Config 正規化">
    config にレガシー値の形（たとえば channel-specific override なしの `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマへ正規化します。

    これにはレガシー Talk のフラットフィールドも含まれます。現在の公開 Talk config は `talk.provider` + `talk.providers.<provider>` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形を provider map に書き換えます。

    Doctor は、`plugins.allow` が空でなく tool policy がワイルドカードまたは Plugin 所有ツールエントリを使う場合にも警告します。`tools.allow: ["*"]` は、実際に読み込まれる Plugin のツールにのみ一致します。排他的な Plugin allowlist をバイパスするものではありません。Doctor は、移行されたレガシー allowlist config に対して `plugins.bundledDiscovery: "compat"` を書き込み、既存の bundled provider behavior を維持したうえで、より厳格な `"allowlist"` 設定を案内します。

  </Accordion>
  <Accordion title="2. レガシー config key 移行">
    config に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway もレガシー config 形式を検出すると startup 時に doctor migrations を自動実行するため、古い config は手動介入なしで修復されます。Cron job store migrations は `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 可視返信ポリシーがない設定済みチャネルの設定 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャネル値が残っているチャネルでは、そのアカウントスコープの値を、そのチャネル用に選ばれた昇格先アカウントへ移動します（多くのチャネルでは `accounts.default`。Matrix では既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用します
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost`（レガシー拡張リレー設定）を削除します
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時には、`api` が将来の enum 値や不明な enum 値に設定されているプロバイダーも、フェイルクローズせずにスキップします）

    doctor の警告には、マルチアカウントチャネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor は警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログがオーバーライドされます。これにより、モデルが誤った API に割り当てられたり、コストがゼロになったりする可能性があります。doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP の準備状況">
    ブラウザー設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、ホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザーの inspect ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor が Chrome 側の設定を有効にすることはできません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/node ホスト上の Chromium ベースブラウザー 144+
    - ローカルで実行中のブラウザー
    - そのブラウザーで有効化されたリモートデバッグ
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とします。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションのような高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、その他のヘッドレスフローには**適用されません**。それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブして、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム別の修正ガイダンスを出力します。Homebrew の Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前にレガシー OpenAI トランスポート設定を `models.providers.openai-codex` の下に追加していた場合、それらが新しいリリースで自動的に使用される組み込み Codex OAuth プロバイダーパスをシャドーする可能性があります。doctor は、Codex OAuth と並んでそれらの古いトランスポート設定を見つけると警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex Plugin ルートの警告">
    バンドルされた Codex Plugin が有効な場合、doctor は `openai-codex/*` のプライマリモデル参照が引き続きデフォルトの PI ランナー経由で解決されるかどうかも確認します。この組み合わせは、PI 経由で Codex OAuth/サブスクリプション認証を使いたい場合には有効ですが、ネイティブ Codex アプリサーバーハーネスと混同しやすい構成です。doctor は警告し、明示的なアプリサーバー形状を示します: `openai/*` に加えて `agentRuntime.id: "codex"` または `OPENCLAW_AGENT_RUNTIME=codex`。

    どちらのルートも有効なため、doctor はこれを自動修復しません。

    - `openai-codex/*` + PI は「通常の OpenClaw ランナー経由で Codex OAuth/サブスクリプション認証を使用する」という意味です。
    - `openai/*` + `agentRuntime.id: "codex"` は「埋め込みターンをネイティブ Codex アプリサーバー経由で実行する」という意味です。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」という意味です。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」という意味です。

    警告が表示された場合は、意図したルートを選び、設定を手動で編集してください。PI Codex OAuth が意図した構成である場合は、警告をそのままにします。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    doctor は、設定済みのデフォルト/フォールバックモデルまたはランタイムを Codex のような Plugin 所有ルートから移動した後に、古くなった自動作成ルート状態がないかアクティブセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有ルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、固定ハーネス ID、CLI セッションバインディング、自動 auth-profile オーバーライドなど、自動作成された古い状態をクリアできます。明示的なユーザー選択またはレガシーセッションのモデル選択は手動レビュー対象として報告され、そのまま残されます。そのルートをもう意図していない場合は、`/model ...`、`/new` で切り替えるか、セッションをリセットしてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    doctor は、古いディスク上レイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor は、レガシーフォルダーをバックアップとして残した場合に警告を出します。Gateway/CLI も起動時にレガシーのセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動で doctor を実行しなくてもエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序だけの差分によって `doctor --fix` の no-op 変更が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー cron ストアの移行">
    doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、またはオーバーライドされている場合は `cron.store`）について、スケジューラーが互換性のためにまだ受け付ける古いジョブ形状も確認します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    doctor は、動作を変えずに実行できる場合にのみ `notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルのスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、古い書き込みロックファイル（セッションが異常終了したときに残されたファイル）を各エージェントセッションディレクトリでスキャンします。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているかどうか、ロックの経過時間、古いと見なされるかどうか（停止した PID または 30 分超）を報告します。`--fix` / `--repair` モードでは、古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` 付きで再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状について、エージェントセッションの JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟が存在する状態です。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、Gateway 履歴とメモリリーダーが重複ターンを見なくなるよう、トランスクリプトをアクティブなブランチへ書き換えます。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、（別の場所にバックアップがない限り）セッション、認証情報、ログ、設定が失われます。

    Doctor は次をチェックします。

    - **状態ディレクトリの欠落**: 致命的な状態損失について警告し、ディレクトリの再作成を促し、欠落データは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限修復を提案し、所有者/グループの不一致が検出された場合は `chown` のヒントを出力します。
    - **macOS のクラウド同期された状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期ベースのパスは I/O の低速化やロック/同期競合を引き起こす可能性があります。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込みで遅くなり、摩耗が早まる可能性があります。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合（履歴が蓄積されていない状態）を検出します。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ全体に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全ユーザーに読み取り可能な場合に警告し、`600` へ制限することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 期限切れ）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンの期限が近い/期限切れの場合に警告し、安全な場合は更新できます。Anthropic の OAuth/トークンプロファイルが古い場合、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）のみ表示されます。`--non-interactive` では更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーから再サインインを求められた場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジットの失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックスが有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドするかレガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーの OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル済み Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドル済みマニフェストを隠してしまう可能性がある、孤立または復元された管理対象 npm コピーのバンドル済み `@openclaw/*` Plugin が含まれます。

    Doctor は、設定で参照されているがローカル Plugin レジストリで見つからない、欠落したダウンロード可能 Plugin も再インストールできます。例には、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、doctor はコアパッケージの入れ替え中にパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定リロードはパッケージマネージャーを実行しません。Plugin のインストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「extra」として検出されません。

    Linux では、ユーザーレベルの Gateway サービスが欠落している一方で、システムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動ではインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時 Matrix 移行">
    Matrix チャンネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成してから、ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は継続します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常のヘルスパスの一部として、デバイスペアリング状態も検査するようになりました。

    報告内容:

    - 初回ペアリングリクエストの保留
    - すでにペアリング済みのデバイスに対するロールアップグレードの保留
    - すでにペアリング済みのデバイスに対するスコープアップグレードの保留
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブなトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - Gateway 側のトークンローテーションより前の、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリングリクエストの自動承認やデバイストークンの自動ローテーションは行いません。代わりに正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、一般的な「すでにペアリング済みなのに、まだペアリングが必要と表示される」穴が塞がれます。doctor は、初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が稼働し続けるよう linger が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、Plugin、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills の状態**: 適格、要件欠落、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` または他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin の状態**: 有効/無効/エラーの Plugin 数を数え、エラーがある場合は Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある Plugin を検出します。
    - **Plugin 診断**: Plugin レジストリから出力された読み込み時の警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、または他の注入コンテキストファイル）が、設定された文字数予算に近いか超過しているかをチェックします。ファイルごとの raw 文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が合計予算に占める割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャンネル Plugin を削除する場合、その Plugin を参照していたぶら下がったチャンネルスコープ設定も削除します。つまり、`channels.<id>` エントリ、そのチャンネル名を指定した Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムが消えているのに設定が Gateway にバインドを求め続ける Gateway ブートループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、PowerShell）にタブ補完がインストールされているかどうかをチェックします。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はより高速なキャッシュファイル方式へアップグレードします。
    - 補完がプロファイルに設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップ）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要だがトークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、それを平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めずに設定済み認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復で、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合は設定済み bot 認証情報の使用を試みます。
    - Telegram bot token が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたり token が欠落していると誤報告したりせずに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    doctor はヘルスチェックを実行し、Gateway が正常でないように見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    doctor は、設定済みのメモリ検索 embedding provider がデフォルトエージェントで準備できているかを確認します。動作は設定済みのバックエンドと provider によって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかをプローブします。できない場合は、npm package と手動バイナリパスの選択肢を含む修正ガイダンスを出力します。
    - **明示的なローカル provider**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。見つからない場合は、リモート provider への切り替えを提案します。
    - **明示的なリモート provider** (`openai`, `voyage` など): API key が環境または auth store に存在することを検証します。欠落している場合は、実行可能な修正ヒントを出力します。
    - **自動 provider**: まずローカルモデルの可用性を確認し、その後 auto-selection order で各リモート provider を試します。

    キャッシュされた Gateway probe 結果が利用可能な場合（確認時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、差異があれば通知します。doctor はデフォルトパスで新しい embedding ping を開始しません。live provider check が必要な場合は、deep memory status コマンドを使ってください。

    実行時の embedding 準備状況を検証するには、`openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャネルステータスの警告">
    Gateway が正常な場合、doctor はチャネルステータス probe を実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に欠落したデフォルトや古いデフォルトがないかを確認します（例: systemd network-online 依存関係と restart delay）。不一致を見つけると、更新を推奨し、service file/task を現在のデフォルトに書き換えることができます。

    注記:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを承認します。
    - `openclaw doctor --repair` は推奨修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway service lifecycle について doctor を読み取り専用に保ちます。service health の報告と non-service repairs は引き続き実行しますが、外部スーパーバイザーがその lifecycle を所有しているため、service install/start/restart/bootstrap、スーパーバイザー設定の書き換え、legacy service cleanup はスキップします。
    - Linux では、一致する systemd Gateway unit がアクティブな間、doctor は command/entrypoint metadata を書き換えません。また duplicate-service scan 中は、非アクティブな non-legacy の追加 gateway-like units を無視するため、companion service files が cleanup noise を作りません。
    - token auth が token を必要とし、`gateway.auth.token` が SecretRef 管理の場合、doctor service install/repair は SecretRef を検証しますが、解決済みの平文 token 値をスーパーバイザーサービス環境メタデータに永続化しません。
    - doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールが inline に埋め込んだ、managed `.env`/SecretRef-backed service environment values を検出し、それらの値がスーパーバイザー定義ではなく runtime source から読み込まれるように service metadata を書き換えます。
    - doctor は、`gateway.port` の変更後も service command が古い `--port` を固定している場合に検出し、service metadata を現在の port に書き換えます。
    - token auth が token を必要とし、設定済み token SecretRef が未解決の場合、doctor は実行可能なガイダンスとともに install/repair path をブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまで install/repair をブロックします。
    - Linux user-systemd units では、doctor token drift checks は service auth metadata を比較するときに `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - doctor service repairs は、設定がより新しいバージョンで最後に書き込まれていた場合、古い OpenClaw バイナリの Gateway service の書き換え、停止、または再起動を拒否します。[Gateway troubleshooting](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard) を参照してください。
    - `openclaw gateway install --force` により、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    doctor は service runtime（PID、last exit status）を検査し、service がインストールされているものの実際には実行されていない場合に警告します。また Gateway port（デフォルト `18789`）での port collisions を確認し、可能性の高い原因（Gateway がすでに実行中、SSH tunnel）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Gateway service が Bun または version-managed Node path（`nvm`, `fnm`, `volta`, `asdf` など）で実行されている場合、doctor は警告します。WhatsApp + Telegram channels には Node が必要で、version-manager paths は service が shell init を読み込まないため、アップグレード後に壊れる可能性があります。doctor は利用可能な場合、system Node install（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgents は、interactive shell PATH をコピーする代わりに、canonical system PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使うため、Volta、asdf、fnm、pnpm、その他の version-manager directories が、どの Node child processes が解決されるかを変えることはありません。Linux services は引き続き明示的な environment roots（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と stable user-bin directories を保持しますが、推測された version-manager fallback directories は、それらのディレクトリがディスク上に存在する場合にのみ service PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    doctor は設定変更を永続化し、doctor run を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    doctor は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開 GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway troubleshooting](/ja-JP/gateway/troubleshooting)

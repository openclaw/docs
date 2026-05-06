---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定の移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-05-06T17:55:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い設定/状態を修正し、ヘルスチェックを行い、実行可能な修復手順を提示します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

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

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は検出時に自動で実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストールをシステムサービスからスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込む前に変更を確認したい場合は、先に設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコル鮮度チェック（プロトコルスキーマのほうが新しい場合に Control UI を再ビルド）。
    - ヘルスチェック + 再起動プロンプト。
    - Skills ステータス概要（対象/不足/ブロック）と plugin ステータス。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況のブラウザー移行チェック。
    - OpenCode provider オーバーライド警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth シャドーイング警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的なのにツールポリシーがワイルドカードまたは plugin 所有ツールをまだ要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/agent ディレクトリ/WhatsApp 認証）。
    - レガシー plugin マニフェスト契約キー移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`, `schedule.cron`, トップレベルの delivery/payload フィールド、payload `provider`, 単純な `notify: true` webhook フォールバックジョブ）。
    - レガシー agent runtime-policy の `agents.defaults.agentRuntime` および `agents.list[].agentRuntime` への移行。
    - plugins が有効な場合の古い plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な封じ込め設定として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドで作成された重複 prompt-rewrite ブランチのセッショントランスクリプト修復。
    - wedged subagent の再起動リカバリー tombstone 検出。`--fix` により古い aborted recovery フラグをクリアし、起動時に子を restart-aborted と扱い続けないようにできます。
    - 状態整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証ヘルス: OAuth 期限切れをチェックし、期限が近いトークンを更新でき、auth-profile のクールダウン/無効状態を報告します。
    - 追加 workspace ディレクトリ検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 gateway 検出。
    - Matrix チャネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行中でない、キャッシュ済み launchd ラベル）。
    - チャネルステータス警告（実行中の gateway からプローブ）。
    - ローカル TUI クライアントがまだ実行中で Gateway event-loop ヘルスが低下している場合の WhatsApp 応答性チェック。`--fix` は検証済みのローカル TUI クライアントのみを停止します。
    - primary モデル、fallback、heartbeat/subagent/compaction オーバーライド、hooks、チャネルモデルオーバーライド、セッションルート pin に含まれるレガシー `openai-codex/*` モデル参照の Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、Codex plugin がインストール済み、有効、`codex` harness を提供し、利用可能な OAuth を持つ場合にのみ `agentRuntime.id: "codex"` を選択します。それ以外の場合は `agentRuntime.id: "pi"` を選択します。
    - 任意修復付きの supervisor 設定監査（launchd/systemd/schtasks）。
    - install または update 中に shell の `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ gateway サービス向けの埋め込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node vs Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、pairing">
    - オープン DM ポリシーのセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースが存在しない場合にトークン生成を提示します。トークン SecretRef 設定は上書きしません）。
    - デバイス pairing の問題検出（保留中の初回 pair リクエスト、保留中の role/scope アップグレード、古いローカル device-token キャッシュの drift、paired-record 認証 drift）。

  </Accordion>
  <Accordion title="Workspace と shell">
    - Linux での systemd linger チェック。
    - Workspace bootstrap ファイルサイズチェック（コンテキストファイルの切り詰め/上限接近警告）。
    - デフォルト agent の Skills 準備状況チェック。不足している bin、env、config、OS 要件がある許可済み Skills を報告し、`--fix` で `skills.entries` 内の利用できない Skills を無効化できます。
    - Shell 補完ステータスチェックと自動インストール/アップグレード。
    - メモリ検索 embedding provider 準備状況チェック（ローカルモデル、リモート API キー、または QMD binary）。
    - ソースインストールチェック（pnpm workspace 不一致、不足している UI assets、不足している tsx binary）。
    - 更新済み設定 + ウィザード metadata を書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill と reset

Control UI Dreams scene には、grounded dreaming workflow 向けの **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway の doctor-style RPC methods を使用しますが、`openclaw doctor` CLI の修復/移行の一部ではありません。

実行内容:

- **Backfill** はアクティブな workspace 内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行し、可逆 backfill entries を `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、マークされた backfill diary entries のみを削除します。
- **Clear Grounded** は、historical replay に由来し、まだ live recall や daily support を蓄積していない staged grounded-only short-term entries のみを削除します。

それ単体では実行しないこと:

- `MEMORY.md` を編集しません
- full doctor migrations を実行しません
- staged CLI path を明示的に先に実行しない限り、grounded candidates を live short-term promotion store に自動で stage しません

grounded historical replay を通常の deep promotion lane に反映させたい場合は、代わりに CLI flow を使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` を review surface として維持しながら、grounded durable candidates を short-term dreaming store に stage します。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git checkout で、doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定にレガシー値の形（たとえばチャネル固有のオーバーライドがない `messages.ackReaction`）が含まれる場合、doctor はそれらを現在の schema に正規化します。

    これにはレガシー Talk フラットフィールドも含まれます。現在の公開 Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、realtime voice 設定は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形を provider map に書き換え、レガシーのトップレベル realtime selector（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` に書き換えます。

    Doctor はまた、`plugins.allow` が空でなく、tool policy が
    wildcard または plugin-owned tool entries を使用している場合に警告します。`tools.allow: ["*"]` は実際に読み込まれた plugins
    由来の tools にのみ一致します。排他的な plugin
    allowlist を迂回するものではありません。Doctor は、移行された
    legacy allowlist configs に既存の bundled provider behavior を保持するため
    `plugins.bundledDiscovery: "compat"` を書き込み、その後、より厳格な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に deprecated keys が含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新済み schema で `~/.openclaw/openclaw.json` を書き換えます。

    Gateway 起動はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` は書き換えません。Cron job store migrations も `openclaw doctor --fix` によって処理されます。

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
    - レガシーのトップレベルのリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
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
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルのチャンネル値が残っているチャンネルでは、それらのアカウントスコープの値を、そのチャンネルで選ばれた昇格先アカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトのターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用してください
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシーの拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時も、`api` が将来の enum 値または不明な enum 値に設定されたプロバイダーは、フェイルクローズするのではなくスキップします）

    Doctor の警告には、マルチアカウントチャンネル向けのアカウントデフォルトのガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があると doctor が警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、doctor が警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@mariozechner/pi-ai` の組み込み OpenCode カタログを上書きします。これにより、モデルが誤った API に強制されたり、コストがゼロにされたりする可能性があります。Doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定が削除済みの Chrome 拡張パスをまだ指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    Doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、ホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor が Chrome 側の設定を有効にすることはできません。ホストローカル Chrome MCP には引き続き以下が必要です。

    - Gateway/Node ホスト上の Chromium ベースのブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効になっていること
    - ブラウザー内の最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とします。Existing-session は現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続きマネージドブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは Docker、サンドボックス、リモートブラウザー、またはその他のヘッドレスフローには適用されません。これらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントを調べ、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。調査が証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使用する macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でも調査が実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使用する組み込み Codex OAuth プロバイダーパスを隠す可能性があります。Doctor は、Codex OAuth と並んでそれらの古いトランスポート設定を見つけた場合に警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    Doctor はレガシー `openai-codex/*` モデル参照を確認します。ネイティブ Codex ハーネスのルーティングは、正規の `openai/*` モデル参照と `agentRuntime.id: "codex"` を使用し、そのターンが OpenClaw PI OpenAI パスではなく Codex アプリサーバーハーネスを通るようにします。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントとエージェントごとの参照を書き換えます。これには、プライマリモデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古い永続化済みセッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - 一致するエージェントランタイムは、Codex がインストール済みで、有効化され、`codex` ハーネスを提供し、使用可能な OAuth がある場合のみ、`agentRuntime.id: "codex"` になります。
    - それ以外の場合、一致するエージェントランタイムは `agentRuntime.id: "pi"` になります。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化済みセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルの固定、Codex ハーネスの固定は、検出されたすべてのエージェントセッションストア全体で修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態について、検出されたエージェントセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有元のルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデル固定、ランタイムモデルメタデータ、固定ハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなどの、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、そのまま残されます。そのルートが不要になった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は古いディスク上レイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。doctor はバックアップとしてレガシーフォルダーを残した場合に警告を出します。Gateway/CLI も起動時にレガシーのセッションとエージェントディレクトリを自動移行するため、手動で doctor を実行しなくても履歴/認証/モデルはエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序だけの差分が繰り返しの no-op `doctor --fix` 変更を引き起こすことはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェスト移行">
    Doctor は、インストール済みのすべての Plugin マニフェストについて、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）をスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー cron ストア移行">
    Doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、または上書きされている場合は `cron.store`）についても、互換性のためにスケジューラーがまだ受け入れる古いジョブ形状を確認します。

    現在の cron クリーンアップには以下が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` webhook フォールバックジョブ → `delivery.to=cron.webhook` を伴う明示的な `delivery.mode="webhook"`

    Doctor は、動作を変えずに実行できる場合に限り、`notify: true` ジョブを自動移行します。ジョブがレガシーの notify フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルのスクリプトは現在の OpenClaw では保守されておらず、cron が systemd user bus に到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、各エージェントセッションディレクトリをスキャンし、古い書き込みロックファイル、つまりセッションが異常終了したときに残されたファイルを探します。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるか（PID が死んでいる、または 30 分超過）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合は注記を出力し、`--fix` を付けて再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を検出するため、エージェントセッション JSONL ファイルをスキャンします。この形状は、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな sibling から成ります。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、Gateway 履歴とメモリリーダーは重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定が失われます（別の場所にバックアップがある場合を除く）。

    Doctor は次をチェックします。

    - **状態ディレクトリがない**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、失われたデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントを出力します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決される場合に警告します。同期に支えられたパスでは、I/O が遅くなったりロック/同期の競合が発生したりする可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗が早くなる可能性があるためです。
    - **セッションディレクトリがない**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダがホームディレクトリ間に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全ユーザーに読み取り可能な場合に警告し、`600` への強化を提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth 期限切れ）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近/期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合（TTY）のみ表示されます。`--non-interactive` では更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求めている場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - 長い無効化（請求/クレジットの失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーの OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古い install-stage ディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストを覆い隠す可能性のある孤立または復元された管理対象 npm コピーのバンドル `@openclaw/*` plugins が含まれます。

    Doctor は、設定がダウンロード可能 plugins を参照しているがローカル Plugin レジストリで見つからない場合、それらを再インストールすることもできます。例には、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、doctor はコアパッケージが入れ替えられている間はパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin にまだ復旧が必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定リロードはパッケージマネージャーを実行しません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使う OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンし、クリーンアップヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが存在しないがシステムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認してから、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時 Matrix 移行">
    Matrix チャンネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行します。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常の健全性パスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールに対するアクティブなトークンがないペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしているペアリング済みトークン
    - 現在のマシンのローカルにキャッシュされたデバイストークンエントリのうち、Gateway 側のトークンローテーションより前のもの、または古いスコープメタデータを持つもの

    Doctor はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのにまだペアリングが必要と表示される」穴が塞がれます。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が生存し続けるよう linger が有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 適格、要件不足、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの plugins 数を数えます。エラーがある場合は Plugin ID を列挙します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリが読み込み時に出した警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor はワークスペースブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入済みコンテキストファイル）が、設定済み文字数予算に近いか超過しているかをチェックします。ファイルごとの raw 文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、総予算に対する注入済み総文字数の割合を報告します。ファイルが切り詰められている、または上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整ヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落しているチャンネル Plugin を削除すると、その Plugin を参照していたぶら下がりのチャンネルスコープ設定も削除します。`channels.<id>` エントリ、そのチャンネルを名前指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムが消えているのに設定がまだ Gateway にバインドを求める Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン（`source <(openclaw completion ...)`）を使用している場合、doctor はそれをより高速なキャッシュファイル版へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルがない場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要だがトークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合に限り生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復で、ステータス系コマンドと同じ読み取り専用の SecretRef サマリーモデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合に設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスでは利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報したりする代わりに、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が異常に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで準備できているかを確認します。動作は、設定済みのバックエンドとプロバイダーによって異なります。

    - **QMD backend**: `qmd` バイナリが利用可能で起動可能かをプローブします。そうでない場合は、npm パッケージや手動のバイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。存在しない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`, `voyage`, など): API キーが環境または認証ストアに存在することを検証します。存在しない場合は、実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順に各リモートプロバイダーを試します。

    キャッシュ済みの Gateway プローブ結果が利用可能な場合（チェック時に Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と相互参照し、不一致があれば通知します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、deep メモリステータスコマンドを使ってください。

    ランタイムで埋め込みの準備状態を検証するには、`openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャネルステータス警告">
    Gateway が正常な場合、doctor はチャネルステータスのプローブを実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致が見つかった場合は更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えることができます。

    注:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --repair` は、推奨修正をプロンプトなしで適用します。
    - `openclaw doctor --repair --force` は、カスタムのスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスのライフサイクルについて doctor を読み取り専用に保ちます。サービスのヘルス状態の報告とサービス以外の修復は引き続き実行しますが、サービスのインストール/開始/再起動/bootstrap、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップは、外部スーパーバイザーがそのライフサイクルを所有しているためスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービスのスキャン中に、非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップのノイズを生むことはありません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまでインストール/修復をブロックします。
    - Linux の user-systemd ユニットでは、doctor のトークンドリフトチェックが、サービス認証メタデータの比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定が新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換え、停止、または再起動することを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` で、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、最後の終了ステータス）を検査し、サービスがインストールされているのに実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート衝突も確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`, `fnm`, `volta`, `asdf`, など）で実行されている場合に警告します。WhatsApp + Telegram チャネルには Node が必要であり、サービスはシェル初期化を読み込まないため、バージョンマネージャーパスはアップグレード後に壊れる可能性があります。Doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、標準的なシステム PATH（`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使います。そのため、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリが、Node 子プロセスの解決先を変更することはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`）と安定した user-bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、存在しない場合にワークスペースメモリシステムを提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（非公開の GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

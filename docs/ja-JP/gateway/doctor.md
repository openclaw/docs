---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: doctor コマンド：ヘルスチェック、設定マイグレーション、修復手順
title: 診断
x-i18n:
    generated_at: "2026-05-12T08:45:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古くなった設定/状態を修正し、健全性を確認し、実行可能な修復手順を提示します。

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

    プロンプトなしで実行し、安全な移行（設定の正規化 + ディスク上の状態移動）のみを適用します。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。従来の状態移行は、検出されると自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認したい場合は、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意の事前更新（対話時のみ）。
    - UI プロトコルの鮮度確認（プロトコルスキーマが新しい場合は Control UI を再ビルドします）。
    - 健全性確認 + 再起動プロンプト。
    - Skills 状態サマリー（eligible/missing/blocked）と plugin 状態。

  </Accordion>
  <Accordion title="設定と移行">
    - 従来値の設定正規化。
    - 従来のフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - 従来の Chrome 拡張機能設定と Chrome MCP 対応状況に関するブラウザ移行確認。
    - OpenCode provider オーバーライド警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - Codex OAuth shadowing 警告（`models.providers.openai-codex`）。
    - OpenAI Codex OAuth プロファイル向け OAuth TLS 前提条件の確認。
    - `plugins.allow` が制限的だが tool policy が wildcard または plugin 所有ツールをまだ要求している場合の Plugin/tool allowlist 警告。
    - 従来のディスク上状態移行（sessions/agent dir/WhatsApp auth）。
    - 従来の plugin manifest contract key 移行（`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`）。
    - 従来の cron store 移行（`jobId`, `schedule.cron`, top-level delivery/payload fields, payload `provider`, simple `notify: true` webhook fallback jobs）。
    - 従来のエージェント全体 runtime-policy のクリーンアップ。provider/model runtime policy が有効な route selector です。
    - plugins が有効な場合の古い plugin 設定クリーンアップ。`plugins.enabled=false` の場合、古い plugin 参照は不活性な containment config として扱われ、保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - Session lock file の検査と古い lock のクリーンアップ。
    - 影響を受けた 2026.4.24 ビルドによって作成された重複 prompt-rewrite branch に対する session transcript 修復。
    - 詰まった subagent の restart-recovery tombstone 検出。古い aborted recovery flags をクリアし、起動時に子を restart-aborted と扱い続けないようにする `--fix` 対応。
    - 状態の整合性と権限の確認（sessions, transcripts, state dir）。
    - ローカル実行時の設定ファイル権限確認（chmod 600）。
    - Model auth の健全性: OAuth 有効期限を確認し、期限が近い token を更新でき、auth-profile cooldown/disabled 状態を報告します。
    - 追加 workspace dir の検出（`~/openclaw`）。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - sandboxing が有効な場合の sandbox image 修復。
    - 従来サービスの移行と追加 gateway の検出。
    - Matrix channel の従来状態移行（`--fix` / `--repair` モード）。
    - Gateway runtime 確認（サービスはインストール済みだが実行されていない、cached launchd label）。
    - Channel 状態警告（実行中の gateway から probe）。
    - チャネル固有の権限確認は `openclaw channels capabilities` 配下にあります。たとえば、Discord voice channel 権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - local TUI clients がまだ実行中で Gateway event-loop health が低下している場合の WhatsApp 応答性確認。`--fix` は検証済みの local TUI clients のみを停止します。
    - primary models、fallbacks、heartbeat/subagent/compaction overrides、hooks、channel model overrides、session route pins 内の従来の `openai-codex/*` model refs に対する Codex route 修復。`--fix` はそれらを `openai/*` に書き換え、古い session/whole-agent runtime pins を削除し、canonical OpenAI agent refs はデフォルトの Codex harness に残します。
    - 任意修復付きの supervisor config 監査（launchd/systemd/schtasks）。
    - インストールまたは更新時に shell の `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取得した gateway services の embedded proxy environment クリーンアップ。
    - Gateway runtime best-practice 確認（Node vs Bun、version-manager paths）。
    - Gateway port collision 診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに対するセキュリティ警告。
    - local token mode の Gateway auth 確認（token source が存在しない場合は token generation を提示します。token SecretRef configs は上書きしません）。
    - Device pairing の問題検出（pending first-time pair requests、pending role/scope upgrades、stale local device-token cache drift、paired-record auth drift）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger 確認。
    - Workspace bootstrap file size 確認（context files の切り詰め/上限間近警告）。
    - デフォルトエージェント向け Skills readiness check。missing bins、env、config、OS requirements がある allowed skills を報告し、`--fix` は `skills.entries` 内の利用できない skills を無効化できます。
    - Shell completion 状態確認と自動インストール/アップグレード。
    - Memory search embedding provider readiness check（local model、remote API key、または QMD binary）。
    - Source install 確認（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
    - 更新済み config + ウィザード metadata を書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI の backfill と reset

Control UI Dreams scene には、grounded dreaming workflow 向けの **Backfill**、**Reset**、**Clear Grounded** アクションが含まれます。これらのアクションは gateway doctor 形式の RPC methods を使用しますが、`openclaw doctor` CLI repair/migration の一部では**ありません**。

実行内容:

- **Backfill** は active workspace 内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行し、可逆的な backfill entries を `DREAMS.md` に書き込みます。
- **Reset** は `DREAMS.md` から、マークされた backfill diary entries のみを削除します。
- **Clear Grounded** は historical replay に由来し、まだ live recall または daily support が蓄積されていない staged grounded-only short-term entries のみを削除します。

それ単体では実行**しない**こと:

- `MEMORY.md` は編集しません
- 完全な doctor migrations は実行しません
- staged CLI path を明示的に先に実行しない限り、grounded candidates を live short-term promotion store に自動的に stage しません

grounded historical replay を通常の deep promotion lane に影響させたい場合は、代わりに CLI flow を使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` を review surface として維持しながら、grounded durable candidates を short-term dreaming store に stage します。

## 詳細な動作と根拠

<AccordionGroup>
  <Accordion title="0. 任意更新（git インストール）">
    これが git checkout で doctor が対話的に実行されている場合、doctor 実行前に更新（fetch/rebase/build）を提示します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    設定に従来の値形状（たとえば channel-specific override のない `messages.ackReaction`）が含まれている場合、doctor はそれらを現在のスキーマに正規化します。

    これには従来の Talk flat fields も含まれます。現在の公開 Talk speech config は `talk.provider` + `talk.providers.<provider>` で、realtime voice config は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形状を provider map に書き換え、従来の top-level realtime selectors（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` に書き換えます。

    また Doctor は、`plugins.allow` が空でなく tool policy が
    wildcard または plugin-owned tool entries を使用している場合に警告します。`tools.allow: ["*"]` は実際にロードされる plugins
    からの tools にのみ一致します。exclusive plugin
    allowlist は迂回しません。Doctor は移行された
    従来の allowlist configs に対して `plugins.bundledDiscovery: "compat"` を書き込み、既存の bundled provider behavior を保持したうえで、
    より厳格な `"allowlist"` 設定を示します。

  </Accordion>
  <Accordion title="2. 従来設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。

    Doctor は次を実行します。

    - 見つかった従来キーを説明します。
    - 適用した移行を表示します。
    - 更新済みスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway startup は従来の設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` を書き換えることはありません。Cron job store migrations も `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 可視返信ポリシーがない設定済みチャンネル設定 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - レガシーのトップレベルリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` および `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` および `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` および `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` および `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き `accounts` があるものの、単一アカウント用のトップレベルチャンネル値が残っているチャンネルでは、そのアカウントスコープの値を、そのチャンネル用に選ばれた昇格済みアカウントへ移動します（ほとんどのチャンネルでは `accounts.default`。Matrix は既存の一致する名前付き/default ターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除します。遅いプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使います
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除します（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動時は、`api` が将来の enum 値または未知の enum 値に設定されたプロバイダーも、失敗して閉じるのではなくスキップします）
    - `plugins.entries.codex.config.codexDynamicToolsProfile` を削除します。Codex アプリサーバーは常に Codex ネイティブのワークスペースツールをネイティブのまま保持します

    doctor の警告には、複数アカウントチャンネル向けのアカウント default ガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリーが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があることを doctor が警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、doctor は警告し、設定済みアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`@earendil-works/pi-ai` の組み込み OpenCode カタログをオーバーライドします。これにより、モデルが誤った API に強制されたり、コストがゼロにされたりする可能性があります。doctor は、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できるように警告します。
  </Accordion>
  <Accordion title="2c. ブラウザ移行と Chrome MCP 準備状況">
    ブラウザ設定がまだ削除済みの Chrome 拡張パスを指している場合、doctor は現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使う場合、doctor はホストローカル Chrome MCP パスも監査します。

    - default 自動接続プロファイルについて、同じホストに Google Chrome がインストールされているかを確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースブラウザ 144+
    - ブラウザがローカルで実行中であること
    - そのブラウザでリモートデバッグが有効であること
    - ブラウザで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とします。Existing-session は現在の Chrome MCP ルート制限を保持します。`responsebody`、PDF エクスポート、ダウンロード傍受、バッチアクションなどの高度なルートには、引き続き管理ブラウザまたは raw CDP プロファイルが必要です。

    このチェックは Docker、sandbox、remote-browser、その他の headless フローには**適用されません**。それらは引き続き raw CDP を使います。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。macOS で Homebrew Node を使っている場合、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前にレガシー OpenAI トランスポート設定を `models.providers.openai-codex` の下に追加していた場合、それらが新しいリリースで自動的に使われる組み込み Codex OAuth プロバイダーパスを隠すことがあります。doctor は、古いトランスポート設定が Codex OAuth と並んで存在する場合に警告し、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック挙動を取り戻せるようにします。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    doctor はレガシー `openai-codex/*` モデル参照をチェックします。ネイティブ Codex ハーネスルーティングは正規の `openai/*` モデル参照を使います。OpenAI エージェントターンは OpenClaw PI OpenAI パスではなく、Codex アプリサーバーハーネスを通ります。

    `--fix` / `--repair` モードでは、doctor は影響を受ける default-agent およびエージェントごとの参照を書き換えます。これには、primary モデル、フォールバック、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古い永続化済みセッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex intent は、修復されたエージェントモデル参照のプロバイダー/モデルスコープ `agentRuntime.id: "codex"` エントリーへ移動します。これにより、モデル参照が `openai/*` になった後も `openai-codex:...` 認証プロファイルを選択できます。
    - ランタイム選択はプロバイダー/モデルスコープであるため、古い whole-agent ランタイム設定と永続化済みセッションランタイム pin は削除されます。
    - 修復されたレガシーモデル参照が古い認証パスを維持するために Codex ルーティングを必要とする場合を除き、既存のプロバイダー/モデルランタイムポリシーは保持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリーを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化済みセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイル pin は、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    doctor は、設定済みモデルまたはランタイムを Codex などのプラグイン所有ルートから移動した後に残る、古い自動作成ルート状態について、検出されたエージェントセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有するルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデル pin、ランタイムモデルメタデータ、pin されたハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなどの、自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、そのまま残されます。そのルートがもう意図されていない場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    doctor は古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json` から（`oauth.json` を除く）
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（default アカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor は、バックアップとして残したレガシーフォルダーがある場合に警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動で doctor を実行しなくてもエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップ正規化は現在、構造的等価性で比較するため、キー順序だけの差分が繰り返しの no-op `doctor --fix` 変更を引き起こすことはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    doctor は、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）について、インストール済みのすべての Plugin マニフェストをスキャンします。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換える提案をします。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー cron ストアの移行">
    doctor は cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライド時は `cron.store`）についても、スケジューラーが互換性のためにまだ受け入れている古いジョブ形状をチェックします。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 最上位のペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - 最上位の配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - 単純なレガシー `notify: true` Webhook フォールバックジョブ → `delivery.to=cron.webhook` を指定した明示的な `delivery.mode="webhook"`

    Doctor は、動作を変更せずに処理できる場合にのみ、`notify: true` ジョブを自動移行します。ジョブがレガシー通知フォールバックと既存の非 Webhook 配信モードを組み合わせている場合、doctor は警告し、そのジョブを手動レビュー用に残します。

    Linux では、ユーザーの crontab がまだレガシー `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に、`~/.openclaw/logs/whatsapp-health.log` へ誤った `Gateway inactive` メッセージを書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、各エージェントセッションディレクトリをスキャンして、セッションが異常終了したときに残された古い書き込みロックファイルを探します。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるかどうか（停止した PID、30 分より古い、または OpenClaw 以外のプロセスに属すると証明できる生存 PID）を報告します。`--fix` / `--repair` モードでは古いロックファイルを自動的に削除します。それ以外の場合はメモを出力し、`--fix` 付きで再実行するよう指示します。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状がないか、エージェントセッション JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを含む放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟要素です。`--fix` / `--repair` モードでは、doctor は影響を受けた各ファイルを元の横にバックアップし、Gateway 履歴とメモリリーダーが重複ターンを見なくなるよう、トランスクリプトをアクティブブランチへ書き換えます。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定が失われます（別の場所にバックアップがある場合を除く）。

    Doctor は以下をチェックします。

    - **状態ディレクトリがない**: 壊滅的な状態損失について警告し、ディレクトリの再作成を促し、失われたデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案し、所有者/グループの不一致が検出された場合は `chown` ヒントを出力します。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期ベースのパスは I/O の低下やロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC ベースのランダム I/O は、セッションや認証情報の書き込み時に遅く、摩耗も早くなる可能性があるためです。
    - **セッションディレクトリがない**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリでトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ群に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、doctor はリモートホストで実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` へ厳格化することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証ヘルス（OAuth 有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンの有効期限が近い/切れている場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic セットアップトークンのパスを提案します。更新プロンプトは対話的に実行している場合（TTY）にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、以下の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン（レート制限/タイムアウト/認証失敗）
    - より長い無効化（請求/クレジット失敗）

  </Accordion>
  <Accordion title="6. フックモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない、または禁止されている場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが欠落している場合はビルドするかレガシー名へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーな OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストをシャドウする可能性がある孤立または復旧されたバンドル `@openclaw/*` Plugin の管理 npm コピーが含まれます。Doctor は、`peerDependencies.openclaw` を宣言する管理 npm Plugin にホスト `openclaw` パッケージも再リンクするため、`openclaw/plugin-sdk/*` などのパッケージローカルランタイムインポートは、更新や npm 修復後も解決され続けます。

    Doctor は、設定がダウンロード可能な Plugin を参照しているのにローカル Plugin レジストリで見つからない場合、それらを再インストールすることもできます。例には、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中、doctor はコアパッケージが入れ替えられている間はパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再実行してください。Gateway 起動と設定リロードではパッケージマネージャーは実行されません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップヒント">
    Doctor はレガシー Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway らしいサービスをスキャンし、クリーンアップヒントを出力することもできます。プロファイル名付き OpenClaw Gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落しているが、システムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動的にはインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で調査し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時 Matrix 移行">
    Matrix チャンネルアカウントに保留中または実行可能なレガシー状態移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` なしの `openclaw doctor`）では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常のヘルスパスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス ID はまだ一致しているが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へずれたペアリング済みトークン
    - Gateway 側のトークンローテーションより前の、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリングリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。代わりに、正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを調査する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、よくある「すでにペアリング済みなのに、まだペアリングが必要と表示される」穴がふさがります。doctor は初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が稼働し続けるよう linger が有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態（Skills、plugins、レガシーディレクトリ）">
    Doctor は、デフォルトエージェントのワークスペース状態の要約を出力します。

    - **Skills 状態**: 対象、要件欠落、許可リストでブロックされた Skills の数を数えます。
    - **レガシーワークスペースディレクトリ**: `~/openclaw` またはその他のレガシーワークスペースディレクトリが現在のワークスペースと並んで存在する場合に警告します。
    - **Plugin 状態**: 有効/無効/エラーの Plugin 数を数えます。エラーがある場合は Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリがロード時に出力した警告やエラーを表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入済みコンテキストファイル）が、設定済み文字数予算に近い、または超えているかどうかをチェックします。ファイルごとの raw 文字数と注入後文字数、切り詰め率、切り詰め原因（`max/file` または `max/total`）、合計注入文字数が総予算に占める割合を報告します。ファイルが切り詰められているか上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャンネル Plugin を削除する場合、その Plugin を参照していたぶら下がったチャンネルスコープ設定も削除します。`channels.<id>` エントリ、チャンネル名を指定した Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャンネルランタイムがなくなっているのに設定が Gateway にそれへバインドするよう要求し続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかどうかをチェックします。

    - シェルプロファイルが低速な動的補完パターン（`source <(openclaw completion ...)`）を使っている場合、doctor はそれをより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルで設定されているもののキャッシュファイルが存在しない場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します（インタラクティブモードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック（ローカルトークン）">
    Doctor はローカル Gateway トークン認証の準備状態を確認します。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、doctor はトークンの生成を提案します。
    - `gateway.auth.token` が SecretRef で管理されているものの利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、実行時のフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復のために、ステータス系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使うようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済みのボット認証情報を使おうとします。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが欠落していると誤報したりする代わりに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで利用可能かどうかを確認します。動作は設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを調べます。できない場合、npm パッケージと手動のバイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。欠落している場合、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: API キーが環境または認証ストアに存在することを検証します。欠落している場合は実行可能な修正ヒントを出力します。
    - **自動プロバイダー**: まずローカルモデルの可用性を確認し、その後、自動選択順で各リモートプロバイダーを試します。

    キャッシュ済みの Gateway プローブ結果が利用可能な場合（確認時点で Gateway が正常だった場合）、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細なメモリステータスコマンドを使ってください。

    実行時の埋め込み準備状態を検証するには `openclaw memory status --deep` を使います。

  </Accordion>
  <Accordion title="14. チャンネルステータス警告">
    Gateway が正常な場合、doctor はチャンネルステータスプローブを実行し、推奨修正とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、欠落または古いデフォルト（例: systemd の network-online 依存関係や再起動遅延）がないか確認します。不一致を見つけると、更新を推奨し、サービスファイル/タスクを現在のデフォルトに書き換えられます。

    注記:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを承諾します。
    - `openclaw doctor --repair` は、確認なしで推奨修正を適用します。
    - `openclaw doctor --repair --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスのライフサイクルに対して doctor を読み取り専用に保ちます。サービスの健全性報告と非サービス修復は引き続き実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/開始/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、doctor はコマンド/エントリーポイントメタデータを書き換えません。また、重複サービススキャン中は、非アクティブでレガシーではない追加の Gateway 風ユニットを無視するため、付随するサービスファイルがクリーンアップのノイズを生みません。
    - トークン認証でトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、doctor のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインで埋め込んだ、管理対象の `.env`/SecretRef バックアップのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時ソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合に検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証でトークンが必要で、設定済みのトークン SecretRef が未解決の場合、doctor は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux の user-systemd ユニットでは、doctor のトークンドリフトチェックが、サービス認証メタデータの比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - Doctor のサービス修復は、設定が新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換えたり、停止したり、再起動したりすることを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` でいつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    Doctor はサービスランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされているが実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）のポート衝突を確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要で、バージョンマネージャーのパスはアップグレード後に壊れる可能性があります。これは、サービスがシェル初期化を読み込まないためです。Doctor は、利用可能な場合にシステム Node インストール（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、インタラクティブシェルの PATH をコピーする代わりに、正規のシステム PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使います。そのため、Homebrew 管理のシステムバイナリは引き続き利用可能であり、Volta、asdf、fnm、pnpm、およびその他のバージョンマネージャーディレクトリが、Node 子プロセスの解決先を変更することはありません。Linux サービスは引き続き明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザー bin ディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    Doctor は設定変更を永続化し、doctor 実行を記録するためにウィザードメタデータを付与します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップ + メモリシステム）">
    Doctor は、存在しない場合にワークスペースメモリシステムを提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（プライベート GitHub または GitLab を推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

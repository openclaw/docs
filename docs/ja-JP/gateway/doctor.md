---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更を導入する
sidebarTitle: Doctor
summary: 'doctor コマンド: ヘルスチェック、設定移行、修復手順'
title: 診断
x-i18n:
    generated_at: "2026-06-27T11:27:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復 + 移行ツールです。古い config/state を修正し、ヘルスをチェックし、実行可能な修復手順を提供します。

## クイックスタート

```bash
openclaw doctor
```

### ヘッドレスと自動化モード

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    プロンプトなしでデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    プロンプトなしで推奨修復を適用します（安全な場合は修復 + 再起動）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI またはプリフライト自動化向けに構造化されたヘルスチェックを実行します。このモードは
    読み取り専用です。プロンプト、修復、config の移行、サービスの再起動、state
    への変更は行いません。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    強力な修復も適用します（カスタム supervisor config を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（config の正規化 + ディスク上の state 移動）。人による確認が必要な再起動/サービス/サンドボックスのアクションはスキップします。レガシー state の移行は検出時に自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認したい場合は、先に config ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 読み取り専用 lint モード

`openclaw doctor --lint` は、自動化に適した `openclaw doctor --fix` の sibling です。どちらも doctor ヘルスチェックを使いますが、姿勢が異なります。

| モード                     | プロンプト   | config/state への書き込み     | 出力                 | 用途                      |
| ------------------------ | --------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | あり       | なし                      | 親しみやすいヘルスレポート | 人が状態を確認する         |
| `openclaw doctor --fix`  | 場合による | あり、修復ポリシーに従う | 親しみやすい修復ログ    | 承認済み修復を適用する       |
| `openclaw doctor --lint` | なし        | なし                      | 構造化された findings    | CI、プリフライト、レビューゲート |

近代化されたヘルスチェックは、任意の `repair()` 実装を提供する場合があります。
`doctor --fix` はそれらの修復が存在する場合に適用し、まだ移行されていないチェックには既存の doctor 修復フローを引き続き使用します。
構造化された修復 contract は、修復レポートと検出も分離します。
`detect()` は現在の findings を報告し、`repair()` は変更、
config/file diff、およびファイル以外の副作用を報告できます。これにより、lint チェックに
ミューテーション計画をさせずに、将来の `doctor --fix --dry-run` と diff 出力への移行パスを開いたままにできます。

例:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 出力には次が含まれます。

- `ok`: 選択された severity しきい値を満たす表示対象の finding があったかどうか
- `checksRun`: 実行されたヘルスチェック数
- `checksSkipped`: 選択されたプロファイル、`--only`、または `--skip` によってスキップされたチェック
- `findings`: `checkId`、`severity`、`message`、および任意の
  `path`、`line`、`column`、`ocPath`、`fixHint` を含む構造化診断

終了コード:

- `0`: 選択されたしきい値以上の findings なし
- `1`: 1 つ以上の findings が選択されたしきい値を満たした
- `2`: lint findings を出力する前のコマンド/ランタイム失敗

`--severity-min info|warning|error` を使って、出力内容と非ゼロの lint 終了を引き起こす内容の両方を制御します。`--all` を使うと、デフォルトの自動化セットから除外されている、より深い opt-in チェックを含む完全な lint インベントリを実行します。狭いプリフライトゲートには `--only <id>` を使い、
lint 実行の残りを有効に保ちながら一時的にノイズの多いチェックを除外するには
`--skip <id>` を使います。
`--json`、`--severity-min`、`--all`、`--only`、`--skip` などの lint 出力オプションは
`--lint` と組み合わせる必要があります。通常の doctor 実行と修復実行では
これらは拒否されます。

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="ヘルス、UI、更新">
    - git インストール向けの任意のプリフライト更新（インタラクティブ時のみ）。
    - UI プロトコル freshness チェック（プロトコルスキーマが新しい場合に Control UI を再ビルド）。
    - ヘルスチェック + 再起動プロンプト。
    - Skills ステータス概要（eligible/missing/blocked）と Plugin ステータス。

  </Accordion>
  <Accordion title="Config と移行">
    - レガシー値の config 正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk config 移行。
    - レガシー Chrome 拡張 config と Chrome MCP readiness のブラウザー移行チェック。
    - OpenCode provider override 警告（`models.providers.opencode` / `models.providers.opencode-go`）。
    - レガシー OpenAI Codex provider/profile 移行（`openai-codex` → `openai`）と、古い `models.providers.openai-codex` の shadowing 警告。
    - OpenAI Codex OAuth profile 向け OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的だが tool policy がまだ wildcard または Plugin 所有 tool を要求している場合の Plugin/tool allowlist 警告。
    - レガシーのディスク上 state 移行（sessions/agent dir/WhatsApp auth）。
    - レガシー Plugin manifest contract key 移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシー cron store 移行（`jobId`、`schedule.cron`、トップレベル delivery/payload フィールド、payload `provider`、`notify: true` webhook fallback jobs）。
    - レガシー whole-agent runtime-policy cleanup。provider/model runtime policy が有効な route selector です。
    - Plugin が有効な場合の古い Plugin config cleanup。`plugins.enabled=false` の場合、古い Plugin 参照は inert containment config として扱われ、保持されます。

  </Accordion>
  <Accordion title="State と整合性">
    - Session lock file inspection と stale lock cleanup。
    - 影響を受ける 2026.4.24 ビルドで作成された重複 prompt-rewrite branch の session transcript repair。
    - Wedged subagent restart-recovery tombstone detection。`--fix` は stale aborted recovery flags のクリアをサポートし、startup が child を restart-aborted と扱い続けないようにします。
    - State integrity と permissions checks（sessions、transcripts、state dir）。
    - ローカル実行時の config file permission checks（chmod 600）。
    - Model auth health: OAuth expiry をチェックし、期限切れ間近の token を refresh でき、auth-profile cooldown/disabled states を報告します。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合の sandbox image repair。
    - レガシー service migration と extra gateway detection。
    - Matrix channel legacy state migration（`--fix` / `--repair` モード）。
    - Gateway runtime checks（service installed but not running、cached launchd label）。
    - Channel status warnings（稼働中の Gateway から probe）。
    - Channel 固有の permission checks は `openclaw channels capabilities` 配下にあります。たとえば、Discord voice channel permissions は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - local TUI clients がまだ実行中のまま Gateway event-loop health が低下している場合の WhatsApp responsiveness checks。`--fix` は検証済み local TUI clients のみ停止します。
    - primary models、fallbacks、image/video generation models、heartbeat/subagent/compaction overrides、hooks、channel model overrides、session route pins 内のレガシー `openai-codex/*` model refs に対する Codex route repair。`--fix` はそれらを `openai/*` に書き換え、`openai-codex:*` auth profiles/order を `openai:*` に移行し、stale session/whole-agent runtime pins を削除し、canonical OpenAI agent refs は default Codex harness 上に残します。
    - Supervisor config audit（launchd/systemd/schtasks）と任意の修復。
    - install または update 中に shell の `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway service 向けの embedded proxy environment cleanup。
    - Gateway runtime best-practice checks（Node vs Bun、version-manager paths）。
    - Gateway port collision diagnostics（デフォルト `18789`）。

  </Accordion>
  <Accordion title="Auth、セキュリティ、pairing">
    - open DM policies に対するセキュリティ警告。
    - local token mode の Gateway auth checks（token source が存在しない場合は token generation を提案。token SecretRef configs は上書きしません）。
    - Device pairing trouble detection（pending first-time pair requests、pending role/scope upgrades、stale local device-token cache drift、paired-record auth drift）。

  </Accordion>
  <Accordion title="Workspace と shell">
    - Linux の systemd linger check。
    - Workspace bootstrap file size check（context files の truncation/near-limit warnings）。
    - default agent 向け Skills readiness check。missing bins、env、config、OS requirements がある allowed skills を報告し、`--fix` は `skills.entries` 内の unavailable skills を無効化できます。
    - Shell completion status check と auto-install/upgrade。
    - Memory search embedding provider readiness check（local model、remote API key、または QMD binary）。
    - Source install checks（pnpm workspace mismatch、missing UI assets、missing tsx binary）。
    - 更新済み config + ウィザード metadata を書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI backfill と reset

Control UI Dreams scene には、grounded dreaming workflow 向けの **Backfill**、**Reset**、**Clear Grounded** アクションがあります。これらのアクションは gateway doctor-style RPC methods を使いますが、`openclaw doctor` CLI repair/migration の一部では**ありません**。

実行内容:

- **Backfill** は active workspace 内の履歴 `memory/YYYY-MM-DD.md` ファイルをスキャンし、grounded REM diary pass を実行し、可逆な backfill entries を `DREAMS.md` に書き込みます。
- **Reset** は、`DREAMS.md` からそれらの marked backfill diary entries のみを削除します。
- **Clear Grounded** は、historical replay から来た、まだ live recall や daily support を蓄積していない staged grounded-only short-term entries のみを削除します。

それ自体では**実行しない**こと:

- `MEMORY.md` は編集しません
- full doctor migrations は実行しません
- 明示的に staged CLI path を先に実行しない限り、grounded candidates を live short-term promotion store に自動で stage しません

grounded historical replay を通常の deep promotion lane に影響させたい場合は、代わりに CLI flow を使います。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、`DREAMS.md` を review surface として維持しながら、grounded durable candidates を short-term dreaming store に stage します。

## 詳細な挙動と根拠

<AccordionGroup>
  <Accordion title="0. 任意の update（git installs）">
    これが git checkout で、doctor がインタラクティブに実行されている場合、doctor 実行前に update（fetch/rebase/build）を提案します。
  </Accordion>
  <Accordion title="1. Config 正規化">
    config にレガシー値 shape（たとえば channel-specific override のない `messages.ackReaction`）が含まれる場合、doctor はそれらを現在の schema に正規化します。

    これにはレガシー Talk flat fields が含まれます。現在の public Talk speech config は `talk.provider` + `talk.providers.<provider>` で、realtime voice config は `talk.realtime.*` です。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` shape を provider map に書き換え、レガシー top-level realtime selectors（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）を `talk.realtime` に書き換えます。

    Doctor は、`plugins.allow` が空でなく、ツールポリシーが
    ワイルドカードまたは Plugin 所有のツールエントリを使っている場合も警告します。`tools.allow: ["*"]` は、実際に読み込まれる Plugin
    のツールにのみ一致します。排他的な Plugin
    許可リストを迂回するものではありません。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定に非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` を実行するよう求めます。

    Doctor は次を行います。

    - 見つかったレガシーキーを説明します。
    - 適用した移行を表示します。
    - 更新されたスキーマで `~/.openclaw/openclaw.json` を書き換えます。

    Gateway 起動はレガシー設定形式を拒否し、`openclaw doctor --fix` を実行するよう求めます。起動時に `openclaw.json` を書き換えることはありません。Cron ジョブストアの移行も `openclaw doctor --fix` によって処理されます。

    現在の移行:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 廃止された `channels.webchat` と `gateway.webchat` を削除
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → トップレベルの `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - レガシーのトップレベルリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`）+ `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` と `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` と `messages.tts.providers.microsoft`
    - TTS スピーカー選択フィールド（`voice`/`voiceName`/`voiceId`）→ `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）→ `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` と `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` と `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 名前付き `accounts` を持つチャネルに、単一アカウント時代のトップレベルチャネル値が残っている場合、そのアカウントスコープの値を、そのチャネルで選ばれた昇格済みアカウントへ移動します（ほとんどのチャネルでは `accounts.default`。Matrix は既存の一致する名前付き/デフォルトターゲットを保持できます）
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`（tools/elevated/exec/sandbox/subagents）
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` を削除。低速なプロバイダー/モデルのタイムアウトには `models.providers.<id>.timeoutSeconds` を使い、実行全体をそれより長く継続する必要がある場合は、エージェント/実行タイムアウトをその値より大きく保ちます
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` を削除（レガシー拡張リレー設定）
    - レガシー `models.providers.*.api: "openai"` → `"openai-completions"`（Gateway 起動は、`api` が将来の enum 値または不明な enum 値に設定されたプロバイダーも、フェイルクローズせずにスキップします）
    - `plugins.entries.codex.config.codexDynamicToolsProfile` を削除。Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのまま保持します

    Doctor の警告には、複数アカウントチャネル向けのアカウントデフォルトガイダンスも含まれます。

    - 2 つ以上の `channels.<channel>.accounts` エントリが `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、Doctor はフォールバックルーティングが予期しないアカウントを選ぶ可能性があると警告します。
    - `channels.<channel>.defaultAccount` が不明なアカウント ID に設定されている場合、Doctor は警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダー上書き">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `openclaw/plugin-sdk/llm` の組み込み OpenCode カタログを上書きします。これにより、モデルが誤った API に割り当てられたり、コストがゼロになったりする可能性があります。Doctor は、上書きを削除してモデルごとの API ルーティングとコストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 準備状況">
    ブラウザー設定がまだ削除済みの Chrome 拡張パスを指している場合、Doctor はそれを現在のホストローカル Chrome MCP アタッチモデルへ正規化します。

    - `browser.profiles.*.driver: "extension"` は `"existing-session"` になります
    - `browser.relayBindHost` は削除されます

    Doctor は、`defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使う場合に、ホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイル向けに、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合に警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor は Chrome 側の設定を有効化できません。ホストローカル Chrome MCP には引き続き次が必要です。

    - Gateway/Node ホスト上の Chromium ベースブラウザー 144+
    - ブラウザーがローカルで実行されていること
    - そのブラウザーでリモートデバッグが有効であること
    - ブラウザーで最初のアタッチ同意プロンプトを承認すること

    ここでの準備状況は、ローカルアタッチの前提条件だけを対象にしています。Existing-session は現在の Chrome MCP ルート制限を保持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理ブラウザーまたは raw CDP プロファイルが必要です。

    このチェックは、Docker、サンドボックス、リモートブラウザー、その他のヘッドレスフローには適用されません。それらは引き続き raw CDP を使います。

  </Accordion>
  <Accordion title="2d. OAuth TLS 前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、Doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、または自己署名証明書）で失敗した場合、Doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使っている macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダー上書き">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、それらは新しいリリースが自動的に使う組み込み Codex OAuth プロバイダーパスを隠す可能性があります。Doctor は、Codex OAuth と一緒にそれらの古いトランスポート設定を見つけると警告します。これにより、古いトランスポート上書きを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみの上書きは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    Doctor はレガシー `openai-codex/*` モデル参照を確認します。ネイティブ Codex ハーネスのルーティングは正規の `openai/*` モデル参照を使います。OpenAI エージェントターンは、OpenClaw OpenAI プロバイダーパスではなく Codex app-server ハーネスを通ります。

    `--fix` / `--repair` モードでは、Doctor は影響を受けるデフォルトエージェントおよびエージェントごとの参照を書き換えます。対象には、プライマリモデル、フォールバック、画像/動画生成モデル、Heartbeat/subagent/Compaction 上書き、フック、チャネルモデル上書き、古い永続セッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex 意図は、修復されたエージェントモデル参照のプロバイダー/モデルスコープ `agentRuntime.id: "codex"` エントリへ移動します。
    - ランタイム選択はプロバイダー/モデルスコープであるため、古いエージェント全体のランタイム設定と永続セッションのランタイム固定は削除されます。
    - 修復されたレガシーモデル参照が古い認証パスを維持するために Codex ルーティングを必要としない限り、既存のプロバイダー/モデルランタイムポリシーは保持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続セッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイル固定は、検出されたすべてのエージェントセッションストアで修復されます。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使う」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後、検出されたエージェントセッションストアに古い自動作成ルート状態が残っていないかもスキャンします。

    `openclaw doctor --fix` は、所有ルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデル固定、ランタイムモデルメタデータ、固定ハーネス ID、CLI セッションバインディング、自動認証プロファイル上書きなどの自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、そのまま残されます。そのルートが不要になった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は、古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト:
      - `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ:
      - `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）:
      - レガシー `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から
      - `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。Doctor は、バックアップとして残すレガシーフォルダーがある場合に警告を出します。Gateway/CLI も起動時にレガシーのセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動の Doctor 実行なしでエージェントごとのパスに収まります。WhatsApp 認証は意図的に `openclaw doctor` でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は現在、構造的等価性で比較するため、キー順序だけの差分で不要な `doctor --fix` 変更が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    診断機能は、インストール済みのすべての Plugin マニフェストについて、非推奨のトップレベル capability キー (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`) をスキャンします。見つかった場合は、それらを `contracts` オブジェクトに移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` キーにすでに同じ値がある場合、データを重複させずにレガシーキーを削除します。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    診断機能は、Cron ジョブストア (デフォルトでは `~/.openclaw/cron/jobs.json`、上書き時は `cron.store`) についても、スケジューラーが互換性のためにまだ受け付けている古いジョブ形状を確認します。

    現在の Cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド (`message`, `model`, `thinking`, ...) → `payload`
    - トップレベルの配信フィールド (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - レガシーの `notify: true` Webhook フォールバックジョブ → `cron.webhook` が設定されている場合は明示的な Webhook 配信。announce ジョブはチャット配信を維持し、`delivery.completionDestination` を取得します。`cron.webhook` が未設定の場合、ランタイム配信はそれを読み取らないため、ターゲットのないジョブでは不活性なトップレベル `notify` マーカーが削除されます (announce を含む既存の配信は保持されます)

    Gateway は読み込み時に不正な形式の Cron 行もサニタイズするため、有効なジョブは実行され続けます。不正な生の行は、`jobs.json` から削除される前に、アクティブなストアの隣にある `jobs-quarantine.json` にコピーされます。診断機能は隔離された行を報告するため、手動で確認または修復できます。

    Gateway 起動時はランタイム投影を正規化し、トップレベルの `notify` マーカーを無視しますが、永続化された Cron 設定は診断機能による修復用に残します。`cron.webhook` が未設定の場合、診断機能は移行先のないジョブ (`delivery.mode` が none/欠落、使用できない Webhook ターゲット、または既存の announce/チャット配信) から不活性マーカーを削除し、既存の配信には触れません。そのため、`doctor --fix` を繰り返し実行しても同じジョブについて再警告されなくなります。`cron.webhook` が設定されていても有効な HTTP(S) URL でない場合、診断機能は引き続き警告し、URL を修正できるようにマーカーを残します。

    Linux では、ユーザーの crontab がまだレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも診断機能が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、Cron が systemd ユーザーバスに到達できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` に書き込む可能性があります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    診断機能は、すべてのエージェントセッションディレクトリをスキャンし、セッションが異常終了したときに残された古い書き込みロックファイルを検出します。見つかった各ロックファイルについて、パス、PID、PID がまだ生存しているか、ロックの経過時間、古いとみなされるか (PID が死んでいる、所有者メタデータが不正、30 分より古い、または生存 PID が OpenClaw 以外のプロセスに属することを証明できる) を報告します。`--fix` / `--repair` モードでは、死んだ、孤立した、再利用された、不正かつ古い、または OpenClaw 以外の所有者を持つロックを自動的に削除します。生存中の OpenClaw プロセスがまだ所有している古いロックは報告されますが、診断機能がアクティブなトランスクリプト書き込みを遮断しないよう、そのまま残されます。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    診断機能は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状を、エージェントセッション JSONL ファイルからスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟が存在する形状です。`--fix` / `--repair` モードでは、診断機能は影響を受ける各ファイルを元の隣にバックアップし、トランスクリプトをアクティブブランチに書き換えるため、Gateway 履歴とメモリリーダーが重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック (セッション永続化、ルーティング、安全性)">
    状態ディレクトリは運用上の中枢です。これが消えると、セッション、認証情報、ログ、設定を失います (別の場所にバックアップがある場合を除く)。

    診断機能は次を確認します。

    - **状態ディレクトリの欠落**: 壊滅的な状態損失について警告し、ディレクトリの再作成を促し、欠落したデータは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します (所有者/グループの不一致が検出された場合は `chown` ヒントも出力します)。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) または `~/Library/CloudStorage/...` の配下に解決される場合に警告します。同期バックアップされたパスは I/O の低下やロック/同期競合を引き起こす可能性があるためです。
    - **Linux の SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD または eMMC バックアップのランダム I/O は、セッションと認証情報の書き込み時に遅く、摩耗が早い可能性があるためです。
    - **Linux の揮発性状態ディレクトリ**: 状態が `tmpfs` または `ramfs` に解決される場合に警告します。セッション、認証情報、設定、および WAL/ジャーナルのサイドカーを持つ SQLite 状態が再起動時に消えるためです。Docker の `overlay` マウントは、コンテナが残っている間は書き込み可能レイヤーがホスト再起動をまたいで永続化されるため、意図的にフラグされません。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリにトランスクリプトファイルが欠落している場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグします (履歴が蓄積されていません)。
    - **複数の状態ディレクトリ**: ホームディレクトリ全体に複数の `~/.openclaw` フォルダーが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します (履歴がインストール間で分断される可能性があります)。
    - **リモートモードのリマインダー**: `gateway.mode=remote` の場合、診断機能はリモートホストで実行するよう通知します (状態はそこに存在します)。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員に読み取り可能な場合に警告し、`600` への強化を提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性 (OAuth 有効期限)">
    診断機能は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合 (TTY) にのみ表示されます。`--non-interactive` は更新の試行をスキップします。

    OAuth 更新が恒久的に失敗した場合 (たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを要求している場合)、診断機能は再認証が必要であることを報告し、実行する正確な `openclaw models auth login --provider ...` コマンドを出力します。

    診断機能は、次の理由で一時的に使用できない認証プロファイルも報告します。

    - 短いクールダウン (レート制限/タイムアウト/認証失敗)
    - より長い無効化 (請求/クレジット失敗)

    トークンが macOS Keychain に存在するレガシー Codex OAuth プロファイル (ファイルベースのサイドカーレイアウト以前の古いオンボーディング) は、診断機能によってのみ修復されます。対話型ターミナルから `openclaw doctor --fix` を一度実行し、Keychain バックアップのレガシートークンを `auth-profiles.json` にインライン移行してください。その後、埋め込みターン (Telegram、Cron、サブエージェントディスパッチ) は、それらを正規の OpenAI OAuth プロファイルとして解決します。

  </Accordion>
  <Accordion title="6. フックのモデル検証">
    `hooks.gmail.model` が設定されている場合、診断機能はモデル参照をカタログおよび許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、診断機能は Docker イメージを確認し、現在のイメージが欠落している場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    診断機能は、`openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーの OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。これには、古い生成済み依存関係ルート、古い install-stage ディレクトリ、以前のバンドル Plugin 依存関係修復コードによるパッケージローカルの残骸、現在のバンドルマニフェストを隠してしまう可能性がある孤立または復旧済みのバンドル `@openclaw/*` Plugin の管理対象 npm コピーが含まれます。診断機能は、`peerDependencies.openclaw` を宣言する管理対象 npm Plugin にホストの `openclaw` パッケージを再リンクするため、`openclaw/plugin-sdk/*` のようなパッケージローカルのランタイムインポートは、更新後や npm 修復後も解決され続けます。

    診断機能は、設定がダウンロード可能な Plugin を参照しているがローカル Plugin レジストリで見つからない場合に、欠落している Plugin を再インストールすることもできます。例には、実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイムが含まれます。パッケージ更新中は、コアパッケージが差し替えられている間、診断機能はパッケージマネージャーによる Plugin 修復の実行を避けます。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定リロードはパッケージマネージャーを実行しません。Plugin インストールは明示的な診断/インストール/更新作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップヒント">
    診断機能はレガシー Gateway サービス (launchd/systemd/schtasks) を検出し、それらを削除して現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。追加の Gateway らしいサービスをスキャンし、クリーンアップヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものとみなされ、「extra」としてフラグされません。

    Linux では、ユーザーレベルの Gateway サービスが欠落しているがシステムレベルの OpenClaw Gateway サービスが存在する場合、診断機能は 2 つ目のユーザーレベルサービスを自動インストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャンネルアカウントに保留中または実行可能なレガシー状態移行がある場合、診断機能は (`--fix` / `--repair` モードで) 移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態準備です。どちらの手順も致命的ではありません。エラーはログに記録され、起動は続行します。読み取り専用モード (`--fix` なしの `openclaw doctor`) では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    診断機能は通常のヘルスパスの一部として、デバイスペアリング状態を検査するようになりました。

    報告内容:

    - 保留中の初回ペアリングリクエスト
    - すでにペアリング済みのデバイスに対する保留中のロールアップグレード
    - すでにペアリング済みのデバイスに対する保留中のスコープアップグレード
    - デバイス id はまだ一致しているが、デバイス ID が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールに対するアクティブトークンが欠落しているペアリング済みレコード
    - スコープが承認済みペアリングベースラインの外へドリフトしたペアリング済みトークン
    - Gateway 側のトークンローテーションより前の、または古いスコープメタデータを持つ、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    診断機能はペアリングリクエストの自動承認やデバイストークンの自動ローテーションは行いません。代わりに正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを確認する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、「すでにペアリング済みなのにペアリング必須と表示される」一般的な抜け穴が解消されます。診断機能は、初回ペアリング、保留中のロール/スコープのアップグレード、古いトークンやデバイス ID のずれを区別するようになりました。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    診断機能は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd ユーザーサービスとして実行している場合、診断機能はログアウト後も Gateway が稼働し続けるように linger が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペースの状態 (Skills、Plugin、TaskFlow)">
    診断機能は、デフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills の状態**: 対象、要件不足、許可リストでブロックされた Skills の数。
    - **Plugin の状態**: 有効/無効/エラー状態の Plugin 数を数え、エラーがある場合は Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性に問題がある Plugin にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリから出された読み込み時の警告やエラーを表示します。
    - **TaskFlow リカバリー**: 手動での確認またはキャンセルが必要な疑わしい管理対象 TaskFlow を表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    診断機能は、ワークスペースのブートストラップファイル (例: `AGENTS.md`、`CLAUDE.md`、その他の注入されたコンテキストファイル) が設定済みの文字数予算に近い、または超過していないかを確認します。ファイルごとの未加工文字数と注入後文字数、切り詰め率、切り詰め原因 (`max/file` または `max/total`)、合計注入文字数が総予算に占める割合を報告します。ファイルが切り詰められている、または上限に近い場合、診断機能は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを出力します。
  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が見つからないチャンネル Plugin を削除するとき、その Plugin を参照していた宙ぶらりんのチャンネルスコープ設定も削除します: `channels.<id>` エントリ、チャンネル名を指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` のオーバーライド。これにより、チャンネルランタイムはなくなっているのに設定が Gateway にそのチャンネルへのバインドを求め続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="11c. シェル補完">
    診断機能は、現在のシェル (zsh、bash、fish、または PowerShell) にタブ補完がインストールされているかを確認します。

    - シェルプロファイルが遅い動的補完パターン (`source <(openclaw completion ...)`) を使っている場合、診断機能はそれをより高速なキャッシュ済みファイル方式へアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルがない場合、診断機能は自動的にキャッシュを再生成します。
    - 補完がまったく設定されていない場合、診断機能はインストールを促します (対話モードのみ。`--non-interactive` ではスキップされます)。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行します。

  </Accordion>
  <Accordion title="12. Gateway 認証チェック (ローカルトークン)">
    診断機能は、ローカル Gateway トークン認証の準備状態を確認します。

    - トークンモードでトークンが必要で、トークンソースが存在しない場合、診断機能はトークンの生成を提案します。
    - `gateway.auth.token` が SecretRef 管理で利用できない場合、診断機能は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに設定済み認証情報を調べる必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、ステータス系コマンドと同じ読み取り専用 SecretRef 概要モデルを使用するようになりました。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` の `@username` 修復は、利用可能な場合は設定済みボット認証情報の使用を試みます。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの現在のコマンドパスで利用できない場合、診断機能はその認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが見つからないと誤報告したりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    診断機能はヘルスチェックを実行し、Gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    診断機能は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで利用可能かを確認します。動作は、設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを検査します。できない場合、npm パッケージと手動バイナリパスのオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識済みのリモート/ダウンロード可能なモデル URL を確認します。見つからない場合、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`、`voyage` など): API キーが環境または認証ストアに存在することを検証します。ない場合、実行可能な修正ヒントを出力します。
    - **レガシー自動プロバイダー**: `memorySearch.provider: "auto"` を OpenAI として扱い、OpenAI の準備状態を確認し、`doctor --fix` はそれを `provider: "openai"` に書き換えます。

    キャッシュ済みの Gateway 検査結果が利用できる場合 (チェック時点で Gateway が正常だった場合)、診断機能はその結果を CLI から見える設定と照合し、不一致があれば記録します。診断機能はデフォルトパスでは新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、詳細メモリステータスコマンドを使用してください。

    ランタイムでの埋め込み準備状態を検証するには `openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャンネル状態の警告">
    Gateway が正常な場合、診断機能はチャンネル状態の検査を実行し、推奨修正を添えて警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査 + 修復">
    診断機能は、インストール済みのスーパーバイザー設定 (launchd/systemd/schtasks) に不足または古いデフォルト (例: systemd の network-online 依存関係や再起動遅延) がないかを確認します。不一致を見つけると、更新を推奨し、サービスファイル/タスクを現在のデフォルトへ書き換えることができます。

    注記:

    - `openclaw doctor` はスーパーバイザー設定を書き換える前に確認します。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --fix` は推奨修正をプロンプトなしで適用します (`--repair` はエイリアスです)。
    - `openclaw doctor --fix --force` はカスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、Gateway サービスのライフサイクルについて診断機能を読み取り専用に保ちます。サービスの健全性は引き続き報告し、サービス以外の修復も実行しますが、外部スーパーバイザーがそのライフサイクルを所有しているため、サービスのインストール/起動/再起動/ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、一致する systemd Gateway ユニットがアクティブな間、診断機能はコマンド/エントリポイントのメタデータを書き換えません。また、重複サービススキャン中は非アクティブな非レガシーの追加 Gateway 風ユニットを無視するため、関連サービスファイルによるクリーンアップノイズを発生させません。
    - トークン認証がトークンを必要とし、`gateway.auth.token` が SecretRef 管理の場合、診断機能のサービスインストール/修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービス環境メタデータに永続化しません。
    - 診断機能は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ、管理対象 `.env`/SecretRef 由来のサービス環境値を検出し、それらの値がスーパーバイザー定義ではなくランタイムソースから読み込まれるようにサービスメタデータを書き換えます。
    - 診断機能は、`gateway.port` の変更後もサービスコマンドが古い `--port` を固定している場合を検出し、サービスメタデータを現在のポートへ書き換えます。
    - トークン認証がトークンを必要とし、設定済みトークン SecretRef が未解決の場合、診断機能は実行可能なガイダンスとともにインストール/修復パスをブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、診断機能はモードが明示的に設定されるまでインストール/修復をブロックします。
    - Linux のユーザー systemd ユニットでは、診断機能のトークンずれチェックが、サービス認証メタデータの比較時に `Environment=` と `EnvironmentFile=` の両方のソースを含むようになりました。
    - 診断機能のサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換え、停止、または再起動することを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` でいつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイム + ポート診断">
    診断機能はサービスランタイム (PID、最後の終了ステータス) を調べ、サービスがインストールされているが実際には実行されていない場合に警告します。また、Gateway ポート (デフォルト `18789`) のポート競合を確認し、可能性の高い原因 (Gateway がすでに実行中、SSH トンネル) を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    診断機能は、Gateway サービスが Bun またはバージョン管理された Node パス (`nvm`、`fnm`、`volta`、`asdf` など) で実行されている場合に警告します。WhatsApp + Telegram チャンネルには Node が必要で、バージョンマネージャーのパスは、サービスがシェル初期化を読み込まないためアップグレード後に壊れる可能性があります。診断機能は、利用可能な場合はシステム Node インストール (Homebrew/apt/choco) への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgent は、対話シェルの PATH をコピーする代わりに、正規のシステム PATH (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) を使用します。そのため、Homebrew 管理のシステムバイナリは引き続き利用できる一方で、Volta、asdf、fnm、pnpm、その他のバージョンマネージャーディレクトリによって、Node 子プロセスが解決する対象が変わることはありません。Linux サービスは引き続き明示的な環境ルート (`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`) と安定したユーザーバイナリディレクトリを保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、それらのディレクトリがディスク上に存在する場合にのみサービス PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定書き込み + ウィザードメタデータ">
    診断機能は設定変更を永続化し、診断実行を記録するためにウィザードメタデータを刻印します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント (バックアップ + メモリシステム)">
    診断機能は、ワークスペースメモリシステムがない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ (非公開の GitHub または GitLab を推奨) の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway ランブック](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

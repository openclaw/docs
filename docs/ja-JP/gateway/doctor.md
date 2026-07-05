---
read_when:
    - doctor マイグレーションの追加または変更
    - 破壊的な設定変更の導入
sidebarTitle: Doctor
summary: 'Doctor コマンド: ヘルスチェック、設定マイグレーション、修復手順'
title: ドクター
x-i18n:
    generated_at: "2026-07-05T11:21:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f949b29dcede364149aead58b4117f1e0f16461de155061c0697abd823b95733
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復および移行ツールです。古い設定/状態を修正し、健全性をチェックし、実行可能な修復手順を提示します。

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

    確認プロンプトなしでデフォルトを受け入れます（該当する場合は再起動/サービス/サンドボックスの修復手順を含む）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    確認プロンプトなしで推奨される修復を適用します（`--repair` はエイリアスです）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI またはプリフライト自動化向けに構造化された健全性チェックを実行します。読み取り専用です。プロンプト、修復、移行、再起動、状態の書き込みは行いません。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    積極的な修復も適用します（カスタム supervisor 設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトなしで実行し、安全な移行のみを適用します（設定の正規化 + ディスク上の状態移動）。人間の確認が必要な再起動/サービス/サンドボックス操作はスキップします。レガシー状態の移行は、検出された場合は引き続き自動実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストール（launchd/systemd/schtasks）についてシステムサービスをスキャンします。

  </Tab>
</Tabs>

書き込み前に変更を確認するには、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 読み取り専用 lint モード

`openclaw doctor --lint` は、`openclaw doctor --fix` の自動化しやすい兄弟コマンドです。どちらも同じ健全性チェックを実行しますが、姿勢だけが異なります。

| モード                   | プロンプト | 設定/状態を書き込む     | 出力                   | 用途                            |
| ------------------------ | ---------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | あり       | なし                    | 親しみやすい健全性レポート | 人が状態を確認する場合          |
| `openclaw doctor --fix`  | 場合による | あり、修復ポリシーに従う | 親しみやすい修復ログ   | 承認済みの修復を適用する場合    |
| `openclaw doctor --lint` | なし       | なし                    | 構造化された検出結果   | CI、プリフライト、レビューゲート |

健全性チェックは任意の `repair()` 実装を提供できます。`doctor --fix` は存在する場合にそれを適用し、存在しない場合はレガシーの doctor 修復フローにフォールバックします。この契約では、`detect()`（検出結果を報告）と `repair()`（変更/差分/副作用を報告）を分離しているため、lint チェックを変更計画に変えることなく、将来の `doctor --fix --dry-run` への道を残しています。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 出力フィールド:

- `ok`: 選択された重大度しきい値を満たす検出結果があったかどうか
- `checksRun` / `checksSkipped`: 件数（プロファイル、`--only`、または `--skip` によってスキップ）
- `findings`: `checkId`、`severity`、`message`、および任意の `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint` を含む構造化診断

終了コード:

| コード | 意味                                                     |
| ------ | -------------------------------------------------------- |
| `0`    | 選択されたしきい値以上の検出結果なし                    |
| `1`    | 1 件以上の検出結果が選択されたしきい値を満たした         |
| `2`    | 検出結果を出力する前にコマンド/ランタイムが失敗した      |

フラグ:

- `--severity-min info|warning|error`（デフォルトは `warning`）: 何を出力するか、および何が非ゼロ終了を引き起こすかの両方を制御します。
- `--all`: デフォルトの自動化セットから除外されているオプトインチェックを含め、登録済みのすべてのチェックを実行します。
- `--only <id>`（繰り返し可能）: 名前付きチェック ID のみを実行します。不明な ID はエラー検出結果として報告されます。
- `--skip <id>`（繰り返し可能）: 実行の残りを有効にしたまま、チェックを除外します。
- `--json`、`--severity-min`、`--all`、`--only`、`--skip` は `--lint` を必要とします。通常の `openclaw doctor` と `--fix` の実行では拒否されます。

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、更新">
    - git インストール向けの任意のプリフライト更新（対話モードのみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマが新しい場合は Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills 状態サマリー（対象/不足/ブロック）と Plugin 状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシー値形式の設定正規化。
    - レガシーのフラットな `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定移行。
    - レガシー Chrome 拡張機能設定と Chrome MCP 準備状況のブラウザー移行チェック。
    - OpenCode プロバイダー上書き警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - レガシー OpenAI Codex プロバイダー/プロファイル移行（`openai-codex` → `openai`）と、古い `models.providers.openai-codex` に対するシャドーイング警告。
    - OpenAI Codex OAuth プロファイル向けの OAuth TLS 前提条件チェック。
    - `plugins.allow` が制限的なのにツールポリシーがまだワイルドカードまたは Plugin 所有ツールを要求している場合の Plugin/ツール許可リスト警告。
    - レガシーのディスク上状態移行（セッション/agent ディレクトリ/WhatsApp 認証）。
    - レガシー Plugin マニフェスト契約キー移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシー cron ストア移行（`jobId`、`schedule.cron`、トップレベルの delivery/payload フィールド、payload `provider`、`notify: true` Webhook フォールバックジョブ）。
    - `agents.defaults`、`agents.list[]`、`models.providers.*`（モデル単位のエントリを含む）全体での Codex CLI ランタイムピン修復（`agentRuntime.id: "codex-cli"` → `"codex"`）。
    - Plugin が有効な場合の古い Plugin 設定クリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な封じ込め設定として保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドで作成された重複プロンプト書き換えブランチに対するセッショントランスクリプト修復。
    - 詰まったサブエージェントの再起動リカバリ tombstone 検出。古い中止済みリカバリフラグをクリアして、起動時に子を再起動中止済みとして扱い続けないようにする `--fix` サポート付き。
    - 状態の整合性と権限チェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性: OAuth 期限切れをチェックし、期限が近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。

  </Accordion>
  <Accordion title="Gateway、サービス、supervisor">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーサービス移行と追加 Gateway 検出。
    - Matrix チャンネルのレガシー状態移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムチェック（サービスはインストール済みだが実行中でない、キャッシュされた launchd ラベル）。
    - チャンネル状態警告（実行中の Gateway からプローブ）。
    - チャンネル固有の権限チェックは `openclaw channels capabilities` 配下にあります。たとえば、Discord 音声チャンネル権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - ローカル TUI クライアントがまだ実行中の場合に、劣化した Gateway event-loop 健全性について WhatsApp 応答性をチェックします。`--fix` は検証済みのローカル TUI クライアントのみを停止します。
    - プライマリモデル、フォールバック、画像/動画生成モデル、heartbeat/サブエージェント/compaction 上書き、hooks、チャンネルモデル上書き、セッションルートピンに含まれるレガシー `openai-codex/*` モデル参照の Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、`openai-codex:*` 認証プロファイル/順序を `openai:*` に移行し、古いセッション/agent 全体のランタイムピンを削除し、正規の OpenAI agent 参照をデフォルト Codex ハーネスに残します。
    - 任意の修復付き supervisor 設定監査（launchd/systemd/schtasks）。
    - インストールまたは更新中にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービス向けの組み込みプロキシ環境クリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーパス）。
    - Gateway ポート衝突診断（デフォルト `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープン DM ポリシーに対するセキュリティ警告。
    - local token モードの Gateway 認証チェック（トークンソースが存在しない場合はトークン生成を提示します。token SecretRef 設定は上書きしません）。
    - デバイスペアリングの問題検出（初回ペアリング要求の保留、ロール/スコープアップグレードの保留、古いローカルデバイストークンキャッシュのドリフト、ペアリング済みレコードの認証ドリフト）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペースブートストラップファイルのサイズチェック（コンテキストファイルの切り詰め/上限間近警告）。
    - デフォルト agent の Skills 準備状況チェック。不足している bin、env、設定、または OS 要件がある許可済み Skills を報告し、`--fix` は `skills.entries` 内の利用不能な Skills を無効化できます。
    - シェル補完の状態チェックと自動インストール/アップグレード。
    - メモリ検索 embedding プロバイダーの準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールチェック（pnpm ワークスペース不一致、UI アセット不足、tsx バイナリ不足）。
    - 更新された設定 + ウィザードメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、グラウンデッド Dreaming ワークフロー向けの **Backfill**、**Reset**、**Clear Grounded** アクションが含まれます。これらは Gateway の doctor 形式 RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行の一部では**ありません**。

| アクション     | 実行内容                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backfill       | アクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、グラウンデッド REM diary パスを実行して、可逆的なバックフィルエントリを `DREAMS.md` に書き込みます。 |
| Reset          | `DREAMS.md` からマークされたバックフィル diary エントリのみを削除します。                                                                                          |
| Clear Grounded | ライブ recall または日次サポートがまだ蓄積されていない、履歴 replay 由来のステージ済み grounded-only 短期エントリのみを削除します。                              |

これらはいずれも `MEMORY.md` を編集したり、完全な doctor 移行を実行したり、グラウンデッド候補を単独でライブ短期 promotion ストアにステージしたりしません。グラウンデッド履歴 replay を通常の深い promotion レーンに投入するには、代わりに CLI フローを使用します。

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

これにより、グラウンデッドな durable 候補が短期 Dreaming ストアにステージされ、`DREAMS.md` はレビュー面として残ります。

## 詳細な動作と根拠

  <AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git チェックアウトで、doctor が対話的に実行されている場合、doctor の実行前に更新（fetch/rebase/build）するかを提示します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    ドクターはレガシーな値の形を現在のスキーマに正規化します。現在の Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、リアルタイム音声設定は `talk.realtime.*` の下にあります。ドクターは古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` の形をプロバイダーマップへ書き換え、レガシーなトップレベルのリアルタイムセレクター（`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`）を `talk.realtime` へ書き換えます。

    ドクターは、`plugins.allow` が空でなく、ツールポリシーがワイルドカードまたは Plugin 所有のツール項目を使っている場合にも警告します。`tools.allow: ["*"]` は、実際に読み込まれる Plugin のツールだけに一致します。排他的な Plugin 許可リストを迂回するものではありません。

  </Accordion>
  <Accordion title="2. レガシー設定キーの移行">
    設定にアクティブな移行がある非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。ドクターは見つかったレガシーキーを説明し、適用した移行を表示して、更新後のスキーマで `~/.openclaw/openclaw.json` を書き換えます。Gateway の起動はレガシー設定形式を拒否し、`openclaw doctor --fix` の実行を求めます。起動時に `openclaw.json` を書き換えることはありません。Cron ジョブストアの移行も `openclaw doctor --fix` によって処理されます。

    <Note>
      ドクターが自動移行を保持するのは、キーが廃止されてからおよそ2か月間だけです。それより古いレガシーキー（たとえば、マルチエージェント以前の設定形状に由来する元の `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、`routing.transcribeAudio`、トップレベルの `agent.*`、またはトップレベルの `identity`）には、もはや移行パスがありません。それらを使った設定は、書き換えられるのではなく検証に失敗します。ドクターが続行できるようにする前に、現在の設定リファレンスに照らしてそれらのキーを手動で修正してください。
    </Note>

    アクティブな移行:

    | レガシーキー                                                                                    | 現在のキー                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 削除済み（WebChat は廃止済み）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（およびアカウント別）      | `...threadBindings.idleHours`                                               |
    | レガシー `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | レガシーなトップレベルのリアルタイム Talk セレクター（`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`） | `talk.realtime`                                                              |
    | `messages.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS スピーカーフィールド `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`（Discord を除くすべてのチャンネル）                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`（Discord を含むすべてのチャンネル）                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>`（`openai`/`elevenlabs`/`microsoft`/`edge`）     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（Gateway 起動時は、`api` が将来の値または未知の列挙値であるプロバイダーも、失敗して閉じるのではなくスキップします） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 削除済み（レガシーな Chrome 拡張機能リレー設定）                             |
    | `mcp.servers.*.type`（CLI ネイティブエイリアス）                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 削除済み（Codex アプリサーバーは常に Codex ネイティブのワークスペースツールをネイティブのまま保持） |
    | `commands.modelsWrite`                                                                           | 削除済み（`/models add` は非推奨）                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 削除済み（完全一致の `NO_REPLY` は、表示されるフォールバックテキストへ書き換えられなくなりました）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 削除済み（OpenClaw が生成されるシステムプロンプトを所有します）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 削除済み（遅いモデル/プロバイダーのタイムアウトには、エージェント/実行タイムアウトの上限未満に保たれる `models.providers.<id>.timeoutSeconds` を使用） |
    | トップレベルの `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任意のレベル）                                                            | 削除済み（メモリーインデックスは各エージェントデータベース内に存在）                       |
    | トップレベルの `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` ポリシー ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 削除済み（非推奨）                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上記の `plugins.entries.voice-call.config.*` 行は、`openclaw doctor` ではなく Voice Call Plugin 自体によって、設定を読み込むたびに正規化されます。この Plugin は `openclaw doctor --fix` を指す起動時警告もログに出力しますが、現在のところドクターはこれらのキーについて `openclaw.json` を書き換えません。実行時に変更を適用するのは Plugin 自身の正規化です。
    </Note>

    マルチアカウントチャンネルのアカウント既定値ガイダンス:

    - 2つ以上の `channels.<channel>.accounts` 項目が `channels.<channel>.defaultAccount` または `accounts.default` なしで設定されている場合、フォールバックルーティングが予期しないアカウントを選ぶ可能性があるとドクターが警告します。
    - `channels.<channel>.defaultAccount` が未知のアカウント ID に設定されている場合、ドクターは警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダー上書き">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、それは `openclaw/plugin-sdk/llm` の組み込み OpenCode カタログを上書きします。これにより、モデルが誤った API に強制されたり、コストがゼロ化されたりする可能性があります。ドクターは、上書きを削除してモデルごとの API ルーティング + コストを復元できるよう警告します。
  </Accordion>
  <Accordion title="2c. ブラウザー移行と Chrome MCP 対応準備">
    ブラウザー設定が、削除済みの Chrome 拡張機能パスをまだ指している場合、ドクターはそれを現在のホストローカル Chrome MCP アタッチモデル（`browser.profiles.*.driver: "extension"` → `"existing-session"`、`browser.relayBindHost` は削除）へ正規化します。

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使う場合、ドクターはホストローカル Chrome MCP パスも監査します:

    - デフォルトの自動接続プロファイル用に、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome バージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページでリモートデバッグを有効にするよう通知します（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）

    Doctor は Chrome 側の設定を有効にすることはできません。ホストローカルの Chrome MCP には引き続き、gateway/node ホスト上でローカル実行され、リモートデバッグが有効で、ブラウザー内の初回アタッチ同意プロンプトが承認済みの Chromium ベースブラウザー 144+ が必要です。

    ここでの準備完了状態は、ローカルアタッチの前提条件のみを対象にします。既存セッションは現在の Chrome MCP ルート制限を維持します。`responsebody`、PDF エクスポート、ダウンロードインターセプト、バッチアクションなどの高度なルートには、引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です。このチェックは Docker、sandbox、remote-browser、その他のヘッドレスフローには適用されず、それらは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できるか確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れ証明書、自己署名証明書）で失敗した場合、doctor はプラットフォーム固有の修正ガイダンスを出力します。Homebrew Node を使用する macOS では、通常の修正は `brew postinstall ca-certificates` です。`--deep` では、Gateway が正常な場合でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーオーバーライド">
    以前にレガシー OpenAI トランスポート設定を `models.providers.openai-codex` の下に追加していた場合、それらが新しいリリースで自動的に使われる組み込み Codex OAuth プロバイダーパスを隠すことがあります。Doctor は、Codex OAuth と併せてそれらの古いトランスポート設定を検出した場合に警告します。これにより、古いトランスポートオーバーライドを削除または書き換えて、組み込みのルーティング/フォールバック動作を取り戻せます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しません。
  </Accordion>
  <Accordion title="2f. Codex ルート修復">
    Doctor はレガシーな `openai-codex/*` モデル参照を確認します。ネイティブ Codex ハーネスルーティングは正規の `openai/*` モデル参照を使用します。OpenAI エージェントターンは OpenClaw OpenAI プロバイダーパスではなく、Codex アプリサーバーハーネスを経由します。

    `--fix` / `--repair` モードでは、doctor は影響を受けるデフォルトエージェントおよびエージェントごとの参照を書き換えます。対象には、プライマリモデル、フォールバック、画像/動画生成モデル、heartbeat/subagent/compaction オーバーライド、フック、チャンネルモデルオーバーライド、古い永続化セッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex intent は、修復されたエージェントモデル参照のプロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリへ移動します。
    - ランタイム選択はプロバイダー/モデルスコープのため、古いエージェント全体のランタイム設定と永続化セッションのランタイムピンは削除されます。
    - 修復されたレガシーモデル参照が古い認証パスを維持するために Codex ルーティングを必要とする場合を除き、既存のプロバイダー/モデルランタイムポリシーは保持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化セッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルピンは、検出されたすべてのエージェントセッションストアで修復されます。
    - Doctor は、古い `agentRuntime.id: "codex-cli"` ピン（別のレガシーランタイム ID）を、`agents.defaults`、`agents.list[]`、`models.providers.*` モデルエントリ全体で個別に `"codex"` へ修復します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態についても、検出されたエージェントセッションストアをスキャンします。

    `openclaw doctor --fix` は、所有元ルートが設定されなくなった場合に、`modelOverrideSource: "auto"` モデルピン、ランタイムモデルメタデータ、固定ハーネス ID、CLI セッションバインディング、自動認証プロファイルオーバーライドなどの自動作成された古い状態をクリアできます。明示的なユーザーまたはレガシーセッションのモデル選択は手動レビュー用に報告され、変更されません。そのルートが不要になった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は古いオンディスクレイアウトを現在の構造へ移行できます。

    - セッションストア + トランスクリプト: `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ: `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）: レガシー `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトアカウント ID: `default`）

    これらの移行はベストエフォートで冪等です。doctor は、バックアップとして残したレガシーフォルダーがある場合に警告を出します。Gateway/CLI も起動時にレガシーセッション + エージェントディレクトリを自動移行するため、履歴/認証/モデルは手動の doctor 実行なしでエージェントごとのパスに配置されます。WhatsApp 認証は意図的に `openclaw doctor` 経由でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化は構造的等価性で比較するため、キー順序のみの差分で `doctor --fix` の no-op 変更が繰り返されることはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェスト移行">
    Doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル capability キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えることを提案します。この移行は冪等です。`contracts` にすでに同じ値がある場合、データを重複させずにレガシーキーが削除されます。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストア移行">
    Doctor は、cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、またはオーバーライド時は `cron.store`）についても、スケジューラーが互換性のためにまだ受け入れる古いジョブ形状を確認します。

    現在の cron クリーンアップには次が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベル payload フィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベル delivery フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - payload の `provider` delivery エイリアス → 明示的な `delivery.channel`
    - レガシーな `notify: true` Webhook フォールバックジョブ → `cron.webhook` が設定されている場合はそこから明示的な Webhook delivery へ。announce ジョブは chat delivery を維持し、`delivery.completionDestination` を取得します。`cron.webhook` が未設定の場合、ターゲットのないジョブでは非アクティブなトップレベル `notify` マーカーが削除されます（announce を含む既存の delivery は保持されます）。ランタイム delivery はそれを読み取らないためです。

    Gateway は、ロード時に不正な cron 行もサニタイズするため、有効なジョブは実行を継続します。raw の不正行は `jobs.json` から削除される前に、アクティブストアの隣の `jobs-quarantine.json` へコピーされます。doctor は隔離された行を報告するため、手動でレビューまたは修復できます。

    Gateway 起動時にはランタイム投影が正規化され、トップレベルの `notify` マーカーは無視されますが、永続化された cron 設定は doctor 修復用に残されます。`cron.webhook` が未設定の場合、doctor は移行ターゲットのないジョブ（`delivery.mode` が none/欠落、使用できない Webhook ターゲット、または既存の announce/chat delivery）から非アクティブなマーカーを削除し、既存の delivery は変更しません。そのため、`doctor --fix` を繰り返し実行しても同じジョブについて再警告されなくなります。`cron.webhook` が設定されているものの有効な HTTP(S) URL でない場合、doctor は引き続き警告し、URL を修正できるようマーカーを残します。

    Linux では、ユーザーの crontab がまだレガシーな `~/.openclaw/bin/ensure-whatsapp.sh` を呼び出している場合にも doctor が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、cron が systemd ユーザーバスに到達できない場合に `~/.openclaw/logs/whatsapp-health.log` へ誤った `Gateway inactive` メッセージを書き込むことがあります。古い crontab エントリは `crontab -e` で削除してください。現在のヘルスチェックには `openclaw channels status --probe`、`openclaw doctor`、`openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロッククリーンアップ">
    Doctor は、セッションが異常終了した際に残された古い書き込みロックファイルについて、すべてのエージェントセッションディレクトリをスキャンします。見つかった各ロックファイルについて、パス、PID、その PID がまだ生存しているか、ロックの経過時間、古いと見なされるか（終了済み PID、不正な所有者メタデータ、30 分超、または OpenClaw 以外のプロセスに属することが証明された生存 PID）を報告します。`--fix` / `--repair` モードでは、終了済み、孤立、再利用、不正かつ古い、または OpenClaw 以外の所有者を持つロックを自動的に削除します。生存中の OpenClaw プロセスがまだ所有している古いロックは報告されますが、アクティブなトランスクリプトライターを遮断しないよう、そのまま残されます。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形状について、エージェントセッション JSONL ファイルをスキャンします。これは、OpenClaw 内部ランタイムコンテキストを持つ放棄されたユーザーターンと、同じ表示ユーザープロンプトを含むアクティブな兄弟が存在する状態です。`--fix` / `--repair` モードでは、doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブブランチへ書き換えるため、gateway 履歴とメモリーリーダーが重複ターンを見なくなります。
  </Accordion>
  <Accordion title="4. 状態整合性チェック（セッション永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の中枢です。これが消えると、他の場所にバックアップがない限り、セッション、認証情報、ログ、設定を失います。

    Doctor は次を確認します。

    - **状態ディレクトリの欠落**: 壊滅的な状態喪失について警告し、ディレクトリの再作成を促し、欠落データは復元できないことを通知します。
    - **状態ディレクトリの権限**: 書き込み可能性を検証します。権限の修復を提案します（所有者/グループの不一致が検出された場合は `chown` ヒントを出します）。
    - **macOS のクラウド同期状態ディレクトリ**: 状態が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` の下に解決される場合に警告します。同期バックアップされたパスは I/O の低速化やロック/同期競合を引き起こす可能性があるためです。
    - **Linux SD または eMMC 状態ディレクトリ**: 状態が `mmcblk*` マウントソースに解決される場合に警告します。SD/eMMC バックアップのランダム I/O は、セッションおよび認証情報の書き込みで遅く、消耗が速い可能性があるためです。
    - **Linux 揮発性状態ディレクトリ**: 状態が `tmpfs` または `ramfs` に解決される場合に警告します。セッション、認証情報、設定、SQLite 状態（WAL/journal サイドカーを含む）が再起動時に消えるためです。Docker の `overlay` マウントは意図的に対象外です。コンテナーが残っている間、その書き込み可能レイヤーはホスト再起動をまたいで永続化されるためです。
    - **セッションディレクトリの欠落**: 履歴を永続化し、`ENOENT` クラッシュを避けるために、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプト不一致**: 最近のセッションエントリにトランスクリプトファイルが欠けている場合に警告します。
    - **メインセッションの「1 行 JSONL」**: メイントランスクリプトが 1 行しかない場合にフラグを立てます（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**: 複数の `~/.openclaw` フォルダーがホームディレクトリ全体に存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（履歴がインストール間で分割される可能性があります）。
    - **リモートモード通知**: `gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態はそこにあります）。
    - **設定ファイルの権限**: `~/.openclaw/openclaw.json` がグループ/全員から読み取り可能な場合に警告し、`600` への強化を提案します。

  </Accordion>
  <Accordion title="5. モデル認証ヘルス (OAuth 期限切れ)">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが期限切れ間近または期限切れの場合に警告し、安全な場合は更新できます。Anthropic OAuth/トークンプロファイルが古い場合は、Anthropic API キーまたは Anthropic setup-token パスを提案します。更新プロンプトは対話的に実行している場合 (TTY) にのみ表示されます。`--non-interactive` は更新試行をスキップします。

    OAuth 更新が恒久的に失敗した場合 (たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーが再サインインを求める場合)、doctor は再認証が必要であることを報告し、実行する正確な `openclaw models auth login --provider ...` コマンドを出力します。

    Doctor は、短いクールダウン (レート制限/タイムアウト/認証失敗) またはより長い無効化 (請求/クレジット失敗) により一時的に使用できない認証プロファイルも報告します。

    トークンが macOS Keychain にあるレガシー Codex OAuth プロファイル (ファイルベースのサイドカーレイアウト以前の古いオンボーディング) は、doctor によってのみ修復されます。対話型ターミナルから `openclaw doctor --fix` を一度実行して、Keychain-backed のレガシートークンをインラインで `auth-profiles.json` に移行してください。その後、埋め込みターン (Telegram、cron、サブエージェントディスパッチ) はそれらを正規の OpenAI OAuth プロファイルとして解決します。

  </Accordion>
  <Accordion title="6. フックのモデル検証">
    `hooks.gmail.model` が設定されている場合、doctor はモデル参照をカタログと許可リストに照らして検証し、解決できない、または許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージ修復">
    サンドボックス化が有効な場合、doctor は Docker イメージをチェックし、現在のイメージが見つからない場合はビルドまたはレガシー名への切り替えを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、レガシーの OpenClaw 生成 Plugin 依存関係ステージング状態を削除します。古い生成済み依存関係ルート、古い install-stage ディレクトリ、以前のバンドル Plugin 依存関係修復コードによる package-local な残骸、現在のバンドルマニフェストをシャドウする可能性がある孤立または復旧済みのバンドル `@openclaw/*` plugins の managed npm コピーが対象です。Doctor は、`peerDependencies.openclaw` を宣言する managed npm plugins にホスト `openclaw` パッケージも再リンクするため、更新や npm 修復後も `openclaw/plugin-sdk/*` のような package-local なランタイムインポートは解決され続けます。

    Doctor は、設定で参照されているもののローカル Plugin レジストリで見つからない、欠落したダウンロード可能な plugins も再インストールできます (実体のある `plugins.entries`、設定済みのチャネル/プロバイダー/検索設定、設定済みのエージェントランタイム)。パッケージ更新中、doctor はコアパッケージが差し替えられている間はパッケージマネージャーによる Plugin 修復を実行しません。設定済み Plugin の復旧がまだ必要な場合は、更新後に `openclaw doctor --fix` を再度実行してください。Gateway 起動と設定再読み込みはパッケージマネージャーを実行しません。Plugin インストールは明示的な doctor/install/update 作業のままです。

  </Accordion>
  <Accordion title="8. Gateway サービス移行とクリーンアップのヒント">
    Doctor はレガシー Gateway サービス (launchd/systemd/schtasks) を検出し、それらを削除して現在の Gateway ポートを使う OpenClaw サービスをインストールすることを提案します。追加の Gateway 風サービスをスキャンしてクリーンアップのヒントを出力することもできます。プロファイル名付きの OpenClaw Gateway サービスは第一級のものと見なされ、「extra」としてフラグ付けされません。

    Linux では、ユーザーレベルの Gateway サービスが見つからないがシステムレベルの OpenClaw Gateway サービスが存在する場合、doctor は 2 つ目のユーザーレベルサービスを自動ではインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で検査し、重複を削除するか、システムスーパーバイザーが Gateway ライフサイクルを所有している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャネルアカウントに保留中または対応可能なレガシー状態移行がある場合、doctor (`--fix` / `--repair` モード) は移行前スナップショットを作成し、その後ベストエフォートの移行手順を実行します。レガシー Matrix 状態移行とレガシー暗号化状態の準備です。どちらの手順も非致命的です。エラーはログに記録され、起動は続行します。読み取り専用モード (`--fix` なしの `openclaw doctor`) では、このチェックは完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスペアリングと認証ドリフト">
    Doctor は通常のヘルスパスの一部としてデバイスペアリング状態を検査し、次を報告します。

    - 初回ペアリングリクエストの保留
    - 既にペアリング済みのデバイスに対するロールまたはスコープアップグレードの保留
    - デバイス ID はまだ一致するが、デバイス ID 情報が承認済みレコードと一致しなくなった公開鍵不一致の修復
    - 承認済みロールのアクティブなトークンがないペアリング済みレコード
    - スコープが承認済みペアリングベースラインから外れたペアリング済みトークン
    - Gateway 側のトークンローテーションより古い、または古いスコープメタデータを持つ、現在のマシンのローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリクエストを自動承認したり、デバイストークンを自動ローテーションしたりしません。正確な次の手順を出力します。

    - `openclaw devices list` で保留中のリクエストを検査する
    - `openclaw devices approve <requestId>` で正確なリクエストを承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除して再承認する

    これにより、初回ペアリング、保留中のロール/スコープアップグレード、古いトークン/デバイス ID 情報のドリフトが区別され、よくある「既にペアリング済みなのにまだペアリングが必要と表示される」穴を塞ぎます。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    Doctor は、プロバイダーが許可リストなしで DM に開かれている場合、またはポリシーが危険な方法で設定されている場合に警告を出します。
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が生き続けるよう lingering が有効であることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペース状態 (Skills、plugins、TaskFlows)">
    Doctor はデフォルトエージェントのワークスペース状態の概要を出力します。

    - **Skills 状態**: 対象、要件不足、許可リストでブロックされた skills の数。
    - **Plugin 状態**: 有効/無効/エラーの plugins の数。エラーがある場合は Plugin ID を列挙します。バンドル Plugin の機能を報告します。
    - **Plugin 互換性警告**: 現在のランタイムとの互換性問題がある plugins にフラグを立てます。
    - **Plugin 診断**: Plugin レジストリによって発行されたロード時の警告またはエラーを表示します。
    - **TaskFlow 復旧**: 手動検査またはキャンセルが必要な疑わしい managed TaskFlows を表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルサイズ">
    Doctor は、ワークスペースのブートストラップファイル (たとえば `AGENTS.md`、`CLAUDE.md`、その他の注入済みコンテキストファイル) が設定済み文字数予算に近い、または超えているかをチェックします。ファイルごとの raw と注入済みの文字数、切り捨て率、切り捨て原因 (`max/file` または `max/total`)、および総予算に対する総注入文字数の割合を報告します。ファイルが切り捨てられている、または制限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` の調整に関するヒントを出力します。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル (zsh、bash、fish、PowerShell) にタブ補完がインストールされているかをチェックします。

    - シェルプロファイルが遅い動的補完パターン (`source <(openclaw completion ...)`) を使用している場合、doctor はより高速なキャッシュファイル方式にアップグレードします。
    - 補完がプロファイルで設定されているがキャッシュファイルが欠落している場合、doctor はキャッシュを自動で再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールを促します (対話モードのみ。`--non-interactive` ではスキップ)。

    キャッシュを手動で再生成するには `openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="11d. 古いチャネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が欠落したチャネル Plugin を削除するとき、その Plugin を参照していたぶら下がったチャネルスコープの設定も削除します。`channels.<id>` エントリ、チャネルを指定していた Heartbeat ターゲット、`agents.*.models["<channel>/*"]` オーバーライドです。これにより、チャネルランタイムがなくなっているのに設定が Gateway にそれへバインドするよう求め続ける Gateway 起動ループを防ぎます。
  </Accordion>
  <Accordion title="12. Gateway 認証チェック (ローカルトークン)">
    Doctor はローカル Gateway トークン認証の準備状態をチェックします。

    - トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef 管理だが利用できない場合、doctor は警告し、それを平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークン SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. 読み取り専用の SecretRef 対応修復">
    一部の修復フローでは、ランタイムの fail-fast 動作を弱めずに設定済み資格情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、status 系コマンドと同じ読み取り専用 SecretRef サマリーモデルを使用します。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` `@username` 修復は、利用可能な場合に設定済み bot 資格情報の使用を試みます。
    - Telegram bot トークンが SecretRef 経由で設定されているが現在のコマンドパスで利用できない場合、doctor は資格情報が設定済みだが利用できないことを報告し、クラッシュしたりトークンが欠落していると誤報告したりする代わりに自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway ヘルスチェック + 再起動">
    Doctor はヘルスチェックを実行し、Gateway が不健全に見える場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状態">
    Doctor は、設定済みのメモリ検索埋め込みプロバイダーがデフォルトエージェントで準備できているかをチェックします。動作は設定済みのバックエンドとプロバイダーに依存します。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動可能かをプローブします。そうでない場合、`npm install -g @tobilu/qmd` (または Bun の同等手順) と手動バイナリパスオプションを含む修正ガイダンスを出力します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイルまたは認識済みのリモート/ダウンロード可能モデル URL があるかをチェックします。欠落している場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー** (`openai`、`voyage` など): API キーが環境または認証ストアに存在することを検証します。欠落している場合は対応可能な修正ヒントを出力します。
    - **レガシー自動プロバイダー**: `memorySearch.provider: "auto"` を OpenAI として扱い、OpenAI の準備状態をチェックし、`doctor --fix` はそれを `provider: "openai"` に書き換えます。

    キャッシュ済み Gateway プローブ結果が利用可能な場合 (チェック時に Gateway が正常だった場合)、doctor はその結果を CLI から見える設定と照合し、不一致があれば記録します。Doctor はデフォルトパスで新しい埋め込み ping を開始しません。ライブのプロバイダーチェックが必要な場合は、deep メモリ状態コマンドを使用してください。

    ランタイムで埋め込み準備状態を検証するには `openclaw memory status --deep` を使用してください。

  </Accordion>
  <Accordion title="14. チャネル状態警告">
    Gateway が正常な場合、doctor はチャネル状態プローブを実行し、推奨修正付きの警告を報告します。
  </Accordion>
  <Accordion title="15. Supervisor 設定監査 + 修復">
    Doctor はインストール済み supervisor 設定 (launchd/systemd/schtasks) に、欠落または古いデフォルト (たとえば systemd network-online 依存関係や再起動遅延) がないかをチェックします。不一致が見つかった場合、更新を推奨し、サービスファイル/タスクを現在のデフォルトへ書き換えることができます。

    注:

    - `openclaw doctor` は、supervisor 設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` はデフォルトの修復プロンプトを受け入れます。
    - `openclaw doctor --fix` はプロンプトなしで推奨修正を適用します（`--repair` はエイリアスです）。
    - `openclaw doctor --fix --force` はカスタム supervisor 設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` は、gateway service lifecycle について doctor を読み取り専用に保ちます。service health の報告と非サービス修復の実行は引き続き行いますが、外部 supervisor がそのライフサイクルを所有しているため、service install/start/restart/bootstrap、supervisor 設定の書き換え、legacy service cleanup はスキップします。
    - Linux では、doctor は一致する systemd gateway unit がアクティブな間、command/entrypoint metadata を書き換えません。また duplicate-service scan 中、非アクティブな non-legacy extra gateway-like units を無視するため、companion service files が cleanup noise を生みません。
    - token auth にトークンが必要で、`gateway.auth.token` が SecretRef 管理の場合、doctor service install/repair は SecretRef を検証しますが、解決済みの plaintext token values を supervisor service environment metadata に永続化しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストールがインラインに埋め込んだ managed `.env`/SecretRef-backed service environment values を検出し、それらの値が supervisor definition ではなく runtime source から読み込まれるように service metadata を書き換えます。
    - Doctor は、`gateway.port` の変更後も service command が古い `--port` を固定している場合に検出し、service metadata を現在のポートに書き換えます。
    - token auth にトークンが必要で、設定済み token SecretRef が解決されていない場合、doctor は実行可能なガイダンスとともに install/repair path をブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor は mode が明示的に設定されるまで install/repair をブロックします。
    - Linux user-systemd units では、doctor token drift checks は service auth metadata を比較するときに `Environment=` と `EnvironmentFile=` の両方の sources を含めます。
    - Doctor service repairs は、設定が最後に新しいバージョンによって書き込まれている場合、古い OpenClaw バイナリから gateway service を書き換え、停止、または再起動することを拒否します。[Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` でいつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway runtime + port diagnostics">
    Doctor は service runtime（PID、last exit status）を検査し、サービスがインストールされているが実際には実行されていない場合に警告します。また gateway port（デフォルト `18789`）での port collisions を確認し、考えられる原因（gateway がすでに実行中、SSH tunnel）を報告します。
  </Accordion>
  <Accordion title="17. Gateway runtime best practices">
    Doctor は、gateway service が Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp と Telegram チャンネルには Node が必要で、version-manager paths は、サービスが shell init を読み込まないため、アップグレード後に壊れる可能性があります。Doctor は、利用可能な場合は system Node install（Homebrew/apt/choco）への移行を提案します。

    新しくインストールまたは修復された macOS LaunchAgents は、対話型 shell PATH をコピーする代わりに、canonical system PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。そのため、Homebrew 管理の system binaries は利用可能なままですが、Volta、asdf、fnm、pnpm、およびその他の version-manager directories は、どの Node child processes が解決されるかを変えません。Linux services は引き続き明示的な environment roots（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と stable user-bin directories を保持しますが、推測された version-manager fallback directories は、それらのディレクトリがディスク上に存在する場合にのみ service PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. Config write + wizard metadata">
    Doctor は設定変更を永続化し、doctor の実行を記録するためにウィザード metadata をスタンプします。
  </Accordion>
  <Accordion title="19. Workspace tips (backup + memory system)">
    Doctor は、workspace memory system がない場合に提案し、ワークスペースがまだ git 管理下にない場合はバックアップのヒントを出力します。

    ワークスペース構造と git バックアップ（private GitHub または GitLab 推奨）の完全なガイドについては、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace) を参照してください。

  </Accordion>
</AccordionGroup>

## 関連

- [Gateway runbook](/ja-JP/gateway)
- [Gateway トラブルシューティング](/ja-JP/gateway/troubleshooting)

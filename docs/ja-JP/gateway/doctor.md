---
read_when:
    - doctor マイグレーションの追加または変更
    - 互換性を破る設定変更の導入
sidebarTitle: Doctor
summary: Doctor コマンド：健全性チェック、設定の移行、修復手順
title: 診断ツール
x-i18n:
    generated_at: "2026-07-12T14:28:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` は OpenClaw の修復および移行ツールです。古い設定や状態を修正し、健全性をチェックして、実行可能な修復手順を提示します。

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

    プロンプトを表示せずにデフォルトを受け入れます（該当する場合は、再起動、サービス、サンドボックスの修復手順を含みます）。

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    プロンプトを表示せずに推奨される修復を適用します（`--repair` はエイリアスです）。

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI または事前確認の自動化向けに、構造化された健全性チェックを実行します。読み取り専用であり、
    プロンプト、修復、移行、再起動、状態の書き込みは行いません。

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    強制的な修復も適用します（カスタムのスーパーバイザー設定を上書きします）。

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    プロンプトを表示せず、安全な移行（設定の正規化 +
    ディスク上の状態の移動）のみを適用して実行します。人による
    確認が必要な再起動、サービス、サンドボックスの操作はスキップします。レガシーな状態の移行は、検出されると引き続き自動的に実行されます。

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    追加の Gateway インストールについてシステムサービスをスキャンします（launchd/systemd/schtasks）。

  </Tab>
</Tabs>

書き込む前に変更内容を確認するには、まず設定ファイルを開きます。

```bash
cat ~/.openclaw/openclaw.json
```

## 読み取り専用の lint モード

`openclaw doctor --lint` は、自動化に適した
`openclaw doctor --fix` の姉妹機能です。両者は同じ Doctor ルールレジストリを共有しますが、
ルールの選択方法と処理方法は同じではありません。

| モード                   | プロンプト | 設定/状態への書き込み   | 出力                         | 用途                         |
| ------------------------ | ---------- | ----------------------- | ---------------------------- | ---------------------------- |
| `openclaw doctor`        | あり       | なし                    | わかりやすい健全性レポート   | 人が状態を確認する場合       |
| `openclaw doctor --fix`  | 場合による | あり、修復ポリシーに従う | わかりやすい修復ログ         | 承認済みの修復を適用する場合 |
| `openclaw doctor --lint` | なし       | なし                    | 構造化された検出結果         | CI、事前確認、レビューゲート |

デフォルトの `doctor --lint` は、広範かつ安全な自動化プロファイルを実行します。これは、
静的かつローカルで、CI または事前確認の出力に有用なチェックです。助言目的、環境依存、稼働中のサービスへの依存、
アカウント/ワークスペースのインベントリ、または過去データのクリーンアップに該当する、オプトインのチェックはスキップします。これらのオプトインチェックを含む、
登録済みの lint 監査をすべて実行する場合は `doctor --lint --all` を、特定のチェックを実行する場合は
`--only <id>` を使用します。

`doctor --fix` は lint のデフォルトプロファイルを使用せず、
`--all` も受け付けません。Doctor の順序付けされた修復パスを実行します。最新の健全性チェックでは任意の
`repair()` 実装を提供でき、古い領域では引き続きレガシーな
Doctor 修復フローが使用されます。一部の lint 検出結果は意図的に診断専用であるため、
`--lint --all` に表示されるチェックが、`--fix` によってその領域が変更されることを意味するわけではありません。
この契約では、`detect()`（検出結果を報告）と `repair()`（変更、差分、副作用を報告）を分離しています。
これにより、lint チェックを変更計画ツールに変えることなく、将来の
`doctor --fix --dry-run` に向けた道筋を確保しています。

一部の組み込みチェックは内部でデフォルト無効になっており、デフォルトの
`doctor --lint` 自動化プロファイルに含めずに、`--all`、`--only`、および Doctor 修復フローから利用できるようになっています。
検出結果の重大度は、引き続き検出結果ごとに
`info`、`warning`、または `error` として出力されます。デフォルトの選択は重大度レベルではありません。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 出力のフィールド：

- `ok`：選択した重大度のしきい値を満たす検出結果が存在したかどうか
- `checksRun` / `checksSkipped`：件数（プロファイル、`--only`、または `--skip` によりスキップ）
- `findings`：`checkId`、`severity`、`message`、および任意の `path`、`line`、`column`、`ocPath`、`source`、`target`、`requirement`、`fixHint` を含む構造化された診断情報

終了コード：

| コード | 意味                                                       |
| ------ | ---------------------------------------------------------- |
| `0`    | 選択したしきい値以上の検出結果なし                         |
| `1`    | 1 件以上の検出結果が選択したしきい値を満たした             |
| `2`    | 検出結果を出力できる前にコマンド/ランタイムで障害が発生した |

フラグ：

- `--severity-min info|warning|error`（デフォルトは `warning`）：表示される内容と、ゼロ以外の終了コードになる条件の両方を制御します。
- `--all`：デフォルトの自動化セットから除外されているオプトインチェックを含め、登録済みのすべての lint チェックを実行します。
- `--only <id>`（繰り返し指定可能）：指定されたチェック ID のみを実行します。不明な ID はエラーの検出結果として報告されます。
- `--skip <id>`（繰り返し指定可能）：残りの実行を有効に保ったまま、チェックを除外します。
- `--json`、`--severity-min`、`--all`、`--only`、`--skip` には `--lint` が必要です。通常の `openclaw doctor` および `--fix` の実行では拒否されます。

## 実行内容（概要）

<AccordionGroup>
  <Accordion title="健全性、UI、アップデート">
    - git インストール向けの任意の事前アップデート（対話モードのみ）。
    - UI プロトコルの鮮度チェック（プロトコルスキーマの方が新しい場合、Control UI を再ビルド）。
    - 健全性チェック + 再起動プロンプト。
    - Skills の状態概要（利用可能/不足/ブロック）と Plugin の状態。

  </Accordion>
  <Accordion title="設定と移行">
    - レガシーな値形式に対する設定の正規化。
    - レガシーなフラット形式の `talk.*` フィールドから `talk.provider` + `talk.providers.<provider>` への Talk 設定の移行。
    - レガシーな Chrome 拡張機能設定と Chrome MCP の準備状況に関するブラウザー移行チェック。
    - OpenCode プロバイダー上書きの警告（`models.providers.opencode` / `opencode-zen` / `opencode-go`）。
    - レガシーな OpenAI Codex プロバイダー/プロファイルの移行（`openai-codex` → `openai`）と、古い `models.providers.openai-codex` によるシャドーイングの警告。
    - OpenAI Codex OAuth プロファイルに対する OAuth TLS 前提条件のチェック。
    - `plugins.allow` が制限的である一方、ツールポリシーがワイルドカードまたは Plugin 所有ツールを要求している場合の、Plugin/ツール許可リストに関する警告。
    - レガシーなディスク上の状態の移行（セッション/エージェントディレクトリ/WhatsApp 認証）。
    - レガシーな Plugin マニフェスト契約キーの移行（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` → `contracts`）。
    - レガシーな Cron ストアの移行（`jobId`、`schedule.cron`、トップレベルの配信/ペイロードフィールド、ペイロードの `provider`、`notify: true` Webhook フォールバックジョブ）。
    - `agents.defaults`、`agents.list[]`、および `models.providers.*`（モデルごとのエントリを含む）全体にわたる Codex CLI ランタイム固定値の修復（`agentRuntime.id: "codex-cli"` → `"codex"`）。
    - Plugin が有効な場合の古い Plugin 設定のクリーンアップ。`plugins.enabled=false` の場合、古い Plugin 参照は不活性な隔離設定として保持されます。

  </Accordion>
  <Accordion title="状態と整合性">
    - セッションロックファイルの検査と古いロックのクリーンアップ。
    - 影響を受ける 2026.4.24 ビルドによって作成された、重複するプロンプト書き換え分岐に対するセッショントランスクリプトの修復。
    - 停止したサブエージェントの再起動復旧トゥームストーンの検出。`--fix` では、古い中断済み復旧フラグを消去し、起動時に子を再起動中断済みとして扱い続けないようにできます。
    - 状態の整合性と権限のチェック（セッション、トランスクリプト、状態ディレクトリ）。
    - ローカル実行時の設定ファイル権限チェック（chmod 600）。
    - モデル認証の健全性：OAuth の有効期限をチェックし、期限が近いトークンを更新でき、認証プロファイルのクールダウン/無効状態を報告します。

  </Accordion>
  <Accordion title="Gateway、サービス、スーパーバイザー">
    - サンドボックスが有効な場合のサンドボックスイメージ修復。
    - レガシーなサービスの移行と追加 Gateway の検出。
    - Matrix チャネルのレガシー状態の移行（`--fix` / `--repair` モード）。
    - Gateway ランタイムのチェック（サービスがインストール済みだが未実行、キャッシュされた launchd ラベル）。
    - チャネル状態の警告（稼働中の Gateway からプローブ）。
    - チャネル固有の権限チェックは `openclaw channels capabilities` にあります。たとえば、Discord ボイスチャネルの権限は `openclaw channels capabilities --channel discord --target channel:<channel-id>` で監査されます。
    - ローカル TUI クライアントがまだ実行中で、Gateway のイベントループの健全性が低下している場合の WhatsApp 応答性チェック。`--fix` は、確認済みのローカル TUI クライアントのみを停止します。
    - プライマリモデル、フォールバック、画像/動画生成モデル、Heartbeat/サブエージェント/Compaction の上書き、フック、チャネルモデルの上書き、およびセッションルートの固定値に含まれるレガシーな `openai-codex/*` モデル参照に対する Codex ルート修復。`--fix` はそれらを `openai/*` に書き換え、`openai-codex:*` の認証プロファイル/順序を `openai:*` に移行し、古いセッション/エージェント全体のランタイム固定値を削除し、修復後の有効なルートによって Codex の互換性を判定します。
    - スーパーバイザー設定の監査（launchd/systemd/schtasks）と任意の修復。
    - インストールまたはアップデート時にシェルの `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 値を取り込んだ Gateway サービスに対する、埋め込みプロキシ環境のクリーンアップ。
    - Gateway ランタイムのベストプラクティスチェック（Node と Bun、バージョンマネージャーのパス）。
    - Gateway ポート競合の診断（デフォルトは `18789`）。

  </Accordion>
  <Accordion title="認証、セキュリティ、ペアリング">
    - オープンな DM ポリシーに関するセキュリティ警告。
    - ローカルトークンモードの Gateway 認証チェック（トークンソースが存在しない場合はトークン生成を提案し、トークンの SecretRef 設定は上書きしません）。
    - デバイスペアリング問題の検出（保留中の初回ペアリング要求、保留中のロール/スコープのアップグレード、古いローカルデバイストークンキャッシュの不整合、ペアリング済みレコードの認証不整合）。

  </Accordion>
  <Accordion title="ワークスペースとシェル">
    - Linux での systemd linger チェック。
    - ワークスペースのブートストラップファイルサイズのチェック（コンテキストファイルの切り捨て/上限接近に関する警告）。
    - デフォルトエージェントに対する Skills の準備状況チェック。バイナリ、環境変数、設定、または OS 要件が不足している許可済み Skills を報告し、`--fix` では `skills.entries` 内の利用不可の Skills を無効化できます。
    - シェル補完の状態チェックと自動インストール/アップグレード。
    - メモリ検索埋め込みプロバイダーの準備状況チェック（ローカルモデル、リモート API キー、または QMD バイナリ）。
    - ソースインストールのチェック（pnpm ワークスペースの不一致、UI アセットの不足、tsx バイナリの不足）。
    - 更新された設定 + ウィザードのメタデータを書き込みます。

  </Accordion>
</AccordionGroup>

## Dreams UI のバックフィルとリセット

Control UI の Dreams シーンには、グラウンデッド Dreaming ワークフロー向けの **バックフィル**、**リセット**、**グラウンデッドを消去** アクションがあります。これらは Gateway の Doctor 形式の RPC メソッドを使用しますが、`openclaw doctor` CLI の修復/移行には**含まれません**。

| アクション             | 実行内容                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| バックフィル           | アクティブなワークスペース内の過去の `memory/YYYY-MM-DD.md` ファイルをスキャンし、グラウンデッド REM 日記パスを実行して、元に戻せるバックフィルエントリを `DREAMS.md` に書き込みます。 |
| リセット               | マークされたバックフィル日記エントリのみを `DREAMS.md` から削除します。                                                                                                          |
| グラウンデッドを消去   | ライブでの想起または日次サポートがまだ蓄積されていない、過去のリプレイからステージングされたグラウンデッド専用の短期エントリのみを削除します。                                     |

  これらはいずれも、それ自体では `MEMORY.md` を編集したり、完全な doctor マイグレーションを実行したり、根拠のある候補を稼働中の短期昇格ストアへステージングしたりしません。根拠のある履歴リプレイを通常の深層昇格レーンに送るには、代わりに次の CLI フローを使用します。

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  これにより、`DREAMS.md` をレビュー画面として維持したまま、根拠のある永続候補が短期 Dreaming ストアにステージングされます。

  ## 詳細な動作と根拠

  <AccordionGroup>
  <Accordion title="0. 任意の更新（git インストール）">
    これが git チェックアウトで、doctor が対話モードで実行されている場合、doctor の実行前に更新（fetch/rebase/build）するかどうかを確認します。
  </Accordion>
  <Accordion title="1. 設定の正規化">
    Doctor は、レガシーな値の形式を現在のスキーマに正規化します。現在の Talk 音声設定は `talk.provider` + `talk.providers.<provider>` で、リアルタイム音声設定は `talk.realtime.*` 配下にあります。Doctor は古い `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 形式をプロバイダーマップに書き換え、レガシーなトップレベルのリアルタイムセレクター（`talk.mode`、`talk.transport`、`talk.brain`、`talk.model`、`talk.voice`）を `talk.realtime` に書き換えます。

    また、`plugins.allow` が空でなく、ツールポリシーでワイルドカードまたは Plugin 所有のツールエントリを使用している場合、Doctor は警告します。`tools.allow: ["*"]` が一致するのは、実際に読み込まれた Plugin のツールだけです。排他的な Plugin 許可リストを回避するものではありません。

  </Accordion>
  <Accordion title="2. レガシー設定キーのマイグレーション">
    設定に有効なマイグレーションが存在する非推奨キーが含まれている場合、他のコマンドは実行を拒否し、`openclaw doctor` の実行を求めます。Doctor は、検出されたレガシーキーと適用したマイグレーションを説明し、更新されたスキーマで `~/.openclaw/openclaw.json` を書き換えます。Gateway の起動時にはレガシーな設定形式が拒否され、`openclaw doctor --fix` の実行を求められます。起動時に `openclaw.json` が書き換えられることはありません。Cron ジョブストアのマイグレーションも `openclaw doctor --fix` によって処理されます。

    <Note>
      Doctor が自動マイグレーションを提供するのは、キーが廃止されてから
      およそ 2 か月間のみです。それより古いレガシーキー（たとえば、
      複数エージェント対応前の設定形式にあった元の
      `routing.queue`、`routing.bindings`、`routing.agents`/`defaultAgentId`、
      `routing.transcribeAudio`、トップレベルの `agent.*`、トップレベルの `identity`）
      には、マイグレーション経路が存在しません。現在は書き換えられる代わりに、
      それらを使用する設定が検証に失敗します。Doctor が処理を続行できるように、
      現在の設定リファレンスに従ってそれらのキーを手動で修正してください。
    </Note>

    有効なマイグレーション：

    | レガシーキー                                                                                    | 現在のキー                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 削除済み（WebChat は廃止済み）                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`（アカウントごとの設定を含む）      | `...threadBindings.idleHours`                                               |
    | レガシーな `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
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
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`（Gateway の起動時には、`api` が将来の値または未知の列挙値であるプロバイダーも、フェイルクローズにする代わりにスキップされます） |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 削除済み（レガシーな Chrome 拡張機能のリレー設定）                             |
    | `mcp.servers.*.type`（CLI ネイティブのエイリアス）                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 削除済み（Codex app-server は常に Codex ネイティブのワークスペースツールをネイティブのまま維持） |
    | `commands.modelsWrite`                                                                           | 削除済み（`/models add` は非推奨）                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 削除済み（完全一致する `NO_REPLY` は、表示可能なフォールバックテキストに書き換えられなくなりました）  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 削除済み（生成されるシステムプロンプトは OpenClaw が管理）                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 削除済み（低速なモデル／プロバイダーのタイムアウトには `models.providers.<id>.timeoutSeconds` を使用し、エージェント／実行のタイムアウト上限未満に保ちます） |
    | トップレベルの `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`（任意の階層）                                                            | 削除済み（メモリインデックスは各エージェントデータベースに格納）                       |
    | トップレベルの `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` ポリシー ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 削除済み（非推奨）                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      上記の `plugins.entries.voice-call.config.*` 行は、`openclaw
      doctor` ではなく、設定が読み込まれるたびに Voice Call Plugin 自体によって
      正規化されます。この Plugin は起動時に `openclaw
      doctor --fix` を案内する警告もログに記録しますが、現在 Doctor は
      これらのキーについて `openclaw.json` を書き換えません。実行時に
      変更を適用するのは、Plugin 自体の正規化です。
    </Note>

    複数アカウントチャンネルにおけるデフォルトアカウントのガイダンス：

    - `channels.<channel>.defaultAccount` または `accounts.default` を指定せずに、2 つ以上の `channels.<channel>.accounts` エントリが設定されている場合、フォールバックルーティングによって予期しないアカウントが選択される可能性があることを Doctor が警告します。
    - `channels.<channel>.defaultAccount` に未知のアカウント ID が設定されている場合、Doctor は警告し、設定済みのアカウント ID を一覧表示します。

  </Accordion>
  <Accordion title="2b. OpenCode プロバイダーのオーバーライド">
    `models.providers.opencode`、`opencode-zen`、または `opencode-go` を手動で追加している場合、`openclaw/plugin-sdk/llm` の組み込み OpenCode カタログがオーバーライドされます。その結果、モデルが誤った API に割り当てられたり、コストがゼロに設定されたりする可能性があります。Doctor は警告を表示するため、オーバーライドを削除してモデルごとの API ルーティングとコストを復元できます。
  </Accordion>
  <Accordion title="2c. ブラウザーの移行と Chrome MCP の準備状況">
    ブラウザー設定が削除済みの Chrome 拡張機能パスを引き続き参照している場合、Doctor は現在のホストローカル Chrome MCP アタッチモデルに正規化します（`browser.profiles.*.driver: "extension"` → `"existing-session"`、`browser.relayBindHost` は削除）。

    `defaultProfile: "user"` または設定済みの `existing-session` プロファイルを使用している場合、Doctor はホストローカル Chrome MCP パスも監査します。

    - デフォルトの自動接続プロファイルについて、同じホストに Google Chrome がインストールされているか確認します
    - 検出された Chrome のバージョンを確認し、Chrome 144 未満の場合は警告します
    - ブラウザーの検査ページ（例: `chrome://inspect/#remote-debugging`、`brave://inspect/#remote-debugging`、または `edge://inspect/#remote-debugging`）でリモートデバッグを有効にするよう通知します

    Doctor が Chrome 側の設定を代わりに有効にすることはできません。ホストローカル Chrome MCP には引き続き、Gateway/Node ホスト上でローカルに実行され、リモートデバッグが有効で、ブラウザーで最初のアタッチ同意プロンプトが承認済みの Chromium ベースブラウザー 144+ が必要です。

    ここでの準備状況は、ローカルアタッチの前提条件のみを対象とします。Existing-session では現在の Chrome MCP ルート制限が維持されます。`responsebody`、PDF エクスポート、ダウンロードのインターセプト、バッチアクションなどの高度なルートには、引き続き管理対象ブラウザーまたは raw CDP プロファイルが必要です。このチェックは Docker、サンドボックス、リモートブラウザー、その他のヘッドレスフローには適用されず、これらでは引き続き raw CDP を使用します。

  </Accordion>
  <Accordion title="2d. OAuth TLS の前提条件">
    OpenAI Codex OAuth プロファイルが設定されている場合、Doctor は OpenAI 認可エンドポイントをプローブし、ローカルの Node/OpenSSL TLS スタックが証明書チェーンを検証できることを確認します。プローブが証明書エラー（例: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`、期限切れの証明書、自己署名証明書）で失敗した場合、Doctor はプラットフォーム固有の修正手順を表示します。Homebrew の Node を使用する macOS では、通常の修正方法は `brew postinstall ca-certificates` です。`--deep` を指定すると、Gateway が正常でもプローブが実行されます。
  </Accordion>
  <Accordion title="2e. Codex OAuth プロバイダーのオーバーライド">
    以前に `models.providers.openai-codex` の下へレガシー OpenAI トランスポート設定を追加していた場合、組み込みの Codex OAuth プロバイダーパスが隠される可能性があります。Codex OAuth とともにこれらの古いトランスポート設定が検出されると、Doctor は警告を表示します。古いトランスポートのオーバーライドを削除または書き換えることで、現在のルーティング動作を復元できます。カスタムプロキシとヘッダーのみのオーバーライドは引き続きサポートされ、この警告は発生しませんが、これらの明示的に作成されたリクエストルートは暗黙的な Codex 選択の対象にはなりません。
  </Accordion>
  <Accordion title="2f. Codex ルートの修復">
    Doctor はレガシーの `openai-codex/*` モデル参照を確認します。ネイティブ Codex ハーネスのルーティングでは正規の `openai/*` モデル参照を使用しますが、プレフィックスだけで Codex が選択されることはありません。ランタイムポリシーが未設定または `auto` の場合、明示的なリクエストオーバーライドがない、公式の HTTPS Platform Responses または ChatGPT Responses の完全一致ルートのみが対象になります。[OpenAI の暗黙的エージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)を参照してください。

    `--fix` / `--repair` モードでは、Doctor は影響を受けるデフォルトエージェントとエージェントごとの参照を書き換えます。これには、プライマリモデル、フォールバック、画像/動画生成モデル、Heartbeat/サブエージェント/Compaction のオーバーライド、フック、チャネルモデルのオーバーライド、および永続化された古いセッションルート状態が含まれます。

    - `openai-codex/gpt-*` は `openai/gpt-*` になります。
    - Codex の意図は、修復されたエージェントモデル参照に対応する、プロバイダー/モデルスコープの `agentRuntime.id: "codex"` エントリへ移動します。
    - ランタイム選択はプロバイダー/モデルスコープであるため、古いエージェント全体のランタイム設定と永続化されたセッションランタイムの固定値は削除されます。
    - 修復されたレガシーモデル参照で古い認証パスを維持するために Codex ルーティングが必要な場合を除き、既存のプロバイダー/モデルランタイムポリシーは保持されます。
    - 既存のモデルフォールバックリストは、レガシーエントリを書き換えたうえで保持されます。コピーされたモデルごとの設定は、レガシーキーから正規の `openai/*` キーへ移動します。
    - 永続化されたセッションの `modelProvider`/`providerOverride`、`model`/`modelOverride`、フォールバック通知、認証プロファイルの固定値は、検出されたすべてのエージェントセッションストアで修復されます。
    - Doctor は、古い `agentRuntime.id: "codex-cli"` の固定値（別個のレガシーランタイム ID）も、`agents.defaults`、`agents.list[]`、および `models.providers.*` のモデルエントリ全体で `"codex"` に修復します。
    - `/codex ...` は「チャットからネイティブ Codex 会話を制御またはバインドする」ことを意味します。
    - `/acp ...` または `runtime: "acp"` は「外部 ACP/acpx アダプターを使用する」ことを意味します。

  </Accordion>
  <Accordion title="2g. セッションルートのクリーンアップ">
    Doctor は、設定済みモデルまたはランタイムを Codex などの Plugin 所有ルートから移動した後に残る、古い自動作成ルート状態がないか、検出されたエージェントセッションストアもスキャンします。

    `openclaw doctor --fix` は、所有元のルートが設定されなくなった場合、`modelOverrideSource: "auto"` のモデル固定値、ランタイムモデルメタデータ、固定されたハーネス ID、CLI セッションバインディング、自動認証プロファイルのオーバーライドなど、自動作成された古い状態を消去できます。ユーザーが明示的に選択したセッションモデル、またはレガシーのセッションモデル選択は手動確認用として報告され、変更されません。そのルートを使用する意図がなくなった場合は、`/model ...`、`/new`、またはセッションのリセットで切り替えてください。

  </Accordion>
  <Accordion title="3. レガシー状態の移行（ディスクレイアウト）">
    Doctor は、古いディスク上のレイアウトを現在の構造へ移行できます。

    - セッションストアとトランスクリプト: `~/.openclaw/sessions/` から `~/.openclaw/agents/<agentId>/sessions/` へ
    - エージェントディレクトリ: `~/.openclaw/agent/` から `~/.openclaw/agents/<agentId>/agent/` へ
    - WhatsApp 認証状態（Baileys）: レガシーの `~/.openclaw/credentials/*.json`（`oauth.json` を除く）から `~/.openclaw/credentials/whatsapp/<accountId>/...` へ（デフォルトのアカウント ID: `default`）

    これらの移行はベストエフォートかつ冪等です。Doctor は、バックアップとしてレガシーフォルダーを残した場合に警告を出します。Gateway/CLI も起動時にレガシーのセッションとエージェントディレクトリを自動移行するため、Doctor を手動実行しなくても、履歴/認証/モデルがエージェントごとのパスへ移動します。WhatsApp 認証は、意図的に `openclaw doctor` でのみ移行されます。Talk プロバイダー/プロバイダーマップの正規化では構造的等価性によって比較するため、キー順序だけの差異で、変更のない `doctor --fix` が繰り返し発生することはなくなりました。

  </Accordion>
  <Accordion title="3a. レガシー Plugin マニフェストの移行">
    Doctor は、インストール済みのすべての Plugin マニフェストをスキャンし、非推奨のトップレベル機能キー（`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`）を探します。見つかった場合は、それらを `contracts` オブジェクトへ移動し、マニフェストファイルをその場で書き換えるよう提案します。この移行は冪等です。`contracts` に同じ値がすでに存在する場合、データを重複させずにレガシーキーを削除します。
  </Accordion>
  <Accordion title="3b. レガシー Cron ストアの移行">
    Doctor は、Cron ジョブストア（デフォルトでは `~/.openclaw/cron/jobs.json`、オーバーライドされている場合は `cron.store`）についても、互換性のためにスケジューラーが引き続き受け付ける古いジョブ形式がないか確認します。

    現在の Cron クリーンアップには以下が含まれます。

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - トップレベルのペイロードフィールド（`message`、`model`、`thinking`、...）→ `payload`
    - トップレベルの配信フィールド（`deliver`、`channel`、`to`、`provider`、...）→ `delivery`
    - ペイロードの `provider` 配信エイリアス → 明示的な `delivery.channel`
    - レガシーの `notify: true` Webhook フォールバックジョブ → `cron.webhook` が設定されている場合は明示的な Webhook 配信。アナウンスジョブはチャット配信を維持し、`delivery.completionDestination` が追加されます。`cron.webhook` が未設定の場合、ターゲットのないジョブでは機能しないトップレベルの `notify` マーカーが削除されます（アナウンスを含む既存の配信は保持されます）。これは、ランタイム配信がこのマーカーを参照しないためです。

    Gateway はロード時に不正な Cron 行もサニタイズするため、有効なジョブは実行を継続します。未加工の不正な行は、`jobs.json` から削除される前に、アクティブなストアの隣にある `jobs-quarantine.json` へコピーされます。Doctor は隔離された行を報告するため、手動で確認または修復できます。

    Gateway の起動時にはランタイムプロジェクションが正規化され、トップレベルの `notify` マーカーは無視されますが、永続化された Cron 設定は Doctor による修復のために残されます。`cron.webhook` が未設定の場合、Doctor は移行先がないジョブ（`delivery.mode` が none/未指定、使用できない Webhook ターゲット、または既存のアナウンス/チャット配信）から機能しないマーカーを削除し、既存の配信は変更しません。これにより、`doctor --fix` を繰り返し実行しても、同じジョブについて再び警告されることはありません。`cron.webhook` が設定されていても有効な HTTP(S) URL でない場合、Doctor は引き続き警告し、URL を修正できるようマーカーを残します。

    Linux では、ユーザーの crontab がレガシーの `~/.openclaw/bin/ensure-whatsapp.sh` を引き続き呼び出している場合にも、Doctor が警告します。このホストローカルスクリプトは現在の OpenClaw では保守されておらず、Cron が systemd ユーザーバスへ接続できない場合に、誤った `Gateway inactive` メッセージを `~/.openclaw/logs/whatsapp-health.log` へ書き込む可能性があります。`crontab -e` で古い crontab エントリを削除してください。現在のヘルスチェックには、`openclaw channels status --probe`、`openclaw doctor`、および `openclaw gateway status` を使用してください。

  </Accordion>
  <Accordion title="3c. セッションロックのクリーンアップ">
    Doctor は、セッションが異常終了した際に残された古い書き込みロックファイルを探すため、すべてのエージェントセッションディレクトリをスキャンします。検出された各ロックファイルについて、パス、PID、PID がまだ稼働中かどうか、ロックの経過時間、古いと見なされるかどうか（PID が停止している、所有者メタデータが不正、30 分より古い、または稼働中の PID が OpenClaw 以外のプロセスに属することが確認された場合）を報告します。`--fix` / `--repair` モードでは、停止、孤立、再利用、不正かつ古い、または OpenClaw 以外の所有者を持つロックを自動的に削除します。稼働中の OpenClaw プロセスが引き続き所有している古いロックは報告されますが、Doctor がアクティブなトランスクリプト書き込みを中断しないよう、そのまま残されます。
  </Accordion>
  <Accordion title="3d. セッショントランスクリプトのブランチ修復">
    Doctor は、2026.4.24 のプロンプトトランスクリプト書き換えバグによって作成された重複ブランチ形式がないか、エージェントセッションの JSONL ファイルをスキャンします。この形式では、OpenClaw 内部ランタイムコンテキストを含む破棄されたユーザーターンと、同じ可視ユーザープロンプトを含むアクティブな兄弟ブランチが存在します。`--fix` / `--repair` モードでは、Doctor は影響を受ける各ファイルを元ファイルの隣にバックアップし、トランスクリプトをアクティブなブランチへ書き換えます。これにより、Gateway の履歴およびメモリリーダーに重複ターンが表示されなくなります。
  </Accordion>
  <Accordion title="4. 状態の整合性チェック（セッションの永続化、ルーティング、安全性）">
    状態ディレクトリは運用上の脳幹です。これが消失すると、別の場所にバックアップがない限り、セッション、認証情報、ログ、設定が失われます。

    Doctor は以下を確認します。

    - **状態ディレクトリがない**：致命的な状態データの消失について警告し、ディレクトリを再作成するよう求め、失われたデータは復元できないことを通知します。
    - **状態ディレクトリの権限**：書き込み可能かを検証し、権限の修復を提案します（所有者またはグループの不一致を検出した場合は、`chown` のヒントも表示します）。
    - **macOS のクラウド同期された状態ディレクトリ**：状態の保存先が iCloud Drive（`~/Library/Mobile Documents/com~apple~CloudDocs/...`）または `~/Library/CloudStorage/...` 配下に解決されると警告します。同期対象のパスでは I/O が遅くなり、ロックと同期の競合が発生する可能性があるためです。
    - **Linux の SD または eMMC 上の状態ディレクトリ**：状態の保存先が `mmcblk*` マウントソースに解決されると警告します。SD/eMMC 上のランダム I/O は低速になることがあり、セッションや認証情報の書き込みによって劣化が早まる可能性があるためです。
    - **Linux の揮発性状態ディレクトリ**：状態の保存先が `tmpfs` または `ramfs` に解決されると警告します。セッション、認証情報、設定、および SQLite の状態（WAL/ジャーナルのサイドカーファイルを含む）が再起動時に消失するためです。Docker の `overlay` マウントは、コンテナが維持されている限り書き込み可能レイヤーがホストの再起動後も永続化されるため、意図的に警告対象外です。
    - **セッションディレクトリがない**：履歴を永続化し、`ENOENT` クラッシュを回避するには、`sessions/` とセッションストアディレクトリが必要です。
    - **トランスクリプトの不一致**：最近のセッションエントリに対応するトランスクリプトファイルがない場合に警告します。
    - **メインセッションの「1 行 JSONL」**：メインのトランスクリプトが 1 行しかない場合に警告します（履歴が蓄積されていません）。
    - **複数の状態ディレクトリ**：複数のホームディレクトリに `~/.openclaw` フォルダーが存在する場合、または `OPENCLAW_STATE_DIR` が別の場所を指している場合に警告します（インストール間で履歴が分散する可能性があります）。
    - **リモートモードの注意喚起**：`gateway.mode=remote` の場合、doctor はリモートホスト上で実行するよう通知します（状態データはそこにあります）。
    - **設定ファイルの権限**：`~/.openclaw/openclaw.json` がグループまたは全ユーザーから読み取り可能な場合に警告し、`600` に制限することを提案します。

  </Accordion>
  <Accordion title="5. モデル認証の健全性（OAuth の有効期限）">
    Doctor は認証ストア内の OAuth プロファイルを検査し、トークンが間もなく期限切れになる場合や、すでに期限切れの場合に警告し、安全に実行できる場合は更新できます。Anthropic の OAuth/トークンプロファイルが古くなっている場合は、Anthropic API キーまたは Anthropic のセットアップトークン経路を提案します。更新を求めるプロンプトは対話的に実行している場合（TTY）にのみ表示され、`--non-interactive` では更新処理を試行しません。

    OAuth の更新が恒久的に失敗した場合（たとえば `refresh_token_reused`、`invalid_grant`、またはプロバイダーから再サインインを求められた場合）、doctor は再認証が必要であることを報告し、実行すべき正確な `openclaw models auth login --provider ...` コマンドを表示します。

    Doctor は、短時間のクールダウン（レート制限、タイムアウト、認証失敗）や、より長期間の無効化（請求またはクレジットの失敗）によって一時的に使用できない認証プロファイルも報告します。

    トークンが macOS Keychain に保存されている従来の Codex OAuth プロファイル（ファイルベースのサイドカーレイアウト導入前の古いオンボーディング）は、doctor でのみ修復されます。対話型ターミナルから `openclaw doctor --fix` を一度実行し、Keychain に保存された従来のトークンを `auth-profiles.json` 内へ直接移行してください。その後、組み込みターン（Telegram、cron、サブエージェントのディスパッチ）では、それらが正規の OpenAI OAuth プロファイルとして解決されます。

  </Accordion>
  <Accordion title="6. Hooks モデルの検証">
    `hooks.gmail.model` が設定されている場合、doctor はカタログと許可リストに照らしてモデル参照を検証し、解決できない場合や許可されていない場合に警告します。
  </Accordion>
  <Accordion title="7. サンドボックスイメージの修復">
    サンドボックスが有効な場合、doctor は Docker イメージを確認し、現在のイメージがない場合は、ビルドするか従来の名前へ切り替えることを提案します。
  </Accordion>
  <Accordion title="7b. Plugin インストールのクリーンアップ">
    Doctor は `openclaw doctor --fix` / `openclaw doctor --repair` モードで、OpenClaw が生成した従来の Plugin 依存関係のステージング状態を削除します。対象には、古くなった生成済み依存関係ルート、古いインストールステージディレクトリ、以前のバンドル済み Plugin 依存関係修復コードが残したパッケージローカルの不要物、および現在のバンドル済みマニフェストを覆い隠す可能性がある、孤立または復元されたバンドル済み `@openclaw/*` Plugin の管理対象 npm コピーが含まれます。Doctor はさらに、`peerDependencies.openclaw` を宣言する管理対象 npm Plugin にホストの `openclaw` パッケージを再リンクします。これにより、更新または npm の修復後も、`openclaw/plugin-sdk/*` のようなパッケージローカルのランタイムインポートが引き続き解決されます。

    Doctor は、設定から参照されているものの、ローカルの Plugin レジストリで見つからない、ダウンロード可能な Plugin を再インストールすることもできます（実体のある `plugins.entries`、設定済みのチャンネル/プロバイダー/検索設定、設定済みのエージェントランタイム）。パッケージ更新中、doctor はコアパッケージの入れ替え中に Plugin パッケージを再インストールしません。設定済みの Plugin を引き続き復旧する必要がある場合は、更新後に `openclaw doctor --fix` を再実行してください。以下のコンテナイメージ起動時の例外を除き、Gateway の起動および設定の再読み込みではパッケージ修復を実行しません。Plugin のインストールは、明示的な doctor/install/update 操作のままです。

    コンテナ化された Gateway の起動には、限定的なアップグレード例外があります。`openclaw gateway run` が新しい OpenClaw バージョンで起動すると、準備完了になる前に安全な状態移行と既存のコア更新後 Plugin 収束処理を実行し、その後バージョンごとのチェックポイントを記録します。この起動時処理では、古くなったバンドル済み Plugin レコードのクリーンアップ、ローカル Plugin リンクの修復、収束処理で必要な場合の設定済み Plugin パッケージの再インストール、および有効な Plugin ペイロードの確認を実行できます。起動時に安全な修復ができない場合は、コンテナを通常どおり再起動する前に、同じマウント済みの状態データと設定に対して、同じイメージを `openclaw doctor --fix` で一度実行してください。

  </Accordion>
  <Accordion title="8. Gateway サービスの移行とクリーンアップのヒント">
    Doctor は従来の Gateway サービス（launchd/systemd/schtasks）を検出し、それらを削除して、現在の Gateway ポートを使用する OpenClaw サービスをインストールすることを提案します。また、追加の Gateway に類似したサービスをスキャンし、クリーンアップのヒントを表示できます。プロファイル名付きの OpenClaw Gateway サービスは正式なサービスとして扱われ、「追加」として警告されません。

    Linux では、ユーザーレベルの Gateway サービスが存在せず、システムレベルの OpenClaw Gateway サービスが存在する場合、doctor は2つ目のユーザーレベルサービスを自動的にインストールしません。`openclaw gateway status --deep` または `openclaw doctor --deep` で確認した後、重複を削除するか、システムスーパーバイザーが Gateway のライフサイクルを管理している場合は `OPENCLAW_SERVICE_REPAIR_POLICY=external` を設定してください。

  </Accordion>
  <Accordion title="8b. 起動時の Matrix 移行">
    Matrix チャンネルアカウントに保留中または実行可能な従来状態の移行がある場合、doctor は（`--fix` / `--repair` モードで）移行前のスナップショットを作成し、ベストエフォートの移行手順を実行します。手順は、従来の Matrix 状態の移行と、従来の暗号化状態の準備です。どちらの手順も致命的ではなく、エラーはログに記録され、起動は続行されます。読み取り専用モード（`--fix` を付けない `openclaw doctor`）では、この確認は完全にスキップされます。
  </Accordion>
  <Accordion title="8c. デバイスのペアリングと認証のドリフト">
    Doctor は通常の健全性確認の一環としてデバイスのペアリング状態を検査し、以下を報告します。

    - 保留中の初回ペアリング要求
    - ペアリング済みデバイスに対する保留中のロールまたはスコープのアップグレード
    - デバイス ID は一致しているものの、デバイス ID 情報が承認済みレコードと一致しなくなった場合の公開鍵不一致の修復
    - 承認済みロールに対する有効なトークンがないペアリング済みレコード
    - スコープが承認済みペアリング基準から逸脱しているペアリング済みトークン
    - Gateway 側のトークンローテーションより古い、または古いスコープメタデータを保持している、現在のマシン用のローカルキャッシュ済みデバイストークンエントリ

    Doctor はペアリング要求を自動承認せず、デバイストークンも自動ローテーションしません。正確な次の手順を表示します。

    - `openclaw devices list` で保留中の要求を確認する
    - `openclaw devices approve <requestId>` で対象の要求を承認する
    - `openclaw devices rotate --device <deviceId> --role <role>` で新しいトークンをローテーションする
    - `openclaw devices remove <deviceId>` で古いレコードを削除し、再承認する

    これにより、初回ペアリング、保留中のロール/スコープのアップグレード、および古いトークンやデバイス ID 情報のドリフトが区別され、「すでにペアリング済みなのに、依然としてペアリングが必要と表示される」という一般的な抜け穴が解消されます。

  </Accordion>
  <Accordion title="9. セキュリティ警告">
    プロバイダーが許可リストなしで DM を受け付けている場合や、ポリシーが危険な方法で設定されている場合、doctor は警告を表示します。
  </Accordion>
  <Accordion title="10. systemd linger（Linux）">
    systemd ユーザーサービスとして実行している場合、doctor はログアウト後も Gateway が稼働し続けるよう linger が有効になっていることを確認します。
  </Accordion>
  <Accordion title="11. ワークスペースの状態（Skills、Plugin、TaskFlow）">
    Doctor はデフォルトエージェントのワークスペース状態の概要を表示します。

    - **Skills の状態**：利用可能、要件不足、許可リストによってブロックされた Skills の数を集計します。
    - **Plugin の状態**：有効、無効、エラー状態の Plugin の数を集計し、エラーがある場合はその Plugin ID を一覧表示し、バンドル Plugin の機能を報告します。
    - **Plugin の互換性警告**：現在のランタイムとの互換性に問題がある Plugin を警告します。
    - **Plugin の診断**：Plugin レジストリが読み込み時に出力した警告やエラーを表示します。
    - **TaskFlow の復旧**：手動での確認またはキャンセルが必要な、不審な管理対象 TaskFlow を表示します。

  </Accordion>
  <Accordion title="11b. ブートストラップファイルのサイズ">
    Doctor は、ワークスペースのブートストラップファイル（たとえば `AGENTS.md`、`CLAUDE.md`、またはその他の注入されるコンテキストファイル）が、設定された文字数上限に近いか超えているかを確認します。ファイルごとの元の文字数と注入後の文字数、切り詰め率、切り詰めの原因（`max/file` または `max/total`）、および合計上限に対する注入文字数の合計割合を報告します。ファイルが切り詰められている場合や上限に近い場合、doctor は `agents.defaults.bootstrapMaxChars` と `agents.defaults.bootstrapTotalMaxChars` を調整するためのヒントを表示します。
  </Accordion>
  <Accordion title="11c. シェル補完">
    Doctor は、現在のシェル（zsh、bash、fish、または PowerShell）にタブ補完がインストールされているかを確認します。

    - シェルプロファイルで低速な動的補完パターン（`source <(openclaw completion ...)`）が使用されている場合、doctor はより高速なキャッシュファイル方式にアップグレードします。
    - プロファイルに補完が設定されているもののキャッシュファイルがない場合、doctor はキャッシュを自動的に再生成します。
    - 補完がまったく設定されていない場合、doctor はインストールするよう求めます（対話モードのみ。`--non-interactive` ではスキップされます）。

    キャッシュを手動で再生成するには、`openclaw completion --write-state` を実行してください。

  </Accordion>
  <Accordion title="11d. 古いチャンネル Plugin のクリーンアップ">
    `openclaw doctor --fix` が見つからないチャンネル Plugin を削除する場合、その Plugin を参照している孤立したチャンネルスコープの設定も削除します。対象には、`channels.<id>` エントリ、そのチャンネルを指定した Heartbeat ターゲット、および `agents.*.models["<channel>/*"]` のオーバーライドが含まれます。これにより、チャンネルランタイムが存在しないにもかかわらず、設定が引き続き Gateway にそのチャンネルへのバインドを要求することで発生する Gateway の起動ループを防ぎます。
  </Accordion>
  <Accordion title="12. Gateway 認証の確認（ローカルトークン）">
    Doctor はローカル Gateway のトークン認証の準備状態を確認します。

    - トークンモードでトークンが必要なのにトークンソースが存在しない場合、doctor は生成を提案します。
    - `gateway.auth.token` が SecretRef で管理されているものの利用できない場合、doctor は警告し、平文で上書きしません。
    - `openclaw doctor --generate-gateway-token` は、トークンの SecretRef が設定されていない場合にのみ生成を強制します。

  </Accordion>
  <Accordion title="12b. SecretRef を考慮した読み取り専用修復">
    一部の修復フローでは、ランタイムのフェイルファスト動作を弱めずに、設定済みの認証情報を検査する必要があります。

    - `openclaw doctor --fix` は、対象を絞った設定修復に、ステータス系コマンドと同じ読み取り専用の SecretRef サマリーモデルを使用します。
    - 例: Telegram の `allowFrom` / `groupAllowFrom` にある `@username` の修復では、利用可能な場合、設定済みのボット認証情報の使用を試みます。
    - Telegram ボットトークンが SecretRef 経由で設定されているものの、現在のコマンドパスでは利用できない場合、doctor は認証情報が設定済みだが利用不可であることを報告し、クラッシュしたりトークンが未設定であると誤って報告したりせず、自動解決をスキップします。

  </Accordion>
  <Accordion title="13. Gateway のヘルスチェックと再起動">
    Doctor はヘルスチェックを実行し、Gateway が異常と思われる場合は再起動を提案します。
  </Accordion>
  <Accordion title="13b. メモリ検索の準備状況">
    Doctor は、設定されたメモリ検索埋め込みプロバイダーがデフォルトエージェントで使用可能かどうかを確認します。動作は、設定されたバックエンドとプロバイダーによって異なります。

    - **QMD バックエンド**: `qmd` バイナリが利用可能で起動できるかを検査します。利用できない場合は、`npm install -g @tobilu/qmd`（または Bun の同等コマンド）と手動でのバイナリパス指定を含む修正手順を表示します。
    - **明示的なローカルプロバイダー**: ローカルモデルファイル、または認識可能なリモートモデル URL／ダウンロード可能なモデル URL があるかを確認します。見つからない場合は、リモートプロバイダーへの切り替えを提案します。
    - **明示的なリモートプロバイダー**（`openai`、`voyage` など）: 環境または認証ストアに API キーが存在することを確認します。見つからない場合は、実行可能な修正ヒントを表示します。
    - **レガシー自動プロバイダー**: `memorySearch.provider: "auto"` を OpenAI として扱い、OpenAI の準備状況を確認し、`doctor --fix` で `provider: "openai"` に書き換えます。

    キャッシュ済みの Gateway 検査結果が利用可能な場合（確認時に Gateway が正常だった場合）、doctor はその結果を CLI から確認できる設定と照合し、相違があれば通知します。Doctor はデフォルトパスでは新たな埋め込み ping を開始しません。プロバイダーをライブで確認する場合は、メモリの詳細ステータスコマンドを使用してください。

    実行時の埋め込み準備状況を確認するには、`openclaw memory status --deep` を使用します。

  </Accordion>
  <Accordion title="14. チャネルステータスの警告">
    Gateway が正常な場合、doctor はチャネルステータスの検査を実行し、推奨される修正方法とともに警告を報告します。
  </Accordion>
  <Accordion title="15. スーパーバイザー設定の監査と修復">
    Doctor は、インストール済みのスーパーバイザー設定（launchd/systemd/schtasks）に、デフォルト設定の欠落や古い設定がないかを確認します（例: systemd の network-online 依存関係や再起動遅延）。不一致が見つかった場合は更新を推奨し、サービスファイル／タスクを現在のデフォルト設定に書き換えることができます。

    注:

    - `openclaw doctor` は、スーパーバイザー設定を書き換える前に確認を求めます。
    - `openclaw doctor --yes` は、デフォルトの修復確認を承認します。
    - `openclaw doctor --fix` は、確認なしで推奨される修正を適用します（`--repair` はエイリアスです）。
    - `openclaw doctor --fix --force` は、カスタムスーパーバイザー設定を上書きします。
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` を指定すると、Gateway サービスのライフサイクルについて doctor は読み取り専用になります。サービスの正常性の報告とサービス以外の修復は引き続き実行しますが、ライフサイクルを外部スーパーバイザーが所有するため、サービスのインストール／起動／再起動／ブートストラップ、スーパーバイザー設定の書き換え、レガシーサービスのクリーンアップはスキップします。
    - Linux では、対応する systemd Gateway ユニットがアクティブな間、doctor はコマンド／エントリポイントのメタデータを書き換えません。また、重複サービスの検査中は、非アクティブかつ非レガシーの追加の Gateway 類似ユニットを無視するため、補助サービスファイルによる不要なクリーンアップ通知は発生しません。
    - トークン認証にトークンが必要で、`gateway.auth.token` が SecretRef で管理されている場合、doctor によるサービスのインストール／修復は SecretRef を検証しますが、解決済みの平文トークン値をスーパーバイザーサービスの環境メタデータに保存しません。
    - Doctor は、古い LaunchAgent、systemd、または Windows Scheduled Task のインストール時にインラインで埋め込まれた、管理対象の `.env`／SecretRef ベースのサービス環境値を検出し、それらの値がスーパーバイザー定義ではなく実行時のソースから読み込まれるようにサービスメタデータを書き換えます。
    - Doctor は、`gateway.port` の変更後もサービスコマンドに古い `--port` が固定されている場合にこれを検出し、サービスメタデータを現在のポートに書き換えます。
    - トークン認証にトークンが必要で、設定されたトークン SecretRef を解決できない場合、doctor は実行可能なガイダンスを提示してインストール／修復処理をブロックします。
    - `gateway.auth.token` と `gateway.auth.password` の両方が設定され、`gateway.auth.mode` が未設定の場合、doctor はモードが明示的に設定されるまでインストール／修復をブロックします。
    - Linux のユーザー systemd ユニットでは、サービス認証メタデータを比較する際、doctor のトークンドリフト確認に `Environment=` と `EnvironmentFile=` の両方のソースが含まれます。
    - Doctor によるサービス修復は、設定がより新しいバージョンによって最後に書き込まれている場合、古い OpenClaw バイナリから Gateway サービスを書き換え、停止、または再起動することを拒否します。[Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)を参照してください。
    - `openclaw gateway install --force` を使用すれば、いつでも完全な書き換えを強制できます。

  </Accordion>
  <Accordion title="16. Gateway ランタイムとポートの診断">
    Doctor はサービスのランタイム（PID、直近の終了ステータス）を検査し、サービスがインストールされていても実際には実行されていない場合に警告します。また、Gateway ポート（デフォルト `18789`）でポート競合がないか確認し、考えられる原因（Gateway がすでに実行中、SSH トンネル）を報告します。
  </Accordion>
  <Accordion title="17. Gateway ランタイムのベストプラクティス">
    Doctor は、Gateway サービスが Bun またはバージョン管理された Node パス（`nvm`、`fnm`、`volta`、`asdf` など）で実行されている場合に警告します。WhatsApp および Telegram チャネルには Node が必要です。また、サービスはシェルの初期化設定を読み込まないため、バージョンマネージャーのパスはアップグレード後に動作しなくなる可能性があります。システムの Node インストール（Homebrew/apt/choco）が利用可能な場合、doctor はそこへの移行を提案します。

    新規インストールまたは修復された macOS LaunchAgent は、対話型シェルの PATH をコピーする代わりに、標準のシステム PATH（`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`）を使用します。これにより、Homebrew で管理されるシステムバイナリを引き続き利用できる一方で、Volta、asdf、fnm、pnpm、およびその他のバージョンマネージャーのディレクトリによって、子プロセスが解決する Node が変わることはありません。Linux サービスでは、明示的な環境ルート（`NVM_DIR`、`FNM_DIR`、`VOLTA_HOME`、`ASDF_DATA_DIR`、`BUN_INSTALL`、`PNPM_HOME`）と安定したユーザーバイナリディレクトリを引き続き保持しますが、推測されたバージョンマネージャーのフォールバックディレクトリは、ディスク上に実在する場合にのみサービスの PATH に書き込まれます。

  </Accordion>
  <Accordion title="18. 設定の書き込みとウィザードのメタデータ">
    Doctor は設定の変更を永続化し、doctor の実行を記録するためにウィザードのメタデータを付与します。
  </Accordion>
  <Accordion title="19. ワークスペースのヒント（バックアップとメモリシステム）">
    Doctor は、ワークスペースのメモリシステムがない場合にその導入を提案し、ワークスペースがまだ git で管理されていない場合はバックアップのヒントを表示します。

    ワークスペースの構造と git バックアップ（非公開の GitHub または GitLab を推奨）についての完全なガイドは、[/concepts/agent-workspace](/ja-JP/concepts/agent-workspace)を参照してください。

  </Accordion>
</AccordionGroup>

## 関連項目

- [Gateway 運用手順書](/ja-JP/gateway)
- [Gateway のトラブルシューティング](/ja-JP/gateway/troubleshooting)

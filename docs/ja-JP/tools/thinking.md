---
read_when:
    - thinking、fast-mode、verbose ディレクティブの解析またはデフォルトの調整
summary: /think、/fast、/verbose、/trace のディレクティブ構文と推論の可視性
title: 思考レベル
x-i18n:
    generated_at: "2026-05-04T05:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## 機能

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大予算）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → プロバイダー管理の適応的思考（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini 動的思考でサポート）
  - max → プロバイダー最大推論（Anthropic Claude Opus 4.7。Ollama はこれをネイティブの最高 `think` effort に対応付けます）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` に対応付けられます。
  - `highest` は `high` に対応付けられます。
- プロバイダー注記:
  - 思考メニューとピッカーはプロバイダープロファイルによって駆動されます。プロバイダー Plugin は、バイナリ `on` などのラベルを含め、選択されたモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルでのみ表示されます。サポートされていないレベルの入力ディレクティブは、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済み未サポートレベルは、プロバイダープロファイルの順位によって再対応付けされます。`adaptive` は非適応モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる最大の非 off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は適応的思考をデフォルトにしません。その API effort のデフォルトは、思考レベルを明示的に設定しない限り、引き続きプロバイダー側が所有します。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を、適応的思考に `output_config.effort: "xhigh"` を加えたものに対応付けます。これは `/think` が思考ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開します。これは同じプロバイダー所有の最大 effort パスに対応付けられます。
  - DeepSeek V4 モデルは `/think xhigh|max` を公開します。どちらも DeepSeek `reasoning_effort: "max"` に対応付けられ、低い非 off レベルは `high` に対応付けられます。
  - Ollama の思考対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` に対応付けられます。
  - OpenAI GPT モデルは、モデル固有の Responses API effort サポートを通じて `/think` を対応付けます。`/think off` は、対象モデルがサポートしている場合にのみ `reasoning.effort: "none"` を送信します。そうでない場合、OpenClaw はサポートされていない値を送信する代わりに、無効化された推論ペイロードを省略します。
  - カスタム OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで、`/think xhigh` にオプトインできます。これは送信 OpenAI 推論 effort ペイロードを対応付けるのと同じ compat メタデータを使用するため、メニュー、セッション検証、エージェント CLI、`llm-task` はトランスポート動作と一致します。
  - 古い構成済みの OpenRouter Hunter Alpha 参照は、プロキシ推論注入をスキップします。その廃止済みルートは推論フィールドを通じて最終回答テキストを返す可能性があるためです。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有の動的思考に対応付けます。Gemini 3 リクエストは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーに最も近い Gemini `thinkingLevel` または予算に対応付けられます。
  - Anthropic 互換ストリーミングパス上の MiniMax（`minimax/*`）は、モデルパラメーターまたはリクエストパラメーターで思考を明示的に設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れることを避けます。
  - Z.AI（`zai/*`）はバイナリ思考（`on`/`off`）のみをサポートします。`off` 以外の任意のレベルは `on` として扱われます（`low` に対応付け）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に対応付け、`off` 以外の任意のレベルを `thinking: { type: "enabled" }` に対応付けます。思考が有効な場合、Moonshot は `tool_choice` `auto|none` のみを受け付けます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（config の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能な場合はプロバイダー宣言のデフォルト。そうでない場合、推論対応モデルは `medium` またはそのモデルでサポートされる最も近い非 `off` レベルに解決され、非推論モデルは `off` のままです。

## セッションデフォルトの設定

- **ディレクティブのみ**のメッセージを送信します（空白可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに保持されます（デフォルトでは送信者ごと）。`/think:off` またはセッションのアイドルリセットでクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒントとともに拒否され、セッション状態は変更されません。
- 現在の思考レベルを確認するには、引数なしで `/think`（または `/think:`）を送信します。

## エージェント別の適用

- **Embedded Pi**: 解決されたレベルは、インプロセスの Pi エージェントランタイムに渡されます。

## 高速モード（/fast）

- レベル: `on|off`。
- ディレクティブのみのメッセージはセッション高速モードオーバーライドを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- 現在の有効な高速モード状態を確認するには、モードなしで `/fast`（または `/fast status`）を送信します。
- OpenClaw は高速モードを次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、高速モードはサポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI priority processing に対応付けられます。
- `openai-codex/*` では、高速モードは Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証パスで共有される 1 つの `/fast` トグルを維持します。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む、直接の公開 `anthropic/*` リクエストでは、高速モードは Anthropic service tiers に対応付けられます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデルパラメーターは、両方が設定されている場合、高速モードデフォルトを上書きします。OpenClaw は引き続き、非 Anthropic プロキシベース URL では Anthropic service-tier 注入をスキップします。
- `/status` は高速モードが有効な場合にのみ `Fast` を表示します。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション詳細表示を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択してクリアします。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在の詳細レベルを確認するには、引数なしで `/verbose`（または `/verbose:`）を送信します。
- 詳細表示がオンの場合、構造化ツール結果を出力するエージェント（Pi、その他の JSON エージェント）は、各ツール呼び出しをそれぞれ独立したメタデータのみのメッセージとして送り返します。利用可能な場合は `<emoji> <tool-name>: <arg>` が接頭辞になります。これらのツール要約は、各ツールの開始直後に送信され（別々の吹き出し）、ストリーミングデルタとしては送信されません。
- ツール失敗の要約は通常モードでも表示されますが、生のエラー詳細サフィックスは詳細表示が `on` または `full` でない限り非表示です。
- 詳細表示が `full` の場合、ツール出力も完了後に転送されます（別の吹き出し、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えると、その後のツール吹き出しは新しい設定に従います。
- `agents.defaults.toolProgressDetail` は、`/verbose` ツール要約と進捗ドラフトのツール行の形を制御します。`🛠️ Exec: checking JS syntax` のようなコンパクトな人間向けラベルには `"explain"`（デフォルト）を使用します。デバッグ用に生のコマンド/詳細も追加したい場合は `"raw"` を使用します。エージェントごとの `agents.list[].toolProgressDetail` はデフォルトを上書きします。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在のトレースレベルを確認するには、引数なしで `/trace`（または `/trace:`）を送信します。
- `/trace` は `/verbose` より範囲が狭く、Active Memory デバッグ要約など、Plugin 所有のトレース/デバッグ行のみを公開します。
- トレース行は `/status` 内、および通常のアシスタント返信後のフォローアップ診断メッセージとして表示されることがあります。

## 推論の可視性（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、思考ブロックを返信に表示するかどうかを切り替えます。
- 有効な場合、推論は `Reasoning:` を接頭辞とする**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信の生成中に推論を Telegram のドラフト吹き出しへストリーミングし、その後、推論を含まない最終回答を送信します。
- エイリアス: `/reason`。
- 現在の推論レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インラインディレクティブ、次にセッションオーバーライド、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

不正な形式のローカルモデル推論タグは保守的に扱われます。閉じた `<think>...</think>` ブロックは通常の返信では非表示のままで、すでに表示されたテキストの後にある閉じられていない推論も非表示になります。返信全体が単一の閉じられていない開始タグで囲まれており、そのままだと空テキストとして配信される場合、OpenClaw は不正な開始タグを削除し、残りのテキストを配信します。

## 関連

- 昇格モードのドキュメントは [昇格モード](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat プローブ本文は、構成された Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションデフォルトを変更することは避けてください）。
- Heartbeat 配信はデフォルトで最終ペイロードのみです。別個の `Reasoning:` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャットの思考セレクターは、ページ読み込み時に受信セッションストア/config からセッションの保存済みレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` 経由ですぐにセッションオーバーライドを書き込みます。次の送信を待たず、単発の `thinkingOnce` オーバーライドでもありません。
- 最初のオプションは常に `Default (<resolved level>)` です。解決済みデフォルトは、アクティブセッションモデルのプロバイダー思考プロファイルと、`/status` および `session_status` が使用するものと同じフォールバックロジックから取得されます。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーラベルリストとして保持されます。ブラウザー UI は独自のプロバイダー regex リストを保持しません。Plugin がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままです。

## プロバイダープロファイル

- Provider plugins は、モデルがサポートするレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- Claude モデルをプロキシする Provider plugins は、直接の Anthropic とプロキシカタログの整合性を保つために、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることができます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- 明示的な thinking オーバーライドを検証する必要がある Tool plugins は、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルのレベル一覧を保持するべきではありません。
- 設定済みのカスタムモデルメタデータにアクセスできる Tool plugins は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、および `resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、および `thinkingDefault` を公開し、ACP/チャットクライアントがランタイム検証で使用されるものと同じプロファイル ID とラベルをレンダリングできるようにします。

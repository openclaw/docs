---
read_when:
    - thinking、fast-mode、または verbose ディレクティブの解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性のディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-04-30T05:39:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## 機能

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大バジェット）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codex モデル、加えて Anthropic Claude Opus 4.7 effort）
  - adaptive → プロバイダー管理のアダプティブ思考（Anthropic/Bedrock の Claude 4.6、Anthropic Claude Opus 4.7、および Google Gemini の動的思考でサポート）
  - max → プロバイダー最大推論（Anthropic Claude Opus 4.7。Ollama ではこれをネイティブの最高 `think` effort にマップ）
  - `x-high`、`x_high`、`extra-high`、`extra high`、および `extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダーに関する注記:
  - 思考メニューとピッカーはプロバイダープロファイル駆動です。プロバイダー Plugin は、選択されたモデルの正確なレベルセットを宣言し、バイナリ `on` などのラベルも含みます。
  - `adaptive`、`xhigh`、および `max` は、それらをサポートするプロバイダー/モデルプロファイルでのみ表示されます。サポートされていないレベルの型付きディレクティブは、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済みの未サポートレベルは、プロバイダープロファイルのランクによって再マップされます。`adaptive` は非アダプティブモデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる最大の非 `off` レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は、デフォルトではアダプティブ思考になりません。明示的に思考レベルを設定しない限り、その API effort のデフォルトはプロバイダー所有のままです。
  - Anthropic Claude Opus 4.7 は `/think xhigh` をアダプティブ思考と `output_config.effort: "xhigh"` にマップします。これは `/think` が思考ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開します。これは同じプロバイダー所有の最大 effort パスにマップされます。
  - Ollama の思考対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け入れるため、`max` はネイティブの `think: "high"` にマップされます。
  - OpenAI GPT モデルは、モデル固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、ターゲットモデルがサポートする場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw はサポートされていない値を送信する代わりに、無効化された推論ペイロードを省略します。
  - カスタムの OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` を有効化できます。これは送信 OpenAI 推論 effort ペイロードをマップする同じ compat メタデータを使用するため、メニュー、セッション検証、エージェント CLI、および `llm-task` はトランスポート動作と一致します。
  - 古い設定済み OpenRouter Hunter Alpha 参照はプロキシ推論の注入をスキップします。その廃止済みルートは推論フィールドを通じて最終回答テキストを返す可能性があるためです。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有の動的思考にマップします。Gemini 3 リクエストは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーで最も近い Gemini の `thinkingLevel` またはバジェットにマップされます。
  - Anthropic 互換ストリーミングパス上の MiniMax（`minimax/*`）は、モデルパラメーターまたはリクエストパラメーターで明示的に思考を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れることを避けます。
  - Z.AI（`zai/*`）はバイナリ思考（`on`/`off`）のみをサポートします。非 `off` レベルはすべて `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` にマップし、非 `off` レベルをすべて `thinking: { type: "enabled" }` にマップします。思考が有効な場合、Moonshot は `tool_choice` の `auto|none` のみを受け入れます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック: プロバイダー宣言のデフォルトが利用可能な場合はそれを使用。それ以外の場合、推論対応モデルは `medium` またはそのモデルでサポートされる最も近い非 `off` レベルに解決され、非推論モデルは `off` のままです。

## セッションデフォルトの設定

- ディレクティブ**のみ**のメッセージ（空白は許可）を送信します。例: `/think:medium` または `/t high`。
- これは現在のセッション（デフォルトでは送信者ごと）に固定されます。`/think:off` またはセッションのアイドルリセットでクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の思考レベルを確認できます。

## エージェント別の適用

- **組み込み Pi**: 解決されたレベルは、インプロセスの Pi エージェントランタイムに渡されます。

## 高速モード（/fast）

- レベル: `on|off`。
- ディレクティブのみのメッセージはセッションの高速モードオーバーライドを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モードなしで `/fast`（または `/fast status`）を送信すると、現在有効な高速モード状態を確認できます。
- OpenClaw は高速モードを次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、高速モードはサポート対象の Responses リクエストで `service_tier=priority` を送信することにより、OpenAI の優先処理にマップされます。
- `openai-codex/*` では、高速モードは Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証パスで共有される 1 つの `/fast` トグルを維持します。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む、直接公開 `anthropic/*` リクエストでは、高速モードは Anthropic サービスティアにマップされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデルパラメーターは、両方が設定されている場合、高速モードのデフォルトを上書きします。OpenClaw は非 Anthropic プロキシベース URL では引き続き Anthropic サービスティア注入をスキップします。
- `/status` は、高速モードが有効な場合にのみ `Fast` を表示します。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション詳細を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択してクリアします。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送信すると、現在の詳細レベルを確認できます。
- 詳細がオンの場合、構造化ツール結果を出力するエージェント（Pi、その他の JSON エージェント）は、各ツール呼び出しをそれぞれ独自のメタデータのみのメッセージとして返し、利用可能な場合は `<emoji> <tool-name>: <arg>`（パス/コマンド）を前置します。これらのツール要約は、各ツールが開始されるとすぐに（別々の吹き出しで）送信され、ストリーミングデルタとしては送信されません。
- ツール失敗の要約は通常モードでも表示されたままですが、生のエラー詳細サフィックスは詳細が `on` または `full` でない限り非表示になります。
- 詳細が `full` の場合、ツール出力も完了後に転送されます（別の吹き出し、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えると、その後のツール吹き出しは新しい設定に従います。

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッションの Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送信すると、現在のトレースレベルを確認できます。
- `/trace` は `/verbose` より範囲が狭く、Active Memory デバッグ要約など、Plugin 所有のトレース/デバッグ行のみを公開します。
- トレース行は `/status` に表示される場合があり、通常のアシスタント返信後のフォローアップ診断メッセージとして表示される場合もあります。

## 推論の可視性（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、思考ブロックを返信に表示するかどうかを切り替えます。
- 有効な場合、推論は `Reasoning:` が前置された**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信生成中に Telegram の下書き吹き出しへ推論をストリーミングし、その後、推論なしで最終回答を送信します。
- エイリアス: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送信すると、現在の推論レベルを確認できます。
- 解決順序: インラインディレクティブ、次にセッションオーバーライド、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、次にフォールバック（`off`）。

不正なローカルモデル推論タグは保守的に処理されます。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままで、すでに表示されたテキストの後にある閉じられていない推論も非表示になります。返信全体が単一の閉じられていない開始タグで囲まれており、そのままだと空テキストとして配信される場合、OpenClaw は不正な開始タグを削除し、残りのテキストを配信します。

## 関連項目

- 昇格モードのドキュメントは [昇格モード](/ja-JP/tools/elevated) にあります。

## Heartbeats

- Heartbeat プローブ本文は、設定済みの Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションデフォルトを変更することは避けてください）。
- Heartbeat 配信は、デフォルトで最終ペイロードのみになります。別個の `Reasoning:` メッセージ（利用可能な場合）も送信するには、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャットの思考セレクターは、ページ読み込み時に受信セッションストア/設定からセッションの保存済みレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` を通じてセッションオーバーライドが即座に書き込まれます。次の送信を待たず、単発の `thinkingOnce` オーバーライドでもありません。
- 最初のオプションは常に `Default (<resolved level>)` です。解決済みデフォルトは、アクティブセッションモデルのプロバイダー思考プロファイルに加えて、`/status` と `session_status` が使用するものと同じフォールバックロジックから得られます。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーのラベルリストとして維持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。Plugin がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままです。

## プロバイダープロファイル

- Provider Plugin は `resolveThinkingProfile(ctx)` を公開して、モデルでサポートされるレベルとデフォルトを定義できます。
- Claude モデルをプロキシする Provider Plugin は、直接の Anthropic カタログとプロキシカタログの整合性を保つために、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることができます。バイナリプロバイダーでは `{ id: "low", label: "on" }` を使用します。
- 明示的な思考オーバーライドを検証する必要がある Tool Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルレベル一覧を保持するべきではありません。
- 設定済みのカスタムモデルメタデータにアクセスできる Tool Plugin は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開し、ACP/チャットクライアントがランタイム検証で使用されるものと同じプロファイル ID とラベルを表示できるようにします。

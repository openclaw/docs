---
read_when:
    - thinking、fast-mode、verboseディレクティブの解析またはデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性に関するディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-05-04T18:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
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
  - adaptive → プロバイダー管理の適応的思考（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini の動的思考でサポート）
  - max → プロバイダー最大推論（Anthropic Claude Opus 4.7。Ollama はこれをネイティブの最高 `think` effort にマップ）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダーに関する注記:
  - 思考メニューとピッカーはプロバイダープロファイルによって駆動されます。Provider plugins は、バイナリの `on` などのラベルを含め、選択されたモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルに対してのみ表示されます。サポートされていないレベルの型付きディレクティブは、そのモデルの有効なオプションとともに拒否されます。
  - 既存の保存済みの未サポートレベルは、プロバイダープロファイルのランクによって再マップされます。`adaptive` は非適応モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる最大の非 off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は適応的思考をデフォルトにしません。その API effort のデフォルトは、思考レベルを明示的に設定しない限りプロバイダー所有のままです。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を、適応的思考に加えて `output_config.effort: "xhigh"` にマップします。これは `/think` が思考ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開します。これは同じプロバイダー所有の最大 effort パスにマップされます。
  - DeepSeek V4 モデルは `/think xhigh|max` を公開します。どちらも DeepSeek の `reasoning_effort: "max"` にマップされ、より低い非 off レベルは `high` にマップされます。
  - Ollama の思考対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` にマップされます。
  - OpenAI GPT モデルは、モデル固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、対象モデルがサポートする場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw は未サポート値を送信する代わりに、無効化された推論ペイロードを省略します。
  - カスタムの OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` にオプトインできます。これは送信される OpenAI 推論 effort ペイロードをマップするものと同じ互換メタデータを使用するため、メニュー、セッション検証、エージェント CLI、`llm-task` がトランスポート動作と一致します。
  - 古くなった設定済みの OpenRouter Hunter Alpha 参照は、プロキシ推論の注入をスキップします。その廃止済みルートは、推論フィールドを通じて最終回答テキストを返す可能性があるためです。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有の動的思考にマップします。Gemini 3 リクエストは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信します。固定レベルは、そのモデルファミリーに最も近い Gemini の `thinkingLevel` または予算に引き続きマップされます。
  - Anthropic 互換ストリーミングパス上の MiniMax（`minimax/*`）は、モデルパラメーターまたはリクエストパラメーターで思考を明示的に設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れることを避けます。
  - Z.AI（`zai/*`）はバイナリ思考（`on`/`off`）のみをサポートします。任意の非 `off` レベルは `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` にマップし、任意の非 `off` レベルを `thinking: { type: "enabled" }` にマップします。思考が有効な場合、Moonshot は `tool_choice` の `auto|none` のみを受け付けます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージのみに適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージ送信によって設定）。
3. エージェントごとのデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック: プロバイダー宣言のデフォルトが利用可能な場合はそれを使用します。それ以外の場合、推論対応モデルは `medium` またはそのモデルでサポートされる最も近い非 `off` レベルに解決され、非推論モデルは `off` のままです。

## セッションデフォルトの設定

- ディレクティブ**のみ**のメッセージ（空白は許可）を送信します。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッションのアイドルリセットでクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 現在の思考レベルを確認するには、引数なしで `/think`（または `/think:`）を送信します。

## エージェントによる適用

- **組み込み Pi**: 解決されたレベルはプロセス内の Pi エージェントランタイムに渡されます。
- **Claude CLI バックエンド**: `claude-cli` 使用時、非 off レベルは `--effort` として Claude Code に渡されます。[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

## 高速モード（/fast）

- レベル: `on|off`。
- ディレクティブのみのメッセージはセッションの高速モードオーバーライドを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- 現在有効な高速モード状態を確認するには、モードなしで `/fast`（または `/fast status`）を送信します。
- OpenClaw は次の順序で高速モードを解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、高速モードはサポートされる Responses リクエストで `service_tier=priority` を送信することで、OpenAI の優先処理にマップされます。
- `openai-codex/*` では、高速モードは Codex Responses 上で同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証パスで共有される単一の `/fast` トグルを維持します。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む、直接の公開 `anthropic/*` リクエストでは、高速モードは Anthropic サービス階層にマップされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）が `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデルパラメーターは、両方が設定されている場合に高速モードのデフォルトを上書きします。OpenClaw は Anthropic 以外のプロキシベース URL では、引き続き Anthropic サービス階層の注入をスキップします。
- `/status` は高速モードが有効な場合のみ `Fast` を表示します。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション詳細出力を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択するとクリアできます。
- インラインディレクティブはそのメッセージのみに影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 現在の詳細レベルを確認するには、引数なしで `/verbose`（または `/verbose:`）を送信します。
- 詳細が on の場合、構造化ツール結果を出力するエージェント（Pi やその他の JSON エージェント）は、各ツール呼び出しを独自のメタデータのみのメッセージとして送り返します。利用可能な場合は `<emoji> <tool-name>: <arg>` が前置されます。これらのツール概要は、各ツールの開始直後に送信され（別々の吹き出し）、ストリーミングデルタとしては送信されません。
- ツール失敗の概要は通常モードでも表示されますが、生のエラー詳細サフィックスは、詳細が `on` または `full` でない限り非表示になります。
- 詳細が `full` の場合、ツール出力も完了後に転送されます（別の吹き出し、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えた場合、その後のツール吹き出しは新しい設定に従います。
- `agents.defaults.toolProgressDetail` は、`/verbose` ツール概要と進行中下書きのツール行の形式を制御します。`🛠️ Exec: checking JS syntax` のようなコンパクトな人間向けラベルには `"explain"`（デフォルト）を使用します。デバッグ用に生のコマンド/詳細も追加したい場合は `"raw"` を使用します。エージェントごとの `agents.list[].toolProgressDetail` はデフォルトを上書きします。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッションの Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージのみに影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 現在のトレースレベルを確認するには、引数なしで `/trace`（または `/trace:`）を送信します。
- `/trace` は `/verbose` より範囲が狭く、Active Memory デバッグ概要など、Plugin 所有のトレース/デバッグ行のみを公開します。
- トレース行は `/status` 内、および通常のアシスタント返信後の後続診断メッセージとして表示される場合があります。

## 推論の可視性（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、思考ブロックを返信に表示するかどうかを切り替えます。
- 有効な場合、推論は `Reasoning:` で始まる**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信の生成中に推論を Telegram の下書き吹き出しへストリーミングし、その後、推論なしで最終回答を送信します。
- エイリアス: `/reason`。
- 現在の推論レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インラインディレクティブ、その後セッションオーバーライド、その後エージェントごとのデフォルト（`agents.list[].reasoningDefault`）、その後フォールバック（`off`）。

不正な形式のローカルモデル推論タグは保守的に処理されます。閉じた `<think>...</think>` ブロックは通常の返信では非表示のままで、すでに表示されたテキストの後にある閉じられていない推論も非表示になります。返信が単一の閉じられていない開始タグで完全に囲まれており、そうでなければ空テキストとして配信される場合、OpenClaw は不正な形式の開始タグを削除し、残りのテキストを配信します。

## 関連

- 昇格モードのドキュメントは[昇格モード](/ja-JP/tools/elevated)にあります。

## Heartbeat

- Heartbeat プローブ本文は、設定された Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションデフォルトを変更することは避けてください）。
- Heartbeat 配信は、デフォルトで最終ペイロードのみです。別個の `Reasoning:` メッセージ（利用可能な場合）も送信するには、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャットの思考セレクターは、ページ読み込み時に受信セッションストア/設定からセッションの保存済みレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` を介してセッションオーバーライドが即座に書き込まれます。次回送信を待たず、一度限りの `thinkingOnce` オーバーライドでもありません。
- 最初のオプションは常に `Default (<resolved level>)` です。ここで解決済みデフォルトは、アクティブなセッションモデルのプロバイダー思考プロファイルに加えて、`/status` と `session_status` が使用するものと同じフォールバックロジックに由来します。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーラベルリストとして維持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。plugins がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期したままです。

## プロバイダープロファイル

- プロバイダーPluginは、モデルがサポートするレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- ClaudeモデルをプロキシするプロバイダーPluginは、直接のAnthropicカタログとプロキシカタログの整合性を保つために、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることができます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- 明示的なthinkingオーバーライドを検証する必要があるツールPluginは、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルのレベル一覧を保持しないでください。
- 設定済みのカスタムモデルメタデータにアクセスできるツールPluginは、`resolveThinkingPolicy` に `catalog` を渡すことで、`compat.supportedReasoningEfforts` のオプトインをPlugin側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、および `resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gatewayの行/デフォルトは `thinkingLevels`、`thinkingOptions`、および `thinkingDefault` を公開するため、ACP/chatクライアントはランタイム検証で使用されるものと同じプロファイルIDとラベルをレンダリングします。

---
read_when:
    - thinking、fast-mode、または verbose ディレクティブの解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性に関するディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-04-30T16:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## できること

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大バジェット）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → プロバイダー管理の adaptive thinking（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini dynamic thinking でサポート）
  - max → プロバイダー最大 reasoning（Anthropic Claude Opus 4.7。Ollama はこれをネイティブの最大 `think` effort にマップ）
  - `x-high`、`x_high`、`extra-high`、`extra high`、および `extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダーメモ:
  - thinking メニューとピッカーはプロバイダープロファイルによって駆動されます。プロバイダー Plugin は、選択したモデルの正確なレベルセットを宣言します。これには、バイナリの `on` などのラベルも含まれます。
  - `adaptive`、`xhigh`、および `max` は、それらをサポートするプロバイダー/モデルプロファイルでのみ表示されます。サポートされていないレベルの型付きディレクティブは、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済みの未サポートレベルは、プロバイダープロファイルのランクによって再マップされます。`adaptive` は非 adaptive モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択したモデルでサポートされる最大の非 off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking をデフォルトにしません。その API effort のデフォルトは、thinking レベルを明示的に設定しない限り、プロバイダー所有のままです。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を adaptive thinking と `output_config.effort: "xhigh"` にマップします。これは、`/think` が thinking ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開します。これは同じプロバイダー所有の max effort パスにマップされます。
  - DeepSeek V4 モデルは `/think xhigh|max` を公開します。どちらも DeepSeek `reasoning_effort: "max"` にマップされ、より低い非 off レベルは `high` にマップされます。
  - Ollama の thinking 対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` にマップされます。
  - OpenAI GPT モデルは、モデル固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、対象モデルがサポートしている場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw は未サポートの値を送信する代わりに、無効化された reasoning ペイロードを省略します。
  - カスタムの OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` を有効にできます。これは送信 OpenAI reasoning effort ペイロードをマップするものと同じ互換メタデータを使用するため、メニュー、セッション検証、エージェント CLI、および `llm-task` はトランスポート動作と一致します。
  - 古い設定済みの OpenRouter Hunter Alpha 参照は、proxy reasoning の注入をスキップします。これは、その廃止済みルートが reasoning フィールド経由で最終回答テキストを返す可能性があるためです。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有 dynamic thinking にマップします。Gemini 3 リクエストは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーに最も近い Gemini `thinkingLevel` またはバジェットにマップされます。
  - Anthropic 互換ストリーミングパス上の MiniMax（`minimax/*`）は、モデルパラメーターまたはリクエストパラメーターで明示的に thinking を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れることを防ぎます。
  - Z.AI（`zai/*`）はバイナリ thinking（`on`/`off`）のみをサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` にマップし、`off` 以外の任意のレベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` の `auto|none` のみを受け付けます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージを送信して設定）。
3. エージェントごとのデフォルト（config 内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config 内の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能な場合はプロバイダー宣言のデフォルト。それ以外の場合、reasoning 対応モデルはそのモデルの `medium` または最も近いサポート済み非 `off` レベルに解決され、非 reasoning モデルは `off` のままです。

## セッションデフォルトの設定

- ディレクティブ**のみ**のメッセージを送信します（空白は許可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに保持されます（デフォルトでは送信者ごと）。`/think:off` またはセッションアイドルリセットでクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の thinking レベルを確認できます。

## エージェント別の適用

- **埋め込み Pi**: 解決されたレベルはインプロセス Pi エージェントランタイムに渡されます。

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
- `openai/*` では、高速モードはサポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI priority processing にマップされます。
- `openai-codex/*` では、高速モードは Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証パスで共有される 1 つの `/fast` トグルを維持します。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む直接の公開 `anthropic/*` リクエストでは、高速モードは Anthropic service tiers にマップされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデルパラメーターは、両方が設定されている場合、高速モードのデフォルトを上書きします。OpenClaw は引き続き、非 Anthropic proxy base URL では Anthropic service-tier 注入をスキップします。
- `/status` は高速モードが有効な場合にのみ `Fast` を表示します。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択してクリアします。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送信すると、現在の verbose レベルを確認できます。
- verbose が on の場合、構造化ツール結果を出力するエージェント（Pi、その他の JSON エージェント）は、利用可能な場合に `<emoji> <tool-name>: <arg>`（path/command）を先頭に付けて、各ツール呼び出しをそれぞれ独立したメタデータのみのメッセージとして返します。これらのツール要約は、各ツールの開始時にすぐ送信されます（別々の吹き出し）。ストリーミングデルタとしては送信されません。
- ツール失敗の要約は通常モードでも表示されたままですが、生のエラー詳細サフィックスは verbose が `on` または `full` でない限り非表示になります。
- verbose が `full` の場合、完了後にツール出力も転送されます（別の吹き出し、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えると、以降のツール吹き出しは新しい設定に従います。

## Plugin trace ディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッションの Plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送信すると、現在の trace レベルを確認できます。
- `/trace` は `/verbose` より範囲が狭く、Active Memory デバッグ要約など、Plugin 所有の trace/debug 行のみを公開します。
- trace 行は `/status` に表示される場合や、通常のアシスタント返信後のフォローアップ診断メッセージとして表示される場合があります。

## Reasoning の表示（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、thinking ブロックを返信に表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` で始まる**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信の生成中に Telegram の下書き吹き出しへ reasoning をストリーミングし、その後 reasoning なしで最終回答を送信します。
- エイリアス: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送信すると、現在の reasoning レベルを確認できます。
- 解決順序: インラインディレクティブ、次にセッションオーバーライド、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、次にフォールバック（`off`）。

不正な形式のローカルモデル reasoning タグは保守的に処理されます。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままになり、すでに表示されているテキストの後にある閉じられていない reasoning も非表示になります。返信が 1 つの閉じられていない開始タグで完全に囲まれており、そのままでは空テキストとして配信される場合、OpenClaw は不正な形式の開始タグを削除し、残りのテキストを配信します。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat プローブ本文は設定済みの Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションデフォルトを変更することは避けてください）。
- Heartbeat 配信はデフォルトで最終ペイロードのみです。別の `Reasoning:` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャットの thinking セレクターは、ページ読み込み時に受信セッションストア/config からセッションの保存済みレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` 経由でセッションオーバーライドが即時に書き込まれます。次の送信を待たず、1 回限りの `thinkingOnce` オーバーライドでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` です。解決済みデフォルトは、アクティブなセッションモデルのプロバイダー thinking プロファイルと、`/status` および `session_status` が使用するものと同じフォールバックロジックから得られます。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーのラベルリストとして保持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。Plugin がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままになります。

## プロバイダープロファイル

- Provider Plugin は、モデルがサポートするレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- Claude モデルをプロキシする Provider Plugin は、直接の Anthropic カタログとプロキシカタログの整合性を保つために、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることもできます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- 明示的な thinking オーバーライドを検証する必要がある Tool Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルレベル一覧を保持しないでください。
- 構成済みのカスタムモデルメタデータにアクセスできる Tool Plugin は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP/チャットクライアントはランタイム検証で使用されるものと同じプロファイル ID とラベルをレンダリングできます。

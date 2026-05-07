---
read_when:
    - thinking、fast-mode、verbose ディレクティブの解析またはデフォルトの調整
summary: /think、/fast、/verbose、/trace のディレクティブ構文と推論の可視性
title: 思考レベル
x-i18n:
    generated_at: "2026-05-07T13:27:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## 何をするか

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大予算）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → provider 管理の adaptive thinking（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini dynamic thinking でサポート）
  - max → provider の最大 reasoning（Anthropic Claude Opus 4.7。Ollama はこれをネイティブの最高 `think` effort にマップします）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップします。
  - `highest` は `high` にマップします。
- Provider 注記:
  - thinking メニューとピッカーは provider-profile によって駆動されます。Provider plugins は、バイナリ `on` などのラベルを含め、選択されたモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートする provider/model profile に対してのみ表示されます。サポートされないレベルの typed directive は、そのモデルの有効なオプションとともに拒否されます。
  - 既存の保存済みの未サポートレベルは、provider profile rank によって再マップされます。`adaptive` は non-adaptive モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる最大の non-off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な thinking level が設定されていない場合、既定で `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking を既定にしません。その API effort の既定値は、thinking level を明示的に設定しない限り provider 所有のままです。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を adaptive thinking と `output_config.effort: "xhigh"` にマップします。これは、`/think` が thinking directive であり、`xhigh` が Opus 4.7 の effort 設定だからです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開します。これは同じ provider 所有の max effort パスにマップします。
  - Direct DeepSeek V4 モデルは `/think xhigh|max` を公開します。どちらも DeepSeek `reasoning_effort: "max"` にマップされ、より低い non-off レベルは `high` にマップされます。
  - OpenRouter 経由の DeepSeek V4 モデルは `/think xhigh` を公開し、OpenRouter がサポートする `reasoning_effort` 値を送信します。保存済みの `max` override は `xhigh` にフォールバックします。
  - Ollama の thinking 対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` にマップされます。
  - OpenAI GPT モデルは、model 固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、対象モデルが対応している場合にのみ `reasoning.effort: "none"` を送信します。そうでない場合、OpenClaw は未サポートの値を送信する代わりに、disabled reasoning payload を省略します。
  - カスタムの OpenAI 互換 catalog entries は、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` を有効化できます。これは outbound OpenAI reasoning effort payload をマップするものと同じ compat metadata を使用するため、メニュー、session validation、agent CLI、`llm-task` が transport behavior と一致します。
  - 古い configured OpenRouter Hunter Alpha refs は proxy reasoning injection をスキップします。これは、その retired route が reasoning fields を通じて final answer text を返す可能性があるためです。
  - Google Gemini は `/think adaptive` を Gemini の provider 所有 dynamic thinking にマップします。Gemini 3 requests は固定の `thinkingLevel` を省略し、Gemini 2.5 requests は `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーに最も近い Gemini `thinkingLevel` または budget にマップされます。
  - Anthropic-compatible streaming path 上の MiniMax (`minimax/*`) は、model params または request params で thinking を明示的に設定しない限り、既定で `thinking: { type: "disabled" }` になります。これにより、MiniMax の non-native Anthropic stream format から `reasoning_content` deltas が漏れるのを防ぎます。
  - Z.AI (`zai/*`) はバイナリ thinking（`on`/`off`）のみをサポートします。任意の non-`off` レベルは `on` として扱われます（`low` にマップ）。
  - Moonshot (`moonshot/*`) は `/think off` を `thinking: { type: "disabled" }` にマップし、任意の non-`off` レベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` `auto|none` のみを受け付けます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. Session override（directive-only message を送信して設定）。
3. Agent ごとの既定値（config 内の `agents.list[].thinkingDefault`）。
4. グローバル既定値（config 内の `agents.defaults.thinkingDefault`）。
5. フォールバック: provider-declared default が利用可能な場合はそれを使用します。それ以外の場合、reasoning-capable モデルは `medium` またはそのモデルでサポートされる最も近い non-`off` レベルに解決され、non-reasoning モデルは `off` のままです。

## Session default の設定

- ディレクティブだけのメッセージを送信します（空白は許可）。例: `/think:medium` または `/t high`。
- これは現在の session（既定では sender ごと）に残ります。`/think:off` または session idle reset によってクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、session state は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の thinking level を確認できます。

## Agent による適用

- **Embedded Pi**: 解決されたレベルは in-process Pi agent runtime に渡されます。
- **Claude CLI backend**: `claude-cli` を使用する場合、non-off レベルは `--effort` として Claude Code に渡されます。[CLI backends](/ja-JP/gateway/cli-backends) を参照してください。

## Fast mode (/fast)

- レベル: `on|off`。
- Directive-only message は session fast-mode override を切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- mode なしで `/fast`（または `/fast status`）を送信すると、現在有効な fast-mode state を確認できます。
- OpenClaw は fast mode を次の順序で解決します。
  1. Inline/directive-only `/fast on|off`
  2. Session override
  3. Agent ごとの既定値（`agents.list[].fastModeDefault`）
  4. Model ごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode はサポートされる Responses requests で `service_tier=priority` を送信することにより、OpenAI priority processing にマップされます。
- `openai-codex/*` では、fast mode は Codex Responses 上で同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の auth paths で共有される 1 つの `/fast` トグルを保持します。
- OAuth 認証済みで `api.anthropic.com` に送信される traffic を含む direct public `anthropic/*` requests では、fast mode は Anthropic service tiers にマップされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic-compatible path 上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` model params は、両方が設定されている場合、fast-mode default を override します。OpenClaw は引き続き、non-Anthropic proxy base URLs に対する Anthropic service-tier injection をスキップします。
- `/status` は fast mode が有効な場合にのみ `Fast` を表示します。

## Verbose directives (/verbose or /v)

- レベル: `on`（minimal）| `full` | `off`（既定）。
- Directive-only message は session verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは state を変更せずにヒントを返します。
- `/verbose off` は明示的な session override を保存します。Sessions UI で `inherit` を選択してクリアします。
- Inline directive はそのメッセージにのみ影響します。それ以外の場合は session/global defaults が適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送信すると、現在の verbose level を確認できます。
- verbose が on の場合、structured tool results を出力する agents（Pi、その他の JSON agents）は、各 tool call をそれぞれ metadata-only message として送り返します。利用可能な場合は `<emoji> <tool-name>: <arg>` がプレフィックスされます。これらの tool summaries は各 tool の開始直後に送信され（別々の bubbles）、streaming deltas としては送信されません。
- Tool failure summaries は normal mode でも表示されたままですが、raw error detail suffixes は verbose が `on` または `full` でない限り非表示です。
- verbose が `full` の場合、tool outputs も completion 後に転送されます（別 bubble、安全な長さに切り詰め）。run の進行中に `/verbose on|full|off` を切り替えると、それ以降の tool bubbles は新しい設定に従います。
- `agents.defaults.toolProgressDetail` は `/verbose` tool summaries と progress-draft tool lines の形を制御します。`🛠️ Exec: checking JS syntax` のような compact human labels には `"explain"`（既定）を使用します。debugging のために raw command/detail も追加したい場合は `"raw"` を使用します。Agent ごとの `agents.list[].toolProgressDetail` は既定値を override します。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin trace directives (/trace)

- レベル: `on` | `off`（既定）。
- Directive-only message は session plugin trace output を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- Inline directive はそのメッセージにのみ影響します。それ以外の場合は session/global defaults が適用されます。
- 引数なしで `/trace`（または `/trace:`）を送信すると、現在の trace level を確認できます。
- `/trace` は `/verbose` より範囲が狭く、Active Memory debug summaries など plugin-owned trace/debug lines のみを公開します。
- Trace lines は `/status` に表示されることも、通常の assistant reply の後に follow-up diagnostic message として表示されることもあります。

## Reasoning visibility (/reasoning)

- レベル: `on|off|stream`。
- Directive-only message は replies に thinking blocks を表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` をプレフィックスとして付けた **separate message** として送信されます。
- `stream`（Telegram のみ）: reply の生成中に reasoning を Telegram draft bubble に stream し、reasoning なしで final answer を送信します。
- Alias: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送信すると、現在の reasoning level を確認できます。
- 解決順序: inline directive、次に session override、次に agent ごとの既定値（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

Malformed local-model reasoning tags は保守的に処理されます。閉じた `<think>...</think>` blocks は通常の replies では非表示のままになり、すでに表示された text の後にある閉じられていない reasoning も非表示になります。reply が単一の閉じられていない opening tag で完全にラップされており、そのままだと empty text として配信される場合、OpenClaw は malformed opening tag を削除し、残りの text を配信します。

## 関連

- Elevated mode docs は [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeats

- Heartbeat probe body は configured heartbeat prompt です（既定: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat message 内の inline directives は通常どおり適用されます（ただし heartbeats から session defaults を変更するのは避けてください）。
- Heartbeat delivery は既定で final payload のみに送信されます。別個の `Reasoning:` message も（利用可能な場合に）送信するには、`agents.defaults.heartbeat.includeReasoning: true` または agent ごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web chat UI

- Web チャットの思考セレクターは、ページ読み込み時にインバウンドセッションストア/設定から、セッションに保存されているレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` によってセッションのオーバーライドが即座に書き込まれます。次回送信まで待たず、1 回限りの `thinkingOnce` オーバーライドでもありません。
- 最初のオプションは常にオーバーライド解除の選択肢です。セッションがオフではない有効なデフォルトを継承している場合は `Inherited: <resolved level>` と表示され、継承された思考が無効な場合は `Off` と表示されます。
- 明示的なピッカー選択は、プロバイダーラベルがある場合はそれを保持しつつ、オーバーライドとしてラベル付けされます（たとえば、プロバイダーラベル付きの `max` オプションは `Override: maximum`）。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` は従来のラベルリストとして維持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。Plugin がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き動作し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期された状態を保ちます。

## プロバイダープロファイル

- Provider Plugin は `resolveThinkingProfile(ctx)` を公開して、モデルがサポートするレベルとデフォルトを定義できます。
- Claude モデルをプロキシする Provider Plugin は、直接の Anthropic カタログとプロキシカタログの整合性を保つため、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることもできます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- 明示的な思考オーバーライドを検証する必要がある Tool Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルレベルリストを保持すべきではありません。
- 設定済みのカスタムモデルメタデータにアクセスできる Tool Plugin は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP/チャットクライアントはランタイム検証が使用するものと同じプロファイル ID とラベルをレンダリングできます。

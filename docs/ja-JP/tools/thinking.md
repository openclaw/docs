---
read_when:
    - thinking、fast-mode、またはverboseディレクティブの解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace のディレクティブ構文と推論の可視性
title: 思考レベル
x-i18n:
    generated_at: "2026-05-05T01:50:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## 機能

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル (エイリアス): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「考える」
  - low → 「しっかり考える」
  - medium → 「さらにしっかり考える」
  - high → 「ultrathink」(最大予算)
  - xhigh → 「ultrathink+」(GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7 effort)
  - adaptive → プロバイダー管理の適応型思考 (Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini 動的思考でサポート)
  - max → プロバイダー最大推論 (Anthropic Claude Opus 4.7。Ollama はこれをネイティブの最高 `think` effort にマップする)
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされる。
  - `highest` は `high` にマップされる。
- プロバイダーに関する注記:
  - 思考メニューとピッカーはプロバイダープロファイル駆動。プロバイダー Plugin は、バイナリ `on` などのラベルを含め、選択されたモデルの正確なレベルセットを宣言する。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルにのみ表示される。サポートされないレベルの型付きディレクティブは、そのモデルの有効な選択肢とともに拒否される。
  - 既存の保存済み未サポートレベルは、プロバイダープロファイルのランクによって再マップされる。`adaptive` は非適応モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択されたモデルでサポートされる最大の非 off レベルにフォールバックする。
  - Anthropic Claude 4.6 モデルは、明示的な思考レベルが設定されていない場合、デフォルトで `adaptive` になる。
  - Anthropic Claude Opus 4.7 は適応型思考をデフォルトにしない。その API effort のデフォルトは、思考レベルを明示的に設定しない限り、プロバイダー所有のままになる。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を適応型思考と `output_config.effort: "xhigh"` にマップする。これは、`/think` が思考ディレクティブであり、`xhigh` が Opus 4.7 の effort 設定であるため。
  - Anthropic Claude Opus 4.7 は `/think max` も公開する。これは同じプロバイダー所有の最大 effort パスにマップされる。
  - 直接の DeepSeek V4 モデルは `/think xhigh|max` を公開する。どちらも DeepSeek `reasoning_effort: "max"` にマップされ、より低い非 off レベルは `high` にマップされる。
  - OpenRouter 経由の DeepSeek V4 モデルは `/think xhigh` を公開し、OpenRouter がサポートする `reasoning_effort` 値を送信する。保存済みの `max` オーバーライドは `xhigh` にフォールバックする。
  - Ollama の思考対応モデルは `/think low|medium|high|max` を公開する。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` にマップされる。
  - OpenAI GPT モデルは、モデル固有の Responses API effort サポートを通じて `/think` をマップする。`/think off` は、対象モデルがサポートする場合にのみ `reasoning.effort: "none"` を送信する。それ以外の場合、OpenClaw はサポートされない値を送信する代わりに、無効化された推論ペイロードを省略する。
  - カスタム OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` を有効化できる。これは送信 OpenAI 推論 effort ペイロードをマップするものと同じ互換メタデータを使用するため、メニュー、セッション検証、エージェント CLI、`llm-task` がトランスポート動作と一致する。
  - 古い設定済み OpenRouter Hunter Alpha 参照は、廃止されたそのルートが推論フィールド経由で最終回答テキストを返す可能性があるため、プロキシ推論注入をスキップする。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有の動的思考にマップする。Gemini 3 リクエストは固定 `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信する。固定レベルは引き続き、そのモデルファミリーで最も近い Gemini `thinkingLevel` または予算にマップされる。
  - Anthropic 互換ストリーミングパス上の MiniMax (`minimax/*`) は、モデルパラメーターまたはリクエストパラメーターで思考を明示的に設定しない限り、デフォルトで `thinking: { type: "disabled" }` になる。これにより、MiniMax の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れるのを避ける。
  - Z.AI (`zai/*`) はバイナリ思考 (`on`/`off`) のみをサポートする。非 `off` レベルはすべて `on` として扱われる (`low` にマップされる)。
  - Moonshot (`moonshot/*`) は `/think off` を `thinking: { type: "disabled" }` にマップし、非 `off` レベルをすべて `thinking: { type: "enabled" }` にマップする。思考が有効な場合、Moonshot は `tool_choice` `auto|none` のみを受け付ける。OpenClaw は互換性のない値を `auto` に正規化する。

## 解決順序

1. メッセージ上のインラインディレクティブ (そのメッセージにのみ適用)。
2. セッションオーバーライド (ディレクティブのみのメッセージ送信で設定)。
3. エージェントごとのデフォルト (config 内の `agents.list[].thinkingDefault`)。
4. グローバルデフォルト (config 内の `agents.defaults.thinkingDefault`)。
5. フォールバック: 利用可能な場合はプロバイダー宣言デフォルト。それ以外の場合、推論対応モデルは `medium` またはそのモデルでサポートされる最も近い非 `off` レベルに解決され、非推論モデルは `off` のままになる。

## セッションデフォルトの設定

- ディレクティブ**のみ**のメッセージ (空白は許可) を送信する。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定される (デフォルトでは送信者ごと)。`/think:off` またはセッションのアイドルリセットでクリアされる。
- 確認返信が送信される (`Thinking level set to high.` / `Thinking disabled.`)。レベルが無効な場合 (例: `/thinking big`)、コマンドはヒント付きで拒否され、セッション状態は変更されない。
- 現在の思考レベルを確認するには、引数なしで `/think` (または `/think:`) を送信する。

## エージェント別の適用

- **組み込み Pi**: 解決されたレベルはインプロセス Pi エージェントランタイムに渡される。
- **Claude CLI バックエンド**: `claude-cli` を使用する場合、非 off レベルは `--effort` として Claude Code に渡される。[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照。

## 高速モード (/fast)

- レベル: `on|off`。
- ディレクティブのみのメッセージは、セッションの高速モードオーバーライドを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信する。
- 現在の有効な高速モード状態を確認するには、モードなしで `/fast` (または `/fast status`) を送信する。
- OpenClaw は高速モードを次の順序で解決する:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッションオーバーライド
  3. エージェントごとのデフォルト (`agents.list[].fastModeDefault`)
  4. モデルごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` の場合、高速モードは、サポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI 優先処理にマップされる。
- `openai-codex/*` の場合、高速モードは Codex Responses に同じ `service_tier=priority` フラグを送信する。OpenClaw は両方の認証パスで共有の `/fast` トグルを 1 つ維持する。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む、直接の公開 `anthropic/*` リクエストでは、高速モードは Anthropic サービス階層にマップされる。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定する。
- Anthropic 互換パス上の `minimax/*` では、`/fast on` (または `params.fastMode: true`) が `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換える。
- 明示的な Anthropic `serviceTier` / `service_tier` モデルパラメーターは、両方が設定されている場合、高速モードデフォルトをオーバーライドする。OpenClaw は引き続き、非 Anthropic プロキシベース URL では Anthropic サービス階層注入をスキップする。
- `/status` は、高速モードが有効な場合にのみ `Fast` を表示する。

## Verbose ディレクティブ (/verbose または /v)

- レベル: `on` (最小) | `full` | `off` (デフォルト)。
- ディレクティブのみのメッセージはセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信する。無効なレベルは、状態を変更せずにヒントを返す。
- `/verbose off` は明示的なセッションオーバーライドを保存する。Sessions UI で `inherit` を選択してクリアする。
- インラインディレクティブはそのメッセージにのみ影響する。それ以外の場合はセッション/グローバルデフォルトが適用される。
- 現在の verbose レベルを確認するには、引数なしで `/verbose` (または `/verbose:`) を送信する。
- verbose が on の場合、構造化ツール結果を出力するエージェント (Pi、その他の JSON エージェント) は、各ツール呼び出しを、それぞれ独立したメタデータのみのメッセージとして送り返す。利用可能な場合は `<emoji> <tool-name>: <arg>` が先頭に付く。これらのツール要約は、各ツールが開始されるとすぐに送信され (別々の吹き出し)、ストリーミングデルタとしては送信されない。
- ツール失敗の要約は通常モードでも表示されたままだが、raw エラー詳細サフィックスは verbose が `on` または `full` でない限り非表示になる。
- verbose が `full` の場合、ツール出力も完了後に転送される (別の吹き出し、安全な長さに切り詰め)。実行中に `/verbose on|full|off` を切り替えると、以後のツール吹き出しは新しい設定に従う。
- `agents.defaults.toolProgressDetail` は、`/verbose` ツール要約と進行中ドラフトのツール行の形式を制御する。`🛠️ Exec: checking JS syntax` のようなコンパクトな人間向けラベルには `"explain"` (デフォルト) を使用する。デバッグ用に raw コマンド/詳細も追加したい場合は `"raw"` を使用する。エージェントごとの `agents.list[].toolProgressDetail` はデフォルトをオーバーライドする。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ (/trace)

- レベル: `on` | `off` (デフォルト)。
- ディレクティブのみのメッセージはセッション Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信する。
- インラインディレクティブはそのメッセージにのみ影響する。それ以外の場合はセッション/グローバルデフォルトが適用される。
- 現在のトレースレベルを確認するには、引数なしで `/trace` (または `/trace:`) を送信する。
- `/trace` は `/verbose` より範囲が狭い。Active Memory デバッグ要約など、Plugin 所有のトレース/デバッグ行のみを公開する。
- トレース行は `/status` に表示される場合があり、通常のアシスタント返信後のフォローアップ診断メッセージとして表示される場合もある。

## 推論の可視性 (/reasoning)

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、返信で思考ブロックを表示するかどうかを切り替える。
- 有効な場合、推論は `Reasoning:` を先頭に付けた**別メッセージ**として送信される。
- `stream` (Telegram のみ): 返信生成中に推論を Telegram のドラフト吹き出しへストリーミングし、その後、推論なしで最終回答を送信する。
- エイリアス: `/reason`。
- 現在の推論レベルを確認するには、引数なしで `/reasoning` (または `/reasoning:`) を送信する。
- 解決順序: インラインディレクティブ、次にセッションオーバーライド、次にエージェントごとのデフォルト (`agents.list[].reasoningDefault`)、次にフォールバック (`off`)。

不正な local-model 推論タグは保守的に処理される。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままで、すでに表示可能なテキストの後にある閉じられていない推論も非表示になる。返信全体が単一の閉じられていない開始タグでラップされており、そのままだと空テキストとして配信される場合、OpenClaw は不正な開始タグを削除し、残りのテキストを配信する。

## 関連

- 昇格モードのドキュメントは[昇格モード](/ja-JP/tools/elevated)にある。

## Heartbeats

- Heartbeat プローブ本文は設定済みの Heartbeat プロンプト (デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`)。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用される (ただし Heartbeat からセッションデフォルトを変更することは避ける)。
- Heartbeat 配信はデフォルトで最終ペイロードのみ。別の `Reasoning:` メッセージも送信するには (利用可能な場合)、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定する。

## Web チャット UI

- Web チャットの思考セレクターは、ページ読み込み時に受信セッションストア/config からセッションの保存済みレベルを反映する。
- 別のレベルを選択すると、`sessions.patch` 経由ですぐにセッションオーバーライドを書き込む。次回送信を待たず、一度限りの `thinkingOnce` オーバーライドでもない。
- 最初のオプションは常に `Default (<resolved level>)` で、解決済みデフォルトは、アクティブセッションモデルのプロバイダー思考プロファイルと、`/status` および `session_status` が使用するものと同じフォールバックロジックから得られる。
- ピッカーは Gateway セッション行/デフォルトが返す `thinkingLevels` を使用し、`thinkingOptions` はレガシーラベルリストとして保持される。ブラウザー UI は独自のプロバイダー正規表現リストを保持しない。Plugin がモデル固有のレベルセットを所有する。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままになる。

## プロバイダープロファイル

- プロバイダーPluginは、モデルがサポートするレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- Claude モデルをプロキシするプロバイダーPluginは、直接の Anthropic とプロキシのカタログが揃った状態を保つために、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることができます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- 明示的な thinking オーバーライドを検証する必要があるツールPluginは、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルレベルリストを保持するべきではありません。
- 設定済みのカスタムモデルメタデータにアクセスできるツールPluginは、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインをPlugin側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP/チャットクライアントはランタイム検証で使用されるものと同じプロファイル ID とラベルを表示します。

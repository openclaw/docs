---
read_when:
    - thinking、fast-mode、または verbose directive の解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性のための directive 構文
title: Thinking レベル
x-i18n:
    generated_at: "2026-04-21T04:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c41d7bd19bf1dc25ba9e6bc2d706a2963e8466eeaa1c62fd01ac782ad1fc99f0
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking レベル（`/think` directive）

## 何をするか

- 任意の受信本文でインライン directive として使用できます: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（alias）: `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大予算）
  - xhigh → 「ultrathink+」（GPT-5.2 + Codex model と Anthropic Claude Opus 4.7 effort）
  - adaptive → provider 管理の adaptive thinking（Anthropic Claude 4.6 および Opus 4.7 でサポート）
  - `x-high`, `x_high`, `extra-high`, `extra high`, `extra_high` は `xhigh` にマップされます。
  - `highest`, `max` は `high` にマップされます。
- provider に関する注記:
  - Anthropic Claude 4.6 model は、明示的な thinking level が設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking をデフォルトにしません。API effort のデフォルトは、thinking level を明示設定しない限り provider 側に委ねられます。
  - Anthropic Claude Opus 4.7 は `/think xhigh` を adaptive thinking + `output_config.effort: "xhigh"` にマップします。これは `/think` が thinking directive であり、`xhigh` が Opus 4.7 の effort 設定だからです。
  - OpenAI GPT model は、model 固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、対象 model がそれをサポートする場合にのみ `reasoning.effort: "none"` を送信します。そうでなければ、OpenClaw は未サポート値を送らず、無効化された reasoning payload を省略します。
  - Anthropic 互換ストリーミングパス上の MiniMax（`minimax/*`）は、model params または request params で thinking を明示設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これは、MiniMax の非ネイティブな Anthropic stream 形式から `reasoning_content` delta が漏れるのを防ぐためです。
  - Z.AI（`zai/*`）は二値の thinking（`on`/`off`）のみサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に、`off` 以外のレベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` に `auto|none` しか受け付けないため、OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインライン directive（そのメッセージにのみ適用）。
2. セッション上書き（directive のみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（config の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config の `agents.defaults.thinkingDefault`）。
5. フォールバック: Anthropic Claude 4.6 model では `adaptive`、Anthropic Claude Opus 4.7 では明示設定がない限り `off`、その他の reasoning 対応 model では `low`、それ以外では `off`。

## セッションデフォルトの設定

- **directive のみ** のメッセージを送信します（空白は可）。例: `/think:medium` または `/t high`。
- その設定は現在のセッションに固定されます（デフォルトでは送信者単位）。`/think:off` またはセッションのアイドルリセットで解除されます。
- 確認返信が送られます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 現在の thinking level を見るには、引数なしで `/think`（または `/think:`）を送信します。

## エージェントごとの適用

- **Embedded Pi**: 解決されたレベルは、インプロセスの Pi agent runtime に渡されます。

## 高速モード（`/fast`）

- レベル: `on|off`。
- directive のみのメッセージでセッションの fast-mode 上書きを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- 現在有効な fast-mode 状態を見るには、モードなしで `/fast`（または `/fast status`）を送信します。
- OpenClaw は fast mode を次の順で解決します:
  1. インライン／directive のみの `/fast on|off`
  2. セッション上書き
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. model ごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode はサポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI の優先処理にマップされます。
- `openai-codex/*` では、fast mode は Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証パスに対して共有の `/fast` 切り替えを維持します。
- `api.anthropic.com` に送られる OAuth 認証トラフィックを含む、直接の公開 `anthropic/*` リクエストでは、fast mode は Anthropic の service tier にマップされます: `/fast on` は `service_tier=auto`、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）により `MiniMax-M2.7` が `MiniMax-M2.7-highspeed` に書き換えられます。
- Anthropic の明示的な `serviceTier` / `service_tier` model params は、両方が設定されている場合に fast-mode デフォルトを上書きします。OpenClaw は、Anthropic 以外の proxy base URL に対しては、引き続き Anthropic service-tier 注入をスキップします。

## Verbose directive（`/verbose` または `/v`）

- レベル: `on`（minimal）| `full` | `off`（デフォルト）。
- directive のみのメッセージでセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルでは状態を変えずにヒントを返します。
- `/verbose off` は明示的なセッション上書きを保存します。Sessions UI で `inherit` を選ぶと解除できます。
- インライン directive はそのメッセージにのみ影響します。それ以外ではセッション／グローバルデフォルトが適用されます。
- 現在の verbose level を見るには、引数なしで `/verbose`（または `/verbose:`）を送信します。
- verbose が on のとき、構造化されたツール結果を出力する agent（Pi、その他の JSON agent）は、各ツール呼び出しをそれぞれ独立したメタデータ専用メッセージとして返します。利用可能であれば `<emoji> <tool-name>: <arg>`（path/command）の形式で先頭に付きます。これらのツール要約は、各ツール開始時にすぐ送信されます（独立したバブルであり、streaming delta ではありません）。
- ツール失敗要約は通常モードでも表示されたままですが、生の error 詳細サフィックスは verbose が `on` または `full` の場合にのみ表示されます。
- verbose が `full` のときは、ツール出力も完了後に転送されます（独立したバブルで、安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えた場合、その後のツールバブルは新しい設定に従います。

## Plugin trace directive（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- directive のみのメッセージでセッション plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インライン directive はそのメッセージにのみ影響します。それ以外ではセッション／グローバルデフォルトが適用されます。
- 現在の trace level を見るには、引数なしで `/trace`（または `/trace:`）を送信します。
- `/trace` は `/verbose` よりも狭い機能です。Active Memory の debug 要約のような、Plugin 所有の trace/debug 行だけを公開します。
- trace 行は `/status` 内や、通常の assistant 返信後の follow-up 診断メッセージとして表示されることがあります。

## 推論の可視性（`/reasoning`）

- レベル: `on|off|stream`。
- directive のみのメッセージで、返信内に thinking block を表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` で始まる **別メッセージ** として送信されます。
- `stream`（Telegram のみ）: 返信生成中、推論を Telegram の下書きバブルにストリームし、最終回答は推論なしで送信します。
- alias: `/reason`。
- 現在の reasoning level を見るには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インライン directive、次にセッション上書き、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat probe body は、設定された heartbeat prompt です（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインライン directive は通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更するのは避けてください）。
- Heartbeat 配信は、デフォルトでは最終 payload のみを送信します。別メッセージの `Reasoning:` も送信したい場合は、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chat の thinking セレクタは、ページ読み込み時に受信 session store/config から、そのセッションに保存されているレベルを反映します。
- 別のレベルを選ぶと、`sessions.patch` を通じて即座にセッション上書きが書き込まれます。次の送信まで待たず、単発の `thinkingOnce` 上書きでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` であり、その解決済みデフォルトはアクティブな session model から決まります。Anthropic 上の Claude 4.6 では `adaptive`、Anthropic Claude Opus 4.7 では設定がない限り `off`、その他の reasoning 対応 model では `low`、それ以外では `off` です。
- picker は provider を認識したまま動作します:
  - ほとんどの provider では `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 では `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI では二値の `off | on`
- `/think:<level>` も引き続き動作し、同じ保存済みセッションレベルを更新するため、チャット directive と picker は同期されたままです。

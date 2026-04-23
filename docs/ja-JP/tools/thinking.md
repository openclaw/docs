---
read_when:
    - thinking、fast-mode、または verbose ディレクティブの解析やデフォルトを調整する
summary: '`/think`、`/fast`、`/verbose`、`/trace`、および推論の可視性のためのディレクティブ構文'
title: Thinking レベル
x-i18n:
    generated_at: "2026-04-23T14:10:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4efe899f7b47244745a105583b3239effa7975fadd06bd7bcad6327afcc91207
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking レベル（`/think` ディレクティブ）

## これが行うこと

- 任意の受信本文にインラインディレクティブとして指定できます: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（alias）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大 budget）
  - xhigh → 「ultrathink+」（GPT-5.2 + Codex model と Anthropic Claude Opus 4.7 effort）
  - adaptive → provider 管理の adaptive thinking（Anthropic/Bedrock 上の Claude 4.6 と Anthropic Claude Opus 4.7 でサポート）
  - max → provider 最大 reasoning（現在は Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` に対応します。
  - `highest` は `high` に対応します。
- provider に関する注記:
  - Thinking メニューと picker は provider profile 駆動です。provider Plugin が、`on` のような binary ラベルを含め、選択中 model の正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それをサポートする provider/model profile に対してのみ提示されます。サポートされていないレベルの typed directive は、その model で有効な選択肢とともに拒否されます。
  - 保存済みのサポートされない既存レベルは、provider profile の順位で再マップされます。`adaptive` は non-adaptive model では `medium` にフォールバックし、`xhigh` と `max` は選択中 model でサポートされる最大の non-off レベルにフォールバックします。
  - Anthropic Claude 4.6 model は、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking をデフォルトにしません。その API effort のデフォルトは、thinking レベルを明示設定しない限り provider 側で管理されます。
  - Anthropic Claude Opus 4.7 では `/think xhigh` は adaptive thinking と `output_config.effort: "xhigh"` に対応します。これは `/think` が thinking ディレクティブで、`xhigh` が Opus 4.7 の effort 設定だからです。
  - Anthropic Claude Opus 4.7 では `/think max` も公開されており、同じ provider 管理の max effort 経路に対応します。
  - OpenAI GPT model は、model 固有の Responses API effort サポートを通じて `/think` をマップします。`/think off` は、対象 model がそれをサポートする場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw はサポートされない値を送る代わりに、無効化された reasoning payload を省略します。
  - Anthropic 互換ストリーミング経路の MiniMax（`minimax/*`）は、model params または request params で明示的に thinking を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これは、MiniMax の非ネイティブな Anthropic stream 形式から `reasoning_content` delta が漏れるのを防ぐためです。
  - Z.AI（`zai/*`）は binary thinking（`on`/`off`）のみをサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` に対応）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に、`off` 以外のすべてのレベルを `thinking: { type: "enabled" }` に対応させます。thinking が有効な場合、Moonshot は `tool_choice` として `auto|none` だけを受け付けるため、OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッション override（ディレクティブのみのメッセージを送ることで設定）。
3. agent ごとのデフォルト（config の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能なら provider 宣言のデフォルト。そうでなければ、reasoning 対応 model は `medium` またはその model でサポートされる最も近い non-`off` レベルに解決され、non-reasoning model は `off` のままです。

## セッションデフォルトを設定する

- **ディレクティブだけ**のメッセージを送信します（空白は可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッションの idle reset で解除されます。
- 確認返信が送られます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、ヒント付きでコマンドは拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送ると、現在の thinking レベルを確認できます。

## agent への適用

- **Embedded Pi**: 解決されたレベルは、プロセス内 Pi agent ランタイムに渡されます。

## Fast mode（`/fast`）

- レベル: `on|off`。
- ディレクティブのみのメッセージでセッション fast-mode override を切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モードなしで `/fast`（または `/fast status`）を送ると、現在有効な fast-mode 状態を確認できます。
- OpenClaw は fast mode を次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッション override
  3. agent ごとのデフォルト（`agents.list[].fastModeDefault`）
  4. model ごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode は対応する Responses request に `service_tier=priority` を送ることで OpenAI priority processing に対応します。
- `openai-codex/*` では、fast mode は Codex Responses でも同じ `service_tier=priority` フラグを送ります。OpenClaw は両 auth 経路で 1 つの共有 `/fast` toggle を維持します。
- `api.anthropic.com` に送られる OAuth 認証トラフィックを含む直接の public `anthropic/*` request では、fast mode は Anthropic service tier に対応します: `/fast on` は `service_tier=auto`、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換経路の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` model params は、両方が設定されている場合に fast-mode デフォルトより優先されます。OpenClaw は依然として、Anthropic ではない proxy base URL への Anthropic service-tier 注入をスキップします。
- `/status` は fast mode が有効な場合にのみ `Fast` を表示します。

## Verbose ディレクティブ（`/verbose` または `/v`）

- レベル: `on`（minimal）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルでは状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッション override を保存します。Sessions UI で `inherit` を選ぶと解除できます。
- インラインディレクティブはそのメッセージにのみ適用されます。それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送ると、現在の verbose レベルを確認できます。
- verbose が有効な場合、構造化された tool result を出す agent（Pi、その他の JSON agent）は、各 tool call をそれぞれ別のメタデータ専用メッセージとして返し、利用可能であれば `<emoji> <tool-name>: <arg>`（path/command）を前置します。これらの tool summary は、各 tool の開始時点で送信されます（別バブルであり、streaming delta ではありません）。
- tool failure の summary は通常モードでも表示されたままですが、生の error 詳細 suffix は verbose が `on` または `full` の場合を除いて非表示です。
- verbose が `full` の場合、完了後に tool output も転送されます（別バブル、かつ安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えると、その後の tool bubble は新しい設定に従います。

## Plugin trace ディレクティブ（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッション Plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ適用されます。それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送ると、現在の trace レベルを確認できます。
- `/trace` は `/verbose` より狭く、Active Memory の debug summary のような Plugin 所有の trace/debug 行だけを公開します。
- trace 行は `/status` に表示されたり、通常の assistant 返信後の追跡診断メッセージとして表示されたりします。

## 推論の可視性（`/reasoning`）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージで、返信内に thinking block を表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` を前置した**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信生成中に reasoning を Telegram の draft bubble に stream し、最終回答は reasoning なしで送信します。
- alias: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送ると、現在の reasoning レベルを確認できます。
- 解決順序: インラインディレクティブ、セッション override、agent ごとのデフォルト（`agents.list[].reasoningDefault`）、フォールバック（`off`）。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat probe 本文は、設定された heartbeat prompt です（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更するのは避けてください）。
- Heartbeat 配信はデフォルトで最終 payload のみです。別の `Reasoning:` メッセージも送信したい場合（利用可能な場合）は、`agents.defaults.heartbeat.includeReasoning: true` または agent ごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chat の thinking selector は、ページ読み込み時に inbound session store/config に保存されたそのセッションのレベルを反映します。
- 別のレベルを選ぶと、`sessions.patch` によりセッション override が即座に書き込まれます。次の送信を待たず、単発の `thinkingOnce` override でもありません。
- 最初の選択肢は常に `Default (<resolved level>)` で、解決済みデフォルトは、アクティブな session model の provider thinking profile と、`/status` および `session_status` が使うのと同じフォールバックロジックから来ます。
- picker は gateway session row が返す `thinkingOptions` を使用します。browser UI は独自の provider regex リストを持ちません。model 固有のレベルセットは Plugin が所有します。
- `/think:<level>` も引き続き機能し、同じ保存済みセッションレベルを更新するため、chat ディレクティブと picker は同期されたままです。

## Provider profile

- provider Plugin は、model のサポートレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- 各 profile レベルには保存用の正規 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用 `label` を含めることもできます。binary provider は `{ id: "low", label: "on" }` を使用します。
- 公開済みの旧 hook（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換 adapter として残りますが、新しいカスタムレベルセットには `resolveThinkingProfile` を使用してください。
- Gateway row は `thinkingOptions` と `thinkingDefault` を公開するため、ACP/chat client はランタイム検証が使うのと同じ profile をレンダリングできます。

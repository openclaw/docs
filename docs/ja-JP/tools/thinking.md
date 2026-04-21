---
read_when:
    - 思考、fast モード、または verbose ディレクティブの解析やデフォルトの調整
summary: '`/think`、`/fast`、`/verbose`、`/trace`、および reasoning 表示のディレクティブ構文'
title: 思考レベル
x-i18n:
    generated_at: "2026-04-21T13:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# 思考レベル（`/think` ディレクティブ）

## できること

- 任意の受信本文内でのインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大予算）
  - xhigh → 「ultrathink+」（GPT-5.2 + Codex モデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → プロバイダー管理の adaptive thinking（Anthropic/Bedrock 上の Claude 4.6 と Anthropic Claude Opus 4.7 でサポート）
  - max → プロバイダー最大 reasoning（現在は Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダー注記:
  - Thinking メニューと picker はプロバイダープロファイル駆動です。Provider Plugin は、binary の `on` のようなラベルを含め、選択モデルに対する正確なレベル集合を宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルに対してのみ表示されます。未サポートのレベルに対する typed directive は、そのモデルで有効な選択肢とともに拒否されます。
  - モデル切り替え後の古い `max` 値を含む、既存の保存済み未サポートレベルは、選択モデルでサポートされる最大レベルへ再マップされます。
  - Anthropic Claude 4.6 モデルでは、明示的な thinking level が設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 は adaptive thinking をデフォルトにしません。その API effort のデフォルトは、thinking level を明示的に設定しない限りプロバイダー側管理のままです。
  - Anthropic Claude Opus 4.7 では `/think xhigh` は adaptive thinking と `output_config.effort: "xhigh"` にマップされます。これは `/think` が thinking directive であり、`xhigh` が Opus 4.7 の effort 設定だからです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開しており、同じプロバイダー管理の max effort 経路にマップされます。
  - OpenAI GPT モデルでは、`/think` はモデル固有の Responses API effort サポートを通じてマップされます。`/think off` は、対象モデルがそれをサポートする場合にのみ `reasoning.effort: "none"` を送信します。そうでない場合、OpenClaw は未サポート値を送る代わりに、無効化された reasoning ペイロードを省略します。
  - Anthropic 互換ストリーミング経路上の MiniMax（`minimax/*`）は、モデル params または request params で thinking を明示的に設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これは、MiniMax の非ネイティブな Anthropic ストリーム形式から `reasoning_content` delta が漏れるのを防ぐためです。
  - Z.AI（`zai/*`）は binary thinking（`on`/`off`）のみをサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に、`off` 以外の任意のレベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` として `auto|none` しか受け付けないため、OpenClaw は非互換の値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッション上書き（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能な場合はプロバイダー宣言デフォルト、それ以外で reasoning 対応とマークされた catalog モデルは `low`、その他は `off`。

## セッションデフォルトの設定

- **ディレクティブだけ**のメッセージを送信します（空白は許容）。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッション idle reset でクリアされます。
- 確認返信が送られます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送ると、現在の thinking level を確認できます。

## エージェントへの適用

- **Embedded Pi**: 解決されたレベルは、プロセス内 Pi agent ランタイムに渡されます。

## fast モード（`/fast`）

- レベル: `on|off`。
- ディレクティブのみのメッセージはセッション fast-mode 上書きを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モードなしで `/fast`（または `/fast status`）を送ると、現在有効な fast-mode 状態を確認できます。
- OpenClaw は fast モードを次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッション上書き
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast モードはサポートされる Responses リクエストで `service_tier=priority` を送信することで OpenAI の優先処理にマップされます。
- `openai-codex/*` では、fast モードは同じ `service_tier=priority` フラグを Codex Responses に送信します。OpenClaw は両認証経路で 1 つの共通 `/fast` トグルを維持します。
- `api.anthropic.com` に送られる OAuth 認証トラフィックを含む、直接の公開 `anthropic/*` リクエストでは、fast モードは Anthropic service tier にマップされます。`/fast on` は `service_tier=auto` を、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換経路上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` model params は、両方が設定されている場合、fast-mode デフォルトより優先されます。OpenClaw は引き続き、Anthropic 以外の proxy base URL では Anthropic service-tier 注入をスキップします。

## verbose ディレクティブ（`/verbose` または `/v`）

- レベル: `on`（最小）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変えずにヒントを返します。
- `/verbose off` は明示的なセッション上書きを保存します。Sessions UI で `inherit` を選んでクリアしてください。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送ると、現在の verbose レベルを確認できます。
- verbose が on のとき、構造化ツール結果を出力するエージェント（Pi、その他 JSON agent）は、各ツール呼び出しを、それぞれ独立したメタデータのみのメッセージとして返します。利用可能な場合は `<emoji> <tool-name>: <arg>`（path/command）で始まります。これらのツール要約は、各ツール開始時に送られます（別バブル）。streaming delta ではありません。
- ツール失敗要約は通常モードでも表示されたままですが、生のエラー詳細サフィックスは verbose が `on` または `full` の場合にのみ表示されます。
- verbose が `full` のとき、ツール出力も完了後に転送されます（別バブル、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えると、それ以降のツールバブルは新しい設定に従います。

## Plugin trace ディレクティブ（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送ると、現在の trace レベルを確認できます。
- `/trace` は `/verbose` より狭い範囲です。Active Memory のデバッグ要約のような、Plugin 所有の trace/debug 行だけを公開します。
- Trace 行は `/status` に現れることがあり、通常の assistant 返信後のフォローアップ診断メッセージとしても現れます。

## reasoning 表示（`/reasoning`）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、返信で thinking block を表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` で始まる**別メッセージ**として送られます。
- `stream`（Telegram のみ）: 返信生成中、Telegram の draft バブルに reasoning をストリーミングし、その後 reasoning なしの最終回答を送信します。
- エイリアス: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送ると、現在の reasoning レベルを確認できます。
- 解決順序: インラインディレクティブ、次にセッション上書き、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

## 関連

- Elevated モードのドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat probe 本文は、設定済みの heartbeat prompt です（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更しないでください）。
- Heartbeat 配信はデフォルトで最終ペイロードのみです。別の `Reasoning:` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web チャット UI

- Web チャットの thinking selector は、ページ読み込み時に、受信セッションストア/設定に保存されたそのセッションのレベルを反映します。
- 別レベルを選ぶと、`sessions.patch` により即座にセッション上書きが書き込まれます。次の送信は待ちませんし、単発の `thinkingOnce` 上書きでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` で、この解決済みデフォルトはアクティブセッションモデルの provider thinking profile から来ます。
- picker は gateway session row が返す `thinkingOptions` を使います。ブラウザ UI 自身は独自の provider regex list を保持しません。モデル固有レベル集合は Plugin が所有します。
- `/think:<level>` も引き続き動作し、同じ保存済みセッションレベルを更新するため、チャットディレクティブと picker は同期を保ちます。

## プロバイダープロファイル

- Provider Plugin は、モデルのサポートレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- 各プロファイルレベルは保存用の正規 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）を持ち、表示用 `label` を含めることもできます。binary provider は `{ id: "low", label: "on" }` を使います。
- 公開済みの旧式フック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換アダプターとして残りますが、新しいカスタムレベル集合では `resolveThinkingProfile` を使うべきです。
- Gateway row は `thinkingOptions` と `thinkingDefault` を公開するため、ACP/チャットクライアントはランタイム検証と同じプロファイルを描画できます。

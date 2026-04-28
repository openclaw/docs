---
read_when:
    - thinking、fast モード、または verbose ディレクティブの解析やデフォルトを調整する場合
summary: '`/think`、`/fast`、`/verbose`、`/trace` のディレクティブ構文と推論表示設定'
title: Thinking レベル
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T14:01:54Z"
  model: gpt-5.4
  provider: openai
  source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
  source_path: tools/thinking.md
  workflow: 15
---

## 動作内容

- 任意の受信本文内で使えるインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大 budget）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → Provider 管理の adaptive thinking（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7、Google Gemini の dynamic thinking でサポート）
  - max → Provider の最大推論（現在は Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマッピングされます。
  - `highest` は `high` にマッピングされます。
- Provider 注記:
  - thinking のメニューとピッカーは Provider プロファイル駆動です。Provider プラグインは、バイナリの `on` のようなラベルを含め、選択されたモデルに対する正確なレベル集合を宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートする Provider/モデルプロファイルに対してのみ提示されます。未対応レベルの typed directive は、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済み未対応レベルは、Provider プロファイルの順位により再マッピングされます。`adaptive` は非 adaptive モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択モデルでサポートされる最大の non-off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルでは、明示的な thinking レベルが設定されていない場合、デフォルトは `adaptive` です。
  - Anthropic Claude Opus 4.7 では、adaptive thinking はデフォルトではありません。その API effort デフォルトは、明示的に thinking レベルを設定しない限り、引き続き Provider 側で管理されます。
  - Anthropic Claude Opus 4.7 では、`/think xhigh` は adaptive thinking + `output_config.effort: "xhigh"` にマッピングされます。`/think` は thinking ディレクティブであり、`xhigh` は Opus 4.7 の effort 設定だからです。
  - Anthropic Claude Opus 4.7 では `/think max` も公開されており、同じ Provider 管理の最大 effort 経路にマッピングされます。
  - OpenAI GPT モデルでは、`/think` はモデルごとの Responses API effort サポートを通じてマッピングされます。`/think off` は、対象モデルが `reasoning.effort: "none"` をサポートする場合にのみそれを送信し、そうでない場合は未対応値を送る代わりに、OpenClaw は無効化された reasoning ペイロードを省略します。
  - Google Gemini では、`/think adaptive` は Gemini の Provider 管理 dynamic thinking にマッピングされます。Gemini 3 リクエストでは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストでは `thinkingBudget: -1` を送信します。固定レベルは、そのモデルファミリーで最も近い Gemini の `thinkingLevel` または budget に引き続きマッピングされます。
  - Anthropic 互換ストリーミング経路上の MiniMax（`minimax/*`）は、モデル params またはリクエスト params で明示的に thinking を設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMax の非ネイティブな Anthropic ストリーム形式から `reasoning_content` delta が漏れるのを防ぎます。
  - Z.AI（`zai/*`）はバイナリ thinking（`on`/`off`）のみサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマッピング）。
  - Moonshot（`moonshot/*`）は、`/think off` を `thinking: { type: "disabled" }` に、`off` 以外のレベルを `thinking: { type: "enabled" }` にマッピングします。thinking が有効なとき、Moonshot は `tool_choice` として `auto|none` しか受け付けないため、OpenClaw は非互換値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッション上書き（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（設定の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能なら Provider 宣言のデフォルト、そうでなければ reasoning 対応モデルは `medium` またはそのモデルで最も近いサポート済み non-off レベルに解決され、非 reasoning モデルは `off` のままです。

## セッションデフォルトの設定

- **ディレクティブだけ**のメッセージを送信します（空白は可）。例: `/think:medium` または `/t high`。
- これが現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッションの idle reset でクリアされます。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、ヒント付きでコマンドは拒否され、セッション状態は変更されません。
- 現在の thinking レベルを確認するには、引数なしで `/think`（または `/think:`）を送信します。

## エージェントごとの適用

- **埋め込み Pi**: 解決されたレベルが、プロセス内の Pi エージェントランタイムに渡されます。

## Fast mode（`/fast`）

- レベル: `on|off`。
- ディレクティブのみのメッセージは、セッションの fast-mode 上書きを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モードを指定せずに `/fast`（または `/fast status`）を送ると、現在有効な fast-mode 状態を確認できます。
- OpenClaw は fast mode を次の順序で解決します。
  1. インライン/ディレクティブのみの `/fast on|off`
  2. セッション上書き
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `openai/*` では、fast mode はサポートされる Responses リクエストで `service_tier=priority` を送ることで、OpenAI の priority processing にマッピングされます。
- `openai-codex/*` では、fast mode は Codex Responses に同じ `service_tier=priority` フラグを送信します。OpenClaw は両方の認証経路で 1 つの共有 `/fast` トグルを維持します。
- `api.anthropic.com` へ送られる OAuth 認証トラフィックを含む、直接の公開 `anthropic/*` リクエストでは、fast mode は Anthropic の service tiers にマッピングされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換経路上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデル params は、両方が設定されている場合、fast-mode デフォルトを上書きします。OpenClaw は引き続き、Anthropic 以外のプロキシ base URL では Anthropic service-tier 注入をスキップします。
- `/status` は fast mode が有効なときにのみ `Fast` を表示します。

## Verbose ディレクティブ（`/verbose` または `/v`）

- レベル: `on`（最小）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変更せずヒントを返します。
- `/verbose off` は明示的なセッション上書きを保存します。Sessions UI で `inherit` を選ぶとクリアできます。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在の verbose レベルを確認するには、引数なしで `/verbose`（または `/verbose:`）を送信します。
- verbose が有効な場合、構造化ツール結果を出すエージェント（Pi、その他の JSON エージェント）は、各ツール呼び出しをそれぞれ独立したメタデータ専用メッセージとして返します。利用可能な場合は `<emoji> <tool-name>: <arg>`（path/command）の接頭辞が付きます。これらのツールサマリーは、各ツール開始時にすぐ送信されます（別バブルであり、ストリーミング delta ではありません）。
- ツール失敗サマリーは通常モードでも表示されたままですが、生のエラー詳細サフィックスは verbose が `on` または `full` のとき以外は非表示になります。
- verbose が `full` の場合、ツール出力も完了後に転送されます（別バブル、安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えると、その後のツールバブルは新しい設定に従います。

## Plugin trace ディレクティブ（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッションの plugin trace 出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外ではセッション/グローバルデフォルトが適用されます。
- 現在の trace レベルを確認するには、引数なしで `/trace`（または `/trace:`）を送信します。
- `/trace` は `/verbose` より狭く、Active Memory のデバッグサマリーのような、プラグイン所有の trace/debug 行のみを公開します。
- trace 行は `/status` や、通常の assistant 返信の後に続く診断メッセージとして表示されることがあります。

## 推論表示設定（`/reasoning`）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、返信内で thinking ブロックを表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Reasoning:` を接頭辞とする**別メッセージ**として送信されます。
- `stream`（Telegram のみ）: 返信生成中、Telegram の draft バブルに reasoning をストリームし、その後 reasoning なしの最終回答を送信します。
- エイリアス: `/reason`。
- 現在の reasoning レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インラインディレクティブ、次にセッション上書き、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、最後にフォールバック（`off`）。

## 関連

- Elevated mode のドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeats

- Heartbeat probe 本文は、設定済みの heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、heartbeat からセッションデフォルトを変更するのは避けてください）。
- Heartbeat 配信はデフォルトで最終ペイロードのみです。利用可能な場合に別の `Reasoning:` メッセージも送信するには、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chat の thinking セレクターは、ページ読み込み時に、受信セッションストア/設定からそのセッションの保存済みレベルを反映します。
- 別のレベルを選ぶと、`sessions.patch` により即座にセッション上書きを書き込みます。次の送信までは待たず、1 回限りの `thinkingOnce` 上書きでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` で、ここでの解決済みデフォルトは、アクティブセッションモデルの Provider thinking プロファイルと、`/status` および `session_status` が使うのと同じフォールバックロジックから得られます。
- ピッカーは Gateway のセッション行/デフォルトが返す `thinkingLevels` を使い、`thinkingOptions` はレガシーのラベル一覧として維持されます。ブラウザー UI は独自の Provider regex 一覧を保持しません。モデル固有のレベル集合はプラグインが管理します。
- `/think:<level>` も引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期されたままです。

## Provider プロファイル

- Provider プラグインは `resolveThinkingProfile(ctx)` を公開して、モデルのサポートレベルとデフォルトを定義できます。
- 各プロファイルレベルには保存用の正規 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max`）があり、表示用 `label` を含めることもできます。バイナリ Provider は `{ id: "low", label: "on" }` を使います。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換アダプターとして残りますが、新しいカスタムレベル集合では `resolveThinkingProfile` を使うべきです。
- Gateway の行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP/chat クライアントは、ランタイム検証が使用するのと同じプロファイル ID とラベルを描画できます。

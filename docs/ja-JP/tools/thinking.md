---
read_when:
    - thinking、fast-mode、またはverbose directiveの解析やデフォルトを調整する
summary: '`/think`、`/fast`、`/verbose`、`/trace`、およびreasoning可視性のためのdirective構文'
title: Thinking levels
x-i18n:
    generated_at: "2026-04-24T05:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## できること

- 任意の受信本文内でのインラインdirective: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（alias）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → 「think」
  - low → 「think hard」
  - medium → 「think harder」
  - high → 「ultrathink」（最大budget）
  - xhigh → 「ultrathink+」（GPT-5.2+ と Codexモデル、および Anthropic Claude Opus 4.7 effort）
  - adaptive → provider管理のadaptive thinking（Anthropic/Bedrock上のClaude 4.6 と Anthropic Claude Opus 4.7 でサポート）
  - max → providerの最大reasoning（現在は Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- providerに関する注記:
  - Thinkingメニューとpickerはprovider-profile駆動です。provider Pluginが、binaryの `on` のようなラベルを含め、選択されたモデルに対する正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするprovider/model profileに対してのみ提示されます。未サポートのレベルをtyped directiveで指定すると、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済み未サポートレベルは、provider profileのrankで再マップされます。`adaptive` はnon-adaptiveモデルでは `medium` にfallbackし、`xhigh` と `max` は選択モデルでサポートされる最大のnon-offレベルにfallbackします。
  - Anthropic Claude 4.6モデルは、明示的なthinking levelが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.7 はadaptive thinkingをデフォルトにしません。thinking levelを明示設定しない限り、そのAPI effortデフォルトはprovider側が管理します。
  - Anthropic Claude Opus 4.7 は `/think xhigh` をadaptive thinking + `output_config.effort: "xhigh"` にマップします。`/think` はthinking directiveであり、`xhigh` はOpus 4.7のeffort設定だからです。
  - Anthropic Claude Opus 4.7 は `/think max` も公開しており、同じprovider管理のmax effort経路にマップされます。
  - OpenAI GPTモデルは、モデル固有のResponses API effortサポートを通じて `/think` をマップします。`/think off` は、対象モデルがそれをサポートする場合にのみ `reasoning.effort: "none"` を送信します。そうでない場合、OpenClawは未サポート値を送る代わりに、無効化されたreasoning payloadを省略します。
  - Anthropic互換ストリーミング経路上の MiniMax（`minimax/*`）は、model paramsまたはrequest paramsでthinkingを明示設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、MiniMaxのnativeでないAnthropic stream formatから `reasoning_content` deltaが漏れるのを防ぎます。
  - Z.AI（`zai/*`）はbinary thinking（`on`/`off`）のみをサポートします。`off` 以外のレベルはすべて `on` として扱われます（`low` にマップ）。
  - Moonshot（`moonshot/*`）は `/think off` を `thinking: { type: "disabled" }` に、`off` 以外のレベルを `thinking: { type: "enabled" }` にマップします。thinkingが有効な場合、Moonshotは `tool_choice` として `auto|none` しか受け付けないため、OpenClawは非互換値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインdirective（そのメッセージにのみ適用）。
2. セッションoverride（directive-only messageを送ることで設定）。
3. agentごとのデフォルト（configの `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（configの `agents.defaults.thinkingDefault`）。
5. Fallback: 利用可能ならprovider宣言のデフォルト。そうでなければ、reasoning可能モデルは `medium` またはそのモデルで最も近いサポート済みnon-`off` レベルに解決され、non-reasoningモデルは `off` のままになります。

## セッションデフォルトの設定

- **directiveだけ** のメッセージを送ります（空白可）。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。`/think:off` またはセッションidle resetで解除されます。
- 確認返信が送られます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送ると、現在のthinking levelを確認できます。

## agentごとの適用

- **Embedded Pi**: 解決されたlevelは、インプロセスのPi agent runtimeに渡されます。

## Fast mode（`/fast`）

- レベル: `on|off`。
- directive-only messageはセッションのfast-mode overrideを切り替え、`Fast mode enabled.` / `Fast mode disabled.` と返信します。
- モード指定なしで `/fast`（または `/fast status`）を送ると、現在有効なfast-mode状態を確認できます。
- OpenClawはfast modeを次の順で解決します:
  1. インライン/directive-only の `/fast on|off`
  2. セッションoverride
  3. agentごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとのconfig: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `openai/*` では、fast modeはサポートされているResponses requestで `service_tier=priority` を送信することでOpenAIのpriority processingにマップされます。
- `openai-codex/*` では、fast modeはCodex Responsesに同じ `service_tier=priority` フラグを送信します。OpenClawは両auth pathにわたり1つの共有 `/fast` toggleを維持します。
- `api.anthropic.com` に送られるOAuth認証トラフィックを含む、直接の公開 `anthropic/*` requestでは、fast modeはAnthropicのservice tierにマップされます: `/fast on` は `service_tier=auto`、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic互換経路上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的なAnthropic `serviceTier` / `service_tier` model paramsは、両方が設定されている場合にfast-modeデフォルトをoverrideします。OpenClawは依然として、Anthropic以外のproxy base URLに対してはAnthropic service-tier注入をスキップします。
- `/status` は、fast modeが有効な場合にのみ `Fast` を表示します。

## Verbose directive（`/verbose` または `/v`）

- レベル: `on`（minimal）| `full` | `off`（デフォルト）。
- directive-only messageはセッションverboseを切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と返信します。無効なレベルは状態を変えずにヒントを返します。
- `/verbose off` は明示的なセッションoverrideを保存します。Sessions UIで `inherit` を選ぶと解除できます。
- インラインdirectiveはそのメッセージにのみ影響し、それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送ると、現在のverbose levelを確認できます。
- verboseが有効な場合、構造化されたtool resultを出すagent（Pi、その他のJSON agent）は、各tool callをそれぞれ独立したmetadata-only messageとして返します。利用可能なら `<emoji> <tool-name>: <arg>`（path/command）というprefixが付きます。これらのtool summaryは、各toolが開始され次第送信されます（別バブルであり、streaming deltaではありません）。
- tool failure summaryは通常モードでも見えますが、生のerror detail suffixはverboseが `on` または `full` の場合を除いて隠されます。
- verboseが `full` の場合、tool outputも完了後に転送されます（別バブルで、安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えると、その後のtool bubbleは新しい設定に従います。

## Plugin trace directive（`/trace`）

- レベル: `on` | `off`（デフォルト）。
- directive-only messageはセッションplugin trace出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と返信します。
- インラインdirectiveはそのメッセージにのみ影響し、それ以外ではセッション/グローバルデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送ると、現在のtrace levelを確認できます。
- `/trace` は `/verbose` より狭い範囲です: Active Memoryのdebug summaryのような、plugin所有のtrace/debug lineのみを公開します。
- trace lineは `/status` に表示されたり、通常のassistant replyの後続diagnostic messageとして現れることがあります。

## Reasoning visibility（`/reasoning`）

- レベル: `on|off|stream`。
- directive-only messageは、replyでthinking blockを表示するかどうかを切り替えます。
- 有効時、reasoningは `Reasoning:` をprefixにした**別メッセージ**として送信されます。
- `stream`（Telegramのみ）: reply生成中にTelegramのdraft bubbleへreasoningをstreamし、その後reasoningなしの最終回答を送信します。
- Alias: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送ると、現在のreasoning levelを確認できます。
- 解決順序: インラインdirective、次にセッションoverride、次にagentごとのデフォルト（`agents.list[].reasoningDefault`）、最後にfallback（`off`）。

## 関連

- Elevated modeのドキュメントは [Elevated mode](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat probe本文は、設定されたheartbeat promptです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat message内のインラインdirectiveは通常どおり適用されます（ただしheartbeatからセッションデフォルトを変えるのは避けてください）。
- Heartbeat配信はデフォルトで最終payloadのみです。別の `Reasoning:` message（利用可能な場合）も送るには、`agents.defaults.heartbeat.includeReasoning: true` またはagentごとの `agents.list[].heartbeat.includeReasoning: true` を設定してください。

## Web chat UI

- Web chatのthinking selectorは、ページ読み込み時にinbound session store/configからセッションの保存済みlevelを反映します。
- 別レベルを選ぶと、`sessions.patch` 経由でセッションoverrideが即時書き込まれます。次回送信まで待ちませんし、単発の `thinkingOnce` overrideでもありません。
- 最初の選択肢は常に `Default (<resolved level>)` であり、resolved defaultは、アクティブセッションモデルのprovider thinking profileと、`/status` および `session_status` と同じfallbackロジックから得られます。
- pickerはgateway session rowが返す `thinkingOptions` を使います。browser UIは独自のprovider regex listを持ちません。モデル固有のレベルセットはpluginが管理します。
- `/think:<level>` も引き続き動作し、同じ保存済みセッションlevelを更新するため、chat directiveとpickerは同期を保ちます。

## Provider profile

- provider Pluginは、モデルでサポートされるレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- 各profile levelは、保存用のcanonicalな `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）を持ち、表示用の `label` を含めることもできます。binary providerは `{ id: "low", label: "on" }` を使います。
- 公開済みのlegacy hook（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換アダプタとして残りますが、新しいcustom level setでは `resolveThinkingProfile` を使うべきです。
- Gateway rowは `thinkingOptions` と `thinkingDefault` を公開するため、ACP/chat clientはruntime validationと同じprofileをレンダリングできます。

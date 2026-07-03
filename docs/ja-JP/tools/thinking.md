---
read_when:
    - 思考、fast-mode、または verbose ディレクティブの解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性のためのディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-07-03T09:24:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## 機能

- 任意の受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink"（最大予算）
  - xhigh → "ultrathink+"（GPT-5.2+ と Codex モデル、および Anthropic Claude Opus 4.7+ effort）
  - adaptive → プロバイダー管理の adaptive thinking（Anthropic/Bedrock の Claude 4.6、Anthropic Claude Opus 4.7+、および Google Gemini dynamic thinking で対応）
  - max → プロバイダー最大推論（Anthropic Claude Opus 4.7+。Ollama はこれをネイティブの最高 `think` effort にマップ）
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマップされます。
  - `highest` は `high` にマップされます。
- プロバイダーメモ:
  - Thinking メニューとピッカーはプロバイダープロファイル駆動です。プロバイダー Plugin は、バイナリの `on` などのラベルを含め、選択したモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max` は、それらをサポートするプロバイダー/モデルプロファイルでのみ表示されます。未対応レベルの型付きディレクティブは、そのモデルの有効な選択肢とともに拒否されます。
  - 既存の保存済み未対応レベルは、プロバイダープロファイルのランクにより再マップされます。`adaptive` は非 adaptive モデルでは `medium` にフォールバックし、`xhigh` と `max` は選択したモデルでサポートされる最大の非 off レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルは、明示的な thinking レベルが設定されていない場合、デフォルトで `adaptive` になります。
  - Anthropic Claude Opus 4.8 と Opus 4.7 は、thinking レベルを明示的に設定しない限り thinking を off のままにします。Opus 4.8 のプロバイダー所有 effort デフォルトは、adaptive thinking が有効になった後は `high` です。
  - Anthropic Claude Opus 4.7+ は `/think xhigh` を adaptive thinking と `output_config.effort: "xhigh"` にマップします。これは `/think` が thinking ディレクティブで、`xhigh` が Opus の effort 設定であるためです。
  - Anthropic Claude Opus 4.7+ は `/think max` も公開します。これは同じプロバイダー所有の max effort パスにマップされます。
  - 直接の DeepSeek V4 モデルは `/think xhigh|max` を公開します。どちらも DeepSeek `reasoning_effort: "max"` にマップされ、より低い非 off レベルは `high` にマップされます。
  - OpenRouter 経由の DeepSeek V4 モデルは `/think xhigh` を公開し、DeepSeek ネイティブのトップレベル `reasoning_effort` ではなく、OpenRouter 対応の `reasoning.effort` 値を送信します。より低い非 off レベルは `high` にマップされ、保存済みの `max` オーバーライドは `xhigh` にフォールバックします。
  - Ollama の thinking 対応モデルは `/think low|medium|high|max` を公開します。Ollama のネイティブ API は `low`、`medium`、`high` の effort 文字列を受け入れるため、`max` はネイティブの `think: "high"` にマップされます。
  - OpenAI GPT モデルは、モデル固有の Responses API effort 対応を通じて `/think` をマップします。`/think off` は、対象モデルが対応する場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw は未対応値を送信する代わりに、無効化された reasoning ペイロードを省略します。
  - カスタムの OpenAI 互換カタログエントリは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで `/think xhigh` にオプトインできます。これは送信時の OpenAI reasoning effort ペイロードをマップするものと同じ compat メタデータを使用するため、メニュー、セッション検証、エージェント CLI、`llm-task` はトランスポート動作と一致します。
  - 古い設定済み OpenRouter Hunter Alpha 参照は、廃止されたルートが reasoning フィールドを通じて最終回答テキストを返す可能性があったため、プロキシ reasoning 注入をスキップします。
  - Google Gemini は `/think adaptive` を Gemini のプロバイダー所有 dynamic thinking にマップします。Gemini 3 リクエストは固定の `thinkingLevel` を省略し、Gemini 2.5 リクエストは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーで最も近い Gemini の `thinkingLevel` または budget にマップされます。
  - Anthropic 互換ストリーミングパス上の MiniMax M2.x（`minimax/MiniMax-M2*`）は、モデル params またはリクエスト params で thinking を明示的に設定しない限り、デフォルトで `thinking: { type: "disabled" }` になります。これにより、M2.x の非ネイティブ Anthropic ストリーム形式から `reasoning_content` デルタが漏れるのを避けます。MiniMax-M3（および M3.x）は例外です。M3 は適切な Anthropic thinking ブロックを出力し、thinking が無効な場合は空の content を返すため、OpenClaw は M3 をプロバイダーの omitted/adaptive thinking パスのままにします。
  - Z.AI（`zai/*`）は、ほとんどの GLM モデルでバイナリ（`on`/`off`）です。GLM-5.2 は例外です。`/think off|low|high|max` を公開し、`low` と `high` を Z.AI `reasoning_effort: "high"` にマップし、`max` を `reasoning_effort: "max"` にマップします。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）は常に thinking します。そのプロファイルは `on` のみを公開し、OpenClaw は Moonshot が要求する通り、送信時の `thinking` フィールドを省略します。その他の `moonshot/*` モデルは、`/think off` を `thinking: { type: "disabled" }` に、非 `off` レベルを `thinking: { type: "enabled" }` にマップします。thinking が有効な場合、Moonshot は `tool_choice` `auto|none` のみを受け入れます。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージ送信で設定）。
3. エージェントごとのデフォルト（config の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（config の `agents.defaults.thinkingDefault`）。
5. フォールバック: プロバイダー宣言のデフォルトが利用可能な場合はそれを使用します。それ以外の場合、reasoning 対応モデルは `medium` またはそのモデルでサポートされる最も近い非 `off` レベルに解決され、非 reasoning モデルは `off` のままです。

## セッションデフォルトの設定

- ディレクティブ**のみ**のメッセージ（空白は許可）を送信します。例: `/think:medium` または `/t high`。
- これは現在のセッションに固定されます（デフォルトでは送信者ごと）。セッションオーバーライドをクリアして設定済み/プロバイダーデフォルトを継承するには、`/think default` を使用します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- `/think off` は明示的な off オーバーライドを保存します。セッションオーバーライドを変更またはクリアするまで、thinking を無効にします。
- 確認返信が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 現在の thinking レベルを確認するには、引数なしで `/think`（または `/think:`）を送信します。

## エージェントごとの適用

- **Embedded OpenClaw**: 解決されたレベルは、インプロセスの OpenClaw エージェントランタイムに渡されます。
- **Claude CLI バックエンド**: `claude-cli` 使用時、非 off レベルは `--effort` として Claude Code に渡されます。[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

## 高速モード（/fast）

- レベル: `auto|on|off|default`。
- ディレクティブのみのメッセージは、セッションの高速モードオーバーライドを切り替え、`Fast mode set to auto.`、`Fast mode enabled.`、または `Fast mode disabled.` を返信します。セッションオーバーライドをクリアして設定済みデフォルトを継承するには、`/fast default` を使用します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- 現在有効な高速モード状態を確認するには、モードなしで `/fast`（または `/fast status`）を送信します。
- OpenClaw は高速モードを次の順序で解決します:
  1. インライン/ディレクティブのみの `/fast auto|on|off` オーバーライド（`/fast default` はこのレイヤーをクリア）
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの config: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `auto` はセッション/config モードを auto のまま保持しますが、新しいモデル呼び出しごとに独立して解決します。auto カットオフ前に開始した呼び出しでは高速モードが有効になり、それ以降の retry、fallback、tool-result、または continuation 呼び出しは高速モード無効で開始します。カットオフのデフォルトは 60 秒です。変更するには、アクティブモデルに `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を設定します。
- `openai/*` では、高速モードは対応する Responses リクエストで `service_tier=priority` を送信することで OpenAI priority processing にマップされます。
- Codex バックエンドの `openai/*` / `openai-codex/*` モデルでは、高速モードは Codex Responses に同じ `service_tier=priority` フラグを送信します。ネイティブ Codex app-server ターンは `turn/start` または thread start/resume でのみ tier を受け取るため、`auto` はすでに実行中の app-server ターンの tier を変更できません。OpenClaw が開始する次のモデルターンに適用されます。
- OAuth 認証済みで `api.anthropic.com` に送信されるトラフィックを含む直接の公開 `anthropic/*` リクエストでは、高速モードは Anthropic service tiers にマップされます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）が `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- 明示的な Anthropic `serviceTier` / `service_tier` モデル params は、両方が設定されている場合、高速モードデフォルトを上書きします。OpenClaw は引き続き、非 Anthropic プロキシベース URL では Anthropic service-tier 注入をスキップします。
- `/status` は、高速モードが有効な場合は `Fast` を、設定済みモードが auto の場合は `Fast:auto` を表示します。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小） | `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッション verbose を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` を返信します。無効なレベルは、状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択してクリアします。
- 認可された外部チャネル送信者は、セッション verbose オーバーライドを永続化できます。内部 Gateway/webchat クライアントが永続化するには `operator.admin` が必要です。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 現在の verbose レベルを確認するには、引数なしで `/verbose`（または `/verbose:`）を送信します。
- verbose が on の場合、構造化ツール結果を出力するエージェントは、各ツール呼び出しを、それぞれ独立したメタデータのみのメッセージとして送り返します。利用可能な場合は `<emoji> <tool-name>: <arg>` が接頭辞として付きます。これらのツール概要は、各ツールの開始直後に送信されます（別々の吹き出し）。ストリーミングデルタとしては送信されません。
- ツール失敗の概要は通常モードでも表示されたままですが、生のエラー詳細サフィックスは verbose が `full` でない限り非表示です。
- verbose が `full` の場合、ツール出力も完了後に転送されます（別の吹き出し、安全な長さに切り詰め）。実行中に `/verbose on|full|off` を切り替えた場合、以降のツール吹き出しは新しい設定に従います。
- `agents.defaults.toolProgressDetail` は、`/verbose` ツール概要と進行中ドラフトのツール行の形式を制御します。`🛠️ Exec: checking JS syntax` のようなコンパクトな人間向けラベルには `"explain"`（デフォルト）を使用します。デバッグ用に生のコマンド/詳細も追加したい場合は `"raw"` を使用します。エージェントごとの `agents.list[].toolProgressDetail` はデフォルトを上書きします。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージはセッションの Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` を返信します。
- インラインディレクティブはそのメッセージにのみ影響します。それ以外の場合はセッション/グローバルデフォルトが適用されます。
- 現在の trace レベルを確認するには、引数なしで `/trace`（または `/trace:`）を送信します。
- `/trace` は `/verbose` より範囲が狭く、Active Memory デバッグ概要のような Plugin 所有の trace/debug 行のみを公開します。
- trace 行は `/status` に表示される場合があり、通常のアシスタント返信後のフォローアップ診断メッセージとして表示される場合もあります。

## Reasoning の表示（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージは、thinking ブロックを返信に表示するかどうかを切り替えます。
- 有効な場合、reasoning は `Thinking` を接頭辞にした**別メッセージ**として送信されます。
- `stream`: アクティブなチャネルが reasoning プレビューに対応している場合、返信生成中に reasoning をストリーミングし、その後 reasoning なしの最終回答を送信します。
- エイリアス: `/reason`。
- 現在の reasoning レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インラインディレクティブ、次にセッションオーバーライド、次にエージェントごとのデフォルト（`agents.list[].reasoningDefault`）、次にグローバルデフォルト（`agents.defaults.reasoningDefault`）、次にフォールバック（`off`）。

不正な形式のローカルモデル推論タグは保守的に処理されます。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままで、すでに表示されたテキストの後にある閉じられていない推論も非表示になります。返信全体が単一の閉じられていない開始タグで囲まれており、そのままだと空テキストとして配信される場合、OpenClaw は不正な形式の開始タグを削除し、残りのテキストを配信します。

## 関連

- 昇格モードのドキュメントは [昇格モード](/ja-JP/tools/elevated) にあります。

## Heartbeat

- Heartbeat プローブ本文は設定済みの Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインライン指示は通常どおり適用されます（ただし、Heartbeat からセッションのデフォルトを変更することは避けてください）。
- Heartbeat の配信は、デフォルトでは最終ペイロードのみです。別個の `Thinking` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- Web チャットの思考セレクターは、ページ読み込み時にインバウンドセッションストア/設定からセッションに保存されているレベルを反映します。
- 別のレベルを選択すると、`sessions.patch` 経由でセッションの上書きが即座に書き込まれます。次の送信を待たず、1 回限りの `thinkingOnce` 上書きでもありません。
- 最初のオプションは常に上書き解除の選択肢です。継承された思考が無効な場合の `Inherited: Off` を含め、`Inherited: <resolved level>` と表示されます。
- 明示的なピッカー選択では、プロバイダーラベルがある場合はそれを保持しながら、直接のレベルラベルを使用します（たとえば、プロバイダーラベル付きの `max` オプションでは `Maximum`）。
- ピッカーは Gateway セッション行/デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーラベルリストとして保持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。Plugin がモデル固有のレベルセットを所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャット指示とピッカーは同期したままになります。

## プロバイダープロファイル

- プロバイダー Plugin は、モデルでサポートされるレベルとデフォルトを定義するために `resolveThinkingProfile(ctx)` を公開できます。
- Claude モデルをプロキシするプロバイダー Plugin は、直接の Anthropic カタログとプロキシカタログの整合性を保つため、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、または `max`）があり、表示用の `label` を含めることもできます。バイナリプロバイダーは `{ id: "low", label: "on" }` を使用します。
- プロファイルフックは、利用可能な場合、`reasoning`、`compat.thinkingFormat`、`compat.supportedReasoningEfforts` を含むマージ済みカタログ情報を受け取ります。設定済みのリクエスト契約が対応するペイロードをサポートする場合にのみ、これらの情報を使ってバイナリまたはカスタムプロファイルを公開してください。
- 明示的な思考上書きを検証する必要があるツール Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー/モデルレベルリストを保持してはいけません。
- 設定済みカスタムモデルメタデータにアクセスできるツール Plugin は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換アダプターとして残りますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用してください。
- Gateway 行/デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開し、ACP/チャットクライアントがランタイム検証で使用されるものと同じプロファイル ID とラベルをレンダリングできるようにします。

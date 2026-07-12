---
read_when:
    - thinking、fast-mode、verbose の各ディレクティブの解析またはデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の表示に関するディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-07-12T14:54:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 機能概要

- 受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`。Anthropic の従来のマジックワード階層「think」<「think hard」<「think harder」<「ultrathink」におおむね対応します。
  - minimal ~ 「think」
  - low ~ 「think hard」
  - medium ~ 「think harder」
  - high ~ 「ultrathink」（最大予算）
  - xhigh ~ 「ultrathink+」（GPT-5.2 以降および Codex モデル、さらに Anthropic Claude Opus 4.7 以降の effort）
  - adaptive → プロバイダー管理の適応型思考（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7 以降、および Google Gemini の動的思考でサポート）
  - max → プロバイダーの最大推論（Anthropic Claude Opus 4.7 以降。Ollama では、これをネイティブの最高 `think` effort に対応付けます）
  - ultra → 選択したモデル／ランタイムがサポートする場合、プロバイダーの最大推論に加えてプロアクティブなサブエージェントのオーケストレーションを使用
  - `x-high`、`x_high`、`extra-high`、`extra high`、および `extra_high` は `xhigh` に対応付けられます。
  - `highest` は `high` に対応付けられます。
- プロバイダーに関する注意事項:
  - 思考メニューと選択 UI は、プロバイダープロファイルによって決まります。プロバイダー Plugin は、バイナリの `on` などのラベルを含め、選択したモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max`、および `ultra` は、それらをサポートするプロバイダー／モデル／ランタイムプロファイルでのみ提示されます。サポートされていないレベルの型付きディレクティブは、そのモデルで有効な選択肢とともに拒否されます。
  - 保存済みの未サポートレベルは、プロバイダープロファイルの順位に基づいて再対応付けされます。非適応型モデルでは `adaptive` は `medium` にフォールバックし、`xhigh` と `max` は、選択したモデルがサポートするオフ以外の最大レベルにフォールバックします。
  - Anthropic Claude 4.6 モデルでは、明示的な思考レベルが設定されていない場合、デフォルトは `adaptive` です。
  - Anthropic Claude Opus 4.8 と Opus 4.7 は、思考レベルを明示的に設定しない限り、思考をオフのままにします。適応型思考を有効にした後の Opus 4.8 のプロバイダー所有のデフォルト effort は `high` です。
  - Anthropic Claude Opus 4.7 以降では、`/think xhigh` を適応型思考と `output_config.effort: "xhigh"` の組み合わせに対応付けます。これは、`/think` が思考ディレクティブであり、`xhigh` が Opus の effort 設定であるためです。
  - Anthropic Claude Opus 4.7 以降では `/think max` も公開され、同じプロバイダー所有の最大 effort パスに対応付けられます。
  - DeepSeek V4 の直接接続モデルでは `/think xhigh|max` が公開され、どちらも DeepSeek の `reasoning_effort: "max"` に対応付けられます。一方、オフ以外のより低いレベルは `high` に対応付けられます。
  - OpenRouter 経由の DeepSeek V4 モデルでは `/think xhigh` が公開され、DeepSeek ネイティブのトップレベル `reasoning_effort` の代わりに、OpenRouter がサポートする `reasoning.effort` 値を送信します。オフ以外のより低いレベルは `high` に対応付けられ、保存済みの `max` オーバーライドは `xhigh` にフォールバックします。
  - 思考対応の Ollama モデルでは `/think low|medium|high|max` が公開されます。Ollama のネイティブ API は `low`、`medium`、および `high` の effort 文字列を受け付けるため、`max` はネイティブの `think: "high"` に対応付けられます。
  - OpenAI GPT モデルでは、`/think` をモデル固有の Responses API effort サポートに基づいて対応付けます。`/think off` は、対象モデルがサポートする場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw は未サポートの値を送信せず、無効化された推論ペイロードを省略します。
  - GPT-5.6 Sol と Terra は、Codex ランタイムを通じてネイティブの `/think ultra` を公開します。GPT-5.6 Luna の Codex カタログは Ultra を提示しないため、公開されるレベルは `max` までです。
  - 組み込みの OpenClaw ランタイムでは、GPT-5.6 Sol、Terra、および Luna 向けに論理的な `/think ultra` が公開されます。プロバイダーの最大 effort を送信し、実行スコープのプロアクティブなサブエージェントのオーケストレーションガイダンスを追加します。
  - カスタムの OpenAI 互換カタログエントリでは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで、`/think xhigh` をオプトインできます。これは送信される OpenAI 推論 effort ペイロードの対応付けに使用するものと同じ互換性メタデータを使用するため、メニュー、セッション検証、エージェント CLI、および `llm-task` の動作がトランスポートの動作と一致します。
  - 設定に残っている古い OpenRouter Hunter Alpha の参照では、廃止済みのそのルートが推論フィールドを通じて最終回答テキストを返す可能性があるため、プロキシによる推論の注入をスキップします。
  - Google Gemini では、`/think adaptive` を Gemini のプロバイダー所有の動的思考に対応付けます。Gemini 3 のリクエストでは固定の `thinkingLevel` を省略し、Gemini 2.5 のリクエストでは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーで最も近い Gemini の `thinkingLevel` または予算に対応付けられます。
  - Anthropic 互換ストリーミングパス上の MiniMax M2.x（`minimax/MiniMax-M2*`）では、モデルパラメーターまたはリクエストパラメーターで思考を明示的に設定しない限り、デフォルトは `thinking: { type: "disabled" }` です。これにより、M2.x の非ネイティブな Anthropic ストリーム形式から `reasoning_content` デルタが漏れるのを防ぎます。MiniMax-M3（および M3.x）は例外です。M3 は適切な Anthropic 思考ブロックを出力し、思考を無効にすると空のコンテンツを返すため、OpenClaw は M3 をプロバイダーの省略／適応型思考パスのままにします。
  - ほとんどの GLM モデルでは、Z.AI（`zai/*`）はバイナリ（`on`/`off`）です。GLM-5.2 は例外です。`/think off|low|high|max` を公開し、`low` と `high` を Z.AI の `reasoning_effort: "high"` に対応付け、`max` を `reasoning_effort: "max"` に対応付けます。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）は常に思考します。そのプロファイルでは `on` のみが公開され、OpenClaw は Moonshot の要件に従って送信時の `thinking` フィールドを省略します。その他の `moonshot/*` モデルでは、`/think off` を `thinking: { type: "disabled" }` に対応付け、`off` 以外のレベルをすべて `thinking: { type: "enabled" }` に対応付けます。思考が有効な場合、Moonshot が受け付ける `tool_choice` は `auto|none` のみです。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ内のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージを送信して設定）。
3. エージェント単位のデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック：利用可能な場合はプロバイダーが宣言したデフォルト。それ以外の場合、推論対応モデルでは `medium`、またはそのモデルがサポートする最も近い非 `off` レベルに解決され、非推論モデルでは `off` のままになります。

## セッションのデフォルトを設定する

- ディレクティブ**のみ**のメッセージ（空白文字は許可）を送信します（例：`/think:medium` または `/t high`）。
- この設定は現在のセッションで維持されます（デフォルトでは送信者ごと）。セッションのオーバーライドを解除し、設定済みのデフォルトまたはプロバイダーのデフォルトを継承するには、`/think default` を使用します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- `/think off` は、明示的なオフのオーバーライドを保存します。セッションのオーバーライドを変更または解除するまで、思考が無効になります。
- 確認応答が送信されます（`Thinking level set to high.` / `Thinking disabled.`）。レベルが無効な場合（例：`/thinking big`）、コマンドはヒントとともに拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の思考レベルを確認できます。

## エージェントによる適用

- **組み込み OpenClaw**: 解決されたレベルが、プロセス内の OpenClaw エージェントランタイムに渡されます。
- **Claude CLI バックエンド**: `claude-cli` を使用する場合、off 以外の具体的なレベルは `--effort` として Claude Code に渡されます。`adaptive` は設定済みの effort フラグを削除し、実効 effort の決定を Claude Code の環境、設定、モデルのデフォルトに委ねます。[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

## 高速モード（/fast）

- レベル: `auto|on|off|default`。
- ディレクティブのみのメッセージは、セッションの高速モードオーバーライドを切り替え、`Fast mode set to auto.`、`Fast mode enabled.`、または `Fast mode disabled.` と応答します。セッションのオーバーライドを解除して設定済みのデフォルトを継承するには、`/fast default` を使用します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- 現在の実効高速モード状態を確認するには、モードを指定せずに `/fast`（または `/fast status`）を送信します。
- OpenClaw は、次の順序で高速モードを解決します。
  1. インラインまたはディレクティブのみの `/fast auto|on|off` オーバーライド（`/fast default` でこのレイヤーを解除）
  2. セッションのオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `auto` では、セッションまたは設定のモードは auto のまま維持されますが、新しいモデル呼び出しごとに独立して解決されます。auto のカットオフ前に開始した呼び出しでは高速モードが有効になり、それ以降の再試行、フォールバック、ツール結果、または継続の呼び出しは高速モードを無効にして開始されます。カットオフのデフォルトは 60 秒です。変更するには、アクティブなモデルで `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を設定します。
- `openai/*` では、高速モードは、対応する Responses リクエストで `service_tier=priority` を送信することにより、OpenAI の優先処理に対応付けられます。
- Codex をバックエンドとする `openai/*` / `openai-codex/*` モデルでは、高速モードによって Codex Responses にも同じ `service_tier=priority` フラグが送信されます。ネイティブ Codex app-server のターンがこの tier を受け取るのは、`turn/start` またはスレッドの開始/再開時のみです。そのため、`auto` では、すでに実行中の app-server ターンの tier を変更できません。これは OpenClaw が開始する次のモデルターンに適用されます。
- `api.anthropic.com` に送信される OAuth 認証済みトラフィックを含む、公開 `anthropic/*` への直接リクエストでは、高速モードは Anthropic のサービス tier に対応付けられます。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）によって `MiniMax-M2.7` が `MiniMax-M2.7-highspeed` に書き換えられます。
- Anthropic の `serviceTier` / `service_tier` モデルパラメータが明示的に設定されている場合、高速モードのデフォルトよりも優先されます。OpenClaw は引き続き、Anthropic 以外のプロキシベース URL では Anthropic サービス tier の注入を省略します。
- 高速モードが有効な場合、`/status` には `Fast` と表示され、設定モードが auto の場合は `Fast:auto` と表示されます。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小限）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージは、セッションの詳細出力を切り替え、`Verbose logging enabled.` / `Verbose logging disabled.` と応答します。無効なレベルの場合は、状態を変更せずにヒントを返します。
- `/verbose off` は、明示的なセッションオーバーライドを保存します。解除するには、Sessions UI で `inherit` を選択します。
- 認可された外部チャンネルの送信者は、セッションの詳細出力オーバーライドを永続化できます。内部の Gateway/webchat クライアントが永続化するには、`operator.admin` が必要です。
- インラインディレクティブは、そのメッセージだけに影響します。それ以外の場合は、セッションまたはグローバルのデフォルトが適用されます。
- 現在の詳細出力レベルを確認するには、引数を指定せずに `/verbose`（または `/verbose:`）を送信します。
- 詳細出力が有効な場合、構造化されたツール結果を生成するエージェントは、利用可能であれば `<emoji> <tool-name>: <arg>` という接頭辞を付け、各ツール呼び出しをメタデータのみの個別メッセージとして返します。これらのツール概要は、各ツールの開始直後に、ストリーミング差分ではなく個別の吹き出しとして送信されます。
- ツール失敗の概要は通常モードでも表示されますが、生のエラー詳細の接尾辞は、詳細出力が `full` でない限り非表示になります。
- 詳細出力が `full` の場合、ツール出力も完了後に転送されます（個別の吹き出しで、安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えると、それ以降のツール吹き出しには新しい設定が適用されます。
- `agents.defaults.toolProgressDetail` は、`/verbose` のツール概要と進捗下書きのツール行の形式を制御します。`🛠️ Exec: checking JS syntax` のような簡潔で人間向けのラベルを使用するには、`"explain"`（デフォルト）を使用します。デバッグ用に生のコマンドや詳細も追加する場合は、`"raw"` を使用します。エージェントごとの `agents.list[].toolProgressDetail` は、デフォルトをオーバーライドします。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージは、セッションの Plugin トレース出力を切り替え、`Plugin trace enabled.` / `Plugin trace disabled.` と応答します。
- インラインディレクティブは、そのメッセージだけに影響します。それ以外の場合は、セッションまたはグローバルのデフォルトが適用されます。
- 現在のトレースレベルを確認するには、引数を指定せずに `/trace`（または `/trace:`）を送信します。
- `/trace` の範囲は `/verbose` より限定的です。Active Memory のデバッグ概要など、Plugin が所有するトレース行やデバッグ行のみを公開します。
- トレース行は、`/status` 内、および通常のアシスタント応答後に続く診断メッセージとして表示される場合があります。

## 推論の表示（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージで、返信に思考ブロックを表示するかどうかを切り替えます。
- 有効にすると、推論は `Thinking` という接頭辞が付いた**別のメッセージ**として送信されます。
- `stream`: アクティブなチャネルが推論プレビューをサポートしている場合、返信の生成中に推論をストリーミングし、その後、推論を含まない最終回答を送信します。
- エイリアス: `/reason`。
- 現在の推論レベルを確認するには、引数なしで `/reasoning`（または `/reasoning:`）を送信します。
- 解決順序: インラインディレクティブ、セッションオーバーライド、エージェントごとのデフォルト（`agents.list[].reasoningDefault`）、グローバルデフォルト（`agents.defaults.reasoningDefault`）、フォールバック（`off`）の順です。

不正なローカルモデルの推論タグは保守的に処理されます。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままとなり、すでに表示されているテキストの後にある閉じられていない推論も非表示になります。返信全体が閉じられていない単一の開始タグで囲まれており、そのままでは空のテキストとして配信される場合、OpenClaw は不正な開始タグを削除し、残りのテキストを配信します。

## 関連項目

- 昇格モードのドキュメントについては、[昇格モード](/ja-JP/tools/elevated)を参照してください。

## Heartbeat

- Heartbeat プローブの本文は、設定された Heartbeat プロンプトです（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションのデフォルトを変更することは避けてください）。
- Heartbeat の配信は、デフォルトでは最終ペイロードのみです。別個の `Thinking` メッセージも（利用可能な場合に）送信するには、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- ページの読み込み時に、Web チャットの思考セレクターには、受信セッションのストア／設定に保存されているセッションのレベルが反映されます。
- 別のレベルを選択すると、`sessions.patch` を介してセッションのオーバーライドが即座に書き込まれます。次回の送信を待つことはなく、1 回限りの `thinkingOnce` オーバーライドでもありません。
- モデル、推論、または速度ピッカーへの変更がまだ適用中の状態で送信すると、保留中のすべてのピッカーパッチが完了するまで待機します。変更に失敗した場合、メッセージは確認できるよう未送信のままになります。
- 最初のオプションは常にオーバーライドを解除する選択肢です。継承された思考が無効な場合の `Inherited: Off` を含め、`Inherited: <resolved level>` と表示されます。
- ピッカーで明示的に選択した項目には直接対応するレベルラベルが使用され、プロバイダーのラベルが存在する場合はそれが維持されます（たとえば、プロバイダーによってラベル付けされた `max` オプションの `Maximum`）。
- ピッカーは Gateway のセッション行／デフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーなラベルリストとして維持されます。ブラウザー UI は独自のプロバイダー正規表現リストを保持しません。モデル固有のレベルセットは Plugin が所有します。
- `/think:<level>` は引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーの同期が維持されます。

## プロバイダープロファイル

- プロバイダー Plugin は `resolveThinkingProfile(ctx)` を公開して、モデルがサポートするレベルとデフォルトを定義できます。
- Claude モデルをプロキシするプロバイダー Plugin は、Anthropic の直接カタログとプロキシカタログの整合性を維持するため、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max`、または `ultra`）があり、表示用の `label` を含めることができます。二値プロバイダーは `{ id: "low", label: "on" }` を使用します。
- プロファイルフックは、利用可能な場合、`reasoning`、`compat.thinkingFormat`、`compat.supportedReasoningEfforts` を含む、統合されたカタログ情報を受け取ります。設定されたリクエスト契約が対応するペイロードをサポートする場合に限り、これらの情報を使用して二値またはカスタムプロファイルを公開してください。
- 明示的な思考オーバーライドを検証する必要があるツール Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用する必要があります。独自のプロバイダー／モデルレベルリストを保持してはいけません。常時埋め込み実行など、ツールが実行パスを所有する場合は `agentRuntime` を渡します。
- 設定済みのカスタムモデルメタデータにアクセスできるツール Plugin は、`resolveThinkingPolicy` に `catalog` を渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして維持されますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行／デフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP／チャットクライアントはランタイム検証で使用されるものと同じプロファイル ID とラベルをレンダリングできます。

---
read_when:
    - thinking、fast-mode、または verbose ディレクティブの解析やデフォルトの調整
summary: /think、/fast、/verbose、/trace、および推論の可視性に関するディレクティブ構文
title: 思考レベル
x-i18n:
    generated_at: "2026-07-11T22:48:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 機能

- 受信本文内のインラインディレクティブ: `/t <level>`、`/think:<level>`、または `/thinking <level>`。
- レベル（エイリアス）: `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`。おおむね Anthropic の従来のマジックワード階層「think」<「think hard」<「think harder」<「ultrathink」に対応します。
  - minimal ~「think」
  - low ~「think hard」
  - medium ~「think harder」
  - high ~「ultrathink」（最大予算）
  - xhigh ~「ultrathink+」（GPT-5.2 以降と Codex モデル、および Anthropic Claude Opus 4.7 以降の effort）
  - adaptive → プロバイダー管理の適応的思考（Anthropic/Bedrock 上の Claude 4.6、Anthropic Claude Opus 4.7 以降、および Google Gemini の動的思考でサポート）
  - max → プロバイダーの最大推論（Anthropic Claude Opus 4.7 以降。Ollama ではネイティブの `think` effort の最高値にマッピング）
  - ultra → 選択したモデル／ランタイムがサポートする場合、プロバイダーの最大推論に加えて、能動的なサブエージェントのオーケストレーションを使用
  - `x-high`、`x_high`、`extra-high`、`extra high`、`extra_high` は `xhigh` にマッピングされます。
  - `highest` は `high` にマッピングされます。
- プロバイダーに関する注記:
  - 思考メニューと選択項目は、プロバイダープロファイルによって決まります。プロバイダー Plugin は、バイナリの `on` などのラベルを含め、選択されたモデルの正確なレベルセットを宣言します。
  - `adaptive`、`xhigh`、`max`、`ultra` は、それらをサポートするプロバイダー／モデル／ランタイムのプロファイルでのみ表示されます。サポートされていないレベルを指定したディレクティブは、そのモデルで有効な選択肢を示して拒否されます。
  - 保存済みのサポートされていないレベルは、プロバイダープロファイルの順位に基づいて再マッピングされます。非適応モデルでは `adaptive` は `medium` にフォールバックし、`xhigh` と `max` は選択したモデルがサポートする `off` 以外の最大レベルにフォールバックします。
  - 明示的な思考レベルが設定されていない場合、Anthropic Claude 4.6 モデルのデフォルトは `adaptive` です。
  - Anthropic Claude Opus 4.8 と Opus 4.7 は、思考レベルを明示的に設定しない限り、思考を無効のままにします。Opus 4.8 では、適応的思考を有効にした後のプロバイダー所有の effort のデフォルトは `high` です。
  - Anthropic Claude Opus 4.7 以降では、`/think` が思考ディレクティブであり、`xhigh` が Opus の effort 設定であるため、`/think xhigh` は適応的思考と `output_config.effort: "xhigh"` にマッピングされます。
  - Anthropic Claude Opus 4.7 以降では `/think max` も使用でき、同じプロバイダー所有の最大 effort パスにマッピングされます。
  - 直接接続する DeepSeek V4 モデルでは `/think xhigh|max` を使用できます。どちらも DeepSeek の `reasoning_effort: "max"` にマッピングされ、`off` 以外の低いレベルは `high` にマッピングされます。
  - OpenRouter 経由の DeepSeek V4 モデルでは `/think xhigh` を使用でき、DeepSeek ネイティブのトップレベル `reasoning_effort` の代わりに、OpenRouter がサポートする `reasoning.effort` 値を送信します。`off` 以外の低いレベルは `high` にマッピングされ、保存済みの `max` オーバーライドは `xhigh` にフォールバックします。
  - 思考対応の Ollama モデルでは `/think low|medium|high|max` を使用できます。Ollama のネイティブ API が effort 文字列として `low`、`medium`、`high` を受け付けるため、`max` はネイティブの `think: "high"` にマッピングされます。
  - OpenAI GPT モデルでは、モデル固有の Responses API effort サポートを通じて `/think` をマッピングします。`/think off` は、対象モデルがサポートする場合にのみ `reasoning.effort: "none"` を送信します。それ以外の場合、OpenClaw はサポートされていない値を送信せず、無効化された推論ペイロードを省略します。
  - GPT-5.6 Sol と Terra では、Codex ランタイムを通じてネイティブの `/think ultra` を使用できます。GPT-5.6 Luna では、Codex カタログが Ultra を宣伝していないため、`max` までのレベルを使用できます。
  - 組み込みの OpenClaw ランタイムでは、GPT-5.6 Sol、Terra、Luna に対して論理的な `/think ultra` を使用できます。プロバイダーの最大 effort を送信し、実行スコープの能動的なサブエージェントオーケストレーション指針を追加します。
  - カスタムの OpenAI 互換カタログエントリでは、`models.providers.<provider>.models[].compat.supportedReasoningEfforts` に `"xhigh"` を含めることで、`/think xhigh` をオプトインできます。これは送信する OpenAI 推論 effort ペイロードのマッピングに使用されるものと同じ互換性メタデータを使用するため、メニュー、セッション検証、エージェント CLI、`llm-task` の動作がトランスポートの動作と一致します。
  - 古い設定に残っている OpenRouter Hunter Alpha の参照では、その廃止済みルートが推論フィールド経由で最終回答テキストを返す可能性があるため、プロキシ推論の注入をスキップします。
  - Google Gemini では `/think adaptive` を Gemini のプロバイダー所有の動的思考にマッピングします。Gemini 3 のリクエストでは固定の `thinkingLevel` を省略し、Gemini 2.5 のリクエストでは `thinkingBudget: -1` を送信します。固定レベルは引き続き、そのモデルファミリーで最も近い Gemini の `thinkingLevel` または予算にマッピングされます。
  - Anthropic 互換ストリーミングパス上の MiniMax M2.x（`minimax/MiniMax-M2*`）では、モデルパラメーターまたはリクエストパラメーターで思考を明示的に設定しない限り、デフォルトは `thinking: { type: "disabled" }` です。これにより、M2.x の非ネイティブ Anthropic ストリーム形式から `reasoning_content` の差分が漏れることを防ぎます。MiniMax-M3（および M3.x）は対象外です。M3 は適切な Anthropic 思考ブロックを生成し、思考が無効な場合は空のコンテンツを返すため、OpenClaw は M3 でプロバイダーの省略時／適応的思考パスを維持します。
  - Z.AI（`zai/*`）では、ほとんどの GLM モデルがバイナリ（`on`／`off`）です。GLM-5.2 は例外で、`/think off|low|high|max` を使用でき、`low` と `high` を Z.AI の `reasoning_effort: "high"` に、`max` を `reasoning_effort: "max"` にマッピングします。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）は常に思考します。そのプロファイルで使用できるのは `on` のみで、OpenClaw は Moonshot の要件に従って送信時の `thinking` フィールドを省略します。その他の `moonshot/*` モデルでは、`/think off` を `thinking: { type: "disabled" }` に、`off` 以外のレベルを `thinking: { type: "enabled" }` にマッピングします。思考が有効な場合、Moonshot が受け付ける `tool_choice` は `auto|none` のみです。OpenClaw は互換性のない値を `auto` に正規化します。

## 解決順序

1. メッセージ上のインラインディレクティブ（そのメッセージにのみ適用）。
2. セッションオーバーライド（ディレクティブのみのメッセージを送信して設定）。
3. エージェントごとのデフォルト（設定内の `agents.list[].thinkingDefault`）。
4. グローバルデフォルト（設定内の `agents.defaults.thinkingDefault`）。
5. フォールバック: 利用可能な場合はプロバイダーが宣言したデフォルト。それ以外では、推論対応モデルは `medium` またはそのモデルがサポートする最も近い `off` 以外のレベルに解決され、非推論モデルは `off` のままです。

## セッションのデフォルト設定

- ディレクティブ**のみ**のメッセージを送信します（空白は許可）。例: `/think:medium` または `/t high`。
- この設定は現在のセッションで維持されます（デフォルトでは送信者ごと）。`/think default` を使用するとセッションオーバーライドが解除され、設定済み／プロバイダーのデフォルトを継承します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- `/think off` は、明示的な無効化オーバーライドを保存します。セッションオーバーライドを変更または解除するまで、思考は無効になります。
- 確認応答が送信されます（`Thinking level set to high.`／`Thinking disabled.`）。レベルが無効な場合（例: `/thinking big`）、コマンドはヒント付きで拒否され、セッション状態は変更されません。
- 引数なしで `/think`（または `/think:`）を送信すると、現在の思考レベルを確認できます。

## エージェントによる適用

- **組み込み OpenClaw**: 解決されたレベルは、プロセス内の OpenClaw エージェントランタイムに渡されます。
- **Claude CLI バックエンド**: `claude-cli` を使用する場合、`off` 以外の具体的なレベルは `--effort` として Claude Code に渡されます。`adaptive` は設定済みの effort フラグを削除し、実効 effort を Claude Code の環境、設定、モデルのデフォルトに委ねます。[CLI バックエンド](/ja-JP/gateway/cli-backends)を参照してください。

## 高速モード（/fast）

- レベル: `auto|on|off|default`。
- ディレクティブのみのメッセージでセッションの高速モードオーバーライドを切り替え、`Fast mode set to auto.`、`Fast mode enabled.`、または `Fast mode disabled.` と応答します。`/fast default` を使用するとセッションオーバーライドが解除され、設定済みのデフォルトを継承します。エイリアスには `inherit`、`clear`、`reset`、`unpin` があります。
- モードを指定せずに `/fast`（または `/fast status`）を送信すると、現在有効な高速モードの状態を確認できます。
- OpenClaw は次の順序で高速モードを解決します。
  1. インライン／ディレクティブのみの `/fast auto|on|off` オーバーライド（`/fast default` でこのレイヤーを解除）
  2. セッションオーバーライド
  3. エージェントごとのデフォルト（`agents.list[].fastModeDefault`）
  4. モデルごとの設定: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. フォールバック: `off`
- `auto` はセッション／設定モードを自動のまま維持しますが、新しいモデル呼び出しごとに個別に解決します。自動切り替えの期限前に開始した呼び出しでは高速モードが有効になり、それ以降の再試行、フォールバック、ツール結果、または継続の呼び出しは高速モードを無効にして開始します。期限のデフォルトは 60 秒です。変更するには、アクティブなモデルの `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` を設定します。
- `openai/*` では、サポートされる Responses リクエストで `service_tier=priority` を送信することにより、高速モードを OpenAI の優先処理にマッピングします。
- Codex をバックエンドとする `openai/*`／`openai-codex/*` モデルでは、高速モードにより Codex Responses に同じ `service_tier=priority` フラグを送信します。ネイティブ Codex アプリサーバーのターンは、`turn/start` またはスレッドの開始／再開時にのみこの階層を受け取るため、`auto` ではすでに実行中のアプリサーバーのターンの階層を変更できません。この設定は OpenClaw が開始する次のモデルターンに適用されます。
- `api.anthropic.com` に送信される OAuth 認証済みトラフィックを含む、公開の `anthropic/*` への直接リクエストでは、高速モードを Anthropic のサービス階層にマッピングします。`/fast on` は `service_tier=auto` を設定し、`/fast off` は `service_tier=standard_only` を設定します。
- Anthropic 互換パス上の `minimax/*` では、`/fast on`（または `params.fastMode: true`）により `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
- Anthropic の明示的な `serviceTier`／`service_tier` モデルパラメーターと高速モードのデフォルトが両方設定されている場合、モデルパラメーターが優先されます。OpenClaw は引き続き、Anthropic 以外のプロキシベース URL では Anthropic サービス階層の注入をスキップします。
- 高速モードが有効な場合、`/status` には `Fast` が表示され、設定済みモードが自動の場合は `Fast:auto` が表示されます。

## 詳細ディレクティブ（/verbose または /v）

- レベル: `on`（最小限）| `full` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッションの詳細出力を切り替え、`Verbose logging enabled.`／`Verbose logging disabled.` と応答します。無効なレベルの場合は、状態を変更せずにヒントを返します。
- `/verbose off` は明示的なセッションオーバーライドを保存します。Sessions UI で `inherit` を選択すると解除できます。
- 認可された外部チャンネルの送信者は、セッションの詳細出力オーバーライドを永続化できます。内部の Gateway／Web チャットクライアントが永続化するには `operator.admin` が必要です。
- インラインディレクティブはそのメッセージにのみ影響し、それ以外ではセッション／グローバルのデフォルトが適用されます。
- 引数なしで `/verbose`（または `/verbose:`）を送信すると、現在の詳細レベルを確認できます。
- 詳細出力が有効な場合、構造化されたツール結果を生成するエージェントは、各ツール呼び出しを個別のメタデータのみのメッセージとして送り返します。利用可能な場合、先頭に `<emoji> <tool-name>: <arg>` が付きます。これらのツール概要は、ストリーミング差分としてではなく、各ツールの開始直後に個別の吹き出しとして送信されます。
- ツール失敗の概要は通常モードでも表示されますが、生のエラー詳細の接尾辞は、詳細レベルが `full` でない限り非表示になります。
- 詳細レベルが `full` の場合、ツール出力も完了後に転送されます（個別の吹き出しとして、安全な長さに切り詰められます）。実行中に `/verbose on|full|off` を切り替えると、それ以降のツール吹き出しには新しい設定が適用されます。
- `agents.defaults.toolProgressDetail` は、`/verbose` のツール概要と進捗下書きのツール行の形式を制御します。`🛠️ Exec: checking JS syntax` のような簡潔で人が理解しやすいラベルには `"explain"`（デフォルト）を使用します。デバッグ用に生のコマンド／詳細も追加する場合は `"raw"` を使用します。エージェントごとの `agents.list[].toolProgressDetail` はデフォルトを上書きします。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin トレースディレクティブ（/trace）

- レベル: `on` | `off`（デフォルト）。
- ディレクティブのみのメッセージでセッションの Plugin トレース出力を切り替え、`Plugin trace enabled.`／`Plugin trace disabled.` と応答します。
- インラインディレクティブはそのメッセージにのみ影響し、それ以外ではセッション／グローバルのデフォルトが適用されます。
- 引数なしで `/trace`（または `/trace:`）を送信すると、現在のトレースレベルを確認できます。
- `/trace` の範囲は `/verbose` より狭く、Active Memory のデバッグ概要など、Plugin が所有するトレース／デバッグ行のみを公開します。
- トレース行は `/status` に表示される場合があり、通常のアシスタント応答後に後続の診断メッセージとして表示される場合もあります。

## 推論の表示（/reasoning）

- レベル: `on|off|stream`。
- ディレクティブのみのメッセージで、返信に思考ブロックを表示するかどうかを切り替えます。
- 有効にすると、推論は先頭に `Thinking` が付いた**別のメッセージ**として送信されます。
- `stream`: アクティブなチャンネルが推論プレビューに対応している場合、返信の生成中に推論をストリーミングし、その後、推論を含まない最終回答を送信します。
- エイリアス: `/reason`。
- 引数なしで `/reasoning`（または `/reasoning:`）を送信すると、現在の推論レベルを確認できます。
- 解決順序: インラインディレクティブ、セッションオーバーライド、エージェントごとのデフォルト（`agents.list[].reasoningDefault`）、グローバルデフォルト（`agents.defaults.reasoningDefault`）、フォールバック（`off`）の順です。

不正なローカルモデルの推論タグは慎重に処理されます。閉じられた `<think>...</think>` ブロックは通常の返信では非表示のままとなり、すでに表示されているテキストの後にある閉じられていない推論も非表示になります。返信全体が単一の閉じられていない開始タグで囲まれており、そのままでは空のテキストとして配信される場合、OpenClaw は不正な開始タグを削除し、残りのテキストを配信します。

## 関連項目

- 昇格モードのドキュメントは[昇格モード](/ja-JP/tools/elevated)にあります。

## Heartbeat

- Heartbeat プローブの本文には、設定された Heartbeat プロンプトが使用されます（デフォルト: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat メッセージ内のインラインディレクティブは通常どおり適用されます（ただし、Heartbeat からセッションのデフォルトを変更することは避けてください）。
- Heartbeat の配信は、デフォルトでは最終ペイロードのみです。別の `Thinking` メッセージも送信するには（利用可能な場合）、`agents.defaults.heartbeat.includeReasoning: true` またはエージェントごとの `agents.list[].heartbeat.includeReasoning: true` を設定します。

## Web チャット UI

- ページの読み込み時、Web チャットの思考セレクターには、受信セッションのストアまたは設定に保存されているセッションのレベルが反映されます。
- 別のレベルを選択すると、`sessions.patch` によってセッションオーバーライドが即座に書き込まれます。次回の送信を待つことはなく、1 回限りの `thinkingOnce` オーバーライドでもありません。
- モデル、推論、または速度のピッカーへの変更がまだ適用中の状態で送信すると、保留中のすべてのピッカーパッチが完了するまで待機します。変更に失敗した場合、確認できるようにメッセージは未送信のままになります。
- 最初のオプションは常にオーバーライドを解除する選択肢です。継承された思考が無効な場合の `Inherited: Off` を含め、`Inherited: <resolved level>` と表示されます。
- ピッカーで明示的に選択した項目には、プロバイダーのラベルがある場合はそれを維持しつつ、対応するレベルラベルがそのまま使用されます（たとえば、プロバイダーによってラベル付けされた `max` オプションでは `Maximum`）。
- ピッカーは Gateway のセッション行またはデフォルトから返される `thinkingLevels` を使用し、`thinkingOptions` はレガシーのラベル一覧として維持されます。ブラウザー UI は独自のプロバイダー正規表現一覧を保持せず、モデル固有のレベルセットは Plugin が所有します。
- `/think:<level>` も引き続き機能し、同じ保存済みセッションレベルを更新するため、チャットディレクティブとピッカーは同期された状態を維持します。

## プロバイダープロファイル

- プロバイダー Plugin は `resolveThinkingProfile(ctx)` を公開して、モデルが対応するレベルとデフォルトを定義できます。
- Claude モデルをプロキシするプロバイダー Plugin は、Anthropic の直接カタログとプロキシカタログの整合性を維持するため、`openclaw/plugin-sdk/provider-model-shared` の `resolveClaudeThinkingProfile(modelId)` を再利用する必要があります。
- 各プロファイルレベルには、保存される正規の `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max`、または `ultra`）があり、表示用の `label` を含めることもできます。二値のプロバイダーは `{ id: "low", label: "on" }` を使用します。
- プロファイルフックは、利用可能な場合、`reasoning`、`compat.thinkingFormat`、`compat.supportedReasoningEfforts` を含む統合済みのカタログ情報を受け取ります。設定されたリクエスト契約が対応するペイロードをサポートする場合にのみ、これらの情報を使用して二値またはカスタムプロファイルを公開してください。
- 明示的な思考オーバーライドを検証する必要があるツール Plugin は、`api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` と `api.runtime.agent.normalizeThinkingLevel(...)` を使用し、独自のプロバイダーまたはモデルのレベル一覧を保持しないでください。常に埋め込みで実行される場合など、ツールが実行パスを所有する場合は `agentRuntime` を渡します。
- 設定済みのカスタムモデルメタデータにアクセスできるツール Plugin は、`catalog` を `resolveThinkingPolicy` に渡すことで、`compat.supportedReasoningEfforts` のオプトインを Plugin 側の検証に反映できます。
- 公開済みのレガシーフック（`supportsXHighThinking`、`isBinaryThinking`、`resolveDefaultThinkingLevel`）は互換性アダプターとして維持されますが、新しいカスタムレベルセットでは `resolveThinkingProfile` を使用する必要があります。
- Gateway の行またはデフォルトは `thinkingLevels`、`thinkingOptions`、`thinkingDefault` を公開するため、ACP/チャットクライアントはランタイム検証で使用されるものと同じプロファイル ID とラベルをレンダリングできます。

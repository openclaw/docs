---
read_when:
    - プロバイダごとのモデル設定リファレンスが必要です
    - モデルプロバイダの設定例やCLIのオンボーディングコマンドが必要です
summary: モデルプロバイダの概要と設定例 + CLIフロー
title: モデルプロバイダ＿日本assistant to=functions.read  კომენტary  北京赛车有json  content={"path":"../AGENTS.md","offset":1,"limit":200}
x-i18n:
    generated_at: "2026-04-21T04:44:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66bb2b5c7676db75f1a078b94e26f07509bd1712b94da9358f8cba8db1e068d2
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダ

このページでは、**LLM/モデルプロバイダ**を扱います（WhatsApp/Telegramのようなチャットチャネルではありません）。  
モデル選択ルールについては、[/concepts/models](/ja-JP/concepts/models) を参照してください。

## クイックルール

- モデル参照は `provider/model` を使います（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` を設定すると、それが許可リストになります。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- フォールバック実行時ルール、クールダウンプローブ、セッションオーバーライドの永続化は、[/concepts/model-failover](/ja-JP/concepts/model-failover) に記載されています。
- `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータです。`models.providers.*.models[].contextTokens` は実行時の実効上限です。
- プロバイダPluginは `registerProvider({ catalog })` によってモデルカタログを注入できます。OpenClawはその出力を `models.providers` にマージしてから `models.json` を書き込みます。
- プロバイダマニフェストでは `providerAuthEnvVars` と `providerAuthAliases` を宣言できるため、汎用の環境変数ベース認証プローブやプロバイダバリアントでPlugin実行時を読み込む必要がありません。残っているコアの環境変数マップは、非Plugin/コアプロバイダと、AnthropicのAPIキー優先オンボーディングのようないくつかの汎用優先順位ケースのためだけになりました。
- プロバイダPluginは、`normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、`onModelSelected` を通じて、プロバイダ実行時の動作も所有できます。
- 注: プロバイダ実行時の `capabilities` は共有ランナーのメタデータです（プロバイダファミリー、トランスクリプト/ツールの癖、トランスポート/キャッシュのヒント）。これは、Pluginが何を登録するか（テキスト推論、音声など）を記述する[公開capabilityモデル](/ja-JP/plugins/architecture#public-capability-model)とは別物です。
- バンドル版の `codex` プロバイダは、バンドル版Codexエージェントハーネスと組みになっています。Codex管理のログイン、モデル検出、ネイティブスレッド再開、アプリサーバー実行が必要な場合は `codex/gpt-*` を使ってください。通常の `openai/gpt-*` 参照は、引き続きOpenAIプロバイダと通常のOpenClawプロバイダトランスポートを使います。Codex専用デプロイでは、`agents.defaults.embeddedHarness.fallback: "none"` によって自動PIフォールバックを無効にできます。詳細は [Codex Harness](/ja-JP/plugins/codex-harness) を参照してください。

## Pluginが所有するプロバイダ動作

現在では、OpenClawが汎用推論ループを維持しつつ、プロバイダ固有のロジックの大半をプロバイダPluginが所有できます。

一般的な分担:

- `auth[].run` / `auth[].runNonInteractive`: プロバイダが `openclaw onboard`、`openclaw models auth`、ヘッドレスセットアップ向けのオンボーディング/ログインフローを所有する
- `wizard.setup` / `wizard.modelPicker`: プロバイダが認証選択ラベル、レガシーエイリアス、オンボーディング許可リストのヒント、オンボーディング/モデルピッカー内のセットアップ項目を所有する
- `catalog`: プロバイダが `models.providers` に現れる
- `normalizeModelId`: プロバイダが、検索または正規化の前にレガシー/プレビューモデルIDを正規化する
- `normalizeTransport`: プロバイダが、汎用モデル組み立ての前にトランスポートファミリー `api` / `baseUrl` を正規化する。OpenClawはまず一致したプロバイダを確認し、その後、実際にトランスポートを変更するまで他のフック対応プロバイダPluginも確認します
- `normalizeConfig`: プロバイダが、実行時に使われる前の `models.providers.<id>` 設定を正規化する。OpenClawはまず一致したプロバイダを確認し、その後、実際に設定を変更するまで他のフック対応プロバイダPluginも確認します。どのプロバイダフックも設定を書き換えない場合、バンドル版Googleファミリーヘルパーが引き続き対応するGoogleプロバイダエントリを正規化します。
- `applyNativeStreamingUsageCompat`: プロバイダが、設定されたプロバイダ向けにエンドポイント駆動のネイティブストリーミング使用量互換リライトを適用する
- `resolveConfigApiKey`: プロバイダが、完全な実行時認証の読み込みを強制せずに、設定済みプロバイダ向けの環境変数マーカー認証を解決する。`amazon-bedrock` には、Bedrock実行時認証がAWS SDKのデフォルトチェーンを使うにもかかわらず、ここに組み込みのAWS環境変数マーカーリゾルバもあります。
- `resolveSyntheticAuth`: プロバイダが、平文シークレットを永続化せずに、ローカル/セルフホスト型やその他の設定ベース認証の可用性を公開できる
- `shouldDeferSyntheticProfileAuth`: プロバイダが、保存済みの合成プロファイルプレースホルダを環境変数/設定ベース認証より低い優先順位として扱える
- `resolveDynamicModel`: プロバイダが、ローカル静的カタログにまだ存在しないモデルIDを受け入れる
- `prepareDynamicModel`: プロバイダが、動的解決の再試行前にメタデータ更新を必要とする
- `normalizeResolvedModel`: プロバイダが、トランスポートまたはベースURLのリライトを必要とする
- `contributeResolvedModelCompat`: プロバイダが、別の互換トランスポート経由で到着した場合でも、自ベンダーのモデル向け互換フラグを提供する
- `capabilities`: プロバイダがトランスクリプト/ツール/プロバイダファミリーの癖を公開する
- `normalizeToolSchemas`: プロバイダが、埋め込みランナーが見る前にツールスキーマを整理する
- `inspectToolSchemas`: プロバイダが、正規化後にトランスポート固有のスキーマ警告を表面化する
- `resolveReasoningOutputMode`: プロバイダが、ネイティブ契約とタグ付き推論出力契約のどちらを使うかを選ぶ
- `prepareExtraParams`: プロバイダが、モデルごとのリクエストパラメータをデフォルト設定または正規化する
- `createStreamFn`: プロバイダが、通常のストリーム経路を完全にカスタムなトランスポートに置き換える
- `wrapStreamFn`: プロバイダが、リクエストヘッダ/本文/モデル互換ラッパーを適用する
- `resolveTransportTurnState`: プロバイダが、ターンごとのネイティブトランスポートヘッダまたはメタデータを提供する
- `resolveWebSocketSessionPolicy`: プロバイダが、ネイティブWebSocketセッションヘッダまたはセッションクールダウンポリシーを提供する
- `createEmbeddingProvider`: プロバイダが、コアの埋め込みスイッチボードではなくプロバイダPluginに属するメモリ埋め込み動作を所有する
- `formatApiKey`: プロバイダが、保存済み認証プロファイルをトランスポートが期待する実行時 `apiKey` 文字列に整形する
- `refreshOAuth`: 共有 `pi-ai` リフレッシャーでは不十分な場合に、プロバイダがOAuth更新を所有する
- `buildAuthDoctorHint`: OAuth更新に失敗したとき、プロバイダが修復ガイダンスを追加する
- `matchesContextOverflowError`: プロバイダが、汎用ヒューリスティクスでは見落とすプロバイダ固有のコンテキストウィンドウ超過エラーを認識する
- `classifyFailoverReason`: プロバイダが、プロバイダ固有の生トランスポート/APIエラーを、レート制限や過負荷などのフェイルオーバー理由に対応付ける
- `isCacheTtlEligible`: プロバイダが、どの上流モデルIDがプロンプトキャッシュTTLに対応するかを判定する
- `buildMissingAuthMessage`: プロバイダが、汎用認証ストアエラーをプロバイダ固有の復旧ヒントに置き換える
- `suppressBuiltInModel`: プロバイダが、古くなった上流行を隠し、直接解決失敗時にベンダー所有のエラーを返せる
- `augmentModelCatalog`: プロバイダが、検出と設定マージの後に合成/最終カタログ行を追加する
- `isBinaryThinking`: プロバイダが、二値のオン/オフ思考UXを所有する
- `supportsXHighThinking`: プロバイダが、選択したモデルを `xhigh` に対応させる
- `resolveDefaultThinkingLevel`: プロバイダが、モデルファミリー向けのデフォルト `/think` ポリシーを所有する
- `applyConfigDefaults`: プロバイダが、認証モード、環境変数、またはモデルファミリーに基づいて、設定具体化時にプロバイダ固有のグローバルデフォルトを適用する
- `isModernModelRef`: プロバイダが、live/smoke用の優先モデル照合を所有する
- `prepareRuntimeAuth`: プロバイダが、設定済み認証情報を短命な実行時トークンに変換する
- `resolveUsageAuth`: プロバイダが、`/usage` および関連するステータス/レポート画面向けの使用量/クォータ認証情報を解決する
- `fetchUsageSnapshot`: プロバイダが、使用量エンドポイントの取得/解析を所有し、コアは引き続き要約シェルと整形を所有する
- `onModelSelected`: プロバイダが、テレメトリやプロバイダ所有セッション記録など、選択後の副作用を実行する

現在のバンドル例:

- `anthropic`: Claude 4.6の前方互換フォールバック、認証修復ヒント、使用量エンドポイント取得、キャッシュTTL/プロバイダファミリーメタデータ、認証対応のグローバル設定デフォルト
- `amazon-bedrock`: Bedrock固有のスロットリング/未準備エラーに対する、プロバイダ所有のコンテキスト超過判定とフェイルオーバー理由分類。加えて、Anthropicトラフィック上のClaude専用リプレイポリシーガード向け共有 `anthropic-by-model` リプレイファミリー
- `anthropic-vertex`: Anthropicメッセージトラフィック上のClaude専用リプレイポリシーガード
- `openrouter`: パススルーのモデルID、リクエストラッパー、プロバイダcapabilityヒント、プロキシGeminiトラフィック上のGemini thought-signature正規化、`openrouter-thinking` ストリームファミリー経由のプロキシ推論注入、ルーティングメタデータ転送、キャッシュTTLポリシー
- `github-copilot`: オンボーディング/デバイスログイン、前方互換モデルフォールバック、Claude-thinkingトランスクリプトヒント、実行時トークン交換、使用量エンドポイント取得
- `openai`: GPT-5.4の前方互換フォールバック、直接OpenAIトランスポート正規化、Codex対応の認証不足ヒント、Spark抑制、合成OpenAI/Codexカタログ行、thinking/live-modelポリシー、使用量トークンエイリアス正規化（`input` / `output` および `prompt` / `completion` ファミリー）、ネイティブOpenAI/Codexラッパー向け共有 `openai-responses-defaults` ストリームファミリー、プロバイダファミリーメタデータ、`gpt-image-1` 用のバンドル画像生成プロバイダ登録、および `sora-2` 用のバンドル動画生成プロバイダ登録
- `google` と `google-gemini-cli`: Gemini 3.1の前方互換フォールバック、ネイティブGeminiリプレイ検証、ブートストラップリプレイ正規化、タグ付き推論出力モード、modern-model照合、Gemini image-previewモデル向けバンドル画像生成プロバイダ登録、およびVeoモデル向けバンドル動画生成プロバイダ登録。Gemini CLI OAuthは、認証プロファイルトークン整形、使用量トークン解析、使用量画面向けクォータエンドポイント取得も所有します
- `moonshot`: 共有トランスポート、Plugin所有のthinkingペイロード正規化
- `kilocode`: 共有トランスポート、Plugin所有のリクエストヘッダ、推論ペイロード正規化、プロキシGemini thought-signature正規化、キャッシュTTLポリシー
- `zai`: GLM-5の前方互換フォールバック、`tool_stream` デフォルト、キャッシュTTLポリシー、二値thinking/live-modelポリシー、使用量認証 + クォータ取得。未知の `glm-5*` IDは、バンドル版 `glm-4.7` テンプレートから合成されます
- `xai`: ネイティブResponsesトランスポート正規化、Grok fastバリアント向け `/fast` エイリアス書き換え、デフォルト `tool_stream`、xAI固有のツールスキーマ/推論ペイロード整形、および `grok-imagine-video` 用のバンドル動画生成プロバイダ登録
- `mistral`: Plugin所有のcapabilityメタデータ
- `opencode` と `opencode-go`: Plugin所有のcapabilityメタデータに加え、プロキシGemini thought-signature正規化
- `alibaba`: `alibaba/wan2.6-t2v` のような直接Wanモデル参照向けの、Plugin所有動画生成カタログ
- `byteplus`: Plugin所有カタログに加え、Seedance text-to-video/image-to-videoモデル向けのバンドル動画生成プロバイダ登録
- `fal`: ホスト型サードパーティ動画モデル向けのバンドル動画生成プロバイダ登録に加え、FLUX画像モデル向けのホスト型サードパーティ画像生成プロバイダ登録
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`, `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, `volcengine`: Plugin所有カタログのみ
- `qwen`: テキストモデル向けPlugin所有カタログに加え、そのマルチモーダル画面向けの共有メディア理解および動画生成プロバイダ登録。Qwenの動画生成は、`wan2.6-t2v` や `wan2.7-r2v` などのバンドルWanモデルとともに、標準DashScope動画エンドポイントを使います
- `runway`: `gen4.5` のようなネイティブRunwayタスクベースモデル向けの、Plugin所有動画生成プロバイダ登録
- `minimax`: Plugin所有カタログ、Hailuo動画モデル向けバンドル動画生成プロバイダ登録、`image-01` 向けバンドル画像生成プロバイダ登録、ハイブリッドAnthropic/OpenAIリプレイポリシー選択、使用量認証/スナップショットロジック
- `together`: Plugin所有カタログに加え、Wan動画モデル向けのバンドル動画生成プロバイダ登録
- `xiaomi`: Plugin所有カタログに加え、使用量認証/スナップショットロジック

バンドル版 `openai` Pluginは、現在 `openai` と `openai-codex` の両方のプロバイダIDを所有しています。

ここまでが、OpenClawの通常トランスポートにまだ収まるプロバイダです。完全にカスタムのリクエスト実行器を必要とするプロバイダは、別のより深い拡張画面になります。

## APIキーのローテーション

- 選択されたプロバイダでは、汎用プロバイダローテーションをサポートします。
- 複数キーは次で設定します:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のlive上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト。例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダでは、フォールバックとして `GOOGLE_API_KEY` も含まれます。
- キー選択順は優先順位を保持しつつ、値の重複を取り除きます。
- リクエストは、レート制限応答のときだけ次のキーで再試行されます（たとえば `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダ（pi-aiカタログ）

OpenClawにはpi‑aiカタログが同梱されています。これらのプロバイダには **`models.providers` 設定は不要** です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダ: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトトランスポートは `auto`（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- OpenAI Responses WebSocketウォームアップは、`params.openaiWsWarmup`（`true`/`false`）でデフォルト有効です
- OpenAIの優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responsesリクエストを `api.openai.com` 上の `service_tier=priority` に対応付けます
- 共有 `/fast` トグルではなく明示的なティアを使いたい場合は `params.serviceTier` を使ってください
- 隠しOpenClaw帰属ヘッダ（`originator`、`version`、`User-Agent`）は、汎用OpenAI互換プロキシではなく、`api.openai.com` へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responses `store`、プロンプトキャッシュヒント、OpenAI推論互換のペイロード整形も維持されます。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、live OpenAI APIが拒否するため、OpenClawでは意図的に抑制されています。SparkはCodex専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダ: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストでは、共有 `/fast` トグルと `params.fastMode` をサポートします。これには `api.anthropic.com` に送られるAPIキー認証およびOAuth認証トラフィックが含まれます。OpenClawはこれをAnthropicの `service_tier`（`auto` と `standard_only`）に対応付けます
- Anthropic注記: Anthropicスタッフから、OpenClaw形式のClaude CLI利用は再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはClaude CLI再利用と `claude -p` 利用をこの統合における許可済み手段として扱います。
- Anthropic setup-tokenは、サポートされるOpenClawトークン経路として引き続き利用可能ですが、OpenClawは利用可能な場合、現在はClaude CLI再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- プロバイダ: `openai-codex`
- 認証: OAuth（ChatGPT）
- モデル例: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトトランスポートは `auto`（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- `params.serviceTier` も、ネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）で転送されます
- 隠しOpenClaw帰属ヘッダ（`originator`、`version`、`User-Agent`）は、汎用OpenAI互換プロキシではなく、`chatgpt.com/backend-api` へのネイティブCodexトラフィックにのみ付与されます
- 直接の `openai/*` と同じ `/fast` トグルと `params.fastMode` 設定を共有し、OpenClawはこれを `service_tier=priority` に対応付けます
- `openai-codex/gpt-5.3-codex-spark` は、Codex OAuthカタログが公開している場合は引き続き利用可能です。権利依存です
- `openai-codex/gpt-5.4` は、ネイティブ `contextWindow = 1050000` とデフォルト実行時 `contextTokens = 272000` を維持します。実行時上限は `models.providers.openai-codex.models[].contextTokens` で上書きしてください
- ポリシー注記: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### その他のサブスクリプション型ホストオプション

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloudプロバイダ画面に加え、Alibaba DashScopeおよびCoding Planエンドポイント対応
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Planまたは一般APIエンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zen実行時プロバイダ: `opencode`
- Go実行時プロバイダ: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（APIキー）

- プロバイダ: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使うレガシーOpenClaw設定は、`google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`（またはレガシー `cached_content`）も受け付け、プロバイダネイティブな `cachedContents/...` ハンドルを転送します。GeminiのキャッシュヒットはOpenClaw `cacheRead` として表面化します

### Google Vertex と Gemini CLI

- プロバイダ: `google-vertex`, `google-gemini-cli`
- 認証: Vertexはgcloud ADCを使用し、Gemini CLIはそのOAuthフローを使用します
- 注意: OpenClawでのGemini CLI OAuthは非公式の統合です。サードパーティクライアント使用後にGoogleアカウントの制限が発生したという報告があります。進める場合は、Googleの利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuthは、バンドル版 `google` Pluginの一部として提供されます。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json` にclient idやsecretを貼り付ける必要は**ありません**。CLIログインフローは、トークンをGatewayホスト上の認証プロファイルに保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLIのJSON応答は `response` から解析され、使用量は `stats` にフォールバックします。`stats.cached` はOpenClawの `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダ: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定の画面を強制します

### Vercel AI Gateway

- プロバイダ: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダ: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が同梱されています。liveの `https://api.kilo.ai/api/gateway/models` 検出によって、実行時カタログがさらに拡張される場合があります。
- `kilocode/kilo/auto` の背後にある正確な上流ルーティングはKilo Gatewayが所有しており、OpenClawにハードコードされていません。

設定の詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル版プロバイダPlugin

- OpenRouter: `openrouter`（`OPENROUTER_API_KEY`）
- モデル例: `openrouter/auto`
- OpenClawは、リクエストの宛先が実際に `openrouter.ai` の場合にのみ、OpenRouterで文書化されているアプリ帰属ヘッダを適用します
- OpenRouter固有のAnthropic `cache_control` マーカーも同様に、任意のプロキシURLではなく、検証済みのOpenRouterルートにのみ適用されます
- OpenRouterは引き続きプロキシ型のOpenAI互換経路上にあるため、ネイティブOpenAI専用のリクエスト整形（`serviceTier`、Responses `store`、プロンプトキャッシュヒント、OpenAI推論互換ペイロード）は転送されません
- GeminiベースのOpenRouter参照では、プロキシGemini thought-signature正規化のみが維持されます。ネイティブGeminiリプレイ検証とブートストラップ書き換えは無効のままです
- Kilo Gateway: `kilocode`（`KILOCODE_API_KEY`）
- モデル例: `kilocode/kilo/auto`
- GeminiベースのKilo参照でも、同じプロキシGemini thought-signature正規化経路が維持されます。`kilocode/kilo/auto` や、その他のプロキシ推論未対応ヒントでは、プロキシ推論注入はスキップされます
- MiniMax: `minimax`（APIキー）および `minimax-portal`（OAuth）
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`
- モデル例: `minimax/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7`
- MiniMaxオンボーディング/APIキー設定では、`input: ["text", "image"]` を持つ明示的なM2.7モデル定義が書き込まれます。バンドル版プロバイダカタログでは、そのプロバイダ設定が具体化されるまではチャット参照はテキスト専用のままです
- Moonshot: `moonshot`（`MOONSHOT_API_KEY`）
- モデル例: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi`（`KIMI_API_KEY` または `KIMICODE_API_KEY`）
- モデル例: `kimi/kimi-code`
- Qianfan: `qianfan`（`QIANFAN_API_KEY`）
- モデル例: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen`（`QWEN_API_KEY`、`MODELSTUDIO_API_KEY`、または `DASHSCOPE_API_KEY`）
- モデル例: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia`（`NVIDIA_API_KEY`）
- モデル例: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan`（`STEPFUN_API_KEY`）
- モデル例: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together`（`TOGETHER_API_KEY`）
- モデル例: `together/moonshotai/Kimi-K2.5`
- Venice: `venice`（`VENICE_API_KEY`）
- Xiaomi: `xiaomi`（`XIAOMI_API_KEY`）
- モデル例: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway`（`AI_GATEWAY_API_KEY`）
- Hugging Face Inference: `huggingface`（`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`）
- Cloudflare AI Gateway: `cloudflare-ai-gateway`（`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine: `volcengine`（`VOLCANO_ENGINE_API_KEY`）
- モデル例: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus`（`BYTEPLUS_API_KEY`）
- モデル例: `byteplus-plan/ark-code-latest`
- xAI: `xai`（`XAI_API_KEY`）
  - ネイティブのバンドル版xAIリクエストはxAI Responses経路を使います
  - `/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます
  - `tool_stream` はデフォルトで有効です。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定してください
- Mistral: `mistral`（`MISTRAL_API_KEY`）
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`（`GROQ_API_KEY`）
- Cerebras: `cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras上のGLMモデルは `zai-glm-4.7` および `zai-glm-4.6` というIDを使います。
  - OpenAI互換ベースURL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inferenceのモデル例: `huggingface/deepseek-ai/DeepSeek-R1`。CLI: `openclaw onboard --auth-choice huggingface-api-key`。詳細は [Hugging Face (Inference)](/ja-JP/providers/huggingface) を参照してください。

## `models.providers` 経由のプロバイダ（カスタム/ベースURL）

**カスタム**プロバイダやOpenAI/Anthropic互換プロキシを追加するには、`models.providers`（または `models.json`）を使います。

以下のバンドル版プロバイダPluginの多くは、すでにデフォルトカタログを公開しています。デフォルトのベースURL、ヘッダ、またはモデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使ってください。

### Moonshot AI（Kimi）

Moonshotはバンドル版プロバイダPluginとして提供されます。通常は組み込みプロバイダを使用し、ベースURLまたはモデルメタデータを上書きする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダ: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2モデルID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Codingは、Moonshot AIのAnthropic互換エンドポイントを使います。

- プロバイダ: `kimi`
- 認証: `KIMI_API_KEY`
- モデル例: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

レガシーの `kimi/k2p5` も互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoやその他のモデルへのアクセスを提供します。

- プロバイダ: `volcengine`（coding: `volcengine-plan`）
- 認証: `VOLCANO_ENGINE_API_KEY`
- モデル例: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcoding画面を使いますが、一般向けの `volcengine/*` カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、Volcengineの認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダスコープ付きピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`（Kimi K2.5）
- `volcengine/glm-4-7-251222`（GLM 4.7）
- `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

Codingモデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（International）

BytePlus ARKは、国際ユーザー向けにVolcano Engineと同じモデルへのアクセスを提供します。

- プロバイダ: `byteplus`（coding: `byteplus-plan`）
- 認証: `BYTEPLUS_API_KEY`
- モデル例: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcoding画面を使いますが、一般向けの `byteplus/*` カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、BytePlusの認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClawは空のプロバイダスコープ付きピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228`（Seed 1.8）
- `byteplus/kimi-k2-5-260127`（Kimi K2.5）
- `byteplus/glm-4-7-251222`（GLM 4.7）

Codingモデル（`byteplus-plan`）:

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Syntheticは、`synthetic` プロバイダの背後でAnthropic互換モデルを提供します。

- プロバイダ: `synthetic`
- 認証: `SYNTHETIC_API_KEY`
- モデル例: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMaxはカスタムエンドポイントを使うため、`models.providers` 経由で設定します。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（Global）: `--auth-choice minimax-global-api`
- MiniMax APIキー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、設定スニペットは [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMaxのAnthropic互換ストリーミング経路では、明示的に設定しない限り、OpenClawはデフォルトでthinkingを無効にします。また `/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Plugin所有のcapability分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方のMiniMax認証経路でPlugin所有の `MiniMax-VL-01` です
- Web検索はプロバイダID `minimax` のままです

### LM Studio

LM Studioは、ネイティブAPIを使うバンドル版プロバイダPluginとして提供されます。

- プロバイダ: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

次にモデルを設定します（`http://localhost:1234/api/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出と自動ロードにLM Studioネイティブの `/api/v1/models` と `/api/v1/models/load` を使い、デフォルトでは推論に `/v1/chat/completions` を使います。セットアップとトラブルシューティングは [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollamaはバンドル版プロバイダPluginとして提供され、OllamaのネイティブAPIを使います。

- プロバイダ: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollamaをインストールしてから、モデルをpullします:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollamaは、`OLLAMA_API_KEY` でオプトインすると `http://127.0.0.1:11434` でローカル検出され、バンドル版プロバイダPluginはOllamaを `openclaw onboard` とモデルピッカーに直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定は [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLMは、ローカル/セルフホスト型のOpenAI互換サーバー向けバンドル版プロバイダPluginとして提供されます。

- プロバイダ: `vllm`
- 認証: 任意（サーバー構成による）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLangは、高速なセルフホスト型OpenAI互換サーバー向けバンドル版プロバイダPluginとして提供されます。

- プロバイダ: `sglang`
- 認証: 任意（サーバー構成による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルプロキシ（LM Studio、vLLM、LiteLLMなど）

例（OpenAI互換）:

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

注記:

- カスタムプロバイダでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。
  省略した場合、OpenClawは次をデフォルトとして使います:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの制限に合う明示的な値を設定してください。
- 非ネイティブエンドポイント上の `api: "openai-completions"`（`api.openai.com` ではないホストを持つ、空でない `baseUrl`）では、未対応の `developer` ロールによるプロバイダ400エラーを避けるため、OpenClawは `compat.supportsDeveloperRole: false` を強制します。
- プロキシ型のOpenAI互換ルートでは、ネイティブOpenAI専用のリクエスト整形もスキップされます。`service_tier` なし、Responses `store` なし、プロンプトキャッシュヒントなし、OpenAI推論互換ペイロード整形なし、隠しOpenClaw帰属ヘッダなしです。
- `baseUrl` が空または省略されている場合、OpenClawはデフォルトのOpenAI動作を維持します（これは `api.openai.com` に解決されます）。
- 安全のため、非ネイティブ `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

あわせて参照: 完全な設定例は [/gateway/configuration](/ja-JP/gateway/configuration) を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダごとのセットアップガイド

---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドが必要です
summary: モデルプロバイダーの概要（設定例とCLIフロー付き）
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-21T13:35:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6732ab672757579c09395583a0f7d110348c909d4e4ab1d2accad68ad054c636
    source_path: concepts/model-providers.md
    workflow: 15
---

# モデルプロバイダー

このページでは、**LLM/モデルプロバイダー**（WhatsApp/Telegramのようなチャットチャネルではありません）を扱います。
モデル選択ルールについては、[/concepts/models](/ja-JP/concepts/models)を参照してください。

## クイックルール

- モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` を設定すると、それが許可リストになります。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- フォールバックのランタイムルール、クールダウンプローブ、セッション上書きの永続化は、[/concepts/model-failover](/ja-JP/concepts/model-failover)に記載されています。
- `models.providers.*.models[].contextWindow` はネイティブのモデルメタデータです。
  `models.providers.*.models[].contextTokens` は実効ランタイム上限です。
- Provider Plugin は、`registerProvider({ catalog })` を介してモデルカタログを注入できます。
  OpenClaw はその出力を `models.providers` にマージしてから
  `models.json` に書き込みます。
- プロバイダーマニフェストでは `providerAuthEnvVars` と
  `providerAuthAliases` を宣言できるため、汎用の環境変数ベース認証プローブやプロバイダーバリアントで、Plugin ランタイムを読み込む必要がありません。現在、残っているコアの環境変数マップは、非Plugin/コアプロバイダーと、Anthropicの「APIキー優先」オンボーディングのような一部の汎用優先順位ケース向けだけです。
- Provider Plugin は、以下を通じてプロバイダーのランタイム動作も所有できます。
  `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、
  `applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、
  `resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、
  `resolveDynamicModel`、`prepareDynamicModel`、
  `normalizeResolvedModel`、`contributeResolvedModelCompat`、
  `capabilities`、`normalizeToolSchemas`、
  `inspectToolSchemas`、`resolveReasoningOutputMode`、
  `prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、
  `resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、
  `createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、
  `buildAuthDoctorHint`、
  `matchesContextOverflowError`、`classifyFailoverReason`、
  `isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、
  `augmentModelCatalog`、`resolveThinkingProfile`、`isBinaryThinking`、
  `supportsXHighThinking`、`resolveDefaultThinkingLevel`、
  `applyConfigDefaults`、`isModernModelRef`、
  `prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`、および
  `onModelSelected`。
- 注: プロバイダーランタイムの `capabilities` は共有ランナーメタデータです（プロバイダーファミリー、トランスクリプト/ツーリングの癖、トランスポート/キャッシュのヒント）。これは、Plugin が何を登録するか（テキスト推論、音声など）を記述する[公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model)とは異なります。
- バンドルされている `codex` プロバイダーは、バンドルされている Codex エージェントハーネスと組み合わされています。
  Codex が所有するログイン、モデル検出、ネイティブスレッド再開、アプリサーバー実行が必要な場合は、`codex/gpt-*` を使用してください。通常の `openai/gpt-*` 参照は、引き続き OpenAI プロバイダーと通常の OpenClaw プロバイダートランスポートを使用します。
  Codex 専用デプロイでは、
  `agents.defaults.embeddedHarness.fallback: "none"` により自動 PI フォールバックを無効化できます。詳細は
  [Codex Harness](/ja-JP/plugins/codex-harness)を参照してください。

## Plugin が所有するプロバイダー動作

Provider Plugin は、OpenClaw が汎用推論ループを維持したまま、ほとんどのプロバイダー固有ロジックを所有できるようになりました。

一般的な分担:

- `auth[].run` / `auth[].runNonInteractive`: プロバイダーが `openclaw onboard`、`openclaw models auth`、およびヘッドレスセットアップ向けのオンボーディング/ログインフローを所有
- `wizard.setup` / `wizard.modelPicker`: プロバイダーが認証選択ラベル、レガシーエイリアス、オンボーディング許可リストのヒント、オンボーディング/モデルピッカー内のセットアップ項目を所有
- `catalog`: プロバイダーが `models.providers` に表示される
- `normalizeModelId`: プロバイダーが、ルックアップまたは正規化の前にレガシー/プレビューのモデルIDを正規化する
- `normalizeTransport`: プロバイダーが、汎用モデル組み立ての前にトランスポートファミリーの `api` / `baseUrl` を正規化する。OpenClaw はまず一致したプロバイダーを確認し、その後、実際にトランスポートを変更したものが見つかるまで、他のフック対応 Provider Plugin を確認する
- `normalizeConfig`: プロバイダーが、ランタイムで使用する前に `models.providers.<id>` 設定を正規化する。OpenClaw はまず一致したプロバイダーを確認し、その後、実際に設定を変更したものが見つかるまで、他のフック対応 Provider Plugin を確認する。どのプロバイダーフックも設定を書き換えない場合、バンドルされている Google ファミリーヘルパーが、サポート対象の Google プロバイダーエントリーを引き続き正規化する。
- `applyNativeStreamingUsageCompat`: プロバイダーが、設定プロバイダー向けに、エンドポイント駆動のネイティブ streaming-usage 互換書き換えを適用する
- `resolveConfigApiKey`: プロバイダーが、完全なランタイム認証の読み込みを強制せずに、設定プロバイダー向けの環境変数マーカー認証を解決する。`amazon-bedrock` にはここに組み込みの AWS 環境変数マーカーリゾルバーもありますが、Bedrock のランタイム認証自体は AWS SDK のデフォルトチェーンを使用します。
- `resolveSyntheticAuth`: プロバイダーは、平文シークレットを永続化せずに、ローカル/セルフホスト環境やその他の設定ベース認証の可用性を公開できる
- `shouldDeferSyntheticProfileAuth`: プロバイダーは、保存された synthetic プロファイルプレースホルダーを、環境変数/設定ベース認証より優先度が低いものとして扱える
- `resolveDynamicModel`: プロバイダーは、ローカルの静的カタログにまだ存在しないモデルIDを受け入れる
- `prepareDynamicModel`: プロバイダーは、動的解決の再試行前にメタデータ更新を必要とする
- `normalizeResolvedModel`: プロバイダーは、トランスポートまたはベースURLの書き換えを必要とする
- `contributeResolvedModelCompat`: プロバイダーは、互換性のある別トランスポート経由で届いた場合でも、自身のベンダーモデル向け互換フラグを提供する
- `capabilities`: プロバイダーは、トランスクリプト/ツーリング/プロバイダーファミリーの癖を公開する
- `normalizeToolSchemas`: プロバイダーは、埋め込みランナーが見る前にツールスキーマを整える
- `inspectToolSchemas`: プロバイダーは、正規化後にトランスポート固有のスキーマ警告を表面化する
- `resolveReasoningOutputMode`: プロバイダーは、ネイティブまたはタグ付きの reasoning-output 契約を選択する
- `prepareExtraParams`: プロバイダーは、モデルごとのリクエストパラメータをデフォルト設定または正規化する
- `createStreamFn`: プロバイダーは、通常のストリームパスを完全にカスタムなトランスポートに置き換える
- `wrapStreamFn`: プロバイダーは、リクエストヘッダー/ボディ/モデル互換ラッパーを適用する
- `resolveTransportTurnState`: プロバイダーは、ターンごとのネイティブトランスポートヘッダーまたはメタデータを提供する
- `resolveWebSocketSessionPolicy`: プロバイダーは、ネイティブ WebSocket セッションヘッダーまたはセッションクールダウンポリシーを提供する
- `createEmbeddingProvider`: プロバイダーは、メモリ埋め込み動作がコアの埋め込みスイッチボードではなくプロバイダーPlugin に属する場合、その動作を所有する
- `formatApiKey`: プロバイダーは、保存された認証プロファイルを、トランスポートが期待するランタイム `apiKey` 文字列へ整形する
- `refreshOAuth`: 共有の `pi-ai` リフレッシャーでは不十分な場合、プロバイダーが OAuth 更新を所有する
- `buildAuthDoctorHint`: OAuth 更新が失敗した場合、プロバイダーは修復ガイダンスを追加する
- `matchesContextOverflowError`: プロバイダーは、汎用ヒューリスティクスでは見逃されるプロバイダー固有のコンテキストウィンドウ超過エラーを認識する
- `classifyFailoverReason`: プロバイダーは、プロバイダー固有の生のトランスポート/APIエラーを、レート制限や過負荷のようなフェイルオーバー理由にマッピングする
- `isCacheTtlEligible`: プロバイダーは、どの上流モデルIDがプロンプトキャッシュTTLをサポートするかを判断する
- `buildMissingAuthMessage`: プロバイダーは、汎用の認証ストアエラーを、プロバイダー固有の復旧ヒントに置き換える
- `suppressBuiltInModel`: プロバイダーは、古くなった上流行を非表示にでき、直接解決失敗時にはベンダー所有のエラーを返せる
- `augmentModelCatalog`: プロバイダーは、検出と設定マージの後で synthetic/final カタログ行を追加する
- `resolveThinkingProfile`: プロバイダーは、正確な `/think` レベルセット、任意の表示ラベル、および選択されたモデルのデフォルトレベルを所有する
- `isBinaryThinking`: バイナリのオン/オフ思考UX向け互換フック
- `supportsXHighThinking`: 選択された `xhigh` モデル向け互換フック
- `resolveDefaultThinkingLevel`: デフォルト `/think` ポリシー向け互換フック
- `applyConfigDefaults`: プロバイダーは、認証モード、環境変数、またはモデルファミリーに基づいて、設定具体化時にプロバイダー固有のグローバルデフォルトを適用する
- `isModernModelRef`: プロバイダーは、ライブ/スモークの優先モデル一致を所有する
- `prepareRuntimeAuth`: プロバイダーは、設定済み資格情報を短命のランタイムトークンへ変換する
- `resolveUsageAuth`: プロバイダーは、`/usage` および関連するステータス/レポート画面向けの使用量/クォータ資格情報を解決する
- `fetchUsageSnapshot`: プロバイダーは、使用量エンドポイントの取得/解析を所有し、コアは引き続き要約シェルと整形を所有する
- `onModelSelected`: プロバイダーは、テレメトリーやプロバイダー所有セッション管理など、選択後の副作用を実行する

現在のバンドル例:

- `anthropic`: Claude 4.6 の前方互換フォールバック、認証修復ヒント、使用量エンドポイント取得、cache-TTL/プロバイダーファミリーメタデータ、および認証を考慮したグローバル設定デフォルト
- `amazon-bedrock`: Bedrock 固有のスロットル/準備未完了エラーに対する、プロバイダー所有のコンテキストオーバーフロー判定とフェイルオーバー理由分類に加え、Anthropic トラフィック上の Claude 専用リプレイポリシーガード向けの共有 `anthropic-by-model` リプレイファミリー
- `anthropic-vertex`: Anthropic メッセージトラフィック上の Claude 専用リプレイポリシーガード
- `openrouter`: パススルーモデルID、リクエストラッパー、プロバイダー capability ヒント、プロキシ Gemini トラフィック上の Gemini thought-signature サニタイズ、`openrouter-thinking` ストリームファミリーを通じたプロキシ reasoning 注入、ルーティングメタデータ転送、および cache-TTL ポリシー
- `github-copilot`: オンボーディング/デバイスログイン、前方互換モデルフォールバック、Claude-thinking トランスクリプトヒント、ランタイムトークン交換、および使用量エンドポイント取得
- `openai`: GPT-5.4 の前方互換フォールバック、直接 OpenAI トランスポート正規化、Codex 対応の認証不足ヒント、Spark 抑制、synthetic OpenAI/Codex カタログ行、thinking/live-model ポリシー、使用量トークンエイリアス正規化（`input` / `output` および `prompt` / `completion` ファミリー）、ネイティブ OpenAI/Codex ラッパー向けの共有 `openai-responses-defaults` ストリームファミリー、プロバイダーファミリーメタデータ、`gpt-image-1` 向けのバンドル済み画像生成プロバイダー登録、および `sora-2` 向けのバンドル済み動画生成プロバイダー登録
- `google` と `google-gemini-cli`: Gemini 3.1 の前方互換フォールバック、ネイティブ Gemini リプレイ検証、ブートストラップリプレイサニタイズ、タグ付き reasoning-output モード、modern-model マッチング、Gemini image-preview モデル向けのバンドル済み画像生成プロバイダー登録、および Veo モデル向けのバンドル済み動画生成プロバイダー登録。Gemini CLI OAuth は、認証プロファイルトークン整形、使用量トークン解析、使用量画面向けクォータエンドポイント取得も所有します
- `moonshot`: 共有トランスポート、Plugin 所有の thinking ペイロード正規化
- `kilocode`: 共有トランスポート、Plugin 所有のリクエストヘッダー、reasoning ペイロード正規化、プロキシ Gemini thought-signature サニタイズ、および cache-TTL ポリシー
- `zai`: GLM-5 の前方互換フォールバック、`tool_stream` デフォルト、cache-TTL ポリシー、バイナリ thinking/live-model ポリシー、および使用量認証 + クォータ取得。未知の `glm-5*` ID は、バンドル済み `glm-4.7` テンプレートから合成されます
- `xai`: ネイティブ Responses トランスポート正規化、Grok 高速バリアント向け `/fast` エイリアス書き換え、デフォルト `tool_stream`、xAI 固有の tool-schema / reasoning-payload クリーンアップ、および `grok-imagine-video` 向けのバンドル済み動画生成プロバイダー登録
- `mistral`: Plugin 所有の capability メタデータ
- `opencode` と `opencode-go`: Plugin 所有の capability メタデータに加え、プロキシ Gemini thought-signature サニタイズ
- `alibaba`: `alibaba/wan2.6-t2v` のような直接 Wan モデル参照向けの、Plugin 所有の動画生成カタログ
- `byteplus`: Plugin 所有のカタログに加え、Seedance の text-to-video/image-to-video モデル向けのバンドル済み動画生成プロバイダー登録
- `fal`: ホストされたサードパーティ画像モデル向けのバンドル済み画像生成プロバイダー登録と、FLUX 画像モデル向けのバンドル済み画像生成プロバイダー登録に加え、ホストされたサードパーティ動画モデル向けのバンドル済み動画生成プロバイダー登録
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway`, および `volcengine`:
  Plugin 所有のカタログのみ
- `qwen`: テキストモデル向けの Plugin 所有カタログに加え、そのマルチモーダル画面向けの共有メディア理解および動画生成プロバイダー登録。Qwen の動画生成では、`wan2.6-t2v` や `wan2.7-r2v` のようなバンドル済み Wan モデルとともに、標準 DashScope 動画エンドポイントを使用します
- `runway`: `gen4.5` のようなネイティブ Runway タスクベースモデル向けの、Plugin 所有の動画生成プロバイダー登録
- `minimax`: Plugin 所有のカタログ、Hailuo 動画モデル向けのバンドル済み動画生成プロバイダー登録、`image-01` 向けのバンドル済み画像生成プロバイダー登録、ハイブリッド Anthropic/OpenAI リプレイポリシー選択、および使用量認証/スナップショットロジック
- `together`: Plugin 所有のカタログに加え、Wan 動画モデル向けのバンドル済み動画生成プロバイダー登録
- `xiaomi`: Plugin 所有のカタログに加え、使用量認証/スナップショットロジック

バンドルされている `openai` Plugin は、現在両方のプロバイダーIDを所有します: `openai` と
`openai-codex`。

以上が、OpenClaw の通常トランスポートにまだ収まるプロバイダーです。完全にカスタムなリクエスト実行器を必要とするプロバイダーは、別の、より深い拡張サーフェスになります。

## APIキーのローテーション

- 選択されたプロバイダー向けに、汎用のプロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りのリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）
- Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キーの選択順序は優先順位を維持し、値を重複排除します。
- リクエストは、レート制限レスポンスの場合にのみ次のキーで再試行されます（例:
  `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many
concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
  `workers_ai ... quota limit exceeded`、または定期的な使用量上限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-ai カタログ）

OpenClaw には pi‑ai カタログが同梱されています。これらのプロバイダーでは
`models.providers` の設定は**不要**です。認証を設定してモデルを選択するだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトトランスポートは `auto`（WebSocket 優先、SSE フォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- OpenAI Responses WebSocket ウォームアップは、`params.openaiWsWarmup`（`true`/`false`）でデフォルト有効です
- OpenAI priority processing は、`agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接 `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします
- 共有の `/fast` トグルではなく明示的な tier を指定したい場合は、`params.serviceTier` を使用してください
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用 OpenAI 互換プロキシではなく、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用されます
- ネイティブ OpenAI ルートでは、Responses の `store`、プロンプトキャッシュヒント、および OpenAI reasoning 互換ペイロード整形も維持されます。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、ライブ OpenAI API がこれを拒否するため、OpenClaw では意図的に抑制されています。Spark は Codex 専用として扱われます

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開 Anthropic リクエストは、`api.anthropic.com` に送信される API キー認証トラフィックと OAuth 認証トラフィックの両方を含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はこれを Anthropic の `service_tier`（`auto` vs `standard_only`）にマッピングします
- Anthropic に関する注記: Anthropic のスタッフから、OpenClaw 形式の Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合において Claude CLI の再利用と `claude -p` の利用を認可済みとして扱います。
- Anthropic setup-token は、引き続きサポートされる OpenClaw トークンパスとして利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code（Codex）

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- モデル例: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトトランスポートは `auto`（WebSocket 優先、SSE フォールバック）
- モデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- `params.serviceTier` も、ネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）で転送されます
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用 OpenAI 互換プロキシではなく、
  `chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付与されます
- 直接 `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有し、OpenClaw はこれを `service_tier=priority` にマッピングします
- `openai-codex/gpt-5.3-codex-spark` は、Codex OAuth カタログがそれを公開している場合に引き続き利用可能です。利用権限に依存します
- `openai-codex/gpt-5.4` は、ネイティブの `contextWindow = 1050000` と、デフォルトランタイム `contextTokens = 272000` を維持します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きしてください
- ポリシーに関する注記: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフロー向けに明示的にサポートされています。

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

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloud プロバイダーサーフェスに加え、Alibaba DashScope と Coding Plan エンドポイントのマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuth または API キーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Plan または汎用 API エンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zen ランタイムプロバイダー: `opencode`
- Go ランタイムプロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API キー）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使うレガシー OpenClaw 設定は、`google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接の Gemini 実行では、`agents.defaults.models["google/<model>"].params.cachedContent`
  （またはレガシーの `cached_content`）も受け付け、プロバイダーネイティブな
  `cachedContents/...` ハンドルを転送します。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表れます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`, `google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用し、Gemini CLI は独自の OAuth フローを使用します
- 注意: OpenClaw における Gemini CLI OAuth は非公式の統合です。サードパーティクライアントの使用後に Google アカウントの制限が発生したと報告したユーザーもいます。利用規約を確認し、進める場合は重要でないアカウントを使用してください。
- Gemini CLI OAuth は、バンドルされている `google` Plugin の一部として提供されます。
  - まず Gemini CLI をインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: `openclaw.json` にクライアントIDやシークレットを貼り付ける必要は**ありません**。CLI ログインフローは、トークンを Gateway ホスト上の認証プロファイルに保存します。
  - ログイン後にリクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLI の JSON 応答は `response` から解析され、使用量は
    `stats` にフォールバックされ、`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が同梱されています。ライブの
  `https://api.kilo.ai/api/gateway/models` 検出により、ランタイム
  カタログがさらに拡張される場合があります。
- `kilocode/kilo/auto` の背後にある正確な上流ルーティングは、OpenClaw にハードコードされているのではなく、Kilo Gateway が所有します。

セットアップの詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル済み Provider Plugin

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- モデル例: `openrouter/auto`
- OpenClaw は、リクエストが実際に `openrouter.ai` を対象としている場合にのみ、OpenRouter が文書化しているアプリ帰属ヘッダーを適用します
- OpenRouter 固有の Anthropic `cache_control` マーカーも同様に、
  任意のプロキシURLではなく、検証済み OpenRouter ルートに対してのみ有効です
- OpenRouter は引き続きプロキシ型の OpenAI 互換パス上にあるため、ネイティブ OpenAI 専用のリクエスト整形（`serviceTier`、Responses の `store`、
  プロンプトキャッシュヒント、OpenAI reasoning 互換ペイロード）は転送されません
- Gemini をバックエンドとする OpenRouter 参照では、プロキシ Gemini thought-signature サニタイズのみが維持されます。ネイティブ Gemini のリプレイ検証とブートストラップ書き換えは無効のままです
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- モデル例: `kilocode/kilo/auto`
- Gemini をバックエンドとする Kilo 参照では、同じプロキシ Gemini thought-signature
  サニタイズパスが維持されます。`kilocode/kilo/auto` や、その他のプロキシ reasoning 非対応ヒントでは、プロキシ reasoning 注入はスキップされます
- MiniMax: `minimax`（API キー）および `minimax-portal`（OAuth）
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`
- モデル例: `minimax/MiniMax-M2.7` または `minimax-portal/MiniMax-M2.7`
- MiniMax のオンボーディング/API キーセットアップでは、
  `input: ["text", "image"]` を持つ明示的な M2.7 モデル定義を書き込みます。バンドル済みプロバイダーカタログでは、そのプロバイダー設定が具体化されるまではチャット参照は text-only のままです
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- モデル例: `moonshot/kimi-k2.6`
- Kimi Coding: `kimi` (`KIMI_API_KEY` または `KIMICODE_API_KEY`)
- モデル例: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- モデル例: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY`, または `DASHSCOPE_API_KEY`)
- モデル例: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- モデル例: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- モデル例: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- モデル例: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- モデル例: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- モデル例: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- モデル例: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - ネイティブのバンドル済み xAI リクエストでは、xAI Responses パスを使用します
  - `/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、
    `grok-4`、および `grok-4-0709` を、それぞれの `*-fast` バリアントに書き換えます
  - `tool_stream` はデフォルトでオンです。無効にするには、
    `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定してください
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- モデル例: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras 上の GLM モデルでは、ID `zai-glm-4.7` と `zai-glm-4.6` を使用します。
  - OpenAI 互換ベースURL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference のモデル例: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. 詳細は [Hugging Face (Inference)](/ja-JP/providers/huggingface) を参照してください。

## `models.providers` 経由のプロバイダー（カスタム/ベースURL）

**カスタム**プロバイダーまたは OpenAI/Anthropic 互換プロキシを追加するには、`models.providers`（または `models.json`）を使用します。

以下のバンドル済み Provider Plugin の多くは、すでにデフォルトカタログを公開しています。
デフォルトのベースURL、ヘッダー、またはモデルリストを上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリーを使用してください。

### Moonshot AI（Kimi）

Moonshot はバンドル済み Provider Plugin として提供されます。デフォルトでは組み込みプロバイダーを使用し、ベースURLまたはモデルメタデータを上書きする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリーを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 モデルID:

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

Kimi Coding は Moonshot AI の Anthropic 互換エンドポイントを使用します。

- プロバイダー: `kimi`
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

レガシーの `kimi/k2p5` も、互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国で Doubao やその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（コーディング: `volcengine-plan`）
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

オンボーディングではデフォルトでコーディングサーフェスが選択されますが、一般的な `volcengine/*`
カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、Volcengine の認証選択は
`volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClaw は空のプロバイダースコープピッカーを表示する代わりに、フィルターなしカタログにフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

コーディングモデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（国際版）

BytePlus ARK は、国際ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus`（コーディング: `byteplus-plan`）
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

オンボーディングではデフォルトでコーディングサーフェスが選択されますが、一般的な `byteplus/*`
カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、BytePlus の認証選択は
`byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClaw は空のプロバイダースコープピッカーを表示する代わりに、フィルターなしカタログにフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

コーディングモデル（`byteplus-plan`）:

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic は、`synthetic` プロバイダーの背後で Anthropic 互換モデルを提供します。

- プロバイダー: `synthetic`
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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` で設定されます。

- MiniMax OAuth（グローバル）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（中国）: `--auth-choice minimax-cn-oauth`
- MiniMax API キー（グローバル）: `--auth-choice minimax-global-api`
- MiniMax API キー（中国）: `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または
  `MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMax の Anthropic 互換ストリーミングパスでは、明示的に設定しない限り OpenClaw はデフォルトで thinking を無効にし、`/fast on` は
`MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Plugin 所有の capability 分担:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のまま
- 画像生成は `minimax/image-01` または `minimax-portal/image-01`
- 画像理解は、両方の MiniMax 認証パスで Plugin 所有の `MiniMax-VL-01`
- Web 検索はプロバイダーID `minimax` のまま

### LM Studio

LM Studio はネイティブ API を使用するバンドル済み Provider Plugin として提供されます。

- プロバイダー: `lmstudio`
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

OpenClaw は、検出と自動ロードに LM Studio のネイティブ `/api/v1/models` と `/api/v1/models/load` を使用し、デフォルトでは推論に `/v1/chat/completions` を使用します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済み Provider Plugin として提供され、Ollama のネイティブ API を使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama をインストールしてから、モデルを pull します:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama は、`OLLAMA_API_KEY` でオプトインすると `http://127.0.0.1:11434` でローカル検出され、バンドル済み Provider Plugin は Ollama を直接
`openclaw onboard` とモデルピッカーに追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama)
を参照してください。

### vLLM

vLLM は、ローカル/セルフホストの OpenAI 互換
サーバー向けのバンドル済み Provider Plugin として提供されます。

- プロバイダー: `vllm`
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

SGLang は、高速なセルフホスト
OpenAI 互換サーバー向けのバンドル済み Provider Plugin として提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバー構成による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を
強制しない場合は任意の値で動作します）:

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

### ローカルプロキシ（LM Studio、vLLM、LiteLLM など）

例（OpenAI 互換）:

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

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。
  省略した場合、OpenClaw のデフォルトは次のとおりです:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの上限に一致する明示的な値を設定してください。
- 非ネイティブエンドポイント上の `api: "openai-completions"` では（ホストが `api.openai.com` ではない空でない `baseUrl`）、サポートされない `developer` ロールによるプロバイダー 400 エラーを避けるため、OpenClaw は `compat.supportsDeveloperRole: false` を強制します。
- プロキシ型の OpenAI 互換ルートでも、ネイティブ OpenAI 専用のリクエスト整形はスキップされます:
  `service_tier` なし、Responses の `store` なし、プロンプトキャッシュヒントなし、
  OpenAI reasoning 互換ペイロード整形なし、非表示の OpenClaw 帰属
  ヘッダーなし。
- `baseUrl` が空または省略されている場合、OpenClaw はデフォルトの OpenAI 動作（`api.openai.com` に解決）を維持します。
- 安全のため、非ネイティブ `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLI の例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連項目: 完全な設定例については [/gateway/configuration](/ja-JP/gateway/configuration) を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/ja-JP/gateway/configuration-reference#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド

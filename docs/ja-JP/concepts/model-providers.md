---
read_when:
    - プロバイダーごとのモデルセットアップリファレンスが必要な場合
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドが必要な場合
summary: モデルプロバイダーの概要と設定例 + CLIフロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-24T04:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce2fc2b932ddc5d5b6066b70c4b0090868ad450e193f48d89daee9e65ceb9200
    source_path: concepts/model-providers.md
    workflow: 15
---

このページでは**LLM/モデルプロバイダー**を扱います（WhatsApp/Telegramのようなチャットチャンネルではありません）。
モデル選択ルールについては [/concepts/models](/ja-JP/concepts/models) を参照してください。

## クイックルール

- モデルrefは `provider/model` を使います（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` は、設定されている場合、許可リストとして機能します。
- CLIヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータで、`contextTokens` は実効ランタイム上限です。
- フォールバックルール、cooldown probe、セッション上書き永続化: [Model failover](/ja-JP/concepts/model-failover)。
- OpenAI系ルートはprefixごとに異なります: `openai/<model>` はPI内の直接
  OpenAI API-keyプロバイダーを使い、`openai-codex/<model>` はPI内のCodex OAuthを使い、
  `openai/<model>` に加えて `agents.defaults.embeddedHarness.runtime: "codex"` を設定すると
  ネイティブCodex app-server harnessを使います。[OpenAI](/ja-JP/providers/openai)
  と [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。
- GPT-5.5 は現在、subscription/OAuthルート経由で利用できます:
  PIでは `openai-codex/gpt-5.5`、Codex app-server
  harnessでは `openai/gpt-5.5` を使います。`openai/gpt-5.5` の直接API-keyルートは、
  OpenAIが公開APIでGPT-5.5を有効化した時点でサポートされます。それまでは
  `OPENAI_API_KEY` 構成では `openai/gpt-5.4` のようなAPI対応モデルを使ってください。

## Pluginが所有するプロバイダー動作

プロバイダー固有ロジックの大半は、provider plugin（`registerProvider(...)`）内にあり、OpenClawは汎用的な推論ループを保持します。Pluginは、オンボーディング、モデルカタログ、auth env-varマッピング、transport/config正規化、tool-schemaクリーンアップ、failover分類、OAuth更新、usage報告、thinking/reasoningプロファイルなどを担当します。

provider-SDK hookの完全な一覧と同梱Pluginの例は [Provider plugins](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムなリクエスト実行器を必要とするproviderは、別の、より深い拡張サーフェスになります。

<Note>
providerランタイムの `capabilities` は共有ランナーメタデータです（provider family、transcript/toolingの癖、transport/cacheヒント）。これは、Pluginが何を登録するか（text inference、speechなど）を説明する [public capability model](/ja-JP/plugins/architecture#public-capability-model) とは異なります。
</Note>

## APIキーのローテーション

- 一部のプロバイダーで汎用的なプロバイダーローテーションをサポートします。
- 複数キーは次で設定します:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のlive override、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト。例: `<PROVIDER>_API_KEY_1`）
- Googleプロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キー選択順は優先順位を保ちつつ値を重複排除します。
- リクエストは、レート制限レスポンス時にのみ次のキーで再試行されます（
  たとえば `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many
concurrent requests`、`ThrottlingException`、`concurrency limit reached`、
  `workers_ai ... quota limit exceeded`、または定期的なusage制限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーのローテーションは試行されません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-aiカタログ）

OpenClawにはpi‑aiカタログが同梱されています。これらのプロバイダーは
`models.providers` 設定を**必要としません**。authを設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- Auth: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一override）
- モデル例: `openai/gpt-5.4`、`openai/gpt-5.4-mini`
- GPT-5.5の直接APIサポートは、OpenAIがAPIでGPT-5.5を公開した時点でここで利用可能になります
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトtransportは `auto`（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- OpenAI Responses WebSocket warm-up は、デフォルトで `params.openaiWsWarmup`（`true`/`false`）により有効です
- OpenAI priority processing は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responsesリクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします
- 共有の `/fast` トグルではなく明示的なtierを使いたい場合は `params.serviceTier` を使ってください
- 非表示のOpenClaw attributionヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用OpenAI互換proxyではなく、
  `api.openai.com` へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responsesの `store`、prompt-cacheヒント、
  OpenAI reasoning互換のペイロード整形も維持されます。proxyルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、live OpenAI APIリクエストがそれを拒否し、現在のCodexカタログでも公開されていないため、OpenClawでは意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一override）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストは、`api.anthropic.com` に送られるAPI-key認証トラフィックとOAuth認証トラフィックの両方を含めて、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClawはこれをAnthropicの `service_tier`（`auto` または `standard_only`）にマッピングします
- Anthropic注記: Anthropicスタッフから、OpenClawスタイルのClaude CLI利用が再び許可されていると伝えられたため、Anthropicが新しいポリシーを公開しない限り、OpenClawはClaude CLI再利用と `claude -p` 利用をこの統合で認可済みとして扱います。
- Anthropic setup-token も、サポートされるOpenClaw tokenパスとして引き続き利用可能ですが、OpenClawは現在、利用可能であればClaude CLI再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- Auth: OAuth（ChatGPT）
- PIモデルref: `openai-codex/gpt-5.5`
- ネイティブCodex app-server harness ref: `openai/gpt-5.5` と `agents.defaults.embeddedHarness.runtime: "codex"`
- レガシーモデルref: `codex/gpt-*`
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトtransportは `auto`（WebSocket優先、SSEフォールバック）
- PIモデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- `params.serviceTier` はネイティブCodex Responsesリクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示のOpenClaw attributionヘッダー（`originator`、`version`、
  `User-Agent`）は、汎用OpenAI互換proxyではなく、
  `chatgpt.com/backend-api` へのネイティブCodexトラフィックにのみ付与されます
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有し、OpenClawはこれを `service_tier=priority` にマッピングします
- `openai-codex/gpt-5.5` はネイティブの `contextWindow = 1000000` と、デフォルトのランタイム `contextTokens = 272000` を維持します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きできます
- ポリシー注記: OpenAI Codex OAuthは、OpenClawのような外部ツール/ワークフロー向けに明示的にサポートされています。
- 現在のGPT-5.5アクセスは、OpenAIが公開APIでGPT-5.5を有効化するまで、このOAuth/subscriptionルートを使います。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### その他のsubscriptionスタイルのホスト型オプション

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen CloudプロバイダーサーフェスとAlibaba DashScopeおよびCoding Planエンドポイントマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuthまたはAPIキーアクセス
- [GLM Models](/ja-JP/providers/glm): Z.AI Coding Planまたは一般APIエンドポイント

### OpenCode

- Auth: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zenランタイムプロバイダー: `opencode`
- Goランタイムプロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（APIキー）

- プロバイダー: `google`
- Auth: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一override）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使うレガシーOpenClaw設定は `google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`
  （またはレガシーの `cached_content`）も受け付け、プロバイダーネイティブな
  `cachedContents/...` ハンドルを転送します。Geminiのcache hitはOpenClawの `cacheRead` として表面化します

### Google VertexとGemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- Auth: Vertexはgcloud ADCを使用し、Gemini CLIは独自のOAuthフローを使用します
- 注意: OpenClawでのGemini CLI OAuthは非公式な統合です。サードパーティクライアント使用後にGoogleアカウント制限が発生したという報告もあります。進める場合はGoogleの利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuthは、同梱の `google` pluginの一部として提供されます。
  - まずGemini CLIをインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注: client idやsecretを `openclaw.json` に貼り付ける**必要はありません**。CLIログインフローは
    tokenをGatewayホスト上のauth profileに保存します。
  - ログイン後にリクエストが失敗する場合は、Gatewayホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLI JSON返信は `response` から解析され、usageは
    `stats` にフォールバックし、`stats.cached` はOpenClawの `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- Auth: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致するZ.AIエンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- Auth: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が同梱されており、liveの
  `https://api.kilo.ai/api/gateway/models` 検出によってランタイム
  カタログはさらに拡張される場合があります。
- `kilocode/kilo/auto` の背後でどのupstreamにルーティングされるかはKilo Gateway側の管理であり、
  OpenClawにハードコードされてはいません。

セットアップ詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他の同梱provider plugin

| プロバイダー              | Id                               | Auth env                                                     | モデル例                                        |
| ------------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                  | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                  | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway     | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot            | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                      | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference    | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`                    | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway              | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding               | `kimi`                           | `KIMI_API_KEY` または `KIMICODE_API_KEY`                     | `kimi/kimi-code`                                |
| MiniMax                   | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                   | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                  | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                    | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter                | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                   | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud                | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                   | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                  | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                    | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway         | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao)   | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                       | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                    | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

知っておく価値のある癖:

- **OpenRouter** は、検証済みの `openrouter.ai` ルートでのみ、アプリattributionヘッダーとAnthropicの `cache_control` マーカーを適用します。proxyスタイルのOpenAI互換パスとして、ネイティブOpenAI専用の整形（`serviceTier`、Responsesの `store`、prompt-cacheヒント、OpenAI reasoning互換）はスキップします。Geminiバックドのrefは、proxy-Geminiのthought-signature sanitizationのみを維持します。
- **Kilo Gateway** のGeminiバックドrefは同じproxy-Gemini sanitizationパスに従います。`kilocode/kilo/auto` およびその他のproxy-reasoning非対応refでは、proxy reasoning injectionをスキップします。
- **MiniMax** のAPI-keyオンボーディングでは、`input: ["text", "image"]` を持つ明示的なM2.7モデル定義を書き込みます。同梱カタログでは、そのconfigが具体化されるまでchat refはtext専用のままです。
- **xAI** はxAI Responsesパスを使用します。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。無効化するには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を設定してください。
- **Cerebras** のGLMモデルは `zai-glm-4.7` / `zai-glm-4.6` を使います。OpenAI互換のベースURLは `https://api.cerebras.ai/v1` です。

## `models.providers` 経由のプロバイダー（custom/base URL）

**カスタム**プロバイダーやOpenAI/Anthropic互換proxyを追加するには、
`models.providers`（または `models.json`）を使います。

以下の同梱provider pluginの多くは、すでにデフォルトカタログを公開しています。
デフォルトのbase URL、header、またはmodel listを上書きしたい場合にのみ、
明示的な `models.providers.<id>` エントリを使ってください。

### Moonshot AI（Kimi）

Moonshotは同梱provider pluginとして提供されます。デフォルトでは組み込みproviderを使い、
base URLまたはmodel metadataを上書きする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- Auth: `MOONSHOT_API_KEY`
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

Kimi CodingはMoonshot AIのAnthropic互換エンドポイントを使用します。

- プロバイダー: `kimi`
- Auth: `KIMI_API_KEY`
- モデル例: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

レガシーの `kimi/k2p5` も互換モデルidとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoやその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（coding: `volcengine-plan`）
- Auth: `VOLCANO_ENGINE_API_KEY`
- モデル例: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcodingサーフェスを使用しますが、一般的な `volcengine/*`
カタログも同時に登録されます。

オンボーディング/設定ウィザードのモデルピッカーでは、Volcengineのauth choiceは
`volcengine/*` と `volcengine-plan/*` の両方を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは空のproviderスコープピッカーを表示する代わりに、フィルターなしカタログへフォールバックします。

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

BytePlus ARKは、国際ユーザー向けにVolcano Engineと同じモデル群へのアクセスを提供します。

- プロバイダー: `byteplus`（coding: `byteplus-plan`）
- Auth: `BYTEPLUS_API_KEY`
- モデル例: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングはデフォルトでcodingサーフェスを使用しますが、一般的な `byteplus/*`
カタログも同時に登録されます。

オンボーディング/設定ウィザードのモデルピッカーでは、BytePlusのauth choiceは
`byteplus/*` と `byteplus-plan/*` の両方を優先します。これらのモデルがまだ読み込まれていない場合、
OpenClawは空のproviderスコープピッカーを表示する代わりに、フィルターなしカタログへフォールバックします。

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

Syntheticは、`synthetic` プロバイダーの背後でAnthropic互換モデルを提供します。

- プロバイダー: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
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
- Auth: `minimax` では `MINIMAX_API_KEY`、`minimax-portal` では `MINIMAX_OAUTH_TOKEN` または
  `MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、configスニペットは [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMaxのAnthropic互換Streamingパスでは、明示的に設定しない限りOpenClawはthinkingをデフォルトで無効にし、`/fast on` は
`MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Pluginが所有するcapability分割:

- Text/chatのデフォルトは `minimax/MiniMax-M2.7` のまま
- 画像生成は `minimax/image-01` または `minimax-portal/image-01`
- 画像理解は両方のMiniMax authパスでPlugin所有の `MiniMax-VL-01`
- Web検索はプロバイダーid `minimax` のまま

### LM Studio

LM Studioは同梱provider pluginとして提供され、ネイティブAPIを使います。

- プロバイダー: `lmstudio`
- Auth: `LM_API_TOKEN`
- デフォルトの推論ベースURL: `http://localhost:1234/v1`

その後、モデルを設定します（`http://localhost:1234/api/v1/models` が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出 + 自動ロードにはLM Studioネイティブの `/api/v1/models` と `/api/v1/models/load` を使い、デフォルトでは推論に `/v1/chat/completions` を使います。
セットアップとトラブルシューティングは [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollamaは同梱provider pluginとして提供され、OllamaのネイティブAPIを使用します:

- プロバイダー: `ollama`
- Auth: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollamaをインストールし、その後モデルをpull:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollamaは、`OLLAMA_API_KEY` でオプトインすると、ローカルの `http://127.0.0.1:11434` で検出され、
同梱provider pluginがOllamaを直接
`openclaw onboard` とモデルピッカーに追加します。オンボーディング、cloud/localモード、
カスタム設定は [/providers/ollama](/ja-JP/providers/ollama)
を参照してください。

### vLLM

vLLMは、ローカル/セルフホストのOpenAI互換
サーバー向け同梱provider pluginとして提供されます。

- プロバイダー: `vllm`
- Auth: 任意（サーバー構成による）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーがauthを強制しない場合、値は何でも可）:

```bash
export VLLM_API_KEY="vllm-local"
```

その後、モデルを設定します（`/v1/models` が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLangは、高速なセルフホスト
OpenAI互換サーバー向け同梱provider pluginとして提供されます。

- プロバイダー: `sglang`
- Auth: 任意（サーバー構成による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーがauthを強制しない場合、
値は何でも可）:

```bash
export SGLANG_API_KEY="sglang-local"
```

その後、モデルを設定します（`/v1/models` が返すIDの1つに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルproxy（LM Studio、vLLM、LiteLLMなど）

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

注:

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。
  省略時のOpenClawデフォルト:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: proxy/modelの上限に一致する明示的な値を設定してください。
- 非ネイティブエンドポイント上の `api: "openai-completions"` では（hostが `api.openai.com` ではない空でない `baseUrl` の場合）、サポートされていない `developer` roleによるprovider 400エラーを避けるため、OpenClawは `compat.supportsDeveloperRole: false` を強制します。
- proxyスタイルのOpenAI互換ルートも、ネイティブOpenAI専用のリクエスト
  整形をスキップします。つまり `service_tier` なし、Responsesの `store` なし、prompt-cacheヒントなし、
  OpenAI reasoning互換のペイロード整形なし、非表示のOpenClaw attribution
  ヘッダーなしです。
- `baseUrl` が空または省略されている場合、OpenClawはデフォルトのOpenAI動作を維持します（これは `api.openai.com` に解決されます）。
- 安全のため、非ネイティブ `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLI例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な設定例は [/gateway/configuration](/ja-JP/gateway/configuration) も参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model Failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド

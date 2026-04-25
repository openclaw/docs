---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例や CLI のオンボーディングコマンドが必要です
summary: モデルプロバイダーの概要と設定例 + CLI フロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-25T18:16:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0991f256bfeda9086eaa2911cc8056561dce84ee8cb9c16e99602eb396bbee83
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/モデルプロバイダー**向けのリファレンスです（WhatsApp/Telegram のようなチャットチャネルではありません）。モデル選択ルールについては、[Models](/ja-JP/concepts/models) を参照してください。

## クイックルール

- モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
- `agents.defaults.models` は、設定されている場合は許可リストとして機能します。
- CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`
- `models.providers.*.models[].contextWindow` はネイティブモデルのメタデータ、`contextTokens` は実行時に有効な上限です。
- フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [Model failover](/ja-JP/concepts/model-failover)
- OpenAI ファミリーのルートはプレフィックスごとに異なります: `openai/<model>` は PI の直接 OpenAI API キープロバイダーを使用し、`openai-codex/<model>` は PI の Codex OAuth を使用し、`openai/<model>` に `agents.defaults.embeddedHarness.runtime: "codex"` を組み合わせるとネイティブの Codex app-server harness を使用します。[OpenAI](/ja-JP/providers/openai) と [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。プロバイダーとランタイムの分離がわかりにくい場合は、まず [Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。
- Plugin の自動有効化も同じ境界に従います: `openai-codex/<model>` は OpenAI Plugin に属し、Codex Plugin は `embeddedHarness.runtime: "codex"` または従来の `codex/<model>` 参照によって有効になります。
- CLI ランタイムでも同じ分離を使用します: `anthropic/claude-*`、`google/gemini-*`、`openai/gpt-*` のような正規のモデル参照を選び、ローカル CLI バックエンドを使いたい場合は `agents.defaults.embeddedHarness.runtime` を `claude-cli`、`google-gemini-cli`、または `codex-cli` に設定します。従来の `claude-cli/*`、`google-gemini-cli/*`、`codex-cli/*` 参照は、ランタイムを別途記録したうえで正規のプロバイダー参照へ移行されます。
- GPT-5.5 は、直接 API キー通信では `openai/gpt-5.5`、PI での Codex OAuth では `openai-codex/gpt-5.5`、さらに `embeddedHarness.runtime: "codex"` を設定した場合はネイティブ Codex app-server harness から利用できます。

## Plugin が所有するプロバイダー動作

プロバイダー固有のロジックの大半はプロバイダー Plugin（`registerProvider(...)`）にあり、OpenClaw は汎用の推論ループを保持します。Plugin は、オンボーディング、モデルカタログ、認証用 env var マッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、thinking/reasoning プロファイルなどを担当します。

provider-SDK フックの完全な一覧とバンドル済み Plugin の例は [Provider plugins](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムのリクエスト実行器が必要なプロバイダーは、より深い別の拡張サーフェスになります。

<Note>
プロバイダーランタイムの `capabilities` は、共有ランナーのメタデータです（プロバイダーファミリー、transcript/tooling の癖、transport/cache のヒント）。これは、Plugin が何を登録するか（テキスト推論、音声など）を記述する [public capability model](/ja-JP/plugins/architecture#public-capability-model) とは別物です。
</Note>

## API キーのローテーション

- 選択されたプロバイダーに対する汎用的なプロバイダーローテーションをサポートします。
- 複数キーの設定方法:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
  - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りのリスト）
  - `<PROVIDER>_API_KEY`（プライマリキー）
  - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）
- Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。
- キーの選択順序は優先順位を維持し、値の重複を排除します。
- リクエストは、レート制限応答が返った場合にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量上限メッセージ）。
- レート制限以外の失敗は即座に失敗し、キーのローテーションは行われません。
- すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

## 組み込みプロバイダー（pi-ai カタログ）

OpenClaw には pi‑ai カタログが同梱されています。これらのプロバイダーでは **`models.providers` の設定は不要** で、認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- オプションのローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 特定のインストールや API キーで挙動が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの利用可否を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` です（WebSocket 優先、SSE フォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- OpenAI Responses WebSocket warm-up は、`params.openaiWsWarmup`（`true`/`false`）によりデフォルトで有効です
- OpenAI の優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします
- 共有の `/fast` トグルの代わりに明示的な tier を使いたい場合は `params.serviceTier` を使用してください
- 非公開の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI 通信にのみ適用され、汎用の OpenAI 互換プロキシには適用されません
- ネイティブ OpenAI ルートでは、Responses の `store`、プロンプトキャッシュのヒント、OpenAI reasoning 互換のペイロード整形も維持されます。プロキシルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、ライブの OpenAI API リクエストで拒否され、現在の Codex カタログでも公開されていないため、OpenClaw では意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- オプションのローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開 Anthropic リクエストでは、共有の `/fast` トグルと `params.fastMode` をサポートします。これには `api.anthropic.com` に送信される API キー認証および OAuth 認証の通信が含まれ、OpenClaw はこれを Anthropic の `service_tier`（`auto` または `standard_only`）にマッピングします
- Anthropic に関する注記: Anthropic のスタッフから、OpenClaw スタイルの Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI の再利用と `claude -p` の利用をこの統合において許可済みとして扱います。
- Anthropic setup-token も引き続きサポート対象の OpenClaw トークン経路として利用可能ですが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- PI モデル参照: `openai-codex/gpt-5.5`
- ネイティブ Codex app-server harness 参照: `openai/gpt-5.5` と `agents.defaults.embeddedHarness.runtime: "codex"`
- ネイティブ Codex app-server harness のドキュメント: [Codex harness](/ja-JP/plugins/codex-harness)
- 従来のモデル参照: `codex/gpt-*`
- Plugin 境界: `openai-codex/*` は OpenAI Plugin を読み込みます。ネイティブ Codex app-server Plugin は、Codex harness ランタイムまたは従来の `codex/*` 参照によってのみ選択されます。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトのトランスポートは `auto` です（WebSocket 優先、SSE フォールバック）
- PI モデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`、`"websocket"`、または `"auto"`）
- `params.serviceTier` はネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非公開の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex 通信にのみ付与され、汎用の OpenAI 互換プロキシには付与されません
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有し、OpenClaw はこれを `service_tier=priority` にマッピングします
- `openai-codex/gpt-5.5` は Codex カタログのネイティブな `contextWindow = 400000` と、デフォルトの実行時 `contextTokens = 272000` を使用します。実行時上限は `models.providers.openai-codex.models[].contextTokens` で上書きできます
- ポリシーに関する注記: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフロー向けに明示的にサポートされています。
- Codex OAuth/サブスクリプション経路を使いたい場合は `openai-codex/gpt-5.5` を、API キー設定とローカルカタログで公開 API ルートが利用できる場合は `openai/gpt-5.5` を使ってください。

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

### その他のサブスクリプション型ホストオプション

- [Qwen Cloud](/ja-JP/providers/qwen): Qwen Cloud のプロバイダーサーフェス、および Alibaba DashScope と Coding Plan エンドポイントのマッピング
- [MiniMax](/ja-JP/providers/minimax): MiniMax Coding Plan OAuth または API キーアクセス
- [GLM models](/ja-JP/providers/glm): Z.AI Coding Plan または汎用 API エンドポイント

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zen ランタイムプロバイダー: `opencode`
- Go ランタイムプロバイダー: `opencode-go`
- モデル例: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API キー）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- オプションのローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用する従来の OpenClaw 設定は `google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` は Google の動的 thinking を使用します。Gemini 3/3.1 は固定の `thinkingLevel` を省略し、Gemini 2.5 は `thinkingBudget: -1` を送信します。
- 直接の Gemini 実行では、`agents.defaults.models["google/<model>"].params.cachedContent`（または従来の `cached_content`）も受け付け、プロバイダーネイティブの `cachedContents/...` ハンドルを転送します。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表示されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC、Gemini CLI はその OAuth フローを使用します
- 注意: OpenClaw における Gemini CLI OAuth は非公式の統合です。サードパーティークライアントの利用後に Google アカウントの制限が発生したという報告があります。進める場合は Google の利用規約を確認し、重要でないアカウントを使用してください。
- Gemini CLI OAuth は、同梱の `google` Plugin の一部として提供されます。
  - まず Gemini CLI をインストールします:
    - `brew install gemini-cli`
    - または `npm install -g @google/gemini-cli`
  - 有効化: `openclaw plugins enable google`
  - ログイン: `openclaw models auth login --provider google-gemini-cli --set-default`
  - デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`
  - 注記: `openclaw.json` に client id や secret を貼り付ける必要は**ありません**。CLI ログインフローは、Gateway ホスト上の auth profile にトークンを保存します。
  - ログイン後にリクエストが失敗する場合は、Gateway ホスト上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  - Gemini CLI の JSON 応答は `response` から解析され、使用量は `stats` にフォールバックします。`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

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
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が同梱されています。ライブの `https://api.kilo.ai/api/gateway/models` 検出により、実行時カタログがさらに拡張される場合があります。
- `kilocode/kilo/auto` の背後にある正確なアップストリームルーティングは、OpenClaw にハードコードされておらず、Kilo Gateway が管理します。

セットアップの詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他の同梱プロバイダー Plugin

| プロバイダー | ID | 認証 env | モデル例 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus | `byteplus` / `byteplus-plan` | `BYTEPLUS_API_KEY` | `byteplus-plan/ark-code-latest` |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` | `cerebras/zai-glm-4.7` |
| Cloudflare AI Gateway | `cloudflare-ai-gateway` | `CLOUDFLARE_AI_GATEWAY_API_KEY` | — |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` | `deepseek/deepseek-v4-flash` |
| GitHub Copilot | `github-copilot` | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | — |
| Groq | `groq` | `GROQ_API_KEY` | — |
| Hugging Face Inference | `huggingface` | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN` | `huggingface/deepseek-ai/DeepSeek-R1` |
| Kilo Gateway | `kilocode` | `KILOCODE_API_KEY` | `kilocode/kilo/auto` |
| Kimi Coding | `kimi` | `KIMI_API_KEY` または `KIMICODE_API_KEY` | `kimi/kimi-code` |
| MiniMax | `minimax` / `minimax-portal` | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN` | `minimax/MiniMax-M2.7` |
| Mistral | `mistral` | `MISTRAL_API_KEY` | `mistral/mistral-large-latest` |
| Moonshot | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.6` |
| NVIDIA | `nvidia` | `NVIDIA_API_KEY` | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/auto` |
| Qianfan | `qianfan` | `QIANFAN_API_KEY` | `qianfan/deepseek-v3.2` |
| Qwen Cloud | `qwen` | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus` |
| StepFun | `stepfun` / `stepfun-plan` | `STEPFUN_API_KEY` | `stepfun/step-3.5-flash` |
| Together | `together` | `TOGETHER_API_KEY` | `together/moonshotai/Kimi-K2.5` |
| Venice | `venice` | `VENICE_API_KEY` | — |
| Vercel AI Gateway | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY` | `volcengine-plan/ark-code-latest` |
| xAI | `xai` | `XAI_API_KEY` | `xai/grok-4` |
| Xiaomi | `xiaomi` | `XIAOMI_API_KEY` | `xiaomi/mimo-v2-flash` |

知っておく価値のある挙動:

- **OpenRouter** は、検証済みの `openrouter.ai` ルートでのみ、アプリ attribution ヘッダーと Anthropic の `cache_control` マーカーを適用します。DeepSeek、Moonshot、ZAI の参照は、OpenRouter 管理のプロンプトキャッシュにおいて cache-TTL 対象になりますが、Anthropic キャッシュマーカーは付与されません。プロキシ型の OpenAI 互換パスであるため、ネイティブ OpenAI 専用の整形（`serviceTier`、Responses の `store`、プロンプトキャッシュのヒント、OpenAI reasoning 互換）はスキップされます。Gemini ベースの参照では、プロキシ Gemini の thought-signature サニタイズのみ保持されます。
- **Kilo Gateway** の Gemini ベース参照は、同じプロキシ Gemini サニタイズパスに従います。`kilocode/kilo/auto` およびそのほかのプロキシ reasoning 非対応参照では、プロキシ reasoning の注入はスキップされます。
- **MiniMax** の API キーによるオンボーディングでは、明示的なテキスト専用 M2.7 chat モデル定義が書き込まれます。画像理解は Plugin が所有する `MiniMax-VL-01` メディアプロバイダーのままです。
- **xAI** は xAI Responses パスを使用します。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を設定してください。
- **Cerebras** の GLM モデルは `zai-glm-4.7` / `zai-glm-4.6` を使用します。OpenAI 互換のベース URL は `https://api.cerebras.ai/v1` です。

## `models.providers` 経由のプロバイダー（カスタム/ベース URL）

**カスタム**プロバイダー、または OpenAI/Anthropic 互換プロキシを追加するには、`models.providers`（または `models.json`）を使用します。

以下の同梱プロバイダー Plugin の多くは、すでにデフォルトカタログを公開しています。デフォルトのベース URL、ヘッダー、またはモデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使用してください。

### Moonshot AI（Kimi）

Moonshot は同梱プロバイダー Plugin として提供されています。通常は組み込みプロバイダーを使い、ベース URL やモデルメタデータを上書きする必要がある場合のみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 のモデル ID:

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

従来の `kimi/k2p5` も互換モデル ID として引き続き利用できます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国で Doubao やその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（coding: `volcengine-plan`）
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

オンボーディングではデフォルトで coding サーフェスが選ばれますが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、Volcengine の認証方式は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダースコープ付きピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding モデル（`volcengine-plan`）:

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus（International）

BytePlus ARK は、国際ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus`（coding: `byteplus-plan`）
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

オンボーディングではデフォルトで coding サーフェスが選ばれますが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/モデル設定ピッカーでは、BytePlus の認証方式は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダースコープ付きピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

利用可能なモデル:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding モデル（`byteplus-plan`）:

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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` 経由で設定します。

- MiniMax OAuth（Global）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（CN）: `--auth-choice minimax-cn-oauth`
- MiniMax API キー（Global）: `--auth-choice minimax-global-api`
- MiniMax API キー（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

MiniMax の Anthropic 互換ストリーミングパスでは、明示的に設定しない限り OpenClaw はデフォルトで thinking を無効にし、`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。

Plugin が所有する capability の分離:

- テキスト/chat のデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、どちらの MiniMax 認証経路でも Plugin が所有する `MiniMax-VL-01` です
- Web 検索はプロバイダー ID `minimax` のままです

### LM Studio

LM Studio は、ネイティブ API を使用する同梱プロバイダー Plugin として提供されています。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルトの推論ベース URL: `http://localhost:1234/v1`

その後、モデルを設定します（`http://localhost:1234/api/v1/models` が返す ID のいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は、検出と自動ロードのために LM Studio ネイティブの `/api/v1/models` と `/api/v1/models/load` を使用し、デフォルトでは推論に `/v1/chat/completions` を使用します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama は同梱プロバイダー Plugin として提供され、Ollama のネイティブ API を使用します。

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

`OLLAMA_API_KEY` でオプトインすると、Ollama は `http://127.0.0.1:11434` でローカル検出され、同梱プロバイダー Plugin が Ollama を `openclaw onboard` とモデルピッカーに直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル/セルフホストの OpenAI 互換サーバー向け同梱プロバイダー Plugin として提供されています。

- プロバイダー: `vllm`
- 認証: オプション（サーバー構成に依存）
- デフォルトのベース URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export VLLM_API_KEY="vllm-local"
```

その後、モデルを設定します（`/v1/models` が返す ID のいずれかに置き換えてください）:

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホスト OpenAI 互換サーバー向け同梱プロバイダー Plugin として提供されています。

- プロバイダー: `sglang`
- 認証: オプション（サーバー構成に依存）
- デフォルトのベース URL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには（サーバーが認証を強制しない場合は任意の値で動作します）:

```bash
export SGLANG_API_KEY="sglang-local"
```

その後、モデルを設定します（`/v1/models` が返す ID のいずれかに置き換えてください）:

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

- カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は省略可能です。
  省略した場合、OpenClaw のデフォルトは次のとおりです:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推奨: プロキシ/モデルの上限に一致する明示的な値を設定してください。
- ネイティブでないエンドポイント上の `api: "openai-completions"` では（`api.openai.com` 以外のホストを持つ、空でない `baseUrl`）、未対応の `developer` ロールによるプロバイダー 400 エラーを避けるため、OpenClaw は `compat.supportsDeveloperRole: false` を強制します。
- プロキシ型の OpenAI 互換ルートでは、ネイティブ OpenAI 専用のリクエスト整形もスキップされます。`service_tier`、Responses の `store`、Completions の `store`、プロンプトキャッシュのヒント、OpenAI reasoning 互換のペイロード整形、非公開の OpenClaw attribution ヘッダーはいずれも使用されません。
- ベンダー固有のフィールドが必要な OpenAI 互換 Completions プロキシでは、`agents.defaults.models["provider/model"].params.extra_body`（または `extraBody`）を設定して、追加の JSON を送信リクエスト本文にマージしてください。
- `baseUrl` が空または省略されている場合、OpenClaw はデフォルトの OpenAI 動作を維持します（これは `api.openai.com` に解決されます）。
- 安全のため、ネイティブでない `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

## CLI の例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連項目: 完全な設定例については [Configuration](/ja-JP/gateway/configuration) を参照してください。

## 関連

- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Model failover](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド

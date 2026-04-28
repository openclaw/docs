---
read_when:
    - プロバイダーごとのモデルセットアップリファレンスが必要です
    - モデルプロバイダー向けの設定例やCLIオンボーディングコマンドが必要です
sidebarTitle: Model providers
summary: モデルプロバイダーの概要、設定例、CLIフロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-04-26T11:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 925641c70780a5bc87c4fc8236bad56ba9e157df26d8084143eba4bf54e63159
    source_path: concepts/model-providers.md
    workflow: 15
---

**LLM/モデルプロバイダー** 向けのリファレンスです（WhatsApp/Telegram のようなチャットチャネルではありません）。モデル選択ルールについては、[Models](/ja-JP/concepts/models) を参照してください。

## クイックルール

<AccordionGroup>
  <Accordion title="モデル参照とCLIヘルパー">
    - モデル参照は `provider/model` を使います（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` は、設定されている場合は許可リストとして機能します。
    - CLIヘルパー: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`。
    - `models.providers.*.models[].contextWindow` はネイティブなモデルメタデータであり、`contextTokens` は実効ランタイム上限です。
    - フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [Model failover](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="OpenAI プロバイダー/ランタイム分離">
    OpenAI系ルートはプレフィックスごとに分かれています。

    - `openai/<model>` は、PI内の直接OpenAI API-key provider を使用します。
    - `openai-codex/<model>` は、PI内のCodex OAuthを使用します。
    - `openai/<model>` と `agents.defaults.agentRuntime.id: "codex"` の組み合わせは、ネイティブCodex app-server harness を使用します。

    [OpenAI](/ja-JP/providers/openai) と [Codex harness](/ja-JP/plugins/codex-harness) を参照してください。プロバイダー/ランタイム分離がわかりにくい場合は、まず [Agent runtimes](/ja-JP/concepts/agent-runtimes) を読んでください。

    Plugin の自動有効化も同じ境界に従います。`openai-codex/<model>` はOpenAI Plugin に属し、Codex Plugin は `agentRuntime.id: "codex"` または従来の `codex/<model>` 参照で有効になります。

    GPT-5.5 は、直接のAPI-keyトラフィック向けの `openai/gpt-5.5`、PI内のCodex OAuth向けの `openai-codex/gpt-5.5`、および `agentRuntime.id: "codex"` が設定されている場合のネイティブCodex app-server harness で利用できます。

  </Accordion>
  <Accordion title="CLIランタイム">
    CLIランタイムでも同じ分離を使います。`anthropic/claude-*`、`google/gemini-*`、`openai/gpt-*` のような正規のモデル参照を選び、ローカルCLIバックエンドを使いたい場合は `agents.defaults.agentRuntime.id` を `claude-cli`、`google-gemini-cli`、または `codex-cli` に設定します。

    従来の `claude-cli/*`、`google-gemini-cli/*`、`codex-cli/*` 参照は、ランタイムを別記録したうえで正規のプロバイダー参照へ移行されます。

  </Accordion>
</AccordionGroup>

## Plugin 管理のプロバイダー動作

プロバイダー固有ロジックの大半は、プロバイダーPlugin（`registerProvider(...)`）にあり、OpenClaw は汎用の推論ループを維持します。Plugin は、オンボーディング、モデルカタログ、認証env varマッピング、transport/config の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuthリフレッシュ、使用量レポート、thinking/reasoning プロファイルなどを担当します。

プロバイダーSDKフックの完全な一覧と、バンドル済みPlugin の例は [Provider plugins](/ja-JP/plugins/sdk-provider-plugins) にあります。完全に独自のリクエスト実行器が必要なプロバイダーは、別のより深い拡張サーフェスになります。

<Note>
プロバイダーランタイム `capabilities` は、共有ランナーのメタデータです（プロバイダーファミリー、transcript/tooling の癖、transport/cache ヒント）。これは、Plugin が何を登録するか（テキスト推論、音声など）を説明する [公開 capability モデル](/ja-JP/plugins/architecture#public-capability-model) とは異なります。
</Note>

## API key ローテーション

<AccordionGroup>
  <Accordion title="キーソースと優先順位">
    複数キーは次の方法で設定できます。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のlive上書き、最優先）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Googleプロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キー選択順序は優先順位を保持し、値を重複排除します。

  </Accordion>
  <Accordion title="ローテーションが発動するタイミング">
    - リクエストは、レート制限応答のときにのみ次のキーで再試行されます（例: `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
    - レート制限以外の失敗は即座に失敗し、キーローテーションは試行されません。
    - すべての候補キーが失敗した場合、最後の試行の最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 組み込みプロバイダー（pi-aiカタログ）

OpenClaw には pi‑ai カタログが同梱されています。これらのプロバイダーでは `models.providers` config は**不要**です。認証を設定し、モデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- 例のモデル: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- 特定のインストールまたはAPI key で動作が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの可用性を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトtransport は `auto`（WebSocket優先、SSEフォールバック）
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport` で行います（`"sse"`, `"websocket"`, `"auto"`）
- OpenAI Responses WebSocket warm-up は、`params.openaiWsWarmup`（`true`/`false`）でデフォルト有効です
- OpenAI priority processing は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマップします
- 共通の `/fast` トグルではなく明示的なtierを使いたい場合は `params.serviceTier` を使用してください
- 隠しOpenClaw attribution headers（`originator`, `version`, `User-Agent`）は、汎用のOpenAI互換proxyではなく、`api.openai.com` へのネイティブOpenAIトラフィックにのみ適用されます
- ネイティブOpenAIルートでは、Responses の `store`、prompt-cache ヒント、OpenAI reasoning互換ペイロード整形も維持されます。proxyルートでは維持されません
- `openai/gpt-5.3-codex-spark` は、liveなOpenAI APIリクエストで拒否され、現在のCodexカタログにも存在しないため、OpenClaw では意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- 例のモデル: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開Anthropicリクエストは、共有の `/fast` トグルと `params.fastMode` をサポートします。これには `api.anthropic.com` に送られるAPI-key認証およびOAuth認証トラフィックが含まれ、OpenClaw はそれをAnthropicの `service_tier`（`auto` または `standard_only`）にマップします
- 推奨される Claude CLI config では、モデル参照を正規のままにし、CLI
  バックエンドを別途選択します: `anthropic/claude-opus-4-7` と
  `agents.defaults.agentRuntime.id: "claude-cli"` の組み合わせです。従来の
  `claude-cli/claude-opus-4-7` 参照も互換性のために引き続き使えます。

<Note>
Anthropic のスタッフから、OpenClawスタイルの Claude CLI 利用は再び許可されていると伝えられたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw は Claude CLI 再利用と `claude -p` 利用をこの統合における正式サポートとして扱います。Anthropic setup-token も引き続きサポートされたOpenClawトークン経路として利用可能ですが、OpenClaw は現在、利用可能であれば Claude CLI 再利用と `claude -p` を優先します。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- PIモデル参照: `openai-codex/gpt-5.5`
- ネイティブCodex app-server harness 参照: `openai/gpt-5.5` と `agents.defaults.agentRuntime.id: "codex"`
- ネイティブCodex app-server harness ドキュメント: [Codex harness](/ja-JP/plugins/codex-harness)
- 従来のモデル参照: `codex/gpt-*`
- Plugin 境界: `openai-codex/*` はOpenAI Plugin を読み込みます。ネイティブCodex app-server Plugin は、Codex harness ランタイムまたは従来の `codex/*` 参照でのみ選択されます。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトtransport は `auto`（WebSocket優先、SSEフォールバック）
- PIモデルごとの上書きは `agents.defaults.models["openai-codex/<model>"].params.transport` で行います（`"sse"`, `"websocket"`, `"auto"`）
- `params.serviceTier` は、ネイティブCodex Responses リクエスト（`chatgpt.com/backend-api`）でも転送されます
- 隠しOpenClaw attribution headers（`originator`, `version`, `User-Agent`）は、汎用のOpenAI互換proxyではなく、`chatgpt.com/backend-api` へのネイティブCodexトラフィックにのみ付与されます
- 直接の `openai/*` と同じ `/fast` トグルと `params.fastMode` config を共有し、OpenClaw はそれを `service_tier=priority` にマップします
- `openai-codex/gpt-5.5` は、Codexカタログのネイティブ `contextWindow = 400000` と、デフォルトランタイムの `contextTokens = 272000` を使います。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きできます
- ポリシー注記: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフロー向けに明示的にサポートされています。
- Codex OAuth/サブスクリプション経路を使いたい場合は `openai-codex/gpt-5.5` を、API-key設定とローカルカタログで公開API経路が利用できる場合は `openai/gpt-5.5` を使ってください。

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

<CardGroup cols={3}>
  <Card title="GLM models" href="/ja-JP/providers/glm">
    Z.AI Coding Plan または一般的なAPIエンドポイント。
  </Card>
  <Card title="MiniMax" href="/ja-JP/providers/minimax">
    MiniMax Coding Plan OAuth またはAPI key アクセス。
  </Card>
  <Card title="Qwen Cloud" href="/ja-JP/providers/qwen">
    Qwen Cloud プロバイダーサーフェスに加え、Alibaba DashScope と Coding Plan のエンドポイントマッピング。
  </Card>
</CardGroup>

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zenランタイムプロバイダー: `opencode`
- Goランタイムプロバイダー: `opencode-go`
- 例のモデル: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` または `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API key）

- プロバイダー: `google`
- 認証: `GEMINI_API_KEY`
- 任意のローテーション: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一上書き）
- 例のモデル: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: 従来のOpenClaw config で使われていた `google/gemini-3.1-flash-preview` は `google/gemini-3-flash-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` はGoogle dynamic thinking を使います。Gemini 3/3.1 は固定の `thinkingLevel` を省略し、Gemini 2.5 は `thinkingBudget: -1` を送信します。
- 直接のGemini実行では、`agents.defaults.models["google/<model>"].params.cachedContent`（または従来の `cached_content`）も受け付け、プロバイダーネイティブな `cachedContents/...` ハンドルを転送します。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表面化します

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`, `google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用し、Gemini CLI はそのOAuthフローを使用します

<Warning>
OpenClaw における Gemini CLI OAuth は非公式の統合です。サードパーティクライアント使用後にGoogleアカウント制限がかかったと報告するユーザーもいます。使用を選ぶ場合はGoogleの規約を確認し、重要でないアカウントを使ってください。
</Warning>

Gemini CLI OAuth は、バンドル済みの `google` Plugin の一部として提供されます。

<Steps>
  <Step title="Gemini CLIをインストールする">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Plugin を有効にする">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="ログイン">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`。client id や secret を `openclaw.json` に貼り付ける必要は**ありません**。CLIログインフローは、gatewayホスト上のauth profiles にトークンを保存します。

  </Step>
  <Step title="プロジェクトを設定する（必要な場合）">
    ログイン後もリクエストが失敗する場合は、gatewayホスト上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  </Step>
</Steps>

Gemini CLI のJSON返信は `response` からパースされ、使用量は `stats` にフォールバックします。`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- 例のモデル: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出し、`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- 例のモデル: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- 例のモデル: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベースURL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が含まれ、liveな `https://api.kilo.ai/api/gateway/models` の検出によってランタイムカタログがさらに拡張されることがあります。
- `kilocode/kilo/auto` の背後にある正確な上流ルーティングは、OpenClaw にハードコードされておらず、Kilo Gateway 側が管理します。

セットアップ詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル済みプロバイダーPlugin

| プロバイダー | Id | 認証env | 例のモデル |
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

#### 知っておくとよい癖

<AccordionGroup>
  <Accordion title="OpenRouter">
    app-attribution headers と Anthropic `cache_control` マーカーは、検証済みの `openrouter.ai` ルートでのみ適用されます。DeepSeek、Moonshot、ZAI 参照は OpenRouter 管理のprompt caching におけるcache-TTL対象ですが、Anthropic cache マーカーは付きません。proxy型のOpenAI互換経路であるため、ネイティブOpenAI専用の整形（`serviceTier`, Responses `store`, prompt-cache ヒント, OpenAI reasoning互換）はスキップされます。Geminiベース参照では、proxy-Gemini の thought-signature サニタイズのみ維持されます。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Geminiベース参照は同じ proxy-Gemini サニタイズ経路に従います。`kilocode/kilo/auto` と、proxy reasoning 非対応の他の参照では、proxy reasoning 注入はスキップされます。
  </Accordion>
  <Accordion title="MiniMax">
    API-key オンボーディングでは、明示的なテキスト専用M2.7チャットモデル定義を書き込みます。画像理解は引き続きPlugin 管理の `MiniMax-VL-01` メディアプロバイダー上にあります。
  </Accordion>
  <Accordion title="xAI">
    xAI Responses 経路を使います。`/fast` または `params.fastMode: true` は、`grok-3`, `grok-3-mini`, `grok-4`, `grok-4-0709` をそれぞれの `*-fast` 版に書き換えます。`tool_stream` はデフォルトでオンです。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を設定してください。
  </Accordion>
  <Accordion title="Cerebras">
    GLMモデルでは `zai-glm-4.7` / `zai-glm-4.6` を使います。OpenAI互換のベースURLは `https://api.cerebras.ai/v1` です。
  </Accordion>
</AccordionGroup>

## `models.providers` 経由のプロバイダー（custom/base URL）

**カスタム**プロバイダーや OpenAI/Anthropic互換proxy を追加するには `models.providers`（または `models.json`）を使います。

以下のバンドル済みプロバイダーPlugin の多くは、すでにデフォルトカタログを公開しています。デフォルトのbase URL、headers、モデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使用してください。

### Moonshot AI（Kimi）

Moonshot はバンドル済みプロバイダーPlugin として提供されます。通常は組み込みプロバイダーを使い、base URL またはモデルメタデータを上書きしたい場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- 例のモデル: `moonshot/kimi-k2.6`
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

Kimi Coding は、Moonshot AI の Anthropic互換エンドポイントを使用します。

- プロバイダー: `kimi`
- 認証: `KIMI_API_KEY`
- 例のモデル: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

従来の `kimi/k2p5` も互換モデルIDとして引き続き受け付けられます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国で Doubao やその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine`（coding: `volcengine-plan`）
- 認証: `VOLCANO_ENGINE_API_KEY`
- 例のモデル: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングではデフォルトでcodingサーフェスを使いますが、一般向けの `volcengine/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengine の認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。それらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー限定ピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

  </Tab>
  <Tab title="Codingモデル（volcengine-plan）">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（International）

BytePlus ARK は、国際ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus`（coding: `byteplus-plan`）
- 認証: `BYTEPLUS_API_KEY`
- 例のモデル: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングではデフォルトでcodingサーフェスを使いますが、一般向けの `byteplus/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlus の認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。それらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー限定ピッカーを表示する代わりに、フィルタなしカタログへフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

  </Tab>
  <Tab title="Codingモデル（byteplus-plan）">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic は、`synthetic` プロバイダーの背後で Anthropic互換モデルを提供します:

- プロバイダー: `synthetic`
- 認証: `SYNTHETIC_API_KEY`
- 例のモデル: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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
- MiniMax API key（Global）: `--auth-choice minimax-global-api`
- MiniMax API key（CN）: `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`、`minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップ詳細、モデルオプション、configスニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

<Note>
MiniMax の Anthropic互換ストリーミング経路では、明示的に設定しない限り OpenClaw はデフォルトで thinking を無効にし、`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
</Note>

Plugin 管理の capability 分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01`
- 画像理解は、両方の MiniMax 認証経路でPlugin 管理の `MiniMax-VL-01`
- Web検索はプロバイダーid `minimax` のままです

### LM Studio

LM Studio は、ネイティブAPIを使うバンドル済みプロバイダーPlugin として提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルト推論ベースURL: `http://localhost:1234/v1`

その後、モデルを設定します（`http://localhost:1234/api/v1/models` が返すIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は、検出 + 自動ロードに LM Studio ネイティブの `/api/v1/models` と `/api/v1/models/load` を使用し、推論にはデフォルトで `/v1/chat/completions` を使います。セットアップとトラブルシューティングは [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済みプロバイダーPlugin として提供され、Ollama のネイティブAPIを使います。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- 例のモデル: `ollama/llama3.3`
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

Ollama は、`OLLAMA_API_KEY` で明示的に有効化するとローカルの `http://127.0.0.1:11434` で検出され、バンドル済みプロバイダーPlugin によって `openclaw onboard` とモデルピッカーに直接追加されます。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル/セルフホストのOpenAI互換サーバー向けのバンドル済みプロバイダーPlugin として提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出を有効にするには（サーバーが認証を強制しない場合、値は何でもかまいません）:

```bash
export VLLM_API_KEY="vllm-local"
```

その後、モデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホストOpenAI互換サーバー向けのバンドル済みプロバイダーPlugin として提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバー設定による）
- デフォルトベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出を有効にするには（サーバーが認証を強制しない場合、値は何でもかまいません）:

```bash
export SGLANG_API_KEY="sglang-local"
```

その後、モデルを設定します（`/v1/models` が返すIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルproxy（LM Studio、vLLM、LiteLLM など）

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

<AccordionGroup>
  <Accordion title="デフォルトの任意フィールド">
    カスタムプロバイダーでは、`reasoning`, `input`, `cost`, `contextWindow`, `maxTokens` は任意です。省略した場合、OpenClaw は次をデフォルトにします。

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: proxy/モデルの制限に合った明示的な値を設定してください。

  </Accordion>
  <Accordion title="proxyルートの整形ルール">
    - ネイティブでないエンドポイント（`api.openai.com` ではないホストを持つ、空でない `baseUrl`）で `api: "openai-completions"` を使う場合、OpenClaw は未対応の `developer` role によるプロバイダー400エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
    - proxy型のOpenAI互換ルートでは、ネイティブOpenAI専用のリクエスト整形もスキップされます: `service_tier` なし、Responses `store` なし、Completions `store` なし、prompt-cache ヒントなし、OpenAI reasoning互換ペイロード整形なし、隠しOpenClaw attribution headers なし。
    - ベンダー固有フィールドが必要なOpenAI互換 Completions proxy では、`agents.defaults.models["provider/model"].params.extra_body`（または `extraBody`）を設定して、追加JSONを送信リクエストボディにマージしてください。
    - vLLM の chat-template 制御には、`agents.defaults.models["provider/model"].params.chat_template_kwargs` を設定します。OpenClaw は、セッションのthinkingレベルがオフのとき、`vllm/nemotron-3-*` に対して `enable_thinking: false` と `force_nonempty_content: true` を自動送信します。
    - `baseUrl` が空または省略されている場合、OpenClaw はデフォルトのOpenAI動作（`api.openai.com` に解決される）を維持します。
    - 安全のため、ネイティブでない `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。

  </Accordion>
</AccordionGroup>

## CLI例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

関連: 完全な設定例については [Configuration](/ja-JP/gateway/configuration) も参照してください。

## 関連

- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults) — モデルconfigキー
- [Model failover](/ja-JP/concepts/model-failover) — フォールバックチェーンとリトライ動作
- [Models](/ja-JP/concepts/models) — モデル設定とエイリアス
- [Providers](/ja-JP/providers) — プロバイダーごとのセットアップガイド

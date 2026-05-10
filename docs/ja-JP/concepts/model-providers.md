---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例または CLI オンボーディングコマンドが必要な場合
sidebarTitle: Model providers
summary: モデルプロバイダーの概要（設定例 + CLI フロー付き）
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-05-10T19:31:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 643ee88e7d0cf4f9fe148ae8e390a1d7bba4986c29dd4fda6074f048f58dd7bb
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/モデルプロバイダー**（WhatsApp/Telegram のようなチャットチャネルではない）のリファレンス。モデル選択ルールについては、[モデル](/ja-JP/concepts/models)を参照してください。

## クイックルール

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` は、設定されている場合は許可リストとして機能します。
    - CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` はプロバイダーレベルのデフォルトを設定します。`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` はモデルごとにそれらを上書きします。
    - フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` は、プロバイダーを追加または再認証するときに既存の `agents.defaults.model.primary` を保持します。プロバイダー Plugin は認証設定パッチで推奨デフォルトモデルを返す場合がありますが、configure はプライマリモデルがすでに存在する場合、それを「このモデルを利用可能にする」として扱い、「現在のプライマリモデルを置き換える」とは扱いません。

    デフォルトモデルを意図的に切り替えるには、`openclaw models set <provider/model>` または `openclaw models auth login --provider <id> --set-default` を使用します。

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI ファミリーのルートはプレフィックス固有です。

    - `openai/<model>` は、デフォルトでエージェントターンにネイティブ Codex アプリサーバーハーネスを使用します。これは通常の ChatGPT/Codex サブスクリプション構成です。
    - `openai-codex/<model>` は、doctor が `openai/<model>` に書き換えるレガシー設定です。
    - `openai/<model>` にプロバイダー/モデルの `agentRuntime.id: "pi"` を組み合わせると、明示的な API キーまたは互換性ルートに PI を使用します。

    [OpenAI](/ja-JP/providers/openai) と [Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。プロバイダー/ランタイムの分割がわかりにくい場合は、まず [エージェントランタイム](/ja-JP/concepts/agent-runtimes)を読んでください。

    Plugin の自動有効化も同じ境界に従います。`openai/*` エージェント参照はデフォルトルート用に Codex Plugin を有効にし、明示的なプロバイダー/モデルの `agentRuntime.id: "codex"` またはレガシー `codex/<model>` 参照でもそれが必要です。

    GPT-5.5 は、デフォルトでは `openai/gpt-5.5` のネイティブ Codex アプリサーバーハーネス経由で利用でき、プロバイダー/モデルのランタイムポリシーが明示的に `pi` を選択した場合のみ PI 経由で利用できます。

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI ランタイムも同じ分割を使用します。`anthropic/claude-*`、`google/gemini-*`、`openai/gpt-*` のような正規モデル参照を選択し、ローカル CLI バックエンドが必要な場合は、プロバイダー/モデルのランタイムポリシーを `claude-cli`、`google-gemini-cli`、または `codex-cli` に設定します。

    レガシーの `claude-cli/*`、`google-gemini-cli/*`、`codex-cli/*` 参照は、ランタイムを別途記録したうえで正規プロバイダー参照に戻されます。

  </Accordion>
</AccordionGroup>

## Plugin 所有のプロバイダー挙動

プロバイダー固有のロジックの大半はプロバイダー Plugin（`registerProvider(...)`）内にあり、OpenClaw は汎用的な推論ループを保持します。Plugin は、オンボーディング、モデルカタログ、認証環境変数マッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、thinking/reasoning プロファイルなどを所有します。

プロバイダー SDK フックと同梱 Plugin 例の完全な一覧は、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)にあります。完全にカスタムのリクエスト実行器を必要とするプロバイダーは、別のより深い拡張サーフェスです。

<Note>
プロバイダー所有のランナー挙動は、リプレイポリシー、ツールスキーマ正規化、ストリームラッピング、トランスポート/リクエストヘルパーなどの明示的なプロバイダーフック上に存在します。レガシーの `ProviderPlugin.capabilities` 静的バッグは互換性専用であり、共有ランナーロジックではもう読み取られません。
</Note>

## API キーローテーション

<AccordionGroup>
  <Accordion title="Key sources and priority">
    複数のキーは次で設定します。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最高優先度）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キー選択順序は優先度を保持し、値を重複排除します。

  </Accordion>
  <Accordion title="When rotation kicks in">
    - リクエストは、レート制限レスポンス（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）の場合にのみ、次のキーで再試行されます。
    - レート制限以外の失敗は即座に失敗します。キーローテーションは試行されません。
    - すべての候補キーが失敗した場合、最後の試行からの最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 組み込みプロバイダー（pi-ai カタログ）

OpenClaw には pi-ai カタログが同梱されています。これらのプロバイダーには **`models.providers` 設定は不要**です。認証を設定してモデルを選ぶだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一の上書き）
- モデル例: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 特定のインストールまたは API キーの挙動が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの可用性を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` です。OpenClaw はトランスポート選択を pi-ai に渡します。
- モデルごとに `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で上書きします
- OpenAI 優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマップします
- 共有の `/fast` トグルではなく明示的なティアが必要な場合は、`params.serviceTier` を使用します
- 非表示の OpenClaw 属性ヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用され、汎用 OpenAI 互換プロキシには適用されません
- ネイティブ OpenAI ルートは、Responses の `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換ペイロード整形も保持します。プロキシルートでは保持しません
- `openai/gpt-5.3-codex-spark` は、ライブ OpenAI API リクエストが拒否し、現在の Codex カタログでも公開されていないため、OpenClaw では意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一の上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接のパブリック Anthropic リクエストは、`api.anthropic.com` に送信される API キーおよび OAuth 認証済みトラフィックを含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はそれを Anthropic の `service_tier`（`auto` 対 `standard_only`）にマップします
- 推奨される Claude CLI 設定では、モデル参照を正規のままにし、CLI
  バックエンドを別途選択します: `anthropic/claude-opus-4-7` と
  モデルスコープの `agentRuntime.id: "claude-cli"`。レガシーの
  `claude-cli/claude-opus-4-7` 参照も互換性のため引き続き動作します。

<Note>
Anthropic スタッフから、OpenClaw スタイルの Claude CLI 使用が再び許可されたと伝えられたため、OpenClaw は Anthropic が新しいポリシーを公開しない限り、この統合における Claude CLI 再利用と `claude -p` 使用を認可済みとして扱います。Anthropic setup-token はサポート済みの OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI 再利用と `claude -p` を優先します。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- レガシー PI モデル参照: `openai-codex/gpt-5.5`
- ネイティブ Codex アプリサーバーハーネス参照: `openai/gpt-5.5`
- ネイティブ Codex アプリサーバーハーネスのドキュメント: [Codex ハーネス](/ja-JP/plugins/codex-harness)
- レガシーモデル参照: `codex/gpt-*`
- Plugin 境界: `openai-codex/*` は OpenAI Plugin を読み込みます。ネイティブ Codex アプリサーバー Plugin は、Codex ハーネスランタイムまたはレガシー `codex/*` 参照によってのみ選択されます。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトのトランスポートは `auto`（WebSocket 優先、SSE フォールバック）です
- PI モデルごとに `agents.defaults.models["openai-codex/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で上書きします
- `params.serviceTier` はネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示の OpenClaw 属性ヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付与され、汎用 OpenAI 互換プロキシには付与されません
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有します。OpenClaw はそれを `service_tier=priority` にマップします
- `openai-codex/gpt-5.5` は Codex カタログネイティブの `contextWindow = 400000` とデフォルトランタイム `contextTokens = 272000` を使用します。ランタイム上限は `models.providers.openai-codex.models[].contextTokens` で上書きします
- ポリシー注記: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフロー向けに明示的にサポートされています。
- 一般的なサブスクリプションにネイティブ Codex ランタイムルートを組み合わせる場合は、`openai-codex` 認証でサインインし、`openai/gpt-5.5` を設定します。OpenAI エージェントターンはデフォルトで Codex を選択します。
- PI 経由の互換性ルートが必要な場合にのみ、プロバイダー/モデルの `agentRuntime.id: "pi"` を使用します。それ以外の場合は、`openai/gpt-5.5` をデフォルトの Codex ハーネスに保持します。
- 古い `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*`、および `openai-codex/gpt-5.3*` 参照は、ChatGPT/Codex OAuth アカウントが拒否するため抑制されています。代わりに `openai-codex/gpt-5.5` またはネイティブ Codex ランタイムルートを使用してください。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
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

### その他のサブスクリプション形式のホスト型オプション

<CardGroup cols={3}>
  <Card title="GLM models" href="/ja-JP/providers/glm">
    Z.AI Coding Plan または一般 API エンドポイント。
  </Card>
  <Card title="MiniMax" href="/ja-JP/providers/minimax">
    MiniMax Coding Plan OAuth または API キーアクセス。
  </Card>
  <Card title="Qwen Cloud" href="/ja-JP/providers/qwen">
    Qwen Cloud プロバイダーサーフェスに加え、Alibaba DashScope と Coding Plan エンドポイントのマッピング。
  </Card>
</CardGroup>

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
- 任意のローテーション: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一オーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用する従来の OpenClaw 設定は `google/gemini-3-flash-preview` に正規化されます
- エイリアス: `google/gemini-3.1-pro` は受け付けられ、Google のライブ Gemini API ID である `google/gemini-3.1-pro-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 思考: `/think adaptive` は Google の動的思考を使用します。Gemini 3/3.1 は固定の `thinkingLevel` を省略します。Gemini 2.5 は `thinkingBudget: -1` を送信します。
- 直接の Gemini 実行では、プロバイダー固有の `cachedContents/...` ハンドルを転送するために `agents.defaults.models["google/<model>"].params.cachedContent`（または従来の `cached_content`）も受け付けます。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表示されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`, `google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用します。Gemini CLI は独自の OAuth フローを使用します

<Warning>
OpenClaw の Gemini CLI OAuth は非公式の統合です。一部のユーザーから、サードパーティークライアントの使用後に Google アカウントの制限を受けたという報告があります。Google の規約を確認し、続行する場合は重要でないアカウントを使用してください。
</Warning>

Gemini CLI OAuth は、バンドル済みの `google` Plugin の一部として提供されます。

<Steps>
  <Step title="Gemini CLI をインストール">
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
  <Step title="Plugin を有効化">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="ログイン">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`。クライアント ID やシークレットを `openclaw.json` に貼り付ける必要は**ありません**。CLI ログインフローは、Gateway ホスト上の認証プロファイルにトークンを保存します。

  </Step>
  <Step title="プロジェクトを設定（必要な場合）">
    ログイン後にリクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  </Step>
</Steps>

Gemini CLI の JSON 応答は `response` から解析されます。使用量は `stats` にフォールバックし、`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

### Z.AI (GLM)

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化されます
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出します。`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が含まれます。ライブの `https://api.kilo.ai/api/gateway/models` 検出により、ランタイムカタログをさらに拡張できます。
- `kilocode/kilo/auto` の背後にある正確なアップストリームルーティングは Kilo Gateway が所有し、OpenClaw にハードコードされていません。

セットアップの詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他のバンドル済みプロバイダー Plugin

| プロバイダー                | ID                               | 認証 env                                                     | モデル例                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` または `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 知っておくべき癖

<AccordionGroup>
  <Accordion title="OpenRouter">
    検証済みの `openrouter.ai` ルートでのみ、アプリ帰属ヘッダーと Anthropic `cache_control` マーカーを適用します。DeepSeek、Moonshot、ZAI の ref は OpenRouter 管理のプロンプトキャッシュでキャッシュ TTL の対象になりますが、Anthropic キャッシュマーカーは受け取りません。プロキシ形式の OpenAI 互換パスとして、ネイティブ OpenAI 専用の整形（`serviceTier`、Responses `store`、プロンプトキャッシュヒント、OpenAI 推論互換）をスキップします。Gemini バックエンドの ref は、プロキシ Gemini の思考シグネチャサニタイズのみを保持します。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini バックエンドの ref は同じプロキシ Gemini サニタイズパスに従います。`kilocode/kilo/auto` とその他のプロキシ推論非対応 ref は、プロキシ推論注入をスキップします。
  </Accordion>
  <Accordion title="MiniMax">
    API キーのオンボーディングは、明示的なテキスト専用 M2.7 チャットモデル定義を書き込みます。画像理解は Plugin が所有する `MiniMax-VL-01` メディアプロバイダー上に残ります。
  </Accordion>
  <Accordion title="NVIDIA">
    モデル ID は `nvidia/<vendor>/<model>` 名前空間を使います（たとえば `nvidia/moonshotai/kimi-k2.5` と並んで `nvidia/nvidia/nemotron-...`）。ピッカーはリテラルな `<provider>/<model-id>` 合成を保持しつつ、API に送信される正規キーは単一プレフィックスのままです。
  </Accordion>
  <Accordion title="xAI">
    xAI Responses パスを使います。`grok-4.3` はバンドル済みのデフォルトチャットモデルです。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトでオンです。`agents.defaults.models["xai/<model>"].params.tool_stream=false` で無効化します。
  </Accordion>
  <Accordion title="Cerebras">
    バンドル済みの `cerebras` プロバイダー Plugin として提供されます。GLM は `zai-glm-4.7` を使います。OpenAI 互換のベース URL は `https://api.cerebras.ai/v1` です。
  </Accordion>
</AccordionGroup>

## `models.providers` 経由のプロバイダー（カスタム/ベース URL）

`models.providers`（または `models.json`）を使って、**カスタム**プロバイダーまたは OpenAI/Anthropic 互換プロキシを追加します。

以下のバンドル済みプロバイダー Plugin の多くは、すでにデフォルトカタログを公開しています。デフォルトのベース URL、ヘッダー、またはモデル一覧をオーバーライドしたい場合にのみ、明示的な `models.providers.<id>` エントリを使ってください。

Gateway モデル機能チェックは、明示的な `models.providers.<id>.models[]` メタデータも読み取ります。カスタムモデルまたはプロキシモデルが画像を受け付ける場合、そのモデルに `input: ["text", "image"]` を設定して、WebChat とノード起点の添付ファイルパスが画像をテキスト専用メディア ref ではなくネイティブモデル入力として渡せるようにします。

`agents.defaults.models["provider/model"]` は、エージェント向けのモデル表示、エイリアス、モデルごとのメタデータのみを制御します。それ自体では新しいランタイムモデルを登録しません。カスタムプロバイダーモデルでは、一致する `id` を少なくとも含む `models.providers.<provider>.models[]` も追加してください。

### Moonshot AI (Kimi)

Moonshot はバンドル済みプロバイダー Plugin として提供されます。デフォルトでは組み込みプロバイダーを使い、ベース URL またはモデルメタデータをオーバーライドする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 モデル ID:

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

### Kimi コーディング

Kimi Coding は Moonshot AI の Anthropic 互換エンドポイントを使用します。

- プロバイダー: `kimi`
- 認証: `KIMI_API_KEY`
- モデル例: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

従来の `kimi/kimi-code` と `kimi/k2p5` は互換性のためのモデル ID として引き続き受け入れられ、Kimi の安定版 API モデル ID に正規化されます。

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) は、中国で Doubao などのモデルへのアクセスを提供します。

- プロバイダー: `volcengine` (コーディング: `volcengine-plan`)
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

オンボーディングでは既定でコーディング面が使われますが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/構成のモデル選択では、Volcengine 認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲の選択画面を表示するのではなく、フィルターなしのカタログにフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="コーディングモデル (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (国際)

BytePlus ARK は、国際ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus` (コーディング: `byteplus-plan`)
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

オンボーディングでは既定でコーディング面が使われますが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/構成のモデル選択では、BytePlus 認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲の選択画面を表示するのではなく、フィルターなしのカタログにフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="コーディングモデル (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` で構成します。

- MiniMax OAuth (グローバル): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (中国): `--auth-choice minimax-cn-oauth`
- MiniMax API キー (グローバル): `--auth-choice minimax-global-api`
- MiniMax API キー (中国): `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`; `minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、構成スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

<Note>
MiniMax の Anthropic 互換ストリーミング経路では、明示的に設定しない限り OpenClaw は既定で thinking を無効にし、`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
</Note>

Plugin が所有する capability の分割:

- テキスト/チャットの既定値は `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方の MiniMax 認証経路で Plugin 所有の `MiniMax-VL-01` です
- Web 検索はプロバイダー ID `minimax` のままです

### LM Studio

LM Studio は、ネイティブ API を使用するバンドル済みプロバイダー Plugin として同梱されています。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- 既定の推論ベース URL: `http://localhost:1234/v1`

次にモデルを設定します (`http://localhost:1234/api/v1/models` が返す ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は探索と自動読み込みに LM Studio のネイティブ `/api/v1/models` と `/api/v1/models/load` を使用し、推論には既定で `/v1/chat/completions` を使用します。LM Studio の JIT 読み込み、TTL、自動退避にモデルライフサイクルを所有させたい場合は、`models.providers.lmstudio.params.preload: false` を設定してください。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済みプロバイダー Plugin として同梱され、Ollama のネイティブ API を使用します。

- プロバイダー: `ollama`
- 認証: 不要 (ローカルサーバー)
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY` でオプトインすると、Ollama は `http://127.0.0.1:11434` でローカル検出され、バンドル済みプロバイダー Plugin が Ollama を `openclaw onboard` とモデル選択画面に直接追加します。オンボーディング、クラウド/ローカルモード、カスタム構成については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル/セルフホストの OpenAI 互換サーバー向けのバンドル済みプロバイダー Plugin として同梱されています。

- プロバイダー: `vllm`
- 認証: 任意 (サーバーによります)
- 既定のベース URL: `http://127.0.0.1:8000/v1`

ローカルで自動探索にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します (`/v1/models` が返す ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細については [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホスト OpenAI 互換サーバー向けのバンドル済みプロバイダー Plugin として同梱されています。

- プロバイダー: `sglang`
- 認証: 任意 (サーバーによります)
- 既定のベース URL: `http://127.0.0.1:30000/v1`

ローカルで自動探索にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します (`/v1/models` が返す ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細については [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルプロキシ (LM Studio、vLLM、LiteLLM など)

例 (OpenAI 互換):

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
        timeoutSeconds: 300,
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
  <Accordion title="既定の任意フィールド">
    カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。省略した場合、OpenClaw は既定で次を使用します。

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: プロキシ/モデルの制限に一致する値を明示的に設定してください。

  </Accordion>
  <Accordion title="プロキシルート整形ルール">
    - ネイティブでないエンドポイント (ホストが `api.openai.com` ではない、空でない任意の `baseUrl`) の `api: "openai-completions"` では、OpenClaw はサポートされていない `developer` ロールによるプロバイダーの 400 エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
    - プロキシ形式の OpenAI 互換ルートでは、ネイティブ OpenAI 専用のリクエスト整形もスキップされます。`service_tier` なし、Responses `store` なし、Completions `store` なし、プロンプトキャッシュヒントなし、OpenAI reasoning 互換ペイロード整形なし、非表示の OpenClaw attribution ヘッダーなしです。
    - ベンダー固有フィールドが必要な OpenAI 互換 Completions プロキシでは、送信リクエスト本文に追加 JSON をマージするために `agents.defaults.models["provider/model"].params.extra_body` (または `extraBody`) を設定してください。
    - vLLM のチャットテンプレート制御では、`agents.defaults.models["provider/model"].params.chat_template_kwargs` を設定してください。バンドル済み vLLM Plugin は、セッションの thinking レベルがオフの場合、`vllm/nemotron-3-*` に対して `enable_thinking: false` と `force_nonempty_content: true` を自動送信します。
    - 遅いローカルモデルやリモート LAN/tailnet ホストでは、`models.providers.<id>.timeoutSeconds` を設定してください。これにより、接続、ヘッダー、本文ストリーミング、保護付き fetch の総 abort を含むプロバイダーモデル HTTP リクエスト処理が延長されますが、エージェントランタイム全体のタイムアウトは増えません。
    - モデルプロバイダー HTTP 呼び出しは、構成済みプロバイダー `baseUrl` のホスト名に対してのみ、`198.18.0.0/15` と `fc00::/7` にある Surge、Clash、sing-box の fake-IP DNS 応答を許可します。他のプライベート、loopback、リンクローカル、メタデータの宛先には、引き続き明示的な `models.providers.<id>.request.allowPrivateNetwork: true` のオプトインが必要です。
    - `baseUrl` が空または省略されている場合、OpenClaw は既定の OpenAI 動作 (これは `api.openai.com` に解決されます) を維持します。
    - 安全のため、明示的な `compat.supportsDeveloperRole: true` も、ネイティブでない `openai-completions` エンドポイントでは上書きされます。
    - ネイティブでないエンドポイント (正規の `anthropic` 以外のプロバイダー、またはホストが公開 `api.anthropic.com` エンドポイントではないカスタム `models.providers.anthropic.baseUrl`) の `api: "anthropic-messages"` では、OpenClaw は `claude-code-20250219`、`interleaved-thinking-2025-05-14`、OAuth マーカーなどの暗黙の Anthropic ベータヘッダーを抑制するため、カスタム Anthropic 互換プロキシがサポートされていないベータフラグを拒否しません。プロキシに特定のベータ機能が必要な場合は、`models.providers.<id>.headers["anthropic-beta"]` を明示的に設定してください。

  </Accordion>
</AccordionGroup>

## CLI 例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な構成例については、[構成](/ja-JP/gateway/configuration) も参照してください。

## 関連

- [構成リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - モデル構成キー
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) - フォールバックチェーンとリトライ動作
- [モデル](/ja-JP/concepts/models) - モデル構成とエイリアス
- [プロバイダー](/ja-JP/providers) - プロバイダー別セットアップガイド

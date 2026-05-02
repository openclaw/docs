---
read_when:
    - プロバイダー別のモデル設定リファレンスが必要です
    - モデルプロバイダーの設定例または CLI オンボーディングコマンドが必要な場合
sidebarTitle: Model providers
summary: サンプル設定と CLI フローを含むモデルプロバイダー概要
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-05-02T04:53:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e6a6b691b447a66a94f69a7b609f26c587eaa5bc55c5ed62460ce14cc288fd
    source_path: concepts/model-providers.md
    workflow: 16
---

モデル選択ルールについては、[Models](/ja-JP/concepts/models) を参照してください。

## 簡単なルール

<AccordionGroup>
  <Accordion title="モデル参照と CLI ヘルパー">
    - モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` は設定されている場合、許可リストとして機能します。
    - CLI ヘルパー: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` はプロバイダーレベルのデフォルトを設定します。`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` はモデルごとに上書きします。
    - フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="プロバイダー認証を追加してもプライマリモデルは変わりません">
    プロバイダーを追加または再認証するとき、`openclaw configure` は既存の `agents.defaults.model.primary` を保持します。プロバイダー Plugin が認証設定パッチ内で推奨デフォルトモデルを返す場合はありますが、プライマリモデルがすでに存在する場合、configure はそれを「このモデルを利用可能にする」と扱い、「現在のプライマリモデルを置き換える」とは扱いません。

    デフォルトモデルを意図的に切り替えるには、`openclaw models set <provider/model>` または `openclaw models auth login --provider <id> --set-default` を使用します。

  </Accordion>
  <Accordion title="OpenAI プロバイダー/runtime の分離">
    OpenAI 系ルートはプレフィックスごとに分かれています。

    - `openai/<model>` に加えて `agents.defaults.agentRuntime.id: "codex"` を使用すると、ネイティブ Codex app-server ハーネスを使います。これは通常の ChatGPT/Codex サブスクリプション構成です。
    - `openai-codex/<model>` は PI 内の Codex OAuth を使用します。
    - Codex runtime の上書きなしの `openai/<model>` は、PI 内の直接 OpenAI API キープロバイダーを使用します。

    [OpenAI](/ja-JP/providers/openai) と [Codex ハーネス](/ja-JP/plugins/codex-harness) を参照してください。プロバイダー/runtime の分離が分かりにくい場合は、先に [Agent ランタイム](/ja-JP/concepts/agent-runtimes) を読んでください。

    Plugin の自動有効化も同じ境界に従います。`openai-codex/<model>` は OpenAI Plugin に属し、Codex Plugin は `agentRuntime.id: "codex"` またはレガシー `codex/<model>` 参照によって有効化されます。

    GPT-5.5 は、`agentRuntime.id: "codex"` が設定されている場合はネイティブ Codex app-server ハーネス経由で、Codex OAuth では PI 内の `openai-codex/gpt-5.5` 経由で、アカウントが公開している場合は直接 API キートラフィック用に PI 内の `openai/gpt-5.5` 経由で利用できます。

  </Accordion>
  <Accordion title="CLI runtime">
    CLI runtime も同じ分離を使用します。`anthropic/claude-*`、`google/gemini-*`、`openai/gpt-*` のような正規モデル参照を選択し、local CLI バックエンドを使いたい場合は `agents.defaults.agentRuntime.id` を `claude-cli`、`google-gemini-cli`、または `codex-cli` に設定します。

    レガシーの `claude-cli/*`、`google-gemini-cli/*`、`codex-cli/*` 参照は、runtime を別に記録したうえで正規プロバイダー参照へ移行されます。

  </Accordion>
</AccordionGroup>

## Plugin 所有のプロバイダー動作

プロバイダー固有ロジックの大半はプロバイダー Plugin（`registerProvider(...)`）内にあり、OpenClaw は汎用推論ループを保持します。Plugin はオンボーディング、モデルカタログ、認証 env-var マッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、thinking/reasoning プロファイルなどを所有します。

プロバイダー SDK フックと同梱 Plugin の例の完全な一覧は [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムなリクエスト実行器を必要とするプロバイダーは、別のより深い拡張サーフェスです。

<Note>
プロバイダー所有の runner 動作は、リプレイポリシー、ツールスキーマ正規化、ストリームラッピング、トランスポート/リクエストヘルパーなどの明示的なプロバイダーフックにあります。レガシーの `ProviderPlugin.capabilities` 静的 bag は互換性専用であり、共有 runner ロジックではもう読み取られません。
</Note>

## API キーのローテーション

<AccordionGroup>
  <Accordion title="キーのソースと優先順位">
    複数のキーは次の方法で設定します。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一の live 上書き、最高優先度）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロンのリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キー選択順序は優先度を保持し、値を重複排除します。

  </Accordion>
  <Accordion title="ローテーションが開始されるタイミング">
    - リクエストは、レート制限レスポンスの場合にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
    - レート制限以外の失敗は即座に失敗します。キーのローテーションは試行されません。
    - すべての候補キーが失敗した場合、最後の試行からの最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 組み込みプロバイダー（pi-ai カタログ）

OpenClaw には pi‑ai カタログが同梱されています。これらのプロバイダーに `models.providers` 設定は**不要**です。認証を設定してモデルを選択するだけです。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、さらに `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 特定のインストールまたは API キーの動作が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの可用性を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto`（WebSocket 優先、SSE フォールバック）
- `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）でモデルごとに上書きします
- OpenAI Responses WebSocket warm-up は `params.openaiWsWarmup`（`true`/`false`）によりデフォルトで有効です
- OpenAI 優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効にできます
- `/fast` と `params.fastMode` は、直接 `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします
- 共有の `/fast` トグルではなく明示的な tier が必要な場合は、`params.serviceTier` を使用します
- 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用され、汎用 OpenAI 互換プロキシには適用されません
- ネイティブ OpenAI ルートでは Responses の `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換ペイロード整形も保持されます。プロキシルートでは保持されません
- `openai/gpt-5.3-codex-spark` は、live OpenAI API リクエストが拒否し、現在の Codex カタログでも公開されていないため、OpenClaw では意図的に抑制されています

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、さらに `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接 public Anthropic リクエストは、`api.anthropic.com` に送信される API キーおよび OAuth 認証済みトラフィックを含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はそれを Anthropic `service_tier`（`auto` と `standard_only`）にマッピングします
- 推奨 Claude CLI 設定では、モデル参照を正規のままにし、CLI
  バックエンドを別に選択します: `anthropic/claude-opus-4-7` と
  `agents.defaults.agentRuntime.id: "claude-cli"`。レガシーの
  `claude-cli/claude-opus-4-7` 参照も互換性のため引き続き動作します。

<Note>
Anthropic スタッフは、OpenClaw 形式の Claude CLI 使用が再び許可されていると伝えたため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合における Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。Anthropic setup-token はサポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は現在、利用可能な場合は Claude CLI の再利用と `claude -p` を優先します。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- プロバイダー: `openai-codex`
- 認証: OAuth（ChatGPT）
- PI モデル参照: `openai-codex/gpt-5.5`
- ネイティブ Codex app-server ハーネス参照: `agents.defaults.agentRuntime.id: "codex"` を伴う `openai/gpt-5.5`
- ネイティブ Codex app-server ハーネスのドキュメント: [Codex ハーネス](/ja-JP/plugins/codex-harness)
- レガシーモデル参照: `codex/gpt-*`
- Plugin 境界: `openai-codex/*` は OpenAI Plugin を読み込みます。ネイティブ Codex app-server Plugin は、Codex ハーネス runtime またはレガシー `codex/*` 参照によってのみ選択されます。
- CLI: `openclaw onboard --auth-choice openai-codex` または `openclaw models auth login --provider openai-codex`
- デフォルトのトランスポートは `auto`（WebSocket 優先、SSE フォールバック）
- `agents.defaults.models["openai-codex/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で PI モデルごとに上書きします
- `params.serviceTier` はネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）でも転送されます
- 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付与され、汎用 OpenAI 互換プロキシには付与されません
- 直接 `openai/*` と同じ `/fast` トグルと `params.fastMode` 設定を共有します。OpenClaw はそれを `service_tier=priority` にマッピングします
- `openai-codex/gpt-5.5` は Codex カタログネイティブの `contextWindow = 400000` とデフォルト runtime `contextTokens = 272000` を使用します。runtime 上限は `models.providers.openai-codex.models[].contextTokens` で上書きします
- ポリシーメモ: OpenAI Codex OAuth は OpenClaw のような外部ツール/ワークフローで明示的にサポートされています。
- 一般的なサブスクリプションとネイティブ Codex runtime のルートでは、`openai-codex` 認証でサインインし、`openai/gpt-5.5` と `agents.defaults.agentRuntime.id: "codex"` を構成します。
- PI 経由の Codex OAuth/サブスクリプションルートが必要な場合にのみ `openai-codex/gpt-5.5` を使用します。API キー構成とローカルカタログが公開 API ルートを公開している場合は、Codex runtime 上書きなしで `openai/gpt-5.5` を使用します。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex", fallback: "none" },
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
  <Card title="GLM モデル" href="/ja-JP/providers/glm">
    Z.AI Coding Plan または一般 API エンドポイント。
  </Card>
  <Card title="MiniMax" href="/ja-JP/providers/minimax">
    MiniMax Coding Plan OAuth または API キーアクセス。
  </Card>
  <Card title="Qwen Cloud" href="/ja-JP/providers/qwen">
    Qwen Cloud プロバイダーサーフェスに加え、Alibaba DashScope と Coding Plan エンドポイントマッピング。
  </Card>
</CardGroup>

### OpenCode

- 認証: `OPENCODE_API_KEY`（または `OPENCODE_ZEN_API_KEY`）
- Zen runtime プロバイダー: `opencode`
- Go runtime プロバイダー: `opencode-go`
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
- オプションのローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一のオーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用するレガシー OpenClaw 設定は `google/gemini-3-flash-preview` に正規化される
- エイリアス: `google/gemini-3.1-pro` は受け入れられ、Google のライブ Gemini API ID である `google/gemini-3.1-pro-preview` に正規化される
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 思考: `/think adaptive` は Google の動的思考を使用する。Gemini 3/3.1 は固定の `thinkingLevel` を省略する。Gemini 2.5 は `thinkingBudget: -1` を送信する。
- 直接の Gemini 実行では、プロバイダー固有の `cachedContents/...` ハンドルを転送するために `agents.defaults.models["google/<model>"].params.cachedContent`（またはレガシーの `cached_content`）も受け入れる。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表示される

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用する。Gemini CLI は独自の OAuth フローを使用する

<Warning>
OpenClaw の Gemini CLI OAuth は非公式の連携です。一部のユーザーは、サードパーティクライアントの使用後に Google アカウントの制限を報告しています。続行する場合は Google の規約を確認し、重要でないアカウントを使用してください。
</Warning>

Gemini CLI OAuth は同梱の `google` plugin の一部として提供されます。

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
  <Step title="plugin を有効化">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="ログイン">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`。クライアント ID やシークレットを `openclaw.json` に貼り付ける必要は**ありません**。CLI ログインフローは Gateway ホスト上の認証プロファイルにトークンを保存します。

  </Step>
  <Step title="プロジェクトを設定（必要な場合）">
    ログイン後にリクエストが失敗する場合は、Gateway ホスト上で `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定します。
  </Step>
</Steps>

Gemini CLI の JSON 応答は `response` から解析されます。使用量は `stats` にフォールバックし、`stats.cached` は OpenClaw の `cacheRead` に正規化されます。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - エイリアス: `z.ai/*` と `z-ai/*` は `zai/*` に正規化される
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出する。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制する

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- プロバイダー: `kilocode`
- 認証: `KILOCODE_API_KEY`
- モデル例: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- ベース URL: `https://api.kilo.ai/api/gateway/`
- 静的フォールバックカタログには `kilocode/kilo/auto` が含まれる。ライブの `https://api.kilo.ai/api/gateway/models` 検出により、ランタイムカタログをさらに拡張できる。
- `kilocode/kilo/auto` の背後にある正確なアップストリームルーティングは Kilo Gateway が所有し、OpenClaw にハードコードされていない。

セットアップの詳細は [/providers/kilocode](/ja-JP/providers/kilocode) を参照してください。

### その他の同梱プロバイダー plugin

| プロバイダー          | ID                               | 認証 env                                                     | モデル例                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` または `KIMICODE_API_KEY`                         | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine（Doubao） | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 知っておくとよい癖

<AccordionGroup>
  <Accordion title="OpenRouter">
    検証済みの `openrouter.ai` ルートでのみ、アプリ帰属ヘッダーと Anthropic `cache_control` マーカーを適用します。DeepSeek、Moonshot、ZAI の参照は、OpenRouter 管理のプロンプトキャッシュではキャッシュ TTL の対象になりますが、Anthropic キャッシュマーカーは受け取りません。プロキシ形式の OpenAI 互換パスとして、ネイティブ OpenAI 専用の整形（`serviceTier`、Responses `store`、プロンプトキャッシュヒント、OpenAI 推論互換）はスキップします。Gemini ベースの参照は、プロキシ Gemini の思考シグネチャのサニタイズのみを維持します。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini ベースの参照は同じプロキシ Gemini サニタイズパスに従います。`kilocode/kilo/auto` やその他のプロキシ推論非対応の参照では、プロキシ推論の注入をスキップします。
  </Accordion>
  <Accordion title="MiniMax">
    API キーのオンボーディングでは、明示的なテキスト専用 M2.7 チャットモデル定義を書き込みます。画像理解は、プラグイン所有の `MiniMax-VL-01` メディアプロバイダーに残ります。
  </Accordion>
  <Accordion title="NVIDIA">
    モデル ID は `nvidia/<vendor>/<model>` 名前空間を使います（例: `nvidia/nvidia/nemotron-...` と `nvidia/moonshotai/kimi-k2.5`）。ピッカーはリテラルな `<provider>/<model-id>` 構成を保持し、API に送信される正規キーは単一プレフィックスのままです。
  </Accordion>
  <Accordion title="xAI">
    xAI Responses パスを使用します。`grok-4.3` は同梱のデフォルトチャットモデルです。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream=false` を使います。
  </Accordion>
  <Accordion title="Cerebras">
    同梱の `cerebras` プロバイダープラグインとして提供されます。GLM は `zai-glm-4.7` を使用します。OpenAI 互換のベース URL は `https://api.cerebras.ai/v1` です。
  </Accordion>
</AccordionGroup>

## `models.providers` 経由のプロバイダー（カスタム/ベース URL）

**カスタム**プロバイダーまたは OpenAI/Anthropic 互換プロキシを追加するには、`models.providers`（または `models.json`）を使います。

以下の同梱プロバイダープラグインの多くは、すでにデフォルトカタログを公開しています。デフォルトのベース URL、ヘッダー、モデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使ってください。

Gateway のモデル機能チェックは、明示的な `models.providers.<id>.models[]` メタデータも読み取ります。カスタムモデルまたはプロキシモデルが画像を受け付ける場合は、そのモデルで `input: ["text", "image"]` を設定し、WebChat とノード起点の添付パスが、画像をテキスト専用メディア参照ではなくネイティブなモデル入力として渡せるようにしてください。

### Moonshot AI (Kimi)

Moonshot は同梱プロバイダープラグインとして提供されます。デフォルトでは組み込みプロバイダーを使い、ベース URL またはモデルメタデータを上書きする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

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

### Kimi coding

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

従来の `kimi/k2p5` は互換性モデル ID として引き続き受け付けられます。

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) は、中国で Doubao やその他のモデルへのアクセスを提供します。

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

オンボーディングのデフォルトはコーディング用サーフェスですが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/設定のモデル選択では、Volcengine の認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲の選択画面を表示する代わりに、フィルターされていないカタログへフォールバックします。

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (International)

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

オンボーディングのデフォルトはコーディング用サーフェスですが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/設定のモデル選択では、BytePlus の認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲の選択画面を表示する代わりに、フィルターされていないカタログへフォールバックします。

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic は `synthetic` プロバイダーの背後で Anthropic 互換モデルを提供します。

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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` で設定します。

- MiniMax OAuth (グローバル): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API キー (グローバル): `--auth-choice minimax-global-api`
- MiniMax API キー (CN): `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`; `minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

<Note>
MiniMax の Anthropic 互換ストリーミングパスでは、明示的に設定しない限り OpenClaw はデフォルトで思考を無効にし、`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
</Note>

Plugin 所有の機能分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M2.7` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方の MiniMax 認証パスで Plugin 所有の `MiniMax-VL-01` です
- Web 検索はプロバイダー ID `minimax` のままです

### LM Studio

LM Studio は、ネイティブ API を使用する同梱プロバイダー Plugin として提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルトの推論ベース URL: `http://localhost:1234/v1`

次にモデルを設定します (`http://localhost:1234/api/v1/models` から返される ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は、検出と自動ロードに LM Studio のネイティブ `/api/v1/models` と `/api/v1/models/load` を使用し、推論にはデフォルトで `/v1/chat/completions` を使用します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama は同梱プロバイダー Plugin として提供され、Ollama のネイティブ API を使用します。

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

`OLLAMA_API_KEY` でオプトインすると、Ollama は `http://127.0.0.1:11434` でローカル検出され、同梱プロバイダー Plugin が Ollama を `openclaw onboard` とモデル選択に直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル/セルフホストの OpenAI 互換サーバー向けの同梱プロバイダー Plugin として提供されます。

- プロバイダー: `vllm`
- 認証: 任意 (サーバーによって異なります)
- デフォルトのベース URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには (サーバーが認証を強制しない場合は任意の値で動作します)。

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します (`/v1/models` から返される ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホスト OpenAI 互換サーバー向けの同梱プロバイダー Plugin として提供されます。

- プロバイダー: `sglang`
- 認証: 任意 (サーバーによって異なります)
- デフォルトのベース URL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには (サーバーが認証を強制しない場合は任意の値で動作します)。

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します (`/v1/models` から返される ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

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
  <Accordion title="Default optional fields">
    カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。省略した場合、OpenClaw は次の値をデフォルトにします。

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: プロキシ/モデルの制限に合う明示的な値を設定してください。

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - 非ネイティブエンドポイント (ホストが `api.openai.com` ではない空でない `baseUrl`) で `api: "openai-completions"` を使用する場合、OpenClaw はサポートされていない `developer` ロールによるプロバイダーの 400 エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
    - プロキシ形式の OpenAI 互換ルートでは、ネイティブ OpenAI 専用のリクエスト整形もスキップされます。`service_tier` なし、Responses の `store` なし、Completions の `store` なし、プロンプトキャッシュヒントなし、OpenAI reasoning-compat ペイロード整形なし、隠し OpenClaw 帰属ヘッダーなしです。
    - ベンダー固有フィールドが必要な OpenAI 互換 Completions プロキシでは、`agents.defaults.models["provider/model"].params.extra_body` (または `extraBody`) を設定して、追加の JSON を送信リクエスト本文へマージします。
    - vLLM のチャットテンプレート制御では、`agents.defaults.models["provider/model"].params.chat_template_kwargs` を設定します。同梱 vLLM Plugin は、セッションの思考レベルがオフのとき、`vllm/nemotron-3-*` に対して `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。
    - 低速なローカルモデルやリモート LAN/tailnet ホストでは、`models.providers.<id>.timeoutSeconds` を設定します。これにより、エージェントランタイム全体のタイムアウトを増やさずに、接続、ヘッダー、本文ストリーミング、保護されたフェッチ全体の中断を含むプロバイダーモデル HTTP リクエスト処理が延長されます。
    - `baseUrl` が空または省略されている場合、OpenClaw はデフォルトの OpenAI 動作 (`api.openai.com` に解決されます) を維持します。
    - 安全のため、非ネイティブの `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。
    - 非直接エンドポイント (正規の `anthropic` 以外のプロバイダー、またはホストが公開 `api.anthropic.com` エンドポイントではないカスタム `models.providers.anthropic.baseUrl`) で `api: "anthropic-messages"` を使用する場合、OpenClaw は `claude-code-20250219`、`interleaved-thinking-2025-05-14`、OAuth マーカーなどの暗黙的な Anthropic ベータヘッダーを抑制します。これにより、カスタム Anthropic 互換プロキシがサポートされていないベータフラグを拒否しないようにします。プロキシに特定のベータ機能が必要な場合は、`models.providers.<id>.headers["anthropic-beta"]` を明示的に設定してください。

  </Accordion>
</AccordionGroup>

## CLI の例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な設定例については、[設定](/ja-JP/gateway/configuration) も参照してください。

## 関連

- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — モデル設定キー
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) — フォールバックチェーンと再試行動作
- [モデル](/ja-JP/concepts/models) — モデル設定とエイリアス
- [プロバイダー](/ja-JP/providers) — プロバイダー別セットアップガイド

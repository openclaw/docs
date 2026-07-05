---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例または CLI オンボーディングコマンドが必要な場合
sidebarTitle: Model providers
summary: サンプル設定と CLI フローを含むモデルプロバイダー概要
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-07-05T11:18:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27dc5802f622de2c36da44667d777c570693627202af8af5cde4276f3a7ec5d7
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/モデルプロバイダー**（WhatsApp/Telegram などのチャットチャネルではありません）のリファレンス。モデル選択ルールについては、[モデル](/ja-JP/concepts/models)を参照してください。

## クイックルール

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` は、設定されている場合に許可リストとして機能します。
    - CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` はプロバイダーレベルのデフォルトを設定します。`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` はモデルごとにそれらを上書きします。
    - フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` は、プロバイダーを追加または再認証するときに既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login` も、`--set-default` を渡さない限り同じです。プロバイダー Plugin は認証設定パッチで推奨デフォルトモデルを返す場合がありますが、プライマリモデルがすでに存在する場合、OpenClaw はそれを「このモデルを利用可能にする」として扱い、「現在のプライマリモデルを置き換える」とは扱いません。

    デフォルトモデルを意図的に切り替えるには、`openclaw models set <provider/model>` または `openclaw models auth login --provider <id> --set-default` を使用します。

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    OpenAI ファミリーのルートはプレフィックス固有です。

    - `openai/<model>` は、デフォルトでエージェントターンにネイティブ Codex app-server ハーネスを使用します。これは通常の ChatGPT/Codex サブスクリプション設定です。
    - レガシー Codex モデル参照は、doctor が `openai/<model>` に書き換えるレガシー設定です。
    - `openai/<model>` に加えてプロバイダー/モデルの `agentRuntime.id: "openclaw"` を指定すると、明示的な API キーまたは互換ルートに OpenClaw の組み込みランタイムを使用します。

    [OpenAI](/ja-JP/providers/openai) と [Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。プロバイダー/ランタイムの分離がわかりにくい場合は、先に[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を読んでください。

    Plugin の自動有効化も同じ境界に従います。`openai/*` エージェント参照はデフォルトルートで Codex Plugin を有効にし、明示的なプロバイダー/モデルの `agentRuntime.id: "codex"` またはレガシー `codex/<model>` 参照でもそれが必要です。

    GPT-5.5 は、デフォルトでは `openai/gpt-5.5` 上のネイティブ Codex app-server ハーネス経由で利用でき、プロバイダー/モデルのランタイムポリシーが明示的に `openclaw` を選択した場合は OpenClaw ランタイム経由で利用できます。

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI ランタイムも同じ分離を使用します。`anthropic/claude-*` や `google/gemini-*` などの正規モデル参照を選び、ローカル CLI バックエンドが必要な場合にプロバイダー/モデルのランタイムポリシーを `claude-cli` または `google-gemini-cli` に設定します。

    レガシー `claude-cli/*` と `google-gemini-cli/*` 参照は、ランタイムを別に記録したうえで正規プロバイダー参照へ戻るように移行されます。レガシー `codex-cli/*` 参照は `openai/*` に移行され、Codex app-server ルートを使用します。OpenClaw はバンドルされた Codex CLI バックエンドをもう保持していません。

  </Accordion>
</AccordionGroup>

## Plugin 所有のプロバイダー動作

プロバイダー固有のロジックの大半はプロバイダー Plugin（`registerProvider(...)`）にあり、OpenClaw は汎用推論ループを保持します。Plugin はオンボーディング、モデルカタログ、認証環境変数マッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、thinking/reasoning プロファイルなどを所有します。

プロバイダー SDK フックとバンドル Plugin の例の完全な一覧は、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)にあります。完全にカスタムのリクエスト実行器が必要なプロバイダーは、別のより深い拡張サーフェスです。

<Note>
プロバイダー所有の runner 動作は、リプレイポリシー、ツールスキーマ正規化、ストリームラッピング、トランスポート/リクエストヘルパーなどの明示的なプロバイダーフック上にあります。レガシー `ProviderPlugin.capabilities` 静的バッグは互換性専用であり、共有 runner ロジックからはもう読み取られません。
</Note>

## API キーのローテーション

<AccordionGroup>
  <Accordion title="Key sources and priority">
    複数のキーは次の方法で設定します。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りのリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キー選択順は優先度を保持し、値を重複排除します。

  </Accordion>
  <Accordion title="When rotation kicks in">
    - リクエストは、レート制限レスポンスの場合にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
    - レート制限以外の失敗は即座に失敗します。キーのローテーションは試行されません。
    - すべての候補キーが失敗した場合、最後の試行から最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 公式プロバイダー Plugin

公式プロバイダー Plugin は独自のモデルカタログ行を公開します。これらのプロバイダーには **`models.providers` のモデルエントリは不要**です。プロバイダー Plugin を有効にし、認証を設定して、モデルを選びます。`models.providers` は、明示的なカスタムプロバイダーまたはタイムアウトなどの狭いリクエスト設定にのみ使用してください。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一上書き）
- モデル例: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 特定のインストールまたは API キーの挙動が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの可用性を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトトランスポートは `auto` です。OpenClaw はトランスポート選択を共有モデルランタイムに渡します。
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で行います。
- OpenAI 優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効にできます。
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマッピングします。
- 共有の `/fast` トグルではなく明示的な tier が必要な場合は、`params.serviceTier` を使用します。
- 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用され、汎用 OpenAI 互換プロキシには適用されません。
- ネイティブ OpenAI ルートは Responses の `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換ペイロード整形も保持します。プロキシルートは保持しません。
- `openai/gpt-5.3-codex-spark` は ChatGPT/Codex OAuth 経由でのみ利用できます。直接の OpenAI API キーと Azure API キールートでは拒否されます。

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- 任意のローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一上書き）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接の公開 Anthropic リクエストは、`api.anthropic.com` に送信される API キーおよび OAuth 認証済みトラフィックを含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はそれを Anthropic の `service_tier`（`auto` と `standard_only`）にマッピングします。
- 推奨される Claude CLI 設定では、モデル参照を正規のままにし、CLI
  バックエンドを別に選択します。つまり、`anthropic/claude-opus-4-8` と
  モデルスコープの `agentRuntime.id: "claude-cli"` です。レガシー
  `claude-cli/claude-opus-4-7` 参照も互換性のために引き続き機能します。

<Note>
Claude CLI 再利用（`claude -p`）は、OpenClaw の認可された統合パスです。Anthropic setup-token 認証は引き続きサポートされますが、OpenClaw は利用可能な場合に Claude CLI 再利用を優先します。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- プロバイダー: `openai`
- 認証: OAuth（ChatGPT）
- ネイティブ Codex app-server ハーネス参照: `openai/gpt-5.5`
- ネイティブ Codex app-server ハーネスのドキュメント: [Codex ハーネス](/ja-JP/plugins/codex-harness)
- レガシーモデル参照: `codex/gpt-*`
- Plugin 境界: `openai/*` は OpenAI Plugin を読み込みます。ネイティブ Codex app-server Plugin は Codex ハーネスランタイムによって選択されます。
- CLI: `openclaw onboard --auth-choice openai` または `openclaw models auth login --provider openai`
- デフォルトトランスポートは `auto`（WebSocket 優先、SSE フォールバック）です。
- OpenAI Codex モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で行います。
- `params.serviceTier` はネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）にも転送されます。
- 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付加され、汎用 OpenAI 互換プロキシには付加されません。
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有します。OpenClaw はそれを `service_tier=priority` にマッピングします。
- `openai/gpt-5.5` は Codex カタログネイティブの `contextWindow = 400000` とデフォルトランタイム `contextTokens = 272000` を使用します。ランタイム上限は `models.providers.openai.models[].contextTokens` で上書きします。
- 標準サブスクリプションとネイティブ Codex ランタイムルートには、`openai` 認証でサインインし、`openai/gpt-5.5` を設定します。OpenAI エージェントターンはデフォルトで Codex を選択します。
- 組み込み OpenClaw ルートが必要な場合にのみ、プロバイダー/モデルの `agentRuntime.id: "openclaw"` を使用します。それ以外の場合は、`openai/gpt-5.5` をデフォルトの Codex ハーネスのままにします。
- レガシー Codex GPT 参照はレガシー状態であり、ライブプロバイダールートではありません。新しいエージェント設定ではネイティブ Codex ランタイム上の `openai/gpt-5.5` を使用し、古いレガシー Codex モデル参照を正規の `openai/*` 参照に移行するには `openclaw doctor --fix` を実行してください。

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
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### その他のサブスクリプション形式のホスト型オプション

<CardGroup cols={3}>
  <Card title="MiniMax" href="/ja-JP/providers/minimax">
    MiniMax Coding Plan OAuth または API キーアクセス。
  </Card>
  <Card title="Qwen Cloud" href="/ja-JP/providers/qwen">
    Qwen Cloud プロバイダーサーフェスに加え、Alibaba DashScope と Coding Plan エンドポイントのマッピング。
  </Card>
  <Card title="Z.AI (GLM)" href="/ja-JP/providers/zai">
    Z.AI Coding Plan または汎用 API エンドポイント。
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
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、および `OPENCLAW_LIVE_GEMINI_KEY`（単一のオーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使用する従来の OpenClaw 設定は `google/gemini-3-flash-preview` に正規化される
- エイリアス: `google/gemini-3.1-pro` は受け入れられ、Google のライブ Gemini API ID である `google/gemini-3.1-pro-preview` に正規化される
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 思考: `/think adaptive` は Google dynamic thinking を使用する。Gemini 3/3.1 は固定の `thinkingLevel` を省略する。Gemini 2.5 は `thinkingBudget: -1` を送信する。
- 直接の Gemini 実行では、プロバイダーネイティブの `cachedContents/...` ハンドルを転送するために、`agents.defaults.models["google/<model>"].params.cachedContent`（または従来の `cached_content`）も受け入れる。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表示される

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用する。Gemini CLI はその OAuth フローを使用する

<Warning>
OpenClaw の Gemini CLI OAuth は非公式の統合です。一部のユーザーは、サードパーティクライアントの使用後に Google アカウントの制限を報告しています。続行する場合は Google の規約を確認し、重要でないアカウントを使用してください。
</Warning>

Gemini CLI OAuth は、バンドルされた `google` plugin の一部として提供されます。

<Steps>
  <Step title="Install Gemini CLI">
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
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`。クライアント ID やシークレットを `openclaw.json` に貼り付ける必要は**ありません**。CLI ログインフローは、Gateway ホスト上の認証プロファイルにトークンを保存します。

  </Step>
  <Step title="Set project (if needed)">
    ログイン後にリクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  </Step>
</Steps>

Gemini CLI はデフォルトで `stream-json` を使用します。OpenClaw はアシスタントストリーム
メッセージを読み取り、`stats.cached` を `cacheRead` に正規化します。従来の
`--output-format json` オーバーライドでも、引き続き `response` から返信テキストを読み取ります。

### Z.AI（GLM）

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - モデル参照は正規の `zai/*` プロバイダー ID を使用する。
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出する。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制する

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### その他の同梱プロバイダーPlugin

| プロバイダー                            | ID                               | 認証env                                              | モデル例                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` または `OPENROUTER_API_KEY`        | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` または `CHUTES_OAUTH_TOKEN`         | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                         |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                             |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`            | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/ja-JP/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth または `OPENROUTER_API_KEY`         | `openrouter/auto`                                          |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                    |
| [Qwen OAuth](/ja-JP/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                             |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth または `XAI_API_KEY`       | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 知っておくとよい癖

<AccordionGroup>
  <Accordion title="OpenRouter">
    アプリ帰属ヘッダーと Anthropic `cache_control` マーカーは、検証済みの `openrouter.ai` ルートにのみ適用されます。DeepSeek、Moonshot、ZAI の参照は OpenRouter 管理のプロンプトキャッシュではキャッシュTTLの対象になりますが、Anthropic キャッシュマーカーは受け取りません。プロキシ型の OpenAI 互換パスとして、ネイティブOpenAI専用の整形（`serviceTier`、Responses `store`、プロンプトキャッシュヒント、OpenAI reasoning互換）はスキップします。Gemini バックエンドの参照では、プロキシGeminiの思考シグネチャのサニタイズのみ維持されます。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini バックエンドの参照は同じプロキシGeminiサニタイズパスに従います。`kilocode/kilo/auto` とその他のプロキシreasoning非対応の参照は、プロキシreasoning注入をスキップします。
  </Accordion>
  <Accordion title="MiniMax">
    APIキーのオンボーディングは、明示的な M3 と M2.7 のチャットモデル定義を書き込みます。画像理解は、Plugin所有の `MiniMax-VL-01` メディアプロバイダーのままです。
  </Accordion>
  <Accordion title="NVIDIA">
    モデルIDは `nvidia/<vendor>/<model>` 名前空間を使います（例: `nvidia/moonshotai/kimi-k2.5` と並ぶ `nvidia/nvidia/nemotron-...`）。ピッカーはリテラルの `<provider>/<model-id>` 構成を保持し、API に送信される正規キーは単一プレフィックスのままです。
  </Accordion>
  <Accordion title="xAI">
    xAI Responses パスを使用します。推奨パスは SuperGrok/X Premium OAuth です。APIキーは `XAI_API_KEY` またはPlugin設定経由でも引き続き機能し、Grok `web_search` はAPIキーへのフォールバック前に同じ認証プロファイルを再利用します。`grok-4.3` は同梱のデフォルトチャットモデルで、`grok-build-0.1` はビルド/コーディング重視の作業向けに選択できます。`/fast` または `params.fastMode: true` は `grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。`agents.defaults.models["xai/<model>"].params.tool_stream=false` で無効化できます。
  </Accordion>
</AccordionGroup>

## `models.providers` 経由のプロバイダー（カスタム/base URL）

`models.providers`（または `models.json`）を使って、**カスタム**プロバイダーまたは OpenAI/Anthropic 互換プロキシを追加します。

以下の同梱プロバイダーPluginの多くは、すでにデフォルトカタログを公開しています。デフォルトのbase URL、ヘッダー、モデル一覧を上書きしたい場合にのみ、明示的な `models.providers.<id>` エントリを使ってください。

Gateway のモデル機能チェックは、明示的な `models.providers.<id>.models[]` メタデータも読み取ります。カスタムモデルまたはプロキシモデルが画像を受け付ける場合は、そのモデルに `input: ["text", "image"]` を設定して、WebChat とノード起点の添付ファイルパスが、テキストのみのメディア参照ではなくネイティブモデル入力として画像を渡すようにしてください。

`agents.defaults.models["provider/model"]` は、エージェント向けのモデル表示、エイリアス、モデルごとのメタデータのみを制御します。それ単体では新しいランタイムモデルを登録しません。カスタムプロバイダーモデルについては、少なくとも一致する `id` を含む `models.providers.<provider>.models[]` も追加してください。

### Moonshot AI (Kimi)

オンボーディングの前に `@openclaw/moonshot-provider` をインストールします。ベースURLまたはモデルメタデータを上書きする必要がある場合のみ、明示的な `models.providers.moonshot` エントリを追加してください:

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- サンプルモデル: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2モデルID:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

完全なセットアップガイドは [Moonshot AI (Kimi + Kimi Coding)](/ja-JP/providers/moonshot) を参照してください。

### Kimi Coding

Kimi Coding は Moonshot AI の Anthropic互換エンドポイントを使用します:

- プロバイダー: `kimi`
- 認証: `KIMI_API_KEY`
- サンプルモデル: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

レガシーの `kimi/kimi-code` と `kimi/k2p5` は互換モデルIDとして引き続き受け入れられ、Kimi の安定版APIモデルIDに正規化されます。

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) は、中国で Doubao とその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine` (コーディング: `volcengine-plan`)
- 認証: `VOLCANO_ENGINE_API_KEY`
- サンプルモデル: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

オンボーディングではコーディングサーフェスがデフォルトになりますが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengine の認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲のピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

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

BytePlus ARK は、海外ユーザー向けに Volcano Engine と同じモデルへのアクセスを提供します。

- プロバイダー: `byteplus` (コーディング: `byteplus-plan`)
- 認証: `BYTEPLUS_API_KEY`
- サンプルモデル: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングではコーディングサーフェスがデフォルトになりますが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlus の認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲のピッカーを表示する代わりに、フィルターなしのカタログにフォールバックします。

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

Synthetic は `synthetic` プロバイダーの背後で Anthropic互換モデルを提供します:

- プロバイダー: `synthetic`
- 認証: `SYNTHETIC_API_KEY`
- サンプルモデル: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax はカスタムエンドポイントを使用するため、`models.providers` で設定します:

- MiniMax OAuth (グローバル): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax APIキー (グローバル): `--auth-choice minimax-global-api`
- MiniMax APIキー (CN): `--auth-choice minimax-cn-api`
- 認証: `minimax` 用は `MINIMAX_API_KEY`; `minimax-portal` 用は `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

<Note>
MiniMax の Anthropic互換ストリーミングパスでは、明示的に設定しない限り、OpenClaw は M2.x ファミリーの thinking をデフォルトで無効にします。MiniMax-M3 (および M3.x) は、デフォルトでプロバイダーの省略/適応 thinking パスのままです。`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
</Note>

Plugin所有のケイパビリティ分割:

- テキスト/チャットのデフォルトは `minimax/MiniMax-M3` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方の MiniMax 認証パスで Plugin所有の `MiniMax-VL-01` です
- Web検索はプロバイダーID `minimax` のままです

### LM Studio

LM Studio はネイティブAPIを使用するバンドル済みプロバイダーPluginとして同梱されています:

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- デフォルトの推論ベースURL: `http://localhost:1234/v1`

次にモデルを設定します (`http://localhost:1234/api/v1/models` が返すIDのいずれかに置き換えてください):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は検出と自動ロードに LM Studio のネイティブ `/api/v1/models` と `/api/v1/models/load` を使用し、推論にはデフォルトで `/v1/chat/completions` を使用します。LM Studio JITロード、TTL、自動退避にモデルライフサイクルを所有させたい場合は、`models.providers.lmstudio.params.preload: false` を設定します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済みプロバイダーPluginとして同梱され、Ollama のネイティブAPIを使用します:

- プロバイダー: `ollama`
- 認証: 不要 (ローカルサーバー)
- サンプルモデル: `ollama/llama3.3`
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

`OLLAMA_API_KEY` でオプトインすると、Ollama は `http://127.0.0.1:11434` でローカル検出され、バンドル済みプロバイダーPluginが Ollama を `openclaw onboard` とモデルピッカーに直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM はローカル/セルフホストの OpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして同梱されています:

- プロバイダー: `vllm`
- 認証: 任意 (サーバーによります)
- デフォルトのベースURL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します (`/v1/models` が返すIDのいずれかに置き換えてください):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細は [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は高速なセルフホストの OpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして同梱されています:

- プロバイダー: `sglang`
- 認証: 任意 (サーバーによります)
- デフォルトのベースURL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します (`/v1/models` が返すIDのいずれかに置き換えてください):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細は [/providers/sglang](/ja-JP/providers/sglang) を参照してください。

### ローカルプロキシ (LM Studio, vLLM, LiteLLM など)

例 (OpenAI互換):

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
    カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。省略した場合、OpenClaw は次をデフォルトにします:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: プロキシ/モデルの制限に一致する明示的な値を設定してください。

  </Accordion>
  <Accordion title="プロキシルートの整形ルール">
    - 非ネイティブエンドポイント（ホストが `api.openai.com` ではない、空でない任意の `baseUrl`）で `api: "openai-completions"` を使う場合、OpenClaw は、サポートされていない `developer` ロールによるプロバイダーの 400 エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
    - プロキシ形式の OpenAI 互換ルートでは、ネイティブ OpenAI 専用のリクエスト整形もスキップされます。`service_tier` なし、Responses の `store` なし、Completions の `store` なし、プロンプトキャッシュヒントなし、OpenAI reasoning 互換ペイロード整形なし、隠し OpenClaw 帰属ヘッダーなしです。
    - ベンダー固有フィールドが必要な OpenAI 互換 Completions プロキシでは、`agents.defaults.models["provider/model"].params.extra_body`（または `extraBody`）を設定して、送信リクエスト本文に追加の JSON をマージします。
    - vLLM のチャットテンプレート制御では、`agents.defaults.models["provider/model"].params.chat_template_kwargs` を設定します。バンドルされた vLLM Plugin は、セッションの thinking レベルがオフのとき、`vllm/nemotron-3-*` に対して `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。
    - 遅いローカルモデルやリモートの LAN/tailnet ホストでは、`models.providers.<id>.timeoutSeconds` を設定します。これにより、接続、ヘッダー、本文ストリーミング、保護された fetch 全体の中止を含む、プロバイダーモデルの HTTP リクエスト処理が延長されますが、エージェント実行全体のタイムアウトは増えません。`agents.defaults.timeoutSeconds` または実行固有のタイムアウトがそれより低い場合は、その上限も引き上げてください。プロバイダータイムアウトで実行全体を延長することはできません。
    - モデルプロバイダーの HTTP 呼び出しでは、設定されたプロバイダー `baseUrl` のホスト名に対してのみ、`198.18.0.0/15` と `fc00::/7` にある Surge、Clash、sing-box の fake-IP DNS 応答を許可します。カスタム/ローカルプロバイダーエンドポイントも、local loopback、LAN、tailnet ホストを含む、保護されたモデルリクエストについて、設定されたその正確な `scheme://host:port` オリジンを信頼します。これは新しい設定オプションではありません。設定した `baseUrl` は、そのオリジンに対してのみリクエストポリシーを拡張します。fake-IP ホスト名の許可と正確なオリジンの信頼は独立した仕組みです。その他のプライベート、local loopback、リンクローカル、メタデータ宛先、および異なるポートには、引き続き明示的な `models.providers.<id>.request.allowPrivateNetwork: true` のオプトインが必要です。正確なオリジンの信頼をオプトアウトするには、`models.providers.<id>.request.allowPrivateNetwork: false` を設定します。
    - `baseUrl` が空または省略されている場合、OpenClaw はデフォルトの OpenAI 動作（`api.openai.com` に解決される）を維持します。
    - 安全のため、非ネイティブの `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も引き続き上書きされます。
    - 非直接エンドポイント（正規の `anthropic` 以外の任意のプロバイダー、またはホストが公開 `api.anthropic.com` エンドポイントではないカスタム `models.providers.anthropic.baseUrl`）で `api: "anthropic-messages"` を使う場合、OpenClaw は、`claude-code-20250219`、`interleaved-thinking-2025-05-14`、OAuth マーカーなどの暗黙的な Anthropic ベータヘッダーを抑制します。これにより、カスタム Anthropic 互換プロキシが未サポートのベータフラグを拒否しないようにします。プロキシに特定のベータ機能が必要な場合は、`models.providers.<id>.headers["anthropic-beta"]` を明示的に設定してください。

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

- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - モデル設定キー
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) - フォールバックチェーンと再試行動作
- [モデル](/ja-JP/concepts/models) - モデル設定とエイリアス
- [プロバイダー](/ja-JP/providers) - プロバイダー別セットアップガイド

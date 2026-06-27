---
read_when:
    - プロバイダー別のモデル設定リファレンスが必要です
    - モデルプロバイダー向けの設定例または CLI オンボーディングコマンドが必要な場合
sidebarTitle: Model providers
summary: モデルプロバイダーの概要と設定例 + CLI フロー
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-06-27T11:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

**LLM/モデルプロバイダー**（WhatsApp/Telegram のようなチャットチャネルではない）のリファレンス。モデル選択ルールについては、[モデル](/ja-JP/concepts/models)を参照してください。

## クイックルール

<AccordionGroup>
  <Accordion title="モデル参照と CLI ヘルパー">
    - モデル参照は `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` は、設定されている場合は許可リストとして機能します。
    - CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` はプロバイダーレベルのデフォルトを設定します。`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` はモデルごとにそれらを上書きします。
    - フォールバックルール、クールダウンプローブ、セッション上書きの永続化: [モデルフェイルオーバー](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="プロバイダー認証を追加してもプライマリモデルは変更されません">
    `openclaw configure` は、プロバイダーを追加または再認証するときに既存の `agents.defaults.model.primary` を保持します。`openclaw models auth login` も、`--set-default` を渡さない限り同じ動作をします。プロバイダー Plugin は認証設定パッチで推奨デフォルトモデルを返す場合がありますが、プライマリモデルがすでに存在する場合、OpenClaw はそれを「このモデルを利用可能にする」として扱い、「現在のプライマリモデルを置き換える」とは扱いません。

    デフォルトモデルを意図的に切り替えるには、`openclaw models set <provider/model>` または `openclaw models auth login --provider <id> --set-default` を使用します。

  </Accordion>
  <Accordion title="OpenAI プロバイダー/ランタイムの分離">
    OpenAI ファミリーのルートはプレフィックスごとに固有です。

    - `openai/<model>` は、デフォルトでエージェントターンにネイティブ Codex アプリサーバーハーネスを使用します。これは通常の ChatGPT/Codex サブスクリプション設定です。
    - 旧 Codex モデル参照は、doctor が `openai/<model>` に書き換えるレガシー設定です。
    - `openai/<model>` にプロバイダー/モデルの `agentRuntime.id: "openclaw"` を組み合わせると、明示的な API キーまたは互換ルート向けに OpenClaw の組み込みランタイムを使用します。

    [OpenAI](/ja-JP/providers/openai) と [Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。プロバイダー/ランタイムの分離がわかりにくい場合は、先に[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を読んでください。

    Plugin の自動有効化も同じ境界に従います。`openai/*` エージェント参照はデフォルトルート用に Codex Plugin を有効化し、明示的なプロバイダー/モデルの `agentRuntime.id: "codex"` またはレガシー `codex/<model>` 参照でもそれが必要です。

    GPT-5.5 は、デフォルトでは `openai/gpt-5.5` 上のネイティブ Codex アプリサーバーハーネスを通じて利用でき、プロバイダー/モデルのランタイムポリシーが明示的に `openclaw` を選択した場合は OpenClaw ランタイムを通じて利用できます。

  </Accordion>
  <Accordion title="CLI ランタイム">
    CLI ランタイムも同じ分離を使用します。`anthropic/claude-*` や `google/gemini-*` などの正規モデル参照を選択し、ローカル CLI バックエンドを使用したい場合はプロバイダー/モデルのランタイムポリシーを `claude-cli` または `google-gemini-cli` に設定します。

    レガシー `claude-cli/*` および `google-gemini-cli/*` 参照は、ランタイムを別に記録したうえで正規プロバイダー参照へ移行されます。レガシー `codex-cli/*` 参照は `openai/*` に移行され、Codex アプリサーバールートを使用します。OpenClaw はバンドルされた Codex CLI バックエンドを保持しなくなりました。

  </Accordion>
</AccordionGroup>

## Plugin 所有のプロバイダー動作

プロバイダー固有のロジックのほとんどはプロバイダー Plugin（`registerProvider(...)`）内にあり、OpenClaw は汎用推論ループを保持します。Plugin は、オンボーディング、モデルカタログ、認証環境変数マッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、thinking/reasoning プロファイルなどを所有します。

プロバイダー SDK フックとバンドル Plugin の例の完全な一覧は、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) にあります。完全にカスタムのリクエスト実行器が必要なプロバイダーは、別のより深い拡張サーフェスです。

<Note>
プロバイダー所有のランナー動作は、リプレイポリシー、ツールスキーマ正規化、ストリームラッピング、トランスポート/リクエストヘルパーなどの明示的なプロバイダーフック上にあります。レガシーの `ProviderPlugin.capabilities` 静的バッグは互換性専用であり、共有ランナーロジックではもう読み取られません。
</Note>

## API キーのローテーション

<AccordionGroup>
  <Accordion title="キーのソースと優先順位">
    複数のキーは次の方法で設定します。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブ上書き、最優先）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キー選択順序は優先順位を保持し、値を重複排除します。

  </Accordion>
  <Accordion title="ローテーションが開始されるタイミング">
    - リクエストは、レート制限レスポンスの場合にのみ次のキーで再試行されます（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
    - レート制限ではない失敗は即座に失敗します。キーのローテーションは試行されません。
    - すべての候補キーが失敗した場合、最後の試行からの最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 公式プロバイダー Plugin

公式プロバイダー Plugin は独自のモデルカタログ行を公開します。これらのプロバイダーでは **`models.providers` モデルエントリは不要** です。プロバイダー Plugin を有効化し、認証を設定し、モデルを選択します。`models.providers` は、明示的なカスタムプロバイダーまたはタイムアウトなどの狭いリクエスト設定にのみ使用します。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- 任意のローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一の上書き）
- モデル例: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 特定のインストールまたは API キーの動作が異なる場合は、`openclaw models list --provider openai` でアカウント/モデルの利用可否を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` です。OpenClaw はトランスポート選択を共有モデルランタイムへ渡します。
- モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で行います
- OpenAI 優先処理は `agents.defaults.models["openai/<model>"].params.serviceTier` で有効化できます
- `/fast` と `params.fastMode` は、直接の `openai/*` Responses リクエストを `api.openai.com` 上の `service_tier=priority` にマップします
- 共有の `/fast` トグルではなく明示的なティアを使用したい場合は、`params.serviceTier` を使用します
- 非表示の OpenClaw アトリビューションヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用され、汎用 OpenAI 互換プロキシには適用されません
- ネイティブ OpenAI ルートは Responses の `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換のペイロード整形も保持します。プロキシルートでは保持されません
- `openai/gpt-5.3-codex-spark` は、サインイン済みアカウントが公開している場合、ChatGPT/Codex OAuth サブスクリプション認証を通じて利用できます。OpenClaw は、このモデルについて直接の OpenAI API キーおよび Azure API キールートを引き続き抑制します。これらのトランスポートが拒否するためです

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
- 直接の公開 Anthropic リクエストは、`api.anthropic.com` に送信される API キーおよび OAuth 認証済みトラフィックを含め、共有の `/fast` トグルと `params.fastMode` をサポートします。OpenClaw はそれを Anthropic の `service_tier`（`auto` と `standard_only`）にマップします
- 推奨される Claude CLI 設定では、モデル参照を正規のままにし、CLI
  バックエンドを別に選択します: `anthropic/claude-opus-4-8` と
  モデルスコープの `agentRuntime.id: "claude-cli"`。レガシー
  `claude-cli/claude-opus-4-7` 参照も互換性のために引き続き動作します。

<Note>
Anthropic スタッフは、OpenClaw スタイルの Claude CLI 使用が再び許可されていると伝えています。そのため、Anthropic が新しいポリシーを公開しない限り、OpenClaw はこの統合で Claude CLI の再利用と `claude -p` の使用を認可されたものとして扱います。Anthropic setup-token は、サポートされる OpenClaw トークンパスとして引き続き利用できますが、OpenClaw は利用可能な場合、Claude CLI の再利用と `claude -p` を優先するようになりました。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- プロバイダー: `openai`
- 認証: OAuth（ChatGPT）
- レガシー OpenAI Codex モデル参照: `openai/gpt-5.5`
- ネイティブ Codex アプリサーバーハーネス参照: `openai/gpt-5.5`
- ネイティブ Codex アプリサーバーハーネスドキュメント: [Codex ハーネス](/ja-JP/plugins/codex-harness)
- レガシーモデル参照: `codex/gpt-*`
- Plugin 境界: `openai/*` は OpenAI Plugin を読み込みます。ネイティブ Codex アプリサーバー Plugin は Codex ハーネスランタイムによって選択されます。
- CLI: `openclaw onboard --auth-choice openai` または `openclaw models auth login --provider openai`
- デフォルトのトランスポートは `auto`（WebSocket 優先、SSE フォールバック）です
- OpenAI Codex モデルごとの上書きは `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で行います
- `params.serviceTier` は、ネイティブ Codex Responses リクエスト（`chatgpt.com/backend-api`）にも転送されます
- 非表示の OpenClaw アトリビューションヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付与され、汎用 OpenAI 互換プロキシには付与されません
- 直接の `openai/*` と同じ `/fast` トグルおよび `params.fastMode` 設定を共有します。OpenClaw はそれを `service_tier=priority` にマップします
- `openai/gpt-5.5` は Codex カタログネイティブの `contextWindow = 400000` とデフォルトランタイムの `contextTokens = 272000` を使用します。ランタイム上限は `models.providers.openai.models[].contextTokens` で上書きします
- ポリシーノート: OpenAI Codex OAuth は、OpenClaw のような外部ツール/ワークフローで明示的にサポートされています。
- 一般的なサブスクリプション + ネイティブ Codex ランタイムルートでは、`openai` 認証でサインインし、`openai/gpt-5.5` を設定します。OpenAI エージェントターンはデフォルトで Codex を選択します。
- 組み込み OpenClaw ルートを使用したい場合にのみ、プロバイダー/モデルの `agentRuntime.id: "openclaw"` を使用します。それ以外の場合は、`openai/gpt-5.5` をデフォルトの Codex ハーネスに保持します。
- レガシー Codex GPT 参照はレガシー状態であり、ライブプロバイダールートではありません。新しいエージェント設定ではネイティブ Codex ランタイム上の `openai/gpt-5.5` を使用し、古いレガシー Codex モデル参照を正規の `openai/*` 参照へ移行するには `openclaw doctor --fix` を実行します。

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

### その他のサブスクリプション型ホストオプション

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/ja-JP/providers/zai">
    Z.AI Coding Plan または汎用 API エンドポイント。
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
- 任意のローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` フォールバック、`OPENCLAW_LIVE_GEMINI_KEY`（単一オーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 互換性: `google/gemini-3.1-flash-preview` を使うレガシー OpenClaw 設定は `google/gemini-3-flash-preview` に正規化されます
- エイリアス: `google/gemini-3.1-pro` は受け付けられ、Google のライブ Gemini API ID である `google/gemini-3.1-pro-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` は Google の dynamic thinking を使用します。Gemini 3/3.1 は固定の `thinkingLevel` を省略します。Gemini 2.5 は `thinkingBudget: -1` を送信します。
- Gemini の直接実行では、プロバイダーネイティブの `cachedContents/...` ハンドルを転送するために、`agents.defaults.models["google/<model>"].params.cachedContent`（またはレガシーの `cached_content`）も受け付けます。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として表示されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用します。Gemini CLI は自身の OAuth フローを使用します

<Warning>
OpenClaw の Gemini CLI OAuth は非公式の連携です。一部のユーザーから、サードパーティクライアントの使用後に Google アカウント制限が発生したとの報告があります。続行する場合は Google の規約を確認し、重要でないアカウントを使用してください。
</Warning>

Gemini CLI OAuth は、バンドルされた `google` Plugin の一部として提供されます。

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

Gemini CLI はデフォルトで `stream-json` を使用します。OpenClaw はアシスタントストリーム
メッセージを読み取り、`stats.cached` を `cacheRead` に正規化します。レガシーの
`--output-format json` オーバーライドでも、引き続き `response` から返信テキストを読み取ります。

### Z.AI (GLM)

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - モデル参照は正規の `zai/*` プロバイダー ID を使用します。
  - `zai-api-key` は対応する Z.AI エンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### その他のバンドル済みプロバイダー Plugin

| プロバイダー                                | ID                               | 認証 env                                             | モデル例                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` または `HF_TOKEN`                | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/ja-JP/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth または `OPENROUTER_API_KEY`             | `openrouter/auto`                                          |
| [Qwen OAuth](/ja-JP/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth または `XAI_API_KEY`           | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### 知っておくとよい癖

<AccordionGroup>
  <Accordion title="OpenRouter">
    アプリ帰属ヘッダーと Anthropic の `cache_control` マーカーは、検証済みの `openrouter.ai` ルートにのみ適用されます。DeepSeek、Moonshot、ZAI の参照は、OpenRouter 管理のプロンプトキャッシュでキャッシュ TTL の対象になりますが、Anthropic キャッシュマーカーは受け取りません。プロキシ形式の OpenAI 互換パスとして、ネイティブ OpenAI 専用の整形（`serviceTier`、Responses `store`、プロンプトキャッシュヒント、OpenAI reasoning 互換）はスキップします。Gemini バックの参照では、プロキシ Gemini の thought-signature サニタイズのみ保持します。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini バックの参照は同じプロキシ Gemini サニタイズパスに従います。`kilocode/kilo/auto` およびその他のプロキシ reasoning 非対応の参照では、プロキシ reasoning 注入をスキップします。
  </Accordion>
  <Accordion title="MiniMax">
    API キーのオンボーディングは、明示的な M3 と M2.7 のチャットモデル定義を書き込みます。画像理解は、Plugin 所有の `MiniMax-VL-01` メディアプロバイダーに残ります。
  </Accordion>
  <Accordion title="NVIDIA">
    モデル ID は `nvidia/<vendor>/<model>` 名前空間を使用します（たとえば `nvidia/moonshotai/kimi-k2.5` と並ぶ `nvidia/nvidia/nemotron-...`）。ピッカーはリテラルの `<provider>/<model-id>` 構成を保持しつつ、API に送信される正規キーは単一プレフィックスのままです。
  </Accordion>
  <Accordion title="xAI">
    xAI Responses パスを使用します。推奨パスは SuperGrok/X Premium OAuth です。API キーも `XAI_API_KEY` または Plugin 設定経由で引き続き動作し、Grok `web_search` は API キーフォールバックの前に同じ認証プロファイルを再利用します。`grok-4.3` はバンドル済みのデフォルトチャットモデルで、`grok-build-0.1` はビルド/コーディング重視の作業向けに選択できます。`/fast` または `params.fastMode: true` は、`grok-3`、`grok-3-mini`、`grok-4`、`grok-4-0709` をそれぞれの `*-fast` バリアントに書き換えます。`tool_stream` はデフォルトで有効です。`agents.defaults.models["xai/<model>"].params.tool_stream=false` で無効化します。
  </Accordion>
</AccordionGroup>

## `models.providers` 経由のプロバイダー（カスタム/base URL）

**カスタム**プロバイダーまたは OpenAI/Anthropic 互換プロキシを追加するには、`models.providers`（または `models.json`）を使用します。

下記のバンドル済みプロバイダー Plugin の多くは、すでにデフォルトカタログを公開しています。デフォルトの base URL、ヘッダー、モデルリストをオーバーライドしたい場合にのみ、明示的な `models.providers.<id>` エントリを使用してください。

Gateway のモデル機能チェックは、明示的な `models.providers.<id>.models[]` メタデータも読み取ります。カスタムモデルまたはプロキシモデルが画像を受け付ける場合は、そのモデルに `input: ["text", "image"]` を設定し、WebChat と Node 起点の添付ファイル経路が画像をテキストのみのメディア参照ではなく、ネイティブなモデル入力として渡せるようにします。

`agents.defaults.models["provider/model"]` は、エージェント向けのモデル表示、エイリアス、モデルごとのメタデータのみを制御します。それ自体では新しいランタイムモデルを登録しません。カスタムプロバイダーモデルでは、少なくとも一致する `id` を含む `models.providers.<provider>.models[]` も追加してください。

### Moonshot AI (Kimi)

オンボーディングの前に `@openclaw/moonshot-provider` をインストールします。ベース URL またはモデルメタデータを上書きする必要がある場合にのみ、明示的な `models.providers.moonshot` エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- 例のモデル: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` または `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 モデル ID:

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

### Kimi コーディング

Kimi Coding は、Moonshot AI の Anthropic 互換エンドポイントを使用します。

- プロバイダー: `kimi`
- 認証: `KIMI_API_KEY`
- 例のモデル: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

従来の `kimi/kimi-code` と `kimi/k2p5` は互換モデル ID として引き続き受け付けられ、Kimi の安定版 API モデル ID に正規化されます。

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) は、中国で Doubao やその他のモデルへのアクセスを提供します。

- プロバイダー: `volcengine` (コーディング: `volcengine-plan`)
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

オンボーディングではデフォルトでコーディングサーフェスが使用されますが、汎用の `volcengine/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、Volcengine 認証選択は `volcengine/*` と `volcengine-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲ピッカーを表示する代わりに、フィルターされていないカタログへフォールバックします。

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
- 例のモデル: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

オンボーディングは既定でコーディングサーフェスを使用しますが、汎用の `byteplus/*` カタログも同時に登録されます。

オンボーディング/設定のモデルピッカーでは、BytePlus 認証選択は `byteplus/*` と `byteplus-plan/*` の両方の行を優先します。これらのモデルがまだ読み込まれていない場合、OpenClaw は空のプロバイダー範囲ピッカーを表示する代わりに、フィルターされていないカタログへフォールバックします。

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

- MiniMax OAuth (グローバル): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (中国): `--auth-choice minimax-cn-oauth`
- MiniMax API キー (グローバル): `--auth-choice minimax-global-api`
- MiniMax API キー (中国): `--auth-choice minimax-cn-api`
- 認証: `minimax` には `MINIMAX_API_KEY`; `minimax-portal` には `MINIMAX_OAUTH_TOKEN` または `MINIMAX_API_KEY`

セットアップの詳細、モデルオプション、設定スニペットについては [/providers/minimax](/ja-JP/providers/minimax) を参照してください。

<Note>
MiniMax の Anthropic 互換ストリーミングパスでは、明示的に設定しない限り、OpenClaw は M2.x ファミリーの思考を既定で無効にします。MiniMax-M3 (および M3.x) は、既定でプロバイダーの省略/適応型思考パスのままです。`/fast on` は `MiniMax-M2.7` を `MiniMax-M2.7-highspeed` に書き換えます。
</Note>

Plugin 所有の機能分割:

- テキスト/チャットの既定値は `minimax/MiniMax-M3` のままです
- 画像生成は `minimax/image-01` または `minimax-portal/image-01` です
- 画像理解は、両方の MiniMax 認証パスで Plugin 所有の `MiniMax-VL-01` です
- Web 検索はプロバイダー ID `minimax` のままです

### LM Studio

LM Studio は、ネイティブ API を使用するバンドル済みプロバイダー Plugin として同梱されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- 既定の推論ベース URL: `http://localhost:1234/v1`

次にモデルを設定します (`http://localhost:1234/api/v1/models` から返された ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw は、探索と自動読み込みに LM Studio のネイティブ `/api/v1/models` と `/api/v1/models/load` を使用し、既定では推論に `/v1/chat/completions` を使用します。LM Studio の JIT 読み込み、TTL、自動退避にモデルライフサイクルを所有させたい場合は、`models.providers.lmstudio.params.preload: false` を設定します。セットアップとトラブルシューティングについては [/providers/lmstudio](/ja-JP/providers/lmstudio) を参照してください。

### Ollama

Ollama はバンドル済みプロバイダー Plugin として同梱され、Ollama のネイティブ API を使用します。

- プロバイダー: `ollama`
- 認証: 不要 (ローカルサーバー)
- 例のモデル: `ollama/llama3.3`
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

`OLLAMA_API_KEY` でオプトインすると、Ollama はローカルの `http://127.0.0.1:11434` で検出され、バンドル済みプロバイダー Plugin が Ollama を `openclaw onboard` とモデルピッカーに直接追加します。オンボーディング、クラウド/ローカルモード、カスタム設定については [/providers/ollama](/ja-JP/providers/ollama) を参照してください。

### vLLM

vLLM は、ローカル/セルフホストの OpenAI 互換サーバー向けのバンドル済みプロバイダー Plugin として同梱されます。

- プロバイダー: `vllm`
- 認証: 任意 (サーバーによって異なります)
- 既定のベース URL: `http://127.0.0.1:8000/v1`

ローカルで自動探索にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します (`/v1/models` から返された ID のいずれかに置き換えてください)。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細については [/providers/vllm](/ja-JP/providers/vllm) を参照してください。

### SGLang

SGLang は、高速なセルフホスト OpenAI 互換サーバー向けのバンドル済みプロバイダー Plugin として同梱されます。

- プロバイダー: `sglang`
- 認証: 任意 (サーバーによって異なります)
- 既定のベース URL: `http://127.0.0.1:30000/v1`

ローカルで自動探索にオプトインするには (サーバーが認証を強制しない場合は任意の値で機能します):

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します (`/v1/models` から返された ID のいずれかに置き換えてください)。

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
    カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens` は任意です。省略した場合、OpenClaw は次の値を既定にします。

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: プロキシ/モデルの制限に一致する明示的な値を設定してください。

  </Accordion>
  <Accordion title="プロキシルート形成ルール">
    - 非ネイティブエンドポイント (ホストが `api.openai.com` ではない、空でない任意の `baseUrl`) で `api: "openai-completions"` を使用する場合、OpenClaw はサポートされていない `developer` ロールによるプロバイダー 400 エラーを避けるため、`compat.supportsDeveloperRole: false` を強制します。
    - プロキシ形式の OpenAI 互換ルートでは、OpenAI ネイティブ専用のリクエスト形成もスキップされます。`service_tier` なし、Responses `store` なし、Completions `store` なし、プロンプトキャッシュヒントなし、OpenAI reasoning-compat ペイロード形成なし、隠し OpenClaw 帰属ヘッダーなしです。
    - ベンダー固有のフィールドを必要とする OpenAI 互換 Completions プロキシでは、送信リクエスト本文に追加 JSON をマージするために `agents.defaults.models["provider/model"].params.extra_body` (または `extraBody`) を設定します。
    - vLLM チャットテンプレート制御では、`agents.defaults.models["provider/model"].params.chat_template_kwargs` を設定します。バンドル済み vLLM Plugin は、セッションの思考レベルがオフの場合、`vllm/nemotron-3-*` に対して `enable_thinking: false` と `force_nonempty_content: true` を自動的に送信します。
    - 遅いローカルモデルやリモート LAN/tailnet ホストでは、`models.providers.<id>.timeoutSeconds` を設定します。これにより、エージェント実行全体のタイムアウトを増やすことなく、接続、ヘッダー、本文ストリーミング、保護付きフェッチの合計中断を含む、プロバイダーモデルの HTTP リクエスト処理が延長されます。`agents.defaults.timeoutSeconds` または実行固有のタイムアウトが低い場合は、その上限も上げてください。プロバイダータイムアウトで実行全体を延長することはできません。
    - モデルプロバイダーの HTTP 呼び出しでは、設定済みプロバイダー `baseUrl` のホスト名に対してのみ、`198.18.0.0/15` と `fc00::/7` の Surge、Clash、sing-box fake-IP DNS 応答を許可します。カスタム/ローカルプロバイダーエンドポイントも、local loopback、LAN、tailnet ホストを含む保護付きモデルリクエストについて、設定された正確な `scheme://host:port` オリジンを信頼します。これは新しい設定オプションではありません。設定する `baseUrl` は、そのオリジンに対してのみリクエストポリシーを拡張します。Fake-IP ホスト名の許可と正確なオリジンの信頼は独立した仕組みです。その他のプライベート、local loopback、リンクローカル、メタデータ宛先、および異なるポートには、引き続き明示的な `models.providers.<id>.request.allowPrivateNetwork: true` オプトインが必要です。正確なオリジンの信頼をオプトアウトするには、`models.providers.<id>.request.allowPrivateNetwork: false` を設定します。
    - `baseUrl` が空または省略されている場合、OpenClaw は既定の OpenAI 動作 (`api.openai.com` に解決されます) を維持します。
    - 安全のため、非ネイティブの `openai-completions` エンドポイントでは、明示的な `compat.supportsDeveloperRole: true` も上書きされます。
    - 非直接エンドポイント (正規の `anthropic` 以外の任意のプロバイダー、またはホストが公開 `api.anthropic.com` エンドポイントではないカスタム `models.providers.anthropic.baseUrl`) で `api: "anthropic-messages"` を使用する場合、OpenClaw は `claude-code-20250219`、`interleaved-thinking-2025-05-14`、OAuth マーカーなどの暗黙の Anthropic ベータヘッダーを抑制します。これにより、カスタム Anthropic 互換プロキシがサポートされていないベータフラグを拒否しないようにします。プロキシが特定のベータ機能を必要とする場合は、`models.providers.<id>.headers["anthropic-beta"]` を明示的に設定します。

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
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover) - フォールバックチェーンとリトライ動作
- [モデル](/ja-JP/concepts/models) - モデル設定とエイリアス
- [プロバイダー](/ja-JP/providers) - プロバイダーごとのセットアップガイド

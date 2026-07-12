---
read_when:
    - プロバイダーごとのモデル設定リファレンスが必要な場合
    - モデルプロバイダー向けの設定例または CLI オンボーディングコマンドが必要な場合
sidebarTitle: Model providers
summary: 設定例と CLI フローを含むモデルプロバイダーの概要
title: モデルプロバイダー
x-i18n:
    generated_at: "2026-07-12T14:25:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20477f9f6c8c616b4eca6653a29e0e8c9ffe5049ddfed91c585e9e22cdb669a2
    source_path: concepts/model-providers.md
    workflow: 16
---

LLM/モデルプロバイダーのリファレンスです（WhatsApp/Telegram のようなチャットチャネルではありません）。モデル選択ルールについては、[モデル](/ja-JP/concepts/models)を参照してください。

## クイックルール

<AccordionGroup>
  <Accordion title="モデル参照と CLI ヘルパー">
    - モデル参照には `provider/model` を使用します（例: `opencode/claude-opus-4-6`）。
    - `agents.defaults.models` が設定されている場合、許可リストとして機能します。
    - CLI ヘルパー: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` はプロバイダーレベルのデフォルトを設定し、`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` はモデルごとにそれらを上書きします。
    - フォールバックルール、クールダウンプローブ、セッションオーバーライドの永続化: [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)。

  </Accordion>
  <Accordion title="プロバイダー認証を追加してもプライマリモデルは変更されません">
    プロバイダーを追加または再認証するとき、`openclaw configure` は既存の `agents.defaults.model.primary` を維持します。`openclaw models auth login` も、`--set-default` を渡さない限り同様です。プロバイダー Plugin は認証設定パッチ内で推奨デフォルトモデルを返す場合がありますが、プライマリモデルがすでに存在する場合、OpenClaw はそれを「現在のプライマリモデルを置き換える」ではなく「このモデルを利用可能にする」として扱います。

    デフォルトモデルを意図的に切り替えるには、`openclaw models set <provider/model>` または `openclaw models auth login --provider <id> --set-default` を使用します。

  </Accordion>
  <Accordion title="OpenAI のプロバイダーとランタイムの分離">
    OpenAI のモデル参照とエージェントランタイムは別個です。

    - `openai/<model>` は正規の OpenAI プロバイダーとモデルを選択します。プレフィックスだけで Codex が選択されることはありません。
    - プロバイダー/モデルのランタイムポリシーが未設定または `auto` の場合、作成者によるリクエストオーバーライドがない、公式の正確な HTTPS Platform Responses または ChatGPT Responses ルートに限り、OpenAI が暗黙的に Codex を選択することがあります。
    - 作成者が定義した Completions アダプター、カスタムエンドポイント、および作成者が定義したリクエスト動作を持つルートは OpenClaw 上に留まります。公式の平文 HTTP エンドポイントは拒否されます。
    - 旧 Codex モデル参照はレガシー設定であり、doctor が `openai/<model>` に書き換えます。
    - プロバイダー/モデルの `agentRuntime.id: "openclaw"` は、本来対象となるルートを明示的に OpenClaw 上に維持します。`agentRuntime.id: "codex"` は Codex を必須とし、有効なルートが Codex 互換でない場合は安全側に失敗します。

    [OpenAI の暗黙的なエージェントランタイム](/ja-JP/providers/openai#implicit-agent-runtime)および[Codex ハーネス](/ja-JP/plugins/codex-harness)を参照してください。プロバイダーとランタイムの分離がわかりにくい場合は、最初に[エージェントランタイム](/ja-JP/concepts/agent-runtimes)を読んでください。

    Plugin の自動有効化も同じ境界に従います。暗黙的に Codex 互換となる有効なルートでは Codex Plugin を有効化できますが、プロバイダー/モデルに明示された `agentRuntime.id: "codex"` または旧 `codex/<model>` 参照では Codex Plugin が必須です。`openai/*` プレフィックスだけでは有効化されません。

    新規の OpenAI セットアップでは、ルート固有の GPT-5.6 参照を使用します。API キーによるセットアップでは
    `openai/gpt-5.6`（直接 API の短い ID は Sol に解決されます）を選択し、
    ChatGPT/Codex OAuth ではネイティブ Codex
    カタログ向けの正確な `openai/gpt-5.6-sol` を選択します。`openai/gpt-5.5` を含む既存の明示的なプライマリは、
    OpenAI 認証を追加または更新しても維持されます。GPT-5.5 は、GPT-5.6
    にアクセスできないアカウント向けの明示的な復旧選択肢として、どちらのランタイムでも引き続き利用できます。

  </Accordion>
  <Accordion title="CLI ランタイム">
    CLI ランタイムでも同じ分離を使用します。`anthropic/claude-*` や `google/gemini-*` などの正規モデル参照を選択し、ローカル CLI バックエンドを使用する場合は、プロバイダー/モデルのランタイムポリシーを `claude-cli` または `google-gemini-cli` に設定します。

    旧 `claude-cli/*` および `google-gemini-cli/*` 参照は、ランタイムを別途記録したうえで正規のプロバイダー参照に移行されます。旧 `codex-cli/*` 参照は `openai/*` に移行され、Codex app-server ルートを使用します。OpenClaw は、バンドルされた Codex CLI バックエンドを今後保持しません。

  </Accordion>
</AccordionGroup>

## Plugin が所有するプロバイダー動作

プロバイダー固有のロジックの大部分はプロバイダー Plugin（`registerProvider(...)`）に置かれ、OpenClaw は汎用的な推論ループを維持します。Plugin は、オンボーディング、モデルカタログ、認証環境変数のマッピング、トランスポート/設定の正規化、ツールスキーマのクリーンアップ、フェイルオーバー分類、OAuth 更新、使用量レポート、思考/推論プロファイルなどを所有します。

プロバイダー SDK フックとバンドル Plugin の例の完全な一覧については、[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)を参照してください。完全にカスタムのリクエスト実行機構を必要とするプロバイダーには、別の、より深い拡張サーフェスがあります。

<Note>
プロバイダー所有のランナー動作は、リプレイポリシー、ツールスキーマの正規化、ストリームのラップ、トランスポート/リクエストヘルパーなど、明示的なプロバイダーフックに置かれます。旧 `ProviderPlugin.capabilities` 静的バッグは互換性専用であり、共有ランナーロジックからは読み取られなくなりました。
</Note>

## API キーのローテーション

<AccordionGroup>
  <Accordion title="キーのソースと優先順位">
    複数のキーは、以下を使用して設定します。

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（単一のライブオーバーライド、最優先）
    - `<PROVIDER>_API_KEYS`（カンマまたはセミコロン区切りのリスト）
    - `<PROVIDER>_API_KEY`（プライマリキー）
    - `<PROVIDER>_API_KEY_*`（番号付きリスト、例: `<PROVIDER>_API_KEY_1`）

    Google プロバイダーでは、`GOOGLE_API_KEY` もフォールバックとして含まれます。キーの選択順序では優先順位が維持され、重複する値は排除されます。

  </Accordion>
  <Accordion title="ローテーションが開始される条件">
    - リクエストが次のキーで再試行されるのは、レート制限レスポンスの場合のみです（例: `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded`、または定期的な使用量制限メッセージ）。
    - レート制限以外の失敗は即座に失敗となり、キーのローテーションは試行されません。
    - 候補となるすべてのキーが失敗した場合、最後の試行の最終エラーが返されます。

  </Accordion>
</AccordionGroup>

## 公式プロバイダー Plugin

公式プロバイダー Plugin は、独自のモデルカタログ行を公開します。これらのプロバイダーでは、`models.providers` のモデルエントリは**不要**です。プロバイダー Plugin を有効化し、認証を設定して、モデルを選択してください。`models.providers` は、明示的なカスタムプロバイダーまたはタイムアウトなどの限定的なリクエスト設定にのみ使用してください。

### OpenAI

- プロバイダー: `openai`
- 認証: `OPENAI_API_KEY`
- オプションのローテーション: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`、および `OPENCLAW_LIVE_OPENAI_KEY`（単一のオーバーライド）
- 新規セットアップのデフォルト: `openai/gpt-5.6`。直接 API では、短い ID は Sol に解決されます。
- モデル例: `openai/gpt-5.6`、`openai/gpt-5.6-terra`、`openai/gpt-5.6-luna`、`openai/gpt-5.5`
- 特定のインストール環境や API キーで動作が異なる場合は、`openclaw models list --provider openai` を使用してアカウント/モデルの利用可否を確認してください。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- デフォルトのトランスポートは `auto` です。OpenClaw はトランスポートの選択を共有モデルランタイムに渡します。
- モデルごとに `agents.defaults.models["openai/<model>"].params.transport`（`"sse"`、`"websocket"`、または `"auto"`）で上書きします。
- OpenAI の優先処理は、`agents.defaults.models["openai/<model>"].params.serviceTier` で有効にできます。
- `/fast` および `params.fastMode` は、`api.openai.com` への直接 `openai/*` Responses リクエストを `service_tier=priority` にマッピングします。
- 共有の `/fast` 切り替えではなく明示的なティアを使用する場合は、`params.serviceTier` を使用します。
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、`api.openai.com` へのネイティブ OpenAI トラフィックにのみ適用され、汎用の OpenAI 互換プロキシには適用されません。
- ネイティブ OpenAI ルートでは、Responses の `store`、プロンプトキャッシュのヒント、および OpenAI の推論互換ペイロード整形も維持されます。プロキシルートでは維持されません。
- `openai/gpt-5.3-codex-spark` は ChatGPT/Codex OAuth 経由でのみ利用できます。直接 OpenAI API キーおよび Azure API キーのルートでは拒否されます。

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

API 組織で GPT-5.6 が公開されていない場合は、
`openai/gpt-5.5` を明示的に設定してください。通常のオンボーディングと再認証では、
既存の明示的なプライマリモデルが維持されます。`models auth login --set-default` と
`models set` は、意図的に置き換えるための経路です。

### Anthropic

- プロバイダー: `anthropic`
- 認証: `ANTHROPIC_API_KEY`
- オプションのローテーション: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`、および `OPENCLAW_LIVE_ANTHROPIC_KEY`（単一のオーバーライド）
- モデル例: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Anthropic への直接の公開リクエストでは、共有の `/fast` 切り替えと `params.fastMode` がサポートされます。これには、`api.anthropic.com` に送信される API キー認証および OAuth 認証済みトラフィックが含まれます。OpenClaw はこれを Anthropic の `service_tier`（`auto` と `standard_only`）にマッピングします。
- 推奨される Claude CLI 設定では、モデル参照を正規のまま維持し、CLI
  バックエンドを別途選択します。`anthropic/claude-opus-4-8` と、
  モデルスコープの `agentRuntime.id: "claude-cli"` を使用します。旧
  `claude-cli/claude-opus-4-7` 参照も、互換性のため引き続き機能します。

<Note>
Claude CLI の再利用（`claude -p`）は、OpenClaw で正式に認められた統合経路です。Anthropic のセットアップトークン認証も引き続きサポートされますが、利用可能な場合、OpenClaw は Claude CLI の再利用を優先します。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- プロバイダー: `openai`
- 認証: OAuth（ChatGPT）
- 新規のネイティブ Codex app-server ハーネス参照: `openai/gpt-5.6-sol`
- ネイティブ Codex app-server ハーネスのドキュメント: [Codex ハーネス](/ja-JP/plugins/codex-harness)
- 旧モデル参照: `codex/gpt-*`
- Plugin 境界: `openai/*` は OpenAI Plugin を読み込みます。明示的なランタイムポリシー、またはプロバイダーが所有する有効なルートによって、ネイティブ Codex app-server Plugin が選択されるかどうかが決まります。
- CLI: `openclaw onboard --auth-choice openai` または `openclaw models auth login --provider openai`
- OpenClaw に組み込まれた ChatGPT Responses トランスポートのデフォルトは `auto`（WebSocket 優先、SSE フォールバック）です。
- `agents.defaults.models["openai/<model>"].params.transport`、`params.serviceTier`、および `params.fastMode` は、作成者が定義する組み込みリクエスト設定です。これらを設定すると、暗黙的なランタイム選択は OpenClaw 上に維持されます。ネイティブ Codex は、独自の app-server トランスポートとサービスティアを所有します。
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、`chatgpt.com/backend-api` へのネイティブ Codex トラフィックにのみ付加され、汎用の OpenAI 互換プロキシには付加されません。
- 共有の `/fast` 切り替えは、ランタイム制御として引き続き利用できます。これは、作成者が定義するモデルパラメーターとは別個です。
- ネイティブ Codex カタログでは、アカウントのアクセス権に応じて、正確な `openai/gpt-5.6-sol`、`openai/gpt-5.6-terra`、および `openai/gpt-5.6-luna` 参照を公開できます。直接 API の短い `gpt-5.6` エイリアスをクライアント側で適用することはありません。
- `openai/gpt-5.5` は Codex カタログ固有の `contextWindow = 400000` とデフォルトランタイムの `contextTokens = 272000` を使用します。ランタイム上限は `models.providers.openai.models[].contextTokens` で上書きできます。
- 新しいサブスクリプションベースのセットアップでは、`openai` 認証でサインインし、`openai/gpt-5.6-sol` を使用します。その Codex ワークスペースで GPT-5.6 が公開されていない場合は、`openai/gpt-5.5` を明示的に選択してください。
- 本来対象となるルートを組み込みランタイム上に維持するには、プロバイダー/モデルの `agentRuntime.id: "openclaw"` を使用します。ランタイムが未設定または `auto` の場合、作成者によるリクエストオーバーライドがない、公式の正確な HTTPS Responses/ChatGPT 互換ルートのみが Codex を暗黙的に選択できます。
- 旧 Codex GPT 参照はレガシー状態であり、稼働中のプロバイダールートではありません。新しいエージェント設定には正規の `openai/*` 参照を使用し、`openclaw doctor --fix` を実行して、既存の明示的な `openai/gpt-5.5` 選択をアップグレードすることなく、古い旧 Codex モデル参照を移行してください。

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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
    MiniMax Coding Plan の OAuth または API キーによるアクセス。
  </Card>
  <Card title="Qwen Cloud" href="/ja-JP/providers/qwen">
    Qwen Cloud プロバイダーの機能に加え、Alibaba DashScope および Coding Plan エンドポイントのマッピング。
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
- オプションのローテーション: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、フォールバックの `GOOGLE_API_KEY`、および `OPENCLAW_LIVE_GEMINI_KEY`（単一のオーバーライド）
- モデル例: `google/gemini-3.1-pro-preview`、`google/gemini-3.5-flash`
- 互換性: `google/gemini-3.1-flash-preview` を使用する従来の OpenClaw 設定は `google/gemini-3-flash-preview` に正規化されます
- エイリアス: `google/gemini-3.1-pro` が使用可能で、Google の稼働中の Gemini API ID である `google/gemini-3.1-pro-preview` に正規化されます
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 思考: `/think adaptive` は Google の動的思考を使用します。Gemini 3/3.1 では固定の `thinkingLevel` を省略し、Gemini 2.5 では `thinkingBudget: -1` を送信します。
- Gemini の直接実行では、プロバイダー固有の `cachedContents/...` ハンドルを転送するために `agents.defaults.models["google/<model>"].params.cachedContent`（または従来の `cached_content`）も使用できます。Gemini のキャッシュヒットは OpenClaw の `cacheRead` として公開されます

### Google Vertex と Gemini CLI

- プロバイダー: `google-vertex`、`google-gemini-cli`
- 認証: Vertex は gcloud ADC を使用し、Gemini CLI は独自の OAuth フローを使用します

<Warning>
OpenClaw の Gemini CLI OAuth は非公式の統合です。一部のユーザーから、サードパーティークライアントの使用後に Google アカウントが制限されたとの報告があります。続行する場合は Google の利用規約を確認し、重要ではないアカウントを使用してください。
</Warning>

Gemini CLI OAuth は、同梱の `google` Plugin の一部として提供されます。

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

    デフォルトモデル: `google-gemini-cli/gemini-3-flash-preview`。クライアント ID やシークレットを `openclaw.json` に貼り付ける必要は**ありません**。CLI のログインフローは、Gateway ホスト上の認証プロファイルにトークンを保存します。

  </Step>
  <Step title="プロジェクトを設定（必要な場合）">
    ログイン後にリクエストが失敗する場合は、Gateway ホストで `GOOGLE_CLOUD_PROJECT` または `GOOGLE_CLOUD_PROJECT_ID` を設定してください。
  </Step>
</Steps>

Gemini CLI はデフォルトで `stream-json` を使用します。OpenClaw はアシスタントのストリーム
メッセージを読み取り、`stats.cached` を `cacheRead` に正規化します。従来の
`--output-format json` オーバーライドでも、引き続き `response` から応答テキストを読み取ります。

### Z.AI (GLM)

- プロバイダー: `zai`
- 認証: `ZAI_API_KEY`
- モデル例: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - モデル参照では正規の `zai/*` プロバイダー ID を使用します。
  - `zai-api-key` は一致する Z.AI エンドポイントを自動検出します。`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn` は特定のサーフェスを強制的に使用します

### Vercel AI Gateway

- プロバイダー: `vercel-ai-gateway`
- 認証: `AI_GATEWAY_API_KEY`
- モデル例: `vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### その他の同梱プロバイダー Plugin

| プロバイダー                            | ID                               | 認証用環境変数                                       | モデル例                                                   |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` または `OPENROUTER_API_KEY`        | `arcee/trinity-large-thinking`                             |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                     |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` または `CHUTES_OAUTH_TOKEN`         | `chutes/zai-org/GLM-4.7-TEE`                               |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                            |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`                  |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                               |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                               |
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

#### 知っておくべき注意点

<AccordionGroup>
  <Accordion title="OpenRouter">
    アプリ帰属ヘッダーとAnthropicの`cache_control`マーカーは、検証済みの`openrouter.ai`ルートにのみ適用されます。DeepSeek、Moonshot、ZAIの参照は、OpenRouterが管理するプロンプトキャッシュのキャッシュTTL対象ですが、Anthropicのキャッシュマーカーは付与されません。プロキシ形式のOpenAI互換パスとして、ネイティブOpenAI専用の整形（`serviceTier`、Responsesの`store`、プロンプトキャッシュヒント、OpenAI推論互換）はスキップされます。Geminiベースの参照では、プロキシGeminiの思考シグネチャのサニタイズのみが維持されます。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Geminiベースの参照は、同じプロキシGeminiサニタイズパスに従います。`kilocode/kilo/auto`およびプロキシ推論をサポートしないその他の参照では、プロキシ推論の注入がスキップされます。
  </Accordion>
  <Accordion title="MiniMax">
    APIキーのオンボーディングでは、M3およびM2.7のチャットモデル定義が明示的に書き込まれます。画像理解は、Pluginが所有する`MiniMax-VL-01`メディアプロバイダーに引き続き委ねられます。
  </Accordion>
  <Accordion title="NVIDIA">
    モデルIDは`nvidia/<vendor>/<model>`名前空間を使用します（たとえば、`nvidia/moonshotai/kimi-k2.5`と並ぶ`nvidia/nvidia/nemotron-...`）。選択画面ではリテラルの`<provider>/<model-id>`構成が維持されますが、APIに送信される正規キーのプレフィックスは1つのままです。
  </Accordion>
  <Accordion title="xAI">
    xAI Responsesパスを使用します。推奨パスはSuperGrok/X Premium OAuthです。APIキーも`XAI_API_KEY`またはPlugin設定を介して引き続き使用でき、Grokの`web_search`はAPIキーへのフォールバック前に同じ認証プロファイルを再利用します。利用可能な場合、Grok 4.5はチャット、コーディング、エージェント型作業向けに選択できます。`grok-4.3`は、地域安全性を考慮したバンドル既定値として維持されます。以前の`/fast`および`params.fastMode: true`設定は、引き続きxAIのGrok 4.3互換リダイレクトを通じて解決されますが、新しい設定では現行モデルを直接選択してください。`tool_stream`は既定で有効です。無効にするには`agents.defaults.models["xai/<model>"].params.tool_stream=false`を設定します。
  </Accordion>
</AccordionGroup>

## `models.providers`経由のプロバイダー（カスタム/base URL）

`models.providers`（または`models.json`）を使用して、**カスタム**プロバイダーまたはOpenAI/Anthropic互換プロキシを追加します。

以下のバンドル済みプロバイダーPluginの多くは、既定のカタログをすでに公開しています。既定のbase URL、ヘッダー、またはモデルリストを上書きする場合にのみ、明示的な`models.providers.<id>`エントリを使用してください。

Gatewayのモデル機能チェックでは、明示的な`models.providers.<id>.models[]`メタデータも読み取ります。カスタムモデルまたはプロキシモデルが画像を受け入れる場合は、そのモデルに`input: ["text", "image"]`を設定し、WebChatおよびNode由来の添付ファイルパスが、テキストのみのメディア参照ではなくネイティブなモデル入力として画像を渡すようにします。

`agents.defaults.models["provider/model"]`は、エージェント向けのモデルの表示可否、エイリアス、モデル単位のメタデータのみを制御します。それ自体では新しいランタイムモデルを登録しません。カスタムプロバイダーモデルの場合は、一致する`id`を少なくとも含む`models.providers.<provider>.models[]`も追加してください。

### Moonshot AI（Kimi）

オンボーディング前に`@openclaw/moonshot-provider`をインストールします。base URLまたはモデルメタデータを上書きする必要がある場合にのみ、明示的な`models.providers.moonshot`エントリを追加してください。

- プロバイダー: `moonshot`
- 認証: `MOONSHOT_API_KEY`
- モデル例: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key`または`openclaw onboard --auth-choice moonshot-api-key-cn`

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

完全な設定ガイドについては、[Moonshot AI（Kimi + Kimi Coding）](/ja-JP/providers/moonshot)を参照してください。

### Kimi Coding

Kimi Codingは、Moonshot AIのAnthropic互換エンドポイントを使用します。

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

従来の`kimi/kimi-code`および`kimi/k2p5`も互換モデルIDとして引き続き受け入れられ、Kimiの安定版APIモデルIDに正規化されます。

### Volcano Engine（Doubao）

Volcano Engine（火山引擎）は、中国でDoubaoおよびその他のモデルへのアクセスを提供します。

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

オンボーディングではコーディング用サーフェスが既定になりますが、汎用`volcengine/*`カタログも同時に登録されます。

オンボーディング/設定のモデル選択画面では、Volcengineの認証選択により`volcengine/*`と`volcengine-plan/*`の両方の行が優先されます。これらのモデルがまだ読み込まれていない場合、OpenClawはプロバイダーに限定された空の選択画面を表示せず、フィルターなしのカタログにフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2）

  </Tab>
  <Tab title="コーディングモデル（volcengine-plan）">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（国際版）

BytePlus ARKは、海外ユーザー向けにVolcano Engineと同じモデルへのアクセスを提供します。

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

オンボーディングではコーディング用サーフェスが既定になりますが、汎用`byteplus/*`カタログも同時に登録されます。

オンボーディング/設定のモデル選択画面では、BytePlusの認証選択により`byteplus/*`と`byteplus-plan/*`の両方の行が優先されます。これらのモデルがまだ読み込まれていない場合、OpenClawはプロバイダーに限定された空の選択画面を表示せず、フィルターなしのカタログにフォールバックします。

<Tabs>
  <Tab title="標準モデル">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

  </Tab>
  <Tab title="コーディングモデル（byteplus-plan）">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Syntheticは、`synthetic`プロバイダーの背後でAnthropic互換モデルを提供します。

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

MiniMaxはカスタムエンドポイントを使用するため、`models.providers`経由で設定されます。

- MiniMax OAuth（グローバル）: `--auth-choice minimax-global-oauth`
- MiniMax OAuth（中国）: `--auth-choice minimax-cn-oauth`
- MiniMax APIキー（グローバル）: `--auth-choice minimax-global-api`
- MiniMax APIキー（中国）: `--auth-choice minimax-cn-api`
- 認証: `minimax`では`MINIMAX_API_KEY`、`minimax-portal`では`MINIMAX_OAUTH_TOKEN`または`MINIMAX_API_KEY`

設定の詳細、モデルの選択肢、設定スニペットについては、[/providers/minimax](/ja-JP/providers/minimax)を参照してください。

<Note>
MiniMaxのAnthropic互換ストリーミングパスでは、明示的に設定しない限り、OpenClawはM2.xファミリーの思考を既定で無効にします。MiniMax-M3（およびM3.x）は、既定でプロバイダーの省略時/適応型思考パスを維持します。`/fast on`は`MiniMax-M2.7`を`MiniMax-M2.7-highspeed`に書き換えます。
</Note>

Pluginが所有する機能の分割:

- テキスト/チャットの既定値は引き続き`minimax/MiniMax-M3`
- 画像生成は`minimax/image-01`または`minimax-portal/image-01`
- 画像理解は両方のMiniMax認証パスでPluginが所有する`MiniMax-VL-01`
- Web検索では引き続きプロバイダーID`minimax`を使用

### LM Studio

LM Studioは、ネイティブAPIを使用するバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `lmstudio`
- 認証: `LM_API_TOKEN`
- 既定の推論base URL: `http://localhost:1234/v1`

次にモデルを設定します（`http://localhost:1234/api/v1/models`から返されたIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClawは、検出と自動読み込みにLM Studioのネイティブ`/api/v1/models`および`/api/v1/models/load`を使用し、推論には既定で`/v1/chat/completions`を使用します。LM StudioのJIT読み込み、TTL、自動退避にモデルのライフサイクルを管理させる場合は、`models.providers.lmstudio.params.preload: false`を設定します。設定およびトラブルシューティングについては、[/providers/lmstudio](/ja-JP/providers/lmstudio)を参照してください。

### Ollama

Ollamaはバンドル済みプロバイダーPluginとして提供され、OllamaのネイティブAPIを使用します。

- プロバイダー: `ollama`
- 認証: 不要（ローカルサーバー）
- モデル例: `ollama/llama3.3`
- インストール: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollamaをインストールし、モデルを取得します:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

`OLLAMA_API_KEY`でオプトインすると、Ollamaは`http://127.0.0.1:11434`でローカル検出され、バンドル済みプロバイダーPluginによってOllamaが`openclaw onboard`とモデル選択画面に直接追加されます。オンボーディング、クラウド/ローカルモード、カスタム設定については、[/providers/ollama](/ja-JP/providers/ollama)を参照してください。

### vLLM

vLLMは、ローカル/セルフホストのOpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `vllm`
- 認証: 任意（サーバーによる）
- 既定のbase URL: `http://127.0.0.1:8000/v1`

ローカルで自動検出にオプトインするには、次のように設定します（サーバーが認証を強制しない場合は任意の値を使用できます）。

```bash
export VLLM_API_KEY="vllm-local"
```

次にモデルを設定します（`/v1/models`から返されたIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

詳細については、[/providers/vllm](/ja-JP/providers/vllm)を参照してください。

### SGLang

SGLangは、高速なセルフホストのOpenAI互換サーバー向けのバンドル済みプロバイダーPluginとして提供されます。

- プロバイダー: `sglang`
- 認証: 任意（サーバーによる）
- 既定のbase URL: `http://127.0.0.1:30000/v1`

ローカルで自動検出にオプトインするには、次のように設定します（サーバーが認証を強制しない場合は任意の値を使用できます）。

```bash
export SGLANG_API_KEY="sglang-local"
```

次にモデルを設定します（`/v1/models`から返されたIDのいずれかに置き換えてください）。

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

詳細については、[/providers/sglang](/ja-JP/providers/sglang)を参照してください。

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
  <Accordion title="省略可能なフィールドのデフォルト値">
    カスタムプロバイダーでは、`reasoning`、`input`、`cost`、`contextWindow`、`maxTokens`は省略可能です。省略した場合、OpenClawは以下の値をデフォルトとして使用します。

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    推奨: プロキシやモデルの制限に一致する値を明示的に設定してください。

  </Accordion>
  <Accordion title="プロキシルートのリクエスト整形ルール">
    - 非ネイティブエンドポイント（ホストが`api.openai.com`ではない、空でない`baseUrl`）で`api: "openai-completions"`を使用する場合、未対応の`developer`ロールによるプロバイダーの400エラーを回避するため、OpenClawは`compat.supportsDeveloperRole: false`を強制します。
    - プロキシ形式のOpenAI互換ルートでは、OpenAIネイティブ専用のリクエスト整形もスキップされます。`service_tier`、Responsesの`store`、Completionsの`store`、プロンプトキャッシュのヒント、OpenAIのreasoning互換ペイロード整形、非表示のOpenClaw帰属ヘッダーは使用されません。
    - ベンダー固有のフィールドを必要とするOpenAI互換Completionsプロキシでは、`agents.defaults.models["provider/model"].params.extra_body`（または`extraBody`）を設定して、送信リクエスト本文に追加のJSONをマージしてください。
    - vLLMのチャットテンプレート制御には、`agents.defaults.models["provider/model"].params.chat_template_kwargs`を設定してください。バンドルされているvLLM Pluginは、セッションの思考レベルがオフの場合、`vllm/nemotron-3-*`に対して`enable_thinking: false`と`force_nonempty_content: true`を自動的に送信します。
    - 低速なローカルモデル、またはリモートのLAN/tailnetホストでは、`models.providers.<id>.timeoutSeconds`を設定してください。これにより、接続、ヘッダー、本文のストリーミング、保護されたfetch全体の中止を含む、プロバイダーモデルのHTTPリクエスト処理時間が延長されますが、エージェント全体の実行タイムアウトは延長されません。`agents.defaults.timeoutSeconds`または実行固有のタイムアウトの方が短い場合は、その上限も引き上げてください。プロバイダーのタイムアウトでは実行全体を延長できません。
    - モデルプロバイダーへのHTTP呼び出しでは、設定されたプロバイダーの`baseUrl`ホスト名に限り、Surge、Clash、sing-boxによる`198.18.0.0/15`および`fc00::/7`のfake-IP DNS応答を許可します。カスタムまたはローカルのプロバイダーエンドポイントでは、loopback、LAN、tailnetホストを含め、保護されたモデルリクエストに対して、設定された正確な`scheme://host:port`オリジンも信頼します。これは新しい設定オプションではありません。設定した`baseUrl`によって、そのオリジンに限りリクエストポリシーが拡張されます。fake-IPホスト名の許可と正確なオリジンの信頼は、独立した仕組みです。その他のプライベート、loopback、リンクローカル、メタデータ宛先、および異なるポートでは、引き続き`models.providers.<id>.request.allowPrivateNetwork: true`による明示的なオプトインが必要です。正確なオリジンの信頼を無効にするには、`models.providers.<id>.request.allowPrivateNetwork: false`を設定してください。
    - `baseUrl`が空または省略されている場合、OpenClawはOpenAIのデフォルト動作（`api.openai.com`に解決されます）を維持します。
    - 安全のため、`compat.supportsDeveloperRole: true`を明示的に指定しても、非ネイティブの`openai-completions`エンドポイントでは引き続き上書きされます。
    - 非直接エンドポイント（標準の`anthropic`以外のプロバイダー、またはホストが公開`api.anthropic.com`エンドポイントではないカスタム`models.providers.anthropic.baseUrl`）で`api: "anthropic-messages"`を使用する場合、カスタムのAnthropic互換プロキシが未対応のベータフラグを拒否しないよう、OpenClawは`claude-code-20250219`、`interleaved-thinking-2025-05-14`、OAuthマーカーなどの暗黙的なAnthropicベータヘッダーを抑制します。プロキシで特定のベータ機能が必要な場合は、`models.providers.<id>.headers["anthropic-beta"]`を明示的に設定してください。

  </Accordion>
</AccordionGroup>

## CLIの例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

完全な設定例については、[設定](/ja-JP/gateway/configuration)も参照してください。

## 関連項目

- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - モデル設定キー
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover) - フォールバックチェーンと再試行の動作
- [モデル](/ja-JP/concepts/models) - モデルの設定とエイリアス
- [プロバイダー](/ja-JP/providers) - プロバイダーごとのセットアップガイド

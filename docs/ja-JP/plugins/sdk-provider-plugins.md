---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加したい
    - プロバイダー認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw向けモデルプロバイダーPluginを構築するためのステップバイステップガイド
title: Provider Plugin の構築
x-i18n:
    generated_at: "2026-07-05T11:38:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 936227cf6e8d93c1a56ddf7e3e5f8613c1f430029a456d5acfdaa000ea7cdc94
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

OpenClaw にモデルプロバイダー (LLM) を追加する provider plugin を構築します: モデル
カタログ、API キー認証、動的モデル解決。

<Info>
  OpenClaw プラグインが初めてですか？パッケージ構造とマニフェスト設定について、まず
  [はじめに](/ja-JP/plugins/building-plugins)を読んでください。
</Info>

<Tip>
  Provider plugins は OpenClaw の通常の推論ループにモデルを追加します。モデルが
  スレッド、Compaction、ツールイベントを所有するネイティブエージェントデーモンを通じて
  実行される必要がある場合は、デーモンプロトコルの詳細をコアに入れるのではなく、
  provider を[agent harness](/ja-JP/plugins/sdk-agent-harness)と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
  <Step title="Package and manifest">
    ### ステップ 1: パッケージとマニフェスト

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars` により、OpenClaw はプラグインランタイムを
    ロードせずに認証情報を検出できます。provider のバリアントが別の provider id の
    認証を再利用する必要がある場合は、`providerAuthAliases` を追加します。
    `modelSupport` は任意で、ランタイムフックが存在する前に、`acme-large` のような
    省略形のモデル id から OpenClaw が provider plugin を自動ロードできるようにします。
    `package.json` の `openclaw.compat` と `openclaw.build` は ClawHub
    公開に必須です（`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion`
    が 2 つの必須フィールドです。`minGatewayVersion` は省略時に
    `openclaw.install.minHostVersion` にフォールバックします）。

  </Step>

  <Step title="Register the provider">
    最小限のテキスト provider には、`id`、`label`、`auth`、`catalog` が必要です。
    `catalog` は provider が所有するランタイム/設定フックです。ライブの
    ベンダー API を呼び出し、`models.providers` エントリを返せます。

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider` は、list/help/picker UI 向けの新しい
    コントロールプレーンカタログサーフェスで、`text`、`voice`、
    `image_generation`、`video_generation`、`music_generation` の行を扱います。
    ベンダーエンドポイントの呼び出しとレスポンスマッピングはプラグイン内に保持してください。
    OpenClaw は共有の行形状、ソースラベル、ヘルプ表示を所有します。

    これで動作する provider になります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、モデルとして
    `acme-ai/acme-large` を選択できるようになります。

    ### ライブモデル検出

    provider が `/models` 形式の API を公開している場合は、provider 固有の
    エンドポイントと行への投影をプラグイン内に保持し、共有 fetch ライフサイクルには
    `openclaw/plugin-sdk/provider-catalog-live-runtime` を使用してください。このヘルパーは、
    provider のポリシーを OpenClaw コアに入れずに、保護された HTTP fetch、
    provider 認証ヘッダー、構造化 HTTP エラー、TTL キャッシュ、静的フォールバック動作を提供します。

    ライブ API が、provider 所有の静的カタログ行のうち現在利用可能なものだけを
    伝える場合は、`buildLiveModelProviderConfig` を使用します。

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
      {
        id: "acme-large",
        name: "Acme Large",
        reasoning: true,
        input: ["text", "image"],
        cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
        contextWindow: 200000,
        maxTokens: 32768,
      },
      {
        id: "acme-small",
        name: "Acme Small",
        reasoning: false,
        input: ["text"],
        cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
        contextWindow: 128000,
        maxTokens: 8192,
      },
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    provider API がより豊富なメタデータを返し、プラグイン自身で行を
    OpenClaw のモデル定義へ投影する必要がある場合は、`getCachedLiveProviderModelRows`
    を使用します。

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run` は認証で保護されたままにし、利用可能な認証情報がない場合は
    `null` を返す必要があります。セットアップ、ドキュメント、テスト、picker
    サーフェスがライブネットワークアクセスに依存しないように、オフラインの
    `staticRun` または静的フォールバックを保持してください。モデルリストの鮮度に
    適した TTL を使用し、リクエスト時のファイルシステムポーリングを避け、
    upstream のレスポンスが OpenAI 互換の `{ data: [{ id, object }] }`
    形状ではない場合にのみ、provider 固有の `readRows` / `readModelId` を渡します。

    upstream provider が OpenClaw と異なる制御トークンを使用する場合は、ストリームパスを
    置き換えるのではなく、小さな双方向テキスト変換を追加します。

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` はトランスポート前に最終的なシステムプロンプトとテキストメッセージ内容を
    書き換えます。`output` は、OpenClaw が自身の制御マーカーまたはチャネル配信を
    解析する前に、assistant のテキストデルタと最終テキストを書き換えます。

    API キー認証と単一のカタログ backed ランタイムを持つテキスト provider を 1 つだけ
    登録する bundled providers では、より狭い
    `defineSingleProviderPluginEntry(...)` ヘルパーを優先してください:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できるときに使われるライブカタログパスです。プロバイダー固有の検出を実行する場合があります。`buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使用してください。認証情報を要求したり、ネットワークリクエストを行ったりしてはいけません。OpenClaw の `models list --all` 表示は現在、バンドルされたプロバイダー Plugin に対してのみ、空の設定、空の環境、agent/workspace パスなしで静的カタログを実行します。

    認証フローで、オンボーディング中に `models.providers.*`、エイリアス、agent のデフォルトモデルも修正する必要がある場合は、`openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も範囲の狭いヘルパーは、`createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)`、`createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` トランスポートでストリーミング使用量ブロックをサポートする場合は、プロバイダー ID チェックをハードコードする代わりに、`openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と `applyProviderNativeStreamingUsageCompat(...)` はエンドポイント機能マップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使用している場合でも、ネイティブ Moonshot/DashScope スタイルのエンドポイントは引き続きオプトインできます。

    上記のライブ検出例は、`/models` スタイルのプロバイダー API を対象としています。その検出は `catalog.run` の中に置き、使用可能な認証でゲートし、オフラインカタログ生成用の `staticRun` はネットワーク不要にしてください。

  </Step>

  <Step title="Add dynamic model resolution">
    プロバイダーが任意のモデル ID（プロキシやルーターなど）を受け付ける場合は、`resolveDynamicModel` を追加します。

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップに `prepareDynamicModel` を使用してください。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    ほとんどのプロバイダーで必要なのは `catalog` と `resolveDynamicModel` だけです。プロバイダーが必要とするにつれて、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的な replay/tool-compat ファミリーをカバーしているため、Plugin が各フックを 1 つずつ手作業で配線する必要は通常ありません。

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    現在利用できる replay ファミリー:

    | ファミリー | 配線される内容 | バンドル例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換トランスポート向けの共有 OpenAI スタイル replay ポリシー。tool-call-id のサニタイズ、assistant-first の順序修正、トランスポートで必要な場合の汎用 Gemini ターン検証を含みます | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応 replay ポリシー。Anthropic-message トランスポートは、解決済みモデルが実際に Claude id の場合にのみ Claude 固有の thinking-block クリーンアップを受けます | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model` と同じ Claude-by-model ポリシーに加え、ベンダーネイティブ ID を保持する必要があるトランスポート向けの tool-call-id サニタイズとネイティブ Anthropic tool-use id 保持 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーとブートストラップ replay サニタイズ。共有ファミリーは、タグ付き reasoning でテキスト出力 Gemini CLI を維持します。直接の `google` プロバイダーは、Gemini API の thinking がネイティブ thought parts として届くため、`resolveReasoningOutputMode` を `native` に上書きします。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシトランスポート経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証やブートストラップ書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic-message と OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 専用 thinking-block ドロップは Anthropic 側に限定されます | `minimax` |

    現在利用できる stream ファミリー:

    | ファミリー | 配線される内容 | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上の Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上の Kilo reasoning ラッパー。`kilo/auto` と未サポートのプロキシ reasoning ID では注入された thinking をスキップします | `kilocode` |
    | `moonshot-thinking` | 設定と `/think` レベルからの Moonshot バイナリネイティブ thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上の MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト詳細度、ネイティブ Codex Web 検索、reasoning-compat ペイロード整形、Responses コンテキスト管理 | `openai` |
    | `openrouter-thinking` | プロキシルート向けの OpenRouter reasoning ラッパー。未サポートモデル/`auto` のスキップは中央で処理されます | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限り tool streaming を使いたい Z.AI などのプロバイダー向けのデフォルトオン `tool_stream` ラッパー | `zai` |

    <Accordion title="SDK seams powering the family builders">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合に使用できます。

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生の replay ビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。また、Gemini replay ヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）とエンドポイント/モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking prefill クリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、プレーンテキスト tool-call compat（`createPlainTextToolCallCompatWrapper`）、共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - ホットなプロバイダーパス向けの軽量ペイロードおよびイベントラッパー。`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)`、`setQwenChatTemplateThinking(...)` を含みます。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`、および基盤となるプロバイダースキーマヘルパー。

      Gemini ファミリーのプロバイダーでは、reasoning 出力モードをトランスポートに合わせてください。直接の Google Gemini API プロバイダーは、`native` reasoning 出力を使用する必要があります。これにより、OpenClaw は `<think>` / `<final>` プロンプト指示を追加せずにネイティブ thought parts を消費できます。最終 JSON/テキスト応答を解析するテキスト専用の Gemini CLI スタイルバックエンドは、共有 `google-gemini` タグ付き契約を維持できます。

      一部の stream ヘルパーは意図的にプロバイダーローカルのままです。`@openclaw/anthropic-provider` は、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および低レベルの Anthropic ラッパービルダーを独自の公開 `api.ts` / `contract-api.ts` seam に保持しています。これらは Claude OAuth beta 処理と `context1m` ゲートをエンコードするためです。xAI Plugin も同様に、ネイティブ xAI Responses 整形を独自の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未サポート strict-tool クリーンアップ、xAI 固有 reasoning-payload 削除）に保持しています。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーとオンボーディング/設定ヘルパー）も支えています。
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        各 inference 呼び出しの前にトークン交換が必要なプロバイダーの場合:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Custom headers">
        カスタムリクエストヘッダーまたは本文変更が必要なプロバイダーの場合:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native transport identity">
        汎用 HTTP または WebSocket トランスポート上でネイティブリクエスト/セッションヘッダーまたはメタデータが必要なプロバイダーの場合:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Usage and billing">
        usage/billing データを公開するプロバイダーの場合:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` には 3 つの結果があります。プロバイダーが usage/billing の認証情報を持つ場合は `{ token, accountId? }`
        を返します。プロバイダーが usage
        認証を確実に処理したものの、利用可能な usage トークンがなく、OpenClaw が汎用
        API キー/OAuth フォールバックをスキップする必要がある場合にのみ
        `{ handled: true }` を返します。プロバイダーがリクエストを処理しておらず、OpenClaw が汎用フォールバックを続行すべき場合は
        `null` または `undefined` を返します。
      </Tab>
    </Tabs>

    <Accordion title="Common provider hooks">
      OpenClaw はモデル/プロバイダーPluginに対して、おおよそこの順序でフックを呼び出します。
      ほとんどのプロバイダーは 2〜3 個だけを使います。これは完全な `ProviderPlugin`
      コントラクトではありません。完全で現時点で正確なフック一覧とフォールバックの注記については
      [内部: プロバイダーランタイム
      フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドは、ここには記載していません。

      | フック | 使う場面 |
      | --- | --- |
      | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | `applyConfigDefaults` | config の実体化中に適用する、プロバイダー所有のグローバルデフォルト |
      | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデル ID エイリアスのクリーンアップ |
      | `normalizeTransport` | 汎用モデル組み立て前の、プロバイダーファミリーの `api` / `baseUrl` クリーンアップ |
      | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | `applyNativeStreamingUsageCompat` | config プロバイダー向けのネイティブ streaming-usage 互換性リライト |
      | `resolveConfigApiKey` | プロバイダー所有の env-marker 認証解決 |
      | `resolveSyntheticAuth` | ローカル/セルフホスト、または config backed な合成認証 |
      | `resolveExternalAuthProfiles` | CLI/アプリ管理の認証情報向けに、プロバイダー所有の外部認証プロファイルを重ねる |
      | `shouldDeferSyntheticProfileAuth` | env/config 認証の背後に、合成の保存済みプロファイルプレースホルダーを下げる |
      | `resolveDynamicModel` | 任意の upstream モデル ID を受け入れる |
      | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | `normalizeResolvedModel` | runner 前の transport リライト |
      | `normalizeToolSchemas` | 登録前の、プロバイダー所有の tool-schema クリーンアップ |
      | `inspectToolSchemas` | プロバイダー所有の tool-schema 診断 |
      | `resolveReasoningOutputMode` | タグ付き vs ネイティブ reasoning-output コントラクト |
      | `prepareExtraParams` | デフォルトのリクエストパラメーター |
      | `createStreamFn` | 完全にカスタムの StreamFn transport |
      | `wrapStreamFn` | 通常のストリームパス上のカスタムヘッダー/body ラッパー |
      | `resolveTransportTurnState` | ネイティブの turn ごとのヘッダー/メタデータ |
      | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | `formatApiKey` | カスタムランタイムトークン形状 |
      | `refreshOAuth` | カスタム OAuth 更新 |
      | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | `matchesContextOverflowError` | プロバイダー所有の overflow 検出 |
      | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | `augmentModelCatalog` | 合成 forward-compat 行（非推奨 - `registerModelCatalogProvider` を推奨） |
      | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | `isBinaryThinking` | binary thinking on/off 互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `supportsXHighThinking` | `xhigh` reasoning 対応互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `isModernModelRef` | live/smoke モデルマッチング |
      | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | `resolveUsageAuth` | カスタム usage 認証情報パース |
      | `fetchUsageSnapshot` | カスタム usage エンドポイント |
      | `createEmbeddingProvider` | memory/search 向けの、プロバイダー所有 embedding アダプター |
      | `buildReplayPolicy` | カスタム transcript replay/compaction ポリシー |
      | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有 replay リライト |
      | `validateReplayTurns` | 組み込み runner 前の厳格な replay-turn 検証 |
      | `onModelSelected` | 選択後コールバック（例: telemetry） |

      ランタイムフォールバックの注記:

      - `normalizeConfig` はプロバイダー ID ごとに 1 つの所有Pluginを解決し（バンドルされたプロバイダーが先、その後に一致したランタイムPlugin）、そのフックだけを呼び出します。他のプロバイダーを横断してスキャンすることはありません。`google` / `google-vertex` / `google-antigravity` config エントリを正規化するのは Google 自身の `normalizeConfig` フックであり、別の core フォールバックではありません。
      - `resolveConfigApiKey` は公開されている場合、プロバイダーフックを使います。Amazon Bedrock は AWS env-marker 解決を自身のプロバイダーPlugin内に保持します。ランタイム認証自体は、`auth: "aws-sdk"` で設定されている場合、引き続き AWS SDK のデフォルトチェーンを使います。
      - `resolveThinkingProfile(ctx)` は、選択された `provider`、`modelId`、任意でマージされた `reasoning` カタログヒント、任意でマージされたモデル `compat` facts を受け取ります。`compat` はプロバイダーの thinking UI/profile を選択するためだけに使ってください。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けに、キャッシュを意識したシステムプロンプトガイダンスを注入できます。挙動が 1 つのプロバイダー/モデルファミリーに属し、stable/dynamic キャッシュ分割を維持すべき場合は、レガシーなPlugin全体の `before_prompt_build` フックよりもこちらを優先してください。

    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### ステップ 5: 追加機能を追加する

    プロバイダーPluginは、テキスト推論と並行して、embeddings、speech、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    web fetch、web search を登録できます。OpenClaw はこれを
    **hybrid-capability** Pluginとして分類します。これは企業Pluginに推奨されるパターンです
    （ベンダーごとに 1 つのPlugin）。[内部: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)
    を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各機能を `register(api)` 内で登録します。
    必要なタブだけを選んでください:

    <Tabs>
      <Tab title="Speech (TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          defaultTimeoutMs: 120_000,
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        プロバイダー HTTP 失敗には `assertOkOrThrowProviderError(...)` を使ってください。これにより
        Plugin間で、上限付きのエラー body 読み取り、JSON エラーパーシング、
        request-id サフィックスを共有できます。
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` を推奨します。共有ヘルパーが
        プロキシキャプチャ、再接続バックオフ、close flushing、ready
        ハンドシェイク、音声キューイング、close-event 診断を処理します。Plugin側では
        upstream イベントをマッピングするだけです。

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        multipart 音声を POST するバッチ STT プロバイダーは、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使ってください。このヘルパーは、互換性のある文字起こし API に M4A 形式のファイル名が必要な AAC アップロードを含め、
        アップロードファイル名を正規化します。
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        `capabilities` を宣言すると、`talk.catalog` が有効なモード、
        トランスポート、音声形式、機能フラグをブラウザーおよびネイティブの Talk
        クライアントに公開できます。トランスポートが、人間がアシスタントの再生を
        中断していることを検出でき、プロバイダーがアクティブな音声応答の切り詰めまたは
        クリアをサポートする場合は、`handleBargeIn` を実装します。
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        認証情報を意図的に必要としないローカルまたはセルフホストのメディアプロバイダーは、
        `resolveAuth` を公開して `kind: "none"` を返すことができます。
        OpenClaw は、明示的にオプトインしないプロバイダーについては通常の認証ゲートを維持します。
        既存のプロバイダーは `req.apiKey` を引き続き読み取れます。
        新しいプロバイダーでは `req.auth` を優先してください。

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        同じ ID を `contracts.embeddingProviders` で宣言します。これは、
        メモリ検索を含む再利用可能なベクトル生成のための一般的な埋め込みコントラクトです。
        `registerMemoryEmbeddingProvider(...)` は、既存のメモリ専用アダプター向けの
        非推奨の互換機能です。
      </Tab>
      <Tab title="Image and video generation">
        画像と動画の機能は、**モードを認識する**形状を使用します。画像プロバイダーは、
        必須の `generate` および `edit` 機能ブロックを宣言します。
        動画プロバイダーは `generate`、`imageToVideo`、`videoToVideo` を宣言します。
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のような
        フラットな集約フィールドだけでは、変換モードのサポートや無効化されたモードを
        明確に通知するには不十分です。音楽生成も同じ `generate` / `edit` パターンに従います。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        `capabilities` は両方のプロバイダー種別で必須です。`edit` と
        動画変換ブロック（`imageToVideo`、`videoToVideo`）には、常に
        明示的な `enabled` フラグが必要です。
      </Tab>
      <Tab title="Web fetch and search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        両方のプロバイダー種別は、同じ認証情報配線の形状を共有します。
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue`、`createTool` はすべて必須です。
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### ステップ 6: テスト

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHub に公開する

プロバイダーPluginは、他の外部コードPluginと同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` は、Plugin パッケージではなくスキルフォルダーを
公開するための別のコマンドです。ここでは使用しないでください。

## ファイル構造

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## カタログ順序のリファレンス

`catalog.order` は、組み込みプロバイダーに対してカタログがいつマージされるかを制御します。

| 順序      | タイミング    | ユースケース                                    |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キープロバイダー                    |
| `profile` | simple の後   | 認証プロファイルでゲートされるプロバイダー      |
| `paired`  | profile の後  | 複数の関連エントリを合成する                    |
| `late`    | 最後のパス    | 既存プロバイダーを上書きする（衝突時に優先）    |

## 次のステップ

- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) - Plugin がチャネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [Plugin 内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細とバンドル例

## 関連

- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [チャネルPluginの構築](/ja-JP/plugins/sdk-channel-plugins)

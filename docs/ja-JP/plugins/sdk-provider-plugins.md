---
read_when:
    - 新しいモデルプロバイダーPluginを構築している
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加したい
    - OpenClaw docs i18n 入力を翻訳する必要があります。
sidebarTitle: Provider plugins
summary: OpenClaw 用のモデルプロバイダー Plugin を構築するためのステップバイステップガイド
title: Provider Plugin の構築
x-i18n:
    generated_at: "2026-07-06T10:52:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7318081368f79acd46d09b07c52341977d3d7b0f5c187e428c38db2241bbdf0a
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

モデルプロバイダー（LLM）を OpenClaw に追加するプロバイダー Plugin を構築します。モデルカタログ、API キー認証、動的モデル解決を含みます。

<Info>
  OpenClaw plugins が初めてですか？パッケージ構造とマニフェスト設定については、まず [はじめに](/ja-JP/plugins/building-plugins)
  を読んでください。
</Info>

<Tip>
  プロバイダー Plugin は OpenClaw の通常の推論ループにモデルを追加します。モデルがスレッド、Compaction、
  またはツールイベントを所有するネイティブエージェントデーモン経由で実行される必要がある場合は、デーモンプロトコルの詳細を core に入れるのではなく、プロバイダーを [エージェント
  ハーネス](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
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

    `setup.providers[].envVars` により、OpenClaw は Plugin ランタイムを読み込まずに認証情報を検出できます。
    プロバイダーのバリアントが別のプロバイダー ID の認証を再利用する必要がある場合は、`providerAuthAliases` を追加します。`modelSupport` は任意で、ランタイムフックが存在する前に、`acme-large` のような短縮形のモデル ID から OpenClaw がプロバイダー Plugin を自動読み込みできるようにします。`package.json` の `openclaw.compat`
    と `openclaw.build` は ClawHub 公開に必要です（`openclaw.compat.pluginApi` と `openclaw.build.openclawVersion`
    が 2 つの必須フィールドです。`minGatewayVersion` は省略時に
    `openclaw.install.minHostVersion` にフォールバックします）。

  </Step>

  <Step title="Register the provider">
    最小限のテキストプロバイダーには、`id`、`label`、`auth`、`catalog` が必要です。
    `catalog` はプロバイダー所有のランタイム/設定フックです。ライブのベンダー API を呼び出し、
    `models.providers` エントリを返すことができます。

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

    `registerModelCatalogProvider` は、リスト/ヘルプ/ピッカー UI 向けの新しいコントロールプレーンカタログサーフェスで、
    `text`、`voice`、`image_generation`、`video_generation`、`music_generation` の行をカバーします。ベンダーエンドポイントの呼び出しとレスポンスのマッピングは Plugin に保持してください。OpenClaw は共有の行形状、ソースラベル、ヘルプ表示を所有します。

    これで動作するプロバイダーになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    ### ライブモデル検出

    プロバイダーが `/models` スタイルの API を公開している場合は、プロバイダー固有のエンドポイントと行への投影を Plugin に保持し、共有フェッチライフサイクルには
    `openclaw/plugin-sdk/provider-catalog-live-runtime` を使用します。このヘルパーは、プロバイダーポリシーを OpenClaw core に入れることなく、保護された HTTP フェッチ、プロバイダー認証ヘッダー、構造化 HTTP エラー、TTL キャッシュ、静的フォールバック動作を提供します。

    ライブ API が、プロバイダー所有の静的カタログ行のうち現在利用可能なものだけを示す場合は、`buildLiveModelProviderConfig` を使用します。

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

    プロバイダー API がよりリッチなメタデータを返し、Plugin 自身が OpenClaw モデル定義へ行を投影する必要がある場合は、`getCachedLiveProviderModelRows` を使用します。

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

    `run` は認証で保護されたままにし、利用可能な認証情報がない場合は `null` を返す必要があります。セットアップ、ドキュメント、テスト、ピッカーサーフェスがライブネットワークアクセスに依存しないように、オフラインの `staticRun` または静的フォールバックを保持してください。モデルリストの鮮度に適した TTL を使用し、リクエスト時のファイルシステムポーリングを避け、上流レスポンスが OpenAI 互換の `{ data: [{ id, object }] }`
    形状でない場合にのみ、プロバイダー固有の `readRows` / `readModelId` を渡してください。

    上流プロバイダーが OpenClaw と異なる制御トークンを使用している場合は、ストリームパスを置き換えるのではなく、小さな双方向テキスト変換を追加します。

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

    `input` はトランスポート前に最終的なシステムプロンプトとテキストメッセージ内容を書き換えます。`output` は、OpenClaw が自身の制御マーカーを解析する前、またはチャンネル配信の前に、アシスタントのテキスト差分と最終テキストを書き換えます。

    API キー認証と単一のカタログ backed ランタイムを持つ 1 つのテキストプロバイダーのみを登録するバンドルプロバイダーでは、より狭い
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使用されるライブカタログパスです。プロバイダー固有の検出を実行する場合があります。`buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使用してください。認証情報を要求したり、ネットワークリクエストを実行したりしてはいけません。
    OpenClaw の `models list --all` 表示は現在、バンドルされたプロバイダー Plugin に対してのみ、空の設定、空の env、agent/workspace パスなしで静的カタログを実行します。

    認証フローでオンボーディング中に `models.providers.*`、エイリアス、agent のデフォルトモデルもパッチする必要がある場合は、`openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も範囲の狭いヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` トランスポート上でストリーミングされた使用量ブロックをサポートする場合は、プロバイダー ID チェックをハードコードするのではなく、`openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は、エンドポイントのケイパビリティマップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使用している場合でも、ネイティブの Moonshot/DashScope 形式のエンドポイントはオプトインできます。

    上記のライブ検出例は、`/models` 形式のプロバイダー API を対象としています。その検出は `catalog.run` 内に置き、使用可能な認証でゲートし、`staticRun` はオフラインカタログ生成のためにネットワークなしに保ってください。

  </Step>

  <Step title="動的モデル解決を追加する">
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

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーは `catalog` + `resolveDynamicModel` だけで十分です。プロバイダーが必要とする場合に、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的な replay/tool-compat ファミリーをカバーしているため、Plugin が各フックを一つずつ手作業で配線する必要は通常ありません。

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

    現在利用可能な replay ファミリー:

    | ファミリー | 配線される内容 | バンドル例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換トランスポート向けの共有 OpenAI 形式 replay ポリシー。tool-call-id のサニタイズ、assistant-first 順序修正、トランスポートが必要とする場合の汎用 Gemini ターン検証を含みます | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応 replay ポリシー。これにより、Anthropic-message トランスポートは、解決済みモデルが実際に Claude ID の場合にのみ Claude 固有の thinking-block クリーンアップを受けます | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model` と同じ Claude-by-model ポリシーに加え、tool-call-id のサニタイズと、ベンダーネイティブ ID を維持する必要があるトランスポート向けのネイティブ Anthropic tool-use ID 保持 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーと bootstrap replay サニタイズ。共有ファミリーは、タグ付き reasoning でテキスト出力の Gemini CLI を維持します。直接の `google` プロバイダーは、Gemini API の thinking がネイティブ thought parts として届くため、`resolveReasoningOutputMode` を `native` にオーバーライドします。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシトランスポート経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic-message と OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 専用 thinking-block ドロップは Anthropic 側に限定されます | `minimax` |

    現在利用可能な stream ファミリー:

    | ファミリー | 配線される内容 | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有 stream パス上での Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシ stream パス上の Kilo reasoning ラッパー。`kilo/auto` と未サポートのプロキシ reasoning ID では挿入 thinking をスキップします | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルからの Moonshot バイナリ native-thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有 stream パス上の MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト詳細度、ネイティブ Codex Web 検索、reasoning-compat ペイロード整形、Responses コンテキスト管理 | `openai` |
    | `openrouter-thinking` | プロキシルート向けの OpenRouter reasoning ラッパー。未サポートモデル/`auto` のスキップは中央で処理されます | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限り tool streaming を求める Z.AI のようなプロバイダー向けのデフォルト有効 `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK シーム">
      各ファミリービルダーは、同じパッケージからエクスポートされる下位レベルの公開ヘルパーから構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および raw replay ビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini replay ヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と endpoint/model ヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)` に加え、共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking prefill クリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、プレーンテキスト tool-call compat（`createPlainTextToolCallCompatWrapper`）、共有 proxy/provider ラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - ホットなプロバイダーパス向けの軽量ペイロードおよびイベントラッパー。`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)`、`setQwenChatTemplateThinking(...)` を含みます。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`、および基盤となるプロバイダースキーマヘルパー。

      Gemini ファミリーのプロバイダーでは、reasoning 出力モードをトランスポートと揃えてください。直接の Google Gemini API プロバイダーは、OpenClaw が `<think>` / `<final>` プロンプトディレクティブを追加せずにネイティブ thought parts を消費できるよう、`native` reasoning 出力を使用する必要があります。最終的な JSON/text 応答を解析するテキスト専用の Gemini CLI 形式バックエンドは、共有の `google-gemini` タグ付き契約を維持できます。

      一部の stream ヘルパーは意図的にプロバイダー内に留められています。`@openclaw/anthropic-provider` は、Claude OAuth beta 処理と `context1m` ゲートをエンコードするため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルの Anthropic ラッパービルダーを独自の公開 `api.ts` / `contract-api.ts` シームに保持しています。xAI Plugin も同様に、ネイティブ xAI Responses 整形を独自の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未サポート strict-tool クリーンアップ、xAI 固有の reasoning-payload 削除）に保持しています。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーに加え、オンボーディング/config ヘルパー）も支えています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なプロバイダーの場合:

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
      <Tab title="カスタムヘッダー">
        カスタムリクエストヘッダーやボディ変更が必要なプロバイダーの場合:

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
      <Tab title="ネイティブトランスポート ID">
        汎用 HTTP または WebSocket トランスポート上でネイティブのリクエスト/session ヘッダーまたはメタデータが必要なプロバイダーの場合:

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
        使用量と課金データを公開するプロバイダーの場合:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` には 3 つの結果があります。プロバイダーに使用量/課金の認証情報がある場合は `{ token, accountId? }` を返します。プロバイダーが使用量認証を確実に処理したものの、使用可能な使用量トークンがなく、OpenClaw が汎用の API キー/OAuth フォールバックをスキップする必要がある場合にのみ、`{ handled: true }` を返します。プロバイダーがリクエストを処理せず、OpenClaw が汎用フォールバックを継続する必要がある場合は、`null` または `undefined` を返します。

        プロバイダー ID を `contracts.usageProviders` で宣言します。そのマニフェスト契約と **両方** のフックが存在する場合、OpenClaw は無関係なプロバイダー Plugin を読み込まずに、そのプロバイダーを使用量収集に自動的に含めます。コアの許可リスト更新は不要です。
        `fetchUsageSnapshot` は共有のプロバイダー非依存形状を返します:

        - `plan`: プロバイダーが報告するサブスクリプションまたはキーのラベル
        - `windows`: 使用率として表されるリセット可能なクォータウィンドウ
        - `billing`: 型付きの `balance`、`spend`、または `budget` エントリ。`unit` は ISO 通貨、または `credits` のようなプロバイダー単位にできます
        - `summary`: これらの構造化フィールドに収まらない、コンパクトなプロバイダー固有コンテキスト

        通貨の意味は正確に保ってください。上流契約でそう示されていない限り、プロバイダークレジットは USD ではありません。`fetchUsageSnapshot` のみを実装する Plugin は、明示的/合成呼び出し元では引き続き利用できますが、OpenClaw がその使用量認証情報を解決できないため、自動検出はされません。
      </Tab>
    </Tabs>

    <Accordion title="Common provider hooks">
      OpenClaw はモデル/プロバイダー Plugin に対して、おおよそこの順序でフックを呼び出します。
      ほとんどのプロバイダーが使うのは 2〜3 個だけです。これは完全な `ProviderPlugin`
      契約ではありません。完全かつ現時点で正確なフック一覧とフォールバックの注記については、[内部: プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がもう呼び出さない互換性専用のプロバイダーフィールドは、ここには記載していません。

      | フック | 使用するタイミング |
      | --- | --- |
      | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | `applyConfigDefaults` | 設定の具体化中の、プロバイダー所有のグローバルデフォルト |
      | `normalizeModelId` | 検索前のレガシー/プレビューモデル ID エイリアスのクリーンアップ |
      | `normalizeTransport` | 汎用モデル組み立て前の、プロバイダーファミリーの `api` / `baseUrl` クリーンアップ |
      | `normalizeConfig` | `models.providers.<id>` 設定の正規化 |
      | `applyNativeStreamingUsageCompat` | 設定プロバイダー向けのネイティブストリーミング使用量互換の書き換え |
      | `resolveConfigApiKey` | プロバイダー所有の env マーカー認証解決 |
      | `resolveSyntheticAuth` | ローカル/セルフホスト、または設定に基づく合成認証 |
      | `resolveExternalAuthProfiles` | CLI/アプリ管理の認証情報に対して、プロバイダー所有の外部認証プロファイルを重ねる |
      | `shouldDeferSyntheticProfileAuth` | env/設定認証の背後にある合成保存プロファイルのプレースホルダーを下げる |
      | `resolveDynamicModel` | 任意の上流モデル ID を受け入れる |
      | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | `normalizeResolvedModel` | ランナー前のトランスポート書き換え |
      | `normalizeToolSchemas` | 登録前の、プロバイダー所有のツールスキーマクリーンアップ |
      | `inspectToolSchemas` | プロバイダー所有のツールスキーマ診断 |
      | `resolveReasoningOutputMode` | タグ付き reasoning 出力とネイティブ reasoning 出力の契約 |
      | `prepareExtraParams` | デフォルトのリクエストパラメーター |
      | `createStreamFn` | 完全カスタムの StreamFn トランスポート |
      | `wrapStreamFn` | 通常のストリーム経路上のカスタムヘッダー/本文ラッパー |
      | `resolveTransportTurnState` | ネイティブのターン単位ヘッダー/メタデータ |
      | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | `formatApiKey` | カスタムランタイムトークン形状 |
      | `refreshOAuth` | カスタム OAuth 更新 |
      | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | `isCacheTtlEligible` | プロンプトキャッシュ TTL のゲート |
      | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | `augmentModelCatalog` | 合成の前方互換行（非推奨 - `registerModelCatalogProvider` を推奨） |
      | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | `isBinaryThinking` | バイナリ thinking のオン/オフ互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `supportsXHighThinking` | `xhigh` reasoning サポート互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `resolveDefaultThinkingLevel` | デフォルトの `/think` ポリシー互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `isModernModelRef` | ライブ/スモークモデルのマッチング |
      | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | `createEmbeddingProvider` | メモリ/検索向けの、プロバイダー所有 embedding アダプター |
      | `buildReplayPolicy` | カスタムのトランスクリプト再生/Compaction ポリシー |
      | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有の再生書き換え |
      | `validateReplayTurns` | 埋め込みランナー前の厳格な再生ターン検証 |
      | `onModelSelected` | 選択後コールバック（例: テレメトリ） |

      ランタイムフォールバックの注記:

      - `normalizeConfig` はプロバイダー ID ごとに 1 つの所有 Plugin（まずバンドルプロバイダー、次に一致したランタイム Plugin）を解決し、そのフックだけを呼び出します。他のプロバイダーを横断してスキャンすることはありません。`google` / `google-vertex` / `google-antigravity` の設定エントリを正規化するのは Google 自身の `normalizeConfig` フックであり、別個のコアフォールバックではありません。
      - `resolveConfigApiKey` は公開されている場合、プロバイダーフックを使用します。Amazon Bedrock は AWS env マーカー解決をそのプロバイダー Plugin に保持します。ランタイム認証自体は、`auth: "aws-sdk"` で設定されている場合、引き続き AWS SDK のデフォルトチェーンを使用します。
      - `resolveThinkingProfile(ctx)` は、選択された `provider`、`modelId`、任意でマージされた `reasoning` カタログヒント、任意でマージされたモデル `compat` ファクトを受け取ります。`compat` は、プロバイダーの thinking UI/プロファイルを選択するためだけに使用してください。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュを考慮したシステムプロンプトガイダンスを注入できます。その振る舞いが 1 つのプロバイダー/モデルファミリーに属し、安定キャッシュと動的キャッシュの分割を保持すべき場合は、レガシーな Plugin 全体の `before_prompt_build` フックよりもこれを優先してください。

    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### ステップ 5: 追加機能を追加する

    プロバイダー Plugin は、テキスト推論と並行して、embedding、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索を登録できます。OpenClaw はこれを **ハイブリッド機能** Plugin として分類します。これは企業 Plugin（ベンダーごとに 1 つの Plugin）に推奨されるパターンです。
    [内部: 機能の所有権](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各機能を `register(api)` 内で登録します。必要なタブだけを選択してください:

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

        プロバイダー HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用してください。これにより Plugin 間で、上限付きのエラー本文読み取り、JSON エラー解析、リクエスト ID サフィックスを共有できます。
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。この共有ヘルパーは、プロキシキャプチャ、再接続バックオフ、クローズ時のフラッシュ、ready ハンドシェイク、音声キューイング、クローズイベント診断を処理します。Plugin は上流イベントをマッピングするだけです。

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
        `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーは、
        互換性のある文字起こし API に M4A 形式のファイル名が必要な AAC アップロードを含め、
        アップロードファイル名を正規化します。
      </Tab>
      <Tab title="リアルタイム音声">
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

        `talk.catalog` が有効なモード、トランスポート、音声形式、機能フラグを
        ブラウザーおよびネイティブの Talk クライアントに公開できるように、
        `capabilities` を宣言します。トランスポートが、人間がアシスタントの再生を
        中断していることを検出でき、プロバイダーがアクティブな音声応答の切り詰め
        または消去に対応している場合は、`handleBargeIn` を実装します。
      </Tab>
      <Tab title="メディア理解">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```

        認証情報を意図的に必要としないローカルまたはセルフホストのメディアプロバイダーは、
        `resolveAuth` を公開し、`kind: "none"` を返すことができます。
        OpenClaw は、明示的にオプトインしていないプロバイダーについては、
        通常の認証ゲートを維持します。既存のプロバイダーは引き続き `req.apiKey` を
        読み取れます。新しいプロバイダーでは `req.auth` を優先してください。

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
      <Tab title="埋め込み">
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

        `contracts.embeddingProviders` に同じ ID を宣言します。これは、
        メモリ検索を含む再利用可能なベクトル生成のための汎用埋め込みコントラクトです。
        `registerMemoryEmbeddingProvider(...)` は、既存のメモリ専用アダプター向けの
        非推奨の互換機能です。
      </Tab>
      <Tab title="画像と動画の生成">
        画像および動画機能は、**モード対応**の形状を使用します。画像プロバイダーは、
        必須の `generate` および `edit` 機能ブロックを宣言します。
        動画プロバイダーは、`generate`、`imageToVideo`、および
        `videoToVideo` を宣言します。`maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` のようなフラットな集約フィールドだけでは、
        変換モードのサポートや無効化されたモードを明確に公開するには不十分です。
        音楽生成も同じ `generate` / `edit` パターンに従います。

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

        両方のプロバイダー種別で `capabilities` は必須です。`edit` と
        動画変換ブロック（`imageToVideo`、`videoToVideo`）には、常に
        明示的な `enabled` フラグが必要です。
      </Tab>
      <Tab title="Web 取得と検索">
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

        どちらのプロバイダー種別も、同じ認証情報配線の形状を共有します。
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue`、および `createTool` は
        すべて必須です。
      </Tab>
    </Tabs>

  </Step>

  <Step title="テスト">
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

プロバイダー Plugin は、他の外部コード Plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` は、Plugin パッケージではなく Skills フォルダーを
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

## カタログ順序リファレンス

`catalog.order` は、組み込みプロバイダーに対してカタログがいつマージされるかを制御します。

| 順序      | タイミング     | ユースケース                                    |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス     | 単純な API キーのプロバイダー                  |
| `profile` | simple の後   | 認証プロファイルでゲートされるプロバイダー     |
| `paired`  | profile の後  | 複数の関連エントリを合成する                   |
| `late`    | 最後のパス     | 既存のプロバイダーを上書きする（衝突時に優先） |

## 次のステップ

- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - Plugin がチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパス import リファレンス
- [Plugin 内部](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細とバンドル例

## 関連

- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [チャンネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)

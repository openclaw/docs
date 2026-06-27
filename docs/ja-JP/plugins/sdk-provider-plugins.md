---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenAI 互換プロキシまたはカスタム LLM を OpenClaw に追加したい
    - |-
      OpenClaw Docs i18n 入力
      プロバイダー認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw のモデルプロバイダー Plugin を構築するためのステップバイステップガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-06-27T12:33:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

このガイドでは、モデルプロバイダー (LLM) を OpenClaw に追加する provider plugin の構築手順を説明します。最後まで進めると、モデルカタログ、API キー認証、動的モデル解決を備えた provider が完成します。

<Info>
  OpenClaw plugin をまだ作成したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  Provider plugins は OpenClaw の通常の推論ループにモデルを追加します。モデルが、スレッド、Compaction、またはツールイベントを所有するネイティブ agent daemon 経由で実行される必要がある場合は、daemon protocol の詳細を core に入れるのではなく、provider を [agent harness](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## 手順

<Steps>
  <Step title="パッケージとマニフェスト">
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

    マニフェストでは `setup.providers[].envVars` を宣言し、OpenClaw が plugin runtime を読み込まずに認証情報を検出できるようにします。provider のバリアントが別の provider id の認証を再利用する必要がある場合は、`providerAuthAliases` を追加してください。`modelSupport` は任意で、runtime hook が存在する前に、`acme-large` のような短縮形の model id から OpenClaw が provider plugin を自動読み込みできるようにします。provider を ClawHub で公開する場合、`package.json` ではこれらの `openclaw.compat` および `openclaw.build` フィールドが必須です。

  </Step>

  <Step title="provider を登録する">
    最小限の text provider には、`id`、`label`、`auth`、`catalog` が必要です。`catalog` は provider が所有する runtime/config hook です。ライブのベンダー API を呼び出し、`models.providers` エントリを返すことができます。

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

    `registerModelCatalogProvider` は、list/help/picker UI 向けの新しい control-plane catalog surface です。text、image-generation、video-generation、music-generation の行に使用してください。ベンダーエンドポイント呼び出しとレスポンスのマッピングは plugin 内に保持します。OpenClaw は、共有の行の形、source ラベル、help rendering を所有します。

    これで動作する provider になります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    ### ライブモデル検出

    provider が `/models` 形式の API を公開している場合は、provider 固有のエンドポイントと行の射影を plugin 内に保持し、共有 fetch lifecycle には `openclaw/plugin-sdk/provider-catalog-live-runtime` を使用してください。このヘルパーは、provider policy を OpenClaw core に入れることなく、保護された HTTP fetch、provider-auth ヘッダー、構造化 HTTP エラー、TTL キャッシュ、静的フォールバック動作を提供します。

    ライブ API が、provider 所有の静的カタログ行のうち現在利用可能なものだけを返す場合は、`buildLiveModelProviderConfig` を使用します。

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

    provider API がより豊富なメタデータを返し、plugin が行を OpenClaw のモデル定義に自分で射影する必要がある場合は、`getCachedLiveProviderModelRows` を使用します。

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

    `run` は認証で保護されたままにし、利用可能な認証情報がない場合は `null` を返す必要があります。setup、docs、tests、picker surfaces がライブネットワークアクセスに依存しないように、オフラインの `staticRun` または静的フォールバックを保持してください。モデル一覧の鮮度に適した TTL を使用し、リクエスト時のファイルシステムポーリングを避け、upstream レスポンスが OpenAI 互換の `{ data: [{ id, object }] }` 形でない場合にのみ、provider 固有の `readRows` / `readModelId` を渡してください。

    upstream provider が OpenClaw と異なる control token を使用する場合は、ストリームパスを置き換えるのではなく、小さな双方向テキスト変換を追加します。

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

    `input` は、transport の前に最終的な system prompt と text message content を書き換えます。`output` は、OpenClaw が自身の control marker を解析する前、または channel delivery の前に、assistant text delta と最終 text を書き換えます。

    API-key 認証と単一の catalog-backed runtime を備えた text provider を 1 つだけ登録する bundled provider では、より狭い
    `defineSingleProviderPluginEntry(...)` ヘルパーを優先してください。

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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使われるライブカタログパスです。プロバイダー固有の探索を実行する場合があります。`buildStaticProvider` は、認証が構成される前に表示しても安全なオフライン行にのみ使用してください。認証情報を要求したり、ネットワークリクエストを行ったりしてはいけません。OpenClaw の `models list --all` 表示は現在、バンドル済みプロバイダー Plugin に対してのみ、空の設定、空の環境、エージェント/ワークスペースパスなしで静的カタログを実行します。

    認証フローでオンボーディング中に `models.providers.*`、エイリアス、エージェントのデフォルトモデルもパッチする必要がある場合は、`openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も対象範囲の狭いヘルパーは、`createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)`、`createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` トランスポートでストリーミング使用量ブロックをサポートする場合は、プロバイダー ID チェックをハードコードする代わりに、`openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と `applyProviderNativeStreamingUsageCompat(...)` はエンドポイント機能マップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使っている場合でも、ネイティブの Moonshot/DashScope スタイルのエンドポイントは引き続きオプトインします。

    上記のライブ探索例は、`/models` スタイルのプロバイダー API を対象としています。その探索は `catalog.run` 内に置き、使用可能な認証でゲートし、オフラインカタログ生成用の `staticRun` はネットワークなしにしてください。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデル ID を受け付ける場合（プロキシやルーターなど）は、`resolveDynamicModel` を追加します。

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップ用に `prepareDynamicModel` を使用してください。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーに必要なのは `catalog` + `resolveDynamicModel` だけです。プロバイダーが必要とする範囲でフックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的なリプレイ/ツール互換ファミリーをカバーしているため、Plugin が各フックを 1 つずつ手動で配線する必要は通常ありません。

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

    現在利用可能なリプレイファミリー:

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | ツール呼び出し ID のサニタイズ、assistant-first の順序修正、トランスポートが必要とする場合の汎用 Gemini ターン検証を含む、OpenAI 互換トランスポート向けの共有 OpenAI スタイルリプレイポリシー | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応リプレイポリシー。これにより、Anthropic メッセージトランスポートは、解決されたモデルが実際に Claude ID の場合にのみ Claude 固有の思考ブロッククリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini リプレイポリシーとブートストラップリプレイのサニタイズ。共有ファミリーは、テキスト出力の Gemini CLI をタグ付き reasoning に維持します。直接の `google` プロバイダーは、Gemini API の思考がネイティブ thought parts として到着するため、`resolveReasoningOutputMode` を `native` にオーバーライドします。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシトランスポート経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini リプレイ検証やブートストラップの書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic メッセージと OpenAI 互換モデルのサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。オプションの Claude 限定思考ブロック削除は Anthropic 側に限定されます | `minimax` |

    現在利用可能なストリームファミリー:

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上の Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上の Kilo reasoning ラッパー。`kilo/auto` と未サポートのプロキシ reasoning ID では注入された thinking をスキップします | `kilocode` |
    | `moonshot-thinking` | 設定 + `/think` レベルからの Moonshot バイナリネイティブ thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上の MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: 帰属ヘッダー、`/fast`/`serviceTier`、テキストの詳細度、ネイティブ Codex Web 検索、reasoning 互換ペイロード整形、Responses コンテキスト管理 | `openai` |
    | `openrouter-thinking` | プロキシルート向け OpenRouter reasoning ラッパー。未サポートモデル/`auto` のスキップは中央で処理されます | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限りツールストリーミングを望む Z.AI のようなプロバイダー向けの、デフォルトオンの `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK シーム">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini リプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）とエンドポイント/モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking プリフィルクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、プレーンテキストツール呼び出し互換（`createPlainTextToolCallCompatWrapper`）、共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - ホットなプロバイダーパス向けの軽量ペイロードおよびイベントラッパー。`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)`、`setQwenChatTemplateThinking(...)` を含みます。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`、および基盤となるプロバイダースキーマヘルパー。

      Gemini ファミリーのプロバイダーでは、reasoning 出力モードをトランスポートに合わせてください。直接の Google Gemini API プロバイダーは `native` reasoning 出力を使用し、OpenClaw が `<think>` / `<final>` プロンプトディレクティブを追加せずにネイティブ thought parts を消費できるようにする必要があります。最終的な JSON/テキスト応答を解析するテキスト専用の Gemini CLI スタイルバックエンドは、共有 `google-gemini` タグ付き契約を維持できます。

      一部のストリームヘルパーは意図的にプロバイダー内に留まります。`@openclaw/anthropic-provider` は、Claude OAuth ベータ処理と `context1m` ゲーティングをエンコードしているため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および低レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` シームに保持しています。xAI Plugin も同様に、ネイティブ xAI Responses 整形を自身の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未サポート strict-tool クリーンアップ、xAI 固有の reasoning ペイロード削除）に保持しています。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーとオンボーディング/設定ヘルパー）も支えています。
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
        カスタムリクエストヘッダーや本文の変更が必要なプロバイダーの場合:

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
        汎用 HTTP または WebSocket トランスポート上でネイティブのリクエスト/セッションヘッダーやメタデータが必要なプロバイダーの場合:

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
      <Tab title="使用量と請求">
        使用量/請求データを公開するプロバイダーの場合:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` には 3 つの結果があります。プロバイダーに使用量/請求の認証情報がある場合は `{ token, accountId? }` を返します。プロバイダーが使用量認証を確実に処理したものの、使用可能な使用量トークンがなく、OpenClaw が汎用 API キー/OAuth フォールバックをスキップする必要がある場合にのみ、`{ handled: true }` を返します。プロバイダーがリクエストを処理しておらず、OpenClaw が汎用フォールバックを続行すべき場合は、`null` または `undefined` を返します。
      </Tab>
    </Tabs>

    <Accordion title="利用可能なすべてのプロバイダーフック">
      OpenClaw はこの順序でフックを呼び出します。ほとんどのプロバイダーが使うのは 2-3 個だけです:
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドは、ここには記載していません。

      | # | フック | 使用する場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | 2 | `applyConfigDefaults` | config 具体化中のプロバイダー所有のグローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデル ID エイリアスの整理 |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` の整理 |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config プロバイダー向けのネイティブストリーミング使用量互換の書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の env マーカー認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config バックの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config 認証の背後に合成保存プロファイルプレースホルダーを下げる |
      | 10 | `resolveDynamicModel` | 任意の上流モデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | ランナー前のトランスポート書き換え |
      | 13 | `normalizeToolSchemas` | 登録前のプロバイダー所有ツールスキーマ整理 |
      | 14 | `inspectToolSchemas` | プロバイダー所有ツールスキーマ診断 |
      | 15 | `resolveReasoningOutputMode` | タグ付き vs ネイティブ推論出力契約 |
      | 16 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 17 | `createStreamFn` | 完全カスタム StreamFn トランスポート |
      | 19 | `wrapStreamFn` | 通常のストリーム経路でのカスタムヘッダー/ボディラッパー |
      | 20 | `resolveTransportTurnState` | ネイティブのターンごとのヘッダー/メタデータ |
      | 21 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 22 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 23 | `refreshOAuth` | カスタム OAuth 更新 |
      | 24 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 25 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 26 | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | 27 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 28 | `buildMissingAuthMessage` | カスタム認証不足ヒント |
      | 29 | `augmentModelCatalog` | 合成前方互換行 |
      | 30 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 31 | `isBinaryThinking` | バイナリ thinking オン/オフ互換性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 33 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 34 | `isModernModelRef` | ライブ/スモークモデル照合 |
      | 35 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 36 | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | 37 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 38 | `createEmbeddingProvider` | memory/search 向けのプロバイダー所有 embedding アダプター |
      | 39 | `buildReplayPolicy` | カスタムトランスクリプト replay/compaction ポリシー |
      | 40 | `sanitizeReplayHistory` | 汎用整理後のプロバイダー固有 replay 書き換え |
      | 41 | `validateReplayTurns` | 埋め込みランナー前の厳密な replay ターン検証 |
      | 42 | `onModelSelected` | 選択後コールバック (例: テレメトリ) |

      ランタイムフォールバックに関する注記:

      - `normalizeConfig` は最初に一致したプロバイダーを確認し、その後、実際に config を変更するものが見つかるまで、他のフック対応プロバイダープラグインを確認します。サポートされている Google ファミリー config エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google config ノーマライザーが適用されます。
      - `resolveConfigApiKey` は、公開されている場合はプロバイダーフックを使用します。Amazon Bedrock は AWS env マーカー解決を自身のプロバイダープラグイン内に保持します。ランタイム認証自体は、`auth: "aws-sdk"` で構成されている場合、引き続き AWS SDK のデフォルトチェーンを使用します。
      - `resolveThinkingProfile(ctx)` は、選択された `provider`、`modelId`、任意のマージ済み `reasoning` カタログヒント、任意のマージ済みモデル `compat` facts を受け取ります。`compat` は、そのプロバイダーの thinking UI/profile を選択するためにのみ使用してください。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュ対応のシステムプロンプトガイダンスを注入できます。動作が 1 つのプロバイダー/モデルファミリーに属し、stable/dynamic キャッシュ分割を維持すべき場合は、`before_prompt_build` よりもこれを優先してください。

      詳細な説明と実例については、[内部構造: プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する (任意)">
    ### ステップ 5: 追加機能を追加する

    プロバイダープラグインは、テキスト推論と並行して、embeddings、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web search を登録できます。OpenClaw はこれを **hybrid-capability** プラグインとして分類します。これは企業プラグイン (ベンダーごとに 1 つのプラグイン) に推奨されるパターンです。[内部構造: 機能の所有権](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、`register(api)` 内で各機能を登録します。必要なタブだけを選んでください:

    <Tabs>
      <Tab title="音声 (TTS)">
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

        プロバイダー HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用してください。これにより、プラグイン間で上限付きのエラーボディ読み取り、JSON エラー解析、request-id サフィックスを共有できます。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。この共有ヘルパーは、プロキシキャプチャ、再接続バックオフ、クローズ時フラッシュ、ready ハンドシェイク、音声キューイング、close-event 診断を処理します。プラグイン側では上流イベントをマッピングするだけです。

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

        multipart 音声を POST するバッチ STT プロバイダーは、`openclaw/plugin-sdk/provider-http` の `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーは、互換性のある文字起こし API 向けに M4A 形式のファイル名が必要な AAC アップロードを含め、アップロードファイル名を正規化します。
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

        `capabilities` を宣言して、`talk.catalog` が有効なモード、
        トランスポート、音声形式、機能フラグをブラウザーおよびネイティブの Talk
        クライアントに公開できるようにします。トランスポートが、人間がアシスタントの再生に割り込んでいることを検出でき、プロバイダーがアクティブな音声応答の切り詰めまたはクリアをサポートしている場合は、`handleBargeIn` を実装します。
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

        認証情報を意図的に要求しないローカルまたはセルフホストのメディアプロバイダーは、
        `resolveAuth` を公開し、`kind: "none"` を返せます。
        OpenClaw は、明示的にオプトインしないプロバイダーについては通常の認証ゲートを維持します。既存のプロバイダーは `req.apiKey` を読み続けられます。
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

        `contracts.embeddingProviders` で同じ id を宣言します。これは、
        メモリ検索を含む、再利用可能なベクトル生成のための汎用埋め込みコントラクトです。
        `registerMemoryEmbeddingProvider(...)` は、既存のメモリ専用アダプター向けの非推奨の互換機能です。
      </Tab>
      <Tab title="画像と動画の生成">
        動画機能は **モード対応** の形状を使用します: `generate`、
        `imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のようなフラットな集約フィールドだけでは、
        変換モードのサポートや無効化されたモードを明確に公開するには不十分です。
        音楽生成も同じパターンに従い、明示的な `generate` /
        `edit` ブロックを使用します。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
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
      </Tab>
      <Tab title="Webフェッチと検索">
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
          search: async (req) => ({ content: [] }),
        });
        ```
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

プロバイダーPluginは、他の外部コードPluginと同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来のスキル専用の公開エイリアスを使用しないでください。Pluginパッケージでは
`clawhub package publish` を使用してください。

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

`catalog.order` は、組み込みプロバイダーに対してカタログがいつマージされるかを制御します:

| 順序      | タイミング    | ユースケース                                    |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キープロバイダー                    |
| `profile` | simple の後   | 認証プロファイルに基づいてゲートされるプロバイダー |
| `paired`  | profile の後  | 複数の関連エントリを合成                       |
| `late`    | 最後のパス    | 既存のプロバイダーを上書き（衝突時に優先）     |

## 次のステップ

- [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins) - Pluginがチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [Plugin 内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細とバンドル例

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [チャンネルPluginの構築](/ja-JP/plugins/sdk-channel-plugins)

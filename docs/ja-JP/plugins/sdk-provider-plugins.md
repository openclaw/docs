---
read_when:
    - |-
      新しいモデルプロバイダPluginを作成しているがお送assistant to=functions.read in commentary  微信天天彩票-json
      {"path":"docs/plugins/sdk-provider-plugins.md","offset":1,"limit":400}
    - OpenAI互換proxyまたはカスタムLLMをOpenClawに追加したい
    - プロバイダ認証、カタログ、ランタイムフックを理解する必要がある
sidebarTitle: Provider plugins
summary: OpenClaw用のモデルプロバイダPluginを作成するためのステップバイステップガイド
title: プロバイダPluginの作成
x-i18n:
    generated_at: "2026-04-24T05:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

このガイドでは、OpenClawにモデルプロバイダ
（LLM）を追加するプロバイダPluginの作成手順を説明します。最後には、モデルカタログ、
API key認証、動的モデル解決を備えたプロバイダが完成します。

<Info>
  これまでにOpenClaw Pluginを一度も作成したことがない場合は、まず
  [はじめに](/ja-JP/plugins/building-plugins) を読んで、基本的なパッケージ
  構造とmanifest設定を確認してください。
</Info>

<Tip>
  プロバイダPluginは、OpenClawの通常の推論ループにモデルを追加します。モデルが
  スレッド、Compaction、またはツールイベントを所有するネイティブagent daemon経由で実行される必要がある場合は、
  daemonプロトコルの詳細をコアに入れるのではなく、プロバイダを
  [agentハーネス](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## 手順

<Steps>
  <Step title="パッケージとmanifest">
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
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
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

    manifestでは `providerAuthEnvVars` を宣言し、OpenClawが
    Pluginランタイムを読み込まずに認証情報を検出できるようにします。あるprovider variantが別のprovider idの認証を再利用すべき場合は
    `providerAuthAliases` を追加してください。`modelSupport`
    は任意で、`acme-large` のような短縮モデルidから、ランタイムフックが存在する前にOpenClawが自動的にあなたのプロバイダPluginを読み込めるようにします。プロバイダをClawHubで公開する場合、
    これらの `package.json` 内の `openclaw.compat` と `openclaw.build` フィールドは必須です。

  </Step>

  <Step title="プロバイダを登録する">
    最小限のプロバイダに必要なのは `id`、`label`、`auth`、`catalog` です:

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
      },
    });
    ```

    これで動作するプロバイダになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    上流プロバイダがOpenClawとは異なる制御トークンを使う場合は、
    ストリーム経路を置き換えるのではなく、小さな双方向テキスト変換を追加してください:

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

    `input` は、最終system promptとテキストメッセージ内容を
    transport前に書き換えます。`output` は、assistantのテキストdeltaと最終テキストを、OpenClawが自身の制御マーカーを解析したりチャネル配信したりする前に書き換えます。

    API-key認証付きの1つのテキストプロバイダと、単一のcatalogバックエンドランタイムだけを登録するバンドル済みプロバイダには、
    より狭い
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

    `buildProvider` は、OpenClawが実際の
    provider authを解決できるときに使われるライブcatalog経路です。provider固有のdiscoveryを行ってもかまいません。
    `buildStaticProvider` は、auth設定前でも安全に表示できるオフライン行にのみ使ってください。
    これは認証情報を必要としたり、ネットワークリクエストを行ったりしてはなりません。
    OpenClawの `models list --all` 表示は現在、
    バンドル済みプロバイダPluginに対してのみstatic catalogを実行し、その際は空のconfig、空のenv、agent/workspace pathなしで実行します。

    認証フローで `models.providers.*`、aliases、エージェントのデフォルトモデルもオンボーディング中にパッチする必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のpreset helperを使ってください。より狭いhelperは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    providerのネイティブendpointが、通常の
    `openai-completions` transport上でstreamed usage blocksをサポートしている場合は、
    provider-idチェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有catalog helperを優先してください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は、endpoint capability mapからサポートを検出するため、
    Pluginがカスタムprovider idを使っていても、ネイティブのMoonshot/DashScopeスタイルendpointは引き続きオプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダが任意のモデルIDを受け付ける場合（proxyやrouterのような場合）は、
    `resolveDynamicModel` を追加します:

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップ用に
    `prepareDynamicModel` を使ってください — 完了後に
    `resolveDynamicModel` が再実行されます。

  </Step>

  <Step title="必要に応じてランタイムフックを追加する">
    ほとんどのプロバイダは `catalog` + `resolveDynamicModel` だけで十分です。プロバイダに必要になったら
    フックを段階的に追加してください。

    共有helper builderは、現在、最も一般的なreplay/tool-compat
    ファミリをカバーしているため、通常はPlugin側で各フックを1つずつ手作業で配線する必要はありません:

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

    現在利用可能なreplayファミリ:

    | ファミリ | 配線されるもの | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI互換transport向けの共有OpenAIスタイルreplayポリシー。tool-call-idのサニタイズ、assistant-first順序修正、そのtransportが必要とする場合の汎用Geminiターン検証を含む | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選ばれるClaude対応replayポリシー。Anthropic-message transportは、解決済みモデルが実際にClaude idのときだけClaude固有のthinking-block cleanupを受ける | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブGemini replayポリシー、bootstrap replay sanitation、tagged reasoning-output mode | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI互換proxy transport経由で動作するGeminiモデル向けのGemini thought-signature sanitation。ネイティブGemini replay検証やbootstrap書き換えは有効にしない | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1つのPlugin内でAnthropic-message面とOpenAI互換モデル面を混在させるプロバイダ向けのハイブリッドポリシー。任意のClaude専用thinking-block削除はAnthropic側に限定される | `minimax` |

    現在利用可能なstreamファミリ:

    | ファミリ | 配線されるもの | バンドル済みの例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリーム経路上のGemini thinkingペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有proxyストリーム経路上のKilo reasoningラッパー。`kilo/auto` と未対応proxy reasoning idでは注入されたthinkingをスキップ | `kilocode` |
    | `moonshot-thinking` | 設定 + `/think` レベルからのMoonshotバイナリnative-thinkingペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリーム経路上のMiniMax fast-modeモデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブOpenAI/Codex Responsesラッパー: attribution headers、`/fast` / `serviceTier`、text verbosity、ネイティブCodex web search、reasoning互換ペイロード整形、Responsesコンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | proxyルート向けOpenRouter reasoningラッパー。未対応モデル / `auto` のスキップを中央で処理 | `openrouter` |
    | `tool-stream-default-on` | Z.AIのように、明示的に無効化されない限りtool streamingを有効にしたいプロバイダ向けのデフォルト有効 `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリbuilderを支えるSDK seam">
      各ファミリbuilderは、同じパッケージからエクスポートされる低レベルの公開helperで構成されています。プロバイダが共通パターンから外れる必要がある場合は、それらを直接使えます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生のreplay builder（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini replay helper（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と、endpoint/model helper（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有OpenAI/Codexラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）と共有proxy/providerラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となるGemini schema helper（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、およびxAI互換helper（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。バンドル済みxAI Pluginは、xAIルールの所有権をプロバイダ側に保つため、これらと `normalizeResolvedModel` + `contributeResolvedModelCompat` を使います。

      一部のstream helperは意図的にprovider-localのままです。`@openclaw/anthropic-provider` は、Claude OAuth beta処理と `context1m` ゲーティングをエンコードしているため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および低レベルのAnthropicラッパーbuilderを、自身の公開 `api.ts` / `contract-api.ts` seam内に保持しています。同様にxAI Pluginも、ネイティブxAI Responses整形を自身の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未対応strict-tool cleanup、xAI固有reasoning-payload削除）内に保持しています。

      同じpackage-rootパターンは、`@openclaw/openai-provider`（provider builder、default-model helper、realtime provider builder）や `@openclaw/openrouter-provider`（provider builder + onboarding/config helper）にも使われています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        推論呼び出し前に毎回トークン交換が必要なプロバイダ向け:

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
        カスタムリクエストヘッダーやボディ変更が必要なプロバイダ向け:

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
      <Tab title="ネイティブtransport identity">
        汎用HTTPまたはWebSocket transport上で、ネイティブのリクエスト/セッションヘッダーまたはメタデータが必要なプロバイダ向け:

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
      <Tab title="使用量と課金">
        使用量/課金データを公開するプロバイダ向け:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="利用可能なすべてのプロバイダフック">
      OpenClawは次の順序でフックを呼びます。ほとんどのプロバイダが使うのは2〜3個だけです:

      | # | フック | 使う場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはbase URLのデフォルト |
      | 2 | `applyConfigDefaults` | config materialization中のプロバイダ所有グローバルデフォルト |
      | 3 | `normalizeModelId` | lookup前のlegacy/preview model-id alias整理 |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のprovider-family `api` / `baseUrl` 整理 |
      | 5 | `normalizeConfig` | `models.providers.<id>` configを正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider向けnative streaming-usage互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダ所有のenv-marker auth解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたはconfigバックエンドのsynthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config authの背後にsynthetic stored-profile placeholderを下げる |
      | 10 | `resolveDynamicModel` | 任意の上流モデルIDを受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner前のtransport書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換transport配下にあるvendor model向けcompat flags |
      | 14 | `capabilities` | legacyな静的capability bag。互換性用のみ |
      | 15 | `normalizeToolSchemas` | 登録前のプロバイダ所有tool-schema整理 |
      | 16 | `inspectToolSchemas` | プロバイダ所有tool-schema診断 |
      | 17 | `resolveReasoningOutputMode` | tagged vs native reasoning-output契約 |
      | 18 | `prepareExtraParams` | デフォルトのリクエストparams |
      | 19 | `createStreamFn` | 完全カスタムのStreamFn transport |
      | 20 | `wrapStreamFn` | 通常のstream path上でのカスタムヘッダー/ボディラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブのターン単位ヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/cool-down |
      | 23 | `formatApiKey` | カスタムランタイムtoken形式 |
      | 24 | `refreshOAuth` | カスタムOAuth更新 |
      | 25 | `buildAuthDoctorHint` | auth修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダ所有のoverflow検出 |
      | 27 | `classifyFailoverReason` | プロバイダ所有のrate-limit/overload分類 |
      | 28 | `isCacheTtlEligible` | prompt cache TTLゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタムmissing-authヒント |
      | 30 | `suppressBuiltInModel` | 古い上流行を非表示にする |
      | 31 | `augmentModelCatalog` | syntheticなforward-compat行 |
      | 32 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 33 | `isBinaryThinking` | バイナリthinking on/off互換性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoningサポート互換性 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 36 | `isModernModelRef` | live/smokeモデル一致 |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報パース |
      | 39 | `fetchUsageSnapshot` | カスタム使用量endpoint |
      | 40 | `createEmbeddingProvider` | memory/search向けプロバイダ所有embedding adapter |
      | 41 | `buildReplayPolicy` | カスタムtranscript replay/Compactionポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用cleanup後のプロバイダ固有replay書き換え |
      | 43 | `validateReplayTurns` | 埋め込みrunner前の厳格なreplay-turn検証 |
      | 44 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      ランタイムフォールバックに関する注記:

      - `normalizeConfig` は、最初に一致したプロバイダを確認し、その後、実際にconfigを変更するまで、他のhook-capable provider Pluginを確認します。どのprovider hookもサポート対象のGoogle-family configエントリを書き換えなかった場合、バンドル済みGoogle config normalizerが引き続き適用されます。
      - `resolveConfigApiKey` は、公開されていればprovider hookを使います。バンドル済みの `amazon-bedrock` 経路は、Bedrockランタイムauth自体は依然としてAWS SDK default chainを使うにもかかわらず、ここに組み込みのAWS env-marker resolverも持っています。
      - `resolveSystemPromptContribution` を使うと、プロバイダはモデルファミリ向けにcache-aware system-promptガイダンスを注入できます。ある振る舞いが1つのprovider/model familyに属し、stable/dynamic cache分割を維持すべき場合は、`before_prompt_build` よりこれを優先してください。

      詳細な説明と実例については、[Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加capabilityを加える（任意）">
    プロバイダPluginは、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム
    音声、メディア理解、画像生成、動画生成、Web fetch、
    Web searchを登録できます。OpenClawはこれを
    **hybrid-capability** Pluginとして分類します — 企業Plugin向けの推奨パターンです
    （ベンダーごとに1Plugin）。参照:
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)。

    各capabilityは、既存の
    `api.registerProvider(...)` 呼び出しと並べて `register(api)` 内で登録します。必要なタブだけ選んでください:

    <Tabs>
      <Tab title="音声（TTS）">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* PCM data */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください — この共有
        helperは、proxy capture、reconnect backoff、close flush、ready
        handshake、audio queueing、close-event diagnosticsを処理します。Plugin側では
        上流イベントをマッピングするだけです。

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

        multipart音声をPOSTするバッチSTTプロバイダでは、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使ってください。このhelperは
        アップロードファイル名を正規化し、互換性のある文字起こしAPI向けにM4A風ファイル名が必要なAACアップロードも含めて処理します。
      </Tab>
      <Tab title="リアルタイム音声">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
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
      </Tab>
      <Tab title="画像生成と動画生成">
        動画capabilityは **mode-aware** な形を使います:
        `generate`、`imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のような
        フラットな集約フィールドだけでは、transform modeのサポートや無効化されたmodeをきれいに表現するには不十分です。
        音楽生成も同じパターンで、明示的な `generate` /
        `edit` ブロックに従います。

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetchとsearch">
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

## ClawHubに公開する

プロバイダPluginは、他の外部コードPluginと同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来のskill専用公開aliasを使わないでください。plugin packageでは
`clawhub package publish` を使うべきです。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # provider auth metadata を含む Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量endpoint（任意）
```

## catalog順序リファレンス

`catalog.order` は、組み込み
providersに対してあなたのcatalogがいつマージされるかを制御します:

| 順序 | タイミング | ユースケース |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス | 単純なAPI-keyプロバイダ |
| `profile` | simpleの後 | auth profilesでゲートされるプロバイダ |
| `paired`  | profileの後 | 複数の関連エントリを合成する |
| `late`    | 最後のパス | 既存providerを上書きする（衝突時に勝つ） |

## 次のステップ

- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) — Pluginがチャネルも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` helper（TTS、search、subagent）
- [SDK概要](/ja-JP/plugins/sdk-overview) — 完全なsubpath importリファレンス
- [Plugin Internals](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — フック詳細とバンドル済み例

## 関連

- [Plugin SDK setup](/ja-JP/plugins/sdk-setup)
- [Pluginの作成](/ja-JP/plugins/building-plugins)
- [チャネルPluginの作成](/ja-JP/plugins/sdk-channel-plugins)

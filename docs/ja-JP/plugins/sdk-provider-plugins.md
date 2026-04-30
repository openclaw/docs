---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenClawにOpenAI互換プロキシまたはカスタムLLMを追加したい
    - プロバイダー認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw向けモデルプロバイダーPluginの構築手順ガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-04-30T05:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1404594fe1d1e11a612f903512c1002c8f3a804dee53d4204457b534eae93381
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

このガイドでは、モデルプロバイダー (LLM) を OpenClaw に追加するプロバイダー Plugin の構築手順を説明します。最後まで進めると、モデルカタログ、API キー認証、動的モデル解決を備えたプロバイダーが完成します。

<Info>
  これまでに OpenClaw Plugin を構築したことがない場合は、まず基本的なパッケージ構造とマニフェスト設定について
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  プロバイダー Plugin は、OpenClaw の通常の推論ループにモデルを追加します。モデルがスレッド、Compaction、ツールイベントを所有するネイティブエージェントデーモン経由で実行される必要がある場合は、デーモンプロトコルの詳細をコアに入れるのではなく、プロバイダーを [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
  <Step title="Package and manifest">
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

    マニフェストでは `providerAuthEnvVars` を宣言し、OpenClaw が Plugin ランタイムを読み込まずに認証情報を検出できるようにします。プロバイダーのバリアントが別のプロバイダー ID の認証を再利用する必要がある場合は、`providerAuthAliases` を追加します。`modelSupport` は任意で、ランタイムフックが存在する前でも、`acme-large` のような省略形のモデル ID から OpenClaw がプロバイダー Plugin を自動読み込みできるようにします。プロバイダーを ClawHub で公開する場合、`package.json` ではこれらの `openclaw.compat` と `openclaw.build` フィールドが必須です。

  </Step>

  <Step title="Register the provider">
    最小構成のプロバイダーには、`id`、`label`、`auth`、`catalog` が必要です。

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

    これで動作するプロバイダーになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    上流プロバイダーが OpenClaw と異なる制御トークンを使う場合は、ストリーム経路を置き換えるのではなく、小さな双方向テキスト変換を追加してください。

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

    `input` は、転送前に最終システムプロンプトとテキストメッセージの内容を書き換えます。`output` は、OpenClaw が自身の制御マーカーやチャネル配信を解析する前に、アシスタントのテキスト差分と最終テキストを書き換えます。

    API キー認証と単一のカタログベースのランタイムを持つテキストプロバイダーを 1 つだけ登録するバンドル済みプロバイダーでは、より範囲の狭い
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使われるライブカタログ経路です。プロバイダー固有の探索を実行できます。`buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使用してください。認証情報を必要としたり、ネットワークリクエストを行ったりしてはいけません。OpenClaw の `models list --all` 表示は現在、バンドル済みプロバイダー Plugin に対してのみ、空の設定、空の環境、エージェント/ワークスペースパスなしで静的カタログを実行します。

    認証フローで `models.providers.*`、エイリアス、オンボーディング中のエージェントのデフォルトモデルもパッチする必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も範囲の狭いヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` 転送でストリーミング使用量ブロックをサポートしている場合は、プロバイダー ID チェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は、エンドポイント機能マップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使っている場合でも、ネイティブの Moonshot/DashScope スタイルのエンドポイントは引き続きオプトインできます。

  </Step>

  <Step title="Add dynamic model resolution">
    プロバイダーが任意のモデル ID を受け付ける場合 (プロキシやルーターなど) は、
    `resolveDynamicModel` を追加します。

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

    解決にネットワーク呼び出しが必要な場合は、非同期のウォームアップに `prepareDynamicModel` を使ってください。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    ほとんどのプロバイダーでは `catalog` + `resolveDynamicModel` だけで十分です。プロバイダーの要件に応じて、フックを段階的に追加してください。

    共有ヘルパービルダーは、現在では最も一般的なリプレイ/ツール互換ファミリーをカバーしているため、Plugin が各フックを 1 つずつ手作業で配線する必要は通常ありません。

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

    | ファミリー | 配線されるもの | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | ツール呼び出し ID のサニタイズ、アシスタント先頭順序の修正、転送で必要な場合の汎用 Gemini ターン検証を含む、OpenAI 互換転送向けの共有 OpenAI スタイルリプレイポリシー | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応リプレイポリシー。これにより、Anthropic メッセージ転送では、解決済みモデルが実際に Claude ID である場合にのみ Claude 固有の thinking ブロッククリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini リプレイポリシーに加えて、ブートストラップリプレイのサニタイズとタグ付き reasoning 出力モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシ転送経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini リプレイ検証やブートストラップ書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic メッセージと OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 専用 thinking ブロック削除は Anthropic 側にスコープされます | `minimax` |

    現在利用可能なストリームファミリー:

    | ファミリー | 組み込むもの | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパスでの Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパスでの Kilo reasoning ラッパー。`kilo/auto` と未対応のプロキシ reasoning ID では injected thinking をスキップ | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルから Moonshot バイナリ native-thinking ペイロードへのマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパスでの MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト verbosity、ネイティブ Codex Web 検索、reasoning 互換ペイロード整形、Responses コンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート向け OpenRouter reasoning ラッパー。未対応モデル/`auto` のスキップは中央で処理 | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限りツールストリーミングを使いたい Z.AI などのプロバイダー向けのデフォルト有効 `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK の接合点">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`、および生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini リプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`）とエンドポイント/モデルヘルパー（`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`、さらに共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking プリフィルクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`、基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`）、および xAI 互換ヘルパー（`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`）。バンドルされた xAI Plugin は、xAI ルールをプロバイダー所有に保つため、これらとともに `normalizeResolvedModel` + `contributeResolvedModelCompat` を使います。

      一部のストリームヘルパーは、意図的にプロバイダー内に留めています。`@openclaw/anthropic-provider` は、`wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`、および低レベルの Anthropic ラッパービルダーを独自の公開 `api.ts` / `contract-api.ts` 接合点に保持しています。これらは Claude OAuth ベータ処理と `context1m` ゲーティングをエンコードしているためです。xAI Plugin も同様に、ネイティブ xAI Responses 整形を独自の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未対応 strict-tool クリーンアップ、xAI 固有の reasoning ペイロード削除）に保持しています。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーに加えてオンボーディング/config ヘルパー）も支えています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なプロバイダー向け:

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
        カスタムリクエストヘッダーまたは本文の変更が必要なプロバイダー向け:

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
      <Tab title="ネイティブトランスポート識別情報">
        汎用 HTTP または WebSocket トランスポートで、ネイティブリクエスト/セッションヘッダーまたはメタデータが必要なプロバイダー向け:

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
        使用量/課金データを公開するプロバイダー向け:

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

    <Accordion title="利用可能なすべてのプロバイダーフック">
      OpenClaw はこの順序でフックを呼び出します。ほとんどのプロバイダーが使うのは 2〜3 個だけです。
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドはここに記載していません。

      | # | フック | 使用する場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | 2 | `applyConfigDefaults` | config 具体化中のプロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデル ID エイリアスのクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config プロバイダー向けのネイティブ streaming-usage 互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の env-marker 認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config ベースの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config 認証の背後に合成保存プロファイルプレースホルダーを下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリームモデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner 前のトランスポート書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポートの背後にあるベンダーモデル向け互換フラグ |
      | 14 | `normalizeToolSchemas` | 登録前のプロバイダー所有ツールスキーマクリーンアップ |
      | 15 | `inspectToolSchemas` | プロバイダー所有ツールスキーマ診断 |
      | 16 | `resolveReasoningOutputMode` | タグ付き reasoning-output とネイティブ reasoning-output の契約 |
      | 17 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 18 | `createStreamFn` | 完全にカスタムの StreamFn トランスポート |
      | 19 | `wrapStreamFn` | 通常のストリームパス上のカスタムヘッダー/本文ラッパー |
      | 20 | `resolveTransportTurnState` | ネイティブのターンごとのヘッダー/メタデータ |
      | 21 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 22 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 23 | `refreshOAuth` | カスタム OAuth 更新 |
      | 24 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 25 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 26 | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | 27 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 28 | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | 29 | `augmentModelCatalog` | 合成 forward-compat 行 |
      | 30 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 31 | `isBinaryThinking` | バイナリ thinking オン/オフ互換性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 33 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 34 | `isModernModelRef` | ライブ/スモークモデルマッチング |
      | 35 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 36 | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | 37 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 38 | `createEmbeddingProvider` | メモリ/検索向けのプロバイダー所有埋め込みアダプター |
      | 39 | `buildReplayPolicy` | カスタム transcript replay/compaction ポリシー |
      | 40 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有リプレイ書き換え |
      | 41 | `validateReplayTurns` | 埋め込み runner 前の厳密な replay-turn 検証 |
      | 42 | `onModelSelected` | 選択後コールバック（例: テレメトリ） |

      ランタイムフォールバックの注意:

      - `normalizeConfig` はまず一致したプロバイダーを確認し、その後、実際に config を変更するものが見つかるまで、他のフック対応プロバイダー Plugin を確認します。対応 Google ファミリー config エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google config 正規化は適用されます。
      - `resolveConfigApiKey` は公開されている場合、プロバイダーフックを使います。バンドルされた `amazon-bedrock` パスにも、ここに組み込み AWS env-marker リゾルバーがあります。ただし Bedrock ランタイム認証自体は引き続き AWS SDK デフォルトチェーンを使います。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュ対応のシステムプロンプトガイダンスを注入できます。その挙動が 1 つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュ分割を保持すべき場合は、`before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、[内部構造: プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    プロバイダー Plugin は、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Web 取得、Web 検索を登録できます。OpenClaw はこれを **ハイブリッド機能** Plugin として分類します。これは企業 Plugin（ベンダーごとに 1 つの Plugin）に推奨されるパターンです。
    [内部構造: 機能の所有権](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    各機能は、既存の `api.registerProvider(...)` 呼び出しと並べて `register(api)` の中で登録します。必要なタブだけを選んでください:

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

        プロバイダーの HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用し、
        plugins が上限付きのエラー本文読み取り、JSON エラー解析、
        request-id サフィックスを共有できるようにします。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。共有
        ヘルパーがプロキシキャプチャ、再接続バックオフ、close フラッシュ、ready
        ハンドシェイク、音声キューイング、close-event 診断を処理します。plugin
        はアップストリームイベントをマッピングするだけです。

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
        `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーはアップロード
        ファイル名を正規化します。互換性のある文字起こし API のために M4A 形式のファイル名を必要とする
        AAC アップロードも含まれます。
      </Tab>
      <Tab title="リアルタイム音声">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
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
      <Tab title="画像と動画生成">
        動画機能は **mode-aware** な形状を使用します: `generate`、
        `imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のような
        フラットな集約フィールドだけでは、変換モードのサポートや無効化されたモードを
        明確に示すには不十分です。音楽生成も同じパターンに従い、明示的な `generate` /
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
      <Tab title="Web取得と検索">
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

## ClawHub に公開する

プロバイダー plugins は、他の外部コード plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来の Skills 専用公開エイリアスを使用しないでください。plugin パッケージでは
`clawhub package publish` を使用する必要があります。

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

`catalog.order` は、組み込みプロバイダーに対してカタログがマージされるタイミングを制御します。

| 順序      | タイミング    | ユースケース                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キープロバイダー                     |
| `profile` | simple の後   | 認証プロファイルで制限されるプロバイダー        |
| `paired`  | profile の後  | 複数の関連エントリを合成する                    |
| `late`    | 最後のパス    | 既存のプロバイダーを上書きする（衝突時に勝つ）  |

## 次のステップ

- [チャンネル Plugins](/ja-JP/plugins/sdk-channel-plugins) — plugin がチャンネルも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK 概要](/ja-JP/plugins/sdk-overview) — 完全なサブパス import リファレンス
- [Plugin 内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — hook の詳細とバンドル例

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
- [チャンネル plugins の構築](/ja-JP/plugins/sdk-channel-plugins)

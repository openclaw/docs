---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenAI 互換のプロキシまたはカスタム大規模言語モデルを OpenClaw に追加したい場合
    - プロバイダー認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw向けモデルプロバイダーPluginを構築するためのステップバイステップガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-05-10T19:47:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1992653c8c6b079bbb6ea2b4f4b02dbd6a5a8aef286172af8048a7d9a98a8a4
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

このガイドでは、モデルプロバイダー (LLM) を OpenClaw に追加する provider plugin の構築手順を説明します。最後まで進めると、モデルカタログ、APIキー認証、動的モデル解決を備えたプロバイダーができあがります。

<Info>
  まだ OpenClaw plugin を構築したことがない場合は、基本的なパッケージ
  構造とマニフェスト設定について、まず
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  Provider plugins は OpenClaw の通常の推論ループにモデルを追加します。モデルが
  スレッド、Compaction、またはツールイベントを所有するネイティブエージェントデーモン
  経由で実行される必要がある場合は、デーモンプロトコルの詳細をコアに入れるのではなく、
  プロバイダーを [agent harness](/ja-JP/plugins/sdk-agent-harness)
  と組み合わせてください。
</Tip>

## チュートリアル

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

    マニフェストは `providerAuthEnvVars` を宣言することで、OpenClaw が
    Plugin ランタイムを読み込まずに認証情報を検出できるようにします。プロバイダーのバリアントが別のプロバイダー ID の認証を再利用する必要がある場合は、
    `providerAuthAliases` を追加します。`modelSupport`
    は任意で、ランタイムフックが存在する前に `acme-large` のような短縮形の
    モデル ID から OpenClaw が provider plugin を自動読み込みできるようにします。プロバイダーを
    ClawHub で公開する場合、これらの `openclaw.compat` と `openclaw.build` フィールドは
    `package.json` で必須です。

  </Step>

  <Step title="Register the provider">
    最小限のテキストプロバイダーには `id`、`label`、`auth`、`catalog` が必要です。
    `catalog` はプロバイダー所有のランタイム/設定フックです。ライブの
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

    `registerModelCatalogProvider` は、list/help/picker UI 向けの新しいコントロールプレーンのカタログサーフェスです。
    テキスト、画像生成、
    動画生成、音楽生成の行に使ってください。ベンダーエンドポイントの呼び出しと
    レスポンスのマッピングは Plugin 内に保ちます。OpenClaw は共有される行の形、
    ソースラベル、ヘルプ表示を所有します。

    これで動作するプロバイダーになります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    上流プロバイダーが OpenClaw とは異なる制御トークンを使う場合は、ストリームパスを置き換えるのではなく、
    小さな双方向テキスト変換を追加してください。

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

    `input` は転送前に、最終的なシステムプロンプトとテキストメッセージの内容を書き換えます。
    `output` は OpenClaw が自身の制御マーカーやチャンネル配信を解析する前に、
    アシスタントのテキストデルタと最終テキストを書き換えます。

    APIキー認証付きのテキストプロバイダーを 1 つだけ登録し、カタログに基づくランタイムを 1 つだけ持つ
    バンドルプロバイダーでは、より絞り込まれた
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使われるライブカタログパスです。
    プロバイダー固有の検出を実行してもかまいません。
    `buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使ってください。
    認証情報を必要としたり、ネットワークリクエストを行ったりしてはいけません。
    OpenClaw の `models list --all` 表示は現在、空の設定、空の環境、エージェント/ワークスペースパスなしで、
    バンドルされた provider plugins の静的カタログのみを実行します。

    認証フローで `models.providers.*`、エイリアス、オンボーディング中の
    エージェントのデフォルトモデルもパッチする必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使ってください。最も絞り込まれたヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の
    `openai-completions` 転送でストリーミング使用量ブロックをサポートする場合は、プロバイダー ID チェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。
    `supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` は
    エンドポイント能力マップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使っている場合でも、
    ネイティブの Moonshot/DashScope 形式のエンドポイントは引き続きオプトインできます。

  </Step>

  <Step title="Add dynamic model resolution">
    プロバイダーが任意のモデル ID (プロキシやルーターなど) を受け入れる場合は、
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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップに `prepareDynamicModel` を使ってください。
    完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="Add runtime hooks (as needed)">
    ほとんどのプロバイダーに必要なのは `catalog` + `resolveDynamicModel` だけです。プロバイダーで必要になった時点で、
    フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的なリプレイ/ツール互換の
    ファミリーをカバーしているため、通常 Plugin が各フックを 1 つずつ手作業で配線する必要はありません。

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

    | ファミリー | 組み込む内容 | バンドル例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換トランスポート向けの共有 OpenAI 形式リプレイポリシー。ツール呼び出し ID のサニタイズ、assistant-first の順序修正、トランスポートが必要とする場合の汎用 Gemini ターン検証を含む | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応リプレイポリシー。解決済みモデルが実際に Claude ID の場合にのみ、Anthropic-message トランスポートへ Claude 固有の thinking-block クリーンアップを適用する | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini リプレイポリシーに加え、ブートストラップリプレイのサニタイズとタグ付き reasoning-output モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシトランスポート経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini リプレイ検証やブートストラップ書き換えは有効にしない | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic-message と OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 専用 thinking-block ドロップは Anthropic 側に限定される | `minimax` |

    現在利用可能なストリームファミリー:

    | ファミリー | 組み込む内容 | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上での Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上の Kilo reasoning ラッパー。`kilo/auto` と未サポートのプロキシ reasoning ID では injected thinking をスキップする | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルから Moonshot のバイナリネイティブ thinking ペイロードへマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上での MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキストの詳細度、ネイティブ Codex Web 検索、reasoning 互換ペイロード整形、Responses コンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート向け OpenRouter reasoning ラッパー。未サポートモデル/`auto` のスキップは中央で処理される | `openrouter` |
    | `tool-stream-default-on` | Z.AI のように明示的に無効化されない限りツールストリーミングを必要とするプロバイダー向けのデフォルトオン `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK 接点">
      各ファミリービルダーは、同じパッケージからエクスポートされる下位レベルの公開ヘルパーから構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini リプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と、エンドポイント/モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートする。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、加えて共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking プリフィルクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、および基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）。

      一部のストリームヘルパーは意図的にプロバイダー内に留めています。`@openclaw/anthropic-provider` は、Claude OAuth beta 処理と `context1m` ゲーティングを表現するため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` 接点に保持しています。xAI Plugin も同様に、ネイティブ xAI Responses 整形を自身の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未サポート strict-tool クリーンアップ、xAI 固有 reasoning-payload 削除）に保持しています。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダー、およびオンボーディング/config ヘルパー）も支えています。
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
        カスタムリクエストヘッダーやボディ変更が必要なプロバイダー向け:

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
        汎用 HTTP または WebSocket トランスポート上でネイティブリクエスト/セッションヘッダーやメタデータが必要なプロバイダー向け:

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
      OpenClaw はこの順序でフックを呼び出します。ほとんどのプロバイダーが使うのは 2〜3 個だけです:
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が現在は呼び出さない互換性専用のプロバイダーフィールドはここに記載していません。

      | # | フック | 使用する場面 |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはベース URL デフォルト |
      | 2 | `applyConfigDefaults` | config マテリアライズ時のプロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデル ID エイリアスのクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config プロバイダー向けネイティブ streaming-usage 互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有 env-marker auth 解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config auth の背後に synthetic stored-profile プレースホルダーを下げる |
      | 10 | `resolveDynamicModel` | 任意の upstream モデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | ランナー前のトランスポート書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポート背後にあるベンダーモデル用の互換フラグ |
      | 14 | `normalizeToolSchemas` | 登録前のプロバイダー所有ツールスキーマクリーンアップ |
      | 15 | `inspectToolSchemas` | プロバイダー所有ツールスキーマ診断 |
      | 16 | `resolveReasoningOutputMode` | タグ付き vs ネイティブ reasoning-output コントラクト |
      | 17 | `prepareExtraParams` | デフォルトリクエストパラメータ |
      | 18 | `createStreamFn` | 完全にカスタムの StreamFn トランスポート |
      | 19 | `wrapStreamFn` | 通常のストリームパス上のカスタムヘッダー/ボディラッパー |
      | 20 | `resolveTransportTurnState` | ネイティブ per-turn ヘッダー/メタデータ |
      | 21 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 22 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 23 | `refreshOAuth` | カスタム OAuth 更新 |
      | 24 | `buildAuthDoctorHint` | auth 修復ガイダンス |
      | 25 | `matchesContextOverflowError` | プロバイダー所有 overflow 検出 |
      | 26 | `classifyFailoverReason` | プロバイダー所有 rate-limit/overload 分類 |
      | 27 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 28 | `buildMissingAuthMessage` | カスタム missing-auth ヒント |
      | 29 | `augmentModelCatalog` | synthetic forward-compat 行 |
      | 30 | `resolveThinkingProfile` | モデル固有 `/think` オプションセット |
      | 31 | `isBinaryThinking` | バイナリ thinking on/off 互換性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 33 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 34 | `isModernModelRef` | live/smoke モデルマッチング |
      | 35 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 36 | `resolveUsageAuth` | カスタム使用量資格情報の解析 |
      | 37 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 38 | `createEmbeddingProvider` | メモリ/検索向けプロバイダー所有 embedding アダプター |
      | 39 | `buildReplayPolicy` | カスタム transcript リプレイ/Compaction ポリシー |
      | 40 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有リプレイ書き換え |
      | 41 | `validateReplayTurns` | 組み込みランナー前の厳密な replay-turn 検証 |
      | 42 | `onModelSelected` | 選択後コールバック（例: テレメトリ） |

      ランタイムフォールバック注記:

      - `normalizeConfig` はまず一致したプロバイダーを確認し、その後、実際に config を変更するものが見つかるまで他のフック対応プロバイダー Plugin を確認します。サポートされている Google ファミリー config エントリをどのプロバイダーフックも書き換えない場合でも、バンドルされた Google config 正規化は適用されます。
      - `resolveConfigApiKey` は公開されている場合、プロバイダーフックを使用します。バンドルされた `amazon-bedrock` パスにも、ここに組み込み AWS env-marker リゾルバーがありますが、Bedrock ランタイム auth 自体は引き続き AWS SDK のデフォルトチェーンを使用します。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュ対応のシステムプロンプトガイダンスを注入できます。その挙動が 1 つのプロバイダー/モデルファミリーに属し、stable/dynamic キャッシュ分割を維持すべき場合は、`before_prompt_build` よりもこちらを優先してください。

      詳細な説明と実例については、[内部構造: プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    ### ステップ 5: 追加機能を追加する

    プロバイダープラグインは、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム
    音声、メディア理解、画像生成、動画生成、Webフェッチ、
    Web検索を登録できます。OpenClaw はこれを
    **hybrid-capability** プラグインとして分類します。これは企業プラグイン
    （ベンダーごとに1つのプラグイン）に推奨されるパターンです。
    [内部: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各 capability を `register(api)` 内に登録します。必要なタブだけを選んでください。

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

        プロバイダーの HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用してください。
        そうすることで、プラグイン間で、上限付きのエラーボディ読み取り、JSON エラー解析、
        リクエスト ID サフィックスを共有できます。
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。共有
        ヘルパーは、プロキシキャプチャ、再接続バックオフ、クローズ時のフラッシュ、ready
        ハンドシェイク、音声キューイング、クローズイベント診断を処理します。プラグインは
        アップストリームイベントをマッピングするだけです。

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

        マルチパート音声を POST するバッチ STT プロバイダーは、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーはアップロード
        ファイル名を正規化します。互換性のある文字起こし API で M4A 形式のファイル名が必要な
        AAC アップロードも含まれます。
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
        クライアントに公開できます。トランスポートが、人間がアシスタントの再生を中断していることを検出でき、
        プロバイダーがアクティブな音声レスポンスの切り詰めまたはクリアをサポートしている場合は、
        `handleBargeIn` を実装してください。
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
      </Tab>
      <Tab title="Image and video generation">
        動画 capability は **mode-aware** な形状を使用します: `generate`、
        `imageToVideo`、`videoToVideo` です。`maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` のようなフラットな集約フィールドだけでは、
        変換モードのサポートや無効化されたモードを明確に公開するには不十分です。
        音楽生成も同じパターンに従い、明示的な `generate` /
        `edit` ブロックを使います。

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
          search: async (req) => ({ content: [] }),
        });
        ```
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

## ClawHub への公開

プロバイダープラグインは、他の外部コードプラグインと同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来のスキル専用公開エイリアスを使用しないでください。プラグインパッケージは
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

`catalog.order` は、組み込みプロバイダーに対してカタログがいつマージされるかを制御します。

| 順序      | タイミング    | ユースケース                                    |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キープロバイダー                    |
| `profile` | simple の後   | 認証プロファイルで制御されるプロバイダー      |
| `paired`  | profile の後  | 複数の関連エントリを合成する                  |
| `late`    | 最後のパス    | 既存プロバイダーを上書きする（衝突時に優先）  |

## 次のステップ

- [チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins) - プラグインがチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK 概要](/ja-JP/plugins/sdk-overview) - 完全なサブパスインポートリファレンス
- [プラグイン内部](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細とバンドル例

## 関連

- [プラグイン SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [チャンネルプラグインの構築](/ja-JP/plugins/sdk-channel-plugins)

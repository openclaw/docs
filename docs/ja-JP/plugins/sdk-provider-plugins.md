---
read_when:
    - 新しいモデル provider Plugin を構築している場合
    - OpenAI 互換プロキシまたはカスタム LLM を OpenClaw に追加したい場合
    - provider の認証、カタログ、ランタイムフックを理解する必要がある場合
sidebarTitle: Provider Plugins
summary: OpenClaw 用のモデル provider Plugin を構築するためのステップバイステップガイド
title: provider Plugin の構築
x-i18n:
    generated_at: "2026-04-21T13:37:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08494658def4a003a1e5752f68d9232bfbbbf76348cf6f319ea1a6855c2ae439
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# provider Plugin の構築

このガイドでは、OpenClaw にモデル provider（LLM）を追加する provider Plugin の構築手順を説明します。最終的には、モデルカタログ、API キー認証、動的なモデル解決を備えた provider を作成できます。

<Info>
  OpenClaw Plugin をまだ一度も構築したことがない場合は、基本的なパッケージ構造と manifest の設定について、まず
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  provider Plugin は、OpenClaw の通常の推論ループにモデルを追加します。モデルを、スレッド、Compaction、またはツールイベントを所有するネイティブなエージェントデーモン経由で実行する必要がある場合は、デーモンプロトコルの詳細をコアに入れるのではなく、provider を [agent harness](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="パッケージと manifest">
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

    manifest では `providerAuthEnvVars` を宣言し、OpenClaw が Plugin ランタイムを読み込まずに認証情報を検出できるようにします。provider のバリアントで別の provider id の認証を再利用させたい場合は `providerAuthAliases` を追加してください。`modelSupport` は任意で、`acme-large` のような短縮モデル id から、ランタイムフックが存在する前に OpenClaw が provider Plugin を自動ロードできるようにします。provider を ClawHub で公開する場合、これらの `openclaw.compat` と `openclaw.build` のフィールドは `package.json` に必須です。

  </Step>

  <Step title="provider を登録する">
    最小限の provider には、`id`、`label`、`auth`、`catalog` が必要です。

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

    これで動作する provider になります。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>` を実行し、
    `acme-ai/acme-large` をモデルとして選択できるようになります。

    アップストリーム provider が OpenClaw と異なる制御トークンを使う場合は、ストリーム経路を置き換えるのではなく、小さな双方向テキスト変換を追加してください。

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

    `input` は、転送前に最終的なシステムプロンプトとテキストメッセージ内容を書き換えます。`output` は、OpenClaw が自身の制御マーカーやチャネル配信を解析する前に、assistant のテキストデルタと最終テキストを書き換えます。

    API キー認証を持つ 1 つのテキスト provider と、単一の catalog ベースのランタイムだけを登録するバンドル provider では、より限定的な `defineSingleProviderPluginEntry(...)` ヘルパーを使うほうが適しています。

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
        },
      },
    });
    ```

    認証フローで、オンボーディング時に `models.providers.*`、aliases、エージェントのデフォルトモデルも書き換える必要がある場合は、`openclaw/plugin-sdk/provider-onboard` の preset ヘルパーを使ってください。最も限定的なヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、
    `createModelCatalogPresetAppliers(...)` です。

    provider のネイティブ endpoint が、通常の `openai-completions` 転送上でストリーミング usage ブロックをサポートしている場合は、provider-id チェックをハードコードするのではなく、`openclaw/plugin-sdk/provider-catalog-shared` の共有 catalog ヘルパーを使ってください。`supportsNativeStreamingUsageCompat(...)` と `applyProviderNativeStreamingUsageCompat(...)` は endpoint capability map からサポートを検出するため、Plugin がカスタム provider id を使っていても、ネイティブの Moonshot/DashScope スタイル endpoint は引き続きオプトインできます。

  </Step>

  <Step title="動的モデル解決を追加する">
    provider が任意のモデル ID（プロキシやルーターのようなもの）を受け入れる場合は、`resolveDynamicModel` を追加します。

    ```typescript
    api.registerProvider({
      // ... 上記の id、label、auth、catalog

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップのために `prepareDynamicModel` を使ってください。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどの provider に必要なのは `catalog` + `resolveDynamicModel` だけです。provider に必要になった分だけ、段階的にフックを追加してください。

    共有ヘルパービルダーは、現在もっとも一般的な replay/tool-compat 系をカバーしているため、通常 Plugin では各フックを 1 つずつ手動で配線する必要はありません。

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

    | Family | 配線される内容 |
    | --- | --- |
    | `openai-compatible` | OpenAI 互換転送向けの共有 OpenAI スタイル replay ポリシー。ツール呼び出し id のサニタイズ、assistant-first 順序の修正、転送が必要とする場面での汎用 Gemini ターン検証を含みます |
    | `anthropic-by-model` | `modelId` によって選ばれる Claude 対応 replay ポリシー。Anthropic-message 転送では、解決されたモデルが実際に Claude id の場合にのみ、Claude 固有の thinking ブロッククリーンアップが適用されます |
    | `google-gemini` | ネイティブ Gemini replay ポリシーに加えて、bootstrap replay のサニタイズと tagged reasoning-output モード |
    | `passthrough-gemini` | OpenAI 互換プロキシ転送経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic-message と OpenAI 互換のモデル surface を混在させる provider 向けのハイブリッドポリシー。任意の Claude 専用 thinking ブロック削除は Anthropic 側のみに限定されます |

    実際のバンドル例:

    - `google` と `google-gemini-cli`: `google-gemini`
    - `openrouter`、`kilocode`、`opencode`、`opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` と `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai`、`zai`: `openai-compatible`

    現在利用可能な stream ファミリー:

    | Family | 配線される内容 |
    | --- | --- |
    | `google-thinking` | 共有ストリーム経路上での Gemini thinking ペイロード正規化 |
    | `kilocode-thinking` | 共有プロキシストリーム経路上での Kilo reasoning ラッパー。`kilo/auto` と未対応のプロキシ reasoning id では injected thinking をスキップ |
    | `moonshot-thinking` | config + `/think` レベルからの Moonshot バイナリ native-thinking ペイロードマッピング |
    | `minimax-fast-mode` | 共有ストリーム経路上での MiniMax fast-mode モデル書き換え |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution headers、`/fast`/`serviceTier`、text verbosity、ネイティブ Codex web search、reasoning-compat ペイロード整形、Responses コンテキスト管理 |
    | `openrouter-thinking` | プロキシルート向けの OpenRouter reasoning ラッパー。未対応モデル/`auto` のスキップを中央管理 |
    | `tool-stream-default-on` | 明示的に無効化されない限り tool streaming を使いたい Z.AI のような provider 向けのデフォルトオン `tool_stream` ラッパー |

    実際のバンドル例:

    - `google` と `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` と `minimax-portal`: `minimax-fast-mode`
    - `openai` と `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` は、replay-family の enum と、それらのファミリーの構築元である共有ヘルパーもエクスポートします。一般的な公開エクスポートには次が含まれます。

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`、
      `buildAnthropicReplayPolicyForModel(...)`、
      `buildGoogleGeminiReplayPolicy(...)`、
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` などの共有 replay ビルダー
    - `sanitizeGoogleGeminiReplayHistory(...)`
      と `resolveTaggedReasoningOutputMode()` などの Gemini replay ヘルパー
    - `resolveProviderEndpoint(...)`、
      `normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)`、
      `normalizeNativeXaiModelId(...)` などの endpoint/model ヘルパー

    `openclaw/plugin-sdk/provider-stream` は、family builder と、それらのファミリーが再利用する公開ラッパーヘルパーの両方を公開します。一般的な公開エクスポートには次が含まれます。

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - `createOpenAIAttributionHeadersWrapper(...)`、
      `createOpenAIFastModeWrapper(...)`、
      `createOpenAIServiceTierWrapper(...)`、
      `createOpenAIResponsesContextManagementWrapper(...)`、
      `createCodexNativeWebSearchWrapper(...)` などの共有 OpenAI/Codex ラッパー
    - `createOpenRouterWrapper(...)`、
      `createToolStreamWrapper(...)`、`createMinimaxFastModeWrapper(...)` などの共有プロキシ/provider ラッパー

    一部のストリームヘルパーは、意図的に provider ローカルのままになっています。現在のバンドル例: `@openclaw/anthropic-provider` は
    `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、
    `resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および
    より低レベルな Anthropic ラッパービルダーを、その公開 `api.ts` /
    `contract-api.ts` seam からエクスポートしています。これらのヘルパーは、Claude OAuth beta 処理と `context1m` ゲーティングもエンコードしているため、Anthropic 固有のままにされています。

    その他のバンドル provider も、動作をファミリー間できれいに共有できない場合は、転送固有のラッパーをローカルに保持しています。現在の例: バンドルされた xAI Plugin は、ネイティブ xAI Responses の整形を独自の `wrapStreamFn` 内に保持しており、`/fast` alias の書き換え、デフォルトの `tool_stream`、未対応 strict-tool のクリーンアップ、xAI 固有の reasoning-payload 削除などを含みます。

    `openclaw/plugin-sdk/provider-tools` は現在、1 つの共有
    tool-schema ファミリーと、共有 schema/compat ヘルパーを公開しています。

    - `ProviderToolCompatFamily` は、現在の共有ファミリー一覧を文書化します。
    - `buildProviderToolCompatFamilyHooks("gemini")` は、Gemini セーフな tool schema が必要な provider 向けに、Gemini schema のクリーンアップ + diagnostics を配線します。
    - `normalizeGeminiToolSchemas(...)` と `inspectGeminiToolSchemas(...)`
      は、その基盤となる公開 Gemini schema ヘルパーです。
    - `resolveXaiModelCompatPatch()` は、バンドルされた xAI compat patch を返します:
      `toolSchemaProfile: "xai"`、未対応 schema キーワード、ネイティブ
      `web_search` サポート、HTML entity のツール呼び出し引数デコード。
    - `applyXaiModelCompat(model)` は、同じ xAI compat patch を
      解決済みモデルが runner に届く前に適用します。

    実際のバンドル例: xAI Plugin は `normalizeResolvedModel` と
    `contributeResolvedModelCompat` を使い、その compat メタデータを core に xAI ルールをハードコードするのではなく、provider 側の所有に保っています。

    同じ package-root パターンは、他のバンドル provider でも使われています。

    - `@openclaw/openai-provider`: `api.ts` は provider builder、
      default-model ヘルパー、realtime provider builder をエクスポート
    - `@openclaw/openrouter-provider`: `api.ts` は provider builder
      に加えて onboarding/config ヘルパーをエクスポート

    <Tabs>
      <Tab title="トークン交換">
        推論呼び出しごとにトークン交換が必要な provider の場合:

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
        カスタムリクエストヘッダーまたは body の変更が必要な provider の場合:

        ```typescript
        // wrapStreamFn は ctx.streamFn から派生した StreamFn を返す
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
      <Tab title="ネイティブ転送 ID">
        汎用 HTTP または WebSocket 転送で、ネイティブのリクエスト/セッションヘッダーまたはメタデータが必要な provider の場合:

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
        使用量/課金データを公開する provider の場合:

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

    <Accordion title="利用可能なすべての provider hook">
      OpenClaw はこの順序で hook を呼び出します。ほとんどの provider が使うのは 2〜3 個だけです。

      | # | Hook | 使用するタイミング |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたは base URL のデフォルト |
      | 2 | `applyConfigDefaults` | config 実体化中の provider 所有グローバルデフォルト |
      | 3 | `normalizeModelId` | lookup 前の legacy/preview model-id alias クリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前の provider-family `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config を正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider 向けネイティブ streaming-usage compat 書き換え |
      | 7 | `resolveConfigApiKey` | provider 所有の env-marker 認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config ベースの synthetic 認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic の保存済み profile プレースホルダーを env/config 認証より後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリーム model ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner 前の転送書き換え |

    ランタイムフォールバックに関する注意:

    - `normalizeConfig` は、まず一致した provider を確認し、その後、実際に config を変更するものが現れるまで、hook 対応の他の provider Plugin を確認します。
      対応する Google-family config エントリをどの provider hook も書き換えない場合でも、
      バンドルされた Google config normalizer は引き続き適用されます。
    - `resolveConfigApiKey` は、公開されていれば provider hook を使います。バンドルされた
      `amazon-bedrock` 経路には、ここに組み込みの AWS env-marker resolver もありますが、
      Bedrock ランタイム認証自体は依然として AWS SDK のデフォルトチェーンを使います。
      | 13 | `contributeResolvedModelCompat` | 別の互換転送の背後にある vendor モデル向け compat フラグ |
      | 14 | `capabilities` | legacy の静的 capability bag。互換性目的のみ |
      | 15 | `normalizeToolSchemas` | 登録前の provider 所有 tool-schema クリーンアップ |
      | 16 | `inspectToolSchemas` | provider 所有 tool-schema diagnostics |
      | 17 | `resolveReasoningOutputMode` | tagged 対 native の reasoning-output 契約 |
      | 18 | `prepareExtraParams` | デフォルトのリクエストパラメータ |
      | 19 | `createStreamFn` | 完全にカスタムな StreamFn 転送 |
      | 20 | `wrapStreamFn` | 通常ストリーム経路上のカスタムヘッダー/body ラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブのターン単位ヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形式 |
      | 24 | `refreshOAuth` | カスタム OAuth 更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | provider 所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | provider 所有のレート制限/過負荷分類 |
      | 28 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタム未認証ヒント |
      | 30 | `suppressBuiltInModel` | 古くなったアップストリーム行を隠す |
      | 31 | `augmentModelCatalog` | synthetic の forward-compat 行 |
      | 32 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 33 | `isBinaryThinking` | バイナリ thinking オン/オフ互換性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 36 | `isModernModelRef` | live/smoke モデル一致 |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | 39 | `fetchUsageSnapshot` | カスタム使用量 endpoint |
      | 40 | `createEmbeddingProvider` | メモリ/検索向けの provider 所有埋め込みアダプター |
      | 41 | `buildReplayPolicy` | カスタム transcript replay/Compaction ポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後の provider 固有 replay 書き換え |
      | 43 | `validateReplayTurns` | 埋め込み runner 前の厳格な replay-turn 検証 |
      | 44 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      プロンプト調整に関する注意:

      - `resolveSystemPromptContribution` は、provider がモデルファミリー向けに
        キャッシュ対応のシステムプロンプトガイダンスを注入できるようにします。動作が 1 つの provider/モデルファミリーに属し、安定/動的キャッシュ分割を維持すべき場合は、
        `before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、
      [内部: provider ランタイムフック](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    <a id="step-5-add-extra-capabilities"></a>
    provider Plugin は、テキスト推論に加えて、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web search を登録できます。

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw では、これを **hybrid-capability** Plugin と分類します。これは企業向け Plugin に推奨されるパターンです（ベンダーごとに 1 つの Plugin）。詳しくは [内部: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    動画生成では、上に示したモード対応 capability 形状、つまり
    `generate`、`imageToVideo`、`videoToVideo` を優先してください。`maxInputImages`、`maxInputVideos`、`maxDurationSeconds` のようなフラットな集約フィールドだけでは、変換モードのサポートや無効化されたモードを明確に表現するには不十分です。

    音楽生成 provider も同じパターンに従うべきです。
    `generate` はプロンプトのみの生成用、`edit` は参照画像ベースの生成用です。`maxInputImages`、
    `supportsLyrics`、`supportsFormat` のようなフラットな集約フィールドだけでは、edit サポートを表現するには不十分です。明示的な `generate` / `edit` ブロックが期待される契約です。

  </Step>

  <Step title="テスト">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // index.ts または専用ファイルから provider config object を export する
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

provider Plugin は、他の外部コード Plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは、従来の skill 専用 publish alias は使わないでください。Plugin パッケージでは `clawhub package publish` を使うべきです。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # provider auth metadata を含む Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量 endpoint（任意）
```

## catalog 順序リファレンス

`catalog.order` は、組み込み provider に対して catalog がどのタイミングでマージされるかを制御します。

| Order     | タイミング    | ユースケース                                  |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | 最初のパス    | プレーンな API キー provider                  |
| `profile` | simple の後   | 認証 profile によってゲートされる provider    |
| `paired`  | profile の後  | 関連する複数エントリを合成する                |
| `late`    | 最後のパス    | 既存 provider を上書きする（衝突時に優先）    |

## 次のステップ

- [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins) — Plugin がチャネルも提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、search、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Plugin Internals](/ja-JP/plugins/architecture#provider-runtime-hooks) — hook の詳細とバンドル例

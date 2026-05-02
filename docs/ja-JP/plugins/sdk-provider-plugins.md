---
read_when:
    - 新しいモデルプロバイダー Plugin を構築しています
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加したい場合
    - プロバイダー認証、カタログ、ランタイムフックを理解しておく必要があります。
sidebarTitle: Provider plugins
summary: OpenClaw 用のモデルプロバイダープラグインを構築するためのステップバイステップガイド
title: プロバイダーPluginの構築
x-i18n:
    generated_at: "2026-05-02T22:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7cca1dcf2f0a34fd05c696149fef42ff8fecf1ca1fe0ccc63ba96212a9889fe
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw にモデルプロバイダー (LLM) を追加するプロバイダー Plugin の構築手順を説明します。最後まで進めると、モデルカタログ、APIキー認証、動的モデル解決を備えたプロバイダーが完成します。

<Info>
  まだ OpenClaw Plugin を構築したことがない場合は、基本的なパッケージ構造とマニフェスト設定について、先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  プロバイダー Plugin は、OpenClaw の通常の推論ループにモデルを追加します。モデルがスレッド、Compaction、またはツールイベントを所有するネイティブエージェントデーモン経由で実行される必要がある場合は、デーモンプロトコルの詳細を core に入れるのではなく、プロバイダーを [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## ウォークスルー

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

    このマニフェストは `providerAuthEnvVars` を宣言するため、OpenClaw は Plugin ランタイムを読み込まずに認証情報を検出できます。プロバイダーのバリアントが別のプロバイダー ID の認証を再利用する必要がある場合は、`providerAuthAliases` を追加します。`modelSupport` は任意で、ランタイムフックが存在する前に、`acme-large` のような省略形のモデル ID から OpenClaw がプロバイダー Plugin を自動ロードできるようにします。ClawHub でプロバイダーを公開する場合、`package.json` にはこれらの `openclaw.compat` と `openclaw.build` フィールドが必要です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小限のプロバイダーには、`id`、`label`、`auth`、`catalog` が必要です。

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
    モデルとして `acme-ai/acme-large` を選択できるようになります。

    upstream プロバイダーが OpenClaw とは異なる制御トークンを使用する場合は、ストリームパスを置き換えるのではなく、小さな双方向テキスト変換を追加します。

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

    `input` は、transport の前に最終的なシステムプロンプトとテキストメッセージの内容を書き換えます。`output` は、OpenClaw が自身の制御マーカーまたはチャンネル配信を解析する前に、assistant のテキスト差分と最終テキストを書き換えます。

    APIキー認証と単一のカタログ裏付けランタイムを備えたテキストプロバイダーを1つだけ登録する bundled プロバイダーでは、より限定的な
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使用されるライブカタログパスです。プロバイダー固有の探索を実行してもかまいません。`buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使用してください。認証情報を要求したり、ネットワークリクエストを行ったりしてはいけません。OpenClaw の `models list --all` 表示は現在、bundled プロバイダー Plugin に対してのみ、空の設定、空の env、agent/workspace パスなしで静的カタログを実行します。

    認証フローで `models.providers.*`、エイリアス、オンボーディング中のエージェントのデフォルトモデルにもパッチを当てる必要がある場合は、`openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も限定的なヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` transport でストリーミングされた使用量ブロックをサポートする場合は、プロバイダー ID チェックをハードコードするのではなく、`openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` はエンドポイント機能マップからサポートを検出するため、Plugin がカスタムプロバイダー ID を使用している場合でも、ネイティブの Moonshot/DashScope 風エンドポイントは引き続き opt in できます。

  </Step>

  <Step title="動的モデル解決を追加する">
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

    解決にネットワーク呼び出しが必要な場合は、async のウォームアップに `prepareDynamicModel` を使用します。完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する (必要に応じて)">
    ほとんどのプロバイダーに必要なのは `catalog` + `resolveDynamicModel` だけです。プロバイダーが必要とするにつれて、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的な replay/tool-compat ファミリーをカバーしているため、Plugin が各フックを1つずつ手作業で配線する必要は通常ありません。

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

    | ファミリー | 配線される内容 | bundled の例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換 transport 向けの共有 OpenAI 風 replay ポリシー。tool-call-id のサニタイズ、assistant-first の順序修正、transport が必要とする場合の汎用 Gemini-turn 検証を含みます | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応 replay ポリシー。これにより、Anthropic-message transport は、解決済みモデルが実際に Claude ID の場合にのみ Claude 固有の thinking-block クリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーに加えて、bootstrap replay のサニタイズとタグ付き reasoning-output モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシ transport 経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1つの Plugin 内で Anthropic-message と OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 限定 thinking-block 削除は Anthropic 側にスコープされます | `minimax` |

    現在利用可能なストリームファミリー:

    | ファミリー | 接続するもの | バンドル済みの例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリーム経路での Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリーム経路での Kilo reasoning ラッパー。`kilo/auto` と未対応のプロキシ reasoning ID では注入された thinking をスキップ | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルからの Moonshot バイナリ native-thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリーム経路での MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト詳細度、ネイティブ Codex Web 検索、reasoning 互換ペイロード整形、Responses コンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート用の OpenRouter reasoning ラッパー。未対応モデル/`auto` のスキップは中央で処理 | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限りツールストリーミングを必要とする Z.AI などのプロバイダー向け、デフォルトオンの `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK シーム">
      各ファミリービルダーは、同じパッケージからエクスポートされる下位レベルの公開ヘルパーから構成されます。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生の replay ビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini replay ヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と endpoint/model ヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking prefill クリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、共有 proxy/provider ラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、および xAI 互換ヘルパー（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。バンドル済みの xAI Plugin は、これらと `normalizeResolvedModel` + `contributeResolvedModelCompat` を使い、xAI ルールをプロバイダー所有に保ちます。

      一部のストリームヘルパーは意図的にプロバイダー内にとどめています。`@openclaw/anthropic-provider` は、Claude OAuth ベータ処理と `context1m` ゲーティングをエンコードするため、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` シームに保持します。xAI Plugin も同様に、ネイティブ xAI Responses 整形を自身の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未対応の strict-tool クリーンアップ、xAI 固有の reasoning ペイロード削除）内に保持します。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーとオンボーディング/config ヘルパー）も支えています。
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
        カスタムリクエストヘッダーまたは body の変更が必要なプロバイダーの場合:

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
        汎用 HTTP または WebSocket トランスポートでネイティブリクエスト/セッションヘッダーまたはメタデータが必要なプロバイダーの場合:

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
        使用量/課金データを公開するプロバイダーの場合:

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
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw がすでに呼び出さなくなった互換性専用のプロバイダーフィールドは、ここには記載していません。

      | # | フック | 使用するタイミング |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたは base URL のデフォルト |
      | 2 | `applyConfigDefaults` | config マテリアライズ中のプロバイダー所有のグローバルデフォルト |
      | 3 | `normalizeModelId` | 検索前の legacy/preview model-id エイリアスのクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前のプロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config プロバイダー向けのネイティブ streaming-usage 互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の env-marker 認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config ベースの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config 認証の背後に合成保存済みプロファイルプレースホルダーを下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリームモデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | runner 前のトランスポート書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポート背後にあるベンダーモデルの互換フラグ |
      | 14 | `normalizeToolSchemas` | 登録前のプロバイダー所有 tool-schema クリーンアップ |
      | 15 | `inspectToolSchemas` | プロバイダー所有 tool-schema 診断 |
      | 16 | `resolveReasoningOutputMode` | タグ付き vs ネイティブ reasoning-output 契約 |
      | 17 | `prepareExtraParams` | デフォルトリクエスト params |
      | 18 | `createStreamFn` | 完全にカスタムな StreamFn トランスポート |
      | 19 | `wrapStreamFn` | 通常のストリーム経路でのカスタムヘッダー/body ラッパー |
      | 20 | `resolveTransportTurnState` | ネイティブのターンごとのヘッダー/メタデータ |
      | 21 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/cool-down |
      | 22 | `formatApiKey` | カスタム runtime トークン形状 |
      | 23 | `refreshOAuth` | カスタム OAuth 更新 |
      | 24 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 25 | `matchesContextOverflowError` | プロバイダー所有の overflow 検出 |
      | 26 | `classifyFailoverReason` | プロバイダー所有の rate-limit/overload 分類 |
      | 27 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 28 | `buildMissingAuthMessage` | カスタム missing-auth ヒント |
      | 29 | `augmentModelCatalog` | 合成 forward-compat 行 |
      | 30 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 31 | `isBinaryThinking` | バイナリ thinking on/off 互換性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 33 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 34 | `isModernModelRef` | live/smoke モデル照合 |
      | 35 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 36 | `resolveUsageAuth` | カスタム使用量クレデンシャル解析 |
      | 37 | `fetchUsageSnapshot` | カスタム使用量 endpoint |
      | 38 | `createEmbeddingProvider` | memory/search 用のプロバイダー所有 embedding アダプター |
      | 39 | `buildReplayPolicy` | カスタム transcript replay/compaction ポリシー |
      | 40 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有 replay 書き換え |
      | 41 | `validateReplayTurns` | 組み込み runner 前の厳密な replay-turn 検証 |
      | 42 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      Runtime fallback の注記:

      - `normalizeConfig` はまず一致したプロバイダーを確認し、その後、実際に config を変更するものが見つかるまで、他のフック対応プロバイダー Plugin を確認します。サポート対象の Google ファミリー config エントリをどのプロバイダーフックも書き換えない場合でも、バンドル済みの Google config normalizer が適用されます。
      - `resolveConfigApiKey` は、公開されている場合はプロバイダーフックを使用します。バンドル済みの `amazon-bedrock` 経路にも、ここに組み込みの AWS env-marker resolver があります。ただし、Bedrock runtime auth 自体は引き続き AWS SDK default chain を使用します。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュ対応の system-prompt ガイダンスを注入できます。動作が 1 つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュ分割を維持すべき場合は、`before_prompt_build` よりもこちらを優先してください。

      詳細な説明と実例については、[内部構造: プロバイダー Runtime フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    ### ステップ 5: 追加機能を追加する

    プロバイダー Plugin は、テキスト推論と並行して、音声、realtime 文字起こし、realtime
    voice、メディア理解、画像生成、動画生成、web fetch、
    Web 検索を登録できます。OpenClaw はこれを
    **hybrid-capability** Plugin として分類します。これは企業 Plugin
    （ベンダーごとに 1 つの Plugin）に推奨されるパターンです。
    [内部構造: 機能所有権](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、`register(api)` 内で各機能を登録します。必要なタブだけを選んでください:

    <Tabs>
      <Tab title="音声（TTS）">
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

        provider の HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用すると、
        plugins が上限付きのエラー本文読み取り、JSON エラー解析、
        request-id サフィックスを共有できます。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を推奨します。共有
        ヘルパーは、プロキシ取得、再接続バックオフ、クローズ時のフラッシュ、準備完了
        ハンドシェイク、音声キューイング、クローズイベント診断を処理します。plugin
        側ではアップストリームイベントをマッピングするだけです。

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

        multipart 音声を POST するバッチ STT providers は、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使用する必要があります。このヘルパーは、
        互換性のある文字起こし API 向けに M4A 風のファイル名が必要な AAC アップロードを含め、
        アップロードファイル名を正規化します。
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
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        transport が人間による assistant 再生の割り込みを検出でき、provider が
        アクティブな音声レスポンスの切り詰めまたはクリアをサポートしている場合は、
        `handleBargeIn` を実装してください。
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
      <Tab title="画像と動画の生成">
        動画機能では **モード対応** の形状を使用します: `generate`、
        `imageToVideo`、`videoToVideo`。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds`
        のようなフラットな集約フィールドだけでは、変換モードのサポートや無効化されたモードを
        明確に公開するには不十分です。音楽生成も、明示的な `generate` /
        `edit` ブロックで同じパターンに従います。

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

Provider plugins は、他の外部コード plugin と同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来の skill 専用 publish エイリアスを使用しないでください。plugin パッケージでは
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

`catalog.order` は、組み込み providers に対してカタログがどのタイミングでマージされるかを制御します:

| 順序      | タイミング    | ユースケース                                    |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キー providers                       |
| `profile` | simple の後   | 認証プロファイルで制御される providers          |
| `paired`  | profile の後  | 関連する複数のエントリを合成                    |
| `late`    | 最後のパス    | 既存の providers を上書き（衝突時に勝つ）       |

## 次のステップ

- [チャンネル Plugins](/ja-JP/plugins/sdk-channel-plugins) — plugin がチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、検索、subagent）
- [SDK 概要](/ja-JP/plugins/sdk-overview) — 完全なサブパス import リファレンス
- [Plugin 内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — hook の詳細とバンドル例

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
- [チャンネル plugins の構築](/ja-JP/plugins/sdk-channel-plugins)

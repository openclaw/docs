---
read_when:
    - 新しいモデルプロバイダーPluginを構築しています
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加したい場合
    - プロバイダー認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw 向けモデルプロバイダー Plugin の構築手順ガイド
title: プロバイダー Plugin の構築
x-i18n:
    generated_at: "2026-05-02T05:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

このガイドでは、OpenClaw にモデルプロバイダー (LLM) を追加するプロバイダー Plugin の構築手順を説明します。最後まで進めると、モデルカタログ、API キー認証、動的モデル解決を備えたプロバイダーが完成します。

<Info>
  OpenClaw Plugin をまだ構築したことがない場合は、まず基本的なパッケージ
  構造とマニフェスト設定について
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  プロバイダー Plugin は、OpenClaw の通常の推論ループにモデルを追加します。
  モデルがスレッド、Compaction、ツールイベントを所有するネイティブエージェントデーモン経由で
  実行される必要がある場合は、デーモンプロトコルの詳細を core に入れるのではなく、
  プロバイダーを [エージェントハーネス](/ja-JP/plugins/sdk-agent-harness)
  と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
  <Step title="パッケージとマニフェスト">
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

    このマニフェストは `providerAuthEnvVars` を宣言するため、OpenClaw は
    Plugin ランタイムを読み込まずに認証情報を検出できます。プロバイダーのバリアントが
    別のプロバイダー ID の認証を再利用する必要がある場合は、`providerAuthAliases`
    を追加します。`modelSupport` は省略可能で、ランタイムフックが存在する前に
    `acme-large` のような省略形のモデル ID から OpenClaw がプロバイダー Plugin を自動読み込みできます。
    プロバイダーを ClawHub で公開する場合、これらの `openclaw.compat` と `openclaw.build` フィールドは
    `package.json` で必須です。

  </Step>

  <Step title="プロバイダーを登録する">
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
    モデルとして `acme-ai/acme-large` を選択できるようになります。

    上流プロバイダーが OpenClaw とは異なる制御トークンを使う場合は、ストリームパスを置き換えるのではなく、
    小さな双方向テキスト変換を追加します。

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

    `input` は、転送前に最終的なシステムプロンプトとテキストメッセージ内容を書き換えます。
    `output` は、OpenClaw が独自の制御マーカーやチャンネル配信を解析する前に、
    アシスタントのテキストデルタと最終テキストを書き換えます。

    API キー認証と単一のカタログ対応ランタイムを備えたテキストプロバイダーを 1 つだけ登録する
    バンドル済みプロバイダーでは、より狭い
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できるときに使用されるライブカタログパスです。
    ここではプロバイダー固有の検出を実行できます。
    `buildStaticProvider` は、認証が設定される前に表示しても安全なオフライン行にのみ使用してください。
    認証情報を要求したり、ネットワークリクエストを行ったりしてはいけません。
    OpenClaw の `models list --all` 表示は現在、空の設定、空の env、agent/workspace パスなしで、
    バンドル済みプロバイダー Plugin に対してのみ静的カタログを実行します。

    認証フローで `models.providers.*`、エイリアス、オンボーディング中のエージェントの既定モデルもパッチする必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。最も狭いヘルパーは
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` 転送でストリーミング使用量ブロックをサポートする場合は、
    プロバイダー ID チェックをハードコードするのではなく、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。
    `supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` はエンドポイント機能マップからサポートを検出するため、
    Plugin がカスタムプロバイダー ID を使用している場合でも、ネイティブの Moonshot/DashScope スタイルのエンドポイントは引き続き opt in できます。

  </Step>

  <Step title="動的モデル解決を追加する">
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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップに `prepareDynamicModel` を使用してください。
    完了後に `resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する (必要に応じて)">
    ほとんどのプロバイダーでは `catalog` + `resolveDynamicModel` だけで十分です。
    プロバイダーが必要とする範囲で、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的な replay/tool 互換ファミリーをカバーしているため、
    Plugin が各フックを 1 つずつ手作業で配線する必要は通常ありません。

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

    | ファミリー | 配線される内容 | バンドル済みの例 |
    | --- | --- | --- |
    | `openai-compatible` | ツール呼び出し ID のサニタイズ、assistant-first 順序修正、転送が必要とする場合の汎用 Gemini ターン検証を含む、OpenAI 互換転送向けの共有 OpenAI スタイル replay ポリシー | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応 replay ポリシー。これにより Anthropic メッセージ転送は、解決済みモデルが実際に Claude ID の場合にのみ Claude 固有の thinking-block クリーンアップを受けます | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーに加え、bootstrap replay のサニタイズとタグ付き reasoning-output モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシ転送経由で実行される Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic メッセージと OpenAI 互換モデルサーフェスを混在させるプロバイダー向けのハイブリッドポリシー。任意の Claude 専用 thinking-block 削除は Anthropic 側に限定されます | `minimax` |

    現在利用可能な stream ファミリー:

    | ファミリー | 組み込む内容 | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上の Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上の Kilo reasoning ラッパー。`kilo/auto` と未対応のプロキシ reasoning ID では注入された thinking をスキップ | `kilocode` |
    | `moonshot-thinking` | config + `/think` レベルから Moonshot バイナリ native-thinking ペイロードをマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上の MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト詳細度、ネイティブ Codex web search、reasoning 互換ペイロード整形、Responses コンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート用の OpenRouter reasoning ラッパー。未対応モデル/`auto` のスキップは中央で処理 | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限りツールストリーミングを使いたい Z.AI のようなプロバイダー向けの、デフォルト有効 `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK シーム">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーから構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini リプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）とエンドポイント/モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages thinking プリフィルクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、共有プロキシ/プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、xAI 互換ヘルパー（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。バンドルされた xAI Plugin は、これらを `normalizeResolvedModel` + `contributeResolvedModelCompat` と組み合わせて使い、xAI ルールをプロバイダー所有に保ちます。

      一部のストリームヘルパーは意図的にプロバイダーローカルのままです。`@openclaw/anthropic-provider` は、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、低レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` シームに保持します。これらは Claude OAuth ベータ処理と `context1m` ゲーティングをエンコードしているためです。xAI Plugin も同様に、ネイティブ xAI Responses 整形を自身の `wrapStreamFn`（`/fast` エイリアス、デフォルト `tool_stream`、未対応 strict-tool クリーンアップ、xAI 固有の reasoning ペイロード削除）に保持します。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーとオンボーディング/config ヘルパー）も支えています。
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
        カスタムリクエストヘッダーや body 変更が必要なプロバイダー向け:

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
        汎用 HTTP または WebSocket トランスポート上でネイティブのリクエスト/セッションヘッダーやメタデータが必要なプロバイダー向け:

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
      OpenClaw が現在は呼び出さない、`ProviderPlugin.capabilities` や `suppressBuiltInModel` などの互換性専用プロバイダーフィールドはここには掲載していません。

      | # | フック | 使用タイミング |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | 2 | `applyConfigDefaults` | config 具現化時の、プロバイダー所有のグローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/プレビューモデル ID エイリアスのクリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前の、プロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` config の正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config プロバイダー向けネイティブ streaming-usage 互換書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の env-marker 認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホスト、または config 裏付けの合成認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 合成の保存プロファイルプレースホルダーを env/config 認証の後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリームモデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | ランナー前のトランスポート書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換トランスポート背後にあるベンダーモデル向けの互換フラグ |
      | 14 | `normalizeToolSchemas` | 登録前の、プロバイダー所有のツールスキーマクリーンアップ |
      | 15 | `inspectToolSchemas` | プロバイダー所有のツールスキーマ診断 |
      | 16 | `resolveReasoningOutputMode` | タグ付き reasoning-output とネイティブ reasoning-output の契約 |
      | 17 | `prepareExtraParams` | デフォルトリクエストパラメーター |
      | 18 | `createStreamFn` | 完全カスタム StreamFn トランスポート |
      | 19 | `wrapStreamFn` | 通常のストリームパス上のカスタムヘッダー/body ラッパー |
      | 20 | `resolveTransportTurnState` | ネイティブのターンごとのヘッダー/メタデータ |
      | 21 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 22 | `formatApiKey` | カスタムランタイムトークン形状 |
      | 23 | `refreshOAuth` | カスタム OAuth refresh |
      | 24 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 25 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 26 | `classifyFailoverReason` | プロバイダー所有の rate-limit/overload 分類 |
      | 27 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 28 | `buildMissingAuthMessage` | カスタム missing-auth ヒント |
      | 29 | `augmentModelCatalog` | 合成 forward-compat 行 |
      | 30 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 31 | `isBinaryThinking` | バイナリ thinking オン/オフ互換性 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 33 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 34 | `isModernModelRef` | live/smoke モデル照合 |
      | 35 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 36 | `resolveUsageAuth` | カスタム使用量資格情報の解析 |
      | 37 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 38 | `createEmbeddingProvider` | memory/search 用のプロバイダー所有 embedding アダプター |
      | 39 | `buildReplayPolicy` | カスタム transcript replay/compaction ポリシー |
      | 40 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有 replay 書き換え |
      | 41 | `validateReplayTurns` | 埋め込みランナー前の厳密な replay-turn 検証 |
      | 42 | `onModelSelected` | 選択後コールバック（例: telemetry） |

      ランタイムフォールバックの注記:

      - `normalizeConfig` は最初に一致したプロバイダーを確認し、その後、実際に config を変更するものが見つかるまで、他のフック対応プロバイダーPluginを確認します。サポート対象の Google ファミリー config エントリを書き換えるプロバイダーフックがない場合でも、バンドルされた Google config ノーマライザーが適用されます。
      - `resolveConfigApiKey` は公開されている場合、プロバイダーフックを使います。バンドルされた `amazon-bedrock` パスには、ここに組み込みの AWS env-marker リゾルバーもあります。ただし、Bedrock のランタイム認証自体は引き続き AWS SDK のデフォルトチェーンを使います。
      - `resolveSystemPromptContribution` により、プロバイダーはモデルファミリー向けにキャッシュ対応のシステムプロンプトガイダンスを注入できます。挙動が 1 つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュ分割を保持すべき場合は、`before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、[内部構造: プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加機能を追加する（任意）">
    プロバイダーPluginは、テキスト推論に加えて、speech、realtime transcription、realtime voice、media understanding、image generation、video generation、web fetch、web search を登録できます。OpenClaw はこれを **hybrid-capability** Plugin として分類します。これは会社Plugin（ベンダーごとに 1 つのPlugin）に推奨されるパターンです。
    [内部構造: 機能所有権](/ja-JP/plugins/architecture#capability-ownership-model) を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各機能を `register(api)` 内で登録します。必要なタブだけを選んでください:

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

        provider の HTTP 失敗には `assertOkOrThrowProviderError(...)` を使用し、
        plugins が制限付きのエラーボディ読み取り、JSON エラー解析、
        request-id サフィックスを共有できるようにします。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。共有
        ヘルパーがプロキシキャプチャ、再接続バックオフ、クローズ時のフラッシュ、ready
        ハンドシェイク、音声キューイング、close-event 診断を処理します。あなたの plugin は
        upstream events をマッピングするだけです。

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
        `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーは、
        互換性のある文字起こし API で M4A 形式のファイル名を必要とする AAC アップロードを含め、
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
        アクティブな音声応答の切り詰めまたはクリアをサポートしている場合は、
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
        動画機能は **モード対応** の形状を使用します: `generate`,
        `imageToVideo`, `videoToVideo`。`maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` のようなフラットな集約フィールドだけでは、
        変換モードのサポートや無効化されたモードを明確に示すには不十分です。
        音楽生成も、明示的な `generate` / `edit` ブロックで同じパターンに従います。

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

## ClawHub へ公開する

Provider plugins は、他の外部コード plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここでは従来の skill 専用 publish alias は使用しないでください。plugin packages は
`clawhub package publish` を使用する必要があります。

## ファイル構成

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

`catalog.order` は、組み込み
providers に対してあなたのカタログがいつマージされるかを制御します。

| 順序      | タイミング    | 用途                                            |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 通常の API-key providers                        |
| `profile` | simple の後   | auth profiles で制御される providers           |
| `paired`  | profile の後  | 複数の関連エントリを合成する                   |
| `late`    | 最後のパス    | 既存の providers を上書きする（衝突時に優先） |

## 次のステップ

- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — あなたの plugin が channel も提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、検索、subagent）
- [SDK Overview](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Plugin Internals](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — hook の詳細とバンドル例

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [plugins の構築](/ja-JP/plugins/building-plugins)
- [channel plugins の構築](/ja-JP/plugins/sdk-channel-plugins)

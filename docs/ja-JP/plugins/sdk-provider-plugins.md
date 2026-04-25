---
read_when:
    - 新しいモデルプロバイダー Plugin を構築しています
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加したいと考えています
    - プロバイダー認証、カタログ、およびランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw 向けモデルプロバイダー Plugin を構築するためのステップバイステップガイド
title: プロバイダー Plugin の構築
x-i18n:
    generated_at: "2026-04-25T18:19:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

このガイドでは、OpenClaw にモデルプロバイダー（LLM）を追加する provider Plugin の構築方法を説明します。最後まで進めると、モデルカタログ、API キー認証、および動的モデル解決を備えたプロバイダーが完成します。

<Info>
  OpenClaw Plugin をまだ一度も作成したことがない場合は、基本的なパッケージ構造と manifest 設定について先に
  [はじめに](/ja-JP/plugins/building-plugins) を読んでください。
</Info>

<Tip>
  provider Plugin は OpenClaw の通常の推論ループにモデルを追加します。モデルを、スレッド、Compaction、またはツールイベントを管理するネイティブ agent デーモン経由で実行する必要がある場合は、デーモンプロトコルの詳細を core に入れるのではなく、プロバイダーを [agent harness](/ja-JP/plugins/sdk-agent-harness) と組み合わせてください。
</Tip>

## ウォークスルー

<Steps>
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

    manifest は `providerAuthEnvVars` を宣言し、OpenClaw が Plugin ランタイムをロードせずに認証情報を検出できるようにします。プロバイダーのバリアントが別の provider id の認証を再利用する場合は、`providerAuthAliases` を追加します。`modelSupport` は任意で、ランタイムフックが存在する前でも、OpenClaw が `acme-large` のような短縮モデル ID から provider Plugin を自動ロードできるようにします。provider を ClawHub で公開する場合、これらの `openclaw.compat` および `openclaw.build` フィールドは `package.json` で必須です。

  </Step>

  <Step title="プロバイダーを登録する">
    最小のプロバイダーには `id`、`label`、`auth`、および `catalog` が必要です:

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

    これで動作するプロバイダーになります。ユーザーは `openclaw onboard --acme-ai-api-key <key>` を実行し、モデルとして `acme-ai/acme-large` を選択できるようになります。

    アップストリームプロバイダーが OpenClaw と異なる制御トークンを使用する場合は、ストリームパスを置き換えるのではなく、小さな双方向テキスト変換を追加してください:

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

    `input` は、転送前に最終的なシステムプロンプトとテキストメッセージ内容を書き換えます。`output` は、OpenClaw が独自の制御マーカーや channel 配信を解析する前に、assistant のテキスト delta と最終テキストを書き換えます。

    API キー認証を持つ 1 つのテキストプロバイダーと、単一の catalog バック runtime だけを登録する bundled provider では、より限定的な `defineSingleProviderPluginEntry(...)` ヘルパーを優先してください:

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

    `buildProvider` は、OpenClaw が実際の provider 認証を解決できるときに使われるライブカタログパスです。プロバイダー固有の検出を実行してもかまいません。`buildStaticProvider` は、認証設定前でも安全に表示できるオフライン行にのみ使用してください。認証情報を必要としたり、ネットワークリクエストを行ったりしてはいけません。OpenClaw の `models list --all` 表示では現在、bundled provider Plugin に対してのみ static catalog を実行し、その際は空の config、空の env、agent/workspace パスなしで動作します。

    認証フローでオンボーディング時に `models.providers.*`、alias、および agent のデフォルトモデルも更新する必要がある場合は、`openclaw/plugin-sdk/provider-onboard` の preset ヘルパーを使用してください。最も限定的なヘルパーは `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)`、および `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions` 転送でストリーミングされた usage ブロックをサポートしている場合は、provider-id チェックをハードコードする代わりに、`openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを優先してください。`supportsNativeStreamingUsageCompat(...)` と `applyProviderNativeStreamingUsageCompat(...)` は、エンドポイント capability map からサポートを検出するため、Plugin がカスタム provider id を使用していても、ネイティブな Moonshot/DashScope スタイルのエンドポイントは引き続き opt in できます。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデル ID を受け入れる場合（プロキシやルーターなど）、`resolveDynamicModel` を追加してください:

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップ用に `prepareDynamicModel` を使用してください。`resolveDynamicModel` は完了後に再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーは `catalog` + `resolveDynamicModel` だけで十分です。プロバイダーが必要とする場合にのみ、フックを段階的に追加してください。

    共有ヘルパービルダーは現在、最も一般的な replay/tool-compat ファミリーをカバーしているため、通常は各フックを 1 つずつ手作業で配線する必要はありません:

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
    | `openai-compatible` | OpenAI 互換転送向けの共有 OpenAI スタイル replay ポリシー。tool-call-id のサニタイズ、assistant-first 順序修正、および転送側で必要な場合の汎用 Gemini ターン検証を含みます | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` で選ばれる Claude 対応 replay ポリシー。Anthropic message 転送では、解決されたモデルが実際に Claude id の場合にのみ Claude 固有の thinking-block クリーンアップを適用します | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | ネイティブ Gemini replay ポリシーに加え、bootstrap replay のサニタイズとタグ付き reasoning-output モード | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシ転送を通して動作する Gemini モデル向けの Gemini thought-signature サニタイズ。ネイティブ Gemini replay 検証や bootstrap 書き換えは有効にしません | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic message と OpenAI 互換モデルサーフェスを混在させるプロバイダー向けハイブリッドポリシー。オプションの Claude 専用 thinking-block 削除は Anthropic 側にのみ適用されます | `minimax` |

    現在利用可能な stream ファミリー:

    | ファミリー | 配線される内容 | bundled の例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパス上での Gemini thinking ペイロード正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上での Kilo reasoning ラッパー。`kilo/auto` および未対応のプロキシ reasoning id では、注入された thinking をスキップします | `kilocode` |
    | `moonshot-thinking` | 設定 + `/think` レベルからの Moonshot バイナリ native-thinking ペイロードマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパス上での MiniMax fast-mode モデル書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有のネイティブ OpenAI/Codex Responses ラッパー: attribution ヘッダー、`/fast`/`serviceTier`、テキスト冗長度、ネイティブ Codex Web 検索、reasoning-compat ペイロード整形、および Responses コンテキスト管理 | `openai`, `openai-codex` |
    | `openrouter-thinking` | プロキシルート向け OpenRouter reasoning ラッパー。未対応モデル/`auto` のスキップは一元的に処理されます | `openrouter` |
    | `tool-stream-default-on` | Z.AI のように、明示的に無効化されない限りツールストリーミングを使いたいプロバイダー向けのデフォルト有効 `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK 境界">
      各ファミリービルダーは、同じパッケージからエクスポートされる下位レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合は、これらを利用できます:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生の replay ビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini replay ヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と endpoint/model ヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`、`normalizeNativeXaiModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`、さらに共有 OpenAI/Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、および共有 proxy/provider ラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("gemini")`、基盤となる Gemini スキーマヘルパー（`normalizeGeminiToolSchemas`、`inspectGeminiToolSchemas`）、および xAI 互換ヘルパー（`resolveXaiModelCompatPatch()`、`applyXaiModelCompat(model)`）。bundled の xAI Plugin は、xAI ルールの所有権をプロバイダー側に保つために、これらと `normalizeResolvedModel` + `contributeResolvedModelCompat` を使用します。

      一部のストリームヘルパーは意図的にプロバイダー固有のままです。`@openclaw/anthropic-provider` は `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および下位レベルの Anthropic ラッパービルダーを、自身の公開 `api.ts` / `contract-api.ts` 境界に保持しています。これは、それらが Claude OAuth beta 処理と `context1m` ゲーティングを符号化しているためです。同様に xAI Plugin も、ネイティブ xAI Responses の整形を独自の `wrapStreamFn` 内に保持しています（`/fast` alias、デフォルト `tool_stream`、未対応 strict-tool クリーンアップ、xAI 固有の reasoning-payload 削除）。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、realtime プロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダーに加え、オンボーディング/設定ヘルパー）も支えています。
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
        カスタムリクエストヘッダーまたはボディ変更が必要なプロバイダー向け:

        ```typescript
        // wrapStreamFn は ctx.streamFn から導出された StreamFn を返す
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
        汎用 HTTP または WebSocket 転送上で、ネイティブなリクエスト/セッションヘッダーまたはメタデータが必要なプロバイダー向け:

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
      OpenClaw はこの順序でフックを呼び出します。ほとんどのプロバイダーは 2〜3 個しか使いません:

      | # | フック | 使用するタイミング |
      | --- | --- | --- |
      | 1 | `catalog` | モデルカタログまたは `baseUrl` のデフォルト |
      | 2 | `applyConfigDefaults` | 設定具体化中の、プロバイダー所有グローバルデフォルト |
      | 3 | `normalizeModelId` | ルックアップ前のレガシー/preview モデル ID alias クリーンアップ |
      | 4 | `normalizeTransport` | 汎用モデル組み立て前の、プロバイダーファミリー `api` / `baseUrl` クリーンアップ |
      | 5 | `normalizeConfig` | `models.providers.<id>` 設定を正規化 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider 向けネイティブ streaming-usage compat 書き換え |
      | 7 | `resolveConfigApiKey` | プロバイダー所有の env-marker 認証解決 |
      | 8 | `resolveSyntheticAuth` | ローカル/セルフホストまたは config バックの synthetic 認証 |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic な保存済みプロファイルプレースホルダーを env/config 認証の後ろに下げる |
      | 10 | `resolveDynamicModel` | 任意のアップストリームモデル ID を受け入れる |
      | 11 | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | 12 | `normalizeResolvedModel` | ランナー前の転送書き換え |
      | 13 | `contributeResolvedModelCompat` | 別の互換転送の背後にあるベンダーモデル用の compat フラグ |
      | 14 | `capabilities` | レガシー静的 capability bag。互換性用のみ |
      | 15 | `normalizeToolSchemas` | 登録前のプロバイダー所有ツールスキーマクリーンアップ |
      | 16 | `inspectToolSchemas` | プロバイダー所有ツールスキーマ診断 |
      | 17 | `resolveReasoningOutputMode` | tagged と native の reasoning-output 契約 |
      | 18 | `prepareExtraParams` | デフォルトのリクエストパラメータ |
      | 19 | `createStreamFn` | 完全にカスタムな StreamFn 転送 |
      | 20 | `wrapStreamFn` | 通常のストリームパス上でのカスタムヘッダー/ボディラッパー |
      | 21 | `resolveTransportTurnState` | ネイティブなターンごとのヘッダー/メタデータ |
      | 22 | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションヘッダー/クールダウン |
      | 23 | `formatApiKey` | カスタムランタイムトークン形式 |
      | 24 | `refreshOAuth` | カスタム OAuth 更新 |
      | 25 | `buildAuthDoctorHint` | 認証修復ガイダンス |
      | 26 | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | 27 | `classifyFailoverReason` | プロバイダー所有の rate-limit/overload 分類 |
      | 28 | `isCacheTtlEligible` | プロンプトキャッシュ TTL ゲーティング |
      | 29 | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | 30 | `suppressBuiltInModel` | 古いアップストリーム行を隠す |
      | 31 | `augmentModelCatalog` | synthetic な forward-compat 行 |
      | 32 | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | 33 | `isBinaryThinking` | バイナリ thinking の on/off 互換性 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning サポート互換性 |
      | 35 | `resolveDefaultThinkingLevel` | デフォルト `/think` ポリシー互換性 |
      | 36 | `isModernModelRef` | live/smoke モデルマッチング |
      | 37 | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | 38 | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | 39 | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | 40 | `createEmbeddingProvider` | メモリ/検索用のプロバイダー所有 embedding アダプター |
      | 41 | `buildReplayPolicy` | カスタム transcript replay/Compaction ポリシー |
      | 42 | `sanitizeReplayHistory` | 汎用クリーンアップ後のプロバイダー固有 replay 書き換え |
      | 43 | `validateReplayTurns` | 埋め込みランナー前の厳密な replay ターン検証 |
      | 44 | `onModelSelected` | 選択後コールバック（たとえば telemetry） |

      ランタイム fallback に関する注意:

      - `normalizeConfig` は、まず一致したプロバイダーをチェックし、その後、実際に設定を変更するフック対応の他の provider Plugin を順にチェックします。どのプロバイダーフックもサポートされた Google ファミリー設定エントリを書き換えない場合は、bundled の Google 設定正規化が引き続き適用されます。
      - `resolveConfigApiKey` は、公開されていればプロバイダーフックを使用します。bundled の `amazon-bedrock` パスには、ここに組み込みの AWS env-marker resolver もありますが、Bedrock ランタイム認証自体は依然として AWS SDK のデフォルトチェーンを使用します。
      - `resolveSystemPromptContribution` は、プロバイダーがモデルファミリー向けにキャッシュ対応の system prompt ガイダンスを注入できるようにします。動作が 1 つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュ分割を維持すべき場合は、`before_prompt_build` よりこちらを優先してください。

      詳細な説明と実例については、[Internals: Provider Runtime Hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
    </Accordion>

  </Step>

  <Step title="追加 capability を追加する（任意）">
    provider Plugin は、テキスト推論に加えて speech、realtime transcription、realtime voice、media understanding、image generation、video generation、Web fetch、および Web 検索を登録できます。OpenClaw はこれを **hybrid-capability** Plugin と分類します。これは企業向け Plugin（ベンダーごとに 1 Plugin）に推奨されるパターンです。参照:
    [Internals: Capability Ownership](/ja-JP/plugins/architecture#capability-ownership-model)。

    既存の `api.registerProvider(...)` 呼び出しと並べて、`register(api)` の中で各 capability を登録してください。必要なタブだけを選んでください:

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

        プロバイダー HTTP 障害には `assertOkOrThrowProviderError(...)` を使ってください。これにより、Plugin 間で上限付きエラーボディ読み取り、JSON エラー解析、および request-id 接尾辞を共有できます。
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` を優先してください。共有ヘルパーが、プロキシキャプチャ、再接続バックオフ、クローズ時フラッシュ、ready ハンドシェイク、音声キューイング、および close-event 診断を処理します。Plugin 側ではアップストリームイベントを対応付けるだけで済みます。

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

        multipart 音声を POST するバッチ STT プロバイダーでは、`openclaw/plugin-sdk/provider-http` の `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーはアップロードファイル名を正規化し、互換性のある transcription API のために M4A 形式のファイル名が必要な AAC アップロードも処理します。
      </Tab>
      <Tab title="Realtime voice">
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
      <Tab title="画像生成と動画生成">
        動画 capability は **mode-aware** な形を使います: `generate`、`imageToVideo`、`videoToVideo` です。`maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のようなフラットな集約フィールドだけでは、transform モードのサポートや無効化されたモードをきれいに表現できません。音楽生成も同じパターンに従い、明示的な `generate` / `edit` ブロックを使います。

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
      <Tab title="Web fetch と Web 検索">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Acme のレンダリングバックエンド経由でページを取得します。",
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
            description: "Acme Fetch 経由でページを取得します。",
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
    // index.ts または専用ファイルから provider 設定オブジェクトをエクスポートする
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("動的モデルを解決する", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("キーが利用可能な場合は catalog を返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("キーがない場合は null の catalog を返す", async () => {
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

provider Plugin は、他の外部コード Plugin と同じ方法で公開します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

ここではレガシーな skill 専用 publish alias は使わないでください。plugin パッケージでは `clawhub package publish` を使用する必要があります。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers メタデータ
├── openclaw.plugin.json      # プロバイダー認証メタデータを含む Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量エンドポイント（任意）
```

## catalog 順序リファレンス

`catalog.order` は、組み込みプロバイダーに対して catalog をどのタイミングでマージするかを制御します:

| 順序 | タイミング | 用途 |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 最初のパス    | 単純な API キープロバイダー                     |
| `profile` | `simple` の後 | auth profile によってゲートされるプロバイダー   |
| `paired`  | `profile` の後 | 複数の関連エントリを合成する                    |
| `late`    | 最後のパス    | 既存プロバイダーを上書きする（衝突時に勝つ）    |

## 次のステップ

- [channel Plugin](/ja-JP/plugins/sdk-channel-plugins) — Plugin が channel も提供する場合
- [SDK Runtime](/ja-JP/plugins/sdk-runtime) — `api.runtime` ヘルパー（TTS、検索、subagent）
- [SDK 概要](/ja-JP/plugins/sdk-overview) — 完全な subpath import リファレンス
- [Plugin Internals](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) — フックの詳細と bundled の例

## 関連

- [Plugin SDK セットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [channel Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)

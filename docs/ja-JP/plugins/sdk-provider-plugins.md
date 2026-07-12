---
read_when:
    - 新しいモデルプロバイダー Plugin を構築しています
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加する場合
    - プロバイダーの認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw向けモデルプロバイダーPlugin構築のステップバイステップガイド
title: プロバイダー Plugin の構築
x-i18n:
    generated_at: "2026-07-11T22:33:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

OpenClawにモデルプロバイダー（LLM）を追加するためのプロバイダーPluginを構築します。モデル
カタログ、APIキー認証、動的なモデル解決を実装します。

<Info>
  OpenClawのPluginが初めての場合は、まずパッケージ構造とマニフェストの設定について
  [はじめに](/ja-JP/plugins/building-plugins)を参照してください。
</Info>

<Tip>
  プロバイダーPluginは、OpenClawの通常の推論ループにモデルを追加します。モデルを、
  スレッド、Compaction、またはツールイベントを管理するネイティブエージェントデーモン経由で
  実行する必要がある場合は、デーモンプロトコルの詳細をコアに組み込むのではなく、
  プロバイダーを[エージェントハーネス](/ja-JP/plugins/sdk-agent-harness)と組み合わせてください。
</Tip>

## 手順

<Steps>
  <Step title="パッケージとマニフェスト">
    ### ステップ1：パッケージとマニフェスト

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

    `setup.providers[].envVars`を使用すると、OpenClawはPluginのランタイムを
    読み込まずに認証情報を検出できます。プロバイダーの派生版で別のプロバイダーIDの認証を
    再利用する場合は、`providerAuthAliases`を追加します。`modelSupport`は
    省略可能であり、ランタイムフックが存在する前に、`acme-large`のような短縮モデルIDから
    OpenClawがプロバイダーPluginを自動読み込みできるようにします。`package.json`内の
    `openclaw.compat`と`openclaw.build`は、ClawHubへの公開に必須です
    （`openclaw.compat.pluginApi`と`openclaw.build.openclawVersion`が
    2つの必須フィールドです。`minGatewayVersion`を省略した場合は、
    `openclaw.install.minHostVersion`にフォールバックします）。

  </Step>

  <Step title="プロバイダーを登録する">
    最小限のテキストプロバイダーには、`id`、`label`、`auth`、`catalog`が必要です。
    `catalog`はプロバイダーが管理するランタイム／設定フックです。ベンダーのライブAPIを
    呼び出すことができ、`models.providers`のエントリを返します。

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

    `registerModelCatalogProvider`は、一覧、ヘルプ、選択UI向けの新しいコントロールプレーンの
    カタログサーフェスであり、`text`、`voice`、`image_generation`、
    `video_generation`、`music_generation`の行に対応します。ベンダーのエンドポイント呼び出しと
    レスポンスのマッピングはPlugin内に保持してください。共有される行の形式、ソースラベル、
    ヘルプの表示はOpenClawが管理します。

    これで動作するプロバイダーが完成しました。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>`を実行し、
    モデルとして`acme-ai/acme-large`を選択できるようになります。

    ### ライブモデル検出

    プロバイダーが`/models`形式のAPIを公開している場合は、プロバイダー固有の
    エンドポイントと行への変換をPlugin内に保持し、共有の取得ライフサイクルには
    `openclaw/plugin-sdk/provider-catalog-live-runtime`を使用してください。
    このヘルパーは、プロバイダーポリシーをOpenClawコアに組み込むことなく、
    保護されたHTTP取得、プロバイダー認証ヘッダー、構造化されたHTTPエラー、
    TTLキャッシュ、静的フォールバック動作を提供します。

    ライブAPIが、プロバイダー所有の静的カタログ行のうち現在利用可能なものだけを通知する場合は、
    `buildLiveModelProviderConfig`を使用します。

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

    プロバイダーAPIがより詳細なメタデータを返し、Plugin自体で行をOpenClawの
    モデル定義に変換する必要がある場合は、`getCachedLiveProviderModelRows`を使用します。

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

    `run`は認証で保護されたままにし、使用可能な認証情報がない場合は`null`を返す必要があります。
    セットアップ、ドキュメント、テスト、選択UIのサーフェスがライブネットワークアクセスに
    依存しないように、オフラインの`staticRun`または静的フォールバックを保持してください。
    モデル一覧に必要な鮮度に適したTTLを使用し、リクエスト時のファイルシステムポーリングを避け、
    上流のレスポンスがOpenAI互換の`{ data: [{ id, object }] }`形式でない場合にのみ、
    プロバイダー固有の`readRows`／`readModelId`を渡してください。

    上流プロバイダーがOpenClawとは異なる制御トークンを使用する場合は、ストリーム経路を
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

    `input`は、転送前に最終的なシステムプロンプトとテキストメッセージの内容を書き換えます。
    `output`は、OpenClawが独自の制御マーカーを解析したりチャンネルに配信したりする前に、
    アシスタントのテキスト差分と最終テキストを書き換えます。

    APIキー認証と単一のカタログベースのランタイムを備えたテキストプロバイダーを1つだけ
    登録するバンドル済みプロバイダーでは、より限定的な
    `defineSingleProviderPluginEntry(...)`ヘルパーを優先してください。

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AIモデルプロバイダー",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI APIキー",
            hint: "Acme AIダッシュボードから取得したAPIキー",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Acme AI APIキーを入力してください",
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

    `buildProvider`は、OpenClawが実際のプロバイダー認証を解決できる場合に使用されるライブカタログのパスです。プロバイダー固有の検出を実行できます。認証の設定前でも安全に表示できるオフライン行にのみ`buildStaticProvider`を使用してください。資格情報を要求したり、ネットワークリクエストを行ったりしてはいけません。現在、OpenClawの`models list --all`表示で静的カタログが実行されるのは、空の設定、空の環境変数、エージェントおよびワークスペースのパスなしという条件下で、同梱プロバイダーPluginに対してのみです。

    認証フローでオンボーディング中に`models.providers.*`、エイリアス、エージェントのデフォルトモデルも更新する必要がある場合は、`openclaw/plugin-sdk/provider-onboard`のプリセットヘルパーを使用してください。最も用途が限定されたヘルパーは、`createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)`、`createModelCatalogPresetAppliers(...)`です。

    プロバイダーのネイティブエンドポイントが通常の`openai-completions`トランスポートでストリーミング使用量ブロックをサポートしている場合、プロバイダーIDのチェックをハードコードする代わりに、`openclaw/plugin-sdk/provider-catalog-shared`の共有カタログヘルパーを使用してください。`supportsNativeStreamingUsageCompat(...)`と`applyProviderNativeStreamingUsageCompat(...)`はエンドポイントの機能マップからサポートを検出するため、PluginがカスタムプロバイダーIDを使用している場合でも、ネイティブのMoonshot/DashScope形式のエンドポイントは引き続き明示的に有効化されます。

    上記のライブ検出例は、`/models`形式のプロバイダーAPIを対象としています。この検出は`catalog.run`内に置き、使用可能な認証がある場合に限定してください。また、オフラインでカタログを生成できるよう、`staticRun`ではネットワークを使用しないでください。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデルIDを受け付ける場合（プロキシやルーターなど）は、`resolveDynamicModel`を追加します。

    ```typescript
    api.registerProvider({
      // ... 上記のid、label、auth、catalog

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

    解決にネットワーク呼び出しが必要な場合は、非同期のウォームアップに`prepareDynamicModel`を使用してください。完了後に`resolveDynamicModel`が再実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要な場合）">
    ほとんどのプロバイダーに必要なのは`catalog`と`resolveDynamicModel`だけです。プロバイダーの要件に応じて、フックを段階的に追加してください。

    現在では、共有ヘルパービルダーが最も一般的なリプレイ／ツール互換性ファミリーを網羅しているため、通常、Pluginで各フックを1つずつ手動接続する必要はありません。

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

    現在利用可能なリプレイファミリー：

    | ファミリー | 接続される機能 | 同梱例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI互換トランスポート向けの共有OpenAI形式リプレイポリシー。ツール呼び出しIDのサニタイズ、アシスタント優先順序の修正、トランスポートで必要な場合の汎用Geminiターン検証を含む | `moonshot`、`ollama`、`xai`、`zai` |
    | `anthropic-by-model` | `modelId`で選択されるClaude対応リプレイポリシー。解決されたモデルが実際にClaude IDの場合にのみ、AnthropicメッセージトランスポートへClaude固有の思考ブロッククリーンアップを適用する | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model`と同じモデル別Claudeポリシーに加え、ベンダーネイティブIDを維持する必要があるトランスポート向けに、ツール呼び出しIDのサニタイズとネイティブAnthropicツール使用IDの保持を行う | `anthropic-vertex`、`clawrouter` |
    | `google-gemini` | ネイティブGeminiリプレイポリシーと、ブートストラップリプレイのサニタイズ。共有ファミリーでは、テキスト出力のGemini CLIにタグ付き推論を使用する。直接接続する`google`プロバイダーは、Gemini APIの思考がネイティブ思考パーツとして届くため、`resolveReasoningOutputMode`を`native`に上書きする。 | `google`、`google-gemini-cli` |
    | `passthrough-gemini` | OpenAI互換プロキシトランスポート経由で実行されるGeminiモデル向けの、Gemini思考シグネチャのサニタイズ。ネイティブGeminiリプレイ検証やブートストラップの書き換えは有効にしない | `openrouter`、`kilocode`、`opencode`、`opencode-go` |
    | `hybrid-anthropic-openai` | 1つのPlugin内でAnthropicメッセージとOpenAI互換モデルのサーフェスを組み合わせるプロバイダー向けのハイブリッドポリシー。オプションのClaude限定思考ブロック除去はAnthropic側だけに適用される | `minimax` |

    現在利用可能なストリームファミリー：

    | ファミリー | 接続される機能 | 同梱例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパスでのGemini思考ペイロードの正規化 | `google`、`google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパスでのKilo推論ラッパー。`kilo/auto`およびサポート対象外のプロキシ推論IDでは、挿入される思考を省略する | `kilocode` |
    | `moonshot-thinking` | 設定と`/think`レベルからMoonshotのバイナリ形式ネイティブ思考ペイロードへマッピングする | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパスでMiniMax高速モード用にモデルを書き換える | `minimax`、`minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブOpenAI/Codex Responsesラッパー：帰属ヘッダー、`/fast`／`serviceTier`、テキスト詳細度、ネイティブCodexウェブ検索、推論互換ペイロードの整形、Responsesコンテキスト管理 | `openai` |
    | `openrouter-thinking` | プロキシルート向けのOpenRouter推論ラッパー。サポート対象外モデルと`auto`の省略処理を一元的に行う | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されていない限りツールストリーミングを使用するZ.AIなどのプロバイダー向けに、`tool_stream`ラッパーをデフォルトで有効化する | `zai` |

    <Accordion title="ファミリービルダーを支えるSDK接続面">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および低レベルのリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Geminiリプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と、エンドポイント／モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)`に加え、共有OpenAI/Codexラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messagesの思考プリフィルクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、プレーンテキストのツール呼び出し互換処理（`createPlainTextToolCallCompatWrapper`）、共有プロキシ／プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - プロバイダーのホットパス向けの軽量ペイロードおよびイベントラッパー。`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)`、`setQwenChatTemplateThinking(...)`を含みます。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`、および基盤となるプロバイダースキーマヘルパー。

      Geminiファミリーのプロバイダーでは、推論出力モードをトランスポートに合わせてください。直接接続するGoogle Gemini APIプロバイダーでは`native`推論出力を使用し、`<think>`／`<final>`プロンプトディレクティブを追加せずにOpenClawがネイティブ思考パーツを処理できるようにします。最終的なJSON／テキスト応答を解析するテキスト専用のGemini CLI形式バックエンドでは、共有の`google-gemini`タグ付き規約を維持できます。

      一部のストリームヘルパーは、意図的にプロバイダー内に留められています。`@openclaw/anthropic-provider`は、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および低レベルのAnthropicラッパービルダーを、独自の公開`api.ts`／`contract-api.ts`接続面に保持しています。これらはClaude OAuthベータ処理と`context1m`のゲーティングを組み込んでいるためです。同様に、xAI PluginもネイティブxAI Responsesの整形を独自の`wrapStreamFn`内に保持しています（`/fast`エイリアス、デフォルトの`tool_stream`、サポート対象外の厳格ツール設定のクリーンアップ、xAI固有の推論ペイロード除去）。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダー）と`@openclaw/openrouter-provider`（プロバイダービルダーおよびオンボーディング／設定ヘルパー）にも適用されています。
    </Accordion>

    <Tabs>
      <Tab title="トークン交換">
        各推論呼び出しの前にトークン交換が必要なプロバイダーの場合：

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
        カスタムリクエストヘッダーまたは本文の変更が必要なプロバイダーの場合：

        ```typescript
        // wrapStreamFnはctx.streamFnから派生したStreamFnを返す
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
      <Tab title="ネイティブトランスポートの識別情報">
        汎用HTTPまたはWebSocketトランスポートで、ネイティブのリクエスト／セッションヘッダーまたはメタデータを必要とするプロバイダーの場合：

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

        `resolveUsageAuth` には3つの結果があります。プロバイダーに使用量/請求用の
        認証情報がある場合は、
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` を返します
        （省略可能なフィールドは、解決済みプロファイルの非機密プランメタデータを
        `fetchUsageSnapshot` に渡します）。プロバイダーが使用量認証を確実に処理したものの、
        使用可能な使用量トークンがなく、OpenClaw が汎用の
        APIキー/OAuth フォールバックをスキップする必要がある場合にのみ、
        `{ handled: true }` を返します。プロバイダーがリクエストを処理せず、
        OpenClaw が汎用フォールバックを続行する必要がある場合は、`null` または
        `undefined` を返します。

        `contracts.usageProviders` でプロバイダーIDを宣言します。そのマニフェスト契約と
        **両方**のフックが存在する場合、OpenClaw は無関係なプロバイダーPluginを
        読み込むことなく、そのプロバイダーを使用量収集に自動的に含めます。
        コアの許可リストを更新する必要はありません。
        `fetchUsageSnapshot` は、プロバイダーに依存しない共通形式を返します:

        - `plan`: プロバイダーが報告するサブスクリプションまたはキーのラベル
        - `windows`: 使用率として表される、リセット可能なクォータ期間
        - `billing`: 型付きの `balance`、`spend`、または `budget` エントリ。`unit` には
          ISO通貨、または `credits` などのプロバイダー単位を指定可能
        - `summary`: これらの構造化フィールドに収まらない、簡潔なプロバイダー固有の
          コンテキスト

        通貨の意味を正確に維持してください。上流の契約にそう明記されていない限り、
        プロバイダークレジットはUSDではありません。
        `fetchUsageSnapshot` のみを実装するPluginは、明示的または合成された呼び出し元からは
        引き続き利用できますが、自動検出されません。これは、OpenClaw がその使用量認証情報を
        解決できないためです。
      </Tab>
    </Tabs>

    <Accordion title="一般的なプロバイダーフック">
      OpenClaw は、モデル/プロバイダーPluginのフックをおおむね次の順序で呼び出します。
      ほとんどのプロバイダーが使用するのは2〜3個だけです。これは完全な `ProviderPlugin`
      契約ではありません。現在の正確なフック一覧とフォールバックに関する注記については、
      [内部構造: プロバイダーランタイム
      フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、
      OpenClaw が呼び出さなくなった互換性専用のプロバイダーフィールドは、
      ここには記載されていません。

      | フック | 使用する場合 |
      | --- | --- |
      | `catalog` | モデルカタログまたはベースURLのデフォルト |
      | `applyConfigDefaults` | 設定の具体化時に適用する、プロバイダー所有のグローバルデフォルト |
      | `normalizeModelId` | 検索前に行う、レガシー/プレビュー版モデルIDのエイリアス整理 |
      | `normalizeTransport` | 汎用モデル組み立て前に行う、プロバイダーファミリーの `api` / `baseUrl` 整理 |
      | `normalizeConfig` | `models.providers.<id>` 設定の正規化 |
      | `applyNativeStreamingUsageCompat` | 設定プロバイダー向けのネイティブストリーミング使用量互換書き換え |
      | `resolveConfigApiKey` | プロバイダー所有の環境マーカー認証の解決 |
      | `resolveSyntheticAuth` | ローカル/セルフホストまたは設定ベースの合成認証 |
      | `resolveExternalAuthProfiles` | CLI/アプリ管理の認証情報に対する、プロバイダー所有の外部認証プロファイルのオーバーレイ |
      | `shouldDeferSyntheticProfileAuth` | 合成された保存済みプロファイルのプレースホルダーを環境/設定認証より下位にする |
      | `resolveDynamicModel` | 任意の上流モデルIDの受け入れ |
      | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | `normalizeResolvedModel` | ランナー実行前のトランスポート書き換え |
      | `normalizeToolSchemas` | 登録前に行う、プロバイダー所有のツールスキーマ整理 |
      | `inspectToolSchemas` | プロバイダー所有のツールスキーマ診断 |
      | `resolveReasoningOutputMode` | タグ付き推論出力とネイティブ推論出力の契約 |
      | `prepareExtraParams` | デフォルトのリクエストパラメーター |
      | `createStreamFn` | 完全にカスタムな StreamFn トランスポート |
      | `wrapStreamFn` | 通常のストリーム経路に対するカスタムヘッダー/本文ラッパー |
      | `resolveTransportTurnState` | ターンごとのネイティブヘッダー/メタデータ |
      | `resolveWebSocketSessionPolicy` | ネイティブWSセッションヘッダー/クールダウン |
      | `formatApiKey` | カスタムランタイムトークン形式 |
      | `refreshOAuth` | カスタムOAuth更新 |
      | `buildAuthDoctorHint` | 認証修復のガイダンス |
      | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷分類 |
      | `isCacheTtlEligible` | プロンプトキャッシュTTLの適用判定 |
      | `buildMissingAuthMessage` | 認証情報不足時のカスタムヒント |
      | `augmentModelCatalog` | 前方互換用の合成行（非推奨 - `registerModelCatalogProvider` を推奨） |
      | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | `isBinaryThinking` | 思考のオン/オフに関するバイナリ互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `supportsXHighThinking` | `xhigh` 推論サポートの互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `resolveDefaultThinkingLevel` | デフォルトの `/think` ポリシー互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `isModernModelRef` | ライブ/スモークテスト用モデルの照合 |
      | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | `createEmbeddingProvider` | メモリ/検索向けのプロバイダー所有埋め込みアダプター |
      | `buildReplayPolicy` | カスタムのトランスクリプト再生/Compactionポリシー |
      | `sanitizeReplayHistory` | 汎用整理後に行う、プロバイダー固有の再生書き換え |
      | `validateReplayTurns` | 組み込みランナー実行前の厳格な再生ターン検証 |
      | `onModelSelected` | 選択後のコールバック（例: テレメトリ） |

      ランタイムのフォールバックに関する注記:

      - `normalizeConfig` はプロバイダーIDごとに所有Pluginを1つ解決し（バンドル済みプロバイダーを優先し、次に一致するランタイムPlugin）、そのフックだけを呼び出します。他のプロバイダーを横断して走査することはありません。Google 独自の `normalizeConfig` フックが `google` / `google-vertex` / `google-antigravity` の設定エントリを正規化しており、別個のコアフォールバックではありません。
      - `resolveConfigApiKey` は、公開されている場合にプロバイダーフックを使用します。Amazon Bedrock はAWS環境マーカーの解決をそのプロバイダーPlugin内に保持します。ランタイム認証自体は、`auth: "aws-sdk"` が設定されている場合、引き続きAWS SDKのデフォルトチェーンを使用します。
      - `resolveThinkingProfile(ctx)` は、選択された `provider`、`modelId`、省略可能な統合済みの `reasoning` カタログヒント、および省略可能な統合済みモデルの `compat` 情報を受け取ります。`compat` は、プロバイダーの思考UI/プロファイルを選択する目的にのみ使用してください。
      - `resolveSystemPromptContribution` を使用すると、プロバイダーはモデルファミリー向けにキャッシュを考慮したシステムプロンプトのガイダンスを挿入できます。動作が1つのプロバイダー/モデルファミリーに属し、安定部分/動的部分のキャッシュ分割を維持する必要がある場合は、従来のPlugin全体に適用される `before_prompt_build` フックよりもこちらを優先してください。

    </Accordion>

  </Step>

  <Step title="追加機能を追加する（省略可能）">
    ### ステップ5: 追加機能を追加する

    プロバイダーPluginは、テキスト推論に加えて、埋め込み、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    Web取得、Web検索を登録できます。OpenClaw はこれを
    **ハイブリッド機能**Pluginに分類します。これは企業Pluginで推奨されるパターン
    （ベンダーごとに1つのPlugin）です。
    [内部構造: 機能の所有権](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各機能を `register(api)` 内で
    登録します。必要なタブだけを選択してください:

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

        プロバイダーのHTTP障害には `assertOkOrThrowProviderError(...)` を使用してください。
        これにより、Plugin間で上限付きのエラー本文読み取り、JSONエラー解析、
        リクエストIDサフィックスを共有できます。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を推奨します。共有ヘルパーが
        プロキシの取得、再接続のバックオフ、切断時のフラッシュ、準備完了ハンドシェイク、
        音声のキューイング、切断イベントの診断を処理します。Plugin側では
        上流イベントのマッピングだけを行います。

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

        バッチ STT プロバイダーが multipart 音声を POST する場合は、
        `openclaw/plugin-sdk/provider-http` の
        `buildAudioTranscriptionFormData(...)` を使用してください。このヘルパーは、
        互換性のある文字起こし API のために M4A 形式のファイル名が必要な AAC
        アップロードを含め、アップロードファイル名を正規化します。
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
            handlesInputAudioBargeIn: true,
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

        ブラウザーおよびネイティブの Talk クライアントに、有効なモード、
        トランスポート、音声形式、機能フラグを `talk.catalog` が公開できるように、
        `capabilities` を宣言します。人間がアシスタントの音声再生に割り込んだことを
        トランスポートが検出でき、プロバイダーがアクティブな音声応答の切り詰めまたは
        クリアをサポートする場合は、`handleBargeIn` を実装します。
        `submitToolResult` は、同期送信の場合は `void` を返すことができ、
        プロバイダーブリッジが公開できる非同期の完了境界の場合は
        `Promise<void>` を返すことができます。Gateway リレーセッションは、
        最終結果を確定するか関連する実行をクリアする前に、この Promise を待機します。
        送信に失敗した場合は reject してください。
        プロバイダーが `options.suppressResponse` に従えない場合は、
        `supportsToolResultSuppression: false` を設定します。これにより OpenClaw は、
        内部の強制コンサルトおよびキャンセル結果で抑制を使用せず、応答を暗黙に開始する
        代わりに、抑制された結果を直接要求するリクエストを拒否します。
        `createRealtimeVoiceBridgeSession` の利用側も同様に、`onToolCall` から
        Promise を返すことができます。同期的な throw と reject は、
        セッションの `onError` コールバックにルーティングされます。
        プロバイダーの VAD が `onClearAudio("barge-in")` を呼び出して割り込みを
        確認する場合にのみ、`handlesInputAudioBargeIn` を設定します。このフラグを
        省略したプロバイダーでは、OpenClaw のローカル入力音声フォールバック検出が
        使用されます。
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

        認証情報を意図的に必要としないローカルまたはセルフホスト型の
        メディアプロバイダーは、`resolveAuth` を公開して `kind: "none"` を
        返すことができます。明示的にオプトインしていないプロバイダーについては、
        OpenClaw は引き続き通常の認証ゲートを維持します。既存のプロバイダーは
        `req.apiKey` を引き続き読み取れますが、新しいプロバイダーでは
        `req.auth` を優先してください。

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

        `contracts.embeddingProviders` に同じ ID を宣言します。これは、
        メモリ検索を含む、再利用可能なベクトル生成のための汎用埋め込み契約です。
        `registerMemoryEmbeddingProvider(...)` は、既存のメモリ固有アダプター向けの
        非推奨の互換機能です。
      </Tab>
      <Tab title="Image and video generation">
        画像および動画の機能では、**モード対応**の構造を使用します。画像プロバイダーは、
        必須の `generate` および `edit` 機能ブロックを宣言し、動画プロバイダーは
        `generate`、`imageToVideo`、`videoToVideo` を宣言します。
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` のような
        フラットな集約フィールドだけでは、変換モードのサポートや無効化されたモードを
        明確に通知できません。音楽生成も同じ `generate` / `edit` パターンに従います。

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
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        両方のプロバイダー種別で `capabilities` が必須です。`edit` および
        動画変換ブロック（`imageToVideo`、`videoToVideo`）には、常に明示的な
        `enabled` フラグが必要です。

        一覧に含まれるモデルの静的なモードまたは機能がプロバイダーのデフォルトと
        異なる場合は、`catalogByModel` を使用します。このメタデータにより、
        プロバイダーコードを呼び出すことなく、`video_generate action=list` と
        モデルカタログを正確に保てます。リクエスト時の機能検索と適用は、引き続き
        `resolveModelCapabilities` および `generateVideo` が担います。
        可能な場合は、両方のパスで同じ機能定数を再利用してください。
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

        両方のプロバイダー種別は、同じ認証情報接続構造を共有します。
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue`、`createTool` はすべて
        必須です。
      </Tab>
    </Tabs>

  </Step>

  <Step title="Test">
    ### ステップ 6：テスト

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

プロバイダー Plugin は、他の外部コード Plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` は、Plugin パッケージではなく Skills
フォルダーを公開するための別のコマンドです。ここでは使用しないでください。

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

`catalog.order` は、組み込みプロバイダーに対してカタログがマージされるタイミングを
制御します。

| 順序      | タイミング         | ユースケース                                      |
| --------- | ------------------ | ------------------------------------------------- |
| `simple`  | 最初のパス         | 単純な API キープロバイダー                       |
| `profile` | simple の後        | 認証プロファイルによって制限されるプロバイダー    |
| `paired`  | profile の後       | 関連する複数のエントリを生成                      |
| `late`    | 最後のパス         | 既存のプロバイダーを上書き（競合時に優先）        |

## 次のステップ

- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - Plugin がチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK の概要](/ja-JP/plugins/sdk-overview) - サブパスインポートの完全なリファレンス
- [Plugin の内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細と同梱例

## 関連項目

- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [チャンネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)

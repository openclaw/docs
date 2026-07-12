---
read_when:
    - 新しいモデルプロバイダー Plugin を構築する場合
    - OpenClaw に OpenAI 互換プロキシまたはカスタム LLM を追加する場合
    - プロバイダーの認証、カタログ、ランタイムフックを理解する必要があります
sidebarTitle: Provider plugins
summary: OpenClaw向けモデルプロバイダーPluginの構築手順ガイド
title: プロバイダー Plugin の構築
x-i18n:
    generated_at: "2026-07-12T14:43:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

モデルプロバイダー（LLM）を OpenClaw に追加するプロバイダー Plugin を構築します。モデル
カタログ、API キー認証、動的モデル解決を実装します。

<Info>
  OpenClaw の Plugin が初めての場合は、まずパッケージ構造とマニフェストの設定について
  [はじめに](/ja-JP/plugins/building-plugins)を参照してください。
</Info>

<Tip>
  プロバイダー Plugin は、OpenClaw の通常の推論ループにモデルを追加します。モデルを、
  スレッド、Compaction、またはツールイベントを管理するネイティブエージェントデーモン経由で
  実行する必要がある場合は、デーモンプロトコルの詳細をコアに組み込むのではなく、
  プロバイダーを[エージェントハーネス](/ja-JP/plugins/sdk-agent-harness)と組み合わせてください。
</Tip>

## チュートリアル

<Steps>
  <Step title="パッケージとマニフェスト">
    ### ステップ 1：パッケージとマニフェスト

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
      "description": "Acme AI モデルプロバイダー",
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
          "choiceLabel": "Acme AI API キー",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API キー"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars`を使用すると、OpenClaw は Plugin のランタイムを
    読み込まずに認証情報を検出できます。プロバイダーのバリアントが別のプロバイダー ID の
    認証を再利用する場合は、`providerAuthAliases`を追加します。`modelSupport`は
    省略可能であり、ランタイムフックが存在する前に、`acme-large`のような短縮モデル ID から
    プロバイダー Plugin を OpenClaw が自動読み込みできるようにします。`package.json`内の
    `openclaw.compat`と`openclaw.build`は、ClawHub への公開に必須です
    （`openclaw.compat.pluginApi`と`openclaw.build.openclawVersion`が
    2 つの必須フィールドです。`minGatewayVersion`を省略した場合は、
    `openclaw.install.minHostVersion`が使用されます）。

  </Step>

  <Step title="プロバイダーを登録する">
    最小構成のテキストプロバイダーには、`id`、`label`、`auth`、`catalog`が必要です。
    `catalog`はプロバイダーが所有するランタイム／設定フックです。ベンダーのライブ API を
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

    `registerModelCatalogProvider`は、一覧／ヘルプ／選択 UI 用の新しい
    コントロールプレーンカタログサーフェスで、`text`、`voice`、`image_generation`、
    `video_generation`、`music_generation`の行に対応します。ベンダーエンドポイントの
    呼び出しとレスポンスのマッピングは Plugin 内に保持してください。共有行の形式、
    ソースラベル、ヘルプのレンダリングは OpenClaw が管理します。

    これで動作するプロバイダーが完成します。ユーザーは
    `openclaw onboard --acme-ai-api-key <key>`を実行し、
    `acme-ai/acme-large`をモデルとして選択できるようになります。

    ### ライブモデル検出

    プロバイダーが`/models`形式の API を公開している場合は、プロバイダー固有の
    エンドポイントと行の投影処理を Plugin 内に保持し、共有フェッチライフサイクルには
    `openclaw/plugin-sdk/provider-catalog-live-runtime`を使用します。このヘルパーにより、
    ガード付き HTTP フェッチ、プロバイダー認証ヘッダー、構造化 HTTP エラー、TTL キャッシュ、
    静的フォールバック動作を利用でき、プロバイダーポリシーを OpenClaw コアに
    組み込む必要がありません。

    ライブ API が、プロバイダー所有の静的カタログ行のうち現在利用可能なものだけを
    通知する場合は、`buildLiveModelProviderConfig`を使用します。

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

    プロバイダー API がより詳細なメタデータを返し、Plugin 自身で行を OpenClaw の
    モデル定義に投影する必要がある場合は、`getCachedLiveProviderModelRows`を使用します。

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

    `run`は認証を必須とし、使用可能な認証情報がない場合は`null`を返すようにしてください。
    セットアップ、ドキュメント、テスト、選択 UI がライブネットワークアクセスに依存しないよう、
    オフラインの`staticRun`または静的フォールバックを保持してください。モデル一覧に必要な
    鮮度に適した TTL を使用し、リクエスト時のファイルシステムポーリングは避けてください。
    また、上流レスポンスが OpenAI 互換の`{ data: [{ id, object }] }`形式でない場合にのみ、
    プロバイダー固有の`readRows`／`readModelId`を渡してください。

    上流プロバイダーが OpenClaw と異なる制御トークンを使用する場合は、ストリーム経路を
    置き換えるのではなく、小規模な双方向テキスト変換を追加します。

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

    `input`は、転送前に最終的なシステムプロンプトとテキストメッセージの内容を
    書き換えます。`output`は、OpenClaw が自身の制御マーカーを解析する前、または
    チャネルに配信する前に、アシスタントのテキスト差分と最終テキストを書き換えます。

    API キー認証と単一のカタログベースランタイムを備えたテキストプロバイダーを 1 つだけ
    登録する同梱プロバイダーには、より限定的な`defineSingleProviderPluginEntry(...)`
    ヘルパーを使用してください。

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI モデルプロバイダー",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API キー",
            hint: "Acme AI ダッシュボードから取得した API キー",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Acme AI API キーを入力してください",
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

    `buildProvider` は、OpenClaw が実際のプロバイダー認証を解決できる場合に使用される
    ライブカタログのパスです。プロバイダー固有の検出を実行できます。
    `buildStaticProvider` は、認証を設定する前でも安全に表示できるオフライン行にのみ
    使用してください。認証情報を要求したり、ネットワークリクエストを行ったりしてはなりません。
    現在、OpenClaw の `models list --all` 表示が静的カタログを実行するのは、
    バンドルされたプロバイダー Plugin に対してのみです。その際、設定と環境変数は空で、
    エージェント／ワークスペースのパスはありません。

    オンボーディング中に認証フローで `models.providers.*`、エイリアス、
    およびエージェントのデフォルトモデルも更新する必要がある場合は、
    `openclaw/plugin-sdk/provider-onboard` のプリセットヘルパーを使用してください。
    最も限定的なヘルパーは、
    `createDefaultModelPresetAppliers(...)`、
    `createDefaultModelsPresetAppliers(...)`、および
    `createModelCatalogPresetAppliers(...)` です。

    プロバイダーのネイティブエンドポイントが通常の `openai-completions`
    トランスポートでストリーミングされる使用量ブロックをサポートしている場合は、
    プロバイダー ID のチェックをハードコードする代わりに、
    `openclaw/plugin-sdk/provider-catalog-shared` の共有カタログヘルパーを使用してください。
    `supportsNativeStreamingUsageCompat(...)` と
    `applyProviderNativeStreamingUsageCompat(...)` はエンドポイントの機能マップから
    サポート状況を検出するため、Plugin がカスタムプロバイダー ID を使用している場合でも、
    ネイティブの Moonshot／DashScope 形式のエンドポイントはオプトインできます。

    上記のライブ検出例は、`/models` 形式のプロバイダー API を対象としています。
    この検出処理は、使用可能な認証がある場合に限定して `catalog.run` 内で行い、
    オフラインカタログ生成用の `staticRun` ではネットワークを使用しないでください。

  </Step>

  <Step title="動的モデル解決を追加する">
    プロバイダーが任意のモデル ID を受け付ける場合（プロキシやルーターなど）は、
    `resolveDynamicModel` を追加します。

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

    解決にネットワーク呼び出しが必要な場合は、非同期ウォームアップに
    `prepareDynamicModel` を使用してください。完了後、`resolveDynamicModel` が再度実行されます。

  </Step>

  <Step title="ランタイムフックを追加する（必要に応じて）">
    ほとんどのプロバイダーに必要なのは `catalog` と `resolveDynamicModel` だけです。
    プロバイダーの要件に応じて、フックを段階的に追加してください。

    現在、共有ヘルパービルダーは最も一般的なリプレイ／ツール互換ファミリーを
    カバーしているため、通常、Plugin で各フックを一つずつ手動接続する必要はありません。

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

    | ファミリー | 接続される機能 | バンドル例 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 互換トランスポート向けの共有 OpenAI 形式リプレイポリシー。ツール呼び出し ID のサニタイズ、アシスタント先頭の順序修正、およびトランスポートで必要な場合の汎用 Gemini ターン検証を含む | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` によって選択される Claude 対応リプレイポリシー。これにより、解決されたモデルが実際に Claude ID である場合にのみ、Anthropic メッセージトランスポートで Claude 固有の思考ブロッククリーンアップが行われる | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model` と同じモデル別 Claude ポリシーに加え、ベンダーネイティブ ID を維持する必要があるトランスポート向けに、ツール呼び出し ID のサニタイズとネイティブ Anthropic ツール使用 ID の保持を行う | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | ネイティブ Gemini リプレイポリシーとブートストラップリプレイのサニタイズ。共有ファミリーでは、テキスト出力の Gemini CLI にタグ付き推論を使用する。直接の `google` プロバイダーでは、Gemini API の思考がネイティブ思考パートとして届くため、`resolveReasoningOutputMode` を `native` にオーバーライドする。 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 互換プロキシトランスポート経由で実行される Gemini モデル向けの Gemini 思考署名サニタイズ。ネイティブ Gemini リプレイ検証やブートストラップ書き換えは有効にしない | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 1 つの Plugin 内で Anthropic メッセージと OpenAI 互換モデルサーフェスを組み合わせるプロバイダー向けのハイブリッドポリシー。オプションの Claude 専用思考ブロック破棄は Anthropic 側に限定される | `minimax` |

    現在利用可能なストリームファミリー：

    | ファミリー | 接続される機能 | バンドル例 |
    | --- | --- | --- |
    | `google-thinking` | 共有ストリームパスでの Gemini 思考ペイロードの正規化 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 共有プロキシストリームパス上の Kilo 推論ラッパー。`kilo/auto` および未サポートのプロキシ推論 ID では、注入される思考をスキップする | `kilocode` |
    | `moonshot-thinking` | 設定と `/think` レベルに基づく Moonshot バイナリネイティブ思考ペイロードのマッピング | `moonshot` |
    | `minimax-fast-mode` | 共有ストリームパスでの MiniMax 高速モードモデルの書き換え | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 共有ネイティブ OpenAI／Codex Responses ラッパー：帰属ヘッダー、`/fast`／`serviceTier`、テキスト詳細度、ネイティブ Codex ウェブ検索、推論互換ペイロード整形、および Responses コンテキスト管理 | `openai` |
    | `openrouter-thinking` | プロキシルート向けの OpenRouter 推論ラッパー。未サポートモデル／`auto` のスキップを一元的に処理する | `openrouter` |
    | `tool-stream-default-on` | 明示的に無効化されない限りツールストリーミングを使用する Z.AI などのプロバイダー向け、デフォルト有効の `tool_stream` ラッパー | `zai` |

    <Accordion title="ファミリービルダーを支える SDK 境界">
      各ファミリービルダーは、同じパッケージからエクスポートされる低レベルの公開ヘルパーで構成されています。プロバイダーが共通パターンから外れる必要がある場合に利用できます。

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`、`buildProviderReplayFamilyHooks(...)`、および生のリプレイビルダー（`buildOpenAICompatibleReplayPolicy`、`buildAnthropicReplayPolicyForModel`、`buildGoogleGeminiReplayPolicy`、`buildHybridAnthropicOrOpenAIReplayPolicy`）。Gemini リプレイヘルパー（`sanitizeGoogleGeminiReplayHistory`、`resolveTaggedReasoningOutputMode`）と、エンドポイント／モデルヘルパー（`resolveProviderEndpoint`、`normalizeProviderId`、`normalizeGooglePreviewModelId`）もエクスポートします。
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`、`buildProviderStreamFamilyHooks(...)`、`composeProviderStreamWrappers(...)` に加え、共有 OpenAI／Codex ラッパー（`createOpenAIAttributionHeadersWrapper`、`createOpenAIFastModeWrapper`、`createOpenAIServiceTierWrapper`、`createOpenAIResponsesContextManagementWrapper`、`createCodexNativeWebSearchWrapper`）、DeepSeek V4 OpenAI 互換ラッパー（`createDeepSeekV4OpenAICompatibleThinkingWrapper`）、Anthropic Messages 思考プリフィルのクリーンアップ（`createAnthropicThinkingPrefillPayloadWrapper`）、プレーンテキストツール呼び出し互換（`createPlainTextToolCallCompatWrapper`）、および共有プロキシ／プロバイダーラッパー（`createOpenRouterWrapper`、`createToolStreamWrapper`、`createMinimaxFastModeWrapper`）。
      - `openclaw/plugin-sdk/provider-stream-shared` - ホットなプロバイダーパス向けの軽量ペイロード／イベントラッパー。`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPayloadPatchStreamWrapper`、`createPlainTextToolCallCompatWrapper`、`normalizeOpenAICompatibleReasoningPayload(...)`、`setQwenChatTemplateThinking(...)` を含む。
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`、および基盤となるプロバイダースキーマヘルパー。

      Gemini ファミリーのプロバイダーでは、推論出力モードをトランスポートと
      一致させてください。Google Gemini API を直接使用するプロバイダーでは、
      OpenClaw が `<think>`／`<final>` プロンプトディレクティブを追加せずに
      ネイティブ思考パートを使用できるよう、`native` 推論出力を使用する必要があります。
      最終的な JSON／テキスト応答を解析するテキスト専用の Gemini CLI 形式バックエンドでは、
      共有 `google-gemini` のタグ付きコントラクトを維持できます。

      一部のストリームヘルパーは、意図的にプロバイダー内に留められています。`@openclaw/anthropic-provider` は、`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`、および低レベルの Anthropic ラッパービルダーを独自の公開 `api.ts`／`contract-api.ts` 境界に保持します。これは、これらが Claude OAuth ベータ処理と `context1m` ゲーティングをエンコードしているためです。同様に、xAI Plugin はネイティブ xAI Responses の整形を独自の `wrapStreamFn` 内に保持します（`/fast` エイリアス、デフォルトの `tool_stream`、未サポートの厳格ツールのクリーンアップ、xAI 固有の推論ペイロード削除）。

      同じパッケージルートパターンは、`@openclaw/openai-provider`（プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダービルダー）と `@openclaw/openrouter-provider`（プロバイダービルダー、およびオンボーディング／設定ヘルパー）にも使用されています。
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
      <Tab title="ネイティブトランスポート ID">
        汎用 HTTP または WebSocket トランスポートでネイティブのリクエスト／セッションヘッダーや
        メタデータが必要なプロバイダーの場合：

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

        `resolveUsageAuth` には 3 つの結果があります。プロバイダーに使用量/請求用の認証情報がある場合は、
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` を返します
        （省略可能なフィールドは、解決済みプロファイルの非機密なプランメタデータを
        `fetchUsageSnapshot` に渡します）。プロバイダーが使用量の認証を確実に処理したものの、
        使用可能な使用量トークンがなく、OpenClaw が汎用の API キー/OAuth
        フォールバックをスキップする必要がある場合にのみ、
        `{ handled: true }` を返します。プロバイダーがリクエストを処理せず、
        OpenClaw が汎用フォールバックを続行すべき場合は、`null` または `undefined` を返します。

        `contracts.usageProviders` でプロバイダー ID を宣言します。そのマニフェスト契約と
        **両方**のフックが存在する場合、OpenClaw は無関係なプロバイダー
        Plugin を読み込むことなく、そのプロバイダーを使用量収集に自動的に含めます。
        コアの許可リストを更新する必要はありません。
        `fetchUsageSnapshot` は、共有のプロバイダー非依存形式を返します:

        - `plan`: プロバイダーから報告されたサブスクリプションまたはキーのラベル
        - `windows`: 使用済みの割合として表される、リセット可能なクォータ期間
        - `billing`: 型付きの `balance`、`spend`、または `budget` エントリ。`unit` には
          ISO 通貨、または `credits` などのプロバイダー単位を指定できます
        - `summary`: これらの構造化フィールドに収まらない、簡潔なプロバイダー固有のコンテキスト

        通貨のセマンティクスは厳密に維持してください。上流の契約に明記されていない限り、
        プロバイダーのクレジットは USD ではありません。
        `fetchUsageSnapshot` のみを実装する Plugin は、明示的/合成的な呼び出し元では
        引き続き利用できますが、OpenClaw がその使用量用認証情報を解決できないため、
        自動検出されません。
      </Tab>
    </Tabs>

    <Accordion title="一般的なプロバイダーフック">
      OpenClaw は、モデル/プロバイダー Plugin に対して、おおむね次の順序でフックを呼び出します。
      ほとんどのプロバイダーが使用するのは 2～3 個だけです。これは完全な `ProviderPlugin`
      契約ではありません。現在の正確なフック一覧とフォールバックに関する注記については、
      [内部構造: プロバイダーランタイム
      フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
      `ProviderPlugin.capabilities` や `suppressBuiltInModel` など、OpenClaw が呼び出さなくなった
      互換性専用のプロバイダーフィールドは、ここには記載していません。

      | フック | 使用する場合 |
      | --- | --- |
      | `catalog` | モデルカタログまたはベース URL のデフォルト |
      | `applyConfigDefaults` | 設定の実体化時に適用する、プロバイダー所有のグローバルデフォルト |
      | `normalizeModelId` | 検索前のレガシー/プレビューモデル ID エイリアスの整理 |
      | `normalizeTransport` | 汎用モデルの組み立て前に行う、プロバイダーファミリーの `api` / `baseUrl` の整理 |
      | `normalizeConfig` | `models.providers.<id>` 設定の正規化 |
      | `applyNativeStreamingUsageCompat` | 設定プロバイダー向けのネイティブストリーミング使用量の互換性書き換え |
      | `resolveConfigApiKey` | プロバイダー所有の環境変数マーカー認証の解決 |
      | `resolveSyntheticAuth` | ローカル/セルフホスト、または設定に基づく合成認証 |
      | `resolveExternalAuthProfiles` | CLI/アプリ管理の認証情報用に、プロバイダー所有の外部認証プロファイルをオーバーレイ |
      | `shouldDeferSyntheticProfileAuth` | 合成された保存済みプロファイルのプレースホルダーを、環境変数/設定の認証より後にする |
      | `resolveDynamicModel` | 任意の上流モデル ID の受け入れ |
      | `prepareDynamicModel` | 解決前の非同期メタデータ取得 |
      | `normalizeResolvedModel` | ランナー実行前のトランスポート書き換え |
      | `normalizeToolSchemas` | 登録前の、プロバイダー所有のツールスキーマ整理 |
      | `inspectToolSchemas` | プロバイダー所有のツールスキーマ診断 |
      | `resolveReasoningOutputMode` | タグ付き推論出力とネイティブ推論出力の契約 |
      | `prepareExtraParams` | デフォルトのリクエストパラメーター |
      | `createStreamFn` | 完全にカスタムな StreamFn トランスポート |
      | `wrapStreamFn` | 通常のストリーム経路上のカスタムヘッダー/本文ラッパー |
      | `resolveTransportTurnState` | ターンごとのネイティブヘッダー/メタデータ |
      | `resolveWebSocketSessionPolicy` | ネイティブ WS セッションのヘッダー/クールダウン |
      | `formatApiKey` | カスタムランタイムトークン形式 |
      | `refreshOAuth` | カスタム OAuth 更新 |
      | `buildAuthDoctorHint` | 認証修復のガイダンス |
      | `matchesContextOverflowError` | プロバイダー所有のオーバーフロー検出 |
      | `classifyFailoverReason` | プロバイダー所有のレート制限/過負荷の分類 |
      | `isCacheTtlEligible` | プロンプトキャッシュ TTL のゲーティング |
      | `buildMissingAuthMessage` | カスタムの認証不足ヒント |
      | `augmentModelCatalog` | 将来互換用の合成行（非推奨 - `registerModelCatalogProvider` を推奨） |
      | `resolveThinkingProfile` | モデル固有の `/think` オプションセット |
      | `isBinaryThinking` | バイナリ思考のオン/オフ互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `supportsXHighThinking` | `xhigh` 推論サポートの互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `resolveDefaultThinkingLevel` | デフォルトの `/think` ポリシー互換性（非推奨 - `resolveThinkingProfile` を推奨） |
      | `isModernModelRef` | ライブ/スモークモデルの照合 |
      | `prepareRuntimeAuth` | 推論前のトークン交換 |
      | `resolveUsageAuth` | カスタム使用量認証情報の解析 |
      | `fetchUsageSnapshot` | カスタム使用量エンドポイント |
      | `createEmbeddingProvider` | メモリ/検索向けの、プロバイダー所有の埋め込みアダプター |
      | `buildReplayPolicy` | カスタムのトランスクリプト再生/Compaction ポリシー |
      | `sanitizeReplayHistory` | 汎用整理後のプロバイダー固有の再生書き換え |
      | `validateReplayTurns` | 組み込みランナー実行前の厳密な再生ターン検証 |
      | `onModelSelected` | 選択後のコールバック（例: テレメトリ） |

      ランタイムフォールバックに関する注記:

      - `normalizeConfig` は、プロバイダー ID ごとに 1 つの所有 Plugin（バンドルされたプロバイダーを優先し、次に一致したランタイム Plugin）を解決し、そのフックだけを呼び出します。他のプロバイダーを横断するスキャンはありません。Google 自身の `normalizeConfig` フックが `google` / `google-vertex` / `google-antigravity` の設定エントリを正規化します。これは独立したコアフォールバックではありません。
      - `resolveConfigApiKey` は、公開されている場合にプロバイダーフックを使用します。Amazon Bedrock は AWS 環境変数マーカーの解決を自身のプロバイダー Plugin に保持します。ランタイム認証自体は、`auth: "aws-sdk"` で設定されている場合、引き続き AWS SDK のデフォルトチェーンを使用します。
      - `resolveThinkingProfile(ctx)` は、選択された `provider`、`modelId`、省略可能なマージ済みの `reasoning` カタログヒント、および省略可能なマージ済みモデルの `compat` 情報を受け取ります。`compat` は、プロバイダーの思考 UI/プロファイルを選択するためだけに使用してください。
      - `resolveSystemPromptContribution` を使用すると、プロバイダーはモデルファミリー向けにキャッシュを考慮したシステムプロンプトのガイダンスを注入できます。動作が 1 つのプロバイダー/モデルファミリーに属し、安定/動的キャッシュの分割を維持すべき場合は、レガシーな Plugin 全体の `before_prompt_build` フックよりもこちらを優先してください。

    </Accordion>

  </Step>

  <Step title="追加機能を追加する（省略可）">
    ### ステップ 5: 追加機能を追加する

    プロバイダー Plugin は、テキスト推論に加えて、埋め込み、音声、リアルタイム文字起こし、
    リアルタイム音声、メディア理解、画像生成、動画生成、
    Web 取得、Web 検索を登録できます。OpenClaw はこれを
    **ハイブリッド機能** Plugin として分類します。これは企業 Plugin に推奨されるパターン
    （ベンダーごとに 1 つの Plugin）です。
    [内部構造: 機能の所有権](/ja-JP/plugins/architecture#capability-ownership-model)を参照してください。

    既存の `api.registerProvider(...)` 呼び出しと並べて、各機能を `register(api)` 内で
    登録します。必要なタブのみを選択してください:

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

        プロバイダーの HTTP エラーには `assertOkOrThrowProviderError(...)` を使用してください。
        これにより、Plugin 間で上限付きのエラー本文読み取り、JSON エラー解析、
        リクエスト ID サフィックスが共有されます。
      </Tab>
      <Tab title="リアルタイム文字起こし">
        `createRealtimeTranscriptionWebSocketSession(...)` を推奨します。共有ヘルパーが、
        プロキシの取得、再接続のバックオフ、クローズ時のフラッシュ、準備完了ハンドシェイク、
        音声のキューイング、クローズイベントの診断を処理します。Plugin は
        上流イベントのマッピングのみを行います。

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
        `buildAudioTranscriptionFormData(...)` を使用する必要があります。このヘルパーは、
        互換性のある文字起こし API 向けに M4A 形式のファイル名が必要な AAC アップロードを含め、
        アップロードのファイル名を正規化します。
      </Tab>
      <Tab title="リアルタイム音声">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
        ```
        ```typescript
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
        ```
        ```typescript
            supportsBargeIn: true,
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
        ```
        ```typescript
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
        ```
        ```typescript
            // プロバイダーが複数のツール応答を受け入れる場合にのみ、これを設定します
        ```
        ```typescript
            // 1 回の呼び出し。たとえば、直後の「処理中」応答と、それに続く処理など
        ```
        ```typescript
            // 最終結果。
        ```
        ```typescript
            supportsToolResultContinuation: false,
            connect: async () => {},
        ```
        ```typescript
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
        ```
        ```typescript
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
        ブラウザおよびネイティブの Talk クライアントに対して、`talk.catalog` が有効なモード、
        トランスポート、音声形式、機能フラグを公開できるよう、`capabilities` を宣言します。
        トランスポートが人間によるアシスタント音声再生への割り込みを検出でき、
        プロバイダーがアクティブな音声応答の切り詰めまたはクリアをサポートする場合は、
        `handleBargeIn` を実装します。
        `submitToolResult` は、同期送信の場合は `void`、またはプロバイダー
        ブリッジが公開できる非同期完了境界として `Promise<void>` を返せます。
        Gateway リレーセッションは、最終結果を確認するか、関連付けられた実行をクリアする前に
        その Promise を待機します。送信に失敗した場合は、その Promise を reject してください。
        プロバイダーが `options.suppressResponse` に従えない場合は、
        `supportsToolResultSuppression: false` を設定します。これにより OpenClaw は、
        内部の強制コンサルト結果およびキャンセル結果で抑制を行わず、
        暗黙的に応答を開始する代わりに、直接の抑制付き結果リクエストを拒否します。
        `createRealtimeVoiceBridgeSession` の利用側も同様に、`onToolCall` から
        Promise を返せます。同期的な throw と reject は、セッションの
        `onError` コールバックにルーティングされます。
        プロバイダーの VAD が `onClearAudio("barge-in")` を呼び出して
        割り込みを確認する場合にのみ、`handlesInputAudioBargeIn` を設定します。
        このフラグを省略するプロバイダーでは、OpenClaw のローカル入力音声フォールバック検出が使用されます。
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
        認証情報を意図的に必要としないローカルまたはセルフホスト型のメディアプロバイダーは、
        `resolveAuth` を公開し、`kind: "none"` を返すことができます。
        OpenClaw は、明示的にオプトインしていないプロバイダーに対しては、
        引き続き通常の認証ゲートを維持します。既存のプロバイダーは `req.apiKey` を引き続き参照できますが、
        新しいプロバイダーでは `req.auth` の使用を推奨します。

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

        `contracts.embeddingProviders` で同じ id を宣言します。これは、メモリ検索を含む、再利用可能なベクトル生成のための汎用埋め込み契約です。`registerMemoryEmbeddingProvider(...)` は、既存のメモリ固有アダプターとの互換性のために非推奨となっています。
      </Tab>
      <Tab title="画像と動画の生成">
        画像と動画の機能では、**モード対応**の形式を使用します。画像
        プロバイダーは必須の `generate` および `edit` 機能ブロックを宣言し、
        動画プロバイダーは `generate`、`imageToVideo`、および
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

        `capabilities` は両方のプロバイダー種別で必須です。`edit` と
        動画変換ブロック（`imageToVideo`、`videoToVideo`）には、常に
        明示的な `enabled` フラグが必要です。

        一覧に含まれるモデルの静的なモードまたは機能がプロバイダーの
        デフォルトと異なる場合は、`catalogByModel` を使用します。このメタデータにより、
        プロバイダーコードを呼び出すことなく `video_generate action=list` とモデルカタログの
        正確性が維持されます。リクエスト時の機能検索と適用は、引き続き
        `resolveModelCapabilities` と `generateVideo` が担います。可能な場合は、
        両方の経路で同じ機能定数を再利用してください。
      </Tab>
      <Tab title="Web フェッチと検索">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Acme のレンダリングバックエンドを介してページを取得します。",
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
            description: "Acme Fetch を介してページを取得します。",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          hint: "Acme の検索バックエンドを介してウェブを検索します。",
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
            description: "Acme Search を介してウェブを検索します。",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        両方のプロバイダー種別は、同じ認証情報接続形式を共有します。
        `hint`、`envVars`、`placeholder`、`signupUrl`、`credentialPath`、
        `getCredentialValue`、`setCredentialValue`、`createTool` はすべて
        必須です。
      </Tab>
    </Tabs>

  </Step>

  <Step title="テスト">
    ### ステップ 6: テスト

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // プロバイダー設定オブジェクトを index.ts または専用ファイルからエクスポートします
    import { acmeProvider } from "./provider.js";

    describe("acme-ai プロバイダー", () => {
      it("動的モデルを解決する", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("キーが利用可能な場合はカタログを返す", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("キーがない場合は null カタログを返す", async () => {
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

プロバイダー Plugin は、ほかの外部コード Plugin と同じ方法で公開します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` は、Plugin パッケージではなく skill
フォルダーを公開するための別のコマンドです。ここでは使用しないでください。

## ファイル構成

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers メタデータ
├── openclaw.plugin.json      # プロバイダー認証メタデータを含むマニフェスト
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # テスト
    └── usage.ts              # 使用量エンドポイント（任意）
```

## カタログ順序のリファレンス

`catalog.order` は、組み込みプロバイダーに対してカタログをマージするタイミングを制御します。

| 順序      | タイミング          | ユースケース                                      |
| --------- | ------------------- | ------------------------------------------------- |
| `simple`  | 最初のパス          | 単純な API キープロバイダー                       |
| `profile` | simple の後         | 認証プロファイルを必要とするプロバイダー          |
| `paired`  | profile の後        | 複数の関連エントリを合成                          |
| `late`    | 最後のパス          | 既存のプロバイダーを上書き（競合時に優先）        |

## 次のステップ

- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - Plugin がチャンネルも提供する場合
- [SDK ランタイム](/ja-JP/plugins/sdk-runtime) - `api.runtime` ヘルパー（TTS、検索、サブエージェント）
- [SDK の概要](/ja-JP/plugins/sdk-overview) - サブパスインポートの完全なリファレンス
- [Plugin の内部構造](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) - フックの詳細とバンドル済みの例

## 関連項目

- [Plugin SDK のセットアップ](/ja-JP/plugins/sdk-setup)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [チャンネル Plugin の構築](/ja-JP/plugins/sdk-channel-plugins)

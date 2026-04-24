---
read_when:
    - OpenClawでOpenAIモデルを使いたい場合
    - API keyではなくCodex subscription authを使いたい場合
    - より厳格なGPT-5 agent実行動作が必要な場合
summary: OpenClawでAPI keyまたはCodex subscription経由でOpenAIを使う
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T05:15:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8337990d0de692b32746b05ab344695fc5a54ab3855993ac7795fabf38d4d19d
    source_path: providers/openai.md
    workflow: 15
---

OpenAIは、GPTモデル向けの開発者APIを提供しています。OpenClawは3つのOpenAI系ルートをサポートします。モデルprefixでルートを選択します:

- **API key** — usage-based billing付きの直接OpenAI Platformアクセス（`openai/*` モデル）
- **PI経由のCodex subscription** — subscription access付きのChatGPT/Codexサインイン（`openai-codex/*` モデル）
- **Codex app-server harness** — ネイティブCodex app-server実行（`openai/*` モデル + `agents.defaults.embeddedHarness.runtime: "codex"`）

OpenAIは、OpenClawのような外部ツールやワークフローでのsubscription OAuth利用を明示的にサポートしています。

<Note>
GPT-5.5は現在、OpenClawではsubscription/OAuthルート経由で利用できます:
PIランナーでは `openai-codex/gpt-5.5`、または
Codex app-server harnessでは `openai/gpt-5.5` です。`openai/gpt-5.5` への直接API-keyアクセスは、
OpenAIが公開APIでGPT-5.5を有効化した時点でサポートされます。それまでは
`OPENAI_API_KEY` 構成では `openai/gpt-5.4` のような
API対応モデルを使ってください。
</Note>

## OpenClawの機能カバレッジ

| OpenAI capability         | OpenClaw surface                                           | Status                                                      |
| ------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| Chat / Responses          | `openai/<model>` モデルprovider                            | はい                                                        |
| Codex subscriptionモデル  | `openai-codex/<model>` と `openai-codex` OAuth            | はい                                                        |
| Codex app-server harness  | `openai/<model>` と `embeddedHarness.runtime: codex`      | はい                                                        |
| サーバー側web search      | ネイティブOpenAI Responsesツール                           | はい。web searchが有効でprovider固定がない場合              |
| 画像                      | `image_generate`                                           | はい                                                        |
| 動画                      | `video_generate`                                           | はい                                                        |
| Text-to-speech            | `messages.tts.provider: "openai"` / `tts`                  | はい                                                        |
| バッチspeech-to-text      | `tools.media.audio` / media understanding                  | はい                                                        |
| Streaming speech-to-text  | Voice Call `streaming.provider: "openai"`                  | はい                                                        |
| Realtime voice            | Voice Call `realtime.provider: "openai"` / Control UI Talk | はい                                                        |
| Embeddings                | memory embedding provider                                  | はい                                                        |

## はじめに

好みのauth methodを選んで、セットアップ手順に従ってください。

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **最適なケース:** 直接APIアクセスとusage-based billing。

    <Steps>
      <Step title="API keyを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) でAPI keyを作成またはコピーしてください。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        またはkeyを直接渡します:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 直接OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | OpenAIがAPIでGPT-5.5を有効化した後の将来の直接APIルート | `OPENAI_API_KEY` |

    <Note>
    `openai/*` は、明示的に
    Codex app-server harnessを強制しない限り、直接OpenAI API-keyルートです。GPT-5.5自体は現在subscription/OAuth
    専用です。デフォルトPIランナー経由のCodex OAuthには `openai-codex/*` を使ってください。
    </Note>

    ### Config例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClawは `openai/gpt-5.3-codex-spark` を**公開しません**。live OpenAI API requestはそのモデルを拒否し、現在のCodex catalogもそれを公開していないためです。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適なケース:** 別のAPI keyではなく、自分のChatGPT/Codex subscriptionを使いたい場合。Codex cloudにはChatGPTサインインが必要です。

    <Steps>
      <Step title="Codex OAuthを実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        またはOAuthを直接実行します:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        headlessまたはcallbackに不向きな構成では、localhost browser callbackの代わりにChatGPT device-code flowでサインインするために `--device-code` を追加してください:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルトmodelを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ルート概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI経由のChatGPT/Codex OAuth | Codexサインイン |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    auth/profile commandには引き続き `openai-codex` provider idを使ってください。
    `openai-codex/*` モデルprefixも、Codex OAuth向けの明示的なPIルートです。
    </Note>

    ### Config例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboardingはもはや `~/.codex` からOAuth素材をimportしません。browser OAuth（デフォルト）または上記のdevice-code flowでサインインしてください。OpenClawは得られたcredentialを自身のagent auth storeで管理します。
    </Note>

    ### ステータス表示

    チャット `/status` には、現在の
    sessionで有効なembedded harnessが表示されます。デフォルトのPI harnessは `Runner: pi (embedded)` と表示され、
    別のbadgeは付きません。同梱のCodex app-server harnessが
    選択されている場合、`/status` は `Fast` の横に非PI harness idを追加します。たとえば
    `Fast · codex` のようになります。既存sessionは記録済みharness idを保持するため、
    新しいPI/Codex選択を `/status` に反映したい場合は、`embeddedHarness` を変更した後に `/new` または `/reset` を使ってください。

    ### Context window上限

    OpenClawは、モデルmetadataとランタイムcontext上限を別の値として扱います。

    Codex OAuth経由の `openai-codex/gpt-5.5` では:

    - ネイティブ `contextWindow`: `1000000`
    - デフォルトのランタイム `contextTokens` 上限: `272000`

    実際には、この小さいデフォルト上限のほうがレイテンシと品質の特性が良好です。`contextTokens` で上書きできます:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    ネイティブモデルmetadataを宣言するには `contextWindow` を使ってください。ランタイムcontext budgetを制限するには `contextTokens` を使ってください。
    </Note>

  </Tab>
</Tabs>

## 画像生成

同梱の `openai` pluginは、`image_generate` ツールを通じて画像生成を登録します。
同じ `openai/gpt-image-2` model refを通じて、OpenAI API-key画像生成とCodex OAuth画像
生成の両方をサポートします。

| Capability                | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuthサインイン         |
| Transport                 | OpenAI Images API                  | Codex Responses backend              |
| 1リクエストあたり最大画像数 | 4                                | 4                                    |
| Edit mode                 | 有効（最大5枚のreference image）   | 有効（最大5枚のreference image）     |
| Size override             | 2K/4Kサイズを含めサポート          | 2K/4Kサイズを含めサポート            |
| Aspect ratio / resolution | OpenAI Images APIへは転送されない  | 安全な場合に対応sizeへマッピング     |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
共有ツールparam、provider選択、failover動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAIのtext-to-image生成と画像
編集の両方のデフォルトです。`gpt-image-1` も明示的model overrideとして引き続き使えますが、新しい
OpenAI画像ワークフローでは `openai/gpt-image-2` を使ってください。

Codex OAuthインストールでも、同じ `openai/gpt-image-2` refを維持してください。
`openai-codex` OAuth profileが設定されている場合、OpenClawはその保存済みOAuth
access tokenを解決し、Codex Responses backend経由で画像requestを送信します。その
requestに対して、最初に `OPENAI_API_KEY` を試したり、黙ってAPI keyへフォールバックしたりはしません。
直接OpenAI Images API
ルートを使いたい場合は、`models.providers.openai` に対して明示的にAPI key、
custom base URL、またはAzure endpointを設定してください。
そのcustom image endpointが信頼されたLAN/private address上にある場合は、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` も設定してください。OpenClawは、このオプトインが
存在しない限り、private/internalなOpenAI互換image endpointを引き続きブロックします。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 動画生成

同梱の `openai` pluginは、`video_generate` ツールを通じて動画生成を登録します。

| Capability       | Value                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                                    |
| Mode             | Text-to-video, image-to-video, single-video edit                                   |
| Reference input  | 画像1枚または動画1本                                                               |
| Size override    | サポートあり                                                                       |
| その他override   | `aspectRatio`, `resolution`, `audio`, `watermark` はツールwarning付きで無視される |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
共有ツールparam、provider選択、failover動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5プロンプトcontribution

OpenClawは、providerをまたいでGPT-5ファミリー実行向けに共有のGPT-5 prompt contributionを追加します。これはmodel id単位で適用されるため、`openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`、その他の互換GPT-5 refも同じoverlayを受け取ります。古いGPT-4.xモデルには適用されません。

同梱のネイティブCodex harnessは、Codex app-server developer instruction経由で同じGPT-5動作とheartbeat overlayを使うため、`embeddedHarness.runtime: "codex"` へ強制された `openai/gpt-5.x` sessionでも、残りのharness promptをCodexが所有していても、同じfollow-throughとproactive heartbeatガイダンスが維持されます。

GPT-5 contributionは、persona維持、実行安全性、tool discipline、output shape、completion check、verificationのためのtagged behavior contractを追加します。channel固有のreplyとsilent-message動作は、共有のOpenClaw system promptとoutbound delivery policyに残ります。GPT-5ガイダンスは、一致するmodelでは常に有効です。friendly interaction-style layerは別で、設定可能です。

| Value                  | Effect                                         |
| ---------------------- | ---------------------------------------------- |
| `"friendly"` (default) | friendly interaction-style layerを有効化       |
| `"on"`                 | `"friendly"` のalias                           |
| `"off"`                | friendly style layerのみを無効化               |

<Tabs>
  <Tab title="Config">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
値はランタイムでは大文字小文字を区別しないため、`"Off"` でも `"off"` でもfriendly style layerを無効化します。
</Tip>

<Note>
レガシーの `plugins.entries.openai.config.personality` も、共有の `agents.defaults.promptOverlays.gpt5.personality` 設定がない場合の互換fallbackとして引き続き読み取られます。
</Note>

## 音声とspeech

<AccordionGroup>
  <Accordion title="Speech synthesis（TTS）">
    同梱の `openai` pluginは、`messages.tts` サーフェス向けにspeech synthesisを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | （未設定） |
    | Instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | Format | `messages.tts.providers.openai.responseFormat` | voice noteでは `opus`, fileでは `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` にフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なmodel: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能なvoice: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    chat API endpointに影響を与えずにTTS base URLをoverrideするには `OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    同梱の `openai` pluginは、
    OpenClawのmedia-understanding transcriptionサーフェス経由でbatch speech-to-textを登録します。

    - デフォルトmodel: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - Input path: multipart audio file upload
    - OpenClawで、受信音声文字起こしが
      `tools.media.audio` を使う場所ならどこでもサポートされます。これにはDiscord voice-channel segmentやchannel
      audio attachmentが含まれます

    受信音声文字起こしでOpenAIを強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    共有音声media configまたは呼び出しごとのtranscription requestで与えられた
    languageとprompt hintは、指定時にOpenAIへ転送されます。

  </Accordion>

  <Accordion title="Realtime transcription">
    同梱の `openai` pluginは、Voice Call plugin向けにrealtime transcriptionを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | （未設定） |
    | Prompt | `...openai.prompt` | （未設定） |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` へのWebSocket接続と、G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使います。このstreaming providerはVoice Callのrealtime transcription path向けです。Discord voiceは現在、短いsegmentを録音し、代わりにbatch `tools.media.audio` transcription pathを使います。
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    同梱の `openai` pluginは、Voice Call plugin向けにrealtime voiceを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` にフォールバック |

    <Note>
    `azureEndpoint` と `azureDeployment` config key経由でAzure OpenAIをサポートします。双方向tool callingをサポートします。G.711 u-law音声形式を使います。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoint

同梱の `openai` providerは、base URLをoverrideすることで画像
生成にAzure OpenAI resourceを使えます。image-generation pathでは、OpenClawは
`models.providers.openai.baseUrl` 上のAzure hostnameを検出し、
自動的にAzureのrequest shapeへ切り替えます。

<Note>
Realtime voiceは別の設定経路
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使い、`models.providers.openai.baseUrl` の影響は受けません。Azure
設定については [Voice and speech](#voice-and-speech) 配下の **Realtime
voice** accordionを参照してください。
</Note>

Azure OpenAIを使う場面:

- すでにAzure OpenAI subscription、quota、またはenterprise agreementを持っている
- Azureが提供するregional data residencyまたはcompliance controlが必要
- トラフィックを既存のAzure tenancy内に留めたい

### 設定

同梱の `openai` provider経由でAzure画像生成を使うには、
`models.providers.openai.baseUrl` をAzure resourceに向け、`apiKey` に
OpenAI Platform keyではなくAzure OpenAI keyを設定してください:

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClawは、Azure画像生成
ルート向けに次のAzure host suffixを認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識されたAzure host上のimage-generation requestでは、OpenClawは:

- `Authorization: Bearer` の代わりに `api-key` headerを送信する
- deployment単位のpath（`/openai/deployments/{deployment}/...`）を使う
- 各requestに `?api-version=...` を追加する

その他のbase URL（public OpenAI, OpenAI互換proxy）では、標準の
OpenAI画像request shapeを維持します。

<Note>
`openai` providerのimage-generation pathにおけるAzure routingには、
OpenClaw 2026.4.22以降が必要です。以前のバージョンでは、custom
`openai.baseUrl` はすべてpublic OpenAI endpointのように扱われ、
Azure image deploymentでは失敗します。
</Note>

### API version

Azure image-generation pathで特定のAzure previewまたはGA versionを固定するには、
`AZURE_OPENAI_API_VERSION` を設定してください:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はdeployment名

Azure OpenAIでは、モデルはdeploymentに紐付けられます。同梱 `openai` provider経由でルーティングされるAzure image-generation requestでは、OpenClawの `model` fieldには
public OpenAI model idではなく、Azure portalで設定した**Azure deployment名** を指定する必要があります。

`gpt-image-2` を提供する `gpt-image-2-prod` というdeploymentを作った場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

このdeployment名ルールは、同梱 `openai` provider経由でルーティングされるimage-generation callにも同様に適用されます。

### Regional availability

Azure画像生成は現在、一部のregionでのみ利用可能です
（例: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`）。deployment作成前にMicrosoftの最新region一覧を確認し、
特定のmodelがそのregionで提供されていることを確認してください。

### パラメーター差異

Azure OpenAIとpublic OpenAIは、必ずしも同じ画像パラメーターを受け付けません。
Azureは、public OpenAIでは許可されるオプション（たとえば
`gpt-image-2` 上の特定の `background` 値）を拒否したり、
特定のmodel versionでのみ公開したりする場合があります。これらの差異はAzureと
基盤modelに由来するものであり、OpenClaw由来ではありません。Azure requestがvalidation errorで失敗する場合は、
Azure portalで、特定のdeploymentとAPI versionがサポートする
パラメーターセットを確認してください。

<Note>
Azure OpenAIはネイティブtransportとcompat動作を使いますが、
OpenClawの非表示attribution headerは受け取りません。詳しくは [Advanced configuration](#advanced-configuration) の **Native vs OpenAI-compatible
routes** accordionを参照してください。

画像生成を超えるAzure上のchatまたはResponsesトラフィックには、
onboarding flowまたは専用のAzure provider configを使ってください。`openai.baseUrl` だけでは
Azure API/auth shapeは拾われません。別の
`azure-openai-responses/*` providerが存在します。下の
Server-side compaction accordionを参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Transport（WebSocket vs SSE）">
    OpenClawは `openai/*` と `openai-codex/*` の両方で、WebSocket優先・SSEフォールバック（`"auto"`）を使います。

    `"auto"` modeでは、OpenClawは:
    - 早期WebSocket failureを1回だけ再試行してからSSEへフォールバックする
    - failure後、WebSocketを約60秒degradedとしてマークし、cool-down中はSSEを使う
    - retryとreconnectのために安定したsessionおよびturn identity headerを付与する
    - transport variantをまたいでusage counter（`input_tokens` / `prompt_tokens`）を正規化する

    | Value | Behavior |
    |-------|----------|
    | `"auto"` (default) | WebSocket優先、SSEフォールバック |
    | `"sse"` | SSEのみを強制 |
    | `"websocket"` | WebSocketのみを強制 |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連するOpenAI docs:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
    OpenClawは、初回turnのレイテンシを減らすため、`openai/*` と `openai-codex/*` でデフォルトでWebSocket warm-upを有効にします。

    ```json5
    // warm-upを無効化
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast mode">
    OpenClawは、`openai/*` と `openai-codex/*` 向けに共有fast-modeトグルを公開します:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClawはfast modeをOpenAI priority processing（`service_tier = "priority"`）へマッピングします。既存の `service_tier` 値は保持され、fast modeは `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    session overrideはconfigより優先されます。Sessions UIでsession overrideをクリアすると、そのsessionは設定済みデフォルトへ戻ります。
    </Note>

  </Accordion>

  <Accordion title="Priority processing（service_tier）">
    OpenAIのAPIは `service_tier` 経由でpriority processingを公開しています。OpenClawではmodelごとに設定します:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` が転送されるのはネイティブOpenAI endpoint（`api.openai.com`）とネイティブCodex endpoint（`chatgpt.com/backend-api`）だけです。どちらかのproviderをproxy経由でルーティングしている場合、OpenClawは `service_tier` に手を加えません。
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction（Responses API）">
    直接OpenAI Responsesモデル（`api.openai.com` 上の `openai/*`）では、OpenAI pluginのPi-harness stream wrapperがserver-side compactionを自動有効化します:

    - `store: true` を強制（model compatが `supportsStore: false` を設定していない限り）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入
    - デフォルトの `compact_threshold`: `contextWindow` の70%（利用できない場合は `80000`）

    これは組み込みPi harness pathと、embedded runで使われるOpenAI provider hookに適用されます。ネイティブCodex app-server harnessはCodex経由で独自にcontextを管理し、`agents.defaults.embeddedHarness.runtime` で別途設定されます。

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responsesのような互換endpointに有用です:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタムthreshold">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="無効化">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` が制御するのは `context_management` 注入だけです。直接OpenAI Responsesモデルは、compatが `supportsStore: false` を設定していない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    `openai/*` 上のGPT-5-family runでは、OpenClawはより厳格なembedded execution contractを使えます:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClawは:
    - tool actionが利用可能なときに、plan-only turnを成功した進捗として扱わなくなる
    - act-now steer付きでturnを再試行する
    - 重要な作業では `update_plan` を自動有効化する
    - modelが行動せず計画し続ける場合、明示的なblocked stateを表面化する

    <Note>
    OpenAIとCodexのGPT-5-family runにのみスコープされます。その他のproviderや古いmodel familyはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClawは、直接のOpenAI, Codex, Azure OpenAI endpointを、汎用OpenAI互換 `/v1` proxyとは異なる扱いにします:

    **ネイティブルート**（`openai/*`, Azure OpenAI）:
    - OpenAIの `none` effortをサポートするmodelにのみ `reasoning: { effort: "none" }` を維持
    - `reasoning.effort: "none"` を拒否するmodelまたはproxyでは、無効化されたreasoningを省略
    - tool schemaをデフォルトでstrict modeにする
    - 検証済みnative hostにのみ非表示attribution headerを付与
    - OpenAI専用のrequest shaping（`service_tier`, `store`, reasoning-compat, prompt-cache hint）を維持

    **Proxy/compatible routes:**
    - より緩いcompat動作を使う
    - strict tool schemaやnative専用headerを強制しない

    Azure OpenAIはネイティブtransportとcompat動作を使いますが、非表示attribution headerは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、failover動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールparamとprovider選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールparamとprovider選択。
  </Card>
  <Card title="OAuthとauth" href="/ja-JP/gateway/authentication" icon="key">
    Authの詳細とcredential再利用ルール。
  </Card>
</CardGroup>

---
read_when:
    - OpenClawでOpenAIモデルを使いたい場合
    - APIキーの代わりにCodex subscription認証を使いたい場合
    - より厳格なGPT-5エージェント実行動作が必要な場合
summary: OpenClawでAPIキーまたはCodex subscription経由でOpenAIを使用する
title: OpenAI
x-i18n:
    generated_at: "2026-04-23T14:08:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac42660234e1971440f6de3b04adb1d3a1fddca20219fb68936c36e4c2f95265
    source_path: providers/openai.md
    workflow: 15
---

  # OpenAI

  OpenAIはGPTモデル向けの開発者APIを提供しています。OpenClawは2つの認証経路をサポートします:

  - **APIキー** — 従量課金による直接のOpenAI Platformアクセス（`openai/*` モデル）
  - **Codex subscription** — subscriptionアクセスによるChatGPT/Codexサインイン（`openai-codex/*` モデル）

  OpenAIは、OpenClawのような外部ツールやワークフローでのsubscription OAuth利用を明示的にサポートしています。

  ## OpenClaw機能カバレッジ

  | OpenAI capability         | OpenClaw surface                          | Status                                                     |
  | ------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
  | Chat / Responses          | `openai/<model>` model provider           | Yes                                                        |
  | Codex subscription models | `openai-codex/<model>` model provider     | Yes                                                        |
  | Server-side web search    | ネイティブOpenAI Responses tool           | Yes、web searchが有効でprovider固定がない場合              |
  | Images                    | `image_generate`                          | Yes                                                        |
  | Videos                    | `video_generate`                          | Yes                                                        |
  | Text-to-speech            | `messages.tts.provider: "openai"` / `tts` | Yes                                                        |
  | Batch speech-to-text      | `tools.media.audio` / メディア理解        | Yes                                                        |
  | Streaming speech-to-text  | Voice Call `streaming.provider: "openai"` | Yes                                                        |
  | Realtime voice            | Voice Call `realtime.provider: "openai"`  | Yes                                                        |
  | Embeddings                | メモリ埋め込みprovider                    | Yes                                                        |

  ## はじめに

  希望する認証方式を選び、セットアップ手順に従ってください。

  <Tabs>
  <Tab title="APIキー（OpenAI Platform）">
    **最適な用途:** 直接APIアクセスと従量課金。

    <Steps>
      <Step title="APIキーを取得する">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys) でAPIキーを作成またはコピーします。
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        または、キーを直接渡します:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 経路の概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接のOpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接のOpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codexサインインは `openai/*` ではなく `openai-codex/*` を通ります。
    </Note>

    ### Config例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClawは、直接API経路では `openai/gpt-5.3-codex-spark` を公開しません。実際のOpenAI APIリクエストはそのモデルを拒否します。SparkはCodex専用です。
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **最適な用途:** 別のAPIキーではなく、あなたのChatGPT/Codex subscriptionを使う場合。Codex cloudにはChatGPTサインインが必要です。

    <Steps>
      <Step title="Codex OAuthを実行する">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        または、OAuthを直接実行します:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        ヘッドレス環境やコールバックに不向きな環境では、localhostブラウザーコールバックの代わりにChatGPT device-codeフローでサインインするため、`--device-code` を追加してください:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 経路の概要

    | Model ref | Route | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codexサインイン |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codexサインイン（entitlement依存） |

    <Note>
    この経路は `openai/gpt-5.4` と意図的に分離されています。直接PlatformアクセスにはAPIキー付きの `openai/*` を、Codex subscriptionアクセスには `openai-codex/*` を使用してください。
    </Note>

    ### Config例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Note>
    オンボーディングは、`~/.codex` からOAuth情報をインポートしなくなりました。ブラウザーOAuth（デフォルト）または上記のdevice-codeフローでサインインしてください — OpenClawは生成された認証情報を自身のagent auth storeで管理します。
    </Note>

    ### コンテキストウィンドウ上限

    OpenClawは、モデルメタデータと実行時コンテキスト上限を別々の値として扱います。

    `openai-codex/gpt-5.4` について:

    - ネイティブの `contextWindow`: `1050000`
    - デフォルトの実行時 `contextTokens` 上限: `272000`

    実運用では、この小さめのデフォルト上限のほうがレイテンシと品質の特性が良好です。`contextTokens` で上書きできます:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    `contextWindow` はネイティブモデルメタデータを宣言するために使います。`contextTokens` は実行時のコンテキスト予算を制限するために使います。
    </Note>

  </Tab>
</Tabs>

## 画像生成

バンドル済みの `openai` Pluginは、`image_generate` ツールを通じて画像生成を登録します。

| Capability                | Value                              |
| ------------------------- | ---------------------------------- |
| Default model             | `openai/gpt-image-2`               |
| Max images per request    | 4                                  |
| Edit mode                 | 有効（参照画像は最大5枚）          |
| Size overrides            | サポート、2K/4Kサイズを含む        |
| Aspect ratio / resolution | OpenAI Images APIには転送されない  |

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [Image Generation](/ja-JP/tools/image-generation) を参照してください。
</Note>

`gpt-image-2` は、OpenAIのテキストから画像生成と画像編集の両方におけるデフォルトです。`gpt-image-1` も明示的なモデル上書きとして引き続き利用できますが、新しいOpenAI画像ワークフローでは `openai/gpt-image-2` を使用してください。

生成:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS上のOpenClaw向け、洗練されたローンチポスター" size=3840x2160 count=1
```

編集:

```
/tool image_generate model=openai/gpt-image-2 prompt="物体の形状は維持し、素材を半透明ガラスに変更" image=/path/to/reference.png size=1024x1536
```

## 動画生成

バンドル済みの `openai` Pluginは、`video_generate` ツールを通じて動画生成を登録します。

| Capability       | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| Default model    | `openai/sora-2`                                                       |
| Modes            | テキストから動画、画像から動画、単一動画の編集                        |
| Reference inputs | 画像1枚または動画1本                                                  |
| Size overrides   | サポート                                                              |
| Other overrides  | `aspectRatio`, `resolution`, `audio`, `watermark` はツール警告付きで無視される |

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
共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
</Note>

## GPT-5プロンプト寄与

OpenClawは、プロバイダーをまたいだGPT-5ファミリー実行向けに、共有のGPT-5プロンプト寄与を追加します。これはモデルid単位で適用されるため、`openai/gpt-5.4`、`openai-codex/gpt-5.4`、`openrouter/openai/gpt-5.4`、`opencode/gpt-5.4` などの互換GPT-5参照はすべて同じオーバーレイを受け取ります。古いGPT-4.xモデルは対象ではありません。

バンドル済みのネイティブCodexハーネスプロバイダー（`codex/*`）も、Codex app-server developer instructionsを通じて同じGPT-5動作とHeartbeatオーバーレイを使用するため、`codex/gpt-5.x` セッションでも、残りのハーネスプロンプトをCodexが管理していても、同じ追従性と積極的なHeartbeatガイダンスが維持されます。

GPT-5寄与は、ペルソナの一貫性、実行安全性、ツール規律、出力形式、完了チェック、検証のためのタグ付き動作契約を追加します。チャンネル固有の返信およびサイレントメッセージ動作は、共有のOpenClawシステムプロンプトと送信ポリシーに残ります。GPT-5ガイダンスは、一致するモデルに対して常に有効です。フレンドリーな対話スタイル層は別で、設定可能です。

| Value                  | Effect                                           |
| ---------------------- | ------------------------------------------------ |
| `"friendly"` (default) | フレンドリーな対話スタイル層を有効化             |
| `"on"`                 | `"friendly"` のエイリアス                        |
| `"off"`                | フレンドリーなスタイル層のみを無効化             |

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
値は実行時に大文字小文字を区別しないため、`"Off"` でも `"off"` でもフレンドリーなスタイル層を無効化します。
</Tip>

<Note>
旧来の `plugins.entries.openai.config.personality` も、共有設定 `agents.defaults.promptOverlays.gpt5.personality` が未設定の場合の互換フォールバックとして引き続き読み取られます。
</Note>

## 音声とspeech

<AccordionGroup>
  <Accordion title="音声合成（TTS）">
    バンドル済みの `openai` Pluginは、`messages.tts` 画面向けに音声合成を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Voice | `messages.tts.providers.openai.voice` | `coral` |
    | Speed | `messages.tts.providers.openai.speed` | （未設定） |
    | Instructions | `messages.tts.providers.openai.instructions` | （未設定、`gpt-4o-mini-tts` のみ） |
    | Format | `messages.tts.providers.openai.responseFormat` | ボイスノートは `opus`、ファイルは `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY` へフォールバック |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    利用可能なモデル: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`。利用可能な音声: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`。

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
    チャットAPIエンドポイントに影響を与えずにTTS base URLを上書きするには、`OPENAI_TTS_BASE_URL` を設定してください。
    </Note>

  </Accordion>

  <Accordion title="音声認識">
    バンドル済みの `openai` Pluginは、
    OpenClawのメディア理解文字起こし画面を通じてバッチ音声認識を登録します。

    - デフォルトモデル: `gpt-4o-transcribe`
    - エンドポイント: OpenAI REST `/v1/audio/transcriptions`
    - 入力経路: multipart音声ファイルアップロード
    - OpenClawでは、受信音声文字起こしに `tools.media.audio` を使うあらゆる場所でサポートされます。これにはDiscordのボイスチャンネル区間やチャンネル音声添付ファイルが含まれます

    受信音声文字起こしにOpenAIを強制するには:

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

    言語ヒントとプロンプトヒントは、共有音声メディアconfigまたは呼び出しごとの文字起こしリクエストから指定された場合、OpenAIへ転送されます。

  </Accordion>

  <Accordion title="リアルタイム文字起こし">
    バンドル済みの `openai` Pluginは、Voice Call Plugin向けにリアルタイム文字起こしを登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Language | `...openai.language` | （未設定） |
    | Prompt | `...openai.prompt` | （未設定） |
    | Silence duration | `...openai.silenceDurationMs` | `800` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` へフォールバック |

    <Note>
    `wss://api.openai.com/v1/realtime` へのWebSocket接続と、G.711 u-law（`g711_ulaw` / `audio/pcmu`）音声を使用します。このストリーミングプロバイダーはVoice Callのリアルタイム文字起こし経路向けです。Discord voiceは現在、短い区間を録音し、代わりにバッチの `tools.media.audio` 文字起こし経路を使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声">
    バンドル済みの `openai` Pluginは、Voice Call Plugin向けにリアルタイム音声を登録します。

    | Setting | Config path | Default |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | Voice | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD threshold | `...openai.vadThreshold` | `0.5` |
    | Silence duration | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY` へフォールバック |

    <Note>
    `azureEndpoint` および `azureDeployment` configキーによるAzure OpenAIをサポートします。双方向ツール呼び出しをサポートします。G.711 u-law音声形式を使用します。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAIエンドポイント

バンドル済みの `openai` providerは、base URLを上書きすることでAzure OpenAIリソースを画像生成に使用できます。画像生成経路では、OpenClawは `models.providers.openai.baseUrl` 上のAzureホスト名を検出し、自動的にAzureのリクエスト形式へ切り替えます。

<Note>
リアルタイム音声は別のconfig経路
（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`）
を使用し、`models.providers.openai.baseUrl` の影響は受けません。Azure設定については、[音声とspeech](#voice-and-speech) の **リアルタイム音声** アコーディオンを参照してください。
</Note>

次のような場合にAzure OpenAIを使用します:

- すでにAzure OpenAIのsubscription、クォータ、またはエンタープライズ契約を持っている
- Azureが提供するリージョンデータレジデンシーまたはコンプライアンス制御が必要
- トラフィックを既存のAzureテナンシー内に保持したい

### 設定

バンドル済み `openai` providerを通じてAzure画像生成を行うには、
`models.providers.openai.baseUrl` をAzureリソースへ向け、`apiKey` には
Azure OpenAIキー（OpenAI Platformキーではありません）を設定します:

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

OpenClawは、Azure画像生成経路用として以下のAzureホスト接尾辞を認識します:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

認識されたAzureホスト上の画像生成リクエストでは、OpenClawは次を行います:

- `Authorization: Bearer` の代わりに `api-key` ヘッダーを送信する
- デプロイスコープ付きパス（`/openai/deployments/{deployment}/...`）を使用する
- 各リクエストに `?api-version=...` を付加する

その他のbase URL（公開OpenAI、OpenAI互換プロキシ）では、標準の
OpenAI画像リクエスト形式が維持されます。

<Note>
`openai` providerの画像生成経路におけるAzureルーティングには、
OpenClaw 2026.4.22以降が必要です。これ以前のバージョンでは、カスタム
`openai.baseUrl` はすべて公開OpenAIエンドポイントと同様に扱われるため、
Azure画像デプロイでは失敗します。
</Note>

### APIバージョン

Azure画像生成経路向けに特定のAzure previewまたはGAバージョンを固定するには、
`AZURE_OPENAI_API_VERSION` を設定します:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

この変数が未設定の場合のデフォルトは `2024-12-01-preview` です。

### モデル名はデプロイ名

Azure OpenAIはモデルをデプロイに紐付けます。バンドル済み `openai` providerを通じてルーティングされるAzure画像生成リクエストでは、OpenClaw内の `model` フィールドは、公開OpenAIモデルidではなく、Azureポータルで設定した**Azureデプロイ名**でなければなりません。

`gpt-image-2` を提供する `gpt-image-2-prod` というデプロイを作成した場合:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="クリーンなポスター" size=1024x1024 count=1
```

同じデプロイ名ルールは、バンドル済み `openai` providerを通じてルーティングされる画像生成呼び出しにも適用されます。

### リージョン提供状況

Azure画像生成は現在、一部のリージョンでのみ利用可能です
（たとえば `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`）。デプロイ作成前にMicrosoftの最新リージョン一覧を確認し、
対象モデルがそのリージョンで提供されていることも確認してください。

### パラメーター差異

Azure OpenAIと公開OpenAIが、常に同じ画像パラメーターを受け付けるとは限りません。
Azureは、公開OpenAIが許可するオプション（たとえば `gpt-image-2` における特定の
`background` 値）を拒否することがあり、また特定モデルバージョンでのみ公開されることもあります。これらの差異はAzureと基盤モデルに由来するものであり、OpenClawによるものではありません。Azureリクエストが検証エラーで失敗した場合は、Azureポータルで、あなたの特定のデプロイとAPIバージョンがサポートするパラメーターセットを確認してください。

<Note>
Azure OpenAIはネイティブの転送と互換動作を使用しますが、OpenClawの隠し属性付与ヘッダーは受け取りません。詳細は、[高度な設定](#advanced-configuration) の **Native vs OpenAI-compatible routes** アコーディオンを参照してください。
</Note>

<Tip>
`openai` providerとは別のAzure OpenAI Responses providerについては、
[サーバーサイドCompaction](#server-side-compaction-responses-api) アコーディオン内の
`azure-openai-responses/*` model refを参照してください。
</Tip>

<Note>
AzureのchatおよびResponsesトラフィックには、base URL上書きに加えてAzure固有のprovider/API configが必要です。画像生成以外でもAzureモデル呼び出しを行いたい場合は、`openai.baseUrl` だけで十分だと考えず、オンボーディングフローまたは適切なAzure API/認証形式を設定するprovider configを使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="転送（WebSocket vs SSE）">
    OpenClawは、`openai/*` と `openai-codex/*` の両方で、WebSocket優先 + SSEフォールバック（`"auto"`）を使用します。

    `"auto"` モードでは、OpenClawは次を行います:
    - 初期のWebSocket失敗を1回リトライしてからSSEへフォールバックする
    - 失敗後は、WebSocketを約60秒間degradedとマークし、クールダウン中はSSEを使用する
    - リトライや再接続のために、安定したセッションおよびターン識別ヘッダーを付与する
    - 転送バリアント間で使用量カウンター（`input_tokens` / `prompt_tokens`）を正規化する

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
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    関連するOpenAIドキュメント:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocketウォームアップ">
    OpenClawは、初回ターンのレイテンシ削減のため、`openai/*` でデフォルトでWebSocketウォームアップを有効にしています。

    ```json5
    // ウォームアップを無効化
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

<a id="openai-fast-mode"></a>

  <Accordion title="Fast mode">
    OpenClawは、`openai/*` と `openai-codex/*` の両方に対して共有のfast-modeトグルを公開しています:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    有効にすると、OpenClawはfast modeをOpenAIのpriority processing（`service_tier = "priority"`）へ対応付けます。既存の `service_tier` 値は保持され、fast modeは `reasoning` や `text.verbosity` を書き換えません。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    セッション上書きはconfigより優先されます。Sessions UIでセッション上書きをクリアすると、そのセッションは設定済みデフォルトへ戻ります。
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAIのAPIは、`service_tier` によってpriority processingを公開しています。OpenClawではモデルごとに設定できます:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    サポートされる値: `auto`, `default`, `flex`, `priority`。

    <Warning>
    `serviceTier` はネイティブのOpenAIエンドポイント（`api.openai.com`）とネイティブCodexエンドポイント（`chatgpt.com/backend-api`）にのみ転送されます。いずれかのproviderをプロキシ経由でルーティングしている場合、OpenClawは `service_tier` を変更しません。
    </Warning>

  </Accordion>

  <Accordion title="サーバーサイドCompaction（Responses API）">
    直接のOpenAI Responsesモデル（`api.openai.com` 上の `openai/*`）では、OpenClawはサーバーサイドCompactionを自動で有効化します:

    - `store: true` を強制する（モデル互換性で `supportsStore: false` が設定されていない限り）
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` を注入する
    - デフォルトの `compact_threshold`: `contextWindow` の70%（不明な場合は `80000`）

    <Tabs>
      <Tab title="明示的に有効化">
        Azure OpenAI Responsesのような互換エンドポイントで有用です:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="カスタムしきい値">
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
    `responsesServerCompaction` が制御するのは `context_management` の注入だけです。直接のOpenAI Responsesモデルでは、互換性設定で `supportsStore: false` が指定されていない限り、引き続き `store: true` を強制します。
    </Note>

  </Accordion>

  <Accordion title="厳格エージェント型GPTモード">
    `openai/*` および `openai-codex/*` 上のGPT-5ファミリー実行では、OpenClawはより厳格な埋め込み実行契約を使用できます:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic` では、OpenClawは次のように動作します:
    - ツール実行が可能な場合、計画だけのターンを成功した進捗として扱わなくなる
    - 今すぐ実行するよう促すステア付きでターンをリトライする
    - 大きな作業では `update_plan` を自動有効化する
    - モデルが行動せずに計画を続ける場合、明示的なblocked状態を表示する

    <Note>
    対象はOpenAIおよびCodexのGPT-5ファミリー実行のみです。他のプロバイダーや古いモデルファミリーはデフォルト動作のままです。
    </Note>

  </Accordion>

  <Accordion title="ネイティブ vs OpenAI互換ルート">
    OpenClawは、直接のOpenAI、Codex、Azure OpenAIエンドポイントを、汎用のOpenAI互換 `/v1` プロキシとは異なるものとして扱います:

    **ネイティブルート**（`openai/*`, `openai-codex/*`, Azure OpenAI）:
    - OpenAIの `none` effort をサポートするモデルに対してのみ `reasoning: { effort: "none" }` を保持する
    - `reasoning.effort: "none"` を拒否するモデルまたはプロキシでは、無効化されたreasoningを省略する
    - ツールスキーマのデフォルトをstrict modeにする
    - 検証済みのネイティブホストに対してのみ隠し属性付与ヘッダーを付与する
    - OpenAI専用のリクエスト整形（`service_tier`, `store`, reasoning互換性, prompt-cacheヒント）を維持する

    **プロキシ/互換ルート:**
    - より緩い互換動作を使う
    - strictツールスキーマやネイティブ専用ヘッダーを強制しない

    Azure OpenAIはネイティブの転送と互換動作を使用しますが、隠し属性付与ヘッダーは受け取りません。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="画像生成" href="/ja-JP/tools/image-generation" icon="image">
    共有画像ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="OAuthと認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報再利用ルール。
  </Card>
</CardGroup>

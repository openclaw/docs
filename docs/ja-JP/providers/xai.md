---
read_when:
    - OpenClaw で Grok モデルを使いたい
    - xAI の認証またはモデル ID を設定しています
summary: OpenClaw で xAI Grok モデルを使う
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:20:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw には、Grok モデル用の同梱 `xai` プロバイダー Plugin が含まれています。

## はじめに

<Steps>
  <Step title="API キーを作成する">
    [xAI console](https://console.x.ai/) で API キーを作成します。
  </Step>
  <Step title="API キーを設定する">
    `XAI_API_KEY` を設定するか、次を実行します。

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="モデルを選ぶ">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw は、同梱 xAI トランスポートとして xAI Responses API を使います。同じ
`XAI_API_KEY` は、Grok ベースの `web_search`、ファーストクラスの `x_search`、
およびリモート `code_execution` にも使えます。
`plugins.entries.xai.config.webSearch.apiKey` に xAI キーを保存すると、
同梱 xAI モデルプロバイダーもそのキーをフォールバックとして再利用します。
`code_execution` の調整は `plugins.entries.xai.config.codeExecution` 配下にあります。
</Note>

## 組み込みカタログ

OpenClaw には、次の xAI モデルファミリーが最初から含まれています。

| Family         | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

この Plugin は、同じ API 形状に従う新しい `grok-4*` および `grok-code-fast*` ID も
フォワード解決します。

<Tip>
`grok-4-fast`、`grok-4-1-fast`、および `grok-4.20-beta-*` バリアントは、
同梱カタログ内の現在の画像対応 Grok 参照です。
</Tip>

## OpenClaw の機能カバレッジ

同梱 Plugin は、xAI の現在の公開 API サーフェスを OpenClaw の共有
プロバイダーおよびツール契約にマッピングします。共有契約に適合しない機能
（たとえばストリーミング TTS やリアルタイム音声）は公開されません。詳細は
下の表を参照してください。

| xAI capability             | OpenClaw surface                          | Status                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` model provider              | Yes                                                                 |
| Server-side web search     | `web_search` provider `grok`              | Yes                                                                 |
| Server-side X search       | `x_search` tool                           | Yes                                                                 |
| Server-side code execution | `code_execution` tool                     | Yes                                                                 |
| Images                     | `image_generate`                          | Yes                                                                 |
| Videos                     | `video_generate`                          | Yes                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | Yes                                                                 |
| Streaming TTS              | —                                         | Not exposed; OpenClaw's TTS contract returns complete audio buffers |
| Batch speech-to-text       | `tools.media.audio` / media understanding | Yes                                                                 |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | Yes                                                                 |
| Realtime voice             | —                                         | Not exposed yet; different session/WebSocket contract               |
| Files / batches            | Generic model API compatibility only      | Not a first-class OpenClaw tool                                     |

<Note>
OpenClaw は、メディア生成、音声処理、バッチ文字起こしには xAI の REST image/video/TTS/STT API を、
ライブ音声通話の文字起こしには xAI のストリーミング STT WebSocket を、
モデル、検索、code-execution ツールには Responses API を使います。
Realtime voice sessions のように異なる OpenClaw 契約を必要とする機能は、
隠れた Plugin 動作ではなく、上流機能としてここに記載されています。
</Note>

### Fast モードのマッピング

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
は、ネイティブ xAI リクエストを次のように書き換えます。

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換エイリアス

レガシーエイリアスは引き続き正規の同梱 ID に正規化されます。

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web search">
    同梱 `grok` Webhook 検索プロバイダーも `XAI_API_KEY` を使います。

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    同梱 `xai` Plugin は、共有
    `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトの動画モデル: `xai/grok-imagine-video`
    - モード: text-to-video、image-to-video、reference-image generation、remote
      video edit、remote video extension
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: generation / image-to-video では 1〜15 秒、`reference_image` ロールを
      使う場合は 1〜10 秒、extension では 2〜10 秒
    - 参照画像生成: 提供するすべての画像で `imageRoles` を `reference_image` に設定します。xAI はこのような画像を最大 7 枚まで受け付けます

    <Warning>
    ローカルの動画バッファーは受け付けられません。video edit / extend の入力には
    リモート `http(s)` URL を使ってください。image-to-video はローカル画像バッファーを受け付けます。
    これは OpenClaw がそれらを xAI 用の data URL にエンコードできるためです。
    </Warning>

    xAI をデフォルトの動画プロバイダーとして使うには:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    共有ツールパラメーター、
    プロバイダー選択、およびフェイルオーバー動作については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    同梱 `xai` Plugin は、共有
    `image_generate` ツールを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: text-to-image と reference-image edit
    - 参照入力: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 枚数: 最大 4 枚

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求するため、生成されたメディアを
    通常のチャネル添付パスを通じて保存および配信できます。ローカルの
    参照画像は data URL に変換され、リモート `http(s)` 参照は
    そのまま渡されます。

    xAI をデフォルトの画像プロバイダーとして使うには:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` のような
    追加のネイティブ比率も文書化しています。OpenClaw は現在、
    共有のクロスプロバイダー画像コントロールのみを転送します。未対応のネイティブ専用ノブは
    意図的に `image_generate` では公開されていません。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    同梱 `xai` Plugin は、共有 `tts`
    プロバイダーサーフェスを通じて text-to-speech を登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: プロバイダーネイティブの速度オーバーライド
    - ネイティブ Opus voice-note 形式はサポートされません

    xAI をデフォルトの TTS プロバイダーとして使うには:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使います。xAI は
    WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の speech provider 契約は現在
    返信配信前に完全な音声バッファーを期待します。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    同梱 `xai` Plugin は、OpenClaw の
    media-understanding transcription サーフェスを通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - OpenClaw では、Discord 音声チャネルセグメントや
      チャネル音声添付を含め、受信音声文字起こしで `tools.media.audio` を使う場所ならどこでもサポートされます

    受信音声文字起こしで xAI を強制するには:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    言語は共有音声メディア設定または呼び出しごとの
    transcription リクエスト経由で指定できます。プロンプトヒントは共有 OpenClaw
    サーフェスで受け付けられますが、xAI REST STT 統合は file、model、および
    language のみを転送します。これは、それらが現在の公開 xAI エンドポイントにきれいに対応するためです。

  </Accordion>

  <Accordion title="ストリーミング speech-to-text">
    同梱 `xai` Plugin は、ライブ音声通話用の
    realtime transcription プロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルト endpointing: `800ms`
    - 中間 transcript: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、
    xAI プロバイダーはトランスコードなしでそれらのフレームを直接転送できます。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    プロバイダー所有の設定は
    `plugins.entries.voice-call.config.streaming.providers.xai` 配下にあります。サポートされる
    キーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、および `language` です。

    <Note>
    このストリーミングプロバイダーは、Voice Call のリアルタイム文字起こしパス用です。
    現在の Discord voice は短いセグメントを録音し、代わりにバッチ
    `tools.media.audio` 文字起こしパスを使います。
    </Note>

  </Accordion>

  <Accordion title="x_search の設定">
    同梱 xAI Plugin は、Grok 経由で
    X（旧 Twitter）のコンテンツを検索するための OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search を有効または無効にする      |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使うモデル      |
    | `inlineCitations`  | boolean | —                  | 結果にインライン引用を含める         |
    | `maxTurns`         | number  | —                  | 最大会話ターン数                     |
    | `timeoutSeconds`   | number  | —                  | リクエストのタイムアウト秒数         |
    | `cacheTtlMinutes`  | number  | —                  | キャッシュの有効期限（分）           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution の設定">
    同梱 xAI Plugin は、xAI の sandbox 環境で
    リモートコード実行を行うための OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default                    | Description                              |
    | ----------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (if key available)  | code execution を有効または無効にする    |
    | `model`           | string  | `grok-4-1-fast`            | code execution リクエストに使うモデル    |
    | `maxTurns`        | number  | —                          | 最大会話ターン数                         |
    | `timeoutSeconds`  | number  | —                          | リクエストのタイムアウト秒数             |

    <Note>
    これはローカル [`exec`](/ja-JP/tools/exec) ではなく、リモート xAI sandbox 実行です。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="既知の制限">
    - 現在、認証は API キーのみです。OpenClaw にはまだ xAI OAuth や device-code フローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304` は、標準の OpenClaw xAI トランスポートとは異なる上流 API
      サーフェスを必要とするため、通常の xAI プロバイダーパスではサポートされません。
    - xAI Realtime voice はまだ OpenClaw プロバイダーとして登録されていません。
      バッチ STT やストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像の `quality`、画像の `mask`、および追加のネイティブ専用アスペクト比は、
      共有 `image_generate` ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="詳細メモ">
    - OpenClaw は、共有ランナーパス上で xAI 固有のツールスキーマおよびツール呼び出し互換修正を
      自動的に適用します。
    - ネイティブ xAI リクエストでは、デフォルトで `tool_stream: true` が使われます。
      無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定してください。
    - 同梱 xAI ラッパーは、サポートされていない strict ツールスキーマフラグと
      reasoning ペイロードキーを、ネイティブ xAI リクエスト送信前に取り除きます。
    - `web_search`、`x_search`、および `code_execution` は OpenClaw
      ツールとして公開されます。OpenClaw は、すべてのチャットターンにすべてのネイティブツールを付けるのではなく、
      各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効にします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされているのではなく、
      同梱 xAI Plugin が所有しています。
    - `code_execution` はローカル
      [`exec`](/ja-JP/tools/exec) ではなく、リモート xAI sandbox 実行です。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAI のメディアパスは、ユニットテストとオプトインのライブスイートでカバーされています。ライブ
コマンドは、`XAI_API_KEY` を確認する前に、`~/.profile` を含む
ログインシェルからシークレットを読み込みます。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

このプロバイダー固有のライブファイルは、通常の TTS、電話向け PCM
TTS、xAI バッチ STT による音声文字起こし、同じ PCM を xAI
Realtime STT によるストリーミング、text-to-image 出力の生成、および参照画像の編集を合成します。共有
画像ライブファイルは、OpenClaw の
ランタイム選択、フォールバック、正規化、およびメディア添付パスを通じて、同じ xAI プロバイダーを検証します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="すべてのプロバイダー" href="/ja-JP/providers/index" icon="grid-2">
    より広いプロバイダー概要。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

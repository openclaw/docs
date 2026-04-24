---
read_when:
    - OpenClawでGrokモデルを使いたい場合
    - xAI認証またはモデルIDを設定している場合
summary: OpenClawでxAI Grokモデルを使う
title: xAI
x-i18n:
    generated_at: "2026-04-24T05:17:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

OpenClawには、Grokモデル向けのバンドル済み`xai`プロバイダーPluginが含まれています。

## はじめに

<Steps>
  <Step title="API keyを作成する">
    [xAI console](https://console.x.ai/)でAPI keyを作成します。
  </Step>
  <Step title="API keyを設定する">
    `XAI_API_KEY`を設定するか、次を実行します。

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
OpenClawは、バンドルされたxAIトランスポートとしてxAI Responses APIを使用します。同じ
`XAI_API_KEY`は、Grokバックの`web_search`、ファーストクラスの`x_search`、
およびリモート`code_execution`にも利用できます。
`plugins.entries.xai.config.webSearch.apiKey`の下にxAI keyを保存した場合、
バンドルされたxAIモデルプロバイダーもそれをフォールバックとして再利用します。
`code_execution`の調整は`plugins.entries.xai.config.codeExecution`の下にあります。
</Note>

## 組み込みカタログ

OpenClawには、次のxAIモデルファミリーが最初から含まれています。

| ファミリー | モデルID |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

このPluginは、同じAPI形状に従う新しい`grok-4*`および`grok-code-fast*` IDも
forward-resolveします。

<Tip>
`grok-4-fast`、`grok-4-1-fast`、および`grok-4.20-beta-*`系は、
現在バンドルカタログ内で画像対応しているGrok参照です。
</Tip>

## OpenClawの機能カバレッジ

バンドルされたPluginは、xAIの現在の公開APIインターフェースをOpenClawの共有
プロバイダーおよびツールコントラクトへマッピングします。共有コントラクトに合わない機能
（たとえばストリーミングTTSやrealtime voice）は公開されません。詳細は以下の表を参照してください。

| xAI機能 | OpenClawインターフェース | ステータス |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>`モデルプロバイダー              | はい                                                                 |
| サーバー側Web検索     | `web_search`プロバイダー`grok`              | はい                                                                 |
| サーバー側X検索       | `x_search`ツール                           | はい                                                                 |
| サーバー側コード実行 | `code_execution`ツール                     | はい                                                                 |
| 画像                     | `image_generate`                          | はい                                                                 |
| 動画                     | `video_generate`                          | はい                                                                 |
| バッチtext-to-speech       | `messages.tts.provider: "xai"` / `tts`    | はい                                                                 |
| ストリーミングTTS              | —                                         | 非公開。OpenClawのTTSコントラクトは完全な音声バッファを返すため |
| バッチspeech-to-text       | `tools.media.audio` / メディア理解 | はい                                                                 |
| ストリーミングspeech-to-text   | Voice Call `streaming.provider: "xai"`    | はい                                                                 |
| Realtime voice             | —                                         | まだ公開されていません。異なるsession/WebSocketコントラクトです               |
| Files / batches            | 汎用モデルAPI互換性のみ      | ファーストクラスのOpenClawツールではない                                     |

<Note>
OpenClawは、メディア生成、音声、およびバッチ文字起こしにはxAIのREST image/video/TTS/STT APIを、
ライブvoice-call文字起こしにはxAIのストリーミングSTT WebSocketを、
モデル、検索、およびコード実行ツールにはResponses APIを使用します。Realtime voice sessionのように
異なるOpenClawコントラクトを必要とする機能は、隠れたPlugin動作ではなく、
上流機能としてここに記載されています。
</Note>

### Fast-modeマッピング

`/fast on`または`agents.defaults.models["xai/<model>"].params.fastMode: true`
は、ネイティブxAIリクエストを次のように書き換えます。

| 元モデル | Fast-modeターゲット |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換エイリアス

レガシーエイリアスは引き続き正規のバンドルIDへ正規化されます。

| レガシーエイリアス | 正規ID |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web検索">
    バンドルされた`grok` Web検索プロバイダーも`XAI_API_KEY`を使います。

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドルされた`xai` Pluginは、共有
    `video_generate`ツール経由で動画生成を登録します。

    - デフォルト動画モデル: `xai/grok-imagine-video`
    - モード: text-to-video、image-to-video、リモート動画編集、およびリモート動画延長
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 解像度: `480P`、`720P`
    - 長さ: 生成/image-to-videoでは1～15秒、延長では2～10秒

    <Warning>
    ローカル動画バッファは受け付けられません。動画の
    編集/延長入力にはリモート`http(s)` URLを使用してください。image-to-videoではローカル画像バッファを受け付けます。これは
    OpenClawがそれらをxAI用のdata URLへエンコードできるためです。
    </Warning>

    xAIをデフォルト動画プロバイダーとして使うには:

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
    共通のツールパラメーター、プロバイダー選択、およびフェイルオーバー動作については[Video Generation](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドルされた`xai` Pluginは、共有
    `image_generate`ツール経由で画像生成を登録します。

    - デフォルト画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: text-to-imageおよびreference-image編集
    - 参照入力: 1つの`image`または最大5つの`images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 数: 最大4画像

    OpenClawは、生成メディアを通常のチャネル添付パス経由で
    保存・配信できるように、xAIへ`b64_json`画像レスポンスを要求します。ローカル
    参照画像はdata URLへ変換され、リモート`http(s)`参照はそのまま渡されます。

    xAIをデフォルト画像プロバイダーとして使うには:

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
    xAIは`quality`、`mask`、`user`、および`1:2`、`2:1`、`9:20`、`20:9`のような
    追加ネイティブ比率も文書化しています。OpenClawは現在、
    共有クロスプロバイダー画像制御のみを転送します。未対応のネイティブ専用ノブは、
    意図的に`image_generate`経由では公開されていません。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    バンドルされた`xai` Pluginは、共有`tts`
    プロバイダーインターフェース経由でtext-to-speechを登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47コードまたは`auto`
    - 速度: プロバイダーネイティブの速度上書き
    - ネイティブOpusボイスノート形式はサポートされません

    xAIをデフォルトTTSプロバイダーとして使うには:

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
    OpenClawはxAIのバッチ`/v1/tts`エンドポイントを使います。xAIはWebSocket経由の
    ストリーミングTTSも提供していますが、OpenClawのspeech providerコントラクトは現在、
    返信配信前に完全な音声バッファを前提としています。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた`xai` Pluginは、OpenClawの
    media-understanding文字起こしインターフェース経由でバッチspeech-to-textも登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart音声ファイルアップロード
    - OpenClaw内で、受信音声文字起こしが
      `tools.media.audio`を使うあらゆる場所でサポートされます。Discord voice-channelセグメントや
      チャネル音声添付も含みます

    受信音声文字起こしでxAIを強制するには:

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

    言語は共有音声メディア設定経由または呼び出しごとの
    文字起こしリクエスト経由で指定できます。promptヒントは共有OpenClaw
    インターフェースで受け付けられますが、xAI REST STT連携は現在の公開xAIエンドポイントへ
    きれいに対応するfile、model、languageのみを転送します。

  </Accordion>

  <Accordion title="ストリーミングspeech-to-text">
    バンドルされた`xai` Pluginは、ライブvoice-call音声向けの
    realtime transcription providerも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトencoding: `mulaw`
    - デフォルトsample rate: `8000`
    - デフォルトendpointing: `800ms`
    - 中間transcript: デフォルトで有効

    Voice CallのTwilio media streamはG.711 µ-law音声フレームを送るため、
    xAI providerは変換なしでそれらのフレームを直接転送できます。

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
    `plugins.entries.voice-call.config.streaming.providers.xai`の下にあります。対応
    キーは`apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、および`language`です。

    <Note>
    このストリーミングproviderはVoice Callのrealtime文字起こしパス用です。
    Discord voiceは現在、短いセグメントを録音し、代わりにバッチ
    `tools.media.audio`文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search設定">
    バンドルされたxAI Pluginは、Grok経由でX（旧Twitter）コンテンツを検索するための
    OpenClawツールとして`x_search`を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー | 型 | デフォルト | 説明 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_searchを有効または無効にする |
    | `model`            | string  | `grok-4-1-fast`    | x_searchリクエストに使うモデル |
    | `inlineCitations`  | boolean | —                  | 結果にインライン引用を含める |
    | `maxTurns`         | number  | —                  | 最大会話ターン数 |
    | `timeoutSeconds`   | number  | —                  | リクエストタイムアウト（秒） |
    | `cacheTtlMinutes`  | number  | —                  | キャッシュTTL（分） |

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

  <Accordion title="コード実行設定">
    バンドルされたxAI Pluginは、
    xAIのsandbox環境でリモートコード実行するためのOpenClawツールとして`code_execution`を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー | 型 | デフォルト | 説明 |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | keyが利用可能なら`true` | コード実行を有効または無効にする |
    | `model`           | string  | `grok-4-1-fast`    | コード実行リクエストに使うモデル |
    | `maxTurns`        | number  | —                  | 最大会話ターン数 |
    | `timeoutSeconds`  | number  | —                  | リクエストタイムアウト（秒） |

    <Note>
    これはリモートxAI sandbox実行であり、ローカルの[`exec`](/ja-JP/tools/exec)ではありません。
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
    - 認証は現時点ではAPI-keyのみです。OpenClawにはまだxAI OAuthまたはdevice-codeフローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304`は、
      標準OpenClaw xAIトランスポートとは異なる上流API
      インターフェースを必要とするため、通常のxAI providerパスではサポートされていません。
    - xAI Realtime voiceは、まだOpenClaw providerとして登録されていません。これは
      バッチSTTやストリーミング文字起こしとは異なる双方向voice sessionコントラクトを必要とします。
    - xAI画像の`quality`、画像`mask`、および追加のネイティブ専用アスペクト比は、
      共有`image_generate`ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度な注意">
    - OpenClawは、共有runnerパス上でxAI固有のツールスキーマおよびtool-call互換性修正を自動適用します。
    - ネイティブxAIリクエストはデフォルトで`tool_stream: true`です。
      無効化するには`agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に設定してください。
    - バンドルされたxAIラッパーは、ネイティブxAIリクエスト送信前に
      未対応のstrict tool-schemaフラグとreasoning payloadキーを取り除きます。
    - `web_search`、`x_search`、`code_execution`はOpenClaw
      ツールとして公開されます。OpenClawは、すべてのネイティブツールを各チャットターンへ
      添付するのではなく、各ツールリクエスト内で必要な特定のxAI built-inだけを有効にします。
    - `x_search`と`code_execution`は、coreモデルランタイムへ
      ハードコードされているのではなく、バンドルされたxAI Pluginが所有します。
    - `code_execution`は、ローカル
      [`exec`](/ja-JP/tools/exec)ではなく、リモートxAI sandbox実行です。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAIメディアパスはunit testとオプトイン式live suiteでカバーされています。live
コマンドは、`XAI_API_KEY`をプローブする前に、
`~/.profile`を含むログインshellからsecretを読み込みます。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有liveファイルは、通常TTS、テレフォニー向けPCM
TTS、xAIバッチSTT経由の音声文字起こし、同じPCMのxAI
realtime STT経由ストリーミング、text-to-image出力生成、および参照画像編集を行います。共有画像liveファイルは、OpenClawの
ランタイム選択、フォールバック、正規化、およびメディア添付パスを通じて、同じxAI providerを確認します。

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、およびフェイルオーバー動作の選び方。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共通の動画ツールパラメーターとプロバイダー選択。
  </Card>
  <Card title="All providers" href="/ja-JP/providers/index" icon="grid-2">
    より広いプロバイダー概要。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw で Grok モデルを使用したい場合
    - xAI 認証またはモデル ID を設定している場合
summary: xAI Grok モデルを OpenClaw で使用する
title: xAI
x-i18n:
    generated_at: "2026-05-02T05:04:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw は Grok モデル向けにバンドル済みの `xai` プロバイダーPluginを同梱しています。

## はじめに

<Steps>
  <Step title="API キーを作成する">
    [xAI コンソール](https://console.x.ai/)で API キーを作成します。
  </Step>
  <Step title="API キーを設定する">
    `XAI_API_KEY` を設定するか、次を実行します。

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="モデルを選択する">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw は、バンドル済み xAI トランスポートとして xAI Responses API を使用します。同じ
`XAI_API_KEY` は、Grok ベースの `web_search`、ファーストクラスの `x_search`、
およびリモート `code_execution` にも使用できます。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存している場合、
バンドル済みの xAI モデルプロバイダーはそのキーもフォールバックとして再利用します。
Grok `web_search` と、デフォルトでは `x_search` をオペレーターの xAI Responses プロキシ経由にルーティングするには、
`plugins.entries.xai.config.webSearch.baseUrl` を設定します。
`code_execution` の調整は `plugins.entries.xai.config.codeExecution` にあります。
</Note>

## 組み込みカタログ

OpenClaw には、これらの xAI モデルファミリーが標準で含まれています。

| ファミリー     | モデル ID                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

このPluginは、同じ API 形状に従う場合、新しい `grok-4*` と `grok-code-fast*` の ID も前方解決します。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast`、および `grok-4.20-beta-*`
バリアントは、バンドル済みカタログ内の現在の画像対応 Grok 参照です。
</Tip>

## OpenClaw の機能対応範囲

バンドル済みPluginは、xAI の現在の公開 API サーフェスを OpenClaw の共有プロバイダーおよびツール契約に対応付けます。
共有契約に適合しない機能（たとえばストリーミング TTS やリアルタイム音声）は公開されません。下の表を参照してください。

| xAI の機能                  | OpenClaw サーフェス                       | ステータス                                                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` モデルプロバイダー          | はい                                                                |
| サーバー側 Web 検索        | `web_search` プロバイダー `grok`          | はい                                                                |
| サーバー側 X 検索          | `x_search` ツール                         | はい                                                                |
| サーバー側コード実行       | `code_execution` ツール                   | はい                                                                |
| 画像                       | `image_generate`                          | はい                                                                |
| 動画                       | `video_generate`                          | はい                                                                |
| バッチテキスト読み上げ     | `messages.tts.provider: "xai"` / `tts`    | はい                                                                |
| ストリーミング TTS         | —                                         | 公開されていません。OpenClaw の TTS 契約は完全な音声バッファーを返します |
| バッチ音声認識             | `tools.media.audio` / メディア理解        | はい                                                                |
| ストリーミング音声認識     | Voice Call `streaming.provider: "xai"`    | はい                                                                |
| リアルタイム音声           | —                                         | まだ公開されていません。別のセッション/WebSocket 契約です           |
| ファイル / バッチ          | 汎用モデル API 互換性のみ                 | ファーストクラスの OpenClaw ツールではありません                    |

<Note>
OpenClaw は、メディア生成、音声、バッチ文字起こしに xAI の REST 画像/動画/TTS/STT API を使用し、
ライブ音声通話の文字起こしに xAI のストリーミング STT WebSocket を使用し、
モデル、検索、コード実行ツールに Responses API を使用します。Realtime 音声セッションなど、
異なる OpenClaw 契約が必要な機能は、隠れたPlugin動作ではなく、上流の機能としてここに記載されています。
</Note>

### 高速モードのマッピング

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
は、ネイティブ xAI リクエストを次のように書き換えます。

| ソースモデル  | 高速モードのターゲット |
| ------------- | ---------------------- |
| `grok-3`      | `grok-3-fast`          |
| `grok-3-mini` | `grok-3-mini-fast`     |
| `grok-4`      | `grok-4-fast`          |
| `grok-4-0709` | `grok-4-fast`          |

### レガシー互換エイリアス

レガシーエイリアスは、引き続き正規のバンドル済み ID に正規化されます。

| レガシーエイリアス        | 正規 ID                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web 検索">
    バンドル済みの `grok` Web 検索プロバイダーも `XAI_API_KEY` を使用します。

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済みの `xai` Pluginは、共有 `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトの動画モデル: `xai/grok-imagine-video`
    - モード: テキストから動画、画像から動画、参照画像生成、リモート動画編集、リモート動画延長
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/画像から動画では 1-15 秒、`reference_image` ロールを使用する場合は 1-10 秒、延長では 2-10 秒
    - 参照画像生成: すべての指定画像の `imageRoles` を `reference_image` に設定します。xAI はそのような画像を最大 7 枚受け入れます

    <Warning>
    ローカル動画バッファーは受け付けられません。動画編集/延長入力にはリモート `http(s)` URL を使用してください。
    画像から動画ではローカル画像バッファーを受け付けます。OpenClaw がそれらを xAI 向けのデータ URL としてエンコードできるためです。
    </Warning>

    xAI をデフォルトの動画プロバイダーとして使用するには:

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
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済みの `xai` Pluginは、共有 `image_generate` ツールを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: テキストから画像、参照画像編集
    - 参照入力: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 枚数: 最大 4 枚

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求します。これにより、生成されたメディアを通常のチャネル添付パスを通じて保存および配信できます。
    ローカル参照画像はデータ URL に変換され、リモート `http(s)` 参照はそのまま渡されます。

    xAI をデフォルトの画像プロバイダーとして使用するには:

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` などの追加のネイティブ比率も文書化しています。
    OpenClaw は現在、共有クロスプロバイダー画像コントロールのみを転送します。サポートされていないネイティブ専用ノブは、意図的に `image_generate` 経由では公開していません。
    </Note>

  </Accordion>

  <Accordion title="テキスト読み上げ">
    バンドル済みの `xai` Pluginは、共有 `tts` プロバイダーサーフェスを通じてテキスト読み上げを登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: プロバイダーのネイティブ速度オーバーライド
    - ネイティブ Opus ボイスメモ形式はサポートされていません

    xAI をデフォルトの TTS プロバイダーとして使用するには:

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
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使用します。xAI は WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の音声プロバイダー契約は現在、返信配信前に完全な音声バッファーを期待しています。
    </Note>

  </Accordion>

  <Accordion title="音声認識">
    バンドル済みの `xai` Pluginは、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声認識を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - `tools.media.audio` を使用する受信音声文字起こしが行われる OpenClaw のあらゆる場所でサポートされます。これには Discord 音声チャネルセグメントとチャネル音声添付が含まれます

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

    言語は、共有音声メディア設定または呼び出しごとの文字起こしリクエストを通じて指定できます。
    プロンプトヒントは共有 OpenClaw サーフェスで受け付けますが、xAI REST STT 統合はファイル、モデル、言語のみを転送します。これらが現在の公開 xAI エンドポイントに明確に対応するためです。

  </Accordion>

  <Accordion title="ストリーミング音声認識">
    バンドル済みの `xai` Pluginは、ライブ音声通話音声向けのリアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポインティング: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、
    xAI プロバイダーはトランスコーディングなしでそれらのフレームを直接転送できます。

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

    Provider 所有の設定は
    `plugins.entries.voice-call.config.streaming.providers.xai` の下にあります。サポートされる
    キーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミング Provider は、Voice Call のリアルタイム文字起こしパス用です。
    Discord 音声は現在、短いセグメントを録音し、代わりにバッチの
    `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    同梱の xAI Plugin は、Grok 経由で X（旧 Twitter）コンテンツを検索するための
    OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型      | デフォルト         | 説明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search を有効または無効にする      |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使用するモデル  |
    | `baseUrl`          | string  | —                  | xAI Responses ベース URL の上書き     |
    | `inlineCitations`  | boolean | —                  | 結果にインライン引用を含める         |
    | `maxTurns`         | number  | —                  | 会話ターンの最大数                   |
    | `timeoutSeconds`   | number  | —                  | リクエストタイムアウト（秒）         |
    | `cacheTtlMinutes`  | number  | —                  | キャッシュの有効期間（分）           |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
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
    同梱の xAI Plugin は、xAI のサンドボックス環境でリモートコード実行を行うための
    OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型      | デフォルト              | 説明                                   |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`（キーが利用可能な場合） | コード実行を有効または無効にする |
    | `model`           | string  | `grok-4-1-fast`    | コード実行リクエストに使用するモデル     |
    | `maxTurns`        | number  | —                  | 会話ターンの最大数                       |
    | `timeoutSeconds`  | number  | —                  | リクエストタイムアウト（秒）             |

    <Note>
    これはリモートの xAI サンドボックス実行であり、ローカルの [`exec`](/ja-JP/tools/exec) ではありません。
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
    - 認証は現在 API キーのみです。OpenClaw にはまだ xAI OAuth やデバイスコードフローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304` は、標準の OpenClaw xAI トランスポートとは異なるアップストリーム API サーフェスを必要とするため、通常の xAI Provider パスではサポートされません。
    - xAI Realtime 音声はまだ OpenClaw Provider として登録されていません。バッチ STT やストリーミング文字起こしとは異なる、双方向音声セッション契約が必要です。
    - xAI 画像の `quality`、画像 `mask`、追加のネイティブ専用アスペクト比は、共有 `image_generate` ツールに対応するクロス Provider 制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度な注記">
    - OpenClaw は共有ランナーパスで、xAI 固有のツールスキーマおよびツール呼び出しの互換性修正を自動的に適用します。
    - ネイティブ xAI リクエストではデフォルトで `tool_stream: true` です。無効にするには
      `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - 同梱の xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない strict ツールスキーマフラグと reasoning ペイロードキーを取り除きます。
    - `web_search`、`x_search`、`code_execution` は OpenClaw ツールとして公開されます。OpenClaw は、すべてのネイティブツールを各チャットターンに付加するのではなく、各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効にします。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。
      `x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後
      Grok Web 検索ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、同梱の xAI Plugin が所有します。
    - `code_execution` はリモートの xAI サンドボックス実行であり、ローカルの
      [`exec`](/ja-JP/tools/exec) ではありません。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスは、ユニットテストとオプトインのライブスイートでカバーされています。ライブ
コマンドは、`XAI_API_KEY` を調べる前に、`~/.profile` を含むログインシェルからシークレットを読み込みます。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Provider 固有のライブファイルは、通常の TTS、電話向け PCM
TTS を合成し、xAI バッチ STT 経由で音声を文字起こしし、同じ PCM を xAI
リアルタイム STT 経由でストリーミングし、テキストから画像への出力を生成し、参照画像を編集します。
共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、メディア添付パスを通じて同じ xAI Provider を検証します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    Provider、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールパラメーターと Provider 選択。
  </Card>
  <Card title="すべての Provider" href="/ja-JP/providers/index" icon="grid-2">
    より広範な Provider 概要。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

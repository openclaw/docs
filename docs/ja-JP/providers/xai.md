---
read_when:
    - OpenClaw で Grok モデルを使用したい場合
    - xAI 認証またはモデル ID を設定している
summary: OpenClawでxAI Grokモデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-05-10T19:50:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル用のバンドル済み `xai` provider plugin が同梱されています。

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
  <Step title="モデルを選択する">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw は、バンドル済み xAI トランスポートとして xAI Responses API を使用します。`openclaw onboard --auth-choice xai-api-key` の同じ
API キーは、ファーストクラスの `x_search` とリモート `code_execution` にも使用できます。`XAI_API_KEY` または plugin の
web-search config は、Grok ベースの `web_search` にも使用できます。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存している場合、
バンドル済み xAI model provider もそのキーをフォールバックとして再利用します。
Grok `web_search` と、デフォルトでは `x_search` を operator xAI Responses proxy 経由にルーティングするには、
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

この plugin は、同じ API 形状に従う新しい `grok-4*` と `grok-code-fast*` の ID も前方解決します。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast`、および `grok-4.20-beta-*`
バリアントは、バンドル済みカタログ内の現在の画像対応 Grok 参照です。
</Tip>

## OpenClaw の機能対応範囲

バンドル済み plugin は、xAI の現在の公開 API サーフェスを OpenClaw の共有
provider およびツール契約にマッピングします。共有契約に適合しない機能
（たとえばストリーミング TTS やリアルタイム音声）は公開されません。下の表を参照してください。

| xAI の機能                 | OpenClaw サーフェス                      | ステータス                                                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` model provider              | 対応                                                                |
| サーバー側 web search      | `web_search` provider `grok`              | 対応                                                                |
| サーバー側 X search        | `x_search` tool                           | 対応                                                                |
| サーバー側コード実行       | `code_execution` tool                     | 対応                                                                |
| 画像                       | `image_generate`                          | 対応                                                                |
| 動画                       | `video_generate`                          | 対応                                                                |
| バッチ text-to-speech      | `messages.tts.provider: "xai"` / `tts`    | 対応                                                                |
| ストリーミング TTS         | -                                         | 非公開。OpenClaw の TTS 契約は完全な音声バッファを返します         |
| バッチ speech-to-text      | `tools.media.audio` / メディア理解        | 対応                                                                |
| ストリーミング speech-to-text | Voice Call `streaming.provider: "xai"` | 対応                                                                |
| リアルタイム音声           | -                                         | まだ非公開。別のセッション/WebSocket 契約です                      |
| ファイル / バッチ          | 汎用 model API 互換性のみ                 | ファーストクラスの OpenClaw ツールではありません                   |

<Note>
OpenClaw は、メディア生成、音声、バッチ文字起こしに xAI の REST 画像/動画/TTS/STT API を使用し、ライブ音声通話の文字起こしに xAI のストリーミング STT WebSocket を使用し、モデル、検索、コード実行ツールに Responses API を使用します。Realtime 音声セッションのように別の OpenClaw 契約を必要とする機能は、隠れた plugin 動作ではなく、上流機能としてここに記載されています。
</Note>

### Fast-mode のマッピング

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
は、ネイティブ xAI リクエストを次のように書き換えます。

| ソースモデル  | Fast-mode ターゲット |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

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
  <Accordion title="Web search">
    バンドル済みの `grok` web-search provider は、`XAI_API_KEY` または plugin の
    web-search キーを使用できます。

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済みの `xai` plugin は、共有 `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトの動画モデル: `xai/grok-imagine-video`
    - モード: text-to-video、image-to-video、reference-image 生成、リモート動画編集、リモート動画延長
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/image-to-video は 1〜15 秒、`reference_image` ロールの使用時は 1〜10 秒、延長は 2〜10 秒
    - Reference-image 生成: すべての提供画像に `imageRoles` を `reference_image` として設定します。xAI はそのような画像を最大 7 枚受け付けます

    <Warning>
    ローカル動画バッファは受け付けられません。動画編集/延長の入力にはリモート `http(s)` URL を使用してください。Image-to-video はローカル画像バッファを受け付けます。OpenClaw がそれらを xAI 用の data URL としてエンコードできるためです。
    </Warning>

    xAI をデフォルトの動画 provider として使用するには:

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
    共有ツールパラメータ、provider 選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済みの `xai` plugin は、共有 `image_generate` ツールを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: text-to-image と reference-image edit
    - 参照入力: 1 つの `image`、または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 件数: 最大 4 画像

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求します。これにより、生成されたメディアを通常のチャンネル添付パスを通じて保存および配信できます。ローカル参照画像は data URL に変換されます。リモート `http(s)` 参照はそのまま渡されます。

    xAI をデフォルトの画像 provider として使用するには:

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` などの追加のネイティブ比率も文書化しています。OpenClaw は現在、共有クロスプロバイダー画像コントロールのみを転送します。サポートされていないネイティブ専用の調整項目は、意図的に `image_generate` から公開していません。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    バンドル済みの `xai` plugin は、共有 `tts` provider サーフェスを通じて text-to-speech を登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: provider ネイティブの速度オーバーライド
    - ネイティブ Opus 音声メモ形式はサポートされていません

    xAI をデフォルトの TTS provider として使用するには:

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
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使用します。xAI は WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の音声 provider 契約は現在、返信配信前に完全な音声バッファを期待します。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドル済みの `xai` plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - OpenClaw では、Discord 音声チャンネルセグメントやチャンネル音声添付を含め、インバウンド音声文字起こしが `tools.media.audio` を使用する場所でサポートされます

    インバウンド音声文字起こしに xAI を強制するには:

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

    言語は、共有音声メディア config または呼び出しごとの文字起こしリクエストを通じて指定できます。プロンプトヒントは共有 OpenClaw サーフェスで受け付けられますが、xAI REST STT 統合は、現在の公開 xAI エンドポイントにきれいに対応する file、model、language のみを転送します。

  </Accordion>

  <Accordion title="ストリーミング speech-to-text">
    バンドル済みの `xai` plugin は、ライブ音声通話音声用のリアルタイム文字起こし provider も登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポイント判定: `800ms`
    - 暫定トランスクリプト: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、
    xAI provider はトランスコードせずにそれらのフレームを直接転送できます。

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

    プロバイダーが所有する設定は
    `plugins.entries.voice-call.config.streaming.providers.xai` の下にあります。サポートされる
    キーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。
    Discord 音声は現在、短いセグメントを録音し、代わりにバッチ
    `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    バンドルされた xAI Plugin は、Grok 経由で X（旧 Twitter）のコンテンツを検索する
    OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型      | デフォルト         | 説明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search を有効または無効にする      |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使用するモデル  |
    | `baseUrl`          | string  | -                  | xAI Responses ベース URL の上書き     |
    | `inlineCitations`  | boolean | -                  | 結果にインライン引用を含める         |
    | `maxTurns`         | number  | -                  | 最大会話ターン数                     |
    | `timeoutSeconds`   | number  | -                  | リクエストのタイムアウト秒数         |
    | `cacheTtlMinutes`  | number  | -                  | キャッシュの有効期間（分）           |

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
    バンドルされた xAI Plugin は、xAI のサンドボックス環境でリモートコード実行を行う
    OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型      | デフォルト              | 説明                                    |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`（キーが利用可能な場合） | コード実行を有効または無効にする |
    | `model`           | string  | `grok-4-1-fast`    | コード実行リクエストに使用するモデル     |
    | `maxTurns`        | number  | -                  | 最大会話ターン数                         |
    | `timeoutSeconds`  | number  | -                  | リクエストのタイムアウト秒数             |

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
    - 認証は現在 API キーのみです。API キーは xAI 認証
      プロファイル、環境変数、または Plugin 設定に保存できます。OpenClaw にはまだ xAI OAuth や
      デバイスコードフローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304` は、通常の xAI プロバイダーパスでは
      サポートされていません。標準の OpenClaw xAI トランスポートとは異なる上流 API
      サーフェスが必要なためです。
    - xAI Realtime 音声は、まだ OpenClaw プロバイダーとして登録されていません。バッチ STT や
      ストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像の `quality`、画像 `mask`、および追加のネイティブ専用アスペクト比は、
      共有 `image_generate` ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度なメモ">
    - OpenClaw は、共有ランナーパスで xAI 固有のツールスキーマおよびツール呼び出し互換性修正を
      自動的に適用します。
    - ネイティブ xAI リクエストはデフォルトで `tool_stream: true` です。無効にするには
      `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない strict ツールスキーマフラグと
      reasoning ペイロードキーを取り除きます。
    - `web_search`、`x_search`、`code_execution` は OpenClaw
      ツールとして公開されます。OpenClaw は、すべてのネイティブツールを各チャットターンに付加するのではなく、
      各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効にします。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。
      `x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後
      Grok web-search ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、
      バンドルされた xAI Plugin が所有します。
    - `code_execution` はリモートの xAI サンドボックス実行であり、ローカルの
      [`exec`](/ja-JP/tools/exec) ではありません。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスは、ユニットテストとオプトインのライブスイートでカバーされています。ライブ
コマンドは、`XAI_API_KEY` をプローブする前に、`~/.profile` を含むログインシェルから
シークレットを読み込みます。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS、電話向け PCM
TTS を合成し、xAI バッチ STT で音声を文字起こしし、同じ PCM を xAI
リアルタイム STT でストリーミングし、text-to-image 出力を生成し、参照画像を編集します。共有
画像ライブファイルは、OpenClaw の
ランタイム選択、フォールバック、正規化、メディア添付パスを通じて、同じ xAI プロバイダーを検証します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="すべてのプロバイダー" href="/ja-JP/providers/index" icon="grid-2">
    より広範なプロバイダー概要。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

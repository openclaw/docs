---
read_when:
    - OpenClawでGrokモデルを使用したい
    - xAI の認証またはモデル ID を設定している
summary: OpenClaw で xAI Grok モデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-05-06T05:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル向けのバンドル済み `xai` プロバイダー Plugin が同梱されています。

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
OpenClaw は、バンドル済み xAI トランスポートとして xAI Responses API を使用します。同じ
`XAI_API_KEY` は、Grok ベースの `web_search`、ファーストクラスの `x_search`、
リモート `code_execution` にも使用できます。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存した場合、
バンドル済み xAI モデルプロバイダーもそのキーをフォールバックとして再利用します。
`plugins.entries.xai.config.webSearch.baseUrl` を設定すると、Grok `web_search`
と、デフォルトでは `x_search` を、オペレーターの xAI Responses プロキシ経由でルーティングできます。
`code_execution` の調整は `plugins.entries.xai.config.codeExecution` 配下にあります。
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

この Plugin は、同じ API 形状に従う場合、新しい `grok-4*` と `grok-code-fast*` の ID も前方解決します。

<Tip>
`grok-4.3`、`grok-4-fast`、`grok-4-1-fast`、および `grok-4.20-beta-*`
バリアントは、バンドル済みカタログ内の現在の画像対応 Grok 参照です。
</Tip>

## OpenClaw 機能カバレッジ

バンドル済み Plugin は、xAI の現在の公開 API サーフェスを OpenClaw の共有プロバイダーおよびツール契約にマッピングします。共有契約に合わない機能
（たとえばストリーミング TTS やリアルタイム音声）は公開されません。下の表を参照してください。

| xAI 機能                  | OpenClaw サーフェス                       | ステータス                                                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| チャット / Responses       | `xai/<model>` モデルプロバイダー          | はい                                                                |
| サーバー側 Web 検索        | `web_search` プロバイダー `grok`          | はい                                                                |
| サーバー側 X 検索          | `x_search` ツール                         | はい                                                                |
| サーバー側コード実行       | `code_execution` ツール                   | はい                                                                |
| 画像                       | `image_generate`                          | はい                                                                |
| 動画                       | `video_generate`                          | はい                                                                |
| バッチテキスト読み上げ     | `messages.tts.provider: "xai"` / `tts`    | はい                                                                |
| ストリーミング TTS         | -                                         | 公開されていません。OpenClaw の TTS 契約は完全な音声バッファーを返します |
| バッチ音声テキスト化       | `tools.media.audio` / メディア理解        | はい                                                                |
| ストリーミング音声テキスト化 | Voice Call `streaming.provider: "xai"`    | はい                                                                |
| リアルタイム音声           | -                                         | まだ公開されていません。異なるセッション/WebSocket 契約です         |
| ファイル / バッチ          | 汎用モデル API 互換性のみ                 | ファーストクラスの OpenClaw ツールではありません                    |

<Note>
OpenClaw は、メディア生成、音声、バッチ文字起こしに xAI の REST 画像/動画/TTS/STT API を使用し、
ライブ音声通話の文字起こしに xAI のストリーミング STT WebSocket を使用し、モデル、検索、コード実行ツールに Responses API を使用します。
Realtime voice セッションなど、異なる OpenClaw 契約が必要な機能は、隠れた Plugin 動作ではなく、上流機能としてここに記載されています。
</Note>

### 高速モードのマッピング

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
は、ネイティブ xAI リクエストを次のように書き換えます。

| ソースモデル  | 高速モードのターゲット |
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
  <Accordion title="Web 検索">
    バンドル済みの `grok` Web 検索プロバイダーも `XAI_API_KEY` を使用します。

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済みの `xai` Plugin は、共有 `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトの動画モデル: `xai/grok-imagine-video`
    - モード: テキストから動画、画像から動画、参照画像生成、リモート動画編集、リモート動画延長
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/画像から動画では 1〜15 秒、`reference_image` ロールを使用する場合は 1〜10 秒、延長では 2〜10 秒
    - 参照画像生成: 提供するすべての画像で `imageRoles` を `reference_image` に設定します。xAI はそのような画像を最大 7 枚受け付けます

    <Warning>
    ローカル動画バッファーは受け付けられません。動画編集/延長入力にはリモート `http(s)` URL を使用してください。画像から動画では、OpenClaw がそれらを xAI 向けの data URL としてエンコードできるため、ローカル画像バッファーを受け付けます。
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
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済みの `xai` Plugin は、共有 `image_generate` ツールを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-pro`
    - モード: テキストから画像、参照画像編集
    - 参照入力: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 数量: 最大 4 画像

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求するため、生成されたメディアを通常のチャンネル添付パスを通じて保存および配信できます。ローカル参照画像は data URL に変換されます。リモート `http(s)` 参照はそのまま渡されます。

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` などの追加ネイティブ比率も文書化しています。OpenClaw は現在、共有のクロスプロバイダー画像コントロールのみを転送します。サポートされていないネイティブ専用ノブは、意図的に `image_generate` から公開されていません。
    </Note>

  </Accordion>

  <Accordion title="テキスト読み上げ">
    バンドル済みの `xai` Plugin は、共有 `tts` プロバイダーサーフェスを通じてテキスト読み上げを登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: プロバイダーネイティブの速度オーバーライド
    - ネイティブ Opus ボイスノート形式はサポートされていません

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
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使用します。xAI は WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の音声プロバイダー契約は現在、返信配信前に完全な音声バッファーを期待します。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト化">
    バンドル済みの `xai` Plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声テキスト化を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - `tools.media.audio` を使用する受信音声文字起こしのすべての場所で OpenClaw によりサポートされます。これには Discord 音声チャンネルセグメントとチャンネル音声添付ファイルが含まれます

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

    言語は、共有音声メディア設定または呼び出しごとの文字起こしリクエストを通じて指定できます。プロンプトヒントは共有 OpenClaw サーフェスで受け付けられますが、xAI REST STT 統合は、現在の公開 xAI エンドポイントにきれいに対応する file、model、language のみを転送します。

  </Accordion>

  <Accordion title="ストリーミング音声テキスト化">
    バンドル済みの `xai` Plugin は、ライブ音声通話向けのリアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポイント処理: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、xAI プロバイダーはトランスコードせずにそれらのフレームを直接転送できます。

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
    `plugins.entries.voice-call.config.streaming.providers.xai` 配下にあります。サポートされる
    キーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミングプロバイダーは、Voice Call のリアルタイム文字起こしパス用です。
    Discord 音声は現在、短いセグメントを録音し、代わりにバッチの
    `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search の設定">
    バンドルされた xAI Plugin は、Grok 経由で X（旧 Twitter）コンテンツを検索するための
    OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型      | デフォルト         | 説明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search を有効化または無効化        |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使用されるモデル |
    | `baseUrl`          | string  | -                  | xAI Responses ベース URL のオーバーライド |
    | `inlineCitations`  | boolean | -                  | 結果にインライン引用を含める         |
    | `maxTurns`         | number  | -                  | 最大会話ターン数                     |
    | `timeoutSeconds`   | number  | -                  | リクエストタイムアウト（秒）         |
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

  <Accordion title="コード実行の設定">
    バンドルされた xAI Plugin は、xAI のサンドボックス環境でリモートコード実行を行うための
    OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型      | デフォルト         | 説明                                      |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`（キーが利用可能な場合） | コード実行を有効化または無効化   |
    | `model`           | string  | `grok-4-1-fast`    | コード実行リクエストに使用されるモデル    |
    | `maxTurns`        | number  | -                  | 最大会話ターン数                         |
    | `timeoutSeconds`  | number  | -                  | リクエストタイムアウト（秒）             |

    <Note>
    これはリモート xAI サンドボックス実行であり、ローカルの [`exec`](/ja-JP/tools/exec) ではありません。
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
    - 現在、認証は API キーのみです。OpenClaw にはまだ xAI OAuth やデバイスコードフローはありません。
    - `grok-4.20-multi-agent-experimental-beta-0304` は、標準の OpenClaw xAI トランスポートとは異なるアップストリーム API サーフェスを必要とするため、通常の xAI provider パスではサポートされていません。
    - xAI Realtime 音声は、まだ OpenClaw provider として登録されていません。バッチ STT やストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像の `quality`、画像の `mask`、および追加のネイティブ専用アスペクト比は、共有 `image_generate` ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度な注記">
    - OpenClaw は、共有ランナーパスで xAI 固有のツールスキーマおよびツール呼び出し互換性修正を自動的に適用します。
    - ネイティブ xAI リクエストはデフォルトで `tool_stream: true` です。無効にするには、
      `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない strict ツールスキーマフラグと reasoning ペイロードキーを取り除きます。
    - `web_search`、`x_search`、`code_execution` は OpenClaw ツールとして公開されます。OpenClaw は、すべてのチャットターンにすべてのネイティブツールを添付するのではなく、各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効化します。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。
      `x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後
      Grok web-search ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされているのではなく、バンドルされた xAI Plugin が所有します。
    - `code_execution` はリモート xAI サンドボックス実行であり、ローカルの
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

provider 固有のライブファイルは、通常の TTS、テレフォニー向け PCM
TTS を合成し、xAI バッチ STT 経由で音声を文字起こしし、同じ PCM を xAI
realtime STT 経由でストリーミングし、text-to-image 出力を生成し、参照画像を編集します。共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、メディア添付パスを通じて同じ xAI provider を検証します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターと provider 選択。
  </Card>
  <Card title="すべての provider" href="/ja-JP/providers/index" icon="grid-2">
    より広範な provider の概要。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

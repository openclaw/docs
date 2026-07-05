---
read_when:
    - OpenClaw で Grok モデルを使いたい
    - xAI 認証またはモデル ID を設定しています
summary: OpenClawでxAI Grokモデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-07-05T11:47:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9dedad8793a7c54a4f46371e72095ff70e74886fc05d7321035bd09cadbf0efd
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw は Grok モデル向けのバンドル済み `xai` provider plugin を同梱しています。推奨パスは、対象となる SuperGrok または X Premium サブスクリプションでの Grok OAuth です。Gateway、設定、ルーティング、ツールはローカルに残り、Grok リクエストだけが xAI の API に送信されます。

OAuth には xAI API キーや Grok Build アプリは不要です。OpenClaw は xAI の共有 OAuth クライアントを使用するため、xAI は同意画面に Grok Build を表示する場合があります。

## セットアップ

<Steps>
  <Step title="新規インストール">
    daemon インストール付きでオンボーディングを実行し、model/auth ステップで xAI/Grok OAuth を選択します。

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 上または SSH 経由では、xAI OAuth を直接選択してください。device-code 検証を使用し、localhost コールバックは不要です。

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="既存インストール">
    xAI にだけサインインします。Grok を接続するためだけにフルオンボーディングを再実行しないでください。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok をデフォルトモデルとして別途適用します。

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway、daemon、チャンネル、ワークスペース、その他のセットアップ選択を意図的に変更したい場合にのみ、フルオンボーディングを再実行してください。

  </Step>
  <Step title="API キーパス">
    API キー設定は、xAI Console キー、およびキーに基づく provider 設定が必要なメディアサーフェスでも引き続き機能します。

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="モデルを選択">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw は、バンドル済み xAI トランスポートとして xAI Responses API を使用します。`openclaw models auth login --provider xai --method oauth` または `--method api-key` からの同じ認証情報は、`web_search`（provider id `grok`）、`x_search`、`code_execution`、音声/文字起こし、xAI 画像/動画生成にも使われます。xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存している場合、バンドル済み xAI model provider もそれをフォールバックとして再利用します。
</Note>

## OAuth トラブルシューティング

- SSH、Docker、VPS、その他のリモートセットアップでは、`openclaw models auth login --provider xai --method oauth` を使用してください。localhost コールバックではなく device-code 検証を使用します。
- サインインに成功したのに Grok がデフォルトモデルになっていない場合は、`openclaw models set xai/grok-4.3` を実行します。
- 保存済みの xAI auth プロファイルを確認します。

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- OAuth API トークンを受け取れるアカウントは xAI が決定します。アカウントが対象外の場合は、API キーパスを使用するか、xAI 側でサブスクリプションを確認してください。

<Tip>
SSH、Docker、VPS からサインインする場合は `xai-oauth` を使用してください。OpenClaw は URL と短いコードを表示します。リモートプロセスが完了済みトークン交換を xAI にポーリングしている間に、任意のローカルブラウザーでサインインを完了します。
</Tip>

## 組み込みカタログ

モデルピッカーで選択可能な id です。この Plugin は既存設定向けに、古い Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast、Grok Code の id も引き続き解決します。[レガシー互換エイリアス](#legacy-compatibility-aliases)を参照してください。

| ファミリー     | モデル id                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

<Tip>
汎用チャットには `grok-4.3` を、ビルド/コーディング重視のワークロードには `grok-build-0.1` を使用してください。ただし Grok 4.20 beta エイリアスが必要な場合は除きます。
</Tip>

## 機能カバレッジ

バンドル済み Plugin は、xAI の現在の公開 API サーフェスを OpenClaw の共有 provider およびツール契約にマッピングします。ストリーミング TTS やリアルタイム音声など、共有契約に適合しない機能は公開されません。

| xAI 機能                   | OpenClaw サーフェス                    | ステータス                                                          |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| チャット / Responses       | `xai/<model>` model provider            | はい                                                                |
| サーバー側 Web 検索        | `web_search` provider `grok`            | はい                                                                |
| サーバー側 X 検索          | `x_search` tool                         | はい                                                                |
| サーバー側コード実行       | `code_execution` tool                   | はい                                                                |
| 画像                       | `image_generate`                        | はい                                                                |
| 動画                       | `video_generate`                        | はい                                                                |
| バッチ text-to-speech      | `messages.tts.provider: "xai"` / `tts`  | はい                                                                |
| ストリーミング TTS         | -                                       | 公開されません。OpenClaw の TTS 契約は完全な音声バッファを返します |
| バッチ speech-to-text      | `tools.media.audio` media understanding | はい                                                                |
| ストリーミング speech-to-text | Voice Call `streaming.provider: "xai"` | はい                                                                |
| リアルタイム音声           | -                                       | まだ公開されていません。別のセッション/WebSocket 契約が必要です    |
| ファイル / バッチ          | 汎用モデル API 互換性のみ              | 第一級の OpenClaw ツールではありません                             |

<Note>
OpenClaw は、メディア生成とバッチ文字起こしに xAI の REST 画像/動画/TTS/STT API を、ライブ音声通話の文字起こしに xAI のストリーミング STT WebSocket を、チャット、検索、コード実行ツールに Responses API を使用します。
</Note>

### fast-mode マッピング

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true` は、ネイティブ xAI リクエストを次のように書き換えます。

| ソースモデル  | fast-mode ターゲット |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換エイリアス

レガシーエイリアスは、標準のバンドル済み id に正規化されます。

| レガシーエイリアス                                                          | 標準 id                               |
| --------------------------------------------------------------------------- | ------------------------------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825`               | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`                                                     | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`                                                   | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`, `grok-4.20-experimental-beta-0304-reasoning`         | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`, `grok-4.20-experimental-beta-0304-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web 検索">
    バンドル済みの `grok` Web 検索 provider は xAI OAuth を優先し、その後 `XAI_API_KEY` または Plugin の Web 検索キーにフォールバックします。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済み `xai` Plugin は、共有 `video_generate` ツールを通じて動画生成を登録します。

    - デフォルト動画モデル: `xai/grok-imagine-video`
    - モード: text-to-video、image-to-video、reference-image 生成、リモート動画編集、リモート動画拡張
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/image-to-video は 1-15 秒、`reference_image` ロール使用時は 1-10 秒、拡張は 2-10 秒
    - reference-image 生成: 提供するすべての画像で `imageRoles` を `reference_image` に設定します。xAI はそのような画像を最大 7 枚まで受け入れます
    - デフォルト操作タイムアウト: `video_generate.timeoutMs` または `agents.defaults.videoGenerationModel.timeoutMs` が設定されていない限り 600 秒

    <Warning>
    ローカル動画バッファは受け付けられません。動画編集/拡張入力にはリモート `http(s)` URL を使用してください。OpenClaw が xAI 向けにそれらを data URL としてエンコードするため、image-to-video はローカル画像バッファを受け付けます。
    </Warning>

    xAI をデフォルト動画 provider として使用するには:

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
    共有ツールのパラメーター、provider 選択、フェイルオーバー動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済み `xai` Plugin は、共有 `image_generate` ツールを通じて画像生成を登録します。

    - デフォルト画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-quality`
    - モード: text-to-image と reference-image 編集
    - 参照入力: 1 つの `image`、または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 数: 最大 4 画像
    - デフォルト操作タイムアウト: `image_generate.timeoutMs` または `agents.defaults.imageGenerationModel.timeoutMs` が設定されていない限り 600 秒

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求します。これにより、生成されたメディアを通常のチャンネル添付パスで保存および配信できます。ローカル参照画像は data URL に変換され、リモート `http(s)` 参照は変更されずに通過します。

    xAI をデフォルト画像 provider として使用するには:

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` などの追加ネイティブ比率も文書化しています。OpenClaw は現在、共有のクロス provider 画像コントロールのみを転送します。これらのネイティブ専用の調整項目は `image_generate` では公開されません。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    バンドル済み `xai` Plugin は、共有 `tts` provider サーフェスを通じて text-to-speech を登録します。

    - 音声: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - デフォルト音声: `eve`
    - 形式: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: provider ネイティブの速度上書き
    - ネイティブ Opus 音声メモ形式はサポートされていません

    xAI をデフォルト TTS provider として使用するには:

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
    バンドル済み `xai` Plugin は、OpenClaw の media-understanding 文字起こしサーフェスを通じてバッチ speech-to-text を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャンネルのセグメントやチャンネルの音声添付を含め、
      受信音声の文字起こしが `tools.media.audio` を読むすべての箇所で使用されます

    受信音声の文字起こしに xAI を強制するには:

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

    言語は共有音声メディア設定、または呼び出しごとの
    文字起こしリクエストから指定できます。プロンプトヒントは共有 OpenClaw
    サーフェスで受け付けられますが、xAI REST STT 統合では、現在の公開 xAI
    エンドポイントに明確に対応する file、model、language のみを転送します。

  </Accordion>

  <Accordion title="ストリーミング音声テキスト変換">
    バンドルされた `xai` Plugin は、ライブ音声通話の音声向けに
    リアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポイント検出: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 mu-law 音声フレームを送信するため、
    xAI プロバイダーはトランスコードせずにそれらのフレームを直接転送します:

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
    `plugins.entries.voice-call.config.streaming.providers.xai` の下にあります。サポートされる
    キーは `apiKey`、`baseUrl`、`sampleRate`、`encoding` (`pcm`、`mulaw`、または
    `alaw`)、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミングプロバイダーは Voice Call のリアルタイム文字起こしパス用です。
    Discord 音声は短いセグメントを録音し、代わりにバッチの
    `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    バンドルされた xAI Plugin は、Grok 経由で X（旧 Twitter）コンテンツを検索するための
    OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー              | 型      | デフォルト                    | 説明                                  |
    | ----------------- | ------- | ------------------------------ | ------------------------------------- |
    | `enabled`         | boolean | `true` (キーが利用可能な場合) | x_search を有効または無効にする       |
    | `model`           | string  | `grok-4-1-fast-non-reasoning` | x_search リクエストに使用するモデル   |
    | `baseUrl`         | string  | -                              | xAI Responses ベース URL の上書き     |
    | `inlineCitations` | boolean | -                              | 結果にインライン引用を含める          |
    | `maxTurns`        | number  | -                              | 最大会話ターン数                      |
    | `timeoutSeconds`  | number  | `30`                           | リクエストタイムアウト秒数            |
    | `cacheTtlMinutes` | number  | `15`                           | キャッシュの有効期間（分）            |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast-non-reasoning",
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
    バンドルされた xAI Plugin は、xAI のサンドボックス環境でリモートコード実行を行うための
    OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー             | 型      | デフォルト                 | 説明                                      |
    | ---------------- | ------- | -------------------------- | ---------------------------------------- |
    | `enabled`        | boolean | `true` (キーが利用可能な場合) | コード実行を有効または無効にする       |
    | `model`          | string  | `grok-4-1-fast`           | コード実行リクエストに使用するモデル     |
    | `maxTurns`       | number  | -                           | 最大会話ターン数                         |
    | `timeoutSeconds` | number  | `30`                        | リクエストタイムアウト秒数               |

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
    - xAI 認証では、API キー、環境変数、Plugin 設定のフォールバック、または対象の xAI アカウントによる OAuth を使用できます。OAuth は localhost コールバックなしでデバイスコード検証を使用します。どのアカウントが OAuth API トークンを受け取れるかは xAI が決定し、OpenClaw は Grok Build アプリを必要としないにもかかわらず、同意ページに Grok Build が表示される場合があります。
    - OpenClaw は現在、xAI マルチエージェントモデルファミリーを公開していません。xAI
      はこれらのモデルを Responses API 経由で提供していますが、OpenClaw の共有エージェントループで使用される
      クライアント側ツールやカスタムツールを受け付けません。
      [xAI マルチエージェントの制限](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)
      を参照してください。
    - xAI Realtime 音声は、まだ OpenClaw プロバイダーとして登録されていません。バッチ STT
      やストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像の `quality`、画像 `mask`、追加のネイティブ専用アスペクト比は、共有
      `image_generate` ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="詳細メモ">
    - OpenClaw は共有ランナーパス上で、xAI 固有のツールスキーマとツール呼び出し互換性の修正を自動的に適用します。
    - ネイティブ xAI リクエストはデフォルトで `tool_stream: true` です。無効にするには
      `agents.defaults.models["xai/<model>"].params.tool_stream` を `false`
      に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない厳密なツールスキーマフラグと
      reasoning *effort* ペイロードキーを取り除きます。設定可能な reasoning effort を宣伝するのは
      `grok-4.3` / `grok-4.3-*` のみです。それ以外の reasoning 対応 xAI モデルはすべて、
      以前の暗号化 reasoning を後続ターンで再生できるように
      `include: ["reasoning.encrypted_content"]` を引き続きリクエストします。
    - `web_search`、`x_search`、`code_execution` は OpenClaw ツールとして公開されます。OpenClaw
      は、すべてのネイティブツールをすべてのチャットターンに添付するのではなく、各ツールが必要とする特定の xAI 組み込み機能だけをそのツールのリクエストに添付します。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。
      `x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後
      Grok web-search ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、バンドルされた xAI Plugin によって所有されます。
    - `code_execution` はリモートの xAI サンドボックス実行であり、ローカルの
      [`exec`](/ja-JP/tools/exec) ではありません。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスはユニットテストとオプトインのライブスイートでカバーされています。ライブプローブを実行する前に、
プロセス環境で `XAI_API_KEY` をエクスポートしてください。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS、テレフォニー向け PCM
TTS を合成し、xAI バッチ STT で音声を文字起こしし、同じ PCM を xAI
リアルタイム STT にストリーミングし、テキストから画像への出力を生成し、参照画像を編集します。
共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、メディア添付パスを通じて、同じ xAI プロバイダーを検証します。

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
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

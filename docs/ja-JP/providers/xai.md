---
read_when:
    - OpenClawでGrokモデルを使用したい
    - xAI 認証またはモデル ID を設定している
summary: OpenClawで xAI Grok モデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-06-27T12:52:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70bffda0e91a409d5bd7c7887ab0369b6d70c23c4b6194fc706c78a0d2dd6ddb
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル向けのバンドル済み `xai` provider plugin が同梱されています。ほとんどの
ユーザーには、対象の SuperGrok または X Premium
サブスクリプションで Grok OAuth を使う方法を推奨します。OpenClaw はローカルファーストのままです。Gateway、config、routing、
tools は自分のマシン上で動作し、Grok モデルリクエストは xAI
経由で認証され、xAI の API に送信されます。

OAuth には xAI API キーは不要で、Grok Build
app も不要です。OpenClaw は xAI の共有 OAuth client を使うため、同意画面に xAI が Grok Build を表示する場合があります。

## セットアップ手順を選ぶ

OpenClaw のインストール状態に合った手順を使ってください。

<Steps>
  <Step title="新規 OpenClaw インストール">
    新しいローカル
    Gateway をセットアップする場合は、daemon インストール付きでオンボーディングを実行し、model/auth ステップで xAI/Grok OAuth オプションを選びます。

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS または SSH 経由では、オンボーディング中に device-code を使います。

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-device-code
    ```

    OAuth には xAI API キーは不要です。OpenClaw は Grok
    Build app を必要としません。OpenClaw は xAI の共有 OAuth client を使うため、xAI が同意アプリを Grok Build と表示する場合があります。

  </Step>
  <Step title="既存の OpenClaw インストール">
    OpenClaw がすでに設定済みの場合は、xAI へのサインインだけを行います。Grok を接続するためだけに、完全な
    オンボーディングを再実行したり daemon を再インストールしたりしないでください。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Gateway が SSH、Docker、または
    VPS 経由で動作していて、localhost のブラウザー callback が扱いにくい場合は、代わりに device-code flow を使います。

    ```bash
    openclaw models auth login --provider xai --device-code
    ```

    サインイン後に Grok をデフォルトモデルにするには、別途適用します。

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway、daemon、channel、workspace、またはその他のセットアップ選択を意図的に変更したい場合にのみ、完全なオンボーディングを再実行してください。

  </Step>
  <Step title="API キー手順">
    API キーセットアップは、xAI Console キーや、key-backed provider config を必要とする media surface で引き続き機能します。

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="モデルを選ぶ">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw は、バンドル済み xAI transport として xAI Responses API を使います。
`openclaw models auth login --provider xai --method oauth`、
`openclaw models auth login --provider xai --device-code`、または
`openclaw models auth login --provider xai --method api-key` の同じ
credential で、ファーストクラスの
`web_search`、`x_search`、remote `code_execution`、および xAI image/video generation も利用できます。
Speech と transcription は現在、`XAI_API_KEY` または provider config が必要です。
Grok backed の `web_search` は xAI OAuth を優先し、`XAI_API_KEY` または
plugin web-search config にフォールバックします。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存すると、
バンドル済み xAI model provider もそのキーを fallback として再利用します。
`plugins.entries.xai.config.webSearch.baseUrl` を設定すると、Grok `web_search`
と、デフォルトでは `x_search` を operator xAI Responses proxy 経由で routing します。
`code_execution` の tuning は `plugins.entries.xai.config.codeExecution` 配下にあります。
</Note>

## OAuth トラブルシューティング

- browser OAuth が `127.0.0.1:56121` に到達できない場合は、
  `openclaw models auth login --provider xai --device-code` を使います。
- サインインは成功したが Grok がデフォルトモデルではない場合は、
  `openclaw models set xai/grok-4.3` を実行します。
- 保存済みの xAI auth profiles を確認するには、次を実行します。

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- どのアカウントが OAuth API tokens を受け取れるかは xAI が決定します。アカウントが
  対象外の場合は、API キー手順を試すか、xAI 側でサブスクリプションを確認してください。

<Tip>
SSH、Docker、または VPS からサインインする場合は `xai-device-code` を使います。OpenClaw は
xAI URL と短い code を表示します。remote process が完了した token exchange を xAI に poll している間に、任意のローカルブラウザーでサインインを完了します。
</Tip>

## 組み込み catalog

OpenClaw には、現在の xAI chat models が標準で含まれており、model pickers では新しい順に並びます。

| ファミリー     | Model ids                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin は、既存 config 向けに古い Grok 3、Grok 4、Grok 4 Fast、Grok 4.1
Fast、および Grok Code slugs を引き続き forward-resolve します。公式の Grok Code Fast aliases は
`grok-build-0.1` に正規化されます。OpenClaw は、その他の廃止済み
upstream slugs を selectable catalog に表示しなくなりました。

<Tip>
汎用 chat には `grok-4.3` を使い、build/coding に重点を置いた
workloads には `grok-build-0.1` を使ってください。Grok 4.20 beta alias が明示的に必要な場合は除きます。
</Tip>

## OpenClaw の機能カバレッジ

バンドル済み plugin は、xAI の現在の public API surface を OpenClaw の共有
provider および tool contracts に対応付けます。共有 contract に合わない capabilities
（たとえば streaming TTS や realtime voice）は公開されません。下の表を参照してください。

| xAI capability             | OpenClaw surface                          | ステータス                                                          |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` model provider              | はい                                                                |
| サーバー側 web search      | `web_search` provider `grok`              | はい                                                                |
| サーバー側 X search        | `x_search` tool                           | はい                                                                |
| サーバー側 code execution  | `code_execution` tool                     | はい                                                                |
| Images                     | `image_generate`                          | はい                                                                |
| Videos                     | `video_generate`                          | はい                                                                |
| バッチ text-to-speech      | `messages.tts.provider: "xai"` / `tts`    | はい                                                                |
| Streaming TTS              | -                                         | 公開されていません。OpenClaw の TTS contract は完全な audio buffers を返します |
| バッチ speech-to-text      | `tools.media.audio` / media understanding | はい                                                                |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | はい                                                                |
| Realtime voice             | -                                         | まだ公開されていません。別の session/WebSocket contract です        |
| Files / batches            | 汎用 model API compatibility のみ         | ファーストクラスの OpenClaw tool ではありません                    |

<Note>
OpenClaw は、media generation、
speech、batch transcription には xAI の REST image/video/TTS/STT APIs を使い、live
voice-call transcription には xAI の streaming STT WebSocket を使い、model、search、
code-execution tools には Responses API を使います。Realtime voice sessions など、異なる OpenClaw contracts が必要な機能は、
隠れた plugin behavior ではなく upstream capabilities としてここに記載されています。
</Note>

### Fast-mode mappings

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true`
は、native xAI requests を次のように書き換えます。

| Source model  | Fast-mode target   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換エイリアス

レガシーエイリアスは引き続き canonical bundled ids に正規化されます。

| レガシーエイリアス        | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 機能

<AccordionGroup>
  <Accordion title="Web 検索">
    バンドル済み `grok` web-search provider は xAI OAuth を優先し、その後
    `XAI_API_KEY` または plugin web-search key にフォールバックします。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済み `xai` plugin は、共有
    `video_generate` tool 経由で video generation を登録します。

    - デフォルト video model: `xai/grok-imagine-video`
    - Modes: text-to-video、image-to-video、reference-image generation、remote
      video edit、および remote video extension
    - Aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resolutions: `480P`, `720P`
    - Duration: generation/image-to-video では 1-15 秒、
      `reference_image` roles を使う場合は 1-10 秒、extension では 2-10 秒
    - Reference-image generation: すべての指定画像で `imageRoles` を `reference_image` に設定します。xAI はそのような画像を最大 7 枚まで受け付けます
    - デフォルト operation timeout: `video_generate.timeoutMs`
      または `agents.defaults.videoGenerationModel.timeoutMs` が設定されていない限り 600 秒

    <Warning>
    ローカル video buffers は受け付けられません。
    video edit/extend inputs には remote `http(s)` URLs を使ってください。OpenClaw はローカル image buffers を xAI 向けの data URLs としてエンコードできるため、image-to-video ではローカル image buffers を受け付けます。
    </Warning>

    xAI をデフォルト video provider として使うには、次のようにします。

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
    共有 tool parameters、
    provider selection、および failover behavior については [Video Generation](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済み `xai` plugin は、共有
    `image_generate` tool 経由で image generation を登録します。

    - デフォルト image model: `xai/grok-imagine-image`
    - 追加 model: `xai/grok-imagine-image-quality`
    - Modes: text-to-image および reference-image edit
    - Reference inputs: 1 つの `image` または最大 5 つの `images`
    - Aspect ratios: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolutions: `1K`, `2K`
    - Count: 最大 4 images
    - デフォルト operation timeout: `image_generate.timeoutMs`
      または `agents.defaults.imageGenerationModel.timeoutMs` が設定されていない限り 600 秒

    OpenClaw は xAI に `b64_json` image responses を要求するため、generated media を
    通常の channel attachment path 経由で保存および配信できます。ローカル
    reference images は data URLs に変換され、remote `http(s)` references は
    そのまま渡されます。

    xAI をデフォルト image provider として使うには、次のようにします。

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、`20:9` などの追加のネイティブ比率も文書化しています。OpenClaw は現在、共有のクロスプロバイダー画像コントロールのみを転送します。サポートされていないネイティブ専用のノブは、意図的に `image_generate` では公開していません。
    </Note>

  </Accordion>

  <Accordion title="テキスト読み上げ">
    バンドルされた `xai` plugin は、共有 `tts` プロバイダーサーフェスを通じてテキスト読み上げを登録します。

    - 音声: `eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - デフォルト音声: `eve`
    - 形式: `mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: プロバイダーネイティブの速度オーバーライド
    - ネイティブの Opus ボイスメモ形式はサポートされていません

    xAI をデフォルトの TTS プロバイダーとして使用するには:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使用します。xAI は WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の音声プロバイダー契約では現在、返信配信前に完全な音声バッファを期待しています。
    </Note>

  </Accordion>

  <Accordion title="音声認識">
    バンドルされた `xai` plugin は、OpenClaw のメディア理解文字起こしサーフェスを通じてバッチ音声認識を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord ボイスチャンネルセグメントやチャンネル音声添付を含め、受信音声の文字起こしが `tools.media.audio` を使用するすべての場所で OpenClaw によりサポートされます

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

    言語は、共有音声メディア設定または呼び出しごとの文字起こしリクエストを通じて指定できます。プロンプトヒントは共有 OpenClaw サーフェスで受け付けますが、xAI REST STT 統合はファイル、モデル、言語のみを転送します。これらは現在の公開 xAI エンドポイントにきれいに対応するためです。

  </Accordion>

  <Accordion title="ストリーミング音声認識">
    バンドルされた `xai` plugin は、ライブ音声通話音声用のリアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポインティング: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、xAI プロバイダーはトランスコードなしでそれらのフレームを直接転送できます。

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

    プロバイダー所有の設定は `plugins.entries.voice-call.config.streaming.providers.xai` の下にあります。サポートされるキーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または `alaw`）、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミングプロバイダーは、Voice Call のリアルタイム文字起こしパス用です。Discord ボイスは現在、短いセグメントを録音し、代わりにバッチ `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search 設定">
    バンドルされた xAI plugin は、Grok 経由で X（旧 Twitter）コンテンツを検索するための OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型      | デフォルト         | 説明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search を有効化または無効化する    |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使用するモデル  |
    | `baseUrl`          | string  | -                  | xAI Responses ベース URL オーバーライド |
    | `inlineCitations`  | boolean | -                  | 結果にインライン引用を含める         |
    | `maxTurns`         | number  | -                  | 最大会話ターン数                     |
    | `timeoutSeconds`   | number  | -                  | リクエストタイムアウト秒数           |
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
    バンドルされた xAI plugin は、xAI のサンドボックス環境でリモートコード実行を行う OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型      | デフォルト         | 説明                                   |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true`（キーが利用可能な場合） | コード実行を有効化または無効化する |
    | `model`           | string  | `grok-4-1-fast`    | コード実行リクエストに使用するモデル   |
    | `maxTurns`        | number  | -                  | 最大会話ターン数                       |
    | `timeoutSeconds`  | number  | -                  | リクエストタイムアウト秒数             |

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
    - xAI 認証では、API キー、環境変数、plugin 設定フォールバック、ブラウザー OAuth、または対象の xAI アカウントによるデバイスコード OAuth を使用できます。ブラウザー OAuth は `127.0.0.1:56121` のローカルコールバックを使用します。リモートホストでは、サインイン URL を開く前にそのポートを転送したい場合を除き、`xai-device-code` を使用してください。OAuth API トークンを受け取れるアカウントは xAI が決定します。また、OpenClaw は Grok Build アプリを必要としないにもかかわらず、同意ページに Grok Build が表示される場合があります。
    - OpenClaw は現在、xAI マルチエージェントモデルファミリーを公開していません。xAI はこれらのモデルを Responses API 経由で提供していますが、OpenClaw の共有エージェントループで使用されるクライアント側ツールやカスタムツールを受け付けません。[xAI マルチエージェントの制限](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)を参照してください。
    - xAI Realtime voice はまだ OpenClaw プロバイダーとして登録されていません。バッチ STT やストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像 `quality`、画像 `mask`、および追加のネイティブ専用アスペクト比は、共有 `image_generate` ツールに対応するクロスプロバイダーコントロールが追加されるまで公開されません。

  </Accordion>

  <Accordion title="高度なメモ">
    - OpenClaw は共有ランナーパス上で、xAI 固有のツールスキーマおよびツール呼び出し互換性修正を自動的に適用します。
    - ネイティブ xAI リクエストはデフォルトで `tool_stream: true` になります。無効にするには `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない厳密なツールスキーマフラグと reasoning *effort* ペイロードキーを取り除きます。設定可能な reasoning effort を通知するのは `grok-4.3` / `grok-4.3-*` のみです。他の reasoning 対応 xAI モデルはすべて、後続ターンで以前の暗号化済み reasoning を再生できるように、引き続き `include: ["reasoning.encrypted_content"]` をリクエストします。
    - `web_search`、`x_search`、`code_execution` は OpenClaw ツールとして公開されます。OpenClaw は、すべてのネイティブツールを毎回のチャットターンに添付するのではなく、各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効にします。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。`x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後 Grok web-search ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、バンドルされた xAI plugin が所有します。
    - `code_execution` はリモート xAI サンドボックス実行であり、ローカルの [`exec`](/ja-JP/tools/exec) ではありません。

  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスは、単体テストとオプトインのライブスイートでカバーされています。ライブプローブを実行する前に、プロセス環境で `XAI_API_KEY` をエクスポートしてください。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS、電話向け PCM TTS を合成し、xAI バッチ STT を通じて音声を文字起こしし、同じ PCM を xAI リアルタイム STT にストリーミングし、テキストから画像への出力を生成し、参照画像を編集します。共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、メディア添付パスを通じて同じ xAI プロバイダーを検証します。

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

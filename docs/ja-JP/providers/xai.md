---
read_when:
    - OpenClaw で Grok モデルを使いたい
    - xAI の認証またはモデル ID を設定している
summary: OpenClaw で xAI Grok モデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-06-27T17:10:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル向けのバンドル済み `xai` プロバイダー Plugin が同梱されています。ほとんどの
ユーザーには、対象の SuperGrok または X Premium サブスクリプションで Grok OAuth を使う方法を推奨します。
OpenClaw はローカルファーストを維持します。Gateway、設定、ルーティング、
ツールは自分のマシン上で動作し、Grok モデルリクエストは xAI 経由で認証され、
xAI の API に送信されます。

OAuth には xAI API キーは不要で、Grok Build
アプリも不要です。OpenClaw は xAI の共有 OAuth クライアントを使用するため、
xAI が同意画面で Grok Build を表示する場合があります。

## セットアップパスを選択する

OpenClaw のインストール状態に合うパスを使用します。

<Steps>
  <Step title="新規 OpenClaw インストール">
    新しいローカル Gateway をセットアップする場合は、デーモンインストール付きでオンボーディングを実行し、
    モデル/認証ステップで xAI/Grok OAuth オプションを選択します。

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 上または SSH 経由では、xAI OAuth を直接選択します。OpenClaw はデバイスコード
    検証を使用し、localhost コールバックを必要としません。

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth には xAI API キーは不要です。OpenClaw は Grok
    Build アプリを必要としません。OpenClaw は xAI の共有 OAuth クライアントを使用するため、
    xAI が同意アプリを Grok Build と表示する場合があります。

  </Step>
  <Step title="既存の OpenClaw インストール">
    OpenClaw がすでに設定済みの場合は、xAI へのサインインだけを行います。Grok を接続するだけのために、完全な
    オンボーディングを再実行したり、デーモンを再インストールしたりしないでください。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    サインイン後に Grok をデフォルトモデルにするには、別途適用します。

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway、デーモン、チャンネル、ワークスペース、その他のセットアップ選択を意図的に変更したい場合にのみ、
    完全なオンボーディングを再実行してください。

  </Step>
  <Step title="API キーパス">
    API キーによるセットアップは、xAI Console キー、および
    キーに基づくプロバイダー設定が必要なメディアサーフェスで引き続き機能します。

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
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
OpenClaw は、バンドル済み xAI トランスポートとして xAI Responses API を使用します。
`openclaw models auth login --provider xai --method oauth` または
`openclaw models auth login --provider xai --method api-key` の同じ認証情報で、ファーストクラスの
`web_search`、`x_search`、リモート `code_execution`、xAI 画像/動画生成も利用できます。
音声合成と文字起こしには、現在 `XAI_API_KEY` またはプロバイダー設定が必要です。
Grok ベースの `web_search` は xAI OAuth を優先し、`XAI_API_KEY` または
Plugin の Web 検索設定にフォールバックします。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存している場合、
バンドル済み xAI モデルプロバイダーもそのキーをフォールバックとして再利用します。
`plugins.entries.xai.config.webSearch.baseUrl` を設定すると、Grok `web_search`
と、デフォルトでは `x_search` をオペレーターの xAI Responses プロキシ経由にルーティングできます。
`code_execution` の調整は `plugins.entries.xai.config.codeExecution` 配下にあります。
</Note>

## OAuth のトラブルシューティング

- SSH、Docker、VPS、またはその他のリモートセットアップでは、
  `openclaw models auth login --provider xai --method oauth` を使用します。xAI OAuth は
  localhost コールバックの代わりにデバイスコード検証を使用します。
- サインインは成功したが Grok がデフォルトモデルではない場合は、
  `openclaw models set xai/grok-4.3` を実行します。
- 保存済みの xAI 認証プロファイルを確認するには、次を実行します。

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- OAuth API トークンを受け取れるアカウントは xAI が決定します。アカウントが
  対象外の場合は、API キーパスを試すか、xAI 側でサブスクリプションを確認してください。

<Tip>
SSH、Docker、または VPS からサインインする場合は `xai-oauth` を使用します。OpenClaw は
xAI URL と短いコードを表示します。リモート
プロセスが完了したトークン交換を xAI にポーリングしている間に、任意のローカルブラウザーでサインインを完了します。
</Tip>

## 組み込みカタログ

OpenClaw には現在の xAI チャットモデルが標準で含まれており、モデルピッカーでは新しいものから順に
表示されます。

| ファミリー     | モデル ID                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin は既存設定向けに、古い Grok 3、Grok 4、Grok 4 Fast、Grok 4.1
Fast、Grok Code のスラッグを引き続き前方解決します。公式 Grok Code Fast エイリアスは
`grok-build-0.1` に正規化されます。OpenClaw は、その他の廃止済み
アップストリームスラッグを選択可能カタログに表示しなくなりました。

<Tip>
Grok 4.20 ベータエイリアスが明示的に必要でない限り、一般的なチャットには `grok-4.3` を、ビルド/コーディング重視の
ワークロードには `grok-build-0.1` を使用します。
</Tip>

## OpenClaw の機能対応

バンドル済み Plugin は、xAI の現在の公開 API サーフェスを OpenClaw の共有
プロバイダーおよびツール契約にマッピングします。共有契約に合わない機能
（例: ストリーミング TTS やリアルタイム音声）は公開されません。下の表を参照してください。

| xAI の機能                  | OpenClaw サーフェス                     | 状態                                                                  |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| チャット / Responses        | `xai/<model>` モデルプロバイダー          | はい                                                                 |
| サーバー側 Web 検索         | `web_search` プロバイダー `grok`          | はい                                                                 |
| サーバー側 X 検索           | `x_search` ツール                         | はい                                                                 |
| サーバー側コード実行        | `code_execution` ツール                   | はい                                                                 |
| 画像                       | `image_generate`                          | はい                                                                 |
| 動画                       | `video_generate`                          | はい                                                                 |
| バッチテキスト読み上げ      | `messages.tts.provider: "xai"` / `tts`    | はい                                                                 |
| ストリーミング TTS          | -                                         | 公開なし。OpenClaw の TTS 契約は完全な音声バッファを返します |
| バッチ音声認識             | `tools.media.audio` / メディア理解        | はい                                                                 |
| ストリーミング音声認識      | Voice Call `streaming.provider: "xai"`    | はい                                                                 |
| リアルタイム音声            | -                                         | まだ公開なし。異なるセッション/WebSocket 契約                       |
| ファイル / バッチ           | 汎用モデル API 互換のみ                   | ファーストクラスの OpenClaw ツールではありません                    |

<Note>
OpenClaw は、メディア生成、音声、バッチ文字起こしに xAI の REST 画像/動画/TTS/STT API を使用し、
ライブ音声通話の文字起こしには xAI のストリーミング STT WebSocket を使用し、モデル、検索、
コード実行ツールには Responses API を使用します。Realtime 音声セッションなど、
異なる OpenClaw 契約が必要な機能は、隠れた Plugin 動作ではなく、アップストリームの機能としてここに記載されています。
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

レガシーエイリアスは引き続き正規のバンドル済み ID に正規化されます。

| レガシーエイリアス          | 正規 ID                               |
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
    バンドル済みの `grok` Web 検索プロバイダーは xAI OAuth を優先し、その後
    `XAI_API_KEY` または Plugin の Web 検索キーにフォールバックします。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドル済み `xai` Plugin は、共有
    `video_generate` ツールを通じて動画生成を登録します。

    - デフォルト動画モデル: `xai/grok-imagine-video`
    - モード: テキストから動画、画像から動画、参照画像生成、リモート
      動画編集、リモート動画延長
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 解像度: `480P`, `720P`
    - 長さ: 生成/画像から動画では 1〜15 秒、
      `reference_image` ロールを使用する場合は 1〜10 秒、延長では 2〜10 秒
    - 参照画像生成: 提供するすべての画像で `imageRoles` を `reference_image` に設定します。xAI はそのような画像を最大 7 枚まで受け付けます
    - デフォルト操作タイムアウト: `video_generate.timeoutMs`
      または `agents.defaults.videoGenerationModel.timeoutMs` が設定されていない限り 600 秒

    <Warning>
    ローカル動画バッファは受け付けられません。
    動画編集/延長の入力にはリモート `http(s)` URL を使用してください。OpenClaw はそれらを xAI 向けのデータ URL としてエンコードできるため、
    画像から動画ではローカル画像バッファを受け付けます。
    </Warning>

    xAI をデフォルト動画プロバイダーとして使用するには、次のようにします。

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
    共有ツールパラメーター、プロバイダー選択、フェイルオーバー動作については
    [動画生成](/ja-JP/tools/video-generation) を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドル済み `xai` Plugin は、共有
    `image_generate` ツールを通じて画像生成を登録します。

    - デフォルト画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-quality`
    - モード: テキストから画像、参照画像編集
    - 参照入力: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 枚数: 最大 4 枚
    - デフォルト操作タイムアウト: `image_generate.timeoutMs`
      または `agents.defaults.imageGenerationModel.timeoutMs` が設定されていない限り 600 秒

    OpenClaw は xAI に `b64_json` 画像レスポンスを要求するため、生成されたメディアを
    通常のチャンネル添付パスを通じて保存および配信できます。ローカル
    参照画像はデータ URL に変換され、リモート `http(s)` 参照はそのまま渡されます。

    xAI をデフォルト画像プロバイダーとして使用するには、次のようにします。

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
    xAI は `quality`、`mask`、`user`、および `1:2`、`2:1`、`9:20`、
    `20:9` などの追加のネイティブ比率も文書化しています。OpenClaw は現在、
    共有のクロスプロバイダー画像制御のみを転送します。サポートされない
    ネイティブ専用のノブは、意図的に `image_generate` 経由では公開していません。
    </Note>

  </Accordion>

  <Accordion title="Text-to-speech">
    バンドルされた `xai` Plugin は、共有 `tts` プロバイダーサーフェスを通じて
    テキスト読み上げを登録します。

    - 音声: `eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - デフォルト音声: `eve`
    - 形式: `mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 言語: BCP-47 コードまたは `auto`
    - 速度: プロバイダーネイティブの速度上書き
    - ネイティブ Opus ボイスメモ形式はサポートされていません

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
    OpenClaw は xAI のバッチ `/v1/tts` エンドポイントを使用します。xAI は
    WebSocket 経由のストリーミング TTS も提供していますが、OpenClaw の音声
    プロバイダー契約では現在、返信配信の前に完全な音声バッファを想定しています。
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    バンドルされた `xai` Plugin は、OpenClaw のメディア理解文字起こし
    サーフェスを通じてバッチ音声テキスト変換を登録します。

    - デフォルトモデル: `grok-stt`
    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: multipart 音声ファイルアップロード
    - Discord 音声チャンネルセグメントやチャンネル音声添付を含め、
      受信音声文字起こしが `tools.media.audio` を使用する場所では
      OpenClaw によってサポートされます

    受信音声文字起こしに xAI を強制するには:

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

    言語は、共有音声メディア設定または呼び出しごとの文字起こしリクエストで
    指定できます。プロンプトヒントは共有 OpenClaw サーフェスで受け付けられますが、
    xAI REST STT 統合は、現在の公開 xAI エンドポイントにきれいに対応する
    ファイル、モデル、言語のみを転送します。

  </Accordion>

  <Accordion title="Streaming speech-to-text">
    バンドルされた `xai` Plugin は、ライブ音声通話音声用のリアルタイム
    文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトエンドポインティング: `800ms`
    - 暫定文字起こし: デフォルトで有効

    Voice Call の Twilio メディアストリームは G.711 µ-law 音声フレームを送信するため、
    xAI プロバイダーはトランスコードせずにそれらのフレームを直接転送できます。

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
    `plugins.entries.voice-call.config.streaming.providers.xai` の下にあります。
    サポートされるキーは `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、
    `mulaw`、または `alaw`）、`interimResults`、`endpointingMs`、`language` です。

    <Note>
    このストリーミングプロバイダーは、Voice Call のリアルタイム文字起こしパス用です。
    Discord 音声は現在、短いセグメントを録音し、代わりにバッチ
    `tools.media.audio` 文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    バンドルされた xAI Plugin は、Grok 経由で X（旧 Twitter）コンテンツを検索する
    OpenClaw ツールとして `x_search` を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型      | デフォルト         | 説明                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search を有効または無効にします   |
    | `model`            | string  | `grok-4-1-fast`    | x_search リクエストに使用するモデル |
    | `baseUrl`          | string  | -                  | xAI Responses ベース URL の上書き    |
    | `inlineCitations`  | boolean | -                  | 結果にインライン引用を含めます       |
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

  <Accordion title="Code execution configuration">
    バンドルされた xAI Plugin は、xAI のサンドボックス環境でリモートコード実行を行う
    OpenClaw ツールとして `code_execution` を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型      | デフォルト              | 説明                                      |
    | ----------------- | ------- | ----------------------- | ----------------------------------------- |
    | `enabled`         | boolean | `true`（キーが利用可能な場合） | コード実行を有効または無効にします |
    | `model`           | string  | `grok-4-1-fast`         | コード実行リクエストに使用するモデル      |
    | `maxTurns`        | number  | -                       | 最大会話ターン数                          |
    | `timeoutSeconds`  | number  | -                       | リクエストタイムアウト秒数                |

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

  <Accordion title="Known limits">
    - xAI 認証では、API キー、環境変数、Plugin 設定フォールバック、または対象となる
      xAI アカウントでの OAuth を使用できます。OAuth は localhost コールバックなしの
      デバイスコード検証を使用します。どのアカウントが OAuth API トークンを受け取れるかは
      xAI が決定し、同意ページには OpenClaw が Grok Build アプリを必要としない場合でも
      Grok Build が表示されることがあります。
    - OpenClaw は現在、xAI マルチエージェントモデルファミリーを公開していません。xAI は
      Responses API を通じてこれらのモデルを提供しますが、OpenClaw の共有エージェントループで
      使用されるクライアント側ツールやカスタムツールを受け付けません。
      [xAI マルチエージェントの制限](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)を参照してください。
    - xAI Realtime 音声は、まだ OpenClaw プロバイダーとして登録されていません。バッチ STT や
      ストリーミング文字起こしとは異なる双方向音声セッション契約が必要です。
    - xAI 画像 `quality`、画像 `mask`、追加のネイティブ専用アスペクト比は、共有
      `image_generate` ツールに対応するクロスプロバイダー制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw は、共有ランナーパスで xAI 固有のツールスキーマおよびツール呼び出し互換性修正を
      自動的に適用します。
    - ネイティブ xAI リクエストのデフォルトは `tool_stream: true` です。無効にするには
      `agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされない
      strict ツールスキーマフラグと推論 *effort* ペイロードキーを取り除きます。
      `grok-4.3` / `grok-4.3-*` のみが設定可能な推論 effort を広告します。他のすべての
      推論対応 xAI モデルは、後続ターンで以前の暗号化済み推論を再生できるように、
      引き続き `include: ["reasoning.encrypted_content"]` をリクエストします。
    - `web_search`、`x_search`、`code_execution` は OpenClaw ツールとして公開されます。
      OpenClaw はすべてのネイティブツールをすべてのチャットターンに添付するのではなく、
      各ツールリクエスト内で必要な特定の xAI 組み込み機能を有効にします。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。
      `x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後
      Grok web-search ベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、
      バンドルされた xAI Plugin が所有します。
    - `code_execution` はリモート xAI サンドボックス実行であり、ローカルの
      [`exec`](/ja-JP/tools/exec) ではありません。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスは単体テストとオプトインのライブスイートでカバーされています。ライブプローブを
実行する前に、プロセス環境で `XAI_API_KEY` をエクスポートしてください。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS、電話向け PCM TTS の合成、xAI バッチ STT による
音声文字起こし、同じ PCM の xAI リアルタイム STT へのストリーミング、テキストから画像への出力生成、
および参照画像の編集を行います。共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、
正規化、メディア添付パスを通じて同じ xAI プロバイダーを検証します。

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作を選択します。
  </Card>
  <Card title="Video generation" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダー選択。
  </Card>
  <Card title="All providers" href="/ja-JP/providers/index" icon="grid-2">
    より広範なプロバイダー概要。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正。
  </Card>
</CardGroup>

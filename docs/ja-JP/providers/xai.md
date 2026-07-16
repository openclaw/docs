---
read_when:
    - OpenClaw で Grok モデルを使用する場合
    - xAI の認証またはモデル ID を設定している場合
summary: OpenClaw で xAI Grok モデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-07-16T12:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル向けの `xai` プロバイダー Plugin がバンドルされています。推奨される方法は、対象となる SuperGrok または X Premium サブスクリプションで Grok OAuth を使用することです。Gateway、設定、ルーティング、ツールはローカルに維持され、Grok リクエストのみが xAI の API に送信されます。

OAuth には xAI API キーも Grok Build アプリも必要ありません。OpenClaw は xAI の共有 OAuth クライアントを使用するため、同意画面には引き続き Grok Build が表示される場合があります。

## セットアップ

<Steps>
  <Step title="新規インストール">
    デーモンのインストールを含むオンボーディングを実行し、モデル／認証の手順で xAI/Grok OAuth を選択します。

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 上または SSH 経由では、xAI OAuth を直接選択します。デバイスコード検証を使用するため、localhost コールバックは必要ありません。

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="既存のインストール">
    xAI へのサインインのみを行います。Grok に接続するためだけに、オンボーディング全体を再実行しないでください。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok をデフォルトモデルとして別途適用します。

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway、デーモン、チャンネル、ワークスペース、またはその他のセットアップ項目を意図的に変更する場合にのみ、オンボーディング全体を再実行してください。

  </Step>
  <Step title="API キーを使用する方法">
    xAI Console のキー、およびキーベースのプロバイダー設定を必要とするメディア機能では、引き続き API キーによるセットアップを利用できます。

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
OpenClaw は、バンドルされた xAI トランスポートとして xAI Responses API を使用します。`openclaw models auth login --provider xai --method oauth` または `--method api-key` の同じ認証情報により、`web_search`（プロバイダー ID `grok`）、`x_search`、`code_execution`、音声／文字起こし、および xAI の画像／動画生成も利用できます。xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存した場合、バンドルされた xAI モデルプロバイダーもそれをフォールバックとして再利用します。
</Note>

## OAuth のトラブルシューティング

- SSH、Docker、VPS、またはその他のリモートセットアップでは、`openclaw models auth login --provider xai --method oauth` を使用してください。localhost コールバックではなく、デバイスコード検証を使用します。
- サインインに成功しても Grok がデフォルトモデルになっていない場合は、`openclaw models set xai/grok-4.3` を実行してください。
- 保存された xAI 認証プロファイルを確認します。

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- OAuth API トークンを取得できるアカウントは xAI が決定します。アカウントが対象外の場合は、API キーを使用する方法を選ぶか、xAI 側でサブスクリプションを確認してください。

<Tip>
SSH、Docker、または VPS からサインインする場合は、`xai-oauth` を使用してください。OpenClaw が URL と短いコードを表示します。リモートプロセスが完了したトークン交換を xAI にポーリングしている間に、任意のローカルブラウザーでサインインを完了してください。
</Tip>

## 組み込みカタログ

モデル選択画面で選択可能な ID です。既存の設定に対応するため、Plugin は引き続き古い Grok 3、Grok 4、Grok 4 Fast、Grok 4.1 Fast、および Grok Code の ID を解決します。[レガシー互換性と変動エイリアス](#legacy-compatibility-and-moving-aliases)を参照してください。

| ファミリー         | モデル ID                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（エイリアス: `grok-4.5-latest`、`grok-build-latest`） |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（エイリアス: `grok-4.3-latest`、`grok-latest`）       |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
利用可能な場合、一般的なチャット、コーディング、およびエージェント型の作業には `grok-4.5` を使用してください。Grok 4.3 は引き続き地域面で安全なセットアップのデフォルトです。`grok-build-0.1` と、日付付きの Grok 4.20 の両バリアントも引き続き選択できます。
</Tip>

## 機能対応状況

バンドルされた Plugin は、対応する xAI API を OpenClaw の共有プロバイダーおよびツールコントラクトにマッピングします。共有コントラクトに適合しない機能については、以下または既知の制限に記載しています。

| xAI の機能             | OpenClaw の機能面                        | 対応状況                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| チャット／Responses           | `xai/<model>` モデルプロバイダー            | 対応                                                  |
| サーバー側 Web 検索     | `web_search` プロバイダー `grok`            | 対応                                                  |
| サーバー側 X 検索       | `x_search` ツール                         | 対応                                                  |
| サーバー側コード実行 | `code_execution` ツール                   | 対応                                                  |
| 画像                     | `image_generate`                        | 対応                                                  |
| 動画                     | `video_generate`                        | 対応                                                  |
| バッチテキスト読み上げ       | `messages.tts.provider: "xai"` / `tts`  | 対応                                                  |
| ストリーミング TTS              | `textToSpeechStream`                    | `wss://api.x.ai/v1/tts` 経由で対応（リアルタイム音声ではありません） |
| バッチ音声テキスト変換       | `tools.media.audio` メディア理解 | 対応                                                  |
| ストリーミング音声テキスト変換   | 音声通話 `streaming.provider: "xai"`  | 対応                                                  |
| リアルタイム音声             | Talk `talk.realtime.provider: "xai"`    | 対応。ネイティブ Talk Node では Gateway リレーを使用             |
| ファイル／バッチ            | 汎用モデル API との互換性のみ    | OpenClaw の第一級ツールではありません                      |

<Note>
OpenClaw は、メディア生成とバッチ文字起こしには xAI の REST 画像／動画／TTS／STT API、ライブ音声通話の文字起こしには xAI のストリーミング STT WebSocket、Talk のリアルタイムセッションには xAI の Grok Voice Agent WebSocket、チャット、検索、およびコード実行ツールには Responses API を使用します。
</Note>

### レガシー高速モードの互換性

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true` は、引き続き古い xAI 設定を次のように書き換えます。これらの移行先 ID は互換性のためにのみ維持されています。新しい設定では、現在選択可能なモデルを使用してください。

| 移行元モデル  | 高速モードの移行先   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換性と変動エイリアス

古いエイリアスは次のように正規化されます。

| レガシーエイリアス                                                  | 正規化後の ID    |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`、`grok-code-fast`、`grok-code-fast-1-0825` | `grok-build-0.1` |

日付付きの 0309 ID が、選択可能なカタログエントリです。OpenClaw は、それ以外の現在の Grok 4.20 エイリアスをすべてそのまま送信するため、stable、latest、beta、experimental、および日付付きエイリアスのセマンティクスは引き続き xAI が管理します。グローバルな `grok-latest` エイリアスもそのまま維持されます。

xAI は、以下の正確な ID を廃止しました。OpenClaw は、リリース済みの設定との互換性を維持する非表示行としてこれらを保持し、現在のリダイレクト先の制限と料金を適用します。

| 廃止された ID                                                          | 現在の動作                 |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`、`grok-4-fast-reasoning`、`grok-4-0709`    | `low` 推論を使用する Grok 4.3    |
| `grok-4-1-fast-non-reasoning`、`grok-4-fast-non-reasoning`、`grok-3` | 推論を無効にした Grok 4.3 |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

`openclaw doctor --fix` は、永続化された xAI サーバーツールのデフォルト値と廃止された高品質画像のスラッグを更新し、古い生成済みカタログ行を削除し、アクティブな 4.20 行の古いコンテキストメタデータを修復します。アクティブな 4.20 の `beta-latest` エイリアスを、日付付きスナップショットに固定することはありません。

## 機能

<Warning>
  `x_search` と `code_execution` は xAI のサーバー上で実行されます。xAI はツール呼び出し 1,000 回あたり $5 に加え、モデルの入力トークンと出力トークンに対して課金します。各ツールの `enabled` 設定を省略した場合、OpenClaw はアクティブな xAI モデルに対してのみそのツールを公開します。既知の非 xAI モデルプロバイダーでは、ツールごとに明示的な `enabled: true` が必要です。プロバイダーが指定されていないか解決できない場合は、フェイルクローズします。xAI 認証は常に必要であり、`enabled: false` はすべてのプロバイダーでツールを無効にします。
</Warning>

<AccordionGroup>
  <Accordion title="Web 検索">
    バンドルされた `grok` Web 検索プロバイダーは xAI OAuth を優先し、次に `XAI_API_KEY` または Plugin の Web 検索キーへフォールバックします。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドルされた `xai` Plugin は、共有の `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトモデル: `xai/grok-imagine-video`
    - 追加モデル: `xai/grok-imagine-video-1.5`
    - クラシックモード: テキストから動画、画像から動画、参照画像による生成、リモート動画の編集、およびリモート動画の延長
    - Video 1.5 モード: 画像から動画のみ。最初のフレームとして使用する画像は正確に 1 枚
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`。省略した場合、クラシックおよび Video 1.5 の画像から動画では、元画像の比率を継承
    - 解像度: クラシックは `480P`/`720P`。Video 1.5 は `1080P` にも対応。すべての生成モードのデフォルトは `480P`
    - 長さ: 生成／画像から動画では 1～15 秒、クラシックの `reference_image` ロールを使用する場合は 1～10 秒、クラシックの延長では 2～10 秒
    - 参照画像による生成: 指定するすべての画像で `imageRoles` を `reference_image` に設定。xAI はそのような画像を最大 7 枚受け付ける
    - 動画の編集／延長では、入力動画のアスペクト比と解像度を継承。これらの操作ではジオメトリのオーバーライドは指定不可
    - デフォルトの操作タイムアウト: `video_generate.timeoutMs` または `agents.defaults.videoGenerationModel.timeoutMs` が設定されていない限り 600 秒

    <Warning>
    ローカルの動画バッファは使用できません。動画の編集／延長の入力には、リモートの `http(s)` URL を使用してください。画像から動画ではローカル画像バッファを使用できます。OpenClaw がそれらを xAI 向けのデータ URL としてエンコードするためです。
    </Warning>

    Video 1.5 は、xAI の `grok-imagine-video-1.5-preview` および `grok-imagine-video-1.5-2026-05-30` 識別子も認識します。OpenClaw は選択した識別子を変更せずに転送しますが、同じ画像限定の検証を適用します。

    xAI をデフォルトの動画プロバイダーとして使用するには、次のように設定します。

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
    共有ツールのパラメーター、プロバイダーの選択、およびフェイルオーバーの動作については、[動画生成](/ja-JP/tools/video-generation)を参照してください。
    </Note>

  </Accordion>

  <Accordion title="画像生成">
    バンドルされた `xai` Plugin は、共有の `image_generate` ツールを通じて画像生成を登録します。

    - デフォルトの画像モデル: `xai/grok-imagine-image`
    - 追加モデル: `xai/grok-imagine-image-quality`
    - モード: テキストから画像への生成、および参照画像の編集
    - 参照入力: 1つの`image`、または最大3つの`images`
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解像度: `1K`、`2K`
    - 枚数: 最大4画像
    - デフォルトの処理タイムアウト: `image_generate.timeoutMs`
      または`agents.defaults.imageGenerationModel.timeoutMs`が設定されていない限り600秒

    OpenClawは、生成されたメディアを通常のチャンネル添付ファイル経路で
    保存および配信できるよう、xAIに`b64_json`形式の画像レスポンスを要求します。ローカルの
    参照画像はデータURLに変換され、リモートの`http(s)`参照は
    変更されずにそのまま渡されます。

    xAIをデフォルトの画像プロバイダーとして使用するには、次のように設定します。

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
    xAIでは、`quality`、`mask`、`user`、および`auto`のアスペクト比も文書化されています。
    現在、OpenClawが転送するのはプロバイダー間で共通の画像制御のみです。
    これらのネイティブ専用オプションは`image_generate`を通じて公開されていません。
    </Note>

  </Accordion>

  <Accordion title="テキスト読み上げ">
    バンドルされている`xai` Pluginは、共有`tts`
    プロバイダーサーフェスを通じてテキスト読み上げを登録します。

    - 音声: xAIから取得する認証済みライブカタログ。`openclaw infer tts voices --provider xai`で
      一覧表示できます
    - オフラインフォールバック音声: `ara`、`eve`、`leo`、`rex`、`sal`
    - デフォルト音声: `eve`
    - アカウントのカスタム音声IDは、組み込みカタログのレスポンスに
      含まれていない場合でも転送されます
    - 形式: `mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 言語: BCP-47コードまたは`auto`
    - 速度: プロバイダーネイティブの速度上書き
    - ネイティブのOpusボイスメッセージ形式はサポートされていません

    xAIをデフォルトのTTSプロバイダーとして使用するには、次のように設定します。

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
    OpenClawは、バッファリング合成にxAIのバッチ`/v1/tts`エンドポイント、
    認証済み`/v1/tts/voices`カタログの検出、およびストリーミング合成にネイティブの
    `wss://api.x.ai/v1/tts`を使用します。ストリーミングは
    ネイティブの`api.x.ai`ホストに制限されるため、この経路ではカスタム`baseUrl`値は拒否されます。
    既存の言語、音声、コーデック、速度の制御を使用し、サンプルレートとビットレートには
    xAIのデフォルトが適用されます。音声ファイルの合成では、設定されたすべての
    コーデックが尊重されます。xAIのrawコーデックにはコーデックやレートのメタデータが含まれないため、
    ボイスメッセージ宛先ではストリーミングとバッファリングされた
    フォールバックにMP3を使用します。ストリームは`text.delta`、続いて
    `text.done`を送信し、`audio.delta`、`audio.done`、または`error`を受信します。また、
    音声チャンクごとに更新されるアイドル`timeoutMs`を適用します。これは
    リアルタイム音声セッションとは別のものです。xAIの[ストリーミングTTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice)契約を参照してください。
    </Note>

  </Accordion>

  <Accordion title="音声テキスト変換">
    バンドルされている`xai` Pluginは、OpenClawの
    メディア理解文字起こしサーフェスを通じてバッチ音声テキスト変換を登録します。

    - エンドポイント: xAI REST `/v1/stt`
    - 入力経路: マルチパート音声ファイルのアップロード
    - モデル選択: xAIが文字起こしモデルを内部的に選択します。
      エンドポイントにはモデルセレクターがありません
    - 受信音声の文字起こしが`tools.media.audio`を読み取るすべての場所で使用されます。
      Discordのボイスチャンネルセグメントやチャンネルの音声添付ファイルも含まれます

    受信音声の文字起こしにxAIを強制的に使用するには、次のように設定します。

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    言語は、共有音声メディア設定または呼び出しごとの
    文字起こしリクエストを通じて指定できます。プロンプトのヒントは共有OpenClaw
    サーフェスで受け付けられますが、xAI REST STT統合が転送するのはファイルと言語のみです。
    これらだけが現在公開されているxAIエンドポイントに対応しているためです。

  </Accordion>

  <Accordion title="ストリーミング音声テキスト変換">
    バンドルされている`xai` Pluginは、ライブ音声通話の音声向けに
    リアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトのエンコーディング: `mulaw`
    - デフォルトのサンプルレート: `8000`
    - デフォルトのエンドポイント判定: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice CallのTwilioメディアストリームはG.711 mu-law音声フレームを送信するため、
    xAIプロバイダーはトランスコードせずにそれらのフレームを直接転送します。

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
    `plugins.entries.voice-call.config.streaming.providers.xai`に配置されます。サポートされる
    キーは`apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、および`language`です。

    <Note>
    このストリーミングプロバイダーは、Voice Callのリアルタイム文字起こし経路向けです。
    Discord Voiceは短いセグメントを録音し、代わりにバッチ
    `tools.media.audio`文字起こし経路を使用します。
    </Note>

  </Accordion>

  <Accordion title="リアルタイム音声（Talk）">
    バンドルされている`xai` Pluginは、共有`registerRealtimeVoiceProvider`契約を通じて
    Talkモード向けのGrok Voice Agentリアルタイムセッションを登録します。

    - エンドポイント: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - デフォルトモデル: `grok-voice-latest`
    - デフォルト音声: `eve`
    - トランスポート: `gateway-relay`（iOS、Android、およびControl UIリレー経路）
    - 音声: PCM16 24 kHzまたはG.711 µ-law 8 kHz
    - 割り込み発話: xAIサーバーのVADがレスポンスを中断します。OpenClawはキューに入っている再生を消去し、
      未再生のプロバイダー履歴を切り詰めます

    GatewayでTalkを設定します。

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // プロバイダー側のセッション再生を許容できる場合にのみ有効にしてください。
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Voice Callまたは共有リアルタイムセレクターが同じプロバイダーマップを再利用する場合、
    プロバイダー所有の設定は`plugins.entries.voice-call.config.realtime.providers.xai`からも
    解決されます。サポートされるキーは
    `apiKey`、`baseUrl`、`model`、`voice`、`vadThreshold`、`silenceDurationMs`、
    `prefixPaddingMs`、`reasoningEffort`、および`sessionResumption`です。
    `reasoningEffort`はxAI Voice Agent APIに合わせて、`high`または`none`のみを受け付けます。

    xAIのサーバーVADは常にレスポンスを作成し、音声の中断を処理します。
    `consultRouting: "provider-direct"`を使用してください。文字起こしの強制ルーティングと
    入力音声の中断の無効化は、xAI Voice Agentプロトコルではサポートされていません。

    <Note>
    xAI OAuthまたは`XAI_API_KEY`でリアルタイム音声を認証できます。ブラウザ所有の
    WebRTCは、まだこのプロバイダーサーフェスには含まれていません。ネイティブNodeではgateway-relay Talkを、
    またはControl UIのリレー経路を使用してください。
    </Note>

    <Note>
    `sessionResumption`のデフォルトは`false`です。`true`に設定すると、OpenClawは
    再接続後に同じ会話を再開できるだけのセッション状態を保持するよう
    xAIに要求し、返された会話IDを使って再接続します。プロバイダー側での
    再生や保持を許容できない場合は無効のままにしてください。その場合、中断された
    ソケットは新しい会話を暗黙に開始するのではなく、フェイルクローズします。
    </Note>

  </Accordion>

  <Accordion title="x_searchの設定">
    バンドルされているxAI Pluginは、Grok経由でX（旧Twitter）のコンテンツを
    検索するOpenClawツールとして`x_search`を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー               | 型    | デフォルト                   | 説明                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | xAIモデルでは自動  | 無効にするか、既知の非xAIプロバイダーで明示的に有効にする |
    | `model`           | string  | `grok-4.3`                | x_searchリクエストに使用するモデル                 |
    | `baseUrl`         | string  | -                         | xAI ResponsesのベースURLの上書き                  |
    | `inlineCitations` | boolean | -                         | 結果にインライン引用を含める              |
    | `maxTurns`        | number  | -                         | 会話の最大ターン数                       |
    | `timeoutSeconds`  | number  | `30`                      | リクエストのタイムアウト（秒）                       |
    | `cacheTtlMinutes` | number  | `15`                      | キャッシュの有効期間（分）                    |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    バンドルされているxAI Pluginは、xAIのサンドボックス環境で
    リモートコードを実行するOpenClawツールとして`code_execution`を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー              | 型    | デフォルト                  | 説明                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | boolean | xAIモデルでは自動 | 無効にするか、既知の非xAIプロバイダーで明示的に有効にする |
    | `model`          | string  | `grok-4.3`               | コード実行リクエストに使用するモデル           |
    | `maxTurns`       | number  | -                        | 会話の最大ターン数                       |
    | `timeoutSeconds` | number  | `30`                     | リクエストのタイムアウト（秒）                       |

    <Note>
    これはリモートのxAIサンドボックスでの実行であり、ローカルの[`exec`](/ja-JP/tools/exec)ではありません。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="既知の制限">
    - xAI 認証では、API キー、環境変数、Plugin 設定のフォールバック、または対象となる xAI アカウントでの OAuth を使用できます。OAuth は localhost コールバックを使用せず、デバイスコード検証を行います。OAuth API トークンを取得できるアカウントは xAI が決定します。また、OpenClaw は Grok Build アプリを必要としませんが、同意ページに Grok Build が表示される場合があります。
    - OpenClaw は現在、xAI のマルチエージェントモデルファミリーを公開していません。xAI はこれらのモデルを Responses API 経由で提供していますが、OpenClaw の共有エージェントループで使用されるクライアント側ツールやカスタムツールには対応していません。[xAI マルチエージェントの制限](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)を参照してください。
    - xAI Realtime 音声は現在、Gateway リレー式の Talk トランスポートのみを公開しています。ブラウザ側で管理されるプロバイダー WebSocket セッションは、まだ Control UI に接続されていません。
    - xAI の画像 `quality`、画像 `mask`、およびネイティブ専用の追加アスペクト比は、共有 `image_generate` ツールに対応するプロバイダー横断コントロールが実装されるまで公開されません。

  </Accordion>

  <Accordion title="高度な注記">
    - OpenClaw は、共有ランナーパス上で xAI 固有のツールスキーマおよびツール呼び出しの互換性修正を自動的に適用します。
    - ネイティブ xAI リクエストでは、デフォルトで `tool_stream: true` が使用されます。無効にするには、`agents.defaults.models["xai/<model>"].params.tool_stream` を `false` に設定します。
    - バンドルされた xAI ラッパーは、ネイティブ xAI リクエストを送信する前に、サポートされていない contains-count スキーマ境界と、サポートされていない推論 *effort* ペイロードキーを除去します。Grok 4.5 は low、medium、high の effort をサポートします（デフォルトは high）。Grok 4.3 は none、low、medium、high の effort をサポートします（デフォルトは low）。推論に対応するその他の xAI モデルでは設定可能な effort コントロールは公開されませんが、後続ターンで以前の暗号化された推論を再生できるよう、引き続き `include: ["reasoning.encrypted_content"]` を要求します。
    - `web_search`、`x_search`、および `code_execution` は OpenClaw ツールとして公開されます。OpenClaw はすべてのネイティブツールをすべてのチャットターンに付加するのではなく、各ツールのリクエストに、そのツールが必要とする特定の xAI 組み込み機能のみを付加します。
    - Grok `web_search` は `plugins.entries.xai.config.webSearch.baseUrl` を読み取ります。`x_search` は `plugins.entries.xai.config.xSearch.baseUrl` を読み取り、その後 Grok Web 検索のベース URL にフォールバックします。
    - `x_search` と `code_execution` は、コアモデルランタイムにハードコードされるのではなく、バンドルされた xAI Plugin によって所有されます。
    - `code_execution` はリモートの xAI サンドボックス実行であり、ローカルの [`exec`](/ja-JP/tools/exec) ではありません。

  </Accordion>
</AccordionGroup>

## ライブテスト

xAI メディアパスは、ユニットテストとオプトインのライブスイートでカバーされています。ライブプローブを実行する前に、プロセス環境で `XAI_API_KEY` をエクスポートしてください。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS と電話向け PCM TTS を合成し、xAI バッチ STT で音声を文字起こしし、同じ PCM を xAI Realtime STT でストリーミングし、テキストから画像への出力を生成し、参照画像を編集します。共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、およびメディア添付パスを通じて、同じ xAI プロバイダーを検証します。オプトインの Video 1.5 ケースは、生成された最初のフレーム画像を 1080P で 1 枚送信し、完成した動画のダウンロードを検証します。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダーの選択。
  </Card>
  <Card title="すべてのプロバイダー" href="/ja-JP/providers/index" icon="grid-2">
    プロバイダー全般の概要。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題と修正方法。
  </Card>
</CardGroup>

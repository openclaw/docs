---
read_when:
    - OpenClaw で Grok モデルを使用する場合
    - xAI の認証またはモデル ID を設定しています
summary: OpenClaw で xAI Grok モデルを使用する
title: xAI
x-i18n:
    generated_at: "2026-07-11T22:37:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw には、Grok モデル向けの `xai` プロバイダー Plugin がバンドルされています。
推奨される方法は、対象となる SuperGrok または X Premium サブスクリプションで
Grok OAuth を使用することです。Gateway、設定、ルーティング、ツールはローカルに維持され、
Grok リクエストのみが xAI の API に送信されます。

OAuth には、xAI API キーも Grok Build アプリも必要ありません。OpenClaw は xAI の共有
OAuth クライアントを使用するため、同意画面には引き続き Grok Build が表示される場合があります。

## セットアップ

<Steps>
  <Step title="新規インストール">
    デーモンのインストールを含むオンボーディングを実行し、モデル／認証の手順で
    xAI/Grok OAuth を選択します。

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 上または SSH 経由の場合は、xAI OAuth を直接選択してください。デバイスコード
    検証を使用するため、localhost コールバックは不要です。

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="既存のインストール">
    xAI のみにサインインします。Grok に接続するためだけにオンボーディング全体を
    再実行しないでください。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok をデフォルトモデルとして別途適用します。

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway、デーモン、チャンネル、ワークスペース、またはその他のセットアップ設定を
    意図的に変更する場合に限り、オンボーディング全体を再実行してください。

  </Step>
  <Step title="API キーを使用する方法">
    API キーによるセットアップは、xAI Console キー、およびキーに基づくプロバイダー設定が
    必要なメディア機能でも引き続き使用できます。

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
OpenClaw は、バンドルされた xAI トランスポートとして xAI Responses API を使用します。
`openclaw models auth login --provider xai --method oauth` または
`--method api-key` で取得した同じ認証情報は、`web_search`（プロバイダー ID `grok`）、
`x_search`、`code_execution`、音声／文字起こし、および xAI の画像／動画生成にも使用されます。
xAI キーを `plugins.entries.xai.config.webSearch.apiKey` に保存すると、バンドルされた
xAI モデルプロバイダーもフォールバックとしてそのキーを再利用します。
</Note>

## OAuth のトラブルシューティング

- SSH、Docker、VPS、またはその他のリモート環境では、
  `openclaw models auth login --provider xai --method oauth` を使用してください。
  localhost コールバックではなく、デバイスコード検証を使用します。
- サインインに成功しても Grok がデフォルトモデルになっていない場合は、
  `openclaw models set xai/grok-4.3` を実行してください。
- 保存された xAI 認証プロファイルを確認します。

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- OAuth API トークンを受け取れるアカウントは xAI が決定します。アカウントが対象外の場合は、
  API キーを使用する方法に切り替えるか、xAI 側でサブスクリプションを確認してください。

<Tip>
SSH、Docker、または VPS からサインインする場合は `xai-oauth` を使用してください。
OpenClaw が URL と短いコードを表示します。リモートプロセスが完了したトークン交換について
xAI をポーリングしている間に、任意のローカルブラウザーでサインインを完了してください。
</Tip>

## 組み込みカタログ

モデル選択画面で選択可能な ID です。既存の設定向けに、Plugin は従来の Grok 3、
Grok 4、Grok 4 Fast、Grok 4.1 Fast、および Grok Code の ID も引き続き解決します。
[レガシー互換性と変動するエイリアス](#legacy-compatibility-and-moving-aliases)を参照してください。

| ファミリー     | モデル ID                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5`（エイリアス: `grok-4.5-latest`、`grok-build-latest`） |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3`（エイリアス: `grok-4.3-latest`、`grok-latest`）       |
| Grok 4.20      | `grok-4.20-0309-reasoning`、`grok-4.20-0309-non-reasoning`   |

<Tip>
利用可能な場合、一般的なチャット、コーディング、エージェント型作業には `grok-4.5` を使用してください。
Grok 4.3 は引き続きリージョン面で安全なセットアップのデフォルトです。`grok-build-0.1` と、
日付付きの両方の Grok 4.20 バリアントも引き続き選択できます。
</Tip>

## 機能対応状況

バンドルされた Plugin は、対応する xAI API を OpenClaw の共有プロバイダーおよび
ツール契約にマッピングします。共有契約に適合しない機能は、以下または既知の制限に記載されています。

| xAI の機能                  | OpenClaw の機能                          | 状態                                                          |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| チャット／Responses         | `xai/<model>` モデルプロバイダー         | 対応                                                          |
| サーバー側 Web 検索         | `web_search` プロバイダー `grok`         | 対応                                                          |
| サーバー側 X 検索           | `x_search` ツール                        | 対応                                                          |
| サーバー側コード実行        | `code_execution` ツール                  | 対応                                                          |
| 画像                        | `image_generate`                        | 対応                                                          |
| 動画                        | `video_generate`                        | 従来の完全なワークフロー。Video 1.5 の画像から動画への変換     |
| バッチテキスト読み上げ      | `messages.tts.provider: "xai"` / `tts`  | 対応                                                          |
| ストリーミング TTS          | -                                       | xAI プロバイダーではまだ未実装                                |
| バッチ音声認識              | `tools.media.audio` メディア理解         | 対応                                                          |
| ストリーミング音声認識      | Voice Call `streaming.provider: "xai"`  | 対応                                                          |
| リアルタイム音声            | -                                       | まだ公開されていません。別のセッション／WebSocket 契約が必要です |
| ファイル／バッチ            | 汎用モデル API 互換性のみ                | OpenClaw の第一級ツールではありません                         |

<Note>
OpenClaw は、メディア生成とバッチ文字起こしには xAI の REST 画像／動画／TTS／STT API を、
ライブ音声通話の文字起こしには xAI のストリーミング STT WebSocket を、チャット、検索、
コード実行ツールには Responses API を使用します。
</Note>

### レガシー高速モードの互換性

`/fast on` または `agents.defaults.models["xai/<model>"].params.fastMode: true` は、
引き続き従来の xAI 設定を次のように書き換えます。これらの対象 ID は互換性のためだけに
維持されています。新しい設定では、現在選択可能なモデルを使用してください。

| 元のモデル    | 高速モードの対象   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### レガシー互換性と変動するエイリアス

従来のエイリアスは次のように正規化されます。

| レガシーエイリアス                                            | 正規化後の ID   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

日付付きの 0309 ID が選択可能なカタログ項目です。OpenClaw は、それ以外の現在の
Grok 4.20 エイリアスをすべてそのまま送信し、安定版、最新版、ベータ版、実験版、
日付付きエイリアスのセマンティクスを xAI が引き続き管理できるようにします。
グローバルな `grok-latest` エイリアスもそのまま維持されます。

xAI は次の正確な ID を廃止しました。OpenClaw は、リリース済み設定との互換性を保つため、
現在のリダイレクト先の制限と料金を適用した非表示の互換性行としてこれらを維持します。

| 廃止された ID                                                        | 現在の動作                            |
| -------------------------------------------------------------------- | ------------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | `low` 推論を使用する Grok 4.3         |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | 推論を無効にした Grok 4.3              |
| `grok-code-fast-1`                                                   | Grok Build 0.1                        |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality            |

`openclaw doctor --fix` は、永続化された xAI サーバーツールのデフォルトと廃止された
高品質画像のスラッグを更新し、古い生成済みカタログ行を削除し、アクティブな 4.20 行の
古いコンテキストメタデータを修復します。アクティブな 4.20 の `beta-latest` エイリアスを、
日付付きスナップショットに固定することはありません。

## 機能

<Warning>
  `x_search` と `code_execution` は xAI のサーバー上で実行されます。xAI はツール呼び出し
  1,000 回あたり 5 ドルに加え、モデルの入力および出力トークンについて課金します。
  各ツールの `enabled` 設定が省略されている場合、OpenClaw はアクティブな xAI モデルに対してのみ
  そのツールを公開します。既知の xAI 以外のモデルプロバイダーでは、ツールごとに明示的な
  `enabled: true` が必要です。プロバイダーが欠落しているか解決できない場合は、安全側に倒して
  無効になります。xAI 認証は常に必要であり、`enabled: false` はすべてのプロバイダーで
  そのツールを無効にします。
</Warning>

<AccordionGroup>
  <Accordion title="Web 検索">
    バンドルされた `grok` Web 検索プロバイダーは xAI OAuth を優先し、その後
    `XAI_API_KEY` または Plugin の Web 検索キーにフォールバックします。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="動画生成">
    バンドルされた `xai` Plugin は、共有の `video_generate` ツールを通じて動画生成を登録します。

    - デフォルトモデル: `xai/grok-imagine-video`
    - 追加モデル: `xai/grok-imagine-video-1.5`
    - 従来モード: テキストから動画、画像から動画、参照画像による生成、
      リモート動画編集、リモート動画延長
    - Video 1.5 モード: 画像から動画のみ。先頭フレーム画像は正確に 1 枚必要
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`。
      省略した場合、従来モードと Video 1.5 の画像から動画への変換では、
      元画像の比率を継承します
    - 解像度: 従来モードは `480P`／`720P`。Video 1.5 は `1080P` にも対応します。
      すべての生成モードのデフォルトは `480P` です
    - 長さ: 生成／画像から動画では 1～15 秒、従来モードの `reference_image` ロールを
      使用する場合は 1～10 秒、従来モードの延長では 2～10 秒
    - 参照画像による生成: 提供するすべての画像の `imageRoles` を `reference_image` に
      設定します。xAI はこのような画像を最大 7 枚受け付けます
    - 動画の編集／延長では、入力動画のアスペクト比と解像度を継承します。
      これらの操作ではジオメトリの上書きは使用できません
    - デフォルトの操作タイムアウト: `video_generate.timeoutMs` または
      `agents.defaults.videoGenerationModel.timeoutMs` が設定されていない限り 600 秒

    <Warning>
    ローカルの動画バッファは使用できません。動画の編集／延長の入力には、リモートの
    `http(s)` URL を使用してください。画像から動画への変換では、OpenClaw が画像を
    xAI 向けのデータ URL としてエンコードするため、ローカル画像バッファを使用できます。
    </Warning>

    Video 1.5 は、xAI の `grok-imagine-video-1.5-preview` および
    `grok-imagine-video-1.5-2026-05-30` 識別子も認識します。OpenClaw は選択された識別子を
    変更せずに転送しますが、同じ画像のみの検証を適用します。

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
    共有ツールのパラメーター、プロバイダーの選択、フェイルオーバー動作については、
    [動画生成](/ja-JP/tools/video-generation)を参照してください。
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
    - 枚数: 最大4枚
    - デフォルトの処理タイムアウト: `image_generate.timeoutMs`
      または`agents.defaults.imageGenerationModel.timeoutMs`が設定されていない場合は600秒

    OpenClawは、生成されたメディアを通常のチャンネル添付パスを通じて
    保存および配信できるよう、xAIに`b64_json`形式の画像応答を要求します。ローカルの
    参照画像はデータURLに変換され、リモートの`http(s)`参照は
    変更されずに渡されます。

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
    xAIでは`quality`、`mask`、`user`、および`auto`アスペクト比も文書化されています。
    現在、OpenClawが転送するのはプロバイダー間で共通の画像制御のみです。
    これらのネイティブ専用設定は`image_generate`では公開されていません。
    </Note>

  </Accordion>

  <Accordion title="テキスト読み上げ">
    同梱の`xai` Pluginは、共通の`tts`
    プロバイダーインターフェースを通じてテキスト読み上げを登録します。

    - 音声: xAIから取得する認証済みのライブカタログ。`openclaw infer tts voices --provider xai`
      で一覧表示できます
    - オフラインフォールバック音声: `ara`、`eve`、`leo`、`rex`、`sal`
    - デフォルト音声: `eve`
    - アカウント固有のカスタム音声IDは、組み込みカタログの応答に
      含まれていない場合でも転送されます
    - 形式: `mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 言語: BCP-47コードまたは`auto`
    - 速度: プロバイダーネイティブの速度上書き
    - ネイティブのOpusボイスメモ形式はサポートされていません

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
    OpenClawはxAIのバッチ`/v1/tts`エンドポイントと、認証済みの
    `/v1/tts/voices`カタログを使用します。xAIはWebSocket経由のストリーミングTTSも
    提供していますが、同梱のxAIプロバイダーはそのストリーミングフックをまだ実装していません。
    </Note>

  </Accordion>

  <Accordion title="音声からテキストへの変換">
    同梱の`xai` Pluginは、OpenClawの
    メディア理解文字起こしインターフェースを通じて、バッチ音声文字起こしを登録します。

    - エンドポイント: xAI REST `/v1/stt`
    - 入力パス: マルチパート音声ファイルのアップロード
    - モデル選択: xAIが内部で文字起こしモデルを選択します。
      このエンドポイントにモデルセレクターはありません
    - Discordのボイスチャンネルのセグメントやチャンネルの音声添付を含め、
      受信音声の文字起こしで`tools.media.audio`を読み取るすべての箇所で使用されます

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

    言語は、共通の音声メディア設定または呼び出しごとの
    文字起こしリクエストで指定できます。プロンプトのヒントは共通のOpenClaw
    インターフェースで受け付けられますが、xAI REST STT連携が転送するのはファイルと言語のみです。
    これは、現在公開されているxAIエンドポイントに対応するのがこの2つだけであるためです。

  </Accordion>

  <Accordion title="ストリーミング音声文字起こし">
    同梱の`xai` Pluginは、ライブ音声通話の音声向けに
    リアルタイム文字起こしプロバイダーも登録します。

    - エンドポイント: xAI WebSocket `wss://api.x.ai/v1/stt`
    - デフォルトエンコーディング: `mulaw`
    - デフォルトサンプルレート: `8000`
    - デフォルトの発話区切り: `800ms`
    - 中間文字起こし: デフォルトで有効

    Voice CallのTwilioメディアストリームはG.711ミュー則音声フレームを送信するため、
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

    プロバイダーが所有する設定は
    `plugins.entries.voice-call.config.streaming.providers.xai`に配置します。サポートされる
    キーは`apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw`、または
    `alaw`）、`interimResults`、`endpointingMs`、`language`です。

    <Note>
    このストリーミングプロバイダーは、Voice Callのリアルタイム文字起こしパス用です。
    Discordの音声は短いセグメントとして記録され、代わりにバッチの
    `tools.media.audio`文字起こしパスを使用します。
    </Note>

  </Accordion>

  <Accordion title="x_searchの設定">
    同梱のxAI Pluginは、Grokを介してX（旧Twitter）のコンテンツを検索するための
    OpenClawツールとして`x_search`を公開します。

    設定パス: `plugins.entries.xai.config.xSearch`

    | キー              | 型      | デフォルト                | 説明                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | boolean | xAIモデルでは自動         | 無効化するか、既知の非xAIプロバイダーで明示的に有効化 |
    | `model`           | string  | `grok-4.3`                | x_searchリクエストに使用するモデル               |
    | `baseUrl`         | string  | -                         | xAI ResponsesのベースURL上書き                   |
    | `inlineCitations` | boolean | -                         | 結果にインライン引用を含める                     |
    | `maxTurns`        | number  | -                         | 会話ターンの最大数                               |
    | `timeoutSeconds`  | number  | `30`                      | リクエストのタイムアウト（秒）                   |
    | `cacheTtlMinutes` | number  | `15`                      | キャッシュの有効期間（分）                       |

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
    同梱のxAI Pluginは、xAIのサンドボックス環境でリモートコードを実行するための
    OpenClawツールとして`code_execution`を公開します。

    設定パス: `plugins.entries.xai.config.codeExecution`

    | キー             | 型      | デフォルト                | 説明                                             |
    | ---------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`        | boolean | xAIモデルでは自動         | 無効化するか、既知の非xAIプロバイダーで明示的に有効化 |
    | `model`          | string  | `grok-4.3`                | コード実行リクエストに使用するモデル             |
    | `maxTurns`       | number  | -                         | 会話ターンの最大数                               |
    | `timeoutSeconds` | number  | `30`                      | リクエストのタイムアウト（秒）                   |

    <Note>
    これはリモートのxAIサンドボックス実行であり、ローカルの[`exec`](/ja-JP/tools/exec)ではありません。
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
    - xAI認証では、APIキー、環境変数、Plugin設定のフォールバック、または対象となるxAIアカウントでのOAuthを使用できます。OAuthはlocalhostへのコールバックを使わず、デバイスコード検証を使用します。どのアカウントがOAuth APIトークンを取得できるかはxAIが決定し、OpenClawではGrok Buildアプリを必要としない場合でも、同意ページにGrok Buildが表示されることがあります。
    - OpenClawは現在、xAIのマルチエージェントモデルファミリーを公開していません。xAIはこれらのモデルをResponses API経由で提供していますが、OpenClawの共通エージェントループで使用するクライアント側ツールやカスタムツールには対応していません。
      [xAIマルチエージェントの制限](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)を参照してください。
    - xAI Realtime音声は、まだOpenClawプロバイダーとして登録されていません。
      バッチSTTやストリーミング文字起こしとは異なる、双方向音声セッションの契約が必要です。
    - xAI画像の`quality`、画像の`mask`、およびネイティブの`auto`アスペクト比は、
      共通の`image_generate`ツールに対応するプロバイダー間共通の制御が追加されるまで公開されません。
  </Accordion>

  <Accordion title="高度な注意事項">
    - OpenClawは、共通ランナーパス上でxAI固有のツールスキーマおよび
      ツール呼び出しの互換性修正を自動的に適用します。
    - ネイティブのxAIリクエストでは、デフォルトで`tool_stream: true`になります。無効にするには、
      `agents.defaults.models["xai/<model>"].params.tool_stream`を`false`に
      設定します。
    - 同梱のxAIラッパーは、ネイティブxAIリクエストを送信する前に、サポートされていない
      contains-countスキーマ境界と、サポートされていない推論*労力*ペイロードキーを削除します。
      Grok 4.5は低、中、高の労力をサポートします（デフォルトは高）。
      Grok 4.3はなし、低、中、高の労力をサポートします（デフォルトは低）。
      推論機能を持つその他のxAIモデルでは労力を設定できませんが、引き続き
      `include: ["reasoning.encrypted_content"]`を要求するため、以前の暗号化された推論を
      後続ターンで再利用できます。
    - `web_search`、`x_search`、`code_execution`はOpenClaw
      ツールとして公開されます。OpenClawは、すべてのチャットターンにすべてのネイティブツールを
      添付するのではなく、各ツールのリクエストにそのツールが必要とする特定のxAI組み込み機能だけを添付します。
    - Grokの`web_search`は`plugins.entries.xai.config.webSearch.baseUrl`を読み取ります。
      `x_search`は`plugins.entries.xai.config.xSearch.baseUrl`を読み取り、その後
      GrokのWeb検索ベースURLにフォールバックします。
    - `x_search`と`code_execution`は、コアモデルランタイムにハードコードされるのではなく、
      同梱のxAI Pluginが所有します。
    - `code_execution`はリモートのxAIサンドボックス実行であり、ローカルの
      [`exec`](/ja-JP/tools/exec)ではありません。
  </Accordion>
</AccordionGroup>

## ライブテスト

xAIのメディアパスは、ユニットテストと明示的に有効化するライブテストスイートでカバーされています。ライブプローブを実行する前に、
プロセス環境で`XAI_API_KEY`をエクスポートしてください。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

プロバイダー固有のライブファイルは、通常の TTS、電話向け PCM
TTS を合成し、xAI バッチ STT を通じて音声を文字起こしし、同じ PCM を xAI
リアルタイム STT を通じてストリーミングし、テキストから画像への出力を生成し、参照画像を編集します。
共有画像ライブファイルは、OpenClaw のランタイム選択、フォールバック、正規化、メディア添付のパスを通じて、
同じ xAI プロバイダーを検証します。オプトインの Video 1.5 ケースは、生成された最初のフレーム画像を 1 枚 1080P で送信し、
完了した動画のダウンロードを検証します。

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="動画生成" href="/ja-JP/tools/video-generation" icon="video">
    共有動画ツールのパラメーターとプロバイダーの選択。
  </Card>
  <Card title="すべてのプロバイダー" href="/ja-JP/providers/index" icon="grid-2">
    プロバイダーの全体的な概要。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と修正方法。
  </Card>
</CardGroup>

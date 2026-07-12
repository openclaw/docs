---
read_when:
    - エージェントによる動画生成
    - 動画生成プロバイダーとモデルの設定
    - video_generate ツールのパラメータを理解する
sidebarTitle: Video generation
summary: 16のプロバイダーバックエンドを通じて、テキスト、画像、動画の参照からvideo_generateで動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-07-12T14:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw エージェントは、`video_generate` を通じてテキストプロンプト、参照画像、または
既存の動画から動画を生成します。16 種類のプロバイダーバックエンドが
サポートされており、エージェントは設定と利用可能な API キーに基づいて
適切なものを自動的に選択します。

<Note>
`video_generate` は、動画生成プロバイダーが 1 つ以上利用可能な場合にのみ
表示されます。エージェントツールに表示されない場合は、プロバイダーの API キーを設定するか、
`agents.defaults.videoGenerationModel` を構成してください。
</Note>

`video_generate` には 3 つのランタイムモードがあり、呼び出し内の参照入力から
判定されます。

- `generate` - 参照メディアなし（テキストから動画）。
- `imageToVideo` - 1 つ以上の参照画像。
- `videoToVideo` - 1 つ以上の参照動画。

プロバイダーは、これらのモードの任意のサブセットをサポートできます。ツールは
送信前にアクティブなモードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

<Steps>
  <Step title="認証を構成する">
    サポートされている任意のプロバイダーの API キーを設定します。

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="デフォルトモデルを選択する（任意）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="エージェントに依頼する">
    > 夕暮れにサーフィンをする親しみやすいロブスターの、映画のような 5 秒間の動画を生成してください。

    エージェントは `video_generate` を自動的に呼び出します。ツールの許可リストへの追加は
    必要ありません。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期です。

1. OpenClaw はリクエストをプロバイダーに送信し、直ちにタスク ID を返します。
2. プロバイダーはバックグラウンドでジョブを処理します（プロバイダーと解像度に応じて通常 30 秒から数分。キューを使用する低速なプロバイダーでは、構成されたタイムアウトまで実行される場合があります）。
3. 動画の準備が完了すると、OpenClaw は内部完了イベントによって同じセッションを起動します。
4. エージェントは、セッションの通常の可視応答モードを通じて報告します。
   自動の最終応答、またはセッションでメッセージツールが必要な場合は `message(action="send")` です。
   リクエスト元のセッションが非アクティブであるか、その起動に失敗し、
   完了応答に生成済みメディアがまだ含まれていない場合、OpenClaw は
   メディアを含む冪等な直接フォールバックを送信します。

ジョブの実行中は、同じセッション内で重複する `video_generate` 呼び出しを行っても、
別の生成は開始されず、現在のタスク状態が返されます。新しい生成を開始せずに
確認するには `action: "status"` を使用するか、CLI から
`openclaw tasks list` / `openclaw tasks show <lookup>` を使用してください
（[バックグラウンドタスク](/ja-JP/automation/tasks)を参照）。

セッションに基づくエージェント実行の外部（たとえば、ツールの直接呼び出し）では、
ツールはインライン生成にフォールバックし、同じターンで最終メディアのパスを返します。

プロバイダーがバイト列を返す場合、生成された動画ファイルは OpenClaw が管理する
メディアストレージに保存されます。デフォルトの上限は 16MB（共有動画メディア上限）です。
より大きなレンダリングには `agents.defaults.mediaMaxMb` で上限を引き上げられます。
プロバイダーがホストされた出力 URL も返す場合、ローカル永続化でサイズ超過ファイルが
拒否されてもタスクを失敗させず、OpenClaw はその URL を配信します。

### タスクのライフサイクル

| 状態        | 意味                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーによる受け入れを待っています。                                                           |
| `running`   | プロバイダーが処理中です（プロバイダーと解像度に応じて通常 30 秒から数分）。                                            |
| `succeeded` | 動画の準備が完了しています。エージェントが起動し、会話に投稿します。                                                   |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントがエラーの詳細とともに起動します。                               |

CLI から状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## サポートされているプロバイダー

| プロバイダー          | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照                                        | 認証                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 対応（リモート URL）                                 | 対応（リモート URL）                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最大 2 画像（I2V モデルのみ。最初と最後のフレーム） | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最大 2 画像（ロールによる最初と最後のフレーム）     | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最大 9 枚の参照画像                                  | 最大 3 本の動画                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 画像                                               | -                                               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 画像。Seedance の参照から動画では最大 9 画像       | Seedance の参照から動画では最大 3 本の動画      | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 画像                                               | 1 動画                                          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 画像                                               | -                                               | `MINIMAX_API_KEY` または MiniMax OAuth   |
| OpenAI                | `sora-2`                        |  ✓   | 1 画像                                               | 1 動画                                          | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最大 4 画像（最初／最後のフレームまたは参照）       | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 対応（リモート URL）                                 | 対応（リモート URL）                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 画像                                               | 1 動画                                          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | `Wan-AI/Wan2.2-I2V-A14B` のみ                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 画像（`kling`）                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic: 最初の 1 フレームまたは 7 参照。1.5: 1 フレーム | Classic: 1 動画                              | `XAI_API_KEY`                            |

一部のプロバイダーでは、追加または代替の API キー環境変数を使用できます。詳細については、
各[プロバイダーページ](#related)を参照してください。

実行時に利用可能なプロバイダー、モデル、ランタイムモードを確認するには、
`video_generate action=list` を実行します。

### 機能マトリックス

`video_generate`、契約テスト、共有ライブスイープで使用される
明示的なモード契約は次のとおりです。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーにはリモートの `http(s)` 動画 URL が必要なため、`videoToVideo` はスキップされます           |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 共有スイープには含まれません。ワークフロー固有のカバレッジは Comfy テストで扱われます                                                  |
| DeepInfra  |     ✓      |       -        |       -        | `generate`。ネイティブの DeepInfra 動画スキーマは、Plugin 契約ではテキストから動画です                                                  |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は Seedance の参照から動画を使用する場合のみです                                             |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のバッファベースの Gemini/Veo スイープはこの入力を受け付けないため、共有 `videoToVideo` はスキップされます |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。この組織／入力パスでは現在プロバイダー側の動画編集アクセス権が必要なため、共有 `videoToVideo` はスキップされます |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーにはリモートの `http(s)` 動画 URL が必要なため、`videoToVideo` はスキップされます           |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は選択されたモデルが `runway/gen4_aleph` の場合にのみ実行されます                            |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`。同梱の `veo3` はテキスト専用で、同梱の `kling` にはリモート画像 URL が必要なため、共有 `imageToVideo` はスキップされます     |
| xAI        |     ✓      |       ✓        |       ✓        | Classic はすべてのモードをサポートします。Video 1.5 は画像から動画のみです。リモート MP4 入力のため、`videoToVideo` は共有スイープに含まれません |

## ツールパラメーター

### 必須

<ParamField path="prompt" type="string" required>
  生成する動画のテキストによる説明。`action: "generate"` では必須です。
</ParamField>

### コンテンツ入力

<ParamField path="image" type="string">単一の参照画像（パスまたは URL）。</ParamField>
<ParamField path="images" type="string[]">複数の参照画像（最大 9 個）。</ParamField>
<ParamField path="imageRoles" type="string[]">
結合された画像リストと並行する、位置ごとのオプションのロールヒント。
標準値: `first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">単一の参照動画（パスまたは URL）。</ParamField>
<ParamField path="videos" type="string[]">複数の参照動画（最大 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストと並行する、位置ごとのオプションのロールヒント。
標準値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートしている場合に、
BGM または音声参照として使用されます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数の参照音声（最大 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストと並行する、位置ごとのオプションのロールヒント。
標準値: `reference_audio`。
</ParamField>

<Note>
ロールヒントはそのままプロバイダーに転送されます。標準値は
`VideoGenerationAssetRole` ユニオンに由来しますが、プロバイダーが追加の
ロール文字列を受け入れる場合があります。`*Roles` 配列のエントリ数は、
対応する参照リストの数を超えてはなりません。1 つずれる誤りは明確なエラーで失敗します。
スロットを未設定のままにするには、空文字列を使用します。xAI で
`reference_images` 生成モードを使用するには、すべての画像ロールを
`reference_image` に設定します。単一画像から動画を生成する場合は、ロールを省略するか
`first_frame` を使用します。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`、`16:9`、`9:16`、`adaptive`、またはプロバイダー固有の値などのアスペクト比ヒント。OpenClaw は、サポートされていない値をプロバイダーごとに正規化または無視します。
</ParamField>
<ParamField path="resolution" type="string">`360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`、またはプロバイダー固有の値などの解像度ヒント。OpenClaw は、サポートされていない値をプロバイダーごとに正規化または無視します。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時間（秒単位。プロバイダーがサポートする最も近い値に丸められます）。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートしている場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされている場合、出力で生成音声を有効にします。`audioRef*`（入力）とは異なります。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされている場合、プロバイダーの透かしを切り替えます。</ParamField>

`adaptive` はプロバイダー固有のセンチネルです。機能で `adaptive` を宣言している
プロバイダーには、そのまま転送されます（たとえば BytePlus Seedance は、
入力画像の寸法から比率を自動検出するために使用します）。
これを宣言していないプロバイダーでは、ツール結果の
`details.ignoredOverrides` に値が表示されるため、破棄されたことを確認できます。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返し、`"list"` はプロバイダーを調査します。
</ParamField>
<ParamField path="model" type="string">プロバイダー／モデルのオーバーライド（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">プロバイダー操作のオプションのタイムアウト（ミリ秒単位）。省略した場合、設定されていれば OpenClaw は `agents.defaults.videoGenerationModel.timeoutMs` を使用し、それ以外では Plugin 作成者が定義したプロバイダーのデフォルト値が存在すればそれを使用します。</ParamField>
<ParamField path="providerOptions" type="object">
  JSON オブジェクトとして指定するプロバイダー固有のオプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言しているプロバイダーは、キーと型を検証します。不明な
  キーまたは型の不一致がある場合、フォールバック中にその候補をスキップします。
  宣言されたスキーマがないプロバイダーは、オプションをそのまま受け取ります。
  各プロバイダーが受け入れる内容を確認するには、`video_generate action=list`
  を実行します。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。
OpenClaw は時間をプロバイダーがサポートする最も近い値に正規化し、
フォールバック先のプロバイダーが異なる制御面を公開している場合は、
サイズからアスペクト比への変換など、変換可能なジオメトリヒントを再マッピングします。
実際にサポートされていないオーバーライドはベストエフォートで無視され、
ツール結果に警告として報告されます。厳格な機能上の制限
（参照入力が多すぎる場合など）は送信前に失敗します。ツール結果には
適用された設定が報告され、`details.normalization` には
要求値から適用値への変換が記録されます。
</Note>

参照入力によってランタイムモードが選択されます。

- 参照メディアなし -> `generate`
- 画像参照あり -> `imageToVideo`
- 動画参照あり -> `videoToVideo`
- 参照音声入力は、解決されたモードを**変更しません**。画像／動画参照によって
  選択されたモードに追加で適用され、`maxInputAudios` を宣言している
  プロバイダーでのみ機能します。

画像参照と動画参照の混在は、安定した共通機能面ではありません。
リクエストごとに 1 種類の参照タイプを使用することを推奨します。

#### フォールバックと型付きオプション

一部の機能チェックはツール境界ではなくフォールバック層で適用されるため、
プライマリプロバイダーの制限を超えるリクエストでも、対応可能なフォールバックで
実行できる場合があります。

- アクティブな候補が `maxInputAudios` を宣言していない（または `0`）場合、
  リクエストに音声参照が含まれているとスキップされ、次の候補が試されます。同じ
  ガードが、画像および動画の参照数と
  `maxInputImages`／`maxInputVideos` の比較にも適用されます。
- アクティブな候補の `maxDurationSeconds` が要求された `durationSeconds`
  を下回り、`supportedDurationSeconds` リストも宣言されていない場合はスキップされます。
- リクエストに `providerOptions` が含まれ、アクティブな候補が型付きの
  `providerOptions` スキーマを明示的に宣言している場合、指定されたキーが
  スキーマにない、または値の型が一致しないとスキップされます。宣言された
  スキーマがないプロバイダーは、オプションをそのまま受け取ります（後方互換の
  パススルー）。プロバイダーは空のスキーマ
  （`capabilities.providerOptions: {}`）を宣言することで、すべての
  プロバイダーオプションを無効にできます。この場合も型不一致と同様にスキップされます。

リクエスト内の最初のスキップ理由は `warn` でログに記録されるため、運用者は
プライマリプロバイダーが見送られたことを確認できます。長いフォールバックチェーンを
静かに保つため、後続のスキップは `debug` でログに記録されます。すべての候補が
スキップされた場合、集約されたエラーには各候補のスキップ理由が含まれます。

## アクション

| アクション | 動作内容 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | デフォルト。指定されたプロンプトとオプションの参照入力から動画を作成します。 |
| `status`   | 別の生成を開始せずに、現在のセッションで進行中の動画タスクの状態を確認します。 |
| `list`     | 利用可能なプロバイダー、モデル、およびその機能を表示します。 |

## モデルの選択

OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** - エージェントが呼び出しで指定した場合。
2. 設定の **`videoGenerationModel.primary`**。
3. **`videoGenerationModel.fallbacks`**（記載順）。
4. **自動検出** - 有効な認証を持つプロバイダー。現在のデフォルトプロバイダーから開始し、
   その後、残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗すると、次の候補が自動的に試されます。すべての
候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリのみを使用するには、
`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // ツールごとのプロバイダーリクエストタイムアウトのオプションのオーバーライド
      },
    },
  },
}
```

## プロバイダーに関する注記

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio の非同期エンドポイントを使用します。参照画像と
    動画はリモートの `http(s)` URL である必要があります。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    プロバイダー ID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと
    汎用の `*-pro-*` モデルは、単一の参照画像（先頭フレーム）をサポートします。
    画像を位置引数で渡すか、`role: "first_frame"` を設定します。
    画像が指定されると、T2V モデル ID は対応する I2V バリアントに
    自動的に切り替えられます。

    サポートされている `providerOptions` キー: `seed`（数値）、`draft`（ブール値 -
    480p を強制）、`camera_fixed`（ブール値）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin（外部、同梱されていません）が必要です。プロバイダー ID: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統合された `content[]` API を使用します。最大 2 個の入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各画像に `role: "first_frame"` /
    `"last_frame"` を設定するか、画像を位置引数で渡します。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）が転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin（外部、同梱されていません）が必要です。プロバイダー ID: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    統合された `content[]` API を使用します。最大 9 個の参照画像、
    3 個の参照動画、3 個の参照音声をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各アセットに `role` を設定します。サポートされる値:
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）が転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行。設定されたグラフを通じて、
    テキストから動画、および画像から動画への生成をサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブにはキューベースのフローを使用します。OpenClaw はデフォルトで最大 20
    分間待機し、その後も処理中の fal キュージョブをタイムアウトとして扱います。
    ほとんどの fal 動画モデルは、単一の画像参照を受け付けます。Seedance 2.0 の参照から動画への
    モデルは、最大 9 枚の画像、3 本の動画、3 件の音声参照を受け付け、
    参照ファイルの合計は最大 12 件です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1 つの画像または 1 本の動画の参照をサポートします。現在の Veo 動画生成では
    Gemini API が `generateAudio` パラメーターを拒否するため、Gemini API 経由の
    生成音声リクエストは警告とともに無視されます。
  </Accordion>
  <Accordion title="MiniMax">
    単一の画像参照のみ。MiniMax は `768P` および `1080P` の
    解像度を受け付けます。`720P` などのリクエストは、送信前に最も近い
    サポート対象値へ正規化されます。
  </Accordion>
  <Accordion title="OpenAI">
    `size` オーバーライドのみ転送されます。その他のスタイルオーバーライド
    （`aspectRatio`、`resolution`、`audio`、`watermark`）は警告とともに
    無視されます。
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter の非同期 `/videos` API を使用します。OpenClaw はジョブを
    送信し、`polling_url` をポーリングして、`unsigned_urls` または
    ドキュメントに記載されたジョブコンテンツエンドポイントからダウンロードします。同梱のデフォルト
    `google/veo-3.1-fast` は、4/6/8 秒の長さ、`720P`/`1080P` の解像度、
    `16:9`/`9:16` のアスペクト比を提供します。
  </Accordion>
  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドです。参照入力はリモートの
    `http(s)` URL でなければならず、ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    データ URI によるローカルファイルをサポートします。動画から動画への変換には
    `runway/gen4_aleph` が必要です。テキストのみの実行では、`16:9` および `9:16` の
    アスペクト比を使用できます。
  </Accordion>
  <Accordion title="Together">
    単一の画像参照のみ。
  </Accordion>
  <Accordion title="Vydra">
    認証情報が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を
    直接使用します。`veo3` はテキストから動画への生成専用として同梱され、
    `kling` にはリモート画像 URL が必要です。
  </Accordion>
  <Accordion title="xAI">
    デフォルトの `grok-imagine-video` モデルは、テキストから動画への生成、単一の
    先頭フレーム画像から動画への生成、xAI の `reference_images` を通じた最大 7 件の
    `reference_image` 入力、およびリモート動画の編集・延長フローをサポートします。生成時のデフォルト
    は `480P` です。単一画像から動画への生成では、`aspectRatio` を省略すると
    元画像の比率を継承します。動画の編集・延長では入力のジオメトリを継承し、
    アスペクト比または解像度のオーバーライドを受け付けません。延長は 2～10
    秒に対応します。

    `grok-imagine-video-1.5` は画像から動画への生成専用です。画像を正確に 1 枚指定してください。
    1～15 秒、および `480P`、`720P`、`1080P` をサポートし、デフォルトは
    `480P` です。元画像の比率を継承するには `aspectRatio` を省略します。プレビュー版
    および日付付きの 1.5 識別子には同じ検証が適用され、変更せずに
    転送されます。

  </Accordion>
</AccordionGroup>

## プロバイダーのケイパビリティモード

共有の動画生成コントラクトは、フラットな集約制限だけでなく、
モード固有のケイパビリティをサポートします。新しいプロバイダー実装では、
明示的なモードブロックを優先してください。

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` や `maxInputVideos` などのフラットな集約フィールドだけでは、
変換モードのサポートを示すには**不十分**です。ライブテスト、
コントラクトテスト、および共有の `video_generate` ツールがモードサポートを
決定論的に検証できるよう、プロバイダーは `generate`、`imageToVideo`、
`videoToVideo` を明示的に宣言する必要があります。

プロバイダー内の 1 つのモデルだけが他より広い参照入力をサポートする場合は、
モード全体の制限を引き上げるのではなく、`maxInputImagesByModel`、
`maxInputVideosByModel`、または `maxInputAudiosByModel` を使用してください。

## ライブテスト

共有の同梱プロバイダー向けのオプトインライブカバレッジ：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー：

```bash
pnpm test:live:media video
```

このライブファイルでは、デフォルトで保存済み認証プロファイルよりも、すでにエクスポートされている
プロバイダー環境変数を優先し、デフォルトでリリースに安全なスモークテストを実行します。

- スイープ内の FAL 以外のすべてのプロバイダーで `generate`。
- 1 秒の lobster プロンプト。
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるプロバイダーごとの処理上限
  （デフォルトは `180000`）。

プロバイダー側のキュー遅延がリリース時間の大部分を占める可能性があるため、
FAL はオプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定すると、共有スイープが
ローカルメディアを使って安全に実行できる、宣言済みの変換モードも実行します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`。
- `capabilities.videoToVideo.enabled` で、かつプロバイダーまたはモデルが
  共有スイープ内のバッファベースのローカル動画入力を受け付ける場合は `videoToVideo`。

現在、共有の `videoToVideo` ライブレーンが対象とするのは、
`runway/gen4_aleph` を選択した場合の `runway` のみです。

## 設定

OpenClaw の設定でデフォルトの動画生成モデルを設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

または CLI を使用します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 関連項目

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [バックグラウンドタスク](/ja-JP/automation/tasks) - 非同期動画生成のタスク追跡
- [BytePlus](/ja-JP/concepts/model-providers#byteplus-international)
- [ComfyUI](/ja-JP/providers/comfy)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults)
- [fal](/ja-JP/providers/fal)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [モデル](/ja-JP/concepts/models)
- [OpenAI](/ja-JP/providers/openai)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [Together AI](/ja-JP/providers/together)
- [ツールの概要](/ja-JP/tools)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)

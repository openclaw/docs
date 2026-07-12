---
read_when:
    - エージェントによる動画生成
    - 動画生成プロバイダーとモデルの設定
    - video_generate ツールのパラメーターを理解する
sidebarTitle: Video generation
summary: 16のプロバイダーバックエンドで、テキスト、画像、動画の参照からvideo_generateを使用して動画を生成する
title: 動画生成
x-i18n:
    generated_at: "2026-07-11T22:46:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw エージェントは、`video_generate` を通じて、テキストプロンプト、参照画像、または
既存の動画から動画を生成します。16 種類のプロバイダーバックエンドが
サポートされており、エージェントは設定と利用可能な API キーに基づいて
適切なものを自動的に選択します。

<Note>
`video_generate` は、少なくとも 1 つの動画生成プロバイダーが利用可能な場合にのみ
表示されます。エージェントツールに表示されない場合は、プロバイダーの API キーを設定するか、
`agents.defaults.videoGenerationModel` を構成してください。
</Note>

`video_generate` には 3 つのランタイムモードがあり、呼び出し内の参照入力から
決定されます。

- `generate` - 参照メディアなし（テキストから動画）。
- `imageToVideo` - 1 つ以上の参照画像。
- `videoToVideo` - 1 つ以上の参照動画。

プロバイダーは、これらのモードの任意の組み合わせをサポートできます。ツールは送信前に
有効なモードを検証し、`action=list` でサポートされるモードを報告します。

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
    > 夕暮れ時にサーフィンをする親しみやすいロブスターの、映画のような 5 秒間の動画を生成してください。

    エージェントは `video_generate` を自動的に呼び出します。ツールの許可リストへの登録は
    必要ありません。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期で行われます。

1. OpenClaw はリクエストをプロバイダーに送信し、ただちにタスク ID を返します。
2. プロバイダーはバックグラウンドでジョブを処理します（通常は 30 秒から数分で、プロバイダーと解像度によって異なります。キューを使用する低速なプロバイダーでは、構成されたタイムアウトまで実行される場合があります）。
3. 動画の準備ができると、OpenClaw は内部完了イベントによって同じセッションを起動します。
4. エージェントは、セッションの通常の可視応答モードで報告します。
   自動的な最終応答、またはセッションでメッセージツールが必要な場合は
   `message(action="send")` を使用します。リクエスト元のセッションが非アクティブであるか、
   起動に失敗し、完了応答にも生成されたメディアが含まれていない場合、OpenClaw は
   メディアを含む冪等な直接フォールバックを送信します。

ジョブの実行中、同じセッションで重複する `video_generate` 呼び出しが行われると、
別の生成を開始する代わりに現在のタスク状態が返されます。新しい生成を
トリガーせずに確認するには `action: "status"` を使用するか、CLI から
`openclaw tasks list` / `openclaw tasks show <lookup>` を使用します
（[バックグラウンドタスク](/ja-JP/automation/tasks)を参照）。

セッションに基づくエージェント実行の外部（たとえば、ツールの直接呼び出し）では、
ツールはインライン生成にフォールバックし、同じターンで最終的なメディアパスを
返します。

プロバイダーがバイト列を返す場合、生成された動画ファイルは OpenClaw が管理する
メディアストレージに保存されます。デフォルトの上限は 16MB（共有動画メディアの
上限）です。より大きなレンダリングでは `agents.defaults.mediaMaxMb` で引き上げられます。
プロバイダーがホストされた出力 URL も返す場合、ローカル永続化でサイズ超過のファイルが
拒否されても、OpenClaw はタスクを失敗させる代わりにその URL を配信します。

### タスクのライフサイクル

| 状態        | 意味                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーによる受け入れを待っています。                                              |
| `running`   | プロバイダーが処理中です（通常は 30 秒から数分で、プロバイダーと解像度によって異なります）。                |
| `succeeded` | 動画の準備が完了しました。エージェントが起動し、会話に投稿します。                                        |
| `failed`    | プロバイダーエラーまたはタイムアウトが発生しました。エージェントがエラーの詳細とともに起動します。          |

CLI から状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## サポートされているプロバイダー

| プロバイダー           | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照                                        | 認証                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | 対応（リモート URL）                                 | 対応（リモート URL）                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最大 2 枚（I2V モデルのみ、最初と最後のフレーム）    | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最大 2 枚（ロールによる最初と最後のフレーム）        | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最大 9 枚の参照画像                                  | 最大 3 本の動画                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1 枚                                                 | -                                               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1 枚、Seedance の参照から動画生成では最大 9 枚       | Seedance の参照から動画生成では最大 3 本        | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1 枚                                                 | 1 本                                            | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1 枚                                                 | -                                               | `MINIMAX_API_KEY` または MiniMax OAuth   |
| OpenAI                | `sora-2`                        |  ✓   | 1 枚                                                 | 1 本                                            | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最大 4 枚（最初と最後のフレーム、または参照画像）    | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | 対応（リモート URL）                                 | 対応（リモート URL）                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1 枚                                                 | 1 本                                            | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | `Wan-AI/Wan2.2-I2V-A14B` のみ                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1 枚（`kling`）                                      | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | Classic: 最初のフレーム 1 枚または参照 7 枚、1.5: 1 フレーム | Classic: 1 本                                   | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替の API キー環境変数を受け付けます。詳細は
各[プロバイダーページ](#related)を参照してください。

実行時に利用可能なプロバイダー、モデル、およびランタイムモードを確認するには、
`video_generate action=list` を実行します。

### 機能マトリックス

`video_generate`、コントラクトテスト、および共有ライブスイープで使用される
明示的なモード契約は次のとおりです。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーではリモートの `http(s)` 動画 URL が必要なため、`videoToVideo` はスキップされます             |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 共有スイープには含まれません。ワークフロー固有のカバレッジは Comfy テストで扱われます                                                  |
| DeepInfra  |     ✓      |       -        |       -        | `generate`。ネイティブの DeepInfra 動画スキーマは Plugin 契約でテキストから動画生成として定義されています                              |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は Seedance の参照から動画生成を使用する場合のみ対応します                                    |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のバッファベースの Gemini/Veo スイープではその入力を受け付けないため、共有 `videoToVideo` はスキップされます |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。この組織と入力経路では現在プロバイダー側の動画編集アクセス権が必要なため、共有 `videoToVideo` はスキップされます |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーではリモートの `http(s)` 動画 URL が必要なため、`videoToVideo` はスキップされます             |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は選択したモデルが `runway/gen4_aleph` の場合にのみ実行されます                               |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`。同梱の `veo3` はテキスト専用で、同梱の `kling` にはリモート画像 URL が必要なため、共有 `imageToVideo` はスキップされます       |
| xAI        |     ✓      |       ✓        |       ✓        | Classic はすべてのモードをサポートします。Video 1.5 は画像から動画生成のみです。リモート MP4 入力のため、`videoToVideo` は共有スイープの対象外です |

## ツールのパラメーター

### 必須

<ParamField path="prompt" type="string" required>
  生成する動画のテキスト説明です。`action: "generate"` では必須です。
</ParamField>

### コンテンツ入力

<ParamField path="image" type="string">単一の参照画像（パスまたは URL）。</ParamField>
<ParamField path="images" type="string[]">複数の参照画像（最大 9 件）。</ParamField>
<ParamField path="imageRoles" type="string[]">
結合された画像リストに対応する、位置ごとの任意のロールヒント。
標準値: `first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">単一の参照動画（パスまたは URL）。</ParamField>
<ParamField path="videos" type="string[]">複数の参照動画（最大 4 件）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストに対応する、位置ごとの任意のロールヒント。
標準値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートする場合に、
BGM または音声参照として使用されます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数の参照音声（最大 3 件）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストに対応する、位置ごとの任意のロールヒント。
標準値: `reference_audio`。
</ParamField>

<Note>
ロールヒントはそのままプロバイダーに転送されます。標準値は
`VideoGenerationAssetRole` ユニオンに由来しますが、プロバイダーによっては追加の
ロール文字列を受け付ける場合があります。`*Roles` 配列の要素数は、対応する
参照リストの要素数を超えてはなりません。1 件のずれでも明確なエラーになります。
スロットを未設定のままにするには空文字列を使用します。xAI で
`reference_images` 生成モードを使用するには、すべての画像ロールを
`reference_image` に設定します。単一画像から動画を生成する場合は、
ロールを省略するか `first_frame` を使用します。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`、`16:9`、`9:16`、`adaptive`、またはプロバイダー固有の値などのアスペクト比ヒント。OpenClaw は、サポートされていない値をプロバイダーごとに正規化または無視します。
</ParamField>
<ParamField path="resolution" type="string">`360P`、`480P`、`540P`、`720P`、`768P`、`1080P`、`4K`、またはプロバイダー固有の値などの解像度ヒント。OpenClaw は、サポートされていない値をプロバイダーごとに正規化または無視します。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標時間（秒単位。プロバイダーがサポートする最も近い値に丸められます）。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートする場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされている場合、出力で生成音声を有効にします。入力である `audioRef*` とは異なります。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされている場合、プロバイダーによる透かしの付与を切り替えます。</ParamField>

`adaptive` はプロバイダー固有のセンチネルです。機能に `adaptive` を宣言している
プロバイダーにはそのまま転送されます（たとえば BytePlus
Seedance は、入力画像の寸法から比率を自動検出するために使用します）。
これを宣言していないプロバイダーでは、破棄されたことが分かるように、
ツール結果の `details.ignoredOverrides` を通じて値が示されます。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションのタスクを返し、`"list"` はプロバイダーを調査します。
</ParamField>
<ParamField path="model" type="string">プロバイダー／モデルのオーバーライド（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">プロバイダー操作の任意のタイムアウト（ミリ秒単位）。省略した場合、OpenClaw は設定されていれば `agents.defaults.videoGenerationModel.timeoutMs` を使用し、設定されていなければ、存在する場合は Plugin で定義されたプロバイダーのデフォルト値を使用します。</ParamField>
<ParamField path="providerOptions" type="object">
  JSON オブジェクト形式のプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言するプロバイダーは、キーと型を検証します。不明なキーまたは
  型の不一致がある場合、フォールバック時にその候補をスキップします。スキーマを
  宣言していないプロバイダーは、オプションをそのまま受け取ります。各プロバイダーが
  受け付ける内容を確認するには、`video_generate action=list` を実行します。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートするわけではありません。OpenClaw は
時間をプロバイダーがサポートする最も近い値に正規化し、フォールバック先のプロバイダーが
異なる制御方式を公開している場合は、サイズからアスペクト比への変換など、変換可能な
ジオメトリヒントを再マッピングします。実際にサポートされていないオーバーライドは、
ベストエフォートで無視され、ツール結果に警告として報告されます。厳密な機能上限
（参照入力が多すぎる場合など）を超えると、送信前に失敗します。ツール結果には
適用された設定が報告され、`details.normalization` には要求値から適用値への
変換内容が記録されます。
</Note>

参照入力によって実行時モードが選択されます。

- 参照メディアなし -> `generate`
- 画像参照あり -> `imageToVideo`
- 動画参照あり -> `videoToVideo`
- 参照音声入力は、解決されるモードを変更**しません**。画像／動画参照によって
  選択されたモードに追加で適用され、`maxInputAudios` を宣言する
  プロバイダーでのみ機能します。

画像参照と動画参照の混在は、安定した共通機能ではありません。
リクエストごとに 1 種類の参照を使用することを推奨します。

#### フォールバックと型付きオプション

一部の機能チェックはツール境界ではなくフォールバック層で適用されるため、
プライマリプロバイダーの上限を超えるリクエストでも、対応可能なフォールバックで
実行できる場合があります。

- リクエストに音声参照が含まれる場合、`maxInputAudios` を宣言していない
  （または `0` を宣言している）アクティブな候補はスキップされ、次の候補が試されます。
  同じ制約が、画像および動画の参照数と `maxInputImages`／`maxInputVideos` の
  比較にも適用されます。
- アクティブな候補の `maxDurationSeconds` が要求された `durationSeconds` を
  下回り、`supportedDurationSeconds` リストが宣言されていない場合 -> スキップされます。
- リクエストに `providerOptions` が含まれ、アクティブな候補が型付きの
  `providerOptions` スキーマを明示的に宣言している場合 -> 指定されたキーが
  スキーマに存在しないか、値の型が一致しなければスキップされます。スキーマを
  宣言していないプロバイダーは、オプションをそのまま受け取ります
  （後方互換性のあるパススルー）。プロバイダーは空のスキーマ
  （`capabilities.providerOptions: {}`）を宣言することで、すべての
  プロバイダーオプションを拒否できます。この場合も、型の不一致と同様にスキップされます。

リクエスト内の最初のスキップ理由は `warn` でログに記録されるため、
運用担当者はプライマリプロバイダーが見送られたことを確認できます。後続のスキップは、
長いフォールバックチェーンでログが過剰にならないよう `debug` で記録されます。
すべての候補がスキップされた場合、集約されたエラーに各候補のスキップ理由が含まれます。

## アクション

| アクション   | 処理内容                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `generate`   | デフォルト。指定されたプロンプトと任意の参照入力から動画を作成します。                                     |
| `status`     | 新しい生成を開始せず、現在のセッションで処理中の動画タスクの状態を確認します。                             |
| `list`       | 利用可能なプロバイダー、モデル、およびその機能を表示します。                                               |

## モデルの選択

OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** - エージェントが呼び出しで指定した場合。
2. 設定の **`videoGenerationModel.primary`**。
3. **`videoGenerationModel.fallbacks`** を順番に使用。
4. **自動検出** - 有効な認証を持つプロバイダーを、現在のデフォルトプロバイダーから
   開始し、その後、残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗すると、次の候補が自動的に試されます。すべての
候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` のエントリのみを使用するには、
`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // ツールごとのプロバイダーリクエストタイムアウトを任意でオーバーライド
      },
    },
  },
}
```

## プロバイダーに関する注意事項

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope／Model Studio の非同期エンドポイントを使用します。参照画像と
    動画はリモートの `http(s)` URL である必要があります。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    プロバイダー ID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと
    汎用の `*-pro-*` モデルは、単一の参照画像（最初のフレーム）を
    サポートします。画像を位置引数として渡すか、`role: "first_frame"` を設定します。
    画像が指定された場合、T2V モデル ID は対応する I2V
    バリアントに自動的に切り替えられます。

    サポートされる `providerOptions` キー: `seed`（数値）、`draft`（ブール値 -
    480p を強制）、`camera_fixed`（ブール値）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です（外部提供であり、同梱されていません）。プロバイダー ID: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統合された `content[]` API を使用します。最大 2 枚の入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各画像に `role: "first_frame"`／`"last_frame"` を
    設定するか、画像を位置引数として渡します。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）は転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です（外部提供であり、同梱されていません）。プロバイダー ID: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    統合された `content[]` API を使用します。最大 9 枚の参照画像、
    3 本の参照動画、3 件の参照音声をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各アセットに `role` を設定します。サポートされる値:
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）は転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行。設定済みのグラフを通じて、
    テキストから動画、および画像から動画への生成をサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブには、キューを利用するフローを使用します。デフォルトでは、
    進行中の fal キュージョブをタイムアウトとして扱うまで、OpenClaw は最大20分間
    待機します。ほとんどの fal 動画モデルは、単一の画像参照を受け付けます。
    Seedance 2.0 の参照から動画への変換モデルは、最大9件の画像、3件の動画、
    3件の音声参照を受け付け、参照ファイルの総数は最大12件です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1件の画像または1件の動画参照をサポートします。現在の Veo 動画生成では
    Gemini API が `generateAudio` パラメーターを拒否するため、Gemini API 経由の
    音声生成リクエストは警告付きで無視されます。
  </Accordion>
  <Accordion title="MiniMax">
    単一の画像参照のみをサポートします。MiniMax は `768P` と `1080P` の
    解像度を受け付けます。`720P` などのリクエストは、送信前に最も近い
    サポート対象値へ正規化されます。
  </Accordion>
  <Accordion title="OpenAI">
    `size` の上書きのみ転送されます。その他のスタイル上書き
    （`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで
    無視されます。
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter の非同期 `/videos` API を使用します。OpenClaw はジョブを
    送信し、`polling_url` をポーリングして、`unsigned_urls` または
    ドキュメントに記載されたジョブコンテンツのエンドポイントからダウンロードします。
    同梱のデフォルトモデル `google/veo-3.1-fast` は、4/6/8秒の再生時間、
    `720P`/`1080P` の解像度、`16:9`/`9:16` のアスペクト比を提示します。
  </Accordion>
  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドを使用します。参照入力にはリモートの
    `http(s)` URL が必要です。ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    データ URI を介してローカルファイルをサポートします。動画から動画への変換には
    `runway/gen4_aleph` が必要です。テキストのみの実行では、`16:9` と `9:16` の
    アスペクト比を利用できます。
  </Accordion>
  <Accordion title="Together">
    単一の画像参照のみをサポートします。
  </Accordion>
  <Accordion title="Vydra">
    認証情報が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を
    直接使用します。`veo3` はテキストから動画への変換専用として同梱されています。
    `kling` にはリモート画像 URL が必要です。
  </Accordion>
  <Accordion title="xAI">
    デフォルトの `grok-imagine-video` モデルは、テキストから動画への生成、
    最初のフレームとなる単一画像から動画への生成、xAI の `reference_images` を
    介した最大7件の `reference_image` 入力、およびリモート動画の編集・延長フローを
    サポートします。生成のデフォルトは `480P` です。単一画像から動画への生成では、
    `aspectRatio` を省略すると元画像の比率を継承します。動画の編集・延長では
    入力の寸法を継承し、アスペクト比や解像度の上書きは受け付けません。
    延長には2～10秒を指定できます。

    `grok-imagine-video-1.5` は画像から動画への生成専用です。画像を正確に1件
    指定してください。1～15秒、および `480P`、`720P`、`1080P` をサポートし、
    デフォルトは `480P` です。元画像の比率を継承するには `aspectRatio` を
    省略します。プレビュー版と日付付きの 1.5 識別子には同じ検証が適用され、
    変更されずに転送されます。

  </Accordion>
</AccordionGroup>

## プロバイダーの機能モード

共有動画生成コントラクトは、単純な集約上限だけでなく、モード固有の機能を
サポートします。新しいプロバイダー実装では、明示的なモードブロックを
優先してください。

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
変換モードのサポートを提示するには**不十分**です。ライブテスト、
コントラクトテスト、共有 `video_generate` ツールがモードのサポートを
決定論的に検証できるように、プロバイダーは `generate`、`imageToVideo`、
`videoToVideo` を明示的に宣言してください。

プロバイダー内の1つのモデルだけが他より広い参照入力をサポートする場合は、
モード全体の上限を引き上げるのではなく、`maxInputImagesByModel`、
`maxInputVideosByModel`、または `maxInputAudiosByModel` を使用してください。

## ライブテスト

共有の同梱プロバイダーを対象とする、オプトイン形式のライブカバレッジ：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー：

```bash
pnpm test:live:media video
```

このライブテストファイルでは、デフォルトで保存済み認証プロファイルよりも、
すでにエクスポートされているプロバイダー環境変数を優先し、リリース時に安全な
スモークテストをデフォルトで実行します。

- 一連のテスト内にある FAL 以外のすべてのプロバイダーで `generate` を実行。
- 1秒間のロブスター用プロンプト。
- プロバイダーごとの処理上限は
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルトは `180000`）から取得。

プロバイダー側のキュー待機時間がリリース所要時間の大部分を占める可能性があるため、
FAL はオプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定すると、共有テストで
ローカルメディアを使用して安全に実行できる、宣言済みの変換モードも実行します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`。
- `capabilities.videoToVideo.enabled` であり、かつプロバイダーまたはモデルが
  共有テストでバッファーに格納されたローカル動画入力を受け付ける場合は
  `videoToVideo`。

現在、共有の `videoToVideo` ライブレーンは、`runway/gen4_aleph` を選択した場合に
限り、`runway` を対象とします。

## 設定

OpenClaw の設定でデフォルトの動画生成モデルを指定します。

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

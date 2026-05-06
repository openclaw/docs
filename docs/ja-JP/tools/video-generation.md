---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルの設定
    - video_generate ツールのパラメーターを理解する
sidebarTitle: Video generation
summary: テキスト、画像、動画の参照から、16 のプロバイダーバックエンド全体で video_generate により動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-05-06T05:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClawエージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。16個のプロバイダーバックエンドがサポートされており、それぞれモデルの選択肢、入力モード、機能セットが異なります。エージェントは、構成と利用可能なAPIキーに基づいて、適切なプロバイダーを自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも1つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダーAPIキーを設定するか、`agents.defaults.videoGenerationModel` を構成してください。
</Note>

OpenClawは、動画生成を3つのランタイムモードとして扱います。

- `generate` - 参照メディアなしのテキストから動画へのリクエスト。
- `imageToVideo` - リクエストに1つ以上の参照画像が含まれます。
- `videoToVideo` - リクエストに1つ以上の参照動画が含まれます。

プロバイダーは、これらのモードの任意のサブセットをサポートできます。ツールは送信前にアクティブなモードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

<Steps>
  <Step title="認証を構成">
    サポートされている任意のプロバイダーのAPIキーを設定します。

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="デフォルトモデルを選択（任意）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="エージェントに依頼">
    > 夕暮れ時にサーフィンをする親しみやすいロブスターの5秒の映画的な動画を生成してください。

    エージェントは `video_generate` を自動的に呼び出します。ツールの許可リスト設定は不要です。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期です。エージェントがセッション内で `video_generate` を呼び出すと、次のように動作します。

1. OpenClawはリクエストをプロバイダーに送信し、すぐにタスクIDを返します。
2. プロバイダーはバックグラウンドでジョブを処理します（通常、プロバイダーと解像度に応じて30秒から数分です。キューを使う低速なプロバイダーでは、構成されたタイムアウトまで実行されることがあります）。
3. 動画の準備ができると、OpenClawは内部完了イベントで同じセッションを起動します。
4. エージェントはユーザーに通知し、完成した動画を添付します。メッセージツールのみの可視配信を使用するグループ/チャンネルチャットでは、OpenClawが直接投稿する代わりに、エージェントがメッセージツールを通じて結果を中継します。

ジョブが実行中の間、同じセッション内で重複した `video_generate` 呼び出しを行うと、別の生成を開始する代わりに現在のタスク状態が返されます。CLIから進捗を確認するには、`openclaw tasks list` または `openclaw tasks show <taskId>` を使用します。

セッションに紐づいたエージェント実行の外部（たとえば、直接のツール呼び出し）では、ツールはインライン生成にフォールバックし、同じターンで最終メディアパスを返します。

プロバイダーがバイトを返す場合、生成された動画ファイルはOpenClaw管理のメディアストレージに保存されます。生成動画のデフォルト保存上限は動画メディア制限に従い、`agents.defaults.mediaMaxMb` によってより大きいレンダリング用に引き上げられます。プロバイダーがホストされた出力URLも返す場合、ローカル永続化がサイズ超過ファイルを拒否しても、OpenClawはタスクを失敗させる代わりにそのURLを配信できます。

### タスクのライフサイクル

| 状態        | 意味                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `queued`    | タスクが作成され、プロバイダーによる受け入れを待っています。                                                   |
| `running`   | プロバイダーが処理中です（通常、プロバイダーと解像度に応じて30秒から数分）。                                   |
| `succeeded` | 動画の準備ができました。エージェントが起動し、会話に投稿します。                                               |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントがエラー詳細とともに起動します。                         |

CLIから状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

現在のセッションに対して動画タスクがすでに `queued` または `running` の場合、`video_generate` は新しいタスクを開始する代わりに既存のタスク状態を返します。新しい生成をトリガーせずに明示的に確認するには、`action: "status"` を使用します。

## サポートされているプロバイダー

| プロバイダー          | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照                                        | 認証                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | はい（リモートURL）                                  | はい（リモートURL）                             | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最大2枚の画像（I2Vモデルのみ。最初と最後のフレーム） | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最大2枚の画像（role経由の最初と最後のフレーム）      | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最大9枚の参照画像                                    | 最大3本の動画                                   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1枚の画像                                            | -                                               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1枚の画像。Seedance参照から動画では最大9枚           | Seedance参照から動画では最大3本の動画           | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1枚の画像                                            | 1本の動画                                       | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1枚の画像                                            | -                                               | `MINIMAX_API_KEY` またはMiniMax OAuth    |
| OpenAI                | `sora-2`                        |  ✓   | 1枚の画像                                            | 1本の動画                                       | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | 最大4枚の画像（最初/最後のフレームまたは参照）       | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | はい（リモートURL）                                  | はい（リモートURL）                             | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1枚の画像                                            | 1本の動画                                       | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1枚の画像                                            | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1枚の画像（`kling`）                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1枚の最初のフレーム画像、または最大7枚の `reference_image` | 1本の動画                                  | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替のAPIキー環境変数を受け付けます。詳細は個別の[プロバイダーページ](#related)を参照してください。

実行時に利用可能なプロバイダー、モデル、ランタイムモードを確認するには、`video_generate action=list` を実行します。

### 機能マトリックス

`video_generate`、契約テスト、共有ライブスイープで使用される明示的なモード契約は次のとおりです。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画URLが必要なため、`videoToVideo` はスキップされます                 |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | 共有スイープには含まれません。ワークフロー固有のカバレッジはComfyテスト側にあります                                                     |
| DeepInfra  |     ✓      |       -        |       -        | `generate`。ネイティブのDeepInfra動画スキーマは、バンドルされた契約ではテキストから動画です                                             |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` はSeedance参照から動画を使用する場合のみです                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のバッファベースのGemini/Veoスイープはその入力を受け付けないため、共有 `videoToVideo` はスキップされます |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。この組織/入力パスでは現在プロバイダー側のinpaint/remixアクセスが必要なため、共有 `videoToVideo` はスキップされます |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画URLが必要なため、`videoToVideo` はスキップされます                 |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は、選択されたモデルが `runway/gen4_aleph` の場合のみ実行されます                             |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`。バンドルされた `veo3` はテキスト専用で、バンドルされた `kling` はリモート画像URLを必要とするため、共有 `imageToVideo` はスキップされます |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーは現在リモートMP4 URLを必要とするため、`videoToVideo` はスキップされます                    |

## ツールパラメーター

### 必須

<ParamField path="prompt" type="string" required>
  生成する動画のテキスト説明。`action: "generate"` では必須です。
</ParamField>

### コンテンツ入力

<ParamField path="image" type="string">単一の参照画像（パスまたは URL）。</ParamField>
<ParamField path="images" type="string[]">複数の参照画像（最大 9 個）。</ParamField>
<ParamField path="imageRoles" type="string[]">
結合された画像リストと並行する、省略可能な位置ごとのロールヒント。
正規値: `first_frame`, `last_frame`, `reference_image`。
</ParamField>
<ParamField path="video" type="string">単一の参照動画（パスまたは URL）。</ParamField>
<ParamField path="videos" type="string[]">複数の参照動画（最大 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストと並行する、省略可能な位置ごとのロールヒント。
正規値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートしている場合、バックグラウンドミュージックまたは音声
参照に使用されます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数の参照音声（最大 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストと並行する、省略可能な位置ごとのロールヒント。
正規値: `reference_audio`。
</ParamField>

<Note>
ロールヒントはそのままプロバイダーに転送されます。正規値は
`VideoGenerationAssetRole` union から来ていますが、プロバイダーは追加の
ロール文字列を受け付ける場合があります。`*Roles` 配列のエントリ数は、
対応する参照リストを超えてはいけません。1 つずれたミスは明確なエラーで失敗します。
スロットを未設定のままにするには空文字列を使用します。xAI では、その
`reference_images` 生成モードを使用するため、すべての画像ロールを
`reference_image` に設定します。単一画像の image-to-video では、ロールを省略するか
`first_frame` を使用します。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`, `16:9`, `9:16`, `adaptive`、またはプロバイダー固有の値などのアスペクト比ヒント。OpenClaw は、プロバイダーごとに未サポートの値を正規化するか無視します。
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, `1080P`, `4K`、またはプロバイダー固有の値などの解像度ヒント。OpenClaw は、プロバイダーごとに未サポートの値を正規化するか無視します。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標の長さ（秒単位、最も近いプロバイダー対応値に丸められます）。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートしている場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされている場合、出力で生成音声を有効にします。`audioRef*`（入力）とは別です。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされている場合、プロバイダーのウォーターマークを切り替えます。</ParamField>

`adaptive` はプロバイダー固有のセンチネルです。機能で `adaptive` を宣言している
プロバイダーにはそのまま転送されます（例: BytePlus
Seedance は、入力画像の寸法から比率を自動検出するためにこれを使用します）。
これを宣言していないプロバイダーでは、ツール結果の
`details.ignoredOverrides` を通じて値が表示されるため、破棄が可視化されます。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返します。`"list"` はプロバイダーを検査します。
</ParamField>
<ParamField path="model" type="string">プロバイダー/モデルの上書き（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">省略可能なプロバイダー操作タイムアウト（ミリ秒単位）。</ParamField>
<ParamField path="providerOptions" type="object">
  JSON オブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言しているプロバイダーはキーと型を検証します。不明な
  キーまたは不一致がある場合、フォールバック中に候補をスキップします。宣言済みスキーマのないプロバイダーは、
  オプションをそのまま受け取ります。各プロバイダーが受け付ける内容を確認するには、
  `video_generate action=list` を実行します。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClaw は長さを
最も近いプロバイダー対応値に正規化し、フォールバックプロバイダーが異なる
制御サーフェスを公開している場合は、size-to-aspect-ratio などの変換済みジオメトリヒントを再マッピングします。
本当に未サポートの上書きはベストエフォートで無視され、
ツール結果に警告として報告されます。厳格な機能上限
（参照入力が多すぎる場合など）は送信前に失敗します。ツール結果は
適用された設定を報告します。`details.normalization` は、
要求から適用への変換をすべて記録します。
</Note>

参照入力はランタイムモードを選択します。

- 参照メディアなし → `generate`
- 画像参照がある場合 → `imageToVideo`
- 動画参照がある場合 → `videoToVideo`
- 参照音声入力は、解決されたモードを変更**しません**。画像/動画参照が選択する
  どのモードにも追加で適用され、`maxInputAudios` を宣言している
  プロバイダーでのみ機能します。

画像参照と動画参照の混在は、安定した共有機能サーフェスではありません。
リクエストごとに 1 種類の参照タイプを優先してください。

#### フォールバックと型付きオプション

一部の機能チェックはツール境界ではなくフォールバック層で適用されるため、
プライマリプロバイダーの上限を超えるリクエストでも、
対応可能なフォールバックで実行できます。

- `maxInputAudios` を宣言していない（または `0` の）アクティブ候補は、
  リクエストに音声参照が含まれる場合にスキップされます。次の候補が試行されます。
- アクティブ候補の `maxDurationSeconds` が要求された `durationSeconds` より小さく、
  `supportedDurationSeconds` リストが宣言されていない場合 → スキップされます。
- リクエストに `providerOptions` が含まれ、アクティブ候補が型付きの
  `providerOptions` スキーマを明示的に宣言している場合 → 指定されたキーが
  スキーマにない、または値の型が一致しない場合はスキップされます。宣言済みスキーマのないプロバイダーは、
  オプションをそのまま受け取ります（後方互換の
  パススルー）。プロバイダーは空のスキーマ（`capabilities.providerOptions: {}`）を
  宣言することで、すべてのプロバイダーオプションを拒否できます。これにより、
  型の不一致と同じスキップが発生します。

リクエスト内の最初のスキップ理由は `warn` でログ出力されるため、オペレーターは
プライマリプロバイダーが見送られたタイミングを確認できます。以降のスキップは `debug` でログ出力され、
長いフォールバックチェーンを静かに保ちます。すべての候補がスキップされた場合、
集約エラーには各候補のスキップ理由が含まれます。

## アクション

| アクション | 実行内容 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | デフォルト。指定されたプロンプトと省略可能な参照入力から動画を作成します。 |
| `status`   | 別の生成を開始せずに、現在のセッションで実行中の動画タスクの状態を確認します。 |
| `list`     | 利用可能なプロバイダー、モデル、およびその機能を表示します。 |

## モデル選択

OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** - エージェントが呼び出しで指定している場合。
2. config の **`videoGenerationModel.primary`**。
3. **`videoGenerationModel.fallbacks`** の順序。
4. **自動検出** - 有効な認証を持つプロバイダー。現在のデフォルトプロバイダーから開始し、
   残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗した場合、次の候補が自動的に試行されます。すべての
候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`, `primary`, `fallbacks` エントリのみを使用するには、
`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## プロバイダーの注記

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio 非同期エンドポイントを使用します。参照画像と
    動画はリモートの `http(s)` URL である必要があります。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    プロバイダー ID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、
    `seedance-1-0-pro-t2v-250528`, `seedance-1-0-pro-fast-251015`,
    `seedance-1-0-lite-t2v-250428`, `seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルおよび
    一般的な `*-pro-*` モデルは、単一の参照画像（最初の
    フレーム）をサポートします。画像を位置指定で渡すか、`role: "first_frame"` を設定します。
    画像が提供されると、T2V モデル ID は対応する I2V
    バリアントに自動的に切り替えられます。

    サポートされる `providerOptions` キー: `seed`（number）、`draft`（boolean -
    480p を強制）、`camera_fixed`（boolean）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    plugin が必要です。プロバイダー ID: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統合 `content[]` API を使用します。最大 2 つの入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモートの `https://`
    URL である必要があります。各画像に `role: "first_frame"` / `"last_frame"` を設定するか、
    画像を位置指定で渡します。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    plugin が必要です。プロバイダー ID: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`。

    統合 `content[]` API を使用します。最大 9 個の参照画像、
    3 個の参照動画、3 個の参照音声をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各アセットに `role` を設定します - サポートされる値:
    `"first_frame"`, `"last_frame"`, `"reference_image"`,
    `"reference_video"`, `"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行。設定されたグラフを通じて text-to-video と
    image-to-video をサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブにはキューに裏付けられたフローを使用します。OpenClaw はデフォルトで最大20
    分待機してから、進行中の fal キュージョブをタイムアウトとして扱います。ほとんどの fal 動画モデルは
    1つの画像参照を受け付けます。Seedance 2.0 reference-to-video
    モデルは最大9個の画像、3個の動画、3個の音声参照を受け付け、参照ファイルの合計は
    最大12個です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1つの画像または1つの動画参照をサポートします。生成音声リクエストは
    Gemini API パスでは警告付きで無視されます。その API は現在の Veo 動画生成で
    `generateAudio` パラメーターを拒否するためです。
  </Accordion>
  <Accordion title="MiniMax">
    画像参照は1つのみです。MiniMax は `768P` と `1080P`
    解像度を受け付けます。`720P` などのリクエストは送信前に最も近い
    サポート値へ正規化されます。
  </Accordion>
  <Accordion title="OpenAI">
    `size` オーバーライドのみが転送されます。その他のスタイルオーバーライド
    (`aspectRatio`, `resolution`, `audio`, `watermark`) は警告付きで
    無視されます。
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter の非同期 `/videos` API を使用します。OpenClaw は
    ジョブを送信し、`polling_url` をポーリングし、`unsigned_urls` または
    文書化されたジョブコンテンツエンドポイントのいずれかをダウンロードします。バンドルされた `google/veo-3.1-fast` デフォルトは
    4/6/8秒の長さ、`720P`/`1080P` 解像度、および
    `16:9`/`9:16` アスペクト比を提示します。
  </Accordion>
  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドです。参照入力はリモートの
    `http(s)` URL である必要があります。ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    data URI 経由でローカルファイルをサポートします。video-to-video には
    `runway/gen4_aleph` が必要です。テキストのみの実行では `16:9` と `9:16` のアスペクト
    比が公開されます。
  </Accordion>
  <Accordion title="Together">
    画像参照は1つのみです。
  </Accordion>
  <Accordion title="Vydra">
    認証が落ちるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を直接使用します。
    `veo3` は text-to-video のみとしてバンドルされています。`kling` には
    リモート画像 URL が必要です。
  </Accordion>
  <Accordion title="xAI">
    text-to-video、単一の最初のフレームによる image-to-video、xAI `reference_images` 経由の最大7つの
    `reference_image` 入力、およびリモート
    動画編集/延長フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダー機能モード

共有動画生成コントラクトは、フラットな集計上限だけでなく
モード固有の機能をサポートします。新しいプロバイダー実装では、
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

`maxInputImages` や `maxInputVideos` などのフラットな集計フィールドだけでは、
変換モードのサポートを提示するには**不十分**です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、ライブ
テスト、コントラクトテスト、共有 `video_generate` ツールがモードサポートを
決定論的に検証できるようにしてください。

プロバイダー内の1つのモデルだけが他より広い参照入力サポートを持つ場合は、
モード全体の上限を引き上げるのではなく、`maxInputImagesByModel`、`maxInputVideosByModel`、または
`maxInputAudiosByModel` を使用してください。

## ライブテスト

共有バンドルプロバイダー向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは不足しているプロバイダー環境変数を `~/.profile` から読み込み、
デフォルトで保存済み認証プロファイルより live/env API キーを優先し、
デフォルトでリリース安全なスモークを実行します。

- スイープ内のすべての非 FAL プロバイダーに対する `generate`。
- 1秒のロブスタープロンプト。
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` からのプロバイダーごとの操作上限
  (デフォルトは `180000`)。

FAL はオプトインです。プロバイダー側のキュー遅延がリリース時間を支配する可能性があるためです。

```bash
pnpm test:live:media video --video-providers fal
```

共有スイープがローカルメディアで安全に実行できる宣言済みの変換モードも実行するには、
`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`。
- `capabilities.videoToVideo.enabled` で、かつ
  プロバイダー/モデルが共有スイープ内でバッファに裏付けられたローカル動画入力を受け付ける場合は `videoToVideo`。

現在、共有 `videoToVideo` ライブレーンは、`runway/gen4_aleph` を選択した場合に限り
`runway` を対象にします。

## 設定

OpenClaw 設定でデフォルトの動画生成モデルを設定します。

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

または CLI 経由:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 関連

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
- [ツール概要](/ja-JP/tools)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)

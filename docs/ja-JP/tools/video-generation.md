---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルの設定
    - video_generate ツールのパラメーターを理解する
sidebarTitle: Video generation
summary: 16 個のプロバイダーバックエンドにわたり、テキスト、画像、または動画参照から video_generate 経由で動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-06-27T13:21:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw エージェントは、テキストプロンプト、参照画像、または
既存の動画から動画を生成できます。16 個のプロバイダーバックエンドがサポートされており、
それぞれモデルの選択肢、入力モード、機能セットが異なります。エージェントは、
設定と利用可能な API キーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも 1 つの動画生成
プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、
プロバイダー API キーを設定するか、`agents.defaults.videoGenerationModel` を設定してください。
</Note>

OpenClaw は動画生成を 3 つのランタイムモードとして扱います。

- `generate` - 参照メディアなしのテキストから動画へのリクエスト。
- `imageToVideo` - リクエストに 1 つ以上の参照画像が含まれます。
- `videoToVideo` - リクエストに 1 つ以上の参照動画が含まれます。

プロバイダーは、これらのモードの任意のサブセットをサポートできます。ツールは送信前に
アクティブなモードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

<Steps>
  <Step title="認証を設定する">
    サポートされている任意のプロバイダーの API キーを設定します。

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="デフォルトモデルを選ぶ (任意)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="エージェントに依頼する">
    > 夕暮れにサーフィンする親しみやすいロブスターの、5 秒間のシネマティックな動画を生成してください。

    エージェントは `video_generate` を自動的に呼び出します。ツールの許可リスト登録は
    必要ありません。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期です。エージェントがセッション内で `video_generate` を呼び出すと、
次のようになります。

1. OpenClaw はリクエストをプロバイダーに送信し、すぐにタスク ID を返します。
2. プロバイダーはバックグラウンドでジョブを処理します (通常はプロバイダーと解像度に応じて 30 秒から数分です。キューで処理される低速なプロバイダーでは、設定されたタイムアウトまで実行されることがあります)。
3. 動画の準備ができると、OpenClaw は内部完了イベントで同じセッションを起動します。
4. エージェントは、セッションの通常の表示返信モードを通じてユーザーに伝えます。
   自動の場合は最終返信の配信、またはセッションでメッセージツールが必要な場合は
   `message(action="send")` です。リクエスト元セッションが非アクティブであるか
   アクティブな起動に失敗し、生成された動画の一部が完了返信にまだ含まれていない場合、
   OpenClaw は不足している動画だけを含む冪等な直接フォールバックを送信します。

ジョブが実行中の間、同じセッション内の重複した `video_generate` 呼び出しは、
別の生成を開始する代わりに現在のタスクステータスを返します。CLI から進行状況を
確認するには、`openclaw tasks list` または `openclaw tasks show <taskId>` を使用します。

セッションに紐づくエージェント実行の外部 (たとえば、直接のツール呼び出し) では、
ツールはインライン生成にフォールバックし、同じターンで最終メディアパスを
返します。

プロバイダーがバイト列を返す場合、生成された動画ファイルは OpenClaw 管理のメディアストレージに
保存されます。デフォルトの生成動画の保存上限は動画メディア制限に従い、
`agents.defaults.mediaMaxMb` により大きなレンダー向けに引き上げられます。
プロバイダーがホストされた出力 URL も返す場合、ローカル永続化がサイズ超過ファイルを
拒否しても、OpenClaw はタスクを失敗させる代わりにその URL を配信できます。

### タスクのライフサイクル

| 状態        | 意味                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | タスクが作成され、プロバイダーが受け付けるのを待っています。                                           |
| `running`   | プロバイダーが処理中です (通常はプロバイダーと解像度に応じて 30 秒から数分)。                         |
| `succeeded` | 動画の準備ができました。エージェントが起動し、会話に投稿します。                                      |
| `failed`    | プロバイダーエラーまたはタイムアウトです。エージェントがエラー詳細とともに起動します。                |

CLI からステータスを確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

現在のセッションで動画タスクがすでに `queued` または `running` の場合、
`video_generate` は新しいタスクを開始する代わりに既存のタスクステータスを返します。
新しい生成をトリガーせずに明示的に確認するには、`action: "status"` を使用します。

## サポートされているプロバイダー

| プロバイダー          | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照                                        | 認証                                     |
| --------------------- | ------------------------------- | :------: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |    ✓     | はい (リモート URL)                                  | はい (リモート URL)                             | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |    ✓     | 最大 2 枚の画像 (I2V モデルのみ。最初 + 最後のフレーム) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |    ✓     | 最大 2 枚の画像 (ロール経由の最初 + 最後のフレーム)  | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |    ✓     | 最大 9 枚の参照画像                                  | 最大 3 本の動画                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |    ✓     | 1 枚の画像                                           | -                                               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |    ✓     | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |    ✓     | 1 枚の画像。Seedance reference-to-video では最大 9 枚 | Seedance reference-to-video では最大 3 本の動画 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |    ✓     | 1 枚の画像                                           | 1 本の動画                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |    ✓     | 1 枚の画像                                           | -                                               | `MINIMAX_API_KEY` または MiniMax OAuth   |
| OpenAI                | `sora-2`                        |    ✓     | 1 枚の画像                                           | 1 本の動画                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |    ✓     | 最大 4 枚の画像 (最初/最後のフレームまたは参照)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |    ✓     | はい (リモート URL)                                  | はい (リモート URL)                             | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |    ✓     | 1 枚の画像                                           | 1 本の動画                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |    ✓     | `Wan-AI/Wan2.2-I2V-A14B` のみ                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |    ✓     | 1 枚の画像 (`kling`)                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |    ✓     | 1 枚の最初フレーム画像、または最大 7 個の `reference_image` | 1 本の動画                                      | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替の API キー環境変数を受け付けます。詳細は、
個別の [プロバイダーページ](#related) を参照してください。

実行時に利用可能なプロバイダー、モデル、ランタイムモードを調べるには、
`video_generate action=list` を実行します。

### 機能マトリクス

`video_generate`、契約テスト、共有ライブスイープで使用される明示的なモード契約は次のとおりです。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップされます          |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | 共有スイープには含まれません。ワークフロー固有のカバレッジは Comfy テスト側にあります                                                   |
| DeepInfra  |     ✓      |       -        |       -        | `generate`。ネイティブの DeepInfra 動画スキーマは Plugin 契約内でテキストから動画です                                                   |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は Seedance reference-to-video を使用する場合のみです                                        |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のバッファー backed Gemini/Veo スイープはその入力を受け付けないため、共有 `videoToVideo` はスキップされます |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。この組織/入力パスは現在プロバイダー側の動画編集アクセスを必要とするため、共有 `videoToVideo` はスキップされます |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップされます          |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は選択されたモデルが `runway/gen4_aleph` の場合のみ実行されます                             |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`。バンドルされた `veo3` はテキストのみで、バンドルされた `kling` はリモート画像 URL を必要とするため、共有 `imageToVideo` はスキップされます |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーは現在リモート MP4 URL を必要とするため、`videoToVideo` はスキップされます                 |

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
正規値: `first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">単一の参照動画（パスまたは URL）。</ParamField>
<ParamField path="videos" type="string[]">複数の参照動画（最大 4 個）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストと並行する、省略可能な位置ごとのロールヒント。
正規値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートしている場合に、
背景音楽または音声参照に使用されます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数の参照音声（最大 3 個）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストと並行する、省略可能な位置ごとのロールヒント。
正規値: `reference_audio`。
</ParamField>

<Note>
ロールヒントはそのままプロバイダーへ転送されます。正規値は
`VideoGenerationAssetRole` ユニオンに由来しますが、プロバイダーは追加の
ロール文字列を受け入れる場合があります。`*Roles` 配列の項目数は、対応する
参照リストを超えてはなりません。1 つずれた誤りは明確なエラーで失敗します。
スロットを未設定のままにするには空文字列を使用します。xAI では、
`reference_images` 生成モードを使用するために、すべての画像ロールを
`reference_image` に設定します。単一画像の画像から動画への変換では、
ロールを省略するか `first_frame` を使用します。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`、`16:9`、`9:16`、`adaptive`、またはプロバイダー固有の値などのアスペクト比ヒント。OpenClaw はプロバイダーごとに、サポートされていない値を正規化するか無視します。
</ParamField>
<ParamField path="resolution" type="string">`480P`、`720P`、`768P`、`1080P`、`4K`、またはプロバイダー固有の値などの解像度ヒント。OpenClaw はプロバイダーごとに、サポートされていない値を正規化するか無視します。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標の秒単位の長さ（最も近いプロバイダー対応値へ丸められます）。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートしている場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされている場合、出力で生成音声を有効にします。`audioRef*`（入力）とは別です。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされている場合、プロバイダーのウォーターマークを切り替えます。</ParamField>

`adaptive` はプロバイダー固有のセンチネルです。機能で `adaptive` を宣言している
プロバイダーへそのまま転送されます（例: BytePlus Seedance は入力画像の
寸法から比率を自動検出するために使用します）。宣言していないプロバイダーでは、
ツール結果の `details.ignoredOverrides` にその値が表示されるため、破棄が見えるようになります。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返します。`"list"` はプロバイダーを検査します。
</ParamField>
<ParamField path="model" type="string">プロバイダー/モデルの上書き（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">省略可能なプロバイダー操作タイムアウト（ミリ秒）。省略した場合、設定されていれば OpenClaw は `agents.defaults.videoGenerationModel.timeoutMs` を使用し、それ以外の場合は存在すれば Plugin 作成のプロバイダーデフォルトを使用します。</ParamField>
<ParamField path="providerOptions" type="object">
  JSON オブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言しているプロバイダーは、キーと型を検証します。不明な
  キーや不一致があると、フォールバック中にその候補はスキップされます。宣言済み
  スキーマがないプロバイダーは、オプションをそのまま受け取ります。各プロバイダーが
  受け入れる内容を確認するには `video_generate action=list` を実行します。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClaw は
長さを最も近いプロバイダー対応値へ正規化し、フォールバックプロバイダーが異なる
制御面を公開している場合、サイズからアスペクト比への変換など、翻訳されたジオメトリ
ヒントを再マッピングします。本当にサポートされていない上書きはベストエフォートで
無視され、ツール結果に警告として報告されます。参照入力が多すぎるなどの厳格な
機能制限は送信前に失敗します。ツール結果は適用された設定を報告します。
`details.normalization` は、要求値から適用値への変換を記録します。
</Note>

参照入力はランタイムモードを選択します。

- 参照メディアなし → `generate`
- 任意の画像参照 → `imageToVideo`
- 任意の動画参照 → `videoToVideo`
- 参照音声入力は解決済みモードを変更しません。画像/動画参照が選択した
  いずれかのモードの上に適用され、`maxInputAudios` を宣言している
  プロバイダーでのみ機能します。

画像参照と動画参照の混在は、安定した共有機能面ではありません。
リクエストごとに参照タイプを 1 つにすることを推奨します。

#### フォールバックと型付きオプション

一部の機能チェックはツール境界ではなくフォールバック層で適用されるため、
プライマリプロバイダーの制限を超えるリクエストでも、対応可能なフォールバックで
実行できます。

- `maxInputAudios` を宣言していない（または `0` の）アクティブ候補は、
  リクエストに音声参照が含まれる場合にスキップされます。次の候補が試されます。
- アクティブ候補の `maxDurationSeconds` が要求された `durationSeconds` を下回り、
  `supportedDurationSeconds` リストが宣言されていない場合 → スキップされます。
- リクエストに `providerOptions` が含まれ、アクティブ候補が型付き
  `providerOptions` スキーマを明示的に宣言している場合 → 指定されたキーが
  スキーマ内にないか、値の型が一致しない場合はスキップされます。宣言済み
  スキーマがないプロバイダーは、オプションをそのまま受け取ります（後方互換の
  パススルー）。プロバイダーは空のスキーマ（`capabilities.providerOptions: {}`）
  を宣言することで、すべてのプロバイダーオプションを拒否できます。その場合、
  型不一致と同じスキップが発生します。

リクエスト内の最初のスキップ理由は `warn` でログに記録されるため、オペレーターは
プライマリプロバイダーが見送られたことを確認できます。後続のスキップは、
長いフォールバックチェーンを静かに保つため `debug` でログに記録されます。
すべての候補がスキップされた場合、集約エラーには各候補のスキップ理由が含まれます。

## アクション

| アクション | 内容                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | デフォルト。指定されたプロンプトと省略可能な参照入力から動画を作成します。                               |
| `status`   | 別の生成を開始せずに、現在のセッションで進行中の動画タスクの状態を確認します。                           |
| `list`     | 利用可能なプロバイダー、モデル、およびそれらの機能を表示します。                                         |

## モデル選択

OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** - エージェントが呼び出しで指定した場合。
2. 設定の **`videoGenerationModel.primary`**。
3. 順番どおりの **`videoGenerationModel.fallbacks`**。
4. **自動検出** - 有効な認証を持つプロバイダー。現在のデフォルトプロバイダーから開始し、
   残りのプロバイダーをアルファベット順に続けます。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての
候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、および `fallbacks` エントリだけを使用するには、
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

## プロバイダーメモ

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

    T2V モデル（`*-t2v-*`）は画像入力を受け入れません。I2V モデルと
    汎用 `*-pro-*` モデルは単一の参照画像（最初のフレーム）をサポートします。
    画像を位置で渡すか、`role: "first_frame"` を設定します。
    画像が指定されると、T2V モデル ID は対応する I2V バリアントへ自動的に切り替わります。

    サポートされる `providerOptions` キー: `seed`（数値）、`draft`（ブール値 -
    480p を強制）、`camera_fixed`（ブール値）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です。プロバイダー ID: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統一 `content[]` API を使用します。最大 2 個の入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各画像に `role: "first_frame"` /
    `"last_frame"` を設定するか、画像を位置で渡します。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）は転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です。プロバイダー ID: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    統一 `content[]` API を使用します。最大 9 個の参照画像、
    3 個の参照動画、3 個の参照音声をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各アセットに `role` を設定します -
    サポートされる値:
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`
    （数値）は転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行。設定済みのグラフを通じて text-to-video と
    image-to-video をサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブにはキューに支えられたフローを使用します。OpenClaw はデフォルトで最大 20
    分待機してから、進行中の fal キュージョブをタイムアウトとして扱います。ほとんどの fal 動画モデルは
    単一の画像参照を受け付けます。Seedance 2.0 reference-to-video
    モデルは最大 9 個の画像、3 個の動画、3 個の音声参照を受け付け、参照ファイルの合計は最大 12 個です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1 つの画像または 1 つの動画参照をサポートします。Gemini API パスでは、その API が現在の Veo 動画生成で
    `generateAudio` パラメーターを拒否するため、生成音声リクエストは警告付きで無視されます。
  </Accordion>
  <Accordion title="MiniMax">
    画像参照は 1 つのみです。MiniMax は `768P` と `1080P`
    の解像度を受け付けます。`720P` などのリクエストは、送信前に最も近いサポート済み値へ正規化されます。
  </Accordion>
  <Accordion title="OpenAI">
    `size` オーバーライドのみが転送されます。その他のスタイルオーバーライド
    (`aspectRatio`, `resolution`, `audio`, `watermark`) は警告付きで無視されます。
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter の非同期 `/videos` API を使用します。OpenClaw はジョブを送信し、
    `polling_url` をポーリングして、`unsigned_urls` または文書化されたジョブコンテンツエンドポイントのいずれかをダウンロードします。バンドルされている `google/veo-3.1-fast` のデフォルトは、
    4/6/8 秒の長さ、`720P`/`1080P` の解像度、
    `16:9`/`9:16` のアスペクト比を通知します。
  </Accordion>
  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドです。参照入力はリモートの
    `http(s)` URL である必要があります。ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    data URI 経由のローカルファイルをサポートします。Video-to-video には
    `runway/gen4_aleph` が必要です。テキストのみの実行では `16:9` と `9:16` のアスペクト比が公開されます。
  </Accordion>
  <Accordion title="Together">
    画像参照は 1 つのみです。
  </Accordion>
  <Accordion title="Vydra">
    認証が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を直接使用します。`veo3` は text-to-video のみとしてバンドルされています。`kling` には
    リモート画像 URL が必要です。
  </Accordion>
  <Accordion title="xAI">
    text-to-video、単一の first-frame image-to-video、xAI `reference_images` 経由で最大 7 個の
    `reference_image` 入力、リモート動画の編集/延長フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダー機能モード

共有の動画生成コントラクトは、フラットな集約制限だけでなく、モード固有の機能をサポートします。新しいプロバイダー実装では、明示的なモードブロックを優先するべきです。

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

`maxInputImages` や `maxInputVideos` などのフラットな集約フィールドは、
変換モードのサポートを通知するには**不十分**です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、ライブテスト、
コントラクトテスト、共有の `video_generate` ツールがモードサポートを決定論的に検証できるようにするべきです。

プロバイダー内の 1 つのモデルが他より広い参照入力サポートを持つ場合は、
モード全体の制限を引き上げるのではなく、`maxInputImagesByModel`、`maxInputVideosByModel`、または
`maxInputAudiosByModel` を使用します。

## ライブテスト

共有バンドルプロバイダー向けのオプトインのライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルはデフォルトで、保存済み認証プロファイルよりも既にエクスポートされているプロバイダー環境変数を優先して使用し、リリースで安全なスモークを実行します。

- スイープ内の FAL 以外のすべてのプロバイダーで `generate`。
- 1 秒のロブスタープロンプト。
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` からのプロバイダーごとの操作上限
  (デフォルトは `180000`)。

FAL は、プロバイダー側のキュー待ち時間がリリース時間を支配する可能性があるためオプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定すると、共有スイープがローカルメディアで安全に実行できる宣言済みの変換モードも実行します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`。
- `capabilities.videoToVideo.enabled` で、プロバイダー/モデルが共有スイープ内のバッファに支えられたローカル動画入力を受け付ける場合は `videoToVideo`。

現在、共有 `videoToVideo` ライブレーンは、`runway/gen4_aleph` を選択した場合にのみ `runway` を対象にします。

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

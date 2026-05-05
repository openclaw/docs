---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルの設定
    - video_generate ツールのパラメータを理解する
sidebarTitle: Video generation
summary: 16 のプロバイダーバックエンドで、テキスト、画像、または動画参照から video_generate により動画を生成
title: 動画生成
x-i18n:
    generated_at: "2026-05-05T01:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

OpenClaw エージェントは、テキストプロンプト、参照画像、または
既存の動画から動画を生成できます。16 個のプロバイダバックエンドがサポートされており、
それぞれモデルオプション、入力モード、機能セットが異なります。エージェントは、
構成と利用可能な API キーに基づいて適切なプロバイダを自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも 1 つの動画生成
プロバイダが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、
プロバイダの API キーを設定するか、`agents.defaults.videoGenerationModel` を構成してください。
</Note>

OpenClaw は動画生成を 3 つのランタイムモードとして扱います。

- `generate` — 参照メディアなしのテキストから動画へのリクエスト。
- `imageToVideo` — リクエストに 1 つ以上の参照画像が含まれます。
- `videoToVideo` — リクエストに 1 つ以上の参照動画が含まれます。

プロバイダは、これらのモードの任意のサブセットをサポートできます。ツールは送信前に
アクティブなモードを検証し、`action=list` でサポートされるモードを報告します。

## クイックスタート

<Steps>
  <Step title="認証を構成する">
    サポートされる任意のプロバイダの API キーを設定します。

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
    > 夕暮れにサーフィンする親しみやすいロブスターの、5 秒間の映画風動画を生成して。

    エージェントは `video_generate` を自動的に呼び出します。ツールの許可リスト登録は
    不要です。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期です。エージェントがセッション内で `video_generate` を呼び出すと、
次のように動作します。

1. OpenClaw はリクエストをプロバイダに送信し、ただちにタスク ID を返します。
2. プロバイダはバックグラウンドでジョブを処理します（通常、プロバイダと解像度に応じて 30 秒から 5 分）。
3. 動画の準備ができると、OpenClaw は内部完了イベントで同じセッションを再開します。
4. エージェントはユーザーに通知し、完成した動画を添付します。メッセージツールのみの
   可視配信を使用するグループ/チャンネルチャットでは、OpenClaw が直接投稿する代わりに、
   エージェントがメッセージツールを通じて結果を中継します。

ジョブが進行中の間、同じセッション内で重複する `video_generate` 呼び出しは、
別の生成を開始する代わりに現在のタスクステータスを返します。CLI から進捗を確認するには、
`openclaw tasks list` または `openclaw tasks show <taskId>` を使用します。

セッションに裏付けられたエージェント実行の外部（たとえば、直接のツール呼び出し）では、
ツールはインライン生成にフォールバックし、同じターンで最終メディアパスを返します。

プロバイダがバイト列を返す場合、生成された動画ファイルは OpenClaw 管理のメディアストレージに保存されます。
デフォルトの生成動画保存上限は動画メディア制限に従い、
`agents.defaults.mediaMaxMb` によって大きなレンダー向けに引き上げられます。
プロバイダがホストされた出力 URL も返す場合、ローカル永続化がサイズ超過ファイルを拒否しても、
OpenClaw はタスクを失敗させる代わりにその URL を配信できます。

### タスクのライフサイクル

| 状態        | 意味                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | タスクが作成され、プロバイダによる受け付けを待っています。                                      |
| `running`   | プロバイダが処理中です（通常、プロバイダと解像度に応じて 30 秒から 5 分）。                     |
| `succeeded` | 動画の準備ができました。エージェントが再開し、会話に投稿します。                                |
| `failed`    | プロバイダエラーまたはタイムアウトです。エージェントがエラー詳細とともに再開します。            |

CLI からステータスを確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

現在のセッションに対して動画タスクがすでに `queued` または `running` の場合、
`video_generate` は新しいタスクを開始する代わりに既存のタスクステータスを返します。
新しい生成をトリガーせず明示的に確認するには、`action: "status"` を使用します。

## サポートされるプロバイダ

| プロバイダ            | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照                                        | 認証                                     |
| --------------------- | ------------------------------- | :------: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |    ✓     | はい（リモート URL）                                 | はい（リモート URL）                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |    ✓     | 最大 2 画像（I2V モデルのみ、最初 + 最後のフレーム） | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |    ✓     | 最大 2 画像（role 経由の最初 + 最後のフレーム）      | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |    ✓     | 最大 9 枚の参照画像                                  | 最大 3 本の動画                                 | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |    ✓     | 1 画像                                               | —                                               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |    ✓     | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |    ✓     | 1 画像、Seedance reference-to-video では最大 9 画像  | Seedance reference-to-video では最大 3 本の動画 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |    ✓     | 1 画像                                               | 1 動画                                          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |    ✓     | 1 画像                                               | —                                               | `MINIMAX_API_KEY` または MiniMax OAuth   |
| OpenAI                | `sora-2`                        |    ✓     | 1 画像                                               | 1 動画                                          | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |    ✓     | 最大 4 画像（最初/最後のフレームまたは参照）         | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |    ✓     | はい（リモート URL）                                 | はい（リモート URL）                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |    ✓     | 1 画像                                               | 1 動画                                          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |    ✓     | 1 画像                                               | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |    ✓     | 1 画像（`kling`）                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |    ✓     | 1 枚の最初フレーム画像、または最大 7 枚の `reference_image` | 1 動画                                  | `XAI_API_KEY`                            |

一部のプロバイダは、追加または代替の API キー環境変数を受け付けます。詳細は
各 [プロバイダページ](#related) を参照してください。

実行時に利用可能なプロバイダ、モデル、ランタイムモードを調べるには、
`video_generate action=list` を実行します。

### 機能マトリクス

`video_generate`、コントラクトテスト、共有ライブスイープで使用される明示的なモード契約:

| プロバイダ | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップされます             |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | 共有スイープには含まれません。workflow 固有のカバレッジは Comfy テスト側にあります                                                      |
| DeepInfra  |     ✓      |       —        |       —        | `generate`。ネイティブ DeepInfra 動画スキーマは、バンドルされたコントラクトではテキストから動画です                                    |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は Seedance reference-to-video 使用時のみ                                                     |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のバッファベース Gemini/Veo スイープがその入力を受け付けないため、共有 `videoToVideo` はスキップされます |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。この組織/入力パスは現在プロバイダ側の inpaint/remix アクセスを必要とするため、共有 `videoToVideo` はスキップされます |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップされます             |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo` は選択されたモデルが `runway/gen4_aleph` の場合にのみ実行されます                            |
| Together   |     ✓      |       ✓        |       —        | `generate`、`imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`。バンドルされた `veo3` はテキストのみで、バンドルされた `kling` はリモート画像 URL を必要とするため、共有 `imageToVideo` はスキップされます |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダは現在リモート MP4 URL を必要とするため、`videoToVideo` はスキップされます                    |

## ツールパラメータ

### 必須

<ParamField path="prompt" type="string" required>
  生成する動画のテキスト説明。`action: "generate"` では必須です。
</ParamField>

### コンテンツ入力

<ParamField path="image" type="string">単一の参照画像（パスまたは URL）。</ParamField>
<ParamField path="images" type="string[]">複数の参照画像（最大 9 件）。</ParamField>
<ParamField path="imageRoles" type="string[]">
結合された画像リストと並行する、任意の位置別ロールヒント。
正規値: `first_frame`, `last_frame`, `reference_image`。
</ParamField>
<ParamField path="video" type="string">単一の参照動画（パスまたは URL）。</ParamField>
<ParamField path="videos" type="string[]">複数の参照動画（最大 4 件）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストと並行する、任意の位置別ロールヒント。
正規値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートしている場合に、
背景音楽または音声参照に使用されます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数の参照音声（最大 3 件）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストと並行する、任意の位置別ロールヒント。
正規値: `reference_audio`。
</ParamField>

<Note>
ロールヒントはそのままプロバイダーへ転送されます。正規値は
`VideoGenerationAssetRole` union に由来しますが、プロバイダーは追加の
ロール文字列を受け付ける場合があります。`*Roles` 配列のエントリー数は、
対応する参照リストを超えてはいけません。1 件ずれの誤りは明確なエラーで失敗します。
スロットを未設定のままにするには空文字列を使用します。xAI では、
`reference_images` 生成モードを使用するために、すべての画像ロールを
`reference_image` に設定します。単一画像の image-to-video には、
ロールを省略するか `first_frame` を使用します。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, または `adaptive`。
</ParamField>
<ParamField path="resolution" type="string">`480P`, `720P`, `768P`, または `1080P`。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標継続時間（秒）。プロバイダーがサポートする最も近い値に丸められます。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートする場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされる場合、出力で生成音声を有効にします。`audioRef*`（入力）とは別です。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされる場合、プロバイダーのウォーターマークを切り替えます。</ParamField>

`adaptive` はプロバイダー固有のセンチネルです。機能で `adaptive` を宣言している
プロバイダーへそのまま転送されます（例: BytePlus Seedance は入力画像の
寸法から比率を自動検出するために使用します）。宣言していないプロバイダーでは、
破棄が見えるようにツール結果の `details.ignoredOverrides` で値が提示されます。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` は現在のセッションタスクを返します。`"list"` はプロバイダーを検査します。
</ParamField>
<ParamField path="model" type="string">プロバイダー/モデルの上書き（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名のヒント。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。</ParamField>
<ParamField path="providerOptions" type="object">
  JSON オブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言しているプロバイダーは、キーと型を検証します。不明な
  キーや不一致がある場合、フォールバック中に候補がスキップされます。宣言済み
  スキーマがないプロバイダーは、オプションをそのまま受け取ります。各プロバイダーが
  受け付ける内容を確認するには `video_generate action=list` を実行します。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。
OpenClaw は継続時間をプロバイダーがサポートする最も近い値に正規化し、
フォールバックプロバイダーが異なる制御面を公開している場合は、
size-to-aspect-ratio などの変換されたジオメトリヒントを再マップします。
本当にサポートされていない上書きはベストエフォートで無視され、
ツール結果に警告として報告されます。参照入力が多すぎるなどの
厳密な機能上限は、送信前に失敗します。ツール結果は適用された設定を報告します。
`details.normalization` には、要求値から適用値への変換が記録されます。
</Note>

参照入力はランタイムモードを選択します。

- 参照メディアなし → `generate`
- 画像参照あり → `imageToVideo`
- 動画参照あり → `videoToVideo`
- 参照音声入力は、解決されるモードを変更**しません**。画像/動画参照が選択した
  モードの上に適用され、`maxInputAudios` を宣言しているプロバイダーでのみ
  動作します。

画像参照と動画参照の混在は、安定した共有機能面ではありません。
リクエストごとに 1 種類の参照タイプを優先してください。

#### フォールバックと型付きオプション

一部の機能チェックはツール境界ではなくフォールバック層で適用されるため、
プライマリプロバイダーの上限を超えるリクエストでも、対応可能なフォールバックで
実行できます。

- リクエストに音声参照が含まれている場合、`maxInputAudios` を宣言していない（または `0` の）
  アクティブ候補はスキップされ、次の候補が試行されます。
- アクティブ候補の `maxDurationSeconds` が要求された `durationSeconds` を下回り、
  `supportedDurationSeconds` リストが宣言されていない場合 → スキップされます。
- リクエストに `providerOptions` が含まれ、アクティブ候補が型付き
  `providerOptions` スキーマを明示的に宣言している場合 → 指定されたキーが
  スキーマ内にない、または値の型が一致しない場合はスキップされます。宣言済み
  スキーマがないプロバイダーは、オプションをそのまま受け取ります（後方互換の
  パススルー）。プロバイダーは空スキーマ（`capabilities.providerOptions: {}`）を
  宣言することで、すべてのプロバイダーオプションを拒否できます。この場合、
  型不一致と同じスキップが発生します。

リクエスト内の最初のスキップ理由は `warn` でログに記録されるため、
オペレーターはプライマリプロバイダーが見送られたことを確認できます。
以降のスキップは、長いフォールバックチェーンを静かに保つため `debug` で
ログに記録されます。すべての候補がスキップされた場合、集約エラーには
それぞれのスキップ理由が含まれます。

## アクション

| アクション | 内容                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | デフォルト。指定されたプロンプトと任意の参照入力から動画を作成します。                                  |
| `status`   | 別の生成を開始せずに、現在のセッションで実行中の動画タスクの状態を確認します。                          |
| `list`     | 利用可能なプロバイダー、モデル、およびそれらの機能を表示します。                                        |

## モデル選択

OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** — エージェントが呼び出しで指定した場合。
2. config の **`videoGenerationModel.primary`**。
3. **`videoGenerationModel.fallbacks`** を順番に。
4. **自動検出** — 有効な認証を持つプロバイダー。現在のデフォルトプロバイダーから開始し、
   残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗した場合、次の候補が自動的に試行されます。すべての
候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な `model`、`primary`、`fallbacks` エントリーのみを使用するには、
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
    DashScope / Model Studio の非同期エンドポイントを使用します。参照画像と
    動画はリモートの `http(s)` URL である必要があります。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    プロバイダー ID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと
    一般的な `*-pro-*` モデルは単一の参照画像（最初のフレーム）をサポートします。
    画像を位置指定で渡すか、`role: "first_frame"` を設定します。
    画像が指定されると、T2V モデル ID は対応する I2V バリアントへ自動的に切り替わります。

    サポートされる `providerOptions` キー: `seed`（number）、`draft`（boolean —
    480p を強制）、`camera_fixed`（boolean）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です。プロバイダー ID: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統合 `content[]` API を使用します。最大 2 つの入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各画像に `role: "first_frame"` /
    `"last_frame"` を設定するか、画像を位置指定で渡します。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマップされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Plugin が必要です。プロバイダー ID: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    統合 `content[]` API を使用します。最大 9 つの参照画像、
    3 つの参照動画、3 つの参照音声をサポートします。すべての入力はリモートの
    `https://` URL である必要があります。各アセットに `role` を設定します —
    サポート値: `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。
    `audio: true` は `generate_audio` にマップされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行です。設定されたグラフを通じて
    text-to-video と image-to-video をサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブにキュー支援フローを使用します。ほとんどの fal 動画モデルは
    単一の画像参照を受け付けます。Seedance 2.0 reference-to-video モデルは、
    最大 9 つの画像、3 つの動画、3 つの音声参照を受け付け、参照ファイルの合計は
    最大 12 件です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1 つの画像参照または 1 つの動画参照をサポートします。
  </Accordion>
  <Accordion title="MiniMax">
    単一画像参照のみ。
  </Accordion>
  <Accordion title="OpenAI">
    `size` 上書きのみが転送されます。その他のスタイル上書き
    （`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで
    無視されます。
  </Accordion>
  <Accordion title="OpenRouter">
    OpenRouter の非同期 `/videos` API を使用します。OpenClaw は
    ジョブを送信し、`polling_url` をポーリングし、`unsigned_urls` または
    文書化されたジョブコンテンツエンドポイントのいずれかをダウンロードします。
    同梱の `google/veo-3.1-fast` デフォルトは、4/6/8 秒の継続時間、
    `720P`/`1080P` 解像度、`16:9`/`9:16` アスペクト比を告知します。
  </Accordion>
  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドです。参照入力はリモートの
    `http(s)` URL である必要があります。ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    data URI 経由でローカルファイルをサポートします。video-to-video には
    `runway/gen4_aleph` が必要です。テキストのみの実行では `16:9` と `9:16` の
    アスペクト比が公開されます。
  </Accordion>
  <Accordion title="Together">
    単一画像参照のみ。
  </Accordion>
  <Accordion title="Vydra">
    認証が落ちるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を直接使用します。
    `veo3` は text-to-video のみとして同梱されています。`kling` には
    リモート画像 URL が必要です。
  </Accordion>
  <Accordion title="xAI">
    text-to-video、単一の最初のフレーム image-to-video、xAI `reference_images` 経由の
    最大 7 つの `reference_image` 入力、リモート動画の編集/延長フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダー機能モード

共有動画生成コントラクトは、フラットな集約制限だけではなく、
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

`maxInputImages` や `maxInputVideos` などのフラットな集約フィールドだけでは、
変換モードのサポートを示すには**不十分**です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、ライブテスト、
コントラクトテスト、共有 `video_generate` ツールがモードサポートを
決定論的に検証できるようにしてください。

プロバイダー内のあるモデルだけが、他のモデルより広い参照入力サポートを
持つ場合は、モード全体の制限を引き上げるのではなく、
`maxInputImagesByModel`、`maxInputVideosByModel`、または
`maxInputAudiosByModel` を使用してください。

## ライブテスト

共有バンドルプロバイダーのライブカバレッジにオプトインします。

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは、不足しているプロバイダー環境変数を `~/.profile` から読み込み、
デフォルトで保存済み認証プロファイルよりライブ/環境 APIキーを優先し、
デフォルトでリリースに安全なスモークを実行します。

- スイープ内のすべての非FALプロバイダーに対する `generate`。
- 1秒のロブスタープロンプト。
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` からのプロバイダーごとの操作上限
  （デフォルトは `180000`）。

FAL はプロバイダー側のキュー待ち時間がリリース時間を支配する可能性があるため、
オプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定すると、共有スイープが
ローカルメディアで安全に実行できる宣言済み変換モードも実行します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`。
- `capabilities.videoToVideo.enabled` で、プロバイダー/モデルが共有スイープ内の
  バッファに基づくローカル動画入力を受け付ける場合は `videoToVideo`。

現在、共有 `videoToVideo` ライブレーンは、`runway/gen4_aleph` を選択した場合にのみ
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
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 非同期動画生成のタスク追跡
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

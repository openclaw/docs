---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルを設定する
    - '`video_generate` ツールのパラメーターを理解する'
summary: 14 個のプロバイダーバックエンドを使用して、テキスト、画像、または既存の動画から動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-04-15T04:44:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: c182f24b25e44f157a820e82a1f7422247f26125956944b5eb98613774268cfe
    source_path: tools/video-generation.md
    workflow: 15
---

# 動画生成

OpenClaw エージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。14 個のプロバイダーバックエンドがサポートされており、それぞれでモデルオプション、入力モード、機能セットが異なります。エージェントは、設定内容と利用可能な API キーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも 1 つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツール内に表示されない場合は、プロバイダーの API キーを設定するか、`agents.defaults.videoGenerationModel` を構成してください。
</Note>

OpenClaw は動画生成を 3 つのランタイムモードとして扱います。

- 参照メディアなしのテキストから動画へのリクエストには `generate`
- リクエストに 1 つ以上の参照画像が含まれる場合は `imageToVideo`
- リクエストに 1 つ以上の参照動画が含まれる場合は `videoToVideo`

プロバイダーは、これらのモードの任意の部分集合をサポートできます。ツールは送信前にアクティブな
モードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

1. サポートされている任意のプロバイダーの API キーを設定します。

```bash
export GEMINI_API_KEY="your-key"
```

2. 必要に応じてデフォルトモデルを固定します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. エージェントに依頼します。

> 夕焼けの中、親しみやすいロブスターがサーフィンしている 5 秒間のシネマティックな動画を生成してください。

エージェントは `video_generate` を自動的に呼び出します。ツールの allowlist 設定は不要です。

## 動画を生成すると何が起こるか

動画生成は非同期です。セッション内でエージェントが `video_generate` を呼び出すと、次のように動作します。

1. OpenClaw はリクエストをプロバイダーに送信し、すぐにタスク ID を返します。
2. プロバイダーはバックグラウンドでジョブを処理します（通常は、プロバイダーと解像度に応じて 30 秒から 5 分）。
3. 動画の準備ができると、OpenClaw は内部完了イベントで同じセッションを再開します。
4. エージェントは完成した動画を元の会話に投稿します。

ジョブの進行中、同じセッション内での重複した `video_generate` 呼び出しは、新しい生成を開始する代わりに現在のタスク状態を返します。CLI から進行状況を確認するには、`openclaw tasks list` または `openclaw tasks show <taskId>` を使用してください。

セッションに裏付けられたエージェント実行の外側（たとえば、ツールを直接呼び出す場合）では、ツールはインライン生成にフォールバックし、同じターン内で最終的なメディアパスを返します。

### タスクライフサイクル

各 `video_generate` リクエストは、4 つの状態を経由します。

1. **queued** -- タスクが作成され、プロバイダーが受け付けるのを待機中。
2. **running** -- プロバイダーが処理中（通常は、プロバイダーと解像度に応じて 30 秒から 5 分）。
3. **succeeded** -- 動画の準備完了。エージェントが再開し、会話に投稿。
4. **failed** -- プロバイダーエラーまたはタイムアウト。エージェントがエラー詳細付きで再開。

CLI から状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在のセッションですでに動画タスクが `queued` または `running` の場合、`video_generate` は新しいタスクを開始する代わりに既存タスクの状態を返します。新しい生成をトリガーせずに明示的に確認したい場合は、`action: "status"` を使用してください。

## サポートされているプロバイダー

| プロバイダー            | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照         | API キー                                 |
| ----------------------- | ------------------------------- | -------- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba                 | `wan2.6-t2v`                    | Yes      | Yes（リモート URL）                                  | Yes（リモート URL） | `MODELSTUDIO_API_KEY`                 |
| BytePlus (1.0)          | `seedance-1-0-pro-250528`       | Yes      | 最大 2 枚の画像（I2V モデルのみ。先頭 + 最終フレーム） | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5   | `seedance-1-5-pro-251215`       | Yes      | 最大 2 枚の画像（role 経由の先頭 + 最終フレーム）     | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0   | `dreamina-seedance-2-0-260128`  | Yes      | 最大 9 枚の参照画像                                  | 最大 3 本の動画  | `BYTEPLUS_API_KEY`                       |
| ComfyUI                 | `workflow`                      | Yes      | 画像 1 枚                                            | No               | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| fal                     | `fal-ai/minimax/video-01-live`  | Yes      | 画像 1 枚                                            | No               | `FAL_KEY`                                |
| Google                  | `veo-3.1-fast-generate-preview` | Yes      | 画像 1 枚                                            | 動画 1 本        | `GEMINI_API_KEY`                         |
| MiniMax                 | `MiniMax-Hailuo-2.3`            | Yes      | 画像 1 枚                                            | No               | `MINIMAX_API_KEY`                        |
| OpenAI                  | `sora-2`                        | Yes      | 画像 1 枚                                            | 動画 1 本        | `OPENAI_API_KEY`                         |
| Qwen                    | `wan2.6-t2v`                    | Yes      | Yes（リモート URL）                                  | Yes（リモート URL） | `QWEN_API_KEY`                        |
| Runway                  | `gen4.5`                        | Yes      | 画像 1 枚                                            | 動画 1 本        | `RUNWAYML_API_SECRET`                    |
| Together                | `Wan-AI/Wan2.2-T2V-A14B`        | Yes      | 画像 1 枚                                            | No               | `TOGETHER_API_KEY`                       |
| Vydra                   | `veo3`                          | Yes      | 画像 1 枚（`kling`）                                 | No               | `VYDRA_API_KEY`                          |
| xAI                     | `grok-imagine-video`            | Yes      | 画像 1 枚                                            | 動画 1 本        | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替の API キー env var を受け付けます。詳細は個別の[プロバイダーページ](#related)を参照してください。

ランタイム時に利用可能なプロバイダー、モデル、ランタイムモードを確認するには、
`video_generate action=list` を実行してください。

### 宣言された機能マトリクス

これは、`video_generate`、契約テスト、
および共有ライブスイープで使用される明示的なモード契約です。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                    |
| ------------ | ---------- | -------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップ                     |
| BytePlus     | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                                |
| ComfyUI      | Yes        | Yes            | No             | 共有スイープには含まれない。workflow 固有のカバレッジは Comfy テスト側にある                                                            |
| fal          | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                                |
| Google       | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 現在のバッファベースの Gemini/Veo スイープはその入力を受け付けないため、共有 `videoToVideo` はスキップ       |
| MiniMax      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                                |
| OpenAI       | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; この org/input 経路では現在プロバイダー側の inpaint/remix アクセスが必要なため、共有 `videoToVideo` はスキップ |
| Qwen         | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーはリモート `http(s)` 動画 URL を必要とするため、`videoToVideo` はスキップ                     |
| Runway       | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo` は選択されたモデルが `runway/gen4_aleph` の場合にのみ実行                                      |
| Together     | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                                |
| Vydra        | Yes        | Yes            | No             | `generate`; バンドルされた `veo3` はテキスト専用で、バンドルされた `kling` はリモート画像 URL を必要とするため、共有 `imageToVideo` はスキップ |
| xAI          | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーは現在リモート MP4 URL を必要とするため、`videoToVideo` はスキップ                            |

## ツールパラメーター

### 必須

| パラメーター | 型     | 説明                                                                       |
| ------------ | ------ | -------------------------------------------------------------------------- |
| `prompt`     | string | 生成する動画のテキスト説明（`action: "generate"` では必須）                |

### コンテンツ入力

| パラメーター | 型       | 説明                                                                                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `image`      | string   | 単一の参照画像（パスまたは URL）                                                                                                     |
| `images`     | string[] | 複数の参照画像（最大 9 枚）                                                                                                          |
| `imageRoles` | string[] | 結合された画像リストと位置対応する任意の role ヒント。正準値: `first_frame`、`last_frame`、`reference_image`                        |
| `video`      | string   | 単一の参照動画（パスまたは URL）                                                                                                     |
| `videos`     | string[] | 複数の参照動画（最大 4 本）                                                                                                          |
| `videoRoles` | string[] | 結合された動画リストと位置対応する任意の role ヒント。正準値: `reference_video`                                                      |
| `audioRef`   | string   | 単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートする場合、たとえば BGM や音声参照に使用                         |
| `audioRefs`  | string[] | 複数の参照音声（最大 3 個）                                                                                                          |
| `audioRoles` | string[] | 結合された音声リストと位置対応する任意の role ヒント。正準値: `reference_audio`                                                      |

role ヒントはそのままプロバイダーに転送されます。正準値は
`VideoGenerationAssetRole` union に由来しますが、プロバイダーによっては
追加の role 文字列を受け付ける場合があります。`*Roles` 配列のエントリー数は、
対応する参照リストを超えてはいけません。1 つずれた指定は明確なエラーで失敗します。
スロットを未設定のままにするには空文字列を使用してください。

### スタイル制御

| パラメーター      | 型      | 説明                                                                                  |
| ----------------- | ------- | ------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、または `adaptive` |
| `resolution`      | string  | `480P`、`720P`、`768P`、または `1080P`                                                |
| `durationSeconds` | number  | 目標の秒数（最も近いプロバイダー対応値に丸められる）                                  |
| `size`            | string  | プロバイダーがサポートしている場合のサイズヒント                                      |
| `audio`           | boolean | サポートされている場合、出力に生成音声を含める。`audioRef*`（入力）とは別物           |
| `watermark`       | boolean | サポートされている場合、プロバイダーのウォーターマーク付与を切り替える                |

`adaptive` はプロバイダー固有のセンチネルです。これは、その機能に `adaptive` を宣言している
プロバイダーにそのまま転送されます（例: BytePlus
Seedance はこれを使って入力画像の
寸法から比率を自動検出します）。これを宣言していないプロバイダーでは、
値はツール結果の `details.ignoredOverrides` を通じて表示されるため、
無視されたことが分かります。

### 高度な設定

| パラメーター      | 型     | 説明                                                                                                                                                                                                                                                                                                                                                 |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"`（デフォルト）、`"status"`、または `"list"`                                                                                                                                                                                                                                                                                              |
| `model`           | string | プロバイダー/モデルのオーバーライド（例: `runway/gen4.5`）                                                                                                                                                                                                                                                                                           |
| `filename`        | string | 出力ファイル名のヒント                                                                                                                                                                                                                                                                                                                                |
| `providerOptions` | object | JSON オブジェクトとして渡すプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。型付きスキーマを宣言しているプロバイダーでは、キーと型が検証されます。不明なキーや型の不一致があると、フォールバック中にその候補はスキップされます。宣言済みスキーマのないプロバイダーには、そのままオプションが渡されます。各プロバイダーが受け付ける内容は `video_generate action=list` を実行して確認してください |

すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClaw はすでに duration を最も近いプロバイダー対応値に正規化しており、フォールバック先プロバイダーが異なる制御サーフェスを公開している場合は、size-to-aspect-ratio のような変換済みジオメトリヒントも再マッピングします。本当に未対応のオーバーライドはベストエフォートで無視され、ツール結果では警告として報告されます。厳格な機能制限（参照入力が多すぎる、など）は送信前に失敗します。

ツール結果には適用された設定が報告されます。OpenClaw がプロバイダーフォールバック中に duration または geometry を再マッピングした場合、返される `durationSeconds`、`size`、`aspectRatio`、および `resolution` の値は送信された内容を反映し、`details.normalization` には要求値から適用値への変換が記録されます。

参照入力はランタイムモードの選択にも使われます。

- 参照メディアなし: `generate`
- 画像参照がある: `imageToVideo`
- 動画参照がある: `videoToVideo`
- 参照音声入力は解決されるモードを変更しません。画像/動画参照で選択されたモードに上乗せで適用され、`maxInputAudios` を宣言しているプロバイダーでのみ機能します

画像参照と動画参照の混在は、安定した共有機能サーフェスではありません。
1 リクエストにつき 1 種類の参照タイプを推奨します。

#### フォールバックと型付きオプション

一部の機能チェックは、ツール境界ではなくフォールバック層で適用されます。これにより、
プライマリプロバイダーの制限を超えるリクエストでも、
対応可能なフォールバック先で実行できる場合があります。

- アクティブな候補が `maxInputAudios` を宣言していない（または
  `0` として宣言している）場合、リクエストに音声参照が含まれているとその候補はスキップされ、
  次の候補が試されます。
- アクティブな候補の `maxDurationSeconds` が要求された
  `durationSeconds` を下回っており、かつその候補が
  `supportedDurationSeconds` リストを宣言していない場合、その候補はスキップされます。
- リクエストに `providerOptions` が含まれており、アクティブな候補が
  型付き `providerOptions` スキーマを明示的に宣言している場合、
  指定されたキーがスキーマに存在しない、または値の型が一致しないと、
  その候補はスキップされます。まだスキーマを宣言していないプロバイダーには、
  オプションがそのまま渡されます（後方互換のパススルー）。
  プロバイダーは空スキーマ
  （`capabilities.providerOptions: {}`）を宣言することで、すべての provider option を
  明示的に拒否できます。この場合も型不一致と同様にスキップされます。

リクエスト内で最初のスキップ理由は `warn` でログ出力されるため、オペレーターは
プライマリプロバイダーが見送られたことを確認できます。後続のスキップは
長いフォールバックチェーンを静かに保つため `debug` でログ出力されます。すべての候補がスキップされた場合、
集約エラーには各候補のスキップ理由が含まれます。

## アクション

- **generate**（デフォルト） -- 指定されたプロンプトと任意の参照入力から動画を作成します。
- **status** -- 現在のセッションで進行中の動画タスクの状態を確認します。新しい生成は開始しません。
- **list** -- 利用可能なプロバイダー、モデル、およびその機能を表示します。

## モデル選択

動画生成時、OpenClaw は次の順序でモデルを解決します。

1. **`model` ツールパラメーター** -- 呼び出し時にエージェントが指定した場合。
2. **`videoGenerationModel.primary`** -- config から。
3. **`videoGenerationModel.fallbacks`** -- 順番に試行。
4. **自動検出** -- 有効な認証を持つプロバイダーを使用し、現在のデフォルトプロバイダーから始めて、その後は残りのプロバイダーをアルファベット順で試します。

あるプロバイダーが失敗した場合、自動的に次の候補が試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

動画生成で明示的な `model`、`primary`、`fallbacks`
エントリーのみを使用したい場合は、
`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。

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

| プロバイダー            | メモ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba                 | DashScope/Model Studio の非同期エンドポイントを使用します。参照画像と参照動画は、リモートの `http(s)` URL でなければなりません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| BytePlus (1.0)          | プロバイダー ID は `byteplus` です。モデル: `seedance-1-0-pro-250528`（デフォルト）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと一般的な `*-pro-*` モデルは、単一の参照画像（先頭フレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"` を設定してください。T2V モデル ID は、画像が提供された場合に対応する I2V バリアントへ自動的に切り替えられます。サポートされる `providerOptions` キー: `seed`（number）、`draft`（boolean、480p を強制）、`camera_fixed`（boolean）。 |
| BytePlus Seedance 1.5   | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。プロバイダー ID は `byteplus-seedance15` です。モデル: `seedance-1-5-pro-251215`。統一された `content[]` API を使用します。入力画像は最大 2 枚までサポートします（first_frame + last_frame）。すべての入力はリモートの `https://` URL でなければなりません。各画像に `role: "first_frame"` / `"last_frame"` を設定するか、画像を位置指定で渡してください。`aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`（number）はそのまま転送されます。                                                                                           |
| BytePlus Seedance 2.0   | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。プロバイダー ID は `byteplus-seedance2` です。モデル: `dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。統一された `content[]` API を使用します。最大 9 枚の参照画像、3 本の参照動画、および 3 個の参照音声をサポートします。すべての入力はリモートの `https://` URL でなければなりません。各アセットに `role` を設定してください — サポートされる値: `"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。`aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマッピングされます。`providerOptions.seed`（number）はそのまま転送されます。 |
| ComfyUI                 | workflow 駆動のローカルまたはクラウド実行です。構成済みグラフを通じて text-to-video と image-to-video をサポートします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| fal                     | 長時間実行ジョブ向けにキュー支援フローを使用します。参照画像は 1 枚のみです。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Google                  | Gemini/Veo を使用します。画像 1 枚または動画 1 本の参照をサポートします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| MiniMax                 | 参照画像は 1 枚のみです。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| OpenAI                  | `size` オーバーライドのみが転送されます。その他のスタイルオーバーライド（`aspectRatio`、`resolution`、`audio`、`watermark`）は、警告付きで無視されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Qwen                    | Alibaba と同じ DashScope バックエンドです。参照入力はリモートの `http(s)` URL でなければならず、ローカルファイルは事前に拒否されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Runway                  | data URI を介してローカルファイルをサポートします。video-to-video には `runway/gen4_aleph` が必要です。テキストのみの実行では、`16:9` と `9:16` の aspect ratio が公開されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Together                | 参照画像は 1 枚のみです。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Vydra                   | 認証が落ちるリダイレクトを避けるため、`https://www.vydra.ai/api/v1` を直接使用します。`veo3` は text-to-video 専用としてバンドルされており、`kling` にはリモート画像 URL が必要です。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| xAI                     | text-to-video、image-to-video、およびリモート動画の編集/拡張フローをサポートします。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## プロバイダー機能モード

共有の動画生成契約では現在、プロバイダーは
単なるフラットな集約制限だけでなく、モード固有の機能を宣言できます。新しいプロバイダー
実装では、明示的なモードブロックを推奨します。

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

`maxInputImages` や `maxInputVideos` のようなフラットな集約フィールドだけでは、
変換モード対応を示すには不十分です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、ライブテスト、
契約テスト、および共有 `video_generate` ツールがモード対応を
決定的に検証できるようにする必要があります。

## ライブテスト

共有バンドルプロバイダー向けのオプトイン型ライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは、不足しているプロバイダー env var を `~/.profile` から読み込み、
デフォルトで保存済み認証プロファイルよりも live/env API キーを優先し、
デフォルトでリリース安全なスモークを実行します。

- スイープ内のすべての非 FAL プロバイダーに対する `generate`
- 1 秒のロブスタープロンプト
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`
  （デフォルト `180000`）によるプロバイダーごとの操作上限

FAL は、プロバイダー側のキュー遅延がリリース時間を支配する可能性があるため、オプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

共有スイープがローカルメディアで安全に実行できる宣言済み変換
モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定します。

- `capabilities.imageToVideo.enabled` の場合は `imageToVideo`
- `capabilities.videoToVideo.enabled` であり、かつプロバイダー/モデルが
  共有スイープでバッファ支援のローカル動画入力を受け付ける場合は `videoToVideo`

現在、共有 `videoToVideo` ライブレーンは次をカバーします。

- `runway`（`runway/gen4_aleph` を選択した場合のみ）

## 設定

OpenClaw config でデフォルトの動画生成モデルを設定します。

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

- [ツール概要](/ja-JP/tools)
- [バックグラウンドタスク](/ja-JP/automation/tasks) -- 非同期動画生成のタスク追跡
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [BytePlus](/ja-JP/concepts/model-providers#byteplus-international)
- [ComfyUI](/ja-JP/providers/comfy)
- [fal](/ja-JP/providers/fal)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [OpenAI](/ja-JP/providers/openai)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [Together AI](/ja-JP/providers/together)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [設定リファレンス](/ja-JP/gateway/configuration-reference#agent-defaults)
- [モデル](/ja-JP/concepts/models)

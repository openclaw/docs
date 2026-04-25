---
read_when:
    - エージェント経由で動画を生成すること
    - 動画生成プロバイダーとモデルを設定すること
    - '`video_generate` ツールのパラメータを理解すること'
summary: 14 のプロバイダーバックエンドを使って、テキスト、画像、既存の動画から動画を生成する
title: 動画生成
x-i18n:
    generated_at: "2026-04-25T18:22:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f04c9ac25a0ad08036266ab0c61a6ddf41ad944f64aa273ba31e09fc5774ac74
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClaw エージェントは、テキストプロンプト、参照画像、既存の動画から動画を生成できます。14 のプロバイダーバックエンドがサポートされており、それぞれモデルオプション、入力モード、機能セットが異なります。エージェントは、設定と利用可能な API キーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate` ツールは、少なくとも 1 つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダー API キーを設定するか、`agents.defaults.videoGenerationModel` を設定してください。
</Note>

OpenClaw は動画生成を 3 つのランタイムモードとして扱います:

- 参照メディアなしのテキストから動画へのリクエスト向けの `generate`
- 1 つ以上の参照画像をリクエストに含む場合の `imageToVideo`
- 1 つ以上の参照動画をリクエストに含む場合の `videoToVideo`

プロバイダーは、これらのモードの任意の部分集合をサポートできます。ツールは送信前にアクティブな
モードを検証し、`action=list` でサポートされているモードを報告します。

## クイックスタート

1. サポートされている任意のプロバイダーの API キーを設定します:

```bash
export GEMINI_API_KEY="your-key"
```

2. 任意でデフォルトモデルを固定します:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. エージェントに依頼します:

> 夕暮れの中、フレンドリーなロブスターがサーフィンする 5 秒のシネマティックな動画を生成して。

エージェントは自動的に `video_generate` を呼び出します。ツールの allowlist 設定は不要です。

## 動画を生成すると何が起きるか

動画生成は非同期です。エージェントが session 内で `video_generate` を呼び出すと:

1. OpenClaw はリクエストをプロバイダーに送信し、すぐに task ID を返します。
2. プロバイダーはバックグラウンドでジョブを処理します（通常はプロバイダーと解像度に応じて 30 秒から 5 分）。
3. 動画の準備ができると、OpenClaw は内部完了イベントで同じ session を再開します。
4. エージェントは、完了した動画を元の会話に投稿します。

ジョブ実行中は、同じ session 内で重複する `video_generate` 呼び出しを行うと、新しい生成を開始する代わりに現在の task 状態が返されます。CLI から進行状況を確認するには `openclaw tasks list` または `openclaw tasks show <taskId>` を使ってください。

session バックのエージェント実行の外部（たとえば直接のツール呼び出し）では、ツールはインライン生成にフォールバックし、同じターンで最終メディアパスを返します。

生成された動画ファイルは、プロバイダーがバイト列を返した場合、
OpenClaw 管理のメディアストレージに保存されます。デフォルトの生成動画保存上限は
動画メディア制限に従い、`agents.defaults.mediaMaxMb` でより大きなレンダリングに対応できます。
プロバイダーがホストされた出力 URL も返す場合、ローカル永続化が大きすぎるファイルを拒否しても、
OpenClaw は task を失敗させる代わりにその URL を配信できます。

### task ライフサイクル

各 `video_generate` リクエストは 4 つの状態を遷移します:

1. **queued** -- task が作成され、プロバイダーに受け付けられるのを待っている状態。
2. **running** -- プロバイダーが処理中の状態（通常はプロバイダーと解像度に応じて 30 秒から 5 分）。
3. **succeeded** -- 動画の準備完了。エージェントが再開し、会話に投稿します。
4. **failed** -- プロバイダーエラーまたはタイムアウト。エージェントがエラー詳細付きで再開します。

CLI から状態を確認します:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在の session に対して動画 task がすでに `queued` または `running` の場合、`video_generate` は新しい task を開始する代わりに既存の task 状態を返します。新しい生成を起動せずに明示的に確認するには `action: "status"` を使ってください。

## サポートされているプロバイダー

| Provider | デフォルトモデル | テキスト | 画像参照 | 動画参照 | API キー |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba | `wan2.6-t2v` | Yes | Yes（リモート URL） | Yes（リモート URL） | `MODELSTUDIO_API_KEY` |
| BytePlus (1.0) | `seedance-1-0-pro-250528` | Yes | 最大 2 枚の画像（I2V モデルのみ。最初と最後のフレーム） | No | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215` | Yes | 最大 2 枚の画像（role による最初と最後のフレーム） | No | `BYTEPLUS_API_KEY` |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128` | Yes | 最大 9 枚の参照画像 | 最大 3 本の動画 | `BYTEPLUS_API_KEY` |
| ComfyUI | `workflow` | Yes | 1 枚の画像 | No | `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| fal | `fal-ai/minimax/video-01-live` | Yes | 1 枚の画像 | No | `FAL_KEY` |
| Google | `veo-3.1-fast-generate-preview` | Yes | 1 枚の画像 | 1 本の動画 | `GEMINI_API_KEY` |
| MiniMax | `MiniMax-Hailuo-2.3` | Yes | 1 枚の画像 | No | `MINIMAX_API_KEY` |
| OpenAI | `sora-2` | Yes | 1 枚の画像 | 1 本の動画 | `OPENAI_API_KEY` |
| Qwen | `wan2.6-t2v` | Yes | Yes（リモート URL） | Yes（リモート URL） | `QWEN_API_KEY` |
| Runway | `gen4.5` | Yes | 1 枚の画像 | 1 本の動画 | `RUNWAYML_API_SECRET` |
| Together | `Wan-AI/Wan2.2-T2V-A14B` | Yes | 1 枚の画像 | No | `TOGETHER_API_KEY` |
| Vydra | `veo3` | Yes | 1 枚の画像（`kling`） | No | `VYDRA_API_KEY` |
| xAI | `grok-imagine-video` | Yes | 1 枚の first-frame 画像または最大 7 枚の `reference_image` | 1 本の動画 | `XAI_API_KEY` |

一部のプロバイダーは追加または代替の API キー環境変数を受け付けます。詳細は個別の[プロバイダーページ](#related)を参照してください。

ランタイム時に利用可能なプロバイダー、モデル、ランタイムモードを確認するには
`video_generate action=list` を実行してください。

### 宣言された機能マトリクス

これは `video_generate`、契約テスト、
および共有ライブスイープで使われる明示的なモード契約です。

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba | Yes | Yes | Yes | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画 URL を必要とするため `videoToVideo` はスキップ |
| BytePlus | Yes | Yes | No | `generate`、`imageToVideo` |
| ComfyUI | Yes | Yes | No | 共有スイープには含まれません。workflow 固有のカバレッジは Comfy テスト側にあります |
| fal | Yes | Yes | No | `generate`、`imageToVideo` |
| Google | Yes | Yes | Yes | `generate`、`imageToVideo`。現在のバッファバック Gemini/Veo スイープではその入力を受け付けないため、共有 `videoToVideo` はスキップ |
| MiniMax | Yes | Yes | No | `generate`、`imageToVideo` |
| OpenAI | Yes | Yes | Yes | `generate`、`imageToVideo`。この org/input パスでは現在プロバイダー側の inpaint/remix アクセスが必要なため、共有 `videoToVideo` はスキップ |
| Qwen | Yes | Yes | Yes | `generate`、`imageToVideo`。このプロバイダーはリモート `http(s)` 動画 URL を必要とするため `videoToVideo` はスキップ |
| Runway | Yes | Yes | Yes | `generate`、`imageToVideo`。`videoToVideo` は選択モデルが `runway/gen4_aleph` の場合にのみ実行 |
| Together | Yes | Yes | No | `generate`、`imageToVideo` |
| Vydra | Yes | Yes | No | `generate`。同梱の `veo3` はテキスト専用で、同梱の `kling` はリモート画像 URL を必要とするため、共有 `imageToVideo` はスキップ |
| xAI | Yes | Yes | Yes | `generate`、`imageToVideo`。このプロバイダーは現在リモート MP4 URL を必要とするため、`videoToVideo` はスキップ |

## ツールパラメータ

### 必須

| Parameter | Type | 説明 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt` | string | 生成する動画のテキスト説明（`action: "generate"` では必須） |

### コンテンツ入力

| Parameter | Type | 説明 |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image` | string | 単一の参照画像（パスまたは URL） |
| `images` | string[] | 複数の参照画像（最大 9 枚） |
| `imageRoles` | string[] | 結合後の画像リストに並行する、位置ごとの任意の role ヒント。正規の値: `first_frame`、`last_frame`、`reference_image` |
| `video` | string | 単一の参照動画（パスまたは URL） |
| `videos` | string[] | 複数の参照動画（最大 4 本） |
| `videoRoles` | string[] | 結合後の動画リストに並行する、位置ごとの任意の role ヒント。正規の値: `reference_video` |
| `audioRef` | string | 単一の参照音声（パスまたは URL）。プロバイダーが音声入力をサポートする場合、たとえば BGM や voice 参照に使われます |
| `audioRefs` | string[] | 複数の参照音声（最大 3 件） |
| `audioRoles` | string[] | 結合後の音声リストに並行する、位置ごとの任意の role ヒント。正規の値: `reference_audio` |

role ヒントはそのままプロバイダーに転送されます。正規の値は
`VideoGenerationAssetRole` union から来ていますが、プロバイダーによっては追加の
role 文字列を受け付ける場合があります。`*Roles` 配列は、対応する
参照リストより多くのエントリを持ってはいけません。1 つずれた誤りは明確なエラーで失敗します。
スロットを未設定のままにするには空文字列を使ってください。xAI では、
その `reference_images` 生成モードを使うために、すべての画像 role を
`reference_image` に設定します。単一画像の image-to-video では、role を省略するか
`first_frame` を使ってください。

### スタイル制御

| Parameter | Type | 説明 |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio` | string | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、または `adaptive` |
| `resolution` | string | `480P`、`720P`、`768P`、または `1080P` |
| `durationSeconds` | number | 目標の長さ（秒）。最も近いプロバイダー対応値に丸められます |
| `size` | string | プロバイダーがサポートしている場合のサイズヒント |
| `audio` | boolean | サポートされている場合、出力で生成音声を有効化します。`audioRef*`（入力）とは別です |
| `watermark` | boolean | サポートされている場合、プロバイダーのウォーターマークを切り替えます |

`adaptive` はプロバイダー固有のセンチネルです。これは、
機能として `adaptive` を宣言しているプロバイダー（たとえば BytePlus
Seedance は入力画像の
寸法から比率を自動検出するためにこれを使います）に、そのまま転送されます。
これを宣言していないプロバイダーでは、この値は
ツール結果の `details.ignoredOverrides` を通じて表面化し、無視されたことが分かるようになっています。

### 高度な設定

| Parameter | Type | 説明 |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action` | string | `"generate"`（デフォルト）、`"status"`、または `"list"` |
| `model` | string | プロバイダー/モデルのオーバーライド（例: `runway/gen4.5`） |
| `filename` | string | 出力ファイル名のヒント |
| `timeoutMs` | number | 任意のプロバイダーリクエストタイムアウト（ミリ秒） |
| `providerOptions` | object | JSON オブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。型付きスキーマを宣言しているプロバイダーではキーと型が検証され、未知のキーや不一致があると、その候補は fallback 中にスキップされます。宣言済みスキーマのないプロバイダーには、オプションがそのまま渡されます。各プロバイダーが何を受け付けるかを見るには `video_generate action=list` を実行してください |

すべてのプロバイダーがすべてのパラメータをサポートするわけではありません。OpenClaw はすでに長さを最も近いプロバイダー対応値に正規化し、fallback プロバイダーが異なる制御サーフェスを公開している場合には、size-to-aspect-ratio のような変換済みジオメトリヒントも再マップします。本当にサポートされていないオーバーライドはベストエフォートで無視され、ツール結果に警告として報告されます。ハードな機能制限（参照入力が多すぎるなど）は送信前に失敗します。

ツール結果は適用された設定を報告します。OpenClaw がプロバイダー fallback 中に長さやジオメトリを再マップした場合、返される `durationSeconds`、`size`、`aspectRatio`、`resolution` の値は実際に送信された内容を反映し、`details.normalization` には要求値から適用値への変換が記録されます。

参照入力はランタイムモードも選択します:

- 参照メディアなし: `generate`
- 任意の画像参照あり: `imageToVideo`
- 任意の動画参照あり: `videoToVideo`
- 参照音声入力は解決されるモードを変更しません。画像/動画参照が選択したモードに上乗せで適用され、`maxInputAudios` を宣言しているプロバイダーでのみ動作します

画像参照と動画参照の混在は、安定した共有機能サーフェスではありません。
1 リクエストにつき 1 種類の参照を使うことを推奨します。

#### fallback と型付きオプション

一部の機能チェックは、ツール境界ではなく fallback レイヤーで適用されます。
これにより、プライマリプロバイダーの制限を超えるリクエストでも、
対応可能な fallback で実行できます:

- アクティブな候補が `maxInputAudios` を宣言していない（または
  `0` として宣言している）場合、リクエストに音声参照が含まれていればその候補はスキップされ、
  次の候補が試されます。
- アクティブな候補の `maxDurationSeconds` が要求された
  `durationSeconds` より小さく、かつ候補が
  `supportedDurationSeconds` リストを宣言していない場合、その候補はスキップされます。
- リクエストに `providerOptions` が含まれ、アクティブな候補が
  型付き `providerOptions` スキーマを明示的に宣言している場合、
  指定されたキーがスキーマにない、または値の型が
  一致しないときは候補がスキップされます。まだスキーマを宣言していないプロバイダーは、
  オプションをそのまま受け取ります（後方互換のパススルー）。プロバイダーは、
  空スキーマ
  （`capabilities.providerOptions: {}`）を宣言することで、すべての provider option を明示的に拒否できます。この場合も
  型不一致と同様にスキップされます。

リクエスト内の最初のスキップ理由は `warn` で記録されるため、
オペレーターはプライマリプロバイダーがなぜ飛ばされたかを確認できます。以降のスキップは
長い fallback チェーンを静かに保つため `debug` で記録されます。すべての候補がスキップされた場合、
集約エラーには各候補のスキップ理由が含まれます。

## アクション

- **generate**（デフォルト） -- 指定したプロンプトと任意の参照入力から動画を作成します。
- **status** -- 新しい生成を開始せずに、現在の session に対する進行中の動画 task の状態を確認します。
- **list** -- 利用可能なプロバイダー、モデル、およびそれらの機能を表示します。

## モデル選択

動画生成時、OpenClaw は次の順序でモデルを解決します:

1. **`model` ツールパラメータ** -- agent が呼び出しで指定した場合。
2. **`videoGenerationModel.primary`** -- 設定から。
3. **`videoGenerationModel.fallbacks`** -- 順に試行。
4. **自動検出** -- 有効な認証を持つプロバイダーを使います。現在のデフォルトプロバイダーから開始し、その後、残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

動画生成で明示的な `model`、`primary`、`fallbacks`
エントリだけを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。

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

## プロバイダー注記

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studio の非同期エンドポイントを使います。参照画像と動画はリモート `http(s)` URL である必要があります。
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    provider id: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V モデル（`*-t2v-*`）は画像入力を受け付けません。I2V モデルと一般的な `*-pro-*` モデルは、単一の参照画像（最初のフレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"` を設定してください。T2V model ID は、画像が提供されると対応する I2V バリアントに自動的に切り替えられます。

    サポートされる `providerOptions` キー: `seed`（number）、`draft`（boolean — 480p を強制）、`camera_fixed`（boolean）。

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。provider id: `byteplus-seedance15`。モデル: `seedance-1-5-pro-251215`。

    統一 `content[]` API を使います。入力画像は最大 2 枚（`first_frame` + `last_frame`）までサポートします。すべての入力はリモート `https://` URL である必要があります。各画像に `role: "first_frame"` / `"last_frame"` を設定するか、画像を位置指定で渡してください。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマップされます。`providerOptions.seed`（number）は転送されます。

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin が必要です。provider id: `byteplus-seedance2`。モデル: `dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。

    統一 `content[]` API を使います。最大 9 枚の参照画像、3 本の参照動画、3 件の参照音声をサポートします。すべての入力はリモート `https://` URL である必要があります。各アセットに `role` を設定してください。サポートされる値: `"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` は入力画像から比率を自動検出します。`audio: true` は `generate_audio` にマップされます。`providerOptions.seed`（number）は転送されます。

  </Accordion>

  <Accordion title="ComfyUI">
    workflow 駆動のローカルまたはクラウド実行です。設定済みグラフを通じて text-to-video と image-to-video をサポートします。
  </Accordion>

  <Accordion title="fal">
    長時間実行ジョブにはキューバックのフローを使います。参照画像は 1 枚のみです。
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    1 枚の画像または 1 本の動画参照をサポートします。
  </Accordion>

  <Accordion title="MiniMax">
    参照画像は 1 枚のみです。
  </Accordion>

  <Accordion title="OpenAI">
    転送されるのは `size` オーバーライドのみです。その他のスタイルオーバーライド（`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで無視されます。
  </Accordion>

  <Accordion title="Qwen">
    Alibaba と同じ DashScope バックエンドを使います。参照入力はリモート `http(s)` URL である必要があり、ローカルファイルは事前に拒否されます。
  </Accordion>

  <Accordion title="Runway">
    data URI を介してローカルファイルをサポートします。video-to-video には `runway/gen4_aleph` が必要です。テキストのみの実行では `16:9` と `9:16` のアスペクト比を公開します。
  </Accordion>

  <Accordion title="Together">
    参照画像は 1 枚のみです。
  </Accordion>

  <Accordion title="Vydra">
    認証を失うリダイレクトを避けるために、`https://www.vydra.ai/api/v1` を直接使います。`veo3` は text-to-video 専用として同梱され、`kling` にはリモート画像 URL が必要です。
  </Accordion>

  <Accordion title="xAI">
    text-to-video、単一の first-frame 画像による image-to-video、xAI `reference_images` を通じた最大 7 件の `reference_image` 入力、およびリモート動画の編集/拡張フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダー機能モード

共有動画生成契約では現在、プロバイダーがフラットな集約制限だけでなく、
モードごとの機能を宣言できるようになっています。新しいプロバイダー
実装では、明示的なモードブロックを優先してください:

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
変換モードのサポートを告知するには不十分です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo` を明示的に宣言し、ライブテスト、
契約テスト、共有 `video_generate` ツールがモードサポートを
決定的に検証できるようにするべきです。

## ライブテスト

共有同梱プロバイダー向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは、欠けているプロバイダー環境変数を `~/.profile` から読み込み、
デフォルトでは保存済み auth profile よりライブ/env API キーを優先し、
デフォルトでリリース安全なスモークを実行します:

- スイープ内のすべての非 FAL プロバイダーに対する `generate`
- 1 秒のロブスタープロンプト
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` によるプロバイダーごとの操作上限
  （デフォルトは `180000`）

FAL は、プロバイダー側のキュー遅延がリリース時間を支配する可能性があるためオプトインです:

```bash
pnpm test:live:media video --video-providers fal
```

`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` を設定すると、共有スイープがローカルメディアで安全に実行できる、
宣言済みの変換モードも実行します:

- `capabilities.imageToVideo.enabled` の場合の `imageToVideo`
- `capabilities.videoToVideo.enabled` かつ、そのプロバイダー/モデルが
  共有スイープでバッファバックのローカル動画入力を受け付ける場合の `videoToVideo`

現在、共有 `videoToVideo` ライブレーンがカバーしているのは次のみです:

- `runway`（`runway/gen4_aleph` を選択した場合のみ）

## 設定

OpenClaw 設定でデフォルトの動画生成モデルを設定します:

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
- [バックグラウンドタスク](/ja-JP/automation/tasks) -- 非同期動画生成の task 追跡
- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [BytePlus](/ja-JP/concepts/model-providers#byteplus-international)
- [ComfyUI](/ja-JP/providers/comfy)
- [fal](/ja-JP/providers/fal)
- [Google（Gemini）](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [OpenAI](/ja-JP/providers/openai)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [Together AI](/ja-JP/providers/together)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults)
- [モデル](/ja-JP/concepts/models)

---
read_when:
    - エージェントを介した動画生成
    - 動画生成プロバイダーとモデルの設定
    - '`video_generate`ツールのパラメーターを理解する'
summary: 14のプロバイダーバックエンドを使用して、テキスト、画像、または既存の動画から動画を生成します
title: 動画生成
x-i18n:
    generated_at: "2026-04-11T15:16:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec159a0bbb6b8a030e68828c0a8bcaf40c8538ecf98bc8ff609dab9d0068263
    source_path: tools/video-generation.md
    workflow: 15
---

# 動画生成

OpenClawエージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。14のプロバイダーバックエンドがサポートされており、それぞれ異なるモデルオプション、入力モード、機能セットを備えています。エージェントは、設定と利用可能なAPIキーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate`ツールは、少なくとも1つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダーのAPIキーを設定するか、`agents.defaults.videoGenerationModel`を設定してください。
</Note>

OpenClawは、動画生成を次の3つのランタイムモードとして扱います。

- 参照メディアのないテキストから動画へのリクエスト用の`generate`
- リクエストに1つ以上の参照画像が含まれる場合の`imageToVideo`
- リクエストに1つ以上の参照動画が含まれる場合の`videoToVideo`

プロバイダーは、これらのモードの任意のサブセットをサポートできます。このツールは送信前にアクティブなモードを検証し、`action=list`でサポートされているモードを報告します。

## クイックスタート

1. サポートされている任意のプロバイダーにAPIキーを設定します。

```bash
export GEMINI_API_KEY="your-key"
```

2. 必要に応じてデフォルトモデルを固定します。

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. エージェントに依頼します。

> 夕焼けの中でフレンドリーなロブスターがサーフィンをしている、5秒間のシネマティックな動画を生成してください。

エージェントは自動的に`video_generate`を呼び出します。ツールの許可リスト設定は不要です。

## 動画を生成すると何が起こるか

動画生成は非同期です。エージェントがセッション内で`video_generate`を呼び出すと、次のようになります。

1. OpenClawがリクエストをプロバイダーに送信し、すぐにタスクIDを返します。
2. プロバイダーがバックグラウンドでジョブを処理します（通常はプロバイダーと解像度に応じて30秒から5分）。
3. 動画の準備ができると、OpenClawは内部完了イベントで同じセッションを再開します。
4. エージェントが完成した動画を元の会話に投稿します。

ジョブが進行中の間、同じセッション内で重複する`video_generate`呼び出しは、別の生成を開始する代わりに現在のタスクステータスを返します。CLIから進行状況を確認するには、`openclaw tasks list`または`openclaw tasks show <taskId>`を使用します。

セッションに裏付けられていないエージェント実行の外部（たとえば、ツールの直接呼び出し）では、このツールはインライン生成にフォールバックし、同じターン内で最終メディアパスを返します。

### タスクのライフサイクル

各`video_generate`リクエストは、4つの状態を移動します。

1. **queued** -- タスクが作成され、プロバイダーが受け付けるのを待っています。
2. **running** -- プロバイダーが処理中です（通常はプロバイダーと解像度に応じて30秒から5分）。
3. **succeeded** -- 動画の準備が完了し、エージェントが再開して会話に投稿します。
4. **failed** -- プロバイダーエラーまたはタイムアウトが発生し、エージェントがエラー詳細とともに再開します。

CLIからステータスを確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在のセッションですでに動画タスクが`queued`または`running`である場合、`video_generate`は新しいタスクを開始する代わりに既存のタスクステータスを返します。新しい生成をトリガーせずに明示的に確認するには、`action: "status"`を使用してください。

## サポートされているプロバイダー

| プロバイダー | デフォルトモデル | テキスト | 画像参照 | 動画参照 | APIキー |
| --------------------- | ------------------------------- | ---- | ---------------------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Yes  | Up to 2 images (I2V models only; first + last frame) | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Yes  | Up to 2 images (first + last frame via role)         | No               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Yes  | Up to 9 reference images                             | Up to 3 videos   | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      | Yes  | 1 image                                              | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  | Yes  | 1 image                                              | No               | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` | Yes  | 1 image                                              | 1 video          | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Yes  | 1 image                                              | No               | `MINIMAX_API_KEY`                        |
| OpenAI                | `sora-2`                        | Yes  | 1 image                                              | 1 video          | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    | Yes  | Yes (remote URL)                                     | Yes (remote URL) | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        | Yes  | 1 image                                              | 1 video          | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Yes  | 1 image                                              | No               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          | Yes  | 1 image (`kling`)                                    | No               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            | Yes  | 1 image                                              | 1 video          | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または代替のAPIキー環境変数を受け付けます。詳細は個別の[プロバイダーページ](#related)を参照してください。

実行時に利用可能なプロバイダー、モデル、ランタイムモードを確認するには、`video_generate action=list`を実行します。

### 宣言された機能マトリクス

これは、`video_generate`、コントラクトテスト、および共有ライブスイープで使用される明示的なモードコントラクトです。

| プロバイダー | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`は、このプロバイダーがリモート`http(s)`動画URLを必要とするためスキップされます |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| ComfyUI  | Yes        | Yes            | No             | 共有スイープには含まれていません。ワークフロー固有のカバレッジはComfyテストにあります |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 現在のバッファ対応Gemini/Veoスイープがその入力を受け付けないため、共有`videoToVideo`はスキップされます |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; この組織/入力パスでは現在プロバイダー側のインペイント/リミックスアクセスが必要なため、共有`videoToVideo`はスキップされます |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`は、このプロバイダーがリモート`http(s)`動画URLを必要とするためスキップされます |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`は、選択されたモデルが`runway/gen4_aleph`の場合にのみ実行されます |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo` |
| Vydra    | Yes        | Yes            | No             | `generate`; バンドルされた`veo3`はテキスト専用で、バンドルされた`kling`はリモート画像URLを必要とするため、共有`imageToVideo`はスキップされます |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーは現在リモートMP4 URLを必要とするため、`videoToVideo`はスキップされます |

## ツールパラメーター

### 必須

| パラメーター | 型 | 説明 |
| --------- | ------ | ----------------------------------------------------------------------------- |
| `prompt`  | string | 生成する動画のテキスト説明（`action: "generate"`に必須） |

### コンテンツ入力

| パラメーター | 型 | 説明 |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | 単一の参照画像（パスまたはURL） |
| `images`     | string[] | 複数の参照画像（最大9枚） |
| `imageRoles` | string[] | 結合された画像リストと並行する、位置ごとの任意のロールヒント。標準値: `first_frame`、`last_frame`、`reference_image` |
| `video`      | string   | 単一の参照動画（パスまたはURL） |
| `videos`     | string[] | 複数の参照動画（最大4本） |
| `videoRoles` | string[] | 結合された動画リストと並行する、位置ごとの任意のロールヒント。標準値: `reference_video` |
| `audioRef`   | string   | 単一の参照音声（パスまたはURL）。プロバイダーが音声入力をサポートしている場合、たとえばBGMや音声参照に使用されます |
| `audioRefs`  | string[] | 複数の参照音声（最大3件） |
| `audioRoles` | string[] | 結合された音声リストと並行する、位置ごとの任意のロールヒント。標準値: `reference_audio` |

ロールヒントはそのままプロバイダーに転送されます。標準値は`VideoGenerationAssetRole`ユニオンに由来しますが、プロバイダーは追加のロール文字列を受け付ける場合があります。`*Roles`配列のエントリー数は、対応する参照リストを超えてはいけません。1つずれた指定は明確なエラーで失敗します。スロットを未設定のままにするには空文字列を使用してください。

### スタイル制御

| パラメーター | 型 | 説明 |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、または`adaptive` |
| `resolution`      | string  | `480P`、`720P`、`768P`、または`1080P` |
| `durationSeconds` | number  | 目標の長さ（秒）。最も近いプロバイダー対応値に丸められます |
| `size`            | string  | プロバイダーがサポートしている場合のサイズヒント |
| `audio`           | boolean | サポートされている場合、出力で生成音声を有効にします。`audioRef*`（入力）とは別です |
| `watermark`       | boolean | サポートされている場合、プロバイダーのウォーターマーク付与を切り替えます |

`adaptive`はプロバイダー固有のセンチネル値です。機能として`adaptive`を宣言しているプロバイダーにはそのまま転送されます（たとえば、BytePlus Seedanceはこれを使用して入力画像の寸法から比率を自動検出します）。これを宣言していないプロバイダーでは、その値はツール結果の`details.ignoredOverrides`を通じて示されるため、無視されたことが分かります。

### 高度な設定

| パラメーター | 型 | 説明 |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"`（デフォルト）、`"status"`、または`"list"` |
| `model`           | string | プロバイダー/モデルのオーバーライド（例: `runway/gen4.5`） |
| `filename`        | string | 出力ファイル名のヒント |
| `providerOptions` | object | JSONオブジェクトとして指定するプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。型付きスキーマを宣言しているプロバイダーでは、キーと型が検証されます。不明なキーや不一致がある場合、その候補はフォールバック時にスキップされます。宣言済みスキーマのないプロバイダーには、オプションがそのまま渡されます。各プロバイダーが受け付ける内容を確認するには、`video_generate action=list`を実行してください |

すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClawは、すでに長さを最も近いプロバイダー対応値に正規化しており、フォールバック先のプロバイダーが異なる制御面を公開している場合には、sizeからaspect ratioへの変換のような、翻訳済みのジオメトリヒントも再マッピングします。本当にサポートされていないオーバーライドは、ベストエフォートで無視され、ツール結果に警告として報告されます。厳密な機能制限（参照入力が多すぎる場合など）は、送信前に失敗します。

ツール結果には適用された設定が報告されます。OpenClawがプロバイダーフォールバック中に長さやジオメトリを再マッピングした場合、返される`durationSeconds`、`size`、`aspectRatio`、`resolution`の値は実際に送信された内容を反映し、`details.normalization`には要求値から適用値への変換が記録されます。

参照入力によってランタイムモードも選択されます。

- 参照メディアなし: `generate`
- 画像参照がある場合: `imageToVideo`
- 動画参照がある場合: `videoToVideo`
- 参照音声入力は解決されたモードを変更しません。画像/動画参照によって選択されたモードに追加で適用され、`maxInputAudios`を宣言しているプロバイダーでのみ動作します

画像参照と動画参照の混在は、安定した共有機能面ではありません。
1つのリクエストにつき、1種類の参照タイプを使うことを推奨します。

#### フォールバックと型付きオプション

一部の機能チェックは、ツール境界ではなくフォールバック層で適用されます。これにより、プライマリプロバイダーの制限を超えるリクエストでも、対応可能なフォールバック先で実行できます。

- アクティブな候補が`maxInputAudios`を宣言していない（または`0`として宣言している）場合、リクエストに音声参照が含まれているとその候補はスキップされ、次の候補が試されます。
- アクティブな候補の`maxDurationSeconds`が要求された`durationSeconds`より小さく、かつその候補が`supportedDurationSeconds`リストを宣言していない場合、その候補はスキップされます。
- リクエストに`providerOptions`が含まれており、アクティブな候補が型付きの`providerOptions`スキーマを明示的に宣言している場合、指定されたキーがスキーマに存在しない、または値の型が一致しないと、その候補はスキップされます。まだスキーマを宣言していないプロバイダーは、オプションをそのまま受け取ります（後方互換性のあるパススルー）。プロバイダーは空のスキーマ（`capabilities.providerOptions: {}`）を宣言することで、すべてのプロバイダーオプションを明示的に拒否できます。この場合も、型不一致と同様にスキップされます。

リクエスト内の最初のスキップ理由は`warn`で記録されるため、オペレーターはプライマリプロバイダーが見送られたことを把握できます。以降のスキップは、長いフォールバックチェーンを静かに保つために`debug`で記録されます。すべての候補がスキップされた場合、集約されたエラーには各候補のスキップ理由が含まれます。

## アクション

- **generate**（デフォルト） -- 指定されたプロンプトと任意の参照入力から動画を作成します。
- **status** -- 現在のセッションで進行中の動画タスクの状態を確認します。別の生成は開始しません。
- **list** -- 利用可能なプロバイダー、モデル、およびそれらの機能を表示します。

## モデル選択

動画を生成するとき、OpenClawは次の順序でモデルを解決します。

1. **`model`ツールパラメーター** -- エージェントが呼び出しで指定した場合。
2. **`videoGenerationModel.primary`** -- configから。
3. **`videoGenerationModel.fallbacks`** -- 順に試行されます。
4. **自動検出** -- 有効な認証情報を持つプロバイダーを使用します。現在のデフォルトプロバイダーから開始し、その後は残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

動画生成で明示的な`model`、`primary`、`fallbacks`エントリーのみを使用したい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false`を設定してください。

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

## プロバイダーに関する注意事項

| プロバイダー | 注意事項 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba               | DashScope/Model Studioの非同期エンドポイントを使用します。参照画像と参照動画は、リモートの`http(s)` URLである必要があります。 |
| BytePlus (1.0)        | プロバイダーIDは`byteplus`です。モデル: `seedance-1-0-pro-250528`（デフォルト）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。T2Vモデル（`*-t2v-*`）は画像入力を受け付けません。I2Vモデルと一般的な`*-pro-*`モデルは、単一の参照画像（先頭フレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"`を設定してください。画像が提供されると、T2VモデルIDは自動的に対応するI2Vバリアントに切り替えられます。サポートされる`providerOptions`キー: `seed`（number）、`draft`（boolean、480pを強制）、`camera_fixed`（boolean）。 |
| BytePlus Seedance 1.5 | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)プラグインが必要です。プロバイダーIDは`byteplus-seedance15`です。モデル: `seedance-1-5-pro-251215`。統一された`content[]` APIを使用します。入力画像は最大2枚（first_frame + last_frame）までサポートします。すべての入力はリモートの`https://` URLである必要があります。各画像に`role: "first_frame"` / `"last_frame"`を設定するか、画像を位置指定で渡してください。`aspectRatio: "adaptive"`は入力画像から比率を自動検出します。`audio: true`は`generate_audio`にマッピングされます。`providerOptions.seed`（number）はそのまま転送されます。 |
| BytePlus Seedance 2.0 | [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)プラグインが必要です。プロバイダーIDは`byteplus-seedance2`です。モデル: `dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。統一された`content[]` APIを使用します。最大9枚の参照画像、3本の参照動画、3件の参照音声をサポートします。すべての入力はリモートの`https://` URLである必要があります。各アセットに`role`を設定してください。サポートされる値: `"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。`aspectRatio: "adaptive"`は入力画像から比率を自動検出します。`audio: true`は`generate_audio`にマッピングされます。`providerOptions.seed`（number）はそのまま転送されます。 |
| ComfyUI               | ワークフロー駆動のローカルまたはクラウド実行です。設定されたグラフを通じてテキストから動画、および画像から動画をサポートします。 |
| fal                   | 長時間実行ジョブにはキューバック型フローを使用します。参照画像は1枚のみです。 |
| Google                | Gemini/Veoを使用します。1枚の画像参照または1本の動画参照をサポートします。 |
| MiniMax               | 参照画像は1枚のみです。 |
| OpenAI                | `size`オーバーライドのみが転送されます。他のスタイルオーバーライド（`aspectRatio`、`resolution`、`audio`、`watermark`）は警告付きで無視されます。 |
| Qwen                  | Alibabaと同じDashScopeバックエンドです。参照入力はリモートの`http(s)` URLである必要があり、ローカルファイルは事前に拒否されます。 |
| Runway                | data URIを介してローカルファイルをサポートします。video-to-videoには`runway/gen4_aleph`が必要です。テキストのみの実行では、`16:9`と`9:16`のアスペクト比が利用できます。 |
| Together              | 参照画像は1枚のみです。 |
| Vydra                 | 認証情報が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1`を直接使用します。`veo3`はtext-to-video専用としてバンドルされており、`kling`にはリモート画像URLが必要です。 |
| xAI                   | text-to-video、image-to-video、およびリモート動画の編集/延長フローをサポートします。 |

## プロバイダー機能モード

共有の動画生成コントラクトでは、プロバイダーが単なるフラットな集約制限ではなく、モード固有の機能を宣言できるようになりました。新しいプロバイダー実装では、明示的なモードブロックを推奨します。

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

`maxInputImages`や`maxInputVideos`のようなフラットな集約フィールドだけでは、変換モードのサポートを告知するには不十分です。ライブテスト、コントラクトテスト、および共有の`video_generate`ツールがモードサポートを決定論的に検証できるように、プロバイダーは`generate`、`imageToVideo`、`videoToVideo`を明示的に宣言する必要があります。

## ライブテスト

共有のバンドル済みプロバイダー向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは、不足しているプロバイダー環境変数を`~/.profile`から読み込み、デフォルトでは保存済み認証プロファイルよりもライブ/env APIキーを優先し、ローカルメディアで安全に実行できる宣言済みモードを実行します。

- スイープ内のすべてのプロバイダーに対する`generate`
- `capabilities.imageToVideo.enabled`である場合の`imageToVideo`
- `capabilities.videoToVideo.enabled`であり、かつそのプロバイダー/モデルが共有スイープでバッファ対応のローカル動画入力を受け付ける場合の`videoToVideo`

現在、共有の`videoToVideo`ライブレーンがカバーしているのは次のとおりです。

- `runway`（`runway/gen4_aleph`を選択した場合のみ）

## 設定

OpenClaw設定でデフォルトの動画生成モデルを設定します。

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

またはCLI経由:

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

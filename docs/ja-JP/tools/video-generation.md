---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルを設定する
    - '`video_generate`ツールのパラメーターを理解する'
summary: 14のプロバイダーバックエンドを使用して、テキスト、画像、または既存の動画から動画を生成する
title: 動画生成
x-i18n:
    generated_at: "2026-04-24T05:27:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5ddefd4fcde2b22be6631c160ed6e128a97b0800d32c65fb5fe36227ce4f368
    source_path: tools/video-generation.md
    workflow: 15
---

OpenClawエージェントは、テキストプロンプト、参照画像、または既存の動画から動画を生成できます。14のプロバイダーバックエンドがサポートされており、それぞれモデルオプション、入力モード、機能セットが異なります。エージェントは、設定内容と利用可能なAPIキーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate`ツールは、少なくとも1つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダーのAPIキーを設定するか、`agents.defaults.videoGenerationModel`を設定してください。
</Note>

OpenClawは、動画生成を3つのランタイムモードとして扱います。

- 参照メディアのないテキストから動画へのリクエスト用の`generate`
- リクエストに1つ以上の参照画像が含まれる場合の`imageToVideo`
- リクエストに1つ以上の参照動画が含まれる場合の`videoToVideo`

プロバイダーは、これらのモードの任意の部分集合をサポートできます。ツールは送信前にアクティブな
モードを検証し、`action=list`でサポートされるモードを報告します。

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

> 夕焼けの中でフレンドリーなロブスターがサーフィンする、5秒のシネマティックな動画を生成して。

エージェントは自動的に`video_generate`を呼び出します。ツールの許可リスト設定は不要です。

## 動画を生成すると何が起きるか

動画生成は非同期です。エージェントがセッション内で`video_generate`を呼び出すと、次のことが起こります。

1. OpenClawがリクエストをプロバイダーに送信し、すぐにタスクIDを返します。
2. プロバイダーがバックグラウンドでジョブを処理します（通常は、プロバイダーと解像度に応じて30秒から5分）。
3. 動画の準備ができると、OpenClawが内部完了イベントで同じセッションを再開します。
4. エージェントが完成した動画を元の会話に投稿します。

ジョブが進行中の場合、同じセッション内で重複する`video_generate`呼び出しを行うと、新しい生成を開始する代わりに現在のタスク状態が返されます。CLIから進行状況を確認するには、`openclaw tasks list`または`openclaw tasks show <taskId>`を使用します。

セッションに裏付けられたエージェント実行以外（たとえば、ツールの直接呼び出し）では、ツールはインライン生成にフォールバックし、同じターン内で最終的なメディアパスを返します。

### タスクライフサイクル

各`video_generate`リクエストは、4つの状態を移動します。

1. **queued** -- タスクが作成され、プロバイダーが受け付けるのを待っています。
2. **running** -- プロバイダーが処理中です（通常は、プロバイダーと解像度に応じて30秒から5分）。
3. **succeeded** -- 動画の準備が完了しました。エージェントが再開され、会話に投稿します。
4. **failed** -- プロバイダーエラーまたはタイムアウトです。エージェントがエラー詳細付きで再開されます。

CLIから状態を確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重複防止: 現在のセッションですでに動画タスクが`queued`または`running`の場合、`video_generate`は新しいタスクを開始する代わりに既存のタスク状態を返します。新しい生成をトリガーせずに明示的に確認するには、`action: "status"`を使用します。

## サポートされているプロバイダー

| Provider              | デフォルトモデル                | テキスト | 画像参照                                             | 動画参照         | APIキー                                   |
| --------------------- | ------------------------------- | -------- | ---------------------------------------------------- | ---------------- | ----------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    | Yes      | Yes（リモートURL）                                   | Yes（リモートURL） | `MODELSTUDIO_API_KEY`                     |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       | Yes      | 最大2画像（I2Vモデルのみ。先頭フレーム + 最終フレーム） | No               | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       | Yes      | 最大2画像（role経由の先頭フレーム + 最終フレーム）    | No               | `BYTEPLUS_API_KEY`                        |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  | Yes      | 最大9参照画像                                        | 最大3動画        | `BYTEPLUS_API_KEY`                        |
| ComfyUI               | `workflow`                      | Yes      | 1画像                                                | No               | `COMFY_API_KEY` or `COMFY_CLOUD_API_KEY`  |
| fal                   | `fal-ai/minimax/video-01-live`  | Yes      | 1画像                                                | No               | `FAL_KEY`                                 |
| Google                | `veo-3.1-fast-generate-preview` | Yes      | 1画像                                                | 1動画            | `GEMINI_API_KEY`                          |
| MiniMax               | `MiniMax-Hailuo-2.3`            | Yes      | 1画像                                                | No               | `MINIMAX_API_KEY`                         |
| OpenAI                | `sora-2`                        | Yes      | 1画像                                                | 1動画            | `OPENAI_API_KEY`                          |
| Qwen                  | `wan2.6-t2v`                    | Yes      | Yes（リモートURL）                                   | Yes（リモートURL） | `QWEN_API_KEY`                            |
| Runway                | `gen4.5`                        | Yes      | 1画像                                                | 1動画            | `RUNWAYML_API_SECRET`                     |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        | Yes      | 1画像                                                | No               | `TOGETHER_API_KEY`                        |
| Vydra                 | `veo3`                          | Yes      | 1画像（`kling`）                                     | No               | `VYDRA_API_KEY`                           |
| xAI                   | `grok-imagine-video`            | Yes      | 1画像                                                | 1動画            | `XAI_API_KEY`                             |

一部のプロバイダーは、追加または代替のAPIキー環境変数も受け付けます。詳細は各[プロバイダーページ](#related)を参照してください。

利用可能なプロバイダー、モデル、ランタイムモードを実行時に確認するには、`video_generate action=list`を実行してください。

### 宣言済み機能マトリクス

これは、`video_generate`、コントラクトテスト、
共有ライブスイープで使用される明示的なモードコントラクトです。

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有ライブレーン                                                                                                                   |
| -------- | ---------- | -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーはリモート`http(s)`動画URLを必要とするため、`videoToVideo`はスキップされます                |
| BytePlus | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI  | Yes        | Yes            | No             | 共有スイープには含まれません。workflow固有のカバレッジはComfyテストにあります                                                            |
| fal      | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Google   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; 現在のバッファベースGemini/Veoスイープはその入力を受け付けないため、共有の`videoToVideo`はスキップされます |
| MiniMax  | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| OpenAI   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このorg/入力パスでは現在プロバイダー側のinpaint/remixアクセスが必要なため、共有の`videoToVideo`はスキップされます |
| Qwen     | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーはリモート`http(s)`動画URLを必要とするため、`videoToVideo`はスキップされます                |
| Runway   | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; `videoToVideo`は選択したモデルが`runway/gen4_aleph`の場合にのみ実行されます                                 |
| Together | Yes        | Yes            | No             | `generate`, `imageToVideo`                                                                                                               |
| Vydra    | Yes        | Yes            | No             | `generate`; 同梱の`veo3`はテキスト専用で、同梱の`kling`はリモート画像URLを必要とするため、共有の`imageToVideo`はスキップされます      |
| xAI      | Yes        | Yes            | Yes            | `generate`, `imageToVideo`; このプロバイダーは現在リモートMP4 URLを必要とするため、`videoToVideo`はスキップされます                    |

## ツールパラメーター

### 必須

| パラメーター | 型     | 説明                                                                     |
| ------------ | ------ | ------------------------------------------------------------------------ |
| `prompt`     | string | 生成する動画のテキスト説明（`action: "generate"`で必須）                 |

### コンテンツ入力

| パラメーター | 型       | 説明                                                                                                                                   |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `image`      | string   | 単一の参照画像（パスまたはURL）                                                                                                        |
| `images`     | string[] | 複数の参照画像（最大9件）                                                                                                              |
| `imageRoles` | string[] | 結合された画像リストに対応する、位置ごとの任意のroleヒント。標準値: `first_frame`, `last_frame`, `reference_image`                   |
| `video`      | string   | 単一の参照動画（パスまたはURL）                                                                                                        |
| `videos`     | string[] | 複数の参照動画（最大4件）                                                                                                              |
| `videoRoles` | string[] | 結合された動画リストに対応する、位置ごとの任意のroleヒント。標準値: `reference_video`                                                 |
| `audioRef`   | string   | 単一の参照音声（パスまたはURL）。プロバイダーが音声入力をサポートしている場合、背景音楽や音声参照などに使用されます                 |
| `audioRefs`  | string[] | 複数の参照音声（最大3件）                                                                                                              |
| `audioRoles` | string[] | 結合された音声リストに対応する、位置ごとの任意のroleヒント。標準値: `reference_audio`                                                 |

roleヒントは、そのままプロバイダーへ転送されます。標準値は
`VideoGenerationAssetRole` unionに由来しますが、プロバイダーによっては追加の
role文字列を受け付ける場合があります。`*Roles`配列は、対応する参照リストより多い
エントリを持ってはいけません。1つずれたミスは、明確なエラーで失敗します。
スロットを未設定のままにするには、空文字列を使用してください。

### スタイル制御

| パラメーター     | 型      | 説明                                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------------------- |
| `aspectRatio`    | string  | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`, または `adaptive` |
| `resolution`     | string  | `480P`, `720P`, `768P`, または `1080P`                                                |
| `durationSeconds`| number  | 目標の長さ（秒）。最も近いプロバイダー対応値に丸められます                           |
| `size`           | string  | プロバイダーが対応している場合のサイズヒント                                          |
| `audio`          | boolean | 対応時に出力で生成音声を有効化します。`audioRef*`（入力）とは別です                   |
| `watermark`      | boolean | 対応時にプロバイダーの透かしを切り替えます                                            |

`adaptive`はプロバイダー固有のセンチネルです。機能で`adaptive`を宣言している
プロバイダーにはそのまま転送されます（例: BytePlus
Seedanceは、入力画像の寸法から比率を自動検出するためにこれを使用します）。
これを宣言していないプロバイダーでは、その値は
ツール結果の`details.ignoredOverrides`に表示されるため、無視されたことが分かります。

### 高度な設定

| パラメーター     | 型     | 説明                                                                                                                                                                                                                                                                                                                                 |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `action`         | string | `"generate"`（デフォルト）、`"status"`、または`"list"`                                                                                                                                                                                                                                                                               |
| `model`          | string | プロバイダー/モデルのオーバーライド（例: `runway/gen4.5`）                                                                                                                                                                                                                                                                          |
| `filename`       | string | 出力ファイル名ヒント                                                                                                                                                                                                                                                                                                                 |
| `timeoutMs`      | number | 任意のプロバイダーリクエストタイムアウト（ミリ秒）                                                                                                                                                                                                                                                                                   |
| `providerOptions`| object | JSONオブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。型付きスキーマを宣言しているプロバイダーでは、キーと型が検証されます。未知のキーや不一致は、フォールバック時にその候補をスキップします。宣言済みスキーマがないプロバイダーには、そのままオプションが渡されます。各プロバイダーが受け付ける内容を確認するには、`video_generate action=list`を実行してください |

すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClawは、長さを最も近いプロバイダー対応値へ正規化し、さらに、フォールバック先プロバイダーが異なる制御サーフェスを公開している場合には、size-to-aspect-ratioのような変換済みジオメトリヒントも再マッピングします。本当に未対応のオーバーライドは、ベストエフォートで無視され、ツール結果内で警告として報告されます。厳格な機能制限（参照入力が多すぎる場合など）は、送信前に失敗します。

ツール結果には、適用された設定が報告されます。プロバイダーフォールバック中にOpenClawが長さやジオメトリを再マッピングした場合、返される`durationSeconds`、`size`、`aspectRatio`、`resolution`の値には実際に送信された内容が反映され、`details.normalization`には要求値から適用値への変換が記録されます。

参照入力はランタイムモードも選択します。

- 参照メディアなし: `generate`
- 任意の画像参照あり: `imageToVideo`
- 任意の動画参照あり: `videoToVideo`
- 参照音声入力は解決されたモードを変更しません。画像/動画参照が選択したモードに追加で適用され、`maxInputAudios`を宣言しているプロバイダーでのみ機能します

画像参照と動画参照の混在は、安定した共有機能サーフェスではありません。
1つのリクエストでは、1種類の参照タイプを優先してください。

#### フォールバックと型付きオプション

一部の機能チェックは、ツール境界ではなくフォールバック層で適用されます。これにより、プライマリプロバイダーの制限を超えるリクエストでも、対応可能なフォールバック先で実行できます。

- アクティブ候補が`maxInputAudios`を宣言していない（または`0`として宣言している）場合、リクエストに音声参照が含まれているとその候補はスキップされ、次の候補が試されます。
- アクティブ候補の`maxDurationSeconds`が要求された`durationSeconds`より小さく、その候補が`supportedDurationSeconds`リストを宣言していない場合、その候補はスキップされます。
- リクエストに`providerOptions`が含まれ、アクティブ候補が型付きの`providerOptions`スキーマを明示的に宣言している場合、渡されたキーがスキーマ内にない、または値の型が一致しないと、その候補はスキップされます。まだスキーマを宣言していないプロバイダーには、オプションがそのまま渡されます（後方互換のパススルー）。プロバイダーは空スキーマ（`capabilities.providerOptions: {}`）を宣言することで、すべてのprovider optionsを明示的に拒否できます。この場合も型不一致と同様にスキップされます。

リクエスト内で最初のスキップ理由は`warn`で記録されるため、オペレーターはプライマリプロバイダーが見送られたことを把握できます。その後のスキップは、長いフォールバックチェーンを静かに保つため`debug`で記録されます。すべての候補がスキップされた場合、集約エラーには各候補のスキップ理由が含まれます。

## アクション

- **generate**（デフォルト） -- 指定したプロンプトと任意の参照入力から動画を作成します。
- **status** -- 別の生成を開始せずに、現在のセッションで進行中の動画タスクの状態を確認します。
- **list** -- 利用可能なプロバイダー、モデル、およびその機能を表示します。

## モデル選択

動画を生成するとき、OpenClawは次の順序でモデルを解決します。

1. **`model`ツールパラメーター** -- エージェントが呼び出し時に指定している場合。
2. **`videoGenerationModel.primary`** -- 設定から。
3. **`videoGenerationModel.fallbacks`** -- 順番に試行されます。
4. **自動検出** -- 有効な認証を持つプロバイダーを使用します。現在のデフォルトプロバイダーから始め、残りのプロバイダーをアルファベット順で試します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

動画生成で明示的な`model`、`primary`、`fallbacks`
エントリのみを使用したい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false`を設定してください。

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
    DashScope / Model Studioの非同期エンドポイントを使用します。参照画像と動画はリモート`http(s)` URLである必要があります。
  </Accordion>

  <Accordion title="BytePlus (1.0)">
    プロバイダーID: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2Vモデル（`*-t2v-*`）は画像入力を受け付けません。I2Vモデルおよび汎用`*-pro-*`モデルは単一の参照画像（先頭フレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"`を設定してください。画像が提供されると、T2VモデルIDは対応するI2Vバリアントへ自動的に切り替えられます。

    サポートされる`providerOptions`キー: `seed`（number）、`draft`（boolean — 480pを強制）、`camera_fixed`（boolean）。

  </Accordion>

  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Pluginが必要です。プロバイダーID: `byteplus-seedance15`。モデル: `seedance-1-5-pro-251215`。

    統一`content[]` APIを使用します。入力画像は最大2枚（`first_frame` + `last_frame`）までサポートします。すべての入力はリモート`https://` URLである必要があります。各画像に`role: "first_frame"` / `"last_frame"`を設定するか、画像を位置指定で渡してください。

    `aspectRatio: "adaptive"`は入力画像から比率を自動検出します。`audio: true`は`generate_audio`にマッピングされます。`providerOptions.seed`（number）が転送されます。

  </Accordion>

  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Pluginが必要です。プロバイダーID: `byteplus-seedance2`。モデル: `dreamina-seedance-2-0-260128`, `dreamina-seedance-2-0-fast-260128`。

    統一`content[]` APIを使用します。最大9枚の参照画像、3本の参照動画、3本の参照音声をサポートします。すべての入力はリモート`https://` URLである必要があります。各アセットに`role`を設定してください。サポートされる値は `"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"` です。

    `aspectRatio: "adaptive"`は入力画像から比率を自動検出します。`audio: true`は`generate_audio`にマッピングされます。`providerOptions.seed`（number）が転送されます。

  </Accordion>

  <Accordion title="ComfyUI">
    workflow駆動のローカルまたはクラウド実行です。設定済みグラフを通じてテキストから動画、および画像から動画をサポートします。
  </Accordion>

  <Accordion title="fal">
    長時間実行ジョブ向けにキューバック方式のフローを使用します。単一の画像参照のみ対応です。
  </Accordion>

  <Accordion title="Google (Gemini / Veo)">
    1つの画像参照または1つの動画参照をサポートします。
  </Accordion>

  <Accordion title="MiniMax">
    単一の画像参照のみ対応です。
  </Accordion>

  <Accordion title="OpenAI">
    `size`オーバーライドのみが転送されます。その他のスタイルオーバーライド（`aspectRatio`, `resolution`, `audio`, `watermark`）は警告付きで無視されます。
  </Accordion>

  <Accordion title="Qwen">
    Alibabaと同じDashScopeバックエンドです。参照入力はリモート`http(s)` URLである必要があります。ローカルファイルは事前に拒否されます。
  </Accordion>

  <Accordion title="Runway">
    data URI経由でローカルファイルをサポートします。動画から動画には`runway/gen4_aleph`が必要です。テキストのみの実行では、`16:9`と`9:16`のアスペクト比が公開されます。
  </Accordion>

  <Accordion title="Together">
    単一の画像参照のみ対応です。
  </Accordion>

  <Accordion title="Vydra">
    認証が失われるリダイレクトを避けるため、`https://www.vydra.ai/api/v1`を直接使用します。`veo3`はテキストから動画専用として同梱されており、`kling`はリモート画像URLを必要とします。
  </Accordion>

  <Accordion title="xAI">
    テキストから動画、画像から動画、リモート動画の編集/拡張フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダー機能モード

共有の動画生成コントラクトでは、プロバイダーはフラットな集約制限だけでなく、モード固有の機能も宣言できるようになりました。新しいプロバイダー実装では、明示的なモードブロックを優先してください。

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

`maxInputImages`や`maxInputVideos`のようなフラットな集約フィールドだけでは、
変換モードのサポートを示すには不十分です。プロバイダーは
`generate`、`imageToVideo`、`videoToVideo`を明示的に宣言し、ライブテスト、
コントラクトテスト、共有の`video_generate`ツールがモードサポートを
決定的に検証できるようにする必要があります。

## ライブテスト

共有の同梱プロバイダー向けのオプトインライブカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリラッパー:

```bash
pnpm test:live:media video
```

このライブファイルは、欠けているプロバイダーenv varを`~/.profile`から読み込み、
デフォルトでは保存済み認証プロファイルよりライブ/env APIキーを優先し、
デフォルトでリリース安全なスモークを実行します。

- スイープ内のFAL以外のすべてのプロバイダーに対する`generate`
- 1秒のロブスタープロンプト
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`によるプロバイダーごとの操作上限
  （デフォルトは`180000`）

FALは、プロバイダー側のキュー待ち時間がリリース時間を大きく左右する可能性があるため、オプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

共有スイープがローカルメディアで安全に実行できる、宣言済み変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`を設定してください。

- `capabilities.imageToVideo.enabled`の場合は`imageToVideo`
- `capabilities.videoToVideo.enabled`であり、かつプロバイダー/モデルが共有スイープで
  バッファベースのローカル動画入力を受け付ける場合は`videoToVideo`

現在、共有の`videoToVideo`ライブレーンがカバーしているのは次のとおりです。

- `runway`（`runway/gen4_aleph`を選択した場合のみ）

## 設定

OpenClawの設定でデフォルトの動画生成モデルを設定します。

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

- [Tools Overview](/ja-JP/tools)
- [Background Tasks](/ja-JP/automation/tasks) -- 非同期動画生成のタスク追跡
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
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults)
- [Models](/ja-JP/concepts/models)

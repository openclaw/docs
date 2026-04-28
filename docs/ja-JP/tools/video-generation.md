---
read_when:
    - エージェント経由で動画を生成する
    - 動画生成プロバイダーとモデルの設定
    - '`video_generate`ツールのパラメーターを理解する'
sidebarTitle: Video generation
summary: 14のプロバイダーバックエンド全体で、テキスト、画像、または動画のreferenceから`video_generate`を使って動画を生成する
title: 動画生成
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:42:59Z"
  model: gpt-5.4
  provider: openai
  source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
  source_path: tools/video-generation.md
  workflow: 15
---

OpenClawエージェントは、テキストプロンプト、reference画像、または既存の動画から動画を生成できます。14のプロバイダーバックエンドがサポートされており、それぞれ異なるモデルオプション、入力モード、機能セットを持っています。エージェントは、設定内容と利用可能なAPIキーに基づいて適切なプロバイダーを自動的に選択します。

<Note>
`video_generate`ツールは、少なくとも1つの動画生成プロバイダーが利用可能な場合にのみ表示されます。エージェントツールに表示されない場合は、プロバイダーAPIキーを設定するか、`agents.defaults.videoGenerationModel`を設定してください。
</Note>

OpenClawは、動画生成を3つのランタイムモードとして扱います。

- `generate` — referenceメディアのないtext-to-videoリクエスト。
- `imageToVideo` — 1つ以上のreference画像を含むリクエスト。
- `videoToVideo` — 1つ以上のreference動画を含むリクエスト。

プロバイダーはこれらのモードの任意のサブセットをサポートできます。ツールは送信前にアクティブなモードを検証し、`action=list`でサポートされるモードを報告します。

## クイックスタート

<Steps>
  <Step title="認証を設定する">
    任意のサポート対象プロバイダーのAPIキーを設定します。

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="デフォルトモデルを選ぶ（任意）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="エージェントに依頼する">
    > 夕焼けの中でフレンドリーなロブスターがサーフィンしている5秒のシネマティックな動画を生成して。

    エージェントは自動的に`video_generate`を呼び出します。ツールの許可リスト設定は不要です。

  </Step>
</Steps>

## 非同期生成の仕組み

動画生成は非同期です。セッション内でエージェントが`video_generate`を呼び出すと、次のようになります。

1. OpenClawはリクエストをプロバイダーに送信し、すぐにタスクIDを返します。
2. プロバイダーはバックグラウンドでジョブを処理します（通常、プロバイダーと解像度に応じて30秒〜5分）。
3. 動画の準備ができると、OpenClawは内部完了イベントで同じセッションを起こします。
4. エージェントは完成した動画を元の会話に投稿します。

ジョブが進行中の間、同じセッション内での重複する`video_generate`呼び出しは、新しい生成を開始する代わりに現在のタスクステータスを返します。CLIから進行状況を確認するには、`openclaw tasks list`または`openclaw tasks show <taskId>`を使ってください。

セッションを伴うエージェント実行の外側（たとえば、直接のツール呼び出し）では、ツールはインライン生成にフォールバックし、同じターン内で最終メディアパスを返します。

生成された動画ファイルは、プロバイダーがバイト列を返した場合、OpenClaw管理下のメディアストレージに保存されます。生成動画の保存上限のデフォルトは動画メディア上限に従い、より大きなレンダリングには`agents.defaults.mediaMaxMb`で引き上げられます。プロバイダーがホストされた出力URLも返す場合、ローカル保存がサイズ超過ファイルを拒否しても、OpenClawはタスクを失敗させる代わりにそのURLを配信できます。

### タスクライフサイクル

| 状態 | 意味 |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued` | タスクは作成済みで、プロバイダーが受け付けるのを待っています。 |
| `running` | プロバイダーが処理中です（通常、プロバイダーと解像度に応じて30秒〜5分）。 |
| `succeeded` | 動画の準備ができ、エージェントが起きて会話に投稿します。 |
| `failed` | プロバイダーエラーまたはタイムアウト。エージェントはエラー詳細付きで起きます。 |

CLIからステータスを確認します。

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

現在のセッションですでに動画タスクが`queued`または`running`の場合、`video_generate`は新しいタスクを開始せず、既存タスクのステータスを返します。新しい生成を発生させずに明示的に確認するには、`action: "status"`を使ってください。

## サポートされるプロバイダー

| プロバイダー | デフォルトモデル | テキスト | 画像reference | 動画reference | 認証 |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | あり（リモートURL）                                     | あり（リモートURL）                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | 最大2画像（I2Vモデルのみ。先頭 + 最終フレーム） | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | 最大2画像（role経由の先頭 + 最終フレーム）         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | 最大9枚のreference画像                             | 最大3本の動画                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | 1画像                                              | —                                               | `COMFY_API_KEY`または`COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | 1画像、Seedance reference-to-videoでは最大9枚    | Seedance reference-to-videoでは最大3本の動画 | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | 1画像                                              | 1動画                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | 1画像                                              | —                                               | `MINIMAX_API_KEY`またはMiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | 1画像                                              | 1動画                                         | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | あり（リモートURL）                                     | あり（リモートURL）                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | 1画像                                              | 1動画                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1画像                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | 1画像（`kling`）                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | 1枚の先頭フレーム画像または最大7枚の`reference_image` | 1動画                                         | `XAI_API_KEY`                            |

一部のプロバイダーは、追加または別名のAPIキーenv varも受け付けます。詳細は各[プロバイダーページ](#related)を参照してください。

`video_generate action=list`を実行すると、利用可能なプロバイダー、モデル、およびランタイムモードをランタイム時に確認できます。

### capabilityマトリクス

`video_generate`、contract test、および共有live sweepで使われる明示的なモード契約:

| Provider | `generate` | `imageToVideo` | `videoToVideo` | 現在の共有liveレーン |
| -------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート`http(s)`動画URLが必要なため、`videoToVideo`はスキップ |
| BytePlus |     ✓      |       ✓        |       —        | `generate`、`imageToVideo` |
| ComfyUI  |     ✓      |       ✓        |       —        | 共有sweepには含まれません。ワークフロー固有のカバレッジはComfy test側にあります |
| fal      |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo`はSeedance reference-to-video使用時のみ |
| Google   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。現在のbufferバックエンドGemini/Veo sweepはその入力を受け付けないため、共有`videoToVideo`はスキップ |
| MiniMax  |     ✓      |       ✓        |       —        | `generate`、`imageToVideo` |
| OpenAI   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このorg/input経路は現在プロバイダー側のinpaint/remixアクセスが必要なため、共有`videoToVideo`はスキップ |
| Qwen     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーはリモート`http(s)`動画URLが必要なため、`videoToVideo`はスキップ |
| Runway   |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。`videoToVideo`は選択モデルが`runway/gen4_aleph`のときのみ実行 |
| Together |     ✓      |       ✓        |       —        | `generate`、`imageToVideo` |
| Vydra    |     ✓      |       ✓        |       —        | `generate`。バンドル済み`veo3`はtext専用で、バンドル済み`kling`はリモート画像URLが必要なため、共有`imageToVideo`はスキップ |
| xAI      |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`。このプロバイダーは現在リモートMP4 URLが必要なため、`videoToVideo`はスキップ |

## ツールパラメーター

### 必須

<ParamField path="prompt" type="string" required>
  生成する動画のテキスト説明。`action: "generate"`では必須です。
</ParamField>

### コンテンツ入力

<ParamField path="image" type="string">単一のreference画像（パスまたはURL）。</ParamField>
<ParamField path="images" type="string[]">複数のreference画像（最大9枚）。</ParamField>
<ParamField path="imageRoles" type="string[]">
結合された画像リストと並行する、位置ごとの任意のroleヒント。
正式な値: `first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">単一のreference動画（パスまたはURL）。</ParamField>
<ParamField path="videos" type="string[]">複数のreference動画（最大4本）。</ParamField>
<ParamField path="videoRoles" type="string[]">
結合された動画リストと並行する、位置ごとの任意のroleヒント。
正式な値: `reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
単一のreference音声（パスまたはURL）。プロバイダーが音声入力をサポートする場合、BGMまたは音声referenceに使われます。
</ParamField>
<ParamField path="audioRefs" type="string[]">複数のreference音声（最大3件）。</ParamField>
<ParamField path="audioRoles" type="string[]">
結合された音声リストと並行する、位置ごとの任意のroleヒント。
正式な値: `reference_audio`。
</ParamField>

<Note>
roleヒントは、そのままプロバイダーに転送されます。正式な値は`VideoGenerationAssetRole` unionに由来しますが、プロバイダーは追加のrole文字列を受け付ける場合があります。`*Roles`配列は、対応するreferenceリストより多くの要素を持ってはいけません。1つずれたミスは明確なエラーで失敗します。スロットを未設定のままにするには空文字列を使ってください。xAIでは、`reference_images`生成モードを使うには、すべての画像roleを`reference_image`に設定してください。単一画像のimage-to-videoでは、roleを省略するか`first_frame`を使ってください。
</Note>

### スタイル制御

<ParamField path="aspectRatio" type="string">
  `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、または`adaptive`。
</ParamField>
<ParamField path="resolution" type="string">`480P`、`720P`、`768P`、または`1080P`。</ParamField>
<ParamField path="durationSeconds" type="number">
  目標の長さ（秒）。最も近いプロバイダー対応値に丸められます。
</ParamField>
<ParamField path="size" type="string">プロバイダーがサポートする場合のサイズヒント。</ParamField>
<ParamField path="audio" type="boolean">
  サポートされている場合、出力で生成音声を有効にします。`audioRef*`（入力）とは別です。
</ParamField>
<ParamField path="watermark" type="boolean">サポートされている場合、プロバイダーのウォーターマークを切り替えます。</ParamField>

`adaptive`はプロバイダー固有のsentinelです。capabilityで`adaptive`を宣言しているプロバイダーにそのまま転送されます（例: BytePlus Seedanceはこれを使って入力画像の寸法から比率を自動検出します）。これを宣言していないプロバイダーでは、ドロップが見えるように、ツール結果の`details.ignoredOverrides`を通してその値が表示されます。

### 高度な設定

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"`は現在のセッションタスクを返し、`"list"`はプロバイダーを確認します。
</ParamField>
<ParamField path="model" type="string">プロバイダー/モデルの上書き（例: `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。</ParamField>
<ParamField path="providerOptions" type="object">
  JSONオブジェクトとしてのプロバイダー固有オプション（例: `{"seed": 42, "draft": true}`）。
  型付きスキーマを宣言しているプロバイダーでは、キーと型が検証されます。未知のキーや不一致があると、その候補はフォールバック中にスキップされます。宣言済みスキーマを持たないプロバイダーには、オプションはそのまま渡されます。各プロバイダーが何を受け付けるかを見るには`video_generate action=list`を実行してください。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。OpenClawは、durationを最も近いプロバイダー対応値に正規化し、フォールバック先プロバイダーが異なる制御サーフェスを公開している場合は、size-to-aspect-ratioのような変換済みジオメトリヒントを再マップします。本当に未対応の上書きはベストエフォートで無視され、ツール結果で警告として報告されます。厳格なcapability上限（reference入力が多すぎる場合など）は、送信前に失敗します。ツール結果は適用された設定を報告し、`details.normalization`は要求値から適用値への変換を記録します。
</Note>

reference入力はランタイムモードを選択します。

- referenceメディアなし → `generate`
- 任意の画像referenceあり → `imageToVideo`
- 任意の動画referenceあり → `videoToVideo`
- reference音声入力は**解決されるモードを変更しません**。画像/動画referenceが選択したモードの上に適用され、`maxInputAudios`を宣言しているプロバイダーでのみ動作します。

画像referenceと動画referenceの混在は、安定した共有capabilityサーフェスではありません。リクエストごとに1種類のreferenceタイプを使うことをおすすめします。

#### フォールバックと型付きオプション

一部のcapabilityチェックはツール境界ではなくフォールバックレイヤーで適用されるため、プライマリプロバイダーの上限を超えるリクエストでも、対応可能なフォールバック先で実行できる場合があります。

- アクティブ候補が`maxInputAudios`を宣言していない（または`0`）状態で、リクエストに音声referenceが含まれている場合、その候補はスキップされます。次の候補が試されます。
- アクティブ候補の`maxDurationSeconds`が、宣言済みの`supportedDurationSeconds`リストなしで要求された`durationSeconds`より小さい場合 → スキップされます。
- リクエストに`providerOptions`が含まれ、アクティブ候補が型付き`providerOptions`スキーマを明示的に宣言している場合 → 供給されたキーがスキーマに存在しない、または値型が一致しないとスキップされます。宣言済みスキーマのないプロバイダーには、オプションはそのまま渡されます（後方互換のパススルー）。プロバイダーは空スキーマ（`capabilities.providerOptions: {}`）を宣言することで、すべてのprovider optionsをオプトアウトできます。この場合も型不一致と同様にスキップされます。

1つのリクエストで最初のスキップ理由は`warn`で記録されるため、オペレーターはプライマリプロバイダーがスキップされたことを把握できます。後続のスキップは、長いフォールバックチェーンを静かに保つため`debug`で記録されます。すべての候補がスキップされた場合、集約エラーには各候補のスキップ理由が含まれます。

## アクション

| アクション | 動作 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | デフォルト。与えられたプロンプトと任意のreference入力から動画を生成します。 |
| `status`   | 現在のセッションで進行中の動画タスクの状態を、新しい生成を開始せずに確認します。 |
| `list`     | 利用可能なプロバイダー、モデル、およびそのcapabilityを表示します。 |

## モデル選択

OpenClawは次の順序でモデルを解決します。

1. **`model`ツールパラメーター** — エージェントが呼び出し内で指定した場合。
2. configの**`videoGenerationModel.primary`**。
3. 順番どおりの**`videoGenerationModel.fallbacks`**。
4. **自動検出** — 有効な認証を持つプロバイダーを、現在のデフォルトプロバイダーから開始し、その後残りのプロバイダーをアルファベット順に試します。

プロバイダーが失敗した場合、次の候補が自動的に試されます。すべての候補が失敗した場合、エラーには各試行の詳細が含まれます。

明示的な`model`、`primary`、`fallbacks`エントリーだけを使うには、`agents.defaults.mediaGenerationAutoProviderFallback: false`を設定してください。

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

## プロバイダーに関する注意

<AccordionGroup>
  <Accordion title="Alibaba">
    DashScope / Model Studioの非同期エンドポイントを使用します。reference画像と動画はリモート`http(s)` URLである必要があります。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    プロバイダーid: `byteplus`。

    モデル: `seedance-1-0-pro-250528`（デフォルト）、
    `seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、
    `seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2Vモデル（`*-t2v-*`）は画像入力を受け付けません。I2Vモデルと一般的な`*-pro-*`モデルは単一のreference画像（先頭フレーム）をサポートします。画像は位置指定で渡すか、`role: "first_frame"`を設定してください。画像が指定された場合、T2Vモデルidは対応するI2Vバリアントに自動的に切り替えられます。

    サポートされる`providerOptions`キー: `seed`（number）、`draft`（boolean — 480pを強制）、`camera_fixed`（boolean）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Pluginが必要です。プロバイダーid: `byteplus-seedance15`。モデル:
    `seedance-1-5-pro-251215`。

    統一`content[]` APIを使用します。最大2枚の入力画像
    （`first_frame` + `last_frame`）をサポートします。すべての入力はリモート`https://`
    URLである必要があります。各画像に`role: "first_frame"` / `"last_frame"`を設定するか、
    画像を位置指定で渡してください。

    `aspectRatio: "adaptive"`は入力画像から比率を自動検出します。
    `audio: true`は`generate_audio`にマップされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    Pluginが必要です。プロバイダーid: `byteplus-seedance2`。モデル:
    `dreamina-seedance-2-0-260128`、
    `dreamina-seedance-2-0-fast-260128`。

    統一`content[]` APIを使用します。最大9枚のreference画像、
    3本のreference動画、および3件のreference音声をサポートします。すべての入力はリモート
    `https://` URLである必要があります。各アセットに`role`を設定してください。サポートされる値:
    `"first_frame"`、`"last_frame"`、`"reference_image"`、
    `"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"`は入力画像から比率を自動検出します。
    `audio: true`は`generate_audio`にマップされます。`providerOptions.seed`
    （number）は転送されます。

  </Accordion>
  <Accordion title="ComfyUI">
    ワークフロー駆動のローカルまたはクラウド実行です。設定されたグラフを通じてtext-to-videoとimage-to-videoをサポートします。
  </Accordion>
  <Accordion title="fal">
    長時間実行ジョブ向けにキューバックエンドのフローを使用します。多くのfal動画モデルは単一の画像referenceを受け付けます。Seedance 2.0 reference-to-videoモデルは、最大9枚の画像、3本の動画、3件の音声referenceを受け付け、referenceファイルの合計は最大12件です。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    1枚の画像または1本の動画referenceをサポートします。
  </Accordion>
  <Accordion title="MiniMax">
    単一の画像referenceのみです。
  </Accordion>
  <Accordion title="OpenAI">
    `size`上書きのみが転送されます。その他のスタイル上書き
    （`aspectRatio`、`resolution`、`audio`、`watermark`）は、警告付きで無視されます。
  </Accordion>
  <Accordion title="Qwen">
    Alibabaと同じDashScopeバックエンドです。reference入力はリモート
    `http(s)` URLである必要があり、ローカルファイルは事前に拒否されます。
  </Accordion>
  <Accordion title="Runway">
    data URI経由でローカルファイルをサポートします。video-to-videoには
    `runway/gen4_aleph`が必要です。テキストのみの実行では`16:9`および`9:16`のaspect ratioを公開します。
  </Accordion>
  <Accordion title="Together">
    単一の画像referenceのみです。
  </Accordion>
  <Accordion title="Vydra">
    認証を落とすリダイレクトを避けるため、直接`https://www.vydra.ai/api/v1`を使用します。`veo3`はtext-to-video専用としてバンドルされており、`kling`はリモート画像URLが必要です。
  </Accordion>
  <Accordion title="xAI">
    text-to-video、単一の先頭フレームimage-to-video、xAI `reference_images`経由で最大7件の
    `reference_image`入力、およびリモート動画の編集/延長フローをサポートします。
  </Accordion>
</AccordionGroup>

## プロバイダーcapabilityモード

共有動画生成契約は、フラットな集約上限だけではなく、モード固有のcapabilityをサポートします。新しいプロバイダー実装では、明示的なモードブロックを優先してください。

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

`maxInputImages`や`maxInputVideos`のようなフラットな集約フィールドだけでは、変換モード対応を示すには**不十分**です。プロバイダーは`generate`、`imageToVideo`、`videoToVideo`を明示的に宣言し、live test、contract test、および共有`video_generate`ツールがモード対応を決定論的に検証できるようにする必要があります。

プロバイダー内の1つのモデルだけが他より広いreference入力サポートを持つ場合は、モード全体の上限を引き上げる代わりに、`maxInputImagesByModel`、`maxInputVideosByModel`、または`maxInputAudiosByModel`を使ってください。

## live test

共有バンドル済みプロバイダー向けのオプトインliveカバレッジ:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

リポジトリーラッパー:

```bash
pnpm test:live:media video
```

このliveファイルは、`~/.profile`から不足しているプロバイダーenv varsを読み込み、デフォルトで保存済みauth profileよりlive/env APIキーを優先し、デフォルトではリリース安全なスモークを実行します。

- sweep内のすべての非FALプロバイダーに対する`generate`。
- 1秒のロブスタープロンプト。
- `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS`（デフォルトは`180000`）によるプロバイダーごとの操作上限。

FALは、プロバイダー側のキュー待機レイテンシがリリース時間の大部分を占める可能性があるため、オプトインです。

```bash
pnpm test:live:media video --video-providers fal
```

共有sweepでローカルメディアを使って安全に実行できる宣言済み変換モードも実行するには、`OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`を設定してください。

- `capabilities.imageToVideo.enabled`のときの`imageToVideo`
- `capabilities.videoToVideo.enabled`であり、プロバイダー/モデルが共有sweepでbufferバックエンドのローカル動画入力を受け付けるときの`videoToVideo`

現在、共有`videoToVideo` liveレーンがカバーするのは、`runway/gen4_aleph`を選択した場合の`runway`のみです。

## 設定

OpenClaw configでデフォルトの動画生成モデルを設定します。

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

またはCLIから:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 関連

- [Alibaba Model Studio](/ja-JP/providers/alibaba)
- [バックグラウンドタスク](/ja-JP/automation/tasks) — 非同期動画生成のタスク追跡
- [BytePlus](/ja-JP/concepts/model-providers#byteplus-international)
- [ComfyUI](/ja-JP/providers/comfy)
- [Configuration reference](/ja-JP/gateway/config-agents#agent-defaults)
- [fal](/ja-JP/providers/fal)
- [Google (Gemini)](/ja-JP/providers/google)
- [MiniMax](/ja-JP/providers/minimax)
- [Models](/ja-JP/concepts/models)
- [OpenAI](/ja-JP/providers/openai)
- [Qwen](/ja-JP/providers/qwen)
- [Runway](/ja-JP/providers/runway)
- [Together AI](/ja-JP/providers/together)
- [ツール概要](/ja-JP/tools)
- [Vydra](/ja-JP/providers/vydra)
- [xAI](/ja-JP/providers/xai)

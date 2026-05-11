---
read_when:
    - エージェントによる画像の生成または編集
    - 画像生成プロバイダーとモデルの設定
    - image_generate ツールのパラメーターを理解する
sidebarTitle: Image generation
summary: OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 全体で image_generate を介して画像を生成・編集する
title: 画像生成
x-i18n:
    generated_at: "2026-05-11T20:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10c15b48a673ef673e3cf7c4f4950a08961d64a3fd21eff9d1944ec6d4b9c410
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` ツールを使うと、エージェントは構成済みのプロバイダーを使用して画像を作成および編集できます。生成された画像は、エージェントの返信でメディア添付ファイルとして自動的に配信されます。

<Note>
このツールは、少なくとも 1 つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を構成するか、プロバイダーの API キーを設定するか、OpenAI Codex OAuth でサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="Configure auth">
    少なくとも 1 つのプロバイダーの API キーを設定するか（例: `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）、OpenAI Codex OAuth でサインインします。
  </Step>
  <Step title="Pick a default model (optional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth は同じ `openai/gpt-image-2` モデル参照を使用します。`openai-codex` OAuth プロファイルが構成されている場合、OpenClaw は最初に `OPENAI_API_KEY` を試す代わりに、その OAuth プロファイル経由で画像リクエストをルーティングします。明示的な `models.providers.openai` 構成（API キー、カスタム/Azure ベース URL）を指定すると、直接の OpenAI Images API ルートに戻ります。

  </Step>
  <Step title="Ask the agent">
    _「フレンドリーなロボットのマスコットの画像を生成して。」_

    エージェントは `image_generate` を自動的に呼び出します。ツールの許可リスト設定は不要です。プロバイダーが利用可能な場合はデフォルトで有効になります。

  </Step>
</Steps>

<Warning>
LocalAI などの OpenAI 互換 LAN エンドポイントでは、カスタム `models.providers.openai.baseUrl` を保持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的にオプトインしてください。プライベートおよび内部の画像エンドポイントは、デフォルトでは引き続きブロックされます。
</Warning>

## 一般的なルート

| 目的                                                 | モデル参照                                          | 認証                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 課金による OpenAI 画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex サブスクリプション認証による OpenAI 画像生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透過背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth |
| DeepInfra 画像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY`   |

同じ `image_generate` ツールが、テキストから画像の生成と参照画像の編集を処理します。参照が 1 つの場合は `image`、複数の場合は `images` を使用します。`quality`、`outputFormat`、`background` など、プロバイダーがサポートする出力ヒントは、利用可能な場合に転送され、プロバイダーがサポートしていない場合は無視されたものとして報告されます。同梱の透過背景サポートは OpenAI 固有です。他のプロバイダーでも、バックエンドが PNG アルファを出力する場合は保持されることがあります。

## サポートされるプロバイダー

| プロバイダー   | デフォルトモデル                           | 編集サポート                       | 認証                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | はい（1 枚の画像、ワークフロー構成） | クラウドの場合は `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | はい（1 枚の画像）                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | はい（モデル固有の制限）        | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | はい                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | はい（最大 5 枚の入力画像）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | はい（被写体参照）            | `MINIMAX_API_KEY` または MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | はい（最大 4 枚の画像）               | `OPENAI_API_KEY` または OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | はい（最大 5 枚の入力画像）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | はい（最大 5 枚の画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを確認するには、`action: "list"` を使用します。

```text
/tool image_generate action=list
```

## プロバイダー機能

| 機能            | ComfyUI            | DeepInfra | fal                       | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ------------------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数）  | ワークフロー定義   | 4         | 4                         | 4              | 9                     | 4              | 1     | 4              |
| 編集 / 参照      | 1 枚の画像（ワークフロー） | 1 枚の画像   | Flux: 1; GPT: 10; NB2: 14 | 最大 5 枚の画像 | 1 枚の画像（被写体参照） | 最大 5 枚の画像 | -     | 最大 5 枚の画像 |
| サイズ制御          | -                  | ✓         | ✓                         | ✓              | -                     | 最大 4K       | -     | -              |
| アスペクト比          | -                  | -         | ✓                         | ✓              | ✓                     | -              | -     | ✓              |
| 解像度（1K/2K/4K） | -                  | -         | ✓                         | ✓              | -                     | -              | -     | 1K, 2K         |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  画像生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  実行時に利用可能なプロバイダーとモデルを確認するには `"list"` を使用します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルの上書き（例: `openai/gpt-image-2`）。透過 OpenAI 背景には `openai/gpt-image-1.5` を使用します。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一の参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モード用の複数の参照画像（サポートするプロバイダーでは最大 5 枚）。
</ParamField>
<ParamField path="size" type="string">
  サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比: `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度ヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  プロバイダーがサポートしている場合の品質ヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  プロバイダーがサポートしている場合の出力形式ヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  プロバイダーがサポートしている場合の背景ヒント。透過に対応したプロバイダーでは、`outputFormat: "png"` または `"webp"` とともに `transparent` を使用します。
</ParamField>
<ParamField path="count" type="number">生成する画像の数（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  オプションのプロバイダーリクエストタイムアウト（ミリ秒）。Codex が動的ツール経由で `image_generate` を呼び出す場合でも、この呼び出しごとの値は構成済みのデフォルトを上書きし、600000 ms に制限されます。
</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターをサポートしているわけではありません。フォールバックプロバイダーが、要求されたものと完全に同じではなく近いジオメトリオプションをサポートしている場合、OpenClaw は送信前に、最も近いサポート済みのサイズ、アスペクト比、または解像度へ再マッピングします。未サポートの出力ヒントは、サポートを宣言していないプロバイダーでは削除され、ツール結果で報告されます。ツール結果には適用された設定が報告されます。`details.normalization` には、要求内容から適用内容への変換が記録されます。
</Note>

## 構成

### モデル選択

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### プロバイダー選択順序

OpenClaw は、次の順序でプロバイダーを試します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定した場合）。
2. 構成の **`imageGenerationModel.primary`**。
3. **`imageGenerationModel.fallbacks`** を順番に。
4. **自動検出** - 認証に基づくプロバイダーのデフォルトのみ:
   - 現在のデフォルトプロバイダーが最初。
   - 残りの登録済み画像生成プロバイダーをプロバイダー ID 順に。

プロバイダーが失敗した場合（認証エラー、レート制限など）、次に構成された候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    呼び出しごとの `model` 上書きは、そのプロバイダー/モデルのみを試し、構成済みの primary/fallback や自動検出されたプロバイダーには進みません。
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    プロバイダーのデフォルトは、OpenClaw がそのプロバイダーを実際に認証できる場合にのみ候補リストに入ります。明示的な `model`、`primary`、`fallbacks` エントリのみを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
  </Accordion>
  <Accordion title="Timeouts">
    遅い画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs` を設定します。呼び出しごとの `timeoutMs` ツールパラメーターは、構成済みのデフォルトを上書きします。Codex の動的ツール呼び出しも同じタイムアウト予算を尊重し、OpenClaw の 600000 ms の動的ツールブリッジ上限で制限されます。
  </Accordion>
  <Accordion title="Inspect at runtime">
    現在登録されているプロバイダー、そのデフォルトモデル、認証環境変数のヒントを確認するには、`action: "list"` を使用します。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI、xAI は、参照画像の編集をサポートしています。参照画像のパスまたは URL を渡します。

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は、`images` パラメーターで最大 5 枚の参照画像をサポートします。fal は、Flux image-to-image では 1 枚の参照画像、GPT Image 2 編集では最大 10 枚、Nano Banana 2 編集では最大 14 枚をサポートします。MiniMax と ComfyUI は 1 枚をサポートします。

## プロバイダー詳細解説

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (および gpt-image-1.5)">
    OpenAI 画像生成のデフォルトは `openai/gpt-image-2` です。
    `openai-codex` OAuth プロファイルが構成されている場合、OpenClaw は Codex サブスクリプションのチャットモデルで使われる同じ
    OAuth プロファイルを再利用し、画像リクエストを Codex Responses バックエンド経由で送信します。`https://chatgpt.com/backend-api` のような従来の Codex ベース
    URL は、画像リクエスト用に
    `https://chatgpt.com/backend-api/codex` へ正規化されます。OpenClaw は、そのリクエストで `OPENAI_API_KEY` へ**暗黙的に**フォールバックしません -
    OpenAI Images API へ直接ルーティングするには、API キー、カスタムベース URL、または Azure エンドポイントを指定して
    `models.providers.openai` を明示的に構成してください。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、および
    `openai/gpt-image-1-mini` モデルは、引き続き明示的に選択できます。透明背景の PNG/WebP 出力には
    `gpt-image-1.5` を使ってください。現在の
    `gpt-image-2` API は `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` ツールを通じて、テキストから画像への生成と
    参照画像編集の両方をサポートします。
    OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、
    および参照画像を OpenAI に転送します。OpenAI が
    `aspectRatio` または `resolution` を直接受け取ることは**ありません**。可能な場合、OpenClaw はそれらをサポートされる `size` にマッピングし、それ以外の場合はツールがそれらを無視されたオーバーライドとして報告します。

    OpenAI 固有のオプションは `openai` オブジェクトの下にあります。

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` は `transparent`、`opaque`、または `auto` を受け付けます。
    透明出力には、`outputFormat` が `png` または `webp` であり、
    透明化に対応した OpenAI 画像モデルが必要です。OpenClaw は、デフォルトの
    `gpt-image-2` 透明背景リクエストを `gpt-image-1.5` にルーティングします。
    `openai.outputCompression` は JPEG/WebP 出力に適用されます。

    トップレベルの `background` ヒントはプロバイダー中立で、現在は OpenAI プロバイダーが選択されている場合に、同じ OpenAI `background` リクエストフィールドへマッピングされます。背景サポートを宣言していないプロバイダーでは、サポートされないパラメーターを受け取る代わりに
    `ignoredOverrides` に返されます。

    `api.openai.com` ではなく Azure OpenAI デプロイメント経由で OpenAI 画像生成をルーティングするには、
    [Azure OpenAI エンドポイント](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像モデル">
    OpenRouter 画像生成は同じ `OPENROUTER_API_KEY` を使用し、
    OpenRouter の chat completions 画像 API 経由でルーティングします。OpenRouter 画像モデルは
    `openrouter/` プレフィックスで選択します。

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw は `prompt`、`count`、参照画像、および
    Gemini 互換の `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。
    現在組み込みの OpenRouter 画像モデルショートカットには、
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` があります。構成済み Plugin が公開している内容を確認するには
    `action: "list"` を使ってください。

  </Accordion>
  <Accordion title="MiniMax デュアル認証">
    MiniMax 画像生成は、バンドルされた MiniMax 認証パスの両方から利用できます。

    - API キー設定用の `minimax/image-01`
    - OAuth 設定用の `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされた xAI プロバイダーは、プロンプトのみのリクエストでは `/v1/images/generations` を使用し、
    `image` または `images` が存在する場合は `/v1/images/edits` を使用します。

    - モデル: `xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 件数: 最大 4
    - 参照: 1 つの `image` または最大 5 つの `images`
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解像度: `1K`、`2K`
    - 出力: OpenClaw 管理の画像添付として返されます

    OpenClaw は、共有のクロスプロバイダー `image_generate` 契約にこれらの制御が存在するまで、xAI ネイティブの `quality`、`mask`、
    `user`、または追加のネイティブ専用アスペクト比を意図的に公開しません。

  </Accordion>
</AccordionGroup>

## 例

<Tabs>
  <Tab title="生成 (4K 横長)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成 (透明 PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

同等の CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="生成 (正方形 2 枚)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編集 (参照 1 枚)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編集 (複数参照)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

同じ `--output-format` および `--background` フラグは、
`openclaw infer image edit` でも利用できます。`--openai-background` は引き続き
OpenAI 固有のエイリアスです。OpenAI 以外のバンドル済みプロバイダーは、現時点では明示的な背景制御を宣言していないため、`background: "transparent"` はそれらに対して無視されたものとして報告されます。

## 関連

- [ツール概要](/ja-JP/tools) - 利用可能なすべてのエージェントツール
- [ComfyUI](/ja-JP/providers/comfy) - ローカル ComfyUI と Comfy Cloud ワークフロー設定
- [fal](/ja-JP/providers/fal) - fal 画像および動画プロバイダー設定
- [Google (Gemini)](/ja-JP/providers/google) - Gemini 画像プロバイダー設定
- [MiniMax](/ja-JP/providers/minimax) - MiniMax 画像プロバイダー設定
- [OpenAI](/ja-JP/providers/openai) - OpenAI Images プロバイダー設定
- [Vydra](/ja-JP/providers/vydra) - Vydra 画像、動画、音声設定
- [xAI](/ja-JP/providers/xai) - Grok 画像、動画、検索、コード実行、TTS 設定
- [構成リファレンス](/ja-JP/gateway/config-agents#agent-defaults) - `imageGenerationModel` 構成
- [モデル](/ja-JP/concepts/models) - モデル構成とフェイルオーバー

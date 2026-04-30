---
read_when:
    - エージェント経由で画像を生成または編集する
    - 画像生成プロバイダーとモデルの設定
    - image_generate ツールのパラメーターを理解する
sidebarTitle: Image generation
summary: OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra で image_generate 経由で画像を生成・編集する
title: 画像生成
x-i18n:
    generated_at: "2026-04-30T05:37:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` ツールを使うと、エージェントは設定済みのプロバイダーを使って画像を作成および編集できます。生成された画像は、エージェントの返信内のメディア添付として自動的に配信されます。

<Note>
このツールは、少なくとも1つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定するか、プロバイダーの API キーを設定するか、OpenAI Codex OAuth でサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="Configure auth">
    少なくとも1つのプロバイダーの API キー（例: `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）を設定するか、OpenAI Codex OAuth でサインインします。
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

    Codex OAuth は同じ `openai/gpt-image-2` モデル参照を使用します。`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は最初に `OPENAI_API_KEY` を試す代わりに、その OAuth プロファイル経由で画像リクエストをルーティングします。明示的な `models.providers.openai` 設定（API キー、カスタム/Azure ベース URL）を指定すると、直接の OpenAI Images API ルートに戻ります。

  </Step>
  <Step title="Ask the agent">
    _「親しみやすいロボットのマスコットの画像を生成して。」_

    エージェントは `image_generate` を自動的に呼び出します。ツールの許可リスト設定は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。

  </Step>
</Steps>

<Warning>
LocalAI などの OpenAI 互換 LAN エンドポイントでは、カスタムの `models.providers.openai.baseUrl` を保持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的にオプトインしてください。プライベートおよび内部画像エンドポイントは、デフォルトでは引き続きブロックされます。
</Warning>

## 一般的なルート

| 目的                                                 | モデル参照                                          | 認証                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 課金による OpenAI 画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex サブスクリプション認証による OpenAI 画像生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth |
| DeepInfra 画像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY`   |

同じ `image_generate` ツールが、テキストから画像への生成と参照画像の編集を処理します。参照が1つの場合は `image`、複数の参照の場合は `images` を使用します。`quality`、`outputFormat`、`background` など、プロバイダーが対応する出力ヒントは、利用可能な場合に転送され、プロバイダーが対応していない場合は無視されたものとして報告されます。バンドルされた透明背景サポートは OpenAI 固有です。他のプロバイダーでも、バックエンドが PNG アルファを出力する場合は保持されることがあります。

## 対応プロバイダー

| プロバイダー   | デフォルトモデル                           | 編集サポート                       | 認証                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | はい（1画像、ワークフロー設定） | クラウドでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | はい（1画像）                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | はい                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | はい                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | はい（入力画像は最大5枚）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | はい（被写体参照）            | `MINIMAX_API_KEY` または MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | はい（最大4画像）               | `OPENAI_API_KEY` または OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | はい（入力画像は最大5枚）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | はい（最大5画像）               | `XAI_API_KEY`                                         |

実行時に利用可能なプロバイダーとモデルを調べるには、`action: "list"` を使用します。

```text
/tool image_generate action=list
```

## プロバイダーの機能

| 機能            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数）  | ワークフロー定義   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 編集 / 参照      | 1画像（ワークフロー） | 1画像   | 1画像           | 最大5画像 | 1画像（被写体参照） | 最大5画像 | —     | 最大5画像 |
| サイズ制御          | —                  | ✓         | ✓                 | ✓              | —                     | 最大4K       | —     | —              |
| アスペクト比          | —                  | —         | ✓（生成のみ） | ✓              | ✓                     | —              | —     | ✓              |
| 解像度（1K/2K/4K） | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## ツールパラメーター

<ParamField path="prompt" type="string" required>
  画像生成プロンプト。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  実行時に利用可能なプロバイダーとモデルを調べるには `"list"` を使用します。
</ParamField>
<ParamField path="model" type="string">
  プロバイダー/モデルのオーバーライド（例: `openai/gpt-image-2`）。OpenAI の透明背景には `openai/gpt-image-1.5` を使用します。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一参照画像パスまたは URL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モード用の複数参照画像（対応プロバイダーでは最大5枚）。
</ParamField>
<ParamField path="size" type="string">
  サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比: `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度ヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  プロバイダーが対応している場合の品質ヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  プロバイダーが対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  プロバイダーが対応している場合の背景ヒント。透明化に対応するプロバイダーでは、`outputFormat: "png"` または `"webp"` とともに `transparent` を使用します。
</ParamField>
<ParamField path="count" type="number">生成する画像の数（1〜4）。</ParamField>
<ParamField path="timeoutMs" type="number">任意のプロバイダーリクエストタイムアウト（ミリ秒）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>

<Note>
すべてのプロバイダーがすべてのパラメーターに対応しているわけではありません。フォールバックプロバイダーが、正確にリクエストされたものではなく近いジオメトリオプションに対応している場合、OpenClaw は送信前に、最も近い対応サイズ、アスペクト比、または解像度に再マッピングします。対応が宣言されていないプロバイダーでは、未対応の出力ヒントは削除され、ツール結果で報告されます。ツール結果には適用された設定が報告され、`details.normalization` にはリクエストから適用値への変換が記録されます。
</Note>

## 設定

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

### プロバイダー選択順

OpenClaw は次の順序でプロバイダーを試します。

1. ツール呼び出しの **`model` パラメーター**（エージェントが指定している場合）。
2. 設定の **`imageGenerationModel.primary`**。
3. 順序どおりの **`imageGenerationModel.fallbacks`**。
4. **自動検出** — 認証に基づくプロバイダーのデフォルトのみ:
   - 現在のデフォルトプロバイダーを最初に使用。
   - 残りの登録済み画像生成プロバイダーをプロバイダー ID 順で使用。

プロバイダーが失敗した場合（認証エラー、レート制限など）、次に設定されている候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

<AccordionGroup>
  <Accordion title="Per-call model overrides are exact">
    呼び出しごとの `model` オーバーライドでは、そのプロバイダー/モデルのみを試し、設定済みの primary/fallback や自動検出されたプロバイダーには続行しません。
  </Accordion>
  <Accordion title="Auto-detection is auth-aware">
    プロバイダーのデフォルトは、OpenClaw がそのプロバイダーを実際に認証できる場合にのみ候補リストに入ります。明示的な `model`、`primary`、`fallbacks` エントリのみを使用するには、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定します。
  </Accordion>
  <Accordion title="Timeouts">
    低速な画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs` を設定します。呼び出しごとの `timeoutMs` ツールパラメーターは、設定済みのデフォルトをオーバーライドします。
  </Accordion>
  <Accordion title="Inspect at runtime">
    現在登録されているプロバイダー、そのデフォルトモデル、認証環境変数のヒントを調べるには、`action: "list"` を使用します。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI、xAI は参照画像の編集に対応しています。参照画像のパスまたは URL を渡します。

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は、`images` パラメーター経由で最大5枚の参照画像に対応しています。fal、MiniMax、ComfyUI は1枚に対応しています。

## プロバイダー詳細

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（および gpt-image-1.5）">
    OpenAI の画像生成はデフォルトで `openai/gpt-image-2` を使用します。`openai-codex` OAuth プロファイルが構成されている場合、OpenClaw は Codex サブスクリプションのチャットモデルで使われる同じ OAuth プロファイルを再利用し、画像リクエストを Codex Responses バックエンド経由で送信します。`https://chatgpt.com/backend-api` などの従来の Codex ベース URL は、画像リクエスト用に `https://chatgpt.com/backend-api/codex` に正規化されます。OpenClaw はそのリクエストで `OPENAI_API_KEY` に暗黙的にフォールバックすることは**ありません**。直接 OpenAI Images API へルーティングするには、API キー、カスタムベース URL、または Azure エンドポイントを指定して `models.providers.openai` を明示的に構成してください。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、および `openai/gpt-image-1-mini` モデルは、引き続き明示的に選択できます。透明背景の PNG/WebP 出力には `gpt-image-1.5` を使用してください。現在の `gpt-image-2` API は `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` ツールを通じてテキストからの画像生成と参照画像の編集の両方をサポートします。OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、および参照画像を OpenAI に転送します。OpenAI は `aspectRatio` または `resolution` を直接受け取りません。可能な場合、OpenClaw はそれらをサポートされる `size` にマッピングし、それ以外の場合はツールが無視されたオーバーライドとして報告します。

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

    `openai.background` は `transparent`、`opaque`、または `auto` を受け付けます。透明出力には `outputFormat` が `png` または `webp` であり、透明度に対応した OpenAI 画像モデルが必要です。OpenClaw はデフォルトの `gpt-image-2` 透明背景リクエストを `gpt-image-1.5` にルーティングします。`openai.outputCompression` は JPEG/WebP 出力に適用されます。

    トップレベルの `background` ヒントはプロバイダー中立であり、現在は OpenAI プロバイダーが選択されている場合に同じ OpenAI `background` リクエストフィールドへマッピングされます。背景サポートを宣言していないプロバイダーでは、サポートされていないパラメーターとして受け取る代わりに `ignoredOverrides` に返されます。

    OpenAI 画像生成を `api.openai.com` ではなく Azure OpenAI デプロイ経由でルーティングするには、[Azure OpenAI エンドポイント](/ja-JP/providers/openai#azure-openai-endpoints)を参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像モデル">
    OpenRouter の画像生成は同じ `OPENROUTER_API_KEY` を使用し、OpenRouter のチャット補完画像 API 経由でルーティングされます。OpenRouter 画像モデルは `openrouter/` プレフィックスで選択します。

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

    OpenClaw は `prompt`、`count`、参照画像、および Gemini 互換の `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。現在の組み込み OpenRouter 画像モデルのショートカットには、`google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview`、および `openai/gpt-5.4-image-2` が含まれます。構成済み Plugin が公開している内容を確認するには `action: "list"` を使用してください。

  </Accordion>
  <Accordion title="MiniMax デュアル認証">
    MiniMax の画像生成は、バンドルされている両方の MiniMax 認証パスで利用できます。

    - API キー設定用の `minimax/image-01`
    - OAuth 設定用の `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされた xAI プロバイダーは、プロンプトのみのリクエストには `/v1/images/generations` を使用し、`image` または `images` が存在する場合は `/v1/images/edits` を使用します。

    - モデル: `xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 数: 最大 4
    - 参照: 1 つの `image`、または最大 5 つの `images`
    - アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解像度: `1K`、`2K`
    - 出力: OpenClaw 管理の画像添付として返されます

    OpenClaw は、共有のクロスプロバイダー `image_generate` コントラクトにそれらの制御が存在するまで、xAI ネイティブの `quality`、`mask`、`user`、または追加のネイティブ専用アスペクト比を意図的に公開しません。

  </Accordion>
</AccordionGroup>

## 例

<Tabs>
  <Tab title="生成（4K 横長）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
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
  <Tab title="生成（正方形を 2 つ）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編集（参照 1 つ）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編集（複数参照）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

同じ `--output-format` および `--background` フラグは `openclaw infer image edit` でも利用できます。`--openai-background` は OpenAI 固有のエイリアスとして残ります。OpenAI 以外のバンドル済みプロバイダーは現在、明示的な背景制御を宣言していないため、`background: "transparent"` はそれらでは無視されたものとして報告されます。

## 関連

- [ツール概要](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [ComfyUI](/ja-JP/providers/comfy) — ローカル ComfyUI と Comfy Cloud ワークフローの設定
- [fal](/ja-JP/providers/fal) — fal 画像および動画プロバイダーの設定
- [Google (Gemini)](/ja-JP/providers/google) — Gemini 画像プロバイダーの設定
- [MiniMax](/ja-JP/providers/minimax) — MiniMax 画像プロバイダーの設定
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images プロバイダーの設定
- [Vydra](/ja-JP/providers/vydra) — Vydra 画像、動画、音声の設定
- [xAI](/ja-JP/providers/xai) — Grok 画像、動画、検索、コード実行、TTS の設定
- [構成リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `imageGenerationModel` 構成
- [モデル](/ja-JP/concepts/models) — モデル構成とフェイルオーバー

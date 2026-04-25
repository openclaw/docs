---
read_when:
    - エージェント経由で画像を生成する
    - 画像生成プロバイダーとモデルを設定する
    - '`image_generate` ツールのパラメータを理解する'
summary: 設定済みのプロバイダー（OpenAI、OpenAI Codex OAuth、Google Gemini、OpenRouter、LiteLLM、fal、MiniMax、ComfyUI、Vydra、xAI）を使って画像を生成および編集する
title: 画像生成
x-i18n:
    generated_at: "2026-04-25T18:21:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` ツールを使うと、エージェントは設定済みのプロバイダーを使って画像を生成および編集できます。生成された画像は、エージェントの返信内でメディア添付として自動配信されます。

<Note>
このツールは、少なくとも 1 つの画像生成プロバイダーが利用可能な場合にのみ表示されます。エージェントのツールに `image_generate` が表示されない場合は、`agents.defaults.imageGenerationModel` を設定し、プロバイダー API キーを設定するか、OpenAI Codex OAuth でサインインしてください。
</Note>

## クイックスタート

1. 少なくとも 1 つのプロバイダーの API キー（たとえば `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）を設定するか、OpenAI Codex OAuth でサインインします。
2. 必要に応じて希望するモデルを設定します。

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // image_generate 用の任意のデフォルト provider request タイムアウト。
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth は同じ `openai/gpt-image-2` model ref を使用します。`openai-codex` の OAuth プロファイルが設定されている場合、OpenClaw はまず `OPENAI_API_KEY` を試すのではなく、同じ OAuth プロファイル経由で画像 request をルーティングします。API キーやカスタム/Azure base URL などの明示的なカスタム `models.providers.openai` 画像 config を指定すると、直接の OpenAI Images API ルートに戻ります。LocalAI のような OpenAI 互換 LAN エンドポイントでは、カスタム `models.providers.openai.baseUrl` を維持し、`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` で明示的にオプトインしてください。private/internal な画像エンドポイントはデフォルトで引き続きブロックされます。

3. エージェントに依頼します: _「親しみやすいロボットのマスコット画像を生成して」_

エージェントは自動的に `image_generate` を呼び出します。ツールの allow-list 指定は不要です。プロバイダーが利用可能な場合、デフォルトで有効になります。

## よく使うルート

| 目的                                                 | Model ref                                          | 認証                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| API 課金による OpenAI 画像生成                       | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Codex サブスクリプション認証による OpenAI 画像生成   | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| OpenRouter 画像生成                                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| LiteLLM 画像生成                                     | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                    |
| Google Gemini 画像生成                               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY` |

同じ `image_generate` ツールが、テキストから画像への生成と参照画像編集の両方を扱います。参照が 1 枚なら `image`、複数なら `images` を使用してください。`quality`、`outputFormat`、OpenAI 固有の `background` など、プロバイダー対応の出力ヒントは利用可能な場合に転送され、プロバイダーが対応していない場合は無視されたことが報告されます。

## 対応プロバイダー

| Provider   | デフォルトモデル                        | 編集対応                           | 認証                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | はい（最大 4 画像）                | `OPENAI_API_KEY` または OpenAI Codex OAuth            |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | はい（最大 5 入力画像）            | `OPENROUTER_API_KEY`                                  |
| LiteLLM    | `gpt-image-2`                           | はい（最大 5 入力画像）            | `LITELLM_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`        | はい                               | `GEMINI_API_KEY` または `GOOGLE_API_KEY`              |
| fal        | `fal-ai/flux/dev`                       | はい                               | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | はい（被写体参照）                 | `MINIMAX_API_KEY` または MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | はい（1 画像、workflow 設定依存）  | クラウドでは `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY` |
| Vydra      | `grok-imagine`                          | いいえ                             | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | はい（最大 5 画像）                | `XAI_API_KEY`                                         |

ランタイムで利用可能な provider と model を確認するには `action: "list"` を使います。

```
/tool image_generate action=list
```

## ツールパラメータ

<ParamField path="prompt" type="string" required>
画像生成 prompt。`action: "generate"` で必須です。
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
ランタイムで利用可能な provider と model を確認するには `"list"` を使います。
</ParamField>

<ParamField path="model" type="string">
provider/model の上書き。例: `openai/gpt-image-2`。
</ParamField>

<ParamField path="image" type="string">
編集モード用の単一参照画像パスまたは URL。
</ParamField>

<ParamField path="images" type="string[]">
編集モード用の複数参照画像（最大 5 枚）。
</ParamField>

<ParamField path="size" type="string">
サイズヒント: `1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>

<ParamField path="aspectRatio" type="string">
アスペクト比: `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
解像度ヒント。
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
provider が対応している場合の品質ヒント。
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
provider が対応している場合の出力形式ヒント。
</ParamField>

<ParamField path="count" type="number">
生成する画像数（1〜4）。
</ParamField>

<ParamField path="timeoutMs" type="number">
任意の provider request タイムアウト（ミリ秒）。
</ParamField>

<ParamField path="filename" type="string">
出力ファイル名ヒント。
</ParamField>

<ParamField path="openai" type="object">
OpenAI 専用ヒント: `background`、`moderation`、`outputCompression`、`user`。
</ParamField>

すべての provider がすべてのパラメータをサポートしているわけではありません。フォールバック provider が、要求された正確なジオメトリではなく近いジオメトリオプションをサポートしている場合、OpenClaw は送信前に最も近い対応サイズ、アスペクト比、または解像度に再マップします。`quality` や `outputFormat` のような未対応の出力ヒントは、その provider が対応を宣言していない場合は削除され、ツール結果で報告されます。

ツール結果は適用された設定を報告します。provider フォールバック中に OpenClaw がジオメトリを再マップした場合、返される `size`、`aspectRatio`、`resolution` の値は実際に送信された内容を反映し、`details.normalization` には要求値から適用値への変換が記録されます。

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

### provider 選択順序

画像生成時、OpenClaw は次の順序で provider を試します。

1. ツール呼び出しの **`model` パラメータ**（エージェントが指定した場合）
2. config の **`imageGenerationModel.primary`**
3. 順番通りの **`imageGenerationModel.fallbacks`**
4. **自動検出** — 認証済み provider のデフォルトのみを使用:
   - 現在のデフォルト provider を最初に
   - 残りの登録済み画像生成 provider を provider-id 順で

provider が失敗した場合（認証エラー、レート制限など）、次に設定された候補が自動的に試されます。すべて失敗した場合、エラーには各試行の詳細が含まれます。

注記:

- 呼び出しごとの `model` 上書きは厳密です。OpenClaw はその provider/model のみを試し、設定済みの primary/fallback や自動検出された provider には進みません。
- 自動検出は認証対応です。OpenClaw がその provider を実際に認証できる場合にのみ、provider のデフォルトが候補リストに入ります。
- 自動検出はデフォルトで有効です。画像生成で明示的な `model`、`primary`、`fallbacks` エントリのみを使いたい場合は、`agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
- 遅い画像バックエンドには `agents.defaults.imageGenerationModel.timeoutMs` を設定してください。呼び出しごとの `timeoutMs` ツールパラメータは、設定済みのデフォルトを上書きします。
- 現在登録されている provider、そのデフォルト model、認証 env-var ヒントを確認するには `action: "list"` を使ってください。

### 画像編集

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI、xAI は参照画像の編集をサポートしています。参照画像パスまたは URL を渡してください。

```
"この写真を水彩画風に生成して" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は `images` パラメータで最大 5 枚の参照画像をサポートします。fal、MiniMax、ComfyUI は 1 枚をサポートします。

### OpenRouter 画像モデル

OpenRouter の画像生成は同じ `OPENROUTER_API_KEY` を使用し、OpenRouter の chat completions 画像 API 経由でルーティングされます。OpenRouter 画像モデルは `openrouter/` プレフィックスで選択します。

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

OpenClaw は `prompt`、`count`、参照画像、および Gemini 互換の `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。現在の組み込み OpenRouter 画像モデルショートカットには `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` が含まれます。設定済み plugin が何を公開しているかは `action: "list"` で確認してください。

### OpenAI `gpt-image-2`

OpenAI の画像生成はデフォルトで `openai/gpt-image-2` を使用します。`openai-codex` OAuth プロファイルが設定されている場合、OpenClaw は Codex サブスクリプションチャットモデルで使われるのと同じ OAuth プロファイルを再利用し、画像 request を Codex Responses バックエンド経由で送信します。`https://chatgpt.com/backend-api` のような従来の Codex base URL は、画像 request 用に `https://chatgpt.com/backend-api/codex` に正規化されます。この request では `OPENAI_API_KEY` に暗黙にフォールバックしません。直接の OpenAI Images API ルーティングを強制するには、API キー、カスタム base URL、または Azure エンドポイントを使って `models.providers.openai` を明示的に設定してください。古い `openai/gpt-image-1` モデルも明示的に選択できますが、新しい OpenAI の画像生成および画像編集 request では `gpt-image-2` を使用するべきです。

`gpt-image-2` は、同じ `image_generate` ツールでテキストから画像への生成と参照画像編集の両方をサポートします。OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、参照画像を OpenAI に転送します。OpenAI には `aspectRatio` や `resolution` は直接送信されません。可能な場合、OpenClaw はそれらを対応する `size` にマップし、そうでない場合は無視された上書きとしてツールが報告します。

OpenAI 固有のオプションは `openai` オブジェクト配下にあります。

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

`openai.background` には `transparent`、`opaque`、`auto` を指定できます。透明出力には `outputFormat` として `png` または `webp` が必要です。`openai.outputCompression` は JPEG/WebP 出力に適用されます。

4K の横長画像を 1 枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw image generation のためのクリーンなエディトリアルポスター" size=3840x2160 count=1
```

正方形画像を 2 枚生成する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="穏やかな生産性アプリアイコンのための 2 つのビジュアル方向性" size=1024x1024 count=2
```

ローカルの参照画像 1 枚を編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="被写体は維持し、背景を明るいスタジオセットに置き換える" image=/path/to/reference.png size=1024x1536
```

複数の参照画像で編集する:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="1 枚目の画像のキャラクター性と 2 枚目のカラーパレットを組み合わせる" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

OpenAI の画像生成を `api.openai.com` ではなく Azure OpenAI デプロイメント経由でルーティングするには、OpenAI provider ドキュメントの [Azure OpenAI endpoints](/ja-JP/providers/openai#azure-openai-endpoints) を参照してください。

MiniMax の画像生成は、バンドルされている MiniMax 認証パスの両方で利用できます。

- API キー構成向けの `minimax/image-01`
- OAuth 構成向けの `minimax-portal/image-01`

## provider 機能

| 機能                  | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| 生成                  | はい（最大 4）       | はい（最大 4）       | はい（最大 4）      | はい（最大 9）             | はい（workflow 定義出力）          | はい（1） | はい（最大 4）       |
| 編集/参照             | はい（最大 5 画像）  | はい（最大 5 画像）  | はい（1 画像）      | はい（1 画像、被写体参照） | はい（1 画像、workflow 設定依存）  | いいえ  | はい（最大 5 画像）  |
| サイズ制御            | はい（最大 4K）      | はい                 | はい                | いいえ                     | いいえ                             | いいえ  | いいえ               |
| アスペクト比          | いいえ               | はい                 | はい（生成のみ）    | はい                       | いいえ                             | いいえ  | はい                 |
| 解像度（1K/2K/4K）    | いいえ               | はい                 | はい                | いいえ                     | いいえ                             | いいえ  | はい（1K/2K）        |

### xAI `grok-imagine-image`

バンドルされた xAI provider は、prompt のみの request には `/v1/images/generations` を使用し、`image` または `images` が存在する場合は `/v1/images/edits` を使用します。

- モデル: `xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
- 枚数: 最大 4
- 参照: `image` 1 つ、または `images` 最大 5 つ
- アスペクト比: `1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
- 解像度: `1K`、`2K`
- 出力: OpenClaw 管理の画像添付として返されます

OpenClaw は、これらの制御が共有のクロスプロバイダー `image_generate` 契約に存在するようになるまで、xAI ネイティブの `quality`、`mask`、`user`、または追加のネイティブ専用アスペクト比を意図的に公開しません。

## 関連

- [Tools Overview](/ja-JP/tools) — 利用可能なすべてのエージェントツール
- [fal](/ja-JP/providers/fal) — fal の画像および動画 provider セットアップ
- [ComfyUI](/ja-JP/providers/comfy) — ローカル ComfyUI と Comfy Cloud workflow セットアップ
- [Google (Gemini)](/ja-JP/providers/google) — Gemini 画像 provider セットアップ
- [MiniMax](/ja-JP/providers/minimax) — MiniMax 画像 provider セットアップ
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images provider セットアップ
- [Vydra](/ja-JP/providers/vydra) — Vydra の画像、動画、音声セットアップ
- [xAI](/ja-JP/providers/xai) — Grok の画像、動画、検索、コード実行、TTS セットアップ
- [Configuration Reference](/ja-JP/gateway/config-agents#agent-defaults) — `imageGenerationModel` config
- [Models](/ja-JP/concepts/models) — モデル設定とフェイルオーバー

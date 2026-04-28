---
read_when:
    - agent を使った画像の生成または編集
    - 画像生成 provider と model を設定する
    - '`image_generate` tool のパラメーターを理解する'
sidebarTitle: Image generation
summary: OpenAI、Google、fal、MiniMax、ComfyUI、OpenRouter、LiteLLM、xAI、Vydra で `image_generate` を使って画像を生成・編集する
title: 画像生成
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:41:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

`image_generate` tool を使うと、設定済みの provider を使って agent が画像を生成・編集できます。生成された画像は、agent の返信内で自動的に media 添付として配信されます。

<Note>
この tool は、少なくとも 1 つの画像生成 provider が
利用可能な場合にのみ表示されます。agent の tool に `image_generate` が表示されない場合は、
`agents.defaults.imageGenerationModel` を設定し、provider の API キーをセットするか、
OpenAI Codex OAuth でサインインしてください。
</Note>

## クイックスタート

<Steps>
  <Step title="認証を設定する">
    少なくとも 1 つの provider の API キー（例: `OPENAI_API_KEY`、
    `GEMINI_API_KEY`、`OPENROUTER_API_KEY`）を設定するか、OpenAI Codex OAuth でサインインします。
  </Step>
  <Step title="デフォルト model を選ぶ（任意）">
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

    Codex OAuth でも同じ `openai/gpt-image-2` model ref を使います。`openai-codex`
    OAuth profile が設定されている場合、OpenClaw は画像
    request を、最初に `OPENAI_API_KEY` を試すのではなく、その OAuth profile 経由で route します。明示的な `models.providers.openai` 設定（API key、
    custom/Azure base URL）を行うと、direct OpenAI Images API
    route に戻ります。

  </Step>
  <Step title="agent に依頼する">
    _「親しみやすいロボットのマスコット画像を生成して。」_

    agent は自動的に `image_generate` を呼び出します。tool の allow-list 設定は不要です。
    provider が利用可能ならデフォルトで有効です。

  </Step>
</Steps>

<Warning>
LocalAI のような OpenAI-compatible LAN endpoint では、custom
`models.providers.openai.baseUrl` を維持し、明示的に
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` を有効にしてください。private および
internal の画像 endpoint はデフォルトで引き続きブロックされます。
</Warning>

## 一般的な route

| 目的                                                 | Model ref                                          | Auth                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| API 課金による OpenAI 画像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| Codex subscription 認証による OpenAI 画像生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI の透過背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` または OpenAI Codex OAuth |
| OpenRouter 画像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 画像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 画像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` または `GOOGLE_API_KEY`   |

同じ `image_generate` tool で、text-to-image と参照画像
編集の両方を扱います。参照が 1 つなら `image`、複数なら `images` を使います。
`quality`、`outputFormat`、`background` のような provider 対応の出力ヒントは、利用可能な場合は転送され、
provider がサポートしない場合は無視されたことが報告されます。バンドルされた透過背景サポートは
OpenAI 固有です。他の provider でも、backend が PNG alpha を出力する場合は保持されることがあります。

## サポートされる provider

| Provider   | Default model                           | 編集サポート                       | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | はい（1 画像、workflow 設定依存） | cloud では `COMFY_API_KEY` または `COMFY_CLOUD_API_KEY`    |
| fal        | `fal-ai/flux/dev`                       | はい                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | はい                                | `GEMINI_API_KEY` または `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | はい（入力画像は最大 5 枚）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | はい（subject reference）            | `MINIMAX_API_KEY` または MiniMax OAuth（`minimax-portal`） |
| OpenAI     | `gpt-image-2`                           | はい（最大 4 画像）               | `OPENAI_API_KEY` または OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | はい（入力画像は最大 5 枚）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | いいえ                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | はい（最大 5 画像）               | `XAI_API_KEY`                                         |

ランタイムで利用可能な provider と model を確認するには、`action: "list"` を使ってください。

```text
/tool image_generate action=list
```

## provider の capability

| Capability            | ComfyUI            | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大 count）  | workflow 定義依存   | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 編集 / 参照      | 1 画像（workflow） | 1 画像           | 最大 5 画像 | 1 画像（subject ref） | 最大 5 画像 | —     | 最大 5 画像 |
| サイズ制御          | —                  | ✓                 | ✓              | —                     | 最大 4K       | —     | —              |
| アスペクト比          | —                  | ✓（生成のみ） | ✓              | ✓                     | —              | —     | ✓              |
| 解像度 (1K/2K/4K) | —                  | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## tool パラメーター

<ParamField path="prompt" type="string" required>
  画像生成 prompt。`action: "generate"` では必須です。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  ランタイムで利用可能な provider と model を確認するには `"list"` を使います。
</ParamField>
<ParamField path="model" type="string">
  provider/model override（例: `openai/gpt-image-2`）。OpenAI の透明背景には
  `openai/gpt-image-1.5` を使ってください。
</ParamField>
<ParamField path="image" type="string">
  編集モード用の単一参照画像 path または URL。
</ParamField>
<ParamField path="images" type="string[]">
  編集モード用の複数参照画像（対応 provider では最大 5 枚）。
</ParamField>
<ParamField path="size" type="string">
  サイズヒント: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  アスペクト比: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解像度ヒント。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  provider が対応している場合の品質ヒント。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  provider が対応している場合の出力形式ヒント。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  provider が対応している場合の背景ヒント。透明化対応 provider では、透明背景には `transparent` と
  `outputFormat: "png"` または `"webp"` を使ってください。
</ParamField>
<ParamField path="count" type="number">生成する画像数（1〜4）。</ParamField>
<ParamField path="timeoutMs" type="number">任意の provider request timeout（ミリ秒）。</ParamField>
<ParamField path="filename" type="string">出力ファイル名ヒント。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 専用ヒント: `background`, `moderation`, `outputCompression`, `user`。
</ParamField>

<Note>
すべての provider がすべてのパラメーターをサポートしているわけではありません。fallback provider が
厳密に要求されたものではなく近い geometry option をサポートしている場合、OpenClaw は送信前に、
最も近い対応サイズ、アスペクト比、または解像度へ再マッピングします。
サポートされていない出力ヒントは、対応を宣言していない provider では削除され、
tool result で報告されます。tool result には適用された
設定が含まれます。`details.normalization` には、要求値から適用値への
変換内容が記録されます。
</Note>

## 設定

### model 選択

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

OpenClaw は provider を次の順序で試します。

1. tool 呼び出し内の **`model` パラメーター**（agent が指定した場合）。
2. config の **`imageGenerationModel.primary`**。
3. 順番どおりの **`imageGenerationModel.fallbacks`**。
4. **自動検出** — 認証がある provider のデフォルトのみ:
   - 現在の default provider を最初に
   - 残りの登録済み画像生成 provider を provider-id 順で

provider が失敗した場合（auth error、rate limit など）、次に設定された
候補が自動的に試されます。すべて失敗した場合、error には各試行の詳細が含まれます。

<AccordionGroup>
  <Accordion title="呼び出しごとの model override は厳密">
    呼び出しごとの `model` override は、その provider/model だけを試し、
    設定済みの primary/fallback や自動検出 provider には進みません。
  </Accordion>
  <Accordion title="自動検出は auth を考慮する">
    provider の default は、OpenClaw がその provider を
    実際に認証できる場合にのみ候補リストに入ります。
    明示的な `model`、`primary`、`fallbacks` エントリーだけを使うには、
    `agents.defaults.mediaGenerationAutoProviderFallback: false` を設定してください。
  </Accordion>
  <Accordion title="timeout">
    遅い画像 backend には `agents.defaults.imageGenerationModel.timeoutMs` を設定してください。
    呼び出しごとの `timeoutMs` tool パラメーターは、設定済みデフォルトを上書きします。
  </Accordion>
  <Accordion title="ランタイムで確認する">
    現在登録されている provider、
    その default model、auth env-var ヒントを確認するには `action: "list"` を使ってください。
  </Accordion>
</AccordionGroup>

### 画像編集

OpenAI、OpenRouter、Google、fal、MiniMax、ComfyUI、xAI は参照画像の編集をサポートしています。
参照画像の path または URL を渡してください。

```text
"この写真を水彩画風にして" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google、xAI は
`images` パラメーターで最大 5 枚の参照画像をサポートします。fal、MiniMax、ComfyUI は 1 枚です。

## provider 詳細

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（および gpt-image-1.5）">
    OpenAI の画像生成はデフォルトで `openai/gpt-image-2` を使います。`openai-codex`
    OAuth profile が設定されている場合、OpenClaw は Codex subscription chat model に使われるのと同じ
    OAuth profile を再利用し、
    画像 request を Codex Responses backend 経由で送信します。従来の Codex base
    URL（`https://chatgpt.com/backend-api` など）は、画像 request 用に
    `https://chatgpt.com/backend-api/codex` へ正規化されます。OpenClaw は
    その request で `OPENAI_API_KEY` に黙ってフォールバックすることは **ありません** —
    direct OpenAI Images API routing を強制するには、
    API key、custom base URL、
    または Azure endpoint を使って `models.providers.openai` を明示的に設定してください。

    `openai/gpt-image-1.5`、`openai/gpt-image-1`、および
    `openai/gpt-image-1-mini` model も、引き続き明示的に選択できます。透明背景の PNG/WebP 出力には
    `gpt-image-1.5` を使ってください。現在の
    `gpt-image-2` API は `background: "transparent"` を拒否します。

    `gpt-image-2` は、同じ `image_generate` tool を通じて、
    text-to-image 生成と参照画像編集の両方をサポートします。
    OpenClaw は `prompt`、`count`、`size`、`quality`、`outputFormat`、
    参照画像を OpenAI に転送します。OpenAI は
    `aspectRatio` や `resolution` を直接は受け取りません。可能な場合、OpenClaw は
    それらを対応する `size` にマッピングし、そうでない場合は tool が
    無視された override として報告します。

    OpenAI 固有の option は `openai` object の下にあります。

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

    `openai.background` は `transparent`、`opaque`、`auto` を受け付けます。
    透明出力には `outputFormat` として `png` または `webp`、および
    透明化対応の OpenAI 画像 model が必要です。OpenClaw はデフォルトの
    `gpt-image-2` の透明背景リクエストを `gpt-image-1.5` に route します。
    `openai.outputCompression` は JPEG/WebP 出力に適用されます。

    トップレベルの `background` ヒントは provider 非依存で、現在は OpenAI provider
    が選択されている場合に、同じ OpenAI の `background` request field にマッピングされます。
    背景サポートを宣言していない provider では、未対応のパラメーターを受け取る代わりに、
    それが `ignoredOverrides` に返されます。

    OpenAI 画像生成を `api.openai.com` ではなく Azure OpenAI deployment
    経由に route するには、
    [Azure OpenAI endpoint](/ja-JP/providers/openai#azure-openai-endpoints) を参照してください。

  </Accordion>
  <Accordion title="OpenRouter 画像 model">
    OpenRouter の画像生成は同じ `OPENROUTER_API_KEY` を使い、
    OpenRouter の chat completions image API を通じて route されます。
    OpenRouter の画像 model は `openrouter/` prefix で選択します。

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

    OpenClaw は `prompt`、`count`、参照画像、
    Gemini 互換の `aspectRatio` / `resolution` ヒントを OpenRouter に転送します。
    現在の組み込み OpenRouter 画像 model shortcut には
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview`、`openai/gpt-5.4-image-2` があります。設定済み plugin が何を公開しているかを確認するには
    `action: "list"` を使ってください。

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax の画像生成は、バンドルされた 2 つの MiniMax
    auth path の両方で利用できます。

    - API-key 構成では `minimax/image-01`
    - OAuth 構成では `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    バンドルされた xAI provider は、prompt のみの
    request には `/v1/images/generations` を使い、`image` または `images` がある場合は `/v1/images/edits` を使います。

    - model: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - count: 最大 4
    - 参照: `image` 1 つ、または `images` 最大 5 つ
    - アスペクト比: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 解像度: `1K`, `2K`
    - 出力: OpenClaw 管理の画像添付として返される

    OpenClaw は、これらの制御が共有の cross-provider `image_generate` 契約に存在するまでは、xAI ネイティブの `quality`、`mask`、
    `user`、追加のネイティブ専用アスペクト比を意図的に公開しません。

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
  <Tab title="生成（正方形 2 枚）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編集（参照 1 枚）">
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

同じ `--output-format` と `--background` フラグは
`openclaw infer image edit` でも利用できます。`--openai-background` は
OpenAI 固有の alias として引き続き利用できます。OpenAI 以外のバンドル provider は現在、
明示的な背景制御を宣言していないため、`background: "transparent"` は
それらでは無視されたものとして報告されます。

## 関連情報

- [tools overview](/ja-JP/tools) — 利用可能なすべての agent tool
- [ComfyUI](/ja-JP/providers/comfy) — local ComfyUI と Comfy Cloud の workflow セットアップ
- [fal](/ja-JP/providers/fal) — fal の画像・動画 provider セットアップ
- [Google (Gemini)](/ja-JP/providers/google) — Gemini 画像 provider セットアップ
- [MiniMax](/ja-JP/providers/minimax) — MiniMax 画像 provider セットアップ
- [OpenAI](/ja-JP/providers/openai) — OpenAI Images provider セットアップ
- [Vydra](/ja-JP/providers/vydra) — Vydra の画像、動画、speech セットアップ
- [xAI](/ja-JP/providers/xai) — Grok の画像、動画、search、code execution、TTS セットアップ
- [設定リファレンス](/ja-JP/gateway/config-agents#agent-defaults) — `imageGenerationModel` 設定
- [Models](/ja-JP/concepts/models) — model 設定と failover

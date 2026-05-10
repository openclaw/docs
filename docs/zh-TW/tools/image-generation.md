---
read_when:
    - 透過代理程式生成或編輯影像
    - 設定圖片生成提供者和模型
    - 了解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 image_generate 在 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 產生與編輯圖片
title: 圖像生成
x-i18n:
    generated_at: "2026-05-10T19:53:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10beee0352443ba8813094bdfe748bfa763594b93e7c9f0687be63c4506df717
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具可讓代理使用你設定的供應商建立與編輯圖片。產生的圖片會自動作為代理回覆中的媒體附件傳送。

<Note>
此工具只有在至少一個圖片生成供應商可用時才會出現。如果你在代理的工具中看不到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定供應商 API 金鑰，或使用 OpenAI Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個供應商設定 API 金鑰（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登入。
  </Step>
  <Step title="選擇預設模型（可選）">
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

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定 `openai-codex` OAuth 設定檔時，OpenClaw 會透過該 OAuth 設定檔路由圖片請求，而不是先嘗試 `OPENAI_API_KEY`。明確的 `models.providers.openai` 設定（API 金鑰、自訂/Azure 基底 URL）會改回直接使用 OpenAI Images API 路由。

  </Step>
  <Step title="詢問代理">
    _「產生一張友善機器人吉祥物的圖片。」_

    代理會自動呼叫 `image_generate`。不需要工具允許清單；當供應商可用時，預設即會啟用。

  </Step>
</Steps>

<Warning>
對於 LocalAI 等 OpenAI 相容的 LAN 端點，請保留自訂的 `models.providers.openai.baseUrl`，並使用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選擇加入。私有與內部圖片端點預設仍會被封鎖。
</Warning>

## 常見路由

| 目標                                                 | 模型參照                                          | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 圖片生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 圖片生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 圖片生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 圖片生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 圖片生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 圖片生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

相同的 `image_generate` 工具會處理文字轉圖片與參考圖片編輯。單張參考圖片使用 `image`，多張參考圖片使用 `images`。供應商支援的輸出提示，例如 `quality`、`outputFormat` 和 `background`，會在可用時轉送；若供應商不支援，則會回報為已忽略。內建的透明背景支援是 OpenAI 專用；如果其他供應商的後端輸出 PNG alpha，仍可能保留 PNG 透明度。

## 支援的供應商

| 供應商   | 預設模型                           | 編輯支援                       | 驗證                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 是（1 張圖片，由工作流程設定） | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 是（1 張圖片）                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 是                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 是（最多 5 張輸入圖片）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 是（主體參考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | 是（最多 4 張圖片）               | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入圖片）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 是（最多 5 張圖片）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的供應商與模型：

```text
/tool image_generate action=list
```

## 供應商能力

| 能力            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大數量）  | 由工作流程定義   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 編輯 / 參考      | 1 張圖片（工作流程） | 1 張圖片   | 1 張圖片           | 最多 5 張圖片 | 1 張圖片（主體參照） | 最多 5 張圖片 | -     | 最多 5 張圖片 |
| 尺寸控制          | -                  | ✓         | ✓                 | ✓              | -                     | 最高 4K       | -     | -              |
| 長寬比          | -                  | -         | ✓（僅生成） | ✓              | ✓                     | -              | -     | ✓              |
| 解析度（1K/2K/4K） | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  圖片生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在執行階段檢查可用的供應商與模型。
</ParamField>
<ParamField path="model" type="string">
  供應商/模型覆寫（例如 `openai/gpt-image-2`）。透明 OpenAI 背景請使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  編輯模式使用的單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式使用的多張參考圖片（支援的供應商最多 5 張）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  供應商支援時使用的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  供應商支援時使用的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  供應商支援時使用的背景提示。對具備透明度能力的供應商，使用 `transparent` 搭配 `outputFormat: "png"` 或 `"webp"`。
</ParamField>
<ParamField path="count" type="number">要生成的圖片數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  可選的供應商請求逾時時間，以毫秒為單位。Codex 透過動態工具呼叫 `image_generate` 時，這個單次呼叫值仍會覆寫設定的預設值，並以 600000 ms 為上限。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
並非所有供應商都支援所有參數。當備援供應商支援的是相近的幾何選項，而非精確請求的選項時，OpenClaw 會在提交前重新對應到最接近的支援尺寸、長寬比或解析度。不支援的輸出提示會針對未宣告支援的供應商被捨棄，並在工具結果中回報。工具結果會回報實際套用的設定；`details.normalization` 會擷取任何從請求到套用的轉換。
</Note>

## 設定

### 模型選擇

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

### 供應商選擇順序

OpenClaw 會依此順序嘗試供應商：

1. 工具呼叫中的 **`model` 參數**（如果代理指定）。
2. 設定中的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測** - 僅限有驗證支援的供應商預設值：
   - 目前預設供應商優先；
   - 其餘已註冊圖片生成供應商，依供應商 ID 順序。

如果某個供應商失敗（驗證錯誤、速率限制等），會自動嘗試下一個設定的候選項。如果全部失敗，錯誤會包含每次嘗試的詳細資料。

<AccordionGroup>
  <Accordion title="單次呼叫模型覆寫是精確的">
    單次呼叫的 `model` 覆寫只會嘗試該供應商/模型，不會繼續使用已設定的主要/備援或自動偵測的供應商。
  </Accordion>
  <Accordion title="自動偵測會感知驗證狀態">
    只有當 OpenClaw 實際上能驗證該供應商時，供應商預設值才會進入候選清單。設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用明確的 `model`、`primary` 和 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對於速度較慢的圖片後端，請設定 `agents.defaults.imageGenerationModel.timeoutMs`。單次呼叫的 `timeoutMs` 工具參數會覆寫設定的預設值。Codex 動態工具呼叫會遵守相同的逾時預算，受 OpenClaw 的 600000 ms 動態工具橋接上限限制。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的供應商、其預設模型，以及驗證環境變數提示。
  </Accordion>
</AccordionGroup>

### 圖片編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 和 xAI 支援編輯參考圖片。傳入參考圖片路徑或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 透過 `images` 參數最多支援 5 張參考圖片。fal、MiniMax 和 ComfyUI 支援 1 張。

## 供應商深入說明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 影像生成預設使用 `openai/gpt-image-2`。如果已設定
    `openai-codex` OAuth 設定檔，OpenClaw 會重用 Codex 訂閱聊天模型所用的同一個
    OAuth 設定檔，並透過 Codex Responses 後端傳送影像請求。舊版 Codex 基礎
    URL（例如 `https://chatgpt.com/backend-api`）會針對影像請求正規化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不會**對該請求默默後退使用 `OPENAI_API_KEY` -
    若要強制直接透過 OpenAI Images API 路由，請明確設定
    `models.providers.openai`，並提供 API 金鑰、自訂基礎 URL
    或 Azure 端點。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。若需要透明背景 PNG/WebP 輸出，請使用
    `gpt-image-1.5`；目前的
    `gpt-image-2` API 會拒絕 `background: "transparent"`。

    `gpt-image-2` 透過同一個 `image_generate` 工具支援文字轉影像生成與
    參考影像編輯。
    OpenClaw 會將 `prompt`、`count`、`size`、`quality`、`outputFormat`
    以及參考影像轉送給 OpenAI。OpenAI **不會**直接接收
    `aspectRatio` 或 `resolution`；可行時，OpenClaw 會將這些值對應到受支援的
    `size`，否則工具會將它們回報為已忽略的覆寫。

    OpenAI 專用選項位於 `openai` 物件下：

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

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；
    透明輸出需要 `outputFormat` 為 `png` 或 `webp`，並使用支援透明度的
    OpenAI 影像模型。OpenClaw 會將預設
    `gpt-image-2` 的透明背景請求路由至 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG/WebP 輸出。

    頂層 `background` 提示是供應商中立的，目前在選取 OpenAI 供應商時會對應到相同的
    OpenAI `background` 請求欄位。未宣告背景支援的供應商會改為在
    `ignoredOverrides` 中傳回它，而不會接收不支援的參數。

    若要將 OpenAI 影像生成透過 Azure OpenAI 部署路由，
    而不是使用 `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 影像模型">
    OpenRouter 影像生成使用相同的 `OPENROUTER_API_KEY`，並透過 OpenRouter 的聊天補全影像 API 路由。請使用
    `openrouter/` 前綴選取 OpenRouter 影像模型：

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

    OpenClaw 會將 `prompt`、`count`、參考影像，以及與
    Gemini 相容的 `aspectRatio` / `resolution` 提示轉送給 OpenRouter。
    目前內建的 OpenRouter 影像模型捷徑包含
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你已設定的 Plugin 暴露哪些項目。

  </Accordion>
  <Accordion title="MiniMax 雙重驗證">
    MiniMax 影像生成可透過兩種隨附的 MiniMax
    驗證路徑使用：

    - `minimax/image-01` 用於 API 金鑰設定
    - `minimax-portal/image-01` 用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    隨附的 xAI 供應商會在僅有提示的請求中使用 `/v1/images/generations`，
    並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 數量：最多 4 個
    - 參考：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的影像附件形式傳回

    OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、
    `user` 或額外的原生專用長寬比，直到這些控制項存在於共用的跨供應商
    `image_generate` 合約中。

  </Accordion>
</AccordionGroup>

## 範例

<Tabs>
  <Tab title="生成（4K 橫向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="生成（兩個方形）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編輯（一個參考）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編輯（多個參考）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

相同的 `--output-format` 和 `--background` 旗標也可用於
`openclaw infer image edit`；`--openai-background` 仍保留作為
OpenAI 專用別名。除 OpenAI 以外的隨附供應商目前未宣告明確的背景控制，
因此對它們而言，`background: "transparent"` 會被回報為已忽略。

## 相關

- [工具總覽](/zh-TW/tools) - 所有可用的代理工具
- [ComfyUI](/zh-TW/providers/comfy) - local ComfyUI 和 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) - fal 影像與影片供應商設定
- [Google (Gemini)](/zh-TW/providers/google) - Gemini 影像供應商設定
- [MiniMax](/zh-TW/providers/minimax) - MiniMax 影像供應商設定
- [OpenAI](/zh-TW/providers/openai) - OpenAI Images 供應商設定
- [Vydra](/zh-TW/providers/vydra) - Vydra 影像、影片與語音設定
- [xAI](/zh-TW/providers/xai) - Grok 影像、影片、搜尋、程式碼執行與 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) - 模型設定與容錯移轉

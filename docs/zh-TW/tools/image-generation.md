---
read_when:
    - 透過代理產生或編輯圖片
    - 設定影像生成提供者和模型
    - 了解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 `image_generate` 在 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 產生與編輯影像
title: 影像生成
x-i18n:
    generated_at: "2026-06-27T20:08:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具可讓代理使用你設定的提供者建立和編輯圖片。在聊天工作階段中，圖片生成會以非同步方式執行：OpenClaw 會記錄一個背景工作、立即傳回工作 id，並在提供者完成時喚醒代理。完成代理會遵循該工作階段的一般可見回覆模式：若已設定，則自動傳送最終回覆；或在工作階段要求訊息工具時使用 `message(action="send")`。如果請求者工作階段未啟用，或其作用中的喚醒失敗，而且有些生成圖片仍未出現在完成回覆中，OpenClaw 會傳送一個等冪的直接備援，只包含缺少的圖片。

<Note>
此工具只會在至少有一個圖片生成提供者可用時出現。如果你在代理工具中看不到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定提供者 API 金鑰，或使用 OpenAI ChatGPT/Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個提供者設定 API 金鑰（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登入。
  </Step>
  <Step title="選擇預設模型（選用）">
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

    ChatGPT/Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定 `openai` OAuth 設定檔時，OpenClaw 會透過該 OAuth 設定檔路由圖片請求，而不是先嘗試 `OPENAI_API_KEY`。明確的 `models.providers.openai` 設定（API 金鑰、自訂/Azure 基底 URL）會重新選用直接 OpenAI Images API 路由。

  </Step>
  <Step title="詢問代理">
    _「生成一張友善機器人吉祥物的圖片。」_

    代理會自動呼叫 `image_generate`。不需要工具允許清單 - 當提供者可用時，它會預設啟用。此工具會傳回背景工作 id，接著完成代理會在生成的附件準備好時，透過 `message` 工具傳送該附件。

  </Step>
</Steps>

<Warning>
對於 LocalAI 這類 OpenAI 相容的 LAN 端點，請保留自訂的 `models.providers.openai.baseUrl`，並使用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選用。私有和內部圖片端點預設仍會被封鎖。
</Warning>

## 常見路由

| 目標                                                 | 模型參照                                          | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 圖片生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 圖片生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 圖片生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表現性/風格導向生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 圖片生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 圖片生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 圖片生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 圖片生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一個 `image_generate` 工具可處理文字轉圖片和參照圖片編輯。單一參照請使用 `image`，多個參照請使用 `images`。對於 fal 上的 Krea 2 模型，這些參照會作為風格參照傳送，而不是編輯輸入。
提供者支援的輸出提示，例如 `quality`、`outputFormat` 和 `background`，會在可用時轉送；當提供者不支援時，會回報為已忽略。內建的透明背景支援僅限 OpenAI；其他提供者若其後端輸出 PNG alpha，仍可能保留透明度。

## 支援的提供者

| 提供者          | 預設模型                           | 編輯支援                       | 驗證                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 張圖片，由工作流程設定） | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 張圖片）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（模型特定限制）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 張輸入圖片）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（僅 MAI-Image-2.5 模型）    | `AZURE_OPENAI_API_KEY` 或 Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | 是（主體參照）            | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | 是（最多 4 張圖片）               | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入圖片）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 5 張圖片）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的提供者與模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 檢查目前工作階段的作用中圖片生成工作：

```text
/tool image_generate action=status
```

## 提供者能力

| 能力            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大數量）  | 工作流程定義   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編輯 / 參照      | 1 張圖片（工作流程） | 1 張圖片   | Flux: 1; GPT: 10; Krea style refs: 10; NB2: 14 | 最多 5 張圖片 | 1 張圖片           | 1 張圖片（主體參照） | 最多 5 張圖片 | -     | 最多 5 張圖片 |
| 尺寸控制          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最多 4K       | -     | -              |
| 長寬比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解析度（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  圖片生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 檢查作用中工作階段工作，或使用 `"list"` 在執行階段檢查可用的提供者與模型。
</ParamField>
<ParamField path="model" type="string">
  提供者/模型覆寫（例如 `openai/gpt-image-2`）。透明 OpenAI 背景請使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  編輯模式的單一參照圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式或風格參照模型的多個參照圖片（透過共用工具最多 10 張；仍適用提供者特定限制）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:3`、`3:2`、`2.35:1`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`、`4:1`、`1:4`、`8:1`、`1:8`。提供者會驗證其模型特定子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供者支援時的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供者支援時的背景提示。對於具備透明度能力的提供者，請搭配 `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要生成的圖片數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  選用的提供者請求逾時時間，以毫秒為單位。當 Codex 透過動態工具呼叫 `image_generate` 時，此逐次呼叫值仍會覆寫已設定的預設值，且上限為 600000 ms。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 創意控制。預設為 `medium`。
</ParamField>

<Note>
並非所有提供者都支援所有參數。當備援提供者支援的是接近的幾何選項，而非請求的精確選項時，OpenClaw 會在提交前重新對應到最接近的受支援尺寸、長寬比或解析度。
不受支援的輸出提示會對未宣告支援的提供者捨棄，並在工具結果中回報。工具結果會回報已套用的設定；`details.normalization` 會擷取任何「請求值到套用值」的轉換。
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

### 提供者選擇順序

OpenClaw 會依此順序嘗試提供者：

1. 來自工具呼叫的 **`model` 參數**（如果代理指定了其中之一）。
2. 來自設定的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測** - 僅限以驗證為基礎的提供者預設值：
   - 目前的預設提供者優先；
   - 其餘已註冊的影像生成提供者，依提供者 ID 順序排列。

如果某個提供者失敗（驗證錯誤、速率限制等），會自動嘗試下一個已設定的候選項。如果全部失敗，錯誤會包含每次嘗試的詳細資訊。

<AccordionGroup>
  <Accordion title="每次呼叫的模型覆寫是精確的">
    每次呼叫的 `model` 覆寫只會嘗試該提供者/模型，且不會繼續使用已設定的主要/備援或自動偵測到的提供者。
  </Accordion>
  <Accordion title="自動偵測會考量驗證狀態">
    只有在 OpenClaw 能夠實際驗證該提供者時，提供者預設值才會進入候選清單。設定
    `agents.defaults.mediaGenerationAutoProviderFallback: false` 即可只使用明確的
    `model`、`primary` 和 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對於較慢的影像後端，請設定 `agents.defaults.imageGenerationModel.timeoutMs`。每次呼叫的 `timeoutMs` 工具參數會覆寫已設定的預設值，而已設定的預設值會覆寫外掛作者提供的提供者預設值。Google 和 OpenRouter 託管的影像提供者使用 180 秒預設值；Microsoft Foundry MAI、xAI 和 Azure OpenAI 影像生成使用 600 秒。Codex 動態工具呼叫使用 120 秒的 `image_generate` 橋接預設值，並在設定後遵循相同的逾時預算，且受 OpenClaw 600000 毫秒動態工具橋接上限限制。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的提供者、其預設模型，以及驗證環境變數提示。
  </Accordion>
</AccordionGroup>

### 影像編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、ComfyUI 和 xAI 支援編輯參考影像。fal 上的 Krea 2 模型會使用相同的 `image` / `images` 欄位作為風格參考，而不是編輯輸入。傳入參考影像路徑或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 透過 `images` 參數最多支援 5 張參考影像。fal 對 Flux 影像轉影像支援 1 張參考影像，對 GPT Image 2 編輯最多支援 10 張，對 Krea 2 最多支援 10 張風格參考，對 Nano Banana 2 編輯最多支援 14 張。Microsoft Foundry、MiniMax 和 ComfyUI 支援 1 張。

## 提供者深入說明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（和 gpt-image-1.5）">
    OpenAI 影像生成預設為 `openai/gpt-image-2`。如果已設定
    `openai` OAuth 設定檔，OpenClaw 會重用 Codex 訂閱聊天模型使用的相同
    OAuth 設定檔，並透過 Codex Responses 後端傳送影像請求。舊版 Codex 基底
    URL，例如 `https://chatgpt.com/backend-api`，會針對影像請求正規化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw **不會**針對該請求靜默退回使用 `OPENAI_API_KEY` -
    若要強制使用直接的 OpenAI Images API 路由，請明確設定
    `models.providers.openai`，並提供 API 金鑰、自訂基底 URL
    或 Azure 端點。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。使用
    `gpt-image-1.5` 來輸出透明背景 PNG/WebP；目前的
    `gpt-image-2` API 會拒絕 `background: "transparent"`。

    `gpt-image-2` 透過相同的 `image_generate` 工具，同時支援文字轉影像生成和參考影像編輯。
    OpenClaw 會將 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和參考影像轉送給 OpenAI。OpenAI **不會**直接收到
    `aspectRatio` 或 `resolution`；在可行時，OpenClaw 會將這些對應到支援的 `size`，否則工具會將它們回報為被忽略的覆寫。

    OpenAI 專用選項位於 `openai` 物件之下：

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
    透明輸出需要 `outputFormat` 為 `png` 或 `webp`，以及具備透明能力的 OpenAI 影像模型。OpenClaw 會將預設
    `gpt-image-2` 透明背景請求路由至 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG/WebP 輸出，且會在 PNG 輸出中被忽略。

    最上層的 `background` 提示是提供者中立的，目前在選取 OpenAI 提供者時，會對應到相同的 OpenAI `background` 請求欄位。未宣告支援背景的提供者會在
    `ignoredOverrides` 中回傳它，而不是接收不支援的參數。

    若要將 OpenAI 影像生成路由至 Azure OpenAI 部署，而不是 `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 影像模型">
    Microsoft Foundry 影像生成會在 `microsoft-foundry/` 提供者前綴之下使用已部署的 MAI 影像部署名稱。沒有提供者層級的預設模型，因為 MAI API 預期你在
    `model` 欄位中提供部署名稱：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    該提供者使用 Microsoft Foundry 的 MAI API，而不是 OpenAI Images API：

    - 生成端點：`/mai/v1/images/generations`
    - 編輯端點：`/mai/v1/images/edits`
    - 驗證：`AZURE_OPENAI_API_KEY` / 提供者 API 金鑰，或透過 `az login` 使用 Entra ID
    - 輸出：一張 PNG 影像
    - 尺寸：預設 `1024x1024`；寬度和高度都必須至少為 768 px，
      且總像素數最多為 1,048,576
    - 編輯：一張 PNG 或 JPEG 參考影像，僅由
      `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署支援

    僅提示詞生成可以只設定 Foundry 端點並使用自訂部署名稱。使用自訂部署名稱進行編輯時，需要入門設定/模型中繼資料，讓 OpenClaw 可以驗證該部署是由
    `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 支援。

    目前的 MAI 影像模型為 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e` 和 `MAI-Image-2`。請參閱
    [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry) 以了解設定和聊天模型行為。

  </Accordion>
  <Accordion title="OpenRouter 影像模型">
    OpenRouter 影像生成使用相同的 `OPENROUTER_API_KEY`，並透過 OpenRouter 的聊天補全影像 API 路由。使用 `openrouter/` 前綴選取
    OpenRouter 影像模型：

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

    OpenClaw 會將 `prompt`、`count`、參考影像，以及 Gemini 相容的 `aspectRatio` / `resolution` 提示轉送給 OpenRouter。
    目前內建的 OpenRouter 影像模型捷徑包含
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你已設定的外掛公開了哪些項目。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型使用 fal 原生 Krea schema，而不是 Flux 使用的通用
    `image_size` schema。OpenClaw 會傳送：

    - 用於長寬比提示的 `aspect_ratio`
    - `creativity`，預設為 `medium`
    - 當提供 `image` 或 `images` 時使用 `image_style_references`

    選取 Krea 2 Medium 可獲得較快且表現力強的插畫；選取 Krea 2 Large 可獲得較慢、細節更豐富的擬真與紋理外觀：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 目前每個請求會回傳一張影像。對 Krea 偏好使用 `aspectRatio`；OpenClaw 會將 `size` 對應到最接近的受支援 Krea 長寬比，並會拒絕 Krea 的 `resolution`，而不是丟棄它。當你想使用原生 Krea 創意等級時，請使用 `fal.creativity`：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax 雙重驗證">
    MiniMax 影像生成可透過兩種 bundled MiniMax 驗證路徑使用：

    - API 金鑰設定使用 `minimax/image-01`
    - OAuth 設定使用 `minimax-portal/image-01`

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    bundled xAI 提供者會對僅提示詞請求使用 `/v1/images/generations`，並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 數量：最多 4
    - 參考：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的影像附件形式回傳

    OpenClaw 有意不公開 xAI 原生的 `quality`、`mask`、`user` 或額外的僅原生長寬比，直到這些控制項存在於共享的跨提供者 `image_generate` 合約中。

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

等效命令列介面：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="生成（OpenAI 低品質）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

等效命令列介面：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="產生（兩個正方形）">
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
  <Tab title="Krea 風格參考">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

相同的 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 旗標也可用於 `openclaw infer image edit`；
`--openai-background` 仍保留為 OpenAI 專用別名。除了 OpenAI 以外的內建供應商
目前未宣告明確的背景控制，因此
`background: "transparent"` 會回報為已忽略。

## 相關

- [工具總覽](/zh-TW/tools) - 所有可用的代理工具
- [ComfyUI](/zh-TW/providers/comfy) - 本機 ComfyUI 與 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) - fal 圖片與影片供應商設定
- [Google (Gemini)](/zh-TW/providers/google) - Gemini 圖片供應商設定
- [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry) - Microsoft Foundry 聊天與 MAI 圖片設定
- [MiniMax](/zh-TW/providers/minimax) - MiniMax 圖片供應商設定
- [OpenAI](/zh-TW/providers/openai) - OpenAI Images 供應商設定
- [Vydra](/zh-TW/providers/vydra) - Vydra 圖片、影片與語音設定
- [xAI](/zh-TW/providers/xai) - Grok 圖片、影片、搜尋、程式碼執行與 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) - 模型設定與容錯移轉

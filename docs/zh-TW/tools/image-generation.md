---
read_when:
    - 透過代理程式產生或編輯圖片
    - 設定影像生成供應商和模型
    - 瞭解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 image_generate 使用 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 產生及編輯圖片
title: 影像生成
x-i18n:
    generated_at: "2026-07-19T14:04:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: add6114760bef9e137b2888b7610c8866253bb6638f6957f7a09a33cdf4d0d22
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具會透過你設定的提供者建立及編輯圖片。在聊天工作階段中，它會以非同步方式執行：OpenClaw 會記錄一項背景工作、立即傳回工作 ID，並在提供者完成時喚醒代理程式。完成作業的代理程式會遵循工作階段的一般可見回覆模式：若已設定，便自動傳送最終回覆；若工作階段要求使用訊息工具，則使用 `message(action="send")`。如果請求者工作階段處於非作用中狀態，或其主動喚醒失敗，OpenClaw 會傳送包含所產生圖片的冪等直接備援訊息，確保結果不會遺失。

<Note>
此工具只會在至少有一個圖片生成提供者可用時出現。如果代理程式的工具中沒有 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定提供者 API 金鑰，或使用 OpenAI ChatGPT/Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個提供者設定 API 金鑰（例如 `OPENAI_API_KEY`、
    `GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登入。
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

    ChatGPT/Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定
    `openai` OAuth 設定檔後，OpenClaw 會透過該 OAuth 設定檔路由圖片請求，而不會先嘗試 `OPENAI_API_KEY`。
    明確設定 `models.providers.openai`（API 金鑰、自訂/Azure 基底 URL）
    會重新選用直接的 OpenAI Images API 路由。

  </Step>
  <Step title="向代理程式提出要求">
    _“生成一張友善機器人吉祥物的圖片。”_

    代理程式會自動呼叫 `image_generate`。不需要將工具加入允許清單——只要有提供者可用，此工具預設就會啟用。工具會傳回背景工作 ID，接著完成作業的代理程式會在圖片就緒時，透過 `message` 工具傳送所生成的附件。

  </Step>
</Steps>

<Warning>
對於 LocalAI 等 OpenAI 相容的 LAN 端點，請保留自訂的
`models.providers.openai.baseUrl`，並使用
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選用。
私人與內部圖片端點預設仍會遭到封鎖。
</Warning>

## 常用路由

| 目標                                                 | 模型參照                                          | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 圖片生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 圖片生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 圖片生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表現力／風格導向生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 圖片生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 圖片生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 圖片生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 圖片生成                       | `google/gemini-3.1-flash-image`                    | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一個工具可處理文字轉圖片與參考圖片編輯。單張參考圖片請使用 `image`，多張則使用 `images`。對於 fal 上的 Krea 2 模型，這些參考圖片會作為風格參考傳送，而非編輯輸入。
提供者支援的輸出提示（例如 `quality`、`outputFormat` 和
`background`）會在可用時轉送；若提供者未宣告支援，則會回報為已忽略。內建的透明背景支援僅適用於 OpenAI；如果其他提供者的後端會輸出 PNG Alpha 色版，也可能保留透明度。

## 支援的提供者

| 提供者          | 預設模型                           | 編輯支援                       | 驗證                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 張圖片，由工作流程設定） | `COMFY_API_KEY`，雲端則使用 `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 張圖片）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（模型特定限制）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image`                | 是（最多 5 張圖片）               | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 張輸入圖片）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（僅限 MAI-Image-2.5 模型）    | `AZURE_OPENAI_API_KEY` 或 Entra ID（`az login`）       |
| MiniMax           | `image-01`                              | 是（主體參考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| OpenAI            | `gpt-image-2`                           | 是（最多 5 張圖片）               | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入圖片）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 3 張圖片）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 可在執行階段檢查可用的提供者與模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 可檢查目前工作階段中作用中的圖片生成工作：

```text
/tool image_generate action=status
```

## 提供者功能

| 功能            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（數量上限）  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編輯／參考      | 1 張圖片（工作流程） | 1 張圖片   | Flux：1；GPT：10；Krea 風格參考：10；NB2：14 | 最多 5 張圖片 | 1 張圖片           | 1 張圖片（主體參考） | 最多 5 張圖片 | -     | 最多 3 張圖片 |
| 尺寸控制          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最高 4K       | -     | -              |
| 長寬比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解析度（1K/2K/4K） | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K、2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  圖片生成提示詞。`action: "generate"` 必須提供此參數。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 檢查作用中的工作階段工作，或使用 `"list"` 在執行階段檢查可用的提供者與模型。
</ParamField>
<ParamField path="model" type="string">
  覆寫提供者／模型（例如 `openai/gpt-image-2`）。如需透明 OpenAI 背景，請使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  編輯模式的單張參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式或風格參考模型所用的多張參考圖片（透過共用工具最多可傳入 14 張；仍須遵守提供者特定限制）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、
  `4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、
  `1:4`、`8:1`、`1:8`。提供者會驗證其模型特定的子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供者支援時所用的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供者支援時所用的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供者支援時所用的背景提示。對於支援透明度的提供者，請搭配 `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要生成的圖片數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  選用的提供者請求逾時時間，單位為毫秒。當 Codex 透過動態工具呼叫
  `image_generate` 時，此每次呼叫的值仍會覆寫已設定的預設值，且上限為 600000 ms。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 創意控制。預設為 `medium`。
</ParamField>

<Note>
並非所有提供者都支援全部參數。當備援提供者支援的是接近的幾何選項，而非完全符合要求的選項時，OpenClaw 會在提交前重新對應至最接近的受支援尺寸、長寬比或解析度。
對於未宣告支援的提供者，不受支援的輸出提示會遭到捨棄，並在工具結果中回報。工具結果會回報實際套用的設定；`details.normalization` 會記錄從要求值到套用值的轉換。
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
          "google/gemini-3.1-flash-image",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### 提供者選擇順序

OpenClaw 會依照以下順序嘗試提供者：

1. 工具呼叫中的 **`model` 參數**（若代理指定）。
2. 設定中的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測**——僅限有認證資訊支援的提供者預設值：
   - 目前的預設提供者優先；
   - 其餘已註冊的圖片生成提供者依提供者 ID 排序。

若提供者失敗（認證錯誤、速率限制等），系統會自動嘗試下一個已設定的
候選項目。若全部失敗，錯誤會包含每次嘗試的詳細資訊。

<AccordionGroup>
  <Accordion title="每次呼叫的模型覆寫均為精確指定">
    每次呼叫的 `model` 覆寫只會嘗試該提供者／模型，且不會
    繼續嘗試已設定的主要／備援或自動偵測的提供者。
  </Accordion>
  <Accordion title="自動偵測會考量認證狀態">
    只有在 OpenClaw 確實能向該提供者進行認證時，其提供者預設值
    才會加入候選清單。設定
    `agents.defaults.mediaGenerationAutoProviderFallback: false`，即可只使用明確指定的
    `model`、`primary` 和 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對於速度較慢的圖片後端，請設定 `agents.defaults.imageGenerationModel.timeoutMs`。
    每次呼叫的 `timeoutMs` 工具參數會覆寫設定的預設值，而設定的預設值
    會覆寫由外掛定義的提供者預設值。Google 和 OpenRouter 託管的圖片提供者
    預設為 180 秒；Microsoft Foundry MAI、xAI 和 Azure OpenAI 圖片生成則
    預設為 600 秒。Codex 動態工具呼叫使用 120 秒的 `image_generate`
    橋接預設值，並在已設定時採用相同的逾時額度，但受限於
    OpenClaw 的 600000 ms 動態工具橋接上限。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的提供者、
    其預設模型，以及認證環境變數提示。
  </Accordion>
</AccordionGroup>

### 圖片編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI 和 xAI 支援編輯參考圖片。fal 上的 Krea 2 模型會將相同的
`image`／`images` 欄位用作風格參考，而非編輯輸入。
傳入參考圖片路徑或 URL：

```text
"生成這張照片的水彩版本" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter 和 Google 可透過 `images` 參數支援最多 5 張
參考圖片；xAI 最多支援 3 張。fal 的 Flux 圖生圖支援 1 張參考圖片、
GPT Image 2 編輯最多支援 10 張、Krea 2 最多支援 10 張風格參考，
Nano Banana 2 編輯最多支援 14 張。Microsoft Foundry、MiniMax 和
ComfyUI 支援 1 張。

## 提供者深入解析

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 圖片生成預設使用 `openai/gpt-image-2`。若已設定
    `openai` OAuth 設定檔，OpenClaw 會重複使用 Codex 訂閱聊天模型
    所使用的同一個 OAuth 設定檔，並透過 Codex Responses 後端傳送
    圖片請求。舊版 Codex 基底 URL（例如 `https://chatgpt.com/backend-api`）
    會針對圖片請求正規化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw **不會**針對該請求
    靜默回退至 `OPENAI_API_KEY`——若要強制直接路由至 OpenAI Images API，
    請明確設定 `models.providers.openai`，並提供 API 金鑰、自訂基底 URL
    或 Azure 端點。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。若要輸出透明背景的 PNG／WebP，請使用
    `gpt-image-1.5`；目前的 `gpt-image-2` API 會拒絕
    `background: "transparent"`。

    `gpt-image-2` 透過相同的 `image_generate` 工具，同時支援
    文字生成圖片與參考圖片編輯。OpenClaw 會將 `prompt`、
    `count`、`size`、`quality`、`outputFormat`
    及參考圖片轉送給 OpenAI。OpenAI 不會直接收到
    `aspectRatio` 或 `resolution`；OpenClaw 會在可行時將其對應至
    支援的 `size`，否則工具會將其回報為已忽略的覆寫。

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

    `openai.background` 接受 `transparent`、`opaque` 或
    `auto`；透明輸出需要 `outputFormat` `png`
    或 `webp`，以及支援透明度的 OpenAI 圖片模型。OpenClaw 會將
    預設的 `gpt-image-2` 透明背景請求路由至 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG／WebP 輸出，對 PNG 輸出則會忽略。

    頂層 `background` 提示與提供者無關，目前在選取 OpenAI 提供者時，
    會對應至相同的 OpenAI `background` 請求欄位。未宣告支援背景的
    提供者會改為在 `ignoredOverrides` 中回傳此項，而不會收到不支援的參數。

    若要將 OpenAI 圖片生成路由至 Azure OpenAI 部署，而非
    `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 圖片模型">
    Microsoft Foundry 圖片生成使用 `microsoft-foundry/` 提供者前綴下
    已部署的 MAI 圖片部署名稱。此提供者沒有提供者層級的預設模型，
    因為 MAI API 預期在 `model` 欄位中收到你的部署名稱：

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

    此提供者使用 Microsoft Foundry 的 MAI API，而非 OpenAI Images API：

    - 生成端點：`/mai/v1/images/generations`
    - 編輯端點：`/mai/v1/images/edits`
    - 認證：`AZURE_OPENAI_API_KEY`／提供者 API 金鑰，或透過 `az login` 使用 Entra ID
    - 輸出：一張 PNG 圖片
    - 尺寸：預設為 `1024x1024`；寬度與高度都必須至少為 768 px，
      且總像素數不得超過 1,048,576
    - 編輯：一張 PNG 或 JPEG 參考圖片，僅
      `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署支援

    僅提示詞生成可在只設定 Foundry 端點的情況下使用自訂部署名稱。
    若使用自訂部署名稱進行編輯，則需要新手設定／模型中繼資料，
    讓 OpenClaw 能確認該部署由 `MAI-Image-2.5-Flash` 或
    `MAI-Image-2.5` 支援。

    目前的 MAI 圖片模型為 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e` 和 `MAI-Image-2`。設定方式與聊天模型行為請參閱
    [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry)。

  </Accordion>
  <Accordion title="OpenRouter 圖片模型">
    OpenRouter 圖片生成使用相同的 `OPENROUTER_API_KEY`，並透過
    OpenRouter 的聊天補全圖片 API 路由。使用 `openrouter/` 前綴
    選取 OpenRouter 圖片模型：

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

    OpenClaw 會將 `prompt`、`count`、參考圖片，以及
    與 Gemini 相容的 `aspectRatio`／`resolution` 提示轉送給
    OpenRouter。目前內建的 OpenRouter 圖片模型捷徑包括
    `google/gemini-3.1-flash-image`、
    `google/gemini-3-pro-image` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看已設定的外掛公開哪些項目。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型使用 fal 原生的 Krea 結構描述，而非 Flux 所使用的
    通用 `image_size` 結構描述。OpenClaw 會傳送：

    - `aspect_ratio`，用於長寬比提示
    - `creativity`，預設為 `medium`
    - 提供 `image` 或 `images` 時使用 `image_style_references`

    若想要更快速且富有表現力的插畫，請選擇 Krea 2 Medium；若想要速度較慢、
    細節更豐富的擬真與紋理效果，請選擇 Krea 2 Large：

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

    Krea 2 目前每次請求會回傳一張圖片。Krea 建議使用 `aspectRatio`；
    OpenClaw 會將 `size` 對應至最接近且受支援的 Krea 長寬比，
    並會拒絕 Krea 的 `resolution`，而不是直接捨棄它。若想使用
    Krea 原生的創意程度，請使用 `fal.creativity`：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "具有孔版印刷紋理的賽博雜誌人像",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax 雙重認證">
    MiniMax 圖片生成可透過兩種隨附的 MiniMax 認證路徑使用：

    - `minimax/image-01`，用於 API 金鑰設定
    - `minimax-portal/image-01`，用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    隨附的 xAI 提供者會對僅含提示詞的請求使用 `/v1/images/generations`，
    並在存在 `image` 或 `images` 時使用
    `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 數量：最多 4 張
    - 參考：一個 `image` 或最多三個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的圖片附件形式回傳

    OpenClaw 刻意不公開 xAI 原生的 `quality`、`mask`、
    `user` 或 `auto` 長寬比，直到共用的跨提供者
    `image_generate` 合約支援這些控制項為止。

  </Accordion>
</AccordionGroup>

## 範例

<Tabs>
  <Tab title="生成（4K 橫向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="OpenClaw 圖片生成的簡潔編輯風格海報" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="透明背景上的簡單紅色圓形貼紙" outputFormat=png background=transparent
```

等效的命令列介面：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "透明背景上的簡單紅色圓形貼紙" \
  --json
```

  </Tab>
  <Tab title="生成（OpenAI 低品質）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="安靜生產力應用程式的低成本海報草稿" quality=low openai='{"moderation":"low"}'
```

等效的命令列介面：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "適合安靜生產力應用程式的低成本海報草稿" \
  --json
```

  </Tab>
  <Tab title="生成（兩張正方形圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="為平靜風格的生產力應用程式圖示提供兩種視覺方向" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編輯（一張參考圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="保留主體，將背景替換為明亮的攝影棚場景" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編輯（多張參考圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="結合第一張圖片的角色特徵與第二張圖片的配色" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea 風格參考圖片">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="使用此配色與印刷紋理製作富有表現力的編輯風格人像" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

`openclaw infer image edit` 也提供相同的 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 旗標；
`--openai-background` 仍是 OpenAI 專用的別名。目前 OpenAI 以外的內建提供者
並未宣告明確的背景控制，因此對這些提供者而言，
`background: "transparent"` 會回報為已忽略。

## 相關內容

- [工具概覽](/zh-TW/tools) - 所有可用的代理程式工具
- [ComfyUI](/zh-TW/providers/comfy) - 本機 ComfyUI 與 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) - fal 圖片與影片提供者設定
- [Google (Gemini)](/zh-TW/providers/google) - Gemini 圖片提供者設定
- [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry) - Microsoft Foundry 聊天與 MAI 圖片設定
- [MiniMax](/zh-TW/providers/minimax) - MiniMax 圖片提供者設定
- [OpenAI](/zh-TW/providers/openai) - OpenAI Images 提供者設定
- [Vydra](/zh-TW/providers/vydra) - Vydra 圖片、影片與語音設定
- [xAI](/zh-TW/providers/xai) - Grok 圖片、影片、搜尋、程式碼執行與 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) - 模型設定與容錯移轉

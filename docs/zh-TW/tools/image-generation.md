---
read_when:
    - 透過代理程式產生或編輯圖片
    - 設定影像生成供應商和模型
    - 了解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 image_generate 在 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 中產生及編輯圖片
title: 圖片生成
x-i18n:
    generated_at: "2026-07-12T14:53:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具會透過你設定的供應商建立及編輯圖片。在聊天工作階段中，它會以非同步方式執行：OpenClaw 會記錄背景工作、立即傳回工作 ID，並在供應商完成時喚醒代理。完成工作的代理會遵循工作階段的一般可見回覆模式：若已設定，便自動傳送最終回覆；若工作階段要求使用訊息工具，則使用 `message(action="send")`。如果提出要求的工作階段處於非使用中狀態，或其主動喚醒失敗，OpenClaw 會直接傳送具冪等性的備援訊息及產生的圖片，確保結果不會遺失。

<Note>
此工具僅會在至少有一個圖片產生供應商可用時出現。如果你在代理的工具中看不到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定供應商 API 金鑰，或使用 OpenAI ChatGPT/Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個供應商設定 API 金鑰（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登入。
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

    ChatGPT/Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定 `openai` OAuth 設定檔後，OpenClaw 會透過該 OAuth 設定檔路由圖片要求，而不會先嘗試使用 `OPENAI_API_KEY`。明確設定 `models.providers.openai`（API 金鑰、自訂/Azure 基底 URL）則會改回直接使用 OpenAI Images API 的路徑。

  </Step>
  <Step title="向代理提出要求">
    _“產生一張友善機器人吉祥物的圖片。”_

    代理會自動呼叫 `image_generate`。不需要將工具加入允許清單——只要有供應商可用，預設便會啟用此工具。工具會傳回背景工作 ID，接著完成工作的代理會在圖片就緒後，透過 `message` 工具傳送產生的附件。

  </Step>
</Steps>

<Warning>
對於 LocalAI 等與 OpenAI 相容的區域網路端點，請保留自訂的 `models.providers.openai.baseUrl`，並使用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選擇加入。私人及內部圖片端點預設仍會遭到封鎖。
</Warning>

## 常見路徑

| 目標                                                 | 模型參照                                           | 驗證方式                               |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 圖片產生                      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 圖片產生                | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP                             | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 圖片產生                                   | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表現力／風格導向產生                      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 圖片產生                                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 圖片產生                                     | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 圖片產生                       | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 圖片產生                               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一個工具可處理文字轉圖片和參考圖片編輯。單張參考圖片請使用 `image`，多張則使用 `images`。對於 fal 上的 Krea 2 模型，這些參考圖片會作為風格參考傳送，而不是編輯輸入。
供應商支援的輸出提示（例如 `quality`、`outputFormat` 和 `background`）會在可用時轉送；如果供應商未宣告支援，則會回報為已忽略。內建的透明背景支援是 OpenAI 專屬功能；如果其他供應商的後端會輸出 PNG Alpha，它們仍可能保留透明度。

## 支援的供應商

| 供應商            | 預設模型                                | 編輯支援                         | 驗證方式                                              |
| ----------------- | --------------------------------------- | -------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 張圖片，由工作流程設定）   | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`     |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 張圖片）                   | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（模型特定限制）               | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 是（最多 5 張圖片）              | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 張輸入圖片）          | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（僅限 MAI-Image-2.5 模型）    | `AZURE_OPENAI_API_KEY` 或 Entra ID（`az login`）      |
| MiniMax           | `image-01`                              | 是（主體參考）                   | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`）|
| OpenAI            | `gpt-image-2`                           | 是（最多 5 張圖片）              | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入圖片）          | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                               | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 3 張圖片）              | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的供應商和模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 檢查目前工作階段中的作用中圖片產生工作：

```text
/tool image_generate action=status
```

## 供應商功能

| 功能                  | ComfyUI              | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax                 | OpenAI         | Vydra | xAI            |
| --------------------- | -------------------- | --------- | ---------------------------------------------- | -------------- | ----------------- | ----------------------- | -------------- | ----- | -------------- |
| 產生（數量上限）      | 1                    | 4         | 4                                              | 4              | 1                 | 9                       | 4              | 1     | 4              |
| 編輯／參考            | 1 張圖片（工作流程） | 1 張圖片  | Flux：1；GPT：10；Krea 風格參考：10；NB2：14  | 最多 5 張圖片  | 1 張圖片          | 1 張圖片（主體參考）   | 最多 5 張圖片  | -     | 最多 3 張圖片  |
| 尺寸控制              | -                    | ✓         | ✓                                              | ✓              | ✓                 | -                       | 最大 4K        | -     | -              |
| 長寬比                | -                    | -         | ✓                                              | ✓              | -                 | ✓                       | -              | -     | ✓              |
| 解析度（1K/2K/4K）    | -                    | -         | ✓                                              | ✓              | -                 | -                       | -              | -     | 1K, 2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  圖片產生提示。`action: "generate"` 必須提供此參數。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 檢查作用中的工作階段工作，或使用 `"list"` 在執行階段檢查可用的供應商和模型。
</ParamField>
<ParamField path="model" type="string">
  供應商／模型覆寫（例如 `openai/gpt-image-2`）。若要使用 OpenAI 透明背景，請使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  編輯模式使用的單張參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式或風格參考模型使用的多張參考圖片（透過共用工具最多可使用 14 張；仍會套用供應商特定限制）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、`1:4`、`8:1`、`1:8`。供應商會驗證其模型特定的子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  供應商支援時使用的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  供應商支援時使用的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  供應商支援時使用的背景提示。對於支援透明度的供應商，請搭配 `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要產生的圖片數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  選用的供應商要求逾時時間，單位為毫秒。當 Codex 透過動態工具呼叫 `image_generate` 時，此單次呼叫值仍會覆寫設定的預設值，且上限為 600000 ms。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 創意程度控制。預設為 `medium`。
</ParamField>

<Note>
並非所有供應商都支援所有參數。當備援供應商支援相近的幾何選項，而不支援要求的確切選項時，OpenClaw 會在提交前重新對應至最接近的支援尺寸、長寬比或解析度。對於未宣告支援的供應商，不支援的輸出提示會遭到捨棄，並在工具結果中回報。工具結果會回報實際套用的設定；`details.normalization` 會記錄從要求值到套用值的任何轉換。
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

OpenClaw 會依下列順序嘗試供應商：

1. 來自工具呼叫的 **`model` 參數**（若代理程式有指定）。
2. 來自設定的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測** - 僅使用有驗證支援的提供者預設值：
   - 目前的預設提供者優先；
   - 其餘已註冊的圖片生成提供者依提供者 ID 排序。

若某個提供者失敗（驗證錯誤、速率限制等），系統會自動嘗試下一個已設定的
候選項目。若全部失敗，錯誤會包含每次嘗試的詳細資訊。

<AccordionGroup>
  <Accordion title="每次呼叫的模型覆寫皆為精確指定">
    每次呼叫的 `model` 覆寫只會嘗試該提供者／模型，不會
    繼續嘗試已設定的主要／備援或自動偵測到的提供者。
  </Accordion>
  <Accordion title="自動偵測會考量驗證狀態">
    只有當 OpenClaw 確實能驗證該提供者時，其預設值才會加入
    候選清單。設定
    `agents.defaults.mediaGenerationAutoProviderFallback: false` 即可只使用
    明確指定的 `model`、`primary` 與 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對於較慢的圖片後端，請設定 `agents.defaults.imageGenerationModel.timeoutMs`。
    每次呼叫的 `timeoutMs` 工具參數會覆寫已設定的預設值，
    而已設定的預設值會覆寫由外掛提供者定義的預設值。Google 與 OpenRouter
    託管的圖片提供者預設為 180 秒；Microsoft Foundry MAI、xAI 與 Azure OpenAI
    圖片生成預設為 600 秒。Codex 動態工具呼叫使用 120 秒的
    `image_generate` 橋接預設值；若已設定逾時，也會遵循相同的逾時額度，
    但上限為 OpenClaw 動態工具橋接的 600000 ms。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的提供者、
    其預設模型，以及驗證環境變數提示。
  </Accordion>
</AccordionGroup>

### 圖片編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI 與 xAI 支援編輯參考圖片。fal 上的 Krea 2 模型會將相同的
`image`／`images` 欄位用作風格參考，而非編輯
輸入。傳入參考圖片路徑或 URL：

```text
"產生這張照片的水彩版本" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter 與 Google 透過 `images` 參數支援最多 5 張參考圖片；
xAI 支援最多 3 張。fal 的 Flux 圖片轉圖片支援 1 張參考圖片、
GPT Image 2 編輯支援最多 10 張、Krea 2 支援最多 10 張風格參考圖片，
Nano Banana 2 編輯則支援最多 14 張。Microsoft Foundry、MiniMax
與 ComfyUI 支援 1 張。

## 提供者深入解析

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 圖片生成預設使用 `openai/gpt-image-2`。若已設定
    `openai` OAuth 設定檔，OpenClaw 會重複使用 Codex 訂閱聊天模型所用的
    相同 OAuth 設定檔，並透過 Codex Responses 後端傳送
    圖片請求。對於圖片請求，舊版 Codex 基礎 URL（例如
    `https://chatgpt.com/backend-api`）會被正規化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不會**針對該請求悄悄退回使用 `OPENAI_API_KEY` -
    若要強制直接路由至 OpenAI Images API，請明確設定
    `models.providers.openai`，並提供 API 金鑰、自訂基礎 URL
    或 Azure 端點。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1`
    與 `openai/gpt-image-1-mini` 模型。若要輸出透明背景的
    PNG/WebP，請使用 `gpt-image-1.5`；目前的 `gpt-image-2` API
    會拒絕 `background: "transparent"`。

    `gpt-image-2` 透過相同的 `image_generate` 工具，同時支援文字轉圖片生成
    與參考圖片編輯。OpenClaw 會將 `prompt`、`count`、`size`、`quality`、
    `outputFormat` 與參考圖片轉送至 OpenAI。OpenAI **不會**直接接收
    `aspectRatio` 或 `resolution`；在可行時，OpenClaw 會將其對應至
    支援的 `size`，否則工具會將它們回報為已忽略的覆寫值。

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
    透明輸出要求 `outputFormat` 為 `png` 或 `webp`，且必須使用
    支援透明度的 OpenAI 圖片模型。OpenClaw 會將預設
    `gpt-image-2` 的透明背景請求路由至 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG/WebP 輸出，對 PNG 輸出則會忽略。

    頂層 `background` 提示不受提供者限制，目前選取 OpenAI 提供者時，
    會對應至相同的 OpenAI `background` 請求欄位。不宣告支援背景功能的提供者
    會將其放入 `ignoredOverrides` 傳回，而不會接收這個不支援的參數。

    若要透過 Azure OpenAI 部署路由 OpenAI 圖片生成，而非使用
    `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 圖片模型">
    Microsoft Foundry 圖片生成使用 `microsoft-foundry/` 提供者前綴下
    已部署的 MAI 圖片部署名稱。由於 MAI API 預期在 `model` 欄位中
    使用你的部署名稱，因此沒有提供者層級的預設模型：

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
    - 驗證：`AZURE_OPENAI_API_KEY`／提供者 API 金鑰，或透過 `az login` 使用 Entra ID
    - 輸出：一張 PNG 圖片
    - 尺寸：預設為 `1024x1024`；寬度與高度都必須至少為 768 px，
      且總像素數不得超過 1,048,576
    - 編輯：一張 PNG 或 JPEG 參考圖片，僅
      `MAI-Image-2.5-Flash` 與 `MAI-Image-2.5` 部署支援

    僅使用提示詞生成時，只需設定 Foundry 端點，即可使用自訂部署名稱。
    使用自訂部署名稱進行編輯時，則需要上線引導／模型中繼資料，
    讓 OpenClaw 能驗證該部署是否由 `MAI-Image-2.5-Flash`
    或 `MAI-Image-2.5` 支援。

    目前的 MAI 圖片模型為 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e` 與 `MAI-Image-2`。設定方式與聊天模型行為請參閱
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

    OpenClaw 會將 `prompt`、`count`、參考圖片，以及與 Gemini 相容的
    `aspectRatio`／`resolution` 提示轉送至 OpenRouter。
    目前內建的 OpenRouter 圖片模型捷徑包括
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 與 `openai/gpt-5.4-image-2`。
    使用 `action: "list"` 查看你所設定的外掛公開哪些項目。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型使用 fal 原生的 Krea 結構描述，而非 Flux 使用的通用
    `image_size` 結構描述。OpenClaw 會傳送：

    - 用於長寬比提示的 `aspect_ratio`
    - `creativity`，預設為 `medium`
    - 提供 `image` 或 `images` 時使用 `image_style_references`

    選擇 Krea 2 Medium 可更快速地產生富有表現力的插圖；選擇 Krea 2 Large
    則能以較慢速度產生更精細的寫實與紋理效果：

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

    Krea 2 目前每次請求傳回一張圖片。使用 Krea 時，建議優先使用
    `aspectRatio`；OpenClaw 會將 `size` 對應至最接近且受支援的 Krea 長寬比，
    並會拒絕 Krea 的 `resolution`，而非直接捨棄。若要指定 Krea 原生的創意程度，
    請使用 `fal.creativity`：

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "帶有孔版印刷紋理的賽博雜誌肖像",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax 雙重驗證">
    可透過兩種內建 MiniMax 驗證路徑使用 MiniMax 圖片生成：

    - `minimax/image-01` 用於 API 金鑰設定
    - `minimax-portal/image-01` 用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    內建 xAI 提供者對僅含提示詞的請求使用 `/v1/images/generations`，
    並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 數量：最多 4
    - 參考圖片：一個 `image` 或最多三個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`、`2:1`、
      `1:2`、`19.5:9`、`9:19.5`、`20:9`、`9:20`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的圖片附件傳回

    在這些控制項尚未存在於共用的跨提供者 `image_generate` 合約之前，
    OpenClaw 刻意不公開 xAI 原生的 `quality`、`mask`、`user`
    或 `auto` 長寬比。

  </Accordion>
</AccordionGroup>

## 範例

<Tabs>
  <Tab title="生成（4K 橫向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="一張簡潔的 OpenClaw 圖片生成編輯風格海報" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="透明背景上的簡單紅色圓形貼紙" outputFormat=png background=transparent
```

對應的命令列介面：

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
/tool image_generate action=generate model=openai/gpt-image-2 prompt="為安靜的生產力應用程式製作低成本海報草稿" quality=low openai='{"moderation":"low"}'
```

對應的命令列介面：

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "為安靜的生產力應用程式製作低成本海報草稿" \
  --json
```

  </Tab>
  <Tab title="生成（兩張正方形圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="為一款沉靜的生產力應用程式圖示提供兩種視覺方向" size=1024x1024 count=2
```
  </Tab>
  <Tab title="編輯（一張參考圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="保留主體，將背景替換為明亮的攝影棚場景" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="編輯（多張參考圖片）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="結合第一張圖片中的角色特徵與第二張圖片中的調色盤" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea 風格參考">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="使用此調色盤與印刷紋理創作一幅富有表現力的編輯風格人像" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

`openclaw infer image edit` 同樣提供 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 旗標；`--openai-background` 仍保留為 OpenAI 專用別名。目前除 OpenAI
以外的內建提供者未宣告明確的背景控制功能，因此對這些提供者使用
`background: "transparent"` 時，系統會回報該設定已被忽略。

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

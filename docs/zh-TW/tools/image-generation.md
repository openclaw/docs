---
read_when:
    - 透過代理產生或編輯圖片
    - 設定圖片生成提供者與模型
    - 了解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 `image_generate` 在 OpenAI、Google、fal、Microsoft Foundry、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 產生和編輯圖片
title: 影像生成
x-i18n:
    generated_at: "2026-07-05T11:46:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ec9aff49f988503a5205abf538fc30a99460eb0b77d7bddd6dde74f2845a6d0
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具會透過你設定的供應商建立和編輯影像。在聊天工作階段中，它會以非同步方式執行：OpenClaw 會記錄一個背景工作、立即傳回工作 ID，並在供應商完成時喚醒代理程式。完成代理程式會遵循該工作階段的一般可見回覆模式：若已設定，會自動傳遞最終回覆；或者當工作階段需要訊息工具時，使用 `message(action="send")`。如果請求者工作階段處於非作用中狀態，或其作用中的喚醒失敗，OpenClaw 會傳送包含已產生影像的冪等直接備援，避免結果遺失。

<Note>
此工具只會在至少有一個影像生成供應商可用時出現。如果你在代理程式的工具中看不到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定供應商 API 金鑰，或使用 OpenAI ChatGPT/Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個供應商設定 API 金鑰（例如 `OPENAI_API_KEY`、
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
    `openai` OAuth 設定檔時，OpenClaw 會透過該 OAuth 設定檔路由影像請求，而不是先嘗試 `OPENAI_API_KEY`。
    明確的 `models.providers.openai` 設定（API 金鑰、自訂/Azure 基底 URL）
    會改回使用直接 OpenAI Images API 路由。

  </Step>
  <Step title="詢問代理程式">
    _「產生一張友善機器人吉祥物的影像。」_

    代理程式會自動呼叫 `image_generate`。不需要工具允許清單：
    只要供應商可用，它就會預設啟用。此工具會傳回背景工作 ID，接著完成代理程式會在準備就緒時，透過 `message` 工具傳送產生的附件。

  </Step>
</Steps>

<Warning>
對於 LocalAI 等 OpenAI 相容的 LAN 端點，請保留自訂
`models.providers.openai.baseUrl`，並使用
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選擇啟用。
私有與內部影像端點預設仍會被封鎖。
</Warning>

## 常見路由

| 目標                                                 | 模型參照                                          | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 影像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 影像生成 | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 影像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 表現力/風格導向生成      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter 影像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 影像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI 影像生成               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` 或 Entra ID     |
| Google Gemini 影像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一個工具可處理文字轉影像與參考影像編輯。使用 `image`
提供單一參考，或使用 `images` 提供多個參考。對於 fal 上的 Krea 2 模型，這些參考會作為風格參考傳送，而不是編輯輸入。
供應商支援的輸出提示（例如 `quality`、`outputFormat` 和
`background`）會在可用時轉送；若供應商未宣告支援，則會回報為已忽略。內建的透明背景支援為 OpenAI 專用；其他供應商若其後端輸出 PNG alpha，仍可能保留透明度。

## 支援的供應商

| 供應商          | 預設模型                           | 編輯支援                       | 驗證                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | 是（1 張影像，由工作流程設定） | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | 是（1 張影像）                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | 是（模型特定限制）        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | 是（最多 5 張影像）               | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | 是（最多 5 張輸入影像）         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | 是（僅限 MAI-Image-2.5 模型）    | `AZURE_OPENAI_API_KEY` 或 Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | 是（主體參考）            | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | 是（最多 5 張影像）               | `OPENAI_API_KEY` 或 OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入影像）         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | 是（最多 5 張影像）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的供應商與模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 檢查目前工作階段中的作用中影像生成工作：

```text
/tool image_generate action=status
```

## 供應商能力

| 能力            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大數量）  | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| 編輯 / 參考      | 1 張影像（工作流程） | 1 張影像   | Flux: 1; GPT: 10; Krea 風格參考: 10; NB2: 14 | 最多 5 張影像 | 1 張影像           | 1 張影像（主體參考） | 最多 5 張影像 | -     | 最多 5 張影像 |
| 尺寸控制          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | 最高 4K       | -     | -              |
| 長寬比          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| 解析度 (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  影像生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 檢查作用中的工作階段工作，或使用 `"list"` 在執行階段檢查可用的供應商與模型。
</ParamField>
<ParamField path="model" type="string">
  供應商/模型覆寫（例如 `openai/gpt-image-2`）。使用
  `openai/gpt-image-1.5` 取得透明 OpenAI 背景。
</ParamField>
<ParamField path="image" type="string">
  編輯模式的單一參考影像路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式或風格參考模型的多個參考影像（透過共用工具最多 14 張；
  供應商特定限制仍然適用）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:1`、`20:9`、`19.5:9`、`2:3`、`3:2`、`2.35:1`、`3:4`、
  `4:3`、`4:5`、`5:4`、`9:16`、`9:19.5`、`9:20`、`16:9`、`21:9`、`1:2`、`4:1`、
  `1:4`、`8:1`、`1:8`。供應商會驗證其模型特定子集。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  供應商支援時使用的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  供應商支援時使用的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  供應商支援時使用的背景提示。對於具備透明度能力的供應商，請搭配
  `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要產生的影像數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">
  選用的供應商請求逾時，單位為毫秒。當 Codex 透過動態工具呼叫
  `image_generate` 時，這個逐次呼叫的值仍會覆寫設定的預設值，且上限為 600000 ms。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  fal Krea 2 創意控制。預設為 `medium`。
</ParamField>

<Note>
並非所有供應商都支援所有參數。當備援供應商支援接近的幾何選項，而非精確請求的選項時，OpenClaw 會在提交前重新對應到最接近的支援尺寸、長寬比或解析度。
對於未宣告支援的供應商，不支援的輸出提示會被捨棄，並在工具結果中回報。工具結果會回報套用的設定；`details.normalization` 會擷取任何從請求到套用的轉換。
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

OpenClaw 會依照以下順序嘗試供應商：

1. 工具呼叫中的 **`model` 參數**（如果代理指定了其中一個）。
2. 設定中的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測** - 僅限具備驗證支援的提供者預設值：
   - 目前的預設提供者優先；
   - 其餘已註冊的影像生成提供者，依 provider-id 順序排列。

如果某個提供者失敗（驗證錯誤、速率限制等），系統會自動嘗試下一個已設定的
候選項目。如果全部失敗，錯誤會包含每次嘗試的詳細資訊。

<AccordionGroup>
  <Accordion title="個別呼叫模型覆寫是精確的">
    個別呼叫的 `model` 覆寫只會嘗試該提供者/模型，並且不會
    繼續使用已設定的 primary/fallback 或自動偵測的提供者。
  </Accordion>
  <Accordion title="自動偵測會感知驗證狀態">
    只有在 OpenClaw 實際上能夠驗證該提供者時，提供者預設值才會
    進入候選清單。設定
    `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用
    明確的 `model`、`primary` 和 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    為速度較慢的影像後端設定 `agents.defaults.imageGenerationModel.timeoutMs`。
    個別呼叫的 `timeoutMs` 工具參數會覆寫已設定的預設值，而已設定的預設值會覆寫外掛作者提供的提供者
    預設值。Google 和 OpenRouter 託管的影像提供者使用 180 秒
    預設值；Microsoft Foundry MAI、xAI 和 Azure OpenAI 影像生成使用
    600 秒。Codex 動態工具呼叫使用 120 秒的 `image_generate`
    橋接預設值，並在已設定時遵循相同的逾時預算，且受限於
    OpenClaw 的 600000 ms 動態工具橋接上限。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的提供者、
    它們的預設模型，以及驗證 env-var 提示。
  </Accordion>
</AccordionGroup>

### 影像編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、Microsoft Foundry、MiniMax、
ComfyUI 和 xAI 支援編輯參考影像。fal 上的 Krea 2 模型會使用
相同的 `image` / `images` 欄位作為風格參考，而不是編輯
輸入。傳入參考影像路徑或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 透過
`images` 參數最多支援 5 張參考影像。fal 針對 Flux image-to-image 支援 1 張參考影像，
針對 GPT Image 2 edits 最多支援 10 張，針對 Krea 2 最多支援 10 個風格參考，並且針對
Nano Banana 2 edits 最多支援 14 張。Microsoft Foundry、MiniMax 和 ComfyUI
支援 1 張。

## 提供者深入介紹

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（以及 gpt-image-1.5）">
    OpenAI 影像生成預設為 `openai/gpt-image-2`。如果已設定
    `openai` OAuth 設定檔，OpenClaw 會重用
    Codex 訂閱聊天模型所使用的相同 OAuth 設定檔，並透過
    Codex Responses 後端傳送影像請求。舊版 Codex 基底
    URL（例如 `https://chatgpt.com/backend-api`）會針對影像請求正規化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不會** 對該請求靜默退回到 `OPENAI_API_KEY` -
    若要強制直接路由至 OpenAI Images API，請以 API key、自訂基底 URL
    或 Azure endpoint 明確設定
    `models.providers.openai`。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。使用
    `gpt-image-1.5` 產生透明背景的 PNG/WebP 輸出；目前的
    `gpt-image-2` API 會拒絕 `background: "transparent"`。

    `gpt-image-2` 同時支援文字轉影像生成，以及透過相同的 `image_generate` 工具進行
    參考影像編輯。
    OpenClaw 會將 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和參考影像轉送給 OpenAI。OpenAI 不會直接接收
    `aspectRatio` 或 `resolution`；在可能的情況下，OpenClaw 會將
    它們對應到支援的 `size`，否則工具會將它們回報為
    已忽略的覆寫。

    OpenAI 專屬選項位於 `openai` 物件下：

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
    透明輸出需要 `outputFormat` 為 `png` 或 `webp`，以及
    具備透明度能力的 OpenAI 影像模型。OpenClaw 會將預設
    `gpt-image-2` 透明背景請求路由到 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG/WebP 輸出，並會在
    PNG 輸出中被忽略。

    最上層的 `background` 提示是提供者中立的，目前在選取 OpenAI 提供者時會
    對應到相同的 OpenAI `background` 請求欄位。
    未宣告背景支援的提供者會在 `ignoredOverrides` 中回傳
    它，而不是接收不支援的參數。

    若要透過 Azure OpenAI 部署路由 OpenAI 影像生成，
    而不是使用 `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="Microsoft Foundry MAI 影像模型">
    Microsoft Foundry 影像生成會使用
    `microsoft-foundry/` 提供者前綴下已部署的 MAI 影像部署名稱。沒有提供者層級的
    預設模型，因為 MAI API 預期你的部署名稱位於
    `model` 欄位中：

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

    此提供者使用 Microsoft Foundry 的 MAI API，而不是 OpenAI Images API：

    - 生成端點：`/mai/v1/images/generations`
    - 編輯端點：`/mai/v1/images/edits`
    - 驗證：`AZURE_OPENAI_API_KEY` / 提供者 API key，或透過 `az login` 使用 Entra ID
    - 輸出：一張 PNG 影像
    - 大小：預設 `1024x1024`；寬度和高度都必須至少為 768 px，
      且總像素最多為 1,048,576
    - 編輯：一張 PNG 或 JPEG 參考影像，僅由
      `MAI-Image-2.5-Flash` 和 `MAI-Image-2.5` 部署支援

    僅提示詞生成可以只設定 Foundry endpoint，並使用自訂部署名稱。
    使用自訂部署名稱進行編輯需要
    onboarding/model metadata，讓 OpenClaw 可以驗證該部署是否
    由 `MAI-Image-2.5-Flash` 或 `MAI-Image-2.5` 支援。

    目前的 MAI 影像模型為 `MAI-Image-2.5-Flash`、`MAI-Image-2.5`、
    `MAI-Image-2e` 和 `MAI-Image-2`。請參閱
    [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry)以了解設定
    和聊天模型行為。

  </Accordion>
  <Accordion title="OpenRouter 影像模型">
    OpenRouter 影像生成使用相同的 `OPENROUTER_API_KEY`，並透過 OpenRouter 的
    chat completions image API 路由。使用 `openrouter/` 前綴選取
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

    OpenClaw 會將 `prompt`、`count`、參考影像，以及
    Gemini 相容的 `aspectRatio` / `resolution` 提示轉送給 OpenRouter。
    目前內建的 OpenRouter 影像模型捷徑包含
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你已設定的外掛公開了哪些內容。

  </Accordion>
  <Accordion title="fal Krea 2">
    fal 上的 Krea 2 模型會使用 fal 原生 Krea schema，而不是 Flux 使用的通用
    `image_size` schema。OpenClaw 會傳送：

    - `aspect_ratio` 用於長寬比提示
    - `creativity`，預設為 `medium`
    - 提供 `image` 或 `images` 時的 `image_style_references`

    選取 Krea 2 Medium 以取得較快速、富表現力的插畫，選取 Krea 2 Large
    以取得較慢但更詳細的寫實和紋理外觀：

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

    Krea 2 目前每次請求會回傳一張影像。針對 Krea 優先使用 `aspectRatio`；
    OpenClaw 會將 `size` 對應到最接近的受支援 Krea 長寬比，並且
    會拒絕 Krea 的 `resolution`，而不是將其丟棄。當你想要原生 Krea 創意等級時，
    使用 `fal.creativity`：

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
    MiniMax 影像生成可透過兩種 bundled MiniMax
    驗證路徑使用：

    - `minimax/image-01` 用於 API-key 設定
    - `minimax-portal/image-01` 用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    bundled xAI 提供者會針對僅提示詞
    請求使用 `/v1/images/generations`，並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 數量：最多 4
    - 參考：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 輸出：作為 OpenClaw 管理的影像附件回傳

    OpenClaw 刻意不公開 xAI 原生的 `quality`、`mask`、
    `user` 或額外的僅原生長寬比，直到這些控制項存在於共用的跨提供者
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
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

同樣的 `--output-format`、`--background`、`--quality` 和
`--openai-moderation` 旗標也可用於 `openclaw infer image edit`；
`--openai-background` 仍保留為 OpenAI 專用別名。OpenAI 以外的內建提供者
目前不宣告明確的背景控制，因此
`background: "transparent"` 會回報為已對它們忽略。

## 相關

- [工具概覽](/zh-TW/tools) - 所有可用的代理工具
- [ComfyUI](/zh-TW/providers/comfy) - local ComfyUI 與 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) - fal 圖片與影片提供者設定
- [Google (Gemini)](/zh-TW/providers/google) - Gemini 圖片提供者設定
- [Microsoft Foundry 外掛](/zh-TW/plugins/reference/microsoft-foundry) - Microsoft Foundry 聊天與 MAI 圖片設定
- [MiniMax](/zh-TW/providers/minimax) - MiniMax 圖片提供者設定
- [OpenAI](/zh-TW/providers/openai) - OpenAI Images 提供者設定
- [Vydra](/zh-TW/providers/vydra) - Vydra 圖片、影片與語音設定
- [xAI](/zh-TW/providers/xai) - Grok 圖片、影片、搜尋、程式碼執行與 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) - 模型設定與容錯移轉

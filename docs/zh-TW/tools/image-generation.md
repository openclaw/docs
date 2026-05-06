---
read_when:
    - 透過代理程式生成或編輯影像
    - 設定影像生成提供者與模型
    - 了解 image_generate 工具的參數
sidebarTitle: Image generation
summary: 透過 image_generate，在 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 生成與編輯圖片
title: 影像生成
x-i18n:
    generated_at: "2026-05-06T02:59:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具可讓代理程式使用你設定的提供者建立與編輯影像。生成的影像會自動以媒體附件形式隨代理程式的回覆送出。

<Note>
此工具只會在至少有一個影像生成提供者可用時出現。如果你在代理程式的工具中沒有看到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定提供者 API 金鑰，或使用 OpenAI Codex OAuth 登入。
</Note>

## 快速開始

<Steps>
  <Step title="設定驗證">
    為至少一個提供者設定 API 金鑰（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`），或使用 OpenAI Codex OAuth 登入。
  </Step>
  <Step title="挑選預設模型（選用）">
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

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定 `openai-codex` OAuth 設定檔時，OpenClaw 會透過該 OAuth 設定檔路由影像請求，而不是先嘗試 `OPENAI_API_KEY`。明確的 `models.providers.openai` 設定（API 金鑰、自訂/Azure 基礎 URL）會改回直接使用 OpenAI Images API 路由。

  </Step>
  <Step title="詢問代理程式">
    _「生成一張友善機器人吉祥物的影像。」_

    代理程式會自動呼叫 `image_generate`。不需要工具允許清單；只要提供者可用，它就會預設啟用。

  </Step>
</Steps>

<Warning>
對於 LocalAI 這類 OpenAI 相容的 LAN 端點，請保留自訂的 `models.providers.openai.baseUrl`，並透過 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選擇啟用。私人與內部影像端點預設仍會被封鎖。
</Warning>

## 常見路由

| 目標                                                 | 模型參照                                          | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 影像生成             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 影像生成 | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 影像生成                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 影像生成                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 影像生成                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 影像生成                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

相同的 `image_generate` 工具可處理文字轉影像與參照影像編輯。使用 `image` 傳入一張參照，或使用 `images` 傳入多張參照。當可用時，會轉送提供者支援的輸出提示，例如 `quality`、`outputFormat` 與 `background`；當提供者不支援時，則會回報為已忽略。內建的透明背景支援僅限 OpenAI；其他提供者若其後端輸出 PNG alpha，仍可能保留透明度。

## 支援的提供者

| 提供者   | 預設模型                           | 編輯支援                       | 驗證                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 是（1 張影像，由工作流程設定） | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 是（1 張影像）                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 是                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 是                                | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 是（最多 5 張輸入影像）         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 是（主體參照）            | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | 是（最多 4 張影像）               | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入影像）         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 是（最多 5 張影像）               | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的提供者與模型：

```text
/tool image_generate action=list
```

## 提供者能力

| 能力            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大數量）  | 工作流程定義   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| 編輯 / 參照      | 1 張影像（工作流程） | 1 張影像   | 1 張影像           | 最多 5 張影像 | 1 張影像（主體參照） | 最多 5 張影像 | -     | 最多 5 張影像 |
| 尺寸控制          | -                  | ✓         | ✓                 | ✓              | -                     | 最高 4K       | -     | -              |
| 長寬比          | -                  | -         | ✓（僅生成） | ✓              | ✓                     | -              | -     | ✓              |
| 解析度（1K/2K/4K） | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## 工具參數

<ParamField path="prompt" type="string" required>
  影像生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在執行階段檢查可用的提供者與模型。
</ParamField>
<ParamField path="model" type="string">
  提供者/模型覆寫（例如 `openai/gpt-image-2`）。使用 `openai/gpt-image-1.5` 產生透明的 OpenAI 背景。
</ParamField>
<ParamField path="image" type="string">
  編輯模式的一張參照影像路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式的多張參照影像（支援的提供者最多 5 張）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  長寬比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>解析度提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供者支援時的品質提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供者支援時的背景提示。對支援透明度的提供者，搭配 `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要生成的影像數量（1-4）。</ParamField>
<ParamField path="timeoutMs" type="number">選用的提供者請求逾時，單位為毫秒。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 與 `user`。
</ParamField>

<Note>
並非所有提供者都支援所有參數。當備援提供者支援的是相近的幾何選項，而不是精確要求的選項時，OpenClaw 會在提交前重新對應到最接近的支援尺寸、長寬比或解析度。不支援的輸出提示會在提供者未宣告支援時被移除，並在工具結果中回報。工具結果會回報實際套用的設定；`details.normalization` 會記錄任何從要求值到套用值的轉換。
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

1. 工具呼叫中的 **`model` 參數**（如果代理程式指定了）。
2. 設定中的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測** - 僅限有驗證支援的提供者預設值：
   - 目前的預設提供者優先；
   - 其餘已註冊的影像生成提供者依提供者 ID 順序排列。

如果提供者失敗（驗證錯誤、速率限制等），會自動嘗試下一個已設定的候選項目。如果全部失敗，錯誤會包含每次嘗試的詳細資料。

<AccordionGroup>
  <Accordion title="每次呼叫的模型覆寫是精確的">
    每次呼叫的 `model` 覆寫只會嘗試該提供者/模型，不會繼續使用已設定的主要/備援或自動偵測的提供者。
  </Accordion>
  <Accordion title="自動偵測會感知驗證狀態">
    只有當 OpenClaw 能實際驗證該提供者時，提供者預設值才會進入候選清單。設定 `agents.defaults.mediaGenerationAutoProviderFallback: false`，即可只使用明確的 `model`、`primary` 與 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對速度較慢的影像後端設定 `agents.defaults.imageGenerationModel.timeoutMs`。每次呼叫的 `timeoutMs` 工具參數會覆寫已設定的預設值。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的提供者、其預設模型與驗證環境變數提示。
  </Accordion>
</AccordionGroup>

### 影像編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 與 xAI 支援編輯參照影像。傳入參照影像路徑或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 與 xAI 透過 `images` 參數支援最多 5 張參照影像。fal、MiniMax 與 ComfyUI 支援 1 張。

## 提供者深入說明

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（和 gpt-image-1.5）">
    OpenAI 影像生成預設使用 `openai/gpt-image-2`。如果已設定
    `openai-codex` OAuth 設定檔，OpenClaw 會重用 Codex 訂閱聊天模型所使用的相同
    OAuth 設定檔，並透過 Codex Responses 後端傳送影像請求。舊版 Codex 基礎
    URL，例如 `https://chatgpt.com/backend-api`，會針對影像請求標準化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不會**針對該請求靜默退回使用 `OPENAI_API_KEY` -
    若要強制直接路由到 OpenAI Images API，請使用 API 金鑰、自訂基礎 URL
    或 Azure 端點明確設定
    `models.providers.openai`。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。若需要透明背景 PNG/WebP 輸出，請使用
    `gpt-image-1.5`；目前的
    `gpt-image-2` API 會拒絕 `background: "transparent"`。

    `gpt-image-2` 透過相同的 `image_generate` 工具，同時支援文字轉影像生成與
    參考影像編輯。
    OpenClaw 會將 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和參考影像轉送至 OpenAI。OpenAI **不會**直接收到
    `aspectRatio` 或 `resolution`；在可行時，OpenClaw 會將
    這些項目對應到受支援的 `size`，否則工具會將它們回報為
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
    透明輸出需要 `outputFormat` 為 `png` 或 `webp`，且需要
    具備透明度能力的 OpenAI 影像模型。OpenClaw 會將預設
    `gpt-image-2` 透明背景請求路由到 `gpt-image-1.5`。
    `openai.outputCompression` 會套用至 JPEG/WebP 輸出。

    頂層的 `background` 提示與提供者無關，而且目前在選取 OpenAI 提供者時，
    會對應到相同的 OpenAI `background` 請求欄位。
    未宣告支援背景的提供者會在 `ignoredOverrides` 中傳回它，
    而不是接收不受支援的參數。

    若要將 OpenAI 影像生成路由到 Azure OpenAI 部署，
    而不是 `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 影像模型">
    OpenRouter 影像生成使用相同的 `OPENROUTER_API_KEY`，並透過
    OpenRouter 的聊天完成影像 API 路由。使用 `openrouter/` 前綴選取
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
    Gemini 相容的 `aspectRatio` / `resolution` 提示轉送至 OpenRouter。
    目前內建的 OpenRouter 影像模型捷徑包括
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你已設定的 Plugin 公開哪些項目。

  </Accordion>
  <Accordion title="MiniMax 雙重驗證">
    MiniMax 影像生成可透過兩種內建 MiniMax
    驗證路徑使用：

    - `minimax/image-01` 適用於 API 金鑰設定
    - `minimax-portal/image-01` 適用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    內建的 xAI 提供者會針對純提示請求使用 `/v1/images/generations`，
    並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 數量：最多 4 張
    - 參考：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的影像附件傳回

    OpenClaw 會刻意不公開 xAI 原生的 `quality`、`mask`、
    `user` 或額外的原生專用長寬比，直到這些控制項存在於共用的跨提供者
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
  <Tab title="生成（兩個正方形）">
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
OpenAI 專屬別名。OpenAI 以外的內建提供者目前不宣告明確的背景控制，
因此 `background: "transparent"` 對它們會被回報為已忽略。

## 相關

- [工具概觀](/zh-TW/tools) - 所有可用的代理工具
- [ComfyUI](/zh-TW/providers/comfy) - 本機 ComfyUI 與 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) - fal 影像與影片提供者設定
- [Google (Gemini)](/zh-TW/providers/google) - Gemini 影像提供者設定
- [MiniMax](/zh-TW/providers/minimax) - MiniMax 影像提供者設定
- [OpenAI](/zh-TW/providers/openai) - OpenAI Images 提供者設定
- [Vydra](/zh-TW/providers/vydra) - Vydra 影像、影片與語音設定
- [xAI](/zh-TW/providers/xai) - Grok 影像、影片、搜尋、程式碼執行與 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) - `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) - 模型設定與容錯移轉

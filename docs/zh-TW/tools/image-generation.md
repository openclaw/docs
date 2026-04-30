---
read_when:
    - 透過代理程式產生或編輯影像
    - 設定影像生成提供者與模型
    - 了解 image_generate 工具參數
sidebarTitle: Image generation
summary: 透過 image_generate 跨 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 生成並編輯圖片
title: 圖片生成
x-i18n:
    generated_at: "2026-04-30T03:45:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

`image_generate` 工具可讓代理程式使用你設定的供應商建立與編輯圖像。產生的圖像會自動作為媒體附件附加在代理程式的回覆中。

<Note>
只有在至少有一個圖像生成供應商可用時，才會顯示此工具。如果你在代理程式的工具中沒有看到 `image_generate`，請設定 `agents.defaults.imageGenerationModel`、設定供應商 API 金鑰，或使用 OpenAI Codex OAuth 登入。
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

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型參照。設定 `openai-codex` OAuth 設定檔時，OpenClaw 會透過該 OAuth 設定檔路由圖像請求，而不是先嘗試 `OPENAI_API_KEY`。明確的 `models.providers.openai` 設定（API 金鑰、自訂/Azure 基底 URL）會改回使用直接的 OpenAI Images API 路由。

  </Step>
  <Step title="詢問代理程式">
    _「產生一張友善機器人吉祥物的圖像。」_

    代理程式會自動呼叫 `image_generate`。不需要工具允許清單設定；當供應商可用時，它會預設啟用。

  </Step>
</Steps>

<Warning>
對於 LocalAI 這類 OpenAI 相容的區域網路端點，請保留自訂的 `models.providers.openai.baseUrl`，並使用 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 明確選擇啟用。私有與內部圖像端點預設仍會被封鎖。
</Warning>

## 常見路由

| 目標                                                 | 模型參照                                           | 驗證                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| 使用 API 計費的 OpenAI 圖像生成                      | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| 使用 Codex 訂閱驗證的 OpenAI 圖像生成                | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP                             | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 圖像生成                                   | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 圖像生成                                  | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 圖像生成                                     | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 圖像生成                               | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

相同的 `image_generate` 工具可處理文字轉圖像與參照圖像編輯。使用 `image` 指定一張參照圖像，或使用 `images` 指定多張參照圖像。供應商支援的輸出提示，例如 `quality`、`outputFormat` 和 `background`，會在可用時轉送；若供應商不支援，則會回報為已忽略。內建的透明背景支援是 OpenAI 專屬；如果其他供應商的後端輸出 PNG alpha，它們仍可能保留透明度。

## 支援的供應商

| 供應商     | 預設模型                                | 編輯支援                           | 驗證                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 是（1 張圖像，由工作流程設定）     | 雲端使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`     |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 是（1 張圖像）                     | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 是                                 | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 是                                 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 是（最多 5 張輸入圖像）            | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 是（主體參照）                     | `MINIMAX_API_KEY` 或 MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | 是（最多 4 張圖像）                | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 張輸入圖像）            | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 是（最多 5 張圖像）                | `XAI_API_KEY`                                         |

使用 `action: "list"` 在執行階段檢查可用的供應商與模型：

```text
/tool image_generate action=list
```

## 供應商功能

| 功能                  | ComfyUI            | DeepInfra | fal           | Google       | MiniMax             | OpenAI       | Vydra | xAI          |
| --------------------- | ------------------ | --------- | ------------- | ------------ | ------------------- | ------------ | ----- | ------------ |
| 產生（最大數量）      | 由工作流程定義     | 4         | 4             | 4            | 9                   | 4            | 1     | 4            |
| 編輯 / 參照           | 1 張圖像（工作流程） | 1 張圖像 | 1 張圖像      | 最多 5 張圖像 | 1 張圖像（主體參照） | 最多 5 張圖像 | —     | 最多 5 張圖像 |
| 尺寸控制              | —                  | ✓         | ✓             | ✓            | —                   | 最高 4K      | —     | —            |
| 長寬比                | —                  | —         | ✓（僅產生）   | ✓            | ✓                   | —            | —     | ✓            |
| 解析度（1K/2K/4K）    | —                  | —         | ✓             | ✓            | —                   | —            | —     | 1K, 2K       |

## 工具參數

<ParamField path="prompt" type="string" required>
  圖像生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  使用 `"list"` 在執行階段檢查可用的供應商與模型。
</ParamField>
<ParamField path="model" type="string">
  供應商/模型覆寫（例如 `openai/gpt-image-2`）。若要使用透明 OpenAI 背景，請使用 `openai/gpt-image-1.5`。
</ParamField>
<ParamField path="image" type="string">
  編輯模式使用的單一參照圖像路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  編輯模式使用的多張參照圖像（支援的供應商最多 5 張）。
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
  供應商支援時使用的背景提示。對於支援透明度的供應商，請搭配 `outputFormat: "png"` 或 `"webp"` 使用 `transparent`。
</ParamField>
<ParamField path="count" type="number">要產生的圖像數量（1–4）。</ParamField>
<ParamField path="timeoutMs" type="number">選用的供應商請求逾時時間，單位為毫秒。</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="openai" type="object">
  僅限 OpenAI 的提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
並非所有供應商都支援所有參數。當後備供應商支援相近的幾何選項，而不是完全符合請求的選項時，OpenClaw 會在提交前重新對應至最接近的支援尺寸、長寬比或解析度。不支援的輸出提示會在供應商未宣告支援時被捨棄，並在工具結果中回報。工具結果會回報已套用的設定；`details.normalization` 會擷取任何從請求到套用的轉換。
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

1. 工具呼叫中的 **`model` 參數**（如果代理程式指定了）。
2. 設定中的 **`imageGenerationModel.primary`**。
3. 依序使用 **`imageGenerationModel.fallbacks`**。
4. **自動偵測**：僅限有驗證支援的供應商預設值：
   - 目前的預設供應商優先；
   - 其餘已註冊的圖像生成供應商依供應商 ID 順序排列。

如果供應商失敗（驗證錯誤、速率限制等），會自動嘗試下一個已設定的候選項目。如果全部失敗，錯誤會包含每次嘗試的詳細資訊。

<AccordionGroup>
  <Accordion title="逐次呼叫模型覆寫會精確套用">
    逐次呼叫的 `model` 覆寫只會嘗試該供應商/模型，不會繼續使用已設定的主要/後備供應商或自動偵測的供應商。
  </Accordion>
  <Accordion title="自動偵測會感知驗證狀態">
    只有當 OpenClaw 能實際驗證該供應商時，供應商預設值才會進入候選清單。設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用明確的 `model`、`primary` 和 `fallbacks` 項目。
  </Accordion>
  <Accordion title="逾時">
    對於較慢的圖像後端，請設定 `agents.defaults.imageGenerationModel.timeoutMs`。逐次呼叫的 `timeoutMs` 工具參數會覆寫已設定的預設值。
  </Accordion>
  <Accordion title="在執行階段檢查">
    使用 `action: "list"` 檢查目前已註冊的供應商、其預設模型，以及驗證環境變數提示。
  </Accordion>
</AccordionGroup>

### 圖像編輯

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 和 xAI 支援編輯參照圖像。傳入參照圖像路徑或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 透過 `images` 參數最多支援 5 張參照圖像。fal、MiniMax 和 ComfyUI 支援 1 張。

## 供應商深入介紹

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    OpenAI 影像生成預設使用 `openai/gpt-image-2`。如果已設定
    `openai-codex` OAuth 設定檔，OpenClaw 會重用 Codex 訂閱聊天模型所使用的相同
    OAuth 設定檔，並透過 Codex Responses 後端傳送影像請求。舊版 Codex 基底
    URL（例如 `https://chatgpt.com/backend-api`）會針對影像請求標準化為
    `https://chatgpt.com/backend-api/codex`。OpenClaw
    **不會** 為該請求靜默退回使用 `OPENAI_API_KEY`；若要強制直接透過 OpenAI Images API 路由，請使用 API 金鑰、自訂基底 URL
    或 Azure 端點明確設定
    `models.providers.openai`。

    仍可明確選取 `openai/gpt-image-1.5`、`openai/gpt-image-1` 和
    `openai/gpt-image-1-mini` 模型。若要輸出透明背景 PNG/WebP，請使用
    `gpt-image-1.5`；目前的
    `gpt-image-2` API 會拒絕 `background: "transparent"`。

    `gpt-image-2` 同時支援文字轉影像生成，以及透過相同 `image_generate` 工具進行參考影像編輯。
    OpenClaw 會將 `prompt`、`count`、`size`、`quality`、`outputFormat`
    和參考影像轉送給 OpenAI。OpenAI 不會直接收到
    `aspectRatio` 或 `resolution`；在可行時，OpenClaw 會將這些值對應到受支援的
    `size`，否則工具會將它們回報為已忽略的覆寫。

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
    透明輸出需要 `outputFormat` 為 `png` 或 `webp`，並使用支援透明度的 OpenAI 影像模型。
    OpenClaw 會將預設
    `gpt-image-2` 透明背景請求路由到 `gpt-image-1.5`。
    `openai.outputCompression` 適用於 JPEG/WebP 輸出。

    頂層 `background` 提示是提供者中立的，目前在選取 OpenAI 提供者時，會對應到相同的 OpenAI `background` 請求欄位。未宣告支援背景的提供者會在
    `ignoredOverrides` 中回傳它，而不是接收不支援的參數。

    若要將 OpenAI 影像生成路由到 Azure OpenAI 部署，而不是
    `api.openai.com`，請參閱
    [Azure OpenAI 端點](/zh-TW/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter image models">
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

    OpenClaw 會將 `prompt`、`count`、參考影像，以及與 Gemini 相容的
    `aspectRatio` / `resolution` 提示轉送給 OpenRouter。
    目前內建的 OpenRouter 影像模型捷徑包括
    `google/gemini-3.1-flash-image-preview`、
    `google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用
    `action: "list"` 查看你設定的 Plugin 公開了哪些內容。

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax 影像生成可透過兩種隨附的 MiniMax 驗證路徑使用：

    - `minimax/image-01` 用於 API 金鑰設定
    - `minimax-portal/image-01` 用於 OAuth 設定

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    隨附的 xAI 提供者會對僅有提示的請求使用 `/v1/images/generations`，並在存在 `image` 或 `images` 時使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-pro`
    - 數量：最多 4
    - 參考：一個 `image` 或最多五個 `images`
    - 長寬比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 解析度：`1K`、`2K`
    - 輸出：以 OpenClaw 管理的影像附件形式回傳

    OpenClaw 刻意不公開 xAI 原生的 `quality`、`mask`、
    `user` 或額外的僅限原生長寬比，直到這些控制項存在於共享的跨提供者 `image_generate` 合約中。

  </Accordion>
</AccordionGroup>

## 範例

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
</Tabs>

相同的 `--output-format` 和 `--background` 旗標也可用於
`openclaw infer image edit`；`--openai-background` 仍保留為 OpenAI 專屬別名。除 OpenAI 以外的隨附提供者目前未宣告明確的背景控制，因此
`background: "transparent"` 會對它們回報為已忽略。

## 相關

- [工具概覽](/zh-TW/tools) — 所有可用的代理工具
- [ComfyUI](/zh-TW/providers/comfy) — 本機 ComfyUI 與 Comfy Cloud 工作流程設定
- [fal](/zh-TW/providers/fal) — fal 影像和影片提供者設定
- [Google (Gemini)](/zh-TW/providers/google) — Gemini 影像提供者設定
- [MiniMax](/zh-TW/providers/minimax) — MiniMax 影像提供者設定
- [OpenAI](/zh-TW/providers/openai) — OpenAI Images 提供者設定
- [Vydra](/zh-TW/providers/vydra) — Vydra 影像、影片和語音設定
- [xAI](/zh-TW/providers/xai) — Grok 影像、影片、搜尋、程式碼執行和 TTS 設定
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `imageGenerationModel` 設定
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉

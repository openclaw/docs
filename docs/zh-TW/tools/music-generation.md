---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成供應商與模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate，在 ComfyUI、fal、Google Lyria、MiniMax 與 OpenRouter 工作流程中產生音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-07-22T10:54:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3f2a8a4a36e47839c7896046a556f7bf84f6c168492e2de46736635fe2a9358e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具透過共用的音樂生成功能建立音樂或音訊，後端由 ComfyUI、fal、Google、MiniMax 與 OpenRouter 支援。

<Note>
只有在至少有一個音樂生成供應商可用時，`music_generate` 才會出現：明確的 `agents.defaults.mediaModels.music` 設定，或已設定驗證的供應商（例如已設定 API 金鑰）。
</Note>

對於由工作階段支援的代理程式執行，`music_generate` 會以背景工作啟動、在工作台帳中追蹤進度，接著在曲目就緒時喚醒代理程式，讓它通知使用者並附上完成的音訊。完成代理程式會遵循工作階段的可見回覆合約：若已設定，便自動傳送最終回覆；若工作階段要求使用訊息工具，則使用 `message(action="send")`。如果請求者的工作階段處於非作用中狀態或喚醒失敗，且回覆中仍缺少已生成的音訊，OpenClaw 會傳送僅包含缺少音訊的冪等直接備援訊息。

## 快速開始

<Tabs>
  <Tab title="由共用供應商支援">
    <Steps>
      <Step title="設定驗證">
        為至少一個供應商設定 API 金鑰，例如
        `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
      </Step>
      <Step title="選擇預設模型（選用）">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="向代理程式提出要求">
        _「生成一首以夜間駕車穿梭霓虹城市為主題、節奏明快的合成器流行曲目。」_

        代理程式會自動呼叫 `music_generate`。不需要將工具加入允許清單。
      </Step>
    </Steps>

    如果沒有由工作階段支援的代理程式執行（直接／本機情境），工具會行內執行，並在同一個工具結果中傳回最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI 工作流程">
    <Steps>
      <Step title="設定工作流程">
        使用工作流程 JSON 以及提示詞／輸出節點設定 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="雲端驗證（選用）">
        若使用 Comfy Cloud，請設定 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
      </Step>
      <Step title="呼叫工具">
        ```text
        /tool music_generate prompt="帶有柔和磁帶質感的溫暖氛圍合成器循環"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

提示詞範例：

```text
生成一首搭配柔和弦樂且無人聲的電影感鋼琴曲目。
```

```text
生成一段以日出時發射火箭為主題、充滿活力的晶片音樂循環。
```

使用 `action: "list"` 檢查可用的供應商／模型，並使用 `action: "status"` 檢查目前由工作階段支援的音樂工作：

```text
/tool music_generate action=list
/tool music_generate action=status
```

直接生成範例：

```text
/tool music_generate prompt="帶有黑膠唱片質感和輕柔雨聲的夢幻低傳真嘻哈" instrumental=true
```

## 支援的供應商

| 供應商     | 預設模型                     | 參考輸入     | 支援的控制項                                          | 驗證                                   |
| ---------- | ---------------------------- | ------------ | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`           | 最多 1 張圖片 | 由工作流程定義的音樂或音訊                            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`           | 無           | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 或 `FAL_API_KEY` |
| Google     | `lyria-3-clip-preview`           | 最多 10 張圖片 | `lyrics`, `instrumental`, `format` | `GEMINI_API_KEY`, `GOOGLE_API_KEY` |
| MiniMax    | `music-2.6`           | 無           | `lyrics`, `instrumental`, `format`（僅限 mp3） | `MINIMAX_API_KEY` 或 MiniMax OAuth |
| OpenRouter | `google/lyria-3-pro-preview`           | 最多 1 張圖片 | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY` |

MiniMax 會註冊兩個共用相同模型的供應商 ID：`minimax` 用於 API 金鑰驗證，`minimax-portal` 用於 OAuth。模型參照會依循驗證路徑（`minimax/music-2.6` 與 `minimax-portal/music-2.6`）；請參閱 [MiniMax](/zh-TW/providers/minimax#music-generation)。

除了預設的 MiniMax 後端模型之外，fal 也提供 `fal-ai/ace-step/prompt-to-audio`（wav、無歌詞、無純音樂切換）和 `fal-ai/stable-audio-25/text-to-audio`（wav、僅限提示詞）。Google 的預設 `lyria-3-clip-preview` 僅輸出 mp3；`lyria-3-pro-preview` 也支援 wav。MiniMax 也提供 `music-2.6-free`、`music-cover` 和 `music-cover-free`。OpenRouter 也提供 `google/lyria-3-clip-preview`。

### 功能矩陣

`music_generate`、合約測試與共用即時掃描所使用的明確模式合約：

| 供應商     | `generate` | `edit` | 編輯限制     | 共用即時執行管道                                                          |
| ---------- | :--------: | :----: | ------------ | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 張圖片     | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| fal        |     ✓      |   —    | 無           | `generate`                                                        |
| Google     |     ✓      |   ✓    | 10 張圖片    | `generate`、`edit`                                    |
| MiniMax    |     ✓      |   —    | 無           | `generate`                                                        |
| OpenRouter |     ✓      |   ✓    | 1 張圖片     | `generate`、`edit`                                    |

## 工具參數

<ParamField path="prompt" type="string" required>
  音樂生成提示詞。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前的工作階段工作；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">
  覆寫供應商／模型（例如 `google/lyria-3-pro-preview`、
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當供應商支援明確的歌詞輸入時，可選擇提供歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當供應商支援時，要求僅輸出純音樂。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（支援的供應商最多可使用 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當供應商支援時長提示時，以秒為單位指定目標時長。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當供應商支援時，指定輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當供應商支援時長，但其最大值短於要求的值時，OpenClaw 會將其限制為最接近的支援時長。當所選供應商或模型無法採用真正不受支援的選用提示時，會忽略這些提示並發出警告。工具結果會回報已套用的設定；`details.normalization` 會記錄任何從要求值到套用值的對應關係。
</Note>

供應商要求逾時僅能由操作者設定。若已設定，OpenClaw 會使用 `agents.defaults.mediaModels.music.timeoutMs`，將低於 120000ms 的值提高至 120000ms；否則，供應商要求預設為 300000ms。

## 非同步行為

由工作階段支援的音樂生成會以背景工作執行：

- **背景工作：**`music_generate` 會建立背景工作、立即傳回已啟動／工作回應，並稍後在後續的代理程式訊息中發布完成的曲目。
- **防止重複：**當工作處於 `queued` 或 `running` 狀態時，相同工作階段中後續的 `music_generate` 呼叫會傳回工作狀態，而不會啟動另一個生成工作。使用 `action: "status"` 可明確檢查。最近完成的相符要求也會在 2 分鐘內去除重複。
- **狀態查詢：**`openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已排入佇列、執行中和終止狀態。
- **完成喚醒：**OpenClaw 會將內部完成事件注入回相同工作階段，讓模型自行撰寫面向使用者的後續訊息。
- **提示詞提醒：**如果音樂工作已在進行中，相同工作階段內後續的使用者／手動輪次會收到一小段執行階段提示，避免模型盲目再次呼叫 `music_generate`。
- **無工作階段備援：**沒有實際代理程式工作階段的直接／本機情境會行內執行，並在同一輪中傳回最終音訊結果。

### 工作生命週期

音樂工作會呈現與一般工作登錄檔相同的狀態（完整狀態機請參閱[背景工作](/zh-TW/automation/tasks#task-lifecycle)，其中包括 `timed_out`、`cancelled` 和 `lost`）。大多數音樂執行會經過：

| 狀態        | 含義                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued` | 工作已建立，等待供應商接受。                                                           |
| `running` | 供應商正在處理（通常為 30 秒至 3 分鐘，取決於供應商和時長）。                          |
| `succeeded` | 曲目已就緒；代理程式會喚醒並將其發布至對話。                                           |
| `failed` | 供應商發生錯誤或逾時；代理程式會喚醒並提供錯誤詳細資料。                               |

從命令列介面檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 設定

### 模型選擇

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### 供應商選擇順序

OpenClaw 會依下列順序嘗試供應商：

1. 工具呼叫中的 `model` 參數（如果代理程式有指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用由驗證支援的供應商預設值進行自動偵測：
   - 如果目前的預設文字模型供應商也提供音樂生成功能，則優先使用該供應商；
   - 其餘已註冊的音樂生成供應商，依供應商 ID 的字母順序排列。

如果某個供應商失敗，會自動嘗試下一個候選供應商。如果全部失敗，錯誤會包含每次嘗試的詳細資料。

一律啟用已驗證供應商之間的自動備援。每次呼叫指定的 `model` 仍具有最高優先權。

## 供應商注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    以工作流程為驅動，並取決於所設定的圖形，以及提示詞／輸出欄位的節點對應。
    隨附的 `comfy` 外掛會透過音樂生成供應商登錄機制，接入共用的
    `music_generate` 工具。
  </Accordion>
  <Accordion title="fal">
    透過共用的供應商驗證路徑使用 fal 模型端點。隨附的供應商預設使用
    `fal-ai/minimax-music/v2.6`，並另外提供 `fal-ai/ace-step/prompt-to-audio` 和
    `fal-ai/stable-audio-25/text-to-audio`，以處理提示詞轉音訊要求。
    歌詞和純演奏模式僅適用於 MiniMax 模型；另外兩個模型僅支援提示詞。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前隨附的流程支援提示詞、選用的歌詞文字，以及選用的參考圖片。
    預設的 `lyria-3-clip-preview` 模型僅輸出 mp3；
    `lyria-3-pro-preview` 模型也支援 wav。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示詞、選用的歌詞、純演奏模式和 mp3 輸出，
    並可透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth 使用。
    另外也提供 `music-2.6-free`、`music-cover` 和
    `music-cover-free` 模型。
  </Accordion>
  <Accordion title="OpenRouter">
    使用已啟用串流的 OpenRouter 聊天補全音訊輸出。隨附的供應商預設使用
    `google/lyria-3-pro-preview`，並另外提供 `openrouter/google/lyria-3-clip-preview`。
  </Accordion>
</AccordionGroup>

## 選擇合適的路徑

- 當你需要選擇模型、供應商容錯移轉，以及內建的非同步任務／狀態流程時，請使用**由共用供應商支援的路徑**。
- 當你需要自訂工作流程圖形，或使用不屬於隨附共用音樂功能的供應商時，請使用**外掛路徑（ComfyUI）**。

若要偵錯 ComfyUI 特有的行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。若要偵錯共用供應商的行為，請先查看 [fal](/zh-TW/providers/fal)、[Google (Gemini)](/zh-TW/providers/google)、
[MiniMax](/zh-TW/providers/minimax) 或 [OpenRouter](/zh-TW/providers/openrouter)。

## 供應商功能模式

共用的音樂生成合約支援明確的模式宣告：

- `generate` 用於僅使用提示詞的生成。
- 當要求包含一或多張參考圖片時，使用 `edit`。

新的供應商實作應優先使用明確的模式區塊：

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`、`supportsLyrics` 和
`supportsFormat` 等舊式扁平欄位，**不足以**表明支援編輯。供應商應明確宣告
`generate` 和 `edit`，讓即時測試、合約測試及共用的
`music_generate` 工具能以確定性方式驗證模式支援。

## 即時測試

共用隨附供應商（fal、Google、MiniMax、OpenRouter）的選用即時測試涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

等效的儲存庫包裝命令，會執行相同的測試檔案：

```bash
pnpm test:live:media:music
```

此即時測試檔案預設會優先使用已匯出的供應商環境變數，而非已儲存的驗證設定檔；當供應商啟用編輯模式時，
也會同時執行 `generate` 和已宣告的 `edit` 涵蓋範圍。目前的涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `fal`：僅 `generate`
- `minimax`：僅 `generate`
- `openrouter`：`generate` 加上 `edit`
- `comfy`：獨立的 Comfy 即時測試涵蓋範圍，不包含在共用供應商全面測試中

隨附 ComfyUI 音樂路徑的選用即時測試涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

設定了相關區段時，Comfy 即時測試檔案也會涵蓋 comfy 圖片與影片工作流程。

## 相關內容

- [背景任務](/zh-TW/automation/tasks) — 追蹤已分離的 `music_generate` 執行
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概覽](/zh-TW/tools)

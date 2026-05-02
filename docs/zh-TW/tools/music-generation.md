---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成提供者與模型
    - 了解 music_generate 工具的參數
sidebarTitle: Music generation
summary: 透過 music_generate 在 Google Lyria、MiniMax 和 ComfyUI 工作流程中產生音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-05-02T21:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9199afe17b2641efb1a7523c651724af9c312c1415c7e60ca736341699f6bc26
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具可讓代理透過已設定的提供者，使用共享音樂生成能力建立音樂或音訊，目前支援 Google、MiniMax，以及以工作流程設定的 ComfyUI。

對於有工作階段支援的代理執行，OpenClaw 會將音樂生成作為背景任務啟動，在任務帳本中追蹤，然後在曲目準備完成時再次喚醒代理，讓代理能將完成的音訊傳回原始通道。

<Note>
只有在至少有一個音樂生成提供者可用時，內建共享工具才會出現。如果你在代理的工具中沒有看到 `music_generate`，請設定 `agents.defaults.musicGenerationModel` 或設定提供者 API 金鑰。
</Note>

## 快速開始

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        為至少一個提供者設定 API 金鑰，例如 `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _「生成一首關於夜晚駕車穿越霓虹城市的輕快合成器流行曲目。」_

        代理會自動呼叫 `music_generate`。不需要將工具加入允許清單。
      </Step>
    </Steps>

    對於沒有工作階段支援代理執行的直接同步情境，內建工具仍會退回至內嵌生成，並在工具結果中傳回最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        使用工作流程 JSON 和提示/輸出節點設定 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="Cloud auth (optional)">
        對於 Comfy Cloud，請設定 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

範例提示：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

## 支援的提供者

| 提供者 | 預設模型          | 參考輸入 | 支援的控制項                                        | 驗證                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 張圖片    | 工作流程定義的音樂或音訊                           | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 張圖片  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 無             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩陣

`music_generate`、合約測試與共享即時掃描使用的明確模式合約：

| 提供者 | `generate` | `edit` | 編輯限制 | 共享即時通道                                                         |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 張圖片    | 不在共享掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| Google   |     ✓      |   ✓    | 10 張圖片  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 無       | `generate`                                                                |

使用 `action: "list"` 在執行階段檢查可用的共享提供者和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 檢查作用中的工作階段支援音樂任務：

```text
/tool music_generate action=status
```

直接生成範例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 工具參數

<ParamField path="prompt" type="string" required>
  音樂生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前的工作階段任務；`"list"` 會檢查提供者。
</ParamField>
<ParamField path="model" type="string">
  提供者/模型覆寫（例如 `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當提供者支援明確歌詞輸入時的選用歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，要求僅輸出器樂。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（在支援的提供者上最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援時，以秒為單位的目標時長提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的提供者請求逾時，以毫秒為單位。低於 10000ms 的值會提高到 10000ms，並在工具結果中回報。</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當提供者支援時長但使用的上限短於請求值時，OpenClaw 會限縮到最接近的支援時長。若選取的提供者或模型無法遵從真正不支援的選用提示，這些提示會被忽略並附上警告。工具結果會回報已套用的設定；`details.normalization` 會記錄任何從請求值到套用值的對應。
</Note>

## 非同步行為

工作階段支援的音樂生成會作為背景任務執行：

- **背景任務：** `music_generate` 會建立背景任務，立即傳回已開始/任務回應，並稍後在後續代理訊息中張貼完成的曲目。
- **防止重複：** 當任務為 `queued` 或 `running` 時，同一工作階段中的後續 `music_generate` 呼叫會傳回任務狀態，而不是開始另一個生成。使用 `action: "status"` 可明確檢查。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查排隊中、執行中與終止狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型能自行撰寫面向使用者的後續訊息。
- **提示提示：** 同一工作階段中的後續使用者/手動回合，會在已有音樂任務進行中時收到一小段執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段退回：** 沒有真實代理工作階段的直接/本機情境會內嵌執行，並在同一回合中傳回最終音訊結果。

### 任務生命週期

| 狀態       | 意義                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 任務已建立，正在等待提供者接受。                                           |
| `running`   | 提供者正在處理（通常為 30 秒到 3 分鐘，取決於提供者與時長）。 |
| `succeeded` | 曲目已準備完成；代理會醒來並將其張貼到對話中。                                 |
| `failed`    | 提供者錯誤或逾時；代理會醒來並附上錯誤詳細資料。                                 |

從 CLI 檢查狀態：

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### 提供者選擇順序

OpenClaw 會依此順序嘗試提供者：

1. 工具呼叫中的 `model` 參數（如果代理指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用驗證支援的提供者預設值進行自動偵測：
   - 目前的預設提供者優先；
   - 其餘已註冊的音樂生成提供者依 provider-id 順序。

如果提供者失敗，會自動嘗試下一個候選項。如果全部失敗，錯誤會包含每次嘗試的詳細資料。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用明確的 `model`、`primary` 與 `fallbacks` 項目。

## 提供者注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，並取決於已設定的圖與提示/輸出欄位節點對應。隨附的 `comfy` Plugin 會透過音樂生成提供者登錄接入共享的 `music_generate` 工具。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前隨附流程支援提示、選用歌詞文字與選用參考圖片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示、選用歌詞、器樂模式、時長導引，以及透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth 的 mp3 輸出。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- **由共享提供者支援**：當你需要模型選擇、提供者容錯移轉，以及內建非同步任務/狀態流程時使用。
- **Plugin 路徑 (ComfyUI)**：當你需要自訂工作流程圖，或需要不屬於共享隨附音樂能力的提供者時使用。

如果你正在偵錯 ComfyUI 特定行為，請參閱 [ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共享提供者行為，請從 [Google (Gemini)](/zh-TW/providers/google) 或 [MiniMax](/zh-TW/providers/minimax) 開始。

## 提供者能力模式

共享音樂生成合約支援明確的模式宣告：

- `generate` 用於僅提示生成。
- 當請求包含一張或多張參考圖片時使用 `edit`。

新的提供者實作應優先使用明確模式區塊：

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

舊版扁平欄位例如 `maxInputImages`、`supportsLyrics` 和 `supportsFormat` **不足以** 宣告編輯支援。提供者應明確宣告 `generate` 與 `edit`，讓即時測試、合約測試與共享的 `music_generate` 工具能以確定性方式驗證模式支援。

## 即時測試

針對共享隨附提供者的選擇加入即時涵蓋：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media music
```

此即時檔案會從 `~/.profile` 載入缺少的提供者環境變數，預設會優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，並在提供者啟用編輯模式時同時執行 `generate` 與已宣告的 `edit` 涵蓋。目前涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `minimax`：僅 `generate`
- `comfy`：個別的 Comfy 即時涵蓋，不屬於共享提供者掃描

針對隨附 ComfyUI 音樂路徑的選擇加入即時涵蓋：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy 即時檔案也涵蓋已設定那些區段時的 Comfy 圖像與影片工作流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 用於分離式 `music_generate` 執行的任務追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與故障轉移
- [工具概覽](/zh-TW/tools)

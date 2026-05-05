---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成供應商與模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate 在 Google Lyria、MiniMax 和 ComfyUI 工作流程中產生音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-05-05T06:19:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具讓代理程式透過已設定提供者的共用音樂生成能力建立音樂或音訊，目前支援 Google、MiniMax，以及透過工作流程設定的 ComfyUI。

對於以工作階段支援的代理程式執行，OpenClaw 會將音樂生成啟動為背景任務，在任務帳本中追蹤它，然後在曲目準備好時再次喚醒代理程式，讓代理程式可以告知使用者並附上完成的音訊。在使用僅訊息工具可見傳遞的群組/頻道聊天中，代理程式會透過訊息工具轉送結果。如果完成代理程式只寫入私人最終回覆，OpenClaw 會改用直接頻道傳送來傳送生成的媒體。完成喚醒會明確警告代理程式，在這些路由中一般的最終回覆是私人的。

<Note>
只有在至少有一個音樂生成提供者可用時，內建共用工具才會出現。如果你在代理程式的工具中看不到 `music_generate`，請設定 `agents.defaults.musicGenerationModel` 或設定提供者 API 金鑰。
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
        _"Generate an upbeat synthpop track about a night drive through a
        neon city."_

        代理程式會自動呼叫 `music_generate`。不需要工具允許清單。
      </Step>
    </Steps>

    對於沒有以工作階段支援的代理程式執行的直接同步情境，內建工具仍會退回到行內生成，並在工具結果中傳回最終媒體路徑。

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

| 提供者 | 預設模型               | 參考輸入     | 支援的控制項                                              | 身分驗證                               |
| ------ | ---------------------- | ------------ | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 張圖片  | 工作流程定義的音樂或音訊                                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 張圖片 | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 無             | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩陣

`music_generate`、契約測試，以及共用即時掃描使用的明確模式契約：

| 提供者 | `generate` | `edit` | 編輯限制 | 共用即時通道                                                              |
| ------ | :--------: | :----: | -------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 張圖片  | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| Google   |     ✓      |   ✓    | 10 張圖片 | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 無       | `generate`                                                                |

使用 `action: "list"` 在執行階段檢查可用的共用提供者和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 檢查作用中的以工作階段支援的音樂任務：

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
  當提供者支援明確的歌詞輸入時，可選擇提供歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，要求僅器樂輸出。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（在支援的提供者上最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援時，以秒為單位的目標持續時間提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可選的提供者請求逾時，以毫秒為單位。低於 10000ms 的值會提升為 10000ms，並在工具結果中回報。</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 仍會在提交前驗證硬性限制，例如輸入數量。當提供者支援持續時間，但使用的最大值短於請求值時，OpenClaw 會限制為最接近的受支援持續時間。真正不受支援的選用提示會在所選提供者或模型無法遵循時以警告忽略。工具結果會回報已套用的設定；`details.normalization` 會擷取任何從請求值到套用值的對應。
</Note>

## 非同步行為

以工作階段支援的音樂生成會以背景任務執行：

- **背景任務：** `music_generate` 會建立背景任務，立即傳回已開始/任務回應，並稍後在後續代理程式訊息中發布完成的曲目。
- **防止重複：** 當任務為 `queued` 或 `running` 時，同一工作階段中後續的 `music_generate` 呼叫會傳回任務狀態，而不是啟動另一個生成。使用 `action: "status"` 明確檢查。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已排佇、執行中和終端狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型可以自行寫入面向使用者的後續訊息。
- **提示提示：** 同一工作階段中稍後的使用者/手動回合，會在已有音樂任務進行中時取得小型執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段退回：** 沒有真實代理程式工作階段的直接/本機情境會行內執行，並在同一回合傳回最終音訊結果。

### 任務生命週期

| 狀態        | 意義                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | 任務已建立，正在等待提供者接受。                                                                 |
| `running`   | 提供者正在處理（通常為 30 秒到 3 分鐘，視提供者與時長而定）。                                    |
| `succeeded` | 音軌已就緒；代理程式會喚醒並將它發布到對話中。                                                   |
| `failed`    | 提供者錯誤或逾時；代理程式會帶著錯誤詳細資料喚醒。                                               |

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

OpenClaw 會依照以下順序嘗試提供者：

1. 工具呼叫中的 `model` 參數（如果代理程式有指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用具備驗證支援的提供者預設值進行自動偵測：
   - 目前的預設提供者優先；
   - 其餘已註冊的音樂生成提供者，依提供者 ID 順序。

如果某個提供者失敗，系統會自動嘗試下一個候選項。如果全部
失敗，錯誤會包含每次嘗試的詳細資料。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用
明確的 `model`、`primary` 與 `fallbacks` 項目。

## 提供者注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，並依賴已設定的圖表加上用於提示/輸出欄位的節點對應。
    內建的 `comfy` Plugin 會透過音樂生成提供者登錄檔接入
    共用的 `music_generate` 工具。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前的內建流程支援
    提示、選用歌詞文字，以及選用參考圖片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。透過
    `minimax` API 金鑰驗證或 `minimax-portal` OAuth，支援提示、選用
    歌詞、純器樂模式、時長引導，以及 mp3 輸出。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- 當你需要模型選擇、提供者
  容錯移轉，以及內建非同步任務/狀態流程時，使用**共用的提供者支援路徑**。
- 當你需要自訂工作流程圖，或需要不屬於共用內建音樂能力的
  提供者時，使用 **Plugin 路徑 (ComfyUI)**。

如果你正在偵錯 ComfyUI 專屬行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用提供者
行為，請從 [Google (Gemini)](/zh-TW/providers/google) 或
[MiniMax](/zh-TW/providers/minimax) 開始。

## 提供者能力模式

共用的音樂生成合約支援明確的模式宣告：

- `generate` 用於僅含提示的生成。
- 當請求包含一張或多張參考圖片時，使用 `edit`。

新的提供者實作應優先使用明確的模式區塊：

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

舊版扁平欄位，例如 `maxInputImages`、`supportsLyrics` 與
`supportsFormat`，**不足以**宣告編輯支援。提供者
應明確宣告 `generate` 與 `edit`，讓即時測試、合約
測試，以及共用的 `music_generate` 工具能以決定性的方式驗證模式支援。

## 即時測試

共用內建提供者的選用即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media music
```

這個即時檔案會從 `~/.profile` 載入缺少的提供者環境變數，預設優先使用
即時/環境 API 金鑰，而不是已儲存的驗證設定檔，並且在提供者啟用編輯
模式時，同時執行 `generate` 與已宣告的 `edit` 涵蓋範圍。目前涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `minimax`：僅 `generate`
- `comfy`：獨立的 Comfy 即時測試涵蓋範圍，而不是共用的提供者掃描

隨附 ComfyUI 音樂路徑的選用即時測試涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

當已設定對應區段時，Comfy 即時測試檔案也會涵蓋 Comfy 圖片和影片工作流程。

## 相關

- [背景工作](/zh-TW/automation/tasks) — 已分離 `music_generate` 執行的工作追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定和容錯移轉
- [工具概觀](/zh-TW/tools)

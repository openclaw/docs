---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成提供者與模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate 跨 Google Lyria、MiniMax 與 ComfyUI 工作流程生成音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-05-05T01:50:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e14a5a10dd485c2d3dbbd23a0fc2c12de500d9f7bfb7db471c27ed2a99ad650
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具可讓代理程式透過已設定提供者的共用音樂生成能力建立音樂或音訊，目前支援 Google、MiniMax，以及由工作流程設定的 ComfyUI。

對於有工作階段支援的代理程式執行，OpenClaw 會將音樂生成作為背景任務啟動、在任務帳本中追蹤，然後在曲目準備就緒時再次喚醒代理程式，讓代理程式可以告知使用者並附上完成的音訊。在只使用訊息工具進行可見傳遞的群組／頻道聊天中，代理程式會透過訊息工具轉送結果。

<Note>
內建共用工具只會在至少有一個音樂生成提供者可用時出現。如果你在代理程式工具中沒有看到 `music_generate`，請設定 `agents.defaults.musicGenerationModel` 或設定提供者 API 金鑰。
</Note>

## 快速開始

<Tabs>
  <Tab title="共用提供者支援">
    <Steps>
      <Step title="設定驗證">
        為至少一個提供者設定 API 金鑰，例如
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
      <Step title="詢問代理程式">
        _「生成一首關於夜晚駕車穿越霓虹城市的輕快 synthpop 曲目。」_

        代理程式會自動呼叫 `music_generate`。不需要工具允許清單。
      </Step>
    </Steps>

    對於沒有工作階段支援代理程式執行的直接同步情境，內建工具仍會回退為行內生成，並在工具結果中回傳最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI 工作流程">
    <Steps>
      <Step title="設定工作流程">
        使用工作流程 JSON 和提示／輸出節點設定 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="雲端驗證（選用）">
        對於 Comfy Cloud，請設定 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
      </Step>
      <Step title="呼叫工具">
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

| 提供者 | 預設模型               | 參考輸入 | 支援的控制項                                              | 驗證                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 張圖片    | 工作流程定義的音樂或音訊                                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 張圖片   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 無               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩陣

`music_generate`、合約測試與共用即時掃描使用的明確模式合約：

| 提供者 | `generate` | `edit` | 編輯限制 | 共用即時通道                                                              |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 張圖片   | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| Google   |     ✓      |   ✓    | 10 張圖片  | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 無         | `generate`                                                                |

使用 `action: "list"` 在執行階段檢查可用的共用提供者與模型：

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
  `"status"` 會回傳目前的工作階段任務；`"list"` 會檢查提供者。
</ParamField>
<ParamField path="model" type="string">
  提供者／模型覆寫（例如 `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當提供者支援明確歌詞輸入時可選填歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，請求純器樂輸出。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（在支援的提供者上最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援時的目標秒數長度提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的提供者請求逾時時間，以毫秒為單位。低於 10000ms 的值會提高到 10000ms，並在工具結果中回報。</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當提供者支援時間長度但最大值比請求值更短時，OpenClaw 會限制為最接近的受支援時間長度。若選取的提供者或模型無法遵循真正不支援的選用提示，該提示會被忽略並顯示警告。工具結果會回報套用的設定；`details.normalization` 會擷取任何從請求值到套用值的對應。
</Note>

## 非同步行為

有工作階段支援的音樂生成會作為背景任務執行：

- **背景任務：** `music_generate` 會建立背景任務、立即回傳已開始／任務回應，並稍後在後續代理程式訊息中張貼完成的曲目。
- **防止重複：** 當任務為 `queued` 或 `running` 時，同一工作階段中之後的 `music_generate` 呼叫會回傳任務狀態，而不是開始另一個生成。使用 `action: "status"` 明確檢查。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已佇列、執行中與終止狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型可以自行撰寫面向使用者的後續訊息。
- **提示提示：** 同一工作階段中之後的使用者／手動回合，會在已有音樂任務進行中時取得小型執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段回退：** 沒有真實代理程式工作階段的直接／本機情境會行內執行，並在同一回合中回傳最終音訊結果。

### 任務生命週期

| 狀態        | 意義                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 工作已建立，正在等待供應商接受。                                                               |
| `running`   | 供應商正在處理（通常需 30 秒到 3 分鐘，取決於供應商與時長）。                                  |
| `succeeded` | 音軌已就緒；代理程式會喚醒並將其發佈到對話中。                                                 |
| `failed`    | 供應商錯誤或逾時；代理程式會喚醒並附上錯誤詳細資料。                                           |

從 CLI 檢查狀態：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## 組態

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

### 供應商選擇順序

OpenClaw 會依照下列順序嘗試供應商：

1. 工具呼叫中的 `model` 參數（如果代理程式有指定）。
2. 組態中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用由驗證支援的供應商預設值進行自動偵測：
   - 目前的預設供應商優先；
   - 其餘已註冊的音樂生成供應商，依 provider-id 順序排列。

如果供應商失敗，系統會自動嘗試下一個候選項。如果全部
失敗，錯誤會包含每次嘗試的詳細資料。

將 `agents.defaults.mediaGenerationAutoProviderFallback: false` 設為僅使用
明確的 `model`、`primary` 與 `fallbacks` 項目。

## 供應商注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，並取決於已設定的圖表加上用於提示/輸出欄位的節點對應。
    內建的 `comfy` Plugin 會透過音樂生成供應商登錄檔接入共用的
    `music_generate` 工具。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前的內建流程支援提示、選用的歌詞文字，
    以及選用的參考圖片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示、選用歌詞、純樂器模式、
    時長導引，以及透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth
    輸出 mp3。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- 當你想要模型選擇、供應商容錯移轉，以及內建的非同步工作/狀態流程時，
  使用**共用的供應商支援**路徑。
- 當你需要自訂工作流程圖表，或需要不屬於共用內建音樂功能的供應商時，
  使用 **Plugin 路徑 (ComfyUI)**。

如果你正在偵錯 ComfyUI 特定行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用供應商行為，請從
[Google (Gemini)](/zh-TW/providers/google) 或
[MiniMax](/zh-TW/providers/minimax) 開始。

## 供應商功能模式

共用音樂生成合約支援明確的模式宣告：

- `generate` 用於僅含提示的生成。
- 當請求包含一張或多張參考圖片時使用 `edit`。

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

舊版扁平欄位，例如 `maxInputImages`、`supportsLyrics` 與
`supportsFormat`，**不足以**宣告編輯支援。供應商應明確宣告
`generate` 與 `edit`，讓即時測試、合約測試與共用的 `music_generate`
工具能以確定性的方式驗證模式支援。

## 即時測試

共用內建供應商的選擇性即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Repo 包裝器：

```bash
pnpm test:live:media music
```

此即時檔案會從 `~/.profile` 載入缺少的供應商環境變數，預設優先使用
即時/環境 API 金鑰，而非已儲存的驗證設定檔，並在供應商啟用編輯模式時，
同時執行 `generate` 與已宣告的 `edit` 涵蓋範圍。目前涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `minimax`：僅 `generate`
- `comfy`：獨立的 Comfy 即時涵蓋範圍，不屬於共用供應商掃描

內建 ComfyUI 音樂路徑的選擇性即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

當這些區段完成設定時，Comfy live 檔案也涵蓋 Comfy 影像和影片工作流程。

## 相關

- [背景工作](/zh-TW/automation/tasks) — 用於分離式 `music_generate` 執行的工作追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概覽](/zh-TW/tools)

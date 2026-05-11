---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成提供者與模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate，在 Google Lyria、MiniMax 與 ComfyUI 工作流程中生成音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-05-11T20:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b355dd6f1f41074624b692edb8a597a65ad99fc3ad61d2ed5e32f1b6cf393244
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具可讓代理透過共用的音樂生成能力，以及已設定的供應商（目前包括 Google、MiniMax 與以工作流程設定的 ComfyUI）建立音樂或音訊。

對於由工作階段支援的代理執行，OpenClaw 會將音樂生成作為背景工作啟動、在工作總帳中追蹤，並在音軌準備完成後再次喚醒代理，讓代理可以告知使用者並附上完成的音訊。在使用僅訊息工具可見傳遞的群組/頻道聊天中，代理會透過訊息工具轉送結果。如果完成代理只寫入私密的最終回覆，OpenClaw 會退回為直接頻道傳送並附上生成的媒體。完成喚醒會明確警告代理，在這些路由中一般的最終回覆是私密的。

<Note>
內建共用工具只會在至少有一個音樂生成供應商可用時出現。如果你在代理的工具中看不到 `music_generate`，請設定 `agents.defaults.musicGenerationModel` 或設定供應商 API 金鑰。
</Note>

## 快速開始

<Tabs>
  <Tab title="由共用供應商支援">
    <Steps>
      <Step title="設定驗證">
        為至少一個供應商設定 API 金鑰，例如 `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
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
      <Step title="詢問代理">
        _「生成一首關於夜晚開車穿越霓虹城市的輕快 synthpop 音軌。」_

        代理會自動呼叫 `music_generate`。不需要工具允許清單。
      </Step>
    </Steps>

    對於沒有由工作階段支援的代理執行之直接同步情境，內建工具仍會退回為行內生成，並在工具結果中回傳最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI 工作流程">
    <Steps>
      <Step title="設定工作流程">
        使用工作流程 JSON 和提示/輸出節點設定 `plugins.entries.comfy.config.music`。
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

## 支援的供應商

| 供應商 | 預設模型               | 參考輸入 | 支援的控制項                                             | 驗證                                   |
| -------- | ---------------------- | ---------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | 最多 1 張圖片    | 工作流程定義的音樂或音訊                                  | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | 最多 10 張圖片   | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | 無               | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` 或 MiniMax OAuth     |

### 能力矩陣

`music_generate`、合約測試與共用即時掃描所使用的明確模式合約：

| 供應商 | `generate` | `edit` | 編輯限制 | 共用即時通道                                                              |
| -------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 張圖片  | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| Google   |     ✓      |   ✓    | 10 張圖片 | `generate`, `edit`                                                        |
| MiniMax  |     ✓      |   —    | 無        | `generate`                                                                |

使用 `action: "list"` 在執行階段檢查可用的共用供應商與模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 檢查作用中的工作階段支援音樂工作：

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
  `"status"` 會回傳目前的工作階段工作；`"list"` 會檢查供應商。
</ParamField>
<ParamField path="model" type="string">
  供應商/模型覆寫（例如 `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當供應商支援明確歌詞輸入時使用的選用歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當供應商支援時，要求僅輸出器樂。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（支援的供應商最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當供應商支援時使用的目標秒數長度提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當供應商支援時使用的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>
<ParamField path="timeoutMs" type="number">選用的供應商請求逾時，單位為毫秒。省略時，如果已設定 `agents.defaults.musicGenerationModel.timeoutMs`，OpenClaw 會使用該值。低於 10000ms 的值會提升至 10000ms，並在工具結果中回報。</ParamField>

<Note>
並非所有供應商都支援所有參數。OpenClaw 仍會在提交前驗證硬性限制，例如輸入數量。當供應商支援時長但其最大值短於請求值時，OpenClaw 會箝制到最接近的支援時長。若選定供應商或模型無法遵守真正不支援的選用提示，這些提示會在警告下被忽略。工具結果會回報已套用的設定；`details.normalization` 會擷取任何從請求到套用的對應。
</Note>

## 非同步行為

由工作階段支援的音樂生成會作為背景工作執行：

- **背景工作：** `music_generate` 會建立背景工作、立即回傳已開始/工作的回應，並稍後在後續代理訊息中張貼完成的音軌。
- **防止重複：** 當工作為 `queued` 或 `running` 時，同一工作階段中後續的 `music_generate` 呼叫會回傳工作狀態，而不是啟動另一個生成。使用 `action: "status"` 可明確檢查。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已佇列、執行中與終端狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型可以自行寫入面向使用者的後續訊息。
- **提示提示：** 同一工作階段中稍後的使用者/手動回合，會在音樂工作已在進行時取得小型執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段退回：** 沒有真正代理工作階段的直接/本機情境會行內執行，並在同一回合中回傳最終音訊結果。

### 工作生命週期

| 狀態        | 意義                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 工作已建立，正在等待供應商接受。                                                               |
| `running`   | 供應商正在處理（通常 30 秒到 3 分鐘，視供應商與時長而定）。                                    |
| `succeeded` | 音軌已就緒；代理會被喚醒並張貼到對話中。                                                       |
| `failed`    | 供應商錯誤或逾時；代理會以錯誤詳細資訊被喚醒。                                                 |

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

### 供應商選擇順序

OpenClaw 會依此順序嘗試供應商：

1. 工具呼叫中的 `model` 參數（如果代理指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用以驗證支援的供應商預設值進行自動偵測：
   - 目前的預設供應商優先；
   - 其餘已註冊音樂生成供應商按供應商 ID 順序。

如果供應商失敗，會自動嘗試下一個候選項目。如果全部失敗，錯誤會包含每次嘗試的詳細資訊。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 可只使用明確的 `model`、`primary` 和 `fallbacks` 項目。

## 供應商備註

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，且取決於已設定的圖形與提示/輸出欄位的節點對應。內建的 `comfy` Plugin 會透過音樂生成供應商登錄檔插入共用 `music_generate` 工具。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前的內建流程支援提示、選用歌詞文字與選用參考圖片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示、選用歌詞、器樂模式、時長引導，以及透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth 產生 mp3 輸出。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- **由共用供應商支援**，當你需要模型選擇、供應商容錯移轉，以及內建非同步工作/狀態流程時。
- **Plugin 路徑 (ComfyUI)**，當你需要自訂工作流程圖形，或需要不屬於共用內建音樂能力的供應商時。

如果你正在偵錯 ComfyUI 特定行為，請參閱 [ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用供應商行為，請從 [Google (Gemini)](/zh-TW/providers/google) 或 [MiniMax](/zh-TW/providers/minimax) 開始。

## 供應商能力模式

共用音樂生成合約支援明確模式宣告：

- `generate` 用於僅提示生成。
- `edit` 用於請求包含一張或多張參考圖片時。

新的供應商實作應優先使用明確模式區塊：

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

舊版平面欄位（例如 `maxInputImages`、`supportsLyrics` 和 `supportsFormat`）**不足以**宣告編輯支援。供應商應明確宣告 `generate` 和 `edit`，讓即時測試、合約測試與共用 `music_generate` 工具可以確定性地驗證模式支援。

## 即時測試

共用內建供應商的選擇性即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media music
```

這個 live 檔案會從 `~/.profile` 載入缺少的提供者環境變數，預設會優先使用 live/env API 金鑰，而不是已儲存的驗證設定檔，並且在提供者啟用編輯模式時，同時執行 `generate` 和宣告的 `edit` 覆蓋範圍。目前覆蓋範圍：

- `google`：`generate` 加上 `edit`
- `minimax`：僅 `generate`
- `comfy`：獨立的 Comfy live 覆蓋範圍，不屬於共用提供者掃描

為隨附的 ComfyUI 音樂路徑選擇加入 live 覆蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

當設定了對應區段時，Comfy live 檔案也會涵蓋 comfy 圖像和影片工作流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 分離式 `music_generate` 執行的任務追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [組態參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概覽](/zh-TW/tools)

---
read_when:
    - 透過代理產生音樂或音訊
    - 設定音樂生成供應商與模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate 在 ComfyUI、fal、Google Lyria、MiniMax 與 OpenRouter 工作流程中生成音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-06-27T20:08:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具可讓代理程式透過已設定的提供者使用共享音樂生成能力建立音樂或音訊，目前支援 ComfyUI、fal、Google、MiniMax 和 OpenRouter。

對於由工作階段支援的代理程式執行，OpenClaw 會將音樂生成作為背景任務啟動，在任務帳本中追蹤它，然後在曲目準備好時再次喚醒代理程式，讓代理程式告知使用者並附上完成的音訊。完成代理程式會遵循工作階段的一般可見回覆模式：設定時自動送出最終回覆，或在工作階段需要訊息工具時使用 `message(action="send")`。如果請求者工作階段處於非作用中狀態，或其作用中喚醒失敗，而且完成回覆仍缺少部分已生成音訊，OpenClaw 會送出只包含缺少音訊的冪等直接備援。

<Note>
內建共享工具只會在至少有一個音樂生成提供者可用時出現。如果你在代理程式的工具中沒有看到 `music_generate`，請設定 `agents.defaults.musicGenerationModel` 或設定提供者 API 金鑰。
</Note>

## 快速開始

<Tabs>
  <Tab title="共享提供者支援">
    <Steps>
      <Step title="設定驗證">
        為至少一個提供者設定 API 金鑰，例如 `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
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
        _「生成一首關於夜間駕車穿越霓虹城市的輕快 synthpop 曲目。」_

        代理程式會自動呼叫 `music_generate`。不需要工具允許清單。
      </Step>
    </Steps>

    對於沒有由工作階段支援的代理程式執行的直接同步情境，內建工具仍會退回內嵌生成，並在工具結果中回傳最終媒體路徑。

  </Tab>
  <Tab title="ComfyUI 工作流程">
    <Steps>
      <Step title="設定工作流程">
        使用工作流程 JSON 和提示/輸出節點設定 `plugins.entries.comfy.config.music`。
      </Step>
      <Step title="雲端驗證（選用）">
        若使用 Comfy Cloud，請設定 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
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

| 提供者     | 預設模型                     | 參考輸入       | 支援的控制項                                          | 驗證                                   |
| ---------- | ---------------------------- | -------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最多 1 張圖片  | 由工作流程定義的音樂或音訊                            | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 無             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 或 `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 最多 10 張圖片 | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 無             | `lyrics`, `instrumental`, `format=mp3`                | `MINIMAX_API_KEY` 或 MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 最多 1 張圖片  | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### 能力矩陣

`music_generate`、合約測試和共享即時掃描使用的明確模式合約：

| 提供者     | `generate` | `edit` | 編輯限制   | 共享即時通道                                                              |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 張圖片   | 不在共享掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋             |
| fal        |     ✓      |   —    | 無         | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 張圖片  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | 無         | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 張圖片   | `generate`, `edit`                                                        |

使用 `action: "list"` 在執行階段檢查可用的共享提供者和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 檢查作用中的由工作階段支援的音樂任務：

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
  提供者/模型覆寫（例如 `google/lyria-3-pro-preview`、`comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當提供者支援明確歌詞輸入時使用的選用歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，請求僅器樂輸出。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（支援的提供者最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援長度提示時使用的目標秒數。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時使用的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當提供者支援長度，但使用的最大值短於請求值時，OpenClaw 會箝制到最接近的支援長度。當選取的提供者或模型無法遵循時，真正不支援的選用提示會被忽略並附上警告。工具結果會回報已套用的設定；`details.normalization` 會擷取任何從請求到套用的對應。
</Note>

提供者請求逾時僅作為操作者設定。OpenClaw 會在已設定時使用 `agents.defaults.musicGenerationModel.timeoutMs`，將低於 120000ms 的值提升到 120000ms，否則提供者請求預設為 300000ms。

## 非同步行為

由工作階段支援的音樂生成會作為背景任務執行：

- **背景任務：** `music_generate` 會建立背景任務，立即回傳已開始/任務回應，並稍後在後續代理程式訊息中發布完成的曲目。
- **防止重複：** 當任務處於 `queued` 或 `running` 時，同一工作階段中後續的 `music_generate` 呼叫會回傳任務狀態，而不是啟動另一個生成。使用 `action: "status"` 可明確檢查。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已排隊、執行中和終止狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一工作階段，讓模型自行撰寫面向使用者的後續訊息。
- **提示提示：** 同一工作階段中的後續使用者/手動回合會在音樂任務已在進行中時取得小型執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段備援：** 沒有真實代理程式工作階段的直接/本機情境會內嵌執行，並在同一回合中回傳最終音訊結果。

### 任務生命週期

| 狀態        | 含義                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 任務已建立，正在等待提供者接受。                                                               |
| `running`   | 提供者正在處理（通常 30 秒到 3 分鐘，取決於提供者與長度）。                                    |
| `succeeded` | 曲目已準備好；代理程式會被喚醒並將其發布到對話中。                                             |
| `failed`    | 提供者錯誤或逾時；代理程式會帶著錯誤詳細資訊被喚醒。                                           |

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

### 提供者選擇順序

OpenClaw 會依下列順序嘗試提供者：

1. 工具呼叫中的 `model` 參數（如果代理程式指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用由驗證支援的提供者預設值進行自動偵測：
   - 目前預設提供者優先；
   - 其餘已註冊音樂生成提供者依 provider-id 順序。

如果提供者失敗，會自動嘗試下一個候選項目。如果全部失敗，錯誤會包含每次嘗試的詳細資訊。

設定 `agents.defaults.mediaGenerationAutoProviderFallback: false` 即可只使用明確的 `model`、`primary` 和 `fallbacks` 項目。

## 提供者注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，並取決於已設定的圖形以及提示/輸出欄位的節點對應。內建的 `comfy` 外掛會透過音樂生成提供者登錄接入共享 `music_generate` 工具。
  </Accordion>
  <Accordion title="fal">
    透過共享提供者驗證路徑使用 fal 模型端點。內建提供者預設為 `fal-ai/minimax-music/v2.6`，並同時公開 `fal-ai/ace-step/prompt-to-audio` 和 `fal-ai/stable-audio-25/text-to-audio` 供提示轉音訊請求使用。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前內建流程支援提示、選用歌詞文字和選用參考圖片。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示、選用歌詞、器樂模式，以及透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth 產生 mp3 輸出。
  </Accordion>
  <Accordion title="OpenRouter">
    使用已啟用串流的 OpenRouter chat completions 音訊輸出。內建提供者預設為 `google/lyria-3-pro-preview`，並同時公開 `openrouter/google/lyria-3-clip-preview`。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- **共享提供者支援**：當你需要模型選擇、提供者容錯移轉，以及內建非同步任務/狀態流程時使用。
- **外掛路徑 (ComfyUI)**：當你需要自訂工作流程圖形，或需要不屬於共享內建音樂能力的提供者時使用。

如果你正在偵錯 ComfyUI 特定行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用提供者
行為，請從 [fal](/zh-TW/providers/fal)、[Google (Gemini)](/zh-TW/providers/google)、
[MiniMax](/zh-TW/providers/minimax) 或 [OpenRouter](/zh-TW/providers/openrouter) 開始。

## 提供者能力模式

共用的音樂生成合約支援明確的模式宣告：

- `generate` 用於僅提示詞生成。
- 當請求包含一張或多張參考圖片時使用 `edit`。

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

舊版扁平欄位（例如 `maxInputImages`、`supportsLyrics` 和
`supportsFormat`）**不足以**宣告編輯支援。提供者
應明確宣告 `generate` 和 `edit`，讓即時測試、合約
測試，以及共用的 `music_generate` 工具能夠以確定性方式驗證模式支援。

## 即時測試

為共用的內建提供者選擇加入即時覆蓋：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

儲存庫包裝器：

```bash
pnpm test:live:media music
```

這個即時檔案預設會優先使用已匯出的提供者環境變數，而不是已儲存的驗證
設定檔；當提供者啟用編輯模式時，也會執行 `generate` 和已宣告的 `edit`
覆蓋。目前覆蓋範圍：

- `google`：`generate` 加上 `edit`
- `fal`：僅 `generate`
- `minimax`：僅 `generate`
- `openrouter`：`generate` 加上 `edit`
- `comfy`：獨立的 Comfy 即時覆蓋，不屬於共用提供者掃描

為內建的 ComfyUI 音樂路徑選擇加入即時覆蓋：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

當相關區段已設定時，Comfy 即時檔案也會涵蓋 comfy 圖片與影片工作流程。

## 相關

- [背景工作](/zh-TW/automation/tasks) — 分離式 `music_generate` 執行的工作追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概覽](/zh-TW/tools)

---
read_when:
    - 透過代理程式產生音樂或音訊
    - 設定音樂生成提供者和模型
    - 了解 music_generate 工具參數
sidebarTitle: Music generation
summary: 透過 music_generate 在 ComfyUI、fal、Google Lyria、MiniMax 與 OpenRouter 工作流程中產生音樂
title: 音樂生成
x-i18n:
    generated_at: "2026-07-05T11:47:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

`music_generate` 工具會透過共用的音樂生成能力建立音樂或音訊，並由 ComfyUI、fal、Google、MiniMax 和 OpenRouter 支援。

<Note>
`music_generate` 只會在至少有一個音樂生成提供者可用時出現：明確的 `agents.defaults.musicGenerationModel` 設定，或已設定驗證的提供者（例如已設定 API 金鑰）。
</Note>

對於有工作階段支援的代理執行，`music_generate` 會以背景工作啟動，在工作總帳中追蹤進度，然後在曲目準備好時喚醒代理，讓它告知使用者並附上完成的音訊。完成代理會遵循工作階段的可見回覆合約：設定時自動傳送最終回覆，或在工作階段需要訊息工具時使用 `message(action="send")`。如果請求者工作階段處於非作用中狀態，或喚醒失敗且回覆中仍缺少產生的音訊，OpenClaw 會只針對缺少的音訊傳送冪等的直接後備回覆。

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
      <Step title="詢問代理">
        _"生成一首關於夜間開車穿越霓虹城市、節奏明快的 synthpop 曲目。"_

        代理會自動呼叫 `music_generate`。不需要工具允許清單。
      </Step>
    </Steps>

    沒有工作階段支援的代理執行時（直接/本機情境），工具會以內嵌方式執行，並在同一個工具結果中傳回最終媒體路徑。

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

使用 `action: "list"` 檢查可用的提供者/模型，並使用 `action: "status"` 檢查作用中的工作階段支援音樂工作：

```text
/tool music_generate action=list
/tool music_generate action=status
```

直接生成範例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 支援的提供者

| 提供者 | 預設模型 | 參考輸入 | 支援的控制項 | 驗證 |
| ---------- | ---------------------------- | ---------------- | ----------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | 最多 1 張圖片    | 工作流程定義的音樂或音訊                       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | 無             | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` 或 `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | 最多 10 張圖片  | `lyrics`, `instrumental`, `format`                    | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | 無             | `lyrics`, `instrumental`, `format`（僅 mp3）         | `MINIMAX_API_KEY` 或 MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | 最多 1 張圖片    | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

MiniMax 會註冊兩個共用相同模型的提供者 ID：`minimax` 用於 API 金鑰驗證，`minimax-portal` 用於 OAuth。模型參照會遵循驗證路徑（`minimax/music-2.6` 與 `minimax-portal/music-2.6`）；請參閱
[MiniMax](/zh-TW/providers/minimax#music-generation)。

fal 也會公開 `fal-ai/ace-step/prompt-to-audio`（wav、無歌詞、無純樂器切換）和 `fal-ai/stable-audio-25/text-to-audio`（wav、僅提示），以及其預設的 MiniMax 支援模型。Google 的預設
`lyria-3-clip-preview` 僅輸出 mp3；`lyria-3-pro-preview` 也支援 wav。MiniMax 也會公開 `music-2.6-free`、`music-cover` 和
`music-cover-free`。OpenRouter 也會公開 `google/lyria-3-clip-preview`。

### 能力矩陣

`music_generate`、合約測試和共用即時掃描使用的明確模式合約：

| 提供者 | `generate` | `edit` | 編輯限制 | 共用即時通道 |
| ---------- | :--------: | :----: | ---------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 張圖片    | 不在共用掃描中；由 `extensions/comfy/comfy.live.test.ts` 涵蓋 |
| fal        |     ✓      |   —    | 無       | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 張圖片  | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | 無       | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 張圖片    | `generate`, `edit`                                                        |

## 工具參數

<ParamField path="prompt" type="string" required>
  音樂生成提示。`action: "generate"` 必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 會傳回目前的工作階段工作；`"list"` 會檢查提供者。
</ParamField>
<ParamField path="model" type="string">
  提供者/模型覆寫（例如 `google/lyria-3-pro-preview`、
  `comfy/workflow`）。
</ParamField>
<ParamField path="lyrics" type="string">
  當提供者支援明確歌詞輸入時，可選擇提供歌詞。
</ParamField>
<ParamField path="instrumental" type="boolean">
  當提供者支援時，請求僅純樂器輸出。
</ParamField>
<ParamField path="image" type="string">
  單一參考圖片路徑或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  多張參考圖片（支援的提供者最多 10 張）。
</ParamField>
<ParamField path="durationSeconds" type="number">
  當提供者支援時，以秒為單位的目標時長提示。
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  當提供者支援時的輸出格式提示。
</ParamField>
<ParamField path="filename" type="string">輸出檔名提示。</ParamField>

<Note>
並非所有提供者都支援所有參數。OpenClaw 仍會在提交前驗證輸入數量等硬性限制。當提供者支援時長但其最大值短於請求值時，OpenClaw
會裁切到最接近的支援時長。若選取的提供者或模型無法遵循真正不支援的選用提示，這些提示會被忽略並顯示警告。工具結果會回報已套用的設定；`details.normalization`
會擷取任何從請求到套用的對應。
</Note>

提供者請求逾時僅屬於操作員設定。OpenClaw 會在已設定時使用
`agents.defaults.musicGenerationModel.timeoutMs`，將低於 120000ms 的值提高到 120000ms，否則提供者請求預設為 300000ms。

## 非同步行為

工作階段支援的音樂生成會作為背景工作執行：

- **背景工作：** `music_generate` 會建立背景工作，立即傳回已啟動/工作回應，並稍後在後續代理訊息中張貼完成的曲目。
- **重複防止：** 當工作為 `queued` 或 `running` 時，同一工作階段中稍後的 `music_generate` 呼叫會傳回工作狀態，而不是啟動另一個生成。使用 `action: "status"` 可明確檢查。最近完成的相符請求也會在 2 分鐘內去重。
- **狀態查詢：** `openclaw tasks list` 或 `openclaw tasks show <taskId>` 會檢查已排入佇列、執行中和終端狀態。
- **完成喚醒：** OpenClaw 會將內部完成事件注入回同一個工作階段，讓模型可以自行撰寫面向使用者的後續訊息。
- **提示提示：** 同一工作階段中稍後的使用者/手動回合會在已有音樂工作進行中時取得一小段執行階段提示，讓模型不會盲目再次呼叫 `music_generate`。
- **無工作階段後備：** 沒有真實代理工作階段的直接/本機情境會以內嵌方式執行，並在同一回合傳回最終音訊結果。

### 工作生命週期

音樂工作會呈現與一般工作登錄相同的狀態（完整狀態機請參閱
[背景工作](/zh-TW/automation/tasks#task-lifecycle)，包括 `timed_out`、`cancelled` 和 `lost`）。大多數音樂執行會經過：

| 狀態 | 意義 |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | 工作已建立，正在等待提供者接受。                                           |
| `running`   | 提供者正在處理（通常為 30 秒到 3 分鐘，取決於提供者和時長）。 |
| `succeeded` | 曲目已就緒；代理會被喚醒並將其張貼到對話中。                                 |
| `failed`    | 提供者錯誤或逾時；代理會帶著錯誤詳細資料被喚醒。                                 |

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

1. 工具呼叫中的 `model` 參數（如果代理指定）。
2. 設定中的 `musicGenerationModel.primary`。
3. 依序使用 `musicGenerationModel.fallbacks`。
4. 僅使用有驗證支援的提供者預設值進行自動偵測：
   - 目前的預設文字模型提供者優先，如果它也提供音樂生成；
   - 其餘已註冊的音樂生成提供者，依提供者 ID 字母順序排列。

如果提供者失敗，會自動嘗試下一個候選項。如果全部失敗，錯誤會包含每次嘗試的詳細資料。

將 `agents.defaults.mediaGenerationAutoProviderFallback: false` 設為只使用明確的 `model`、`primary` 和 `fallbacks` 項目。

## 提供者注意事項

<AccordionGroup>
  <Accordion title="ComfyUI">
    由工作流程驅動，且提示/輸出欄位取決於已設定的圖形與節點對應。
    內建的 `comfy` 外掛會透過音樂生成供應商登錄機制，接入共用的
    `music_generate` 工具。
  </Accordion>
  <Accordion title="fal">
    透過共用的供應商驗證路徑使用 fal 模型端點。內建供應商預設為
    `fal-ai/minimax-music/v2.6`，也會公開
    `fal-ai/ace-step/prompt-to-audio` 與
    `fal-ai/stable-audio-25/text-to-audio` 以供提示轉音訊請求使用。
    歌詞與演奏模式僅限 MiniMax 模型；另外兩個模型僅支援提示。
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    使用 Lyria 3 批次生成。目前的內建流程支援提示、選用歌詞文字，
    以及選用參考圖片。預設的 `lyria-3-clip-preview` 模型僅輸出 mp3；
    `lyria-3-pro-preview` 模型也支援 wav。
  </Accordion>
  <Accordion title="MiniMax">
    使用批次 `music_generation` 端點。支援提示、選用歌詞、演奏模式，
    並可透過 `minimax` API 金鑰驗證或 `minimax-portal` OAuth 輸出 mp3。
    也會公開 `music-2.6-free`、`music-cover` 與 `music-cover-free` 模型。
  </Accordion>
  <Accordion title="OpenRouter">
    在啟用串流的情況下使用 OpenRouter 聊天補全音訊輸出。內建供應商預設為
    `google/lyria-3-pro-preview`，也會公開
    `openrouter/google/lyria-3-clip-preview`。
  </Accordion>
</AccordionGroup>

## 選擇正確路徑

- **共用供應商支援**：當你需要模型選擇、供應商容錯移轉，以及內建非同步任務/狀態流程時使用。
- **外掛路徑 (ComfyUI)**：當你需要自訂工作流程圖形，或需要不屬於共用內建音樂能力的供應商時使用。

如果你正在偵錯 ComfyUI 特定行為，請參閱
[ComfyUI](/zh-TW/providers/comfy)。如果你正在偵錯共用供應商行為，請從
[fal](/zh-TW/providers/fal)、[Google (Gemini)](/zh-TW/providers/google)、
[MiniMax](/zh-TW/providers/minimax) 或 [OpenRouter](/zh-TW/providers/openrouter) 開始。

## 供應商能力模式

共用音樂生成合約支援明確的模式宣告：

- `generate` 用於僅提示生成。
- `edit` 用於請求包含一張或多張參考圖片時。

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

像 `maxInputImages`、`supportsLyrics` 和 `supportsFormat` 這類舊版扁平欄位，
**不足以** 宣告編輯支援。供應商應明確宣告 `generate` 與 `edit`，
讓即時測試、合約測試，以及共用的 `music_generate` 工具能以確定性的方式驗證模式支援。

## 即時測試

共用內建供應商（fal、Google、MiniMax、OpenRouter）的選用即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

等效的 repo 包裝命令，會驅動同一個測試檔案：

```bash
pnpm test:live:media:music
```

此即時檔案預設會優先使用已匯出的供應商環境變數，再使用已儲存的驗證設定檔；
當供應商啟用編輯模式時，也會執行 `generate` 與已宣告的 `edit` 涵蓋範圍。目前涵蓋範圍：

- `google`：`generate` 加上 `edit`
- `fal`：僅 `generate`
- `minimax`：僅 `generate`
- `openrouter`：`generate` 加上 `edit`
- `comfy`：獨立的 Comfy 即時涵蓋範圍，不屬於共用供應商掃描

內建 ComfyUI 音樂路徑的選用即時涵蓋範圍：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

當設定了相關區段時，Comfy 即時檔案也會涵蓋 comfy 圖片與影片工作流程。

## 相關

- [背景任務](/zh-TW/automation/tasks) — 分離式 `music_generate` 執行的任務追蹤
- [ComfyUI](/zh-TW/providers/comfy)
- [設定參考](/zh-TW/gateway/config-agents#agent-defaults) — `musicGenerationModel` 設定
- [Google (Gemini)](/zh-TW/providers/google)
- [MiniMax](/zh-TW/providers/minimax)
- [模型](/zh-TW/concepts/models) — 模型設定與容錯移轉
- [工具概覽](/zh-TW/tools)

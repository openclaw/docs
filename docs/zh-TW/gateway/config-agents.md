---
read_when:
    - 調整代理預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與對話設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-06T10:49:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c9f5c0cee452a223ca4aab91edd58127cb7b52d905012a86ff45e57261524a8
    source_path: gateway/config-agents.md
    workflow: 16
---

代理程式範圍的設定鍵位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 之下。關於頻道、工具、閘道執行階段和其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：設定 `OPENCLAW_WORKSPACE_DIR` 時使用該值，否則使用 `~/.openclaw/workspace`（或在 `OPENCLAW_PROFILE` 設為非預設設定檔時使用 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。當你不想把該路徑寫入設定時，可使用環境變數將預設代理程式
指向已掛載的工作區。

### `agents.defaults.repoRoot`

系統提示詞 Runtime 行中顯示的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區向上尋找並自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

未設定 `agents.list[].skills` 的代理程式所使用的選用預設 Skills 允許清單。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 取代預設值
      { id: "locked-down", skills: [] }, // 無 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 表示預設不限制 Skills。
- 省略 `agents.list[].skills` 以繼承預設值。
- 設定 `agents.list[].skills: []` 表示無 Skills。
- 非空的 `agents.list[].skills` 清單是該代理程式的最終集合；
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立所選的選用工作區檔案，同時仍會寫入必要的啟動檔案（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

控制何時將工作區啟動檔案注入系統提示詞。預設值：`"always"`。

- `"continuation-skip"`：安全的續接回合（完成的助理回應之後）會略過重新注入工作區啟動內容，以減少提示詞大小。心跳偵測執行和壓縮後重試仍會重建脈絡。
- `"never"`：在每個回合停用工作區啟動和脈絡檔案注入。僅對完全自行管理提示詞生命週期的代理程式使用此值（自訂脈絡引擎、建置自身脈絡的原生執行階段，或不需啟動檔案的專用工作流程）。心跳偵測和壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

個別代理程式覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的最大字元數。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

個別代理程式覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案合計注入的最大總字元數。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

個別代理程式覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值會
繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 個別代理程式啟動設定檔覆寫

當某個代理程式需要不同於共用預設值的提示詞注入行為時，使用個別代理程式啟動設定檔覆寫。省略的欄位會繼承自
`agents.defaults`。

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制啟動脈絡被截斷時，代理程式可見的系統提示詞通知。
預設值：`"always"`。

- `"off"`：永不將截斷通知文字注入系統提示詞。
- `"once"`：每個唯一截斷簽章只注入一次精簡通知。
- `"always"`：存在截斷時，每次執行都注入精簡通知（建議）。

詳細的原始/注入計數與設定調校欄位會保留在診斷資訊中，
例如脈絡/狀態報告與記錄；例行 WebChat 使用者/執行階段脈絡只會
取得精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 脈絡預算所有權對照表

OpenClaw 有多個高容量提示詞/脈絡預算，而且這些預算會依子系統
刻意拆分，而不是全部流經單一通用
控制項。

| 預算                                                           | 涵蓋範圍                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 一般工作區啟動注入                                                                                                                                              |
| `agents.defaults.startupContext.*`                             | 一次性的重設/啟動模型執行前導內容，包括最近每日的 `memory/*.md` 檔案。純聊天 `/new` 和 `/reset` 會在不叫用模型的情況下確認重設 |
| `skills.limits.*`                                              | 注入系統提示詞的精簡 Skills 清單                                                                                                                                |
| `agents.defaults.contextLimits.*`                              | 有界限的執行階段摘錄與已注入的執行階段擁有區塊                                                                                                                |
| `memory.qmd.limits.*`                                          | 已索引記憶搜尋片段與注入大小                                                                                                                                    |

對應的個別代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制重設/啟動模型執行時注入的第一回合啟動前導內容。
純聊天 `/new` 和 `/reset` 命令會在不叫用
模型的情況下確認重設，因此不會載入這段前導內容。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

有界限執行階段脈絡表面的共用預設值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：加入截斷中繼資料與續接通知前，
  預設 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設 `memory_get` 行視窗。
- `toolResultMaxChars`：進階即時工具結果上限，用於持久化
  結果與溢位復原。未設定時會使用模型脈絡自動上限：
  低於 100K token 時為 `16000` 字元，100K+ token 時為 `32000` 字元，200K+
  token 時為 `64000` 字元。長脈絡模型可接受最高 `1000000` 的明確值，
  但有效上限仍受限於模型脈絡視窗約 30%。
  `openclaw doctor --deep` 會列印有效上限，
  且 doctor 只會在明確覆寫已過時或沒有作用時發出警告。
- `postCompactionMaxChars`：壓縮後
  重新整理注入期間使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 控制項的個別代理程式覆寫。省略的欄位會繼承
自 `agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // 此代理程式的進階上限
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系統提示詞的精簡 Skills 清單全域上限。這
不影響按需讀取 `SKILL.md` 檔案。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示詞預算的個別代理程式覆寫。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在 provider 呼叫前，transcript/工具圖片區塊中圖片最長邊的最大像素大小。
預設值：`1200`。

較低的值通常會降低大量截圖執行中的 vision-token 用量與請求承載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

從檔案路徑、URL 和媒體參照載入圖片時的圖片工具壓縮/細節偏好。
預設值：`auto`。

OpenClaw 會依所選圖片模型調整縮放階梯。例如，Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL 和託管的 Llama 4 視覺模型可以使用比舊版/預設高細節視覺路徑更大的圖片，而多圖片回合在 `auto` 模式下會更積極壓縮，以控制 token 與延遲成本。

值：

- `auto`：依模型限制與圖片數量調整。
- `efficient`：偏好較小圖片，以降低 token 與位元組用量。
- `balanced`：使用標準的折衷階梯。
- `high`：為截圖、圖表和文件圖片保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示詞脈絡使用的時區（不是訊息時間戳）。會退回至主機時區。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系統提示詞中的時間格式。預設值：`auto`（作業系統偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      utilityModel: "openai/gpt-5.4-mini",
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 4,
    },
  },
}
```

- `model`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 字串形式只設定主要模型。
  - 物件形式會設定主要模型加上有序的容錯移轉模型。
- `utilityModel`：選用的 `provider/model` 參照或別名，用於短小的內部工作。它目前支援產生的 Control UI 工作階段標題、Telegram DM 主題標題，以及 Discord 自動討論串標題。未設定時，這些工作會退回使用代理的主要模型；`agents.list[].utilityModel` 會覆寫預設值，而作業特定的模型覆寫會優先於兩者。公用工作會進行獨立的模型呼叫，並將工作特定內容傳送給選定的模型提供者。Dashboard 標題產生最多會傳送第一則非命令訊息的前 1,000 個字元。請選擇符合你的成本與資料處理需求的提供者。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑用作其視覺模型設定。
  - 當選定/預設模型無法接受圖片輸入時，也會用作備援路由。
  - 建議使用明確的 `provider/model` 參照。為了相容性，也接受裸 ID；如果裸 ID 在 `models.providers.*.models` 中唯一符合已設定且支援圖片的項目，OpenClaw 會將它限定到該提供者。若已設定的符合項目不明確，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用圖片產生能力，以及任何未來會產生圖片的工具/外掛介面使用。
  - 典型值：原生 Gemini 圖片產生使用 `google/gemini-3.1-flash-image-preview`，fal 使用 `fal/fal-ai/flux/dev`，OpenAI Images 使用 `openai/gpt-image-2`，或透明背景 OpenAI PNG/WebP 輸出使用 `openai/gpt-image-1.5`。
  - 如果你直接選取提供者/模型，也請設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的圖片產生提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用音樂產生能力與內建 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`，或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的音樂產生提供者。
  - 如果你直接選取提供者/模型，也請設定相符的提供者驗證/API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用影片產生能力與內建 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`，或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的影片產生提供者。
  - 如果你直接選取提供者/模型，也請設定相符的提供者驗證/API 金鑰。
  - 官方 Qwen 影片產生外掛支援最多 1 部輸出影片、1 張輸入圖片、4 部輸入影片、10 秒長度，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會退回使用 `imageModel`，接著退回已解析的工作階段/預設模型。
- `pdfMaxBytesMb`：當呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中擷取備援模式考量的預設最大頁數。
- `verboseDefault`：代理的預設詳細層級。值：`"off"`、`"on"`、`"full"`。預設值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要與進度草稿工具行的詳細模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令/詳細資料）。各代理的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。各代理的 `agents.list[].reasoningDefault` 會覆寫此預設值。已設定的推理預設值只會在未設定逐訊息或工作階段推理覆寫時，套用於擁有者、授權傳送者，或 operator-admin 閘道情境。
- `elevatedDefault`：代理的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設值：`"on"`。
- `model.primary`：格式為 `provider/model`（例如 OpenAI API 金鑰或 Codex OAuth 存取使用 `openai/gpt-5.5`）。如果省略提供者，OpenClaw 會先嘗試別名，接著嘗試該確切模型 ID 的唯一已設定提供者符合項目，最後才退回到已設定的預設提供者（已淘汰的相容行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的提供者/模型，而不是顯示過時的已移除提供者預設值。
- `models`：已設定的模型目錄，以及 `/model` 的允許清單。每個項目可包含 `alias`（捷徑）和 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `"openai/*": {}` 或 `"vllm/*": {}` 等 `provider/*` 項目，可顯示所選提供者的所有已發現模型，而不必手動列出每個模型 ID。
  - 當該提供者的每個動態發現模型都應使用相同執行階段時，請將 `agentRuntime` 加到 `provider/*` 項目。精確的 `provider/model` 執行階段政策仍優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕會移除既有允許清單項目的取代。
  - 提供者範圍的設定/入門流程會將所選提供者模型合併到此對應中，並保留已設定的無關提供者。
  - 對於直接 OpenAI Responses 模型，伺服器端壓縮會自動啟用。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫閾值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#advanced-configuration)。
- `params`：套用至所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基底）會被 `agents.defaults.models["provider/model"].params`（逐模型）覆寫，接著 `agents.list[].params`（符合的代理 ID）會依鍵覆寫。詳情請參閱 [提示快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 全域預設提供者路由政策。OpenClaw 會將其轉發到 OpenRouter 的請求 `provider` 物件；逐模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和代理參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：進階透傳 JSON，會合併到 OpenAI 相容代理的 `api: "openai-completions"` 請求主體中。如果它與產生的請求鍵衝突，額外主體會優先；非原生 completions 路由之後仍會移除 OpenAI 專用的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 相容的聊天範本引數，會合併到頂層 `api: "openai-completions"` 請求主體中。對於關閉 thinking 的 `vllm/nemotron-3-*`，內建 vLLM 外掛會自動傳送 `enable_thinking: false` 與 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 與 Nemotron thinking 模型會公開二元 `/think` 選項（`off`、`on`），而不是多層級的 effort 階梯。
- `compat.thinkingFormat`：OpenAI 相容的 thinking 酬載樣式。Together 樣式的 `reasoning.enabled` 使用 `"together"`，Qwen 樣式的頂層 `enable_thinking` 使用 `"qwen"`，或在支援請求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM）上，針對 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 會將停用的 thinking 對應為 `false`，將啟用的 thinking 對應為 `true`，且已設定的 vLLM Qwen 模型會針對這些格式公開二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：逐模型的 OpenAI 相容推理 effort 清單。對於真正接受它的自訂端點，請包含 `"xhigh"`；OpenClaw 之後會在命令選單、閘道工作階段列、工作階段修補驗證、代理命令列介面驗證，以及該已設定提供者/模型的 `llm-task` 驗證中公開 `/think xhigh`。當後端需要標準層級的提供者特定值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留 thinking 選用設定。啟用且 thinking 開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重播先前的 `reasoning_content`；請參閱 [Z.AI thinking 與保留 thinking](/zh-TW/providers/zai#advanced-configuration)。
- `localService`：選用的提供者層級程序管理器，用於本機/自託管模型伺服器。當選定模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`），如果端點關閉，則以 `args` 啟動 `command`，等待最多 `readyTimeoutMs`，然後傳送模型請求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序保持執行直到 OpenClaw 結束；正值會在該毫秒數的閒置時間後停止由 OpenClaw 啟動的程序。請參閱 [本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策屬於提供者或模型，而不是 `agents.defaults`。提供者全域規則使用 `models.providers.<provider>.agentRuntime`，模型特定規則使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI 提供者上的 OpenAI 代理模型預設會選取 Codex。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image`，以及備援新增/移除命令）會儲存標準物件形式，並盡可能保留既有備援清單。
- `maxConcurrent`：跨工作階段的最大平行代理執行數（每個工作階段仍會序列化）。預設值：`4`。

### 執行階段政策

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`、`"openclaw"`、已註冊的外掛 harness id，或支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 會讓已註冊的外掛 harness 認領支援的回合，且在沒有 harness 符合時使用 OpenClaw。明確的外掛執行階段（例如 `id: "codex"`）需要該 harness，且若其不可用或失敗，會封閉失敗。
- `id: "pi"` 僅作為 `openclaw` 的已棄用別名被接受，用於保留 v2026.5.22 及更早版本已出貨的設定。新的設定應使用 `openclaw`。
- 執行階段優先順序會先採用精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），接著是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 的提供者範圍政策。
- 整個代理程式的執行階段鍵是舊版項目。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選，以及 `OPENCLAW_AGENT_RUNTIME` 都會被執行階段選擇忽略。執行 `openclaw doctor --fix` 以移除過期值。
- OpenAI 代理程式模型預設使用 Codex harness；當你想明確指定時，provider/model `agentRuntime.id: "codex"` 仍然有效。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/<model>` 參照為了相容性仍可運作，但新的設定應保持 provider/model 選擇為標準形式，並將執行後端放在 provider/model 執行階段政策中。
- 這只控制文字代理程式回合的執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用其 provider/model 設定。

**內建別名簡寫**（僅在模型位於 `agents.defaults.models` 時套用）：

| 別名                | 模型                            |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

你設定的別名一律優先於預設值。

Z.AI GLM-4.x 模型會自動啟用思考模式，除非你設定 `--thinking off`，或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型預設會啟用 `tool_stream` 以串流工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 可停用它。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設會關閉思考；明確啟用自適應思考時，Anthropic 由提供者擁有的 effort 預設值為 `high`。Claude 4.6 模型在未設定明確思考層級時，預設為 `adaptive`。

### `agents.defaults.cliBackends`

用於純文字備援執行的選用命令列介面後端（無工具呼叫）。在 API 提供者失敗時可作為備份。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- 命令列介面後端以文字優先；工具一律停用。
- 設定 `sessionArg` 時支援工作階段。
- 當 `imageArg` 接受檔案路徑時，支援影像傳遞。
- `reseedFromRawTranscriptWhenUncompacted: true` 可讓後端在第一個壓縮摘要存在之前，從有界的原始 OpenClaw 逐字稿尾端復原安全的
  已失效工作階段。驗證設定檔或憑證 epoch 變更
  仍然永遠不會進行原始重新播種。

### `agents.defaults.promptOverlays`

由模型系列套用於 OpenClaw 組裝提示表面的提供者無關提示覆蓋層。GPT-5 系列模型 id 會在 OpenClaw/provider 路由間接收共用行為合約；`personality` 只控制友善互動風格層。原生 Codex app-server 路由會保留 Codex 擁有的基礎/模型指令，而非這個 OpenClaw GPT-5 覆蓋層，且 OpenClaw 會為原生執行緒停用 Codex 的內建 personality。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（預設）和 `"on"` 會啟用友善互動風格層。
- `"off"` 只會停用友善層；已標記的 GPT-5 行為合約仍會啟用。
- 舊版 `plugins.entries.openai.config.personality` 在此共用設定未設定時仍會被讀取。

### `agents.defaults.heartbeat`

定期心跳偵測執行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: 持續時間字串（ms/s/m/h）。預設：`30m`（API 金鑰驗證）或 `1h`（OAuth 驗證）。設為 `0m` 可停用。
- `includeSystemPromptSection`: 為 false 時，會從系統提示中省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入 bootstrap 脈絡。預設：`true`。
- `suppressToolErrorWarnings`: 為 true 時，會在心跳偵測執行期間抑制工具錯誤警告酬載。
- `timeoutSeconds`: 心跳偵測代理程式回合被中止前允許的最長秒數。未設定時，若已設定則使用 `agents.defaults.timeoutSeconds`，否則使用心跳偵測節奏並上限為 600 秒。
- `directPolicy`: 直接/DM 傳遞政策。`allow`（預設）允許直接目標傳遞。`block` 會抑制直接目標傳遞並發出 `reason=dm-blocked`。
- `lightContext`: 為 true 時，心跳偵測執行會使用輕量 bootstrap 脈絡，且只保留工作區 bootstrap 檔案中的 `HEARTBEAT.md`。
- `isolatedSession`: 為 true 時，每次心跳偵測都會在沒有先前對話歷史的新工作階段中執行。與排程 `sessionTarget: "isolated"` 相同的隔離模式。將每次心跳偵測的 token 成本從約 100K 降至約 2-5K token。
- `skipWhenBusy`: 為 true 時，心跳偵測執行會在該代理程式的額外忙碌通道上延後：其自己的工作階段鍵控 subagent 或巢狀命令工作。排程通道一律會延後心跳偵測，即使沒有此旗標也是如此。
- 每個代理程式：設定 `agents.list[].heartbeat`。當任何代理程式定義 `heartbeat` 時，**只有那些代理程式**會執行心跳偵測。
- 心跳偵測會執行完整代理程式回合 — 較短的間隔會消耗更多 token。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（長歷史記錄的分塊摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`：已註冊壓縮提供者外掛的 ID。設定後，會呼叫提供者的 `summarize()`，而不是內建 LLM 摘要。失敗時會退回內建機制。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止單次壓縮操作前允許的最長秒數。預設值：`180`。
- `reserveTokens`：壓縮後保留給模型輸出和未來工具結果的 token 餘量。當模型脈絡視窗已知時，OpenClaw 會限制有效保留量，使其無法耗盡提示預算。
- `reserveTokensFloor`：內嵌執行階段強制執行的最低保留量。設定為 `0` 可停用下限。此下限仍受作用中的脈絡視窗上限約束。
- `keepRecentTokens`：代理保留最近逐字記錄尾端的切點預算。手動 `/compact` 在明確設定時會遵守此值；否則手動壓縮會是硬性檢查點。
- `recentTurnsPreserve`：在 safeguard 摘要外逐字保留的最新使用者/助理回合數。預設值：`3`。
- `maxHistoryShare`：壓縮後保留歷史記錄可使用的總脈絡預算最大比例（範圍 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`：當 `identifierPolicy=custom` 時使用的選用自訂識別碼保留文字。
- `qualityGuard`：針對 safeguard 摘要的格式錯誤輸出重試檢查。在 safeguard 模式中預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次模型呼叫前檢查脈絡壓力。如果脈絡已無法容納，它會在提交提示前中止目前嘗試，並重用既有的預檢復原路徑來截斷工具結果或壓縮後重試。適用於 `default` 和 `safeguard` 兩種壓縮模式。預設：停用。
- `postIndexSync`：壓縮後的工作階段記憶重新索引模式。預設值：`"async"`。若要最強的新鮮度，請使用 `"await"`；若要較低的壓縮延遲，請使用 `"async"`；只有在工作階段記憶同步由其他地方處理時，才使用 `"off"`。
- `postCompactionSections`：壓縮後要重新注入的選用 AGENTS.md H2/H3 區段名稱。未設定或設定為 `[]` 時會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用該組合，並保留舊版 `Every Session`/`Safety` 備援。只有在額外脈絡值得承擔重複已在壓縮摘要中捕捉的專案指引風險時，才啟用此選項。
- `model`：僅用於壓縮摘要的選用 `provider/model-id` 或來自 `agents.defaults.models` 的裸別名。裸別名會在分派前解析；設定的字面模型 ID 在衝突時保留優先權。當主要工作階段應保留一個模型，但壓縮摘要應在另一個模型上執行時使用此設定；未設定時，壓縮會使用工作階段的主要模型。
- `truncateAfterCompaction`：在壓縮後輪替作用中工作階段 JSONL，使未來回合只載入摘要和未摘要尾端，同時先前的完整逐字記錄仍會封存。防止長時間執行工作階段中的作用中逐字記錄無限制成長。預設值：`false`。
- `maxActiveTranscriptBytes`：選用位元組閾值（`number` 或像 `"20mb"` 這樣的字串），當作用中 JSONL 增長超過閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，使成功壓縮可輪替到較小的後續逐字記錄。未設定或為 `0` 時停用。
- `notifyUser`：當為 `true` 時，會向使用者傳送簡短的脈絡維護通知：壓縮開始與完成時（例如「正在壓縮脈絡...」和「壓縮完成」），以及壓縮前記憶清除已耗盡、因此回覆以降級狀態繼續時（例如「記憶維護暫時失敗；正在繼續你的回覆。」）。預設停用，以保持這些通知靜默。
- `memoryFlush`：自動壓縮前的靜默代理式回合，用於儲存持久記憶。當此維護回合應保留在本機模型上時，將 `model` 設為確切的提供者/模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承作用中工作階段的備援鏈。`forceFlushTranscriptBytes` 會在逐字記錄檔案大小達到閾值時強制清除，即使 token 計數器已過時。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

內嵌代理執行階段的外層執行迴圈重試迭代邊界，用於防止失敗復原期間的無限執行迴圈。此設定僅適用於內嵌代理執行階段，不適用於 ACP 或命令列介面執行階段。

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`：外層執行迴圈的基本執行重試迭代次數。預設值：`24`。
- `perProfile`：每個備援設定檔候選項額外授予的執行重試迭代次數。預設值：`8`。
- `min`：執行重試迭代的最低絕對限制。預設值：`32`。
- `max`：執行重試迭代的最高絕對限制，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送給 LLM 前，從記憶體內脈絡中修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史記錄。預設停用；設定 `mode: "cache-ttl"` 可啟用。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (default) | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes; default: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行為">

- `mode: "cache-ttl"` 會啟用修剪流程。
- `ttl` 控制修剪多久可以再次執行（在上次快取觸碰之後）。預設值：`5m`。
- 修剪會先軟修剪過大的工具結果，然後在需要時硬清除較舊的工具結果。
- `softTrimRatio` 和 `hardClearRatio` 接受 `0.0` 到 `1.0` 的值；設定驗證會拒絕該範圍外的值。

**軟修剪**會保留開頭與結尾，並在中間插入 `...`。

**硬清除**會以預留位置取代整個工具結果。

注意事項：

- 圖片區塊永遠不會被修剪/清除。
- 比率以字元為基準（近似值），不是精確的 token 數。
- 如果助理訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)以了解行為詳細資訊。

### 區塊串流

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- 非 Telegram 頻道需要明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及每個帳號的變體）。Discord、Google Chat、Mattermost、MS Teams、Signal 和 Slack 預設為 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：偏好的分塊邊界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：區塊回覆之間的隨機暫停。預設值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未設定的邊界會退回自然範圍）。每個代理覆寫：`agents.list[].humanDelay`。

請參閱[串流](/zh-TW/concepts/streaming)以了解行為與分塊詳細資訊。

### 輸入指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 預設值：直接聊天/提及為 `instant`，未提及的群組聊天為 `message`。
- `typingIntervalSeconds` 預設值：`6`。
- 每個工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

內嵌代理的選用沙盒。完整指南請參閱[沙盒](/zh-TW/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          gpus: "all",
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

上方顯示的預設值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 映像/`none` 網路等）是實際的 OpenClaw 預設值，不只是示例值。

<Accordion title="Sandbox details">

**後端：**

- `docker`：本機 Docker 執行環境（預設）
- `ssh`：通用 SSH 支援的遠端執行環境
- `openshell`：OpenShell 執行環境

選取 `backend: "openshell"` 時，執行環境特定設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：採用 `user@host[:port]` 格式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於每個作用域工作區的絕對遠端根目錄（預設：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在執行階段具現化為暫存檔的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰政策旋鈕（兩者預設皆為 `true`）

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙盒工作階段啟動前，從作用中的密鑰執行環境快照解析

**SSH 後端行為：**

- 建立或重新建立後，會對遠端工作區播種一次
- 之後會將遠端 SSH 工作區維持為標準來源
- 透過 SSH 路由 `exec`、檔案工具和媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙盒瀏覽器容器

**工作區存取：**

- `none`：`~/.openclaw/sandboxes` 下的每個作用域沙盒工作區（預設）
- `ro`：沙盒工作區位於 `/workspace`，代理工作區以唯讀方式掛載於 `/agent`
- `rw`：代理工作區以讀寫方式掛載於 `/workspace`

**作用域：**

- `session`：每個工作階段一個容器與工作區
- `agent`：每個代理一個容器與工作區（預設）
- `shared`：共用容器與工作區（無跨工作階段隔離）

**OpenShell 外掛設定：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：執行前從本機播種遠端，執行後同步回來；本機工作區保持為標準來源
- `remote`：建立沙盒時播種遠端一次，之後將遠端工作區維持為標準來源

在 `remote` 模式中，在 OpenClaw 外部進行的主機本機編輯不會在播種步驟後自動同步進沙盒。
傳輸方式是透過 SSH 進入 OpenShell 沙盒，但外掛負責沙盒生命週期與選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出、可寫入的根目錄、root 使用者。

**容器預設為 `network: "none"`** — 如果代理需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。`"container:<id>"` 預設會被封鎖，除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急破窗）。
作用中 OpenClaw 沙盒內的 Codex app-server 回合，會使用相同的輸出設定來提供其原生程式碼模式網路存取。

**傳入附件** 會暫存到作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與每個代理的綁定會合併。

**沙盒化瀏覽器**（`sandbox.browser.enabled`，預設 `false`）：容器內的 Chromium + CDP。noVNC URL 會注入系統提示。不需要 `openclaw.json` 中的 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，且 OpenClaw 會發出短效權杖 URL（而不是在共用 URL 中公開密碼）。

- `allowHostControl: false`（預設）會阻止沙盒化工作階段將主機瀏覽器作為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確需要全域橋接連線時，才設為 `bridge`。此處同樣會封鎖 `"host"`。
- `cdpSourceRange` 可選擇性將容器邊界的 CDP 入口限制在 CIDR 範圍內（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將額外主機目錄掛載進沙盒瀏覽器容器。設定時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 沙盒瀏覽器容器的 Chromium 一律以 `--no-sandbox --disable-setuid-sandbox` 啟動（容器不具備 Chrome 自身沙盒所需的核心原語）；這沒有設定切換。
- 啟動預設值定義於 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機調校：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`、`--disable-gpu` 和 `--disable-software-rasterizer`
    預設啟用；如果 WebGL/3D 使用情境需要，可使用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - `--disable-extensions`（預設啟用）；如果你的工作流程依賴擴充功能，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 會重新啟用擴充功能。
  - 預設為 `--renderer-process-limit=2`；可使用
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更，設為 `0` 可使用 Chromium 的
    預設程序限制。
  - 只有在啟用 `headless` 時才會使用 `--headless=new`。
  - 預設值是容器映像基線；若要變更容器預設值，請使用帶有自訂
    entrypoint 的自訂瀏覽器映像。

</Accordion>

瀏覽器沙盒化與 `sandbox.docker.binds` 僅適用於 Docker。

建置映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若是在沒有原始碼 checkout 的情況下進行 npm 安裝，請參閱 [沙盒化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，了解內嵌 `docker build` 命令。

### `agents.list`（每個代理覆寫）

使用 `agents.list[].tts` 為代理指定自己的 TTS 供應商、語音、模型、
風格或自動 TTS 模式。代理區塊會深度合併到全域
`messages.tts` 之上，因此共用憑證可保留在同一處，而個別
代理只覆寫其需要的語音或供應商欄位。作用中代理的
覆寫會套用至自動語音回覆、`/tts audio`、`/tts status`，以及
`tts` 代理工具。請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)
以取得供應商範例和優先順序。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent", // persistent | oneshot
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：穩定的代理 id（必填）。
- `default`：設定多個時，第一個生效（會記錄警告）。若未設定，清單中的第一個項目為預設值。
- `model`：字串形式會設定嚴格的每代理主要模型，且沒有模型後援；物件形式 `{ primary }` 也同樣嚴格，除非你加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 讓該代理選擇啟用後援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的排程工作仍會繼承預設後援，除非你設定 `fallbacks: []`。
- `utilityModel`：可選的每代理覆寫，用於產生工作階段與執行緒標題等短內部工作。會後援至 `agents.defaults.utilityModel`，再後援至此代理的主要模型。
- `params`：每代理串流參數，會覆蓋合併到 `agents.defaults.models` 中選取的模型項目。用於代理專屬覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，不必複製整個模型目錄。
- `tts`：可選的每代理文字轉語音覆寫。此區塊會深度合併到 `messages.tts`，因此請將共用的供應商憑證與後援政策保留在 `messages.tts`，並只在此處設定角色專屬值，例如供應商、聲音、模型、風格或自動模式。
- `skills`：可選的每代理技能允許清單。若省略，代理會在已設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而不是合併，且 `[]` 表示沒有 Skills。
- `thinkingDefault`：可選的每代理預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每訊息或工作階段覆寫時，會為此代理覆寫 `agents.defaults.thinkingDefault`。選取的供應商/模型設定檔會控制哪些值有效；對 Google Gemini，`adaptive` 會保留供應商擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可選的每代理預設推理可見性（`on | off | stream`）。當未設定每訊息或工作階段推理覆寫時，會為此代理覆寫 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可選的每代理快速模式預設值（`"auto" | true | false`）。在未設定每訊息或工作階段快速模式覆寫時套用。
- `models`：可選的每代理模型目錄/執行階段覆寫，以完整 `provider/model` id 作為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理執行階段例外。
- `runtime`：可選的每代理執行階段描述符。當代理應預設使用 ACP 控制框架工作階段時，請使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL，或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案限制為 2 MB。`http(s)` URL 和 `data:` URI 不會套用本機檔案大小限制檢查。
- `identity` 會衍生預設值：從 `emoji` 衍生 `ackReaction`，從 `name`/`emoji` 衍生 `mentionPatterns`。
- `subagents.allowAgents`：為明確的 `sessions_spawn.agentId` 目標設定已配置代理 id 的允許清單（`["*"]` = 任何已配置目標；預設：僅同一代理）。當應允許自我目標的 `agentId` 呼叫時，請包含請求者 id。若代理設定已刪除，過時項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；執行 `openclaw doctor --fix` 清理，或在該目標應於繼承預設值時仍可被產生的情況下，加入最小的 `agents.list[]` 項目。
- 沙箱繼承防護：若請求者工作階段已沙箱化，`sessions_spawn` 會拒絕將以非沙箱方式執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設：false）。
- `subagents.maxConcurrent`：跨子代理執行的最大並行子代理執行數。預設值：`8`。
- `subagents.maxChildrenPerAgent`：單一代理工作階段可產生的最大作用中子項數。預設值：`5`。
- `subagents.maxSpawnDepth`：子代理產生的最大巢狀深度（`1`-`5`）。預設值：`1`（不巢狀）。
- `subagents.archiveAfterMinutes`：已完成子代理狀態封存前的存在時間。預設值：`60`。

---

## 多代理路由

在同一個閘道內執行多個隔離代理。請參閱[多代理](/zh-TW/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 繫結比對欄位

- `type`（可選）：`route` 用於一般路由（缺少 type 時預設為 route），`acp` 用於持續性 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（可選；`*` = 任何帳號；省略 = 預設帳號）
- `match.peer`（可選；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可選；通道專屬）
- `acp`（可選；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，無 peer/guild/team）
5. `match.accountId: "*"`（整個通道）
6. 預設代理

在每一層中，第一個相符的 `bindings` 項目生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確對話身分（`match.channel` + 帳號 + `match.peer.id`）解析，且不使用上述路由繫結層級順序。

### 每代理存取設定檔

<Accordion title="完整存取權（無沙箱）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="唯讀工具 + 工作區">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="無檔案系統存取權（僅訊息傳遞）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)了解優先順序細節。

---

## 工作階段

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (default) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="工作階段欄位詳細資料">

- **`scope`**：群組聊天情境的基礎工作階段分組策略。
  - `per-sender`（預設）：每位傳送者在頻道情境中取得隔離的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在有意使用共享情境時使用）。
- **`dmScope`**：DM 的分組方式。
  - `main`：所有 DM 共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 ID 隔離。
  - `per-channel-peer`：依頻道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應到帶有提供者前綴的對等端，以便跨頻道共享工作階段。Dock 命令（例如 `/dock_discord`）會使用同一個對應，將作用中工作階段的回覆路由切換到另一個已連結的頻道對等端；請參閱[頻道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設政策。`daily` 會在 `atHour` 的本地時間重設；`idle` 會在 `idleMinutes` 後重設。兩者都設定時，以先到期者為準。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。背景/系統事件寫入（例如心跳偵測、排程喚醒、執行通知和閘道記帳）可以更新 `updatedAt`，但不會讓每日/閒置工作階段保持新鮮。
- **`resetByType`**：按類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 會作為 `direct` 的別名接受。
- **`resetByChannel`**：按頻道重設覆寫，以提供者/頻道 ID 作為鍵。當工作階段的頻道有相符項目時，它會直接優先於該工作階段的 `resetByType`/`reset`。僅在某個頻道需要不同於類型層級政策的重設行為時使用。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天儲存桶。
- **`agentToAgent.maxPingPongTurns`**：代理程式對代理程式交換期間，代理程式之間的最大來回回覆輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用乒乓鏈結。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，含舊版 `dm` 別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：工作階段儲存清理 + 保留控制。
  - `mode`：`enforce` 會套用清理且為預設值；`warn` 只發出警告。
  - `pruneAfter`：過時項目的年齡截斷值（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大項目數（預設 `500`）。執行階段會以一個小的高水位緩衝區批次寫入清理，以支援正式環境規模的上限；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短生命週期的閘道模型執行探測工作階段使用固定 `24h` 保留期，但清理受壓力閘控：只有在達到工作階段項目維護/上限壓力時，才會移除過時的嚴格模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵符合資格；一般 direct、group、thread、cron、hook、heartbeat、ACP 和子代理程式工作階段不會繼承這個 24h 保留期。模型執行清理執行時，會在較廣泛的 `pruneAfter` 過時項目清理與 `maxEntries` 上限之前執行。
  - `rotateBytes`：已棄用且會被忽略；`openclaw doctor --fix` 會將它從較舊的設定中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿封存的保留期。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式中會記錄警告；在 `enforce` 模式中會先移除最舊的成品/工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：工作階段逐字稿寫入鎖定控制。只有在合法的逐字稿準備、清理、壓縮或鏡像工作競爭時間長於預設政策時才調整。
  - `acquireTimeoutMs`：取得鎖定時等待的毫秒數，超過後回報工作階段忙碌。預設值：`60000`；環境覆寫 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：現有鎖定被視為過時並回收前的毫秒數。預設值：`1800000`；環境覆寫 `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：已持有的程序內鎖定可保持持有，直到監看程式釋放它的毫秒數。預設值：`300000`；環境覆寫 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：執行緒綁定工作階段功能的全域預設值。
  - `enabled`：主要預設開關（提供者可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設非作用中自動取消聚焦時間，以小時為單位（`0` 會停用；提供者可覆寫）
  - `maxAgeHours`：預設硬性最長存在時間，以小時為單位（`0` 會停用；提供者可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 執行緒生成建立執行緒綁定工作階段的預設閘門。啟用執行緒綁定時預設為 `true`；提供者/帳號可覆寫。
  - `defaultSpawnContext`：執行緒綁定生成的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

</Accordion>

---

## 訊息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer（預設）| followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize（預設）
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 會停用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 回覆前綴

按頻道/帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最具體者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止串接。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明                   | 範例                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 短模型名稱             | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼         | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供者名稱             | `anthropic`                 |
| `{thinkingLevel}` | 目前思考層級           | `high`, `low`, `off`        |
| `{identity.name}` | 代理程式身分名稱       |（與 `"auto"` 相同）         |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認反應

- 預設為作用中代理程式的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 按頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分後援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all` 或 `off`/`none`（完全停用確認反應）。
- `removeAckAfterReply`：在支援反應的頻道（例如 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage）上於回覆後移除確認。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上啟用生命週期狀態反應。
  在 Discord 上，未設定時會在確認反應作用中時保持狀態反應啟用。
  在 Slack、Signal、Telegram 和 WhatsApp 上，明確設為 `true` 才會啟用生命週期狀態反應。
  Slack 預設使用其原生助理執行緒狀態和輪替載入訊息來表示進度，同時讓已設定的確認反應保持靜態。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 只允許固定的反應集合，因此不支援的已設定表情符號會退回
  到該聊天最接近的受支援狀態變體。

### 佇列

- `mode`：工作階段執行作用中時，傳入訊息抵達的佇列策略。預設：`"steer"`。
  - `steer`：將新的提示注入作用中執行。
  - `followup`：在作用中執行完成後執行新的提示。
  - `collect`：批次處理相容訊息，稍後一起執行。
  - `interrupt`：在開始最新提示前中止作用中執行。
- `debounceMs`：派送已佇列/已導向訊息前的延遲。預設：`500`。
- `cap`：套用丟棄政策前的最大已佇列訊息數。預設：`20`。
- `drop`：超過上限時的策略。`"summarize"`（預設）會丟棄最舊項目但保留壓縮摘要；`"old"` 會丟棄最舊項目且不保留摘要；`"new"` 會拒絕最新項目。
- `byChannel`：按頻道的 `mode` 覆寫，以提供者 ID 作為鍵。
- `debounceMsByChannel`：按頻道的 `debounceMs` 覆寫，以提供者 ID 作為鍵。

### 傳入防抖

將來自同一傳送者的快速純文字訊息批次成單一代理程式回合。媒體/附件會立即排出。控制命令會繞過防抖。預設 `debounceMs`：`2000`。

### 其他訊息鍵

- `messages.messagePrefix`：在傳入使用者訊息到達代理程式執行階段之前加上的前綴文字。請謹慎用於頻道情境標記。
- `messages.visibleReplies`：控制 direct、group 和 channel 對話中的可見來源回覆（`"message_tool"` 需要 `message(action=send)` 才能產生可見輸出；`"automatic"` 會如同先前一樣張貼一般回覆）。
- `messages.usageTemplate` / `messages.responseUsage`：自訂 `/usage` 頁尾範本和預設逐回覆使用量模式（`off | tokens | full`，加上舊版 `on` 作為 `tokens` 的別名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群組訊息提及觸發條件和歷史視窗大小。
- `messages.suppressToolErrors`：當為 `true` 時，抑制顯示給使用者的 `⚠️` 工具錯誤警告（代理程式仍會在情境中看到錯誤並可重試）。預設：`false`。

### TTS（文字轉語音）

```json5
{
  messages: {
    tts: {
      auto: "off", // off（預設）| always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` 控制預設 auto-TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆寫本機偏好設定，而 `/tts status` 會顯示有效狀態。
- `summaryModel` 會覆寫 `agents.defaults.model.primary` 以用於自動摘要。
- `modelOverrides` 預設啟用（`enabled !== false`）；`modelOverrides.allowProvider` 需選擇啟用。
- API 金鑰會退回使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建語音提供者由外掛擁有。如果設定了 `plugins.allow`，請包含你要使用的每個 TTS 提供者外掛，例如 Edge TTS 的 `microsoft`。舊版 `edge` 提供者 ID 會作為 `microsoft` 的別名接受。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，然後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為 OpenAI 相容的 TTS 伺服器，並放寬模型/語音驗證。

---

## Talk

Talk 模式的預設值（macOS/iOS/Android 和瀏覽器 Control UI）。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- 當設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix` 將持久化設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會退回使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS Talk 用戶端行為）。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 退回僅在未設定 Talk API 金鑰時套用。
- `providers.*.voiceAliases` 讓 Talk 指令可以使用友善名稱。
- `providers.mlx.modelId` 選取 macOS 本機 MLX 輔助程式使用的 Hugging Face repo。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在存在時透過內建 `openclaw-mlx-tts` 輔助程式執行，或透過 `PATH` 上的可執行檔執行；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI Talk 即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw agent 執行的思考層級。保留未設定可維持一般工作階段/模型行為。
- `consultFastMode` 會為 Control UI Talk 即時諮詢設定一次性的快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS Talk 語音辨識使用的 BCP 47 語言環境 ID。保留未設定可使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者靜默後等待多久才傳送逐字稿。未設定時會保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）。
- `realtime.instructions` 會將面向提供者的系統指令附加到 OpenClaw 內建即時提示詞，因此可設定語音風格而不失去預設 `openclaw_agent_consult` 指引。
- `realtime.vadThreshold` 設定提供者語音活動閾值，範圍從 `0`（最敏感）到 `1`（最不敏感）。未設定時會保留提供者預設值。
- `realtime.silenceDurationMs` 設定提供者提交即時使用者回合前的正整數靜默視窗。未設定時會保留提供者預設值。
- `realtime.prefixPaddingMs` 設定偵測到語音開始前保留的非負整數音訊量。未設定時會保留提供者預設值。
- `realtime.reasoningEffort` 設定即時工作階段的提供者特定推理層級。未設定時會保留提供者預設值。
- `realtime.consultRouting`：`"provider-direct"`（預設）會在即時提供者產生不含 `openclaw_agent_consult` 的最終使用者逐字稿時，保留直接提供者回覆。`"force-agent-consult"` 會改由 OpenClaw 路由已定稿的請求。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見任務與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

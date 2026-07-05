---
read_when:
    - 調整代理預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與交談設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-05T11:17:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75ba6a72eec05731054dd1f7d04cee6f50124375e022d1a51f75e87a453ea3f2
    source_path: gateway/config-agents.md
    workflow: 16
---

代理範圍的設定鍵位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 之下。關於頻道、工具、閘道執行階段，以及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理預設值

### `agents.defaults.workspace`

預設值：設定 `OPENCLAW_WORKSPACE_DIR` 時使用該值，否則為 `~/.openclaw/workspace`（或在 `OPENCLAW_PROFILE` 設為非預設設定檔時為 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。當你不想把該路徑寫入設定，而要將預設代理
指向已掛載的工作區時，請使用環境變數。

### `agents.defaults.repoRoot`

選用的儲存庫根目錄，顯示於系統提示的 Runtime 行。若未設定，OpenClaw 會從工作區向上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

選用的預設技能允許清單，供未設定
`agents.list[].skills` 的代理使用。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 取代預設值
      { id: "locked-down", skills: [] }, // 無技能
    ],
  },
}
```

- 省略 `agents.defaults.skills` 時，預設不限制技能。
- 省略 `agents.list[].skills` 時會繼承預設值。
- 設定 `agents.list[].skills: []` 表示無技能。
- 非空的 `agents.list[].skills` 清單就是該代理的最終集合；它
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立指定的選用工作區檔案，但仍會寫入必要的啟動檔案（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

控制何時將工作區啟動檔案注入系統提示。預設值：`"always"`。

- `"continuation-skip"`：安全的接續回合（在已完成的助理回應之後）會略過重新注入工作區啟動內容，以降低提示大小。心跳偵測執行和壓縮後重試仍會重建上下文。
- `"never"`：在每個回合停用工作區啟動與上下文檔案注入。僅適用於完全自行管理提示生命週期的代理（自訂上下文引擎、會自行建構上下文的原生執行階段，或不需要啟動檔案的特殊工作流程）。心跳偵測與壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

個別代理覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的最大字元數。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

個別代理覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案合計可注入的最大字元數。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

個別代理覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值
會繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 個別代理啟動設定檔覆寫

當某個代理需要與共用預設值不同的提示注入行為時，請使用個別代理啟動設定檔覆寫。
省略的欄位會繼承自
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

控制啟動上下文被截斷時，代理可見的系統提示通知。
預設值：`"always"`。

- `"off"`：永不將截斷通知文字注入系統提示。
- `"once"`：每個唯一截斷簽章只注入一次精簡通知。
- `"always"`：只要存在截斷，每次執行都注入精簡通知（建議）。

詳細的原始/已注入計數與設定調校欄位會保留在診斷資料中，
例如上下文/狀態報告和記錄；例行 WebChat 使用者/執行階段上下文只會
取得精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文預算歸屬對照表

OpenClaw 有多個高容量提示/上下文預算，且它們
刻意依子系統拆分，而不是全部流經單一通用
旋鈕。

| 預算                                                           | 涵蓋範圍                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 一般工作區啟動注入                                                                                                                                                |
| `agents.defaults.startupContext.*`                             | 一次性重設/啟動模型執行前奏，包括最近每日的 `memory/*.md` 檔案。純聊天 `/new` 和 `/reset` 會在不呼叫模型的情況下確認重設 |
| `skills.limits.*`                                              | 注入系統提示的精簡技能清單                                                                                                                                        |
| `agents.defaults.contextLimits.*`                              | 有界的執行階段摘錄與注入的執行階段擁有區塊                                                                                                                        |
| `memory.qmd.limits.*`                                          | 已索引記憶搜尋片段與注入大小                                                                                                                                      |

對應的個別代理覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設/啟動模型執行時注入的第一回合啟動前奏。
純聊天 `/new` 和 `/reset` 命令會在不呼叫
模型的情況下確認重設，因此不會載入此段前奏。

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

有界執行階段上下文表面的共用預設值。

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

- `memoryGetMaxChars`：在加入截斷中繼資料
  與接續通知之前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時預設的 `memory_get` 行視窗。
- `toolResultMaxChars`：進階的即時工具結果上限，用於持久化
  結果與溢出復原。未設定時使用模型上下文自動上限：
  100K tokens 以下為 `16000` 字元，100K+ tokens 為 `32000` 字元，200K+ tokens
  為 `64000` 字元。對於長上下文模型，可接受最高 `1000000` 的明確值，
  但有效上限仍限制在模型上下文視窗約 30% 以內。
  `openclaw doctor --deep` 會列印有效上限，
  且 doctor 只會在明確覆寫已過時或沒有作用時發出警告。
- `postCompactionMaxChars`：壓縮後
  重新整理注入時使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 旋鈕的個別代理覆寫。省略的欄位會繼承
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
          toolResultMaxChars: 8000, // 此代理的進階上限
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系統提示的精簡技能清單全域上限。這
不會影響依需求讀取 `SKILL.md` 檔案。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

技能提示預算的個別代理覆寫。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在呼叫提供者之前，逐字稿/工具圖片區塊中圖片最長邊的最大像素尺寸。
預設值：`1200`。

較低的值通常可降低大量截圖執行時的視覺 tokens 使用量與請求承載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

從檔案路徑、URL 和媒體參照載入圖片時的圖片工具壓縮/細節偏好。
預設值：`auto`。

OpenClaw 會依選取的圖片模型調整縮放階梯。例如，Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL，以及託管的 Llama 4 視覺模型，可以使用比舊版/預設高細節視覺路徑更大的圖片；而多圖片回合在 `auto` 模式下會更積極壓縮，以控制 token 與延遲成本。

值：

- `auto`：依模型限制與圖片數量調整。
- `efficient`：偏好較小圖片，以降低 token 與位元組使用量。
- `balanced`：使用標準的中間取捨階梯。
- `high`：為截圖、圖表與文件圖片保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示上下文使用的時區（不是訊息時間戳）。會退回使用主機時區。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系統提示中的時間格式。預設值：`auto`（作業系統偏好）。

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
      params: { cacheRetention: "long" }, // 全域預設供應商參數
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
  - 字串形式只會設定主要模型。
  - 物件形式會設定主要模型加上依序排列的容錯移轉模型。
- `utilityModel`：選用的 `provider/model` 參照或別名，用於簡短的內部工作。目前用於產生 Control UI 工作階段標題、Telegram 私訊主題標題，以及 Discord 自動討論串標題。未設定時，這些工作會退回使用代理程式的主要模型；`agents.list[].utilityModel` 會覆寫預設值，而作業專用的模型覆寫會優先於兩者。公用程式工作會發出獨立的模型呼叫，並將工作專用內容傳送給選取的模型提供者。Dashboard 標題產生最多會傳送第一則非命令訊息的前 1,000 個字元。請選擇符合你成本與資料處理需求的提供者。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑作為其視覺模型設定使用。
  - 也會在選取的／預設模型無法接受圖片輸入時，用作後援路由。
  - 建議使用明確的 `provider/model` 參照。為了相容性，也接受裸 ID；如果裸 ID 在 `models.providers.*.models` 中唯一符合已設定且支援圖片的項目，OpenClaw 會將其限定到該提供者。若已設定的符合項目不明確，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的圖片生成功能，以及任何未來會產生圖片的工具／外掛介面使用。
  - 典型值：原生 Gemini 圖片產生使用 `google/gemini-3.1-flash-image-preview`，fal 使用 `fal/fal-ai/flux/dev`，OpenAI Images 使用 `openai/gpt-image-2`，或透明背景 OpenAI PNG/WebP 輸出使用 `openai/gpt-image-1.5`。
  - 如果你直接選取提供者／模型，也要設定相符的提供者驗證資訊（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的圖片生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的音樂生成功能，以及內建的 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。
  - 如果你直接選取提供者／模型，也要設定相符的提供者驗證資訊／API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的影片生成功能，以及內建的 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。
  - 如果你直接選取提供者／模型，也要設定相符的提供者驗證資訊／API 金鑰。
  - 官方 Qwen 影片生成外掛最多支援 1 個輸出影片、1 張輸入圖片、4 個輸入影片、10 秒時長，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會退回使用 `imageModel`，接著退回使用已解析的工作階段／預設模型。
- `pdfMaxBytesMb`：在呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中擷取後援模式會考量的預設最大頁數。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要與進度草稿工具行的詳細模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令／詳細資訊）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。只有在未設定每則訊息或工作階段推理覆寫時，已設定的推理預設值才會套用於擁有者、已授權寄件者，或操作員管理員閘道情境。
- `elevatedDefault`：代理程式的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設值：`"on"`。
- `model.primary`：格式為 `provider/model`（例如透過 OpenAI API 金鑰或 Codex OAuth 存取時，OpenAI 使用 `openai/gpt-5.5`）。如果省略提供者，OpenClaw 會先嘗試別名，接著嘗試該精確模型 ID 的唯一已設定提供者符合項目，最後才退回使用已設定的預設提供者（已棄用的相容性行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回使用第一個已設定的提供者／模型，而不是呈現過時且已移除提供者的預設值。
- `models`：為 `/model` 設定的模型目錄與允許清單。每個項目可以包含 `alias`（捷徑）和 `params`（提供者專用，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目，例如 `"openai/*": {}` 或 `"vllm/*": {}`，即可顯示所選提供者的所有已探索模型，而不需要手動列出每個模型 ID。
  - 當該提供者每個動態探索到的模型都應使用相同執行階段時，請將 `agentRuntime` 加到 `provider/*` 項目。精確的 `provider/model` 執行階段政策仍會優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕會移除現有允許清單項目的替換。
  - 提供者範圍的設定／入門流程會將選取的提供者模型合併到此對應表，並保留已設定的無關提供者。
  - 對於直接的 OpenAI Responses 模型，伺服器端壓縮會自動啟用。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫臨界值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#advanced-configuration)。
- `params`：套用到所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基礎）會被 `agents.defaults.models["provider/model"].params`（每個模型）覆寫，接著 `agents.list[].params`（符合的代理程式 ID）會依鍵覆寫。詳情請參閱 [提示快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 全域預設提供者路由政策。OpenClaw 會將此轉送到 OpenRouter 請求的 `provider` 物件；每個模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和代理程式參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：進階透傳 JSON，會合併到 OpenAI 相容代理的 `api: "openai-completions"` 請求主體中。如果它與產生的請求鍵衝突，額外主體會優先；非原生 completions 路由之後仍會移除僅限 OpenAI 的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 相容的聊天範本引數，會合併到頂層 `api: "openai-completions"` 請求主體中。對於關閉 thinking 的 `vllm/nemotron-3-*`，內建的 vLLM 外掛會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 和 Nemotron thinking 模型會公開二元 `/think` 選項（`off`、`on`），而不是多層級的投入程度階梯。
- `compat.thinkingFormat`：OpenAI 相容的 thinking 酬載樣式。Together 樣式的 `reasoning.enabled` 使用 `"together"`，Qwen 樣式的頂層 `enable_thinking` 使用 `"qwen"`，或在支援請求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM）上，針對 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 會將停用的 thinking 對應為 `false`，將啟用的 thinking 對應為 `true`，而已設定的 vLLM Qwen 模型會針對這些格式公開二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：每個模型的 OpenAI 相容推理投入程度清單。對於真正接受它的自訂端點，請包含 `"xhigh"`；OpenClaw 隨後會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定提供者／模型的 `llm-task` 驗證中公開 `/think xhigh`。當後端需要標準層級的提供者專用值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留 thinking 選用設定。啟用且 thinking 開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重播先前的 `reasoning_content`；請參閱 [Z.AI thinking 與保留 thinking](/zh-TW/providers/zai#advanced-configuration)。
- `localService`：選用的提供者層級程序管理器，用於本機／自託管模型伺服器。當選取的模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`）；如果端點離線，則以 `args` 啟動 `command`，最多等待 `readyTimeoutMs`，然後傳送模型請求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序維持執行，直到 OpenClaw 結束；正值會在閒置該毫秒數後，停止由 OpenClaw 產生的程序。請參閱 [本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策屬於提供者或模型，而不是 `agents.defaults`。提供者全域規則請使用 `models.providers.<provider>.agentRuntime`，模型專用規則請使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI 提供者上的 OpenAI 代理程式模型預設會選取 Codex。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image`，以及後援新增／移除命令）會儲存標準物件形式，並在可能時保留現有後援清單。
- `maxConcurrent`：跨工作階段的最大平行代理程式執行數（每個工作階段仍會序列化）。預設值：`4`。

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

- `id`：`"auto"`、`"openclaw"`、已註冊的外掛 harness id，或受支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 讓已註冊的外掛 harness 接管支援的回合，並在沒有 harness 符合時使用 OpenClaw。明確的外掛執行階段（例如 `id: "codex"`）需要該 harness，若不可用或失敗則會封閉失敗。
- `id: "pi"` 只會作為 `openclaw` 的已棄用別名被接受，以保留 v2026.5.22 及更早版本已發布的設定。新設定應使用 `openclaw`。
- 執行階段優先順序先是精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`，或 `models.providers.<provider>.models[]`），接著是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 的提供者範圍政策。
- 整個代理程式的執行階段鍵是舊版項目。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選，以及 `OPENCLAW_AGENT_RUNTIME` 會被執行階段選擇忽略。執行 `openclaw doctor --fix` 以移除過時值。
- OpenAI 代理程式模型預設使用 Codex harness；當你想明確指定時，provider/model `agentRuntime.id: "codex"` 仍然有效。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 加上模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/<model>` 參照為了相容性仍可運作，但新設定應保持 provider/model 選擇為標準形式，並將執行後端放在 provider/model 執行階段政策中。
- 這只控制文字代理程式回合執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用其提供者/模型設定。

**內建別名簡寫**（僅在模型位於 `agents.defaults.models` 時適用）：

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
Z.AI 模型預設會啟用 `tool_stream` 以進行工具呼叫串流。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 可停用它。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設保持思考關閉；當明確啟用自適應思考時，Anthropic 提供者擁有的 effort 預設值為 `high`。Claude 4.6 模型在未設定明確思考層級時預設為 `adaptive`。

### `agents.defaults.cliBackends`

用於僅文字備援執行的選用命令列介面後端（無工具呼叫）。在 API 提供者失敗時，可作為備用方案。

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
- 當 `imageArg` 接受檔案路徑時支援影像傳遞。
- `reseedFromRawTranscriptWhenUncompacted: true` 讓後端可在第一個壓縮摘要存在前，從有界的原始 OpenClaw transcript 尾端恢復安全的
  已失效工作階段。Auth profile 或 credential-epoch 變更
  仍然絕不會進行 raw-reseed。

### `agents.defaults.promptOverlays`

由模型家族套用於 OpenClaw 組裝提示表面的提供者無關提示覆蓋。GPT-5 家族模型 id 會在 OpenClaw/提供者路由中取得共用行為合約；`personality` 只控制友善互動風格層。原生 Codex app-server 路由會保留 Codex 擁有的基礎/模型指令，而不是此 OpenClaw GPT-5 覆蓋，且 OpenClaw 會針對原生執行緒停用 Codex 的內建 personality。

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
- `"off"` 只會停用友善層；已標記的 GPT-5 行為合約仍會保持啟用。
- 舊版 `plugins.entries.openai.config.personality` 在未設定此共用設定時仍會被讀取。

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

- `every`：持續時間字串（ms/s/m/h）。預設：`30m`（API 金鑰驗證）或 `1h`（OAuth 驗證）。設為 `0m` 可停用。
- `includeSystemPromptSection`：為 false 時，會從系統提示中省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入 bootstrap context。預設：`true`。
- `suppressToolErrorWarnings`：為 true 時，會在心跳偵測執行期間抑制工具錯誤警告 payload。
- `timeoutSeconds`：心跳偵測代理程式回合在中止前允許的最長秒數。若未設定，則在已設定時使用 `agents.defaults.timeoutSeconds`，否則使用上限為 600 秒的心跳偵測節奏。
- `directPolicy`：直接/DM 傳遞政策。`allow`（預設）允許直接目標傳遞。`block` 會抑制直接目標傳遞並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，心跳偵測執行使用輕量 bootstrap context，且只保留工作區 bootstrap 檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次心跳偵測都會在沒有先前對話歷史的新工作階段中執行。與排程 `sessionTarget: "isolated"` 相同的隔離模式。將每次心跳偵測的 token 成本從約 100K 降至約 2-5K token。
- `skipWhenBusy`：為 true 時，心跳偵測執行會在該代理程式的額外忙碌通道上延後：其自身以工作階段鍵控的子代理程式或巢狀命令工作。即使沒有此旗標，排程通道一律會延後心跳偵測。
- 每個代理程式：設定 `agents.list[].heartbeat`。當任何代理程式定義 `heartbeat` 時，**只有那些代理程式**會執行心跳偵測。
- 心跳偵測會執行完整代理程式回合 — 較短間隔會消耗更多 token。

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
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
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

- `mode`: `default` 或 `safeguard`（針對長歷史的分塊摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`: 已註冊壓縮提供者外掛的 id。設定後，會呼叫提供者的 `summarize()`，而不是內建的 LLM 摘要。失敗時會退回內建摘要。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`: OpenClaw 中止單次壓縮作業前允許的最大秒數。預設值：`180`。
- `keepRecentTokens`: 代理程式保留最新逐字轉錄尾端的切點預算。手動 `/compact` 在明確設定時會遵守此值；否則手動壓縮會是硬性檢查點。
- `recentTurnsPreserve`: 在 safeguard 摘要之外逐字保留的最新使用者/助理輪次數量。預設值：`3`。
- `maxHistoryShare`: 壓縮後允許保留歷史佔總上下文預算的最大比例（範圍 `0.1`-`0.9`）。
- `identifierPolicy`: `strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間前置內建的不透明識別符保留指引。
- `identifierInstructions`: `identifierPolicy=custom` 時使用的可選自訂識別符保留文字。
- `qualityGuard`: safeguard 摘要的格式錯誤輸出重試檢查。在 safeguard 模式中預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`: 可選的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在工具結果附加後、下一次模型呼叫前檢查上下文壓力。如果上下文不再符合限制，它會在提交提示前中止目前嘗試，並重用現有的預檢復原路徑來截斷工具結果，或壓縮後重試。可搭配 `default` 與 `safeguard` 壓縮模式使用。預設：停用。
- `postIndexSync`: 壓縮後的工作階段記憶重新索引模式。預設值：`"async"`。若需要最強的新鮮度，請使用 `"await"`；若要降低壓縮延遲，請使用 `"async"`；只有在工作階段記憶同步由其他地方處理時才使用 `"off"`。
- `postCompactionSections`: 壓縮後要重新注入的可選 AGENTS.md H2/H3 區段名稱。未設定或設定為 `[]` 時會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用這組區段，並保留舊版 `Every Session`/`Safety` 後援。只有當額外上下文值得承擔重複專案指引（該指引可能已在壓縮摘要中擷取）的風險時，才啟用此選項。
- `model`: 僅供壓縮摘要使用的可選 `provider/model-id` 或來自 `agents.defaults.models` 的裸別名。裸別名會在派送前解析；發生衝突時，已設定的字面模型 ID 保留優先權。當主要工作階段應保留一個模型，但壓縮摘要應在另一個模型上執行時使用；未設定時，壓縮會使用工作階段的主要模型。
- `truncateAfterCompaction`: 壓縮後輪替作用中的工作階段 JSONL，讓未來輪次只載入摘要與未摘要的尾端，而先前完整逐字稿仍會封存。避免長時間執行的工作階段中作用中逐字稿無限制成長。預設值：`false`。
- `maxActiveTranscriptBytes`: 可選位元組閾值（`number` 或像 `"20mb"` 這樣的字串），當作用中 JSONL 超過閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，讓成功壓縮後可以輪替到較小的後續逐字稿。未設定或為 `0` 時停用。
- `notifyUser`: 為 `true` 時，會在壓縮開始與完成時向使用者傳送簡短通知（例如「正在壓縮上下文...」與「壓縮完成」）。預設停用，以維持壓縮靜默。
- `memoryFlush`: 自動壓縮前的靜默代理式輪次，用於儲存持久記憶。當這個維護輪次應保留在本機模型上時，將 `model` 設為精確的提供者/模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承作用中工作階段的後援鏈。`forceFlushTranscriptBytes` 會在逐字稿檔案大小達到閾值時強制執行 flush，即使權杖計數器已過期。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

嵌入式代理程式執行階段的外層執行迴圈重試迭代邊界，用於防止失敗復原期間發生無限執行迴圈。此設定僅適用於嵌入式代理程式執行階段，不適用於 ACP 或命令列介面執行階段。

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

- `base`: 外層執行迴圈的基本執行重試迭代次數。預設值：`24`。
- `perProfile`: 每個後援設定檔候選項額外授予的執行重試迭代次數。預設值：`8`。
- `min`: 執行重試迭代的絕對下限。預設值：`32`。
- `max`: 執行重試迭代的絕對上限，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送給 LLM 前，從記憶體中的上下文修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史。預設停用；設定 `mode: "cache-ttl"` 以啟用。

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
- `ttl` 控制修剪多久可以再次執行（從上次快取接觸後開始計算）。預設值：`5m`。
- 修剪會先軟修剪過大的工具結果，接著在需要時硬清除較舊的工具結果。
- `softTrimRatio` 和 `hardClearRatio` 接受從 `0.0` 到 `1.0` 的值；設定驗證會拒絕該範圍外的值。

**軟修剪**會保留開頭 + 結尾，並在中間插入 `...`。

**硬清除**會以佔位符取代整個工具結果。

注意事項：

- 圖像區塊永遠不會被修剪/清除。
- 比例以字元為基準（近似值），不是精確的權杖數。
- 如果助理訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

行為詳細資料請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

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
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及每帳號變體）。Discord、Google Chat、Mattermost、MS Teams、Signal 和 Slack 預設為 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`: 偏好的分塊邊界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`: 區塊回覆之間的隨機暫停。預設值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未設定的邊界都會退回自然範圍）。每代理程式覆寫：`agents.list[].humanDelay`。

行為與分塊詳細資料請參閱[串流](/zh-TW/concepts/streaming)。

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

- 預設值：直接聊天/提及使用 `instant`，未提及的群組聊天使用 `message`。
- `typingIntervalSeconds` 預設值：`6`。
- 每工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理程式的可選沙箱。完整指南請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

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

<Accordion title="沙箱詳細資料">

**後端：**

- `docker`: 本機 Docker 執行階段（預設）
- `ssh`: 通用 SSH 支援的遠端執行階段
- `openshell`: OpenShell 執行階段

選取 `backend: "openshell"` 時，執行階段特定設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：採用 `user@host[:port]` 形式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於每個範圍工作區的絕對遠端根目錄（預設：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 會在執行階段具體化為暫存檔的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰政策旋鈕（兩者預設皆為 `true`）

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙箱工作階段啟動前，從作用中的秘密執行階段快照解析

**SSH 後端行為：**

- 建立或重新建立後，只會植入一次遠端工作區
- 接著讓遠端 SSH 工作區保持標準
- 透過 SSH 路由 `exec`、檔案工具與媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取：**

- `none`：位於 `~/.openclaw/sandboxes` 底下的每範圍沙箱工作區（預設）
- `ro`：沙箱工作區位於 `/workspace`，代理工作區以唯讀方式掛載於 `/agent`
- `rw`：代理工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段一個容器 + 工作區
- `agent`：每個代理一個容器 + 工作區（預設）
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

- `mirror`：執行前從本機植入遠端，執行後同步回來；本機工作區保持標準
- `remote`：建立沙箱時只植入一次遠端，接著讓遠端工作區保持標準

在 `remote` 模式中，於 OpenClaw 外部進行的主機本機編輯，在植入步驟之後不會自動同步到沙箱中。
傳輸方式是透過 SSH 進入 OpenShell 沙箱，但外掛負責沙箱生命週期與選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路出口、可寫入的根目錄、root 使用者。

**容器預設為 `network: "none"`** — 如果代理需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。預設也會封鎖 `"container:<id>"`，除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急破例）。
作用中的 OpenClaw 沙箱內的 Codex app-server 回合，會使用相同的出口設定來進行其原生程式碼模式網路存取。

**傳入附件** 會暫存到作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與每個代理的繫結會合併。

**沙箱化瀏覽器**（`sandbox.browser.enabled`，預設 `false`）：容器中的 Chromium + CDP。noVNC URL 會注入系統提示。不需要在 `openclaw.json` 中啟用 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，OpenClaw 會發出短效權杖 URL（而不是在共用 URL 中暴露密碼）。

- `allowHostControl: false`（預設）會阻止沙箱化工作階段以主機瀏覽器為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確想要全域橋接連線時，才設為 `bridge`。此處也會封鎖 `"host"`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 入口限制為某個 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將額外的主機目錄掛載到沙箱瀏覽器容器。設定時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 沙箱瀏覽器容器的 Chromium 一律會以 `--no-sandbox --disable-setuid-sandbox` 啟動（容器沒有 Chrome 自身沙箱所需的核心原語）；這沒有設定切換選項。
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
  - `--disable-3d-apis`, `--disable-gpu`, and `--disable-software-rasterizer` are
    enabled by default and can be disabled with
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` if WebGL/3D usage requires it.
  - `--disable-extensions` (default enabled); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    re-enables extensions if your workflow depends on them.
  - `--renderer-process-limit=2` by default; change with
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, set `0` to use Chromium's
    default process limit.
  - `--headless=new` only when `headless` is enabled.
  - Defaults are the container image baseline; use a custom browser image with a custom
    entrypoint to change container defaults.

</Accordion>

瀏覽器沙箱化與 `sandbox.docker.binds` 僅適用於 Docker。

建置映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若要在沒有原始碼 checkout 的情況下安裝 npm，請參閱[沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，其中提供內嵌的 `docker build` 命令。

### `agents.list`（每個代理的覆寫）

使用 `agents.list[].tts` 為代理指定自己的 TTS 供應商、語音、模型、
風格或自動 TTS 模式。代理區塊會深度合併到全域
`messages.tts` 之上，因此共用憑證可保留在同一處，而個別
代理只覆寫所需的語音或供應商欄位。作用中代理的
覆寫會套用到自動語音回覆、`/tts audio`、`/tts status`，以及
`tts` 代理工具。請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)
以取得供應商範例與優先順序。

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

- `id`：穩定的代理程式 ID（必填）。
- `default`：設定多個時，第一個生效（會記錄警告）。若未設定，清單中的第一個項目即為預設值。
- `model`：字串形式會設定嚴格的每代理程式主要模型，且沒有模型備援；物件形式 `{ primary }` 也同樣嚴格，除非加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 可讓該代理程式選用備援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的排程工作仍會繼承預設備援，除非你設定 `fallbacks: []`。
- `utilityModel`：選用的每代理程式覆寫，用於產生的工作階段與執行緒標題等短內部任務。會退回至 `agents.defaults.utilityModel`，再退回至此代理程式的主要模型。
- `params`：每代理程式串流參數，會合併覆蓋 `agents.defaults.models` 中選取的模型項目。用它設定代理程式專屬覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，不必複製整個模型目錄。
- `tts`：選用的每代理程式文字轉語音覆寫。此區塊會深度合併覆蓋 `messages.tts`，因此請將共用的提供者認證與備援政策保留在 `messages.tts`，並在這裡只設定角色專屬值，例如提供者、語音、模型、風格或自動模式。
- `skills`：選用的每代理程式技能允許清單。若省略，代理程式會在已設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而非合併，且 `[]` 表示沒有 Skills。
- `thinkingDefault`：選用的每代理程式預設思考等級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每訊息或工作階段覆寫時，會為此代理程式覆寫 `agents.defaults.thinkingDefault`。選取的提供者/模型設定檔會控制哪些值有效；對於 Google Gemini，`adaptive` 會保留提供者擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 則為 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理程式預設推理可見性（`on | off | stream`）。當未設定每訊息或工作階段推理覆寫時，會為此代理程式覆寫 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理程式快速模式預設值（`"auto" | true | false`）。當未設定每訊息或工作階段快速模式覆寫時套用。
- `models`：選用的每代理程式模型目錄/執行階段覆寫，以完整 `provider/model` ID 作為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理程式執行階段例外。
- `runtime`：選用的每代理程式執行階段描述元。當代理程式應預設使用 ACP 測試架工作階段時，請搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）使用 `type: "acp"`。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案限制為 2 MB。`http(s)` URL 與 `data:` URI 不會依本機檔案大小限制檢查。
- `identity` 會衍生預設值：`ackReaction` 來自 `emoji`，`mentionPatterns` 來自 `name`/`emoji`。
- `subagents.allowAgents`：針對明確 `sessions_spawn.agentId` 目標所設定代理程式 ID 的允許清單（`["*"]` = 任何已設定目標；預設：僅相同代理程式）。若應允許自我指定目標的 `agentId` 呼叫，請包含請求者 ID。其代理程式設定已刪除的過期項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；執行 `openclaw doctor --fix` 清理它們，或在該目標應於繼承預設值時仍可被生成的情況下，加入最小 `agents.list[]` 項目。
- 沙盒繼承防護：若請求者工作階段在沙盒中，`sessions_spawn` 會拒絕會以非沙盒執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設：false）。
- `subagents.maxConcurrent`：跨子代理程式執行的最大並行子代理程式執行數。預設：`8`。
- `subagents.maxChildrenPerAgent`：單一代理程式工作階段可生成的最大作用中子項數。預設：`5`。
- `subagents.maxSpawnDepth`：子代理程式生成的最大巢狀深度（`1`-`5`）。預設：`1`（不巢狀）。
- `subagents.archiveAfterMinutes`：已完成子代理程式狀態封存前的時間。預設：`60`。

---

## 多代理程式路由

在一個閘道內執行多個隔離代理程式。請參閱[多代理程式](/zh-TW/concepts/multi-agent)。

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

### 綁定比對欄位

- `type`（選用）：`route` 用於一般路由（缺少 type 時預設為 route），`acp` 用於持續 ACP 對話綁定。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任何帳戶；省略 = 預設帳戶）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；通道專屬）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**決定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，無 peer/guild/team）
5. `match.accountId: "*"`（整個通道）
6. 預設代理程式

在每一層中，第一個符合的 `bindings` 項目會生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確的對話身分（`match.channel` + 帳戶 + `match.peer.id`）解析，且不使用上述路由綁定層級順序。

### 每代理程式存取設定檔

<Accordion title="完整存取權（無沙盒）">

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

如需優先順序詳細資訊，請參閱[多代理程式沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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

<Accordion title="工作階段欄位詳細資訊">

- **`scope`**：群組聊天情境的基礎會話分組策略。
  - `per-sender`（預設）：每個傳送者在通道情境中取得隔離的會話。
  - `global`：通道情境中的所有參與者共用單一會話（僅在有意使用共享情境時使用）。
- **`dmScope`**：私訊的分組方式。
  - `main`：所有私訊共用主要會話。
  - `per-peer`：跨通道依傳送者 ID 隔離。
  - `per-channel-peer`：依通道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 通道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應到帶有提供者前綴的對等端，以便跨通道共享會話。`/dock_discord` 等停駐命令會使用相同對應，將作用中會話的回覆路由切換到另一個已連結的通道對等端；請參閱[通道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設政策。`daily` 會在 `atHour` 本地時間重設；`idle` 會在 `idleMinutes` 後重設。兩者都設定時，先到期者優先。每日重設的新鮮度使用會話資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、執行通知與閘道簿記等背景/系統事件寫入可以更新 `updatedAt`，但它們不會讓每日/閒置會話保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 會作為 `direct` 的別名接受。
- **`resetByChannel`**：依提供者/通道 ID 作為鍵的逐通道重設覆寫。當會話的通道有相符項目時，該項目會直接優先於該會話的 `resetByType`/`reset`。僅在某個通道需要與類型層級政策不同的重設行為時使用。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天儲存桶。
- **`agentToAgent.maxPingPongTurns`**：代理程式對代理程式交換期間，代理程式之間的最大來回回覆輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用來回串接。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，含舊版 `dm` 別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：會話儲存清理 + 保留控制。
  - `mode`：`enforce` 會套用清理且為預設值；`warn` 只會發出警告。
  - `pruneAfter`：過期項目的年齡截止值（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大項目數（預設 `500`）。執行階段會用小型高水位緩衝區批次寫入清理，以適用於生產規模的上限；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短生命週期的閘道模型執行探測會話使用固定 `24h` 保留期，但清理受壓力閘控：只有在達到會話項目維護/上限壓力時，才會移除過期的嚴格模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵符合資格；一般直接、群組、執行緒、排程、鉤子、心跳偵測、ACP 與子代理程式會話不會繼承此 24h 保留期。模型執行清理執行時，會先於較廣泛的 `pruneAfter` 過期項目清理和 `maxEntries` 上限執行。
  - `rotateBytes`：已淘汰並忽略；`openclaw doctor --fix` 會從舊設定中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄封存的保留期。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的會話目錄磁碟預算。在 `warn` 模式會記錄警告；在 `enforce` 模式會先移除最舊的成品/會話。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：會話轉錄寫入鎖定控制。只有在合法的轉錄準備、清理、壓縮或鏡像工作競用時間超過預設政策時才調整。
  - `acquireTimeoutMs`：取得鎖定時等待的毫秒數，超過後回報會話忙碌。預設：`60000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：既有鎖定被視為過期並回收前的毫秒數。預設：`1800000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：處理程序內持有的鎖定，在看門狗釋放前可持續持有的毫秒數。預設：`300000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：執行緒繫結會話功能的全域預設值。
  - `enabled`：主要預設開關（提供者可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設以小時計算的閒置自動取消聚焦（`0` 會停用；提供者可覆寫）
  - `maxAgeHours`：預設以小時計算的硬性最大年齡（`0` 會停用；提供者可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 執行緒產生項建立執行緒繫結工作會話的預設閘門。啟用執行緒繫結時預設為 `true`；提供者/帳號可覆寫。
  - `defaultSpawnContext`：執行緒繫結產生項的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

</Accordion>

---

## 訊息

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (default) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (default)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 回應前綴

逐通道/帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最明確者優先）：帳號 → 通道 → 全域。`""` 會停用並停止串接。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 描述                 | 範例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 簡短模型名稱         | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供者名稱           | `anthropic`                 |
| `{thinkingLevel}` | 目前思考層級         | `high`, `low`, `off`        |
| `{identity.name}` | 代理程式身分名稱     | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認表情回應

- 預設為作用中代理程式的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 逐通道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 通道 → `messages.ackReaction` → 身分後援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`，或 `off`/`none`（完全停用確認表情回應）。
- `removeAckAfterReply`：在 Slack、Discord、Signal、Telegram、WhatsApp 與 iMessage 等支援反應的通道上，回覆後移除確認表情回應。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 與 WhatsApp 上啟用生命週期狀態反應。
  在 Slack 和 Discord 上，未設定時會在確認表情回應啟用時保持狀態反應啟用。
  在 Signal、Telegram 和 WhatsApp 上，請明確將其設為 `true` 以啟用生命週期狀態反應。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 與 `stallHard`。
  Telegram 只允許固定反應集合，因此不支援的已設定表情符號會退回
  到該聊天最接近的受支援狀態變體。

### 佇列

- `mode`：會話執行中抵達的傳入訊息佇列策略。預設：`"steer"`。
  - `steer`：將新提示注入作用中執行。
  - `followup`：在作用中執行完成後執行新提示。
  - `collect`：批次收集相容訊息，稍後一起執行。
  - `interrupt`：在開始最新提示前中止作用中執行。
- `debounceMs`：派送已排隊/已導向訊息前的延遲。預設：`500`。
- `cap`：套用丟棄政策前的最大佇列訊息數。預設：`20`。
- `drop`：超過上限時的策略。`"summarize"`（預設）會丟棄最舊項目但保留精簡摘要；`"old"` 會丟棄最舊項目且不保留摘要；`"new"` 會拒絕最新項目。
- `byChannel`：以提供者 ID 作為鍵的逐通道 `mode` 覆寫。
- `debounceMsByChannel`：以提供者 ID 作為鍵的逐通道 `debounceMs` 覆寫。

### 傳入防抖

將同一傳送者快速傳來的純文字訊息批次合併為單一代理程式回合。媒體/附件會立即送出。控制命令會略過防抖。預設 `debounceMs`：`2000`。

### 其他訊息鍵

- `messages.messagePrefix`：在傳入使用者訊息到達代理程式執行階段前，加在前面的前綴文字。請謹慎用於通道情境標記。
- `messages.visibleReplies`：控制直接、群組與通道對話中的可見來源回覆（`"message_tool"` 需要 `message(action=send)` 才會產生可見輸出；`"automatic"` 會像先前一樣發佈一般回覆）。
- `messages.usageTemplate` / `messages.responseUsage`：自訂 `/usage` 頁尾範本與預設逐回覆使用量模式（`off | tokens | full`，加上舊版 `on` 作為 `tokens` 的別名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群組訊息提及觸發條件與歷史視窗大小。
- `messages.suppressToolErrors`：設為 `true` 時，會抑制顯示給使用者的 `⚠️` 工具錯誤警告（代理程式仍會在情境中看到錯誤並可重試）。預設：`false`。

### TTS（文字轉語音）

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆寫本機偏好設定，而 `/tts status` 會顯示實際生效狀態。
- `summaryModel` 會覆寫自動摘要使用的 `agents.defaults.model.primary`。
- `modelOverrides` 預設啟用（`enabled !== false`）；`modelOverrides.allowProvider` 則需選擇啟用。
- API 金鑰會回退使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建語音提供者由外掛擁有。如果設定了 `plugins.allow`，請包含每個你想使用的 TTS 提供者外掛，例如 Edge TTS 使用 `microsoft`。舊版 `edge` 提供者 ID 會作為 `microsoft` 的別名被接受。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，最後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為 OpenAI 相容的 TTS 伺服器，並放寬模型/語音驗證。

---

## Talk

Talk 模式（macOS/iOS/Android）的預設值。

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
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- 設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容使用。執行 `openclaw doctor --fix` 可將已保存的設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會回退使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS Talk 用戶端行為）。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- 只有在未設定 Talk API 金鑰時，才會套用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 可讓 Talk 指令使用易讀名稱。
- `providers.mlx.modelId` 選擇 macOS 本機 MLX 輔助程式使用的 Hugging Face repo。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在存在時透過內建的 `openclaw-mlx-tts` 輔助程式執行，或使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI Talk 即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw 代理程式執行的思考等級。保留未設定可維持一般工作階段/模型行為。
- `consultFastMode` 會為 Control UI Talk 即時諮詢設定一次性的快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS Talk 語音辨識使用的 BCP 47 locale ID。保留未設定則使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者靜默後等待多久才送出轉錄。未設定時會保留平台預設暫停時間窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）。
- `realtime.instructions` 會將提供者面向的系統指令附加到 OpenClaw 內建即時提示，讓你可設定語音風格且不會失去預設的 `openclaw_agent_consult` 指引。
- `realtime.consultRouting`：`"provider-direct"`（預設）會在即時提供者產生最終使用者轉錄且沒有 `openclaw_agent_consult` 時，保留直接提供者回覆。`"force-agent-consult"` 會改由 OpenClaw 路由最終請求。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見任務與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

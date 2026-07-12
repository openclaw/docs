---
read_when:
    - 調整代理程式預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與綁定
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理程式預設值、多代理程式路由、工作階段、訊息與語音設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-12T14:30:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 與 `talk.*` 之下的代理範圍設定鍵。關於頻道、工具、閘道執行階段及其他
頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理預設值

### `agents.defaults.workspace`

預設值：若已設定 `OPENCLAW_WORKSPACE_DIR`，則使用該值；否則使用 `~/.openclaw/workspace`（當 `OPENCLAW_PROFILE` 設為非預設設定檔時，則使用 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確指定的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。若你不想將該路徑寫入設定，請使用此環境變數，
讓預設代理指向已掛載的工作區。

### `agents.defaults.repoRoot`

顯示於系統提示詞「Runtime」行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區向上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

供未設定 `agents.list[].skills`
之代理使用的選用預設 Skills 允許清單。

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

- 省略 `agents.defaults.skills`，預設即不限制 Skills。
- 省略 `agents.list[].skills` 以繼承預設值。
- 設定 `agents.list[].skills: []` 表示不使用任何 Skills。
- 非空的 `agents.list[].skills` 清單即為該代理的最終集合；
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立選定的選用工作區檔案，同時仍會寫入必要的啟動檔案（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 與 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的接續回合（在助理完成回應後）會略過重新注入工作區啟動內容，以縮減提示詞大小。心跳偵測執行及壓縮後重試仍會重建上下文。
- `"never"`：在每個回合停用工作區啟動內容與上下文檔案注入。僅適用於完全自行管理提示詞生命週期的代理（自訂上下文引擎、建立自身上下文的原生執行階段，或不使用啟動內容的專用工作流程）。心跳偵測與壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

個別代理覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的字元數上限。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

個別代理覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案合計注入的字元數上限。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

個別代理覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值會
繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 個別代理的啟動設定檔覆寫

當某個代理需要與共用預設值不同的提示詞
注入行為時，請使用個別代理的啟動設定檔覆寫。省略的欄位會繼承自
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

控制啟動上下文遭截斷時，代理可見的系統提示詞通知。
預設值：`"always"`。

- `"off"`：永不將截斷通知文字注入系統提示詞。
- `"once"`：每個不重複的截斷特徵只注入一次簡短通知。
- `"always"`：只要存在截斷，每次執行都注入簡短通知（建議）。

詳細的原始／注入計數及設定調校欄位仍會保留於診斷資訊中，
例如上下文／狀態報告與日誌；一般 WebChat 使用者／執行階段上下文只會
收到簡短的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文預算權責對照表

OpenClaw 有多項高用量的提示詞／上下文預算，並刻意
依子系統分開管理，而非全部透過單一通用
設定項目控制。

| 預算                                                           | 涵蓋範圍                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 一般工作區啟動內容注入                                                                                                                                          |
| `agents.defaults.startupContext.*`                             | 單次重設／啟動模型執行的前置內容，包括近期每日 `memory/*.md` 檔案。純聊天 `/new` 與 `/reset` 會確認重設，但不會叫用模型                                            |
| `skills.limits.*`                                              | 注入系統提示詞的精簡 Skills 清單                                                                                                                                |
| `agents.defaults.contextLimits.*`                              | 有界限的執行階段摘錄與注入的執行階段自有區塊                                                                                                                    |
| `memory.qmd.limits.*`                                          | 已建立索引的記憶搜尋片段與注入大小                                                                                                                              |

對應的個別代理覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設／啟動模型執行時，於第一回合注入的啟動前置內容。
純聊天 `/new` 與 `/reset` 命令會確認重設而不叫用
模型，因此不會載入此前置內容。

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

有界限執行階段上下文介面的共用預設值。

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

- `memoryGetMaxChars`：加入截斷
  中繼資料與接續通知前，`memory_get` 摘錄的預設上限。
- `memoryGetDefaultLines`：省略 `lines` 時，`memory_get` 的
  預設行數範圍。
- `toolResultMaxChars`：進階的即時工具結果上限，用於持久保存的
  結果與溢位復原。若要使用模型上下文自動上限，請保留未設定：
  低於 100K 個權杖時為 `16000` 個字元，達 100K 以上時為 `32000` 個字元，達 200K
  以上時為 `64000` 個字元。長上下文模型可接受最高 `1000000` 的
  明確值，但有效上限仍限制在模型上下文視窗的約 30%。
  `openclaw doctor --deep` 會輸出有效上限，而 doctor 僅會在明確覆寫值已過時或無效時發出警告。
- `postCompactionMaxChars`：壓縮後重新整理注入期間使用的 AGENTS.md
  摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 設定項目的個別代理覆寫。省略的欄位會繼承
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

注入系統提示詞之精簡 Skills 清單的全域上限。這
不影響按需讀取 `SKILL.md` 檔案。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示詞預算的個別代理覆寫。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在呼叫提供者之前，逐字稿／工具圖片區塊中圖片最長邊的像素上限。
預設值：`1200`。

較低的值通常可降低大量螢幕截圖執行時的視覺權杖用量及請求承載資料大小。
較高的值則可保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

針對從檔案路徑、URL 及媒體參照載入的圖片，設定圖片工具的壓縮／細節偏好。
預設值：`auto`。

OpenClaw 會依選定的圖片模型調整縮放層級。例如，Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL 與託管式 Llama 4 視覺模型可使用比舊版／預設高細節視覺路徑更大的圖片，而在 `auto` 模式下，多圖片回合會採用更積極的壓縮，以控制權杖與延遲成本。

值：

- `auto`：依模型限制與圖片數量調整。
- `efficient`：優先使用較小圖片，以降低權杖與位元組用量。
- `balanced`：使用標準的折衷縮放層級。
- `high`：為螢幕截圖、圖表及文件圖片保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示詞上下文使用的時區（非訊息時間戳記）。若未設定，則使用主機時區。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系統提示詞中的時間格式。預設值：`auto`（作業系統偏好設定）。

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
  - 字串形式只設定主要模型。
  - 物件形式設定主要模型及依序排列的容錯移轉模型。
- `utilityModel`：選用的 `provider/model` 參照或別名，用於簡短的內部工作。目前用於產生 Control UI 工作階段標題、Telegram 私訊主題標題、Discord 自動討論串標題，以及[進度草稿旁白](/zh-TW/concepts/progress-drafts#narrated-status)。未設定時，若 OpenClaw 主要提供者有宣告小型模型預設值，便會採用該值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）；否則，標題工作會改用代理程式的主要模型，而旁白則維持關閉。設定 `utilityModel: ""` 可完全停用工具模型路由。`agents.list[].utilityModel` 會覆寫預設值（個別代理程式設為空值時，會對該代理程式停用此功能），而特定操作的模型覆寫優先於兩者。工具工作會進行個別的模型呼叫，並將工作專屬內容傳送給所選的模型提供者。儀表板標題產生最多會傳送第一則非命令訊息的前 1,000 個字元；旁白會傳送傳入要求及精簡且經遮蔽處理的工具摘要。請選擇符合成本與資料處理需求的提供者。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供 `image` 工具路徑作為其視覺模型設定。
  - 當所選或預設模型無法接受圖片輸入時，也會用於備援路由。
  - 建議明確使用 `provider/model` 參照。為相容性起見也接受裸 ID；若裸 ID 在 `models.providers.*.models` 中唯一符合某個已設定且具圖片處理能力的項目，OpenClaw 會為其加上該提供者。若符合多個已設定項目，則必須明確加上提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用圖片生成功能，以及任何未來可產生圖片的工具／外掛介面使用。
  - 常見值：原生 Gemini 圖片生成使用 `google/gemini-3.1-flash-image-preview`、fal 使用 `fal/fal-ai/flux/dev`、OpenAI Images 使用 `openai/gpt-image-2`，透明背景的 OpenAI PNG/WebP 輸出則使用 `openai/gpt-image-1.5`。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2`／`openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 若省略，`image_generate` 仍可推斷已有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的圖片生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用音樂生成功能及內建 `music_generate` 工具使用。
  - 常見值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 若省略，`music_generate` 仍可推斷已有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用影片生成功能及內建 `video_generate` 工具使用。
  - 常見值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 若省略，`video_generate` 仍可推斷已有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
  - 官方 Qwen 影片生成外掛最多支援 1 部輸出影片、1 張輸入圖片、4 部輸入影片、10 秒時長，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供 `pdf` 工具進行模型路由。
  - 若省略，PDF 工具會先改用 `imageModel`，再改用解析後的工作階段／預設模型。
- `pdfMaxBytesMb`：呼叫時未傳入 `maxBytesMb` 的情況下，`pdf` 工具所使用的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在擷取備援模式下考量的預設最大頁數。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要及進度草稿工具行的詳細資料模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令／詳細資料）。各代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。各代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。只有在未設定每則訊息或工作階段的推理覆寫時，設定的推理預設值才會套用於擁有者、已授權的傳送者，或操作員管理員的閘道情境。
- `elevatedDefault`：代理程式的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設：`"on"`。
- `model.primary`：格式為 `provider/model`（例如透過 Codex OAuth 存取時使用 `openai/gpt-5.6-sol`）。若省略提供者，OpenClaw 會先嘗試別名，再嘗試精確模型 ID 在已設定提供者中的唯一相符項目，最後才改用已設定的預設提供者（此為已淘汰的相容性行為，因此建議明確使用 `provider/model`）。若該提供者已不再提供已設定的預設模型，OpenClaw 會改用第一個已設定的提供者／模型，而不會顯示已移除提供者的過時預設值。
- `models`：為 `/model` 設定的模型目錄與允許清單。每個項目可包含 `alias`（捷徑）及 `params`（提供者專屬，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`／`extraBody`）。
  - 使用 `"openai/*": {}` 或 `"vllm/*": {}` 等 `provider/*` 項目，可顯示所選提供者的所有已探索模型，而無須手動列出每個模型 ID。
  - 若該提供者所有動態探索到的模型都應使用相同執行階段，請在 `provider/*` 項目中加入 `agentRuntime`。精確的 `provider/model` 執行階段政策仍優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則若取代操作會移除現有的允許清單項目，`config set` 會拒絕執行。
  - 提供者範圍的設定／初始設定流程會將選取的提供者模型合併至此對應表，並保留已設定的其他不相關提供者。
  - 對於直接使用 OpenAI Responses 的模型，系統會自動啟用伺服器端壓縮。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫門檻值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#advanced-configuration)。
- `params`：套用於所有模型的全域預設提供者參數。請在 `agents.defaults.params` 設定（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基礎）會被 `agents.defaults.models["provider/model"].params`（各模型）覆寫，接著 `agents.list[].params`（符合的代理程式 ID）再依鍵覆寫。詳細資訊請參閱[提示詞快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 全域預設的提供者路由政策。OpenClaw 會將此值轉送至 OpenRouter 要求的 `provider` 物件；各模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 及代理程式參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`／`params.extraBody`：進階直通 JSON，會合併至 OpenAI 相容代理伺服器的 `api: "openai-completions"` 要求主體。若與產生的要求鍵衝突，額外主體優先；非原生的 completions 路由之後仍會移除 OpenAI 專用的 `store`。
- `params.chat_template_kwargs`：vLLM／OpenAI 相容的聊天範本引數，會合併至頂層的 `api: "openai-completions"` 要求主體。對於關閉思考的 `vllm/nemotron-3-*`，隨附的 vLLM 外掛會自動傳送 `enable_thinking: false` 及 `force_nonempty_content: true`；明確設定的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 和 Nemotron 思考模型會提供二元 `/think` 選項（`off`、`on`），而非多層級的投入程度階梯。
- `compat.thinkingFormat`：OpenAI 相容的思考承載資料樣式。Together 樣式的 `reasoning.enabled` 請使用 `"together"`；Qwen 樣式的頂層 `enable_thinking` 請使用 `"qwen"`；在支援要求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM）上，`chat_template_kwargs.enable_thinking` 請使用 `"qwen-chat-template"`。OpenClaw 會將停用思考對應為 `false`，啟用思考對應為 `true`，而已設定的 vLLM Qwen 模型會針對這些格式提供二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：各模型的 OpenAI 相容推理投入程度清單。對於確實接受 `"xhigh"` 的自訂端點，請將其納入；OpenClaw 隨後會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定提供者／模型的 `llm-task` 驗證中提供 `/think xhigh`。若後端需要對標準層級使用提供者專屬值，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅適用於 Z.AI 的保留思考選用設定。啟用且思考為開啟狀態時，OpenClaw 會傳送 `thinking.clear_thinking: false`，並重播先前的 `reasoning_content`；請參閱 [Z.AI 思考與保留思考](/zh-TW/providers/zai#advanced-configuration)。
- `localService`：供本機／自行託管模型伺服器使用的選用提供者層級程序管理員。當所選模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`）；若端點無法使用，便以 `args` 啟動 `command`，等待最多 `readyTimeoutMs`，然後傳送模型要求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序持續執行，直到 OpenClaw 結束；正值會在指定的閒置毫秒數後，停止由 OpenClaw 啟動的程序。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策應設定於提供者或模型，而非 `agents.defaults`。提供者全域規則請使用 `models.providers.<provider>.agentRuntime`，模型專屬規則則使用 `agents.defaults.models["provider/model"].agentRuntime`／`agents.list[].models["provider/model"].agentRuntime`。單獨使用提供者／模型前綴絕不會選取執行框架。當執行階段未設定或設為 `auto` 時，只有對精確的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行撰寫的要求覆寫時，OpenAI 才可能隱含選取 Codex。請參閱 [OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
- 會變更這些欄位的設定寫入工具（例如 `/models set`、`/models set-image`，以及新增／移除備援的命令）會儲存標準物件形式，並儘可能保留現有的備援清單。
- `maxConcurrent`：跨工作階段同時執行的代理程式數量上限（每個工作階段內仍依序執行）。預設：`4`。

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
      model: "openai/gpt-5.6-sol",
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

- `id`：`"auto"`、`"openclaw"`、已註冊的外掛執行框架 ID，或支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛則提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 允許已註冊的外掛執行框架接管已宣告或以其他方式符合其支援契約的有效路由；若沒有相符的執行框架，則使用 OpenClaw。明確指定外掛執行階段（例如 `id: "codex"`）時，必須具備該執行框架及相容的有效路由；若任一項不可用或執行失敗，便會採取封閉式失敗。
- `id: "pi"` 僅作為 `openclaw` 的已棄用別名接受，以保留 v2026.5.22 及更早版本已發布的設定。新設定應使用 `openclaw`。
- 執行階段的優先順序依次為：精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），接著是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 中的供應商整體政策。
- 整個代理程式層級的執行階段鍵屬於舊版設定。執行階段選擇會忽略 `agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段固定設定，以及 `OPENCLAW_AGENT_RUNTIME`。執行 `openclaw doctor --fix` 以移除過時值。
- 符合資格、完全相符的官方 HTTPS OpenAI Responses/ChatGPT 路由，若沒有自行撰寫的請求覆寫，可能會隱式使用 Codex 執行框架。供應商／模型的 `agentRuntime.id: "codex"` 會將 Codex 設為封閉式失敗的必要條件，但不會使不相容的路由變得相容。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"`，並搭配模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/<model>` 參照仍可基於相容性運作，但新設定應維持標準的供應商／模型選擇，並將執行後端放在供應商／模型執行階段政策中。
- 這只會控制文字代理程式回合的執行。媒體生成、視覺、PDF、音樂、影片及 TTS 仍使用其供應商／模型設定。

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

除非你設定 `--thinking off`，或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`，否則 Z.AI GLM-4.x 模型會自動啟用思考模式。
Z.AI 模型預設會啟用 `tool_stream`，以串流傳輸工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 即可停用。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設關閉思考；明確啟用自適應思考時，Anthropic 供應商所管理的推理強度預設值為 `high`。若未設定明確的思考層級，Claude 4.6 模型預設使用 `adaptive`。

### `agents.defaults.cliBackends`

文字專用備援執行可使用的選用命令列介面後端（不含工具呼叫）。當 API 供應商失敗時，可作為備用方案。

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
          // 如果命令列介面接受提示詞檔案旗標，也可以使用 systemPromptFileArg。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- 命令列介面後端以文字為主；工具一律停用。
- 設定 `sessionArg` 時支援工作階段。
- 當 `imageArg` 接受檔案路徑時，支援直接傳遞影像。
- `reseedFromRawTranscriptWhenUncompacted: true` 允許後端在第一份壓縮摘要產生前，從有長度限制的 OpenClaw 原始逐字記錄尾端，復原可安全重新植入內容的失效工作階段。認證設定檔或認證資訊世代變更時，仍絕不會從原始逐字記錄重新植入內容。

### `agents.defaults.promptOverlays`

依模型系列套用至 OpenClaw 組裝提示詞介面的供應商獨立提示詞覆蓋層。GPT-5 系列模型 ID 會在 OpenClaw／供應商路由間接收共用行為契約；`personality` 只控制友善互動風格層。原生 Codex 應用程式伺服器路由會保留 Codex 管理的基礎／模型指示，而不使用此 OpenClaw GPT-5 覆蓋層；對原生討論串，OpenClaw 會停用 Codex 的內建個性。

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
- `"off"` 只會停用友善層；帶標記的 GPT-5 行為契約仍保持啟用。
- 若未設定此共用設定，仍會讀取舊版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期心跳偵測執行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 會停用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 預設：true；false 會從系統提示詞省略心跳偵測區段
        lightContext: false, // 預設：false；true 只會保留工作區啟動檔案中的 HEARTBEAT.md
        isolatedSession: false, // 預設：false；true 會在全新工作階段中執行每次心跳偵測（不含對話記錄）
        skipWhenBusy: false, // 預設：false；true 也會等待此代理程式的子代理程式／巢狀執行通道
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（預設）| block
        target: "none", // 預設：none | 選項：last | whatsapp | telegram | discord | ...
        prompt: "如果 HEARTBEAT.md 存在，請讀取它……",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：持續時間字串（ms/s/m/h）。預設值：`30m`（API 金鑰驗證）或 `1h`（OAuth 驗證）。設為 `0m` 即可停用。
- `includeSystemPromptSection`：設為 false 時，會從系統提示詞省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入啟動上下文。預設值：`true`。
- `suppressToolErrorWarnings`：設為 true 時，會在心跳偵測執行期間抑制工具錯誤警告承載內容。
- `timeoutSeconds`：心跳偵測代理程式回合中止前允許的最長時間（秒）。若未設定，則在已設定 `agents.defaults.timeoutSeconds` 時使用該值，否則使用心跳偵測週期，且上限為 600 秒。
- `directPolicy`：直接／DM 傳送政策。`allow`（預設）允許傳送至直接目標。`block` 會抑制傳送至直接目標，並發出 `reason=dm-blocked`。
- `lightContext`：設為 true 時，心跳偵測執行會使用輕量啟動上下文，且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：設為 true 時，每次心跳偵測都會在沒有先前對話記錄的全新工作階段中執行。隔離模式與排程的 `sessionTarget: "isolated"` 相同。每次心跳偵測的權杖成本會從約 100K 降至約 2-5K 個權杖。
- `skipWhenBusy`：設為 true 時，若該代理程式有額外忙碌的執行通道，心跳偵測會延後：包括其自身以工作階段鍵區分的子代理程式或巢狀命令工作。即使未設定此旗標，排程執行通道也一律會延後心跳偵測。
- 個別代理程式：設定 `agents.list[].heartbeat`。當任一代理程式定義 `heartbeat` 時，**只有這些代理程式**會執行心跳偵測。
- 心跳偵測會執行完整的代理程式回合——間隔越短，消耗的權杖越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已註冊壓縮供應商外掛的 ID（選用）
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "完整保留部署 ID、工單 ID，以及主機:連接埠配對。", // 當 identifierPolicy=custom 時使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 選用的工具迴圈壓力檢查
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["工作階段啟動", "紅線"], // 選擇啟用重新注入 AGENTS.md 區段
        model: "openrouter/anthropic/claude-sonnet-4-6", // 選用的壓縮專用模型覆寫
        truncateAfterCompaction: true, // 壓縮後輪替至較小的後繼 JSONL
        maxActiveTranscriptBytes: "20mb", // 選用的預檢本機壓縮觸發條件
        notifyUser: true, // 在壓縮開始／完成及記憶清理降級時發出通知（預設：false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 選用的記憶清理專用模型覆寫
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "工作階段即將進行壓縮。立即儲存持久記憶。",
          prompt: "將任何值得長期保留的筆記寫入 memory/YYYY-MM-DD.md；若沒有內容需要儲存，請以完全相符的靜默權杖 NO_REPLY 回覆。",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（針對長歷程進行分塊摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`：已註冊壓縮提供者外掛的 ID。設定後，會呼叫提供者的 `summarize()`，而非使用內建的 LLM 摘要。失敗時會退回內建摘要。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止單次壓縮作業前允許的最長秒數。預設值：`180`。
- `reserveTokens`：壓縮後為模型輸出及未來工具結果保留的 token 空間。若模型的脈絡視窗大小已知，OpenClaw 會限制實際保留量，使其不會占用提示詞預算。
- `reserveTokensFloor`：內嵌執行階段強制保留的最低量。設為 `0` 可停用此下限。此下限仍受目前脈絡視窗上限約束。
- `keepRecentTokens`：代理程式用於逐字保留最新對話記錄尾端的切分點預算。明確設定時，手動 `/compact` 會遵循此值；否則，手動壓縮會形成硬性檢查點。
- `recentTurnsPreserve`：在防護摘要之外逐字保留的最新使用者／助理對話輪數。預設值：`3`。
- `maxHistoryShare`：壓縮後允許保留歷程占總脈絡預算的最大比例（範圍為 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`：當 `identifierPolicy=custom` 時使用的選用自訂識別碼保留文字。
- `qualityGuard`：對防護摘要執行輸出格式錯誤時重試的檢查。防護模式下預設啟用；設為 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次模型呼叫前檢查脈絡壓力。如果脈絡已無法容納，會在提交提示詞前中止目前嘗試，並重用既有的預先檢查復原路徑，以截斷工具結果，或進行壓縮後重試。適用於 `default` 與 `safeguard` 壓縮模式。預設：停用。
- `postIndexSync`：壓縮後的工作階段記憶重新索引模式。預設值：`"async"`。需要最高新鮮度時使用 `"await"`；需要降低壓縮延遲時使用 `"async"`；只有在其他位置處理工作階段記憶同步時才使用 `"off"`。
- `postCompactionSections`：壓縮後要重新注入的選用 AGENTS.md H2/H3 區段名稱。未設定或設為 `[]` 時停用重新注入。明確設為 `["Session Startup", "Red Lines"]` 會啟用這組區段，並保留舊版 `Every Session`/`Safety` 後援。只有當額外脈絡的價值高於重複壓縮摘要中已擷取之專案指引的風險時，才啟用此功能。
- `model`：僅用於壓縮摘要的選用 `provider/model-id`，或來自 `agents.defaults.models` 的裸別名。裸別名會在分派前解析；若發生衝突，已設定的模型 ID 字面值優先。當主要工作階段應保留使用某個模型，但壓縮摘要應在另一個模型上執行時，請使用此設定；未設定時，壓縮會使用工作階段的主要模型。
- `truncateAfterCompaction`：壓縮後輪替目前工作階段的對話記錄，讓未來對話輪次只載入摘要及尚未摘要的尾端內容，而先前的完整對話記錄仍會封存。這可防止長時間執行的工作階段中，目前對話記錄無限制增長。預設值：`false`。
- `maxActiveTranscriptBytes`：選用的位元組門檻（`number` 或如 `"20mb"` 的字串）；當對話記錄歷程超過門檻時，會在執行前觸發一般本機壓縮。需要啟用 `truncateAfterCompaction`，成功壓縮後才能輪替至較小的後繼對話記錄。未設定或設為 `0` 時停用。
- `notifyUser`：設為 `true` 時，會向使用者傳送簡短的脈絡維護通知：壓縮開始與完成時（例如「正在壓縮脈絡……」和「壓縮完成」），以及壓縮前的記憶清理已用盡，使回覆以降級狀態繼續時（例如「記憶維護暫時失敗；將繼續回覆。」）。預設停用，以保持這些通知靜默。
- `memoryFlush`：自動壓縮前的靜默代理式對話輪次，用於儲存持久記憶。若此例行維護對話輪次應持續使用本機模型，請將 `model` 設為確切的提供者／模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承目前工作階段的後援鏈。即使 token 計數器過時，當對話記錄大小達到門檻時，`forceFlushTranscriptBytes` 仍會強制執行清理。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

內嵌代理程式執行階段之外層執行迴圈重試迭代界限，用於防止失敗復原期間出現無限執行迴圈。此設定僅適用於內嵌代理程式執行階段，不適用於 ACP 或命令列介面執行階段。

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
        runRetries: { max: 50 }, // 選用的各代理程式覆寫
      },
    ],
  },
}
```

- `base`：外層執行迴圈的基本執行重試迭代次數。預設值：`24`。
- `perProfile`：每個後援設定檔候選項額外獲得的執行重試迭代次數。預設值：`8`。
- `min`：執行重試迭代的最低絕對上限。預設值：`32`。
- `max`：執行重試迭代的最高絕對上限，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送至 LLM 前，從記憶體內脈絡中修剪**舊工具結果**。這**不會**修改磁碟上的工作階段歷程。預設停用；設為 `mode: "cache-ttl"` 可啟用。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off（預設）| cache-ttl
        ttl: "1h", // 持續時間（ms/s/m/h），預設單位：分鐘；預設值：5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[舊工具結果內容已清除]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行為">

- `mode: "cache-ttl"` 會啟用修剪流程。
- `ttl` 控制修剪可再次執行的頻率（從最後一次快取存取起算）。預設值：`5m`。
- 修剪會先對過大的工具結果進行軟性截短，然後視需要硬性清除較舊的工具結果。
- `softTrimRatio` 與 `hardClearRatio` 接受 `0.0` 至 `1.0` 的值；設定驗證會拒絕超出此範圍的值。

**軟性截短**會保留開頭與結尾，並在中間插入 `...`。

**硬性清除**會以預留位置文字取代整個工具結果。

注意：

- 圖片區塊絕不會被截短／清除。
- 比例以字元為基礎（近似值），並非精確的 token 數量。
- 如果助理訊息少於 `keepLastAssistants`，則會略過修剪。

</Accordion>

如需行為詳細資訊，請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 區塊串流

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off（預設）| natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 頻道需要明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及各帳號變體）。Discord、Google Chat、Mattermost、MS Teams、Signal 與 Slack 的預設值為 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：偏好的分塊邊界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：區塊回覆之間的隨機暫停。預設值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未設定的界限會退回自然範圍）。各代理程式覆寫：`agents.list[].humanDelay`。

如需行為與分塊詳細資訊，請參閱[串流](/zh-TW/concepts/streaming)。

### 輸入中指示器

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

- 預設值：直接聊天／提及為 `instant`，未提及的群組聊天為 `message`。
- `typingIntervalSeconds` 預設值：`6`。
- 各工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入中指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

內嵌代理程式的選用沙箱功能。完整指南請參閱[沙箱功能](/zh-TW/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off（預設）| non-main | all
        backend: "docker", // docker（預設）| ssh | openshell
        scope: "agent", // session | agent（預設）| shared
        workspaceAccess: "none", // none（預設）| ro | rw
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
          // 也支援 SecretRefs／行內內容：
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

上述顯示的預設值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 映像檔/`none` 網路等）是 OpenClaw 的實際預設值，而不只是示例值。

<Accordion title="沙箱詳細資訊">

**後端：**

- `docker`：本機 Docker 執行環境（預設）
- `ssh`：由通用 SSH 支援的遠端執行環境
- `openshell`：OpenShell 執行環境

選取 `backend: "openshell"` 時，執行環境專屬設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：採用 `user@host[:port]` 格式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於各範圍工作區的遠端絕對根目錄（預設：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在執行階段具體化為暫存檔案的內嵌內容或 SecretRef
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰原則控制項（兩者預設皆為 `true`）

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙箱工作階段啟動前，從作用中的密鑰執行環境快照解析

**SSH 後端行為：**

- 建立或重新建立後，只植入一次遠端工作區
- 之後以遠端 SSH 工作區作為標準工作區
- 透過 SSH 路由 `exec`、檔案工具和媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取權：**

- `none`：位於 `~/.openclaw/sandboxes` 下的各範圍沙箱工作區（預設）
- `ro`：沙箱工作區位於 `/workspace`，代理程式工作區以唯讀方式掛載於 `/agent`
- `rw`：代理程式工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段各有一個容器與工作區
- `agent`：每個代理程式各有一個容器與工作區（預設）
- `shared`：共用容器與工作區（工作階段之間不隔離）

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

- `mirror`：執行前從本機植入遠端，執行後同步回本機；本機工作區維持為標準工作區
- `remote`：建立沙箱時植入遠端一次，之後以遠端工作區作為標準工作區

在 `remote` 模式下，植入步驟完成後，於 OpenClaw 外部進行的主機本機編輯不會自動同步至沙箱。
傳輸方式是透過 SSH 進入 OpenShell 沙箱，但沙箱生命週期與選用的鏡像同步由此外掛負責。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出連線、可寫入的根目錄及 root 使用者。

**容器預設使用 `network: "none"`** — 如果代理程式需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會遭到封鎖。除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急解鎖），否則 `"container:<id>"` 預設會遭到封鎖。
作用中 OpenClaw 沙箱內的 Codex app-server 回合，其原生程式碼模式網路存取也會使用相同的輸出連線設定。

**傳入附件**會暫存至作用中工作區內的 `media/inbound/*`。

**`docker.binds`** 會掛載其他主機目錄；全域與各代理程式的繫結會合併。

**沙箱瀏覽器**（`sandbox.browser.enabled`，預設為 `false`）：在容器中執行 Chromium + CDP。noVNC URL 會注入系統提示。不需要在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，而且 OpenClaw 會產生短效權杖 URL（而不是在共用 URL 中公開密碼）。

- `allowHostControl: false`（預設）會阻止沙箱工作階段以主機瀏覽器為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確需要全域橋接連線時，才設為 `bridge`。此處也會封鎖 `"host"`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 傳入連線限制在某個 CIDR 範圍內（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將其他主機目錄掛載至沙箱瀏覽器容器。設定此項時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 沙箱瀏覽器容器中的 Chromium 一律會使用 `--no-sandbox --disable-setuid-sandbox` 啟動（容器不具備 Chrome 自有沙箱所需的核心基礎功能）；沒有可切換此行為的設定。
- 啟動預設值定義於 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機進行調整：
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
    預設為啟用；如果 WebGL/3D 使用情境需要，可透過
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用這些旗標。
  - `--disable-extensions`（預設啟用）；如果你的工作流程依賴擴充功能，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 可重新啟用擴充功能。
  - `--renderer-process-limit=2` 為預設值；可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更，設為 `0` 則使用 Chromium 的
    預設處理程序限制。
  - 只有啟用 `headless` 時才使用 `--headless=new`。
  - 這些預設值是容器映像檔的基準；若要變更容器預設值，請使用具有自訂
    進入點的自訂瀏覽器映像檔。

</Accordion>

瀏覽器沙箱與 `sandbox.docker.binds` 僅適用於 Docker。

建置映像檔（從原始碼簽出目錄）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若 npm 安裝沒有原始碼簽出目錄，請參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌的 `docker build` 命令。

### `agents.list`（各代理程式覆寫）

使用 `agents.list[].tts` 為代理程式指定專屬的 TTS 提供者、語音、模型、
風格或自動 TTS 模式。代理程式區塊會深度合併至全域
`messages.tts`，因此共用認證資訊可以集中保存在一處，而個別
代理程式只覆寫所需的語音或提供者欄位。作用中代理程式的
覆寫會套用至自動語音回覆、`/tts audio`、`/tts status` 和
`tts` 代理程式工具。如需提供者範例與優先順序，請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)。

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
- `default`：設定多個時，第一個生效（會記錄警告）。若未設定，清單中的第一個項目為預設值。
- `model`：字串形式會設定嚴格的每代理程式主要模型，不使用模型後援；物件形式 `{ primary }` 也採嚴格模式，除非加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 為該代理程式啟用後援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。僅覆寫 `primary` 的排程工作仍會繼承預設後援，除非設定 `fallbacks: []`。
- `utilityModel`：選用的每代理程式覆寫，用於產生工作階段與討論串標題等簡短內部工作。依序後援至 `agents.defaults.utilityModel`、主要供應商宣告的預設小型模型，再到此代理程式的主要模型。空字串會停用此代理程式的公用模型路由。
- `params`：每代理程式串流參數，會合併並覆寫 `agents.defaults.models` 中選定的模型項目。使用此設定可指定代理程式專屬的 `cacheRetention`、`temperature` 或 `maxTokens` 等覆寫，而無須複製整個模型目錄。
- `tts`：選用的每代理程式文字轉語音覆寫。此區塊會深度合併並覆寫 `messages.tts`，因此請將共用供應商認證資訊與後援政策保留在 `messages.tts`，並僅在此處設定供應商、語音、模型、風格或自動模式等角色專屬值。
- `skills`：選用的每代理程式技能允許清單。若省略，代理程式會在已設定時繼承 `agents.defaults.skills`；明確指定的清單會取代預設值而非合併，`[]` 表示不使用任何技能。
- `thinkingDefault`：選用的每代理程式預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每則訊息或工作階段覆寫時，會為此代理程式覆寫 `agents.defaults.thinkingDefault`。選定的供應商／模型設定檔會控制哪些值有效；對 Google Gemini 而言，`adaptive` 會保留由供應商控制的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理程式預設推理可見性（`on | off | stream`）。當未設定每則訊息或工作階段推理覆寫時，會為此代理程式覆寫 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理程式快速模式預設值（`"auto" | true | false`）。在未設定每則訊息或工作階段的快速模式覆寫時套用。
- `models`：選用的每代理程式模型目錄／執行階段覆寫，以完整 `provider/model` ID 為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理程式執行階段例外。
- `runtime`：選用的每代理程式執行階段描述元。當代理程式預設應使用 ACP 控制框架工作階段時，請使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案限制為 2 MB。`http(s)` URL 與 `data:` URI 不受本機檔案大小限制檢查。
- `identity` 會衍生預設值：`ackReaction` 取自 `emoji`，`mentionPatterns` 取自 `name`／`emoji`。
- `subagents.allowAgents`：設定代理程式 ID 的允許清單，供明確的 `sessions_spawn.agentId` 目標使用（`["*"]` = 任意已設定的目標；預設：僅限相同代理程式）。若應允許將 `agentId` 指向請求者自身，請納入請求者 ID。若代理程式設定已刪除，過時的項目會遭 `sessions_spawn` 拒絕，且不會出現在 `agents_list` 中；請執行 `openclaw doctor --fix` 清理，或在該目標應繼承預設值並維持可衍生狀態時，加入最小化的 `agents.list[]` 項目。
- 沙箱繼承防護：若請求者工作階段位於沙箱中，`sessions_spawn` 會拒絕將在非沙箱環境中執行的目標。
- `subagents.requireAgentId`：設為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔；預設：false）。
- `subagents.maxConcurrent`：子代理程式執行期間可同時執行的子代理程式工作數上限。預設值：`8`。
- `subagents.maxChildrenPerAgent`：單一代理程式工作階段可衍生的作用中子代理程式數上限。預設值：`5`。
- `subagents.maxSpawnDepth`：子代理程式衍生的最大巢狀深度（`1`-`5`）。預設值：`1`（不允許巢狀）。
- `subagents.archiveAfterMinutes`：已完成子代理程式狀態在封存前的保留時間。預設值：`60`。

---

## 多代理程式路由

在單一閘道內執行多個彼此隔離的代理程式。請參閱[多代理程式](/zh-TW/concepts/multi-agent)。

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

- `type`（選用）：`route` 用於一般路由（缺少 type 時預設為 route），`acp` 用於持久化 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任意帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId`／`match.teamId`（選用；頻道專屬）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全相符，無 peer/guild/team）
5. `match.accountId: "*"`（整個頻道）
6. 預設代理程式

在每個層級中，第一個相符的 `bindings` 項目生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確的對話識別資訊（`match.channel` + 帳號 + `match.peer.id`）解析，不使用上述路由繫結層級順序。

### 每代理程式存取設定檔

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

<Accordion title="無檔案系統存取權（僅限訊息傳遞）">

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

如需優先順序的詳細資訊，請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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

- **`scope`**：群組聊天情境的基礎工作階段分組策略。
  - `per-sender`（預設）：每位傳送者在頻道情境中都有獨立的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在預期共用情境時使用）。
- **`dmScope`**：私訊的分組方式。
  - `main`：所有私訊共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 ID 隔離。
  - `per-channel-peer`：依頻道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應至帶有提供者前置詞的對等端，以便跨頻道共用工作階段。`/dock_discord` 等停靠命令使用相同的對應，將作用中工作階段的回覆路由切換至另一個已連結的頻道對等端；請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設原則。`daily` 會在當地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。兩者皆已設定時，以先到期者為準。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、執行通知和閘道簿記等背景／系統事件寫入可能會更新 `updatedAt`，但不會讓每日／閒置工作階段保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。接受舊版 `dm` 作為 `direct` 的別名。
- **`resetByChannel`**：依提供者／頻道 ID 作為索引鍵的各頻道重設覆寫。當工作階段的頻道有相符項目時，該項目會完全優先於該工作階段的 `resetByType`/`reset`。僅在某個頻道需要與類型層級原則不同的重設行為時使用。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天貯體。
- **`agentToAgent.maxPingPongTurns`**：代理程式對代理程式交換期間，代理程式之間回覆往返的最大輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用來回鏈結。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，舊版別名為 `dm`）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：工作階段儲存區清理與保留控制。
  - `mode`：`enforce` 會執行清理，且為預設值；`warn` 僅發出警告。
  - `pruneAfter`：過時項目的存留時間臨界值（預設為 `30d`）。
  - `maxEntries`：SQLite 工作階段項目的數量上限（預設為 `500`）。對於正式環境規模的上限，執行階段寫入會使用較小的高水位緩衝區進行批次清理；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短期閘道模型執行探測工作階段使用固定的 `24h` 保留期限，但清理受壓力條件限制：只有在工作階段項目維護／上限壓力達到時，才會移除過時且嚴格符合條件的模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測索引鍵才符合資格；一般直接、群組、討論串、排程、掛鉤、心跳偵測、ACP 和子代理程式工作階段不會沿用此 24 小時保留期限。執行模型執行清理時，會先於範圍較廣的 `pruneAfter` 過時項目清理和 `maxEntries` 上限執行。
  - `rotateBytes`：已棄用且會被忽略；`openclaw doctor --fix` 會將其從舊版設定中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 文字記錄封存的保留期限。預設為 `pruneAfter`；設定 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式下會記錄警告；在 `enforce` 模式下會先移除最舊的成品／工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：工作階段文字記錄寫入鎖定控制。僅當合法的文字記錄準備、清理、壓縮或鏡像作業競爭時間超過預設原則時才進行調整。
  - `acquireTimeoutMs`：取得鎖定時，在將工作階段回報為忙碌之前等待的毫秒數。預設：`60000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：將現有鎖定視為過時並回收前的毫秒數。預設：`1800000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：程序內已持有的鎖定，在監看程式釋放前可持續被持有的毫秒數。預設：`300000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：討論串繫結工作階段功能的全域預設值。
  - `enabled`：主要預設開關（提供者可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設在閒置幾小時後自動取消聚焦（`0` 會停用；提供者可覆寫）
  - `maxAgeHours`：預設絕對最長存留時間（小時）（`0` 會停用；提供者可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 討論串衍生項目建立討論串繫結工作階段的預設閘控。啟用討論串繫結時，預設為 `true`；提供者／帳號可覆寫。
  - `defaultSpawnContext`：討論串繫結衍生項目的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

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
      debounceMs: 2000, // 0 表示停用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 回應前綴

各頻道／帳號的覆寫設定：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析順序（最明確者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止向上套用。`"auto"` 會衍生為 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明             | 範例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 簡短模型名稱     | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 供應商名稱       | `anthropic`                 |
| `{thinkingLevel}` | 目前的思考層級   | `high`、`low`、`off`        |
| `{identity.name}` | 代理程式身分名稱 | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認反應

- 預設使用作用中代理程式的 `identity.emoji`，否則使用 `"👀"`。設為 `""` 可停用。
- 各頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分後備值。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`，或 `off`/`none`（完全停用確認反應）。
- `removeAckAfterReply`：回覆後，移除 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage 等支援反應的頻道上的確認反應。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上啟用生命週期狀態反應。
  在 Discord 上，若未設定，確認反應啟用時會保持啟用狀態反應。
  在 Slack、Signal、Telegram 和 WhatsApp 上，請明確設為 `true` 以啟用生命週期狀態反應。
  Slack 預設使用其原生助理討論串狀態和輪替的載入訊息來顯示進度，同時讓已設定的確認反應保持不變。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 僅允許固定的反應集合，因此不受支援的已設定表情符號會後備為
  該聊天中最接近且受支援的狀態變體。

### 佇列

- `mode`：工作階段執行期間收到傳入訊息時所使用的佇列策略。預設：`"steer"`。
  - `steer`：將新提示注入作用中的執行。
  - `followup`：作用中的執行完成後，再執行新提示。
  - `collect`：將相容的訊息批次收集，稍後一起執行。
  - `interrupt`：在開始最新提示前中止作用中的執行。
- `debounceMs`：分派已排入佇列／引導訊息前的延遲。預設：`500`。
- `cap`：套用捨棄策略前，佇列訊息數量的上限。預設：`20`。
- `drop`：超過上限時所使用的策略。`"summarize"`（預設）會捨棄最舊的項目，但保留精簡摘要；`"old"` 會捨棄最舊的項目且不保留摘要；`"new"` 會拒絕最新項目。
- `byChannel`：以提供者 ID 為鍵的各頻道 `mode` 覆寫。
- `debounceMsByChannel`：以提供者 ID 為鍵的各頻道 `debounceMs` 覆寫。

### 傳入訊息防彈跳

將同一傳送者快速送出的純文字訊息批次合併為單次代理程式輪次。媒體／附件會立即送出。控制命令會略過防彈跳。預設 `debounceMs`：`2000`。

### 其他訊息鍵

- `messages.messagePrefix`：傳入的使用者訊息到達代理程式執行階段前，加在其前方的文字。請僅在必要時用於頻道情境標記。
- `messages.visibleReplies`：控制私訊、群組和頻道對話中可見的來源回覆（`"message_tool"` 要求使用 `message(action=send)` 才會產生可見輸出；`"automatic"` 則會像先前一樣發布一般回覆）。
- `messages.usageTemplate` / `messages.responseUsage`：自訂 `/usage` 頁尾範本，以及每次回覆的預設用量模式（`off | tokens | full`，另有將 `on` 對應至 `tokens` 的舊版別名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群組訊息的提及觸發條件和歷史記錄視窗大小。
- `messages.suppressToolErrors`：設為 `true` 時，隱藏向使用者顯示的 `⚠️` 工具錯誤警告（代理程式仍會在情境中看到錯誤，並可重試）。預設：`false`。

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

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆寫本機偏好設定，而 `/tts status` 會顯示目前生效的狀態。
- `summaryModel` 會覆寫自動摘要所使用的 `agents.defaults.model.primary`。
- `modelOverrides` 預設為啟用（`enabled !== false`）；`modelOverrides.allowProvider` 則須選擇性啟用。
- API 金鑰會依序回退至 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建的語音供應商由外掛擁有。若已設定 `plugins.allow`，請加入你想使用的每個 TTS 供應商外掛，例如 Edge TTS 所使用的 `microsoft`。舊版 `edge` 供應商 ID 仍可作為 `microsoft` 的別名。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定、`OPENAI_TTS_BASE_URL`，最後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為與 OpenAI 相容的 TTS 伺服器，並放寬模型與語音驗證。

---

## 對話

對話模式的預設值（macOS/iOS/Android 及瀏覽器控制介面）。

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "以溫暖的語氣說話，並保持回答簡短。",
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

- 設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix`，將持久化設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會回退至 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS Talk 用戶端行為）。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- 僅在未設定 Talk API 金鑰時，才會套用 `ELEVENLABS_API_KEY` 回退機制。
- `providers.*.voiceAliases` 可讓 Talk 指令使用易讀名稱。
- `providers.mlx.modelId` 會選取 macOS 本機 MLX 輔助程式使用的 Hugging Face 儲存庫。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會透過隨附的 `openclaw-mlx-tts` 輔助程式執行（若存在），或使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 可覆寫開發環境的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI Talk 即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw 代理程式執行的思考層級。保持未設定可保留一般工作階段／模型行為。
- `consultFastMode` 會為 Control UI Talk 即時諮詢設定一次性的快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS Talk 語音辨識使用的 BCP 47 地區設定 ID。保持未設定則使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者停止說話後等待多久才傳送逐字稿。保持未設定則沿用平台預設的暫停時間範圍（`700 ms on macOS and Android, 900 ms on iOS`）。
- `realtime.instructions` 會將面向提供者的系統指示附加至 OpenClaw 內建的即時提示詞，因此可設定語音風格，而不會失去預設的 `openclaw_agent_consult` 指引。
- `realtime.vadThreshold` 設定提供者的語音活動閾值，範圍從 `0`（最敏感）到 `1`（最不敏感）。保持未設定則沿用提供者預設值。
- `realtime.silenceDurationMs` 設定提供者提交即時使用者回合前的正整數靜音時間範圍。保持未設定則沿用提供者預設值。
- `realtime.prefixPaddingMs` 設定在偵測到語音開始前保留的音訊量，值為非負整數。保持未設定則沿用提供者預設值。
- `realtime.reasoningEffort` 設定即時工作階段的提供者特定推理層級。保持未設定則沿用提供者預設值。
- `realtime.consultRouting`：當即時提供者產生不含 `openclaw_agent_consult` 的最終使用者逐字稿時，`"provider-direct"`（預設）會保留提供者的直接回覆。`"force-agent-consult"` 則會改為透過 OpenClaw 路由已定稿的要求。

---

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

---
read_when:
    - 調整代理程式預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理程式預設值、多代理程式路由、工作階段、訊息與對話設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-14T13:39:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f32cd37bd152935ae7602d40733cec63273d31b5bc89fc6a9a8390927ac8c95
    source_path: gateway/config-agents.md
    workflow: 16
---

位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 下的代理程式範圍設定鍵。關於頻道、工具、閘道執行階段及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：設定時為 `OPENCLAW_WORKSPACE_DIR`，否則為 `~/.openclaw/workspace`（當 `OPENCLAW_PROFILE` 設為非預設設定檔時，則為 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。當你不想將該路徑寫入設定時，可使用環境變數將預設代理程式
指向已掛載的工作區。

### `agents.defaults.repoRoot`

顯示於系統提示詞 Runtime 行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區向上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

適用於未設定
`agents.list[].skills` 之代理程式的選用預設 Skills 允許清單。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 繼承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 取代預設值
      { id: "locked-down", skills: [] }, // 不使用任何 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills`，預設即可不限制 Skills。
- 省略 `agents.list[].skills` 以繼承預設值。
- 設定 `agents.list[].skills: []`，表示不使用任何 Skills。
- 非空的 `agents.list[].skills` 清單即為該代理程式的最終集合；
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立所選的選用工作區檔案，但仍會寫入必要的啟動檔案（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的接續回合（在助理完成回應之後）會略過重新注入工作區啟動內容，以縮減提示詞大小。心跳偵測執行和壓縮後重試仍會重建上下文。
- `"never"`：在每個回合停用工作區啟動內容與上下文檔案注入。僅限完全自行管理提示詞生命週期的代理程式使用此設定（自訂上下文引擎、自行建立上下文的原生執行階段，或不使用啟動內容的專用工作流程）。心跳偵測和壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

個別代理程式覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的字元數上限。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

個別代理程式覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

注入所有工作區啟動檔案的字元總數上限。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

個別代理程式覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值
會繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 個別代理程式啟動設定檔覆寫

當某個代理程式需要與共用預設值不同的提示詞
注入行為時，請使用個別代理程式啟動設定檔覆寫。省略的欄位會繼承自
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

控制啟動上下文遭截斷時，代理程式可見的系統提示詞通知。
預設值：`"always"`。

- `"off"`：永不將截斷通知文字注入系統提示詞。
- `"once"`：每個不重複的截斷特徵僅注入一次簡短通知。
- `"always"`：存在截斷時，每次執行都注入簡短通知（建議）。

詳細的原始／注入計數與設定調整欄位會保留在診斷資訊中，例如
上下文／狀態報告和記錄；一般 WebChat 使用者／執行階段上下文只會
收到簡短的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文預算歸屬對照表

OpenClaw 有多個高容量提示詞／上下文預算，並且刻意依子系統
分開管理，而不是全部透過單一通用
調整項目控制。

| 預算                                                         | 涵蓋範圍                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 一般工作區啟動內容注入                                                                                                                            |
| `agents.defaults.startupContext.*`                             | 單次重設／啟動模型執行前置內容，包括最近幾日的每日 `memory/*.md` 檔案。純聊天 `/new` 和 `/reset` 會在不叫用模型的情況下獲得確認 |
| `skills.limits.*`                                              | 注入系統提示詞的精簡 Skills 清單                                                                                                         |
| `agents.defaults.contextLimits.*`                              | 有界限的執行階段摘錄及注入的執行階段自有區塊                                                                                                      |
| `memory.qmd.limits.*`                                          | 已建立索引的記憶搜尋片段與注入大小設定                                                                                                              |

對應的個別代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設／啟動模型執行的第一個回合注入的啟動前置內容。
純聊天 `/new` 和 `/reset` 命令會在不叫用
模型的情況下確認重設，因此不會載入此前置內容。

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
  中繼資料與接續通知之前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設的 `memory_get` 行數
  範圍。
- `toolResultMaxChars`：用於保存結果
  與溢位復原的進階即時工具結果上限。若要使用依模型上下文自動決定的上限，請保持未設定：
  低於 100K 個權杖時為 `16000` 個字元，達 100K+ 個權杖時為 `32000` 個字元，達 200K+ 個權杖時為 `64000`
  個字元。長上下文模型可接受最高 `1000000` 的明確值，
  但實際上限仍限制為模型上下文視窗的約 30%。
  `openclaw doctor --deep` 會列印實際上限，而 doctor 僅會在明確覆寫已過時或不起作用時發出警告。
- `postCompactionMaxChars`：壓縮後
  重新整理注入期間使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 調整項目的個別代理程式覆寫。省略的欄位會繼承
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

注入系統提示詞之精簡 Skills 清單的全域上限。這
不會影響依需求讀取 `SKILL.md` 檔案。

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

在呼叫供應商之前，逐字稿／工具圖片區塊中圖片最長邊的像素大小上限。
預設值：`1200`。

對於大量使用螢幕擷取畫面的執行，較低的值通常可減少視覺權杖用量與請求承載資料大小。
較高的值可保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

從檔案路徑、URL 和媒體參照載入圖片時，圖片工具的壓縮／細節偏好。
預設值：`auto`。

OpenClaw 會依所選圖片模型調整縮放級距。例如，Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL 和代管的 Llama 4 視覺模型可使用比舊版／預設高細節視覺路徑更大的圖片，而多圖片回合在 `auto` 模式下會更積極地壓縮，以控制權杖和延遲成本。

值：

- `auto`：依模型限制與圖片數量調整。
- `efficient`：偏好較小的圖片，以降低權杖與位元組用量。
- `balanced`：使用標準的折衷級距。
- `high`：為螢幕擷取畫面、圖表和文件圖片保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示詞上下文的時區（不影響訊息時間戳記）。若未設定，則使用主機時區。

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
  - 字串形式僅設定主要模型。
  - 物件形式會設定主要模型及依序排列的容錯移轉模型。
- `utilityModel`：選用的 `provider/model` 參照或別名，用於簡短的內部工作。目前用於產生 Control UI 工作階段標題、Telegram 私訊主題標題、Discord 自動討論串標題，以及[進度草稿旁白](/zh-TW/concepts/progress-drafts#narrated-status)。未設定時，若主要供應商已宣告小型模型預設值，OpenClaw 會採用該值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）；否則，標題工作會回退至代理程式的主要模型，而旁白則維持關閉。設定 `utilityModel: ""` 可完全停用公用工作路由。`agents.list[].utilityModel` 會覆寫預設值（每個代理程式的空值會為該代理程式停用此功能），而作業專用的模型覆寫優先於兩者。公用工作會進行獨立的模型呼叫，並將工作專用內容傳送至所選的模型供應商。儀表板標題產生最多傳送第一則非命令訊息的前 1,000 個字元；旁白會傳送傳入的要求以及精簡且已遮蔽的工具摘要。請選擇符合你的成本與資料處理需求的供應商。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 當作用中的模型無法接受影像時，由 `image` 工具路徑作為其視覺模型設定使用。原生視覺模型則會直接接收已載入的影像位元組。
  - 當所選或預設模型無法接受影像輸入時，也會用於容錯路由。
  - 建議使用明確的 `provider/model` 參照。為了相容性，也接受不含前綴的 ID；若某個不含前綴的 ID 能唯一比對到 `models.providers.*.models` 中已設定且支援影像的項目，OpenClaw 會為其加上該供應商前綴。若有多個已設定的相符項目，則必須明確指定供應商前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用影像產生功能，以及未來任何可產生影像的工具／外掛介面使用。
  - 常見值：原生 Gemini 影像產生使用 `google/gemini-3.1-flash-image-preview`，fal 使用 `fal/fal-ai/flux/dev`，OpenAI Images 使用 `openai/gpt-image-2`，或透明背景的 OpenAI PNG/WebP 輸出使用 `openai/gpt-image-1.5`。
  - 若直接選取供應商／模型，也請設定相符的供應商驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2`／`openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 若省略，`image_generate` 仍可推斷具有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的影像產生供應商。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用音樂產生功能及內建的 `music_generate` 工具使用。
  - 常見值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 若省略，`music_generate` 仍可推斷具有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的音樂產生供應商。
  - 若直接選取供應商／模型，也請設定相符的供應商驗證／API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 供共用影片產生功能及內建的 `video_generate` 工具使用。
  - 常見值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 若省略，`video_generate` 仍可推斷具有驗證支援的供應商預設值。它會先嘗試目前的預設供應商，再依供應商 ID 順序嘗試其餘已註冊的影片產生供應商。
  - 若直接選取供應商／模型，也請設定相符的供應商驗證／API 金鑰。
  - 官方 Qwen 影片產生外掛最多支援 1 部輸出影片、1 張輸入影像、4 部輸入影片、10 秒時長，以及供應商層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 若省略，PDF 工具會先回退至 `imageModel`，再回退至解析後的工作階段／預設模型。
- `pdfMaxBytesMb`：呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具的擷取容錯模式預設考量的頁數上限。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要及進度草稿工具行的詳細資料模式。值：`"explain"`（預設，精簡易讀的標籤）或 `"raw"`（可用時附加原始命令／詳細資料）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。僅當情境為擁有者、獲授權的傳送者或操作員管理員閘道，且未設定每則訊息或工作階段的推理覆寫時，才會套用已設定的推理預設值。
- `elevatedDefault`：代理程式的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設值：`"on"`。
- `model.primary`：格式為 `provider/model`（例如使用 Codex OAuth 存取時為 `openai/gpt-5.6-sol`）。若省略供應商，OpenClaw 會先嘗試別名，再針對該確切模型 ID 尋找唯一的已設定供應商相符項目，最後才回退至已設定的預設供應商（已棄用的相容行為，因此建議使用明確的 `provider/model`）。若該供應商已不再提供已設定的預設模型，OpenClaw 會改為回退至第一個已設定的供應商／模型，而不會顯示已移除供應商的過時預設值。
- `models`：`/model` 的已設定模型目錄與允許清單。每個項目可包含 `alias`（捷徑）和 `params`（供應商專用，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目（例如 `"openai/*": {}` 或 `"vllm/*": {}`），即可顯示所選供應商探索到的所有模型，無須手動列出每個模型 ID。
  - 當該供應商動態探索到的所有模型都應使用相同執行階段時，請將 `agentRuntime` 新增至 `provider/*` 項目。精確的 `provider/model` 執行階段原則仍優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕可能移除現有允許清單項目的取代作業。
  - 限定供應商的設定／初始設定流程會將所選供應商模型合併到此對應表，並保留已設定的其他不相關供應商。
  - 對於直接使用 OpenAI Responses 的模型，會自動啟用伺服器端壓縮。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫臨界值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#advanced-configuration)。
- `params`：套用至所有模型的全域預設供應商參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基礎）會由 `agents.defaults.models["provider/model"].params`（每個模型）覆寫，接著 `agents.list[].params`（相符的代理程式 ID）會依鍵覆寫。詳情請參閱[提示快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：適用於整個 OpenRouter 的預設供應商路由原則。OpenClaw 會將其轉送至 OpenRouter 要求的 `provider` 物件；每個模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和代理程式參數會依鍵覆寫。請參閱 [OpenRouter 供應商路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：合併至 OpenAI 相容 Proxy 的 `api: "openai-completions"` 要求本文中的進階直通 JSON。若與產生的要求鍵衝突，額外本文會優先；非原生 completions 路由之後仍會移除僅適用於 OpenAI 的 `store`。
- `params.chat_template_kwargs`：合併至頂層 `api: "openai-completions"` 要求本文中的 vLLM／OpenAI 相容聊天範本引數。當 `vllm/nemotron-3-*` 關閉思考時，隨附的 vLLM 外掛會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 和 Nemotron 思考模型會提供二元的 `/think` 選項（`off`、`on`），而非多層級的投入程度階梯。
- `compat.thinkingFormat`：OpenAI 相容的思考承載資料樣式。Together 樣式的 `reasoning.enabled` 使用 `"together"`，Qwen 樣式的頂層 `enable_thinking` 使用 `"qwen"`，或是在支援要求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM）上，為 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 會將停用思考對應至 `false`，並將啟用思考對應至 `true`；已設定的 vLLM Qwen 模型會針對這些格式提供二元的 `/think` 選項。
- `compat.supportedReasoningEfforts`：每個模型的 OpenAI 相容推理投入程度清單。對於確實接受 `"xhigh"` 的自訂端點，請將其納入；接著 OpenClaw 會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定供應商／模型的 `llm-task` 驗證中提供 `/think xhigh`。當後端需要針對標準層級使用供應商專用值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留思考選用功能。啟用且思考開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重播先前的 `reasoning_content`；請參閱 [Z.AI 思考與保留思考](/zh-TW/providers/zai#advanced-configuration)。
- `localService`：本機／自行託管模型伺服器的選用供應商層級程序管理員。當所選模型屬於該供應商時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`）；若端點離線，便使用 `args` 啟動 `command`，等待最多 `readyTimeoutMs`，然後傳送模型要求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序持續執行，直到 OpenClaw 結束；正值會在閒置達指定毫秒數後，停止由 OpenClaw 啟動的程序。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段原則應設定於提供者或模型，而不是 `agents.defaults`。提供者層級的規則請使用 `models.providers.<provider>.agentRuntime`，模型專屬規則則使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。僅有提供者／模型前綴絕不會選取執行框架。當未設定執行階段或設為 `auto` 時，只有在完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且請求中沒有明確設定覆寫值的情況下，OpenAI 才可能隱含選取 Codex。請參閱 [OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
- 修改這些欄位的設定寫入工具（例如 `/models set`、`/models set-image`，以及新增／移除備援的命令）會以標準物件形式儲存，並盡可能保留現有的備援清單。
- `maxConcurrent`：跨工作階段的代理程式並行執行數上限（各工作階段內仍會循序執行）。預設值：`4`。

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

- `id`：`"auto"`、`"openclaw"`、已註冊的外掛控管工具 ID，或支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛則提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 允許已註冊的外掛控管工具接管宣告或以其他方式滿足其支援合約的有效路由，且在沒有控管工具相符時使用 OpenClaw。`id: "codex"` 等明確指定的外掛執行階段需要該控管工具及相容的有效路由；若任一項無法使用或執行失敗，便會以封閉方式失敗。
- `id: "pi"` 僅作為 `openclaw` 的已棄用別名接受，以保留 v2026.5.22 及更早版本中已發布的設定。新設定應使用 `openclaw`。
- 執行階段的優先順序依序為精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`）、`agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 中的供應商整體政策。
- 整個代理程式層級的執行階段鍵為舊版項目。執行階段選擇會忽略 `agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選及 `OPENCLAW_AGENT_RUNTIME`。執行 `openclaw doctor --fix` 以移除過時的值。
- 符合資格、使用官方 HTTPS 的精確 OpenAI Responses/ChatGPT 路由，若沒有自行設定的請求覆寫，可能會隱含使用 Codex 控管工具。供應商／模型 `agentRuntime.id: "codex"` 會將 Codex 設為必須以封閉方式失敗的需求，但不會讓不相容的路由變得相容。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/<model>` 參照仍可基於相容性運作，但新設定應維持供應商／模型選擇的標準形式，並將執行後端放在供應商／模型執行階段政策中。
- 這只控制文字代理程式輪次的執行。媒體生成、視覺、PDF、音樂、影片及 TTS 仍使用各自的供應商／模型設定。

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

除非設定 `--thinking off` 或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`，否則 Z.AI GLM-4.x 模型會自動啟用思考模式。
Z.AI 模型預設會啟用 `tool_stream`，以串流傳送工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 即可停用。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設關閉思考；明確啟用調適型思考時，Anthropic 供應商所控制的預設投入程度為 `high`。未明確設定思考層級時，Claude 4.6 模型預設為 `adaptive`。

### `agents.defaults.cliBackends`

用於純文字備援執行的選用命令列介面後端（不呼叫工具）。可在 API 供應商失敗時作為備援。

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

- 命令列介面後端以文字為優先；工具一律停用。
- 設定 `sessionArg` 時支援工作階段。
- 當 `imageArg` 接受檔案路徑時，支援影像直接傳遞。
- `reseedFromRawTranscriptWhenUncompacted: true` 可讓後端在第一份壓縮摘要產生前，從有界限的原始 OpenClaw 對話記錄尾端安全復原已失效的工作階段。認證設定檔或認證資訊世代變更時，仍絕不會使用原始內容重新植入。

### `agents.defaults.promptOverlays`

依模型系列套用於 OpenClaw 組合提示詞介面的供應商無關提示詞覆疊。GPT-5 系列模型 ID 在 OpenClaw／供應商路由間會收到共用的行為合約；`personality` 僅控制友善互動風格層。原生 Codex 應用程式伺服器路由會保留 Codex 所控制的基礎／模型指示，而不使用此 OpenClaw GPT-5 覆疊；OpenClaw 也會對原生討論串停用 Codex 的內建個性。

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

- `"friendly"`（預設）與 `"on"` 會啟用友善互動風格層。
- `"off"` 僅停用友善層；帶標記的 GPT-5 行為合約仍會保持啟用。
- 未設定此共用設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期執行心跳偵測。

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

- `every`：持續時間字串（ms/s/m/h）。預設值：`30m`（API 金鑰驗證）或 `1h`（OAuth 驗證）。設為 `0m` 即可停用。
- `includeSystemPromptSection`：為 false 時，會從系統提示詞中省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入啟動內容。預設值：`true`。
- `suppressToolErrorWarnings`：為 true 時，會在心跳偵測執行期間抑制工具錯誤警告承載資料。
- `timeoutSeconds`：心跳偵測代理程式輪次在中止前允許的最長秒數。若未設定，則在已設定 `agents.defaults.timeoutSeconds` 時使用該值，否則使用心跳偵測週期，且上限為 600 秒。
- `directPolicy`：直接訊息／DM 傳遞政策。`allow`（預設）允許傳遞至直接目標。`block` 會抑制傳遞至直接目標，並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，心跳偵測執行會使用輕量啟動內容，且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次心跳偵測都會在沒有先前對話記錄的新工作階段中執行。隔離模式與排程 `sessionTarget: "isolated"` 相同。每次心跳偵測的 Token 成本會從約 100K 降至約 2-5K Token。
- `skipWhenBusy`：為 true 時，若該代理程式有額外忙碌通道，心跳偵測執行會延後：包括它自身依工作階段鍵區分的子代理程式或巢狀命令工作。即使未設定此旗標，排程通道也一律會延後心跳偵測。
- 各代理程式：設定 `agents.list[].heartbeat`。只要有任何代理程式定義 `heartbeat`，便**只有這些代理程式**會執行心跳偵測。
- 心跳偵測會執行完整的代理程式輪次——間隔越短，消耗的 Token 越多。

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

- `mode`：`default` 或 `safeguard`（針對較長歷程進行分塊摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`：已註冊壓縮提供者外掛的 ID。設定後，會呼叫該提供者的 `summarize()`，而非使用內建的 LLM 摘要。失敗時會退回內建機制。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止單次壓縮作業前所允許的秒數上限。預設值：`180`。
- `reserveTokens`：壓縮後為模型輸出及後續工具結果保留的權杖餘裕。已知模型的上下文視窗時，OpenClaw 會限制有效保留量，使其無法占用提示預算。
- `reserveTokensFloor`：嵌入式執行階段強制保留的最小量。設定 `0` 可停用此下限。此下限仍受作用中上下文視窗上限約束。
- `keepRecentTokens`：代理程式切分點預算，用於逐字保留最近的逐字稿尾端。明確設定時，手動 `/compact` 會遵循此值；否則手動壓縮會作為硬性檢查點。
- `recentTurnsPreserve`：在防護摘要之外逐字保留的最近使用者／助理對話輪數。預設值：`3`。
- `maxHistoryShare`：壓縮後保留歷程可占總上下文預算的最大比例（範圍為 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間，前置加入內建的不透明識別碼保留指引。
- `identifierInstructions`：當 `identifierPolicy=custom` 時使用的選用自訂識別碼保留文字。
- `qualityGuard`：針對防護摘要格式錯誤輸出的重試檢查。在防護模式下預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次呼叫模型前檢查上下文壓力。如果上下文已無法容納，則會在提交提示前中止目前嘗試，並重用現有的預先檢查復原路徑，以截斷工具結果或進行壓縮後重試。適用於 `default` 與 `safeguard` 兩種壓縮模式。預設：停用。
- `postIndexSync`：壓縮後的工作階段記憶重新索引模式。預設值：`"async"`。若要取得最佳即時性，請使用 `"await"`；若要降低壓縮延遲，請使用 `"async"`；只有在其他位置處理工作階段記憶同步時，才使用 `"off"`。
- `postCompactionSections`：壓縮後要重新注入的選用 AGENTS.md H2/H3 區段名稱。未設定或設為 `[]` 時，會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用該組合，並保留舊版 `Every Session`/`Safety` 後援機制。只有在額外上下文值得承擔重複加入壓縮摘要中既有專案指引的風險時，才啟用此功能。
- `model`：僅供壓縮摘要使用的選用 `provider/model-id`，或來自 `agents.defaults.models` 的裸別名。裸別名會在分派前解析；發生衝突時，已設定的字面模型 ID 優先。當主要工作階段應繼續使用某個模型，但壓縮摘要應由另一個模型執行時，請使用此設定；未設定時，壓縮會使用工作階段的主要模型。
- `truncateAfterCompaction`：在壓縮後輪替作用中的工作階段逐字稿，使後續對話輪次只載入摘要與尚未摘要的尾端，而先前的完整逐字稿仍會封存。可避免長時間執行的工作階段中，作用中逐字稿無限制增長。預設值：`false`。
- `maxActiveTranscriptBytes`：選用的位元組閾值（`number` 或 `"20mb"` 之類的字串），當逐字稿歷程超過該閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，才能在成功壓縮後輪替至較小的後繼逐字稿。未設定或設為 `0` 時停用。
- `notifyUser`：當 `true` 時，會向使用者傳送簡短的上下文維護通知：壓縮開始與完成時（例如「正在壓縮上下文……」和「壓縮完成」），以及壓縮前記憶清理已用盡、因此回覆會在降級狀態下繼續時（例如「記憶維護暫時失敗；將繼續你的回覆。」）。預設停用，以保持這些通知靜默。
- `memoryFlush`：自動壓縮前的靜默代理式對話輪次，用於儲存持久記憶。當此維護對話輪次應固定使用本機模型時，請將 `model` 設為確切的提供者／模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承作用中工作階段的後援鏈。即使權杖計數器已過時，`forceFlushTranscriptBytes` 也會在逐字稿大小達到閾值時強制執行清理。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

嵌入式代理程式執行階段的外層執行迴圈重試反覆運算界限，用於防止失敗復原期間發生無限執行迴圈。此設定僅適用於嵌入式代理程式執行階段，不適用於 ACP 或命令列介面執行階段。

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
        runRetries: { max: 50 }, // 選用的個別代理程式覆寫
      },
    ],
  },
}
```

- `base`：外層執行迴圈的基本執行重試反覆運算次數。預設值：`24`。
- `perProfile`：每個後援設定檔候選項額外獲得的執行重試反覆運算次數。預設值：`8`。
- `min`：執行重試反覆運算的最小絕對限制。預設值：`32`。
- `max`：執行重試反覆運算的最大絕對限制，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送至 LLM 前，從記憶體內的上下文中修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷程。預設停用；設定 `mode: "cache-ttl"` 可啟用。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off（預設）| cache-ttl
        ttl: "1h", // 時長（ms/s/m/h），預設單位：分鐘；預設值：5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[已清除舊工具結果內容]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行為">

- `mode: "cache-ttl"` 會啟用修剪處理。
- `ttl` 控制修剪可再次執行的頻率（從上次觸碰快取後起算）。預設值：`5m`。
- 修剪會先軟性截短過大的工具結果，必要時再硬性清除較舊的工具結果。
- `softTrimRatio` 與 `hardClearRatio` 接受從 `0.0` 到 `1.0` 的值；設定驗證會拒絕超出此範圍的值。

**軟性截短**會保留開頭與結尾，並在中間插入 `...`。

**硬性清除**會以預留位置取代整個工具結果。

注意事項：

- 影像區塊永遠不會被截短／清除。
- 比例以字元為基礎（近似值），而非精確的權杖數。
- 如果助理訊息少於 `keepLastAssistants` 則會略過修剪。

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

- 非 Telegram 頻道需要明確設定 `*.streaming.block.enabled: true` 才能啟用區塊回覆。QQ Bot 是例外：它沒有 `streaming.block` 鍵，且除非 `channels.qqbot.streaming.mode` 為 `"off"`，否則會串流區塊回覆。
- 頻道覆寫：`channels.<channel>.streaming.block.coalesce`（以及個別帳號變體）。Discord、Google Chat、Mattermost、MS Teams、Signal 與 Slack 預設為 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：偏好的區塊邊界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：區塊回覆之間的隨機暫停。預設值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未設定的界限都會退回自然範圍）。個別代理程式覆寫：`agents.list[].humanDelay`。

如需行為與分塊詳細資訊，請參閱[串流](/zh-TW/concepts/streaming)。

### 輸入狀態指示器

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

- 預設值：直接聊天／提及時為 `instant`，未提及的群組聊天為 `message`。
- `typingIntervalSeconds` 預設值：`6`。
- 個別工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入狀態指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理程式的選用沙箱隔離。完整指南請參閱[沙箱隔離](/zh-TW/gateway/sandboxing)。

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

上方顯示的預設值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 映像檔／`none` 網路等）是 OpenClaw 的實際預設值，不只是示意值。

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
- `workspaceRoot`：用於各範圍工作區的絕對遠端根目錄（預設：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在執行階段具現化為暫存檔案的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰原則選項（兩者預設皆為 `true`）

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙箱工作階段啟動前，從作用中的密鑰執行環境快照解析

**SSH 後端行為：**

- 在建立或重新建立後，為遠端工作區植入一次初始內容
- 之後將遠端 SSH 工作區維持為標準工作區
- 透過 SSH 路由 `exec`、檔案工具及媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取權限：**

- `none`：位於 `~/.openclaw/sandboxes` 下的各範圍沙箱工作區（預設）
- `ro`：沙箱工作區位於 `/workspace`，代理程式工作區以唯讀方式掛載於 `/agent`
- `rw`：代理程式工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段各自擁有容器與工作區
- `agent`：每個代理程式各自擁有一個容器與工作區（預設）
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

- `mirror`：執行前從本機將初始內容植入遠端，執行後同步回本機；本機工作區維持為標準工作區
- `remote`：建立沙箱時為遠端植入一次初始內容，之後將遠端工作區維持為標準工作區

在 `remote` 模式下，於植入初始內容步驟完成後，在 OpenClaw 外部所做的主機本機編輯不會自動同步至沙箱。
傳輸方式是透過 SSH 連入 OpenShell 沙箱，但沙箱生命週期與選用的鏡像同步由此外掛負責。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路對外連線、可寫入的根目錄及 root 使用者。

**容器預設為 `network: "none"`** — 如果代理程式需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會遭封鎖。除非明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急解鎖），否則 `"container:<id>"` 預設也會遭封鎖。
作用中 OpenClaw 沙箱內的 Codex app-server 回合會將相同的對外連線設定用於其原生程式碼模式網路存取。

**傳入附件**會暫存至作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載其他主機目錄；全域與各代理程式的繫結會合併。

**沙箱化瀏覽器**（`sandbox.browser.enabled`，預設為 `false`）：在容器中執行 Chromium + CDP。noVNC URL 會注入系統提示詞。不需要在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，且 OpenClaw 會產生短效權杖 URL（而不是在共用 URL 中暴露密碼）。

- `allowHostControl: false`（預設）會阻止沙箱化工作階段將主機瀏覽器設為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在明確需要全域橋接連線時，才設為 `bridge`。此處也會封鎖 `"host"`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 傳入流量限制在某個 CIDR 範圍內（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 僅會將其他主機目錄掛載至沙箱瀏覽器容器。設定此項時（包括 `[]`），瀏覽器容器會以其取代 `docker.binds`。
- 沙箱瀏覽器容器中的 Chromium 一律使用 `--no-sandbox --disable-setuid-sandbox` 啟動（容器不具備 Chrome 自身沙箱所需的核心基礎功能）；此行為沒有設定開關。
- 啟動預設值定義於 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機調整：
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
  - `--disable-3d-apis`、`--disable-gpu` 及 `--disable-software-rasterizer`
    預設啟用；若 WebGL/3D 使用需求有需要，可使用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - `--disable-extensions`（預設啟用）；如果你的工作流程依賴擴充功能，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 會重新啟用擴充功能。
  - 預設為 `--renderer-process-limit=2`；可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更，設為 `0` 可使用 Chromium 的
    預設程序限制。
  - 僅在啟用 `headless` 時使用 `--headless=new`。
  - 這些預設值是容器映像檔的基準；若要變更容器預設值，請使用具有自訂
    進入點的自訂瀏覽器映像檔。

</Accordion>

瀏覽器沙箱化與 `sandbox.docker.binds` 僅支援 Docker。

建置映像檔（從原始碼簽出）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若要在沒有原始碼簽出的情況下進行 npm 安裝，請參閱[沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，以取得內嵌的 `docker build` 命令。

### `agents.list`（各代理程式覆寫）

使用 `agents.list[].tts` 可為代理程式指定自己的 TTS 提供者、語音、模型、
風格或自動 TTS 模式。代理程式區塊會深度合併至全域
`messages.tts` 之上，因此共用認證資訊可以集中存放，而個別
代理程式只需覆寫所需的語音或提供者欄位。作用中代理程式的
覆寫會套用至自動語音回覆、`/tts audio`、`/tts status` 及
`tts` 代理程式工具。如需提供者範例與優先順序，請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "主要代理程式",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // 每個代理程式的思考層級覆寫
        reasoningDefault: "on", // 每個代理程式的推理可見性覆寫
        fastModeDefault: false, // 每個代理程式的快速模式覆寫
        params: { cacheRetention: "none" }, // 依鍵覆寫相符的 defaults.models 參數
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 設定後會取代 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "樂於助人的樹懶",
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
- `default`：設定多個時，以第一個為準（會記錄警告）。若皆未設定，清單中的第一個項目即為預設值。
- `model`：字串形式會設定嚴格的每代理程式主要模型，且不使用模型後援；除非加入 `fallbacks`，否則物件形式 `{ primary }` 也同樣嚴格。使用 `{ primary, fallbacks: [...] }` 讓該代理程式選擇使用後援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。僅覆寫 `primary` 的排程工作仍會繼承預設後援，除非設定 `fallbacks: []`。
- `utilityModel`：選用的每代理程式覆寫，用於產生工作階段與對話串標題等簡短內部工作。依序後援至 `agents.defaults.utilityModel`、主要供應商宣告的小型模型預設值，最後是此代理程式的主要模型。空字串會停用此代理程式的公用模型路由。
- `params`：每代理程式的串流參數，會合併並覆蓋 `agents.defaults.models` 中選取的模型項目。可使用此設定進行 `cacheRetention`、`temperature` 或 `maxTokens` 等代理程式特定覆寫，而不必複製整個模型目錄。
- `tts`：選用的每代理程式文字轉語音覆寫。此區塊會深度合併並覆蓋 `messages.tts`，因此請將共用的供應商認證資訊與後援原則保留在 `messages.tts`，並僅在此設定角色特定的值，例如供應商、語音、模型、樣式或自動模式。
- `skills`：選用的每代理程式 Skill 允許清單。若省略，代理程式會在已設定時繼承 `agents.defaults.skills`；明確指定的清單會取代預設值而非與其合併，而 `[]` 表示不使用任何 Skill。
- `thinkingDefault`：選用的每代理程式預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每訊息或工作階段覆寫時，會針對此代理程式覆寫 `agents.defaults.thinkingDefault`。選取的供應商／模型設定檔決定哪些值有效；對 Google Gemini 而言，`adaptive` 會保留由供應商管理的動態思考（Gemini 3/3.1 會省略 `thinkingLevel`，Gemini 2.5 則使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理程式預設推理可見性（`on | off | stream`）。當未設定每訊息或工作階段推理覆寫時，會針對此代理程式覆寫 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理程式快速模式預設值（`"auto" | true | false`）。當未設定每訊息或工作階段快速模式覆寫時套用。
- `models`：選用的每代理程式模型目錄／執行階段覆寫，以完整的 `provider/model` ID 作為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理程式的執行階段例外。
- `runtime`：選用的每代理程式執行階段描述元。當代理程式預設應使用 ACP 控制框架工作階段時，請搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）使用 `type: "acp"`。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案上限為 2 MB。`http(s)` URL 與 `data:` URI 不受本機檔案大小限制檢查。
- `identity` 會衍生預設值：`ackReaction` 衍生自 `emoji`，`mentionPatterns` 衍生自 `name`/`emoji`。
- `subagents.allowAgents`：已設定代理程式 ID 的允許清單，用於明確的 `sessions_spawn.agentId` 目標（`["*"]` = 任何已設定的目標；預設：僅相同代理程式）。若應允許以自身為目標的 `agentId` 呼叫，請包含要求者 ID。若代理程式設定已遭刪除，其過時項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；請執行 `openclaw doctor --fix` 清除這些項目，或者如果該目標應在繼承預設值的同時仍可被產生，請新增最小的 `agents.list[]` 項目。
- 沙箱繼承防護：若要求者工作階段位於沙箱中，`sessions_spawn` 會拒絕將在沙箱外執行的目標。
- `subagents.requireAgentId`：設為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設：false）。
- `subagents.maxConcurrent`：跨子代理程式執行的並行子代理程式執行數上限。預設：`8`。
- `subagents.maxChildrenPerAgent`：單一代理程式工作階段可產生的作用中子項目上限。預設：`5`。
- `subagents.maxSpawnDepth`：產生子代理程式的巢狀深度上限（`1`-`5`）。預設：`1`（不允許巢狀）。
- `subagents.archiveAfterMinutes`：已完成的子代理程式狀態在封存前保留的時間。預設：`60`。

---

## 多代理程式路由

在單一閘道內執行多個隔離的代理程式。請參閱[多代理程式](/zh-TW/concepts/multi-agent)。

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

- `type`（選用）：`route` 用於一般路由（缺少類型時預設為路由），`acp` 用於持續性的 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任何帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；頻道特定）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（完全相符，不含對等端／伺服器／團隊）
5. `match.accountId: "*"`（整個頻道）
6. 預設代理程式

在每一層級中，第一個相符的 `bindings` 項目優先。

對於 `type: "acp"` 項目，OpenClaw 會依完全相符的對話身分（`match.channel` + 帳號 + `match.peer.id`）解析，且不使用上述路由繫結層級順序。

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

<Accordion title="無檔案系統存取權（僅限傳訊）">

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

優先順序的詳細資訊請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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
      mode: "enforce", // enforce（預設）| warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // 持續時間或 false
      maxDiskBytes: "500mb", // 選用的硬性預算
      highWaterBytes: "400mb", // 選用的清理目標
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 預設閒置自動取消聚焦時間，以小時計（`0` 表示停用）
      maxAgeHours: 0, // 預設硬性存留時間上限，以小時計（`0` 表示停用）
    },
    mainKey: "main", // 舊版設定（執行階段一律使用 "main"）
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
  - `per-sender`（預設）：每位傳送者在頻道情境中各自取得隔離的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在有意共用情境時使用）。
- **`dmScope`**：私訊的分組方式。
  - `main`：所有私訊共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 ID 隔離。
  - `per-channel-peer`：依頻道與傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號、頻道與傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應至帶有供應商前置字串的對等端，以便跨頻道共用工作階段。`/dock_discord` 等停駐命令使用相同的對應，將作用中工作階段的回覆路由切換至另一個已連結的頻道對等端；請參閱[頻道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設原則。`daily` 會在當地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。兩者皆設定時，以最先到期者為準。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、執行通知及閘道簿記等背景／系統事件寫入可能更新 `updatedAt`，但不會讓每日／閒置工作階段保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`resetByChannel`**：以供應商／頻道 ID 為鍵的各頻道重設覆寫。工作階段的頻道若有相符項目，該項目會完全優先於該工作階段的 `resetByType`/`reset`。僅在某個頻道需要與類型層級原則不同的重設行為時使用。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天分組。
- **`agentToAgent.maxPingPongTurns`**：代理程式之間交換訊息時，代理程式間來回回覆的最大輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用來回串接。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，舊版別名為 `dm`）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：工作階段儲存區的清理與保留控制。
  - `mode`：`enforce` 會執行清理且為預設值；`warn` 僅發出警告。
  - `pruneAfter`：過時項目的存留時間截止值（預設為 `30d`）。
  - `maxEntries`：SQLite 工作階段項目的數量上限（預設為 `500`）。對於生產環境規模的上限，執行階段寫入會使用少量高水位緩衝區進行批次清理；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短期閘道模型執行探測工作階段採用固定的 `24h` 保留期限，但清理受壓力條件限制：僅在工作階段項目維護／上限壓力達到門檻時，才移除過時且符合嚴格條件的模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的明確嚴格探測鍵符合資格；一般直接、群組、討論串、排程、鉤子、心跳偵測、ACP 及子代理程式工作階段不會繼承此 24 小時保留期限。模型執行清理開始時，會先於範圍較廣的 `pruneAfter` 過時項目清理及 `maxEntries` 上限執行。
  - 目前的結構描述會拒絕舊版 `rotateBytes`；`openclaw doctor --fix` 會將其從舊版設定中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 對話記錄封存的保留期限。預設為 `pruneAfter`；設定為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式下會記錄警告；在 `enforce` 模式下會優先移除最舊的成品／工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：工作階段對話記錄寫入鎖定控制。僅在合法的對話記錄準備、清理、壓縮或鏡像工作所造成的競爭時間超過預設原則時調整。
  - `acquireTimeoutMs`：取得鎖定時，在將工作階段回報為忙碌前等待的毫秒數。預設值：`60000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：既有鎖定被視為過時並回收前的毫秒數。預設值：`1800000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：程序內已持有的鎖定可維持多久，超過此毫秒數後監控程式會將其釋放。預設值：`300000`；環境變數覆寫：`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：繫結討論串的工作階段功能全域預設值。
  - `enabled`：主要預設開關（供應商可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：依非活動狀態自動取消聚焦的預設時數（`0` 會停用；供應商可覆寫）
  - `maxAgeHours`：預設絕對存留時間上限，以小時為單位（`0` 會停用；供應商可覆寫）
  - `spawnSessions`：透過 `sessions_spawn` 和 ACP 討論串衍生來建立繫結討論串工作階段的預設閘門。啟用討論串繫結時，預設為 `true`；供應商／帳號可覆寫。
  - `defaultSpawnContext`：繫結討論串衍生作業的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

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

### 回應前置字串

各頻道／帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析順序（最具體者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止級聯。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明                   | 範例                        |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | 簡短模型名稱           | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼         | `anthropic/claude-opus-4-6` |
| `{provider}`      | 供應商名稱             | `anthropic`                 |
| `{thinkingLevel}` | 目前的思考層級         | `high`、`low`、`off`        |
| `{identity.name}` | 代理程式身分名稱       | （與 `"auto"` 相同）          |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認反應

- 預設為作用中代理程式的 `identity.emoji`，否則使用 `"👀"`。設定為 `""` 可停用。
- 各頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分備援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`，或 `off`/`none`（完全停用確認反應）。
- `removeAckAfterReply`：在 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage 等支援反應的頻道中，於回覆後移除確認反應。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上啟用生命週期狀態反應。
  在 Discord 上，若未設定，當確認反應啟用時仍會啟用狀態反應。
  在 Slack、Signal、Telegram 和 WhatsApp 上，請明確將其設定為 `true`，以啟用生命週期狀態反應。
  Slack 預設使用其原生助理討論串狀態及輪替的載入訊息來顯示進度，同時保持已設定的確認反應不變。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 僅允許固定的反應集合，因此不支援的已設定表情符號會回退
  至該聊天最接近且受支援的狀態變體。

### 佇列

- `mode`：工作階段執行期間收到輸入訊息時採用的佇列策略。預設值：`"steer"`。
  - `steer`：將新提示注入作用中的執行。
  - `followup`：在作用中的執行完成後執行新提示。
  - `collect`：將相容的訊息批次處理，稍後一併執行。
  - `interrupt`：在開始最新提示前中止作用中的執行。
- `debounceMs`：分派已排入佇列／轉向訊息前的延遲。預設值：`500`。
- `cap`：套用捨棄原則前，佇列訊息的數量上限。預設值：`20`。
- `drop`：超過上限時採用的策略。`"summarize"`（預設）會捨棄最舊的項目，但保留精簡摘要；`"old"` 會捨棄最舊的項目且不保留摘要；`"new"` 會拒絕最新項目。
- `byChannel`：以供應商 ID 為鍵的各頻道 `mode` 覆寫。
- `debounceMsByChannel`：以供應商 ID 為鍵的各頻道 `debounceMs` 覆寫。

### 輸入防彈跳

將同一傳送者快速傳送的純文字訊息批次合併為單次代理程式回合。媒體／附件會立即送出。控制命令會略過防彈跳。預設 `debounceMs`：`2000`。

### 其他訊息鍵

- `messages.messagePrefix`：在輸入使用者訊息抵達代理程式執行階段前附加於其開頭的文字。請僅在必要時用於頻道情境標記。
- `messages.visibleReplies`：控制直接、群組及頻道對話中可見的來源回覆（`"message_tool"` 需要 `message(action=send)` 才會產生可見輸出；`"automatic"` 會如先前一樣張貼一般回覆）。
- `messages.usageTemplate` / `messages.responseUsage`：自訂 `/usage` 頁尾範本及預設的每次回覆使用模式（`off | tokens | full`，另有 `on` 作為 `tokens` 的舊版別名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群組訊息提及觸發條件及歷程記錄視窗大小。
- `messages.suppressToolErrors`：設為 `true` 時，抑制向使用者顯示的 `⚠️` 工具錯誤警告（代理程式仍可在情境中看到錯誤並重試）。預設值：`false`。

### TTS（文字轉語音）

```json5
{
  messages: {
    tts: {
      auto: "off", // 關閉（預設）| 一律 | 傳入時 | 已標記
      mode: "final", // 最終 | 全部
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

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆寫本機偏好設定，而 `/tts status` 會顯示實際生效的狀態。
- `summaryModel` 會覆寫自動摘要所使用的 `agents.defaults.model.primary`。
- `modelOverrides` 預設啟用（`enabled !== false`）；`modelOverrides.allowProvider` 則須選擇啟用。
- API 金鑰會依序退回使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 隨附的語音提供者由外掛擁有。如果已設定 `plugins.allow`，請納入你要使用的每個 TTS 提供者外掛，例如用於 Edge TTS 的 `microsoft`。舊版提供者 ID `edge` 會作為 `microsoft` 的別名接受。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，最後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為與 OpenAI 相容的 TTS 伺服器，並放寬模型與語音驗證。

---

## 對話

對話模式的預設值（macOS/iOS/Android 和瀏覽器控制介面）。

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
      instructions: "以親切的語氣說話，並保持回答簡短。",
      mode: "realtime", // 即時 | 語音轉文字再轉語音 | 轉錄
      transport: "webrtc", // webrtc | 提供者 WebSocket | 閘道轉送 | 受管理的房間
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // 代理程式諮詢 | 直接工具 | 無
    },
  },
}
```

- 設定多個對話提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版的扁平對話鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。請執行 `openclaw doctor --fix`，將持久化設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會退回使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS 對話用戶端行為）。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 的退回機制僅在未設定對話 API 金鑰時適用。
- `providers.*.voiceAliases` 讓對話指令可以使用易懂的名稱。
- `providers.mlx.modelId` 選取 macOS 本機 MLX 輔助程式所使用的 Hugging Face 儲存庫。如果省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- 如果隨附的 `openclaw-mlx-tts` 輔助程式存在，macOS MLX 播放會透過它執行，否則使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發環境中的輔助程式路徑。
- `consultThinkingLevel` 控制在控制介面對話即時 `openclaw_agent_consult` 呼叫背後，完整 OpenClaw 代理程式執行所使用的思考層級。保留未設定即可維持一般工作階段／模型行為。
- `consultFastMode` 會為控制介面對話即時諮詢設定單次快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS 對話語音辨識所使用的 BCP 47 地區設定 ID。保留未設定即可使用裝置預設值。
- `silenceTimeoutMs` 控制對話模式在使用者停止說話後，等待多久才傳送轉錄文字。未設定時會保留平台的預設暫停時間範圍（`700 ms on macOS and Android, 900 ms on iOS`）。
- `realtime.instructions` 會將面向提供者的系統指示附加至 OpenClaw 的內建即時提示詞，因此可設定語音風格，而不會失去預設的 `openclaw_agent_consult` 指引。
- `realtime.vadThreshold` 設定提供者的語音活動閾值，範圍從 `0`（最敏感）到 `1`（最不敏感）。未設定時保留提供者預設值。
- `realtime.silenceDurationMs` 設定提供者提交即時使用者回合前的正整數靜音時間範圍。未設定時保留提供者預設值。
- `realtime.prefixPaddingMs` 設定偵測到語音開始前所保留的非負整數音訊量。未設定時保留提供者預設值。
- `realtime.reasoningEffort` 設定即時工作階段的提供者專屬推理層級。未設定時保留提供者預設值。
- `realtime.consultRouting`：當即時提供者產生不含 `openclaw_agent_consult` 的最終使用者轉錄文字時，`"provider-direct"`（預設）會保留提供者的直接回覆。`"force-agent-consult"` 則改為透過 OpenClaw 路由已定案的要求。

---

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

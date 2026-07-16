---
read_when:
    - 調整代理程式預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與對話設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-16T11:33:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 與 `talk.*` 下的代理程式範圍設定鍵。關於頻道、工具、閘道執行階段及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：設定 `OPENCLAW_WORKSPACE_DIR` 時使用該值，否則為 `~/.openclaw/workspace`（若 `OPENCLAW_PROFILE` 設為非預設設定檔，則為 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。若不想將該路徑寫入設定，請使用此環境變數，讓預設代理程式
指向已掛載的工作區。

### `agents.defaults.repoRoot`

顯示於系統提示詞「Runtime」行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區開始向上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

供未設定
`agents.list[].skills` 的代理程式使用的選用預設 Skills 允許清單。

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

- 若預設不限制 Skills，請省略 `agents.defaults.skills`。
- 若要繼承預設值，請省略 `agents.list[].skills`。
- 若不使用任何 Skills，請將 `agents.list[].skills: []` 設為空清單。
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

略過建立指定的選用工作區檔案，同時仍會寫入必要的啟動檔案（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 與 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的接續輪次（完成助理回應後）會略過重新注入工作區啟動內容，以縮減提示詞大小。心跳偵測執行與壓縮後重試仍會重建上下文。
- `"never"`：在每一輪停用工作區啟動內容與上下文檔案注入。僅適用於完全自行管理提示詞生命週期的代理程式（自訂上下文引擎、自行建構上下文的原生執行階段，或不使用啟動內容的特殊工作流程）。心跳偵測與壓縮復原輪次也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

每個代理程式的覆寫值：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前允許的字元數上限。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

每個代理程式的覆寫值：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案合計注入的字元數上限。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

每個代理程式的覆寫值：`agents.list[].bootstrapTotalMaxChars`。省略的值會
繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 每個代理程式的啟動設定檔覆寫值

當某個代理程式需要不同於共用預設值的提示詞
注入行為時，請使用每個代理程式的啟動設定檔覆寫值。省略的欄位會繼承
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
- `"once"`：每個不重複的截斷簽章僅注入一次簡短通知。
- `"always"`：存在截斷時，每次執行皆注入簡短通知（建議）。

詳細的原始／注入計數與設定調整欄位會保留在上下文／狀態報告及日誌等
診斷資訊中；一般 WebChat 使用者／執行階段上下文只會收到簡短的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // 關閉 | 一次 | 每次
}
```

### 上下文預算權責對照表

OpenClaw 有多項高容量提示詞／上下文預算，這些預算會
依子系統刻意分開管理，而非全數透過單一通用
調整項目控制。

| 預算                                                         | 涵蓋範圍                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 一般工作區啟動內容注入                                                                                                                            |
| `agents.defaults.startupContext.*`                             | 一次性的重設／啟動模型執行前置內容，包括最近每日的 `memory/*.md` 檔案。純聊天 `/new` 與 `/reset` 會在不叫用模型的情況下得到確認 |
| `skills.limits.*`                                              | 注入系統提示詞的精簡 Skills 清單                                                                                                         |
| `agents.defaults.contextLimits.*`                              | 有界限的執行階段摘錄及注入的執行階段自有區塊                                                                                                      |
| `memory.qmd.limits.*`                                          | 已建立索引的記憶搜尋片段與注入大小                                                                                                              |

對應的每個代理程式覆寫值：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設／啟動模型執行時，於第一輪注入的啟動前置內容。
純聊天 `/new` 與 `/reset` 命令會在不叫用
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
  中繼資料與接續通知前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設的 `memory_get` 行數範圍。
- `toolResultMaxChars`：進階的即時工具結果上限，用於持久保存的
  結果與溢位復原。若要使用模型上下文自動上限，請保持未設定：
  低於 100K 個權杖時為 `16000` 個字元、達 100K 以上個權杖時為 `32000` 個字元，而達 200K 以上個權杖時為 `64000`
  個字元。長上下文模型可接受最高 `1000000` 的明確值，
  但有效上限仍限制為模型上下文視窗的約 30%。`openclaw doctor --deep` 會顯示有效上限，
  而 doctor 僅會在明確覆寫值過時或沒有作用時提出警告。
- `postCompactionMaxChars`：壓縮後重新整理注入時使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 調整項目的每個代理程式覆寫值。省略的欄位會繼承
`agents.defaults.contextLimits`。

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

Skills 提示詞預算的每個代理程式覆寫值。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

呼叫供應商前，逐字稿／工具影像區塊中最長影像邊長的像素上限。
預設值：`1200`。

較低的值通常可減少大量使用螢幕截圖之執行作業的視覺權杖用量與要求承載資料大小。
較高的值則會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

針對從檔案路徑、URL 與媒體參照載入之影像的影像工具壓縮／細節偏好設定。
預設值：`auto`。

OpenClaw 會依選取的影像模型調整縮放級距。例如，Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL 與託管的 Llama 4 視覺模型可使用比舊版／預設高細節視覺路徑更大的影像；而在 `auto` 模式下，多影像輪次會進行更積極的壓縮，以控制權杖與延遲成本。

值：

- `auto`：依模型限制與影像數量調整。
- `efficient`：偏好較小的影像，以降低權杖與位元組用量。
- `balanced`：使用標準的折衷級距。
- `high`：為螢幕截圖、圖表與文件影像保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示詞上下文的時區（非訊息時間戳記）。若未設定，則使用主機時區。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系統提示詞中的時間格式。預設值：`auto`（作業系統偏好設定）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // 自動 | 12 | 24
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
  - 物件形式設定主要模型及依序排列的容錯移轉模型。
- `utilityModel`：選用的 `provider/model` 參照或別名，用於短期內部工作。目前用於產生 Control UI 工作階段標題、Telegram 私訊主題標題、Discord 自動討論串標題，以及[進度草稿旁白](/zh-TW/concepts/progress-drafts#narrated-status)。未設定時，若主要提供者有宣告小型模型預設值，OpenClaw 會採用該值（OpenAI → `gpt-5.6-luna`、Anthropic → `claude-haiku-4-5`）；否則，標題工作會回退至代理程式的主要模型，而旁白會維持關閉。設定 `utilityModel: ""` 可完全停用公用工作路由。`agents.list[].utilityModel` 會覆寫預設值（每個代理程式的空值會為該代理程式停用此功能），而特定操作的模型覆寫優先於兩者。公用工作會進行個別的模型呼叫，並將工作特定內容傳送給所選的模型提供者。產生儀表板標題時，最多傳送第一則非命令訊息的前 1,000 個字元；旁白則傳送傳入要求及經過遮蔽的精簡工具摘要。請選擇符合你的成本與資料處理需求的提供者。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 當作用中模型無法接受圖片時，由 `image` 工具路徑用作其視覺模型設定。原生視覺模型則會直接接收已載入的圖片位元組。
  - 當所選或預設模型無法接受圖片輸入時，也會用於容錯路由。
  - 請優先使用明確的 `provider/model` 參照。為相容性起見，也接受不含前綴的 ID；若某個不含前綴的 ID 唯一符合 `models.providers.*.models` 中已設定且支援圖片的項目，OpenClaw 會為其補上該提供者。若符合多個已設定項目，則必須明確指定提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用圖片生成功能，以及任何未來可產生圖片的工具／外掛介面使用。
  - 常見值：原生 Gemini 圖片生成使用 `google/gemini-3.1-flash-image-preview`、fal 使用 `fal/fal-ai/flux/dev`、OpenAI Images 使用 `openai/gpt-image-2`，或透明背景的 OpenAI PNG/WebP 輸出使用 `openai/gpt-image-1.5`。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2`／`openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 若省略，`image_generate` 仍可推斷具有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的圖片生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用音樂生成功能及內建的 `music_generate` 工具使用。
  - 常見值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 若省略，`music_generate` 仍可推斷具有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用影片生成功能及內建的 `video_generate` 工具使用。
  - 常見值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 若省略，`video_generate` 仍可推斷具有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，再依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。
  - 若直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
  - 官方 Qwen 影片生成外掛最多支援 1 部輸出影片、1 張輸入圖片、4 部輸入影片、10 秒長度，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 若省略，PDF 工具會先回退至 `imageModel`，再回退至解析後的工作階段／預設模型。
- `pdfMaxBytesMb`：呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在擷取容錯模式下考慮的預設頁數上限。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要與進度草稿工具行的詳細資訊模式。值：`"explain"`（預設，精簡且易讀的標籤）或 `"raw"`（可用時附加原始命令／詳細資訊）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。若未設定每則訊息或工作階段的推理覆寫，已設定的推理預設值只會套用於擁有者、獲授權的傳送者，或操作員管理員閘道情境。
- `elevatedDefault`：代理程式的預設提高權限輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設值：`"on"`。
- `model.primary`：格式為 `provider/model`（例如用於 Codex OAuth 存取的 `openai/gpt-5.6-sol`）。若省略提供者，OpenClaw 會先嘗試別名，再尋找與該確切模型 ID 唯一相符的已設定提供者，最後才回退至已設定的預設提供者（這是已棄用的相容性行為，因此請優先使用明確的 `provider/model`）。若該提供者已不再提供已設定的預設模型，OpenClaw 會回退至第一個已設定的提供者／模型，而不會顯示已移除提供者所留下的過時預設值。
- `models`：`/model` 的已設定模型目錄與允許清單。每個項目可包含 `alias`（捷徑）及 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目（例如 `"openai/*": {}` 或 `"vllm/*": {}`），即可顯示所選提供者的所有已探索模型，無須手動列出每個模型 ID。
  - 若該提供者所有動態探索到的模型都應使用相同執行階段，請將 `agentRuntime` 加入 `provider/*` 項目。明確的 `provider/model` 執行階段原則仍優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕移除現有允許清單項目的替換操作。
  - 限定提供者範圍的設定／新手設定流程，會將所選提供者模型合併至此對應表，並保留已設定的其他無關提供者。
  - 對於直接使用 OpenAI Responses 的模型，會自動啟用伺服器端壓縮。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫臨界值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#advanced-configuration)。
- `params`：套用至所有模型的全域預設提供者參數。於 `agents.defaults.params` 設定（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基礎）會由 `agents.defaults.models["provider/model"].params`（每個模型）覆寫，接著 `agents.list[].params`（相符的代理程式 ID）會依鍵覆寫。詳情請參閱[提示詞快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 全域預設提供者路由原則。OpenClaw 會將此值轉送至 OpenRouter 要求的 `provider` 物件；每個模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 與代理程式參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：合併至 OpenAI 相容 Proxy 的 `api: "openai-completions"` 要求本文中的進階直接傳遞 JSON。若與產生的要求鍵衝突，額外本文會優先；非原生 completions 路由之後仍會移除 OpenAI 專用的 `store`。
- `params.chat_template_kwargs`：合併至頂層 `api: "openai-completions"` 要求本文的 vLLM/OpenAI 相容聊天範本引數。對於關閉思考的 `vllm/nemotron-3-*`，隨附的 vLLM 外掛會自動傳送 `enable_thinking: false` 與 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 與 Nemotron 思考模型會提供二元 `/think` 選項（`off`、`on`），而非多層級的強度階梯。
- `compat.thinkingFormat`：OpenAI 相容的思考承載內容樣式。Together 樣式的 `reasoning.enabled` 請使用 `"together"`，Qwen 樣式的頂層 `enable_thinking` 請使用 `"qwen"`，而對於支援要求層級聊天範本關鍵字引數的 Qwen 系列後端（例如 vLLM），`chat_template_kwargs.enable_thinking` 請使用 `"qwen-chat-template"`。OpenClaw 會將停用思考對應至 `false`，將啟用思考對應至 `true`；已設定的 vLLM Qwen 模型會針對這些格式提供二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：每個模型的 OpenAI 相容推理強度清單。對於確實接受 `"xhigh"` 的自訂端點，請將其納入；之後 OpenClaw 便會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定提供者／模型的 `llm-task` 驗證中提供 `/think xhigh`。當後端需要以提供者特定值表示標準層級時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留思考選用設定。啟用且思考開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重播先前的 `reasoning_content`；請參閱 [Z.AI 思考與保留思考](/zh-TW/providers/zai#advanced-configuration)。
- `localService`：適用於本機／自行託管模型伺服器的選用提供者層級程序管理員。當所選模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`）；若端點無法使用，則以 `args` 啟動 `command`，等待最多 `readyTimeoutMs`，接著傳送模型要求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序持續執行，直到 OpenClaw 結束；正值會在閒置達指定毫秒數後，停止由 OpenClaw 啟動的程序。請參閱[本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策應設定於提供者或模型，而非 `agents.defaults`。提供者通用規則請使用 `models.providers.<provider>.agentRuntime`，模型專屬規則請使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。僅有提供者／模型前綴絕不會選取執行框架。當未設定執行階段或設為 `auto` 時，OpenAI 只有在路由完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses，且沒有自行設定的請求覆寫時，才可能隱含選取 Codex。請參閱 [OpenAI 隱含代理執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。
- 變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image` 以及新增／移除備援的命令）會以標準物件格式儲存，並在可能的情況下保留現有的備援清單。
- `maxConcurrent`：跨工作階段同時執行的代理數量上限（每個工作階段內仍會依序執行）。預設值：`4`。

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

- `id`：`"auto"`、`"openclaw"`、已註冊的外掛承載器 ID，或支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛則提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 允許已註冊的外掛承載器接管宣告或以其他方式滿足其支援合約的有效路由，且沒有承載器相符時會使用 OpenClaw。明確指定的外掛執行階段（例如 `id: "codex"`）會要求該承載器與相容的有效路由；若其中任一項無法使用，或執行失敗，便會以封閉方式失敗。
- `id: "pi"` 僅作為 `openclaw` 的已棄用別名接受，以保留 v2026.5.22 及更早版本已發布的設定。新設定應使用 `openclaw`。
- 執行階段的優先順序依序為精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`）、`agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 的提供者整體政策。
- 全代理程式執行階段鍵屬於舊版。執行階段選擇會忽略 `agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段固定項目及 `OPENCLAW_AGENT_RUNTIME`。請執行 `openclaw doctor --fix` 以移除過時值。
- 符合資格且未撰寫要求覆寫的官方精確 HTTPS OpenAI Responses/ChatGPT 路由，可能會隱含使用 Codex 承載器。提供者／模型 `agentRuntime.id: "codex"` 會使 Codex 成為封閉式失敗的必要條件，但不會使不相容的路由變得相容。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/<model>` 參照仍可基於相容性運作，但新設定應維持提供者／模型選擇的標準形式，並將執行後端放在提供者／模型執行階段政策中。
- 這只會控制文字代理程式回合的執行。媒體產生、視覺、PDF、音樂、影片及 TTS 仍會使用各自的提供者／模型設定。

**內建別名縮寫**（僅在模型位於 `agents.defaults.models` 時套用）：

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
Z.AI 模型預設會啟用 `tool_stream`，以串流傳輸工具呼叫。若要停用，請將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false`。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設關閉思考；明確啟用自適應思考時，Anthropic 提供者所擁有的預設投入程度為 `high`。未設定明確思考層級時，Claude 4.6 模型預設為 `adaptive`。

### `agents.defaults.cliBackends`

用於僅文字備援執行的選用命令列介面後端（不呼叫工具）。適合在 API 提供者失敗時作為備援。

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
          // 或者，當命令列介面接受提示檔案旗標時，使用 systemPromptFileArg。
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
- 當 `imageArg` 接受檔案路徑時，支援影像直接傳遞。
- `reseedFromRawTranscriptWhenUncompacted: true` 可讓後端在第一份壓縮摘要存在之前，從有限範圍的原始 OpenClaw 文字記錄尾端，安全地復原已失效的工作階段。認證設定檔或認證資訊時期變更時，仍絕不會使用原始內容重新植入。

### `agents.defaults.promptOverlays`

依模型系列套用至 OpenClaw 組裝提示介面的提供者無關提示覆疊。GPT-5 系列模型 ID 會在 OpenClaw／提供者路由間接收共用行為合約；`personality` 僅控制友善互動風格層。原生 Codex 應用程式伺服器路由會保留 Codex 自有的基礎／模型指示，而不使用此 OpenClaw GPT-5 覆疊；OpenClaw 也會針對原生對話串停用 Codex 的內建個性。

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
- `"off"` 只會停用友善層；已標記的 GPT-5 行為合約仍會保持啟用。
- 未設定此共用設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期執行心跳偵測。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 會停用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 預設：true；false 會從系統提示中省略心跳偵測區段
        lightContext: false, // 預設：false；true 只會保留工作區啟動檔案中的 HEARTBEAT.md
        isolatedSession: false, // 預設：false；true 會在全新工作階段中執行每次心跳偵測（沒有對話記錄）
        skipWhenBusy: false, // 預設：false；true 也會等待此代理程式的子代理程式／巢狀通道
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（預設）| block
        target: "none", // 預設：none | 選項：last | whatsapp | telegram | discord | ...
        prompt: "若 HEARTBEAT.md 存在，請讀取它...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：持續時間字串（ms/s/m/h）。預設值：`30m`（API 金鑰驗證）或 `1h`（OAuth 驗證）。設為 `0m` 可停用。
- `includeSystemPromptSection`：設為 false 時，會從系統提示中省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入啟動內容。預設值：`true`。
- `suppressToolErrorWarnings`：設為 true 時，會在心跳偵測執行期間隱藏工具錯誤警告承載資料。
- `timeoutSeconds`：心跳偵測代理程式回合遭中止前允許的最長秒數。若未設定，會在已設定 `agents.defaults.timeoutSeconds` 時使用該值，否則使用心跳偵測週期，最高限制為 600 秒。
- `directPolicy`：直接／DM 傳遞政策。`allow`（預設）允許傳遞至直接目標。`block` 會抑制傳遞至直接目標，並發出 `reason=dm-blocked`。
- `lightContext`：設為 true 時，心跳偵測執行會使用輕量啟動內容，且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：設為 true 時，每次心跳偵測都會在沒有先前對話記錄的全新工作階段中執行。隔離模式與排程 `sessionTarget: "isolated"` 相同。可將每次心跳偵測的 Token 成本從約 100K 降至約 2-5K Token。
- `skipWhenBusy`：設為 true 時，若該代理程式有其他忙碌通道，心跳偵測執行會延後：包括它自己依工作階段鍵區分的子代理程式或巢狀命令工作。即使未設定此旗標，排程通道也一律會延後心跳偵測。
- 各代理程式：設定 `agents.list[].heartbeat`。只要有任何代理程式定義 `heartbeat`，就**只有這些代理程式**會執行心跳偵測。
- 心跳偵測會執行完整代理程式回合——間隔越短，消耗的 Token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已註冊壓縮提供者外掛的 ID（選用）
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "精確保留部署 ID、票證 ID 及主機:連接埠組合。", // identifierPolicy=custom 時使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 選用的工具迴圈壓力檢查
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // 選擇啟用 AGENTS.md 區段重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 選用的僅限壓縮模型覆寫
        truncateAfterCompaction: true, // 壓縮後輪替至較小的後繼 JSONL
        maxActiveTranscriptBytes: "20mb", // 選用的預先檢查本機壓縮觸發條件
        notifyUser: true, // 在壓縮開始／完成及記憶體清除降級時通知（預設：false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 選用的僅限記憶體清除模型覆寫
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "工作階段即將壓縮。立即儲存持久記憶。",
          prompt: "將任何需長期保留的筆記寫入 memory/YYYY-MM-DD.md；若沒有內容需要儲存，請以完全相同的靜默權杖 NO_REPLY 回覆。",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（針對較長歷程進行分段摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`：已註冊壓縮提供者外掛的 ID。設定後，會呼叫提供者的 `summarize()`，而非內建的 LLM 摘要。失敗時會回復使用內建功能。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：單次壓縮作業在 OpenClaw 中止前允許的最大秒數。預設值：`180`。
- `reserveTokens`：壓縮後，為模型輸出與未來工具結果保留的權杖餘裕。已知模型的情境視窗時，OpenClaw 會限制有效保留量，使其無法耗盡提示預算。
- `reserveTokensFloor`：嵌入式執行階段強制執行的最低保留量。設定 `0` 可停用此下限。此下限仍受有效情境視窗上限約束。
- `keepRecentTokens`：代理程式截斷點預算，用於逐字保留最新的文字記錄尾端。明確設定時，手動 `/compact` 會遵循此值；否則手動壓縮會是硬性檢查點。
- `recentTurnsPreserve`：在保障摘要之外逐字保留的最新使用者／助理對話輪數。預設值：`3`。
- `maxHistoryShare`：壓縮後，允許保留歷程占情境總預算的最大比例（範圍 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間，於開頭加入內建的不透明識別碼保留指引。
- `identifierInstructions`：使用 `identifierPolicy=custom` 時採用的選用自訂識別碼保留文字。
- `qualityGuard`：保障摘要針對格式錯誤輸出的重試檢查。保障模式預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的工具迴圈壓力檢查。設為 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次模型呼叫前檢查情境壓力。如果情境已無法容納，會在提交提示前中止目前嘗試，並重複使用既有的預先檢查復原路徑，以截斷工具結果或進行壓縮後重試。適用於 `default` 和 `safeguard` 壓縮模式。預設值：停用。
- `postIndexSync`：壓縮後的工作階段記憶重新索引模式。預設值：`"async"`。使用 `"await"` 可獲得最高即時性，使用 `"async"` 可降低壓縮延遲，僅在工作階段記憶同步由其他位置處理時才使用 `"off"`。
- `postCompactionSections`：壓縮後要重新注入的選用 AGENTS.md H2/H3 區段名稱。未設定或設為 `[]` 時，會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用該組合，並保留舊版 `Every Session`/`Safety` 備援。只有當額外情境的價值高於重複專案指引的風險時才啟用，因為這些指引可能已包含在壓縮摘要中。
- `model`：僅供壓縮摘要使用的選用 `provider/model-id`，或來自 `agents.defaults.models` 的純別名。純別名會在分派前解析；發生衝突時，已設定的模型常值 ID 優先。當主要工作階段應維持使用某個模型，但壓縮摘要應由另一個模型執行時，請使用此設定；未設定時，壓縮會使用工作階段的主要模型。
- `truncateAfterCompaction`：在壓縮後輪替有效工作階段文字記錄，使未來對話輪次只載入摘要與未摘要的尾端，同時封存先前的完整文字記錄。防止長時間執行的工作階段中，有效文字記錄無限制增長。預設值：`false`。
- `maxActiveTranscriptBytes`：選用的位元組閾值（`number` 或類似 `"20mb"` 的字串），當文字記錄歷程超過此閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，以便成功壓縮後輪替至較小的後繼文字記錄。未設定或設為 `0` 時停用。
- `notifyUser`：設為 `true` 時，會向使用者傳送簡短的情境維護通知：壓縮開始與完成時（例如「正在壓縮情境...」和「壓縮完成」），以及壓縮前記憶清理已用盡、因此回覆會在降級狀態下繼續時（例如「記憶維護暫時失敗；正在繼續你的回覆。」）。預設停用，以靜默處理這些通知。
- `memoryFlush`：自動壓縮前的靜默代理式對話輪次，用於儲存持久記憶。如果此維護對話輪次應維持使用本機模型，請將 `model` 設為確切的提供者／模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承有效工作階段的備援鏈。即使權杖計數器已過時，`forceFlushTranscriptBytes` 也會在文字記錄大小達到閾值時強制清理。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

嵌入式代理程式執行階段的外部執行迴圈重試迭代界線，用於防止失敗復原期間發生無限執行迴圈。此設定僅適用於嵌入式代理程式執行階段，不適用於 ACP 或命令列介面執行階段。

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

- `base`：外部執行迴圈的基礎執行重試迭代次數。預設值：`24`。
- `perProfile`：每個備援設定檔候選項額外提供的執行重試迭代次數。預設值：`8`。
- `min`：執行重試迭代次數的最低絕對限制。預設值：`32`。
- `max`：執行重試迭代次數的最高絕對限制，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送至 LLM 前，從記憶體內情境中刪減**舊工具結果**。**不會**修改磁碟上的工作階段歷程。預設停用；設定 `mode: "cache-ttl"` 可啟用。

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
        hardClear: { enabled: true, placeholder: "[已清除舊工具結果內容]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行為">

- `mode: "cache-ttl"` 會啟用刪減作業。
- `ttl` 控制再次執行刪減的頻率（從上次快取存取後起算）。預設值：`5m`。
- 刪減會先柔性截短過大的工具結果，然後視需要完整清除較舊的工具結果。
- `softTrimRatio` 和 `hardClearRatio` 接受從 `0.0` 到 `1.0` 的值；設定驗證會拒絕範圍外的值。

**柔性截短**會保留開頭與結尾，並在中間插入 `...`。

**完整清除**會以預留位置取代整個工具結果。

注意事項：

- 影像區塊永遠不會被截短／清除。
- 比例以字元為基礎（近似值），並非確切的權杖數。
- 如果助理訊息少於 `keepLastAssistants` 則略過刪減。

</Accordion>

如需行為詳細資訊，請參閱[工作階段刪減](/zh-TW/concepts/session-pruning)。

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

- 非 Telegram 頻道需要明確設定 `*.streaming.block.enabled: true` 才能啟用區塊回覆。QQ Bot 是例外：它沒有 `streaming.block` 鍵，除非 `channels.qqbot.streaming.mode` 為 `"off"`，否則會以串流方式傳送區塊回覆。
- 頻道覆寫：`channels.<channel>.streaming.block.coalesce`（以及個別帳號的變體）。Discord、Google Chat、Mattermost、MS Teams、Signal 和 Slack 預設為 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：偏好的區塊邊界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：區塊回覆之間的隨機暫停時間。預設值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未設定的界線會回復使用自然範圍）。個別代理程式覆寫：`agents.list[].humanDelay`。

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

- 預設值：直接聊天／提及使用 `instant`，未提及的群組聊天使用 `message`。
- `typingIntervalSeconds` 預設值：`6`。
- 個別工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入狀態指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理程式的選用沙箱隔離。如需完整指南，請參閱[沙箱隔離](/zh-TW/gateway/sandboxing)。

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
          // 也支援 SecretRefs／內嵌內容：
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

上方顯示的預設值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 映像檔／`none` 網路／等等）是 OpenClaw 的實際預設值，不只是示例值。

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
- `identityFile`／`certificateFile`／`knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData`／`certificateData`／`knownHostsData`：OpenClaw 在執行階段具現化為暫存檔案的內嵌內容或 SecretRefs
- `strictHostKeyChecking`／`updateHostKeys`：OpenSSH 主機金鑰原則選項（兩者預設皆為 `true`）

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 以 SecretRef 支援的 `*Data` 值會在沙箱工作階段啟動前，從作用中的密鑰執行環境快照解析

**SSH 後端行為：**

- 在建立或重新建立後，只初始化遠端工作區一次
- 之後將遠端 SSH 工作區維持為標準來源
- 透過 SSH 路由 `exec`、檔案工具和媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取：**

- `none`：位於 `~/.openclaw/sandboxes` 下的各範圍沙箱工作區（預設）
- `ro`：沙箱工作區位於 `/workspace`，代理程式工作區以唯讀方式掛載於 `/agent`
- `rw`：代理程式工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段各自使用一個容器和工作區
- `agent`：每個代理程式各自使用一個容器和工作區（預設）
- `shared`：共用容器和工作區（工作階段之間沒有隔離）

**OpenShell 外掛設定：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror（預設）| remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 選用
          gatewayEndpoint: "https://lab.example", // 選用
          policy: "strict", // 選用的 OpenShell 原則 ID
          providers: ["openai"], // 選用
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：執行前從本機初始化遠端，執行後同步回本機；本機工作區維持為標準來源
- `remote`：建立沙箱時只初始化遠端一次，之後將遠端工作區維持為標準來源

在 `remote` 模式中，初始化步驟完成後，在 OpenClaw 外部進行的主機本機編輯不會自動同步至沙箱。
傳輸方式是透過 SSH 進入 OpenShell 沙箱，但沙箱生命週期和選用的鏡像同步由外掛管理。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出、可寫入的根目錄及 root 使用者。

**容器預設為 `network: "none"`** — 如果代理程式需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急解鎖），否則 `"container:<id>"` 預設會被封鎖。
作用中 OpenClaw 沙箱內的 Codex app-server 回合，會針對其原生程式碼模式網路存取使用相同的輸出設定。

**傳入附件**會暫存至作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與各代理程式的繫結會合併。

**沙箱瀏覽器**（`sandbox.browser.enabled`，預設為 `false`）：在容器中執行 Chromium + CDP。noVNC URL 會注入系統提示詞。不需要在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，而 OpenClaw 會產生短效權杖 URL（而不是在共用 URL 中公開密碼）。

- `allowHostControl: false`（預設）會阻止沙箱工作階段以主機瀏覽器為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確需要全域橋接連線時，才設為 `bridge`。此處也會封鎖 `"host"`。
- `cdpSourceRange` 可選擇性地在容器邊界將 CDP 傳入限制於 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 僅將額外的主機目錄掛載至沙箱瀏覽器容器。設定後（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 沙箱瀏覽器容器的 Chromium 一律使用 `--no-sandbox --disable-setuid-sandbox` 啟動（容器不具備 Chrome 自有沙箱所需的核心基礎功能）；沒有可切換此行為的設定。
- 啟動預設值定義於 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機進行調校：
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
    預設啟用；若 WebGL／3D 使用需求有需要，可使用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - `--disable-extensions`（預設啟用）；如果你的工作流程依賴擴充功能，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 會重新啟用擴充功能。
  - 預設為 `--renderer-process-limit=2`；可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更，將 `0` 設為使用 Chromium 的
    預設處理程序限制。
  - 僅在啟用 `headless` 時使用 `--headless=new`。
  - 這些預設值是容器映像檔的基準；若要變更容器預設值，請使用具有自訂
    進入點的自訂瀏覽器映像檔。

</Accordion>

瀏覽器沙箱和 `sandbox.docker.binds` 僅支援 Docker。

建置映像檔（從原始碼簽出目錄）：

```bash
scripts/sandbox-setup.sh           # 主要沙箱映像檔
scripts/sandbox-browser-setup.sh   # 選用的瀏覽器映像檔
```

若 npm 安裝沒有原始碼簽出目錄，請參閱[沙箱 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，以取得內嵌 `docker build` 命令。

### `agents.list`（各代理程式覆寫）

使用 `agents.list[].tts` 可為代理程式提供專屬的 TTS 提供者、語音、模型、
樣式或自動 TTS 模式。代理程式區塊會深度合併至全域
`messages.tts` 之上，因此共用認證資訊可保留在同一處，而各個
代理程式只覆寫所需的語音或提供者欄位。作用中代理程式的
覆寫會套用至自動語音回覆、`/tts audio`、`/tts status`，以及
`tts` 代理程式工具。提供者範例和優先順序請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)。

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
- `default`：設定多個時，以第一個為準（會記錄警告）。若皆未設定，清單中的第一個項目即為預設值。
- `model`：字串形式會設定嚴格的個別代理程式主要模型，且不使用模型備援；物件形式的 `{ primary }` 也同樣嚴格，除非加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 讓該代理程式啟用備援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。僅覆寫 `primary` 的排程工作仍會繼承預設備援，除非設定 `fallbacks: []`。
- `utilityModel`：選用的個別代理程式覆寫，用於產生工作階段與討論串標題等簡短內部工作。依序回退至 `agents.defaults.utilityModel`、主要供應商宣告的小型模型預設值，再到此代理程式的主要模型。空字串會停用此代理程式的公用模型路由。
- `params`：個別代理程式的串流參數，會合併覆寫 `agents.defaults.models` 中所選的模型項目。使用此項目設定 `cacheRetention`、`temperature` 或 `maxTokens` 等代理程式專屬覆寫，而無須複製整個模型目錄。
- `tts`：選用的個別代理程式文字轉語音覆寫。此區塊會深度合併至 `messages.tts`，因此請將共用的供應商認證資訊與備援原則保留在 `messages.tts`，此處只設定供應商、語音、模型、風格或自動模式等角色專屬值。
- `skills`：選用的個別代理程式 Skills 允許清單。若省略，代理程式會在已設定時繼承 `agents.defaults.skills`；明確指定的清單會取代預設值而非合併，且 `[]` 表示不使用任何 Skills。
- `thinkingDefault`：選用的個別代理程式預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。未設定個別訊息或工作階段覆寫時，會覆寫此代理程式的 `agents.defaults.thinkingDefault`。所選的供應商／模型設定檔會控制哪些值有效；對 Google Gemini 而言，`adaptive` 會保留由供應商管理的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的個別代理程式預設推理可見性（`on | off | stream`）。未設定個別訊息或工作階段的推理覆寫時，會覆寫此代理程式的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的個別代理程式快速模式預設值（`"auto" | true | false`）。未設定個別訊息或工作階段的快速模式覆寫時套用。
- `models`：選用的個別代理程式模型目錄／執行階段覆寫，以完整的 `provider/model` ID 為索引鍵。使用 `models["provider/model"].agentRuntime` 設定個別代理程式的執行階段例外。
- `runtime`：選用的個別代理程式執行階段描述元。當代理程式應預設使用 ACP 控制環境工作階段時，請搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）使用 `type: "acp"`。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案上限為 2 MB。`http(s)` URL 與 `data:` URI 不受本機檔案大小上限檢查。
- `identity` 會衍生預設值：`ackReaction` 來自 `emoji`，`mentionPatterns` 來自 `name`/`emoji`。
- `subagents.allowAgents`：已設定代理程式 ID 的允許清單，用於明確的 `sessions_spawn.agentId` 目標（`["*"]` = 任何已設定的目標；預設：僅限相同代理程式）。當應允許以自身為目標的 `agentId` 呼叫時，請包含要求者 ID。其代理程式設定已刪除的過時項目會遭 `sessions_spawn` 拒絕，並從 `agents_list` 中省略；請執行 `openclaw doctor --fix` 清理這些項目，或在該目標應保持可產生且繼承預設值時，加入最小的 `agents.list[]` 項目。
- 沙箱繼承防護：若要求者工作階段位於沙箱中，`sessions_spawn` 會拒絕將在沙箱外執行的目標。
- `subagents.requireAgentId`：設為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設：false）。
- `subagents.maxConcurrent`：子代理程式執行期間可同時執行的子代理程式數量上限。預設值：`8`。
- `subagents.maxChildrenPerAgent`：單一代理程式工作階段可產生的作用中子代理程式數量上限。預設值：`5`。
- `subagents.maxSpawnDepth`：產生子代理程式的最大巢狀深度（`1`-`5`）。預設值：`1`（不允許巢狀）。
- `subagents.archiveAfterMinutes`：已完成的子代理程式狀態經過多久後封存。預設值：`60`。

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

- `type`（選用）：`route` 用於一般路由（缺少類型時預設為路由），`acp` 用於持續性 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任何帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；依頻道而異）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，不含對等端／伺服器／團隊）
5. `match.accountId: "*"`（整個頻道）
6. 預設代理程式

在每個層級內，以第一個相符的 `bindings` 項目為準。

對於 `type: "acp"` 項目，OpenClaw 會依精確的對話身分（`match.channel` + 帳號 + `match.peer.id`）解析，不使用上述路由繫結層級順序。

### 個別代理程式存取設定檔

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

<Accordion title="唯讀工具與工作區">

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
  - `per-sender`（預設）：在頻道情境中，每個傳送者都會獲得獨立的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在預期共用情境時使用）。
- **`dmScope`**：私訊的分組方式。
  - `main`：所有私訊共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 ID 隔離。
  - `per-channel-peer`：依頻道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應至帶有供應商前綴的對等端，以便跨頻道共用工作階段。`/dock_discord` 等停駐命令會使用相同的對應，將作用中工作階段的回覆路由切換至另一個已連結的頻道對等端；請參閱[頻道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設原則。`daily` 會在當地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。若兩者皆已設定，則以先到期者為準。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、執行通知及閘道簿記等背景／系統事件寫入可更新 `updatedAt`，但不會讓每日／閒置工作階段維持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`resetByChannel`**：依供應商／頻道 ID 作為索引鍵的各頻道重設覆寫。當工作階段的頻道有相符項目時，該項目會直接優先於該工作階段的 `resetByType`/`reset`。僅在某個頻道需要與類型層級原則不同的重設行為時使用。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天分組。
- **`agentToAgent.maxPingPongTurns`**：代理程式之間交換時的最大往返回覆輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用來回鏈結。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，並以舊版 `dm` 作為別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：工作階段儲存區清理與保留控制。
  - `mode`：`enforce` 會執行清理且為預設值；`warn` 僅發出警告。
  - `pruneAfter`：過時項目的存留時間截止值（預設 `30d`）。
  - `maxEntries`：SQLite 工作階段項目的最大數量（預設 `500`）。針對正式環境規模的上限，執行階段寫入會使用小幅高水位緩衝進行批次清理；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短期閘道模型執行探測工作階段使用固定的 `24h` 保留期限，但清理由壓力條件觸發：只有在達到工作階段項目維護／上限壓力時，才會移除過時的嚴格模型執行探測資料列。僅明確符合 `agent:*:explicit:model-run-<uuid>` 的嚴格探測索引鍵符合資格；一般直接、群組、討論串、排程、鉤子、心跳偵測、ACP 及子代理程式工作階段不會繼承此 24h 保留期限。模型執行清理執行時，會先於範圍較廣的 `pruneAfter` 過時項目清理與 `maxEntries` 上限執行。
  - 目前的結構描述會拒絕舊版 `rotateBytes`；`openclaw doctor --fix` 會從舊版設定中移除它。
  - `resetArchiveRetention`：重設／刪除之轉錄封存的依存留時間保留設定。預設會保留封存，直到磁碟預算淘汰為止；設定持續時間可選擇啟用依實際時間刪除，或設為 `false` 以明確停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式下會記錄警告；在 `enforce` 模式下會優先移除最舊的成品／工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：工作階段轉錄寫入鎖定控制。僅在合理的轉錄準備、清理、壓縮或鏡像作業競爭時間超過預設原則時調整。
  - `acquireTimeoutMs`：取得鎖定時，在回報工作階段忙碌前等待的毫秒數。預設：`60000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：現有鎖定被視為過時並回收前的毫秒數。預設：`1800000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：處理程序內已持有的鎖定，在監控程式釋放前可維持鎖定的毫秒數。預設：`300000`；環境變數覆寫 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：討論串綁定工作階段功能的全域預設值。
  - `enabled`：主要預設開關（供應商可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設因閒置而自動取消聚焦的時數（`0` 會停用；供應商可覆寫）
  - `maxAgeHours`：預設硬性最長存留時數（`0` 會停用；供應商可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 與 ACP 討論串衍生項目建立討論串綁定工作階段的預設閘門。啟用討論串綁定時，預設為 `true`；供應商／帳號可覆寫。
  - `defaultSpawnContext`：討論串綁定衍生項目的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

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

各頻道／帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析順序（最明確者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止逐級套用。`"auto"` 會衍生 `[{identity.name}]`。

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

- 預設為作用中代理程式的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 各頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分後援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`，或 `off`/`none`（完全停用確認反應）。
- `removeAckAfterReply`：在 Slack、Discord、Signal、Telegram、WhatsApp 及 iMessage 等支援反應的頻道上，於回覆後移除確認反應。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 及 WhatsApp 上啟用生命週期狀態反應。
  在 Discord 上，未設定時會在確認反應啟用的情況下維持狀態反應啟用。
  在 Slack、Signal、Telegram 及 WhatsApp 上，請明確將其設為 `true`，以啟用生命週期狀態反應。
  Slack 預設會使用其原生助理討論串狀態及輪替的載入訊息顯示進度，同時讓設定的確認反應保持不變。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號索引鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 及 `stallHard`。
  Telegram 僅允許固定的反應集合，因此不支援的已設定表情符號會回退
  至該聊天最接近且受支援的狀態變體。

### 佇列

- `mode`：工作階段執行期間收到之輸入訊息的佇列策略。預設：`"steer"`。
  - `steer`：將新提示注入作用中的執行。
  - `followup`：在作用中的執行完成後執行新提示。
  - `collect`：將相容的訊息分批，稍後一起執行。
  - `interrupt`：在開始最新提示前中止作用中的執行。
- `debounceMs`：分派已排入佇列／已引導訊息前的延遲。預設：`500`。
- `cap`：套用捨棄原則前的最大佇列訊息數。預設：`20`。
- `drop`：超過上限時的策略。`"summarize"`（預設）會捨棄最舊的項目，但保留精簡摘要；`"old"` 會捨棄最舊的項目且不保留摘要；`"new"` 會拒絕最新項目。
- `byChannel`：依供應商 ID 作為索引鍵的各頻道 `mode` 覆寫。
- `debounceMsByChannel`：依供應商 ID 作為索引鍵的各頻道 `debounceMs` 覆寫。

### 輸入防彈跳

將來自同一傳送者的快速連續純文字訊息批次合併為單一代理程式輪次。媒體／附件會立即送出。控制命令不受防彈跳影響。預設 `debounceMs`：`2000`。

### 其他訊息索引鍵

- `messages.messagePrefix`：在輸入使用者訊息送達代理程式執行階段前，前置加入的文字。請謹慎用於頻道情境標記。
- `messages.visibleReplies`：控制直接、群組及頻道對話中可見的來源回覆（`"message_tool"` 需要 `message(action=send)` 才會產生可見輸出；`"automatic"` 會如以往發布一般回覆）。
- `messages.usageTemplate` / `messages.responseUsage`：自訂 `/usage` 頁尾範本及預設的每次回覆使用模式（`off | tokens | full`，另有舊版 `on` 作為 `tokens` 的別名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群組訊息提及觸發條件與歷史記錄視窗大小。
- `messages.suppressToolErrors`：設為 `true` 時，隱藏向使用者顯示的 `⚠️` 工具錯誤警告（代理程式仍會在情境中看到錯誤並可重試）。預設：`false`。

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

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆寫本機偏好設定，而 `/tts status` 會顯示實際生效的狀態。
- `summaryModel` 會覆寫自動摘要使用的 `agents.defaults.model.primary`。
- `modelOverrides` 預設為啟用（`enabled !== false`）；`modelOverrides.allowProvider` 則需選擇啟用。
- API 金鑰會依序改用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建的語音供應商由外掛管理。若已設定 `plugins.allow`，請納入你想使用的每個 TTS 供應商外掛，例如 Edge TTS 的 `microsoft`。舊版 `edge` 供應商 ID 會被接受為 `microsoft` 的別名。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序依次為設定、`OPENAI_TTS_BASE_URL`，然後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為與 OpenAI 相容的 TTS 伺服器，並放寬模型與語音驗證。

---

## 對話

對話模式的預設值（macOS/iOS/Android 以及瀏覽器控制介面）。

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

- 設定多個對話供應商時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平對話鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix`，將持久化設定改寫至 `talk.providers.<provider>`。
- 語音 ID 會改用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS 對話用戶端行為）。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- 僅在未設定對話 API 金鑰時，才會改用 `ELEVENLABS_API_KEY`。
- `providers.*.voiceAliases` 讓對話指令可以使用易記名稱。
- `providers.mlx.modelId` 選取 macOS 本機 MLX 輔助程式使用的 Hugging Face 儲存庫。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- 若內建的 `openclaw-mlx-tts` 輔助程式存在，macOS MLX 播放會透過它執行，否則使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 可覆寫開發環境的輔助程式路徑。
- `consultThinkingLevel` 控制介面對話即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw 代理程式執行的思考層級。保持未設定即可保留一般工作階段／模型行為。
- `consultFastMode` 為控制介面對話的即時諮詢設定單次快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS 對話語音辨識所使用的 BCP 47 地區設定 ID。保持未設定即可使用裝置預設值。
- `silenceTimeoutMs` 控制對話模式在使用者停止說話後等待多久才傳送逐字稿。保持未設定會沿用平台的預設暫停時間範圍（`700 ms on macOS and Android, 900 ms on iOS`）。
- `realtime.instructions` 會將面向供應商的系統指示附加至 OpenClaw 內建的即時提示詞，讓你無須捨棄預設的 `openclaw_agent_consult` 指引即可設定語音風格。
- `realtime.vadThreshold` 設定供應商的語音活動閾值，範圍從 `0`（最靈敏）到 `1`（最不靈敏）。保持未設定會沿用供應商預設值。
- `realtime.silenceDurationMs` 設定供應商提交即時使用者輪次前的正整數靜音時間範圍。保持未設定會沿用供應商預設值。
- `realtime.prefixPaddingMs` 設定偵測到語音開始前所保留音訊的非負整數長度。保持未設定會沿用供應商預設值。
- `realtime.reasoningEffort` 設定即時工作階段的供應商專屬推理層級。保持未設定會沿用供應商預設值。
- `realtime.consultRouting`：當即時供應商產生不含 `openclaw_agent_consult` 的最終使用者逐字稿時，`"provider-direct"`（預設）會保留供應商的直接回覆。`"force-agent-consult"` 則會改為透過 OpenClaw 路由最終確定的請求。

---

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

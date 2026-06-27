---
read_when:
    - 調整代理預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與對話設定
title: 設定 — 代理
x-i18n:
    generated_at: "2026-06-27T19:16:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

代理程式範圍的設定鍵位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 之下。關於頻道、工具、閘道執行階段，以及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：已設定時為 `OPENCLAW_WORKSPACE_DIR`，否則為 `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。當你不想把該路徑寫入設定時，可使用環境變數將預設代理程式
指向已掛載的工作區。

### `agents.defaults.repoRoot`

顯示在系統提示詞 Runtime 行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區往上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

未設定 `agents.list[].skills` 的代理程式可使用的選用預設 Skills 允許清單。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 時，預設不限制 Skills。
- 省略 `agents.list[].skills` 時會繼承預設值。
- 設定 `agents.list[].skills: []` 表示不啟用 Skills。
- 非空的 `agents.list[].skills` 清單就是該代理程式的最終集合；
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立指定的選用工作區檔案，同時仍寫入必要的啟動檔案。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的延續回合（在完成的助理回應之後）會略過重新注入工作區啟動內容，以減少提示詞大小。心跳偵測執行和壓縮後重試仍會重建上下文。
- `"never"`：在每個回合停用工作區啟動內容與上下文檔案注入。僅應用於完全自行管理提示詞生命週期的代理程式（自訂上下文引擎、會自行建立上下文的原生執行階段，或不需要啟動內容的特殊工作流程）。心跳偵測和壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

每代理程式覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

截斷前每個工作區啟動檔案的最大字元數。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

每代理程式覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

跨所有工作區啟動檔案注入的總最大字元數。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

每代理程式覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值會
繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 每代理程式啟動設定檔覆寫

當某個代理程式需要不同於共用預設值的提示詞注入行為時，請使用每代理程式啟動設定檔覆寫。
省略的欄位會繼承自 `agents.defaults`。

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
- `"once"`：每個唯一截斷特徵只注入一次精簡通知。
- `"always"`：只要存在截斷，每次執行都注入精簡通知（建議）。

詳細的原始/注入計數和設定調整欄位會保留在診斷資訊中，
例如上下文/狀態報告和日誌；例行 WebChat 使用者/執行階段上下文只會
取得精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文預算所有權對照表

OpenClaw 有多個高容量提示詞/上下文預算，且刻意依子系統拆分，
而不是全部流經單一通用旋鈕。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  一般工作區啟動內容注入。
- `agents.defaults.startupContext.*`：
  一次性的重設/啟動模型執行前置內容，包括近期每日
  `memory/*.md` 檔案。純聊天 `/new` 和 `/reset` 命令會在不呼叫模型的情況下
  確認重設。
- `skills.limits.*`：
  注入系統提示詞的精簡 Skills 清單。
- `agents.defaults.contextLimits.*`：
  有界的執行階段摘錄與由執行階段擁有的注入區塊。
- `memory.qmd.limits.*`：
  已索引記憶搜尋片段與注入大小設定。

只有當某個代理程式需要不同預算時，才使用對應的每代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設/啟動模型執行時注入的首回合啟動前置內容。
純聊天 `/new` 和 `/reset` 命令會在不呼叫模型的情況下確認重設，
因此不會載入此前置內容。

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

- `memoryGetMaxChars`：加入截斷中繼資料和延續通知前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設的 `memory_get` 行視窗。
- `toolResultMaxChars`：用於持久化結果和溢位復原的進階即時工具結果上限。若要使用模型上下文自動上限，請保持未設定：
  低於 100K token 時為 `16000` 字元，100K+ token 時為 `32000` 字元，200K+ token 時為 `64000`
  字元。對於長上下文模型，接受最高 `1000000` 的明確值，
  但有效上限仍限制在約模型上下文視窗的 30%。`openclaw doctor --deep` 會列印有效上限，
  且 doctor 只會在明確覆寫已過時或無效時發出警告。
- `postCompactionMaxChars`：壓縮後重新整理注入期間使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 旋鈕的每代理程式覆寫。省略的欄位會繼承自
`agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系統提示詞的精簡 Skills 清單全域上限。這不會影響按需讀取 `SKILL.md` 檔案。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示詞預算的每代理程式覆寫。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在供應商呼叫之前，對話記錄/工具圖片區塊中圖片最長邊的最大像素尺寸。
預設值：`1200`。

較低的值通常會減少大量截圖執行中的視覺 token 用量和請求酬載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

從檔案路徑、URL 和媒體參照載入圖片時的圖片工具壓縮/細節偏好。
預設值：`auto`。

OpenClaw 會依選定的圖片模型調整縮放階梯。例如 Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL 和託管的 Llama 4 視覺模型可使用比舊版/預設高細節視覺路徑更大的圖片，而多圖片回合在 `auto` 模式下會更積極壓縮，以控制 token 與延遲成本。

值：

- `auto`：依模型限制和圖片數量調整。
- `efficient`：偏好較小圖片，以降低 token 和位元組用量。
- `balanced`：使用標準的中間取捨階梯。
- `high`：為截圖、圖表和文件圖片保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示詞上下文的時區（不是訊息時間戳記）。會退回使用主機時區。

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
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 字串形式只設定主要模型。
  - 物件形式設定主要模型加上有序的容錯移轉模型。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑用作其視覺模型設定。
  - 當選取的／預設模型無法接受圖片輸入時，也會用作備援路由。
  - 建議使用明確的 `provider/model` 參照。為相容性可接受裸 ID；如果裸 ID 唯一符合 `models.providers.*.models` 中已設定且具備圖片能力的項目，OpenClaw 會將其限定到該提供者。若已設定的符合項目有歧義，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用圖片生成能力，以及任何未來會生成圖片的工具／外掛介面使用。
  - 典型值：用於原生 Gemini 圖片生成的 `google/gemini-3.1-flash-image-preview`、用於 fal 的 `fal/fal-ai/flux/dev`、用於 OpenAI Images 的 `openai/gpt-image-2`，或用於透明背景 OpenAI PNG/WebP 輸出的 `openai/gpt-image-1.5`。
  - 如果你直接選取提供者／模型，也請設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的圖片生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用音樂生成能力和內建的 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview`，或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。
  - 如果你直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用影片生成能力和內建的 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash`，或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。
  - 如果你直接選取提供者／模型，也請設定相符的提供者驗證／API 金鑰。
  - 官方 Qwen 影片生成外掛支援最多 1 部輸出影片、1 張輸入圖片、4 部輸入影片、10 秒長度，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會備援到 `imageModel`，再備援到已解析的工作階段／預設模型。
- `pdfMaxBytesMb`：當呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中擷取備援模式會考慮的預設最大頁數。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要與進度草稿工具行的詳細模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令／詳細資料）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。已設定的推理預設值只會在沒有設定逐訊息或工作階段推理覆寫時，套用於擁有者、授權傳送者，或操作員管理員閘道情境。
- `elevatedDefault`：代理程式的預設提升輸出等級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設值：`"on"`。
- `model.primary`：格式 `provider/model`（例如用於 OpenAI API 金鑰或 Codex OAuth 存取的 `openai/gpt-5.5`）。如果省略提供者，OpenClaw 會先嘗試別名，接著嘗試該確切模型 ID 的唯一已設定提供者符合項，然後才備援到已設定的預設提供者（已棄用的相容性行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會備援到第一個已設定的提供者／模型，而不是顯示過時且已移除提供者的預設值。
- `models`：已設定的模型目錄與 `/model` 允許清單。每個項目可包含 `alias`（捷徑）和 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目，例如 `"openai/*": {}` 或 `"vllm/*": {}`，可顯示所選提供者的所有已探索模型，而不必手動列出每個模型 ID。
  - 當該提供者的每個動態探索模型都應使用相同執行階段時，將 `agentRuntime` 加到 `provider/*` 項目。精確的 `provider/model` 執行階段政策仍會優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕會移除現有允許清單項目的替換。
  - 提供者範圍的設定／入門流程會將所選提供者模型合併到此對應中，並保留已設定的無關提供者。
  - 對於直接 OpenAI Responses 模型，伺服器端壓縮會自動啟用。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫門檻。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#server-side-compaction-responses-api)。
- `params`：套用到所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基底）會被 `agents.defaults.models["provider/model"].params`（逐模型）覆寫，接著 `agents.list[].params`（相符代理程式 ID）會依鍵覆寫。詳情請參閱 [提示快取](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 範圍的預設提供者路由政策。OpenClaw 會將其轉送到 OpenRouter 的請求 `provider` 物件；逐模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和代理程式參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：合併到 `api: "openai-completions"` 請求本文的進階透傳 JSON，適用於 OpenAI 相容代理。如果它與產生的請求鍵衝突，額外本文會勝出；非原生 completions 路由仍會在之後移除 OpenAI 專用的 `store`。
- `params.chat_template_kwargs`：合併到最上層 `api: "openai-completions"` 請求本文的 vLLM/OpenAI 相容聊天範本引數。對於關閉思考的 `vllm/nemotron-3-*`，內建 vLLM 外掛會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。已設定的 vLLM Qwen 和 Nemotron 思考模型會公開二元 `/think` 選項（`off`、`on`），而不是多層級努力程度階梯。
- `compat.thinkingFormat`：OpenAI 相容的思考酬載樣式。對 Together 樣式的 `reasoning.enabled` 使用 `"together"`，對 Qwen 樣式的最上層 `enable_thinking` 使用 `"qwen"`，或對支援請求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM）使用 `"qwen-chat-template"` 以設定 `chat_template_kwargs.enable_thinking`。OpenClaw 會將停用思考對應為 `false`，將啟用思考對應為 `true`，且已設定的 vLLM Qwen 模型會為這些格式公開二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：逐模型的 OpenAI 相容推理努力程度清單。對於真正接受它的自訂端點，請包含 `"xhigh"`；OpenClaw 隨後會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定提供者／模型的 `llm-task` 驗證中公開 `/think xhigh`。當後端需要某個標準層級的提供者特定值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留思考選用設定。啟用且思考開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重放先前的 `reasoning_content`；請參閱 [Z.AI 思考與保留思考](/zh-TW/providers/zai#thinking-and-preserved-thinking)。
- `localService`：本機／自託管模型伺服器的選用提供者層級程序管理器。當所選模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`），如果端點關閉，則以 `args` 啟動 `command`，最多等待 `readyTimeoutMs`，然後傳送模型請求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序保持執行直到 OpenClaw 結束；正值會在指定的閒置毫秒數後停止由 OpenClaw 產生的程序。請參閱 [本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策屬於提供者或模型，不屬於 `agents.defaults`。提供者範圍規則使用 `models.providers.<provider>.agentRuntime`，模型特定規則使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI 提供者上的 OpenAI 代理程式模型預設選取 Codex。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image`，以及備援新增／移除命令）會儲存標準物件形式，並在可行時保留現有備援清單。
- `maxConcurrent`：跨工作階段的最大平行代理程式執行數（每個工作階段仍會序列化）。預設值：4。

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

- `id`: `"auto"`、`"openclaw"`、已註冊的外掛 harness ID，或支援的命令列介面後端別名。內建的 Codex 外掛會註冊 `codex`；內建的 Anthropic 外掛提供 `claude-cli` 命令列介面後端。
- `id: "auto"` 讓已註冊的外掛 harness 接管支援的回合，且在沒有符合的 harness 時使用 OpenClaw。明確指定的外掛執行階段（例如 `id: "codex"`）需要該 harness，若無法使用或失敗則會關閉失敗。
- `id: "pi"` 僅作為 `openclaw` 的已棄用別名接受，用來保留 v2026.5.22 及更早版本已發布的設定。新的設定應使用 `openclaw`。
- 執行階段優先順序會先採用精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]`，或 `models.providers.<provider>.models[]`），接著是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最後是 `models.providers.<provider>.agentRuntime` 的提供者層級政策。
- 整個代理的執行階段鍵為舊版項目。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選，以及 `OPENCLAW_AGENT_RUNTIME` 都會被執行階段選擇忽略。執行 `openclaw doctor --fix` 以移除過時值。
- OpenAI 代理模型預設使用 Codex harness；當你想明確指定時，provider/model `agentRuntime.id: "codex"` 仍然有效。
- 對於 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/claude-opus-4-7` 模型參照仍可為相容性運作，但新的設定應保持提供者/模型選擇為標準形式，並將執行後端放在提供者/模型執行階段政策中。
- 這只控制文字代理回合執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用各自的提供者/模型設定。

**內建別名速記**（僅在模型位於 `agents.defaults.models` 時適用）：

| 別名                | 模型                            |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

你設定的別名一律優先於預設值。

Z.AI GLM-4.x 模型會自動啟用思考模式，除非你設定 `--thinking off` 或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型預設啟用 `tool_stream` 以串流工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 可停用。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設關閉思考；當明確啟用自適應思考時，Anthropic 的提供者自有 effort 預設值為 `high`。Claude 4.6 模型在未設定明確思考層級時，預設為 `adaptive`。

### `agents.defaults.cliBackends`

可選的命令列介面後端，用於純文字備援執行（無工具呼叫）。當 API 提供者失敗時，可作為備用方案。

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
  已失效工作階段。驗證設定檔或憑證世代變更
  仍絕不會以原始內容重新播種。

### `agents.defaults.promptOverlays`

由模型家族套用在 OpenClaw 組裝提示表面的提供者無關提示覆疊。GPT-5 系列模型 ID 會在 OpenClaw/提供者路由間接收共用行為合約；`personality` 只控制友善互動風格層。原生 Codex app-server 路由會保留 Codex 自有的基礎/模型指示，而不是此 OpenClaw GPT-5 覆疊，且 OpenClaw 會為原生執行緒停用 Codex 內建的 personality。

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
- `"off"` 只會停用友善層；帶標籤的 GPT-5 行為合約仍會啟用。
- 當此共用設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

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
- `includeSystemPromptSection`：為 false 時，會從系統提示中省略心跳偵測區段，並略過將 `HEARTBEAT.md` 注入啟動內容。預設：`true`。
- `suppressToolErrorWarnings`：為 true 時，會在心跳偵測執行期間抑制工具錯誤警告承載。
- `timeoutSeconds`：心跳偵測代理回合在中止前允許的最長秒數。若未設定，會在已設定時使用 `agents.defaults.timeoutSeconds`，否則使用上限為 600 秒的心跳偵測節奏。
- `directPolicy`：直接/DM 傳遞政策。`allow`（預設）允許直接目標傳遞。`block` 會抑制直接目標傳遞並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，心跳偵測執行會使用輕量啟動內容，並只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次心跳偵測都會在沒有先前對話歷史的新工作階段中執行。與排程 `sessionTarget: "isolated"` 相同的隔離模式。可將每次心跳偵測的 token 成本從約 100K 降至約 2-5K token。
- `skipWhenBusy`：為 true 時，心跳偵測執行會在該代理的額外忙碌通道上延後：其自身以工作階段鍵控的子代理或巢狀命令工作。排程通道一律會延後心跳偵測，即使沒有此旗標。
- 每個代理：設定 `agents.list[].heartbeat`。當任何代理定義 `heartbeat` 時，**只有那些代理**會執行心跳偵測。
- 心跳偵測會執行完整代理回合 — 較短的間隔會消耗更多 token。

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
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（用於長歷史的分塊摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`：已註冊壓縮提供者外掛的 ID。設定後會呼叫該提供者的 `summarize()`，而不是內建 LLM 摘要。失敗時會退回內建摘要。設定提供者會強制使用 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：單次壓縮操作在 OpenClaw 中止前允許的最長秒數。預設值：`180`。
- `keepRecentTokens`：代理程式保留最近逐字紀錄尾端原文的切點預算。手動 `/compact` 在明確設定時會遵循此值；否則手動壓縮會是硬檢查點。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`：選用的自訂識別碼保留文字，於 `identifierPolicy=custom` 時使用。
- `qualityGuard`：針對 safeguard 摘要的輸出格式錯誤重試檢查。在 safeguard 模式中預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次模型呼叫前檢查上下文壓力。如果上下文已無法容納，會在提交提示前中止目前嘗試，並重用既有的預檢復原路徑來截斷工具結果，或進行壓縮後重試。可搭配 `default` 與 `safeguard` 兩種壓縮模式使用。預設值：停用。
- `postCompactionSections`：選用的 AGENTS.md H2/H3 區段名稱，於壓縮後重新注入。未設定或設為 `[]` 時會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用該組合，並保留舊版 `Every Session`/`Safety` 備援。只有在額外上下文值得承擔重複專案指引風險時才啟用，因為這些指引可能已被壓縮摘要擷取。
- `model`：選用的 `provider/model-id` 或來自 `agents.defaults.models` 的裸別名，僅用於壓縮摘要。裸別名會在分派前解析；發生衝突時，已設定的字面模型 ID 保有優先權。當主要工作階段應保留一個模型，但壓縮摘要應在另一個模型上執行時使用；未設定時，壓縮會使用工作階段的主要模型。
- `maxActiveTranscriptBytes`：選用的位元組閾值（`number` 或像 `"20mb"` 的字串），當作用中 JSONL 超過閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，讓成功壓縮後可輪替到較小的後續逐字紀錄。未設定或為 `0` 時停用。
- `notifyUser`：當為 `true` 時，會在壓縮開始與完成時向使用者傳送簡短通知（例如「正在壓縮上下文...」和「壓縮完成」）。預設停用，以保持壓縮靜默。
- `memoryFlush`：自動壓縮前的靜默代理式回合，用於儲存持久記憶。當此維護回合應留在本機模型上時，將 `model` 設為精確的提供者/模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承作用中工作階段的備援鏈。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

嵌入式代理程式執行階段的外層執行迴圈重試迭代邊界，用於防止失敗復原期間出現無限執行迴圈。請注意，此設定目前僅適用於嵌入式代理程式執行階段，不適用於 ACP 或命令列介面執行階段。

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

- `base`：外層執行迴圈的基礎執行重試迭代次數。預設值：`24`。
- `perProfile`：每個備援 profile 候選者額外授予的執行重試迭代次數。預設值：`8`。
- `min`：執行重試迭代的絕對最小限制。預設值：`32`。
- `max`：執行重試迭代的絕對最大限制，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送給 LLM 前，從記憶體上下文中修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` 會啟用修剪流程。
- `ttl` 控制修剪在上次快取觸碰後多久可以再次執行。
- 修剪會先軟修剪過大的工具結果，接著在需要時硬清除較舊的工具結果。
- `softTrimRatio` 和 `hardClearRatio` 接受 `0.0` 到 `1.0` 的值；設定驗證會拒絕此範圍外的值。

**軟修剪**會保留開頭與結尾，並在中間插入 `...`。

**硬清除**會用佔位符取代整個工具結果。

注意事項：

- 圖片區塊永遠不會被修剪或清除。
- 比率以字元為基準（近似值），不是精確的 token 數。
- 如果 assistant 訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

行為詳情請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

### 區塊串流

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- 非 Telegram 頻道需要明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及每帳號變體）。Signal/Slack/Discord/Google Chat 預設為 `minChars: 1500`。
- `humanDelay`：區塊回覆之間的隨機暫停。`natural` = 800–2500ms。每代理程式覆寫：`agents.list[].humanDelay`。

行為與分塊詳情請參閱[串流](/zh-TW/concepts/streaming)。

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

- 預設值：直接聊天/提及為 `instant`，未提及的群組聊天為 `message`。
- 每工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入狀態指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理程式的選用沙箱化。完整指南請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
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

<Accordion title="Sandbox details">

**後端：**

- `docker`：本機 Docker 執行階段（預設）
- `ssh`：一般 SSH 支援的遠端執行階段
- `openshell`：OpenShell 執行階段

選取 `backend: "openshell"` 時，執行階段專屬設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：`user@host[:port]` 形式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於每範圍工作區的絕對遠端根目錄
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的既有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在執行階段具現化為暫存檔的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰政策旋鈕

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙箱工作階段開始前，從作用中的 secrets 執行階段快照解析

**SSH 後端行為：**

- 在建立或重新建立後，對遠端工作區進行一次種子填入
- 接著保持遠端 SSH 工作區為標準來源
- 透過 SSH 路由 `exec`、檔案工具與媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取：**

- `none`：位於 `~/.openclaw/sandboxes` 下的每範圍沙箱工作區
- `ro`：沙箱工作區位於 `/workspace`，代理程式工作區以唯讀方式掛載於 `/agent`
- `rw`：代理程式工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每工作階段容器 + 工作區
- `agent`：每個代理程式一個容器 + 工作區（預設）
- `shared`：共用容器與工作區（無跨工作階段隔離）

**OpenShell 外掛設定：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
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

- `mirror`：執行前從本機播種遠端，執行後同步回來；本機工作區維持為標準來源
- `remote`：建立沙箱時播種遠端一次，之後讓遠端工作區維持為標準來源

在 `remote` 模式中，在 OpenClaw 外部所做的主機本機編輯，不會在播種步驟後自動同步到沙箱。
傳輸方式是透過 SSH 進入 OpenShell 沙箱，但外掛負責沙箱生命週期和選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出、可寫入的 root、root 使用者。

**容器預設為 `network: "none"`** — 如果代理程式需要對外存取，請設為 `"bridge"`（或自訂 bridge 網路）。
`"host"` 會被封鎖。`"container:<id>"` 預設會被封鎖，除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急例外）。
Codex app-server 在作用中的 OpenClaw 沙箱內執行時，其原生程式碼模式網路存取會使用相同的輸出設定。

**傳入附件** 會暫存到作用中工作區內的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與每個代理程式的 binds 會合併。

**沙箱瀏覽器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 會注入到系統提示。不需要在 `openclaw.json` 中啟用 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，OpenClaw 會發出短效權杖 URL（而不是在共用 URL 中暴露密碼）。

- `allowHostControl: false`（預設）會阻止沙箱工作階段以主機瀏覽器為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用 bridge 網路）。只有在你明確需要全域 bridge 連線時，才設為 `bridge`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 輸入限制到 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將額外的主機目錄掛載到沙箱瀏覽器容器。設定時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 啟動預設值定義在 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機調校：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（預設啟用）
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    預設啟用；若 WebGL/3D 使用情境需要，可透過
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - 如果你的工作流程依賴擴充功能，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 會重新啟用擴充功能。
  - `--renderer-process-limit=2` 可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更；設為 `0` 則使用 Chromium 的
    預設程序限制。
  - 當 `noSandbox` 啟用時，另外加上 `--no-sandbox`。
  - 預設值是容器映像檔基準；若要變更容器預設值，請使用具自訂
    entrypoint 的自訂瀏覽器映像檔。

</Accordion>

瀏覽器沙箱化和 `sandbox.docker.binds` 僅適用於 Docker。

建置映像檔（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若是在沒有原始碼 checkout 的情況下進行 npm 安裝，請參閱[沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，以取得內嵌 `docker build` 命令。

### `agents.list`（每個代理程式覆寫）

使用 `agents.list[].tts` 為代理程式指定自己的 TTS 提供者、語音、模型、
樣式或自動 TTS 模式。代理程式區塊會深度合併到全域
`messages.tts` 之上，因此共用認證可以保留在同一處，而個別
代理程式只覆寫它們需要的語音或提供者欄位。作用中代理程式的
覆寫會套用到自動語音回覆、`/tts audio`、`/tts status`，以及
`tts` 代理程式工具。請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)
以取得提供者範例和優先順序。

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
            mode: "persistent",
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
- `default`：設定多個時，第一個生效（會記錄警告）。若未設定，清單中的第一個項目為預設。
- `model`：字串形式會設定嚴格的每個代理程式主要模型，且沒有模型 fallback；物件形式 `{ primary }` 也同樣嚴格，除非你加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 讓該代理程式選擇加入 fallback，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的排程工作仍會繼承預設 fallback，除非你設定 `fallbacks: []`。
- `params`：每個代理程式的串流參數，會合併到 `agents.defaults.models` 中選取的模型項目之上。可用於代理程式專屬覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而不必複製整個模型目錄。
- `tts`：選用的每個代理程式文字轉語音覆寫。此區塊會深度合併到 `messages.tts` 之上，因此請將共用提供者認證與 fallback 政策保留在 `messages.tts`，並只在這裡設定角色專屬值，例如提供者、語音、模型、樣式或自動模式。
- `skills`：選用的每個代理程式 Skills 允許清單。若省略，代理程式會在設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而非合併，`[]` 表示沒有 Skills。
- `thinkingDefault`：選用的每個代理程式預設思考等級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每則訊息或工作階段覆寫時，會覆寫此代理程式的 `agents.defaults.thinkingDefault`。選取的提供者/模型設定檔會控制哪些值有效；對 Google Gemini 而言，`adaptive` 會保留提供者擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每個代理程式預設推理可見性（`on | off | stream`）。當未設定每則訊息或工作階段推理覆寫時，會覆寫此代理程式的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每個代理程式快速模式預設值（`"auto" | true | false`）。當未設定每則訊息或工作階段快速模式覆寫時套用。
- `models`：選用的每個代理程式模型目錄/執行階段覆寫，依完整 `provider/model` ID 作為鍵。使用 `models["provider/model"].agentRuntime` 進行每個代理程式的執行階段例外設定。
- `runtime`：選用的每個代理程式執行階段描述器。當代理程式應預設使用 ACP harness 工作階段時，使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL，或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案限制為 2 MB。`http(s)` URL 和 `data:` URI 不會套用本機檔案大小限制檢查。
- `identity` 會衍生預設值：`ackReaction` 來自 `emoji`，`mentionPatterns` 來自 `name`/`emoji`。
- `subagents.allowAgents`：已設定代理程式 ID 的允許清單，用於明確的 `sessions_spawn.agentId` 目標（`["*"]` = 任何已設定目標；預設：僅相同代理程式）。當應允許以自己為目標的 `agentId` 呼叫時，請包含請求者 ID。若代理程式設定已刪除，過期項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；執行 `openclaw doctor --fix` 以清理，或若該目標應在繼承預設值時仍可被產生，請加入最小的 `agents.list[]` 項目。
- 沙箱繼承防護：如果請求者工作階段已沙箱化，`sessions_spawn` 會拒絕將在未沙箱化環境中執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔；預設：false）。

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

### 繫結比對欄位

- `type`（選用）：一般路由使用 `route`（缺少 type 時預設為 route），持續 ACP 對話繫結使用 `acp`。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任何帳戶；省略 = 預設帳戶）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；頻道特定）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，無 peer/guild/team）
5. `match.accountId: "*"`（整個頻道）
6. 預設代理程式

在每個層級中，第一個相符的 `bindings` 項目生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確的對話身分（`match.channel` + 帳戶 + `match.peer.id`）解析，且不使用上述路由繫結層級順序。

### 每個代理程式的存取設定檔

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

<Accordion title="無檔案系統存取權（僅訊息）">

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

請參閱[多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools)了解優先順序詳細資料。

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

- **`scope`**：群組聊天情境的基本工作階段分組策略。
  - `per-sender`（預設）：每個傳送者都會在通道情境中取得隔離的工作階段。
  - `global`：通道情境中的所有參與者共用單一工作階段（僅在有意共用情境時使用）。
- **`dmScope`**：DM 的分組方式。
  - `main`：所有 DM 共用主要工作階段。
  - `per-peer`：跨通道依傳送者 ID 隔離。
  - `per-channel-peer`：依通道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 通道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應到含供應商前綴的對等端，以便跨通道共用工作階段。像 `/dock_discord` 這類 Dock 命令會使用相同對應，將作用中工作階段的回覆路由切換到另一個已連結的通道對等端；請參閱[通道停靠](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設政策。`daily` 會在本地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。若兩者皆已設定，先到期者優先。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、exec 通知和閘道簿記等背景/系統事件寫入可以更新 `updatedAt`，但它們不會讓每日/閒置工作階段保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天儲存桶。
- **`agentToAgent.maxPingPongTurns`**：代理對代理交換期間，代理之間可來回回覆的最大回合數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用乒乓式串接。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，舊版 `dm` 可作為別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個 deny 會勝出。
- **`maintenance`**：工作階段儲存區清理 + 保留控制。
  - `mode`：`enforce` 會套用清理且為預設值；`warn` 僅發出警告。
  - `pruneAfter`：過時項目的年齡截止值（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的項目數上限（預設 `500`）。執行階段會使用小型高水位緩衝區批次寫入清理，以支援生產規模上限；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短暫存在的閘道模型執行探測工作階段使用固定 `24h` 保留期，但清理受壓力門檻限制：只有在達到工作階段項目維護/上限壓力時，才會移除過時的嚴格模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵才符合資格；一般 direct、group、thread、排程、hook、心跳偵測、ACP 和子代理工作階段不會繼承此 24h 保留期。模型執行清理執行時，會先於較廣泛的 `pruneAfter` 過時項目清理與 `maxEntries` 上限執行。
  - `rotateBytes`：已淘汰且會被忽略；`openclaw doctor --fix` 會從較舊設定中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄封存的保留期。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式會記錄警告；在 `enforce` 模式會先移除最舊的成品/工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：執行緒繫結工作階段功能的全域預設值。
  - `enabled`：主要預設開關（供應商可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設非作用中自動取消聚焦時數（`0` 會停用；供應商可覆寫）
  - `maxAgeHours`：預設硬性最長存續時數（`0` 會停用；供應商可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 執行緒產生建立執行緒繫結工作階段的預設門檻。啟用執行緒繫結時預設為 `true`；供應商/帳號可覆寫。
  - `defaultSpawnContext`：執行緒繫結產生的預設原生子代理情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

</Accordion>

---

## 訊息

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
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

依通道/帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最具體者優先）：帳號 → 通道 → 全域。`""` 會停用並停止串接。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明                 | 範例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短模型名稱           | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 供應商名稱           | `anthropic`                 |
| `{thinkingLevel}` | 目前思考層級         | `high`, `low`, `off`        |
| `{identity.name}` | 代理身分名稱         | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### Ack 反應

- 預設為作用中代理的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 依通道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 通道 → `messages.ackReaction` → 身分後援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在支援反應的通道（例如 Slack、Discord、Telegram、WhatsApp 和 iMessage）上，回覆後移除 ack。
- `messages.statusReactions.enabled`：在 Slack、Discord、Telegram 和 WhatsApp 上啟用生命週期狀態反應。
  在 Slack 和 Discord 上，未設定時會在 ack 反應作用中時保持狀態反應啟用。
  在 Telegram 和 WhatsApp 上，請明確將其設為 `true` 以啟用生命週期狀態反應。
- `messages.statusReactions.emojis`：覆寫生命週期表情符號鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 只允許固定反應集合，因此不支援的已設定表情符號會回退
  到該聊天最接近的支援狀態變體。

### 傳入防抖

將同一傳送者快速送出的純文字訊息批次合併成單一代理回合。媒體/附件會立即排出。控制命令會略過防抖。

### TTS（文字轉語音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆寫本機偏好設定，`/tts status` 會顯示實際狀態。
- `summaryModel` 會覆寫 `agents.defaults.model.primary` 供自動摘要使用。
- `modelOverrides` 預設為啟用；`modelOverrides.allowProvider` 預設為 `false`（選擇加入）。
- API 金鑰會退回使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建語音提供者由外掛擁有。如果設定了 `plugins.allow`，請包含每個你想使用的 TTS 提供者外掛，例如用於 Edge TTS 的 `microsoft`。舊版 `edge` 提供者 ID 會作為 `microsoft` 的別名被接受。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，然後是 `https://api.openai.com/v1`。
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
        modelId: "eleven_v3",
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
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix`，將持久化設定改寫為 `talk.providers.<provider>`。
- 語音 ID 會退回使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 退回僅在未設定 Talk API 金鑰時套用。
- `providers.*.voiceAliases` 讓 Talk 指令使用友善名稱。
- `providers.mlx.modelId` 選取 macOS 本機 MLX 輔助程式使用的 Hugging Face repo。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在存在時透過內建的 `openclaw-mlx-tts` 輔助程式執行，或使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI Talk realtime `openclaw_agent_consult` 呼叫背後完整 OpenClaw agent 執行的思考層級。保留未設定以維持一般工作階段/模型行為。
- `consultFastMode` 會為 Control UI Talk realtime consult 設定一次性的快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS Talk 語音辨識使用的 BCP 47 地區設定 ID。保留未設定以使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者沉默後等待多久才傳送逐字稿。未設定會保留平台預設暫停視窗（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）。
- `realtime.instructions` 會將面向提供者的系統指示附加到 OpenClaw 內建的 realtime 提示，因此可設定語音風格而不失去預設的 `openclaw_agent_consult` 指引。
- `realtime.consultRouting` 控制當 realtime 提供者產生最終使用者逐字稿但沒有 `openclaw_agent_consult` 時的閘道轉送退回：`provider-direct` 保留直接提供者回覆，而 `force-agent-consult` 會將最終請求透過 OpenClaw 路由。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

---
read_when:
    - 調整代理預設值（模型、思考、工作區、心跳偵測、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞與對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與交談設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-07-01T10:57:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

代理程式範圍設定鍵位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 下。關於頻道、工具、閘道執行階段，以及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：設定 `OPENCLAW_WORKSPACE_DIR` 時使用它，否則使用 `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

明確的 `agents.defaults.workspace` 值優先於
`OPENCLAW_WORKSPACE_DIR`。當你不想將路徑寫入設定時，請使用環境變數將預設代理程式
指向已掛載的工作區。

### `agents.defaults.repoRoot`

顯示在系統提示 Runtime 行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區向上走訪自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

未設定 `agents.list[].skills` 的代理程式可使用的選用預設技能允許清單。

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

- 省略 `agents.defaults.skills` 代表預設不限制技能。
- 省略 `agents.list[].skills` 以繼承預設值。
- 設定 `agents.list[].skills: []` 代表沒有技能。
- 非空的 `agents.list[].skills` 清單是該代理程式的最終集合；
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）的自動建立。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立選定的選用工作區檔案，同時仍會寫入必要的啟動檔案。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

控制工作區啟動檔案何時注入系統提示。預設值：`"always"`。

- `"continuation-skip"`：安全的延續回合（在已完成的助理回應之後）會略過工作區啟動重新注入，減少提示大小。心跳偵測執行和壓縮後重試仍會重建上下文。
- `"never"`：每個回合都停用工作區啟動和上下文檔案注入。僅適用於完全自行掌控提示生命週期的代理程式（自訂上下文引擎、會自行建構上下文的原生執行階段，或專門的無啟動工作流程）。心跳偵測和壓縮復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

每個代理程式覆寫：`agents.list[].contextInjection`。省略的值會繼承
`agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的最大字元數。預設值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

每個代理程式覆寫：`agents.list[].bootstrapMaxChars`。省略的值會繼承
`agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案合計注入的最大總字元數。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

每個代理程式覆寫：`agents.list[].bootstrapTotalMaxChars`。省略的值會
繼承 `agents.defaults.bootstrapTotalMaxChars`。

### 每個代理程式的啟動設定檔覆寫

當某個代理程式需要不同於共享預設值的提示注入行為時，請使用每個代理程式的啟動設定檔覆寫。省略的欄位會繼承自
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

控制啟動上下文被截斷時，代理程式可見的系統提示通知。
預設值：`"always"`。

- `"off"`：永不將截斷通知文字注入系統提示。
- `"once"`：每個唯一截斷簽章只注入一次精簡通知。
- `"always"`：只要存在截斷，每次執行都注入精簡通知（建議）。

詳細的原始/注入計數和設定調整欄位會保留在診斷資訊中，例如
上下文/狀態報告和記錄；例行 WebChat 使用者/執行階段上下文只會取得
精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文預算所有權對照表

OpenClaw 有多個高容量提示/上下文預算，且刻意依子系統分開，
而不是全部流經一個通用旋鈕。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  一般工作區啟動注入。
- `agents.defaults.startupContext.*`：
  一次性的重設/啟動模型執行前置內容，包含最近的每日
  `memory/*.md` 檔案。純聊天 `/new` 和 `/reset` 指令會在不叫用模型的情況下
  確認重設。
- `skills.limits.*`：
  注入系統提示的精簡 Skills 清單。
- `agents.defaults.contextLimits.*`：
  有界限的執行階段摘錄和注入的執行階段擁有區塊。
- `memory.qmd.limits.*`：
  已索引的記憶搜尋片段和注入大小。

只有當某個代理程式需要不同預算時，才使用相符的每個代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設/啟動模型執行時注入的第一回合啟動前置內容。
純聊天 `/new` 和 `/reset` 指令會在不叫用模型的情況下確認重設，
因此不會載入這段前置內容。

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

有界限執行階段上下文介面的共享預設值。

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

- `memoryGetMaxChars`：加入截斷中繼資料與延續通知前的預設 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時的預設 `memory_get` 行視窗。
- `toolResultMaxChars`：用於已持久化結果和溢位復原的進階即時工具結果上限。若要使用模型上下文自動上限，請保持未設定：
  低於 100K token 時為 `16000` 字元、100K+ token 時為 `32000` 字元，200K+ token 時為 `64000`
  字元。長上下文模型可接受最高 `1000000` 的明確值，但有效上限仍受模型上下文視窗約 30% 限制。`openclaw doctor --deep` 會印出有效上限，
  而 doctor 只會在明確覆寫已過時或沒有效果時發出警告。
- `postCompactionMaxChars`：壓縮後重新整理注入期間使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 旋鈕的每個代理程式覆寫。省略的欄位會繼承自
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

注入系統提示的精簡 Skills 清單全域上限。這不會影響按需讀取
`SKILL.md` 檔案。

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

Skills 提示預算的每個代理程式覆寫。

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

供應商呼叫前，轉錄/工具影像區塊中影像最長邊的最大像素尺寸。
預設值：`1200`。

較低的值通常可降低大量螢幕截圖執行的視覺 token 使用量和請求酬載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

從檔案路徑、URL 和媒體參照載入影像時的影像工具壓縮/細節偏好。
預設值：`auto`。

OpenClaw 會依選定的影像模型調整縮放階梯。例如，Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL，以及託管的 Llama 4 視覺模型，可以使用比舊版/預設高細節視覺路徑更大的影像；而多影像回合在 `auto` 模式下會更積極壓縮，以控制 token 和延遲成本。

值：

- `auto`：依模型限制和影像數量調整。
- `efficient`：偏好較小影像，以降低 token 和位元組使用量。
- `balanced`：使用標準折衷階梯。
- `high`：為螢幕截圖、圖表和文件影像保留更多細節。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系統提示上下文使用的時區（不是訊息時間戳）。會回退到主機時區。

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
  - 物件形式會設定主要模型加上有順序的容錯移轉模型。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑作為其視覺模型設定使用。
  - 當所選/預設模型無法接受影像輸入時，也會用於備援路由。
  - 建議使用明確的 `provider/model` 參照。為了相容性，也接受裸 ID；如果裸 ID 在 `models.providers.*.models` 中唯一符合已設定且具備影像能力的項目，OpenClaw 會將其補齊為該提供者。已設定的相符項目若有歧義，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的影像生成能力，以及任何未來生成影像的工具/外掛介面使用。
  - 典型值：原生 Gemini 影像生成使用 `google/gemini-3.1-flash-image-preview`，fal 使用 `fal/fal-ai/flux/dev`，OpenAI Images 使用 `openai/gpt-image-2`，或透明背景 OpenAI PNG/WebP 輸出使用 `openai/gpt-image-1.5`。
  - 如果你直接選取提供者/模型，也要設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的影像生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的音樂生成能力與內建 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的音樂生成提供者。
  - 如果你直接選取提供者/模型，也要設定相符的提供者驗證/API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用的影片生成能力與內建 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，然後依提供者 ID 順序嘗試其餘已註冊的影片生成提供者。
  - 如果你直接選取提供者/模型，也要設定相符的提供者驗證/API 金鑰。
  - 官方 Qwen 影片生成外掛最多支援 1 個輸出影片、1 張輸入影像、4 個輸入影片、10 秒時長，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會退回使用 `imageModel`，再退回使用已解析的工作階段/預設模型。
- `pdfMaxBytesMb`：當呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中擷取備援模式考量的預設最大頁數。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要與進度草稿工具行的詳細模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令/詳細資料）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。已設定的推理預設值只會在沒有設定每則訊息或工作階段推理覆寫時，套用於擁有者、授權傳送者，或 operator-admin 閘道情境。
- `elevatedDefault`：代理程式的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設：`"on"`。
- `model.primary`：格式為 `provider/model`（例如 OpenAI API 金鑰或 Codex OAuth 存取使用 `openai/gpt-5.5`）。如果你省略提供者，OpenClaw 會先嘗試別名，然後嘗試該精確模型 ID 的唯一已設定提供者相符項目，最後才退回使用已設定的預設提供者（已棄用的相容性行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回使用第一個已設定的提供者/模型，而不是顯示過時且已移除的提供者預設值。
- `models`：為 `/model` 設定的模型目錄與允許清單。每個項目都可包含 `alias`（捷徑）和 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目，例如 `"openai/*": {}` 或 `"vllm/*": {}`，即可顯示所選提供者的所有已探索模型，不必手動列出每個模型 ID。
  - 當該提供者的每個動態探索模型都應使用相同執行階段時，將 `agentRuntime` 加到 `provider/*` 項目。精確的 `provider/model` 執行階段政策仍會優先於萬用字元。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非你傳入 `--replace`，否則 `config set` 會拒絕移除現有允許清單項目的取代操作。
  - 提供者範圍的設定/入門流程會將所選提供者模型合併到此對應，並保留已設定的無關提供者。
  - 對於直接 OpenAI Responses 模型，伺服器端壓縮會自動啟用。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫閾值。請參閱 [OpenAI 伺服器端壓縮](/zh-TW/providers/openai#server-side-compaction-responses-api)。
- `params`：套用至所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基礎）會被 `agents.defaults.models["provider/model"].params`（每個模型）覆寫，然後 `agents.list[].params`（相符代理程式 ID）再依鍵覆寫。詳情請參閱 [Prompt Caching](/zh-TW/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 全域預設提供者路由政策。OpenClaw 會將此轉送至 OpenRouter 的請求 `provider` 物件；每個模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 與代理程式參數會依鍵覆寫。請參閱 [OpenRouter 提供者路由](/zh-TW/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：進階透傳 JSON，會合併到 OpenAI 相容代理的 `api: "openai-completions"` 請求本文中。如果它與產生的請求鍵衝突，額外本文會優先；非原生 completions 路由仍會在之後移除僅限 OpenAI 的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 相容的聊天範本引數，會合併到頂層 `api: "openai-completions"` 請求本文。對於關閉 thinking 的 `vllm/nemotron-3-*`，內建 vLLM 外掛會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先順序。已設定的 vLLM Qwen 和 Nemotron thinking 模型會公開二元 `/think` 選項（`off`、`on`），而不是多層級的 effort 階梯。
- `compat.thinkingFormat`：OpenAI 相容的 thinking 酬載樣式。Together 樣式的 `reasoning.enabled` 使用 `"together"`，Qwen 樣式的頂層 `enable_thinking` 使用 `"qwen"`，或對支援請求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM），使用 `"qwen-chat-template"` 對應 `chat_template_kwargs.enable_thinking`。OpenClaw 會將停用 thinking 對應為 `false`，將啟用 thinking 對應為 `true`，而已設定的 vLLM Qwen 模型會為這些格式公開二元 `/think` 選項。
- `compat.supportedReasoningEfforts`：每個模型的 OpenAI 相容推理 effort 清單。對於真正接受它的自訂端點，請包含 `"xhigh"`；OpenClaw 隨後會在命令選單、閘道工作階段列、工作階段修補驗證、代理程式命令列介面驗證，以及該已設定提供者/模型的 `llm-task` 驗證中公開 `/think xhigh`。當後端需要某個標準層級的提供者特定值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留 thinking 選用項。啟用且 thinking 開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重放先前的 `reasoning_content`；請參閱 [Z.AI thinking 與保留 thinking](/zh-TW/providers/zai#thinking-and-preserved-thinking)。
- `localService`：選用的提供者層級程序管理器，用於本機/自託管模型伺服器。當所選模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`），如果端點離線，則以 `args` 啟動 `command`，最多等待 `readyTimeoutMs`，然後傳送模型請求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序保持存活直到 OpenClaw 結束；正值會在該毫秒數的閒置時間後停止由 OpenClaw 產生的程序。請參閱 [本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策屬於提供者或模型，不屬於 `agents.defaults`。提供者範圍規則請使用 `models.providers.<provider>.agentRuntime`，模型特定規則請使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI 提供者上的 OpenAI 代理程式模型預設會選取 Codex。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image`，以及備援新增/移除命令）會儲存標準物件形式，並盡可能保留現有備援清單。
- `maxConcurrent`：跨工作階段的最大平行代理程式執行數（每個工作階段仍會序列化）。預設：4。

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
- `id: "auto"` 讓已註冊的外掛 harness 接管受支援的回合，並在沒有符合的 harness 時使用 OpenClaw。明確的外掛執行階段（例如 `id: "codex"`）需要該 harness，且若其不可用或失敗，會以封閉方式失敗。
- `id: "pi"` 只會作為 `openclaw` 的已棄用別名被接受，用於保留 v2026.5.22 及更早版本已出貨的設定。新的設定應使用 `openclaw`。
- 執行階段優先順序首先是精確模型政策（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），接著是 `agents.list[]` / `agents.defaults.models["provider/*"]`，然後是 `models.providers.<provider>.agentRuntime` 的供應商範圍政策。
- 整個代理的執行階段鍵已屬舊版。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選，以及 `OPENCLAW_AGENT_RUNTIME` 會被執行階段選擇忽略。執行 `openclaw doctor --fix` 以移除過時值。
- OpenAI 代理模型預設使用 Codex harness；當你想明確指定時，provider/model `agentRuntime.id: "codex"` 仍然有效。
- 對 Claude 命令列介面部署，建議使用 `model: "anthropic/claude-opus-4-8"` 加上模型範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/claude-opus-4-7` 模型參照仍可相容運作，但新的設定應保持 provider/model 選擇為標準形式，並把執行後端放在 provider/model 執行階段政策中。
- 這只控制文字代理回合執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用其供應商/模型設定。

**內建別名速記**（只在模型位於 `agents.defaults.models` 時適用）：

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

Z.AI GLM-4.x 模型會自動啟用思考模式，除非你設定 `--thinking off` 或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型預設會啟用 `tool_stream` 以串流工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 可停用它。
Anthropic Claude Opus 4.8 在 OpenClaw 中預設保持思考關閉；當明確啟用自適應思考時，Anthropic 供應商擁有的 effort 預設值為 `high`。Claude 4.6 模型在未設定明確思考層級時，預設為 `adaptive`。

### `agents.defaults.cliBackends`

文字專用備援執行的選用命令列介面後端（無工具呼叫）。適合作為 API 供應商失敗時的備用方案。

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
- 當 `imageArg` 接受檔案路徑時，支援圖片傳遞。
- `reseedFromRawTranscriptWhenUncompacted: true` 讓後端能在第一個壓縮摘要存在前，從有界的原始 OpenClaw transcript 尾端恢復安全的
  已失效工作階段。驗證設定檔或憑證 epoch 變更
  仍絕不會進行原始重新播種。

### `agents.defaults.promptOverlays`

依模型系列套用到 OpenClaw 組裝提示表面的供應商無關提示覆蓋。GPT-5 系列模型 id 會在 OpenClaw/供應商路由之間接收共享行為契約；`personality` 只控制友善互動風格層。原生 Codex app-server 路由會保留 Codex 擁有的基礎/模型指令，而不是此 OpenClaw GPT-5 覆蓋，且 OpenClaw 會為原生執行緒停用 Codex 的內建 personality。

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
- `"off"` 只會停用友善層；帶標籤的 GPT-5 行為契約仍會保持啟用。
- 當這個共享設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

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
- `includeSystemPromptSection`：為 false 時，會從系統提示中省略 Heartbeat 區段，並跳過將 `HEARTBEAT.md` 注入 bootstrap context。預設：`true`。
- `suppressToolErrorWarnings`：為 true 時，在心跳偵測執行期間抑制工具錯誤警告 payload。
- `timeoutSeconds`：心跳偵測代理回合在中止前允許的最長秒數。未設定時，若已設定則使用 `agents.defaults.timeoutSeconds`，否則使用最高 600 秒的心跳偵測節奏上限。
- `directPolicy`：direct/DM 傳送政策。`allow`（預設）允許直接目標傳送。`block` 抑制直接目標傳送，並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，心跳偵測執行會使用輕量 bootstrap context，且只從工作區 bootstrap 檔案保留 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次心跳偵測都會在沒有先前對話歷史的新工作階段中執行。與 cron `sessionTarget: "isolated"` 相同的隔離模式。將每次心跳偵測的 token 成本從約 100K 降低到約 2-5K tokens。
- `skipWhenBusy`：為 true 時，心跳偵測執行會因該代理的額外忙碌 lanes 而延後：其自身以工作階段為鍵的子代理或巢狀命令工作。即使沒有此旗標，Cron lanes 一律會延後心跳偵測。
- 每個代理：設定 `agents.list[].heartbeat`。當任何代理定義 `heartbeat` 時，**只有那些代理**會執行心跳偵測。
- 心跳偵測會執行完整代理回合，較短的間隔會消耗更多 tokens。

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

- `mode`: `default` 或 `safeguard`（長歷史的分段摘要）。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `provider`: 已註冊壓縮提供者外掛的 ID。設定後，會呼叫提供者的 `summarize()`，而不是內建的 LLM 摘要。失敗時會退回內建摘要。設定提供者會強制 `mode: "safeguard"`。請參閱[壓縮](/zh-TW/concepts/compaction)。
- `timeoutSeconds`: OpenClaw 中止單次壓縮作業前允許的最長秒數。預設值：`180`。
- `keepRecentTokens`: 代理保留最近逐字轉錄尾端的切點預算。手動 `/compact` 在明確設定時會遵守此值；否則手動壓縮會是硬檢查點。
- `identifierPolicy`: `strict`（預設）、`off` 或 `custom`。`strict` 會在壓縮摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`: 當 `identifierPolicy=custom` 時使用的選用自訂識別碼保留文字。
- `qualityGuard`: 對 safeguard 摘要進行格式錯誤輸出重試檢查。在 safeguard 模式中預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`: 選用的工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果後、下一次模型呼叫前檢查上下文壓力。如果上下文已無法容納，會在提交提示前中止目前嘗試，並重用既有的預檢復原路徑來截斷工具結果，或進行壓縮後重試。可搭配 `default` 與 `safeguard` 壓縮模式使用。預設值：停用。
- `postCompactionSections`: 壓縮後要重新注入的選用 AGENTS.md H2/H3 區段名稱。未設定或設定為 `[]` 時會停用重新注入。明確設定 `["Session Startup", "Red Lines"]` 會啟用這一組，並保留舊版 `Every Session`/`Safety` 後援。只有在額外上下文值得承擔重複已在壓縮摘要中捕捉的專案指引風險時，才啟用此項。
- `model`: 僅用於壓縮摘要的選用 `provider/model-id`，或來自 `agents.defaults.models` 的裸別名。裸別名會在派送前解析；碰撞時，已設定的字面模型 ID 會保留優先權。當主要工作階段應保留一個模型、但壓縮摘要應在另一個模型上執行時使用；未設定時，壓縮會使用工作階段的主要模型。
- `maxActiveTranscriptBytes`: 選用的位元組閾值（`number` 或像 `"20mb"` 的字串），當作用中的 JSONL 超過閾值時，會在執行前觸發一般本機壓縮。需要 `truncateAfterCompaction`，讓成功壓縮能輪替到較小的後續轉錄。未設定或為 `0` 時停用。
- `notifyUser`: 當為 `true` 時，會在壓縮開始與完成時向使用者傳送簡短通知（例如「正在壓縮上下文...」與「壓縮完成」）。預設停用，讓壓縮保持靜默。
- `memoryFlush`: 自動壓縮前用於儲存持久記憶的靜默代理回合。當此維護回合應保留在本機模型上時，將 `model` 設為精確的提供者/模型，例如 `ollama/qwen3:8b`；此覆寫不會繼承作用中工作階段的後援鏈。工作區為唯讀時會略過。

### `agents.defaults.runRetries`

嵌入式代理執行階段外層執行迴圈的重試迭代邊界，用於防止失敗復原期間出現無限執行迴圈。請注意，此設定目前僅套用於嵌入式代理執行階段，不適用於 ACP 或命令列介面執行階段。

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

- `base`: 外層執行迴圈的基礎執行重試迭代次數。預設值：`24`。
- `perProfile`: 每個後援設定檔候選項額外授予的執行重試迭代次數。預設值：`8`。
- `min`: 執行重試迭代的絕對下限。預設值：`32`。
- `max`: 執行重試迭代的絕對上限，用於防止失控執行。預設值：`160`。

### `agents.defaults.contextPruning`

在傳送給 LLM 前，從記憶體中的上下文修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史。

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

<Accordion title="cache-ttl 模式行為">

- `mode: "cache-ttl"` 會啟用修剪流程。
- `ttl` 控制修剪多久後可再次執行（自上次快取觸碰後起算）。
- 修剪會先對過大的工具結果進行軟修剪，然後在需要時硬清除較舊的工具結果。
- `softTrimRatio` 與 `hardClearRatio` 接受從 `0.0` 到 `1.0` 的值；設定驗證會拒絕此範圍外的值。

**軟修剪**會保留開頭 + 結尾，並在中間插入 `...`。

**硬清除**會用佔位符取代整個工具結果。

注意事項：

- 圖片區塊絕不會被修剪/清除。
- 比率是以字元為基準（近似值），不是精確的 token 數。
- 如果助理訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

行為細節請參閱[工作階段修剪](/zh-TW/concepts/session-pruning)。

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
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及每帳號變體）。Signal/Slack/Discord/Google Chat 預設 `minChars: 1500`。
- `humanDelay`: 區塊回覆之間的隨機暫停。`natural` = 800–2500ms。每代理覆寫：`agents.list[].humanDelay`。

行為與分塊細節請參閱[串流](/zh-TW/concepts/streaming)。

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
- 每工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理的選用沙盒。完整指南請參閱[沙盒](/zh-TW/gateway/sandboxing)。

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

<Accordion title="沙盒詳細資料">

**後端：**

- `docker`: 本機 Docker 執行階段（預設）
- `ssh`: 通用 SSH 支援的遠端執行階段
- `openshell`: OpenShell 執行階段

選取 `backend: "openshell"` 時，執行階段專屬設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`: `user@host[:port]` 形式的 SSH 目標
- `command`: SSH 用戶端命令（預設值：`ssh`）
- `workspaceRoot`: 用於各範圍工作區的絕對遠端根目錄
- `identityFile` / `certificateFile` / `knownHostsFile`: 傳遞給 OpenSSH 的既有本機檔案
- `identityData` / `certificateData` / `knownHostsData`: 內嵌內容或 SecretRef，OpenClaw 會在執行階段具現化為暫存檔
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 主機金鑰政策調整項

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 沙盒工作階段開始前，會先從作用中的密鑰執行階段快照解析由 SecretRef 支援的 `*Data` 值

**SSH 後端行為：**

- 建立或重新建立後，會對遠端工作區植入一次
- 之後會保持遠端 SSH 工作區為標準來源
- 透過 SSH 路由 `exec`、檔案工具與媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙盒瀏覽器容器

**工作區存取：**

- `none`: 位於 `~/.openclaw/sandboxes` 底下的各範圍沙盒工作區
- `ro`: 沙盒工作區位於 `/workspace`，代理工作區以唯讀方式掛載於 `/agent`
- `rw`: 代理工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`: 每工作階段一個容器 + 工作區
- `agent`: 每代理一個容器 + 工作區（預設）
- `shared`: 共享容器與工作區（沒有跨工作階段隔離）

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

- `mirror`：執行前從本機植入遠端，執行後同步回來；本機工作區維持為權威來源
- `remote`：沙盒建立時只植入遠端一次，之後讓遠端工作區維持為權威來源

在 `remote` 模式中，在 OpenClaw 外部對主機本機所做的編輯，不會在植入步驟後自動同步到沙盒。
傳輸是透過 SSH 進入 OpenShell 沙盒，但外掛擁有沙盒生命週期與選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路出口、可寫入的根目錄、root 使用者。

**容器預設為 `network: "none"`** — 如果代理需要對外連線，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。`"container:<id>"` 預設會被封鎖，除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急破例）。
在作用中 OpenClaw 沙盒中的 Codex app-server 回合，會使用相同的出口設定來提供其原生程式碼模式網路存取。

**傳入附件** 會暫存到作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與每個代理的繫結會合併。

**沙盒化瀏覽器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 會注入到系統提示。不需要在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，且 OpenClaw 會發出短效權杖 URL（而不是在共享 URL 中暴露密碼）。

- `allowHostControl: false`（預設）會阻止沙盒化工作階段鎖定主機瀏覽器。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確想要全域橋接連線時，才設為 `bridge`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 入口限制為 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將額外的主機目錄掛載到沙盒瀏覽器容器中。設定時（包含 `[]`），它會取代瀏覽器容器的 `docker.binds`。
- 啟動預設值定義於 `scripts/sandbox-browser-entrypoint.sh`，並針對容器主機調校：
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
    預設啟用；如果 WebGL/3D 用途需要，可以用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - 如果你的工作流程依賴擴充功能，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    會重新啟用擴充功能。
  - `--renderer-process-limit=2` 可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更；設為 `0` 可使用 Chromium 的
    預設程序限制。
  - 當 `noSandbox` 啟用時，另外加上 `--no-sandbox`。
  - 預設值是容器映像基線；若要變更容器預設值，請使用含自訂
    entrypoint 的自訂瀏覽器映像。

</Accordion>

瀏覽器沙盒化與 `sandbox.docker.binds` 僅支援 Docker。

建置映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若沒有原始碼 checkout 而是透過 npm 安裝，請參閱 [沙盒化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌 `docker build` 命令。

### `agents.list`（每個代理的覆寫）

使用 `agents.list[].tts` 為代理指定自己的 TTS 供應商、語音、模型、
風格或自動 TTS 模式。代理區塊會深度合併到全域
`messages.tts` 之上，因此共用憑證可以保留在同一處，而個別
代理只覆寫所需的語音或供應商欄位。作用中代理的
覆寫會套用到自動語音回覆、`/tts audio`、`/tts status` 以及
`tts` 代理工具。請參閱 [文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)
以了解供應商範例與優先順序。

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

- `id`：穩定的代理 ID（必填）。
- `default`：設定多個時，第一個勝出（會記錄警告）。若未設定，清單中的第一個項目為預設。
- `model`：字串形式會設定嚴格的每代理主要模型，且沒有模型後援；物件形式 `{ primary }` 也同樣嚴格，除非你加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 讓該代理選擇加入後援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的排程作業仍會繼承預設後援，除非你設定 `fallbacks: []`。
- `params`：每個代理的串流參數，會合併到 `agents.defaults.models` 中選取的模型項目之上。用於代理特定的覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而不必複製整個模型目錄。
- `tts`：選用的每代理文字轉語音覆寫。此區塊會深度合併到 `messages.tts` 之上，因此請將共用供應商憑證與後援政策保留在 `messages.tts`，並在此只設定角色特定的值，例如供應商、語音、模型、風格或自動模式。
- `skills`：選用的每代理 Skills 允許清單。若省略，代理會在設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而非合併，且 `[]` 表示沒有 Skills。
- `thinkingDefault`：選用的每代理預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當沒有設定每則訊息或工作階段覆寫時，會覆寫此代理的 `agents.defaults.thinkingDefault`。所選供應商/模型設定檔會控制哪些值有效；對 Google Gemini 而言，`adaptive` 會保留供應商擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理預設推理可見性（`on | off | stream`）。當沒有設定每則訊息或工作階段推理覆寫時，會覆寫此代理的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理快速模式預設值（`"auto" | true | false`）。當沒有設定每則訊息或工作階段快速模式覆寫時套用。
- `models`：選用的每代理模型目錄/執行階段覆寫，依完整 `provider/model` ID 作為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理執行階段例外。
- `runtime`：選用的每代理執行階段描述元。當代理應預設為 ACP harness 工作階段時，使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- 本機工作區相對的 `identity.avatar` 圖片檔案限制為 2 MB。`http(s)` URL 與 `data:` URI 不會以本機檔案大小限制檢查。
- `identity` 會衍生預設值：`ackReaction` 來自 `emoji`，`mentionPatterns` 來自 `name`/`emoji`。
- `subagents.allowAgents`：已設定代理 ID 的允許清單，用於明確的 `sessions_spawn.agentId` 目標（`["*"]` = 任何已設定目標；預設：僅相同代理）。當應允許自我目標的 `agentId` 呼叫時，請包含請求者 ID。代理設定已刪除的過期項目會被 `sessions_spawn` 拒絕，並從 `agents_list` 省略；請執行 `openclaw doctor --fix` 清理它們，或在該目標應維持可產生並繼承預設值時，新增最小的 `agents.list[]` 項目。
- 沙盒繼承防護：如果請求者工作階段已沙盒化，`sessions_spawn` 會拒絕將在未沙盒化狀態執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選擇設定檔；預設：false）。

---

## 多代理路由

在一個閘道內執行多個隔離代理。請參閱 [多代理](/zh-TW/concepts/multi-agent)。

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

- `type`（選用）：`route` 用於一般路由（缺少 type 預設為 route），`acp` 用於持久 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任何帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；通道特定）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**決定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，沒有 peer/guild/team）
5. `match.accountId: "*"`（整個通道）
6. 預設代理

在每個層級中，第一個相符的 `bindings` 項目勝出。

對於 `type: "acp"` 項目，OpenClaw 會依精確對話身分（`match.channel` + 帳號 + `match.peer.id`）解析，且不使用上述路由繫結層級順序。

### 每代理存取設定檔

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

<Accordion title="No filesystem access (messaging only)">

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

請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)以了解優先順序細節。

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

<Accordion title="Session field details">

- **`scope`**：群組聊天情境的基礎工作階段分組策略。
  - `per-sender`（預設）：每位傳送者在一個頻道情境中取得隔離的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在預期共用情境時使用）。
- **`dmScope`**：DM 的分組方式。
  - `main`：所有 DM 共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 ID 隔離。
  - `per-channel-peer`：依頻道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應到帶有供應商前綴的對等端，以便跨頻道共用工作階段。像 `/dock_discord` 這類停駐命令會使用同一個對應，將作用中工作階段的回覆路由切換到另一個已連結的頻道對等端；請參閱[頻道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設政策。`daily` 會在本機時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。若兩者皆已設定，先到期者生效。每日重設新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設新鮮度使用 `lastInteractionAt`。心跳偵測、排程喚醒、exec 通知和閘道簿記等背景/系統事件寫入可以更新 `updatedAt`，但不會讓每日/閒置工作階段保持新鮮。
- **`resetByType`**：每種類型的覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天桶。
- **`agentToAgent.maxPingPongTurns`**：代理對代理交換期間，代理之間回覆往返的最大輪數（整數，範圍：`0`-`20`，預設：`5`）。`0` 會停用往返鏈結。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，含舊版 `dm` 別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則會生效。
- **`maintenance`**：工作階段儲存清理 + 保留控制。
  - `mode`：`enforce` 會套用清理且為預設值；`warn` 僅發出警告。
  - `pruneAfter`：過時項目的年齡截斷點（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的項目數上限（預設 `500`）。執行階段會使用小型高水位緩衝區批次寫入清理，以支援正式環境大小的上限；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - 短生命週期的閘道模型執行探測工作階段使用固定 `24h` 保留期，但清理會受壓力閘控：只有在達到工作階段項目維護/上限壓力時，才會移除過時的嚴格模型執行探測資料列。只有符合 `agent:*:explicit:model-run-<uuid>` 的嚴格明確探測鍵才符合資格；一般直接、群組、執行緒、排程、hook、心跳偵測、ACP 和子代理工作階段不會繼承此 24h 保留期。模型執行清理執行時，會在較廣泛的 `pruneAfter` 過時項目清理和 `maxEntries` 上限之前執行。
  - `rotateBytes`：已淘汰且會被忽略；`openclaw doctor --fix` 會從較舊的設定中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 轉錄封存的保留期。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式中會記錄警告；在 `enforce` 模式中會先移除最舊的成品/工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：執行緒綁定工作階段功能的全域預設值。
  - `enabled`：主預設開關（供應商可以覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設閒置自動取消聚焦的小時數（`0` 會停用；供應商可以覆寫）
  - `maxAgeHours`：預設硬性最長年齡的小時數（`0` 會停用；供應商可以覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 執行緒生成建立執行緒綁定工作階段的預設閘門。當執行緒綁定啟用時，預設為 `true`；供應商/帳號可以覆寫。
  - `defaultSpawnContext`：執行緒綁定生成的預設原生子代理情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

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

每個頻道/帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最具體者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止級聯。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明             | 範例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 簡短模型名稱     | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 供應商名稱       | `anthropic`                 |
| `{thinkingLevel}` | 目前思考等級     | `high`, `low`, `off`        |
| `{identity.name}` | 代理身分名稱     | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### Ack 反應

- 預設為作用中代理的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 每個頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分後備值。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Telegram、WhatsApp 和 iMessage 等支援反應的頻道上，回覆後移除 ack。
- `messages.statusReactions.enabled`：在 Slack、Discord、Telegram 和 WhatsApp 上啟用生命週期狀態反應。
  在 Slack 和 Discord 上，未設定時會在 ack 反應作用中時保持狀態反應啟用。
  在 Telegram 和 WhatsApp 上，請明確設為 `true` 以啟用生命週期狀態反應。
- `messages.statusReactions.emojis`：覆寫生命週期 emoji 鍵：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 只允許固定反應集合，因此不支援的已設定 emoji 會回退
  到該聊天最接近的受支援狀態變體。

### 傳入防抖

將同一傳送者快速傳送的純文字訊息批次合併為單一代理回合。媒體/附件會立即沖刷。控制命令會略過防抖。

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

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆寫本機偏好設定，`/tts status` 會顯示實際狀態。
- `summaryModel` 會覆寫自動摘要的 `agents.defaults.model.primary`。
- `modelOverrides` 預設啟用；`modelOverrides.allowProvider` 預設為 `false`（選擇性啟用）。
- API 金鑰會退回使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建語音提供者由外掛擁有。如果設定了 `plugins.allow`，請包含每個你想使用的 TTS 提供者外掛，例如 Edge TTS 的 `microsoft`。舊版 `edge` 提供者 ID 會作為 `microsoft` 的別名接受。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序是設定，接著是 `OPENAI_TTS_BASE_URL`，最後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為與 OpenAI 相容的 TTS 伺服器，並放寬模型/語音驗證。

---

## 交談

交談模式（macOS/iOS/Android）的預設值。

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

- 設定多個交談提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平交談鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix`，將已保存的設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會退回使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 後援僅在未設定交談 API 金鑰時套用。
- `providers.*.voiceAliases` 讓交談指令可以使用易懂名稱。
- `providers.mlx.modelId` 會選擇 macOS 本機 MLX 輔助程式使用的 Hugging Face 儲存庫。如果省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在存在時透過內建的 `openclaw-mlx-tts` 輔助程式執行，或透過 `PATH` 上的可執行檔執行；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI 交談即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw agent 執行的思考層級。保持未設定即可保留一般工作階段/模型行為。
- `consultFastMode` 會為 Control UI 交談即時諮詢設定一次性的快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 會設定 iOS/macOS 交談語音辨識使用的 BCP 47 語言環境 ID。保持未設定即可使用裝置預設值。
- `silenceTimeoutMs` 控制交談模式在使用者靜默後等待多久才傳送轉錄文字。未設定時會保留平台預設暫停視窗（`macOS 和 Android 上為 700 ms，iOS 上為 900 ms`）。
- `realtime.instructions` 會將面向提供者的系統指示附加到 OpenClaw 內建的即時提示，因此可以設定語音風格，而不會失去預設的 `openclaw_agent_consult` 指引。
- `realtime.consultRouting` 控制即時提供者產生沒有 `openclaw_agent_consult` 的最終使用者轉錄文字時，閘道轉送的後援：`provider-direct` 會保留直接的提供者回覆，而 `force-agent-consult` 會透過 OpenClaw 路由已完成的請求。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

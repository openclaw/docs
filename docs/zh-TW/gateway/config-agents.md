---
read_when:
    - 調整代理預設值（模型、思考、工作區、Heartbeat、媒體、Skills）
    - 設定多代理路由與綁定
    - 調整工作階段、訊息傳遞與交談模式行為
summary: 代理預設值、多代理路由、工作階段、訊息和 talk 設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-05-06T17:55:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0467260ad61f3d2a0b52cd952154d617a9341a588cdeda38f54bfae5985fa4f
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 與 `talk.*` 下的代理程式範圍組態鍵。關於頻道、工具、Gateway 執行階段，以及其他
頂層鍵，請參閱[組態參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

選用的儲存庫根目錄，顯示於系統提示詞的 Runtime 行中。如果未設定，OpenClaw 會從工作區往上逐層自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

選用的代理程式預設 Skills 允許清單，適用於未設定
`agents.list[].skills` 的代理程式。

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

- 省略 `agents.defaults.skills`，預設即可不限制 Skills。
- 省略 `agents.list[].skills` 以繼承預設值。
- 設定 `agents.list[].skills: []` 表示不使用 Skills。
- 非空的 `agents.list[].skills` 清單是該代理程式的最終集合；它
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用工作區啟動檔案的自動建立（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立選定的選用工作區檔案，同時仍寫入必要的啟動檔案。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 與 `IDENTITY.md`。

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

控制工作區啟動檔案何時注入系統提示詞。預設值：`"always"`。

- `"continuation-skip"`：安全的延續回合（在已完成的助理回應之後）會略過工作區啟動重新注入，降低提示詞大小。Heartbeat 執行與 Compaction 後重試仍會重建情境。
- `"never"`：在每個回合停用工作區啟動與情境檔案注入。僅對完全自行擁有提示詞生命週期的代理程式使用此選項（自訂情境引擎、建構自身情境的原生執行階段，或專門的免啟動工作流程）。Heartbeat 與 Compaction 復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的最大字元數。預設值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案注入的最大總字元數。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制啟動情境遭截斷時，代理程式可見的系統提示詞通知。
預設值：`"once"`。

- `"off"`：永不將截斷通知文字注入系統提示詞。
- `"once"`：每個唯一截斷簽章注入一次精簡通知（建議）。
- `"always"`：存在截斷時，每次執行都注入精簡通知。

詳細的原始/已注入計數與組態調整欄位，會保留在診斷資訊中，
例如情境/狀態報告與日誌；例行 WebChat 使用者/執行階段情境只會
取得精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 情境預算擁有權對照表

OpenClaw 有多個高容量提示詞/情境預算，且這些預算
刻意依子系統拆分，而不是全部流經一個通用
旋鈕。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  一般工作區啟動注入。
- `agents.defaults.startupContext.*`：
  一次性的重設/啟動模型執行前導內容，包含近期每日
  `memory/*.md` 檔案。裸聊天 `/new` 與 `/reset` 指令會
  確認重設，而不會叫用模型。
- `skills.limits.*`：
  注入系統提示詞的精簡 Skills 清單。
- `agents.defaults.contextLimits.*`：
  有界限的執行階段摘錄與注入的執行階段擁有區塊。
- `memory.qmd.limits.*`：
  已索引記憶體搜尋片段與注入大小。

只有當某個代理程式需要不同預算時，才使用相符的逐代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設/啟動模型執行時，第一回合注入的啟動前導內容。
裸聊天 `/new` 與 `/reset` 指令會確認重設，而不會叫用
模型，因此不會載入此前導內容。

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

有界限執行階段情境表面的共用預設值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：在加入截斷中繼資料與延續通知之前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設的 `memory_get` 行數視窗。
- `toolResultMaxChars`：用於持久化結果與溢位復原的即時工具結果上限。
- `postCompactionMaxChars`：Compaction 後重新整理注入期間使用的 AGENTS.md 摘錄上限。

#### `agents.list[].contextLimits`

共用 `contextLimits` 旋鈕的逐代理程式覆寫。省略的欄位會繼承
自 `agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系統提示詞之精簡 Skills 清單的全域上限。這
不會影響按需讀取 `SKILL.md` 檔案。

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

Skills 提示詞預算的逐代理程式覆寫。

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

在提供者呼叫之前，逐字稿/工具影像區塊中影像最長邊的最大像素大小。
預設值：`1200`。

較低的值通常會降低大量螢幕截圖執行中的視覺權杖用量與請求承載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系統提示詞情境的時區（不是訊息時間戳記）。會退回使用主機時區。

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
      },
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
  - 物件形式會設定主要模型加上依序排列的容錯移轉模型。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑用作其視覺模型設定。
  - 當選取/預設模型無法接受影像輸入時，也會用作備援路由。
  - 建議使用明確的 `provider/model` 參照。為了相容性也接受裸 ID；如果裸 ID 在 `models.providers.*.models` 中唯一符合已設定且具備影像能力的項目，OpenClaw 會將其限定到該提供者。若已設定的符合項目有歧義，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用影像生成能力，以及任何未來會生成影像的工具/Plugin 介面使用。
  - 典型值：用於原生 Gemini 影像生成的 `google/gemini-3.1-flash-image-preview`、用於 fal 的 `fal/fal-ai/flux/dev`、用於 OpenAI Images 的 `openai/gpt-image-2`，或用於透明背景 OpenAI PNG/WebP 輸出的 `openai/gpt-image-1.5`。
  - 如果直接選取提供者/模型，也要設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的影像生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用音樂生成能力和內建 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的音樂生成提供者。
  - 如果直接選取提供者/模型，也要設定相符的提供者驗證/API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共用影片生成能力和內建 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的影片生成提供者。
  - 如果直接選取提供者/模型，也要設定相符的提供者驗證/API 金鑰。
  - 隨附的 Qwen 影片生成提供者最多支援 1 個輸出影片、1 張輸入影像、4 個輸入影片、10 秒時長，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會退回使用 `imageModel`，再退回使用已解析的工作階段/預設模型。
- `pdfMaxBytesMb`：當呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中萃取備援模式會考慮的預設最大頁數。
- `verboseDefault`：代理程式的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和進度草稿工具列的詳細模式。值：`"explain"`（預設，精簡的人類可讀標籤）或 `"raw"`（可用時附加原始命令/細節）。每個代理程式的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理程式的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。每個代理程式的 `agents.list[].reasoningDefault` 會覆寫此預設值。只有在未設定每則訊息或工作階段的推理覆寫時，已設定的推理預設值才會套用於擁有者、已授權寄件者或操作員管理員 Gateway 內容。
- `elevatedDefault`：代理程式的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設：`"on"`。
- `model.primary`：格式為 `provider/model`（例如 API 金鑰存取使用 `openai/gpt-5.5`，Codex OAuth 使用 `openai-codex/gpt-5.5`）。如果省略提供者，OpenClaw 會先嘗試別名，再嘗試該確切模型 ID 的唯一已設定提供者符合項目，然後才退回使用已設定的預設提供者（已棄用的相容性行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回使用第一個已設定的提供者/模型，而不是顯示過時的已移除提供者預設值。
- `models`：為 `/model` 設定的模型目錄與允許清單。每個項目都可包含 `alias`（捷徑）和 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕會移除既有允許清單項目的替換。
  - 提供者範圍的設定/導覽流程會將選取的提供者模型合併到此對映，並保留已設定的無關提供者。
  - 對於直接 OpenAI Responses 模型，伺服器端 Compaction 會自動啟用。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫閾值。請參閱 [OpenAI 伺服器端 Compaction](/zh-TW/providers/openai#server-side-compaction-responses-api)。
- `params`：套用到所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基底）會被 `agents.defaults.models["provider/model"].params`（每模型）覆寫，接著 `agents.list[].params`（符合的代理程式 ID）會依鍵覆寫。如需詳細資訊，請參閱 [提示快取](/zh-TW/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：進階傳遞 JSON，會合併到 OpenAI 相容代理的 `api: "openai-completions"` 請求主體中。如果它與產生的請求鍵衝突，額外主體會勝出；非原生 completions 路由之後仍會移除 OpenAI 專用的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 相容的聊天範本引數，會合併到最上層 `api: "openai-completions"` 請求主體。對於關閉思考的 `vllm/nemotron-3-*`，隨附的 vLLM Plugin 會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。對於 vLLM Qwen 思考控制，請在該模型項目上將 `params.qwenThinkingFormat` 設為 `"chat-template"` 或 `"top-level"`。
- `compat.supportedReasoningEfforts`：每模型的 OpenAI 相容推理努力程度清單。對於真正接受它的自訂端點，請包含 `"xhigh"`；OpenClaw 接著會在命令選單、Gateway 工作階段列、工作階段修補驗證、代理程式 CLI 驗證，以及該已設定提供者/模型的 `llm-task` 驗證中公開 `/think xhigh`。當後端需要某個標準層級的提供者特定值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI 的保留思考選擇加入。啟用且思考開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false` 並重播先前的 `reasoning_content`；請參閱 [Z.AI 思考與保留思考](/zh-TW/providers/zai#thinking-and-preserved-thinking)。
- `agentRuntime`：預設低階代理程式執行階段政策。省略 id 時預設為 OpenClaw Pi。使用 `id: "pi"` 強制使用內建 PI harness，使用 `id: "auto"` 讓已註冊 Plugin harness 宣告支援的模型，且沒有符合項目時使用 PI；使用已註冊的 harness id，例如 `id: "codex"` 來要求該 harness，或使用支援的 CLI 後端別名，例如 `id: "claude-cli"`。明確的 Plugin 執行階段會在 harness 不可用或失敗時封閉失敗。請將模型參照維持為標準的 `provider/model`；透過執行階段設定選取 Codex、Claude CLI、Gemini CLI 和其他執行後端，而不是使用舊版執行階段提供者前綴。請參閱 [代理程式執行階段](/zh-TW/concepts/agent-runtimes)，了解這與提供者/模型選取有何不同。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image`，以及備援新增/移除命令）會儲存標準物件形式，並盡可能保留現有備援清單。
- `maxConcurrent`：跨工作階段的最大平行代理程式執行數（每個工作階段仍會序列化）。預設：4。

### `agents.defaults.agentRuntime`

`agentRuntime` 控制哪個低階執行器會執行代理程式回合。大多數
部署應保留預設的 OpenClaw Pi 執行階段。當受信任的
Plugin 提供原生 harness，例如隨附的 Codex app-server harness，
或你想使用支援的 CLI 後端，例如 Claude CLI 時，請使用它。關於心智
模型，請參閱 [代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`：`"auto"`、`"pi"`、已註冊的 Plugin harness id，或支援的 CLI 後端別名。隨附的 Codex Plugin 會註冊 `codex`；隨附的 Anthropic Plugin 提供 `claude-cli` CLI 後端。
- `id: "auto"` 會讓已註冊的 Plugin harness 宣告支援的回合，且沒有 harness 符合時使用 PI。明確的 Plugin 執行階段（例如 `id: "codex"`）需要該 harness，且若它不可用或失敗，會封閉失敗。
- 環境覆寫：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 會覆寫該行程的 `id`。
- 對於僅 Codex 的部署，請設定 `model: "openai/gpt-5.5"` 和 `agentRuntime.id: "codex"`。
- 對於 Claude CLI 部署，建議使用 `model: "anthropic/claude-opus-4-7"` 搭配 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/claude-opus-4-7` 模型參照仍可為相容性運作，但新設定應保持提供者/模型選取標準化，並將執行後端放在 `agentRuntime.id` 中。
- 較舊的執行階段政策鍵會由 `openclaw doctor --fix` 重寫為 `agentRuntime`。
- Harness 選擇會在第一次嵌入式執行後依工作階段 id 固定。設定/環境變更會影響新的或重設的工作階段，而不是既有逐字稿。具有逐字稿歷史但沒有記錄固定項目的舊版工作階段，會被視為已固定到 PI。`/status` 會回報有效執行階段，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 這只控制文字代理程式回合執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用其提供者/模型設定。

**內建別名縮寫**（只有在模型位於 `agents.defaults.models` 時才適用）：

| 別名                | 模型                                       |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

你設定的別名一律優先於預設值。

Z.AI GLM-4.x 模型會自動啟用思考模式，除非你設定 `--thinking off`，或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型預設會啟用 `tool_stream` 以進行工具呼叫串流。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 可停用。
Anthropic Claude 4.6 模型在未設定明確思考等級時，預設使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

文字專用備援執行的選用 CLI 後端（無工具呼叫）。在 API 供應商失敗時可作為備份。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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

- CLI 後端以文字為優先；工具一律停用。
- 設定 `sessionArg` 時支援工作階段。
- 當 `imageArg` 接受檔案路徑時，支援圖片透傳。

### `agents.defaults.systemPromptOverride`

以固定字串取代整個由 OpenClaw 組裝的系統提示。可設定在預設層級（`agents.defaults.systemPromptOverride`）或每個 agent（`agents.list[].systemPromptOverride`）。每個 agent 的值優先；空值或僅含空白字元的值會被忽略。適用於受控提示實驗。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

依模型家族套用、與供應商無關的提示覆蓋。GPT-5 家族模型 ID 會在各供應商間取得共用行為合約；`personality` 只控制友善互動風格層。

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
- 未設定此共用設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

週期性 Heartbeat 執行。

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
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
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
- `includeSystemPromptSection`：為 false 時，會從系統提示中省略 Heartbeat 區段，並略過將 `HEARTBEAT.md` 注入啟動情境。預設：`true`。
- `suppressToolErrorWarnings`：為 true 時，在 Heartbeat 執行期間抑制工具錯誤警告承載資料。
- `timeoutSeconds`：Heartbeat agent 回合中止前允許的最長秒數。未設定時使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/DM 傳送政策。`allow`（預設）允許傳送到直接目標。`block` 會抑制傳送到直接目標，並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，Heartbeat 執行會使用輕量啟動情境，並只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次 Heartbeat 都會在全新的工作階段中執行，沒有先前對話歷史。與 Cron `sessionTarget: "isolated"` 相同的隔離模式。將每次 Heartbeat 的 token 成本從約 100K 降至約 2-5K tokens。
- `skipWhenBusy`：為 true 時，Heartbeat 執行會因額外忙碌通道而延後：subagent 或巢狀命令工作。即使沒有此旗標，Cron 通道也一律會延後 Heartbeat。
- 每個 agent：設定 `agents.list[].heartbeat`。當任何 agent 定義 `heartbeat` 時，**只有那些 agent** 會執行 Heartbeat。
- Heartbeat 會執行完整 agent 回合 — 間隔越短會消耗越多 tokens。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
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

- `mode`：`default` 或 `safeguard`（長歷史的分塊摘要）。請參閱 [Compaction](/zh-TW/concepts/compaction)。
- `provider`：已註冊 Compaction 供應商 Plugin 的 ID。設定後，會呼叫供應商的 `summarize()`，而非內建 LLM 摘要。失敗時會回退到內建摘要。設定供應商會強制使用 `mode: "safeguard"`。請參閱 [Compaction](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：單次 Compaction 作業在 OpenClaw 中止前允許的最長秒數。預設：`900`。
- `keepRecentTokens`：Pi 切點預算，用於逐字保留最近的逐字稿尾端。手動 `/compact` 在明確設定時會遵守此值；否則手動 Compaction 是硬性檢查點。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在 Compaction 摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`：使用 `identifierPolicy=custom` 時的選用自訂識別碼保留文字。
- `qualityGuard`：針對 safeguard 摘要的格式錯誤輸出重試檢查。在 safeguard 模式中預設啟用；設定 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的 Pi 工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果之後、下一次模型呼叫之前檢查情境壓力。如果情境已無法容納，會在提交提示前中止目前嘗試，並重用既有的預檢復原路徑來截斷工具結果，或進行 compact 後重試。可搭配 `default` 和 `safeguard` 兩種 Compaction 模式使用。預設：停用。
- `postCompactionSections`：Compaction 後要重新注入的選用 AGENTS.md H2/H3 區段名稱。預設為 `["Session Startup", "Red Lines"]`；設為 `[]` 可停用重新注入。未設定或明確設定為該預設配對時，也會接受較舊的 `Every Session`/`Safety` 標題作為舊版備援。
- `model`：僅用於 Compaction 摘要的選用 `provider/model-id` 覆蓋。當主要工作階段應保留某個模型，但 Compaction 摘要應在另一個模型上執行時使用；未設定時，Compaction 會使用工作階段的主要模型。
- `maxActiveTranscriptBytes`：選用位元組閾值（`number` 或像 `"20mb"` 的字串），當作用中的 JSONL 超過閾值時，會在執行前觸發一般本機 Compaction。需要 `truncateAfterCompaction`，成功 Compaction 後才能輪替為較小的後續逐字稿。未設定或為 `0` 時停用。
- `notifyUser`：為 `true` 時，會在 Compaction 開始和完成時向使用者傳送簡短通知（例如「正在壓縮情境...」和「Compaction complete」）。預設停用，以讓 Compaction 保持靜默。
- `memoryFlush`：自動 Compaction 前的靜默 agentic 回合，用於儲存持久記憶。當此整理回合應保留在本機模型上時，將 `model` 設為精確的供應商/模型，例如 `ollama/qwen3:8b`；此覆蓋不會繼承作用中工作階段的備援鏈。工作區為唯讀時會略過。

### `agents.defaults.contextPruning`

在傳送給 LLM 前，從記憶體情境中修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史。

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
- `ttl` 控制修剪多久後可以再次執行（自上次快取觸碰後）。
- 修剪會先軟性裁剪過大的工具結果，然後在需要時硬性清除較舊的工具結果。

**軟性裁剪**會保留開頭 + 結尾，並在中間插入 `...`。

**硬性清除**會以預留位置取代整個工具結果。

注意事項：

- 圖片區塊永遠不會被裁剪/清除。
- 比率以字元為基準（近似值），不是精確 token 數。
- 如果 assistant 訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

行為詳細資訊請參閱 [工作階段修剪](/zh-TW/concepts/session-pruning)。

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
- 頻道覆蓋：`channels.<channel>.blockStreamingCoalesce`（以及每個帳號的變體）。Signal/Slack/Discord/Google Chat 預設為 `minChars: 1500`。
- `humanDelay`：區塊回覆之間的隨機暫停。`natural` = 800–2500ms。每個 agent 覆蓋：`agents.list[].humanDelay`。

行為與分塊詳細資訊請參閱 [串流](/zh-TW/concepts/streaming)。

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

- 預設值：直接聊天/提及使用 `instant`，未被提及的群組聊天使用 `message`。
- 每個工作階段覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入狀態指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

內嵌代理程式的選用沙箱化。完整指南請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

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

<Accordion title="沙箱詳細資訊">

**後端：**

- `docker`：本機 Docker 執行階段（預設）
- `ssh`：通用 SSH 支援的遠端執行階段
- `openshell`：OpenShell 執行階段

選取 `backend: "openshell"` 時，執行階段特定設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：採用 `user@host[:port]` 形式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於每個範圍工作區的絕對遠端根目錄
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在執行階段具體化為暫存檔案的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰原則控制項

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 由 SecretRef 支援的 `*Data` 值會在沙箱工作階段開始前，從作用中的祕密執行階段快照解析

**SSH 後端行為：**

- 建立或重新建立後，會為遠端工作區植入一次資料
- 接著讓遠端 SSH 工作區保持為權威來源
- 透過 SSH 路由 `exec`、檔案工具與媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙箱瀏覽器容器

**工作區存取：**

- `none`：位於 `~/.openclaw/sandboxes` 底下的每個範圍沙箱工作區
- `ro`：沙箱工作區位於 `/workspace`，代理程式工作區以唯讀方式掛載於 `/agent`
- `rw`：代理程式工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段各自的容器 + 工作區
- `agent`：每個代理程式一個容器 + 工作區（預設）
- `shared`：共用容器與工作區（無跨工作階段隔離）

**OpenShell Plugin 設定：**

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

- `mirror`：執行前從本機植入遠端，執行後同步回來；本機工作區保持為權威來源
- `remote`：建立沙箱時只植入遠端一次，接著讓遠端工作區保持為權威來源

在 `remote` 模式中，種子步驟之後，在 OpenClaw 外部進行的主機本機編輯不會自動同步進沙箱。
傳輸方式是透過 SSH 進入 OpenShell 沙箱，但 Plugin 擁有沙箱生命週期與選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出、可寫入根目錄、root 使用者。

**容器預設為 `network: "none"`** — 如果代理程式需要對外存取，請設為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急破窗），否則預設會封鎖 `"container:<id>"`。

**傳入附件** 會暫存到作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載其他主機目錄；全域與每個代理程式的綁定會合併。

**沙箱瀏覽器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 會注入系統提示。無需在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，OpenClaw 會發出短效權杖 URL（而不是在共用 URL 中暴露密碼）。

- `allowHostControl: false`（預設）會阻止沙箱工作階段鎖定主機瀏覽器。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確需要全域橋接連線時，才設為 `bridge`。
- `cdpSourceRange` 可選擇性地將容器邊界的 CDP 輸入限制為 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將其他主機目錄掛載進沙箱瀏覽器容器。設定後（包含 `[]`），它會取代瀏覽器容器的 `docker.binds`。
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
  - `--disable-3d-apis`、`--disable-software-rasterizer` 與 `--disable-gpu`
    預設啟用；如果 WebGL/3D 使用需要，可透過
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - 如果你的工作流程依賴擴充功能，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    會重新啟用擴充功能。
  - `--renderer-process-limit=2` 可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更；設為 `0` 可使用 Chromium
    預設程序限制。
  - 另外，當啟用 `noSandbox` 時會加上 `--no-sandbox`。
  - 預設值是容器映像基準；若要變更容器預設值，請使用帶有自訂
    進入點的自訂瀏覽器映像。

</Accordion>

瀏覽器沙箱化與 `sandbox.docker.binds` 僅適用於 Docker。

建置映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若 npm 安裝沒有原始碼 checkout，請參閱[沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌 `docker build` 命令。

### `agents.list`（每個代理程式覆寫）

使用 `agents.list[].tts` 為代理程式指定自己的 TTS 提供者、語音、模型、
風格或自動 TTS 模式。代理程式區塊會深度合併到全域
`messages.tts` 之上，因此共用憑證可保留在單一位置，而個別
代理程式只覆寫所需的語音或提供者欄位。作用中代理程式的
覆寫會套用到自動語音回覆、`/tts audio`、`/tts status`，以及
`tts` 代理程式工具。提供者範例與優先順序請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)。

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
        agentRuntime: { id: "auto" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`：設定多個時，第一個生效（會記錄警告）。如果未設定任何項目，清單中的第一個項目會作為預設值。
- `model`：字串形式會設定嚴格的每代理程式主要模型，且沒有模型備援；物件形式 `{ primary }` 也同樣嚴格，除非你加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 讓該代理程式選擇加入備援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的 Cron 作業仍會繼承預設備援，除非你設定 `fallbacks: []`。
- `params`：每代理程式的串流參數，會合併覆寫 `agents.defaults.models` 中選定的模型項目。可用於代理程式特定覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而不必複製整個模型目錄。
- `tts`：選用的每代理程式文字轉語音覆寫。此區塊會深度合併到 `messages.tts` 之上，因此請將共用的提供者憑證與備援政策保留在 `messages.tts`，並只在此設定角色特定值，例如提供者、語音、模型、風格或自動模式。
- `skills`：選用的每代理程式 Skills 允許清單。如果省略，代理程式會在已設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而不是合併，且 `[]` 表示不使用 Skills。
- `thinkingDefault`：選用的每代理程式預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每訊息或工作階段覆寫時，會覆寫此代理程式的 `agents.defaults.thinkingDefault`。選定的提供者/模型設定檔會控制哪些值有效；對於 Google Gemini，`adaptive` 會保留由提供者擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理程式預設推理可見性（`on | off | stream`）。當未設定每訊息或工作階段推理覆寫時，會覆寫此代理程式的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理程式快速模式預設值（`true | false`）。當未設定每訊息或工作階段快速模式覆寫時套用。
- `agentRuntime`：選用的每代理程式低階執行階段政策覆寫。使用 `{ id: "codex" }` 可讓一個代理程式僅使用 Codex，而其他代理程式在 `auto` 模式中保留預設 PI 備援。
- `runtime`：選用的每代理程式執行階段描述元。當代理程式應預設使用 ACP harness 工作階段時，使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- `identity` 會衍生預設值：從 `emoji` 衍生 `ackReaction`，從 `name`/`emoji` 衍生 `mentionPatterns`。
- `subagents.allowAgents`：明確 `sessions_spawn.agentId` 目標的代理程式 ID 允許清單（`["*"]` = 任意；預設：僅相同代理程式）。當應允許以自身為目標的 `agentId` 呼叫時，請包含請求者 ID。
- 沙箱繼承防護：如果請求者工作階段已沙箱化，`sessions_spawn` 會拒絕將在未沙箱化狀態下執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設值：false）。

---

## 多代理程式路由

在單一 Gateway 內執行多個隔離的代理程式。請參閱 [多代理程式](/zh-TW/concepts/multi-agent)。

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

- `type`（選用）：`route` 用於一般路由（缺少類型時預設為 route），`acp` 用於持久 ACP 對話繫結。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任意帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；通道特定）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**確定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，無 peer/guild/team）
5. `match.accountId: "*"`（通道範圍）
6. 預設代理程式

在每一層中，第一個相符的 `bindings` 項目生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確的對話身分解析（`match.channel` + 帳號 + `match.peer.id`），且不使用上述路由繫結層級順序。

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

<Accordion title="無檔案系統存取權（僅限訊息傳送）">

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

請參閱 [多代理 Sandbox 與工具](/zh-TW/tools/multi-agent-sandbox-tools) 以了解優先順序詳細資訊。

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
      mode: "warn", // warn | enforce
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

<Accordion title="工作階段欄位詳細資訊">

- **`scope`**：群組聊天情境的基礎工作階段分組策略。
  - `per-sender`（預設）：每位寄件者在頻道情境中取得隔離的工作階段。
  - `global`：頻道情境中的所有參與者共用單一工作階段（僅在意圖共用情境時使用）。
- **`dmScope`**：DM 的分組方式。
  - `main`：所有 DM 共用主工作階段。
  - `per-peer`：跨頻道依寄件者 ID 隔離。
  - `per-channel-peer`：依頻道 + 寄件者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 寄件者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 ID 對應到帶有提供者前綴的對等端，以便跨頻道共用工作階段。Dock 命令（例如 `/dock_discord`）會使用相同對應，將作用中工作階段的回覆路由切換到另一個已連結的頻道對等端；請參閱[頻道停駐](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設原則。`daily` 會在本地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。兩者都設定時，先到期者生效。每日重設的新鮮度使用工作階段列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。背景/系統事件寫入（例如 Heartbeat、Cron 喚醒、exec 通知與 Gateway 簿記）可以更新 `updatedAt`，但不會讓每日/閒置工作階段保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`mainKey`**：舊版欄位。執行階段一律對主要直接聊天儲存桶使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：代理對代理交換期間，代理之間的最大來回回覆輪數（整數，範圍：`0`–`5`）。`0` 會停用來回串接。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，含舊版 `dm` 別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則勝出。
- **`maintenance`**：工作階段儲存清理 + 保留控制。
  - `mode`：`warn` 只發出警告；`enforce` 會套用清理。
  - `pruneAfter`：過期項目的年齡截止值（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的項目數上限（預設 `500`）。執行階段會以小型高水位緩衝區批次寫入清理，供生產規模上限使用；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - `rotateBytes`：已棄用且會忽略；`openclaw doctor --fix` 會將它從較舊的設定中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿封存的保留期間。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式會記錄警告；在 `enforce` 模式會優先移除最舊的成品/工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：執行緒繫結工作階段功能的全域預設值。
  - `enabled`：主要預設開關（提供者可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設閒置自動取消聚焦的小時數（`0` 會停用；提供者可覆寫）
  - `maxAgeHours`：預設硬性最大年齡的小時數（`0` 會停用；提供者可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 與 ACP 執行緒產生建立執行緒繫結工作階段的預設閘門。啟用執行緒繫結時預設為 `true`；提供者/帳號可覆寫。
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
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
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

每個頻道/帳戶覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析順序（最具體者優先）：帳戶 → 頻道 → 全域。`""` 會停用並停止串接。`"auto"` 會衍生出 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明             | 範例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 簡短模型名稱     | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供者名稱       | `anthropic`                 |
| `{thinkingLevel}` | 目前的思考層級   | `high`, `low`, `off`        |
| `{identity.name}` | Agent 身分名稱   | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認反應

- 預設為作用中 Agent 的 `identity.emoji`，否則為 `"👀"`。設定為 `""` 可停用。
- 每個頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳戶 → 頻道 → `messages.ackReaction` → 身分備援。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Telegram、WhatsApp 和 BlueBubbles 等支援反應的頻道上，回覆後移除確認反應。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上啟用生命週期狀態反應。
  在 Slack 和 Discord 上，未設定時，若確認反應已啟用，狀態反應會保持啟用。
  在 Telegram 上，請明確設定為 `true` 以啟用生命週期狀態反應。

### 傳入防抖

將同一寄件者快速傳入的純文字訊息批次合併為單一 Agent 回合。媒體/附件會立即送出。控制命令會略過防抖。

### TTS（文字轉語音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
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
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制預設的自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆寫本機偏好設定，而 `/tts status` 會顯示實際狀態。
- `summaryModel` 會針對自動摘要覆寫 `agents.defaults.model.primary`。
- `modelOverrides` 預設為啟用；`modelOverrides.allowProvider` 預設為 `false`（選擇加入）。
- API 金鑰會退回使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 內建語音提供者由 Plugin 擁有。若已設定 `plugins.allow`，請包含你要使用的每個 TTS 提供者 Plugin，例如 Edge TTS 的 `microsoft`。舊版 `edge` 提供者 ID 可作為 `microsoft` 的別名使用。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，最後是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將其視為相容 OpenAI 的 TTS 伺服器，並放寬模型/語音驗證。

---

## Talk

Talk 模式（macOS/iOS/Android）的預設值。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的某個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容性使用。執行 `openclaw doctor --fix` 可將已保存的設定改寫為 `talk.providers.<provider>`。
- 語音 ID 會退回使用 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受純文字字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 備援僅在未設定 Talk API 金鑰時套用。
- `providers.*.voiceAliases` 可讓 Talk 指令使用易讀名稱。
- `providers.mlx.modelId` 會選取 macOS 本機 MLX 輔助程式使用的 Hugging Face repo。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在內建的 `openclaw-mlx-tts` 輔助程式存在時透過它執行，否則使用 `PATH` 上的可執行檔；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `speechLocale` 會設定 iOS/macOS Talk 語音辨識使用的 BCP 47 語系 ID。保持未設定即可使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者靜音後等待多久才送出逐字稿。未設定時會保留平台預設的暫停時間範圍（`macOS 和 Android 為 700 ms，iOS 為 900 ms`）。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

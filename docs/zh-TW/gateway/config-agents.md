---
read_when:
    - 調整代理程式預設值（模型、思考、工作區、Heartbeat、媒體、Skills）
    - 設定多代理路由與繫結
    - 調整工作階段、訊息傳遞和對話模式行為
summary: 代理預設值、多代理路由、工作階段、訊息與 talk 設定
title: 設定 — 代理程式
x-i18n:
    generated_at: "2026-05-10T19:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 455c4f0db2ab42b699f920f90639f18d0d370ed4f98a5fa664f154318db99a11
    source_path: gateway/config-agents.md
    workflow: 16
---

代理程式範圍的設定鍵位於 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 之下。若要了解通道、工具、Gateway 執行階段及其他
頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 代理程式預設值

### `agents.defaults.workspace`

預設值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

顯示在系統提示詞 Runtime 行中的選用儲存庫根目錄。若未設定，OpenClaw 會從工作區向上走訪來自動偵測。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

對於未設定 `agents.list[].skills` 的代理程式，選用的預設 Skills 允許清單。

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

- 省略 `agents.defaults.skills`，即可預設不限制 Skills。
- 省略 `agents.list[].skills`，即可繼承預設值。
- 設定 `agents.list[].skills: []` 表示沒有 Skills。
- 非空的 `agents.list[].skills` 清單就是該代理程式的最終集合；它
  不會與預設值合併。

### `agents.defaults.skipBootstrap`

停用自動建立工作區啟動檔案（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

略過建立所選的選用工作區檔案，同時仍寫入必要的啟動檔案。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的接續回合（在已完成的助理回應之後）會略過重新注入工作區啟動內容，以減少提示詞大小。Heartbeat 執行和 Compaction 後重試仍會重建內容脈絡。
- `"never"`：在每個回合停用工作區啟動內容與內容檔案注入。僅將此用於完全自行管理提示詞生命週期的代理程式（自訂內容脈絡引擎、建構自身內容脈絡的原生執行階段，或不需要啟動內容的特殊工作流程）。Heartbeat 和 Compaction 復原回合也會略過注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每個工作區啟動檔案在截斷前的字元數上限。預設值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作區啟動檔案注入的總字元數上限。預設值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制啟動內容脈絡被截斷時，代理程式可見的系統提示詞通知。
預設值：`"once"`。

- `"off"`：永不將截斷通知文字注入系統提示詞。
- `"once"`：針對每個唯一的截斷簽章注入一次精簡通知（建議）。
- `"always"`：當存在截斷時，每次執行都注入精簡通知。

詳細的原始/已注入計數與設定調校欄位會保留在診斷資訊中，
例如內容脈絡/狀態報告和記錄；例行 WebChat 使用者/執行階段內容脈絡只會
取得精簡的復原通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 內容脈絡預算擁有權對照表

OpenClaw 有多個高容量提示詞/內容脈絡預算，而且它們是
刻意依子系統分開，而不是全都流經單一通用
旋鈕。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  一般工作區啟動內容注入。
- `agents.defaults.startupContext.*`：
  一次性的重設/啟動模型執行前置內容，包括最近的每日
  `memory/*.md` 檔案。單純聊天 `/new` 和 `/reset` 命令會
  在不叫用模型的情況下確認重設。
- `skills.limits.*`：
  注入系統提示詞的精簡 Skills 清單。
- `agents.defaults.contextLimits.*`：
  有界的執行階段摘錄與注入的執行階段擁有區塊。
- `memory.qmd.limits.*`：
  已索引記憶體搜尋片段與注入大小。

只有在某個代理程式需要不同預算時，才使用相符的逐代理程式覆寫：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重設/啟動模型執行時注入的第一回合啟動前置內容。
單純聊天 `/new` 和 `/reset` 命令會在不叫用
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

有界執行階段內容脈絡介面的共用預設值。

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

- `memoryGetMaxChars`：在加入截斷
  中繼資料與接續通知之前，預設的 `memory_get` 摘錄上限。
- `memoryGetDefaultLines`：省略 `lines` 時，預設的 `memory_get` 行視窗。
- `toolResultMaxChars`：用於持久化結果與
  溢位復原的即時工具結果上限。
- `postCompactionMaxChars`：在 Compaction 後
  重新整理注入期間使用的 AGENTS.md 摘錄上限。

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

注入系統提示詞的精簡 Skills 清單全域上限。這
不會影響依需求讀取 `SKILL.md` 檔案。

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

在供應商呼叫之前，逐字稿/工具影像區塊中最長影像邊的最大像素大小。
預設值：`1200`。

較低的值通常會降低大量截圖執行的視覺權杖使用量與請求承載大小。
較高的值會保留更多視覺細節。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系統提示詞內容脈絡的時區（不是訊息時間戳記）。會回退到主機時區。

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
  - 物件形式設定主要模型加上依序排列的故障轉移模型。
- `imageModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `image` 工具路徑作為其視覺模型設定使用。
  - 當選取的/預設模型無法接受圖片輸入時，也會作為備援路由使用。
  - 建議使用明確的 `provider/model` 參照。為了相容性也接受裸 ID；如果裸 ID 可唯一匹配 `models.providers.*.models` 中已設定且支援圖片的項目，OpenClaw 會將其限定到該提供者。若已設定的匹配有歧義，則需要明確的提供者前綴。
- `imageGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共享的圖片生成能力，以及任何未來會生成圖片的工具/Plugin 表面使用。
  - 典型值：用於原生 Gemini 圖片生成的 `google/gemini-3.1-flash-image-preview`、用於 fal 的 `fal/fal-ai/flux/dev`、用於 OpenAI Images 的 `openai/gpt-image-2`，或用於透明背景 OpenAI PNG/WebP 輸出的 `openai/gpt-image-1.5`。
  - 如果直接選取提供者/模型，也請設定相符的提供者驗證（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的圖片生成提供者。
- `musicGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共享的音樂生成能力和內建 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的音樂生成提供者。
  - 如果直接選取提供者/模型，也請設定相符的提供者驗證/API 金鑰。
- `videoGenerationModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由共享的影片生成能力和內建 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推斷有驗證支援的提供者預設值。它會先嘗試目前的預設提供者，接著依 provider-id 順序嘗試其餘已註冊的影片生成提供者。
  - 如果直接選取提供者/模型，也請設定相符的提供者驗證/API 金鑰。
  - 隨附的 Qwen 影片生成提供者最多支援 1 個輸出影片、1 張輸入圖片、4 個輸入影片、10 秒長度，以及提供者層級的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 選項。
- `pdfModel`：接受字串（`"provider/model"`）或物件（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用於模型路由。
  - 如果省略，PDF 工具會退回使用 `imageModel`，接著退回使用已解析的工作階段/預設模型。
- `pdfMaxBytesMb`：在呼叫時未傳入 `maxBytesMb` 時，`pdf` 工具的預設 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中擷取備援模式會考慮的預設頁數上限。
- `verboseDefault`：代理的預設詳細程度。值：`"off"`、`"on"`、`"full"`。預設：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和進度草稿工具行的詳細模式。值：`"explain"`（預設，精簡的人類標籤）或 `"raw"`（可用時附加原始命令/詳細資訊）。個別代理的 `agents.list[].toolProgressDetail` 會覆寫此預設值。
- `reasoningDefault`：代理的預設推理可見性。值：`"off"`、`"on"`、`"stream"`。個別代理的 `agents.list[].reasoningDefault` 會覆寫此預設值。已設定的推理預設值只會在沒有設定逐訊息或工作階段推理覆寫時，套用於擁有者、授權寄件者，或 operator-admin Gateway 情境。
- `elevatedDefault`：代理的預設提升輸出層級。值：`"off"`、`"on"`、`"ask"`、`"full"`。預設：`"on"`。
- `model.primary`：格式為 `provider/model`（例如用於 OpenAI API 金鑰或 Codex OAuth 存取的 `openai/gpt-5.5`）。如果省略提供者，OpenClaw 會先嘗試別名，再嘗試該確切模型 ID 的唯一已設定提供者匹配，然後才退回使用已設定的預設提供者（已棄用的相容行為，因此建議使用明確的 `provider/model`）。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回使用第一個已設定的提供者/模型，而不是顯示過時且已移除提供者的預設值。
- `models`：已設定的模型目錄，以及 `/model` 的允許清單。每個項目可包含 `alias`（捷徑）和 `params`（提供者特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 項目，例如 `"openai-codex/*": {}` 或 `"vllm/*": {}`，可顯示所選提供者的所有已發現模型，而不必手動列出每個模型 ID。
  - 安全編輯：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 來新增項目。除非傳入 `--replace`，否則 `config set` 會拒絕會移除既有允許清單項目的替換。
  - 以提供者為範圍的設定/上線流程會將所選提供者模型合併到此映射中，並保留已設定的無關提供者。
  - 對於直接的 OpenAI Responses 模型，會自動啟用伺服器端 Compaction。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆寫閾值。請參閱 [OpenAI 伺服器端 Compaction](/zh-TW/providers/openai#server-side-compaction-responses-api)。
- `params`：套用到所有模型的全域預設提供者參數。設定於 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合併優先順序（設定）：`agents.defaults.params`（全域基底）會被 `agents.defaults.models["provider/model"].params`（逐模型）覆寫，接著 `agents.list[].params`（匹配的代理 ID）會依鍵覆寫。詳情請參閱 [提示快取](/zh-TW/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：進階傳遞 JSON，會合併到 OpenAI 相容代理的 `api: "openai-completions"` 請求本文中。如果它與產生的請求鍵衝突，額外本文會勝出；非原生 completions 路由之後仍會移除僅 OpenAI 使用的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 相容的聊天範本引數，會合併到頂層 `api: "openai-completions"` 請求本文中。對於關閉 thinking 的 `vllm/nemotron-3-*`，隨附的 vLLM Plugin 會自動傳送 `enable_thinking: false` 和 `force_nonempty_content: true`；明確的 `chat_template_kwargs` 會覆寫產生的預設值，而 `extra_body.chat_template_kwargs` 仍具有最終優先權。對於 vLLM Qwen thinking 控制，請在該模型項目上將 `params.qwenThinkingFormat` 設為 `"chat-template"` 或 `"top-level"`。
- `compat.thinkingFormat`：OpenAI 相容的 thinking 承載格式。針對 Qwen 風格的頂層 `enable_thinking` 使用 `"qwen"`，或針對支援請求層級聊天範本 kwargs 的 Qwen 系列後端（例如 vLLM），在 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 會將停用 thinking 映射為 `false`，並將啟用 thinking 映射為 `true`。
- `compat.supportedReasoningEfforts`：逐模型的 OpenAI 相容推理強度清單。對於確實接受它的自訂端點，請包含 `"xhigh"`；接著 OpenClaw 會針對該已設定的提供者/模型，在命令選單、Gateway 工作階段列、工作階段修補驗證、代理 CLI 驗證，以及 `llm-task` 驗證中公開 `/think xhigh`。當後端需要標準層級的提供者特定值時，請使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：僅限 Z.AI、需選擇啟用的保留 thinking。啟用且 thinking 開啟時，OpenClaw 會傳送 `thinking.clear_thinking: false`，並重播先前的 `reasoning_content`；請參閱 [Z.AI thinking 與保留 thinking](/zh-TW/providers/zai#thinking-and-preserved-thinking)。
- `localService`：提供者層級的選用程序管理器，用於本機/自託管模型伺服器。當選取的模型屬於該提供者時，OpenClaw 會探測 `healthUrl`（或 `baseUrl + "/models"`），如果端點離線，則使用 `args` 啟動 `command`，最多等待 `readyTimeoutMs`，然後傳送模型請求。`command` 必須是絕對路徑。`idleStopMs: 0` 會讓程序維持存活直到 OpenClaw 結束；正值則會在該數量的閒置毫秒後停止由 OpenClaw 產生的程序。請參閱 [本機模型服務](/zh-TW/gateway/local-model-services)。
- 執行階段政策屬於提供者或模型，而不是 `agents.defaults`。針對提供者範圍規則使用 `models.providers.<provider>.agentRuntime`，或針對模型特定規則使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI 提供者上的 OpenAI 代理模型預設會選取 Codex。
- 會變更這些欄位的設定寫入器（例如 `/models set`、`/models set-image` 和備援新增/移除命令）會儲存標準物件形式，並盡可能保留既有備援清單。
- `maxConcurrent`：跨工作階段的代理平行執行上限（每個工作階段仍會序列化）。預設：4。

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
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`：`"auto"`、`"pi"`、已註冊的 Plugin harness ID，或支援的 CLI 後端別名。隨附的 Codex Plugin 會註冊 `codex`；隨附的 Anthropic Plugin 會提供 `claude-cli` CLI 後端。
- `id: "auto"` 允許已註冊的 Plugin harness 宣告支援的回合，並在沒有 harness 匹配時使用 PI。明確的 Plugin 執行階段（例如 `id: "codex"`）需要該 harness，且如果它不可用或失敗，會以關閉狀態失敗。
- 整個代理的執行階段鍵是舊版功能。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、工作階段執行階段釘選，以及 `OPENCLAW_AGENT_RUNTIME` 會被執行階段選擇忽略。執行 `openclaw doctor --fix` 以移除過時值。
- OpenAI 代理模型預設使用 Codex harness；當你想明確指定時，提供者/模型 `agentRuntime.id: "codex"` 仍然有效。
- 對於 Claude CLI 部署，建議使用 `model: "anthropic/claude-opus-4-7"` 加上以模型為範圍的 `agentRuntime.id: "claude-cli"`。舊版 `claude-cli/claude-opus-4-7` 模型參照仍可基於相容性運作，但新設定應保持提供者/模型選擇為標準形式，並將執行後端放在提供者/模型執行階段政策中。
- 這只控制文字代理回合執行。媒體生成、視覺、PDF、音樂、影片和 TTS 仍使用其提供者/模型設定。

**內建別名簡寫**（只有在模型位於 `agents.defaults.models` 中時才適用）：

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

你設定的別名一律優先於預設值。

Z.AI GLM-4.x 模型會自動啟用思考模式，除非你設定 `--thinking off` 或自行定義 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型預設啟用 `tool_stream` 以串流工具呼叫。將 `agents.defaults.models["zai/<model>"].params.tool_stream` 設為 `false` 即可停用。
Anthropic Claude 4.6 模型在未設定明確思考層級時，預設使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

用於純文字後援執行的選用 CLI 後端（不含工具呼叫）。當 API 供應商失敗時，可作為備援使用。

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

- CLI 後端以文字優先；工具一律停用。
- 設定 `sessionArg` 時支援工作階段。
- 當 `imageArg` 接受檔案路徑時，支援圖片透傳。
- `reseedFromRawTranscriptWhenUncompacted: true` 允許後端在第一個 Compaction 摘要存在之前，從有界的原始 OpenClaw 轉錄尾端復原安全的已失效工作階段。Auth 設定檔或憑證世代變更仍一律不會使用原始內容重新播種。

### `agents.defaults.systemPromptOverride`

以固定字串取代整個由 OpenClaw 組裝的系統提示。可在預設層級（`agents.defaults.systemPromptOverride`）或個別 agent（`agents.list[].systemPromptOverride`）設定。個別 agent 的值優先；空值或僅含空白的值會被忽略。適合用於受控的提示實驗。

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

依模型系列套用、與供應商無關的提示覆蓋。GPT-5 系列模型 ID 會跨供應商接收共用的行為契約；`personality` 只控制友善互動風格層。

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
- `"off"` 只會停用友善層；已標記的 GPT-5 行為契約仍會啟用。
- 當這個共用設定未設定時，仍會讀取舊版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

定期 Heartbeat 執行。

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

- `every`：時長字串（ms/s/m/h）。預設：`30m`（API 金鑰 auth）或 `1h`（OAuth auth）。設為 `0m` 可停用。
- `includeSystemPromptSection`：為 false 時，會從系統提示省略 Heartbeat 區段，並略過將 `HEARTBEAT.md` 注入啟動內容。預設：`true`。
- `suppressToolErrorWarnings`：為 true 時，會在 Heartbeat 執行期間抑制工具錯誤警告 payload。
- `timeoutSeconds`：Heartbeat agent 回合在中止前允許的最長秒數。未設定時使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/DM 傳送政策。`allow`（預設）允許傳送至直接目標。`block` 會抑制傳送至直接目標，並發出 `reason=dm-blocked`。
- `lightContext`：為 true 時，Heartbeat 執行會使用輕量啟動內容，並且只保留工作區啟動檔案中的 `HEARTBEAT.md`。
- `isolatedSession`：為 true 時，每次 Heartbeat 都會在沒有既有對話歷史的新工作階段中執行。與 cron `sessionTarget: "isolated"` 相同的隔離模式。將每次 Heartbeat 的 token 成本從約 100K 降至約 2-5K token。
- `skipWhenBusy`：為 true 時，Heartbeat 執行會在額外忙碌通道上延後：subagent 或巢狀命令工作。Cron 通道一律會延後 Heartbeat，即使沒有此旗標也是如此。
- 個別 agent：設定 `agents.list[].heartbeat`。當任何 agent 定義 `heartbeat` 時，**只有那些 agent** 會執行 Heartbeat。
- Heartbeat 會執行完整的 agent 回合；較短間隔會消耗更多 token。

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

- `mode`：`default` 或 `safeguard`（用於長歷史的分塊摘要）。請參閱 [Compaction](/zh-TW/concepts/compaction)。
- `provider`：已註冊 Compaction 供應商 Plugin 的 ID。設定後，會呼叫供應商的 `summarize()`，而不是使用內建 LLM 摘要。失敗時會退回內建方式。設定供應商會強制 `mode: "safeguard"`。請參閱 [Compaction](/zh-TW/concepts/compaction)。
- `timeoutSeconds`：單次 Compaction 操作在 OpenClaw 中止前允許的最長秒數。預設：`900`。
- `keepRecentTokens`：Pi 切點預算，用於逐字保留最近的轉錄尾端。手動 `/compact` 會在明確設定時遵循此值；否則手動 Compaction 是硬性檢查點。
- `identifierPolicy`：`strict`（預設）、`off` 或 `custom`。`strict` 會在 Compaction 摘要期間前置內建的不透明識別碼保留指引。
- `identifierInstructions`：當 `identifierPolicy=custom` 時使用的選用自訂識別碼保留文字。
- `qualityGuard`：針對 safeguard 摘要的格式異常輸出重試檢查。Safeguard 模式預設啟用；設為 `enabled: false` 可略過稽核。
- `midTurnPrecheck`：選用的 Pi 工具迴圈壓力檢查。當 `enabled: true` 時，OpenClaw 會在附加工具結果之後、下一次模型呼叫之前檢查內容壓力。如果內容已無法容納，會在提交提示前中止目前嘗試，並重用既有的預檢復原路徑來截斷工具結果，或執行 Compaction 並重試。可搭配 `default` 和 `safeguard` Compaction 模式使用。預設：停用。
- `postCompactionSections`：Compaction 後要重新注入的選用 AGENTS.md H2/H3 區段名稱。預設為 `["Session Startup", "Red Lines"]`；設為 `[]` 可停用重新注入。未設定或明確設為該預設配對時，舊版 `Every Session`/`Safety` 標題也會作為舊版後援接受。
- `model`：僅用於 Compaction 摘要的選用 `provider/model-id` 覆寫。當主工作階段應保留一個模型，但 Compaction 摘要應在另一個模型上執行時使用；未設定時，Compaction 會使用工作階段的主要模型。
- `maxActiveTranscriptBytes`：選用位元組門檻（`number` 或像 `"20mb"` 的字串），當作用中 JSONL 超過門檻時，會在執行前觸發一般本機 Compaction。需要 `truncateAfterCompaction`，讓成功的 Compaction 可輪替至較小的後續轉錄。未設定或為 `0` 時停用。
- `notifyUser`：為 `true` 時，會在 Compaction 開始與完成時向使用者傳送簡短通知（例如「正在壓縮內容...」與「Compaction 完成」）。預設停用，以保持 Compaction 靜默。
- `memoryFlush`：自動 Compaction 前的靜默 agentic 回合，用於儲存持久記憶。當此維護回合應留在本機模型上時，將 `model` 設為精確的 provider/model，例如 `ollama/qwen3:8b`；該覆寫不會繼承作用中工作階段的後援鏈。工作區為唯讀時略過。

### `agents.defaults.contextPruning`

在傳送至 LLM 前，從記憶體內內容修剪**舊工具結果**。**不會**修改磁碟上的工作階段歷史。

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

- `mode: "cache-ttl"` 會啟用修剪通過。
- `ttl` 控制修剪在上次快取觸碰後多久才能再次執行。
- 修剪會先軟修剪過大的工具結果，接著在需要時硬清除更舊的工具結果。

**軟修剪**會保留開頭 + 結尾，並在中間插入 `...`。

**硬清除**會用 placeholder 取代整個工具結果。

注意事項：

- 圖片區塊一律不會被修剪/清除。
- 比率以字元為基準（近似值），不是精確的 token 數。
- 如果助理訊息少於 `keepLastAssistants`，會略過修剪。

</Accordion>

請參閱 [工作階段修剪](/zh-TW/concepts/session-pruning) 以了解行為詳細資訊。

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
- 頻道覆寫：`channels.<channel>.blockStreamingCoalesce`（以及每個帳號的變體）。Signal/Slack/Discord/Google Chat 預設為 `minChars: 1500`。
- `humanDelay`：區塊回覆之間的隨機暫停。`natural` = 800–2500ms。每個代理的覆寫：`agents.list[].humanDelay`。

請參閱[串流](/zh-TW/concepts/streaming)，了解行為與分塊詳細資訊。

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
- 每個工作階段的覆寫：`session.typingMode`、`session.typingIntervalSeconds`。

請參閱[輸入指示器](/zh-TW/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式代理的選用沙盒化。完整指南請參閱[沙盒化](/zh-TW/gateway/sandboxing)。

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

<Accordion title="沙盒詳細資訊">

**後端：**

- `docker`：本機 Docker 執行階段（預設）
- `ssh`：通用 SSH 後端遠端執行階段
- `openshell`：OpenShell 執行階段

選取 `backend: "openshell"` 時，執行階段特定設定會移至
`plugins.entries.openshell.config`。

**SSH 後端設定：**

- `target`：採用 `user@host[:port]` 形式的 SSH 目標
- `command`：SSH 用戶端命令（預設：`ssh`）
- `workspaceRoot`：用於每個範圍工作區的絕對遠端根目錄
- `identityFile` / `certificateFile` / `knownHostsFile`：傳遞給 OpenSSH 的現有本機檔案
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 於執行階段具現化為暫存檔的內嵌內容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主機金鑰策略旋鈕

**SSH 驗證優先順序：**

- `identityData` 優先於 `identityFile`
- `certificateData` 優先於 `certificateFile`
- `knownHostsData` 優先於 `knownHostsFile`
- 以 SecretRef 為後端的 `*Data` 值會在沙盒工作階段啟動前，從作用中的密鑰執行階段快照解析

**SSH 後端行為：**

- 建立或重新建立後，播種一次遠端工作區
- 接著保持遠端 SSH 工作區為標準來源
- 透過 SSH 路由 `exec`、檔案工具與媒體路徑
- 不會自動將遠端變更同步回主機
- 不支援沙盒瀏覽器容器

**工作區存取：**

- `none`：位於 `~/.openclaw/sandboxes` 底下、依範圍區分的沙盒工作區
- `ro`：沙盒工作區位於 `/workspace`，代理工作區以唯讀方式掛載於 `/agent`
- `rw`：代理工作區以讀寫方式掛載於 `/workspace`

**範圍：**

- `session`：每個工作階段一個容器與工作區
- `agent`：每個代理一個容器與工作區（預設）
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

- `mirror`：執行前從本機播種遠端，執行後同步回來；本機工作區保持為標準來源
- `remote`：建立沙盒時播種一次遠端，接著保持遠端工作區為標準來源

在 `remote` 模式中，於播種步驟後，在 OpenClaw 外部進行的主機本機編輯不會自動同步至沙盒。
傳輸方式是透過 SSH 進入 OpenShell 沙盒，但 Plugin 擁有沙盒生命週期與選用的鏡像同步。

**`setupCommand`** 會在容器建立後執行一次（透過 `sh -lc`）。需要網路輸出、可寫根目錄與 root 使用者。

**容器預設為 `network: "none"`**，如果代理需要對外存取，請設定為 `"bridge"`（或自訂橋接網路）。
`"host"` 會被封鎖。`"container:<id>"` 預設會被封鎖，除非你明確設定
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（緊急破除限制）。

**傳入附件** 會暫存至作用中工作區的 `media/inbound/*`。

**`docker.binds`** 會掛載額外的主機目錄；全域與每個代理的綁定會合併。

**沙盒化瀏覽器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 會注入系統提示。不需要在 `openclaw.json` 中設定 `browser.enabled`。
noVNC 觀察者存取預設使用 VNC 驗證，且 OpenClaw 會發出短效權杖 URL（而不是在共用 URL 中公開密碼）。

- `allowHostControl: false`（預設）會阻止沙盒化工作階段將主機瀏覽器設為目標。
- `network` 預設為 `openclaw-sandbox-browser`（專用橋接網路）。只有在你明確想要全域橋接連線時，才設定為 `bridge`。
- `cdpSourceRange` 可選擇性地在容器邊緣將 CDP 輸入限制為 CIDR 範圍（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只會將額外的主機目錄掛載到沙盒瀏覽器容器。設定時（包含 `[]`），它會取代瀏覽器容器的 `docker.binds`。
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
    預設為啟用；如果 WebGL/3D 使用需要，可透過
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 停用。
  - 如果你的工作流程依賴擴充功能，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 會重新啟用擴充功能。
  - `--renderer-process-limit=2` 可透過
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 變更；設定為 `0` 可使用 Chromium 的
    預設程序限制。
  - 啟用 `noSandbox` 時，另加 `--no-sandbox`。
  - 預設值是容器映像基準；若要變更容器預設值，請使用具自訂
    進入點的自訂瀏覽器映像。

</Accordion>

瀏覽器沙盒化與 `sandbox.docker.binds` 僅限 Docker。

建置映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

若是沒有原始碼 checkout 的 npm 安裝，請參閱[沙盒化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌 `docker build` 命令。

### `agents.list`（每個代理覆寫）

使用 `agents.list[].tts` 可為代理指定自己的 TTS 提供者、語音、模型、
風格或自動 TTS 模式。代理區塊會深度合併到全域
`messages.tts` 之上，因此共用憑證可以保留在同一處，而個別
代理只覆寫其需要的語音或提供者欄位。作用中代理的
覆寫會套用至自動語音回覆、`/tts audio`、`/tts status` 和
`tts` 代理工具。請參閱[文字轉語音](/zh-TW/tools/tts#per-agent-voice-overrides)，
了解提供者範例與優先順序。

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

- `id`：穩定的代理 ID（必填）。
- `default`：設定多個時，第一個生效（會記錄警告）。若未設定，清單第一筆項目為預設值。
- `model`：字串形式會設定嚴格的每代理主要模型，且沒有模型備援；物件形式 `{ primary }` 也同樣嚴格，除非你加入 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 可讓該代理選擇啟用備援，或使用 `{ primary, fallbacks: [] }` 明確指定嚴格行為。只覆寫 `primary` 的 Cron 工作仍會繼承預設備援，除非你設定 `fallbacks: []`。
- `params`：每代理串流參數，會合併覆蓋 `agents.defaults.models` 中選取的模型項目。使用此項可設定代理專屬覆寫，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而不必複製整個模型目錄。
- `tts`：選用的每代理文字轉語音覆寫。此區塊會深度合併到 `messages.tts` 上，因此請將共用的提供者憑證與備援政策保留在 `messages.tts`，並在此只設定角色專屬值，例如提供者、語音、模型、風格或自動模式。
- `skills`：選用的每代理 Skills 允許清單。若省略，代理會在設定時繼承 `agents.defaults.skills`；明確清單會取代預設值而不是合併，且 `[]` 表示不使用 Skills。
- `thinkingDefault`：選用的每代理預設思考層級（`off | minimal | low | medium | high | xhigh | adaptive | max`）。當未設定每則訊息或工作階段覆寫時，會覆寫此代理的 `agents.defaults.thinkingDefault`。選取的提供者／模型設定檔會控制哪些值有效；對 Google Gemini 而言，`adaptive` 會保留提供者擁有的動態思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：選用的每代理預設推理可見性（`on | off | stream`）。當未設定每則訊息或工作階段推理覆寫時，會覆寫此代理的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：選用的每代理快速模式預設值（`true | false`）。在未設定每則訊息或工作階段快速模式覆寫時套用。
- `models`：選用的每代理模型目錄／執行階段覆寫，以完整 `provider/model` ID 作為鍵。使用 `models["provider/model"].agentRuntime` 設定每代理執行階段例外。
- `runtime`：選用的每代理執行階段描述元。當代理應預設使用 ACP harness 工作階段時，請使用 `type: "acp"` 搭配 `runtime.acp` 預設值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作區相對路徑、`http(s)` URL 或 `data:` URI。
- `identity` 會衍生預設值：從 `emoji` 衍生 `ackReaction`，從 `name`／`emoji` 衍生 `mentionPatterns`。
- `subagents.allowAgents`：用於明確 `sessions_spawn.agentId` 目標的代理 ID 允許清單（`["*"]` = 任意；預設：僅相同代理）。當應允許自我目標 `agentId` 呼叫時，請包含請求者 ID。
- 沙盒繼承防護：若請求者工作階段已沙盒化，`sessions_spawn` 會拒絕將以非沙盒方式執行的目標。
- `subagents.requireAgentId`：為 true 時，封鎖省略 `agentId` 的 `sessions_spawn` 呼叫（強制明確選取設定檔；預設：false）。

---

## 多代理路由

在同一個 Gateway 內執行多個隔離代理。請參閱[多代理](/zh-TW/concepts/multi-agent)。

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

- `type`（選用）：一般路由使用 `route`（缺少 type 時預設為 route），持久 ACP 對話繫結使用 `acp`。
- `match.channel`（必填）
- `match.accountId`（選用；`*` = 任意帳號；省略 = 預設帳號）
- `match.peer`（選用；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（選用；頻道專屬）
- `acp`（選用；僅適用於 `type: "acp"`）：`{ mode, label, cwd, backend }`

**決定性比對順序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精確，無 peer/guild/team）
5. `match.accountId: "*"`（整個頻道）
6. 預設代理

在每一層級內，第一個相符的 `bindings` 項目生效。

對於 `type: "acp"` 項目，OpenClaw 會依精確對話身分（`match.channel` + 帳號 + `match.peer.id`）解析，且不使用上方的路由繫結層級順序。

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

請參閱[多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools)了解優先順序詳細資訊。

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
  - `per-sender`（預設）：每個傳送者在某個頻道情境中取得隔離的工作階段。
  - `global`：某個頻道情境中的所有參與者共用單一工作階段（僅在有意共用情境時使用）。
- **`dmScope`**：DM 的分組方式。
  - `main`：所有 DM 共用主要工作階段。
  - `per-peer`：跨頻道依傳送者 id 隔離。
  - `per-channel-peer`：依頻道 + 傳送者隔離（建議用於多使用者收件匣）。
  - `per-account-channel-peer`：依帳號 + 頻道 + 傳送者隔離（建議用於多帳號）。
- **`identityLinks`**：將標準 id 對應到帶有提供者前綴的對等端，以便跨頻道共用工作階段。像 `/dock_discord` 這類 Dock 指令會使用同一張對應表，將作用中工作階段的回覆路由切換到另一個已連結的頻道對等端；請參閱[頻道停靠](/zh-TW/concepts/channel-docking)。
- **`reset`**：主要重設政策。`daily` 會在本地時間 `atHour` 重設；`idle` 會在 `idleMinutes` 後重設。兩者都設定時，先到期者優先。每日重設的新鮮度使用工作階段資料列的 `sessionStartedAt`；閒置重設的新鮮度使用 `lastInteractionAt`。背景/系統事件寫入，例如 Heartbeat、Cron 喚醒、exec 通知和 Gateway 簿記，可能會更新 `updatedAt`，但不會讓每日/閒置工作階段保持新鮮。
- **`resetByType`**：依類型覆寫（`direct`、`group`、`thread`）。舊版 `dm` 可作為 `direct` 的別名。
- **`mainKey`**：舊版欄位。執行階段一律使用 `"main"` 作為主要直接聊天儲存桶。
- **`agentToAgent.maxPingPongTurns`**：代理程式對代理程式交換期間，代理程式之間的最大來回回覆輪數（整數，範圍：`0`–`5`）。`0` 會停用乒乓鏈結。
- **`sendPolicy`**：依 `channel`、`chatType`（`direct|group|channel`，含舊版 `dm` 別名）、`keyPrefix` 或 `rawKeyPrefix` 比對。第一個拒絕規則優先。
- **`maintenance`**：工作階段儲存清理 + 保留控制。
  - `mode`：`warn` 只發出警告；`enforce` 會套用清理。
  - `pruneAfter`：過期項目的年齡截止值（預設 `30d`）。
  - `maxEntries`：`sessions.json` 中的項目數上限（預設 `500`）。執行階段寫入會針對生產規模上限使用小型高水位緩衝區進行批次清理；`openclaw sessions cleanup --enforce` 會立即套用上限。
  - `rotateBytes`：已淘汰且會被忽略；`openclaw doctor --fix` 會從較舊的設定中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 文字記錄封存的保留時間。預設為 `pruneAfter`；設為 `false` 可停用。
  - `maxDiskBytes`：選用的工作階段目錄磁碟預算。在 `warn` 模式會記錄警告；在 `enforce` 模式會先移除最舊的成品/工作階段。
  - `highWaterBytes`：預算清理後的選用目標。預設為 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：執行緒綁定工作階段功能的全域預設值。
  - `enabled`：主要預設開關（提供者可覆寫；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：預設閒置自動取消聚焦的小時數（`0` 會停用；提供者可覆寫）
  - `maxAgeHours`：預設硬性最長年齡的小時數（`0` 會停用；提供者可覆寫）
  - `spawnSessions`：從 `sessions_spawn` 和 ACP 執行緒產生項建立執行緒綁定工作工作階段的預設閘門。啟用執行緒綁定時預設為 `true`；提供者/帳號可覆寫。
  - `defaultSpawnContext`：執行緒綁定產生項的預設原生子代理程式情境（`"fork"` 或 `"isolated"`）。預設為 `"fork"`。

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

依頻道/帳號覆寫：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最特定者優先）：帳號 → 頻道 → 全域。`""` 會停用並停止串接。`"auto"` 會衍生 `[{identity.name}]`。

**範本變數：**

| 變數              | 說明                 | 範例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 簡短模型名稱         | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型識別碼       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供者名稱           | `anthropic`                 |
| `{thinkingLevel}` | 目前思考層級         | `high`, `low`, `off`        |
| `{identity.name}` | 代理程式身分名稱     | （與 `"auto"` 相同）        |

變數不區分大小寫。`{think}` 是 `{thinkingLevel}` 的別名。

### 確認反應

- 預設為作用中代理程式的 `identity.emoji`，否則為 `"👀"`。設為 `""` 可停用。
- 依頻道覆寫：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析順序：帳號 → 頻道 → `messages.ackReaction` → 身分後備。
- 範圍：`group-mentions`（預設）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在支援反應的頻道（例如 Slack、Discord、Telegram、WhatsApp 和 iMessage）上回覆後移除確認。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上啟用生命週期狀態反應。
  在 Slack 和 Discord 上，未設定時會在確認反應作用中時保持啟用狀態反應。
  在 Telegram 上，請明確設為 `true` 以啟用生命週期狀態反應。

### 傳入防抖

將來自同一傳送者的快速純文字訊息批次合併成單一代理程式輪次。媒體/附件會立即清空批次。控制指令會略過防抖。

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

- `auto` 控制預設自動 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆寫本機偏好設定，`/tts status` 會顯示有效狀態。
- `summaryModel` 會覆寫 `agents.defaults.model.primary` 以用於自動摘要。
- `modelOverrides` 預設啟用；`modelOverrides.allowProvider` 預設為 `false`（選擇加入）。
- API 金鑰會後備到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 隨附的語音提供者由 Plugin 擁有。如果設定了 `plugins.allow`，請包含你想使用的每個 TTS 提供者 Plugin，例如 Edge TTS 的 `microsoft`。舊版 `edge` 提供者 id 可作為 `microsoft` 的別名。
- `providers.openai.baseUrl` 會覆寫 OpenAI TTS 端點。解析順序為設定，接著是 `OPENAI_TTS_BASE_URL`，再接著是 `https://api.openai.com/v1`。
- 當 `providers.openai.baseUrl` 指向非 OpenAI 端點時，OpenClaw 會將它視為 OpenAI 相容的 TTS 伺服器，並放寬模型/語音驗證。

---

## Talk

Talk 模式的預設值（macOS/iOS/Android）。

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
          voice: "cedar",
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

- 設定多個 Talk 提供者時，`talk.provider` 必須符合 `talk.providers` 中的一個鍵。
- 舊版扁平 Talk 鍵（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）僅供相容使用。執行 `openclaw doctor --fix` 可將持久化設定重寫為 `talk.providers.<provider>`。
- 語音 ID 會後備到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字串或 SecretRef 物件。
- `ELEVENLABS_API_KEY` 後備僅在未設定 Talk API 金鑰時套用。
- `providers.*.voiceAliases` 讓 Talk 指令可使用易懂名稱。
- `providers.mlx.modelId` 會選取 macOS 本機 MLX 輔助程式使用的 Hugging Face 儲存庫。若省略，macOS 會使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放會在存在時透過隨附的 `openclaw-mlx-tts` 輔助程式執行，或透過 `PATH` 上的可執行檔執行；`OPENCLAW_MLX_TTS_BIN` 會覆寫開發用的輔助程式路徑。
- `consultThinkingLevel` 控制 Control UI Talk 即時 `openclaw_agent_consult` 呼叫背後完整 OpenClaw 代理程式執行的思考層級。保持未設定可保留一般工作階段/模型行為。
- `consultFastMode` 會為 Control UI Talk 即時諮詢設定一次性快速模式覆寫，而不變更工作階段的一般快速模式設定。
- `speechLocale` 設定 iOS/macOS Talk 語音辨識使用的 BCP 47 語言區域 id。保持未設定會使用裝置預設值。
- `silenceTimeoutMs` 控制 Talk 模式在使用者靜默後等待多久才傳送文字記錄。未設定時會保留平台預設暫停時間窗（`macOS 和 Android 上為 700 ms，iOS 上為 900 ms`）。
- `realtime.instructions` 會將面向提供者的系統指示附加到 OpenClaw 內建的即時提示，因此可設定語音風格而不會失去預設的 `openclaw_agent_consult` 指引。

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 所有其他設定鍵
- [設定](/zh-TW/gateway/configuration) — 常見工作與快速設定
- [設定範例](/zh-TW/gateway/configuration-examples)

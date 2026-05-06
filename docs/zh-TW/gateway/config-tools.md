---
read_when:
    - 設定 `tools.*` 政策、允許清單或實驗性功能
    - 註冊自訂提供者或覆寫基底 URL
    - 設定 OpenAI 相容的自架端點
sidebarTitle: Tools and custom providers
summary: 工具設定（政策、實驗性切換選項、由提供者支援的工具）和自訂提供者/基礎 URL 設定
title: 設定 — 工具與自訂提供者
x-i18n:
    generated_at: "2026-05-06T02:47:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7230354339e14ce25ad1fc232528634d92ba86125d908450c1ee5e04b4434e9
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 設定鍵和自訂提供者 / base-URL 設定。若要了解代理、頻道和其他頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 工具

### 工具設定檔

`tools.profile` 會在套用 `tools.allow`/`tools.deny` 前設定基礎允許清單：

<Note>
本機入門流程會在未設定時，將新的本機設定預設為 `tools.profile: "coding"`（既有的明確設定檔會保留）。
</Note>

| 設定檔      | 包含                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 僅 `session_status`                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 不限制（與未設定相同）                                                                                                          |

### 工具群組

| 群組               | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` 可作為 `exec` 的別名）                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                     |
| `group:openclaw`   | 所有內建工具（不含提供者 Plugins）                                                                                       |

### `tools.allow` / `tools.deny`

全域工具允許/拒絕政策（拒絕優先）。不區分大小寫，支援 `*` 萬用字元。即使 Docker 沙箱關閉也會套用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是不同的工具 ID。`allow: ["write"]` 也會為相容模型啟用 `apply_patch`，但 `deny: ["write"]` 不會拒絕 `apply_patch`。若要封鎖所有檔案變更，請拒絕 `group:fs` 或明確列出每個會變更檔案的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

進一步限制特定提供者或模型的工具。順序：基礎設定檔 → 提供者設定檔 → 允許/拒絕。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制沙箱外的提升權限 exec 存取：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 個別代理覆寫（`agents.list[].tools.elevated`）只能進一步限制。
- `/elevated on|off|ask|full` 會依工作階段儲存狀態；行內指令只套用到單一訊息。
- 提升權限的 `exec` 會繞過沙箱，並使用設定的逃逸路徑（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具迴圈安全檢查**預設停用**。設定 `enabled: true` 可啟用偵測。設定可以在 `tools.loopDetection` 中全域定義，並在每個代理的 `agents.list[].tools.loopDetection` 覆寫。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  保留用於迴圈分析的最大工具呼叫歷史記錄。
</ParamField>
<ParamField path="warningThreshold" type="number">
  重複無進展模式的警告臨界值。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用於封鎖嚴重迴圈的較高重複臨界值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何無進展執行的硬性停止臨界值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  對重複的相同工具/相同引數呼叫發出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  對已知輪詢工具（`process.poll`、`command_status` 等）發出警告/封鎖。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  對交替出現的無進展配對模式發出警告/封鎖。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，驗證會失敗。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

設定傳入媒體理解（圖片/音訊/影片）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="媒體模型項目欄位">
    **提供者項目**（`type: "provider"` 或省略）：

    - `provider`：API 提供者 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆寫
    - `profile` / `preferredProfile`：`auth-profiles.json` 設定檔選取

    **CLI 項目**（`type: "cli"`）：

    - `command`：要執行的可執行檔
    - `args`：範本化引數（支援 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 會將已棄用的 `{input}` 預留位置遷移到 `{{MediaPath}}`）

    **通用欄位：**

    - `capabilities`：選用清單（`image`、`audio`、`video`）。預設值：`openai`/`anthropic`/`minimax` → 圖片，`google` → 圖片+音訊+影片，`groq` → 音訊。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：個別項目覆寫。
    - `tools.media.image.timeoutSeconds` 和相符的圖片模型 `timeoutSeconds` 項目，也會在代理呼叫明確的 `image` 工具時套用。
    - 失敗時會退回到下一個項目。

    提供者驗證會遵循標準順序：`auth-profiles.json` → 環境變數 → `models.providers.*.apiKey`。

    **非同步完成欄位：**

    - `asyncCompletion.directSend`：已棄用的相容性旗標。完成的非同步媒體任務會維持由請求者工作階段介入，讓代理接收結果、決定如何告知使用者，並在來源傳遞需要時使用訊息工具。

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制哪些工作階段可由工作階段工具（`sessions_list`、`sessions_history`、`sessions_send`）設為目標。

預設值：`tree`（目前工作階段 + 由它產生的工作階段，例如子代理）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可見性範圍">
    - `self`：只有目前工作階段金鑰。
    - `tree`：目前工作階段 + 目前工作階段產生的工作階段（子代理）。
    - `agent`：屬於目前代理 ID 的任何工作階段（如果你在相同代理 ID 下執行每位傳送者各自的工作階段，可能包含其他使用者）。
    - `all`：任何工作階段。跨代理目標設定仍需要 `tools.agentToAgent`。
    - 沙箱限制：當目前工作階段在沙箱中，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 時，即使 `tools.sessions.visibility="all"`，可見性也會被強制為 `tree`。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的內嵌附件支援。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="附件注意事項">
    - 附件僅支援 `runtime: "subagent"`。ACP 執行階段會拒絕附件。
    - 檔案會實體化到子工作區的 `.openclaw/attachments/<uuid>/`，並包含 `.manifest.json`。
    - 附件內容會自動從逐字稿持久化中修訂移除。
    - Base64 輸入會以嚴格的字母表/填補檢查和解碼前大小防護進行驗證。
    - 目錄的檔案權限為 `0700`，檔案的權限為 `0600`。
    - 清理會遵循 `cleanup` 策略：`delete` 一律移除附件；`keep` 只在 `retainOnSessionKeep: true` 時保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

實驗性內建工具旗標。除非套用嚴格代理式 GPT-5 自動啟用規則，否則預設關閉。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`：為非瑣碎的多步驟工作追蹤啟用結構化 `update_plan` 工具。
- 預設：`false`，除非 OpenAI 或 OpenAI Codex GPT-5 系列執行的 `agents.defaults.embeddedPi.executionContract`（或每個代理的覆寫）設為 `"strict-agentic"`。設為 `true` 可在該範圍外強制開啟工具，或設為 `false` 即使對嚴格代理式 GPT-5 執行也保持關閉。
- 啟用時，系統提示也會加入使用指引，讓模型只在大量工作時使用它，並最多只保留一個步驟為 `in_progress`。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：產生的子代理的預設模型。若省略，子代理會繼承呼叫者的模型。
- `allowAgents`：當請求代理未設定自己的 `subagents.allowAgents` 時，`sessions_spawn` 的目標代理 ID 預設允許清單（`["*"]` = 任意；預設：僅相同代理）。
- `runTimeoutSeconds`：當工具呼叫省略 `runTimeoutSeconds` 時，`sessions_spawn` 的預設逾時（秒）。`0` 表示沒有逾時。
- 每個子代理的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自訂供應商與基礎 URL

OpenClaw 使用內建模型目錄。透過設定中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 加入自訂供應商。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="驗證與合併優先順序">
    - 對自訂驗證需求使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆寫代理設定根目錄（或使用舊版環境變數別名 `PI_CODING_AGENT_DIR`）。
    - 相符供應商 ID 的合併優先順序：
      - 非空的代理 `models.json` `baseUrl` 值優先。
      - 非空的代理 `apiKey` 值僅在該供應商於目前設定/驗證設定檔內容中未由 SecretRef 管理時優先。
      - 由 SecretRef 管理的供應商 `apiKey` 值會從來源標記（環境變數參照的 `ENV_VAR_NAME`，檔案/exec 參照的 `secretref-managed`）重新整理，而不是持久化已解析的祕密。
      - 由 SecretRef 管理的供應商標頭值會從來源標記（環境變數參照的 `secretref-env:ENV_VAR_NAME`，檔案/exec 參照的 `secretref-managed`）重新整理。
      - 空白或缺少的代理 `apiKey`/`baseUrl` 會退回使用設定中的 `models.providers`。
      - 相符模型的 `contextWindow`/`maxTokens` 會使用明確設定與隱含目錄值之間較高的值。
      - 相符模型的 `contextTokens` 會在存在時保留明確的執行階段上限；可用它限制有效內容，而不變更原生模型中繼資料。
      - 當你想讓設定完整重寫 `models.json` 時，請使用 `models.mode: "replace"`。
      - 標記持久化以來源為權威：標記會從作用中的來源設定快照（解析前）寫入，而不是從已解析的執行階段祕密值寫入。

  </Accordion>
</AccordionGroup>

### 供應商欄位詳細資料

<AccordionGroup>
  <Accordion title="頂層目錄">
    - `models.mode`：供應商目錄行為（`merge` 或 `replace`）。
    - `models.providers`：以供應商 ID 為鍵的自訂供應商對應。
      - 安全編輯：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 進行附加式更新。除非傳入 `--replace`，否則 `config set` 會拒絕破壞性替換。

  </Accordion>
  <Accordion title="供應商連線與驗證">
    - `models.providers.*.api`：請求配接器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。對於自行託管的 `/v1/chat/completions` 後端，例如 MLX、vLLM、SGLang，以及多數 OpenAI 相容本機伺服器，請使用 `openai-completions`。具有 `baseUrl` 但沒有 `api` 的自訂供應商預設為 `openai-completions`；只有在後端支援 `/v1/responses` 時才設定 `openai-responses`。
    - `models.providers.*.apiKey`：供應商認證（偏好使用 SecretRef/環境變數替換）。
    - `models.providers.*.auth`：驗證策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：當模型項目未設定 `contextWindow` 時，此供應商底下模型的預設原生內容視窗。
    - `models.providers.*.contextTokens`：當模型項目未設定 `contextTokens` 時，此供應商底下模型的預設有效執行階段內容上限。
    - `models.providers.*.maxTokens`：當模型項目未設定 `maxTokens` 時，此供應商底下模型的預設輸出權杖上限。
    - `models.providers.*.timeoutSeconds`：選用的每供應商模型 HTTP 請求逾時秒數，包含連線、標頭、本文與總請求中止處理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：對 Ollama + `openai-completions`，將 `options.num_ctx` 注入請求（預設：`true`）。
    - `models.providers.*.authHeader`：在需要時強制透過 `Authorization` 標頭傳輸認證。
    - `models.providers.*.baseUrl`：上游 API 基礎 URL。
    - `models.providers.*.headers`：用於 Proxy/租戶路由的額外靜態標頭。

  </Accordion>
  <Accordion title="請求傳輸覆寫">
    `models.providers.*.request`：模型供應商 HTTP 請求的傳輸覆寫。

    - `request.headers`：額外標頭（與供應商預設值合併）。值接受 SecretRef。
    - `request.auth`：驗證策略覆寫。模式：`"provider-default"`（使用供應商的內建驗證）、`"authorization-bearer"`（搭配 `token`）、`"header"`（搭配 `headerName`、`value`、選用的 `prefix`）。
    - `request.proxy`：HTTP Proxy 覆寫。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 環境變數）、`"explicit-proxy"`（搭配 `url`）。兩種模式都接受選用的 `tls` 子物件。
    - `request.tls`：直接連線的 TLS 覆寫。欄位：`ca`、`cert`、`key`、`passphrase`（全都接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：設為 `true` 時，當 DNS 解析到私有、CGNAT 或類似範圍時，允許透過供應商 HTTP 擷取防護對 `baseUrl` 使用 HTTPS（供操作員選擇加入信任的自行託管 OpenAI 相容端點）。Loopback 模型供應商串流 URL，例如 `localhost`、`127.0.0.1` 和 `[::1]` 會自動允許，除非明確設為 `false`；LAN、tailnet 和私有 DNS 主機仍需要選擇加入。WebSocket 會使用相同的 `request` 來處理標頭/TLS，但不使用該擷取 SSRF 閘門。預設為 `false`。

  </Accordion>
  <Accordion title="模型目錄項目">
    - `models.providers.*.models`：明確的供應商模型目錄項目。
    - `models.providers.*.models.*.input`：模型輸入模態。文字專用模型使用 `["text"]`，原生圖片/視覺模型使用 `["text", "image"]`。只有在所選模型標記為支援圖片時，圖片附件才會注入代理回合。
    - `models.providers.*.models.*.contextWindow`：原生模型內容視窗中繼資料。這會覆寫該模型的供應商層級 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：選用的執行階段內容上限。這會覆寫供應商層級 `contextTokens`；當你想要比模型原生 `contextWindow` 更小的有效內容預算時使用；`openclaw models list` 會在兩個值不同時顯示兩者。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：選用的相容性提示。對於 `api: "openai-completions"` 且具有非空非原生 `baseUrl`（主機不是 `api.openai.com`）的情況，OpenClaw 會在執行階段強制將此值設為 `false`。空白/省略的 `baseUrl` 會保留預設 OpenAI 行為。
    - `models.providers.*.models.*.compat.requiresStringContent`：字串專用 OpenAI 相容聊天端點的選用相容性提示。設為 `true` 時，OpenClaw 會在傳送請求前，將純文字 `messages[].content` 陣列扁平化為一般字串。

  </Accordion>
  <Accordion title="Amazon Bedrock 探索">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自動探索設定根目錄。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：開啟/關閉隱含探索。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：探索用的 AWS 區域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：目標探索用的選用供應商 ID 篩選器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：探索重新整理的輪詢間隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：探索到的模型的後援內容視窗。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：探索到的模型的後援最大輸出權杖數。

  </Accordion>
</AccordionGroup>

互動式自訂供應商入門設定會針對常見視覺模型 ID 推斷圖片輸入，例如 GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V，並對已知文字專用系列略過額外問題。未知模型 ID 仍會提示詢問圖片支援。非互動式入門設定使用相同推斷；傳入 `--custom-image-input` 以強制使用支援圖片的中繼資料，或傳入 `--custom-text-input` 以強制使用文字專用中繼資料。

### 供應商範例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    隨附的 `cerebras` 供應商 Plugin 可透過 `openclaw onboard --auth-choice cerebras-api-key` 設定此項。只有在覆寫預設值時才使用明確的供應商設定。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras 請使用 `cerebras/zai-glm-4.7`；Z.AI 直連請使用 `zai/glm-4.7`。

  </Accordion>
  <Accordion title="Kimi 編碼">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 相容的內建提供者。捷徑：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本機模型 (LM Studio)">
    請參閱[本機模型](/zh-TW/gateway/local-models)。簡而言之：在高規格硬體上透過 LM Studio Responses API 執行大型本機模型；保留已合併的託管模型作為備援。
  </Accordion>
  <Accordion title="MiniMax M2.7（直連）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    設定 `MINIMAX_API_KEY`。捷徑：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目錄預設僅包含 M2.7。在 Anthropic 相容的串流路徑上，除非你明確自行設定 `thinking`，否則 OpenClaw 預設會停用 MiniMax 思考。`/fast on` 或 `params.fastMode: true` 會將 `MiniMax-M2.7` 改寫為 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    若使用中國端點：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端點會在共用的 `openai-completions` 傳輸上宣告串流用量相容性，而 OpenClaw 會依據端點能力啟用此行為，不只依賴內建提供者 ID。

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    設定 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目錄請使用 `opencode/...` 參照，Go 目錄請使用 `opencode-go/...` 參照。捷徑：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic 相容）">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    基礎 URL 應省略 `/v1`（Anthropic 用戶端會附加它）。捷徑：`openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    設定 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 也是可接受的別名。捷徑：`openclaw onboard --auth-choice zai-api-key`。

    - 一般端點：`https://api.z.ai/api/paas/v4`
    - 編碼端點（預設）：`https://api.z.ai/api/coding/paas/v4`
    - 若使用一般端點，請定義自訂提供者並覆寫基礎 URL。

  </Accordion>
</AccordionGroup>

---

## 相關

- [設定 — agents](/zh-TW/gateway/config-agents)
- [設定 — channels](/zh-TW/gateway/config-channels)
- [設定參考](/zh-TW/gateway/configuration-reference) — 其他頂層鍵
- [工具與 plugins](/zh-TW/tools)

---
read_when:
    - 你正在變更嵌入式代理程式執行階段或測試框架登錄表
    - 你正在從內建或受信任的 Plugin 註冊代理程式執行框架
    - 你需要了解 Codex Plugin 與模型提供者的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器的 Plugin 使用的實驗性 SDK 介面
title: 代理程式執行框架 Plugin
x-i18n:
    generated_at: "2026-04-30T03:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理 harness** 是單次已準備好的 OpenClaw 代理回合的低階執行器。它不是模型提供者、不是頻道，也不是工具登錄表。關於面向使用者的心智模型，請參閱[代理執行環境](/zh-TW/concepts/agent-runtimes)。

只有在 bundled 或受信任的原生 plugins 中才使用這個介面。此合約仍屬實驗性，因為參數型別刻意對應目前的嵌入式 runner。

## 何時使用 harness

當某個模型系列有自己的原生 session runtime，而一般 OpenClaw 提供者傳輸並不是合適抽象時，請註冊代理 harness。

範例：

- 擁有 threads 和 compaction 的原生編碼代理伺服器
- 必須串流原生 plan/reasoning/tool 事件的本機 CLI 或 daemon
- 除了 OpenClaw session transcript 之外，還需要自己的 resume id 的模型 runtime

請**不要**只為了新增一個 LLM API 而註冊 harness。對於一般 HTTP 或 WebSocket 模型 API，請建立[提供者 plugin](/zh-TW/plugins/sdk-provider-plugins)。

## Core 仍然負責什麼

在選取 harness 之前，OpenClaw 已經解析好：

- 提供者與模型
- runtime 驗證狀態
- thinking level 與 context budget
- OpenClaw transcript/session 檔案
- workspace、sandbox 與工具政策
- 頻道回覆 callbacks 與串流 callbacks
- 模型 fallback 與即時模型切換政策

這樣的切分是刻意設計的。harness 會執行一次已準備好的 attempt；它不會選擇 providers、取代頻道傳遞，或悄悄切換模型。

已準備好的 attempt 也包含 `params.runtimePlan`，這是 OpenClaw 擁有的政策 bundle，用於必須在 PI 與原生 harnesses 之間共享的 runtime 決策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用於具備 provider-aware 的工具 schema 政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於 transcript 清理與
  tool-call 修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共享的 `NO_REPLY` 與媒體
  delivery 抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型 fallback 分類
- `runtimePlan.observability`，用於已解析的 provider/model/harness metadata

harnesses 可以使用該 plan 來做出需要符合 PI 行為的決策，但仍應將它視為 host-owned 的 attempt 狀態。不要變更它，也不要用它在單一回合內切換 providers/models。

## 註冊 harness

**匯入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 選取政策

OpenClaw 會在 provider/model 解析後選擇 harness：

1. 現有 session 記錄的 harness id 優先，因此 config/env 變更不會把該 transcript 熱切換到另一個 runtime。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會針對尚未 pinned 的 sessions，強制使用該 id 的已註冊 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 會強制使用內建 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 會詢問已註冊 harnesses 是否支援已解析的 provider/model。
5. 如果沒有已註冊的 harness 符合，OpenClaw 會使用 PI，除非 PI fallback 已停用。

Plugin harness 失敗會呈現為執行失敗。在 `auto` 模式中，只有在沒有已註冊 plugin harness 支援已解析的 provider/model 時，才會使用 PI fallback。一旦某個 plugin harness 已 claim 一次 run，OpenClaw 不會透過 PI replay 同一個回合，因為那可能改變 auth/runtime 語意或重複產生副作用。

選取的 harness id 會在嵌入式 run 之後與 session id 一起保存。harness pins 出現前建立的舊 sessions，一旦有 transcript history，就會被視為 PI-pinned。在 PI 與原生 plugin harness 之間切換時，請使用新的或 reset 後的 session。`/status` 會在 `Fast` 旁顯示非預設 harness id，例如 `codex`；PI 會維持隱藏，因為它是預設相容性路徑。如果選取的 harness 出乎預期，請啟用 `agents/harness` debug logging，並檢查 gateway 的結構化 `agent harness selected` 記錄。它包含選取的 harness id、選取原因、runtime/fallback 政策，以及在 `auto` 模式中每個 plugin candidate 的支援結果。

bundled Codex plugin 會註冊 `codex` 作為其 harness id。Core 會把它視為一般 plugin harness id；Codex-specific aliases 屬於 plugin 或 operator config，而不是共享 runtime selector。

## 提供者加 harness 配對

多數 harnesses 也應註冊 provider。provider 會讓 model refs、auth 狀態、model metadata 與 `/model` 選取對 OpenClaw 其餘部分可見。接著 harness 會在 `supports(...)` 中 claim 該 provider。

bundled Codex plugin 遵循此模式：

- 偏好的使用者模型 refs：`openai/gpt-5.5` 加上
  `agentRuntime.id: "codex"`
- 相容性 refs：舊版 `codex/gpt-*` refs 仍會被接受，但新的
  configs 不應將它們作為一般 provider/model refs 使用
- harness id：`codex`
- auth：合成 provider availability，因為 Codex harness 擁有原生 Codex login/session
- app-server request：OpenClaw 會把裸 model id 傳送給 Codex，並讓
  harness 與原生 app-server protocol 溝通

Codex plugin 是 additive。純 `openai/gpt-*` refs 會繼續使用一般 OpenClaw provider path，除非你使用 `agentRuntime.id: "codex"` 強制指定 Codex harness。較舊的 `codex/gpt-*` refs 仍會為了相容性選取 Codex provider 與 harness。

如需 operator 設定、模型 prefix 範例與 Codex-only configs，請參閱
[Codex Harness](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex app-server `0.125.0` 或更新版本。Codex plugin 會檢查 app-server initialize handshake，並阻擋較舊或沒有版本資訊的 servers，讓 OpenClaw 只針對已測試過的 protocol surface 執行。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP hook payload 支援，同時將 OpenClaw pin 到較新的已測試穩定線。

### Tool-result middleware

Bundled plugins 可以在其 manifest 於 `contracts.agentToolResultMiddleware` 宣告目標 runtime ids 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加 runtime-neutral tool-result middleware。這個受信任的 seam 適用於必須在 PI 或 Codex 將工具輸出送回模型前執行的 async tool-result transforms。

舊版 bundled plugins 仍可使用
`api.registerCodexAppServerExtensionFactory(...)` 來處理 Codex app-server-only middleware，但新的 result transforms 應使用 runtime-neutral API。
Pi-only 的 `api.registerEmbeddedExtensionFactory(...)` hook 已移除；Pi tool-result transforms 必須使用 runtime-neutral middleware。

### Terminal outcome 分類

擁有自己 protocol projection 的原生 harnesses，可以在已完成回合沒有產生可見 assistant text 時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。該 helper 會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的 fallback 政策能決定是否在不同模型上重試。它刻意不分類 prompt errors、進行中的 turns，以及像 `NO_REPLY` 這類有意的 silent replies。

### 原生 Codex harness 模式

bundled `codex` harness 是嵌入式 OpenClaw 代理回合的原生 Codex 模式。請先啟用 bundled `codex` plugin；如果你的 config 使用限制性 allowlist，請在 `plugins.allow` 中包含 `codex`。原生 app-server configs 應使用帶有 `agentRuntime.id: "codex"` 的 `openai/gpt-*`。
請使用 `openai-codex/*` 透過 PI 進行 Codex OAuth。舊版 `codex/*` 模型 refs 仍是原生 harness 的相容性 aliases。

此模式執行時，Codex 擁有原生 thread id、resume 行為、compaction 與 app-server 執行。OpenClaw 仍擁有聊天頻道、可見 transcript mirror、工具政策、approvals、media delivery 與 session selection。當你需要證明只有 Codex app-server path 可以 claim 該 run 時，請使用沒有 `fallback` override 的 `agentRuntime.id: "codex"`。明確的 plugin runtimes 預設已經 fail closed。只有在你有意要讓 PI 處理缺失的 harness selection 時，才設定 `fallback: "pi"`。Codex app-server failures 已經會直接失敗，而不是透過 PI 重試。

## 停用 PI fallback

預設情況下，OpenClaw 會使用設為 `{ id: "auto", fallback: "pi" }` 的 `agents.defaults.agentRuntime` 來執行嵌入式代理。在 `auto` 模式中，已註冊的 plugin harnesses 可以 claim provider/model pair。如果沒有符合項，OpenClaw 會 fallback 到 PI。

在 `auto` 模式中，當你需要缺失的 plugin harness selection 失敗，而不是使用 PI 時，請設定 `fallback: "none"`。明確的 plugin runtimes，例如 `runtime: "codex"`，預設已經 fail closed，除非在相同 config 或 environment override scope 中設定了 `fallback: "pi"`。選取的 plugin harness failures 一律會硬性失敗。這不會阻擋明確的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

對於 Codex-only 嵌入式 runs：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

如果你想讓任何已註冊的 plugin harness claim 符合的模型，但絕不希望 OpenClaw 悄悄 fallback 到 PI，請保留 `runtime: "auto"` 並停用 fallback：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

Per-agent overrides 使用相同 shape：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍會覆寫已設定的 runtime。使用
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 從環境停用 PI fallback。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

停用 fallback 後，當要求的 harness 未註冊、不支援已解析的 provider/model，或在產生 turn side effects 前失敗時，session 會提早失敗。這對 Codex-only 部署，以及必須證明 Codex app-server path 實際正在使用的 live tests 而言是刻意設計。

此設定只控制嵌入式代理 harness。它不會停用 image、video、music、TTS、PDF 或其他 provider-specific model routing。

## 原生 sessions 與 transcript mirror

harness 可以保留原生 session id、thread id 或 daemon-side resume token。請將該 binding 明確關聯到 OpenClaw session，並持續將使用者可見的 assistant/tool output mirror 到 OpenClaw transcript。

OpenClaw transcript 仍是以下項目的相容性層：

- 頻道可見的 session history
- transcript search 與 indexing
- 在稍後回合切回內建 PI harness
- 通用 `/new`、`/reset` 與 session deletion 行為

如果你的 harness 儲存 sidecar binding，請實作 `reset(...)`，讓 OpenClaw 在擁有該 binding 的 OpenClaw session reset 時可以清除它。

## 工具與媒體結果

OpenClaw tool清單由核心建構，並傳入準備好的嘗試。
當執行框架執行動態工具呼叫時，請透過執行框架結果形狀傳回工具結果，
而不是自行傳送頻道媒體。

這會讓文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，
和由 Pi 支援的執行使用相同的傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但為了相容性，部分嘗試／結果型別別名仍然
  帶有 `Pi` 名稱。
- 第三方執行框架安裝仍屬實驗性質。在需要原生工作階段執行階段之前，
  請優先使用供應商 Plugins。
- 支援跨回合切換執行框架。請勿在同一回合中，在原生工具、核准、助理文字或訊息
  傳送已開始後切換執行框架。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [供應商 Plugins](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型供應商](/zh-TW/concepts/model-providers)

---
read_when:
    - 你正在變更嵌入式代理程式執行階段或測試框架登錄表
    - 你正在從隨附或受信任的 Plugin 註冊代理程式框架
    - 你需要了解 Codex Plugin 與模型提供者之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理程式執行器的 Plugin 使用的實驗性 SDK 介面
title: 代理程式測試框架 Plugin
x-i18n:
    generated_at: "2026-05-07T13:23:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**agent harness** 是一個已準備好的 OpenClaw agent 回合所使用的低階執行器。它不是模型提供者、不是頻道，也不是工具登錄表。若要了解面向使用者的心智模型，請參閱 [Agent 執行環境](/zh-TW/concepts/agent-runtimes)。

此介面只應用於內建或受信任的原生 Plugin。此合約仍屬實驗性質，因為參數型別刻意對應目前的嵌入式執行器。

## 何時使用 harness

當某個模型家族具有自己的原生工作階段執行環境，而一般 OpenClaw 提供者傳輸並不是合適抽象時，請註冊 agent harness。

範例：

- 擁有執行緒與 Compaction 的原生程式碼 agent 伺服器
- 必須串流原生規劃、推理、工具事件的本機 CLI 或 daemon
- 除了 OpenClaw 工作階段 transcript 之外，還需要自身 resume id 的模型執行環境

不要只是為了新增 LLM API 而註冊 harness。對於一般 HTTP 或 WebSocket 模型 API，請建立 [provider plugin](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的內容

在選取 harness 之前，OpenClaw 已經解析：

- 提供者與模型
- 執行環境驗證狀態
- thinking 等級與上下文預算
- OpenClaw transcript/工作階段檔案
- 工作區、沙箱與工具政策
- 頻道回覆 callback 與串流 callback
- 模型 fallback 與即時模型切換政策

這樣的分工是刻意設計的。harness 會執行已準備好的嘗試；它不會選擇提供者、取代頻道傳遞，或靜默切換模型。

已準備好的嘗試也包含 `params.runtimePlan`，這是 OpenClaw 擁有的政策套件，用於必須在 PI 與原生 harness 之間保持共用的執行環境決策：

- `runtimePlan.tools.normalize(...)` 與
  `runtimePlan.tools.logDiagnostics(...)`，用於具備提供者感知的工具 schema 政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於 transcript 清理與工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用的 `NO_REPLY` 與媒體傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型 fallback 分類
- `runtimePlan.observability`，用於已解析的提供者/模型/harness 中繼資料

harness 可以使用此計畫來做出需要符合 PI 行為的決策，但仍應將其視為主機擁有的嘗試狀態。不要變更它，也不要在一個回合內用它切換提供者/模型。

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

OpenClaw 會在提供者/模型解析之後選擇 harness：

1. 現有工作階段中記錄的 harness id 優先，因此 config/env 變更不會將該 transcript 熱切換到另一個執行環境。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會對尚未固定的工作階段強制使用具有該 id 的已註冊 harness。
3. `OPENCLAW_AGENT_RUNTIME=pi` 會強制使用內建 PI harness。
4. `OPENCLAW_AGENT_RUNTIME=auto` 會詢問已註冊的 harness 是否支援已解析的提供者/模型。
5. 如果沒有相符的已註冊 harness，OpenClaw 會使用 PI，除非 PI fallback 已停用。

Plugin harness 失敗會呈現為執行失敗。在 `auto` 模式中，只有當沒有已註冊的 Plugin harness 支援已解析的提供者/模型時，才會使用 PI fallback。一旦某個 Plugin harness 已宣告接手執行，OpenClaw 不會再透過 PI 重播同一回合，因為那可能改變驗證/執行環境語意或重複副作用。

在嵌入式執行之後，選取的 harness id 會與工作階段 id 一起持久化。在 harness pins 之前建立的舊版工作階段，只要已有 transcript 歷史，就會被視為已固定到 PI。若要在 PI 與原生 Plugin harness 之間切換，請使用新的/重設的工作階段。`/status` 會在 `Fast` 旁顯示非預設 harness id，例如 `codex`；PI 會保持隱藏，因為它是預設相容路徑。如果選取的 harness 出乎意料，請啟用 `agents/harness` 偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選取的 harness id、選取原因、執行環境/fallback 政策，以及在 `auto` 模式中每個 Plugin 候選者的支援結果。

內建 Codex Plugin 會註冊 `codex` 作為其 harness id。核心會將它視為一般 Plugin harness id；Codex 專屬別名應屬於 Plugin 或操作員 config，而不是共用的執行環境選擇器。

## 提供者加 harness 配對

多數 harness 也應註冊提供者。提供者會讓模型參照、驗證狀態、模型中繼資料與 `/model` 選取對 OpenClaw 其餘部分可見。接著 harness 會在 `supports(...)` 中宣告該提供者。

內建 Codex Plugin 採用此模式：

- 偏好的使用者模型參照：`openai/gpt-5.5` 加上
  `agentRuntime.id: "codex"`
- 相容性參照：舊版 `codex/gpt-*` 參照仍會被接受，但新的 config 不應將它們作為一般提供者/模型參照使用
- harness id：`codex`
- 驗證：合成提供者可用性，因為 Codex harness 擁有原生 Codex 登入/工作階段
- app-server 請求：OpenClaw 會將裸模型 id 傳送給 Codex，並讓 harness 與原生 app-server 協定溝通

Codex Plugin 是加成式的。一般 `openai/gpt-*` 參照會繼續使用一般 OpenClaw 提供者路徑，除非你使用 `agentRuntime.id: "codex"` 強制使用 Codex harness。較舊的 `codex/gpt-*` 參照仍會為相容性而選取 Codex 提供者與 harness。

若要了解操作員設定、模型前綴範例與 Codex 專用 config，請參閱 [Codex Harness](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex app-server `0.125.0` 或更新版本。Codex Plugin 會檢查 app-server initialize handshake，並封鎖較舊或未標示版本的伺服器，讓 OpenClaw 只針對已測試過的協定介面執行。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP hook payload 支援，同時將 OpenClaw 固定到較新的已測試穩定線。

### 工具結果 middleware

內建 Plugin 可以在其 manifest 於 `contracts.agentToolResultMiddleware` 宣告目標執行環境 id 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加執行環境中立的工具結果 middleware。這個受信任介面用於非同步工具結果轉換，必須在 PI 或 Codex 將工具輸出回饋給模型之前執行。

舊版內建 Plugin 仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 來處理僅適用於 Codex app-server 的 middleware，但新的結果轉換應使用執行環境中立 API。僅適用 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已被移除；Pi 工具結果轉換必須使用執行環境中立 middleware。

### 終端結果分類

擁有自身協定投影的原生 harness，可以在完成的回合沒有產生可見 assistant 文字時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。此 helper 會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的 fallback 政策可以決定是否使用不同模型重試。它刻意不分類提示錯誤、進行中的回合，以及像 `NO_REPLY` 這類有意的靜默回覆。

### 原生 Codex harness 模式

內建 `codex` harness 是嵌入式 OpenClaw agent 回合的原生 Codex 模式。請先啟用內建 `codex` Plugin；如果你的 config 使用限制性允許清單，也請在 `plugins.allow` 中包含 `codex`。原生 app-server config 應使用 `openai/gpt-*`；OpenAI agent 回合預設會選取 Codex harness。舊版 `openai-codex/*` 路由應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*` 模型參照仍會作為原生 harness 的相容性別名保留。

此模式執行時，Codex 會擁有原生 thread id、resume 行為、Compaction 與 app-server 執行。OpenClaw 仍擁有聊天頻道、可見 transcript 鏡像、工具政策、核准、媒體傳遞與工作階段選取。當你需要證明只有 Codex app-server 路徑可以宣告接手執行時，請使用 `agentRuntime.id: "codex"`。明確的 Plugin 執行環境會封閉式失敗；Codex app-server 選取失敗與執行環境失敗不會透過 PI 重試。

## 執行環境嚴格性

預設情況下，OpenClaw 會使用 OpenClaw Pi 執行嵌入式 agent。在 `auto` 模式中，已註冊的 Plugin harness 可以宣告接手某個提供者/模型配對，而在沒有相符項目時由 PI 處理該回合。當缺少 harness 選取時應失敗、而非透過 PI 路由，請使用明確的 Plugin 執行環境，例如 `agentRuntime.id: "codex"`。選取的 Plugin harness 失敗一律會硬性失敗。這不會封鎖明確的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

對於僅使用 Codex 的嵌入式執行：

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

如果你希望任何已註冊的 Plugin harness 宣告接手相符模型，否則使用 PI，請設定 `id: "auto"`：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

個別 agent 覆寫使用相同形狀：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍會覆寫已設定的執行環境。

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

使用明確的 Plugin 執行環境時，如果要求的 harness 未註冊、不支援已解析的提供者/模型，或在產生回合副作用之前失敗，工作階段會提早失敗。這對 Codex 專用部署，以及必須證明 Codex app-server 路徑實際正在使用的即時測試而言，是刻意設計的。

此設定只控制嵌入式 agent harness。它不會停用影像、影片、音樂、TTS、PDF 或其他提供者專屬模型路由。

## 原生工作階段與 transcript 鏡像

harness 可以保留原生工作階段 id、thread id 或 daemon 端 resume token。請讓該繫結明確關聯到 OpenClaw 工作階段，並持續將使用者可見的 assistant/工具輸出鏡像到 OpenClaw transcript。

OpenClaw transcript 仍是以下項目的相容層：

- 頻道可見的工作階段歷史
- transcript 搜尋與索引
- 在後續回合切換回內建 PI harness
- 泛用的 `/new`、`/reset` 與工作階段刪除行為

如果你的 harness 儲存 sidecar 繫結，請實作 `reset(...)`，讓 OpenClaw 能在擁有該繫結的 OpenClaw 工作階段被重設時清除它。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備好的嘗試。當 harness 執行動態工具呼叫時，請透過 harness 結果形狀回傳工具結果，而不是自行傳送頻道媒體。

這會讓文字、影像、影片、音樂、TTS、核准與訊息工具輸出，與 PI 支援的執行使用相同傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但為了相容性，某些嘗試/結果型別別名仍帶有 `Pi` 名稱。
- 第三方測試框架安裝仍屬實驗性。請優先使用提供者 Plugin，直到你需要原生工作階段執行階段。
- 支援跨回合切換測試框架。在原生工具、核准、助理文字或訊息傳送已開始後，請勿在回合中途切換測試框架。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

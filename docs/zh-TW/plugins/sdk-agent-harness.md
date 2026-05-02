---
read_when:
    - 你正在變更嵌入式代理程式執行階段或測試框架登錄檔
    - 您正在從隨附或受信任的 Plugin 註冊代理程式執行框架
    - 你需要了解 Codex Plugin 與模型供應商的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器的 Plugin 使用的實驗性 SDK 介面
title: 代理程式執行框架 Plugin
x-i18n:
    generated_at: "2026-05-02T02:56:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理程式執行框架** 是一次已準備好的 OpenClaw 代理程式回合的低階執行器。它不是模型提供者、不是通道，也不是工具登錄表。關於面向使用者的心智模型，請參閱 [代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

只將這個介面用於內建或受信任的原生 Plugin。這份合約仍處於實驗階段，因為參數型別刻意對應目前的嵌入式 runner。

## 何時使用執行框架

當某個模型家族有自己的原生工作階段執行階段，而且一般 OpenClaw 提供者傳輸不是正確抽象時，請註冊代理程式執行框架。

範例：

- 擁有 thread 和 Compaction 的原生程式設計代理程式伺服器
- 必須串流原生規劃、推理、工具事件的本機 CLI 或 daemon
- 除了 OpenClaw 工作階段逐字稿之外，還需要自己的 resume id 的模型執行階段

不要只為了新增 LLM API 而註冊執行框架。對於一般 HTTP 或 WebSocket 模型 API，請建置 [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍然擁有的部分

在選取執行框架之前，OpenClaw 已經解析：

- 提供者和模型
- 執行階段驗證狀態
- thinking 等級和情境預算
- OpenClaw 逐字稿／工作階段檔案
- 工作區、沙盒和工具政策
- 通道回覆 callback 和串流 callback
- 模型 fallback 和即時模型切換政策

這個分工是刻意設計的。執行框架會執行已準備好的嘗試；它不會挑選提供者、取代通道交付，或在沒有明示的情況下切換模型。

已準備好的嘗試也包含 `params.runtimePlan`，這是 OpenClaw 擁有的政策套件，用於必須在 PI 和原生執行框架之間保持共用的執行階段決策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用於具提供者感知能力的工具 schema 政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字稿清理和工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用的 `NO_REPLY` 和媒體交付抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型 fallback 分類
- `runtimePlan.observability`，用於已解析的提供者／模型／執行框架中繼資料

執行框架可以將此計畫用於需要符合 PI 行為的決策，但仍應將它視為主機擁有的嘗試狀態。不要修改它，也不要在一個回合內用它切換提供者／模型。

## 註冊執行框架

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

OpenClaw 會在提供者／模型解析後選擇執行框架：

1. 現有工作階段記錄的執行框架 id 優先，因此 config／env 變更不會將該逐字稿熱切換到另一個執行階段。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會強制未固定的工作階段使用具有該 id 的已註冊執行框架。
3. `OPENCLAW_AGENT_RUNTIME=pi` 會強制使用內建 PI 執行框架。
4. `OPENCLAW_AGENT_RUNTIME=auto` 會詢問已註冊的執行框架是否支援已解析的提供者／模型。
5. 如果沒有相符的已註冊執行框架，OpenClaw 會使用 PI，除非 PI fallback 已停用。

Plugin 執行框架失敗會呈現為執行失敗。在 `auto` 模式中，只有當沒有已註冊的 Plugin 執行框架支援已解析的提供者／模型時，才會使用 PI fallback。一旦 Plugin 執行框架已宣告某次執行，OpenClaw 不會透過 PI 重播同一個回合，因為這可能改變驗證／執行階段語意或造成副作用重複。

選取的執行框架 id 會在嵌入式執行後與工作階段 id 一起保存。在執行框架固定之前建立的舊版工作階段，只要已有逐字稿歷史，就會被視為已固定到 PI。在 PI 與原生 Plugin 執行框架之間切換時，請使用新的／重設的工作階段。`/status` 會在 `Fast` 旁顯示非預設的執行框架 id，例如 `codex`；PI 會隱藏，因為它是預設相容路徑。如果選取的執行框架出乎意料，請啟用 `agents/harness` debug logging，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選取的執行框架 id、選取原因、執行階段／fallback 政策，以及在 `auto` 模式中每個 Plugin 候選者的支援結果。

內建 Codex Plugin 會將 `codex` 註冊為其執行框架 id。核心會將它視為一般 Plugin 執行框架 id；Codex 專用 alias 應放在 Plugin 或 operator config 中，而不是共享執行階段選擇器中。

## 提供者加執行框架配對

大多數執行框架也應註冊提供者。提供者會讓模型 refs、驗證狀態、模型中繼資料和 `/model` 選取對 OpenClaw 其餘部分可見。執行框架接著會在 `supports(...)` 中宣告該提供者。

內建 Codex Plugin 遵循此模式：

- 偏好的使用者模型 refs：`openai/gpt-5.5` 加上
  `agentRuntime.id: "codex"`
- 相容性 refs：仍接受舊版 `codex/gpt-*` refs，但新 config 不應將它們當作一般提供者／模型 refs 使用
- 執行框架 id：`codex`
- 驗證：合成的提供者可用性，因為 Codex 執行框架擁有原生 Codex 登入／工作階段
- app-server 要求：OpenClaw 會將裸模型 id 傳送給 Codex，並讓執行框架與原生 app-server 協定通訊

Codex Plugin 是加成式的。一般 `openai/gpt-*` refs 會繼續使用一般 OpenClaw 提供者路徑，除非你用 `agentRuntime.id: "codex"` 強制使用 Codex 執行框架。較舊的 `codex/gpt-*` refs 仍會選取 Codex 提供者和執行框架以維持相容性。

關於 operator 設定、模型前綴範例和 Codex-only config，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex app-server `0.125.0` 或更新版本。Codex Plugin 會檢查 app-server initialize handshake，並封鎖較舊或未標版本的伺服器，讓 OpenClaw 只針對已測試的協定介面執行。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP hook payload 支援，同時將 OpenClaw 固定到較新的已測試穩定線。

### 工具結果 middleware

內建 Plugin 可以在其 manifest 中於 `contracts.agentToolResultMiddleware` 宣告目標執行階段 id 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加執行階段中立的工具結果 middleware。這個受信任的接縫適用於非同步工具結果轉換，必須在 PI 或 Codex 將工具輸出回饋給模型之前執行。

舊版內建 Plugin 仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 來處理僅限 Codex app-server 的 middleware，但新的結果轉換應使用執行階段中立 API。Pi-only 的 `api.registerEmbeddedExtensionFactory(...)` hook 已移除；Pi 工具結果轉換必須使用執行階段中立 middleware。

### 終端結果分類

擁有自己的協定投影的原生執行框架，可以在完成的回合沒有產生可見助理文字時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。這個 helper 會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的 fallback 政策能決定是否在不同模型上重試。它刻意不分類提示錯誤、進行中的回合，以及像 `NO_REPLY` 這類有意的靜默回覆。

### 原生 Codex 執行框架模式

內建 `codex` 執行框架是嵌入式 OpenClaw 代理程式回合的原生 Codex 模式。請先啟用內建 `codex` Plugin；如果你的 config 使用限制性 allowlist，也請在 `plugins.allow` 中包含 `codex`。原生 app-server config 應使用 `openai/gpt-*` 並搭配 `agentRuntime.id: "codex"`。請使用 `openai-codex/*` 透過 PI 進行 Codex OAuth。舊版 `codex/*` 模型 refs 仍是原生執行框架的相容 alias。

此模式執行時，Codex 擁有原生 thread id、resume 行為、Compaction 和 app-server 執行。OpenClaw 仍擁有聊天通道、可見逐字稿鏡像、工具政策、核准、媒體交付和工作階段選取。當你需要證明只有 Codex app-server 路徑可以宣告該執行時，請使用不帶 `fallback` override 的 `agentRuntime.id: "codex"`。明確的 Plugin 執行階段預設已經是 fail closed。只有在你有意要讓 PI 處理缺少執行框架選取時，才設定 `fallback: "pi"`。Codex app-server 失敗已經會直接失敗，而不是透過 PI 重試。

## 停用 PI fallback

預設情況下，OpenClaw 會以設定為 `{ id: "auto", fallback: "pi" }` 的 `agents.defaults.agentRuntime` 執行嵌入式代理程式。在 `auto` 模式中，已註冊的 Plugin 執行框架可以宣告提供者／模型配對。如果沒有相符項，OpenClaw 會 fallback 到 PI。

在 `auto` 模式中，當你需要缺少 Plugin 執行框架選取時失敗而不是使用 PI，請設定 `fallback: "none"`。明確的 Plugin 執行階段，例如 `agentRuntime.id: "codex"`，預設已經是 fail closed，除非在同一個 config 或環境 override 範圍內設定了 `fallback: "pi"`。選取的 Plugin 執行框架失敗一律會硬性失敗。這不會阻止明確的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

對於 Codex-only 嵌入式執行：

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

如果你希望任何已註冊的 Plugin 執行框架宣告相符模型，但絕不希望 OpenClaw 靜默 fallback 到 PI，請保留 `runtime: "auto"` 並停用 fallback：

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

每個代理程式的 override 使用相同形狀：

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

`OPENCLAW_AGENT_RUNTIME` 仍會覆寫已設定的執行階段。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 從環境停用 PI fallback。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

停用 fallback 時，如果要求的執行框架未註冊、不支援已解析的提供者／模型，或在產生回合副作用前失敗，工作階段會提早失敗。這對 Codex-only 部署，以及必須證明 Codex app-server 路徑實際正在使用的即時測試而言是刻意設計的。

此設定只控制嵌入式代理程式執行框架。它不會停用圖片、影片、音樂、TTS、PDF 或其他提供者專用模型路由。

## 原生工作階段和逐字稿鏡像

執行框架可以保留原生工作階段 id、thread id，或 daemon 端 resume token。請讓該繫結明確關聯到 OpenClaw 工作階段，並持續將使用者可見的助理／工具輸出鏡像到 OpenClaw 逐字稿中。

OpenClaw 逐字稿仍是下列用途的相容層：

- 通道可見的工作階段歷史
- 逐字稿搜尋和索引
- 在後續回合切回內建 PI 執行框架
- 一般 `/new`、`/reset` 和工作階段刪除行為

如果你的執行框架儲存 sidecar 繫結，請實作 `reset(...)`，讓 OpenClaw 能在擁有該繫結的 OpenClaw 工作階段重設時清除它。

## 工具和媒體結果

Core 會建構 OpenClaw 工具清單，並將其傳入已準備好的嘗試。
當 harness 執行動態工具呼叫時，請透過 harness 結果形狀回傳工具結果，
而不是自行傳送頻道媒體。

這會讓文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，
都走與 PI 支援執行相同的傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但部分嘗試/結果型別別名為了相容性仍帶有 `Pi` 名稱。
- 第三方 harness 安裝仍屬實驗性。在需要原生工作階段執行階段之前，請優先使用提供者 plugins。
- 支援跨回合切換 harness。在原生工具、核准、助理文字或訊息傳送開始後，不要在同一回合中途切換 harness。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者 Plugins](/zh-TW/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

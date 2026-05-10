---
read_when:
    - 你正在變更內嵌代理程式執行階段或測試框架登錄表
    - 您正在從隨附或受信任的 Plugin 註冊代理程式執行框架
    - 你需要了解 Codex Plugin 與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器的 Plugin 使用的實驗性 SDK 介面
title: 代理程式執行框架 Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理程式執行框架**是針對一個已準備好的 OpenClaw 代理程式
回合所使用的低階執行器。它不是模型提供者、不是通道，也不是工具登錄表。
若要了解面向使用者的心智模型，請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

只有 bundled 或受信任的原生 plugins 才應使用這個介面。這份合約
仍屬實驗性質，因為參數型別刻意對應目前的
嵌入式執行器。

## 何時使用執行框架

當某個模型系列有自己的原生工作階段
執行階段，而且一般 OpenClaw 提供者傳輸不是正確抽象時，請註冊代理程式執行框架。

範例：

- 擁有執行緒與 Compaction 的原生程式碼代理程式伺服器
- 必須串流原生計畫、推理、工具事件的本機 CLI 或 daemon
- 除了 OpenClaw
  工作階段逐字稿之外，還需要自己的恢復 id 的模型執行階段

不要只為了新增 LLM API 而註冊執行框架。一般 HTTP 或
WebSocket 模型 API 應建立[提供者 plugin](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍然負責的內容

在選取執行框架之前，OpenClaw 已經解析好：

- 提供者與模型
- 執行階段驗證狀態
- 思考層級與內容預算
- OpenClaw 逐字稿/工作階段檔案
- 工作區、沙箱與工具政策
- 通道回覆回呼與串流回呼
- 模型備援與即時模型切換政策

這樣的分工是刻意設計的。執行框架會執行已準備好的嘗試；它不會挑選
提供者、取代通道傳遞，或在未告知的情況下切換模型。

已準備好的嘗試也包含 `params.runtimePlan`，這是 OpenClaw 擁有的
政策套件，用於必須在 PI 與原生
執行框架之間保持共享的執行階段決策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)` 用於感知提供者的工具 schema 政策
- `runtimePlan.transcript.resolvePolicy(...)` 用於逐字稿清理與
  工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)` 用於共享的 `NO_REPLY` 與媒體
  傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用於模型備援分類
- `runtimePlan.observability` 用於已解析的提供者/模型/執行框架中繼資料

執行框架可以將此計畫用於需要符合 PI 行為的決策，但
仍應將其視為主機擁有的嘗試狀態。不要變更它，或在
一個回合內用它切換提供者/模型。

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

OpenClaw 會在提供者/模型解析後選擇執行框架：

1. 模型範圍的執行階段政策優先。
2. 接著是提供者範圍的執行階段政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的
   提供者/模型。
4. 如果沒有已註冊的執行框架符合，除非已停用 PI 備援，
   否則 OpenClaw 會使用 PI。

Plugin 執行框架失敗會顯示為執行失敗。在 `auto` 模式中，只有在沒有已註冊的 plugin 執行框架支援已解析的
提供者/模型時，才會使用 PI 備援。一旦 plugin 執行框架已宣告某次執行，OpenClaw 不會
透過 PI 重播同一個回合，因為那可能改變驗證/執行階段語意
或重複產生副作用。

選取流程會忽略整個工作階段與整個代理程式的執行階段固定值。這
包含過時工作階段的 `agentHarnessId` 值、`agents.defaults.agentRuntime`、
`agents.list[].agentRuntime`，以及 `OPENCLAW_AGENT_RUNTIME`。`/status` 會顯示
從提供者/模型路由選出的有效執行階段。
如果選出的執行框架出乎意料，請啟用 `agents/harness` 偵錯記錄，並
檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含
選出的執行框架 id、選取原因、執行階段/備援政策，以及在
`auto` 模式中每個 plugin 候選項目的支援結果。

bundled Codex plugin 會以 `codex` 作為其執行框架 id。核心會將它
視為一般 plugin 執行框架 id；Codex 專屬別名應放在 plugin
或操作員設定中，而不是放在共享的執行階段選擇器裡。

## 提供者加執行框架配對

多數執行框架也應註冊提供者。提供者會讓模型 refs、
驗證狀態、模型中繼資料與 `/model` 選取對 OpenClaw 的其他部分可見。接著執行框架會在 `supports(...)` 中宣告該提供者。

bundled Codex plugin 遵循此模式：

- 偏好的使用者模型 refs：`openai/gpt-5.5`
- 相容性 refs：舊版 `codex/gpt-*` refs 仍會被接受，但新的
  設定不應把它們當成一般提供者/模型 refs 使用
- 執行框架 id：`codex`
- 驗證：合成提供者可用性，因為 Codex 執行框架擁有
  原生 Codex 登入/工作階段
- app-server 請求：OpenClaw 會將裸模型 id 傳送給 Codex，並讓
  執行框架與原生 app-server 通訊協定溝通

Codex plugin 是附加式的。官方
OpenAI 提供者上的一般 `openai/gpt-*` 代理程式 refs 預設會選取 Codex 執行框架。較舊的 `codex/gpt-*` refs
仍會為了相容性選取 Codex 提供者與執行框架。

若要查看操作員設定、模型前綴範例，以及僅限 Codex 的設定，請參閱
[Codex Harness](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex app-server `0.125.0` 或更新版本。Codex plugin 會檢查
app-server 初始化握手，並封鎖較舊或未版本化的伺服器，讓
OpenClaw 只針對已測試過的通訊協定介面執行。
`0.125.0` 下限包含已在
Codex `0.124.0` 加入的原生 MCP hook payload 支援，同時將 OpenClaw 固定在較新的已測試穩定線。

### 工具結果中介軟體

當 manifest 在 `contracts.agentToolResultMiddleware` 宣告
目標執行階段 ids 時，bundled plugins 可以透過
`api.registerAgentToolResultMiddleware(...)` 附加執行階段中立的工具結果中介軟體。這個受信任的
介面用於非同步工具結果轉換，必須在 PI 或 Codex 將
工具輸出回饋給模型之前執行。

舊版 bundled plugins 仍可使用
`api.registerCodexAppServerExtensionFactory(...)` 來提供僅限 Codex app-server 的
中介軟體，但新的結果轉換應使用執行階段中立 API。
僅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已被移除；
Pi 工具結果轉換必須使用執行階段中立中介軟體。

### 終端結果分類

擁有自身通訊協定投射的原生執行框架，當完成的回合沒有產生
可見的助理文字時，可以使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`classifyAgentHarnessTerminalOutcome(...)`。這個輔助函式會回傳 `empty`、`reasoning-only` 或
`planning-only`，讓 OpenClaw 的備援政策決定是否在
不同模型上重試。它刻意不分類提示錯誤、進行中的回合，以及
刻意靜默的回覆，例如 `NO_REPLY`。

### 原生 Codex 執行框架模式

bundled `codex` 執行框架是嵌入式 OpenClaw
代理程式回合的原生 Codex 模式。請先啟用 bundled `codex` plugin，且如果你的設定使用限制性允許清單，請在
`plugins.allow` 中包含 `codex`。原生 app-server
設定應使用 `openai/gpt-*`；OpenAI 代理程式回合預設會選取 Codex 執行框架。舊版 `openai-codex/*` 路由應使用
`openclaw doctor --fix` 修復，而舊版 `codex/*` 模型 refs 仍是原生執行框架的相容性
別名。

當此模式執行時，Codex 會擁有原生執行緒 id、恢復行為、
Compaction，以及 app-server 執行。OpenClaw 仍然擁有聊天通道、
可見逐字稿鏡像、工具政策、核准、媒體傳遞與工作階段
選取。當你需要證明只有 Codex app-server 路徑能宣告該次執行時，請使用提供者/模型 `agentRuntime.id: "codex"`。明確 plugin 執行階段
會封閉失敗；Codex app-server 選取失敗與執行階段失敗不會
透過 PI 重試。

## 執行階段嚴格性

預設情況下，OpenClaw 使用 `auto` 提供者/模型執行階段政策：已註冊的
plugin 執行框架可以宣告提供者/模型組合，而當沒有任何符合時 PI 會處理該回合。官方 OpenAI 提供者上的 OpenAI 代理程式 refs 預設為 Codex。
當缺少執行框架選取應該失敗、而不是透過 PI 路由時，請使用明確的提供者/模型 plugin 執行階段，例如
`agentRuntime.id: "codex"`。已選取的 plugin 執行框架失敗一律為硬失敗。這
不會阻止明確的提供者/模型 `agentRuntime.id: "pi"`。

針對僅限 Codex 的嵌入式執行：

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5"
    }
  }
}
```

如果你想為一個標準模型設定 CLI 後端，請將執行階段放在該
模型項目上：

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

每個代理程式的覆寫使用相同的模型範圍形狀：

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

像這樣的舊版整個代理程式執行階段範例會被忽略：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

使用明確 plugin 執行階段時，如果請求的
執行框架未註冊、不支援已解析的提供者/模型，或在產生回合副作用之前失敗，工作階段會提早失敗。這對僅限 Codex 的
部署，以及必須證明 Codex app-server 路徑
確實正在使用的即時測試而言，是刻意設計的。

此設定只控制嵌入式代理程式執行框架。它不會停用
影像、影片、音樂、TTS、PDF，或其他提供者特定的模型路由。

## 原生工作階段與逐字稿鏡像

執行框架可以保留原生工作階段 id、執行緒 id，或 daemon 端恢復 token。
請將該綁定明確關聯到 OpenClaw 工作階段，並持續將使用者可見的助理/工具輸出鏡像到 OpenClaw 逐字稿。

OpenClaw 逐字稿仍然是下列項目的相容層：

- 通道可見的工作階段歷史
- 逐字稿搜尋與索引
- 在之後的回合切回內建 PI 執行框架
- 通用 `/new`、`/reset` 與工作階段刪除行為

如果你的執行框架儲存 sidecar 綁定，請實作 `reset(...)`，讓 OpenClaw 可以在所屬 OpenClaw 工作階段重設時
清除它。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備好的嘗試。
當執行框架執行動態工具呼叫時，請透過
執行框架結果形狀回傳工具結果，而不是自行傳送通道媒體。

這能讓文字、影像、影片、音樂、TTS、核准與訊息工具輸出
與 PI 支援的執行使用相同的傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但某些嘗試/結果型別別名仍為了相容性
  帶有 `Pi` 名稱。
- 第三方執行框架安裝仍屬實驗性質。在你需要原生工作階段執行階段之前，請優先使用提供者 plugins。
- 支援跨回合切換執行框架。在原生工具、核准、助理文字或訊息
  傳送已經開始後，不要在回合中途切換執行框架。

## 相關

- [SDK 概覽](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

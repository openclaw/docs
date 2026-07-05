---
read_when:
    - 你正在變更嵌入式代理程式執行階段或 harness 登錄檔
    - 你正在從隨附或受信任的外掛註冊代理程式執行框架
    - 你需要了解 Codex 外掛與模型提供者之間的關係
sidebarTitle: Agent Harness
summary: 取代低階嵌入式代理執行器之外掛的實驗性 SDK 介面
title: 代理程式測試框架外掛
x-i18n:
    generated_at: "2026-07-05T11:31:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 969213232ebde462ae20a4f13876f27f778b7d6ace7e7be1ba3d8e04e8fa5ed2
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理程式執行框架**是針對一次已準備好的 OpenClaw 代理程式回合的低階執行器。它不是模型供應商、不是通道，也不是工具註冊表。關於面向使用者的心智模型，請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

僅將此介面用於內建或受信任的原生外掛。此合約仍屬實驗性質，因為參數類型刻意對應目前的嵌入式執行器。

## 何時使用執行框架

當某個模型系列擁有自己的原生工作階段執行階段，且一般 OpenClaw 供應商傳輸並不是正確抽象時，請註冊代理程式執行框架：

- 擁有執行緒與壓縮的原生程式碼代理程式伺服器
- 必須串流原生計畫、推理、工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字稿外，還需要自己的續接 ID 的模型執行階段

請**不要**只為了新增新的 LLM API 而註冊執行框架。對於一般 HTTP 或 WebSocket 模型 API，請建立[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的內容

在選取執行框架之前，OpenClaw 已經解析：

- 供應商與模型
- 執行階段驗證狀態
- 思考層級與上下文預算
- OpenClaw 逐字稿/工作階段檔案
- 工作區、沙盒與工具政策
- 通道回覆回呼與串流回呼
- 模型備援與即時模型切換政策

執行框架會執行已準備好的嘗試；它不會挑選供應商、取代通道遞送，或靜默切換模型。

已準備好的嘗試也包含 `params.runtimePlan`，這是 OpenClaw 擁有的政策套件，用於必須在 OpenClaw 與原生執行框架之間保持共享的執行階段決策：

- `runtimePlan.tools.normalize(...)` 與 `runtimePlan.tools.logDiagnostics(...)`，用於具供應商感知能力的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字稿清理與工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共享的 `NO_REPLY` 與媒體遞送抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型備援分類
- `runtimePlan.observability`，用於已解析的供應商/模型/執行框架中繼資料

執行框架可在需要符合 OpenClaw 行為的決策中使用此計畫，但請將它視為主機擁有的嘗試狀態：不要變更它，也不要在一個回合內用它來切換供應商/模型。

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

OpenClaw 會在供應商/模型解析後選擇執行框架：

1. 模型範圍的執行階段政策優先。
2. 接著是供應商範圍的執行階段政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的供應商/模型。
4. 如果沒有相符的已註冊執行框架，OpenClaw 會使用其嵌入式執行階段。

外掛執行框架失敗會呈現為執行失敗。在 `auto` 模式中，只有在沒有已註冊外掛執行框架支援已解析的供應商/模型時，才會套用嵌入式備援。一旦外掛執行框架已宣告某次執行，OpenClaw 不會透過另一個執行階段重播同一回合，因為這可能改變驗證/執行階段語意，或造成重複副作用。

選取時會忽略整個工作階段與整個代理程式的執行階段釘選。這包括過期的工作階段 `agentHarnessId` 值、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`，以及 `OPENCLAW_AGENT_RUNTIME`。`/status` 會顯示從供應商/模型路由選取的有效執行階段。

如果選取的執行框架令人意外，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄：其中包含已選取的執行框架 ID、選取原因、執行階段/備援政策，以及在 `auto` 模式中每個外掛候選項目的支援結果。

內建 Codex 外掛會註冊 `codex` 作為其執行框架 ID。核心會將它視為一般外掛執行框架 ID；Codex 專屬別名應屬於外掛或操作員設定，而不是共享執行階段選取器。

## 供應商與執行框架配對

多數執行框架也應註冊供應商。供應商會讓模型參照、驗證狀態、模型中繼資料與 `/model` 選取對 OpenClaw 其他部分可見。接著執行框架會在 `supports(...)` 中宣告該供應商。

內建 Codex 外掛遵循此模式：

- 偏好的使用者模型參照：`openai/gpt-5.5`
- 相容性參照：舊版 `codex/gpt-*` 參照仍會被接受，但新設定不應將它們作為一般供應商/模型參照使用
- 執行框架 ID：`codex`
- 驗證：合成的供應商可用性，因為 Codex 執行框架擁有原生 Codex 登入/工作階段
- 應用程式伺服器請求：OpenClaw 會將裸模型 ID 傳送給 Codex，並讓執行框架與原生 app-server 協定溝通

Codex 外掛是加成式的。官方 OpenAI API 端點（`api.openai.com`）上的一般 `openai/gpt-*` 代理程式參照預設會選取 Codex 執行框架；自訂 OpenAI 相容基底 URL 則會保留其已設定的供應商行為。較舊的 `codex/gpt-*` 參照仍會為了相容性選取 Codex 供應商與執行框架。

關於操作員設定、模型前綴範例，以及 Codex 專用設定，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex app-server `0.125.0` 或更新版本。Codex 外掛會檢查 app-server 初始化交握，並封鎖較舊或未標示版本的伺服器，因此 OpenClaw 只會針對已測試的協定介面執行。

### 工具結果中介軟體

內建外掛與已明確啟用、且具備相符資訊清單合約的已安裝外掛，可以在其資訊清單於 `contracts.agentToolResultMiddleware` 中宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加與執行階段無關的工具結果中介軟體。這個受信任介面用於必須在 OpenClaw 或 Codex 將工具輸出餵回模型前執行的非同步工具結果轉換。

舊版內建外掛仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 作為僅限 Codex app-server 的中介軟體，但新的結果轉換應使用與執行階段無關的 API。僅限嵌入式執行器的 `api.registerEmbeddedExtensionFactory(...)` 掛鉤已移除；嵌入式工具結果轉換必須使用與執行階段無關的中介軟體。

### 終端結果分類

擁有自己協定投影的原生執行框架，可以在完成的回合沒有產生可見助理文字時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的備援政策能決定是否在不同模型上重試。`planning-only` 需要執行框架明確提供 `planText` 欄位；OpenClaw 不會從助理文字推斷它。此輔助函式刻意不分類提示錯誤、進行中的回合，以及像 `NO_REPLY` 這類刻意靜默的回覆。

### 代理程式結束端副作用

原生執行框架必須在完成嘗試後，呼叫來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `runAgentEndSideEffects(...)`。它會分派可攜式 `agent_end` 掛鉤與 OpenClaw 的研究擷取，而不會延遲互動式回覆。對於本機、非互動式執行，若嘗試必須等到這些副作用完成後才解析，請使用 `awaitAgentEndSideEffects(...)`。兩個輔助函式都接受與 `runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 酬載；它們的失敗不會改變已完成的嘗試結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入請求的原生執行框架，應使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的使用者輸入輔助函式來格式化提示、透過 OpenClaw 的封鎖式回覆路徑遞送，並將選項/自由格式答案正規化回執行階段的原生回應形狀。此輔助函式會讓通道/終端介面呈現保持一致，同時各執行框架仍保有自己的協定剖析與待處理請求生命週期。

需要類 PI 精簡工具路由的原生執行框架，應使用來自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的 `createAgentHarnessToolSurfaceRuntime(...)`。它負責工具搜尋/程式碼模式控制選取、本機模型精簡預設值、執行階段相容的結構描述篩選、隱藏目錄執行、目錄補水，以及目錄清理。執行框架仍負責其 SDK 專屬工具轉換與原生執行回呼。

### 原生 Codex 執行框架模式

內建 `codex` 執行框架是嵌入式 OpenClaw 代理程式回合的原生 Codex 模式。請先啟用內建 `codex` 外掛；如果你的設定使用限制性允許清單，也請在 `plugins.allow` 中包含 `codex`。原生 app-server 設定應使用 `openai/gpt-*`；OpenAI 代理程式回合預設會選取 Codex 執行框架。舊版 Codex 模型參照路由應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*` 模型參照仍是原生執行框架的相容性別名。

此模式執行時，Codex 擁有原生執行緒 ID、續接行為、壓縮，以及 app-server 執行。OpenClaw 仍擁有聊天通道、可見逐字稿鏡像、工具政策、核准、媒體遞送，以及工作階段選取。當你需要證明只有 Codex app-server 路徑能宣告該次執行時，請使用供應商/模型 `agentRuntime.id: "codex"`。明確的外掛執行階段會失敗即關閉；Codex app-server 選取失敗與執行階段失敗不會透過另一個執行階段重試。

## 執行階段嚴格性

預設情況下，OpenClaw 使用 `auto` 供應商/模型執行階段政策：已註冊的外掛執行框架可以宣告供應商/模型配對，而沒有相符項目時，嵌入式執行階段會處理該回合。官方 OpenAI 供應商上的 OpenAI 代理程式參照預設使用 Codex。當缺少執行框架選取應該失敗，而不是透過嵌入式執行階段路由時，請使用明確的供應商/模型外掛執行階段，例如 `agentRuntime.id: "codex"`。已選取的外掛執行框架失敗一律會硬性失敗。這不會阻擋明確的供應商/模型 `agentRuntime.id: "openclaw"`。

對於 Codex 專用嵌入式執行：

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

如果你想為一個標準模型使用命令列介面後端，請將執行階段放在該模型項目上：

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

個別代理程式覆寫使用相同的模型範圍形狀：

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

使用明確的外掛執行階段時，如果請求的
harness 未註冊、不支援已解析的提供者/模型，或在產生回合副作用前
失敗，工作階段會提早失敗。這對僅限 Codex 的部署，以及必須證明 Codex app-server 路徑
實際正在使用的即時測試而言，是有意設計的行為。

此設定只控制內嵌的代理 harness。它不會停用
影像、影片、音樂、TTS、PDF，或其他提供者特定的模型路由。

## 原生工作階段與逐字稿鏡像

harness 可以保留原生工作階段 ID、thread ID，或 daemon 端的繼續
權杖。請將該繫結明確關聯到 OpenClaw 工作階段，並
持續將使用者可見的助理/工具輸出鏡像到 OpenClaw
逐字稿中。

OpenClaw 逐字稿仍是以下用途的相容層：

- 頻道可見的工作階段歷史
- 逐字稿搜尋與索引
- 在後續回合切回內建 OpenClaw harness
- 通用的 `/new`、`/reset`，以及工作階段刪除行為

如果你的 harness 儲存 sidecar 繫結，請實作 `reset(...)`，讓 OpenClaw
可在所屬 OpenClaw 工作階段重設時清除它。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備的
嘗試。當 harness 執行動態工具呼叫時，請透過 harness 結果形狀
傳回工具結果，而不是自行傳送頻道媒體。

這會讓文字、影像、影片、音樂、TTS、核准，以及訊息工具
輸出與 OpenClaw 支援的執行使用相同的傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但部分嘗試/結果型別別名
  為了相容性仍保留舊版名稱。
- 第三方 harness 安裝仍屬實驗性質。除非你需要原生工作階段執行階段，
  否則請優先使用提供者外掛。
- 支援跨回合切換 harness。請勿在原生工具、核准、助理文字，或訊息
  傳送已開始後，於回合中途切換 harness。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex Harness](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

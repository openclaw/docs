---
read_when:
    - 你正在變更內嵌的代理程式執行環境或 harness 登錄
    - 你正在從 bundled 或受信任的外掛註冊 agent harness
    - 你需要了解 Codex 外掛與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器的外掛使用的實驗性 SDK 介面
title: 代理程式框架外掛
x-i18n:
    generated_at: "2026-06-27T19:47:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理執行框架**是一次已準備好的 OpenClaw 代理回合的低階執行器。它不是模型提供者、不是頻道，也不是工具註冊表。關於面向使用者的心智模型，請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)。

此介面僅供內建或受信任的原生外掛使用。此合約仍屬實驗性，因為參數型別刻意對應目前的嵌入式執行器。

## 何時使用執行框架

當某個模型系列有自己的原生工作階段執行階段，且一般 OpenClaw 提供者傳輸不是正確抽象時，請註冊代理執行框架。

範例：

- 擁有執行緒和壓縮的原生程式碼代理伺服器
- 必須串流原生計畫／推理／工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字稿外，還需要自己續接 ID 的模型執行階段

不要只是為了新增 LLM API 而註冊執行框架。一般 HTTP 或 WebSocket 模型 API，請建置[提供者外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍然負責的內容

在選取執行框架之前，OpenClaw 已經解析：

- 提供者和模型
- 執行階段驗證狀態
- 思考等級和脈絡預算
- OpenClaw 逐字稿／工作階段檔案
- 工作區、沙盒和工具政策
- 頻道回覆回呼和串流回呼
- 模型後援和即時模型切換政策

這種分工是刻意設計的。執行框架會執行已準備好的嘗試；它不會挑選提供者、取代頻道傳遞，或靜默切換模型。

已準備好的嘗試也包含 `params.runtimePlan`，這是一組由 OpenClaw 擁有的政策套件，用於必須在 OpenClaw 與原生執行框架之間保持共用的執行階段決策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用於提供者感知的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字稿清理和工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用的 `NO_REPLY` 和媒體傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型後援分類
- `runtimePlan.observability`，用於已解析的提供者／模型／執行框架中繼資料

執行框架可以將此計畫用於需要符合 OpenClaw 行為的決策，但仍應將它視為主機擁有的嘗試狀態。不要修改它，也不要用它在單一回合內切換提供者／模型。

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

1. 模型範圍的執行階段政策優先。
2. 接著是提供者範圍的執行階段政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的提供者／模型。
4. 如果沒有已註冊的執行框架符合，OpenClaw 會使用其嵌入式執行階段。

外掛執行框架失敗會呈現為執行失敗。在 `auto` 模式中，只有在沒有已註冊的外掛執行框架支援已解析的提供者／模型時，才會使用嵌入式後援。一旦外掛執行框架已宣告某次執行，OpenClaw 不會透過另一個執行階段重播同一個回合，因為那可能會改變驗證／執行階段語意或造成副作用重複。

選取時會忽略整個工作階段和整個代理的執行階段固定設定。這包括過時的工作階段 `agentHarnessId` 值、`agents.defaults.agentRuntime`、`agents.list[].agentRuntime` 和 `OPENCLAW_AGENT_RUNTIME`。`/status` 會顯示從提供者／模型路由選出的有效執行階段。
如果選出的執行框架令人意外，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄。它包含選取的執行框架 ID、選取原因、執行階段／後援政策，以及在 `auto` 模式中每個外掛候選的支援結果。

內建 Codex 外掛會註冊 `codex` 作為其執行框架 ID。核心會將它視為一般外掛執行框架 ID；Codex 專用別名應放在外掛或操作者設定中，而不是共用執行階段選取器中。

## 提供者與執行框架配對

大多數執行框架也應註冊提供者。提供者會讓模型參照、驗證狀態、模型中繼資料和 `/model` 選取對 OpenClaw 的其餘部分可見。執行框架接著在 `supports(...)` 中宣告該提供者。

內建 Codex 外掛遵循此模式：

- 建議的使用者模型參照：`openai/gpt-5.5`
- 相容性參照：舊版 `codex/gpt-*` 參照仍被接受，但新的設定不應將它們當作一般提供者／模型參照使用
- 執行框架 ID：`codex`
- 驗證：合成的提供者可用性，因為 Codex 執行框架擁有原生 Codex 登入／工作階段
- 應用程式伺服器請求：OpenClaw 會將裸模型 ID 傳送給 Codex，並讓執行框架與原生應用程式伺服器協定通訊

Codex 外掛是附加式的。官方 OpenAI 提供者上的純 `openai/gpt-*` 代理參照預設會選取 Codex 執行框架。較舊的 `codex/gpt-*` 參照仍會為了相容性選取 Codex 提供者和執行框架。

關於操作者設定、模型前綴範例和 Codex 專用設定，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex 應用程式伺服器 `0.125.0` 或更新版本。Codex 外掛會檢查應用程式伺服器初始化握手，並封鎖較舊或未標示版本的伺服器，讓 OpenClaw 只針對已測試過的協定介面執行。`0.125.0` 下限包含在 Codex `0.124.0` 落地的原生 MCP 鉤子承載支援，同時將 OpenClaw 固定到更新且已測試的穩定系列。

### 工具結果中介軟體

內建外掛和明確啟用且已安裝、並具有相符資訊清單合約的外掛，可以在其資訊清單於 `contracts.agentToolResultMiddleware` 宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加執行階段中立的工具結果中介軟體。此受信任接縫適用於非同步工具結果轉換，這些轉換必須在 OpenClaw 或 Codex 將工具輸出送回模型之前執行。

舊版內建外掛仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 來處理僅限 Codex 應用程式伺服器的中介軟體，但新的結果轉換應使用執行階段中立 API。
僅限嵌入式執行器的 `api.registerEmbeddedExtensionFactory(...)` 鉤子已移除；嵌入式工具結果轉換必須使用執行階段中立中介軟體。

### 終端結果分類

擁有自己協定投影的原生執行框架，可在完成的回合沒有產生可見助理文字時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。此輔助程式會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的後援政策可以決定是否在不同模型上重試。`planning-only` 需要執行框架明確的 `planText` 欄位；OpenClaw 不會從助理散文推斷它。此輔助程式刻意不分類提示錯誤、進行中的回合，以及像 `NO_REPLY` 這類有意的靜默回覆。

### 代理結束副作用

原生執行框架在完成嘗試後，必須呼叫來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `runAgentEndSideEffects(...)`。它會分派可攜式 `agent_end` 鉤子和 OpenClaw 的研究擷取，而且不會延遲互動式回覆。對於本機、非互動式執行，如果嘗試必須等到這些副作用完成才解析，請使用 `awaitAgentEndSideEffects(...)`。兩個輔助程式都接受與 `runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 承載；它們的失敗不會改變已完成的嘗試結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入請求的原生執行框架，應使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的使用者輸入輔助程式來格式化提示、透過 OpenClaw 的阻塞回覆路徑傳遞提示，並將選項／自由格式答案正規化回執行階段的原生回應形狀。此輔助程式會保持頻道／終端介面呈現一致，同時每個執行框架保有自己的協定解析和待處理請求生命週期。

需要類 PI 精簡工具路由的原生執行框架，應使用來自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的 `createAgentHarnessToolSurfaceRuntime(...)`。它負責工具搜尋／程式碼模式控制選取、本機模型精簡預設值、執行階段相容結構描述篩選、隱藏目錄執行、目錄補水，以及目錄清理。執行框架仍負責其 SDK 專用工具轉換和原生執行回呼。

### 原生 Codex 執行框架模式

內建 `codex` 執行框架是嵌入式 OpenClaw 代理回合的原生 Codex 模式。請先啟用內建 `codex` 外掛；如果你的設定使用限制性允許清單，請在 `plugins.allow` 中包含 `codex`。原生應用程式伺服器設定應使用 `openai/gpt-*`；OpenAI 代理回合預設會選取 Codex 執行框架。舊版 Codex 模型參照路由應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*` 模型參照仍是原生執行框架的相容性別名。

此模式執行時，Codex 擁有原生執行緒 ID、續接行為、壓縮和應用程式伺服器執行。OpenClaw 仍擁有聊天頻道、可見逐字稿鏡像、工具政策、核准、媒體傳遞和工作階段選取。當你需要證明只有 Codex 應用程式伺服器路徑可以宣告執行時，請使用提供者／模型 `agentRuntime.id: "codex"`。明確的外掛執行階段會以關閉方式失敗；Codex 應用程式伺服器選取失敗和執行階段失敗不會透過另一個執行階段重試。

## 執行階段嚴格性

預設情況下，OpenClaw 使用 `auto` 提供者／模型執行階段政策：已註冊的外掛執行框架可以宣告提供者／模型配對，沒有符合項目時則由嵌入式執行階段處理回合。官方 OpenAI 提供者上的 OpenAI 代理參照預設為 Codex。
當缺少執行框架選取應該失敗，而不是透過嵌入式執行階段路由時，請使用明確的提供者／模型外掛執行階段，例如 `agentRuntime.id: "codex"`。選取的外掛執行框架失敗一律會硬性失敗。這不會封鎖明確的提供者／模型 `agentRuntime.id: "openclaw"`。

針對 Codex 專用嵌入式執行：

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

每個代理的覆寫使用相同的模型範圍形狀：

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

像這樣的舊版整個代理執行階段範例會被忽略：

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

透過明確的外掛執行階段，當要求的執行框架未註冊、不支援解析出的供應商/模型，或在產生回合副作用之前失敗時，工作階段會提早失敗。這對僅限 Codex 的部署，以及必須證明 Codex app-server 路徑確實正在使用的即時測試而言，是有意為之。

此設定只控制內嵌代理執行框架。它不會停用圖片、影片、音樂、TTS、PDF 或其他供應商特定的模型路由。

## 原生工作階段與逐字稿鏡像

執行框架可以保留原生工作階段 ID、討論串 ID，或常駐程式端的續用權杖。請讓該繫結明確關聯到 OpenClaw 工作階段，並持續將使用者可見的助理/工具輸出鏡像到 OpenClaw 逐字稿中。

OpenClaw 逐字稿仍是以下用途的相容性層：

- 頻道可見的工作階段歷史記錄
- 逐字稿搜尋與索引
- 在之後的回合切回內建 OpenClaw 執行框架
- 通用的 `/new`、`/reset` 與工作階段刪除行為

如果你的執行框架儲存側車繫結，請實作 `reset(...)`，讓 OpenClaw 能在擁有該繫結的 OpenClaw 工作階段重設時清除它。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入準備好的嘗試。當執行框架執行動態工具呼叫時，請透過執行框架結果形狀傳回工具結果，而不是自行傳送頻道媒體。

這會讓文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，和由 OpenClaw 支援的執行走相同的傳遞路徑。

## 目前限制

- 公開匯入路徑是通用的，但部分嘗試/結果型別別名仍保留舊名稱以維持相容性。
- 第三方執行框架安裝仍屬實驗性質。在需要原生工作階段執行階段之前，請優先使用供應商外掛。
- 支援跨回合切換執行框架。在原生工具、核准、助理文字或訊息傳送開始後，請不要在回合中途切換執行框架。

## 相關

- [SDK 概觀](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型供應商](/zh-TW/concepts/model-providers)

---
read_when:
    - 你正在變更嵌入式代理執行階段或測試框架登錄檔
    - 你正在從隨附或受信任的 Plugin 註冊代理程式控管框架
    - 你需要了解 Codex Plugin 與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器的 Plugin 使用的實驗性 SDK 介面
title: 代理程式執行框架 Plugin
x-i18n:
    generated_at: "2026-05-03T21:42:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理執行器**是用於一個已準備 OpenClaw 代理回合的低階執行器。它不是模型供應商、不是通道，也不是工具登錄檔。關於面向使用者的心智模型，請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)。

只有內建或受信任的原生 Plugin 才應使用此介面。此合約仍屬實驗性，因為參數型別刻意鏡像目前的嵌入式執行器。

## 何時使用執行器

當某個模型系列有自己的原生工作階段執行階段，而且一般 OpenClaw 供應商傳輸不是合適的抽象時，請註冊代理執行器。

範例：

- 擁有執行緒和 Compaction 的原生程式碼代理伺服器
- 必須串流原生計畫/推理/工具事件的本機 CLI 或常駐程式
- 除了 OpenClaw 工作階段逐字稿之外，還需要自己的續接 ID 的模型執行階段

不要只為了新增新的 LLM API 而註冊執行器。對於一般 HTTP 或 WebSocket 模型 API，請建置[供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍擁有的內容

在選取執行器之前，OpenClaw 已經解析：

- 供應商和模型
- 執行階段驗證狀態
- 思考層級和脈絡預算
- OpenClaw 逐字稿/工作階段檔案
- 工作區、沙箱和工具政策
- 通道回覆回呼和串流回呼
- 模型備援和即時模型切換政策

這種分工是刻意的。執行器會執行已準備的嘗試；它不會選擇供應商、取代通道遞送，或悄悄切換模型。

已準備的嘗試也包含 `params.runtimePlan`，這是 OpenClaw 擁有的政策套件，用於必須在 PI 和原生執行器之間保持共用的執行階段決策：

- `runtimePlan.tools.normalize(...)` 和
  `runtimePlan.tools.logDiagnostics(...)`，用於具供應商感知的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字稿清理和
  工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用的 `NO_REPLY` 和媒體
  遞送抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型備援分類
- `runtimePlan.observability`，用於已解析的供應商/模型/執行器中繼資料

執行器可以將計畫用於需要符合 PI 行為的決策，但仍應將其視為主機擁有的嘗試狀態。不要變更它，也不要用它在回合內切換供應商/模型。

## 註冊執行器

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

OpenClaw 會在供應商/模型解析後選擇執行器：

1. 現有工作階段記錄的執行器 ID 優先，因此設定/環境變更不會將該逐字稿熱切換到另一個執行階段。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會強制尚未釘選的工作階段使用具有該 ID 的已註冊執行器。
3. `OPENCLAW_AGENT_RUNTIME=pi` 會強制使用內建 PI 執行器。
4. `OPENCLAW_AGENT_RUNTIME=auto` 會詢問已註冊執行器是否支援已解析的供應商/模型。
5. 如果沒有已註冊執行器符合，OpenClaw 會使用 PI，除非 PI 備援已停用。

Plugin 執行器失敗會呈現為執行失敗。在 `auto` 模式中，只有當沒有已註冊 Plugin 執行器支援已解析的供應商/模型時，才會使用 PI 備援。一旦某個 Plugin 執行器已宣告執行，OpenClaw 不會透過 PI 重播同一個回合，因為那可能會改變驗證/執行階段語意或重複副作用。

選取的執行器 ID 會在嵌入式執行後與工作階段 ID 一起持久保存。在執行器釘選之前建立的舊版工作階段，只要已有逐字稿歷史，就會被視為已釘選到 PI。在 PI 和原生 Plugin 執行器之間切換時，請使用新的/重設的工作階段。`/status` 會在 `Fast` 旁顯示非預設執行器 ID，例如 `codex`；PI 會保持隱藏，因為它是預設相容路徑。如果選取的執行器令人意外，請啟用 `agents/harness` 偵錯記錄，並檢查 Gateway 的結構化 `agent harness selected` 記錄。它包含選取的執行器 ID、選取原因、執行階段/備援政策，以及在 `auto` 模式中每個 Plugin 候選項目的支援結果。

內建 Codex Plugin 會註冊 `codex` 作為其執行器 ID。核心會將其視為一般 Plugin 執行器 ID；Codex 專屬別名應屬於 Plugin 或操作員設定，而不是共用執行階段選擇器。

## 供應商加執行器配對

大多數執行器也應註冊供應商。供應商會讓模型參照、驗證狀態、模型中繼資料和 `/model` 選取對 OpenClaw 其他部分可見。然後執行器在 `supports(...)` 中宣告該供應商。

內建 Codex Plugin 遵循此模式：

- 偏好的使用者模型參照：`openai/gpt-5.5` 加上
  `agentRuntime.id: "codex"`
- 相容性參照：舊版 `codex/gpt-*` 參照仍被接受，但新
  設定不應將其作為一般供應商/模型參照使用
- 執行器 ID：`codex`
- 驗證：合成供應商可用性，因為 Codex 執行器擁有
  原生 Codex 登入/工作階段
- 應用程式伺服器請求：OpenClaw 會將裸模型 ID 傳送給 Codex，並讓
  執行器與原生應用程式伺服器協定通訊

Codex Plugin 是加成式的。一般 `openai/gpt-*` 參照會繼續使用一般 OpenClaw 供應商路徑，除非你使用 `agentRuntime.id: "codex"` 強制使用 Codex 執行器。較舊的 `codex/gpt-*` 參照仍會選取 Codex 供應商和執行器以維持相容性。

關於操作員設定、模型前綴範例和 Codex 專用設定，請參閱
[Codex 執行器](/zh-TW/plugins/codex-harness)。

OpenClaw 需要 Codex 應用程式伺服器 `0.125.0` 或更新版本。Codex Plugin 會檢查應用程式伺服器初始化握手，並封鎖較舊或未標版本的伺服器，讓 OpenClaw 只針對已測試過的協定介面執行。`0.125.0` 下限包含在 Codex `0.124.0` 中落地的原生 MCP hook 承載支援，同時將 OpenClaw 釘選到較新的已測試穩定線。

### 工具結果中介軟體

內建 Plugin 可以在其資訊清單於 `contracts.agentToolResultMiddleware` 中宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加執行階段中立的工具結果中介軟體。這個受信任介面適用於非同步工具結果轉換，這些轉換必須在 PI 或 Codex 將工具輸出回饋給模型之前執行。

舊版內建 Plugin 仍可使用
`api.registerCodexAppServerExtensionFactory(...)` 作為僅限 Codex 應用程式伺服器的中介軟體，但新的結果轉換應使用執行階段中立 API。
僅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` hook 已移除；Pi 工具結果轉換必須使用執行階段中立中介軟體。

### 終端結果分類

擁有自己協定投影的原生執行器，可以在完成的回合未產生可見助理文字時，使用來自 `openclaw/plugin-sdk/agent-harness-runtime` 的 `classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會回傳 `empty`、`reasoning-only` 或 `planning-only`，讓 OpenClaw 的備援政策決定是否在不同模型上重試。它刻意不分類提示錯誤、進行中的回合，以及例如 `NO_REPLY` 這類刻意靜默的回覆。

### 原生 Codex 執行器模式

內建 `codex` 執行器是嵌入式 OpenClaw 代理回合的原生 Codex 模式。請先啟用內建 `codex` Plugin；如果你的設定使用限制性允許清單，也請在 `plugins.allow` 中包含 `codex`。原生應用程式伺服器設定應使用帶有 `agentRuntime.id: "codex"` 的 `openai/gpt-*`。
請使用 `openai-codex/*` 透過 PI 進行 Codex OAuth。舊版 `codex/*` 模型參照仍作為原生執行器的相容性別名。

此模式執行時，Codex 擁有原生執行緒 ID、續接行為、Compaction 和應用程式伺服器執行。OpenClaw 仍擁有聊天通道、可見逐字稿鏡像、工具政策、核准、媒體遞送和工作階段選取。當你需要證明只有 Codex 應用程式伺服器路徑可以宣告該執行時，請使用 `agentRuntime.id: "codex"`。明確 Plugin 執行階段會封閉失敗；Codex 應用程式伺服器選取失敗和執行階段失敗不會透過 PI 重試。

## 執行階段嚴格性

預設情況下，OpenClaw 會使用 OpenClaw Pi 執行嵌入式代理。在 `auto` 模式中，已註冊的 Plugin 執行器可以宣告某個供應商/模型配對，而在沒有符合項目時由 PI 處理該回合。當缺少執行器選取應該失敗而不是透過 PI 路由時，請使用明確的 Plugin 執行階段，例如 `agentRuntime.id: "codex"`。選取的 Plugin 執行器失敗一律會硬失敗。這不會阻止明確的 `agentRuntime.id: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

對於僅限 Codex 的嵌入式執行：

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

如果你希望任何已註冊的 Plugin 執行器宣告符合的模型，否則使用 PI，請設定 `id: "auto"`：

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

每個代理的覆寫使用相同形狀：

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

`OPENCLAW_AGENT_RUNTIME` 仍會覆寫已設定的執行階段。

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

使用明確 Plugin 執行階段時，若要求的執行器未註冊、不支援已解析的供應商/模型，或在產生回合副作用之前失敗，工作階段會提早失敗。這對於僅限 Codex 的部署，以及必須證明 Codex 應用程式伺服器路徑實際使用中的即時測試，是刻意設計的行為。

此設定只控制嵌入式代理執行器。它不會停用圖片、影片、音樂、TTS、PDF 或其他供應商專屬模型路由。

## 原生工作階段和逐字稿鏡像

執行器可以保留原生工作階段 ID、執行緒 ID 或常駐程式端的續接權杖。請讓該繫結明確關聯到 OpenClaw 工作階段，並持續將使用者可見的助理/工具輸出鏡像到 OpenClaw 逐字稿中。

OpenClaw 逐字稿仍是下列項目的相容性層：

- 通道可見的工作階段歷史
- 逐字稿搜尋和索引
- 在後續回合切回內建 PI 執行器
- 通用 `/new`、`/reset` 和工作階段刪除行為

如果你的執行器儲存旁掛繫結，請實作 `reset(...)`，讓 OpenClaw 可以在擁有該繫結的 OpenClaw 工作階段重設時清除它。

## 工具和媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備的嘗試。當執行器執行動態工具呼叫時，請透過執行器結果形狀回傳工具結果，而不是自行傳送通道媒體。

這會讓文字、圖片、影片、音樂、TTS、核准和訊息工具輸出，與 PI 支援的執行保持在相同遞送路徑上。

## 目前限制

- 公開匯入路徑是通用的，但某些嘗試/結果型別別名仍
  保留 `Pi` 名稱以維持相容性。
- 第三方執行框架安裝仍屬實驗性質。建議優先使用提供者 Plugin，
  直到你需要原生工作階段執行環境。
- 支援跨回合切換執行框架。在原生工具、核准、助理文字或訊息
  傳送已開始後，請勿在同一回合中途切換執行框架。

## 相關

- [SDK 總覽](/zh-TW/plugins/sdk-overview)
- [執行階段輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

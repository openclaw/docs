---
read_when:
    - 你正在變更內嵌的代理執行階段或控制框架登錄檔
    - 你正在從內建或受信任的外掛註冊代理程式執行框架
    - 你需要瞭解 Codex 外掛與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理程式執行器之外掛使用的實驗性 SDK 介面
title: 代理程式框架外掛
x-i18n:
    generated_at: "2026-07-12T14:41:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理執行框架**是單次已準備完成的 OpenClaw 代理回合之低階執行器。它不是模型供應商、不是通道，也不是工具登錄檔。若要了解面向使用者的概念模型，請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)。

此介面僅供內建或受信任的原生外掛使用。此合約仍處於實驗階段，因為參數型別刻意對應目前的內嵌執行器。

## 何時使用執行框架

當模型系列擁有自己的原生工作階段執行階段，且一般的 OpenClaw 供應商傳輸並非適當的抽象層時，請註冊代理執行框架：

- 擁有執行緒與壓縮功能的原生程式設計代理伺服器
- 必須串流原生計畫／推理／工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字記錄外，還需要自己續接 ID 的模型執行階段

請**勿**僅為了新增 LLM API 而註冊執行框架。對於一般 HTTP 或 WebSocket 模型 API，請建立[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的項目

選取執行框架之前，OpenClaw 已經解析：

- 供應商與模型
- 執行階段驗證狀態，除非執行框架宣告由其負責驗證啟動程序
- 思考層級與上下文預算
- OpenClaw 逐字記錄／工作階段檔案
- 工作區、沙箱及工具政策
- 通道回覆回呼與串流回呼
- 模型後援與即時模型切換政策

執行框架會執行已準備完成的嘗試；它不會選擇供應商、取代通道傳遞，或悄悄切換模型。

### 執行框架負責的驗證啟動程序

依預設，核心會在呼叫執行框架前解析供應商認證資訊。能透過自身原生執行階段進行驗證的受信任執行框架，可在其靜態 `AgentHarness` 註冊中設定 `authBootstrap: "harness"`。接著，對於該執行框架宣告處理的每次嘗試，核心都會略過通用供應商認證資訊啟動程序，以及缺少認證資訊時的失敗處理。

若存在相容且明確選取或已排序的 OpenClaw 驗證設定檔及其限定範圍的儲存區，核心仍會將其轉交。執行框架必須先解析該設定檔或其原生認證資訊，再發出模型要求；必須將機密限制在該次嘗試的範圍內，並呈現可採取行動的驗證失敗訊息。若執行框架僅在部分情況下負責驗證，請勿設定此功能。

### 經驗證的設定執行階段成品

能為首次執行設定提供推論能力的本機執行框架，必須證明完成探測的實作。當 `params.captureRuntimeArtifact` 為 true 時，請傳回具有穩定 ID 與內容指紋的不透明 `result.runtimeArtifact`。請註冊相符的 `runtimeArtifact.validate(...)` 功能，以重新檢查該繫結，而不載入其他執行框架或掃描不相關的外掛。

經驗證的 Crestodian 接續也會傳入 `params.expectedRuntimeArtifact`。執行框架必須將它與取得的確切原生程序進行比較；若兩者不同，必須在啟動或續接原生執行緒前失敗。一般代理回合會省略這兩個欄位，因此內容雜湊不會進入一般要求的熱路徑。遠端／WebSocket 執行框架必須先具備伺服器證明合約，才能參與；僅有版本字串並不足以構成成品身分。

已準備的嘗試也包含 `params.runtimePlan`，這是由 OpenClaw 擁有的執行階段決策政策套件，必須由 OpenClaw 與原生執行框架共同使用：

- `runtimePlan.tools.normalize(...)` 與 `runtimePlan.tools.logDiagnostics(...)`，用於感知供應商的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字記錄清理與工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用的 `NO_REPLY` 與媒體傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型後援分類
- `runtimePlan.observability`，用於已解析的供應商／模型／執行框架中繼資料

執行框架可將此計畫用於需要符合 OpenClaw 行為的決策，但應將其視為主機擁有的嘗試狀態：請勿修改它，也不要使用它在回合內切換供應商／模型。

### 要求傳輸合約

`supports(ctx)` 會透過 `ctx.modelProvider` 接收已解析的模型傳輸。下列兩項不含機密且由供應商擁有的事實，會描述所選路由：

- `runtimePolicy.compatibleIds` 會列出供應商宣告與該具體路由相容的執行階段 ID。未設定政策表示供應商未宣告路由層級相容性；這不代表可以假設支援。
- `requestTransportOverrides: "none"` 表示不需要重現任何由作者設定的供應商／模型要求覆寫。`"present"` 表示存在由作者設定的標頭、驗證傳輸、Proxy、TLS、本機服務、私人網路行為或要求參數。此事實不會揭露這些值。

當執行框架無法重現已準備的傳輸時，請傳回 `{ supported: false, reason }`。選取後，請勿透過讀取原始設定來推斷支援情況。當驗證準備程序產生多條重試路由時，單一執行框架必須支援所有路由，才能進行分派。若沒有外掛能負責完整路由集合，隱含選取會使用 OpenClaw；明確或持久化的外掛選取則會以封閉方式失敗。

## 註冊執行框架

**匯入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "我的原生代理執行框架",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "有效路由與執行框架不相容" };
  },

  async runAttempt(params) {
    // 啟動或續接你的原生執行緒。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent 以及其他已準備的嘗試欄位。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "我的原生代理",
  description: "透過原生代理常駐程式執行所選模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

此通用範例刻意省略 `authBootstrap`。只有在執行框架符合上述合約時，才加入 `authBootstrap: "harness"`。

### 委派執行

執行框架擁有者可將 `delegatedExecutionPluginIds` 設為受信任外掛的 ID，讓這些外掛能執行現有且模型已鎖定的工作階段，例如語音傳輸接續由 Codex 支援的對話。這是擁有者的靜態同意，而不是核心允許清單。請將範圍保持在最小限度。

受委派者只會獲得工作准入與內嵌執行權限。OpenClaw 要求完全相符的已儲存工作階段金鑰、儲存區路徑及工作階段 ID；`modelSelectionLocked:
true`；以及相符的 `agentHarnessId` 與 `agentHarnessRuntimeOverride` 值。接著，執行會透過執行框架擁有者限定範圍。工作階段建立、修補、重設、刪除、封存及閘道變更仍僅限擁有者執行。

## 選取政策

OpenClaw 會在解析供應商／模型後選擇執行框架：

1. 模型範圍的執行階段政策優先。
2. 其次是供應商範圍的執行階段政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的有效路由。僅憑供應商／模型前置詞絕不會選取執行框架。
4. 若沒有相符的已註冊執行框架，OpenClaw 會使用其內嵌執行階段。

外掛執行框架失敗會呈現為執行失敗。在 `auto` 模式下，只有在沒有任何已註冊外掛執行框架支援已解析的供應商／模型時，才會使用內嵌後援。一旦外掛執行框架宣告處理某次執行，OpenClaw 不會再透過另一個執行階段重播同一回合，因為這可能改變驗證／執行階段語意或造成重複的副作用。

已設定的執行階段政策對所需執行階段仍具有最終決定權。即使路由／驗證準備仍在進行，持久化工作階段的 `agentHarnessId` 仍會保有其原生逐字記錄的擁有權。兩者都不能使不相容的路由變得相容：一旦取得已準備的事實，選取或固定的執行框架就必須支援它們，否則執行會以封閉方式失敗。`/status` 會顯示根據政策、持久化擁有權及路由支援所選取的有效執行階段。
已準備狀態會明確呈現：缺少 `runtimePolicy` 時仍會保持未宣告狀態，而不會根據剛好存在的傳輸欄位來推斷。
當執行框架負責的驗證留下多條尚未解析的實體路由時，已準備的支援事實是其相容執行階段 ID 的交集；若任何候選項目含有要求覆寫，也會回報。因此，只要有一個未宣告的候選項目，原生相容性就會變成空集合；`preparedAuth.source: "harness"` 代表驗證擁有者，而不是推斷路由支援的許可。

如果選取的執行框架出乎預期，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄：其中包含所選執行框架 ID、選取原因、執行階段／後援政策；在 `auto` 模式下，還包含每個外掛候選項目的支援結果。

內建 Codex 外掛會以 `codex` 作為其執行框架 ID 進行註冊。核心會將其視為一般外掛執行框架 ID；Codex 專屬別名應位於外掛或操作者設定中，而不是共用執行階段選取器中。

## 供應商與執行框架配對

大多數執行框架也應註冊供應商。供應商會讓模型參照、驗證狀態、模型中繼資料及 `/model` 選取對 OpenClaw 其他部分可見。接著，執行框架會在 `supports(...)` 中宣告處理該供應商。

內建 Codex 外掛採用此模式：

- 偏好的使用者模型參照：`openai/gpt-5.6-sol`
- 相容性參照：仍接受舊版 `codex/gpt-*` 參照，但新設定不應將其用作一般供應商／模型參照
- 執行框架 ID：`codex`
- 驗證：合成的供應商可用性，因為 Codex 執行框架負責原生 Codex 登入／工作階段
- 應用程式伺服器要求：OpenClaw 將純模型 ID 傳送至 Codex，並讓執行框架與原生應用程式伺服器通訊協定溝通

Codex 外掛是增補性功能。當執行階段政策未設定或設為 `auto` 時，只有在供應商擁有的路由合約宣告與 `codex` 相容時，OpenAI 才可能選取 Codex：也就是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有任何由作者設定的要求覆寫。僅憑 `openai/*` 前置詞絕不會選取 Codex。自訂端點、Completions 轉接器及由作者設定的要求行為仍由 OpenClaw 處理。純文字官方 HTTP 端點會遭拒絕。較舊的 `codex/gpt-*` 參照仍可作為相容性輸入。請參閱
[OpenAI 隱含代理執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

如需操作者設定、模型前置詞範例及僅限 Codex 的設定，請參閱
[Codex 執行框架](/zh-TW/plugins/codex-harness)。

Codex 外掛會強制執行 [Codex 執行框架](/zh-TW/plugins/codex-harness)中記載的最低應用程式伺服器版本。它會檢查初始化交握，並封鎖較舊或未標示版本的伺服器，因此 OpenClaw 只會針對已測試的通訊協定介面執行。

### 工具結果中介軟體

內建外掛與明確啟用且資訊清單合約相符的已安裝外掛，可在其資訊清單於 `contracts.agentToolResultMiddleware` 中宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加不受執行階段限制的工具結果中介軟體。此受信任介面用於必須在 OpenClaw 或 Codex 將工具輸出送回模型前執行的非同步工具結果轉換。

舊版內建外掛仍可使用 `api.registerCodexAppServerExtensionFactory(...)` 進行僅限 Codex 應用程式伺服器的中介軟體處理，但新的結果轉換應使用不受執行階段限制的 API。僅限內嵌執行器的 `api.registerEmbeddedExtensionFactory(...)` 掛鉤已移除；內嵌工具結果轉換必須使用不受執行階段限制的中介軟體。

### 終端結果分類

自行擁有協定投影的原生執行框架，在已完成的回合未產生可見的助理文字時，可以使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會傳回 `empty`、`reasoning-only` 或
`planning-only`，讓 OpenClaw 的備援政策決定是否要改用其他模型重試。
`planning-only` 需要執行框架明確提供 `planText` 欄位；OpenClaw 不會從助理的文字內容推斷。
此輔助函式刻意不分類提示錯誤、進行中的回合，以及像 `NO_REPLY` 這類刻意保持靜默的回覆。

### 代理結束時的副作用

原生執行框架在完成一次嘗試的最終處理後，必須呼叫
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`runAgentEndSideEffects(...)`。它會分派可攜式 `agent_end` 鉤子與 OpenClaw 的研究擷取，
且不會延遲互動式回覆。對於本機、非互動式執行，若嘗試必須等到這些副作用完成後才能解析，
請使用 `awaitAgentEndSideEffects(...)`。這兩個輔助函式都接受與
`runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 承載資料；其失敗不會改變已完成的
嘗試結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入要求的原生執行框架，應使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的使用者輸入輔助函式來格式化提示、
透過 OpenClaw 的阻塞式回覆路徑傳送提示，並將選項／自由格式答案正規化回執行階段的原生回應形狀。
此輔助函式會讓頻道／終端介面的呈現方式保持一致，而各執行框架仍自行管理其協定剖析與待處理要求的生命週期。

需要類似 PI 的精簡工具路由的原生執行框架，應使用
`openclaw/plugin-sdk/agent-harness-tool-runtime` 中的
`createAgentHarnessToolSurfaceRuntime(...)`。它負責工具搜尋／程式碼模式控制項選擇、
本機模型的精簡預設值、與執行階段相容的結構描述篩選、隱藏型目錄執行、目錄載入，
以及目錄清理。執行框架仍自行管理其 SDK 特定的工具轉換與原生執行回呼。

### 原生 Codex 執行框架模式

隨附的 `codex` 執行框架是嵌入式 OpenClaw 代理回合使用的原生 Codex 模式。
請先啟用隨附的 `codex` 外掛；如果你的設定使用限制性允許清單，也請在
`plugins.allow` 中加入 `codex`。原生應用程式伺服器設定應使用 `openai/gpt-*`；
只有在有效路由宣告與 Codex 相容時，OpenAI 代理回合才會選取 Codex 執行框架。
舊版 Codex 模型參照應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*`
模型參照仍保留為原生執行框架的相容性別名。

此模式執行時，Codex 負責原生執行緒 ID、繼續行為、壓縮與應用程式伺服器執行。
OpenClaw 仍負責聊天頻道、可見的逐字稿鏡像、工具政策、核准、媒體傳送與工作階段選擇。
當你需要證明只有 Codex 應用程式伺服器路徑能接手該次執行時，請使用供應商／模型的
`agentRuntime.id: "codex"`。明確指定的外掛執行階段會採取封閉式失敗；Codex
應用程式伺服器選取失敗與執行階段失敗，不會透過其他執行階段重試。

## 執行階段嚴格性

OpenClaw 預設使用 `auto` 供應商／模型執行階段政策：已註冊的外掛執行框架可以接手相容的有效路由；
若沒有任何符合項目，則由嵌入式執行階段處理該回合。單憑供應商／模型前綴絕不會選取執行框架。
如果執行框架選取缺失時應直接失敗，而非改由嵌入式執行階段路由，請使用明確的供應商／模型外掛執行階段，
例如 `agentRuntime.id: "codex"`。明確選取不會讓不相容的路由變得相容。
所選外掛執行框架的失敗一律會造成硬性失敗。這不會封鎖明確的供應商／模型
`agentRuntime.id: "openclaw"`。

僅限 Codex 的嵌入式執行：

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
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

如果你想為單一標準模型使用命令列介面後端，請將執行階段放在該模型項目中：

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

每個代理的覆寫使用相同的模型範圍結構：

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

如下所示的舊版全代理執行階段範例會被忽略：

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

使用明確的外掛執行階段時，若要求的執行框架尚未註冊、不支援解析後的供應商／模型，
或在產生回合副作用前失敗，工作階段會提早失敗。對於僅限 Codex 的部署，以及必須證明
Codex 應用程式伺服器路徑確實正在使用的即時測試而言，這是刻意的設計。

此設定只控制嵌入式代理執行框架。它不會停用圖片、影片、音樂、TTS、PDF
或其他供應商特定的模型路由。

## 原生工作階段與逐字稿鏡像

執行框架可以保留原生工作階段 ID、執行緒 ID 或常駐程式端的繼續權杖。
請將該繫結明確關聯至 OpenClaw 工作階段，並持續將使用者可見的助理／工具輸出鏡像至
OpenClaw 逐字稿。

OpenClaw 逐字稿仍是下列項目的相容層：

- 頻道可見的工作階段歷程記錄
- 逐字稿搜尋與索引
- 在後續回合切換回內建的 OpenClaw 執行框架
- 通用的 `/new`、`/reset` 與工作階段刪除行為

如果你的執行框架儲存了附屬繫結，請實作 `reset(...)`，讓 OpenClaw
能在所屬的 OpenClaw 工作階段重設時將其清除。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備的嘗試。
當執行框架執行動態工具呼叫時，請透過執行框架結果形狀傳回工具結果，
而不要自行傳送頻道媒體。

如此可讓文字、圖片、影片、音樂、TTS、核准與訊息工具輸出，
使用與 OpenClaw 支援的執行相同的傳送路徑。

## 目前限制

- 公開匯入路徑是通用的，但部分嘗試／結果型別別名仍為了相容性保留舊名稱。
- 第三方執行框架安裝仍屬實驗性功能。在需要原生工作階段執行階段之前，請優先使用供應商外掛。
- 支援跨回合切換執行框架。原生工具、核准、助理文字或訊息傳送開始後，
  請勿在回合進行途中切換執行框架。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview)
- [執行階段輔助函式](/zh-TW/plugins/sdk-runtime)
- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型供應商](/zh-TW/concepts/model-providers)

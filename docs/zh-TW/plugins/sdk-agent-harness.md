---
read_when:
    - 你正在變更內嵌的代理執行階段或工具框架登錄檔
    - 你正在從內建或受信任的外掛註冊代理程式框架
    - 你需要瞭解 Codex 外掛與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器之外掛使用的實驗性 SDK 介面
title: 代理程式框架外掛
x-i18n:
    generated_at: "2026-07-19T13:59:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43049c126b4defd347b56c31da1b6482e050aa294c3a84673cca59fa5909241
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理執行框架**是單次已準備 OpenClaw 代理回合的底層執行器。它不是模型供應商、不是頻道，也不是工具登錄檔。關於面向使用者的心智模型，請參閱[代理執行階段](/zh-TW/concepts/agent-runtimes)。

此介面僅供內建或受信任的原生外掛使用。此契約仍處於實驗階段，因為參數型別刻意反映目前的嵌入式執行器。

## 何時使用執行框架

當模型系列有自己的原生工作階段執行階段，且一般 OpenClaw 供應商傳輸並非適當的抽象層時，請註冊代理執行框架：

- 擁有執行緒和壓縮功能的原生程式設計代理伺服器
- 必須串流原生計畫／推理／工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字記錄外，還需要自有恢復 ID 的模型執行階段

**不要**只為了新增 LLM API 而註冊執行框架。對於一般 HTTP 或 WebSocket 模型 API，請建置[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的事項

在選取執行框架之前，OpenClaw 已解析：

- 供應商和模型
- 執行階段驗證狀態，除非執行框架宣告由其負責驗證啟動程序
- 思考層級和上下文預算
- OpenClaw 逐字記錄／工作階段檔案
- 工作區、沙箱和工具政策
- 頻道回覆回呼和串流回呼
- 模型備援和即時模型切換政策

執行框架會執行已準備的嘗試；它不會挑選供應商、取代頻道傳遞，或在未告知的情況下切換模型。

### 執行框架負責的驗證啟動程序

依預設，核心會先解析供應商認證資訊，再呼叫執行框架。可透過自身原生執行階段進行驗證的受信任執行框架，可在其靜態 `AgentHarness` 註冊上設定 `authBootstrap: "harness"`。核心接著會針對該執行框架認領的每次嘗試，略過通用供應商認證資訊啟動程序與缺少認證資訊的失敗。

如果存在相容且明確選取或排序的 OpenClaw 驗證設定檔及其範圍限定儲存區，核心仍會轉送它們。執行框架必須先解析該設定檔或其原生認證資訊，才能發出模型要求；將祕密的範圍限制在該次嘗試內，並呈現可採取行動的驗證失敗。若執行框架僅有時負責驗證，請勿設定此能力。

### 已驗證的設定執行階段成品

可為首次執行設定提供推論能力的本機執行框架，必須證明完成探測的實作。當
`params.captureRuntimeArtifact` 為 true 時，請傳回具有穩定 ID 和內容指紋的不透明
`result.runtimeArtifact`。請註冊相符的 `runtimeArtifact.validate(...)` 能力，以便在不載入其他執行框架或掃描不相關外掛的情況下，重新檢查該繫結。

已驗證的 OpenClaw 延續也會傳遞 `params.expectedRuntimeArtifact`。
執行框架必須將其與所取得的確切原生程序比較；若兩者不同，則必須在啟動或恢復原生執行緒之前失敗。一般代理回合會省略這兩個欄位，因此內容雜湊不會進入一般要求的熱門路徑。遠端／WebSocket 執行框架必須先有伺服器證明契約才能參與；僅有版本字串不足以作為成品識別資訊。

已準備的嘗試也包含 `params.runtimePlan`，這是由 OpenClaw 擁有的政策組合，適用於必須在 OpenClaw 與原生執行框架之間保持共用的執行階段決策：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)`
  用於感知供應商的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)` 用於逐字記錄清理和
  工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)` 用於共用 `NO_REPLY` 和媒體
  傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用於模型備援
  分類
- `runtimePlan.observability` 用於已解析的供應商／模型／執行框架中繼資料

執行框架可將此計畫用於需要符合 OpenClaw 行為的決策，但應將其視為主機擁有的嘗試狀態：請勿修改它，也不要用它在回合內切換供應商／模型。

### 要求傳輸契約

`supports(ctx)` 會在 `ctx.modelProvider` 中接收已解析的模型傳輸。
兩項不含祕密且由供應商擁有的事實描述所選路由：

- `runtimePolicy.compatibleIds` 列出供應商宣告與該具體路由相容的執行階段 ID。缺少政策表示供應商未宣告路由層級的相容性；這並不代表可以假設支援。
- `requestTransportOverrides: "none"` 表示不需要重現任何明確撰寫的供應商／模型要求覆寫。`"present"` 表示存在明確撰寫的標頭、驗證傳輸、Proxy、TLS、本機服務、私有網路行為或要求參數。此事實不會公開這些值。

當執行框架無法重現已準備的傳輸時，請傳回 `{ supported: false, reason }`。
請勿在完成選取後藉由讀取原始設定來推斷支援。當驗證準備產生多個重試路由時，一個執行框架必須支援所有路由，才能分派。若沒有外掛可負責完整集合，隱含選取會使用 OpenClaw；明確或持續保存的外掛選取則會採取封閉式失敗。

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
    // 啟動或恢復你的原生執行緒。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent，以及其他已準備的嘗試欄位。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "我的原生代理",
  description: "透過原生代理常駐程式執行選取的模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

此通用範例刻意不包含 `authBootstrap`。僅當執行框架符合上述契約時，才加入
`authBootstrap: "harness"`。

### 委派執行

執行框架擁有者可將 `delegatedExecutionPluginIds` 設定為需要執行現有模型鎖定工作階段的受信任外掛 ID，例如語音傳輸繼續由 Codex 支援的對話。這是靜態擁有者同意，而不是核心允許清單。請將其範圍保持在最低限度。

受委派者只會取得工作准入和嵌入式執行。OpenClaw 要求確切的已儲存工作階段金鑰、儲存區路徑和工作階段 ID；`modelSelectionLocked:
true`；以及相符的 `agentHarnessId` 和 `agentHarnessRuntimeOverride` 值。
接著會透過執行框架擁有者限制執行範圍。工作階段建立、修補、重設、刪除、封存和閘道變更仍僅限擁有者執行。

## 選取政策

OpenClaw 會在解析供應商／模型後選擇執行框架：

1. 模型範圍的執行階段政策優先。
2. 其次是供應商範圍的執行階段政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的有效
   路由。供應商／模型前綴本身絕不會選取執行框架。
4. 若沒有已註冊的執行框架相符，OpenClaw 會使用其嵌入式執行階段。

外掛執行框架的失敗會顯示為執行失敗。在 `auto` 模式下，僅當沒有已註冊的外掛執行框架支援已解析的供應商／模型時，才會套用嵌入式備援。一旦外掛執行框架認領執行，OpenClaw 就不會透過其他執行階段重播同一回合，因為這可能會變更驗證／執行階段語意或造成重複的副作用。

已設定的執行階段政策仍是所需執行階段的權威依據。在路由／驗證準備仍待完成時，持續保存的工作階段 `agentHarnessId` 會保有其原生逐字記錄的擁有權。兩者都無法使不相容的路由變得相容：一旦已準備的事實存在，選取或固定的執行框架就必須支援這些事實，否則執行會採取封閉式失敗。`/status` 會顯示依據政策、持續保存的擁有權和路由支援所選取的有效執行階段。
已準備狀態會明確表示：缺少 `runtimePolicy` 時會保持未宣告，而不是根據碰巧存在的傳輸欄位推斷。
當執行框架負責的驗證仍有多個實體路由未解析時，已準備的支援事實是其相容執行階段 ID 的交集；若有任何候選項具有要求覆寫，也會加以回報。因此，只要有一個未宣告的候選項，原生相容性就會變成空集合；`preparedAuth.source: "harness"`
是驗證擁有者，並不代表可推斷路由支援。

若選取的執行框架出乎預期，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄：其中包含選取的執行框架 ID、選取原因、執行階段／備援政策，以及在 `auto` 模式下各個外掛候選項的支援結果。

內建 Codex 外掛會將 `codex` 註冊為其執行框架 ID。核心會將其視為一般外掛執行框架 ID；Codex 特有的別名應位於外掛或操作人員設定中，而不是共用執行階段選取器中。

## 供應商與執行框架配對

大多數執行框架也應註冊供應商。供應商會讓模型參照、驗證狀態、模型中繼資料和 `/model` 選取對 OpenClaw 的其他部分可見。接著，執行框架會在 `supports(...)` 中認領該供應商。

內建 Codex 外掛遵循此模式：

- 偏好的使用者模型參照：`openai/gpt-5.6-sol`
- 相容性參照：仍接受舊版 `codex/gpt-*` 參照，但新設定不應將它們用作一般供應商／模型參照
- 執行框架 ID：`codex`
- 驗證：合成供應商可用性，因為 Codex 執行框架負責原生 Codex 登入／工作階段
- app-server 要求：OpenClaw 會將純模型 ID 傳送至 Codex，並讓執行框架與原生 app-server 通訊協定通訊

Codex 外掛為加法式功能。當執行階段政策未設定或為 `auto` 時，只有在 OpenAI 自有的路由契約宣告 `codex` 相容時，OpenAI 才能選取 Codex：即沒有明確撰寫要求覆寫的官方 HTTPS Platform Responses 或 ChatGPT Responses 精確路由。僅有 `openai/*` 前綴絕不會選取 Codex。自訂端點、Completions 配接器和明確撰寫的要求行為仍由 OpenClaw 處理。純文字官方 HTTP 端點會遭拒絕。較舊的 `codex/gpt-*` 參照仍作為相容性輸入。請參閱
[OpenAI 隱含代理執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

關於操作人員設定、模型前綴範例和僅限 Codex 的設定，請參閱
[Codex 執行框架](/zh-TW/plugins/codex-harness)。

Codex 外掛會強制執行 [Codex 執行框架](/zh-TW/plugins/codex-harness)中記載的最低 app-server 版本。它會檢查初始化交握並封鎖較舊或無版本資訊的伺服器，確保 OpenClaw 僅針對其已測試的通訊協定介面執行。

### 工具結果中介軟體

內建外掛和已明確啟用且具有相符資訊清單契約的已安裝外掛，可在其資訊清單於 `contracts.agentToolResultMiddleware` 中宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加不限定執行階段的工具結果中介軟體。此受信任介面適用於非同步工具結果轉換；這些轉換必須在 OpenClaw 或 Codex 將工具輸出送回模型之前執行。

舊版內建外掛仍可將
`api.registerCodexAppServerExtensionFactory(...)` 用於僅限 Codex app-server 的
中介軟體，但新的結果轉換應使用執行階段中立的 API。僅限
嵌入式執行器的 `api.registerEmbeddedExtensionFactory(...)` 掛鉤已
移除；嵌入式工具結果轉換必須使用執行階段中立的中介軟體。

### 終端結果分類

擁有自身協定投影的原生執行框架可在已完成的回合未產生
可見的助理文字時，使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會傳回 `empty`、`reasoning-only` 或
`planning-only`，讓 OpenClaw 的後援政策決定是否改用
其他模型重試。`planning-only` 需要執行框架明確提供 `planText`
欄位；OpenClaw 不會從助理文字中推斷該欄位。此輔助函式
刻意不分類提示詞錯誤、進行中的回合，以及
`NO_REPLY` 之類刻意保持靜默的回覆。

### 代理程式結束時的副作用

原生執行框架在完成一次嘗試的最終處理後，必須呼叫
`openclaw/plugin-sdk/agent-harness-runtime` 中的
`runAgentEndSideEffects(...)`。它會分派可移植的 `agent_end` 掛鉤和 OpenClaw 的研究擷取，
且不會延遲互動式回覆。對於本機非互動式執行，若嘗試必須等到這些
副作用完成後才能解析，請使用 `awaitAgentEndSideEffects(...)`。
這兩個輔助函式接受與 `runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 承載資料；
其失敗不會改變已完成嘗試的結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入要求的原生執行框架，應使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的使用者輸入輔助函式來格式化
提示詞、透過 OpenClaw 的阻塞式回覆路徑傳送提示詞，並將
選項／自由格式答案正規化回執行階段的原生回應形狀。此
輔助函式會維持頻道／終端介面的呈現一致，同時讓每個執行框架保有自己的
協定剖析與待處理要求生命週期。

需要類似 PI 的精簡工具路由之原生執行框架，應使用
`openclaw/plugin-sdk/agent-harness-tool-runtime` 中的
`createAgentHarnessToolSurfaceRuntime(...)`。它負責
工具搜尋／程式碼模式控制選擇、本機模型的精簡預設值、
與執行階段相容的結構描述篩選、隱藏目錄執行、目錄
填入，以及目錄清理。執行框架仍負責其 SDK 專屬工具
轉換與原生執行回呼。

### 原生 Codex 執行框架模式

內建的 `codex` 執行框架是嵌入式 OpenClaw
代理程式回合的原生 Codex 模式。請先啟用內建的 `codex` 外掛；若設定使用限制性允許清單，請在
`plugins.allow` 中加入 `codex`。原生 app-server
設定應使用 `openai/gpt-*`；只有當有效路由宣告與 Codex 相容時，OpenAI 代理程式回合
才會選取 Codex 執行框架。舊版 Codex 模型
參照應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*`
模型參照仍是原生執行框架的相容性別名。

此模式執行時，Codex 負責原生執行緒 ID、恢復行為、
壓縮及 app-server 執行。OpenClaw 仍負責聊天頻道、
可見的逐字稿鏡像、工具政策、核准、媒體傳送及工作階段
選取。當你需要證明只有 Codex app-server 路徑可以取得此執行時，
請使用提供者／模型 `agentRuntime.id: "codex"`。明確指定的外掛
執行階段會採取失敗關閉；Codex app-server 選取失敗和執行階段失敗
不會透過其他執行階段重試。

## 執行階段嚴格性

OpenClaw 預設使用 `auto` 提供者／模型執行階段政策：已註冊的
外掛執行框架可取得相容的有效路由，而當沒有任何相符項目時，則由嵌入式
執行階段處理該回合。僅有提供者／模型前綴絕不會
選取執行框架。若缺少執行框架選取時應直接失敗，而非
路由至嵌入式執行階段，請使用明確的提供者／模型外掛執行階段，例如
`agentRuntime.id: "codex"`。明確選取不會讓
不相容的路由變得相容。所選外掛執行框架的失敗一律會
直接失敗。這不會阻擋明確的提供者／模型
`agentRuntime.id: "openclaw"`。

若要僅使用 Codex 的嵌入式執行：

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

若要為一個標準模型使用命令列介面後端，請將執行階段放在該
模型項目中：

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

每個代理程式的覆寫使用相同的模型範圍形狀：

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

如下所示的舊版整體代理程式執行階段範例會被忽略：

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

使用明確的外掛執行階段時，若要求的執行框架尚未註冊、不支援
解析後的提供者／模型，或在產生回合副作用前失敗，工作階段會
提早失敗。這是 Codex 專用部署及必須證明 Codex app-server 路徑
確實正在使用中的即時測試所刻意採用的行為。

此設定只控制嵌入式代理程式執行框架。它不會停用
圖片、影片、音樂、TTS、PDF 或其他提供者專屬模型路由。

## 原生工作階段與逐字稿鏡像

執行框架可保留原生工作階段 ID、執行緒 ID 或常駐程式端的恢復
權杖。請讓該繫結明確與 OpenClaw 工作階段建立關聯，並持續將使用者可見的
助理／工具輸出鏡像至 OpenClaw
逐字稿。

OpenClaw 逐字稿仍是下列項目的相容層：

- 頻道可見的工作階段歷程
- 逐字稿搜尋與索引
- 在後續回合切換回內建 OpenClaw 執行框架
- 通用 `/new`、`/reset` 及工作階段刪除行為

若執行框架儲存側車繫結，請實作 `reset(...)`，讓 OpenClaw
可在重設其所屬的 OpenClaw 工作階段時將其清除。

## 工具與媒體結果

核心會建立 OpenClaw 工具清單，並將其傳入已準備的
嘗試。執行框架執行動態工具呼叫時，請透過執行框架結果
形狀傳回工具結果，而不要自行傳送頻道媒體。

這可讓文字、圖片、影片、音樂、TTS、核准及訊息工具
輸出與 OpenClaw 支援的執行使用相同的傳送路徑。

只有受信任的執行框架執行階段自行建立並保存的原生成品，
才可設定 `AgentHarnessAttemptResult.hostOwnedToolMediaUrls`。每個項目也必須
出現在 `toolMediaUrls` 中。絕不可包含模型選取的動態工具或
OpenClaw 工具媒體。在 `message_tool_only` 路由上，這項狹義來源證明可讓
原生執行階段成品在來源回覆受到抑制時仍予以保留；一般傳送政策
及環境聊天室准入規則仍然適用。

### 終端工具結果

`AgentHarnessAttemptParams.observeToolTerminal` 是主機擁有的終端
結果累加器。執行 OpenClaw 動態工具或原生
工具的執行框架，必須在每個工具達到一個終端結果時，且在
嘗試結果完成最終處理前呼叫它。不執行工具的執行框架不需要
呼叫它。

請回報來自執行邊界的事實：

- 若存在協定呼叫 ID，請傳入該 ID、標準工具名稱，以及
  經過準備或掛鉤改寫後實際傳入工具的引數。
- 若驗證、核准或其他防護機制在工具實作開始前
  阻止呼叫，請設定 `executionStarted: false`。一旦可能已經分派，
  請保守地回報 `true`。
- 回報 `outcome: "success"` 或 `outcome: "failure"`。請包含執行階段可用的
  結構化失敗欄位，而不要從顯示文字推斷失敗。
- 只有不使用 OpenClaw 工具定義的原生工具，才可使用
  `nativeMutation`。請在該處提供協定所擁有的變更與重新執行事實；不要
  將 OpenClaw 的變更分類器複製到執行框架中。

此回呼會傳回該呼叫的標準解析結果。請將其
`lastToolError` 帶入 `AgentHarnessAttemptResult`，並在執行框架投影中使用其執行、
引數及副作用事實，而不要衍生平行狀態。主機會在不相關工具
成功後仍保留未解析的變更型失敗，只有在相符動作成功後才會清除。

為了與較舊的實驗性執行框架保持原始碼相容，此回呼仍為選用。
對於會執行工具的執行框架，選用並不代表可以忽略：
若沒有終端報告，OpenClaw 就無法在後續工具呼叫中保留變更型工具
失敗的真實狀態，包括靜默完成的心跳偵測。

## 目前限制

- 公開匯入路徑是通用的，但部分嘗試／結果型別別名
  為了相容性仍保留舊版名稱。
- 第三方執行框架安裝仍處於實驗階段。除非需要原生工作階段
  執行階段，否則請優先使用提供者外掛。
- 支援跨回合切換執行框架。在原生工具、核准、助理文字或訊息
  傳送開始後，請勿在回合進行期間切換執行框架。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview)
- [執行階段輔助函式](/zh-TW/plugins/sdk-runtime)
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

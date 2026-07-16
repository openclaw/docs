---
read_when:
    - 你正在變更內嵌的代理程式執行環境或框架登錄檔
    - 你正在從內建或受信任的外掛註冊代理程式框架
    - 你需要瞭解 Codex 外掛與模型供應商之間的關係
sidebarTitle: Agent Harness
summary: 供取代低階嵌入式代理執行器之外掛使用的實驗性 SDK 介面
title: 代理程式框架外掛
x-i18n:
    generated_at: "2026-07-16T11:54:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理程式承載器**是一次已準備 OpenClaw 代理程式回合的低階執行器。它不是模型供應商、不是頻道，也不是工具登錄檔。如需面向使用者的心智模型，請參閱[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

此介面僅供隨附或受信任的原生外掛使用。此合約仍處於實驗階段，因為參數型別刻意反映目前的內嵌執行器。

## 何時使用承載器

當模型系列擁有自己的原生工作階段執行階段，且一般 OpenClaw 供應商傳輸並非正確的抽象層時，請註冊代理程式承載器：

- 擁有執行緒與壓縮功能的原生程式設計代理程式伺服器
- 必須串流原生計畫／推理／工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字記錄外，還需要自身繼續執行 ID 的模型執行階段

請**不要**只為新增 LLM API 而註冊承載器。對於一般 HTTP 或 WebSocket 模型 API，請建置[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的項目

選取承載器之前，OpenClaw 已解析：

- 供應商與模型
- 執行階段驗證狀態，除非承載器宣告其負責驗證啟動程序
- 思考層級與上下文預算
- OpenClaw 逐字記錄／工作階段檔案
- 工作區、沙箱與工具原則
- 頻道回覆回呼與串流回呼
- 模型後援與即時模型切換原則

承載器會執行已準備的嘗試；它不會挑選供應商、取代頻道傳遞，也不會暗中切換模型。

### 承載器負責的驗證啟動程序

依預設，核心會在呼叫承載器前解析供應商認證資訊。可透過自身原生執行階段進行驗證的受信任承載器，可以在其靜態 `AgentHarness` 註冊上設定 `authBootstrap: "harness"`。之後，核心會對該承載器接管的每次嘗試略過通用供應商認證資訊啟動程序及缺少認證資訊的失敗。

當相容且已明確選取或排序的 OpenClaw 驗證設定檔及其範圍限定儲存區存在時，核心仍會將其轉送。承載器必須在發出模型要求前解析該設定檔或其原生認證資訊、將密鑰限制在該次嘗試的範圍內，並呈現可採取行動的驗證失敗。若承載器僅在部分情況下負責驗證，請勿設定此功能。

### 已驗證的設定執行階段成品

能為初次執行設定提供推論的本機承載器，必須證明完成探查的實作。當 `params.captureRuntimeArtifact` 為 true 時，請傳回具有穩定 ID 與內容指紋的不透明 `result.runtimeArtifact`。請註冊相符的 `runtimeArtifact.validate(...)` 功能，以重新檢查該繫結，且不載入其他承載器或掃描無關的外掛。

已驗證的 OpenClaw 接續執行也會傳入 `params.expectedRuntimeArtifact`。承載器必須將其與實際取得的原生處理程序比較；若兩者不同，必須在啟動或繼續原生執行緒前失敗。一般代理程式回合會省略這兩個欄位，因此內容雜湊不會進入一般要求的熱路徑。遠端／WebSocket 承載器必須先具備伺服器證明合約才能參與；僅有版本字串並不構成成品身分。

已準備的嘗試也包含 `params.runtimePlan`，這是由 OpenClaw 擁有的原則組合，供必須在 OpenClaw 與原生承載器之間保持共用的執行階段決策使用：

- `runtimePlan.tools.normalize(...)` 與 `runtimePlan.tools.logDiagnostics(...)`
  用於感知供應商的工具結構描述原則
- `runtimePlan.transcript.resolvePolicy(...)` 用於逐字記錄清理與
  工具呼叫修復原則
- `runtimePlan.delivery.isSilentPayload(...)` 用於共用的 `NO_REPLY` 與媒體
  傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用於模型後援
  分類
- `runtimePlan.observability` 用於已解析的供應商／模型／承載器中繼資料

承載器可使用此計畫來做出需要符合 OpenClaw 行為的決策，但應將其視為主機擁有的嘗試狀態：請勿修改它，也不要用它在回合內切換供應商／模型。

### 要求傳輸合約

`supports(ctx)` 會透過 `ctx.modelProvider` 接收已解析的模型傳輸。下列兩項不含密鑰且由供應商擁有的事實描述選定的路由：

- `runtimePolicy.compatibleIds` 會列出供應商宣告與該具體路由相容的執行階段 ID。缺少原則表示供應商未宣告路由層級的相容性；這並不代表可以假定支援。
- `requestTransportOverrides: "none"` 表示不需要重現任何自行設定的供應商／模型要求覆寫。`"present"` 表示存在自行設定的標頭、驗證傳輸、Proxy、TLS、本機服務、私人網路行為或要求參數。此事實不會公開這些值。

當承載器無法重現已準備的傳輸時，請傳回 `{ supported: false, reason }`。選取後，請勿藉由讀取原始設定來推斷支援情況。若驗證準備產生多條重試路由，同一承載器必須支援所有路由才能分派。若沒有任何外掛能負責完整集合，隱含選取會使用 OpenClaw；明確或持久保存的外掛選取則會以封閉方式失敗。

## 註冊承載器

**匯入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "我的原生代理程式承載器",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "有效路由與承載器不相容" };
  },

  async runAttempt(params) {
    // 啟動或繼續你的原生執行緒。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent，以及其他已準備的嘗試欄位。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "我的原生代理程式",
  description: "透過原生代理程式常駐程式執行選定的模型。",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

此通用範例刻意未包含 `authBootstrap`。僅當承載器符合上述合約時，才加入 `authBootstrap: "harness"`。

### 委派執行

承載器擁有者可以將 `delegatedExecutionPluginIds` 設為需要執行現有模型鎖定工作階段之受信任外掛的 ID，例如接續由 Codex 支援之對話的語音傳輸。這是擁有者的靜態同意，而不是核心允許清單。請將範圍保持在最小程度。

受委派者只會取得工作准入與內嵌執行權限。OpenClaw 要求完全相符的已儲存工作階段金鑰、儲存區路徑與工作階段 ID；`modelSelectionLocked:
true`；以及相符的 `agentHarnessId` 與 `agentHarnessRuntimeOverride` 值。接著，執行會透過承載器擁有者限定範圍。工作階段建立、修補、重設、刪除、封存及閘道異動仍僅限擁有者執行。

## 選取原則

OpenClaw 會在解析供應商／模型後選擇承載器：

1. 模型範圍的執行階段原則優先。
2. 其次是供應商範圍的執行階段原則。
3. `auto` 會詢問已註冊的承載器是否支援已解析的有效路由。僅憑供應商／模型前綴絕不會選取承載器。
4. 若沒有相符的已註冊承載器，OpenClaw 會使用其內嵌執行階段。

外掛承載器失敗會呈現為執行失敗。在 `auto` 模式下，只有在沒有已註冊的外掛承載器支援已解析的供應商／模型時，才會套用內嵌後援。一旦外掛承載器接管某次執行，OpenClaw 就不會透過其他執行階段重播相同回合，因為這可能改變驗證／執行階段語意或重複副作用。

已設定的執行階段原則仍是所需執行階段的權威依據。在路由／驗證準備仍待完成時，持久保存的工作階段 `agentHarnessId` 會保有其原生逐字記錄的所有權。兩者都不會讓不相容的路由變得相容：一旦具備已準備的事實，選定或釘選的承載器就必須支援這些事實，否則執行會以封閉方式失敗。`/status` 會顯示依據原則、持久保存的所有權及路由支援所選取的有效執行階段。
準備狀態是明確的：缺少 `runtimePolicy` 時會維持未宣告，而不會根據恰巧存在的傳輸欄位進行推斷。
當承載器負責的驗證仍有多條實體路由尚未解析時，已準備的支援事實會取其相容執行階段 ID 的交集，且若任何候選路由有要求覆寫，便會回報。因此，只要有一個未宣告的候選路由，原生相容性就會變為空；`preparedAuth.source: "harness"` 是驗證擁有者，而不是推斷路由支援的許可。

如果選定的承載器令人意外，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄：其中包含選定的承載器 ID、選取原因、執行階段／後援原則，以及在 `auto` 模式下各外掛候選者的支援結果。

隨附的 Codex 外掛會將 `codex` 註冊為其承載器 ID。核心會將其視為一般外掛承載器 ID；Codex 特定別名應置於外掛或操作者設定中，而不是共用執行階段選取器內。

## 供應商與承載器配對

大多數承載器也應註冊供應商。供應商會讓模型參照、驗證狀態、模型中繼資料及 `/model` 選取對 OpenClaw 的其餘部分可見。接著，承載器會在 `supports(...)` 中接管該供應商。

隨附的 Codex 外掛遵循此模式：

- 偏好的使用者模型參照：`openai/gpt-5.6-sol`
- 相容性參照：仍接受舊版 `codex/gpt-*` 參照，但新設定不應將它們用作一般供應商／模型參照
- 承載器 ID：`codex`
- 驗證：合成的供應商可用性，因為 Codex 承載器負責原生 Codex 登入／工作階段
- 應用程式伺服器要求：OpenClaw 將純模型 ID 傳送給 Codex，並讓承載器與原生應用程式伺服器通訊協定通訊

Codex 外掛是附加式的。當執行階段原則未設定或為 `auto` 時，OpenAI 只有在其供應商擁有的路由合約宣告與 `codex` 相容時，才可能選取 Codex：也就是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行設定的要求覆寫。僅憑 `openai/*` 前綴絕不會選取 Codex。自訂端點、Completions 轉接器及自行設定的要求行為會繼續使用 OpenClaw。純文字的官方 HTTP 端點會遭拒絕。較舊的 `codex/gpt-*` 參照仍可作為相容性輸入。請參閱
[OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

如需操作者設定、模型前綴範例及 Codex 專用設定，請參閱
[Codex 承載器](/zh-TW/plugins/codex-harness)。

Codex 外掛會強制執行 [Codex 承載器](/zh-TW/plugins/codex-harness)中記載的最低應用程式伺服器版本。它會檢查初始化交握並封鎖較舊或未標示版本的伺服器，確保 OpenClaw 只針對其已測試的通訊協定介面執行。

### 工具結果中介軟體

隨附外掛及明確啟用且具有相符資訊清單合約的已安裝外掛，可以在其資訊清單於 `contracts.agentToolResultMiddleware` 中宣告目標執行階段 ID 時，透過 `api.registerAgentToolResultMiddleware(...)` 附加與執行階段無關的工具結果中介軟體。此受信任介面用於非同步工具結果轉換，且這些轉換必須在 OpenClaw 或 Codex 將工具輸出送回模型前執行。

舊版隨附外掛仍可使用
`api.registerCodexAppServerExtensionFactory(...)`，供僅限 Codex app-server 的
中介軟體使用，但新的結果轉換應使用不依賴執行階段的 API。僅限
嵌入式執行器的 `api.registerEmbeddedExtensionFactory(...)` 鉤子已
移除；嵌入式工具結果轉換必須使用不依賴執行階段的中介軟體。

### 終端結果分類

自行擁有通訊協定投影的原生執行框架，可在已完成的回合未產生任何
可見助理文字時，使用來自
`openclaw/plugin-sdk/agent-harness-runtime` 的
`classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會傳回 `empty`、`reasoning-only` 或
`planning-only`，讓 OpenClaw 的備援政策決定是否改用
其他模型重試。`planning-only` 需要執行框架提供明確的 `planText`
欄位；OpenClaw 不會從助理文字推斷該欄位。此輔助函式會刻意將
提示錯誤、進行中的回合，以及 `NO_REPLY` 等有意保持靜默的
回覆保留為未分類。

### 代理程式結束時的副作用

原生執行框架在完成一次嘗試的最終處理後，必須呼叫來自
`openclaw/plugin-sdk/agent-harness-runtime` 的
`runAgentEndSideEffects(...)`。它會分派可攜式 `agent_end` 鉤子及 OpenClaw 的研究擷取，
且不會延遲互動式回覆。對於本機、非互動式執行，若嘗試必須等到這些
副作用完成後才能解析，請使用 `awaitAgentEndSideEffects(...)`。
這兩個輔助函式接受與
`runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 承載資料；其失敗不會改變
已完成嘗試的結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入要求的原生執行框架，應使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的使用者輸入輔助函式來格式化
提示、透過 OpenClaw 的阻塞式回覆路徑傳送提示，並將
選項／自由格式答案正規化回執行階段的原生回應形狀。此
輔助函式可讓頻道／終端介面的呈現方式保持一致，同時讓每個執行框架保有自己的
通訊協定解析與待處理要求生命週期。

需要類似 PI 精簡工具路由的原生執行框架，應使用來自
`openclaw/plugin-sdk/agent-harness-tool-runtime` 的
`createAgentHarnessToolSurfaceRuntime(...)`。它負責
工具搜尋／程式碼模式控制選擇、本機模型的精簡預設值、
與執行階段相容的結構描述篩選、隱藏目錄執行、目錄
資料補齊，以及目錄清理。執行框架仍負責其 SDK 專屬的工具
轉換與原生執行回呼。

### 原生 Codex 執行框架模式

隨附的 `codex` 執行框架，是嵌入式 OpenClaw
代理程式回合的原生 Codex 模式。請先啟用隨附的 `codex` 外掛；若設定使用
限制性允許清單，請在
`plugins.allow` 中加入 `codex`。原生 app-server
設定應使用 `openai/gpt-*`；只有在有效路由宣告與 Codex 相容時，OpenAI
代理程式回合才會選取 Codex 執行框架。舊版 Codex 模型
參照應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*`
模型參照仍是原生執行框架的相容性別名。

此模式執行時，Codex 負責原生執行緒 ID、恢復行為、
壓縮，以及 app-server 執行。OpenClaw 仍負責聊天頻道、
可見逐字稿鏡像、工具政策、核准、媒體傳送與工作階段
選擇。若要證明只有 Codex app-server 路徑可以接管該次執行，請使用
提供者／模型 `agentRuntime.id: "codex"`。
明確指定的外掛執行階段會採取失敗即關閉策略；Codex app-server 選取失敗與執行階段失敗
不會透過其他執行階段重試。

## 執行階段嚴格性

OpenClaw 預設使用 `auto` 提供者／模型執行階段政策：已註冊的
外掛執行框架可接管相容的有效路由，而沒有任何相符項目時，則由嵌入式
執行階段處理該回合。僅提供者／模型前綴絕不會
選取執行框架。若缺少執行框架選取時應直接失敗，而不是
透過嵌入式執行階段進行路由，請使用明確的提供者／模型外掛執行階段，例如
`agentRuntime.id: "codex"`。明確選取不會讓
不相容的路由變得相容。選定的外掛執行框架一旦失敗，一律會
直接失敗。這不會阻止明確的提供者／模型
`agentRuntime.id: "openclaw"`。

對於僅限 Codex 的嵌入式執行：

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

個別代理程式覆寫使用相同的模型範圍形狀：

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

使用明確的外掛執行階段時，如果要求的
執行框架尚未註冊、不支援已解析的提供者／模型，或
在產生回合副作用之前失敗，工作階段會提早失敗。對於僅限 Codex 的
部署，以及必須證明 Codex app-server 路徑
確實正在使用的即時測試，這是刻意設計的行為。

此設定僅控制嵌入式代理程式執行框架。它不會停用
影像、影片、音樂、TTS、PDF 或其他提供者專屬的模型路由。

## 原生工作階段與逐字稿鏡像

執行框架可以保留原生工作階段 ID、執行緒 ID 或常駐程式端的恢復
權杖。請讓該繫結明確與 OpenClaw 工作階段關聯，並
持續將使用者可見的助理／工具輸出鏡像至 OpenClaw
逐字稿。

OpenClaw 逐字稿仍是下列項目的相容層：

- 頻道可見的工作階段歷程記錄
- 逐字稿搜尋與建立索引
- 在後續回合切換回內建的 OpenClaw 執行框架
- 一般的 `/new`、`/reset` 與工作階段刪除行為

若執行框架儲存側載繫結，請實作 `reset(...)`，讓 OpenClaw
可在重設所屬的 OpenClaw 工作階段時清除該繫結。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入已準備好的
嘗試。當執行框架執行動態工具呼叫時，請透過
執行框架結果形狀傳回工具結果，而不要自行傳送頻道媒體。

如此可讓文字、影像、影片、音樂、TTS、核准與傳訊工具
輸出，採用與 OpenClaw 支援的執行相同的傳送路徑。

### 工具的終端結果

`AgentHarnessAttemptParams.observeToolTerminal` 是由主機擁有的終端
結果累加器。執行 OpenClaw 動態工具或原生
工具的執行框架，必須在每個工具達到一個終端結果時、且在
嘗試結果完成最終處理之前呼叫它。不執行工具的執行框架不需要
呼叫它。

從執行邊界回報事實：

- 若有通訊協定呼叫 ID，請傳入該 ID、標準工具名稱，以及
  經過準備或鉤子重寫後實際傳遞至工具的引數。
- 若驗證、核准或其他防護措施
  在工具實作開始前阻止呼叫，請設定 `executionStarted: false`。一旦可能已發生
  分派，請保守地回報 `true`。
- 回報 `outcome: "success"` 或 `outcome: "failure"`。請包含執行階段提供的結構化
  失敗欄位，而不要從顯示文字推斷失敗。
- 僅對不使用 OpenClaw 工具
  定義的原生工具使用 `nativeMutation`。請在該處提供通訊協定所擁有的變更與重播事實；不要
  將 OpenClaw 的變更分類器複製到執行框架中。

回呼會傳回該呼叫的標準解析結果。請將其
`lastToolError` 帶入 `AgentHarnessAttemptResult`，並在執行框架投影中使用其執行、
引數與副作用事實，而不要衍生平行狀態。主機會在無關工具
成功後，仍保留尚未解析的變更失敗，且只有在相符的動作成功後
才會清除它。

為了與較舊的實驗性
執行框架保持原始碼相容性，該回呼仍為選用。對於會執行工具的執行框架而言，選用並不代表可以忽略：
若缺少終端回報，OpenClaw 就無法在後續工具呼叫間保留變更工具失敗的真實狀態，
其中包括靜默完成的心跳偵測。

## 目前限制

- 公開匯入路徑是通用的，但某些嘗試／結果型別別名
  為了相容性仍沿用舊版名稱。
- 第三方執行框架安裝仍屬實驗性功能。除非需要原生工作階段執行階段，
  否則請優先使用提供者外掛。
- 支援在回合之間切換執行框架。在原生工具、核准、助理文字或訊息
  傳送已開始後，請勿在回合進行途中切換執行框架。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview)
- [執行階段輔助函式](/zh-TW/plugins/sdk-runtime)
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

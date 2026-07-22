---
read_when:
    - 你正在變更內嵌代理程式執行階段或測試框架登錄檔
    - 你正在從內建或受信任的外掛註冊代理程式執行框架
    - 你需要瞭解 Codex 外掛與模型提供者之間的關係
sidebarTitle: Agent Harness
summary: 取代低階嵌入式代理程式執行器之外掛實驗性 SDK 介面
title: 代理程式工具框架外掛
x-i18n:
    generated_at: "2026-07-22T13:20:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b672b30cae9071049d6714477ec70a5196aea447f44c3492a5c23310a5e4de2a
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

**代理程式執行框架**是單次已準備完成的 OpenClaw 代理程式回合所使用的低階執行器。它不是模型供應商、不是頻道，也不是工具登錄檔。如需面向使用者的心智模型，請參閱[代理程式執行環境](/zh-TW/concepts/agent-runtimes)。

此介面僅供內建或受信任的原生外掛使用。此合約仍處於實驗階段，因為參數型別刻意與目前的內嵌執行器保持一致。

## 何時使用執行框架

當模型系列擁有自己的原生工作階段執行環境，而一般的 OpenClaw 供應商傳輸並非適當的抽象層時，請註冊代理程式執行框架：

- 擁有執行緒與壓縮功能的原生程式設計代理程式伺服器
- 必須串流原生計畫／推理／工具事件的本機命令列介面或常駐程式
- 除了 OpenClaw 工作階段逐字記錄之外，還需要自有續接 ID 的模型執行環境

請**不要**只為了新增 LLM API 而註冊執行框架。對於一般的 HTTP 或 WebSocket 模型 API，請建立[供應商外掛](/zh-TW/plugins/sdk-provider-plugins)。

## 核心仍負責的項目

在選定執行框架之前，OpenClaw 已解析：

- 供應商與模型
- 執行環境的身分驗證狀態，除非執行框架宣告由其負責身分驗證啟動程序
- 思考層級與上下文預算
- OpenClaw 逐字記錄／工作階段檔案
- 工作區、沙箱與工具政策
- 頻道回覆回呼與串流回呼
- 模型備援與即時模型切換政策

執行框架會執行已準備的嘗試；它不會選擇供應商、取代頻道傳遞，或在未明示的情況下切換模型。

### 由執行框架負責的身分驗證啟動程序

預設情況下，核心會先解析供應商認證資訊，再呼叫執行框架。能透過自身原生執行環境進行身分驗證的受信任執行框架，可以在其靜態 `AgentHarness` 註冊上設定 `authBootstrap: "harness"`。之後，對於該執行框架宣告負責的每次嘗試，核心都會略過通用供應商認證資訊啟動程序與缺少認證資訊的失敗處理。

若存在相容且經明確選取或排序的 OpenClaw 身分驗證設定檔及其範圍限定的儲存區，核心仍會轉送它們。執行框架必須先解析該設定檔或其原生認證資訊，才能發出模型請求；必須將祕密的範圍限制在該次嘗試內，並呈現可採取行動的身分驗證失敗資訊。若執行框架只在部分情況下負責身分驗證，請勿設定此能力。

### 已驗證的設定執行環境構件

能為首次執行設定提供推論能力的本機執行框架，必須證明完成探測的實作。當 `params.captureRuntimeArtifact` 為 true 時，請傳回具有穩定 ID 與內容指紋的不透明 `result.runtimeArtifact`。請註冊相符的 `runtimeArtifact.validate(...)` 能力，以便在不載入其他執行框架或掃描不相關外掛的情況下，重新檢查該繫結。

已驗證的 OpenClaw 接續作業也會傳入 `params.expectedRuntimeArtifact`。執行框架必須將其與實際取得的原生程序精確比較；若兩者不同，必須在啟動或續接原生執行緒之前失敗。一般代理程式回合會省略這兩個欄位，因此內容雜湊不會進入一般請求的熱路徑。遠端／WebSocket 執行框架必須先具備伺服器證明合約，才能參與；僅有版本字串不足以識別構件。

已準備的嘗試也包含 `params.runtimePlan`，這是由 OpenClaw 擁有的政策套件，用於必須在 OpenClaw 與原生執行框架之間保持一致的執行環境決策：

- `runtimePlan.tools.normalize(...)` 與 `runtimePlan.tools.logDiagnostics(...)`，用於可感知供應商的工具結構描述政策
- `runtimePlan.transcript.resolvePolicy(...)`，用於逐字記錄清理與工具呼叫修復政策
- `runtimePlan.delivery.isSilentPayload(...)`，用於共用 `NO_REPLY` 與媒體傳遞抑制
- `runtimePlan.outcome.classifyRunResult(...)`，用於模型備援分類
- `runtimePlan.observability`，用於已解析的供應商／模型／執行框架中繼資料

執行框架可以使用此計畫，做出必須符合 OpenClaw 行為的決策，但應將其視為主機擁有的嘗試狀態：請勿修改它，也不要在回合內使用它切換供應商／模型。

### 請求傳輸合約

`supports(ctx)` 會在 `ctx.modelProvider` 中接收已解析的模型傳輸。以下兩項不含祕密且由供應商擁有的事實，描述所選路由：

- `runtimePolicy.compatibleIds` 列出供應商宣告與該具體路由相容的執行環境 ID。缺少政策表示供應商未宣告路由層級的相容性；這不代表可以假設其受支援。
- `requestTransportOverrides: "none"` 表示不必重現任何明確撰寫的供應商／模型請求覆寫。`"present"` 表示存在明確撰寫的標頭、身分驗證傳輸、Proxy、TLS、本機服務、私人網路行為或請求參數。此事實不會揭露這些值。

當執行框架無法重現已準備的傳輸時，請傳回 `{ supported: false, reason }`。請勿在選取完成後透過讀取原始設定來推斷支援情況。當身分驗證準備產生多個重試路由時，單一執行框架必須支援全部路由，才能分派。若沒有外掛能負責完整集合，隱含選取會使用 OpenClaw；明確或持久保存的外掛選取則會採封閉式失敗。

## 註冊執行框架

**匯入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "effective route is not harness-compatible" };
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

此通用範例刻意省略 `authBootstrap`。僅當執行框架符合上述合約時，才新增 `authBootstrap: "harness"`。

### 委派執行

執行框架擁有者可以將 `delegatedExecutionPluginIds` 設為需要執行現有模型鎖定工作階段的受信任外掛 ID，例如由語音傳輸接續使用 Codex 的對話。這是擁有者的靜態同意，而非核心允許清單。請將範圍保持在最低限度。

受委派者只會取得工作准入與內嵌執行權限。OpenClaw 要求精確相符的已儲存工作階段金鑰、儲存區路徑與工作階段 ID；`modelSelectionLocked:
true`；以及相符的 `agentHarnessId` 與 `agentHarnessRuntimeOverride` 值。之後，執行作業會透過執行框架擁有者限定範圍。工作階段的建立、修補、重設、刪除、封存與閘道異動仍僅限擁有者執行。

## 選取政策

OpenClaw 會在解析供應商／模型後選擇執行框架：

1. 模型範圍的執行環境政策優先。
2. 其次是供應商範圍的執行環境政策。
3. `auto` 會詢問已註冊的執行框架是否支援已解析的有效路由。僅靠供應商／模型前綴絕不會選取執行框架。
4. 若沒有相符的已註冊執行框架，OpenClaw 會使用其內嵌執行環境。

外掛執行框架的失敗會呈現為執行失敗。在 `auto` 模式中，只有當沒有任何已註冊的外掛執行框架支援已解析的供應商／模型時，才會套用內嵌備援。一旦外掛執行框架宣告負責某次執行，OpenClaw 不會透過其他執行環境重播同一回合，因為這可能改變身分驗證／執行環境語意，或造成副作用重複發生。

設定的執行環境政策仍是所需執行環境的權威依據。持久保存的工作階段 `agentHarnessId` 會在路由／身分驗證準備仍在進行時，保留其原生逐字記錄的所有權。兩者都無法使不相容的路由變為相容：一旦具備已準備的事實，所選或固定的執行框架就必須支援它們，否則執行會採封閉式失敗。`/status` 會顯示依據政策、持久保存的所有權與路由支援所選取的有效執行環境。
準備狀態是明確的：缺少 `runtimePolicy` 時會保持未宣告，而不會根據恰好存在的傳輸欄位進行推斷。
當由執行框架負責的身分驗證留下多個尚未解析的實體路由時，已準備的支援事實會取其相容執行環境 ID 的交集，且若任何候選項目具有請求覆寫，就會回報該情況。因此，只要有一個未宣告的候選項目，原生相容性便會成為空集合；`preparedAuth.source: "harness"` 是身分驗證擁有者，不代表可以推斷路由支援。

如果所選執行框架出乎預期，請啟用 `agents/harness` 偵錯記錄，並檢查閘道的結構化 `agent harness selected` 記錄：其中包含所選執行框架 ID、選取原因、執行環境／備援政策，以及在 `auto` 模式下每個外掛候選項目的支援結果。

內建 Codex 外掛會以 `codex` 作為其執行框架 ID 進行註冊。核心將其視為一般的外掛執行框架 ID；Codex 專用別名應位於外掛或操作員設定中，而不是共用執行環境選取器內。

## 供應商與執行框架配對

大多數執行框架也應註冊供應商。供應商會向 OpenClaw 的其餘部分公開模型參照、身分驗證狀態、模型中繼資料與 `/model` 選取。接著，執行框架會在 `supports(...)` 中宣告負責該供應商。

內建 Codex 外掛遵循此模式：

- 偏好的使用者模型參照：`openai/gpt-5.6-sol`
- 相容性參照：仍接受舊版 `codex/gpt-*` 參照，但新設定不應將其作為一般供應商／模型參照
- 執行框架 ID：`codex`
- 身分驗證：合成的供應商可用性，因為 Codex 執行框架負責原生 Codex 登入／工作階段
- 應用程式伺服器請求：OpenClaw 將不含前綴的模型 ID 傳送給 Codex，並由執行框架與原生應用程式伺服器協定通訊

Codex 外掛是附加功能。當執行環境政策未設定或為 `auto` 時，OpenAI 只有在其供應商擁有的路由合約宣告 `codex` 相容時，才可能選取 Codex：也就是完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有明確撰寫的請求覆寫。僅靠 `openai/*` 前綴絕不會選取 Codex。自訂端點、Completions 轉接器與明確撰寫的請求行為仍由 OpenClaw 處理。明文官方 HTTP 端點會遭拒絕。較舊的 `codex/gpt-*` 參照仍會作為相容性輸入。請參閱
[OpenAI 隱含代理程式執行環境](/zh-TW/providers/openai#implicit-agent-runtime)。

如需操作員設定、模型前綴範例與僅使用 Codex 的設定，請參閱
[Codex 執行框架](/zh-TW/plugins/codex-harness)。

Codex 外掛會強制執行 [Codex 執行框架](/zh-TW/plugins/codex-harness)中記載的最低應用程式伺服器版本。它會檢查初始化交握並阻擋較舊或未提供版本的伺服器，確保 OpenClaw 僅針對已測試的協定介面執行。

### 工具結果中介軟體

若內建外掛及已明確啟用的已安裝外掛具有相符的資訊清單合約，且其資訊清單在 `contracts.agentToolResultMiddleware` 中宣告目標執行環境 ID，便可透過 `api.registerAgentToolResultMiddleware(...)` 附加不限定執行環境的工具結果中介軟體。此受信任介面用於必須在 OpenClaw 或 Codex 將工具輸出送回模型之前執行的非同步工具結果轉換。

舊版內建外掛仍可使用
`api.registerCodexAppServerExtensionFactory(...)`，供僅限 Codex app-server 的
中介軟體使用，但新的結果轉換應使用與執行階段無關的 API。僅限
嵌入式執行器的 `api.registerEmbeddedExtensionFactory(...)` 掛鉤已
移除；嵌入式工具結果轉換必須使用與執行階段無關的中介軟體。

### 終端結果分類

自行擁有通訊協定投影的原生控制框架，可在已完成的輪次未產生
可見的助理文字時，使用來自
`openclaw/plugin-sdk/agent-harness-runtime` 的
`classifyAgentHarnessTerminalOutcome(...)`。此輔助函式會傳回 `empty`、`reasoning-only` 或
`planning-only`，讓 OpenClaw 的備援政策決定是否要改用
其他模型重試。`planning-only` 需要控制框架明確提供 `planText`
欄位；OpenClaw 不會從助理文字中推斷該欄位。此輔助函式
刻意不對提示錯誤、進行中的輪次，以及 `NO_REPLY` 等刻意保持靜默的
回覆進行分類。

### 代理結束時的副作用

原生控制框架在完成一次嘗試的最終處理後，必須呼叫來自
`openclaw/plugin-sdk/agent-harness-runtime` 的
`runAgentEndSideEffects(...)`。它會分派可攜式的 `agent_end` 掛鉤及 OpenClaw 的研究擷取，
且不會延遲互動式回覆。對於本機、非互動式執行，若必須等到這些
副作用完成後該次嘗試才能結束，請使用 `awaitAgentEndSideEffects(...)`。
這兩個輔助函式接受與 `runAgentHarnessAgentEndHook(...)` 相同的 `{ event, ctx }` 承載資料；
它們的失敗不會改變已完成的嘗試結果。

### 使用者輸入與工具介面

公開執行階段層級使用者輸入要求的原生控制框架，應使用
`openclaw/plugin-sdk/agent-harness-runtime` 中的使用者輸入輔助函式來格式化
提示、透過 OpenClaw 的阻塞式回覆路徑傳送提示，並將選項／自由格式答案正規化
回執行階段的原生回應形式。此輔助函式可維持頻道／終端介面的呈現一致，
同時讓每個控制框架自行處理通訊協定剖析及待處理要求的生命週期。

需要類似 PI 精簡工具路由的原生控制框架，應使用來自
`openclaw/plugin-sdk/agent-harness-tool-runtime` 的
`createAgentHarnessToolSurfaceRuntime(...)`。它負責
工具搜尋／程式碼模式控制選擇、本機模型精簡預設值、
執行階段相容的結構描述篩選、隱藏目錄執行、目錄
資料填入及目錄清理。控制框架仍負責其 SDK 特有的工具
轉換及原生執行回呼。

### 原生 Codex 控制框架模式

內建的 `codex` 控制框架是嵌入式 OpenClaw
代理輪次的原生 Codex 模式。請先啟用內建的 `codex` 外掛；若你的設定使用限制性允許清單，
請在 `plugins.allow` 中納入 `codex`。原生 app-server
設定應使用 `openai/gpt-*`；只有在有效路由宣告與 Codex 相容時，
OpenAI 代理輪次才會選擇 Codex 控制框架。舊版 Codex 模型
參照應使用 `openclaw doctor --fix` 修復，而舊版 `codex/*`
模型參照仍是原生控制框架的相容性別名。

此模式執行時，Codex 負責原生執行緒 ID、續接行為、
壓縮及 app-server 執行。OpenClaw 仍負責聊天頻道、
可見的文字記錄鏡像、工具政策、核准、媒體傳送及工作階段
選擇。若需要證明只有 Codex app-server 路徑能接管該次執行，請使用
提供者／模型 `agentRuntime.id: "codex"`。
明確指定的外掛執行階段會採取失敗即關閉；Codex app-server 選擇失敗及執行階段失敗
不會透過其他執行階段重試。

## 執行階段嚴格性

OpenClaw 預設使用 `auto` 提供者／模型執行階段政策：已註冊的
外掛控制框架可接管相容的有效路由，若無任何相符項目，則由嵌入式
執行階段處理該輪次。僅有提供者／模型前綴永遠不會
選擇控制框架。若缺少控制框架選擇時應直接失敗，而不是
路由至嵌入式執行階段，請使用明確的提供者／模型外掛執行階段，例如
`agentRuntime.id: "codex"`。明確選擇不會讓
不相容的路由變成相容。選定的外掛控制框架一旦失敗，一律會
直接失敗。這不會阻止明確指定的提供者／模型
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

若要為單一標準模型使用命令列介面後端，請將執行階段放在該
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

各代理覆寫使用相同的模型範圍形式：

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

以下這類舊版整體代理執行階段範例會被忽略：

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

使用明確的外掛執行階段時，若要求的
控制框架未註冊、不支援解析後的提供者／模型，或在產生輪次副作用前
失敗，工作階段會提早失敗。這是僅限 Codex 的
部署，以及必須證明 Codex app-server 路徑確實正在
使用的即時測試所刻意採用的行為。

此設定僅控制嵌入式代理控制框架。它不會停用
圖片、影片、音樂、TTS、PDF 或其他提供者特有的模型路由。

## 原生工作階段與文字記錄鏡像

控制框架可以保留原生工作階段 ID、執行緒 ID 或常駐程式端的續接
權杖。請讓該繫結明確與 OpenClaw 工作階段關聯，並持續將使用者可見的
助理／工具輸出鏡像至 OpenClaw
文字記錄。

OpenClaw 文字記錄仍是下列功能的相容層：

- 頻道可見的工作階段歷史記錄
- 文字記錄搜尋與索引
- 在後續輪次切換回內建 OpenClaw 控制框架
- 一般的 `/new`、`/reset` 及工作階段刪除行為

若你的控制框架儲存附屬繫結，請實作 `reset(...)`，讓 OpenClaw
可在所屬的 OpenClaw 工作階段重設時將其清除。

## 工具與媒體結果

核心會建構 OpenClaw 工具清單，並將其傳入準備好的
嘗試。控制框架執行動態工具呼叫時，請透過控制框架結果形式
傳回工具結果，而不要自行傳送頻道媒體。

如此可讓文字、圖片、影片、音樂、TTS、核准及訊息工具
輸出採用與 OpenClaw 支援的執行相同的傳送路徑。

只有受信任的控制框架執行階段自行建立並保存的原生成品，才能設定
`AgentHarnessAttemptResult.hostOwnedToolMediaUrls`。每個項目也必須
出現在 `toolMediaUrls` 中。切勿包含由模型選取的動態工具或
OpenClaw 工具媒體。在 `message_tool_only` 路由上，這種狹義的來源資訊可讓
原生執行階段成品在來源回覆遭抑制時仍能保留；一般傳送政策
及環境聊天室准入規則仍然適用。

### 終端工具結果

`AgentHarnessAttemptParams.observeToolTerminal` 是主機擁有的終端
結果累加器。執行 OpenClaw 動態工具或原生
工具的控制框架，必須在每個工具達到單一終端結果時、嘗試結果
最終確定前呼叫它。不執行工具的控制框架不需要
呼叫它。

請回報執行邊界上的事實：

- 若有通訊協定呼叫 ID，請傳入該 ID、標準工具名稱，以及經過準備或掛鉤改寫後
  實際傳入工具的引數。
- 若驗證、核准或其他防護機制
  在工具實作開始前阻止呼叫，請設定 `executionStarted: false`。一旦可能已經分派，
  請保守地回報 `true`。
- 回報 `outcome: "success"` 或 `outcome: "failure"`。請納入執行階段提供的結構化
  失敗欄位，而非從顯示文字推斷失敗。
- 僅對未使用 OpenClaw 工具
  定義的原生工具使用 `nativeMutation`。請在其中提供通訊協定擁有的異動及重播事實；不要
  將 OpenClaw 的異動分類器複製到控制框架中。

此回呼會傳回該次呼叫的標準解析結果。請將其
`lastToolError` 帶入 `AgentHarnessAttemptResult`，並在控制框架投影中使用其執行、
引數及副作用事實，而不是另外衍生平行狀態。主機會讓尚未解決的異動失敗
跨越不相關的成功工具持續存在，且只在相符的動作成功後才將其清除。

為了與舊版實驗性
控制框架保持來源相容性，此回呼仍為選用。對於執行工具的控制框架，選用不代表可忽略：
若沒有終端報告，OpenClaw 就無法讓異動工具失敗的真實狀態
跨越後續工具呼叫持續存在，包括靜默完成的心跳偵測。

### 已完成工具的最終處理

控制框架完成所有
工具呼叫後，若其原生輪次結束時沒有助理文字，OpenClaw 可能需要一個最終可見答案。控制框架可透過實作
`finalizeSettledTurn({ attempt,
settledAttempt })` 選擇啟用此復原功能。

此回呼是獨立的能力，而非另一個一般嘗試。它必須：

- 使用精確且受限制的原生文字記錄，或截至已完成工具結果邊界
  凍結的完整應用程式文字記錄；
- 不公開任何工具、權限授予或使用者輸入能力、原生執行
  掛鉤、代理、Skills、記憶、排程、擴充功能或遠端控制；
- 僅傳送由主機提供的最終處理提示；並且
- 若選定的文字記錄／隔離策略無法強制執行
  這些限制，便採取失敗即關閉。

OpenClaw 會在一般
嘗試與重試迴圈之外，以終端子作業的形式呼叫該回呼一次。失敗會使該次執行以
可感知副作用的未完成輪次警告結束；它無法進入一般的
驗證／設定檔輪替、模型備援、內容復原、壓縮
續接或掛鉤要求的修訂路徑。最終處理也會略過外掛
提示異動、`before_agent_run`、LLM 輸入／輸出、終端修訂及
`agent_end` 掛鉤。核心診斷仍會記錄該作業及其失敗。

此回呼傳回 `AgentHarnessSettledTurnFinalizationResult`，而非
一般嘗試結果。其公開欄位僅限於已完成的
助理訊息、最終處理呼叫用量、文字記錄擁有權中繼資料及
診斷追蹤。工具、傳送、媒體、衍生、生命週期、重播、工作階段及
備援狀態都不能跨越此結果邊界。未知欄位及助理
工具呼叫會採取失敗即關閉。

內部重複使用完整嘗試引擎的控制框架可在傳回前呼叫
`projectSettledTurnFinalizationAttemptResult(...)`。此輔助函式
會拒絕標準失敗、工具、傳送、重播及生命週期證據，之後
只投影狹義結果。它是在原生隔離後的縱深防禦，
不能取代移除原生能力介面。

以投影為基礎的控制框架必須將完整內容放在
`settledAttempt.settledTurnFinalizationContext` 上，並搭配
`source: "openclaw-transcript"`。它必須在已完成的輪次完成鏡像後擷取作用中的分支，
證明目前提示及每個目前工具
呼叫／結果都存在至該邊界，並在傳回嘗試前凍結產生的訊息
陣列。最終處理器必須拒絕缺少、不支援、不明確或過大的內容。
它不得截斷訊息、
捨棄較早的歷史記錄，或將此應用程式文字記錄描述為精確的原生
歷史記錄。續接單一受限制原生工作階段的控制框架不需要此
投影欄位。

請勿透過呼叫 `runAttempt` 並使用盡力而為的
`disableTools` 提示來實作此回呼。控制框架擁有者必須強制執行完整的原生
能力邊界。OpenClaw 不提供通用備援，因為它
無法證明任意原生執行階段有遵守這些限制。

對於實驗性第三方執行框架的相容性，此回呼仍為選用。當所選的執行框架省略此回呼時，OpenClaw 會保留現有的回合未完成錯誤，而不冒著重複產生副作用的風險。

## 目前的限制

- 公開匯入路徑採用通用名稱，但部分嘗試／結果型別別名為了相容性，仍沿用舊版名稱。
- 第三方執行框架安裝仍屬實驗性功能。在需要原生工作階段執行環境之前，請優先使用提供者外掛。
- 支援在不同回合之間切換執行框架。當原生工具、核准、助理文字或訊息傳送已開始後，請勿在回合進行途中切換執行框架。

## 相關內容

- [SDK 概覽](/zh-TW/plugins/sdk-overview)
- [執行環境輔助工具](/zh-TW/plugins/sdk-runtime)
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [模型提供者](/zh-TW/concepts/model-providers)

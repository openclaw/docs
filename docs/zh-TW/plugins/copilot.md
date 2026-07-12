---
read_when:
    - 您想要為代理程式使用 GitHub Copilot SDK 測試框架
    - 您需要 `copilot` 執行環境的設定範例
    - 你正在將代理連接至訂閱版 Copilot（github / openclaw / copilot），並希望透過 Copilot 命令列介面執行它
summary: 透過外部 GitHub Copilot SDK 執行框架，執行 OpenClaw 內嵌代理程式回合
title: Copilot SDK 測試框架
x-i18n:
    generated_at: "2026-07-11T21:32:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 外掛透過 GitHub Copilot 命令列介面（`@github/copilot-sdk`）執行嵌入式訂閱 Copilot
代理程式回合，而非使用 OpenClaw 的內建執行框架。Copilot 命令列介面工作階段負責底層
代理程式迴圈：原生工具執行、原生壓縮（`infiniteSessions`），以及
由命令列介面管理、位於 `copilotHome` 下的執行緒狀態。OpenClaw 仍負責聊天
頻道、工作階段檔案、模型選擇、動態工具（透過橋接）、核准、
媒體傳遞、可見的逐字稿鏡像、`/btw` 額外問題（請參閱
[額外問題（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

若要瞭解更廣泛的模型／提供者／執行階段劃分，請先閱讀
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

## 需求

- 已安裝 `@openclaw/copilot` 外掛的 OpenClaw。
- 如果設定使用 `plugins.allow`，請加入 `copilot`（此外掛宣告的資訊清單識別碼）。
  npm 套件名稱 `@openclaw/copilot` 的允許清單項目不會相符，
  即使已設定 `agentRuntime.id: "copilot"`，此外掛仍會遭到封鎖。
- 可驅動 Copilot 命令列介面的 GitHub Copilot 訂閱，或供無頭模式或排程執行使用的
  `gitHubToken` 環境變數／驗證設定檔項目。
- 可寫入的 `copilotHome` 目錄。當 OpenClaw 提供代理程式目錄時，
  預設為 `<agentDir>/copilot`；否則為
  `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 會針對工作階段狀態所有權和未來的設定遷移，
執行此外掛的 [doctor 契約](#doctor)。它不會探查
Copilot 命令列介面環境。

## 安裝

Copilot 執行階段以外部外掛形式提供，因此核心 `openclaw`
套件不會包含 `@github/copilot-sdk` 或其平台專用的
`@github/copilot-<platform>-<arch>` 命令列介面二進位檔（合計約 260 MB）。
僅為選擇使用此執行階段的代理程式安裝：

```bash
openclaw plugins install @openclaw/copilot
```

第一次選取 `github-copilot/*` 模型，**且**設定透過
`agentRuntime: { id: "copilot" }` 將該模型（或其提供者）路由至 Copilot 執行階段時，
設定精靈會自動安裝此外掛；請參閱[快速入門](#quickstart)。
若未選擇啟用，OpenClaw 會使用其內建 GitHub Copilot 提供者，
且絕不安裝此外掛。

執行階段會依下列順序解析 SDK：

1. 從已安裝的 `@openclaw/copilot` 套件載入
   `import("@github/copilot-sdk")`。
2. 備援目錄 `~/.openclaw/npm-runtime/copilot/`（舊版隨選安裝目標）。

缺少 SDK 時，會顯示一個代碼為 `COPILOT_SDK_MISSING` 的錯誤，
並附上上述重新安裝命令。

## 快速入門

將一個模型（或一個提供者）固定至此執行框架：

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

在單一模型項目上設定 `agentRuntime.id`，即可僅將該模型路由至此執行框架；
或在提供者上設定，以路由該提供者旗下的所有模型。

`github-copilot/auto` 是可攜式的起點。具名 Copilot 模型取決於
帳戶與組織原則；固定模型前，請確認已驗證身分的
Copilot 命令列介面確實有公開該模型。

## 支援的提供者

此執行框架支援標準 `github-copilot` 提供者（由
`extensions/github-copilot` 負責），也支援自訂 `models.providers` 項目，
但模型必須具有非空白的 `baseUrl`，且採用下列其中一種 `api` 形式：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（與 OpenAI 相容的補全）
- `openai-completions`
- `openai-responses`

原生提供者識別碼（`openai`、`anthropic`、`google`、`ollama`）仍由
各自的原生執行階段負責。若要改由 Copilot BYOK 路由端點，
請使用不同的自訂提供者識別碼。

Copilot BYOK 端點必須是公開的 HTTPS URL。此執行框架會為每次嘗試
提供一個 local loopback Proxy 給 Copilot SDK，接著透過 OpenClaw
受防護的擷取路徑轉送提供者流量，使 DNS 固定與 SSRF 原則仍由
OpenClaw 負責。若使用本機 Ollama、LM Studio 或區域網路模型伺服器，
請使用原生 OpenClaw 執行階段。

## BYOK

Copilot BYOK 使用 SDK 的工作階段層級自訂提供者契約。OpenClaw
會傳入解析後的模型端點、API 金鑰、持有人權杖模式、標頭、模型
識別碼，以及上下文／輸出限制；提供者傳輸邏輯仍位於 SDK 中，而非
核心中。

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK 工作階段會與訂閱工作階段及其他 BYOK 端點或憑證分開建立索引。
輪替金鑰、標頭、模型或端點時，會啟動新的 Copilot SDK 工作階段，
而非恢復不相容的狀態。

## 驗證

在 `runCopilotAttempt` 期間，會依代理程式套用下列優先順序：

1. 嘗試輸入上明確設定的 **`useLoggedInUser: true`** — 使用代理程式
   `copilotHome` 下 Copilot 命令列介面的已登入使用者。
2. 嘗試輸入上明確設定的 **`gitHubToken`**（需要 `profileId` +
   `profileVersion`）。供需要略過驗證設定檔解析的直接命令列介面呼叫
   與測試使用。
3. **由契約解析的 `resolvedApiKey` + `authProfileId`** — 正式環境的
   主要路徑。核心會在叫用執行框架前，先解析代理程式已設定的
   `github-copilot` 驗證設定檔
   （`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此
   `github-copilot:<profile>` 驗證設定檔可在無須環境變數的情況下，
   完整支援無頭模式、排程或多設定檔組態。
4. **環境變數備援**，依此順序檢查（第一個非空白值優先；
   空字串視為不存在；與 `extensions/github-copilot/auth.ts` 中
   已發行的 `github-copilot` 提供者優先順序一致）：
   1. `OPENCLAW_GITHUB_TOKEN` — 執行框架專用覆寫；可為 OpenClaw
      執行框架固定權杖，而不干擾全系統的 `gh`／Copilot 命令列介面設定。
   2. `COPILOT_GITHUB_TOKEN` — 標準 Copilot SDK／命令列介面環境變數。
   3. `GH_TOKEN` — 標準 `gh` 命令列介面環境變數。
   4. `GITHUB_TOKEN` — 通用 GitHub 權杖備援。

   合成的集區設定檔識別碼為 `env:<NAME>`；設定檔版本是權杖的
   不可逆 sha256 指紋，因此輪替環境變數值會徹底更新用戶端集區。

5. 沒有可用權杖訊號時，使用**預設 `useLoggedInUser`**。

每個代理程式都有自己的 `copilotHome`，因此同一台機器上不同代理程式之間
絕不會洩漏 Copilot 命令列介面權杖、工作階段與設定。預設值為：
`<agentDir>/copilot`（讓 SDK 狀態不會與 OpenClaw 的 `models.json`／
`auth-profiles.json` 位於同一目錄），若未提供代理程式目錄則為
`~/.openclaw/agents/<agentId>/copilot`。
若要使用自訂位置（例如供遷移使用的共用掛載點），請在嘗試輸入上以
`copilotHome: <path>` 覆寫。

即時執行框架測試使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 作為直接
權杖。共用即時測試設定會將實際驗證設定檔暫存至隔離測試主目錄後，
清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 與 `GITHUB_TOKEN`，因此透過
專用變數傳入的 `gh auth token` 值可避免誤判略過，同時不會洩漏至
不相關的測試套件。

## 設定介面

此執行框架從每次嘗試的輸入（`runCopilotAttempt({...})`）讀取設定，
另加上 `extensions/copilot/src/` 內少量的環境預設值：

| 欄位                     | 用途                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每個代理程式的命令列介面狀態目錄（預設值見上文）。                                                                                                                                                                                                                                            |
| `model`                  | 字串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略即可使用代理程式的一般模型選擇；此執行框架會驗證解析後的提供者是否受支援。                                                                                                                                                |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。對應 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel`／`ReasoningLevel` 解析結果。                                                                                                                                                               |
| `infiniteSessionConfig`  | 由 `harness.compact` 驅動之 SDK `infiniteSessions` 區塊的選用覆寫。維持原設定即可安全使用。                                                                                                                                                                                                    |
| `hooksConfig`            | 選用的原生 Copilot SDK `SessionHooks` 設定，用於工具／MCP、使用者提示、工作階段及錯誤回呼。與 OpenClaw 的可攜式生命週期掛鉤分開。                                                                                                                        |
| `permissionPolicy`       | SDK 內建工具種類（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）之 `onPermissionRequest` 處理常式的選用覆寫。預設以 `rejectAllPolicy` 作為安全網；請參閱[權限與 ask_user](#permissions-and-ask_user)，瞭解其實際上永遠不會觸發的原因。 |
| `enableSessionTelemetry` | 選用的 SDK 工作階段遙測旗標。                                                                                                                                                                                                                                                                |

OpenClaw 外掛掛鉤不需要任何 Copilot 專用的嘗試設定。此執行框架透過
標準執行框架輔助函式執行 `before_prompt_build`（以及舊版
`before_agent_start` 相容性掛鉤）、`llm_input`、`llm_output` 和
`agent_end`。成功的 SDK 壓縮也會執行 `before_compaction` 和
`after_compaction`。橋接的 OpenClaw 工具會執行 `before_tool_call`
並回報 `after_tool_call`；`hooksConfig` 則保留給沒有可攜式對等功能的
SDK 原生專用回呼。

OpenClaw 中的其他部分都不需要知道這些欄位。其他外掛、
頻道與核心程式碼只會看到標準 `AgentHarnessAttemptParams`／
`AgentHarnessAttemptResult` 形式。

## 壓縮

執行 `harness.compact` 時，Copilot SDK 執行框架會：

1. 恢復受追蹤的 SDK 工作階段，但不繼續待處理的工作。
2. 呼叫 SDK 的工作階段範圍歷程記錄壓縮 RPC。
3. 傳回 SDK 壓縮結果，而不會在工作區下寫入相容性標記檔案。

OpenClaw 端的逐字稿鏡像（見下文）會繼續接收壓縮後的訊息，
因此面向使用者的聊天記錄會保持一致。

## 逐字稿鏡像

`runCopilotAttempt` 透過
`extensions/copilot/src/dual-write-transcripts.ts`，將每個回合中可鏡像的訊息
雙寫至 OpenClaw 稽核逐字稿。鏡像以工作階段為範圍
（`copilot:${sessionId}`），並以每則訊息的
`${role}:${sha256_16(role,content)}` 作為索引鍵，因此重新發出的先前回合項目
會與磁碟上現有的索引鍵衝突，而不會產生重複項目。

兩層故障隔離機制包覆著鏡像寫入，因此即使紀錄稿寫入失敗，也絕不會導致該次嘗試失敗：內部的盡力而為包裝器，以及嘗試層級上作為縱深防禦的 `.catch(...)`。失敗只會記錄於日誌中，不會向外呈現。

## 附帶問題（`/btw`）

此測試框架並未原生支援 `/btw`。`createCopilotAgentHarness()`
刻意將 `harness.runSideQuestion` 保持為未定義
（在 `extensions/copilot/harness.test.ts` 的 `describe("runSideQuestion")` 中斷言），
因此 OpenClaw 的 `/btw` 分派器（`src/agents/btw.ts`）會退回至
所有非 Codex 執行階段所使用的相同路徑：直接呼叫已設定的模型供應商，
並附上簡短的附帶問題提示詞，再透過 `streamSimple` 串流傳回
（不使用命令列介面工作階段，也不占用額外的集區槽位）。

這可讓 Copilot CLI 工作階段保留給代理程式的主要輪次迴圈，
並使 `/btw` 的行為與其他非 Codex 執行階段一致。

## 診斷工具

`extensions/copilot/doctor-contract-api.ts` 會由
`src/plugins/doctor-contract-registry.ts` 自動載入。它提供：

- 空的 `legacyConfigRules`（目前尚無已淘汰欄位）。
- 不執行任何操作的 `normalizeCompatibilityConfig`（予以保留，讓未來淘汰欄位時
  能在程式碼樹中有穩定的歸屬位置）。
- 一筆 `sessionRouteStateOwners` 項目：供應商 `github-copilot`、執行階段
  `copilot`、命令列介面工作階段鍵 `copilot`、驗證設定檔前綴 `github-copilot:`。

## 限制

- 此測試框架會宣告使用 `github-copilot`，以及沒有擁有者的自訂 BYOK 供應商 ID。
  即使將 `agentRuntime.id` 強制設為 `copilot`，由資訊清單指定擁有者的原生供應商 ID
  仍會留在其擁有者的執行階段上。
- 沒有終端介面介面；對於沒有對等介面的執行階段，PI 的終端介面仍作為備援。
- 當代理程式切換至 `copilot` 時，不會遷移 PI 工作階段狀態。
  選擇以每次嘗試為單位；現有 PI 工作階段仍然有效。
- `ask_user` 使用與 Codex 測試框架相同的 OpenClaw 提示與回覆路徑：
  當 Copilot SDK 要求使用者輸入時，OpenClaw 會向作用中的頻道／終端介面
  發布阻塞式提示，而下一則排入佇列的使用者訊息會完成該 SDK 要求。

## 權限與 ask_user

對橋接 OpenClaw 工具的權限強制執行發生在**工具包裝器內部**，
而不是透過 SDK 的 `onPermissionRequest` 回呼。PI 使用的同一個
`wrapToolWithBeforeToolCallHook`
（`src/agents/agent-tools.before-tool-call.ts`）會由
`createOpenClawCodingTools` 套用至每個程式設計工具：迴圈偵測、受信任的
外掛政策、工具呼叫前掛鉤，以及透過閘道進行的兩階段外掛核准
（`plugin.approval.request`），全都會經過與原生 PI 嘗試完全相同的程式碼路徑。

`convertOpenClawToolToSdkTool` 傳回的 SDK 工具會標記為：

- `overridesBuiltInTool: true` — 取代 Copilot CLI 中同名的內建工具
  （edit、read、write、bash……），使每次工具呼叫都會路由回 OpenClaw。
- `skipPermission: true` — 指示 SDK 在叫用工具前不要觸發
  `onPermissionRequest({kind: "custom-tool"})`。包裝後的 `execute()` 已執行
  更完整的 OpenClaw 政策檢查；SDK 層級的提示不是會略過 OpenClaw 的強制執行
  （全部允許），就是會封鎖每次工具呼叫（全部拒絕）——兩者都無法與 PI 維持一致。

程式碼樹中的 Codex 測試框架採用相同的分工方式：橋接的 OpenClaw 工具會受到包裝
（`extensions/codex/src/app-server/dynamic-tools.ts`），而
codex-app-server 自身的原生核准種類
（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）則會透過 `plugin.approval.request`
進行路由（`extensions/codex/src/app-server/approval-bridge.ts`）。Copilot SDK
中的對應機制——對任何抵達 `onPermissionRequest` 且非 `custom-tool` 的種類，
採用預設拒絕的 `rejectAllPolicy`——是相同的安全防護網；實務上它絕不會觸發，
因為 `overridesBuiltInTool: true` 會取代所有內建工具。

為了讓包裝工具層能做出與 PI 等效的政策決策，此測試框架會將完整的 PI
嘗試工具情境轉送至 `createOpenClawCodingTools`：身分
（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist`……）、
頻道／路由（`groupId`、`currentChannelId`、`replyToMode`、訊息工具切換項）、
驗證（`authProfileStore`）、執行身分
（衍生自 `sandboxSessionKey` 的 `sessionKey`／`runSessionKey`、`runId`）、
模型情境（`modelApi`、`modelContextWindowTokens`、`modelCompat`、
`modelHasVision`），以及執行掛鉤（`onToolOutcome`、`onYield`）。
缺少這些欄位時，僅限擁有者的允許清單預設會無提示地拒絕，
外掛信任政策無法解析至正確範圍，而 `session_status: "current"`
會解析至過期的沙箱鍵。橋接建構器位於
`extensions/copilot/src/tool-bridge.ts`，對應 PI 在
`src/agents/embedded-agent-runner/run/attempt.ts:1262` 的權威呼叫。
`runAttempt` 會透過共用的 `resolveSandboxContext` 接縫解析沙箱情境、
向 SDK 傳入有效的工作目錄，並將 `sandbox` 與子代理程式產生工作區
轉送至工具橋接器。橋接器也會轉送它能在 SDK 邊界強制執行的有界工具建構控制項：
`includeCoreTools`、執行階段工具允許清單，以及 `toolConstructionPlan`。

橋接器也會使用
`openclaw/plugin-sdk/agent-harness-tool-runtime` 中的共用測試框架工具介面輔助程式，
以與 PI 維持一致。啟用工具搜尋時，SDK 看到的是精簡控制工具加上隱藏的目錄執行器，
而不是每個 OpenClaw 工具結構描述。啟用程式碼模式時，該輔助程式會建構與其他
代理程式測試框架相同的程式碼模式控制介面與目錄生命週期。本機模型的精簡預設值、
執行階段相容的結構描述篩選、目錄載入與目錄清理，全都保留在共用輔助程式中，
避免 Copilot 與 Codex 相鄰測試框架之間產生偏差。

### 工作階段層級的 GitHub 權杖

Copilot SDK 合約會區分**用戶端層級**的 GitHub 權杖
（`CopilotClientOptions.gitHubToken`，用於驗證命令列介面程序本身）
與**工作階段層級**的權杖（`SessionConfig.gitHubToken`，決定該工作階段的
內容排除、模型路由與配額；`createSession` 和 `resumeSession` 都會採用）。
此測試框架會透過 `resolveCopilotAuth` 解析一次驗證資訊，並在驗證模式為
`gitHubToken` 時設定兩個欄位（明確的 `auth.gitHubToken`，或由已設定的
`github-copilot` 驗證設定檔依合約解析出的 `resolvedApiKey`）。
當解析出的模式為 `useLoggedInUser` 時，會省略工作階段層級欄位，
讓 SDK 繼續從已登入的身分推導身分資訊。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。對於固定選項要求，
橋接器接受選項索引或標籤；當 SDK 要求允許自由格式回答時，也接受自由格式回答；
而當 OpenClaw 嘗試中止時，則會取消待處理的要求。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [代理程式測試框架外掛（SDK 參考）](/zh-TW/plugins/sdk-agent-harness)

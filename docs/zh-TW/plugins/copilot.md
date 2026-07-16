---
read_when:
    - 你想要為代理程式使用 GitHub Copilot SDK 框架
    - 你需要 `copilot` 執行階段的設定範例
    - 你正在將代理程式連接至訂閱版 Copilot（github / openclaw / copilot），並希望它透過 Copilot 命令列介面執行
summary: 透過外部 GitHub Copilot SDK 控制框架執行 OpenClaw 內嵌代理程式回合
title: Copilot SDK 測試框架
x-i18n:
    generated_at: "2026-07-16T11:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 外掛透過 GitHub Copilot 命令列介面（`@github/copilot-sdk`）執行內嵌訂閱 Copilot
代理程式回合，而非使用 OpenClaw 的內建操作框架。Copilot 命令列介面工作階段負責底層
代理程式迴圈：原生工具執行、原生壓縮（`infiniteSessions`），以及
由命令列介面管理、位於 `copilotHome` 下的執行緒狀態。OpenClaw 仍負責聊天
頻道、工作階段檔案、模型選擇、動態工具（透過橋接）、核准、
媒體傳遞、可見的逐字稿鏡像、`/btw` 額外問題（請參閱
[額外問題（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

如需瞭解更廣泛的模型／供應商／執行階段分工，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

## 需求

- 已安裝 `@openclaw/copilot` 外掛的 OpenClaw。
- 若你的設定使用 `plugins.allow`，請納入 `copilot`（外掛宣告的資訊清單 ID）。npm 套件名稱
  `@openclaw/copilot` 的允許清單項目不會相符，因此即使已設定
  `agentRuntime.id: "copilot"`，外掛仍會遭到封鎖。
- 可驅動 Copilot 命令列介面的 GitHub Copilot 訂閱，或用於無頭或排程執行的
  `gitHubToken` 環境變數／驗證設定檔項目。
- 可寫入的 `copilotHome` 目錄。OpenClaw 提供代理程式目錄時，
  預設為 `<agentDir>/copilot`，否則為
  `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 會針對工作階段狀態擁有權與未來的設定遷移，執行外掛的
[診斷程式合約](#doctor)。它不會探查
Copilot 命令列介面環境。

## 安裝

Copilot 執行階段以外部外掛形式提供，因此核心 `openclaw`
套件不會包含 `@github/copilot-sdk` 或其平台專屬的
`@github/copilot-<platform>-<arch>` 命令列介面二進位檔（兩者合計約 260 MB）。
僅為選擇使用此執行階段的代理程式安裝：

```bash
openclaw plugins install @openclaw/copilot
```

當你首次選取 `github-copilot/*` 模型，**且**你的設定透過 `agentRuntime: { id: "copilot" }`
將該模型（或其供應商）路由至 Copilot 執行階段時，設定精靈會自動安裝此外掛；請參閱
[快速入門](#quickstart)。若未選擇使用，OpenClaw 會使用其內建的
GitHub Copilot 供應商，且絕不會安裝此外掛。

執行階段會依下列順序解析 SDK：

1. 來自已安裝 `@openclaw/copilot`
   套件的 `import("@github/copilot-sdk")`。
2. 備援目錄 `~/.openclaw/npm-runtime/copilot/`（舊版隨選
   安裝目標）。

缺少 SDK 時，會顯示一個代碼為 `COPILOT_SDK_MISSING` 的錯誤，以及上述
重新安裝命令。

## 快速入門

將一個模型（或一個供應商）固定至操作框架：

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

在單一模型項目設定 `agentRuntime.id`，可僅透過
操作框架路由該模型；也可在供應商上設定，以路由該供應商下的每個模型。

`github-copilot/auto` 是可攜式起點。具名 Copilot 模型取決於
帳號與組織政策；固定模型前，請確認已驗證的
Copilot 命令列介面確實提供該模型。

## 支援的供應商

此操作框架支援標準 `github-copilot` 供應商（由
`extensions/github-copilot` 擁有），也支援自訂 `models.providers` 項目，但模型必須具有
非空白的 `baseUrl`，且採用下列其中一種 `api` 形式：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 相容的補全）
- `openai-completions`
- `openai-responses`

原生供應商 ID（`openai`、`anthropic`、`google`、`ollama`）仍由
各自的原生執行階段負責。若要改用 Copilot BYOK 路由端點，
請使用不同的自訂供應商 ID。

Copilot BYOK 端點必須是公開的 HTTPS URL。操作框架會為每次嘗試提供
Copilot SDK 一個迴路介面 Proxy，接著透過 OpenClaw 受防護的擷取路徑轉送供應商流量，
使 DNS 固定與 SSRF 政策仍由 OpenClaw 負責。對於本機 Ollama、LM
Studio 或區域網路模型伺服器，請使用原生 OpenClaw 執行階段。

## BYOK

Copilot BYOK 使用 SDK 的工作階段層級自訂供應商合約。OpenClaw
會傳遞已解析的模型端點、API 金鑰、Bearer 權杖模式、標頭、模型
ID，以及脈絡／輸出限制；供應商傳輸邏輯留在 SDK 中，而非
核心。

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

BYOK 工作階段的索引鍵與訂閱工作階段，以及其他
BYOK 端點或認證資訊的索引鍵各自獨立。輪替金鑰、標頭、模型或端點時，
會啟動新的 Copilot SDK 工作階段，而非恢復不相容的狀態。

## 驗證

在 `runCopilotAttempt` 期間，會依代理程式套用下列優先順序：

1. 嘗試輸入上的**明確 `useLoggedInUser: true`**——使用代理程式 `copilotHome` 下
   Copilot 命令列介面的已登入使用者。
2. 嘗試輸入上的**明確 `gitHubToken`**（需要 `profileId` +
   `profileVersion`）。供需要略過驗證設定檔解析的直接命令列介面叫用與測試使用。
3. **依合約解析的 `resolvedApiKey` + `authProfileId`**——正式環境的
   主要路徑。在叫用操作框架前，核心會解析代理程式已設定的 `github-copilot`
   驗證設定檔（`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此 `github-copilot:<profile>`
   驗證設定檔無需環境變數，即可在無頭、排程或多設定檔環境中
   端對端運作。
4. **環境變數備援**，依此順序檢查（第一個非空白值優先，
   空字串視為不存在；反映 `extensions/github-copilot/auth.ts` 中已發布的 `github-copilot`
   供應商優先順序）：
   1. `OPENCLAW_GITHUB_TOKEN`——操作框架專用覆寫；讓你能為 OpenClaw
      操作框架固定權杖，而不干擾全系統的 `gh`／
      Copilot 命令列介面設定。
   2. `COPILOT_GITHUB_TOKEN`——標準 Copilot SDK／命令列介面環境變數。
   3. `GH_TOKEN`——標準 `gh` 命令列介面環境變數。
   4. `GITHUB_TOKEN`——通用 GitHub 權杖備援。

   合成的集區設定檔 ID 為 `env:<NAME>`；設定檔版本是權杖的
   不可逆 sha256 指紋，因此輪替環境變數值會乾淨地使
   用戶端集區失效。

5. 沒有可用權杖訊號時的**預設 `useLoggedInUser`**。

每個代理程式都會取得自己的 `copilotHome`，因此同一台機器上的代理程式之間
絕不會洩漏 Copilot 命令列介面權杖、工作階段與設定。預設值：
`<agentDir>/copilot`（讓 SDK 狀態不會與 OpenClaw 的
`models.json`／`auth-profiles.json` 位於相同目錄），若未提供代理程式目錄則為
`~/.openclaw/agents/<agentId>/copilot`。
可在嘗試輸入上以 `copilotHome: <path>` 覆寫為自訂
位置（例如遷移用的共用掛載點）。

即時操作框架測試使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 作為直接
權杖。共用即時測試設定在將實際驗證設定檔暫存至隔離的測試
主目錄後，會清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`
與 `GITHUB_TOKEN`，因此透過專用變數傳遞 `gh auth token` 值，
可避免錯誤略過，且不會洩漏至無關的測試套件。

## 設定介面

操作框架會從每次嘗試輸入（`runCopilotAttempt({...})`）
以及 `extensions/copilot/src/` 內的一小組環境預設值讀取設定：

| 欄位                    | 用途                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每個代理程式的命令列介面狀態目錄（預設值如上）。                                                                                                                                                                                                                                                 |
| `model`                  | 字串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略即可使用代理程式的一般模型選擇；操作框架會驗證解析出的供應商是否受支援。                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。對應自 OpenClaw 在 `auto-reply/thinking.ts` 中的 `ThinkLevel`／`ReasoningLevel` 解析。                                                                                                                                                          |
| `infiniteSessionConfig`  | 可選的 SDK `infiniteSessions` 區塊覆寫，由 `harness.compact` 驅動。保留原樣即可，安全無虞。                                                                                                                                                                                        |
| `hooksConfig`            | 可選的原生 Copilot SDK `SessionHooks` 設定，用於工具／MCP、使用者提示、工作階段與錯誤回呼。與 OpenClaw 的可攜式生命週期掛鉤分開。                                                                                                                                   |
| `permissionPolicy`       | SDK 內建工具種類（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）之 `onPermissionRequest` 處理常式的可選覆寫。預設為 `rejectAllPolicy`，作為安全防護；請參閱[權限與 ask_user](#permissions-and-ask_user)，瞭解它為何實際上絕不會觸發。 |
| `enableSessionTelemetry` | 可選的 SDK 工作階段遙測旗標。                                                                                                                                                                                                                                                            |

OpenClaw 外掛掛鉤不需要任何 Copilot 專用的嘗試設定。
操作框架會透過標準操作框架輔助程式執行 `before_prompt_build`（以及舊版
`before_agent_start` 相容性掛鉤）、`llm_input`、`llm_output` 與 `agent_end`。
成功的 SDK 壓縮也會執行 `before_compaction` 與 `after_compaction`。
橋接的 OpenClaw 工具會執行 `before_tool_call` 並回報 `after_tool_call`；
`hooksConfig` 則保留給沒有可攜式對應項目的 SDK 原生專用回呼。

OpenClaw 中的其他部分都不需要知道這些欄位。其他外掛、
頻道與核心程式碼只會看到標準的 `AgentHarnessAttemptParams`／
`AgentHarnessAttemptResult` 形式。

## 壓縮

當 `harness.compact` 執行時，Copilot SDK 操作框架會：

1. 恢復所追蹤的 SDK 工作階段，但不繼續待處理的工作。
2. 呼叫 SDK 的工作階段範圍歷程記錄壓縮 RPC。
3. 傳回 SDK 壓縮結果，不在工作區下寫入相容性標記
   檔案。

OpenClaw 端的逐字稿鏡像（如下）會繼續接收壓縮後的
訊息，因此使用者可見的聊天記錄會保持一致。

## 逐字稿鏡像

`runCopilotAttempt` 會將每一輪可鏡像的訊息雙重寫入
OpenClaw 稽核逐字稿，透過
`extensions/copilot/src/dual-write-transcripts.ts`。鏡像的範圍依每個
工作階段（`copilot:${sessionId}`）劃分，並依每則訊息建立索引鍵
（`${role}:${sha256_16(role,content)}`），因此重新發出的先前輪次項目
會與磁碟上既有的索引鍵衝突，而不會產生重複項目。

鏡像外圍有兩層失敗隔離，確保逐字稿寫入
失敗絕不會導致該次嘗試失敗：內部的盡力而為包裝器，以及
嘗試層級的縱深防禦 `.catch(...)`。失敗會記錄到日誌中，不會
向外呈現。

## 額外問題（`/btw`）

此工具框架並未原生提供 `/btw`。`createCopilotAgentHarness()`
刻意讓 `harness.runSideQuestion` 保持未定義
（於 `extensions/copilot/harness.test.ts`、`describe("runSideQuestion")` 中斷言），
因此 OpenClaw 的 `/btw` 分派器（`src/agents/btw.ts`）會轉而採用
所有非 Codex 執行階段使用的相同路徑：直接呼叫已設定的模型供應商，
傳入簡短的額外問題提示，並透過
`streamSimple` 串流傳回（沒有命令列介面工作階段，也不會占用額外的集區名額）。

這會將 Copilot CLI 工作階段保留給代理程式的主要輪次迴圈，
並使 `/btw` 的行為與其他非 Codex 執行階段完全一致。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 會由
`src/plugins/doctor-contract-registry.ts` 自動載入。它提供：

- 空的 `legacyConfigRules`（目前尚無淘汰欄位）。
- 不執行任何操作的 `normalizeCompatibilityConfig`（予以保留，讓未來淘汰的欄位
  在原始碼樹中有穩定的歸屬位置）。
- 一個 `sessionRouteStateOwners` 項目：供應商 `github-copilot`、執行階段
  `copilot`、命令列介面工作階段索引鍵 `copilot`、驗證設定檔前綴 `github-copilot:`。

## 限制

- 此工具框架會接管 `github-copilot`，以及無擁有者的自訂 BYOK 供應商 ID。
  即使強制將 `agentRuntime.id` 設為 `copilot`，
  由資訊清單所擁有的原生供應商 ID 仍會留在其所屬的執行階段上。
- 沒有終端介面介面；對於沒有對等介面的執行階段，PI 的終端介面仍作為備援。
- 當代理程式切換至 `copilot` 時，不會移轉 PI 工作階段狀態。
  選擇是以每次嘗試為單位；既有的 PI 工作階段仍然有效。
- `ask_user` 使用與 Codex
  工具框架相同的 OpenClaw 提示與回覆路徑：當 Copilot SDK 要求使用者輸入時，OpenClaw 會向
  作用中的頻道／終端介面發送阻塞式提示，而下一則排入佇列的使用者
  訊息會完成該 SDK 要求。

## 權限與 ask_user

橋接 OpenClaw 工具的權限強制執行發生在**工具
包裝器內部**，而非透過 SDK 的 `onPermissionRequest` 回呼。PI 使用的相同
`wrapToolWithBeforeToolCallHook`
（`src/agents/agent-tools.before-tool-call.ts`）會由
`createOpenClawCodingTools` 套用至每個程式設計工具：迴圈偵測、受信任的
外掛政策、工具呼叫前掛鉤，以及透過
閘道進行的兩階段外掛核准（`plugin.approval.request`），全部都會經過與原生 PI 嘗試完全相同的程式碼
路徑。

Copilot 工具橋接傳回的每個 SDK 工具都會標記：

- `overridesBuiltInTool: true` — 取代 Copilot CLI 中同名的內建工具
  （edit、read、write、bash 等），讓每次工具呼叫都會導回
  OpenClaw。
- `skipPermission: true` — 指示 SDK 不要在叫用工具前觸發
  `onPermissionRequest({kind: "custom-tool"})`。
  經包裝的 `execute()` 已執行更完整的 OpenClaw 政策檢查；SDK 層級的提示
  不是會略過 OpenClaw 的強制執行
  （全部允許），就是會封鎖每次工具呼叫（全部拒絕）——兩者都無法與 PI
  保持一致。

原始碼樹內的 Codex 工具框架使用相同的職責劃分：橋接的 OpenClaw 工具會經過
包裝（`extensions/codex/src/app-server/dynamic-tools.ts`），而
codex-app-server 自己的原生核准種類
（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）則透過 `plugin.approval.request`
（`extensions/codex/src/app-server/approval-bridge.ts`）路由。Copilot SDK
的對應機制——對任何曾抵達 `onPermissionRequest`、且非 `custom-tool` 的種類，
由 `rejectAllPolicy` 採取預設拒絕——是相同的安全網，而且實務上
永遠不會觸發，因為 `overridesBuiltInTool: true` 會取代每個
內建工具。

為了讓包裝工具層做出與 PI 等效的政策決策，
此工具框架會將完整的 PI 嘗試工具情境轉送至
`createOpenClawCodingTools`：身分（`senderIsOwner`、`memberRoleIds`、
`ownerOnlyToolAllowlist` 等）、頻道／路由（`groupId`、
`currentChannelId`、`replyToMode`、訊息工具切換設定）、驗證
（`authProfileStore`）、執行身分（衍生自
`sandboxSessionKey`、`runId` 的 `sessionKey`／`runSessionKey`）、模型情境（`modelApi`、
`modelContextWindowTokens`、`modelCompat`、`modelHasVision`），以及執行掛鉤
（`onToolOutcome`、`onYield`）。若缺少這些欄位，僅限擁有者的允許清單
預設會無提示地拒絕，外掛信任政策無法解析至正確的
範圍，而 `session_status: "current"` 會解析為過時的沙箱索引鍵。
橋接建構器為 `extensions/copilot/src/tool-bridge.ts`，其做法比照 PI
在 `src/agents/embedded-agent-runner/run/attempt.ts:1262` 的權威呼叫。
`runAttempt` 會透過共用的
`resolveSandboxContext` 接縫解析沙箱情境，將有效的工作目錄傳給 SDK，
並將 `sandbox` 連同子代理程式產生工作區轉送至工具
橋接。此橋接也會轉送它能在 SDK 邊界強制執行的有界工具建構控制項：
`includeCoreTools`、執行階段工具
允許清單，以及 `toolConstructionPlan`。

此橋接也會使用來自
`openclaw/plugin-sdk/agent-harness-tool-runtime` 的共用工具框架工具介面協助程式，以與 PI 保持一致。啟用
工具搜尋時，SDK 看到的是精簡的控制工具加上一個隱藏的
目錄執行器，而不是每個 OpenClaw 工具結構描述。啟用程式碼模式時，
該協助程式會建構與其他代理程式工具框架相同的程式碼模式控制介面與目錄
生命週期。本機模型的精簡預設值、
與執行階段相容的結構描述篩選、目錄載入及目錄
清理都會保留在共用協助程式中，避免 Copilot 與鄰近 Codex 的
工具框架產生差異。

### 工作階段層級的 GitHub 權杖

Copilot SDK 合約會區分**用戶端層級** GitHub 權杖
（`CopilotClientOptions.gitHubToken`，用來驗證 CLI 程序本身）
與**工作階段層級**權杖（`SessionConfig.gitHubToken`，決定該工作階段的
內容排除、模型路由及配額；`createSession` 與 `resumeSession` 均會採用）。此工具框架會透過
`resolveCopilotAuth` 解析一次驗證資訊，並在驗證模式為 `gitHubToken`
時設定這兩個欄位（明確的 `auth.gitHubToken`，或由合約從已設定的
`github-copilot` 驗證設定檔解析出的 `resolvedApiKey`）。當解析出的模式為
`useLoggedInUser` 時，會省略工作階段層級欄位，讓 SDK 繼續
從已登入的身分推導身分資訊。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。對於固定選項的要求，橋接接受選項
索引或標籤；當 SDK 要求允許自由格式回答時，也接受自由格式答案；
若 OpenClaw 嘗試遭中止，則會取消待處理的要求。

## 相關內容

- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [Codex 工具框架](/zh-TW/plugins/codex-harness)
- [代理程式工具框架外掛（SDK 參考）](/zh-TW/plugins/sdk-agent-harness)

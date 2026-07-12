---
read_when:
    - 你想要為代理程式使用 GitHub Copilot SDK 測試框架
    - 你需要 `copilot` 執行環境的設定範例
    - 你正在將代理程式連接至訂閱版 Copilot（github / openclaw / copilot），並希望它透過 Copilot 命令列介面執行
summary: 透過外部 GitHub Copilot SDK 控制介面執行 OpenClaw 內嵌代理程式回合
title: Copilot SDK 測試框架
x-i18n:
    generated_at: "2026-07-12T14:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 外掛會透過 GitHub Copilot 命令列介面（`@github/copilot-sdk`）執行嵌入式訂閱 Copilot 代理程式回合，而非使用 OpenClaw 的內建框架。Copilot 命令列介面工作階段負責底層代理程式迴圈：原生工具執行、原生壓縮（`infiniteSessions`），以及由命令列介面管理、位於 `copilotHome` 下的執行緒狀態。OpenClaw 仍負責聊天頻道、工作階段檔案、模型選擇、動態工具（透過橋接）、核准、媒體傳送、可見的對話記錄鏡像、`/btw` 題外問題（請參閱[題外問題（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

如需瞭解更廣泛的模型／提供者／執行階段分工，請先參閱
[代理程式執行階段](/zh-TW/concepts/agent-runtimes)。

## 需求

- 已安裝 `@openclaw/copilot` 外掛的 OpenClaw。
- 如果你的設定使用 `plugins.allow`，請加入 `copilot`（此外掛宣告的資訊清單 ID）。允許清單中的 npm 套件名稱 `@openclaw/copilot` 不會相符，因此即使已設定 `agentRuntime.id: "copilot"`，此外掛仍會遭到封鎖。
- 可驅動 Copilot 命令列介面的 GitHub Copilot 訂閱，或供無頭模式或排程執行使用的 `gitHubToken` 環境變數／驗證設定檔項目。
- 可寫入的 `copilotHome` 目錄。當 OpenClaw 提供代理程式目錄時，預設為 `<agentDir>/copilot`；否則為 `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 會執行此外掛的[診斷合約](#doctor)，以處理工作階段狀態的所有權與未來的設定遷移。它不會探測 Copilot 命令列介面環境。

## 安裝

Copilot 執行階段以外部外掛形式提供，因此核心 `openclaw` 套件不會包含 `@github/copilot-sdk` 或其平台專用的 `@github/copilot-<platform>-<arch>` 命令列介面二進位檔（合計約 260 MB）。只有選用此執行階段的代理程式才需要安裝：

```bash
openclaw plugins install @openclaw/copilot
```

當你第一次選擇 `github-copilot/*` 模型，**且**設定透過 `agentRuntime: { id: "copilot" }` 將該模型（或其提供者）路由至 Copilot 執行階段時，設定精靈會自動安裝此外掛；請參閱[快速入門](#quickstart)。若未選用此方式，OpenClaw 會使用其內建 GitHub Copilot 提供者，且不會安裝此外掛。

執行階段會依下列順序解析 SDK：

1. 從已安裝的 `@openclaw/copilot` 套件執行 `import("@github/copilot-sdk")`。
2. 備援目錄 `~/.openclaw/npm-runtime/copilot/`（舊版按需安裝目標）。

如果缺少 SDK，系統會顯示一個代碼為 `COPILOT_SDK_MISSING` 的錯誤，以及上述重新安裝命令。

## 快速入門

將一個模型（或一個提供者）固定至框架：

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

在單一模型項目上設定 `agentRuntime.id`，即可只透過此框架路由該模型；在提供者上設定，則會路由該提供者下的每個模型。

`github-copilot/auto` 是可攜式的起始選擇。具名 Copilot 模型取決於帳戶與組織原則；固定模型之前，請確認已驗證的 Copilot 命令列介面確實有提供該模型。

## 支援的提供者

此框架支援標準 `github-copilot` 提供者（由 `extensions/github-copilot` 負責），也支援自訂 `models.providers` 項目，前提是模型具有非空白的 `baseUrl`，且使用下列其中一種 `api` 形式：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 相容的補全）
- `openai-completions`
- `openai-responses`

原生提供者 ID（`openai`、`anthropic`、`google`、`ollama`）仍由各自的原生執行階段負責。若要改由 Copilot BYOK 路由某個端點，請使用不同的自訂提供者 ID。

Copilot BYOK 端點必須是公開的 HTTPS URL。此框架會為每次嘗試提供一個迴路代理給 Copilot SDK，接著透過 OpenClaw 受保護的擷取路徑轉送提供者流量，使 DNS 固定與 SSRF 原則仍由 OpenClaw 負責。對於本機 Ollama、LM Studio 或區域網路模型伺服器，請使用原生 OpenClaw 執行階段。

## BYOK

Copilot BYOK 使用 SDK 的工作階段層級自訂提供者合約。OpenClaw 會傳遞解析後的模型端點、API 金鑰、持有人權杖模式、標頭、模型 ID，以及內容／輸出限制；提供者傳輸邏輯會保留在 SDK 中，而非核心。

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

BYOK 工作階段的索引鍵會與訂閱工作階段，以及其他 BYOK 端點或認證資訊分開。輪替金鑰、標頭、模型或端點時，會啟動新的 Copilot SDK 工作階段，而非恢復不相容的狀態。

## 驗證

在 `runCopilotAttempt` 期間，系統會針對每個代理程式依下列優先順序套用：

1. 嘗試輸入上的**明確 `useLoggedInUser: true`** — 使用代理程式 `copilotHome` 下 Copilot 命令列介面的已登入使用者。
2. 嘗試輸入上的**明確 `gitHubToken`**（需要 `profileId` + `profileVersion`）。適用於需要略過驗證設定檔解析的直接命令列介面叫用與測試。
3. **由合約解析的 `resolvedApiKey` + `authProfileId`** — 正式環境的主要路徑。核心會在叫用框架之前，解析代理程式已設定的 `github-copilot` 驗證設定檔（`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此 `github-copilot:<profile>` 驗證設定檔可在無須環境變數的情況下，為無頭模式、排程或多設定檔設定提供端對端支援。
4. **環境變數備援**，依此順序檢查（第一個非空白值優先；空字串視為不存在；與 `extensions/github-copilot/auth.ts` 中已發布的 `github-copilot` 提供者優先順序一致）：
   1. `OPENCLAW_GITHUB_TOKEN` — 框架專用覆寫；可讓你為 OpenClaw 框架固定權杖，而不影響系統範圍的 `gh`／Copilot 命令列介面設定。
   2. `COPILOT_GITHUB_TOKEN` — 標準 Copilot SDK／命令列介面環境變數。
   3. `GH_TOKEN` — 標準 `gh` 命令列介面環境變數。
   4. `GITHUB_TOKEN` — 通用 GitHub 權杖備援。

   合成的集區設定檔 ID 為 `env:<NAME>`；設定檔版本則是權杖的不可逆 sha256 指紋，因此輪替環境變數值時，可以乾淨地使客戶端集區失效。

5. 沒有可用權杖訊號時，使用**預設 `useLoggedInUser`**。

每個代理程式都有自己的 `copilotHome`，因此同一部機器上不同代理程式之間絕不會洩漏 Copilot 命令列介面權杖、工作階段與設定。預設值為：`<agentDir>/copilot`（讓 SDK 狀態不會與 OpenClaw 的 `models.json`／`auth-profiles.json` 位於同一目錄），若未提供代理程式目錄，則為 `~/.openclaw/agents/<agentId>/copilot`。若要使用自訂位置（例如供遷移使用的共用掛載點），請在嘗試輸入上以 `copilotHome: <path>` 覆寫。

即時框架測試使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 提供直接權杖。共用即時測試設定會在將實際驗證設定檔暫存至隔離測試主目錄後，清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 與 `GITHUB_TOKEN`，因此透過專用變數傳入的 `gh auth token` 值可避免錯誤略過，同時不會洩漏至無關的測試套件。

## 設定介面

此框架會從每次嘗試的輸入（`runCopilotAttempt({...})`）及 `extensions/copilot/src/` 內的一小組環境預設值讀取設定：

| 欄位                     | 用途                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每個代理程式的命令列介面狀態目錄（預設值如上）。                                                                                                                                                                                                                                                |
| `model`                  | 字串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略時使用代理程式的一般模型選擇；此框架會驗證解析後的提供者是否受支援。                                                                                                                                                         |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。對應自 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel`／`ReasoningLevel` 解析結果。                                                                                                                                                                |
| `infiniteSessionConfig`  | SDK `infiniteSessions` 區塊的選用覆寫，由 `harness.compact` 驅動。維持原樣即可安全使用。                                                                                                                                                                                                          |
| `hooksConfig`            | 選用的原生 Copilot SDK `SessionHooks` 設定，供工具／MCP、使用者提示、工作階段與錯誤回呼使用。與 OpenClaw 的可攜式生命週期掛鉤分開。                                                                                                                                                                |
| `permissionPolicy`       | SDK 內建工具種類（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）之 `onPermissionRequest` 處理常式的選用覆寫。基於安全考量，預設為 `rejectAllPolicy`；請參閱[權限與 ask_user](#permissions-and-ask_user)，瞭解它實際上為何永遠不會觸發。 |
| `enableSessionTelemetry` | 選用的 SDK 工作階段遙測旗標。                                                                                                                                                                                                                                                                   |

OpenClaw 外掛掛鉤不需要 Copilot 專用的嘗試設定。此框架會透過標準框架輔助程式執行 `before_prompt_build`（以及舊版 `before_agent_start` 相容性掛鉤）、`llm_input`、`llm_output` 與 `agent_end`。成功的 SDK 壓縮也會執行 `before_compaction` 與 `after_compaction`。橋接的 OpenClaw 工具會執行 `before_tool_call` 並回報 `after_tool_call`；`hooksConfig` 則保留供沒有可攜式對應項目的原生 SDK 專用回呼使用。

OpenClaw 中的其他部分不需要知道這些欄位。其他外掛、頻道與核心程式碼只會看到標準 `AgentHarnessAttemptParams`／`AgentHarnessAttemptResult` 形式。

## 壓縮

當 `harness.compact` 執行時，Copilot SDK 框架會：

1. 恢復受追蹤的 SDK 工作階段，但不繼續處理待辦工作。
2. 呼叫 SDK 的工作階段範圍歷程壓縮 RPC。
3. 傳回 SDK 壓縮結果，而不在工作區下寫入相容性標記檔案。

OpenClaw 端的對話記錄鏡像（如下）會繼續接收壓縮後的訊息，因此使用者可見的聊天記錄會保持一致。

## 對話記錄鏡像

`runCopilotAttempt` 會透過 `extensions/copilot/src/dual-write-transcripts.ts`，將每個回合中可鏡像的訊息雙寫至 OpenClaw 稽核對話記錄。鏡像的範圍依工作階段區分（`copilot:${sessionId}`），並以每則訊息為單位建立索引鍵（`${role}:${sha256_16(role,content)}`），因此再次發出的先前回合項目會與現有的磁碟索引鍵衝突，而不會重複寫入。

鏡像外圍有兩層故障隔離，因此逐字稿寫入失敗絕不會導致嘗試失敗：一層是內部的盡力而為包裝器，另一層是嘗試層級的縱深防禦 `.catch(...)`。失敗只會記錄到日誌，不會向外呈現。

## 附帶問題（`/btw`）

此代理框架並不原生支援 `/btw`。`createCopilotAgentHarness()`
刻意讓 `harness.runSideQuestion` 保持未定義
（在 `extensions/copilot/harness.test.ts` 的 `describe("runSideQuestion")` 中斷言），
因此 OpenClaw 的 `/btw` 分派器（`src/agents/btw.ts`）會退回至
所有非 Codex 執行環境使用的相同路徑：直接以簡短的附帶問題提示詞
呼叫已設定的模型供應商，並透過 `streamSimple` 串流傳回
（不使用命令列介面工作階段，也不占用額外的集區位置）。

如此可將 Copilot CLI 工作階段保留給代理程式的主要回合迴圈，
並讓 `/btw` 的行為與其他非 Codex 執行環境完全相同。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 會由
`src/plugins/doctor-contract-registry.ts` 自動載入。它提供：

- 空的 `legacyConfigRules`（目前尚無已淘汰的欄位）。
- 不執行任何操作的 `normalizeCompatibilityConfig`（保留此項，讓未來淘汰欄位時
  在原始碼樹中有穩定的歸屬位置）。
- 一個 `sessionRouteStateOwners` 項目：供應商 `github-copilot`、執行環境
  `copilot`、命令列介面工作階段金鑰 `copilot`、驗證設定檔前綴 `github-copilot:`。

## 限制

- 此代理框架會宣告 `github-copilot`，以及沒有擁有者的自訂 BYOK 供應商 ID。
  由資訊清單擁有的原生供應商 ID 仍會留在其所屬執行環境上，即使
  `agentRuntime.id` 被強制設為 `copilot` 亦然。
- 沒有終端介面介面；對於沒有對等介面的執行環境，PI 的終端介面仍是備援方案。
- 當代理程式切換至 `copilot` 時，不會移轉 PI 工作階段狀態。
  每次嘗試都會個別選擇；現有的 PI 工作階段仍然有效。
- `ask_user` 使用與 Codex 代理框架相同的 OpenClaw 提示與回覆路徑：
  當 Copilot SDK 要求使用者輸入時，OpenClaw 會向作用中的頻道／終端介面
  發送阻塞式提示，而下一則排入佇列的使用者訊息會完成該 SDK 請求。

## 權限與 ask_user

橋接 OpenClaw 工具的權限強制執行發生在**工具包裝器內部**，
而非透過 SDK 的 `onPermissionRequest` 回呼。PI 使用的相同
`wrapToolWithBeforeToolCallHook`
（`src/agents/agent-tools.before-tool-call.ts`）會由
`createOpenClawCodingTools` 套用至每個程式設計工具：迴圈偵測、受信任的
外掛政策、工具呼叫前掛鉤，以及透過閘道執行的兩階段外掛核准
（`plugin.approval.request`），全都會經過與原生 PI 嘗試完全相同的程式碼路徑。

`convertOpenClawToolToSdkTool` 傳回的 SDK 工具會標記：

- `overridesBuiltInTool: true` — 取代 Copilot CLI 中同名的內建工具
  （edit、read、write、bash、...），讓每次工具呼叫都路由回 OpenClaw。
- `skipPermission: true` — 指示 SDK 不要在叫用工具前觸發
  `onPermissionRequest({kind: "custom-tool"})`。經包裝的 `execute()` 已執行
  更完整的 OpenClaw 政策檢查；SDK 層級的提示若不是略過 OpenClaw 的強制執行
  （全部允許），就是封鎖每次工具呼叫（全部拒絕）——兩者都不符合與 PI 對等的行為。

原始碼樹內的 Codex 代理框架採用相同的分工：橋接的 OpenClaw 工具會經過包裝
（`extensions/codex/src/app-server/dynamic-tools.ts`），而
codex-app-server 自有的原生核准種類
（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、
`item/permissions/requestApproval`）則透過 `plugin.approval.request`
進行路由（`extensions/codex/src/app-server/approval-bridge.ts`）。對等的
Copilot SDK 機制——對所有送達 `onPermissionRequest` 且非 `custom-tool`
的種類套用失敗時關閉的 `rejectAllPolicy`——是相同的安全網；實務上它絕不會觸發，
因為 `overridesBuiltInTool: true` 會取代所有內建工具。

為了讓包裝工具層能做出與 PI 對等的政策決策，此代理框架會將完整的 PI
嘗試工具情境轉送至 `createOpenClawCodingTools`：身分
（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist`、...）、
頻道／路由（`groupId`、`currentChannelId`、`replyToMode`、訊息工具切換設定）、
驗證（`authProfileStore`）、執行身分（從 `sandboxSessionKey` 衍生的
`sessionKey`／`runSessionKey`、`runId`）、模型情境（`modelApi`、
`modelContextWindowTokens`、`modelCompat`、`modelHasVision`），以及執行掛鉤
（`onToolOutcome`、`onYield`）。若缺少這些欄位，僅限擁有者的允許清單
預設會無聲拒絕、外掛信任政策無法解析至正確範圍，且
`session_status: "current"` 會解析為過時的沙箱金鑰。橋接建構器位於
`extensions/copilot/src/tool-bridge.ts`，其設計對應 PI 在
`src/agents/embedded-agent-runner/run/attempt.ts:1262` 的權威呼叫。
`runAttempt` 透過共用的 `resolveSandboxContext` 接縫解析沙箱情境，
將有效的工作目錄傳給 SDK，並把 `sandbox` 及子代理程式產生工作區轉送至工具橋接。
橋接也會轉送它可在 SDK 邊界強制執行的有限工具建構控制項：
`includeCoreTools`、執行環境工具允許清單，以及 `toolConstructionPlan`。

橋接也會使用 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的共用代理框架
工具介面輔助程式，以維持與 PI 對等。啟用工具搜尋時，SDK 看到的是精簡的控制工具
及隱藏的目錄執行器，而不是每個 OpenClaw 工具結構描述。啟用程式碼模式時，
該輔助程式會建構與其他代理框架相同的程式碼模式控制介面及目錄生命週期。
本機模型的精簡預設值、與執行環境相容的結構描述篩選、目錄載入及目錄清理，
全都保留在共用輔助程式中，避免 Copilot 與 Codex 相鄰的代理框架產生差異。

### 工作階段層級的 GitHub 權杖

Copilot SDK 合約會區分**用戶端層級**的 GitHub 權杖
（`CopilotClientOptions.gitHubToken`，用於驗證命令列介面處理程序本身）
與**工作階段層級**的權杖（`SessionConfig.gitHubToken`，決定該工作階段的
內容排除、模型路由及配額；`createSession` 與 `resumeSession` 均會採用）。
此代理框架會透過 `resolveCopilotAuth` 解析一次驗證，並在驗證模式為
`gitHubToken` 時設定這兩個欄位（明確設定的 `auth.gitHubToken`，或從已設定的
`github-copilot` 驗證設定檔依合約解析出的 `resolvedApiKey`）。當解析出的模式為
`useLoggedInUser` 時，會省略工作階段層級的欄位，讓 SDK 繼續從已登入身分衍生身分資訊。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。對於固定選項的請求，
橋接接受選項索引或標籤；當 SDK 請求允許時，也接受自由格式回答；若 OpenClaw
嘗試中止，則會取消待處理的請求。

## 相關內容

- [代理程式執行環境](/zh-TW/concepts/agent-runtimes)
- [Codex 代理框架](/zh-TW/plugins/codex-harness)
- [代理框架外掛（SDK 參考）](/zh-TW/plugins/sdk-agent-harness)

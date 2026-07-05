---
read_when:
    - 你想要將 GitHub Copilot SDK 測試框架用於代理程式
    - 你需要 `copilot` 執行階段的設定範例
    - 你正在將代理接入訂閱版 Copilot（github / openclaw / copilot），並希望它透過 Copilot 命令列介面執行。
summary: 透過外部 GitHub Copilot SDK 測試框架執行 OpenClaw 嵌入式代理回合
title: Copilot SDK 測試框架
x-i18n:
    generated_at: "2026-07-05T11:35:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ce0dd8fb69275450b3342a3acd7ec5c1d993a88196c5d0ad2f2fa9a34badf97
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 外掛會透過 GitHub Copilot 命令列介面（`@github/copilot-sdk`）執行嵌入式訂閱 Copilot 代理回合，而不是使用 OpenClaw 內建的 PI 執行框架。Copilot 命令列介面工作階段負責低階代理迴圈：原生工具執行、原生壓縮（`infiniteSessions`），以及 `copilotHome` 下由命令列介面管理的執行緒狀態。OpenClaw 仍負責聊天通道、工作階段檔案、模型選擇、動態工具（橋接）、核准、媒體傳遞、可見的逐字稿鏡像、`/btw` 附帶問題（請參閱[附帶問題（`/btw`）](#side-questions-btw)），以及 `openclaw doctor`。

如需更廣泛的模型／提供者／執行階段劃分，請先閱讀[代理執行階段](/zh-TW/concepts/agent-runtimes)。

## 需求

- 已安裝 `@openclaw/copilot` 外掛的 OpenClaw。
- 如果你的設定使用 `plugins.allow`，請包含 `copilot`（外掛宣告的資訊清單 ID）。npm 套件名稱 `@openclaw/copilot` 的允許清單項目不會相符，即使已設定 `agentRuntime.id: "copilot"`，外掛仍會被封鎖。
- 可驅動 Copilot 命令列介面的 GitHub Copilot 訂閱，或用於無頭或排程執行的 `gitHubToken` 環境變數／驗證設定檔項目。
- 可寫入的 `copilotHome` 目錄。當 OpenClaw 提供代理目錄時，預設為 `<agentDir>/copilot`，否則為 `~/.openclaw/agents/<agentId>/copilot`。

`openclaw doctor` 會執行外掛的 [doctor 合約](#doctor)，以處理工作階段狀態所有權與未來設定遷移。它不會探查 Copilot 命令列介面環境。

## 安裝

Copilot 執行階段以外部外掛形式提供，因此核心 `openclaw` 套件不會攜帶 `@github/copilot-sdk` 或其平台特定的 `@github/copilot-<platform>-<arch>` 命令列介面二進位檔（合計約 260 MB）。只為選用此執行階段的代理安裝它：

```bash
openclaw plugins install @openclaw/copilot
```

第一次選取 `github-copilot/*` 模型，**且**你的設定透過 `agentRuntime: { id: "copilot" }` 將該模型（或其提供者）路由到 Copilot 執行階段時，設定精靈會自動安裝此外掛；請參閱[快速開始](#quickstart)。若沒有這項選用設定，OpenClaw 會使用其內建的 GitHub Copilot 提供者，且不會安裝此外掛。

執行階段會依下列順序解析 SDK：

1. 從已安裝的 `@openclaw/copilot` 套件執行 `import("@github/copilot-sdk")`。
2. 後援目錄 `~/.openclaw/npm-runtime/copilot/`（舊版隨需安裝目標）。

缺少 SDK 時會顯示一個錯誤，代碼為 `COPILOT_SDK_MISSING`，並附上上方的重新安裝命令。

## 快速開始

將一個模型（或一個提供者）釘選到執行框架：

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

在單一模型項目上設定 `agentRuntime.id`，即可只將該模型路由到執行框架；或在提供者上設定，將該提供者下的每個模型都路由過去。

`github-copilot/auto` 是可攜的起點。具名 Copilot 模型取決於帳戶與組織政策；釘選前，請確認你已驗證的 Copilot 命令列介面實際公開該模型。

## 支援的提供者

執行框架支援標準 `github-copilot` 提供者（由 `extensions/github-copilot` 擁有），也支援自訂 `models.providers` 項目，前提是模型具有非空的 `baseUrl`，且具備下列其中一種 `api` 形狀：

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`（OpenAI 相容 completions）
- `openai-completions`
- `openai-responses`

原生提供者 ID（`openai`、`anthropic`、`google`、`ollama`）仍由其原生執行階段擁有。若要改透過 Copilot BYOK 路由端點，請使用不同的自訂提供者 ID。

Copilot BYOK 端點必須是公開 HTTPS URL。執行框架會提供 Copilot SDK 每次嘗試專用的 loopback 代理，然後透過 OpenClaw 的受保護 fetch 路徑轉送提供者流量，讓 DNS pinning 與 SSRF 政策仍由 OpenClaw 擁有。若使用本機 Ollama、LM Studio 或 LAN 模型伺服器，請使用原生 OpenClaw 執行階段。

## BYOK

Copilot BYOK 使用 SDK 的工作階段層級自訂提供者合約。OpenClaw 會傳入已解析的模型端點、API 金鑰、bearer-token 模式、標頭、模型 ID，以及內容／輸出限制；提供者傳輸邏輯保留在 SDK，而不是核心。

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

BYOK 工作階段會與訂閱工作階段，以及其他 BYOK 端點或憑證分開建立金鑰。輪替金鑰、標頭、模型或端點時，會啟動新的 Copilot SDK 工作階段，而不是恢復不相容的狀態。

## 驗證

優先順序會在 `runCopilotAttempt` 期間針對每個代理套用：

1. 嘗試輸入上的**明確 `useLoggedInUser: true`**：使用代理 `copilotHome` 下 Copilot 命令列介面的已登入使用者。
2. 嘗試輸入上的**明確 `gitHubToken`**（需要 `profileId` + `profileVersion`）。用於需要略過驗證設定檔解析的直接命令列介面叫用與測試。
3. **合約解析的 `resolvedApiKey` + `authProfileId`**：正式環境主要路徑。核心會在叫用執行框架前，解析代理設定的 `github-copilot` 驗證設定檔（`src/infra/provider-usage.auth.ts:resolveProviderAuths`），因此 `github-copilot:<profile>` 驗證設定檔可在無頭、排程或多設定檔配置中端對端運作，無需環境變數。
4. **環境變數後援**，依此順序檢查（第一個非空值獲勝，空字串視為不存在；鏡像 `extensions/github-copilot/auth.ts` 中已出貨的 `github-copilot` 提供者優先順序）：
   1. `OPENCLAW_GITHUB_TOKEN`：執行框架專用覆寫；讓你能為 OpenClaw 執行框架釘選權杖，而不干擾全系統的 `gh`／Copilot 命令列介面設定。
   2. `COPILOT_GITHUB_TOKEN`：標準 Copilot SDK／命令列介面環境變數。
   3. `GH_TOKEN`：標準 `gh` 命令列介面環境變數。
   4. `GITHUB_TOKEN`：通用 GitHub 權杖後援。

   合成的集區設定檔 ID 為 `env:<NAME>`；設定檔版本是權杖的不可逆 sha256 指紋，因此輪替環境變數值會乾淨地使客戶端集區失效。

5. 沒有權杖訊號時，使用**預設 `useLoggedInUser`**。

每個代理都有自己的 `copilotHome`，因此 Copilot 命令列介面權杖、工作階段與設定絕不會在同一台機器上的代理之間洩漏。預設值：`<agentDir>/copilot`（讓 SDK 狀態不與 OpenClaw 的 `models.json`／`auth-profiles.json` 位於同一目錄），或在未提供代理目錄時使用 `~/.openclaw/agents/<agentId>/copilot`。若要使用自訂位置（例如用於遷移的共享掛載點），請在嘗試輸入上以 `copilotHome: <path>` 覆寫。

即時執行框架測試使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` 作為直接權杖。共享即時測試設定會在將真實驗證設定檔暫存到隔離測試 home 後，清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 與 `GITHUB_TOKEN`，因此透過專用變數傳入的 `gh auth token` 值可以避免誤略過，同時不會洩漏到不相關的套件中。

## 設定表面

執行框架會從每次嘗試輸入（`runCopilotAttempt({...})`）以及 `extensions/copilot/src/` 內的一小組環境預設值讀取設定：

| 欄位                     | 用途                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 每個代理的命令列介面狀態目錄（預設值見上方）。                                                                                                                                                                                                                                        |
| `model`                  | 字串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。省略時使用代理的一般模型選擇；執行框架會驗證已解析的提供者受到支援。                                                                                                                                                |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`。從 `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel`／`ReasoningLevel` 解析映射而來。                                                                                                                                                    |
| `infiniteSessionConfig`  | 由 `harness.compact` 驅動的 SDK `infiniteSessions` 區塊選用覆寫。保持原樣即可。                                                                                                                                                                                                         |
| `hooksConfig`            | 用於工具／MCP、使用者提示、工作階段與錯誤回呼的選用原生 Copilot SDK `SessionHooks` 設定。這與 OpenClaw 的可攜生命週期 hooks 分開。                                                                                                                                                    |
| `permissionPolicy`       | SDK 內建工具種類（`shell`、`write`、`read`、`url`、`mcp`、`memory`、`hook`）的 `onPermissionRequest` 處理常式選用覆寫。預設為 `rejectAllPolicy` 作為安全網；請參閱[權限與 ask_user](#permissions-and-ask_user)，了解為什麼它實際上永遠不會觸發。 |
| `enableSessionTelemetry` | 選用的 SDK 工作階段遙測旗標。                                                                                                                                                                                                                                                         |

OpenClaw 外掛 hooks 不需要 Copilot 專用嘗試設定。執行框架會透過標準執行框架輔助程式執行 `before_prompt_build`（以及舊版 `before_agent_start` 相容性 hook）、`llm_input`、`llm_output` 與 `agent_end`。成功的 SDK 壓縮也會執行 `before_compaction` 與 `after_compaction`。橋接的 OpenClaw 工具會執行 `before_tool_call` 並回報 `after_tool_call`；`hooksConfig` 保留給沒有可攜等效項目的原生 SDK 專用回呼。

OpenClaw 中的其他部分不需要知道這些欄位。其他外掛、通道與核心程式碼只會看到標準的 `AgentHarnessAttemptParams`／`AgentHarnessAttemptResult` 形狀。

## 壓縮

當 `harness.compact` 執行時，Copilot SDK 執行框架會：

1. 恢復已追蹤的 SDK 工作階段，但不繼續進行中的工作。
2. 呼叫 SDK 的工作階段範圍歷程壓縮 RPC。
3. 回傳 SDK 壓縮結果，不在工作區下寫入相容性標記檔案。

OpenClaw 端的逐字稿鏡像（如下）會持續接收壓縮後的訊息，因此面向使用者的聊天歷程會保持一致。

## 逐字稿鏡像

`runCopilotAttempt` 會透過 `extensions/copilot/src/dual-write-transcripts.ts`，將每個回合可鏡像的訊息雙寫入 OpenClaw 稽核逐字稿。鏡像以每個工作階段為範圍（`copilot:${sessionId}`），並以每則訊息建立金鑰（`${role}:${sha256_16(role,content)}`），因此重新發出的前幾回合項目會與既有磁碟金鑰碰撞，而不是重複寫入。

兩層失敗圍堵包覆著鏡像，因此轉錄寫入失敗永遠不會讓該次嘗試失敗：一個內部的盡力而為包裝器，加上嘗試層級的防禦縱深 `.catch(...)`。失敗會被記錄，而不會向外浮現。

## 附帶問題（`/btw`）

`/btw` 在此測試框架上**不是**原生功能。`createCopilotAgentHarness()` 會刻意讓 `harness.runSideQuestion` 保持未定義（在 `extensions/copilot/harness.test.ts` 的 `describe("runSideQuestion")` 中斷言），因此 OpenClaw 的 `/btw` 分派器（`src/agents/btw.ts`）會落入它用於每個非 Codex 執行階段的相同路徑：直接呼叫已設定的模型提供者，使用簡短的附帶問題提示，並透過 `streamSimple` 串流回傳（沒有命令列介面工作階段，沒有額外的集區名額）。

這會讓 Copilot 命令列介面工作階段保留給代理的主回合迴圈，並讓 `/btw` 行為與其他非 Codex 執行階段保持一致。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 會由 `src/plugins/doctor-contract-registry.ts` 自動載入。它提供：

- 空的 `legacyConfigRules`（尚無已停用欄位）。
- 無操作的 `normalizeCompatibilityConfig`（保留此項，讓未來欄位停用時有穩定的樹內歸屬）。
- 一個 `sessionRouteStateOwners` 項目：提供者 `github-copilot`、執行階段 `copilot`、命令列介面工作階段鍵 `copilot`、驗證設定檔前綴 `github-copilot:`。

## 限制

- 測試框架宣告 `github-copilot` 加上未歸屬的自訂 BYOK 提供者 ID。由 manifest 擁有的原生提供者 ID 會留在其所屬的執行階段，即使 `agentRuntime.id` 被強制設為 `copilot`。
- 沒有終端介面表面；對於沒有對等表面的執行階段，PI 的終端介面仍是備援。
- 當代理切換到 `copilot` 時，PI 工作階段狀態不會遷移。選擇是依每次嘗試而定；既有 PI 工作階段仍然有效。
- `ask_user` 使用與 Codex 測試框架相同的 OpenClaw 提示與回覆路徑：當 Copilot SDK 要求使用者輸入時，OpenClaw 會將阻塞提示張貼到作用中的頻道/終端介面，而下一則排入佇列的使用者訊息會解析該 SDK 要求。

## 權限與 ask_user

橋接 OpenClaw 工具的權限強制執行發生在**工具包裝器內部**，而不是透過 SDK 的 `onPermissionRequest` 回呼。PI 使用的同一個 `wrapToolWithBeforeToolCallHook`（`src/agents/agent-tools.before-tool-call.ts`）會由 `createOpenClawCodingTools` 套用到每個程式碼工具：迴圈偵測、受信任外掛政策、工具呼叫前掛鉤，以及透過閘道（`plugin.approval.request`）進行的兩階段外掛核准，全都會走與原生 PI 嘗試完全相同的程式碼路徑。

`convertOpenClawToolToSdkTool` 回傳的 SDK Tool 會標記為：

- `overridesBuiltInTool: true` — 取代 Copilot 命令列介面內建的同名工具（edit、read、write、bash 等），因此每次工具呼叫都會路由回 OpenClaw。
- `skipPermission: true` — 告訴 SDK 不要在叫用工具前觸發 `onPermissionRequest({kind: "custom-tool"})`。包裝後的 `execute()` 已經執行更豐富的 OpenClaw 政策檢查；SDK 層級的提示若不是短路 OpenClaw 的強制執行（全部允許），就是阻塞每次工具呼叫（全部拒絕）— 兩者都不符合 PI 對等性。

樹內 Codex 測試框架使用相同分工：橋接的 OpenClaw 工具會被包裝（`extensions/codex/src/app-server/dynamic-tools.ts`），而 codex-app-server 自身的原生核准種類（`item/commandExecution/requestApproval`、`item/fileChange/requestApproval`、`item/permissions/requestApproval`）會透過 `plugin.approval.request` 路由（`extensions/codex/src/app-server/approval-bridge.ts`）。Copilot SDK 的對等做法是：對任何曾抵達 `onPermissionRequest` 的非 `custom-tool` 種類採用失敗關閉的 `rejectAllPolicy`，這是相同的安全網；實務上它永遠不會觸發，因為 `overridesBuiltInTool: true` 會取代每個內建工具。

為了讓包裝工具層能做出與 PI 等價的政策決策，測試框架會將完整的 PI 嘗試工具情境轉送給 `createOpenClawCodingTools`：身分（`senderIsOwner`、`memberRoleIds`、`ownerOnlyToolAllowlist` 等）、頻道/路由（`groupId`、`currentChannelId`、`replyToMode`、訊息工具切換）、驗證（`authProfileStore`）、執行身分（由 `sandboxSessionKey`、`runId` 衍生的 `sessionKey` / `runSessionKey`）、模型情境（`modelApi`、`modelContextWindowTokens`、`modelCompat`、`modelHasVision`），以及執行掛鉤（`onToolOutcome`、`onYield`）。若缺少這些欄位，僅限擁有者的允許清單預設會靜默拒絕、外掛信任政策無法解析到正確範圍，而 `session_status: "current"` 會解析到過期的沙箱鍵。橋接建構器是 `extensions/copilot/src/tool-bridge.ts`，對應 PI 在 `src/agents/embedded-agent-runner/run/attempt.ts:1262` 的權威呼叫。`runAttempt` 透過共用的 `resolveSandboxContext` 接縫解析沙箱情境，將有效工作目錄傳給 SDK，並把 `sandbox` 以及子代理產生工作區轉送到工具橋接。橋接也會轉送它能在 SDK 邊界強制執行的有界工具建構控制：`includeCoreTools`、執行階段工具允許清單，以及 `toolConstructionPlan`。

橋接也使用來自 `openclaw/plugin-sdk/agent-harness-tool-runtime` 的共用測試框架工具表面輔助工具，以維持 PI 對等性。啟用工具搜尋時，SDK 會看到精簡的控制工具以及隱藏的目錄執行器，而不是每個 OpenClaw 工具結構描述。啟用程式碼模式時，該輔助工具會建置與其他代理測試框架相同的程式碼模式控制表面與目錄生命週期。本機模型精簡預設值、執行階段相容結構描述篩選、目錄補水，以及目錄清理都保留在共用輔助工具中，因此 Copilot 與 Codex 相鄰測試框架不會漂移。

### 工作階段層級 GitHub 權杖

Copilot SDK 合約會區分**用戶端層級** GitHub 權杖（`CopilotClientOptions.gitHubToken`，驗證命令列介面程序本身）與**工作階段層級**權杖（`SessionConfig.gitHubToken`，決定該工作階段的內容排除、模型路由與配額；在 `createSession` 與 `resumeSession` 皆會採用）。測試框架會透過 `resolveCopilotAuth` 解析一次驗證，並在驗證模式為 `gitHubToken`（明確的 `auth.gitHubToken`，或從已設定的 `github-copilot` 驗證設定檔依合約解析出的 `resolvedApiKey`）時設定這兩個欄位。當解析出的模式為 `useLoggedInUser` 時，會省略工作階段層級欄位，讓 SDK 繼續從已登入身分衍生身分。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。橋接會接受固定選項要求的選項索引或標籤，當 SDK 要求允許自由格式答案時會接受自由格式回答，並在 OpenClaw 嘗試中止時取消待處理的要求。

## 相關

- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [代理測試框架外掛（SDK 參考）](/zh-TW/plugins/sdk-agent-harness)

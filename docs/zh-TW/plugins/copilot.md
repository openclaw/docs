---
read_when:
    - 你想要為代理程式使用 GitHub Copilot SDK harness
    - 你需要 `copilot` 執行階段的設定範例
    - 你正在將代理連接到訂閱版 Copilot（github / openclaw / copilot），並希望它透過 Copilot 命令列介面執行
summary: 透過外部 GitHub Copilot SDK 框架執行 OpenClaw 嵌入式代理程式回合
title: Copilot SDK 測試框架
x-i18n:
    generated_at: "2026-06-27T19:36:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

外部 `@openclaw/copilot` 外掛讓 OpenClaw 透過 GitHub Copilot 命令列介面 (`@github/copilot-sdk`) 執行嵌入式訂閱
Copilot agent 回合，而不是使用內建的 PI harness。

當你希望 Copilot 命令列介面工作階段擁有底層 agent loop 時，請使用 Copilot SDK harness：原生工具執行、原生壓縮
(`infiniteSessions`)，以及 `copilotHome` 下由命令列介面管理的 thread 狀態。
OpenClaw 仍擁有聊天通道、工作階段檔案、模型選擇、OpenClaw
動態工具（橋接）、核准、媒體傳遞、可見 transcript
鏡像、`/btw` 附帶問題（由樹內 PI fallback 處理 — 參見
[附帶問題 (`/btw`)](#side-questions-btw)），以及 `openclaw doctor`。

關於更廣泛的模型/提供者/runtime 劃分，請從
[Agent runtimes](/zh-TW/concepts/agent-runtimes) 開始。

## 需求

- 已安裝 `@openclaw/copilot` 外掛的 OpenClaw。
- 如果你的設定使用 `plugins.allow`，請包含 `copilot`（外掛宣告的 manifest
  id）。若限制性 allowlist 使用 npm 風格的 `@openclaw/copilot` 套件名稱，
  即使有 `agentRuntime.id: "copilot"`，外掛仍會被封鎖，runtime 也不會載入。
- 可驅動 Copilot 命令列介面的 GitHub Copilot 訂閱（或用於 headless / 排程執行的
  `gitHubToken` env / auth-profile 項目）。
- 可寫入的 `copilotHome` 目錄。當 OpenClaw 提供 agent 目錄時，harness 預設為
  `<agentDir>/copilot`，否則為 `~/.openclaw/agents/<agentId>/copilot`，以完整隔離每個 agent。

`openclaw doctor` 會執行外掛
[doctor contract](#doctor)，用於宣告式工作階段狀態 ownership 與未來的相容性 migration。
它不會執行 Copilot 命令列介面環境探測。

## 外掛安裝

Copilot runtime 是外部外掛，因此核心 `openclaw` 套件不會攜帶
`@github/copilot-sdk` 相依性或其特定平台的
`@github/copilot-<platform>-<arch>` 命令列介面二進位檔。它們合計約增加
260 MB，因此只為選擇此 runtime 的 agent 安裝：

```bash
openclaw plugins install @openclaw/copilot
```

當你第一次選擇 `github-copilot/*` 模型，**且**你的設定透過
`agentRuntime: { id: "copilot" }` 將該模型（或其提供者）選擇加入 Copilot agent runtime 時，
精靈會安裝此外掛（見下方[快速開始](#quickstart)）。
若未選擇加入，openclaw 會使用其內建的 GitHub Copilot 提供者，且永遠不會安裝 runtime 外掛。

runtime 會依下列順序解析 SDK：

1. 從已安裝的 `@openclaw/copilot` 套件執行 `import("@github/copilot-sdk")`。
2. 已知 fallback 目錄 `~/.openclaw/npm-runtime/copilot/`（舊版隨選安裝目標）。

缺少 SDK 時會顯示單一錯誤，代碼為 `COPILOT_SDK_MISSING`，並附上上述外掛重新安裝命令。

## 快速開始

將一個模型（或一個提供者）固定到 harness：

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

兩種路徑等效。若只有該模型應透過 harness 路由，請在單一模型項目上使用
`agentRuntime.id`；若該提供者底下的每個模型都應使用它，則在提供者上設定
`agentRuntime.id`。

`github-copilot/auto` 是可攜的起點。具名 Copilot 模型取決於帳戶與組織政策，因此只有在確認已驗證的 Copilot 命令列介面公開該模型後，才固定其中一個。

## 支援的提供者

harness 宣告支援標準 `github-copilot` 提供者
（由 `extensions/github-copilot` 擁有的相同 id）：

- `github-copilot`

當所選模型有非空的 `baseUrl`，且具備下列 API 形狀之一時，它也支援自訂 `models.providers` 項目：

- `openai-responses`
- `openai-completions`
- `ollama`（OpenAI 相容 completions）
- `azure-openai-responses`
- `anthropic-messages`

原生提供者 id，例如 `openai`、`anthropic`、`google` 和 `ollama`，仍由其原生 runtime 擁有。透過 Copilot BYOK 路由 endpoint 時，請使用不同的自訂提供者 id。

Copilot BYOK endpoint 必須是公用網路 HTTPS URL。harness 會提供 Copilot SDK 每次嘗試專用的 loopback proxy URL，然後透過 OpenClaw 的受保護 fetch 路徑轉送提供者流量，讓 DNS pinning 與 SSRF policy 仍由 OpenClaw 擁有。對於本機 Ollama、LM Studio 或 LAN 模型伺服器，請使用原生 OpenClaw runtime。

## BYOK

Copilot BYOK 使用 SDK 的工作階段層級自訂提供者 contract。OpenClaw 會傳入已解析的模型 endpoint、API key、bearer-token mode、headers、model
id，以及 context/output limits，而不會把提供者 transport logic 移入核心。

例如：

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

BYOK 工作階段會與訂閱工作階段，以及其他 endpoint 或 credential fingerprint 分開 key。輪換 key、headers、model 或 endpoint 會建立新的 Copilot SDK 工作階段，而不是恢復不相容的狀態。

## 驗證

每個 agent 的優先順序，於 `runCopilotAttempt` 期間套用：

1. 嘗試輸入上的**明確 `useLoggedInUser: true`**。使用 Copilot
   命令列介面在 agent 的 `copilotHome` 下解析出的已登入使用者。
2. 嘗試輸入上的**明確 `gitHubToken`**（搭配 `profileId` +
   `profileVersion`）。適用於直接命令列介面呼叫與測試，其中呼叫端想略過 auth-profile 解析。
3. 來自 `EmbeddedRunAttemptParams` 形狀的**contract-resolved `resolvedApiKey` + `authProfileId`**。這是**production main path**：
   核心會在叫用 harness 前解析 agent 已設定的 `github-copilot` auth profile
   （透過 `src/infra/provider-usage.auth.ts:resolveProviderAuths`），harness 則直接使用這兩個欄位。
   這讓 `github-copilot:<profile>` auth profile 可在 headless / 排程 / multi-profile 設定中端到端運作，無需 env vars。
4. **Env-var fallback**，用於沒有設定 auth
   profile 的直接命令列介面 / dogfood 執行。runtime 會依優先順序檢查下列 vars，
   對應已發布的 `github-copilot` 提供者
   (`extensions/github-copilot/auth.ts`) 與已記錄的 Copilot SDK
   setup：
   1. `OPENCLAW_GITHUB_TOKEN` -- harness-specific override；設定此值可為 OpenClaw harness 固定 token，而不干擾系統層級的 `gh` / Copilot 命令列介面設定。
   2. `COPILOT_GITHUB_TOKEN` -- 標準 Copilot SDK / 命令列介面 env var。
   3. `GH_TOKEN` -- 標準 `gh` 命令列介面 env var（符合現有 `github-copilot` 提供者優先順序）。
   4. `GITHUB_TOKEN` -- 通用 GitHub token fallback。

   第一個非空值勝出；空字串會視為不存在。合成的 pool profile id 為 `env:<NAME>`，profileVersion 是 token 的不可逆 sha256 fingerprint，因此輪換 env 值會乾淨地使 client pool 失效。

5. 沒有 token signal 可用時，預設 **`useLoggedInUser`**。

每個 agent 都會取得專用的 `copilotHome`，因此 Copilot 命令列介面 tokens、sessions 與
config 不會在同一台機器上的 agent 之間洩漏。當 host 將 agent 目錄交給 harness 時，預設值是
`<agentDir>/copilot`（將 SDK 狀態與同一目錄中的 OpenClaw `models.json` / `auth-profiles.json` 隔離），否則為 `~/.openclaw/agents/<agentId>/copilot`。
需要自訂位置時（例如用於 migration 的共用 mount），請在嘗試輸入上以 `copilotHome: <path>` 覆寫。

當需要直接 token 時，live harness 測試會使用 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`。共用 live-test setup 會刻意在把真實 auth
profiles 暫存到隔離測試 home 後清除 `COPILOT_GITHUB_TOKEN`、`GH_TOKEN` 和 `GITHUB_TOKEN`，
因此透過專用 live-test 變數傳入 `gh auth token` 值，可避免誤判跳過，而不會將 token 暴露給不相關的 suites。

## 設定介面

harness 會從每次嘗試輸入
(`runCopilotAttempt({...})`) 加上 `extensions/copilot/src/` 內少量 env defaults 讀取設定：

- `copilotHome` — 每個 agent 的命令列介面狀態目錄（預設值如上所述）。
- `model` — 字串或 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`。
  省略時，OpenClaw 會使用 agent 的一般模型選擇，且 harness 會驗證已解析的提供者受支援。
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`。從
  `auto-reply/thinking.ts` 中 OpenClaw 的 `ThinkLevel` / `ReasoningLevel` 解析映射而來。
- `infiniteSessionConfig` — SDK
  `infiniteSessions` block 的選用覆寫，由 `harness.compact` 驅動。預設值可安全保持不變。
- `hooksConfig` — 選用的原生 Copilot SDK `SessionHooks` 相容性
  config，用於 tool/MCP、user-prompt、session 與 error callbacks。
  它與 OpenClaw 的可攜 lifecycle hooks 分開。
- `permissionPolicy` — SDK
  `onPermissionRequest` handler 的選用覆寫，用於內建 SDK tool kinds
  (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`)。預設為
  `rejectAllPolicy` 作為 safety net；實務上 SDK 從不
  叫用這些 kinds，因為每個橋接的 OpenClaw 工具都以
  `overridesBuiltInTool: true` 和
  `skipPermission: true` 註冊，因此 100% 的工具呼叫都會流經 OpenClaw 的
  wrapped `execute()`。參見 [Permissions and ask_user](#permissions-and-ask_user)。
- `enableSessionTelemetry` — 選用 SDK 工作階段 telemetry flag。

OpenClaw 外掛 hooks 不需要 Copilot-specific attempt configuration。
harness 會透過標準 harness helpers 執行 `before_prompt_build`（以及舊版
`before_agent_start` 相容性 hook）、`llm_input`、`llm_output` 和 `agent_end`。
成功的 SDK compactions 也會執行
`before_compaction` 和 `after_compaction`。橋接的 OpenClaw 工具會繼續執行
`before_tool_call` 並回報 `after_tool_call`；`hooksConfig` 保留給沒有可攜等效項的原生 SDK-only callbacks。

OpenClaw 其他部分不需要知道這些欄位。其他外掛、通道與核心程式碼只會看到標準的
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 形狀。

## 壓縮

當 `harness.compact` 執行時，Copilot SDK harness 會：

1. 恢復追蹤的 SDK 工作階段，而不繼續待處理工作。
2. 呼叫 SDK 的 session-scoped history compaction RPC。
3. 傳回 SDK 壓縮結果，而不在 workspace 下寫入相容性 marker
   files。

OpenClaw 端的 transcript 鏡像（見下方）會繼續接收壓縮後訊息，因此面向使用者的聊天歷史會保持一致。

## Transcript mirroring

`runCopilotAttempt` 會透過
`extensions/copilot/src/dual-write-transcripts.ts`，將每個回合可鏡像的訊息雙寫入
OpenClaw audit transcript。鏡像以每個工作階段為範圍（`copilot:${sessionId}`），並使用每則訊息的
identity（`${role}:${sha256_16(role,content)}`），因此重新發出先前回合項目時，會與現有 on-disk keys 碰撞且不會重複。

鏡像包在兩層失敗 containment 中，因此 transcript
寫入失敗不會使嘗試失敗：內部 best-effort wrapper，以及嘗試層級的 defense-in-depth `.catch(...)`。失敗會記錄，但不會浮出。

## 附帶問題 (`/btw`)

`/btw` 在此 harness 上**不是**原生功能。`createCopilotAgentHarness()`
會刻意讓 `harness.runSideQuestion` 保持未定義，因此 OpenClaw 的 `/btw`
dispatcher (`src/agents/btw.ts`) 會落到它對每個非 Codex runtime 使用的相同樹內 PI fallback
路徑：直接以簡短的 side-question prompt 呼叫已設定的模型 provider，並透過
`streamSimple` 串流回傳（沒有命令列介面 session，也沒有額外的 pool slot）。

這會讓 Copilot 命令列介面 session 保留給 agent 的主要 turn loop，並讓
`/btw` 行為與其他 PI-backed runtimes 完全相同。此 contract 會在
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
的 `describe("runSideQuestion")` 中斷言。

## Doctor

`extensions/copilot/doctor-contract-api.ts` 會由
`src/plugins/doctor-contract-registry.ts` 自動載入。它提供：

- 空的 `legacyConfigRules`（MVP 時沒有已退役欄位）。
- no-op 的 `normalizeCompatibilityConfig`（保留它，讓未來欄位退役時
  有穩定的樹內歸屬處）。
- 一個 `sessionRouteStateOwners` 項目，宣告 provider `github-copilot`；
  runtime `copilot`；命令列介面 session key `copilot`；auth profile
  prefix `github-copilot:`。

## 限制

- 此 harness 宣告 `github-copilot` 加上未被擁有的自訂 BYOK provider ids。
  manifest 擁有的原生 provider ids 仍會留在其所屬 runtime，即使
  `agentRuntime.id` 被強制設為 `copilot`。
- 此 harness 不提供終端介面；PI 的終端介面不受影響，並且仍是沒有 peer surface
  的任何 runtime 的 fallback。
- agent 切換到 `copilot` 時，不會遷移 PI session state。
  選擇是以每次 attempt 為單位；既有 PI sessions 仍然有效。
- `ask_user` 使用與 Codex harness 相同的 OpenClaw prompt-and-reply 路徑。
  當 Copilot SDK 要求使用者輸入時，OpenClaw 會向作用中的 channel/終端介面
  發送 blocking prompt，而下一則排入佇列的使用者訊息會解析該 SDK request。

## 權限與 ask_user

橋接 OpenClaw tools 的權限執行會發生在 **tool wrapper 內部**，
而不是透過 SDK 的 `onPermissionRequest` callback。PI 使用的相同
`wrapToolWithBeforeToolCallHook`
(`src/agents/pi-tools.before-tool-call.ts`) 會由
`createOpenClawCodingTools` 套用到每個 coding tool：loop detection、
trusted plugin policies、before-tool-call hooks，以及透過閘道
(`plugin.approval.request`) 執行的 two-phase plugin approvals，
都會使用與原生 PI attempts 完全相同的 code path 執行。

為了讓該 wrapper 擁有決策權，`convertOpenClawToolToSdkTool`
回傳的 SDK Tool 會標記為：

- `overridesBuiltInTool: true` — 取代 Copilot 命令列介面同名的 built-in
  tool（edit、read、write、bash、…），讓每次 tool invocation
  都路由回 OpenClaw。
- `skipPermission: true` — 告訴 SDK 在 invoking tool 前不要觸發
  `onPermissionRequest({kind: "custom-tool"})`。被包裝的 `execute()`
  會在內部執行更完整的 OpenClaw policy check；SDK-level prompt
  不是會繞過 OpenClaw 的 enforcement（若我們 allow-all），就是會阻擋每次 tool call
  （若我們 reject-all）— 兩者都不符合 PI parity。

樹內 codex harness 使用相同的分工：橋接的 OpenClaw tools
會被包裝 (`extensions/codex/src/app-server/dynamic-tools.ts`)，而
codex-app-server **自身**的原生 approval kinds
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) 會透過
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`) 路由。Copilot SDK
的對應做法 — 對任何到達 `onPermissionRequest` 的非 `custom-tool`
kind 使用 fail-closed `rejectAllPolicy` — 是相同的安全網，
而且實務上不會觸發，因為 `overridesBuiltInTool: true`
會取代每個 built-in。

為了讓 wrapped-tool layer 能做出與 PI 等效的 policy decisions，
harness 會將完整 PI attempt-tool context 轉發給
`createOpenClawCodingTools` — identity (`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …)、channel/routing
(`groupId`, `currentChannelId`, `replyToMode`, message-tool toggles)、
auth (`authProfileStore`)、run identity
（從 `sandboxSessionKey`、`runId` 衍生的
`sessionKey`/`runSessionKey`）、model context (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`)，以及 run hooks
(`onToolOutcome`, `onYield`)。若沒有這些欄位，owner-only allowlists
會靜默地表現為 deny-by-default，plugin-trust policies 無法解析到正確 scope，
而 `session_status: "current"` 會解析為過期的 sandbox key。bridge builder 位於
`extensions/copilot/src/tool-bridge.ts`，並對應 PI 在
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117` 的權威呼叫。
`runAttempt` 已經透過共用的 `resolveSandboxContext` seam 解析 sandbox context，
向 SDK 傳入有效 working directory，並將 `sandbox` 加上 subagent-spawn workspace
轉發到 tool bridge。bridge 也會轉發它能在 SDK boundary 執行的 bounded
tool-construction controls：`includeCoreTools`、runtime tool allowlist，
以及 `toolConstructionPlan`。

bridge 也會使用來自
`openclaw/plugin-sdk/agent-harness-tool-runtime` 的共用 harness tool-surface helper，
以達到 PI parity。啟用 tool-search 時，SDK 看到的是 compact control tools
加上 hidden catalog executor，而不是每個 OpenClaw tool schema。啟用 code mode
時，helper 會建構其他 agent harnesses 使用的相同 code-mode control surface
與 catalog lifecycle。Local-model lean defaults、runtime-compatible schema filtering、
directory hydration，以及 catalog cleanup 都留在共用 helper 中，避免 Copilot
與 Codex-adjacent harnesses 發生 drift。

### Session-level GitHub token

Copilot SDK contract 會區分 **client-level** GitHub token
（`CopilotClientOptions.gitHubToken`，用於驗證命令列介面 process 本身）
與 **session-level** token（`SessionConfig.gitHubToken`，決定該 session 的
content exclusion、model routing 與 quota，且在 `createSession` 與
`resumeSession` 都會被遵循）。harness 會透過 `resolveCopilotAuth`
解析一次 auth，並在 auth mode 為 `gitHubToken` 時設定兩個欄位
（明確的 `auth.gitHubToken`，或來自已設定 `github-copilot` auth profile
並由 contract 解析出的 `resolvedApiKey`）。當解析出的 mode 為
`useLoggedInUser` 時，會省略 session-level 欄位，讓 SDK 持續從已登入 identity
推導 identity。

`ask_user` 使用 `SessionConfig.onUserInputRequest`。bridge 會接受 fixed-choice
requests 的 choice indexes 或 labels，當 SDK request 允許時接受 free-form
answers，並在 OpenClaw attempt 被 aborted 時取消 pending request。

## 相關

- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [Agent harness plugins（SDK reference）](/zh-TW/plugins/sdk-agent-harness)

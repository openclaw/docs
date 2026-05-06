---
read_when:
    - 你正在實作擬議的公開 OpenClaw 應用程式 SDK
    - 你需要應用程式 SDK 的草稿命名空間、事件、結果、成品、核准或安全性契約
    - 你正在比較 Gateway 協定資源與高階 OpenClaw App SDK 包裝器
sidebarTitle: App SDK API design
summary: 公開 OpenClaw App SDK API、事件分類法、成品、核准與套件結構的參考設計
title: OpenClaw App SDK API 設計
x-i18n:
    generated_at: "2026-05-06T02:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca2d98914ab83c1752211489f9966ee62da13f7435781356548c0646f5739195
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

此頁是公開
[OpenClaw 應用程式 SDK](/zh-TW/concepts/openclaw-sdk) 的詳細 API 參考設計。它刻意與
[Plugin SDK](/zh-TW/plugins/sdk-overview) 分開。

<Note>
  `@openclaw/sdk` 是用於與 Gateway 通訊的外部應用程式／用戶端套件。
  `openclaw/plugin-sdk/*` 是行程內 Plugin 開發合約。
  只需要執行 agents 的應用程式，不應匯入 Plugin SDK 子路徑。
</Note>

公開應用程式 SDK 應分成兩層建構：

1. 低階產生式 Gateway 用戶端。
2. 高階易用包裝層，提供 `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval` 和 `Environment` 物件。

## 命名空間設計

低階命名空間應緊密對應 Gateway 資源：

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

高階包裝層應回傳物件，讓常見流程使用起來順手：

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## 事件合約

公開 SDK 應公開具版本、可重播、已正規化的事件。

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: unknown;
};
```

`id` 是重播游標。消費者應能使用 `events({ after: id })` 重新連線，並在保留期限允許時接收錯過的事件。

建議的正規化事件系列：

| 事件                  | 意義                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run 已接受。                                                |
| `run.queued`          | Run 正在等待 session lane、runtime 或 environment。         |
| `run.started`         | Runtime 已開始執行。                                       |
| `run.completed`       | Run 已成功完成。                                            |
| `run.failed`          | Run 因錯誤結束。                                            |
| `run.cancelled`       | Run 已取消。                                                |
| `run.timed_out`       | Run 超過其逾時限制。                                        |
| `assistant.delta`     | Assistant 文字增量。                                        |
| `assistant.message`   | 完整 assistant 訊息或替換內容。                             |
| `thinking.delta`      | 推理或計畫增量，於政策允許公開時使用。                      |
| `tool.call.started`   | Tool 呼叫已開始。                                           |
| `tool.call.delta`     | Tool 呼叫串流進度或部分輸出。                               |
| `tool.call.completed` | Tool 呼叫成功回傳。                                         |
| `tool.call.failed`    | Tool 呼叫失敗。                                             |
| `approval.requested`  | Run 或 tool 需要核准。                                      |
| `approval.resolved`   | 核准已授予、拒絕、到期或取消。                              |
| `question.requested`  | Runtime 向使用者或主機應用程式要求輸入。                    |
| `question.answered`   | 主機應用程式已提供答案。                                    |
| `artifact.created`    | 新 Artifact 可用。                                          |
| `artifact.updated`    | 現有 Artifact 已變更。                                      |
| `session.created`     | Session 已建立。                                            |
| `session.updated`     | Session metadata 已變更。                                   |
| `session.compacted`   | Session Compaction 已發生。                                 |
| `task.updated`        | 背景 task 狀態已變更。                                      |
| `git.branch`          | Runtime 觀察到或變更了 branch 狀態。                        |
| `git.diff`            | Runtime 產生或變更了 diff。                                 |
| `git.pr`              | Runtime 開啟、更新或連結了 pull request。                   |

Runtime 原生 payload 應可透過 `raw` 取得，但一般 UI 不應需要解析 `raw`。

## 結果合約

`Run.wait()` 應回傳穩定的結果封套：

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

結果應保持單純且穩定。時間戳值會保留 Gateway 的形狀，因此目前由 lifecycle 支援的 runs 通常會回報 epoch 毫秒數字，而 adapters 仍可能呈現 ISO 字串。豐富 UI、tool traces 與 runtime 原生細節應放在事件和 Artifacts 中。

`accepted` 是非終止的等待結果：它表示 Gateway 等待期限在 run 產生 lifecycle end/error 前已到期。不得將它視為 `timed_out`；`timed_out` 保留給超過自身 runtime timeout 的 run。

## 核准與問題

核准必須是一等概念，因為 coding agents 經常跨越安全邊界。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

核准事件應包含：

- approval id
- run id 和 session id
- request kind
- requested action summary
- tool name 或 environment action
- risk level
- available decisions
- expiration
- 決策是否可重複使用

問題與核准不同。問題是向使用者或主機應用程式要求資訊。核准是要求執行某項動作的權限。

## ToolSpace 模型

應用程式需要在不匯入 Plugin 內部實作的情況下理解 tool surface。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK 應公開：

- 正規化的 tool metadata
- 來源：OpenClaw、MCP、Plugin、channel、runtime 或 app
- schema 摘要
- approval policy
- runtime compatibility
- tool 是否為 hidden、readonly、write capable 或 host capable

透過 SDK 呼叫 tool 應是明確且有範圍限制的。大多數應用程式應執行 agents，而不是直接呼叫任意 tools。

## Artifact 模型

Artifacts 應涵蓋不只檔案。

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

常見範例：

- 檔案編輯和產生的檔案
- patch bundles
- VCS diffs
- screenshots 和 media outputs
- logs 和 trace bundles
- pull request links
- runtime trajectories
- managed environment workspace snapshots

Artifact 存取應支援遮罩、保留與下載 URL，而不假設每個 Artifact 都是一般本機檔案。

## 安全模型

應用程式 SDK 必須明確說明權限。

建議的 token scopes：

| 範圍                | 允許                                                |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | 列出並檢查 agents。                                 |
| `agent.run`         | 啟動 runs。                                         |
| `session.read`      | 讀取 session metadata 和 messages。                 |
| `session.write`     | 建立、傳送至、fork、compact 及 abort sessions。     |
| `task.read`         | 讀取背景 task 狀態。                                |
| `task.write`        | 取消或修改 task notification policy。               |
| `approval.respond`  | 核准或拒絕 requests。                               |
| `tools.invoke`      | 直接呼叫公開的 tools。                              |
| `artifacts.read`    | 列出並下載 Artifacts。                              |
| `environment.write` | 建立或銷毀 managed environments。                   |
| `admin`             | 管理作業。                                          |

預設值：

- 預設不轉送 secret
- 不允許不受限制的 environment variable pass-through
- 使用 secret references，而不是 secret values
- 明確的 sandbox 和 network policy
- 明確的 remote environment retention
- host execution 需要核准，除非 policy 證明無需核准
- raw runtime events 離開 Gateway 前會先遮罩，除非呼叫端具有更強的 diagnostic scope

## 受管理 environment provider

Managed agents 應實作為 environment providers。

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

第一個實作不必是 hosted SaaS。它可以目標既有 Node hosts、ephemeral workspaces、CI-style runners 或 Testbox-style environments。重要合約是：

1. 準備 workspace
2. 綁定安全的 environment 和 secrets
3. 啟動 run
4. 串流 events
5. 收集 Artifacts
6. 依 policy 清理或保留

一旦此合約穩定，hosted cloud service 就能實作相同的 provider contract。

## 套件結構

建議套件：

| 套件                    | 目的                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 公開高階 SDK 與產生式低階 Gateway 用戶端。                    |
| `@openclaw/sdk-react`   | 適用於 dashboards 和 app builders 的選用 React hooks。         |
| `@openclaw/sdk-testing` | 用於 app integrations 的測試輔助工具與 fake Gateway server。  |

Repo 已有供 Plugins 使用的 `openclaw/plugin-sdk/*`。請將該命名空間分開，以免混淆 Plugin 作者與應用程式開發者。

## 產生式用戶端策略

低階用戶端應從具版本的 Gateway protocol schemas 產生，再由手寫的易用 classes 包裝。

分層：

1. Gateway 結構描述的事實來源。
2. 產生的低階 TypeScript 用戶端。
3. 外部輸入與事件酬載的執行階段驗證器。
4. 高階 `OpenClaw`、`Agent`、`Session`、`Run`、`Task` 和 `Artifact`
   包裝器。
5. 實用範例和整合測試。

優點：

- 協定漂移可見
- 測試可以比較產生的方法與 Gateway 匯出項目
- App SDK 保持獨立於 Plugin SDK 內部
- 低階消費者仍可完整存取協定
- 高階消費者取得精簡的產品 API

## 相關文件

- [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [Agent 迴圈](/zh-TW/concepts/agent-loop)
- [Agent 執行階段](/zh-TW/concepts/agent-runtimes)
- [背景工作](/zh-TW/automation/tasks)
- [ACP agents](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

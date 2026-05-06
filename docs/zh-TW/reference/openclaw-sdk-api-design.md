---
read_when:
    - 你正在實作擬議的公開 OpenClaw 應用程式 SDK
    - 需要應用程式 SDK 的草稿命名空間、事件、結果、成品、核准或安全性合約
    - 你正在比較 Gateway 協定資源與高階 OpenClaw App SDK 包裝器
sidebarTitle: App SDK API design
summary: 公開 OpenClaw App SDK API、事件分類法、成品、核准與套件結構的參考設計
title: OpenClaw 應用程式 SDK API 設計
x-i18n:
    generated_at: "2026-05-06T09:18:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

此頁是公開
[OpenClaw 應用程式 SDK](/zh-TW/concepts/openclaw-sdk) 的詳細 API 參考設計。它刻意與
[Plugin SDK](/zh-TW/plugins/sdk-overview) 分開。

<Note>
  `@openclaw/sdk` 是外部應用程式/用戶端套件，用於與
  Gateway 通訊。`openclaw/plugin-sdk/*` 是行程內 Plugin 編寫合約。
  如果應用程式只需要執行代理，請不要匯入 Plugin SDK 子路徑。
</Note>

公開應用程式 SDK 應建構為兩層：

1. 低階的產生式 Gateway 用戶端。
2. 高階且符合人體工學的包裝器，包含 `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval` 與 `Environment` 物件。

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

高階包裝器應回傳讓常見流程更順手的物件：

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

公開 SDK 應公開具版本、可重播且已正規化的事件。

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

`id` 是重播游標。消費者應能使用
`events({ after: id })` 重新連線，並在保留期限允許時接收錯過的事件。

建議的正規化事件家族：

| 事件                  | 含義                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run 已接受。                                                |
| `run.queued`          | Run 正在等待 Session 通道、執行階段或環境。                 |
| `run.started`         | 執行階段開始執行。                                          |
| `run.completed`       | Run 成功完成。                                              |
| `run.failed`          | Run 因錯誤結束。                                            |
| `run.cancelled`       | Run 已取消。                                                |
| `run.timed_out`       | Run 超過其逾時限制。                                        |
| `assistant.delta`     | 助理文字增量。                                              |
| `assistant.message`   | 完整助理訊息或替換內容。                                    |
| `thinking.delta`      | 在政策允許公開時的推理或計畫增量。                          |
| `tool.call.started`   | 工具呼叫開始。                                              |
| `tool.call.delta`     | 工具呼叫串流進度或部分輸出。                                |
| `tool.call.completed` | 工具呼叫成功回傳。                                          |
| `tool.call.failed`    | 工具呼叫失敗。                                              |
| `approval.requested`  | Run 或工具需要核准。                                        |
| `approval.resolved`   | 核准已授予、拒絕、過期或取消。                              |
| `question.requested`  | 執行階段向使用者或主機應用程式要求輸入。                    |
| `question.answered`   | 主機應用程式提供了答案。                                    |
| `artifact.created`    | 新 artifact 可用。                                          |
| `artifact.updated`    | 既有 artifact 已變更。                                      |
| `session.created`     | Session 已建立。                                            |
| `session.updated`     | Session 中繼資料已變更。                                    |
| `session.compacted`   | Session Compaction 已發生。                                 |
| `task.updated`        | 背景工作狀態已變更。                                        |
| `git.branch`          | 執行階段觀察到或變更了分支狀態。                            |
| `git.diff`            | 執行階段產生或變更了 diff。                                 |
| `git.pr`              | 執行階段開啟、更新或連結了 pull request。                   |

執行階段原生 payload 應可透過 `raw` 取得，但應用程式在一般 UI 中不應
需要剖析 `raw`。

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

結果應保持平實且穩定。時間戳記值會保留 Gateway
形狀，因此目前由生命週期支援的 Run 通常會回報 epoch 毫秒
數字，而配接器仍可能呈現 ISO 字串。豐富 UI、工具追蹤和
執行階段原生細節應放在事件與 artifacts 中。

`accepted` 是非終止的等待結果：它表示 Gateway 等待期限
在 Run 產生生命週期結束/錯誤之前已到期。不得將其視為
`timed_out`；`timed_out` 保留給超過自身執行階段逾時限制的 Run。

## 核准與問題

核准必須是一級功能，因為程式碼代理會持續跨越安全邊界。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

核准事件應攜帶：

- 核准 ID
- Run ID 與 Session ID
- 請求種類
- 請求動作摘要
- 工具名稱或環境動作
- 風險等級
- 可用決策
- 到期時間
- 該決策是否可重複使用

問題與核准是分開的。問題會向使用者或主機應用程式詢問資訊。
核准會要求執行某個動作的權限。

## ToolSpace 模型

應用程式需要了解工具介面，而不必匯入 Plugin 內部實作。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK 應公開：

- 正規化的工具中繼資料
- 來源：OpenClaw、MCP、Plugin、頻道、執行階段或應用程式
- 結構描述摘要
- 核准政策
- 執行階段相容性
- 工具是否為隱藏、唯讀、具備寫入能力或具備主機能力

透過 SDK 呼叫工具應該明確且有範圍限制。大多數應用程式應該
執行代理，而不是直接呼叫任意工具。

## 成品模型

成品應涵蓋檔案以外的內容。

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

- 檔案編輯與產生的檔案
- 修補程式套件
- VCS 差異
- 截圖與媒體輸出
- 記錄與追蹤套件
- pull request 連結
- 執行階段軌跡
- 受管理環境的工作區快照

成品存取應支援遮蔽、保留與下載 URL，而不假設
每個成品都是一般本機檔案。

## 安全模型

應用程式 SDK 必須明確定義權限。

建議的 Token 範圍：

| 範圍                | 允許的操作                                            |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | 列出並檢視代理。                                    |
| `agent.run`         | 啟動執行。                                          |
| `session.read`      | 讀取工作階段中繼資料與訊息。                        |
| `session.write`     | 建立、傳送至、分支、壓縮與中止工作階段。            |
| `task.read`         | 讀取背景工作狀態。                                  |
| `task.write`        | 取消或修改工作通知政策。                            |
| `approval.respond`  | 核准或拒絕請求。                                    |
| `tools.invoke`      | 直接呼叫已公開的工具。                              |
| `artifacts.read`    | 列出並下載成品。                                    |
| `environment.write` | 建立或銷毀受管理環境。                              |
| `admin`             | 管理操作。                                          |

預設值：

- 預設不轉送密鑰
- 不允許不受限制的環境變數直通
- 使用密鑰參照，而非密鑰值
- 明確的沙箱與網路政策
- 明確的遠端環境保留政策
- 除非政策證明不需要，否則主機執行需要核准
- 原始執行階段事件在離開 Gateway 前會先遮蔽，除非呼叫端具有
  更強的診斷範圍

## 受管理環境提供者

受管理代理應實作為環境提供者。

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

第一個實作不需要是託管 SaaS。它可以目標設為
現有 Node 主機、暫時性工作區、CI 風格執行器或 Testbox 風格
環境。重要的合約是：

1. 準備工作區
2. 繫結安全的環境與密鑰
3. 啟動執行
4. 串流事件
5. 收集成品
6. 依政策清理或保留

一旦這項機制穩定，託管雲端服務即可實作相同的提供者
合約。

## 套件結構

建議套件：

| 套件                    | 用途                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 公開高階 SDK 與產生的低階 Gateway 用戶端。                   |
| `@openclaw/sdk-react`   | 適用於儀表板與應用程式建構者的選用 React hooks。             |
| `@openclaw/sdk-testing` | 適用於應用程式整合的測試輔助工具與假 Gateway 伺服器。        |

此 repo 已有供 Plugin 使用的 `openclaw/plugin-sdk/*`。請保持該命名空間
分離，以避免讓 Plugin 作者與應用程式開發者混淆。

## 產生用戶端策略

低階用戶端應由版本化 Gateway 協定
結構描述產生，然後由手寫的人體工學類別包裝。

分層：

1. Gateway 結構描述的單一事實來源。
2. 產生的低階 TypeScript 用戶端。
3. 用於外部輸入與事件承載資料的執行階段驗證器。
4. 高階 `OpenClaw`、`Agent`、`Session`、`Run`、`Task` 和 `Artifact`
   包裝器。
5. 教學範例與整合測試。

優點：

- 協定漂移清晰可見
- 測試可以比較產生的方法與 Gateway 匯出項目
- App SDK 保持獨立於 Plugin SDK 內部實作
- 低階消費者仍可完整存取協定
- 高階消費者可取得精簡的產品 API

## 相關

- [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [代理迴圈](/zh-TW/concepts/agent-loop)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [背景工作](/zh-TW/automation/tasks)
- [ACP 代理](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

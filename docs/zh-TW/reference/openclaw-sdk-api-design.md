---
read_when:
    - 您正在實作擬議的公開 OpenClaw 應用程式 SDK
    - 你需要應用程式 SDK 的草案命名空間、事件、結果、產物、核准或安全性合約
    - 您正在比較 Gateway 協定資源與高階 OpenClaw App SDK 包裝器
sidebarTitle: App SDK API design
summary: 公開 OpenClaw App SDK API、事件分類法、產物、核准與套件結構的參考設計
title: OpenClaw 應用程式 SDK API 設計
x-i18n:
    generated_at: "2026-05-10T19:50:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

此頁面是公用 [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk) 的詳細 API 參考設計。它刻意與 [Plugin SDK](/zh-TW/plugins/sdk-overview) 分開。

<Note>
  `@openclaw/sdk` 是用於與 Gateway 通訊的外部應用程式／用戶端套件。`openclaw/plugin-sdk/*` 是進程內 Plugin 作者合約。
  如果應用程式只需要執行代理，請勿從中匯入 Plugin SDK 子路徑。
</Note>

公用 App SDK 應建構為兩層：

1. 低階產生式 Gateway 用戶端。
2. 高階易用包裝器，包含 `OpenClaw`、`Agent`、`Session`、`Run`、
   `Task`、`Artifact`、`Approval` 和 `Environment` 物件。

## 命名空間設計

低階命名空間應緊密遵循 Gateway 資源：

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

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
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

高階包裝器應回傳能讓常見流程更順手的物件：

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

公用 SDK 應公開有版本、可重播、標準化的事件。

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

`id` 是重播游標。消費者應能使用 `events({ after: id })` 重新連線，並在保留期限允許時接收遺漏的事件。

建議的標準化事件系列：

| 事件                  | 意義                                                        |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | 執行已接受。                                                |
| `run.queued`          | 執行正在等待工作階段通道、執行階段或環境。                  |
| `run.started`         | 執行階段已開始執行。                                        |
| `run.completed`       | 執行已成功完成。                                            |
| `run.failed`          | 執行因錯誤而結束。                                          |
| `run.cancelled`       | 執行已取消。                                                |
| `run.timed_out`       | 執行超過其逾時限制。                                        |
| `assistant.delta`     | 助理文字增量。                                              |
| `assistant.message`   | 完整助理訊息或替換內容。                                    |
| `thinking.delta`      | 推理或計畫增量，當政策允許曝光時。                          |
| `tool.call.started`   | 工具呼叫已開始。                                            |
| `tool.call.delta`     | 工具呼叫串流進度或部分輸出。                                |
| `tool.call.completed` | 工具呼叫成功回傳。                                          |
| `tool.call.failed`    | 工具呼叫失敗。                                              |
| `approval.requested`  | 某次執行或工具需要核准。                                    |
| `approval.resolved`   | 核准已授予、拒絕、過期或取消。                              |
| `question.requested`  | 執行階段要求使用者或主機應用程式提供輸入。                  |
| `question.answered`   | 主機應用程式已提供答案。                                    |
| `artifact.created`    | 新成品可用。                                                |
| `artifact.updated`    | 既有成品已變更。                                            |
| `session.created`     | 工作階段已建立。                                            |
| `session.updated`     | 工作階段中繼資料已變更。                                    |
| `session.compacted`   | 工作階段 Compaction 已發生。                                |
| `task.updated`        | 背景任務狀態已變更。                                        |
| `git.branch`          | 執行階段觀察到或變更了分支狀態。                            |
| `git.diff`            | 執行階段產生或變更了差異。                                  |
| `git.pr`              | 執行階段開啟、更新或連結了拉取請求。                        |

執行階段原生酬載應可透過 `raw` 取得，但應用程式不應需要為了一般 UI 解析 `raw`。

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

結果應平實且穩定。時間戳值會保留 Gateway 形狀，因此目前由生命週期支援的執行通常會回報 Epoch 毫秒數字，而配接器仍可能呈現 ISO 字串。豐富 UI、工具追蹤和執行階段原生細節應放在事件與成品中。

`accepted` 是非終止的等待結果：它表示 Gateway 等待期限在執行產生生命週期結束／錯誤之前已到期。不得將它視為 `timed_out`；`timed_out` 保留給超過自身執行階段逾時限制的執行。

## 核准與問題

核准必須是一級功能，因為程式碼代理會不斷跨越安全邊界。

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
- 執行 ID 和工作階段 ID
- 請求類型
- 請求動作摘要
- 工具名稱或環境動作
- 風險等級
- 可用決策
- 到期時間
- 該決策是否可重複使用

問題與核准是分開的。問題是向使用者或主機應用程式詢問資訊。核准是請求執行某個動作的權限。

## ToolSpace 模型

應用程式需要在不匯入 Plugin 內部實作的情況下理解工具介面。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK 應公開：

- 標準化工具中繼資料
- 來源：OpenClaw、MCP、Plugin、通道、執行階段或應用程式
- 結構描述摘要
- 核准政策
- 執行階段相容性
- 工具是否隱藏、唯讀、可寫入或具備主機能力

透過 SDK 呼叫工具應明確且有範圍。大多數應用程式應執行代理，而不是直接呼叫任意工具。

## 成品模型

成品應涵蓋的不只是檔案。

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
- 修補程式套件
- VCS 差異
- 螢幕截圖和媒體輸出
- 日誌和追蹤套件
- 拉取請求連結
- 執行階段軌跡
- 受管理環境工作區快照

成品存取應支援遮蔽、保留和下載 URL，而不假設每個成品都是一般本機檔案。

## 安全模型

App SDK 必須明確說明權限。

建議的權杖範圍：

| 範圍                | 允許                                                |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | 列出和檢查代理。                                    |
| `agent.run`         | 啟動執行。                                          |
| `session.read`      | 讀取工作階段中繼資料和訊息。                        |
| `session.write`     | 建立、傳送至、分岔、Compaction 和中止工作階段。     |
| `task.read`         | 讀取背景任務狀態。                                  |
| `task.write`        | 取消或修改任務通知政策。                            |
| `approval.respond`  | 核准或拒絕請求。                                    |
| `tools.invoke`      | 直接呼叫公開的工具。                                |
| `artifacts.read`    | 列出和下載成品。                                    |
| `environment.write` | 建立或銷毀受管理環境。                              |
| `admin`             | 管理作業。                                          |

預設值：

- 預設不轉送祕密
- 不允許無限制的環境變數直通
- 使用祕密參照而非祕密值
- 明確的沙箱和網路政策
- 明確的遠端環境保留
- 主機執行需要核准，除非政策可證明不需要
- 原始執行階段事件在離開 Gateway 前會先遮蔽，除非呼叫者具備更強的診斷範圍

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

第一個實作不需要是託管 SaaS。它可以針對既有 Node 主機、暫時性工作區、CI 風格執行器，或 Testbox 風格環境。重要合約是：

1. 準備工作區
2. 綁定安全環境與祕密
3. 啟動執行
4. 串流事件
5. 收集成品
6. 依政策清理或保留

一旦這變得穩定，託管雲端服務即可實作相同的提供者合約。

## 套件結構

建議套件：

| 套件                    | 用途                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 公用高階 SDK 和產生式低階 Gateway 用戶端。                    |
| `@openclaw/sdk-react`   | 適用於儀表板和應用程式建構者的選用 React hooks。              |
| `@openclaw/sdk-testing` | 應用程式整合用的測試輔助工具和假 Gateway 伺服器。             |

此存放庫已為 Plugins 提供 `openclaw/plugin-sdk/*`。請保持該命名空間分離，以避免混淆 Plugin 作者與應用程式開發者。

## 產生式用戶端策略

低階用戶端應從有版本的 Gateway 協定結構描述產生，然後由手寫的易用類別包裝。

分層：

1. Gateway 結構描述的權威來源。
2. 產生的低階 TypeScript 用戶端。
3. 外部輸入與事件 payload 的執行階段驗證器。
4. 高階 `OpenClaw`、`Agent`、`Session`、`Run`、`Task` 和 `Artifact`
   包裝器。
5. Cookbook 範例與整合測試。

優點：

- protocol drift 清楚可見
- 測試可將產生的方法與 Gateway 匯出進行比較
- App SDK 保持獨立於 Plugin SDK 內部
- 低階使用者仍可完整存取協定
- 高階使用者可取得精簡的產品 API

## 相關

- [OpenClaw App SDK](/zh-TW/concepts/openclaw-sdk)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)
- [背景工作](/zh-TW/automation/tasks)
- [ACP 代理程式](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

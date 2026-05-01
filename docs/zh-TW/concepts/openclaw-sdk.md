---
read_when:
    - 你正在建置一個與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 作業或 IDE 擴充功能
    - 您正在 App SDK 與 Plugin SDK 之間做選擇
    - 您正在整合 Gateway 代理程式執行、工作階段、事件、核准、模型或工具
sidebarTitle: App SDK
summary: 公開的 OpenClaw App SDK，適用於外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能
title: OpenClaw 應用程式軟體開發套件
x-i18n:
    generated_at: "2026-05-01T02:44:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** 是供 OpenClaw 行程外部應用程式使用的公開用戶端 API。當指令碼、儀表板、CI 工作、IDE 擴充功能或其他外部應用程式想要連線到 Gateway、啟動 agent 執行、串流事件、等待結果、取消工作，或檢視 Gateway 資源時，請使用 `@openclaw/sdk`。

<Note>
  App SDK 不同於 [Plugin SDK](/zh-TW/plugins/sdk-overview)。
  `@openclaw/sdk` 會從 OpenClaw 外部與 Gateway 通訊。
  `openclaw/plugin-sdk/*` 僅供在 OpenClaw 內部執行，並註冊提供者、頻道、工具、hook 或受信任執行階段的 plugins 使用。
</Note>

## 目前提供的內容

`@openclaw/sdk` 目前提供：

| 介面                      | 狀態    | 功能                                                                         |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | 就緒    | 主要用戶端進入點。負責傳輸、連線、請求與事件。                              |
| `GatewayClientTransport`  | 就緒    | 由 Gateway 用戶端支援的 WebSocket 傳輸。                                     |
| `oc.agents`               | 就緒    | 列出、建立、更新、刪除與取得 agent handle。                                  |
| `Agent.run()`             | 就緒    | 啟動 Gateway `agent` 執行並傳回 `Run`。                                      |
| `oc.runs`                 | 就緒    | 建立、取得、等待、取消與串流執行。                                           |
| `Run.events()`            | 就緒    | 串流已正規化的每次執行事件，並支援快速執行的重播。                          |
| `Run.wait()`              | 就緒    | 呼叫 `agent.wait` 並傳回穩定的 `RunResult`。                                 |
| `Run.cancel()`            | 就緒    | 依 run id 呼叫 `sessions.abort`，可用時會帶上 session key。                  |
| `oc.sessions`             | 就緒    | 建立、解析、傳送至、修補、壓縮與取得 session handle。                        |
| `Session.send()`          | 就緒    | 呼叫 `sessions.send` 並傳回 `Run`。                                          |
| `oc.models`               | 就緒    | 呼叫 `models.list` 與目前的 `models.authStatus` 狀態 RPC。                   |
| `oc.tools`                | 部分    | 列出工具目錄與有效工具；尚未接上直接工具呼叫。                               |
| `oc.artifacts`            | 就緒    | 列出、取得與下載 Gateway transcript artifact。                               |
| `oc.approvals`            | 就緒    | 透過 Gateway approval RPC 列出並解析 exec approval。                         |
| `oc.rawEvents()`          | 就緒    | 向進階消費者公開原始 Gateway 事件。                                          |
| `normalizeGatewayEvent()` | 就緒    | 將原始 Gateway 事件轉換為穩定的 SDK 事件形狀。                               |

SDK 也匯出這些介面使用的核心型別：
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`，以及相關的結果型別。

## 連線到 Gateway

使用明確的 Gateway URL 建立用戶端，或為測試與嵌入式應用程式執行階段注入自訂傳輸。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` 等同於 `url`。建構函式接受 `gateway: "auto"` 選項，但自動 Gateway 探索尚不是獨立的 SDK 功能；當應用程式尚不知道如何探索 Gateway 時，請傳入 `url`。

測試時，傳入實作 `OpenClawTransport` 的物件：

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## 執行 Agent

當應用程式想要 agent handle 時，使用 `oc.agents.get(id)`，然後呼叫 `agent.run()`。

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

像 `openai/gpt-5.5` 這樣含提供者限定的模型參照，會拆成 Gateway `provider` 與 `model` 覆寫。`timeoutMs` 在 SDK 中維持毫秒，並會為 `agent` RPC 轉換成 Gateway timeout 秒數。

`run.wait()` 使用 Gateway `agent.wait` RPC。若等待期限到期時執行仍在進行中，會傳回 `status: "accepted"`，而不是假裝執行本身已逾時。執行階段逾時、中止的執行，以及取消的執行都會正規化為 `timed_out` 或 `cancelled`。

## 建立並重用 Sessions

當應用程式需要持久的 transcript 狀態時，請使用 sessions。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` 會呼叫 `sessions.send` 並傳回 `Run`。Session handle 也支援：

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## 串流事件

SDK 會將原始 Gateway 事件正規化為穩定的 `OpenClawEvent` 封套：

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
  raw?: GatewayEvent;
};
```

常見事件類型包括：

| 事件類型              | 來源 Gateway 事件                         |
| --------------------- | ------------------------------------------ |
| `run.started`         | `agent` 生命週期開始                      |
| `run.completed`       | `agent` 生命週期結束                      |
| `run.failed`          | `agent` 生命週期錯誤                      |
| `run.cancelled`       | 已中止/已取消的生命週期結束               |
| `run.timed_out`       | 逾時生命週期結束                          |
| `assistant.delta`     | Assistant 串流 delta                       |
| `assistant.message`   | Assistant 訊息                             |
| `thinking.delta`      | 思考或計畫串流                            |
| `tool.call.started`   | 工具/項目/命令開始                        |
| `tool.call.delta`     | 工具/項目/命令更新                        |
| `tool.call.completed` | 工具/項目/命令完成                        |
| `tool.call.failed`    | 工具/項目/命令失敗或被封鎖狀態            |
| `approval.requested`  | Exec 或 plugin approval 請求               |
| `approval.resolved`   | Exec 或 plugin approval 解析               |
| `session.created`     | `sessions.changed` 建立                    |
| `session.updated`     | `sessions.changed` 更新                    |
| `session.compacted`   | `sessions.changed` Compaction              |
| `task.updated`        | Task 更新事件                              |
| `artifact.updated`    | Patch 串流事件                             |
| `raw`                 | 尚無穩定 SDK 對應的任何事件                |

`Run.events()` 會將事件篩選為單一 run id，並為快速執行重播已看過的事件。這代表文件化的流程是安全的：

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

若要使用應用程式範圍的串流，請使用 `oc.events()`。若要使用原始 Gateway frame，請使用 `oc.rawEvents()`。

## Models、工具、Artifacts 與 Approvals

模型輔助函式會對應到目前的 Gateway 方法：

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

工具輔助函式會公開 Gateway 目錄與有效工具檢視：

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Artifact 輔助函式會公開適用於 session、run 或 task 情境的 Gateway artifact 投影。每次呼叫都需要一個明確的 `sessionKey`、`runId` 或 `taskId` 範圍：

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Approval 輔助函式使用 exec approval RPC：

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 目前明確不支援

SDK 包含我們想要的產品模型名稱，但不會默默假裝 Gateway RPC 存在。以下呼叫目前會擲出明確的不支援錯誤：

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

每次執行的 `workspace`、`runtime`、`environment` 與 `approvals` 欄位已依未來形狀建立型別，但目前 Gateway 不支援在 `agent` RPC 上使用這些覆寫。如果呼叫者傳入這些欄位，SDK 會在提交執行前擲出錯誤，避免工作意外以預設 workspace、runtime、environment 或 approval 行為執行。

## App SDK 與 Plugin SDK

當程式碼位於 OpenClaw 外部時，請使用 App SDK：

- 啟動或觀察 agent 執行的 Node 指令碼
- 呼叫 Gateway 的 CI 工作
- 儀表板與管理面板
- IDE 擴充功能
- 不需要成為頻道 plugins 的外部橋接
- 搭配假或真實 Gateway 傳輸的整合測試

當程式碼在 OpenClaw 內部執行時，請使用 Plugin SDK：

- provider plugins
- channel plugins
- 工具或生命週期 hooks
- agent harness plugins
- 受信任的執行階段輔助函式

App SDK 程式碼應從 `@openclaw/sdk` 匯入。Plugin 程式碼應從文件化的 `openclaw/plugin-sdk/*` 子路徑匯入。請勿混用這兩份合約。

## 相關文件

- [OpenClaw App SDK API 設計](/zh-TW/reference/openclaw-sdk-api-design)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [Agent 迴圈](/zh-TW/concepts/agent-loop)
- [Agent 執行階段](/zh-TW/concepts/agent-runtimes)
- [Sessions](/zh-TW/concepts/session)
- [背景 tasks](/zh-TW/automation/tasks)
- [ACP agents](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

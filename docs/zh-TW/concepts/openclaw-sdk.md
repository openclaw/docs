---
read_when:
    - 你正在建置與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 作業或 IDE 擴充功能
    - 您正在 App SDK 與 Plugin SDK 之間做選擇
    - 你正在整合 Gateway agent runs、sessions、events、approvals、models 或 tools
sidebarTitle: App SDK
summary: 公開 OpenClaw App SDK，用於外部應用程式、指令碼、儀表板、CI 作業和 IDE 擴充功能
title: OpenClaw 應用程式 SDK
x-i18n:
    generated_at: "2026-05-06T09:07:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** 是供 OpenClaw 程序外部 App 使用的公開用戶端 API。當腳本、儀表板、CI 作業、IDE 擴充功能，或其他外部 App 想要連線到 Gateway、啟動代理執行、串流事件、等待結果、取消工作，或檢查 Gateway 資源時，請使用 `@openclaw/sdk`。

<Note>
  App SDK 不同於 [Plugin SDK](/zh-TW/plugins/sdk-overview)。
  `@openclaw/sdk` 會從 OpenClaw 外部與 Gateway 通訊。
  `openclaw/plugin-sdk/*` 只適用於在 OpenClaw 內部執行，並註冊提供者、通道、工具、掛鉤或受信任執行階段的 plugins。
</Note>

## 目前提供的內容

`@openclaw/sdk` 目前提供：

| 介面                      | 狀態    | 功能                                                                              |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | 就緒    | 主要用戶端入口點。管理傳輸、連線、請求和事件。                                  |
| `GatewayClientTransport`  | 就緒    | 由 Gateway 用戶端支援的 WebSocket 傳輸。                                         |
| `oc.agents`               | 就緒    | 列出、建立、更新、刪除並取得代理控制代碼。                                      |
| `Agent.run()`             | 就緒    | 啟動 Gateway `agent` 執行並傳回 `Run`。                                          |
| `oc.runs`                 | 就緒    | 建立、取得、等待、取消並串流執行。                                              |
| `Run.events()`            | 就緒    | 串流已正規化的單次執行事件，並為快速執行提供重播。                              |
| `Run.wait()`              | 就緒    | 呼叫 `agent.wait` 並傳回穩定的 `RunResult`。                                     |
| `Run.cancel()`            | 就緒    | 依執行 id 呼叫 `sessions.abort`，可用時附帶工作階段金鑰。                       |
| `oc.sessions`             | 就緒    | 建立、解析、傳送至、修補、壓縮並取得工作階段控制代碼。                          |
| `Session.send()`          | 就緒    | 呼叫 `sessions.send` 並傳回 `Run`。                                              |
| `oc.models`               | 就緒    | 呼叫 `models.list` 和目前的 `models.authStatus` 狀態 RPC。                       |
| `oc.tools`                | 就緒    | 透過政策管線列出、限定範圍並叫用 Gateway 工具。                                 |
| `oc.artifacts`            | 就緒    | 列出、取得並下載 Gateway 轉錄成品。                                             |
| `oc.approvals`            | 就緒    | 透過 Gateway 核准 RPC 列出並解析 exec 核准。                                    |
| `oc.environments`         | 部分    | 列出 Gateway 本機和 node 環境候選項；建立/刪除尚未接線。                       |
| `oc.rawEvents()`          | 就緒    | 為進階消費者公開原始 Gateway 事件。                                             |
| `normalizeGatewayEvent()` | 就緒    | 將原始 Gateway 事件轉換為穩定的 SDK 事件形狀。                                  |

SDK 也匯出這些介面使用的核心型別：
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`ArtifactSummary`、`ArtifactQuery`、`ArtifactsListResult`、
`ArtifactsGetResult`、`ArtifactsDownloadResult`、`RuntimeSelection`、
`EnvironmentSelection`、`WorkspaceSelection`、`ApprovalMode`，以及相關的結果型別。

## 連線到 Gateway

使用明確的 Gateway URL 建立用戶端，或為測試與嵌入式 App 執行階段注入自訂傳輸。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` 等同於 `url`。建構函式接受 `gateway: "auto"` 選項，但自動 Gateway 探索尚未作為獨立 SDK 功能提供；當 App 尚不知道如何探索 Gateway 時，請傳入 `url`。

對於測試，請傳入實作 `OpenClawTransport` 的物件：

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

## 執行代理

當 App 需要代理控制代碼時，使用 `oc.agents.get(id)`，然後呼叫 `agent.run()`。

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

提供者限定的模型參照，例如 `openai/gpt-5.5`，會被拆分為 Gateway `provider` 和 `model` 覆寫。`timeoutMs` 在 SDK 中保持毫秒，並為 `agent` RPC 轉換為 Gateway 逾時秒數。

`run.wait()` 使用 Gateway `agent.wait` RPC。當等待期限到期但執行仍在作用中時，會傳回 `status: "accepted"`，而不是假裝執行本身逾時。執行階段逾時、已中止的執行和已取消的執行會正規化為 `timed_out` 或 `cancelled`。

## 建立並重用工作階段

當 App 需要持久的轉錄狀態時，請使用工作階段。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` 會呼叫 `sessions.send` 並傳回 `Run`。工作階段控制代碼也支援：

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

| 事件類型              | 來源 Gateway 事件                          |
| --------------------- | ------------------------------------------- |
| `run.started`         | `agent` 生命週期開始                       |
| `run.completed`       | `agent` 生命週期結束                       |
| `run.failed`          | `agent` 生命週期錯誤                       |
| `run.cancelled`       | 已中止/已取消的生命週期結束                |
| `run.timed_out`       | 逾時生命週期結束                           |
| `assistant.delta`     | Assistant 串流 delta                       |
| `assistant.message`   | Assistant 訊息                             |
| `thinking.delta`      | 思考或計畫串流                             |
| `tool.call.started`   | 工具/項目/命令開始                         |
| `tool.call.delta`     | 工具/項目/命令更新                         |
| `tool.call.completed` | 工具/項目/命令完成                         |
| `tool.call.failed`    | 工具/項目/命令失敗或遭封鎖狀態             |
| `approval.requested`  | Exec 或 plugin 核准請求                    |
| `approval.resolved`   | Exec 或 plugin 核准解析                    |
| `session.created`     | `sessions.changed` 建立                    |
| `session.updated`     | `sessions.changed` 更新                    |
| `session.compacted`   | `sessions.changed` compaction              |
| `task.updated`        | 任務更新事件                               |
| `artifact.updated`    | 修補串流事件                               |
| `raw`                 | 任何尚未有穩定 SDK 對應的事件              |

`Run.events()` 會將事件篩選到單一執行 id，並為快速執行重播已看過的事件。這表示文件化流程是安全的：

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

對於 App 範圍的串流，使用 `oc.events()`。對於原始 Gateway 框架，使用 `oc.rawEvents()`。

## 模型、工具、成品和核准

模型輔助函式會對應到目前的 Gateway 方法：

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

工具輔助函式會公開 Gateway 目錄、有效工具檢視，以及直接的 Gateway 工具叫用。`oc.tools.invoke()` 會傳回型別化封套，而不是因政策或核准拒絕而擲出錯誤。

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

成品輔助函式會公開用於工作階段、執行或任務內容的 Gateway 成品投影。每次呼叫都需要一個明確的 `sessionKey`、`runId` 或 `taskId` 範圍：

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

核准輔助函式使用 exec 核准 RPC：

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

環境輔助函式公開唯讀的 Gateway 本機和 node 探索：

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## 目前明確不支援

SDK 包含我們想要的產品模型名稱，但不會默默假裝 Gateway RPC 存在。這些呼叫目前會擲出明確的不支援錯誤：

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

單次執行的 `workspace`、`runtime`、`environment` 和 `approvals` 欄位已依未來形狀提供型別，但目前 Gateway 不支援在 `agent` RPC 上使用這些覆寫。如果呼叫端傳入它們，SDK 會在提交執行前擲出錯誤，避免工作意外以預設 workspace、runtime、environment 或 approval 行為執行。

## App SDK 與 Plugin SDK

當程式碼位於 OpenClaw 外部時，使用 App SDK：

- 啟動或觀察代理執行的 Node 腳本
- 呼叫 Gateway 的 CI 作業
- 儀表板和管理面板
- IDE 擴充功能
- 不需要成為通道 plugins 的外部橋接
- 使用假或真實 Gateway 傳輸的整合測試

當程式碼在 OpenClaw 內部執行時，使用 Plugin SDK：

- 提供者 plugins
- 通道 plugins
- 工具或生命週期掛鉤
- 代理測試框架 plugins
- 受信任的執行階段輔助函式

App SDK 程式碼應從 `@openclaw/sdk` 匯入。Plugin 程式碼應從文件化的 `openclaw/plugin-sdk/*` 子路徑匯入。請勿混用這兩個合約。

## 相關

- [OpenClaw App SDK API 設計](/zh-TW/reference/openclaw-sdk-api-design)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [代理迴圈](/zh-TW/concepts/agent-loop)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)
- [工作階段](/zh-TW/concepts/session)
- [背景任務](/zh-TW/automation/tasks)
- [ACP 代理](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

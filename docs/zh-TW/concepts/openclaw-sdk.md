---
read_when:
    - 你正在建置與 OpenClaw 通訊的外部應用程式、指令碼、儀表板、CI 作業或 IDE 擴充功能
    - 你正在應用程式 SDK 和 Plugin SDK 之間做選擇
    - 你正在整合 Gateway 的代理執行、工作階段、事件、核准、模型或工具
sidebarTitle: App SDK
summary: 適用於外部應用程式、指令碼、儀表板、CI 作業與 IDE 擴充功能的公開 OpenClaw 應用程式 SDK
title: OpenClaw 應用程式 SDK
x-i18n:
    generated_at: "2026-05-06T02:46:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34dd672711197e6070b4efdc082e019b2fc551ea88fc2de83a67b1367807931c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

OpenClaw **App SDK** 是供 OpenClaw 行程外部應用程式使用的公開用戶端 API。當腳本、儀表板、CI 作業、IDE 擴充功能或其他外部應用程式想要連線到 Gateway、啟動 agent 執行、串流事件、等待結果、取消工作，或檢查 Gateway 資源時，請使用 `@openclaw/sdk`。

<Note>
  App SDK 不同於 [Plugin SDK](/zh-TW/plugins/sdk-overview)。
  `@openclaw/sdk` 會從 OpenClaw 外部與 Gateway 通訊。
  `openclaw/plugin-sdk/*` 僅供在 OpenClaw 內部執行，並註冊 provider、channel、tool、hook 或受信任 runtime 的 plugins 使用。
</Note>

## 目前提供內容

`@openclaw/sdk` 提供：

| 介面                      | 狀態       | 功能                                                                              |
| ------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | 就緒       | 主要用戶端進入點。負責 transport、連線、請求與事件。                             |
| `GatewayClientTransport`  | 就緒       | 由 Gateway 用戶端支援的 WebSocket transport。                                     |
| `oc.agents`               | 就緒       | 列出、建立、更新、刪除及取得 agent handle。                                      |
| `Agent.run()`             | 就緒       | 啟動 Gateway `agent` 執行並傳回 `Run`。                                           |
| `oc.runs`                 | 就緒       | 建立、取得、等待、取消及串流 runs。                                               |
| `Run.events()`            | 就緒       | 串流已正規化的單次執行事件，並支援快速執行的重播。                               |
| `Run.wait()`              | 就緒       | 呼叫 `agent.wait` 並傳回穩定的 `RunResult`。                                      |
| `Run.cancel()`            | 就緒       | 依 run id 呼叫 `sessions.abort`，可用時會帶上 session key。                       |
| `oc.sessions`             | 就緒       | 建立、解析、傳送至、修補、壓縮及取得 session handle。                            |
| `Session.send()`          | 就緒       | 呼叫 `sessions.send` 並傳回 `Run`。                                               |
| `oc.models`               | 就緒       | 呼叫 `models.list` 與目前的 `models.authStatus` 狀態 RPC。                        |
| `oc.tools`                | 就緒       | 透過 policy pipeline 列出、限定範圍及叫用 Gateway tools。                         |
| `oc.artifacts`            | 就緒       | 列出、取得及下載 Gateway transcript artifacts。                                   |
| `oc.approvals`            | 就緒       | 透過 Gateway approval RPC 列出並解析 exec approvals。                             |
| `oc.environments`         | 部分支援   | 列出 Gateway 本機與 node environment candidates；create/delete 尚未接線。          |
| `oc.rawEvents()`          | 就緒       | 對進階使用者公開原始 Gateway 事件。                                               |
| `normalizeGatewayEvent()` | 就緒       | 將原始 Gateway 事件轉換為穩定的 SDK 事件形狀。                                   |

SDK 也會匯出這些介面使用的核心型別：
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`ArtifactSummary`、`ArtifactQuery`、`ArtifactsListResult`、
`ArtifactsGetResult`、`ArtifactsDownloadResult`、`RuntimeSelection`、
`EnvironmentSelection`、`WorkspaceSelection`、`ApprovalMode`，以及相關的
result types。

## 連線到 Gateway

使用明確的 Gateway URL 建立用戶端，或為測試與嵌入式應用程式 runtime 注入自訂 transport。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` 等同於 `url`。建構函式接受
`gateway: "auto"` 選項，但自動 Gateway 探索尚未是獨立的 SDK 功能；當應用程式尚不知道如何探索 Gateway 時，請傳入 `url`。

測試時，請傳入實作 `OpenClawTransport` 的物件：

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

當應用程式需要 agent handle 時，使用 `oc.agents.get(id)`，然後呼叫
`agent.run()`。

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

像 `openai/gpt-5.5` 這類 provider-qualified model refs 會被拆分為 Gateway
`provider` 與 `model` overrides。`timeoutMs` 在 SDK 中保持毫秒，並會為
`agent` RPC 轉換為 Gateway timeout seconds。

`run.wait()` 使用 Gateway `agent.wait` RPC。若等待期限到期時 run 仍在進行中，會傳回 `status: "accepted"`，而不是假裝 run 本身已逾時。Runtime timeouts、已中止 runs 與已取消 runs 會正規化為 `timed_out` 或 `cancelled`。

## 建立並重用 Sessions

當應用程式需要持久 transcript state 時，請使用 sessions。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` 會呼叫 `sessions.send` 並傳回 `Run`。Session handles 也支援：

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## 串流事件

SDK 會將原始 Gateway 事件正規化為穩定的 `OpenClawEvent` envelope：

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
| `tool.call.started`   | Tool/item/command 開始                     |
| `tool.call.delta`     | Tool/item/command 更新                     |
| `tool.call.completed` | Tool/item/command 完成                     |
| `tool.call.failed`    | Tool/item/command 失敗或被封鎖狀態         |
| `approval.requested`  | Exec 或 Plugin approval request            |
| `approval.resolved`   | Exec 或 Plugin approval resolution         |
| `session.created`     | `sessions.changed` 建立                    |
| `session.updated`     | `sessions.changed` 更新                    |
| `session.compacted`   | `sessions.changed` compaction              |
| `task.updated`        | Task update events                         |
| `artifact.updated`    | Patch stream events                        |
| `raw`                 | 尚未有穩定 SDK 對應的任何事件              |

`Run.events()` 會將事件篩選為單一 run id，並重播快速 runs 已看過的事件。這代表文件中的流程是安全的：

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

若要使用全應用程式串流，請使用 `oc.events()`。若要使用原始 Gateway frames，請使用
`oc.rawEvents()`。

## Models、Tools、Artifacts 與 Approvals

Model helpers 會對應到目前的 Gateway methods：

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Tool helpers 會公開 Gateway catalog、effective tool view 與直接 Gateway tool invocation。`oc.tools.invoke()` 會傳回具型別的 envelope，而不是因 policy 或 approval refusals 而拋出錯誤。

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

Artifact helpers 會公開 session、run 或 task context 的 Gateway artifact projection。每次呼叫都需要一個明確的 `sessionKey`、`runId` 或 `taskId` scope：

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Approval helpers 使用 exec approval RPCs：

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Environment helpers 公開唯讀的 Gateway 本機與 node discovery：

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## 目前明確不支援

SDK 包含我們想要的產品模型名稱，但不會默默假裝 Gateway RPC 已存在。這些呼叫目前會拋出明確的 unsupported errors：

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

單次執行的 `workspace`、`runtime`、`environment` 與 `approvals` 欄位已依未來形狀定型，但目前 Gateway 不支援在 `agent` RPC 上使用這些 overrides。若呼叫端傳入它們，SDK 會在送出 run 前拋出錯誤，避免工作意外以預設 workspace、runtime、environment 或 approval 行為執行。

## App SDK 與 Plugin SDK

當程式碼位於 OpenClaw 外部時，請使用 App SDK：

- 啟動或觀察 agent runs 的 Node 腳本
- 呼叫 Gateway 的 CI 作業
- 儀表板與管理面板
- IDE 擴充功能
- 不需要成為 channel plugins 的外部橋接
- 使用假的或真實 Gateway transports 的整合測試

當程式碼在 OpenClaw 內部執行時，請使用 Plugin SDK：

- provider plugins
- channel plugins
- tool 或 lifecycle hooks
- agent harness plugins
- 受信任的 runtime helpers

App SDK 程式碼應從 `@openclaw/sdk` 匯入。Plugin 程式碼應從已記錄的
`openclaw/plugin-sdk/*` subpaths 匯入。請勿混用這兩份合約。

## 相關文件

- [OpenClaw App SDK API 設計](/zh-TW/reference/openclaw-sdk-api-design)
- [Gateway RPC 參考](/zh-TW/reference/rpc)
- [Agent loop](/zh-TW/concepts/agent-loop)
- [Agent runtimes](/zh-TW/concepts/agent-runtimes)
- [Sessions](/zh-TW/concepts/session)
- [背景 tasks](/zh-TW/automation/tasks)
- [ACP agents](/zh-TW/tools/acp-agents)
- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)

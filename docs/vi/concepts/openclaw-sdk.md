---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, công việc CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang lựa chọn giữa App SDK và Plugin SDK
    - Bạn đang tích hợp với các lượt chạy tác tử Gateway, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ
sidebarTitle: App SDK
summary: SDK ứng dụng OpenClaw công khai dành cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: SDK Ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-05-01T10:48:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** là API client công khai dành cho các ứng dụng bên ngoài tiến trình
OpenClaw. Dùng `@openclaw/sdk` khi một script, dashboard, tác vụ CI, extension IDE
hoặc ứng dụng bên ngoài khác muốn kết nối tới Gateway, khởi động các lượt chạy agent,
stream sự kiện, chờ kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Note>
  App SDK khác với [Plugin SDK](/vi/plugins/sdk-overview).
  `@openclaw/sdk` giao tiếp với Gateway từ bên ngoài OpenClaw.
  `openclaw/plugin-sdk/*` chỉ dành cho các plugins chạy bên trong OpenClaw và
  đăng ký provider, kênh, công cụ, hooks hoặc runtime tin cậy.
</Note>

## Những Gì Được Cung Cấp Hôm Nay

`@openclaw/sdk` được cung cấp với:

| Bề mặt                   | Trạng thái | Chức năng                                                                  |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Sẵn sàng  | Điểm vào client chính. Sở hữu transport, kết nối, yêu cầu và sự kiện. |
| `GatewayClientTransport`  | Sẵn sàng  | Transport WebSocket dựa trên client Gateway.                          |
| `oc.agents`               | Sẵn sàng  | Liệt kê, tạo, cập nhật, xóa và lấy handles agent.                  |
| `Agent.run()`             | Sẵn sàng  | Khởi động một lượt chạy Gateway `agent` và trả về một `Run`.                          |
| `oc.runs`                 | Sẵn sàng  | Tạo, lấy, chờ, hủy và stream các lượt chạy.                       |
| `Run.events()`            | Sẵn sàng  | Stream các sự kiện đã chuẩn hóa theo từng lượt chạy, có phát lại cho lượt chạy nhanh.               |
| `Run.wait()`              | Sẵn sàng  | Gọi `agent.wait` và trả về một `RunResult` ổn định.                       |
| `Run.cancel()`            | Sẵn sàng  | Gọi `sessions.abort` theo id lượt chạy, kèm khóa phiên khi có.         |
| `oc.sessions`             | Sẵn sàng  | Tạo, phân giải, gửi tới, vá, compact và lấy handles phiên.  |
| `Session.send()`          | Sẵn sàng  | Gọi `sessions.send` và trả về một `Run`.                                 |
| `oc.models`               | Sẵn sàng  | Gọi `models.list` và RPC trạng thái `models.authStatus` hiện tại.        |
| `oc.tools`                | Sẵn sàng  | Liệt kê, định phạm vi và gọi công cụ Gateway qua pipeline chính sách.      |
| `oc.artifacts`            | Sẵn sàng  | Liệt kê, lấy và tải xuống artifacts bản ghi Gateway.                   |
| `oc.approvals`            | Sẵn sàng  | Liệt kê và xử lý phê duyệt exec qua các RPC phê duyệt Gateway.           |
| `oc.rawEvents()`          | Sẵn sàng  | Cung cấp sự kiện Gateway thô cho người dùng nâng cao.                         |
| `normalizeGatewayEvent()` | Sẵn sàng  | Chuyển đổi sự kiện Gateway thô sang dạng sự kiện SDK ổn định.               |

SDK cũng export các kiểu cốt lõi được dùng bởi những bề mặt đó:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` và các kiểu
kết quả liên quan.

## Kết Nối Tới Gateway

Tạo một client với URL Gateway tường minh, hoặc inject một transport tùy chỉnh cho
kiểm thử và runtime ứng dụng nhúng.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` tương đương với `url`. Tùy chọn
`gateway: "auto"` được constructor chấp nhận, nhưng tự động khám phá Gateway
chưa phải là một tính năng SDK riêng; hãy truyền `url` khi ứng dụng chưa biết sẵn
cách khám phá Gateway.

Đối với kiểm thử, hãy truyền một object triển khai `OpenClawTransport`:

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

## Chạy Một Agent

Dùng `oc.agents.get(id)` khi ứng dụng muốn một handle agent, rồi gọi
`agent.run()`.

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

Các tham chiếu model có kèm provider như `openai/gpt-5.5` được tách thành các
override Gateway `provider` và `model`. `timeoutMs` vẫn là mili giây trong SDK và
được chuyển đổi thành số giây timeout của Gateway cho RPC `agent`.

`run.wait()` dùng RPC Gateway `agent.wait`. Hạn chờ hết hạn trong khi lượt chạy
vẫn đang hoạt động sẽ trả về `status: "accepted"` thay vì giả vờ rằng chính lượt
chạy đã timeout. Timeout runtime, lượt chạy bị abort và lượt chạy bị hủy được
chuẩn hóa thành `timed_out` hoặc `cancelled`.

## Tạo Và Tái Sử Dụng Phiên

Dùng phiên khi ứng dụng muốn trạng thái bản ghi bền vững.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` gọi `sessions.send` và trả về một `Run`. Handle phiên cũng
hỗ trợ:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Stream Sự Kiện

SDK chuẩn hóa sự kiện Gateway thô thành một envelope `OpenClawEvent` ổn định:

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

Các loại sự kiện phổ biến gồm:

| Loại sự kiện            | Sự kiện Gateway nguồn                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | Bắt đầu vòng đời `agent`                     |
| `run.completed`       | Kết thúc vòng đời `agent`                       |
| `run.failed`          | Lỗi vòng đời `agent`                     |
| `run.cancelled`       | Kết thúc vòng đời bị abort/bị hủy             |
| `run.timed_out`       | Kết thúc vòng đời do timeout                       |
| `assistant.delta`     | Delta stream của assistant                   |
| `assistant.message`   | Tin nhắn assistant                           |
| `thinking.delta`      | Luồng suy nghĩ hoặc kế hoạch                     |
| `tool.call.started`   | Bắt đầu công cụ/mục/lệnh                     |
| `tool.call.delta`     | Cập nhật công cụ/mục/lệnh                    |
| `tool.call.completed` | Hoàn tất công cụ/mục/lệnh                |
| `tool.call.failed`    | Lỗi hoặc trạng thái bị chặn của công cụ/mục/lệnh |
| `approval.requested`  | Yêu cầu phê duyệt exec hoặc Plugin             |
| `approval.resolved`   | Kết quả phê duyệt exec hoặc Plugin          |
| `session.created`     | Tạo `sessions.changed`                   |
| `session.updated`     | Cập nhật `sessions.changed`                   |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Sự kiện cập nhật tác vụ                          |
| `artifact.updated`    | Sự kiện stream patch                         |
| `raw`                 | Bất kỳ sự kiện nào chưa có ánh xạ SDK ổn định  |

`Run.events()` lọc sự kiện theo một id lượt chạy và phát lại các sự kiện đã thấy
cho những lượt chạy nhanh. Điều đó nghĩa là luồng được ghi tài liệu là an toàn:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Đối với stream toàn ứng dụng, dùng `oc.events()`. Đối với frame Gateway thô, dùng
`oc.rawEvents()`.

## Models, Công Cụ, Artifacts Và Phê Duyệt

Các helper model ánh xạ tới các phương thức Gateway hiện tại:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Các helper công cụ cung cấp catalog Gateway, chế độ xem công cụ hiệu lực và lệnh gọi
trực tiếp công cụ Gateway. `oc.tools.invoke()` trả về một envelope có kiểu thay vì
throw đối với từ chối do chính sách hoặc phê duyệt.

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

Các helper artifact cung cấp phép chiếu artifact Gateway cho ngữ cảnh phiên, lượt chạy
hoặc tác vụ. Mỗi lệnh gọi yêu cầu đúng một phạm vi `sessionKey`, `runId` hoặc
`taskId` tường minh:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Các helper phê duyệt dùng RPC phê duyệt exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Hiện Chưa Được Hỗ Trợ Tường Minh

SDK bao gồm các tên cho mô hình sản phẩm mà chúng ta muốn, nhưng không âm thầm
giả vờ rằng các RPC Gateway tồn tại. Những lệnh gọi này hiện throw lỗi không được
hỗ trợ một cách tường minh:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Các trường theo từng lượt chạy `workspace`, `runtime`, `environment` và `approvals`
được định kiểu như dạng tương lai, nhưng Gateway hiện tại không hỗ trợ các override đó trên
RPC `agent`. Nếu caller truyền chúng, SDK sẽ throw trước khi gửi lượt chạy
để công việc không vô tình thực thi với hành vi workspace, runtime,
environment hoặc phê duyệt mặc định.

## App SDK So Với Plugin SDK

Dùng App SDK khi mã nằm bên ngoài OpenClaw:

- Script Node khởi động hoặc quan sát các lượt chạy agent
- Tác vụ CI gọi một Gateway
- dashboard và bảng quản trị
- extension IDE
- cầu nối bên ngoài không cần trở thành Plugin kênh
- kiểm thử tích hợp với transport Gateway giả hoặc thật

Dùng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin provider
- Plugin kênh
- hook công cụ hoặc vòng đời
- Plugin harness agent
- helper runtime tin cậy

Mã App SDK nên import từ `@openclaw/sdk`. Mã Plugin nên import từ các subpath
`openclaw/plugin-sdk/*` đã được ghi tài liệu. Không trộn lẫn hai contract này.

## Tài Liệu Liên Quan

- [Thiết kế API OpenClaw App SDK](/vi/reference/openclaw-sdk-api-design)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp agent](/vi/concepts/agent-loop)
- [Runtime agent](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Agent ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

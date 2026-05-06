---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang chọn giữa App SDK và Plugin SDK
    - Bạn đang tích hợp với các lần chạy tác tử Gateway, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ
sidebarTitle: App SDK
summary: SDK Ứng dụng OpenClaw công khai dành cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: SDK Ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:08:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** là API client công khai dành cho các ứng dụng bên ngoài tiến trình OpenClaw. Dùng `@openclaw/sdk` khi một script, dashboard, tác vụ CI, tiện ích mở rộng IDE hoặc ứng dụng bên ngoài khác muốn kết nối tới Gateway, bắt đầu các lần chạy tác tử, truyền trực tuyến sự kiện, chờ kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Note>
  App SDK khác với [Plugin SDK](/vi/plugins/sdk-overview).
  `@openclaw/sdk` giao tiếp với Gateway từ bên ngoài OpenClaw.
  `openclaw/plugin-sdk/*` chỉ dành cho các plugin chạy bên trong OpenClaw và
  đăng ký nhà cung cấp, kênh, công cụ, hook hoặc runtime tin cậy.
</Note>

## Hiện có hôm nay

`@openclaw/sdk` hiện có:

| Giao diện                 | Trạng thái | Chức năng                                                                         |
| ------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Sẵn sàng   | Điểm vào client chính. Quản lý transport, kết nối, yêu cầu và sự kiện.            |
| `GatewayClientTransport`  | Sẵn sàng   | WebSocket transport được hỗ trợ bởi client Gateway.                               |
| `oc.agents`               | Sẵn sàng   | Liệt kê, tạo, cập nhật, xóa và lấy handle tác tử.                                 |
| `Agent.run()`             | Sẵn sàng   | Bắt đầu một lần chạy `agent` của Gateway và trả về một `Run`.                     |
| `oc.runs`                 | Sẵn sàng   | Tạo, lấy, chờ, hủy và truyền trực tuyến các lần chạy.                             |
| `Run.events()`            | Sẵn sàng   | Truyền trực tuyến các sự kiện theo lần chạy đã chuẩn hóa, có phát lại cho các lần chạy nhanh. |
| `Run.wait()`              | Sẵn sàng   | Gọi `agent.wait` và trả về một `RunResult` ổn định.                               |
| `Run.cancel()`            | Sẵn sàng   | Gọi `sessions.abort` theo id lần chạy, kèm khóa phiên khi có.                     |
| `oc.sessions`             | Sẵn sàng   | Tạo, phân giải, gửi tới, vá, nén và lấy handle phiên.                             |
| `Session.send()`          | Sẵn sàng   | Gọi `sessions.send` và trả về một `Run`.                                          |
| `oc.models`               | Sẵn sàng   | Gọi `models.list` và RPC trạng thái `models.authStatus` hiện tại.                 |
| `oc.tools`                | Sẵn sàng   | Liệt kê, giới hạn phạm vi và gọi các công cụ Gateway thông qua pipeline chính sách. |
| `oc.artifacts`            | Sẵn sàng   | Liệt kê, lấy và tải xuống các artifact bản ghi Gateway.                           |
| `oc.approvals`            | Sẵn sàng   | Liệt kê và xử lý phê duyệt exec thông qua các RPC phê duyệt của Gateway.          |
| `oc.environments`         | Một phần   | Liệt kê các ứng viên môi trường cục bộ của Gateway và node; tạo/xóa chưa được nối. |
| `oc.rawEvents()`          | Sẵn sàng   | Cung cấp các sự kiện Gateway thô cho người dùng nâng cao.                         |
| `normalizeGatewayEvent()` | Sẵn sàng   | Chuyển đổi sự kiện Gateway thô sang dạng sự kiện SDK ổn định.                     |

SDK cũng xuất các kiểu lõi được các giao diện đó sử dụng:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` và các kiểu
kết quả liên quan.

## Kết nối tới Gateway

Tạo client với URL Gateway rõ ràng, hoặc tiêm transport tùy chỉnh cho kiểm thử
và runtime ứng dụng nhúng.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` tương đương với `url`. Tùy chọn
`gateway: "auto"` được constructor chấp nhận, nhưng tự động khám phá Gateway
chưa phải là một tính năng SDK riêng; hãy truyền `url` khi ứng dụng chưa biết
cách khám phá Gateway.

Với kiểm thử, hãy truyền một đối tượng triển khai `OpenClawTransport`:

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

## Chạy một tác tử

Dùng `oc.agents.get(id)` khi ứng dụng muốn có handle tác tử, rồi gọi
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

Các tham chiếu mô hình có định danh nhà cung cấp như `openai/gpt-5.5` được tách thành các ghi đè `provider` và `model` của Gateway. `timeoutMs` vẫn là mili giây trong SDK và được chuyển đổi thành số giây timeout của Gateway cho RPC `agent`.

`run.wait()` dùng RPC `agent.wait` của Gateway. Một hạn chờ hết hạn trong khi lần chạy vẫn đang hoạt động sẽ trả về `status: "accepted"` thay vì giả vờ rằng chính lần chạy đã hết thời gian. Timeout runtime, lần chạy bị hủy bỏ và lần chạy bị hủy được chuẩn hóa thành `timed_out` hoặc `cancelled`.

## Tạo và tái sử dụng phiên

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

## Truyền trực tuyến sự kiện

SDK chuẩn hóa các sự kiện Gateway thô thành một phong bì `OpenClawEvent` ổn định:

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

| Loại sự kiện          | Sự kiện Gateway nguồn                      |
| --------------------- | ------------------------------------------ |
| `run.started`         | Bắt đầu vòng đời `agent`                   |
| `run.completed`       | Kết thúc vòng đời `agent`                  |
| `run.failed`          | Lỗi vòng đời `agent`                       |
| `run.cancelled`       | Kết thúc vòng đời bị hủy bỏ/bị hủy         |
| `run.timed_out`       | Kết thúc vòng đời do timeout               |
| `assistant.delta`     | Delta truyền trực tuyến của trợ lý         |
| `assistant.message`   | Tin nhắn của trợ lý                        |
| `thinking.delta`      | Luồng suy nghĩ hoặc kế hoạch               |
| `tool.call.started`   | Bắt đầu công cụ/mục/lệnh                   |
| `tool.call.delta`     | Cập nhật công cụ/mục/lệnh                  |
| `tool.call.completed` | Hoàn tất công cụ/mục/lệnh                  |
| `tool.call.failed`    | Công cụ/mục/lệnh thất bại hoặc trạng thái bị chặn |
| `approval.requested`  | Yêu cầu phê duyệt exec hoặc plugin         |
| `approval.resolved`   | Kết quả phê duyệt exec hoặc plugin         |
| `session.created`     | Tạo `sessions.changed`                     |
| `session.updated`     | Cập nhật `sessions.changed`                |
| `session.compacted`   | Compaction `sessions.changed`              |
| `task.updated`        | Sự kiện cập nhật tác vụ                    |
| `artifact.updated`    | Sự kiện luồng bản vá                       |
| `raw`                 | Bất kỳ sự kiện nào chưa có ánh xạ SDK ổn định |

`Run.events()` lọc sự kiện theo một id lần chạy và phát lại các sự kiện đã thấy
cho các lần chạy nhanh. Điều đó nghĩa là luồng đã được ghi tài liệu là an toàn:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Với luồng toàn ứng dụng, dùng `oc.events()`. Với frame Gateway thô, dùng
`oc.rawEvents()`.

## Mô hình, công cụ, artifact và phê duyệt

Các helper mô hình ánh xạ tới những phương thức Gateway hiện tại:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Các helper công cụ cung cấp catalog Gateway, chế độ xem công cụ hiệu lực và lời gọi trực tiếp công cụ Gateway. `oc.tools.invoke()` trả về một phong bì có kiểu thay vì ném lỗi khi chính sách hoặc phê duyệt từ chối.

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

Các helper artifact cung cấp phép chiếu artifact Gateway cho ngữ cảnh phiên, lần chạy hoặc tác vụ. Mỗi lời gọi yêu cầu đúng một phạm vi rõ ràng là `sessionKey`, `runId` hoặc `taskId`:

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

Các helper môi trường cung cấp khả năng khám phá chỉ đọc cục bộ của Gateway và node:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Hiện chưa được hỗ trợ rõ ràng

SDK bao gồm các tên cho mô hình sản phẩm mà chúng ta muốn, nhưng không âm thầm
giả vờ rằng các RPC Gateway tồn tại. Những lời gọi này hiện ném lỗi không được
hỗ trợ rõ ràng:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Các trường theo từng lần chạy `workspace`, `runtime`, `environment` và `approvals` được định kiểu như dạng trong tương lai, nhưng Gateway hiện tại không hỗ trợ các ghi đè đó trên RPC `agent`. Nếu bên gọi truyền chúng, SDK sẽ ném lỗi trước khi gửi lần chạy để công việc không vô tình thực thi với hành vi mặc định về workspace, runtime, môi trường hoặc phê duyệt.

## App SDK so với Plugin SDK

Dùng App SDK khi mã nằm bên ngoài OpenClaw:

- Script Node bắt đầu hoặc quan sát các lần chạy tác tử
- Tác vụ CI gọi Gateway
- dashboard và bảng quản trị
- tiện ích mở rộng IDE
- cầu nối bên ngoài không cần trở thành plugin kênh
- kiểm thử tích hợp với transport Gateway giả hoặc thật

Dùng Plugin SDK khi mã chạy bên trong OpenClaw:

- plugin nhà cung cấp
- plugin kênh
- hook công cụ hoặc vòng đời
- plugin harness tác tử
- helper runtime tin cậy

Mã App SDK nên import từ `@openclaw/sdk`. Mã plugin nên import từ các đường dẫn con `openclaw/plugin-sdk/*` đã được ghi tài liệu. Không trộn lẫn hai hợp đồng này.

## Liên quan

- [Thiết kế API OpenClaw App SDK](/vi/reference/openclaw-sdk-api-design)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

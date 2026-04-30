---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang lựa chọn giữa App SDK và Plugin SDK
    - Bạn đang tích hợp với các lần chạy tác nhân, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ của Gateway
sidebarTitle: App SDK
summary: SDK Ứng dụng OpenClaw công khai dành cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: SDK ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** là API máy khách công khai dành cho các ứng dụng bên ngoài tiến trình OpenClaw. Dùng `@openclaw/sdk` khi một tập lệnh, bảng điều khiển, tác vụ CI, tiện ích mở rộng IDE hoặc ứng dụng bên ngoài khác muốn kết nối tới Gateway, khởi chạy các lần chạy tác tử, truyền phát sự kiện, chờ kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Note>
  App SDK khác với [Plugin SDK](/vi/plugins/sdk-overview).
  `@openclaw/sdk` giao tiếp với Gateway từ bên ngoài OpenClaw.
  `openclaw/plugin-sdk/*` chỉ dành cho các Plugin chạy bên trong OpenClaw và
  đăng ký nhà cung cấp, kênh, công cụ, hook hoặc runtime đáng tin cậy.
</Note>

## Những gì được phát hành hiện nay

`@openclaw/sdk` phát hành kèm:

| Giao diện                 | Trạng thái | Chức năng                                                                     |
| ------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `OpenClaw`                | Sẵn sàng   | Điểm vào máy khách chính. Sở hữu transport, kết nối, yêu cầu và sự kiện.      |
| `GatewayClientTransport`  | Sẵn sàng   | Transport WebSocket được hỗ trợ bởi máy khách Gateway.                        |
| `oc.agents`               | Sẵn sàng   | Liệt kê, tạo, cập nhật, xóa và lấy handle tác tử.                             |
| `Agent.run()`             | Sẵn sàng   | Khởi chạy một lần chạy `agent` của Gateway và trả về một `Run`.               |
| `oc.runs`                 | Sẵn sàng   | Tạo, lấy, chờ, hủy và truyền phát các lần chạy.                               |
| `Run.events()`            | Sẵn sàng   | Truyền phát sự kiện đã chuẩn hóa theo từng lần chạy, có phát lại cho lần chạy nhanh. |
| `Run.wait()`              | Sẵn sàng   | Gọi `agent.wait` và trả về một `RunResult` ổn định.                           |
| `Run.cancel()`            | Sẵn sàng   | Gọi `sessions.abort` theo id lần chạy, kèm khóa phiên khi có.                 |
| `oc.sessions`             | Sẵn sàng   | Tạo, phân giải, gửi tới, vá, nén và lấy handle phiên.                         |
| `Session.send()`          | Sẵn sàng   | Gọi `sessions.send` và trả về một `Run`.                                      |
| `oc.models`               | Sẵn sàng   | Gọi `models.list` và RPC trạng thái `models.authStatus` hiện tại.             |
| `oc.tools`                | Một phần   | Liệt kê danh mục công cụ và công cụ hiệu lực; gọi công cụ trực tiếp chưa được nối dây. |
| `oc.approvals`            | Sẵn sàng   | Liệt kê và phân giải phê duyệt exec thông qua các RPC phê duyệt của Gateway.  |
| `oc.rawEvents()`          | Sẵn sàng   | Cung cấp sự kiện Gateway thô cho người dùng nâng cao.                         |
| `normalizeGatewayEvent()` | Sẵn sàng   | Chuyển đổi sự kiện Gateway thô sang dạng sự kiện SDK ổn định.                 |

SDK cũng xuất các kiểu lõi được các giao diện đó sử dụng:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode`, và các kiểu kết quả liên quan.

## Kết nối tới một Gateway

Tạo một máy khách với URL Gateway tường minh, hoặc tiêm một transport tùy chỉnh cho kiểm thử và runtime ứng dụng nhúng.

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
`gateway: "auto"` được constructor chấp nhận, nhưng tự động khám phá Gateway chưa phải là một tính năng SDK riêng; hãy truyền `url` khi ứng dụng chưa biết cách khám phá Gateway.

Đối với kiểm thử, truyền một đối tượng triển khai `OpenClawTransport`:

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

Dùng `oc.agents.get(id)` khi ứng dụng muốn một handle tác tử, rồi gọi
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

Tham chiếu mô hình có kèm nhà cung cấp như `openai/gpt-5.5` được tách thành các override `provider` và `model` của Gateway. `timeoutMs` vẫn là mili giây trong SDK và được chuyển đổi thành giây timeout của Gateway cho RPC `agent`.

`run.wait()` dùng RPC `agent.wait` của Gateway. Một hạn chờ hết hạn trong khi lần chạy vẫn đang hoạt động sẽ trả về `status: "accepted"` thay vì giả vờ rằng chính lần chạy đã hết thời gian. Timeout runtime, lần chạy bị hủy bỏ và lần chạy bị hủy được chuẩn hóa thành `timed_out` hoặc `cancelled`.

## Tạo và tái sử dụng phiên

Dùng phiên khi ứng dụng muốn trạng thái transcript bền vững.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` gọi `sessions.send` và trả về một `Run`. Handle phiên cũng hỗ trợ:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Truyền phát sự kiện

SDK chuẩn hóa sự kiện Gateway thô thành một phong bì `OpenClawEvent` ổn định:

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

Các kiểu sự kiện phổ biến gồm:

| Kiểu sự kiện          | Sự kiện Gateway nguồn                       |
| --------------------- | ------------------------------------------- |
| `run.started`         | Bắt đầu vòng đời `agent`                    |
| `run.completed`       | Kết thúc vòng đời `agent`                   |
| `run.failed`          | Lỗi vòng đời `agent`                        |
| `run.cancelled`       | Kết thúc vòng đời bị hủy bỏ/bị hủy          |
| `run.timed_out`       | Kết thúc vòng đời do timeout                |
| `assistant.delta`     | Delta truyền phát của trợ lý                |
| `assistant.message`   | Tin nhắn của trợ lý                         |
| `thinking.delta`      | Luồng suy nghĩ hoặc kế hoạch                |
| `tool.call.started`   | Bắt đầu công cụ/mục/lệnh                    |
| `tool.call.delta`     | Cập nhật công cụ/mục/lệnh                   |
| `tool.call.completed` | Hoàn tất công cụ/mục/lệnh                   |
| `tool.call.failed`    | Công cụ/mục/lệnh thất bại hoặc trạng thái bị chặn |
| `approval.requested`  | Yêu cầu phê duyệt exec hoặc Plugin          |
| `approval.resolved`   | Phân giải phê duyệt exec hoặc Plugin        |
| `session.created`     | Tạo `sessions.changed`                      |
| `session.updated`     | Cập nhật `sessions.changed`                 |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Sự kiện cập nhật tác vụ                     |
| `artifact.updated`    | Sự kiện luồng bản vá                        |
| `raw`                 | Bất kỳ sự kiện nào chưa có ánh xạ SDK ổn định |

`Run.events()` lọc sự kiện theo một id lần chạy và phát lại các sự kiện đã thấy cho các lần chạy nhanh. Điều đó có nghĩa là luồng được ghi trong tài liệu là an toàn:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Đối với luồng toàn ứng dụng, dùng `oc.events()`. Đối với frame Gateway thô, dùng
`oc.rawEvents()`.

## Mô hình, công cụ và phê duyệt

Các helper mô hình ánh xạ tới phương thức Gateway hiện tại:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Các helper công cụ cung cấp danh mục Gateway và chế độ xem công cụ hiệu lực:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Các helper phê duyệt dùng RPC phê duyệt exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Hiện chưa được hỗ trợ rõ ràng

SDK bao gồm các tên cho mô hình sản phẩm mà chúng tôi muốn, nhưng không âm thầm giả vờ rằng các RPC Gateway tồn tại. Các lời gọi này hiện ném lỗi không được hỗ trợ tường minh:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Các trường `workspace`, `runtime`, `environment` và `approvals` theo từng lần chạy được định kiểu như dạng tương lai, nhưng Gateway hiện tại không hỗ trợ các override đó trên RPC `agent`. Nếu bên gọi truyền chúng, SDK sẽ ném lỗi trước khi gửi lần chạy, để công việc không vô tình thực thi với hành vi workspace, runtime, môi trường hoặc phê duyệt mặc định.

## App SDK so với Plugin SDK

Dùng App SDK khi mã nằm bên ngoài OpenClaw:

- Tập lệnh Node khởi chạy hoặc quan sát các lần chạy tác tử
- Tác vụ CI gọi một Gateway
- bảng điều khiển và bảng quản trị
- tiện ích mở rộng IDE
- cầu nối bên ngoài không cần trở thành Plugin kênh
- kiểm thử tích hợp với transport Gateway giả hoặc thật

Dùng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin nhà cung cấp
- Plugin kênh
- hook công cụ hoặc vòng đời
- Plugin harness tác tử
- helper runtime đáng tin cậy

Mã App SDK nên import từ `@openclaw/sdk`. Mã Plugin nên import từ các đường dẫn con `openclaw/plugin-sdk/*` đã được ghi trong tài liệu. Không trộn lẫn hai hợp đồng này.

## Tài liệu liên quan

- [Thiết kế API OpenClaw App SDK](/vi/reference/openclaw-sdk-api-design)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

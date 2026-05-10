---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, công việc CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang chọn giữa App SDK và Plugin SDK
    - Bạn đang tích hợp với các lần chạy tác tử Gateway, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ
sidebarTitle: App SDK
summary: SDK ứng dụng OpenClaw công khai dành cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: SDK ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-05-10T19:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** là API client công khai cho các ứng dụng bên ngoài tiến trình
OpenClaw. Dùng `@openclaw/sdk` khi một script, bảng điều khiển, tác vụ CI, tiện ích
mở rộng IDE, hoặc ứng dụng bên ngoài khác muốn kết nối tới Gateway, bắt đầu các lượt
chạy tác tử, truyền sự kiện theo luồng, chờ kết quả, hủy công việc, hoặc kiểm tra
tài nguyên Gateway.

<Note>
  App SDK khác với [Plugin SDK](/vi/plugins/sdk-overview).
  `@openclaw/sdk` giao tiếp với Gateway từ bên ngoài OpenClaw.
  `openclaw/plugin-sdk/*` chỉ dành cho các Plugin chạy bên trong OpenClaw và
  đăng ký provider, kênh, công cụ, hook, hoặc runtime tin cậy.
</Note>

## Nội dung hiện có

`@openclaw/sdk` hiện có:

| Giao diện                 | Trạng thái | Chức năng                                                                         |
| ------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Sẵn sàng   | Điểm vào client chính. Sở hữu transport, kết nối, yêu cầu và sự kiện.             |
| `GatewayClientTransport`  | Sẵn sàng   | Transport WebSocket dựa trên Gateway client.                                      |
| `oc.agents`               | Sẵn sàng   | Liệt kê, tạo, cập nhật, xóa và lấy handle tác tử.                                 |
| `Agent.run()`             | Sẵn sàng   | Bắt đầu một lượt chạy Gateway `agent` và trả về một `Run`.                        |
| `oc.runs`                 | Sẵn sàng   | Tạo, lấy, chờ, hủy và truyền lượt chạy theo luồng.                                |
| `Run.events()`            | Sẵn sàng   | Truyền các sự kiện chuẩn hóa theo từng lượt chạy, có phát lại cho lượt chạy nhanh. |
| `Run.wait()`              | Sẵn sàng   | Gọi `agent.wait` và trả về một `RunResult` ổn định.                               |
| `Run.cancel()`            | Sẵn sàng   | Gọi `sessions.abort` theo id lượt chạy, kèm khóa phiên khi có.                    |
| `oc.sessions`             | Sẵn sàng   | Tạo, phân giải, gửi tới, vá, compact và lấy handle phiên.                         |
| `Session.send()`          | Sẵn sàng   | Gọi `sessions.send` và trả về một `Run`.                                          |
| `oc.tasks`                | Sẵn sàng   | Liệt kê, đọc và hủy các mục sổ cái tác vụ Gateway.                                |
| `oc.models`               | Sẵn sàng   | Gọi `models.list` và RPC trạng thái `models.authStatus` hiện tại.                 |
| `oc.tools`                | Sẵn sàng   | Liệt kê, xác định phạm vi và gọi các công cụ Gateway qua pipeline chính sách.      |
| `oc.artifacts`            | Sẵn sàng   | Liệt kê, lấy và tải xuống các artifact bản ghi Gateway.                           |
| `oc.approvals`            | Sẵn sàng   | Liệt kê và xử lý phê duyệt exec qua RPC phê duyệt Gateway.                        |
| `oc.environments`         | Một phần   | Liệt kê ứng viên môi trường cục bộ Gateway và node; tạo/xóa chưa được nối dây.    |
| `oc.rawEvents()`          | Sẵn sàng   | Cung cấp sự kiện Gateway thô cho người dùng nâng cao.                             |
| `normalizeGatewayEvent()` | Sẵn sàng   | Chuyển sự kiện Gateway thô thành dạng sự kiện SDK ổn định.                        |

SDK cũng xuất các kiểu lõi được các giao diện đó dùng:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode`, và các kiểu
kết quả liên quan.

## Kết nối tới Gateway

Tạo client với URL Gateway rõ ràng, hoặc tiêm một transport tùy chỉnh cho
kiểm thử và runtime ứng dụng nhúng.

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
`gateway: "auto"` được constructor chấp nhận, nhưng tự động phát hiện Gateway
chưa phải là một tính năng SDK riêng; hãy truyền `url` khi ứng dụng chưa biết
cách phát hiện Gateway.

Cho kiểm thử, hãy truyền một đối tượng triển khai `OpenClawTransport`:

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

Tham chiếu model có provider như `openai/gpt-5.5` được tách thành các override
`provider` và `model` của Gateway. `timeoutMs` vẫn là mili giây trong SDK và
được chuyển thành giây timeout của Gateway cho RPC `agent`.

`run.wait()` dùng RPC Gateway `agent.wait`. Hạn chờ hết hạn trong khi lượt chạy
vẫn đang hoạt động sẽ trả về `status: "accepted"` thay vì giả vờ rằng chính lượt
chạy đã hết thời gian. Timeout runtime, lượt chạy bị abort và lượt chạy bị hủy
được chuẩn hóa thành `timed_out` hoặc `cancelled`.

## Tạo và tái sử dụng phiên

Dùng phiên khi ứng dụng cần trạng thái bản ghi bền vững.

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

## Truyền sự kiện theo luồng

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

Các loại sự kiện thường gặp gồm:

| Loại sự kiện         | Sự kiện Gateway nguồn                       |
| -------------------- | ------------------------------------------- |
| `run.started`        | Bắt đầu vòng đời `agent`                    |
| `run.completed`      | Kết thúc vòng đời `agent`                   |
| `run.failed`         | Lỗi vòng đời `agent`                        |
| `run.cancelled`      | Kết thúc vòng đời bị abort/hủy              |
| `run.timed_out`      | Kết thúc vòng đời do timeout                |
| `assistant.delta`    | Delta truyền luồng của trợ lý               |
| `assistant.message`  | Tin nhắn của trợ lý                         |
| `thinking.delta`     | Luồng suy nghĩ hoặc kế hoạch                |
| `tool.call.started`  | Bắt đầu công cụ/mục/lệnh                    |
| `tool.call.delta`    | Cập nhật công cụ/mục/lệnh                   |
| `tool.call.completed` | Hoàn tất công cụ/mục/lệnh                  |
| `tool.call.failed`   | Công cụ/mục/lệnh thất bại hoặc bị chặn      |
| `approval.requested` | Yêu cầu phê duyệt exec hoặc Plugin          |
| `approval.resolved`  | Kết quả phê duyệt exec hoặc Plugin          |
| `session.created`    | Tạo `sessions.changed`                      |
| `session.updated`    | Cập nhật `sessions.changed`                 |
| `session.compacted`  | Compaction `sessions.changed`               |
| `task.updated`       | Sự kiện cập nhật tác vụ                     |
| `artifact.updated`   | Sự kiện luồng patch                         |
| `raw`                | Bất kỳ sự kiện nào chưa có ánh xạ SDK ổn định |

`Run.events()` lọc sự kiện theo một id lượt chạy và phát lại các sự kiện đã thấy
cho lượt chạy nhanh. Điều đó nghĩa là luồng được ghi trong tài liệu là an toàn:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Với các luồng toàn ứng dụng, dùng `oc.events()`. Với frame Gateway thô, dùng
`oc.rawEvents()`.

## Model, công cụ, artifact và phê duyệt

Helper model ánh xạ tới các phương thức Gateway hiện tại:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Helper công cụ cung cấp danh mục Gateway, chế độ xem công cụ hiệu lực và lời gọi
công cụ Gateway trực tiếp. `oc.tools.invoke()` trả về một envelope có kiểu thay
vì ném lỗi khi chính sách hoặc phê duyệt từ chối.

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

Helper artifact cung cấp projection artifact Gateway cho ngữ cảnh phiên, lượt
chạy hoặc tác vụ. Mỗi lời gọi yêu cầu một phạm vi `sessionKey`, `runId` hoặc
`taskId` rõ ràng:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Helper phê duyệt dùng RPC phê duyệt exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Helper tác vụ dùng sổ cái tác vụ bền vững, cũng là nền tảng cho `openclaw tasks`:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Helper môi trường cung cấp phát hiện chỉ đọc cho Gateway cục bộ và node:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Hiện chưa được hỗ trợ rõ ràng

SDK bao gồm các tên cho mô hình sản phẩm mà chúng ta muốn, nhưng không âm thầm
giả vờ rằng RPC Gateway tồn tại. Các lời gọi này hiện ném lỗi không được hỗ trợ
một cách rõ ràng:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Các trường theo từng lượt chạy `workspace`, `runtime`, `environment` và
`approvals` được định kiểu theo dạng tương lai, nhưng Gateway hiện tại không hỗ
trợ các override đó trên RPC `agent`. Nếu caller truyền chúng, SDK sẽ ném lỗi
trước khi gửi lượt chạy để công việc không vô tình thực thi với workspace,
runtime, môi trường hoặc hành vi phê duyệt mặc định.

## App SDK so với Plugin SDK

Dùng App SDK khi mã nằm ngoài OpenClaw:

- Các script Node bắt đầu hoặc quan sát lượt chạy tác tử
- Tác vụ CI gọi Gateway
- bảng điều khiển và panel quản trị
- tiện ích mở rộng IDE
- cầu nối bên ngoài không cần trở thành Plugin kênh
- kiểm thử tích hợp với transport Gateway giả hoặc thật

Dùng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin provider
- Plugin kênh
- hook công cụ hoặc vòng đời
- Plugin agent harness
- helper runtime tin cậy

Mã App SDK nên import từ `@openclaw/sdk`. Mã Plugin nên import từ các subpath
`openclaw/plugin-sdk/*` đã được tài liệu hóa. Không trộn lẫn hai hợp đồng này.

## Liên quan

- [Thiết kế API SDK ứng dụng OpenClaw](/vi/reference/openclaw-sdk-api-design)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
- [Môi trường thực thi tác nhân](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác nhân ACP](/vi/tools/acp-agents)
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)

---
read_when:
    - Bạn đang triển khai SDK ứng dụng OpenClaw công khai được đề xuất
    - Bạn cần hợp đồng dự thảo về không gian tên, sự kiện, kết quả, tạo phẩm, phê duyệt hoặc bảo mật cho SDK ứng dụng
    - Bạn đang so sánh các tài nguyên giao thức Gateway với trình bao bọc OpenClaw App SDK cấp cao
sidebarTitle: App SDK API design
summary: Thiết kế tham chiếu cho API SDK Ứng dụng OpenClaw công khai, phân loại sự kiện, tạo tác, phê duyệt và cấu trúc gói
title: Thiết kế API SDK ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-05-06T09:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Trang này là thiết kế tham chiếu API chi tiết cho
[OpenClaw App SDK](/vi/concepts/openclaw-sdk) công khai. Nó được tách riêng có chủ ý khỏi
[Plugin SDK](/vi/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` là gói ứng dụng/máy khách bên ngoài để giao tiếp với
  Gateway. `openclaw/plugin-sdk/*` là hợp đồng biên soạn plugin chạy trong tiến trình.
  Không nhập các đường dẫn con của Plugin SDK từ các ứng dụng chỉ cần chạy agent.
</Note>

App SDK công khai nên được xây dựng theo hai lớp:

1. Máy khách Gateway được tạo ở mức thấp.
2. Lớp bao mức cao, tiện dụng với các đối tượng `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval`, và `Environment`.

## Thiết kế namespace

Các namespace mức thấp nên bám sát tài nguyên Gateway:

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

Các lớp bao mức cao nên trả về những đối tượng giúp các luồng phổ biến trở nên thuận tiện:

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

## Hợp đồng sự kiện

SDK công khai nên hiển thị các sự kiện được chuẩn hóa, có phiên bản và có thể phát lại.

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

`id` là con trỏ phát lại. Người dùng nên có thể kết nối lại bằng
`events({ after: id })` và nhận các sự kiện đã bỏ lỡ khi thời gian lưu giữ cho phép.

Các nhóm sự kiện chuẩn hóa được khuyến nghị:

| Sự kiện               | Ý nghĩa                                                      |
| --------------------- | ------------------------------------------------------------ |
| `run.created`         | Run đã được chấp nhận.                                       |
| `run.queued`          | Run đang chờ làn session, runtime, hoặc môi trường.          |
| `run.started`         | Runtime đã bắt đầu thực thi.                                 |
| `run.completed`       | Run đã hoàn tất thành công.                                  |
| `run.failed`          | Run kết thúc với lỗi.                                        |
| `run.cancelled`       | Run đã bị hủy.                                               |
| `run.timed_out`       | Run đã vượt quá thời gian chờ.                               |
| `assistant.delta`     | Phần delta văn bản của assistant.                            |
| `assistant.message`   | Tin nhắn assistant hoàn chỉnh hoặc bản thay thế.             |
| `thinking.delta`      | Phần delta suy luận hoặc kế hoạch, khi chính sách cho phép hiển thị. |
| `tool.call.started`   | Lệnh gọi công cụ đã bắt đầu.                                 |
| `tool.call.delta`     | Lệnh gọi công cụ đã truyền tiến trình hoặc đầu ra một phần.  |
| `tool.call.completed` | Lệnh gọi công cụ đã trả về thành công.                       |
| `tool.call.failed`    | Lệnh gọi công cụ thất bại.                                   |
| `approval.requested`  | Một run hoặc công cụ cần phê duyệt.                          |
| `approval.resolved`   | Phê duyệt đã được cấp, bị từ chối, hết hạn, hoặc bị hủy.     |
| `question.requested`  | Runtime yêu cầu người dùng hoặc ứng dụng chủ cung cấp đầu vào. |
| `question.answered`   | Ứng dụng chủ đã cung cấp câu trả lời.                        |
| `artifact.created`    | Artifact mới có sẵn.                                         |
| `artifact.updated`    | Artifact hiện có đã thay đổi.                                |
| `session.created`     | Session đã được tạo.                                         |
| `session.updated`     | Siêu dữ liệu session đã thay đổi.                            |
| `session.compacted`   | Compaction session đã diễn ra.                               |
| `task.updated`        | Trạng thái tác vụ nền đã thay đổi.                           |
| `git.branch`          | Runtime đã quan sát hoặc thay đổi trạng thái nhánh.          |
| `git.diff`            | Runtime đã tạo hoặc thay đổi một diff.                       |
| `git.pr`              | Runtime đã mở, cập nhật, hoặc liên kết một pull request.     |

Các payload gốc của runtime nên có sẵn qua `raw`, nhưng ứng dụng không nên
phải phân tích `raw` cho giao diện người dùng thông thường.

## Hợp đồng kết quả

`Run.wait()` nên trả về một phong bì kết quả ổn định:

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

Kết quả nên đơn giản và ổn định. Giá trị dấu thời gian giữ nguyên hình dạng của Gateway,
vì vậy các run hiện tại được hỗ trợ bởi vòng đời thường báo cáo số mili giây epoch
trong khi các adapter vẫn có thể hiển thị chuỗi ISO. Giao diện người dùng phong phú, vết công cụ và
chi tiết gốc của runtime thuộc về sự kiện và artifact.

`accepted` là kết quả chờ không kết thúc: nó có nghĩa là hạn chờ của Gateway
đã hết trước khi run tạo ra kết thúc/lỗi vòng đời. Không được coi nó là
`timed_out`; `timed_out` được dành cho một run đã vượt quá thời gian chờ runtime
của chính nó.

## Phê duyệt và câu hỏi

Phê duyệt phải là thực thể hạng nhất vì các agent lập trình liên tục vượt qua
các ranh giới an toàn.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Sự kiện phê duyệt nên mang theo:

- id phê duyệt
- id run và id session
- loại yêu cầu
- tóm tắt hành động được yêu cầu
- tên công cụ hoặc hành động môi trường
- mức độ rủi ro
- các quyết định có sẵn
- thời điểm hết hạn
- quyết định có thể được tái sử dụng hay không

Câu hỏi tách biệt với phê duyệt. Một câu hỏi yêu cầu người dùng hoặc ứng dụng chủ cung cấp
thông tin. Một phê duyệt yêu cầu quyền thực hiện một hành động.

## Mô hình ToolSpace

Ứng dụng cần hiểu bề mặt công cụ mà không nhập phần nội bộ của plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK nên hiển thị:

- siêu dữ liệu công cụ được chuẩn hóa
- nguồn: OpenClaw, MCP, plugin, kênh, runtime, hoặc ứng dụng
- tóm tắt schema
- chính sách phê duyệt
- khả năng tương thích runtime
- công cụ bị ẩn, chỉ đọc, có khả năng ghi, hoặc có khả năng phía host hay không

Việc gọi công cụ qua SDK nên rõ ràng và có phạm vi. Hầu hết ứng dụng nên
chạy agent, không gọi trực tiếp các công cụ tùy ý.

## Mô hình artifact

Artifact nên bao quát nhiều hơn tệp.

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

Ví dụ phổ biến:

- chỉnh sửa tệp và tệp được tạo
- gói patch
- diff VCS
- ảnh chụp màn hình và đầu ra media
- nhật ký và gói trace
- liên kết pull request
- trajectory runtime
- ảnh chụp nhanh workspace của môi trường được quản lý

Truy cập artifact nên hỗ trợ biên tập ẩn, lưu giữ và URL tải xuống mà không
giả định mọi artifact đều là tệp cục bộ thông thường.

## Mô hình bảo mật

App SDK phải rõ ràng về quyền hạn.

Các phạm vi token được khuyến nghị:

| Phạm vi             | Cho phép                                            |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Liệt kê và kiểm tra agent.                          |
| `agent.run`         | Bắt đầu run.                                        |
| `session.read`      | Đọc siêu dữ liệu và tin nhắn session.               |
| `session.write`     | Tạo, gửi đến, fork, compact và hủy bỏ session.      |
| `task.read`         | Đọc trạng thái tác vụ nền.                          |
| `task.write`        | Hủy hoặc sửa đổi chính sách thông báo tác vụ.       |
| `approval.respond`  | Phê duyệt hoặc từ chối yêu cầu.                     |
| `tools.invoke`      | Gọi trực tiếp các công cụ được hiển thị.            |
| `artifacts.read`    | Liệt kê và tải xuống artifact.                      |
| `environment.write` | Tạo hoặc hủy môi trường được quản lý.               |
| `admin`             | Thao tác quản trị.                                  |

Mặc định:

- không chuyển tiếp bí mật theo mặc định
- không truyền qua biến môi trường không hạn chế
- tham chiếu bí mật thay vì giá trị bí mật
- chính sách sandbox và mạng rõ ràng
- lưu giữ môi trường từ xa rõ ràng
- phê duyệt cho thực thi trên host trừ khi chính sách chứng minh điều ngược lại
- sự kiện runtime thô được biên tập ẩn trước khi rời Gateway trừ khi bên gọi có
  phạm vi chẩn đoán mạnh hơn

## Nhà cung cấp môi trường được quản lý

Agent được quản lý nên được triển khai dưới dạng nhà cung cấp môi trường.

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

Triển khai đầu tiên không cần phải là SaaS được lưu trữ. Nó có thể nhắm tới
các host node hiện có, workspace tạm thời, runner kiểu CI, hoặc môi trường kiểu Testbox.
Hợp đồng quan trọng là:

1. chuẩn bị workspace
2. liên kết môi trường và bí mật an toàn
3. bắt đầu run
4. truyền sự kiện
5. thu thập artifact
6. dọn dẹp hoặc lưu giữ theo chính sách

Khi điều này ổn định, một dịch vụ đám mây được lưu trữ có thể triển khai cùng hợp đồng
nhà cung cấp đó.

## Cấu trúc gói

Các gói được khuyến nghị:

| Gói                     | Mục đích                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK mức cao công khai và máy khách Gateway mức thấp được tạo. |
| `@openclaw/sdk-react`   | React hook tùy chọn cho dashboard và trình xây dựng ứng dụng. |
| `@openclaw/sdk-testing` | Trình trợ giúp kiểm thử và máy chủ Gateway giả cho tích hợp ứng dụng. |

Repo đã có `openclaw/plugin-sdk/*` cho plugin. Giữ namespace đó riêng biệt
để tránh làm tác giả plugin nhầm lẫn với nhà phát triển ứng dụng.

## Chiến lược máy khách được tạo

Máy khách mức thấp nên được tạo từ các schema giao thức Gateway có phiên bản,
sau đó được bao bọc bởi các lớp tiện dụng viết thủ công.

Phân lớp:

1. Nguồn sự thật duy nhất của schema Gateway.
2. Client TypeScript cấp thấp được tạo sinh.
3. Bộ xác thực runtime cho đầu vào bên ngoài và payload sự kiện.
4. Các wrapper cấp cao `OpenClaw`, `Agent`, `Session`, `Run`, `Task` và `Artifact`.
5. Ví dụ cookbook và kiểm thử tích hợp.

Lợi ích:

- độ lệch protocol hiển thị rõ
- kiểm thử có thể so sánh các phương thức được tạo sinh với phần export của Gateway
- App SDK vẫn độc lập với phần nội bộ của Plugin SDK
- người dùng cấp thấp vẫn có toàn quyền truy cập protocol
- người dùng cấp cao có API sản phẩm nhỏ gọn

## Liên quan

- [OpenClaw App SDK](/vi/concepts/openclaw-sdk)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
- [Runtime của tác nhân](/vi/concepts/agent-runtimes)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác nhân ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

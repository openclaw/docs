---
read_when:
    - Bạn đang triển khai SDK ứng dụng công khai được đề xuất của OpenClaw
    - Bạn cần hợp đồng nháp về không gian tên, sự kiện, kết quả, tạo tác, phê duyệt hoặc bảo mật cho SDK ứng dụng
    - Bạn đang so sánh các tài nguyên giao thức Gateway với lớp bao bọc OpenClaw App SDK cấp cao
sidebarTitle: App SDK API design
summary: Thiết kế tham chiếu cho API SDK ứng dụng OpenClaw công khai, phân loại sự kiện, tạo tác, phê duyệt và cấu trúc gói
title: Thiết kế API cho SDK ứng dụng OpenClaw
x-i18n:
    generated_at: "2026-04-30T09:40:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Trang này là thiết kế tham chiếu API chi tiết cho
[OpenClaw App SDK](/vi/concepts/openclaw-sdk) công khai. Nó được tách riêng có chủ đích khỏi
[Plugin SDK](/vi/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` là gói ứng dụng/client bên ngoài để giao tiếp với
  Gateway. `openclaw/plugin-sdk/*` là hợp đồng soạn Plugin chạy trong tiến trình.
  Không nhập các đường dẫn con của Plugin SDK từ những ứng dụng chỉ cần chạy agent.
</Note>

SDK ứng dụng công khai nên được xây dựng theo hai lớp:

1. Một Gateway client cấp thấp được sinh tự động.
2. Một wrapper cấp cao, dễ dùng với các đối tượng `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` và `Environment`.

## Thiết kế namespace

Các namespace cấp thấp nên bám sát tài nguyên Gateway:

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Các wrapper cấp cao nên trả về những đối tượng giúp các luồng phổ biến dễ dùng:

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

SDK công khai nên cung cấp các sự kiện có phiên bản, có thể phát lại và đã chuẩn hóa.

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

`id` là con trỏ phát lại. Người tiêu dùng nên có thể kết nối lại bằng
`events({ after: id })` và nhận các sự kiện đã bỏ lỡ khi chính sách lưu giữ cho phép.

Các nhóm sự kiện đã chuẩn hóa được khuyến nghị:

| Sự kiện               | Ý nghĩa                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run đã được chấp nhận.                                      |
| `run.queued`          | Run đang chờ lane phiên, runtime hoặc môi trường.           |
| `run.started`         | Runtime đã bắt đầu thực thi.                                |
| `run.completed`       | Run hoàn tất thành công.                                    |
| `run.failed`          | Run kết thúc với lỗi.                                       |
| `run.cancelled`       | Run đã bị hủy.                                              |
| `run.timed_out`       | Run đã vượt quá thời gian chờ.                              |
| `assistant.delta`     | Delta văn bản của assistant.                                |
| `assistant.message`   | Tin nhắn assistant hoàn chỉnh hoặc nội dung thay thế.       |
| `thinking.delta`      | Delta lập luận hoặc kế hoạch, khi chính sách cho phép hiển thị. |
| `tool.call.started`   | Lệnh gọi công cụ đã bắt đầu.                                |
| `tool.call.delta`     | Lệnh gọi công cụ đã stream tiến trình hoặc đầu ra một phần. |
| `tool.call.completed` | Lệnh gọi công cụ trả về thành công.                         |
| `tool.call.failed`    | Lệnh gọi công cụ thất bại.                                  |
| `approval.requested`  | Một run hoặc công cụ cần phê duyệt.                         |
| `approval.resolved`   | Phê duyệt đã được cấp, từ chối, hết hạn hoặc hủy.           |
| `question.requested`  | Runtime yêu cầu người dùng hoặc ứng dụng host cung cấp đầu vào. |
| `question.answered`   | Ứng dụng host đã cung cấp câu trả lời.                      |
| `artifact.created`    | Artifact mới có sẵn.                                        |
| `artifact.updated`    | Artifact hiện có đã thay đổi.                               |
| `session.created`     | Phiên đã được tạo.                                          |
| `session.updated`     | Siêu dữ liệu phiên đã thay đổi.                             |
| `session.compacted`   | Compaction phiên đã xảy ra.                                 |
| `task.updated`        | Trạng thái tác vụ nền đã thay đổi.                          |
| `git.branch`          | Runtime đã quan sát hoặc thay đổi trạng thái nhánh.         |
| `git.diff`            | Runtime đã tạo hoặc thay đổi một diff.                      |
| `git.pr`              | Runtime đã mở, cập nhật hoặc liên kết một pull request.     |

Payload gốc của runtime nên có sẵn thông qua `raw`, nhưng ứng dụng không nên
phải phân tích `raw` cho UI thông thường.

## Hợp đồng kết quả

`Run.wait()` nên trả về một envelope kết quả ổn định:

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
vì vậy các run hiện tại dựa trên vòng đời thường báo cáo số mili giây epoch
trong khi adapter vẫn có thể hiển thị chuỗi ISO. UI phong phú, trace công cụ và
chi tiết gốc của runtime thuộc về sự kiện và artifact.

`accepted` là kết quả chờ không kết thúc: điều đó có nghĩa là hạn chờ của Gateway
đã hết trước khi run tạo ra kết thúc/lỗi vòng đời. Không được xử lý nó như
`timed_out`; `timed_out` được dành cho một run đã vượt quá thời gian chờ runtime
của chính nó.

## Phê duyệt và câu hỏi

Phê duyệt phải là đối tượng hạng nhất vì các coding agent liên tục đi qua
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
- id run và id phiên
- loại yêu cầu
- tóm tắt hành động được yêu cầu
- tên công cụ hoặc hành động môi trường
- mức độ rủi ro
- các quyết định có sẵn
- thời điểm hết hạn
- liệu quyết định có thể được tái sử dụng hay không

Câu hỏi tách biệt với phê duyệt. Câu hỏi yêu cầu người dùng hoặc ứng dụng host
cung cấp thông tin. Phê duyệt yêu cầu quyền thực hiện một hành động.

## Mô hình ToolSpace

Ứng dụng cần hiểu bề mặt công cụ mà không nhập nội bộ Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK nên cung cấp:

- siêu dữ liệu công cụ đã chuẩn hóa
- nguồn: OpenClaw, MCP, Plugin, kênh, runtime hoặc ứng dụng
- tóm tắt schema
- chính sách phê duyệt
- khả năng tương thích runtime
- liệu một công cụ là ẩn, chỉ đọc, có khả năng ghi hoặc có khả năng host hay không

Việc gọi công cụ thông qua SDK nên rõ ràng và có phạm vi. Hầu hết ứng dụng nên
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

Các ví dụ phổ biến:

- chỉnh sửa tệp và tệp được sinh
- gói patch
- diff VCS
- ảnh chụp màn hình và đầu ra media
- log và gói trace
- liên kết pull request
- quỹ đạo runtime
- snapshot workspace môi trường được quản lý

Quyền truy cập artifact nên hỗ trợ biên tập lại, lưu giữ và URL tải xuống mà
không giả định mọi artifact đều là một tệp cục bộ thông thường.

## Mô hình bảo mật

SDK ứng dụng phải rõ ràng về quyền hạn.

Các phạm vi token được khuyến nghị:

| Phạm vi             | Cho phép                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Liệt kê và kiểm tra agent.                          |
| `agent.run`         | Bắt đầu run.                                        |
| `session.read`      | Đọc siêu dữ liệu và tin nhắn phiên.                 |
| `session.write`     | Tạo, gửi tới, fork, compact và hủy phiên.           |
| `task.read`         | Đọc trạng thái tác vụ nền.                          |
| `task.write`        | Hủy hoặc sửa đổi chính sách thông báo tác vụ.       |
| `approval.respond`  | Chấp thuận hoặc từ chối yêu cầu.                    |
| `tools.invoke`      | Gọi trực tiếp các công cụ được phơi bày.            |
| `artifacts.read`    | Liệt kê và tải xuống artifact.                      |
| `environment.write` | Tạo hoặc phá hủy môi trường được quản lý.           |
| `admin`             | Thao tác quản trị.                                  |

Mặc định:

- không chuyển tiếp bí mật theo mặc định
- không truyền xuyên biến môi trường không hạn chế
- tham chiếu bí mật thay vì giá trị bí mật
- chính sách sandbox và mạng rõ ràng
- chính sách lưu giữ môi trường từ xa rõ ràng
- phê duyệt cho thực thi host trừ khi chính sách chứng minh điều ngược lại
- sự kiện runtime thô được biên tập lại trước khi rời Gateway trừ khi caller có
  phạm vi chẩn đoán mạnh hơn

## Nhà cung cấp môi trường được quản lý

Các agent được quản lý nên được triển khai dưới dạng nhà cung cấp môi trường.

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

Triển khai đầu tiên không cần phải là một SaaS được host. Nó có thể nhắm tới
các host Node hiện có, workspace tạm thời, runner kiểu CI hoặc môi trường kiểu Testbox.
Hợp đồng quan trọng là:

1. chuẩn bị workspace
2. ràng buộc môi trường và bí mật an toàn
3. bắt đầu run
4. stream sự kiện
5. thu thập artifact
6. dọn dẹp hoặc lưu giữ theo chính sách

Khi điều này ổn định, một dịch vụ đám mây được host có thể triển khai cùng
hợp đồng nhà cung cấp đó.

## Cấu trúc gói

Các gói được khuyến nghị:

| Gói                     | Mục đích                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `@openclaw/sdk`         | SDK cấp cao công khai và Gateway client cấp thấp được sinh. |
| `@openclaw/sdk-react`   | React hook tùy chọn cho dashboard và app builder.           |
| `@openclaw/sdk-testing` | Helper kiểm thử và máy chủ Gateway giả cho tích hợp ứng dụng. |

Repo đã có `openclaw/plugin-sdk/*` cho Plugin. Giữ namespace đó tách biệt để
tránh gây nhầm lẫn giữa tác giả Plugin và nhà phát triển ứng dụng.

## Chiến lược client được sinh

Client cấp thấp nên được tạo từ các lược đồ giao thức Gateway có phiên bản, sau đó được bọc bằng các lớp tiện dụng viết thủ công.

Phân lớp:

1. Nguồn chân lý là lược đồ Gateway.
2. Client TypeScript cấp thấp được tạo.
3. Trình xác thực thời gian chạy cho đầu vào bên ngoài và tải trọng sự kiện.
4. Các wrapper cấp cao `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, và `Artifact`.
5. Ví dụ cookbook và kiểm thử tích hợp.

Lợi ích:

- độ lệch giao thức được hiển thị rõ
- kiểm thử có thể so sánh các phương thức được tạo với các export của Gateway
- SDK ứng dụng vẫn độc lập với phần nội bộ của Plugin SDK
- người dùng cấp thấp vẫn có quyền truy cập đầy đủ vào giao thức
- người dùng cấp cao nhận được API sản phẩm nhỏ gọn

## Tài liệu liên quan

- [SDK ứng dụng OpenClaw](/vi/concepts/openclaw-sdk)
- [Tham khảo RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Môi trường thời gian chạy tác tử](/vi/concepts/agent-runtimes)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

---
read_when:
    - Bạn đang triển khai SDK ứng dụng OpenClaw công khai được đề xuất
    - Bạn cần hợp đồng bản nháp về không gian tên, sự kiện, kết quả, tạo tác, phê duyệt hoặc bảo mật cho SDK ứng dụng
    - Bạn đang so sánh các tài nguyên giao thức Gateway với lớp bao bọc SDK OpenClaw cấp cao
summary: Thiết kế tham chiếu cho API SDK ứng dụng công khai được đề xuất của OpenClaw, phân loại sự kiện, tạo tác, phê duyệt và cấu trúc gói
title: Thiết kế API SDK OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:07:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4dd0123581f4ba8332b6af9c673467092082a16488a61b5cbeac1b33e9a5dd1
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Trang này là thiết kế tham chiếu API chi tiết cho [OpenClaw SDK](/vi/concepts/openclaw-sdk) công khai được đề xuất. Nó được tách riêng có chủ ý với [Plugin SDK](/vi/plugins/sdk-overview).

SDK ứng dụng công khai nên được xây dựng thành hai lớp:

1. Một Gateway client được tạo ở cấp thấp.
2. Một wrapper tiện dụng ở cấp cao với các đối tượng `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` và `Environment`.

## Thiết kế namespace

Các namespace cấp thấp nên bám sát các tài nguyên Gateway:

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

Các wrapper cấp cao nên trả về những đối tượng giúp các luồng phổ biến trở nên dễ dùng:

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

`id` là con trỏ phát lại. Người tiêu thụ nên có thể kết nối lại bằng
`events({ after: id })` và nhận các sự kiện đã bỏ lỡ khi thời gian lưu giữ cho phép.

Các nhóm sự kiện chuẩn hóa được khuyến nghị:

| Sự kiện               | Ý nghĩa                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run đã được chấp nhận.                                      |
| `run.queued`          | Run đang chờ một session lane, runtime hoặc environment.    |
| `run.started`         | Runtime đã bắt đầu thực thi.                                |
| `run.completed`       | Run đã hoàn tất thành công.                                 |
| `run.failed`          | Run kết thúc với lỗi.                                       |
| `run.cancelled`       | Run đã bị hủy.                                              |
| `run.timed_out`       | Run đã vượt quá thời gian chờ.                              |
| `assistant.delta`     | Delta văn bản của trợ lý.                                   |
| `assistant.message`   | Tin nhắn trợ lý hoàn chỉnh hoặc bản thay thế.               |
| `thinking.delta`      | Delta suy luận hoặc kế hoạch, khi chính sách cho phép hiển thị. |
| `tool.call.started`   | Lệnh gọi công cụ đã bắt đầu.                                |
| `tool.call.delta`     | Lệnh gọi công cụ đã phát trực tuyến tiến trình hoặc đầu ra một phần. |
| `tool.call.completed` | Lệnh gọi công cụ trả về thành công.                         |
| `tool.call.failed`    | Lệnh gọi công cụ thất bại.                                  |
| `approval.requested`  | Một run hoặc công cụ cần phê duyệt.                         |
| `approval.resolved`   | Phê duyệt đã được cấp, từ chối, hết hạn hoặc hủy.           |
| `question.requested`  | Runtime yêu cầu người dùng hoặc ứng dụng host cung cấp đầu vào. |
| `question.answered`   | Ứng dụng host đã cung cấp câu trả lời.                      |
| `artifact.created`    | Artifact mới đã sẵn sàng.                                   |
| `artifact.updated`    | Artifact hiện có đã thay đổi.                               |
| `session.created`     | Session đã được tạo.                                        |
| `session.updated`     | Metadata của session đã thay đổi.                           |
| `session.compacted`   | Compaction của session đã diễn ra.                          |
| `task.updated`        | Trạng thái tác vụ nền đã thay đổi.                          |
| `git.branch`          | Runtime đã quan sát hoặc thay đổi trạng thái nhánh.         |
| `git.diff`            | Runtime đã tạo hoặc thay đổi một diff.                      |
| `git.pr`              | Runtime đã mở, cập nhật hoặc liên kết một pull request.     |

Payload gốc của runtime nên có sẵn thông qua `raw`, nhưng ứng dụng không nên phải phân tích `raw` cho UI thông thường.

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

Kết quả nên đơn giản và ổn định. Giá trị timestamp giữ nguyên hình dạng của Gateway, nên các run hiện tại được backed bằng vòng đời thường báo cáo số mili giây epoch, trong khi adapter vẫn có thể hiển thị chuỗi ISO. UI phong phú, trace công cụ và chi tiết gốc của runtime thuộc về sự kiện và artifact.

`accepted` là một kết quả chờ không kết thúc: nó nghĩa là hạn chót chờ của Gateway đã hết trước khi run tạo ra kết thúc/lỗi vòng đời. Không được xem nó là `timed_out`; `timed_out` được dành riêng cho một run đã vượt quá thời gian chờ runtime của chính nó.

## Phê duyệt và câu hỏi

Phê duyệt phải là thực thể hạng nhất vì các tác tử lập trình liên tục vượt qua các ranh giới an toàn.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Sự kiện phê duyệt nên mang:

- id phê duyệt
- id run và id session
- loại yêu cầu
- tóm tắt hành động được yêu cầu
- tên công cụ hoặc hành động environment
- mức rủi ro
- các quyết định có sẵn
- thời điểm hết hạn
- liệu quyết định có thể được tái sử dụng hay không

Câu hỏi tách biệt với phê duyệt. Một câu hỏi yêu cầu người dùng hoặc ứng dụng host cung cấp thông tin. Một phê duyệt yêu cầu quyền để thực hiện một hành động.

## Mô hình ToolSpace

Ứng dụng cần hiểu bề mặt công cụ mà không nhập nội bộ Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK nên cung cấp:

- metadata công cụ đã chuẩn hóa
- nguồn: OpenClaw, MCP, Plugin, kênh, runtime hoặc ứng dụng
- tóm tắt schema
- chính sách phê duyệt
- khả năng tương thích runtime
- liệu một công cụ là ẩn, chỉ đọc, có khả năng ghi hoặc có khả năng host

Lệnh gọi công cụ thông qua SDK nên rõ ràng và có phạm vi. Hầu hết ứng dụng nên chạy tác tử, không gọi trực tiếp các công cụ tùy ý.

## Mô hình artifact

Artifact nên bao phủ nhiều hơn tệp.

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
- log và gói trace
- liên kết pull request
- quỹ đạo runtime
- snapshot workspace environment được quản lý

Truy cập artifact nên hỗ trợ biên tập dữ liệu nhạy cảm, lưu giữ và URL tải xuống mà không giả định mọi artifact đều là một tệp cục bộ thông thường.

## Mô hình bảo mật

SDK ứng dụng phải nêu rõ quyền hạn.

Các scope token được khuyến nghị:

| Scope               | Cho phép                                             |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Liệt kê và kiểm tra các tác tử.                     |
| `agent.run`         | Bắt đầu run.                                        |
| `session.read`      | Đọc metadata và tin nhắn của session.               |
| `session.write`     | Tạo, gửi tới, fork, compact và hủy session.         |
| `task.read`         | Đọc trạng thái tác vụ nền.                          |
| `task.write`        | Hủy hoặc sửa đổi chính sách thông báo tác vụ.       |
| `approval.respond`  | Phê duyệt hoặc từ chối yêu cầu.                     |
| `tools.invoke`      | Gọi trực tiếp các công cụ được phơi bày.            |
| `artifacts.read`    | Liệt kê và tải xuống artifact.                      |
| `environment.write` | Tạo hoặc hủy environment được quản lý.              |
| `admin`             | Thao tác quản trị.                                  |

Mặc định:

- không chuyển tiếp bí mật theo mặc định
- không truyền biến môi trường không hạn chế
- tham chiếu bí mật thay vì giá trị bí mật
- chính sách sandbox và mạng rõ ràng
- lưu giữ environment từ xa rõ ràng
- phê duyệt cho thực thi host trừ khi chính sách chứng minh điều ngược lại
- sự kiện runtime thô được biên tập dữ liệu nhạy cảm trước khi rời Gateway, trừ khi caller có scope chẩn đoán mạnh hơn

## Nhà cung cấp environment được quản lý

Các tác tử được quản lý nên được triển khai dưới dạng nhà cung cấp environment.

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

Triển khai đầu tiên không cần là một SaaS được host. Nó có thể nhắm tới các node host hiện có, workspace tạm thời, runner kiểu CI hoặc environment kiểu Testbox. Hợp đồng quan trọng là:

1. chuẩn bị workspace
2. liên kết environment và bí mật an toàn
3. bắt đầu run
4. stream sự kiện
5. thu thập artifact
6. dọn dẹp hoặc lưu giữ theo chính sách

Khi điều này ổn định, một dịch vụ đám mây được host có thể triển khai cùng hợp đồng nhà cung cấp.

## Cấu trúc package

Các package được khuyến nghị:

| Package                 | Mục đích                                                      |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | SDK cấp cao công khai và Gateway client cấp thấp được tạo.   |
| `@openclaw/sdk-react`   | React hook tùy chọn cho dashboard và người xây dựng ứng dụng. |
| `@openclaw/sdk-testing` | Trình trợ giúp kiểm thử và máy chủ Gateway giả cho tích hợp ứng dụng. |

Repo đã có `openclaw/plugin-sdk/*` cho Plugin. Giữ namespace đó tách biệt để tránh gây nhầm lẫn giữa tác giả Plugin và nhà phát triển ứng dụng.

## Chiến lược client được tạo

Client cấp thấp nên được tạo từ các schema giao thức Gateway có phiên bản, rồi được bao bọc bằng các lớp tiện dụng viết tay.

Phân lớp:

1. Nguồn chuẩn cho lược đồ Gateway.
2. Trình khách TypeScript cấp thấp được tạo sinh.
3. Bộ xác thực khi chạy cho đầu vào bên ngoài và dữ liệu tải sự kiện.
4. Các lớp bao bọc cấp cao `OpenClaw`, `Agent`, `Session`, `Run`, `Task` và `Artifact`.
5. Ví dụ hướng dẫn thực hành và kiểm thử tích hợp.

Lợi ích:

- độ lệch giao thức trở nên dễ thấy
- kiểm thử có thể so sánh các phương thức được tạo sinh với các export của Gateway
- SDK ứng dụng vẫn độc lập với phần nội bộ của SDK Plugin
- người dùng cấp thấp vẫn có toàn quyền truy cập giao thức
- người dùng cấp cao nhận được API sản phẩm nhỏ gọn

## Tài liệu liên quan

- [Thiết kế SDK OpenClaw](/vi/concepts/openclaw-sdk)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Tổng quan SDK Plugin](/vi/plugins/sdk-overview)

---
read_when:
    - Bạn đang thiết kế hoặc triển khai một SDK ứng dụng OpenClaw công khai
    - Bạn đang so sánh các API tác tử OpenClaw với Cursor, Claude Agent SDK, OpenAI Agents, Google ADK, OpenCode, Codex hoặc ACP
    - Bạn cần quyết định liệu một tính năng thuộc về SDK ứng dụng công khai, SDK Plugin, giao thức Gateway, backend ACP, hay lớp môi trường được quản lý
summary: Đề xuất thiết kế cho SDK ứng dụng OpenClaw công khai dành cho các lượt chạy tác tử, phiên, nhiệm vụ, tạo tác và môi trường được quản lý
title: Thiết kế SDK OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:06:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffd4380e556e0e2e1218acaa9e5934e8b308b3420aa25a6d2598d35c7f9a7ab2
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Trang này là đề xuất thiết kế cho **SDK ứng dụng OpenClaw** công khai trong tương lai. Nó
tách biệt với [SDK Plugin](/vi/plugins/sdk-overview) hiện có.

SDK Plugin dành cho mã chạy bên trong OpenClaw và mở rộng provider,
kênh, công cụ, hook và runtime đáng tin cậy. SDK ứng dụng nên dành cho
ứng dụng bên ngoài, script, dashboard, tác vụ CI, tiện ích mở rộng IDE và
hệ thống tự động hóa muốn chạy và quan sát agent OpenClaw thông qua một API
công khai ổn định.

## Trạng thái

Kiến trúc nháp.

Tài liệu này ghi lại hướng thiết kế từ một đánh giá so sánh các bề mặt
SDK agent và runtime sau:

| Dự án               | Bài học hữu ích                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sổ tay Cursor SDK   | API sản phẩm cấp cao tốt nhất: `Agent`, `Run`, runtime cục bộ và đám mây, streaming, hủy, khám phá model, repository, artifact và luồng pull request trên đám mây.       |
| Claude Agent SDK    | Client phiên hai chiều mạnh, hỗ trợ ngắt và điều hướng, chế độ quyền, hook, công cụ tùy chỉnh, kho phiên và transcript có thể tiếp tục.                                  |
| OpenAI Agents SDK   | Khái niệm workflow mạnh: handoff, guardrail, phê duyệt của con người, tracing, trạng thái chạy, đối tượng kết quả streaming và tiếp tục sau khi bị ngắt.                 |
| Google ADK          | Kiến trúc nội bộ mạnh: runner, dịch vụ phiên, dịch vụ bộ nhớ, dịch vụ artifact, dịch vụ thông tin xác thực, Plugin, hành động sự kiện và xác nhận công cụ chạy lâu.      |
| OpenCode            | Hình thái client/server mạnh: client API được sinh, REST cộng SSE, phiên, workspace, worktree, quyền, câu hỏi, tệp, VCS, PTY, công cụ, agent, Skills và MCP.             |
| Codex               | Ranh giới runtime cục bộ mạnh: phê duyệt, sandboxing, chính sách mạng, máy chủ exec cục bộ và từ xa, sự kiện giao thức có cấu trúc và phiên máy chủ ứng dụng biết thread. |
| ACP và acpx         | Lớp tương tác mạnh cho harness lập trình bên ngoài với phiên có tên, hàng đợi prompt, hủy hợp tác và adapter runtime.                                                    |

Khuyến nghị là xây dựng một facade công khai đơn giản như Cursor trên một
client Gateway được sinh theo phong cách OpenCode, đồng thời giữ các khái niệm
Claude, OpenAI Agents, ADK, Codex và ACP làm tham chiếu thiết kế nội bộ khi phù hợp.

## Mục tiêu

- Cung cấp cho nhà phát triển ứng dụng một API cấp cao rất nhỏ để chạy agent OpenClaw.
- Giữ OpenClaw ưu tiên cục bộ làm runtime mặc định.
- Biến môi trường đám mây hoặc được quản lý thành một provider môi trường bổ sung, không phải một
  API agent khác.
- Duy trì các ranh giới OpenClaw hiện có: Gateway sở hữu giao thức công khai, SDK Plugin
  sở hữu phần mở rộng trong tiến trình, ACP sở hữu khả năng tương tác harness bên ngoài.
- Hỗ trợ `stream`, `wait`, `cancel`, `resume`, `fork`, artifact, phê duyệt
  và tác vụ nền như các thao tác hạng nhất.
- Phơi bày sự kiện chuẩn hóa ổn định đồng thời giữ lại sự kiện thô nguyên bản theo runtime cho
  người dùng nâng cao.
- Làm rõ quyền của SDK, chuyển tiếp bí mật, phê duyệt, sandboxing và môi trường từ xa.
- Giữ hợp đồng công khai đủ nhỏ để tài liệu hóa, kiểm thử, định phiên bản và
  sinh mã.

## Không phải mục tiêu

- Không phơi bày `openclaw/plugin-sdk/*` làm SDK ứng dụng.
- Không biến ACP thành mô hình runtime duy nhất.
- Không yêu cầu dịch vụ đám mây trước khi SDK trở nên hữu ích.
- Không sao chép chính xác API của Cursor, Claude, OpenAI, ADK, OpenCode, Codex hoặc ACP.
- Không phơi bày payload sự kiện `any` không giới hạn làm hợp đồng công khai duy nhất.
- Không hứa hẹn cách ly sandbox hoặc mạng cho harness bên ngoài trừ khi
  môi trường được chọn thực sự có thể thực thi điều đó.
- Không khiến tác giả Plugin phụ thuộc vào đối tượng SDK ứng dụng bên trong mã runtime Plugin.

## Mức độ phù hợp hiện tại của OpenClaw

OpenClaw đã có hầu hết nền tảng cần thiết:

| Bề mặt hiện có                                      | Đóng góp                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Vòng lặp agent](/vi/concepts/agent-loop)              | Vòng đời chạy `agent` và `agent.wait`, streaming, timeout và tuần tự hóa phiên.                                            |
| [Runtime agent](/vi/concepts/agent-runtimes)           | Tách biệt provider, model, runtime và kênh.                                                                                |
| [Agent ACP](/vi/tools/acp-agents)                      | Phiên harness bên ngoài cho Claude Code, Cursor, Gemini CLI, OpenCode, Codex ACP tường minh và công cụ tương tự.          |
| [Tác vụ nền](/vi/automation/tasks)                     | Sổ cái hoạt động tách rời cho ACP, subagent, cron, thao tác CLI và tác vụ media bất đồng bộ.                              |
| [Sub-agent](/vi/tools/subagents)                       | Lượt chạy agent nền được cô lập, ngữ cảnh fork tùy chọn, gửi kết quả về phiên người yêu cầu.                              |
| [Plugin harness agent](/vi/plugins/sdk-agent-harness)  | Đăng ký runtime gốc đáng tin cậy cho harness nhúng như Codex.                                                              |
| Schema giao thức Gateway                            | Định nghĩa phương thức và sự kiện có kiểu hiện tại cho tham số agent, phiên, subscription, hủy, Compaction và checkpoint. |

Khoảng trống không nằm ở việc thực thi agent. Khoảng trống là một facade công khai
ổn định, thân thiện bao phủ các phần này.

## Mô hình cốt lõi

SDK ứng dụng nên dùng một tập nhỏ các danh từ bền vững.

| Danh từ       | Ý nghĩa                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OpenClaw`    | Điểm vào client. Sở hữu khám phá Gateway, xác thực, quyền truy cập client cấp thấp và factory namespace.                  |
| `Agent`       | Actor đã cấu hình. Mang id agent, model mặc định, runtime mặc định, chính sách công cụ mặc định và helper hướng ứng dụng. |
| `Session`     | Transcript, định tuyến, workspace, ngữ cảnh và ràng buộc runtime bền vững.                                                |
| `Run`         | Một lượt hoặc tác vụ đã gửi. Stream sự kiện, chờ kết quả, hủy và phơi bày artifact.                                       |
| `Task`        | Mục sổ cái hoạt động tách rời hoặc nền. Bao gồm subagent, ACP spawn, Cron job, lượt chạy CLI và tác vụ bất đồng bộ.       |
| `Artifact`    | Tệp, patch, diff, media, log, trajectory, pull request, ảnh chụp màn hình và bundle được sinh.                            |
| `Environment` | Nơi lượt chạy được thực thi: Gateway cục bộ, workspace cục bộ, host node, harness ACP, runner được quản lý hoặc workspace đám mây tương lai. |
| `ToolSpace`   | Bề mặt công cụ hiệu lực: công cụ OpenClaw, máy chủ MCP, công cụ kênh, công cụ ứng dụng, quy tắc phê duyệt và metadata công cụ. |
| `Approval`    | Quyết định của con người hoặc chính sách do một lượt chạy, công cụ, môi trường hoặc harness yêu cầu.                      |

Những danh từ này ánh xạ rõ ràng tới các khái niệm OpenClaw hiện có nhưng tránh để lộ
tên đặc thù triển khai như phần nội bộ của PI runner, đăng ký harness Plugin
hoặc chi tiết adapter ACP.

## Hình thái sản phẩm

SDK cấp cao nên có cảm giác như sau:

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({ gateway: "auto" });
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
});

for await (const event of run.events()) {
  if (event.type === "assistant.delta") {
    process.stdout.write(event.text);
  }
}

const result = await run.wait();
console.log(result.status);
```

Cùng ứng dụng đó nên có thể dùng một phiên bền vững:

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

Ghi chú triển khai hiện tại: `@openclaw/sdk` bắt đầu với bề mặt dựa trên Gateway
đang tồn tại hôm nay. Tham chiếu model có provider như
`openai/gpt-5.5` được tách thành override `provider` và `model` của Gateway.
Các lựa chọn `workspace`, `runtime`, `environment` và `approvals` theo từng lượt chạy
vẫn là mục tiêu thiết kế; client ném lỗi khi caller đặt chúng để yêu cầu không
âm thầm thực thi với giá trị mặc định. Helper tác vụ, artifact, môi trường và gọi công cụ
chung cũng được dựng khung làm hình thái API tương lai và ném lỗi không hỗ trợ
tường minh cho đến khi có RPC Gateway cho chúng.

Và cùng API đó nên có thể dùng một harness ACP bên ngoài:

```typescript
const run = await oc.runs.create({
  input: "Deep review this repository and return only high-risk findings.",
  workspace: { cwd: process.cwd() },
  runtime: { type: "acp", harness: "claude" },
  mode: "task",
});
```

Môi trường được quản lý không nên thay đổi API cấp cao nhất:

```typescript
const run = await agent.run({
  input: "Run the full changed gate and summarize failures.",
  workspace: { repo: "openclaw/openclaw", ref: "main" },
  runtime: {
    type: "managed",
    provider: "testbox",
    timeoutMinutes: 90,
  },
});
```

## Lựa chọn runtime

SDK ứng dụng nên phơi bày lựa chọn runtime dưới dạng một union chuẩn hóa:

```typescript
type RuntimeSelection =
  | "auto"
  | { type: "embedded"; id: "pi" | "codex" | string }
  | { type: "cli"; id: "claude-cli" | string }
  | { type: "acp"; harness: "claude" | "cursor" | "gemini" | "opencode" | string }
  | { type: "managed"; provider: "local" | "node" | "testbox" | "cloud" | string };
```

Quy tắc:

- `auto` tuân theo các quy tắc lựa chọn runtime của OpenClaw.
- `embedded` nhắm tới harness trong tiến trình đáng tin cậy được đăng ký thông qua SDK Plugin,
  như `pi` hoặc `codex`.
- `cli` nhắm tới thực thi backend CLI do OpenClaw sở hữu khi có sẵn.
- `acp` nhắm tới harness bên ngoài thông qua ACP/acpx.
- `managed` nhắm tới một provider môi trường và vẫn có thể chạy runtime nhúng,
  CLI hoặc ACP bên trong môi trường đó.

Đối tượng lựa chọn runtime nên mang tính mô tả. Nó không nên là nơi
ẩn cách xử lý bí mật, chính sách sandbox hoặc cấp phát workspace.

## Mô hình môi trường

Môi trường là nền thực thi. Nó nên được tường minh vì lượt chạy CLI cục bộ,
harness bên ngoài, host node và workspace đám mây có các đặc tính an toàn
và vòng đời khác nhau.

```typescript
type EnvironmentSelection =
  | { type: "local"; cwd?: string }
  | { type: "gateway"; url?: string; cwd?: string }
  | { type: "node"; nodeId: string; cwd?: string }
  | { type: "managed"; provider: string; repo?: string; ref?: string }
  | { type: "ephemeral"; provider: string; repo?: string; ref?: string };
```

Môi trường sở hữu:

- chuẩn bị checkout hoặc workspace
- quyền truy cập tiến trình và tệp
- thực thi sandbox và mạng
- biến môi trường và tham chiếu bí mật
- log, trace và artifact
- dọn dẹp và lưu giữ
- tính sẵn có của runtime

Sự tách biệt này khiến agent được quản lý trở thành một phần mở rộng tự nhiên của SDK. Một agent được quản lý
là một lượt chạy bình thường trong môi trường được quản lý, không phải một nhánh sản phẩm đặc biệt.

Các hợp đồng chi tiết về namespace, sự kiện, kết quả, phê duyệt, artifact, bảo mật, package
và provider môi trường nằm trong
[Thiết kế API SDK OpenClaw](/vi/reference/openclaw-sdk-api-design).

## Kế hoạch sổ tay

SDK nên đi kèm sổ tay, không chỉ tài liệu tham chiếu.

Ví dụ được khuyến nghị:

| Ví dụ                        | Minh họa                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Khởi động nhanh              | Tạo client, chạy một tác tử, stream đầu ra, chờ kết quả.                                     |
| CLI tác tử lập trình         | Workspace cục bộ, bộ chọn mô hình, hủy, phê duyệt, đầu ra JSON.                              |
| Bảng điều khiển tác tử       | Phiên, lượt chạy, tác vụ nền, artifact, phát lại sự kiện, bộ lọc trạng thái.                 |
| Trình dựng ứng dụng          | Tác tử chỉnh sửa workspace trong khi máy chủ xem trước chạy bên cạnh.                        |
| Trình review pull request    | Chạy với một ref kho lưu trữ, thu thập nhận xét diff và artifact.                            |
| Bảng điều khiển phê duyệt    | Đăng ký nhận phê duyệt và phản hồi chúng từ UI.                                              |
| Trình chạy harness ACP       | Chạy Claude Code, Cursor, Gemini CLI hoặc OpenCode qua ACP bằng cùng API `Run`.              |
| Nhà cung cấp môi trường quản lý | Nhà cung cấp tối thiểu chuẩn bị workspace, stream sự kiện, lưu artifact và dọn dẹp.       |
| Cầu nối Slack hoặc Discord   | Ứng dụng bên ngoài nhận sự kiện và đăng tóm tắt tiến độ mà không trở thành Plugin kênh.      |
| Nghiên cứu đa tác tử         | Tạo các lượt chạy song song, thu thập artifact và tổng hợp báo cáo cuối cùng.                |

Các ví dụ cookbook nên dùng API cấp cao trước. Ví dụ client được tạo ở cấp thấp
thuộc về một phần nâng cao.

## Triển khai theo giai đoạn

### Giai đoạn 0: RFC và từ vựng

- Thống nhất các danh từ và tên công khai.
- Quyết định tên gói.
- Định nghĩa phân loại sự kiện đầu tiên.
- Đánh dấu plugin SDK hiện tại là tách biệt có chủ đích trong tài liệu.

### Giai đoạn 1: Client được tạo ở cấp thấp

- Tạo client TypeScript từ các schema giao thức Gateway.
- Bao phủ `agent`, `agent.wait`, phiên, đăng ký, hủy và tác vụ trước.
- Thêm smoke test để xác nhận các phương thức được tạo khớp với tên phương thức Gateway và hình dạng schema.
- Phát hành dưới dạng gói thử nghiệm hoặc nội bộ.

### Giai đoạn 2: API run cấp cao

- Thêm `OpenClaw`, `Agent`, `Session` và `Run`.
- Hỗ trợ `run.events()`, `run.wait()` và `run.cancel()`.
- Hỗ trợ phát hiện Gateway cục bộ và URL Gateway tường minh.
- Hỗ trợ phiên bền vững và gửi phiên.

### Giai đoạn 3: Phép chiếu sự kiện đã chuẩn hóa

- Thêm phép chiếu sự kiện đã chuẩn hóa phía Gateway bên cạnh các sự kiện thô hiện có.
- Giữ lại sự kiện runtime thô khi chính sách cho phép.
- Thêm con trỏ phát lại và hành vi kết nối lại.
- Ánh xạ các sự kiện PI, Codex, ACP và tác vụ vào phân loại ổn định.

### Giai đoạn 4: Artifact và phê duyệt

- Thêm danh sách và tải xuống artifact.
- Thêm helper đăng ký và phản hồi phê duyệt.
- Thêm helper đăng ký và phản hồi câu hỏi.
- Thêm cookbook bảng điều khiển phê duyệt.

### Giai đoạn 5: Nhà cung cấp môi trường

- Giới thiệu các hợp đồng nhà cung cấp môi trường cục bộ, Node và quản lý.
- Bắt đầu với một môi trường đã tồn tại trong vận hành.
- Thêm chuẩn bị workspace, nhật ký, artifact, thời gian chờ, dọn dẹp và lưu giữ.

### Giai đoạn 6: Quy trình làm việc kiểu cloud

- Thêm lượt chạy hướng theo kho lưu trữ và nhánh.
- Thêm artifact pull request.
- Thêm bảng lượt chạy được nhóm theo repo, nhánh, trạng thái và người được giao.
- Thêm phiên quản lý chạy dài và chính sách lưu giữ.

## Lựa chọn thiết kế nên sao chép

Sao chép các ý tưởng này:

- Từ Cursor: `Agent` cộng với `Run`, tính đối xứng giữa cục bộ và cloud, phát hiện mô hình,
  artifact và onboarding dựa trên cookbook.
- Từ Claude Agent SDK: client hai chiều, ngắt, quyền, hook,
  công cụ tùy chỉnh, kho lưu phiên và ngữ nghĩa tiếp tục.
- Từ OpenAI Agents: chuyển giao, guardrail, tiếp tục phê duyệt của con người, tracing và
  đối tượng kết quả stream có cấu trúc.
- Từ Google ADK: dịch vụ phía sau runner, hành động sự kiện, bộ nhớ, artifact,
  dịch vụ thông tin xác thực và Plugin chặn quanh vòng đời lượt chạy.
- Từ OpenCode: client giao thức được tạo, REST cộng SSE, phiên,
  workspace, câu hỏi, quyền, tệp, VCS, PTY, MCP, tác tử và Skills.
- Từ Codex: sandbox, phê duyệt, mạng, thực thi cục bộ và từ xa tường minh, và
  ranh giới luồng máy chủ ứng dụng.
- Từ ACP và acpx: khả năng tương tác harness bên ngoài dựa trên adapter và
  hàng đợi prompt có tên.

## Lựa chọn thiết kế cần tránh

Tránh các bẫy này:

- SDK công khai chỉ là bản đổ mỏng của nội bộ Gateway.
- SDK công khai import các subpath của plugin SDK.
- SDK công khai nơi sự kiện chỉ là `stream` cộng với `data`.
- API ưu tiên cloud khiến OpenClaw cục bộ có cảm giác như chế độ kế thừa.
- Lựa chọn runtime bị ẩn trong tiền tố id mô hình.
- Chuyển tiếp bí mật bị ẩn trong map môi trường.
- Tùy chọn riêng của ACP ở cấp cao nhất của mọi lượt chạy.
- Cờ sandbox không thể được runtime đã chọn thực thi.
- Một đối tượng SDK cố gắng vừa là Plugin nhà cung cấp, Plugin kênh, client ứng dụng,
  vừa là runner quản lý cùng lúc.

## Câu hỏi mở

- Gói ban đầu nên nằm trong repo này hay một repo SDK riêng?
- Client cấp thấp được tạo có nên được phát hành công khai trước khi
  wrapper cấp cao ổn định không?
- Cơ chế xác thực ứng dụng được hỗ trợ đầu tiên là gì: token cục bộ, token quản trị,
  luồng thiết bị OAuth hay đăng ký ứng dụng đã ký?
- SDK nên mặc định hiển thị bao nhiêu lịch sử tin nhắn phiên?
- Môi trường quản lý chỉ nên được cấu hình trong cấu hình Gateway, hay caller SDK
  có thể yêu cầu trực tiếp bằng token có phạm vi?
- Quy tắc lưu giữ nào áp dụng cho artifact được tạo bởi lượt chạy cục bộ?
- Payload sự kiện nào cần được biên tập trước khi gửi cho ứng dụng?
- `Run` nên bao phủ các lượt chat thông thường và tác vụ tách rời, hay công việc nền
  tách rời luôn nên trả về wrapper `Task` với `Run` lồng bên trong?

## Tài liệu liên quan

- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác tử phụ](/vi/tools/subagents)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

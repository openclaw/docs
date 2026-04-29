---
read_when:
    - Bạn muốn các quy trình công việc nhiều bước có tính xác định với các phê duyệt rõ ràng
    - Bạn cần tiếp tục một quy trình làm việc mà không chạy lại các bước trước đó
summary: Runtime quy trình công việc có kiểu cho OpenClaw với các cổng phê duyệt có thể tiếp tục.
title: Tôm hùm
x-i18n:
    generated_at: "2026-04-29T23:19:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster là một workflow shell cho phép OpenClaw chạy các chuỗi công cụ nhiều bước như một thao tác đơn lẻ, xác định, với các điểm kiểm tra phê duyệt rõ ràng.

Lobster là một lớp soạn thảo phía trên công việc nền tách rời. Để điều phối luồng phía trên các tác vụ riêng lẻ, xem [Task Flow](/vi/automation/taskflow) (`openclaw tasks flow`). Để xem sổ cái hoạt động tác vụ, xem [`openclaw tasks`](/vi/automation/tasks).

## Hook

Trợ lý của bạn có thể xây dựng các công cụ tự quản lý chính nó. Hãy yêu cầu một workflow, và 30 phút sau bạn có một CLI cùng các pipeline chạy trong một lệnh gọi duy nhất. Lobster là mảnh ghép còn thiếu: các pipeline xác định, phê duyệt rõ ràng, và trạng thái có thể tiếp tục.

## Vì sao

Hiện nay, các workflow phức tạp cần nhiều lượt gọi công cụ qua lại. Mỗi lệnh gọi tốn token, và LLM phải điều phối từng bước. Lobster chuyển phần điều phối đó vào một runtime có kiểu:

- **Một lệnh gọi thay vì nhiều lệnh gọi**: OpenClaw chạy một lệnh gọi công cụ Lobster và nhận kết quả có cấu trúc.
- **Phê duyệt tích hợp sẵn**: Các hiệu ứng phụ (gửi email, đăng bình luận) sẽ tạm dừng workflow cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: Các workflow bị tạm dừng trả về một token; phê duyệt và tiếp tục mà không cần chạy lại mọi thứ.

## Vì sao dùng DSL thay vì chương trình thông thường?

Lobster được cố ý thiết kế nhỏ gọn. Mục tiêu không phải là "một ngôn ngữ mới", mà là một đặc tả pipeline dễ dự đoán, thân thiện với AI, có phê duyệt hạng nhất và token tiếp tục.

- **Phê duyệt/tiếp tục được tích hợp sẵn**: Một chương trình bình thường có thể nhắc con người, nhưng không thể _tạm dừng và tiếp tục_ bằng một token bền vững nếu bạn không tự phát minh runtime đó.
- **Tính xác định + khả năng kiểm toán**: Pipeline là dữ liệu, nên dễ ghi log, so sánh diff, phát lại và rà soát.
- **Bề mặt bị giới hạn cho AI**: Một ngữ pháp nhỏ + JSON piping giảm các đường đi mã “sáng tạo” và giúp việc xác thực trở nên thực tế.
- **Chính sách an toàn được tích hợp**: Thời gian chờ, giới hạn đầu ra, kiểm tra sandbox, và allowlist được runtime thực thi, không phải từng script.
- **Vẫn lập trình được**: Mỗi bước có thể gọi bất kỳ CLI hoặc script nào. Nếu bạn muốn JS/TS, hãy sinh các tệp `.lobster` từ mã.

## Cách hoạt động

OpenClaw chạy các workflow Lobster **trong tiến trình** bằng một runner nhúng. Không có subprocess CLI bên ngoài nào được sinh ra; engine workflow thực thi bên trong tiến trình gateway và trả về trực tiếp một phong bì JSON.
Nếu pipeline tạm dừng để phê duyệt, công cụ trả về một `resumeToken` để bạn có thể tiếp tục sau.

## Mẫu: CLI nhỏ + JSON pipe + phê duyệt

Xây dựng các lệnh nhỏ giao tiếp bằng JSON, rồi nối chúng thành một lệnh gọi Lobster duy nhất. (Các tên lệnh ví dụ bên dưới — thay bằng tên của bạn.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Nếu pipeline yêu cầu phê duyệt, hãy tiếp tục bằng token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI kích hoạt workflow; Lobster thực thi các bước. Các cổng phê duyệt giữ cho hiệu ứng phụ rõ ràng và có thể kiểm toán.

Ví dụ: ánh xạ các mục đầu vào thành các lệnh gọi công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Các bước LLM chỉ dùng JSON (llm-task)

Đối với các workflow cần một **bước LLM có cấu trúc**, hãy bật công cụ plugin tùy chọn
`llm-task` và gọi nó từ Lobster. Cách này giữ workflow
xác định trong khi vẫn cho phép bạn phân loại/tóm tắt/soạn nháp bằng mô hình.

Bật công cụ:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Dùng nó trong một pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Xem [LLM Task](/vi/tools/llm-task) để biết chi tiết và các tùy chọn cấu hình.

## Tệp workflow (.lobster)

Lobster có thể chạy các tệp workflow YAML/JSON với các trường `name`, `args`, `steps`, `env`, `condition`, và `approval`. Trong các lệnh gọi công cụ OpenClaw, đặt `pipeline` thành đường dẫn tệp.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Ghi chú:

- `stdin: $step.stdout` và `stdin: $step.json` truyền đầu ra của một bước trước đó.
- `condition` (hoặc `when`) có thể chặn/mở các bước dựa trên `$step.approved`.

## Cài đặt Lobster

Các workflow Lobster đi kèm chạy trong tiến trình; không cần binary `lobster` riêng. Runner nhúng được phát hành cùng plugin Lobster.

Nếu bạn cần CLI Lobster độc lập để phát triển hoặc chạy pipeline bên ngoài, hãy cài đặt từ [repo Lobster](https://github.com/openclaw/lobster) và đảm bảo `lobster` nằm trong `PATH`.

## Bật công cụ

Lobster là một công cụ plugin **tùy chọn** (không được bật mặc định).

Khuyến nghị (bổ sung, an toàn):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Hoặc theo từng agent:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Tránh dùng `tools.allow: ["lobster"]` trừ khi bạn có ý định chạy ở chế độ allowlist hạn chế.

<Note>
Allowlist là cơ chế chọn bật cho các plugin tùy chọn. Nếu allowlist của bạn chỉ nêu tên các công cụ plugin (như `lobster`), OpenClaw vẫn giữ các công cụ lõi được bật. Để hạn chế các công cụ lõi, hãy đưa cả các công cụ lõi hoặc nhóm công cụ bạn muốn vào allowlist.
</Note>

## Ví dụ: Phân loại email

Không dùng Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Dùng Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Trả về một phong bì JSON (đã rút gọn):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

Người dùng phê duyệt → tiếp tục:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Một workflow. Xác định. An toàn.

## Tham số công cụ

### `run`

Chạy một pipeline ở chế độ công cụ.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Chạy một tệp workflow với args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Tiếp tục một workflow đã tạm dừng sau khi phê duyệt.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Đầu vào tùy chọn

- `cwd`: Thư mục làm việc tương đối cho pipeline (phải nằm trong thư mục làm việc của gateway).
- `timeoutMs`: Hủy workflow nếu vượt quá khoảng thời gian này (mặc định: 20000).
- `maxStdoutBytes`: Hủy workflow nếu đầu ra vượt quá kích thước này (mặc định: 512000).
- `argsJson`: Chuỗi JSON được truyền cho `lobster run --args-json` (chỉ với tệp workflow).

## Phong bì đầu ra

Lobster trả về một phong bì JSON với một trong ba trạng thái:

- `ok` → hoàn tất thành công
- `needs_approval` → đã tạm dừng; cần `requiresApproval.resumeToken` để tiếp tục
- `cancelled` → bị từ chối hoặc hủy rõ ràng

Công cụ hiển thị phong bì trong cả `content` (JSON được trình bày đẹp) và `details` (đối tượng thô).

## Phê duyệt

Nếu có `requiresApproval`, hãy xem prompt và quyết định:

- `approve: true` → tiếp tục và thực hiện các hiệu ứng phụ
- `approve: false` → hủy và hoàn tất workflow

Dùng `approve --preview-from-stdin --limit N` để đính kèm bản xem trước JSON vào các yêu cầu phê duyệt mà không cần keo nối jq/heredoc tùy chỉnh. Token tiếp tục hiện đã gọn: Lobster lưu trạng thái tiếp tục workflow trong thư mục trạng thái của nó và trả lại một khóa token nhỏ.

## OpenProse

OpenProse kết hợp tốt với Lobster: dùng `/prose` để điều phối phần chuẩn bị đa agent, rồi chạy một pipeline Lobster cho các phê duyệt xác định. Nếu một chương trình Prose cần Lobster, hãy cho phép công cụ `lobster` cho các sub-agent qua `tools.subagents.tools`. Xem [OpenProse](/vi/prose).

## An toàn

- **Chỉ cục bộ trong tiến trình** — workflow thực thi bên trong tiến trình gateway; bản thân plugin không thực hiện lệnh gọi mạng.
- **Không chứa bí mật** — Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw làm việc đó.
- **Nhận biết sandbox** — bị tắt khi ngữ cảnh công cụ đang ở trong sandbox.
- **Được gia cố** — thời gian chờ và giới hạn đầu ra được runner nhúng thực thi.

## Khắc phục sự cố

- **`lobster timed out`** → tăng `timeoutMs`, hoặc tách một pipeline dài.
- **`lobster output exceeded maxStdoutBytes`** → tăng `maxStdoutBytes` hoặc giảm kích thước đầu ra.
- **`lobster returned invalid JSON`** → đảm bảo pipeline chạy ở chế độ công cụ và chỉ in JSON.
- **`lobster failed`** → kiểm tra log gateway để xem chi tiết lỗi của runner nhúng.

## Tìm hiểu thêm

- [Plugins](/vi/tools/plugin)
- [Soạn thảo công cụ plugin](/vi/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu tình huống: workflow cộng đồng

Một ví dụ công khai: một CLI “second brain” + các pipeline Lobster quản lý ba kho Markdown (cá nhân, đối tác, dùng chung). CLI phát JSON cho thống kê, danh sách inbox, và quét nội dung cũ; Lobster nối các lệnh đó thành các workflow như `weekly-review`, `inbox-triage`, `memory-consolidation`, và `shared-task-sync`, mỗi workflow đều có cổng phê duyệt. AI xử lý phán đoán (phân loại) khi có sẵn và rơi về các quy tắc xác định khi không có.

- Chủ đề: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) — lên lịch các workflow Lobster
- [Tổng quan Tự động hóa](/vi/automation) — tất cả cơ chế tự động hóa
- [Tổng quan Công cụ](/vi/tools) — tất cả công cụ agent có sẵn

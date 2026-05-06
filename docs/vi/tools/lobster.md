---
read_when:
    - Bạn muốn các quy trình làm việc nhiều bước có tính xác định với các phê duyệt tường minh
    - Bạn cần tiếp tục một quy trình làm việc mà không chạy lại các bước trước đó
summary: Môi trường chạy quy trình làm việc có kiểu cho OpenClaw với các cổng phê duyệt có thể tiếp tục.
title: Tôm hùm
x-i18n:
    generated_at: "2026-05-06T09:33:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster là một shell quy trình làm việc cho phép OpenClaw chạy các chuỗi công cụ nhiều bước như một thao tác duy nhất, xác định, với các điểm kiểm tra phê duyệt rõ ràng.

Lobster là một lớp soạn thảo nằm trên công việc nền tách rời. Để điều phối luồng phía trên từng tác vụ riêng lẻ, hãy xem [Task Flow](/vi/automation/taskflow) (`openclaw tasks flow`). Để xem sổ cái hoạt động tác vụ, hãy xem [`openclaw tasks`](/vi/automation/tasks).

## Hook

Trợ lý của bạn có thể xây dựng các công cụ tự quản lý chính nó. Yêu cầu một quy trình làm việc, và 30 phút sau bạn có một CLI cùng các pipeline chạy trong một lần gọi. Lobster là mảnh ghép còn thiếu: pipeline xác định, phê duyệt rõ ràng và trạng thái có thể tiếp tục.

## Lý do

Hiện nay, các quy trình làm việc phức tạp cần nhiều lần gọi công cụ qua lại. Mỗi lần gọi tốn token, và LLM phải điều phối từng bước. Lobster chuyển phần điều phối đó vào một runtime có kiểu:

- **Một lần gọi thay vì nhiều lần**: OpenClaw chạy một lệnh gọi công cụ Lobster và nhận kết quả có cấu trúc.
- **Tích hợp sẵn phê duyệt**: Tác dụng phụ (gửi email, đăng bình luận) dừng quy trình làm việc cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: Quy trình làm việc bị dừng trả về một token; phê duyệt và tiếp tục mà không chạy lại mọi thứ.

## Vì sao dùng DSL thay vì chương trình thông thường?

Lobster được thiết kế nhỏ gọn. Mục tiêu không phải là "một ngôn ngữ mới", mà là một đặc tả pipeline dễ dự đoán, thân thiện với AI, có phê duyệt hạng nhất và token tiếp tục.

- **Phê duyệt/tiếp tục được tích hợp sẵn**: Một chương trình bình thường có thể nhắc con người, nhưng không thể _tạm dừng và tiếp tục_ bằng token bền vững nếu bạn không tự phát minh runtime đó.
- **Tính xác định + khả năng kiểm toán**: Pipeline là dữ liệu, nên dễ ghi log, so sánh diff, phát lại và rà soát.
- **Bề mặt ràng buộc cho AI**: Ngữ pháp nhỏ + truyền JSON giúp giảm các đường đi mã "sáng tạo" và làm cho việc xác thực trở nên thực tế.
- **Chính sách an toàn được tích hợp**: Timeout, giới hạn đầu ra, kiểm tra sandbox và allowlist được runtime thực thi, không phải từng script.
- **Vẫn có thể lập trình**: Mỗi bước có thể gọi bất kỳ CLI hoặc script nào. Nếu bạn muốn JS/TS, hãy tạo các tệp `.lobster` từ mã.

## Cách hoạt động

OpenClaw chạy quy trình làm việc Lobster **trong tiến trình** bằng runner nhúng. Không có subprocess CLI bên ngoài nào được sinh ra; engine quy trình làm việc thực thi bên trong tiến trình Gateway và trả trực tiếp về một phong bì JSON.
Nếu pipeline tạm dừng để phê duyệt, công cụ trả về một `resumeToken` để bạn có thể tiếp tục sau.

## Mẫu: CLI nhỏ + ống JSON + phê duyệt

Xây dựng các lệnh nhỏ giao tiếp bằng JSON, rồi nối chúng thành một lần gọi Lobster duy nhất. (Các tên lệnh ví dụ bên dưới - thay bằng lệnh của bạn.)

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

Nếu pipeline yêu cầu phê duyệt, tiếp tục bằng token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI kích hoạt quy trình làm việc; Lobster thực thi các bước. Cổng phê duyệt giữ cho tác dụng phụ rõ ràng và có thể kiểm toán.

Ví dụ: ánh xạ các mục đầu vào thành lệnh gọi công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Các bước LLM chỉ dùng JSON (llm-task)

Đối với quy trình làm việc cần một **bước LLM có cấu trúc**, hãy bật công cụ plugin tùy chọn
`llm-task` và gọi nó từ Lobster. Cách này giữ quy trình làm việc
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
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

Dùng nó trong pipeline:

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

## Tệp quy trình làm việc (.lobster)

Lobster có thể chạy các tệp quy trình làm việc YAML/JSON với các trường `name`, `args`, `steps`, `env`, `condition` và `approval`. Trong lệnh gọi công cụ OpenClaw, đặt `pipeline` thành đường dẫn tệp.

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
- `condition` (hoặc `when`) có thể chặn/mở bước dựa trên `$step.approved`.

## Cài đặt Lobster

Các quy trình làm việc Lobster đi kèm chạy trong tiến trình; không cần binary `lobster` riêng. Runner nhúng được phân phối cùng plugin Lobster.

Nếu bạn cần CLI Lobster độc lập để phát triển hoặc cho pipeline bên ngoài, hãy cài đặt từ [repo Lobster](https://github.com/openclaw/lobster) và bảo đảm `lobster` nằm trên `PATH`.

## Bật công cụ

Lobster là một công cụ plugin **tùy chọn** (không bật theo mặc định).

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

Tránh dùng `tools.allow: ["lobster"]` trừ khi bạn định chạy ở chế độ allowlist hạn chế.

<Note>
Allowlist là tùy chọn bật rõ ràng cho các plugin tùy chọn. `alsoAllow` chỉ bật các công cụ plugin tùy chọn được đặt tên trong khi vẫn giữ bộ công cụ lõi bình thường. Để hạn chế công cụ lõi, hãy dùng `tools.allow` với các công cụ lõi hoặc nhóm bạn muốn.
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

Một quy trình làm việc. Xác định. An toàn.

## Tham số công cụ

### `run`

Chạy pipeline ở chế độ công cụ.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Chạy tệp quy trình làm việc với đối số:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Tiếp tục một quy trình làm việc đã dừng sau khi phê duyệt.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Đầu vào tùy chọn

- `cwd`: Thư mục làm việc tương đối cho pipeline (phải nằm trong thư mục làm việc của Gateway).
- `timeoutMs`: Hủy quy trình làm việc nếu vượt quá thời lượng này (mặc định: 20000).
- `maxStdoutBytes`: Hủy quy trình làm việc nếu đầu ra vượt quá kích thước này (mặc định: 512000).
- `argsJson`: Chuỗi JSON được truyền cho `lobster run --args-json` (chỉ tệp quy trình làm việc).

## Phong bì đầu ra

Lobster trả về một phong bì JSON với một trong ba trạng thái:

- `ok` → hoàn tất thành công
- `needs_approval` → đã tạm dừng; cần `requiresApproval.resumeToken` để tiếp tục
- `cancelled` → bị từ chối hoặc hủy rõ ràng

Công cụ hiển thị phong bì trong cả `content` (JSON định dạng đẹp) và `details` (đối tượng thô).

## Phê duyệt

Nếu có `requiresApproval`, hãy xem lời nhắc và quyết định:

- `approve: true` → tiếp tục và thực hiện tác dụng phụ
- `approve: false` → hủy và hoàn tất quy trình làm việc

Dùng `approve --preview-from-stdin --limit N` để đính kèm bản xem trước JSON vào yêu cầu phê duyệt mà không cần glue jq/heredoc tùy chỉnh. Token tiếp tục hiện đã gọn: Lobster lưu trạng thái tiếp tục quy trình làm việc trong thư mục trạng thái của nó và trả lại một khóa token nhỏ.

## OpenProse

OpenProse kết hợp tốt với Lobster: dùng `/prose` để điều phối chuẩn bị đa agent, sau đó chạy một pipeline Lobster để có phê duyệt xác định. Nếu một chương trình Prose cần Lobster, hãy cho phép công cụ `lobster` cho sub-agent qua `tools.subagents.tools`. Xem [OpenProse](/vi/prose).

## An toàn

- **Chỉ cục bộ trong tiến trình** - quy trình làm việc thực thi bên trong tiến trình Gateway; bản thân plugin không gọi mạng.
- **Không có bí mật** - Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw làm việc đó.
- **Nhận biết sandbox** - bị tắt khi ngữ cảnh công cụ đang ở trong sandbox.
- **Được gia cố** - timeout và giới hạn đầu ra được runner nhúng thực thi.

## Khắc phục sự cố

- **`lobster timed out`** → tăng `timeoutMs`, hoặc tách pipeline dài.
- **`lobster output exceeded maxStdoutBytes`** → tăng `maxStdoutBytes` hoặc giảm kích thước đầu ra.
- **`lobster returned invalid JSON`** → bảo đảm pipeline chạy ở chế độ công cụ và chỉ in JSON.
- **`lobster failed`** → kiểm tra log Gateway để biết chi tiết lỗi runner nhúng.

## Tìm hiểu thêm

- [Plugin](/vi/tools/plugin)
- [Soạn thảo công cụ Plugin](/vi/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu tình huống: quy trình làm việc cộng đồng

Một ví dụ công khai: một CLI "second brain" + pipeline Lobster quản lý ba kho Markdown (cá nhân, đối tác, dùng chung). CLI phát JSON cho thống kê, danh sách hộp thư đến và quét mục cũ; Lobster nối các lệnh đó thành các quy trình làm việc như `weekly-review`, `inbox-triage`, `memory-consolidation` và `shared-task-sync`, mỗi quy trình có cổng phê duyệt. AI xử lý phần phán đoán (phân loại) khi có sẵn và quay về quy tắc xác định khi không có.

- Chủ đề: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Liên quan

- [Tự động hóa & Tác vụ](/vi/automation) - lập lịch quy trình làm việc Lobster
- [Tổng quan về tự động hóa](/vi/automation) - tất cả cơ chế tự động hóa
- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ agent hiện có

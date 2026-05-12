---
read_when:
    - Bạn muốn các quy trình làm việc nhiều bước có tính tất định với các phê duyệt rõ ràng
    - Bạn cần tiếp tục một quy trình làm việc mà không chạy lại các bước trước đó
summary: Môi trường chạy quy trình công việc có kiểu cho OpenClaw với các cổng phê duyệt có thể tiếp tục.
title: Tôm hùm
x-i18n:
    generated_at: "2026-05-12T01:00:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster là một shell quy trình làm việc cho phép OpenClaw chạy các chuỗi công cụ nhiều bước như một thao tác đơn lẻ, xác định được, với các điểm kiểm tra phê duyệt rõ ràng.

Lobster là một lớp soạn thảo nằm trên công việc nền tách rời. Để điều phối luồng ở cấp cao hơn các tác vụ riêng lẻ, hãy xem [Luồng tác vụ](/vi/automation/taskflow) (`openclaw tasks flow`). Để xem sổ cái hoạt động tác vụ, hãy xem [`openclaw tasks`](/vi/automation/tasks).

## Móc

Trợ lý của bạn có thể xây dựng các công cụ tự quản lý chính nó. Yêu cầu một quy trình làm việc, và 30 phút sau bạn có một CLI cùng các pipeline chạy như một lệnh gọi duy nhất. Lobster là mảnh ghép còn thiếu: pipeline xác định được, phê duyệt rõ ràng, và trạng thái có thể tiếp tục.

## Lý do

Hiện nay, các quy trình làm việc phức tạp cần nhiều lệnh gọi công cụ qua lại. Mỗi lệnh gọi tốn token, và LLM phải điều phối từng bước. Lobster chuyển việc điều phối đó vào một runtime có kiểu:

- **Một lệnh gọi thay vì nhiều lệnh gọi**: OpenClaw chạy một lệnh gọi công cụ Lobster và nhận kết quả có cấu trúc.
- **Tích hợp phê duyệt**: Tác dụng phụ (gửi email, đăng bình luận) tạm dừng quy trình làm việc cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: Quy trình làm việc bị tạm dừng trả về một token; phê duyệt và tiếp tục mà không cần chạy lại mọi thứ.

## Vì sao dùng DSL thay vì chương trình thông thường?

Lobster được thiết kế có chủ ý là nhỏ gọn. Mục tiêu không phải là "một ngôn ngữ mới," mà là một đặc tả pipeline dễ dự đoán, thân thiện với AI, có phê duyệt hạng nhất và token tiếp tục.

- **Phê duyệt/tiếp tục được tích hợp sẵn**: Một chương trình bình thường có thể nhắc con người, nhưng không thể _tạm dừng và tiếp tục_ bằng một token bền vững nếu bạn không tự phát minh runtime đó.
- **Tính xác định + khả năng kiểm tra**: Pipeline là dữ liệu, nên dễ ghi log, diff, phát lại và xem xét.
- **Bề mặt hạn chế cho AI**: Một ngữ pháp nhỏ + truyền JSON giúp giảm các đường đi mã "sáng tạo" và làm cho việc xác thực thực tế hơn.
- **Chính sách an toàn tích hợp**: Timeout, giới hạn đầu ra, kiểm tra sandbox và allowlist được runtime thực thi, không phải từng script.
- **Vẫn có thể lập trình**: Mỗi bước có thể gọi bất kỳ CLI hoặc script nào. Nếu bạn muốn JS/TS, hãy tạo tệp `.lobster` từ mã.

## Cách hoạt động

OpenClaw chạy quy trình làm việc Lobster **trong cùng tiến trình** bằng một runner nhúng. Không có tiến trình con CLI bên ngoài nào được tạo; công cụ quy trình làm việc thực thi bên trong tiến trình Gateway và trả trực tiếp một phong bì JSON.
Nếu pipeline tạm dừng để phê duyệt, công cụ trả về `resumeToken` để bạn có thể tiếp tục sau.

## Mẫu: CLI nhỏ + pipe JSON + phê duyệt

Xây dựng các lệnh nhỏ nói bằng JSON, rồi nối chúng thành một lệnh gọi Lobster duy nhất. (Tên lệnh ví dụ bên dưới - thay bằng tên của bạn.)

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

AI kích hoạt quy trình làm việc; Lobster thực thi các bước. Cổng phê duyệt giữ cho các tác dụng phụ rõ ràng và có thể kiểm tra.

Ví dụ: ánh xạ các mục đầu vào thành lệnh gọi công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Các bước LLM chỉ dùng JSON (llm-task)

Đối với quy trình làm việc cần một **bước LLM có cấu trúc**, hãy bật công cụ plugin tùy chọn
`llm-task` và gọi nó từ Lobster. Điều này giữ cho quy trình làm việc
xác định được trong khi vẫn cho phép bạn phân loại/tóm tắt/soạn nháp bằng một mô hình.

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

### Giới hạn quan trọng: Lobster nhúng so với `openclaw.invoke`

Plugin Lobster đi kèm chạy quy trình làm việc **trong cùng tiến trình** bên trong Gateway. Ở chế độ nhúng đó, `openclaw.invoke` **không** tự động kế thừa URL Gateway/ngữ cảnh xác thực cho các lệnh gọi công cụ OpenClaw CLI lồng nhau.

Điều đó có nghĩa là mẫu này **hiện không đáng tin cậy trong runner nhúng**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Chỉ dùng ví dụ bên dưới khi chạy **Lobster CLI độc lập** trong một môi trường nơi `openclaw.invoke` đã được cấu hình với ngữ cảnh Gateway/xác thực chính xác.

Dùng trong pipeline Lobster CLI độc lập:

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

Nếu hôm nay bạn đang dùng Plugin Lobster nhúng, hãy ưu tiên một trong hai cách:

- một lệnh gọi công cụ `llm-task` trực tiếp bên ngoài Lobster, hoặc
- các bước không dùng `openclaw.invoke` bên trong pipeline Lobster cho đến khi một cầu nối nhúng được hỗ trợ được thêm vào.

Xem [Tác vụ LLM](/vi/tools/llm-task) để biết chi tiết và các tùy chọn cấu hình.

## Tệp quy trình làm việc (.lobster)

Lobster có thể chạy các tệp quy trình làm việc YAML/JSON với các trường `name`, `args`, `steps`, `env`, `condition` và `approval`. Trong các lệnh gọi công cụ OpenClaw, đặt `pipeline` thành đường dẫn tệp.

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

Quy trình làm việc Lobster đi kèm chạy trong cùng tiến trình; không cần binary `lobster` riêng. Runner nhúng được phát hành cùng Plugin Lobster.

Nếu bạn cần Lobster CLI độc lập cho phát triển hoặc pipeline bên ngoài, hãy cài đặt từ [repo Lobster](https://github.com/openclaw/lobster) và đảm bảo `lobster` nằm trên `PATH`.

## Bật công cụ

Lobster là một công cụ Plugin **tùy chọn** (không được bật mặc định).

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
Allowlist là tùy chọn bật riêng cho các Plugin tùy chọn. `alsoAllow` chỉ bật các công cụ Plugin tùy chọn được nêu tên trong khi giữ nguyên bộ công cụ lõi bình thường. Để hạn chế công cụ lõi, hãy dùng `tools.allow` với các công cụ hoặc nhóm lõi bạn muốn.
</Note>

## Ví dụ: Phân loại email

Không có Lobster:

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

Có Lobster:

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

Một quy trình làm việc. Xác định được. An toàn.

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

Chạy tệp quy trình làm việc với đối số:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Tiếp tục một quy trình làm việc đã tạm dừng sau khi phê duyệt.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Đầu vào tùy chọn

- `cwd`: Thư mục làm việc tương đối cho pipeline (phải nằm trong thư mục làm việc của Gateway).
- `timeoutMs`: Hủy quy trình làm việc nếu vượt quá khoảng thời gian này (mặc định: 20000).
- `maxStdoutBytes`: Hủy quy trình làm việc nếu đầu ra vượt quá kích thước này (mặc định: 512000).
- `argsJson`: Chuỗi JSON truyền cho `lobster run --args-json` (chỉ tệp quy trình làm việc).

## Phong bì đầu ra

Lobster trả về một phong bì JSON với một trong ba trạng thái:

- `ok` → hoàn tất thành công
- `needs_approval` → đã tạm dừng; cần `requiresApproval.resumeToken` để tiếp tục
- `cancelled` → bị từ chối rõ ràng hoặc bị hủy

Công cụ hiển thị phong bì trong cả `content` (JSON được định dạng đẹp) và `details` (đối tượng thô).

## Phê duyệt

Nếu có `requiresApproval`, hãy kiểm tra lời nhắc và quyết định:

- `approve: true` → tiếp tục và thực hiện các tác dụng phụ
- `approve: false` → hủy và hoàn tất quy trình làm việc

Dùng `approve --preview-from-stdin --limit N` để đính kèm bản xem trước JSON vào yêu cầu phê duyệt mà không cần keo nối jq/heredoc tùy chỉnh. Token tiếp tục hiện đã gọn: Lobster lưu trạng thái tiếp tục quy trình làm việc trong thư mục trạng thái của nó và trả về một khóa token nhỏ.

## OpenProse

OpenProse kết hợp tốt với Lobster: dùng `/prose` để điều phối chuẩn bị đa agent, sau đó chạy pipeline Lobster cho các phê duyệt xác định được. Nếu một chương trình Prose cần Lobster, hãy cho phép công cụ `lobster` cho sub-agent qua `tools.subagents.tools`. Xem [OpenProse](/vi/prose).

## An toàn

- **Chỉ cục bộ trong cùng tiến trình** - quy trình làm việc thực thi bên trong tiến trình Gateway; bản thân Plugin không thực hiện lệnh gọi mạng.
- **Không có bí mật** - Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw làm việc đó.
- **Nhận biết sandbox** - bị tắt khi ngữ cảnh công cụ đang ở trong sandbox.
- **Được gia cố** - timeout và giới hạn đầu ra được runner nhúng thực thi.

## Khắc phục sự cố

- **`lobster timed out`** → tăng `timeoutMs`, hoặc tách pipeline dài.
- **`lobster output exceeded maxStdoutBytes`** → tăng `maxStdoutBytes` hoặc giảm kích thước đầu ra.
- **`lobster returned invalid JSON`** → đảm bảo pipeline chạy ở chế độ công cụ và chỉ in JSON.
- **`lobster failed`** → kiểm tra log Gateway để biết chi tiết lỗi của runner nhúng.

## Tìm hiểu thêm

- [Plugin](/vi/tools/plugin)
- [Soạn thảo công cụ Plugin](/vi/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu tình huống: quy trình làm việc cộng đồng

Một ví dụ công khai: một CLI "bộ não thứ hai" + các pipeline Lobster quản lý ba kho Markdown (cá nhân, đối tác, dùng chung). CLI phát JSON cho thống kê, danh sách hộp thư đến và quét nội dung cũ; Lobster nối các lệnh đó thành các quy trình làm việc như `weekly-review`, `inbox-triage`, `memory-consolidation` và `shared-task-sync`, mỗi quy trình đều có cổng phê duyệt. AI xử lý phán đoán (phân loại) khi có sẵn và quay về các quy tắc xác định được khi không có.

- Chủ đề: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Liên quan

- [Tự động hóa](/vi/automation) - lập lịch quy trình làm việc Lobster
- [Tổng quan tự động hóa](/vi/automation) - tất cả cơ chế tự động hóa
- [Tổng quan công cụ](/vi/tools) - tất cả công cụ agent có sẵn

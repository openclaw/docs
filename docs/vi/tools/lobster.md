---
read_when:
    - Bạn muốn các quy trình làm việc nhiều bước có tính xác định với các bước phê duyệt rõ ràng
    - Bạn cần tiếp tục một quy trình làm việc mà không chạy lại các bước trước đó
summary: Môi trường thực thi quy trình làm việc có kiểu cho OpenClaw với các cổng phê duyệt có thể tiếp tục.
title: Tôm hùm
x-i18n:
    generated_at: "2026-07-12T08:24:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster chạy các pipeline công cụ nhiều bước dưới dạng một lệnh gọi công cụ có tính xác định duy nhất, với
các điểm kiểm tra phê duyệt rõ ràng và token tiếp tục. Nó nằm cao hơn một lớp so với
công việc nền tách rời: để điều phối luồng trên nhiều tác vụ tách rời,
xem [Task Flow](/vi/automation/taskflow) (`openclaw tasks flow`); để xem sổ cái
hoạt động của tác vụ, xem [Tác vụ nền](/vi/automation/tasks).

## Tại sao

Nếu không có Lobster, một công việc nhiều bước cần nhiều lượt gọi công cụ khứ hồi,
trong đó mô hình điều phối từng bước. Lobster chuyển việc điều phối đó vào một
runtime có kiểu:

- **Một lệnh gọi thay vì nhiều lệnh gọi**: một lệnh gọi công cụ Lobster duy nhất trả về kết quả
  có cấu trúc cho toàn bộ pipeline.
- **Tích hợp sẵn phê duyệt**: các hiệu ứng phụ (gửi, đăng, xóa) tạm dừng quy trình
  cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: quy trình bị tạm dừng trả về một token; phê duyệt và tiếp tục mà không
  chạy lại các bước trước đó.

Lobster là một DSL nhỏ, có giới hạn thay vì một ngôn ngữ tập lệnh đa dụng:
phê duyệt/tiếp tục là một thành phần nguyên thủy bền vững, tích hợp sẵn; pipeline là dữ liệu (dễ
ghi nhật ký, so sánh khác biệt, phát lại, đánh giá); ngữ pháp nhỏ gọn hạn chế các đường dẫn mã "sáng tạo" để
việc xác thực luôn thực tế; thời gian chờ, giới hạn đầu ra, kiểm tra sandbox và
danh sách cho phép được runtime thực thi, không phải từng tập lệnh. Mỗi bước vẫn có thể
gọi bất kỳ CLI hoặc tập lệnh nào — hãy tạo các tệp `.lobster` từ công cụ khác nếu bạn
muốn một ngôn ngữ biên soạn phong phú hơn.

Nếu không có Lobster, việc phân loại email định kỳ sẽ như sau:

```text
Người dùng: "Kiểm tra email của tôi và soạn thư trả lời"
→ openclaw gọi gmail.list
→ LLM tóm tắt
→ Người dùng: "soạn thư trả lời cho #2 và #5"
→ LLM soạn thảo
→ Người dùng: "gửi #2"
→ openclaw gọi gmail.send
(lặp lại hằng ngày, không ghi nhớ nội dung đã được phân loại)
```

Với Lobster, cùng một công việc chỉ cần một lệnh gọi, tạm dừng để phê duyệt rồi tiếp tục:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

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

## Cách hoạt động

OpenClaw chạy các quy trình Lobster **trong tiến trình** bằng gói
`@clawdbot/lobster` đi kèm dưới dạng trình chạy nhúng. Không tạo tiến trình con
`lobster` bên ngoài; lệnh gọi công cụ trả về trực tiếp một lớp bao JSON. Nếu
pipeline tạm dừng để phê duyệt, lớp bao chứa token tiếp tục (hoặc một ID
phê duyệt ngắn) để bạn có thể tiếp tục sau.

## Bật

Lobster là một công cụ Plugin **tùy chọn**, không được bật theo mặc định. Nó được phân phối
kèm theo, vì vậy không cần bước cài đặt riêng — chỉ cần cho phép công cụ:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Hoặc theo từng tác nhân:

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

<Note>
`alsoAllow` thêm `lobster` vào hồ sơ công cụ đang hoạt động mà không
hạn chế các công cụ lõi khác. Chỉ sử dụng `tools.allow` nếu bạn muốn chế độ
danh sách cho phép hạn chế hơn.
</Note>

Công cụ bị vô hiệu hóa hoàn toàn trong các ngữ cảnh công cụ có sandbox.

Nếu cần CLI Lobster độc lập để phát triển hoặc dùng cho các pipeline bên ngoài
(nằm ngoài trình chạy gateway nhúng), hãy cài đặt từ
[kho lưu trữ Lobster](https://github.com/openclaw/lobster) và thêm `lobster` vào
`PATH`.

## Mẫu: CLI nhỏ + đường ống JSON + phê duyệt

Xây dựng các lệnh nhỏ giao tiếp bằng JSON, sau đó nối chúng thành một lệnh gọi Lobster.
(Các tên lệnh ví dụ bên dưới — hãy thay bằng lệnh của bạn.)

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

Ví dụ: ánh xạ các mục đầu vào thành các lệnh gọi công cụ:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Các bước LLM chỉ dùng JSON (llm-task)

Đối với một **bước LLM có cấu trúc** bên trong quy trình, hãy bật công cụ Plugin
`llm-task` tùy chọn và gọi nó từ Lobster:

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

Plugin Lobster đi kèm chạy các quy trình **trong tiến trình** bên trong gateway.
Trong chế độ nhúng đó, `openclaw.invoke` **không** tự động kế thừa ngữ cảnh
URL/xác thực của gateway cho các lệnh gọi công cụ CLI OpenClaw lồng nhau.

Điều đó có nghĩa là mẫu này **hiện không đáng tin cậy trong trình chạy nhúng**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Chỉ sử dụng ví dụ bên dưới khi chạy **CLI Lobster độc lập** trong một
môi trường mà `openclaw.invoke` đã được cấu hình với ngữ cảnh
gateway/xác thực chính xác.

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

Nếu hiện đang sử dụng Plugin Lobster nhúng, hãy ưu tiên một trong hai cách:

- gọi trực tiếp công cụ `llm-task` bên ngoài Lobster, hoặc
- sử dụng các bước không phải `openclaw.invoke` bên trong pipeline Lobster cho đến khi có
  cầu nối nhúng được hỗ trợ.

Xem [Tác vụ LLM](/vi/tools/llm-task) để biết chi tiết và các tùy chọn cấu hình.

## Tệp quy trình (.lobster)

Lobster có thể chạy các tệp quy trình YAML/JSON với các trường `name`, `args`, `steps`, `env`,
`condition` và `approval`. Đặt `pipeline` thành đường dẫn tệp trong lệnh gọi
công cụ.

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
- `condition` (hoặc `when`) có thể kiểm soát việc chạy bước dựa trên `$step.approved`.

## Tham số công cụ

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Chạy một tệp quy trình với các đối số:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Trường           | Mặc định    | Ghi chú                                                                                                                   |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | bắt buộc    | Chuỗi pipeline nội tuyến hoặc đường dẫn kết thúc bằng `.lobster`/`.yaml`/`.yml`/`.json` tới một tệp quy trình.             |
| `cwd`            | cwd gateway | Thư mục làm việc tương đối; phải phân giải bên trong thư mục làm việc của gateway (đường dẫn tuyệt đối sẽ bị từ chối).     |
| `timeoutMs`      | `20000`     | Hủy lượt chạy nếu vượt quá thời gian này.                                                                                 |
| `maxStdoutBytes` | `512000`    | Hủy lượt chạy nếu stdout hoặc stderr được thu thập vượt quá kích thước này.                                                |
| `argsJson`       | -           | Chuỗi JSON chứa các đối số cho tệp quy trình (bị bỏ qua đối với pipeline nội tuyến).                                       |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` chấp nhận `token` (token tiếp tục đầy đủ từ `requiresApproval`)
hoặc `approvalId` (ID ngắn từ cùng đối tượng) — hãy sử dụng giá trị mà lượt chạy
bị tạm dừng đã trả về. `approve` là bắt buộc.

### Chế độ Task Flow được quản lý

Truyền `flowControllerId` và `flowGoal` khi `run` (hoặc `flowId` và
`flowExpectedRevision` khi `resume`) sẽ điều hướng lệnh gọi qua API
[Task Flow](/vi/automation/taskflow) được quản lý của runtime Plugin thay vì trả về
một lớp bao thuần túy: OpenClaw tạo hoặc tiếp tục một bản ghi luồng bền vững, áp dụng
lớp bao Lobster cho bản ghi đó (`waiting` khi chờ phê duyệt, `succeeded`/`failed` khi
hoàn tất) và trả về `{ ok, envelope, flow, mutation }`. Chế độ này yêu cầu
một runtime Task Flow đã được liên kết và dành cho mã Plugin/bộ điều khiển cần
trạng thái luồng bền vững qua các lần khởi động lại gateway, không dành cho cách dùng tác nhân
đột xuất thông thường.

## Lớp bao đầu ra

Lobster trả về một lớp bao JSON với một trong ba trạng thái:

- `ok` — hoàn tất thành công
- `needs_approval` — tạm dừng; `requiresApproval` chứa một `resumeToken` và một
  `approvalId` ngắn, có thể dùng một trong hai để tiếp tục lượt chạy
- `cancelled` — bị từ chối hoặc hủy rõ ràng

Công cụ cung cấp lớp bao trong cả `content` (JSON được định dạng đẹp) và `details`
(đối tượng thô).

## Phê duyệt

Nếu có `requiresApproval`, hãy kiểm tra lời nhắc và quyết định:

- `approve: true` — tiếp tục và thực hiện các hiệu ứng phụ
- `approve: false` — hủy và kết thúc quy trình

Sử dụng `approve --preview-from-stdin --limit N` để đính kèm bản xem trước JSON vào
yêu cầu phê duyệt mà không cần mã nối jq/heredoc tùy chỉnh. Trạng thái tiếp tục được lưu dưới dạng
các tệp JSON nhỏ trong thư mục trạng thái Lobster (mặc định là `~/.lobster/state`,
ghi đè bằng `LOBSTER_STATE_DIR`); bản thân token chỉ mã hóa một con trỏ đến
trạng thái đó, không phải toàn bộ trạng thái pipeline.

## OpenProse

OpenProse kết hợp tốt với Lobster: sử dụng `/prose` để điều phối phần chuẩn bị đa tác nhân,
sau đó chạy một pipeline Lobster để có các bước phê duyệt mang tính xác định. Nếu một chương trình Prose
cần Lobster, hãy cho phép công cụ `lobster` cho các tác nhân phụ qua
`tools.subagents.tools`. Xem [OpenProse](/vi/prose).

## An toàn

- **Chỉ chạy cục bộ trong tiến trình** — các quy trình thực thi bên trong tiến trình gateway; bản thân
  Plugin không thực hiện lệnh gọi mạng.
- **Không quản lý bí mật** — Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw
  thực hiện việc đó.
- **Nhận biết sandbox** — bị vô hiệu hóa khi ngữ cảnh công cụ ở trong sandbox.
- **Được gia cố** — thời gian chờ và giới hạn đầu ra được trình chạy nhúng thực thi.

## Khắc phục sự cố

| Lỗi                                                           | Nguyên nhân / cách khắc phục                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Pipeline đã vượt quá `timeoutMs`. Hãy tăng giá trị hoặc chia nhỏ pipeline.             |
| `lobster stdout exceeded maxStdoutBytes` (hoặc `stderr`)      | Đầu ra được thu thập vượt quá giới hạn. Hãy tăng `maxStdoutBytes` hoặc giảm đầu ra.     |
| `run --args-json must be valid JSON`                          | Không thể phân tích `argsJson` (khi chạy tệp quy trình). Hãy sửa chuỗi JSON.            |
| `lobster runtime failed` (hoặc thông báo `runtime_error` khác) | Runtime nhúng đã trả về một lớp bao lỗi. Kiểm tra nhật ký gateway để biết chi tiết.     |

## Tìm hiểu thêm

- [Plugin](/vi/tools/plugin)
- [Biên soạn công cụ Plugin](/vi/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu tình huống: quy trình cộng đồng

Một ví dụ công khai: CLI "bộ não thứ hai" + các pipeline Lobster quản lý ba kho Markdown (cá nhân, đối tác, dùng chung). CLI xuất JSON cho số liệu thống kê, danh sách hộp thư đến và các lượt quét nội dung đã lỗi thời; Lobster nối chuỗi các lệnh đó thành những quy trình làm việc như `weekly-review`, `inbox-triage`, `memory-consolidation` và `shared-task-sync`, mỗi quy trình đều có các cổng phê duyệt. AI đảm nhiệm việc phán đoán (phân loại) khi khả dụng và chuyển sang các quy tắc xác định khi không khả dụng.

- Chủ đề: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Kho mã nguồn: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Liên quan

- [Tự động hóa](/vi/automation) - tất cả cơ chế tự động hóa
- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ dành cho tác tử hiện có

---
read_when:
    - Bạn muốn các quy trình làm việc nhiều bước có tính xác định với cơ chế phê duyệt rõ ràng
    - Bạn cần tiếp tục một quy trình làm việc mà không chạy lại các bước trước đó
summary: Runtime quy trình làm việc có kiểu cho OpenClaw với các cổng phê duyệt có thể tiếp tục.
title: Lobster
x-i18n:
    generated_at: "2026-07-19T06:03:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85b7900f86bfedc9d73fcc91c3d0dac37b81f7413b1e68c54dd8a797b70f79fc
    source_path: tools/lobster.md
    workflow: 16
---

Lobster chạy các pipeline công cụ nhiều bước dưới dạng một lệnh gọi công cụ xác định duy nhất, với
các điểm kiểm tra phê duyệt rõ ràng và token tiếp tục. Nó nằm cao hơn một lớp so với
công việc nền tách rời: để điều phối các luồng trên nhiều tác vụ tách rời,
xem [Task Flow](/vi/automation/taskflow) (`openclaw tasks flow`); để xem sổ cái
hoạt động của tác vụ, xem [Tác vụ nền](/vi/automation/tasks).

## Lý do

Không có Lobster, một công việc nhiều bước đồng nghĩa với nhiều lệnh gọi công cụ khứ hồi, trong đó
mô hình điều phối từng bước. Lobster chuyển việc điều phối đó vào một runtime có kiểu:

- **Một lệnh gọi thay vì nhiều lệnh gọi**: một lệnh gọi công cụ Lobster duy nhất trả về kết quả có cấu trúc
  cho toàn bộ pipeline.
- **Tích hợp sẵn phê duyệt**: các tác dụng phụ (gửi, đăng, xóa) sẽ tạm dừng quy trình làm việc
  cho đến khi được phê duyệt rõ ràng.
- **Có thể tiếp tục**: quy trình làm việc đã tạm dừng trả về một token; phê duyệt và tiếp tục mà không
  chạy lại các bước trước đó.

Lobster là một DSL nhỏ, có ràng buộc thay vì một ngôn ngữ kịch bản đa dụng:
phê duyệt/tiếp tục là một nguyên hàm bền vững, tích hợp sẵn; các pipeline là dữ liệu (dễ
ghi nhật ký, so sánh khác biệt, phát lại, review); ngữ pháp nhỏ gọn giới hạn các đường dẫn mã "sáng tạo" để
việc xác thực vẫn thực tế; thời gian chờ, giới hạn đầu ra, kiểm tra sandbox và
danh sách cho phép được runtime thực thi, không phải từng tập lệnh. Mỗi bước vẫn có thể
gọi bất kỳ CLI hoặc tập lệnh nào - hãy tạo các tệp `.lobster` từ công cụ khác nếu bạn
muốn một ngôn ngữ biên soạn phong phú hơn.

Không có Lobster, quy trình phân loại email định kỳ sẽ như sau:

```text
Người dùng: "Kiểm tra email của tôi và soạn thư trả lời"
→ openclaw gọi gmail.list
→ LLM tóm tắt
→ Người dùng: "soạn thư trả lời cho #2 và #5"
→ LLM soạn thư
→ Người dùng: "gửi #2"
→ openclaw gọi gmail.send
(lặp lại hằng ngày, không ghi nhớ nội dung đã được phân loại)
```

Với Lobster, cùng công việc đó chỉ là một lệnh gọi, tạm dừng để phê duyệt rồi tiếp tục:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 thư cần trả lời, 2 thư cần xử lý" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Gửi 2 thư trả lời nháp?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Cách hoạt động

OpenClaw chạy các quy trình làm việc Lobster **trong cùng tiến trình** bằng cách sử dụng gói
`@clawdbot/lobster` đi kèm làm trình chạy nhúng. Không có tiến trình con `lobster`
bên ngoài nào được khởi tạo; lệnh gọi công cụ trả về trực tiếp một phong bì JSON. Nếu
pipeline tạm dừng để phê duyệt, phong bì chứa token tiếp tục (hoặc ID
phê duyệt ngắn) để bạn có thể tiếp tục sau.

## Bật

Lobster là một công cụ plugin **tùy chọn**, không được bật theo mặc định. Nó được
đóng gói sẵn, nên không cần bước cài đặt riêng - chỉ cần cho phép công cụ:

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

<Note>
`alsoAllow` thêm `lobster` vào hồ sơ công cụ đang hoạt động mà không
hạn chế các công cụ lõi khác. Chỉ sử dụng `tools.allow` nếu bạn muốn chế độ
danh sách cho phép hạn chế hơn.
</Note>

Công cụ bị vô hiệu hóa hoàn toàn trong các ngữ cảnh công cụ được sandbox.

Nếu cần CLI Lobster độc lập để phát triển hoặc dùng cho các pipeline bên ngoài
(nằm ngoài trình chạy gateway nhúng), hãy cài đặt từ
[kho lưu trữ Lobster](https://github.com/openclaw/lobster) và đặt `lobster` trên
`PATH`.

## Mẫu: CLI nhỏ + đường ống JSON + phê duyệt

Xây dựng các lệnh nhỏ giao tiếp bằng JSON, sau đó nối chúng thành một lệnh gọi Lobster.
(Các tên lệnh ví dụ bên dưới - hãy thay bằng tên của bạn.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Áp dụng thay đổi?'",
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

Đối với một **bước LLM có cấu trúc** bên trong quy trình làm việc, hãy bật công cụ plugin
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

### Hạn chế quan trọng: Lobster nhúng so với `openclaw.invoke`

Plugin Lobster đi kèm chạy các quy trình làm việc **trong cùng tiến trình** bên trong gateway.
Trong chế độ nhúng đó, `openclaw.invoke` **không** tự động kế thừa
ngữ cảnh URL/xác thực của gateway cho các lệnh gọi công cụ CLI OpenClaw lồng nhau.

Điều đó có nghĩa là mẫu này **hiện không đáng tin cậy trong trình chạy nhúng**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Chỉ sử dụng ví dụ bên dưới khi chạy **CLI Lobster độc lập** trong một
môi trường mà `openclaw.invoke` đã được cấu hình với đúng
ngữ cảnh gateway/xác thực.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Dựa trên email đầu vào, hãy trả về ý định và bản nháp.",
  "thinking": "low",
  "input": { "subject": "Xin chào", "body": "Bạn có thể giúp tôi không?" },
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

Nếu hiện đang sử dụng plugin Lobster nhúng, hãy ưu tiên một trong hai:

- một lệnh gọi công cụ `llm-task` trực tiếp bên ngoài Lobster, hoặc
- các bước không phải `openclaw.invoke` bên trong pipeline Lobster cho đến khi bổ sung
  một cầu nối nhúng được hỗ trợ.

Xem [Tác vụ LLM](/vi/tools/llm-task) để biết chi tiết và các tùy chọn cấu hình.

## Tệp quy trình làm việc (.lobster)

Lobster có thể chạy các tệp quy trình làm việc YAML/JSON với các trường `name`, `args`, `steps`, `env`,
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

Lưu ý:

- `stdin: $step.stdout` và `stdin: $step.json` truyền đầu ra của bước trước.
- `condition` (hoặc `when`) có thể kiểm soát các bước dựa trên `$step.approved`.

### Các biến môi trường được chèn

Mỗi shell của bước kế thừa môi trường cha cùng các biến do Lobster chèn
sau đây, để các lệnh có thể tham chiếu các đối số quy trình làm việc đã phân giải mà không cần nhúng
giá trị thô vào chuỗi lệnh:

- `LOBSTER_ARG_<NAME>` - một biến cho mỗi đối số quy trình làm việc. Tên được chuyển thành chữ hoa, với mỗi
  chuỗi ký tự không phải chữ và số được thu gọn thành `_`, vì vậy đối số `user-id` trở thành
  `LOBSTER_ARG_USER_ID`.
- `LOBSTER_ARGS_JSON` - mọi đối số đã phân giải dưới dạng một chuỗi JSON duy nhất.

Đó là toàn bộ tập biến được chèn. **Không có** biến đầu ra theo từng bước
như `LOBSTER_STEP_<id>_STDOUT` hoặc `LOBSTER_STEP_<id>_JSON_<field>`; shell
coi các tên đó là chưa được đặt, vì vậy giá trị mặc định của phép mở rộng tham số có thể che giấu lỗi.
Thay vào đó, hãy đọc đầu ra của bước trước thông qua tham chiếu bước - `$step.stdout`,
`$step.json` hoặc `$step.json.<field>` - trong giá trị `stdin:`, `env:` hoặc `condition:`.
(`LOBSTER_STATE_DIR` là một thiết lập runtime riêng cho thư mục trạng thái,
không phải đối số theo từng lần chạy.)

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

Chạy tệp quy trình làm việc với các đối số:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Trường           | Mặc định    | Ghi chú                                                                                                      |
| ---------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `pipeline`       | bắt buộc     | Chuỗi pipeline nội tuyến hoặc đường dẫn kết thúc bằng `.lobster`/`.yaml`/`.yml`/`.json` cho tệp quy trình làm việc. |
| `cwd`            | cwd của gateway | Thư mục làm việc tương đối; phải phân giải bên trong thư mục làm việc của gateway (đường dẫn tuyệt đối bị từ chối). |
| `timeoutMs`      | `20000`     | Hủy lần chạy nếu vượt quá.                                                                                   |
| `maxStdoutBytes` | `512000`    | Hủy lần chạy nếu stdout hoặc stderr đã thu thập vượt quá kích thước này.                                      |
| `argsJson`       | -           | Chuỗi JSON chứa các đối số cho tệp quy trình làm việc (bị bỏ qua đối với pipeline nội tuyến).                 |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` chấp nhận `token` (token tiếp tục đầy đủ từ `requiresApproval`)
hoặc `approvalId` (ID ngắn từ cùng đối tượng) - hãy dùng giá trị mà lần chạy đã tạm dừng
trả về. `approve` là bắt buộc.

### Chế độ Task Flow được quản lý

Việc truyền `flowControllerId` và `flowGoal` trên `run` (hoặc `flowId` và
`flowExpectedRevision` trên `resume`) sẽ định tuyến lệnh gọi qua API
[Task Flow](/vi/automation/taskflow) được quản lý của runtime plugin thay vì trả về
một phong bì thuần túy: OpenClaw tạo hoặc tiếp tục một bản ghi luồng bền vững, áp dụng
phong bì Lobster vào bản ghi đó (`waiting` khi phê duyệt, `succeeded`/`failed` khi
hoàn tất) và trả về `{ ok, envelope, flow, mutation }`. Chế độ này yêu cầu
một runtime Task Flow đã được liên kết và dành cho mã plugin/bộ điều khiển cần
trạng thái luồng bền vững qua các lần khởi động lại gateway, không dành cho việc sử dụng agent đặc biệt thông thường.

## Phong bì đầu ra

Lobster trả về một phong bì JSON với một trong ba trạng thái:

- `ok` - hoàn tất thành công
- `needs_approval` - đã tạm dừng; `requiresApproval` chứa một `resumeToken` và một
  `approvalId` ngắn, có thể dùng một trong hai để tiếp tục lần chạy
- `cancelled` - bị từ chối hoặc hủy rõ ràng

Công cụ hiển thị phong bì trong cả `content` (JSON được định dạng đẹp) và `details`
(đối tượng thô).

## Phê duyệt

Nếu có `requiresApproval`, hãy kiểm tra lời nhắc và quyết định:

- `approve: true` - tiếp tục và thực hiện các tác dụng phụ
- `approve: false` - hủy và hoàn tất quy trình làm việc

Sử dụng `approve --preview-from-stdin --limit N` để đính kèm bản xem trước JSON vào
yêu cầu phê duyệt mà không cần đoạn mã jq/heredoc tùy chỉnh. Trạng thái tiếp tục được lưu dưới dạng
các tệp JSON nhỏ trong thư mục trạng thái Lobster (mặc định là `~/.lobster/state`,
ghi đè bằng `LOBSTER_STATE_DIR`); bản thân token chỉ mã hóa một
con trỏ đến trạng thái đó, không phải toàn bộ trạng thái pipeline.

## OpenProse

OpenProse phối hợp tốt với Lobster: sử dụng `/prose` để điều phối việc
chuẩn bị đa agent, sau đó chạy một pipeline Lobster để phê duyệt theo cách xác định. Nếu một chương trình Prose
cần Lobster, hãy cho phép công cụ `lobster` cho các agent con thông qua
`tools.subagents.tools`. Xem [OpenProse](/vi/prose).

## An toàn

- **Chỉ trong tiến trình cục bộ** - các quy trình công việc thực thi bên trong tiến trình Gateway; bản thân Plugin không thực hiện
  lệnh gọi mạng.
- **Không có bí mật** - Lobster không quản lý OAuth; nó gọi các công cụ OpenClaw
  đảm nhiệm việc đó.
- **Nhận biết sandbox** - bị vô hiệu hóa khi ngữ cảnh công cụ nằm trong sandbox.
- **Được tăng cường bảo mật** - trình chạy nhúng thực thi giới hạn thời gian chờ và giới hạn đầu ra.

## Khắc phục sự cố

| Lỗi                                                         | Nguyên nhân / cách khắc phục                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Pipeline đã vượt quá `timeoutMs`. Hãy tăng giá trị này hoặc chia nhỏ pipeline.                |
| `lobster stdout exceeded maxStdoutBytes` (hoặc `stderr`)        | Đầu ra đã thu thập vượt quá giới hạn. Hãy tăng `maxStdoutBytes` hoặc giảm đầu ra.       |
| `run --args-json must be valid JSON`                          | Không thể phân tích cú pháp `argsJson` (các lần chạy tệp quy trình công việc). Hãy sửa chuỗi JSON.            |
| `lobster runtime failed` (hoặc một thông báo `runtime_error` khác) | Runtime nhúng đã trả về một phong bì lỗi. Hãy kiểm tra nhật ký Gateway để biết chi tiết. |

## Tìm hiểu thêm

- [Plugin](/vi/tools/plugin)
- [Viết công cụ Plugin](/vi/plugins/building-plugins#registering-agent-tools)

## Nghiên cứu tình huống: quy trình công việc của cộng đồng

Một ví dụ công khai: một CLI "bộ não thứ hai" cùng các pipeline Lobster quản lý ba
kho Markdown (cá nhân, đối tác, dùng chung). CLI xuất JSON cho số liệu thống kê,
danh sách hộp thư đến và lượt quét nội dung cũ; Lobster nối chuỗi các lệnh đó thành những quy trình công việc
như `weekly-review`, `inbox-triage`, `memory-consolidation` và
`shared-task-sync`, mỗi quy trình đều có cổng phê duyệt. AI thực hiện việc phán đoán
(phân loại) khi khả dụng và chuyển sang các quy tắc tất định khi
không khả dụng.

- Luồng thảo luận: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Kho mã nguồn: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Liên quan

- [Tự động hóa](/vi/automation) - tất cả cơ chế tự động hóa
- [Tổng quan về công cụ](/vi/tools) - tất cả công cụ agent hiện có

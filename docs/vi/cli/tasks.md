---
read_when:
    - Bạn muốn kiểm tra, kiểm toán hoặc hủy các bản ghi tác vụ nền
    - Bạn đang lập tài liệu về các lệnh Task Flow trong `openclaw tasks flow`
summary: Tài liệu tham khảo CLI cho `openclaw tasks` (sổ theo dõi tác vụ nền và trạng thái Task Flow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-07-12T07:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b03a4aa9fab12b6e5773259a76a1e89fd6e6398c73e5b0533a31e5e3a3894f9c
    source_path: cli/tasks.md
    workflow: 16
---

Kiểm tra các tác vụ nền bền vững và trạng thái Task Flow. Khi không có lệnh con,
`openclaw tasks` tương đương với `openclaw tasks list`.

Xem [Tác vụ nền](/vi/automation/tasks) để biết vòng đời và mô hình phân phối,
cũng như phần `tasks audit` để xem mô tả đầy đủ về các phát hiện.

## Cách sử dụng

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Tùy chọn gốc

| Cờ                 | Mô tả                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `--json`           | Xuất JSON.                                                                                          |
| `--runtime <name>` | Lọc theo loại: `subagent`, `acp`, `cron` hoặc `cli`.                                                |
| `--status <name>`  | Lọc theo trạng thái: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled` hoặc `lost`. |

## Lệnh con

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

Liệt kê các tác vụ nền được theo dõi, mới nhất trước.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

Hiển thị một tác vụ theo ID tác vụ, ID lượt chạy hoặc khóa phiên.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

Thay đổi chính sách thông báo cho một tác vụ đang chạy.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

Hủy một tác vụ nền đang chạy.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

Hiển thị các bản ghi tác vụ và Task Flow đã cũ, bị mất, phân phối thất bại
hoặc không nhất quán theo cách khác. Các tác vụ bị mất được giữ lại đến
`cleanupAfter` là cảnh báo; các tác vụ bị mất đã hết hạn hoặc không có dấu
thời gian là lỗi.

`--code` chấp nhận các mã tác vụ (`stale_queued`, `stale_running`, `lost`,
`delivery_failed`, `missing_cleanup`, `inconsistent_timestamps`) và các mã
Task Flow (`restore_failed`, `stale_waiting`, `stale_blocked`,
`cancel_stuck`, `missing_linked_tasks`, `blocked_task_missing`). Xem
[Tác vụ nền](/vi/automation/tasks) để biết chi tiết về mức độ nghiêm trọng và
điều kiện kích hoạt của từng mã.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Xem trước hoặc áp dụng việc đối soát tác vụ và Task Flow, đánh dấu thời điểm
dọn dẹp, loại bỏ dữ liệu cũ và dọn dẹp sổ đăng ký phiên chạy cron đã cũ.

Đối với các tác vụ cron, quá trình đối soát sử dụng nhật ký lượt chạy và trạng
thái công việc đã lưu trước khi đánh dấu một tác vụ đang hoạt động cũ là
`lost`, nhờ đó các lượt chạy cron đã hoàn tất không trở thành lỗi kiểm tra
giả chỉ vì trạng thái runtime Gateway trong bộ nhớ đã không còn. Hoạt động
kiểm tra CLI ngoại tuyến không có thẩm quyền quyết định đối với tập hợp công
việc cron đang hoạt động cục bộ theo tiến trình của Gateway. Các tác vụ CLI
có ID lượt chạy/ID nguồn được đánh dấu là `lost` khi ngữ cảnh lượt chạy
Gateway trực tiếp của chúng không còn, ngay cả khi một hàng phiên con cũ
vẫn tồn tại.

Khi được áp dụng, quá trình bảo trì cũng loại bỏ các hàng sổ đăng ký phiên
`cron:<jobId>:run:<uuid>` cũ hơn 7 ngày, đồng thời giữ lại các công việc cron
hiện đang chạy và không thay đổi các hàng phiên không thuộc cron.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Kiểm tra hoặc hủy trạng thái Task Flow bền vững trong sổ cái tác vụ.
`flow list --status` chấp nhận `queued`, `running`, `waiting`, `blocked`,
`succeeded`, `failed`, `cancelled` hoặc `lost`.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Tác vụ nền](/vi/automation/tasks)

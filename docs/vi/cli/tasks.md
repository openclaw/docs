---
read_when:
    - Bạn muốn kiểm tra, kiểm toán hoặc hủy các bản ghi tác vụ nền
    - Bạn đang ghi tài liệu về các lệnh TaskFlow trong `openclaw tasks flow`
summary: Tài liệu tham chiếu CLI cho `openclaw tasks` (sổ cái tác vụ nền và trạng thái TaskFlow)
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-29T22:34:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 16
---

Kiểm tra các tác vụ nền bền vững và trạng thái Task Flow. Khi không có lệnh con,
`openclaw tasks` tương đương với `openclaw tasks list`.

Xem [Tác vụ nền](/vi/automation/tasks) để biết vòng đời và mô hình phân phối.

## Cách dùng

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

- `--json`: xuất JSON.
- `--runtime <name>`: lọc theo loại: `subagent`, `acp`, `cron`, hoặc `cli`.
- `--status <name>`: lọc theo trạng thái: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, hoặc `lost`.

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

Hiển thị một tác vụ theo ID tác vụ, ID lần chạy, hoặc khóa phiên.

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

Hiển thị các bản ghi tác vụ và Task Flow đã cũ, bị mất, phân phối thất bại, hoặc không nhất quán theo cách khác. Các tác vụ bị mất được giữ lại cho đến `cleanupAfter` là cảnh báo; các tác vụ bị mất đã hết hạn hoặc không được đóng dấu là lỗi.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

Xem trước hoặc áp dụng việc đối chiếu tác vụ và Task Flow, đóng dấu dọn dẹp, và cắt tỉa.
Đối với tác vụ cron, việc đối chiếu dùng nhật ký lần chạy/trạng thái công việc đã lưu trước khi đánh dấu một tác vụ đang hoạt động cũ là `lost`, vì vậy các lần chạy cron đã hoàn tất không trở thành lỗi kiểm tra giả chỉ vì trạng thái runtime Gateway trong bộ nhớ đã biến mất. Kiểm tra CLI ngoại tuyến không có thẩm quyền đối với tập công việc cron đang hoạt động cục bộ theo tiến trình của Gateway.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

Kiểm tra hoặc hủy trạng thái Task Flow bền vững trong sổ cái tác vụ.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tác vụ nền](/vi/automation/tasks)

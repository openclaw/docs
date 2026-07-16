---
read_when:
    - Bạn muốn kiểm tra các cam kết tiếp nối được suy luận
    - Bạn muốn bỏ qua các lượt check-in đang chờ xử lý
    - Bạn đang kiểm tra những gì Heartbeat có thể gửi đi
summary: Tham chiếu CLI cho `openclaw commitments` (kiểm tra và loại bỏ các bước tiếp theo được suy luận)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T14:12:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Liệt kê và quản lý các cam kết theo dõi tiếp theo được suy luận.

Cam kết là các bộ nhớ theo dõi tiếp theo có thời hạn ngắn, được tạo từ ngữ cảnh hội thoại và phân phối qua Heartbeat, đồng thời phải được chủ động bật (`commitments.enabled`). Xem
[Cam kết được suy luận](/vi/concepts/commitments) để biết hướng dẫn khái niệm và cấu hình.

Khi không có lệnh con, `openclaw commitments` liệt kê các cam kết đang chờ xử lý.

## Cách sử dụng

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Tùy chọn

- `--all`: hiển thị tất cả trạng thái thay vì chỉ các cam kết đang chờ xử lý.
- `--agent <id>`: lọc theo một mã định danh tác nhân.
- `--status <status>`: lọc theo trạng thái. Các giá trị: `pending`, `sent`,
  `dismissed`, `snoozed` hoặc `expired`. Giá trị không xác định khiến lệnh thoát với lỗi.
- `--json`: xuất JSON mà máy có thể đọc được.

`dismiss` đánh dấu các mã định danh cam kết đã cho là `dismissed` để Heartbeat không
phân phối chúng.

## Ví dụ

Liệt kê các cam kết đang chờ xử lý:

```bash
openclaw commitments
```

Liệt kê mọi cam kết đã lưu:

```bash
openclaw commitments --all
```

Lọc theo một tác nhân:

```bash
openclaw commitments --agent main
```

Tìm các cam kết đã tạm hoãn:

```bash
openclaw commitments --status snoozed
```

Loại bỏ một hoặc nhiều cam kết:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Xuất dưới dạng JSON:

```bash
openclaw commitments --all --json
```

## Đầu ra

Đầu ra văn bản in số lượng cam kết, đường dẫn cơ sở dữ liệu SQLite dùng chung, mọi bộ lọc đang hoạt động
và một hàng cho mỗi cam kết:

- mã định danh cam kết
- trạng thái
- loại (`event_check_in`, `deadline_check`, `care_check_in` hoặc `open_loop`)
- thời điểm đến hạn sớm nhất
- phạm vi (tác nhân/kênh/đích)
- văn bản kiểm tra lại được đề xuất

Đầu ra JSON bao gồm số lượng, các bộ lọc trạng thái và tác nhân đang hoạt động,
đường dẫn cơ sở dữ liệu SQLite dùng chung và toàn bộ bản ghi đã lưu.

## Liên quan

- [Cam kết được suy luận](/vi/concepts/commitments)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)

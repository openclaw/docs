---
read_when:
    - Bạn muốn kiểm tra các cam kết tiếp theo được suy luận
    - Bạn muốn bỏ qua các lượt kiểm tra đang chờ
    - Bạn đang kiểm tra những gì Heartbeat có thể cung cấp
summary: Tài liệu tham chiếu CLI cho `openclaw commitments` (kiểm tra và bỏ qua các tác vụ tiếp theo được suy luận)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-29T22:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Liệt kê và quản lý các cam kết theo dõi được suy luận.

Cam kết là các bộ nhớ theo dõi ngắn hạn, chỉ được tạo khi chọn tham gia từ
ngữ cảnh cuộc trò chuyện. Xem [Cam kết được suy luận](/vi/concepts/commitments) để
đọc hướng dẫn khái niệm.

Khi không có lệnh con, `openclaw commitments` liệt kê các cam kết đang chờ.

## Cách sử dụng

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Tùy chọn

- `--all`: hiển thị tất cả trạng thái thay vì chỉ các cam kết đang chờ.
- `--agent <id>`: lọc theo một id tác nhân.
- `--status <status>`: lọc theo trạng thái. Giá trị: `pending`, `sent`,
  `dismissed`, `snoozed`, hoặc `expired`.
- `--json`: xuất JSON máy đọc được.

## Ví dụ

Liệt kê các cam kết đang chờ:

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

Bỏ qua một hoặc nhiều cam kết:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Xuất dưới dạng JSON:

```bash
openclaw commitments --all --json
```

## Đầu ra

Đầu ra văn bản bao gồm:

- id cam kết
- trạng thái
- loại
- thời điểm đến hạn sớm nhất
- phạm vi
- văn bản kiểm tra lại được đề xuất

Đầu ra JSON cũng bao gồm đường dẫn kho lưu trữ cam kết và toàn bộ bản ghi đã lưu.

## Liên quan

- [Cam kết được suy luận](/vi/concepts/commitments)
- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Heartbeat](/vi/gateway/heartbeat)
- [Tác vụ đã lên lịch](/vi/automation/cron-jobs)

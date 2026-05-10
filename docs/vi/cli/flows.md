---
read_when:
    - Bạn bắt gặp `openclaw flows` trong tài liệu cũ hơn hoặc ghi chú phát hành
    - Bạn muốn một tài liệu tham chiếu nhanh để kiểm tra TaskFlow
summary: 'Chuyển hướng: các lệnh flow nằm trong `openclaw tasks flow`'
title: Luồng (chuyển hướng)
x-i18n:
    generated_at: "2026-05-10T19:28:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Không có lệnh cấp cao nhất `openclaw flows`. Việc kiểm tra TaskFlow bền vững nằm trong `openclaw tasks flow`.

## Lệnh con

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Lệnh con | Mô tả                       | Đối số / tùy chọn                                                                                  |
| -------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| `list`   | Liệt kê các TaskFlow được theo dõi. | Đầu ra `--json` máy có thể đọc; bộ lọc `--status <name>` (xem các giá trị trạng thái bên dưới). |
| `show`   | Hiển thị một TaskFlow.      | `<lookup>` id flow hoặc khóa chủ sở hữu; đầu ra `--json` máy có thể đọc.                          |
| `cancel` | Hủy một TaskFlow đang chạy. | `<lookup>` id flow hoặc khóa chủ sở hữu.                                                           |

`<lookup>` chấp nhận id flow (được trả về bởi `list` / `show`) hoặc khóa chủ sở hữu của flow (định danh ổn định mà hệ thống con sở hữu dùng để theo dõi flow).

### Giá trị bộ lọc trạng thái

`--status` trên `list` chấp nhận một trong các giá trị sau:

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## Ví dụ

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Để xem đầy đủ các khái niệm TaskFlow và cách biên soạn, hãy xem [TaskFlow](/vi/automation/taskflow). Để biết lệnh mẹ `tasks`, hãy xem [tham chiếu CLI tasks](/vi/cli/tasks).

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tự động hóa](/vi/automation)
- [TaskFlow](/vi/automation/taskflow)

---
read_when:
    - Bạn bắt gặp `openclaw flows` trong các tài liệu cũ hoặc ghi chú phát hành
    - Bạn muốn một tài liệu tham khảo nhanh để kiểm tra TaskFlow
summary: 'Chuyển hướng: các lệnh luồng nằm trong `openclaw tasks flow`'
title: Luồng (chuyển hướng)
x-i18n:
    generated_at: "2026-07-12T07:45:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

Không có lệnh cấp cao nhất `openclaw flows`. Chức năng kiểm tra TaskFlow bền vững nằm trong `openclaw tasks flow`.

## Lệnh con

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| Lệnh con   | Mô tả                          | Đối số / tùy chọn                                                                                     |
| ---------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `list`     | Liệt kê các TaskFlow được theo dõi. | Đầu ra `--json` có thể đọc bằng máy; bộ lọc `--status <name>` (xem các giá trị trạng thái bên dưới). |
| `show`     | Hiển thị một TaskFlow.         | `<lookup>` là mã định danh luồng hoặc khóa chủ sở hữu; đầu ra `--json` có thể đọc bằng máy.          |
| `cancel`   | Hủy một TaskFlow đang chạy.    | `<lookup>` là mã định danh luồng hoặc khóa chủ sở hữu.                                                |

`<lookup>` chấp nhận mã định danh luồng (do `list` / `show` trả về) hoặc khóa chủ sở hữu của luồng (mã định danh ổn định mà hệ thống con sở hữu dùng để theo dõi luồng).

### Các giá trị bộ lọc trạng thái

`--status` trên `list` chấp nhận một trong các giá trị: `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`.

## Ví dụ

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

Để tìm hiểu các khái niệm và cách xây dựng TaskFlow, hãy xem [TaskFlow](/vi/automation/taskflow). Đối với lệnh `tasks` cấp cha, hãy xem [tài liệu tham khảo CLI về tasks](/vi/cli/tasks).

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Tự động hóa](/vi/automation)
- [TaskFlow](/vi/automation/taskflow)

---
read_when:
    - Bạn muốn nhanh chóng kiểm tra tình trạng hoạt động của Gateway đang chạy
summary: Tài liệu tham chiếu CLI cho `openclaw health` (bản chụp nhanh tình trạng Gateway qua RPC)
title: Tình trạng
x-i18n:
    generated_at: "2026-04-29T22:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Lấy thông tin sức khỏe từ Gateway đang chạy.

Tùy chọn:

- `--json`: đầu ra máy có thể đọc
- `--timeout <ms>`: thời gian chờ kết nối tính bằng mili giây (mặc định `10000`)
- `--verbose`: ghi nhật ký chi tiết
- `--debug`: bí danh của `--verbose`

Ví dụ:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Ghi chú:

- Theo mặc định, `openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp nhanh trạng thái sức khỏe của nó. Khi
  Gateway đã có ảnh chụp nhanh được lưu trong bộ nhớ đệm còn mới, nó có thể trả về payload đã lưu trong bộ nhớ đệm đó và
  làm mới trong nền.
- `--verbose` buộc thăm dò trực tiếp, in chi tiết kết nối Gateway và mở rộng đầu ra
  con người có thể đọc trên tất cả tài khoản và tác tử đã cấu hình.
- Đầu ra bao gồm kho lưu trữ phiên theo từng tác tử khi nhiều tác tử được cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Sức khỏe Gateway](/vi/gateway/health)

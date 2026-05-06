---
read_when:
    - Bạn muốn nhanh chóng kiểm tra tình trạng hoạt động của Gateway đang chạy
summary: Tài liệu tham chiếu CLI cho `openclaw health` (bản chụp nhanh tình trạng Gateway qua RPC)
title: Tình trạng
x-i18n:
    generated_at: "2026-05-06T09:05:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Lấy trạng thái sức khỏe từ Gateway đang chạy.

Tùy chọn:

- `--json`: đầu ra máy đọc được
- `--timeout <ms>`: thời gian chờ kết nối tính bằng mili giây (mặc định `10000`)
- `--verbose`: ghi nhật ký chi tiết
- `--debug`: bí danh cho `--verbose`

Ví dụ:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Ghi chú:

- Mặc định, `openclaw health` yêu cầu Gateway đang chạy cung cấp ảnh chụp trạng thái sức khỏe của nó. Khi
  Gateway đã có ảnh chụp mới được lưu trong bộ nhớ đệm, nó có thể trả về tải dữ liệu đã lưu trong bộ nhớ đệm đó và
  làm mới ở chế độ nền.
- `--verbose` buộc thực hiện thăm dò trực tiếp, in chi tiết kết nối Gateway và mở rộng đầu ra
  dễ đọc cho con người trên tất cả tài khoản và tác tử đã cấu hình.
- Đầu ra bao gồm kho lưu trữ phiên theo từng tác tử khi nhiều tác tử được cấu hình.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Trạng thái sức khỏe Gateway](/vi/gateway/health)

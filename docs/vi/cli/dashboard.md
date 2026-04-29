---
read_when:
    - Bạn muốn mở giao diện điều khiển bằng token hiện tại của mình
    - Bạn muốn in URL mà không khởi chạy trình duyệt
summary: Tài liệu tham khảo CLI cho `openclaw dashboard` (mở Giao diện điều khiển)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-04-29T22:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Mở giao diện điều khiển bằng xác thực hiện tại của bạn.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Ghi chú:

- `dashboard` phân giải các SecretRefs `gateway.auth.token` đã cấu hình khi có thể.
- `dashboard` tuân theo `gateway.tls.enabled`: các Gateway bật TLS in/mở URL giao diện điều khiển
  `https://` và kết nối qua `wss://`.
- Với các token do SecretRef quản lý (đã phân giải hoặc chưa phân giải), `dashboard` in/sao chép/mở URL không chứa token để tránh làm lộ bí mật bên ngoài trong đầu ra terminal, lịch sử clipboard hoặc đối số khởi chạy trình duyệt.
- Nếu `gateway.auth.token` do SecretRef quản lý nhưng chưa được phân giải trong đường dẫn lệnh này, lệnh sẽ in URL không chứa token và hướng dẫn khắc phục rõ ràng thay vì nhúng phần giữ chỗ token không hợp lệ.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Bảng điều khiển](/vi/web/dashboard)

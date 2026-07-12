---
read_when:
    - Bạn muốn mở giao diện điều khiển bằng token hiện tại của mình
    - Bạn muốn in URL mà không khởi chạy trình duyệt
summary: Tài liệu tham khảo CLI cho `openclaw dashboard` (mở giao diện điều khiển)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-07-12T07:47:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Mở giao diện điều khiển bằng thông tin xác thực hiện tại của bạn.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: in URL nhưng không khởi chạy trình duyệt.
- `--yes`: khởi động/cài đặt Gateway mà không nhắc xác nhận khi cần.

Lưu ý:

- Phân giải các SecretRef đã cấu hình cho `gateway.auth.token` khi có thể.
- Tuân theo `gateway.tls.enabled`: Gateway bật TLS sẽ in/mở URL giao diện điều khiển dùng `https://` và kết nối qua `wss://`.
- Với liên kết `lan` hoặc `custom` dùng ký tự đại diện, thao tác khởi chạy trên cùng máy luôn sử dụng local loopback vì ký tự đại diện không phải là đích đến hợp lệ cho trình duyệt. Các liên kết `tailnet` và `custom` dạng văn bản thuần cũng sử dụng `127.0.0.1` để trình duyệt có ngữ cảnh bảo mật; các máy chủ cụ thể đã bật TLS giữ nguyên địa chỉ đã cấu hình để tên chứng chỉ khớp.
- Trước khi cung cấp URL local loopback đã xác thực cho liên kết với một giao diện cụ thể, lệnh sẽ thăm dò giao diện đã cấu hình và xác minh rằng giao diện đó cùng với `127.0.0.1` đều thuộc cùng một tiến trình Gateway. Nếu không thể xác định rõ quyền sở hữu trình lắng nghe, lệnh sẽ từ chối an toàn và cung cấp hướng dẫn về trạng thái.
- Với token được SecretRef quản lý (đã hoặc chưa phân giải), URL được in/sao chép/mở không bao giờ chứa token, nhờ đó bí mật bên ngoài không bị rò rỉ vào đầu ra của terminal, lịch sử bảng nhớ tạm hoặc đối số khởi chạy trình duyệt.
- Nếu `gateway.auth.token` được SecretRef quản lý nhưng chưa phân giải, lệnh sẽ in URL không chứa token và hướng dẫn khắc phục thay vì một phần giữ chỗ token không hợp lệ.
- Nếu việc chuyển URL đã xác thực bằng token qua bảng nhớ tạm/trình duyệt thất bại, lệnh sẽ ghi nhật ký một gợi ý xác thực thủ công an toàn, nêu tên `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` và khóa phân mảnh URL `token` mà không in giá trị token.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Bảng điều khiển](/vi/web/dashboard)

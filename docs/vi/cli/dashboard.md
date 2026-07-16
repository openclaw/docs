---
read_when:
    - Bạn muốn mở giao diện điều khiển bằng token hiện tại của mình
    - Bạn muốn in URL mà không khởi chạy trình duyệt
summary: Tham chiếu CLI cho `openclaw dashboard` (mở giao diện điều khiển)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-07-16T14:13:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Mở giao diện điều khiển bằng thông tin xác thực hiện tại.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: in URL nhưng không khởi chạy trình duyệt.
- `--json`: in một đối tượng kết nối mà máy có thể đọc được mà không mở trình duyệt, sử dụng bảng nhớ tạm, hiển thị lời nhắc hoặc khởi động Gateway.
- `--yes`: khởi động/cài đặt Gateway mà không hiển thị lời nhắc khi cần.

## Đầu ra mà máy có thể đọc được

Sử dụng `--json` cho các tích hợp máy tính để bàn và tập lệnh cần URL giao diện điều khiển đã được phân giải:

```bash
openclaw dashboard --json
```

Phản hồi bao gồm `url`, `httpUrl`, `wsUrl`, `port` và `tokenIncluded`. Nếu Gateway chưa sẵn sàng, lệnh trả về `{"ok":false,"reason":"..."}` và thoát với mã khác 0. Các token do SecretRef quản lý không bao giờ được đưa vào `url`.

Lưu ý:

- Phân giải các SecretRef `gateway.auth.token` đã cấu hình khi có thể.
- Tuân theo `gateway.tls.enabled`: các Gateway đã bật TLS in/mở URL giao diện điều khiển `https://` và kết nối qua `wss://`.
- Đối với liên kết `lan` hoặc ký tự đại diện `custom`, các lần khởi chạy trên cùng máy luôn sử dụng địa chỉ loopback vì ký tự đại diện không phải là đích đến của trình duyệt. Các liên kết `tailnet` và `custom` dạng văn bản thuần cũng sử dụng `127.0.0.1` để trình duyệt có ngữ cảnh bảo mật; các máy chủ cụ thể đã bật TLS giữ nguyên địa chỉ đã cấu hình để tên chứng chỉ khớp.
- Trước khi cung cấp URL loopback đã xác thực cho một liên kết giao diện cụ thể, lệnh thăm dò giao diện đã cấu hình và xác minh rằng giao diện đó cùng `127.0.0.1` thuộc sở hữu của cùng một tiến trình Gateway. Nếu không xác định rõ quyền sở hữu trình lắng nghe, lệnh sẽ từ chối an toàn và cung cấp hướng dẫn về trạng thái.
- Đối với các token do SecretRef quản lý (đã hoặc chưa phân giải), URL được in/sao chép/mở không bao giờ chứa token, nhờ đó bí mật bên ngoài không bị rò rỉ vào đầu ra terminal, lịch sử bảng nhớ tạm hoặc đối số khởi chạy trình duyệt.
- Nếu `gateway.auth.token` do SecretRef quản lý nhưng chưa được phân giải, lệnh sẽ in một URL không chứa token và hướng dẫn khắc phục thay vì một phần giữ chỗ token không hợp lệ.
- Nếu việc chuyển qua bảng nhớ tạm/trình duyệt thất bại đối với URL đã xác thực bằng token, lệnh ghi nhật ký một gợi ý xác thực thủ công an toàn, nêu tên `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` và khóa phân đoạn URL `token`, mà không in giá trị token.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Bảng điều khiển](/vi/web/dashboard)

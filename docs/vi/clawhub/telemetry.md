---
read_when:
    - Đang phát triển các chế độ kiểm soát dữ liệu đo từ xa / quyền riêng tư
    - Các câu hỏi về dữ liệu được thu thập
summary: Dữ liệu đo từ xa về lượt cài đặt do CLI ClawHub thu thập và cách từ chối tham gia.
x-i18n:
    generated_at: "2026-07-16T15:01:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Dữ liệu đo từ xa

ClawHub sử dụng dữ liệu đo từ xa tối thiểu từ CLI để tính tổng số lượt cài đặt.

## Khi nào dữ liệu đo từ xa được thu thập

Dữ liệu đo từ xa chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Dữ liệu đo từ xa **không bị vô hiệu hóa** (xem “Cách vô hiệu hóa” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có dữ liệu nào được báo cáo.

## Dữ liệu được thu thập

Với mỗi `clawhub install` được báo cáo, CLI sẽ cố gắng gửi một sự kiện cài đặt.

Sự kiện bao gồm:

- `slug`: slug của skill đã cài đặt.
- `version`: phiên bản đã cài đặt, nếu xác định được.

### Dữ liệu _không_ được thu thập

- Không thu thập đường dẫn thư mục hoặc mã định danh được tạo từ thư mục.
- Không thu thập nội dung tệp.
- Không thu thập nhật ký của từng lần chạy, câu lệnh nhắc hoặc đầu ra khác của CLI.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho từng skill:

- `installsAllTime`: số người dùng riêng biệt đã báo cáo ít nhất một lượt cài đặt skill bằng CLI.
- `installsCurrent`: số người dùng riêng biệt đã báo cáo một lượt cài đặt và chưa xóa dữ liệu
  đo từ xa của họ.

## Tính minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ có thể xem **các bộ đếm lượt cài đặt tổng hợp**.

Khi xóa tài khoản, dữ liệu đo từ xa của bạn cũng sẽ bị xóa.

## Cách vô hiệu hóa dữ liệu đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi biến này được đặt, CLI sẽ không gửi dữ liệu đo từ xa về lượt cài đặt.

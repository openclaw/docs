---
read_when:
    - Đang xử lý các tùy chọn kiểm soát telemetry / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Dữ liệu đo từ xa về cài đặt do ClawHub CLI thu thập và cách từ chối tham gia.
x-i18n:
    generated_at: "2026-07-04T10:47:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Dữ liệu đo từ xa

ClawHub sử dụng dữ liệu đo từ xa CLI tối thiểu để tính số lượt cài đặt tổng hợp.

## Khi dữ liệu đo từ xa được thu thập

Dữ liệu đo từ xa chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Dữ liệu đo từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có gì được báo cáo.

## Chúng tôi thu thập những gì

Với mỗi lệnh `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo khả năng tốt nhất.

Sự kiện bao gồm:

- `slug`: slug của kỹ năng đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Chúng tôi _không_ thu thập những gì

- Không có đường dẫn thư mục hoặc mã định danh bắt nguồn từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho từng kỹ năng:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lượt cài đặt CLI cho kỹ năng đó.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lượt cài đặt và chưa xóa dữ liệu
  đo từ xa của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **bộ đếm lượt cài đặt tổng hợp**.

Xóa tài khoản của bạn cũng sẽ xóa dữ liệu đo từ xa của bạn.

## Cách tắt dữ liệu đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi biến này được đặt, CLI sẽ không gửi dữ liệu đo từ xa về lượt cài đặt.

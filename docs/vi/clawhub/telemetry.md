---
read_when:
    - Đang xử lý kiểm soát đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Dữ liệu đo từ xa khi cài đặt được CLI ClawHub thu thập và cách chọn không tham gia.
x-i18n:
    generated_at: "2026-07-04T15:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetry

ClawHub sử dụng telemetry CLI tối thiểu để tính số lượt cài đặt tổng hợp.

## Khi telemetry được thu thập

Telemetry chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Telemetry **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có gì được báo cáo.

## Những gì chúng tôi thu thập

Với mỗi lần `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo khả năng tốt nhất.

Sự kiện bao gồm:

- `slug`: slug của skill đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục hoặc mã định danh suy ra từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt, hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp theo từng skill:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lượt cài đặt CLI cho skill.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lượt cài đặt và chưa xóa
  telemetry của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **bộ đếm lượt cài đặt tổng hợp**.

Việc xóa tài khoản của bạn cũng xóa dữ liệu telemetry của bạn.

## Cách tắt telemetry

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi đặt biến này, CLI sẽ không gửi telemetry cài đặt.

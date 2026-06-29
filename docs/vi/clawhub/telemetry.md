---
read_when:
    - Đang làm việc với điều khiển đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Cài đặt telemetry do ClawHub CLI thu thập và cách chọn không tham gia.
x-i18n:
    generated_at: "2026-06-28T22:32:51Z"
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
- Telemetry **chưa bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có gì được báo cáo.

## Những gì chúng tôi thu thập

Với mỗi lần `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo khả năng tối đa.

Sự kiện bao gồm:

- `slug`: slug của kỹ năng đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục hoặc mã định danh bắt nguồn từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký từng lần chạy, prompt, hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp theo từng kỹ năng:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lần cài đặt CLI cho kỹ năng.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lần cài đặt và chưa xóa
  telemetry của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **các bộ đếm cài đặt tổng hợp**.

Xóa tài khoản của bạn cũng sẽ xóa dữ liệu telemetry của bạn.

## Cách tắt telemetry

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi đặt như vậy, CLI sẽ không gửi telemetry cài đặt.

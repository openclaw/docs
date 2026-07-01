---
read_when:
    - Đang xử lý các điều khiển đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Cài đặt phép đo từ xa được CLI ClawHub thu thập và cách chọn không tham gia.
x-i18n:
    generated_at: "2026-07-01T15:26:09Z"
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

## Chúng tôi thu thập những gì

Với mỗi lệnh `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo nỗ lực tốt nhất.

Sự kiện bao gồm:

- `slug`: slug của skill đã cài đặt.
- `version`: phiên bản đã cài đặt, nếu biết.

### Chúng tôi _không_ thu thập những gì

- Không có đường dẫn thư mục hoặc định danh được suy ra từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký từng lần chạy, prompt hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho mỗi skill:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lần cài đặt CLI cho skill.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lần cài đặt và chưa xóa
  telemetry của họ.

## Tính minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **các bộ đếm cài đặt tổng hợp**.

Xóa tài khoản của bạn cũng sẽ xóa dữ liệu telemetry của bạn.

## Cách tắt telemetry

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi đặt biến này, CLI sẽ không gửi telemetry cài đặt.

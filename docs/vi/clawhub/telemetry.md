---
read_when:
    - Đang xử lý các điều khiển đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Cài đặt dữ liệu đo từ xa do ClawHub CLI thu thập và cách từ chối tham gia.
x-i18n:
    generated_at: "2026-07-03T23:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Đo từ xa

ClawHub dùng đo từ xa CLI tối thiểu để tính số lượt cài đặt tổng hợp.

## Khi nào đo từ xa được thu thập

Đo từ xa chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Đo từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có gì được báo cáo.

## Chúng tôi thu thập gì

Với mỗi lần `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo khả năng tốt nhất.

Sự kiện bao gồm:

- `slug`: slug của skill đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Chúng tôi _không_ thu thập gì

- Không có đường dẫn thư mục hoặc định danh suy ra từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký từng lần chạy, prompt hoặc đầu ra CLI nào khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho từng skill:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lượt cài đặt CLI cho skill.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lượt cài đặt và chưa xóa dữ liệu
  đo từ xa của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ nhìn thấy **bộ đếm lượt cài đặt tổng hợp**.

Xóa tài khoản của bạn cũng sẽ xóa dữ liệu đo từ xa của bạn.

## Cách tắt đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi đặt biến này, CLI sẽ không gửi đo từ xa về lượt cài đặt.

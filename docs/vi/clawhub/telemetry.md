---
read_when:
    - Đang làm việc với điều khiển đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu nào được thu thập
summary: Dữ liệu đo từ xa khi cài đặt do ClawHub CLI thu thập và cách tắt tham gia.
x-i18n:
    generated_at: "2026-07-02T01:01:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Dữ liệu đo từ xa

ClawHub sử dụng dữ liệu đo từ xa CLI tối thiểu để tính số lượt cài đặt tổng hợp.

## Khi nào dữ liệu đo từ xa được thu thập

Dữ liệu đo từ xa chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Dữ liệu đo từ xa **chưa bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có gì được báo cáo.

## Chúng tôi thu thập những gì

Với mỗi `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo khả năng tối đa.

Sự kiện bao gồm:

- `slug`: slug của kỹ năng đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục hoặc định danh bắt nguồn từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho mỗi kỹ năng:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lần cài đặt CLI cho kỹ năng.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lần cài đặt và chưa xóa dữ liệu đo từ xa của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **các bộ đếm lượt cài đặt tổng hợp**.

Việc xóa tài khoản của bạn cũng sẽ xóa dữ liệu đo từ xa của bạn.

## Cách tắt dữ liệu đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi thiết lập giá trị này, CLI sẽ không gửi dữ liệu đo từ xa về cài đặt.

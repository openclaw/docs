---
read_when:
    - Đang xử lý các kiểm soát đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu được thu thập
summary: Dữ liệu đo từ xa khi cài đặt được ClawHub CLI thu thập và cách từ chối tham gia.
x-i18n:
    generated_at: "2026-07-03T00:58:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Dữ liệu đo lường từ xa

ClawHub sử dụng dữ liệu đo lường từ xa tối thiểu của CLI để tính số lượt cài đặt tổng hợp.

## Khi dữ liệu đo lường từ xa được thu thập

Dữ liệu đo lường từ xa chỉ được gửi khi:

- Bạn đã đăng nhập trong CLI.
- Bạn chạy `clawhub install <slug>`.
- Dữ liệu đo lường từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, không có gì được báo cáo.

## Những gì chúng tôi thu thập

Trên mỗi lần `clawhub install` được báo cáo, CLI gửi một sự kiện cài đặt theo nỗ lực tốt nhất.

Sự kiện bao gồm:

- `slug`: slug của kỹ năng đã cài đặt.
- `version`: phiên bản đã cài đặt, khi biết được.

### Những gì chúng tôi _không_ thu thập

- Không có đường dẫn thư mục hoặc mã định danh được suy ra từ thư mục.
- Không có nội dung tệp.
- Không có nhật ký theo từng lần chạy, prompt hoặc đầu ra CLI nào khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho từng kỹ năng:

- `installsAllTime`: người dùng duy nhất đã báo cáo ít nhất một lượt cài đặt CLI cho kỹ năng.
- `installsCurrent`: người dùng duy nhất đã báo cáo một lượt cài đặt và chưa xóa dữ liệu
  đo lường từ xa của họ.

## Minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **các bộ đếm cài đặt tổng hợp**.

Việc xóa tài khoản của bạn cũng xóa dữ liệu đo lường từ xa của bạn.

## Cách tắt dữ liệu đo lường từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi thiết lập như vậy, CLI sẽ không gửi dữ liệu đo lường từ xa về lượt cài đặt.

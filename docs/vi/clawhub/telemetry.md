---
read_when:
    - Đang phát triển các tùy chọn kiểm soát dữ liệu đo từ xa / quyền riêng tư
    - Câu hỏi về dữ liệu được thu thập
summary: Dữ liệu đo từ xa về quá trình cài đặt do ClawHub CLI thu thập và cách từ chối tham gia.
x-i18n:
    generated_at: "2026-07-19T05:39:34Z"
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
- Dữ liệu đo từ xa **không bị tắt** (xem “Cách tắt” bên dưới).

Nếu bạn chưa đăng nhập, sẽ không có dữ liệu nào được báo cáo.

## Dữ liệu được thu thập

Với mỗi `clawhub install` được báo cáo, CLI sẽ cố gắng gửi một sự kiện cài đặt.

Sự kiện bao gồm:

- `slug`: slug của skill đã cài đặt.
- `version`: phiên bản đã cài đặt, nếu biết.

### Dữ liệu _không_ được thu thập

- Không thu thập đường dẫn thư mục hoặc mã định danh được suy ra từ thư mục.
- Không thu thập nội dung tệp.
- Không thu thập nhật ký của từng lần chạy, prompt hoặc đầu ra CLI khác.

## Số lượt cài đặt

ClawHub duy trì các bộ đếm tổng hợp cho từng skill:

- `installsAllTime`: số người dùng duy nhất đã báo cáo ít nhất một lượt cài đặt skill qua CLI.
- `installsCurrent`: số người dùng duy nhất đã báo cáo một lượt cài đặt và chưa xóa dữ liệu
  đo từ xa của họ.

## Tính minh bạch + quyền kiểm soát của người dùng

Mọi người chỉ thấy **các bộ đếm lượt cài đặt tổng hợp**.

Việc xóa tài khoản cũng sẽ xóa dữ liệu đo từ xa của bạn.

## Cách tắt dữ liệu đo từ xa

Đặt biến môi trường:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Khi biến này được đặt, CLI sẽ không gửi dữ liệu đo từ xa về lượt cài đặt.

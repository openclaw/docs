---
read_when:
    - Bạn muốn kết nối các sự kiện Pub/Sub của Gmail vào OpenClaw
    - Bạn cần danh sách đầy đủ các cờ và giá trị mặc định
summary: Tài liệu tham khảo CLI cho `openclaw webhooks` (thiết lập và trình chạy Pub/Sub của Gmail)
title: Webhook
x-i18n:
    generated_at: "2026-07-12T07:52:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Các trình trợ giúp và tích hợp Webhook. Hiện tại, bề mặt này chỉ dành cho các luồng Gmail Pub/Sub được xây dựng trên trình theo dõi `gog` đi kèm.

## Các lệnh con

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Lệnh con      | Mô tả                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `gmail setup` | Trình hướng dẫn một lần: thiết lập theo dõi Gmail, chủ đề/gói đăng ký Pub/Sub và phân phối hook OpenClaw. |
| `gmail run`   | Chạy `gog watch serve` cùng vòng lặp tự động gia hạn theo dõi ở nền trước.                      |

<Note>
Gateway cũng tự động khởi động `gog gmail watch serve` khi khởi động sau khi `hooks.enabled=true` và `hooks.gmail.account` được thiết lập (do `gmail setup` thiết lập). `gmail run` sử dụng cùng logic ở nền trước, hữu ích khi gỡ lỗi hoặc khi trình theo dõi của Gateway bị tắt. Xem [Tích hợp Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration) để biết chi tiết về việc tự động khởi động và tùy chọn từ chối `OPENCLAW_SKIP_GMAIL_WATCHER`.
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Cài đặt `gcloud` và `gog` nếu còn thiếu, xác thực `gcloud`, tạo chủ đề và gói đăng ký Pub/Sub, bắt đầu theo dõi Gmail, đồng thời ghi cấu hình `hooks.gmail` với `hooks.enabled=true`. In ra `Next: openclaw webhooks gmail run`.

### Bắt buộc

| Cờ                  | Mô tả                         |
| ------------------- | ----------------------------- |
| `--account <email>` | Tài khoản Gmail cần theo dõi. |

### Tùy chọn Pub/Sub

| Cờ                      | Mặc định               | Mô tả                                                                                                                                                                      |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--project <id>`        | (không có)             | ID dự án GCP (chủ sở hữu máy khách OAuth). Nếu không có, dùng ID dự án của chính chủ đề, rồi đến dự án được phân giải từ thông tin xác thực `gog`.                           |
| `--topic <name>`        | `gog-gmail-watch`      | Tên chủ đề Pub/Sub.                                                                                                                                                         |
| `--subscription <name>` | `gog-gmail-watch-push` | Tên gói đăng ký Pub/Sub.                                                                                                                                                    |
| `--label <label>`       | `INBOX`                | Nhãn Gmail cần theo dõi.                                                                                                                                                    |
| `--push-endpoint <url>` | (không có)             | Điểm cuối đẩy Pub/Sub được chỉ định rõ ràng. Ghi đè Tailscale.                                                                                                              |

### Tùy chọn phân phối OpenClaw

| Cờ                     | Mặc định                                          | Mô tả                        |
| ---------------------- | ------------------------------------------------- | ---------------------------- |
| `--hook-url <url>`     | Được tạo từ `hooks.path` và cổng Gateway          | URL Webhook của OpenClaw.    |
| `--hook-token <token>` | `hooks.token` hoặc một mã thông báo được tạo      | Mã thông báo Webhook OpenClaw. |
| `--push-token <token>` | Mã thông báo được tạo                             | Mã thông báo đẩy được chuyển tiếp đến `gog watch serve`. |

### Tùy chọn `gog watch serve`

| Cờ                    | Mặc định        | Mô tả                                                                                                                                                                                           |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`     | Máy chủ liên kết của `gog watch serve`.                                                                                                                                                          |
| `--port <port>`       | `8788`          | Cổng của `gog watch serve`.                                                                                                                                                                     |
| `--path <path>`       | `/gmail-pubsub` | Đường dẫn của `gog watch serve`. Bị buộc thành `/` khi Tailscale được bật mà không có đích rõ ràng, vì Tailscale loại bỏ đường dẫn trước khi chuyển tiếp qua proxy.                               |
| `--include-body`      | `true`          | Bao gồm các đoạn trích nội dung email. Không có cờ CLI để tắt tùy chọn này; thay vào đó, hãy đặt `hooks.gmail.includeBody: false` trong cấu hình.                                                |
| `--max-bytes <n>`     | `20000`         | Số byte tối đa cho mỗi đoạn trích nội dung.                                                                                                                                                      |
| `--renew-minutes <n>` | `720` (12 giờ)  | Gia hạn theo dõi Gmail sau mỗi N phút.                                                                                                                                                           |

### Công khai qua Tailscale

| Cờ                        | Mặc định | Mô tả                                                              |
| ------------------------- | -------- | ------------------------------------------------------------------ |
| `--tailscale <mode>`      | `funnel` | Công khai điểm cuối đẩy qua Tailscale: `funnel`, `serve` hoặc `off`. |
| `--tailscale-path <path>` | (không có) | Đường dẫn cho Tailscale serve/funnel.                              |
| `--tailscale-target <t>`  | (không có) | Đích Tailscale serve/funnel (cổng, `host:port` hoặc URL).          |

### Đầu ra

| Cờ       | Mô tả                                                    |
| -------- | -------------------------------------------------------- |
| `--json` | In bản tóm tắt mà máy có thể đọc thay vì văn bản.        |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Chạy `gog watch serve` cùng vòng lặp tự động gia hạn theo dõi ở nền trước, khởi động lại `gog watch serve` sau độ trễ 2 giây nếu tiến trình thoát ngoài dự kiến.

`run` chấp nhận các cờ Pub/Sub, phân phối OpenClaw, `gog watch serve` và Tailscale giống như `setup`, ngoại trừ:

- `--account` là **tùy chọn** trên `run`; nếu không có, dùng `hooks.gmail.account`.
- `run` **không** chấp nhận `--project`, `--push-endpoint` hoặc `--json`.
- Mỗi cờ trước hết dùng giá trị cấu hình `hooks.gmail.*` tương ứng (do `setup` ghi), sau đó dùng cùng giá trị mặc định tích hợp mà `setup` sử dụng, với một ngoại lệ: `--tailscale` mặc định là `off` trên `run` (không phải `funnel`) khi cả cờ lẫn `hooks.gmail.tailscale.mode` đều chưa được thiết lập.

| Danh mục             | Cờ                                                                               |
| -------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub              | `--account`, `--topic`, `--subscription`, `--label`                              |
| Phân phối OpenClaw   | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`    | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale            | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Đối với `run`, giá trị `--topic` là đường dẫn đầy đủ của chủ đề Pub/Sub (`projects/.../topics/...`), không chỉ là tên ngắn của chủ đề.
</Note>

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Tự động hóa Webhook](/vi/automation/cron-jobs)
- [Tích hợp Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration)

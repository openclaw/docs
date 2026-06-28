---
read_when:
    - Bạn muốn tích hợp các sự kiện Gmail Pub/Sub vào OpenClaw
    - Bạn cần danh sách đầy đủ các cờ và giá trị mặc định
summary: Tài liệu tham chiếu CLI cho `openclaw webhooks` (thiết lập và trình chạy Gmail Pub/Sub)
title: Webhook
x-i18n:
    generated_at: "2026-05-10T19:29:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw webhooks`

Các trình trợ giúp và tích hợp Webhook. Hiện tại bề mặt này được giới hạn cho các luồng Gmail Pub/Sub tích hợp với trình theo dõi `gog` đi kèm.

## Lệnh con

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Lệnh con      | Mô tả                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------- |
| `gmail setup` | Cấu hình Gmail watch, chủ đề/gói đăng ký Pub/Sub và đích phân phối Webhook của OpenClaw.           |
| `gmail run`   | Chạy `gog watch serve` cùng với vòng lặp tự động gia hạn watch.                                    |

## `webhooks gmail setup`

Cấu hình Gmail watch, Pub/Sub và phân phối Webhook của OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Bắt buộc

| Cờ                  | Mô tả                         |
| ------------------- | ----------------------------- |
| `--account <email>` | Tài khoản Gmail cần theo dõi. |

### Tùy chọn Pub/Sub

| Cờ                      | Mặc định               | Mô tả                                                        |
| ----------------------- | ---------------------- | ------------------------------------------------------------ |
| `--project <id>`        | (không có)             | id dự án GCP (chủ sở hữu OAuth client).                      |
| `--topic <name>`        | `gog-gmail-watch`      | Tên chủ đề Pub/Sub.                                          |
| `--subscription <name>` | `gog-gmail-watch-push` | Tên gói đăng ký Pub/Sub.                                     |
| `--label <label>`       | `INBOX`                | Nhãn Gmail cần theo dõi.                                     |
| `--push-endpoint <url>` | (không có)             | Điểm cuối push Pub/Sub tường minh. Ghi đè Tailscale.         |

### Tùy chọn phân phối OpenClaw

| Cờ                     | Mặc định   | Mô tả                                      |
| ---------------------- | ---------- | ------------------------------------------ |
| `--hook-url <url>`     | (không có) | URL Webhook của OpenClaw.                  |
| `--hook-token <token>` | (không có) | Token Webhook của OpenClaw.                |
| `--push-token <token>` | (không có) | Token push được chuyển tiếp tới `gog watch serve`. |

### Tùy chọn `gog watch serve`

| Cờ                    | Mặc định        | Mô tả                                                              |
| --------------------- | --------------- | ------------------------------------------------------------------ |
| `--bind <host>`       | `127.0.0.1`     | Máy chủ bind của `gog watch serve`.                                |
| `--port <port>`       | `8788`          | Cổng của `gog watch serve`.                                        |
| `--path <path>`       | `/gmail-pubsub` | Đường dẫn của `gog watch serve`.                                   |
| `--include-body`      | `true`          | Bao gồm đoạn trích nội dung email. Truyền `--no-include-body` để tắt. |
| `--max-bytes <n>`     | `20000`         | Số byte tối đa cho mỗi đoạn trích nội dung.                        |
| `--renew-minutes <n>` | `720` (12h)     | Gia hạn Gmail watch mỗi N phút.                                    |

### Phơi bày qua Tailscale

| Cờ                        | Mặc định | Mô tả                                                                  |
| ------------------------- | -------- | ---------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel` | Phơi bày điểm cuối push qua tailscale: `funnel`, `serve` hoặc `off`.   |
| `--tailscale-path <path>` | (không có) | Đường dẫn cho tailscale serve/funnel.                                |
| `--tailscale-target <t>`  | (không có) | Đích Tailscale serve/funnel (cổng, `host:port` hoặc URL).            |

### Đầu ra

| Cờ       | Mô tả                                                   |
| -------- | ------------------------------------------------------- |
| `--json` | In bản tóm tắt máy có thể đọc thay vì văn bản.          |

## `webhooks gmail run`

Chạy `gog watch serve` cùng với vòng lặp tự động gia hạn watch ở tiền cảnh.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` chấp nhận cùng các cờ `gog watch serve`, phân phối OpenClaw, Pub/Sub và Tailscale như `setup`, ngoại trừ:

- `--account` là **tùy chọn** trên `run` (nó dự phòng về tài khoản đã cấu hình).
- `run` **không** chấp nhận `--project`, `--push-endpoint` hoặc `--json`.
- Các cờ của `run` không có mặc định tích hợp; giá trị bị thiếu sẽ dự phòng về các giá trị do `setup` ghi.

| Danh mục           | Cờ                                                                               |
| ------------------ | -------------------------------------------------------------------------------- |
| Pub/Sub            | `--account`, `--topic`, `--subscription`, `--label`                              |
| Phân phối OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`  | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale          | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Đối với `run`, giá trị `--topic` là đường dẫn chủ đề Pub/Sub đầy đủ (`projects/.../topics/...`), không chỉ là tên chủ đề ngắn.
</Note>

## Luồng đầu cuối

Xem [Tích hợp Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration) để biết thiết lập dự án GCP, OAuth và phía Gateway ghép với các lệnh CLI này.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tự động hóa Webhook](/vi/automation/cron-jobs)
- [Gmail Pub/Sub](/vi/automation/cron-jobs#gmail-pubsub-integration)

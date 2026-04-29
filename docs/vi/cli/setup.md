---
read_when:
    - Bạn đang thực hiện thiết lập lần chạy đầu tiên mà không dùng quy trình hướng dẫn ban đầu đầy đủ của CLI
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
summary: Tham chiếu CLI cho `openclaw setup` (khởi tạo cấu hình + không gian làm việc)
title: Thiết lập
x-i18n:
    generated_at: "2026-04-29T22:34:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Khởi tạo `~/.openclaw/openclaw.json` và không gian làm việc của tác nhân.

Liên quan:

- Bắt đầu: [Bắt đầu](/vi/start/getting-started)
- Thiết lập ban đầu qua CLI: [Thiết lập ban đầu (CLI)](/vi/start/wizard)

## Ví dụ

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Tùy chọn

- `--workspace <dir>`: thư mục không gian làm việc của tác nhân (được lưu dưới dạng `agents.defaults.workspace`)
- `--wizard`: chạy quy trình thiết lập ban đầu
- `--non-interactive`: chạy quy trình thiết lập ban đầu mà không có lời nhắc
- `--mode <local|remote>`: chế độ thiết lập ban đầu
- `--import-from <provider>`: nhà cung cấp di chuyển để chạy trong quá trình thiết lập ban đầu
- `--import-source <path>`: thư mục gốc tác nhân nguồn cho `--import-from`
- `--import-secrets`: nhập các bí mật được hỗ trợ trong quá trình di chuyển khi thiết lập ban đầu
- `--remote-url <url>`: URL WebSocket Gateway từ xa
- `--remote-token <token>`: token Gateway từ xa

Để chạy quy trình thiết lập ban đầu thông qua setup:

```bash
openclaw setup --wizard
```

Ghi chú:

- `openclaw setup` thuần túy khởi tạo cấu hình + không gian làm việc mà không chạy toàn bộ luồng thiết lập ban đầu.
- Quy trình thiết lập ban đầu tự động chạy khi có bất kỳ cờ thiết lập ban đầu nào (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Nếu phát hiện trạng thái Hermes, quy trình thiết lập ban đầu tương tác có thể tự động đề xuất di chuyển. Nhập trong quá trình thiết lập ban đầu yêu cầu một thiết lập mới; dùng [Di chuyển](/vi/cli/migrate) để có kế hoạch chạy thử, bản sao lưu và chế độ ghi đè bên ngoài quy trình thiết lập ban đầu.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan cài đặt](/vi/install)

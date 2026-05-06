---
read_when:
    - Bạn đang thực hiện thiết lập lần chạy đầu tiên mà không có quy trình hướng dẫn làm quen CLI đầy đủ
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
summary: Tài liệu tham khảo CLI cho `openclaw setup` (khởi tạo cấu hình + không gian làm việc)
title: Thiết lập
x-i18n:
    generated_at: "2026-05-06T17:54:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Khởi tạo `~/.openclaw/openclaw.json` và không gian làm việc của agent.

<Note>
`openclaw setup` dành cho các bản cài đặt cấu hình có thể thay đổi. Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối ghi thiết lập vì tệp cấu hình được Nix quản lý. Agent nên dùng [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) chính thức hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

Liên quan:

- Bắt đầu: [Bắt đầu](/vi/start/getting-started)
- Nhập môn CLI: [Nhập môn (CLI)](/vi/start/wizard)

## Ví dụ

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Tùy chọn

- `--workspace <dir>`: thư mục không gian làm việc của agent (được lưu dưới dạng `agents.defaults.workspace`)
- `--wizard`: chạy nhập môn
- `--non-interactive`: chạy nhập môn không có lời nhắc
- `--mode <local|remote>`: chế độ nhập môn
- `--import-from <provider>`: nhà cung cấp di chuyển sẽ chạy trong quá trình nhập môn
- `--import-source <path>`: thư mục chính của agent nguồn cho `--import-from`
- `--import-secrets`: nhập các bí mật được hỗ trợ trong quá trình di chuyển khi nhập môn
- `--remote-url <url>`: URL WebSocket Gateway từ xa
- `--remote-token <token>`: token Gateway từ xa

Để chạy nhập môn qua thiết lập:

```bash
openclaw setup --wizard
```

Ghi chú:

- `openclaw setup` thông thường khởi tạo cấu hình + không gian làm việc mà không chạy toàn bộ luồng nhập môn.
- Sau khi thiết lập thông thường, chạy `openclaw configure` để chọn mô hình, kênh, Gateway, plugins, skills hoặc kiểm tra tình trạng.
- Nhập môn tự động chạy khi có bất kỳ cờ nhập môn nào (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Nếu phát hiện trạng thái Hermes, nhập môn tương tác có thể tự động đề xuất di chuyển. Nhập môn bằng cách nhập yêu cầu một thiết lập mới; dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, bản sao lưu và chế độ ghi đè bên ngoài nhập môn.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan cài đặt](/vi/install)

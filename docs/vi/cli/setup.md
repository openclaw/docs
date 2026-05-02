---
read_when:
    - Bạn đang thực hiện thiết lập lần chạy đầu tiên mà không có đầy đủ quy trình hướng dẫn ban đầu của CLI
    - Bạn muốn thiết lập đường dẫn không gian làm việc mặc định
summary: Tài liệu tham chiếu CLI cho `openclaw setup` (khởi tạo cấu hình + không gian làm việc)
title: Thiết lập
x-i18n:
    generated_at: "2026-05-02T20:42:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Khởi tạo `~/.openclaw/openclaw.json` và không gian làm việc của tác nhân.

Liên quan:

- Bắt đầu: [Bắt đầu](/vi/start/getting-started)
- Thiết lập ban đầu CLI: [Thiết lập ban đầu (CLI)](/vi/start/wizard)

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
- `--import-source <path>`: home tác nhân nguồn cho `--import-from`
- `--import-secrets`: nhập các bí mật được hỗ trợ trong quá trình di chuyển khi thiết lập ban đầu
- `--remote-url <url>`: URL WebSocket của Gateway từ xa
- `--remote-token <token>`: token Gateway từ xa

Để chạy quy trình thiết lập ban đầu qua setup:

```bash
openclaw setup --wizard
```

Ghi chú:

- Lệnh `openclaw setup` đơn thuần khởi tạo cấu hình + không gian làm việc mà không chạy toàn bộ luồng thiết lập ban đầu.
- Sau khi setup đơn thuần, hãy chạy `openclaw configure` để chọn mô hình, kênh, Gateway, plugin, skills hoặc kiểm tra tình trạng.
- Quy trình thiết lập ban đầu tự động chạy khi có bất kỳ cờ thiết lập ban đầu nào (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`).
- Nếu phát hiện trạng thái Hermes, quy trình thiết lập ban đầu tương tác có thể tự động đề xuất di chuyển. Thiết lập ban đầu nhập dữ liệu yêu cầu setup mới; dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, bản sao lưu và chế độ ghi đè ngoài quy trình thiết lập ban đầu.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Tổng quan cài đặt](/vi/install)

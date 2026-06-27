---
read_when:
    - Bạn đang thực hiện thiết lập lần chạy đầu tiên mà không dùng quy trình hướng dẫn thiết lập đầy đủ của CLI
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
    - Bạn cần mọi cờ và cách thiết lập quyết định giữa chế độ cơ sở và chế độ hướng dẫn wiz.
summary: Tham chiếu CLI cho `openclaw setup` (khởi tạo cấu hình cùng không gian làm việc, tùy chọn chạy quy trình thiết lập ban đầu)
title: Thiết lập
x-i18n:
    generated_at: "2026-06-27T17:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Khởi tạo cấu hình cơ sở và không gian làm việc của tác tử. Khi có bất kỳ cờ onboarding nào, lệnh này cũng chạy trình hướng dẫn.

<Note>
`openclaw setup` dành cho các bản cài đặt cấu hình có thể thay đổi. Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối ghi thiết lập vì tệp cấu hình do Nix quản lý. Hãy dùng [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) chính thức hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                         | Mô tả                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Thư mục không gian làm việc của tác tử (mặc định `~/.openclaw/workspace`; được lưu dưới dạng `agents.defaults.workspace`). |
| `--wizard`                 | Chạy onboarding tương tác.                                                                                 |
| `--non-interactive`        | Chạy onboarding không có lời nhắc.                                                                         |
| `--accept-risk`            | Xác nhận rủi ro truy cập toàn hệ thống của tác tử; bắt buộc khi dùng với `--non-interactive`.              |
| `--mode <mode>`            | Chế độ onboarding: `local` hoặc `remote`.                                                                  |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ chạy trong quá trình onboarding.                                                 |
| `--import-source <path>`   | Thư mục home của tác tử nguồn cho `--import-from`.                                                         |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển onboarding.                                          |
| `--remote-url <url>`       | URL WebSocket Gateway từ xa.                                                                               |
| `--remote-token <token>`   | Token Gateway từ xa (tùy chọn).                                                                            |

### Tự động kích hoạt trình hướng dẫn

`openclaw setup` chạy trình hướng dẫn khi bất kỳ cờ nào sau đây được chỉ định rõ ràng, ngay cả khi không có `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Ví dụ

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Ghi chú

- `openclaw setup` đơn giản khởi tạo cấu hình và không gian làm việc mà không chạy toàn bộ luồng onboarding.
- Sau khi thiết lập đơn giản, hãy chạy `openclaw onboard` để thực hiện hành trình được hướng dẫn đầy đủ, `openclaw configure` để thực hiện các thay đổi có mục tiêu, hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, onboarding tương tác có thể tự động đề xuất di chuyển. Onboarding nhập yêu cầu một thiết lập mới; dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, bản sao lưu và chế độ ghi đè ngoài onboarding.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Onboarding (CLI)](/vi/start/wizard)
- [Bắt đầu](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

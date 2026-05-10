---
read_when:
    - Bạn đang thực hiện thiết lập lần chạy đầu tiên mà không có đầy đủ quy trình hướng dẫn ban đầu của CLI
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
    - Bạn cần biết tất cả các cờ và cách quá trình thiết lập quyết định giữa chế độ đường cơ sở và chế độ trình hướng dẫn
summary: Tham chiếu CLI cho `openclaw setup` (khởi tạo cấu hình cùng không gian làm việc, tùy chọn chạy quy trình thiết lập ban đầu)
title: Thiết lập
x-i18n:
    generated_at: "2026-05-10T19:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Khởi tạo cấu hình cơ sở và workspace của agent. Khi có bất kỳ cờ onboarding nào, lệnh này cũng chạy trình hướng dẫn.

<Note>
`openclaw setup` dành cho các bản cài đặt cấu hình có thể thay đổi. Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối các thao tác ghi của setup vì tệp cấu hình được Nix quản lý. Sử dụng [Hướng dẫn nhanh nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) chính thức hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                         | Mô tả                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Thư mục workspace của agent (mặc định `~/.openclaw/workspace`; được lưu dưới dạng `agents.defaults.workspace`). |
| `--wizard`                 | Chạy onboarding tương tác.                                                                         |
| `--non-interactive`        | Chạy onboarding mà không có lời nhắc.                                                              |
| `--mode <mode>`            | Chế độ onboarding: `local` hoặc `remote`.                                                          |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ chạy trong quá trình onboarding.                                         |
| `--import-source <path>`   | Thư mục home của agent nguồn cho `--import-from`.                                                  |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển onboarding.                                  |
| `--remote-url <url>`       | URL WebSocket của Gateway từ xa.                                                                   |
| `--remote-token <token>`   | Token Gateway từ xa (tùy chọn).                                                                    |

### Tự động kích hoạt trình hướng dẫn

`openclaw setup` chạy trình hướng dẫn khi bất kỳ cờ nào sau đây được chỉ định rõ ràng, ngay cả khi không có `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## Ví dụ

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Ghi chú

- `openclaw setup` thuần túy khởi tạo cấu hình và workspace mà không chạy toàn bộ luồng onboarding.
- Sau setup thuần túy, chạy `openclaw onboard` để có hành trình được hướng dẫn đầy đủ, `openclaw configure` để thay đổi có mục tiêu, hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, onboarding tương tác có thể tự động đề xuất di chuyển. Onboarding nhập yêu cầu setup mới; sử dụng [Di chuyển](/vi/cli/migrate) cho các kế hoạch chạy thử, bản sao lưu và chế độ ghi đè bên ngoài onboarding.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Onboarding (CLI)](/vi/start/wizard)
- [Bắt đầu](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

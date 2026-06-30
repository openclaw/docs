---
read_when:
    - Bạn đang thực hiện thiết lập lần đầu bằng trình hướng dẫn onboarding của CLI
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
    - Bạn cần cờ thiết lập chỉ baseline cho các script
summary: Tham chiếu CLI cho `openclaw setup` (bí danh cho quy trình thiết lập ban đầu, với thiết lập cơ sở có sẵn thông qua cờ)
title: Thiết lập
x-i18n:
    generated_at: "2026-06-30T22:23:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

Chạy toàn bộ luồng hướng dẫn thiết lập CLI. `openclaw setup` là bí danh của `openclaw onboard`; dùng `--baseline` khi bạn chỉ cần khởi tạo các thư mục cấu hình/không gian làm việc mà không cần trình hướng dẫn.

<Note>
`openclaw setup` dành cho các bản cài đặt cấu hình có thể thay đổi. Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối ghi thiết lập vì tệp cấu hình do Nix quản lý. Dùng [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) chính thức hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                         | Mô tả                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `--workspace <dir>`        | Thư mục không gian làm việc của agent (mặc định `~/.openclaw/workspace`; được lưu dưới dạng `agents.defaults.workspace`). |
| `--baseline`               | Tạo các thư mục cấu hình/không gian làm việc/phiên cơ sở mà không chạy hướng dẫn thiết lập.            |
| `--wizard`                 | Được chấp nhận để tương thích; setup chạy hướng dẫn thiết lập theo mặc định.                           |
| `--non-interactive`        | Chạy hướng dẫn thiết lập mà không có lời nhắc.                                                         |
| `--accept-risk`            | Xác nhận rủi ro truy cập toàn hệ thống của agent; bắt buộc khi dùng với `--non-interactive`.           |
| `--mode <mode>`            | Chế độ hướng dẫn thiết lập: `local` hoặc `remote`.                                                     |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ chạy trong quá trình hướng dẫn thiết lập.                                    |
| `--import-source <path>`   | Thư mục home của agent nguồn cho `--import-from`.                                                      |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển khi hướng dẫn thiết lập.                         |
| `--remote-url <url>`       | URL WebSocket Gateway từ xa.                                                                           |
| `--remote-token <token>`   | Token Gateway từ xa (không bắt buộc).                                                                  |

### Chế độ cơ sở

`openclaw setup --baseline` giữ nguyên hành vi cũ chỉ dành cho cơ sở: lệnh tạo các thư mục cấu hình, không gian làm việc và phiên, rồi thoát mà không chạy hướng dẫn thiết lập.

## Ví dụ

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Ghi chú

- `openclaw setup` thuần chạy cùng hành trình được hướng dẫn như `openclaw onboard`.
- Sau khi thiết lập cơ sở, chạy `openclaw setup` hoặc `openclaw onboard` để có đầy đủ hành trình được hướng dẫn, `openclaw configure` cho các thay đổi có mục tiêu, hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, hướng dẫn thiết lập tương tác có thể tự động đề xuất di chuyển. Hướng dẫn thiết lập nhập dữ liệu yêu cầu một lần thiết lập mới; dùng [Di chuyển](/vi/cli/migrate) cho các kế hoạch chạy thử, bản sao lưu và chế độ ghi đè ngoài hướng dẫn thiết lập.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Hướng dẫn thiết lập (CLI)](/vi/start/wizard)
- [Bắt đầu](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

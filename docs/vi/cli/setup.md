---
read_when:
    - Bạn đang thực hiện thiết lập lần đầu bằng trình hướng dẫn làm quen của CLI
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
    - Bạn cần cờ thiết lập chỉ dành cho đường cơ sở cho các tập lệnh
summary: Tài liệu tham khảo CLI cho `openclaw setup` (bí danh của quy trình thiết lập ban đầu, với thiết lập cơ sở khả dụng thông qua cờ)
title: Thiết lập
x-i18n:
    generated_at: "2026-07-12T07:46:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe3c631a2ed7328ab7e7d1438adff2d6112514b3fdcfb82923ba6ea04650c385
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` chạy cùng quy trình làm quen có hướng dẫn như `openclaw onboard`:
trước tiên lệnh này xác minh và lưu cấu hình suy luận, sau đó khởi động Crestodian để cấu hình
không gian làm việc, Gateway, các kênh, Skills và tình trạng hệ thống. Dùng `--baseline` khi bạn
chỉ cần khởi tạo các thư mục cấu hình/không gian làm việc mà không cần trình hướng dẫn.

Trong chế độ có hướng dẫn, `--workspace <dir>` là không gian làm việc được đề xuất cho Crestodian;
giá trị này chỉ được lưu sau khi bạn phê duyệt đề xuất đó. Thiết lập cơ sở, cổ điển và
không tương tác sẽ lưu không gian làm việc đã cung cấp theo quy trình thông thường tương ứng.

`setup` chấp nhận các cờ làm quen giống như `openclaw onboard`, bao gồm
xác thực (`--auth-choice`, `--token`, các cờ khóa nhà cung cấp), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), đặt lại (`--reset`, `--reset-scope`), quy trình
(`--flow quickstart|advanced|manual|import`) và các cờ bỏ qua
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Xem [Làm quen](/vi/cli/onboard) và
[Tự động hóa CLI](/vi/start/wizard-cli-automation) để biết tài liệu tham khảo đầy đủ về các cờ và
các ví dụ không tương tác. `openclaw onboard --modern` là bí danh tương thích
cho trợ lý Crestodian có cổng kiểm soát suy luận và không có lệnh tương đương trong `setup`.

<Note>
`openclaw setup` dành cho các bản cài đặt có thể sửa đổi cấu hình. Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối các thao tác ghi của quá trình thiết lập vì tệp cấu hình do Nix quản lý. Hãy dùng [Hướng dẫn bắt đầu nhanh nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) chính chủ hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                         | Mô tả                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | Đề xuất không gian làm việc trong chế độ có hướng dẫn; được lưu trực tiếp bởi thiết lập cơ sở, cổ điển và không tương tác. |
| `--baseline`               | Tạo các thư mục cấu hình/không gian làm việc/phiên cơ sở mà không cần làm quen.                                  |
| `--wizard`                 | Được chấp nhận để tương thích; theo mặc định, quá trình thiết lập sẽ chạy quy trình làm quen.                    |
| `--non-interactive`        | Chạy quy trình làm quen mà không hiển thị lời nhắc.                                                              |
| `--accept-risk`            | Xác nhận rủi ro khi tác tử có quyền truy cập toàn hệ thống; bắt buộc khi dùng với `--non-interactive`.          |
| `--mode <mode>`            | Chế độ làm quen: `local` hoặc `remote`.                                                                          |
| `--flow <flow>`            | Quy trình làm quen: `quickstart`, `advanced`, `manual` hoặc `import`.                                            |
| `--reset`                  | Đặt lại cấu hình + thông tin xác thực + các phiên trước khi làm quen (chỉ đặt lại không gian làm việc khi dùng `--reset-scope full`). |
| `--reset-scope <scope>`    | Phạm vi đặt lại: `config`, `config+creds+sessions` hoặc `full`.                                                  |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ được chạy trong quá trình làm quen.                                                    |
| `--import-source <path>`   | Thư mục chính của tác tử nguồn dành cho `--import-from`.                                                         |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển khi làm quen.                                              |
| `--remote-url <url>`       | URL WebSocket của Gateway từ xa.                                                                                 |
| `--remote-token <token>`   | Mã thông báo Gateway từ xa (không bắt buộc).                                                                     |
| `--json`                   | Xuất bản tóm tắt JSON.                                                                                           |

`--classic` và `--non-interactive` loại trừ lẫn nhau: chế độ cổ điển mở
trình hướng dẫn có lời nhắc, còn thiết lập không tương tác sử dụng quy trình tự động hóa.

### Chế độ cơ sở

`openclaw setup --baseline` duy trì hành vi cũ chỉ dành cho cấu hình cơ sở: lệnh này
tạo các thư mục cấu hình, không gian làm việc và phiên, sau đó thoát mà không
chạy quy trình làm quen.

## Ví dụ

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Ghi chú

- Sau khi thiết lập cơ sở, hãy chạy `openclaw setup` hoặc `openclaw onboard` để thực hiện toàn bộ hành trình có hướng dẫn, `openclaw configure` để thực hiện các thay đổi cụ thể hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, quy trình làm quen tương tác có thể tự động đề xuất di chuyển. Quy trình làm quen bằng cách nhập yêu cầu một thiết lập mới; hãy dùng [Di chuyển](/vi/cli/migrate) để lập kế hoạch chạy thử, sao lưu và sử dụng chế độ ghi đè bên ngoài quy trình làm quen.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Làm quen](/vi/cli/onboard)
- [Làm quen (CLI)](/vi/start/wizard)
- [Bắt đầu sử dụng](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

---
read_when:
    - Bạn muốn trò chuyện với OpenClaw để thiết lập hoặc khắc phục sự cố
    - Bạn đang thực hiện thiết lập lần đầu bằng trình hướng dẫn làm quen ban đầu
    - Bạn muốn đặt đường dẫn không gian làm việc mặc định
    - Bạn cần cờ thiết lập chỉ dành cho đường cơ sở cho các tập lệnh
summary: Tài liệu tham chiếu CLI cho `openclaw setup` (trò chuyện với tác tử hệ thống có phương án dự phòng là quy trình làm quen ban đầu)
title: Thiết lập
x-i18n:
    generated_at: "2026-07-16T15:07:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3395dbfe94c2f9686757fff85db709f0a9ed0ac9579e8e3c80ee1d51038f8e18
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` là điểm vào của tác nhân hệ thống. Trên hệ thống đã được cấu hình, chỉ cần chạy
`openclaw setup` sẽ mở một cuộc trò chuyện OpenClaw tương tác. Trên hệ thống mới, lệnh này
chuyển sang quy trình thiết lập ban đầu có hướng dẫn. Dùng `-m`/`--message` cho một yêu cầu hoặc
`--baseline` để khởi tạo các thư mục cấu hình/không gian làm việc mà không dùng trình hướng dẫn.

Thứ tự định tuyến:

1. Bất kỳ tùy chọn thiết lập ban đầu nào (`--wizard`, `--baseline`, không gian làm việc, đặt lại,
   không tương tác, luồng, chế độ, Gateway, daemon, bỏ qua, nhập, từ xa hoặc các
   tùy chọn xác thực) đều chạy quy trình thiết lập ban đầu giống hệt `openclaw onboard`.
2. `-m`/`--message` hoặc `--yes` chạy tác nhân hệ thống.
3. Khi không có tùy chọn định tuyến, hệ thống tương tác đã được cấu hình sẽ mở OpenClaw. Hệ thống
   mới sẽ chạy quy trình thiết lập ban đầu. Trên hệ thống đã được cấu hình, `--json` in
   thông tin tổng quan hệ thống ngay cả khi không có TTY; tùy chọn thiết lập ban đầu sẽ giữ nguyên
   bản tóm tắt JSON của quy trình thiết lập ban đầu.

Ở chế độ có hướng dẫn, `--workspace <dir>` là không gian làm việc được đề xuất cho OpenClaw;
không gian này chỉ được lưu sau khi bạn phê duyệt đề xuất. Thiết lập cơ sở, cổ điển và
không tương tác lưu không gian làm việc được cung cấp thông qua luồng thông thường tương ứng.

Quá trình phát hiện suy luận có hướng dẫn chạy trên máy chủ Gateway dùng macOS hoặc Linux. CLI
và ứng dụng macOS gọi cùng một bộ phát hiện do Gateway sở hữu, bộ này kiểm tra
các mô hình đã cấu hình, thông tin đăng nhập CLI được hỗ trợ, các biến môi trường khóa API và
các mô hình Ollama hoặc LM Studio đã được cài đặt. Các mô hình cục bộ không bao giờ được tải xuống trong
lượt tự động này; ứng viên được chọn phải trả lời một yêu cầu hoàn thành thực tế trước khi
cấu hình nhà cung cấp và mô hình của ứng viên đó được lưu.

`setup` chấp nhận các cờ thiết lập ban đầu giống như `openclaw onboard`, bao gồm
xác thực (`--auth-choice`, `--token`, các cờ khóa nhà cung cấp), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), đặt lại (`--reset`, `--reset-scope`), luồng
(`--flow quickstart|advanced|manual|import`) và các cờ bỏ qua
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Xem [Thiết lập ban đầu](/vi/cli/onboard) và
[Tự động hóa CLI](/vi/start/wizard-cli-automation) để biết tài liệu tham khảo đầy đủ về các cờ và
các ví dụ không tương tác. `openclaw onboard --modern` vẫn là một mục nhập tương thích
cho cùng trợ lý OpenClaw có cổng kiểm soát suy luận.

<Note>
`openclaw setup` dành cho các bản cài đặt có cấu hình có thể thay đổi. Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối ghi dữ liệu thiết lập vì tệp cấu hình do Nix quản lý. Hãy dùng [Hướng dẫn bắt đầu nhanh nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) chính chủ hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                       | Mô tả                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Chạy một yêu cầu OpenClaw.                                                                             |
| `--yes`                    | Phê duyệt việc ghi cấu hình lâu dài cho một yêu cầu `--message`.                                         |
| `--workspace <dir>`        | Đề xuất không gian làm việc trong chế độ có hướng dẫn; được lưu trực tiếp bởi thiết lập cơ sở, cổ điển và không tương tác. |
| `--baseline`               | Tạo các thư mục cấu hình/không gian làm việc/phiên cơ sở mà không chạy quy trình thiết lập ban đầu.                                  |
| `--wizard`                 | Buộc chạy quy trình thiết lập ban đầu tương tác.                                                                         |
| `--non-interactive`        | Chạy quy trình thiết lập ban đầu mà không hiển thị lời nhắc.                                                                       |
| `--accept-risk`            | Xác nhận rủi ro truy cập toàn bộ hệ thống của tác nhân; bắt buộc khi dùng `--non-interactive`.                         |
| `--mode <mode>`            | Chế độ thiết lập ban đầu: `local` hoặc `remote`.                                                                 |
| `--flow <flow>`            | Luồng thiết lập ban đầu: `quickstart`, `advanced`, `manual` hoặc `import`.                                        |
| `--reset`                  | Đặt lại cấu hình + thông tin xác thực + phiên trước khi thiết lập ban đầu (chỉ đặt lại không gian làm việc khi dùng `--reset-scope full`).   |
| `--reset-scope <scope>`    | Phạm vi đặt lại: `config`, `config+creds+sessions` hoặc `full`.                                            |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ chạy trong quá trình thiết lập ban đầu.                                                          |
| `--import-source <path>`   | Thư mục chính của tác nhân nguồn cho `--import-from`.                                                                |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển khi thiết lập ban đầu.                                                 |
| `--remote-url <url>`       | URL WebSocket của Gateway từ xa.                                                                         |
| `--remote-token <token>`   | Token Gateway từ xa (không bắt buộc).                                                                      |
| `--json`                   | Hệ thống đã cấu hình: thông tin tổng quan OpenClaw. Tuyến thiết lập ban đầu: bản tóm tắt thiết lập ban đầu.                           |

`--classic` và `--non-interactive` loại trừ lẫn nhau: chế độ cổ điển mở
trình hướng dẫn có lời nhắc, còn thiết lập không tương tác sử dụng quy trình tự động hóa.

### Chế độ cơ sở

`openclaw setup --baseline` duy trì hành vi cũ chỉ dành cho chế độ cơ sở: lệnh này
tạo các thư mục cấu hình, không gian làm việc và phiên, sau đó thoát mà không
chạy quy trình thiết lập ban đầu.

## Ví dụ

```bash
openclaw setup
openclaw setup -m "status"
openclaw setup -m "restart gateway" --yes
openclaw setup --json
openclaw setup --wizard
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## Ghi chú

- Sau khi thiết lập cơ sở, chạy `openclaw onboard` để thực hiện toàn bộ quy trình có hướng dẫn, `openclaw configure` để thực hiện các thay đổi cụ thể hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, quy trình thiết lập ban đầu tương tác có thể tự động đề xuất di chuyển. Quy trình thiết lập ban đầu có nhập dữ liệu yêu cầu một thiết lập mới; hãy dùng [Di chuyển](/vi/cli/migrate) để lập kế hoạch chạy thử, sao lưu và sử dụng chế độ ghi đè ngoài quy trình thiết lập ban đầu.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Thiết lập ban đầu](/vi/cli/onboard)
- [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- [Bắt đầu](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

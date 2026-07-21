---
read_when:
    - Bạn muốn trò chuyện với OpenClaw để thiết lập hoặc sửa chữa
    - Bạn đang thực hiện thiết lập lần đầu bằng trình hướng dẫn làm quen.
    - Bạn muốn thiết lập đường dẫn không gian làm việc mặc định
    - Bạn cần cờ thiết lập chỉ dành cho đường cơ sở cho các tập lệnh
summary: Tài liệu tham khảo CLI cho `openclaw setup` (trò chuyện với tác nhân hệ thống, có phương án dự phòng onboarding)
title: Thiết lập
x-i18n:
    generated_at: "2026-07-21T13:23:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b3b4f70f2631683fcb03007a80fe43a06387be3d7e4d533381e5e536333af051
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

`openclaw setup` là điểm vào của tác nhân hệ thống. Trên hệ thống đã cấu hình, chỉ cần chạy
`openclaw setup` sẽ mở một cuộc trò chuyện OpenClaw tương tác. Trên hệ thống mới, lệnh này
sẽ chuyển sang quy trình thiết lập ban đầu có hướng dẫn. Dùng `-m`/`--message` cho một yêu cầu hoặc
`--baseline` để khởi tạo các thư mục cấu hình/không gian làm việc mà không dùng trình hướng dẫn.

Thứ tự định tuyến:

1. Bất kỳ tùy chọn thiết lập ban đầu nào (`--wizard`, `--baseline`, không gian làm việc, đặt lại,
   không tương tác, luồng, chế độ, Gateway, tiến trình nền, bỏ qua, nhập, từ xa hoặc các tùy chọn
   xác thực) đều chạy quy trình thiết lập ban đầu giống hệt `openclaw onboard`.
2. `-m`/`--message` hoặc `--yes` sẽ chạy tác nhân hệ thống.
3. Khi không có tùy chọn định tuyến, hệ thống tương tác đã cấu hình sẽ mở OpenClaw. Một
   hệ thống mới sẽ chạy quy trình thiết lập ban đầu. Trên hệ thống đã cấu hình, `--json` in
   thông tin tổng quan hệ thống ngay cả khi không có TTY; một tùy chọn thiết lập ban đầu sẽ giữ lại
   phần tóm tắt JSON của quy trình thiết lập ban đầu.

Trong chế độ có hướng dẫn, `--workspace <dir>` là không gian làm việc được đề xuất cho OpenClaw;
nó chỉ được lưu sau khi bạn phê duyệt đề xuất đó. Thiết lập cơ sở, cổ điển và
không tương tác lưu không gian làm việc đã cung cấp thông qua luồng thông thường tương ứng
trên bản cài đặt mới. Khi danh sách tác nhân hiện có sẽ bị ánh xạ lại,
trình hướng dẫn cổ điển yêu cầu xác nhận rõ ràng; thiết lập không tương tác giữ nguyên
không gian làm việc hiện tại của nhóm tác nhân và in cảnh báo.

Quá trình phát hiện suy luận có hướng dẫn chạy trên máy chủ Gateway trong macOS hoặc Linux. CLI
và ứng dụng macOS gọi cùng một bộ phát hiện do Gateway sở hữu; bộ phát hiện này kiểm tra
các mô hình đã cấu hình, thông tin đăng nhập CLI được hỗ trợ, biến môi trường khóa API và
các mô hình Ollama hoặc LM Studio đã cài đặt. Các mô hình cục bộ không bao giờ được tải xuống trong
lượt tự động này. Các môi trường chạy cục bộ được phát hiện sẽ tự động được kiểm thử sau các ứng viên
CLI và khóa API; khi có nhiều mô hình cục bộ, OpenClaw ưu tiên
họ mô hình instruct gọi công cụ mạnh nhất. Ứng viên được chọn phải trả lời
một yêu cầu hoàn thành thực tế trước khi cấu hình nhà cung cấp và mô hình của ứng viên đó được lưu.
Các CLI Gemini, Antigravity, Pi và OpenCode đã cài đặt cũng được báo cáo khi
chúng không thể đóng vai trò là tuyến suy luận có thể tái sử dụng cho thiết lập có hướng dẫn.

`setup` chấp nhận các cờ thiết lập ban đầu giống như `openclaw onboard`, bao gồm
xác thực (`--auth-choice`, `--token`, các cờ khóa nhà cung cấp), Gateway
(`--gateway-port`, `--gateway-bind`, `--gateway-auth`, `--install-daemon`),
Tailscale (`--tailscale`), đặt lại (`--reset`, `--reset-scope`), luồng
(`--flow quickstart|advanced|manual|import`) và các cờ bỏ qua
(`--skip-channels`, `--skip-skills`, `--skip-bootstrap`, `--skip-search`,
`--skip-health`, `--skip-ui`, `--skip-hooks`). Truyền `--tui` để dùng cùng
lối thoát qua thiết bị đầu cuối như `openclaw onboard --tui`. Xem [Thiết lập ban đầu](/vi/cli/onboard) và
[Tự động hóa CLI](/vi/start/wizard-cli-automation) để biết tài liệu tham khảo đầy đủ về các cờ và
các ví dụ không tương tác. `openclaw onboard --modern` vẫn là một điểm vào tương thích
cho cùng trợ lý OpenClaw có cổng kiểm soát suy luận.

<Note>
`openclaw setup` dành cho các bản cài đặt có cấu hình có thể thay đổi. Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), OpenClaw từ chối ghi dữ liệu thiết lập vì tệp cấu hình do Nix quản lý. Hãy dùng [Hướng dẫn bắt đầu nhanh nix-openclaw chính chủ](https://github.com/openclaw/nix-openclaw#quick-start) hoặc cấu hình nguồn tương đương cho một gói Nix khác.
</Note>

## Tùy chọn

| Cờ                         | Mô tả                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `-m, --message <text>`     | Chạy một yêu cầu OpenClaw.                                                                                      |
| `--yes`                    | Phê duyệt việc ghi cấu hình lâu dài cho một yêu cầu `--message`.                                         |
| `--workspace <dir>`        | Đề xuất không gian làm việc; các nhóm tác nhân hiện có cần xác nhận cổ điển và được giữ nguyên khi chạy không tương tác. |
| `--baseline`               | Tạo các thư mục cấu hình/không gian làm việc/phiên cơ sở mà không thiết lập ban đầu.                             |
| `--wizard`                 | Bắt buộc thiết lập ban đầu tương tác.                                                                           |
| `--tui`                    | Dùng lối thoát qua thiết bị đầu cuối thay vì chuyển giao sang trình duyệt.                                      |
| `--non-interactive`        | Chạy thiết lập ban đầu mà không có lời nhắc.                                                                    |
| `--accept-risk`            | Xác nhận rủi ro tác nhân có quyền truy cập toàn hệ thống; bắt buộc khi dùng `--non-interactive`.                  |
| `--mode <mode>`            | Chế độ thiết lập ban đầu: `local` hoặc `remote`.                                           |
| `--flow <flow>`            | Luồng thiết lập ban đầu: `quickstart`, `advanced`, `manual` hoặc `import`.    |
| `--reset`                  | Đặt lại cấu hình + thông tin xác thực + phiên trước khi thiết lập ban đầu (chỉ đặt lại không gian làm việc khi dùng `--reset-scope full`). |
| `--reset-scope <scope>`    | Phạm vi đặt lại: `config`, `config+creds+sessions` hoặc `full`.                                |
| `--import-from <provider>` | Nhà cung cấp di chuyển sẽ chạy trong quá trình thiết lập ban đầu.                                               |
| `--import-source <path>`   | Thư mục chính của tác nhân nguồn cho `--import-from`.                                                        |
| `--import-secrets`         | Nhập các bí mật được hỗ trợ trong quá trình di chuyển khi thiết lập ban đầu.                                    |
| `--remote-url <url>`       | URL WebSocket của Gateway từ xa.                                                                                |
| `--remote-token <token>`   | Token Gateway từ xa (không bắt buộc).                                                                           |
| `--json`                   | Hệ thống đã cấu hình: tổng quan OpenClaw. Tuyến thiết lập ban đầu: phần tóm tắt thiết lập ban đầu.               |

`--classic` và `--non-interactive` loại trừ lẫn nhau: chế độ cổ điển mở
trình hướng dẫn có lời nhắc, còn thiết lập không tương tác sử dụng tuyến tự động hóa.
Trong thiết lập ban đầu tương tác, `--remote-url` và `--remote-token` điền sẵn
bước Gateway từ xa và được ưu tiên hơn các giá trị từ xa đã lưu trong lần chạy đó.
Việc thay đổi URL không tái sử dụng thông tin xác thực đã lưu trừ khi bạn cũng truyền token.
Token vẫn được che và sử dụng chế độ lưu trữ văn bản thuần hoặc SecretRef
do trình hướng dẫn chọn.

### Chế độ cơ sở

`openclaw setup --baseline` giữ nguyên hành vi cũ chỉ dành cho thiết lập cơ sở: lệnh này
tạo các thư mục cấu hình, không gian làm việc và phiên, sau đó thoát mà không
chạy quy trình thiết lập ban đầu. Lệnh chấp nhận `--workspace` và các tùy chọn điều khiển đầu ra vô hại, nhưng
từ chối các tùy chọn rõ ràng về thiết lập ban đầu, Gateway, xác thực, đặt lại hoặc tiến trình nền thay vì
âm thầm bỏ qua chúng. Nếu cấu hình hiện có không hợp lệ, thiết lập cơ sở sẽ giữ nguyên
cấu hình đó và yêu cầu bạn chạy `openclaw doctor` trước khi thử lại.

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

- Sau thiết lập cơ sở, hãy chạy `openclaw onboard` để thực hiện toàn bộ hành trình có hướng dẫn, `openclaw configure` để thay đổi có mục tiêu hoặc `openclaw channels add` để thêm tài khoản kênh.
- Nếu phát hiện trạng thái Hermes, thiết lập ban đầu tương tác có thể tự động đề xuất di chuyển. Quá trình thiết lập ban đầu có nhập dữ liệu yêu cầu một thiết lập mới; hãy dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, bản sao lưu và chế độ ghi đè ngoài quy trình thiết lập ban đầu.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Thiết lập ban đầu](/vi/cli/onboard)
- [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- [Bắt đầu](/vi/start/getting-started)
- [Tổng quan cài đặt](/vi/install)

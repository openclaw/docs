---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-11T20:26:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + sửa nhanh cho Gateway và các kênh.

Liên quan:

- Khắc phục sự cố: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Kiểm toán bảo mật: [Bảo mật](/vi/gateway/security)

## Ví dụ

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Đối với quyền riêng theo kênh, hãy dùng các phép thăm dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Phép thăm dò khả năng Discord có mục tiêu báo cáo các quyền kênh hiệu lực của bot; phép thăm dò trạng thái kiểm toán các kênh Discord đã cấu hình và các mục tiêu tự động tham gia thoại.

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm workspace
- `--yes`: chấp nhận mặc định mà không hỏi
- `--repair`: áp dụng các sửa chữa được khuyến nghị không liên quan đến dịch vụ mà không hỏi; cài đặt và ghi lại dịch vụ Gateway vẫn cần xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ các di trú an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway

Ghi chú:

- Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes`, và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin háo hức để kiểm tra tình trạng không giao diện vẫn nhanh. Phiên tương tác vẫn tải đầy đủ các Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hoặc ghi lại chúng ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp transcript mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không giao diện để nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng cron job cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng khi chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố ngừng hoạt động của Gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm với các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI cũ.
- Doctor ghi lại các tham chiếu mô hình `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn trên các mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và các ghim tuyến phiên cũ. `--fix` chuyển ý định Codex sang các mục `agentRuntime.id: "codex"` theo phạm vi provider/model, giữ lại các ghim auth-profile của phiên như `openai-codex:...`, xóa các ghim runtime toàn agent/phiên cũ, và giữ các tham chiếu agent OpenAI đã sửa trên định tuyến xác thực Codex thay vì xác thực khóa API OpenAI trực tiếp.
- Doctor dọn sạch trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo ra. Nó cũng sửa các Plugin có thể tải xuống bị thiếu nhưng được cấu hình tham chiếu, chẳng hạn như `plugins.entries`, kênh đã cấu hình, cài đặt provider/tìm kiếm đã cấu hình, hoặc runtime agent đã cấu hình. Trong quá trình cập nhật gói, doctor bỏ qua sửa chữa Plugin bằng trình quản lý gói cho đến khi hoán đổi gói hoàn tất; sau đó chạy lại `openclaw doctor --fix` nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo lỗi cài đặt và giữ lại mục Plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.deny`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat, và ghi đè mô hình kênh khi phát hiện Plugin khỏe mạnh.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway đã bỏ qua chỉ Plugin hỏng đó để các Plugin và kênh khác vẫn có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd không hoạt động nhưng giống Gateway bổ sung và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động di trú cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục tương tự) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin đăng nhập embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi các agent chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong home Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home tách biệt theo từng agent, nên hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài sản cần được nâng cấp có chủ ý.
- Doctor xóa `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng dùng; app-server Codex luôn giữ các công cụ workspace gốc của Codex ở dạng gốc.
- Doctor cảnh báo khi skills được cho phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các skill không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; hãy cài đặt/cấu hình yêu cầu bị thiếu thay vì vậy khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu có các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`), doctor báo cáo chúng; `openclaw doctor --fix` di trú các mục hợp lệ vào thư mục registry phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin đăng nhập fallback dạng văn bản thuần.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các di trú thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback env và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng với tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra token không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

## macOS: ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó ghi đè tệp cấu hình của bạn và có thể gây lỗi "unauthorized" kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gateway doctor](/vi/gateway/doctor)

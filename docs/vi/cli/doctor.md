---
read_when:
    - Bạn gặp sự cố về kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-10T19:27:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + sửa nhanh cho gateway và các kênh.

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

Đối với quyền theo từng kênh, hãy dùng các phép thăm dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Phép thăm dò năng lực Discord có mục tiêu báo cáo quyền kênh hiệu lực của bot; phép thăm dò trạng thái kiểm toán các kênh Discord đã cấu hình và các mục tiêu tự động tham gia thoại.

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm workspace
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không phải dịch vụ được khuyến nghị mà không nhắc; cài đặt và viết lại dịch vụ gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng các sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ các migration an toàn và sửa chữa không phải dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token gateway
- `--deep`: quét các dịch vụ hệ thống để tìm bản cài đặt gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway

Ghi chú:

- Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes`, và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, dùng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không có terminal (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải plugin sớm để kiểm tra tình trạng không có terminal luôn nhanh. Các phiên tương tác vẫn tải đầy đủ plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị loại bỏ.
- `doctor --fix --non-interactive` báo cáo định nghĩa dịch vụ gateway bị thiếu hoặc cũ nhưng không cài đặt hay viết lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` khi thiếu dịch vụ, hoặc `openclaw gateway install --force` khi bạn cố ý muốn thay thế launcher.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi hội thoại mồ côi trong thư mục phiên. Lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không có terminal sẽ giữ nguyên chúng.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm dạng tác vụ cron cũ và có thể viết lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng lúc chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố mất kết nối WhatsApp gateway khi cron thiếu môi trường user-bus của systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm với các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để trả lời WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI cũ.
- Doctor viết lại các tham chiếu model `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn trên model chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè model kênh, và các ghim tuyến phiên cũ. `--fix` chuyển ý định Codex sang các mục `agentRuntime.id: "codex"` theo phạm vi provider/model, giữ nguyên các ghim auth-profile phiên như `openai-codex:...`, loại bỏ các ghim runtime toàn agent/phiên cũ, và giữ các tham chiếu agent OpenAI đã sửa trên định tuyến auth Codex thay vì auth khóa API OpenAI trực tiếp.
- Doctor dọn dẹp trạng thái chuẩn bị phụ thuộc plugin cũ được tạo bởi các phiên bản OpenClaw cũ. Nó cũng sửa các plugin có thể tải xuống bị thiếu được tham chiếu bởi cấu hình, chẳng hạn như `plugins.entries`, các kênh đã cấu hình, thiết lập provider/tìm kiếm đã cấu hình, hoặc runtime agent đã cấu hình. Trong khi cập nhật gói, doctor bỏ qua sửa chữa plugin của trình quản lý gói cho đến khi việc hoán đổi gói hoàn tất; chạy lại `openclaw doctor --fix` sau đó nếu một plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa cấu hình plugin cũ bằng cách loại bỏ các id plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo, mục tiêu heartbeat, và ghi đè model kênh tương ứng khi quá trình phát hiện plugin khỏe mạnh.
- Doctor cách ly cấu hình plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và loại bỏ payload `config` không hợp lệ của mục đó. Khởi động Gateway vốn đã chỉ bỏ qua plugin lỗi đó để các plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời gateway. Doctor vẫn báo cáo tình trạng gateway/dịch vụ và áp dụng các sửa chữa không phải dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd bổ sung giống gateway nhưng không hoạt động và không viết lại metadata lệnh/entrypoint cho một dịch vụ gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn cố ý muốn thay thế launcher đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi các agent chế độ Codex đã được cấu hình và tài sản Codex CLI cá nhân tồn tại trong home Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê những tài sản nên được chủ động nâng cấp.
- Doctor loại bỏ `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng dùng; app-server Codex luôn giữ các công cụ workspace gốc của Codex ở dạng gốc.
- Doctor cảnh báo khi các skills được phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các skill không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó hãy cài đặt/cấu hình yêu cầu còn thiếu khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) hiện diện, doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry được phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` được quản lý bằng SecretRef và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực fallback dạng văn bản thuần.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các migration thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback biến môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

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

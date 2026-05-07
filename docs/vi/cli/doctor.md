---
read_when:
    - Bạn gặp sự cố về kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tham chiếu CLI cho `openclaw doctor` (kiểm tra sức khỏe + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-07T13:13:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7683a974eb9406e5ca071612c96c7db05247a69e253ef4293c57e7707aa5fd4
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + sửa nhanh cho Gateway và các kênh.

Liên quan:

- Khắc phục sự cố: [Khắc phục sự cố](/vi/gateway/troubleshooting)
- Kiểm tra bảo mật: [Bảo mật](/vi/gateway/security)

## Ví dụ

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

Đối với quyền dành riêng cho kênh, hãy dùng các phép dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Phép dò năng lực Discord có mục tiêu báo cáo quyền kênh hiệu dụng của bot; phép dò trạng thái kiểm tra các kênh Discord đã cấu hình và các mục tiêu tự động tham gia thoại.

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm workspace
- `--yes`: chấp nhận mặc định mà không hỏi
- `--repair`: áp dụng các sửa chữa không liên quan đến dịch vụ được khuyến nghị mà không hỏi; cài đặt và ghi lại dịch vụ Gateway vẫn cần xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ thực hiện di chuyển an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình mã thông báo Gateway
- `--deep`: quét dịch vụ hệ thống để tìm các bản cài Gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway

Ghi chú:

- Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes` và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, dùng [Khởi động nhanh](https://github.com/openclaw/nix-openclaw#quick-start) theo hướng agent trước.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không có terminal (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin sớm để các kiểm tra tình trạng không có terminal luôn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hay ghi lại chúng ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher.
- Các kiểm tra toàn vẹn trạng thái hiện phát hiện tệp transcript mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes` và các lần chạy không có terminal giữ nguyên chúng.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ Cron cũ và có thể ghi lại tại chỗ trước khi bộ lập lịch phải tự chuẩn hóa chúng lúc chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log giả về sự cố Gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm trong khi các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI cũ.
- Doctor ghi lại các tham chiếu mô hình `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn trên các mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh và ghim route phiên cũ. `--fix` chỉ chọn `agentRuntime.id: "codex"` khi Plugin Codex đã được cài đặt, bật, đóng góp harness `codex` và có OAuth dùng được; nếu không, nó chọn `agentRuntime.id: "pi"` để route vẫn dùng trình chạy OpenClaw mặc định.
- Doctor dọn trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo. Nó cũng sửa các Plugin có thể tải xuống bị thiếu nhưng được cấu hình tham chiếu, chẳng hạn như `plugins.entries`, kênh đã cấu hình, thiết lập provider/tìm kiếm đã cấu hình hoặc runtime agent đã cấu hình. Trong khi cập nhật gói, doctor bỏ qua sửa chữa Plugin bằng trình quản lý gói cho đến khi việc thay gói hoàn tất; sau đó chạy lại `openclaw doctor --fix` nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ lại mục Plugin đã cấu hình cho lần sửa chữa tiếp theo.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu heartbeat và ghi đè mô hình kênh khi khám phá Plugin hoạt động tốt.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác vẫn có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd bổ sung giống Gateway nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong khi sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId` và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi agent chế độ Codex đã được cấu hình và tài sản CLI Codex cá nhân tồn tại trong thư mục Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê các tài sản nên được thăng cấp một cách có chủ ý.
- Doctor cảnh báo khi Skills được phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các Skills không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó hãy cài đặt/cấu hình yêu cầu bị thiếu khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo có tín hiệu rõ với cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) hiện diện, doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry được phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực fallback dạng văn bản thuần.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các lần di chuyển thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) cần một mã thông báo Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra mã thông báo không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

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

---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tài liệu tham khảo CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa lỗi có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-02T20:41:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64cefee8f36b38657b72912271e3734411870376d2bd5a374d23a77a080035d
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

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm workspace
- `--yes`: chấp nhận giá trị mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không liên quan đến dịch vụ được đề xuất mà không nhắc; việc cài đặt và ghi lại dịch vụ Gateway vẫn cần xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh của `--repair`
- `--force`: áp dụng các sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ các di chuyển an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình mã thông báo Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không có giao diện đầu cuối (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin sớm để các kiểm tra tình trạng không có giao diện đầu cuối vẫn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh của `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hoặc ghi lại chúng ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy.
- Các kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi phiên mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes` và các lần chạy không có giao diện đầu cuối để nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự chuẩn hóa chúng trong thời gian chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được duy trì và có thể ghi log sai về sự cố ngừng hoạt động Gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Doctor dọn trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo ra. Nó cũng sửa các Plugin có thể tải xuống đã cấu hình nhưng bị thiếu khi registry có thể phân giải chúng, và lượt doctor 2026.5.2 tự động cài đặt các Plugin có thể tải xuống mà cấu hình cũ đã dùng trước khi đánh dấu cấu hình là đã được chạm cho bản phát hành đó.
- Doctor sửa cấu hình Plugin lỗi thời bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat và các ghi đè mô hình kênh khi quá trình phát hiện Plugin lành mạnh.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách vô hiệu hóa mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác vẫn tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd giống Gateway bổ sung không hoạt động và không ghi lại siêu dữ liệu lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId` và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng của tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép đôi DM chỉ cho phép ai đó trò chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi các agent ở chế độ Codex được cấu hình và các tài sản Codex CLI cá nhân tồn tại trong thư mục Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê các tài sản nên được chủ động nâng cấp.
- Doctor cảnh báo khi Skills được cho phép cho agent mặc định không khả dụng trong môi trường thời gian chạy hiện tại vì thiếu bin, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành. `doctor --fix` có thể vô hiệu hóa các skill không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; hãy cài đặt/cấu hình yêu cầu bị thiếu thay vào đó khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực plaintext dự phòng.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các di chuyển thư mục trạng thái, doctor cảnh báo khi các tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào env fallback và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) cần một mã thông báo Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra mã thông báo không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

## macOS: ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình của bạn và có thể gây lỗi “unauthorized” kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor Gateway](/vi/gateway/doctor)

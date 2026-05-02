---
read_when:
    - Bạn gặp vấn đề về kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra sơ bộ
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-02T10:37:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
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
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không phải dịch vụ được đề xuất mà không nhắc; cài đặt và ghi lại dịch vụ Gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng các sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ áp dụng di chuyển an toàn và sửa chữa không phải dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét dịch vụ hệ thống để tìm các bản cài Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lần chạy không có giao diện (Cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin chủ động để kiểm tra tình trạng không có giao diện luôn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo định nghĩa dịch vụ Gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hoặc ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi phiên mồ côi trong thư mục sessions. Lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không có giao diện để chúng nguyên tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng job Cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng khi chạy.
- Trên Linux, Doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố Gateway WhatsApp khi Cron thiếu môi trường user-bus của systemd.
- Doctor dọn trạng thái staging dependency Plugin cũ được tạo bởi các phiên bản OpenClaw cũ hơn. Nó cũng sửa các Plugin có thể tải xuống đã cấu hình nhưng bị thiếu khi registry có thể phân giải chúng.
- Doctor sửa cấu hình Plugin lỗi thời bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng cấu hình kênh treo tương ứng, mục tiêu Heartbeat, và ghi đè mô hình kênh khi phát hiện Plugin hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của mục đó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không phải dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, Doctor bỏ qua các unit systemd giống Gateway bổ sung nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong lúc sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi các agent chế độ Codex được cấu hình và tài nguyên CLI Codex cá nhân tồn tại trong Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home biệt lập theo từng agent, nên hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài nguyên cần được chủ ý đưa lên.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, Doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, Doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng văn bản thuần.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, Doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau khi di chuyển thư mục trạng thái, Doctor cảnh báo khi các tài khoản Telegram hoặc Discord mặc định đang bật phụ thuộc vào dự phòng env và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình Doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, Doctor báo cáo cảnh báo và bỏ qua tự động phân giải trong lượt đó.

## macOS: ghi đè env của `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình của bạn và có thể gây lỗi “unauthorized” kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor của Gateway](/vi/gateway/doctor)

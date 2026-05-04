---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-04T02:22:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + bản sửa nhanh cho Gateway và các kênh.

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

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm không gian làm việc
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa được khuyến nghị không liên quan đến dịch vụ mà không nhắc; cài đặt và ghi lại dịch vụ Gateway vẫn cần xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy mà không có lời nhắc; chỉ các di chuyển an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa chuỗi khóa/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không giao diện (Cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua tải Plugin sớm để kiểm tra tình trạng không giao diện luôn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hoặc ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn cố ý muốn thay thế trình khởi chạy.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi hội thoại mồ côi trong thư mục phiên. Lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không giao diện giữ nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ Cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng lúc chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố ngừng hoạt động của WhatsApp Gateway khi Cron thiếu môi trường user-bus của systemd.
- Doctor dọn trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo ra. Nó cũng sửa các Plugin có thể tải xuống đã cấu hình nhưng bị thiếu khi registry có thể phân giải chúng, và lần chạy doctor 2026.5.2 tự động cài đặt các Plugin có thể tải xuống mà cấu hình cũ đã dùng trước khi đánh dấu cấu hình đã được chạm cho bản phát hành đó. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục Plugin đã cấu hình cho lần sửa tiếp theo.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat và ghi đè mô hình kênh khi phát hiện Plugin hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của mục đó. Khởi động Gateway đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd bổ sung giống Gateway nhưng không hoạt động và không ghi lại metadata lệnh/điểm vào cho một dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn cố ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk dạng phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi các agent chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong thư mục gốc Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng thư mục gốc riêng biệt theo từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài sản cần được chủ động nâng cấp.
- Doctor cảnh báo khi Skills được cho phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các Skills không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó hãy cài đặt/cấu hình yêu cầu bị thiếu khi bạn muốn giữ Skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) tồn tại, doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` được quản lý bằng SecretRef và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực plaintext dự phòng.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa chữa, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các lần di chuyển thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào dự phòng env và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) cần token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lần chạy đó.

## macOS: ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó ghi đè tệp cấu hình của bạn và có thể gây lỗi “không được ủy quyền” kéo dài.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gateway doctor](/vi/gateway/doctor)

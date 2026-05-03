---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tài liệu tham khảo CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-05-03T21:28:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra sức khỏe + sửa nhanh cho Gateway và các kênh.

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

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm workspace
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không liên quan đến dịch vụ được khuyến nghị mà không nhắc; cài đặt và ghi lại dịch vụ Gateway vẫn cần xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ áp dụng di chuyển an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lượt chạy không có giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lượt chạy `doctor` không tương tác bỏ qua tải Plugin sớm để các kiểm tra sức khỏe không có giao diện luôn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hay ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi phiên mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes`, và các lượt chạy không có giao diện giữ nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng công việc cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự chuẩn hóa chúng khi chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố ngừng hoạt động Gateway WhatsApp khi cron thiếu môi trường systemd user-bus.
- Doctor dọn dẹp trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo ra. Nó cũng sửa các Plugin có thể tải xuống đã cấu hình nhưng bị thiếu khi registry có thể phân giải chúng, và lượt doctor 2026.5.2 tự động cài đặt các Plugin có thể tải xuống mà cấu hình cũ đã sử dụng trước khi đánh dấu cấu hình là đã được chạm cho bản phát hành đó.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat, và ghi đè mô hình kênh khi khám phá Plugin khỏe mạnh.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách vô hiệu hóa mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo sức khỏe Gateway/dịch vụ và áp dụng sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd giống Gateway bổ sung nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho một dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lượt chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép đôi DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi tác tử chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong thư mục chính Codex của người vận hành. Các lần khởi chạy máy chủ ứng dụng Codex cục bộ dùng thư mục chính tách biệt theo từng tác tử, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài sản cần được chủ động nâng cấp.
- Doctor cảnh báo khi Skills được phép cho tác tử mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu hệ điều hành. `doctor --fix` có thể vô hiệu hóa các Skills không khả dụng đó với `skills.entries.<skill>.enabled=false`; thay vào đó hãy cài đặt/cấu hình yêu cầu bị thiếu khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) hiện diện, doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng văn bản thuần.
- Nếu việc kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các lần di chuyển thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào env fallback và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) cần token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra token không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

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

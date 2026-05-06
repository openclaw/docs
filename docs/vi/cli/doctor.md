---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra sơ bộ
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-06T09:05:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
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
- `--repair`: áp dụng các sửa chữa không liên quan đến dịch vụ được đề xuất mà không nhắc; cài đặt và ghi lại dịch vụ Gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh Gateway tường minh
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng các sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ các migration an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm thêm bản cài đặt Gateway và báo cáo các lần bàn giao khởi động lại supervisor Gateway gần đây

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lần chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin chủ động để kiểm tra tình trạng không giao diện vẫn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hay ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy.
- Các kiểm tra toàn vẹn trạng thái hiện phát hiện tệp transcript mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không giao diện giữ nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự chuẩn hóa chúng khi chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được duy trì và có thể ghi log sai về sự cố Gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway suy giảm với các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng sau các vòng làm mới TUI cũ.
- Doctor ghi lại các tham chiếu model `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn trên model chính, fallback, override heartbeat/subagent/compaction, hook, override model kênh, và các ghim tuyến phiên cũ. `--fix` chỉ chọn `agentRuntime.id: "codex"` khi Plugin Codex đã được cài đặt, bật, đóng góp harness `codex`, và có OAuth dùng được; nếu không, nó chọn `agentRuntime.id: "pi"` để tuyến vẫn ở trình chạy OpenClaw mặc định.
- Doctor dọn trạng thái staging phụ thuộc Plugin cũ do các phiên bản OpenClaw cũ tạo. Nó cũng sửa các Plugin tải xuống bị thiếu được cấu hình tham chiếu, chẳng hạn như `plugins.entries`, kênh đã cấu hình, cài đặt provider/tìm kiếm đã cấu hình, hoặc agent runtime đã cấu hình. Trong quá trình cập nhật gói, doctor bỏ qua sửa chữa Plugin bằng trình quản lý gói cho đến khi việc hoán đổi gói hoàn tất; chạy lại `openclaw doctor --fix` sau đó nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo lỗi cài đặt và giữ lại mục Plugin đã cấu hình cho lần thử sửa chữa tiếp theo.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo, đích heartbeat, và override model kênh khớp khi khám phá Plugin hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd phụ giống Gateway nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động migrate cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa object.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép nối DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` tường minh.
- Doctor cảnh báo khi agent chế độ Codex được cấu hình và tài sản CLI Codex cá nhân tồn tại trong thư mục Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home tách biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài sản cần được thăng cấp có chủ ý.
- Doctor cảnh báo khi Skills được phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu OS. `doctor --fix` có thể tắt các skill không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; hãy cài đặt/cấu hình yêu cầu còn thiếu nếu bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao với cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) hiện diện, doctor sẽ báo cáo chúng; `openclaw doctor --fix` migrate các mục hợp lệ vào thư mục registry phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực fallback dạng plaintext.
- Nếu kiểm tra SecretRef kênh thất bại trong đường dẫn sửa chữa, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các migration thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback env và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải tên người dùng `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

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

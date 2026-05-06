---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn cách khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-06T17:53:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra tình trạng + sửa nhanh cho gateway và kênh.

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
- `--yes`: chấp nhận mặc định mà không hỏi
- `--repair`: áp dụng các sửa chữa không thuộc dịch vụ được đề xuất mà không hỏi; cài đặt và ghi lại dịch vụ gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ thực hiện di chuyển an toàn và sửa chữa không thuộc dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway

Ghi chú:

- Ở chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes`, và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không có giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải plugin sớm để các kiểm tra tình trạng không có giao diện luôn nhanh. Phiên tương tác vẫn tải đầy đủ plugin khi một kiểm tra cần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi một bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ gateway bị thiếu hoặc lỗi thời nhưng không cài đặt hoặc ghi lại chúng bên ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp transcript mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không có giao diện sẽ giữ nguyên chúng.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng lúc chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Khi bật WhatsApp, doctor kiểm tra vòng lặp sự kiện Gateway bị suy giảm trong khi các máy khách `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các máy khách TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng sau các vòng lặp làm mới TUI lỗi thời.
- Doctor ghi lại các tham chiếu mô hình `openai-codex/*` cũ thành tham chiếu `openai/*` chuẩn trên mô hình chính, fallback, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và ghim tuyến phiên lỗi thời. `--fix` chọn `agentRuntime.id: "codex"` chỉ khi Plugin Codex được cài đặt, bật, đóng góp harness `codex`, và có OAuth dùng được; nếu không, nó chọn `agentRuntime.id: "pi"` để tuyến vẫn dùng trình chạy OpenClaw mặc định.
- Doctor dọn dẹp trạng thái staging phụ thuộc plugin cũ được tạo bởi các phiên bản OpenClaw cũ hơn. Nó cũng sửa các plugin có thể tải xuống bị thiếu nhưng được tham chiếu bởi cấu hình, chẳng hạn như `plugins.entries`, kênh đã cấu hình, thiết lập provider/tìm kiếm đã cấu hình, hoặc runtime agent đã cấu hình. Trong quá trình cập nhật gói, doctor bỏ qua sửa chữa plugin bằng trình quản lý gói cho đến khi việc hoán đổi gói hoàn tất; chạy lại `openclaw doctor --fix` sau đó nếu plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục plugin đã cấu hình cho lần thử sửa chữa tiếp theo.
- Doctor sửa cấu hình plugin lỗi thời bằng cách xóa các id plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu heartbeat, và ghi đè mô hình kênh khi khám phá plugin hoạt động tốt.
- Doctor cách ly cấu hình plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Khởi động Gateway đã chỉ bỏ qua plugin lỗi đó để các plugin và kênh khác vẫn có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời gateway. Doctor vẫn báo cáo tình trạng gateway/dịch vụ và áp dụng các sửa chữa không thuộc dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các systemd unit giống gateway bổ sung không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ gateway systemd đang chạy trong quá trình sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế launcher đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể đề xuất `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép đôi DM chỉ cho phép ai đó trò chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Doctor cảnh báo khi agent chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong thư mục home Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê tài sản cần được chủ ý nâng cấp.
- Doctor cảnh báo khi các skills được cho phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu OS. `doctor --fix` có thể tắt những skills không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; thay vào đó hãy cài đặt/cấu hình yêu cầu còn thiếu khi bạn muốn giữ skill hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu có các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`), doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng văn bản thuần.
- Nếu kiểm tra SecretRef kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các lần di chuyển thư mục trạng thái, doctor cảnh báo khi tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào fallback env và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải username `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu kiểm tra token không khả dụng, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

## macOS: ghi đè env `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó ghi đè tệp cấu hình của bạn và có thể gây lỗi "unauthorized" dai dẳng.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor Gateway](/vi/gateway/doctor)

---
read_when:
    - Bạn gặp vấn đề về kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra sơ bộ
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-05-12T08:45:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
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

Đối với quyền theo từng kênh, hãy dùng các phép dò kênh thay vì `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

Phép dò khả năng Discord có mục tiêu báo cáo quyền kênh hiệu dụng của bot; phép dò trạng thái kiểm tra các kênh Discord đã cấu hình và các mục tiêu tự động tham gia thoại.

## Tùy chọn

- `--no-workspace-suggestions`: tắt gợi ý tìm kiếm/bộ nhớ workspace
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa không liên quan đến dịch vụ được khuyến nghị mà không nhắc; việc cài đặt và ghi lại dịch vụ Gateway vẫn yêu cầu xác nhận tương tác hoặc lệnh Gateway rõ ràng
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ thực hiện di chuyển an toàn và sửa chữa không liên quan đến dịch vụ
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung và báo cáo các lần bàn giao khởi động lại gần đây của trình giám sát Gateway

Ghi chú:

- Trong chế độ Nix (`OPENCLAW_NIX_MODE=1`), các kiểm tra doctor chỉ đọc vẫn hoạt động, nhưng `doctor --fix`, `doctor --repair`, `doctor --yes`, và `doctor --generate-gateway-token` bị tắt vì `openclaw.json` là bất biến. Thay vào đó hãy chỉnh sửa nguồn Nix cho bản cài đặt này; với nix-openclaw, hãy dùng [Bắt đầu nhanh](https://github.com/openclaw/nix-openclaw#quick-start) ưu tiên agent.
- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không có giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin sớm để các kiểm tra tình trạng không có giao diện vẫn nhanh. Phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi một bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- `doctor --fix --non-interactive` báo cáo các định nghĩa dịch vụ Gateway bị thiếu hoặc cũ nhưng không cài đặt hoặc ghi lại chúng ngoài chế độ sửa chữa cập nhật. Chạy `openclaw gateway install` cho dịch vụ bị thiếu, hoặc `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy.
- Các kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp transcript mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không có giao diện sẽ giữ nguyên chúng.
- doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng khi chạy.
- Trên Linux, doctor cảnh báo khi crontab của người dùng vẫn chạy `~/.openclaw/bin/ensure-whatsapp.sh` cũ; script đó không còn được bảo trì và có thể ghi log sai về sự cố Gateway WhatsApp khi cron thiếu môi trường user-bus của systemd.
- Khi WhatsApp được bật, doctor kiểm tra vòng lặp sự kiện Gateway suy giảm với các client `openclaw-tui` cục bộ vẫn đang chạy. `doctor --fix` chỉ dừng các client TUI cục bộ đã xác minh để phản hồi WhatsApp không bị xếp hàng phía sau các vòng lặp làm mới TUI cũ.
- doctor ghi lại các tham chiếu mô hình `openai-codex/*` cũ thành các tham chiếu `openai/*` chuẩn trên các mô hình chính, dự phòng, ghi đè heartbeat/subagent/compaction, hook, ghi đè mô hình kênh, và ghim tuyến phiên cũ. `--fix` chuyển ý định Codex sang các mục `agentRuntime.id: "codex"` theo phạm vi provider/model, giữ nguyên các ghim auth-profile của phiên như `openai-codex:...`, xóa các ghim runtime toàn agent/phiên cũ, và giữ các tham chiếu agent OpenAI đã sửa trên định tuyến xác thực Codex thay vì xác thực khóa API OpenAI trực tiếp.
- doctor dọn dẹp trạng thái staging phụ thuộc Plugin cũ được tạo bởi các phiên bản OpenClaw cũ hơn và liên kết lại gói `openclaw` của host cho các Plugin npm được quản lý khai báo nó là peer dependency. Nó cũng sửa các Plugin có thể tải xuống bị thiếu đang được cấu hình tham chiếu, chẳng hạn như `plugins.entries`, các kênh đã cấu hình, cài đặt provider/search đã cấu hình, hoặc runtime agent đã cấu hình. Trong quá trình cập nhật gói, doctor bỏ qua sửa chữa Plugin bằng package-manager cho đến khi việc thay thế gói hoàn tất; chạy lại `openclaw doctor --fix` sau đó nếu một Plugin đã cấu hình vẫn cần khôi phục. Nếu tải xuống thất bại, doctor báo cáo lỗi cài đặt và giữ nguyên mục Plugin đã cấu hình cho lần sửa chữa tiếp theo.
- doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.deny`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat, và ghi đè mô hình kênh khi phát hiện Plugin hoạt động tốt.
- doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của mục đó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một trình giám sát khác sở hữu vòng đời Gateway. doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các unit systemd giống Gateway bổ sung không hoạt động và không ghi lại metadata lệnh/entrypoint cho một dịch vụ Gateway systemd đang chạy trong khi sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các cấu hình liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa đối tượng.
- doctor bao gồm một kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó trò chuyện với bot; nếu bạn đã phê duyệt người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- doctor cảnh báo khi các agent ở chế độ Codex được cấu hình và tài sản Codex CLI cá nhân tồn tại trong home Codex của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt theo từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê các tài sản cần được nâng cấp có chủ đích.
- doctor xóa `plugins.entries.codex.config.codexDynamicToolsProfile` đã ngừng dùng; app-server Codex luôn giữ các công cụ workspace gốc của Codex ở dạng gốc.
- doctor cảnh báo khi các kỹ năng được cho phép cho agent mặc định không khả dụng trong môi trường runtime hiện tại vì thiếu bin, biến môi trường, cấu hình, hoặc yêu cầu hệ điều hành. `doctor --fix` có thể tắt các kỹ năng không khả dụng đó bằng `skills.entries.<skill>.enabled=false`; hãy cài đặt/cấu hình yêu cầu còn thiếu thay vào đó khi bạn muốn giữ kỹ năng hoạt động.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo một cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu các tệp registry sandbox cũ (`~/.openclaw/sandbox/containers.json` hoặc `~/.openclaw/sandbox/browsers.json`) hiện diện, doctor báo cáo chúng; `openclaw doctor --fix` di chuyển các mục hợp lệ vào thư mục registry được phân mảnh và cách ly các tệp cũ không hợp lệ.
- Nếu `gateway.auth.token`/`gateway.auth.password` do SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng plaintext.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa chữa, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Sau các lần di chuyển thư mục trạng thái, doctor cảnh báo khi các tài khoản Telegram hoặc Discord mặc định đã bật phụ thuộc vào dự phòng biến môi trường và `TELEGRAM_BOT_TOKEN` hoặc `DISCORD_BOT_TOKEN` không khả dụng cho tiến trình doctor.
- Tự động phân giải username `allowFrom` của Telegram (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt đó.

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

---
read_when:
    - Bạn gặp sự cố về kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra sơ bộ
summary: Tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Chẩn đoán
x-i18n:
    generated_at: "2026-04-30T20:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265d82a10da086cf89687886e491be018a720b70021e0b26bd8f39b25a907e14
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Kiểm tra sức khỏe + sửa nhanh cho Gateway và các kênh.

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
- `--repair`: áp dụng các sửa chữa được khuyến nghị mà không nhắc
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng các sửa chữa mạnh tay, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy không có lời nhắc; chỉ các di chuyển an toàn
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét các dịch vụ hệ thống để tìm các bản cài đặt Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và **không** đặt `--non-interactive`. Các lần chạy không giao diện (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải Plugin sớm để kiểm tra sức khỏe không giao diện vẫn nhanh. Các phiên tương tác vẫn tải đầy đủ Plugin khi một kiểm tra cần phần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp bản ghi phiên mồ côi trong thư mục phiên. Việc lưu trữ chúng dưới dạng `.deleted.<timestamp>` yêu cầu xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không giao diện sẽ để nguyên chúng.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ Cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng lúc chạy.
- Doctor sửa các phụ thuộc runtime bị thiếu của Plugin đóng gói mà không ghi vào các bản cài đặt global đã đóng gói. Với các bản cài npm thuộc root hoặc các systemd unit được gia cố, đặt `OPENCLAW_PLUGIN_STAGE_DIR` thành một thư mục có thể ghi như `/var/lib/openclaw/plugin-runtime-deps`; nó cũng có thể là một danh sách đường dẫn như `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, trong đó các gốc trước là các lớp tra cứu chỉ đọc và gốc cuối cùng là đích sửa chữa.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo, mục tiêu Heartbeat, và các ghi đè mô hình kênh tương ứng khi khám phá Plugin hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của nó. Quá trình khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo sức khỏe Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các systemd unit bổ sung giống Gateway nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong khi sửa chữa. Dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn chủ ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động di chuyển cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) vào `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy `doctor --fix` lặp lại không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa của đối tượng.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy các lệnh chỉ dành cho chủ sở hữu và phê duyệt các hành động nguy hiểm. Ghép đôi DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` một cách rõ ràng.
- Doctor cảnh báo khi các agent chế độ Codex được cấu hình và tài nguyên Codex CLI cá nhân tồn tại trong thư mục Codex home của người vận hành. Các lần khởi chạy app-server Codex cục bộ dùng home riêng biệt cho từng agent, vì vậy hãy dùng `openclaw migrate codex --dry-run` để kiểm kê các tài nguyên nên được thăng cấp có chủ ý.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` được quản lý bằng SecretRef và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực plaintext dự phòng.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa chữa, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Tự động phân giải tên người dùng Telegram `allowFrom` (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lần chạy đó.

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
- [Gateway doctor](/vi/gateway/doctor)

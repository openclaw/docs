---
read_when:
    - Bạn gặp sự cố kết nối/xác thực và muốn được hướng dẫn khắc phục
    - Bạn đã cập nhật và muốn kiểm tra nhanh tính hợp lý
summary: Tài liệu tham chiếu CLI cho `openclaw doctor` (kiểm tra tình trạng + sửa chữa có hướng dẫn)
title: Trình chẩn đoán
x-i18n:
    generated_at: "2026-04-29T22:31:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
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

- `--no-workspace-suggestions`: tắt gợi ý bộ nhớ/tìm kiếm không gian làm việc
- `--yes`: chấp nhận mặc định mà không nhắc
- `--repair`: áp dụng các sửa chữa được khuyến nghị mà không nhắc
- `--fix`: bí danh cho `--repair`
- `--force`: áp dụng sửa chữa mạnh, bao gồm ghi đè cấu hình dịch vụ tùy chỉnh khi cần
- `--non-interactive`: chạy mà không có lời nhắc; chỉ các migration an toàn
- `--generate-gateway-token`: tạo và cấu hình token Gateway
- `--deep`: quét dịch vụ hệ thống để tìm các bản cài Gateway bổ sung

Ghi chú:

- Lời nhắc tương tác (như sửa keychain/OAuth) chỉ chạy khi stdin là TTY và `--non-interactive` **không** được đặt. Các lần chạy không có terminal (cron, Telegram, không có terminal) sẽ bỏ qua lời nhắc.
- Hiệu năng: các lần chạy `doctor` không tương tác bỏ qua việc tải plugin chủ động để các kiểm tra tình trạng không có terminal luôn nhanh. Phiên tương tác vẫn tải đầy đủ plugin khi một kiểm tra cần đóng góp của chúng.
- `--fix` (bí danh cho `--repair`) ghi bản sao lưu vào `~/.openclaw/openclaw.json.bak` và loại bỏ các khóa cấu hình không xác định, liệt kê từng mục bị xóa.
- Kiểm tra tính toàn vẹn trạng thái hiện phát hiện các tệp transcript mồ côi trong thư mục phiên. Lưu trữ chúng dưới dạng `.deleted.<timestamp>` cần xác nhận tương tác; `--fix`, `--yes`, và các lần chạy không có terminal giữ nguyên chúng tại chỗ.
- Doctor cũng quét `~/.openclaw/cron/jobs.json` (hoặc `cron.store`) để tìm các dạng tác vụ Cron cũ và có thể ghi lại chúng tại chỗ trước khi bộ lập lịch phải tự động chuẩn hóa chúng lúc chạy.
- Doctor sửa các phụ thuộc runtime Plugin đi kèm bị thiếu mà không ghi vào các bản cài global đã đóng gói. Với bản cài npm do root sở hữu hoặc systemd unit được siết chặt, đặt `OPENCLAW_PLUGIN_STAGE_DIR` thành một thư mục có thể ghi như `/var/lib/openclaw/plugin-runtime-deps`; nó cũng có thể là danh sách đường dẫn như `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps`, trong đó các root trước là lớp tra cứu chỉ đọc và root cuối là mục tiêu sửa chữa.
- Doctor sửa cấu hình Plugin cũ bằng cách xóa các id Plugin bị thiếu khỏi `plugins.allow`/`plugins.entries`, cùng với cấu hình kênh treo tương ứng, mục tiêu Heartbeat, và ghi đè mô hình kênh khi phát hiện Plugin đang hoạt động bình thường.
- Doctor cách ly cấu hình Plugin không hợp lệ bằng cách tắt mục `plugins.entries.<id>` bị ảnh hưởng và xóa payload `config` không hợp lệ của mục đó. Khởi động Gateway vốn đã chỉ bỏ qua Plugin lỗi đó để các Plugin và kênh khác có thể tiếp tục chạy.
- Đặt `OPENCLAW_SERVICE_REPAIR_POLICY=external` khi một supervisor khác sở hữu vòng đời Gateway. Doctor vẫn báo cáo tình trạng Gateway/dịch vụ và áp dụng các sửa chữa không liên quan đến dịch vụ, nhưng bỏ qua cài đặt/khởi động/khởi động lại/bootstrap dịch vụ và dọn dẹp dịch vụ cũ.
- Trên Linux, doctor bỏ qua các systemd unit bổ sung giống Gateway nhưng không hoạt động và không ghi lại metadata lệnh/entrypoint cho dịch vụ Gateway systemd đang chạy trong quá trình sửa chữa. Hãy dừng dịch vụ trước hoặc dùng `openclaw gateway install --force` khi bạn cố ý muốn thay thế trình khởi chạy đang hoạt động.
- Doctor tự động migrate cấu hình Talk phẳng cũ (`talk.voiceId`, `talk.modelId`, và các mục liên quan) sang `talk.provider` + `talk.providers.<provider>`.
- Các lần chạy lặp lại `doctor --fix` không còn báo cáo/áp dụng chuẩn hóa Talk khi khác biệt duy nhất là thứ tự khóa object.
- Doctor bao gồm kiểm tra mức sẵn sàng tìm kiếm bộ nhớ và có thể khuyến nghị `openclaw configure --section model` khi thiếu thông tin xác thực embedding.
- Doctor cảnh báo khi chưa cấu hình chủ sở hữu lệnh. Chủ sở hữu lệnh là tài khoản người vận hành được phép chạy lệnh chỉ dành cho chủ sở hữu và phê duyệt hành động nguy hiểm. Ghép cặp DM chỉ cho phép ai đó nói chuyện với bot; nếu bạn đã phê duyệt một người gửi trước khi bootstrap chủ sở hữu đầu tiên tồn tại, hãy đặt `commands.ownerAllowFrom` rõ ràng.
- Nếu chế độ sandbox được bật nhưng Docker không khả dụng, doctor báo cáo cảnh báo tín hiệu cao kèm cách khắc phục (`install Docker` hoặc `openclaw config set agents.defaults.sandbox.mode off`).
- Nếu `gateway.auth.token`/`gateway.auth.password` được SecretRef quản lý và không khả dụng trong đường dẫn lệnh hiện tại, doctor báo cáo cảnh báo chỉ đọc và không ghi thông tin xác thực dự phòng dạng plaintext.
- Nếu kiểm tra SecretRef của kênh thất bại trong đường dẫn sửa lỗi, doctor tiếp tục và báo cáo cảnh báo thay vì thoát sớm.
- Tự động phân giải username Telegram `allowFrom` (`doctor --fix`) yêu cầu token Telegram có thể phân giải trong đường dẫn lệnh hiện tại. Nếu không thể kiểm tra token, doctor báo cáo cảnh báo và bỏ qua tự động phân giải cho lượt chạy đó.

## macOS: ghi đè env của `launchctl`

Nếu trước đây bạn đã chạy `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (hoặc `...PASSWORD`), giá trị đó sẽ ghi đè tệp cấu hình của bạn và có thể gây lỗi “unauthorized” dai dẳng.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Gateway doctor](/vi/gateway/doctor)

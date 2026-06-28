---
read_when:
    - Tích hợp ứng dụng Mac với vòng đời Gateway
summary: Vòng đời Gateway trên macOS (launchd)
title: Vòng đời Gateway trên macOS
x-i18n:
    generated_at: "2026-05-06T09:21:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Ứng dụng macOS mặc định **quản lý Gateway qua launchd** và không sinh
Gateway như một tiến trình con. Trước tiên, ứng dụng cố gắng kết nối với một
Gateway đã chạy sẵn trên cổng đã cấu hình; nếu không thể truy cập Gateway nào,
ứng dụng sẽ bật dịch vụ launchd qua CLI `openclaw` bên ngoài (không có runtime
nhúng). Điều này mang lại khả năng tự động khởi động đáng tin cậy khi đăng nhập
và khởi động lại khi gặp sự cố.

Chế độ tiến trình con (Gateway được ứng dụng sinh trực tiếp) hiện **không được sử dụng**.
Nếu bạn cần liên kết chặt hơn với UI, hãy chạy Gateway thủ công trong terminal.

## Hành vi mặc định (launchd)

- Ứng dụng cài đặt một LaunchAgent theo từng người dùng có nhãn `ai.openclaw.gateway`
  (hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` cũ vẫn được hỗ trợ).
- Khi chế độ Cục bộ được bật, ứng dụng đảm bảo LaunchAgent đã được tải và
  khởi động Gateway nếu cần.
- Log được ghi vào đường dẫn log Gateway của launchd (hiển thị trong Cài đặt gỡ lỗi).

Các lệnh thường dùng:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một hồ sơ có tên.

## Bản dựng dev chưa ký

`scripts/restart-mac.sh --no-sign` dành cho các bản dựng cục bộ nhanh khi bạn không có
khóa ký. Để ngăn launchd trỏ tới một binary relay chưa ký, lệnh này:

- Ghi `~/.openclaw/disable-launchagent`.

Các lần chạy đã ký của `scripts/restart-mac.sh` sẽ xóa phần ghi đè này nếu marker
tồn tại. Để đặt lại thủ công:

```bash
rm ~/.openclaw/disable-launchagent
```

## Chế độ chỉ kết nối

Để buộc ứng dụng macOS **không bao giờ cài đặt hoặc quản lý launchd**, hãy khởi chạy bằng
`--attach-only` (hoặc `--no-launchd`). Thao tác này đặt `~/.openclaw/disable-launchagent`,
nên ứng dụng chỉ kết nối với một Gateway đã chạy sẵn. Bạn có thể bật/tắt cùng
hành vi này trong Cài đặt gỡ lỗi.

## Chế độ từ xa

Chế độ từ xa không bao giờ khởi động Gateway cục bộ. Ứng dụng dùng đường hầm SSH tới
máy chủ từ xa và kết nối qua đường hầm đó.

## Vì sao chúng tôi ưu tiên launchd

- Tự động khởi động khi đăng nhập.
- Ngữ nghĩa khởi động lại/KeepAlive tích hợp sẵn.
- Log và giám sát dễ dự đoán.

Nếu một chế độ tiến trình con thực sự lại cần thiết trong tương lai, chế độ đó nên được ghi tài liệu như một
chế độ riêng biệt, rõ ràng và chỉ dành cho dev.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Runbook Gateway](/vi/gateway)

---
read_when:
    - Tích hợp ứng dụng Mac với vòng đời Gateway
summary: Vòng đời Gateway trên macOS (launchd)
title: Vòng đời Gateway
x-i18n:
    generated_at: "2026-04-29T22:56:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 16
---

# Vòng đời Gateway trên macOS

Theo mặc định, ứng dụng macOS **quản lý Gateway thông qua launchd** và không sinh
Gateway dưới dạng tiến trình con. Trước tiên, ứng dụng cố gắng gắn vào một
Gateway đang chạy sẵn trên cổng đã cấu hình; nếu không thể kết nối, ứng dụng bật
dịch vụ launchd thông qua CLI `openclaw` bên ngoài (không có runtime nhúng). Cách
này mang lại khả năng tự động khởi động đáng tin cậy khi đăng nhập và khởi động
lại khi gặp sự cố.

Chế độ tiến trình con (Gateway được ứng dụng sinh trực tiếp) hiện **không được sử dụng**.
Nếu bạn cần liên kết chặt hơn với giao diện người dùng, hãy chạy Gateway thủ công
trong terminal.

## Hành vi mặc định (launchd)

- Ứng dụng cài đặt một LaunchAgent theo từng người dùng có nhãn `ai.openclaw.gateway`
  (hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` cũ vẫn được hỗ trợ).
- Khi chế độ cục bộ được bật, ứng dụng đảm bảo LaunchAgent đã được tải và
  khởi động Gateway nếu cần.
- Nhật ký được ghi vào đường dẫn nhật ký gateway của launchd (hiển thị trong Cài đặt gỡ lỗi).

Các lệnh thường dùng:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một hồ sơ có tên.

## Bản dựng phát triển chưa ký

`scripts/restart-mac.sh --no-sign` dành cho các bản dựng cục bộ nhanh khi bạn không có
khóa ký. Để ngăn launchd trỏ đến một tệp nhị phân relay chưa ký, lệnh này:

- Ghi `~/.openclaw/disable-launchagent`.

Các lần chạy đã ký của `scripts/restart-mac.sh` sẽ xóa ghi đè này nếu dấu hiệu
đó tồn tại. Để đặt lại thủ công:

```bash
rm ~/.openclaw/disable-launchagent
```

## Chế độ chỉ gắn

Để buộc ứng dụng macOS **không bao giờ cài đặt hoặc quản lý launchd**, hãy khởi chạy với
`--attach-only` (hoặc `--no-launchd`). Tùy chọn này đặt `~/.openclaw/disable-launchagent`,
nên ứng dụng chỉ gắn vào một Gateway đã chạy sẵn. Bạn có thể bật/tắt cùng hành vi
trong Cài đặt gỡ lỗi.

## Chế độ từ xa

Chế độ từ xa không bao giờ khởi động Gateway cục bộ. Ứng dụng dùng một đường hầm SSH đến
máy chủ từ xa và kết nối qua đường hầm đó.

## Vì sao chúng tôi ưu tiên launchd

- Tự động khởi động khi đăng nhập.
- Ngữ nghĩa khởi động lại/KeepAlive tích hợp.
- Nhật ký và giám sát dễ dự đoán.

Nếu một chế độ tiến trình con thực sự cần thiết trở lại, chế độ đó nên được ghi tài liệu
như một chế độ riêng biệt, rõ ràng, chỉ dành cho phát triển.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Runbook Gateway](/vi/gateway)

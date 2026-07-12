---
read_when:
    - Tích hợp ứng dụng Mac với vòng đời của Gateway
summary: Vòng đời Gateway trên macOS (launchd)
title: Vòng đời Gateway trên macOS
x-i18n:
    generated_at: "2026-07-12T08:04:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

Theo mặc định, ứng dụng macOS quản lý Gateway thông qua **launchd** và không
khởi chạy Gateway dưới dạng tiến trình con. Trước tiên, ứng dụng thử kết nối với
một Gateway đang chạy trên cổng đã cấu hình; nếu không thể kết nối đến Gateway nào,
ứng dụng sẽ bật dịch vụ launchd thông qua CLI `openclaw` bên ngoài (không có
môi trường chạy nhúng). Cơ chế này giúp tự động khởi động ổn định khi đăng nhập và
khởi động lại khi xảy ra sự cố.

Chế độ tiến trình con (Gateway được ứng dụng trực tiếp khởi chạy) **hiện không được sử dụng**.
Nếu cần tích hợp chặt chẽ hơn với giao diện người dùng, hãy chạy Gateway thủ công trong
terminal.

## Hành vi mặc định (launchd)

- Ứng dụng cài đặt một LaunchAgent riêng cho từng người dùng, có nhãn `ai.openclaw.gateway` (hoặc
  `ai.openclaw.<profile>` khi sử dụng `--profile`/`OPENCLAW_PROFILE`).
- Khi chế độ Cục bộ được bật, ứng dụng bảo đảm LaunchAgent đã được nạp và
  khởi động Gateway nếu cần.
- Nhật ký được ghi vào đường dẫn nhật ký Gateway của launchd (hiển thị trong Cài đặt gỡ lỗi).

Các lệnh thường dùng:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một hồ sơ có tên.

## Bản dựng phát triển chưa ký

`scripts/restart-mac.sh --no-sign` dành cho các bản dựng cục bộ nhanh không có khóa
ký. Để ngăn launchd trỏ đến một tệp nhị phân chuyển tiếp chưa ký, lệnh này ghi
`~/.openclaw/disable-launchagent`.

Các lần chạy đã ký của `scripts/restart-mac.sh` sẽ xóa thiết lập ghi đè này nếu có
tệp đánh dấu. Để đặt lại thủ công:

```bash
rm ~/.openclaw/disable-launchagent
```

## Chế độ chỉ kết nối

Để buộc ứng dụng macOS không bao giờ cài đặt hoặc quản lý launchd, hãy khởi chạy ứng dụng với
`--attach-only` (hoặc `--no-launchd`). Thao tác này thiết lập
`~/.openclaw/disable-launchagent`, vì vậy ứng dụng chỉ kết nối với một
Gateway đang chạy. Bật hoặc tắt hành vi tương tự trong Cài đặt gỡ lỗi.

## Chế độ từ xa

Chế độ từ xa không bao giờ khởi động Gateway cục bộ. Ứng dụng sử dụng đường hầm SSH đến
máy chủ từ xa và kết nối qua đường hầm đó.

## Lý do chúng tôi ưu tiên launchd

- Tự động khởi động khi đăng nhập.
- Ngữ nghĩa khởi động lại/KeepAlive tích hợp sẵn.
- Nhật ký và cơ chế giám sát có tính dự đoán.

Nếu chế độ tiến trình con thực sự cần thiết trở lại, chế độ này phải được ghi tài liệu dưới dạng
một chế độ riêng biệt, rõ ràng và chỉ dành cho phát triển.

## Liên quan

- [Ứng dụng macOS](/vi/platforms/macos)
- [Cẩm nang vận hành Gateway](/vi/gateway)

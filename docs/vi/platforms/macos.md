---
read_when:
    - Cài đặt ứng dụng macOS
    - Quyết định giữa chế độ Gateway cục bộ và từ xa trên macOS
    - Đang tìm bản tải xuống phát hành ứng dụng macOS
summary: Cài đặt và sử dụng ứng dụng thanh menu macOS của OpenClaw
title: Ứng dụng macOS
x-i18n:
    generated_at: "2026-07-04T06:38:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **ứng dụng đồng hành trên thanh menu** của OpenClaw. Dùng ứng dụng này khi bạn muốn có giao diện khay hệ thống gốc, lời nhắc quyền trên macOS, thông báo, WebChat, nhập liệu bằng giọng nói, Canvas, hoặc các công cụ node do Mac lưu trữ như `system.run`.

Nếu bạn chỉ cần CLI và Gateway, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).

## Tải xuống

Tải các bản dựng ứng dụng macOS từ
[OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases).
Khi một bản phát hành có tài nguyên ứng dụng macOS, hãy tìm:

- `OpenClaw-<version>.dmg` (ưu tiên)
- `OpenClaw-<version>.zip`

Một số bản phát hành chỉ bao gồm CLI, bằng chứng, hoặc tài nguyên Windows. Nếu bản phát hành mới nhất
không có tài nguyên ứng dụng macOS, hãy dùng bản phát hành mới nhất có tài nguyên đó, hoặc dựng ứng dụng
từ mã nguồn với [thiết lập phát triển macOS](/vi/platforms/mac/dev-setup).

## Lần chạy đầu tiên

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Chọn **This Mac** cho Gateway cục bộ, hoặc kết nối tới Gateway từ xa.
3. Với chế độ cục bộ, hãy chờ trong khi ứng dụng cài đặt runtime và Gateway trong không gian người dùng.
4. Hoàn tất thiết lập nhà cung cấp và danh sách kiểm tra quyền trên macOS.
5. Gửi thông điệp kiểm thử onboarding.

Với lộ trình thiết lập CLI/Gateway, hãy dùng [Bắt đầu](/vi/start/getting-started).
Để khôi phục quyền, hãy dùng [quyền trên macOS](/vi/platforms/mac/permissions).

## Chọn chế độ Gateway

| Chế độ | Dùng khi                                                                                  | Trang chi tiết                                     |
| ------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cục bộ | Mac này sẽ chạy Gateway và giữ nó hoạt động bằng launchd.                                 | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) |
| Từ xa  | Một máy chủ khác chạy Gateway và Mac này sẽ điều khiển nó qua SSH, LAN, hoặc Tailnet.     | [Điều khiển từ xa](/vi/platforms/mac/remote)          |

Chế độ cục bộ yêu cầu CLI `openclaw` đã được cài đặt. Trên một máy Mac mới, ứng dụng tự động cài đặt
CLI và runtime tương ứng trước khi khởi động trình hướng dẫn Gateway.
Xem [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) để khôi phục thủ công.

## Ứng dụng đảm nhiệm những gì

- Trạng thái thanh menu, thông báo, sức khỏe, và WebChat.
- Lời nhắc quyền trên macOS cho màn hình, micrô, giọng nói, tự động hóa, và trợ năng.
- Các công cụ node cục bộ như Canvas, chụp camera/màn hình, thông báo, và `system.run`.
- Lời nhắc phê duyệt exec cho các lệnh do Mac lưu trữ.
- Đường hầm SSH ở chế độ từ xa hoặc kết nối Gateway trực tiếp.

Ứng dụng **không** thay thế Gateway của OpenClaw hoặc tài liệu CLI chung. Cấu hình
Gateway lõi, nhà cung cấp, plugin, kênh, công cụ, và bảo mật nằm trong
tài liệu riêng của chúng.

## Trang chi tiết macOS

| Tác vụ                                   | Đọc                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cài đặt hoặc gỡ lỗi dịch vụ CLI/Gateway  | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway)                                        |
| Giữ trạng thái ngoài các thư mục được đồng bộ lên đám mây | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Gỡ lỗi khám phá ứng dụng và kết nối      | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#debug-app-connectivity)                 |
| Hiểu hành vi launchd                     | [Vòng đời Gateway](/vi/platforms/mac/child-process)                                            |
| Sửa quyền hoặc sự cố ký/TCC              | [quyền trên macOS](/vi/platforms/mac/permissions)                                              |
| Kết nối tới Gateway từ xa                | [Điều khiển từ xa](/vi/platforms/mac/remote)                                                   |
| Đọc trạng thái thanh menu và kiểm tra sức khỏe | [Thanh menu](/vi/platforms/mac/menu-bar), [Kiểm tra sức khỏe](/vi/platforms/mac/health)             |
| Dùng giao diện chat nhúng                | [WebChat](/vi/platforms/mac/webchat)                                                           |
| Dùng đánh thức bằng giọng nói hoặc nhấn để nói | [Đánh thức bằng giọng nói](/vi/platforms/mac/voicewake)                                          |
| Dùng Canvas và liên kết sâu Canvas       | [Canvas](/vi/platforms/mac/canvas)                                                             |
| Lưu trữ PeekabooBridge cho tự động hóa giao diện | [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)                                                  |
| Cấu hình phê duyệt lệnh                  | [Phê duyệt exec](/vi/tools/exec-approvals), [chi tiết nâng cao](/vi/tools/exec-approvals-advanced) |
| Kiểm tra lệnh node trên Mac và IPC của ứng dụng | [IPC macOS](/vi/platforms/mac/xpc)                                                             |
| Thu thập nhật ký                         | [ghi nhật ký macOS](/vi/platforms/mac/logging)                                                 |
| Dựng từ mã nguồn                         | [thiết lập phát triển macOS](/vi/platforms/mac/dev-setup)                                      |

## Liên quan

- [Nền tảng](/vi/platforms)
- [Bắt đầu](/vi/start/getting-started)
- [Gateway](/vi/gateway)
- [Phê duyệt exec](/vi/tools/exec-approvals)

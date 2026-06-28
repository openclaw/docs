---
read_when:
    - Cài đặt ứng dụng macOS
    - Quyết định giữa chế độ Gateway cục bộ và từ xa trên macOS
    - Đang tìm bản tải xuống phát hành ứng dụng macOS
summary: Cài đặt và sử dụng ứng dụng thanh menu macOS của OpenClaw
title: Ứng dụng macOS
x-i18n:
    generated_at: "2026-06-28T00:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **ứng dụng đồng hành trên thanh menu** của OpenClaw. Dùng ứng dụng này khi bạn muốn có
giao diện khay gốc, lời nhắc quyền macOS, thông báo, WebChat, đầu vào bằng giọng nói,
Canvas, hoặc các công cụ node do Mac lưu trữ như `system.run`.

Nếu bạn chỉ cần CLI và Gateway, hãy bắt đầu với [Bắt đầu](/vi/start/getting-started).

## Tải xuống

Tải các bản dựng ứng dụng macOS từ
[OpenClaw GitHub releases](https://github.com/openclaw/openclaw/releases).
Khi một bản phát hành có tài nguyên ứng dụng macOS, hãy tìm:

- `OpenClaw-<version>.dmg` (khuyến nghị)
- `OpenClaw-<version>.zip`

Một số bản phát hành chỉ bao gồm CLI, bằng chứng, hoặc tài nguyên Windows. Nếu bản phát hành mới nhất
không có tài nguyên ứng dụng macOS, hãy dùng bản phát hành mới nhất có tài nguyên đó, hoặc dựng
ứng dụng từ mã nguồn bằng [thiết lập phát triển macOS](/vi/platforms/mac/dev-setup).

## Lần chạy đầu tiên

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Hoàn tất danh sách kiểm tra quyền macOS.
3. Chọn chế độ **Cục bộ** hoặc **Từ xa**.
4. Cài đặt CLI `openclaw` nếu ứng dụng yêu cầu.
5. Mở WebChat từ thanh menu và gửi một tin nhắn thử nghiệm.

Đối với đường dẫn thiết lập CLI/Gateway, hãy dùng [Bắt đầu](/vi/start/getting-started).
Để khôi phục quyền, hãy dùng [quyền macOS](/vi/platforms/mac/permissions).

## Chọn chế độ Gateway

| Chế độ | Dùng khi                                                                                 | Trang chi tiết                                      |
| ------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Cục bộ | Máy Mac này nên chạy Gateway và giữ nó hoạt động bằng launchd.                           | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway) |
| Từ xa  | Một máy chủ khác chạy Gateway và máy Mac này nên điều khiển nó qua SSH, LAN, hoặc Tailnet. | [Điều khiển từ xa](/vi/platforms/mac/remote)          |

Chế độ cục bộ yêu cầu CLI `openclaw` đã được cài đặt. Ứng dụng có thể cài đặt nó, hoặc bạn
có thể làm theo [Gateway trên macOS](/vi/platforms/mac/bundled-gateway).

## Ứng dụng chịu trách nhiệm những gì

- Trạng thái thanh menu, thông báo, tình trạng, và WebChat.
- Lời nhắc quyền macOS cho màn hình, micrô, giọng nói, tự động hóa, và trợ năng.
- Các công cụ node cục bộ như Canvas, chụp camera/màn hình, thông báo, và `system.run`.
- Lời nhắc phê duyệt thực thi cho các lệnh do Mac lưu trữ.
- Đường hầm SSH ở chế độ từ xa hoặc kết nối Gateway trực tiếp.

Ứng dụng **không** thay thế Gateway OpenClaw hoặc tài liệu CLI chung. Cấu hình
Gateway lõi, nhà cung cấp, plugin, kênh, công cụ, và bảo mật nằm trong
tài liệu riêng của chúng.

## Trang chi tiết macOS

| Tác vụ                                   | Đọc                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cài đặt hoặc gỡ lỗi dịch vụ CLI/Gateway  | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway)                                        |
| Giữ trạng thái ngoài các thư mục đồng bộ đám mây | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#state-directory-on-macos)               |
| Gỡ lỗi phát hiện ứng dụng và kết nối     | [Gateway trên macOS](/vi/platforms/mac/bundled-gateway#debug-app-connectivity)                 |
| Hiểu hành vi launchd                     | [Vòng đời Gateway](/vi/platforms/mac/child-process)                                            |
| Sửa quyền hoặc sự cố ký/TCC              | [quyền macOS](/vi/platforms/mac/permissions)                                                   |
| Kết nối với Gateway từ xa                | [Điều khiển từ xa](/vi/platforms/mac/remote)                                                   |
| Đọc trạng thái thanh menu và kiểm tra tình trạng | [Thanh menu](/vi/platforms/mac/menu-bar), [Kiểm tra tình trạng](/vi/platforms/mac/health)         |
| Dùng giao diện trò chuyện nhúng          | [WebChat](/vi/platforms/mac/webchat)                                                           |
| Dùng đánh thức bằng giọng nói hoặc nhấn để nói | [Đánh thức bằng giọng nói](/vi/platforms/mac/voicewake)                                        |
| Dùng Canvas và liên kết sâu Canvas       | [Canvas](/vi/platforms/mac/canvas)                                                             |
| Lưu trữ PeekabooBridge cho tự động hóa giao diện | [Cầu nối Peekaboo](/vi/platforms/mac/peekaboo)                                                 |
| Cấu hình phê duyệt lệnh                  | [Phê duyệt thực thi](/vi/tools/exec-approvals), [chi tiết nâng cao](/vi/tools/exec-approvals-advanced) |
| Kiểm tra lệnh node trên Mac và IPC của ứng dụng | [IPC macOS](/vi/platforms/mac/xpc)                                                             |
| Thu thập nhật ký                         | [Ghi nhật ký macOS](/vi/platforms/mac/logging)                                                 |
| Dựng từ mã nguồn                         | [thiết lập phát triển macOS](/vi/platforms/mac/dev-setup)                                      |

## Liên quan

- [Nền tảng](/vi/platforms)
- [Bắt đầu](/vi/start/getting-started)
- [Gateway](/vi/gateway)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)

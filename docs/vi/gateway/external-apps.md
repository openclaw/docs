---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, script, dashboard, công việc CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang chọn giữa RPC của Gateway và Plugin SDK
    - Bạn đang tích hợp với các lượt chạy tác tử Gateway, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ
sidebarTitle: External apps
summary: Đường dẫn tích hợp hiện tại cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: Tích hợp Gateway cho ứng dụng bên ngoài
x-i18n:
    generated_at: "2026-06-27T17:29:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

Ứng dụng bên ngoài hiện nên giao tiếp với OpenClaw thông qua giao thức Gateway. Sử dụng
Gateway WebSocket và các phương thức RPC khi một script, dashboard, tác vụ CI, tiện ích mở rộng IDE
hoặc một tiến trình khác muốn khởi động lượt chạy tác tử, phát trực tuyến sự kiện, chờ
kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Warning>
  Hiện chưa có gói client npm công khai. Đừng thêm tên gói client OpenClaw
  làm phụ thuộc ứng dụng cho đến khi ghi chú phát hành công bố một gói đã được
  xuất bản và trang này bao gồm hướng dẫn cài đặt.
</Warning>

<Note>
  Trang này dành cho mã bên ngoài tiến trình OpenClaw. Mã Plugin chạy
  bên trong OpenClaw nên dùng các đường dẫn con `openclaw/plugin-sdk/*` đã được tài liệu hóa.
</Note>

## Hiện có những gì

| Bề mặt                                 | Trạng thái | Dùng cho                                                                                    |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Giao thức Gateway](/vi/gateway/protocol)   | Sẵn sàng  | Truyền tải WebSocket, bắt tay kết nối, phạm vi xác thực, quản lý phiên bản giao thức và sự kiện.         |
| [Tham chiếu RPC Gateway](/vi/reference/rpc) | Sẵn sàng  | Các phương thức Gateway hiện tại cho tác tử, phiên, tác vụ, mô hình, công cụ, tạo tác và phê duyệt. |
| [`openclaw agent`](/vi/cli/agent)          | Sẵn sàng  | Tích hợp script chạy một lần khi gọi ra CLI là đủ.                           |
| [`openclaw message`](/vi/cli/message)      | Sẵn sàng  | Gửi tin nhắn hoặc hành động kênh từ script.                                             |

Cây mã nguồn chứa công việc gói nội bộ cho một thư viện client trong tương lai, nhưng
đó không phải là bề mặt cài đặt công khai. Hãy xem nó là chi tiết triển khai xem trước
cho đến khi các gói được xuất bản và quản lý phiên bản.

## Lộ trình khuyến nghị

1. Chạy hoặc phát hiện một Gateway.
2. Kết nối qua [giao thức Gateway](/vi/gateway/protocol).
3. Gọi các phương thức RPC đã được tài liệu hóa từ [tham chiếu RPC Gateway](/vi/reference/rpc).
4. Ghim phiên bản OpenClaw mà bạn kiểm thử cùng.
5. Kiểm tra lại tham chiếu RPC khi nâng cấp OpenClaw.

Đối với lượt chạy tác tử, hãy bắt đầu với RPC `agent` và ghép nó với `agent.wait` khi
bạn cần một kết quả cuối. Đối với trạng thái hội thoại bền vững, hãy dùng các
phương thức `sessions.*`. Đối với tích hợp UI, hãy đăng ký sự kiện Gateway và chỉ kết xuất
các nhóm sự kiện mà ứng dụng của bạn hiểu.

## Mã ứng dụng so với mã Plugin

Dùng Gateway RPC khi mã nằm bên ngoài OpenClaw:

- Script Node khởi động hoặc quan sát lượt chạy tác tử
- Tác vụ CI gọi một Gateway
- dashboard và bảng quản trị
- tiện ích mở rộng IDE
- cầu nối bên ngoài không cần trở thành Plugin kênh
- kiểm thử tích hợp với truyền tải Gateway giả hoặc thật

Dùng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin nhà cung cấp
- Plugin kênh
- hook công cụ hoặc vòng đời
- Plugin harness tác tử
- trợ giúp runtime đáng tin cậy

Ứng dụng bên ngoài không nên import `openclaw/plugin-sdk/*`; các đường dẫn con đó dành cho
Plugin được OpenClaw tải.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Lệnh CLI agent](/vi/cli/agent)
- [Lệnh CLI message](/vi/cli/message)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Runtime tác tử](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác tử ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)

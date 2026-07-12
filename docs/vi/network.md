---
read_when:
    - Bạn cần phần tổng quan về kiến trúc mạng và bảo mật
    - Bạn đang gỡ lỗi quyền truy cập cục bộ so với qua tailnet hoặc quá trình ghép nối
    - Bạn muốn danh sách tài liệu mạng chính thức
summary: 'Trung tâm mạng: các bề mặt Gateway, ghép nối, khám phá và bảo mật'
title: Mạng
x-i18n:
    generated_at: "2026-07-12T08:03:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

Hub này liên kết các tài liệu cốt lõi về cách OpenClaw kết nối, ghép nối và bảo mật
thiết bị trên localhost, LAN và tailnet.

## Mô hình cốt lõi

Hầu hết thao tác đều đi qua Gateway (`openclaw gateway`), một tiến trình chạy dài hạn duy nhất quản lý các kết nối kênh và mặt phẳng điều khiển WebSocket.

- **Ưu tiên loopback**: Gateway WS mặc định sử dụng `ws://127.0.0.1:18789`.
  Các địa chỉ bind không phải loopback sẽ từ chối khởi động nếu không có phương thức xác thực Gateway hợp lệ:
  xác thực bằng token/mật khẩu bí mật dùng chung, hoặc một triển khai không phải loopback
  `trusted-proxy` được cấu hình đúng.
- **Nên dùng một Gateway trên mỗi máy chủ**. Để cô lập, hãy chạy nhiều Gateway với các hồ sơ và cổng riêng biệt ([Nhiều Gateway](/vi/gateway/multiple-gateways)).
- **Máy chủ Canvas** được phục vụ trên cùng cổng với Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) và được bảo vệ bằng xác thực Gateway khi bind ra ngoài loopback.
- **Truy cập từ xa** thường sử dụng đường hầm SSH hoặc VPN Tailscale ([Truy cập từ xa](/vi/gateway/remote)).

Tài liệu tham khảo chính:

- [Kiến trúc Gateway](/vi/concepts/architecture)
- [Giao thức Gateway](/vi/gateway/protocol)
- [Sổ tay vận hành Gateway](/vi/gateway)
- [Các bề mặt web + chế độ bind](/vi/web)

## Ghép nối + danh tính

- [Tổng quan về ghép nối (DM + Node)](/vi/channels/pairing)
- [Ghép nối Node do Gateway quản lý](/vi/gateway/pairing)
- [CLI thiết bị (ghép nối + luân chuyển token)](/vi/cli/devices)
- [CLI ghép nối (phê duyệt DM)](/vi/cli/pairing)

Tin cậy cục bộ:

- Các kết nối local loopback trực tiếp (không có header chuyển tiếp/proxy) có thể được
  tự động phê duyệt ghép nối để duy trì trải nghiệm mượt mà trên cùng máy chủ.
- OpenClaw cũng có một đường dẫn tự kết nối hẹp, cục bộ với backend/container, dành cho
  các luồng trình trợ giúp dùng bí mật chung đáng tin cậy.
- Máy khách tailnet và LAN, bao gồm cả các bind tailnet trên cùng máy chủ, vẫn yêu cầu
  phê duyệt ghép nối rõ ràng.

## Khám phá + phương thức truyền tải

- [Khám phá và phương thức truyền tải](/vi/gateway/discovery)
- [Bonjour / mDNS](/vi/gateway/bonjour)
- [Truy cập từ xa (SSH)](/vi/gateway/remote)
- [Tailscale](/vi/gateway/tailscale)

## Node + phương thức truyền tải

- [Tổng quan về Node](/vi/nodes)
- [Giao thức cầu nối (Node cũ, mang tính lịch sử)](/vi/gateway/bridge-protocol)
- [Sổ tay vận hành Node: iOS](/vi/platforms/ios)
- [Sổ tay vận hành Node: Android](/vi/platforms/android)

## Bảo mật

- [Tổng quan về bảo mật](/vi/gateway/security)
- [Tài liệu tham chiếu cấu hình Gateway](/vi/gateway/configuration)
- [Khắc phục sự cố](/vi/gateway/troubleshooting)
- [Doctor](/vi/gateway/doctor)

## Liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Truy cập từ xa](/vi/gateway/remote)

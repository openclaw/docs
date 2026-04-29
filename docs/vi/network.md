---
read_when:
    - Bạn cần tổng quan về kiến trúc mạng + bảo mật
    - Bạn đang gỡ lỗi truy cập cục bộ so với truy cập qua mạng Tailscale hoặc ghép đôi
    - Bạn muốn danh sách chuẩn các tài liệu về mạng
summary: 'Trung tâm mạng: các bề mặt của Gateway, ghép nối, phát hiện và bảo mật'
title: Mạng
x-i18n:
    generated_at: "2026-04-29T22:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 16
---

# Trung tâm mạng

Trung tâm này liên kết các tài liệu cốt lõi về cách OpenClaw kết nối, ghép đôi và bảo mật
thiết bị trên localhost, LAN và tailnet.

## Mô hình cốt lõi

Hầu hết thao tác đi qua Gateway (`openclaw gateway`), một tiến trình chạy lâu dài duy nhất sở hữu các kết nối kênh và mặt phẳng điều khiển WebSocket.

- **Ưu tiên loopback**: Gateway WS mặc định dùng `ws://127.0.0.1:18789`.
  Các bind không phải loopback yêu cầu một đường dẫn xác thực gateway hợp lệ: xác thực
  bằng token/mật khẩu shared-secret, hoặc một triển khai không phải loopback
  `trusted-proxy` được cấu hình đúng.
- Khuyến nghị dùng **một Gateway trên mỗi host**. Để cách ly, hãy chạy nhiều gateway với các hồ sơ và cổng riêng biệt ([Nhiều Gateway](/vi/gateway/multiple-gateways)).
- **Host canvas** được phục vụ trên cùng cổng với Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), được bảo vệ bằng xác thực Gateway khi bind vượt ngoài loopback.
- **Truy cập từ xa** thường là đường hầm SSH hoặc VPN Tailscale ([Truy cập từ xa](/vi/gateway/remote)).

Tài liệu tham khảo chính:

- [Kiến trúc Gateway](/vi/concepts/architecture)
- [Giao thức Gateway](/vi/gateway/protocol)
- [Runbook Gateway](/vi/gateway)
- [Bề mặt web + chế độ bind](/vi/web)

## Ghép đôi + danh tính

- [Tổng quan ghép đôi (DM + nút)](/vi/channels/pairing)
- [Ghép đôi nút do Gateway sở hữu](/vi/gateway/pairing)
- [CLI thiết bị (ghép đôi + xoay vòng token)](/vi/cli/devices)
- [CLI ghép đôi (phê duyệt DM)](/vi/cli/pairing)

Tin cậy cục bộ:

- Các kết nối local loopback trực tiếp có thể được tự động phê duyệt để ghép đôi nhằm giữ
  trải nghiệm cùng host mượt mà.
- OpenClaw cũng có một đường dẫn tự kết nối backend/container-local hẹp cho
  các luồng trợ giúp trusted shared-secret.
- Các client tailnet và LAN, bao gồm cả bind tailnet cùng host, vẫn yêu cầu
  phê duyệt ghép đôi rõ ràng.

## Khám phá + truyền tải

- [Khám phá & truyền tải](/vi/gateway/discovery)
- [Bonjour / mDNS](/vi/gateway/bonjour)
- [Truy cập từ xa (SSH)](/vi/gateway/remote)
- [Tailscale](/vi/gateway/tailscale)

## Nút + truyền tải

- [Tổng quan nút](/vi/nodes)
- [Giao thức cầu nối (nút cũ, lịch sử)](/vi/gateway/bridge-protocol)
- [Runbook nút: iOS](/vi/platforms/ios)
- [Runbook nút: Android](/vi/platforms/android)

## Bảo mật

- [Tổng quan bảo mật](/vi/gateway/security)
- [Tham chiếu cấu hình Gateway](/vi/gateway/configuration)
- [Khắc phục sự cố](/vi/gateway/troubleshooting)
- [Doctor](/vi/gateway/doctor)

## Liên quan

- [Mô hình mạng Gateway](/vi/gateway/network-model)
- [Truy cập từ xa](/vi/gateway/remote)

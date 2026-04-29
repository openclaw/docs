---
read_when:
    - Bạn muốn có cái nhìn ngắn gọn về mô hình mạng của Gateway
summary: Cách Gateway, các Node và máy chủ canvas kết nối.
title: Mô hình mạng
x-i18n:
    generated_at: "2026-04-29T22:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 16
---

> Nội dung này đã được hợp nhất vào [Mạng](/vi/network#core-model). Xem trang đó để biết hướng dẫn hiện tại.

Hầu hết thao tác đi qua Gateway (`openclaw gateway`), một tiến trình chạy lâu duy nhất
sở hữu các kết nối kênh và mặt phẳng điều khiển WebSocket.

## Quy tắc cốt lõi

- Khuyến nghị dùng một Gateway cho mỗi máy chủ. Đây là tiến trình duy nhất được phép sở hữu phiên WhatsApp Web. Với bot cứu hộ hoặc cách ly nghiêm ngặt, hãy chạy nhiều gateway với hồ sơ và cổng được tách biệt. Xem [Nhiều gateway](/vi/gateway/multiple-gateways).
- Ưu tiên loopback: Gateway WS mặc định là `ws://127.0.0.1:18789`. Trình hướng dẫn tạo xác thực shared-secret theo mặc định và thường tạo token, ngay cả với loopback. Để truy cập không qua loopback, hãy dùng một đường dẫn xác thực gateway hợp lệ: xác thực bằng token/mật khẩu shared-secret, hoặc triển khai `trusted-proxy` không qua loopback được cấu hình đúng. Các thiết lập tailnet/di động thường hoạt động tốt nhất qua Tailscale Serve hoặc một endpoint `wss://` khác thay vì `ws://` tailnet thô.
- Các node kết nối tới Gateway WS qua LAN, tailnet hoặc SSH khi cần. Cầu nối TCP
  cũ đã bị gỡ bỏ.
- Máy chủ Canvas được phục vụ bởi máy chủ HTTP của Gateway trên **cùng cổng** với Gateway (mặc định `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    Khi `gateway.auth` được cấu hình và Gateway bind ra ngoài loopback, các route này được bảo vệ bằng xác thực Gateway. Client Node dùng các URL capability theo phạm vi node, gắn với phiên WS đang hoạt động của chúng. Xem [Cấu hình Gateway](/vi/gateway/configuration) (`canvasHost`, `gateway`).
- Sử dụng từ xa thường là qua đường hầm SSH hoặc VPN tailnet. Xem [Truy cập từ xa](/vi/gateway/remote) và [Khám phá](/vi/gateway/discovery).

## Liên quan

- [Truy cập từ xa](/vi/gateway/remote)
- [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth)
- [Giao thức Gateway](/vi/gateway/protocol)

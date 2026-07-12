---
read_when:
    - Bạn muốn truy cập Gateway qua Tailscale
    - Bạn muốn giao diện điều khiển trên trình duyệt và chức năng chỉnh sửa cấu hình
summary: 'Các giao diện web của Gateway: giao diện điều khiển, chế độ liên kết và bảo mật'
title: Web
x-i18n:
    generated_at: "2026-07-12T08:32:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway cung cấp một **giao diện điều khiển trên trình duyệt** nhỏ (Vite + Lit) từ cùng cổng với Gateway WebSocket:

- mặc định: `http://<host>:18789/`
- với `gateway.tls.enabled: true`: `https://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Các chức năng được trình bày trong [Giao diện điều khiển](/vi/web/control-ui). Trang này đề cập đến các chế độ liên kết, bảo mật và các bề mặt khác hướng ra web.

## Cấu hình (bật theo mặc định)

Giao diện điều khiển được **bật theo mặc định** khi có các tài nguyên (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath không bắt buộc
  },
}
```

## Webhook

Khi `hooks.enabled=true`, Gateway cũng cung cấp một điểm cuối Webhook trên cùng máy chủ HTTP. Xem `hooks` trong [tài liệu tham khảo cấu hình Gateway](/vi/gateway/configuration-reference#hooks) để biết thông tin về xác thực và tải trọng.

## RPC HTTP quản trị

`POST /api/v1/admin/rpc` cung cấp một số phương thức mặt phẳng điều khiển của Gateway qua HTTP. Tính năng này mặc định tắt và chỉ được đăng ký khi Plugin `admin-http-rpc` được bật. Xem [RPC HTTP quản trị](/vi/plugins/admin-http-rpc) để biết mô hình xác thực, các phương thức được phép và nội dung so sánh với API WebSocket.

## Truy cập qua Tailscale

<Tabs>
  <Tab title="Serve tích hợp (khuyến nghị)">
    Giữ Gateway trên local loopback và để Tailscale Serve làm proxy cho Gateway:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Khởi động Gateway:

    ```bash
    openclaw gateway
    ```

    Mở `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` mà bạn đã cấu hình).

  </Tab>
  <Tab title="Liên kết tailnet + mã thông báo">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Khởi động Gateway (ví dụ không dùng local loopback này sử dụng xác thực bằng mã thông báo bí mật dùng chung):

    ```bash
    openclaw gateway
    ```

    Mở `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` mà bạn đã cấu hình).

  </Tab>
  <Tab title="Internet công cộng (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // hoặc OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` yêu cầu `gateway.auth.mode: "password"`; cả Serve và Funnel đều yêu cầu `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Lưu ý bảo mật

- Xác thực Gateway được yêu cầu theo mặc định: mã thông báo, mật khẩu, proxy tin cậy hoặc tiêu đề danh tính Tailscale Serve khi được bật.
- Các liên kết không phải local loopback vẫn **yêu cầu** xác thực Gateway: xác thực bằng mã thông báo/mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- Trình hướng dẫn thiết lập ban đầu tạo xác thực bằng bí mật dùng chung theo mặc định và thường tạo mã thông báo Gateway, ngay cả trên local loopback.
- Trong chế độ bí mật dùng chung, giao diện gửi `connect.params.auth.token` hoặc `connect.params.auth.password` trong quá trình bắt tay WebSocket.
- Với `gateway.tls.enabled: true`, các trình trợ giúp bảng điều khiển/trạng thái cục bộ hiển thị URL `https://` và URL WebSocket `wss://`.
- Trong các chế độ có danh tính (Tailscale Serve, `trusted-proxy`), bước kiểm tra xác thực WebSocket được đáp ứng bằng các tiêu đề yêu cầu thay vì bí mật dùng chung.
- Đối với các bản triển khai giao diện điều khiển công khai không dùng local loopback, hãy đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn gốc đầy đủ). Các lượt tải riêng tư cùng nguồn gốc được chấp nhận mà không cần tùy chọn này đối với local loopback, RFC1918/link-local, `.local`, `.ts.net` và các máy chủ CGNAT của Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` bật phương án dự phòng xác định nguồn gốc bằng tiêu đề Host; đây là hành động hạ cấp bảo mật nguy hiểm.
- Với Serve, các tiêu đề danh tính Tailscale đáp ứng yêu cầu xác thực giao diện điều khiển/WebSocket khi `gateway.auth.allowTailscale: true` (không cần mã thông báo/mật khẩu). Các điểm cuối API HTTP không sử dụng tiêu đề danh tính Tailscale; chúng luôn tuân theo chế độ xác thực HTTP thông thường của Gateway. Đặt `gateway.auth.allowTailscale: false` để yêu cầu thông tin xác thực rõ ràng ngay cả qua Serve. Luồng không dùng mã thông báo này giả định rằng chính máy chủ Gateway là đáng tin cậy. Xem [Tailscale](/vi/gateway/tailscale) và [Bảo mật](/vi/gateway/security).

## Xây dựng giao diện

Gateway cung cấp các tệp tĩnh từ `dist/control-ui`:

```bash
pnpm ui:build
```

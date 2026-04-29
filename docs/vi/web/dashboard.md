---
read_when:
    - Thay đổi chế độ xác thực hoặc chế độ công khai của bảng điều khiển
summary: Quyền truy cập và xác thực cho bảng điều khiển Gateway (Control UI)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-04-29T23:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 16
---

Gateway dashboard là giao diện điều khiển trên trình duyệt được phục vụ tại `/` theo mặc định
(ghi đè bằng `gateway.controlUi.basePath`).

Mở nhanh (Gateway cục bộ):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))
- Với `gateway.tls.enabled: true`, dùng `https://127.0.0.1:18789/` và
  `wss://127.0.0.1:18789` cho điểm cuối WebSocket.

Tài liệu tham khảo chính:

- [Giao diện điều khiển](/vi/web/control-ui) về cách sử dụng và khả năng của giao diện.
- [Tailscale](/vi/gateway/tailscale) về tự động hóa Serve/Funnel.
- [Bề mặt web](/vi/web) về chế độ bind và ghi chú bảo mật.

Xác thực được thực thi tại bước bắt tay WebSocket thông qua đường dẫn xác thực Gateway
đã cấu hình:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- header định danh trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Xem `gateway.auth` trong [Cấu hình Gateway](/vi/gateway/configuration).

Ghi chú bảo mật: giao diện điều khiển là **bề mặt quản trị** (chat, cấu hình, phê duyệt exec).
Không công khai nó ra internet. Giao diện lưu token trong URL dashboard vào sessionStorage
cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn, rồi xóa chúng khỏi URL sau khi tải.
Ưu tiên localhost, Tailscale Serve, hoặc đường hầm SSH.

## Lộ trình nhanh (khuyến nghị)

- Sau khi onboarding, CLI tự động mở dashboard và in một liên kết sạch (không có token).
- Mở lại bất cứ lúc nào: `openclaw dashboard` (sao chép liên kết, mở trình duyệt nếu có thể, hiển thị gợi ý SSH nếu không có giao diện đồ họa).
- Nếu giao diện nhắc xác thực bằng shared-secret, hãy dán token hoặc
  mật khẩu đã cấu hình vào phần cài đặt giao diện điều khiển.

## Kiến thức xác thực cơ bản (cục bộ so với từ xa)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **Gateway TLS**: khi `gateway.tls.enabled: true`, liên kết dashboard/trạng thái dùng
  `https://` và liên kết WebSocket của giao diện điều khiển dùng `wss://`.
- **Nguồn token shared-secret**: `gateway.auth.token` (hoặc
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` có thể truyền token qua fragment URL
  để bootstrap một lần, và giao diện điều khiển giữ token trong sessionStorage cho
  phiên tab trình duyệt hiện tại và URL Gateway đã chọn thay vì localStorage.
- Nếu `gateway.auth.token` do SecretRef quản lý, `openclaw dashboard`
  sẽ in/sao chép/mở một URL không có token theo thiết kế. Việc này tránh làm lộ
  token được quản lý bên ngoài trong log shell, lịch sử clipboard, hoặc tham số
  khởi chạy trình duyệt.
- Nếu `gateway.auth.token` được cấu hình là SecretRef và chưa được phân giải trong
  shell hiện tại của bạn, `openclaw dashboard` vẫn in một URL không có token cùng
  hướng dẫn thiết lập xác thực có thể thực hiện.
- **Mật khẩu shared-secret**: dùng `gateway.auth.password` đã cấu hình (hoặc
  `OPENCLAW_GATEWAY_PASSWORD`). Dashboard không lưu mật khẩu qua các lần tải lại.
- **Chế độ mang định danh**: Tailscale Serve có thể đáp ứng xác thực giao diện điều khiển/WebSocket
  qua header định danh khi `gateway.auth.allowTailscale: true`, và một reverse proxy
  không phải loopback, nhận biết định danh có thể đáp ứng
  `gateway.auth.mode: "trusted-proxy"`. Trong các chế độ đó, dashboard không
  cần shared secret được dán cho WebSocket.
- **Không phải localhost**: dùng Tailscale Serve, một bind shared-secret không phải loopback, một
  reverse proxy không phải loopback, nhận biết định danh với
  `gateway.auth.mode: "trusted-proxy"`, hoặc một đường hầm SSH. API HTTP vẫn dùng
  xác thực shared-secret trừ khi bạn chủ ý chạy ingress riêng
  `gateway.auth.mode: "none"` hoặc xác thực HTTP trusted-proxy. Xem
  [Bề mặt web](/vi/web).

<a id="if-you-see-unauthorized-1008"></a>

## Nếu bạn thấy "unauthorized" / 1008

- Đảm bảo Gateway có thể truy cập được (cục bộ: `openclaw status`; từ xa: đường hầm SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`).
- Với `AUTH_TOKEN_MISMATCH`, client có thể thử lại một lần đáng tin cậy bằng token thiết bị đã lưu đệm khi Gateway trả về gợi ý thử lại. Lần thử lại bằng token đã lưu đệm đó tái sử dụng các phạm vi đã phê duyệt được lưu đệm của token; bên gọi dùng `deviceToken` rõ ràng / `scopes` rõ ràng giữ nguyên tập phạm vi đã yêu cầu. Nếu xác thực vẫn thất bại sau lần thử lại đó, hãy tự xử lý sai lệch token.
- Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token/mật khẩu dùng chung rõ ràng trước, sau đó `deviceToken` rõ ràng, rồi token thiết bị đã lưu, rồi token bootstrap.
- Trên đường dẫn giao diện điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng
  `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, vì vậy
  lần thử lại sai đồng thời thứ hai có thể đã hiển thị `retry later`.
- Để biết các bước sửa sai lệch token, hãy làm theo [Danh sách kiểm tra khôi phục sai lệch token](/vi/cli/devices#token-drift-recovery-checklist).
- Lấy hoặc cung cấp shared secret từ máy chủ Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Mật khẩu: phân giải `gateway.auth.password` đã cấu hình hoặc
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token do SecretRef quản lý: phân giải nhà cung cấp secret bên ngoài hoặc export
    `OPENCLAW_GATEWAY_TOKEN` trong shell này, rồi chạy lại `openclaw dashboard`
  - Chưa cấu hình shared secret: `openclaw doctor --generate-gateway-token`
- Trong phần cài đặt dashboard, dán token hoặc mật khẩu vào trường xác thực,
  rồi kết nối.
- Bộ chọn ngôn ngữ của giao diện nằm trong **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**.
  Nó là một phần của thẻ truy cập, không phải phần Giao diện.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui)
- [WebChat](/vi/web/webchat)

---
read_when:
    - Thay đổi chế độ xác thực hoặc chế độ mở truy cập của bảng điều khiển
summary: Truy cập và xác thực bảng điều khiển Gateway (Giao diện điều khiển)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-05-11T20:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Bảng điều khiển Gateway là giao diện điều khiển trên trình duyệt được phục vụ tại `/` theo mặc định
(ghi đè bằng `gateway.controlUi.basePath`).

Mở nhanh (Gateway cục bộ):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))
- Với `gateway.tls.enabled: true`, dùng `https://127.0.0.1:18789/` và
  `wss://127.0.0.1:18789` cho điểm cuối WebSocket.

Tài liệu tham khảo chính:

- [Giao diện điều khiển](/vi/web/control-ui) để xem cách sử dụng và các khả năng của giao diện.
- [Tailscale](/vi/gateway/tailscale) cho tự động hóa Serve/Funnel.
- [Bề mặt web](/vi/web) cho các chế độ bind và ghi chú bảo mật.

Xác thực được thực thi tại bước bắt tay WebSocket thông qua đường dẫn xác thực
gateway đã cấu hình:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- header danh tính trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Xem `gateway.auth` trong [Cấu hình Gateway](/vi/gateway/configuration).

Ghi chú bảo mật: giao diện điều khiển là một **bề mặt quản trị** (chat, cấu hình, phê duyệt exec).
Không để lộ công khai. Giao diện lưu token URL bảng điều khiển trong sessionStorage
cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, rồi loại bỏ chúng khỏi URL sau khi tải.
Ưu tiên localhost, Tailscale Serve hoặc đường hầm SSH.

## Đường nhanh (khuyến nghị)

- Sau khi onboarding, CLI tự động mở bảng điều khiển và in một liên kết sạch (không chứa token).
- Mở lại bất cứ lúc nào: `openclaw dashboard` (sao chép liên kết, mở trình duyệt nếu có thể, hiển thị gợi ý SSH nếu headless).
- Nếu không thể gửi qua clipboard và trình duyệt, `openclaw dashboard` vẫn in
  URL sạch và hướng dẫn bạn dùng token từ `OPENCLAW_GATEWAY_TOKEN` hoặc
  `gateway.auth.token` làm khóa fragment URL `token`; lệnh này không in giá trị
  token trong log.
- Nếu giao diện yêu cầu xác thực shared-secret, hãy dán token hoặc
  mật khẩu đã cấu hình vào phần cài đặt giao diện điều khiển.

## Cơ bản về xác thực (cục bộ so với từ xa)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **Gateway TLS**: khi `gateway.tls.enabled: true`, liên kết bảng điều khiển/trạng thái dùng
  `https://` và liên kết WebSocket của giao diện điều khiển dùng `wss://`.
- **Nguồn token shared-secret**: `gateway.auth.token` (hoặc
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` có thể truyền nó qua fragment URL
  để bootstrap một lần, và giao diện điều khiển giữ nó trong sessionStorage cho
  phiên tab trình duyệt hiện tại và URL gateway đã chọn thay vì localStorage.
- Nếu `gateway.auth.token` được quản lý bằng SecretRef, `openclaw dashboard`
  chủ ý in/sao chép/mở một URL không chứa token. Điều này tránh để lộ
  token do bên ngoài quản lý trong log shell, lịch sử clipboard hoặc đối số
  khởi chạy trình duyệt.
- Nếu `gateway.auth.token` được cấu hình là SecretRef và chưa được phân giải trong
  shell hiện tại của bạn, `openclaw dashboard` vẫn in một URL không chứa token cùng
  hướng dẫn thiết lập xác thực có thể thực hiện.
- **Mật khẩu shared-secret**: dùng `gateway.auth.password` đã cấu hình (hoặc
  `OPENCLAW_GATEWAY_PASSWORD`). Bảng điều khiển không lưu mật khẩu qua các lần
  tải lại.
- **Chế độ mang danh tính**: Tailscale Serve có thể đáp ứng xác thực giao diện điều khiển/WebSocket
  thông qua header danh tính khi `gateway.auth.allowTailscale: true`, và một
  reverse proxy không phải loopback có nhận biết danh tính có thể đáp ứng
  `gateway.auth.mode: "trusted-proxy"`. Trong các chế độ đó, bảng điều khiển không
  cần dán shared secret cho WebSocket.
- **Không phải localhost**: dùng Tailscale Serve, một bind shared-secret không phải loopback, một
  reverse proxy không phải loopback có nhận biết danh tính với
  `gateway.auth.mode: "trusted-proxy"`, hoặc đường hầm SSH. API HTTP vẫn dùng
  xác thực shared-secret trừ khi bạn cố ý chạy private-ingress
  `gateway.auth.mode: "none"` hoặc xác thực HTTP trusted-proxy. Xem
  [Bề mặt web](/vi/web).

<a id="if-you-see-unauthorized-1008"></a>

## Nếu bạn thấy "unauthorized" / 1008

- Đảm bảo gateway có thể truy cập được (cục bộ: `openclaw status`; từ xa: đường hầm SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`).
- Với `AUTH_TOKEN_MISMATCH`, client có thể thực hiện một lần thử lại tin cậy bằng token thiết bị đã lưu trong bộ nhớ đệm khi gateway trả về gợi ý thử lại. Lần thử lại bằng token đã lưu đó tái sử dụng các phạm vi đã phê duyệt được lưu trong bộ nhớ đệm của token; các bên gọi `deviceToken` tường minh / `scopes` tường minh vẫn giữ tập phạm vi đã yêu cầu. Nếu xác thực vẫn thất bại sau lần thử lại đó, hãy xử lý lệch token thủ công.
- Với `AUTH_SCOPE_MISMATCH`, token thiết bị đã được nhận diện nhưng không mang các phạm vi mà bảng điều khiển yêu cầu; hãy ghép cặp lại hoặc phê duyệt hợp đồng phạm vi đã yêu cầu thay vì xoay vòng token gateway dùng chung.
- Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực kết nối là token/mật khẩu dùng chung tường minh trước, rồi `deviceToken` tường minh, rồi token thiết bị đã lưu, rồi token bootstrap.
- Trên đường dẫn bất đồng bộ Tailscale Serve của giao diện điều khiển, các lần thử thất bại cho cùng
  `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, vì vậy
  lần thử lại lỗi đồng thời thứ hai có thể đã hiển thị `retry later`.
- Để xem các bước sửa lệch token, hãy làm theo [Danh sách kiểm tra khôi phục lệch token](/vi/cli/devices#token-drift-recovery-checklist).
- Truy xuất hoặc cung cấp shared secret từ máy chủ gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Mật khẩu: phân giải `gateway.auth.password` đã cấu hình hoặc
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token do SecretRef quản lý: phân giải nhà cung cấp bí mật bên ngoài hoặc export
    `OPENCLAW_GATEWAY_TOKEN` trong shell này, rồi chạy lại `openclaw dashboard`
  - Chưa cấu hình shared secret: `openclaw doctor --generate-gateway-token`
- Trong phần cài đặt bảng điều khiển, dán token hoặc mật khẩu vào trường xác thực,
  rồi kết nối.
- Bộ chọn ngôn ngữ giao diện nằm trong **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**.
  Nó là một phần của thẻ truy cập, không phải mục Giao diện.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui)
- [WebChat](/vi/web/webchat)

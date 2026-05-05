---
read_when:
    - Thay đổi xác thực bảng điều khiển hoặc chế độ hiển thị công khai
summary: Quyền truy cập và xác thực cho bảng điều khiển Gateway (Control UI)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-05-05T01:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

Bảng điều khiển Gateway là Giao diện điều khiển trên trình duyệt, mặc định được phục vụ tại `/`
(ghi đè bằng `gateway.controlUi.basePath`).

Mở nhanh (Gateway cục bộ):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))
- Với `gateway.tls.enabled: true`, dùng `https://127.0.0.1:18789/` và
  `wss://127.0.0.1:18789` cho điểm cuối WebSocket.

Tài liệu tham khảo chính:

- [Giao diện điều khiển](/vi/web/control-ui) để biết cách sử dụng và khả năng của UI.
- [Tailscale](/vi/gateway/tailscale) cho tự động hóa Serve/Funnel.
- [Các bề mặt web](/vi/web) cho chế độ bind và ghi chú bảo mật.

Xác thực được áp dụng tại bước bắt tay WebSocket thông qua đường dẫn xác thực
gateway đã cấu hình:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- header danh tính trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Xem `gateway.auth` trong [Cấu hình Gateway](/vi/gateway/configuration).

Ghi chú bảo mật: Giao diện điều khiển là một **bề mặt quản trị** (chat, cấu hình, phê duyệt exec).
Không công khai nó ra Internet. UI giữ token URL của bảng điều khiển trong sessionStorage
cho phiên tab trình duyệt hiện tại và URL gateway đã chọn, rồi xóa chúng khỏi URL sau khi tải.
Ưu tiên localhost, Tailscale Serve hoặc đường hầm SSH.

## Đường nhanh (khuyến nghị)

- Sau khi onboarding, CLI tự động mở bảng điều khiển và in một liên kết sạch (không chứa token).
- Mở lại bất cứ lúc nào: `openclaw dashboard` (sao chép liên kết, mở trình duyệt nếu có thể, hiển thị gợi ý SSH nếu headless).
- Nếu không thể đưa qua clipboard và trình duyệt, `openclaw dashboard` vẫn in
  URL sạch và cho bạn biết hãy dùng token từ `OPENCLAW_GATEWAY_TOKEN` hoặc
  `gateway.auth.token` làm khóa phân mảnh URL `token`; lệnh không in giá trị
  token trong log.
- Nếu UI yêu cầu xác thực bằng bí mật dùng chung, hãy dán token hoặc
  mật khẩu đã cấu hình vào phần cài đặt Giao diện điều khiển.

## Cơ bản về xác thực (cục bộ và từ xa)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **Gateway TLS**: khi `gateway.tls.enabled: true`, liên kết bảng điều khiển/trạng thái dùng
  `https://` và liên kết WebSocket của Giao diện điều khiển dùng `wss://`.
- **Nguồn token bí mật dùng chung**: `gateway.auth.token` (hoặc
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` có thể truyền token qua phân mảnh URL
  để bootstrap một lần, và Giao diện điều khiển giữ token trong sessionStorage cho
  phiên tab trình duyệt hiện tại và URL gateway đã chọn thay vì localStorage.
- Nếu `gateway.auth.token` được quản lý bằng SecretRef, theo thiết kế `openclaw dashboard`
  sẽ in/sao chép/mở một URL không chứa token. Điều này tránh để lộ
  token được quản lý bên ngoài trong log shell, lịch sử clipboard hoặc đối số
  khởi chạy trình duyệt.
- Nếu `gateway.auth.token` được cấu hình dưới dạng SecretRef và chưa được resolve trong
  shell hiện tại của bạn, `openclaw dashboard` vẫn in một URL không chứa token cùng
  hướng dẫn thiết lập xác thực có thể thực hiện.
- **Mật khẩu bí mật dùng chung**: dùng `gateway.auth.password` đã cấu hình (hoặc
  `OPENCLAW_GATEWAY_PASSWORD`). Bảng điều khiển không lưu mật khẩu qua các lần
  tải lại.
- **Chế độ mang danh tính**: Tailscale Serve có thể đáp ứng xác thực Giao diện điều khiển/WebSocket
  bằng header danh tính khi `gateway.auth.allowTailscale: true`, và một
  reverse proxy không phải loopback, nhận biết danh tính có thể đáp ứng
  `gateway.auth.mode: "trusted-proxy"`. Trong các chế độ đó, bảng điều khiển không
  cần dán bí mật dùng chung cho WebSocket.
- **Không phải localhost**: dùng Tailscale Serve, bind bí mật dùng chung không phải loopback, một
  reverse proxy không phải loopback, nhận biết danh tính với
  `gateway.auth.mode: "trusted-proxy"`, hoặc đường hầm SSH. HTTP API vẫn dùng
  xác thực bằng bí mật dùng chung trừ khi bạn chủ ý chạy
  `gateway.auth.mode: "none"` cho private-ingress hoặc xác thực HTTP trusted-proxy. Xem
  [Các bề mặt web](/vi/web).

<a id="if-you-see-unauthorized-1008"></a>

## Nếu bạn thấy "unauthorized" / 1008

- Đảm bảo gateway có thể truy cập được (cục bộ: `openclaw status`; từ xa: đường hầm SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` rồi mở `http://127.0.0.1:18789/`).
- Với `AUTH_TOKEN_MISMATCH`, client có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị đã lưu trong cache khi gateway trả về gợi ý thử lại. Lần thử lại bằng token đã lưu cache đó tái sử dụng các phạm vi đã phê duyệt được lưu cache của token; caller dùng `deviceToken` tường minh / `scopes` tường minh sẽ giữ tập phạm vi đã yêu cầu. Nếu xác thực vẫn thất bại sau lần thử lại đó, hãy xử lý drift token thủ công.
- Bên ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là token/mật khẩu dùng chung tường minh trước, rồi `deviceToken` tường minh, rồi token thiết bị đã lưu, rồi token bootstrap.
- Trên đường dẫn Giao diện điều khiển Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng
  `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, nên
  lần thử lại xấu đồng thời thứ hai có thể đã hiển thị `retry later`.
- Để biết các bước sửa drift token, hãy làm theo [Danh sách kiểm tra khôi phục drift token](/vi/cli/devices#token-drift-recovery-checklist).
- Lấy hoặc cung cấp bí mật dùng chung từ máy chủ gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Mật khẩu: resolve `gateway.auth.password` đã cấu hình hoặc
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token do SecretRef quản lý: resolve nhà cung cấp bí mật bên ngoài hoặc export
    `OPENCLAW_GATEWAY_TOKEN` trong shell này, rồi chạy lại `openclaw dashboard`
  - Chưa cấu hình bí mật dùng chung: `openclaw doctor --generate-gateway-token`
- Trong phần cài đặt bảng điều khiển, dán token hoặc mật khẩu vào trường xác thực,
  rồi kết nối.
- Bộ chọn ngôn ngữ UI nằm trong **Tổng quan -> Quyền truy cập Gateway -> Ngôn ngữ**.
  Nó là một phần của thẻ truy cập, không phải mục Giao diện.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui)
- [WebChat](/vi/web/webchat)

---
read_when:
    - Thay đổi chế độ xác thực hoặc khả năng truy cập của bảng điều khiển
summary: Quyền truy cập và xác thực bảng điều khiển Gateway (giao diện điều khiển)
title: Bảng điều khiển
x-i18n:
    generated_at: "2026-07-16T15:55:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway dashboard là Giao diện điều khiển trên trình duyệt được phục vụ tại `/` theo mặc định (ghi đè bằng `gateway.controlUi.basePath`).

Mở nhanh (Gateway cục bộ):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))
- Với `gateway.tls.enabled: true`, hãy dùng `https://127.0.0.1:18789/` và `wss://127.0.0.1:18789` cho điểm cuối WebSocket.

Tài liệu tham khảo chính:

- [Giao diện điều khiển](/vi/web/control-ui) để biết cách sử dụng và các khả năng của giao diện.
- [Tailscale](/vi/gateway/tailscale) để tự động hóa Serve/Funnel.
- [Các bề mặt web](/vi/web) để biết các chế độ liên kết và lưu ý bảo mật.

Xác thực được thực thi trong quá trình bắt tay WebSocket thông qua đường dẫn xác thực Gateway đã cấu hình:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Các tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- Các tiêu đề danh tính của proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Xem `gateway.auth` trong [Cấu hình Gateway](/vi/gateway/configuration).

<Warning>
Giao diện điều khiển là một **bề mặt quản trị** (trò chuyện, cấu hình, phê duyệt thực thi). Không công khai giao diện này. Giao diện lưu token URL của dashboard trong sessionStorage cho tab trình duyệt hiện tại và URL Gateway đã chọn, đồng thời xóa chúng khỏi URL sau khi tải. Ưu tiên localhost, Tailscale Serve hoặc đường hầm SSH.
</Warning>

## Cách nhanh nhất (khuyến nghị)

- Sau khi hoàn tất quy trình thiết lập ban đầu, CLI tự động mở dashboard và in một liên kết sạch (không chứa token).
- Mở lại bất cứ lúc nào: `openclaw dashboard` (sao chép liên kết, mở trình duyệt nếu có thể và in gợi ý SSH nếu chạy không có giao diện).
- Nếu cả việc chuyển qua bảng nhớ tạm lẫn trình duyệt đều thất bại, `openclaw dashboard` vẫn in URL sạch và hướng dẫn bạn nối token của mình (từ `OPENCLAW_GATEWAY_TOKEN` hoặc `gateway.auth.token`) dưới dạng khóa phân mảnh URL `token`; lệnh không bao giờ in giá trị token trong nhật ký.
- Nếu giao diện yêu cầu xác thực bằng bí mật dùng chung, hãy dán token hoặc mật khẩu đã cấu hình vào phần cài đặt của Giao diện điều khiển.

## Kiến thức cơ bản về xác thực (cục bộ và từ xa)

- **Localhost**: mở `http://127.0.0.1:18789/`.
- **TLS của Gateway**: khi `gateway.tls.enabled: true`, các liên kết dashboard/trạng thái sử dụng `https://` và các liên kết WebSocket của Giao diện điều khiển sử dụng `wss://`.
- **Nguồn token bí mật dùng chung**: `gateway.auth.token` (hoặc `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` có thể truyền token qua phân mảnh URL để khởi tạo một lần; Giao diện điều khiển lưu token trong sessionStorage cho tab hiện tại và URL Gateway đã chọn, không phải localStorage.
- Nếu `gateway.auth.token` được SecretRef quản lý, theo thiết kế, `openclaw dashboard` sẽ in/sao chép/mở một URL không chứa token để tránh làm lộ token được quản lý bên ngoài trong nhật ký shell, lịch sử bảng nhớ tạm hoặc đối số khởi chạy trình duyệt. Nếu tham chiếu không được phân giải trong shell hiện tại, lệnh vẫn in URL không chứa token cùng hướng dẫn thiết lập xác thực có thể thực hiện được.
- **Mật khẩu bí mật dùng chung**: sử dụng `gateway.auth.password` đã cấu hình (hoặc `OPENCLAW_GATEWAY_PASSWORD`). Dashboard không lưu mật khẩu qua các lần tải lại.
- **Các chế độ mang danh tính**: Tailscale Serve đáp ứng xác thực Giao diện điều khiển/WebSocket thông qua các tiêu đề danh tính khi `gateway.auth.allowTailscale: true`; một reverse proxy nhận biết danh tính không phải loopback đáp ứng `gateway.auth.mode: "trusted-proxy"`. Cả hai đều không cần dán bí mật dùng chung cho WebSocket.
- **Không phải localhost**: sử dụng Tailscale Serve, một liên kết bí mật dùng chung không phải loopback, một reverse proxy nhận biết danh tính không phải loopback với `gateway.auth.mode: "trusted-proxy"`, hoặc một đường hầm SSH. Các API HTTP vẫn sử dụng xác thực bằng bí mật dùng chung, trừ khi bạn chủ động chạy `gateway.auth.mode: "none"` với đầu vào riêng tư hoặc xác thực HTTP bằng proxy đáng tin cậy. Xem [Các bề mặt web](/vi/web).

## Mở trong Telegram

Bot Telegram có thể mở dashboard dưới dạng Telegram Mini App bằng `/dashboard`.

Yêu cầu:

- `gateway.tailscale.mode: "serve"` hoặc `"funnel"` để Telegram nhận được URL Mini App dùng HTTPS.
- Người gửi trên Telegram phải là chủ sở hữu bot: một ID người dùng Telegram dạng số trong `commands.ownerAllowFrom` hoặc `channels.telegram.allowFrom` có hiệu lực của tài khoản đã chọn.
- Chạy `/dashboard` trong tin nhắn trực tiếp với bot. Khi gọi trong nhóm, hệ thống chỉ yêu cầu bạn mở lệnh trong tin nhắn trực tiếp và không kèm nút.
- Bản cài đặt Docker: các chế độ Serve/Funnel yêu cầu Gateway liên kết với loopback bên cạnh `tailscaled`, điều mà mạng cầu nối với các cổng được công bố không thể đáp ứng. Chạy container Gateway với `network_mode: host` và gắn socket `tailscaled` của máy chủ (`/var/run/tailscale`) cùng CLI `tailscale` vào container.

Mini App thực hiện một lần chuyển giao chủ sở hữu và chuyển hướng đến Giao diện điều khiển bằng token khởi tạo có thời hạn ngắn. Mini App không để lộ token Gateway dùng chung trong URL.

Các mục tiêu không hỗ trợ trong v1:

- Không hỗ trợ iframe Telegram Web.
- Tailscale Serve/Funnel là đường dẫn URL được công bố duy nhất được hỗ trợ.

<a id="if-you-see-unauthorized-1008"></a>

## Nếu bạn thấy "unauthorized" / 1008

- Xác nhận có thể truy cập Gateway: với cục bộ, dùng `openclaw status`; với từ xa, tạo đường hầm SSH bằng `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, sau đó mở `http://127.0.0.1:18789/`.
- Đối với `AUTH_TOKEN_MISMATCH`, ứng dụng khách có thể thực hiện một lần thử lại đáng tin cậy bằng token thiết bị được lưu vào bộ nhớ đệm khi Gateway trả về gợi ý thử lại; lần thử lại đó tái sử dụng các phạm vi đã phê duyệt được lưu trong bộ nhớ đệm của token (các bên gọi `deviceToken`/`scopes` tường minh vẫn giữ tập hợp phạm vi được yêu cầu). Nếu xác thực vẫn thất bại sau lần thử lại đó, hãy xử lý thủ công tình trạng sai lệch token.
- Đối với `AUTH_SCOPE_MISMATCH`, token thiết bị đã được nhận dạng nhưng không có các phạm vi được yêu cầu; hãy ghép nối lại hoặc phê duyệt tập hợp phạm vi mới thay vì xoay vòng token Gateway dùng chung.
- Ngoài đường dẫn thử lại đó, thứ tự ưu tiên xác thực khi kết nối là: token/mật khẩu dùng chung được chỉ định tường minh, sau đó là `deviceToken` được chỉ định tường minh, tiếp theo là token thiết bị đã lưu trữ và cuối cùng là token khởi tạo.
- Trên đường dẫn Tailscale Serve bất đồng bộ, các lần thử thất bại cho cùng một `{scope, ip}` được tuần tự hóa trước khi bộ giới hạn xác thực thất bại ghi nhận chúng, vì vậy lần thử lại sai thứ hai diễn ra đồng thời có thể đã hiển thị `retry later`.
- Để biết các bước khắc phục sai lệch token, xem [Danh sách kiểm tra khôi phục sai lệch token](/vi/cli/devices#token-drift-recovery-checklist).
- Truy xuất hoặc cung cấp bí mật dùng chung từ máy chủ Gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Mật khẩu: phân giải `gateway.auth.password` hoặc `OPENCLAW_GATEWAY_PASSWORD` đã cấu hình
  - Token do SecretRef quản lý: phân giải nhà cung cấp bí mật bên ngoài hoặc xuất `OPENCLAW_GATEWAY_TOKEN` trong shell này rồi chạy lại `openclaw dashboard`
  - Chưa cấu hình bí mật dùng chung: `openclaw doctor --generate-gateway-token`
- Trong phần cài đặt dashboard, dán token hoặc mật khẩu vào trường xác thực, sau đó kết nối.
- Trình chọn ngôn ngữ của giao diện nằm trong **Settings -> General -> Language**, không nằm trong Appearance.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui)
- [WebChat](/vi/web/webchat)

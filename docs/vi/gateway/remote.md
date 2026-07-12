---
read_when:
    - Vận hành hoặc khắc phục sự cố khi thiết lập Gateway từ xa
summary: Truy cập từ xa bằng Gateway WS, đường hầm SSH và tailnet
title: Truy cập từ xa
x-i18n:
    generated_at: "2026-07-12T07:57:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw chạy một Gateway (máy chủ chính) trên một máy chủ và kết nối mọi máy khách với Gateway đó. Gateway quản lý các phiên, hồ sơ xác thực, kênh và trạng thái; mọi thành phần khác đều là máy khách.

- **Người vận hành** (bạn hoặc ứng dụng macOS): WebSocket trực tiếp qua LAN/Tailnet là cách đơn giản nhất khi có thể truy cập Gateway; đường hầm SSH là phương án dự phòng dùng được trong mọi trường hợp.
- **Node** (iOS/Android và các thiết bị khác): kết nối với **WebSocket** của Gateway (qua LAN/Tailnet hoặc đường hầm SSH).

## Ý tưởng cốt lõi

Theo mặc định, WebSocket của Gateway liên kết với **vòng lặp cục bộ** trên cổng `18789` (`gateway.port`). Để sử dụng từ xa, hãy công khai nó qua Tailscale Serve / một liên kết LAN-Tailnet đáng tin cậy, hoặc chuyển tiếp cổng vòng lặp cục bộ qua SSH.

## Các tùy chọn cấu trúc liên kết

| Thiết lập                                  | Nơi Gateway chạy                                                                                                          | Phù hợp nhất                                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway luôn hoạt động trong Tailnet       | Máy chủ thường trực (VPS hoặc máy chủ tại nhà), được truy cập qua Tailscale hoặc SSH                                      | Máy tính xách tay thường xuyên ở chế độ ngủ nhưng cần tác nhân luôn hoạt động. Xem [exe.dev](/vi/install/exe-dev) (máy ảo dễ dùng) hoặc [Hetzner](/vi/install/hetzner) (VPS dùng cho môi trường sản xuất). |
| Máy tính để bàn tại nhà                    | Máy tính để bàn; máy tính xách tay kết nối từ xa qua chế độ từ xa của ứng dụng macOS (Settings → Connection → OpenClaw runs) | Duy trì tác nhân trên phần cứng luôn được bật nguồn. Hướng dẫn vận hành: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).                                                                      |
| Máy tính xách tay                          | Máy tính xách tay, được công khai an toàn qua đường hầm SSH hoặc Tailscale Serve (giữ `gateway.bind: "loopback"`)          | Thiết lập trên một máy duy nhất. Xem [Tailscale](/vi/gateway/tailscale) và [Web](/vi/web).                                                                                                             |

Đối với thiết lập luôn hoạt động và thiết lập trên máy tính xách tay, nên giữ `gateway.bind: "loopback"` và sử dụng **Tailscale Serve** cho giao diện điều khiển, hoặc liên kết LAN/Tailnet đáng tin cậy với `gateway.remote.transport: "direct"`. Đường hầm SSH là phương án dự phòng hoạt động trên mọi máy.

## Luồng lệnh (thành phần nào chạy ở đâu)

Một Gateway quản lý trạng thái và các kênh; các Node là thiết bị ngoại vi. Ví dụ (tin nhắn Telegram được định tuyến đến công cụ của Node):

1. Tin nhắn Telegram đến **Gateway**.
2. Gateway chạy **tác nhân**, tác nhân quyết định có gọi công cụ của Node hay không.
3. Gateway gọi **Node** qua WebSocket của Gateway (`node.invoke` RPC).
4. Node trả về kết quả; Gateway phản hồi trên Telegram.

Các Node không chạy dịch vụ Gateway. Chỉ nên chạy một Gateway trên mỗi máy chủ, trừ khi bạn chủ ý chạy các hồ sơ tách biệt (xem [Nhiều Gateway](/vi/gateway/multiple-gateways)). "Chế độ Node" của ứng dụng macOS chỉ là một máy khách Node kết nối qua WebSocket của Gateway.

## Đường hầm SSH (CLI + công cụ)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Khi đường hầm đang hoạt động, `openclaw health` và `openclaw status --deep` truy cập Gateway từ xa qua `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` và `openclaw gateway call` cũng có thể nhắm đến URL đã được chuyển tiếp thông qua `--url`.

<Note>
Thay `18789` bằng `gateway.port` đã cấu hình của bạn (hoặc `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` không bao giờ chuyển sang sử dụng thông tin xác thực từ cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`; nếu không, máy khách sẽ không gửi thông tin xác thực và kết nối sẽ thất bại nếu Gateway đích yêu cầu xác thực.
</Warning>

## Giá trị mặc định từ xa của CLI

Lưu cố định một đích từ xa để các lệnh CLI sử dụng đích đó theo mặc định:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Khi Gateway chỉ dùng vòng lặp cục bộ, hãy giữ URL là `ws://127.0.0.1:18789` và mở đường hầm SSH trước. Trong phương thức truyền tải qua đường hầm SSH của ứng dụng macOS, tên máy chủ Gateway được phát hiện sẽ được đặt trong `gateway.remote.sshTarget` (`user@host` hoặc `user@host:port`); `gateway.remote.url` vẫn là URL của đường hầm cục bộ. Nếu cổng từ xa khác cổng cục bộ, hãy đặt `gateway.remote.remotePort`.

Theo mặc định, việc xác minh khóa máy chủ được thực hiện nghiêm ngặt (`gateway.remote.sshHostKeyPolicy: "strict"`). Thay vào đó, hãy đặt thành `"openssh"` để ủy quyền cho cấu hình OpenSSH đang có hiệu lực của bạn; hãy kiểm tra các thiết lập SSH của người dùng và hệ thống trước khi bật tùy chọn này.

Đối với Gateway đã có thể truy cập trên một mạng LAN hoặc Tailnet đáng tin cậy, hãy sử dụng chế độ trực tiếp:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Thứ tự ưu tiên của thông tin xác thực

Việc phân giải thông tin xác thực của Gateway tuân theo một quy ước chung trên các đường dẫn gọi/thăm dò/trạng thái và hoạt động giám sát phê duyệt thực thi của Discord. Máy chủ Node sử dụng cùng quy ước, ngoại trừ một trường hợp trong chế độ cục bộ (nó bỏ qua `gateway.remote.*`).

- Thông tin xác thực được chỉ định rõ ràng (`--token`, `--password` hoặc `gatewayToken` của công cụ) luôn được ưu tiên trên các đường dẫn gọi chấp nhận xác thực rõ ràng.
- Biện pháp an toàn khi ghi đè URL:
  - `--url` của CLI không bao giờ tái sử dụng ngầm thông tin xác thực từ cấu hình/môi trường.
  - `OPENCLAW_GATEWAY_URL` trong môi trường chỉ có thể sử dụng thông tin xác thực từ môi trường (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Giá trị mặc định của chế độ cục bộ:
  - mã thông báo: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (chỉ dùng giá trị từ xa làm dự phòng khi mã thông báo cục bộ chưa được đặt)
  - mật khẩu: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (chỉ dùng giá trị từ xa làm dự phòng khi mật khẩu cục bộ chưa được đặt)
- Giá trị mặc định của chế độ từ xa:
  - mã thông báo: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - mật khẩu: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ trong chế độ cục bộ của máy chủ Node: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Theo mặc định, việc kiểm tra mã thông báo khi thăm dò/truy vấn trạng thái từ xa được thực hiện nghiêm ngặt: khi nhắm đến chế độ từ xa, các thao tác này chỉ sử dụng `gateway.remote.token` (không chuyển sang mã thông báo cục bộ).
- Các giá trị ghi đè qua môi trường của Gateway chỉ sử dụng `OPENCLAW_GATEWAY_*`.

## Truy cập giao diện trò chuyện từ xa

WebChat không có cổng HTTP riêng; giao diện trò chuyện SwiftUI kết nối trực tiếp với WebSocket của Gateway.

- Chuyển tiếp `18789` qua SSH (xem ở trên), sau đó kết nối các máy khách với `ws://127.0.0.1:18789`.
- Đối với chế độ trực tiếp qua LAN/Tailnet, hãy kết nối các máy khách với URL riêng tư `ws://` hoặc URL bảo mật `wss://` đã cấu hình.
- Trên macOS, chế độ từ xa của ứng dụng tự động quản lý phương thức truyền tải đã chọn.

## Chế độ từ xa của ứng dụng macOS

Ứng dụng trên thanh menu macOS điều khiển toàn bộ cùng một thiết lập từ đầu đến cuối: kiểm tra trạng thái từ xa, WebChat và chuyển tiếp Voice Wake. Hướng dẫn vận hành: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

## Quy tắc bảo mật (từ xa/VPN)

Hãy giữ Gateway **chỉ dùng vòng lặp cục bộ**, trừ khi bạn chắc chắn cần một liên kết khác.

- **Vòng lặp cục bộ + SSH/Tailscale Serve** là lựa chọn mặc định an toàn nhất (không công khai ra bên ngoài).
- `ws://` dạng văn bản thuần được chấp nhận cho vòng lặp cục bộ, mạng riêng/LAN (RFC 1918), địa chỉ liên kết cục bộ, CGNAT, máy chủ `.local` và `.ts.net`. Các máy chủ từ xa công khai phải sử dụng `wss://`.
- **Các liên kết không phải vòng lặp cục bộ** (`lan`/`tailnet`/`custom`, hoặc `auto` khi không có vòng lặp cục bộ) phải sử dụng xác thực Gateway: mã thông báo, mật khẩu hoặc proxy ngược nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` là các nguồn thông tin xác thực của máy khách; bản thân chúng không cấu hình xác thực máy chủ.
- Các đường dẫn gọi cục bộ chỉ có thể sử dụng `gateway.remote.*` làm phương án dự phòng khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef nhưng không thể phân giải, quá trình phân giải sẽ đóng an toàn khi lỗi (không dùng giá trị từ xa để che giấu lỗi).
- `gateway.remote.tlsFingerprint` ghim chứng chỉ TLS từ xa cho `wss://`, bao gồm chế độ trực tiếp trên macOS. Khi chưa lưu dấu vân tay, macOS chỉ ghim trong lần sử dụng đầu tiên sau khi vượt qua quy trình tin cậy thông thường của hệ thống; các Gateway sử dụng chứng chỉ tự ký hoặc CA riêng cần dấu vân tay rõ ràng hoặc kết nối từ xa qua SSH.
- **Tailscale Serve** có thể xác thực lưu lượng giao diện điều khiển/WebSocket qua các tiêu đề danh tính khi `gateway.auth.allowTailscale: true`. Các điểm cuối API HTTP không sử dụng phương thức xác thực bằng tiêu đề đó mà tuân theo chế độ xác thực HTTP thông thường của Gateway. Luồng không cần mã thông báo này giả định máy chủ Gateway là đáng tin cậy; hãy đặt thành `false` để sử dụng xác thực bằng bí mật dùng chung ở mọi nơi.
- Xác thực bằng **proxy đáng tin cậy** mặc định yêu cầu một proxy nhận biết danh tính không chạy trên vòng lặp cục bộ. Các proxy ngược trên cùng máy chủ qua vòng lặp cục bộ yêu cầu đặt rõ ràng `gateway.auth.trustedProxy.allowLoopback = true`.
- Hãy xem quyền điều khiển qua trình duyệt như quyền truy cập của người vận hành: chỉ trong Tailnet và phải ghép cặp Node có chủ đích.

Phân tích chuyên sâu: [Bảo mật](/vi/gateway/security).

### macOS: đường hầm SSH thường trực qua LaunchAgent

Đối với máy khách macOS, thiết lập thường trực dễ nhất sử dụng một mục cấu hình SSH `LocalForward` cùng với LaunchAgent để duy trì đường hầm qua các lần khởi động lại và sự cố.

#### Bước 1: thêm cấu hình SSH

Chỉnh sửa `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Thay `<REMOTE_IP>` và `<REMOTE_USER>` bằng các giá trị của bạn.

#### Bước 2: sao chép khóa SSH (một lần)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Bước 3: cấu hình mã thông báo của Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Thay vào đó, hãy sử dụng `gateway.remote.password` nếu Gateway từ xa dùng xác thực bằng mật khẩu. `OPENCLAW_GATEWAY_TOKEN` vẫn hợp lệ để ghi đè ở cấp trình bao, nhưng thiết lập máy khách từ xa lâu dài là `gateway.remote.token` / `gateway.remote.password`.

#### Bước 4: tạo LaunchAgent

Lưu thành `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Bước 5: nạp LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Đường hầm tự động khởi động khi đăng nhập, khởi động lại khi gặp sự cố và duy trì hoạt động của cổng được chuyển tiếp.

<Note>
Nếu bạn còn LaunchAgent `com.openclaw.ssh-tunnel` từ một thiết lập cũ, hãy dỡ nạp và xóa nó.
</Note>

#### Khắc phục sự cố

```bash
# Check if the tunnel is running
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Restart the tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Stop the tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Mục cấu hình                          | Chức năng                                                        |
| ------------------------------------ | ---------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Chuyển tiếp cổng cục bộ 18789 đến cổng từ xa 18789               |
| `ssh -N`                             | SSH không thực thi lệnh từ xa (chỉ chuyển tiếp cổng)             |
| `KeepAlive`                          | Tự động khởi động lại đường hầm nếu đường hầm gặp sự cố           |
| `RunAtLoad`                          | Khởi động đường hầm khi LaunchAgent được nạp lúc đăng nhập        |

## Liên quan

- [Tailscale](/vi/gateway/tailscale)
- [Xác thực](/vi/gateway/authentication)
- [Thiết lập Gateway từ xa](/vi/gateway/remote-gateway-readme)

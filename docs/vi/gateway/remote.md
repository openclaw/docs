---
read_when:
    - Chạy hoặc khắc phục sự cố các thiết lập Gateway từ xa
summary: Truy cập từ xa bằng Gateway WS, đường hầm SSH và tailnet
title: Truy cập từ xa
x-i18n:
    generated_at: "2026-06-27T17:31:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Repo này hỗ trợ truy cập gateway từ xa bằng cách giữ một Gateway duy nhất (master) chạy trên một máy chủ chuyên dụng (desktop/server) và kết nối các client tới nó.

- Với **operator (bạn / ứng dụng macOS)**: WebSocket trực tiếp qua LAN/Tailnet là đơn giản nhất khi gateway có thể truy cập được; đường hầm SSH là phương án dự phòng phổ quát.
- Với **node (iOS/Android và các thiết bị trong tương lai)**: kết nối tới **WebSocket** của Gateway (LAN/tailnet hoặc đường hầm SSH khi cần).

## Ý tưởng cốt lõi

- WebSocket của Gateway thường bind vào **loopback** trên cổng bạn cấu hình (mặc định là 18789).
- Để dùng từ xa, hãy expose nó qua Tailscale Serve hoặc một bind LAN/Tailnet đáng tin cậy, hoặc forward cổng loopback qua SSH.

## Các thiết lập VPN và tailnet phổ biến

Hãy nghĩ **máy chủ Gateway** là nơi agent chạy. Nó sở hữu session, auth profile, channel và trạng thái. Laptop, desktop và node của bạn kết nối tới máy chủ đó.

### Gateway luôn bật trong tailnet của bạn

Chạy Gateway trên một máy chủ bền vững (VPS hoặc home server) và truy cập qua **Tailscale** hoặc SSH.

- **UX tốt nhất:** giữ `gateway.bind: "loopback"` và dùng **Tailscale Serve** cho Control UI.
- **LAN/Tailnet đáng tin cậy:** bind gateway vào một interface riêng tư và kết nối trực tiếp bằng `gateway.remote.transport: "direct"`.
- **Dự phòng:** giữ loopback cộng với đường hầm SSH từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/vi/install/exe-dev) (VM dễ dùng) hoặc [Hetzner](/vi/install/hetzner) (VPS production).

Lý tưởng khi laptop của bạn thường ngủ nhưng bạn muốn agent luôn bật.

### Home desktop chạy Gateway

Laptop **không** chạy agent. Nó kết nối từ xa:

- Dùng chế độ từ xa của ứng dụng macOS (Settings → General → OpenClaw runs).
- Ứng dụng kết nối trực tiếp khi gateway có thể truy cập trên LAN/Tailnet, hoặc mở và quản lý một đường hầm SSH khi bạn chọn SSH.

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

### Laptop chạy Gateway

Giữ Gateway cục bộ nhưng expose an toàn:

- Đường hầm SSH tới laptop từ các máy khác, hoặc
- Tailscale Serve Control UI và giữ Gateway chỉ dùng loopback.

Hướng dẫn: [Tailscale](/vi/gateway/tailscale) và [tổng quan Web](/vi/web).

## Luồng lệnh (chạy ở đâu)

Một dịch vụ gateway sở hữu trạng thái + channel. Node là các thiết bị ngoại vi.

Ví dụ luồng (Telegram → node):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi công cụ node hay không.
- Gateway gọi **node** qua WebSocket của Gateway (`node.*` RPC).
- Node trả về kết quả; Gateway phản hồi lại ra Telegram.

Ghi chú:

- **Node không chạy dịch vụ gateway.** Chỉ nên chạy một gateway trên mỗi máy chủ, trừ khi bạn cố ý chạy các profile cô lập (xem [Nhiều gateway](/vi/gateway/multiple-gateways)).
- "node mode" của ứng dụng macOS chỉ là một client node qua WebSocket của Gateway.

## Đường hầm SSH (CLI + công cụ)

Tạo một đường hầm cục bộ tới Gateway WS từ xa:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi đường hầm đang hoạt động:

- `openclaw health` và `openclaw status --deep` giờ truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` và `openclaw gateway call` cũng có thể nhắm tới URL đã forward qua `--url` khi cần.

<Note>
Thay `18789` bằng `gateway.port` bạn đã cấu hình (hoặc `--port` hoặc `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Khi bạn truyền `--url`, CLI không fallback về config hoặc thông tin xác thực môi trường. Hãy đưa `--token` hoặc `--password` rõ ràng. Thiếu thông tin xác thực rõ ràng là lỗi.
</Warning>

## Mặc định từ xa của CLI

Bạn có thể lưu một đích từ xa để các lệnh CLI dùng nó theo mặc định:

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

Khi gateway chỉ dùng loopback, giữ URL là `ws://127.0.0.1:18789` và mở đường hầm SSH trước.
Trong transport đường hầm SSH của ứng dụng macOS, hostname gateway được phát hiện thuộc về
`gateway.remote.sshTarget`; `gateway.remote.url` vẫn là URL đường hầm cục bộ.
Nếu các cổng đó khác nhau, đặt `gateway.remote.remotePort` thành cổng gateway trên
máy chủ SSH.

Với gateway đã có thể truy cập trên LAN hoặc Tailnet đáng tin cậy, dùng chế độ trực tiếp:

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

## Thứ tự ưu tiên thông tin xác thực

Việc phân giải thông tin xác thực Gateway tuân theo một contract chung trên các đường dẫn call/probe/status và giám sát exec-approval của Discord. Node-host dùng cùng contract cơ sở với một ngoại lệ local-mode (nó cố ý bỏ qua `gateway.remote.*`):

- Thông tin xác thực rõ ràng (`--token`, `--password` hoặc công cụ `gatewayToken`) luôn thắng trên các đường dẫn call chấp nhận auth rõ ràng.
- An toàn khi ghi đè URL:
  - Ghi đè URL trong CLI (`--url`) không bao giờ tái dùng thông tin xác thực ngầm định từ config/env.
  - Ghi đè URL bằng env (`OPENCLAW_GATEWAY_URL`) chỉ có thể dùng thông tin xác thực từ env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback từ xa chỉ áp dụng khi input token auth cục bộ chưa được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback từ xa chỉ áp dụng khi input password auth cục bộ chưa được đặt)
- Mặc định remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ local-mode của Node-host: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token cho probe/status từ xa mặc định là nghiêm ngặt: chúng chỉ dùng `gateway.remote.token` (không fallback token cục bộ) khi nhắm tới remote mode.
- Ghi đè env của Gateway chỉ dùng `OPENCLAW_GATEWAY_*`.

## Truy cập Chat UI từ xa

WebChat không còn dùng một cổng HTTP riêng. Chat UI SwiftUI kết nối trực tiếp tới WebSocket của Gateway.

- Forward `18789` qua SSH (xem ở trên), rồi kết nối client tới `ws://127.0.0.1:18789`.
- Với chế độ trực tiếp LAN/Tailnet, kết nối client tới URL `ws://` riêng tư đã cấu hình hoặc URL bảo mật `wss://`.
- Trên macOS, ưu tiên chế độ từ xa của ứng dụng, chế độ này tự động quản lý transport đã chọn.

## Chế độ từ xa của ứng dụng macOS

Ứng dụng thanh menu macOS có thể điều khiển cùng thiết lập từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat và forward Voice Wake).

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

## Quy tắc bảo mật (remote/VPN)

Phiên bản ngắn: **giữ Gateway chỉ dùng loopback** trừ khi bạn chắc chắn cần bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không expose công khai).
- Plaintext `ws://` được chấp nhận cho loopback, LAN, link-local, `.local`, `.ts.net` và các máy chủ Tailscale CGNAT. Máy chủ từ xa công khai phải dùng `wss://`.
- **Bind không phải loopback** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải dùng auth gateway: token, password, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` là nguồn thông tin xác thực client. Bản thân chúng **không** cấu hình auth server.
- Các đường dẫn call cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình rõ ràng qua SecretRef và không phân giải được, quá trình phân giải sẽ fail closed (không có fallback từ xa để che lỗi).
- `gateway.remote.tlsFingerprint` ghim chứng chỉ TLS từ xa khi dùng `wss://`, bao gồm chế độ trực tiếp trên macOS. Nếu không có pin đã cấu hình hoặc đã lưu trước đó, macOS chỉ ghim chứng chỉ dùng lần đầu sau khi vượt qua trust hệ thống bình thường; gateway tự ký hoặc private-CA mà macOS chưa tin cậy cần fingerprint rõ ràng hoặc Remote qua SSH.
- **Tailscale Serve** có thể xác thực lưu lượng Control UI/WebSocket qua header danh tính khi `gateway.auth.allowTailscale: true`; endpoint HTTP API không dùng auth header Tailscale đó mà tuân theo chế độ auth HTTP bình thường của gateway. Luồng không token này giả định máy chủ gateway là đáng tin cậy. Đặt thành `false` nếu bạn muốn auth bằng shared-secret ở mọi nơi.
- Auth **trusted-proxy** mặc định kỳ vọng các thiết lập proxy nhận biết danh tính không phải loopback.
  Reverse proxy loopback cùng máy chủ yêu cầu đặt rõ ràng `gateway.auth.trustedProxy.allowLoopback = true`.
- Đối xử với điều khiển qua trình duyệt như quyền truy cập operator: chỉ tailnet + ghép cặp node có chủ đích.

Đọc sâu: [Bảo mật](/vi/gateway/security).

### macOS: đường hầm SSH bền vững qua LaunchAgent

Với client macOS kết nối tới gateway từ xa, thiết lập bền vững dễ nhất dùng một mục cấu hình SSH `LocalForward` cộng với LaunchAgent để giữ đường hầm sống qua reboot và crash.

#### Bước 1: thêm cấu hình SSH

Chỉnh sửa `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Thay `<REMOTE_IP>` và `<REMOTE_USER>` bằng giá trị của bạn.

#### Bước 2: sao chép khóa SSH (một lần)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Bước 3: cấu hình token gateway

Lưu token trong config để nó tồn tại qua các lần restart:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Bước 4: tạo LaunchAgent

Lưu nội dung này thành `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### Bước 5: load LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Đường hầm sẽ tự động khởi động khi đăng nhập, restart khi crash và giữ cổng đã forward hoạt động.

<Note>
Nếu bạn còn LaunchAgent `com.openclaw.ssh-tunnel` từ một thiết lập cũ, hãy unload và xóa nó.
</Note>

#### Khắc phục sự cố

Kiểm tra đường hầm có đang chạy không:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart đường hầm:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Dừng đường hầm:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Mục cấu hình                         | Tác dụng                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forward cổng cục bộ 18789 tới cổng từ xa 18789               |
| `ssh -N`                             | SSH không thực thi lệnh từ xa (chỉ port-forwarding)          |
| `KeepAlive`                          | Tự động restart đường hầm nếu nó crash                       |
| `RunAtLoad`                          | Khởi động đường hầm khi LaunchAgent load lúc đăng nhập       |

## Liên quan

- [Tailscale](/vi/gateway/tailscale)
- [Xác thực](/vi/gateway/authentication)
- [Thiết lập gateway từ xa](/vi/gateway/remote-gateway-readme)

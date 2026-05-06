---
read_when:
    - Chạy hoặc khắc phục sự cố các thiết lập Gateway từ xa
summary: Truy cập từ xa bằng đường hầm SSH (Gateway WS) và các tailnet
title: Truy cập từ xa
x-i18n:
    generated_at: "2026-05-06T09:14:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Repo này hỗ trợ "remote over SSH" bằng cách duy trì một Gateway duy nhất (master) chạy trên một máy chủ chuyên dụng (máy tính để bàn/máy chủ) và kết nối các client đến đó.

- Với **operator (bạn / ứng dụng macOS)**: đường hầm SSH là phương án dự phòng phổ quát.
- Với **node (iOS/Android và các thiết bị tương lai)**: kết nối đến **WebSocket** của Gateway (LAN/tailnet hoặc đường hầm SSH khi cần).

## Ý tưởng cốt lõi

- WebSocket của Gateway bind vào **loopback** trên cổng bạn đã cấu hình (mặc định là 18789).
- Để dùng từ xa, bạn forward cổng loopback đó qua SSH (hoặc dùng tailnet/VPN và ít cần tunnel hơn).

## Các thiết lập VPN và tailnet phổ biến

Hãy xem **máy chủ Gateway** là nơi agent hoạt động. Nó sở hữu session, auth profile, channel và state. Laptop, máy tính để bàn và node của bạn kết nối đến máy chủ đó.

### Gateway luôn bật trong tailnet của bạn

Chạy Gateway trên một máy chủ bền vững (VPS hoặc máy chủ tại nhà) và truy cập qua **Tailscale** hoặc SSH.

- **UX tốt nhất:** giữ `gateway.bind: "loopback"` và dùng **Tailscale Serve** cho Control UI.
- **Dự phòng:** giữ loopback cùng với đường hầm SSH từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/vi/install/exe-dev) (VM dễ dùng) hoặc [Hetzner](/vi/install/hetzner) (VPS production).

Phù hợp khi laptop của bạn thường xuyên sleep nhưng bạn muốn agent luôn bật.

### Máy tính để bàn tại nhà chạy Gateway

Laptop **không** chạy agent. Nó kết nối từ xa:

- Dùng chế độ **Remote over SSH** của ứng dụng macOS (Settings → General → OpenClaw runs).
- Ứng dụng mở và quản lý tunnel, nên WebChat và kiểm tra health hoạt động ngay.

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

### Laptop chạy Gateway

Giữ Gateway cục bộ nhưng expose một cách an toàn:

- Dùng đường hầm SSH đến laptop từ các máy khác, hoặc
- Dùng Tailscale Serve cho Control UI và giữ Gateway chỉ loopback.

Hướng dẫn: [Tailscale](/vi/gateway/tailscale) và [tổng quan Web](/vi/web).

## Luồng lệnh (cái gì chạy ở đâu)

Một dịch vụ gateway sở hữu state + channel. Node là thiết bị ngoại vi.

Ví dụ luồng (Telegram → node):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi công cụ node hay không.
- Gateway gọi **node** qua WebSocket của Gateway (`node.*` RPC).
- Node trả về kết quả; Gateway phản hồi lại Telegram.

Ghi chú:

- **Node không chạy dịch vụ gateway.** Mỗi host chỉ nên chạy một gateway, trừ khi bạn cố ý chạy các profile tách biệt (xem [Nhiều gateway](/vi/gateway/multiple-gateways)).
- "node mode" của ứng dụng macOS chỉ là một node client qua WebSocket của Gateway.

## Đường hầm SSH (CLI + công cụ)

Tạo một tunnel cục bộ đến WS của Gateway từ xa:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi tunnel đang hoạt động:

- `openclaw health` và `openclaw status --deep` giờ sẽ truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, và `openclaw gateway call` cũng có thể nhắm đến URL đã forward qua `--url` khi cần.

<Note>
Thay `18789` bằng `gateway.port` đã cấu hình của bạn (hoặc `--port` hay `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Khi bạn truyền `--url`, CLI không fallback sang thông tin xác thực từ config hoặc môi trường. Hãy truyền rõ `--token` hoặc `--password`. Thiếu thông tin xác thực tường minh là lỗi.
</Warning>

## Mặc định từ xa của CLI

Bạn có thể lưu một target từ xa để các lệnh CLI dùng nó theo mặc định:

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

Khi gateway chỉ loopback, giữ URL là `ws://127.0.0.1:18789` và mở đường hầm SSH trước.
Trong transport tunnel SSH của ứng dụng macOS, hostname gateway được phát hiện thuộc về
`gateway.remote.sshTarget`; `gateway.remote.url` vẫn là URL tunnel cục bộ.

## Thứ tự ưu tiên thông tin xác thực

Quy trình phân giải thông tin xác thực Gateway tuân theo một contract chung trên các đường dẫn call/probe/status và giám sát phê duyệt exec của Discord. Node-host dùng cùng contract nền với một ngoại lệ ở local mode (nó cố ý bỏ qua `gateway.remote.*`):

- Thông tin xác thực tường minh (`--token`, `--password`, hoặc tool `gatewayToken`) luôn thắng trên các đường dẫn call chấp nhận auth tường minh.
- An toàn khi ghi đè URL:
  - Ghi đè URL của CLI (`--url`) không bao giờ tái sử dụng thông tin xác thực ngầm từ config/env.
  - Ghi đè URL bằng env (`OPENCLAW_GATEWAY_URL`) chỉ có thể dùng thông tin xác thực từ env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định ở local mode:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (remote fallback chỉ áp dụng khi input token auth cục bộ chưa được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (remote fallback chỉ áp dụng khi input password auth cục bộ chưa được đặt)
- Mặc định ở remote mode:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ local-mode của Node-host: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token cho remote probe/status mặc định là nghiêm ngặt: chúng chỉ dùng `gateway.remote.token` (không fallback sang token cục bộ) khi nhắm đến remote mode.
- Ghi đè env của Gateway chỉ dùng `OPENCLAW_GATEWAY_*`.

## Chat UI qua SSH

WebChat không còn dùng cổng HTTP riêng. Chat UI SwiftUI kết nối trực tiếp đến WebSocket của Gateway.

- Forward `18789` qua SSH (xem ở trên), sau đó kết nối client đến `ws://127.0.0.1:18789`.
- Trên macOS, nên dùng chế độ "Remote over SSH" của ứng dụng, chế độ này tự động quản lý tunnel.

## Remote over SSH của ứng dụng macOS

Ứng dụng thanh menu macOS có thể vận hành cùng thiết lập đó từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat và forward Voice Wake).

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

## Quy tắc bảo mật (remote/VPN)

Bản ngắn gọn: **giữ Gateway chỉ loopback** trừ khi bạn chắc chắn cần bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không expose công khai).
- Plaintext `ws://` mặc định chỉ dành cho loopback. Với mạng riêng đáng tin cậy,
  đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên process client như một
  phương án break-glass. Không có tùy chọn tương đương trong `openclaw.json`; đây phải là
  môi trường process cho client tạo kết nối WebSocket.
- **Bind không phải loopback** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải dùng auth gateway: token, password, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` là nguồn thông tin xác thực phía client. Tự chúng **không** cấu hình auth server.
- Các đường dẫn call cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và không phân giải được, quá trình phân giải sẽ fail closed (không bị remote fallback che khuất).
- `gateway.remote.tlsFingerprint` pin chứng chỉ TLS từ xa khi dùng `wss://`.
- **Tailscale Serve** có thể xác thực lưu lượng Control UI/WebSocket qua identity
  header khi `gateway.auth.allowTailscale: true`; các endpoint HTTP API không
  dùng auth header Tailscale đó mà thay vào đó tuân theo HTTP
  auth mode thông thường của gateway. Luồng không cần token này giả định máy chủ gateway đáng tin cậy. Đặt thành
  `false` nếu bạn muốn auth bằng shared-secret ở mọi nơi.
- Auth **Trusted-proxy** mặc định kỳ vọng các thiết lập proxy nhận biết danh tính không phải loopback.
  Reverse proxy loopback cùng host yêu cầu đặt tường minh `gateway.auth.trustedProxy.allowLoopback = true`.
- Xem điều khiển qua trình duyệt như quyền truy cập operator: chỉ tailnet + ghép đôi node có chủ ý.

Tìm hiểu sâu: [Bảo mật](/vi/gateway/security).

### macOS: đường hầm SSH bền vững qua LaunchAgent

Với client macOS kết nối đến gateway từ xa, thiết lập bền vững dễ nhất dùng một mục cấu hình SSH `LocalForward` cùng với LaunchAgent để giữ tunnel sống qua các lần khởi động lại và crash.

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

#### Bước 3: cấu hình gateway token

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

Tunnel sẽ tự động khởi động khi đăng nhập, restart khi crash và giữ cổng đã forward luôn hoạt động.

<Note>
Nếu bạn còn LaunchAgent `com.openclaw.ssh-tunnel` từ một thiết lập cũ, hãy unload và xóa nó.
</Note>

#### Khắc phục sự cố

Kiểm tra tunnel có đang chạy không:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Restart tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Dừng tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Mục cấu hình                         | Chức năng                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Forward cổng cục bộ 18789 đến cổng từ xa 18789               |
| `ssh -N`                             | SSH không thực thi lệnh từ xa (chỉ port-forwarding)          |
| `KeepAlive`                          | Tự động restart tunnel nếu nó crash                          |
| `RunAtLoad`                          | Khởi động tunnel khi LaunchAgent load lúc đăng nhập          |

## Liên quan

- [Tailscale](/vi/gateway/tailscale)
- [Xác thực](/vi/gateway/authentication)
- [Thiết lập gateway từ xa](/vi/gateway/remote-gateway-readme)

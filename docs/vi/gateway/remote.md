---
read_when:
    - Chạy hoặc khắc phục sự cố các thiết lập gateway từ xa
summary: Truy cập từ xa bằng Gateway WS, đường hầm SSH và tailnet
title: Truy cập từ xa
x-i18n:
    generated_at: "2026-07-03T23:35:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Repo này hỗ trợ truy cập gateway từ xa bằng cách duy trì một Gateway duy nhất (master) chạy trên một máy chủ chuyên dụng (máy tính để bàn/máy chủ) và kết nối các client tới đó.

- Với **người vận hành (bạn / ứng dụng macOS)**: WebSocket trực tiếp qua LAN/Tailnet là đơn giản nhất khi gateway có thể truy cập được; SSH tunneling là phương án dự phòng phổ quát.
- Với **các nút (iOS/Android và thiết bị tương lai)**: kết nối tới Gateway **WebSocket** (LAN/tailnet hoặc SSH tunnel khi cần).

## Ý tưởng cốt lõi

- Gateway WebSocket thường bind vào **loopback** trên cổng bạn cấu hình (mặc định là 18789).
- Để dùng từ xa, hãy phơi nó qua Tailscale Serve hoặc một bind LAN/Tailnet tin cậy, hoặc chuyển tiếp cổng loopback qua SSH.

## Các thiết lập VPN và tailnet phổ biến

Hãy xem **máy chủ Gateway** là nơi agent chạy. Nó sở hữu các phiên, hồ sơ xác thực, kênh và trạng thái. Laptop, máy tính để bàn và các nút của bạn kết nối tới máy chủ đó.

### Gateway luôn bật trong tailnet của bạn

Chạy Gateway trên một máy chủ bền vững (VPS hoặc máy chủ tại nhà) và truy cập qua **Tailscale** hoặc SSH.

- **UX tốt nhất:** giữ `gateway.bind: "loopback"` và dùng **Tailscale Serve** cho Control UI.
- **LAN/Tailnet tin cậy:** bind gateway vào một giao diện riêng tư và kết nối trực tiếp với `gateway.remote.transport: "direct"`.
- **Dự phòng:** giữ loopback cùng SSH tunnel từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/vi/install/exe-dev) (VM dễ dùng) hoặc [Hetzner](/vi/install/hetzner) (VPS production).

Lý tưởng khi laptop của bạn thường xuyên ngủ nhưng bạn muốn agent luôn bật.

### Máy tính để bàn tại nhà chạy Gateway

Laptop **không** chạy agent. Nó kết nối từ xa:

- Dùng chế độ từ xa của ứng dụng macOS (Settings → General → OpenClaw runs).
- Ứng dụng kết nối trực tiếp khi gateway có thể truy cập trên LAN/Tailnet, hoặc mở và quản lý SSH tunnel khi bạn chọn SSH.

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

### Laptop chạy Gateway

Giữ Gateway cục bộ nhưng phơi nó một cách an toàn:

- SSH tunnel tới laptop từ các máy khác, hoặc
- Dùng Tailscale Serve cho Control UI và giữ Gateway chỉ loopback.

Hướng dẫn: [Tailscale](/vi/gateway/tailscale) và [tổng quan Web](/vi/web).

## Luồng lệnh (cái gì chạy ở đâu)

Một dịch vụ gateway sở hữu trạng thái + kênh. Các nút là ngoại vi.

Ví dụ luồng (Telegram → nút):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi một công cụ nút hay không.
- Gateway gọi **nút** qua Gateway WebSocket (`node.*` RPC).
- Nút trả về kết quả; Gateway trả lời ngược lại ra Telegram.

Ghi chú:

- **Các nút không chạy dịch vụ gateway.** Chỉ nên chạy một gateway trên mỗi máy chủ, trừ khi bạn cố ý chạy các hồ sơ tách biệt (xem [Nhiều gateway](/vi/gateway/multiple-gateways)).
- "Chế độ nút" của ứng dụng macOS chỉ là một client nút qua Gateway WebSocket.

## SSH tunnel (CLI + công cụ)

Tạo một tunnel cục bộ tới Gateway WS từ xa:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi tunnel đã chạy:

- `openclaw health` và `openclaw status --deep` giờ sẽ truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` và `openclaw gateway call` cũng có thể nhắm tới URL đã chuyển tiếp qua `--url` khi cần.

<Note>
Thay `18789` bằng `gateway.port` đã cấu hình của bạn (hoặc `--port` hoặc `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Khi bạn truyền `--url`, CLI không fallback về thông tin xác thực trong cấu hình hoặc môi trường. Hãy đưa vào `--token` hoặc `--password` một cách tường minh. Thiếu thông tin xác thực tường minh là lỗi.
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

Khi gateway chỉ dùng loopback, giữ URL là `ws://127.0.0.1:18789` và mở SSH tunnel trước.
Trong transport SSH tunnel của ứng dụng macOS, các hostname gateway được phát hiện thuộc về
`gateway.remote.sshTarget`; `gateway.remote.url` vẫn là URL tunnel cục bộ.
Nếu các cổng đó khác nhau, đặt `gateway.remote.remotePort` thành cổng gateway trên
máy chủ SSH.
Xác minh host-key mặc định là nghiêm ngặt. Các alias được quản lý có thể dùng tường minh
chính sách tin cậy OpenSSH hiệu lực của chúng với
`gateway.remote.sshHostKeyPolicy: "openssh"`; hãy rà soát các thiết lập SSH của người dùng và hệ thống
tương ứng trước khi bật.

Với gateway đã có thể truy cập trên LAN hoặc Tailnet tin cậy, dùng chế độ trực tiếp:

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

Cách phân giải thông tin xác thực Gateway tuân theo một contract chung trên các đường dẫn call/probe/status và giám sát exec-approval của Discord. Node-host dùng cùng contract cơ sở với một ngoại lệ ở chế độ cục bộ (nó cố ý bỏ qua `gateway.remote.*`):

- Thông tin xác thực tường minh (`--token`, `--password`, hoặc `gatewayToken` của công cụ) luôn thắng trên các đường dẫn call chấp nhận xác thực tường minh.
- An toàn khi ghi đè URL:
  - Các ghi đè URL của CLI (`--url`) không bao giờ tái sử dụng thông tin xác thực ngầm định từ config/env.
  - Các ghi đè URL từ env (`OPENCLAW_GATEWAY_URL`) chỉ có thể dùng thông tin xác thực env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định chế độ cục bộ:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback từ xa chỉ áp dụng khi đầu vào token xác thực cục bộ chưa được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback từ xa chỉ áp dụng khi đầu vào mật khẩu xác thực cục bộ chưa được đặt)
- Mặc định chế độ từ xa:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ chế độ cục bộ của Node-host: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token probe/status từ xa mặc định là nghiêm ngặt: chúng chỉ dùng `gateway.remote.token` (không fallback sang token cục bộ) khi nhắm tới chế độ từ xa.
- Ghi đè env của Gateway chỉ dùng `OPENCLAW_GATEWAY_*`.

## Truy cập từ xa Chat UI

WebChat không còn dùng một cổng HTTP riêng. Chat UI SwiftUI kết nối trực tiếp tới Gateway WebSocket.

- Chuyển tiếp `18789` qua SSH (xem ở trên), rồi kết nối client tới `ws://127.0.0.1:18789`.
- Với chế độ trực tiếp LAN/Tailnet, kết nối client tới URL riêng tư `ws://` hoặc bảo mật `wss://` đã cấu hình.
- Trên macOS, ưu tiên chế độ từ xa của ứng dụng, chế độ này tự động quản lý transport đã chọn.

## Chế độ từ xa của ứng dụng macOS

Ứng dụng thanh menu macOS có thể điều khiển cùng thiết lập từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat và chuyển tiếp Voice Wake).

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

## Quy tắc bảo mật (remote/VPN)

Phiên bản ngắn: **giữ Gateway chỉ loopback** trừ khi bạn chắc chắn cần bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không phơi công khai).
- Plaintext `ws://` được chấp nhận cho loopback, LAN, link-local, `.local`, `.ts.net` và các máy chủ Tailscale CGNAT. Máy chủ từ xa công khai phải dùng `wss://`.
- **Bind không phải loopback** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải dùng xác thực gateway: token, mật khẩu, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` là nguồn thông tin xác thực client. Tự chúng **không** cấu hình xác thực máy chủ.
- Các đường dẫn call cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và không phân giải được, việc phân giải sẽ fail-closed (không bị fallback từ xa che khuất).
- `gateway.remote.tlsFingerprint` ghim chứng chỉ TLS từ xa khi dùng `wss://`, bao gồm cả chế độ trực tiếp macOS. Nếu không có pin đã cấu hình hoặc đã lưu trước đó, macOS chỉ ghim chứng chỉ lần đầu sử dụng sau khi vượt qua kiểm tra tin cậy hệ thống bình thường; các gateway tự ký hoặc private-CA mà macOS chưa tin cậy cần fingerprint tường minh hoặc Remote over SSH.
- **Tailscale Serve** có thể xác thực lưu lượng Control UI/WebSocket qua các header danh tính
  khi `gateway.auth.allowTailscale: true`; các endpoint HTTP API không
  dùng xác thực header Tailscale đó và thay vào đó tuân theo chế độ xác thực HTTP thông thường
  của gateway. Luồng không token này giả định máy chủ gateway là tin cậy. Đặt thành
  `false` nếu bạn muốn xác thực bằng shared-secret ở mọi nơi.
- Xác thực **Trusted-proxy** mặc định kỳ vọng các thiết lập proxy nhận biết danh tính không phải loopback.
  Reverse proxy loopback cùng máy chủ yêu cầu `gateway.auth.trustedProxy.allowLoopback = true` tường minh.
- Đối xử với quyền điều khiển qua trình duyệt như quyền truy cập của người vận hành: chỉ tailnet + ghép cặp nút có chủ đích.

Đọc sâu: [Bảo mật](/vi/gateway/security).

### macOS: SSH tunnel bền vững qua LaunchAgent

Với client macOS kết nối tới gateway từ xa, thiết lập bền vững dễ nhất dùng một mục cấu hình SSH `LocalForward` cộng với LaunchAgent để giữ tunnel sống qua khởi động lại và sự cố.

#### Bước 1: thêm cấu hình SSH

Sửa `~/.ssh/config`:

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

Lưu token trong cấu hình để nó tồn tại qua các lần khởi động lại:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Bước 4: tạo LaunchAgent

Lưu nội dung này dưới dạng `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

#### Bước 5: tải LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Tunnel sẽ tự động khởi động khi đăng nhập, khởi động lại khi gặp sự cố và giữ cổng được chuyển tiếp hoạt động.

<Note>
Nếu bạn còn LaunchAgent `com.openclaw.ssh-tunnel` từ một thiết lập cũ, hãy unload và xóa nó.
</Note>

#### Khắc phục sự cố

Kiểm tra tunnel có đang chạy hay không:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Khởi động lại tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Dừng tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Mục cấu hình                         | Tác dụng                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Chuyển tiếp cổng cục bộ 18789 tới cổng từ xa 18789           |
| `ssh -N`                             | SSH mà không thực thi lệnh từ xa (chỉ port-forwarding)       |
| `KeepAlive`                          | Tự động khởi động lại tunnel nếu nó gặp sự cố                |
| `RunAtLoad`                          | Khởi động tunnel khi LaunchAgent được tải lúc đăng nhập      |

## Liên quan

- [Tailscale](/vi/gateway/tailscale)
- [Xác thực](/vi/gateway/authentication)
- [Thiết lập gateway từ xa](/vi/gateway/remote-gateway-readme)

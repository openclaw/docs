---
read_when:
    - Chạy hoặc khắc phục sự cố các thiết lập Gateway từ xa
summary: Truy cập từ xa bằng đường hầm SSH (Gateway WS) và mạng tailnet
title: Truy cập từ xa
x-i18n:
    generated_at: "2026-04-29T22:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Kho lưu trữ này hỗ trợ “từ xa qua SSH” bằng cách duy trì một Gateway duy nhất (máy chủ chính) chạy trên một máy chủ chuyên dụng (máy bàn/máy chủ) và kết nối các client tới đó.

- Đối với **người vận hành (bạn / ứng dụng macOS)**: đường hầm SSH là phương án dự phòng phổ quát.
- Đối với **node (iOS/Android và các thiết bị trong tương lai)**: kết nối tới **WebSocket** của Gateway (LAN/tailnet hoặc đường hầm SSH khi cần).

## Ý tưởng cốt lõi

- WebSocket của Gateway liên kết với **loopback** trên cổng đã cấu hình của bạn (mặc định là 18789).
- Để dùng từ xa, bạn chuyển tiếp cổng loopback đó qua SSH (hoặc dùng tailnet/VPN và giảm bớt việc tạo đường hầm).

## Các thiết lập VPN và tailnet phổ biến

Hãy xem **máy chủ Gateway** là nơi agent hoạt động. Nó sở hữu các phiên, hồ sơ xác thực, kênh và trạng thái. Laptop, máy bàn và node của bạn kết nối tới máy chủ đó.

### Gateway luôn bật trong tailnet của bạn

Chạy Gateway trên một máy chủ bền vững (VPS hoặc máy chủ tại nhà) và truy cập qua **Tailscale** hoặc SSH.

- **Trải nghiệm tốt nhất:** giữ `gateway.bind: "loopback"` và dùng **Tailscale Serve** cho giao diện điều khiển.
- **Phương án dự phòng:** giữ loopback cùng với đường hầm SSH từ bất kỳ máy nào cần truy cập.
- **Ví dụ:** [exe.dev](/vi/install/exe-dev) (VM dễ dùng) hoặc [Hetzner](/vi/install/hetzner) (VPS sản xuất).

Lý tưởng khi laptop của bạn thường xuyên ngủ nhưng bạn muốn agent luôn bật.

### Máy bàn tại nhà chạy Gateway

Laptop **không** chạy agent. Nó kết nối từ xa:

- Dùng chế độ **Từ xa qua SSH** của ứng dụng macOS (Cài đặt → Chung → OpenClaw chạy).
- Ứng dụng mở và quản lý đường hầm, nên WebChat và kiểm tra sức khỏe hoạt động ngay.

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

### Laptop chạy Gateway

Giữ Gateway cục bộ nhưng mở truy cập một cách an toàn:

- Tạo đường hầm SSH tới laptop từ các máy khác, hoặc
- Dùng Tailscale Serve cho giao diện điều khiển và giữ Gateway chỉ dùng loopback.

Hướng dẫn: [Tailscale](/vi/gateway/tailscale) và [Tổng quan web](/vi/web).

## Luồng lệnh (thứ gì chạy ở đâu)

Một dịch vụ gateway sở hữu trạng thái + kênh. Node là thiết bị ngoại vi.

Ví dụ luồng (Telegram → node):

- Tin nhắn Telegram đến **Gateway**.
- Gateway chạy **agent** và quyết định có gọi công cụ node hay không.
- Gateway gọi **node** qua WebSocket của Gateway (`node.*` RPC).
- Node trả về kết quả; Gateway phản hồi lại Telegram.

Ghi chú:

- **Node không chạy dịch vụ gateway.** Chỉ nên chạy một gateway trên mỗi máy chủ, trừ khi bạn cố ý chạy các hồ sơ tách biệt (xem [Nhiều gateway](/vi/gateway/multiple-gateways)).
- “chế độ node” của ứng dụng macOS chỉ là một client node qua WebSocket của Gateway.

## Đường hầm SSH (CLI + công cụ)

Tạo một đường hầm cục bộ tới Gateway WS từ xa:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Khi đường hầm đang hoạt động:

- `openclaw health` và `openclaw status --deep` giờ truy cập gateway từ xa qua `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` và `openclaw gateway call` cũng có thể nhắm tới URL đã chuyển tiếp bằng `--url` khi cần.

<Note>
Thay `18789` bằng `gateway.port` đã cấu hình của bạn (hoặc `--port` hay `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Khi bạn truyền `--url`, CLI không quay lại dùng thông tin xác thực từ cấu hình hoặc môi trường. Hãy đưa vào `--token` hoặc `--password` một cách tường minh. Thiếu thông tin xác thực tường minh là lỗi.
</Warning>

## Mặc định từ xa của CLI

Bạn có thể lưu một mục tiêu từ xa để các lệnh CLI dùng theo mặc định:

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
Trong transport đường hầm SSH của ứng dụng macOS, hostname gateway được phát hiện nằm trong
`gateway.remote.sshTarget`; `gateway.remote.url` vẫn là URL đường hầm cục bộ.

## Thứ tự ưu tiên thông tin xác thực

Việc phân giải thông tin xác thực Gateway tuân theo một hợp đồng chung trên các đường dẫn call/probe/status và giám sát phê duyệt thực thi Discord. Node-host dùng cùng hợp đồng cơ sở với một ngoại lệ ở chế độ cục bộ (nó cố ý bỏ qua `gateway.remote.*`):

- Thông tin xác thực tường minh (`--token`, `--password`, hoặc công cụ `gatewayToken`) luôn thắng trên các đường dẫn gọi chấp nhận xác thực tường minh.
- An toàn khi ghi đè URL:
  - Ghi đè URL của CLI (`--url`) không bao giờ tái sử dụng thông tin xác thực cấu hình/môi trường ngầm định.
  - Ghi đè URL bằng môi trường (`OPENCLAW_GATEWAY_URL`) chỉ có thể dùng thông tin xác thực từ môi trường (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Mặc định chế độ cục bộ:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (fallback từ xa chỉ áp dụng khi đầu vào token xác thực cục bộ chưa được đặt)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (fallback từ xa chỉ áp dụng khi đầu vào mật khẩu xác thực cục bộ chưa được đặt)
- Mặc định chế độ từ xa:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Ngoại lệ chế độ cục bộ của node-host: `gateway.remote.token` / `gateway.remote.password` bị bỏ qua.
- Kiểm tra token probe/status từ xa mặc định rất nghiêm ngặt: chúng chỉ dùng `gateway.remote.token` (không fallback token cục bộ) khi nhắm tới chế độ từ xa.
- Ghi đè môi trường của Gateway chỉ dùng `OPENCLAW_GATEWAY_*`.

## Giao diện trò chuyện qua SSH

WebChat không còn dùng một cổng HTTP riêng. Giao diện trò chuyện SwiftUI kết nối trực tiếp tới WebSocket của Gateway.

- Chuyển tiếp `18789` qua SSH (xem ở trên), rồi kết nối client tới `ws://127.0.0.1:18789`.
- Trên macOS, ưu tiên chế độ “Từ xa qua SSH” của ứng dụng, chế độ này tự động quản lý đường hầm.

## Ứng dụng macOS Từ xa qua SSH

Ứng dụng thanh menu macOS có thể điều khiển cùng thiết lập từ đầu đến cuối (kiểm tra trạng thái từ xa, WebChat và chuyển tiếp Voice Wake).

Runbook: [truy cập từ xa trên macOS](/vi/platforms/mac/remote).

## Quy tắc bảo mật (từ xa/VPN)

Bản ngắn gọn: **giữ Gateway chỉ dùng loopback** trừ khi bạn chắc chắn cần bind.

- **Loopback + SSH/Tailscale Serve** là mặc định an toàn nhất (không phơi bày công khai).
- `ws://` dạng văn bản thuần mặc định chỉ dùng loopback. Đối với mạng riêng đáng tin cậy,
  đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trên tiến trình client như
  cơ chế phá kính khẩn cấp. Không có mục tương đương trong `openclaw.json`; đây phải là
  môi trường tiến trình cho client tạo kết nối WebSocket.
- **Bind không phải loopback** (`lan`/`tailnet`/`custom`, hoặc `auto` khi loopback không khả dụng) phải dùng xác thực gateway: token, mật khẩu, hoặc reverse proxy nhận biết danh tính với `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` là nguồn thông tin xác thực client. Chúng **không** tự cấu hình xác thực máy chủ.
- Các đường dẫn gọi cục bộ chỉ có thể dùng `gateway.remote.*` làm fallback khi `gateway.auth.*` chưa được đặt.
- Nếu `gateway.auth.token` / `gateway.auth.password` được cấu hình tường minh qua SecretRef và không phân giải được, quá trình phân giải sẽ đóng an toàn (không có fallback từ xa che lấp).
- `gateway.remote.tlsFingerprint` ghim chứng chỉ TLS từ xa khi dùng `wss://`.
- **Tailscale Serve** có thể xác thực lưu lượng giao diện điều khiển/WebSocket qua các header danh tính khi `gateway.auth.allowTailscale: true`; các endpoint HTTP API không
  dùng xác thực header Tailscale đó và thay vào đó tuân theo chế độ xác thực HTTP bình thường
  của gateway. Luồng không dùng token này giả định máy chủ gateway là đáng tin cậy. Đặt thành
  `false` nếu bạn muốn xác thực bằng bí mật dùng chung ở mọi nơi.
- Xác thực **trusted-proxy** mặc định kỳ vọng các thiết lập proxy nhận biết danh tính không phải loopback.
  Reverse proxy loopback cùng máy chủ cần đặt tường minh `gateway.auth.trustedProxy.allowLoopback = true`.
- Hãy coi điều khiển bằng trình duyệt như quyền truy cập của người vận hành: chỉ tailnet + ghép đôi node có chủ ý.

Phân tích sâu: [Bảo mật](/vi/gateway/security).

### macOS: đường hầm SSH bền vững qua LaunchAgent

Đối với client macOS kết nối tới gateway từ xa, thiết lập bền vững dễ nhất dùng một mục cấu hình SSH `LocalForward` cùng với LaunchAgent để giữ đường hầm sống qua các lần khởi động lại và sự cố.

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

Lưu token trong cấu hình để nó tồn tại qua các lần khởi động lại:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Bước 4: tạo LaunchAgent

Lưu nội dung này dưới tên `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

Đường hầm sẽ tự động khởi động khi đăng nhập, khởi động lại khi gặp sự cố và giữ cổng đã chuyển tiếp hoạt động.

<Note>
Nếu bạn còn LaunchAgent `com.openclaw.ssh-tunnel` sót lại từ một thiết lập cũ, hãy unload và xóa nó.
</Note>

#### Khắc phục sự cố

Kiểm tra xem đường hầm có đang chạy hay không:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Khởi động lại đường hầm:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Dừng đường hầm:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Mục cấu hình                         | Tác dụng                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Chuyển tiếp cổng cục bộ 18789 tới cổng từ xa 18789           |
| `ssh -N`                             | SSH không thực thi lệnh từ xa (chỉ chuyển tiếp cổng)         |
| `KeepAlive`                          | Tự động khởi động lại đường hầm nếu nó gặp sự cố             |
| `RunAtLoad`                          | Khởi động đường hầm khi LaunchAgent được tải lúc đăng nhập   |

## Liên quan

- [Tailscale](/vi/gateway/tailscale)
- [Xác thực](/vi/gateway/authentication)
- [Thiết lập gateway từ xa](/vi/gateway/remote-gateway-readme)

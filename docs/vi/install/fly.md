---
read_when:
    - Triển khai OpenClaw trên Fly.io
    - Thiết lập các ổ đĩa, bí mật và cấu hình lần chạy đầu tiên trên Fly
summary: Triển khai Fly.io từng bước cho OpenClaw với lưu trữ bền vững và HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-03T21:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9b98b2d1c102195e31ee7e93ba075e6cfa16080e78f8e17fc006a62d300ce1a
    source_path: install/fly.md
    workflow: 16
---

# Triển khai Fly.io

**Mục tiêu:** OpenClaw Gateway chạy trên máy [Fly.io](https://fly.io) với bộ nhớ lưu trữ bền vững, HTTPS tự động và quyền truy cập Discord/kênh.

## Những gì bạn cần

- Đã cài đặt [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Tài khoản Fly.io (gói miễn phí dùng được)
- Xác thực mô hình: khóa API cho nhà cung cấp mô hình bạn chọn
- Thông tin đăng nhập kênh: token bot Discord, token Telegram, v.v.

## Lộ trình nhanh cho người mới bắt đầu

1. Sao chép repo → tùy chỉnh `fly.toml`
2. Tạo ứng dụng + volume → đặt secrets
3. Triển khai bằng `fly deploy`
4. SSH vào để tạo cấu hình hoặc dùng Control UI

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Mẹo:** Chọn một vùng gần bạn. Các tùy chọn phổ biến: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Chỉnh sửa `fly.toml` để khớp với tên ứng dụng và yêu cầu của bạn.

    **Ghi chú bảo mật:** Cấu hình mặc định công khai một URL. Để triển khai được gia cố mà không có IP công khai, xem [Triển khai riêng tư](#private-deployment-hardened) hoặc dùng `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **Thiết lập chính:**

    | Thiết lập                      | Lý do                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Gắn vào `0.0.0.0` để proxy của Fly có thể truy cập gateway                  |
    | `--allow-unconfigured`         | Khởi động mà không cần tệp cấu hình (bạn sẽ tạo sau)                        |
    | `internal_port = 3000`         | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) cho kiểm tra tình trạng của Fly |
    | `memory = "2048mb"`            | 512MB là quá nhỏ; khuyến nghị 2GB                                           |
    | `OPENCLAW_STATE_DIR = "/data"` | Lưu giữ trạng thái trên volume                                              |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Ghi chú:**

    - Các bind không phải loopback (`--bind lan`) yêu cầu một đường dẫn xác thực gateway hợp lệ. Ví dụ Fly.io này dùng `OPENCLAW_GATEWAY_TOKEN`, nhưng `gateway.auth.password` hoặc một triển khai `trusted-proxy` không phải loopback được cấu hình đúng cũng đáp ứng yêu cầu.
    - Hãy xử lý các token này như mật khẩu.
    - **Ưu tiên biến môi trường thay vì tệp cấu hình** cho tất cả khóa API và token. Điều này giữ secrets khỏi `openclaw.json`, nơi chúng có thể vô tình bị lộ hoặc ghi log.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Lần triển khai đầu tiên sẽ build ảnh Docker (~2-3 phút). Các lần triển khai sau nhanh hơn.

    Sau khi triển khai, xác minh:

    ```bash
    fly status
    fly logs
    ```

    Bạn sẽ thấy:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    SSH vào máy để tạo cấu hình đúng:

    ```bash
    fly ssh console
    ```

    Tạo thư mục và tệp cấu hình:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Ghi chú:** Với `OPENCLAW_STATE_DIR=/data`, đường dẫn cấu hình là `/data/openclaw.json`.

    **Ghi chú:** Thay `https://my-openclaw.fly.dev` bằng origin ứng dụng Fly thực của bạn. Khi khởi động, Gateway gieo các origin Control UI cục bộ từ các giá trị runtime `--bind` và `--port` để lần boot đầu tiên có thể tiếp tục trước khi cấu hình tồn tại, nhưng truy cập trình duyệt qua Fly vẫn cần origin HTTPS chính xác được liệt kê trong `gateway.controlUi.allowedOrigins`.

    **Ghi chú:** Token Discord có thể đến từ một trong hai nơi:

    - Biến môi trường: `DISCORD_BOT_TOKEN` (khuyến nghị cho secrets)
    - Tệp cấu hình: `channels.discord.token`

    Nếu dùng biến môi trường, không cần thêm token vào cấu hình. Gateway tự động đọc `DISCORD_BOT_TOKEN`.

    Khởi động lại để áp dụng:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Mở trong trình duyệt:

    ```bash
    fly open
    ```

    Hoặc truy cập `https://my-openclaw.fly.dev/`

    Xác thực bằng bí mật dùng chung đã cấu hình. Hướng dẫn này dùng token gateway từ `OPENCLAW_GATEWAY_TOKEN`; nếu bạn đã chuyển sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó.

    ### Nhật ký

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Bảng điều khiển SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Khắc phục sự cố

### "Ứng dụng không lắng nghe trên địa chỉ mong đợi"

Gateway đang bind vào `127.0.0.1` thay vì `0.0.0.0`.

**Cách khắc phục:** Thêm `--bind lan` vào lệnh process của bạn trong `fly.toml`.

### Kiểm tra tình trạng thất bại / kết nối bị từ chối

Fly không thể truy cập gateway trên cổng đã cấu hình.

**Cách khắc phục:** Đảm bảo `internal_port` khớp với cổng gateway (đặt `--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Sự cố bộ nhớ

Container liên tục khởi động lại hoặc bị kill. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, hoặc khởi động lại âm thầm.

**Cách khắc phục:** Tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật một máy hiện có:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Ghi chú:** 512MB là quá nhỏ. 1GB có thể hoạt động nhưng có thể OOM khi tải cao hoặc khi ghi log chi tiết. **Khuyến nghị 2GB.**

### Sự cố khóa Gateway

Gateway từ chối khởi động với lỗi "already running".

Điều này xảy ra khi container khởi động lại nhưng tệp khóa PID vẫn tồn tại trên volume.

**Cách khắc phục:** Xóa tệp khóa:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Tệp khóa nằm tại `/data/gateway.*.lock` (không nằm trong thư mục con).

### Cấu hình không được đọc

`--allow-unconfigured` chỉ bỏ qua chốt bảo vệ khởi động. Nó không tạo hoặc sửa `/data/openclaw.json`, vì vậy hãy đảm bảo cấu hình thực của bạn tồn tại và bao gồm `gateway.mode="local"` khi bạn muốn khởi động gateway cục bộ bình thường.

Xác minh cấu hình tồn tại:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Ghi cấu hình qua SSH

Lệnh `fly ssh console -C` không hỗ trợ chuyển hướng shell. Để ghi tệp cấu hình:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Ghi chú:** `fly sftp` có thể thất bại nếu tệp đã tồn tại. Xóa trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Trạng thái không được lưu giữ

Nếu bạn mất hồ sơ xác thực, trạng thái kênh/nhà cung cấp, hoặc phiên sau khi khởi động lại, thư mục trạng thái đang ghi vào hệ thống tệp của container.

**Cách khắc phục:** Đảm bảo `OPENCLAW_STATE_DIR=/data` được đặt trong `fly.toml` và triển khai lại.

## Cập nhật

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Cập nhật lệnh máy

Nếu bạn cần thay đổi lệnh khởi động mà không triển khai lại toàn bộ:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Ghi chú:** Sau `fly deploy`, lệnh máy có thể đặt lại theo nội dung trong `fly.toml`. Nếu bạn đã thay đổi thủ công, hãy áp dụng lại chúng sau khi deploy.

## Triển khai riêng tư (gia cố)

Theo mặc định, Fly cấp phát IP công khai, khiến gateway của bạn có thể truy cập tại `https://your-app.fly.dev`. Điều này tiện lợi nhưng có nghĩa là triển khai của bạn có thể bị các trình quét internet phát hiện (Shodan, Censys, v.v.).

Để triển khai được gia cố với **không có lộ diện công khai**, hãy dùng mẫu riêng tư.

### Khi nào dùng triển khai riêng tư

- Bạn chỉ thực hiện cuộc gọi/tin nhắn **đi ra** (không có Webhook đi vào)
- Bạn dùng tunnel **ngrok hoặc Tailscale** cho mọi callback Webhook
- Bạn truy cập gateway qua **SSH, proxy hoặc WireGuard** thay vì trình duyệt
- Bạn muốn triển khai **ẩn khỏi các trình quét internet**

### Thiết lập

Dùng `deploy/fly.private.toml` thay cho cấu hình tiêu chuẩn:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Hoặc chuyển đổi một triển khai hiện có:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ nên hiển thị một IP kiểu `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Truy cập triển khai riêng tư

Vì không có URL công khai, hãy dùng một trong các phương thức sau:

**Tùy chọn 1: Proxy cục bộ (đơn giản nhất)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Tùy chọn 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Tùy chọn 3: Chỉ SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook với triển khai riêng tư

Nếu bạn cần callback Webhook (Twilio, Telnyx, v.v.) mà không công khai ra ngoài:

1. **Đường hầm ngrok** - Chạy ngrok bên trong container hoặc dưới dạng sidecar
2. **Tailscale Funnel** - Công khai các đường dẫn cụ thể qua Tailscale
3. **Chỉ chiều đi** - Một số nhà cung cấp (Twilio) hoạt động tốt cho cuộc gọi chiều đi mà không cần Webhook

Ví dụ cấu hình cuộc gọi thoại với ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Đường hầm ngrok chạy bên trong container và cung cấp URL Webhook công khai mà không để lộ chính ứng dụng Fly. Đặt `webhookSecurity.allowedHosts` thành tên máy chủ đường hầm công khai để các header máy chủ được chuyển tiếp được chấp nhận.

### Lợi ích bảo mật

| Khía cạnh        | Công khai       | Riêng tư         |
| ---------------- | --------------- | ---------------- |
| Trình quét Internet | Có thể phát hiện | Bị ẩn           |
| Tấn công trực tiếp | Có thể xảy ra   | Bị chặn          |
| Truy cập Control UI | Trình duyệt     | Proxy/VPN        |
| Phân phối Webhook | Trực tiếp       | Qua đường hầm    |

## Ghi chú

- Fly.io sử dụng **kiến trúc x86** (không phải ARM)
- Dockerfile tương thích với cả hai kiến trúc
- Để onboarding WhatsApp/Telegram, hãy dùng `fly ssh console`
- Dữ liệu lâu dài nằm trên volume tại `/data`
- Signal yêu cầu Java + signal-cli; hãy dùng image tùy chỉnh và giữ bộ nhớ ở mức 2GB+.

## Chi phí

Với cấu hình được khuyến nghị (`shared-cpu-2x`, RAM 2GB):

- ~$10-15/tháng tùy theo mức sử dụng
- Gói miễn phí bao gồm một số định mức

Xem [giá Fly.io](https://fly.io/docs/about/pricing/) để biết chi tiết.

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Giữ OpenClaw luôn cập nhật: [Cập nhật](/vi/install/updating)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Hetzner](/vi/install/hetzner)
- [Docker](/vi/install/docker)
- [Lưu trữ VPS](/vi/vps)

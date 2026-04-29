---
read_when:
    - Triển khai OpenClaw trên Fly.io
    - Thiết lập ổ đĩa lưu trữ, bí mật và cấu hình lần chạy đầu tiên trên Fly
summary: Triển khai Fly.io từng bước cho OpenClaw với bộ nhớ lưu trữ bền vững và HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-29T22:51:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 195a77c4cec439dc2b5030f5ee618274df76b16d878b8d16e65a754e4bd8072c
    source_path: install/fly.md
    workflow: 16
---

# Triển khai Fly.io

**Mục tiêu:** OpenClaw Gateway chạy trên máy [Fly.io](https://fly.io) với lưu trữ bền vững, HTTPS tự động và quyền truy cập Discord/kênh.

## Những gì bạn cần

- Đã cài đặt [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Tài khoản Fly.io (gói miễn phí dùng được)
- Xác thực mô hình: khóa API cho nhà cung cấp mô hình bạn chọn
- Thông tin xác thực kênh: token bot Discord, token Telegram, v.v.

## Lộ trình nhanh cho người mới bắt đầu

1. Clone repo → tùy chỉnh `fly.toml`
2. Tạo app + volume → đặt secrets
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

    **Mẹo:** Chọn region gần bạn. Các tùy chọn phổ biến: `lhr` (London), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Chỉnh sửa `fly.toml` để khớp với tên app và yêu cầu của bạn.

    **Lưu ý bảo mật:** Cấu hình mặc định để lộ URL công khai. Để triển khai được gia cố mà không có IP công khai, xem [Triển khai riêng tư](#private-deployment-hardened) hoặc dùng `fly.private.toml`.

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

    | Thiết lập                     | Lý do                                                                       |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Bind tới `0.0.0.0` để proxy của Fly có thể truy cập Gateway                 |
    | `--allow-unconfigured`        | Khởi động không cần tệp cấu hình (bạn sẽ tạo sau)                           |
    | `internal_port = 3000`        | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) cho health check của Fly |
    | `memory = "2048mb"`           | 512MB quá nhỏ; khuyến nghị 2GB                                              |
    | `OPENCLAW_STATE_DIR = "/data"` | Duy trì trạng thái trên volume                                              |

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

    - Các bind không phải loopback (`--bind lan`) yêu cầu một đường dẫn xác thực Gateway hợp lệ. Ví dụ Fly.io này dùng `OPENCLAW_GATEWAY_TOKEN`, nhưng `gateway.auth.password` hoặc một triển khai `trusted-proxy` không phải loopback được cấu hình đúng cũng đáp ứng yêu cầu.
    - Hãy xử lý các token này như mật khẩu.
    - **Ưu tiên biến môi trường hơn tệp cấu hình** cho mọi khóa API và token. Việc này giữ secrets ngoài `openclaw.json`, nơi chúng có thể vô tình bị lộ hoặc ghi log.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    Lần triển khai đầu tiên sẽ build image Docker (~2-3 phút). Các lần triển khai sau sẽ nhanh hơn.

    Sau khi triển khai, hãy xác minh:

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
    SSH vào máy để tạo cấu hình phù hợp:

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

    **Ghi chú:** Thay `https://my-openclaw.fly.dev` bằng origin thật của app Fly của bạn. Khi khởi động, Gateway gieo sẵn các origin Control UI cục bộ từ các giá trị runtime `--bind` và `--port` để lần boot đầu tiên có thể tiếp tục trước khi cấu hình tồn tại, nhưng truy cập trình duyệt qua Fly vẫn cần origin HTTPS chính xác được liệt kê trong `gateway.controlUi.allowedOrigins`.

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

    Xác thực bằng shared secret đã cấu hình. Hướng dẫn này dùng token Gateway từ `OPENCLAW_GATEWAY_TOKEN`; nếu bạn đã chuyển sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

    ### Log

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

### "App is not listening on expected address"

Gateway đang bind tới `127.0.0.1` thay vì `0.0.0.0`.

**Cách sửa:** Thêm `--bind lan` vào lệnh process trong `fly.toml`.

### Health check thất bại / kết nối bị từ chối

Fly không thể truy cập Gateway trên cổng đã cấu hình.

**Cách sửa:** Đảm bảo `internal_port` khớp với cổng Gateway (đặt `--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Vấn đề bộ nhớ

Container liên tục khởi động lại hoặc bị kill. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration`, hoặc khởi động lại im lặng.

**Cách sửa:** Tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật một máy hiện có:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Ghi chú:** 512MB quá nhỏ. 1GB có thể hoạt động nhưng có thể OOM khi tải cao hoặc khi ghi log chi tiết. **Khuyến nghị 2GB.**

### Vấn đề khóa Gateway

Gateway từ chối khởi động với lỗi "already running".

Điều này xảy ra khi container khởi động lại nhưng tệp khóa PID vẫn còn trên volume.

**Cách sửa:** Xóa tệp khóa:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Tệp khóa nằm ở `/data/gateway.*.lock` (không nằm trong thư mục con).

### Cấu hình không được đọc

`--allow-unconfigured` chỉ bỏ qua guard khởi động. Nó không tạo hoặc sửa `/data/openclaw.json`, vì vậy hãy đảm bảo cấu hình thật của bạn tồn tại và bao gồm `gateway.mode="local"` khi bạn muốn khởi động Gateway cục bộ bình thường.

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

**Ghi chú:** `fly sftp` có thể thất bại nếu tệp đã tồn tại. Hãy xóa trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Trạng thái không được duy trì

Nếu bạn mất profile xác thực, trạng thái kênh/nhà cung cấp, hoặc phiên sau khi khởi động lại, thư mục trạng thái đang ghi vào hệ thống tệp của container.

**Cách sửa:** Đảm bảo `OPENCLAW_STATE_DIR=/data` được đặt trong `fly.toml` và triển khai lại.

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

**Ghi chú:** Sau `fly deploy`, lệnh máy có thể đặt lại về nội dung trong `fly.toml`. Nếu bạn đã thay đổi thủ công, hãy áp dụng lại sau khi triển khai.

## Triển khai riêng tư (được gia cố)

Theo mặc định, Fly cấp phát IP công khai, khiến Gateway của bạn có thể truy cập tại `https://your-app.fly.dev`. Điều này tiện lợi nhưng có nghĩa là triển khai của bạn có thể bị các trình quét internet phát hiện (Shodan, Censys, v.v.).

Để triển khai được gia cố với **không có phơi bày công khai**, hãy dùng mẫu riêng tư.

### Khi nào nên dùng triển khai riêng tư

- Bạn chỉ thực hiện lệnh gọi/tin nhắn **ra ngoài** (không có Webhook đi vào)
- Bạn dùng đường hầm **ngrok hoặc Tailscale** cho mọi callback Webhook
- Bạn truy cập Gateway qua **SSH, proxy, hoặc WireGuard** thay vì trình duyệt
- Bạn muốn triển khai **ẩn khỏi các trình quét internet**

### Thiết lập

Dùng `fly.private.toml` thay vì cấu hình tiêu chuẩn:

```bash
# Deploy with private config
fly deploy -c fly.private.toml
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
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ nên hiển thị IP loại `private`:

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

**Tùy chọn 2: VPN WireGuard**

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

Nếu bạn cần callback Webhook (Twilio, Telnyx, v.v.) mà không cần mở công khai:

1. **Đường hầm ngrok** - Chạy ngrok bên trong container hoặc dưới dạng sidecar
2. **Tailscale Funnel** - Mở các đường dẫn cụ thể qua Tailscale
3. **Chỉ gửi ra ngoài** - Một số nhà cung cấp (Twilio) hoạt động tốt cho cuộc gọi gửi ra mà không cần Webhook

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

| Khía cạnh              | Công khai        | Riêng tư       |
| ---------------------- | ---------------- | -------------- |
| Trình quét Internet    | Có thể phát hiện | Bị ẩn          |
| Tấn công trực tiếp     | Có thể xảy ra    | Bị chặn        |
| Truy cập UI điều khiển | Trình duyệt      | Proxy/VPN      |
| Gửi Webhook            | Trực tiếp        | Qua đường hầm  |

## Ghi chú

- Fly.io sử dụng **kiến trúc x86** (không phải ARM)
- Dockerfile tương thích với cả hai kiến trúc
- Với quy trình onboarding WhatsApp/Telegram, hãy dùng `fly ssh console`
- Dữ liệu bền vững nằm trên volume tại `/data`
- Signal yêu cầu Java + signal-cli; hãy dùng image tùy chỉnh và giữ bộ nhớ ở mức 2GB+.

## Chi phí

Với cấu hình được khuyến nghị (`shared-cpu-2x`, RAM 2GB):

- ~$10-15/tháng tùy theo mức sử dụng
- Gói miễn phí bao gồm một phần hạn mức

Xem [giá Fly.io](https://fly.io/docs/about/pricing/) để biết chi tiết.

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Hetzner](/vi/install/hetzner)
- [Docker](/vi/install/docker)
- [Lưu trữ VPS](/vi/vps)

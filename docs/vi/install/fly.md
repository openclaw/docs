---
read_when:
    - Triển khai OpenClaw trên Fly.io
    - Thiết lập volume Fly, secret và cấu hình cho lần chạy đầu tiên
summary: Triển khai OpenClaw từng bước trên Fly.io với bộ nhớ lưu trữ bền vững và HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T14:35:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Mục tiêu:** Gateway OpenClaw chạy trên một máy [Fly.io](https://fly.io) với bộ nhớ lưu trữ bền vững, HTTPS tự động và quyền truy cập Discord/kênh.

## Những gì bạn cần

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) đã được cài đặt
- Tài khoản Fly.io (gói miễn phí cũng dùng được)
- Xác thực mô hình: khóa API cho nhà cung cấp mô hình bạn chọn
- Thông tin xác thực kênh: token bot Discord, token Telegram, v.v.

## Lộ trình nhanh cho người mới bắt đầu

1. Sao chép kho lưu trữ, tùy chỉnh `fly.toml`
2. Tạo ứng dụng + ổ đĩa, thiết lập các bí mật
3. Triển khai bằng `fly deploy`
4. Truy cập qua SSH để tạo cấu hình hoặc sử dụng giao diện điều khiển

<Steps>
  <Step title="Tạo ứng dụng Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # chọn tên riêng của bạn
    fly apps create my-openclaw

    # 1GB thường là đủ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Chọn một khu vực gần bạn. Các lựa chọn phổ biến: `lhr` (Luân Đôn), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Cấu hình fly.toml">
    Chỉnh sửa `fly.toml` để khớp với tên ứng dụng và yêu cầu của bạn. Tệp `fly.toml` được theo dõi trong kho lưu trữ là mẫu công khai được trình bày bên dưới; `deploy/fly.private.toml` là biến thể được tăng cường bảo mật, không có IP công khai (xem [Triển khai riêng tư](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # tên ứng dụng của bạn
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

    Điểm vào của ảnh Docker OpenClaw là `tini`, mặc định chạy `node openclaw.mjs gateway`. `[processes]` của Fly thay thế `CMD` của Docker (ở đây, nó chạy trực tiếp `node dist/index.js gateway ...`, cùng một điểm vào đã biên dịch) mà không thay đổi `ENTRYPOINT`, nên tiến trình vẫn chạy dưới `tini`.

    **Các thiết lập chính:**

    | Thiết lập                      | Lý do                                                                       |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Liên kết với `0.0.0.0` để proxy của Fly có thể truy cập gateway                     |
    | `--allow-unconfigured`         | Khởi động mà không cần tệp cấu hình (bạn sẽ tạo sau)                        |
    | `internal_port = 3000`         | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) cho các kiểm tra tình trạng của Fly |
    | `memory = "2048mb"`            | 512MB là quá ít; khuyến nghị 2GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Duy trì trạng thái trên ổ đĩa                                                |

  </Step>

  <Step title="Thiết lập bí mật">
    ```bash
    # bắt buộc: token xác thực gateway để liên kết ngoài loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # khóa API của nhà cung cấp mô hình
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # tùy chọn: các nhà cung cấp khác
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token kênh
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Các liên kết ngoài loopback (`--bind lan`) yêu cầu một đường dẫn xác thực gateway hợp lệ. Ví dụ này sử dụng `OPENCLAW_GATEWAY_TOKEN`, nhưng `gateway.auth.password` hoặc một triển khai proxy đáng tin cậy ngoài loopback được cấu hình đúng cũng đáp ứng yêu cầu. Xem [Quản lý bí mật](/vi/gateway/secrets) để biết hợp đồng SecretRef.

    Hãy bảo vệ các token này như mật khẩu. Ưu tiên biến môi trường/`fly secrets` thay vì tệp cấu hình cho khóa API và token để các bí mật không xuất hiện trong `openclaw.json`.

  </Step>

  <Step title="Triển khai">
    ```bash
    fly deploy
    ```

    Lần triển khai đầu tiên sẽ xây dựng ảnh Docker. Xác minh sau khi triển khai:

    ```bash
    fly status
    fly logs
    ```

    Nhật ký khởi động Gateway ghi `gateway ready` sau khi trình lắng nghe HTTP/WebSocket hoạt động. Kiểm tra tình trạng riêng của Fly theo dõi `internal_port = 3000` theo `fly.toml`; chỉ thị Docker `HEALTHCHECK` của ảnh cũng thăm dò `/healthz` trên cổng mặc định 18789, nhưng không được sử dụng ở đây vì triển khai này ghi đè Gateway sang `--port 3000`.

  </Step>

  <Step title="Tạo tệp cấu hình">
    Truy cập máy qua SSH để tạo cấu hình phù hợp:

    ```bash
    fly ssh console
    ```

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

    Với `OPENCLAW_STATE_DIR=/data`, đường dẫn cấu hình là `/data/openclaw.json`.

    Thay `https://my-openclaw.fly.dev` bằng nguồn gốc ứng dụng Fly thực tế của bạn. Quá trình khởi động Gateway khởi tạo các nguồn gốc giao diện điều khiển cục bộ từ các giá trị `--bind` và `--port` khi chạy để lần khởi động đầu tiên có thể tiếp tục trước khi có cấu hình, nhưng truy cập bằng trình duyệt qua Fly vẫn cần nguồn gốc HTTPS chính xác được liệt kê trong `gateway.controlUi.allowedOrigins`.

    Token Discord có thể đến từ một trong hai nguồn:

    - Biến môi trường `DISCORD_BOT_TOKEN` (khuyến nghị cho bí mật); không cần thêm vào cấu hình, Gateway sẽ tự động đọc biến này
    - Tệp cấu hình `channels.discord.token`

    Khởi động lại để áp dụng:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Truy cập Gateway">
    ### Giao diện điều khiển

    ```bash
    fly open
    ```

    Hoặc truy cập `https://my-openclaw.fly.dev/`.

    Xác thực bằng bí mật dùng chung đã cấu hình: token Gateway từ `OPENCLAW_GATEWAY_TOKEN`, hoặc mật khẩu của bạn nếu đã chuyển sang xác thực bằng mật khẩu.

    ### Nhật ký

    ```bash
    fly logs              # nhật ký trực tiếp
    fly logs --no-tail    # nhật ký gần đây
    ```

    ### Bảng điều khiển SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Khắc phục sự cố

### "Ứng dụng không lắng nghe tại địa chỉ mong đợi"

Gateway đang liên kết với `127.0.0.1` thay vì `0.0.0.0`.

**Cách khắc phục:** thêm `--bind lan` vào lệnh tiến trình trong `fly.toml`.

### Kiểm tra tình trạng thất bại / kết nối bị từ chối

Fly không thể truy cập Gateway trên cổng đã cấu hình.

**Cách khắc phục:** đảm bảo `internal_port` khớp với cổng Gateway (`--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / vấn đề bộ nhớ

Vùng chứa liên tục khởi động lại hoặc bị chấm dứt. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` hoặc khởi động lại âm thầm.

**Cách khắc phục:** tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật một máy hiện có:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB là quá ít. 1GB có thể hoạt động nhưng có thể gặp OOM khi chịu tải hoặc khi bật ghi nhật ký chi tiết. Khuyến nghị 2GB.

### Vấn đề khóa Gateway

Gateway từ chối khởi động với lỗi "đã chạy" sau khi vùng chứa khởi động lại.

Các tệp khóa khi chạy nằm tại `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
và `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), không nằm trên ổ đĩa bền vững `/data`, vì vậy
việc khởi động lại toàn bộ vùng chứa thường xóa chúng cùng với phần còn lại của
hệ thống tệp vùng chứa. Nếu một khóa vẫn còn tồn tại (ví dụ: một `fly machine restart`
giữ nguyên hệ thống tệp vùng chứa) và chặn quá trình khởi động, hãy xóa khóa đó
theo cách thủ công:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Cấu hình không được đọc

`--allow-unconfigured` chỉ bỏ qua cơ chế bảo vệ khởi động. Nó không tạo hoặc sửa chữa `/data/openclaw.json`, vì vậy hãy đảm bảo cấu hình thực của bạn tồn tại và bao gồm `"gateway": { "mode": "local" }` để Gateway cục bộ khởi động bình thường.

Xác minh cấu hình tồn tại:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Ghi cấu hình qua SSH

`fly ssh console -C` không hỗ trợ chuyển hướng shell. Để ghi tệp cấu hình:

```bash
# echo + tee (chuyển qua pipe từ máy cục bộ sang máy từ xa)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# hoặc sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` có thể thất bại nếu tệp đã tồn tại; hãy xóa tệp trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Trạng thái không được duy trì

Nếu bạn mất hồ sơ xác thực, trạng thái kênh/nhà cung cấp hoặc phiên sau khi khởi động lại, thư mục trạng thái đang ghi vào hệ thống tệp vùng chứa thay vì ổ đĩa.

**Cách khắc phục:** đảm bảo `OPENCLAW_STATE_DIR=/data` được thiết lập trong `fly.toml` và triển khai lại.

## Cập nhật

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` là lộ trình được giám sát ở đây: thao tác này xây dựng lại ảnh từ Dockerfile, vì vậy phiên bản CLI/Gateway, ảnh hệ điều hành cơ sở và mọi thay đổi trong Dockerfile đều được cập nhật cùng nhau. `openclaw update` bên trong vùng chứa đang chạy không phải cùng một thao tác, vì ảnh được phân phối dưới dạng cây `dist/` được xây dựng bằng Docker, không có bản sao làm việc `.git` và không có bản cài đặt toàn cục do npm quản lý để thao tác này phát hiện; xem [Cập nhật](/vi/install/updating) để biết quy trình đó trên các bản cài đặt kiểu máy ảo.

### Cập nhật lệnh của máy

Để thay đổi lệnh khởi động mà không cần triển khai lại toàn bộ:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# hoặc kèm theo tăng bộ nhớ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Một lần `fly deploy` sau đó sẽ đặt lại lệnh của máy về nội dung trong `fly.toml`; hãy áp dụng lại các thay đổi thủ công sau khi triển khai lại.

## Triển khai riêng tư (tăng cường bảo mật)

Theo mặc định, Fly phân bổ các IP công khai, vì vậy Gateway của bạn có thể được truy cập tại `https://your-app.fly.dev` và bị các trình quét internet (Shodan, Censys, v.v.) phát hiện.

Sử dụng `deploy/fly.private.toml` để triển khai tăng cường bảo mật với **không có IP công khai**: cấu hình này bỏ qua `[http_service]`, vì vậy không có lưu lượng truy cập vào công khai nào được phân bổ.

### Khi nào nên sử dụng triển khai riêng tư

- Chỉ có các cuộc gọi/tin nhắn đi (không có webhook đến)
- Các đường hầm ngrok hoặc Tailscale xử lý mọi lệnh gọi lại webhook
- Gateway được truy cập qua SSH, proxy hoặc WireGuard thay vì trình duyệt
- Triển khai cần được ẩn khỏi các trình quét internet

### Thiết lập

```bash
fly deploy -c deploy/fly.private.toml
```

Hoặc chuyển đổi một triển khai hiện có:

```bash
# liệt kê các IP hiện tại
fly ips list -a my-openclaw

# giải phóng các IP công khai
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# chuyển sang cấu hình riêng tư để các lần triển khai sau không phân bổ lại IP công khai
fly deploy -c deploy/fly.private.toml

# phân bổ IPv6 chỉ dành cho mạng riêng
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ nên hiển thị một IP thuộc loại `private`:

```text
PHIÊN BẢN  IP                   LOẠI             KHU VỰC
v6         fdaa:x:x:x:x::x      riêng tư         toàn cầu
```

### Truy cập bản triển khai riêng tư

**Tùy chọn 1: proxy cục bộ (đơn giản nhất)**

```bash
fly proxy 3000:3000 -a my-openclaw
# mở http://localhost:3000 trong trình duyệt
```

**Tùy chọn 2: VPN WireGuard**

```bash
fly wireguard create
# nhập vào ứng dụng khách WireGuard, sau đó truy cập qua IPv6 nội bộ
# ví dụ: http://[fdaa:x:x:x:x::x]:3000
```

**Tùy chọn 3: chỉ SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook với bản triển khai riêng tư

Đối với các lệnh gọi lại Webhook (Twilio, Telnyx, v.v.) mà không cần công khai:

1. **đường hầm ngrok**: chạy ngrok bên trong vùng chứa hoặc dưới dạng sidecar
2. **Tailscale Funnel**: công khai các đường dẫn cụ thể qua Tailscale
3. **chỉ gửi đi**: một số nhà cung cấp (Twilio) hỗ trợ cuộc gọi đi mà không cần Webhook

Ví dụ về cấu hình cuộc gọi thoại với ngrok, trong `plugins.entries.voice-call.config`:

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

Đường hầm ngrok chạy bên trong vùng chứa và cung cấp URL Webhook công khai mà không làm lộ chính ứng dụng Fly. Đặt `webhookSecurity.allowedHosts` thành tên máy chủ của đường hầm để chấp nhận các tiêu đề máy chủ được chuyển tiếp.

### Đánh đổi về bảo mật

| Khía cạnh             | Công khai       | Riêng tư          |
| --------------------- | --------------- | ----------------- |
| Trình quét Internet   | Có thể phát hiện | Được ẩn           |
| Tấn công trực tiếp    | Có thể xảy ra   | Bị chặn           |
| Truy cập giao diện điều khiển | Trình duyệt | Proxy/VPN     |
| Phân phối Webhook     | Trực tiếp       | Qua đường hầm     |

## Ghi chú

- Fly.io sử dụng kiến trúc x86; Dockerfile tương thích với cả x86 và ARM.
- Để thiết lập ban đầu cho WhatsApp/Telegram, hãy dùng `fly ssh console`.
- Dữ liệu lâu dài nằm trên ổ đĩa tại `/data`.
- Signal yêu cầu signal-cli (một CLI dựa trên Java) trong image; hãy dùng image tùy chỉnh và duy trì bộ nhớ từ 2GB trở lên.

## Chi phí

Với cấu hình được đề xuất (`shared-cpu-2x`, RAM 2GB), chi phí dự kiến khoảng $10-15/tháng tùy theo mức sử dụng; gói miễn phí cung cấp một phần hạn mức cơ bản. Xem [bảng giá Fly.io](https://fly.io/docs/about/pricing/) để biết mức giá hiện tại.

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Hetzner](/vi/install/hetzner)
- [Docker](/vi/install/docker)
- [Lưu trữ trên VPS](/vi/vps)

---
read_when:
    - Triển khai OpenClaw trên Fly.io
    - Thiết lập ổ đĩa Fly, các bí mật và cấu hình lần chạy đầu tiên
summary: Triển khai OpenClaw trên Fly.io từng bước với bộ nhớ lưu trữ bền vững và HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T08:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Mục tiêu:** Gateway OpenClaw chạy trên một máy [Fly.io](https://fly.io) với bộ nhớ lưu trữ bền vững, HTTPS tự động và quyền truy cập Discord/kênh.

## Những gì bạn cần

- Đã cài đặt [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Tài khoản Fly.io (gói miễn phí cũng dùng được)
- Xác thực mô hình: khóa API cho nhà cung cấp mô hình bạn chọn
- Thông tin xác thực kênh: token bot Discord, token Telegram, v.v.

## Quy trình nhanh cho người mới bắt đầu

1. Sao chép kho lưu trữ, tùy chỉnh `fly.toml`
2. Tạo ứng dụng + volume, thiết lập các bí mật
3. Triển khai bằng `fly deploy`
4. SSH vào để tạo cấu hình hoặc sử dụng giao diện điều khiển

<Steps>
  <Step title="Tạo ứng dụng Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # chọn tên của riêng bạn
    fly apps create my-openclaw

    # 1GB thường là đủ
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Chọn khu vực gần bạn. Các tùy chọn phổ biến: `lhr` (Luân Đôn), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Cấu hình fly.toml">
    Chỉnh sửa `fly.toml` để phù hợp với tên ứng dụng và yêu cầu của bạn. Tệp `fly.toml` được theo dõi trong kho lưu trữ là mẫu công khai hiển thị bên dưới; `deploy/fly.private.toml` là biến thể được tăng cường bảo mật, không có IP công khai (xem [Triển khai riêng tư](#private-deployment-hardened)).

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

    Điểm vào của image Docker OpenClaw là `tini`, mặc định chạy `node openclaw.mjs gateway`. `[processes]` của Fly thay thế `CMD` của Docker (ở đây, nó chạy trực tiếp `node dist/index.js gateway ...`, cùng điểm vào đã biên dịch) mà không thay đổi `ENTRYPOINT`, vì vậy tiến trình vẫn chạy dưới `tini`.

    **Các thiết lập chính:**

    | Thiết lập                      | Lý do                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Liên kết với `0.0.0.0` để proxy của Fly có thể truy cập Gateway             |
    | `--allow-unconfigured`         | Khởi động khi chưa có tệp cấu hình (bạn sẽ tạo sau)                          |
    | `internal_port = 3000`         | Phải khớp với `--port 3000` (hoặc `OPENCLAW_GATEWAY_PORT`) để Fly kiểm tra tình trạng hoạt động |
    | `memory = "2048mb"`            | 512MB quá ít; khuyến nghị 2GB                                                |
    | `OPENCLAW_STATE_DIR = "/data"` | Lưu giữ trạng thái bền vững trên volume                                      |

  </Step>

  <Step title="Thiết lập các bí mật">
    ```bash
    # bắt buộc: token xác thực Gateway cho liên kết không phải local loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # khóa API của nhà cung cấp mô hình
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # tùy chọn: các nhà cung cấp khác
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token kênh
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Các liên kết không phải local loopback (`--bind lan`) yêu cầu một đường dẫn xác thực Gateway hợp lệ. Ví dụ này sử dụng `OPENCLAW_GATEWAY_TOKEN`, nhưng `gateway.auth.password` hoặc một triển khai proxy đáng tin cậy không phải local loopback được cấu hình đúng cũng đáp ứng yêu cầu. Xem [Quản lý bí mật](/vi/gateway/secrets) để biết hợp đồng SecretRef.

    Hãy coi các token này như mật khẩu. Ưu tiên biến môi trường/`fly secrets` thay vì tệp cấu hình cho khóa API và token để các bí mật không xuất hiện trong `openclaw.json`.

  </Step>

  <Step title="Triển khai">
    ```bash
    fly deploy
    ```

    Lần triển khai đầu tiên sẽ dựng image Docker. Xác minh sau khi triển khai:

    ```bash
    fly status
    fly logs
    ```

    Nhật ký khởi động Gateway ghi `gateway ready` sau khi trình lắng nghe HTTP/WebSocket hoạt động. Kiểm tra tình trạng hoạt động riêng của Fly theo dõi `internal_port = 3000` theo `fly.toml`; chỉ thị `HEALTHCHECK` của Docker trong image cũng thăm dò `/healthz` trên cổng mặc định 18789, nhưng không được dùng ở đây vì triển khai này ghi đè Gateway thành `--port 3000`.

  </Step>

  <Step title="Tạo tệp cấu hình">
    SSH vào máy để tạo cấu hình thích hợp:

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

    Thay `https://my-openclaw.fly.dev` bằng origin thực tế của ứng dụng Fly. Khi khởi động, Gateway tạo sẵn các origin giao diện điều khiển cục bộ từ các giá trị `--bind` và `--port` lúc chạy để lần khởi động đầu tiên có thể tiếp tục trước khi cấu hình tồn tại, nhưng quyền truy cập bằng trình duyệt qua Fly vẫn cần origin HTTPS chính xác được liệt kê trong `gateway.controlUi.allowedOrigins`.

    Token Discord có thể đến từ một trong hai nguồn:

    - Biến môi trường `DISCORD_BOT_TOKEN` (khuyến nghị cho bí mật); không cần thêm vào cấu hình, Gateway sẽ tự động đọc
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

### "Ứng dụng không lắng nghe trên địa chỉ dự kiến"

Gateway đang liên kết với `127.0.0.1` thay vì `0.0.0.0`.

**Cách khắc phục:** thêm `--bind lan` vào lệnh tiến trình trong `fly.toml`.

### Kiểm tra tình trạng hoạt động thất bại / kết nối bị từ chối

Fly không thể truy cập Gateway trên cổng đã cấu hình.

**Cách khắc phục:** đảm bảo `internal_port` khớp với cổng Gateway (`--port 3000` hoặc `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / sự cố bộ nhớ

Container liên tục khởi động lại hoặc bị chấm dứt. Dấu hiệu: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` hoặc tự khởi động lại mà không có thông báo.

**Cách khắc phục:** tăng bộ nhớ trong `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Hoặc cập nhật máy hiện có:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB quá ít. 1GB có thể hoạt động nhưng có thể gặp OOM khi tải cao hoặc khi bật ghi nhật ký chi tiết. Khuyến nghị 2GB.

### Sự cố khóa Gateway

Gateway từ chối khởi động với lỗi "đã chạy" sau khi container khởi động lại.

Tệp khóa phiên bản đơn nằm tại `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), không nằm trên volume `/data` bền vững, vì vậy việc khởi động lại toàn bộ container thường xóa tệp này cùng với phần còn lại của hệ thống tệp container. Nếu khóa vẫn tồn tại (ví dụ: một lần `fly machine restart` bảo toàn hệ thống tệp container) và chặn quá trình khởi động, hãy xóa thủ công:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### Cấu hình không được đọc

`--allow-unconfigured` chỉ bỏ qua bước bảo vệ khi khởi động. Nó không tạo hoặc sửa `/data/openclaw.json`, vì vậy hãy đảm bảo cấu hình thực tế của bạn tồn tại và bao gồm `"gateway": { "mode": "local" }` để khởi động Gateway cục bộ bình thường.

Xác minh cấu hình tồn tại:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Ghi cấu hình qua SSH

`fly ssh console -C` không hỗ trợ chuyển hướng shell. Để ghi tệp cấu hình:

```bash
# echo + tee (truyền qua pipe từ máy cục bộ đến máy từ xa)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# hoặc sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` có thể thất bại nếu tệp đã tồn tại; hãy xóa trước:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Trạng thái không được lưu giữ bền vững

Nếu bạn mất các hồ sơ xác thực, trạng thái kênh/nhà cung cấp hoặc phiên sau khi khởi động lại, thư mục trạng thái đang được ghi vào hệ thống tệp container thay vì volume.

**Cách khắc phục:** đảm bảo `OPENCLAW_STATE_DIR=/data` được thiết lập trong `fly.toml` và triển khai lại.

## Cập nhật

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` là quy trình có giám sát ở đây: nó dựng lại image từ Dockerfile, vì vậy phiên bản CLI/Gateway, image hệ điều hành cơ sở và mọi thay đổi đối với Dockerfile đều được cập nhật cùng nhau. `openclaw update` bên trong container đang chạy không phải là cùng một thao tác, vì image được phân phối dưới dạng cây `dist/` được dựng bằng Docker, không có bản sao làm việc `.git` và không có bản cài đặt toàn cục do npm quản lý để nó phát hiện; xem [Cập nhật](/vi/install/updating) để biết quy trình đó trên các bản cài đặt kiểu máy ảo.

### Cập nhật lệnh của máy

Để thay đổi lệnh khởi động mà không cần triển khai lại toàn bộ:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# hoặc kèm theo tăng bộ nhớ
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Một lần `fly deploy` sau đó sẽ đặt lại lệnh của máy về nội dung trong `fly.toml`; hãy áp dụng lại các thay đổi thủ công sau khi triển khai lại.

## Triển khai riêng tư (được tăng cường bảo mật)

Theo mặc định, Fly cấp phát IP công khai, vì vậy Gateway của bạn có thể được truy cập tại `https://your-app.fly.dev` và bị các trình quét Internet phát hiện (Shodan, Censys, v.v.).

Sử dụng `deploy/fly.private.toml` để triển khai được tăng cường bảo mật với **không có IP công khai**: tệp này bỏ qua `[http_service]`, vì vậy không có cổng truy cập công khai nào được cấp phát.

### Khi nào nên sử dụng triển khai riêng tư

- Chỉ có lệnh gọi/tin nhắn đi (không có Webhook đến)
- Đường hầm ngrok hoặc Tailscale xử lý mọi lệnh gọi lại Webhook
- Truy cập Gateway qua SSH, proxy hoặc WireGuard thay vì trình duyệt
- Cần ẩn triển khai khỏi các trình quét Internet

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

# chuyển sang cấu hình riêng tư để các lần triển khai sau không cấp phát lại IP công khai
fly deploy -c deploy/fly.private.toml

# chỉ cấp phát IPv6 riêng tư
fly ips allocate-v6 --private -a my-openclaw
```

Sau đó, `fly ips list` chỉ nên hiển thị một IP loại `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
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

**Tùy chọn 3: chỉ dùng SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook với bản triển khai riêng tư

Để nhận lệnh gọi lại Webhook (Twilio, Telnyx, v.v.) mà không công khai dịch vụ:

1. **Đường hầm ngrok**: chạy ngrok bên trong container hoặc dưới dạng sidecar
2. **Tailscale Funnel**: công khai các đường dẫn cụ thể qua Tailscale
3. **Chỉ kết nối đi**: một số nhà cung cấp (Twilio) hỗ trợ cuộc gọi đi mà không cần Webhook

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

Đường hầm ngrok chạy bên trong container và cung cấp một URL Webhook công khai mà không làm lộ chính ứng dụng Fly. Đặt `webhookSecurity.allowedHosts` thành tên máy chủ của đường hầm để chấp nhận các tiêu đề máy chủ được chuyển tiếp.

### Đánh đổi về bảo mật

| Khía cạnh              | Công khai          | Riêng tư           |
| ---------------------- | ------------------ | ------------------ |
| Trình quét Internet    | Có thể phát hiện   | Ẩn                 |
| Tấn công trực tiếp     | Có thể xảy ra      | Bị chặn            |
| Truy cập giao diện điều khiển | Trình duyệt | Proxy/VPN          |
| Phân phối Webhook      | Trực tiếp          | Qua đường hầm      |

## Lưu ý

- Fly.io sử dụng kiến trúc x86; Dockerfile tương thích với cả x86 và ARM.
- Để thiết lập ban đầu cho WhatsApp/Telegram, hãy sử dụng `fly ssh console`.
- Dữ liệu lâu dài nằm trên volume tại `/data`.
- Signal yêu cầu signal-cli (một CLI dựa trên Java) trong image; hãy sử dụng image tùy chỉnh và duy trì bộ nhớ từ 2 GB trở lên.

## Chi phí

Với cấu hình được khuyến nghị (`shared-cpu-2x`, RAM 2 GB), chi phí dự kiến khoảng 10–15 USD/tháng tùy theo mức sử dụng; gói miễn phí cung cấp một phần hạn mức cơ bản. Xem [bảng giá Fly.io](https://fly.io/docs/about/pricing/) để biết mức giá hiện tại.

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Hetzner](/vi/install/hetzner)
- [Docker](/vi/install/docker)
- [Lưu trữ trên VPS](/vi/vps)

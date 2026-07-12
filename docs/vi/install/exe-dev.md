---
read_when:
    - Bạn muốn một máy chủ Linux giá rẻ, luôn hoạt động cho Gateway
    - Bạn muốn truy cập từ xa vào giao diện điều khiển mà không cần tự vận hành VPS riêng
summary: Chạy OpenClaw Gateway trên exe.dev (máy ảo + proxy HTTPS) để truy cập từ xa
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T08:03:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Mục tiêu:** Gateway OpenClaw chạy trên một máy ảo [exe.dev](https://exe.dev), có thể truy cập tại `https://<vm-name>.exe.xyz`.

Hướng dẫn này giả định sử dụng ảnh **exeuntu** mặc định của exe.dev. Trên các bản phân phối khác, hãy điều chỉnh các gói cho phù hợp.

## Những gì bạn cần

- Tài khoản exe.dev
- Quyền truy cập máy ảo exe.dev bằng `ssh exe.dev` (không bắt buộc, dùng để thiết lập thủ công)

## Cách nhanh cho người mới bắt đầu

1. Mở [https://exe.new/openclaw](https://exe.new/openclaw)
2. Điền khóa xác thực/token của bạn nếu cần
3. Nhấp vào "Agent" bên cạnh máy ảo của bạn và chờ Shelley hoàn tất việc cấp phát
4. Mở `https://<vm-name>.exe.xyz/` và xác thực bằng bí mật dùng chung đã cấu hình (mặc định là xác thực bằng token; xác thực bằng mật khẩu cũng hoạt động nếu bạn chuyển đổi `gateway.auth.mode`)
5. Phê duyệt các yêu cầu ghép cặp thiết bị đang chờ bằng `openclaw devices approve <requestId>`

## Cài đặt tự động bằng Shelley

Shelley, tác nhân của exe.dev, có thể cài đặt OpenClaw từ một lời nhắc:

```text
Thiết lập OpenClaw (https://docs.openclaw.ai/install) trên máy ảo này. Sử dụng các cờ không tương tác và chấp nhận rủi ro cho quá trình thiết lập ban đầu của openclaw. Thêm thông tin xác thực hoặc token được cung cấp nếu cần. Cấu hình nginx để chuyển tiếp từ cổng mặc định 18789 đến vị trí gốc trong cấu hình trang web mặc định đang bật, đồng thời bảo đảm bật hỗ trợ WebSocket. Việc ghép cặp được thực hiện bằng "openclaw devices list" và "openclaw devices approve <request id>". Bảo đảm bảng điều khiển hiển thị trạng thái sức khỏe của OpenClaw là OK. exe.dev xử lý việc chuyển tiếp từ cổng 8000 đến cổng 80/443 và HTTPS cho chúng ta, vì vậy địa chỉ "có thể truy cập" cuối cùng phải là <vm-name>.exe.xyz, không chỉ định cổng.
```

## Cài đặt thủ công

<Steps>
  <Step title="Tạo máy ảo">
    Từ thiết bị của bạn:

    ```bash
    ssh exe.dev new
    ```

    Sau đó kết nối:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Hãy duy trì máy ảo này ở trạng thái **có lưu trạng thái**. OpenClaw lưu `openclaw.json`, `auth-profiles.json` của từng tác nhân, các phiên và trạng thái kênh/nhà cung cấp trong `~/.openclaw/`, cùng với không gian làm việc trong `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Cài đặt các thành phần tiên quyết (trên máy ảo)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Cấu hình nginx làm proxy đến cổng 8000">
    Chỉnh sửa `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Hỗ trợ WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Các header proxy tiêu chuẩn
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Thiết lập thời gian chờ cho các kết nối tồn tại lâu
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Ghi đè các header chuyển tiếp thay vì giữ lại chuỗi do máy khách cung cấp. OpenClaw chỉ tin cậy siêu dữ liệu IP được chuyển tiếp từ các proxy được cấu hình rõ ràng, và chuỗi `X-Forwarded-For` theo kiểu nối thêm được xem là một rủi ro về tăng cường bảo mật.

  </Step>

  <Step title="Truy cập OpenClaw và phê duyệt thiết bị">
    Mở `https://<vm-name>.exe.xyz/` (xem đầu ra của giao diện điều khiển từ quá trình thiết lập ban đầu). Nếu hệ thống yêu cầu xác thực, hãy dán bí mật dùng chung đã cấu hình từ máy ảo.

    Hướng dẫn này mặc định sử dụng xác thực bằng token, vì vậy hãy lấy `gateway.auth.token` bằng `openclaw config get gateway.auth.token`, hoặc tạo token mới bằng `openclaw doctor --n`. Nếu bạn đã chuyển Gateway sang xác thực bằng mật khẩu, hãy sử dụng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` thay thế.

    Phê duyệt thiết bị bằng `openclaw devices list` và `openclaw devices approve <requestId>`. Khi không chắc chắn, hãy sử dụng Shelley từ trình duyệt của bạn.

  </Step>
</Steps>

## Thiết lập kênh từ xa

Đối với máy chủ từ xa, nên dùng một lệnh gọi `config patch` thay vì nhiều lệnh gọi SSH đến `config set`. Giữ các token thực trong môi trường của máy ảo hoặc `~/.openclaw/.env`, và chỉ đặt SecretRef trong `openclaw.json`. Xem [Quản lý bí mật](/vi/gateway/secrets) để biết đầy đủ hợp đồng SecretRef.

Trên máy ảo, hãy bảo đảm môi trường dịch vụ chứa các bí mật cần thiết:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Từ máy cục bộ của bạn, hãy tạo một tệp bản vá và truyền nó qua pipe đến máy ảo:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Sử dụng `--replace-path` khi một danh sách cho phép lồng nhau cần trở thành chính xác giá trị của bản vá, ví dụ khi thay thế danh sách cho phép của một kênh Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Xem [Discord](/vi/channels/discord) và [Slack](/vi/channels/slack) để biết tài liệu tham chiếu đầy đủ về cấu hình kênh.

## Truy cập từ xa

exe.dev xử lý xác thực cho truy cập từ xa. Theo mặc định, lưu lượng HTTP từ cổng 8000 được chuyển tiếp đến `https://<vm-name>.exe.xyz` với xác thực bằng email.

## Cập nhật

```bash
openclaw update
```

Xem [Cập nhật](/vi/install/updating) để biết cách chuyển đổi kênh và khôi phục thủ công.

## Liên quan

- [Gateway từ xa](/vi/gateway/remote)
- [Tổng quan về cài đặt](/vi/install)

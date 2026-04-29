---
read_when:
    - Bạn muốn một máy chủ Linux giá rẻ luôn bật cho Gateway
    - Bạn muốn truy cập Giao diện điều khiển từ xa mà không cần chạy VPS của riêng mình
summary: Chạy OpenClaw Gateway trên exe.dev (VM + máy chủ proxy HTTPS) để truy cập từ xa
title: exe.dev
x-i18n:
    generated_at: "2026-04-29T22:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

Mục tiêu: OpenClaw Gateway chạy trên một VM exe.dev, có thể truy cập từ laptop của bạn qua: `https://<vm-name>.exe.xyz`

Trang này giả định bạn dùng image **exeuntu** mặc định của exe.dev. Nếu bạn chọn distro khác, hãy ánh xạ các gói tương ứng.

## Lộ trình nhanh cho người mới bắt đầu

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Điền auth key/token của bạn khi cần
3. Nhấp vào "Tác nhân" bên cạnh VM của bạn và chờ Shelley hoàn tất provisioning
4. Mở `https://<vm-name>.exe.xyz/` và xác thực bằng shared secret đã cấu hình (hướng dẫn này mặc định dùng xác thực bằng token, nhưng xác thực bằng mật khẩu cũng hoạt động nếu bạn chuyển `gateway.auth.mode`)
5. Phê duyệt mọi yêu cầu ghép đôi thiết bị đang chờ bằng `openclaw devices approve <requestId>`

## Những gì bạn cần

- Tài khoản exe.dev
- Quyền truy cập `ssh exe.dev` vào máy ảo [exe.dev](https://exe.dev) (tùy chọn)

## Cài đặt tự động bằng Shelley

Shelley, tác nhân của [exe.dev](https://exe.dev), có thể cài đặt OpenClaw tức thì bằng
prompt của chúng tôi. Prompt được dùng như bên dưới:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Cài đặt thủ công

## 1) Tạo VM

Từ thiết bị của bạn:

```bash
ssh exe.dev new
```

Sau đó kết nối:

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
Giữ VM này **có trạng thái**. OpenClaw lưu `openclaw.json`, `auth-profiles.json` theo từng tác nhân, phiên, và trạng thái channel/provider trong `~/.openclaw/`, cộng với workspace trong `~/.openclaw/workspace/`.
</Tip>

## 2) Cài đặt điều kiện tiên quyết (trên VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Cài đặt OpenClaw

Chạy script cài đặt OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Thiết lập nginx để proxy OpenClaw tới cổng 8000

Chỉnh sửa `/etc/nginx/sites-enabled/default` với

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Ghi đè forwarding header thay vì giữ lại các chuỗi do client cung cấp.
OpenClaw chỉ tin cậy metadata IP được forward từ các proxy được cấu hình rõ ràng,
và các chuỗi `X-Forwarded-For` kiểu append được xem là rủi ro gia cố bảo mật.

## 5) Truy cập OpenClaw và cấp đặc quyền

Truy cập `https://<vm-name>.exe.xyz/` (xem output Control UI từ onboarding). Nếu nó yêu cầu xác thực, hãy dán
shared secret đã cấu hình từ VM. Hướng dẫn này dùng xác thực bằng token, nên hãy lấy `gateway.auth.token`
bằng `openclaw config get gateway.auth.token` (hoặc tạo một token bằng `openclaw doctor --generate-gateway-token`).
Nếu bạn đã chuyển gateway sang xác thực bằng mật khẩu, hãy dùng `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` thay thế.
Phê duyệt thiết bị bằng `openclaw devices list` và `openclaw devices approve <requestId>`. Khi không chắc, hãy dùng Shelley từ trình duyệt của bạn!

## Thiết lập channel từ xa

Đối với host từ xa, hãy ưu tiên một lệnh gọi `config patch` thay vì nhiều lệnh gọi SSH tới `config set`. Giữ token thật trong môi trường VM hoặc `~/.openclaw/.env`, và chỉ đặt SecretRefs trong `openclaw.json`.

Trên VM, hãy làm cho môi trường service chứa các secret cần thiết:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Từ máy cục bộ của bạn, tạo một file patch và pipe nó tới VM:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
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

Dùng `--replace-path` khi một allowlist lồng nhau cần trở thành đúng bằng giá trị patch, ví dụ khi thay thế allowlist channel Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## Truy cập từ xa

Truy cập từ xa được xử lý bởi xác thực của [exe.dev](https://exe.dev). Theo
mặc định, lưu lượng HTTP từ cổng 8000 được forward tới `https://<vm-name>.exe.xyz`
với xác thực email.

## Cập nhật

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Hướng dẫn: [Cập nhật](/vi/install/updating)

## Liên quan

- [Gateway từ xa](/vi/gateway/remote)
- [Tổng quan cài đặt](/vi/install)

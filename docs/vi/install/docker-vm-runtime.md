---
read_when:
    - Bạn đang triển khai OpenClaw trên máy ảo đám mây bằng Docker
    - Bạn cần quy trình tạo bản dựng tệp nhị phân dùng chung, cơ chế lưu bền vững và luồng cập nhật
summary: Các bước thời gian chạy cho máy ảo Docker dùng chung dành cho các máy chủ OpenClaw Gateway chạy lâu dài
title: Môi trường chạy VM Docker
x-i18n:
    generated_at: "2026-04-29T22:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Các bước runtime dùng chung cho các bản cài đặt Docker dựa trên VM như GCP, Hetzner và các nhà cung cấp VPS tương tự.

## Đưa các binary bắt buộc vào image

Cài đặt binary bên trong một container đang chạy là một cái bẫy.
Mọi thứ được cài đặt lúc runtime sẽ bị mất khi khởi động lại.

Tất cả binary bên ngoài mà Skills yêu cầu phải được cài đặt tại thời điểm build image.

Các ví dụ bên dưới chỉ minh họa ba binary phổ biến:

- `gog` (từ `gogcli`) để truy cập Gmail
- `goplaces` cho Google Places
- `wacli` cho WhatsApp

Đây là ví dụ, không phải danh sách đầy đủ.
Bạn có thể cài đặt bao nhiêu binary tùy cần bằng cùng một mẫu.

Nếu sau này bạn thêm Skills mới phụ thuộc vào các binary bổ sung, bạn phải:

1. Cập nhật Dockerfile
2. Build lại image
3. Khởi động lại các container

**Dockerfile ví dụ**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Các URL ở trên là ví dụ. Với VM dựa trên ARM, hãy chọn các asset `arm64`. Để build có thể tái lập, hãy ghim các URL bản phát hành có phiên bản.
</Note>

## Build và khởi chạy

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Nếu build thất bại với `Killed` hoặc `exit code 137` trong khi chạy `pnpm install --frozen-lockfile`, VM đã hết bộ nhớ.
Hãy dùng một lớp máy lớn hơn trước khi thử lại.

Xác minh binary:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Kết quả mong đợi:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Xác minh Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Kết quả mong đợi:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Nội dung nào được lưu bền ở đâu

OpenClaw chạy trong Docker, nhưng Docker không phải nguồn sự thật.
Tất cả trạng thái tồn tại lâu dài phải sống sót qua các lần khởi động lại, build lại và reboot.

| Thành phần          | Vị trí                                   | Cơ chế lưu bền          | Ghi chú                                                       |
| ------------------- | ---------------------------------------- | ----------------------- | ------------------------------------------------------------- |
| Cấu hình Gateway    | `/home/node/.openclaw/`                  | Gắn volume từ host      | Bao gồm `openclaw.json`, `.env`                               |
| Hồ sơ xác thực model | `/home/node/.openclaw/agents/`           | Gắn volume từ host      | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API keys) |
| Cấu hình Skill      | `/home/node/.openclaw/skills/`           | Gắn volume từ host      | Trạng thái cấp Skill                                          |
| Workspace của agent | `/home/node/.openclaw/workspace/`        | Gắn volume từ host      | Mã nguồn và artifact của agent                                |
| Phiên WhatsApp      | `/home/node/.openclaw/`                  | Gắn volume từ host      | Giữ lại đăng nhập QR                                          |
| Keyring Gmail       | `/home/node/.openclaw/`                  | Volume từ host + mật khẩu | Yêu cầu `GOG_KEYRING_PASSWORD`                                |
| Dependency runtime của Plugin | `/var/lib/openclaw/plugin-runtime-deps/` | Volume có tên của Docker | Dependency Plugin tích hợp được tạo và mirror runtime         |
| Binary bên ngoài    | `/usr/local/bin/`                        | Docker image            | Phải được đưa vào tại thời điểm build                         |
| Runtime Node        | Hệ thống tệp container                   | Docker image            | Được build lại sau mỗi lần build image                        |
| Gói hệ điều hành    | Hệ thống tệp container                   | Docker image            | Không cài đặt lúc runtime                                     |
| Docker container    | Tạm thời                                 | Có thể khởi động lại    | An toàn để hủy                                                |

## Cập nhật

Để cập nhật OpenClaw trên VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Liên quan

- [Docker](/vi/install/docker)
- [Podman](/vi/install/podman)
- [ClawDock](/vi/install/clawdock)

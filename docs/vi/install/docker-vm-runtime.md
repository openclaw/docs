---
read_when:
    - Bạn đang triển khai OpenClaw trên một máy ảo đám mây bằng Docker
    - Bạn cần quy trình tích hợp sẵn tệp nhị phân dùng chung, lưu trữ bền vững và cập nhật.
summary: Các bước vận hành máy ảo Docker dùng chung cho các máy chủ Gateway OpenClaw hoạt động dài hạn
title: Môi trường chạy máy ảo Docker
x-i18n:
    generated_at: "2026-07-12T07:59:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Các bước runtime dùng chung cho những bản cài đặt Docker trên máy ảo như GCP, Hetzner và các nhà cung cấp VPS tương tự.

## Tích hợp các tệp nhị phân bắt buộc vào image

Cài đặt tệp nhị phân bên trong container đang chạy là một cái bẫy: mọi thứ được cài đặt
trong lúc chạy sẽ bị mất khi khởi động lại. Hãy tích hợp mọi tệp nhị phân bên ngoài mà một skill cần
vào image tại thời điểm dựng.

Các ví dụ dưới đây chỉ đề cập đến ba tệp nhị phân, theo thứ tự bảng chữ cái:

- `gog` (từ `gogcli`) để truy cập Gmail
- `goplaces` cho Google Places
- `wacli` cho WhatsApp

Đây là các ví dụ, không phải danh sách đầy đủ. Hãy cài đặt tất cả tệp nhị phân mà các
skill của bạn cần theo cùng một mẫu. Sau này, khi thêm một skill cần tệp
nhị phân mới:

1. Cập nhật Dockerfile.
2. Dựng lại image.
3. Khởi động lại các container.

**Dockerfile mẫu**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Tệp nhị phân mẫu 1: Gmail CLI (gogcli — được cài đặt dưới tên `gog`)
# Sao chép URL tài nguyên Linux hiện tại từ https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Tệp nhị phân mẫu 2: Google Places CLI
# Sao chép URL tài nguyên Linux hiện tại từ https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Tệp nhị phân mẫu 3: WhatsApp CLI
# Sao chép URL tài nguyên Linux hiện tại từ https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Thêm các tệp nhị phân khác bên dưới theo cùng một mẫu

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
Các URL trên chỉ là ví dụ. Đối với máy ảo dựa trên ARM, hãy chọn các tài nguyên `arm64`. Để bảo đảm các bản dựng có thể tái lập, hãy cố định URL bản phát hành có phiên bản cụ thể.
</Note>

## Dựng và khởi chạy

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Nếu quá trình dựng thất bại với `Killed` hoặc mã thoát 137 trong lúc chạy `pnpm install --frozen-lockfile`, máy ảo đã hết bộ nhớ. Hãy sử dụng loại máy lớn hơn trước khi thử lại.

Xác minh các tệp nhị phân:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Đầu ra dự kiến:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Xác minh Gateway đang hoạt động:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Việc `/healthz` trả về phản hồi 200 xác nhận tiến trình Gateway đang lắng nghe và hoạt động bình thường; `HEALTHCHECK` tích hợp sẵn trong image sẽ thăm dò cùng endpoint này.

## Thành phần nào được duy trì ở đâu

OpenClaw chạy trong Docker, nhưng Docker không phải là nguồn dữ liệu chính xác. Mọi trạng thái dài hạn đều phải tồn tại qua các lần khởi động lại, dựng lại và khởi động lại hệ thống.

| Thành phần                     | Vị trí                                                 | Cơ chế duy trì              | Ghi chú                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Cấu hình Gateway               | `/home/node/.openclaw/`                                | Gắn volume từ máy chủ       | Bao gồm `openclaw.json`                                                                                                                     |
| Thông tin xác thực kênh/nhà cung cấp | `/home/node/.openclaw/credentials/`                    | Gắn volume từ máy chủ       | Dữ liệu thông tin xác thực của kênh và nhà cung cấp                                                                                         |
| Hồ sơ xác thực mô hình         | `/home/node/.openclaw/agents/`                         | Gắn volume từ máy chủ       | `agents/<agentId>/agent/auth-profiles.json` (OAuth, khóa API)                                                                               |
| Tệp khóa OAuth cũ              | `/home/node/.config/openclaw/`                         | Gắn volume từ máy chủ       | Khả năng tương thích chỉ đọc cho các tệp phụ OAuth trước khi di chuyển; `openclaw doctor --fix` di chuyển chúng vào `auth-profiles.json`    |
| Cấu hình skill                 | `/home/node/.openclaw/skills/`                         | Gắn volume từ máy chủ       | Trạng thái cấp skill                                                                                                                        |
| Không gian làm việc của tác tử | `/home/node/.openclaw/workspace/`                      | Gắn volume từ máy chủ       | Mã và sản phẩm tạo tác của tác tử                                                                                                           |
| Phiên WhatsApp                 | `/home/node/.openclaw/`                                | Gắn volume từ máy chủ       | Duy trì trạng thái đăng nhập bằng mã QR                                                                                                     |
| Kho khóa Gmail                 | `/home/node/.openclaw/`                                | Volume máy chủ + mật khẩu   | Yêu cầu `GOG_KEYRING_PASSWORD`                                                                                                              |
| Các gói Plugin                 | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Gắn volume từ máy chủ       | Thư mục gốc của các gói Plugin có thể tải xuống                                                                                            |
| Các tệp nhị phân bên ngoài     | `/usr/local/bin/`                                      | Image Docker                | Phải được tích hợp tại thời điểm dựng                                                                                                       |
| Runtime Node                   | Hệ thống tệp của container                             | Image Docker                | Được dựng lại mỗi khi dựng image                                                                                                            |
| Các gói hệ điều hành           | Hệ thống tệp của container                             | Image Docker                | Không cài đặt trong lúc chạy                                                                                                                |
| Container Docker               | Tạm thời                                               | Có thể khởi động lại        | Có thể hủy bỏ an toàn                                                                                                                       |

## Cập nhật

Để cập nhật OpenClaw trên máy ảo:

```bash
git pull
docker compose build
docker compose up -d
```

## Liên quan

- [Docker](/vi/install/docker)
- [Podman](/vi/install/podman)
- [ClawDock](/vi/install/clawdock)

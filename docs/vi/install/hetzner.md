---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên một VPS đám mây (không phải laptop của bạn)
    - Bạn muốn một Gateway luôn hoạt động, sẵn sàng cho môi trường sản xuất trên VPS của riêng mình
    - Bạn muốn toàn quyền kiểm soát cơ chế lưu trạng thái, các tệp nhị phân và hành vi khởi động lại
    - Bạn đang chạy OpenClaw trong Docker trên Hetzner hoặc một nhà cung cấp tương tự
summary: Chạy OpenClaw Gateway 24/7 trên một VPS Hetzner giá rẻ (Docker) với trạng thái bền vững và các tệp nhị phân được tích hợp sẵn
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:18:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw trên Hetzner (Docker, Hướng dẫn VPS sản xuất)

## Mục tiêu

Chạy một OpenClaw Gateway bền bỉ trên VPS Hetzner bằng Docker, với trạng thái lâu dài, các binary được đóng sẵn và hành vi khởi động lại an toàn.

Nếu bạn muốn "OpenClaw 24/7 với chi phí khoảng $5", đây là thiết lập đáng tin cậy đơn giản nhất.
Giá Hetzner thay đổi; hãy chọn VPS Debian/Ubuntu nhỏ nhất và nâng cấp nếu gặp lỗi OOM.

Nhắc lại mô hình bảo mật:

- Các agent dùng chung trong công ty là ổn khi mọi người nằm trong cùng một ranh giới tin cậy và runtime chỉ dùng cho công việc.
- Giữ phân tách nghiêm ngặt: VPS/runtime riêng + tài khoản riêng; không dùng hồ sơ Apple/Google/trình duyệt/trình quản lý mật khẩu cá nhân trên máy chủ đó.
- Nếu người dùng có thể đối nghịch nhau, hãy tách theo gateway/máy chủ/người dùng OS.

Xem [Bảo mật](/vi/gateway/security) và [Lưu trữ VPS](/vi/vps).

## Chúng ta đang làm gì (nói đơn giản)?

- Thuê một máy chủ Linux nhỏ (VPS Hetzner)
- Cài Docker (runtime ứng dụng cô lập)
- Khởi động OpenClaw Gateway trong Docker
- Lưu bền bỉ `~/.openclaw` + `~/.openclaw/workspace` trên máy chủ (tồn tại qua khởi động lại/tạo lại)
- Truy cập Control UI từ máy tính xách tay của bạn qua đường hầm SSH

Trạng thái `~/.openclaw` được mount đó bao gồm `openclaw.json`, từng agent
`agents/<agentId>/agent/auth-profiles.json`, và `.env`.

Có thể truy cập Gateway qua:

- Chuyển tiếp cổng SSH từ máy tính xách tay của bạn
- Mở cổng trực tiếp nếu bạn tự quản lý tường lửa và token

Hướng dẫn này giả định dùng Ubuntu hoặc Debian trên Hetzner.  
Nếu bạn đang dùng VPS Linux khác, hãy ánh xạ các gói tương ứng.
Để xem luồng Docker chung, xem [Docker](/vi/install/docker).

---

## Lộ trình nhanh (người vận hành có kinh nghiệm)

1. Cấp phát VPS Hetzner
2. Cài Docker
3. Clone kho lưu trữ OpenClaw
4. Tạo thư mục máy chủ bền bỉ
5. Cấu hình `.env` và `docker-compose.yml`
6. Đóng sẵn các binary cần thiết vào image
7. `docker compose up -d`
8. Xác minh tính bền bỉ và truy cập Gateway

---

## Bạn cần gì

- VPS Hetzner có quyền root
- Truy cập SSH từ máy tính xách tay của bạn
- Quen cơ bản với SSH + sao chép/dán
- Khoảng 20 phút
- Docker và Docker Compose
- Thông tin xác thực model
- Thông tin xác thực nhà cung cấp tùy chọn
  - WhatsApp QR
  - Token bot Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    Tạo một VPS Ubuntu hoặc Debian trong Hetzner.

    Kết nối bằng root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Hướng dẫn này giả định VPS có trạng thái lâu dài.
    Đừng xem nó là hạ tầng dùng xong bỏ.

  </Step>

  <Step title="Install Docker (on the VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Xác minh:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này giả định bạn sẽ build một image tùy chỉnh để đảm bảo binary được lưu bền bỉ.

  </Step>

  <Step title="Create persistent host directories">
    Container Docker là tạm thời.
    Mọi trạng thái tồn tại lâu dài phải nằm trên máy chủ.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    Tạo `.env` ở thư mục gốc của kho lưu trữ.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Để trống `OPENCLAW_GATEWAY_TOKEN` trừ khi bạn rõ ràng muốn
    quản lý nó qua `.env`; OpenClaw ghi một token gateway ngẫu nhiên vào
    cấu hình khi khởi động lần đầu. Tạo mật khẩu keyring và dán vào
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Không commit tệp này.**

    Tệp `.env` này dành cho env container/runtime như `OPENCLAW_GATEWAY_TOKEN`.
    Auth OAuth/API-key của nhà cung cấp đã lưu nằm trong tệp được mount
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Docker Compose configuration">
    Tạo hoặc cập nhật `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` chỉ để tiện bootstrap, không thay thế cho cấu hình gateway đúng cách. Vẫn hãy thiết lập auth (`gateway.auth.token` hoặc mật khẩu) và dùng thiết lập bind an toàn cho triển khai của bạn.

  </Step>

  <Step title="Shared Docker VM runtime steps">
    Dùng hướng dẫn runtime dùng chung cho luồng máy chủ Docker phổ biến:

    - [Đóng sẵn các binary cần thiết vào image](/vi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build và khởi chạy](/vi/install/docker-vm-runtime#build-and-launch)
    - [Nơi lưu bền bỉ của từng thứ](/vi/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/vi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    Sau các bước build và khởi chạy dùng chung, hoàn tất thiết lập sau để mở đường hầm:

    **Điều kiện tiên quyết:** Đảm bảo cấu hình sshd của VPS cho phép chuyển tiếp TCP. Nếu bạn
    đã tăng cứng cấu hình SSH, hãy kiểm tra `/etc/ssh/sshd_config` và đặt:

    ```
    AllowTcpForwarding local
    ```

    `local` cho phép các chuyển tiếp cục bộ `ssh -L` từ máy tính xách tay của bạn đồng thời chặn
    các chuyển tiếp từ xa từ máy chủ. Đặt thành `no` sẽ làm đường hầm
    thất bại với:
    `channel 3: open failed: administratively prohibited: open failed`

    Sau khi xác nhận chuyển tiếp TCP đã được bật, khởi động lại dịch vụ SSH
    (`systemctl restart ssh`) và chạy đường hầm từ máy tính xách tay của bạn:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Mở:

    `http://127.0.0.1:18789/`

    Dán bí mật dùng chung đã cấu hình. Hướng dẫn này dùng token gateway theo
    mặc định; nếu bạn đã chuyển sang auth bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

  </Step>
</Steps>

Bản đồ lưu bền bỉ dùng chung nằm trong [Docker VM Runtime](/vi/install/docker-vm-runtime#what-persists-where).

## Infrastructure as Code (Terraform)

Đối với các đội thích quy trình hạ tầng dưới dạng mã, một thiết lập Terraform do cộng đồng duy trì cung cấp:

- Cấu hình Terraform dạng mô-đun với quản lý trạng thái từ xa
- Cấp phát tự động qua cloud-init
- Script triển khai (bootstrap, deploy, backup/restore)
- Tăng cứng bảo mật (tường lửa, UFW, chỉ truy cập SSH)
- Cấu hình đường hầm SSH để truy cập gateway

**Kho lưu trữ:**

- Hạ tầng: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Cấu hình Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cách tiếp cận này bổ sung cho thiết lập Docker ở trên bằng các bản triển khai có thể tái tạo, hạ tầng được kiểm soát phiên bản và khôi phục thảm họa tự động.

<Note>
Do cộng đồng duy trì. Đối với vấn đề hoặc đóng góp, xem các liên kết kho lưu trữ ở trên.
</Note>

## Bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Fly.io](/vi/install/fly)
- [Docker](/vi/install/docker)
- [Lưu trữ VPS](/vi/vps)

---
read_when:
    - Bạn muốn OpenClaw chạy 24/7 trên một VPS đám mây (không phải máy tính xách tay của bạn)
    - Bạn muốn một Gateway cấp độ production, luôn hoạt động trên VPS của riêng mình
    - Bạn muốn toàn quyền kiểm soát việc lưu trữ lâu dài, các tệp nhị phân và hành vi khởi động lại
    - Bạn đang chạy OpenClaw trong Docker trên Hetzner hoặc một nhà cung cấp tương tự
summary: Chạy OpenClaw Gateway 24/7 trên VPS Hetzner giá rẻ (Docker) với trạng thái bền vững và các tệp nhị phân được tích hợp sẵn
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T08:03:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

Chạy một OpenClaw Gateway thường trực trên VPS Hetzner bằng Docker, với trạng thái bền vững, các tệp nhị phân được tích hợp sẵn và hành vi khởi động lại an toàn.

Giá của Hetzner có thể thay đổi; hãy chọn VPS Debian/Ubuntu nhỏ nhất đáp ứng nhu cầu và nâng cấp nếu gặp lỗi hết bộ nhớ (OOM).

Bạn có thể truy cập Gateway qua chuyển tiếp cổng SSH từ máy tính xách tay hoặc mở cổng trực tiếp nếu tự quản lý tường lửa và token.

Nhắc lại về mô hình bảo mật:

- Các tác tử dùng chung trong công ty là phù hợp khi mọi người cùng nằm trong một ranh giới tin cậy và môi trường thực thi chỉ phục vụ công việc.
- Duy trì phân tách nghiêm ngặt: VPS/môi trường thực thi chuyên dụng + tài khoản chuyên dụng; không sử dụng hồ sơ Apple/Google/trình duyệt/trình quản lý mật khẩu cá nhân trên máy chủ đó.
- Nếu người dùng có thể đối kháng lẫn nhau, hãy phân tách theo Gateway/máy chủ/người dùng hệ điều hành.

Xem [Bảo mật](/vi/gateway/security) và [Lưu trữ trên VPS](/vi/vps).

Hướng dẫn này giả định Hetzner chạy Ubuntu hoặc Debian. Trên VPS Linux khác, hãy ánh xạ các gói tương ứng. Để xem quy trình Docker chung, hãy xem [Docker](/vi/install/docker).

## Những gì bạn cần

- VPS Hetzner có quyền truy cập root
- Quyền truy cập SSH từ máy tính xách tay
- Docker và Docker Compose
- Thông tin xác thực mô hình
- Thông tin xác thực nhà cung cấp tùy chọn (mã QR WhatsApp, token bot Telegram, Gmail OAuth)
- Khoảng 20 phút

## Quy trình nhanh

1. Cấp phát VPS Hetzner
2. Cài đặt Docker
3. Sao chép kho lưu trữ OpenClaw
4. Tạo các thư mục lâu bền trên máy chủ
5. Cấu hình `.env` và `docker-compose.yml`
6. Tích hợp các tệp nhị phân cần thiết vào image
7. `docker compose up -d`
8. Xác minh khả năng duy trì trạng thái và truy cập Gateway

<Steps>
  <Step title="Cấp phát VPS">
    Tạo VPS Ubuntu hoặc Debian trên Hetzner, sau đó kết nối với tư cách root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Hãy coi VPS là hạ tầng có trạng thái, không phải hạ tầng dùng một lần.

  </Step>

  <Step title="Cài đặt Docker (trên VPS)">
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

  <Step title="Sao chép kho lưu trữ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Hướng dẫn này xây dựng một image tùy chỉnh để mọi tệp nhị phân được tích hợp vào đó vẫn tồn tại sau khi khởi động lại.

  </Step>

  <Step title="Tạo các thư mục lâu bền trên máy chủ">
    Các container Docker có tính tạm thời; mọi trạng thái dài hạn phải nằm trên máy chủ.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Đặt quyền sở hữu cho người dùng trong container (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Cấu hình biến môi trường">
    Tạo `.env` tại thư mục gốc của kho lưu trữ:

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

    Đặt `OPENCLAW_GATEWAY_TOKEN` để quản lý token Gateway ổn định thông qua
    `.env`; nếu không, hãy cấu hình `gateway.auth.token` trước khi dựa vào các máy khách
    qua nhiều lần khởi động lại. Nếu không đặt cả hai, OpenClaw sẽ sử dụng token chỉ tồn tại
    trong thời gian chạy cho lần khởi động đó. Tạo mật khẩu chuỗi khóa cho `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Không cam kết tệp này vào kho lưu trữ.** Tệp chứa các biến môi trường của container/môi trường thực thi như
    `OPENCLAW_GATEWAY_TOKEN`. Thông tin xác thực OAuth/khóa API của nhà cung cấp đã lưu nằm trong
    tệp `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` được gắn kết.

  </Step>

  <Step title="Cấu hình Docker Compose">
    Tạo hoặc cập nhật `docker-compose.yml`:

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
          # Khuyến nghị: chỉ cho phép truy cập Gateway qua loopback trên VPS; truy cập qua đường hầm SSH.
          # Để mở công khai, hãy xóa tiền tố `127.0.0.1:` và cấu hình tường lửa tương ứng.
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

    `--allow-unconfigured` chỉ nhằm tạo thuận tiện khi khởi tạo, không thay thế cho cấu hình Gateway thực tế. Bạn vẫn phải thiết lập xác thực (`gateway.auth.token` hoặc mật khẩu) và chế độ liên kết an toàn cho quá trình triển khai.

  </Step>

  <Step title="Các bước dùng chung cho môi trường thực thi máy ảo Docker">
    Làm theo hướng dẫn môi trường thực thi dùng chung cho quy trình máy chủ Docker phổ biến:

    - [Tích hợp các tệp nhị phân cần thiết vào image](/vi/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Xây dựng và khởi chạy](/vi/install/docker-vm-runtime#build-and-launch)
    - [Những gì được duy trì và nằm ở đâu](/vi/install/docker-vm-runtime#what-persists-where)
    - [Cập nhật](/vi/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Truy cập dành riêng cho Hetzner">
    Sau các bước xây dựng và khởi chạy dùng chung, hãy mở đường hầm.

    **Điều kiện tiên quyết:** đảm bảo cấu hình sshd của VPS cho phép chuyển tiếp TCP. Nếu bạn
    đã tăng cường bảo mật cấu hình SSH, hãy kiểm tra `/etc/ssh/sshd_config` và đặt:

    ```text
    AllowTcpForwarding local
    ```

    `local` cho phép chuyển tiếp cục bộ bằng `ssh -L` từ máy tính xách tay, đồng thời chặn
    chuyển tiếp từ xa từ máy chủ. Đặt thành `no` sẽ khiến đường hầm thất bại với thông báo:
    `channel 3: open failed: administratively prohibited: open failed`

    Sau khi xác nhận chuyển tiếp TCP đã được bật, hãy khởi động lại dịch vụ SSH
    (`systemctl restart ssh`) và chạy đường hầm từ máy tính xách tay:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Mở `http://127.0.0.1:18789/` và dán khóa bí mật dùng chung đã cấu hình.
    Theo mặc định, hướng dẫn này sử dụng token Gateway; hãy dùng mật khẩu đã cấu hình
    nếu bạn đã chuyển sang xác thực bằng mật khẩu.

  </Step>
</Steps>

Bản đồ duy trì trạng thái dùng chung nằm trong [Môi trường thực thi máy ảo Docker](/vi/install/docker-vm-runtime#what-persists-where).

## Hạ tầng dưới dạng mã (Terraform)

Đối với các nhóm ưu tiên quy trình hạ tầng dưới dạng mã, một thiết lập Terraform do cộng đồng duy trì cung cấp:

- Cấu hình Terraform theo mô-đun với khả năng quản lý trạng thái từ xa
- Cấp phát tự động qua cloud-init
- Các tập lệnh triển khai (khởi tạo, triển khai, sao lưu/khôi phục)
- Tăng cường bảo mật (tường lửa, UFW, chỉ cho phép truy cập SSH)
- Cấu hình đường hầm SSH để truy cập Gateway

**Kho lưu trữ:**

- Hạ tầng: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Cấu hình Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

Cách tiếp cận này bổ sung cho thiết lập Docker ở trên bằng khả năng triển khai có thể tái tạo, hạ tầng được kiểm soát phiên bản và khôi phục sau thảm họa tự động.

<Note>
Do cộng đồng duy trì. Để báo cáo vấn đề hoặc đóng góp, hãy xem các liên kết kho lưu trữ ở trên.
</Note>

## Các bước tiếp theo

- Thiết lập các kênh nhắn tin: [Kênh](/vi/channels)
- Cấu hình Gateway: [Cấu hình Gateway](/vi/gateway/configuration)
- Luôn cập nhật OpenClaw: [Cập nhật](/vi/install/updating)

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Fly.io](/vi/install/fly)
- [Docker](/vi/install/docker)
- [Lưu trữ trên VPS](/vi/vps)

---
read_when:
    - Thiết lập OpenClaw trên DigitalOcean
    - Tìm một VPS trả phí đơn giản cho OpenClaw
summary: Lưu trữ OpenClaw trên DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-29T22:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 16
---

Chạy một OpenClaw Gateway bền bỉ trên DigitalOcean Droplet.

## Điều kiện tiên quyết

- Tài khoản DigitalOcean ([đăng ký](https://cloud.digitalocean.com/registrations/new))
- Cặp khóa SSH (hoặc sẵn sàng dùng xác thực bằng mật khẩu)
- Khoảng 20 phút

## Thiết lập

<Steps>
  <Step title="Tạo Droplet">
    <Warning>
    Dùng ảnh nền sạch (Ubuntu 24.04 LTS). Tránh các ảnh Marketplace 1-click của bên thứ ba trừ khi bạn đã xem xét các script khởi động và mặc định tường lửa của chúng.
    </Warning>

    1. Đăng nhập vào [DigitalOcean](https://cloud.digitalocean.com/).
    2. Nhấp **Create > Droplets**.
    3. Chọn:
       - **Khu vực:** Gần bạn nhất
       - **Ảnh:** Ubuntu 24.04 LTS
       - **Kích cỡ:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Xác thực:** Khóa SSH (khuyến nghị) hoặc mật khẩu
    4. Nhấp **Create Droplet** và ghi lại địa chỉ IP.

  </Step>

  <Step title="Kết nối và cài đặt">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Chạy quy trình nhập môn">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ dẫn bạn qua xác thực mô hình, thiết lập kênh, tạo token Gateway và cài đặt daemon (systemd).

  </Step>

  <Step title="Thêm swap (khuyến nghị cho Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Xác minh Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Giao diện điều khiển">
    Gateway liên kết với loopback theo mặc định. Chọn một trong các tùy chọn sau.

    **Tùy chọn A: Đường hầm SSH (đơn giản nhất)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Sau đó mở `http://localhost:18789`.

    **Tùy chọn B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Sau đó mở `https://<magicdns>/` từ bất kỳ thiết bị nào trên tailnet của bạn.

    **Tùy chọn C: Liên kết tailnet (không dùng Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Sau đó mở `http://<tailscale-ip>:18789` (cần token).

  </Step>
</Steps>

## Khắc phục sự cố

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Cổng đã được sử dụng** -- Chạy `lsof -i :18789` để tìm tiến trình, rồi dừng tiến trình đó.

**Hết bộ nhớ** -- Xác minh swap đang hoạt động bằng `free -h`. Nếu vẫn gặp OOM, hãy dùng các mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ, hoặc nâng cấp lên Droplet 2 GB.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và các kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Fly.io](/vi/install/fly)
- [Hetzner](/vi/install/hetzner)
- [Lưu trữ VPS](/vi/vps)

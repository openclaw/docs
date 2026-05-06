---
read_when:
    - Thiết lập OpenClaw trên DigitalOcean
    - Tìm một VPS trả phí đơn giản cho OpenClaw
summary: Triển khai OpenClaw trên DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:17:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Chạy OpenClaw Gateway bền bỉ trên DigitalOcean Droplet (~$6/tháng cho gói Basic 1 GB).

DigitalOcean là cách dùng VPS trả phí đơn giản nhất. Nếu bạn muốn các tùy chọn rẻ hơn hoặc miễn phí:

- [Hetzner](/vi/install/hetzner) — €3.79/tháng, nhiều lõi/RAM hơn trên mỗi đô la.
- [Oracle Cloud](/vi/install/oracle) — ARM Always Free (tối đa 4 OCPU, RAM 24 GB), nhưng đăng ký có thể hơi khó và chỉ dành cho ARM.

## Điều kiện tiên quyết

- Tài khoản DigitalOcean ([đăng ký](https://cloud.digitalocean.com/registrations/new))
- Cặp khóa SSH (hoặc sẵn sàng dùng xác thực bằng mật khẩu)
- Khoảng 20 phút

## Thiết lập

<Steps>
  <Step title="Tạo Droplet">
    <Warning>
    Dùng ảnh cơ sở sạch (Ubuntu 24.04 LTS). Tránh ảnh 1-click từ Marketplace của bên thứ ba trừ khi bạn đã xem xét các script khởi động và mặc định tường lửa của chúng.
    </Warning>

    1. Đăng nhập vào [DigitalOcean](https://cloud.digitalocean.com/).
    2. Nhấp **Create > Droplets**.
    3. Chọn:
       - **Khu vực:** Gần bạn nhất
       - **Ảnh:** Ubuntu 24.04 LTS
       - **Kích cỡ:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
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

  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ đưa bạn qua xác thực mô hình, thiết lập kênh, tạo token Gateway và cài đặt daemon (systemd).

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

  <Step title="Xác minh gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Control UI">
    Theo mặc định, gateway liên kết với loopback. Chọn một trong các tùy chọn sau.

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

    Sau đó mở `https://<magicdns>/` từ bất kỳ thiết bị nào trong tailnet của bạn.

    Tailscale Serve xác thực lưu lượng Control UI và WebSocket thông qua header danh tính tailnet, giả định rằng máy chủ gateway tự thân là đáng tin cậy. Các endpoint HTTP API vẫn tuân theo chế độ xác thực bình thường của gateway (token/mật khẩu). Để yêu cầu thông tin xác thực shared-secret rõ ràng qua Serve, đặt `gateway.auth.allowTailscale: false` và dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    **Tùy chọn C: Liên kết tailnet (không dùng Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Sau đó mở `http://<tailscale-ip>:18789` (yêu cầu token).

  </Step>
</Steps>

## Duy trì trạng thái và sao lưu

Trạng thái OpenClaw nằm trong:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp và dữ liệu phiên.
- `~/.openclaw/workspace/` — workspace của agent (SOUL.md, bộ nhớ, artifact).

Các dữ liệu này vẫn còn sau khi Droplet khởi động lại. Để tạo snapshot có thể di chuyển:

```bash
openclaw backup create
```

Snapshot của DigitalOcean sao lưu toàn bộ Droplet; `openclaw backup create` có thể di chuyển giữa các máy chủ.

## Mẹo cho RAM 1 GB

Droplet $6 chỉ có RAM 1 GB. Để mọi thứ chạy mượt:

- Đảm bảo bước swap ở trên nằm trong `/etc/fstab` để vẫn tồn tại sau khi khởi động lại.
- Ưu tiên mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ — suy luận LLM cục bộ không phù hợp với 1 GB.
- Đặt `agents.defaults.model.primary` thành mô hình nhỏ hơn nếu bạn gặp OOM với prompt lớn.
- Giám sát bằng `free -h` và `htop`.

## Khắc phục sự cố

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra log bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Cổng đã được sử dụng** -- Chạy `lsof -i :18789` để tìm tiến trình, rồi dừng tiến trình đó.

**Hết bộ nhớ** -- Xác minh swap đang hoạt động bằng `free -h`. Nếu vẫn gặp OOM, hãy dùng mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ, hoặc nâng cấp lên Droplet 2 GB.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều dịch vụ khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Fly.io](/vi/install/fly)
- [Hetzner](/vi/install/hetzner)
- [Lưu trữ VPS](/vi/vps)

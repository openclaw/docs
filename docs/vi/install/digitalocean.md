---
read_when:
    - Thiết lập OpenClaw trên DigitalOcean
    - Tìm một VPS trả phí đơn giản cho OpenClaw
summary: Lưu trữ OpenClaw trên DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T08:03:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Chạy một OpenClaw Gateway thường trực trên DigitalOcean Droplet (~6 USD/tháng cho gói Basic 1 GB).

DigitalOcean là một lựa chọn VPS trả phí đơn giản. Để có các lựa chọn rẻ hơn hoặc miễn phí:

- [Hetzner](/vi/install/hetzner) -- nhiều lõi/RAM hơn trên mỗi đô la.
- [Oracle Cloud](/vi/install/oracle) -- tầng ARM Always Free (tối đa 4 OCPU, 24 GB RAM), nhưng quá trình đăng ký có thể khá phiền phức và chỉ hỗ trợ ARM.

## Điều kiện tiên quyết

- Tài khoản DigitalOcean ([đăng ký](https://cloud.digitalocean.com/registrations/new))
- Cặp khóa SSH (hoặc sẵn sàng sử dụng xác thực bằng mật khẩu)
- Khoảng 20 phút

## Thiết lập

<Steps>
  <Step title="Tạo Droplet">
    <Warning>
    Sử dụng ảnh hệ điều hành cơ sở sạch (Ubuntu 24.04 LTS). Tránh các ảnh cài đặt một cú nhấp của Marketplace từ bên thứ ba, trừ khi bạn đã xem xét các tập lệnh khởi động và thiết lập tường lửa mặc định của chúng.
    </Warning>

    1. Đăng nhập vào [DigitalOcean](https://cloud.digitalocean.com/).
    2. Nhấp vào **Create > Droplets**.
    3. Chọn:
       - **Region:** Gần bạn nhất
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** Khóa SSH (khuyến nghị) hoặc mật khẩu
    4. Nhấp vào **Create Droplet** và ghi lại địa chỉ IP.

  </Step>

  <Step title="Kết nối và cài đặt">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Cài đặt Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Cài đặt OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Tạo người dùng không phải root sẽ sở hữu trạng thái và dịch vụ OpenClaw.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Chỉ sử dụng shell root để khởi tạo hệ thống. Chạy các lệnh OpenClaw bằng người dùng không phải root `openclaw` để trạng thái nằm trong `/home/openclaw/.openclaw/` và Gateway được cài đặt dưới dạng dịch vụ systemd `--user` của người dùng đó.

  </Step>

  <Step title="Chạy quy trình hướng dẫn thiết lập ban đầu">
    ```bash
    openclaw onboard --install-daemon
    ```

    Trình hướng dẫn sẽ đưa bạn qua các bước xác thực mô hình, thiết lập kênh, tạo token Gateway và cài đặt daemon (dịch vụ người dùng systemd).

  </Step>

  <Step title="Thêm bộ nhớ hoán đổi (khuyến nghị cho Droplet 1 GB)">
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

  <Step title="Truy cập giao diện điều khiển">
    Theo mặc định, Gateway liên kết với local loopback. Chọn một trong các phương án sau.

    **Phương án A: Đường hầm SSH (đơn giản nhất)**

    ```bash
    # Từ máy cục bộ của bạn
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Sau đó mở `http://localhost:18789`.

    **Phương án B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Sau đó mở `https://<magicdns>/` từ bất kỳ thiết bị nào trên tailnet của bạn.

    Tailscale Serve xác thực lưu lượng giao diện điều khiển và WebSocket thông qua các tiêu đề danh tính tailnet, với giả định rằng chính máy chủ Gateway là đáng tin cậy. Các điểm cuối API HTTP vẫn tuân theo chế độ xác thực thông thường của Gateway (token/mật khẩu) trong mọi trường hợp. Để yêu cầu thông tin xác thực bằng bí mật dùng chung rõ ràng khi sử dụng Serve, hãy đặt `gateway.auth.allowTailscale: false` và sử dụng `gateway.auth.mode: "token"` hoặc `"password"`.

    **Phương án C: Liên kết tailnet (không dùng Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Sau đó mở `http://<tailscale-ip>:18789` (yêu cầu token).

  </Step>
</Steps>

## Duy trì trạng thái và sao lưu

Trạng thái OpenClaw nằm trong:

- `~/.openclaw/` -- `openclaw.json`, thông tin xác thực kênh/nhà cung cấp, `auth-profiles.json` theo từng tác nhân và dữ liệu phiên.
- `~/.openclaw/workspace/` -- không gian làm việc của tác nhân (SOUL.md, bộ nhớ, hiện vật).

Những dữ liệu này vẫn tồn tại sau khi Droplet khởi động lại. Để tạo một bản chụp nhanh có thể di chuyển:

```bash
openclaw backup create
```

Ảnh chụp nhanh DigitalOcean sao lưu toàn bộ Droplet; `openclaw backup create` có thể di chuyển giữa các máy chủ.

## Mẹo cho RAM 1 GB

Droplet 6 USD chỉ có 1 GB RAM. Để hệ thống hoạt động trơn tru:

- Đảm bảo bước thiết lập bộ nhớ hoán đổi ở trên có trong `/etc/fstab` để thiết lập này vẫn tồn tại sau khi khởi động lại.
- Ưu tiên các mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ -- suy luận LLM cục bộ không phù hợp với 1 GB.
- Đặt `agents.defaults.model.primary` thành một mô hình nhỏ hơn nếu bạn gặp lỗi hết bộ nhớ với các lời nhắc lớn.
- Theo dõi bằng `free -h` và `htop`.

## Khắc phục sự cố

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Cổng đã được sử dụng** -- Chạy `lsof -i :18789` để tìm tiến trình, sau đó dừng tiến trình đó.

**Hết bộ nhớ** -- Xác minh bộ nhớ hoán đổi đang hoạt động bằng `free -h`. Nếu vẫn gặp lỗi hết bộ nhớ, hãy chuyển sang các mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ hoặc nâng cấp lên Droplet 2 GB.

## Các bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều nền tảng khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- duy trì OpenClaw ở phiên bản mới nhất

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Fly.io](/vi/install/fly)
- [Hetzner](/vi/install/hetzner)
- [Lưu trữ VPS](/vi/vps)

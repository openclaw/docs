---
read_when:
    - Thiết lập OpenClaw trên Raspberry Pi
    - Chạy OpenClaw trên các thiết bị ARM
    - Xây dựng một AI cá nhân luôn hoạt động với chi phí thấp
summary: Triển khai OpenClaw trên Raspberry Pi để tự lưu trữ luôn hoạt động
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-29T22:53:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 16
---

Chạy OpenClaw Gateway liên tục, luôn bật trên Raspberry Pi. Vì Pi chỉ là Gateway (các mô hình chạy trên đám mây qua API), ngay cả một Pi cấu hình khiêm tốn cũng xử lý tốt khối lượng công việc.

## Điều kiện tiên quyết

- Raspberry Pi 4 hoặc 5 với RAM từ 2 GB trở lên (khuyến nghị 4 GB)
- Thẻ MicroSD (16 GB trở lên) hoặc USB SSD (hiệu năng tốt hơn)
- Bộ nguồn Pi chính hãng
- Kết nối mạng (Ethernet hoặc WiFi)
- Raspberry Pi OS 64-bit (bắt buộc -- không dùng 32-bit)
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Ghi hệ điều hành">
    Dùng **Raspberry Pi OS Lite (64-bit)** -- không cần môi trường desktop cho máy chủ headless.

    1. Tải [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Chọn hệ điều hành: **Raspberry Pi OS Lite (64-bit)**.
    3. Trong hộp thoại cài đặt, cấu hình sẵn:
       - Tên máy chủ: `gateway-host`
       - Bật SSH
       - Đặt tên người dùng và mật khẩu
       - Cấu hình WiFi (nếu không dùng Ethernet)
    4. Ghi vào thẻ SD hoặc ổ USB, lắp vào và khởi động Pi.

  </Step>

  <Step title="Kết nối qua SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Cập nhật hệ thống">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Cài đặt Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Thêm swap (quan trọng với 2 GB trở xuống)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Chạy thiết lập ban đầu">
    ```bash
    openclaw onboard --install-daemon
    ```

    Làm theo trình hướng dẫn. Khuyến nghị dùng khóa API thay vì OAuth cho thiết bị headless. Telegram là kênh dễ nhất để bắt đầu.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Giao diện điều khiển">
    Trên máy tính của bạn, lấy URL bảng điều khiển từ Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Sau đó tạo một đường hầm SSH trong terminal khác:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Mở URL được in ra trong trình duyệt cục bộ của bạn. Để truy cập từ xa luôn bật, xem [tích hợp Tailscale](/vi/gateway/tailscale).

  </Step>
</Steps>

## Mẹo hiệu năng

**Dùng USB SSD** -- Thẻ SD chậm và dễ hao mòn. USB SSD cải thiện hiệu năng đáng kể. Xem [hướng dẫn khởi động Pi qua USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Bật bộ nhớ đệm biên dịch mô-đun** -- Tăng tốc các lần gọi CLI lặp lại trên máy chủ Pi công suất thấp hơn:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Giảm mức dùng bộ nhớ** -- Với thiết lập headless, giải phóng bộ nhớ GPU và tắt các dịch vụ không dùng:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Khắc phục sự cố

**Hết bộ nhớ** -- Xác minh swap đang hoạt động bằng `free -h`. Tắt các dịch vụ không dùng (`sudo systemctl disable cups bluetooth avahi-daemon`). Chỉ dùng các mô hình dựa trên API.

**Hiệu năng chậm** -- Dùng USB SSD thay cho thẻ SD. Kiểm tra CPU có bị giảm xung không bằng `vcgencmd get_throttled` (nên trả về `0x0`).

**Dịch vụ không khởi động** -- Kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service --no-pager -n 100` và chạy `openclaw doctor --non-interactive`. Nếu đây là Pi headless, cũng hãy xác minh lingering đã được bật: `sudo loginctl enable-linger "$(whoami)"`.

**Vấn đề tệp nhị phân ARM** -- Nếu một skill lỗi với "exec format error", hãy kiểm tra xem tệp nhị phân có bản dựng ARM64 hay không. Xác minh kiến trúc bằng `uname -m` (nên hiển thị `aarch64`).

**WiFi bị ngắt** -- Tắt quản lý nguồn WiFi: `sudo iwconfig wlan0 power off`.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Nền tảng](/vi/platforms)

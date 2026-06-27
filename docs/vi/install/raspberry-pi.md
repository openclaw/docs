---
read_when:
    - Thiết lập OpenClaw trên Raspberry Pi
    - Chạy OpenClaw trên thiết bị ARM
    - Xây dựng một AI cá nhân giá rẻ luôn hoạt động
summary: Lưu trữ OpenClaw trên Raspberry Pi để tự lưu trữ luôn hoạt động
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:38:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Chạy OpenClaw Gateway liên tục, luôn bật trên Raspberry Pi. Vì Pi chỉ là gateway (các mô hình chạy trên đám mây qua API), ngay cả một Pi cấu hình vừa phải cũng xử lý tốt khối lượng công việc — chi phí phần cứng điển hình là **$35–80 trả một lần**, không có phí hằng tháng.

## Khả năng tương thích phần cứng

| Mẫu Pi      | RAM    | Hoạt động? | Ghi chú                                  |
| ----------- | ------ | ---------- | ---------------------------------------- |
| Pi 5        | 4/8 GB | Tốt nhất   | Nhanh nhất, được khuyến nghị.            |
| Pi 4        | 4 GB   | Tốt        | Lựa chọn cân bằng cho hầu hết người dùng. |
| Pi 4        | 2 GB   | Được       | Thêm swap.                               |
| Pi 4        | 1 GB   | Hạn chế    | Có thể dùng với swap, cấu hình tối giản. |
| Pi 3B+      | 1 GB   | Chậm       | Hoạt động nhưng ì ạch.                   |
| Pi Zero 2 W | 512 MB | Không      | Không được khuyến nghị.                  |

**Tối thiểu:** RAM 1 GB, 1 lõi, 500 MB dung lượng đĩa trống, hệ điều hành 64-bit.
**Khuyến nghị:** RAM 2 GB+, thẻ SD 16 GB+ (hoặc USB SSD), Ethernet.

## Điều kiện tiên quyết

- Raspberry Pi 4 hoặc 5 với RAM 2 GB+ (khuyến nghị 4 GB)
- Thẻ MicroSD (16 GB+) hoặc USB SSD (hiệu năng tốt hơn)
- Bộ nguồn Pi chính hãng
- Kết nối mạng (Ethernet hoặc WiFi)
- Raspberry Pi OS 64-bit (bắt buộc -- không dùng bản 32-bit)
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Ghi hệ điều hành">
    Dùng **Raspberry Pi OS Lite (64-bit)** -- không cần môi trường desktop cho máy chủ headless.

    1. Tải [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Chọn hệ điều hành: **Raspberry Pi OS Lite (64-bit)**.
    3. Trong hộp thoại cài đặt, cấu hình sẵn:
       - Hostname: `gateway-host`
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

  <Step title="Chạy onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Làm theo trình hướng dẫn. API key được khuyến nghị hơn OAuth cho thiết bị headless. Telegram là kênh dễ bắt đầu nhất.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập Control UI">
    Trên máy tính của bạn, lấy URL bảng điều khiển từ Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Sau đó tạo một SSH tunnel trong một terminal khác:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Mở URL được in ra trong trình duyệt cục bộ của bạn. Để truy cập từ xa luôn bật, xem [tích hợp Tailscale](/vi/gateway/tailscale).

  </Step>
</Steps>

## Mẹo hiệu năng

**Dùng USB SSD** -- Thẻ SD chậm và dễ hao mòn. USB SSD cải thiện hiệu năng đáng kể. Xem [hướng dẫn khởi động Pi từ USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Bật bộ nhớ đệm biên dịch module** -- Tăng tốc các lần gọi CLI lặp lại trên các máy chủ Pi công suất thấp hơn:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` giữ các lần khởi động lại Gateway thường lệ trong cùng tiến trình, tránh các bước chuyển giao tiến trình bổ sung và giữ việc theo dõi PID đơn giản trên máy chủ nhỏ.

**Giảm mức sử dụng bộ nhớ** -- Với thiết lập headless, giải phóng bộ nhớ GPU và tắt các dịch vụ không dùng:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in để khởi động lại ổn định** -- Nếu Pi này chủ yếu chạy OpenClaw, hãy thêm một service drop-in:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Sau đó chạy `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Trên Pi headless, cũng bật lingering một lần để dịch vụ người dùng vẫn tồn tại sau khi đăng xuất: `sudo loginctl enable-linger "$(whoami)"`.

## Thiết lập mô hình được khuyến nghị

Vì Pi chỉ chạy gateway, hãy dùng các mô hình API được lưu trữ trên đám mây:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

Không chạy LLM cục bộ trên Pi — ngay cả mô hình nhỏ cũng quá chậm để hữu ích. Hãy để Claude hoặc GPT xử lý phần mô hình.

## Ghi chú về binary ARM

Hầu hết tính năng OpenClaw hoạt động trên ARM64 mà không cần thay đổi (Node.js, Telegram, WhatsApp/Baileys, Chromium). Các binary đôi khi thiếu bản dựng ARM thường là công cụ CLI Go/Rust tùy chọn đi kèm với skills. Hãy kiểm tra trang phát hành của binary bị thiếu để tìm artifact `linux-arm64` / `aarch64` trước khi chuyển sang tự build từ source.

## Tính bền vững và sao lưu

Trạng thái OpenClaw nằm dưới:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp, phiên.
- `~/.openclaw/workspace/` — workspace của agent (SOUL.md, bộ nhớ, artifact).

Các dữ liệu này vẫn tồn tại sau khi khởi động lại. Tạo một snapshot di động bằng:

```bash
openclaw backup create
```

Nếu bạn lưu các dữ liệu này trên SSD, cả hiệu năng lẫn tuổi thọ đều tốt hơn so với thẻ SD.

## Khắc phục sự cố

**Hết bộ nhớ** -- Xác minh swap đang hoạt động bằng `free -h`. Tắt các dịch vụ không dùng (`sudo systemctl disable cups bluetooth avahi-daemon`). Chỉ dùng các mô hình dựa trên API.

**Hiệu năng chậm** -- Dùng USB SSD thay vì thẻ SD. Kiểm tra CPU có bị throttling không bằng `vcgencmd get_throttled` (nên trả về `0x0`).

**Dịch vụ không khởi động** -- Kiểm tra log bằng `journalctl --user -u openclaw-gateway.service --no-pager -n 100` và chạy `openclaw doctor --non-interactive`. Nếu đây là Pi headless, cũng xác minh lingering đã được bật: `sudo loginctl enable-linger "$(whoami)"`.

**Sự cố binary ARM** -- Nếu một skill thất bại với lỗi "exec format error", hãy kiểm tra binary đó có bản dựng ARM64 hay không. Xác minh kiến trúc bằng `uname -m` (nên hiển thị `aarch64`).

**WiFi bị ngắt** -- Tắt quản lý năng lượng WiFi: `sudo iwconfig wlan0 power off`.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Nền tảng](/vi/platforms)

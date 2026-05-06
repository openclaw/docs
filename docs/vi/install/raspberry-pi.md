---
read_when:
    - Thiết lập OpenClaw trên Raspberry Pi
    - Chạy OpenClaw trên các thiết bị ARM
    - Xây dựng một AI cá nhân giá rẻ luôn hoạt động
summary: Chạy OpenClaw trên Raspberry Pi để tự lưu trữ luôn hoạt động
title: Raspberry Pi
x-i18n:
    generated_at: "2026-05-06T09:19:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96df076c2707b0b27751d452f15fad774356a86e96d10bce998581235776c4bc
    source_path: install/raspberry-pi.md
    workflow: 16
---

Chạy một OpenClaw Gateway bền bỉ, luôn bật trên Raspberry Pi. Vì Pi chỉ là gateway (các mô hình chạy trên đám mây qua API), ngay cả một Pi cấu hình vừa phải cũng xử lý khối lượng công việc tốt — chi phí phần cứng thường là **$35–80 một lần**, không có phí hằng tháng.

## Khả năng tương thích phần cứng

| Mẫu Pi      | RAM    | Hoạt động? | Ghi chú                                      |
| ----------- | ------ | ---------- | -------------------------------------------- |
| Pi 5        | 4/8 GB | Tốt nhất   | Nhanh nhất, được khuyến nghị.                |
| Pi 4        | 4 GB   | Tốt        | Lựa chọn cân bằng cho hầu hết người dùng.    |
| Pi 4        | 2 GB   | Được       | Thêm swap.                                   |
| Pi 4        | 1 GB   | Hạn chế    | Có thể dùng với swap, cấu hình tối thiểu.    |
| Pi 3B+      | 1 GB   | Chậm       | Hoạt động nhưng ì ạch.                       |
| Pi Zero 2 W | 512 MB | Không      | Không được khuyến nghị.                      |

**Tối thiểu:** RAM 1 GB, 1 nhân, 500 MB dung lượng đĩa trống, hệ điều hành 64-bit.
**Khuyến nghị:** RAM 2 GB trở lên, thẻ SD 16 GB trở lên (hoặc USB SSD), Ethernet.

## Điều kiện tiên quyết

- Raspberry Pi 4 hoặc 5 với RAM 2 GB trở lên (khuyến nghị 4 GB)
- Thẻ MicroSD (16 GB trở lên) hoặc USB SSD (hiệu năng tốt hơn)
- Bộ nguồn Pi chính hãng
- Kết nối mạng (Ethernet hoặc WiFi)
- Raspberry Pi OS 64-bit (bắt buộc -- không dùng 32-bit)
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Ghi hệ điều hành">
    Dùng **Raspberry Pi OS Lite (64-bit)** -- không cần desktop cho máy chủ headless.

    1. Tải [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Chọn hệ điều hành: **Raspberry Pi OS Lite (64-bit)**.
    3. Trong hộp thoại cài đặt, cấu hình sẵn:
       - Tên máy chủ: `gateway-host`
       - Bật SSH
       - Đặt tên người dùng và mật khẩu
       - Cấu hình WiFi (nếu không dùng Ethernet)
    4. Ghi vào thẻ SD hoặc ổ USB, cắm vào, rồi khởi động Pi.

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

    Làm theo trình hướng dẫn. Khóa API được khuyến nghị hơn OAuth cho thiết bị headless. Telegram là kênh dễ bắt đầu nhất.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Truy cập giao diện điều khiển">
    Trên máy tính của bạn, lấy URL bảng điều khiển từ Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Sau đó tạo một SSH tunnel trong terminal khác:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Mở URL đã in trong trình duyệt cục bộ của bạn. Để truy cập từ xa luôn bật, xem [tích hợp Tailscale](/vi/gateway/tailscale).

  </Step>
</Steps>

## Mẹo hiệu năng

**Dùng USB SSD** -- Thẻ SD chậm và dễ hao mòn. USB SSD cải thiện hiệu năng đáng kể. Xem [hướng dẫn khởi động Pi từ USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Bật cache biên dịch module** -- Tăng tốc các lần gọi CLI lặp lại trên máy chủ Pi công suất thấp hơn:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Giảm mức sử dụng bộ nhớ** -- Với thiết lập headless, giải phóng bộ nhớ GPU và tắt các dịch vụ không dùng:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in để khởi động lại ổn định** -- Nếu Pi này chủ yếu chạy OpenClaw, thêm một service drop-in:

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

Sau đó chạy `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Trên Pi headless, cũng bật lingering một lần để dịch vụ người dùng vẫn sống sau khi đăng xuất: `sudo loginctl enable-linger "$(whoami)"`.

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

Không chạy LLM cục bộ trên Pi — ngay cả các mô hình nhỏ cũng quá chậm để hữu ích. Hãy để Claude hoặc GPT xử lý phần mô hình.

## Ghi chú về binary ARM

Hầu hết tính năng OpenClaw hoạt động trên ARM64 mà không cần thay đổi (Node.js, Telegram, WhatsApp/Baileys, Chromium). Các binary đôi khi thiếu bản dựng ARM thường là các công cụ CLI Go/Rust tùy chọn được phân phối bởi Skills. Xác minh trang phát hành của binary bị thiếu để tìm artifact `linux-arm64` / `aarch64` trước khi chuyển sang build từ mã nguồn.

## Tính bền bỉ và sao lưu

Trạng thái OpenClaw nằm trong:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp, phiên.
- `~/.openclaw/workspace/` — workspace của agent (SOUL.md, bộ nhớ, artifact).

Các mục này vẫn tồn tại sau khi khởi động lại. Tạo snapshot di động bằng:

```bash
openclaw backup create
```

Nếu bạn đặt các mục này trên SSD, cả hiệu năng lẫn tuổi thọ đều cải thiện so với thẻ SD.

## Khắc phục sự cố

**Hết bộ nhớ** -- Xác minh swap đang hoạt động bằng `free -h`. Tắt các dịch vụ không dùng (`sudo systemctl disable cups bluetooth avahi-daemon`). Chỉ dùng mô hình dựa trên API.

**Hiệu năng chậm** -- Dùng USB SSD thay vì thẻ SD. Kiểm tra tình trạng giảm tốc CPU bằng `vcgencmd get_throttled` (nên trả về `0x0`).

**Dịch vụ không khởi động** -- Kiểm tra log bằng `journalctl --user -u openclaw-gateway.service --no-pager -n 100` và chạy `openclaw doctor --non-interactive`. Nếu đây là Pi headless, cũng xác minh lingering đã được bật: `sudo loginctl enable-linger "$(whoami)"`.

**Sự cố binary ARM** -- Nếu một skill lỗi với "exec format error", kiểm tra xem binary có bản dựng ARM64 không. Xác minh kiến trúc bằng `uname -m` (nên hiển thị `aarch64`).

**WiFi rớt kết nối** -- Tắt quản lý nguồn WiFi: `sudo iwconfig wlan0 power off`.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Nền tảng](/vi/platforms)

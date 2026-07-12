---
read_when:
    - Thiết lập OpenClaw trên Raspberry Pi
    - Chạy OpenClaw trên các thiết bị ARM
    - Xây dựng một AI cá nhân giá rẻ luôn hoạt động
summary: Lưu trữ OpenClaw trên Raspberry Pi để tự lưu trữ liên tục
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T08:04:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Chạy Gateway OpenClaw liên tục, luôn bật trên Raspberry Pi. Vì Pi chỉ đóng vai trò là Gateway (các mô hình chạy trên đám mây qua API), ngay cả một chiếc Pi cấu hình vừa phải cũng xử lý tốt khối lượng công việc — chi phí phần cứng thông thường là **35–80 USD trả một lần**, không có phí hằng tháng.

## Khả năng tương thích phần cứng

| Mẫu Pi      | RAM    | Hoạt động? | Ghi chú                                      |
| ----------- | ------ | ---------- | -------------------------------------------- |
| Pi 5        | 4/8 GB | Tốt nhất   | Nhanh nhất, được khuyến nghị.                 |
| Pi 4        | 4 GB   | Tốt        | Cấu hình cân bằng cho hầu hết người dùng.     |
| Pi 4        | 2 GB   | Ổn         | Thêm swap.                                   |
| Pi 4        | 1 GB   | Hạn chế    | Có thể dùng với swap và cấu hình tối giản.    |
| Pi 3B+      | 1 GB   | Chậm       | Hoạt động được nhưng phản hồi chậm.           |
| Pi Zero 2 W | 512 MB | Không      | Không được khuyến nghị.                       |

**Tối thiểu:** RAM 1 GB, 1 lõi, 500 MB dung lượng đĩa trống, hệ điều hành 64 bit.
**Khuyến nghị:** RAM từ 2 GB, thẻ SD từ 16 GB (hoặc SSD USB), Ethernet.

## Điều kiện tiên quyết

- Raspberry Pi 4 hoặc 5 với RAM từ 2 GB (khuyến nghị 4 GB)
- Thẻ MicroSD (từ 16 GB) hoặc SSD USB (hiệu năng tốt hơn)
- Bộ nguồn Pi chính hãng
- Kết nối mạng (Ethernet hoặc WiFi)
- Raspberry Pi OS 64 bit (bắt buộc — không sử dụng bản 32 bit)
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Ghi hệ điều hành">
    Sử dụng **Raspberry Pi OS Lite (64-bit)** — máy chủ không màn hình không cần môi trường máy tính để bàn.

    1. Tải xuống [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Chọn hệ điều hành: **Raspberry Pi OS Lite (64-bit)**.
    3. Trong hộp thoại cài đặt, cấu hình trước:
       - Tên máy chủ: `gateway-host`
       - Bật SSH
       - Đặt tên người dùng và mật khẩu
       - Cấu hình WiFi (nếu không sử dụng Ethernet)
    4. Ghi vào thẻ SD hoặc ổ USB, lắp vào rồi khởi động Pi.

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

    # Đặt múi giờ (quan trọng đối với cron và lời nhắc)
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

  <Step title="Thêm swap (quan trọng đối với máy có RAM từ 2 GB trở xuống)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Giảm mức sử dụng swap cho thiết bị có ít RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Chạy quy trình thiết lập ban đầu">
    ```bash
    openclaw onboard --install-daemon
    ```

    Làm theo trình hướng dẫn. Khóa API được khuyến nghị thay cho OAuth trên các thiết bị không màn hình. Telegram là kênh dễ bắt đầu nhất.

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

    Sau đó tạo đường hầm SSH trong một cửa sổ dòng lệnh khác:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Mở URL được in ra trong trình duyệt cục bộ. Để truy cập từ xa liên tục, hãy xem [tích hợp Tailscale](/vi/gateway/tailscale).

  </Step>
</Steps>

## Mẹo cải thiện hiệu năng

**Sử dụng SSD USB** — thẻ SD chậm và bị hao mòn. SSD USB cải thiện đáng kể hiệu năng và chịu được nhiều chu kỳ ghi hơn; hãy sử dụng ổ này cho `OPENCLAW_STATE_DIR` nếu bạn vẫn giữ hệ điều hành trên thẻ SD. Xem [hướng dẫn khởi động Pi qua USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Bật bộ nhớ đệm biên dịch mô-đun** — tăng tốc các lần gọi CLI lặp lại trên máy chủ Pi có công suất thấp. `OPENCLAW_NO_RESPAWN=1` giữ các lần khởi động lại Gateway thông thường trong cùng tiến trình, tránh việc chuyển giao giữa các tiến trình và giúp việc theo dõi PID đơn giản hơn trên các máy chủ nhỏ:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Sử dụng `/var/tmp`, không dùng `/tmp` — một số bản phân phối xóa `/tmp` khi khởi động, khiến bộ nhớ đệm đã được làm nóng bị mất.

**Giảm mức sử dụng bộ nhớ** — đối với cấu hình không màn hình, hãy giải phóng bộ nhớ GPU và tắt các dịch vụ không sử dụng:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Cấu hình bổ sung systemd để khởi động lại ổn định** — nếu Pi này chủ yếu chạy OpenClaw, hãy thêm cấu hình bổ sung cho dịch vụ:

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

Sau đó chạy `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Trên Pi không màn hình, cũng cần bật chế độ duy trì một lần để dịch vụ người dùng tiếp tục chạy sau khi đăng xuất: `sudo loginctl enable-linger "$(whoami)"`.

## Thiết lập mô hình được khuyến nghị

Vì Pi chỉ chạy Gateway, hãy sử dụng các mô hình API được lưu trữ trên đám mây — không chạy LLM cục bộ trên Pi, vì ngay cả các mô hình nhỏ cũng quá chậm để sử dụng hiệu quả:

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

## Lưu ý về tệp nhị phân ARM

Hầu hết tính năng của OpenClaw hoạt động trên ARM64 mà không cần thay đổi (Node.js, Telegram, WhatsApp/Baileys, Chromium). Các tệp nhị phân đôi khi không có bản dựng ARM thường là những công cụ CLI Go/Rust tùy chọn được cung cấp bởi Skills. Xác minh kiến trúc bằng `uname -m` (kết quả phải là `aarch64`), sau đó kiểm tra trang phát hành của tệp nhị phân còn thiếu để tìm các bản dựng `linux-arm64` / `aarch64` trước khi chuyển sang tự xây dựng từ mã nguồn.

## Duy trì dữ liệu và sao lưu

Trạng thái OpenClaw được lưu tại:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` cho từng tác nhân, trạng thái kênh/nhà cung cấp và các phiên.
- `~/.openclaw/workspace/` — không gian làm việc của tác nhân (SOUL.md, bộ nhớ, hiện vật).

Dữ liệu này vẫn tồn tại sau khi khởi động lại và việc sử dụng SSD thay cho thẻ SD giúp cải thiện cả hiệu năng lẫn tuổi thọ. Tạo một bản chụp nhanh có thể di chuyển bằng:

```bash
openclaw backup create
```

## Khắc phục sự cố

**Hết bộ nhớ** — xác minh swap đang hoạt động bằng `free -h`. Tắt các dịch vụ không sử dụng (`sudo systemctl disable cups bluetooth avahi-daemon`). Chỉ sử dụng các mô hình dựa trên API.

**Hiệu năng chậm** — sử dụng SSD USB thay cho thẻ SD. Kiểm tra hiện tượng giảm xung CPU bằng `vcgencmd get_throttled` (kết quả phải là `0x0`).

**Dịch vụ không khởi động** — kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service --no-pager -n 100` và chạy `openclaw doctor --non-interactive`. Nếu đây là Pi không màn hình, cũng cần xác minh chế độ duy trì đã được bật: `sudo loginctl enable-linger "$(whoami)"`.

**Sự cố tệp nhị phân ARM** — nếu một skill gặp lỗi "exec format error", hãy kiểm tra xem tệp nhị phân có bản dựng ARM64 hay không. Xác minh kiến trúc bằng `uname -m` (kết quả phải là `aarch64`).

**WiFi bị ngắt kết nối** — tắt tính năng quản lý điện năng WiFi: `sudo iwconfig wlan0 power off`.

## Các bước tiếp theo

- [Kênh](/vi/channels) — kết nối Telegram, WhatsApp, Discord và nhiều dịch vụ khác
- [Cấu hình Gateway](/vi/gateway/configuration) — tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) — luôn sử dụng phiên bản OpenClaw mới nhất

## Liên quan

- [Tổng quan về cài đặt](/vi/install)
- [Máy chủ Linux](/vi/vps)
- [Nền tảng](/vi/platforms)

---
read_when:
    - Thiết lập OpenClaw trên Raspberry Pi
    - Chạy OpenClaw trên thiết bị ARM
    - Xây dựng một AI cá nhân giá rẻ, luôn hoạt động
summary: OpenClaw trên Raspberry Pi (thiết lập tự lưu trữ chi phí thấp)
title: Raspberry Pi (nền tảng)
x-i18n:
    generated_at: "2026-04-29T22:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw trên Raspberry Pi

## Mục tiêu

Chạy OpenClaw Gateway bền bỉ, luôn bật trên Raspberry Pi với chi phí một lần **~$35-80** (không có phí hằng tháng).

Phù hợp cho:

- Trợ lý AI cá nhân 24/7
- Trung tâm tự động hóa nhà
- Bot Telegram/WhatsApp tiêu thụ ít điện, luôn sẵn sàng

## Yêu cầu phần cứng

| Mẫu Pi          | RAM     | Hoạt động? | Ghi chú                            |
| --------------- | ------- | ---------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Tốt nhất | Nhanh nhất, được khuyến nghị       |
| **Pi 4**        | 4GB     | ✅ Tốt     | Lựa chọn cân bằng cho đa số người dùng |
| **Pi 4**        | 2GB     | ✅ OK      | Hoạt động, thêm swap               |
| **Pi 4**        | 1GB     | ⚠️ Chật    | Có thể dùng với swap, cấu hình tối giản |
| **Pi 3B+**      | 1GB     | ⚠️ Chậm    | Hoạt động nhưng ì ạch              |
| **Pi Zero 2 W** | 512MB   | ❌         | Không khuyến nghị                  |

**Cấu hình tối thiểu:** 1GB RAM, 1 lõi, 500MB đĩa  
**Khuyến nghị:** RAM 2GB+, HĐH 64-bit, thẻ SD 16GB+ (hoặc USB SSD)

## Bạn cần gì

- Raspberry Pi 4 hoặc 5 (khuyến nghị 2GB+)
- Thẻ MicroSD (16GB+) hoặc USB SSD (hiệu năng tốt hơn)
- Bộ nguồn (khuyến nghị PSU chính hãng của Pi)
- Kết nối mạng (Ethernet hoặc WiFi)
- ~30 phút

## 1) Ghi HĐH

Dùng **Raspberry Pi OS Lite (64-bit)** — không cần desktop cho máy chủ headless.

1. Tải [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Chọn HĐH: **Raspberry Pi OS Lite (64-bit)**
3. Nhấp biểu tượng bánh răng (⚙️) để cấu hình trước:
   - Đặt hostname: `gateway-host`
   - Bật SSH
   - Đặt tên người dùng/mật khẩu
   - Cấu hình WiFi (nếu không dùng Ethernet)
4. Ghi vào thẻ SD / ổ USB
5. Cắm vào và khởi động Pi

## 2) Kết nối qua SSH

```bash
ssh user@gateway-host
# hoặc dùng địa chỉ IP
ssh user@192.168.x.x
```

## 3) Thiết lập hệ thống

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài các gói thiết yếu
sudo apt install -y git curl build-essential

# Đặt múi giờ (quan trọng cho cron/nhắc nhở)
sudo timedatectl set-timezone America/Chicago  # Đổi thành múi giờ của bạn
```

## 4) Cài Node.js 24 (ARM64)

```bash
# Cài Node.js qua NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Xác minh
node --version  # Nên hiển thị v24.x.x
npm --version
```

## 5) Thêm swap (quan trọng với 2GB trở xuống)

Swap giúp tránh sự cố sập do hết bộ nhớ:

```bash
# Tạo tệp swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Thiết lập vĩnh viễn
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Tối ưu cho RAM thấp (giảm swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Cài OpenClaw

### Tùy chọn A: cài đặt tiêu chuẩn (khuyến nghị)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Tùy chọn B: cài đặt có thể chỉnh sửa (để mày mò)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

Bản cài đặt có thể chỉnh sửa cho bạn quyền truy cập trực tiếp vào nhật ký và mã — hữu ích khi gỡ lỗi các vấn đề riêng của ARM.

## 7) Chạy Onboarding

```bash
openclaw onboard --install-daemon
```

Làm theo trình hướng dẫn:

1. **Chế độ Gateway:** Cục bộ
2. **Xác thực:** Khuyến nghị API keys (OAuth có thể khó ổn định trên Pi headless)
3. **Kênh:** Telegram là lựa chọn dễ nhất để bắt đầu
4. **Daemon:** Có (systemd)

## 8) Xác minh cài đặt

```bash
# Kiểm tra trạng thái
openclaw status

# Kiểm tra dịch vụ (cài đặt tiêu chuẩn = systemd user unit)
systemctl --user status openclaw-gateway.service

# Xem nhật ký
journalctl --user -u openclaw-gateway.service -f
```

## 9) Truy cập OpenClaw Dashboard

Thay `user@gateway-host` bằng tên người dùng Pi và hostname hoặc địa chỉ IP của bạn.

Trên máy tính của bạn, yêu cầu Pi in URL dashboard mới:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Lệnh sẽ in `Dashboard URL:`. Tùy vào cách cấu hình `gateway.auth.token`,
URL có thể là liên kết `http://127.0.0.1:18789/` thuần hoặc một liên kết
bao gồm `#token=...`.

Trong một terminal khác trên máy tính của bạn, tạo đường hầm SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Sau đó mở Dashboard URL đã in trong trình duyệt cục bộ của bạn.

Nếu giao diện yêu cầu xác thực shared-secret, hãy dán token hoặc mật khẩu đã cấu hình
vào cài đặt Control UI. Với xác thực token, dùng `gateway.auth.token` (hoặc
`OPENCLAW_GATEWAY_TOKEN`).

Để truy cập từ xa luôn bật, xem [Tailscale](/vi/gateway/tailscale).

---

## Tối ưu hiệu năng

### Dùng USB SSD (cải thiện rất lớn)

Thẻ SD chậm và nhanh hao mòn. USB SSD cải thiện hiệu năng đáng kể:

```bash
# Kiểm tra có đang khởi động từ USB không
lsblk
```

Xem [hướng dẫn khởi động Pi từ USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) để thiết lập.

### Tăng tốc khởi động CLI (bộ đệm biên dịch module)

Trên các máy Pi công suất thấp hơn, bật bộ đệm biên dịch module của Node để các lần chạy CLI lặp lại nhanh hơn:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Ghi chú:

- `NODE_COMPILE_CACHE` tăng tốc các lần chạy sau (`status`, `health`, `--help`).
- `/var/tmp` tồn tại qua các lần khởi động lại tốt hơn `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` tránh chi phí khởi động bổ sung từ cơ chế tự respawn của CLI.
- Lần chạy đầu làm nóng bộ đệm; các lần chạy sau hưởng lợi nhiều nhất.

### Tinh chỉnh khởi động systemd (tùy chọn)

Nếu Pi này chủ yếu chạy OpenClaw, hãy thêm service drop-in để giảm độ dao động khi khởi động lại
và giữ môi trường khởi động ổn định:

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

Sau đó áp dụng:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Nếu có thể, đặt trạng thái/bộ đệm của OpenClaw trên lưu trữ dựa trên SSD để tránh
nút thắt I/O ngẫu nhiên của thẻ SD khi khởi động lạnh.

Nếu đây là Pi headless, bật lingering một lần để dịch vụ người dùng vẫn sống sau khi
đăng xuất:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Cách các chính sách `Restart=` giúp khôi phục tự động:
[systemd có thể tự động hóa khôi phục dịch vụ](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Giảm mức dùng bộ nhớ

```bash
# Tắt cấp phát bộ nhớ GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Tắt Bluetooth nếu không cần
sudo systemctl disable bluetooth
```

### Giám sát tài nguyên

```bash
# Kiểm tra bộ nhớ
free -h

# Kiểm tra nhiệt độ CPU
vcgencmd measure_temp

# Giám sát trực tiếp
htop
```

---

## Ghi chú riêng cho ARM

### Tương thích nhị phân

Hầu hết tính năng OpenClaw hoạt động trên ARM64, nhưng một số binary bên ngoài có thể cần bản dựng ARM:

| Công cụ            | Trạng thái ARM64 | Ghi chú                             |
| ------------------ | ---------------- | ----------------------------------- |
| Node.js            | ✅               | Hoạt động rất tốt                   |
| WhatsApp (Baileys) | ✅               | JS thuần, không có vấn đề           |
| Telegram           | ✅               | JS thuần, không có vấn đề           |
| gog (Gmail CLI)    | ⚠️               | Kiểm tra bản phát hành ARM          |
| Chromium (trình duyệt) | ✅           | `sudo apt install chromium-browser` |

Nếu một skill thất bại, hãy kiểm tra xem binary của nó có bản dựng ARM không. Nhiều công cụ Go/Rust có; một số thì không.

### 32-bit so với 64-bit

**Luôn dùng HĐH 64-bit.** Node.js và nhiều công cụ hiện đại yêu cầu điều đó. Kiểm tra bằng:

```bash
uname -m
# Nên hiển thị: aarch64 (64-bit) không phải armv7l (32-bit)
```

---

## Thiết lập mô hình được khuyến nghị

Vì Pi chỉ là Gateway (mô hình chạy trên đám mây), hãy dùng các mô hình dựa trên API:

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

**Đừng cố chạy LLM cục bộ trên Pi** — ngay cả mô hình nhỏ cũng quá chậm. Hãy để Claude/GPT xử lý phần nặng.

---

## Tự động khởi động khi bật máy

Onboarding thiết lập phần này, nhưng để xác minh:

```bash
# Kiểm tra dịch vụ đã được bật chưa
systemctl --user is-enabled openclaw-gateway.service

# Bật nếu chưa
systemctl --user enable openclaw-gateway.service

# Khởi động khi bật máy
systemctl --user start openclaw-gateway.service
```

---

## Khắc phục sự cố

### Hết bộ nhớ (OOM)

```bash
# Kiểm tra bộ nhớ
free -h

# Thêm swap (xem Bước 5)
# Hoặc giảm số dịch vụ đang chạy trên Pi
```

### Hiệu năng chậm

- Dùng USB SSD thay vì thẻ SD
- Tắt các dịch vụ không dùng: `sudo systemctl disable cups bluetooth avahi-daemon`
- Kiểm tra CPU bị throttling: `vcgencmd get_throttled` (nên trả về `0x0`)

### Dịch vụ không khởi động

```bash
# Kiểm tra nhật ký
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Cách sửa phổ biến: build lại
cd ~/openclaw  # nếu dùng bản cài đặt có thể chỉnh sửa
npm run build
systemctl --user restart openclaw-gateway.service
```

### Vấn đề binary ARM

Nếu một skill thất bại với "exec format error":

1. Kiểm tra binary có bản dựng ARM64 không
2. Thử build từ source
3. Hoặc dùng Docker container có hỗ trợ ARM

### WiFi bị rớt

Với Pi headless dùng WiFi:

```bash
# Tắt quản lý năng lượng WiFi
sudo iwconfig wlan0 power off

# Thiết lập vĩnh viễn
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## So sánh chi phí

| Thiết lập      | Chi phí một lần | Chi phí hằng tháng | Ghi chú                  |
| -------------- | --------------- | ------------------ | ------------------------ |
| **Pi 4 (2GB)** | ~$45            | $0                 | + điện (~$5/năm)         |
| **Pi 4 (4GB)** | ~$55            | $0                 | Khuyến nghị              |
| **Pi 5 (4GB)** | ~$60            | $0                 | Hiệu năng tốt nhất       |
| **Pi 5 (8GB)** | ~$80            | $0                 | Dư thừa nhưng bền cho tương lai |
| DigitalOcean   | $0              | $6/tháng           | $72/năm                  |
| Hetzner        | $0              | €3.79/tháng        | ~$50/năm                 |

**Điểm hòa vốn:** Một Pi tự hoàn vốn trong ~6-12 tháng so với VPS đám mây.

---

## Liên quan

- [Hướng dẫn Linux](/vi/platforms/linux) — thiết lập Linux tổng quát
- [Hướng dẫn DigitalOcean](/vi/install/digitalocean) — lựa chọn thay thế trên đám mây
- [Hướng dẫn Hetzner](/vi/install/hetzner) — thiết lập Docker
- [Tailscale](/vi/gateway/tailscale) — truy cập từ xa
- [Nodes](/vi/nodes) — ghép nối laptop/điện thoại của bạn với Pi gateway

---
read_when:
    - Thiết lập OpenClaw trên DigitalOcean
    - Tìm dịch vụ lưu trữ VPS giá rẻ cho OpenClaw
summary: OpenClaw trên DigitalOcean (tùy chọn VPS trả phí đơn giản)
title: DigitalOcean (nền tảng)
x-i18n:
    generated_at: "2026-04-29T22:55:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw trên DigitalOcean

## Mục tiêu

Chạy một OpenClaw Gateway bền vững trên DigitalOcean với giá **$6/tháng** (hoặc $4/tháng với giá đặt trước).

Nếu bạn muốn một tùy chọn $0/tháng và không ngại ARM + thiết lập riêng theo nhà cung cấp, hãy xem [hướng dẫn Oracle Cloud](/vi/install/oracle).

## So sánh chi phí (2026)

| Nhà cung cấp | Gói | Thông số | Giá/tháng | Ghi chú |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | tối đa 4 OCPU, RAM 24GB | $0 | ARM, dung lượng hạn chế / một số điểm khó khi đăng ký |
| Hetzner | CX22 | 2 vCPU, RAM 4GB | €3.79 (~$4) | Tùy chọn trả phí rẻ nhất |
| DigitalOcean | Basic | 1 vCPU, RAM 1GB | $6 | UI dễ dùng, tài liệu tốt |
| Vultr | Cloud Compute | 1 vCPU, RAM 1GB | $6 | Nhiều vị trí |
| Linode | Nanode | 1 vCPU, RAM 1GB | $5 | Hiện là một phần của Akamai |

**Chọn nhà cung cấp:**

- DigitalOcean: UX đơn giản nhất + thiết lập dễ dự đoán (hướng dẫn này)
- Hetzner: giá/hiệu năng tốt (xem [hướng dẫn Hetzner](/vi/install/hetzner))
- Oracle Cloud: có thể là $0/tháng, nhưng khó thiết lập hơn và chỉ ARM (xem [hướng dẫn Oracle](/vi/install/oracle))

---

## Điều kiện tiên quyết

- Tài khoản DigitalOcean ([đăng ký với $200 tín dụng miễn phí](https://m.do.co/c/signup))
- Cặp khóa SSH (hoặc sẵn sàng dùng xác thực bằng mật khẩu)
- ~20 phút

## 1) Tạo một Droplet

<Warning>
Dùng ảnh nền sạch (Ubuntu 24.04 LTS). Tránh ảnh 1-click Marketplace của bên thứ ba trừ khi bạn đã xem lại các script khởi động và mặc định tường lửa của chúng.
</Warning>

1. Đăng nhập vào [DigitalOcean](https://cloud.digitalocean.com/)
2. Nhấp **Create → Droplets**
3. Chọn:
   - **Khu vực:** Gần bạn nhất (hoặc gần người dùng của bạn)
   - **Ảnh:** Ubuntu 24.04 LTS
   - **Kích cỡ:** Basic → Regular → **$6/tháng** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Xác thực:** Khóa SSH (khuyến nghị) hoặc mật khẩu
4. Nhấp **Create Droplet**
5. Ghi lại địa chỉ IP

## 2) Kết nối qua SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Cài đặt OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Chạy onboarding

```bash
openclaw onboard --install-daemon
```

Trình hướng dẫn sẽ dẫn bạn qua:

- Xác thực mô hình (API key hoặc OAuth)
- Thiết lập kênh (Telegram, WhatsApp, Discord, v.v.)
- Token Gateway (tự động tạo)
- Cài đặt daemon (systemd)

## 5) Xác minh Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Truy cập Dashboard

Gateway mặc định bind vào loopback. Để truy cập Control UI:

**Tùy chọn A: SSH Tunnel (khuyến nghị)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Tùy chọn B: Tailscale Serve (HTTPS, chỉ loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Mở: `https://<magicdns>/`

Ghi chú:

- Serve giữ Gateway chỉ dùng loopback và xác thực lưu lượng Control UI/WebSocket qua header danh tính Tailscale (xác thực không dùng token giả định host Gateway đáng tin cậy; HTTP API không dùng các header Tailscale đó mà tuân theo chế độ xác thực HTTP bình thường của gateway).
- Để yêu cầu thông tin xác thực shared-secret rõ ràng thay thế, đặt `gateway.auth.allowTailscale: false` và dùng `gateway.auth.mode: "token"` hoặc `"password"`.

**Tùy chọn C: Bind Tailnet (không dùng Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Mở: `http://<tailscale-ip>:18789` (yêu cầu token).

## 7) Kết nối các kênh của bạn

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Xem [Kênh](/vi/channels) để biết các nhà cung cấp khác.

---

## Tối ưu hóa cho RAM 1GB

Droplet $6 chỉ có RAM 1GB. Để mọi thứ chạy trơn tru:

### Thêm swap (khuyến nghị)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Dùng mô hình nhẹ hơn

Nếu bạn gặp OOM, hãy cân nhắc:

- Dùng các mô hình dựa trên API (Claude, GPT) thay vì mô hình cục bộ
- Đặt `agents.defaults.model.primary` thành một mô hình nhỏ hơn

### Giám sát bộ nhớ

```bash
free -h
htop
```

---

## Tính bền vững

Toàn bộ trạng thái nằm trong:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp, và dữ liệu phiên
- `~/.openclaw/workspace/` — workspace (SOUL.md, bộ nhớ, v.v.)

Các dữ liệu này vẫn tồn tại sau khi khởi động lại. Hãy sao lưu định kỳ:

```bash
openclaw backup create
```

---

## Phương án miễn phí Oracle Cloud

Oracle Cloud cung cấp các instance ARM **Always Free** mạnh hơn đáng kể so với mọi tùy chọn trả phí ở đây — với giá $0/tháng.

| Bạn nhận được | Thông số |
| ----------------- | ---------------------- |
| **4 OCPU** | ARM Ampere A1 |
| **RAM 24GB** | Dư sức dùng |
| **Dung lượng lưu trữ 200GB** | Block volume |
| **Miễn phí mãi mãi** | Không tính phí thẻ tín dụng |

**Lưu ý:**

- Đăng ký có thể khó (thử lại nếu thất bại)
- Kiến trúc ARM — hầu hết mọi thứ đều hoạt động, nhưng một số binary cần bản build ARM

Để xem hướng dẫn thiết lập đầy đủ, xem [Oracle Cloud](/vi/install/oracle). Để biết mẹo đăng ký và khắc phục sự cố quy trình ghi danh, xem [hướng dẫn cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) này.

---

## Khắc phục sự cố

### Gateway không khởi động

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Cổng đã được sử dụng

```bash
lsof -i :18789
kill <PID>
```

### Hết bộ nhớ

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Liên quan

- [Hướng dẫn Hetzner](/vi/install/hetzner) — rẻ hơn, mạnh hơn
- [Cài đặt Docker](/vi/install/docker) — thiết lập dạng container
- [Tailscale](/vi/gateway/tailscale) — truy cập từ xa an toàn
- [Cấu hình](/vi/gateway/configuration) — tham chiếu cấu hình đầy đủ

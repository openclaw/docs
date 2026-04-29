---
read_when:
    - Thiết lập OpenClaw trên Oracle Cloud
    - Tìm dịch vụ lưu trữ VPS chi phí thấp cho OpenClaw
    - Muốn chạy OpenClaw 24/7 trên một máy chủ nhỏ
summary: OpenClaw trên Oracle Cloud (ARM Luôn miễn phí)
title: Oracle Cloud (nền tảng)
x-i18n:
    generated_at: "2026-04-29T22:58:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw trên Oracle Cloud (OCI)

## Mục tiêu

Chạy một OpenClaw Gateway bền vững trên tầng ARM **Always Free** của Oracle Cloud.

Tầng miễn phí của Oracle có thể rất phù hợp với OpenClaw (đặc biệt nếu bạn đã có tài khoản OCI), nhưng đi kèm một số đánh đổi:

- Kiến trúc ARM (hầu hết mọi thứ hoạt động, nhưng một số binary có thể chỉ hỗ trợ x86)
- Dung lượng và quá trình đăng ký có thể hơi thất thường

## So sánh chi phí (2026)

| Nhà cung cấp | Gói             | Cấu hình               | Giá/tháng | Ghi chú                     |
| ------------ | --------------- | ---------------------- | --------- | --------------------------- |
| Oracle Cloud | Always Free ARM | tối đa 4 OCPU, RAM 24GB | $0        | ARM, dung lượng hạn chế     |
| Hetzner      | CX22            | 2 vCPU, RAM 4GB        | ~ $4      | Tùy chọn trả phí rẻ nhất    |
| DigitalOcean | Basic           | 1 vCPU, RAM 1GB        | $6        | UI dễ dùng, tài liệu tốt    |
| Vultr        | Cloud Compute   | 1 vCPU, RAM 1GB        | $6        | Nhiều vị trí                |
| Linode       | Nanode          | 1 vCPU, RAM 1GB        | $5        | Hiện là một phần của Akamai |

---

## Điều kiện tiên quyết

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) — xem [hướng dẫn đăng ký của cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu bạn gặp sự cố
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- ~30 phút

## 1) Tạo một phiên bản OCI

1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/)
2. Điều hướng tới **Compute → Instances → Create Instance**
3. Cấu hình:
   - **Tên:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2 (hoặc tối đa 4)
   - **Bộ nhớ:** 12 GB (hoặc tối đa 24 GB)
   - **Boot volume:** 50 GB (tối đa 200 GB miễn phí)
   - **Khóa SSH:** Thêm khóa công khai của bạn
4. Nhấp **Create**
5. Ghi lại địa chỉ IP công khai

**Mẹo:** Nếu tạo phiên bản thất bại với thông báo "Out of capacity", hãy thử một availability domain khác hoặc thử lại sau. Dung lượng tầng miễn phí có giới hạn.

## 2) Kết nối và cập nhật

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Lưu ý:** `build-essential` là bắt buộc để biên dịch ARM cho một số dependency.

## 3) Cấu hình người dùng và hostname

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Cài đặt Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Thao tác này bật Tailscale SSH, để bạn có thể kết nối qua `ssh openclaw` từ bất kỳ thiết bị nào trên tailnet của bạn — không cần IP công khai.

Xác minh:

```bash
tailscale status
```

**Từ giờ trở đi, hãy kết nối qua Tailscale:** `ssh ubuntu@openclaw` (hoặc dùng IP Tailscale).

## 5) Cài đặt OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Khi được hỏi "How do you want to hatch your bot?", chọn **"Do this later"**.

> Lưu ý: Nếu gặp sự cố build native trên ARM, hãy bắt đầu với các gói hệ thống (ví dụ `sudo apt install -y build-essential`) trước khi dùng Homebrew.

## 6) Cấu hình Gateway (loopback + xác thực token) và bật Tailscale Serve

Dùng xác thực token làm mặc định. Cách này dễ dự đoán và tránh cần bất kỳ cờ UI Điều khiển “xác thực không an toàn” nào.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` ở đây chỉ dành cho xử lý forwarded-IP/local-client của proxy Tailscale Serve cục bộ. Nó **không** phải là `gateway.auth.mode: "trusted-proxy"`. Các route trình xem diff giữ hành vi fail-closed trong thiết lập này: yêu cầu trình xem raw `127.0.0.1` không có header proxy được chuyển tiếp có thể trả về `Diff not found`. Dùng `mode=file` / `mode=both` cho tệp đính kèm, hoặc chủ ý bật trình xem từ xa và đặt `plugins.entries.diffs.config.viewerBaseUrl` (hoặc truyền `baseUrl` của proxy) nếu bạn cần liên kết trình xem có thể chia sẻ.

## 7) Xác minh

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Khóa bảo mật VCN

Khi mọi thứ đã hoạt động, hãy khóa VCN để chặn toàn bộ lưu lượng ngoại trừ Tailscale. Virtual Cloud Network của OCI hoạt động như một tường lửa ở rìa mạng — lưu lượng bị chặn trước khi tới phiên bản của bạn.

1. Vào **Networking → Virtual Cloud Networks** trong OCI Console
2. Nhấp VCN của bạn → **Security Lists** → Default Security List
3. **Gỡ bỏ** tất cả quy tắc ingress ngoại trừ:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Giữ các quy tắc egress mặc định (cho phép toàn bộ outbound)

Thao tác này chặn SSH trên cổng 22, HTTP, HTTPS và mọi thứ khác ở rìa mạng. Từ giờ trở đi, bạn chỉ có thể kết nối qua Tailscale.

---

## Truy cập UI Điều khiển

Từ bất kỳ thiết bị nào trên mạng Tailscale của bạn:

```
https://openclaw.<tailnet-name>.ts.net/
```

Thay `<tailnet-name>` bằng tên tailnet của bạn (hiển thị trong `tailscale status`).

Không cần SSH tunnel. Tailscale cung cấp:

- Mã hóa HTTPS (chứng chỉ tự động)
- Xác thực qua danh tính Tailscale
- Truy cập từ bất kỳ thiết bị nào trên tailnet của bạn (laptop, điện thoại, v.v.)

---

## Bảo mật: VCN + Tailscale (baseline khuyến nghị)

Với VCN đã khóa (chỉ mở UDP 41641) và Gateway bind vào loopback, bạn có được phòng thủ nhiều lớp mạnh: lưu lượng công khai bị chặn ở rìa mạng, còn quyền truy cập quản trị diễn ra qua tailnet của bạn.

Thiết lập này thường loại bỏ _nhu cầu_ thêm các quy tắc tường lửa trên host chỉ để ngăn brute force SSH từ toàn Internet — nhưng bạn vẫn nên cập nhật OS, chạy `openclaw security audit`, và xác minh rằng bạn không vô tình lắng nghe trên các interface công khai.

### Đã được bảo vệ

| Bước truyền thống       | Cần không?      | Lý do                                                                 |
| ----------------------- | --------------- | --------------------------------------------------------------------- |
| Tường lửa UFW           | Không           | VCN chặn trước khi lưu lượng tới phiên bản                            |
| fail2ban                | Không           | Không có brute force nếu cổng 22 bị chặn ở VCN                        |
| Gia cố sshd             | Không           | Tailscale SSH không dùng sshd                                         |
| Tắt đăng nhập root      | Không           | Tailscale dùng danh tính Tailscale, không dùng người dùng hệ thống    |
| Xác thực chỉ bằng khóa SSH | Không        | Tailscale xác thực qua tailnet của bạn                                |
| Gia cố IPv6             | Thường không    | Phụ thuộc vào cài đặt VCN/subnet của bạn; hãy xác minh những gì thực sự được gán/phơi bày |

### Vẫn được khuyến nghị

- **Quyền credential:** `chmod 700 ~/.openclaw`
- **Kiểm tra bảo mật:** `openclaw security audit`
- **Cập nhật hệ thống:** `sudo apt update && sudo apt upgrade` định kỳ
- **Giám sát Tailscale:** Xem lại thiết bị trong [bảng quản trị Tailscale](https://login.tailscale.com/admin)

### Xác minh tư thế bảo mật

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Dự phòng: SSH Tunnel

Nếu Tailscale Serve không hoạt động, hãy dùng SSH tunnel:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

---

## Khắc phục sự cố

### Tạo phiên bản thất bại ("Out of capacity")

Các phiên bản ARM tầng miễn phí rất phổ biến. Hãy thử:

- Availability domain khác
- Thử lại trong giờ thấp điểm (sáng sớm)
- Dùng bộ lọc "Always Free" khi chọn shape

### Tailscale không kết nối

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway không khởi động

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Không truy cập được UI Điều khiển

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Sự cố binary ARM

Một số công cụ có thể không có bản build ARM. Kiểm tra:

```bash
uname -m  # Should show aarch64
```

Hầu hết gói npm hoạt động tốt. Với binary, hãy tìm bản phát hành `linux-arm64` hoặc `aarch64`.

---

## Tính bền vững

Toàn bộ trạng thái nằm trong:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` cho từng agent, trạng thái channel/provider, và dữ liệu phiên
- `~/.openclaw/workspace/` — workspace (SOUL.md, bộ nhớ, artifact)

Sao lưu định kỳ:

```bash
openclaw backup create
```

---

## Liên quan

- [Truy cập Gateway từ xa](/vi/gateway/remote) — các mẫu truy cập từ xa khác
- [Tích hợp Tailscale](/vi/gateway/tailscale) — tài liệu Tailscale đầy đủ
- [Cấu hình Gateway](/vi/gateway/configuration) — toàn bộ tùy chọn cấu hình
- [Hướng dẫn DigitalOcean](/vi/install/digitalocean) — nếu bạn muốn trả phí + đăng ký dễ hơn
- [Hướng dẫn Hetzner](/vi/install/hetzner) — phương án thay thế dựa trên Docker

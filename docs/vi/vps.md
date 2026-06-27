---
read_when:
    - Bạn muốn chạy Gateway trên máy chủ Linux hoặc VPS đám mây
    - Bạn cần một bản đồ nhanh về các hướng dẫn hosting
    - Bạn muốn tinh chỉnh máy chủ Linux chung cho OpenClaw
sidebarTitle: Linux Server
summary: Chạy OpenClaw trên máy chủ Linux hoặc VPS đám mây — bộ chọn nhà cung cấp, kiến trúc và tinh chỉnh
title: Máy chủ Linux
x-i18n:
    generated_at: "2026-06-27T18:20:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Chạy OpenClaw Gateway trên bất kỳ máy chủ Linux hoặc VPS đám mây nào. Trang này giúp bạn
chọn nhà cung cấp, giải thích cách hoạt động của triển khai đám mây và bao quát phần tinh chỉnh Linux
chung áp dụng ở mọi nơi.

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Railway" href="/vi/install/railway">Thiết lập một cú nhấp trong trình duyệt</Card>
  <Card title="Northflank" href="/vi/install/northflank">Thiết lập một cú nhấp trong trình duyệt</Card>
  <Card title="DigitalOcean" href="/vi/install/digitalocean">VPS trả phí đơn giản</Card>
  <Card title="Oracle Cloud" href="/vi/install/oracle">Bậc ARM Always Free</Card>
  <Card title="Fly.io" href="/vi/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/vi/install/hetzner">Docker trên Hetzner VPS</Card>
  <Card title="Hostinger" href="/vi/install/hostinger">VPS với thiết lập một cú nhấp</Card>
  <Card title="GCP" href="/vi/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/vi/install/azure">Máy ảo Linux</Card>
  <Card title="exe.dev" href="/vi/install/exe-dev">Máy ảo với proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/vi/install/raspberry-pi">Tự host trên ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** cũng hoạt động tốt.
Có video hướng dẫn từ cộng đồng tại
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(tài nguyên cộng đồng -- có thể không còn khả dụng).

## Cách thiết lập đám mây hoạt động

- **Gateway chạy trên VPS** và sở hữu trạng thái + workspace.
- Bạn kết nối từ laptop hoặc điện thoại qua **Control UI** hoặc **Tailscale/SSH**.
- Hãy xem VPS là nguồn sự thật và **sao lưu** trạng thái + workspace thường xuyên.
- Mặc định an toàn: giữ Gateway trên loopback và truy cập qua SSH tunnel hoặc Tailscale Serve.
  Nếu bạn bind tới `lan` hoặc `tailnet`, hãy yêu cầu `gateway.auth.token` hoặc `gateway.auth.password`.

Các trang liên quan: [Truy cập Gateway từ xa](/vi/gateway/remote), [Trung tâm nền tảng](/vi/platforms).

## Tăng cường bảo mật quyền truy cập quản trị trước

Trước khi cài đặt OpenClaw trên VPS công khai, hãy quyết định cách bạn muốn quản trị
chính máy đó.

- Nếu bạn muốn quyền truy cập quản trị chỉ qua tailnet, hãy cài Tailscale trước, tham gia VPS
  vào tailnet của bạn, xác minh phiên SSH thứ hai qua IP Tailscale hoặc
  tên MagicDNS, rồi hạn chế SSH công khai.
- Nếu bạn không dùng Tailscale, hãy áp dụng biện pháp tăng cường bảo mật tương đương cho đường dẫn SSH
  trước khi mở thêm dịch vụ.
- Việc này tách biệt với quyền truy cập Gateway. Bạn vẫn có thể giữ OpenClaw bind vào
  loopback và dùng SSH tunnel hoặc Tailscale Serve cho dashboard.

Các tùy chọn Gateway dành riêng cho Tailscale nằm trong [Tailscale](/vi/gateway/tailscale).

## Agent công ty dùng chung trên VPS

Chạy một agent duy nhất cho một nhóm là thiết lập hợp lệ khi mọi người dùng nằm trong cùng ranh giới tin cậy và agent chỉ dùng cho công việc.

- Giữ nó trên runtime chuyên dụng (VPS/VM/container + người dùng/tài khoản hệ điều hành chuyên dụng).
- Không đăng nhập runtime đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình duyệt/trình quản lý mật khẩu cá nhân.
- Nếu người dùng có tính đối kháng lẫn nhau, hãy tách theo gateway/host/người dùng hệ điều hành.

Chi tiết mô hình bảo mật: [Bảo mật](/vi/gateway/security).

## Dùng node với VPS

Bạn có thể giữ Gateway trên đám mây và ghép đôi **node** trên các thiết bị cục bộ của mình
(Mac/iOS/Android/headless). Node cung cấp màn hình/camera/canvas cục bộ và các khả năng `system.run`
trong khi Gateway vẫn ở trên đám mây.

Tài liệu: [Node](/vi/nodes), [CLI cho node](/vi/cli/nodes).

## Tinh chỉnh khởi động cho VM nhỏ và máy chủ ARM

Nếu các lệnh CLI chạy chậm trên VM công suất thấp (hoặc máy chủ ARM), hãy bật bộ đệm biên dịch module của Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` cải thiện thời gian khởi động cho các lệnh lặp lại.
- `OPENCLAW_NO_RESPAWN=1` giữ các lần khởi động lại Gateway thường lệ trong cùng tiến trình, tránh chuyển giao thêm giữa các tiến trình và giúp theo dõi PID đơn giản trên máy chủ nhỏ.
- Lần chạy lệnh đầu tiên làm nóng bộ đệm; các lần chạy tiếp theo nhanh hơn.
- Với chi tiết riêng cho Raspberry Pi, xem [Raspberry Pi](/vi/install/raspberry-pi).

### Danh sách kiểm tra tinh chỉnh systemd (tùy chọn)

Với máy chủ VM dùng `systemd`, hãy cân nhắc:

- Thêm env dịch vụ để có đường dẫn khởi động ổn định:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Giữ hành vi khởi động lại rõ ràng:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Ưu tiên ổ đĩa dùng SSD cho các đường dẫn trạng thái/bộ đệm để giảm chi phí cold-start do I/O ngẫu nhiên.

Với đường dẫn `openclaw onboard --install-daemon` tiêu chuẩn, hãy sửa user unit:

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

Nếu bạn chủ ý cài system unit thay vào đó, hãy sửa
`openclaw-gateway.service` qua `sudo systemctl edit openclaw-gateway.service`.

Cách chính sách `Restart=` hỗ trợ khôi phục tự động:
[systemd có thể tự động hóa việc khôi phục dịch vụ](https://www.redhat.com/en/blog/systemd-automate-recovery).

Về hành vi OOM trên Linux, cách chọn tiến trình con làm nạn nhân và chẩn đoán `exit 137`,
xem [Áp lực bộ nhớ Linux và OOM kills](/vi/platforms/linux#memory-pressure-and-oom-kills).

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [DigitalOcean](/vi/install/digitalocean)
- [Fly.io](/vi/install/fly)
- [Hetzner](/vi/install/hetzner)

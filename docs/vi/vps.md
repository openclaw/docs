---
read_when:
    - Bạn muốn chạy Gateway trên máy chủ Linux hoặc VPS đám mây
    - Bạn cần một sơ đồ tổng quan nhanh về các hướng dẫn lưu trữ dịch vụ
    - Bạn muốn tối ưu hóa máy chủ Linux nói chung cho OpenClaw
sidebarTitle: Linux Server
summary: Chạy OpenClaw trên máy chủ Linux hoặc VPS đám mây — lựa chọn nhà cung cấp, kiến trúc và tinh chỉnh
title: Máy chủ Linux
x-i18n:
    generated_at: "2026-07-12T08:32:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Chạy OpenClaw Gateway trên bất kỳ máy chủ Linux hoặc VPS đám mây nào. Trang này giúp bạn
chọn nhà cung cấp, giải thích cách hoạt động của các triển khai trên đám mây và trình bày các
tinh chỉnh Linux chung có thể áp dụng ở mọi nơi.

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Azure" href="/vi/install/azure">Máy ảo Linux</Card>
  <Card title="DigitalOcean" href="/vi/install/digitalocean">VPS trả phí đơn giản</Card>
  <Card title="exe.dev" href="/vi/install/exe-dev">Máy ảo có proxy HTTPS</Card>
  <Card title="Fly.io" href="/vi/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/vi/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/vi/install/hetzner">Docker trên VPS Hetzner</Card>
  <Card title="Hostinger" href="/vi/install/hostinger">VPS có thiết lập bằng một cú nhấp</Card>
  <Card title="Northflank" href="/vi/install/northflank">Thiết lập trên trình duyệt bằng một cú nhấp</Card>
  <Card title="Oracle Cloud" href="/vi/install/oracle">Gói ARM miễn phí vĩnh viễn</Card>
  <Card title="Railway" href="/vi/install/railway">Thiết lập trên trình duyệt bằng một cú nhấp</Card>
  <Card title="Raspberry Pi" href="/vi/install/raspberry-pi">Tự lưu trữ trên ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / gói miễn phí)** cũng hoạt động tốt.
Video hướng dẫn từng bước do cộng đồng thực hiện có tại
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(tài nguyên cộng đồng -- có thể không còn khả dụng).

## Cách hoạt động của thiết lập trên đám mây

- **Gateway chạy trên VPS** và quản lý trạng thái cùng không gian làm việc.
- Bạn kết nối từ máy tính xách tay hoặc điện thoại qua **giao diện điều khiển** hoặc **Tailscale/SSH**.
- Hãy xem VPS là nguồn dữ liệu chuẩn và thường xuyên **sao lưu** trạng thái cùng không gian làm việc.
- Mặc định an toàn: giữ Gateway trên local loopback và truy cập qua đường hầm SSH hoặc Tailscale Serve.
  Nếu liên kết với `lan` hoặc `tailnet`, Gateway yêu cầu bí mật dùng chung
  (`gateway.auth.token` hoặc `gateway.auth.password`), trừ khi việc xác thực được ủy quyền cho một
  proxy đáng tin cậy.

Các trang liên quan: [Truy cập Gateway từ xa](/vi/gateway/remote), [Trung tâm nền tảng](/vi/platforms).

## Trước tiên, hãy tăng cường bảo mật quyền truy cập quản trị

Trước khi cài đặt OpenClaw trên một VPS công khai, hãy quyết định cách bạn muốn quản trị
chính máy chủ đó.

- Đối với quyền truy cập quản trị chỉ qua Tailnet: trước tiên hãy cài đặt Tailscale, kết nối VPS vào
  tailnet của bạn, xác minh phiên SSH thứ hai qua địa chỉ IP Tailscale hoặc tên MagicDNS,
  rồi hạn chế SSH công khai.
- Nếu không dùng Tailscale: hãy áp dụng biện pháp tăng cường bảo mật tương đương cho đường truy cập SSH trước khi
  công khai thêm dịch vụ.
- Việc này tách biệt với quyền truy cập Gateway. Bạn vẫn có thể giữ OpenClaw liên kết với
  local loopback và dùng đường hầm SSH hoặc Tailscale Serve cho bảng điều khiển.

Các tùy chọn Gateway dành riêng cho Tailscale có tại [Tailscale](/vi/gateway/tailscale).

## Tác tử dùng chung của công ty trên VPS

Chạy một tác tử duy nhất cho cả nhóm là một thiết lập hợp lệ khi mọi người dùng đều thuộc
cùng một ranh giới tin cậy và tác tử chỉ được dùng cho công việc.

- Chạy tác tử trên một môi trường thực thi chuyên dụng (VPS/máy ảo/vùng chứa + người dùng/tài khoản hệ điều hành chuyên dụng).
- Không đăng nhập môi trường thực thi đó vào tài khoản Apple/Google cá nhân hoặc hồ sơ trình duyệt/trình quản lý mật khẩu cá nhân.
- Nếu người dùng có thể đối nghịch với nhau, hãy tách riêng theo Gateway/máy chủ/người dùng hệ điều hành.

Chi tiết về mô hình bảo mật: [Bảo mật](/vi/gateway/security).

## Sử dụng các Node với VPS

Bạn có thể giữ Gateway trên đám mây và ghép nối các **Node** trên thiết bị cục bộ
(Mac/iOS/Android/không giao diện). Node cung cấp các khả năng màn hình/camera/canvas cục bộ và `system.run`
trong khi Gateway vẫn ở trên đám mây.

Tài liệu: [Node](/vi/nodes), [CLI Node](/vi/cli/nodes).

## Tinh chỉnh khởi động cho máy ảo nhỏ và máy chủ ARM

Nếu các lệnh CLI phản hồi chậm trên máy ảo công suất thấp (hoặc máy chủ ARM), hãy bật bộ nhớ đệm biên dịch mô-đun của Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` cải thiện thời gian khởi động của các lệnh chạy lặp lại; lần chạy đầu tiên sẽ làm nóng bộ nhớ đệm.
- `OPENCLAW_NO_RESPAWN=1` giữ các lần khởi động lại Gateway thông thường trong cùng tiến trình, nhờ đó tránh việc bàn giao giữa các tiến trình không cần thiết và đơn giản hóa việc theo dõi PID trên máy chủ nhỏ.
- Để biết thông tin cụ thể về Raspberry Pi, hãy xem [Raspberry Pi](/vi/install/raspberry-pi).

### Danh sách kiểm tra tinh chỉnh systemd (tùy chọn)

Đối với máy chủ VM sử dụng `systemd`, hãy cân nhắc:

- Biến môi trường dịch vụ để có đường khởi động ổn định: `OPENCLAW_NO_RESPAWN=1` và
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Hành vi khởi động lại rõ ràng: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Ổ đĩa SSD cho các đường dẫn trạng thái/bộ nhớ đệm nhằm giảm độ trễ khởi động nguội do I/O ngẫu nhiên.

Quy trình tiêu chuẩn `openclaw onboard --install-daemon` cài đặt một đơn vị người dùng systemd;
chỉnh sửa bằng:

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

Nếu bạn chủ ý cài đặt một đơn vị hệ thống thay thế, hãy chỉnh sửa qua
`sudo systemctl edit openclaw-gateway.service`.

Cách các chính sách `Restart=` hỗ trợ khôi phục tự động:
[systemd có thể tự động hóa việc khôi phục dịch vụ](https://www.redhat.com/en/blog/systemd-automate-recovery).

Để biết về hành vi OOM trên Linux, việc chọn tiến trình con làm nạn nhân và chẩn đoán `exit 137`,
hãy xem [Áp lực bộ nhớ và việc kết thúc tiến trình do OOM trên Linux](/vi/platforms/linux#memory-pressure-and-oom-kills).

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [DigitalOcean](/vi/install/digitalocean)
- [Fly.io](/vi/install/fly)
- [Hetzner](/vi/install/hetzner)

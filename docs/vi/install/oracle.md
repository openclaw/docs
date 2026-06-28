---
read_when:
    - Thiết lập OpenClaw trên Oracle Cloud
    - Tìm dịch vụ lưu trữ VPS miễn phí cho OpenClaw
    - Muốn OpenClaw chạy 24/7 trên một máy chủ nhỏ
summary: Lưu trữ OpenClaw trên bậc ARM Always Free của Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:19:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Chạy một OpenClaw Gateway bền bỉ trên bậc ARM **Always Free** của Oracle Cloud (tối đa 4 OCPU, RAM 24 GB, dung lượng lưu trữ 200 GB) miễn phí.

## Điều kiện tiên quyết

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) -- xem [hướng dẫn đăng ký của cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu bạn gặp sự cố
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- Một cặp khóa SSH
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Create an OCI instance">
    1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Điều hướng đến **Compute > Instances > Create Instance**.
    3. Cấu hình:
       - **Tên:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (hoặc tối đa 4)
       - **Bộ nhớ:** 12 GB (hoặc tối đa 24 GB)
       - **Boot volume:** 50 GB (miễn phí tối đa 200 GB)
       - **Khóa SSH:** Thêm khóa công khai của bạn
    4. Nhấp **Create** và ghi lại địa chỉ IP công khai.

    <Tip>
    Nếu việc tạo instance thất bại với thông báo "Out of capacity", hãy thử một availability domain khác hoặc thử lại sau. Dung lượng bậc miễn phí có giới hạn.
    </Tip>

  </Step>

  <Step title="Connect and update the system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` là bắt buộc để biên dịch một số phụ thuộc trên ARM.

  </Step>

  <Step title="Configure user and hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Bật linger giúp các dịch vụ người dùng tiếp tục chạy sau khi đăng xuất.

  </Step>

  <Step title="Install Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Từ giờ trở đi, kết nối qua Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Khi được hỏi "How do you want to hatch your bot?", chọn **Do this later**.

  </Step>

  <Step title="Configure the gateway">
    Sử dụng xác thực token với Tailscale Serve để truy cập từ xa an toàn.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ở đây chỉ dành cho xử lý forwarded-IP/local-client của proxy Tailscale Serve cục bộ. Đây **không phải** là `gateway.auth.mode: "trusted-proxy"`. Các tuyến trình xem diff vẫn giữ hành vi đóng khi lỗi trong thiết lập này: yêu cầu trình xem `127.0.0.1` thô không có header proxy được chuyển tiếp có thể trả về `Diff not found`. Dùng `mode=file` / `mode=both` cho tệp đính kèm, hoặc chủ động bật trình xem từ xa và đặt `plugins.entries.diffs.config.viewerBaseUrl` (hoặc truyền `baseUrl` của proxy) nếu bạn cần liên kết trình xem có thể chia sẻ.

  </Step>

  <Step title="Lock down VCN security">
    Chặn toàn bộ lưu lượng trừ Tailscale ở biên mạng:

    1. Đi tới **Networking > Virtual Cloud Networks** trong OCI Console.
    2. Nhấp vào VCN của bạn, rồi **Security Lists > Default Security List**.
    3. **Xóa** tất cả quy tắc ingress ngoại trừ `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Giữ các quy tắc egress mặc định (cho phép toàn bộ outbound).

    Việc này chặn SSH trên cổng 22, HTTP, HTTPS và mọi thứ khác ở biên mạng. Từ thời điểm này, bạn chỉ có thể kết nối qua Tailscale.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Truy cập UI Điều khiển từ bất kỳ thiết bị nào trên tailnet của bạn:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Thay `<tailnet-name>` bằng tên tailnet của bạn (hiển thị trong `tailscale status`).

  </Step>
</Steps>

## Xác minh trạng thái bảo mật

Khi VCN đã được khóa chặt (chỉ mở UDP 41641) và Gateway được liên kết với loopback, lưu lượng công khai bị chặn ở biên mạng và quyền truy cập quản trị chỉ dành cho tailnet. Điều đó loại bỏ nhu cầu thực hiện một số bước gia cố VPS truyền thống:

| Bước truyền thống        | Cần không?          | Lý do                                                                              |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------- |
| Tường lửa UFW            | Không               | VCN chặn lưu lượng trước khi nó tới instance.                                      |
| fail2ban                 | Không               | Cổng 22 bị chặn tại VCN; không có bề mặt brute-force.                              |
| Gia cố sshd              | Không               | Tailscale SSH không dùng sshd.                                                     |
| Tắt đăng nhập root       | Không               | Tailscale xác thực bằng danh tính tailnet, không phải người dùng hệ thống.         |
| Xác thực chỉ bằng khóa SSH | Không             | Tương tự — danh tính tailnet thay thế khóa SSH hệ thống.                           |
| Gia cố IPv6              | Thường không        | Phụ thuộc vào thiết lập VCN/subnet; hãy xác minh thực tế những gì được gán/phơi lộ. |

Vẫn khuyến nghị:

- `chmod 700 ~/.openclaw` để hạn chế quyền trên tệp thông tin xác thực.
- `openclaw security audit` để kiểm tra trạng thái dành riêng cho OpenClaw.
- Chạy `sudo apt update && sudo apt upgrade` thường xuyên để cập nhật bản vá hệ điều hành.
- Định kỳ rà soát thiết bị trong [bảng điều khiển quản trị Tailscale](https://login.tailscale.com/admin).

Lệnh xác minh nhanh:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## Ghi chú về ARM

Bậc Always Free là ARM (`aarch64`). Hầu hết tính năng của OpenClaw hoạt động tốt; một số ít binary native cần bản dựng ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript thuần, không có vấn đề.
- Hầu hết gói npm có mã native: có sẵn artifact dựng sẵn `linux-arm64`.
- Trình trợ giúp CLI tùy chọn (ví dụ: binary Go/Rust được cung cấp bởi skills): kiểm tra bản phát hành `aarch64` / `linux-arm64` trước khi cài đặt.

Xác minh kiến trúc bằng `uname -m` (nên in ra `aarch64`). Với binary không có bản dựng ARM, hãy cài từ mã nguồn hoặc bỏ qua.

## Tính bền bỉ và sao lưu

Trạng thái OpenClaw nằm trong:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp, và dữ liệu phiên.
- `~/.openclaw/workspace/` — workspace của agent (SOUL.md, bộ nhớ, artifact).

Các dữ liệu này vẫn tồn tại sau khi khởi động lại. Để tạo snapshot có thể di chuyển:

```bash
openclaw backup create
```

## Dự phòng: đường hầm SSH

Nếu Tailscale Serve không hoạt động, dùng đường hầm SSH từ máy cục bộ của bạn:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

## Khắc phục sự cố

**Tạo instance thất bại ("Out of capacity")** -- Instance ARM bậc miễn phí rất phổ biến. Hãy thử availability domain khác hoặc thử lại vào giờ thấp điểm.

**Tailscale không kết nối** -- Chạy `sudo tailscale up --ssh --hostname=openclaw --reset` để xác thực lại.

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Sự cố binary ARM** -- Hầu hết gói npm hoạt động trên ARM64. Với binary native, hãy tìm bản phát hành `linux-arm64` hoặc `aarch64`. Xác minh kiến trúc bằng `uname -m`.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều kênh khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [GCP](/vi/install/gcp)
- [Lưu trữ VPS](/vi/vps)

---
read_when:
    - Thiết lập OpenClaw trên Oracle Cloud
    - Tìm dịch vụ lưu trữ VPS miễn phí cho OpenClaw
    - Muốn chạy OpenClaw 24/7 trên một máy chủ nhỏ
summary: Chạy OpenClaw trên bậc ARM Always Free của Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-29T22:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 16
---

Chạy OpenClaw Gateway lâu dài trên bậc ARM **Always Free** của Oracle Cloud (tối đa 4 OCPU, 24 GB RAM, 200 GB lưu trữ) miễn phí.

## Điều kiện tiên quyết

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) -- xem [hướng dẫn đăng ký của cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu bạn gặp vấn đề
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- Một cặp khóa SSH
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Tạo một phiên bản OCI">
    1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Điều hướng đến **Compute > Instances > Create Instance**.
    3. Cấu hình:
       - **Tên:** `openclaw`
       - **Ảnh:** Ubuntu 24.04 (aarch64)
       - **Kiểu máy:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU:** 2 (hoặc tối đa 4)
       - **Bộ nhớ:** 12 GB (hoặc tối đa 24 GB)
       - **Ổ đĩa khởi động:** 50 GB (miễn phí tối đa 200 GB)
       - **Khóa SSH:** Thêm khóa công khai của bạn
    4. Nhấp **Create** và ghi lại địa chỉ IP công khai.

    <Tip>
    Nếu tạo phiên bản thất bại với thông báo "Out of capacity", hãy thử một miền khả dụng khác hoặc thử lại sau. Dung lượng bậc miễn phí có giới hạn.
    </Tip>

  </Step>

  <Step title="Kết nối và cập nhật hệ thống">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` là bắt buộc để biên dịch ARM cho một số phụ thuộc.

  </Step>

  <Step title="Cấu hình người dùng và tên máy chủ">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Bật linger giúp các dịch vụ người dùng tiếp tục chạy sau khi đăng xuất.

  </Step>

  <Step title="Cài đặt Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Từ giờ trở đi, hãy kết nối qua Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Khi được hỏi "How do you want to hatch your bot?", hãy chọn **Thực hiện việc này sau**.

  </Step>

  <Step title="Cấu hình Gateway">
    Sử dụng xác thực bằng token với Tailscale Serve để truy cập từ xa an toàn.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ở đây chỉ dành cho việc xử lý IP được chuyển tiếp/máy khách cục bộ của proxy Tailscale Serve cục bộ. Đây **không** phải là `gateway.auth.mode: "trusted-proxy"`. Các tuyến trình xem diff vẫn giữ hành vi fail-closed trong thiết lập này: yêu cầu trình xem thô từ `127.0.0.1` không có header proxy được chuyển tiếp có thể trả về `Diff not found`. Sử dụng `mode=file` / `mode=both` cho tệp đính kèm, hoặc chủ động bật trình xem từ xa và đặt `plugins.entries.diffs.config.viewerBaseUrl` (hoặc truyền một proxy `baseUrl`) nếu bạn cần các liên kết trình xem có thể chia sẻ.

  </Step>

  <Step title="Khóa bảo mật VCN">
    Chặn toàn bộ lưu lượng ngoại trừ Tailscale ở biên mạng:

    1. Vào **Networking > Virtual Cloud Networks** trong OCI Console.
    2. Nhấp vào VCN của bạn, rồi **Security Lists > Default Security List**.
    3. **Xóa** tất cả quy tắc ingress ngoại trừ `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Giữ các quy tắc egress mặc định (cho phép toàn bộ lưu lượng đi ra).

    Việc này chặn SSH trên cổng 22, HTTP, HTTPS và mọi thứ khác ở biên mạng. Từ thời điểm này, bạn chỉ có thể kết nối qua Tailscale.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Truy cập giao diện điều khiển từ bất kỳ thiết bị nào trên tailnet của bạn:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Thay `<tailnet-name>` bằng tên tailnet của bạn (hiển thị trong `tailscale status`).

  </Step>
</Steps>

## Dự phòng: đường hầm SSH

Nếu Tailscale Serve không hoạt động, hãy dùng đường hầm SSH từ máy cục bộ của bạn:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

## Khắc phục sự cố

**Tạo phiên bản thất bại ("Out of capacity")** -- Các phiên bản ARM bậc miễn phí rất phổ biến. Hãy thử một miền khả dụng khác hoặc thử lại vào giờ thấp điểm.

**Tailscale không kết nối** -- Chạy `sudo tailscale up --ssh --hostname=openclaw --reset` để xác thực lại.

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Sự cố nhị phân ARM** -- Hầu hết gói npm hoạt động trên ARM64. Với nhị phân gốc, hãy tìm các bản phát hành `linux-arm64` hoặc `aarch64`. Xác minh kiến trúc bằng `uname -m`.

## Bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều dịch vụ khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- giữ OpenClaw luôn cập nhật

## Liên quan

- [Tổng quan cài đặt](/vi/install)
- [GCP](/vi/install/gcp)
- [Lưu trữ VPS](/vi/vps)

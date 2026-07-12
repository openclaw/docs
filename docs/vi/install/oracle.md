---
read_when:
    - Thiết lập OpenClaw trên Oracle Cloud
    - Tìm dịch vụ lưu trữ VPS miễn phí cho OpenClaw
    - Muốn chạy OpenClaw 24/7 trên một máy chủ nhỏ
summary: Lưu trữ OpenClaw trên gói ARM Always Free của Oracle Cloud
title: Đám mây Oracle
x-i18n:
    generated_at: "2026-07-12T08:04:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Chạy Gateway OpenClaw liên tục trên tầng ARM **Always Free** của Oracle Cloud (tối đa 4 OCPU, RAM 24 GB, dung lượng lưu trữ 200 GB) mà không mất phí.

## Điều kiện tiên quyết

- Tài khoản Oracle Cloud ([đăng ký](https://www.oracle.com/cloud/free/)) -- xem [hướng dẫn đăng ký của cộng đồng](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) nếu bạn gặp sự cố
- Tài khoản Tailscale (miễn phí tại [tailscale.com](https://tailscale.com))
- Một cặp khóa SSH
- Khoảng 30 phút

## Thiết lập

<Steps>
  <Step title="Tạo một phiên bản OCI">
    1. Đăng nhập vào [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Đi đến **Compute > Instances > Create Instance**.
    3. Cấu hình:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (hoặc tối đa 4)
       - **Memory:** 12 GB (hoặc tối đa 24 GB)
       - **Boot volume:** 50 GB (miễn phí tối đa 200 GB)
       - **SSH key:** Thêm khóa công khai của bạn
    4. Nhấp vào **Create** và ghi lại địa chỉ IP công khai.

    <Tip>
    Nếu không thể tạo phiên bản do lỗi "Out of capacity", hãy thử một miền khả dụng khác hoặc thử lại sau. Dung lượng của tầng miễn phí có hạn.
    </Tip>

  </Step>

  <Step title="Kết nối và cập nhật hệ thống">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    Cần có `build-essential` để biên dịch một số phần phụ thuộc trên ARM.

  </Step>

  <Step title="Cấu hình người dùng và tên máy chủ">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Bật linger để các dịch vụ người dùng tiếp tục chạy sau khi đăng xuất.

  </Step>

  <Step title="Cài đặt Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Từ bây giờ, hãy kết nối qua Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Cài đặt OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Khi được hỏi "How do you want to hatch your bot?", hãy chọn **Do this later**.

  </Step>

  <Step title="Cấu hình Gateway">
    Sử dụng xác thực bằng token cùng Tailscale Serve để truy cập từ xa an toàn.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` ở đây chỉ dùng để proxy Tailscale Serve cục bộ xử lý IP được chuyển tiếp/máy khách cục bộ. Đây **không phải** là `gateway.auth.mode: "trusted-proxy"`. Các tuyến trình xem diff vẫn giữ hành vi từ chối theo mặc định trong thiết lập này: các yêu cầu trình xem trực tiếp từ `127.0.0.1` không có tiêu đề proxy chuyển tiếp sẽ trả về `Diff not found`. Sử dụng `mode=file` / `mode=both` cho tệp đính kèm, hoặc chủ động bật trình xem từ xa và đặt `plugins.entries.diffs.config.viewerBaseUrl` (hoặc truyền `baseUrl` cho proxy) nếu bạn cần liên kết trình xem có thể chia sẻ.

  </Step>

  <Step title="Siết chặt bảo mật VCN">
    Chặn toàn bộ lưu lượng ngoại trừ Tailscale tại biên mạng:

    1. Đi đến **Networking > Virtual Cloud Networks** trong OCI Console.
    2. Nhấp vào VCN của bạn, sau đó chọn **Security Lists > Default Security List**.
    3. **Remove** tất cả quy tắc lưu lượng vào ngoại trừ `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Giữ nguyên các quy tắc lưu lượng ra mặc định (cho phép mọi lưu lượng đi).

    Thao tác này chặn SSH trên cổng 22, HTTP, HTTPS và mọi lưu lượng khác tại biên mạng. Từ thời điểm này, bạn chỉ có thể kết nối qua Tailscale.

  </Step>

  <Step title="Xác minh">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Truy cập giao diện điều khiển từ bất kỳ thiết bị nào trong tailnet của bạn:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Thay `<tailnet-name>` bằng tên tailnet của bạn (hiển thị trong `tailscale status`).

  </Step>
</Steps>

## Xác minh trạng thái bảo mật

Khi VCN đã được siết chặt (chỉ mở UDP 41641) và Gateway chỉ lắng nghe trên loopback, lưu lượng công khai bị chặn tại biên mạng và quyền truy cập quản trị chỉ giới hạn trong tailnet. Điều này loại bỏ nhu cầu thực hiện một số bước gia cố VPS truyền thống:

| Bước truyền thống               | Có cần không?          | Lý do                                                                 |
| ------------------------------- | ---------------------- | --------------------------------------------------------------------- |
| Tường lửa UFW                   | Không                  | VCN chặn lưu lượng trước khi lưu lượng đến phiên bản.                  |
| fail2ban                        | Không                  | Cổng 22 bị chặn tại VCN; không có bề mặt để tấn công vét cạn.          |
| Gia cố sshd                     | Không                  | SSH của Tailscale không sử dụng sshd.                                  |
| Vô hiệu hóa đăng nhập root      | Không                  | Tailscale xác thực bằng danh tính tailnet, không phải người dùng hệ thống. |
| Chỉ xác thực bằng khóa SSH      | Không                  | Tương tự -- danh tính tailnet thay thế khóa SSH của hệ thống.          |
| Gia cố IPv6                     | Thường không           | Phụ thuộc vào cài đặt VCN/mạng con; hãy xác minh tài nguyên thực sự được cấp/phơi bày. |

Vẫn nên thực hiện:

- `chmod 700 ~/.openclaw` để hạn chế quyền truy cập tệp thông tin xác thực.
- `openclaw security audit` để kiểm tra trạng thái bảo mật dành riêng cho OpenClaw.
- Thường xuyên chạy `sudo apt update && sudo apt upgrade` để cài đặt các bản vá hệ điều hành.
- Định kỳ xem lại các thiết bị trong [bảng điều khiển quản trị Tailscale](https://login.tailscale.com/admin).

Các lệnh xác minh nhanh:

```bash
# Xác nhận không có cổng công khai nào đang lắng nghe
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Xác minh SSH của Tailscale đang hoạt động
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Tùy chọn: vô hiệu hóa hoàn toàn sshd sau khi xác nhận SSH của Tailscale hoạt động
sudo systemctl disable --now ssh
```

## Lưu ý về ARM

Tầng Always Free sử dụng ARM (`aarch64`). Hầu hết các tính năng của OpenClaw đều hoạt động bình thường; một số ít tệp nhị phân gốc cần bản dựng ARM:

- Node.js, Telegram, WhatsApp (Baileys): JavaScript thuần túy, không có vấn đề.
- Hầu hết các gói npm có mã gốc: có sẵn các tạo phẩm `linux-arm64` được dựng sẵn.
- Các trình trợ giúp CLI tùy chọn (ví dụ: tệp nhị phân Go/Rust được phân phối qua Skills): kiểm tra xem có bản phát hành `aarch64` / `linux-arm64` trước khi cài đặt.

Xác minh kiến trúc bằng `uname -m` (kết quả phải là `aarch64`). Đối với tệp nhị phân không có bản dựng ARM, hãy cài đặt từ mã nguồn hoặc bỏ qua.

## Duy trì trạng thái và sao lưu

Trạng thái OpenClaw nằm trong:

- `~/.openclaw/` -- `openclaw.json`, `auth-profiles.json` theo từng tác nhân, trạng thái kênh/nhà cung cấp và dữ liệu phiên.
- `~/.openclaw/workspace/` -- không gian làm việc của tác nhân (SOUL.md, bộ nhớ, tạo phẩm).

Các dữ liệu này vẫn tồn tại sau khi khởi động lại. Để tạo một bản chụp nhanh có thể di chuyển:

```bash
openclaw backup create
```

## Phương án dự phòng: đường hầm SSH

Nếu Tailscale Serve không hoạt động, hãy sử dụng đường hầm SSH từ máy cục bộ của bạn:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Sau đó mở `http://localhost:18789`.

## Khắc phục sự cố

**Không thể tạo phiên bản ("Out of capacity")** -- Các phiên bản ARM thuộc tầng miễn phí rất được ưa chuộng. Hãy thử một miền khả dụng khác hoặc thử lại vào giờ thấp điểm.

**Tailscale không kết nối** -- Chạy `sudo tailscale up --ssh --hostname=openclaw --reset` để xác thực lại.

**Gateway không khởi động** -- Chạy `openclaw doctor --non-interactive` và kiểm tra nhật ký bằng `journalctl --user -u openclaw-gateway.service -n 50`.

**Sự cố tệp nhị phân ARM** -- Hầu hết các gói npm đều hoạt động trên ARM64. Đối với tệp nhị phân gốc, hãy tìm bản phát hành `linux-arm64` hoặc `aarch64`. Xác minh kiến trúc bằng `uname -m`.

## Các bước tiếp theo

- [Kênh](/vi/channels) -- kết nối Telegram, WhatsApp, Discord và nhiều dịch vụ khác
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả tùy chọn cấu hình
- [Cập nhật](/vi/install/updating) -- duy trì OpenClaw ở phiên bản mới nhất

## Nội dung liên quan

- [Tổng quan về cài đặt](/vi/install)
- [GCP](/vi/install/gcp)
- [Lưu trữ trên VPS](/vi/vps)

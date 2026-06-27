---
read_when:
    - Bạn muốn một gateway được đóng gói trong container bằng Podman thay vì Docker
summary: Chạy OpenClaw trong container Podman không cần quyền root
title: Podman
x-i18n:
    generated_at: "2026-06-27T17:38:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

Chạy OpenClaw Gateway trong container Podman không dùng root, được quản lý bởi người dùng hiện tại không phải root của bạn.

Mô hình dự kiến là:

- Podman chạy container Gateway.
- CLI `openclaw` trên máy chủ của bạn là mặt phẳng điều khiển.
- Trạng thái bền vững nằm trên máy chủ trong `~/.openclaw` theo mặc định.
- Việc quản lý hằng ngày dùng `openclaw --container <name> ...` thay vì `sudo -u openclaw`, `podman exec`, hoặc một người dùng dịch vụ riêng.

## Điều kiện tiên quyết

- **Podman** ở chế độ không dùng root
- **OpenClaw CLI** được cài đặt trên máy chủ
- **Tùy chọn:** `systemd --user` nếu bạn muốn tự động khởi động do Quadlet quản lý
- **Tùy chọn:** `sudo` chỉ khi bạn muốn `loginctl enable-linger "$(whoami)"` để duy trì khi khởi động trên máy chủ không có giao diện

## Bắt đầu nhanh

<Steps>
  <Step title="Thiết lập một lần">
    Từ gốc repo, chạy `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Khởi động container Gateway">
    Khởi động container bằng `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Chạy onboarding bên trong container">
    Chạy `./scripts/run-openclaw-podman.sh launch setup`, rồi mở `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Quản lý container đang chạy từ CLI trên máy chủ">
    Đặt `OPENCLAW_CONTAINER=openclaw`, rồi dùng các lệnh `openclaw` thông thường từ máy chủ.
  </Step>
</Steps>

Chi tiết thiết lập:

- `./scripts/podman/setup.sh` xây dựng `openclaw:local` trong kho Podman không dùng root của bạn theo mặc định, hoặc dùng `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` nếu bạn đặt một trong hai.
- Nó tạo `~/.openclaw/openclaw.json` với `gateway.mode: "local"` nếu chưa có.
- Nó tạo `~/.openclaw/.env` với `OPENCLAW_GATEWAY_TOKEN` nếu chưa có.
- Với các lần khởi chạy thủ công, trình trợ giúp chỉ đọc một allowlist nhỏ gồm các khóa liên quan đến Podman từ `~/.openclaw/.env` và truyền các biến môi trường runtime rõ ràng vào container; nó không đưa toàn bộ tệp env cho Podman.

Thiết lập do Quadlet quản lý:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet là tùy chọn chỉ dành cho Linux vì nó phụ thuộc vào các dịch vụ người dùng systemd.

Bạn cũng có thể đặt `OPENCLAW_PODMAN_QUADLET=1`.

Các biến môi trường build/setup tùy chọn:

- `OPENCLAW_IMAGE` hoặc `OPENCLAW_PODMAN_IMAGE` -- dùng một image hiện có/đã pull thay vì build `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- cài đặt thêm các gói apt trong quá trình build image (cũng chấp nhận `OPENCLAW_DOCKER_APT_PACKAGES` cũ)
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- cài đặt thêm các gói Python trong quá trình build image; ghim phiên bản và chỉ dùng các chỉ mục gói mà bạn tin cậy
- `OPENCLAW_EXTENSIONS` -- cài đặt sẵn các phụ thuộc Plugin tại thời điểm build
- `OPENCLAW_INSTALL_BROWSER` -- cài đặt sẵn Chromium và Xvfb cho tự động hóa trình duyệt (đặt thành `1` để bật)

Khởi động container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Script khởi động container với uid/gid hiện tại của bạn bằng `--userns=keep-id` và bind-mount trạng thái OpenClaw của bạn vào container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Sau đó mở `http://127.0.0.1:18789/` và dùng token từ `~/.openclaw/.env`.

Xác thực mô hình trong Podman:

- Dùng xác thực do OpenClaw quản lý trong quá trình thiết lập: khóa API Anthropic cho Anthropic, hoặc xác thực OAuth trình duyệt/device-code của OpenAI Codex cho OpenAI được Codex hỗ trợ.
- Trình khởi chạy Podman không mount các thư mục thông tin xác thực CLI của máy chủ như `~/.claude` hoặc `~/.codex` vào container thiết lập hoặc Gateway.
- Các phiên đăng nhập CLI hiện có trên máy chủ là các đường dẫn tiện lợi cùng máy. Với cài đặt trong container, hãy giữ xác thực nhà cung cấp trong trạng thái `~/.openclaw` được mount mà thiết lập quản lý.

Mặc định CLI trên máy chủ:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Sau đó các lệnh như sau sẽ tự động chạy bên trong container đó:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Trên macOS, máy Podman có thể khiến trình duyệt trông như không cục bộ đối với Gateway.
Nếu Control UI báo lỗi xác thực thiết bị sau khi khởi chạy, hãy dùng hướng dẫn Tailscale trong
[Podman và Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman và Tailscale

Để truy cập HTTPS hoặc trình duyệt từ xa, hãy làm theo tài liệu Tailscale chính.

Lưu ý riêng cho Podman:

- Giữ máy chủ publish của Podman ở `127.0.0.1`.
- Ưu tiên `tailscale serve` do máy chủ quản lý thay vì `openclaw gateway --tailscale serve`.
- Trên macOS, nếu ngữ cảnh xác thực thiết bị của trình duyệt cục bộ không ổn định, hãy dùng quyền truy cập Tailscale thay vì các cách né tạm thời bằng đường hầm cục bộ tùy biến.

Xem:

- [Tailscale](/vi/gateway/tailscale)
- [Control UI](/vi/web/control-ui)

## Systemd (Quadlet, tùy chọn)

Nếu bạn đã chạy `./scripts/podman/setup.sh --quadlet`, thiết lập sẽ cài đặt một tệp Quadlet tại:

```bash
~/.config/containers/systemd/openclaw.container
```

Các lệnh hữu ích:

- **Khởi động:** `systemctl --user start openclaw.service`
- **Dừng:** `systemctl --user stop openclaw.service`
- **Trạng thái:** `systemctl --user status openclaw.service`
- **Nhật ký:** `journalctl --user -u openclaw.service -f`

Sau khi chỉnh sửa tệp Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Để duy trì khi khởi động trên máy chủ SSH/không có giao diện, hãy bật lingering cho người dùng hiện tại của bạn:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Cấu hình, env và lưu trữ

- **Thư mục cấu hình:** `~/.openclaw`
- **Thư mục workspace:** `~/.openclaw/workspace`
- **Tệp token:** `~/.openclaw/.env`
- **Trình trợ giúp khởi chạy:** `./scripts/run-openclaw-podman.sh`

Script khởi chạy và Quadlet bind-mount trạng thái máy chủ vào container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Theo mặc định, đó là các thư mục trên máy chủ, không phải trạng thái container ẩn danh, vì vậy
`openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp,
phiên và workspace vẫn tồn tại sau khi thay thế container.
Thiết lập Podman cũng khởi tạo `gateway.controlUi.allowedOrigins` cho `127.0.0.1` và `localhost` trên cổng Gateway đã publish để dashboard cục bộ hoạt động với bind không phải loopback của container.

Các biến môi trường hữu ích cho trình khởi chạy thủ công:

- `OPENCLAW_PODMAN_CONTAINER` -- tên container (`openclaw` theo mặc định)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image để chạy
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- cổng máy chủ được ánh xạ tới container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- cổng máy chủ được ánh xạ tới container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- giao diện máy chủ cho các cổng đã publish; mặc định là `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- chế độ bind Gateway bên trong container; mặc định là `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (mặc định), `auto`, hoặc `host`

Trình khởi chạy thủ công đọc `~/.openclaw/.env` trước khi chốt các mặc định container/image, vì vậy bạn có thể lưu bền vững các giá trị này ở đó.

Nếu bạn dùng `OPENCLAW_CONFIG_DIR` hoặc `OPENCLAW_WORKSPACE_DIR` không mặc định, hãy đặt cùng các biến cho cả lệnh `./scripts/podman/setup.sh` và các lệnh `./scripts/run-openclaw-podman.sh launch` sau này. Trình khởi chạy cục bộ trong repo không lưu bền vững các ghi đè đường dẫn tùy chỉnh giữa các shell.

Lưu ý Quadlet:

- Dịch vụ Quadlet được tạo ra cố ý giữ một hình dạng mặc định cố định và được gia cố: các cổng publish `127.0.0.1`, `--bind lan` bên trong container, và không gian tên người dùng `keep-id`.
- Nó ghim `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, và `TimeoutStartSec=300`.
- Nó publish cả `127.0.0.1:18789:18789` (Gateway) và `127.0.0.1:18790:18790` (bridge).
- Nó đọc `~/.openclaw/.env` làm `EnvironmentFile` runtime cho các giá trị như `OPENCLAW_GATEWAY_TOKEN`, nhưng không tiêu thụ allowlist ghi đè riêng cho Podman của trình khởi chạy thủ công.
- Nếu bạn cần tùy chỉnh cổng publish, máy chủ publish hoặc các cờ chạy container khác, hãy dùng trình khởi chạy thủ công hoặc chỉnh sửa trực tiếp `~/.config/containers/systemd/openclaw.container`, rồi tải lại và khởi động lại dịch vụ.

## Các lệnh hữu ích

- **Nhật ký container:** `podman logs -f openclaw`
- **Dừng container:** `podman stop openclaw`
- **Xóa container:** `podman rm -f openclaw`
- **Mở URL dashboard từ CLI trên máy chủ:** `openclaw dashboard --no-open`
- **Sức khỏe/trạng thái qua CLI trên máy chủ:** `openclaw gateway status --deep` (thăm dò RPC + quét dịch vụ bổ sung)

## Khắc phục sự cố

- **Bị từ chối quyền (EACCES) trên cấu hình hoặc workspace:** Theo mặc định, container chạy với `--userns=keep-id` và `--user <your uid>:<your gid>`. Hãy đảm bảo các đường dẫn cấu hình/workspace trên máy chủ thuộc sở hữu của người dùng hiện tại của bạn.
- **Khởi động Gateway bị chặn (thiếu `gateway.mode=local`):** Đảm bảo `~/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` sẽ tạo tệp này nếu thiếu.
- **Các lệnh CLI container trỏ nhầm đích:** Dùng rõ ràng `openclaw --container <name> ...`, hoặc export `OPENCLAW_CONTAINER=<name>` trong shell của bạn.
- **`openclaw update` thất bại với `--container`:** Đúng như dự kiến. Build lại/pull image, rồi khởi động lại container hoặc dịch vụ Quadlet.
- **Dịch vụ Quadlet không khởi động:** Chạy `systemctl --user daemon-reload`, rồi `systemctl --user start openclaw.service`. Trên hệ thống không có giao diện, bạn cũng có thể cần `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux chặn bind mount:** Giữ nguyên hành vi mount mặc định; trình khởi chạy tự động thêm `:Z` trên Linux khi SELinux đang ở chế độ enforcing hoặc permissive.

## Liên quan

- [Docker](/vi/install/docker)
- [Tiến trình nền Gateway](/vi/gateway/background-process)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)

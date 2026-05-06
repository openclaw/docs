---
read_when:
    - Bạn muốn một Gateway được container hóa bằng Podman thay vì Docker
summary: Chạy OpenClaw trong vùng chứa Podman không cần quyền root
title: Podman
x-i18n:
    generated_at: "2026-05-06T09:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

Chạy OpenClaw Gateway trong container Podman không cần root, do người dùng không phải root hiện tại của bạn quản lý.

Mô hình dự kiến là:

- Podman chạy container Gateway.
- CLI `openclaw` trên host của bạn là mặt phẳng điều khiển.
- Theo mặc định, trạng thái bền vững nằm trên host trong `~/.openclaw`.
- Việc quản lý hằng ngày dùng `openclaw --container <name> ...` thay vì `sudo -u openclaw`, `podman exec`, hoặc một người dùng dịch vụ riêng.

## Điều kiện tiên quyết

- **Podman** ở chế độ không cần root
- **OpenClaw CLI** đã được cài trên host
- **Tùy chọn:** `systemd --user` nếu bạn muốn tự động khởi động do Quadlet quản lý
- **Tùy chọn:** `sudo` chỉ khi bạn muốn `loginctl enable-linger "$(whoami)"` để duy trì khi khởi động trên host không có màn hình

## Bắt đầu nhanh

<Steps>
  <Step title="Thiết lập một lần">
    Từ thư mục gốc repo, chạy `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Khởi động container Gateway">
    Khởi động container bằng `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Chạy onboarding bên trong container">
    Chạy `./scripts/run-openclaw-podman.sh launch setup`, rồi mở `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Quản lý container đang chạy từ CLI trên host">
    Đặt `OPENCLAW_CONTAINER=openclaw`, rồi dùng các lệnh `openclaw` thông thường từ host.
  </Step>
</Steps>

Chi tiết thiết lập:

- Theo mặc định, `./scripts/podman/setup.sh` dựng `openclaw:local` trong kho Podman không cần root của bạn, hoặc dùng `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` nếu bạn đặt một trong hai biến này.
- Nó tạo `~/.openclaw/openclaw.json` với `gateway.mode: "local"` nếu chưa có.
- Nó tạo `~/.openclaw/.env` với `OPENCLAW_GATEWAY_TOKEN` nếu chưa có.
- Với các lần khởi chạy thủ công, trình trợ giúp chỉ đọc một allowlist nhỏ gồm các khóa liên quan đến Podman từ `~/.openclaw/.env` và truyền các biến môi trường runtime tường minh vào container; nó không đưa toàn bộ tệp env cho Podman.

Thiết lập do Quadlet quản lý:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet là tùy chọn chỉ dành cho Linux vì nó phụ thuộc vào dịch vụ người dùng systemd.

Bạn cũng có thể đặt `OPENCLAW_PODMAN_QUADLET=1`.

Các biến môi trường dựng/thiết lập tùy chọn:

- `OPENCLAW_IMAGE` hoặc `OPENCLAW_PODMAN_IMAGE` -- dùng image hiện có/đã kéo về thay vì dựng `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- cài các gói apt bổ sung trong quá trình dựng image
- `OPENCLAW_EXTENSIONS` -- cài sẵn các phụ thuộc Plugin tại thời điểm dựng
- `OPENCLAW_INSTALL_BROWSER` -- cài sẵn Chromium và Xvfb cho tự động hóa trình duyệt (đặt thành `1` để bật)

Khởi động container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Script khởi động container bằng uid/gid hiện tại của bạn với `--userns=keep-id` và bind-mount trạng thái OpenClaw của bạn vào container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Sau đó mở `http://127.0.0.1:18789/` và dùng token từ `~/.openclaw/.env`.

Mặc định CLI trên host:

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

Trên macOS, Podman machine có thể khiến trình duyệt có vẻ không phải cục bộ đối với Gateway.
Nếu Giao diện điều khiển báo lỗi xác thực thiết bị sau khi khởi chạy, hãy dùng hướng dẫn Tailscale trong
[Podman và Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman và Tailscale

Để truy cập HTTPS hoặc trình duyệt từ xa, hãy làm theo tài liệu Tailscale chính.

Ghi chú riêng cho Podman:

- Giữ host publish của Podman ở `127.0.0.1`.
- Ưu tiên `tailscale serve` do host quản lý thay vì `openclaw gateway --tailscale serve`.
- Trên macOS, nếu ngữ cảnh xác thực thiết bị của trình duyệt cục bộ không ổn định, hãy dùng truy cập Tailscale thay cho các cách обход tạm bằng đường hầm cục bộ tự phát.

Xem:

- [Tailscale](/vi/gateway/tailscale)
- [Giao diện điều khiển](/vi/web/control-ui)

## Systemd (Quadlet, tùy chọn)

Nếu bạn đã chạy `./scripts/podman/setup.sh --quadlet`, quá trình thiết lập sẽ cài một tệp Quadlet tại:

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

Để duy trì khi khởi động trên host SSH/không có màn hình, hãy bật lingering cho người dùng hiện tại của bạn:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Cấu hình, env và lưu trữ

- **Thư mục cấu hình:** `~/.openclaw`
- **Thư mục workspace:** `~/.openclaw/workspace`
- **Tệp token:** `~/.openclaw/.env`
- **Trình trợ giúp khởi chạy:** `./scripts/run-openclaw-podman.sh`

Script khởi chạy và Quadlet bind-mount trạng thái host vào container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Theo mặc định, đây là các thư mục trên host, không phải trạng thái container ẩn danh, nên
`openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái kênh/nhà cung cấp,
phiên và workspace vẫn tồn tại sau khi thay container.
Thiết lập Podman cũng khởi tạo `gateway.controlUi.allowedOrigins` cho `127.0.0.1` và `localhost` trên cổng Gateway đã publish để dashboard cục bộ hoạt động với bind không phải loopback của container.

Các biến môi trường hữu ích cho trình khởi chạy thủ công:

- `OPENCLAW_PODMAN_CONTAINER` -- tên container (mặc định là `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image để chạy
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- cổng host ánh xạ tới container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- cổng host ánh xạ tới container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- giao diện host cho các cổng đã publish; mặc định là `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- chế độ bind Gateway bên trong container; mặc định là `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (mặc định), `auto`, hoặc `host`

Trình khởi chạy thủ công đọc `~/.openclaw/.env` trước khi hoàn tất các mặc định container/image, nên bạn có thể lưu các giá trị này ở đó.

Nếu bạn dùng `OPENCLAW_CONFIG_DIR` hoặc `OPENCLAW_WORKSPACE_DIR` không mặc định, hãy đặt cùng các biến đó cho cả lệnh `./scripts/podman/setup.sh` và các lệnh `./scripts/run-openclaw-podman.sh launch` sau này. Trình khởi chạy cục bộ trong repo không lưu các ghi đè đường dẫn tùy chỉnh giữa các shell.

Ghi chú về Quadlet:

- Dịch vụ Quadlet được tạo cố ý giữ một hình dạng mặc định cố định, được gia cố: các cổng publish trên `127.0.0.1`, `--bind lan` bên trong container và không gian tên người dùng `keep-id`.
- Nó ghim `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` và `TimeoutStartSec=300`.
- Nó publish cả `127.0.0.1:18789:18789` (Gateway) và `127.0.0.1:18790:18790` (bridge).
- Nó đọc `~/.openclaw/.env` làm `EnvironmentFile` runtime cho các giá trị như `OPENCLAW_GATEWAY_TOKEN`, nhưng không sử dụng allowlist ghi đè riêng cho Podman của trình khởi chạy thủ công.
- Nếu bạn cần cổng publish tùy chỉnh, host publish tùy chỉnh, hoặc các cờ chạy container khác, hãy dùng trình khởi chạy thủ công hoặc chỉnh sửa trực tiếp `~/.config/containers/systemd/openclaw.container`, rồi reload và khởi động lại dịch vụ.

## Các lệnh hữu ích

- **Nhật ký container:** `podman logs -f openclaw`
- **Dừng container:** `podman stop openclaw`
- **Xóa container:** `podman rm -f openclaw`
- **Mở URL dashboard từ CLI trên host:** `openclaw dashboard --no-open`
- **Sức khỏe/trạng thái qua CLI trên host:** `openclaw gateway status --deep` (thăm dò RPC + quét dịch vụ bổ sung)

## Khắc phục sự cố

- **Quyền bị từ chối (EACCES) trên cấu hình hoặc workspace:** Theo mặc định, container chạy với `--userns=keep-id` và `--user <your uid>:<your gid>`. Hãy bảo đảm các đường dẫn cấu hình/workspace trên host thuộc sở hữu của người dùng hiện tại của bạn.
- **Khởi động Gateway bị chặn (thiếu `gateway.mode=local`):** Hãy bảo đảm `~/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` tạo tệp này nếu chưa có.
- **Các lệnh CLI container trỏ sai đích:** Dùng rõ ràng `openclaw --container <name> ...`, hoặc xuất `OPENCLAW_CONTAINER=<name>` trong shell của bạn.
- **`openclaw update` thất bại với `--container`:** Dự kiến như vậy. Dựng/kéo lại image, rồi khởi động lại container hoặc dịch vụ Quadlet.
- **Dịch vụ Quadlet không khởi động:** Chạy `systemctl --user daemon-reload`, rồi `systemctl --user start openclaw.service`. Trên các hệ thống không có màn hình, bạn cũng có thể cần `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux chặn bind mount:** Giữ nguyên hành vi mount mặc định; trình khởi chạy tự động thêm `:Z` trên Linux khi SELinux ở chế độ enforcing hoặc permissive.

## Liên quan

- [Docker](/vi/install/docker)
- [Tiến trình nền Gateway](/vi/gateway/background-process)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)

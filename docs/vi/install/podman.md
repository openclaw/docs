---
read_when:
    - Bạn muốn một Gateway được container hóa bằng Podman thay vì Docker
summary: Chạy OpenClaw trong vùng chứa Podman không cần quyền root
title: Podman
x-i18n:
    generated_at: "2026-04-29T22:53:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Chạy OpenClaw Gateway trong một container Podman không cần root, do người dùng không phải root hiện tại của bạn quản lý.

Mô hình dự kiến là:

- Podman chạy container Gateway.
- CLI `openclaw` trên máy chủ của bạn là mặt phẳng điều khiển.
- Trạng thái bền vững mặc định nằm trên máy chủ tại `~/.openclaw`.
- Việc quản lý hằng ngày dùng `openclaw --container <name> ...` thay vì `sudo -u openclaw`, `podman exec`, hoặc một người dùng dịch vụ riêng.

## Điều kiện tiên quyết

- **Podman** ở chế độ không cần root
- **OpenClaw CLI** đã cài đặt trên máy chủ
- **Tùy chọn:** `systemd --user` nếu bạn muốn tự khởi động do Quadlet quản lý
- **Tùy chọn:** `sudo` chỉ khi bạn muốn dùng `loginctl enable-linger "$(whoami)"` để duy trì khi khởi động trên máy chủ không có màn hình

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

- `./scripts/podman/setup.sh` mặc định dựng `openclaw:local` trong kho Podman không cần root của bạn, hoặc dùng `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` nếu bạn đặt một trong hai.
- Nó tạo `~/.openclaw/openclaw.json` với `gateway.mode: "local"` nếu còn thiếu.
- Nó tạo `~/.openclaw/.env` với `OPENCLAW_GATEWAY_TOKEN` nếu còn thiếu.
- Với các lần khởi chạy thủ công, trình trợ giúp chỉ đọc một danh sách cho phép nhỏ gồm các khóa liên quan đến Podman từ `~/.openclaw/.env` và truyền các biến môi trường runtime rõ ràng vào container; nó không đưa toàn bộ tệp env cho Podman.

Thiết lập do Quadlet quản lý:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet là tùy chọn chỉ dành cho Linux vì nó phụ thuộc vào dịch vụ người dùng systemd.

Bạn cũng có thể đặt `OPENCLAW_PODMAN_QUADLET=1`.

Các biến môi trường build/thiết lập tùy chọn:

- `OPENCLAW_IMAGE` hoặc `OPENCLAW_PODMAN_IMAGE` -- dùng một image hiện có/đã pull thay vì dựng `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- cài đặt thêm các gói apt trong quá trình dựng image
- `OPENCLAW_EXTENSIONS` -- cài đặt sẵn các dependency của Plugin tại thời điểm build
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

Trên macOS, Podman machine có thể khiến trình duyệt có vẻ không cục bộ đối với Gateway.
Nếu Giao diện Điều khiển báo lỗi xác thực thiết bị sau khi khởi chạy, hãy dùng hướng dẫn Tailscale trong
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Để dùng HTTPS hoặc truy cập trình duyệt từ xa, hãy làm theo tài liệu Tailscale chính.

Ghi chú riêng cho Podman:

- Giữ máy chủ publish của Podman ở `127.0.0.1`.
- Ưu tiên `tailscale serve` do máy chủ quản lý hơn `openclaw gateway --tailscale serve`.
- Trên macOS, nếu ngữ cảnh xác thực thiết bị của trình duyệt cục bộ không ổn định, hãy dùng truy cập Tailscale thay vì các cách xử lý tạm thời bằng tunnel cục bộ ad hoc.

Xem:

- [Tailscale](/vi/gateway/tailscale)
- [Giao diện Điều khiển](/vi/web/control-ui)

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

Để duy trì khi khởi động trên máy chủ SSH/không có màn hình, hãy bật lingering cho người dùng hiện tại của bạn:

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

Theo mặc định, đó là các thư mục trên máy chủ, không phải trạng thái container ẩn danh, nên
`openclaw.json`, `auth-profiles.json` theo từng agent, trạng thái channel/provider,
phiên và workspace vẫn tồn tại sau khi thay thế container.
Thiết lập Podman cũng tạo sẵn `gateway.controlUi.allowedOrigins` cho `127.0.0.1` và `localhost` trên cổng Gateway đã publish để dashboard cục bộ hoạt động với bind không phải loopback của container.

Các biến môi trường hữu ích cho trình khởi chạy thủ công:

- `OPENCLAW_PODMAN_CONTAINER` -- tên container (mặc định là `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- image cần chạy
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- cổng máy chủ ánh xạ tới container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- cổng máy chủ ánh xạ tới container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interface máy chủ cho các cổng đã publish; mặc định là `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- chế độ bind của Gateway bên trong container; mặc định là `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (mặc định), `auto`, hoặc `host`

Trình khởi chạy thủ công đọc `~/.openclaw/.env` trước khi hoàn tất các mặc định container/image, nên bạn có thể lưu chúng bền vững tại đó.

Nếu bạn dùng `OPENCLAW_CONFIG_DIR` hoặc `OPENCLAW_WORKSPACE_DIR` không mặc định, hãy đặt cùng các biến đó cho cả `./scripts/podman/setup.sh` và các lệnh `./scripts/run-openclaw-podman.sh launch` sau này. Trình khởi chạy cục bộ trong repo không lưu bền vững các ghi đè đường dẫn tùy chỉnh giữa các shell.

Ghi chú Quadlet:

- Dịch vụ Quadlet được tạo cố ý giữ một hình dạng mặc định cố định và được gia cố: các cổng publish trên `127.0.0.1`, `--bind lan` bên trong container, và namespace người dùng `keep-id`.
- Nó ghim `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, và `TimeoutStartSec=300`.
- Nó publish cả `127.0.0.1:18789:18789` (Gateway) và `127.0.0.1:18790:18790` (bridge).
- Nó đọc `~/.openclaw/.env` dưới dạng `EnvironmentFile` runtime cho các giá trị như `OPENCLAW_GATEWAY_TOKEN`, nhưng không tiêu thụ danh sách cho phép ghi đè riêng cho Podman của trình khởi chạy thủ công.
- Nếu bạn cần cổng publish tùy chỉnh, máy chủ publish, hoặc các cờ chạy container khác, hãy dùng trình khởi chạy thủ công hoặc chỉnh sửa trực tiếp `~/.config/containers/systemd/openclaw.container`, rồi reload và restart dịch vụ.

## Lệnh hữu ích

- **Nhật ký container:** `podman logs -f openclaw`
- **Dừng container:** `podman stop openclaw`
- **Xóa container:** `podman rm -f openclaw`
- **Mở URL dashboard từ CLI trên máy chủ:** `openclaw dashboard --no-open`
- **Sức khỏe/trạng thái qua CLI trên máy chủ:** `openclaw gateway status --deep` (RPC probe + quét
  dịch vụ bổ sung)

## Khắc phục sự cố

- **Bị từ chối quyền (EACCES) trên cấu hình hoặc workspace:** Container mặc định chạy với `--userns=keep-id` và `--user <your uid>:<your gid>`. Hãy đảm bảo các đường dẫn cấu hình/workspace trên máy chủ thuộc sở hữu của người dùng hiện tại của bạn.
- **Gateway bị chặn khi khởi động (thiếu `gateway.mode=local`):** Hãy đảm bảo `~/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` tạo tệp này nếu còn thiếu.
- **Các lệnh CLI container trỏ nhầm đích:** Dùng rõ ràng `openclaw --container <name> ...`, hoặc export `OPENCLAW_CONTAINER=<name>` trong shell của bạn.
- **`openclaw update` thất bại với `--container`:** Đúng như dự kiến. Dựng lại/pull image, rồi khởi động lại container hoặc dịch vụ Quadlet.
- **Dịch vụ Quadlet không khởi động:** Chạy `systemctl --user daemon-reload`, rồi `systemctl --user start openclaw.service`. Trên các hệ thống không có màn hình, bạn cũng có thể cần `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux chặn bind mount:** Giữ nguyên hành vi mount mặc định; trình khởi chạy tự động thêm `:Z` trên Linux khi SELinux đang ở chế độ enforcing hoặc permissive.

## Liên quan

- [Docker](/vi/install/docker)
- [Tiến trình nền Gateway](/vi/gateway/background-process)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)

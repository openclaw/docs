---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container bằng Podman thay vì Docker
summary: Chạy OpenClaw trong container Podman không cần quyền root
title: Podman
x-i18n:
    generated_at: "2026-07-12T08:01:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Chạy OpenClaw Gateway trong một container Podman không cần quyền root, do người dùng hiện tại không có quyền root của bạn quản lý.

Mô hình:

- Podman chạy container Gateway.
- CLI `openclaw` trên máy chủ của bạn là mặt phẳng điều khiển.
- Theo mặc định, trạng thái bền vững nằm trên máy chủ tại `~/.openclaw`.
- Việc quản lý hằng ngày sử dụng `openclaw --container <name> ...` thay vì `sudo -u openclaw`, `podman exec` hoặc một người dùng dịch vụ riêng biệt.

## Điều kiện tiên quyết

- **Podman** ở chế độ không cần quyền root
- **CLI OpenClaw** được cài đặt trên máy chủ
- **Tùy chọn:** `systemd --user` nếu bạn muốn tự động khởi động do Quadlet quản lý
- **Tùy chọn:** chỉ cần `sudo` nếu bạn muốn dùng `loginctl enable-linger "$(whoami)"` để duy trì hoạt động sau khi khởi động trên máy chủ không có màn hình

## Bắt đầu nhanh

<Steps>
  <Step title="Thiết lập một lần">
    Từ thư mục gốc của kho mã, chạy `./scripts/podman/setup.sh`.

    Thao tác này xây dựng `openclaw:local` trong kho Podman không cần quyền root của bạn (hoặc kéo `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` nếu được đặt), tạo `~/.openclaw/openclaw.json` với `gateway.mode: "local"` nếu chưa có và tạo `~/.openclaw/.env` với một `OPENCLAW_GATEWAY_TOKEN` được tạo tự động nếu chưa có.

    Các biến môi trường tùy chọn khi xây dựng:

    | Biến | Tác dụng |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Sử dụng ảnh hiện có/được kéo thay vì xây dựng `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Cài đặt các gói apt bổ sung trong quá trình xây dựng ảnh (cũng chấp nhận biến cũ `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Cài đặt các gói Python bổ sung trong quá trình xây dựng ảnh; hãy ghim phiên bản và chỉ sử dụng các chỉ mục gói mà bạn tin cậy |
    | `OPENCLAW_EXTENSIONS` | Biên dịch/đóng gói các plugin được hỗ trợ đã chọn và cài đặt các phần phụ thuộc thời gian chạy của chúng |
    | `OPENCLAW_INSTALL_BROWSER` | Cài đặt sẵn Chromium và Xvfb để tự động hóa trình duyệt (đặt thành `1`) |

    Để thay vào đó sử dụng thiết lập do Quadlet quản lý (chỉ dành cho Linux + dịch vụ người dùng systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Hoặc đặt `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Khởi động container Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Khởi động container bằng uid/gid hiện tại của bạn với `--userns=keep-id` và gắn kết trạng thái OpenClaw của bạn vào container.

  </Step>

  <Step title="Chạy quy trình làm quen bên trong container">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Sau đó mở `http://127.0.0.1:18789/` và sử dụng token từ `~/.openclaw/.env`.

    Xác thực mô hình: sử dụng cơ chế xác thực do OpenClaw quản lý trong quá trình thiết lập (khóa API Anthropic hoặc xác thực OAuth trình duyệt/mã thiết bị OpenAI Codex cho OpenAI sử dụng Codex). Trình khởi chạy Podman không gắn kết các thư mục thông tin xác thực CLI trên máy chủ như `~/.claude` hoặc `~/.codex` vào container thiết lập hoặc Gateway. Các phiên đăng nhập CLI hiện có trên máy chủ chỉ là đường dẫn tiện lợi trên cùng máy chủ -- đối với bản cài đặt trong container, hãy lưu thông tin xác thực nhà cung cấp trong trạng thái `~/.openclaw` được gắn kết mà quy trình thiết lập quản lý.

  </Step>

  <Step title="Quản lý container đang chạy từ CLI trên máy chủ">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    Sau đó, các lệnh `openclaw` thông thường sẽ tự động chạy bên trong container đó:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # bao gồm quét dịch vụ bổ sung
    openclaw doctor
    openclaw channels login
    ```

    Trên macOS, máy Podman có thể khiến trình duyệt có vẻ không phải cục bộ đối với Gateway. Nếu Giao diện điều khiển báo cáo lỗi xác thực thiết bị sau khi khởi chạy, hãy sử dụng hướng dẫn về Tailscale trong [Podman và Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Trình khởi chạy thủ công chỉ đọc một danh sách cho phép nhỏ gồm các khóa liên quan đến Podman từ `~/.openclaw/.env` và truyền các biến môi trường thời gian chạy tường minh vào container; nó không chuyển toàn bộ tệp môi trường cho Podman.

<a id="podman-and-tailscale"></a>

## Podman và Tailscale

Để truy cập HTTPS hoặc truy cập trình duyệt từ xa, hãy làm theo tài liệu Tailscale chính.

Lưu ý dành riêng cho Podman:

- Giữ máy chủ xuất bản của Podman ở `127.0.0.1`.
- Ưu tiên `tailscale serve` do máy chủ quản lý thay vì `openclaw gateway --tailscale serve`.
- Trên macOS, nếu ngữ cảnh xác thực thiết bị của trình duyệt cục bộ không đáng tin cậy, hãy sử dụng quyền truy cập Tailscale thay vì các giải pháp đường hầm cục bộ tạm thời.

Xem [Tailscale](/vi/gateway/tailscale) và [Giao diện điều khiển](/vi/web/control-ui).

## Systemd (Quadlet, tùy chọn)

Nếu bạn đã chạy `./scripts/podman/setup.sh --quadlet`, quy trình thiết lập sẽ cài đặt một tệp Quadlet tại `~/.config/containers/systemd/openclaw.container`.

| Hành động | Lệnh                                       |
| --------- | ------------------------------------------ |
| Khởi động | `systemctl --user start openclaw.service`  |
| Dừng      | `systemctl --user stop openclaw.service`   |
| Trạng thái | `systemctl --user status openclaw.service` |
| Nhật ký   | `journalctl --user -u openclaw.service -f` |

Sau khi chỉnh sửa tệp Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Để duy trì hoạt động sau khi khởi động trên máy chủ SSH/không có màn hình, hãy bật chế độ duy trì cho người dùng hiện tại của bạn:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Dịch vụ Quadlet được tạo giữ một cấu hình mặc định cố định và được tăng cường bảo mật: các cổng được xuất bản trên `127.0.0.1` (`18789` cho Gateway, `18790` cho cầu nối), `--bind lan` bên trong container, không gian tên người dùng `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` và `TimeoutStartSec=300`. Dịch vụ đọc `~/.openclaw/.env` dưới dạng `EnvironmentFile` thời gian chạy cho các giá trị như `OPENCLAW_GATEWAY_TOKEN`, nhưng không sử dụng danh sách cho phép ghi đè dành riêng cho Podman của trình khởi chạy thủ công. Đối với cổng xuất bản tùy chỉnh, máy chủ xuất bản hoặc các cờ chạy container khác, hãy sử dụng trình khởi chạy thủ công hoặc chỉnh sửa trực tiếp `~/.config/containers/systemd/openclaw.container`, sau đó tải lại và khởi động lại dịch vụ.

## Cấu hình, môi trường và lưu trữ

- **Thư mục cấu hình:** `~/.openclaw`
- **Thư mục không gian làm việc:** `~/.openclaw/workspace`
- **Tệp token:** `~/.openclaw/.env`
- **Trình trợ giúp khởi chạy:** `./scripts/run-openclaw-podman.sh`

Tập lệnh khởi chạy và Quadlet gắn kết trạng thái máy chủ vào container: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Theo mặc định, đây là các thư mục trên máy chủ, không phải trạng thái container ẩn danh, vì vậy `openclaw.json`, `auth-profiles.json` theo từng tác nhân, trạng thái kênh/nhà cung cấp, phiên và không gian làm việc vẫn tồn tại sau khi thay thế container. Quy trình thiết lập cũng khởi tạo `gateway.controlUi.allowedOrigins` cho `127.0.0.1` và `localhost` trên cổng Gateway được xuất bản để bảng điều khiển cục bộ hoạt động với liên kết không phải local loopback của container.

Các biến môi trường hữu ích cho trình khởi chạy thủ công (lưu các biến này trong `~/.openclaw/.env`; trình khởi chạy đọc tệp đó trước khi hoàn tất các giá trị mặc định của container/ảnh):

| Biến                                       | Mặc định         | Tác dụng                                      |
| ------------------------------------------ | ---------------- | --------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | Tên container                                 |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | Ảnh cần chạy                                  |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | Cổng máy chủ được ánh xạ tới cổng `18789` của container |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | Cổng máy chủ được ánh xạ tới cổng `18790` của container |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | Giao diện máy chủ cho các cổng được xuất bản  |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | Chế độ liên kết Gateway bên trong container   |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` hoặc `host`                 |

Nếu bạn sử dụng `OPENCLAW_CONFIG_DIR` hoặc `OPENCLAW_WORKSPACE_DIR` không mặc định, hãy đặt cùng các biến cho cả `./scripts/podman/setup.sh` và các lệnh `./scripts/run-openclaw-podman.sh launch` sau đó -- trình khởi chạy cục bộ của kho mã không duy trì các ghi đè đường dẫn tùy chỉnh giữa các shell.

## Nâng cấp ảnh

Sau khi xây dựng lại hoặc kéo ảnh mới, hãy khởi động lại container hoặc dịch vụ Quadlet.
Trong lần khởi động đầu tiên của một phiên bản OpenClaw mới, Gateway chạy các thao tác sửa chữa an toàn cho trạng thái và plugin trước khi báo cáo là sẵn sàng.

Nếu Gateway thoát thay vì chuyển sang trạng thái sẵn sàng, hãy chạy cùng ảnh đó một lần với
`openclaw doctor --fix` trên cùng trạng thái/cấu hình được gắn kết, sau đó khởi động lại
Gateway theo cách thông thường:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Trên các máy chủ SELinux, hãy thêm `,Z` vào cả hai điểm gắn kết nếu Podman chặn quyền truy cập vào
trạng thái được gắn kết.

## Các lệnh hữu ích

- **Nhật ký container:** `podman logs -f openclaw`
- **Dừng container:** `podman stop openclaw`
- **Xóa container:** `podman rm -f openclaw`
- **Mở URL bảng điều khiển từ CLI trên máy chủ:** `openclaw dashboard --no-open`
- **Tình trạng/trạng thái qua CLI trên máy chủ:** `openclaw gateway status --deep` (thăm dò RPC + quét dịch vụ bổ sung)

## Khắc phục sự cố

- **Quyền bị từ chối (EACCES) trên cấu hình hoặc không gian làm việc:** Theo mặc định, container chạy với `--userns=keep-id` và `--user <uid của bạn>:<gid của bạn>`. Đảm bảo các đường dẫn cấu hình/không gian làm việc trên máy chủ thuộc quyền sở hữu của người dùng hiện tại.
- **Khởi động Gateway bị chặn (thiếu `gateway.mode=local`):** Đảm bảo `~/.openclaw/openclaw.json` tồn tại và đặt `gateway.mode="local"`. `scripts/podman/setup.sh` sẽ tạo tệp này nếu chưa có.
- **Container khởi động lại sau khi cập nhật ảnh:** Chạy lệnh `openclaw doctor --fix` dùng một lần trong [Nâng cấp ảnh](#upgrading-images), sau đó khởi động lại Gateway.
- **Các lệnh CLI của container nhắm sai đích:** Sử dụng tường minh `openclaw --container <name> ...` hoặc xuất `OPENCLAW_CONTAINER=<name>` trong shell của bạn.
- **`openclaw update` thất bại với `--container`:** Đây là hành vi dự kiến. Xây dựng lại/kéo ảnh, sau đó khởi động lại container hoặc dịch vụ Quadlet.
- **Dịch vụ Quadlet không khởi động:** Chạy `systemctl --user daemon-reload`, sau đó chạy `systemctl --user start openclaw.service`. Trên các hệ thống không có màn hình, bạn cũng có thể cần `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux chặn các điểm gắn kết:** Giữ nguyên hành vi gắn kết mặc định; trình khởi chạy tự động thêm `:Z` trên Linux khi SELinux ở chế độ thực thi hoặc cho phép.

## Liên quan

- [Docker](/vi/install/docker)
- [Tiến trình nền của Gateway](/vi/gateway/background-process)
- [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting)

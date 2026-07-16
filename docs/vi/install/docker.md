---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì cài đặt cục bộ
    - Bạn đang xác thực quy trình Docker
summary: Thiết lập và làm quen với OpenClaw bằng Docker (không bắt buộc)
title: Docker
x-i18n:
    generated_at: "2026-07-16T14:37:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Hãy dùng Docker để có một môi trường Gateway biệt lập, dùng một lần rồi bỏ, hoặc trên máy chủ không có các bản cài đặt cục bộ. Nếu bạn đã phát triển trên máy của mình, hãy dùng quy trình cài đặt thông thường.

Backend sandbox mặc định sử dụng Docker khi `agents.defaults.sandbox` được bật, nhưng sandbox mặc định bị tắt và không yêu cầu bản thân Gateway phải chạy trong Docker. Các backend sandbox SSH và OpenShell cũng khả dụng; xem [Sandbox](/vi/gateway/sandboxing).

Đang lưu trữ cho nhiều người dùng? Xem [Lưu trữ đa đối tượng thuê](/vi/gateway/multi-tenant-hosting) để biết mô hình một cell cho mỗi đối tượng thuê.

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để dựng image (`pnpm install` có thể bị kết thúc do OOM trên máy chủ 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và nhật ký
- Trên VPS/máy chủ công khai, hãy xem lại [Tăng cường bảo mật khi tiếp xúc mạng](/vi/gateway/security), đặc biệt là chuỗi tường lửa Docker `DOCKER-USER`

## Gateway được đóng gói trong container

<Steps>
  <Step title="Dựng image">
    Từ thư mục gốc của repo:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này dựng image Gateway cục bộ dưới tên `openclaw:local`. Để sử dụng image dựng sẵn thay thế:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Các image dựng sẵn được phát hành trước tiên lên [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR là registry chính cho tự động hóa bản phát hành, các bản triển khai được ghim phiên bản và kiểm tra nguồn gốc. Cùng bản phát hành đó cũng xuất bản một bản sao trên Docker Hub tại `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Hãy dùng `ghcr.io/openclaw/openclaw` hoặc `openclaw/openclaw` và tránh các bản sao không chính thức vì chúng không có cùng lịch phát hành hoặc chính sách lưu giữ với OpenClaw. Các thẻ chính thức: `main`, `latest`, `<version>` (ví dụ: `2026.2.26`) và các thẻ beta như `2026.2.26-beta.1` (bản beta không bao giờ di chuyển `latest`/`main`). Image `main`/`latest`/`<version>` mặc định đi kèm các plugin `codex` và `diagnostics-otel`. Một biến thể `-browser` (ví dụ: `latest-browser`) cũng được cung cấp với Chromium tích hợp sẵn, hữu ích cho công cụ [trình duyệt trong sandbox](/vi/gateway/sandboxing#sandboxed-browser) mà không cần cài đặt Playwright ở lần chạy đầu tiên.

  </Step>

  <Step title="Chạy lại trong môi trường cách ly mạng">
    Trên máy chủ ngoại tuyến, trước tiên hãy chuyển và nạp image:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` xác minh rằng `OPENCLAW_IMAGE` đã tồn tại cục bộ, vô hiệu hóa các thao tác kéo/dựng ngầm định của Compose, rồi chạy quy trình thông thường: đồng bộ `.env`, sửa quyền, thiết lập ban đầu, đồng bộ cấu hình Gateway, khởi động Compose.

    Nếu `OPENCLAW_SANDBOX=1`, quá trình thiết lập ngoại tuyến cũng kiểm tra các image sandbox mặc định và theo từng agent đã cấu hình trên daemon phía sau `OPENCLAW_DOCKER_SOCKET`, bao gồm nhãn hợp đồng trình duyệt trên các image trình duyệt dựa trên Docker. Nếu một image bắt buộc bị thiếu hoặc lỗi thời, quá trình thiết lập sẽ thoát mà không thay đổi cấu hình sandbox, thay vì báo thành công trong trạng thái hỏng.

  </Step>

  <Step title="Hoàn tất thiết lập ban đầu">
    Script thiết lập tự động chạy quá trình thiết lập ban đầu:

    - yêu cầu khóa API của nhà cung cấp
    - tạo token Gateway và ghi vào `.env`
    - tạo thư mục khóa bí mật cho hồ sơ xác thực
    - khởi động Gateway qua Docker Compose

    Quá trình thiết lập ban đầu trước khi khởi động và thao tác ghi cấu hình chạy trực tiếp qua `openclaw-gateway` (với `--no-deps --entrypoint node`), vì `openclaw-cli` dùng chung namespace mạng của Gateway và chỉ hoạt động sau khi container Gateway tồn tại.

  </Step>

  <Step title="Mở giao diện điều khiển">
    Mở `http://127.0.0.1:18789/` và dán token được ghi vào `.env` vào Settings. Nếu bạn đã chuyển container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

    Cần lại URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Cấu hình các kênh (tùy chọn)">
    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Tài liệu: [WhatsApp](/vi/channels/whatsapp), [Telegram](/vi/channels/telegram), [Discord](/vi/channels/discord)

  </Step>
</Steps>

### Quy trình thủ công

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Ngữ cảnh Docker loại trừ `.git`. Hãy truyền danh tính nguồn dưới dạng các đối số dựng
như minh họa ở trên để màn hình Giới thiệu của image báo cáo commit đã checkout và
một dấu thời gian dựng. `scripts/docker/setup.sh` tự động phân giải và truyền cả hai giá trị.

<Note>
Chạy `docker compose` từ thư mục gốc của repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS` hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`; hãy đưa tệp này vào sau mọi `docker-compose.override.yml` mà bạn tự duy trì, ví dụ: `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Nâng cấp image container

Khi bạn thay thế image OpenClaw nhưng giữ nguyên trạng thái/cấu hình đã gắn kết,
Gateway mới sẽ chạy các quá trình di chuyển nâng cấp an toàn khi khởi động và đồng bộ plugin trước khi
sẵn sàng. Việc nâng cấp image thông thường không cần một lượt chạy
`openclaw doctor --fix` riêng biệt.

Nếu quá trình khởi động không thể hoàn tất các sửa chữa đó một cách an toàn, Gateway sẽ thoát thay vì
báo trạng thái khỏe mạnh. Khi có chính sách khởi động lại, Docker, Podman hoặc Kubernetes có thể hiển thị
container Gateway đang khởi động lại. Giữ nguyên volume trạng thái đã gắn kết, sau đó chạy
cùng image đó một lần với `openclaw doctor --fix` làm lệnh của container, sử dụng
cùng các điểm gắn kết trạng thái/cấu hình mà Gateway sử dụng:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Sau khi doctor hoàn tất, hãy khởi động lại container Gateway bằng lệnh mặc định của nó.
Trong Kubernetes, hãy chạy cùng lệnh đó trong một Job dùng một lần hoặc pod gỡ lỗi được gắn vào
cùng PVC, rồi khởi động lại Deployment hoặc StatefulSet.

### Biến môi trường

Các biến tùy chọn được `scripts/docker/setup.sh` chấp nhận (và được `docker-compose.yml` chấp nhận trực tiếp đối với container Gateway):

| Biến                                            | Mục đích                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Dùng image từ xa thay vì dựng cục bộ                                                                               |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Cài đặt thêm các gói apt trong khi dựng (phân tách bằng dấu cách). Bí danh cũ: `OPENCLAW_DOCKER_APT_PACKAGES`      |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Cài đặt thêm các gói Python trong khi dựng (phân tách bằng dấu cách)                                               |
| `OPENCLAW_EXTENSIONS`                           | Biên dịch/đóng gói các plugin được hỗ trợ đã chọn và cài đặt các phần phụ thuộc thời gian chạy của chúng (các id phân tách bằng dấu phẩy hoặc dấu cách) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Ghi đè các tùy chọn Node cho bản dựng nguồn cục bộ (mặc định `--max-old-space-size=8192`)                           |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Ghi đè heap tsdown của bản dựng nguồn cục bộ theo MB                                                               |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Bỏ qua đầu ra khai báo trong các bản dựng image cục bộ chỉ dành cho thời gian chạy (mặc định `1`)              |
| `OPENCLAW_INSTALL_BROWSER`                      | Tích hợp Chromium + Xvfb vào image tại thời điểm dựng                                                              |
| `OPENCLAW_EXTRA_MOUNTS`                         | Các điểm gắn kết liên kết bổ sung từ máy chủ (các `source:target[:opts]` phân tách bằng dấu phẩy)                  |
| `OPENCLAW_HOME_VOLUME`                          | Lưu bền vững `/home/node` trong một volume Docker có tên                                                           |
| `OPENCLAW_SANDBOX`                              | Chọn tham gia khởi tạo sandbox (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Bỏ qua bước thiết lập ban đầu tương tác (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Ghi đè đường dẫn socket Docker                                                                                     |
| `OPENCLAW_DISABLE_BONJOUR`                      | Buộc bật (`0`) hoặc tắt (`1`) quảng bá Bonjour/mDNS; xem [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Vô hiệu hóa các lớp phủ gắn kết nguồn của plugin đi kèm                                                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Điểm cuối trình thu thập OTLP/HTTP dùng chung để xuất OpenTelemetry                                                |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Các điểm cuối OTLP dành riêng cho từng tín hiệu đối với dấu vết, số liệu hoặc nhật ký                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Ghi đè giao thức OTLP. Hiện tại chỉ hỗ trợ `http/protobuf`                                                        |
| `OTEL_SERVICE_NAME`                             | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                                                                      |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Chọn tham gia sử dụng các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Bỏ qua việc khởi động OpenTelemetry SDK thứ hai khi một SDK đã được tải trước                                      |

Image chính thức không đi kèm Homebrew. Trong quá trình thiết lập ban đầu, OpenClaw ẩn các trình cài đặt phần phụ thuộc của skill chỉ dành cho brew trong container Linux không có `brew`; hãy cung cấp các phần phụ thuộc đó qua image tùy chỉnh hoặc cài đặt thủ công. Dùng `OPENCLAW_IMAGE_APT_PACKAGES` cho các phần phụ thuộc được đóng gói bằng Debian và `OPENCLAW_IMAGE_PIP_PACKAGES` cho các phần phụ thuộc Python (chạy `python3 -m pip install --break-system-packages` tại thời điểm dựng, vì vậy hãy ghim phiên bản và chỉ dùng các chỉ mục mà bạn tin cậy).

Nếu Docker báo cáo `ResourceExhausted`, `cannot allocate memory` hoặc hủy trong khi `tsdown`, hãy tăng giới hạn bộ nhớ của trình dựng Docker hoặc thử lại với các heap tường minh nhỏ hơn:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Image dựng từ nguồn với các plugin được chọn

`OPENCLAW_EXTENSIONS` chọn các id manifest Plugin từ checkout nguồn;
các tên thư mục nguồn hiện có cũng được chấp nhận khi chúng khác nhau. Bản dựng Docker
phân giải lựa chọn thành các thư mục nguồn một lần, cài đặt các phần phụ thuộc
production, và khi một Plugin được chọn được phát hành riêng với
`openclaw.build.bundledDist: false`, biên dịch runtime của Plugin đó vào dist đóng gói
gốc. Cách đóng gói chỉ dành cho Docker này không thay đổi hợp đồng artifact npm hoặc ClawHub
của Plugin. Các id không xác định, không hợp lệ hoặc không rõ ràng khiến quá trình dựng image thất bại.
Các id chỉ dành cho phần phụ thuộc/nguồn đã biết giữ nguyên cách phân chia giai đoạn nguồn và phần phụ thuộc
hiện có mà không có thêm mục dist gốc đã biên dịch. Một Plugin được chọn có
các mục dựng hợp nhất phải biên dịch thành công; nguồn và đầu ra runtime của Plugin
bên ngoài không được chọn sẽ bị loại bỏ.

Ví dụ: các lệnh này dựng các image Gateway FakeCo độc lập, đa kiến trúc
riêng biệt cho ClickClack, Slack và Microsoft Teams. ClawRouter đã
là một phần của runtime OpenClaw gốc, vì vậy image ClickClack chỉ chọn
`clickclack`. Đối số trình duyệt rỗng tường minh giúp image mặc định không chứa
Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Dùng `--platform linux/arm64 --load` hoặc `--platform linux/amd64 --load` cho một
bản dựng cục bộ native đơn lẻ. Đầu ra đa nền tảng và SBOM/provenance đính kèm
yêu cầu một registry hoặc đầu ra Buildx khác có khả năng giữ nguyên các chứng thực. Sau khi
đẩy lên, hãy kiểm tra manifest và triển khai digest bất biến thay vì
thẻ source-SHA có thể thay đổi:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Triển khai: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Các image này dành cho Gateway độc lập dựa trên OCI và người dùng Docker nói chung.
Các Gateway do Crabhelm quản lý không sử dụng chúng: đường phân phối đó dựng một
kho lưu trữ appliance x86_64 riêng chứa tarball npm OpenClaw và ghim
digest của Node, kho lưu trữ và manifest. Hãy dựng appliance đó độc lập
từ cùng nguồn OpenClaw đã được hợp nhất.

Để kiểm thử nguồn Plugin đóng gói cùng một image đã đóng gói, hãy gắn một thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói của Plugin đó, ví dụ `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Thao tác này ghi đè bundle `/app/dist/extensions/synology-chat` đã biên dịch tương ứng cho cùng id Plugin.

### Khả năng quan sát

Việc xuất OpenTelemetry đi ra từ container Gateway tới trình thu thập OTLP của bạn; không cần công bố cổng Docker. Để bao gồm trình xuất đóng gói trong một image dựng cục bộ:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Các image dựng sẵn chính thức đã đóng gói `diagnostics-otel`; chỉ tự cài đặt `clawhub:@openclaw/diagnostics-otel` nếu bạn đã xóa nó. Để bật tính năng xuất, hãy cho phép và bật Plugin `diagnostics-otel` trong cấu hình, sau đó đặt `diagnostics.otel.enabled=true` (xem ví dụ đầy đủ trong [Xuất OpenTelemetry](/vi/gateway/opentelemetry)). Các header xác thực của trình thu thập đi qua `diagnostics.otel.headers`, không phải các biến môi trường Docker.

Chỉ số Prometheus sử dụng lại cổng Gateway đã được công bố. Cài đặt `clawhub:@openclaw/diagnostics-prometheus`, bật Plugin `diagnostics-prometheus`, sau đó thu thập:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Tuyến được bảo vệ bằng xác thực Gateway; không công khai một cổng `/metrics` riêng hoặc đường dẫn reverse proxy không xác thực. Xem [Chỉ số Prometheus](/vi/gateway/prometheus).

### Kiểm tra tình trạng

Các endpoint thăm dò container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # khả năng hoạt động
curl -fsS http://127.0.0.1:18789/readyz     # trạng thái sẵn sàng
```

`HEALTHCHECK` tích hợp sẵn của image gửi ping tới `/healthz`; các lần thất bại liên tiếp đánh dấu container là `unhealthy` để các trình điều phối có thể khởi động lại hoặc thay thế container.

Ảnh chụp nhanh tình trạng chuyên sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN và loopback

`scripts/docker/setup.sh` mặc định là `OPENCLAW_GATEWAY_BIND=lan` để `http://127.0.0.1:18789` trên máy chủ hoạt động với việc công bố cổng Docker.

- `lan` (mặc định): trình duyệt và CLI trên máy chủ có thể truy cập cổng Gateway đã công bố.
- `loopback`: chỉ các tiến trình bên trong không gian tên mạng của container mới có thể truy cập trực tiếp Gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), không dùng bí danh máy chủ như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Các provider cục bộ trên máy chủ

Bên trong container, `127.0.0.1` là chính container, không phải máy chủ. Dùng `host.docker.internal` cho các provider chạy trên máy chủ:

| Provider  | URL mặc định trên máy chủ | URL thiết lập Docker                |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Thiết lập đóng gói dùng các URL đó làm giá trị mặc định khi bắt đầu sử dụng LM Studio/Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới Gateway máy chủ trên Linux Docker Engine (Docker Desktop cung cấp cùng bí danh trên macOS/Windows). Các dịch vụ trên máy chủ phải lắng nghe trên một địa chỉ mà Docker có thể truy cập:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Bạn đang dùng tệp Compose riêng hoặc `docker run`? Hãy tự thêm cùng ánh xạ đó, ví dụ `--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI trong Docker

Image chính thức không cài đặt sẵn Claude Code. Hãy cài đặt và đăng nhập bên trong người dùng `node` của container, sau đó duy trì thư mục home của container đó để các lần nâng cấp image không xóa tệp nhị phân hoặc trạng thái xác thực.

Đối với bản cài đặt mới, hãy bật volume `/home/node` bền vững trước khi chạy thiết lập:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Đối với bản cài đặt hiện có, trước tiên hãy dừng stack và nạp lại các giá trị `.env` hiện tại — tập lệnh thiết lập luôn ghi lại `.env` từ shell và các giá trị mặc định hiện tại, nó không tự đọc tệp:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Nếu `.env` chứa các giá trị mà shell của bạn không thể nạp, trước tiên hãy xuất lại thủ công những gì bạn sử dụng (`OPENCLAW_IMAGE`, các cổng, chế độ bind, đường dẫn tùy chỉnh, `OPENCLAW_EXTRA_MOUNTS`, sandbox, bỏ qua bước bắt đầu sử dụng). Lớp phủ được tạo sẽ gắn volume home cho cả `openclaw-gateway` và `openclaw-cli`; hãy chạy các lệnh còn lại với lớp phủ đó (và `docker-compose.override.yml` trước, nếu bạn dùng):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Trình cài đặt native ghi `claude` vào `/home/node/.local/bin/claude`. Hãy trỏ OpenClaw tới đường dẫn đó:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Đăng nhập và xác minh từ cùng thư mục home bền vững:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Sau đó dùng backend `claude-cli` đóng gói sẵn:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Xin chào từ Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` duy trì bản cài đặt native trong `/home/node/.local/bin` và `/home/node/.local/share/claude`, cùng với cài đặt/xác thực Claude Code trong `/home/node/.claude` và `/home/node/.claude.json`. Chỉ duy trì `/home/node/.openclaw` là chưa đủ; nếu bạn dùng `OPENCLAW_EXTRA_MOUNTS` thay cho volume home, hãy gắn tất cả các đường dẫn Claude đó vào cả hai dịch vụ.

<Note>
Đối với hoạt động tự động hóa production dùng chung hoặc việc thanh toán Anthropic có thể dự đoán được, hãy ưu tiên đường dẫn khóa API Anthropic. Việc tái sử dụng Claude CLI tuân theo phiên bản đã cài đặt, thông tin đăng nhập tài khoản, cách tính phí và hành vi cập nhật của Claude Code.
</Note>

### Bonjour / mDNS

Mạng bridge Docker thường không chuyển tiếp multicast Bonjour/mDNS (`224.0.0.251:5353`) một cách đáng tin cậy. Khi `OPENCLAW_DISABLE_BONJOUR` chưa được đặt, Plugin Bonjour đóng gói sẵn sẽ tự động tắt quảng bá LAN khi phát hiện đang chạy trong container, để không rơi vào vòng lặp lỗi do liên tục thử lại multicast mà bridge loại bỏ. Đặt `OPENCLAW_DISABLE_BONJOUR=1` để buộc tắt bất kể kết quả phát hiện, hoặc `0` để buộc bật (chỉ trên mạng máy chủ, macvlan hoặc mạng khác mà multicast mDNS được xác nhận là hoạt động).

Nếu không, hãy dùng URL Gateway đã công bố, Tailscale hoặc DNS-SD diện rộng cho các máy chủ Docker. Xem [Khám phá Bonjour](/vi/gateway/bonjour) để biết các điểm cần lưu ý và cách khắc phục sự cố.

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace` và `OPENCLAW_AUTH_PROFILE_SECRET_DIR` vào `/home/node/.config/openclaw`, để các đường dẫn đó tồn tại sau khi thay thế container. Khi một biến chưa được đặt, `docker-compose.yml` dùng giá trị dự phòng bên dưới `${HOME}`, hoặc `/tmp` nếu chính `HOME` cũng bị thiếu, để `docker compose up` không bao giờ tạo đặc tả volume có nguồn rỗng trong các môi trường cơ bản.

Thư mục cấu hình được gắn đó chứa:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/khóa API của provider đã lưu trữ
- `.env` cho các thông tin bí mật runtime lấy từ môi trường như `OPENCLAW_GATEWAY_TOKEN`

Thư mục bí mật của hồ sơ xác thực lưu khóa mã hóa cục bộ cho dữ liệu token của hồ sơ xác thực dựa trên OAuth. Giữ thư mục này cùng trạng thái máy chủ Docker, nhưng tách biệt khỏi `OPENCLAW_CONFIG_DIR`.

Các Plugin có thể tải xuống đã cài đặt lưu trạng thái gói dưới thư mục home OpenClaw được gắn, vì vậy bản ghi cài đặt và thư mục gốc gói vẫn tồn tại sau khi thay thế container; quá trình khởi động Gateway không tạo lại cây phần phụ thuộc của Plugin đóng gói sẵn.

Để biết đầy đủ chi tiết về duy trì dữ liệu VM, xem [Runtime VM Docker - Những gì được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Các điểm nóng tăng dung lượng đĩa:** `media/`, cơ sở dữ liệu SQLite theo từng agent, bản chép lời phiên JSONL cũ, cơ sở dữ liệu trạng thái SQLite dùng chung, thư mục gốc gói Plugin đã cài đặt và nhật ký tệp luân phiên trong `/tmp/openclaw/`.

### Trình trợ giúp shell (tùy chọn)

Để rút gọn các lệnh hằng ngày, hãy cài đặt [ClawDock](/vi/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài đặt từ đường dẫn `scripts/shell-helpers/clawdock-helpers.sh` cũ hơn, hãy chạy lại lệnh ở trên để trình trợ giúp cục bộ theo dõi vị trí hiện tại. Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. (chạy `clawdock-help` để xem danh sách đầy đủ).

<AccordionGroup>
  <Accordion title="Bật sandbox của agent cho Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Đường dẫn socket tùy chỉnh (ví dụ: Docker không có quyền root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Tập lệnh chỉ gắn kết `docker.sock` sau khi các điều kiện tiên quyết của sandbox được đáp ứng. Nếu không thể hoàn tất thiết lập sandbox, tập lệnh sẽ đặt lại `agents.defaults.sandbox.mode` thành `off`. Chế độ mã Codex bị tắt trong những lượt mà sandbox OpenClaw đang hoạt động (xem [Sandbox § Phần phụ trợ Docker](/vi/gateway/sandboxing#docker-backend)); tuyệt đối không gắn kết socket Docker của máy chủ vào các container sandbox của agent.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Tắt việc cấp phát pseudo-TTY của Compose bằng `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Lưu ý bảo mật về mạng dùng chung">
    `openclaw-cli` sử dụng `network_mode: "service:openclaw-gateway"` để các lệnh CLI có thể truy cập gateway qua `127.0.0.1`. Hãy coi đây là một ranh giới tin cậy dùng chung. Cấu hình Compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật `no-new-privileges` trên cả `openclaw-gateway` lẫn `openclaw-cli`.
  </Accordion>

  <Accordion title="Lỗi DNS của Docker Desktop trong openclaw-cli">
    Một số thiết lập Docker Desktop không thể tra cứu DNS từ sidecar `openclaw-cli` dùng chung mạng sau khi loại bỏ `NET_RAW`, biểu hiện dưới dạng `EAI_AGAIN` trong các lệnh dựa trên npm như `openclaw plugins install`. Hãy giữ tệp Compose tăng cường bảo mật mặc định cho hoạt động thông thường. Phần ghi đè bên dưới khôi phục các khả năng mặc định chỉ cho container `openclaw-cli` — chỉ dùng nó cho lệnh dùng một lần cần truy cập registry, không dùng làm cách gọi mặc định:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Nếu bạn đã tạo một container `openclaw-cli` chạy lâu dài, hãy tạo lại nó với cùng phần ghi đè — `docker compose exec`/`docker exec` không thể thay đổi các khả năng Linux trên container đã được tạo.

  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới danh tính `node` (uid 1000). Nếu gặp lỗi quyền trên `/home/node/.openclaw`, hãy bảo đảm các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Sự không khớp tương tự có thể biểu hiện dưới dạng `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` theo sau bởi `plugin present but blocked` — uid của tiến trình và chủ sở hữu thư mục plugin được gắn kết không trùng khớp. Nên chạy bằng uid 1000 mặc định và sửa quyền sở hữu bind mount. Chỉ chown `/path/to/openclaw-config/npm` thành `root:root` nếu bạn chủ ý chạy OpenClaw dưới quyền root trong thời gian dài.

  </Accordion>

  <Accordion title="Xây dựng lại nhanh hơn">
    Sắp xếp Dockerfile để các lớp phụ thuộc được lưu vào bộ nhớ đệm, tránh chạy lại `pnpm install` trừ khi các tệp khóa thay đổi:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Tùy chọn container dành cho người dùng nâng cao">
    Image mặc định ưu tiên bảo mật và chạy dưới danh tính không phải root `node`. Để có container đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Tích hợp sẵn các phụ thuộc hệ thống**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Tích hợp sẵn các phụ thuộc Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Tích hợp sẵn Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`, hoặc dùng thẻ image `-browser` chính thức
    5. **Hoặc cài đặt các trình duyệt Playwright vào một volume được duy trì**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Duy trì các tệp trình duyệt đã tải xuống**: dùng `OPENCLAW_HOME_VOLUME` hoặc `OPENCLAW_EXTRA_MOUNTS`. OpenClaw tự động phát hiện Chromium do Playwright quản lý của image trên Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker không giao diện)">
    Nếu chọn OpenAI Codex OAuth trong trình hướng dẫn, hệ thống sẽ mở một URL trình duyệt. Trong Docker hoặc các thiết lập không giao diện, hãy sao chép toàn bộ URL chuyển hướng mà bạn truy cập đến rồi dán lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image cơ sở">
    Image thời gian chạy sử dụng `node:24-bookworm-slim` và chạy `tini` với PID 1 để thu hồi các tiến trình zombie và xử lý tín hiệu chính xác trong các container chạy lâu dài. Image công bố các chú thích image cơ sở OCI, bao gồm `org.opencontainers.image.base.name` và `org.opencontainers.image.source`. Dependabot làm mới digest image Node cơ sở được ghim; các bản dựng phát hành không chạy một lớp nâng cấp bản phân phối riêng. Xem [Chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và [Môi trường chạy máy ảo Docker](/vi/install/docker-vm-runtime) để biết các bước triển khai máy ảo dùng chung, bao gồm tích hợp sẵn tệp nhị phân, duy trì dữ liệu và cập nhật.

## Sandbox của agent

Khi `agents.defaults.sandbox` được bật với phần phụ trợ Docker, gateway chạy hoạt động thực thi công cụ của agent (shell, đọc/ghi tệp, v.v.) bên trong các container Docker biệt lập, trong khi bản thân gateway vẫn nằm trên máy chủ — tạo thành một bức tường cứng bao quanh các phiên agent không đáng tin cậy hoặc dùng chung cho nhiều bên thuê mà không cần container hóa toàn bộ gateway.

Phạm vi sandbox có thể là theo từng agent (mặc định), từng phiên hoặc dùng chung; mỗi phạm vi có workspace riêng được gắn kết tại `/workspace`. Bạn cũng có thể cấu hình chính sách cho phép/từ chối công cụ, cách ly mạng, giới hạn tài nguyên và container trình duyệt.

Để biết đầy đủ về cấu hình, image, lưu ý bảo mật và hồ sơ đa agent:

- [Sandbox](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về sandbox
- [OpenShell](/vi/gateway/openshell) -- quyền truy cập shell tương tác vào các container sandbox
- [Sandbox và công cụ đa agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng agent

### Bật nhanh

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Xây dựng image sandbox mặc định (từ bản checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Đối với cài đặt npm không có bản checkout mã nguồn, xem [Sandbox § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Xây dựng image sandbox bằng [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (bản checkout mã nguồn) hoặc lệnh `docker build` nội tuyến trong [Sandbox § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm), hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn. Các container được tự động tạo theo từng phiên khi có nhu cầu.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace được gắn kết, hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong sandbox">
    OpenClaw chạy lệnh bằng `sh -lc` (shell đăng nhập), thao tác này nạp `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm các đường dẫn công cụ tùy chỉnh của bạn vào đầu, hoặc thêm một tập lệnh dưới `/etc/profile.d/` trong Dockerfile.
  </Accordion>

  <Accordion title="Bị kết thúc do OOM khi xây dựng image (mã thoát 137)">
    Máy ảo cần ít nhất 2 GB RAM. Hãy dùng lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Không được ủy quyền hoặc cần ghép nối trong Control UI">
    Lấy liên kết bảng điều khiển mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Bảng điều khiển](/vi/web/dashboard), [Thiết bị](/vi/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép nối từ Docker CLI">
    Đặt lại chế độ và địa chỉ liên kết của gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan về cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — giải pháp Podman thay thế Docker
- [ClawDock](/vi/install/clawdock) — thiết lập Docker Compose của cộng đồng
- [Cập nhật](/vi/install/updating) — duy trì OpenClaw luôn ở phiên bản mới nhất
- [Cấu hình](/vi/gateway/configuration) — cấu hình gateway sau khi cài đặt

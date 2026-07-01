---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì cài đặt cục bộ
    - Bạn đang xác thực luồng Docker
summary: Thiết lập và hướng dẫn bắt đầu dựa trên Docker không bắt buộc cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:05:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng Docker nếu bạn muốn một Gateway chạy trong container hoặc muốn xác thực quy trình Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường Gateway cô lập, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một máy chủ không có các bản cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Hãy dùng quy trình cài đặt thông thường.
- **Lưu ý về tạo sandbox**: backend sandbox mặc định dùng Docker khi tính năng tạo sandbox được bật, nhưng tạo sandbox mặc định đang tắt và **không** yêu cầu toàn bộ Gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng có sẵn. Xem [Tạo sandbox](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Tối thiểu 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên máy chủ 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/máy chủ công khai, hãy xem lại
  [Gia cố bảo mật khi phơi bày ra mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway chạy trong container

<Steps>
  <Step title="Build the image">
    Từ gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build Gateway image cục bộ. Để dùng một image đã build sẵn thay thế:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image đã build sẵn được phát hành trước tiên lên
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR là registry chính cho tự động hóa phát hành, triển khai được ghim,
    và kiểm tra nguồn gốc. Cùng workflow phát hành đó cũng phát hành một bản mirror
    Docker Hub chính thức tại `openclaw/openclaw` cho các máy chủ ưu tiên Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Dùng `ghcr.io/openclaw/openclaw` hoặc `openclaw/openclaw`. Tránh các bản mirror
    Docker Hub cộng đồng vì OpenClaw không kiểm soát thời điểm phát hành,
    rebuild, hoặc chính sách lưu giữ của chúng. Các tag chính thức phổ biến: `main`, `latest`,
    `<version>` (ví dụ `2026.2.26`), và các phiên bản beta như
    `2026.2.26-beta.1`. Tag beta không di chuyển `latest` hoặc `main`.

  </Step>

  <Step title="Airgapped rerun">
    Trên máy chủ ngoại tuyến, trước tiên hãy chuyển và nạp image:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` xác minh rằng `OPENCLAW_IMAGE` đã tồn tại cục bộ, tắt
    các lần pull và build Compose ngầm định, rồi chạy quy trình thiết lập thông thường như
    đồng bộ `.env`, sửa quyền, onboarding, đồng bộ cấu hình Gateway,
    và khởi động Compose.

    Nếu `OPENCLAW_SANDBOX=1`, thiết lập ngoại tuyến cũng kiểm tra image sandbox mặc định
    đã cấu hình và image sandbox đang hoạt động theo từng agent trên daemon phía sau
    `OPENCLAW_DOCKER_SOCKET`. Các image trình duyệt dùng Docker làm backend cũng phải mang
    nhãn hợp đồng trình duyệt OpenClaw hiện tại. Khi thiếu image bắt buộc hoặc
    image không tương thích, thiết lập sẽ thoát mà không thay đổi cấu hình sandbox, thay vì
    báo thành công với một sandbox không dùng được.

  </Step>

  <Step title="Complete onboarding">
    Script thiết lập tự động chạy onboarding. Nó sẽ:

    - nhắc nhập khóa API của provider
    - tạo token Gateway và ghi vào `.env`
    - tạo thư mục khóa bí mật auth-profile
    - khởi động Gateway qua Docker Compose

    Trong khi thiết lập, onboarding trước khi khởi động và các lần ghi cấu hình chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container Gateway đã tồn tại.

  </Step>

  <Step title="Open the Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán bí mật dùng chung đã cấu hình
    vào Settings. Script thiết lập mặc định ghi một token vào `.env`; nếu bạn chuyển
    cấu hình container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

    Cần lại URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Dùng container CLI để thêm các kênh nhắn tin:

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

Nếu bạn muốn tự chạy từng bước thay vì dùng script thiết lập:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Chạy `docker compose` từ gốc repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
hãy đưa nó vào sau mọi file override tiêu chuẩn, ví dụ
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
khi cả hai file override đều tồn tại.
</Note>

<Note>
Vì `openclaw-cli` chia sẻ namespace mạng của `openclaw-gateway`, nó là công cụ
sau khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các lần ghi cấu hình trong thời gian thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                            | Mục đích                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Dùng image từ xa thay vì build cục bộ                                 |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Cài đặt thêm gói apt trong khi build (phân tách bằng khoảng trắng)    |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Cài đặt thêm gói Python trong khi build (phân tách bằng khoảng trắng) |
| `OPENCLAW_EXTENSIONS`                           | Cài sẵn phụ thuộc Plugin tại thời điểm build (tên phân tách bằng khoảng trắng) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Ghi đè tùy chọn Node cho bản build từ mã nguồn cục bộ                 |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Ghi đè heap tsdown cho bản build từ mã nguồn cục bộ, tính bằng MB     |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Bỏ qua output khai báo trong các bản build image cục bộ chỉ dành cho runtime |
| `OPENCLAW_EXTRA_MOUNTS`                         | Các bind mount máy chủ bổ sung (phân tách bằng dấu phẩy `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                          | Duy trì `/home/node` trong một Docker volume có tên                   |
| `OPENCLAW_SANDBOX`                              | Chọn tham gia bootstrap sandbox (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                        | Ghi đè đường dẫn socket Docker                                        |
| `OPENCLAW_DISABLE_BONJOUR`                      | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)                |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Tắt overlay bind-mount mã nguồn Plugin đóng gói sẵn                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry        |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoint OTLP riêng theo tín hiệu cho trace, metric, hoặc log         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`                |
| `OTEL_SERVICE_NAME`                             | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Chọn tham gia các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất      |
| `OPENCLAW_OTEL_PRELOADED`                       | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi đã tải sẵn một SDK |

Docker image chính thức không đi kèm Homebrew. Trong onboarding, OpenClaw
ẩn các trình cài đặt phụ thuộc Skills chỉ dành cho brew khi chạy trong container Linux
không có `brew`; những phụ thuộc đó phải được cung cấp bằng image tùy chỉnh
hoặc cài đặt thủ công. Với các phụ thuộc có sẵn từ gói Debian, hãy dùng
`OPENCLAW_IMAGE_APT_PACKAGES` trong khi build image. Tên cũ
`OPENCLAW_DOCKER_APT_PACKAGES` vẫn được chấp nhận.
Với phụ thuộc Python, hãy dùng `OPENCLAW_IMAGE_PIP_PACKAGES`. Lệnh này chạy
`python3 -m pip install --break-system-packages` trong khi build image, vì vậy hãy ghim
phiên bản gói và chỉ dùng các chỉ mục gói mà bạn tin tưởng.
Các bản build từ mã nguồn mặc định đặt `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` thành
`--max-old-space-size=8192` và để
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` chưa đặt để wrapper tsdown có thể
tôn trọng giới hạn bộ nhớ của container. Chúng cũng mặc định đặt
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` vì image runtime sẽ lược bỏ file khai báo
sau khi build. Nếu Docker báo `ResourceExhausted`, `cannot allocate
memory`, hoặc hủy trong khi chạy `tsdown`, hãy tăng giới hạn bộ nhớ của Docker builder hoặc
thử lại với heap tường minh nhỏ hơn, ví dụ
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

Maintainer có thể kiểm thử mã nguồn Plugin đóng gói sẵn với một image đã đóng gói bằng cách mount
một thư mục mã nguồn Plugin lên đường dẫn mã nguồn đã đóng gói của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục mã nguồn được mount đó ghi đè bundle đã biên dịch khớp với
`/app/dist/extensions/synology-chat` cho cùng id Plugin.

### Khả năng quan sát

Xuất OpenTelemetry là luồng đi ra từ container Gateway tới OTLP
collector của bạn. Nó không yêu cầu một cổng Docker được công bố. Nếu bạn build image
cục bộ và muốn exporter OpenTelemetry đóng gói sẵn có sẵn bên trong image,
hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài đặt Plugin `@openclaw/diagnostics-otel` chính thức từ ClawHub trong
các bản cài Docker đã đóng gói trước khi bật xuất dữ liệu. Image tùy chỉnh build từ mã nguồn vẫn có thể
bao gồm mã nguồn Plugin cục bộ với
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất dữ liệu, cho phép và bật
Plugin `diagnostics-otel` trong cấu hình, rồi đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [Xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình thông qua
`diagnostics.otel.headers`, không phải thông qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã được công bố sẵn. Cài đặt
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route này được bảo vệ bằng xác thực Gateway. Không phơi bày một cổng
`/metrics` công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Ảnh Docker bao gồm `HEALTHCHECK` tích hợp sẵn để ping `/healthz`.
Nếu các lần kiểm tra tiếp tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp nhanh tình trạng chuyên sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với loopback

`scripts/docker/setup.sh` đặt mặc định `OPENCLAW_GATEWAY_BIND=lan` để quyền truy cập từ máy chủ vào
`http://127.0.0.1:18789` hoạt động với việc công bố cổng của Docker.

- `lan` (mặc định): trình duyệt trên máy chủ và CLI trên máy chủ có thể truy cập cổng Gateway đã công bố.
- `loopback`: chỉ các tiến trình bên trong namespace mạng của container mới có thể truy cập
  trực tiếp Gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng bí danh máy chủ như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Nhà cung cấp cục bộ trên máy chủ

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính
container đó, không phải máy chủ của bạn. Dùng `host.docker.internal` cho các nhà cung cấp AI
chạy trên máy chủ:

| Nhà cung cấp | URL mặc định của máy chủ | URL thiết lập Docker                 |
| ------------ | ------------------------ | ----------------------------------- |
| LM Studio    | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Thiết lập Docker đi kèm dùng các URL máy chủ đó làm giá trị mặc định khi onboarding
LM Studio và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
Gateway máy chủ của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname này trên macOS và Windows.

Các dịch vụ trên máy chủ cũng phải lắng nghe trên một địa chỉ mà Docker có thể truy cập:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng tệp Compose hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ
máy chủ, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI trong Docker

Ảnh Docker chính thức của OpenClaw không cài sẵn Claude Code. Hãy cài đặt và
đăng nhập vào Claude Code bên trong người dùng container chạy OpenClaw, rồi duy trì
home của container đó để các lần nâng cấp ảnh không xóa binary hoặc trạng thái xác thực Claude.

Với bản cài Docker mới, bật volume `/home/node` bền vững trước khi chạy
thiết lập:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Với bản cài Docker hiện có, trước tiên dừng stack và nạp lại các giá trị
Docker `.env` hiện tại trước khi chạy lại thiết lập. Script thiết lập không tự đọc
`.env`; nó ghi lại `.env` từ shell hiện tại và các giá trị mặc định. Với
`.env` đã tạo, chạy:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Nếu `.env` của bạn chứa các giá trị mà shell không thể source, hãy tự re-export
trước các giá trị hiện có mà bạn phụ thuộc vào, chẳng hạn `OPENCLAW_IMAGE`, cổng, chế độ bind,
đường dẫn tùy chỉnh, `OPENCLAW_EXTRA_MOUNTS`, sandbox, và thiết lập bỏ qua onboarding.
Overlay đã tạo mount volume home cho cả `openclaw-gateway` và
`openclaw-cli`.

Chạy các lệnh còn lại với overlay Compose đã tạo để cả hai dịch vụ
mount home bền vững. Nếu thiết lập của bạn cũng dùng `docker-compose.override.yml`,
hãy thêm nó trước `docker-compose.extra.yml`.

Cài Claude Code trong home bền vững đó:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Trình cài đặt native ghi binary `claude` dưới
`/home/node/.local/bin/claude`. Cho OpenClaw biết cần dùng đường dẫn container đó:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Đăng nhập và xác minh từ bên trong cùng home container bền vững:

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

Sau đó, bạn có thể dùng backend `claude-cli` đi kèm:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` duy trì bản cài Claude Code native dưới
`/home/node/.local/bin` và `/home/node/.local/share/claude`, cùng với thiết lập và
trạng thái xác thực Claude Code dưới `/home/node/.claude` và `/home/node/.claude.json`.
Chỉ duy trì `/home/node/.openclaw` là chưa đủ để tái sử dụng Claude CLI. Nếu
bạn dùng `OPENCLAW_EXTRA_MOUNTS` thay vì volume home, hãy mount tất cả các
đường dẫn Claude đó vào cả hai dịch vụ Docker.

<Note>
Với tự động hóa sản xuất dùng chung hoặc thanh toán Anthropic có thể dự đoán, nên dùng
đường dẫn khóa API Anthropic. Việc tái sử dụng Claude CLI tuân theo phiên bản
Claude Code đã cài, thông tin đăng nhập tài khoản, thanh toán và hành vi cập nhật.
</Note>

### Bonjour / mDNS

Mạng bridge của Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy thiết lập Compose đi kèm đặt mặc định
`OPENCLAW_DISABLE_BONJOUR=1` để Gateway không rơi vào vòng lặp crash hoặc liên tục
khởi động lại quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã công bố, Tailscale, hoặc wide-area DNS-SD cho máy chủ Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với mạng host, macvlan,
hoặc mạng khác nơi multicast mDNS được biết là hoạt động.

Để biết các điểm dễ lỗi và cách khắc phục, xem [Khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, và
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` vào `/home/node/.config/openclaw`, để các
đường dẫn đó tồn tại sau khi thay thế container. Khi biến nào chưa được đặt, tệp
`docker-compose.yml` đi kèm sẽ fallback dưới `${HOME}`, hoặc `/tmp` khi chính `HOME`
cũng thiếu. Điều đó giúp `docker compose up` không phát ra spec volume
nguồn rỗng trong các môi trường tối giản.

Thư mục cấu hình đã mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/khóa API của nhà cung cấp đã lưu
- `.env` cho bí mật runtime dựa trên biến môi trường như `OPENCLAW_GATEWAY_TOKEN`

Thư mục khóa bí mật auth-profile lưu khóa mã hóa cục bộ dùng cho
vật liệu token hồ sơ xác thực dựa trên OAuth. Giữ nó cùng trạng thái máy chủ Docker của bạn,
nhưng tách khỏi `OPENCLAW_CONFIG_DIR`.

Các Plugin có thể tải xuống đã cài đặt lưu trạng thái gói của chúng dưới home
OpenClaw đã mount, nên bản ghi cài Plugin và gốc gói tồn tại sau khi thay thế
container. Khởi động Gateway không tạo cây phụ thuộc của Plugin đi kèm.

Để biết đầy đủ chi tiết duy trì trên các triển khai VM, xem
[Docker VM Runtime - Nội dung nào được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên, cơ sở dữ liệu
trạng thái SQLite dùng chung, gốc gói Plugin đã cài, và log tệp luân phiên
dưới `/tmp/openclaw/`.

### Trợ giúp shell (tùy chọn)

Để quản lý Docker hằng ngày dễ hơn, hãy cài `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài ClawDock từ đường dẫn raw cũ `scripts/shell-helpers/clawdock-helpers.sh`, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo dõi vị trí mới.

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [ClawDock](/vi/install/clawdock) để biết hướng dẫn đầy đủ về trợ giúp.

<AccordionGroup>
  <Accordion title="Bật sandbox tác nhân cho Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Đường dẫn socket tùy chỉnh (ví dụ Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Script chỉ mount `docker.sock` sau khi điều kiện tiên quyết của sandbox đạt. Nếu
    thiết lập sandbox không thể hoàn tất, script đặt lại `agents.defaults.sandbox.mode`
    thành `off`. Các lượt Codex code-mode vẫn bị ràng buộc trong Codex
    `workspace-write` khi sandbox OpenClaw đang hoạt động; không mount
    socket Docker của máy chủ vào các container sandbox tác nhân.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Tắt cấp phát pseudo-TTY của Compose bằng `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Ghi chú bảo mật mạng dùng chung">
    `openclaw-cli` dùng `network_mode: "service:openclaw-gateway"` để các lệnh CLI
    có thể truy cập Gateway qua `127.0.0.1`. Hãy xem đây là ranh giới tin cậy
    dùng chung. Cấu hình Compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên cả `openclaw-gateway` và `openclaw-cli`.
  </Accordion>

  <Accordion title="Lỗi DNS của Docker Desktop trong openclaw-cli">
    Một số thiết lập Docker Desktop không tra cứu được DNS từ sidecar
    `openclaw-cli` dùng mạng chung sau khi `NET_RAW` bị loại bỏ, thể hiện dưới dạng
    `EAI_AGAIN` trong các lệnh dựa trên npm như `openclaw plugins install`.
    Giữ tệp Compose được gia cố mặc định cho vận hành Gateway thông thường. Override
    cục bộ bên dưới nới lỏng tư thế bảo mật của container CLI bằng cách
    khôi phục các capability mặc định của Docker, vì vậy chỉ dùng nó cho lệnh CLI
    một lần cần truy cập registry gói, không dùng làm cách gọi Compose
    mặc định của bạn:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Nếu bạn đã tạo container `openclaw-cli` chạy lâu dài, hãy tạo lại nó
    với cùng override. `docker compose exec` và `docker exec` không thể
    thay đổi Linux capabilities trên một container đã được tạo.

  </Accordion>

  <Accordion title="Quyền và EACCES">
    Ảnh chạy dưới người dùng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy bảo đảm các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Sai lệch tương tự có thể xuất hiện dưới dạng cảnh báo Plugin như
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    theo sau là `plugin present but blocked`. Điều đó nghĩa là uid tiến trình và
    chủ sở hữu thư mục Plugin đã mount không khớp. Nên chạy container với uid
    mặc định 1000 và sửa quyền sở hữu bind mount. Chỉ chown
    `/path/to/openclaw-config/npm` thành `root:root` nếu bạn cố ý chạy
    OpenClaw với quyền root lâu dài.

  </Accordion>

  <Accordion title="Rebuild nhanh hơn">
    Sắp xếp Dockerfile của bạn để các lớp phụ thuộc được cache. Điều này tránh chạy lại
    `pnpm install` trừ khi lockfile thay đổi:

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

  <Accordion title="Tùy chọn container cho người dùng nâng cao">
    Image mặc định ưu tiên bảo mật và chạy dưới dạng `node` không phải root. Để có
    container đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Đóng gói sẵn phụ thuộc hệ thống**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Đóng gói sẵn phụ thuộc Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Đóng gói sẵn Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Hoặc cài đặt trình duyệt Playwright vào một volume được duy trì**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Duy trì các bản tải xuống của trình duyệt**: dùng `OPENCLAW_HOME_VOLUME` hoặc
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw tự động phát hiện Chromium do Playwright quản lý
       của image Docker trên Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker không giao diện)">
    Nếu bạn chọn OpenAI Codex OAuth trong trình hướng dẫn, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc các thiết lập không giao diện, hãy sao chép URL chuyển hướng đầy đủ mà bạn được đưa tới và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image cơ sở">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và bao gồm `tini` làm tiến trình init entrypoint (PID 1) để đảm bảo các tiến trình zombie được thu hồi và tín hiệu được xử lý đúng trong các container chạy lâu. Nó xuất bản các chú thích image cơ sở OCI bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Digest cơ sở Node được
    làm mới thông qua PR Dependabot cho image cơ sở Docker; các bản dựng phát hành không chạy
    lớp nâng cấp distro. Xem
    [chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Runtime Docker VM](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung
bao gồm đóng gói binary, duy trì dữ liệu và cập nhật.

## Sandbox của agent

Khi `agents.defaults.sandbox` được bật với backend Docker, gateway
chạy việc thực thi công cụ của agent (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập trong khi chính gateway vẫn ở trên host. Điều này tạo cho bạn một ranh giới cứng
xung quanh các phiên agent không đáng tin cậy hoặc nhiều tenant mà không cần container hóa toàn bộ
gateway.

Phạm vi sandbox có thể là theo agent (mặc định), theo phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên và container
trình duyệt.

Để xem cấu hình đầy đủ, image, ghi chú bảo mật và hồ sơ nhiều agent, hãy xem:

- [Sandboxing](/vi/gateway/sandboxing) -- tài liệu tham khảo sandbox đầy đủ
- [OpenShell](/vi/gateway/openshell) -- quyền truy cập shell tương tác vào container sandbox
- [Sandbox và công cụ nhiều agent](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo agent

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

Dựng image sandbox mặc định (từ checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Đối với cài đặt npm không có checkout mã nguồn, xem [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Dựng image sandbox bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout mã nguồn) hoặc lệnh `docker build` nội tuyến từ [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Container được tự động tạo theo phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace đã mount của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong sandbox">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), shell này nạp
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước các
    đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm script dưới `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-kill trong khi dựng image (exit 137)">
    VM cần ít nhất 2 GB RAM. Hãy dùng lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Chưa được ủy quyền hoặc cần ghép đôi trong Giao diện điều khiển">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Thiết bị](/vi/cli/devices).

  </Accordion>

  <Accordion title="Đích Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép đôi từ Docker CLI">
    Đặt lại chế độ và bind của gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — lựa chọn thay thế Podman cho Docker
- [ClawDock](/vi/install/clawdock) — thiết lập Docker Compose của cộng đồng
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình gateway sau khi cài đặt

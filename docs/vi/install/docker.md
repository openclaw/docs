---
read_when:
    - Bạn muốn một gateway được đóng gói trong container thay vì cài đặt cục bộ
    - Bạn đang xác thực luồng Docker
summary: Thiết lập và onboarding tùy chọn dựa trên Docker cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:37:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn một gateway chạy trong container hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường gateway cô lập, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một máy chủ không cần cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó, hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandbox**: backend sandbox mặc định dùng Docker khi sandbox được bật, nhưng sandbox bị tắt theo mặc định và **không** yêu cầu toàn bộ gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng có sẵn. Xem [Sandbox](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Tối thiểu 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên máy chủ 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/máy chủ công khai, hãy xem lại
  [Gia cố bảo mật khi mở ra mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway trong container

<Steps>
  <Step title="Build image">
    Từ thư mục gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build gateway image cục bộ. Để dùng image đã build sẵn thay thế:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image đã build sẵn được phát hành tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ `2026.2.26`).

  </Step>

  <Step title="Chạy lại trong môi trường cách ly mạng">
    Trên máy chủ ngoại tuyến, trước tiên hãy chuyển và nạp image:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` xác minh rằng `OPENCLAW_IMAGE` đã tồn tại cục bộ, tắt
    các thao tác pull và build Compose ngầm định, rồi chạy luồng thiết lập thông thường như
    đồng bộ `.env`, sửa quyền, onboarding, đồng bộ cấu hình gateway
    và khởi động Compose.

    Nếu `OPENCLAW_SANDBOX=1`, thiết lập ngoại tuyến cũng kiểm tra image sandbox mặc định
    đã cấu hình và image sandbox theo từng agent đang hoạt động trên daemon phía sau
    `OPENCLAW_DOCKER_SOCKET`. Image trình duyệt dùng Docker cũng phải mang nhãn hợp đồng
    trình duyệt OpenClaw hiện tại. Khi thiếu image bắt buộc hoặc image không tương thích,
    thiết lập thoát mà không thay đổi cấu hình sandbox, thay vì
    báo thành công với một sandbox không dùng được.

  </Step>

  <Step title="Hoàn tất onboarding">
    Script thiết lập tự động chạy onboarding. Nó sẽ:

    - nhắc nhập khóa API của nhà cung cấp
    - tạo token gateway và ghi vào `.env`
    - tạo thư mục khóa bí mật auth-profile
    - khởi động gateway qua Docker Compose

    Trong quá trình thiết lập, onboarding trước khi khởi động và các thao tác ghi cấu hình chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container gateway đã tồn tại.

  </Step>

  <Step title="Mở Giao diện điều khiển">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán bí mật dùng chung đã cấu hình
    vào Cài đặt. Script thiết lập mặc định ghi token vào `.env`;
    nếu bạn chuyển cấu hình container sang xác thực bằng mật khẩu, hãy dùng
    mật khẩu đó thay thế.

    Cần xem lại URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Cấu hình kênh (tùy chọn)">
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

### Luồng thủ công

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
Chạy `docker compose` từ thư mục gốc repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
hãy đưa tệp này vào sau mọi tệp override tiêu chuẩn, ví dụ
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
khi cả hai tệp override đều tồn tại.
</Note>

<Note>
Vì `openclaw-cli` dùng chung namespace mạng của `openclaw-gateway`, nó là
công cụ sau khi khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các thao tác ghi cấu hình lúc thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                       | Mục đích                                                              |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                                 |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Cài đặt thêm gói apt trong quá trình build (phân tách bằng khoảng trắng) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Cài đặt thêm gói Python trong quá trình build (phân tách bằng khoảng trắng) |
| `OPENCLAW_EXTENSIONS`                      | Cài đặt trước phụ thuộc Plugin tại thời điểm build (tên phân tách bằng khoảng trắng) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount thêm từ máy chủ (phân tách bằng dấu phẩy `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Duy trì `/home/node` trong một volume Docker có tên                   |
| `OPENCLAW_SANDBOX`                         | Chủ động bật bootstrap sandbox (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn socket Docker                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)                |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt overlay bind-mount mã nguồn Plugin được đóng gói sẵn              |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry        |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP theo từng tín hiệu cho trace, metric hoặc log           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`                |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Chủ động dùng các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất      |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi đã có SDK được nạp trước |

Image Docker chính thức không đi kèm Homebrew. Trong quá trình onboarding, OpenClaw
ẩn các trình cài đặt phụ thuộc skill chỉ dành cho brew khi đang chạy trong container
Linux không có `brew`; các phụ thuộc đó phải được cung cấp bằng một image tùy chỉnh
hoặc cài thủ công. Với các phụ thuộc có sẵn từ gói Debian, hãy dùng
`OPENCLAW_IMAGE_APT_PACKAGES` trong quá trình build image. Tên cũ
`OPENCLAW_DOCKER_APT_PACKAGES` vẫn được chấp nhận.
Với phụ thuộc Python, hãy dùng `OPENCLAW_IMAGE_PIP_PACKAGES`. Lệnh này chạy
`python3 -m pip install --break-system-packages` trong quá trình build image, vì vậy hãy ghim
phiên bản gói và chỉ dùng các chỉ mục gói mà bạn tin cậy.

Maintainer có thể kiểm thử mã nguồn Plugin được đóng gói sẵn với image đã đóng gói bằng cách mount
một thư mục mã nguồn Plugin lên đường dẫn mã nguồn đã đóng gói tương ứng, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục mã nguồn đã mount đó ghi đè bundle đã biên dịch tương ứng
`/app/dist/extensions/synology-chat` cho cùng id Plugin.

### Khả năng quan sát

Xuất OpenTelemetry là luồng đi ra từ container Gateway đến OTLP
collector của bạn. Nó không yêu cầu một cổng Docker được công bố. Nếu bạn build image
cục bộ và muốn trình xuất OpenTelemetry được đóng gói sẵn có sẵn bên trong image,
hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài đặt Plugin `@openclaw/diagnostics-otel` chính thức từ ClawHub trong
các bản cài Docker đã đóng gói trước khi bật xuất. Image tùy chỉnh build từ mã nguồn vẫn có thể
bao gồm mã nguồn Plugin cục bộ bằng
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất, hãy cho phép và bật
Plugin `diagnostics-otel` trong cấu hình, rồi đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [Xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình qua
`diagnostics.otel.headers`, không phải qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã được công bố. Cài đặt
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route này được bảo vệ bằng xác thực Gateway. Không mở một cổng
`/metrics` công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe của container (không cần xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker bao gồm `HEALTHCHECK` tích hợp ping `/healthz`.
Nếu các kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp nhanh sức khỏe chuyên sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN và loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để quyền truy cập từ máy chủ đến
`http://127.0.0.1:18789` hoạt động với cơ chế công bố cổng Docker.

- `lan` (mặc định): trình duyệt máy chủ và CLI máy chủ có thể truy cập cổng gateway đã công bố.
- `loopback`: chỉ các tiến trình bên trong namespace mạng của container mới có thể truy cập
  trực tiếp gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng alias máy chủ như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Nhà cung cấp cục bộ trên máy chủ

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính container,
không phải máy chủ của bạn. Dùng `host.docker.internal` cho các nhà cung cấp AI
chạy trên máy chủ:

| Nhà cung cấp | URL mặc định trên máy chủ | URL thiết lập Docker              |
| ------------ | -------------------------- | --------------------------------- |
| LM Studio    | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234` |
| Ollama       | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434` |

Thiết lập Docker được đóng gói sẵn dùng các URL máy chủ đó làm giá trị mặc định onboarding
cho LM Studio và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
gateway máy chủ của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname này trên macOS và Windows.

Dịch vụ trên máy chủ cũng phải lắng nghe trên một địa chỉ có thể truy cập từ Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng tệp Compose hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ host, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI trong Docker

Ảnh Docker chính thức của OpenClaw không cài sẵn Claude Code. Hãy cài đặt và đăng nhập vào Claude Code bên trong người dùng container chạy OpenClaw, rồi duy trì home của container đó để các lần nâng cấp ảnh không xóa binary hoặc trạng thái xác thực Claude.

Với các bản cài đặt Docker mới, hãy bật volume `/home/node` bền vững trước khi chạy thiết lập:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Với bản cài đặt Docker hiện có, trước tiên hãy dừng stack và nạp lại các giá trị Docker `.env` hiện tại trước khi chạy lại thiết lập. Script thiết lập không tự đọc `.env`; nó ghi lại `.env` từ shell hiện tại và các giá trị mặc định. Với `.env` đã tạo, chạy:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Nếu `.env` của bạn chứa các giá trị mà shell không thể source, hãy tự re-export trước các giá trị hiện có mà bạn phụ thuộc vào, chẳng hạn như `OPENCLAW_IMAGE`, cổng, chế độ bind, đường dẫn tùy chỉnh, `OPENCLAW_EXTRA_MOUNTS`, sandbox và thiết lập bỏ qua onboarding. Overlay đã tạo sẽ mount volume home cho cả `openclaw-gateway` và `openclaw-cli`.

Chạy các lệnh còn lại với overlay Compose đã tạo để cả hai dịch vụ đều mount home được duy trì. Nếu thiết lập của bạn cũng dùng `docker-compose.override.yml`, hãy bao gồm tệp đó trước `docker-compose.extra.yml`.

Cài đặt Claude Code trong home được duy trì đó:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

Trình cài đặt gốc ghi binary `claude` dưới
`/home/node/.local/bin/claude`. Cho OpenClaw biết để dùng đường dẫn container đó:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Đăng nhập và xác minh từ bên trong cùng home container được duy trì:

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

`OPENCLAW_HOME_VOLUME` duy trì bản cài đặt Claude Code gốc dưới
`/home/node/.local/bin` và `/home/node/.local/share/claude`, cùng với thiết lập và trạng thái xác thực Claude Code dưới `/home/node/.claude` và `/home/node/.claude.json`.
Chỉ duy trì `/home/node/.openclaw` là chưa đủ để tái sử dụng Claude CLI. Nếu bạn dùng `OPENCLAW_EXTRA_MOUNTS` thay vì volume home, hãy mount tất cả các đường dẫn Claude đó vào cả hai dịch vụ Docker.

<Note>
Với tự động hóa sản xuất dùng chung hoặc lập hóa đơn Anthropic có thể dự đoán, hãy ưu tiên đường dẫn khóa API Anthropic. Việc tái sử dụng Claude CLI phụ thuộc vào phiên bản Claude Code đã cài đặt, đăng nhập tài khoản, lập hóa đơn và hành vi cập nhật của Claude Code.
</Note>

### Bonjour / mDNS

Mạng bridge của Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy, thiết lập Compose đi kèm mặc định dùng `OPENCLAW_DISABLE_BONJOUR=1` để Gateway không rơi vào vòng lặp crash hoặc liên tục khởi động lại quảng bá khi bridge làm rơi lưu lượng multicast.

Hãy dùng URL Gateway đã xuất bản, Tailscale hoặc DNS-SD diện rộng cho host Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với host networking, macvlan hoặc mạng khác mà multicast mDNS được biết là hoạt động.

Để xem các điểm dễ vướng và cách khắc phục sự cố, xem [Khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` tới `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` tới `/home/node/.openclaw/workspace`, và
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` tới `/home/node/.config/openclaw`, để các đường dẫn đó tồn tại sau khi thay thế container. Khi biến nào chưa được đặt, `docker-compose.yml` đi kèm sẽ fallback vào `${HOME}`, hoặc `/tmp` khi bản thân `HOME` cũng bị thiếu. Điều đó giúp `docker compose up` không phát ra thông số volume có source rỗng trên môi trường trống.

Thư mục cấu hình đã mount đó là nơi OpenClaw giữ:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/khóa API của provider đã lưu
- `.env` cho secret runtime dựa trên env, chẳng hạn như `OPENCLAW_GATEWAY_TOKEN`

Thư mục khóa secret auth-profile lưu khóa mã hóa cục bộ dùng cho vật liệu token hồ sơ xác thực dựa trên OAuth. Giữ nó cùng với trạng thái host Docker của bạn, nhưng tách khỏi `OPENCLAW_CONFIG_DIR`.

Các Plugin có thể tải xuống đã cài đặt lưu trạng thái package của chúng dưới home OpenClaw đã mount, nên bản ghi cài đặt Plugin và gốc package vẫn tồn tại sau khi thay thế container. Khởi động Gateway không tạo cây dependency của bundled-plugin.

Để xem đầy đủ chi tiết duy trì dữ liệu trên triển khai VM, xem
[Docker VM Runtime - Những gì được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

  **Các điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên, cơ sở dữ liệu trạng thái
  SQLite dùng chung, thư mục gốc của các gói plugin đã cài đặt, và các nhật ký tệp luân phiên
  trong `/tmp/openclaw/`.

  ### Trình trợ giúp shell (tùy chọn)

  Để quản lý Docker hằng ngày dễ hơn, hãy cài đặt `ClawDock`:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  Nếu bạn đã cài ClawDock từ đường dẫn raw cũ `scripts/shell-helpers/clawdock-helpers.sh`, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo dõi vị trí mới.

  Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
  `clawdock-help` để xem tất cả lệnh.
  Xem [ClawDock](/vi/install/clawdock) để đọc hướng dẫn trợ giúp đầy đủ.

  <AccordionGroup>
  <Accordion title="Bật sandbox tác tử cho Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Đường dẫn socket tùy chỉnh (ví dụ: Docker không root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Tập lệnh chỉ gắn `docker.sock` sau khi các điều kiện tiên quyết của sandbox đạt. Nếu
    thiết lập sandbox không thể hoàn tất, tập lệnh đặt lại `agents.defaults.sandbox.mode`
    thành `off`. Các lượt chế độ mã Codex vẫn bị giới hạn trong Codex
    `workspace-write` khi sandbox OpenClaw đang hoạt động; không gắn
    socket Docker của máy chủ vào các container sandbox tác tử.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Tắt phân bổ pseudo-TTY của Compose bằng `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Ghi chú bảo mật mạng dùng chung">
    `openclaw-cli` dùng `network_mode: "service:openclaw-gateway"` để các lệnh CLI
    có thể truy cập gateway qua `127.0.0.1`. Hãy xem đây là một ranh giới tin cậy
    dùng chung. Cấu hình compose bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên cả `openclaw-gateway` và `openclaw-cli`.
  </Accordion>

  <Accordion title="Lỗi DNS của Docker Desktop trong openclaw-cli">
    Một số thiết lập Docker Desktop không tra cứu được DNS từ sidecar `openclaw-cli`
    dùng mạng chung sau khi `NET_RAW` bị bỏ, biểu hiện là
    `EAI_AGAIN` trong các lệnh dựa trên npm như `openclaw plugins install`.
    Giữ tệp compose mặc định đã được gia cố cho hoạt động gateway thông thường. Ghi đè
    cục bộ bên dưới nới lỏng tư thế bảo mật của container CLI bằng cách
    khôi phục các capability mặc định của Docker, vì vậy chỉ dùng nó cho lệnh CLI
    dùng một lần cần truy cập registry gói, không dùng làm lệnh gọi Compose mặc định
    của bạn:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Nếu bạn đã tạo một container `openclaw-cli` chạy dài hạn, hãy tạo lại nó
    với cùng ghi đè. `docker compose exec` và `docker exec` không thể
    thay đổi capability Linux trên một container đã được tạo.

  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới dạng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy bảo đảm các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Sai lệch tương tự có thể xuất hiện dưới dạng cảnh báo plugin như
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    theo sau là `plugin present but blocked`. Điều đó có nghĩa là uid của tiến trình và chủ sở hữu
    thư mục plugin đã gắn không khớp. Nên chạy container với uid 1000
    mặc định và sửa quyền sở hữu bind mount. Chỉ chown
    `/path/to/openclaw-config/npm` thành `root:root` nếu bạn cố ý chạy
    OpenClaw dưới quyền root lâu dài.

  </Accordion>

  <Accordion title="Tái dựng nhanh hơn">
    Sắp xếp Dockerfile để các lớp phụ thuộc được lưu vào bộ nhớ đệm. Việc này tránh chạy lại
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
    Image mặc định ưu tiên bảo mật và chạy dưới dạng `node` không phải root. Để có container
    đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Đưa sẵn phụ thuộc hệ thống vào image**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Đưa sẵn phụ thuộc Python vào image**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Đưa sẵn Playwright Chromium vào image**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Hoặc cài đặt trình duyệt Playwright vào một volume được duy trì**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Duy trì các bản tải xuống trình duyệt**: dùng `OPENCLAW_HOME_VOLUME` hoặc
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw tự động phát hiện Chromium do Playwright quản lý của image Docker
       trên Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker không giao diện)">
    Nếu bạn chọn OpenAI Codex OAuth trong trình hướng dẫn, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc các thiết lập không giao diện, hãy sao chép URL chuyển hướng đầy đủ mà bạn đến và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu ảnh nền">
    Ảnh runtime Docker chính dùng `node:24-bookworm-slim` và bao gồm `tini` làm tiến trình init entrypoint (PID 1) để đảm bảo các tiến trình zombie được thu gom và tín hiệu được xử lý đúng trong các container chạy lâu dài. Ảnh này xuất bản các chú thích ảnh nền OCI, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, cùng các chú thích khác. Digest nền Node được
    làm mới thông qua các PR ảnh nền Docker của Dependabot; các bản dựng phát hành không chạy
    một lớp nâng cấp distro. Xem
    [chú thích ảnh OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói sẵn binary, lưu bền dữ liệu và cập nhật.

## Hộp cát tác tử

Khi `agents.defaults.sandbox` được bật với backend Docker, Gateway
chạy việc thực thi công cụ của tác tử (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
được cô lập, trong khi bản thân Gateway vẫn ở trên máy chủ. Điều này tạo cho bạn một ranh giới cứng
xung quanh các phiên tác tử không đáng tin cậy hoặc nhiều bên thuê mà không cần container hóa toàn bộ
Gateway.

Phạm vi hộp cát có thể theo từng tác tử (mặc định), theo từng phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên và các container
trình duyệt.

Để xem cấu hình đầy đủ, ảnh, ghi chú bảo mật và hồ sơ đa tác tử, hãy xem:

- [Hộp cát](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về hộp cát
- [OpenShell](/vi/gateway/openshell) -- quyền truy cập shell tương tác vào các container hộp cát
- [Hộp cát và công cụ đa tác tử](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng tác tử

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

Dựng ảnh hộp cát mặc định (từ một bản checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Với các bản cài đặt npm không có bản checkout mã nguồn, hãy xem [Hộp cát § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu ảnh hoặc container hộp cát không khởi động">
    Dựng ảnh hộp cát bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (bản checkout mã nguồn) hoặc lệnh `docker build` nội tuyến từ [Hộp cát § Ảnh và thiết lập](/vi/gateway/sandboxing#images-and-setup) (bản cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành ảnh tùy chỉnh của bạn.
    Container được tự động tạo theo từng phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong hộp cát">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace được mount của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong hộp cát">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), lệnh này nạp
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước các
    đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm một script dưới `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-kill trong quá trình dựng ảnh (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng một lớp máy lớn hơn rồi thử lại.
  </Accordion>

  <Accordion title="Không được ủy quyền hoặc cần ghép đôi trong Control UI">
    Lấy một liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Thiết bị](/vi/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép đôi từ Docker CLI">
    Đặt lại chế độ và bind của Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — lựa chọn thay thế Docker bằng Podman
- [ClawDock](/vi/install/clawdock) — thiết lập cộng đồng bằng Docker Compose
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình Gateway sau khi cài đặt

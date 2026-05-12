---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì các bản cài đặt cục bộ
    - Bạn đang xác thực quy trình Docker
summary: Thiết lập dựa trên Docker và hướng dẫn thiết lập ban đầu tùy chọn cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn một Gateway được container hóa hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường Gateway biệt lập, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một host không có cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandboxing**: backend sandbox mặc định dùng Docker khi sandboxing được bật, nhưng sandboxing mặc định tắt và **không** yêu cầu toàn bộ Gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng có sẵn. Xem [Sandboxing](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên host 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/host công khai, hãy xem lại
  [Gia cố bảo mật cho việc phơi bày mạng](/vi/gateway/security),
  đặc biệt là chính sách firewall Docker `DOCKER-USER`.

## Gateway được container hóa

<Steps>
  <Step title="Build image">
    Từ thư mục gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build image Gateway cục bộ. Để dùng image đã build sẵn thay thế:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image đã build sẵn được phát hành tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ `2026.2.26`).

  </Step>

  <Step title="Hoàn tất onboarding">
    Script thiết lập tự động chạy onboarding. Nó sẽ:

    - hỏi provider API key
    - tạo Gateway token và ghi vào `.env`
    - tạo thư mục khóa bí mật auth-profile
    - khởi động Gateway qua Docker Compose

    Trong quá trình thiết lập, onboarding trước khi khởi động và các lần ghi cấu hình chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container Gateway đã tồn tại.

  </Step>

  <Step title="Mở Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán shared secret đã cấu hình
    vào Settings. Script thiết lập mặc định ghi token vào `.env`; nếu bạn chuyển
    cấu hình container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

    Cần lại URL?

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
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập ghi `docker-compose.extra.yml`;
hãy bao gồm nó bằng `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Vì `openclaw-cli` chia sẻ namespace mạng của `openclaw-gateway`, nó là công cụ
sau khi khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các lần ghi cấu hình lúc thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                       | Mục đích                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Cài đặt thêm gói apt trong khi build (phân tách bằng khoảng trắng) |
| `OPENCLAW_EXTENSIONS`                      | Bao gồm các trình trợ giúp Plugin tích hợp đã chọn lúc build    |
| `OPENCLAW_EXTRA_MOUNTS`                    | Các bind mount host bổ sung (`source:target[:opts]` phân tách bằng dấu phẩy) |
| `OPENCLAW_HOME_VOLUME`                     | Duy trì `/home/node` trong một named Docker volume              |
| `OPENCLAW_SANDBOX`                         | Bật sandbox bootstrap (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt các overlay bind-mount nguồn Plugin tích hợp                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Các endpoint OTLP theo từng tín hiệu cho trace, metric hoặc log |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`          |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Bật các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất          |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi đã preload một SDK |

Maintainer có thể kiểm thử nguồn Plugin tích hợp với image đóng gói bằng cách mount
một thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục nguồn đã mount đó ghi đè bundle
`/app/dist/extensions/synology-chat` đã biên dịch tương ứng cho cùng id Plugin.

### Khả năng quan sát

Xuất OpenTelemetry đi ra từ container Gateway đến collector OTLP của bạn.
Nó không yêu cầu một cổng Docker được publish. Nếu bạn build image cục bộ
và muốn exporter OpenTelemetry tích hợp có sẵn bên trong image,
hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài đặt Plugin `@openclaw/diagnostics-otel` chính thức từ ClawHub trong
các bản cài Docker đóng gói trước khi bật xuất. Image tự build từ nguồn tùy chỉnh
vẫn có thể bao gồm nguồn Plugin cục bộ với
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất, hãy cho phép và bật
Plugin `diagnostics-otel` trong cấu hình, sau đó đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình qua
`diagnostics.otel.headers`, không phải qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã được publish sẵn. Cài đặt
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route được bảo vệ bằng xác thực Gateway. Không phơi bày một cổng
`/metrics` công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Các endpoint probe container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker bao gồm `HEALTHCHECK` tích hợp ping `/healthz`.
Nếu các kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với vòng lặp cục bộ

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để truy cập từ host tới
`http://127.0.0.1:18789` hoạt động với việc publish cổng Docker.

- `lan` (mặc định): trình duyệt host và CLI host có thể truy cập cổng Gateway đã publish.
- `loopback`: chỉ các process bên trong namespace mạng của container mới có thể truy cập
  trực tiếp Gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng alias host như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Provider cục bộ trên host

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính container,
không phải máy host của bạn. Dùng `host.docker.internal` cho các provider AI
chạy trên host:

| Provider  | URL mặc định trên host    | URL thiết lập Docker                 |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

Thiết lập Docker tích hợp dùng các URL host đó làm mặc định onboarding cho LM Studio
và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
Gateway host của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname đó trên macOS và Windows.

Các dịch vụ host cũng phải lắng nghe trên một địa chỉ Docker có thể truy cập:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng Compose file hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ
host đó, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Mạng bridge Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy thiết lập Compose tích hợp mặc định
`OPENCLAW_DISABLE_BONJOUR=1` để Gateway không rơi vào crash-loop hoặc liên tục
khởi động lại việc quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã publish, Tailscale, hoặc wide-area DNS-SD cho host Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với host networking, macvlan,
hoặc mạng khác mà mDNS multicast được biết là hoạt động.

Để xem các điểm dễ vướng và cách khắc phục sự cố, xem [Khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` tới `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` tới `/home/node/.openclaw/workspace`, và
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` tới `/home/node/.config/openclaw`, để các
đường dẫn đó vẫn tồn tại sau khi thay thế container. Khi bất kỳ biến nào chưa được đặt,
`docker-compose.yml` tích hợp fallback dưới `${HOME}`, hoặc `/tmp` khi chính `HOME`
cũng bị thiếu. Điều đó giúp `docker compose up` không phát ra spec volume
có nguồn rỗng trên các môi trường tối giản.

Thư mục cấu hình đã mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key provider đã lưu
- `.env` cho các bí mật runtime dựa trên env như `OPENCLAW_GATEWAY_TOKEN`

Thư mục khóa bí mật auth-profile lưu khóa mã hóa cục bộ được dùng cho
vật liệu token auth profile dựa trên OAuth. Hãy giữ nó cùng trạng thái host Docker
của bạn, nhưng tách riêng khỏi `OPENCLAW_CONFIG_DIR`.

Các plugin có thể tải xuống đã cài đặt lưu trạng thái gói của chúng bên dưới
thư mục chính OpenClaw được gắn kết, nên bản ghi cài đặt plugin và thư mục gốc gói vẫn tồn tại sau khi thay thế container. Quá trình khởi động Gateway không tạo cây phụ thuộc cho plugin tích hợp sẵn.

Để biết đầy đủ chi tiết về tính bền vững trên các bản triển khai VM, xem
[Docker VM Runtime - Nội dung nào được lưu ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên,
`cron/runs/*.jsonl`, thư mục gốc gói plugin đã cài đặt, và nhật ký tệp luân phiên
bên dưới `/tmp/openclaw/`.

### Trình trợ giúp shell (tùy chọn)

Để quản lý Docker hằng ngày dễ hơn, hãy cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài đặt ClawDock từ đường dẫn raw cũ `scripts/shell-helpers/clawdock-helpers.sh`, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo dõi vị trí mới.

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [ClawDock](/vi/install/clawdock) để biết hướng dẫn đầy đủ về trình trợ giúp.

<AccordionGroup>
  <Accordion title="Bật sandbox tác tử cho Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Đường dẫn socket tùy chỉnh (ví dụ: Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Script chỉ gắn kết `docker.sock` sau khi các điều kiện tiên quyết của sandbox đạt yêu cầu. Nếu
    không thể hoàn tất thiết lập sandbox, script đặt lại `agents.defaults.sandbox.mode`
    về `off`. Các lượt chế độ mã Codex vẫn bị giới hạn trong Codex
    `workspace-write` khi sandbox OpenClaw đang hoạt động; không gắn kết
    Docker socket của máy chủ vào các container sandbox tác tử.

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
    có thể truy cập gateway qua `127.0.0.1`. Hãy coi đây là một ranh giới tin cậy dùng chung.
    Cấu hình compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên cả `openclaw-gateway` và `openclaw-cli`.
  </Accordion>

  <Accordion title="Lỗi DNS của Docker Desktop trong openclaw-cli">
    Một số thiết lập Docker Desktop không tra cứu được DNS từ sidecar
    `openclaw-cli` dùng mạng chung sau khi `NET_RAW` bị loại bỏ, thể hiện dưới dạng
    `EAI_AGAIN` trong các lệnh dựa trên npm như `openclaw plugins install`.
    Giữ tệp compose mặc định đã được tăng cường bảo mật cho hoạt động gateway thông thường. Phần
    ghi đè cục bộ bên dưới nới lỏng tư thế bảo mật của container CLI bằng cách
    khôi phục các capability mặc định của Docker, vì vậy chỉ dùng nó cho lệnh CLI
    một lần cần truy cập sổ đăng ký gói, không dùng làm lệnh gọi Compose
    mặc định của bạn:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Nếu bạn đã tạo một container `openclaw-cli` chạy lâu dài, hãy tạo lại nó
    với cùng phần ghi đè. `docker compose exec` và `docker exec` không thể
    thay đổi Linux capability trên một container đã được tạo.

  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới người dùng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy đảm bảo các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Sự không khớp tương tự có thể xuất hiện dưới dạng cảnh báo plugin như
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    theo sau là `plugin present but blocked`. Điều đó nghĩa là uid của tiến trình và chủ sở hữu
    thư mục plugin được gắn kết không khớp. Nên chạy container với uid mặc định 1000
    và sửa quyền sở hữu bind mount. Chỉ chown
    `/path/to/openclaw-config/npm` thành `root:root` nếu bạn chủ ý chạy
    OpenClaw dưới quyền root lâu dài.

  </Accordion>

  <Accordion title="Dựng lại nhanh hơn">
    Sắp xếp Dockerfile để các lớp phụ thuộc được lưu cache. Điều này tránh chạy lại
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
    2. **Đóng gói sẵn phụ thuộc hệ thống**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Đóng gói sẵn Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **Hoặc cài đặt trình duyệt Playwright vào volume được duy trì**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **Duy trì các bản tải xuống trình duyệt**: dùng `OPENCLAW_HOME_VOLUME` hoặc
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw tự động phát hiện Chromium do Playwright quản lý
       của Docker image trên Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Nếu bạn chọn OpenAI Codex OAuth trong trình hướng dẫn, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc các thiết lập headless, hãy sao chép toàn bộ URL chuyển hướng bạn nhận được và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image nền">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và bao gồm `tini` làm tiến trình init entrypoint (PID 1) để đảm bảo các tiến trình zombie được dọn dẹp và tín hiệu được xử lý đúng trong các container chạy lâu dài. Nó xuất bản các chú thích image nền OCI, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Digest nền Node được
    làm mới thông qua các PR Docker base-image của Dependabot; các bản dựng phát hành không chạy
    lớp nâng cấp distro. Xem
    [Chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói nhị phân, tính bền vững và cập nhật.

## Sandbox tác tử

Khi `agents.defaults.sandbox` được bật với backend Docker, gateway
chạy thực thi công cụ tác tử (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập trong khi bản thân gateway vẫn ở trên máy chủ. Điều này tạo ra một rào chắn cứng
quanh các phiên tác tử không đáng tin cậy hoặc nhiều bên thuê mà không cần container hóa toàn bộ
gateway.

Phạm vi sandbox có thể theo tác tử (mặc định), theo phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được gắn kết tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên, và container
trình duyệt.

Để biết đầy đủ cấu hình, image, ghi chú bảo mật, và hồ sơ đa tác tử, xem:

- [Sandboxing](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về sandbox
- [OpenShell](/vi/gateway/openshell) -- truy cập shell tương tác vào container sandbox
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo tác tử

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

Dựng image sandbox mặc định (từ một bản checkout nguồn):

```bash
scripts/sandbox-setup.sh
```

Đối với cài đặt npm không có bản checkout nguồn, xem [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Dựng image sandbox bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout nguồn) hoặc lệnh `docker build` nội tuyến từ [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Container được tự động tạo theo từng phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace được gắn kết của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong sandbox">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), nguồn hóa
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước
    các đường dẫn công cụ tùy chỉnh, hoặc thêm script bên dưới `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-killed trong khi dựng image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Chưa được ủy quyền hoặc cần ghép nối trong Control UI">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Thiết bị](/vi/cli/devices).

  </Accordion>

  <Accordion title="Đích Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép nối từ Docker CLI">
    Đặt lại chế độ gateway và bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — lựa chọn thay thế Podman cho Docker
- [ClawDock](/vi/install/clawdock) — thiết lập cộng đồng Docker Compose
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn được cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình gateway sau khi cài đặt

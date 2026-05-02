---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì cài đặt cục bộ
    - Bạn đang xác thực quy trình Docker
summary: Thiết lập và hướng dẫn làm quen tùy chọn dựa trên Docker cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T10:45:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn một Gateway được container hóa hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường Gateway tách biệt, dùng rồi bỏ, hoặc muốn chạy OpenClaw trên một máy chủ không cần cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó, hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandboxing**: backend sandbox mặc định dùng Docker khi sandboxing được bật, nhưng sandboxing mặc định tắt và **không** yêu cầu toàn bộ Gateway chạy trong Docker. Backend sandbox SSH và OpenShell cũng có sẵn. Xem [Sandboxing](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị kết thúc do OOM trên máy chủ 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/máy chủ công khai, hãy xem lại
  [Tăng cường bảo mật khi mở ra mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway chạy trong container

<Steps>
  <Step title="Build image">
    Từ gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build Gateway image cục bộ. Để dùng image đã build sẵn thay thế:

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

    - nhắc nhập khóa API của nhà cung cấp
    - tạo token Gateway và ghi vào `.env`
    - khởi động Gateway qua Docker Compose

    Trong quá trình thiết lập, onboarding trước khi khởi động và các lần ghi cấu hình
    chạy trực tiếp qua `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container Gateway đã tồn tại.

  </Step>

  <Step title="Mở Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán shared secret đã cấu hình
    vào Settings. Script thiết lập mặc định ghi token vào `.env`; nếu bạn chuyển cấu hình
    container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

    Cần lấy lại URL?

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
Chạy `docker compose` từ gốc repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
hãy bao gồm nó bằng `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Vì `openclaw-cli` dùng chung network namespace với `openclaw-gateway`, nó là công cụ
sau khi khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các lần ghi cấu hình trong lúc thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                       | Mục đích                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Cài thêm các gói apt trong lúc build (phân tách bằng dấu cách)  |
| `OPENCLAW_EXTENSIONS`                      | Bao gồm các helper Plugin đóng gói được chọn tại thời điểm build |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount máy chủ bổ sung (`source:target[:opts]` phân tách bằng dấu phẩy) |
| `OPENCLAW_HOME_VOLUME`                     | Duy trì `/home/node` trong một Docker volume có tên             |
| `OPENCLAW_SANDBOX`                         | Chọn tham gia khởi tạo sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt overlay bind-mount nguồn Plugin đóng gói                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint bộ thu OTLP/HTTP dùng chung cho xuất OpenTelemetry     |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP theo từng tín hiệu cho trace, metric hoặc log     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện nay chỉ hỗ trợ `http/protobuf`      |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Chọn tham gia các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động OpenTelemetry SDK thứ hai khi đã preload một SDK |

Maintainer có thể kiểm thử nguồn Plugin đóng gói với image đã đóng gói bằng cách mount
một thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục nguồn đã mount đó ghi đè bundle đã biên dịch tương ứng
`/app/dist/extensions/synology-chat` cho cùng Plugin id.

### Khả năng quan sát

Xuất OpenTelemetry là kết nối đi từ container Gateway đến bộ thu OTLP của bạn.
Nó không yêu cầu cổng Docker đã xuất bản. Nếu bạn build image cục bộ và muốn bộ xuất OpenTelemetry
đóng gói có sẵn bên trong image, hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài Plugin `@openclaw/diagnostics-otel` chính thức trong các bản cài Docker đã đóng gói
trước khi bật xuất. Image build từ nguồn tùy chỉnh vẫn có thể bao gồm
nguồn Plugin cục bộ với `OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật
xuất, hãy cho phép và bật Plugin `diagnostics-otel` trong cấu hình, rồi đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực của bộ thu được cấu hình qua
`diagnostics.otel.headers`, không phải qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã xuất bản. Bật
Plugin `diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route này được bảo vệ bằng xác thực Gateway. Không mở một cổng `/metrics`
công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe của container (không cần xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image bao gồm `HEALTHCHECK` tích hợp ping `/healthz`.
Nếu các kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để quyền truy cập máy chủ vào
`http://127.0.0.1:18789` hoạt động với xuất bản cổng Docker.

- `lan` (mặc định): trình duyệt máy chủ và CLI máy chủ có thể truy cập cổng Gateway đã xuất bản.
- `loopback`: chỉ các tiến trình bên trong network namespace của container mới có thể truy cập
  trực tiếp Gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng alias máy chủ như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Nhà cung cấp cục bộ trên máy chủ

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính container đó,
không phải máy chủ của bạn. Dùng `host.docker.internal` cho các nhà cung cấp AI
chạy trên máy chủ:

| Nhà cung cấp | URL mặc định trên máy chủ | URL thiết lập Docker                |
| ------------ | ------------------------- | ----------------------------------- |
| LM Studio    | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

Thiết lập Docker đóng gói dùng các URL máy chủ đó làm mặc định onboarding cho LM Studio
và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
host gateway của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname trên macOS và Windows.

Dịch vụ trên máy chủ cũng phải lắng nghe trên một địa chỉ Docker có thể truy cập:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng Compose file hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ
máy chủ, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Mạng bridge của Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy, thiết lập Compose đóng gói mặc định
`OPENCLAW_DISABLE_BONJOUR=1` để Gateway không crash-loop hoặc liên tục
khởi động lại quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã xuất bản, Tailscale hoặc wide-area DNS-SD cho máy chủ Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với mạng host, macvlan,
hoặc một mạng khác mà multicast mDNS được biết là hoạt động.

Để xem các điểm dễ lỗi và cách khắc phục sự cố, xem [Khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và tính bền vững

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, vì vậy các đường dẫn đó
vẫn tồn tại sau khi thay thế container. Khi một trong hai biến chưa được đặt, file
`docker-compose.yml` đóng gói fallback về `${HOME}/.openclaw` (và
`${HOME}/.openclaw/workspace` cho mount workspace), hoặc `/tmp/.openclaw`
khi chính `HOME` cũng bị thiếu. Điều đó giúp `docker compose up` không
phát ra volume spec có nguồn trống trên các môi trường tối thiểu.

Thư mục cấu hình đã mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/khóa API nhà cung cấp đã lưu
- `.env` cho secret runtime dựa trên env như `OPENCLAW_GATEWAY_TOKEN`

Các Plugin có thể tải xuống đã cài đặt lưu trạng thái package của chúng bên dưới OpenClaw home
đã mount, vì vậy bản ghi cài đặt Plugin và gốc package vẫn tồn tại sau khi thay thế
container. Khởi động Gateway không tạo cây phụ thuộc của bundled Plugin.

Để biết đầy đủ chi tiết về tính bền vững trên các triển khai VM, xem
[Docker VM Runtime - Những gì được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên,
`cron/runs/*.jsonl`, thư mục gốc của gói plugin đã cài đặt và log tệp cuộn vòng
trong `/tmp/openclaw/`.

### Trình hỗ trợ shell (tùy chọn)

Để quản lý Docker hằng ngày dễ hơn, hãy cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài ClawDock từ đường dẫn raw cũ `scripts/shell-helpers/clawdock-helpers.sh`, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo dõi vị trí mới.

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [ClawDock](/vi/install/clawdock) để đọc hướng dẫn đầy đủ về trình trợ giúp.

<AccordionGroup>
  <Accordion title="Bật hộp cát agent cho Docker gateway">
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

    Script chỉ mount `docker.sock` sau khi các điều kiện tiên quyết của hộp cát vượt qua. Nếu
    quá trình thiết lập hộp cát không thể hoàn tất, script đặt lại `agents.defaults.sandbox.mode`
    thành `off`.

  </Accordion>

  <Accordion title="Tự động hóa / CI (không tương tác)">
    Tắt cấp phát pseudo-TTY của Compose bằng `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Ghi chú bảo mật mạng dùng chung">
    `openclaw-cli` dùng `network_mode: "service:openclaw-gateway"` để các lệnh
    CLI có thể kết nối tới Gateway qua `127.0.0.1`. Hãy xem đây là một ranh giới
    tin cậy dùng chung. Cấu hình compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới người dùng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy đảm bảo các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Build lại nhanh hơn">
    Sắp xếp Dockerfile để các lớp phụ thuộc được cache. Việc này tránh chạy lại
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
    Image mặc định ưu tiên bảo mật và chạy dưới người dùng không phải root `node`. Để có một
    container đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Đóng gói sẵn phụ thuộc hệ thống**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Cài trình duyệt Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Duy trì bản tải xuống trình duyệt**: đặt
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` và dùng
       `OPENCLAW_HOME_VOLUME` hoặc `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker không giao diện)">
    Nếu bạn chọn OpenAI Codex OAuth trong trình hướng dẫn, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc thiết lập không giao diện, hãy sao chép URL chuyển hướng đầy đủ mà bạn đến và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image cơ sở">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và phát hành chú thích OCI
    cho image cơ sở, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` và các chú thích khác. Digest cơ sở Node được
    làm mới qua các PR Dependabot cho image cơ sở Docker; build phát hành không chạy
    lớp nâng cấp distro. Xem
    [chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói binary, duy trì dữ liệu và cập nhật.

## Hộp cát agent

Khi `agents.defaults.sandbox` được bật với backend Docker, Gateway
chạy việc thực thi công cụ của agent (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập, còn bản thân Gateway vẫn ở trên máy chủ. Điều này tạo cho bạn một bức tường cứng
quanh các phiên agent không đáng tin cậy hoặc đa tenant mà không cần container hóa toàn bộ
Gateway.

Phạm vi hộp cát có thể theo từng agent (mặc định), từng phiên hoặc dùng chung. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên và container
trình duyệt.

Để xem đầy đủ cấu hình, image, ghi chú bảo mật và hồ sơ đa agent, hãy xem:

- [Sandboxing](/vi/gateway/sandboxing) -- tài liệu tham chiếu hộp cát đầy đủ
- [OpenShell](/vi/gateway/openshell) -- truy cập shell tương tác vào container hộp cát
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng agent

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

Build image hộp cát mặc định (từ checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Với bản cài npm không có checkout mã nguồn, xem [Sandboxing § Images and setup](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container hộp cát không khởi động">
    Build image hộp cát bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout mã nguồn) hoặc lệnh `docker build` nội tuyến từ [Sandboxing § Images and setup](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Container được tự động tạo theo từng phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong hộp cát">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace đã mount,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong hộp cát">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), lệnh này source
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước
    các đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm script dưới `/etc/profile.d/` trong Dockerfile.
  </Accordion>

  <Accordion title="Bị OOM-killed trong lúc build image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng loại máy lớn hơn rồi thử lại.
  </Accordion>

  <Accordion title="Chưa được ủy quyền hoặc cần ghép đôi trong Control UI">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Devices](/vi/cli/devices).

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
- [Podman](/vi/install/podman) — phương án thay thế Docker bằng Podman
- [ClawDock](/vi/install/clawdock) — thiết lập Docker Compose của cộng đồng
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình Gateway sau khi cài đặt

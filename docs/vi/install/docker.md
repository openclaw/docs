---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì các bản cài đặt cục bộ
    - Bạn đang xác thực luồng Docker
summary: Thiết lập và hướng dẫn bắt đầu tùy chọn dựa trên Docker cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn một gateway được container hóa hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường gateway cô lập, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một host không có cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandboxing**: backend sandbox mặc định dùng Docker khi sandboxing được bật, nhưng sandboxing mặc định tắt và **không** yêu cầu toàn bộ gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng khả dụng. Xem [Sandboxing](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên host 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/host công khai, hãy xem lại
  [Tăng cường bảo mật khi phơi bày mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway được container hóa

<Steps>
  <Step title="Build the image">
    Từ thư mục gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build image gateway cục bộ. Để dùng image đã build sẵn thay vào đó:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image build sẵn được phát hành tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Script thiết lập tự động chạy onboarding. Nó sẽ:

    - nhắc nhập API key của provider
    - tạo token gateway và ghi vào `.env`
    - khởi động gateway qua Docker Compose

    Trong quá trình thiết lập, onboarding trước khi khởi động và các lần ghi config chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container gateway đã tồn tại.

  </Step>

  <Step title="Open the Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán shared secret đã cấu hình
    vào Settings. Script thiết lập mặc định ghi token vào `.env`; nếu bạn chuyển
    config container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó thay thế.

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
hãy đưa nó vào bằng `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Vì `openclaw-cli` dùng chung namespace mạng của `openclaw-gateway`, nó là công cụ
sau khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các lần ghi config trong lúc thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn này:

| Biến                                       | Mục đích                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Cài thêm các gói apt trong lúc build (phân tách bằng dấu cách)  |
| `OPENCLAW_EXTENSIONS`                      | Bao gồm các helper Plugin được đóng gói đã chọn lúc build       |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host bổ sung (`source:target[:opts]`, phân tách bằng dấu phẩy) |
| `OPENCLAW_HOME_VOLUME`                     | Duy trì `/home/node` trong một Docker volume được đặt tên       |
| `OPENCLAW_SANDBOX`                         | Chọn tham gia bootstrap sandbox (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt overlay bind-mount mã nguồn Plugin được đóng gói            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP theo tín hiệu cho trace, metric hoặc log          |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`          |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Chọn tham gia các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi đã preload một SDK |

Maintainer có thể kiểm thử mã nguồn Plugin được đóng gói với image đã đóng gói
bằng cách mount một thư mục mã nguồn Plugin lên đường dẫn mã nguồn đã đóng gói
của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục mã nguồn được mount đó ghi đè bundle đã biên dịch tương ứng
`/app/dist/extensions/synology-chat` cho cùng id Plugin.

### Khả năng quan sát

Xuất OpenTelemetry là outbound từ container Gateway tới collector OTLP của bạn.
Nó không yêu cầu publish port Docker. Nếu bạn build image cục bộ và muốn exporter
OpenTelemetry được đóng gói có sẵn bên trong image, hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài Plugin chính thức `@openclaw/diagnostics-otel` từ ClawHub trong các bản cài
Docker đã đóng gói trước khi bật xuất. Các image được build từ mã nguồn tùy chỉnh
vẫn có thể bao gồm mã nguồn Plugin cục bộ bằng
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất, hãy cho phép và bật
Plugin `diagnostics-otel` trong config, rồi đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ config trong [xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình qua
`diagnostics.otel.headers`, không qua biến môi trường Docker.

Metric Prometheus dùng port Gateway đã được publish sẵn. Cài
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route này được bảo vệ bằng xác thực Gateway. Không phơi bày port `/metrics`
công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe container (không cần xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker bao gồm `HEALTHCHECK` tích hợp ping `/healthz`.
Nếu các lần kiểm tra tiếp tục thất bại, Docker đánh dấu container là `unhealthy`
và hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp nhanh sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để truy cập host tới
`http://127.0.0.1:18789` hoạt động với việc publish port Docker.

- `lan` (mặc định): trình duyệt host và CLI host có thể truy cập port gateway đã publish.
- `loopback`: chỉ các tiến trình bên trong namespace mạng container mới có thể truy cập
  trực tiếp gateway.

<Note>
Dùng các giá trị bind mode trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng alias host như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Provider cục bộ trên host

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính container,
không phải máy host của bạn. Dùng `host.docker.internal` cho các provider AI
chạy trên host:

| Provider  | URL mặc định trên host    | URL thiết lập Docker                |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

Thiết lập Docker được đóng gói dùng các URL host đó làm mặc định onboarding cho
LM Studio và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
host gateway của Docker cho Docker Engine trên Linux. Docker Desktop đã cung cấp
cùng hostname trên macOS và Windows.

Các dịch vụ host cũng phải lắng nghe trên một địa chỉ mà Docker có thể truy cập:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng file Compose hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ
host, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Mạng bridge Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách tin cậy. Vì vậy thiết lập Compose được đóng gói
mặc định `OPENCLAW_DISABLE_BONJOUR=1` để Gateway không crash-loop hoặc liên tục
khởi động lại việc quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã publish, Tailscale hoặc DNS-SD diện rộng cho các host Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với host networking, macvlan,
hoặc một mạng khác mà multicast mDNS được biết là hoạt động.

Để biết các điểm dễ vướng và cách khắc phục sự cố, xem [khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` tới `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` tới `/home/node/.openclaw/workspace`, nên các đường dẫn
đó vẫn tồn tại sau khi thay thế container. Khi một trong hai biến chưa được đặt,
`docker-compose.yml` được đóng gói fallback về `${HOME}/.openclaw` (và
`${HOME}/.openclaw/workspace` cho workspace mount), hoặc `/tmp/.openclaw`
khi chính `HOME` cũng bị thiếu. Điều đó giúp `docker compose up` không phát ra
volume spec có source rỗng trên môi trường tối giản.

Thư mục config được mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho config hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key provider đã lưu
- `.env` cho các secret runtime dựa trên env như `OPENCLAW_GATEWAY_TOKEN`

Các Plugin tải về đã cài đặt lưu trạng thái package của chúng dưới OpenClaw home
được mount, nên bản ghi cài đặt Plugin và package root vẫn tồn tại sau khi thay
thế container. Khởi động Gateway không tạo cây phụ thuộc bundled-plugin.

Để biết đầy đủ chi tiết về tính duy trì dữ liệu trên các triển khai VM, xem
[Docker VM Runtime - Những gì được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên,
`cron/runs/*.jsonl`, thư mục gốc của gói Plugin đã cài đặt, và nhật ký tệp xoay vòng
trong `/tmp/openclaw/`.

### Trình trợ giúp shell (tùy chọn)

Để quản lý Docker hằng ngày dễ hơn, hãy cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài đặt ClawDock từ đường dẫn thô `scripts/shell-helpers/clawdock-helpers.sh` cũ hơn, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo dõi vị trí mới.

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [ClawDock](/vi/install/clawdock) để biết hướng dẫn đầy đủ về trình trợ giúp.

<AccordionGroup>
  <Accordion title="Bật sandbox tác nhân cho Docker gateway">
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
    `openclaw-cli` dùng `network_mode: "service:openclaw-gateway"` để các lệnh CLI
    có thể truy cập gateway qua `127.0.0.1`. Hãy xem đây là một ranh giới tin cậy
    dùng chung. Cấu hình compose bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên cả `openclaw-gateway` và `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới dạng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy đảm bảo các bind mount trên máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    Cùng sự không khớp đó có thể xuất hiện dưới dạng cảnh báo Plugin như
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    theo sau là `plugin present but blocked`. Điều đó có nghĩa là uid của tiến trình và
    chủ sở hữu thư mục Plugin được gắn không khớp. Nên chạy container với uid mặc định
    1000 và sửa quyền sở hữu bind mount. Chỉ chown
    `/path/to/openclaw-config/npm` thành `root:root` nếu bạn cố ý chạy
    OpenClaw dưới quyền root lâu dài.

  </Accordion>

  <Accordion title="Tái dựng nhanh hơn">
    Sắp xếp Dockerfile của bạn để các lớp phụ thuộc được lưu vào bộ nhớ đệm. Điều này tránh chạy lại
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
    Image mặc định ưu tiên bảo mật và chạy dưới dạng `node` không root. Để có container
    đầy đủ tính năng hơn:

    1. **Duy trì `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Đóng gói sẵn phụ thuộc hệ thống**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Cài đặt trình duyệt Playwright**:
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
    Docker hoặc các thiết lập không giao diện, hãy sao chép toàn bộ URL chuyển hướng mà bạn đến và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image cơ sở">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và phát hành chú thích image OCI
    cơ sở, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Digest cơ sở của Node được
    làm mới thông qua các PR Dependabot Docker base-image; các bản dựng phát hành không chạy
    một lớp nâng cấp distro. Xem
    [chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói nhị phân, duy trì dữ liệu, và cập nhật.

## Sandbox tác nhân

Khi `agents.defaults.sandbox` được bật với backend Docker, gateway
chạy thực thi công cụ của tác nhân (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập trong khi chính gateway vẫn ở trên máy chủ. Điều này cung cấp một bức tường cứng
quanh các phiên tác nhân không đáng tin cậy hoặc đa khách thuê mà không cần container hóa toàn bộ
gateway.

Phạm vi sandbox có thể theo từng tác nhân (mặc định), theo từng phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được gắn tại `/workspace`. Bạn cũng có thể cấu hình
chính sách công cụ cho phép/từ chối, cô lập mạng, giới hạn tài nguyên, và container
trình duyệt.

Để xem cấu hình đầy đủ, image, ghi chú bảo mật, và hồ sơ đa tác nhân, hãy xem:

- [Sandboxing](/vi/gateway/sandboxing) -- tham chiếu sandbox đầy đủ
- [OpenShell](/vi/gateway/openshell) -- truy cập shell tương tác vào container sandbox
- [Multi-Agent Sandbox and Tools](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng tác nhân

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

Dựng image sandbox mặc định (từ bản checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Đối với cài đặt npm không có bản checkout mã nguồn, xem [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Dựng image sandbox bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (bản checkout mã nguồn) hoặc lệnh `docker build` nội tuyến từ [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Container được tự động tạo theo từng phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong sandbox">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace được gắn của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong sandbox">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), shell này nạp
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước các
    đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm một tập lệnh trong `/etc/profile.d/` trong Dockerfile.
  </Accordion>

  <Accordion title="Bị OOM-killed trong khi dựng image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Không được ủy quyền hoặc cần ghép nối trong Control UI">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Devices](/vi/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép nối từ Docker CLI">
    Đặt lại chế độ gateway và bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — phương án Podman thay thế Docker
- [ClawDock](/vi/install/clawdock) — thiết lập cộng đồng Docker Compose
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình gateway sau khi cài đặt

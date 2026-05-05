---
read_when:
    - Bạn muốn một Gateway chạy trong container thay vì cài đặt cục bộ
    - Bạn đang xác thực luồng Docker
summary: Thiết lập và hướng dẫn bắt đầu bằng Docker tùy chọn cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn Gateway chạy trong container hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường Gateway cô lập, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một máy chủ không có cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandbox**: backend sandbox mặc định dùng Docker khi sandbox được bật, nhưng sandbox mặc định đang tắt và **không** yêu cầu toàn bộ Gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng có sẵn. Xem [Sandbox](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Tối thiểu 2 GB RAM để build image (`pnpm install` có thể bị dừng do hết bộ nhớ trên máy chủ 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/máy chủ công khai, hãy xem lại
  [Gia cố bảo mật khi phơi ra mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway chạy trong container

<Steps>
  <Step title="Build image">
    Từ thư mục gốc của repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build image Gateway cục bộ. Để dùng image đã build sẵn thay vào đó:

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

    Trong quá trình thiết lập, onboarding trước khi khởi động và các thao tác ghi cấu hình chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container Gateway đã tồn tại.

  </Step>

  <Step title="Mở giao diện điều khiển">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán shared secret đã cấu hình
    vào Settings. Theo mặc định, script thiết lập ghi token vào `.env`; nếu bạn chuyển cấu hình container sang xác thực bằng mật khẩu, hãy dùng
    mật khẩu đó thay thế.

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
Chạy `docker compose` từ thư mục gốc của repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
hãy thêm nó bằng `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Vì `openclaw-cli` chia sẻ namespace mạng của `openclaw-gateway`, nó là công cụ
sau khi khởi động. Trước `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các thao tác ghi cấu hình trong thời gian thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                       | Mục đích                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Cài thêm gói apt trong quá trình build (phân tách bằng dấu cách) |
| `OPENCLAW_EXTENSIONS`                      | Bao gồm các trình trợ giúp Plugin đi kèm được chọn khi build    |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount bổ sung từ máy chủ (phân tách bằng dấu phẩy `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Lưu giữ `/home/node` trong một Docker volume có tên             |
| `OPENCLAW_SANDBOX`                         | Bật bootstrap sandbox (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt các lớp phủ bind-mount nguồn Plugin đi kèm                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP theo tín hiệu cho trace, metric hoặc log          |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`          |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Bật các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất          |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi đã preload một SDK |

Maintainer có thể kiểm thử nguồn Plugin đi kèm với một image đóng gói bằng cách mount
một thư mục nguồn Plugin lên đường dẫn nguồn đã đóng gói của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục nguồn đã mount đó ghi đè bundle đã biên dịch tương ứng
`/app/dist/extensions/synology-chat` cho cùng id Plugin.

### Quan sát hệ thống

Xuất OpenTelemetry là kết nối đi từ container Gateway tới collector OTLP
của bạn. Việc này không yêu cầu cổng Docker được công bố. Nếu bạn build image
cục bộ và muốn exporter OpenTelemetry đi kèm có sẵn bên trong image,
hãy bao gồm các phụ thuộc runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài Plugin chính thức `@openclaw/diagnostics-otel` từ ClawHub trong
các bản cài Docker đóng gói trước khi bật xuất. Image tự build từ nguồn tùy chỉnh vẫn có thể
bao gồm nguồn Plugin cục bộ bằng
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất, cho phép và bật
Plugin `diagnostics-otel` trong cấu hình, sau đó đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [Xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình qua
`diagnostics.otel.headers`, không phải qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã được công bố sẵn. Cài
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Tuyến này được bảo vệ bằng xác thực Gateway. Không phơi một cổng
`/metrics` công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[Metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image bao gồm `HEALTHCHECK` tích hợp sẵn ping `/healthz`.
Nếu các kiểm tra liên tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Ảnh chụp sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để quyền truy cập từ máy chủ tới
`http://127.0.0.1:18789` hoạt động với việc công bố cổng Docker.

- `lan` (mặc định): trình duyệt trên máy chủ và CLI trên máy chủ có thể truy cập cổng Gateway đã công bố.
- `loopback`: chỉ các tiến trình bên trong namespace mạng của container mới có thể truy cập
  trực tiếp Gateway.

<Note>
Dùng giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
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

Thiết lập Docker đi kèm dùng các URL máy chủ đó làm giá trị mặc định onboarding
cho LM Studio và Ollama, và `docker-compose.yml` ánh xạ `host.docker.internal` tới
Gateway máy chủ của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname đó trên macOS và Windows.

Dịch vụ trên máy chủ cũng phải lắng nghe trên một địa chỉ có thể truy cập từ Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng Compose file riêng hoặc lệnh `docker run`, hãy tự thêm cùng ánh xạ máy chủ,
ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Mạng bridge của Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy, thiết lập Compose đi kèm mặc định
`OPENCLAW_DISABLE_BONJOUR=1` để Gateway không bị vòng lặp crash hoặc liên tục
khởi động lại quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã công bố, Tailscale, hoặc DNS-SD diện rộng cho máy chủ Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với mạng host, macvlan,
hoặc mạng khác mà multicast mDNS được biết là hoạt động.

Để xem các điểm dễ vướng và cách khắc phục sự cố, xem [Khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, nên các đường dẫn đó
vẫn tồn tại sau khi thay thế container. Khi một trong hai biến chưa được đặt, file
`docker-compose.yml` đi kèm sẽ fallback về `${HOME}/.openclaw` (và
`${HOME}/.openclaw/workspace` cho mount workspace), hoặc `/tmp/.openclaw`
khi chính `HOME` cũng bị thiếu. Điều đó giúp `docker compose up` không
phát ra spec volume có source trống trong các môi trường tối giản.

Thư mục cấu hình đã mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key của nhà cung cấp đã lưu
- `.env` cho các bí mật runtime dựa trên env như `OPENCLAW_GATEWAY_TOKEN`

Các Plugin tải xuống đã cài đặt lưu trạng thái package của chúng trong OpenClaw home đã mount,
nên bản ghi cài đặt Plugin và gốc package vẫn tồn tại sau khi thay thế container.
Khởi động Gateway không tạo cây phụ thuộc cho Plugin đi kèm.

Để biết đầy đủ chi tiết duy trì dữ liệu trên các triển khai VM, xem
[Docker VM Runtime - Nội dung nào được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên,
`cron/runs/*.jsonl`, thư mục gốc của các gói Plugin đã cài đặt, và log tệp luân phiên
trong `/tmp/openclaw/`.

### Trình trợ giúp shell (tùy chọn)

Để quản lý Docker hằng ngày dễ hơn, hãy cài đặt `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Nếu bạn đã cài ClawDock từ đường dẫn raw cũ `scripts/shell-helpers/clawdock-helpers.sh`, hãy chạy lại lệnh cài đặt ở trên để tệp trợ giúp cục bộ của bạn theo vị trí mới.

Sau đó dùng `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, v.v. Chạy
`clawdock-help` để xem tất cả lệnh.
Xem [ClawDock](/vi/install/clawdock) để đọc hướng dẫn đầy đủ về trình trợ giúp.

<AccordionGroup>
  <Accordion title="Bật sandbox tác tử cho Docker gateway">
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

    Tập lệnh chỉ mount `docker.sock` sau khi các điều kiện tiên quyết của sandbox đạt. Nếu
    thiết lập sandbox không thể hoàn tất, tập lệnh đặt lại `agents.defaults.sandbox.mode`
    về `off`.

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
    có thể truy cập Gateway qua `127.0.0.1`. Hãy xem đây là một ranh giới tin cậy
    dùng chung. Cấu hình compose bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên cả `openclaw-gateway` và `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới dạng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy bảo đảm các bind mount của máy chủ thuộc sở hữu uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Build lại nhanh hơn">
    Sắp xếp Dockerfile để các layer phụ thuộc được lưu cache. Việc này tránh chạy lại
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
    Image mặc định ưu tiên bảo mật và chạy dưới dạng `node` không phải root. Để có một
    container đầy đủ tính năng hơn:

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
    Docker hoặc thiết lập không giao diện, hãy sao chép URL chuyển hướng đầy đủ mà bạn truy cập đến và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image nền tảng">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và xuất bản chú thích OCI
    cho image nền tảng, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Digest của Node base được
    làm mới qua các PR Dependabot Docker base-image; bản build phát hành không chạy
    layer nâng cấp distro. Xem
    [chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói binary, duy trì dữ liệu, và cập nhật.

## Sandbox tác tử

Khi `agents.defaults.sandbox` được bật với backend Docker, Gateway
chạy việc thực thi công cụ của tác tử (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập, trong khi bản thân Gateway vẫn ở trên máy chủ. Điều này tạo cho bạn một bức tường cứng
bao quanh các phiên tác tử không tin cậy hoặc đa bên thuê mà không cần container hóa toàn bộ
Gateway.

Phạm vi sandbox có thể là theo tác tử (mặc định), theo phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được mount tại `/workspace`. Bạn cũng có thể cấu hình
chính sách cho phép/từ chối công cụ, cô lập mạng, giới hạn tài nguyên, và
container trình duyệt.

Để xem cấu hình đầy đủ, image, ghi chú bảo mật, và hồ sơ đa tác tử, xem:

- [Sandboxing](/vi/gateway/sandboxing) -- tham chiếu sandbox đầy đủ
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

Build image sandbox mặc định (từ checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Với bản cài npm không có checkout mã nguồn, xem [Sandboxing § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` nội tuyến.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container sandbox không khởi động">
    Build image sandbox bằng
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
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), nguồn hóa
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước các
    đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm một tập lệnh trong `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM-killed trong khi build image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng một lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Chưa được ủy quyền hoặc cần ghép nối trong Control UI">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Devices](/vi/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép nối từ Docker CLI">
    Đặt lại chế độ và bind của Gateway:

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
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình Gateway sau khi cài đặt

---
read_when:
    - Bạn muốn một Gateway được đóng gói trong container thay vì các bản cài đặt cục bộ
    - Bạn đang xác thực quy trình Docker
summary: Thiết lập và hướng dẫn làm quen tùy chọn dựa trên Docker cho OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:45:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker là **tùy chọn**. Chỉ dùng nếu bạn muốn Gateway dạng container hoặc muốn xác thực luồng Docker.

## Docker có phù hợp với tôi không?

- **Có**: bạn muốn một môi trường Gateway tách biệt, dùng xong bỏ, hoặc muốn chạy OpenClaw trên một host không cài đặt cục bộ.
- **Không**: bạn đang chạy trên máy của mình và chỉ muốn vòng lặp phát triển nhanh nhất. Thay vào đó, hãy dùng luồng cài đặt thông thường.
- **Lưu ý về sandboxing**: backend sandbox mặc định dùng Docker khi sandboxing được bật, nhưng sandboxing tắt theo mặc định và **không** yêu cầu toàn bộ Gateway chạy trong Docker. Các backend sandbox SSH và OpenShell cũng có sẵn. Xem [Sandboxing](/vi/gateway/sandboxing).

## Điều kiện tiên quyết

- Docker Desktop (hoặc Docker Engine) + Docker Compose v2
- Ít nhất 2 GB RAM để build image (`pnpm install` có thể bị OOM-killed trên host 1 GB với mã thoát 137)
- Đủ dung lượng đĩa cho image và log
- Nếu chạy trên VPS/host công khai, hãy xem lại
  [Gia cố bảo mật khi mở mạng](/vi/gateway/security),
  đặc biệt là chính sách tường lửa Docker `DOCKER-USER`.

## Gateway dạng container

<Steps>
  <Step title="Build image">
    Từ gốc repo, chạy script thiết lập:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Lệnh này build image Gateway cục bộ. Để dùng image đã build sẵn thay thế:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Image build sẵn được phát hành tại
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Các tag phổ biến: `main`, `latest`, `<version>` (ví dụ `2026.2.26`).

  </Step>

  <Step title="Hoàn tất onboarding">
    Script thiết lập tự động chạy onboarding. Nó sẽ:

    - yêu cầu khóa API của nhà cung cấp
    - tạo token Gateway và ghi vào `.env`
    - khởi động Gateway qua Docker Compose

    Trong quá trình thiết lập, onboarding trước khi khởi động và các lần ghi cấu hình được chạy trực tiếp qua
    `openclaw-gateway`. `openclaw-cli` dành cho các lệnh bạn chạy sau khi
    container Gateway đã tồn tại.

  </Step>

  <Step title="Mở Control UI">
    Mở `http://127.0.0.1:18789/` trong trình duyệt và dán shared secret đã cấu hình
    vào Settings. Theo mặc định, script thiết lập ghi một token vào `.env`; nếu bạn chuyển cấu hình container sang xác thực bằng mật khẩu, hãy dùng mật khẩu đó
    thay thế.

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
Chạy `docker compose` từ gốc repo. Nếu bạn đã bật `OPENCLAW_EXTRA_MOUNTS`
hoặc `OPENCLAW_HOME_VOLUME`, script thiết lập sẽ ghi `docker-compose.extra.yml`;
hãy bao gồm nó bằng `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Vì `openclaw-cli` dùng chung namespace mạng của `openclaw-gateway`, nó là một
công cụ sau khởi động. Trước khi chạy `docker compose up -d openclaw-gateway`, hãy chạy onboarding
và các lần ghi cấu hình lúc thiết lập qua `openclaw-gateway` với
`--no-deps --entrypoint node`.
</Note>

### Biến môi trường

Script thiết lập chấp nhận các biến môi trường tùy chọn sau:

| Biến                                       | Mục đích                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Dùng image từ xa thay vì build cục bộ                           |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Cài đặt thêm các gói apt trong lúc build (phân tách bằng khoảng trắng) |
| `OPENCLAW_EXTENSIONS`                      | Bao gồm các helper Plugin được bundle đã chọn tại thời điểm build |
| `OPENCLAW_EXTRA_MOUNTS`                    | Các bind mount host bổ sung (phân tách bằng dấu phẩy `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | Duy trì `/home/node` trong một Docker volume có tên             |
| `OPENCLAW_SANDBOX`                         | Chọn tham gia khởi tạo sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | Bỏ qua bước onboarding tương tác (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | Ghi đè đường dẫn Docker socket                                  |
| `OPENCLAW_DISABLE_BONJOUR`                 | Tắt quảng bá Bonjour/mDNS (mặc định là `1` cho Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Tắt các overlay bind-mount mã nguồn Plugin được bundle          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP dùng chung cho xuất OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP theo từng tín hiệu cho trace, metric hoặc log     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Ghi đè giao thức OTLP. Hiện chỉ hỗ trợ `http/protobuf`          |
| `OTEL_SERVICE_NAME`                        | Tên dịch vụ dùng cho tài nguyên OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Chọn tham gia các thuộc tính ngữ nghĩa GenAI thử nghiệm mới nhất |
| `OPENCLAW_OTEL_PRELOADED`                  | Bỏ qua việc khởi động SDK OpenTelemetry thứ hai khi một SDK đã được tải sẵn |

Maintainer có thể kiểm thử mã nguồn Plugin được bundle với một image đã đóng gói bằng cách mount
một thư mục mã nguồn Plugin lên trên đường dẫn mã nguồn đã đóng gói của nó, ví dụ
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Thư mục mã nguồn được mount đó ghi đè bundle đã biên dịch tương ứng
`/app/dist/extensions/synology-chat` cho cùng id Plugin.

### Khả năng quan sát

Xuất OpenTelemetry là luồng outbound từ container Gateway đến OTLP
collector của bạn. Việc này không yêu cầu cổng Docker đã phát hành. Nếu bạn build image
cục bộ và muốn exporter OpenTelemetry được bundle có sẵn bên trong image,
hãy bao gồm các dependency runtime của nó:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Cài đặt Plugin chính thức `@openclaw/diagnostics-otel` từ ClawHub trong
các bản cài Docker đã đóng gói trước khi bật xuất. Image build từ mã nguồn tùy chỉnh vẫn có thể
bao gồm mã nguồn Plugin cục bộ bằng
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Để bật xuất, hãy cho phép và bật
Plugin `diagnostics-otel` trong cấu hình, rồi đặt
`diagnostics.otel.enabled=true` hoặc dùng ví dụ cấu hình trong [xuất OpenTelemetry
](/vi/gateway/opentelemetry). Header xác thực collector được cấu hình qua
`diagnostics.otel.headers`, không phải qua biến môi trường Docker.

Metric Prometheus dùng cổng Gateway đã được phát hành sẵn. Cài đặt
`clawhub:@openclaw/diagnostics-prometheus`, bật Plugin
`diagnostics-prometheus`, rồi scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

Route này được bảo vệ bằng xác thực Gateway. Không mở một cổng `/metrics`
công khai riêng hoặc đường dẫn reverse-proxy không xác thực. Xem
[metric Prometheus](/vi/gateway/prometheus).

### Kiểm tra sức khỏe

Endpoint probe của container (không yêu cầu xác thực):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image Docker bao gồm `HEALTHCHECK` tích hợp sẵn, ping `/healthz`.
Nếu các kiểm tra tiếp tục thất bại, Docker đánh dấu container là `unhealthy` và
các hệ thống điều phối có thể khởi động lại hoặc thay thế nó.

Snapshot sức khỏe sâu có xác thực:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN so với loopback

`scripts/docker/setup.sh` mặc định `OPENCLAW_GATEWAY_BIND=lan` để truy cập từ host đến
`http://127.0.0.1:18789` hoạt động với cơ chế phát hành cổng của Docker.

- `lan` (mặc định): trình duyệt host và CLI host có thể truy cập cổng Gateway đã phát hành.
- `loopback`: chỉ các tiến trình bên trong namespace mạng của container mới có thể truy cập
  trực tiếp Gateway.

<Note>
Dùng các giá trị chế độ bind trong `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), không dùng bí danh host như `0.0.0.0` hoặc `127.0.0.1`.
</Note>

### Nhà cung cấp cục bộ trên host

Khi OpenClaw chạy trong Docker, `127.0.0.1` bên trong container là chính container
đó, không phải máy host của bạn. Dùng `host.docker.internal` cho các nhà cung cấp AI
chạy trên host:

| Nhà cung cấp | URL mặc định của host     | URL thiết lập Docker                |
| ------------ | ------------------------- | ----------------------------------- |
| LM Studio    | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

Thiết lập Docker được bundle dùng các URL host đó làm mặc định onboarding cho LM Studio và Ollama,
và `docker-compose.yml` ánh xạ `host.docker.internal` đến
Gateway host của Docker cho Linux Docker Engine. Docker Desktop đã cung cấp
cùng hostname trên macOS và Windows.

Dịch vụ host cũng phải lắng nghe trên một địa chỉ có thể truy cập từ Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Nếu bạn dùng file Compose hoặc lệnh `docker run` riêng, hãy tự thêm cùng ánh xạ host
đó, ví dụ
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Mạng bridge của Docker thường không chuyển tiếp multicast Bonjour/mDNS
(`224.0.0.251:5353`) một cách đáng tin cậy. Vì vậy, thiết lập Compose được bundle mặc định
`OPENCLAW_DISABLE_BONJOUR=1` để Gateway không rơi vào vòng lặp crash hoặc liên tục
khởi động lại việc quảng bá khi bridge làm rơi lưu lượng multicast.

Dùng URL Gateway đã phát hành, Tailscale hoặc DNS-SD diện rộng cho host Docker.
Chỉ đặt `OPENCLAW_DISABLE_BONJOUR=0` khi chạy với host networking, macvlan,
hoặc một mạng khác mà multicast mDNS đã được biết là hoạt động.

Để biết các điểm dễ lỗi và cách khắc phục, xem [khám phá Bonjour](/vi/gateway/bonjour).

### Lưu trữ và duy trì dữ liệu

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` vào `/home/node/.openclaw` và
`OPENCLAW_WORKSPACE_DIR` vào `/home/node/.openclaw/workspace`, nên các đường dẫn đó
vẫn tồn tại sau khi thay thế container. Khi một trong hai biến chưa được đặt,
`docker-compose.yml` được bundle sẽ fallback về `${HOME}/.openclaw` (và
`${HOME}/.openclaw/workspace` cho workspace mount), hoặc `/tmp/.openclaw`
khi chính `HOME` cũng bị thiếu. Điều đó giúp `docker compose up` không
phát ra spec volume nguồn rỗng trên các môi trường tối thiểu.

Thư mục cấu hình được mount đó là nơi OpenClaw lưu:

- `openclaw.json` cho cấu hình hành vi
- `agents/<agentId>/agent/auth-profiles.json` cho xác thực OAuth/API-key đã lưu của nhà cung cấp
- `.env` cho các bí mật runtime dựa trên env như `OPENCLAW_GATEWAY_TOKEN`

Các Plugin có thể tải xuống đã cài đặt lưu trạng thái package của chúng dưới thư mục home OpenClaw
được mount, nên bản ghi cài đặt Plugin và gốc package vẫn tồn tại sau khi
thay thế container. Quá trình khởi động Gateway không tạo cây dependency cho Plugin được bundle.

Để biết đầy đủ chi tiết duy trì dữ liệu trên triển khai VM, xem
[Docker VM Runtime - Nội dung nào được duy trì ở đâu](/vi/install/docker-vm-runtime#what-persists-where).

**Điểm nóng tăng dung lượng đĩa:** theo dõi `media/`, các tệp JSONL phiên,
`cron/runs/*.jsonl`, thư mục gốc gói Plugin đã cài đặt, và nhật ký tệp luân phiên
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
Xem [ClawDock](/vi/install/clawdock) để đọc hướng dẫn đầy đủ về trình trợ giúp.

<AccordionGroup>
  <Accordion title="Bật hộp cát tác nhân cho Docker gateway">
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

    Tập lệnh chỉ gắn kết `docker.sock` sau khi các điều kiện tiên quyết của hộp cát đạt. Nếu
    quá trình thiết lập hộp cát không thể hoàn tất, tập lệnh đặt lại `agents.defaults.sandbox.mode`
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
    có thể truy cập Gateway qua `127.0.0.1`. Hãy coi đây là một ranh giới tin cậy
    dùng chung. Cấu hình compose loại bỏ `NET_RAW`/`NET_ADMIN` và bật
    `no-new-privileges` trên `openclaw-cli`.
  </Accordion>

  <Accordion title="Quyền và EACCES">
    Image chạy dưới dạng `node` (uid 1000). Nếu bạn thấy lỗi quyền trên
    `/home/node/.openclaw`, hãy đảm bảo các bind mount của máy chủ thuộc sở hữu của uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Dựng lại nhanh hơn">
    Sắp xếp Dockerfile để các lớp phụ thuộc được lưu vào bộ nhớ đệm. Điều này tránh chạy lại
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

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Nếu bạn chọn OpenAI Codex OAuth trong trình hướng dẫn, nó sẽ mở một URL trình duyệt. Trong
    Docker hoặc thiết lập headless, hãy sao chép URL chuyển hướng đầy đủ bạn nhận được và dán
    lại vào trình hướng dẫn để hoàn tất xác thực.
  </Accordion>

  <Accordion title="Siêu dữ liệu image cơ sở">
    Image runtime Docker chính dùng `node:24-bookworm-slim` và phát hành chú thích OCI
    cho image cơ sở, bao gồm `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source`, và các chú thích khác. Digest cơ sở Node được
    làm mới qua các PR image cơ sở Docker của Dependabot; bản dựng phát hành không chạy
    lớp nâng cấp bản phân phối. Xem
    [chú thích image OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Chạy trên VPS?

Xem [Hetzner (Docker VPS)](/vi/install/hetzner) và
[Docker VM Runtime](/vi/install/docker-vm-runtime) để biết các bước triển khai VM dùng chung,
bao gồm đóng gói binary, duy trì dữ liệu, và cập nhật.

## Hộp cát tác nhân

Khi `agents.defaults.sandbox` được bật với backend Docker, Gateway
chạy thực thi công cụ của tác nhân (shell, đọc/ghi tệp, v.v.) bên trong các container Docker
cô lập trong khi bản thân Gateway vẫn ở trên máy chủ. Điều này tạo một bức tường cứng
quanh các phiên tác nhân không tin cậy hoặc đa tenant mà không cần container hóa toàn bộ
Gateway.

Phạm vi hộp cát có thể theo từng tác nhân (mặc định), theo từng phiên, hoặc dùng chung. Mỗi phạm vi
có workspace riêng được gắn kết tại `/workspace`. Bạn cũng có thể cấu hình
chính sách công cụ cho phép/từ chối, cô lập mạng, giới hạn tài nguyên, và container
trình duyệt.

Để xem cấu hình đầy đủ, image, ghi chú bảo mật, và hồ sơ đa tác nhân, xem:

- [Hộp cát](/vi/gateway/sandboxing) -- tài liệu tham khảo đầy đủ về hộp cát
- [OpenShell](/vi/gateway/openshell) -- quyền truy cập shell tương tác vào container hộp cát
- [Hộp cát và công cụ đa tác nhân](/vi/tools/multi-agent-sandbox-tools) -- ghi đè theo từng tác nhân

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

Dựng image hộp cát mặc định (từ checkout mã nguồn):

```bash
scripts/sandbox-setup.sh
```

Đối với cài đặt npm không có checkout mã nguồn, xem [Hộp cát § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) để biết các lệnh `docker build` inline.

## Khắc phục sự cố

<AccordionGroup>
  <Accordion title="Thiếu image hoặc container hộp cát không khởi động">
    Dựng image hộp cát bằng
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout mã nguồn) hoặc lệnh `docker build` inline từ [Hộp cát § Image và thiết lập](/vi/gateway/sandboxing#images-and-setup) (cài đặt npm),
    hoặc đặt `agents.defaults.sandbox.docker.image` thành image tùy chỉnh của bạn.
    Container được tự động tạo theo từng phiên khi cần.
  </Accordion>

  <Accordion title="Lỗi quyền trong hộp cát">
    Đặt `docker.user` thành UID:GID khớp với quyền sở hữu workspace đã gắn kết của bạn,
    hoặc chown thư mục workspace.
  </Accordion>

  <Accordion title="Không tìm thấy công cụ tùy chỉnh trong hộp cát">
    OpenClaw chạy lệnh bằng `sh -lc` (login shell), nguồn từ
    `/etc/profile` và có thể đặt lại PATH. Đặt `docker.env.PATH` để thêm trước các
    đường dẫn công cụ tùy chỉnh của bạn, hoặc thêm tập lệnh trong `/etc/profile.d/` trong Dockerfile của bạn.
  </Accordion>

  <Accordion title="Bị OOM kill trong khi dựng image (exit 137)">
    VM cần ít nhất 2 GB RAM. Dùng lớp máy lớn hơn và thử lại.
  </Accordion>

  <Accordion title="Chưa được ủy quyền hoặc cần ghép đôi trong Control UI">
    Lấy liên kết dashboard mới và phê duyệt thiết bị trình duyệt:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Chi tiết hơn: [Dashboard](/vi/web/dashboard), [Thiết bị](/vi/cli/devices).

  </Accordion>

  <Accordion title="Mục tiêu Gateway hiển thị ws://172.x.x.x hoặc lỗi ghép đôi từ Docker CLI">
    Đặt lại chế độ Gateway và bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Liên quan

- [Tổng quan cài đặt](/vi/install) — tất cả phương thức cài đặt
- [Podman](/vi/install/podman) — lựa chọn thay thế Docker bằng Podman
- [ClawDock](/vi/install/clawdock) — thiết lập cộng đồng Docker Compose
- [Cập nhật](/vi/install/updating) — giữ OpenClaw luôn cập nhật
- [Cấu hình](/vi/gateway/configuration) — cấu hình Gateway sau khi cài đặt

---
read_when:
    - شما یک Gateway کانتینری‌شده را به‌جای نصب‌های محلی می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T11:51:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط اگر یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید، از آن استفاده کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید، یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب عادی استفاده کنید.
- **نکته Sandboxing**: وقتی sandboxing فعال باشد، backend پیش‌فرض sandbox از Docker استفاده می‌کند، اما sandboxing به‌صورت پیش‌فرض خاموش است و **نیازی ندارد** که کل Gateway در Docker اجرا شود. backendهای sandbox از نوع SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با exit 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، این مورد را مرور کنید:
  [Security hardening for network exposure](/fa/gateway/security)،
  به‌ویژه policy فایروال Docker `DOCKER-USER`.

## Gateway کانتینری

<Steps>
  <Step title="Build the image">
    از ریشه repo، اسکریپت setup را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image ازپیش‌ساخته به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای ازپیش‌ساخته در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    tagهای رایج: `main`، `latest`، `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    اسکریپت setup، onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - کلیدهای API ارائه‌دهنده را درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose شروع می‌کند

    در طول setup، onboarding پیش از شروع و نوشتن config مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شوند. `openclaw-cli` برای commandهایی است که پس از
    وجود داشتن container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="Open the Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و secret مشترک پیکربندی‌شده
    را در Settings وارد کنید. اسکریپت setup به‌صورت پیش‌فرض یک token در `.env`
    می‌نویسد؛ اگر config کانتینر را به احراز هویت با password تغییر دهید، به‌جای آن
    از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    از container مربوط به CLI برای افزودن channelهای پیام‌رسانی استفاده کنید:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp)، [Telegram](/fa/channels/telegram)، [Discord](/fa/channels/discord)

  </Step>
</Steps>

### جریان دستی

اگر ترجیح می‌دهید به‌جای استفاده از اسکریپت setup، هر مرحله را خودتان اجرا کنید:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` را از ریشه repo اجرا کنید. اگر `OPENCLAW_EXTRA_MOUNTS`
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت setup فایل `docker-compose.extra.yml`
را می‌نویسد؛ آن را با `-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام network مربوط به `openclaw-gateway` را به‌اشتراک
می‌گذارد، ابزاری پس از شروع است. پیش از `docker compose up -d openclaw-gateway`،
onboarding و نوشتن config زمان setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image دوردست به‌جای ساخت محلی                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب بسته‌های apt اضافی هنگام ساخت (جداشده با فاصله)             |
| `OPENCLAW_EXTENSIONS`                      | افزودن helperهای Plugin همراه انتخاب‌شده هنگام ساخت             |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای میزبان اضافی (`source:target[:opts]` جداشده با کاما) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker             |
| `OPENCLAW_SANDBOX`                         | انتخاب bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`)    |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر socket مربوط به Docker                            |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال‌سازی تبلیغ Bonjour/mDNS (برای Docker پیش‌فرض `1` است)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال‌سازی overlayهای bind-mount منبع Plugin همراه            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک گردآورنده OTLP/HTTP برای export در OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مختص signal برای traceها، metricها یا logها    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی protocol مربوط به OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | انتخاب attributeهای معنایی آزمایشی GenAI جدید                  |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

نگه‌دارنده‌ها می‌توانند منبع Plugin همراه را در برابر یک image بسته‌بندی‌شده با mount کردن
یک directory منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن directory منبع mountشده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان plugin id بازنویسی می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از container مربوط به Gateway به سمت گردآورنده OTLP
شما outbound است. به port منتشرشده Docker نیاز ندارد. اگر image را به‌صورت محلی
می‌سازید و می‌خواهید exporter همراه OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Plugin رسمی `@openclaw/diagnostics-otel` را در نصب‌های Docker بسته‌بندی‌شده پیش از
فعال‌سازی export نصب کنید. imageهای custom ساخته‌شده از source همچنان می‌توانند
منبع Plugin محلی را با `OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال‌سازی
export، Plugin `diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در [OpenTelemetry
export](/fa/gateway/opentelemetry) استفاده کنید. headerهای auth گردآورنده از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port ازقبل‌منتشرشده Gateway استفاده می‌کنند. Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. port عمومی جداگانه `/metrics`
یا مسیر reverse-proxy بدون احراز هویت در معرض دسترس قرار ندهید. [Prometheus metrics](/fa/gateway/prometheus)
را ببینید.

### بررسی‌های سلامت

endpointهای probe کانتینر (بدون نیاز به auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر checkها همچنان fail شوند، Docker container را به‌عنوان `unhealthy` علامت‌گذاری
می‌کند و سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot سلامت عمیق با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا
دسترسی host به `http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر host و CLI روی host می‌توانند به port منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط processهای داخل فضای نام network کانتینر می‌توانند مستقیماً به
  Gateway دسترسی داشته باشند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای host مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهنده‌های محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه دستگاه میزبان شما. برای ارائه‌دهنده‌های AI که روی host اجرا می‌شوند، از
`host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض host        | URL setup مربوط به Docker          |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

setup همراه Docker از این URLهای host به‌عنوان پیش‌فرض‌های onboarding برای LM Studio
و Ollama استفاده می‌کند، و `docker-compose.yml` نام `host.docker.internal` را برای
Linux Docker Engine به host gateway مربوط به Docker نگاشت می‌کند. Docker Desktop
همین hostname را از قبل روی macOS و Windows فراهم می‌کند.

serviceهای host همچنین باید روی نشانی‌ای listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا command `docker run` خودتان استفاده می‌کنید، همان نگاشت host
را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

networking از نوع bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل اتکا forward نمی‌کند. بنابراین setup همراه
Compose به‌صورت پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا وقتی bridge
ترافیک multicast را رها می‌کند، Gateway دچار crash-loop نشود یا تبلیغ را مکرراً
restart نکند.

برای hostهای Docker از URL منتشرشده Gateway، Tailscale یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط وقتی تنظیم کنید که با host networking، macvlan
یا network دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکته‌های مشکل‌ساز و عیب‌یابی، [Bonjour discovery](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` bind-mount می‌کند،
بنابراین این مسیرها پس از جایگزینی container باقی می‌مانند. وقتی هرکدام از این
متغیرها تنظیم نشده باشد، `docker-compose.yml` همراه به `${HOME}/.openclaw` (و برای
mount workspace به `${HOME}/.openclaw/workspace`) fallback می‌کند، یا وقتی خود
`HOME` هم موجود نباشد به `/tmp/.openclaw` برمی‌گردد. این کار جلوی emit شدن spec
volume با source خالی را در محیط‌های bare هنگام `docker compose up` می‌گیرد.

آن directory پیکربندی mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای auth ذخیره‌شده OAuth/API-key ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

Pluginهای دانلودشدنی نصب‌شده، وضعیت package خود را زیر home مربوط به OpenClaw که
mount شده ذخیره می‌کنند، بنابراین رکوردهای نصب Plugin و ریشه‌های package پس از
جایگزینی container باقی می‌مانند. startup مربوط به Gateway درخت‌های وابستگی
bundled-plugin تولید نمی‌کند.

برای جزئیات کامل پایداری در deploymentهای VM، [Docker VM Runtime - What persists where](/fa/install/docker-vm-runtime#what-persists-where)
را ببینید.

**نقاط داغ رشد دیسک:** مراقب `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های چرخشی فایل
زیر `/tmp/openclaw/` باشید.

### کمک‌کننده‌های Shell (اختیاری)

برای مدیریت روزمره ساده‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، دستور نصب بالا را دوباره اجرا کنید تا فایل کمک‌کننده محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همه فرمان‌ها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل کمک‌کننده، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر سوکت سفارشی (مثلا Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    اسکریپت فقط پس از گذراندن پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی sandbox کامل نشود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI
    بتوانند از طریق `127.0.0.1` به Gateway دسترسی پیدا کنند. با این مورد به‌عنوان یک مرز اعتماد
    مشترک برخورد کنید. پیکربندی compose، `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره
    `pnpm install` جلوگیری می‌کند، مگر اینکه lockfileها تغییر کنند:

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

  <Accordion title="Power-user container options">
    image پیش‌فرض با اولویت امنیت طراحی شده و به‌صورت `node` غیر root اجرا می‌شود. برای یک کانتینر
    کامل‌تر:

    1. **پایدارسازی `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **گنجاندن وابستگی‌های سیستم**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **نصب مرورگرهای Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **پایدارسازی دانلودهای مرورگر**: مقدار
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` را تنظیم کنید و از
       `OPENCLAW_HOME_VOLUME` یا `OPENCLAW_EXTRA_MOUNTS` استفاده کنید.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    اگر در wizard گزینه OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های headless، URL کامل redirect را که به آن می‌رسید کپی کنید و برای تکمیل auth
    آن را دوباره در wizard جای‌گذاری کنید.
  </Accordion>

  <Accordion title="Base image metadata">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای OCI
    مربوط به base-image از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه Node از طریق PRهای
    Dependabot مربوط به Docker base-image به‌روزرسانی می‌شود؛ buildهای release
    لایه ارتقای distro را اجرا نمی‌کنند. ببینید
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### اجرا روی VPS؟

برای مراحل استقرار VM مشترک، از جمله گنجاندن binary، پایداری و به‌روزرسانی‌ها، ببینید
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای Docker VM](/fa/install/docker-vm-runtime).

## sandbox عامل

وقتی `agents.defaults.sandbox` با backend Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجره فراهم می‌کند، بدون اینکه کل
Gateway کانتینری شود.

دامنه sandbox می‌تواند برای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های اجازه/رد ابزار، ایزوله‌سازی شبکه، محدودیت‌های منابع، و کانتینرهای مرورگر
را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [Sandboxing](/fa/gateway/sandboxing) -- مرجع کامل sandbox
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای sandbox
- [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای هر عامل

### فعال‌سازی سریع

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

image پیش‌فرض sandbox را بسازید (از checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، فرمان‌های inline `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    image مربوط به sandbox را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا فرمان inline `docker build` از [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    کانتینرها در صورت نیاز، برای هر نشست به‌صورت خودکار ساخته می‌شوند.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace mount‌شده شما مطابقت دارد،
    یا مالکیت پوشه workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که مسیرهای
    ابزار سفارشی شما را به ابتدا اضافه کند، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM به حداقل ۲ گیگابایت RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    یک لینک تازه dashboard بگیرید و دستگاه مرورگر را تایید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    حالت و bind مربوط به Gateway را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install) — همه روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی اجتماعی Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی Gateway پس از نصب

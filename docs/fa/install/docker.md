---
read_when:
    - یک Gateway کانتینری را به‌جای نصب‌های محلی می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید، یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمول استفاده کنید.
- **نکته Sandbox**: backend پیش‌فرض sandbox زمانی که sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌طور پیش‌فرض خاموش است و اجرای کامل Gateway در Docker را **لازم ندارد**. backendهای sandbox مبتنی بر SSH و OpenShell نیز در دسترس‌اند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروج 137 به‌دلیل کمبود حافظه متوقف شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER` را در
  [سخت‌سازی امنیت برای در معرض شبکه قرار گرفتن](/fa/gateway/security)
  مرور کنید.

## Gateway کانتینری

<Steps>
  <Step title="ساخت image">
    از ریشه repo، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image ازپیش‌ساخته به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای ازپیش‌ساخته در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    tagهای رایج: `main`، `latest`، `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت راه‌اندازی onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - کلیدهای API ارائه‌دهنده را درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose شروع می‌کند

    در زمان راه‌اندازی، onboarding پیش از شروع و نوشتن config از طریق
    `openclaw-gateway` به‌طور مستقیم اجرا می‌شوند. `openclaw-cli` برای دستورهایی است که پس از
    اینکه container مربوط به Gateway از قبل وجود داشت اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و shared secret پیکربندی‌شده را در Settings بچسبانید. اسکریپت راه‌اندازی به‌طور پیش‌فرض یک token در `.env` می‌نویسد؛ اگر config کانتینر را به password auth تغییر دادید، به‌جای آن از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی channelها (اختیاری)">
    برای افزودن channelهای پیام‌رسانی از کانتینر CLI استفاده کنید:

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

اگر ترجیح می‌دهید به‌جای استفاده از اسکریپت راه‌اندازی، هر مرحله را خودتان اجرا کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت راه‌اندازی `docker-compose.extra.yml` را می‌نویسد؛
آن را با `-f docker-compose.yml -f docker-compose.extra.yml` شامل کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` namespace شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک
ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن config زمان راه‌اندازی را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت راه‌اندازی این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image راه‌دور به‌جای ساخت محلی                      |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب بسته‌های apt اضافی در زمان ساخت (جداشده با فاصله)          |
| `OPENCLAW_EXTENSIONS`                      | شامل کردن helperهای Plugin بسته‌بندی‌شده منتخب در زمان ساخت    |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (جداشده با ویرگول `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker             |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی اختیاری bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                   | override مسیر socket مربوط به Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌طور پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount مربوط به source Plugin بسته‌بندی‌شده |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک collector مبتنی بر OTLP/HTTP برای export در OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مخصوص signal برای traceها، metricها یا logها  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام سرویس استفاده‌شده برای resourceهای OpenTelemetry            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی اختیاری جدیدترین attributeهای semantic آزمایشی GenAI |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

نگه‌دارندگان می‌توانند source مربوط به Plugin بسته‌بندی‌شده را در برابر یک image بسته‌بندی‌شده آزمایش کنند، با mount کردن
یک directory source متعلق به Plugin روی مسیر source بسته‌بندی‌شده آن، برای نمونه
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن directory source که mount شده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان plugin id override می‌کند.

### مشاهده‌پذیری

export در OpenTelemetry از کانتینر Gateway به collector
OTLP شما outbound است. به port منتشرشده Docker نیاز ندارد. اگر image را
محلی می‌سازید و می‌خواهید exporter بسته‌بندی‌شده OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را شامل کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Plugin رسمی `@openclaw/diagnostics-otel` را از ClawHub در
نصب‌های Docker بسته‌بندی‌شده پیش از فعال کردن export نصب کنید. imageهای سفارشی ساخته‌شده از source همچنان می‌توانند
source محلی Plugin را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` شامل کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در [export در OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید.
headerهای auth مربوط به collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port ازقبل منتشرشده Gateway استفاده می‌کنند. `clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با authentication مربوط به Gateway محافظت می‌شود. یک port عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون authentication را expose نکنید. [metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### health checkها

endpointهای probe کانتینر (بدون نیاز به auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر checkها همچنان شکست بخورند، Docker کانتینر را با وضعیت `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot سلامت عمیق با authentication:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌طور پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده Gateway برسند.
- `loopback`: فقط processهای داخل namespace شبکه کانتینر می‌توانند به‌طور مستقیم به
  Gateway برسند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL راه‌اندازی Docker              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی Docker بسته‌بندی‌شده از آن URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding
برای LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml`، `host.docker.internal` را به
host gateway مربوط به Docker برای Docker Engine روی Linux نگاشت می‌کند. Docker Desktop از قبل
همین hostname را روی macOS و Windows فراهم می‌کند.

سرویس‌های میزبان نیز باید روی نشانی‌ای listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose خودتان یا دستور `docker run` استفاده می‌کنید، همان نگاشت میزبان را
خودتان اضافه کنید، برای نمونه
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل‌اعتماد forward نمی‌کند. بنابراین راه‌اندازی Compose بسته‌بندی‌شده به‌طور پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway وقتی bridge ترافیک multicast را drop می‌کند crash-loop نشود یا
advertising را بارها restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکته‌های پنهان و troubleshooting، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` bind-mount می‌کند، بنابراین آن مسیرها
پس از جایگزینی کانتینر باقی می‌مانند. وقتی هرکدام از این متغیرها تنظیم نشده باشد، فایل بسته‌بندی‌شده
`docker-compose.yml` به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای mount مربوط به workspace)، یا `/tmp/.openclaw`
وقتی خود `HOME` هم وجود نداشته باشد fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های خام
یک spec مربوط به volume با source خالی emit کند.

آن directory پیکربندی mount‌شده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای auth ذخیره‌شده OAuth/API-key ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مثل `OPENCLAW_GATEWAY_TOKEN`

Pluginهای قابل‌دانلود نصب‌شده وضعیت package خود را زیر home مربوط به OpenClaw که mount شده ذخیره می‌کنند،
بنابراین رکوردهای نصب Plugin و ریشه‌های package پس از جایگزینی کانتینر باقی می‌مانند.
شروع Gateway درخت‌های وابستگی Pluginهای بسته‌بندی‌شده را تولید نمی‌کند.

برای جزئیات کامل پایداری در deploymentهای VM، [Docker VM Runtime - چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where) را ببینید.

**نقاط داغ رشد دیسک:** مراقب `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های فایل چرخشی
زیر `/tmp/openclaw/` باشید.

### کمک‌کننده‌های Shell (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، دستور نصب بالا را دوباره اجرا کنید تا فایل کمک‌کننده محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همه دستورها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل کمک‌کننده، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی جعبه‌شن عامل برای Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر سوکت سفارشی (مثلاً Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    اسکریپت فقط پس از گذراندن پیش‌نیازهای جعبه‌شن، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی جعبه‌شن کامل نشود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="اتوماسیون / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="یادداشت امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا دستورهای CLI
    بتوانند از طریق `127.0.0.1` به gateway برسند. با این مورد به‌عنوان یک
    مرز اعتماد مشترک برخورد کنید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز دیدید، مطمئن شوید bind mountهای میزبان شما مالکیت uid 1000 دارند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره
    `pnpm install` جلوگیری می‌کند مگر اینکه lockfileها تغییر کنند:

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

  <Accordion title="گزینه‌های کانتینر برای کاربران حرفه‌ای">
    image پیش‌فرض اولویت را به امنیت می‌دهد و به‌صورت `node` غیر root اجرا می‌شود. برای یک
    کانتینر کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قرار دادن وابستگی‌های سیستم داخل image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **نصب مرورگرهای Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **ماندگار کردن دانلودهای مرورگر**: مقدار
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` را تنظیم کنید و از
       `OPENCLAW_HOME_VOLUME` یا `OPENCLAW_EXTRA_MOUNTS` استفاده کنید.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر در wizard گزینه OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect را که به آن می‌رسید کپی کنید و برای تکمیل احراز هویت
    دوباره در wizard بچسبانید.
  </Accordion>

  <Accordion title="فراداده image پایه">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای OCI
    مربوط به image پایه را منتشر می‌کند، از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source` و موارد دیگر. digest پایه Node
    از طریق PRهای Dependabot Docker base-image تازه‌سازی می‌شود؛ buildهای انتشار
    یک لایه ارتقای distro اجرا نمی‌کنند. ببینید:
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای گام‌های استقرار VM مشترک، از جمله ساخت binary در image، ماندگاری و به‌روزرسانی‌ها،
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[Docker VM Runtime](/fa/install/docker-vm-runtime) را ببینید.

## جعبه‌شن عامل

وقتی `agents.defaults.sandbox` با backend Docker فعال باشد، gateway
اجرای ابزار عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای Docker
ایزوله اجرا می‌کند، در حالی که خود gateway روی میزبان باقی می‌ماند. این کار یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجره ایجاد می‌کند، بدون اینکه کل
gateway را کانتینری کنید.

دامنه جعبه‌شن می‌تواند به‌ازای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های allow/deny ابزار، جداسازی شبکه، محدودیت‌های منابع و کانتینرهای
مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، یادداشت‌های امنیتی و profileهای چندعاملی، ببینید:

- [جعبه‌شن](/fa/gateway/sandboxing) -- مرجع کامل جعبه‌شن
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای جعبه‌شن
- [جعبه‌شن و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای به‌ازای هر عامل

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

image پیش‌فرض جعبه‌شن را بسازید (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای دستورهای inline `docker build`، [جعبه‌شن § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Image وجود ندارد یا کانتینر جعبه‌شن شروع نمی‌شود">
    image جعبه‌شن را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا دستور inline `docker build` از [جعبه‌شن § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    کانتینرها به‌صورت خودکار و هنگام نیاز برای هر نشست ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در جعبه‌شن">
    `docker.user` را روی UID:GID تنظیم کنید که با مالکیت workspace mount‌شده شما مطابقت دارد،
    یا مالکیت پوشه workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در جعبه‌شن پیدا نمی‌شوند">
    OpenClaw دستورها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را برای prepend کردن
    مسیرهای ابزار سفارشی خود تنظیم کنید، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در زمان build image به‌دلیل OOM کشته شد (exit 137)">
    VM به حداقل 2 GB RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="در Control UI غیرمجاز است یا pairing لازم دارد">
    یک لینک dashboard تازه بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x نشان می‌دهد یا Docker CLI خطاهای pairing می‌دهد">
    حالت gateway و bind را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install) — همه روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی جامعه با Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی gateway پس از نصب

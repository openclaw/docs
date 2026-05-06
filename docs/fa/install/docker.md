---
read_when:
    - به‌جای نصب‌های محلی، یک Gateway کانتینری می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید، یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب عادی استفاده کنید.
- **نکته Sandboxing**: وقتی sandboxing فعال باشد، backend پیش‌فرض sandbox از Docker استفاده می‌کند، اما sandboxing به‌صورت پیش‌فرض خاموش است و **نیازی ندارد** کل Gateway در Docker اجرا شود. backendهای SSH و OpenShell sandbox نیز در دسترس‌اند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با exit 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER`، [سخت‌سازی امنیتی برای قرارگیری در معرض شبکه](/fa/gateway/security) را مرور کنید.

## Gateway کانتینری

<Steps>
  <Step title="Build the image">
    از ریشه repo، اسکریپت setup را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از image ازپیش‌ساخته به‌جای آن:

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

    - برای کلیدهای API ارائه‌دهنده prompt می‌دهد
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose راه‌اندازی می‌کند

    در طول setup، onboarding پیش از شروع و نوشتن‌های config از طریق
    `openclaw-gateway` به‌طور مستقیم اجرا می‌شوند. `openclaw-cli` برای commandهایی است که پس از
    وجود داشتن container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="Open the Control UI">
    `http://127.0.0.1:18789/` را در browser باز کنید و shared secret پیکربندی‌شده
    را در Settings وارد کنید. اسکریپت setup به‌صورت پیش‌فرض یک token در `.env`
    می‌نویسد؛ اگر config کانتینر را به password auth تغییر دهید، به‌جای آن از همان
    password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    از container مربوط به CLI برای افزودن کانال‌های پیام‌رسانی استفاده کنید:

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
را می‌نویسد؛ آن را با `-f docker-compose.yml -f docker-compose.extra.yml` شامل کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، ابزاری
پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن‌های config زمان setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image راه‌دور به‌جای ساخت محلی                     |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب packageهای apt اضافه هنگام build (با فاصله جداشده)        |
| `OPENCLAW_EXTENSIONS`                      | شامل کردن helperهای Plugin همراه انتخاب‌شده هنگام build        |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافه میزبان (با کاما جداشده `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker            |
| `OPENCLAW_SANDBOX`                         | opt in به bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | override کردن مسیر socket مربوط به Docker                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌صورت پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount منبع Plugin همراه           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک collector مربوط به OTLP/HTTP برای export در OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مختص signal برای traceها، metricها یا logها   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام سرویس استفاده‌شده برای resourceهای OpenTelemetry           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | opt in به جدیدترین attributeهای semantic آزمایشی GenAI         |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

نگه‌دارندگان می‌توانند منبع Plugin همراه را در برابر یک image بسته‌بندی‌شده آزمایش کنند، با mount کردن
یک directory منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن directory منبع mountشده، bundle کامپایل‌شده مطابق
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin override می‌کند.

### Observability

export مربوط به OpenTelemetry از container مربوط به Gateway به سمت collector
OTLP شما خروجی است. به پورت منتشرشده Docker نیاز ندارد. اگر image را
به‌صورت محلی می‌سازید و می‌خواهید exporter همراه OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را شامل کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

پیش از فعال کردن export، Plugin رسمی `@openclaw/diagnostics-otel` را از ClawHub در
نصب‌های Docker بسته‌بندی‌شده نصب کنید. imageهای سفارشی ساخته‌شده از source همچنان می‌توانند
منبع Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` شامل کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از مثال config در [export مربوط به OpenTelemetry](/fa/gateway/opentelemetry)
استفاده کنید. headerهای auth مربوط به collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از پورت ازپیش‌منتشرشده Gateway استفاده می‌کنند. نصب کنید
`clawhub:@openclaw/diagnostics-prometheus`، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با authentication مربوط به Gateway محافظت می‌شود. پورت عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون authentication را در معرض قرار ندهید. [metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### Health checkها

endpointهای probe کانتینر (بدون نیاز به auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر checkها همچنان fail شوند، Docker کانتینر را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot عمیق سلامت با authentication:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار پورت Docker کار کند.

- `lan` (پیش‌فرض): browser میزبان و CLI میزبان می‌توانند به پورت منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط processهای داخل فضای نام شبکه container می‌توانند مستقیماً به
  Gateway دسترسی داشته باشند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل container خود container است،
نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL setup مربوط به Docker           |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

setup همراه Docker از این URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding مربوط به LM Studio و Ollama
استفاده می‌کند، و `docker-compose.yml`، `host.docker.internal` را برای Linux Docker Engine به
Gateway میزبان Docker map می‌کند. Docker Desktop از قبل همین hostname را روی macOS و Windows فراهم می‌کند.

سرویس‌های میزبان همچنین باید روی addressی listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا command `docker run` خودتان استفاده می‌کنید، همان mapping میزبان
را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

bridge networking در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل اتکا forward نمی‌کند. بنابراین setup همراه Compose به‌صورت پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا وقتی bridge ترافیک multicast را drop می‌کند،
Gateway وارد crash-loop نشود یا تبلیغ را مکرراً restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که می‌دانید multicast مربوط به mDNS در آن کار می‌کند.

برای نکات مشکل‌ساز و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### Storage و persistence

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` به‌صورت bind-mount متصل می‌کند، بنابراین آن مسیرها
پس از جایگزینی container باقی می‌مانند. وقتی هرکدام از این متغیرها تنظیم نشده باشد، فایل همراه
`docker-compose.yml` به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای mount فضای کاری) fallback می‌کند، یا وقتی خود `HOME`
نیز وجود نداشته باشد به `/tmp/.openclaw` fallback می‌کند. این کار مانع از آن می‌شود که
`docker compose up` در محیط‌های bare یک مشخصه volume با source خالی صادر کند.

آن directory پیکربندی mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای auth ذخیره‌شده ارائه‌دهنده OAuth/API-key
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

Pluginهای دانلودی نصب‌شده، وضعیت package خود را زیر home mountشده OpenClaw ذخیره می‌کنند، بنابراین recordهای نصب Plugin و ریشه‌های package پس از جایگزینی container باقی می‌مانند. شروع Gateway، درخت‌های وابستگی bundled-plugin تولید نمی‌کند.

برای جزئیات کامل persistence در deploymentهای VM، [Docker VM Runtime - چه چیزی کجا باقی می‌ماند](/fa/install/docker-vm-runtime#what-persists-where) را ببینید.

**نقاط پرتکرار رشد دیسک:** `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های چرخشی فایل
زیر `/tmp/openclaw/` را زیر نظر بگیرید.

### کمک‌کننده‌های شل (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل کمک‌کننده محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همه فرمان‌ها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل کمک‌کننده، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی سندباکس عامل برای Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر سوکت سفارشی (مثلاً Docker بدون ریشه):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    این اسکریپت فقط پس از گذر کردن پیش‌نیازهای سندباکس، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی سندباکس نتواند کامل شود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="خودکارسازی / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="یادداشت امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI
    بتوانند از طریق `127.0.0.1` به Gateway دسترسی داشته باشند. این را به‌عنوان یک مرز اعتماد مشترک
    در نظر بگیرید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="مجوزها و EACCES">
    این image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز دیدید، مطمئن شوید bind mountهای میزبان شما مالکیت uid 1000 دارند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین ناهماهنگی می‌تواند به‌شکل هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. این یعنی uid فرایند و مالک
    دایرکتوری Plugin نصب‌شده با هم همخوان نیستند. ترجیحاً container را با uid پیش‌فرض 1000 اجرا کنید
    و مالکیت bind mount را اصلاح کنید. فقط در صورتی مالکیت
    `/path/to/openclaw-config/npm` را به `root:root` تغییر دهید که عمداً می‌خواهید
    OpenClaw را در بلندمدت به‌عنوان root اجرا کنید.

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
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

  <Accordion title="گزینه‌های container برای کاربران حرفه‌ای">
    image پیش‌فرض امنیت‌محور است و به‌صورت غیر-root با `node` اجرا می‌شود. برای یک
    container کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قراردادن وابستگی‌های سیستم در image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect که به آن می‌رسید را کپی کنید و
    برای تکمیل احراز هویت دوباره در wizard جای‌گذاری کنید.
  </Accordion>

  <Accordion title="فراداده image پایه">
    image اصلی runtime در Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای base-image در OCI
    از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه Node
    از طریق PRهای base-image Docker در Dependabot تازه‌سازی می‌شود؛ buildهای انتشار
    لایه ارتقای توزیع را اجرا نمی‌کنند. ببینید
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای مراحل استقرار VM مشترک، از جمله قراردادن binary در image، ماندگاری، و به‌روزرسانی‌ها،
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[Runtime مربوط به Docker VM](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، Gateway
اجرای ابزارهای عامل (شل، خواندن/نوشتن فایل و غیره) را داخل containerهای جداافتاده Docker
اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجری ایجاد می‌کند، بدون اینکه کل
Gateway را containerize کنید.

دامنه سندباکس می‌تواند به‌ازای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دریافت می‌کند که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های مجاز/غیرمجاز ابزار، جداسازی شبکه، محدودیت‌های منابع، و containerهای مرورگر
را پیکربندی کنید.

برای پیکربندی کامل، imageها، یادداشت‌های امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [سندباکس‌سازی](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
- [OpenShell](/fa/gateway/openshell) -- دسترسی شل تعاملی به containerهای سندباکس
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای به‌ازای هر عامل

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

image پیش‌فرض سندباکس را بسازید (از checkout سورس):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout سورس، فرمان‌های inline مربوط به `docker build` را در [سندباکس‌سازی § imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image پیدا نمی‌شود یا container سندباکس شروع نمی‌شود">
    image سندباکس را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout سورس) یا فرمان inline مربوط به `docker build` از [سندباکس‌سازی § imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm)
    بسازید، یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خودتان تنظیم کنید.
    containerها هنگام نیاز، به‌ازای هر نشست به‌صورت خودکار ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace نصب‌شده شما همخوان باشد،
    یا مالکیت پوشه workspace را تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید
    که مسیرهای ابزار سفارشی شما را در ابتدا قرار دهد، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="هنگام build image به‌دلیل OOM کشته شد (خروج 137)">
    VM به حداقل 2 GB RAM نیاز دارد. از یک کلاس ماشین بزرگ‌تر استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="غیرمجاز یا نیازمند pairing در رابط کاربری کنترل">
    یک لینک تازه داشبورد بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [داشبورد](/fa/web/dashboard)، [دستگاه‌ها](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x نشان می‌دهد یا Docker CLI خطاهای pairing می‌دهد">
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
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه‌داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی Gateway پس از نصب

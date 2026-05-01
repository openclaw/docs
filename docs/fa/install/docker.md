---
read_when:
    - به‌جای نصب‌های محلی، یک Gateway کانتینری‌شده می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-01T11:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2916666ab7a4bc8f8ee9c954283097aaf0a1178eeaa814abe20680b853216e4
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب عادی استفاده کنید.
- **یادداشت sandboxing**: backend پیش‌فرض sandbox زمانی که sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌طور پیش‌فرض غیرفعال است و اجرای کامل Gateway در Docker را **الزامی** نمی‌کند. backendهای sandbox مربوط به SSH و OpenShell نیز در دسترس‌اند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- دست‌کم ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروجی 137 به‌دلیل OOM متوقف شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید،
  [Security hardening for network exposure](/fa/gateway/security) را مرور کنید،
  به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER`.

## Gateway کانتینری

<Steps>
  <Step title="Build the image">
    از ریشه repo، اسکریپت setup را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image از پیش ساخته‌شده به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای از پیش ساخته‌شده در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) منتشر می‌شوند.
    تگ‌های رایج: `main`، `latest`، `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    اسکریپت setup فرایند onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API ارائه‌دهنده درخواست می‌دهد
    - یک توکن Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose راه‌اندازی می‌کند

    هنگام setup، onboarding پیش از شروع و نوشتن config از طریق
    `openclaw-gateway` به‌طور مستقیم اجرا می‌شوند. `openclaw-cli` برای فرمان‌هایی است که پس از
    ایجاد شدن container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="Open the Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و shared secret پیکربندی‌شده را در Settings وارد کنید. اسکریپت setup به‌طور پیش‌فرض یک توکن در `.env` می‌نویسد؛ اگر config مربوط به container را به احراز هویت با گذرواژه تغییر دهید، به‌جای آن از همان گذرواژه استفاده کنید.

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

اگر ترجیح می‌دهید به‌جای استفاده از اسکریپت setup هر مرحله را خودتان اجرا کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت setup فایل `docker-compose.extra.yml` را می‌نویسد؛
آن را با `-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن config در زمان setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از یک image راه دور به‌جای ساخت محلی                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب packageهای apt اضافی هنگام build (با فاصله جدا شوند)       |
| `OPENCLAW_EXTENSIONS`                      | نصب پیشاپیش وابستگی‌های Plugin هنگام build (نام‌ها با فاصله جدا شوند) |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (با ویرگول جدا شوند: `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌گذاری‌شده Docker      |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | مسیر container برای وابستگی‌ها و mirrorهای تولیدشده Pluginهای bundled |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر socket مربوط به Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال‌سازی تبلیغ Bonjour/mDNS (برای Docker به‌طور پیش‌فرض `1` است) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال‌سازی overlayهای bind-mount منبع Pluginهای bundled      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک OTLP/HTTP collector برای export مربوط به OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP ویژه signal برای traceها، metricها یا logها   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی protocol مربوط به OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی attributeهای معنایی آزمایشی جدید GenAI               |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry زمانی که یکی از قبل preload شده است |

maintainerها می‌توانند منبع Plugin bundled را در برابر یک image بسته‌بندی‌شده با mount کردن
یک دایرکتوری منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری منبع mount شده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان plugin id بازنویسی می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از container مربوط به Gateway به سمت OTLP
collector شما خروجی است. به port منتشرشده Docker نیاز ندارد. اگر image را
به‌صورت محلی build می‌کنید و می‌خواهید exporter bundled OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

image رسمی انتشار Docker مربوط به OpenClaw شامل منبع Plugin bundled
`diagnostics-otel` است. بسته به image و وضعیت cache، ممکن است Gateway
هنوز هم وابستگی‌های runtime محلی Plugin مربوط به OpenTelemetry را نخستین بار که Plugin فعال می‌شود stage کند، بنابراین اجازه دهید نخستین boot به package registry دسترسی داشته باشد یا image را در release lane خود prewarm کنید. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در
[OpenTelemetry export](/fa/gateway/opentelemetry) استفاده کنید. headerهای احراز هویت collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port از پیش منتشرشده Gateway استفاده می‌کنند. Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک port عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون احراز هویت منتشر نکنید. [Prometheus metrics](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe مربوط به container (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر checkها همچنان شکست بخورند، Docker وضعیت container را `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestrator می‌توانند آن را restart یا replace کنند.

snapshot عمیق سلامت با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` مقدار پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط فرایندهای داخل فضای نام شبکه container می‌توانند
  به‌طور مستقیم به Gateway دسترسی داشته باشند.

<Note>
از مقادیر حالت bind در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل container خود container است،
نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL مربوط به setup در Docker         |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

setup bundled Docker از این URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding برای LM Studio و Ollama
استفاده می‌کند، و `docker-compose.yml` مقدار `host.docker.internal` را به
Gateway میزبان Docker برای Linux Docker Engine نگاشت می‌کند. Docker Desktop از قبل همین hostname را روی macOS و Windows فراهم می‌کند.

serviceهای میزبان نیز باید روی آدرسی listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان
را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌شکل قابل اتکا forward نمی‌کند. بنابراین setup bundled Compose به‌طور پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا وقتی bridge ترافیک multicast را drop می‌کند، Gateway وارد crash-loop نشود یا تبلیغ را repeatedly restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکات و عیب‌یابی، [Bonjour discovery](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` bind-mount می‌کند، بنابراین این مسیرها
پس از جایگزینی container باقی می‌مانند. وقتی هرکدام از این متغیرها تنظیم نشده باشد، فایل bundled
`docker-compose.yml` به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای mount مربوط به workspace)، یا زمانی که خود `HOME` هم موجود نباشد به `/tmp/.openclaw`
fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های خام
یک volume spec با source خالی منتشر کند.

آن دایرکتوری config mount شده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

وابستگی‌های runtime مربوط به Pluginهای همراه و فایل‌های runtime آینه‌شده، وضعیت تولیدشده هستند، نه پیکربندی کاربر. Compose آن‌ها را در Docker volume نام‌گذاری‌شده‌ی `openclaw-plugin-runtime-deps` ذخیره می‌کند که در مسیر `/var/lib/openclaw/plugin-runtime-deps` mount شده است. بیرون نگه داشتن این درخت با تغییرات زیاد از bind mount پیکربندی میزبان، از کندی عملیات فایل در Docker Desktop/WSL و handleهای کهنه‌ی Windows هنگام راه‌اندازی سرد Gateway جلوگیری می‌کند.

فایل پیش‌فرض Compose مقدار `OPENCLAW_PLUGIN_STAGE_DIR` را برای هر دو `openclaw-gateway` و `openclaw-cli` روی همین مسیر تنظیم می‌کند، بنابراین `openclaw doctor --fix`، فرمان‌های ورود/راه‌اندازی کانال، و راه‌اندازی Gateway همگی از همان volume تولیدشده‌ی runtime استفاده می‌کنند.

برای جزئیات کامل ماندگاری در استقرارهای VM، ببینید:
[Docker VM Runtime - What persists where](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست، `cron/runs/*.jsonl`، Docker volume به نام `openclaw-plugin-runtime-deps`، و لاگ‌های چرخشی فایل زیر `/tmp/openclaw/` را زیر نظر داشته باشید.

### کمک‌ابزارهای shell (اختیاری)

برای مدیریت روزمره‌ی آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل کمک‌ابزار محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و مانند آن استفاده کنید. برای همه‌ی فرمان‌ها `clawdock-help` را اجرا کنید.
برای راهنمای کامل کمک‌ابزار، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی sandbox عامل برای Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر socket سفارشی (برای مثال Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    اسکریپت فقط پس از موفق بودن پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر راه‌اندازی sandbox کامل نشود، اسکریپت مقدار `agents.defaults.sandbox.mode` را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="اتوماسیون / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="نکته‌ی امنیتی شبکه‌ی مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI بتوانند از طریق `127.0.0.1` به gateway برسند. با این وضعیت مانند یک مرز اعتماد مشترک رفتار کنید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و `no-new-privileges` را روی `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره‌ی `pnpm install` جلوگیری می‌کند مگر این‌که lockfileها تغییر کنند:

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

  <Accordion title="گزینه‌های کانتینر برای کاربران پیشرفته">
    image پیش‌فرض امنیت‌محور است و با `node` غیر root اجرا می‌شود. برای کانتینری با امکانات کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قرار دادن وابستگی‌های سیستم در image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    اگر OpenAI Codex OAuth را در wizard انتخاب کنید، یک URL مرورگر باز می‌شود. در Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect را که به آن می‌رسید کپی کنید و برای تکمیل احراز هویت دوباره در wizard جای‌گذاری کنید.
  </Accordion>

  <Accordion title="فراداده‌ی image پایه">
    image اصلی runtime مربوط به Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای OCI مربوط به image پایه، از جمله `org.opencontainers.image.base.name`، `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه‌ی Node از طریق PRهای Dependabot برای Docker base-image تازه‌سازی می‌شود؛ buildهای انتشار، لایه‌ی ارتقای توزیع اجرا نمی‌کنند. ببینید:
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای مراحل استقرار VM مشترک، از جمله قرار دادن binary در image، ماندگاری و به‌روزرسانی‌ها، [Hetzner (Docker VPS)](/fa/install/hetzner) و
[Docker VM Runtime](/fa/install/docker-vm-runtime) را ببینید.

## sandbox عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، gateway اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای جداافتاده‌ی Docker اجرا می‌کند، در حالی که خود gateway روی میزبان باقی می‌ماند. این کار بدون کانتینری کردن کل gateway، دیواری سخت پیرامون نشست‌های عامل غیرقابل‌اعتماد یا چندمستاجری ایجاد می‌کند.

دامنه‌ی sandbox می‌تواند برای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید سیاست‌های allow/deny برای ابزارها، جداسازی شبکه، محدودیت‌های منابع، و کانتینرهای مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [Sandboxing](/fa/gateway/sandboxing) -- مرجع کامل sandbox
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای sandbox
- [Multi-Agent Sandbox and Tools](/fa/tools/multi-agent-sandbox-tools) -- overrideهای هر عامل

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

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build`، [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) را ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image وجود ندارد یا کانتینر sandbox شروع نمی‌شود">
    image مربوط به sandbox را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا فرمان درون‌خطی `docker build` از [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    کانتینرها هنگام نیاز، به‌طور خودکار برای هر نشست ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در sandbox">
    مقدار `docker.user` را روی UID:GID منطبق با مالکیت workspace mountشده‌ی خود تنظیم کنید،
    یا مالکیت پوشه‌ی workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در sandbox پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که مسیرهای ابزار سفارشی شما را در ابتدا قرار دهد، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در هنگام ساخت image به‌دلیل OOM متوقف شد (exit 137)">
    VM به حداقل ۲ گیگابایت RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="Unauthorized یا نیاز به pairing در Control UI">
    یک پیوند تازه‌ی dashboard بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x نشان می‌دهد یا از Docker CLI خطاهای pairing می‌آید">
    حالت و bind مربوط به gateway را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [Install Overview](/fa/install) — همه‌ی روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی جامعه‌محور Docker Compose
- [Updating](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [Configuration](/fa/gateway/configuration) — پیکربندی gateway پس از نصب

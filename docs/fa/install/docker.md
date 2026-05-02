---
read_when:
    - شما به‌جای نصب‌های محلی، یک Gateway کانتینری می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا قصد دارید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و موقت می‌خواهید، یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **نکته سندباکس**: وقتی سندباکس فعال باشد، backend پیش‌فرض سندباکس از Docker استفاده می‌کند، اما سندباکس به‌صورت پیش‌فرض غیرفعال است و برای اجرای کامل Gateway در Docker **نیازی** ندارد. backendهای سندباکس SSH و OpenShell نیز در دسترس هستند. [سندباکس](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروجی ۱۳۷ به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و لاگ‌ها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، 
  [سخت‌سازی امنیتی برای در معرض شبکه قرار گرفتن](/fa/gateway/security)
  را مرور کنید، به‌ویژه سیاست فایروال Docker `DOCKER-USER`.

## Gateway کانتینری

<Steps>
  <Step title="Build the image">
    از ریشه repo، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image ازپیش‌ساخته‌شده به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای ازپیش‌ساخته‌شده در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    tagهای رایج: `main`، `latest`، `<version>` (برای مثال `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    اسکریپت راه‌اندازی onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API ارائه‌دهنده درخواست می‌دهد
    - یک توکن Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose شروع می‌کند

    هنگام راه‌اندازی، onboarding پیش از شروع و نوشتن config مستقیما از طریق
    `openclaw-gateway` اجرا می‌شود. `openclaw-cli` برای فرمان‌هایی است که بعد از
    وجود داشتن کانتینر Gateway اجرا می‌کنید.

  </Step>

  <Step title="Open the Control UI">
    `http://127.0.0.1:18789/` را در مرورگر باز کنید و secret مشترک پیکربندی‌شده
    را در Settings جای‌گذاری کنید. اسکریپت راه‌اندازی به‌صورت پیش‌فرض یک توکن را در `.env`
    می‌نویسد؛ اگر config کانتینر را به احراز هویت با password تغییر دادید، به‌جای آن از همان
    password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    برای افزودن کانال‌های پیام‌رسانی از کانتینر CLI استفاده کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت راه‌اندازی `docker-compose.extra.yml`
را می‌نویسد؛ آن را با `-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
چون `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک ابزار
پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن config زمان راه‌اندازی را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت راه‌اندازی این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                     | هدف                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image ریموت به‌جای ساخت محلی                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب بسته‌های apt اضافی هنگام ساخت (جداشده با فاصله)            |
| `OPENCLAW_EXTENSIONS`                      | اضافه کردن helperهای Plugin بسته‌بندی‌شده انتخابی هنگام ساخت  |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (جداشده با ویرگول `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker            |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی bootstrap سندباکس (`1`، `true`، `yes`، `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر socket Docker                                   |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (پیش‌فرض برای Docker برابر `1` است) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount منبع Plugin بسته‌بندی‌شده  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint گردآورنده مشترک OTLP/HTTP برای export OpenTelemetry  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP ویژه سیگنال برای traceها، metricها یا logها  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی protocol OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی جدیدترین attributeهای معنایی آزمایشی GenAI          |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع یک SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

نگه‌دارندگان می‌توانند منبع Plugin بسته‌بندی‌شده را در برابر یک image بسته‌بندی‌شده
با mount کردن یک دایرکتوری منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری منبع mountشده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin بازنویسی می‌کند.

### مشاهده‌پذیری

export OpenTelemetry از کانتینر Gateway به گردآورنده OTLP شما به‌صورت outbound انجام می‌شود.
به پورت Docker منتشرشده نیاز ندارد. اگر image را به‌صورت محلی می‌سازید
و می‌خواهید exporter بسته‌بندی‌شده OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

در نصب‌های Docker بسته‌بندی‌شده، پیش از فعال کردن export، Plugin رسمی
`@openclaw/diagnostics-otel` را از ClawHub نصب کنید. imageهای سفارشی ساخته‌شده از منبع
همچنان می‌توانند منبع Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در [export OpenTelemetry](/fa/gateway/opentelemetry)
استفاده کنید. headerهای احراز هویت گردآورنده از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از پورت Gateway که از قبل منتشر شده استفاده می‌کنند. 
`clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک پورت عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون احراز هویت را در معرض قرار ندهید. 
[metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe کانتینر (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر بررسی‌ها همچنان ناموفق باشند، Docker کانتینر را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot عمیق سلامت با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار پورت Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به پورت منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط فرایندهای داخل فضای نام شبکه کانتینر می‌توانند مستقیما به
  Gateway دسترسی داشته باشند.

<Note>
از مقدارهای حالت bind در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان        | URL راه‌اندازی Docker                |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی Docker بسته‌بندی‌شده از آن URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding
برای LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml`، `host.docker.internal` را به
host gateway مربوط به Docker برای Linux Docker Engine نگاشت می‌کند. Docker Desktop از قبل
همان hostname را روی macOS و Windows فراهم می‌کند.

serviceهای میزبان نیز باید روی آدرسی گوش دهند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان
را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge در Docker معمولا multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل اعتماد forward نمی‌کند. بنابراین راه‌اندازی Compose بسته‌بندی‌شده
به‌صورت پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway وقتی bridge ترافیک multicast را drop می‌کند crash-loop نشود یا تبلیغ را مکررا restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا DNS-SD گسترده استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکات و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` به‌صورت bind-mount متصل می‌کند، بنابراین این مسیرها
پس از جایگزینی کانتینر باقی می‌مانند. وقتی هرکدام از این متغیرها تنظیم نشده باشد، فایل
`docker-compose.yml` بسته‌بندی‌شده به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای mount مربوط به workspace)، یا وقتی خود `HOME` نیز موجود نباشد به `/tmp/.openclaw`
fallback می‌کند. این کار از انتشار spec مربوط به volume با source خالی توسط `docker compose up`
در محیط‌های خام جلوگیری می‌کند.

آن دایرکتوری config mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ارائه‌دهنده ذخیره‌شده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

Pluginهای دانلودشدنی نصب‌شده وضعیت package خود را زیر home مربوط به OpenClaw که mount شده ذخیره می‌کنند،
بنابراین recordهای نصب Plugin و ریشه‌های package پس از جایگزینی کانتینر باقی می‌مانند.
شروع Gateway، درخت‌های وابستگی Pluginهای بسته‌بندی‌شده را تولید نمی‌کند.

برای جزئیات کامل پایداری در deploymentهای VM، 
[Docker VM Runtime - چه چیزی کجا باقی می‌ماند](/fa/install/docker-vm-runtime#what-persists-where)
را ببینید.

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست‌ها، `cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های فایل چرخشی زیر `/tmp/openclaw/` را زیر نظر داشته باشید.

### راهنماهای کمکی Shell (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل راهنمای کمکی محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همه فرمان‌ها `clawdock-help` را اجرا کنید.
برای راهنمای کامل راهنماهای کمکی، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی سندباکس عامل برای Docker gateway">
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

    اسکریپت فقط پس از گذراندن پیش‌نیازهای سندباکس، `docker.sock` را mount می‌کند. اگر راه‌اندازی سندباکس کامل نشود، اسکریپت `agents.defaults.sandbox.mode` را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="اتوماسیون / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="نکته امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI بتوانند از طریق `127.0.0.1` به gateway برسند. این را به‌عنوان یک مرز اعتماد مشترک در نظر بگیرید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و `no-new-privileges` را روی `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی `/home/node/.openclaw` خطاهای مجوز دیدید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره `pnpm install` جلوگیری می‌کند مگر اینکه lockfileها تغییر کنند:

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
    image پیش‌فرض امنیت‌محور است و به‌صورت کاربر غیر-root `node` اجرا می‌شود. برای کانتینری با امکانات کامل‌تر:

    1. **پایدارسازی `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قرار دادن وابستگی‌های سیستمی در image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **نصب مرورگرهای Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **پایدارسازی دانلودهای مرورگر**: `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` را تنظیم کنید و از `OPENCLAW_HOME_VOLUME` یا `OPENCLAW_EXTRA_MOUNTS` استفاده کنید.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر در جادوگر OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect را که به آن می‌رسید کپی کنید و برای تکمیل احراز هویت دوباره در جادوگر بچسبانید.
  </Accordion>

  <Accordion title="فراداده image پایه">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای image پایه OCI شامل `org.opencontainers.image.base.name`، `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه Node از طریق PRهای Dependabot برای Docker base-image تازه‌سازی می‌شود؛ buildهای انتشار لایه ارتقای توزیع را اجرا نمی‌کنند. [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md) را ببینید.
  </Accordion>
</AccordionGroup>

### اجرا روی VPS؟

برای مراحل استقرار VM مشترک شامل bake کردن باینری، پایداری و به‌روزرسانی‌ها، [Hetzner (Docker VPS)](/fa/install/hetzner) و [Docker VM Runtime](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، gateway اجرای ابزار عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای ایزوله Docker اجرا می‌کند، در حالی که خود gateway روی میزبان باقی می‌ماند. این کار بدون کانتینری کردن کل gateway، یک دیوار سخت پیرامون نشست‌های عامل نامطمئن یا چندمستاجره فراهم می‌کند.

دامنه سندباکس می‌تواند برای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید سیاست‌های allow/deny ابزار، ایزولاسیون شبکه، محدودیت‌های منابع، و کانتینرهای مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [سندباکس‌سازی](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای سندباکس
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای هر عامل

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

image پیش‌فرض سندباکس را بسازید (از checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build` به [سندباکس‌سازی § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image وجود ندارد یا کانتینر سندباکس شروع نمی‌شود">
    image سندباکس را با [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (checkout منبع) یا فرمان درون‌خطی `docker build` از [سندباکس‌سازی § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید، یا `agents.defaults.sandbox.docker.image` را به image سفارشی خودتان تنظیم کنید. کانتینرها به‌صورت خودکار و بر اساس تقاضا برای هر نشست ایجاد می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را به یک UID:GID تنظیم کنید که با مالکیت workspace mountشده شما مطابقت داشته باشد، یا مالکیت پوشه workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند که `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که مسیرهای ابزار سفارشی شما را در ابتدا اضافه کند، یا در Dockerfile خود یک اسکریپت زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="OOM-killed هنگام ساخت image (exit 137)">
    VM دست‌کم به 2 GB RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="غیرمجاز یا نیازمند pairing در Control UI">
    یک لینک تازه dashboard دریافت کنید و دستگاه مرورگر را تایید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x نشان می‌دهد یا خطاهای pairing از Docker CLI دریافت می‌شود">
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
- [ClawDock](/fa/install/clawdock) — راه‌اندازی اجتماعی Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی gateway پس از نصب

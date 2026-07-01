---
read_when:
    - به‌جای نصب‌های محلی، یک Gateway کانتینری‌شده می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و آماده‌سازی اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط اگر یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید، از آن استفاده کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و موقتی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمول استفاده کنید.
- **نکته Sandboxing**: بک‌اند پیش‌فرض sandbox وقتی sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌طور پیش‌فرض خاموش است و **نیازی** ندارد کل Gateway در Docker اجرا شود. بک‌اندهای sandbox مبتنی بر SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ GB RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ GB با کد خروج ۱۳۷ به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و لاگ‌ها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست فایروال Docker `DOCKER-USER` را در
  [سخت‌سازی امنیتی برای قرارگیری در معرض شبکه](/fa/gateway/security)
  بازبینی کنید.

## Gateway کانتینری

<Steps>
  <Step title="ساخت image">
    از ریشه مخزن، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image ازپیش‌ساخته به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای ازپیش‌ساخته ابتدا در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    GHCR رجیستری اصلی برای خودکارسازی انتشار، استقرارهای پین‌شده،
    و بررسی‌های منشأ است. همان جریان انتشار همچنین یک mirror رسمی
    Docker Hub در `openclaw/openclaw` برای میزبان‌هایی منتشر می‌کند که Docker Hub را ترجیح می‌دهند:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    از `ghcr.io/openclaw/openclaw` یا `openclaw/openclaw` استفاده کنید. از mirrorهای اجتماعی
    Docker Hub پرهیز کنید، زیرا OpenClaw زمان‌بندی انتشار، بازسازی‌ها،
    یا سیاست نگهداری آن‌ها را کنترل نمی‌کند. tagهای رسمی رایج: `main`، `latest`،
    `<version>` (مثلاً `2026.2.26`)، و نسخه‌های beta مانند
    `2026.2.26-beta.1`. tagهای beta، `latest` یا `main` را جابه‌جا نمی‌کنند.

  </Step>

  <Step title="اجرای دوباره در محیط airgapped">
    روی میزبان‌های آفلاین، ابتدا image را منتقل و بارگذاری کنید:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` بررسی می‌کند که `OPENCLAW_IMAGE` از قبل به‌صورت محلی وجود داشته باشد،
    pullها و buildهای ضمنی Compose را غیرفعال می‌کند، سپس جریان راه‌اندازی معمول مانند
    همگام‌سازی `.env`، اصلاح مجوزها، onboarding، همگام‌سازی پیکربندی Gateway،
    و راه‌اندازی Compose را اجرا می‌کند.

    اگر `OPENCLAW_SANDBOX=1` باشد، راه‌اندازی آفلاین همچنین imageهای sandbox پیش‌فرض پیکربندی‌شده
    و فعال برای هر agent را روی daemon پشت
    `OPENCLAW_DOCKER_SOCKET` بررسی می‌کند. imageهای مرورگر مبتنی بر Docker نیز باید
    label قرارداد مرورگر فعلی OpenClaw را داشته باشند. وقتی یک image ضروری موجود نباشد یا
    ناسازگار باشد، setup به‌جای گزارش موفقیت با sandbox غیرقابل‌استفاده،
    بدون تغییر پیکربندی sandbox خارج می‌شود.

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت setup، onboarding را به‌طور خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API ارائه‌دهنده درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - دایرکتوری کلید محرمانه auth-profile را ایجاد می‌کند
    - Gateway را از طریق Docker Compose راه‌اندازی می‌کند

    هنگام setup، onboarding پیش از شروع و نوشتن‌های پیکربندی از طریق
    `openclaw-gateway` به‌طور مستقیم اجرا می‌شوند. `openclaw-cli` برای دستورهایی است که پس از
    وجود داشتن کانتینر Gateway اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و shared secret پیکربندی‌شده
    را در Settings وارد کنید. اسکریپت setup به‌طور پیش‌فرض یک token در `.env` می‌نویسد؛
    اگر پیکربندی کانتینر را به احراز هویت با password تغییر دهید، همان
    password را استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی کانال‌ها (اختیاری)">
    از کانتینر CLI برای افزودن کانال‌های پیام‌رسان استفاده کنید:

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

اگر ترجیح می‌دهید هر مرحله را خودتان به‌جای استفاده از اسکریپت setup اجرا کنید:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
`docker compose` را از ریشه مخزن اجرا کنید. اگر `OPENCLAW_EXTRA_MOUNTS`
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت setup فایل `docker-compose.extra.yml` را می‌نویسد؛
آن را بعد از هر فایل override استاندارد اضافه کنید، برای مثال
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
وقتی هر دو فایل override وجود دارند.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک
ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن‌های پیکربندی زمان setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                           | هدف                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | استفاده از image راه‌دور به‌جای ساخت محلی                            |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | نصب بسته‌های apt اضافی هنگام build (جداشده با فاصله)                 |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | نصب بسته‌های Python اضافی هنگام build (جداشده با فاصله)              |
| `OPENCLAW_EXTENSIONS`                           | پیش‌نصب وابستگی‌های Plugin هنگام build (نام‌های جداشده با فاصله)      |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | بازنویسی گزینه‌های Node برای source-build محلی                        |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | بازنویسی heap مربوط به tsdown در source-build محلی، بر حسب MB         |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | رد کردن خروجی declaration هنگام buildهای image محلی فقط runtime       |
| `OPENCLAW_EXTRA_MOUNTS`                         | bind mountهای اضافی میزبان (با کاما جداشده: `source:target[:opts]`)   |
| `OPENCLAW_HOME_VOLUME`                          | ماندگار کردن `/home/node` در یک volume نام‌گذاری‌شده Docker           |
| `OPENCLAW_SANDBOX`                              | انتخاب bootstrap برای sandbox (`1`, `true`, `yes`, `on`)              |
| `OPENCLAW_SKIP_ONBOARDING`                      | رد کردن مرحله onboarding تعاملی (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_DOCKER_SOCKET`                        | بازنویسی مسیر socket Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | غیرفعال کردن تبلیغ Bonjour/mDNS (در Docker به‌طور پیش‌فرض `1`)        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | غیرفعال کردن overlayهای bind-mount منبع Pluginهای bundled             |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | endpoint مشترک collector مبتنی بر OTLP/HTTP برای export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | endpointهای OTLP ویژه signal برای traces، metrics، یا logs            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | بازنویسی protocol مربوط به OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                             | نام service استفاده‌شده برای resourceهای OpenTelemetry                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | انتخاب attributeهای معنایی آزمایشی GenAI جدیدتر                      |
| `OPENCLAW_OTEL_PRELOADED`                       | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از پیش بارگذاری شده است  |

image رسمی Docker، Homebrew را همراه خود ندارد. هنگام onboarding، OpenClaw
نصب‌کننده‌های وابستگی skill فقط مخصوص brew را وقتی در یک کانتینر Linux
بدون `brew` اجرا می‌شود پنهان می‌کند؛ این وابستگی‌ها باید از طریق یک image سفارشی
فراهم شوند یا به‌صورت دستی نصب شوند. برای وابستگی‌هایی که از بسته‌های Debian در دسترس‌اند، هنگام build image از
`OPENCLAW_IMAGE_APT_PACKAGES` استفاده کنید. نام قدیمی
`OPENCLAW_DOCKER_APT_PACKAGES` هنوز پذیرفته می‌شود.
برای وابستگی‌های Python، از `OPENCLAW_IMAGE_PIP_PACKAGES` استفاده کنید. این کار هنگام build image
`python3 -m pip install --break-system-packages` را اجرا می‌کند، بنابراین
نسخه‌های package را pin کنید و فقط از indexهای package که به آن‌ها اعتماد دارید استفاده کنید.
source buildها مقدار پیش‌فرض `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` را
`--max-old-space-size=8192` قرار می‌دهند و
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` را unset می‌گذارند تا wrapper مربوط به tsdown بتواند
محدودیت‌های حافظه کانتینر را رعایت کند. همچنین به‌طور پیش‌فرض
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` را تنظیم می‌کنند، زیرا imageهای runtime پس از build،
فایل‌های declaration را prune می‌کنند. اگر Docker خطاهای `ResourceExhausted`، `cannot allocate
memory` گزارش کرد یا هنگام `tsdown` متوقف شد، محدودیت حافظه builder در Docker را افزایش دهید یا
با heapهای صریح کوچک‌تر دوباره تلاش کنید، برای مثال
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

نگه‌دارندگان می‌توانند منبع Plugin bundled را در برابر یک image بسته‌بندی‌شده با mount کردن
یک دایرکتوری منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری منبع mount‌شده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin بازنویسی می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از کانتینر Gateway به collector مبتنی بر OTLP شما
خروجی است. این کار به پورت Docker منتشرشده نیاز ندارد. اگر image را
به‌صورت محلی می‌سازید و می‌خواهید exporter bundled مربوط به OpenTelemetry داخل image در دسترس باشد،
وابستگی‌های runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Plugin رسمی `@openclaw/diagnostics-otel` را از ClawHub در
نصب‌های Docker بسته‌بندی‌شده پیش از فعال کردن export نصب کنید. imageهای سفارشی source-built همچنان می‌توانند
منبع Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از مثال config در [export OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید.
headerهای احراز هویت collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metrics مربوط به Prometheus از پورت Gateway که از قبل منتشر شده استفاده می‌کند. نصب کنید
`clawhub:@openclaw/diagnostics-prometheus`، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک پورت عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون احراز هویت در معرض قرار ندهید. [metrics مربوط به Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe کانتینر (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تصویر Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر بررسی‌ها همچنان شکست بخورند، Docker کانتینر را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سامانه‌های ارکستراسیون می‌توانند آن را راه‌اندازی دوباره یا جایگزین کنند.

نمای عمیق سلامت احراز هویت‌شده:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌طور پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار پورت Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به پورت منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط فرایندهای داخل فضای نام شبکه کانتینر می‌توانند مستقیماً به
  Gateway دسترسی داشته باشند.

<Note>
از مقادیر حالت bind در `gateway.bind` استفاده کنید (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، نه aliasهای میزبان مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه ماشین میزبان شما. برای ارائه‌دهندگان هوش مصنوعی که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL راه‌اندازی Docker              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی Docker همراه، از آن URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding
برای LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml`، `host.docker.internal` را برای
Docker Engine روی Linux به Gateway میزبان Docker نگاشت می‌کند. Docker Desktop از قبل
همین hostname را روی macOS و Windows فراهم می‌کند.

سرویس‌های میزبان نیز باید روی نشانی‌ای گوش دهند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان را
خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### پشتوانه Claude CLI در Docker

تصویر رسمی Docker برای OpenClaw، Claude Code را از پیش نصب نمی‌کند. Claude Code را
داخل کاربر کانتینری که OpenClaw را اجرا می‌کند نصب کنید و وارد شوید، سپس home همان
کانتینر را پایدار کنید تا ارتقاهای تصویر، binary یا وضعیت احراز هویت Claude را پاک نکنند.

برای نصب‌های جدید Docker، پیش از اجرای setup یک volume پایدار برای `/home/node` فعال کنید:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

برای نصب Docker موجود، ابتدا stack را متوقف کنید و پیش از اجرای دوباره setup، مقادیر فعلی
Docker `.env` را دوباره بارگذاری کنید. اسکریپت setup خودش `.env` را نمی‌خواند؛
بلکه `.env` را از shell فعلی و پیش‌فرض‌ها بازنویسی می‌کند. برای `.env` تولیدشده، اجرا کنید:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

اگر `.env` شما مقادیری دارد که shell نمی‌تواند source کند، ابتدا مقادیر موجودی را که
به آن‌ها تکیه دارید به‌صورت دستی دوباره export کنید، مانند `OPENCLAW_IMAGE`، پورت‌ها، حالت bind،
مسیرهای سفارشی، `OPENCLAW_EXTRA_MOUNTS`، sandbox، و تنظیمات skip-onboarding.
overlay تولیدشده، volume مربوط به home را برای هر دو سرویس `openclaw-gateway` و
`openclaw-cli` mount می‌کند.

فرمان‌های باقی‌مانده را با overlay تولیدشده Compose اجرا کنید تا هر دو سرویس
home پایدار را mount کنند. اگر راه‌اندازی شما از `docker-compose.override.yml` هم استفاده می‌کند،
آن را پیش از `docker-compose.extra.yml` وارد کنید.

Claude Code را در همان home پایدار نصب کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

نصب‌کننده native، binary مربوط به `claude` را زیر
`/home/node/.local/bin/claude` می‌نویسد. به OpenClaw بگویید از همان مسیر کانتینر استفاده کند:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

از داخل همان home پایدار کانتینر وارد شوید و بررسی کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

پس از آن، می‌توانید از پشتوانه همراه `claude-cli` استفاده کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` نصب native مربوط به Claude Code را زیر
`/home/node/.local/bin` و `/home/node/.local/share/claude`، به‌علاوه تنظیمات Claude Code
و وضعیت احراز هویت را زیر `/home/node/.claude` و `/home/node/.claude.json` پایدار نگه می‌دارد.
پایدار کردن فقط `/home/node/.openclaw` برای استفاده دوباره از Claude CLI کافی نیست. اگر
به‌جای volume مربوط به home از `OPENCLAW_EXTRA_MOUNTS` استفاده می‌کنید، همه این
مسیرهای Claude را در هر دو سرویس Docker mount کنید.

<Note>
برای automation تولیدی مشترک یا صورتحساب قابل پیش‌بینی Anthropic، مسیر
کلید API مربوط به Anthropic را ترجیح دهید. استفاده دوباره از Claude CLI از نسخه نصب‌شده
Claude Code، ورود حساب، صورتحساب، و رفتار به‌روزرسانی آن پیروی می‌کند.
</Note>

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل اعتماد forward نمی‌کند. بنابراین راه‌اندازی Compose همراه
به‌طور پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway دچار crash-loop نشود یا هنگام
drop شدن ترافیک multicast توسط bridge، تبلیغ خود را مکرراً راه‌اندازی دوباره نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط وقتی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکات مشکل‌ساز و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw`،
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` را به `/home/node/.config/openclaw` bind-mount می‌کند، بنابراین این
مسیرها پس از جایگزینی کانتینر باقی می‌مانند. وقتی هر متغیری تنظیم نشده باشد، فایل همراه
`docker-compose.yml` به زیر `${HOME}`، یا وقتی خود `HOME` هم موجود نباشد به `/tmp`
fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های bare، مشخصات volume با
source خالی منتشر کند.

آن دایرکتوری config که mount شده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

دایرکتوری کلید secret مربوط به auth-profile، کلید رمزنگاری محلی استفاده‌شده برای
مواد token پروفایل احراز هویت مبتنی بر OAuth را ذخیره می‌کند. آن را همراه با وضعیت میزبان Docker خود نگه دارید،
اما جدا از `OPENCLAW_CONFIG_DIR`.

Pluginهای قابل دانلود نصب‌شده، وضعیت package خود را زیر home نصب‌شده OpenClaw ذخیره می‌کنند،
بنابراین سوابق نصب Plugin و ریشه‌های package پس از جایگزینی کانتینر باقی می‌مانند.
راه‌اندازی Gateway درخت‌های dependency مربوط به bundled-plugin را تولید نمی‌کند.

برای جزئیات کامل پایداری در استقرارهای VM، ببینید
[Docker VM Runtime - چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست، پایگاه‌داده SQLite وضعیت مشترک،
ریشه‌های package مربوط به Plugin نصب‌شده، و logهای فایل چرخشی
زیر `/tmp/openclaw/` را زیر نظر بگیرید.

### helperهای shell (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر raw قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل helper محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همه فرمان‌ها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل helper، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال کردن sandbox عامل برای Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر socket سفارشی (مثلاً Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    اسکریپت فقط پس از گذراندن پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی sandbox نتواند کامل شود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند. نوبت‌های code-mode مربوط به Codex همچنان در حالی که sandbox
    OpenClaw فعال است به Codex
    `workspace-write` محدود می‌مانند؛ socket مربوط به Docker میزبان را داخل کانتینرهای sandbox عامل mount نکنید.

  </Accordion>

  <Accordion title="Automation / CI (غیرتعاملی)">
    تخصیص pseudo-TTY مربوط به Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="یادداشت امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI
    بتوانند از طریق `127.0.0.1` به Gateway دسترسی داشته باشند. این را به‌عنوان یک مرز اعتماد مشترک
    در نظر بگیرید. config مربوط به compose، قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="خرابی‌های DNS در Docker Desktop داخل openclaw-cli">
    بعضی راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW`، در lookupهای DNS از sidecar
    شبکه مشترک `openclaw-cli` شکست می‌خورند، که هنگام فرمان‌های مبتنی بر npm مانند
    `openclaw plugins install` به‌صورت `EAI_AGAIN` ظاهر می‌شود.
    فایل compose سخت‌سازی‌شده پیش‌فرض را برای عملیات عادی Gateway نگه دارید. override
    محلی زیر وضعیت امنیتی کانتینر CLI را با بازگرداندن قابلیت‌های پیش‌فرض Docker
    آزادتر می‌کند، بنابراین فقط برای فرمان CLI یک‌باره‌ای که به دسترسی registry بسته نیاز دارد از آن استفاده کنید،
    نه به‌عنوان invocation پیش‌فرض Compose خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر از قبل یک کانتینر طولانی‌اجرای `openclaw-cli` ساخته‌اید، آن را
    با همان override دوباره ایجاد کنید. `docker compose exec` و `docker exec` نمی‌توانند
    قابلیت‌های Linux را روی کانتینری که از قبل ساخته شده تغییر دهند.

  </Accordion>

  <Accordion title="مجوزها و EACCES">
    تصویر به‌عنوان `node` (uid 1000) اجرا می‌شود. اگر خطاهای permission روی
    `/home/node/.openclaw` دیدید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین عدم تطابق می‌تواند به‌صورت هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. یعنی uid فرایند و مالک
    دایرکتوری Plugin که mount شده با هم ناسازگارند. ترجیح دهید کانتینر را با uid پیش‌فرض 1000 اجرا کنید
    و مالکیت bind mount را اصلاح کنید. فقط زمانی
    `/path/to/openclaw-config/npm` را به `root:root` تغییر مالکیت دهید که عمداً
    OpenClaw را در بلندمدت به‌عنوان root اجرا می‌کنید.

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های dependency cache شوند. این کار از اجرای دوباره
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
    تصویر پیش‌فرض با اولویت امنیت ساخته شده و به‌صورت کاربر غیرریشه `node` اجرا می‌شود. برای یک
    کانتینر کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **گنجاندن وابستگی‌های سیستم**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **گنجاندن وابستگی‌های Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **گنجاندن Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **یا نصب مرورگرهای Playwright در یک volume ماندگار**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ماندگار کردن دانلودهای مرورگر**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw، Chromium مدیریت‌شده توسط Playwright
       در تصویر Docker را روی Linux به‌صورت خودکار تشخیص می‌دهد.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر در راه‌انداز OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل تغییرمسیر صفحه‌ای را که به آن می‌رسید کپی کنید و
    آن را دوباره در راه‌انداز جای‌گذاری کنید تا احراز هویت کامل شود.
  </Accordion>

  <Accordion title="فراداده تصویر پایه">
    تصویر اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به‌عنوان فرایند init نقطه ورود (PID 1) شامل می‌شود تا مطمئن شود فرایندهای zombie جمع‌آوری می‌شوند و سیگنال‌ها در کانتینرهای طولانی‌اجرا به‌درستی مدیریت می‌شوند. این تصویر annotationهای تصویر پایه OCI را منتشر می‌کند، از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source`، و موارد دیگر. digest پایه Node
    از طریق PRهای تصویر پایه Docker در Dependabot به‌روزرسانی می‌شود؛ ساخت‌های انتشار
    لایه ارتقای توزیع را اجرا نمی‌کنند. ببینید
    [annotationهای تصویر OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### اجرا روی VPS؟

برای مراحل استقرار VM اشتراکی، از جمله گنجاندن binary، ماندگاری، و به‌روزرسانی‌ها،
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای Docker VM](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل، و غیره) را داخل کانتینرهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این کار یک دیوار سخت
پیرامون نشست‌های عامل غیرقابل اعتماد یا چندمستاجری ایجاد می‌کند، بدون اینکه لازم باشد کل
Gateway را کانتینری کنید.

دامنه سندباکس می‌تواند برای هر عامل (پیش‌فرض)، برای هر نشست، یا مشترک باشد. هر دامنه
workspace مخصوص خود را دریافت می‌کند که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های مجاز/غیرمجاز ابزار، جداسازی شبکه، محدودیت‌های منابع، و کانتینرهای مرورگر را
پیکربندی کنید.

برای پیکربندی کامل، تصاویر، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [سندباکس‌سازی](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای سندباکس
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- بازنویسی‌های هر عامل

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

تصویر پیش‌فرض سندباکس را بسازید (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای دستورهای درون‌خطی `docker build`، [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="تصویر وجود ندارد یا کانتینر سندباکس شروع نمی‌شود">
    تصویر سندباکس را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا دستور درون‌خطی `docker build` از [سندباکس‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی تصویر سفارشی خود تنظیم کنید.
    کانتینرها هنگام نیاز، به‌صورت خودکار برای هر نشست ایجاد می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace مانت‌شده شما مطابقت داشته باشد،
    یا مالکیت پوشه workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw دستورها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را تنظیم کنید تا
    مسیرهای ابزار سفارشی شما را در ابتدا قرار دهد، یا در Dockerfile خود یک اسکریپت زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در زمان ساخت تصویر به‌دلیل OOM کشته شد (خروج 137)">
    VM به دست‌کم 2 GB RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="غیرمجاز یا نیازمند pairing در Control UI">
    یک لینک تازه dashboard بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [دستگاه‌ها](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x یا خطاهای pairing از Docker CLI نشان می‌دهد">
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

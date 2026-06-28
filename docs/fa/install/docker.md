---
read_when:
    - شما یک gateway کانتینری‌شده را به‌جای نصب‌های محلی می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و آغازبه‌کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:45:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط اگر Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید از آن استفاده کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و موقتی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی ماشین خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **نکته Sandboxing**: وقتی sandboxing فعال باشد، backend پیش‌فرض sandbox از Docker استفاده می‌کند، اما sandboxing به‌صورت پیش‌فرض خاموش است و برای اجرای کامل Gateway در Docker **نیازی** نیست. backendهای sandbox از نوع SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروج 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید،
  [سخت‌سازی امنیتی برای در معرض شبکه قرار گرفتن](/fa/gateway/security) را مرور کنید،
  به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER`.

## Gateway کانتینری

<Steps>
  <Step title="ساخت image">
    از ریشه repo، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image از پیش ساخته‌شده به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای از پیش ساخته‌شده ابتدا در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    GHCR رجیستری اصلی برای خودکارسازی انتشار، استقرارهای pin‌شده،
    و بررسی‌های provenance است. همان workflow انتشار، یک mirror رسمی
    Docker Hub را نیز در `openclaw/openclaw` برای میزبان‌هایی که Docker Hub را ترجیح می‌دهند منتشر می‌کند:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    از `ghcr.io/openclaw/openclaw` یا `openclaw/openclaw` استفاده کنید. از mirrorهای
    اجتماعی Docker Hub اجتناب کنید، چون OpenClaw زمان‌بندی انتشار،
    rebuildها، یا سیاست نگهداری آن‌ها را کنترل نمی‌کند. tagهای رسمی رایج: `main`، `latest`،
    `<version>` (مثلاً `2026.2.26`) و نسخه‌های beta مانند
    `2026.2.26-beta.1`. tagهای beta، `latest` یا `main` را جابه‌جا نمی‌کنند.

  </Step>

  <Step title="اجرای دوباره در محیط airgapped">
    روی میزبان‌های آفلاین، ابتدا image را منتقل و load کنید:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` بررسی می‌کند که `OPENCLAW_IMAGE` از قبل به‌صورت محلی وجود داشته باشد، pullها و buildهای ضمنی Compose را غیرفعال می‌کند، سپس جریان راه‌اندازی معمولی مانند همگام‌سازی `.env`، اصلاح permissionها، onboarding، همگام‌سازی پیکربندی Gateway،
    و startup مربوط به Compose را اجرا می‌کند.

    اگر `OPENCLAW_SANDBOX=1` باشد، راه‌اندازی آفلاین همچنین imageهای sandbox پیش‌فرض پیکربندی‌شده
    و فعالِ هر agent را روی daemon پشت
    `OPENCLAW_DOCKER_SOCKET` بررسی می‌کند. imageهای مرورگرِ مبتنی بر Docker نیز باید label فعلی قرارداد مرورگر OpenClaw را داشته باشند. وقتی image لازم وجود ندارد یا ناسازگار است، setup بدون تغییر پیکربندی sandbox خارج می‌شود، نه اینکه با یک sandbox غیرقابل استفاده گزارش موفقیت بدهد.

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت setup، onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API ارائه‌دهنده prompt می‌دهد
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - دایرکتوری کلید محرمانه auth-profile را ایجاد می‌کند
    - Gateway را از طریق Docker Compose شروع می‌کند

    هنگام setup، onboarding پیش از startup و نوشتن پیکربندی مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شوند. `openclaw-cli` برای دستورهایی است که پس از وجود داشتن کانتینر Gateway اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و secret مشترک پیکربندی‌شده را در Settings وارد کنید. اسکریپت setup به‌صورت پیش‌فرض یک token در `.env` می‌نویسد؛ اگر پیکربندی کانتینر را به احراز هویت با password تغییر دادید، به‌جای آن از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی channelها (اختیاری)">
    از کانتینر CLI برای افزودن channelهای پیام‌رسانی استفاده کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت setup فایل `docker-compose.extra.yml` را می‌نویسد؛
آن را بعد از هر فایل override استاندارد اضافه کنید، برای مثال
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
وقتی هر دو فایل override وجود دارند.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک
ابزار پس از startup است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن پیکربندی زمان setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image ریموت به‌جای ساخت محلی                              |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | نصب packageهای apt اضافی هنگام build (با فاصله جدا شده)              |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | نصب packageهای Python اضافی هنگام build (با فاصله جدا شده)           |
| `OPENCLAW_EXTENSIONS`                      | نصب پیشاپیش dependencyهای Plugin هنگام build (نام‌ها با فاصله جدا شده) |
| `OPENCLAW_EXTRA_MOUNTS`                    | mountهای bind اضافی میزبان (با ویرگول جدا شده `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker                   |
| `OPENCLAW_SANDBOX`                         | opt in به bootstrap مربوط به sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`, `true`, `yes`, `on`)            |
| `OPENCLAW_DOCKER_SOCKET`                   | override مسیر socket Docker                                          |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌صورت پیش‌فرض `1`)     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount سورس Pluginهای bundled            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک OTLP/HTTP collector برای export مربوط به OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP اختصاصی signal برای traceها، metricها، یا logها      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود       |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | opt in به جدیدترین attributeهای معنایی آزمایشی GenAI                 |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است    |

image رسمی Docker شامل Homebrew نیست. هنگام onboarding، OpenClaw
نصب‌کننده‌های dependency مربوط به skillهای فقط brew را وقتی در یک کانتینر Linux
بدون `brew` اجرا می‌شود پنهان می‌کند؛ آن dependencyها باید توسط یک image سفارشی فراهم شوند
یا دستی نصب شوند. برای dependencyهایی که از packageهای Debian در دسترس هستند، هنگام build image از
`OPENCLAW_IMAGE_APT_PACKAGES` استفاده کنید. نام legacy
`OPENCLAW_DOCKER_APT_PACKAGES` همچنان پذیرفته می‌شود.
برای dependencyهای Python، از `OPENCLAW_IMAGE_PIP_PACKAGES` استفاده کنید. این کار هنگام build image،
`python3 -m pip install --break-system-packages` را اجرا می‌کند، پس نسخه‌های package را pin کنید
و فقط از package indexهایی استفاده کنید که به آن‌ها اعتماد دارید.

maintainerها می‌توانند سورس Pluginهای bundled را در برابر یک image بسته‌بندی‌شده آزمایش کنند، با mount کردن
یک دایرکتوری سورس Plugin روی مسیر سورس بسته‌بندی‌شده همان، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری سورس mount‌شده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان Plugin id override می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از کانتینر Gateway به collector نوع OTLP شما به‌صورت outbound انجام می‌شود.
به پورت Docker منتشرشده نیاز ندارد. اگر image را به‌صورت محلی build می‌کنید
و می‌خواهید exporter همراه OpenTelemetry داخل image در دسترس باشد،
dependencyهای runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Plugin رسمی `@openclaw/diagnostics-otel` را از ClawHub در
نصب‌های Docker بسته‌بندی‌شده پیش از فعال کردن export نصب کنید. imageهای سفارشیِ ساخته‌شده از سورس همچنان می‌توانند
سورس Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از مثال config در [OpenTelemetry
export](/fa/gateway/opentelemetry) استفاده کنید. headerهای auth مربوط به collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از پورت Gateway که از قبل منتشر شده استفاده می‌کنند. 
`clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک پورت عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون احراز هویت در معرض قرار ندهید. [Prometheus metrics](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe کانتینر (بدون نیاز به auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر بررسی‌ها همچنان fail شوند، Docker کانتینر را به‌عنوان `unhealthy` علامت می‌زند و
سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot عمیق سلامت با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار پورت Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به پورت منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط processهای داخل فضای نام شبکه کانتینر می‌توانند
  مستقیماً به Gateway دسترسی داشته باشند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه ماشین میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان         | URL راه‌اندازی Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی همراه Docker از آن URLهای میزبان به‌عنوان پیش‌فرض‌های ورود اولیه LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml` روی Docker Engine لینوکس، `host.docker.internal` را به Gateway میزبان Docker نگاشت می‌کند. Docker Desktop همین نام میزبان را از قبل روی macOS و Windows فراهم می‌کند.

سرویس‌های میزبان همچنین باید روی نشانی‌ای گوش بدهند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همین نگاشت میزبان را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### پشتانه Claude CLI در Docker

تصویر رسمی Docker مربوط به OpenClaw، Claude Code را از پیش نصب نمی‌کند. Claude Code را داخل کاربر کانتینری که OpenClaw را اجرا می‌کند نصب کنید و وارد شوید، سپس خانه آن کانتینر را ماندگار کنید تا ارتقاهای تصویر، باینری یا وضعیت احراز هویت Claude را پاک نکنند.

برای نصب‌های جدید Docker، پیش از اجرای راه‌اندازی، یک حجم ماندگار `/home/node` را فعال کنید:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

برای یک نصب موجود Docker، ابتدا stack را متوقف کنید و پیش از اجرای دوباره راه‌اندازی، مقدارهای فعلی Docker در `.env` را دوباره بارگذاری کنید. اسکریپت راه‌اندازی خودش `.env` را نمی‌خواند؛ بلکه `.env` را از پوسته فعلی و پیش‌فرض‌ها بازنویسی می‌کند. برای `.env` تولیدشده، اجرا کنید:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

اگر `.env` شما مقدارهایی دارد که پوسته‌تان نمی‌تواند source کند، ابتدا مقدارهای موجودی را که به آن‌ها تکیه دارید، مانند `OPENCLAW_IMAGE`، درگاه‌ها، حالت bind، مسیرهای سفارشی، `OPENCLAW_EXTRA_MOUNTS`، sandbox، و تنظیمات رد کردن ورود اولیه، به‌صورت دستی دوباره export کنید. overlay تولیدشده، حجم خانه را برای هر دو سرویس `openclaw-gateway` و `openclaw-cli` mount می‌کند.

فرمان‌های باقی‌مانده را با overlay تولیدشده Compose اجرا کنید تا هر دو سرویس خانه ماندگارشده را mount کنند. اگر راه‌اندازی شما از `docker-compose.override.yml` هم استفاده می‌کند، آن را پیش از `docker-compose.extra.yml` وارد کنید.

Claude Code را در همان خانه ماندگارشده نصب کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

نصاب native، باینری `claude` را زیر
`/home/node/.local/bin/claude` می‌نویسد. به OpenClaw بگویید از همان مسیر کانتینر استفاده کند:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

از داخل همان خانه کانتینری ماندگارشده وارد شوید و بررسی کنید:

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

پس از آن، می‌توانید از پشتانه همراه `claude-cli` استفاده کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` نصب native Claude Code را زیر `/home/node/.local/bin` و `/home/node/.local/share/claude`، به‌همراه تنظیمات و وضعیت احراز هویت Claude Code زیر `/home/node/.claude` و `/home/node/.claude.json` ماندگار می‌کند. ماندگار کردن فقط `/home/node/.openclaw` برای استفاده دوباره از Claude CLI کافی نیست. اگر به‌جای حجم خانه از `OPENCLAW_EXTRA_MOUNTS` استفاده می‌کنید، همه آن مسیرهای Claude را در هر دو سرویس Docker mount کنید.

<Note>
برای خودکارسازی تولیدی مشترک یا صورتحساب‌گیری قابل پیش‌بینی Anthropic، مسیر کلید API مربوط به Anthropic را ترجیح دهید. استفاده دوباره از Claude CLI از نسخه نصب‌شده Claude Code، ورود حساب، صورتحساب‌گیری، و رفتار به‌روزرسانی آن پیروی می‌کند.
</Note>

### Bonjour / mDNS

شبکه‌سازی bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS (`224.0.0.251:5353`) را به‌شکل قابل اتکا عبور نمی‌دهد. بنابراین راه‌اندازی همراه Compose به‌صورت پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا وقتی bridge ترافیک multicast را حذف می‌کند، Gateway وارد چرخه crash-loop نشود یا تبلیغ را بارها از نو شروع نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید. `OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با شبکه‌سازی host، macvlan، یا شبکه دیگری اجرا می‌کنید که می‌دانید multicast مربوط به mDNS در آن کار می‌کند.

برای نکات دردسرساز و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و ماندگاری

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw`، مقدار `OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace`، و مقدار `OPENCLAW_AUTH_PROFILE_SECRET_DIR` را به `/home/node/.config/openclaw` به‌صورت bind-mount متصل می‌کند، بنابراین آن مسیرها پس از جایگزینی کانتینر باقی می‌مانند. وقتی هر متغیری تنظیم نشده باشد، `docker-compose.yml` همراه، زیر `${HOME}` fallback می‌کند، یا وقتی خود `HOME` هم وجود نداشته باشد، به `/tmp` fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های خام، مشخصات حجم با source خالی منتشر کند.

آن دایرکتوری پیکربندی mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای پیکربندی رفتار
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت ذخیره‌شده OAuth/کلید API ارائه‌دهنده
- `.env` برای secretهای زمان اجرای مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

دایرکتوری کلید secret پروفایل احراز هویت، کلید رمزنگاری محلی مورد استفاده برای material توکن پروفایل احراز هویت مبتنی بر OAuth را ذخیره می‌کند. آن را همراه وضعیت میزبان Docker خود نگه دارید، اما از `OPENCLAW_CONFIG_DIR` جدا کنید.

Pluginهای دانلودشدنی نصب‌شده، وضعیت package خود را زیر خانه mountشده OpenClaw ذخیره می‌کنند، بنابراین رکوردهای نصب Plugin و ریشه‌های package پس از جایگزینی کانتینر باقی می‌مانند. راه‌اندازی Gateway درخت‌های وابستگی Pluginهای همراه را تولید نمی‌کند.

برای جزئیات کامل ماندگاری در استقرارهای VM، [زمان اجرای VM Docker - چه چیزی کجا ماندگار می‌شود](/fa/install/docker-vm-runtime#what-persists-where) را ببینید.

**نقاط داغ رشد دیسک:** مراقب `media/`، فایل‌های JSONL نشست، پایگاه داده وضعیت SQLite مشترک، ریشه‌های package مربوط به Pluginهای نصب‌شده، و لاگ‌های فایل چرخشی زیر `/tmp/openclaw/` باشید.

### کمک‌کننده‌های پوسته (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر raw قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل helper محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard`، و موارد مشابه استفاده کنید. برای همه فرمان‌ها `clawdock-help` را اجرا کنید.
برای راهنمای کامل helper، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    اسکریپت فقط پس از عبور پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر راه‌اندازی sandbox نتواند کامل شود، اسکریپت `agents.defaults.sandbox.mode` را به `off` بازنشانی می‌کند. turnهای حالت کد Codex در حالی که sandbox مربوط به OpenClaw فعال است، همچنان به `workspace-write` در Codex محدود هستند؛ socket میزبان Docker را داخل کانتینرهای sandbox عامل mount نکنید.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    تخصیص شبه-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI بتوانند از طریق `127.0.0.1` به Gateway برسند. این را یک مرز اعتماد مشترک در نظر بگیرید. پیکربندی compose مقدارهای `NET_RAW`/`NET_ADMIN` را حذف می‌کند و `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    بعضی از راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW`، در lookupهای DNS از sidecar شبکه مشترک `openclaw-cli` شکست می‌خورند، که در فرمان‌های مبتنی بر npm مانند `openclaw plugins install` به‌شکل `EAI_AGAIN` دیده می‌شود. برای عملیات عادی Gateway، فایل compose سخت‌گیرانه پیش‌فرض را نگه دارید. override محلی زیر با بازگرداندن capabilityهای پیش‌فرض Docker، وضعیت امنیتی کانتینر CLI را آزادتر می‌کند، بنابراین از آن فقط برای همان فرمان یک‌باره CLI که به دسترسی به registry بسته نیاز دارد استفاده کنید، نه به‌عنوان فراخوانی Compose پیش‌فرض خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر از قبل یک کانتینر بلندمدت `openclaw-cli` ساخته‌اید، آن را با همان override دوباره بسازید. `docker compose exec` و `docker exec` نمی‌توانند capabilityهای لینوکس را روی کانتینری که از قبل ساخته شده تغییر دهند.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    تصویر به‌عنوان `node` (uid 1000) اجرا می‌شود. اگر روی `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما مالکیت uid 1000 دارند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین ناهماهنگی می‌تواند به‌شکل هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. یعنی uid فرایند و مالک دایرکتوری Plugin mountشده با هم ناسازگارند. اجرای کانتینر با uid پیش‌فرض 1000 و اصلاح مالکیت bind mount را ترجیح دهید. فقط در صورتی `/path/to/openclaw-config/npm` را به `root:root` chown کنید که عمداً OpenClaw را در بلندمدت به‌عنوان root اجرا می‌کنید.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره `pnpm install` جلوگیری می‌کند، مگر اینکه lockfileها تغییر کنند:

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
    تصویر پیش‌فرض، امنیت‌محور است و به‌عنوان `node` غیر root اجرا می‌شود. برای یک کانتینر کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قرار دادن وابستگی‌های سیستم در image**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **قرار دادن وابستگی‌های Python در image**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **قرار دادن Playwright Chromium در image**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **یا نصب مرورگرهای Playwright در یک volume ماندگار**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **ماندگار کردن دانلودهای مرورگر**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw، Chromium مدیریت‌شده توسط
       Playwright در image مربوط به Docker را روی Linux به‌صورت خودکار تشخیص می‌دهد.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر OpenAI Codex OAuth را در راه‌انداز انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل تغییرمسیر صفحه‌ای را که به آن می‌رسید کپی کنید و
    برای تکمیل احراز هویت آن را دوباره در راه‌انداز جای‌گذاری کنید.
  </Accordion>

  <Accordion title="فراداده image پایه">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به‌عنوان فرایند init نقطه ورود (PID 1) شامل می‌شود تا اطمینان حاصل شود فرایندهای zombie جمع‌آوری می‌شوند و سیگنال‌ها در containerهای بلندمدت به‌درستی مدیریت می‌شوند. این image، annotationهای image پایه OCI از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source`، و موارد دیگر را منتشر می‌کند. digest پایه Node
    از طریق PRهای image پایه Docker در Dependabot به‌روزرسانی می‌شود؛ buildهای انتشار
    لایه ارتقای distro را اجرا نمی‌کنند. ببینید:
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### اجرا روی VPS؟

برای مراحل استقرار VM مشترک، از جمله bake کردن binary، ماندگاری، و به‌روزرسانی‌ها، ببینید:
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای VM در Docker](/fa/install/docker-vm-runtime).

## sandbox عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل، و غیره) را داخل containerهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی host باقی می‌ماند. این کار یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجره ایجاد می‌کند، بدون اینکه کل
Gateway را containerize کنید.

دامنه sandbox می‌تواند به‌ازای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دریافت می‌کند که در `/workspace` mount شده است. همچنین می‌توانید
سیاست‌های allow/deny ابزارها، ایزولاسیون شبکه، محدودیت‌های منابع، و containerهای
مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [Sandboxing](/fa/gateway/sandboxing) -- مرجع کامل sandbox
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به containerهای sandbox
- [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای به‌ازای هر عامل

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

image پیش‌فرض sandbox را بسازید (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های inline مربوط به `docker build` به [Sandboxing § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image وجود ندارد یا container sandbox شروع نمی‌شود">
    image sandbox را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا فرمان inline مربوط به `docker build` از [Sandboxing § Imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خودتان تنظیم کنید.
    containerها به‌صورت خودکار و برحسب نیاز، به‌ازای هر نشست ایجاد می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در sandbox">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace mount‌شده شما مطابقت دارد،
    یا مالکیت پوشه workspace را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در sandbox پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که
    مسیرهای ابزار سفارشی شما را در ابتدا اضافه کند، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در طول build کردن image به‌دلیل OOM متوقف شد (exit 137)">
    VM حداقل به ۲ گیگابایت RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="در Control UI نیاز به مجوز یا pairing وجود دارد">
    یک لینک تازه dashboard بگیرید و دستگاه مرورگر را تایید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x را نشان می‌دهد یا Docker CLI خطاهای pairing می‌دهد">
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
- [ClawDock](/fa/install/clawdock) — راه‌اندازی جامعه با Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی Gateway پس از نصب

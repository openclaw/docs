---
read_when:
    - شما به‌جای نصب‌های محلی، یک Gateway کانتینری‌شده می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و آماده‌سازی اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:58:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط اگر یک gateway کانتینری‌شده می‌خواهید یا قصد دارید جریان Docker را اعتبارسنجی کنید، از آن استفاده کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط gateway ایزوله و دورریختنی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین حلقه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **نکته Sandboxing**: backend پیش‌فرض sandbox وقتی sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌صورت پیش‌فرض خاموش است و اجرای کامل gateway در Docker را **الزامی** نمی‌کند. backendهای SSH و OpenShell sandbox نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با exit 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER` را در
  [سخت‌سازی امنیتی برای در معرض شبکه قرار گرفتن](/fa/gateway/security)
  مرور کنید.

## gateway کانتینری‌شده

<Steps>
  <Step title="ساخت image">
    از ریشه repo، اسکریپت setup را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به gateway را به‌صورت محلی می‌سازد. برای استفاده از یک image ازپیش‌ساخته‌شده به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای ازپیش‌ساخته‌شده در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    tagهای رایج: `main`، `latest`، `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="اجرای دوباره در محیط airgapped">
    روی میزبان‌های آفلاین، ابتدا image را منتقل و load کنید:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` بررسی می‌کند که `OPENCLAW_IMAGE` از قبل به‌صورت محلی وجود داشته باشد، pullها و buildهای ضمنی Compose را غیرفعال می‌کند، سپس جریان setup معمولی مانند همگام‌سازی `.env`، اصلاح مجوزها، onboarding، همگام‌سازی پیکربندی gateway، و راه‌اندازی Compose را اجرا می‌کند.

    اگر `OPENCLAW_SANDBOX=1` باشد، setup آفلاین همچنین imageهای sandbox پیش‌فرض پیکربندی‌شده و sandboxهای فعال به‌ازای هر agent را روی daemon پشت `OPENCLAW_DOCKER_SOCKET` بررسی می‌کند. imageهای مرورگر مبتنی بر Docker همچنین باید label قرارداد مرورگر فعلی OpenClaw را داشته باشند. وقتی یک image موردنیاز موجود نباشد یا ناسازگار باشد، setup به‌جای گزارش موفقیت با sandbox غیرقابل‌استفاده، بدون تغییر پیکربندی sandbox خارج می‌شود.

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت setup، onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API ارائه‌دهنده prompt می‌دهد
    - یک token برای gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - دایرکتوری کلید محرمانه auth-profile را ایجاد می‌کند
    - gateway را از طریق Docker Compose شروع می‌کند

    در طول setup، onboarding پیش از شروع و نوشتن‌های پیکربندی مستقیماً از مسیر `openclaw-gateway` اجرا می‌شوند. `openclaw-cli` برای فرمان‌هایی است که پس از ایجاد شدن container مربوط به gateway اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و secret مشترک پیکربندی‌شده را در Settings وارد کنید. اسکریپت setup به‌صورت پیش‌فرض یک token در `.env` می‌نویسد؛ اگر پیکربندی container را به احراز هویت با password تغییر دادید، به‌جای آن از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی channelها (اختیاری)">
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
`docker compose` را از ریشه repo اجرا کنید. اگر `OPENCLAW_EXTRA_MOUNTS` یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت setup فایل `docker-compose.extra.yml` را می‌نویسد؛ آن را بعد از هر فایل override استاندارد وارد کنید، برای مثال وقتی هر دو فایل override وجود دارند:
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، ابزاری پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding و نوشتن‌های پیکربندی زمان setup را از طریق `openclaw-gateway` با `--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت setup این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از یک image راه‌دور به‌جای ساخت محلی                         |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | نصب packageهای اضافی apt هنگام build (جداشده با فاصله)               |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | نصب packageهای اضافی Python هنگام build (جداشده با فاصله)            |
| `OPENCLAW_EXTENSIONS`                      | پیش‌نصب وابستگی‌های plugin در زمان build (نام‌ها جداشده با فاصله)    |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (با کاما جداشده `source:target[:opts]`)   |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌گذاری‌شده Docker            |
| `OPENCLAW_SANDBOX`                         | opt in به راه‌اندازی sandbox (`1`، `true`، `yes`، `on`)              |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                   | override مسیر socket مربوط به Docker                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌صورت پیش‌فرض `1`)    |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount منبع pluginهای bundled            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک OTLP/HTTP collector برای export مربوط به OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مخصوص signal برای traceها، metricها، یا logها       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود      |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | opt in به آخرین attributeهای معنایی آزمایشی GenAI                    |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است    |

image رسمی Docker با Homebrew ارائه نمی‌شود. در طول onboarding، OpenClaw هنگام اجرا در یک container لینوکسی بدون `brew`، installerهای وابستگی skill فقط مخصوص brew را پنهان می‌کند؛ این وابستگی‌ها باید توسط یک image سفارشی فراهم شوند یا دستی نصب شوند. برای وابستگی‌های در دسترس از packageهای Debian، هنگام build image از `OPENCLAW_IMAGE_APT_PACKAGES` استفاده کنید. نام legacy `OPENCLAW_DOCKER_APT_PACKAGES` همچنان پذیرفته می‌شود.
برای وابستگی‌های Python، از `OPENCLAW_IMAGE_PIP_PACKAGES` استفاده کنید. این کار در طول build image فرمان `python3 -m pip install --break-system-packages` را اجرا می‌کند، پس نسخه‌های package را pin کنید و فقط از indexهای package مورداعتماد استفاده کنید.

maintainerها می‌توانند منبع plugin bundled را در برابر یک image بسته‌بندی‌شده با mount کردن یک دایرکتوری منبع plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری منبع mountشده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان plugin id override می‌کند.

### Observability

export مربوط به OpenTelemetry از container مربوط به Gateway به سمت OTLP collector شما خروجی است. به یک port منتشرشده Docker نیاز ندارد. اگر image را به‌صورت محلی build می‌کنید و می‌خواهید exporter همراه OpenTelemetry داخل image در دسترس باشد، وابستگی‌های runtime آن را وارد کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

plugin رسمی `@openclaw/diagnostics-otel` را پیش از فعال کردن export، در نصب‌های Docker بسته‌بندی‌شده از ClawHub نصب کنید. imageهای سفارشی buildشده از منبع همچنان می‌توانند منبع plugin محلی را با `OPENCLAW_EXTENSIONS=diagnostics-otel` وارد کنند. برای فعال کردن export، plugin `diagnostics-otel` را در config مجاز و فعال کنید، سپس `diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در [export مربوط به OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید. headerهای احراز هویت collector از طریق `diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port ازقبل‌منتشرشده Gateway استفاده می‌کنند. `clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، plugin `diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک port عمومی جداگانه `/metrics` یا مسیر reverse-proxy بدون احراز هویت در معرض قرار ندهید. [metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe مربوط به container (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر بررسی‌ها پیوسته fail شوند، Docker container را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و سیستم‌های orchestration می‌توانند آن را restart یا جایگزین کنند.

snapshot عمیق سلامت با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به `http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده gateway دسترسی پیدا کنند.
- `loopback`: فقط فرایندهای داخل فضای نام شبکه container می‌توانند مستقیماً به gateway دسترسی پیدا کنند.

<Note>
از مقادیر حالت bind در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل container خود container است، نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL setup در Docker                  |
| ------------ | ------------------------ | ----------------------------------- |
| LM Studio    | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama       | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

setup همراه Docker از این URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding برای LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml` مقدار `host.docker.internal` را به host gateway مربوط به Docker برای Linux Docker Engine نگاشت می‌کند. Docker Desktop از قبل همین hostname را روی macOS و Windows فراهم می‌کند.

serviceهای میزبان باید همچنین روی نشانی‌ای listen کنند که از Docker قابل‌دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان را
خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### بک‌اند Claude CLI در Docker

تصویر رسمی Docker متعلق به OpenClaw، Claude Code را از پیش نصب نمی‌کند. Claude Code را
داخل کاربر کانتینری که OpenClaw را اجرا می‌کند نصب کنید و وارد آن شوید، سپس
home آن کانتینر را پایدار کنید تا ارتقاهای تصویر، باینری یا وضعیت احراز هویت Claude را
پاک نکنند.

برای نصب‌های جدید Docker، قبل از اجرای راه‌اندازی یک volume پایدار برای `/home/node`
فعال کنید:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

برای نصب Docker موجود، ابتدا stack را متوقف کنید و پیش از اجرای دوباره راه‌اندازی،
مقادیر فعلی Docker `.env` را دوباره بارگذاری کنید. اسکریپت راه‌اندازی به‌تنهایی
`.env` را نمی‌خواند؛ بلکه `.env` را از shell فعلی و پیش‌فرض‌ها بازنویسی می‌کند. برای
`.env` تولیدشده، اجرا کنید:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

اگر `.env` شما شامل مقادیری است که shell نمی‌تواند source کند، ابتدا مقادیر موجودی را
که به آن‌ها وابسته‌اید به‌صورت دستی دوباره export کنید، مانند `OPENCLAW_IMAGE`، پورت‌ها، حالت bind،
مسیرهای سفارشی، `OPENCLAW_EXTRA_MOUNTS`، sandbox، و تنظیمات رد کردن onboarding.
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

نصب‌کننده native، باینری `claude` را زیر
`/home/node/.local/bin/claude` می‌نویسد. به OpenClaw بگویید از همان مسیر کانتینر استفاده کند:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

از داخل همان home کانتینر پایدار وارد شوید و بررسی کنید:

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

پس از آن، می‌توانید از بک‌اند همراه `claude-cli` استفاده کنید:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` نصب native Claude Code را زیر
`/home/node/.local/bin` و `/home/node/.local/share/claude`، به‌علاوه تنظیمات و وضعیت احراز هویت Claude Code
زیر `/home/node/.claude` و `/home/node/.claude.json` پایدار نگه می‌دارد.
پایدار کردن فقط `/home/node/.openclaw` برای استفاده دوباره از Claude CLI کافی نیست. اگر
به‌جای volume برای home از `OPENCLAW_EXTRA_MOUNTS` استفاده می‌کنید، همه آن
مسیرهای Claude را در هر دو سرویس Docker mount کنید.

<Note>
برای اتوماسیون تولید مشترک یا صورت‌حساب‌گیری قابل پیش‌بینی Anthropic، مسیر کلید API
Anthropic را ترجیح دهید. استفاده دوباره از Claude CLI از نسخه نصب‌شده Claude Code،
ورود حساب، صورت‌حساب‌گیری، و رفتار به‌روزرسانی آن پیروی می‌کند.
</Note>

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را قابل اتکا forward نمی‌کند. بنابراین راه‌اندازی همراه Compose به‌صورت پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway وقتی bridge ترافیک multicast را رها می‌کند،
وارد چرخه crash یا راه‌اندازی مجدد مکرر برای advertising نشود.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا DNS-SD در گستره وسیع استفاده کنید.
فقط زمانی `OPENCLAW_DISABLE_BONJOUR=0` را تنظیم کنید که با شبکه host، macvlan،
یا شبکه دیگری اجرا می‌کنید که می‌دانید multicast مربوط به mDNS در آن کار می‌کند.

برای نکات مهم و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw`،
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` را به `/home/node/.config/openclaw` bind-mount می‌کند تا این
مسیرها پس از جایگزینی کانتینر باقی بمانند. وقتی هر متغیری تنظیم نشده باشد، فایل همراه
`docker-compose.yml` به زیر `${HOME}`، یا وقتی خود `HOME` هم وجود نداشته باشد به
`/tmp` fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های خام،
مشخصات volume با منبع خالی تولید کند.

آن دایرکتوری config mount‌شده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتار
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت ذخیره‌شده OAuth/API-key مربوط به provider
- `.env` برای رازهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

دایرکتوری کلید محرمانه auth-profile، کلید رمزنگاری محلی استفاده‌شده برای
ماده token پروفایل‌های auth مبتنی بر OAuth را ذخیره می‌کند. آن را همراه وضعیت میزبان Docker خود نگه دارید،
اما جدا از `OPENCLAW_CONFIG_DIR`.

Pluginهای قابل دانلود نصب‌شده، وضعیت package خود را زیر home mount‌شده
OpenClaw ذخیره می‌کنند، بنابراین رکوردهای نصب Plugin و ریشه‌های package پس از جایگزینی کانتینر
باقی می‌مانند. راه‌اندازی Gateway درخت‌های dependency مربوط به Pluginهای همراه را تولید نمی‌کند.

برای جزئیات کامل پایداری در استقرارهای VM، ببینید
[Docker VM Runtime - چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست، پایگاه داده SQLite مشترک وضعیت،
ریشه‌های package مربوط به Pluginهای نصب‌شده، و logهای فایل چرخشی
زیر `/tmp/openclaw/` را زیر نظر داشته باشید.

### کمک‌کننده‌های shell (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر raw قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل helper محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard`، و غیره استفاده کنید. برای همه فرمان‌ها
`clawdock-help` را اجرا کنید.
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

    اسکریپت فقط پس از گذراندن پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی sandbox نتواند کامل شود، اسکریپت مقدار `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند. نوبت‌های code-mode در Codex همچنان تا زمانی که sandbox
    OpenClaw فعال است به `workspace-write` در Codex محدود می‌شوند؛ socket مربوط به Docker میزبان را
    داخل کانتینرهای sandbox عامل mount نکنید.

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
    بتوانند از طریق `127.0.0.1` به Gateway برسند. با این حالت به‌عنوان یک مرز اعتماد مشترک
    برخورد کنید. config مربوط به compose، `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    برخی راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW` در sidecar
    `openclaw-cli` شبکه مشترک، در lookupهای DNS شکست می‌خورند؛ این وضعیت هنگام فرمان‌های مبتنی بر npm
    مانند `openclaw plugins install` به‌صورت `EAI_AGAIN` دیده می‌شود.
    فایل compose سخت‌گیرانه پیش‌فرض را برای عملیات معمول Gateway نگه دارید. override
    محلی زیر وضعیت امنیتی کانتینر CLI را با برگرداندن capabilityهای پیش‌فرض Docker
    شل‌تر می‌کند، بنابراین فقط برای همان فرمان یک‌باره CLI که به دسترسی به registry package نیاز دارد
    از آن استفاده کنید، نه به‌عنوان فراخوانی پیش‌فرض Compose خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر قبلاً یک کانتینر بلندمدت `openclaw-cli` ساخته‌اید، آن را
    با همان override دوباره بسازید. `docker compose exec` و `docker exec` نمی‌توانند
    capabilityهای Linux را روی کانتینری که از قبل ساخته شده تغییر دهند.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    تصویر با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای permission می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین ناسازگاری می‌تواند به‌صورت هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. یعنی uid فرایند و مالک
    دایرکتوری Plugin mount‌شده با هم همخوان نیستند. ترجیحاً کانتینر را با uid پیش‌فرض 1000
    اجرا کنید و مالکیت bind mount را اصلاح کنید. فقط زمانی
    `/path/to/openclaw-config/npm` را به `root:root` تغییر مالکیت دهید که عمداً می‌خواهید
    OpenClaw را در بلندمدت به‌عنوان root اجرا کنید.

  </Accordion>

  <Accordion title="Faster rebuilds">
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

  <Accordion title="Power-user container options">
    تصویر پیش‌فرض امنیت‌محور است و به‌صورت `node` غیر root اجرا می‌شود. برای کانتینری
    کامل‌تر:

    1. **`/home/node` را پایدار کنید**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **وابستگی‌های سیستم را داخل تصویر bake کنید**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **وابستگی‌های Python را داخل تصویر bake کنید**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Playwright Chromium را داخل تصویر bake کنید**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **یا browserهای Playwright را در یک volume پایدار نصب کنید**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **downloadهای browser را پایدار کنید**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw به‌صورت خودکار Chromium مدیریت‌شده توسط Playwright
       در تصویر Docker روی Linux را شناسایی می‌کند.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    اگر در wizard گزینه OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های بدون head، URL کامل redirect را که به آن می‌رسید کپی کنید و
    برای تکمیل auth آن را دوباره در wizard بچسبانید.
  </Accordion>

  <Accordion title="فرادادهٔ تصویر پایه">
    تصویر اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به‌عنوان فرایند init نقطهٔ ورود (PID 1) شامل می‌شود تا مطمئن شود فرایندهای زامبی جمع‌آوری می‌شوند و سیگنال‌ها در کانتینرهای طولانی‌مدت به‌درستی مدیریت می‌شوند. این تصویر حاشیه‌نویسی‌های تصویر پایهٔ OCI از جمله `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایهٔ Node از طریق PRهای تصویر پایهٔ Docker در Dependabot
    به‌روزرسانی می‌شود؛ ساخت‌های انتشار یک لایهٔ ارتقای توزیع اجرا نمی‌کنند. ببینید:
    [حاشیه‌نویسی‌های تصویر OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### اجرا روی یک VPS؟

برای مراحل مشترک استقرار VM، از جمله پخت باینری، پایداری و به‌روزرسانی‌ها، [Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای Docker VM](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با بک‌اند Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل، و غیره) را داخل کانتینرهای Docker ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این کار بدون کانتینری‌کردن کل
Gateway، یک دیوار سخت پیرامون نشست‌های عامل نامطمئن یا چندمستاجری به شما می‌دهد.

دامنهٔ سندباکس می‌تواند به‌ازای هر عامل (پیش‌فرض)، به‌ازای هر نشست، یا مشترک باشد. هر دامنه
فضای کاری خودش را دارد که در `/workspace` mount شده است. همچنین می‌توانید
سیاست‌های اجازه/رد ابزار، ایزولاسیون شبکه، محدودیت‌های منابع، و کانتینرهای مرورگر را پیکربندی کنید.

برای پیکربندی کامل، تصاویر، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [سندباکس‌کردن](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای سندباکس
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

تصویر پیش‌فرض سندباکس را بسازید (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های درون‌خطی `docker build`، [سندباکس‌کردن § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="تصویر وجود ندارد یا کانتینر سندباکس شروع نمی‌شود">
    تصویر سندباکس را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا فرمان درون‌خطی `docker build` از [سندباکس‌کردن § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی تصویر سفارشی خود تنظیم کنید.
    کانتینرها در صورت نیاز، به‌صورت خودکار به‌ازای هر نشست ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت فضای کاری mount‌شدهٔ شما مطابقت دارد،
    یا مالک پوشهٔ فضای کاری را با chown تغییر دهید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که مسیرهای ابزار سفارشی شما را در ابتدا قرار دهد،
    یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در هنگام ساخت تصویر به‌دلیل OOM کشته شد (خروج 137)">
    VM دست‌کم به ۲ گیگابایت RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="غیرمجاز یا نیازمند جفت‌سازی در Control UI">
    یک پیوند تازهٔ داشبورد بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [داشبورد](/fa/web/dashboard)، [دستگاه‌ها](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x را نشان می‌دهد یا Docker CLI خطاهای جفت‌سازی می‌دهد">
    حالت و bind مربوط به Gateway را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install) — همهٔ روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی جامعه‌محور Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی Gateway پس از نصب

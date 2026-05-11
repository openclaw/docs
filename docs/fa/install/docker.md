---
read_when:
    - شما یک Gateway کانتینری‌شده را به‌جای نصب‌های محلی می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:36:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **یادداشت Sandboxing**: پشتیبان sandbox پیش‌فرض وقتی sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌طور پیش‌فرض غیرفعال است و اجرای کامل Gateway در Docker را **الزامی** نمی‌کند. پشتیبان‌های sandbox مبتنی بر SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروج 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست فایروال Docker `DOCKER-USER`، [سخت‌سازی امنیتی برای در معرض شبکه قرار گرفتن](/fa/gateway/security) را مرور کنید.

## Gateway کانتینری

<Steps>
  <Step title="ساخت image">
    از ریشه repo، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از image از پیش ساخته‌شده به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    imageهای از پیش ساخته‌شده در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    برچسب‌های رایج: `main`، `latest`، `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت راه‌اندازی onboarding را به‌طور خودکار اجرا می‌کند. این اسکریپت:

    - کلیدهای API ارائه‌دهنده را درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose شروع می‌کند

    هنگام راه‌اندازی، onboarding پیش از شروع و نوشتن config مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شوند. `openclaw-cli` برای فرمان‌هایی است که پس از
    وجود داشتن container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="باز کردن رابط کنترل">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و shared secret پیکربندی‌شده
    را در Settings وارد کنید. اسکریپت راه‌اندازی به‌طور پیش‌فرض یک token در `.env`
    می‌نویسد؛ اگر config مربوط به container را به احراز هویت با password تغییر دهید،
    به‌جای آن از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی کانال‌ها (اختیاری)">
    برای افزودن کانال‌های پیام‌رسانی از container مربوط به CLI استفاده کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت راه‌اندازی
`docker-compose.extra.yml` را می‌نویسد؛ آن را با
`-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
چون `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک
ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن config هنگام راه‌اندازی را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت راه‌اندازی این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image راه‌دور به‌جای ساخت محلی                     |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب packageهای apt اضافی هنگام build (جداشده با فاصله)        |
| `OPENCLAW_EXTENSIONS`                      | افزودن helperهای Plugin بسته‌بندی‌شده منتخب در زمان build     |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (جداشده با کاما `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker            |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر socket مربوط به Docker                          |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌طور پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount منبع Plugin بسته‌بندی‌شده |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint کلکتور OTLP/HTTP مشترک برای export در OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP ویژه سیگنال برای traceها، metricها یا logها |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام سرویس استفاده‌شده برای resourceهای OpenTelemetry          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی آخرین attributeهای معنایی آزمایشی GenAI             |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

نگه‌دارندگان می‌توانند منبع Plugin بسته‌بندی‌شده را در برابر image بسته‌بندی‌شده
با mount کردن یک دایرکتوری منبع Plugin روی مسیر منبع بسته‌بندی‌شده آن آزمایش کنند،
برای نمونه
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری منبع mount شده، بسته کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin بازنویسی می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از container مربوط به Gateway به‌سمت بیرون و به
کلکتور OTLP شما انجام می‌شود. به port منتشرشده Docker نیاز ندارد. اگر image را
به‌صورت محلی می‌سازید و می‌خواهید exporter بسته‌بندی‌شده OpenTelemetry داخل image
در دسترس باشد، dependencyهای runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

در نصب‌های Docker بسته‌بندی‌شده، پیش از فعال کردن export، Plugin رسمی
`@openclaw/diagnostics-otel` را از ClawHub نصب کنید. imageهای سفارشی ساخته‌شده
از source همچنان می‌توانند منبع Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در
[export در OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید. headerهای احراز
هویت کلکتور از طریق `diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق
متغیرهای محیطی Docker.

metricهای Prometheus از port از قبل منتشرشده Gateway استفاده می‌کنند.
`clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. port عمومی جداگانه `/metrics`
یا مسیر reverse-proxy بدون احراز هویت در معرض دسترس قرار ندهید. [metricهای
Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe مربوط به container (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که به `/healthz` ping
می‌زند. اگر بررسی‌ها پیوسته شکست بخورند، Docker container را `unhealthy` علامت
می‌زند و سیستم‌های orchestration می‌توانند آن را restart یا جایگزین کنند.

snapshot سلامت عمیق با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌طور پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم
می‌کند تا دسترسی میزبان به `http://127.0.0.1:18789` با انتشار port در Docker
کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط فرایندهای داخل فضای نام شبکه container می‌توانند مستقیماً به Gateway دسترسی داشته باشند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل container خود container
است، نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از
`host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان        | URL راه‌اندازی Docker                 |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی Docker بسته‌بندی‌شده از این URLهای میزبان به‌عنوان پیش‌فرض‌های
onboarding برای LM Studio و Ollama استفاده می‌کند، و `docker-compose.yml`
`host.docker.internal` را به gateway میزبان Docker برای Linux Docker Engine
نگاشت می‌کند. Docker Desktop از قبل همان hostname را روی macOS و Windows فراهم
می‌کند.

سرویس‌های میزبان همچنین باید روی آدرسی گوش بدهند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا فرمان `docker run` خودتان استفاده می‌کنید، همان نگاشت
میزبان را خودتان اضافه کنید، برای نمونه
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل اتکا forward نمی‌کند. بنابراین راه‌اندازی
Compose بسته‌بندی‌شده به‌طور پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم
می‌کند تا Gateway وقتی bridge ترافیک multicast را drop می‌کند، وارد crash-loop
نشود یا تبلیغ را مکرراً restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale یا wide-area DNS-SD
استفاده کنید. `OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با شبکه
host، macvlan یا شبکه دیگری اجرا می‌کنید که می‌دانید multicast مربوط به mDNS در
آن کار می‌کند.

برای نکات و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` به‌صورت bind-mount
متصل می‌کند، بنابراین این مسیرها پس از جایگزینی container باقی می‌مانند. وقتی
هرکدام از متغیرها تنظیم نشده باشد، `docker-compose.yml` بسته‌بندی‌شده به
`${HOME}/.openclaw` (و برای mount مربوط به workspace به
`${HOME}/.openclaw/workspace`) برمی‌گردد، یا وقتی خود `HOME` هم موجود نباشد به
`/tmp/.openclaw` برمی‌گردد. این کار مانع می‌شود `docker compose up` در محیط‌های
خام یک volume spec با source خالی منتشر کند.

آن دایرکتوری config که mount شده است جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

Pluginهای دانلودشدنی نصب‌شده وضعیت package خود را زیر home مربوط به OpenClaw که
mount شده ذخیره می‌کنند، بنابراین recordهای نصب Plugin و ریشه‌های package پس از
جایگزینی container باقی می‌مانند. شروع Gateway درخت‌های dependency مربوط به
Pluginهای بسته‌بندی‌شده را تولید نمی‌کند.

برای جزئیات کامل پایداری در استقرارهای VM، [Docker VM Runtime - چه چیزی کجا
پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where) را ببینید.

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های فایلی چرخشی
زیر `/tmp/openclaw/` را زیر نظر داشته باشید.

### ابزارهای کمکی Shell (اختیاری)

برای مدیریت روزمره آسان‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل کمکی محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و موارد مشابه استفاده کنید. برای همه فرمان‌ها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل ابزار کمکی، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی سندباکس عامل برای Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسیر سفارشی سوکت (مثلاً Docker بدون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    اسکریپت فقط پس از گذراندن پیش‌نیازهای سندباکس، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی سندباکس کامل نشود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند. نوبت‌های حالت کد Codex همچنان تا زمانی که سندباکس OpenClaw فعال است به
    `workspace-write` در Codex محدود می‌مانند؛ سوکت Docker میزبان را در کانتینرهای سندباکس عامل mount نکنید.

  </Accordion>

  <Accordion title="خودکارسازی / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="نکته امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI
    بتوانند از طریق `127.0.0.1` به Gateway دسترسی داشته باشند. با این وضعیت به‌عنوان یک
    مرز اعتماد مشترک برخورد کنید. پیکربندی compose، قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو سرویس `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="خرابی‌های DNS در Docker Desktop داخل openclaw-cli">
    برخی راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW`، در جست‌وجوی DNS از sidecar
    `openclaw-cli` شبکه مشترک شکست می‌خورند، که به‌صورت
    `EAI_AGAIN` هنگام فرمان‌های مبتنی بر npm مانند `openclaw plugins install` دیده می‌شود.
    برای عملیات عادی Gateway، فایل compose سخت‌سازی‌شده پیش‌فرض را نگه دارید. override
    محلی زیر با بازگرداندن قابلیت‌های پیش‌فرض Docker، وضعیت امنیتی کانتینر CLI را
    سست‌تر می‌کند، بنابراین آن را فقط برای همان فرمان یک‌باره CLI که به دسترسی رجیستری
    بسته نیاز دارد استفاده کنید، نه به‌عنوان فراخوانی پیش‌فرض Compose خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر قبلاً یک کانتینر بلندمدت `openclaw-cli` ایجاد کرده‌اید، آن را با همان override
    دوباره ایجاد کنید. `docker compose exec` و `docker exec` نمی‌توانند
    قابلیت‌های Linux را روی کانتینری که از قبل ایجاد شده تغییر دهند.

  </Accordion>

  <Accordion title="مجوزها و EACCES">
    ایمیج با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین ناهماهنگی می‌تواند به‌صورت هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. این یعنی uid فرایند و مالک دایرکتوری Plugin
    mountشده با هم همخوان نیستند. ترجیحاً کانتینر را با uid پیش‌فرض 1000 اجرا کنید
    و مالکیت bind mount را اصلاح کنید. فقط در صورتی `/path/to/openclaw-config/npm`
    را به `root:root` chown کنید که قصد دارید OpenClaw را در بلندمدت به‌عنوان root اجرا کنید.

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

  <Accordion title="گزینه‌های کانتینر برای کاربران حرفه‌ای">
    ایمیج پیش‌فرض امنیت‌محور است و با `node` غیر root اجرا می‌شود. برای کانتینری با
    امکانات کامل‌تر:

    1. **ماندگار کردن `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **گنجاندن وابستگی‌های سیستم**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **گنجاندن Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **یا نصب مرورگرهای Playwright در یک volume ماندگار**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **ماندگار کردن دانلودهای مرورگر**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw روی Linux، Chromium مدیریت‌شده توسط Playwright در ایمیج Docker را
       به‌صورت خودکار تشخیص می‌دهد.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر در wizard گزینه OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌کند. در
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect را که به آن می‌رسید کپی کنید و
    آن را دوباره در wizard جای‌گذاری کنید تا احراز هویت کامل شود.
  </Accordion>

  <Accordion title="فراداده ایمیج پایه">
    ایمیج اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به‌عنوان فرایند init نقطه ورود (PID 1) شامل می‌شود تا اطمینان حاصل شود فرایندهای zombie جمع‌آوری می‌شوند و سیگنال‌ها در کانتینرهای بلندمدت درست مدیریت می‌شوند. این ایمیج annotationهای ایمیج پایه OCI، از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه Node
    از طریق PRهای ایمیج پایه Docker در Dependabot تازه‌سازی می‌شود؛ buildهای انتشار
    لایه ارتقای distro را اجرا نمی‌کنند. ببینید
    [annotationهای ایمیج OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### اجرا روی VPS؟

برای گام‌های استقرار VM مشترک، شامل گنجاندن binary، ماندگاری و به‌روزرسانی‌ها، [Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای Docker VM](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با backend Docker فعال باشد، Gateway
اجرای ابزار عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این کار یک دیوار سخت
دور نشست‌های عامل غیرقابل اعتماد یا چندمستاجری فراهم می‌کند، بدون اینکه کل
Gateway کانتینری شود.

دامنه سندباکس می‌تواند برای هر عامل (پیش‌فرض)، برای هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دریافت می‌کند که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های allow/deny ابزار، ایزوله‌سازی شبکه، محدودیت‌های منابع و کانتینرهای مرورگر را
پیکربندی کنید.

برای پیکربندی کامل، ایمیج‌ها، نکات امنیتی و profileهای چندعاملی، ببینید:

- [سندباکسینگ](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
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

ایمیج سندباکس پیش‌فرض را build کنید (از checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای فرمان‌های inline `docker build` بخش [سندباکسینگ § ایمیج‌ها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) را ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="ایمیج وجود ندارد یا کانتینر سندباکس شروع نمی‌شود">
    ایمیج سندباکس را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا فرمان inline `docker build` از [سندباکسینگ § ایمیج‌ها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) build کنید،
    یا `agents.defaults.sandbox.docker.image` را روی ایمیج سفارشی خود تنظیم کنید.
    کانتینرها به‌صورت خودکار و در صورت نیاز برای هر نشست ایجاد می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace mountشده شما همخوان باشد،
    یا پوشه workspace را chown کنید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که
    مسیرهای ابزار سفارشی شما را prepend کند، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="در هنگام build ایمیج به‌دلیل OOM کشته شد (exit 137)">
    VM حداقل به 2 GB RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="Unauthorized یا نیاز به pairing در Control UI">
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
- [پیکربندی](/fa/gateway/configuration) — پیکربندی gateway پس از نصب

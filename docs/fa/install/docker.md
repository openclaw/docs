---
read_when:
    - شما به‌جای نصب‌های محلی، یک Gateway کانتینری‌شده می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و آماده‌سازی اولیهٔ اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و موقت می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **نکته سندباکس**: backend پیش‌فرض سندباکس وقتی سندباکس فعال باشد از Docker استفاده می‌کند، اما سندباکس به‌طور پیش‌فرض خاموش است و برای اجرای کامل Gateway در Docker **نیازی** ندارد. backendهای سندباکس SSH و OpenShell نیز در دسترس‌اند. [سندباکس](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- دست‌کم ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروج ۱۳۷ به‌دلیل کمبود حافظه کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی یک VPS/میزبان عمومی اجرا می‌کنید، به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER` را در
  [سخت‌سازی امنیتی برای مواجهه شبکه‌ای](/fa/gateway/security)
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
    برچسب‌های رایج: `main`، `latest`، `<version>` (برای مثال `2026.2.26`).

  </Step>

  <Step title="تکمیل onboarding">
    اسکریپت راه‌اندازی onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - کلیدهای API ارائه‌دهنده را درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - directory کلید secret مربوط به auth-profile را می‌سازد
    - Gateway را از طریق Docker Compose راه‌اندازی می‌کند

    هنگام راه‌اندازی، onboarding پیش از شروع و نوشتن‌های config مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شوند. `openclaw-cli` برای commandهایی است که پس از
    وجود داشتن container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و secret مشترک پیکربندی‌شده را در Settings وارد کنید. اسکریپت راه‌اندازی به‌طور پیش‌فرض یک token در `.env` می‌نویسد؛ اگر config کانتینر را به احراز هویت با password تغییر دادید، به‌جای آن از همان password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="پیکربندی کانال‌ها (اختیاری)">
    از کانتینر CLI برای افزودن کانال‌های پیام‌رسانی استفاده کنید:

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

اگر ترجیح می‌دهید هر مرحله را به‌جای استفاده از اسکریپت راه‌اندازی خودتان اجرا کنید:

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
آن را با `-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` namespace شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، یک ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن‌های config زمان راه‌اندازی را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت راه‌اندازی این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از یک image راه‌دور به‌جای ساخت محلی                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب packageهای apt اضافی هنگام build (با فاصله جدا شده‌اند)   |
| `OPENCLAW_EXTENSIONS`                      | شامل کردن helperهای Plugin بسته‌بندی‌شده منتخب هنگام build    |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (با ویرگول جدا شده‌اند: `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker            |
| `OPENCLAW_SANDBOX`                         | انتخاب bootstrap سندباکس (`1`، `true`، `yes`، `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر socket مربوط به Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌طور پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount سورس Plugin بسته‌بندی‌شده  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک collector از نوع OTLP/HTTP برای export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مخصوص signal برای traceها، metricها یا logها |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی protocol مربوط به OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | انتخاب attributeهای semantic آزمایشی جدید GenAI               |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل بارگذاری شده است |

نگهدارندگان می‌توانند سورس Plugin بسته‌بندی‌شده را در برابر یک image بسته‌بندی‌شده آزمایش کنند؛ برای نمونه با mount کردن
یک directory سورس Plugin روی مسیر سورس بسته‌بندی‌شده آن،
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن directory سورس mountشده، bundle کامپایل‌شده مطابق
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin بازنویسی می‌کند.

### مشاهده‌پذیری

export مربوط به OpenTelemetry از کانتینر Gateway به‌سمت collector مربوط به OTLP شما خروجی است. به port منتشرشده Docker نیاز ندارد. اگر image را
به‌صورت محلی می‌سازید و می‌خواهید exporter بسته‌بندی‌شده OpenTelemetry داخل image در دسترس باشد،
dependencyهای runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

در نصب‌های Docker بسته‌بندی‌شده، Plugin رسمی `@openclaw/diagnostics-otel` را پیش از فعال کردن export از ClawHub نصب کنید. imageهای سفارشی ساخته‌شده از سورس همچنان می‌توانند سورس Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه config در [export OpenTelemetry
](/fa/gateway/opentelemetry) استفاده کنید. headerهای احراز هویت collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port ازقبل‌منتشرشده Gateway استفاده می‌کنند. `clawhub:@openclaw/diagnostics-prometheus` را نصب کنید، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با احراز هویت Gateway محافظت می‌شود. یک port عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون احراز هویت expose نکنید. [metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe کانتینر (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر checkها همچنان شکست بخورند، Docker کانتینر را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestration می‌توانند آن را restart یا جایگزین کنند.

snapshot سلامت عمیق احرازشده:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌طور پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده Gateway برسند.
- `loopback`: فقط processهای داخل namespace شبکه کانتینر می‌توانند مستقیماً به
  Gateway برسند.

<Note>
از مقدارهای mode مربوط به bind در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### ارائه‌دهندگان محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل کانتینر خود کانتینر است،
نه دستگاه میزبان شما. برای ارائه‌دهندگان AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| ارائه‌دهنده | URL پیش‌فرض میزبان       | URL راه‌اندازی Docker              |
| ----------- | ------------------------ | ----------------------------------- |
| LM Studio   | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama      | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

راه‌اندازی Docker بسته‌بندی‌شده از این URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding برای LM Studio و Ollama استفاده می‌کند،
و `docker-compose.yml`، `host.docker.internal` را برای Docker Engine روی Linux به gateway میزبان Docker نگاشت می‌کند. Docker Desktop همین hostname را از قبل روی macOS و Windows فراهم می‌کند.

serviceهای میزبان نیز باید روی نشانی‌ای listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از file مربوط به Compose یا command مربوط به `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان را خودتان اضافه کنید؛ برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge در Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را قابل‌اعتماد forward نمی‌کند. بنابراین راه‌اندازی Compose بسته‌بندی‌شده به‌طور پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway هنگام drop شدن ترافیک multicast توسط bridge دچار crash-loop نشود یا تبلیغ را پیوسته restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا DNS-SD گسترده‌ناحیه استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با شبکه host، macvlan،
یا شبکه دیگری اجرا می‌کنید که در آن مشخص است multicast مربوط به mDNS کار می‌کند.

برای نکات و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw`،
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` را به `/home/node/.config/openclaw` به‌صورت bind-mount متصل می‌کند، بنابراین این
مسیرها پس از جایگزینی کانتینر باقی می‌مانند. وقتی هر متغیری تنظیم نشده باشد، `docker-compose.yml` بسته‌بندی‌شده
زیر `${HOME}` fallback می‌کند، یا اگر خود `HOME` هم موجود نباشد به `/tmp` fallback می‌کند. این کار مانع می‌شود `docker compose up` در محیط‌های bare یک
volume spec با source خالی emit کند.

آن directory پیکربندی mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتار
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت OAuth/API-key ذخیره‌شده ارائه‌دهنده
- `.env` برای secretهای runtime مبتنی بر env مانند `OPENCLAW_GATEWAY_TOKEN`

directory کلید secret مربوط به auth-profile کلید encryption محلی استفاده‌شده برای
token material پروفایل auth مبتنی بر OAuth را ذخیره می‌کند. آن را همراه با state میزبان Docker خود نگه دارید،
اما جدا از `OPENCLAW_CONFIG_DIR`.

Pluginهای قابل‌دانلودِ نصب‌شده، وضعیت بستهٔ خود را زیر خانهٔ mounted
OpenClaw ذخیره می‌کنند؛ بنابراین رکوردهای نصب Plugin و ریشه‌های بسته پس از
جایگزینی container نیز باقی می‌مانند. راه‌اندازی Gateway، درخت‌های وابستگیِ Pluginهای بسته‌بندی‌شده را تولید نمی‌کند.

برای جزئیات کامل پایداری در استقرارهای VM، ببینید:
[زمان اجرای Docker VM - چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بستهٔ Plugin نصب‌شده، و file logهای چرخشی
زیر `/tmp/openclaw/` را پایش کنید.

### کمک‌کننده‌های Shell (اختیاری)

برای مدیریت آسان‌تر روزمرهٔ Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر raw قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، دستور نصب بالا را دوباره اجرا کنید تا فایل helper محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و غیره استفاده کنید. برای همهٔ فرمان‌ها
`clawdock-help` را اجرا کنید.
برای راهنمای کامل helper، [ClawDock](/fa/install/clawdock) را ببینید.

<AccordionGroup>
  <Accordion title="فعال‌سازی sandbox عامل برای Docker gateway">
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

    اسکریپت تنها پس از گذراندن پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی sandbox کامل نشود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند. نوبت‌های code-mode در Codex همچنان در زمان فعال بودن sandbox
    OpenClaw به Codex
    `workspace-write` محدود می‌شوند؛ Docker socket میزبان را در containerهای sandbox عامل mount نکنید.

  </Accordion>

  <Accordion title="خودکارسازی / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="نکتهٔ امنیتی شبکهٔ مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI
    بتوانند از طریق `127.0.0.1` به Gateway برسند. با این مورد مانند یک مرز اعتماد مشترک
    برخورد کنید. پیکربندی compose، `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را هم روی `openclaw-gateway` و هم روی `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="خطاهای DNS در Docker Desktop داخل openclaw-cli">
    برخی راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW`، در lookupهای DNS از sidecar
    `openclaw-cli` با شبکهٔ مشترک شکست می‌خورند، که به‌صورت
    `EAI_AGAIN` هنگام فرمان‌های متکی بر npm مانند `openclaw plugins install` ظاهر می‌شود.
    برای کارکرد عادی Gateway، فایل compose سخت‌سازی‌شدهٔ پیش‌فرض را نگه دارید. override
    محلی زیر وضعیت امنیتی container مربوط به CLI را با
    بازگردانی capabilityهای پیش‌فرض Docker آسان‌گیرتر می‌کند؛ بنابراین فقط برای همان فرمان CLI
    موردی که به دسترسی به registry بسته نیاز دارد از آن استفاده کنید، نه به‌عنوان فراخوانی پیش‌فرض Compose
    خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر از قبل یک container بلندمدت `openclaw-cli` ساخته‌اید، آن را
    با همان override دوباره بسازید. `docker compose exec` و `docker exec` نمی‌توانند
    capabilityهای Linux را روی containerی که از قبل ساخته شده تغییر دهند.

  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین عدم تطابق می‌تواند به‌صورت یک هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و سپس `plugin present but blocked` ظاهر شود. این یعنی uid فرایند و مالک
    دایرکتوری mounted Plugin با هم توافق ندارند. ترجیحاً container را با uid پیش‌فرض
    1000 اجرا کنید و مالکیت bind mount را اصلاح کنید. فقط در صورتی
    `/path/to/openclaw-config/npm` را به `root:root` تغییر مالکیت دهید که عمداً قصد دارید
    OpenClaw را در بلندمدت به‌صورت root اجرا کنید.

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوبارهٔ
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
    image پیش‌فرض امنیت‌محور است و به‌صورت non-root `node` اجرا می‌شود. برای containerی
    کامل‌تر:

    1. **پایدارسازی `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **قرار دادن وابستگی‌های سیستم در image**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **قرار دادن Playwright Chromium در image**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **یا نصب مرورگرهای Playwright در یک volume پایدار**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **پایدارسازی دانلودهای مرورگر**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw روی Linux، Chromium مدیریت‌شده توسط Playwright
       در image Docker را به‌صورت خودکار تشخیص می‌دهد.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون head)">
    اگر در wizard گزینهٔ OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌کند. در
    Docker یا راه‌اندازی‌های بدون head، URL کامل redirectی را که به آن می‌رسید کپی کنید و برای
    تکمیل auth دوباره در wizard بچسبانید.
  </Accordion>

  <Accordion title="فرادادهٔ base image">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به‌عنوان فرایند init ورودی (PID 1) شامل می‌شود تا مطمئن شود فرایندهای zombie جمع‌آوری می‌شوند و signalها در containerهای بلندمدت درست مدیریت می‌شوند. این image annotationهای base-image مربوط به OCI از جمله `org.opencontainers.image.base.name`،
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest مربوط به base Node
    از طریق PRهای Dependabot برای base-imageهای Docker تازه‌سازی می‌شود؛ buildهای release
    یک لایهٔ ارتقای distro اجرا نمی‌کنند. ببینید:
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای مراحل مشترک استقرار VM، از جمله قرار دادن binary در image، پایداری، و به‌روزرسانی‌ها، ببینید:
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[زمان اجرای Docker VM](/fa/install/docker-vm-runtime).

## sandbox عامل

وقتی `agents.defaults.sandbox` با backend مربوط به Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل و غیره) را داخل containerهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این کار یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجری ایجاد می‌کند، بدون اینکه کل
Gateway را containerize کند.

دامنهٔ sandbox می‌تواند برای هر عامل (پیش‌فرض)، برای هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های allow/deny ابزار، ایزوله‌سازی شبکه، محدودیت‌های منبع، و containerهای مرورگر
را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و profileهای چندعاملی، ببینید:

- [Sandboxing](/fa/gateway/sandboxing) -- مرجع کامل sandbox
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به containerهای sandbox
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

ساخت image پیش‌فرض sandbox (از یک source checkout):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون source checkout، فرمان‌های inline `docker build` را در [Sandboxing § imageها و setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image موجود نیست یا container مربوط به sandbox شروع نمی‌شود">
    image مربوط به sandbox را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) یا فرمان inline `docker build` از [Sandboxing § imageها و setup](/fa/gateway/sandboxing#images-and-setup) (نصب npm)
    بسازید، یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    containerها هنگام نیاز، برای هر نشست به‌صورت خودکار ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در sandbox">
    `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace mounted شما مطابقت دارد،
    یا پوشهٔ workspace را chown کنید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در sandbox پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که
    مسیرهای ابزار سفارشی شما را در ابتدا اضافه کند، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="هنگام ساخت image به‌دلیل OOM کشته شد (exit 137)">
    VM به حداقل ۲ GB RAM نیاز دارد. از class ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="Unauthorized یا نیاز به pairing در Control UI">
    یک لینک تازهٔ dashboard بگیرید و device مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway، ws://172.x.x.x نشان می‌دهد یا Docker CLI خطاهای pairing می‌دهد">
    حالت Gateway و bind را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install) — همهٔ روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی جامعهٔ Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی Gateway پس از نصب

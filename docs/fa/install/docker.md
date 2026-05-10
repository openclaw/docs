---
read_when:
    - به‌جای نصب‌های محلی، یک Gateway کانتینری‌شده می‌خواهید
    - شما در حال اعتبارسنجی روند Docker هستید
summary: راه‌اندازی و شروع به کار اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:49:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط وقتی از آن استفاده کنید که یک Gateway کانتینری می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید، یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمول استفاده کنید.
- **نکته Sandboxing**: backend پیش‌فرض sandbox وقتی sandboxing فعال باشد از Docker استفاده می‌کند، اما sandboxing به‌صورت پیش‌فرض غیرفعال است و **لازم نیست** کل Gateway در Docker اجرا شود. backendهای sandbox از نوع SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- حداقل ۲ گیگابایت RAM برای ساخت image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با exit 137 به‌دلیل OOM کشته شود)
- فضای دیسک کافی برای imageها و logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، مرور کنید:
  [سخت‌سازی امنیتی برای قرار گرفتن در معرض شبکه](/fa/gateway/security)،
  به‌ویژه سیاست firewall مربوط به Docker `DOCKER-USER`.

## Gateway کانتینری

<Steps>
  <Step title="ساخت image">
    از ریشه repo، setup script را اجرا کنید:

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

  <Step title="تکمیل onboarding">
    setup script به‌صورت خودکار onboarding را اجرا می‌کند. این script:

    - کلیدهای API provider را درخواست می‌کند
    - یک token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose شروع می‌کند

    هنگام setup، onboarding پیش از شروع و نوشتن config مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شود. `openclaw-cli` برای commandهایی است که بعد از
    اینکه container مربوط به Gateway از قبل وجود دارد اجرا می‌کنید.

  </Step>

  <Step title="باز کردن Control UI">
    `http://127.0.0.1:18789/` را در مرورگر خود باز کنید و secret مشترک پیکربندی‌شده
    را در Settings وارد کنید. setup script به‌صورت پیش‌فرض یک token در `.env`
    می‌نویسد؛ اگر config مربوط به container را به password auth تغییر دهید، به‌جای آن
    از همان password استفاده کنید.

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

اگر ترجیح می‌دهید به‌جای استفاده از setup script هر مرحله را خودتان اجرا کنید:

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
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، setup script فایل
`docker-compose.extra.yml` را می‌نویسد؛ آن را با
`-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
از آنجا که `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد،
یک ابزار پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، onboarding
و نوشتن config هنگام setup را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

setup script این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از image راه‌دور به‌جای ساخت محلی                     |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب packageهای apt اضافی هنگام build (جداشده با فاصله)        |
| `OPENCLAW_EXTENSIONS`                      | افزودن helperهای Plugin بسته‌بندی‌شده انتخابی هنگام build     |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mountهای اضافی میزبان (جداشده با ویرگول `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک volume نام‌دار Docker            |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی bootstrap مربوط به sandbox (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله onboarding تعاملی (`1`، `true`، `yes`، `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | override کردن مسیر socket مربوط به Docker                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌صورت پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن overlayهای bind-mount سورس Plugin بسته‌بندی‌شده  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint مشترک collector از نوع OTLP/HTTP برای export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpointهای OTLP مختص signal برای traceها، metricها، یا logها |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override پروتکل OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام service استفاده‌شده برای resourceهای OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی attributeهای semantic آزمایشی جدید GenAI            |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع SDK دوم OpenTelemetry وقتی یکی از قبل preload شده است |

Maintainerها می‌توانند سورس Plugin بسته‌بندی‌شده را در برابر یک image packageشده آزمایش کنند؛
برای مثال با mount کردن یک دایرکتوری سورس Plugin روی مسیر سورس packageشده آن:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن دایرکتوری سورس mountشده، bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin override می‌کند.

### Observability

export مربوط به OpenTelemetry از container مربوط به Gateway به collector
OTLP شما به‌صورت outbound انجام می‌شود. به port منتشرشده Docker نیاز ندارد. اگر image
را به‌صورت محلی می‌سازید و می‌خواهید exporter بسته‌بندی‌شده OpenTelemetry داخل image
در دسترس باشد، dependencyهای runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Plugin رسمی `@openclaw/diagnostics-otel` را از ClawHub در نصب‌های Docker
packageشده پیش از فعال کردن export نصب کنید. imageهای custom که از سورس ساخته شده‌اند
همچنان می‌توانند سورس Plugin محلی را با
`OPENCLAW_EXTENSIONS=diagnostics-otel` اضافه کنند. برای فعال کردن export، Plugin
`diagnostics-otel` را در config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از مثال config در [export
OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید. headerهای auth مربوط به collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

metricهای Prometheus از port ازپیش‌منتشرشده Gateway استفاده می‌کنند. نصب کنید:
`clawhub:@openclaw/diagnostics-prometheus`، Plugin
`diagnostics-prometheus` را فعال کنید، سپس scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این route با authentication مربوط به Gateway محافظت می‌شود. port عمومی جداگانه
`/metrics` یا مسیر reverse-proxy بدون authentication را expose نکنید. [metricهای
Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

endpointهای probe مربوط به container (بدون نیاز به auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

image مربوط به Docker شامل یک `HEALTHCHECK` داخلی است که `/healthz` را ping می‌کند.
اگر بررسی‌ها مدام fail شوند، Docker container را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های orchestration می‌توانند آن را restart یا replace کنند.

snapshot سلامت عمیق با authentication:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر loopback

`scripts/docker/setup.sh` به‌صورت پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به port منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط processهای داخل فضای نام شبکه container می‌توانند مستقیماً به
  Gateway دسترسی داشته باشند.

<Note>
از مقدارهای bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه aliasهای میزبان مثل `0.0.0.0` یا `127.0.0.1`.
</Note>

### Providerهای محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل container خود container است،
نه دستگاه میزبان شما. برای providerهای AI که روی میزبان اجرا می‌شوند از
`host.docker.internal` استفاده کنید:

| Provider  | URL پیش‌فرض میزبان        | URL در setup مربوط به Docker        |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

setup بسته‌بندی‌شده Docker از آن URLهای میزبان به‌عنوان پیش‌فرض‌های onboarding برای LM Studio و Ollama
استفاده می‌کند، و `docker-compose.yml` مقدار `host.docker.internal` را برای
Docker Engine روی Linux به host gateway مربوط به Docker map می‌کند. Docker Desktop همین hostname
را از قبل روی macOS و Windows فراهم می‌کند.

serviceهای میزبان نیز باید روی آدرسی listen کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا command سفارشی `docker run` خودتان استفاده می‌کنید، همان mapping
میزبان را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه bridge مربوط به Docker معمولاً multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را به‌طور قابل‌اعتماد forward نمی‌کند. بنابراین setup بسته‌بندی‌شده Compose
به‌صورت پیش‌فرض `OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway هنگام drop شدن
ترافیک multicast توسط bridge دچار crash-loop نشود یا بارها advertising را restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale، یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با host networking، macvlan،
یا شبکه دیگری اجرا می‌کنید که مشخص است multicast مربوط به mDNS در آن کار می‌کند.

برای نکات و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### ذخیره‌سازی و پایداری

Docker Compose مقدار `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` به‌صورت bind-mount متصل می‌کند،
بنابراین این مسیرها پس از replace شدن container باقی می‌مانند. وقتی هرکدام از این متغیرها unset باشد،
`docker-compose.yml` بسته‌بندی‌شده به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای mount مربوط به workspace) fallback می‌کند، یا وقتی خود
`HOME` هم وجود نداشته باشد به `/tmp/.openclaw` fallback می‌کند. این باعث می‌شود
`docker compose up` در محیط‌های خام، volume spec با source خالی منتشر نکند.

آن دایرکتوری config mountشده جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای auth ذخیره‌شده OAuth/API-key مربوط به provider
- `.env` برای secretهای runtime مبتنی بر env، مانند `OPENCLAW_GATEWAY_TOKEN`

Pluginهای دانلودی نصب‌شده، وضعیت package خود را زیر home مربوط به OpenClaw که mount شده ذخیره می‌کنند،
بنابراین رکوردهای نصب Plugin و ریشه‌های package پس از replace شدن container باقی می‌مانند.
شروع Gateway درخت‌های dependency مربوط به Pluginهای بسته‌بندی‌شده را تولید نمی‌کند.

برای جزئیات کامل پایداری در deploymentهای VM، ببینید:
[Docker VM Runtime - چه چیزی کجا پایدار می‌ماند](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط پررشد مصرف دیسک:** `media/`، فایل‌های JSONL نشست،
`cron/runs/*.jsonl`، ریشه‌های بسته‌های Plugin نصب‌شده، و لاگ‌های فایلی چرخشی
زیر `/tmp/openclaw/` را زیر نظر بگیرید.

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
  <Accordion title="فعال‌سازی سندباکس عامل برای Docker gateway">
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

    اسکریپت فقط پس از گذراندن پیش‌نیازهای سندباکس، `docker.sock` را mount می‌کند. اگر
    راه‌اندازی سندباکس کامل نشود، اسکریپت `agents.defaults.sandbox.mode`
    را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="اتوماسیون / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="نکته امنیتی شبکه مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا دستورهای CLI
    بتوانند از طریق `127.0.0.1` به Gateway برسند. با این مورد مانند یک مرز اعتماد
    مشترک رفتار کنید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و
    `no-new-privileges` را روی هر دو `openclaw-gateway` و `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="خطاهای DNS در Docker Desktop داخل openclaw-cli">
    برخی راه‌اندازی‌های Docker Desktop پس از حذف `NET_RAW`، در sidecar
    `openclaw-cli` با شبکه مشترک در lookupهای DNS شکست می‌خورند؛ این مشکل به صورت
    `EAI_AGAIN` هنگام دستورهای متکی بر npm مانند `openclaw plugins install` ظاهر می‌شود.
    برای کارکرد عادی Gateway، فایل compose سخت‌سازی‌شده پیش‌فرض را نگه دارید. override
    محلی زیر وضعیت امنیتی کانتینر CLI را با بازگرداندن قابلیت‌های پیش‌فرض Docker
    شل‌تر می‌کند؛ بنابراین آن را فقط برای دستور CLI موردی که به دسترسی به رجیستری بسته
    نیاز دارد استفاده کنید، نه به عنوان فراخوانی پیش‌فرض Compose خود:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    اگر قبلا یک کانتینر طولانی‌مدت `openclaw-cli` ساخته‌اید، آن را
    با همان override دوباره بسازید. `docker compose exec` و `docker exec` نمی‌توانند
    قابلیت‌های Linux را روی کانتینری که از قبل ساخته شده تغییر دهند.

  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی
    `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    همین ناهماهنگی می‌تواند به صورت هشدار Plugin مانند
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    و در ادامه `plugin present but blocked` ظاهر شود. یعنی uid فرایند و مالک
    دایرکتوری Plugin mount‌شده با هم ناسازگارند. ترجیحا کانتینر را با uid پیش‌فرض 1000 اجرا کنید
    و مالکیت bind mount را اصلاح کنید. فقط در صورتی
    `/path/to/openclaw-config/npm` را به `root:root` تغییر مالکیت دهید که قصد دارید
    OpenClaw را در بلندمدت به صورت root اجرا کنید.

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
    image پیش‌فرض با اولویت امنیت ساخته شده و به صورت کاربر غیر root یعنی `node` اجرا می‌شود. برای یک
    کانتینر کامل‌تر:

    1. **پایدارسازی `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **گنجاندن وابستگی‌های سیستم**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **نصب مرورگرهای Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **پایدارسازی دانلودهای مرورگر**: از `OPENCLAW_HOME_VOLUME` یا
       `OPENCLAW_EXTRA_MOUNTS` استفاده کنید. OpenClaw در Linux، Chromium مدیریت‌شده توسط Playwright
       در image Docker را به طور خودکار تشخیص می‌دهد.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون رابط گرافیکی)">
    اگر در wizard گزینه OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در
    Docker یا راه‌اندازی‌های بدون رابط گرافیکی، URL کامل redirect که به آن می‌رسید را کپی کنید
    و برای تکمیل احراز هویت دوباره در wizard جای‌گذاری کنید.
  </Accordion>

  <Accordion title="فراداده image پایه">
    image اصلی runtime Docker از `node:24-bookworm-slim` استفاده می‌کند و `tini` را به عنوان فرایند init نقطه ورود (PID 1) شامل می‌شود تا مطمئن شود فرایندهای zombie جمع‌آوری می‌شوند و signalها در کانتینرهای طولانی‌مدت درست مدیریت می‌شوند. این image annotationهای image پایه OCI از جمله `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه Node
    از طریق PRهای Dependabot برای Docker base-image تازه‌سازی می‌شود؛ buildهای انتشار
    یک لایه ارتقای distro اجرا نمی‌کنند. ببینید:
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای مراحل استقرار VM مشترک، از جمله گنجاندن binary، پایداری و به‌روزرسانی‌ها،
[Hetzner (Docker VPS)](/fa/install/hetzner) و
[Docker VM Runtime](/fa/install/docker-vm-runtime) را ببینید.

## سندباکس عامل

وقتی `agents.defaults.sandbox` با backend Docker فعال باشد، Gateway
اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل و غیره) را داخل کانتینرهای Docker
ایزوله اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این یک دیوار سخت
دور نشست‌های عامل نامطمئن یا چندمستاجره ایجاد می‌کند، بدون اینکه کل
Gateway کانتینری شود.

دامنه سندباکس می‌تواند به ازای هر عامل (پیش‌فرض)، هر نشست، یا مشترک باشد. هر دامنه
workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید
سیاست‌های allow/deny ابزار، ایزولاسیون شبکه، محدودیت‌های منابع، و کانتینرهای
مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، نکات امنیتی، و پروفایل‌های چندعاملی، ببینید:

- [سندباکسینگ](/fa/gateway/sandboxing) -- مرجع کامل سندباکس
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به کانتینرهای سندباکس
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای به ازای هر عامل

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

image سندباکس پیش‌فرض را بسازید (از یک checkout منبع):

```bash
scripts/sandbox-setup.sh
```

برای نصب‌های npm بدون checkout منبع، برای دستورهای inline `docker build` به [سندباکسینگ § imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) مراجعه کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image وجود ندارد یا کانتینر سندباکس شروع نمی‌شود">
    image سندباکس را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout منبع) یا دستور inline `docker build` از [سندباکسینگ § imageها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) (نصب npm) بسازید،
    یا `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    کانتینرها هنگام نیاز، به طور خودکار برای هر نشست ساخته می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در سندباکس">
    `docker.user` را روی یک UID:GID تنظیم کنید که با مالکیت workspace mount‌شده شما مطابقت داشته باشد،
    یا پوشه workspace را chown کنید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در سندباکس پیدا نمی‌شوند">
    OpenClaw دستورها را با `sh -lc` (login shell) اجرا می‌کند، که
    `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. `docker.env.PATH` را طوری تنظیم کنید که
    مسیرهای ابزار سفارشی شما را prepend کند، یا در Dockerfile خود اسکریپتی زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="هنگام build کردن image به دلیل OOM کشته شد (exit 137)">
    VM به حداقل 2 GB RAM نیاز دارد. از یک کلاس ماشین بزرگ‌تر استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="غیرمجاز یا نیازمند pairing در Control UI">
    یک لینک dashboard تازه بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x نشان می‌دهد یا خطاهای pairing از Docker CLI می‌آید">
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

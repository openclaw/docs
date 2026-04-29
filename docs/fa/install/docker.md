---
read_when:
    - شما به‌جای نصب‌های محلی، یک Gateway کانتینری می‌خواهید
    - شما در حال اعتبارسنجی جریان Docker هستید
summary: راه‌اندازی و آماده‌سازی اولیهٔ اختیاری مبتنی بر Docker برای OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-29T23:03:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker **اختیاری** است. فقط زمانی از آن استفاده کنید که یک Gateway کانتینری‌شده می‌خواهید یا می‌خواهید جریان Docker را اعتبارسنجی کنید.

## آیا Docker برای من مناسب است؟

- **بله**: یک محیط Gateway ایزوله و دورریختنی می‌خواهید یا می‌خواهید OpenClaw را روی میزبانی بدون نصب‌های محلی اجرا کنید.
- **خیر**: روی دستگاه خودتان اجرا می‌کنید و فقط سریع‌ترین چرخه توسعه را می‌خواهید. به‌جای آن از جریان نصب معمولی استفاده کنید.
- **نکته Sandboxing**: Backend پیش‌فرض Sandbox وقتی Sandboxing فعال باشد از Docker استفاده می‌کند، اما Sandboxing به‌طور پیش‌فرض خاموش است و برای اجرای Gateway کامل در Docker **نیازی** ندارد. Backendهای Sandbox از نوع SSH و OpenShell نیز در دسترس هستند. [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## پیش‌نیازها

- Docker Desktop (یا Docker Engine) + Docker Compose v2
- دست‌کم ۲ گیگابایت RAM برای ساخت Image (`pnpm install` ممکن است روی میزبان‌های ۱ گیگابایتی با خروج 137 به‌دلیل کمبود حافظه کشته شود)
- فضای دیسک کافی برای Imageها و Logها
- اگر روی VPS/میزبان عمومی اجرا می‌کنید، 
  [سخت‌سازی امنیتی برای قرار گرفتن در معرض شبکه](/fa/gateway/security)
  را بررسی کنید، به‌ویژه سیاست Firewall مربوط به Docker `DOCKER-USER`.

## Gateway کانتینری‌شده

<Steps>
  <Step title="Build the image">
    از ریشه Repo، اسکریپت راه‌اندازی را اجرا کنید:

    ```bash
    ./scripts/docker/setup.sh
    ```

    این کار Image مربوط به Gateway را به‌صورت محلی می‌سازد. برای استفاده از یک Image ازپیش‌ساخته به‌جای آن:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Imageهای ازپیش‌ساخته در
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    منتشر می‌شوند.
    Tagهای رایج: `main`, `latest`, `<version>` (مثلاً `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    اسکریپت راه‌اندازی Onboarding را به‌صورت خودکار اجرا می‌کند. این اسکریپت:

    - برای کلیدهای API مربوط به Provider پیام می‌دهد
    - یک Token برای Gateway تولید می‌کند و آن را در `.env` می‌نویسد
    - Gateway را از طریق Docker Compose اجرا می‌کند

    هنگام راه‌اندازی، Onboarding پیش از شروع و نوشتن Config مستقیماً از طریق
    `openclaw-gateway` اجرا می‌شود. `openclaw-cli` برای دستورهایی است که پس از
    موجود بودن Container مربوط به Gateway اجرا می‌کنید.

  </Step>

  <Step title="Open the Control UI">
    `http://127.0.0.1:18789/` را در مرورگر باز کنید و Secret مشترک پیکربندی‌شده
    را در Settings وارد کنید. اسکریپت راه‌اندازی به‌طور پیش‌فرض یک Token در `.env`
    می‌نویسد؛ اگر Config کانتینر را به احراز هویت با Password تغییر دادید، به‌جای آن از همان
    Password استفاده کنید.

    دوباره به URL نیاز دارید؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    از Container مربوط به CLI برای افزودن Channelهای پیام‌رسانی استفاده کنید:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    مستندات: [WhatsApp](/fa/channels/whatsapp), [Telegram](/fa/channels/telegram), [Discord](/fa/channels/discord)

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
`docker compose` را از ریشه Repo اجرا کنید. اگر `OPENCLAW_EXTRA_MOUNTS`
یا `OPENCLAW_HOME_VOLUME` را فعال کرده‌اید، اسکریپت راه‌اندازی `docker-compose.extra.yml` را می‌نویسد؛
آن را با `-f docker-compose.yml -f docker-compose.extra.yml` اضافه کنید.
</Note>

<Note>
چون `openclaw-cli` فضای نام شبکه `openclaw-gateway` را به‌اشتراک می‌گذارد، ابزاری
پس از شروع است. پیش از `docker compose up -d openclaw-gateway`، Onboarding
و نوشتن Config زمان راه‌اندازی را از طریق `openclaw-gateway` با
`--no-deps --entrypoint node` اجرا کنید.
</Note>

### متغیرهای محیطی

اسکریپت راه‌اندازی این متغیرهای محیطی اختیاری را می‌پذیرد:

| متغیر                                      | هدف                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استفاده از Image راه‌دور به‌جای ساخت محلی                     |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | نصب Packageهای اضافی apt هنگام Build (جداشده با Space)        |
| `OPENCLAW_EXTENSIONS`                      | نصب پیشاپیش وابستگی‌های Plugin در زمان Build (نام‌های جداشده با Space) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind Mountهای اضافی میزبان (جداشده با Comma به‌شکل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | پایدارسازی `/home/node` در یک Volume نام‌دار Docker            |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | مسیر Container برای وابستگی‌ها و Mirrorهای تولیدشده Pluginهای Bundleشده |
| `OPENCLAW_SANDBOX`                         | فعال‌سازی Bootstrap مربوط به Sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | رد کردن مرحله Onboarding تعاملی (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`                   | بازنویسی مسیر Socket مربوط به Docker                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | غیرفعال کردن تبلیغ Bonjour/mDNS (برای Docker به‌طور پیش‌فرض `1`) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | غیرفعال کردن Overlayهای Bind-mount سورس Pluginهای Bundleشده   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint مشترک OTLP/HTTP Collector برای خروجی OpenTelemetry   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpointهای OTLP مخصوص Signal برای Traceها، Metricها یا Logها |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | بازنویسی Protocol مربوط به OTLP. امروز فقط `http/protobuf` پشتیبانی می‌شود |
| `OTEL_SERVICE_NAME`                        | نام Service استفاده‌شده برای Resourceهای OpenTelemetry        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | فعال‌سازی ویژگی‌های Semantic آزمایشی GenAI جدید               |
| `OPENCLAW_OTEL_PRELOADED`                  | رد کردن شروع یک SDK دوم OpenTelemetry وقتی یکی از قبل Preload شده است |

Maintainerها می‌توانند سورس Pluginهای Bundleشده را در برابر یک Image بسته‌بندی‌شده با Mount کردن
یک Directory سورس Plugin روی مسیر سورس بسته‌بندی‌شده آن آزمایش کنند، برای مثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
آن Directory سورس Mountشده، Bundle کامپایل‌شده متناظر
`/app/dist/extensions/synology-chat` را برای همان شناسه Plugin بازنویسی می‌کند.

### مشاهده‌پذیری

خروجی OpenTelemetry از Container مربوط به Gateway به سمت
Collector مربوط به OTLP شما Outbound است. به Port منتشرشده Docker نیاز ندارد. اگر Image را
به‌صورت محلی می‌سازید و می‌خواهید Exporter مربوط به OpenTelemetry Bundleشده داخل Image در دسترس باشد،
وابستگی‌های Runtime آن را اضافه کنید:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Image رسمی انتشار Docker مربوط به OpenClaw شامل سورس Plugin
`diagnostics-otel` Bundleشده است. بسته به Image و وضعیت Cache، ممکن است
Gateway همچنان نخستین باری که Plugin فعال می‌شود وابستگی‌های Runtime محلی Plugin مربوط به OpenTelemetry را Stage کند،
پس اجازه دهید آن نخستین Boot به Package Registry برسد یا Image را در Lane انتشار خود Prewarm کنید. برای فعال کردن خروجی، Plugin
`diagnostics-otel` را در Config مجاز و فعال کنید، سپس
`diagnostics.otel.enabled=true` را تنظیم کنید یا از نمونه Config در
[خروجی OpenTelemetry](/fa/gateway/opentelemetry) استفاده کنید. Headerهای احراز هویت Collector از طریق
`diagnostics.otel.headers` پیکربندی می‌شوند، نه از طریق متغیرهای محیطی Docker.

Metricهای Prometheus از Port ازپیش‌منتشرشده Gateway استفاده می‌کنند. Plugin
`diagnostics-prometheus` را فعال کنید، سپس Scrape کنید:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

این Route با احراز هویت Gateway محافظت می‌شود. Port عمومی جداگانه
`/metrics` یا مسیر Reverse-proxy بدون احراز هویت را در معرض قرار ندهید. 
[Metricهای Prometheus](/fa/gateway/prometheus) را ببینید.

### بررسی‌های سلامت

Endpointهای Probe کانتینر (بدون نیاز به احراز هویت):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Image مربوط به Docker یک `HEALTHCHECK` داخلی دارد که `/healthz` را Ping می‌کند.
اگر بررسی‌ها همچنان شکست بخورند، Docker کانتینر را به‌عنوان `unhealthy` علامت‌گذاری می‌کند و
سیستم‌های Orchestration می‌توانند آن را Restart یا جایگزین کنند.

Snapshot سلامت عمیق با احراز هویت:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN در برابر Loopback

`scripts/docker/setup.sh` به‌طور پیش‌فرض `OPENCLAW_GATEWAY_BIND=lan` را تنظیم می‌کند تا دسترسی میزبان به
`http://127.0.0.1:18789` با انتشار Port در Docker کار کند.

- `lan` (پیش‌فرض): مرورگر میزبان و CLI میزبان می‌توانند به Port منتشرشده Gateway دسترسی داشته باشند.
- `loopback`: فقط Processهای داخل فضای نام شبکه Container می‌توانند
  مستقیماً به Gateway دسترسی داشته باشند.

<Note>
از مقدارهای Bind mode در `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) استفاده کنید، نه Aliasهای میزبان مانند `0.0.0.0` یا `127.0.0.1`.
</Note>

### Providerهای محلی میزبان

وقتی OpenClaw در Docker اجرا می‌شود، `127.0.0.1` داخل Container خود Container است،
نه دستگاه میزبان شما. برای Providerهای AI که روی میزبان اجرا می‌شوند از `host.docker.internal` استفاده کنید:

| Provider  | URL پیش‌فرض میزبان        | URL راه‌اندازی Docker              |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

راه‌اندازی Docker Bundleشده از همان URLهای میزبان به‌عنوان پیش‌فرض‌های Onboarding مربوط به LM Studio و Ollama
استفاده می‌کند، و `docker-compose.yml`، `host.docker.internal` را به
Gateway میزبان Docker برای Linux Docker Engine نگاشت می‌کند. Docker Desktop همین Hostname را روی macOS و Windows از قبل فراهم می‌کند.

Serviceهای میزبان نیز باید روی نشانی‌ای گوش کنند که از Docker قابل دسترسی باشد:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

اگر از فایل Compose یا دستور `docker run` خودتان استفاده می‌کنید، همان نگاشت میزبان
را خودتان اضافه کنید، برای مثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

شبکه Bridge در Docker معمولاً Multicast مربوط به Bonjour/mDNS
(`224.0.0.251:5353`) را با اطمینان Forward نمی‌کند. بنابراین راه‌اندازی Compose Bundleشده به‌طور پیش‌فرض
`OPENCLAW_DISABLE_BONJOUR=1` را تنظیم می‌کند تا Gateway هنگام Drop شدن ترافیک Multicast توسط Bridge، Crash-loop نشود یا تبلیغ را مکرراً Restart نکند.

برای میزبان‌های Docker از URL منتشرشده Gateway، Tailscale یا wide-area DNS-SD استفاده کنید.
`OPENCLAW_DISABLE_BONJOUR=0` را فقط زمانی تنظیم کنید که با Host networking، macvlan
یا شبکه دیگری اجرا می‌کنید که مشخص است Multicast مربوط به mDNS در آن کار می‌کند.

برای نکته‌های مشکل‌زا و عیب‌یابی، [کشف Bonjour](/fa/gateway/bonjour) را ببینید.

### Storage و پایداری

Docker Compose، `OPENCLAW_CONFIG_DIR` را به `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` را به `/home/node/.openclaw/workspace` Bind-mount می‌کند، بنابراین این مسیرها
پس از جایگزینی Container باقی می‌مانند. وقتی هرکدام از این متغیرها تنظیم نشده باشد، فایل Bundleشده
`docker-compose.yml` به `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` برای Mount مربوط به Workspace) برمی‌گردد، یا وقتی خود `HOME` نیز وجود ندارد
به `/tmp/.openclaw` برمی‌گردد. این باعث می‌شود `docker compose up` در محیط‌های خام، Volume spec با Source خالی
منتشر نکند.

آن Directory مربوط به Config که Mount شده است جایی است که OpenClaw این موارد را نگه می‌دارد:

- `openclaw.json` برای Config رفتاری
- `agents/<agentId>/agent/auth-profiles.json` برای احراز هویت ذخیره‌شده OAuth/API-key مربوط به Provider
- `.env` برای Secretهای Runtime مبتنی بر Env مانند `OPENCLAW_GATEWAY_TOKEN`

وابستگی‌های زمان اجرای Pluginهای همراه و فایل‌های زمان اجرای آینه‌شده، وضعیت تولیدشده هستند، نه پیکربندی کاربر. Compose آن‌ها را در Docker volume نام‌گذاری‌شده‌ی `openclaw-plugin-runtime-deps` ذخیره می‌کند که در مسیر `/var/lib/openclaw/plugin-runtime-deps` mount شده است. بیرون نگه داشتن آن درخت پرتغییر از bind mount پیکربندی میزبان، از کندی عملیات فایل در Docker Desktop/WSL و handleهای کهنه‌ی Windows هنگام شروع سرد Gateway جلوگیری می‌کند.

فایل پیش‌فرض Compose مقدار `OPENCLAW_PLUGIN_STAGE_DIR` را برای هر دو سرویس `openclaw-gateway` و `openclaw-cli` روی همان مسیر تنظیم می‌کند، بنابراین `openclaw doctor --fix`، فرمان‌های ورود/راه‌اندازی channel، و شروع Gateway همگی از همان volume زمان اجرای تولیدشده استفاده می‌کنند.

برای جزئیات کامل پایداری در استقرارهای VM، ببینید:
[Docker VM Runtime - چه چیزی کجا باقی می‌ماند](/fa/install/docker-vm-runtime#what-persists-where).

**نقاط داغ رشد دیسک:** `media/`، فایل‌های JSONL نشست، `cron/runs/*.jsonl`، Docker volume با نام `openclaw-plugin-runtime-deps`، و لاگ‌های فایل چرخشی زیر `/tmp/openclaw/` را زیر نظر داشته باشید.

### کمک‌کننده‌های Shell (اختیاری)

برای مدیریت روزمره‌ی ساده‌تر Docker، `ClawDock` را نصب کنید:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

اگر ClawDock را از مسیر خام قدیمی‌تر `scripts/shell-helpers/clawdock-helpers.sh` نصب کرده‌اید، فرمان نصب بالا را دوباره اجرا کنید تا فایل helper محلی شما مکان جدید را دنبال کند.

سپس از `clawdock-start`، `clawdock-stop`، `clawdock-dashboard` و موارد مشابه استفاده کنید. برای همه‌ی فرمان‌ها `clawdock-help` را اجرا کنید.
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

    این script فقط پس از موفقیت پیش‌نیازهای sandbox، `docker.sock` را mount می‌کند. اگر راه‌اندازی sandbox کامل نشود، script مقدار `agents.defaults.sandbox.mode` را به `off` بازنشانی می‌کند.

  </Accordion>

  <Accordion title="اتوماسیون / CI (غیرتعاملی)">
    تخصیص pseudo-TTY در Compose را با `-T` غیرفعال کنید:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="یادداشت امنیتی شبکه‌ی مشترک">
    `openclaw-cli` از `network_mode: "service:openclaw-gateway"` استفاده می‌کند تا فرمان‌های CLI بتوانند از طریق `127.0.0.1` به Gateway برسند. با این مورد مانند یک مرز اعتماد مشترک رفتار کنید. پیکربندی compose قابلیت‌های `NET_RAW`/`NET_ADMIN` را حذف می‌کند و `no-new-privileges` را روی `openclaw-cli` فعال می‌کند.
  </Accordion>

  <Accordion title="مجوزها و EACCES">
    image با کاربر `node` (uid 1000) اجرا می‌شود. اگر روی `/home/node/.openclaw` خطاهای مجوز می‌بینید، مطمئن شوید bind mountهای میزبان شما متعلق به uid 1000 هستند:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="بازسازی‌های سریع‌تر">
    Dockerfile خود را طوری مرتب کنید که لایه‌های وابستگی cache شوند. این کار از اجرای دوباره‌ی `pnpm install` جلوگیری می‌کند، مگر اینکه lockfileها تغییر کنند:

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

  <Accordion title="گزینه‌های container برای کاربران پیشرفته">
    image پیش‌فرض با اولویت امنیت طراحی شده و با کاربر غیر-root با نام `node` اجرا می‌شود. برای container کامل‌تر:

    1. **پایدارسازی `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **گنجاندن وابستگی‌های سیستم**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **نصب مرورگرهای Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **پایدارسازی دانلودهای مرورگر**: مقدار `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` را تنظیم کنید و از `OPENCLAW_HOME_VOLUME` یا `OPENCLAW_EXTRA_MOUNTS` استفاده کنید.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بدون head)">
    اگر در wizard گزینه‌ی OpenAI Codex OAuth را انتخاب کنید، یک URL مرورگر باز می‌شود. در Docker یا راه‌اندازی‌های بدون head، URL کامل redirect را که به آن می‌رسید کپی کنید و برای تکمیل auth آن را دوباره در wizard بچسبانید.
  </Accordion>

  <Accordion title="فراداده‌ی image پایه">
    image اصلی زمان اجرای Docker از `node:24-bookworm-slim` استفاده می‌کند و annotationهای image پایه‌ی OCI از جمله `org.opencontainers.image.base.name`، `org.opencontainers.image.source` و موارد دیگر را منتشر می‌کند. digest پایه‌ی Node از طریق PRهای Docker base-image در Dependabot تازه‌سازی می‌شود؛ buildهای release لایه‌ی ارتقای distro را اجرا نمی‌کنند. ببینید:
    [annotationهای image در OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### روی VPS اجرا می‌کنید؟

برای مراحل مشترک استقرار VM، از جمله گنجاندن binary، پایداری و به‌روزرسانی‌ها، [Hetzner (Docker VPS)](/fa/install/hetzner) و [Docker VM Runtime](/fa/install/docker-vm-runtime) را ببینید.

## sandbox عامل

وقتی `agents.defaults.sandbox` با backend Docker فعال باشد، Gateway اجرای ابزارهای عامل (shell، خواندن/نوشتن فایل و غیره) را داخل containerهای ایزوله‌ی Docker اجرا می‌کند، در حالی که خود Gateway روی میزبان باقی می‌ماند. این یک دیوار سخت پیرامون نشست‌های عامل غیرقابل‌اعتماد یا چندمستأجری فراهم می‌کند، بدون اینکه لازم باشد کل Gateway را containerize کنید.

دامنه‌ی sandbox می‌تواند به‌ازای هر عامل (پیش‌فرض)، به‌ازای هر نشست، یا مشترک باشد. هر دامنه workspace خودش را دارد که در `/workspace` mount می‌شود. همچنین می‌توانید policyهای مجاز/غیرمجاز ابزار، ایزوله‌سازی شبکه، محدودیت‌های منابع، و containerهای مرورگر را پیکربندی کنید.

برای پیکربندی کامل، imageها، یادداشت‌های امنیتی، و profileهای چندعاملی، ببینید:

- [Sandboxing](/fa/gateway/sandboxing) -- مرجع کامل sandbox
- [OpenShell](/fa/gateway/openshell) -- دسترسی shell تعاملی به containerهای sandbox
- [Multi-Agent Sandbox and Tools](/fa/tools/multi-agent-sandbox-tools) -- overrideهای به‌ازای هر عامل

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

image پیش‌فرض sandbox را build کنید:

```bash
scripts/sandbox-setup.sh
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="image وجود ندارد یا container sandbox شروع نمی‌شود">
    image sandbox را با
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    build کنید یا مقدار `agents.defaults.sandbox.docker.image` را روی image سفارشی خود تنظیم کنید.
    containerها هنگام نیاز، به‌صورت خودکار برای هر نشست ایجاد می‌شوند.
  </Accordion>

  <Accordion title="خطاهای مجوز در sandbox">
    مقدار `docker.user` را روی UID:GIDای تنظیم کنید که با مالکیت workspace mountشده‌ی شما مطابق باشد، یا پوشه‌ی workspace را chown کنید.
  </Accordion>

  <Accordion title="ابزارهای سفارشی در sandbox پیدا نمی‌شوند">
    OpenClaw فرمان‌ها را با `sh -lc` (login shell) اجرا می‌کند، که `/etc/profile` را source می‌کند و ممکن است PATH را بازنشانی کند. مقدار `docker.env.PATH` را تنظیم کنید تا مسیرهای ابزار سفارشی شما را در ابتدا اضافه کند، یا در Dockerfile خود scriptای زیر `/etc/profile.d/` اضافه کنید.
  </Accordion>

  <Accordion title="هنگام build image به دلیل OOM کشته شد (exit 137)">
    VM به حداقل 2 GB RAM نیاز دارد. از کلاس ماشین بزرگ‌تری استفاده کنید و دوباره تلاش کنید.
  </Accordion>

  <Accordion title="در Control UI مجوز ندارید یا pairing لازم است">
    یک link تازه برای dashboard بگیرید و دستگاه مرورگر را تأیید کنید:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    جزئیات بیشتر: [Dashboard](/fa/web/dashboard)، [Devices](/fa/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway مقدار ws://172.x.x.x یا خطاهای pairing از Docker CLI نشان می‌دهد">
    حالت و bind مربوط به gateway را بازنشانی کنید:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## مرتبط

- [مرور نصب](/fa/install) — همه‌ی روش‌های نصب
- [Podman](/fa/install/podman) — جایگزین Podman برای Docker
- [ClawDock](/fa/install/clawdock) — راه‌اندازی اجتماعی Docker Compose
- [به‌روزرسانی](/fa/install/updating) — به‌روز نگه داشتن OpenClaw
- [پیکربندی](/fa/gateway/configuration) — پیکربندی gateway پس از نصب

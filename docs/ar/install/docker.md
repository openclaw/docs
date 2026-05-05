---
read_when:
    - تريد Gateway مُشغَّلًا داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من مسار Docker
summary: إعداد اختياري قائم على Docker والتهيئة الأولية لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو التحقق من سير Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للرمي، أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع حلقة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة العزل**: يستخدم نظام العزل الافتراضي Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب تشغيل Gateway بالكامل في Docker. كما تتوفر أنظمة عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يوقفه النظام بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز خروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغل على VPS/مضيف عام، راجع
  [تقوية الأمان للتعرض الشبكي](/ar/gateway/security)،
  خصوصا سياسة جدار الحماية `DOCKER-USER` الخاصة بـ Docker.

## Gateway داخل حاوية

<Steps>
  <Step title="بناء الصورة">
    من جذر المستودع، شغل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يبني هذا صورة Gateway محليا. لاستخدام صورة مبنية مسبقا بدلا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تنشر الصور المبنية مسبقا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="إكمال الإعداد الأولي">
    يشغل سكربت الإعداد الإعداد الأولي تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API لمزود الخدمة
    - توليد رمز Gateway وكتابته إلى `.env`
    - بدء تشغيل Gateway عبر Docker Compose

    أثناء الإعداد، يعمل الإعداد الأولي قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="فتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في الإعدادات. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعداد
    الحاوية إلى مصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلا من ذلك.

    هل تحتاج إلى الرابط مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="إعداد القنوات (اختياري)">
    استخدم حاوية CLI لإضافة قنوات المراسلة:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    التوثيق: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)

  </Step>
</Steps>

### المسار اليدوي

إذا كنت تفضل تشغيل كل خطوة بنفسك بدلا من استخدام سكربت الإعداد:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
شغل `docker compose` من جذر المستودع. إذا فعلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، يكتب سكربت الإعداد `docker-compose.extra.yml`؛
أدرجه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل الإعداد الأولي
وكتابات إعدادات وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                                    | الغرض                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)             |
| `OPENCLAW_EXTENSIONS`                      | تضمين مساعدين محددين للـ Plugin المضمنة في وقت البناء          |
| `OPENCLAW_EXTRA_MOUNTS`                    | ربطات تحميل إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | إبقاء `/home/node` في مجلد Docker مسمى                         |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)             |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة الإعداد الأولي التفاعلية (`1`، `true`، `yes`، `on`)  |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (القيمة الافتراضية `1` لـ Docker)     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات ربط تحميل مصدر Plugin المضمنة                      |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يدعم اليوم إلا `http/protobuf`         |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                       |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث السمات الدلالية التجريبية لـ GenAI            |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء OpenTelemetry SDK ثان عند تحميل واحد مسبقا            |

يمكن للمشرفين اختبار مصدر Plugin مضمنة مقابل صورة معبأة من خلال تحميل
دليل مصدر Plugin واحد فوق مسار مصدرها المعبأ، مثلا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمل ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية المراقبة

يكون تصدير OpenTelemetry صادرا من حاوية Gateway إلى جامع OTLP لديك. لا يتطلب
منفذ Docker منشورا. إذا بنيت الصورة محليا وتريد أن يكون مصدر OpenTelemetry
المضمن متاحا داخل الصورة، فضمّن اعتماداته وقت التشغيل:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبت Plugin الرسمية `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر
قادرة على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح بـ Plugin
`diagnostics-otel` وفعلها في الإعدادات، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال الإعدادات في [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
تضبط ترويسات مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبت
`clawhub:@openclaw/diagnostics-prometheus`، وفعل Plugin
`diagnostics-prometheus`، ثم اجمع المقاييس:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عام منفصلا أو مسار
وكيل عكسي غير مصادق. راجع [مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات السلامة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker فحص `HEALTHCHECK` مدمجا يرسل طلبا إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### الشبكة المحلية مقابل الاسترجاع المحلي

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن الوصول إلى Gateway مباشرة إلا للعمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### المزودون المحليون على المضيف

عندما يعمل OpenClaw في Docker، فإن `127.0.0.1` داخل الحاوية هو الحاوية نفسها،
وليس جهاز المضيف. استخدم `host.docker.internal` لمزودي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزود    | رابط المضيف الافتراضي     | رابط إعداد Docker                    |
| --------- | -------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434`  |

يستخدم إعداد Docker المضمن روابط المضيف تلك كقيم افتراضية للإعداد الأولي
لـ LM Studio وOllama، ويعين `docker-compose.yml` الاسم `host.docker.internal`
إلى Gateway المضيف في Docker على Linux Docker Engine. يوفر Docker Desktop
اسم المضيف نفسه بالفعل على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصا بك أو أمر `docker run`، فأضف تعيين المضيف
نفسه بنفسك، مثلا
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

عادة لا تمرر شبكات جسر Docker بث Bonjour/mDNS متعدد الوجهات
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المضمن القيمة الافتراضية
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد تشغيل
الإعلان مرارا عندما يسقط الجسر حركة البث متعدد الوجهات.

استخدم رابط Gateway المنشور، أو Tailscale، أو DNS-SD واسع النطاق لمضيفي Docker.
اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل بشبكة المضيف أو macvlan
أو شبكة أخرى يعرف أن بث mDNS متعدد الوجهات يعمل فيها.

للملاحظات المهمة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose ‏`OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تبقى هذه المسارات
بعد استبدال الحاوية. عندما لا يكون أي من المتغيرين مضبوطا، يعود
`docker-compose.yml` المضمن إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لتحميل مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودا أيضا. يحافظ ذلك على `docker compose up` من
إصدار مواصفة مجلد بمصدر فارغ في البيئات المجردة.

دليل الإعدادات المحمل هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة لمزودي الخدمة
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

تخزن Plugins القابلة للتنزيل المثبتة حالة حزمها تحت مجلد OpenClaw الرئيسي المحمل،
لذلك تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية. لا يولد بدء تشغيل Gateway
أشجار اعتماد للـ Plugin المضمنة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[زمن تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط ارتفاع استخدام القرص:** راقب `media/`، وملفات JSONL الخاصة بالجلسات،
و`cron/runs/*.jsonl`، وجذور حزم Plugin المثبتة، وسجلات الملفات الدوارة
تحت `/tmp/openclaw/`.

### مساعدات Shell (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` للاطلاع على جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للدليل الكامل للمساعد.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker بلا جذر):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    يركّب السكربت `docker.sock` فقط بعد اجتياز متطلبات صندوق العزل الأساسية. إذا
    تعذّر إكمال إعداد صندوق العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    يستخدم `openclaw-cli` الإعداد `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا كحد ثقة مشترك. تسقط إعدادات compose
    قدرات `NET_RAW`/`NET_ADMIN` وتفعّل
    `no-new-privileges` على كلٍّ من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    تعمل الصورة كمستخدم `node` (uid 1000). إذا ظهرت لك أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات bind mount في المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    رتّب Dockerfile بحيث تُخزَّن طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
    `pnpm install` إلا إذا تغيّرت ملفات القفل:

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
    الصورة الافتراضية تضع الأمان أولًا وتعمل كمستخدم `node` غير جذري. لحاوية أكثر
    اكتمالًا في الميزات:

    1. **استمرارية `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام في الصورة**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **استمرارية تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    Docker أو الإعدادات بلا واجهة رسومية، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى في المعالج لإنهاء المصادقة.
  </Accordion>

  <Accordion title="Base image metadata">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتنشر تعليقات OCI
    لصورة الأساس، بما في ذلك `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يتم
    تحديث بصمة أساس Node عبر PRs الخاصة بصور Docker الأساسية من Dependabot؛ ولا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[Docker VM Runtime](/ar/install/docker-vm-runtime) لخطوات نشر VM مشتركة
تشمل تضمين الملفات الثنائية، والاستمرارية، والتحديثات.

## صندوق عزل الوكيل

عند تمكين `agents.defaults.sandbox` مع الواجهة الخلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (Shell، قراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزًا صلبًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين دون وضع Gateway بالكامل داخل حاوية.

يمكن أن يكون نطاق صندوق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مركّبة في `/workspace`. يمكنك أيضًا تكوين
سياسات السماح/الرفض للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للتكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل](/ar/gateway/sandboxing) -- مرجع صندوق العزل الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول تفاعلي إلى Shell داخل حاويات صندوق العزل
- [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### تمكين سريع

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

ابنِ صورة صندوق العزل الافتراضية (من نسخة مصدرية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm دون نسخة مصدرية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للحصول على أوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    ابنِ صورة صندوق العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدرية) أو أمر `docker build` المضمن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركّبة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، ما يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في البداية، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile الخاص بك.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة جهاز أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    اجلب رابط لوحة تحكم جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة التحكم](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    أعد ضبط وضع Gateway والربط:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose من المجتمع
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

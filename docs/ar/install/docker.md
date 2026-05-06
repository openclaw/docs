---
read_when:
    - تريد Gateway مُشغّلًا في حاوية بدلاً من عمليات التثبيت المحلية
    - أنت تتحقق من سير عمل Docker
summary: إعداد وتهيئة أولية اختياريان مستندان إلى Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-06T08:00:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker اختياري **optional**. استخدمه فقط إذا كنت تريد Gateway ضمن حاوية أو التحقق من سير Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للتخلص منها، أو تشغيل OpenClaw على مضيف بدون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع حلقة تطوير. استخدم سير التثبيت العادي بدلا من ذلك.
- **ملاحظة العزل**: يستخدم خلفية العزل الافتراضية Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب **not** تشغيل Gateway الكامل في Docker. تتوفر أيضا خلفيات عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يقتله نفاد الذاكرة على مضيفين بسعة 1 GB مع الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تعمل على VPS/مضيف عام، فراجع
  [تقوية الأمان للتعرض الشبكي](/ar/gateway/security)،
  وخاصة سياسة جدار حماية Docker `DOCKER-USER`.

## Gateway ضمن حاوية

<Steps>
  <Step title="Build the image">
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
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثلا `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    يشغل سكربت الإعداد الإعداد الأولي تلقائيا. سيقوم بما يلي:

    - يطلب مفاتيح API الخاصة بالمزود
    - ينشئ رمزا مميزا لـ Gateway ويكتبه إلى `.env`
    - يبدأ Gateway عبر Docker Compose

    أثناء الإعداد، تعمل خطوات الإعداد الأولي قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. يستخدم `openclaw-cli` للأوامر التي تشغلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="Open the Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في الإعدادات. يكتب سكربت الإعداد رمزا مميزا إلى `.env` افتراضيا؛ إذا بدلت
    إعدادات الحاوية إلى مصادقة كلمة مرور، فاستخدم تلك الكلمة بدلا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    استخدم حاوية CLI لإضافة قنوات المراسلة:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)

  </Step>
</Steps>

### السير اليدوي

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
قم بتضمينه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء شبكة `openclaw-gateway`، فهو أداة
بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل الإعداد الأولي
وكتابات الإعداد وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية هذه:

| المتغير                                   | الغرض                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`                      | تضمين مساعدين محددين لـ Plugin المجمعة وقت البناء           |
| `OPENCLAW_EXTRA_MOUNTS`                    | عمليات ربط إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | استمرار `/home/node` في مجلد Docker مسمى                   |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة الإعداد الأولي التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (الافتراضي `1` لـ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات تركيب مصدر Plugin المجمعة               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. يدعم اليوم `http/protobuf` فقط |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية         |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء SDK ثان لـ OpenTelemetry عند تحميل واحد مسبقا  |

يمكن للمشرفين اختبار مصدر Plugin مجمع مقابل صورة معبأة عن طريق تركيب
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، على سبيل المثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المركب ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لنفس معرف Plugin.

### قابلية المراقبة

تصدير OpenTelemetry يكون صادرا من حاوية Gateway إلى جامع OTLP لديك. لا
يتطلب منفذ Docker منشورا. إذا بنيت الصورة محليا وتريد أن يكون مصدر
OpenTelemetry المدمج متاحا داخل الصورة، فقم بتضمين تبعيات وقت تشغيله:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر
قادرة على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح بـ Plugin
`diagnostics-otel` وفعله في الإعدادات، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال الإعداد في [تصدير OpenTelemetry
](/ar/gateway/opentelemetry). تضبط رؤوس مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبت
`clawhub:@openclaw/diagnostics-prometheus`، وفعل Plugin
`diagnostics-prometheus`، ثم اجمع البيانات:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عاما منفصلا
أو مسارا عبر وكيل عكسي غير مصادق. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker `HEALTHCHECK` مدمجا يرسل ping إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` افتراضيا `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن الوصول إلى Gateway مباشرة إلا من العمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### المزودون المحليون على المضيف

عندما يعمل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهازك المضيف. استخدم `host.docker.internal` لمزودي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزود  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المجمع عناوين URL تلك للمضيف كإعدادات أولية افتراضية
لـ LM Studio وOllama، ويعين `docker-compose.yml`‏ `host.docker.internal` إلى
Gateway مضيف Docker لـ Linux Docker Engine. يوفر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أيضا أن تستمع خدمات المضيف على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصا بك أو أمر `docker run`، فأضف تعيين المضيف
نفسه بنفسك، مثلا
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

عادة لا تمرر شبكة الجسر في Docker بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المجمع افتراضيا
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد
بدء الإعلان مرارا عند إسقاط الجسر لحركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway أو Tailscale أو DNS-SD واسع النطاق لمضيفي Docker.
اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة المضيف أو macvlan
أو شبكة أخرى يعرف أن بث mDNS المتعدد يعمل فيها.

للاطلاع على الملاحظات واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose‏ `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، لذلك تبقى هذه المسارات
بعد استبدال الحاوية. عندما لا يكون أي من المتغيرين معينا، يعود
`docker-compose.yml` المجمع إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لتركيب مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودا أيضا. يمنع ذلك `docker compose up` من
إصدار مواصفة مجلد ذات مصدر فارغ في البيئات المجردة.

دليل الإعداد المركب هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة للمزود
- `.env` للأسرار في وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

تخزن Plugins القابلة للتنزيل المثبتة حالة حزمتها تحت منزل OpenClaw المركب،
لذلك تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية. لا ينشئ بدء
Gateway أشجار تبعيات Plugin المجمعة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[Docker VM Runtime - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**مواضع نمو القرص الساخنة:** راقب `media/`، وملفات JSONL للجلسات،
و`cron/runs/*.jsonl`، وجذور حزم Plugin المثبتة، وسجلات الملفات الدوارة
تحت `/tmp/openclaw/`.

### مساعدات الصدفة (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّتت ClawDock من مسار raw الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل عزل الوكيل لـ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار مقبس مخصص (مثل Docker بلا صلاحيات الجذر):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يركّب السكربت `docker.sock` إلا بعد اجتياز متطلبات العزل الأساسية. إذا
    تعذر إكمال إعداد العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان الشبكة المشتركة">
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا على أنه حد ثقة
    مشترك. يسقط إعداد compose إمكانيتي `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة باسم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات ربط المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    يمكن أن يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. يعني ذلك أن uid العملية ومالك
    دليل Plugin المركّب غير متفقين. يُفضّل تشغيل الحاوية باستخدام uid 1000
    الافتراضي وإصلاح ملكية الربط. لا تغيّر ملكية
    `/path/to/openclaw-config/npm` إلى `root:root` إلا إذا كنت تنوي تشغيل
    OpenClaw كجذر على المدى الطويل.

  </Accordion>

  <Accordion title="إعادة بناء أسرع">
    رتّب Dockerfile بحيث تُخزّن طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
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

  <Accordion title="خيارات الحاوية للمستخدمين المتقدمين">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل باسم `node` غير الجذري. للحصول على حاوية
    أكثر اكتمالًا بالميزات:

    1. **استمرار `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **استمرار تنزيلات المتصفح**: عيّن
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    Docker أو إعدادات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى في المعالج لإنهاء المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة وقت تشغيل Docker الرئيسية `node:24-bookworm-slim` وتنشر تعليقات OCI
    للصورة الأساسية، بما في ذلك `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يُحدّث ملخص أساس Node
    عبر طلبات PR من Dependabot لصور Docker الأساسية؛ لا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### التشغيل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) لخطوات نشر VM مشتركة
تشمل تضمين الثنائيات، والاستمرار، والتحديثات.

## عزل الوكيل

عند تفعيل `agents.defaults.sandbox` باستخدام خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (الصدفة، قراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك ذلك جدارًا صلبًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بالكامل
داخل حاوية.

يمكن أن يكون نطاق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مركّبة عند `/workspace`. يمكنك أيضًا تكوين
سياسات السماح/الرفض للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للحصول على التكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل في بيئة محمية](/ar/gateway/sandboxing) -- مرجع العزل الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول صدفة تفاعلي إلى حاويات العزل
- [عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### تفعيل سريع

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

ابنِ صورة العزل الافتراضية (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدرية محلية، راجع [العزل في بيئة محمية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمّنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية العزل لا تبدأ">
    ابنِ صورة العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدرية محلية) أو أمر `docker build` المضمّن من [العزل في بيئة محمية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو عيّن `agents.defaults.sandbox.docker.image` إلى صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في العزل">
    عيّن `docker.user` إلى UID:GID يطابق ملكية مساحة العمل المركّبة لديك،
    أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (صدفة تسجيل دخول)، ما يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. عيّن `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في المقدمة، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile الخاص بك.
  </Accordion>

  <Accordion title="إنهاء بسبب نفاد الذاكرة أثناء بناء الصورة (exit 137)">
    تحتاج VM إلى 2 غيغابايت RAM على الأقل. استخدم فئة آلة أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو الاقتران مطلوب في واجهة التحكم">
    اجلب رابط لوحة معلومات جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة المعلومات](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway يعرض ws://172.x.x.x أو أخطاء اقتران من Docker CLI">
    أعد ضبط وضع Gateway والربط:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — كل طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose من المجتمع
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

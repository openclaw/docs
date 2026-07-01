---
read_when:
    - تريد Gateway داخل حاوية بدلًا من التثبيتات المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة اختياريان قائمان على Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:00:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker اختياري **اختياري**. استخدمه فقط إذا كنت تريد Gateway ضمن حاوية أو تريد التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للرمي، أو تريد تشغيل OpenClaw على مضيف بدون تثبيتات محلية.
- **لا**: تعمل على جهازك وتريد فقط أسرع حلقة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة العزل**: يستخدم محرك العزل الافتراضي Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب **تشغيل** Gateway الكامل داخل Docker. تتوفر أيضا محركات عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد ينهيه النظام بسبب نفاد الذاكرة على مضيفات 1 GB مع الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغل على VPS/مضيف عام، راجع
  [تقوية الأمان للتعرض الشبكي](/ar/gateway/security)،
  خصوصا سياسة جدار حماية Docker `DOCKER-USER`.

## Gateway ضمن حاوية

<Steps>
  <Step title="ابن الصورة">
    من جذر المستودع، شغل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يبني هذا صورة Gateway محليا. لاستخدام صورة مبنية مسبقا بدلا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تنشر الصور المبنية مسبقا أولا إلى
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR هو السجل الأساسي لأتمتة الإصدارات، وعمليات النشر المثبتة بإصدار،
    وفحوصات المصدر. ينشر سير عمل الإصدار نفسه أيضا مرآة رسمية على
    Docker Hub عند `openclaw/openclaw` للمضيفات التي تفضل Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    استخدم `ghcr.io/openclaw/openclaw` أو `openclaw/openclaw`. تجنب مرايا
    Docker Hub المجتمعية لأن OpenClaw لا يتحكم في توقيت إصداراتها،
    أو إعادة بنائها، أو سياسة الاحتفاظ بها. الوسوم الرسمية الشائعة: `main`، و`latest`،
    و`<version>` (مثلا `2026.2.26`)، وإصدارات بيتا مثل
    `2026.2.26-beta.1`. لا تنقل وسوم بيتا `latest` أو `main`.

  </Step>

  <Step title="إعادة التشغيل بدون اتصال">
    على المضيفات غير المتصلة، انقل الصورة وحملها أولا:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    يتحقق `--offline` من أن `OPENCLAW_IMAGE` موجودة محليا بالفعل، ويعطل
    عمليات السحب والبناء الضمنية عبر Compose، ثم يشغل مسار الإعداد العادي مثل
    مزامنة `.env`، وإصلاحات الأذونات، والتهيئة الأولية، ومزامنة إعدادات Gateway،
    وبدء Compose.

    إذا كان `OPENCLAW_SANDBOX=1`، يتحقق الإعداد دون اتصال أيضا من صور العزل الافتراضية
    المضبوطة والنشطة لكل وكيل على الخادم خلف
    `OPENCLAW_DOCKER_SOCKET`. يجب أن تحمل صور المتصفح المدعومة من Docker أيضا
    تسمية عقد متصفح OpenClaw الحالية. عند فقدان صورة مطلوبة أو
    عدم توافقها، يخرج الإعداد بدون تغيير إعدادات العزل بدلا من
    الإبلاغ عن النجاح مع عزل غير قابل للاستخدام.

  </Step>

  <Step title="أكمل التهيئة الأولية">
    يشغل سكربت الإعداد التهيئة الأولية تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API لموفر الخدمة
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - إنشاء دليل مفتاح سر ملف تعريف المصادقة
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولية قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="افتح واجهة Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في Settings. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعدادات الحاوية إلى مصادقة كلمة المرور، فاستخدم تلك
    الكلمة بدلا من ذلك.

    هل تحتاج إلى الرابط مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="اضبط القنوات (اختياري)">
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
أدرجه بعد أي ملف تجاوز قياسي، على سبيل المثال
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
عند وجود ملفي التجاوز كليهما.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل التهيئة الأولية
وكتابات الإعداد وقت الإعداد عبر `openclaw-gateway` مع
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية هذه:

| المتغير                                        | الغرض                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | استخدام صورة بعيدة بدلا من البناء محليا                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | تثبيت حزم Python إضافية أثناء البناء (مفصولة بمسافات)          |
| `OPENCLAW_EXTENSIONS`                           | تثبيت اعتماديات Plugin مسبقا وقت البناء (أسماء مفصولة بمسافات) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | تجاوز خيارات Node لبناء المصدر المحلي                          |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | تجاوز كومة tsdown لبناء المصدر المحلي بوحدة MB                     |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | تخطي مخرجات التصريحات أثناء بناء الصور المحلية الخاصة بالتشغيل فقط        |
| `OPENCLAW_EXTRA_MOUNTS`                         | عمليات ربط تحميل إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                          | إبقاء `/home/node` في مجلد Docker مسمى                         |
| `OPENCLAW_SANDBOX`                              | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                      | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                        | تجاوز مسار مقبس Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | تعطيل إعلانات Bonjour/mDNS (الافتراضي هو `1` لـ Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | تعطيل طبقات ربط تحميل مصدر Plugin المضمنة                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | نقطة نهاية جامع OTLP/HTTP المشتركة لتصدير OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | تجاوز بروتوكول OTLP. يدعم اليوم `http/protobuf` فقط       |
| `OTEL_SERVICE_NAME`                             | اسم الخدمة المستخدم لموارد OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | الاشتراك في أحدث سمات GenAI الدلالية التجريبية               |
| `OPENCLAW_OTEL_PRELOADED`                       | تخطي بدء SDK ثان لـ OpenTelemetry عند تحميل واحد مسبقا        |

لا تتضمن صورة Docker الرسمية Homebrew. أثناء التهيئة الأولية، يخفي OpenClaw
مثبتات اعتماديات Skills الخاصة بـ brew فقط عندما يعمل داخل حاوية Linux
بدون `brew`؛ يجب توفير تلك الاعتماديات عبر صورة مخصصة
أو تثبيتها يدويا. للاعتماديات المتاحة من حزم Debian، استخدم
`OPENCLAW_IMAGE_APT_PACKAGES` أثناء بناء الصورة. لا يزال الاسم القديم
`OPENCLAW_DOCKER_APT_PACKAGES` مقبولا.
لاعتماديات Python، استخدم `OPENCLAW_IMAGE_PIP_PACKAGES`. يشغل هذا
`python3 -m pip install --break-system-packages` أثناء بناء الصورة، لذلك ثبت
إصدارات الحزم واستخدم فهارس حزم تثق بها فقط.
تضبط عمليات بناء المصدر `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` افتراضيا على
`--max-old-space-size=8192` وتترك
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` غير مضبوطة كي يستطيع مغلف tsdown
احترام حدود ذاكرة الحاوية. كما تضبط افتراضيا
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` لأن صور التشغيل تحذف ملفات التصريحات
بعد البناء. إذا أبلغ Docker عن `ResourceExhausted`، أو `cannot allocate
memory`، أو توقف أثناء `tsdown`، فزد حد ذاكرة باني Docker أو
أعد المحاولة بكومات صريحة أصغر، مثلا
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`.

يمكن للمشرفين اختبار مصدر Plugin مضمن مقابل صورة معبأة عن طريق تحميل
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، مثلا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمل هذا حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية المراقبة

يكون تصدير OpenTelemetry خارجا من حاوية Gateway إلى جامع OTLP
الخاص بك. لا يتطلب منفذ Docker منشورا. إذا بنيت الصورة
محليا وتريد أن يكون مصدر OpenTelemetry المضمن متاحا داخل الصورة،
فأدرج اعتماديات التشغيل الخاصة به:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر قادرة
على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح بـ Plugin
`diagnostics-otel` وفعله في الإعدادات، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال الإعداد في [تصدير OpenTelemetry
](/ar/gateway/opentelemetry). تضبط ترويسات مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبت
`clawhub:@openclaw/diagnostics-prometheus`، وفعل Plugin
`diagnostics-prometheus`، ثم اجمع المقاييس:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عام منفصل
أو مسار وكيل عكسي غير مصادق. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker فحصًا مدمجًا باسم `HEALTHCHECK` يرسل طلبًا إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة موثقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### الشبكة المحلية مقابل loopback

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن الوصول إلى Gateway مباشرة إلا من العمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مضيفة بديلة مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### الموفرون المحليون على المضيف

عند تشغيل OpenClaw داخل Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهازك المضيف. استخدم `host.docker.internal` لموفري الذكاء الاصطناعي الذين
يعملون على المضيف:

| الموفر    | عنوان URL الافتراضي على المضيف | عنوان URL لإعداد Docker            |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المضمّن عناوين URL هذه للمضيف كافتراضات الإعداد الأولي لـ LM Studio وOllama،
ويعيّن `docker-compose.yml` الاسم `host.docker.internal` إلى
Gateway المضيف في Docker لمحرك Docker على Linux. يوفر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضًا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصًا بك أو أمر `docker run`، فأضف تعيين المضيف نفسه
بنفسك، على سبيل المثال
`--add-host=host.docker.internal:host-gateway`.

### خلفية Claude CLI في Docker

لا تثبّت صورة OpenClaw الرسمية لـ Docker أداة Claude Code مسبقًا. ثبّت
Claude Code وسجّل الدخول إليها داخل مستخدم الحاوية الذي يشغّل OpenClaw، ثم احتفظ
بمجلد المنزل الخاص بتلك الحاوية حتى لا تمحو ترقيات الصورة الملف الثنائي أو حالة مصادقة Claude.

لتثبيتات Docker الجديدة، فعّل مجلدًا دائمًا لـ `/home/node` قبل تشغيل
الإعداد:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

لتثبيت Docker موجود، أوقف الحزمة أولًا وأعد تحميل قيم Docker الحالية من
`.env` قبل إعادة تشغيل الإعداد. لا يقرأ سكربت الإعداد
`.env` من تلقاء نفسه؛ بل يعيد كتابة `.env` من الصدفة الحالية والافتراضات. بالنسبة إلى
ملف `.env` المُنشأ، شغّل:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

إذا كان ملف `.env` يحتوي على قيم لا يمكن لصدفتك تحميلها كمصدر، فأعد تصدير
القيم الحالية التي تعتمد عليها يدويًا أولًا، مثل `OPENCLAW_IMAGE`، والمنافذ، ووضع الربط،
والمسارات المخصصة، و`OPENCLAW_EXTRA_MOUNTS`، وsandbox، وإعدادات تخطي الإعداد الأولي.
يركّب التراكب المُنشأ مجلد المنزل لكل من `openclaw-gateway` و
`openclaw-cli`.

شغّل الأوامر المتبقية باستخدام تراكب Compose المُنشأ حتى يركّب كلا الخدمتين
مجلد المنزل الدائم. إذا كان إعدادك يستخدم أيضًا `docker-compose.override.yml`،
فأدرجه قبل `docker-compose.extra.yml`.

ثبّت Claude Code في ذلك المنزل الدائم:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

يكتب المثبّت الأصلي الملف الثنائي `claude` تحت
`/home/node/.local/bin/claude`. أخبر OpenClaw باستخدام ذلك المسار داخل الحاوية:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

سجّل الدخول وتحقق من داخل منزل الحاوية الدائم نفسه:

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

بعد ذلك، يمكنك استخدام خلفية `claude-cli` المضمّنة:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

يحافظ `OPENCLAW_HOME_VOLUME` على تثبيت Claude Code الأصلي تحت
`/home/node/.local/bin` و`/home/node/.local/share/claude`، إضافة إلى إعدادات Claude Code
وحالة المصادقة تحت `/home/node/.claude` و`/home/node/.claude.json`.
الحفاظ على `/home/node/.openclaw` فقط لا يكفي لإعادة استخدام Claude CLI. إذا
استخدمت `OPENCLAW_EXTRA_MOUNTS` بدلًا من مجلد المنزل، فركّب كل مسارات
Claude هذه داخل خدمتي Docker معًا.

<Note>
لأتمتة الإنتاج المشتركة أو الفوترة المتوقعة من Anthropic، فضّل مسار
مفتاح API الخاص بـ Anthropic. تتبع إعادة استخدام Claude CLI إصدار Claude Code المثبّت
وتسجيل الدخول إلى الحساب والفوترة وسلوك التحديث.
</Note>

### Bonjour / mDNS

عادةً لا تمرّر شبكة Docker الجسرية بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المضمّن القيمة الافتراضية
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد
تشغيل الإعلان مرارًا عندما تُسقط الشبكة الجسرية حركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway أو Tailscale أو DNS-SD واسع النطاق لمضيفي Docker.
اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل باستخدام شبكة المضيف أو macvlan
أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل عليها.

للملاحظات واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يركّب Docker Compose عبر bind mount كلًا من `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw`،
و`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` إلى `/home/node/.config/openclaw`، بحيث تبقى هذه
المسارات بعد استبدال الحاوية. عندما لا تُعيّن أي متغيرات، يعود
`docker-compose.yml` المضمّن إلى مسارات تحت `${HOME}`، أو إلى `/tmp` عندما يكون `HOME` نفسه
مفقودًا أيضًا. يمنع ذلك `docker compose up` من إصدار مواصفة مجلد ذات مصدر فارغ
في البيئات المجردة.

دليل الإعداد المركّب هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعداد السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة الخاصة بالموفر
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

يخزن دليل مفتاح سر ملف تعريف المصادقة مفتاح التشفير المحلي المستخدم لمواد رموز
ملف تعريف المصادقة المدعومة بـ OAuth. احتفظ به مع حالة مضيف Docker لديك،
لكن منفصلًا عن `OPENCLAW_CONFIG_DIR`.

تخزن plugins القابلة للتنزيل والمثبّتة حالة حزمها تحت منزل OpenClaw المركّب،
لذلك تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية.
لا ينشئ بدء تشغيل Gateway أشجار تبعيات bundled-plugin.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[وقت تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**مناطق نمو القرص الساخنة:** راقب `media/`، وملفات JSONL للجلسات، وقاعدة بيانات
حالة SQLite المشتركة، وجذور حزم Plugin المثبّتة، وسجلات الملفات الدوّارة
تحت `/tmp/openclaw/`.

### مساعدات الصدفة (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للاطلاع على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار مقبس مخصص (مثل Docker بدون جذر):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    يركّب السكربت `docker.sock` فقط بعد اجتياز متطلبات sandbox الأساسية. إذا
    تعذر إكمال إعداد sandbox، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`. تظل دورات وضع الكود في Codex مقيدة بـ Codex
    `workspace-write` أثناء نشاط sandbox في OpenClaw؛ لا تركّب مقبس Docker الخاص بالمضيف
    داخل حاويات sandbox الخاصة بالوكيل.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    عطّل تخصيص Compose للـ pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع ذلك كحد ثقة مشترك.
    يسقط إعداد compose القدرات `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    تفشل بعض إعدادات Docker Desktop في عمليات بحث DNS من حاوية
    `openclaw-cli` الجانبية ذات الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك على شكل
    `EAI_AGAIN` أثناء الأوامر المدعومة بـ npm مثل `openclaw plugins install`.
    احتفظ بملف compose الافتراضي المعزز للتشغيل العادي لـ Gateway. يخفف
    التجاوز المحلي أدناه وضع أمان حاوية CLI عبر
    استعادة قدرات Docker الافتراضية، لذا استخدمه فقط لأمر CLI لمرة واحدة
    يحتاج إلى الوصول إلى سجل الحزم، وليس كاستدعاء Compose الافتراضي لديك:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    إذا كنت قد أنشأت بالفعل حاوية `openclaw-cli` طويلة التشغيل، فأعد إنشاءها
    باستخدام التجاوز نفسه. لا يستطيع `docker compose exec` و`docker exec`
    تغيير قدرات Linux على حاوية أُنشئت بالفعل.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    تعمل الصورة كمستخدم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن bind mounts على المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    يمكن أن يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. يعني ذلك أن uid العملية ومالك
    دليل Plugin المركّب غير متطابقين. فضّل تشغيل الحاوية بالـ uid الافتراضي 1000
    وإصلاح ملكية bind mount. لا تستخدم chown على
    `/path/to/openclaw-config/npm` إلى `root:root` إلا إذا كنت تشغّل
    OpenClaw كجذر عمدًا على المدى الطويل.

  </Accordion>

  <Accordion title="Faster rebuilds">
    رتّب Dockerfile لديك بحيث تُخزّن طبقات التبعيات في الذاكرة المخبئية. يتجنب ذلك إعادة تشغيل
    `pnpm install` ما لم تتغير ملفات القفل:

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
    الصورة الافتراضية تضع الأمان أولا وتعمل بمستخدم `node` غير الجذر. للحصول على
    حاوية أكثر اكتمالا في الميزات:

    1. **استمرار `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **تضمين تبعيات Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **تضمين Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **أو تثبيت متصفحات Playwright في مجلد دائم**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **استمرار تنزيلات المتصفح**: استخدم `OPENCLAW_HOME_VOLUME` أو
       `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائيا Chromium المدار بواسطة Playwright
       في صورة Docker على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح URL في المتصفح. في
    Docker أو إعدادات بلا واجهة، انسخ URL إعادة التوجيه الكامل الذي تصل إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة Docker الرئيسية لوقت التشغيل `node:24-bookworm-slim` وتتضمن `tini` كعملية تهيئة لنقطة الدخول (PID 1) لضمان جمع العمليات الزومبي والتعامل مع الإشارات بشكل صحيح في الحاويات طويلة التشغيل. تنشر تعليقات توضيحية لصورة OCI الأساسية تشمل `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. يجري تحديث ملخص صورة Node الأساسية
    عبر PRs الخاصة بصورة Docker الأساسية من Dependabot؛ ولا تشغل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تشغله على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[Docker VM Runtime](/ar/install/docker-vm-runtime) للاطلاع على خطوات النشر المشتركة على VM
بما يشمل تضمين الثنائيات، والاستمرارية، والتحديثات.

## بيئة عزل الوكيل

عند تمكين `agents.defaults.sandbox` مع واجهة Docker الخلفية، يشغل Gateway
تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزا صلبا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway كله
داخل حاوية.

يمكن أن يكون نطاق بيئة العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركا. يحصل كل نطاق
على مساحة عمل خاصة به مثبتة في `/workspace`. يمكنك أيضا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على التكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل](/ar/gateway/sandboxing) -- مرجع العزل الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات العزل
- [بيئة عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### التمكين السريع

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

ابن صورة العزل الافتراضية (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية العزل لا تبدأ">
    ابن صورة العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدرية محلية) أو أمر `docker build` المضمن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو عيّن `agents.defaults.sandbox.docker.image` إلى صورتك المخصصة.
    تُنشأ الحاويات تلقائيا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في العزل">
    عيّن `docker.user` إلى UID:GID يطابق ملكية مساحة العمل المثبتة لديك،
    أو غيّر مالك مجلد مساحة العمل.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في العزل">
    يشغل OpenClaw الأوامر باستخدام `sh -lc` (صدفة تسجيل دخول)، ما يحمّل
    `/etc/profile` وقد يعيد تعيين PATH. عيّن `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في البداية، أو أضف سكربتا ضمن `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="إنهاء بسبب نفاد الذاكرة أثناء بناء الصورة (رمز الخروج 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة جهاز أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو يلزم الاقتران في Control UI">
    اجلب رابط لوحة معلومات جديدا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة المعلومات](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="هدف Gateway يعرض ws://172.x.x.x أو أخطاء اقتران من Docker CLI">
    أعد تعيين وضع Gateway والربط:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose من المجتمع
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

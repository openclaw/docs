---
read_when:
    - تريد Gateway مُشغَّلًا داخل حاوية بدلًا من التثبيتات المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة اختياريان يعتمدان على Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:44:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway معبأ في حاوية أو تريد التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة ومؤقتة، أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع دورة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة حول العزل**: يستخدم خلفية العزل الافتراضية Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب **تشغيل Gateway الكامل في Docker**. تتوفر أيضا خلفيات عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد ينهيه النظام بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز خروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغله على VPS/مضيف عام، فراجع
  [تقوية الأمان عند التعرض للشبكة](/ar/gateway/security)،
  خصوصا سياسة جدار حماية Docker `DOCKER-USER`.

## Gateway معبأ في حاوية

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

    تنشر الصور المبنية مسبقا أولا إلى
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR هو السجل الأساسي لأتمتة الإصدارات وعمليات النشر المثبتة
    وفحوصات المصدر. وينشر مسار الإصدار نفسه أيضا مرآة رسمية على
    Docker Hub باسم `openclaw/openclaw` للمضيفات التي تفضل Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    استخدم `ghcr.io/openclaw/openclaw` أو `openclaw/openclaw`. تجنب مرايا
    Docker Hub المجتمعية لأن OpenClaw لا يتحكم في توقيت إصدارها
    أو إعادة بنائها أو سياسة الاحتفاظ بها. الوسوم الرسمية الشائعة: `main` و`latest` و
    `<version>` (مثل `2026.2.26`) وإصدارات beta مثل
    `2026.2.26-beta.1`. لا تنقل وسوم beta الوسمين `latest` أو `main`.

  </Step>

  <Step title="إعادة التشغيل في بيئة معزولة عن الشبكة">
    على المضيفات غير المتصلة، انقل الصورة وحملها أولا:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    يتحقق `--offline` من أن `OPENCLAW_IMAGE` موجودة محليا بالفعل، ويعطل
    عمليات السحب والبناء الضمنية في Compose، ثم يشغل مسار الإعداد العادي مثل
    مزامنة `.env` وإصلاحات الأذونات والإعداد الأولي ومزامنة إعدادات Gateway
    وبدء تشغيل Compose.

    إذا كان `OPENCLAW_SANDBOX=1`، يتحقق الإعداد دون اتصال أيضا من صور العزل الافتراضية
    المضبوطة والنشطة لكل وكيل على الخادم خلف
    `OPENCLAW_DOCKER_SOCKET`. يجب أن تحمل صور المتصفح المدعومة من Docker أيضا
    تسمية عقد متصفح OpenClaw الحالية. عند فقدان صورة مطلوبة أو
    عدم توافقها، يخرج الإعداد دون تغيير تهيئة العزل بدلا من
    الإبلاغ عن نجاح مع عزل غير قابل للاستخدام.

  </Step>

  <Step title="إكمال الإعداد الأولي">
    يشغل سكربت الإعداد الإعداد الأولي تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API لموفر الخدمة
    - توليد رمز Gateway وكتابته إلى `.env`
    - إنشاء دليل مفتاح سر ملف تعريف المصادقة
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل كتابة الإعداد الأولي والتهيئة قبل بدء التشغيل عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    وجود حاوية Gateway بالفعل.

  </Step>

  <Step title="فتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في Settings. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت
    تهيئة الحاوية إلى مصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="تهيئة القنوات (اختياري)">
    استخدم حاوية CLI لإضافة قنوات المراسلة:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    الوثائق: [WhatsApp](/ar/channels/whatsapp), [Telegram](/ar/channels/telegram), [Discord](/ar/channels/discord)

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
أدرجه بعد أي ملف تجاوز قياسي، مثلا
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
عند وجود ملفي التجاوز معا.
</Note>

<Note>
نظرا لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة ما بعد بدء التشغيل. قبل `docker compose up -d openclaw-gateway`، شغل الإعداد الأولي
وكتابات التهيئة وقت الإعداد عبر `openclaw-gateway` مع
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية هذه:

| المتغير                                   | الغرض                                                               |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | تثبيت حزم Python إضافية أثناء البناء (مفصولة بمسافات)          |
| `OPENCLAW_EXTENSIONS`                      | تثبيت تبعيات Plugin مسبقا وقت البناء (أسماء مفصولة بمسافات) |
| `OPENCLAW_EXTRA_MOUNTS`                    | عمليات ربط إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                     | الاحتفاظ بـ `/home/node` في وحدة تخزين Docker مسماة                         |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة الإعداد الأولي التفاعلية (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (افتراضيا `1` لـ Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات ربط مصدر Plugin المضمنة                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP المشتركة لتصدير OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP الخاصة بالإشارات للتتبعات أو المقاييس أو السجلات           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يدعم اليوم إلا `http/protobuf`       |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية               |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء SDK ثان من OpenTelemetry عند تحميل واحد مسبقا        |

لا تشحن صورة Docker الرسمية Homebrew. أثناء الإعداد الأولي، يخفي OpenClaw
مثبتات تبعيات Skills المعتمدة على brew فقط عندما يعمل داخل حاوية Linux
دون `brew`؛ يجب توفير تلك التبعيات عبر صورة مخصصة
أو تثبيتها يدويا. للتبعيات المتاحة من حزم Debian، استخدم
`OPENCLAW_IMAGE_APT_PACKAGES` أثناء بناء الصورة. لا يزال الاسم القديم
`OPENCLAW_DOCKER_APT_PACKAGES` مقبولا.
لتبعيات Python، استخدم `OPENCLAW_IMAGE_PIP_PACKAGES`. يشغل هذا
`python3 -m pip install --break-system-packages` أثناء بناء الصورة، لذلك ثبت
إصدارات الحزم واستخدم فقط فهارس الحزم التي تثق بها.

يمكن للمشرفين اختبار مصدر Plugin المضمن مقابل صورة معبأة عن طريق تركيب
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، مثلا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المركب حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية المراقبة

تصدير OpenTelemetry صادر من حاوية Gateway إلى جامع OTLP لديك. لا يتطلب
منفذ Docker منشورا. إذا بنيت الصورة محليا وتريد أن يكون مصدر OpenTelemetry
المضمن متاحا داخل الصورة، فأدرج تبعيات وقت التشغيل الخاصة به:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر تستطيع
تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح بـ
Plugin `diagnostics-otel` وفعله في التهيئة، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال التهيئة في [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
تضبط رؤوس مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبت
`clawhub:@openclaw/diagnostics-prometheus`، وفعل
Plugin `diagnostics-prometheus`، ثم اجمع البيانات:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عاما منفصلا
أو مسار وكيل عكسي غير مصادق. راجع
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
- `loopback`: لا يمكن الوصول إلى Gateway مباشرة إلا للعمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مضيف بديلة مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### موفرو المضيف المحليون

عندما يعمل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهازك المضيف. استخدم `host.docker.internal` لموفري AI الذين
يعملون على المضيف:

| المزود  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المضمن عناوين URL الخاصة بالمضيف هذه كقيم افتراضية لإعداد
LM Studio وOllama، ويعيّن `docker-compose.yml` ‏`host.docker.internal` إلى
Gateway مضيف Docker لمحرك Docker Engine على Linux. يوفّر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضًا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصًا بك أو أمر `docker run`، فأضف تعيين المضيف نفسه
بنفسك، مثلًا:
`--add-host=host.docker.internal:host-gateway`.

### واجهة Claude CLI الخلفية في Docker

لا تثبّت صورة OpenClaw الرسمية لـ Docker ‏Claude Code مسبقًا. ثبّت
Claude Code وسجّل الدخول إليه داخل مستخدم الحاوية الذي يشغّل OpenClaw، ثم اجعل
مجلد المنزل لتلك الحاوية دائمًا حتى لا تمحو ترقيات الصورة الملف الثنائي أو حالة
مصادقة Claude.

لعمليات تثبيت Docker الجديدة، فعّل مجلدًا دائمًا لـ `/home/node` قبل تشغيل
الإعداد:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

بالنسبة إلى تثبيت Docker موجود، أوقف المكدس أولًا وأعد تحميل قيم Docker `.env`
الحالية قبل إعادة تشغيل الإعداد. لا يقرأ سكربت الإعداد `.env` من تلقاء نفسه؛ بل
يعيد كتابة `.env` من الصدفة الحالية والقيم الافتراضية. بالنسبة إلى `.env` الذي
تم توليده، شغّل:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

إذا كان ملف `.env` يحتوي على قيم لا تستطيع صدفتك تحميلها، فأعد تصدير القيم
الحالية التي تعتمد عليها يدويًا أولًا، مثل `OPENCLAW_IMAGE`، والمنافذ، ووضع
الربط، والمسارات المخصصة، و`OPENCLAW_EXTRA_MOUNTS`، وsandbox، وإعدادات تجاوز
الإعداد الأولي. يركّب التراكب المُولّد مجلد المنزل لكل من `openclaw-gateway` و
`openclaw-cli`.

شغّل الأوامر المتبقية باستخدام تراكب Compose المُولّد حتى تركّب الخدمتان مجلد
المنزل الدائم. إذا كان إعدادك يستخدم أيضًا `docker-compose.override.yml`، فأدرجه
قبل `docker-compose.extra.yml`.

ثبّت Claude Code في مجلد المنزل الدائم ذلك:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

يكتب المثبّت الأصلي الملف الثنائي `claude` تحت
`/home/node/.local/bin/claude`. أخبر OpenClaw باستخدام مسار الحاوية هذا:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

سجّل الدخول وتحقق من داخل مجلد منزل الحاوية الدائم نفسه:

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

بعد ذلك، يمكنك استخدام واجهة `claude-cli` الخلفية المضمنة:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

يجعل `OPENCLAW_HOME_VOLUME` تثبيت Claude Code الأصلي دائمًا تحت
`/home/node/.local/bin` و`/home/node/.local/share/claude`، إضافة إلى إعدادات
Claude Code وحالة المصادقة تحت `/home/node/.claude` و`/home/node/.claude.json`.
لا يكفي جعل `/home/node/.openclaw` وحده دائمًا لإعادة استخدام Claude CLI. إذا
كنت تستخدم `OPENCLAW_EXTRA_MOUNTS` بدلًا من مجلد المنزل، فاركب كل مسارات Claude
هذه في خدمتي Docker كلتيهما.

<Note>
لأتمتة الإنتاج المشتركة أو لفوترة Anthropic المتوقعة، فضّل مسار مفتاح API الخاص
بـ Anthropic. تتبع إعادة استخدام Claude CLI إصدار Claude Code المثبّت، وتسجيل
الدخول إلى الحساب، والفوترة، وسلوك التحديث.
</Note>

### Bonjour / mDNS

عادةً لا تمرّر شبكة جسر Docker بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بثبات. لذلك يضبط إعداد Compose المضمن افتراضيًا
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد تشغيل
الإعلان مرارًا عندما يسقط الجسر حركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway، أو Tailscale، أو DNS-SD واسع النطاق
لمضيفي Docker. اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة
المضيف، أو macvlan، أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل فيها.

للملاحظات المهمة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يركب Docker Compose ‏`OPENCLAW_CONFIG_DIR` ربطًا إلى `/home/node/.openclaw`،
و`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` إلى `/home/node/.config/openclaw`، لذلك تبقى
هذه المسارات بعد استبدال الحاوية. عندما لا يكون أي متغير مضبوطًا، يعود
`docker-compose.yml` المضمن إلى مسار تحت `${HOME}`، أو إلى `/tmp` عندما يكون
`HOME` نفسه مفقودًا أيضًا. هذا يمنع `docker compose up` من إصدار مواصفة مجلد
بمصدر فارغ في البيئات المجردة.

دليل الإعدادات المركّب هذا هو المكان الذي يحتفظ فيه OpenClaw بـ:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/مفتاح API المخزنة للمزود
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

يخزن دليل مفتاح سر ملف المصادقة المفتاح المحلي المستخدم لمادة رموز ملف المصادقة
المدعومة بـ OAuth. احتفظ به مع حالة مضيف Docker، لكن منفصلًا عن
`OPENCLAW_CONFIG_DIR`.

تخزن Plugins القابلة للتنزيل والمثبتة حالة حزمها تحت منزل OpenClaw المركّب، لذلك
تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية. لا يولّد بدء تشغيل
Gateway أشجار تبعيات Plugins المضمنة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[وقت تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص:** راقب `media/`، وملفات JSONL للجلسات، وقاعدة بيانات حالة
SQLite المشتركة، وجذور حزم Plugin المثبتة، وسجلات الملفات الدوّارة تحت
`/tmp/openclaw/`.

### مساعدات الصدفة (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا ثبّت ClawDock من مسار raw الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبّع ملف المساعد المحلي الموقع الجديد.

ثم استخدم `clawdock-start`، و`clawdock-stop`، و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

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

    يركّب السكربت `docker.sock` فقط بعد اجتياز متطلبات sandbox الأساسية. إذا لم
    يكتمل إعداد sandbox، يعيد السكربت ضبط `agents.defaults.sandbox.mode` إلى
    `off`. تظل أدوار وضع كود Codex مقيدة إلى Codex ‏`workspace-write` أثناء
    نشاط sandbox الخاص بـ OpenClaw؛ لا تركّب socket Docker للمضيف داخل حاويات
    sandbox الخاصة بالوكيل.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    يستخدم `openclaw-cli` ‏`network_mode: "service:openclaw-gateway"` حتى تتمكن
    أوامر CLI من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا كحد ثقة
    مشترك. يسقط إعداد compose ‏`NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    تفشل بعض إعدادات Docker Desktop في عمليات بحث DNS من الحاوية الجانبية
    `openclaw-cli` على الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك كـ
    `EAI_AGAIN` أثناء الأوامر المدعومة بـ npm مثل `openclaw plugins install`.
    احتفظ بملف compose الافتراضي المقوّى للتشغيل العادي لـ Gateway. يخفف
    التجاوز المحلي أدناه وضع أمان حاوية CLI عبر استعادة قدرات Docker الافتراضية،
    لذلك استخدمه فقط لأمر CLI لمرة واحدة يحتاج إلى الوصول إلى سجل الحزم، وليس
    كاستدعاء Compose الافتراضي لديك:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    إذا كنت قد أنشأت بالفعل حاوية `openclaw-cli` طويلة التشغيل، فأعد إنشاءها
    باستخدام التجاوز نفسه. لا يستطيع `docker compose exec` و`docker exec` تغيير
    قدرات Linux على حاوية تم إنشاؤها بالفعل.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    تعمل الصورة كمستخدم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن ربطات مضيفك المركّبة مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    قد يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. هذا يعني أن uid العملية ومالك دليل
    Plugin المركّب غير متفقين. فضّل تشغيل الحاوية كـ uid 1000 الافتراضي وإصلاح
    ملكية الربط المركّب. نفّذ chown فقط على `/path/to/openclaw-config/npm` إلى
    `root:root` إذا كنت تشغّل OpenClaw عمدًا كجذر على المدى الطويل.

  </Accordion>

  <Accordion title="Faster rebuilds">
    رتّب Dockerfile بحيث يتم تخزين طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
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

  <Accordion title="Power-user container options">
    الصورة الافتراضية تقدّم الأمان أولًا وتعمل كمستخدم `node` غير جذر. للحصول
    على حاوية أغنى بالميزات:

    1. **استمرارية `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **تضمين تبعيات Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **تضمين Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **أو تثبيت متصفحات Playwright في وحدة تخزين مستمرة**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **استمرارية تنزيلات المتصفح**: استخدم `OPENCLAW_HOME_VOLUME` أو
       `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائياً Chromium المُدار بواسطة
       Playwright في صورة Docker على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة رسومية)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح URL في المتصفح. في
    إعدادات Docker أو الإعدادات بلا واجهة رسومية، انسخ URL إعادة التوجيه الكامل الذي تصل إليه والصقه
    مرة أخرى في المعالج لإنهاء المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتتضمن `tini` بوصفه عملية التهيئة لنقطة الدخول (PID 1) لضمان تنظيف العمليات الزومبية ومعالجة الإشارات بشكل صحيح في الحاويات طويلة التشغيل. تنشر تعليقات OCI للصورة الأساسية بما في ذلك `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. يتم
    تحديث ملخص صورة Node الأساسية عبر PRs Dependabot لصورة Docker الأساسية؛ ولا تُشغّل إصدارات النشر
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صورة OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### التشغيل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[تشغيل Docker VM](/ar/install/docker-vm-runtime) لمعرفة خطوات النشر على VM مشتركة
بما في ذلك تضمين الثنائيات، والاستمرارية، والتحديثات.

## وضع حماية الوكيل

عند تفعيل `agents.defaults.sandbox` مع خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزاً صارماً
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بالكامل
داخل حاوية.

يمكن أن يكون نطاق وضع الحماية لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركاً. يحصل كل نطاق
على مساحة عمل خاصة به مثبتة عند `/workspace`. يمكنك أيضاً تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على التكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [وضع الحماية](/ar/gateway/sandboxing) -- مرجع وضع الحماية الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات وضع الحماية
- [وضع حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### التفعيل السريع

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

ابنِ صورة وضع الحماية الافتراضية (من نسخة مصدرية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدرية، راجع [وضع الحماية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للحصول على أوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية وضع الحماية لا تبدأ">
    ابنِ صورة وضع الحماية باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدرية) أو أمر `docker build` المضمن من [وضع الحماية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائياً لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في وضع الحماية">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المثبتة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في وضع الحماية">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، والذي يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في البداية، أو أضف سكربتاً ضمن `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="انتهى بناء الصورة بقتل OOM (الخروج 137)">
    تحتاج VM إلى 2 GB من RAM على الأقل. استخدم فئة آلة أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو يلزم الاقتران في Control UI">
    اجلب رابط لوحة معلومات جديداً ووافق على جهاز المتصفح:

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
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدّثاً
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

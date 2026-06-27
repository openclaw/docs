---
read_when:
    - تريد Gateway يعمل داخل حاوية بدلًا من التثبيتات المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة اختيارية قائمة على Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:50:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway ضمن حاوية أو تريد التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة ومؤقتة، أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: أنت تشغل OpenClaw على جهازك وتريد فقط أسرع حلقة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة عن العزل**: يستخدم خلفية العزل الافتراضية Docker عند تمكين العزل، لكن العزل معطل افتراضيا ولا يتطلب تشغيل Gateway بالكامل في Docker. تتوفر أيضا خلفيات عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يقتل بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز خروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغل على VPS/مضيف عام، فراجع
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

  <Step title="Airgapped rerun">
    على المضيفات غير المتصلة، انقل الصورة وحملها أولا:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    يتحقق `--offline` من أن `OPENCLAW_IMAGE` موجودة محليا بالفعل، ويعطل
    عمليات السحب والبناء الضمنية في Compose، ثم يشغل مسار الإعداد العادي مثل
    مزامنة `.env`، وإصلاحات الأذونات، والتهيئة الأولية، ومزامنة إعدادات Gateway،
    وبدء تشغيل Compose.

    إذا كان `OPENCLAW_SANDBOX=1`، يتحقق الإعداد دون اتصال أيضا من صور العزل
    الافتراضية المهيأة والنشطة لكل وكيل على daemon خلف
    `OPENCLAW_DOCKER_SOCKET`. يجب أن تحمل صور المتصفح المدعومة من Docker أيضا
    وسم عقد متصفح OpenClaw الحالي. عند فقدان صورة مطلوبة أو عدم توافقها،
    يخرج الإعداد من دون تغيير إعدادات العزل بدلا من الإبلاغ عن نجاح مع عزل غير قابل للاستخدام.

  </Step>

  <Step title="Complete onboarding">
    يشغل سكربت الإعداد التهيئة الأولية تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API للمزود
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - إنشاء دليل مفتاح سر ملف تعريف المصادقة
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولية قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    وجود حاوية Gateway بالفعل.

  </Step>

  <Step title="Open the Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المهيأ
    في Settings. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعدادات
    الحاوية إلى مصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلا من ذلك.

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
لأن `openclaw-cli` يشارك مساحة أسماء شبكة `openclaw-gateway`، فهو أداة
ما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل التهيئة الأولية
وكتابات الإعدادات وقت الإعداد عبر `openclaw-gateway` باستخدام
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
| `OPENCLAW_EXTRA_MOUNTS`                    | ربطات تحميل إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                     | الاحتفاظ بـ `/home/node` في وحدة تخزين Docker مسماة                         |
| `OPENCLAW_SANDBOX`                         | تفعيل تمهيد العزل اختياريا (`1`، `true`، `yes`، `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (افتراضيا `1` في Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات تحميل ربط مصدر Plugin المضمن                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. يدعم حاليا `http/protobuf` فقط       |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية               |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء OpenTelemetry SDK ثان عند تحميل واحد مسبقا        |

لا تتضمن صورة Docker الرسمية Homebrew. أثناء التهيئة الأولية، يخفي OpenClaw
مثبتات تبعيات Skills المعتمدة على brew فقط عندما يعمل في حاوية Linux
من دون `brew`؛ يجب توفير تلك التبعيات عبر صورة مخصصة أو تثبيتها يدويا.
للتبعيات المتاحة من حزم Debian، استخدم
`OPENCLAW_IMAGE_APT_PACKAGES` أثناء بناء الصورة. لا يزال اسم
`OPENCLAW_DOCKER_APT_PACKAGES` القديم مقبولا.
لتبعيات Python، استخدم `OPENCLAW_IMAGE_PIP_PACKAGES`. يشغل هذا
`python3 -m pip install --break-system-packages` أثناء بناء الصورة، لذلك ثبت
إصدارات الحزم واستخدم فقط فهارس الحزم التي تثق بها.

يمكن للمشرفين اختبار مصدر Plugin المضمن مقابل صورة معلبة بتحميل
دليل مصدر Plugin واحد فوق مسار مصدره المعلب، مثلا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمل ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية الملاحظة

تصدير OpenTelemetry صادر من حاوية Gateway إلى جامع OTLP لديك.
لا يتطلب منفذ Docker منشورا. إذا بنيت الصورة محليا وتريد أن يكون مصدر
OpenTelemetry المضمن متاحا داخل الصورة، فأدرج تبعيات وقت التشغيل الخاصة به:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعلبة قبل تمكين التصدير. لا تزال الصور المخصصة المبنية من المصدر قادرة
على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتمكين التصدير، اسمح بـ Plugin
`diagnostics-otel` وفعله في الإعدادات، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال الإعدادات في [تصدير OpenTelemetry](/ar/gateway/opentelemetry).
تضبط رؤوس مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبت
`clawhub:@openclaw/diagnostics-prometheus`، وفعل Plugin
`diagnostics-prometheus`، ثم اجمع المقاييس من:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عاما منفصلا
أو مسار وكيل عكسي غير مصادق. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوص الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker فحص `HEALTHCHECK` مدمجا يطلب `/healthz`.
إذا استمرت الفحوص في الفشل، يضع Docker علامة `unhealthy` على الحاوية ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` افتراضيا `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن إلا للعمليات داخل مساحة أسماء شبكة الحاوية الوصول إلى
  Gateway مباشرة.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### مزودو المضيف المحليون

عند تشغيل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهازك المضيف. استخدم `host.docker.internal` لمزودي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزود  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المضمن عناوين URL تلك للمضيف كافتراضات التهيئة الأولية
لـ LM Studio وOllama، ويربط `docker-compose.yml` الاسم `host.docker.internal`
بـ Gateway مضيف Docker لمحرك Docker Engine على Linux. يوفر Docker Desktop
اسم المضيف نفسه بالفعل على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصًا بك أو أمر `docker run`، فأضف تعيين المضيف نفسه
بنفسك، على سبيل المثال
`--add-host=host.docker.internal:host-gateway`.

### واجهة Claude CLI الخلفية في Docker

لا تأتي صورة OpenClaw Docker الرسمية مثبتًا فيها Claude Code مسبقًا. ثبّت
وسجّل الدخول إلى Claude Code داخل مستخدم الحاوية الذي يشغّل OpenClaw، ثم اجعل
منزل تلك الحاوية دائمًا حتى لا تمحو ترقيات الصورة الملف التنفيذي أو حالة مصادقة Claude.

لعمليات تثبيت Docker الجديدة، فعّل وحدة تخزين دائمة لـ `/home/node` قبل تشغيل
الإعداد:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

لتثبيت Docker موجود، أوقف المكدس أولًا وأعد تحميل قيم Docker `.env` الحالية
قبل إعادة تشغيل الإعداد. لا يقرأ سكربت الإعداد `.env` من تلقاء نفسه؛ بل يعيد
كتابة `.env` من الصدفة الحالية والقيم الافتراضية. بالنسبة إلى `.env` المولّد، شغّل:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

إذا كان ملف `.env` لديك يحتوي قيمًا لا تستطيع الصدفة تحميلها كمصدر، فأعد تصدير
القيم الحالية التي تعتمد عليها يدويًا أولًا، مثل `OPENCLAW_IMAGE`، والمنافذ،
ووضع الربط، والمسارات المخصصة، و`OPENCLAW_EXTRA_MOUNTS`، وبيئة العزل، وإعدادات
تخطي التهيئة. يركّب التراكب المولّد وحدة تخزين المنزل لكل من `openclaw-gateway`
و`openclaw-cli`.

شغّل الأوامر المتبقية باستخدام تراكب Compose المولّد حتى يركّب كلا الخدمتين
المنزل الدائم. إذا كان إعدادك يستخدم أيضًا `docker-compose.override.yml`، فأدرجه
قبل `docker-compose.extra.yml`.

ثبّت Claude Code في ذلك المنزل الدائم:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

يكتب المثبّت الأصلي الملف التنفيذي `claude` تحت
`/home/node/.local/bin/claude`. أخبر OpenClaw باستخدام مسار الحاوية هذا:

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

بعد ذلك، يمكنك استخدام واجهة `claude-cli` الخلفية المضمّنة:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

يجعل `OPENCLAW_HOME_VOLUME` تثبيت Claude Code الأصلي دائمًا تحت
`/home/node/.local/bin` و`/home/node/.local/share/claude`، إضافةً إلى إعدادات
Claude Code وحالة المصادقة تحت `/home/node/.claude` و`/home/node/.claude.json`.
جعل `/home/node/.openclaw` وحده دائمًا لا يكفي لإعادة استخدام Claude CLI. إذا
كنت تستخدم `OPENCLAW_EXTRA_MOUNTS` بدلًا من وحدة تخزين المنزل، فاربط كل مسارات
Claude هذه داخل خدمتي Docker كلتيهما.

<Note>
لأتمتة إنتاجية مشتركة أو فوترة Anthropic قابلة للتنبؤ، فضّل مسار مفتاح API
لـ Anthropic. إعادة استخدام Claude CLI تتبع إصدار Claude Code المثبّت، وتسجيل
دخول الحساب، والفوترة، وسلوك التحديث.
</Note>

### Bonjour / mDNS

لا تمرر شبكات جسر Docker عادةً بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المضمّن القيمة
الافتراضية `OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو
يعيد تشغيل الإعلان مرارًا عندما يسقط الجسر حركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway أو Tailscale أو DNS-SD واسع النطاق لمضيفات
Docker. اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة المضيف، أو
macvlan، أو شبكة أخرى معروف أن بث mDNS المتعدد يعمل فيها.

للملاحظات والمشكلات الشائعة واستكشاف الأخطاء، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose ‏`OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw`،
و`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` إلى `/home/node/.config/openclaw`، بحيث تبقى
هذه المسارات بعد استبدال الحاوية. عندما لا يتم ضبط أي متغير، يعود
`docker-compose.yml` المضمّن إلى مسارات تحت `${HOME}`، أو `/tmp` عندما يكون
`HOME` نفسه مفقودًا أيضًا. يمنع ذلك `docker compose up` من إصدار مواصفة وحدة
تخزين بمصدر فارغ في البيئات المجردة.

دليل الإعدادات المركّب هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة للمزوّد
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

يخزّن دليل مفتاح سر ملفات تعريف المصادقة مفتاح التشفير المحلي المستخدم لمادة
رموز ملفات تعريف المصادقة المدعومة بـ OAuth. احتفظ به مع حالة مضيف Docker
لديك، لكن منفصلًا عن `OPENCLAW_CONFIG_DIR`.

تخزّن Plugins القابلة للتنزيل والمثبتة حالة حزمتها تحت منزل OpenClaw المركّب،
لذلك تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية. لا يولّد بدء
تشغيل Gateway أشجار اعتماد لـ Plugin المضمّنة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر الآلات الافتراضية، راجع
[وقت تشغيل آلة Docker الافتراضية - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص:** راقب `media/`، وملفات JSONL للجلسات، وقاعدة بيانات حالة
SQLite المشتركة، وجذور حزم Plugins المثبتة، وسجلات الملفات الدوّارة تحت
`/tmp/openclaw/`.

### مساعدات الصدفة (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start`، و`clawdock-stop`، و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار مقبس مخصص (مثل Docker بلا جذر):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يركّب السكربت `docker.sock` إلا بعد نجاح متطلبات بيئة العزل. إذا تعذر
    إكمال إعداد بيئة العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`. تظل أدوار وضع كود Codex مقيدة بـ Codex
    `workspace-write` أثناء نشاط بيئة عزل OpenClaw؛ لا تربط مقبس Docker الخاص
    بالمضيف داخل حاويات بيئة عزل الوكيل.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    عطّل تخصيص Compose لـ pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    يستخدم `openclaw-cli` ‏`network_mode: "service:openclaw-gateway"` حتى تتمكن
    أوامر CLI من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا باعتباره حدًا
    مشتركًا للثقة. يسقط إعداد Compose ‏`NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    تفشل بعض إعدادات Docker Desktop في عمليات بحث DNS من حاوية
    `openclaw-cli` الجانبية ذات الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك
    كـ `EAI_AGAIN` أثناء الأوامر المدعومة بـ npm مثل `openclaw plugins install`.
    احتفظ بملف Compose المقوّى الافتراضي للتشغيل الطبيعي لـ Gateway. يخفف
    التراكب المحلي أدناه وضع أمان حاوية CLI من خلال استعادة قدرات Docker
    الافتراضية، لذلك استخدمه فقط لأمر CLI لمرة واحدة يحتاج إلى الوصول إلى سجل
    الحزم، وليس كاستدعاء Compose الافتراضي لديك:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    إذا كنت قد أنشأت بالفعل حاوية `openclaw-cli` طويلة التشغيل، فأعد إنشاءها
    باستخدام التراكب نفسه. لا يستطيع `docker compose exec` و`docker exec`
    تغيير قدرات Linux على حاوية تم إنشاؤها بالفعل.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    تعمل الصورة كمستخدم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن ربطات المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    يمكن أن يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. هذا يعني أن uid العملية ومالك دليل
    Plugin المركّب غير متفقين. فضّل تشغيل الحاوية بالـ uid الافتراضي 1000
    وإصلاح ملكية الربط. لا تنفذ chown لـ `/path/to/openclaw-config/npm` إلى
    `root:root` إلا إذا كنت تشغّل OpenClaw عمدًا كجذر على المدى الطويل.

  </Accordion>

  <Accordion title="Faster rebuilds">
    رتّب Dockerfile بحيث تُخزّن طبقات الاعتماد مؤقتًا. يتجنب هذا إعادة تشغيل
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
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم غير جذري `node`. للحصول
    على حاوية أكثر اكتمالًا:

    1. **اجعل `/home/node` دائمًا**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ادمج اعتماديات النظام**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **ادمج اعتماديات Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **ادمج Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **أو ثبّت متصفحات Playwright في وحدة تخزين دائمة**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **اجعل تنزيلات المتصفح دائمة**: استخدم `OPENCLAW_HOME_VOLUME` أو
       `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائيًا Chromium المدار بواسطة
       Playwright في صورة Docker على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    إعدادات Docker أو الإعدادات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه
    الذي تصل إليه والصقه مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتتضمن `tini` كعملية تهيئة لنقطة الدخول (PID 1) لضمان جمع العمليات الزومبي ومعالجة الإشارات بشكل صحيح في الحاويات طويلة التشغيل. وتنشر تعليقات توضيحية لصورة OCI الأساسية تشمل `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يُحدَّث ملخص أساس Node
    عبر PRs صور Docker الأساسية من Dependabot؛ ولا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### التشغيل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[تشغيل Docker VM](/ar/install/docker-vm-runtime) لخطوات النشر المشتركة على VM
بما في ذلك تضمين الثنائيات، والاستمرارية، والتحديثات.

## صندوق عزل الوكيل

عند تفعيل `agents.defaults.sandbox` مع خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (الصدفة، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا جدارًا صلبًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بالكامل
داخل حاوية.

يمكن أن يكون نطاق صندوق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مثبتة عند `/workspace`. يمكنك أيضًا ضبط
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على الإعداد الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل](/ar/gateway/sandboxing) -- مرجع صندوق العزل الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول تفاعلي عبر الصدفة إلى حاويات صندوق العزل
- [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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

ابنِ صورة صندوق العزل الافتراضية (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدر محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية صندوق العزل لا تبدأ">
    ابنِ صورة صندوق العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدر محلية) أو أمر `docker build` المضمن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو عيّن `agents.defaults.sandbox.docker.image` إلى صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في صندوق العزل">
    عيّن `docker.user` إلى UID:GID يطابق ملكية مساحة العمل المثبتة لديك،
    أو غيّر مالك مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في صندوق العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (صدفة تسجيل دخول)، والتي تقرأ
    `/etc/profile` وقد تعيد ضبط PATH. عيّن `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في البداية، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="إنهاء بسبب نفاد الذاكرة أثناء بناء الصورة (رمز الخروج 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة جهاز أكبر ثم أعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو يلزم الاقتران في واجهة Control UI">
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

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose من المجتمع
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدّثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

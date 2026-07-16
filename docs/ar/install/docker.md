---
read_when:
    - تريد Gateway يعمل داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة أولية اختيارية لـ OpenClaw باستخدام Docker
title: Docker
x-i18n:
    generated_at: "2026-07-16T14:12:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه لبيئة Gateway معزولة وقابلة للتخلص منها، أو على مضيف بلا عمليات تثبيت محلية. إذا كنت تطوّر بالفعل على جهازك، فاستخدم مسار التثبيت المعتاد بدلًا من ذلك.

تستخدم الواجهة الخلفية الافتراضية للعزل Docker عند تمكين `agents.defaults.sandbox`، لكن العزل معطّل افتراضيًا ولا يتطلب تشغيل Gateway نفسه داخل Docker. تتوفر أيضًا واجهات خلفية للعزل عبر SSH وOpenShell؛ راجع [العزل](/ar/gateway/sandboxing).

هل تستضيف عدة مستخدمين؟ راجع [الاستضافة متعددة المستأجرين](/ar/gateway/multi-tenant-hosting) للاطلاع على نموذج خلية واحدة لكل مستأجر.

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM بسعة 2 GB على الأقل لبناء الصورة (قد تُنهى `pnpm install` بسبب نفاد الذاكرة على مضيفين بسعة 1 GB مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- على VPS/مضيف عام، راجع [تعزيز الأمان عند التعرض للشبكة](/ar/gateway/security)، ولا سيما سلسلة جدار الحماية `DOCKER-USER` في Docker

## Gateway داخل حاوية

<Steps>
  <Step title="بناء الصورة">
    من جذر المستودع:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة Gateway محليًا باسم `openclaw:local`. لاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا أولًا في [سجل حاويات GitHub](https://github.com/openclaw/openclaw/pkgs/container/openclaw). يُعد GHCR السجل الأساسي لأتمتة الإصدارات وعمليات النشر المثبتة وفحوصات المنشأ. ينشر الإصدار نفسه نسخة مطابقة على Docker Hub في `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    استخدم `ghcr.io/openclaw/openclaw` أو `openclaw/openclaw` وتجنب النسخ المطابقة غير الرسمية، لأنها لا تتبع توقيت إصدارات OpenClaw أو سياسة الاحتفاظ الخاصة به. الوسوم الرسمية: `main` و`latest` و`<version>` (مثل `2026.2.26`)، ووسوم الإصدار التجريبي مثل `2026.2.26-beta.1` (لا تنقل الإصدارات التجريبية مطلقًا `latest`/`main`). تتضمن صورة `main`/`latest`/`<version>` الافتراضية ملحقي `codex` و`diagnostics-otel`. ويتوفر أيضًا متغير `-browser` (مثل `latest-browser`) مع Chromium مضمّنًا، وهو مفيد لأداة [المتصفح المعزول](/ar/gateway/sandboxing#sandboxed-browser) من دون تثبيت Playwright عند التشغيل الأول.

  </Step>

  <Step title="إعادة التشغيل في بيئة معزولة عن الشبكة">
    على المضيفين غير المتصلين، انقل الصورة وحمّلها أولًا:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    يتحقق `--offline` من أن `OPENCLAW_IMAGE` موجودة محليًا بالفعل، ويعطّل عمليات السحب/البناء الضمنية في Compose، ثم يشغّل المسار المعتاد: مزامنة `.env`، وإصلاحات الأذونات، والتهيئة الأولية، ومزامنة إعدادات Gateway، وبدء Compose.

    إذا كانت `OPENCLAW_SANDBOX=1`، فإن الإعداد دون اتصال يتحقق أيضًا من صور العزل الافتراضية والمحددة لكل وكيل على البرنامج الخفي خلف `OPENCLAW_DOCKER_SOCKET`، بما في ذلك تسمية عقد المتصفح على صور المتصفح المدعومة بـ Docker. إذا كانت صورة مطلوبة مفقودة أو قديمة، يخرج الإعداد دون تغيير إعدادات العزل بدلًا من الإبلاغ عن نجاح زائف.

  </Step>

  <Step title="إكمال التهيئة الأولية">
    يشغّل برنامج الإعداد النصي التهيئة الأولية تلقائيًا:

    - يطلب مفاتيح API الخاصة بالموفّر
    - ينشئ رمز Gateway مميزًا ويكتبه في `.env`
    - ينشئ دليل المفتاح السري لملف تعريف المصادقة
    - يشغّل Gateway عبر Docker Compose

    تُنفّذ التهيئة الأولية وكتابات الإعدادات السابقة للتشغيل عبر `openclaw-gateway` مباشرةً (باستخدام `--no-deps --entrypoint node`)، لأن `openclaw-cli` تشترك في مساحة أسماء شبكة Gateway ولا تعمل إلا بعد وجود حاوية Gateway.

  </Step>

  <Step title="فتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` والصق الرمز المميز المكتوب في `.env` ضمن Settings. إذا بدّلت الحاوية إلى المصادقة بكلمة مرور، فاستخدم كلمة المرور تلك بدلًا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="إعداد القنوات (اختياري)">
    ```bash
    # WhatsApp (رمز QR)
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

يستبعد سياق Docker العنصر `.git`. مرّر هوية المصدر كوسيطات بناء
كما هو موضح أعلاه، لكي تعرض شاشة «حول» في الصورة الالتزام المسحوب
وطابعًا زمنيًا واحدًا للبناء. يحل `scripts/docker/setup.sh` القيمتين ويمررهما
تلقائيًا.

<Note>
شغّل `docker compose` من جذر المستودع. إذا مكّنت `OPENCLAW_EXTRA_MOUNTS` أو `OPENCLAW_HOME_VOLUME`، يكتب برنامج الإعداد النصي `docker-compose.extra.yml`؛ أدرجه بعد أي `docker-compose.override.yml` تديره بنفسك، مثل `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### ترقية صور الحاويات

عندما تستبدل صورة OpenClaw مع الاحتفاظ بالحالة/الإعدادات الموصولة نفسها، يشغّل
Gateway الجديد ترحيلات ترقية آمنة عند بدء التشغيل وتقارب Plugin قبل
الجاهزية. ينبغي ألا تتطلب ترقيات الصور الروتينية تنفيذًا منفصلًا
لـ `openclaw doctor --fix`.

إذا تعذر على بدء التشغيل إكمال هذه الإصلاحات بأمان، يخرج Gateway بدلًا من
الإبلاغ بأنه سليم. مع وجود سياسة إعادة تشغيل، قد تعرض Docker أو Podman أو Kubernetes
حاوية Gateway وهي تعيد التشغيل. احتفظ بوحدة تخزين الحالة الموصولة، ثم شغّل
الصورة نفسها مرة واحدة باستخدام `openclaw doctor --fix` كأمر للحاوية، مع استخدام
عمليات وصل الحالة/الإعدادات نفسها التي يستخدمها Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

بعد انتهاء أداة doctor، أعد تشغيل حاوية Gateway باستخدام أمرها الافتراضي.
في Kubernetes، شغّل الأمر نفسه ضمن Job لمرة واحدة أو حجرة تصحيح أخطاء موصولة
بوحدة PVC نفسها، ثم أعد تشغيل Deployment أو StatefulSet.

### متغيرات البيئة

المتغيرات الاختيارية التي تقبلها `scripts/docker/setup.sh` (وكذلك `docker-compose.yml` مباشرةً بالنسبة إلى حاوية Gateway):

| المتغير                                        | الغرض                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | استخدام صورة بعيدة بدلًا من بنائها محليًا                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات). الاسم البديل القديم: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | تثبيت حزم Python إضافية أثناء البناء (مفصولة بمسافات)                                                      |
| `OPENCLAW_EXTENSIONS`                           | تجميع/تحزيم Plugins المحددة والمدعومة وتثبيت اعتماديات وقت التشغيل الخاصة بها (معرّفات مفصولة بفواصل أو مسافات) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | تجاوز خيارات Node لبناء المصدر المحلي (القيمة الافتراضية `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | تجاوز كومة tsdown لبناء المصدر المحلي بوحدة MB                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | تخطي إخراج التصريحات أثناء بناء الصور المحلية المخصصة لوقت التشغيل فقط (القيمة الافتراضية `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | تضمين Chromium + Xvfb في الصورة وقت البناء                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | عمليات وصل ربط إضافية للمضيف (`source:target[:opts]` مفصولة بفواصل)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | الاحتفاظ بـ `/home/node` في وحدة تخزين Docker مسماة                                                                     |
| `OPENCLAW_SANDBOX`                              | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | تجاوز مسار مقبس Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | فرض تشغيل إعلان Bonjour/mDNS (`0`) أو إيقافه (`1`)؛ راجع [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | تعطيل تراكبات وصل ربط مصدر Plugin المضمّنة                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | نقاط نهاية OTLP الخاصة بكل إشارة للتتبعات أو المقاييس أو السجلات                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | تجاوز بروتوكول OTLP. لا يُدعم حاليًا سوى `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | اسم الخدمة المستخدم لموارد OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | الاشتراك في أحدث السمات الدلالية التجريبية لـ GenAI                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | تخطي تشغيل SDK ثانٍ لـ OpenTelemetry عند تحميل أحدها مسبقًا                                                    |

لا تتضمن الصورة الرسمية Homebrew. أثناء التهيئة الأولية، يخفي OpenClaw مثبّتات اعتماديات Skills التي تعمل عبر brew فقط داخل حاوية Linux لا تحتوي على `brew`؛ وفّر تلك الاعتماديات من خلال صورة مخصصة أو ثبّتها يدويًا. استخدم `OPENCLAW_IMAGE_APT_PACKAGES` للاعتماديات المحزّمة لـ Debian و`OPENCLAW_IMAGE_PIP_PACKAGES` لاعتماديات Python (يشغّل `python3 -m pip install --break-system-packages` وقت البناء، لذا ثبّت الإصدارات واستخدم الفهارس التي تثق بها فقط).

إذا أبلغ Docker عن `ResourceExhausted` أو `cannot allocate memory`، أو أوقف العملية أثناء `tsdown`، فارفع حد ذاكرة أداة بناء Docker أو أعد المحاولة باستخدام أكوام صريحة أصغر:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### الصور المبنية من المصدر مع Plugins محددة

`OPENCLAW_EXTENSIONS` يحدّد معرّفات بيانات تعريف Plugins من نسخة المصدر؛
كما تُقبل أسماء أدلة المصدر الحالية عندما تختلف. يحوّل بناء Docker
التحديد إلى أدلة مصدر مرة واحدة، ويثبّت تبعيات الإنتاج،
وعندما يُنشر Plugin محدد بصورة منفصلة باستخدام
`openclaw.build.bundledDist: false`، يترجم وقت تشغيله إلى حزمة
dist الجذرية المضمّنة. لا تغيّر هذه الحزمة الخاصة بـ Docker عقد عناصر npm أو ClawHub
الخاصة بالـ Plugin. تؤدي المعرّفات المجهولة أو غير الصالحة أو الملتبسة إلى فشل بناء الصورة.
تحتفظ معرّفات التبعيات/المصدر فقط المعروفة بتجهيز المصدر والتبعيات الحالي
من دون الحصول على مُدخل dist جذري مترجم. يجب أن ينجح تجميع Plugin محدد
ذي مُدخلات بناء موحّدة؛ وتُزال مخرجات المصدر ووقت التشغيل الخاصة بـ Plugins
الخارجية غير المحددة.

على سبيل المثال، تنشئ هذه الأوامر صور Gateway مستقلة ومنفصلة ومتعددة البنى
لـ FakeCo من أجل ClickClack وSlack وMicrosoft Teams. يشكّل ClawRouter
بالفعل جزءًا من وقت تشغيل OpenClaw الجذري، لذا تحدد صورة ClickClack فقط
`clickclack`. تُبقي وسيطة المتصفح الفارغة الصريحة الصورة الافتراضية خالية
من Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

استخدم `--platform linux/arm64 --load` أو `--platform linux/amd64 --load` لإجراء
بناء محلي أصلي لمنصة واحدة. تتطلب المخرجات متعددة المنصات وSBOM/إثبات المنشأ
المرفق سجلًا أو مخرج Buildx آخر يحافظ على الإقرارات. بعد
الدفع، افحص بيان الصورة وانشر الملخص الثابت بدلًا من وسم
SHA المصدر القابل للتغيير:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# النشر: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

هذه الصور مخصصة لبوابات مستقلة قائمة على OCI ولمستخدمي Docker العموميين.
لا تستخدمها البوابات التي يديرها Crabhelm: إذ ينشئ مسار التسليم هذا
أرشيف جهاز x86_64 منفصلًا يحتوي على حزمة OpenClaw من npm ويثبّت
ملخصات Node والأرشيف والبيان. أنشئ ذلك الجهاز بصورة مستقلة
من مصدر OpenClaw المدمج نفسه.

لاختبار مصدر Plugin مضمّن مقابل صورة محزّمة، ثبّت دليل مصدر Plugin واحدًا فوق مسار مصدره المحزّم، مثل `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. يتجاوز ذلك حزمة `/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرّف Plugin نفسه.

### قابلية الرصد

يكون تصدير OpenTelemetry صادرًا من حاوية Gateway إلى جامع OTLP لديك؛ ولا يحتاج إلى منفذ Docker منشور. لتضمين المُصدّر المضمّن في صورة منشأة محليًا:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

تضمّن الصور الرسمية المنشأة مسبقًا `diagnostics-otel` بالفعل؛ ثبّت `clawhub:@openclaw/diagnostics-otel` بنفسك فقط إذا أزلته. لتمكين التصدير، اسمح بالـ Plugin ‏`diagnostics-otel` وفعّله في الإعدادات، ثم عيّن `diagnostics.otel.enabled=true` (راجع المثال الكامل في [تصدير OpenTelemetry](/ar/gateway/opentelemetry)). تمر ترويسات مصادقة الجامع عبر `diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تعيد مقاييس Prometheus استخدام منفذ Gateway المنشور بالفعل. ثبّت `clawhub:@openclaw/diagnostics-prometheus`، وفعّل Plugin ‏`diagnostics-prometheus`، ثم نفّذ الاستخلاص:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway؛ لا تعرض منفذ `/metrics` عامًا منفصلًا أو مسار وكيل عكسي بلا مصادقة. راجع [مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات السلامة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # فحص الحياة
curl -fsS http://127.0.0.1:18789/readyz     # فحص الجاهزية
```

يرسل `HEALTHCHECK` المضمّن في الصورة طلب فحص إلى `/healthz`؛ وتضع حالات الفشل المتكررة علامة `unhealthy` على الحاوية لكي تتمكن أنظمة التنسيق من إعادة تشغيلها أو استبدالها.

لقطة سلامة عميقة موثّقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### الشبكة المحلية مقابل الاسترجاع الحلقي

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` لكي يعمل `http://127.0.0.1:18789` على المضيف مع نشر منفذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن الوصول مباشرةً إلى Gateway إلا من العمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` ‏(`lan` / `loopback` / `custom` / `tailnet` / `auto`)، وليس أسماء المضيف البديلة مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### المزوّدون المحليون على المضيف

داخل الحاوية، يشير `127.0.0.1` إلى الحاوية نفسها، لا إلى المضيف. استخدم `host.docker.internal` للمزوّدين العاملين على المضيف:

| المزوّد  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم الإعداد المضمّن عناوين URL هذه كقيم افتراضية لإعداد LM Studio/Ollama، ويربط `docker-compose.yml` ‏`host.docker.internal` ببوابة المضيف على Docker Engine في Linux (يوفّر Docker Desktop الاسم البديل نفسه على macOS/Windows). يجب أن تستمع خدمات المضيف على عنوان يستطيع Docker الوصول إليه:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

هل تستخدم ملف Compose خاصًا بك أو `docker run`؟ أضف الربط نفسه بنفسك، مثل `--add-host=host.docker.internal:host-gateway`.

### الواجهة الخلفية لـ Claude CLI في Docker

لا تثبّت الصورة الرسمية Claude Code مسبقًا. ثبّته وسجّل الدخول داخل مستخدم الحاوية `node`، ثم اجعل مجلد الحاوية الرئيسي دائمًا كي لا تمحو ترقيات الصورة الملف التنفيذي أو حالة المصادقة.

لتثبيت جديد، فعّل وحدة تخزين `/home/node` دائمة قبل تشغيل الإعداد:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

بالنسبة إلى تثبيت قائم، أوقف المكدس وأعد تحميل قيم `.env` الحالية أولًا — يعيد برنامج الإعداد النصي دائمًا كتابة `.env` من الصدفة الحالية والقيم الافتراضية، ولا يقرأ الملف من تلقاء نفسه:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

إذا احتوى `.env` على قيم لا تستطيع الصدفة تحميلها، فأعد تصدير ما تعتمد عليه يدويًا أولًا (`OPENCLAW_IMAGE`، والمنافذ، ووضع الربط، والمسارات المخصصة، و`OPENCLAW_EXTRA_MOUNTS`، ووضع الحماية، وتخطي الإعداد الأولي). يثبّت التراكب المُنشأ وحدة التخزين الرئيسية لكل من `openclaw-gateway` و`openclaw-cli`؛ نفّذ الأوامر المتبقية باستخدام ذلك التراكب (و`docker-compose.override.yml` أولًا، إذا كنت تستخدم واحدًا):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

يكتب المثبّت الأصلي `claude` إلى `/home/node/.local/bin/claude`. وجّه OpenClaw إلى ذلك المسار:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

سجّل الدخول وتحقق من المجلد الرئيسي الدائم نفسه:

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

ثم استخدم الواجهة الخلفية المضمّنة `claude-cli`:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "قل مرحبًا من Claude CLI داخل Docker"
```

يجعل `OPENCLAW_HOME_VOLUME` التثبيت الأصلي دائمًا ضمن `/home/node/.local/bin` و`/home/node/.local/share/claude`، بالإضافة إلى إعدادات/مصادقة Claude Code ضمن `/home/node/.claude` و`/home/node/.claude.json`. لا يكفي جعل `/home/node/.openclaw` دائمًا وحده؛ إذا كنت تستخدم `OPENCLAW_EXTRA_MOUNTS` بدلًا من وحدة تخزين رئيسية، فثبّت جميع مسارات Claude تلك في كلتا الخدمتين.

<Note>
لأتمتة الإنتاج المشتركة أو فواتير Anthropic القابلة للتنبؤ، يُفضّل استخدام مسار مفتاح Anthropic API. تتبع إعادة استخدام Claude CLI الإصدار المثبّت من Claude Code وتسجيل دخول الحساب والفوترة وسلوك التحديث.
</Note>

### Bonjour / mDNS

لا تمرّر شبكة جسر Docker عادةً بث Bonjour/mDNS المتعدد (`224.0.0.251:5353`) بصورة موثوقة. عندما لا يكون `OPENCLAW_DISABLE_BONJOUR` معيّنًا، يعطّل Plugin ‏Bonjour المضمّن تلقائيًا الإعلان على الشبكة المحلية بمجرد اكتشاف أنه يعمل داخل حاوية، كي لا يدخل في حلقة أعطال أثناء إعادة محاولة البث المتعدد الذي يسقطه الجسر. عيّن `OPENCLAW_DISABLE_BONJOUR=1` لفرض تعطيله بصرف النظر عن الاكتشاف، أو `0` لفرض تفعيله (على شبكة المضيف أو macvlan أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل عليها فقط).

استخدم عنوان URL المنشور لـ Gateway أو Tailscale أو DNS-SD واسع النطاق لمضيفي Docker في الحالات الأخرى. راجع [اكتشاف Bonjour](/ar/gateway/bonjour) للاطلاع على المحاذير واستكشاف الأخطاء وإصلاحها.

### التخزين والاستمرارية

يثبّت Docker Compose بالربط `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw`، و`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، و`OPENCLAW_AUTH_PROFILE_SECRET_DIR` إلى `/home/node/.config/openclaw`، بحيث تبقى هذه المسارات بعد استبدال الحاوية. عندما لا يكون أحد المتغيرات معيّنًا، يعود `docker-compose.yml` إلى مسار ضمن `${HOME}`، أو `/tmp` إذا كان `HOME` نفسه مفقودًا، بحيث لا يُنتج `docker compose up` أبدًا مواصفة وحدة تخزين ذات مصدر فارغ في البيئات الأساسية.

يحتوي دليل الإعدادات المثبّت على:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/مفتاح API المخزنة الخاصة بالمزوّد
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

يخزّن دليل أسرار ملف تعريف المصادقة مفتاح التشفير المحلي لمواد رموز ملف تعريف المصادقة المدعومة بـ OAuth. احتفظ به مع حالة مضيف Docker، لكن بصورة منفصلة عن `OPENCLAW_CONFIG_DIR`.

تخزّن Plugins المثبّتة القابلة للتنزيل حالة الحزمة ضمن مجلد OpenClaw الرئيسي المثبّت، بحيث تبقى سجلات التثبيت وجذور الحزم بعد استبدال الحاوية؛ ولا تعيد بداية تشغيل Gateway إنشاء أشجار تبعيات Plugins المضمّنة.

للحصول على التفاصيل الكاملة حول الاستمرارية في الجهاز الافتراضي، راجع [وقت تشغيل جهاز Docker الافتراضي - ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where).

**مواضع النمو السريع للقرص:** `media/`، وقواعد بيانات SQLite لكل وكيل، ونصوص جلسات JSONL القديمة، وقاعدة بيانات حالة SQLite المشتركة، وجذور حزم Plugins المثبّتة، وسجلات الملفات المتعاقبة ضمن `/tmp/openclaw/`.

### أدوات الصدفة المساعدة (اختيارية)

لأوامر الاستخدام اليومي الأقصر، ثبّت [ClawDock](/ar/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا ثبّتَّ من مسار `scripts/shell-helpers/clawdock-helpers.sh` الأقدم، فأعِد تشغيل الأمر أعلاه كي تتتبّع الأداة المساعدة المحلية الموقع الحالي. ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وما إلى ذلك (شغّل `clawdock-help` للاطلاع على القائمة الكاملة).

<AccordionGroup>
  <Accordion title="تمكين عزل الوكيل لـ Gateway المستند إلى Docker">
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

    لا يركّب البرنامج النصي `docker.sock` إلا بعد اجتياز المتطلبات الأساسية للعزل. إذا تعذّر إكمال إعداد العزل، فإنه يعيد ضبط `agents.defaults.sandbox.mode` إلى `off`. يُعطَّل وضع التعليمات البرمجية في Codex أثناء الأدوار التي يكون فيها عزل OpenClaw نشطًا (راجع [العزل § الواجهة الخلفية لـ Docker](/ar/gateway/sandboxing#docker-backend))؛ ولا تركّب مطلقًا مقبس Docker الخاص بالمضيف داخل حاويات عزل الوكيل.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص الطرفية الزائفة في Compose باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان الشبكة المشتركة">
    يستخدم `openclaw-cli` ‏`network_mode: "service:openclaw-gateway"` كي تتمكن أوامر CLI من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا بوصفه حدّ ثقة مشتركًا. يُسقط إعداد Compose ‏`NET_RAW`/`NET_ADMIN` ويمكّن `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="إخفاقات DNS في Docker Desktop ضمن openclaw-cli">
    تفشل عمليات بحث DNS في بعض إعدادات Docker Desktop من الحاوية الجانبية `openclaw-cli` ذات الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك على هيئة `EAI_AGAIN` أثناء الأوامر المعتمدة على npm مثل `openclaw plugins install`. احتفظ بملف Compose المحصّن الافتراضي للتشغيل العادي. يعيد التجاوز أدناه الإمكانات الافتراضية لحاوية `openclaw-cli` فقط — استخدمه للأمر المنفرد الذي يحتاج إلى الوصول إلى السجل، لا بوصفه طريقة الاستدعاء الافتراضية:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    إذا كنت قد أنشأت بالفعل حاوية `openclaw-cli` طويلة التشغيل، فأعِد إنشاءها باستخدام التجاوز نفسه — لا يستطيع `docker compose exec`/`docker exec` تغيير إمكانات Linux في حاوية أُنشئت بالفعل.

  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة باسم `node` ‏(uid 1000). إذا ظهرت أخطاء أذونات على `/home/node/.openclaw`، فتأكد من أن عمليات الربط من المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    قد يظهر عدم التطابق نفسه على هيئة `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` متبوعًا بـ `plugin present but blocked` — إذ لا يتطابق uid الخاص بالعملية مع مالك دليل Plugin المركّب. يُفضّل التشغيل باستخدام uid 1000 الافتراضي وإصلاح ملكية ربط المضيف. لا تغيّر ملكية `/path/to/openclaw-config/npm` إلى `root:root` إلا إذا كنت تشغّل OpenClaw عمدًا بصلاحيات الجذر على المدى الطويل.

  </Accordion>

  <Accordion title="إعادات بناء أسرع">
    رتّب Dockerfile بحيث تُخزَّن طبقات التبعيات مؤقتًا، لتجنب إعادة تشغيل `pnpm install` ما لم تتغير ملفات القفل:

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
    تعطي الصورة الافتراضية الأولوية للأمان وتعمل باسم `node` من دون صلاحيات الجذر. للحصول على حاوية أكثر تكاملًا:

    1. **الاحتفاظ بـ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام في الصورة**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **تضمين تبعيات Python في الصورة**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **تضمين Playwright Chromium في الصورة**: `export OPENCLAW_INSTALL_BROWSER=1`، أو استخدم وسم صورة `-browser` الرسمي
    5. **أو ثبّت متصفحات Playwright في وحدة تخزين دائمة**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **الاحتفاظ بتنزيلات المتصفح**: استخدم `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائيًا Chromium المُدار بواسطة Playwright في الصورة على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth ‏(Docker بلا واجهة رسومية)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في Docker أو الإعدادات بلا واجهة رسومية، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات الصورة الأساسية الوصفية">
    تستخدم صورة وقت التشغيل `node:24-bookworm-slim` وتشغّل `tini` بوصفه PID 1 بحيث تُجمع العمليات المتوقفة وتُعالَج الإشارات بصورة صحيحة في الحاويات طويلة التشغيل. وتنشر تعليقات توضيحية للصورة الأساسية وفق OCI، بما فيها `org.opencontainers.image.base.name` و`org.opencontainers.image.source`. يحدّث Dependabot ملخّص صورة Node الأساسية المثبّت؛ ولا تشغّل إصدارات النشر طبقة منفصلة لترقية التوزيعة. راجع [تعليقات صور OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner ‏(Docker VPS)](/ar/install/hetzner) و[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) لمعرفة خطوات النشر على آلة افتراضية مشتركة، بما يشمل تضمين الملفات الثنائية في الصورة والاستمرارية والتحديثات.

## عزل الوكيل

عند تمكين `agents.defaults.sandbox` مع الواجهة الخلفية لـ Docker، يشغّل Gateway أدوات الوكيل (الصدفة، وقراءة الملفات وكتابتها، وما إلى ذلك) داخل حاويات Docker معزولة، بينما يظل Gateway نفسه على المضيف — ما يوفر حاجزًا صلبًا حول جلسات الوكيل غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بأكمله داخل حاوية.

يمكن أن يكون نطاق العزل لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا؛ ويحصل كل نطاق على مساحة عمل خاصة به مركّبة عند `/workspace`. ويمكن أيضًا ضبط سياسات السماح بالأدوات أو منعها، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للاطلاع على الإعداد الكامل والصور وملاحظات الأمان وملفات تعريف الوكلاء المتعددين:

- [العزل](/ar/gateway/sandboxing) -- المرجع الكامل للعزل
- [OpenShell](/ar/gateway/openshell) -- وصول تفاعلي إلى الصدفة داخل حاويات العزل
- [عزل الوكلاء المتعددين وأدواتهم](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات خاصة بكل وكيل

### التمكين السريع

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // متوقف | غير رئيسي | الكل
        scope: "agent", // جلسة | وكيل | مشترك
      },
    },
  },
}
```

ابنِ صورة العزل الافتراضية (من نسخة مصدرية مستنسخة):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدرية مستنسخة، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لمعرفة أوامر `docker build` المضمّنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية العزل لا تبدأ">
    ابنِ صورة العزل باستخدام [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (نسخة مصدرية مستنسخة) أو أمر `docker build` المضمّن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)، أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة. تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركّبة، أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="تعذّر العثور على الأدوات المخصصة في العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (صدفة تسجيل دخول)، التي تحمّل `/etc/profile` وقد تعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات أدواتك المخصصة في بداية PATH، أو أضف برنامجًا نصيًا ضمن `/etc/profile.d/` في Dockerfile.
  </Accordion>

  <Accordion title="إنهاء العملية بسبب نفاد الذاكرة أثناء بناء الصورة (رمز الخروج 137)">
    تحتاج الآلة الافتراضية إلى ذاكرة RAM بسعة 2 GB على الأقل. استخدم فئة آلة أكبر وأعِد المحاولة.
  </Accordion>

  <Accordion title="عدم التخويل أو طلب الإقران في واجهة التحكم">
    احصل على رابط لوحة معلومات جديد ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    لمزيد من التفاصيل: [لوحة المعلومات](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="يُظهر هدف Gateway ‏ws://172.x.x.x أو تظهر أخطاء إقران من Docker CLI">
    أعِد ضبط وضع Gateway والربط:

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
- [الإعداد](/ar/gateway/configuration) — إعداد Gateway بعد التثبيت

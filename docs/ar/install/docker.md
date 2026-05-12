---
read_when:
    - تريد Gateway يعمل داخل حاوية بدلًا من التثبيتات المحلية
    - أنت تتحقق من صحة تدفق Docker
summary: الإعداد والتهيئة الأولية الاختياريان المستندان إلى Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker اختياري **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة ويمكن التخلص منها، أو تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع حلقة تطوير. استخدم مسار التثبيت العادي بدلًا من ذلك.
- **ملاحظة حول العزل**: تستخدم واجهة العزل الخلفية الافتراضية Docker عند تمكين العزل، لكن العزل معطّل افتراضيًا ولا يتطلب **أن** يعمل Gateway بالكامل في Docker. تتوفر أيضًا واجهات العزل الخلفية SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يُنهى بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغله على VPS/مضيف عام، فراجع
  [تقوية الأمان للتعرض الشبكي](/ar/gateway/security)،
  خصوصًا سياسة جدار الحماية Docker `DOCKER-USER`.

## Gateway داخل حاوية

<Steps>
  <Step title="بناء الصورة">
    من جذر المستودع، شغّل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة Gateway محليًا. لاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثلًا `2026.2.26`).

  </Step>

  <Step title="إكمال التهيئة الأولية">
    يشغّل سكربت الإعداد التهيئة الأولية تلقائيًا. سيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزوّد
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - إنشاء دليل مفتاح سر ملف تعريف المصادقة
    - بدء تشغيل Gateway عبر Docker Compose

    أثناء الإعداد، تُشغّل التهيئة الأولية قبل البدء وكتابات الإعدادات من خلال
    `openclaw-gateway` مباشرة. يُستخدم `openclaw-cli` للأوامر التي تشغّلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="فتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في الإعدادات. يكتب سكربت الإعداد رمزًا إلى `.env` افتراضيًا؛ إذا بدّلت
    إعداد الحاوية إلى مصادقة كلمة المرور، فاستخدم تلك الكلمة بدلًا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

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

    الوثائق: [WhatsApp](/ar/channels/whatsapp)، [Telegram](/ar/channels/telegram)، [Discord](/ar/channels/discord)

  </Step>
</Steps>

### المسار اليدوي

إذا كنت تفضّل تشغيل كل خطوة بنفسك بدلًا من استخدام سكربت الإعداد:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
شغّل `docker compose` من جذر المستودع. إذا فعّلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، يكتب سكربت الإعداد `docker-compose.extra.yml`؛
قم بتضمينه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة تُستخدم بعد بدء التشغيل. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولية
وكتابات إعدادات وقت الإعداد من خلال `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                                   | الغرض                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلًا من البناء محليًا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`                      | تضمين مساعدين محددين من Plugins المضمّنة وقت البناء           |
| `OPENCLAW_EXTRA_MOUNTS`                    | ربطات تركيب إضافية للمضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | حفظ `/home/node` في مجلد Docker مسمّى                   |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (القيمة الافتراضية `1` لـ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات تركيب ربط مصدر Plugin المضمّنة               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية مجمّع OTLP/HTTP مشتركة لتصدير OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارات للتتبعات أو المقاييس أو السجلات     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يُدعم اليوم إلا `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث السمات الدلالية التجريبية لـ GenAI         |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء SDK ثانٍ لـ OpenTelemetry عند تحميل واحد مسبقًا  |

يمكن للمشرفين اختبار مصدر Plugin مضمّن مقابل صورة معبأة بتركيب
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، مثلًا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المركّب ذلك الحزمة المطابقة المترجمة
`/app/dist/extensions/synology-chat` لمعرّف Plugin نفسه.

### قابلية المراقبة

يكون تصدير OpenTelemetry صادرًا من حاوية Gateway إلى مجمّع OTLP
الخاص بك. لا يتطلب ذلك منفذ Docker منشورًا. إذا بنيت الصورة
محليًا وتريد أن يكون مصدّر OpenTelemetry المضمّن متاحًا داخل الصورة،
فضمّن اعتماديات وقت تشغيله:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبّت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تمكين التصدير. لا تزال الصور المخصّصة المبنية من المصدر قادرة على
تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتمكين التصدير، اسمح بتمكين
Plugin `diagnostics-otel` في الإعدادات وفعّله، ثم عيّن
`diagnostics.otel.enabled=true` أو استخدم مثال الإعدادات في [تصدير OpenTelemetry
](/ar/gateway/opentelemetry). تُضبط ترويسات مصادقة المجمّع من خلال
`diagnostics.otel.headers`، وليس من خلال متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبّت
`clawhub:@openclaw/diagnostics-prometheus`، وفعّل
Plugin `diagnostics-prometheus`، ثم اجمع المقاييس:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تكشف منفذًا عامًا منفصلًا
لـ `/metrics` أو مسار وكيل عكسيًا غير مصادق عليه. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker أمر `HEALTHCHECK` مدمجًا يفحص `/healthz`.
إذا استمرت الفحوصات بالفشل، يعلّم Docker الحاوية على أنها `unhealthy` ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة موثّقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (افتراضي): يستطيع متصفح المضيف وCLI على المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا تستطيع الوصول إلى Gateway مباشرة إلا العمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### مزوّدو المضيف المحليون

عندما يعمل OpenClaw في Docker، فإن `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهاز المضيف لديك. استخدم `host.docker.internal` لمزوّدي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزوّد  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المضمّن عناوين URL الخاصة بالمضيف تلك كقيم افتراضية للتهيئة الأولية
لـ LM Studio وOllama، ويربط `docker-compose.yml` الاسم `host.docker.internal` بـ
Gateway المضيف في Docker لـ Linux Docker Engine. يوفر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضًا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose الخاص بك أو أمر `docker run`، فأضف تعيين المضيف
نفسه بنفسك، مثلًا
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

عادةً لا تمرر شبكات جسر Docker بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المضمّن
`OPENCLAW_DISABLE_BONJOUR=1` افتراضيًا حتى لا يدخل Gateway في حلقة تعطل أو يعيد
بدء الإعلان مرارًا عندما يسقط الجسر حركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway، أو Tailscale، أو DNS-SD واسع النطاق لمضيفي Docker.
عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة المضيف، أو macvlan،
أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل فيها.

للمشكلات الشائعة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose ‏`OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw`،
و`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، و
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` إلى `/home/node/.config/openclaw`، بحيث تبقى هذه
المسارات بعد استبدال الحاوية. عند عدم تعيين أي متغير، يعود
`docker-compose.yml` المضمّن إلى مسار تحت `${HOME}`، أو إلى `/tmp` عندما يكون `HOME` نفسه
مفقودًا أيضًا. يمنع ذلك `docker compose up` من إصدار مواصفة مجلد
ذات مصدر فارغ في البيئات المجردة.

دليل الإعدادات المركّب هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المحفوظة الخاصة بالمزوّدين
- `.env` لأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

يخزّن دليل مفتاح سر ملف تعريف المصادقة مفتاح التشفير المحلي المستخدم
لمواد رمز ملف تعريف المصادقة المدعومة بـ OAuth. احتفظ به مع حالة مضيف Docker لديك،
لكن منفصلًا عن `OPENCLAW_CONFIG_DIR`.

تخزّن Plugins القابلة للتنزيل والمثبتة حالة حِزمها ضمن مجلد OpenClaw الرئيسي المركّب، لذلك تبقى سجلات تثبيت Plugin وجذور الحِزم بعد استبدال الحاوية. لا ينشئ بدء تشغيل Gateway أشجار تبعيات Plugins المضمّنة.

للحصول على التفاصيل الكاملة للاستمرارية في عمليات نشر VM، راجع
[وقت تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**النقاط الأكثر تسببًا في نمو القرص:** راقب `media/`، وملفات JSONL الخاصة بالجلسات،
و`cron/runs/*.jsonl`، وجذور حِزم Plugin المثبتة، وسجلات الملفات الدوّارة
ضمن `/tmp/openclaw/`.

### مساعدات Shell (اختيارية)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي الموقع الجديد.

ثم استخدم `clawdock-start`، و`clawdock-stop`، و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل وضع حماية الوكيل لـ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار مقبس مخصص (مثل Docker دون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يركّب السكربت `docker.sock` إلا بعد نجاح متطلبات وضع الحماية الأساسية. إذا
    تعذر إكمال إعداد وضع الحماية، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`. تظل جولات وضع كود Codex مقيّدة بـ Codex
    `workspace-write` أثناء نشاط وضع حماية OpenClaw؛ لا تركّب
    مقبس Docker الخاص بالمضيف داخل حاويات وضع حماية الوكلاء.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان الشبكة المشتركة">
    يستخدم `openclaw-cli` الإعداد `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا باعتباره حدّ ثقة مشتركًا.
    يسقط إعداد compose إمكانات `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="إخفاقات DNS في Docker Desktop داخل openclaw-cli">
    تفشل بعض إعدادات Docker Desktop في عمليات بحث DNS من حاوية
    `openclaw-cli` الجانبية ذات الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك على شكل
    `EAI_AGAIN` أثناء الأوامر المدعومة بـ npm مثل `openclaw plugins install`.
    أبقِ ملف compose الافتراضي المشدّد لعملية Gateway العادية. يعمل
    التجاوز المحلي أدناه على تخفيف وضع أمان حاوية CLI عبر
    استعادة الإمكانات الافتراضية لـ Docker، لذلك استخدمه فقط لأمر CLI
    لمرة واحدة يحتاج إلى الوصول إلى سجل الحِزم، وليس كاستدعاء Compose
    الافتراضي لديك:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    إذا كنت قد أنشأت بالفعل حاوية `openclaw-cli` طويلة التشغيل، فأعد إنشاءها
    باستخدام التجاوز نفسه. لا يستطيع `docker compose exec` ولا `docker exec`
    تغيير إمكانات Linux على حاوية أُنشئت مسبقًا.

  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة باسم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات bind mount على المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    يمكن أن يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. يعني ذلك أن uid العملية ومالك
    دليل Plugin المركّب غير متفقين. يُفضّل تشغيل الحاوية بالـ
    uid 1000 الافتراضي وإصلاح ملكية bind mount. لا تستخدم chown
    على `/path/to/openclaw-config/npm` إلى `root:root` إلا إذا كنت تشغّل
    OpenClaw كـ root عمدًا على المدى الطويل.

  </Accordion>

  <Accordion title="إعادة بناء أسرع">
    رتّب Dockerfile بحيث تُخزّن طبقات التبعيات مؤقتًا. هذا يتجنب إعادة تشغيل
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
    الصورة الافتراضية تركّز على الأمان أولًا وتعمل كمستخدم `node` غير root. للحصول على
    حاوية أكثر اكتمالًا بالميزات:

    1. **استمرارية `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تضمين Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **أو تثبيت متصفحات Playwright في مجلد مستمر**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **استمرارية تنزيلات المتصفح**: استخدم `OPENCLAW_HOME_VOLUME` أو
       `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائيًا Chromium المُدار بواسطة Playwright
       في صورة Docker على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker دون واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح URL في المتصفح. في
    Docker أو الإعدادات دون واجهة، انسخ URL إعادة التوجيه الكامل الذي تصل إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة وقت تشغيل Docker الرئيسية `node:24-bookworm-slim` وتتضمن `tini` كعملية init لنقطة الدخول (PID 1) لضمان حصاد العمليات الزومبي والتعامل مع الإشارات بشكل صحيح في الحاويات طويلة التشغيل. تنشر تعليقات توضيحية لصورة OCI الأساسية تشمل `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. يتم
    تحديث ملخص قاعدة Node عبر PRs صور Docker الأساسية في Dependabot؛ لا تشغّل إصدارات النشر
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تشغّل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) لخطوات نشر VM المشتركة
بما في ذلك تضمين الثنائيات، والاستمرارية، والتحديثات.

## وضع حماية الوكيل

عند تفعيل `agents.defaults.sandbox` مع خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزًا صارمًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين دون وضع Gateway بالكامل
داخل حاوية.

يمكن أن يكون نطاق وضع الحماية لكل وكيل (افتراضيًا)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مركّبة عند `/workspace`. يمكنك أيضًا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للاطلاع على التكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددة، راجع:

- [وضع الحماية](/ar/gateway/sandboxing) -- مرجع وضع الحماية الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات وضع الحماية
- [وضع حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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

ابنِ صورة وضع الحماية الافتراضية (من نسخة مصدر):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm دون نسخة مصدر، راجع [وضع الحماية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمّنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية وضع الحماية لا تبدأ">
    ابنِ صورة وضع الحماية باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدر) أو أمر `docker build` المضمّن من [وضع الحماية § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في وضع الحماية">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركّبة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في وضع الحماية">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، والذي يقرأ
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في المقدمة، أو أضف سكربتًا ضمن `/etc/profile.d/` في Dockerfile.
  </Accordion>

  <Accordion title="تم إنهاء بناء الصورة بسبب نفاد الذاكرة (الخروج 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة آلة أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرّح أو الاقتران مطلوب في واجهة التحكم">
    اجلب رابط لوحة تحكم جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة التحكم](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

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
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدّثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

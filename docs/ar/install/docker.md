---
read_when:
    - تريد Gateway يعمل داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من سير عمل Docker
summary: الإعداد الاختياري القائم على Docker والتهيئة الأولية لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:34:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker اختياري **اختياري**. استخدمه فقط إذا كنت تريد Gateway حاويةً أو التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للتخلص منها، أو تشغيل OpenClaw على مضيف من دون عمليات تثبيت محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع دورة تطوير. استخدم مسار التثبيت العادي بدلاً من ذلك.
- **ملاحظة العزل**: يستخدم طرف العزل الافتراضي Docker عند تفعيل العزل، لكن العزل متوقف افتراضيًا ولا يتطلب **تشغيل Gateway بالكامل في Docker**. تتوفر أيضًا أطراف عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يُنهى بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغّل على VPS/مضيف عام، راجع
  [تقوية الأمان للتعرض الشبكي](/ar/gateway/security)،
  وخصوصًا سياسة جدار حماية Docker `DOCKER-USER`.

## Gateway داخل حاوية

<Steps>
  <Step title="ابنِ الصورة">
    من جذر المستودع، شغّل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يبني هذا صورة Gateway محليًا. لاستخدام صورة مبنية مسبقًا بدلاً من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="أكمل التهيئة الأولية">
    يشغّل سكربت الإعداد التهيئة الأولية تلقائيًا. سيقوم بما يلي:

    - طلب مفاتيح API للمزوّد
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولية قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. يُستخدم `openclaw-cli` للأوامر التي تشغّلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="افتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المضبوط
    في الإعدادات. يكتب سكربت الإعداد رمزًا إلى `.env` افتراضيًا؛ إذا بدّلت
    إعداد الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك الكلمة بدلاً من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

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

إذا كنت تفضل تشغيل كل خطوة بنفسك بدلاً من استخدام سكربت الإعداد:

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
ضمّنه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
نظرًا لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ`openclaw-gateway`، فهو أداة
لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولية
وكتابات الإعداد وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                                   | الغرض                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلاً من البناء محليًا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`                      | تضمين مساعدات Plugin المضمّنة المحددة وقت البناء           |
| `OPENCLAW_EXTRA_MOUNTS`                    | ربط تحميلات مضيف إضافية (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | الاحتفاظ بـ`/home/node` في وحدة تخزين Docker مسماة                   |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (الافتراضي `1` لـDocker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات ربط تحميل مصادر Plugin المضمّنة               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يُدعم اليوم إلا `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية         |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء OpenTelemetry SDK ثانٍ عندما يكون أحدها محملاً مسبقًا  |

يمكن للمشرفين اختبار مصدر Plugin المضمّن مقابل صورة معبأة عن طريق تحميل
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، على سبيل المثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمّل ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرّف Plugin نفسه.

### قابلية الملاحظة

يكون تصدير OpenTelemetry صادرًا من حاوية Gateway إلى جامع OTLP
الخاص بك. لا يتطلب منفذ Docker منشورًا. إذا بنيت الصورة
محليًا وتريد أن يكون مصدّر OpenTelemetry المضمّن متاحًا داخل الصورة،
فضمّن تبعيات وقت التشغيل الخاصة به:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبّت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر قادرة
على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح بـPlugin
`diagnostics-otel` وفعّله في الإعدادات، ثم عيّن
`diagnostics.otel.enabled=true` أو استخدم مثال الإعداد في [تصدير OpenTelemetry
](/ar/gateway/opentelemetry). تُضبط رؤوس مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. ثبّت
`clawhub:@openclaw/diagnostics-prometheus`، وفعّل Plugin
`diagnostics-prometheus`، ثم اجمع:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عامًا منفصلًا
أو مسار وكيل عكسي غير موثّق. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker فحص `HEALTHCHECK` مدمجًا يطلب `/healthz`.
إذا استمرت الفحوصات في الفشل، يعلّم Docker الحاوية كـ`unhealthy` ويمكن لأنظمة
التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة موثقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يفترض `scripts/docker/setup.sh` القيمة `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن إلا للعمليات داخل مساحة أسماء شبكة الحاوية الوصول إلى
  Gateway مباشرة.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء المضيف البديلة مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### مزودو المضيف المحليون

عند تشغيل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهاز المضيف. استخدم `host.docker.internal` لمزوّدي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزوّد  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المضمّن عناوين URL تلك للمضيف كافتراضيات تهيئة أولية لـLM Studio وOllama،
ويعيّن `docker-compose.yml` الاسم `host.docker.internal` إلى
Gateway مضيف Docker لـLinux Docker Engine. يوفّر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضًا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا استخدمت ملف Compose خاصًا بك أو أمر `docker run`، فأضف تعيين المضيف نفسه
بنفسك، على سبيل المثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

لا تمرر شبكات Docker bridge عادة بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) على نحو موثوق. لذلك يفترض إعداد Compose المضمّن
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد
بدء الإعلان مرارًا عندما تُسقط bridge حركة البث المتعدد.

استخدم عنوان URL المنشور لـGateway أو Tailscale أو DNS-SD واسع النطاق لمضيفي Docker.
عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكات المضيف أو macvlan
أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل فيها.

للمشكلات الشائعة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose تحميل `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، لذلك تبقى هذه المسارات
بعد استبدال الحاوية. عندما يكون أي من المتغيرين غير مضبوط، يعود
`docker-compose.yml` المضمّن إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لتحميل مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودًا أيضًا. يحافظ ذلك على منع `docker compose up` من
إصدار مواصفة وحدة تخزين بمصدر فارغ في البيئات المجردة.

دليل الإعداد المحمّل هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعداد السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/مفاتيح API المخزنة للمزوّد
- `.env` لأسرار وقت التشغيل المستندة إلى البيئة مثل `OPENCLAW_GATEWAY_TOKEN`

تخزن Plugins القابلة للتنزيل المثبتة حالة حزمها تحت دليل OpenClaw الرئيسي المحمّل،
لذلك تبقى سجلات تثبيت Plugins وجذور الحزم بعد استبدال الحاوية.
لا ينشئ بدء Gateway أشجار تبعيات Plugin المضمّنة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[وقت تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص الساخنة:** راقب `media/`، وملفات JSONL للجلسات،
و`cron/runs/*.jsonl`، وجذور حزم Plugin المثبتة، وسجلات الملفات الدوارة
ضمن `/tmp/openclaw/`.

### مساعدات Shell (اختيارية)

لإدارة Docker اليومية بسهولة أكبر، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي الموقع الجديد.

ثم استخدم `clawdock-start`، و`clawdock-stop`، و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` لكل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل صندوق عزل الوكيل لـ Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker بلا root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يركّب السكربت `docker.sock` إلا بعد اجتياز متطلبات صندوق العزل. إذا
    تعذّر إكمال إعداد صندوق العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`. تظل دورات نمط كود Codex مقيّدة بـ Codex
    `workspace-write` أثناء نشاط صندوق عزل OpenClaw؛ لا تركّب socket Docker
    الخاص بالمضيف داخل حاويات صندوق عزل الوكيل.

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
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا كحد ثقة مشترك.
    يُسقط إعداد compose قدرات `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على كل من `openclaw-gateway` و`openclaw-cli`.
  </Accordion>

  <Accordion title="إخفاقات DNS في Docker Desktop داخل openclaw-cli">
    تفشل بعض إعدادات Docker Desktop في عمليات بحث DNS من حاوية
    `openclaw-cli` الجانبية ذات الشبكة المشتركة بعد إسقاط `NET_RAW`، ويظهر ذلك كـ
    `EAI_AGAIN` أثناء الأوامر المدعومة بـ npm مثل `openclaw plugins install`.
    أبقِ ملف compose المقوّى الافتراضي لتشغيل Gateway العادي. يتساهل
    التجاوز المحلي أدناه في وضع أمان حاوية CLI عبر استعادة قدرات Docker
    الافتراضية، لذا استخدمه فقط لأمر CLI العارض الذي يحتاج إلى الوصول إلى
    سجل الحزم، وليس كاستدعاء Compose الافتراضي لديك:

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
    تغيير قدرات Linux على حاوية أُنشئت مسبقًا.

  </Accordion>

  <Accordion title="الأذونات و EACCES">
    تعمل الصورة باسم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات ربط المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    يمكن أن يظهر عدم التطابق نفسه كتحذير Plugin مثل
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    متبوعًا بـ `plugin present but blocked`. يعني ذلك أن uid العملية ومالك دليل
    Plugin المركّب غير متفقين. يُفضّل تشغيل الحاوية بالـ uid الافتراضي 1000
    وإصلاح ملكية ربط المضيف. لا تنفّذ chown على
    `/path/to/openclaw-config/npm` إلى `root:root` إلا إذا كنت تشغّل
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

  <Accordion title="خيارات حاوية للمستخدمين المتقدمين">
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم غير root باسم `node`. للحصول على حاوية
    أكثر اكتمالًا بالميزات:

    1. **استمرارية `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تضمين Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **أو تثبيت متصفحات Playwright في volume مستمر**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **استمرارية تنزيلات المتصفح**: استخدم `OPENCLAW_HOME_VOLUME` أو
       `OPENCLAW_EXTRA_MOUNTS`. يكتشف OpenClaw تلقائيًا Chromium المُدار بواسطة
       Playwright داخل صورة Docker على Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    إعدادات Docker أو الإعدادات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتتضمن `tini` كعملية تهيئة نقطة الدخول (PID 1) لضمان حصد العمليات الزومبية ومعالجة الإشارات بشكل صحيح في الحاويات طويلة التشغيل. تنشر تعليقات OCI للصورة الأساسية بما في ذلك `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يُحدّث ملخص صورة Node الأساسية
    عبر PRs صور Docker الأساسية من Dependabot؛ لا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[تشغيل Docker VM](/ar/install/docker-vm-runtime) لخطوات النشر المشتركة على VM
بما في ذلك تضمين الثنائيات، والاستمرارية، والتحديثات.

## صندوق عزل الوكيل

عند تفعيل `agents.defaults.sandbox` مع خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا جدارًا صلبًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين دون وضع Gateway بأكمله
داخل حاوية.

يمكن أن يكون نطاق صندوق العزل لكل وكيل (افتراضيًا)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مركّبة في `/workspace`. يمكنك أيضًا تكوين
سياسات السماح/الرفض للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للتكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل](/ar/gateway/sandboxing) -- المرجع الكامل لصندوق العزل
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات صندوق العزل
- [صندوق عزل وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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

ابنِ صورة صندوق العزل الافتراضية (من نسخة مصدرية محلية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm دون نسخة مصدرية محلية، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية صندوق العزل لا تبدأ">
    ابنِ صورة صندوق العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدرية محلية) أو أمر `docker build` المضمن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات داخل صندوق العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركّبة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة داخل صندوق العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، والذي يقرأ
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في المقدمة، أو أضف سكربتًا ضمن `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="توقف بسبب OOM أثناء بناء الصورة (exit 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة آلة أكبر ثم أعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح به أو الاقتران مطلوب في واجهة التحكم">
    اجلب رابط لوحة تحكم جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    تفاصيل أكثر: [لوحة التحكم](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

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
- [ClawDock](/ar/install/clawdock) — إعداد مجتمع Docker Compose
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

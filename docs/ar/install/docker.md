---
read_when:
    - تريد Gateway مُشغّلًا داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من مسار Docker
summary: الإعداد والتهيئة الأولية الاختياريان المستندان إلى Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T07:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2647caae7debfe0647842249a3a6000bfa73b191b1aa1d7ced1e9c0eb22228db
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway ضمن حاوية أو التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للتخلص منها، أو تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع دورة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة حول العزل**: تستخدم واجهة العزل الخلفية الافتراضية Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب تشغيل Gateway بالكامل في Docker. تتوفر أيضا واجهات عزل SSH و OpenShell الخلفية. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ما لا يقل عن 2 GB RAM لبناء الصورة (`pnpm install` قد ينهيه النظام بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز خروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغله على VPS/مضيف عام، راجع
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

    تنشر الصور المبنية مسبقا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثلا `2026.2.26`).

  </Step>

  <Step title="أكمل الإعداد الأولي">
    يشغل سكربت الإعداد الإعداد الأولي تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزود
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل عملية الإعداد الأولي قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    وجود حاوية Gateway بالفعل.

  </Step>

  <Step title="افتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المكون
    في الإعدادات. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعدادات
    الحاوية إلى مصادقة كلمة المرور، فاستخدم تلك
    كلمة المرور بدلا من ذلك.

    تحتاج إلى الرابط مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="كوّن القنوات (اختياري)">
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
أو `OPENCLAW_HOME_VOLUME`، فسيكتب سكربت الإعداد `docker-compose.extra.yml`؛
أدرجه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل الإعداد الأولي
وكتابات الإعدادات وقت الإعداد عبر `openclaw-gateway` مع
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية هذه:

| المتغير                                   | الغرض                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`                      | تضمين أدوات مساعدة مختارة لـ Plugin المجمعة وقت البناء           |
| `OPENCLAW_EXTRA_MOUNTS`                    | ربطات تحميل إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | حفظ `/home/node` في وحدة تخزين Docker مسماة                   |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة الإعداد الأولي التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (الإعداد الافتراضي `1` لـ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل تراكبات ربط تحميل مصدر Plugin المجمعة               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية مجمع OTLP/HTTP مشتركة لتصدير OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP الخاصة بالإشارات للتتبعات أو المقاييس أو السجلات     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يدعم حاليا إلا `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث السمات الدلالية التجريبية لـ GenAI         |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء OpenTelemetry SDK ثانية عندما تكون واحدة محملة مسبقا  |

يمكن للمشرفين اختبار مصدر Plugin المجمع مقابل صورة معبأة عبر تحميل
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، على سبيل المثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمل ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية المراقبة

يكون تصدير OpenTelemetry صادرا من حاوية Gateway إلى مجمع OTLP
لديك. لا يتطلب منفذ Docker منشورا. إذا بنيت الصورة
محليا وتريد أن يكون مصدّر OpenTelemetry المجمع متاحا داخل الصورة،
فأدرج اعتماداته وقت التشغيل:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

تتضمن صورة إصدار Docker الرسمية من OpenClaw مصدر Plugin
`diagnostics-otel` المجمع. لتمكين التصدير، اسمح بـ Plugin
`diagnostics-otel` وفعله في الإعدادات، ثم عين
`diagnostics.otel.enabled=true` أو استخدم مثال الإعداد في
[تصدير OpenTelemetry](/ar/gateway/opentelemetry). تهيأ رؤوس مصادقة المجمع
عبر `diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. فعل Plugin
`diagnostics-prometheus`، ثم اجمع المقاييس:

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

تتضمن صورة Docker فحص `HEALTHCHECK` مدمجا يرسل ping إلى `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker علامة `unhealthy` على الحاوية ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يعين `scripts/docker/setup.sh` افتراضيا `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن إلا للعمليات داخل مساحة أسماء شبكة الحاوية الوصول
  إلى Gateway مباشرة.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس الأسماء المستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### مزودو المضيف المحليون

عند تشغيل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهاز المضيف. استخدم `host.docker.internal` لمزودي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزود  | رابط المضيف الافتراضي         | رابط إعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المجمع تلك روابط المضيف كافتراضات الإعداد الأولي لـ LM Studio وOllama،
ويربط `docker-compose.yml` الاسم `host.docker.internal` بـ
Gateway مضيف Docker لـ Linux Docker Engine. يوفر Docker Desktop بالفعل
اسم المضيف نفسه على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصا بك أو أمر `docker run`، فأضف ربط المضيف
نفسه بنفسك، على سبيل المثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

عادة لا تمرر شبكة Docker bridge بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المجمع افتراضيا
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة تعطل أو يعيد
تشغيل الإعلان مرارا عندما تسقط bridge حركة البث المتعدد.

استخدم رابط Gateway المنشور، أو Tailscale، أو wide-area DNS-SD لمضيفات Docker.
عين `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة المضيف، أو macvlan،
أو شبكة أخرى يعرف أن بث mDNS المتعدد يعمل فيها.

للملاحظات المهمة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose تحميل `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، لذا تبقى تلك المسارات
بعد استبدال الحاوية. عندما لا يكون أي من المتغيرين معينا، يعود ملف
`docker-compose.yml` المجمع إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لتحميل مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودا أيضا. يمنع ذلك `docker compose up` من
إصدار مواصفة وحدة تخزين ذات مصدر فارغ في البيئات العارية.

دليل الإعدادات المحمل هذا هو المكان الذي يحتفظ فيه OpenClaw بـ:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المحفوظة الخاصة بالمزود
- `.env` للأسرار المدعومة بالبيئة وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`

تخزن Plugins القابلة للتنزيل المثبتة حالة حزمها تحت دليل OpenClaw الرئيسي
المحمل، لذا تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال
الحاوية. لا ينشئ بدء تشغيل Gateway أشجار اعتماد Plugins المجمعة.

لتفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[زمن تشغيل Docker VM - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص الساخنة:** راقب `media/`، وملفات JSONL للجلسات،
`cron/runs/*.jsonl`، وجذور حزم Plugin المثبتة، وسجلات الملفات المتداولة
تحت `/tmp/openclaw/`.

### مساعدات Shell (اختياري)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من مسار raw الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وما إلى ذلك. شغّل
`clawdock-help` لعرض جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للاطلاع على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل صندوق عزل الوكيل لـ Gateway الخاص بـ Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker دون root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    لا يركّب السكربت `docker.sock` إلا بعد اجتياز متطلبات صندوق العزل. إذا
    تعذر إكمال إعداد صندوق العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص Compose للـ pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان الشبكة المشتركة">
    يستخدم `openclaw-cli` الخيار `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا بصفته حدّ ثقة مشتركًا.
    يُسقط إعداد compose الخيارين `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات و EACCES">
    تعمل الصورة باسم `node` (uid 1000). إذا ظهرت لك أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات الربط من المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

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
    الصورة الافتراضية تركّز على الأمان أولًا وتعمل باسم `node` دون root. للحصول على
    حاوية أكثر اكتمالًا بالميزات:

    1. **استمرار `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين تبعيات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **استمرار تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker دون واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    Docker أو الإعدادات دون واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتنشر تعليقات OCI
    للصورة الأساسية، بما في ذلك `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يتم تحديث digest الأساسي لـ Node
    عبر PRs من Dependabot لصور Docker الأساسية؛ ولا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صور OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[تشغيل Docker VM](/ar/install/docker-vm-runtime) لمعرفة خطوات النشر على VM مشتركة،
بما في ذلك تضمين الملفات الثنائية، والاستمرارية، والتحديثات.

## صندوق عزل الوكيل

عند تفعيل `agents.defaults.sandbox` مع خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا جدارًا صارمًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين دون وضع Gateway كاملًا داخل حاوية.

يمكن أن يكون نطاق صندوق العزل لكل وكيل (افتراضيًا)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مركّبة في `/workspace`. يمكنك أيضًا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للحصول على التكوين الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل](/ar/gateway/sandboxing) -- مرجع صندوق العزل الكامل
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

ابنِ صورة صندوق العزل الافتراضية (من checkout للمصدر):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm دون checkout للمصدر، راجع [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) لأوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية صندوق العزل لا تبدأ">
    ابنِ صورة صندوق العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout للمصدر) أو أمر `docker build` المضمن من [العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في صندوق العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركّبة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في صندوق العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، ما يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في البداية، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile.
  </Accordion>

  <Accordion title="توقف بسبب نفاد الذاكرة أثناء بناء الصورة (رمز الخروج 137)">
    تحتاج VM إلى 2 GB من RAM على الأقل. استخدم فئة جهاز أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو الاقتران مطلوب في واجهة التحكم">
    اجلب رابط لوحة تحكم جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة التحكم](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="يُظهر هدف Gateway العنوان ws://172.x.x.x أو تظهر أخطاء اقتران من Docker CLI">
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
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدّثًا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

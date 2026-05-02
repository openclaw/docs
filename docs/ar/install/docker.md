---
read_when:
    - تريد Gateway يعمل داخل حاوية بدلًا من عمليات التثبيت المحلية
    - أنت تتحقق من مسار Docker
summary: الإعداد والتهيئة الأولية الاختياريان المعتمدان على Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:48:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو التحقق من مسار Docker.

## هل Docker مناسب لي؟

- **نعم**: إذا كنت تريد بيئة Gateway معزولة وقابلة للتخلص منها، أو تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: إذا كنت تعمل على جهازك وتريد فقط أسرع حلقة تطوير. استخدم مسار التثبيت العادي بدلا من ذلك.
- **ملاحظة حول العزل**: تستخدم واجهة العزل الخلفية الافتراضية Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب تشغيل Gateway بالكامل في Docker. تتوفر أيضا واجهات العزل الخلفية SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ما لا يقل عن 2 غيغابايت من ذاكرة RAM لبناء الصورة (`pnpm install` قد يُنهى بسبب نفاد الذاكرة على مضيفات 1 غيغابايت مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغل على VPS/مضيف عام، فراجع
  [تعزيز الأمان للتعرض الشبكي](/ar/gateway/security)،
  وخصوصا سياسة جدار الحماية `DOCKER-USER` الخاصة بـ Docker.

## Gateway داخل حاوية

<Steps>
  <Step title="ابن الصورة">
    من جذر المستودع، شغّل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    هذا يبني صورة Gateway محليا. لاستخدام صورة مبنية مسبقا بدلا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثلا `2026.2.26`).

  </Step>

  <Step title="أكمل التهيئة الأولية">
    يشغل سكربت الإعداد التهيئة الأولية تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزود
    - إنشاء رمز Gateway وكتابته إلى `.env`
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولية قبل البدء وعمليات كتابة الإعدادات عبر
    `openclaw-gateway` مباشرة. أما `openclaw-cli` فهو للأوامر التي تشغلها بعد
    أن تكون حاوية Gateway موجودة بالفعل.

  </Step>

  <Step title="افتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المهيأ
    في الإعدادات. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعدادات
    الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك
    الكلمة بدلا من ذلك.

    هل تحتاج إلى عنوان URL مرة أخرى؟

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="هيئ القنوات (اختياري)">
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
شغّل `docker compose` من جذر المستودع. إذا فعّلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، فسيكتب سكربت الإعداد `docker-compose.extra.yml`؛
ضمّنه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولية
وعمليات كتابة إعدادات وقت الإعداد عبر `openclaw-gateway` مع
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                                   | الغرض                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)       |
| `OPENCLAW_EXTENSIONS`                      | تضمين مساعدين محددين من Plugins المجمعة وقت البناء           |
| `OPENCLAW_EXTRA_MOUNTS`                    | نقاط ربط إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | إبقاء `/home/node` في وحدة تخزين Docker مسماة                   |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلانات Bonjour/mDNS (القيمة الافتراضية `1` لـ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات ربط مصدر Plugins المجمعة               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP مشتركة لتصدير OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP خاصة بالإشارة للتتبعات أو المقاييس أو السجلات     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. لا يدعم حاليا إلا `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية         |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء SDK ثان من OpenTelemetry عند تحميل واحد مسبقا  |

يمكن للمشرفين اختبار مصدر Plugin مجمع مقابل صورة معبأة بربط
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، على سبيل المثال
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المربوط هذا حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لمعرف Plugin نفسه.

### قابلية الملاحظة

تصدير OpenTelemetry صادر من حاوية Gateway إلى جامع OTLP
الخاص بك. لا يتطلب منفذ Docker منشورا. إذا بنيت الصورة
محليا وتريد أن يكون مصدر OpenTelemetry المجمع متاحا داخل الصورة،
فضمّن تبعياته في وقت التشغيل:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ثبّت Plugin الرسمي `@openclaw/diagnostics-otel` من ClawHub في
تثبيتات Docker المعبأة قبل تفعيل التصدير. لا تزال الصور المخصصة المبنية من المصدر قادرة
على تضمين مصدر Plugin المحلي باستخدام
`OPENCLAW_EXTENSIONS=diagnostics-otel`. لتفعيل التصدير، اسمح لـ
Plugin `diagnostics-otel` وفعّله في الإعدادات، ثم عيّن
`diagnostics.otel.enabled=true` أو استخدم مثال الإعدادات في [تصدير OpenTelemetry
](/ar/gateway/opentelemetry). تُهيأ ترويسات مصادقة الجامع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور مسبقا. ثبّت
`clawhub:@openclaw/diagnostics-prometheus`، وفعّل
Plugin `diagnostics-prometheus`، ثم اكشط:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

المسار محمي بمصادقة Gateway. لا تكشف منفذ `/metrics` عاما منفصلا
أو مسار وكيل عكسي غير مصادق. راجع
[مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker `HEALTHCHECK` مدمجا يفحص `/healthz`.
إذا استمرت الفحوصات في الفشل، يعلّم Docker الحاوية بأنها `unhealthy` ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منفذ Docker.

- `lan` (افتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن الوصول إلى Gateway مباشرة إلا للعمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### المزودون المحليون على المضيف

عند تشغيل OpenClaw في Docker، يكون `127.0.0.1` داخل الحاوية هو الحاوية
نفسها، وليس جهاز المضيف. استخدم `host.docker.internal` لمزودي الذكاء الاصطناعي الذين
يعملون على المضيف:

| المزود  | عنوان URL الافتراضي للمضيف         | عنوان URL لإعداد Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

يستخدم إعداد Docker المجمع عناوين URL تلك للمضيف كقيم افتراضية لتهيئة
LM Studio وOllama الأولية، ويعين `docker-compose.yml`‏ `host.docker.internal` إلى
Gateway مضيف Docker لمحرك Docker Engine على Linux. يوفر Docker Desktop
اسم المضيف نفسه بالفعل على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصا بك أو أمر `docker run`، فأضف تعيين المضيف نفسه
بنفسك، على سبيل المثال
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

عادة لا تمرر شبكة جسر Docker بث Bonjour/mDNS المتعدد
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المجمع
`OPENCLAW_DISABLE_BONJOUR=1` افتراضيا حتى لا يدخل Gateway في حلقة تعطل أو يعيد
تشغيل الإعلان مرارا عندما يسقط الجسر حركة البث المتعدد.

استخدم عنوان URL المنشور لـ Gateway أو Tailscale أو DNS-SD واسع النطاق لمضيفات Docker.
عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل مع شبكة المضيف أو macvlan،
أو شبكة أخرى يُعرف أن بث mDNS المتعدد يعمل فيها.

للمشكلات الشائعة واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose‏ `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تبقى تلك المسارات
بعد استبدال الحاوية. عندما لا يكون أي من المتغيرين معينا، يعود
`docker-compose.yml` المجمع إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لربط مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودا أيضا. يمنع ذلك `docker compose up` من
إصدار مواصفة وحدة تخزين ذات مصدر فارغ في البيئات المجردة.

دليل الإعدادات المربوط هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة للمزود
- `.env` للأسرار المدعومة بالبيئة في وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`

تخزن Plugins القابلة للتنزيل المثبتة حالة حزمها ضمن موطن OpenClaw المربوط،
لذلك تبقى سجلات تثبيت Plugin وجذور الحزم بعد استبدال الحاوية. لا ينشئ بدء Gateway
أشجار تبعيات Plugins المجمعة.

للحصول على تفاصيل الاستمرارية الكاملة في عمليات نشر VM، راجع
[زمن تشغيل VM الخاص بـ Docker - ما الذي يستمر وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط ازدياد مساحة القرص:** راقب `media/` وملفات JSONL للجلسات و`cron/runs/*.jsonl` وجذور حزم Plugin المثبتة وسجلات الملفات الدورية ضمن `/tmp/openclaw/`.

### مساعدات Shell (اختيارية)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّتت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وما إلى ذلك. شغّل
`clawdock-help` للاطلاع على جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل صندوق عزل الوكيل لـ Docker gateway">
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

    يوصّل السكربت `docker.sock` فقط بعد اجتياز متطلبات صندوق العزل. إذا تعذر
    إكمال إعداد صندوق العزل، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
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
    يستخدم `openclaw-cli` الإعداد `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا باعتباره حد ثقة
    مشتركا. يسقط إعداد compose الصلاحيات `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات و EACCES">
    تعمل الصورة باسم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن عمليات ربط المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادة بناء أسرع">
    رتّب Dockerfile بحيث تُخزّن طبقات الاعتماديات مؤقتا. هذا يتجنب إعادة تشغيل
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
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم غير جذر `node`. للحصول على
    حاوية أكثر اكتمالا من حيث الميزات:

    1. **استمرارية `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين اعتماديات النظام داخل الصورة**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **استمرارية تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    إعدادات Docker أو الإعدادات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة تشغيل Docker الرئيسية `node:24-bookworm-slim` وتنشر تعليقات OCI
    للصورة الأساسية، بما في ذلك `org.opencontainers.image.base.name` و
    `org.opencontainers.image.source` وغيرها. يتم تحديث ملخص صورة Node الأساسية
    عبر PRs صور Docker الأساسية من Dependabot؛ ولا تشغّل إصدارات الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صورة OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) لخطوات النشر على VM مشتركة
بما في ذلك تضمين الملفات الثنائية والاستمرارية والتحديثات.

## صندوق عزل الوكيل

عند تفعيل `agents.defaults.sandbox` باستخدام خلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (Shell، قراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزا صلبا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بأكمله
داخل حاوية.

يمكن أن يكون نطاق صندوق العزل لكل وكيل (افتراضيا)، أو لكل جلسة، أو مشتركا. يحصل كل نطاق
على مساحة عمل خاصة به موصولة عند `/workspace`. يمكنك أيضا تكوين
سياسات السماح/الرفض للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للحصول على التكوين الكامل والصور وملاحظات الأمان وملفات تعريف الوكلاء المتعددين، راجع:

- [صندوق العزل](/ar/gateway/sandboxing) -- مرجع صندوق العزل الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول Shell تفاعلي إلى حاويات صندوق العزل
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

ابن صورة صندوق العزل الافتراضية (من نسخة مصدر محلية):

```bash
scripts/sandbox-setup.sh
```

لتثبيتات npm من دون نسخة مصدر محلية، راجع [صندوق العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) للحصول على أوامر `docker build` المضمنة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية صندوق العزل لا تبدأ">
    ابن صورة صندوق العزل باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (نسخة مصدر محلية) أو أمر `docker build` المضمن من [صندوق العزل § الصور والإعداد](/ar/gateway/sandboxing#images-and-setup) (تثبيت npm)،
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في صندوق العزل">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل الموصولة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في صندوق العزل">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (Shell تسجيل دخول)، والذي يقرأ
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في المقدمة، أو أضف سكربتا ضمن `/etc/profile.d/` في Dockerfile.
  </Accordion>

  <Accordion title="إنهاء بسبب نفاد الذاكرة أثناء بناء الصورة (رمز الخروج 137)">
    تحتاج VM إلى ذاكرة RAM لا تقل عن 2 GB. استخدم فئة آلة أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو الاقتران مطلوب في واجهة التحكم">
    اجلب رابط لوحة معلومات جديدا ووافق على جهاز المتصفح:

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
- [ClawDock](/ar/install/clawdock) — إعداد مجتمع Docker Compose
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثا
- [التكوين](/ar/gateway/configuration) — تكوين Gateway بعد التثبيت

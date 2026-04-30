---
read_when:
    - تريد Gateway ضمن حاوية بدلاً من عمليات التثبيت المحلية
    - أنت تتحقق من صحة مسار Docker
summary: الإعداد والتهيئة الأولية الاختياريان المستندان إلى Docker لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-30T08:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو تريد التحقق من تدفق Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة وقابلة للرمي، أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: تعمل على جهازك الخاص وتريد فقط أسرع دورة تطوير. استخدم تدفق التثبيت العادي بدلا من ذلك.
- **ملاحظة حول العزل**: يستخدم محرك العزل الافتراضي Docker عند تفعيل العزل، لكن العزل معطل افتراضيا ولا يتطلب تشغيل Gateway بالكامل في Docker. تتوفر أيضا محركات عزل SSH وOpenShell. راجع [العزل](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد ينهى بسبب نفاد الذاكرة على مضيفات 1 GB مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغله على VPS/مضيف عام، راجع
  [تعزيز الأمان للتعرض الشبكي](/ar/gateway/security)،
  وخصوصا سياسة جدار حماية Docker `DOCKER-USER`.

## Gateway داخل حاوية

<Steps>
  <Step title="ابن الصورة">
    من جذر المستودع، شغل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    هذا يبني صورة Gateway محليا. لاستخدام صورة مبنية مسبقا بدلا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تنشر الصور المبنية مسبقا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`، `latest`، `<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="أكمل التهيئة الأولية">
    يشغل سكربت الإعداد التهيئة الأولية تلقائيا. سيقوم بما يلي:

    - طلب مفاتيح API الخاصة بالمزود
    - توليد رمز Gateway وكتابته في `.env`
    - بدء Gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولية قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. `openclaw-cli` مخصص للأوامر التي تشغلها بعد
    وجود حاوية Gateway بالفعل.

  </Step>

  <Step title="افتح واجهة التحكم">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق السر المشترك المكون
    في Settings. يكتب سكربت الإعداد رمزا إلى `.env` افتراضيا؛ إذا بدلت إعداد
    الحاوية إلى مصادقة كلمة المرور، فاستخدم تلك الكلمة بدلا من ذلك.

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

### التدفق اليدوي

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
شغل `docker compose` من جذر المستودع. إذا فعّلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، يكتب سكربت الإعداد `docker-compose.extra.yml`؛
ضمّنه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة اسم الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغل التهيئة
الأولية وكتابات الإعداد وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                                    | الغرض                                                          |
| ------------------------------------------ | -------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | استخدام صورة بعيدة بدلا من البناء محليا                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | تثبيت حزم apt إضافية أثناء البناء (مفصولة بمسافات)            |
| `OPENCLAW_EXTENSIONS`                      | تثبيت تبعيات Plugin مسبقا وقت البناء (أسماء مفصولة بمسافات)  |
| `OPENCLAW_EXTRA_MOUNTS`                    | ربطات تحميل إضافية من المضيف (مفصولة بفواصل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | إبقاء `/home/node` في مجلد Docker مسمى                        |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | مسار الحاوية لتبعيات Plugin المجمعة والمرايا المولدة          |
| `OPENCLAW_SANDBOX`                         | الاشتراك في تمهيد العزل (`1`، `true`، `yes`، `on`)            |
| `OPENCLAW_SKIP_ONBOARDING`                 | تخطي خطوة التهيئة الأولية التفاعلية (`1`، `true`، `yes`، `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | تجاوز مسار مقبس Docker                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | تعطيل إعلان Bonjour/mDNS (الافتراضي `1` مع Docker)           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل طبقات ربط تحميل مصدر Plugin المجمعة                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | نقطة نهاية جامع OTLP/HTTP المشتركة لتصدير OpenTelemetry      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | نقاط نهاية OTLP الخاصة بالإشارات للتتبعات أو المقاييس أو السجلات |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | تجاوز بروتوكول OTLP. يدعم اليوم `http/protobuf` فقط          |
| `OTEL_SERVICE_NAME`                        | اسم الخدمة المستخدم لموارد OpenTelemetry                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | الاشتراك في أحدث سمات GenAI الدلالية التجريبية               |
| `OPENCLAW_OTEL_PRELOADED`                  | تخطي بدء SDK OpenTelemetry ثان عند تحميل واحد مسبقا          |

يمكن للمشرفين اختبار مصدر Plugin المجمعة مقابل صورة معبأة عن طريق تحميل
دليل مصدر Plugin واحد فوق مسار مصدره المعبأ، مثلا
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المحمل ذلك حزمة
`/app/dist/extensions/synology-chat` المترجمة المطابقة لنفس معرف Plugin.

### قابلية المراقبة

يكون تصدير OpenTelemetry صادرا من حاوية Gateway إلى جامع OTLP لديك. لا يتطلب
ذلك منفذ Docker منشورا. إذا بنيت الصورة محليا وتريد أن يكون مصدر OpenTelemetry
المجمع متاحا داخل الصورة، فضمّن تبعيات وقت التشغيل الخاصة به:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

تتضمن صورة إصدار Docker الرسمية من OpenClaw مصدر Plugin
`diagnostics-otel` المجمع. اعتمادا على الصورة وحالة التخزين المؤقت، قد يظل
Gateway يجهز تبعيات وقت تشغيل OpenTelemetry المحلية لـ Plugin في أول مرة
يفعل فيها Plugin، لذلك اسمح لأول إقلاع بالوصول إلى سجل الحزم أو سخن الصورة
مسبقا في مسار الإصدار لديك. لتفعيل التصدير، اسمح بـ Plugin `diagnostics-otel`
وفعّله في الإعدادات، ثم عيّن `diagnostics.otel.enabled=true` أو استخدم مثال
الإعدادات في [تصدير OpenTelemetry](/ar/gateway/opentelemetry). تضبط ترويسات
مصادقة الجامع عبر `diagnostics.otel.headers`، وليس عبر متغيرات بيئة Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور بالفعل. فعّل Plugin
`diagnostics-prometheus`، ثم اجمع:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

هذا المسار محمي بمصادقة Gateway. لا تعرض منفذ `/metrics` عاما منفصلا أو مسار
وكيل عكسي غير مصادق. راجع [مقاييس Prometheus](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker فحص `HEALTHCHECK` مدمجا يطلب `/healthz`.
إذا استمرت الفحوصات في الفشل، يعلّم Docker الحاوية على أنها `unhealthy` ويمكن
لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة مصادق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` افتراضيا `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل
وصول المضيف إلى `http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ Gateway المنشور.
- `loopback`: لا يمكن إلا للعمليات داخل مساحة اسم شبكة الحاوية الوصول إلى
  Gateway مباشرة.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس أسماء مضيفين بديلة مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### مزودو المضيف المحليون

عندما يعمل OpenClaw في Docker، فإن `127.0.0.1` داخل الحاوية هو الحاوية نفسها،
وليس جهاز المضيف لديك. استخدم `host.docker.internal` لمزودي AI الذين يعملون
على المضيف:

| المزود    | رابط المضيف الافتراضي     | رابط إعداد Docker                    |
| --------- | -------------------------- | ------------------------------------ |
| LM Studio | `http://127.0.0.1:1234`    | `http://host.docker.internal:1234`   |
| Ollama    | `http://127.0.0.1:11434`   | `http://host.docker.internal:11434`  |

يستخدم إعداد Docker المجمع تلك روابط المضيف كإعدادات تهيئة أولية افتراضية
لـ LM Studio وOllama، ويعيّن `docker-compose.yml` الاسم `host.docker.internal`
إلى Gateway مضيف Docker لمحرك Docker Engine على Linux. يوفر Docker Desktop
اسم المضيف نفسه بالفعل على macOS وWindows.

يجب أن تستمع خدمات المضيف أيضا على عنوان يمكن الوصول إليه من Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

إذا كنت تستخدم ملف Compose خاصا بك أو أمر `docker run`، فأضف ربط المضيف نفسه
بنفسك، مثلا
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

لا تمرر شبكة Docker bridge عادة بث Bonjour/mDNS متعدد الوجهات
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المجمع افتراضيا
`OPENCLAW_DISABLE_BONJOUR=1` حتى لا يدخل Gateway في حلقة انهيار أو يعيد تشغيل
الإعلان مرارا عندما تسقط الشبكة الجسرية حركة البث متعدد الوجهات.

استخدم رابط Gateway المنشور أو Tailscale أو DNS-SD واسع النطاق لمضيفات Docker.
عيّن `OPENCLAW_DISABLE_BONJOUR=0` فقط عند التشغيل بشبكة المضيف أو macvlan
أو شبكة أخرى معروف أن بث mDNS متعدد الوجهات يعمل فيها.

للملاحظات واستكشاف الأخطاء وإصلاحها، راجع [اكتشاف Bonjour](/ar/gateway/bonjour).

### التخزين والاستمرارية

يربط Docker Compose ‏`OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، لذلك تبقى تلك
المسارات بعد استبدال الحاوية. عندما لا يكون أي من المتغيرين معينا، يعود
`docker-compose.yml` المجمع إلى `${HOME}/.openclaw` (و
`${HOME}/.openclaw/workspace` لتحميل مساحة العمل)، أو `/tmp/.openclaw`
عندما يكون `HOME` نفسه مفقودا أيضا. هذا يمنع `docker compose up` من إصدار
مواصفة مجلد بمصدر فارغ في البيئات المجردة.

دليل الإعداد المحمل هذا هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المحفوظة لمزودي الخدمة
- `.env` للأسرار المدعومة بالبيئة وقت التشغيل مثل `OPENCLAW_GATEWAY_TOKEN`

اعتماديات وقت تشغيل Plugin المضمّنة وملفات وقت التشغيل المنسوخة مرآتيًا هي حالة مولّدة، وليست إعدادات مستخدم. يخزّنها Compose في وحدة تخزين Docker المسماة `openclaw-plugin-runtime-deps` والمثبتة عند `/var/lib/openclaw/plugin-runtime-deps`. إن إبقاء هذه الشجرة كثيرة التغيّر خارج تثبيت ربط إعدادات المضيف يتجنب بطء عمليات ملفات Docker Desktop/WSL والمقابض القديمة في Windows أثناء بدء تشغيل Gateway البارد.

يضبط ملف Compose الافتراضي `OPENCLAW_PLUGIN_STAGE_DIR` على ذلك المسار لكل من `openclaw-gateway` و`openclaw-cli`، لذلك تستخدم أوامر `openclaw doctor --fix`، وأوامر تسجيل الدخول/الإعداد للقنوات، وبدء تشغيل Gateway جميعها وحدة تخزين وقت التشغيل المولّدة نفسها.

للحصول على التفاصيل الكاملة للاستمرارية في عمليات النشر على VM، راجع
[وقت تشغيل Docker VM - ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where).

**النقاط الساخنة لنمو القرص:** راقب `media/`، وملفات JSONL للجلسات، و`cron/runs/*.jsonl`، ووحدة تخزين Docker `openclaw-plugin-runtime-deps`، وسجلات الملفات المتداولة تحت `/tmp/openclaw/`.

### مساعدات Shell (اختيارية)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتتبع ملف المساعد المحلي الموقع الجديد.

ثم استخدم `clawdock-start`، و`clawdock-stop`، و`clawdock-dashboard`، وما إلى ذلك. شغّل
`clawdock-help` للاطلاع على كل الأوامر.
راجع [ClawDock](/ar/install/clawdock) للاطلاع على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="تفعيل صندوق حماية الوكيل لـ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    مسار socket مخصص (مثل Docker بلا صلاحيات root):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    يثبت السكربت `docker.sock` فقط بعد اجتياز متطلبات صندوق الحماية. إذا تعذر إكمال إعداد صندوق الحماية، يعيد السكربت ضبط `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص pseudo-TTY في Compose باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمان الشبكة المشتركة">
    يستخدم `openclaw-cli` الإعداد `network_mode: "service:openclaw-gateway"` حتى تتمكن أوامر CLI
    من الوصول إلى Gateway عبر `127.0.0.1`. تعامل مع هذا على أنه حد ثقة مشترك. يسقط إعداد compose
    الصلاحيتين `NET_RAW`/`NET_ADMIN` ويفعّل
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة كمستخدم `node` (uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن تثبيتات الربط من المضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادة بناء أسرع">
    رتّب Dockerfile بحيث تُخزّن طبقات الاعتماديات مؤقتًا. يتجنب هذا إعادة تشغيل
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
    الصورة الافتراضية تعطي الأولوية للأمان وتعمل كمستخدم غير root باسم `node`. لحاوية أكثر
    اكتمالًا في الميزات:

    1. **استمرار `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **تضمين اعتماديات النظام**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **تثبيت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **استمرار تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    Docker أو الإعدادات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه والصقه
    مجددًا في المعالج لإنهاء المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة وقت تشغيل Docker الرئيسية `node:24-bookworm-slim` وتنشر تعليقات OCI
    للصورة الأساسية، بما في ذلك `org.opencontainers.image.base.name`،
    و`org.opencontainers.image.source`، وغيرها. يُحدّث ملخص صورة Node الأساسية
    عبر PRs صور Docker الأساسية من Dependabot؛ ولا تشغّل بُنى الإصدار
    طبقة ترقية للتوزيعة. راجع
    [تعليقات صورة OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تشغّله على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[وقت تشغيل Docker VM](/ar/install/docker-vm-runtime) للاطلاع على خطوات النشر المشتركة على VM
بما في ذلك تضمين الثنائيات، والاستمرارية، والتحديثات.

## صندوق حماية الوكيل

عند تفعيل `agents.defaults.sandbox` مع الواجهة الخلفية Docker، يشغّل Gateway
تنفيذ أدوات الوكيل (Shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما يبقى Gateway نفسه على المضيف. يمنحك هذا حاجزًا صارمًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون وضع Gateway بالكامل
داخل حاوية.

يمكن أن يكون نطاق صندوق الحماية لكل وكيل (افتراضي)، أو لكل جلسة، أو مشتركًا. يحصل كل نطاق
على مساحة عمل خاصة به مثبتة عند `/workspace`. يمكنك أيضًا إعداد
سياسات السماح/الرفض للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات المتصفح.

للحصول على الإعداد الكامل، والصور، وملاحظات الأمان، وملفات تعريف الوكلاء المتعددين، راجع:

- [العزل بصندوق حماية](/ar/gateway/sandboxing) -- مرجع صندوق الحماية الكامل
- [OpenShell](/ar/gateway/openshell) -- وصول Shell تفاعلي إلى حاويات صندوق الحماية
- [صندوق حماية وأدوات الوكلاء المتعددين](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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

ابنِ صورة صندوق الحماية الافتراضية:

```bash
scripts/sandbox-setup.sh
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية صندوق الحماية لا تبدأ">
    ابنِ صورة صندوق الحماية باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    تُنشأ الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات في صندوق الحماية">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المثبتة لديك،
    أو غيّر ملكية مجلد مساحة العمل باستخدام chown.
  </Accordion>

  <Accordion title="الأدوات المخصصة غير موجودة في صندوق الحماية">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، والذي يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة مسارات
    أدواتك المخصصة في المقدمة، أو أضف سكربتًا تحت `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="انتهت عملية بناء الصورة بسبب OOM (exit 137)">
    يحتاج VM إلى 2 GB RAM على الأقل. استخدم فئة آلة أكبر وأعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو الاقتران مطلوب في Control UI">
    اجلب رابط لوحة معلومات جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    تفاصيل إضافية: [لوحة المعلومات](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

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
- [الإعدادات](/ar/gateway/configuration) — إعداد Gateway بعد التثبيت

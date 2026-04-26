---
read_when:
    - أنت تريد Gateway داخل حاوية بدلًا من التثبيتات المحلية
    - أنت تتحقق من تدفق Docker
summary: إعداد وتهيئة اختيارية لـ OpenClaw باستخدام Docker
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:32:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

يُعد Docker **اختياريًا**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو تريد التحقق من تدفق Docker.

## هل Docker مناسب لي؟

- **نعم**: إذا كنت تريد بيئة Gateway معزولة وقابلة للتخلص منها أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: إذا كنت تشغله على جهازك الشخصي وتريد أسرع دورة تطوير. استخدم تدفق التثبيت العادي بدلًا من ذلك.
- **ملاحظة حول sandboxing**: يستخدم backend الافتراضي للـ sandbox Docker عندما يكون sandboxing مفعّلًا، لكن sandboxing معطّل افتراضيًا ولا **يتطلب** تشغيل Gateway بالكامل داخل Docker. كما تتوفر أيضًا backends من نوع SSH وOpenShell للـ sandbox. راجع [Sandboxing](/ar/gateway/sandboxing).

## المتطلبات الأساسية

- Docker Desktop (أو Docker Engine) + Docker Compose v2
- ذاكرة RAM لا تقل عن 2 GB لبناء الصورة (قد يتم قتل `pnpm install` بسبب OOM على المضيفات ذات 1 GB مع exit 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغّل على VPS/مضيف عام، فراجع
  [Security hardening for network exposure](/ar/gateway/security)،
  وخاصة سياسة جدار الحماية Docker `DOCKER-USER`.

## Gateway داخل حاوية

<Steps>
  <Step title="ابنِ الصورة">
    من جذر المستودع، شغّل سكربت الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة gateway محليًا. لاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main` و`latest` و`<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="أكمِل التهيئة الأولى">
    يشغّل سكربت الإعداد التهيئة الأولى تلقائيًا. وسوف:

    - يطلب مفاتيح API الخاصة بالمزوّد
    - يولد token للـ gateway ويكتبه إلى `.env`
    - يبدأ gateway عبر Docker Compose

    أثناء الإعداد، تعمل التهيئة الأولى قبل البدء وكتابات config عبر
    `openclaw-gateway` مباشرةً. أما `openclaw-cli` فهو للأوامر التي تشغّلها بعد
    أن تكون حاوية gateway موجودة بالفعل.

  </Step>

  <Step title="افتح Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك والصق
    السر المشترك المكوَّن ضمن Settings. يكتب سكربت الإعداد token إلى `.env`
    افتراضيًا؛ وإذا غيّرت إعداد الحاوية إلى مصادقة بكلمة مرور، فاستخدم تلك
    الكلمة بدلًا منه.

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

### التدفق اليدوي

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
شغّل `docker compose` من جذر المستودع. وإذا فعّلت `OPENCLAW_EXTRA_MOUNTS`
أو `OPENCLAW_HOME_VOLUME`، فسيكتب سكربت الإعداد `docker-compose.extra.yml`؛
ضمّنه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
نظرًا لأن `openclaw-cli` يشارك مساحة اسم الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. قبل `docker compose up -d openclaw-gateway`، شغّل التهيئة الأولى
وكتابات الإعدادات وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل سكربت الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير | الغرض |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE` | استخدام صورة بعيدة بدلًا من البناء محليًا |
| `OPENCLAW_DOCKER_APT_PACKAGES` | تثبيت حزم apt إضافية أثناء البناء (أسماء مفصولة بمسافات) |
| `OPENCLAW_EXTENSIONS` | تثبيت اعتماديات Plugin مسبقًا وقت البناء (أسماء مفصولة بمسافات) |
| `OPENCLAW_EXTRA_MOUNTS` | bind mounts إضافية من المضيف (قيم مفصولة بفواصل من الشكل `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME` | الإبقاء على `/home/node` في Docker volume مسمّى |
| `OPENCLAW_SANDBOX` | تمكين bootstrap للـ sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET` | تجاوز مسار Docker socket |
| `OPENCLAW_DISABLE_BONJOUR` | تعطيل إعلان Bonjour/mDNS (القيمة الافتراضية `1` مع Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | تعطيل bind-mount overlays لمصادر Plugins المضمّنة |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | نقطة نهاية OTLP/HTTP المشتركة لتصدير OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT` | نقاط نهاية OTLP خاصة بكل إشارة للتتبعات أو المقاييس أو السجلات |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | تجاوز بروتوكول OTLP. المدعوم حاليًا هو `http/protobuf` فقط |
| `OTEL_SERVICE_NAME` | اسم الخدمة المستخدم لموارد OpenTelemetry |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | تمكين أحدث السمات الدلالية التجريبية لـ GenAI |
| `OPENCLAW_OTEL_PRELOADED` | تخطّي بدء OpenTelemetry SDK ثانٍ عندما يكون أحدها محمّلًا مسبقًا |

يمكن للمحافظين اختبار مصدر Plugin مضمّنة مقابل صورة مُعبّأة من خلال ربط
دليل مصدر Plugin واحد فوق مسار المصدر المعبّأ الخاص به، مثلًا:
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
يتجاوز دليل المصدر المركّب هذا الحزمة المترجمة المطابقة
`/app/dist/extensions/synology-chat` للـ Plugin ذات المعرّف نفسه.

### قابلية الملاحظة

يكون تصدير OpenTelemetry صادرًا من حاوية Gateway إلى مجمّع OTLP
الخاص بك. ولا يتطلب منفذ Docker منشورًا. وإذا كنت تبني الصورة
محليًا وتريد أن يكون مُصدِّر OpenTelemetry المضمّن متاحًا داخل الصورة،
فضمّن اعتماديات وقت تشغيله:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

تتضمن صورة إصدار Docker الرسمية لـ OpenClaw مصدر Plugin
`diagnostics-otel` المضمّنة. واعتمادًا على الصورة وحالة cache، قد يظل
Gateway بحاجة إلى تجهيز اعتماديات OpenTelemetry المحلية الخاصة بالـ Plugin في
أول مرة يتم فيها تمكين الـ Plugin، لذا اسمح لهذا الإقلاع الأول بالوصول إلى
سجل الحزم أو قم بتسخين الصورة مسبقًا في مسار الإصدار لديك. ولتمكين التصدير،
اسمح ومكّن Plugin ‏`diagnostics-otel` في config، ثم اضبط
`diagnostics.otel.enabled=true` أو استخدم مثال config الموجود في
[OpenTelemetry export](/ar/gateway/opentelemetry). وتُضبط رؤوس مصادقة المجمّع عبر
`diagnostics.otel.headers`، وليس عبر متغيرات البيئة في Docker.

تستخدم مقاييس Prometheus منفذ Gateway المنشور أصلًا. فعّل Plugin
`diagnostics-prometheus`، ثم اجمع من:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

هذا المسار محمي بمصادقة Gateway. لا تكشف منفذ `/metrics` عامًا منفصلًا أو
مسار reverse-proxy غير موثّق. راجع
[Prometheus metrics](/ar/gateway/prometheus).

### فحوصات الصحة

نقاط نهاية فحص الحاوية (لا تتطلب مصادقة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # الحيوية
curl -fsS http://127.0.0.1:18789/readyz     # الجهوزية
```

تتضمن صورة Docker قيمة `HEALTHCHECK` مضمّنة تقوم بفحص `/healthz`.
إذا استمرت الفحوصات في الفشل، يضع Docker الحاوية في حالة `unhealthy`
ويمكن لأنظمة orchestration إعادة تشغيلها أو استبدالها.

لقطة صحة عميقة موثّقة:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يضبط `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI المضيف الوصول إلى منفذ gateway المنشور.
- `loopback`: لا يمكن إلا للعمليات داخل مساحة اسم شبكة الحاوية الوصول
  إلى gateway مباشرةً.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس الأسماء المستعارة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### Bonjour / mDNS

عادةً لا تقوم شبكات الجسر في Docker بتمرير بث Bonjour/mDNS متعدد الإرسال
(`224.0.0.251:5353`) بشكل موثوق. لذلك يضبط إعداد Compose المضمّن افتراضيًا
`OPENCLAW_DISABLE_BONJOUR=1` بحيث لا يدخل Gateway في حلقة انهيار أو
إعادة تشغيل متكرر للإعلان عندما يسقط الجسر حركة multicast.

استخدم عنوان URL المنشور للـ Gateway، أو Tailscale، أو DNS-SD واسع النطاق لمضيفات Docker.
اضبط `OPENCLAW_DISABLE_BONJOUR=0` فقط عندما تعمل مع host networking أو macvlan
أو شبكة أخرى معروف أن mDNS multicast يعمل فيها.

للاطلاع على المزالق واستكشاف الأخطاء، راجع [Bonjour discovery](/ar/gateway/bonjour).

### التخزين والاستمرارية

يقوم Docker Compose بعمل bind-mount لكل من `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تستمر هذه
المسارات بعد استبدال الحاوية.

وهذا الدليل المركّب للإعدادات هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة الخاصة بالمزوّد
- `.env` للأسرار وقت التشغيل المعتمدة على env مثل `OPENCLAW_GATEWAY_TOKEN`

للحصول على تفاصيل الاستمرارية الكاملة في عمليات النشر على VM، راجع
[Docker VM Runtime - What persists where](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص الساخنة:** راقب `media/`، وملفات JSONL الخاصة بالجلسات، و`cron/runs/*.jsonl`,
وسجلات الملفات الدوّارة ضمن `/tmp/openclaw/`.

### مساعدات shell (اختياري)

لتسهيل الإدارة اليومية لـ Docker، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت `ClawDock` من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه بحيث يتتبع ملف المساعدة المحلي لديك الموقع الجديد.

بعد ذلك استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard` وغيرها. شغّل
`clawdock-help` لعرض جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على الدليل الكامل للمساعد.

<AccordionGroup>
  <Accordion title="تمكين agent sandbox لبوابة Docker">
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

    يقوم السكربت بربط `docker.sock` فقط بعد اجتياز متطلبات sandbox الأساسية. وإذا
    تعذر إكمال إعداد sandbox، فسيعيد السكربت تعيين `agents.defaults.sandbox.mode`
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
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` بحيث
    يمكن لأوامر CLI الوصول إلى gateway عبر `127.0.0.1`. تعامل مع هذا على
    أنه حد ثقة مشترك. يقوم إعداد compose بإسقاط `NET_RAW`/`NET_ADMIN` ويمكّن
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة كمستخدم `node` ‏(uid 1000). إذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن bind mounts الخاصة بالمضيف مملوكة لـ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادات بناء أسرع">
    رتّب Dockerfile بحيث تكون طبقات الاعتماديات مخزنة مؤقتًا. وهذا يتجنب إعادة تشغيل
    `pnpm install` ما لم تتغير lockfiles:

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
    الصورة الافتراضية تضع الأمان أولًا وتعمل كمستخدم `node` غير root. ولحاوية
    أكثر غنىً بالميزات:

    1. **أبقِ `/home/node`**: ‏`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ضمّن اعتماديات النظام**: ‏`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ثبّت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **أبقِ تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فسيفتح عنوان URL في المتصفح. في
    إعدادات Docker أو البيئات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه ثم الصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="بيانات تعريف الصورة الأساسية">
    تستخدم صورة Docker الرئيسية `node:24-bookworm` وتنشر تعليقات OCI
    الخاصة بالصورة الأساسية بما في ذلك `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. راجع
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تعمل على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[Docker VM Runtime](/ar/install/docker-vm-runtime) لخطوات النشر على VM المشتركة
بما في ذلك تضمين الـ binaries، والاستمرارية، والتحديثات.

## Agent Sandbox

عندما يتم تمكين `agents.defaults.sandbox` مع Docker backend، فإن gateway
يشغّل تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، إلخ) داخل حاويات Docker
معزولة بينما يبقى gateway نفسه على المضيف. ويمنحك هذا جدارًا صلبًا
حول جلسات الوكلاء غير الموثوقين أو متعددة المستأجرين من دون وضع الـ
gateway بالكامل داخل حاوية.

يمكن أن يكون نطاق sandbox لكل وكيل (الافتراضي)، أو لكل جلسة، أو مشتركًا. ويحصل كل
نطاق على مساحة عمل خاصة به مركبة عند `/workspace`. ويمكنك أيضًا تكوين
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على الإعداد الكامل، والصور، والملاحظات الأمنية، وملفات تعريف متعددة الوكلاء، راجع:

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل للـ sandbox
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات sandbox
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

### تمكين سريع

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

ابنِ صورة sandbox الافتراضية:

```bash
scripts/sandbox-setup.sh
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو حاوية sandbox لا تبدأ">
    ابنِ صورة sandbox باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    يتم إنشاء الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء الأذونات داخل sandbox">
    اضبط `docker.user` إلى UID:GID يطابق ملكية مساحة العمل المركبة،
    أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="أدوات مخصصة غير موجودة داخل sandbox">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` (login shell)، الذي يحمّل
    `/etc/profile` وقد يعيد ضبط PATH. اضبط `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في البداية، أو أضف سكربت ضمن `/etc/profile.d/` في Dockerfile.
  </Accordion>

  <Accordion title="تم القتل بسبب OOM أثناء بناء الصورة (exit 137)">
    تحتاج VM إلى 2 GB RAM على الأقل. استخدم فئة جهاز أكبر ثم أعد المحاولة.
  </Accordion>

  <Accordion title="Unauthorized أو pairing required في Control UI">
    اجلب رابط dashboard جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [Dashboard](/ar/web/dashboard)، [Devices](/ar/cli/devices).

  </Accordion>

  <Accordion title="يُظهر هدف Gateway القيمة ws://172.x.x.x أو أخطاء pairing من Docker CLI">
    أعد ضبط وضع gateway والربط:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

- [Install Overview](/ar/install) — جميع طرق التثبيت
- [Podman](/ar/install/podman) — بديل Podman لـ Docker
- [ClawDock](/ar/install/clawdock) — إعداد Docker Compose مجتمعي
- [Updating](/ar/install/updating) — إبقاء OpenClaw محدّثًا
- [Configuration](/ar/gateway/configuration) — إعدادات gateway بعد التثبيت

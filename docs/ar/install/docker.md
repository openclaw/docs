---
read_when:
    - تريد Gateway داخل حاوية بدلًا من تثبيتات محلية
    - أنت تتحقق من تدفق Docker
summary: إعداد اختياري قائم على Docker والإعداد الأولي لـ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T07:47:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker **اختياري**. استخدمه فقط إذا كنت تريد Gateway داخل حاوية أو تريد التحقق من تدفق Docker.

## هل Docker مناسب لي؟

- **نعم**: تريد بيئة Gateway معزولة يمكن التخلص منها أو تريد تشغيل OpenClaw على مضيف من دون تثبيتات محلية.
- **لا**: أنت تشغّله على جهازك وتريد فقط أسرع حلقة تطوير. استخدم تدفق التثبيت العادي بدلًا من ذلك.
- **ملاحظة حول sandboxing**: تستخدم الواجهة الخلفية الافتراضية لـ sandbox Docker عندما يكون sandboxing مفعّلًا، لكن sandboxing يكون معطلًا افتراضيًا ولا **يتطلب** تشغيل Gateway كاملة داخل Docker. كما تتوفر أيضًا واجهات SSH وOpenShell الخلفية الخاصة بـ sandbox. راجع [Sandboxing](/ar/gateway/sandboxing).

## المتطلبات المسبقة

- Docker Desktop ‏(أو Docker Engine) + Docker Compose v2
- ذاكرة لا تقل عن 2 GB لبناء الصورة (`pnpm install` قد يُقتل بسبب OOM على مضيفات 1 GB مع رمز الخروج 137)
- مساحة قرص كافية للصور والسجلات
- إذا كنت تشغّله على VPS/مضيف عام، فراجع
  [التقوية الأمنية للتعرض الشبكي](/ar/gateway/security)،
  وبخاصة سياسة جدار الحماية `DOCKER-USER` الخاصة بـ Docker.

## Gateway داخل حاوية

<Steps>
  <Step title="ابنِ الصورة">
    من جذر المستودع، شغّل نص الإعداد:

    ```bash
    ./scripts/docker/setup.sh
    ```

    يؤدي هذا إلى بناء صورة gateway محليًا. ولاستخدام صورة مبنية مسبقًا بدلًا من ذلك:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    تُنشر الصور المبنية مسبقًا في
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    الوسوم الشائعة: `main`, `latest`, `<version>` (مثل `2026.2.26`).

  </Step>

  <Step title="أكمل الإعداد الأولي">
    يشغّل نص الإعداد الإعداد الأولي تلقائيًا. وسيقوم بما يلي:

    - مطالبتك بمفاتيح API الخاصة بالمزوّدين
    - توليد رمز Gateway وكتابته إلى `.env`
    - بدء gateway عبر Docker Compose

    أثناء الإعداد، تعمل عمليات الإعداد الأولي قبل البدء وكتابات الإعدادات عبر
    `openclaw-gateway` مباشرة. أما `openclaw-cli` فهو مخصص للأوامر التي تشغّلها بعد
    أن تصبح حاوية gateway موجودة بالفعل.

  </Step>

  <Step title="افتح Control UI">
    افتح `http://127.0.0.1:18789/` في متصفحك وألصق
    السر المشترك المضبوط في الإعدادات. يكتب نص الإعداد رمزًا إلى `.env`
    افتراضيًا؛ وإذا بدلت إعداد الحاوية إلى مصادقة بكلمة المرور، فاستخدم تلك
    الكلمة بدلًا من ذلك.

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

إذا كنت تفضّل تشغيل كل خطوة بنفسك بدلًا من استخدام نص الإعداد:

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
أو `OPENCLAW_HOME_VOLUME`، فإن نص الإعداد يكتب `docker-compose.extra.yml`؛ قم
بتضمينه باستخدام `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
لأن `openclaw-cli` يشارك مساحة أسماء الشبكة الخاصة بـ `openclaw-gateway`، فهو
أداة لما بعد البدء. وقبل `docker compose up -d openclaw-gateway`، شغّل الإعداد الأولي
وكتابات إعدادات وقت الإعداد عبر `openclaw-gateway` باستخدام
`--no-deps --entrypoint node`.
</Note>

### متغيرات البيئة

يقبل نص الإعداد متغيرات البيئة الاختيارية التالية:

| المتغير                       | الغرض                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`             | استخدام صورة بعيدة بدلًا من البناء محليًا                      |
| `OPENCLAW_DOCKER_APT_PACKAGES` | تثبيت حزم apt إضافية أثناء البناء (أسماء مفصولة بمسافات)      |
| `OPENCLAW_EXTENSIONS`        | تثبيت تبعيات Plugin مسبقًا وقت البناء (أسماء مفصولة بمسافات)   |
| `OPENCLAW_EXTRA_MOUNTS`      | bind mounts إضافية من المضيف (بتنسيق `source:target[:opts]` مفصول بفواصل) |
| `OPENCLAW_HOME_VOLUME`       | حفظ `/home/node` في Docker volume مسماة                         |
| `OPENCLAW_SANDBOX`           | الاشتراك في bootstrap الخاص بـ sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`     | تجاوز مسار Docker socket                                       |

### فحوصات السلامة

نقاط نهاية probe الخاصة بالحاوية (من دون مصادقة مطلوبة):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

تتضمن صورة Docker قيمة `HEALTHCHECK` مدمجة تستدعي `/healthz`.
وإذا استمرت الفحوصات في الفشل، فإن Docker يضع علامة `unhealthy` على الحاوية
ويمكن لأنظمة التنسيق إعادة تشغيلها أو استبدالها.

لقطة سلامة عميقة مصادَق عليها:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN مقابل loopback

يستخدم `scripts/docker/setup.sh` القيمة الافتراضية `OPENCLAW_GATEWAY_BIND=lan` بحيث يعمل وصول المضيف إلى
`http://127.0.0.1:18789` مع نشر منافذ Docker.

- `lan` (الافتراضي): يمكن لمتصفح المضيف وCLI على المضيف الوصول إلى منفذ gateway المنشور.
- `loopback`: لا تستطيع الوصول إلى gateway مباشرةً إلا العمليات داخل مساحة أسماء شبكة الحاوية.

<Note>
استخدم قيم وضع الربط في `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`)، وليس الأسماء البديلة للمضيف مثل `0.0.0.0` أو `127.0.0.1`.
</Note>

### التخزين والاستمرارية

يقوم Docker Compose بعمل bind-mount لـ `OPENCLAW_CONFIG_DIR` إلى `/home/node/.openclaw` و
`OPENCLAW_WORKSPACE_DIR` إلى `/home/node/.openclaw/workspace`، بحيث تبقى تلك المسارات
بعد استبدال الحاوية.

هذا الدليل المضبوط للإعدادات هو المكان الذي يحتفظ فيه OpenClaw بما يلي:

- `openclaw.json` لإعدادات السلوك
- `agents/<agentId>/agent/auth-profiles.json` لمصادقة OAuth/API-key المخزنة للمزوّد
- `.env` للأسرار وقت التشغيل المدعومة بالبيئة مثل `OPENCLAW_GATEWAY_TOKEN`

للاطلاع على التفاصيل الكاملة للاستمرارية في عمليات النشر على VM، راجع
[Docker VM Runtime - ما الذي يبقى وأين](/ar/install/docker-vm-runtime#what-persists-where).

**نقاط نمو القرص الساخنة:** راقب `media/`, وملفات JSONL الخاصة بالجلسات، و`cron/runs/*.jsonl`,
وسجلات الملفات الدوارة تحت `/tmp/openclaw/`.

### مساعدات shell ‏(اختيارية)

لتسهيل إدارة Docker اليومية، ثبّت `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

إذا كنت قد ثبّت ClawDock من المسار الخام الأقدم `scripts/shell-helpers/clawdock-helpers.sh`، فأعد تشغيل أمر التثبيت أعلاه حتى يتابع ملف المساعدة المحلي لديك الموقع الجديد.

ثم استخدم `clawdock-start` و`clawdock-stop` و`clawdock-dashboard`، وغير ذلك. شغّل
`clawdock-help` للحصول على جميع الأوامر.
راجع [ClawDock](/ar/install/clawdock) للحصول على دليل المساعد الكامل.

<AccordionGroup>
  <Accordion title="فعّل sandbox الخاص بالوكيل لـ Docker gateway">
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

    لا يقوم النص بربط `docker.sock` إلا بعد اجتياز المتطلبات المسبقة الخاصة بـ sandbox. وإذا
    لم يكتمل إعداد sandbox، فإن النص يعيد تعيين `agents.defaults.sandbox.mode`
    إلى `off`.

  </Accordion>

  <Accordion title="الأتمتة / CI (غير تفاعلي)">
    عطّل تخصيص Compose pseudo-TTY باستخدام `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="ملاحظة أمنية حول الشبكة المشتركة">
    يستخدم `openclaw-cli` القيمة `network_mode: "service:openclaw-gateway"` بحيث تستطيع
    أوامر CLI الوصول إلى gateway عبر `127.0.0.1`. تعامل مع هذا بوصفه
    حدًا مشتركًا للثقة. ويقوم إعداد compose بإسقاط `NET_RAW`/`NET_ADMIN` وبتفعيل
    `no-new-privileges` على `openclaw-cli`.
  </Accordion>

  <Accordion title="الأذونات وEACCES">
    تعمل الصورة بوصفها المستخدم `node` ‏(uid 1000). وإذا رأيت أخطاء أذونات على
    `/home/node/.openclaw`، فتأكد من أن bind mounts على المضيف مملوكة للمعرّف uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="إعادات بناء أسرع">
    رتّب Dockerfile بحيث يتم تخزين طبقات التبعيات مؤقتًا. فهذا يتجنب إعادة تشغيل
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

  <Accordion title="خيارات حاويات للمستخدمين المتقدمين">
    الصورة الافتراضية تركز على الأمان أولًا وتعمل بوصفها المستخدم غير الجذر `node`. وللحصول على
    حاوية أكثر اكتمالًا من حيث الميزات:

    1. **احفظ `/home/node`**: ‏`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ضمّن تبعيات النظام**: ‏`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ثبّت متصفحات Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **احفظ تنزيلات المتصفح**: اضبط
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` واستخدم
       `OPENCLAW_HOME_VOLUME` أو `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker بلا واجهة)">
    إذا اخترت OpenAI Codex OAuth في المعالج، فإنه يفتح عنوان URL في المتصفح. وفي
    إعدادات Docker أو البيئات بلا واجهة، انسخ عنوان URL الكامل لإعادة التوجيه الذي تصل إليه ثم ألصقه
    مرة أخرى في المعالج لإكمال المصادقة.
  </Accordion>

  <Accordion title="البيانات الوصفية للصورة الأساسية">
    تستخدم صورة Docker الرئيسية `node:24-bookworm` وتنشر تعليقات توضيحية لصورة OCI الأساسية
    بما في ذلك `org.opencontainers.image.base.name`,
    و`org.opencontainers.image.source`، وغيرها. راجع
    [تعليقات صورة OCI التوضيحية](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### هل تشغّله على VPS؟

راجع [Hetzner (Docker VPS)](/ar/install/hetzner) و
[Docker VM Runtime](/ar/install/docker-vm-runtime) لخطوات النشر المشتركة على VM،
بما في ذلك تضمين الملفات التنفيذية، والاستمرارية، والتحديثات.

## Agent Sandbox

عندما يتم تفعيل `agents.defaults.sandbox` مع الواجهة الخلفية Docker، فإن gateway
تشغّل تنفيذ أدوات الوكيل (shell، وقراءة/كتابة الملفات، وما إلى ذلك) داخل حاويات Docker
معزولة بينما تبقى gateway نفسها على المضيف. ويمنحك هذا جدارًا صلبًا
حول جلسات الوكلاء غير الموثوقة أو متعددة المستأجرين من دون تحويل gateway بالكامل إلى حاوية.

يمكن أن يكون نطاق sandbox لكل وكيل (افتراضيًا)، أو لكل جلسة، أو مشتركًا. ويحصل كل
نطاق على مساحة عمل خاصة به مركبة عند `/workspace`. ويمكنك أيضًا ضبط
سياسات السماح/المنع للأدوات، وعزل الشبكة، وحدود الموارد، وحاويات
المتصفح.

للاطلاع على الإعدادات الكاملة، والصور، والملاحظات الأمنية، وملفات التعريف متعددة الوكلاء، راجع:

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل لـ sandbox
- [OpenShell](/ar/gateway/openshell) -- وصول shell تفاعلي إلى حاويات sandbox
- [Multi-Agent Sandbox and Tools](/ar/tools/multi-agent-sandbox-tools) -- تجاوزات لكل وكيل

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

ابنِ صورة sandbox الافتراضية:

```bash
scripts/sandbox-setup.sh
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الصورة مفقودة أو أن حاوية sandbox لا تبدأ">
    ابنِ صورة sandbox باستخدام
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    أو اضبط `agents.defaults.sandbox.docker.image` على صورتك المخصصة.
    ويتم إنشاء الحاويات تلقائيًا لكل جلسة عند الطلب.
  </Accordion>

  <Accordion title="أخطاء أذونات في sandbox">
    اضبط `docker.user` على UID:GID يطابق ملكية مساحة العمل المركبة،
    أو غيّر ملكية مجلد مساحة العمل.
  </Accordion>

  <Accordion title="تعذر العثور على أدوات مخصصة داخل sandbox">
    يشغّل OpenClaw الأوامر باستخدام `sh -lc` ‏(shell تسجيل دخول)، والذي يقوم بتحميل
    `/etc/profile` وقد يعيد تعيين PATH. اضبط `docker.env.PATH` لإضافة
    مسارات أدواتك المخصصة في البداية، أو أضف نصًا برمجيًا تحت `/etc/profile.d/` في Dockerfile لديك.
  </Accordion>

  <Accordion title="تم قتله بسبب OOM أثناء بناء الصورة (exit 137)">
    تحتاج VM إلى 2 GB RAM على الأقل. استخدم فئة جهاز أكبر ثم أعد المحاولة.
  </Accordion>

  <Accordion title="غير مصرح أو الاقتران مطلوب في Control UI">
    اجلب رابط لوحة معلومات جديدًا ووافق على جهاز المتصفح:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    مزيد من التفاصيل: [لوحة المعلومات](/ar/web/dashboard)، [الأجهزة](/ar/cli/devices).

  </Accordion>

  <Accordion title="يعرض هدف Gateway القيمة ws://172.x.x.x أو أخطاء اقتران من Docker CLI">
    أعد تعيين وضع Gateway وربطه:

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
- [الإعدادات](/ar/gateway/configuration) — إعدادات gateway بعد التثبيت

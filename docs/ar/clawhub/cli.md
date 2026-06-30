---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر والرايات والتكوين وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-06-30T22:17:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

حزمة CLI: `clawhub`، والملف التنفيذي: `clawhub`.

ثبّتها عالميًا باستخدام npm أو pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

ثم تحقّق منها:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## العلامات العامة

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت ضمن دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: المكتشف، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

المكافئات البيئية:

- `CLAWHUB_SITE` (القديم `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (القديم `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (القديم `CLAWDHUB_WORKDIR`)

### وكيل HTTP

يحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء مؤسسيين أو شبكات مقيّدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند تعيين أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لطلبات HTTP العادية. ويتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، وخوادم Hetzner VPS التي لا يتوفر فيها الإنترنت إلا عبر وكيل، والجدران النارية
المؤسسية).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزّن رمز API الخاص بك + عنوان URL للسجل المخزّن مؤقتًا.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكمل عبر رد نداء local loopback.
- بدون واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بدون واجهة: يطبع `clawhub login --device` رمزًا وينتظر أثناء تفويضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي عبر pipe إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف/يزيل مهارة من العناصر المميزة لديك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الإخراج slug المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث تطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب سابق صغير، وليست ضمانًا للظهور في المرتبة الأولى.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة تنازليًا حسب `createdAt`).
- العلامات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال أسماء فرز التثبيت القديمة تعمل للتوافق.
  - `--json` (إخراج قابل للقراءة آليًا)
- الإخراج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات المهارة الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد ملفات الإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `install @owner/slug`

- يحلّ أحدث إصدار للمالك والمهارة المسميين.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة بدبوس؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات عن بُعد بأفضل جهد أثناء تسجيل الدخول حتى يمكن
  إلغاء تنشيط أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم مهارة مثبتة على أنها مثبتة بدبوس في ملف القفل.
- يسجّل `--reason <text>` سبب تجميد المهارة.
- يتم تخطي Skills المثبتة بدبوس بواسطة `update --all` ورفضها بواسطة `update <skill>` المباشر.
- ترفض Skills المثبتة بدبوس أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <skill>`

- يزيل دبوس ملف القفل من مهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا يتم تحديث Skills المثبتة بدبوس أبدًا بواسطة `--force`.
- يفشل `update <skill>` سريعًا للمهارات المثبتة بدبوس ويطلب منك تشغيل `clawhub unpin <skill>` أولًا.
- يتخطى `update --all` slugs المثبتة بدبوس ويطبع ملخصًا لما بقي مجمدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- تستخدم Skills الجديدة افتراضيًا `1.0.0`؛ وتستخدم Skills المتغيرة افتراضيًا إصدار التصحيح
  التالي.
- يحدد `--version <version>` إصدارًا صراحةً وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحلّ `--dry-run` النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يمتلك الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب صلاحية مسؤول/مالك لدى كلا الناشرين.
- يُشرح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر مهارة يعني أنها صادرة بموجب `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل مهارة.
- الاسم المستعار القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام الخاص بـ ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` لمسار `skill_path` واحد، أو لكل مجلد مهارة مباشر
ضمن `root` (الافتراضي: `skills`). يتخطى Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

عيّن `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الحقيقية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المهيأ، وأي مجلدات
  `--root <dir>` للعثور على مجلدات مهارات محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub وينشر Skills الجديدة أو
  المتغيرة فقط.
- تُنشر Skills الجديدة كـ `1.0.0`؛ وتُنشر Skills المتغيرة بإصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدُفعات التحديث التي ينبغي أن تنتقل بخطوة
  semver أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو متغيرة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية تحديد Skills المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يمتلك الفاعل صلاحية الناشر.
- `sync` نشر أحادي الاتجاه فقط. لا يثبّت، أو يحدّث، أو ينزّل، أو
  يبلّغ عن قياسات تثبيت/تنزيل عن بُعد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى تصبح عملية الفحص نهائية.
- عمليات الفحص غير متزامنة وقد تستغرق وقتًا لاكتمالها. أثناء الانتظار في الطابور، يعرض مؤشر التحميل في الطرفية موضع الفحص الحالي حسب الأولوية وعدد الفحوصات التي تسبقه.
- تتطلب عمليات فحص المنشور ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الواجهة الخلفية نفسها عبر `clawhub-admin`.
- لا يكون `--update` صالحًا إلا مع `--slug`؛ وهو يكتب نتائج فحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوصات المسارات المحلية مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزّنة لذلك الإصدار المقدّم.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ZIP تقرير الفحص المخزّن لإصدار مهارة أو Plugin مقدّم، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوصات أمان ClawHub.
- تستخدم تنزيلات Skills slug المهارة وتستخدم افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- يُطلب `--version` حتى يفحص المؤلفون الإصدار المقدّم المحدد الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يشحن ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
لمستودعات المهارات ومستودعات الفهارس.

إعداد فهرس نموذجي:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

ملاحظات:

- يستخدم `root` افتراضيًا `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد مهارة واحد.
- يُطابق `owner` علامة CLI `--owner`؛ احذفه للنشر باسم المستخدم المصادق عليه.
- يستخدم نشر مهارات V1 `clawhub_token`؛ أما النشر الموثوق به عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- من دون `--version`، يحذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز الاسم المختصر لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار خاص بالإصدار
  ويفشل بإغلاق آمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. لا يتجاوز موظفو المنصة الملكية في هذا المسار الخاص بالإصدار فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعادة مهارة مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- إخفاء مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- إظهار مهارة مخفية (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- إعادة تسمية مهارة مملوكة والاحتفاظ بالاسم المختصر السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- دمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف الاسم المختصر المصدر عن الظهور علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تؤدي عمليات النقل إلى معرّفات المستخدمين إلى إنشاء طلب معلّق يقبله المستلم.
- تُطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون للفاعل
  وصول مسؤول إلى كل من المالك الحالي والناشر الوجهة.
- الأوامر الفرعية:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- نقاط النهاية:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- يتصفح أو يبحث في كتالوج الحزم الموحّد عبر `GET /api/v1/packages` و `GET /api/v1/packages/search`.
- استخدم هذا لـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` على المستوى الأعلى سطح البحث عن المهارات.
- الأعلام:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100، الافتراضي: 25)
  - `--json`

أمثلة:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- يجلب بيانات تعريف الحزمة من دون تثبيت.
- استخدم هذا لبيانات تعريف Plugin والتوافق والتحقق والمصدر وفحص الإصدار/الملف.
- `--version <version>`: فحص إصدار محدد (الافتراضي: latest).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: سرد ملفات الإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200 كيلوبايت).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلّل.
- يتحقق من ClawHub SHA-256 لكل الآثار.
- بالنسبة إلى آثار ClawPack من نوع npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  و npm shasum، واسم/إصدار `package.json` في أرشيف tarball.
- تُنزّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- الأعلام:
  - `--version <version>`: تنزيل إصدار محدد.
  - `--tag <tag>`: تنزيل إصدار موسوم (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: استبدال ملف إخراج موجود.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- يحسب ClawHub SHA-256، وسلامة npm `sha512`، و npm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع أعلام البصمات المباشرة، يتحقق من دون بحث شبكي.
- الأعلام:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: قيمة ClawHub SHA-256 المتوقعة.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغّل Plugin Inspector المضمّن في ClawHub CLI على مجلد حزمة Plugin محلي.
- يكون الافتراضي هو التحقق غير المتصل/الثابت، من دون تحديد موقع نسخة OpenClaw محلية
  أو استيرادها.
- تؤدي أخطاء التوافق الصارمة إلى الخروج برمز غير صفري. تُطبع النتائج التحذيرية فقط
  لكن الخروج يكون صفريًا.
- الأعلام:
  - `--out <dir>`: كتابة تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: الفحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: تفعيل التقاط وقت التشغيل؛ يستورد كود Plugin.
  - `--allow-execute`: السماح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: تعطيل OpenClaw SDK الوهمي أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة في الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- من دون `--version`، يحذف حزمة وكل الإصدارات حذفًا مبدئيًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار خاص بالإصدار
  ويفشل بإغلاق آمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. يتطلب هذا المسار الخاص بالإصدار فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- الأعلام:
  - `--version <version>`: حذف إصدار واحد غير أحدث إصدار نهائيًا.
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مبدئيًا.
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- الأعلام:
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر الوجهة،
  ما لم ينفذه مسؤول منصة.
- يجب نقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
- يستدعي `POST /api/v1/packages/{name}/transfer`.
- الأعلام:
  - `--to <owner>`: معرّف الناشر الوجهة.
  - `--reason <text>`: سبب تدقيق اختياري.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- أمر موثق للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بذاتها.
- الأعلام:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من ظهور الحزمة في الإشراف.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw المستقبلي.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدرية المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغّل لحزمة قد تحل محل
  Plugin مضمّن في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها التي يستدعيها `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة مملوكًا للمستخدم الموثق.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو من دونها.
- لا يكون ناشرو المؤسسات المنشؤون حديثًا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر أو مستخدم أو مسار محجوز موجود.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>` ما يلي:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف ClawPack محلي بصيغة npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack نفسها
  ويستخدم محتويات `package/` المستخرجة للتحقق وتعبئة البيانات الوصفية مسبقًا فقط.
- تُحزم مجلدات Plugin البرمجية في أرشيف ClawPack بصيغة npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأثر نفسه. أما مجلدات Plugin الحزم فلا تزال
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع والالتزام المحلول وref والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب على Plugins البرمجية الخارجية التصريح بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` على المستوى الأعلى كاحتياطي للتحقق من النشر.
- يعرض `--dry-run` معاينة حمولة النشر المحلولة دون رفع.
- يصدر `--json` مخرجات قابلة للقراءة آليًا لـ CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يكون لدى الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- لا تزال العلامات الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد البيانات الوصفية للحزمة المحلولة
ونسبة المصدر قبل إنشاء إصدار حي:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins البرمجية، يبني نشر المجلد أثر ClawPack من
مجلد الحزمة ويرفعه:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### الحد الأدنى من `package.json` لـ `--family code-plugin`

تحتاج Plugins البرمجية الخارجية إلى قدر صغير من بيانات OpenClaw الوصفية في
`package.json`. هذا البيان الأدنى يكفي لنشر ناجح:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

الحقول المطلوبة:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

ملاحظات:

- `package.json.version` هو إصدار حزمة الإصدار لديك، لكنه لا يُستخدم
  كاحتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI الخاص بـ `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يشحن ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
لمستودعات Plugin.

إعداد المستدعي النموذجي:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

ملاحظات:

- يعيّن سير العمل القابل لإعادة الاستخدام `source` افتراضيًا إلى مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل
  مجلد حزمة Plugin، مثل `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب حصر النشرات الحقيقية في الأحداث الموثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- النشر الموثوق دون سر لا يعمل إلا على `workflow_dispatch`؛ ولا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا لأول نشر، أو للحزم غير الموثوقة، أو لنشرات كسر الزجاج.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد ناشر GitHub Actions الموثوق لحزمة.
- استخدم هذا بعد ضبط الإعداد لتأكيد المستودع واسم ملف سير العمل
  والتثبيت الاختياري للبيئة.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد ناشر GitHub Actions الموثوق لحزمة موجودة.
- يجب إنشاء الحزمة أولًا من خلال `clawhub package publish` عادي يدوي أو
  مصادق عليه برمز.
- بعد ضبط الإعداد، يمكن للنشرات المستقبلية المدعومة عبر GitHub Actions استخدام
  OIDC/النشر الموثوق دون رمز ClawHub طويل العمر.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تهيئته، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تمامًا.
- يتحقق ClawHub من مستودع GitHub المهيأ عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. أما
  المستودعات الخاصة فتتطلب أن يكون لدى ClawHub وصول GitHub إلى ذلك المستودع، على
  سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل GitHub مخوّل آخر.
- العلامات:
  - `--repository <repo>`: مستودع GitHub، مثل `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، مثل `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بتطابق تام.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- يزيل إعداد الناشر الموثوق من حزمة.
- استخدم هذا كتراجع إذا كان سير العمل أو المستودع أو تثبيت البيئة يحتاج إلى
  تعطيل أو إعادة إنشاء.
- يجب أن تستخدم النشرات الحقيقية المستقبلية النشر المصادق عليه العادي إلى أن
  يُضبط الإعداد مرة أخرى.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يتم تعيين
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- الإبلاغ بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت القياسات
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

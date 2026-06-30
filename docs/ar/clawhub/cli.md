---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والرايات، والإعدادات، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-06-30T14:02:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63cdf64a1d5abe87ee475869fdb199053b7b4374962b03e91e822ddef3cad8e8
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

## الأعلام العامة

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت داخل دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

مكافئات البيئة:

- `CLAWHUB_SITE` (قديمًا `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قديمًا `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قديمًا `CLAWDHUB_WORKDIR`)

### وكيل HTTP

يحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء الشركات أو الشبكات المقيّدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند تعيين أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لـ HTTP العادي. ويُحترم `NO_PROXY` / `no_proxy` لتجاوز الوكيل لمضيفين
أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS بإنترنت عبر الوكيل فقط، أو جدران
حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف الإعداد

يخزّن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (قديمًا `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح على `<site>/cli/auth` ويُكمل عبر رد نداء local loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي إلى أوامر إعداد أسرار CI عبر الأنابيب.

### `star <skill>` / `unstar <skill>`

- يضيف مهارة إلى تمييزاتك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتخطى `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الخرج slug المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث مطابقات رمز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب صغير مسبق، وليست ضمانًا للظهور في المركز الأول.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال أسماء الفرز البديلة القديمة للتثبيت تعمل للتوافق.
  - `--json` (خرج قابل للقراءة آليًا)
- الخرج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات المهارة الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد الملفات للإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: خرج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك والمهارة المحددين.
- ينزّل zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق المهارات المثبّتة؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قديمًا `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات عن بُعد بأفضل جهد أثناء تسجيل الدخول حتى يمكن
  إلغاء تنشيط أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`).
- يعرض `pinned` بجانب المهارات المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم مهارة مثبّتة كمثبّتة في ملف القفل.
- يسجل `--reason <text>` سبب تجميد المهارة.
- يتخطى `update --all` المهارات المثبّتة، وترفضها عملية `update <skill>` المباشرة.
- ترفض المهارات المثبّتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <skill>`

- يزيل تثبيت ملف القفل من مهارة مثبّتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو عبر مطالبة، إذا كان تفاعليًا)
- لا تُحدّث المهارات المثبّتة مطلقًا بواسطة `--force`.
- يفشل `update <skill>` سريعًا للمهارات المثبّتة ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتخطى `update --all` slugs المثبّتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- المهارات الجديدة تستخدم `1.0.0` افتراضيًا؛ والمهارات التي تغيرت تستخدم افتراضيًا إصدار التصحيح
  التالي.
- يحدد `--version <version>` إصدارًا صراحةً وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يكون للفاعل صلاحية ناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب صلاحية مشرف/مالك لدى كلا الناشرين.
- يوضَّح سلوك المالك والمراجعة في `docs/publishing.md`.
- يعني نشر مهارة أنها تُصدر تحت `MIT-0` على ClawHub.
- المهارات المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub المهارات المدفوعة أو التسعير لكل مهارة.
- الاسم البديل القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير عمل ClawHub القابل لإعادة الاستخدام
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` لمسار `skill_path` واحد، أو لكل مجلد مهارة مباشر
تحت `root` (الافتراضي: `skills`). يتخطى المهارات غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

عيّن `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الحقيقية سر
`clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل المهارات المهيأ، وأي مجلدات
  `--root <dir>` بحثًا عن مجلدات مهارات محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub وينشر المهارات الجديدة أو
  المتغيرة فقط.
- تنشر المهارات الجديدة كـ `1.0.0`؛ وتنشر المهارات المتغيرة إصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لحزم التحديث التي ينبغي أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو متغيرة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية تحديد المهارات المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يكون للفاعل صلاحية ناشر.
- `sync` نشر باتجاه واحد فقط. لا يثبّت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات التثبيت/التنزيل عن بُعد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوص غير متزامنة وقد تستغرق وقتًا حتى تكتمل. أثناء الانتظار في الصف، يعرض مؤشر الطرفية الدوّار موضع الفحص الحالي حسب الأولوية وعدد الفحوص التي تسبقه.
- تتطلب الفحوص المنشورة ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المديرين استخدام الخلفية نفسها عبر `clawhub-admin`.
- يكون `--update` صالحًا فقط مع `--slug`؛ ويكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوص المسارات المحلية مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترجاع نتائج الفحص المخزّنة لذلك الإصدار المرسل.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ملف ZIP لتقرير الفحص المخزّن لإصدار مهارة أو Plugin مُرسل، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوص أمان ClawHub.
- تستخدم تنزيلات المهارات slug المهارة وتستخدم `--kind skill` افتراضيًا.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- يكون `--version` مطلوبًا حتى يفحص المؤلفون الإصدار المرسل exact الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفّر ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/skill-publish.yml)
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

- تكون القيمة الافتراضية لـ `root` هي `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد مهارة واحد.
- يطابق `owner` علم CLI `--owner`؛ احذفه للنشر بوصفك المستخدم المصادق عليه.
- يستخدم نشر مهارات V1 `clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المدير).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز المعرّف اللطيف لمدة 30 يومًا؛ ويطبع الأمر وقت انتهاء الصلاحية.
- يحذف `--version <version>` إصدارًا واحدًا مملوكًا غير الأحدث نهائيًا عبر مسار مغلق عند الفشل
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. لا يتجاوز موظفو المنصة الملكية في هذا المسار الخاص بالإصدارات فقط.
- يسجل `--reason <text>` ملاحظة إشراف في حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المدير).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المدير).
- اسم مستعار لـ `delete`.

### `unhide <skill>`

- أظهر مهارة مخفية (المالك أو المشرف أو المدير).
- اسم مستعار لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف اللطيف السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف إدراج المعرّف اللطيف المصدر علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يملك الفاعل
  وصول مدير إلى كل من المالك الحالي والناشر الوجهة.
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` على المستوى الأعلى سطح البحث عن المهارات.
- العلامات:
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

- يجلب بيانات تعريف الحزمة دون تثبيت.
- استخدم هذا لبيانات تعريف plugin والتوافق والتحقق والمصدر وفحص الإصدارات/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200 كيلوبايت).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من SHA-256 الخاص بـ ClawHub لكل الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`
  وملخص npm shasum واسم/إصدار `package.json` في ملف tarball.
- تُنزل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- العلامات:
  - `--version <version>`: نزّل إصدارًا محددًا.
  - `--tag <tag>`: نزّل إصدارًا موسومًا (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: استبدل ملف إخراج موجودًا.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- يحسب SHA-256 الخاص بـ ClawHub وسلامة npm `sha512` وملخص npm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع علامات الملخص المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: SHA-256 المتوقع من ClawHub.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: ملخص npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغل Plugin Inspector المضمن في ClawHub CLI على مجلد حزمة plugin محلية.
- يستخدم افتراضيًا التحقق غير المتصل/الثابت، دون تحديد موقع نسخة OpenClaw محلية
  أو استيرادها.
- تؤدي أخطاء التوافق الجسيمة إلى الخروج بقيمة غير صفرية. تُطبع النتائج التحذيرية فقط
  لكن الخروج يكون بقيمة صفرية.
- العلامات:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل SDK OpenClaw المحاكى أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة تخص الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وكل الإصدارات حذفًا مبدئيًا.
- يحذف `--version <version>` إصدارًا واحدًا مملوكًا غير الأحدث نهائيًا عبر مسار مغلق عند الفشل
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. يتطلب هذا المسار الخاص بالإصدارات فقط مالك الحزمة أو مدير ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة أو مالك/مدير ناشر مؤسسة أو
  مشرف المنصة أو مدير المنصة.
- العلامات:
  - `--version <version>`: احذف إصدارًا واحدًا غير أحدث نهائيًا.
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- يستعيد حزمة محذوفة مبدئيًا وإصداراتها.
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يتطلب مالك الحزمة أو مالك/مدير ناشر مؤسسة أو مشرف المنصة
  أو مدير المنصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- العلامات:
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب وصول مدير إلى كل من مالك الحزمة الحالي والناشر الوجهة،
  ما لم ينفذه مدير منصة.
- يجب نقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
- يستدعي `POST /api/v1/packages/{name}/transfer`.
- العلامات:
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
- لا تُخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بحد ذاتها.
- العلامات:
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
- يعرض حالة فحص الحزمة الحالية وعدد البلاغات المفتوحة وحالة الإشراف اليدوي
  لأحدث إصدار وحالة حظر التنزيل وأسباب الإشراف.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw المستقبلي.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق أمام الحالة الرسمية وتوفر ClawPack وملخص الأثر
  ومصدر المنشأ وتوافق OpenClaw وأهداف المضيف وبيانات تعريف البيئة
  وحالة الفحص.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغل لحزمة قد تستبدل
  plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة مركزة على الترحيل وأحدث إصدار وحالة الحزمة الرسمية والفحوصات
  والعوائق.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة مملوكًا للمستخدم الموثق.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- لا يكون ناشرو المؤسسات المنشؤون حديثًا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر أو مستخدم موجود أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin شيفرة أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي من نوع ClawPack بصيغة npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائياً من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق وملء البيانات الوصفية مسبقاً.
- تُحزم مجلدات Plugin الشيفرة في أرشيف tarball من نوع ClawPack npm قبل الرفع لكي
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugin الحزمة فلا تزال
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، يُملأ إسناد المصدر تلقائياً من المستودع والالتزام المحلول والمرجع والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، يُكتشف إسناد المصدر تلقائياً من git المحلي عندما يشير أصل remote إلى GitHub.
- يجب أن تصرّح Plugins الشيفرة الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كاحتياطي للتحقق من النشر.
- يعرض `--dry-run` حمولة النشر المحلولة دون رفعها.
- يُصدر `--json` مخرجات قابلة للقراءة آلياً لأجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يكون للممثل وصول ناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- لا تزال الرايات الموجودة (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولاً حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة
وإسناد المصدر قبل إنشاء إصدار حي:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins الشيفرة، يبني نشر المجلد ويرفع أثر ClawPack من
مجلد الحزمة:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### الحد الأدنى من `package.json` لـ `--family code-plugin`

تحتاج Plugins الشيفرة الخارجية إلى قدر صغير من بيانات OpenClaw الوصفية في
`package.json`. هذا البيان الأدنى كافٍ لنشر ناجح:

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

- `package.json.version` هو إصدار حزمة النشر الخاص بك، لكنه لا يُستخدم
  كاحتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا كنت تريد نشر
  بيانات وصفية أكثر تفصيلاً عن التوافق.
- إذا كنت تستخدم إصداراً أقدم من CLI `clawhub`، فقم بالترقية قبل النشر لكي
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يوفر ClawHub أيضاً سير عمل رسمياً قابلاً لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/919f047373fb1836301c5e42f20ad8c2c2201fc5/.github/workflows/package-publish.yml)
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

- يضبط سير العمل القابل لإعادة الاستخدام `source` افتراضياً إلى مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` لكي ينشر سير العمل
  مجلد حزمة Plugin، مثلاً `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- ينبغي أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوّث.
- ينبغي حصر عمليات النشر الحقيقية في أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- النشر الموثوق دون سر لا يعمل إلا على `workflow_dispatch`؛ ولا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحاً للنشر الأول أو الحزم غير الموثوقة أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد ناشر GitHub Actions الموثوق لحزمة.
- استخدم هذا بعد ضبط الإعدادات لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الرايات:
  - `--json`: مخرجات قابلة للقراءة آلياً.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد ناشر GitHub Actions الموثوق لحزمة موجودة.
- يجب إنشاء الحزمة أولاً عبر `clawhub package publish` العادي اليدوي أو
  المصدق برمز.
- بعد ضبط الإعداد، يمكن لعمليات نشر GitHub Actions المدعومة المستقبلية استخدام
  OIDC/النشر الموثوق دون رمز ClawHub طويل العمر.
- يجب أن يكون `--repository <repo>` بالشكل `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تهيئته، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تماماً.
- يتحقق ClawHub من مستودع GitHub المهيأ عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يكون لدى ClawHub وصول GitHub إلى ذلك المستودع، على
  سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل GitHub آخر مخول.
- الرايات:
  - `--repository <repo>`: مستودع GitHub، على سبيل المثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، على سبيل المثال `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية ذات تطابق دقيق.
  - `--json`: مخرجات قابلة للقراءة آلياً.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- يزيل إعداد الناشر الموثوق من حزمة.
- استخدم هذا كتراجع إذا احتاج تثبيت سير العمل أو المستودع أو البيئة إلى
  تعطيله أو إعادة إنشائه.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصدق العادي حتى
  يُضبط الإعداد مرة أخرى.
- الرايات:
  - `--json`: مخرجات قابلة للقراءة آلياً.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يتم ضبط
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- الإبلاغ يعمل بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت القياسات
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

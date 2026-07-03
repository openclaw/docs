---
read_when:
    - استخدام ClawHub CLI
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر والرايات والإعدادات وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-07-03T09:36:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

حزمة CLI: `clawhub`، والملف التنفيذي: `clawhub`.

ثبّتها عموميًا باستخدام npm أو pnpm:

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

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ ويعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت ضمن دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

مكافئات البيئة:

- `CLAWHUB_SITE` (قديمًا `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (قديمًا `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (قديمًا `CLAWDHUB_WORKDIR`)

### وكيل HTTP

تحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء الشركات أو الشبكات المقيّدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند ضبط أي من هذه المتغيرات، تمرّر CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لـ HTTP العادي. ويُحترم `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تكون فيها الاتصالات الصادرة المباشرة محظورة
(مثل حاويات Docker، أو Hetzner VPS بإنترنت عبر الوكيل فقط، أو
جدران الحماية المؤسسية).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم ضبط أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف الإعداد

يخزّن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسار رجوع قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، تعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (قديمًا `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكتمل عبر استدعاء حلقة الرجوع.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوضه عند `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف مهارة إلى تمييزاتك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الخرج معرّف المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث تطابقات رموز المعرّف/الاسم الدقيقة قبل شعبية التنزيل. رمز معرّف مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية أولوية ترتيب صغيرة، وليست ضمانًا للظهور في القمة.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، فشغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- العلامات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال الأسماء البديلة القديمة لترتيب التثبيت تعمل للتوافق.
  - `--json` (خرج قابل للقراءة آليًا)
- الخرج: `<slug>  v<version>  <age>  <summary>` (يُختصر الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب البيانات الوصفية للمهارة وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد ملفات الإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: خرج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك والمهارة المسميين.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبّتة؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قديمًا `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات عن بُعد بأفضل جهد أثناء تسجيل الدخول بحيث يمكن
  تعطيل أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`).
- يعرض `pinned` بجوار Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يضع علامة على مهارة مثبتة على أنها مثبّتة في ملف القفل.
- يسجّل `--reason <text>` سبب تجميد المهارة.
- تتجاوز `update --all` الـ Skills المثبّتة ويرفضها `update <skill>` المباشر.
- ترفض Skills المثبّتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <skill>`

- يزيل التثبيت من ملف القفل لمهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو بمطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبّتة أبدًا بواسطة `--force`.
- يفشل `update <skill>` بسرعة مع Skills المثبّتة ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتجاوز `update --all` المعرّفات المثبّتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub وينهي بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- تعتمد Skills الجديدة افتراضيًا على `1.0.0`؛ وتعتمد Skills المتغيرة افتراضيًا على إصدار التصحيح التالي.
- يحدد `--version <version>` إصدارًا صراحةً وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما يكون
  لدى الفاعل وصول ناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب وصول مسؤول/مالك على كلا الناشرين.
- يوضَّح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر مهارة يعني أنها صادرة بموجب `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub مهارات مدفوعة أو تسعيرًا لكل مهارة.
- الاسم البديل القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام في ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` من أجل `skill_path` واحد، أو لكل مجلد مهارة مباشر
تحت `root` (الافتراضي: `skills`). يتجاوز Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

اضبط `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الحقيقية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المهيأ، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات Skills محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub وينشر Skills الجديدة أو
  المتغيرة فقط.
- تُنشر Skills الجديدة كـ `1.0.0`؛ وتُنشر Skills المتغيرة بإصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدُفعات التحديث التي ينبغي أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو متغيرة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية تحديد Skills المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما يكون
  لدى الفاعل وصول ناشر.
- `sync` نشر باتجاه واحد فقط. لا يثبت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات تثبيت/تنزيل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawScan في ClawHub عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوص غير متزامنة وقد تستغرق وقتًا للاكتمال. أثناء الانتظار في الطابور، يعرض مؤشر الطرفية الدوّار موضع الفحص الحالي ذي الأولوية وعدد الفحوص التي تسبقه.
- تتطلب الفحوص المنشورة ملكية أو وصول إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الواجهة الخلفية نفسها عبر `clawhub-admin`.
- لا يكون `--update` صالحًا إلا مع `--slug`؛ فهو يكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوص المسار المحلي مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزنة لذلك الإصدار المقدّم.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ملف ZIP لتقرير الفحص المخزّن لإصدار مهارة أو Plugin مقدّم، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوص أمان ClawHub.
- تستخدم تنزيلات المهارات معرّف المهارة وتكون افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب حتى يفحص المؤلفون الإصدار المقدّم بالضبط الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفّر ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
لمستودعات Skills ومستودعات الفهارس.

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

- تكون قيمة `root` الافتراضية `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد مهارة واحد.
- يطابق `owner` علامة CLI `--owner`؛ احذفه للنشر كمستخدم مصادق عليه.
- يستخدم نشر Skills في V1 `clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط في الوقت الحالي.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز الـ slug لمدة 30 يومًا؛ يطبع الأمر وقت انتهاء الصلاحية.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار يفشل مغلقًا
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. لا يتجاوز موظفو المنصة الملكية في هذا التدفق المخصص للإصدارات فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` هو اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` هو اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- أظهر مهارة مخفية (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالـ slug السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف الـ slug المصدر عن الظهور علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- عمليات النقل إلى معرّفات المستخدمين تنشئ طلبًا معلقًا يقبله المستلم.
- عمليات النقل إلى معرّفات المؤسسات/الناشرين تطبّق فورًا فقط عندما يكون لدى المنفذ
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

- يتصفح أو يبحث في فهرس الحزم الموحد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا لـ Plugins ومدخلات عائلات الحزم الأخرى؛ يظل `search` على المستوى الأعلى سطح البحث عن المهارات.
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

- يجلب بيانات الحزمة الوصفية دون تثبيت.
- استخدم هذا لبيانات Plugin الوصفية، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اعرض سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المطلوب عرضها (1-100).
- `--files`: اعرض ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من ClawHub SHA-256 لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` الخاص بملف tarball.
- إصدارات ZIP القديمة تُنزّل عبر مسار ZIP القديم.
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

- يحسب ClawHub SHA-256، وسلامة npm `sha512`، وnpm shasum لأثر محلي.
- مع `--package`، يحل البيانات الوصفية المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات الأثر المنشور الوصفية.
- مع علامات البصمة المباشرة، يتحقق دون بحث شبكي.
- العلامات:
  - `--package <name>`: اسم الحزمة لحل بيانات الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: ClawHub SHA-256 المتوقع.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغل Plugin Inspector المضمّن في ClawHub CLI على مجلد حزمة Plugin محلية.
- يستخدم افتراضيًا تحققًا ثابتًا/دون اتصال، دون تحديد موقع نسخة محلية من
  OpenClaw أو استيرادها.
- أخطاء التوافق الصارمة تخرج برمز غير صفري. النتائج التحذيرية فقط تُطبع لكن
  تخرج برمز صفري.
- العلامات:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة محلية صريحة من OpenClaw.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود Plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK الوهمي أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة متعلقة بالحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وجميع الإصدارات حذفًا مبدئيًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار يفشل مغلقًا
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. يتطلب هذا التدفق المخصص للإصدارات فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- العلامات:
  - `--version <version>`: احذف نهائيًا إصدارًا واحدًا غير أحدث إصدار.
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
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
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
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر الوجهة،
  ما لم ينفذه مسؤول منصة.
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

- أمر موثّق للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا ولا تحظر التنزيلات بذاتها.
- العلامات:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من ظهور الحزمة إشرافيًا.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدرية المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات البيئة الوصفية،
  وحالة الفحص.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغل لحزمة قد تستبدل Plugin مضمنًا في
  OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات، و
  العوائق.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة مملوكًا للمستخدم الموثّق.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- ناشرو المؤسسات المنشؤون حديثًا ليسوا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر موجود، أو مستخدم، أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي من ClawPack بصيغة npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق وملء البيانات الوصفية مسبقًا.
- تُحزم مجلدات Plugin البرمجية في أرشيف npm من ClawPack قبل الرفع بحيث
  يمكن لتثبيتات OpenClaw التحقق من الأثر الدقيق. ما زالت مجلدات Plugin الحزمة
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، يُملأ إسناد المصدر تلقائيًا من المستودع والالتزام المحلول وref والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، يُكتشف إسناد المصدر تلقائيًا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب على Plugins البرمجية الخارجية التصريح بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كبديل للتحقق من النشر.
- يعرض `--dry-run` معاينة حمولة النشر المحلولة دون رفع.
- يُصدر `--json` مخرجات قابلة للقراءة آليًا من أجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر لمستخدم أو مؤسسة عندما يمتلك الفاعل حق وصول الناشر.
- يجب أن تتطابق أسماء الحزم ذات النطاق مع المالك المحدد. راجع `docs/publishing.md`.
- ما زالت الأعلام الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة و
إسناد المصدر قبل إنشاء إصدار مباشر:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins البرمجية، يبني نشر المجلد أثر ClawPack ويرفعه من
مجلد الحزمة:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` أدنى لـ `--family code-plugin`

تحتاج Plugins البرمجية الخارجية إلى قدر صغير من بيانات OpenClaw الوصفية في
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

- `package.json.version` هو إصدار حزمة الإصدار لديك، لكنه لا يُستخدم
  كبديل للتحقق من توافق/بناء OpenClaw.
- تُعد `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها ليست مطلوبة للنشر.
- تُعد `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا عن التوافق.
- إذا كنت تستخدم إصدار CLI أقدم من `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الرفع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يشحن ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
لمستودعات Plugins.

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

- يجعل سير العمل القابل لإعادة الاستخدام القيمة الافتراضية لـ `source` هي مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل
  مجلد حزمة Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوِّث.
- يجب حصر عمليات النشر الحقيقية في أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ ما زالت دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول أو الحزم غير الموثوقة أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد الناشر الموثوق في GitHub Actions لحزمة.
- استخدم هذا بعد ضبط الإعداد لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد الناشر الموثوق في GitHub Actions لحزمة موجودة.
- يجب إنشاء الحزمة أولًا عبر `clawhub package publish` العادي اليدوي أو المصادق عليه بالرمز المميز.
- بعد ضبط الإعداد، يمكن لعمليات نشر GitHub Actions المدعومة مستقبلًا استخدام
  OIDC/النشر الموثوق دون رمز ClawHub طويل الأجل.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند ضبطه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC مطابقة تامة.
- يتحقق ClawHub من مستودع GitHub المضبوط عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يكون لدى ClawHub وصول إلى ذلك المستودع على GitHub، على
  سبيل المثال عبر تثبيت مستقبلي لتطبيق GitHub من ClawHub أو تكامل GitHub مخول آخر.
- الأعلام:
  - `--repository <repo>`: مستودع GitHub، على سبيل المثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، على سبيل المثال `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية ذات مطابقة تامة.
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
- استخدم هذا كتراجع إذا كان يلزم تعطيل أو إعادة إنشاء سير العمل أو المستودع أو تثبيت البيئة.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق عليه العادي حتى
  يُضبط الإعداد مجددًا.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياس تثبيتات الاستخدام

- يُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يتم ضبط
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- الإبلاغ يُبذل فيه أفضل جهد. لا تفشل أوامر التثبيت إذا كانت بيانات القياس
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

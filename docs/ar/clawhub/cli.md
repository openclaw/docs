---
read_when:
    - استخدام ClawHub CLI
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والخيارات، والإعدادات، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-06-27T17:17:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c6c152cbe121f55969aeda0b990b444325e49ce6613745ef094a78d2d2cfce4
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
- `--dir <dir>`: دليل التثبيت تحت دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يُكتشف، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

مكافئات متغيرات البيئة:

- `CLAWHUB_SITE` (القديم `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (القديم `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (القديم `CLAWDHUB_WORKDIR`)

### وكيل HTTP

يحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء الشركات أو الشبكات المقيّدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند تعيين أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لـ HTTP العادي. يتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS مع إنترنت عبر الوكيل فقط، أو جدران
حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد لكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكمل عبر رد نداء loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف/يزيل مهارة من العناصر المميزة لديك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- `--yes` يتخطى التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الإخراج slug المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث مطابقات رمز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب سابق صغير، وليست ضمانًا للتصدر.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال أسماء فرز التثبيت القديمة تعمل للتوافق.
  - `--json` (إخراج قابل للقراءة آليًا)
- الإخراج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات المهارة الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك والمهارة المذكورين.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض استبدال المهارات المثبتة بدبوس؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات عن بُعد بأفضل جهد أثناء تسجيل الدخول بحيث يمكن
  إلغاء تفعيل أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجانب المهارات المجمدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم مهارة مثبتة على أنها مثبتة بدبوس في ملف القفل.
- `--reason <text>` يسجل سبب تجميد المهارة.
- يتخطى `update --all` المهارات المثبتة بدبوس ويرفضها `update <skill>` المباشر.
- ترفض المهارات المثبتة بدبوس أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <skill>`

- يزيل دبوس ملف القفل من مهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث المهارات المثبتة بدبوس أبدًا بواسطة `--force`.
- يفشل `update <skill>` بسرعة للمهارات المثبتة بدبوس ويطلب منك تشغيل `clawhub unpin <skill>` أولًا.
- يتخطى `update --all` قيم slug المثبتة بدبوس ويطبع ملخصًا لما بقي مجمدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- المهارات الجديدة تكون افتراضيًا `1.0.0`؛ والمهارات المعدلة تكون افتراضيًا على إصدار التصحيح
  التالي.
- `--version <version>` يحدد إصدارًا صراحة وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- `--dry-run` يحل النشر دون رفع؛ يطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- `--owner <handle>` ينشر تحت مقبض ناشر مؤسسة/مستخدم عندما
  يكون لدى الفاعل صلاحية الناشر.
- `--migrate-owner` ينقل مهارة موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب صلاحية مسؤول/مالك لدى كلا الناشرين.
- يوضَّح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر مهارة يعني أنها تصدر تحت `MIT-0` على ClawHub.
- المهارات المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub المهارات المدفوعة أو التسعير لكل مهارة.
- الاسم المستعار القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام من ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` من أجل `skill_path` واحد، أو من أجل كل مجلد مهارة مباشر
تحت `root` (الافتراضي: `skills`). يتخطى المهارات غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

عيّن `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الفعلية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل المهارات المهيأ، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات مهارات محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub ولا ينشر إلا المهارات الجديدة أو
  المعدلة.
- تُنشر المهارات الجديدة كـ `1.0.0`؛ وتُنشر المهارات المعدلة بإصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لحزم التحديث التي يجب أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ يطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو معدلة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية اختيار المهارات المراد نشرها.
- `--owner <handle>` ينشر تحت مقبض ناشر مؤسسة/مستخدم عندما يكون
  لدى الفاعل صلاحية الناشر.
- `sync` هو نشر باتجاه واحد فقط. لا يثبت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات تثبيت/تنزيل عن بُعد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوص غير متزامنة وقد تستغرق وقتًا للاكتمال. أثناء الانتظار في الطابور، يعرض مؤشر الطرفية موضع الفحص ذي الأولوية الحالي وعدد الفحوص التي تسبقه.
- تتطلب الفحوص المنشورة ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الواجهة الخلفية نفسها عبر `clawhub-admin`.
- `--update` صالح فقط مع `--slug`؛ يكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- `--output <file.zip>` ينزّل أرشيف التقرير الكامل مع `manifest.json`، و`clawscan.json`، و`skillspector.json`، و`static-analysis.json`، و`virustotal.json`، و`README.md`.
- `--json` يطبع استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوص المسارات المحلية مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزنة لذلك الإصدار المرسل.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ملف ZIP لتقرير الفحص المخزن لإصدار مهارة أو Plugin مُرسل، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوص أمان ClawHub.
- تستخدم تنزيلات المهارات slug المهارة وتكون افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب حتى يفحص المؤلفون الإصدار المرسل الدقيق الذي حظره ClawHub.
- `--output <file.zip>` يختار مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفر ClawHub سير عمل رسميًا قابلاً لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/skill-publish.yml)
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

- يكون `root` افتراضيًا `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد مهارة واحد.
- يطابق `owner` علم CLI `--owner`؛ احذفه للنشر بصفة المستخدم المصادق عليه.
- يستخدم نشر مهارات V1 `clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا ناعمًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف الناعم التي يبدأها المالك تحجز المعرّف اللطيف لمدة 30 يومًا؛ يطبع الأمر وقت الانتهاء.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير الأحدث عبر مسار مغلق عند الفشل
  ومحدد بالإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الحالي الأحدث. لا يتجاوز موظفو المنصة الملكية في هذا المسار الخاص بالإصدارات فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف ناعم لمهارة كاملة وسجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وسجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- أظهر مهارة مخفية (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف اللطيف السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتخطى `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف إدراج المعرّف اللطيف للمصدر علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتخطى `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- لا تُطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا إلا عندما يكون لدى الفاعل
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` في المستوى الأعلى سطح البحث عن المهارات.
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

- يجلب بيانات تعريف الحزمة دون تثبيت.
- استخدم هذا لبيانات تعريف الـ plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملف.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى ملف خامًا (الملفات النصية فقط؛ حد 200 كيلوبايت).
- `--json`: إخراج قابل للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من ClawHub SHA-256 لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` في ملف tarball.
- تُنزَّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- الأعلام:
  - `--version <version>`: نزّل إصدارًا محددًا.
  - `--tag <tag>`: نزّل إصدارًا موسومًا (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: استبدل ملف إخراج موجودًا.
  - `--json`: إخراج قابل للقراءة آليًا.

أمثلة:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- يحسب ClawHub SHA-256، وسلامة npm `sha512`، وnpm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع أعلام البصمة المباشرة، يتحقق دون بحث عبر الشبكة.
- الأعلام:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: ClawHub SHA-256 المتوقع.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: إخراج قابل للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغل Plugin Inspector المضمّن في ClawHub CLI على مجلد حزمة plugin محلية.
- الوضع الافتراضي هو التحقق غير المتصل/الثابت، دون تحديد موضع نسخة OpenClaw محلية
  أو استيرادها.
- تؤدي أخطاء التوافق الصلبة إلى الخروج برمز غير صفري. تُطبع النتائج التحذيرية فقط
  لكن الخروج يكون صفريًا.
- الأعلام:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK المحاكى أثناء التقاط وقت التشغيل.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة في الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق الـ Plugin](/ar/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وجميع الإصدارات حذفًا ناعمًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير الأحدث عبر مسار مغلق عند الفشل
  ومحدد بالإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الحالي الأحدث. يتطلب هذا المسار الخاص بالإصدارات فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف الناعم للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- الأعلام:
  - `--version <version>`: احذف نهائيًا إصدارًا واحدًا غير الأحدث.
  - `--yes`: تخطَّ التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا ناعمًا.
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- الأعلام:
  - `--yes`: تخطَّ التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

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
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- أمر مصادق عليه للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بذاتها.
- الأعلام:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من رؤية إشراف الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw المستقبلي.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق الخاصة بالحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدرية المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغل لحزمة قد تستبدل
  plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة مركزة على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة يملكه المستخدم المصادق عليه.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- ناشرو المؤسسات المنشؤون حديثًا ليسوا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر موجود، أو مستخدم، أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin كود أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>` ما يلي:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي من ClawPack منشأ عبر npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق المسبق وملء
  البيانات الوصفية.
- تُحزم مجلدات Plugin الكود في أرشيف tarball من ClawPack بصيغة npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأثرية الدقيقة. أما مجلدات Plugin الحزمة فما زالت
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ إحالة المصدر تلقائيا من المستودع والالتزام المحلول والمرجع والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف إحالة المصدر تلقائيا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب أن تصرح Plugins الكود الخارجية عن `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحة.
  لا يُستخدم `package.json.version` في المستوى الأعلى كبديل للتحقق من النشر.
- يعاين `--dry-run` حمولة النشر المحلولة دون رفعها.
- يصدر `--json` مخرجات قابلة للقراءة آليا من أجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر لمستخدم أو مؤسسة عندما تكون لدى الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- تظل العلامات الموجودة (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولا حتى تتمكن من تأكيد البيانات الوصفية المحلولة للحزمة
وإحالة المصدر قبل إنشاء إصدار حي:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins الكود، يبني نشر المجلد أثرا من ClawPack ويرفعه من
مجلد الحزمة:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### الحد الأدنى من `package.json` من أجل `--family code-plugin`

تحتاج Plugins الكود الخارجية إلى قدر صغير من بيانات OpenClaw الوصفية في
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

- `package.json.version` هو إصدار نشر حزمتك، لكنه لا يُستخدم
  كبديل للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلا عن التوافق.
- إذا كنت تستخدم إصدارا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات التمهيد المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات تحقق Plugin](/ar/clawhub/plugin-validation-fixes).

#### GitHub Actions

يشحن ClawHub أيضا سير عمل رسميا قابلا لإعادة الاستخدام على
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/bdb23c3a9ffe77cb4184fdd13897ce535fb2d703/.github/workflows/package-publish.yml)
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

- يضبط سير العمل القابل لإعادة الاستخدام `source` افتراضيا على مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرر `source_path` حتى ينشر سير العمل مجلد
  حزمة Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب حصر النشر الحقيقي على الأحداث الموثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ ما زالت دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبق `clawhub_token` متاحا للنشر الأول أو الحزم غير الموثوقة أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثرية ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد ناشر GitHub Actions الموثوق لحزمة.
- استخدم هذا بعد ضبط الإعداد لتأكيد المستودع واسم ملف سير العمل
  والتثبيت الاختياري للبيئة.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد ناشر GitHub Actions الموثوق لحزمة موجودة.
- يجب إنشاء الحزمة أولا من خلال `clawhub package publish` العادي اليدوي أو
  المصادق عليه برمز.
- بعد ضبط الإعداد، يمكن لعمليات النشر المستقبلية المدعومة في GitHub Actions استخدام
  OIDC/النشر الموثوق دون رمز ClawHub طويل العمر.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تكوينه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تماما.
- يتحقق ClawHub من مستودع GitHub المكوّن عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يمتلك ClawHub وصولا إلى ذلك المستودع على GitHub، على
  سبيل المثال عبر تثبيت GitHub App مستقبلي من ClawHub أو تكامل GitHub آخر
  مخول.
- العلامات:
  - `--repository <repo>`: مستودع GitHub، على سبيل المثال `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، على سبيل المثال `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بمطابقة دقيقة.
  - `--json`: مخرجات قابلة للقراءة آليا.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- يزيل إعداد الناشر الموثوق من حزمة.
- استخدم هذا كتراجع إذا احتاج سير العمل أو المستودع أو تثبيت البيئة إلى
  التعطيل أو إعادة الإنشاء.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق عليه العادي إلى أن
  يُضبط الإعداد مرة أخرى.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يتم ضبط
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- الإبلاغ بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت القياسات
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

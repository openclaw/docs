---
read_when:
    - استخدام CLI لـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والرايات، والتكوين، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-06-28T00:10:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70aabaeae7b205e0ef30de010624e18c471baf214ff5e07ac1db8139fccb1c27
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

عند ضبط أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لـ HTTP العادي. ويُحترم `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS مع إنترنت عبر الوكيل فقط، أو
جدران الحماية المؤسسية).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم ضبط أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزّن رمز API الخاص بك + عنوان URL المخبأ للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (قديمًا `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكمل عبر استدعاء local loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي عبر الأنابيب إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف مهارة إلى تمييزاتك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الإخراج slug المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث التطابقات الدقيقة لرموز slug/الاسم قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب صغير سابق، وليست ضمانًا للظهور في أعلى النتائج.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
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
- `--limit <n>`: أقصى عدد من الإصدارات للسرد (1-200).
- `--files`: سرد الملفات للإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك والمهارة المسميين.
- ينزّل zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة بالتثبيت الدائم؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (قديمًا `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات استخدام بأفضل جهد أثناء تسجيل الدخول بحيث يمكن
  إلغاء تفعيل أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (قديمًا `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم مهارة مثبتة بأنها مثبتة تثبيتًا دائمًا في ملف القفل.
- يسجل `--reason <text>` سبب تجميد المهارة.
- يتخطى `update --all` Skills المثبتة تثبيتًا دائمًا، ويرفضها `update <skill>` المباشر.
- ترفض Skills المثبتة تثبيتًا دائمًا أيضًا `install --force` حتى لا تُستبدل البايتات المحلية بالخطأ.

### `unpin <skill>`

- يزيل تثبيت ملف القفل الدائم من مهارة مثبتة بحيث يمكن للتحديثات المستقبلية تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبتة تثبيتًا دائمًا أبدًا بواسطة `--force`.
- يفشل `update <skill>` سريعًا مع Skills المثبتة تثبيتًا دائمًا ويطلب منك تشغيل `clawhub unpin <skill>` أولًا.
- يتخطى `update --all` slugs المثبتة تثبيتًا دائمًا ويطبع ملخصًا لما بقي مجمدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- تبدأ Skills الجديدة افتراضيًا من `1.0.0`؛ وتبدأ Skills المتغيرة افتراضيًا من إصدار التصحيح التالي.
- يحدد `--version <version>` إصدارًا صراحة وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` عملية النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يملك الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب صلاحية مسؤول/مالك لدى كلا الناشرين.
- يُشرح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر مهارة يعني أنها تصدر تحت `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل مهارة.
- اسم بديل قديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام في ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` من أجل `skill_path` واحد، أو لكل مجلد مهارة مباشر
تحت `root` (الافتراضي: `skills`). يتخطى Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

اضبط `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الفعلية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المهيأ، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات Skills محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub وينشر فقط Skills الجديدة أو
  المتغيرة.
- تُنشر Skills الجديدة كـ `1.0.0`؛ وتُنشر Skills المتغيرة بإصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدفعات التحديث التي ينبغي أن تنتقل
  بخطوة semver أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو متغيرة دون مطالبة. دون
  `--all`، تتيح لك الطرفيات التفاعلية اختيار Skills المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يملك الفاعل صلاحية الناشر.
- `sync` نشر أحادي الاتجاه فقط. لا يثبّت ولا يحدّث ولا ينزّل ولا
  يبلّغ عن قياسات التثبيت/التنزيل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى تصبح نتيجة الفحص نهائية.
- الفحوص غير متزامنة وقد تستغرق وقتًا للإكمال. أثناء الانتظار في الطابور، يعرض مؤشر الطرفية الدوّار موضع الفحص الحالي ذي الأولوية وعدد الفحوص التي تسبقه.
- تتطلب الفحوص المنشورة صلاحية ملكية أو إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الخلفية نفسها عبر `clawhub-admin`.
- يكون `--update` صالحًا فقط مع `--slug`؛ إذ يكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوص المسارات المحلية مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزنة لذلك الإصدار المرسل.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ملف ZIP لتقرير الفحص المخزن لإصدار مهارة أو Plugin مرسل، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوص أمان ClawHub.
- تستخدم تنزيلات Skills slug المهارة وتكون افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب حتى يفحص المؤلفون الإصدار المرسل الدقيق الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفر ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/skill-publish.yml)
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

- يكون `root` افتراضيًا `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد مهارة واحد.
- يطابق `owner` علامة CLI `--owner`؛ احذفه للنشر بصفتك المستخدم المصادق عليه.
- يستخدم نشر Skills V1 الرمز `clawhub_token`؛ أما النشر الموثوق به عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز المعرّف المختصر لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يحذف `--version <version>` إصدارًا واحدًا مملوكًا غير أحدث إصدار حذفًا نهائيًا عبر مسار خاص بالإصدار
  يفشل بالإغلاق الآمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. لا يتجاوز موظفو المنصة الملكية في هذا المسار الخاص بالإصدار فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- ألغِ إخفاء مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف المختصر السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف عرض المعرّف المختصر للمصدر علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يملك الفاعل
  صلاحية مسؤول لدى كل من المالك الحالي والناشر الوجهة.
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

- يتصفح كتالوج الحزم الموحد أو يبحث فيه عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للمكوّنات الإضافية ومدخلات عائلات الحزم الأخرى؛ يظل `search` على المستوى الأعلى سطح البحث عن المهارات.
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

- يجلب بيانات تعريف الحزمة دون تثبيتها.
- استخدم هذا لبيانات تعريف المكوّن الإضافي والتوافق والتحقق والمصدر وفحص الإصدار/الملف.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى لعدد الإصدارات المراد سردها (1-100).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى ملف خامًا (الملفات النصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من ClawHub SHA-256 لكل الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`
  وnpm shasum واسم/إصدار `package.json` في ملف tarball.
- تُنزّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
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

- يحسب ClawHub SHA-256 وسلامة npm `sha512` وnpm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع علامات الملخص المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
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

- يشغل مفتش Plugin المضمّن في ClawHub CLI مقابل مجلد حزمة مكوّن إضافي محلي.
- يكون الافتراضي هو التحقق دون اتصال/الثابت، دون تحديد موقع نسخة OpenClaw محلية
  أو استيرادها.
- أخطاء التوافق الصارمة تخرج برمز غير صفري. تُطبع النتائج التحذيرية فقط لكنها
  تخرج بصفر.
- العلامات:
  - `--out <dir>`: اكتب تقارير مفتش Plugin إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل الالتقاط وقت التشغيل؛ يستورد كود المكوّن الإضافي.
  - `--allow-execute`: اسمح بالالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK المقلّد أثناء الالتقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة تخص الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/ar/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وكل إصداراتها حذفًا مبدئيًا.
- يحذف `--version <version>` إصدارًا واحدًا مملوكًا غير أحدث إصدار حذفًا نهائيًا عبر مسار خاص بالإصدار
  يفشل بالإغلاق الآمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. يتطلب هذا المسار الخاص بالإصدار فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- العلامات:
  - `--version <version>`: احذف إصدارًا واحدًا غير أحدث إصدار حذفًا نهائيًا.
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصداراتها المحذوفة حذفًا مبدئيًا.
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
- يتطلب صلاحية مسؤول لدى كل من مالك الحزمة الحالي والناشر الوجهة،
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

- أمر مصادق عليه للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
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

- أمر للمالك للتحقق من رؤية الإشراف على الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي على
  أحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وملخص الأثر،
  ومصدرية المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغل لحزمة قد تستبدل مكوّن OpenClaw إضافيًا
  مضمّنًا.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة يملكه المستخدم المصادق عليه.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- لا يكون ناشرو المؤسسات المنشؤون حديثًا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل بواسطة ناشر أو مستخدم أو مسار محجوز موجود.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>` ما يلي:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي من ClawPack بصيغة npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL من GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack المطابقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق والتعبئة المسبقة للبيانات
  الوصفية.
- تُحزم مجلدات Plugins البرمجية في أرشيف tarball من ClawPack بصيغة npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugins الحزمة فما زالت
  تستخدم مسار النشر للملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع والالتزام المحلول والمرجع والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير remote الأصلي إلى GitHub.
- يجب أن تعلن Plugins البرمجية الخارجية عن `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كاحتياطي للتحقق من النشر.
- يعاين `--dry-run` حمولة النشر المحلولة دون رفعها.
- يصدر `--json` مخرجات قابلة للقراءة آليًا من أجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر لمستخدم أو مؤسسة عندما يكون لدى الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- ما زالت الأعلام الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة
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

#### ملف `package.json` أدنى لـ `--family code-plugin`

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

- `package.json.version` هو إصدار حزمة النشر الخاصة بك، لكنه لا يُستخدم
  كاحتياطي للتحقق من توافق OpenClaw أو بنائه.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI الخاص بـ `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الرفع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات تحقق Plugin](/ar/clawhub/plugin-validation-fixes).

#### GitHub Actions

يوفر ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام على
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8f98128aab28627477a3858081a13b76cba6f5d6/.github/workflows/package-publish.yml)
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

- يضبط سير العمل القابل لإعادة الاستخدام `source` افتراضيًا على مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرر `source_path` حتى ينشر سير العمل مجلد
  حزمة Plugin، مثلًا `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغل نشر الإصدارات من `@main`.
- ينبغي أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب أن تقتصر عمليات النشر الحقيقية على الأحداث الموثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق من دون سر إلا على `workflow_dispatch`؛ أما دفعات الوسوم فما زالت تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا لأول نشر، أو للحزم غير الموثوقة، أو لعمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعدادات الناشر الموثوق في GitHub Actions لحزمة.
- استخدم هذا بعد ضبط الإعدادات لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الخيارات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعدادات الناشر الموثوق في GitHub Actions لحزمة موجودة.
- يجب إنشاء الحزمة أولًا عبر النشر اليدوي العادي أو النشر المصادق عليه برمز
  `clawhub package publish`.
- بعد ضبط الإعدادات، يمكن لعمليات نشر GitHub Actions المدعومة مستقبلًا استخدام
  OIDC/النشر الموثوق من دون رمز ClawHub طويل الأمد.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند ضبطه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تمامًا.
- يتحقق ClawHub من مستودع GitHub المضبوط عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يمتلك ClawHub وصول GitHub إلى ذلك المستودع، مثلًا عبر
  تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل GitHub مفوض آخر.
- الخيارات:
  - `--repository <repo>`: مستودع GitHub، مثل `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، مثل `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بمطابقة دقيقة.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- يزيل إعدادات الناشر الموثوق من حزمة.
- استخدم هذا كتراجع إذا احتاج تثبيت سير العمل أو المستودع أو البيئة إلى
  التعطيل أو إعادة الإنشاء.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق عليه العادي حتى
  تُضبط الإعدادات مرة أخرى.
- الخيارات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت عن بُعد

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يكن
  `CLAWHUB_DISABLE_TELEMETRY=1` مضبوطًا.
- الإبلاغ يبذل أفضل جهد ممكن. لا تفشل أوامر التثبيت إذا كانت القياسات عن بُعد
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

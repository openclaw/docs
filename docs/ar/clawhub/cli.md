---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والخيارات، والتكوين، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-07-02T17:37:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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

## الأعلام العمومية

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ ويعود إلى مساحة عمل Clawdbot إذا كانت مضبوطة)
- `--dir <dir>`: دليل التثبيت داخل دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

مكافئات البيئة:

- `CLAWHUB_SITE` (القديم `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (القديم `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (القديم `CLAWDHUB_WORKDIR`)

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

هذا مطلوب في الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو خوادم Hetzner VPS ذات الإنترنت عبر الوكيل فقط، أو
جدران حماية الشركات).

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
- مسار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويُكمل عبر استدعاء رجوع loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى الإخراج القياسي.
- مفيد لتمرير رمز تسجيل دخول محلي عبر أنبوب إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف مهارة إلى إبرازاتك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الإخراج معرّف المهارة، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث مطابقات رمز المعرّف/الاسم الدقيقة قبل شعبية التنزيل. رمز معرّف مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب أولي صغير، وليست ضمانًا للتصدّر.
- إذا كان ينبغي أن تظهر مهارة ولكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال بدائل ترتيب التثبيت القديمة تعمل للتوافق.
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

- يحل أحدث إصدار للمالك والمهارة المحددين.
- ينزّل zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات استخدام بأفضل جهد أثناء تسجيل الدخول حتى يمكن
  إلغاء تنشيط أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم مهارة مثبتة بأنها مثبتة في ملف القفل.
- يسجّل `--reason <text>` سبب تجميد المهارة.
- يتجاوز `update --all` Skills المثبتة، ويرفضها `update <skill>` المباشر.
- ترفض Skills المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية بالخطأ.

### `unpin <skill>`

- يزيل تثبيت ملف القفل من مهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا تظهر مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو بمطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبتة أبدًا بواسطة `--force`.
- يفشل `update <skill>` بسرعة مع Skills المثبتة ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتجاوز `update --all` المعرّفات المثبتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub وينهي بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- يكون الافتراضي للـ Skills الجديدة هو `1.0.0`؛ ويكون الافتراضي للـ Skills المتغيرة هو إصدار التصحيح
  التالي.
- يحدد `--version <version>` إصدارًا صراحة وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` عملية النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما يكون
  للفاعل حق وصول الناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب وصول مسؤول/مالك لدى كلا الناشرين.
- سلوك المالك والمراجعة موضح في `docs/publishing.md`.
- يعني نشر مهارة أنها صدرت بموجب `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون نسبة.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل مهارة.
- بديل قديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام في ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` لمسار `skill_path` واحد، أو لكل مجلد مهارة مباشر
تحت `root` (الافتراضي: `skills`). ويتجاوز Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

اضبط `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الحقيقية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المضبوط، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات Skills محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل مهارة محلية مع ClawHub وينشر فقط Skills الجديدة أو
  المتغيرة.
- تُنشر Skills الجديدة كـ `1.0.0`؛ وتُنشر Skills المتغيرة بإصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدُفعات التحديث التي يجب أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل مهارة جديدة أو متغيرة دون مطالبة. وبدون
  `--all`، تتيح لك الطرفيات التفاعلية اختيار Skills المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما يكون
  للفاعل حق وصول الناشر.
- `sync` هو نشر باتجاه واحد فقط. لا يثبّت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات التثبيت/التنزيل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع إلى أن يصبح الفحص نهائيًا.
- الفحوصات غير متزامنة وقد تستغرق وقتًا لتكتمل. أثناء الانتظار في الطابور، يعرض مؤشر الطرفية الدوّار موضع الفحص الحالي حسب الأولوية وعدد الفحوصات التي تسبقه.
- تتطلب الفحوصات المنشورة ملكية أو وصول إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الواجهة الخلفية نفسها عبر `clawhub-admin`.
- يكون `--update` صالحًا فقط مع `--slug`؛ ويكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوصات المسار المحلي مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزنة لذلك الإصدار المرسَل.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ZIP تقرير الفحص المخزّن لإصدار مهارة أو Plugin مرسَل، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوصات أمان ClawHub.
- تستخدم تنزيلات Skills معرّف المهارة وتفترض `--kind skill` افتراضيًا.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب حتى يفحص المؤلفون الإصدار المرسَل الدقيق الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفر ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
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
- يطابق `owner` علم CLI `--owner`؛ احذفه للنشر بوصفك المستخدم المصادق عليه.
- يستخدم نشر Skills في V1 الرمز `clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المدير).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- تحجز عمليات الحذف المبدئي التي يبدأها المالك المعرّف النصي لمدة 30 يومًا؛ ويطبع الأمر وقت انتهاء الصلاحية.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا وغير أحدث إصدار عبر مسار خاص بالإصدار
  ويفشل بإغلاق آمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. لا يتجاوز موظفو المنصة الملكية في هذا التدفق الخاص بالإصدارات فقط.
- يسجل `--reason <text>` ملاحظة إشراف عند حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المدير).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المدير).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- أظهر مهارة (المالك أو المشرف أو المدير).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف النصي السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف إدراج معرّف المصدر علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تطبق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يملك الفاعل
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و `GET /api/v1/packages/search`.
- استخدم هذا لـ plugins ومدخلات عائلات الحزم الأخرى؛ يظل `search` في المستوى الأعلى سطح البحث في المهارات.
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
- استخدم هذا لبيانات plugin الوصفية، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملف.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد الملفات للإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من SHA-256 الخاص بـ ClawHub لجميع الآثار.
- بالنسبة إلى آثار ClawPack من نوع npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  و npm shasum، واسم/إصدار `package.json` في ملف tarball.
- تُنزل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- العلامات:
  - `--version <version>`: نزّل إصدارًا محددًا.
  - `--tag <tag>`: نزّل إصدارًا موسومًا (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: اكتب فوق ملف إخراج موجود.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- يحسب SHA-256 الخاص بـ ClawHub، وسلامة npm `sha512`، و npm shasum لأثر محلي.
- مع `--package`، يحل البيانات الوصفية المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات الأثر المنشور الوصفية.
- مع علامات البصمة المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
  - `--package <name>`: اسم الحزمة لحل بيانات الأثر الوصفية المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: SHA-256 المتوقع من ClawHub.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغّل Plugin Inspector المضمن في ClawHub CLI على مجلد حزمة plugin محلية.
- يعتمد افتراضيًا على التحقق دون اتصال/الثابت، دون تحديد موقع نسخة OpenClaw محلية
  أو استيرادها.
- تؤدي أخطاء التوافق الجسيمة إلى الخروج بقيمة غير صفرية. تُطبع النتائج التحذيرية فقط لكن
  تنتهي بقيمة صفرية.
- العلامات:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل SDK OpenClaw الوهمية أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة في الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وجميع إصداراتها حذفًا مبدئيًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا وغير أحدث إصدار عبر مسار خاص بالإصدار
  ويفشل بإغلاق آمن.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. يتطلب هذا التدفق الخاص بالإصدارات فقط مالك الحزمة أو مدير ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب حذف الحزمة الكاملة حذفًا مبدئيًا مالك الحزمة، أو مالك/مدير ناشر مؤسسة، أو
  مشرف المنصة، أو مدير المنصة.
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

- يستعيد حزمة وإصداراتها المحذوفة حذفًا مبدئيًا.
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يتطلب مالك الحزمة، أو مالك/مدير ناشر مؤسسة، أو مشرف المنصة،
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
  إلا إذا نفذه مدير منصة.
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
- لا تخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بذاتها.
- العلامات:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من رؤية إشراف الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  على أحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw المستقبلي.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق للحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدر الأصل، وتوافق OpenClaw، وأهداف المضيف، وبيانات البيئة الوصفية،
  وحالة الفحص.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغلين لحزمة قد تستبدل
  plugin مدمجًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة مركزة على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
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

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف ClawPack npm-pack tarball محلي: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` باعتبارها ClawPack. يرفع CLI بايتات npm-pack
  الدقيقة ويستخدم محتويات `package/` المستخرجة فقط للتحقق و
  الملء المسبق للبيانات الوصفية.
- تُحزَم مجلدات Plugin البرمجية في أرشيف ClawPack npm tarball قبل الرفع لكي
  تتمكن عمليات تثبيت OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugin الحزمة فما زالت
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، يُملأ إسناد المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، يُكتشف إسناد المصدر تلقائيًا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب أن تعلن Plugins البرمجية الخارجية عن `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` عالي المستوى كخيار احتياطي للتحقق من النشر.
- يعاين `--dry-run` حمولة النشر المحلولة من دون رفع.
- يخرج `--json` مخرجات قابلة للقراءة آليًا لـ CI.
- ينشر `--owner <handle>` تحت معرّف ناشر لمستخدم أو مؤسسة عندما يمتلك الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- ما زالت الأعلام الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة و
إسناد المصدر قبل إنشاء إصدار حي:

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

#### `package.json` أدنى لـ `--family code-plugin`

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

- `package.json.version` هو إصدار حزمة النشر لديك، لكنه لا يُستخدم
  كخيار احتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها ليست مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI الخاص بـ `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يشحن ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
لمستودعات Plugins.

إعداد المستدعي المعتاد:

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
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` لكي ينشر سير العمل مجلد حزمة
  Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوِّث.
- يجب حصر عمليات النشر الحقيقية في أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق بدون سر إلا على `workflow_dispatch`؛ ولا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول، أو الحزم غير الموثوقة، أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد الناشر الموثوق في GitHub Actions لحزمة.
- استخدم هذا بعد ضبط الإعداد للتأكد من المستودع، واسم ملف سير العمل،
  وتثبيت البيئة الاختياري.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد الناشر الموثوق في GitHub Actions لحزمة موجودة.
- يجب إنشاء الحزمة أولًا عبر `clawhub package publish` العادي اليدوي أو
  المصادق عليه برمز.
- بعد ضبط الإعداد، يمكن لعمليات النشر المستقبلية المدعومة من GitHub Actions استخدام
  النشر عبر OIDC/النشر الموثوق بدون رمز ClawHub طويل الأجل.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند ضبطه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تمامًا.
- يتحقق ClawHub من مستودع GitHub المضبوط عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. أما المستودعات الخاصة
  فتتطلب أن يمتلك ClawHub وصولًا إلى مستودع GitHub ذلك، على
  سبيل المثال عبر تثبيت GitHub App مستقبلي لـ ClawHub أو تكامل GitHub آخر
  مخوّل.
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
- استخدم هذا كرجوع إذا احتاج سير العمل أو المستودع أو تثبيت البيئة إلى
  التعطيل أو إعادة الإنشاء.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق عليه العادي إلى أن
  يُضبط الإعداد مجددًا.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت عن بُعد

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يكن
  `CLAWHUB_DISABLE_TELEMETRY=1` مضبوطًا.
- الإبلاغ مبني على أفضل جهد. لا تفشل أوامر التثبيت إذا كانت بيانات القياس عن بُعد
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

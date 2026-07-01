---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والأعلام، والإعدادات، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-07-01T05:40:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4467e589a4892d513e4ca715b73a81147abb59cb7706b0068a11af6c95ea08f9
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

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ ويعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت داخل workdir (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للواجهة البرمجية API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

المكافئات في البيئة:

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
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، ويُستخدم `HTTP_PROXY`
لـ HTTP العادي. ويتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب في الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS مع إنترنت عبر الوكيل فقط، أو جدران حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزّن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويُكمل عبر استدعاء local loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: `clawhub login --device` يطبع رمزًا وينتظر أثناء تفويضه في `<site>/cli/device`.

### `whoami`

- يتحقّق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي عبر أنبوب إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف skill إلى إبرازاتك أو يزيله منها.
- يستدعي `POST /api/v1/stars/<slug>` و `DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الخرج slug الخاص بـ skill، ومقبض المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث مطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب صغير مسبق، وليست ضمانًا للتصدر.
- إذا كان ينبغي أن يظهر skill لكنه لا يظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يعرض أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال أسماء الفرز البديلة القديمة للتثبيت تعمل للتوافق.
  - `--json` (خرج قابل للقراءة آليًا)
- الخرج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات skill الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: يفحص إصدارًا محددًا (الافتراضي: latest).
- `--tag <tag>`: يفحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: يسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المطلوب سردها (1-200).
- `--files`: يسرد ملفات الإصدار المحدد.
- `--file <path>`: يجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: خرج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك وskill المحددين.
- ينزّل zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة بدبوس؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسًا عن بُعد بأفضل جهد أثناء تسجيل الدخول كي يمكن
  تعطيل أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجوار Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم skill المثبت بأنه مثبت بدبوس في ملف القفل.
- يسجل `--reason <text>` سبب تجميد skill.
- يتم تخطي Skills المثبتة بدبوس بواسطة `update --all` وترفضها `update <skill>` المباشرة.
- ترفض Skills المثبتة بدبوس أيضًا `install --force` كي لا تُستبدل البايتات المحلية بالخطأ.

### `unpin <skill>`

- يزيل دبوس ملف القفل من skill مثبت كي يمكن للتحديثات المستقبلية تعديله.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبتة بدبوس أبدًا بواسطة `--force`.
- يفشل `update <skill>` بسرعة مع Skills المثبتة بدبوس ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتخطى `update --all` قيم slug المثبتة بدبوس ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- تعتمد Skills الجديدة افتراضيًا `1.0.0`؛ وتعتمد Skills المتغيرة افتراضيًا إصدار التصحيح التالي.
- يحدد `--version <version>` إصدارًا صراحة وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يكون لدى الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` skill موجودًا إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب وصول مسؤول/مالك لدى كلا الناشرين.
- يتم شرح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر skill يعني أنه يُصدر تحت `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون نسبة.
- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل skill.
- الاسم البديل القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

سير العمل القابل لإعادة الاستخدام من ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
يستدعي `skill publish` من أجل `skill_path` واحد، أو لكل مجلد skill مباشر
تحت `root` (الافتراضي: `skills`). يتخطى Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

عيّن `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الفعلية
سر `clawhub_token`.

### `sync`

- يفحص workdir الحالي، ودليل Skills المهيأ، وأي مجلدات
  `--root <dir>` بحثًا عن مجلدات skill محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل skill محلي مع ClawHub وينشر Skills الجديدة أو
  المتغيرة فقط.
- تنشر Skills الجديدة كـ `1.0.0`؛ وتنشر Skills المتغيرة إصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدفعات التحديث التي ينبغي أن تنتقل
  بخطوة semver أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل skill جديد أو متغير دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية تحديد Skills المراد نشرها.
- ينشر `--owner <handle>` تحت مقبض ناشر مؤسسة/مستخدم عندما
  يكون لدى الفاعل صلاحية الناشر.
- `sync` هو نشر باتجاه واحد فقط. لا يثبّت ولا يحدّث ولا ينزّل ولا
  يبلّغ عن قياسات تثبيت/تنزيل عن بُعد.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوصات غير متزامنة وقد تستغرق وقتًا للاكتمال. أثناء الانتظار في الطابور، يعرض دوّار الطرفية موضع الفحص الحالي ذي الأولوية وعدد الفحوصات التي تسبقه.
- تتطلب الفحوصات المنشورة ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الخلفية نفسها عبر `clawhub-admin`.
- `--update` صالح فقط مع `--slug`؛ ويكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
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
- ينزّل ZIP تقرير الفحص المخزّن لإصدار skill أو Plugin مقدّم، بما في ذلك الإصدارات التي حظرتها أو أخفتها فحوصات أمان ClawHub.
- تستخدم تنزيلات skill قيمة slug الخاصة بـ skill وتفترض `--kind skill` افتراضيًا.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب كي يفحص المؤلفون الإصدار المقدّم بالضبط الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يشحن ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/skill-publish.yml)
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

- يفترض `root` القيمة `skills` افتراضيًا لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد skill واحد.
- يطابق `owner` علم CLI `--owner`؛ احذفه للنشر باسم المستخدم المصادق عليه.
- يستخدم نشر Skills في V1 `clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط في الوقت الحالي.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز المعرّف لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا ليس الأحدث عبر مسار يفشل مغلقًا
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو نشرها مجددًا. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. لا يتجاوز موظفو المنصة الملكية في هذا التدفق الخاص بالإصدارات فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف مبدئي كامل للمهارة وفي سجل التدقيق.
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

- أظهر مهارة مخفية (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف السابق كاسم بديل لإعادة التوجيه.
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
- تنطبق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون لدى الفاعل
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و `GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` ذو المستوى الأعلى سطح البحث عن المهارات.
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
- استخدم هذا لبيانات تعريف Plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملف.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثلًا `latest`).
- `--versions`: اعرض سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد عرضها (1-100).
- `--files`: اعرض ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من ClawHub SHA-256 لكل الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من تكامل npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` الخاص بملف tarball.
- يتم تنزيل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- الأعلام:
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

- يحسب ClawHub SHA-256، وتكامل npm `sha512`، وnpm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع أعلام البصمة المباشرة، يتحقق دون بحث شبكي.
- الأعلام:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: ClawHub SHA-256 المتوقع.
  - `--npm-integrity <sri>`: تكامل npm المتوقع.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغّل Plugin Inspector المضمّن في ClawHub CLI على مجلد حزمة Plugin محلية.
- يكون الافتراض هو التحقق غير المتصل/الثابت، دون تحديد موضع نسخة OpenClaw محلية
  أو استيرادها.
- أخطاء التوافق الصارمة تخرج برمز غير صفري. تُطبع النتائج التحذيرية فقط ولكن
  تخرج برمز صفري.
- الأعلام:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود Plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK المحاكى أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة تتعلق بحزمة أو بيان أو استيراد SDK أو أثر، فراجع
[إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وكل الإصدارات حذفًا مبدئيًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا ليس الأحدث عبر مسار يفشل مغلقًا
  ومخصص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو نشرها مجددًا. انشر بديلًا قبل حذف
  الإصدار الأحدث الحالي. يتطلب هذا التدفق الخاص بالإصدارات فقط مالك الحزمة أو مسؤول
  ناشر مؤسسة؛ لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- الأعلام:
  - `--version <version>`: احذف نهائيًا إصدارًا واحدًا ليس الأحدث.
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
- يجب أن تنتقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
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
- تكون البلاغات على مستوى الحزمة، وترتبط اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا أو تمنع التنزيلات بحد ذاتها.
- الأعلام:
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
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw في المستقبل.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدر المنشأ، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغلين لحزمة قد تستبدل
  OpenClaw plugin مضمّنًا.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة مركزة على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة يملكه المستخدم الموثق.
- تتم تسوية المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- ناشرو المؤسسات المنشؤون حديثًا ليسوا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل بواسطة ناشر موجود، أو مستخدم، أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>` ما يلي:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي بصيغة ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL في GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة للتحقق وملء البيانات الوصفية مسبقًا فقط.
- تُحزم مجلدات Plugin البرمجي في أرشيف tarball بصيغة ClawPack npm قبل الرفع كي
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugin الحزمة
  فتظل تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع والالتزام المحلول وref والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب أن تصرح Plugins البرمجية الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كمسار احتياطي للتحقق عند النشر.
- يعرض `--dry-run` معاينة لحمولة النشر المحلولة دون رفعها.
- يصدر `--json` خرجًا قابلاً للقراءة آليًا من أجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر لمستخدم أو مؤسسة عندما يملك الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- تظل الأعلام الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا كي تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة
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

#### حد أدنى من `package.json` لـ `--family code-plugin`

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
  كمسار احتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها ليست مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا عن التوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر كي
  تعمل فحوصات التمهيد المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات التحقق من Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يوفر ClawHub أيضًا سير عمل رسميًا قابلاً لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/80b06a911afb312a43d3f39ba62d92eb35d772a9/.github/workflows/package-publish.yml)
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

- يضبط سير العمل القابل لإعادة الاستخدام القيمة الافتراضية لـ `source` على مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرر `source_path` كي ينشر سير العمل مجلد حزمة
  Plugin، مثلًا `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA كامل لالتزام. لا تشغل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير مُلوِّث.
- يجب أن تقتصر عمليات النشر الحقيقية على أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- النشر الموثوق دون سر لا يعمل إلا على `workflow_dispatch`؛ ولا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا لأول نشر، أو للحزم غير الموثوقة، أو لعمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد الناشر الموثوق في GitHub Actions لحزمة.
- استخدم هذا بعد ضبط الإعداد لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الأعلام:
  - `--json`: خرج قابل للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد الناشر الموثوق في GitHub Actions لحزمة موجودة.
- يجب إنشاء الحزمة أولًا عبر `clawhub package publish` العادي اليدوي أو
  الموثق برمز.
- بعد ضبط الإعداد، يمكن لعمليات النشر المستقبلية المدعومة عبر GitHub Actions استخدام
  OIDC/النشر الموثوق دون رمز ClawHub طويل الأمد.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تكوينه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تمامًا.
- يتحقق ClawHub من مستودع GitHub المكوَّن عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. أما
  المستودعات الخاصة فتتطلب أن يملك ClawHub وصول GitHub إلى ذلك المستودع، على
  سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل GitHub مخول آخر.
- الأعلام:
  - `--repository <repo>`: مستودع GitHub، مثل `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، مثل `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بمطابقة تامة.
  - `--json`: خرج قابل للقراءة آليًا.

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
  تعطيله أو إعادة إنشائه.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر الموثق العادي إلى أن يُضبط الإعداد
  مرة أخرى.
- الأعلام:
  - `--json`: خرج قابل للقراءة آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياس استخدام التثبيت

- يُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم تكن
  `CLAWHUB_DISABLE_TELEMETRY=1` مضبوطة.
- الإبلاغ مبذول بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت قياسات الاستخدام
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

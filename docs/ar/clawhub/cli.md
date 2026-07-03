---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والرايات، والإعدادات، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-07-03T17:24:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23065775d74e7b52ed250051b8724b780c28dfdfc0adf9b8f115f7133fbdd77b
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

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مضبوطة)
- `--dir <dir>`: دليل التثبيت ضمن دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

مكافئات البيئة:

- `CLAWHUB_SITE` (القديم `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (القديم `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (القديم `CLAWDHUB_WORKDIR`)

### وكيل HTTP

تحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء الشركات أو الشبكات المقيّدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند ضبط أي من هذه المتغيرات، توجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لـ HTTP العادي. ويتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل لـ
مضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS بإنترنت عبر وكيل فقط، أو جدران
حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم ضبط أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف الضبط

يخزّن رمز API الخاص بك + عنوان URL المخبأ للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسار رجوع قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد لكن `clawdhub/config.json` موجود، تعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكمل عبر استدعاء loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه عند `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي عبر أنبوب إلى أوامر إعداد أسرار CI.

### `star <skill>` / `unstar <skill>`

- يضيف Skills أو يزيلها من تمييزاتك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الخرج slug الخاص بالـ Skills، ومعرّف المالك، واسم العرض، ودرجة الصلة.
- يعطي البحث أفضلية لمطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب أولي صغير، وليست ضمانًا للظهور في أعلى النتائج.
- إذا كان ينبغي أن تظهر Skills لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). لا تزال أسماء sort المستعارة القديمة للتثبيت تعمل للتوافق.
  - `--json` (خرج قابل للقراءة آليًا)
- الخرج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات Skills الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى لعدد الإصدارات المراد سردها (1-200).
- `--files`: سرد ملفات الإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: خرج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك والـ Skills المحددين.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات استخدام بأفضل جهد أثناء تسجيل الدخول كي يمكن
  إلغاء تنشيط أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم Skills مثبتة على أنها مثبتة في ملف القفل.
- يسجل `--reason <text>` سبب تجميد Skills.
- تتجاوز `update --all` Skills المثبتة، وترفضها `update <skill>` المباشرة.
- ترفض Skills المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <skill>`

- يزيل تثبيت ملف القفل من Skills مثبتة بحيث يمكن للتحديثات المستقبلية تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبتة أبدًا بواسطة `--force`.
- يفشل `update <skill>` سريعًا لـ Skills المثبتة ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتجاوز `update --all` قيم slug المثبتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- تعتمد Skills الجديدة افتراضيًا `1.0.0`؛ وتعتمد Skills التي تغيرت افتراضيًا إصدار التصحيح التالي.
- يحدد `--version <version>` إصدارًا صراحة وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما
  يكون للفاعل صلاحية الناشر.
- ينقل `--migrate-owner` Skills موجودة إلى `--owner` أثناء نشر إصدار جديد. يتطلب وصول admin/owner لدى كلا الناشرين.
- يشرح `docs/publishing.md` سلوك المالك والمراجعة.
- يعني نشر Skills أنها صادرة تحت `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل Skills.
- الاسم المستعار القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام في ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` لـ `skill_path` واحد، أو لكل مجلد Skills مباشر
تحت `root` (الافتراضي: `skills`). يتجاوز Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

اضبط `dry_run: true` للمعاينة دون رمز. تتطلب عمليات النشر الحقيقية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المضبوط، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات Skills محلية تحتوي `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل Skills محلية مع ClawHub وينشر Skills الجديدة أو
  المتغيرة فقط.
- تنشر Skills الجديدة كـ `1.0.0`؛ وتنشر Skills المتغيرة إصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدفعات التحديث التي ينبغي أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل Skills جديدة أو متغيرة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية اختيار Skills المراد نشرها.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما
  يكون للفاعل صلاحية الناشر.
- `sync` نشر باتجاه واحد فقط. لا يثبّت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات استخدام التثبيت/التنزيل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوصات غير متزامنة وقد تستغرق وقتًا للإكمال. أثناء الانتظار في الطابور، يعرض مؤشّر الطرفية موضع الفحص الحالي ذي الأولوية وعدد الفحوصات التي تسبقه.
- تتطلب الفحوصات المنشورة ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الواجهة الخلفية نفسها عبر `clawhub-admin`.
- يكون `--update` صالحًا فقط مع `--slug`؛ يكتب نتائج الفحص المنشور الناجحة مرة أخرى إلى الإصدار المحدد.
- ينزّل `--output <file.zip>` أرشيف التقرير الكامل مع `manifest.json` و`clawscan.json` و`skillspector.json` و`static-analysis.json` و`virustotal.json` و`README.md`.
- يطبع `--json` استجابة الاستطلاع الكاملة للأتمتة.
- لم تعد فحوصات المسار المحلي مدعومة. ارفع إصدارًا جديدًا، ثم استخدم `scan download` لاسترداد نتائج الفحص المخزّنة لذلك الإصدار المقدّم.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- يتطلب `clawhub login`.
- ينزّل ملف ZIP لتقرير الفحص المخزّن لإصدار Skills أو Plugin مقدّم، بما في ذلك الإصدارات التي حجبتها أو أخفتها فحوصات أمان ClawHub.
- تستخدم تنزيلات Skills قيمة slug الخاصة بالـ Skills وتكون افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب كي يفحص المؤلفون الإصدار المقدّم بدقة الذي حظره ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يوفر ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام عند
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/skill-publish.yml)
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

- تكون `root` افتراضيًا `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد Skills واحد.
- يطابق `owner` علم CLI `--owner`؛ احذفه للنشر باسم المستخدم المصادق عليه.
- يستخدم نشر Skills في V1 ‏`clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف Skills حذفًا ناعمًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف الناعم التي يبدأها المالك تحجز المعرّف اللطيف لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار يفشل مغلقًا
  ومخصّص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو نشرها مجددًا. انشر بديلًا قبل حذف
  أحدث إصدار حالي. لا يتجاوز موظفو المنصة الملكية في هذا التدفق الخاص بالإصدار فقط.
- يسجل `--reason <text>` ملاحظة إشراف عند الحذف الناعم الكامل للـ Skills وفي سجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد Skills مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف للإصدارات؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على Skills وفي سجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ Skills (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `delete`.

### `unhide <skill>`

- ألغِ إخفاء Skills (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية Skills مملوكة واحتفظ بالمعرّف اللطيف السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج Skills مملوكة واحدة في Skills مملوكة أخرى.
- يتوقف المعرّف اللطيف للمصدر عن الظهور علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبَّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون لدى المنفّذ
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

- يتصفح أو يبحث في كتالوج الحزم الموحّد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` على المستوى الأعلى سطح البحث في Skills.
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
- استخدم هذا لبيانات تعريف Plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: latest).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلّل.
- يتحقق من ClawHub SHA-256 لكل الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` في الأرشيف.
- تُنزَّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
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
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغّل Plugin Inspector المضمّن في ClawHub CLI على مجلد حزمة Plugin محلية.
- الوضع الافتراضي هو التحقق غير المتصل/الثابت، دون تحديد أو استيراد نسخة OpenClaw محلية.
- أخطاء التوافق الصارمة تخرج بقيمة غير صفرية. تُطبع النتائج التحذيرية فقط لكنها
  تخرج بقيمة صفرية.
- الأعلام:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود Plugin.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK الوهمي أثناء التقاط وقت التشغيل.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة في الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وكل الإصدارات حذفًا ناعمًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار يفشل مغلقًا
  ومخصّص للإصدار.
  لا يمكن استعادة الإصدارات المحذوفة أو نشرها مجددًا. انشر بديلًا قبل حذف
  أحدث إصدار حالي. يتطلب هذا التدفق الخاص بالإصدار فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف الناعم للحزمة بالكامل مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف المنصة، أو مسؤول المنصة.
- الأعلام:
  - `--version <version>`: احذف نهائيًا إصدارًا واحدًا غير أحدث إصدار.
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

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

- أمر موثّق للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- التقارير على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تُخفي التقارير الحزم تلقائيًا ولا تحظر التنزيلات بذاتها.
- الأعلام:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالتقرير.
  - `--reason <text>`: سبب التقرير المطلوب.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من رؤية الإشراف على الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد التقارير المفتوحة، وحالة الإشراف اليدوي
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
- يبلّغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدر المنشأ، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغل لحزمة قد تستبدل
  Plugin مضمنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة مركّزة على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة مملوكًا للمستخدم الموثّق.
- يُطبَّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- ناشرو المؤسسات المنشؤون حديثًا ليسوا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر موجود أو مستخدم أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin كود أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>` ما يلي:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي بتنسيق ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق والملء المسبق للبيانات
  الوصفية.
- تُحزم مجلدات Plugin الكود في أرشيف ClawPack npm قبل الرفع حتى تتمكن
  تثبيتات OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugin الحزمة فما زالت
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع والالتزام المحلول والمرجع والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير جهاز origin البعيد إلى GitHub.
- يجب أن تصرّح Plugins الكود الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` على المستوى الأعلى كبديل احتياطي للتحقق عند النشر.
- يعاين `--dry-run` حمولة النشر المحلولة من دون رفعها.
- يُخرج `--json` ناتجًا مقروءًا آليًا لاستخدامه في CI.
- ينشر `--owner <handle>` تحت مقبض ناشر مستخدم أو مؤسسة عندما يملك الفاعل صلاحية النشر.
- يجب أن تتطابق أسماء الحزم ذات النطاق مع المالك المحدد. راجع `docs/publishing.md`.
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

بالنسبة إلى Plugins الكود، ينشئ نشر المجلد أثر ClawPack من
مجلد الحزمة ويرفعه:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### الحد الأدنى من `package.json` لـ `--family code-plugin`

تحتاج Plugins الكود الخارجية إلى قدر صغير من بيانات OpenClaw الوصفية في
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

- `package.json.version` هو إصدار نشر حزمتك، لكنه لا يُستخدم
  كبديل احتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا كنت تريد نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات تحقق Plugin](/clawhub/plugin-validation-fixes).

#### GitHub Actions

يوفر ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/76b4f36bb0f7409ed7cb9c6fd6f1ccf81396ee88/.github/workflows/package-publish.yml)
لمستودعات Plugin.

إعداد مستدعٍ نموذجي:

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
  مجلد حزمة Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوِّث.
- يجب أن تقتصر عمليات النشر الحقيقية على الأحداث الموثوقة مثل `workflow_dispatch` أو دفع الوسوم.
- لا يعمل النشر الموثوق من دون سر إلا على `workflow_dispatch`؛ ما زالت عمليات دفع الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول أو الحزم غير الموثوقة أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد ناشر GitHub Actions الموثوق لحزمة.
- استخدم هذا بعد تعيين الإعداد لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الأعلام:
  - `--json`: ناتج مقروء آليًا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يربط أو يستبدل إعداد ناشر GitHub Actions الموثوق لحزمة موجودة.
- يجب إنشاء الحزمة أولًا من خلال `clawhub package publish` العادي اليدوي
  أو المصادق عليه برمز.
- بعد تعيين الإعداد، يمكن لعمليات نشر GitHub Actions المدعومة مستقبلًا استخدام
  OIDC/النشر الموثوق من دون رمز ClawHub طويل الأمد.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تكوينه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تمامًا.
- يتحقق ClawHub من مستودع GitHub المُكوّن عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يمتلك ClawHub وصولًا إلى مستودع GitHub ذاك، مثلًا
  عبر تثبيت GitHub App مستقبلي خاص بـ ClawHub أو تكامل GitHub مصرح آخر.
- الأعلام:
  - `--repository <repo>`: مستودع GitHub، مثل `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، مثل `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بمطابقة دقيقة.
  - `--json`: ناتج مقروء آليًا.

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
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق العادي حتى يُعيّن الإعداد مرة أخرى.
- الأعلام:
  - `--json`: ناتج مقروء آليًا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات تثبيت عن بُعد

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يتم تعيين
  `CLAWHUB_DISABLE_TELEMETRY=1`.
- الإبلاغ يتم بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت القياسات عن بُعد
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.
